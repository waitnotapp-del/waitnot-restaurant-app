// API Configuration
// Can be overridden in Settings page (stored in localStorage)

// Production Backend URL (Render)
const PRODUCTION_API_URL = 'https://waitnot-backend.onrender.com/api';
const PRODUCTION_SOCKET_URL = 'https://waitnot-backend.onrender.com';

// Local Development URLs
const LOCAL_API_URL = 'http://localhost:5000/api';
const LOCAL_SOCKET_URL = 'http://localhost:5000';

// Use production URLs by default, can be overridden in Settings page
export const API_URL = localStorage.getItem('apiUrl') || PRODUCTION_API_URL;
export const SOCKET_URL = localStorage.getItem('socketUrl') || PRODUCTION_SOCKET_URL;

// IMPORTANT: 
// - Production backend: https://waitnot-backend.onrender.com
// - For local development, change URLs in Settings page
// - Or set localStorage: localStorage.setItem('apiUrl', 'http://localhost:5000/api')

// Note: Free tier Render services sleep after 15 min inactivity
// First request may take 30-60 seconds to wake up the service
