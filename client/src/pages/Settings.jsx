import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings as SettingsIcon, Save, RotateCcw, Wifi } from 'lucide-react';
import { App as CapacitorApp } from '@capacitor/app';

export default function Settings() {
  const navigate = useNavigate();
  const [apiUrl, setApiUrl] = useState('');
  const [socketUrl, setSocketUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Load saved URLs or use defaults
    const savedApiUrl = localStorage.getItem('apiUrl') || 'http://localhost:5000/api';
    const savedSocketUrl = localStorage.getItem('socketUrl') || 'http://localhost:5000';
    setApiUrl(savedApiUrl);
    setSocketUrl(savedSocketUrl);
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backButtonListener = CapacitorApp.addListener('backButton', (data) => {
      // Always navigate to home, don't use default back behavior
      window.location.href = '/';
    });

    return () => {
      backButtonListener.remove();
    };
  }, []);

  const handleSave = () => {
    localStorage.setItem('apiUrl', apiUrl);
    localStorage.setItem('socketUrl', socketUrl);
    
    // Show success message
    alert('Settings saved! The app will reload now.');
    
    // Reload the app to apply new settings
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  };

  const handleReset = () => {
    const defaultApiUrl = 'http://localhost:5000/api';
    const defaultSocketUrl = 'http://localhost:5000';
    setApiUrl(defaultApiUrl);
    setSocketUrl(defaultSocketUrl);
    localStorage.setItem('apiUrl', defaultApiUrl);
    localStorage.setItem('socketUrl', defaultSocketUrl);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const testUrl = apiUrl.replace('/api', '') + '/api/restaurants';
      
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(testUrl, { 
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `✓ Connected! Found ${data.length} restaurants`
        });
      } else {
        setTestResult({
          success: false,
          message: `✗ Server responded with error: ${response.status}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `✗ Connection failed: ${error.message}`
      });
    } finally {
      setTesting(false);
    }
  };

  const presets = [
    { name: 'Production', api: 'https://waitnot-restaurant-app.onrender.com/api', socket: 'https://waitnot-restaurant-app.onrender.com' },
    { name: 'Localhost', api: 'http://localhost:5000/api', socket: 'http://localhost:5000' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg">
              ←
            </button>
            <SettingsIcon className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">Server Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📱 Mobile Device Setup</h3>
          <p className="text-sm text-blue-800">
            If you're using this app on a mobile device, you need to enter your computer's IP address
            instead of localhost. Make sure both devices are on the same WiFi network.
          </p>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quick Presets
          </label>
          <div className="grid grid-cols-2 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => {
                  setApiUrl(preset.api);
                  setSocketUrl(preset.socket);
                }}
                className="p-3 border-2 border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <div className="font-medium">{preset.name}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{preset.api.replace('/api', '')}</div>
              </button>
            ))}
          </div>
        </div>

        {/* API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API URL
          </label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            placeholder="http://192.168.1.100:5000/api"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: http://192.168.1.100:5000/api
          </p>
        </div>

        {/* Socket URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Socket URL (Real-time updates)
          </label>
          <input
            type="text"
            value={socketUrl}
            onChange={(e) => setSocketUrl(e.target.value)}
            placeholder="http://192.168.1.100:5000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">
            Example: http://192.168.1.100:5000 (without /api)
          </p>
        </div>

        {/* Test Connection */}
        <div>
          <button
            onClick={testConnection}
            disabled={testing}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <Wifi className="w-5 h-5" />
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          
          {testResult && (
            <div className={`mt-3 p-3 rounded-lg ${testResult.success ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {testResult.message}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Save className="w-5 h-5" />
            Save Settings
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Help Section */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">How to find your computer's IP:</h3>
          <div className="text-sm text-gray-700 space-y-2">
            <p><strong>Windows:</strong> Open Command Prompt and type <code className="bg-gray-200 px-2 py-1 rounded">ipconfig</code></p>
            <p><strong>Mac:</strong> System Preferences → Network → Select WiFi → Look for IP Address</p>
            <p><strong>Linux:</strong> Open Terminal and type <code className="bg-gray-200 px-2 py-1 rounded">ip addr show</code></p>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Look for "IPv4 Address" or similar. It usually starts with 192.168.x.x or 10.x.x.x
          </p>
        </div>
      </div>
    </div>
  );
}
