import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './index.css'
import './i18n'
import axios from 'axios'
import { API_URL } from './config'

// Configure axios base URL - can be overridden in Settings
const savedApiUrl = localStorage.getItem('apiUrl') || 'https://waitnot-restaurant-app.onrender.com/api'
axios.defaults.baseURL = savedApiUrl.replace('/api', '')
axios.defaults.timeout = 60000 // 60 seconds for video uploads

console.log('=== WaitNot App Starting ===')
console.log('API Base URL:', axios.defaults.baseURL)
console.log('Full API URL with /api:', axios.defaults.baseURL + '/api')
console.log('Environment:', import.meta.env.MODE)

// Add axios interceptor for debugging
axios.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

axios.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('Response Error:', error.message, error.config?.url)
    return Promise.reject(error)
  }
)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)
