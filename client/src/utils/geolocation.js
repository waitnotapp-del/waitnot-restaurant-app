// Geolocation utilities for delivery zone checking

/**
 * Get user's current location with multiple methods and enhanced accuracy
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, method: string}>}
 */
export function getUserLocation() {
  return new Promise(async (resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    console.log('🎯 Starting enhanced location detection...');
    
    // Method 1: Ultra high accuracy with GPS
    const ultraHighAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0 // Force fresh location
    };

    // Method 2: High accuracy with some caching
    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 30000 // 30 seconds cache
    };

    // Method 3: Network-based location (faster but less accurate)
    const networkOptions = {
      enableHighAccuracy: false,
      timeout: 5000,
      maximumAge: 60000 // 1 minute cache
    };

    const methods = [
      { options: ultraHighAccuracyOptions, name: 'Ultra High Accuracy GPS', minAccuracy: 20 },
      { options: highAccuracyOptions, name: 'High Accuracy GPS', minAccuracy: 50 },
      { options: networkOptions, name: 'Network Location', minAccuracy: 1000 }
    ];

    let bestLocation = null;
    let methodIndex = 0;

    async function tryNextMethod() {
      if (methodIndex >= methods.length) {
        if (bestLocation) {
          console.log('✅ Using best available location:', bestLocation);
          resolve(bestLocation);
        } else {
          reject(new Error('Unable to obtain location after trying all methods'));
        }
        return;
      }

      const method = methods[methodIndex];
      console.log(`🔍 Trying method ${methodIndex + 1}: ${method.name}`);

      return new Promise((methodResolve) => {
        const timeoutId = setTimeout(() => {
          console.log(`⏰ Method ${methodIndex + 1} timed out`);
          methodIndex++;
          methodResolve();
          tryNextMethod();
        }, method.options.timeout);

        navigator.geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(timeoutId);
            const { latitude, longitude, accuracy, altitude, altitudeAccuracy, heading, speed } = position.coords;
            const timestamp = new Date(position.timestamp);
            
            const locationData = {
              latitude,
              longitude,
              accuracy: Math.round(accuracy),
              method: method.name,
              timestamp,
              altitude,
              altitudeAccuracy,
              heading,
              speed
            };

            console.log(`📍 Location from ${method.name}:`, {
              coordinates: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
              accuracy: `±${Math.round(accuracy)}m`,
              timestamp: timestamp.toLocaleTimeString(),
              altitude: altitude ? `${Math.round(altitude)}m` : 'N/A',
              heading: heading ? `${Math.round(heading)}°` : 'N/A',
              speed: speed ? `${Math.round(speed * 3.6)} km/h` : 'N/A'
            });

            // Check if this location is good enough
            if (accuracy <= method.minAccuracy) {
              console.log(`✅ Excellent accuracy (${Math.round(accuracy)}m), using this location`);
              resolve(locationData);
              return;
            }

            // Store as best location if it's better than what we have
            if (!bestLocation || accuracy < bestLocation.accuracy) {
              bestLocation = locationData;
              console.log(`💾 Stored as best location (${Math.round(accuracy)}m accuracy)`);
            }

            // Try next method for potentially better accuracy
            methodIndex++;
            methodResolve();
            tryNextMethod();
          },
          (error) => {
            clearTimeout(timeoutId);
            console.error(`❌ Method ${methodIndex + 1} failed:`, {
              code: error.code,
              message: error.message,
              method: method.name
            });

            // Try next method
            methodIndex++;
            methodResolve();
            tryNextMethod();
          },
          method.options
        );
      });
    }

    // Start trying methods
    tryNextMethod();
  });
}

/**
 * Get location with watchPosition for continuous updates
 * @param {Function} callback - Called with each location update
 * @returns {number} Watch ID for clearing the watch
 */
export function watchUserLocation(callback) {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by your browser");
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 5000
  };

  return navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      callback({
        latitude,
        longitude,
        accuracy: Math.round(accuracy),
        timestamp: new Date(position.timestamp)
      });
    },
    (error) => {
      console.error('Watch location error:', error);
      callback({ error: error.message });
    },
    options
  );
}

/**
 * Clear location watch
 * @param {number} watchId - Watch ID returned by watchUserLocation
 */
export function clearLocationWatch(watchId) {
  if (navigator.geolocation && watchId) {
    navigator.geolocation.clearWatch(watchId);
  }
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
