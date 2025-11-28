import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';

export default function Chatbot() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your intelligent food assistant. I can analyze our restaurants and recommend the best options for you. Ask me about:\n• Top rated restaurants\n• Best food items\n• Popular cuisines\n• Restaurant recommendations\n• Menu item ratings\n\nYou can also say 'order [food name]' and I'll add it to your cart!",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [restaurantsData, setRestaurantsData] = useState([]);
  const [reviewsData, setReviewsData] = useState([]);
  const [pendingOrder, setPendingOrder] = useState(null); // Store pending order for confirmation
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [orderPreference, setOrderPreference] = useState('veg');
  const [awaitingPreference, setAwaitingPreference] = useState(null); // Store search query waiting for veg/non-veg preference

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch restaurants and reviews data when chatbot opens
  useEffect(() => {
    if (isOpen && restaurantsData.length === 0) {
      fetchAppData();
    }
  }, [isOpen]);

  const fetchAppData = async () => {
    try {
      const [restaurantsRes, reviewsRes] = await Promise.all([
        axios.get('/api/restaurants/search'),
        axios.get('/api/reviews')
      ]);
      setRestaurantsData(restaurantsRes.data);
      setReviewsData(reviewsRes.data);
    } catch (error) {
      console.error('Error fetching app data:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Get intelligent bot response
    setTimeout(async () => {
      const botResponse = await getBotResponse(inputMessage);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      }]);
    }, 800);
  };

  const confirmAndPlaceOrder = async (item, quantity, preference) => {
    try {
      // Add item to cart with specified quantity
      addToCart({
        id: item._id || `${item.restaurantId}-${item.name}`,
        name: item.name,
        price: item.price,
        restaurantId: item.restaurantId,
        restaurantName: item.restaurantName,
        quantity: quantity
      });

      // Clear pending order
      setPendingOrder(null);

      // Close chatbot and navigate to checkout after a short delay
      setTimeout(() => {
        setIsOpen(false);
        navigate('/checkout');
      }, 2000);

      return `✅ Added to Cart!\n\n📦 Order Confirmed:\n• ${item.name} ${preference ? `(${preference})` : ''}\n• Quantity: ${quantity}\n• ⭐ ${item.rating || 'N/A'}/5\n• 💰 ₹${item.price} × ${quantity} = ₹${item.price * quantity}\n• 📍 ${item.restaurantName}\n\n🛒 Taking you to checkout...\n\nYou can review your order and complete the purchase there!`;
    } catch (error) {
      console.error('Add to cart error:', error);
      return `❌ Sorry, I couldn't add this item to your cart. Please try adding it manually from the restaurant menu.`;
    }
  };

  const askForConfirmation = (item) => {
    // Store the pending order and show modal
    setPendingOrder(item);
    setShowOrderModal(true);
    setOrderQuantity(1);
    setOrderPreference(item.isVeg !== undefined ? (item.isVeg ? 'veg' : 'non-veg') : 'veg');
    
    return `🍽️ Perfect! Opening order confirmation...`;
  };

  const getBotResponse = async (message) => {
    const lowerMessage = message.toLowerCase();

    // Ensure data is loaded
    if (restaurantsData.length === 0) {
      try {
        const { data } = await axios.get('/api/restaurants/search');
        setRestaurantsData(data);
        // Re-process the message with loaded data
        return await processMessage(lowerMessage, data, reviewsData);
      } catch (error) {
        return "Sorry, I'm having trouble connecting to the server. Please try again!";
      }
    }

    return await processMessage(lowerMessage, restaurantsData, reviewsData);
  };

  const processMessage = async (lowerMessage, restaurants, reviews) => {
    // Check if user is responding to veg/non-veg preference question
    if (awaitingPreference) {
      let userPreference = null;
      
      if (lowerMessage.includes('veg') && !lowerMessage.includes('non')) {
        userPreference = 'veg';
      } else if (lowerMessage.includes('non-veg') || lowerMessage.includes('non veg') || lowerMessage.includes('nonveg')) {
        userPreference = 'non-veg';
      }

      if (!userPreference) {
        return "Please specify either 'veg' or 'non-veg' to continue.";
      }

      // Now search for items with the specified preference
      const searchQuery = awaitingPreference;
      setAwaitingPreference(null);

      const allMenuItems = [];
      restaurants.forEach(restaurant => {
        restaurant.menu?.forEach(item => {
          allMenuItems.push({
            ...item,
            restaurantName: restaurant.name,
            restaurantRating: restaurant.rating,
            restaurantId: restaurant._id
          });
        });
      });

      // Find items that match the search query and preference
      const matchingItems = allMenuItems.filter(item => {
        const itemName = item.name.toLowerCase();
        const matchesSearch = searchQuery.split(' ').some(word => 
          itemName.includes(word) || word.includes(itemName.split(' ')[0])
        );
        
        // Filter by veg/non-veg preference
        const matchesPreference = userPreference === 'veg' 
          ? (item.isVeg === true || item.isVeg === undefined)
          : (item.isVeg === false || item.isVeg === undefined);
        
        return matchesSearch && matchesPreference;
      });

      if (matchingItems.length === 0) {
        return `Sorry, I couldn't find any ${userPreference} ${searchQuery}. Would you like to try something else?`;
      }

      // Sort by rating
      const sortedItems = matchingItems.sort((a, b) => {
        const ratingDiff = (b.rating || 0) - (a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return (b.restaurantRating || 0) - (a.restaurantRating || 0);
      });

      // Show the best match in modal
      return askForConfirmation(sortedItems[0]);
    }

    // Check if user wants to order something
    const orderKeywords = ['order', 'buy', 'get me', 'i want', 'place order', 'order for me'];
    const wantsToOrder = orderKeywords.some(keyword => lowerMessage.includes(keyword));

    // Search for specific food items by name (e.g., "best chocolate shake", "where can I get pizza")
    const foodKeywords = ['shake', 'pizza', 'burger', 'biryani', 'pasta', 'sandwich', 'coffee', 'tea', 'cake', 'ice cream', 'noodles', 'rice', 'chicken', 'paneer', 'dal', 'roti', 'naan', 'samosa', 'dosa', 'idli', 'vada'];
    const hasSpecificFood = foodKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (hasSpecificFood || (lowerMessage.includes('best') && !lowerMessage.includes('restaurant'))) {
      // Check if user already specified veg/non-veg in the message
      let userPreference = null;
      if (lowerMessage.includes('veg') && !lowerMessage.includes('non')) {
        userPreference = 'veg';
      } else if (lowerMessage.includes('non-veg') || lowerMessage.includes('non veg') || lowerMessage.includes('nonveg')) {
        userPreference = 'non-veg';
      }

      // Extract the food item name from the message
      const allMenuItems = [];
      restaurants.forEach(restaurant => {
        restaurant.menu?.forEach(item => {
          allMenuItems.push({
            ...item,
            restaurantName: restaurant.name,
            restaurantRating: restaurant.rating,
            restaurantId: restaurant._id
          });
        });
      });

      // Find items that match the search query
      const matchingItems = allMenuItems.filter(item => {
        const itemName = item.name.toLowerCase();
        // Check if any word in the message matches the item name
        return lowerMessage.split(' ').some(word => 
          itemName.includes(word) || word.includes(itemName.split(' ')[0])
        );
      });

      if (matchingItems.length > 0) {
        // If user wants to order but hasn't specified veg/non-veg, ask first
        if (wantsToOrder && !userPreference) {
          // Extract the food name for the question
          const foodName = foodKeywords.find(keyword => lowerMessage.includes(keyword));
          setAwaitingPreference(lowerMessage);
          return `Would you like veg or non-veg ${foodName}? Please reply with 'veg' or 'non-veg'.`;
        }

        // Filter by preference if specified
        let filteredItems = matchingItems;
        if (userPreference) {
          filteredItems = matchingItems.filter(item => {
            if (userPreference === 'veg') {
              return item.isVeg === true || item.isVeg === undefined;
            } else {
              return item.isVeg === false || item.isVeg === undefined;
            }
          });
        }

        if (filteredItems.length === 0) {
          return `Sorry, I couldn't find any ${userPreference} items matching your search. Would you like to try something else?`;
        }

        // Sort by rating (highest first), then by restaurant rating
        const sortedItems = filteredItems.sort((a, b) => {
          const ratingDiff = (b.rating || 0) - (a.rating || 0);
          if (ratingDiff !== 0) return ratingDiff;
          return (b.restaurantRating || 0) - (a.restaurantRating || 0);
        });
        
        // Get top 3 best-rated items
        const topMatches = sortedItems.slice(0, 3);

        // If user wants to order, show modal
        if (wantsToOrder && topMatches.length > 0) {
          return askForConfirmation(topMatches[0]);
        }

        let response = `🏆 Top 3 Best Recommendations:\n\n`;
        topMatches.forEach((item, i) => {
          response += `${i + 1}. ${item.name}\n`;
          if (item.rating) {
            response += `   ⭐ ${item.rating}/5 - Highly Rated!\n`;
          }
          response += `   💰 ₹${item.price}\n`;
          response += `   📍 ${item.restaurantName}`;
          if (item.restaurantRating) {
            response += ` (${item.restaurantRating}⭐)`;
          }
          response += `\n`;
          if (item.description) response += `   📝 ${item.description}\n`;
          response += `\n`;
        });
        
        if (matchingItems.length > 3) {
          response += `💡 ${matchingItems.length - 3} more option(s) available. These are our top picks based on ratings and customer feedback!`;
        } else {
          response += `✨ These are the best options based on ratings and customer feedback!`;
        }
        
        return response;
      }
    }

    // Top rated restaurants
    if (lowerMessage.includes('top') && (lowerMessage.includes('restaurant') || lowerMessage.includes('rated'))) {
      const topRestaurants = [...restaurants]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      
      if (topRestaurants.length === 0) {
        return "No restaurants found at the moment. Please check back later!";
      }

      let response = "🌟 Here are our top-rated restaurants:\n\n";
      topRestaurants.forEach((r, i) => {
        response += `${i + 1}. ${r.name}\n   ⭐ ${r.rating}/5 | ${r.cuisine?.join(', ')}\n   🕐 ${r.deliveryTime}\n\n`;
      });
      return response;
    }

    // Best food recommendations
    if (lowerMessage.includes('best') && (lowerMessage.includes('food') || lowerMessage.includes('dish') || lowerMessage.includes('item'))) {
      const allMenuItems = [];
      restaurants.forEach(restaurant => {
        restaurant.menu?.forEach(item => {
          allMenuItems.push({
            ...item,
            restaurantName: restaurant.name,
            restaurantRating: restaurant.rating
          });
        });
      });

      const topItems = allMenuItems
        .filter(item => item.rating && item.rating > 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);

      if (topItems.length === 0) {
        return "All our restaurants serve delicious food! Browse the menu to find your favorites.";
      }

      let response = "🍽️ Top-rated food items:\n\n";
      topItems.forEach((item, i) => {
        response += `${i + 1}. ${item.name}\n   ⭐ ${item.rating}/5 | ₹${item.price}\n   📍 ${item.restaurantName}\n\n`;
      });
      return response;
    }

    // Restaurant recommendations
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest') || lowerMessage.includes('best restaurant')) {
      const highRatedRestaurants = restaurants
        .filter(r => r.rating >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);

      if (highRatedRestaurants.length === 0) {
        // If no 4+ rated, show top 3 anyway
        const topRestaurants = [...restaurants]
          .sort((a, b) => b.rating - a.rating)
          .slice(0, 3);
        
        if (topRestaurants.length === 0) {
          return "Check out the home page to explore our restaurants!";
        }

        let response = "Here are our top restaurants:\n\n";
        topRestaurants.forEach((r, i) => {
          response += `${i + 1}. ${r.name}\n   ⭐ ${r.rating}/5\n   🍴 ${r.cuisine?.join(', ')}\n   ${r.isDeliveryAvailable ? '🚚 Delivery available' : '🏪 Dine-in only'}\n\n`;
        });
        return response;
      }

      let response = "Based on ratings and popularity, I recommend:\n\n";
      highRatedRestaurants.forEach((r, i) => {
        response += `${i + 1}. ${r.name}\n   ⭐ ${r.rating}/5\n   🍴 ${r.cuisine?.join(', ')}\n   ${r.isDeliveryAvailable ? '🚚 Delivery available' : '🏪 Dine-in only'}\n\n`;
      });
      return response;
    }

    // Cuisine-based search
    if (lowerMessage.includes('cuisine') || lowerMessage.includes('chinese') || lowerMessage.includes('indian') || 
        lowerMessage.includes('italian') || lowerMessage.includes('mexican') || lowerMessage.includes('pizza') ||
        lowerMessage.includes('burger') || lowerMessage.includes('biryani')) {
      
      const cuisineKeywords = ['chinese', 'indian', 'italian', 'mexican', 'pizza', 'burger', 'biryani', 'fast food'];
      const foundCuisine = cuisineKeywords.find(c => lowerMessage.includes(c));

      if (foundCuisine) {
        const matchingRestaurants = restaurants.filter(r => 
          r.cuisine?.some(c => c.toLowerCase().includes(foundCuisine)) ||
          r.name.toLowerCase().includes(foundCuisine)
        );

        if (matchingRestaurants.length > 0) {
          let response = `🍴 Restaurants serving ${foundCuisine}:\n\n`;
          matchingRestaurants.slice(0, 5).forEach((r, i) => {
            response += `${i + 1}. ${r.name}\n   ⭐ ${r.rating}/5 | 🕐 ${r.deliveryTime}\n\n`;
          });
          return response;
        }
      }
    }

    // Reviews and ratings
    if (lowerMessage.includes('review') || lowerMessage.includes('feedback')) {
      const recentReviews = reviews.slice(0, 3);
      
      if (recentReviews.length === 0) {
        return "No reviews yet! Be the first to share your experience.";
      }

      let response = "📝 Recent customer reviews:\n\n";
      recentReviews.forEach((review, i) => {
        response += `⭐ ${review.rating}/5 - "${review.comment}"\n`;
        if (i < recentReviews.length - 1) response += "\n";
      });
      return response;
    }

    // Fast delivery
    if (lowerMessage.includes('fast') || lowerMessage.includes('quick') || lowerMessage.includes('delivery time')) {
      const fastRestaurants = restaurants
        .filter(r => r.deliveryTime && parseInt(r.deliveryTime) <= 30)
        .sort((a, b) => parseInt(a.deliveryTime) - parseInt(b.deliveryTime))
        .slice(0, 5);

      if (fastRestaurants.length > 0) {
        let response = "⚡ Fastest delivery restaurants:\n\n";
        fastRestaurants.forEach((r, i) => {
          response += `${i + 1}. ${r.name}\n   🕐 ${r.deliveryTime} | ⭐ ${r.rating}/5\n\n`;
        });
        return response;
      }
    }

    // Statistics
    if (lowerMessage.includes('how many') || lowerMessage.includes('total') || lowerMessage.includes('statistics')) {
      const totalRestaurants = restaurants.length;
      const avgRating = totalRestaurants > 0 ? (restaurants.reduce((sum, r) => sum + r.rating, 0) / totalRestaurants).toFixed(1) : 0;
      const totalReviews = reviews.length;

      return `📊 App Statistics:\n\n🏪 Total Restaurants: ${totalRestaurants}\n⭐ Average Rating: ${avgRating}/5\n📝 Total Reviews: ${totalReviews}\n\nWe're constantly growing to serve you better!`;
    }

    // Default intelligent response
    return "I can help you discover:\n\n🌟 Top-rated restaurants\n🍽️ Best food items\n🍴 Cuisine recommendations\n⚡ Fast delivery options\n📊 App statistics\n\nJust ask me anything about our restaurants and food!";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 right-4 z-50 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-red-600 transition-all duration-300 hover:scale-110"
          aria-label="Open chat"
        >
          <MessageCircle size={28} />
        </button>
      )}

      {/* Order Confirmation Modal */}
      {showOrderModal && pendingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Confirm Your Order</h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setPendingOrder(null);
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>

            {/* Item Details */}
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h4 className="font-bold text-lg text-gray-800 dark:text-white mb-2">{pendingOrder.name}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  ⭐ {pendingOrder.rating || 'N/A'}/5
                </span>
                <span>💰 ₹{pendingOrder.price}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">📍 {pendingOrder.restaurantName}</p>
            </div>

            {/* Quantity Selector */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Quantity
              </label>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-bold text-gray-800 dark:text-white transition-colors"
                >
                  -
                </button>
                <span className="text-2xl font-bold text-gray-800 dark:text-white w-12 text-center">
                  {orderQuantity}
                </span>
                <button
                  onClick={() => setOrderQuantity(Math.min(10, orderQuantity + 1))}
                  className="w-10 h-10 flex items-center justify-center bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg font-bold text-gray-800 dark:text-white transition-colors"
                >
                  +
                </button>
              </div>
            </div>

            {/* Veg/Non-Veg Selector */}
            {pendingOrder.isVeg === undefined && (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Preference
                </label>
                <select
                  value={orderPreference}
                  onChange={(e) => setOrderPreference(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700 text-gray-800 dark:text-white"
                >
                  <option value="veg">🟢 Vegetarian</option>
                  <option value="non-veg">🔴 Non-Vegetarian</option>
                </select>
              </div>
            )}

            {/* Total Price */}
            <div className="mb-6 p-4 bg-primary bg-opacity-10 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800 dark:text-white">Total:</span>
                <span className="text-2xl font-bold text-primary">₹{pendingOrder.price * orderQuantity}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setPendingOrder(null);
                }}
                className="flex-1 px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowOrderModal(false);
                  const preference = orderPreference === 'veg' ? 'Veg' : 'Non-Veg';
                  const response = await confirmAndPlaceOrder(pendingOrder, orderQuantity, preference);
                  setMessages(prev => [...prev, {
                    id: prev.length + 1,
                    text: response,
                    sender: 'bot',
                    timestamp: new Date()
                  }]);
                }}
                className="flex-1 px-4 py-3 bg-primary hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700">
          {/* Chat Header */}
          <div className="bg-primary text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle size={24} />
              <div>
                <h3 className="font-bold">Food Assistant</h3>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-red-600 rounded-full transition-colors"
              aria-label="Close chat"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    message.sender === 'user'
                      ? 'bg-primary text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-red-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-700 dark:text-white"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-primary text-white p-2 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
