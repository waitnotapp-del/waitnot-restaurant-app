// Fix API URL Configuration Script
// Run this in browser console to fix API URL issues

console.log('🔧 Fixing API URL Configuration...');

// Check current configuration
console.log('Current localStorage apiUrl:', localStorage.getItem('apiUrl'));
console.log('Current axios baseURL:', axios.defaults.baseURL);

// Correct API URLs - Updated with actual deployment URLs
const CORRECT_API_URL = 'https://waitnot-backend-42e3.onrender.com/api';
const CORRECT_BASE_URL = 'https://waitnot-backend-42e3.onrender.com';

// Update localStorage
localStorage.setItem('apiUrl', CORRECT_API_URL);
localStorage.setItem('socketUrl', CORRECT_BASE_URL);

// Update axios configuration
axios.defaults.baseURL = CORRECT_BASE_URL;

console.log('✅ API URL Configuration Fixed!');
console.log('New apiUrl:', localStorage.getItem('apiUrl'));
console.log('New axios baseURL:', axios.defaults.baseURL);

// Test the API
console.log('🧪 Testing API connection...');
fetch(CORRECT_API_URL.replace('/api', '') + '/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ API Health Check:', data);
  })
  .catch(error => {
    console.error('❌ API Health Check Failed:', error);
  });

// Test restaurants endpoint
fetch(CORRECT_API_URL.replace('/api', '') + '/api/restaurants')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Restaurants API:', data.length, 'restaurants found');
  })
  .catch(error => {
    console.error('❌ Restaurants API Failed:', error);
  });

console.log('🔄 Please refresh the page to apply changes.');