import { useState, useEffect } from 'react';
import { MapPin, Clock, Trash2, Navigation } from 'lucide-react';
import axios from 'axios';

export default function SavedLocations({ onLocationSelect }) {
  const [savedLocations, setSavedLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedLocations();
  }, []);

  const fetchSavedLocations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get user data
      const userData = localStorage.getItem('user');
      if (!userData) {
        // If no user, try to get session-based locations
        const sessionId = localStorage.getItem('sessionId');
        if (!sessionId) {
          setLoading(false);
          return;
        }
      }
      
      const userId = userData ? JSON.parse(userData)._id : null;
      
      if (userId) {
        const response = await axios.get(`/api/locations/recent/${userId}`);
        setSavedLocations(response.data.locations);
      }
    } catch (err) {
      console.error('Error fetching saved locations:', err);
      setError('Failed to load saved locations');
    } finally {
      setLoading(false);
    }
  };

  const deleteLocation = async (locationId) => {
    try {
      await axios.delete(`/api/locations/${locationId}`);
      setSavedLocations(prev => prev.filter(loc => loc._id !== locationId));
    } catch (err) {
      console.error('Error deleting location:', err);
      setError('Failed to delete location');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLocationClick = (location) => {
    if (onLocationSelect) {
      onLocationSelect({
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address
      });
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  if (savedLocations.length === 0) {
    return (
      <div className="p-4 text-center">
        <MapPin className="mx-auto text-gray-400 mb-2" size={24} />
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No saved locations yet
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
          Detect your location to save it for quick access
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <MapPin size={16} />
        Recent Locations
      </h3>
      
      <div className="space-y-2">
        {savedLocations.map((location) => (
          <div
            key={location._id}
            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            onClick={() => handleLocationClick(location)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Navigation size={14} className="text-blue-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {location.address || `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  <span>{formatDate(location.createdAt)}</span>
                </div>
                <span>•</span>
                <span>{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteLocation(location._id);
              }}
              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete location"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
      
      {savedLocations.length >= 5 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
          Showing recent 5 locations
        </p>
      )}
    </div>
  );
}