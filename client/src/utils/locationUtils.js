// Haversine formula for calculating distances between coordinates
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

// Check if restaurant delivers to user location
export function isInDeliveryRadius(userLat, userLon, restaurantLat, restaurantLon, deliveryRadiusKm = 10) {
  const distance = calculateDistance(userLat, userLon, restaurantLat, restaurantLon);
  return distance <= deliveryRadiusKm;
}

// Get user's current location
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
}

// Sort restaurants by rating and distance
export function sortRestaurantsByRating(restaurants, userLocation = null) {
  return restaurants.sort((a, b) => {
    // Primary sort: by rating (descending)
    const ratingDiff = (b.rating || 0) - (a.rating || 0);
    
    if (Math.abs(ratingDiff) > 0.1) {
      return ratingDiff;
    }
    
    // Secondary sort: by distance (ascending) if ratings are similar
    if (userLocation && a.latitude && a.longitude && b.latitude && b.longitude) {
      const distanceA = calculateDistance(userLocation.lat, userLocation.lng, a.latitude, a.longitude);
      const distanceB = calculateDistance(userLocation.lat, userLocation.lng, b.latitude, b.longitude);
      return distanceA - distanceB;
    }
    
    return 0;
  });
}