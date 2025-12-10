import { useState, useEffect } from 'react';
import { MapPin, Loader, RefreshCw, Copy, Check } from 'lucide-react';
import { reverseGeocode, getShortAddress } from '../utils/geocoding';

export default function AddressDisplay({ 
  latitude, 
  longitude, 
  onAddressFound,
  showFullAddress = true,
  className = ""
}) {
  const [address, setAddress] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      fetchAddress();
    }
  }, [latitude, longitude]);

  const fetchAddress = async () => {
    if (!latitude || !longitude) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await reverseGeocode(latitude, longitude);
      
      if (result.success) {
        setAddress(result);
        if (onAddressFound) {
          onAddressFound(result);
        }
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to get address');
      console.error('Address fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyCoordinates = () => {
    const coords = `${latitude}, ${longitude}`;
    copyToClipboard(coords);
  };

  const copyAddress = () => {
    if (address) {
      copyToClipboard(address.formatted || address.displayName);
    }
  };

  if (!latitude || !longitude) {
    return null;
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <MapPin className="text-blue-600 dark:text-blue-400 mt-1 flex-shrink-0" size={20} />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Location Details
          </h3>
          
          {/* Coordinates */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Coordinates
              </p>
              <button
                onClick={copyCoordinates}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                title="Copy coordinates"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm font-mono text-gray-800 dark:text-gray-200">
              {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Address
              </p>
              <div className="flex items-center gap-2">
                {address && (
                  <button
                    onClick={copyAddress}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                    title="Copy address"
                  >
                    <Copy size={12} />
                    Copy
                  </button>
                )}
                <button
                  onClick={fetchAddress}
                  disabled={loading}
                  className="text-xs text-gray-600 hover:text-gray-700 dark:text-gray-400 flex items-center gap-1"
                  title="Refresh address"
                >
                  <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>
            </div>
            
            {loading && (
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <Loader size={14} className="animate-spin" />
                Getting address...
              </div>
            )}
            
            {error && (
              <div className="text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}
            
            {address && !loading && (
              <div className="space-y-2">
                {showFullAddress ? (
                  <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {address.formatted || address.displayName}
                  </p>
                ) : (
                  <p className="text-sm text-gray-800 dark:text-gray-200">
                    {getShortAddress(address.address) || address.formatted}
                  </p>
                )}
                
                {/* Address Components */}
                {showFullAddress && address.address && (
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    {address.address.city && (
                      <div>
                        <span className="font-medium">City:</span> {address.address.city}
                      </div>
                    )}
                    {address.address.state && (
                      <div>
                        <span className="font-medium">State:</span> {address.address.state}
                      </div>
                    )}
                    {address.address.postcode && (
                      <div>
                        <span className="font-medium">Pincode:</span> {address.address.postcode}
                      </div>
                    )}
                    {address.address.country && (
                      <div>
                        <span className="font-medium">Country:</span> {address.address.country}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}