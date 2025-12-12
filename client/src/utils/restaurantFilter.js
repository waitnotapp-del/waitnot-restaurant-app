/**
 * Robust restaurant filtering utility
 * Filters restaurants based on user location and delivery radius
 */

/**
 * Calculate distance between two points using Haversine formula
 * @param {number} lat1 - First point latitude
 * @param {number} lon1 - First point longitude
 * @param {number} lat2 - Second point latitude
 * @param {number} lon2 - Second point longitude
 * @returns {number} Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Filter restaurants by proximity and delivery radius
 * @param {Array} restaurants - Array of restaurant objects
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @param {number} maxDistance - Maximum distance to consider (default: 50km)
 * @returns {Array} Filtered and sorted restaurants
 */
export function filterNearbyRestaurants(restaurants, userLat, userLon, maxDistance = 50) {
  console.log('🔍 Starting restaurant filtering:', {
    userLocation: { lat: userLat, lon: userLon },
    totalRestaurants: restaurants?.length || 0,
    maxDistance: maxDistance + 'km'
  });

  if (!userLat || !userLon || !Array.isArray(restaurants)) {
    console.log('❌ Invalid filtering parameters');
    return restaurants || [];
  }

  const results = [];
  let restaurantsWithLocation = 0;
  let restaurantsWithinRange = 0;

  restaurants.forEach(restaurant => {
    // Check if restaurant has location data
    if (!restaurant.latitude || !restaurant.longitude) {
      console.log(`⚠️ Restaurant "${restaurant.name}" has no location data`);
      // Include restaurants without location data but mark them
      results.push({
        ...restaurant,
        distanceKm: null,
        deliveryStatus: 'no_location_data',
        isNearby: true // Allow ordering for restaurants without location
      });
      return;
    }

    restaurantsWithLocation++;

    // Calculate distance
    const distance = calculateDistance(
      userLat, userLon,
      restaurant.latitude, restaurant.longitude
    );

    // Get delivery radius (default to 10km if not specified)
    const deliveryRadius = restaurant.deliveryRadiusKm || restaurant.deliveryRadius || 10;

    // Check if within delivery radius
    const withinDeliveryRadius = distance <= deliveryRadius;
    
    // Check if within reasonable proximity (to avoid showing restaurants too far away)
    const withinMaxDistance = distance <= maxDistance;

    console.log(`📍 ${restaurant.name}:`, {
      distance: distance.toFixed(2) + 'km',
      deliveryRadius: deliveryRadius + 'km',
      withinDeliveryRadius: withinDeliveryRadius ? '✅' : '❌',
      withinMaxDistance: withinMaxDistance ? '✅' : '❌'
    });

    // Only include restaurants that are within reasonable distance
    if (withinMaxDistance) {
      if (withinDeliveryRadius) {
        restaurantsWithinRange++;
      }

      results.push({
        ...restaurant,
        distanceKm: parseFloat(distance.toFixed(2)),
        deliveryStatus: withinDeliveryRadius ? 'delivers' : 'out_of_delivery_range',
        isNearby: true,
        deliveryRadius: deliveryRadius
      });
    } else {
      console.log(`🚫 ${restaurant.name} too far (${distance.toFixed(2)}km > ${maxDistance}km)`);
    }
  });

  // Sort by delivery availability first, then by distance, then by rating
  const sortedResults = results.sort((a, b) => {
    // Prioritize restaurants that deliver
    if (a.deliveryStatus === 'delivers' && b.deliveryStatus !== 'delivers') return -1;
    if (b.deliveryStatus === 'delivers' && a.deliveryStatus !== 'delivers') return 1;

    // Then sort by distance (closest first)
    if (a.distanceKm !== null && b.distanceKm !== null) {
      if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) {
        return a.distanceKm - b.distanceKm;
      }
    }

    // If distances are similar, sort by rating
    return (b.rating || 0) - (a.rating || 0);
  });

  console.log('📊 Filtering Summary:', {
    totalRestaurants: restaurants.length,
    restaurantsWithLocation: restaurantsWithLocation,
    restaurantsInRange: results.length,
    restaurantsWithinDeliveryRadius: restaurantsWithinRange,
    filtered: restaurants.length - results.length
  });

  return sortedResults;
}

/**
 * Get only restaurants that deliver to user's location
 * @param {Array} restaurants - Array of restaurant objects
 * @param {number} userLat - User's latitude
 * @param {number} userLon - User's longitude
 * @returns {Array} Restaurants that deliver to user's location
 */
export function getDeliveringRestaurants(restaurants, userLat, userLon) {
  const nearbyRestaurants = filterNearbyRestaurants(restaurants, userLat, userLon);
  
  // Filter to only include restaurants that deliver or have no location data
  const deliveringRestaurants = nearbyRestaurants.filter(restaurant => 
    restaurant.deliveryStatus === 'delivers' || 
    restaurant.deliveryStatus === 'no_location_data'
  );

  console.log('🚚 Delivering restaurants:', {
    total: nearbyRestaurants.length,
    delivering: deliveringRestaurants.length,
    percentage: Math.round((deliveringRestaurants.length / nearbyRestaurants.length) * 100) + '%'
  });

  return deliveringRestaurants;
}