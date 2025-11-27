import { Link } from 'react-router-dom';
import { ShoppingCart, Film, Sun, Moon } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSelector from './LanguageSelector';

export default function Navbar() {
  const { cart } = useCart();
  const { theme, toggleTheme } = useTheme();
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-50 border-b border-gray-100 dark:border-gray-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 sm:h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center flex-shrink-0 hover:opacity-80 transition-opacity">
            <img 
              src={theme === 'dark' ? '/waitnotlogo-dark.png' : '/waitnotflogo.png'}
              alt="WaitNot Logo" 
              className="h-16 sm:h-20 md:h-24 w-auto object-contain transition-opacity"
            />
          </Link>
          
          {/* Right Side Navigation */}
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Reels Link */}
            <Link 
              to="/reels" 
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary transition-all duration-200"
            >
              <Film size={24} className="text-primary" />
              <span className="hidden md:inline font-medium">Reels</span>
            </Link>
            
            {/* Cart Link */}
            <Link 
              to="/checkout" 
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary transition-all duration-200"
            >
              <ShoppingCart size={24} className="text-primary" />
              <span className="hidden md:inline font-medium">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center font-bold px-1.5 shadow-lg animate-pulse">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-primary dark:hover:text-primary transition-all duration-200"
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? (
                <Moon size={24} className="text-primary" />
              ) : (
                <Sun size={24} className="text-primary" />
              )}
            </button>
            
            {/* Language Selector */}
            <div className="flex items-center">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
