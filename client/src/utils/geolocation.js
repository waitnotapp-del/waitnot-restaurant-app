// Geolocation utilities for delivery zone checking

/**
 * Get user's current location with improved accuracy and speed
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number}>}
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    // First try with high accuracy but shorter timeout for speed
    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 8000, // Reduced from 10000 for faster response
      maximumAge: 60000 // Allow 1-minute cached location for speed
    };

    // Fallback options with lower accuracy but faster response
    const fastOptions = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 300000 // Allow 5-minute cached location
    };

    let attemptCount = 0;
    const maxAttempts = 2;

    function attemptLocation(options, isHighAccuracy = true) {
      attemptCount++;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          console.log(`📍 Location obtained (attempt ${attemptCount}):`, {
            latitude: latitude.toFixed(6),
            longitude: longitude.toFixed(6),
            accuracy: `${accuracy}m`,
            highAccuracy: isHighAccuracy
          });
          
          // Accept location if accuracy is good enough or if it's our last attempt
          if (accuracy <= 100 || attemptCount >= maxAttempts) {
            resolve({ 
              latitude, 
              longitude, 
              accuracy: Math.round(accuracy) 
            });
          } else {
            // Try again with different settings if accuracy is poor
            console.log(`🔄 Poor accuracy (${accuracy}m), retrying...`);
            if (isHighAccuracy && attemptCount < maxAttempts) {
              attemptLocation(fastOptions, false);
            } else {
              resolve({ latitude, longitude, accuracy: Math.round(accuracy) });
            }
          }
        },
        (error) => {
          console.error(`❌ Location error (attempt ${attemptCount}):`, error.message);
          
          // Try fallback method if high accuracy fails
          if (isHighAccuracy && attemptCount < maxAttempts) {
            console.log('🔄 Trying with lower accuracy settings...');
            attemptLocation(fastOptions, false);
          } else {
            // Provide more specific error messages
            let errorMessage = 'Unable to get your location';
            switch (error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Location access denied. Please enable location permissions.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Location information unavailable. Please check your GPS.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Location request timed out. Please try again.';
                break;
            }
            reject(new Error(errorMessage));
          }
        },
        options
      );
    }

    // Start with high accuracy attempt
    attemptLocation(highAccuracyOptions, true);
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - First latitude
 * @param {number} lon1 - First longitude
 * @param {number} lat2 - Second latitude
 * @param {number} lon2 - Second longitude
 * @returns {number} Distance in kilometers
 */
export function getDistanceInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // in km
  return distance;
}

/**
 * Check if user is within delivery zone
 * @param {Object} restaurant - Restaurant object with coordinates and radius
 * @param {Object} userLocation - User location {latitude, longitude}
 * @returns {Object} {allowed: boolean, distance: number}
 */
export function checkDeliveryZone(restaurant, userLocation) {
  if (!restaurant.latitude || !restaurant.longitude || !restaurant.deliveryRadiusKm) {
    return { allowed: true, distance: 0, error: 'Restaurant location not configured' };
  }

  const distance = getDistanceInKm(
    userLocation.latitude,
    userLocation.longitude,
    restaurant.latitude,
    restaurant.longitude
  );

  return {
    allowed: distance <= restaurant.deliveryRadiusKm,
    distance: parseFloat(distance.toFixed(2))
  };
}

/**
 * Check delivery availability for a restaurant
 * @param {Object} restaurant - Restaurant object
 * @returns {Promise<Object>} {allowed: boolean, distance: number, userLocation?: Object, error?: string}
 */
export async function checkDeliveryAvailability(restaurant) {
  try {
    const userLocation = await getUserLocation();
    const result = checkDeliveryZone(restaurant, userLocation);
    return {
      ...result,
      userLocation
    };
  } catch (err) {
    console.error("Error getting user location:", err);
    return { 
      allowed: false, 
      distance: null, 
      error: err.message || 'Unable to get your location' 
    };
  }
}
