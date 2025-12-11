import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';
import { NetworkProvider, useNetwork } from './context/NetworkContext';
import { setNetworkErrorHandler } from './api/axios';

// Eager load critical components (above the fold)
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import NetworkError from './components/NetworkError';
import Home from './pages/Home'; // Keep Home eager for faster initial load

// Lazy load non-critical components
const RestaurantPage = lazy(() => import('./pages/RestaurantPage'));
const Checkout = lazy(() => import('./pages/Checkout'));
const Reels = lazy(() => import('./pages/Reels'));
const QROrder = lazy(() => import('./pages/QROrder'));
const RestaurantDashboard = lazy(() => import('./pages/RestaurantDashboard'));
const RestaurantLogin = lazy(() => import('./pages/RestaurantLogin'));
const Settings = lazy(() => import('./pages/Settings'));
const NearbyRestaurants = lazy(() => import('./components/NearbyRestaurants'));
const UserLogin = lazy(() => import('./pages/UserLogin'));
const OrderHistory = lazy(() => import('./pages/OrderHistory'));
const Profile = lazy(() => import('./pages/Profile'));
const VoiceTest = lazy(() => import('./pages/VoiceTest'));

// Loading component for lazy-loaded routes
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-gray-600 dark:text-gray-400">Loading...</p>
    </div>
  </div>
);

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
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Critical route - no lazy loading */}
              <Route path="/" element={<><Navbar /><Home /><BottomNav /></>} />
              
              {/* Lazy-loaded routes */}
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
              <Route path="/voice-test" element={<><Navbar /><VoiceTest /><BottomNav /></>} />
            </Routes>
          </Suspense>
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
