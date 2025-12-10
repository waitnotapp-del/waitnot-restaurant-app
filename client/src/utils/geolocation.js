// Geolocation utilities for delivery zone checking

/**
 * Get user's current location
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser"));
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
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
