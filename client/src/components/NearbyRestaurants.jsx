import { useState } from 'react';
import { MapPin, Loader, AlertCircle, Navigation, Star, Clock } from 'lucide-react';
import axios from 'axios';

export default function NearbyRestaurants() {
  const [nearbyRestaurants, setNearbyRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        fetchNearbyRestaurants(latitude, longitude);
      },
      (err) => {
        setError('Unable to fetch your location. Please allow location access.');
        setLoading(false);
        console.error('Geolocation error:', err);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const fetchNearbyRestaurants = async (latitude, longitude) => {
    try {
      const response = await axios.post('/api/restaurants/nearby', {
        latitude,
        longitude
      });

      setNearbyRestaurants(response.data.nearbyRestaurants);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch nearby restaurants. Please try again.');
      setLoading(false);
      console.error('Error fetching nearby restaurants:', err);
    }
  };

  const handleOrderNow = (restaurantId) => {
    // Navigate to restaurant page or open ordering interface
    window.location.href = `/restaurant/${restaurantId}`;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Find Nearby Restaurants
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Discover restaurants that deliver to your location
        </p>
        
        <button
          onClick={detectLocation}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              Detecting Location...
            </>
          ) : (
            <>
              <Navigation size={20} />
              Detect My Location
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
          <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="font-medium text-red-800 dark:text-red-300">Error</h3>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}



      {nearbyRestaurants.length === 0 && userLocation && !loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No restaurants found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Sorry, there are no restaurants available in your delivery area.
          </p>
        </div>
      )}

      {nearbyRestaurants.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Nearby Restaurants ({nearbyRestaurants.length})
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {nearbyRestaurants.map((restaurant) => (
              <div
                key={restaurant._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
              >
                {restaurant.image && (
                  <img
                    src={restaurant.image}
                    alt={restaurant.name}
                    className="w-full h-48 object-cover"
                  />
                )}
                
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                      <MapPin size={14} />
                      <span>{restaurant.distanceKm} km</span>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
                    {restaurant.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-3 text-sm">
                    <div className="flex items-center gap-1">
                      <Star className="text-yellow-400" size={14} />
                      <span className="text-gray-700 dark:text-gray-300">
                        {restaurant.rating}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Clock className="text-gray-400" size={14} />
                      <span className="text-gray-600 dark:text-gray-400">
                        {restaurant.deliveryTime}
                      </span>
                    </div>
                  </div>
                  
                  {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {restaurant.cuisine.slice(0, 3).map((type, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Delivery radius: {restaurant.deliveryRadiusKm} km
                    </div>
                    
                    <button
                      onClick={() => handleOrderNow(restaurant._id)}
                      className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}