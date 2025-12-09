import { useState } from 'react';
import { Sparkles, X, Send, Loader } from 'lucide-react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "👋 Hi! I'm your AI Assistant. I can help you with:\n\n✨ Restaurant recommendations\n🍽️ Menu suggestions\n📍 Finding nearby options\n⭐ Best rated items\n💡 Answering questions\n\nHow can I help you today?",
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = getAIResponse(inputMessage);
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }]);
    }, 1000);
  };

  const getAIResponse = (message) => {
    const lowerMessage = message.toLowerCase();

    // Greeting responses
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      return "Hello! 👋 I'm here to help you find the perfect meal. What are you in the mood for today?";
    }

    // Help/What can you do
    if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
      return "I can assist you with:\n\n🍽️ Finding restaurants\n⭐ Recommending top-rated items\n🔍 Searching specific dishes\n📍 Delivery options\n💰 Budget-friendly choices\n🌶️ Cuisine preferences\n\nJust tell me what you're looking for!";
    }

    // Restaurant recommendations
    if (lowerMessage.includes('restaurant') || lowerMessage.includes('where to eat')) {
      return "🏪 I'd love to help you find a great restaurant! \n\nCould you tell me:\n• What cuisine do you prefer?\n• Any dietary restrictions?\n• Delivery or dine-in?\n• Your budget range?\n\nOr browse our top-rated restaurants on the home page!";
    }

    // Food recommendations
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('hungry')) {
      return "🍽️ Great! Let me help you find something delicious.\n\nPopular choices:\n• Biryani - Aromatic and flavorful\n• Pizza - Classic favorite\n• Burgers - Quick and satisfying\n• Chinese - Variety of options\n• Indian - Rich and spicy\n\nWhat sounds good to you?";
    }

    // Best/Top rated
    if (lowerMessage.includes('best') || lowerMessage.includes('top') || lowerMessage.includes('recommend')) {
      return "⭐ Looking for the best? Here's what I suggest:\n\n1. Check our top-rated restaurants (4.5+ stars)\n2. Browse customer reviews\n3. Look for 'Popular' badges\n4. Try our chef's specials\n\nWould you like recommendations for a specific cuisine?";
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
          className="fixed bottom-20 left-4 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 group"
          aria-label="Open AI Assistant"
        >
          <Sparkles size={24} className="animate-pulse" />
          <span className="font-semibold hidden sm:inline">AI Assistant</span>
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
                <Sparkles size={28} className="animate-pulse" />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Assistant</h3>
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
                      <Sparkles size={16} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI</span>
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
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-3 border-2 border-purple-300 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-400"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Send message"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Powered by AI • Always here to help
            </p>
          </div>
        </div>
      )}
    </>
  );
}
