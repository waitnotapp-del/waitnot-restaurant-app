// API Configuration
// CRITICAL: Always use the correct backend URL

// CORRECT BACKEND URL - DO NOT CHANGE
const CORRECT_BACKEND = 'https://waitnot-backend-42e3.onrender.com';
const WRONG_BACKEND = 'waitnot-restaurant-app.onrender.com';

// Local Development URLs
const LOCAL_API_URL = 'http://localhost:5000/api';
const LOCAL_SOCKET_URL = 'http://localhost:5000';

// Determine if we're in development
const isDevelopment = import.meta.env.MODE === 'development';

// Clear any cached wrong URLs
const savedApiUrl = localStorage.getItem('apiUrl');
if (savedApiUrl && savedApiUrl.includes(WRONG_BACKEND)) {
  console.log('🔧 Config: Clearing incorrect cached API URL...');
  localStorage.removeItem('apiUrl');
  localStorage.removeItem('socketUrl');
}

// Use appropriate URLs based on environment
const defaultApiUrl = isDevelopment ? LOCAL_API_URL : (CORRECT_BACKEND + '/api');
const defaultSocketUrl = isDevelopment ? LOCAL_SOCKET_URL : CORRECT_BACKEND;

// Always use correct URLs - ignore localStorage if it has wrong URL
const storedApiUrl = localStorage.getItem('apiUrl');
const storedSocketUrl = localStorage.getItem('socketUrl');

export const API_URL = (storedApiUrl && !storedApiUrl.includes(WRONG_BACKEND)) 
  ? storedApiUrl 
  : defaultApiUrl;
  
export const SOCKET_URL = (storedSocketUrl && !storedSocketUrl.includes(WRONG_BACKEND)) 
  ? storedSocketUrl 
  : defaultSocketUrl;

// IMPORTANT: 
// - Production backend: https://waitnot-backend-42e3.onrender.com
// - Production frontend: https://waitnot-restaurant-app-jet.vercel.app
// - For local development, change URLs in Settings page
// - Or set localStorage: localStorage.setItem('apiUrl', 'http://localhost:5000/api')

// Note: Free tier Render services sleep after 15 min inactivity
// First request may take 30-60 seconds to wake up the service
