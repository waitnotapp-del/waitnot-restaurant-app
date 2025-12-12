import React, { useState, useEffect } from 'react';
import { MapPin, Clock, Trash2, Navigation, RefreshCw } from 'lucide-react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import LocationDisplay from './LocationDisplay';

const SavedLocationsList = ({ userId, onLocationSelect }) => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (userId) {
      fetchSavedLocations();
    } else {
      // Load from localStorage if no user ID
      loadLocalLocations();
    }
  }, [userId]);

  const fetchSavedLocations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/locations/user/${userId}`);
      setLocations(response.data.locations || []);
    } catch (error) {
      console.error('Error fetching saved locations:', error);
      showError('Failed to load saved locations');
    } finally {
      setLoading(false);
    }
  };

  const loadLocalLocations = () => {
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        setLocations([{
          _id: 'local',
          ...locationData,
          source: 'local_storage'
        }]);
      }
    } catch (error) {
      console.error('Error loading local locations:', error);
    }
  };

  const deleteLocation = async (locationId) => {
    if (!confirm('Are you sure you want to delete this location?')) return;

    try {
      if (locationId === 'local') {
        localStorage.removeItem('userLocation');
        setLocations([]);
        showSuccess('Local location cleared');
        return;
      }

      await axios.delete(`/api/locations/${locationId}`);
      setLocations(prev => prev.filter(loc => loc._id !== locationId));
      showSuccess('Location deleted successfully');
    } catch (error) {
      console.error('Error deleting location:', error);
      showError('Failed to delete location');
    }
  };

  const selectLocation = (location) => {
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    showSuccess('Location selected');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <RefreshCw className="animate-spin mr-2" size={20} />
        <span>Loading saved locations...</span>
      </div>
    );
  }

  if (locations.length === 0) {
    return (
      <div className="text-center p-6 text-gray-500">
        <MapPin size={48} className="mx-auto mb-2 opacity-50" />
        <p>No saved locations found</p>
        <p className="text-sm mt-1">Detect your location to save it for quick access</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📍 Saved Locations ({locations.length})
      </h3>
      
      {locations.map((location) => (
        <div
          key={location._id}
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <LocationDisplay 
                location={location} 
                showDetails={true}
                className="text-gray-700 dark:text-gray-300"
              />
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => selectLocation(location)}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Use this location"
              >
                <Navigation size={16} />
              </button>
              
              <button
                onClick={() => deleteLocation(location._id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete location"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {/* Additional Info */}
          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
            {location.source && (
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                {location.source === 'local_storage' ? 'Local' : 'Saved'}
              </span>
            )}
            
            {location.createdAt && (
              <span className="flex items-center gap-1">
                <Clock size={12} />
                Saved {new Date(location.createdAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
      
      {userId && (
        <button
          onClick={fetchSavedLocations}
          className="w-full p-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh Locations
        </button>
      )}
    </div>
  );
};

export default SavedLocationsList;