import { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Loader, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function AIAssistant() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi! I'm your AI Voice Assistant. I can help you with:\n\n✨ Restaurant recommendations\n🍽️ Menu suggestions\n📍 Finding nearby options\n⭐ Best rated items\n🎤 Voice commands\n💡 Answering questions\n\nYou can type or click the mic to speak!",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [transcript, setTranscript] = useState('');
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch restaurants data when component opens
  useEffect(() => {
    if (isOpen && restaurants.length === 0) {
      fetchRestaurants();
    }
  }, [isOpen]);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const speechResult = event.results[0][0].transcript;
        setTranscript(speechResult);
        setInputMessage(speechResult);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const fetchRestaurants = async () => {
    try {
      const { data } = await axios.get('/api/restaurants');
      setRestaurants(data);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        addMessage('ai', 'Sorry, voice recognition is not supported in your browser. Please type your message instead.');
      }
    }
  };

  const speak = (text) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      synthRef.current.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const addMessage = (sender, text) => {
    const newMessage = {
      id: Date.now(),
      text,
      sender,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
    
    // Speak AI responses
    if (sender === 'ai') {
      speak(text);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    addMessage('user', inputMessage);
    const userQuery = inputMessage;
    setInputMessage('');
    setIsTyping(true);

    // Get AI response
    setTimeout(async () => {
      const aiResponse = await getAIResponse(userQuery);
      setIsTyping(false);
      addMessage('ai', aiResponse);
    }, 800);
  };

  const getAIResponse = async (message) => {
    const lowerMessage = message.toLowerCase();

    // Greeting responses
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return "Hello! 👋 I'm here to help you find the perfect meal. What are you in the mood for today?";
    }

    // Help/What can you do
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I can assist you with:\n\n🍽️ Finding restaurants\n⭐ Recommending top-rated items\n🔍 Searching specific dishes\n📍 Delivery options\n💰 Budget-friendly choices\n🌶️ Cuisine preferences\n🎤 Voice commands\n\nJust tell me what you're looking for!";
    }

    // Show restaurants
    if (lowerMessage.includes('show') && lowerMessage.includes('restaurant')) {
      if (restaurants.length === 0) {
        return "Let me fetch the restaurants for you...";
      }
      
      const topRestaurants = restaurants.slice(0, 5);
      let response = `🏪 Here are ${restaurants.length} restaurants available:\n\n`;
      
      topRestaurants.forEach((r, i) => {
        response += `${i + 1}. ${r.name}\n`;
        response += `   ⭐ ${r.rating}/5 | 🍴 ${r.cuisine?.join(', ')}\n`;
        response += `   🕐 ${r.deliveryTime}\n\n`;
      });
      
      if (restaurants.length > 5) {
        response += `...and ${restaurants.length - 5} more! Browse all on the home page.`;
      }
      
      return response;
    }

    // Top rated restaurants
    if ((lowerMessage.includes('top') || lowerMessage.includes('best')) && lowerMessage.includes('restaurant')) {
      if (restaurants.length === 0) {
        await fetchRestaurants();
      }
      
      const topRated = [...restaurants]
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 3);
      
      if (topRated.length === 0) {
        return "I'm fetching restaurant data. Please try again in a moment!";
      }
      
      let response = "🌟 Top-rated restaurants:\n\n";
      topRated.forEach((r, i) => {
        response += `${i + 1}. ${r.name}\n`;
        response += `   ⭐ ${r.rating}/5 - ${r.cuisine?.join(', ')}\n`;
        response += `   🕐 ${r.deliveryTime}\n\n`;
      });
      
      response += "Would you like to see their menus?";
      return response;
    }

    // Search specific restaurant
    const restaurantMatch = restaurants.find(r => 
      lowerMessage.includes(r.name.toLowerCase())
    );
    
    if (restaurantMatch) {
      let response = `🏪 ${restaurantMatch.name}\n\n`;
      response += `⭐ Rating: ${restaurantMatch.rating}/5\n`;
      response += `🍴 Cuisine: ${restaurantMatch.cuisine?.join(', ')}\n`;
      response += `🕐 Delivery: ${restaurantMatch.deliveryTime}\n`;
      response += `📍 ${restaurantMatch.address}\n\n`;
      
      if (restaurantMatch.menu && restaurantMatch.menu.length > 0) {
        response += `Popular items:\n`;
        restaurantMatch.menu.slice(0, 3).forEach((item, i) => {
          response += `${i + 1}. ${item.name} - ₹${item.price}\n`;
        });
      }
      
      response += `\nWould you like to visit this restaurant?`;
      return response;
    }

    // Search for specific food items
    if (lowerMessage.includes('pizza') || lowerMessage.includes('burger') || 
        lowerMessage.includes('biryani') || lowerMessage.includes('pasta') ||
        lowerMessage.includes('sandwich') || lowerMessage.includes('chicken')) {
      
      const allItems = [];
      restaurants.forEach(restaurant => {
        restaurant.menu?.forEach(item => {
          if (item.name.toLowerCase().includes(lowerMessage.split(' ').find(word => 
            ['pizza', 'burger', 'biryani', 'pasta', 'sandwich', 'chicken'].includes(word)
          ))) {
            allItems.push({
              ...item,
              restaurantName: restaurant.name,
              restaurantId: restaurant._id
            });
          }
        });
      });
      
      if (allItems.length > 0) {
        let response = `🍽️ Found ${allItems.length} items:\n\n`;
        allItems.slice(0, 5).forEach((item, i) => {
          response += `${i + 1}. ${item.name}\n`;
          response += `   💰 ₹${item.price} | 📍 ${item.restaurantName}\n`;
          if (item.rating) response += `   ⭐ ${item.rating}/5\n`;
          response += `\n`;
        });
        return response;
      }
    }

    // Food recommendations
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('hungry')) {
      return "🍽️ Great! Let me help you find something delicious.\n\nPopular choices:\n• Biryani - Aromatic and flavorful\n• Pizza - Classic favorite\n• Burgers - Quick and satisfying\n• Chinese - Variety of options\n• Indian - Rich and spicy\n\nWhat sounds good to you?";
    }

    // Best/Top rated items
    if ((lowerMessage.includes('best') || lowerMessage.includes('top')) && 
        (lowerMessage.includes('food') || lowerMessage.includes('dish') || lowerMessage.includes('item'))) {
      
      const allItems = [];
      restaurants.forEach(restaurant => {
        restaurant.menu?.forEach(item => {
          allItems.push({
            ...item,
            restaurantName: restaurant.name
          });
        });
      });
      
      const topItems = allItems
        .filter(item => item.rating && item.rating >= 4)
        .sort((a, b) => b.rating - a.rating)
        .slice(0, 5);
      
      if (topItems.length > 0) {
        let response = "⭐ Top-rated food items:\n\n";
        topItems.forEach((item, i) => {
          response += `${i + 1}. ${item.name}\n`;
          response += `   ⭐ ${item.rating}/5 | ₹${item.price}\n`;
          response += `   📍 ${item.restaurantName}\n\n`;
        });
        return response;
      }
      
      return "⭐ Looking for the best? Browse our restaurants to see top-rated items with customer reviews!";
    }

    // Delivery
    if (lowerMessage.includes('delivery') || lowerMessage.includes('deliver')) {
      return "🚚 Delivery Information:\n\n✅ Most restaurants offer delivery\n⏱️ Average time: 30-45 minutes\n📍 Check delivery zones in restaurant details\n💳 Multiple payment options available\n\nBrowse restaurants with delivery on the home page!";
    }

    // Price/Budget
    if (lowerMessage.includes('price') || lowerMessage.includes('cheap') || lowerMessage.includes('budget') || lowerMessage.includes('affordable')) {
      return "💰 Budget-Friendly Options:\n\n• Filter by price range\n• Look for combo deals\n• Check daily specials\n• Student discounts available\n\nMost items range from ₹50-₹500. What's your budget?";
    }

    // Specific cuisines
    if (lowerMessage.includes('indian') || lowerMessage.includes('biryani') || lowerMessage.includes('curry')) {
      return "🇮🇳 Indian Cuisine:\n\nPopular dishes:\n• Biryani - ₹200-₹350\n• Butter Chicken - ₹250-₹400\n• Paneer Tikka - ₹180-₹300\n• Dal Makhani - ₹150-₹250\n\nCheck out our Indian restaurants for authentic flavors!";
    }

    if (lowerMessage.includes('pizza') || lowerMessage.includes('italian')) {
      return "🍕 Pizza & Italian:\n\nFavorites:\n• Margherita Pizza - ₹200-₹350\n• Pepperoni Pizza - ₹250-₹450\n• Pasta Alfredo - ₹180-₹320\n• Garlic Bread - ₹80-₹150\n\nBrowse our Italian restaurants for more!";
    }

    if (lowerMessage.includes('chinese') || lowerMessage.includes('noodles') || lowerMessage.includes('fried rice')) {
      return "🥢 Chinese Cuisine:\n\nMust-try:\n• Hakka Noodles - ₹150-₹250\n• Fried Rice - ₹140-₹230\n• Manchurian - ₹160-₹280\n• Spring Rolls - ₹100-₹180\n\nExplore our Chinese restaurants!";
    }

    if (lowerMessage.includes('burger') || lowerMessage.includes('fast food')) {
      return "🍔 Burgers & Fast Food:\n\nQuick bites:\n• Classic Burger - ₹120-₹200\n• Cheese Burger - ₹150-₹250\n• Chicken Burger - ₹180-₹300\n• Fries - ₹80-₹120\n\nCheck out our fast food options!";
    }

    // Vegetarian/Vegan
    if (lowerMessage.includes('veg') || lowerMessage.includes('vegetarian') || lowerMessage.includes('vegan')) {
      return "🥗 Vegetarian Options:\n\n✅ All restaurants have veg options\n🌱 Look for the 'V' badge\n🥙 Popular: Paneer dishes, Veg Biryani, Salads\n\nFilter by 'Vegetarian' to see all options!";
    }

    // Order/How to order
    if (lowerMessage.includes('order') || lowerMessage.includes('how to')) {
      return "📱 How to Order:\n\n1. Browse restaurants\n2. Select items from menu\n3. Add to cart\n4. Choose delivery/pickup\n5. Select payment method\n6. Confirm order\n\nIt's that simple! Need help with anything specific?";
    }

    // Payment
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay')) {
      return "💳 Payment Options:\n\n✅ Cash on Delivery\n✅ UPI (Google Pay, PhonePe, Paytm)\n✅ Credit/Debit Cards\n✅ Net Banking\n\nAll payments are secure and encrypted!";
    }

    // Offers/Discounts
    if (lowerMessage.includes('offer') || lowerMessage.includes('discount') || lowerMessage.includes('coupon')) {
      return "🎁 Offers & Discounts:\n\n• First order discount\n• Restaurant-specific deals\n• Combo offers\n• Loyalty rewards\n\nCheck restaurant pages for current offers!";
    }

    // Thank you
    if (lowerMessage.includes('thank') || lowerMessage.includes('thanks')) {
      return "You're welcome! 😊 Is there anything else I can help you with?";
    }

    // Default response
    return "I'm here to help! 🤖\n\nI can assist with:\n• Restaurant recommendations\n• Menu suggestions\n• Delivery information\n• Pricing details\n• Order assistance\n\nWhat would you like to know?";
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      {/* AI Assistant Button - Bottom Left */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-20 left-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
          aria-label="Open AI Assistant"
        >
          <Mic size={28} className="animate-pulse" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
        </button>
      )}

      {/* AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-purple-500">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Mic size={28} className="animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Voice Assistant</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  Online & Ready
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="Close AI Assistant"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-3 ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white shadow-md border border-purple-200 dark:border-purple-800'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-2">
                      <Mic size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI Voice</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-3 shadow-md border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <Loader size={16} className="animate-spin text-purple-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white dark:bg-gray-800 border-t-2 border-purple-200 dark:border-purple-800">
            {/* Voice Status */}
            {(isListening || transcript) && (
              <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 text-sm">
                  {isListening && (
                    <>
                      <Mic size={16} className="text-purple-600 animate-pulse" />
                      <span className="text-purple-600 dark:text-purple-400 font-medium">Listening...</span>
                    </>
                  )}
                  {transcript && !isListening && (
                    <span className="text-gray-700 dark:text-gray-300">"{transcript}"</span>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {/* Voice Button */}
              <button
                onClick={toggleListening}
                className={`p-3 rounded-xl transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-purple-500 hover:bg-purple-600'
                } text-white`}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              {/* Text Input */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type or speak..."
                className="flex-1 px-4 py-3 border-2 border-purple-300 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
              />
              
              {/* Speaker Button */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl transition-all"
                  aria-label="Stop speaking"
                >
                  <Volume2 size={20} className="animate-pulse" />
                </button>
              )}
              
              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center flex items-center justify-center gap-2">
              <Mic size={12} />
              Voice-enabled AI • Type or speak
            </p>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </>
  );
}
