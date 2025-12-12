import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';
import { resolveAddress, getShortAddress } from '../utils/addressResolver';

const RestaurantAddress = ({ restaurant, showDistance = true, className = '' }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (restaurant?.latitude && restaurant?.longitude) {
      fetchRestaurantAddress();
    }
  }, [restaurant]);

  const fetchRestaurantAddress = async () => {
    if (!restaurant?.latitude || !restaurant?.longitude) return;
    
    setLoading(true);
    try {
      const resolvedAddress = await resolveAddress(restaurant.latitude, restaurant.longitude);
      const shortAddress = getShortAddress(resolvedAddress);
      setAddress(shortAddress);
    } catch (error) {
      console.error('Error resolving restaurant address:', error);
      setAddress(`${restaurant.latitude.toFixed(4)}°N, ${restaurant.longitude.toFixed(4)}°E`);
    } finally {
      setLoading(false);
    }
  };

  if (!restaurant) return null;

  return (
    <div className={`flex items-center gap-1 text-gray-600 dark:text-gray-400 transition-colors ${className}`}>
      <MapPin size={14} className="sm:w-4 sm:h-4 flex-shrink-0" />
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 text-xs sm:text-sm">
        {/* Distance (if available) */}
        {showDistance && restaurant.distanceKm !== null && restaurant.distanceKm !== undefined && (
          <span className="font-medium text-blue-600 dark:text-blue-400">
            {restaurant.distanceKm} km
          </span>
        )}
        
        {/* Address */}
        <span className="text-gray-500 dark:text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
          {loading ? (
            <span className="animate-pulse">Loading address...</span>
          ) : (
            address || restaurant.address || 'Address not available'
          )}
        </span>
        
        {/* Delivery radius indicator */}
        {restaurant.deliveryRadius && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({restaurant.deliveryRadius}km radius)
          </span>
        )}
      </div>
    </div>
  );
};

export default RestaurantAddress;