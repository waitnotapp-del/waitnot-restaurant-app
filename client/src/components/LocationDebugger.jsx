import { useState, useEffect } from 'react';
import { MapPin, RefreshCw, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getUserLocation, watchUserLocation, clearLocationWatch } from '../utils/geolocation';

export default function LocationDebugger({ onLocationUpdate }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [locationHistory, setLocationHistory] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  const detectLocation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const locationData = await getUserLocation();
      setLocation(locationData);
      setLocationHistory(prev => [...prev, { ...locationData, id: Date.now() }].slice(-5));
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }
    } catch (err) {
      setError(err.message);
      console.error('Location detection failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const startWatching = () => {
    if (watchId) {
      clearLocationWatch(watchId);
      setWatchId(null);
      return;
    }

    const id = watchUserLocation((locationData) => {
      if (locationData.error) {
        setError(locationData.error);
      } else {
        setLocation(locationData);
        setLocationHistory(prev => [...prev, { ...locationData, id: Date.now() }].slice(-10));
        
        if (onLocationUpdate) {
          onLocationUpdate(locationData);
        }
      }
    });
    
    setWatchId(id);
  };

  useEffect(() => {
    return () => {
      if (watchId) {
        clearLocationWatch(watchId);
      }
    };
  }, [watchId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy <= 20) return 'text-green-600';
    if (accuracy <= 50) return 'text-yellow-600';
    if (accuracy <= 100) return 'text-orange-600';
    return 'text-red-600';
  };

  const getAccuracyLabel = (accuracy) => {
    if (accuracy <= 20) return 'Excellent';
    if (accuracy <= 50) return 'Good';
    if (accuracy <= 100) return 'Fair';
    return 'Poor';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <MapPin size={20} />
          Location Debugger
        </h3>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </button>
      </div>

      <div className="space-y-4">
        {/* Control Buttons */}
        <div className="flex gap-2">
          <button
            onClick={detectLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <MapPin size={16} />
            )}
            {loading ? 'Detecting...' : 'Detect Location'}
          </button>

          <button
            onClick={startWatching}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              watchId 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {watchId ? <XCircle size={16} /> : <CheckCircle size={16} />}
            {watchId ? 'Stop Watching' : 'Watch Location'}
          </button>
        </div>

        {/* Current Location */}
        {location && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Current Location</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Coordinates:</span>
                <button
                  onClick={() => copyToClipboard(`${location.latitude}, ${location.longitude}`)}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-mono"
                >
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </button>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Accuracy:</span>
                <span className={`font-medium ${getAccuracyColor(location.accuracy)}`}>
                  ±{location.accuracy}m ({getAccuracyLabel(location.accuracy)})
                </span>
              </div>

              {location.method && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Method:</span>
                  <span className="text-gray-900 dark:text-white">{location.method}</span>
                </div>
              )}

              {location.timestamp && (
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Time:</span>
                  <span className="text-gray-900 dark:text-white">
                    {location.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>

            {showDetails && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">Additional Details</h5>
                <div className="space-y-1 text-sm">
                  {location.altitude && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Altitude:</span>
                      <span className="text-gray-900 dark:text-white">{Math.round(location.altitude)}m</span>
                    </div>
                  )}
                  
                  {location.heading && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Heading:</span>
                      <span className="text-gray-900 dark:text-white">{Math.round(location.heading)}°</span>
                    </div>
                  )}
                  
                  {location.speed && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Speed:</span>
                      <span className="text-gray-900 dark:text-white">{Math.round(location.speed * 3.6)} km/h</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <XCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={16} />
              <div>
                <h4 className="font-medium text-red-800 dark:text-red-300">Location Error</h4>
                <p className="text-red-700 dark:text-red-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Location History */}
        {showDetails && locationHistory.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">Location History</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {locationHistory.slice().reverse().map((loc, index) => (
                <div key={loc.id} className="text-sm border-b border-gray-200 dark:border-gray-600 pb-2">
                  <div className="flex justify-between">
                    <span className="font-mono text-xs">
                      {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                    </span>
                    <span className={`text-xs ${getAccuracyColor(loc.accuracy)}`}>
                      ±{loc.accuracy}m
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {loc.timestamp.toLocaleTimeString()} • {loc.method || 'Unknown method'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={16} />
            <div>
              <h4 className="font-medium text-blue-800 dark:text-blue-300">Tips for Better Accuracy</h4>
              <ul className="text-blue-700 dark:text-blue-400 text-sm mt-1 space-y-1">
                <li>• Enable high accuracy mode in device settings</li>
                <li>• Ensure GPS is turned on</li>
                <li>• Go outdoors for better GPS signal</li>
                <li>• Allow location permissions for this site</li>
                <li>• Wait a few seconds for GPS to stabilize</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}