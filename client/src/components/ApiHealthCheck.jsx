import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, RefreshCw, Settings } from 'lucide-react';
import axios from 'axios';

const ApiHealthCheck = ({ onApiUrlChange }) => {
  const [health, setHealth] = useState({
    status: 'checking',
    message: 'Checking API connection...',
    details: null
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    checkApiHealth();
  }, []);

  const checkApiHealth = async () => {
    setHealth({
      status: 'checking',
      message: 'Checking API connection...',
      details: null
    });

    try {
      const startTime = Date.now();
      
      // Test health endpoint
      const healthResponse = await axios.get('/health', { timeout: 10000 });
      const healthTime = Date.now() - startTime;

      // Test restaurants endpoint
      const restaurantsResponse = await axios.get('/api/restaurants', { timeout: 10000 });
      const totalTime = Date.now() - startTime;

      setHealth({
        status: 'healthy',
        message: 'API is working correctly',
        details: {
          baseURL: axios.defaults.baseURL,
          healthCheck: {
            status: healthResponse.status,
            time: `${healthTime}ms`,
            data: healthResponse.data
          },
          restaurantsCheck: {
            status: restaurantsResponse.status,
            time: `${totalTime}ms`,
            count: restaurantsResponse.data?.length || 0
          }
        }
      });
    } catch (error) {
      console.error('API Health Check Failed:', error);
      
      setHealth({
        status: 'error',
        message: getErrorMessage(error),
        details: {
          baseURL: axios.defaults.baseURL,
          error: {
            message: error.message,
            status: error.response?.status,
            statusText: error.response?.statusText,
            url: error.config?.url
          }
        }
      });
    }
  };

  const getErrorMessage = (error) => {
    if (error.code === 'ECONNABORTED') {
      return 'API request timed out. Server might be sleeping.';
    } else if (error.response?.status === 404) {
      return 'API endpoint not found. Check the URL configuration.';
    } else if (error.response?.status >= 500) {
      return 'Server error. The backend service might be down.';
    } else if (error.message.includes('Network Error')) {
      return 'Network error. Check your internet connection.';
    } else {
      return `API connection failed: ${error.message}`;
    }
  };

  const fixApiUrl = () => {
    const correctUrl = 'https://waitnot-backend-42e3.onrender.com';
    localStorage.setItem('apiUrl', correctUrl + '/api');
    axios.defaults.baseURL = correctUrl;
    
    if (onApiUrlChange) {
      onApiUrlChange(correctUrl);
    }
    
    checkApiHealth();
  };

  const getStatusIcon = () => {
    switch (health.status) {
      case 'checking':
        return <RefreshCw className="animate-spin text-blue-500" size={20} />;
      case 'healthy':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'error':
        return <AlertCircle className="text-red-500" size={20} />;
      default:
        return <AlertCircle className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = () => {
    switch (health.status) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="font-medium text-gray-900">
            API Status
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={checkApiHealth}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
            title="Show Details"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      <p className="text-sm text-gray-700 mb-2">
        {health.message}
      </p>

      {health.status === 'error' && (
        <div className="space-y-2">
          <button
            onClick={fixApiUrl}
            className="w-full px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Fix API URL Configuration
          </button>
        </div>
      )}

      {showDetails && health.details && (
        <div className="mt-3 p-3 bg-white rounded border text-xs">
          <div className="space-y-2">
            <div>
              <strong>Base URL:</strong> {health.details.baseURL}
            </div>
            
            {health.details.healthCheck && (
              <div>
                <strong>Health Check:</strong> {health.details.healthCheck.status} 
                ({health.details.healthCheck.time})
              </div>
            )}
            
            {health.details.restaurantsCheck && (
              <div>
                <strong>Restaurants API:</strong> {health.details.restaurantsCheck.status} 
                ({health.details.restaurantsCheck.count} restaurants, {health.details.restaurantsCheck.time})
              </div>
            )}
            
            {health.details.error && (
              <div className="text-red-600">
                <strong>Error:</strong> {health.details.error.message}
                {health.details.error.status && (
                  <span> (Status: {health.details.error.status})</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiHealthCheck;