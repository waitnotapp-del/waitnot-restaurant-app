// Test script to verify the location-settings endpoint
// Run this in browser console or as a Node.js script

const API_BASE_URL = 'https://waitnot-backend-42e3.onrender.com';
const RESTAURANT_ID = 'midc8u9d91l99mo7yxq'; // The ID from the error

async function testLocationEndpoint() {
  console.log('🧪 Testing location-settings endpoint...');
  
  const testData = {
    latitude: 12.845966,
    longitude: 74.954028,
    deliveryRadiusKm: 5,
    address: 'Test Address, City'
  };

  try {
    // Test the endpoint
    const response = await fetch(`${API_BASE_URL}/api/restaurants/${RESTAURANT_ID}/location-settings`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response:', data);
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
      
      // Try to get more details
      if (response.status === 404) {
        console.log('🔍 404 Error - Endpoint not found. Checking if restaurant exists...');
        
        // Test if the restaurant exists
        const restaurantResponse = await fetch(`${API_BASE_URL}/api/restaurants/${RESTAURANT_ID}`);
        if (restaurantResponse.ok) {
          console.log('✅ Restaurant exists, but location-settings endpoint is missing');
        } else {
          console.log('❌ Restaurant not found');
        }
      }
    }
  } catch (error) {
    console.error('❌ Network Error:', error);
  }
}

// Also test the general restaurant endpoint
async function testRestaurantEndpoint() {
  console.log('🧪 Testing general restaurant endpoint...');
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/restaurants/${RESTAURANT_ID}`);
    console.log('📊 Restaurant Response Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Restaurant data:', {
        id: data._id,
        name: data.name,
        hasLocation: !!(data.latitude && data.longitude),
        location: data.latitude ? { lat: data.latitude, lon: data.longitude } : 'Not set'
      });
    } else {
      console.log('❌ Restaurant not found');
    }
  } catch (error) {
    console.error('❌ Error fetching restaurant:', error);
  }
}

// Test all available restaurant endpoints
async function testAllEndpoints() {
  console.log('🧪 Testing all restaurant endpoints...');
  
  const endpoints = [
    { method: 'GET', path: `/api/restaurants/${RESTAURANT_ID}`, name: 'Get Restaurant' },
    { method: 'PATCH', path: `/api/restaurants/${RESTAURANT_ID}`, name: 'Update Restaurant' },
    { method: 'PATCH', path: `/api/restaurants/${RESTAURANT_ID}/location-settings`, name: 'Update Location Settings' },
    { method: 'POST', path: `/api/restaurants/${RESTAURANT_ID}/check-delivery`, name: 'Check Delivery' }
  ];

  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' }
      };

      if (endpoint.method === 'PATCH' || endpoint.method === 'POST') {
        options.body = JSON.stringify({
          latitude: 12.845966,
          longitude: 74.954028,
          deliveryRadiusKm: 5
        });
      }

      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, options);
      console.log(`${endpoint.name}: ${response.status} ${response.statusText}`);
      
      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.log(`  Error: ${errorText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`${endpoint.name}: Network Error - ${error.message}`);
    }
  }
}

// Run tests
console.log('🚀 Starting endpoint tests...');
testRestaurantEndpoint();
testLocationEndpoint();
testAllEndpoints();

console.log('💡 To run this test:');
console.log('1. Open browser console on your app');
console.log('2. Copy and paste this entire script');
console.log('3. Check the results');