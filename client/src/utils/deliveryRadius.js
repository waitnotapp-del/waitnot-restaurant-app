/**
 * Utility functions for delivery radius calculations
 */

/**
 * Haversine formula to calculate distance between two points on Earth
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in kilometers
  const toRad = (deg) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}

/**
 * Check if a user location is within a restaurant's delivery radius
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} restLat - Restaurant's latitude
 * @param {number} restLon - Restaurant's longitude
 * @param {number} deliveryRadius - Restaurant's delivery radius in km (default: 10km)
 * @returns {object} Object with isWithinRadius boolean and distance
 */
export function checkDeliveryRadius(userLat, userLon, restLat, restLon, deliveryRadius = 10) {
  if (!userLat || !userLon || !restLat || !restLon) {
    return { isWithinRadius: false, distance: null, error: 'Missing coordinates' };
  }
  
  const distance = calculateDistance(userLat, userLon, restLat, restLon);
  const isWithinRadius = distance <= deliveryRadius;
  
  return {
    isWithinRadius,
    distance: parseFloat(distance.toFixed(2)),
    deliveryRadius
  };
}

/**
 * Filter restaurants by delivery radius based on user location
 * @param {Array} restaurants - Array of restaurant objects
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Array} Filtered restaurants with distance information
 */
export function filterRestaurantsByDeliveryRadius(restaurants, userLat, userLon) {
  if (!userLat || !userLon || !Array.isArray(restaurants)) {
    return restaurants;
  }
  
  return restaurants
    .map(restaurant => {
      // Skip restaurants without location data
      if (!restaurant.latitude || !restaurant.longitude) {
        return {
          ...restaurant,
          distanceKm: null,
          isWithinDeliveryRadius: true, // Allow if no location data
          deliveryStatus: 'location_not_configured'
        };
      }
      
      const deliveryRadius = restaurant.deliveryRadiusKm || restaurant.deliveryRadius || 10; // Default 10km
      const result = checkDeliveryRadius(userLat, userLon, restaurant.latitude, restaurant.longitude, deliveryRadius);
      
      return {
        ...restaurant,
        distanceKm: result.distance,
        isWithinDeliveryRadius: result.isWithinRadius,
        deliveryRadius: result.deliveryRadius,
        deliveryStatus: result.isWithinRadius ? 'available' : 'out_of_range'
      };
    })
    .filter(restaurant => restaurant.isWithinDeliveryRadius) // Only show restaurants within delivery range
    .sort((a, b) => {
      // Sort by distance (closest first), then by rating
      if (a.distanceKm === null && b.distanceKm === null) return 0;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      
      // If distances are similar (within 0.5km), sort by rating
      return (b.rating || 0) - (a.rating || 0);
    });
}

/**
 * Check delivery availability for a specific restaurant
 * @param {string} restaurantId - Restaurant ID
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Promise<object>} Delivery availability result
 */
export async function checkRestaurantDelivery(restaurantId, userLat, userLon) {
  try {
    const response = await fetch(`/api/restaurants/${restaurantId}/check-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userLatitude: userLat,
        userLongitude: userLon
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to check delivery availability');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking delivery availability:', error);
    return {
      allowed: false,
      error: error.message
    };
  }
}