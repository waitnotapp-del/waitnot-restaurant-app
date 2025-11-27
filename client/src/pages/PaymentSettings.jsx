import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, Wallet, Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';

export default function PaymentSettings() {
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [settings, setSettings] = useState({
    upiId: '',
    upiName: '',
    acceptCash: true,
    acceptUPI: false
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const restaurantData = localStorage.getItem('restaurant');
    if (!restaurantData) {
      navigate('/restaurant-login');
      return;
    }
    
    const rest = JSON.parse(restaurantData);
    setRestaurant(rest);
    
    // Load existing payment settings
    if (rest.paymentSettings) {
      setSettings(rest.paymentSettings);
    }
  }, [navigate]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      const { data } = await axios.patch(
        `/api/restaurants/${restaurant._id}/payment-settings`,
        settings
      );
      
      // Update local storage
      localStorage.setItem('restaurant', JSON.stringify(data));
      setRestaurant(data);
      
      setMessage('Payment settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving payment settings:', error);
      setMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!restaurant) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/restaurant-dashboard')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Payment Settings</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Success Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('success') 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* Payment Methods */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            Accepted Payment Methods
          </h2>
          
          <div className="space-y-4">
            {/* Cash on Delivery */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="checkbox"
                checked={settings.acceptCash}
                onChange={(e) => setSettings({...settings, acceptCash: e.target.checked})}
                className="w-5 h-5 accent-primary"
              />
              <Wallet size={24} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">Cash on Delivery</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accept cash payments from customers</p>
              </div>
            </label>

            {/* UPI Payment */}
            <label className="flex items-center gap-3 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary transition-colors">
              <input
                type="checkbox"
                checked={settings.acceptUPI}
                onChange={(e) => setSettings({...settings, acceptUPI: e.target.checked})}
                className="w-5 h-5 accent-primary"
              />
              <Smartphone size={24} className="text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-gray-800 dark:text-white">UPI Payment</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accept online UPI payments</p>
              </div>
            </label>
          </div>
        </div>

        {/* UPI Details */}
        {settings.acceptUPI && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              UPI Details
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={settings.upiId}
                  onChange={(e) => setSettings({...settings, upiId: e.target.value})}
                  placeholder="yourname@paytm"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Enter your UPI ID (e.g., yourname@paytm, yourname@phonepe)
                </p>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2 font-semibold">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  value={settings.upiName}
                  onChange={(e) => setSettings({...settings, upiName: e.target.value})}
                  placeholder="Restaurant Name"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving || (!settings.acceptCash && !settings.acceptUPI)}
          className="w-full bg-primary text-white py-3 rounded-lg hover:bg-red-600 font-semibold text-lg transition-colors shadow-md flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>

        {!settings.acceptCash && !settings.acceptUPI && (
          <p className="text-center text-red-600 dark:text-red-400 mt-4">
            Please enable at least one payment method
          </p>
        )}
      </div>
    </div>
  );
}
