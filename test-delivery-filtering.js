// Test script to verify delivery radius filtering
// Run this in browser console to test the filtering logic

console.log('🧪 Testing Delivery Radius Filtering...');

// Test coordinates (you can change these)
const testUserLocation = {
  latitude: 12.846000,  // Close to restaurant locations
  longitude: 74.954000
};

// Sample restaurant data (similar to your actual data)
const testRestaurants = [
  {
    _id: 'test1',
    name: 'Test Restaurant 1',
    latitude: 12.845966,
    longitude: 74.954028,
    deliveryRadiusKm: 5,
    rating: 4.5
  },
  {
    _id: 'test2', 
    name: 'Test Restaurant 2',
    latitude: 12.846054,
    longitude: 74.95475,
    deliveryRadiusKm: 5,
    rating: 4.3
  },
  {
    _id: 'test3',
    name: 'Test Restaurant 3 (Far)',
    latitude: 13.000000,  // Much farther away
    longitude: 75.000000,
    deliveryRadiusKm: 5,
    rating: 4.8
  },
  {
    _id: 'test4',
    name: 'Test Restaurant 4 (No Location)',
    // No latitude/longitude
    deliveryRadiusKm: 5,
    rating: 4.0
  }
];

// Test the filtering function
function testDeliveryFiltering() {
  console.log('📍 User Location:', testUserLocation);
  console.log('🏪 Test Restaurants:', testRestaurants.length);
  
  // Import and test the filtering function
  // Note: This assumes the function is available in the global scope
  // In actual app, you'd import it properly
  
  testRestaurants.forEach(restaurant => {
    if (restaurant.latitude && restaurant.longitude) {
      // Calculate distance manually for verification
      const R = 6371; // Earth radius in km
      const dLat = (restaurant.latitude - testUserLocation.latitude) * Math.PI / 180;
      const dLon = (restaurant.longitude - testUserLocation.longitude) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(testUserLocation.latitude * Math.PI / 180) * Math.cos(restaurant.latitude * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      const withinRadius = distance <= restaurant.deliveryRadiusKm;
      
      console.log(`🏪 ${restaurant.name}:`, {
        distance: distance.toFixed(2) + 'km',
        deliveryRadius: restaurant.deliveryRadiusKm + 'km',
        withinRadius: withinRadius ? '✅' : '❌'
      });
    } else {
      console.log(`🏪 ${restaurant.name}: ⚠️ No location data`);
    }
  });
}

// Run the test
testDeliveryFiltering();

console.log('✅ Test completed. Check the results above.');
console.log('💡 To test with your actual location, update testUserLocation coordinates.');