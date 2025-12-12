import { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Clock, Star, ScanLine, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { convertNumerals } from '../utils/numberFormatter';
import { getUserLocation } from '../utils/geolocation';
import { useRestaurantCache } from '../utils/restaurantCache';
import { useDebounce, useOptimizedAPI, usePerformanceOptimization } from '../utils/performanceOptimizer';
import { useNotification } from '../context/NotificationContext';
import OptimizedImage from '../components/OptimizedImage';
import VirtualizedList from '../components/VirtualizedList';
import QRScanner from '../components/QRScanner';
import Chatbot from '../components/Chatbot';
import AIAssistant from '../components/AIAssistant';
import LocationDisplay from '../components/LocationDisplay';

export default function Home() {
  const { t, i18n } = useTranslation();
  const { showSuccess, showError, showInfo } = useNotification();
  const [restaurants, setRestaurants] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showScanner, setShowScanner] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isLocationBased, setIsLocationBased] = useState(false);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [showLocationStatus, setShowLocationStatus] = useState(false);
  
  // Performance optimizations
  const restaurantCache = useRestaurantCache();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const { PerformanceMonitor } = usePerformanceOptimization();

  // Memoized filtered restaurants for better performance
  const filteredRestaurants = useMemo(() => {
    if (!debouncedSearchQuery) return restaurants;
    
    const query = debouncedSearchQuery.toLowerCase();
    return restaurants.filter(restaurant => 
      restaurant.name?.toLowerCase().includes(query) ||
      restaurant.cuisine?.some(c => c.toLowerCase().includes(query)) ||
      restaurant.description?.toLowerCase().includes(query)
    );
  }, [restaurants, debouncedSearchQuery]);

  useEffect(() => {
    // Preload restaurants in background for faster access
    restaurantCache.preloadRestaurants(axios);
    
    // Load saved location data first
    loadSavedLocation();
    
    // Try to detect location automatically on page load
    detectLocationAutomatically();
  }, []);
  
  const loadSavedLocation = () => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        console.log('📍 Loaded saved location:', locationData);
        setUserLocation(locationData);
        
        // Show info about loaded location
        showInfo('Using your saved location', {
          title: 'Location Loaded',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Error loading saved location:', error);
    }
  };

  // Auto-hide location status after 5 seconds
  useEffect(() => {
    if (userLocation && showLocationStatus) {
      const timer = setTimeout(() => {
        setShowLocationStatus(false);
      }, 5000); // Hide after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [userLocation, showLocationStatus]);

  const detectLocationAutomatically = async () => {
    try {
      setLocationLoading(true);
      const location = await getUserLocation();
      setUserLocation(location);
      setShowLocationStatus(true); // Show status indicator
      
      // Save location data to database
      await saveLocationData(location.latitude, location.longitude);
      
      // Fetch nearby restaurants automatically
      await fetchNearbyRestaurants(location.latitude, location.longitude);
      
      console.log('Location detected automatically:', location);
    } catch (error) {
      console.log('Auto location detection failed, loading all restaurants:', error);
      // If location detection fails, load all restaurants
      fetchRestaurants();
    } finally {
      setLocationLoading(false);
    }
  };

  const fetchRestaurants = async (query = '') => {
    try {
      setLoading(true);
      setError(null);
      setIsLocationBased(false);
      console.log('Fetching restaurants...');
      
      let data;
      if (query) {
        // Use cached search
        data = await restaurantCache.searchRestaurants(axios, query);
      } else {
        // Use cached restaurant list
        data = await restaurantCache.fetchRestaurants(axios);
      }
      
      console.log('Restaurants fetched:', data.length);
      setRestaurants(data);
      setNearbyCount(0);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError(error.message || 'Failed to load restaurants');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyRestaurants = async (latitude, longitude) => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching nearby restaurants...');
      
      const response = await restaurantCache.fetchNearbyRestaurants(axios, latitude, longitude);
      
      setRestaurants(response.nearbyRestaurants);
      setNearbyCount(response.nearbyRestaurants.length);
      setIsLocationBased(true);
      console.log('Nearby restaurants fetched:', response.nearbyRestaurants.length);
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      // Fallback to all restaurants if nearby fetch fails
      fetchRestaurants();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (debouncedSearchQuery.trim()) {
      // If searching, show all restaurants matching the query
      fetchRestaurants(debouncedSearchQuery);
    } else if (userLocation) {
      // If no search query but have location, show nearby restaurants
      fetchNearbyRestaurants(userLocation.latitude, userLocation.longitude);
    } else {
      // No search and no location, show all restaurants
      fetchRestaurants();
    }
  };

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      handleSearch();
    }
  }, [debouncedSearchQuery]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const saveLocationData = async (latitude, longitude, address = null) => {
    try {
      console.log('🔍 Attempting to save location data:', { latitude, longitude, address });
      
      // Get user data if available
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData)._id : null;
      
      // Generate session ID if not exists
      let sessionId = localStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
        localStorage.setItem('sessionId', sessionId);
      }
      
      console.log('📍 Saving location with data:', {
        latitude,
        longitude,
        address,
        userId,
        sessionId
      });
      
      const response = await axios.post('/api/locations/save', {
        latitude,
        longitude,
        address,
        userId,
        sessionId
      });
      
      console.log('✅ Location data saved successfully:', response.data);
      
      // Store location in localStorage for quick access
      const locationData = {
        latitude,
        longitude,
        address,
        timestamp: new Date().toISOString(),
        saved: true
      };
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      showSuccess('Location saved successfully!', {
        title: 'Location Stored',
        duration: 3000
      });
      
    } catch (error) {
      console.error('❌ Error saving location data:', error);
      console.error('Error details:', error.response?.data);
      
      // Show error to user since location saving is important
      showError('Failed to save location data', {
        title: 'Location Save Error',
        duration: 5000
      });
    }
  };

  const handleDetectLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
      console.log('🔍 Getting user location...');
      const location = await getUserLocation();
      
      console.log('📍 Location detected:', location);
      
      // Try to get address from coordinates
      let address = null;
      try {
        console.log('🏠 Attempting to get address...');
        
        // Try OpenCage first
        try {
          const response = await fetch(
            `https://api.opencagedata.com/geocode/v1/json?q=${location.latitude}+${location.longitude}&key=demo&limit=1`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
              address = data.results[0].formatted;
              console.log('✅ Address found via OpenCage:', address);
            }
          }
        } catch (error) {
          console.log('OpenCage failed, trying Nominatim...');
        }
        
        // Fallback to Nominatim if OpenCage fails
        if (!address) {
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'WaitNot-Restaurant-App'
                }
              }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.display_name) {
                address = data.display_name;
                console.log('✅ Address found via Nominatim:', address);
              }
            }
          } catch (error) {
            console.log('Nominatim also failed');
          }
        }
      } catch (addressError) {
        console.log('⚠️ Could not fetch address:', addressError.message);
      }
      
      const locationWithDetails = {
        ...location,
        address,
        timestamp: new Date().toISOString()
      };
      
      setUserLocation(locationWithDetails);
      setShowLocationStatus(true); // Show status indicator
      
      // Save location data to database with address
      await saveLocationData(location.latitude, location.longitude, address);
      
      // Show success notification
      showSuccess('Location detected and saved successfully!', {
        title: 'Location Found'
      });
      
      // Fetch nearby restaurants when location is manually detected
      await fetchNearbyRestaurants(location.latitude, location.longitude);
      
    } catch (error) {
      console.error('❌ Location error:', error);
      const errorMessage = error.message || 'Failed to get location';
      setLocationError(errorMessage);
      
      // Show error notification instead of alert
      showError(errorMessage, {
        title: 'Location Error',
        duration: 8000
      });
    } finally {
      setLocationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading restaurants...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center max-w-md w-full">
          {/* Error Icon */}
          <div className="mb-6 relative">
            <div className="w-32 h-32 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-4 h-4 bg-red-300 dark:bg-red-700 rounded-full animate-bounce"></div>
            <div className="absolute bottom-0 left-1/4 w-3 h-3 bg-red-400 dark:bg-red-600 rounded-full animate-ping"></div>
            <div className="absolute bottom-0 right-1/4 w-3 h-3 bg-red-400 dark:bg-red-600 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
          </div>

          {/* Error Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Oops! Connection Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
              {error || 'Unable to connect to the server'}
            </p>

            {/* Error Details */}
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 border border-red-100 dark:border-red-800">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-2">
                Common causes:
              </p>
              <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 text-left">
                <li>• No internet connection</li>
                <li>• Server is temporarily down</li>
                <li>• Request timeout</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button 
                onClick={() => fetchRestaurants()}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>

              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-xl font-medium transition-all"
              >
                Reload Page
              </button>
            </div>
          </div>

          {/* Help Text */}
          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            Still having issues? Check your internet connection
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      {/* Chatbot */}
      <Chatbot />
      <AIAssistant />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Search Bar Section - Moved to Top */}
      <div className="mb-6 sm:mb-8">
        <div className="flex gap-2 mb-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder={t('search')}
              className="w-full pl-4 pr-4 py-2.5 sm:py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          
          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="bg-primary hover:bg-red-600 text-white p-2.5 sm:p-3 rounded-lg transition-colors flex items-center justify-center"
            title="Search"
          >
            <Search size={20} />
          </button>
          
          {/* Location Button */}
          <button
            onClick={handleDetectLocation}
            disabled={locationLoading}
            className={`${
              userLocation 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white p-2.5 sm:p-3 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed relative`}
            title={userLocation ? "Location Detected" : "Detect My Location"}
          >
            {locationLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <Navigation size={20} className={userLocation ? 'animate-pulse' : ''} />
                {userLocation && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></span>
                )}
              </>
            )}
          </button>
          
          {/* QR Scanner Button */}
          <button
            onClick={() => setShowScanner(true)}
            className="bg-primary hover:bg-red-600 text-white p-2.5 sm:p-3 rounded-lg transition-colors flex items-center justify-center"
            title="Scan QR Code"
          >
            <ScanLine size={20} />
          </button>
        </div>
        
        {/* Location Details Display */}
        {userLocation && showLocationStatus && (
          <div className="mt-3 animate-fade-in">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg shadow-sm transition-all duration-300">
              <div className="flex items-start justify-between mb-3">
                <h4 className="text-sm font-medium text-green-800 dark:text-green-300">
                  📍 Your Location
                </h4>
                <button
                  onClick={() => setShowLocationStatus(false)}
                  className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors p-1 rounded hover:bg-green-100 dark:hover:bg-green-800/30"
                  title="Hide location details"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <LocationDisplay 
                location={userLocation} 
                showDetails={true}
                className="text-green-700 dark:text-green-300"
              />
              {nearbyCount > 0 && (
                <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                  🍽️ {nearbyCount} restaurants deliver to your area
                </div>
              )}
            </div>
          </div>
        )}
        
        {locationError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
            <MapPin size={16} className="text-red-600 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {locationError}
            </span>
          </div>
        )}
      </div>

      {/* Page Header Section - Moved Down */}
      <div className="mb-6 sm:mb-8">
        {isLocationBased ? (
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2 transition-colors">
              Nearby Restaurants
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
              {nearbyCount > 0 
                ? `Found ${nearbyCount} restaurant${nearbyCount !== 1 ? 's' : ''} that deliver to your location`
                : 'No restaurants found in your delivery area'
              }
            </p>
          </div>
        ) : (
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 dark:text-white transition-colors">
            {t('discover')}
          </h1>
        )}
        
        {/* Show All Restaurants Button (when in location-based mode) */}
        {isLocationBased && (
          <div className="mt-4 text-center">
            <button
              onClick={() => fetchRestaurants()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <Search size={16} />
              <span>Show All Restaurants</span>
            </button>
          </div>
        )}
      </div>

      {/* Restaurant Grid - Optimized with virtualization for large lists */}
      {filteredRestaurants.length > 20 ? (
        <VirtualizedList
          items={filteredRestaurants}
          itemHeight={280}
          containerHeight={600}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
          renderItem={(restaurant, index) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredRestaurants.map((restaurant) => (
            <RestaurantCard key={restaurant._id} restaurant={restaurant} />
          ))}
        </div>
      )}

      </div>

      {filteredRestaurants.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {isLocationBased ? 'No nearby restaurants' : 'No restaurants found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 transition-colors">
            {isLocationBased 
              ? 'No restaurants deliver to your current location. Try expanding your search area.'
              : 'No restaurants found. Try a different search term.'
            }
          </p>
          {isLocationBased && (
            <button
              onClick={() => fetchRestaurants()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Search size={16} />
              <span>View All Restaurants</span>
            </button>
          )}
        </div>
      )}

      {/* QR Scanner Modal */}
      {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}

// Optimized Restaurant Card Component
const RestaurantCard = ({ restaurant }) => {
  const { t, i18n } = useTranslation();
  
  return (
    <Link
      to={`/restaurant/${restaurant._id}`}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 overflow-hidden hover:shadow-xl dark:hover:shadow-gray-900 transition-all border border-transparent dark:border-gray-700 transform hover:scale-105"
    >
      <div className="h-40 sm:h-48 bg-gradient-to-r from-primary to-secondary flex items-center justify-center relative overflow-hidden">
        {restaurant.image ? (
          <OptimizedImage
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover"
            width={400}
            height={200}
            lazy={true}
            placeholder="blur"
          />
        ) : (
          <span className="text-white text-3xl sm:text-4xl font-bold">
            {restaurant.name[0]}
          </span>
        )}
        
        {/* Quick action overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
            <span className="text-white font-semibold bg-black bg-opacity-50 px-3 py-1 rounded-full text-sm">
              View Menu
            </span>
          </div>
        </div>
      </div>
      
      <div className="p-3 sm:p-4">
        <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2 transition-colors line-clamp-1">
          {restaurant.name}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1 transition-colors">
          {restaurant.cuisine?.join(', ')}
        </p>
        
        <div className="flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
          <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
            <Star size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
            <span className="font-semibold">
              {convertNumerals(restaurant.rating, i18n.language)}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 transition-colors">
            <Clock size={14} className="sm:w-4 sm:h-4" />
            <span className="whitespace-nowrap">
              {(() => {
                const time = restaurant.deliveryTime || '30-40 min';
                const timeWithoutMin = time.replace(/\s*min\s*$/i, '');
                return `${convertNumerals(timeWithoutMin, i18n.language)} ${t('min')}`;
              })()}
            </span>
          </div>
          
          {restaurant.distanceKm ? (
            <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 transition-colors">
              <MapPin size={14} className="sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">{restaurant.distanceKm} km</span>
            </div>
          ) : restaurant.isDeliveryAvailable && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400 transition-colors">
              <MapPin size={14} className="sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Delivery</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
