// API Configuration
// Can be overridden in Settings page (stored in localStorage)

// Get URLs from environment variables or use defaults
const PRODUCTION_API_URL = import.meta.env.VITE_API_URL || 'https://waitnot-backend-42e3.onrender.com';
const PRODUCTION_SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://waitnot-backend-42e3.onrender.com';

// Local Development URLs
const LOCAL_API_URL = 'http://localhost:5000/api';
const LOCAL_SOCKET_URL = 'http://localhost:5000';

// Determine if we're in development
const isDevelopment = import.meta.env.MODE === 'development';

// Use appropriate URLs based on environment
const defaultApiUrl = isDevelopment ? LOCAL_API_URL : (PRODUCTION_API_URL + '/api');
const defaultSocketUrl = isDevelopment ? LOCAL_SOCKET_URL : PRODUCTION_SOCKET_URL;

// Use environment URLs by default, can be overridden in Settings page
export const API_URL = localStorage.getItem('apiUrl') || defaultApiUrl;
export const SOCKET_URL = localStorage.getItem('socketUrl') || defaultSocketUrl;

// IMPORTANT: 
// - Production backend: https://waitnot-backend-42e3.onrender.com
// - Production frontend: https://waitnot-restaurant-app-jet.vercel.app
// - For local development, change URLs in Settings page
// - Or set localStorage: localStorage.setItem('apiUrl', 'http://localhost:5000/api')

// Note: Free tier Render services sleep after 15 min inactivity
// First request may take 30-60 seconds to wake up the service
