import React from 'react';

const NetworkError = ({ onRetry }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/95 z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
        {/* Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            {/* Robot body */}
            <div className="relative">
              {/* Robot head */}
              <div className="w-24 h-24 bg-white dark:bg-gray-600 rounded-full shadow-lg relative">
                {/* Eyes */}
                <div className="absolute top-8 left-4 w-4 h-8 bg-red-500 rounded-full"></div>
                <div className="absolute top-8 right-4 w-4 h-8 bg-red-500 rounded-full"></div>
                {/* Mouth */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-800 dark:bg-gray-300 rounded"></div>
              </div>
              
              {/* Robot base */}
              <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-20 h-20 bg-white dark:bg-gray-600 rounded-full shadow-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-400 rounded-full mb-2"></div>
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-400 rounded-full mt-2"></div>
              </div>
              
              {/* Sparkle */}
              <div className="absolute -left-8 top-0 text-blue-400 text-2xl">✦</div>
              
              {/* Floating person */}
              <div className="absolute -right-12 -top-8 text-4xl animate-bounce">🏃</div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Lost Connection
        </h2>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">
          Whoops... no internet connection found. Check your connection
        </p>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-4 px-8 rounded-full transition-colors duration-200 shadow-lg"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default NetworkError;
