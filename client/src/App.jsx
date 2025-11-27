import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import RestaurantPage from './pages/RestaurantPage';
import Checkout from './pages/Checkout';
import Reels from './pages/Reels';
import QROrder from './pages/QROrder';
import RestaurantDashboard from './pages/RestaurantDashboard';
import RestaurantLogin from './pages/RestaurantLogin';
import Settings from './pages/Settings';
import PaymentSettings from './pages/PaymentSettings';
import { CartProvider } from './context/CartContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
            <Routes>
              <Route path="/" element={<><Navbar /><Home /></>} />
              <Route path="/restaurant/:id" element={<><Navbar /><RestaurantPage /></>} />
              <Route path="/checkout" element={<><Navbar /><Checkout /></>} />
              <Route path="/reels" element={<Reels />} />
              <Route path="/qr/:restaurantId/:tableNumber" element={<QROrder />} />
              <Route path="/restaurant-login" element={<RestaurantLogin />} />
              <Route path="/restaurant-dashboard" element={<RestaurantDashboard />} />
              <Route path="/payment-settings" element={<PaymentSettings />} />
              <Route path="/settings" element={<><Navbar /><Settings /></>} />
            </Routes>
          </div>
        </Router>
      </CartProvider>
    </ThemeProvider>
  );
}

export default App;
