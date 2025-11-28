import React, { createContext, useContext, useState } from 'react';

const NetworkContext = createContext();

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};

export const NetworkProvider = ({ children }) => {
  const [showNetworkError, setShowNetworkError] = useState(false);
  const [retryCallback, setRetryCallback] = useState(null);

  const showError = (callback) => {
    setShowNetworkError(true);
    setRetryCallback(() => callback);
  };

  const hideError = () => {
    setShowNetworkError(false);
    setRetryCallback(null);
  };

  const handleRetry = () => {
    hideError();
    if (retryCallback) {
      retryCallback();
    }
  };

  return (
    <NetworkContext.Provider value={{ showNetworkError, showError, hideError, handleRetry }}>
      {children}
    </NetworkContext.Provider>
  );
};
