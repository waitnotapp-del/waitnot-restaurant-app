import { useState, useEffect } from 'react';
import { Search, MapPin, Clock, Star, ScanLine, Navigation } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { convertNumerals } from '../utils/numberFormatter';
import { getUserLocation } from '../utils/geolocation';
import QRScanner from '../components/QRScanner';
import Chatbot from '../components/Chatbot';
import AIAssistant from '../components/AIAssistant';

export default function Home() {
  const { t, i18n } = useTranslation();
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

  useEffect(() => {
    // Try to detect location automatically on page load
    detectLocationAutomatically();
  }, []);

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
      console.log('Fetching all restaurants...');
      
      const params = {};
      if (query) params.q = query;
      
      const { data } = await axios.get('/api/restaurants/search', { params });
      console.log('All restaurants fetched:', data.length);
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
      
      const response = await axios.post('/api/restaurants/nearby', {
        latitude,
        longitude
      });

      setRestaurants(response.data.nearbyRestaurants);
      setNearbyCount(response.data.nearbyRestaurants.length);
      setIsLocationBased(true);
      console.log('Nearby restaurants fetched:', response.data.nearbyRestaurants.length);
    } catch (error) {
      console.error('Error fetching nearby restaurants:', error);
      // Fallback to all restaurants if nearby fetch fails
      fetchRestaurants();
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // If searching, show all restaurants matching the query
      fetchRestaurants(searchQuery);
    } else if (userLocation) {
      // If no search query but have location, show nearby restaurants
      fetchNearbyRestaurants(userLocation.latitude, userLocation.longitude);
    } else {
      // No search and no location, show all restaurants
      fetchRestaurants();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const saveLocationData = async (latitude, longitude, address = null) => {
    try {
      // Get user data if available
      const userData = localStorage.getItem('user');
      const userId = userData ? JSON.parse(userData)._id : null;
      
      // Generate session ID if not exists
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
      
      console.log('Location data saved successfully');
    } catch (error) {
      console.error('Error saving location data:', error);
      // Don't show error to user as this is background operation
    }
  };

  const handleDetectLocation = async () => {
    setLocationLoading(true);
    setLocationError(null);
    
    try {
      const location = await getUserLocation();
      setUserLocation(location);
      setShowLocationStatus(true); // Show status indicator
      
      // Save location data to database
      await saveLocationData(location.latitude, location.longitude);
      
      // Fetch nearby restaurants when location is manually detected
      await fetchNearbyRestaurants(location.latitude, location.longitude);
      
    } catch (error) {
      console.error('Location error:', error);
      setLocationError(error.message || 'Failed to get location');
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
      {/* Search Section */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 sm:mb-6">
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
        </div>
        
        <div className="flex gap-2">
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
        
        {/* Location Status - Auto-hide after 5 seconds */}
        {userLocation && showLocationStatus && (
          <div className="mt-3 animate-fade-in">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center justify-between shadow-sm transition-all duration-300">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-green-600 dark:text-green-400" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  Location detected • Delivery zones available
                </span>
              </div>
              <button
                onClick={() => setShowLocationStatus(false)}
                className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors p-1 rounded hover:bg-green-100 dark:hover:bg-green-800/30"
                title="Hide notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
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

      {/* Restaurant Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {restaurants.map((restaurant) => (
          <Link
            key={restaurant._id}
            to={`/restaurant/${restaurant._id}`}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-gray-900/50 overflow-hidden hover:shadow-xl dark:hover:shadow-gray-900 transition-all border border-transparent dark:border-gray-700"
          >
            <div className="h-40 sm:h-48 bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
              {restaurant.image ? (
                <img src={restaurant.image} alt={restaurant.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-3xl sm:text-4xl font-bold">{restaurant.name[0]}</span>
              )}
            </div>
            
            <div className="p-3 sm:p-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white mb-1 sm:mb-2 transition-colors">{restaurant.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-2 sm:mb-3 line-clamp-1 transition-colors">{restaurant.cuisine?.join(', ')}</p>
              
              <div className="flex items-center justify-between text-xs sm:text-sm flex-wrap gap-2">
                <div className="flex items-center gap-1 text-yellow-500 dark:text-yellow-400">
                  <Star size={14} className="sm:w-4 sm:h-4" fill="currentColor" />
                  <span className="font-semibold">{convertNumerals(restaurant.rating, i18n.language)}</span>
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
        ))}
      </div>

      {restaurants.length === 0 && !loading && (
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
      </div>

      {/* QR Scanner Modal */}
      {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
    </div>
  );
}
