import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'
import './i18n'
import axios from 'axios'
import { API_URL } from './config'
import { BundleOptimizer, PerformanceMonitor } from './utils/performanceOptimizer'

// Performance monitoring
const renderMeasure = PerformanceMonitor.measureRender('App');

// Preconnect to external domains for faster loading
BundleOptimizer.preconnectDomain('https://waitnot-backend-42e3.onrender.com');
BundleOptimizer.preconnectDomain('https://fonts.googleapis.com');
BundleOptimizer.preconnectDomain('https://fonts.gstatic.com');

// Configure axios with performance optimizations
// CRITICAL: Always use the correct backend URL
const CORRECT_BACKEND_URL = 'https://waitnot-backend-42e3.onrender.com';
const WRONG_BACKEND_URL = 'waitnot-restaurant-app.onrender.com';

// Clear any cached wrong URLs
const savedApiUrl = localStorage.getItem('apiUrl');
if (savedApiUrl && savedApiUrl.includes(WRONG_BACKEND_URL)) {
  console.log('🔧 Clearing incorrect cached API URL...');
  localStorage.removeItem('apiUrl');
  localStorage.removeItem('socketUrl');
}

// Always use the correct backend URL
let baseURL = CORRECT_BACKEND_URL;

console.log('🌐 Environment API URL:', import.meta.env.VITE_API_URL);
console.log('🔧 Using backend URL:', baseURL);
console.log('✅ Correct backend: waitnot-backend-42e3.onrender.com');

axios.defaults.baseURL = baseURL;
axios.defaults.timeout = 30000 // Reduced from 60s to 30s for better UX
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Enable HTTP/2 and compression
axios.defaults.headers.common['Accept-Encoding'] = 'gzip, deflate, br'

// FORCE REDEPLOY - Updated timestamp: 2025-12-12
console.log('=== WaitNot App Starting ===')
console.log('🎯 CORRECT API Base URL:', axios.defaults.baseURL)
console.log('🎯 Full API URL with /api:', axios.defaults.baseURL + '/api')
console.log('Environment:', import.meta.env.MODE)
console.log('⚠️ If you see waitnot-restaurant-app.onrender.com, clear localStorage and refresh!')

// Optimized axios interceptors with performance monitoring
axios.interceptors.request.use(
  (config) => {
    // Add performance timing
    config.metadata = { startTime: performance.now() };
    
    // Add cache headers for GET requests
    if (config.method === 'get') {
      config.headers['Cache-Control'] = 'max-age=300'; // 5 minutes
    }
    
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = performance.now() - response.config.metadata.startTime;
    
    if (import.meta.env.DEV) {
      console.log(`API Response: ${response.status} ${response.config.url} (${duration.toFixed(2)}ms)`);
    }
    
    // Log slow requests
    if (duration > 2000) {
      console.warn(`Slow API request: ${response.config.url} took ${duration.toFixed(2)}ms`);
    }
    
    return response;
  },
  (error) => {
    const duration = error.config?.metadata ? 
      performance.now() - error.config.metadata.startTime : 0;
    
    console.error(`Response Error: ${error.message} ${error.config?.url} (${duration.toFixed(2)}ms)`);
    return Promise.reject(error);
  }
);

// Optimize React rendering
const root = ReactDOM.createRoot(document.getElementById('root'));

// Use concurrent features for better performance
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Complete render measurement
renderMeasure();

// Initialize performance monitoring
if (import.meta.env.DEV) {
  // Log performance metrics after initial render
  setTimeout(() => {
    const metrics = PerformanceMonitor.getMetrics();
    if (metrics) {
      console.log('🚀 Performance Metrics:', {
        'DOM Content Loaded': `${metrics.domContentLoaded.toFixed(2)}ms`,
        'Load Complete': `${metrics.loadComplete.toFixed(2)}ms`,
        'First Paint': `${metrics.firstPaint.toFixed(2)}ms`,
        'First Contentful Paint': `${metrics.firstContentfulPaint.toFixed(2)}ms`
      });
    }
  }, 2000);
}
