import { Link, useLocation } from 'react-router-dom';
import { Film, ShoppingCart, History, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';

export default function BottomNav() {
  const location = useLocation();
  const { cart } = useCart();
  const [user, setUser] = useState(null);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    {
      path: '/reels',
      icon: Film,
      label: 'Reels',
      show: true
    },
    {
      path: '/checkout',
      icon: ShoppingCart,
      label: 'Cart',
      badge: itemCount,
      show: true
    },
    {
      path: '/orders',
      icon: History,
      label: 'History',
      show: true
    }
  ];

  // Don't show bottom nav on certain pages
  const hideOnPages = ['/restaurant-login', '/restaurant-dashboard', '/qr/', '/login'];
  if (hideOnPages.some(page => location.pathname.startsWith(page))) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-2xl z-50 transition-colors backdrop-blur-lg bg-opacity-95 dark:bg-opacity-95">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-around h-16 px-4">
          {navItems.filter(item => item.show).map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 group ${
                  active 
                    ? 'text-primary' 
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {/* Active Background Glow */}
                {active && (
                  <div className="absolute inset-0 bg-primary bg-opacity-5 dark:bg-opacity-10 rounded-2xl mx-2 animate-pulse" />
                )}
                
                {/* Icon Container with Badge */}
                <div className="relative z-10">
                  <div className={`p-2.5 rounded-2xl transition-all duration-300 ${
                    active 
                      ? 'bg-primary bg-opacity-10 dark:bg-opacity-20 scale-110' 
                      : 'group-hover:bg-gray-100 dark:group-hover:bg-gray-800 group-hover:scale-105'
                  }`}>
                    <Icon 
                      size={24} 
                      className="transition-all duration-300"
                      strokeWidth={active ? 2.5 : 2}
                    />
                  </div>
                  
                  {/* Cart Badge */}
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-primary text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1.5 shadow-lg border-2 border-white dark:border-gray-900 animate-bounce">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                
                {/* Label */}
                <span className={`text-xs mt-1 font-medium transition-all duration-300 z-10 ${
                  active ? 'font-bold scale-105' : 'group-hover:text-primary'
                }`}>
                  {item.label}
                </span>
                
                {/* Active Indicator Dot */}
                {active && (
                  <div className="absolute bottom-1 w-1 h-1 bg-primary rounded-full" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
      
      {/* Safe area for iOS devices */}
      <div className="h-safe-area-inset-bottom bg-white dark:bg-gray-900" />
    </nav>
  );
}
