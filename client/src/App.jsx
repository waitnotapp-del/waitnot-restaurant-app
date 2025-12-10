import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import NetworkError from './components/NetworkError';
import Home from './pages/Home';
import RestaurantPage from './pages/RestaurantPage';
import Checkout from './pages/Checkout';
import Reels from './pages/Reels';
import QROrder from './pages/QROrder';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantLogin from './pages/RestaurantLogin';
import Settings from './pages/Settings';
import NearbyRestaurants from './components/NearbyRestaurants';

import UserLogin from './pages/UserLogin';
import OrderHistory from './pages/OrderHistory';
import Profile from './pages/Profile';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { setNetworkErrorHandler } from './api/axios';

function AppContent() {
  const { showNetworkError, showError, handleRetry } = useNetwork();

  useEffect(() => {
    // Set up global network error handler
    setNetworkErrorHandler(() => {
      showError(() => {
        window.location.reload();
      });
    });
  }, [showError]);

  return (
    <>
      <Router>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<><Navbar /><Home /><BottomNav /></>} />
            <Route path="/restaurant/:id" element={<><Navbar /><RestaurantPage /><BottomNav /></>} />
            <Route path="/checkout" element={<><Navbar /><Checkout /><BottomNav /></>} />
            <Route path="/reels" element={<><Reels /><BottomNav /></>} />
            <Route path="/nearby" element={<><Navbar /><NearbyRestaurants /><BottomNav /></>} />
            <Route path="/qr/:restaurantId/:tableNumber" element={<QROrder />} />
            <Route path="/restaurant-login" element={<RestaurantLogin />} />
            <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />

            <Route path="/login" element={<><Navbar /><UserLogin /></>} />
            <Route path="/orders" element={<><Navbar /><OrderHistory /><BottomNav /></>} />
            <Route path="/profile" element={<><Navbar /><Profile /><BottomNav /></>} />
            <Route path="/settings" element={<><Navbar /><Settings /><BottomNav /></>} />
          </Routes>
        </div>
      </Router>
      
      {showNetworkError && <NetworkError onRetry={handleRetry} />}
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;
