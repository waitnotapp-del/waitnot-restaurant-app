// Haversine formula to calculate distance between two points on Earth
const R = 6371; // Earth radius in kilometers

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function haversineDistanceKm(lat1, lon1, lat2, lon2) {
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
 * Check if a point is within delivery radius of a restaurant
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} restLat - Restaurant's latitude
 * @param {number} restLon - Restaurant's longitude
 * @param {number} deliveryRadius - Restaurant's delivery radius in km
 * @returns {boolean} True if within delivery radius
 */
export function isWithinDeliveryRadius(userLat, userLon, restLat, restLon, deliveryRadius) {
  const distance = haversineDistanceKm(userLat, userLon, restLat, restLon);
  return distance <= deliveryRadius;
}