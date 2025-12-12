/**
 * Restaurant location API utility with fallback mechanisms
 */

/**
 * Update restaurant location settings with fallback
 * @param {string} restaurantId - Restaurant ID
 * @param {object} locationData - Location data to update
 * @returns {Promise<object>} Updated restaurant data
 */
export async function updateRestaurantLocation(restaurantId, locationData) {
  console.log('📍 Updating restaurant location:', { restaurantId, locationData });

  const { latitude, longitude, deliveryRadiusKm, address } = locationData;

  // Validate input data
  if (latitude !== undefined && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
    throw new Error('Invalid latitude. Must be between -90 and 90');
  }
  
  if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
    throw new Error('Invalid longitude. Must be between -180 and 180');
  }
  
  if (deliveryRadiusKm !== undefined && (isNaN(deliveryRadiusKm) || deliveryRadiusKm < 0)) {
    throw new Error('Invalid delivery radius. Must be a positive number');
  }

  const payload = {};
  if (latitude !== undefined) payload.latitude = parseFloat(latitude);
  if (longitude !== undefined) payload.longitude = parseFloat(longitude);
  if (deliveryRadiusKm !== undefined) payload.deliveryRadiusKm = parseFloat(deliveryRadiusKm);
  if (address !== undefined) payload.address = address;

  console.log('📤 Sending payload:', payload);

  // Try the specific location-settings endpoint first
  try {
    console.log('🎯 Trying location-settings endpoint...');
    const response = await fetch(`/api/restaurants/${restaurantId}/location-settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Location updated via location-settings endpoint');
      return data;
    } else if (response.status === 404) {
      console.log('⚠️ Location-settings endpoint not found, trying fallback...');
      // Fall through to fallback method
    } else {
      const errorText = await response.text();
      console.error('❌ Location-settings endpoint error:', errorText);
      throw new Error(`Failed to update location: ${errorText}`);
    }
  } catch (error) {
    if (error.message.includes('fetch')) {
      console.log('🌐 Network error with location-settings, trying fallback...');
      // Fall through to fallback method
    } else {
      throw error;
    }
  }

  // Fallback: Try the general restaurant update endpoint
  try {
    console.log('🔄 Trying general restaurant update endpoint...');
    const response = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Location updated via general update endpoint');
      return data;
    } else {
      const errorText = await response.text();
      console.error('❌ General update endpoint error:', errorText);
      throw new Error(`Failed to update location: ${errorText}`);
    }
  } catch (error) {
    console.error('❌ All endpoints failed:', error);
    throw new Error(`Failed to update restaurant location: ${error.message}`);
  }
}

/**
 * Get restaurant location data
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<object>} Restaurant data with location
 */
export async function getRestaurantLocation(restaurantId) {
  try {
    const response = await fetch(`/api/restaurants/${restaurantId}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch restaurant: ${response.statusText}`);
    }
    
    const restaurant = await response.json();
    
    return {
      id: restaurant._id,
      name: restaurant.name,
      latitude: restaurant.latitude,
      longitude: restaurant.longitude,
      deliveryRadiusKm: restaurant.deliveryRadiusKm,
      address: restaurant.address,
      hasLocation: !!(restaurant.latitude && restaurant.longitude)
    };
  } catch (error) {
    console.error('Error fetching restaurant location:', error);
    throw error;
  }
}

/**
 * Test restaurant location endpoints
 * @param {string} restaurantId - Restaurant ID
 * @returns {Promise<object>} Test results
 */
export async function testLocationEndpoints(restaurantId) {
  console.log('🧪 Testing restaurant location endpoints...');
  
  const results = {
    restaurantExists: false,
    locationSettingsEndpoint: false,
    generalUpdateEndpoint: false,
    currentLocation: null
  };

  // Test if restaurant exists
  try {
    const response = await fetch(`/api/restaurants/${restaurantId}`);
    results.restaurantExists = response.ok;
    
    if (response.ok) {
      const data = await response.json();
      results.currentLocation = {
        latitude: data.latitude,
        longitude: data.longitude,
        deliveryRadiusKm: data.deliveryRadiusKm,
        address: data.address
      };
    }
  } catch (error) {
    console.log('Restaurant fetch failed:', error);
  }

  // Test location-settings endpoint
  try {
    const response = await fetch(`/api/restaurants/${restaurantId}/location-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryRadiusKm: 5 }) // Minimal test data
    });
    results.locationSettingsEndpoint = response.ok || response.status !== 404;
  } catch (error) {
    console.log('Location-settings endpoint test failed:', error);
  }

  // Test general update endpoint
  try {
    const response = await fetch(`/api/restaurants/${restaurantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryRadiusKm: 5 }) // Minimal test data
    });
    results.generalUpdateEndpoint = response.ok;
  } catch (error) {
    console.log('General update endpoint test failed:', error);
  }

  console.log('🧪 Test results:', results);
  return results;
}