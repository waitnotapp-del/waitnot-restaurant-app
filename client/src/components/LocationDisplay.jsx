import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, CheckCircle } from 'lucide-react';

const LocationDisplay = ({ location, showDetails = true, className = '' }) => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location?.latitude && location?.longitude && showDetails) {
      fetchAddress();
    }
  }, [location, showDetails]);

  const fetchAddress = async () => {
    if (!location?.latitude || !location?.longitude) return;
    
    setLoading(true);
    try {
      // Use reverse geocoding to get address
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${location.latitude}+${location.longitude}&key=YOUR_API_KEY&limit=1`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          setAddress(data.results[0].formatted);
        }
      } else {
        // Fallback to a simple format
        setAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
      }
    } catch (error) {
      console.log('Could not fetch address, using coordinates');
      setAddress(`${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`);
    } finally {
      setLoading(false);
    }
  };

  const openInMaps = () => {
    if (location?.latitude && location?.longitude) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      window.open(url, '_blank');
    }
  };

  if (!location) {
    return (
      <div className={`flex items-center gap-2 text-gray-500 ${className}`}>
        <MapPin size={16} />
        <span className="text-sm">Location not available</span>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Location Status */}
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle size={16} />
        <span className="text-sm font-medium">Location detected</span>
      </div>

      {/* Coordinates */}
      <div className="flex items-center gap-2 text-gray-600">
        <Navigation size={16} />
        <span className="text-sm">
          {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
        </span>
      </div>

      {/* Address */}
      {showDetails && (
        <div className="flex items-start gap-2 text-gray-600">
          <MapPin size={16} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                <span className="text-sm">Getting address...</span>
              </div>
            ) : (
              <div>
                <p className="text-sm">
                  {address || location.address || 'Address not available'}
                </p>
                <button
                  onClick={openInMaps}
                  className="text-xs text-blue-600 hover:underline mt-1"
                >
                  View on Google Maps →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timestamp */}
      {location.timestamp && (
        <div className="flex items-center gap-2 text-gray-500">
          <Clock size={16} />
          <span className="text-xs">
            Detected {new Date(location.timestamp).toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;