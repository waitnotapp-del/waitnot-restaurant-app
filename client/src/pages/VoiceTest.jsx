import React from 'react';
import VoiceAssistant from '../components/VoiceAssistant';

const VoiceTest = () => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
            Voice Assistant Test
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Test the enhanced "waiter" AI voice assistant. Try saying things like:
          </p>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Basic Order</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">"I want a burger"</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Specific Request</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">"Get me a veg pizza"</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Complete Order</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">"I want 2 chicken biryani"</p>
            </div>
          </div>
        </div>
        
        <VoiceAssistant />
        
        <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            How it Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                1. Food Collection
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                The assistant asks for the food item you want to order.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                2. Dietary Preference
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                It asks whether you want vegetarian or non-vegetarian options.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                3. Quantity
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                The assistant asks how many items you want to order.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">
                4. Restaurant Search
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                It finds nearby restaurants and ranks them by rating and distance.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
              API Endpoints Used
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li><code>POST /api/voice/query</code> - Main waiter AI endpoint</li>
              <li><code>POST /api/voice/restaurants/search</code> - Restaurant search</li>
              <li><code>POST /api/voice/clear-session</code> - Clear conversation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceTest;