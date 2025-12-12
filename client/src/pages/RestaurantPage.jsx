import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Clock, MapPin, Plus, Minus, Leaf, ArrowLeft, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { translateCategory } from '../utils/translationHelper';
import { useRestaurantTranslation } from '../hooks/useContentTranslation';
import { formatCurrency, convertNumerals } from '../utils/numberFormatter';
import { useRestaurantCache } from '../utils/restaurantCache';
import { App as CapacitorApp } from '@capacitor/app';
import Reviews from '../components/Reviews';
import { checkRestaurantDelivery } from '../utils/deliveryRadius';
import { useNotification } from '../context/NotificationContext';
import { getReadableAddress } from '../utils/simpleAddressResolver';
import RestaurantAddress from '../components/RestaurantAddress';

export default function RestaurantPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showReviewsFor, setShowReviewsFor] = useState(null);
  const [itemRatings, setItemRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deliveryStatus, setDeliveryStatus] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const { addToCart, cart, updateQuantity } = useCart();
  const { translatedContent: translatedRestaurant, isTranslating } = useRestaurantTranslation(restaurant);
  const { showInfo, showWarning, showError } = useNotification();
  
  // Performance optimization
  const restaurantCache = useRestaurantCache();

  useEffect(() => {
    fetchRestaurant();
    loadUserLocation();
  }, [id]);

  useEffect(() => {
    if (restaurant) {
      fetchAllRatings();
      checkDeliveryAvailability();
    }
  }, [restaurant, userLocation]);

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

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await restaurantCache.fetchRestaurantById(axios, id);
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setError('Failed to load restaurant details');
    } finally {
      setLoading(false);
    }
  };

  const loadUserLocation = () => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        setUserLocation(locationData);
        console.log('📍 Loaded user location for delivery check:', locationData);
      }
    } catch (error) {
      console.error('Error loading user location:', error);
    }
  };

  const checkDeliveryAvailability = async () => {
    if (!restaurant || !userLocation?.latitude || !userLocation?.longitude) {
      return;
    }

    try {
      console.log('🚚 Checking delivery availability for restaurant:', restaurant.name);
      
      const result = await checkRestaurantDelivery(
        restaurant._id,
        userLocation.latitude,
        userLocation.longitude
      );
      
      setDeliveryStatus(result);
      
      console.log('🚚 Delivery check result:', result);
      
      // Show notification based on delivery status
      if (result.allowed === false && result.distance) {
        showWarning(
          `This restaurant is ${result.distance}km away, outside their ${result.deliveryRadiusKm}km delivery radius.`,
          {
            title: 'Delivery Not Available',
            duration: 8000
          }
        );
      } else if (result.allowed === true && result.distance) {
        showInfo(
          `Great! This restaurant delivers to your location (${result.distance}km away).`,
          {
            title: 'Delivery Available',
            duration: 5000
          }
        );
      }
    } catch (error) {
      console.error('Error checking delivery availability:', error);
    }
  };

  const fetchAllRatings = async () => {
    try {
      const ratings = {};
      for (const item of restaurant.menu) {
        const { data } = await axios.get(`/api/reviews/item/${id}/${item._id}`);
        if (data.length > 0) {
          const avgRating = (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1);
          ratings[item._id] = {
            average: parseFloat(avgRating),
            count: data.length
          };
        }
      }
      setItemRatings(ratings);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    }
  };

  useEffect(() => {
    if (translatedRestaurant && !selectedCategory) {
      setSelectedCategory(t('all'));
    }
  }, [translatedRestaurant, t, selectedCategory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Error Loading Restaurant</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => {
              setError(null);
              fetchRestaurant();
            }}
            className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!restaurant) return <div className="text-center py-12 text-gray-800 dark:text-white">{t('loading')}</div>;
  if (!translatedRestaurant) return <div className="text-center py-12 text-gray-800 dark:text-white">{t('loading')}</div>;

  const displayRestaurant = translatedRestaurant || restaurant;
  const uniqueCategories = [...new Set(displayRestaurant.menu.map(item => item.category))];
  const categories = [t('all'), ...uniqueCategories];
  
  const filteredMenu = selectedCategory === t('all') 
    ? displayRestaurant.menu 
    : displayRestaurant.menu.filter(item => item.category === selectedCategory);
  
  // Sort menu by rating (highest first)
  const sortedMenu = [...filteredMenu].sort((a, b) => {
    const ratingA = itemRatings[a._id]?.average || 0;
    const ratingB = itemRatings[b._id]?.average || 0;
    return ratingB - ratingA; // Descending order
  });

  const getItemQuantity = (itemId) => {
    const item = cart.find(i => i._id === itemId);
    return item ? item.quantity : 0;
  };

  const handleAddToCart = (item, restaurant) => {
    // Check if delivery is available
    if (deliveryStatus && !deliveryStatus.allowed && userLocation) {
      showWarning(
        `This restaurant doesn't deliver to your location (${deliveryStatus.distance}km away, outside ${deliveryStatus.deliveryRadiusKm}km radius).`,
        {
          title: 'Delivery Not Available',
          duration: 6000
        }
      );
      return;
    }

    // If no location or delivery is allowed, proceed with adding to cart
    addToCart(item, restaurant);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Back Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          window.location.href = '/';
        }}
        className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary dark:hover:text-primary mb-4 transition-colors active:bg-gray-100 dark:active:bg-gray-800 p-2 -ml-2 rounded-lg touch-manipulation"
        type="button"
      >
        <ArrowLeft size={20} />
        <span className="font-medium">{t('back')}</span>
      </button>

      {/* Restaurant Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 p-4 sm:p-6 mb-6 sm:mb-8 border border-transparent dark:border-gray-700 transition-colors">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
          <div className="w-full md:w-48 h-40 sm:h-48 bg-gradient-to-r from-primary to-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            {displayRestaurant.image ? (
              <img src={displayRestaurant.image} alt={displayRestaurant.name} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-white text-4xl sm:text-6xl font-bold">{displayRestaurant.name[0]}</span>
            )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">{displayRestaurant.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base transition-colors">{displayRestaurant.description}</p>
            
            <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
              <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
                <Star size={16} className="sm:w-[18px] sm:h-[18px]" fill="currentColor" />
                <span className="font-semibold">{convertNumerals(displayRestaurant.rating, i18n.language)}</span>
              </div>
              
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 transition-colors">
                <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span>
                  {(() => {
                    const time = displayRestaurant.deliveryTime || '30-40 min';
                    const timeWithoutMin = time.replace(/\s*min\s*$/i, '');
                    return `${convertNumerals(timeWithoutMin, i18n.language)} ${t('min')}`;
                  })()}
                </span>
              </div>
              
              {displayRestaurant.isDeliveryAvailable && (
                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 transition-colors">
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span>{t('deliveryAvailable')}</span>
                </div>
              )}
              
              {/* Delivery Status Based on User Location */}
              {deliveryStatus && userLocation && (
                <div className={`flex items-center gap-1 transition-colors ${
                  deliveryStatus.allowed 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  <MapPin size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm">
                    {deliveryStatus.allowed 
                      ? `Delivers to you (${deliveryStatus.distance}km)`
                      : `Out of range (${deliveryStatus.distance}km)`
                    }
                  </span>
                </div>
              )}
            </div>
            
            <div className="mt-3 sm:mt-4 space-y-2 text-sm sm:text-base">
              <div>
                <span className="text-gray-700 dark:text-gray-300 font-semibold transition-colors">{t('Cuisines')}: </span>
                <span className="text-gray-600 dark:text-gray-400 transition-colors">{displayRestaurant.cuisine?.join(', ')}</span>
              </div>
              
              {/* Restaurant Address */}
              <div>
                <span className="text-gray-700 dark:text-gray-300 font-semibold transition-colors">Location: </span>
                <RestaurantAddress 
                  restaurant={displayRestaurant} 
                  showDistance={false}
                  className="inline-flex"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Status Banner */}
      {deliveryStatus && userLocation && !deliveryStatus.allowed && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">
                Delivery Not Available
              </h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                This restaurant is <strong>{deliveryStatus.distance}km</strong> away from your location, 
                which is outside their <strong>{deliveryStatus.deliveryRadiusKm}km</strong> delivery radius.
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                You can still browse the menu, but delivery won't be available to your current location.
              </p>
            </div>
          </div>
        </div>
      )}

      {deliveryStatus && userLocation && deliveryStatus.allowed && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6 transition-colors">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <MapPin className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300 mb-1">
                Delivery Available ✅
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Great! This restaurant delivers to your location. 
                Distance: <strong>{deliveryStatus.distance}km</strong> 
                (within {deliveryStatus.deliveryRadiusKm}km delivery radius)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 hide-scrollbar">
        {categories.map((category, index) => {
          const isAllCategory = index === 0;
          const displayName = isAllCategory ? category : category;
          const categoryValue = isAllCategory ? t('all') : category;
          
          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(categoryValue)}
              className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap text-sm sm:text-base transition-colors ${
                selectedCategory === categoryValue
                  ? 'bg-primary text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
              }`}
            >
              {displayName}
            </button>
          );
        })}
      </div>

      {/* Sorting Info */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">{sortedMenu.length}</span> {sortedMenu.length === 1 ? 'item' : 'items'} • Sorted by rating
        </p>
      </div>

      {/* Menu List - Horizontal Cards */}
      <div className="space-y-3 sm:space-y-4">
        {sortedMenu.map((item) => {
          const quantity = getItemQuantity(item._id);
          
          return (
            <div key={item._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 overflow-hidden border border-transparent dark:border-gray-700 transition-colors">
              <div className="flex">
                {/* Item Image */}
                <div className="w-28 sm:w-32 h-28 sm:h-32 bg-gradient-to-r from-accent to-secondary flex items-center justify-center flex-shrink-0 relative">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-3xl">🍽️</span>
                  )}
                  {item.isVeg && (
                    <div className="absolute top-1 left-1 bg-white p-1 rounded shadow-sm">
                      <Leaf size={14} className="text-green-600" />
                    </div>
                  )}
                </div>
                
                {/* Item Details */}
                <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-1 transition-colors">{item.name}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 line-clamp-2 transition-colors">{item.description}</p>
                    
                    {/* Rating Display */}
                    {itemRatings[item._id] ? (
                      <div className="flex items-center gap-1 mb-2 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md inline-flex">
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-bold text-gray-800 dark:text-white">
                          {itemRatings[item._id].average}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          ({itemRatings[item._id].count})
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 mb-2 text-gray-400 dark:text-gray-500">
                        <Star size={16} />
                        <span className="text-xs">No ratings yet</span>
                      </div>
                    )}
                    
                    <p className="text-lg sm:text-xl font-bold text-primary mb-2">{formatCurrency(item.price, i18n.language)}</p>
                  </div>
                </div>
                
                {/* Add to Cart Button */}
                <div className="flex flex-col items-end gap-2 p-3 sm:p-4">
                  {quantity === 0 ? (
                    <button
                      onClick={() => handleAddToCart(item, restaurant)}
                      className={`px-4 sm:px-6 py-2 rounded-lg transition-colors font-semibold text-sm sm:text-base whitespace-nowrap shadow-md ${
                        deliveryStatus && !deliveryStatus.allowed
                          ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                          : 'bg-primary text-white hover:bg-red-600'
                      }`}
                      disabled={deliveryStatus && !deliveryStatus.allowed}
                    >
                      {deliveryStatus && !deliveryStatus.allowed ? 'No Delivery' : t('add')}
                    </button>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3 bg-primary text-white rounded-lg px-2 sm:px-3 py-2 shadow-md">
                      <button
                        onClick={() => updateQuantity(item._id, quantity - 1)}
                        className="p-1 hover:bg-red-600 rounded transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="font-bold min-w-[20px] text-center">{quantity}</span>
                      <button
                        onClick={() => handleAddToCart(item, restaurant)}
                        className="p-1 hover:bg-red-600 rounded transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  )}
                  
                  {/* View Feedback Button */}
                  <button
                    onClick={() => setShowReviewsFor(showReviewsFor === item._id ? null : item._id)}
                    className="flex items-center gap-1 text-primary hover:text-red-600 text-xs sm:text-sm font-semibold"
                  >
                    <MessageSquare size={14} />
                    <span>{showReviewsFor === item._id ? 'Hide Feedback' : 'View Feedback'}</span>
                  </button>
                </div>
              </div>
              
              {/* Reviews Section */}
              {showReviewsFor === item._id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-3 sm:p-4">
                  <Reviews 
                    restaurantId={id} 
                    itemId={item._id} 
                    itemName={item.name}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
