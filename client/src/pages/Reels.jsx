import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, X, Plus, Minus, Wallet, Smartphone, MapPin, Volume2, VolumeX, Navigation } from 'lucide-react';
import axios from 'axios';
import { initiateRazorpayPayment } from '../components/RazorpayPayment';
import { getUserLocation } from '../utils/geolocation';
import { App as CapacitorApp } from '@capacitor/app';

export default function Reels() {
  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedReel, setSelectedReel] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    paymentMethod: 'upi'
  });
  const [showPayment, setShowPayment] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // CRUD operations state
  const [showReelModal, setShowReelModal] = useState(false);
  const [editingReel, setEditingReel] = useState(null);
  const [reelForm, setReelForm] = useState({
    dishName: '',
    price: '',
    videoUrl: '',
    restaurantId: ''
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Performance optimization states
  const [reelsCache, setReelsCache] = useState(new Map());
  const [preloadedVideos, setPreloadedVideos] = useState(new Set());
  const [error, setError] = useState(null);
  
  // Location-based filtering states
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [allReels, setAllReels] = useState([]);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const navigate = useNavigate();

  useEffect(() => {
    detectLocationAndFetchReels();
    fetchRestaurants();
    checkAdminStatus();
  }, []);

  // Filter reels when user location changes
  useEffect(() => {
    if (userLocation && allReels.length > 0) {
      filterReelsByLocation();
    }
  }, [userLocation, allReels]);

  const detectLocationAndFetchReels = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      
      // Try to get user location
      const location = await getUserLocation();
      setUserLocation(location);
      console.log('✅ User location detected:', location);
      
      // Save location data
      await saveLocationData(location.latitude, location.longitude);
      
      // Fetch all reels first
      await fetchAllReels();
      
    } catch (error) {
      console.log('❌ Location detection failed:', error);
      setLocationError(error.message);
      setShowLocationPrompt(true);
      
      // Still fetch reels but show all of them
      await fetchAllReels();
    } finally {
      setLocationLoading(false);
    }
  };

  const saveLocationData = async (latitude, longitude, address = null) => {
    try {
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData)._id : null;
      
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('sessionId', sessionId);
      }
      
      await axios.post('/api/locations/save', {
        latitude,
        longitude,
        address,
        userId,
        sessionId
      });
    } catch (error) {
      console.error('Error saving location data:', error);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const filterReelsByLocation = () => {
    if (!userLocation) {
      setReels(allReels);
      return;
    }

    const nearbyReels = allReels.filter(reel => {
      const restaurant = reel.restaurantId;
      
      // STRICT FILTERING: Only include restaurants with complete location setup
      if (!restaurant || !restaurant.latitude || !restaurant.longitude || !restaurant.deliveryRadiusKm) {
        console.log(`Excluding reel from ${restaurant?.name || 'unknown restaurant'} - missing location data`);
        return false; // Exclude restaurants without proper location setup
      }
      
      // Calculate distance between user and restaurant
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      
      // Include reel ONLY if user is within delivery radius
      const isWithinRange = distance <= restaurant.deliveryRadiusKm;
      
      if (!isWithinRange) {
        console.log(`Excluding reel from ${restaurant.name} - distance ${distance.toFixed(2)}km > radius ${restaurant.deliveryRadiusKm}km`);
      }
      
      return isWithinRange;
    });

    console.log(`STRICT LOCATION FILTERING: ${nearbyReels.length} out of ${allReels.length} reels are from nearby restaurants with proper location setup`);
    setReels(nearbyReels);
  };

  const analyzeRestaurantLocationData = (reels) => {
    const restaurantStats = {
      total: reels.length,
      withLocation: 0,
      withoutLocation: 0,
      restaurants: new Set()
    };

    reels.forEach(reel => {
      const restaurant = reel.restaurantId;
      if (restaurant) {
        restaurantStats.restaurants.add(restaurant._id);
        
        if (restaurant.latitude && restaurant.longitude && restaurant.deliveryRadiusKm) {
          restaurantStats.withLocation++;
        } else {
          restaurantStats.withoutLocation++;
          console.log(`⚠️ Restaurant "${restaurant.name}" missing location data:`, {
            hasLatitude: !!restaurant.latitude,
            hasLongitude: !!restaurant.longitude,
            hasDeliveryRadius: !!restaurant.deliveryRadiusKm,
            restaurant: restaurant
          });
        }
      }
    });

    console.log('📊 Restaurant Location Analysis:', {
      totalReels: restaurantStats.total,
      uniqueRestaurants: restaurantStats.restaurants.size,
      reelsWithLocation: restaurantStats.withLocation,
      reelsWithoutLocation: restaurantStats.withoutLocation,
      percentageWithLocation: ((restaurantStats.withLocation / restaurantStats.total) * 100).toFixed(1) + '%'
    });
  };

  const handleLocationPermission = async () => {
    try {
      setLocationLoading(true);
      setLocationError(null);
      setShowLocationPrompt(false);
      
      const location = await getUserLocation();
      setUserLocation(location);
      
      await saveLocationData(location.latitude, location.longitude);
      
    } catch (error) {
      console.error('Location permission denied:', error);
      setLocationError('Location access denied. Showing all reels.');
      setShowLocationPrompt(false);
      // Show all reels if location is denied
      setReels(allReels);
    } finally {
      setLocationLoading(false);
    }
  };

  // Handle Android back button
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', (data) => {
      // Always navigate to home, don't use default back behavior
      window.location.href = '/';
    });

    return () => {
      backButtonListener.remove();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let scrollTimeout;
    const handleScroll = () => {
      // Debounce scroll events for better performance
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollTop = container.scrollTop;
        const itemHeight = window.innerHeight;
        const newIndex = Math.round(scrollTop / itemHeight);
        
        if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
          // Pause and reset previous video
          const prevVideo = videoRefs.current[reels[currentIndex]?._id];
          if (prevVideo) {
            prevVideo.pause();
            prevVideo.currentTime = 0;
          }
          
          setCurrentIndex(newIndex);
          setIsPaused(false);
          
          const currentReel = reels[newIndex];
          if (currentReel) {
            // Increment view count (debounced)
            incrementView(currentReel._id);
            
            // Play new video
            const newVideo = videoRefs.current[currentReel._id];
            if (newVideo) {
              newVideo.currentTime = 0;
              newVideo.muted = isMuted;
              newVideo.play().catch(console.error);
            }
            
            // Preload next videos
            preloadAdjacentVideos(newIndex);
          }
        }
      }, 100); // 100ms debounce
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [currentIndex, reels, isMuted]);

  const preloadAdjacentVideos = (index) => {
    // Preload next 2 videos for smooth scrolling
    const videosToPreload = [index + 1, index + 2].filter(i => i < reels.length);
    
    videosToPreload.forEach(i => {
      const reel = reels[i];
      if (reel && reel.videoUrl && !preloadedVideos.has(reel._id)) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = reel.videoUrl;
        video.muted = true;
        
        video.addEventListener('loadedmetadata', () => {
          setPreloadedVideos(prev => new Set(prev.add(reel._id)));
        });
      }
    });
  };

  // Toggle play/pause on video click
  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[reels[currentIndex]?._id];
    if (currentVideo) {
      if (isPaused) {
        currentVideo.play();
        setIsPaused(false);
      } else {
        currentVideo.pause();
        setIsPaused(true);
      }
    }
  };

  const fetchAllReels = async (useCache = true) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check cache first
      const cacheKey = 'reels_all';
      const cachedData = reelsCache.get(cacheKey);
      const cacheTime = 5 * 60 * 1000; // 5 minutes
      
      if (useCache && cachedData && (Date.now() - cachedData.timestamp < cacheTime)) {
        setAllReels(cachedData.data);
        // If we have user location, filter immediately
        if (userLocation) {
          filterReelsByLocation();
        } else {
          setReels(cachedData.data);
        }
        setIsLoading(false);
        preloadVideos(cachedData.data);
        return;
      }
      
      // Fetch with optimized settings
      const { data } = await axios.get('/api/reels', {
        headers: {
          'Cache-Control': 'max-age=300',
          'Accept': 'application/json',
        },
        timeout: 15000,
        decompress: true
      });
      
      // Cache the response
      setReelsCache(prev => new Map(prev.set(cacheKey, {
        data,
        timestamp: Date.now()
      })));
      
      setAllReels(data);
      
      // Debug: Analyze restaurant location data
      analyzeRestaurantLocationData(data);
      
      // If we have user location, filter the reels
      if (userLocation) {
        filterReelsByLocation();
      } else {
        setReels(data);
      }
      
      preloadVideos(data);
      
    } catch (error) {
      console.error('Error fetching reels:', error);
      setError('Failed to load reels. Please try again.');
      setReels([]);
      setAllReels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const preloadVideos = (reelsData) => {
    // Preload first 3 videos for instant playback
    const videosToPreload = reelsData.slice(0, 3);
    
    videosToPreload.forEach((reel, index) => {
      if (reel.videoUrl && !reel.videoUrl.startsWith('data:') && !preloadedVideos.has(reel._id)) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.src = reel.videoUrl;
        video.muted = true;
        
        // Add to preloaded set when ready
        video.addEventListener('loadedmetadata', () => {
          setPreloadedVideos(prev => new Set(prev.add(reel._id)));
        });
        
        // Preload next video when current is playing
        if (index === 0) {
          video.addEventListener('canplaythrough', () => {
            // Start preloading next video
            setTimeout(() => {
              if (reelsData[1] && !preloadedVideos.has(reelsData[1]._id)) {
                const nextVideo = document.createElement('video');
                nextVideo.preload = 'auto';
                nextVideo.src = reelsData[1].videoUrl;
                nextVideo.muted = true;
              }
            }, 1000);
          });
        }
      }
    });
  };

  const fetchRestaurants = async (useCache = true) => {
    try {
      // Check cache first
      const cacheKey = 'restaurants_all';
      const cachedData = reelsCache.get(cacheKey);
      const cacheTime = 10 * 60 * 1000; // 10 minutes for restaurants
      
      if (useCache && cachedData && (Date.now() - cachedData.timestamp < cacheTime)) {
        setRestaurants(cachedData.data);
        return;
      }
      
      // Fetch with optimized settings
      const { data } = await axios.get('/api/restaurants', {
        headers: {
          'Cache-Control': 'max-age=600', // 10 minutes
          'Accept': 'application/json',
        },
        timeout: 10000
      });
      
      // Cache the response
      setReelsCache(prev => new Map(prev.set(cacheKey, {
        data,
        timestamp: Date.now()
      })));
      
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const checkAdminStatus = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setIsAdmin(user.role === 'restaurant' || user.isAdmin);
  };

  // Debounced view increment to avoid spam
  const viewIncrementCache = useRef(new Set());
  const incrementView = async (reelId) => {
    if (viewIncrementCache.current.has(reelId)) return;
    
    viewIncrementCache.current.add(reelId);
    
    try {
      await axios.patch(`/api/reels/${reelId}/view`);
      
      // Update local state optimistically
      setReels(prev => prev.map(r => 
        r._id === reelId ? { ...r, views: (r.views || 0) + 1 } : r
      ));
    } catch (error) {
      console.error('Error incrementing view:', error);
      viewIncrementCache.current.delete(reelId);
    }
  };

  const handleLike = async (reelId) => {
    // Optimistic update
    setReels(prev => prev.map(r => 
      r._id === reelId ? { ...r, likes: (r.likes || 0) + 1 } : r
    ));

    try {
      await axios.patch(`/api/reels/${reelId}/like`);
    } catch (error) {
      console.error('Error liking reel:', error);
      // Revert optimistic update on error
      setReels(prev => prev.map(r => 
        r._id === reelId ? { ...r, likes: Math.max(0, (r.likes || 1) - 1) } : r
      ));
    }
  };

  // CRUD Operations for Reels
  const openReelModal = (reel = null) => {
    if (reel) {
      setEditingReel(reel);
      setReelForm({
        dishName: reel.dishName || '',
        price: reel.price?.toString() || '',
        videoUrl: reel.videoUrl || '',
        restaurantId: reel.restaurantId?._id || reel.restaurantId || ''
      });
    } else {
      setEditingReel(null);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      setReelForm({
        dishName: '',
        price: '',
        videoUrl: '',
        restaurantId: user.restaurantId || ''
      });
    }
    setShowReelModal(true);
  };

  const closeReelModal = () => {
    setShowReelModal(false);
    setEditingReel(null);
    setIsSubmitting(false);
    setReelForm({
      dishName: '',
      price: '',
      videoUrl: '',
      restaurantId: ''
    });
  };

  const handleReelSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!reelForm.dishName.trim()) {
      alert('Please enter a dish name');
      return;
    }
    if (!reelForm.price || parseFloat(reelForm.price) <= 0) {
      alert('Please enter a valid price');
      return;
    }
    if (!reelForm.videoUrl.trim()) {
      alert('Please enter a video URL');
      return;
    }
    if (!reelForm.restaurantId) {
      alert('Please select a restaurant');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const reelData = {
        ...reelForm,
        price: parseFloat(reelForm.price),
        dishName: reelForm.dishName.trim(),
        videoUrl: reelForm.videoUrl.trim()
      };

      if (editingReel) {
        // Update existing reel
        const { data } = await axios.put(`/api/reels/${editingReel._id}`, reelData);
        
        // Update reels state with populated restaurant data
        const updatedReels = reels.map(r => {
          if (r._id === editingReel._id) {
            return {
              ...r,
              ...data,
              restaurantId: restaurants.find(rest => rest._id === data.restaurantId) || r.restaurantId
            };
          }
          return r;
        });
        
        setReels(updatedReels);
        
        // Clear cache to force refresh
        setReelsCache(new Map());
        
        alert('Reel updated successfully! 🎉');
      } else {
        // Create new reel
        const { data } = await axios.post('/api/reels', reelData);
        
        // Add restaurant data to new reel
        const newReelWithRestaurant = {
          ...data,
          restaurantId: restaurants.find(r => r._id === data.restaurantId)
        };
        
        setReels([newReelWithRestaurant, ...reels]);
        
        // Clear cache
        setReelsCache(new Map());
        
        alert('Reel created successfully! 🎉');
      }
      
      closeReelModal();
    } catch (error) {
      console.error('Error saving reel:', error);
      const errorMessage = error.response?.data?.error || 'Failed to save reel. Please try again.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReel = async (reelId) => {
    const reelToDelete = reels.find(r => r._id === reelId);
    if (!reelToDelete) return;

    const confirmMessage = `Are you sure you want to delete "${reelToDelete.dishName}"?\n\nThis action cannot be undone.`;
    
    if (window.confirm(confirmMessage)) {
      try {
        await axios.delete(`/api/reels/${reelId}`);
        
        // Remove from state
        setReels(reels.filter(r => r._id !== reelId));
        
        // Clear cache
        setReelsCache(new Map());
        
        // If we deleted the current reel, adjust index
        if (currentIndex >= reels.length - 1) {
          setCurrentIndex(Math.max(0, reels.length - 2));
        }
        
        alert('Reel deleted successfully! 🗑️');
      } catch (error) {
        console.error('Error deleting reel:', error);
        const errorMessage = error.response?.data?.error || 'Failed to delete reel. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const refreshReels = () => {
    setReelsCache(new Map());
    fetchAllReels(false);
  };

  const openOrderModal = (reel) => {
    setSelectedReel(reel);
    setQuantity(1);
    setShowOrderModal(true);
  };

  const closeOrderModal = () => {
    setShowOrderModal(false);
    setShowPayment(false);
    setSelectedReel(null);
    setQuantity(1);
    setOrderForm({
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      paymentMethod: 'upi'
    });
  };

  const handleOrderSubmit = (e) => {
    e.preventDefault();
    setShowPayment(true);
  };

  const confirmPayment = async () => {
    try {
      const finalTotal = selectedReel.price * quantity + 40 + Math.round((selectedReel.price * quantity) * 0.05);
      
      if (finalTotal <= 0) {
        alert('Invalid order total');
        return;
      }
      
      // If UPI/Online payment, use Razorpay
      if (orderForm.paymentMethod === 'upi') {
        initiateRazorpayPayment({
          amount: finalTotal,
          name: selectedReel.restaurantId.name,
          description: `Order: ${selectedReel.dishName}`,
          customerName: orderForm.customerName,
          customerPhone: orderForm.customerPhone,
          onSuccess: async (response) => {
            console.log('Payment successful:', response);
            
            // Create order with paid status
            const orderData = {
              restaurantId: selectedReel.restaurantId._id,
              items: [{
                menuItemId: selectedReel._id,
                name: selectedReel.dishName,
                price: selectedReel.price,
                quantity: quantity
              }],
              totalAmount: finalTotal,
              orderType: 'delivery',
              ...orderForm,
              paymentStatus: 'paid',
              paymentMethod: 'razorpay',
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id
            };

            await axios.post('/api/orders', orderData);
            alert('Order placed successfully! Payment confirmed. 🎉');
            closeOrderModal();
          },
          onFailure: (error) => {
            console.error('Payment failed:', error);
            alert('Payment failed or cancelled. Please try again.');
          }
        });
      } else {
        // Cash on Delivery
        const orderData = {
          restaurantId: selectedReel.restaurantId._id,
          items: [{
            menuItemId: selectedReel._id,
            name: selectedReel.dishName,
            price: selectedReel.price,
            quantity: quantity
          }],
          totalAmount: finalTotal,
          orderType: 'delivery',
          ...orderForm,
          paymentStatus: 'pending'
        };

        await axios.post('/api/orders', orderData);
        alert('Order placed successfully! Pay cash on delivery. 🎉');
        closeOrderModal();
      }
    } catch (error) {
      console.error('Error placing order:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center">
      {/* Mobile-sized container with black bars on sides */}
      <div className="relative w-full h-full max-w-[480px] bg-black">
        {/* Loading Animation */}
        {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="relative text-center">
            {/* Animated Food Icons Carousel */}
            <div className="text-8xl mb-6">
              <div className="animate-bounce inline-block">🍔</div>
            </div>
            
            {/* Pulsing Circle Loader */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-primary opacity-20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
              <div className="absolute inset-3 rounded-full border-4 border-red-400 border-t-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
            </div>
            
            {/* Loading Text with Gradient */}
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-red-400 to-primary text-2xl font-bold animate-pulse">
              Loading Delicious Reels...
            </p>
            
            {/* Subtitle */}
            <p className="text-gray-400 text-sm mt-2">Get ready for amazing food content</p>
            
            {/* Progress indicator */}
            <div className="w-48 h-1 bg-gray-700 rounded-full mt-4 mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-red-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        )}

        {/* Location Status Indicator */}
        {userLocation && reels.length < allReels.length && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-green-600 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>Showing {reels.length} nearby reels</span>
            </div>
          </div>
        )}
        
        {/* All Reels Indicator */}
        {userLocation && reels.length === allReels.length && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm pointer-events-none">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>Showing all {reels.length} reels</span>
            </div>
          </div>
        )}

        {/* Top Controls */}
        <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMuted(!isMuted);
              }}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 pointer-events-auto transition-all"
            >
              {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
            </button>
            
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openReelModal();
                }}
                className="bg-primary text-white p-2 rounded-full hover:bg-red-600 pointer-events-auto transition-all"
                title="Add New Reel"
              >
                <Plus size={24} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Location Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (userLocation) {
                  // Toggle between nearby and all reels
                  if (reels.length === allReels.length) {
                    filterReelsByLocation(); // Show nearby
                  } else {
                    setReels(allReels); // Show all
                  }
                } else {
                  handleLocationPermission(); // Request location
                }
              }}
              className={`p-2 rounded-full pointer-events-auto transition-all ${
                userLocation && reels.length < allReels.length
                  ? 'bg-green-600 bg-opacity-80 text-white hover:bg-green-700'
                  : 'bg-black bg-opacity-50 text-white hover:bg-opacity-70'
              }`}
              title={userLocation 
                ? (reels.length < allReels.length ? 'Showing nearby reels' : 'Show nearby reels')
                : 'Enable location for nearby reels'
              }
            >
              <MapPin size={20} />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                refreshReels();
              }}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 pointer-events-auto transition-all"
              title="Refresh Reels"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = '/';
              }}
              className="bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 pointer-events-auto transition-all"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Reels Container */}
        <div
          ref={containerRef}
          className="w-full h-full overflow-y-scroll overflow-x-hidden snap-y snap-mandatory hide-scrollbar"
          style={{ scrollSnapType: 'y mandatory' }}
        >
        {reels.map((reel, index) => (
          <div
            key={reel._id}
            className="w-full h-full flex-shrink-0 snap-start snap-always relative"
            style={{ scrollSnapAlign: 'start', scrollSnapStop: 'always' }}
          >
            {/* Video Background */}
            <div 
              className="absolute inset-0 w-full h-full bg-gradient-to-b from-gray-900 to-black"
              onClick={(e) => {
                e.stopPropagation();
                togglePlayPause();
              }}
            >
              {reel.videoUrl ? (
                <video
                  ref={(el) => videoRefs.current[reel._id] = el}
                  src={reel.videoUrl}
                  className="w-full h-full object-cover"
                  autoPlay={index === currentIndex}
                  loop
                  muted={isMuted}
                  playsInline
                  controls={false}
                  preload={index <= currentIndex + 2 ? 'metadata' : 'none'}
                  onLoadStart={() => {
                    // Show loading indicator for current video
                    if (index === currentIndex) {
                      // Could add loading state here
                    }
                  }}
                  onCanPlay={() => {
                    // Video is ready to play
                    if (index === currentIndex) {
                      const video = videoRefs.current[reel._id];
                      if (video && !isPaused) {
                        video.play().catch(console.error);
                      }
                    }
                  }}
                  onError={(e) => {
                    console.error('Video error:', e);
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                  <div className="text-center">
                    <div className="text-white text-6xl mb-4">🍔</div>
                    <p className="text-gray-400">Video not available</p>
                  </div>
                </div>
              )}
              
              {/* Pause Indicator */}
              {isPaused && index === currentIndex && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black bg-opacity-50 rounded-full p-6">
                    <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                    </svg>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Content */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none" />

            {/* Bottom Info */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 text-white pointer-events-none">
              <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">{reel.dishName}</h2>
              <p className="text-3xl font-bold text-primary mb-2 drop-shadow-lg">₹{reel.price}</p>
              
              {reel.restaurantId && (
                <p className="text-lg mb-4 drop-shadow-lg">
                  {reel.restaurantId.name} • ⭐ {reel.restaurantId.rating}
                </p>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openOrderModal(reel);
                }}
                className="bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-red-600 transition-all transform hover:scale-105 flex items-center gap-2 pointer-events-auto shadow-2xl"
              >
                <ShoppingBag size={22} />
                Order Now
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-40 flex flex-col gap-4 pointer-events-none">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(reel._id);
                }}
                className="flex flex-col items-center text-white pointer-events-auto transition-transform hover:scale-110"
              >
                <div className="bg-black bg-opacity-50 p-3 rounded-full hover:bg-opacity-70 backdrop-blur-sm">
                  <Heart size={28} fill="white" />
                </div>
                <span className="text-sm mt-1 font-semibold drop-shadow-lg">{reel.likes}</span>
              </button>

              <div className="flex flex-col items-center text-white">
                <div className="bg-black bg-opacity-50 p-3 rounded-full backdrop-blur-sm">
                  <span className="text-xl">👁️</span>
                </div>
                <span className="text-sm mt-1 font-semibold drop-shadow-lg">{reel.views}</span>
              </div>

              {/* Admin Controls */}
              {isAdmin && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openReelModal(reel);
                    }}
                    className="flex flex-col items-center text-white pointer-events-auto transition-transform hover:scale-110"
                    title="Edit Reel"
                  >
                    <div className="bg-blue-600 bg-opacity-80 p-3 rounded-full hover:bg-opacity-100 backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteReel(reel._id);
                    }}
                    className="flex flex-col items-center text-white pointer-events-auto transition-transform hover:scale-110"
                    title="Delete Reel"
                  >
                    <div className="bg-red-600 bg-opacity-80 p-3 rounded-full hover:bg-opacity-100 backdrop-blur-sm">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {reels.length === 0 && !isLoading && (
          <div className="h-screen flex items-center justify-center text-white bg-gradient-to-br from-gray-900 via-black to-gray-900">
            <div className="text-center px-6">
              <div className="text-7xl mb-6 animate-bounce">
                {userLocation ? '📍' : '🎬'}
              </div>
              <p className="text-3xl font-bold mb-2">
                {userLocation ? 'No Nearby Reels' : 'No Reels Available'}
              </p>
              <p className="text-gray-400 mb-8 text-lg">
                {userLocation 
                  ? 'No restaurants in your delivery area have reels yet. Some restaurants may not have location setup for delivery.'
                  : 'Check back later for delicious content!'
                }
              </p>
              <div className="flex flex-col gap-4">
                {userLocation && allReels.length > 0 && (
                  <button
                    onClick={() => {
                      setUserLocation(null);
                      setReels(allReels);
                    }}
                    className="bg-blue-600 px-8 py-4 rounded-full hover:bg-blue-700 font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
                  >
                    Show All Reels
                  </button>
                )}
                <button
                  onClick={() => window.location.href = '/'}
                  className="bg-primary px-8 py-4 rounded-full hover:bg-red-600 font-bold text-lg transition-all transform hover:scale-105 shadow-2xl"
                >
                  Go Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Permission Prompt */}
        {showLocationPrompt && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
              <div className="text-blue-500 text-5xl mb-4">📍</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Enable Location Access</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                We need your location to show reels from nearby restaurants that deliver to you.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowLocationPrompt(false);
                    setReels(allReels); // Show all reels
                  }}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Skip
                </button>
                <button
                  onClick={handleLocationPermission}
                  disabled={locationLoading}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {locationLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Detecting...
                    </>
                  ) : (
                    <>
                      <Navigation size={16} />
                      Allow Location
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4 text-center">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Error Loading Reels</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  refreshReels();
                }}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reel CRUD Modal */}
      {showReelModal && (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-700 shadow-2xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">
                  {editingReel ? 'Edit Reel' : 'Add New Reel'}
                </h2>
                <button 
                  onClick={closeReelModal} 
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleReelSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">
                    Dish Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={reelForm.dishName}
                    onChange={(e) => setReelForm({...reelForm, dishName: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    placeholder="Enter dish name"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.01"
                    value={reelForm.price}
                    onChange={(e) => setReelForm({...reelForm, price: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    placeholder="Enter price"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">
                    Video URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={reelForm.videoUrl}
                    onChange={(e) => setReelForm({...reelForm, videoUrl: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                    placeholder="https://example.com/video.mp4"
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Enter a direct link to your video file (MP4, WebM, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">
                    Restaurant *
                  </label>
                  <select
                    required
                    value={reelForm.restaurantId}
                    onChange={(e) => setReelForm({...reelForm, restaurantId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors"
                    disabled={isSubmitting}
                  >
                    <option value="">Select a restaurant</option>
                    {restaurants.map(restaurant => (
                      <option key={restaurant._id} value={restaurant._id}>
                        {restaurant.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={closeReelModal}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        {editingReel ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      editingReel ? 'Update Reel' : 'Create Reel'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Order Modal */}
      {showOrderModal && selectedReel && (
        <div className="fixed inset-0 bg-black/80 dark:bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto border border-transparent dark:border-gray-700 shadow-2xl">
            {!showPayment ? (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Quick Order</h2>
                  <button onClick={closeOrderModal} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                {/* Dish Info */}
                <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">{selectedReel.dishName}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">{selectedReel.restaurantId.name}</p>
                  <p className="text-2xl font-bold text-primary">₹{selectedReel.price}</p>
                </div>

                {/* Quantity Selector */}
                <div className="mb-6">
                  <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-3 transition-colors">Quantity</label>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white transition-colors"
                    >
                      <Minus size={20} />
                    </button>
                    <span className="text-2xl font-bold w-12 text-center text-gray-800 dark:text-white transition-colors">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Order Form */}
                <form onSubmit={handleOrderSubmit} className="space-y-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">Name</label>
                    <input
                      type="text"
                      required
                      value={orderForm.customerName}
                      onChange={(e) => setOrderForm({...orderForm, customerName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 transition-colors">Phone</label>
                    <input
                      type="tel"
                      required
                      value={orderForm.customerPhone}
                      onChange={(e) => setOrderForm({...orderForm, customerPhone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      placeholder="Your phone number"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-semibold mb-2 flex items-center gap-2 transition-colors">
                      <MapPin size={18} />
                      Delivery Address
                    </label>
                    <textarea
                      required
                      value={orderForm.deliveryAddress}
                      onChange={(e) => setOrderForm({...orderForm, deliveryAddress: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
                      rows="3"
                      placeholder="Enter your delivery address"
                    />
                  </div>

                  {/* Total */}
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Subtotal</span>
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹{selectedReel.price * quantity}</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Delivery Fee</span>
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹40</span>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600 dark:text-gray-400 transition-colors">Taxes (5%)</span>
                      <span className="font-semibold text-gray-800 dark:text-white transition-colors">₹{Math.round((selectedReel.price * quantity) * 0.05)}</span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-2 flex justify-between items-center transition-colors">
                      <span className="text-lg font-bold text-gray-800 dark:text-white transition-colors">Total</span>
                      <span className="text-xl font-bold text-primary">
                        ₹{selectedReel.price * quantity + 40 + Math.round((selectedReel.price * quantity) * 0.05)}
                      </span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold text-lg transition-colors shadow-md"
                  >
                    Proceed to Payment
                  </button>
                </form>
              </div>
            ) : (
              /* Payment Screen */
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-white transition-colors">Payment</h2>
                  <button onClick={closeOrderModal} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <X size={24} />
                  </button>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 dark:text-gray-400 mb-2 transition-colors">Total Amount</p>
                  <p className="text-3xl font-bold text-primary">
                    ₹{selectedReel.price * quantity + 40 + Math.round((selectedReel.price * quantity) * 0.05)}
                  </p>
                </div>

                <div className="space-y-3 mb-6">
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-700">
                    <input
                      type="radio"
                      name="payment"
                      value="upi"
                      checked={orderForm.paymentMethod === 'upi'}
                      onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                      className="accent-primary"
                    />
                    <Smartphone size={24} className="text-primary" />
                    <span className="font-semibold text-gray-800 dark:text-white transition-colors">UPI Payment</span>
                  </label>
                  
                  <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary dark:hover:border-primary transition-colors bg-white dark:bg-gray-700">
                    <input
                      type="radio"
                      name="payment"
                      value="cash"
                      checked={orderForm.paymentMethod === 'cash'}
                      onChange={(e) => setOrderForm({...orderForm, paymentMethod: e.target.value})}
                      className="accent-primary"
                    />
                    <Wallet size={24} className="text-primary" />
                    <span className="font-semibold text-gray-800 dark:text-white transition-colors">Cash on Delivery</span>
                  </label>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowPayment(false)}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={confirmPayment}
                    className="flex-1 bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
