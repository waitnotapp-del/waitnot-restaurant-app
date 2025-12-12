// IMMEDIATE FIX FOR LOCATION SETTINGS 404 ERROR
// Run this in browser console (F12) on your frontend

console.log('🔧 Applying immediate fix for location settings...');

// 1. Fix the API URL configuration
const CORRECT_BACKEND = 'https://waitnot-backend-42e3.onrender.com';
const WRONG_BACKEND = 'https://waitnot-restaurant-app.onrender.com';

// Update localStorage
localStorage.setItem('apiUrl', CORRECT_BACKEND + '/api');
localStorage.setItem('socketUrl', CORRECT_BACKEND);

// Update axios configuration
if (typeof axios !== 'undefined') {
  axios.defaults.baseURL = CORRECT_BACKEND;
  console.log('✅ Axios baseURL updated to:', axios.defaults.baseURL);
} else {
  console.log('⚠️ Axios not found, will be updated on page reload');
}

// 2. Override the location save function temporarily
if (window.location.pathname.includes('restaurant-dashboard')) {
  console.log('🎯 Applying restaurant dashboard fix...');
  
  // Intercept fetch requests and redirect them
  const originalFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.includes(WRONG_BACKEND)) {
      url = url.replace(WRONG_BACKEND, CORRECT_BACKEND);
      console.log('🔄 Redirected API call to correct backend:', url);
    }
    return originalFetch.call(this, url, options);
  };
  
  // Also intercept axios requests
  if (typeof axios !== 'undefined' && axios.interceptors) {
    axios.interceptors.request.use(function (config) {
      if (config.url && config.url.includes(WRONG_BACKEND)) {
        config.url = config.url.replace(WRONG_BACKEND, CORRECT_BACKEND);
        console.log('🔄 Redirected axios call to correct backend:', config.url);
      }
      if (config.baseURL && config.baseURL.includes(WRONG_BACKEND)) {
        config.baseURL = CORRECT_BACKEND;
        console.log('🔄 Fixed axios baseURL:', config.baseURL);
      }
      return config;
    });
  }
}

// 3. Test the connection
console.log('🧪 Testing connection to correct backend...');
fetch(CORRECT_BACKEND + '/health')
  .then(response => response.json())
  .then(data => {
    console.log('✅ Backend health check successful:', data);
    
    // Test restaurants endpoint
    return fetch(CORRECT_BACKEND + '/api/restaurants');
  })
  .then(response => response.json())
  .then(data => {
    console.log('✅ Restaurants API working:', data.length, 'restaurants found');
  })
  .catch(error => {
    console.error('❌ Backend connection failed:', error);
  });

console.log('🎉 Fix applied! Try saving location settings now.');
console.log('📍 If it still fails, refresh the page and run this script again.');

// 4. Show current configuration
console.log('📋 Current Configuration:');
console.log('- localStorage apiUrl:', localStorage.getItem('apiUrl'));
console.log('- localStorage socketUrl:', localStorage.getItem('socketUrl'));
if (typeof axios !== 'undefined') {
  console.log('- axios baseURL:', axios.defaults.baseURL);
}