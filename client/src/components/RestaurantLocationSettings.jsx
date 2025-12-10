import { useState, useEffect } from 'react';
import { MapPin, Save, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import AddressDisplay from './AddressDisplay';

export default function RestaurantLocationSettings({ restaurant, onSave }) {
  const [formData, setFormData] = useState({
    latitude: restaurant?.latitude || '',
    longitude: restaurant?.longitude || '',
    deliveryRadiusKm: restaurant?.deliveryRadiusKm || 5,
    address: restaurant?.address || ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'deliveryRadiusKm' ? parseFloat(value) : value
    }));
  };

  const getCurrentLocation = () => {
    setGettingLocation(true);
    if (!navigator.geolocation) {
      setMessage({ type: 'error', text: 'Geolocation is not supported by your browser' });
      setGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6)
        }));
        setMessage({ type: 'success', text: 'Location captured successfully!' });
        setGettingLocation(false);
      },
      (error) => {
        setMessage({ type: 'error', text: 'Failed to get location: ' + error.message });
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.latitude || !formData.longitude) {
      setMessage({ type: 'error', text: 'Please provide latitude and longitude' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await onSave(formData);
      setMessage({ type: 'success', text: 'Location settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const openInGoogleMaps = () => {
    if (formData.latitude && formData.longitude) {
      window.open(`https://www.google.com/maps?q=${formData.latitude},${formData.longitude}`, '_blank');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <MapPin className="text-primary" size={20} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Delivery Zone Settings
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Configure your restaurant location and delivery radius
          </p>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg flex items-start gap-3 ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="text-green-600 dark:text-green-400 flex-shrink-0" size={20} />
          ) : (
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={20} />
          )}
          <p className={message.type === 'success' 
            ? 'text-green-800 dark:text-green-300' 
            : 'text-red-800 dark:text-red-300'
          }>
            {message.text}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Restaurant Address
          </label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main Street, City, Country"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Coordinates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Latitude *
            </label>
            <input
              type="number"
              name="latitude"
              value={formData.latitude}
              onChange={handleChange}
              step="0.000001"
              placeholder="e.g., 40.712776"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Longitude *
            </label>
            <input
              type="number"
              name="longitude"
              value={formData.longitude}
              onChange={handleChange}
              step="0.000001"
              placeholder="e.g., -74.005974"
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Get Current Location Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            {gettingLocation ? (
              <Loader className="animate-spin" size={16} />
            ) : (
              <MapPin size={16} />
            )}
            {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
          </button>
          
          {formData.latitude && formData.longitude && (
            <button
              type="button"
              onClick={openInGoogleMaps}
              className="px-4 py-2 text-primary hover:underline"
            >
              View on Map →
            </button>
          )}
        </div>

        {/* Address Display */}
        {formData.latitude && formData.longitude && (
          <AddressDisplay
            latitude={parseFloat(formData.latitude)}
            longitude={parseFloat(formData.longitude)}
            showFullAddress={true}
            onAddressFound={(address) => {
              if (address.success && !formData.address) {
                setFormData(prev => ({
                  ...prev,
                  address: address.formatted || address.displayName
                }));
              }
            }}
          />
        )}

        {/* Delivery Radius */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Delivery Radius (km) *
          </label>
          <input
            type="number"
            name="deliveryRadiusKm"
            value={formData.deliveryRadiusKm}
            onChange={handleChange}
            min="0.5"
            max="100"
            step="0.5"
            required
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Maximum distance for delivery (0.5 - 100 km)
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>💡 Tip:</strong> You can find your coordinates by:
          </p>
          <ul className="text-sm text-blue-700 dark:text-blue-400 mt-2 ml-4 list-disc space-y-1">
            <li>Using the "Use Current Location" button above</li>
            <li>Right-clicking on Google Maps and selecting coordinates</li>
            <li>Searching your address on Google Maps and copying the URL coordinates</li>
          </ul>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 font-medium"
        >
          {saving ? (
            <>
              <Loader className="animate-spin" size={20} />
              Saving...
            </>
          ) : (
            <>
              <Save size={20} />
              Save Location Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}
