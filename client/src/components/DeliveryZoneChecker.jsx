import { useState, useEffect } from 'react';
import { MapPin, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { checkDeliveryAvailability } from '../utils/geolocation';
import { reverseGeocode } from '../utils/geocoding';
import AddressDisplay from './AddressDisplay';

export default function DeliveryZoneChecker({ restaurant, onZoneCheck }) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  const handleCheck = async () => {
    setChecking(true);
    try {
      const checkResult = await checkDeliveryAvailability(restaurant);
      setResult(checkResult);
      
      // Store user location for address display
      if (checkResult.userLocation) {
        setUserLocation(checkResult.userLocation);
      }
      
      if (onZoneCheck) {
        onZoneCheck(checkResult);
      }
    } catch (error) {
      setResult({ 
        allowed: false, 
        error: 'Failed to check delivery zone' 
      });
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Auto-check on mount if restaurant has location configured
    if (restaurant?.latitude && restaurant?.longitude) {
      handleCheck();
    }
  }, [restaurant?.id]);

  if (!restaurant?.latitude || !restaurant?.longitude) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        <MapPin className="text-primary mt-1" size={20} />
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Delivery Zone Check
          </h3>

          {checking && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader className="animate-spin" size={16} />
              <span>Checking your location...</span>
            </div>
          )}

          {!checking && !result && (
            <button
              onClick={handleCheck}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Check Delivery Availability
            </button>
          )}

          {result && !result.error && (
            <div className={`p-3 rounded-lg ${
              result.allowed 
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-start gap-2">
                {result.allowed ? (
                  <CheckCircle className="text-green-600 dark:text-green-400 mt-0.5" size={20} />
                ) : (
                  <AlertCircle className="text-red-600 dark:text-red-400 mt-0.5" size={20} />
                )}
                <div className="flex-1">
                  <p className={`font-medium ${
                    result.allowed 
                      ? 'text-green-800 dark:text-green-300' 
                      : 'text-red-800 dark:text-red-300'
                  }`}>
                    {result.allowed 
                      ? '✓ You are in the delivery zone!' 
                      : '✗ Outside delivery zone'}
                  </p>
                  <p className={`text-sm mt-1 ${
                    result.allowed 
                      ? 'text-green-700 dark:text-green-400' 
                      : 'text-red-700 dark:text-red-400'
                  }`}>
                    Distance: {result.distance} km
                    {restaurant.deliveryRadiusKm && (
                      <> (Max: {restaurant.deliveryRadiusKm} km)</>
                    )}
                  </p>
                  {!result.allowed && (
                    <p className="text-sm mt-2 text-red-600 dark:text-red-400">
                      Sorry, we don't deliver to your location yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {result?.error && (
            <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-yellow-600 dark:text-yellow-400 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-300">
                    Unable to check location
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    {result.error}
                  </p>
                  <button
                    onClick={handleCheck}
                    className="text-sm text-yellow-800 dark:text-yellow-300 underline mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Location Address Display */}
          {userLocation && (
            <div className="mt-4">
              <AddressDisplay
                latitude={userLocation.latitude}
                longitude={userLocation.longitude}
                showFullAddress={false}
                className="border-t border-gray-200 dark:border-gray-700 pt-4"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
