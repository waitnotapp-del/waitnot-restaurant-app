import axios from 'axios';
import { API_URL } from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL.replace('/api', ''), // Remove /api suffix if present
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store network error handler
let networkErrorHandler = null;

export const setNetworkErrorHandler = (handler) => {
  networkErrorHandler = handler;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('restaurantToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check for network errors
    if (!error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error')) {
      if (networkErrorHandler) {
        networkErrorHandler();
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('restaurantToken');
      window.location.href = '/restaurant-login';
    }
    return Promise.reject(error);
  }
);

export default api;
