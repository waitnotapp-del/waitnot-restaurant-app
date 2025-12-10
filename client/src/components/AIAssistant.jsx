import { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Loader, MicOff, Volume2, Settings, Star, MapPin, Clock, Zap, Brain, MessageCircle } from 'lucide-react';
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
  const [isWakeWordActive, setIsWakeWordActive] = useState(true);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    voice: null
  });
  const [availableVoices, setAvailableVoices] = useState([]);
  const [conversationMode, setConversationMode] = useState(false);
  const [quickActions, setQuickActions] = useState([
    { id: 1, text: "Show nearby restaurants", icon: MapPin },
    { id: 2, text: "What's popular today?", icon: Star },
    { id: 3, text: "Quick delivery options", icon: Clock },
    { id: 4, text: "Best rated items", icon: Zap }
  ]);
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const wakeWordRecognitionRef = useRef(null);
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

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = synthRef.current.getVoices();
      setAvailableVoices(voices);
      
      // Set default voice (prefer female English voice)
      const defaultVoice = voices.find(voice => 
        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('female')
      ) || voices.find(voice => voice.lang.startsWith('en')) || voices[0];
      
      if (defaultVoice) {
        setVoiceSettings(prev => ({ ...prev, voice: defaultVoice }));
      }
    };

    loadVoices();
    synthRef.current.addEventListener('voiceschanged', loadVoices);
    
    return () => {
      synthRef.current.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  // Initialize speech recognition for commands
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
        
        // Auto-send message after voice input completes
        setTimeout(() => {
          if (speechResult.trim()) {
            handleVoiceMessage(speechResult);
          }
        }, 500);
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

  // Initialize wake word detection
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      wakeWordRecognitionRef.current = new SpeechRecognition();
      wakeWordRecognitionRef.current.continuous = true;
      wakeWordRecognitionRef.current.interimResults = true;
      wakeWordRecognitionRef.current.lang = 'en-US';

      wakeWordRecognitionRef.current.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase();
        
        console.log('Wake word listening:', transcript);
        
        // Check for wake word "hey waiter"
        if (transcript.includes('hey waiter') || 
            transcript.includes('hey walter') || 
            transcript.includes('a waiter') ||
            transcript.includes('hey writer')) {
          console.log('Wake word detected!');
          setWakeWordDetected(true);
          setIsOpen(true);
          
          // Stop wake word detection temporarily
          wakeWordRecognitionRef.current?.stop();
          
          // Speak confirmation
          speak("Yes, I'm here! How can I help you?");
          
          // Add welcome message
          addMessage('ai', "I heard you! What would you like to know?");
          
          // Restart wake word detection after 30 seconds
          setTimeout(() => {
            if (!isOpen) {
              startWakeWordDetection();
            }
          }, 30000);
        }
      };

      wakeWordRecognitionRef.current.onerror = (event) => {
        console.error('Wake word recognition error:', event.error);
        // Restart on error (except if permission denied)
        if (event.error !== 'not-allowed' && event.error !== 'no-speech') {
          setTimeout(() => {
            if (isWakeWordActive && !isOpen) {
              startWakeWordDetection();
            }
          }, 1000);
        }
      };

      wakeWordRecognitionRef.current.onend = () => {
        // Restart wake word detection if still active
        if (isWakeWordActive && !isOpen) {
          setTimeout(() => {
            startWakeWordDetection();
          }, 500);
        }
      };
    }

    return () => {
      wakeWordRecognitionRef.current?.stop();
    };
  }, [isOpen, isWakeWordActive]);

  // Start wake word detection on mount
  useEffect(() => {
    if (isWakeWordActive && !isOpen) {
      startWakeWordDetection();
    }
    
    return () => {
      wakeWordRecognitionRef.current?.stop();
    };
  }, []);

  const startWakeWordDetection = () => {
    if (wakeWordRecognitionRef.current && !isOpen) {
      try {
        wakeWordRecognitionRef.current.start();
        console.log('👂 Wake word detection started - Say "Hey Waiter"');
      } catch (error) {
        console.error('Failed to start wake word detection:', error);
      }
    }
  };

  const stopWakeWordDetection = () => {
    if (wakeWordRecognitionRef.current) {
      wakeWordRecognitionRef.current.stop();
      console.log('🛑 Wake word detection stopped');
    }
  };

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

  // Clean text for speech synthesis - remove emojis and symbols but keep readable content
  const cleanTextForSpeech = (text) => {
    return text
      // Remove ALL emojis comprehensively (keep them in UI but don't speak them)
      .replace(/[\u{1F000}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F100}-\u{1F1FF}]|[\u{1F200}-\u{1F2FF}]|[\u{1F300}-\u{1F5FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F700}-\u{1F77F}]|[\u{1F780}-\u{1F7FF}]|[\u{1F800}-\u{1F8FF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{3030}]|[\u{303D}]|[\u{3297}]|[\u{3299}]/gu, '')
      // Remove special Unicode symbols and pictographs
      .replace(/[\u{25A0}-\u{25FF}]|[\u{2000}-\u{206F}]|[\u{20A0}-\u{20CF}]|[\u{FE00}-\u{FE0F}]|[\u{E000}-\u{F8FF}]/gu, '')
      // Replace bullet points and list markers
      .replace(/[•·‣⁃]/g, 'item')
      .replace(/[▪▫▬]/g, 'item')
      // Replace currency symbols with words
      .replace(/₹/g, 'rupees ')
      .replace(/\$/g, 'dollars ')
      .replace(/€/g, 'euros ')
      .replace(/£/g, 'pounds ')
      .replace(/¥/g, 'yen ')
      .replace(/₩/g, 'won ')
      // Replace mathematical and special symbols
      .replace(/[×÷±≈≠≤≥]/g, '')
      .replace(/[°℃℉]/g, 'degrees')
      .replace(/[%]/g, 'percent')
      .replace(/[™®©]/g, '')
      // Replace rating format (⭐ 4.5/5 becomes "rated 4.5 out of 5")
      .replace(/[⭐★☆✦✧✩✪✫⭐]/g, '')
      .replace(/(\d+\.?\d*)\s*\/\s*(\d+)/g, 'rated $1 out of $2')
      // Replace time format (30-40 min becomes "30 to 40 minutes")
      .replace(/(\d+)\s*-\s*(\d+)\s*min/gi, '$1 to $2 minutes')
      .replace(/(\d+)\s*mins?/gi, '$1 minutes')
      // Replace common symbols with words
      .replace(/&/g, 'and')
      .replace(/@/g, 'at')
      .replace(/#/g, 'number')
      .replace(/\+/g, 'plus')
      .replace(/=/g, 'equals')
      .replace(/</g, 'less than')
      .replace(/>/g, 'greater than')
      // Replace arrows and navigation symbols
      .replace(/[→←↑↓↔↕⇒⇐⇑⇓⇔⇕]/g, 'to')
      .replace(/[▶▷►▸]/g, 'next')
      .replace(/[◀◁◄◂]/g, 'previous')
      // Replace checkmarks and status symbols
      .replace(/[✓✔☑]/g, 'yes')
      .replace(/[✗✘☒]/g, 'no')
      .replace(/[✅]/g, 'available')
      .replace(/[❌]/g, 'not available')
      .replace(/[⚠]/g, 'warning')
      .replace(/[ℹ]/g, 'information')
      // Replace punctuation clusters
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      .replace(/[.]{3,}/g, '.')
      .replace(/[-]{2,}/g, ' ')
      .replace(/[_]{2,}/g, ' ')
      .replace(/[~]{2,}/g, ' ')
      // Replace brackets and special punctuation
      .replace(/[\[\]{}]/g, '')
      .replace(/[|]/g, ' ')
      .replace(/[\\]/g, ' ')
      .replace(/[`]/g, '')
      .replace(/[^a-zA-Z0-9\s.,!?'"():;/-]/g, ' ')
      // Clean up spacing and formatting
      .replace(/\n{3,}/g, '\n\n') // Max 2 newlines
      .replace(/\s{2,}/g, ' ') // Max 1 space
      .replace(/^\s+|\s+$/g, '') // Trim whitespace
      .trim();
  };

  const speak = (text) => {
    if (synthRef.current && 'speechSynthesis' in window) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      // Clean text for speech (remove emojis and symbols)
      const cleanedText = cleanTextForSpeech(text);
      
      const utterance = new SpeechSynthesisUtterance(cleanedText);
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;
      
      if (voiceSettings.voice) {
        utterance.voice = voiceSettings.voice;
      }
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        // In conversation mode, start listening after AI finishes speaking
        if (conversationMode && isOpen) {
          setTimeout(() => {
            if (recognitionRef.current && !isListening) {
              toggleListening();
            }
          }, 500);
        }
      };
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

  const handleVoiceMessage = async (message) => {
    if (!message.trim()) return;

    addMessage('user', message);
    setInputMessage('');
    setTranscript('');
    setIsTyping(true);

    // Get AI response
    setTimeout(async () => {
      const aiResponse = await getAIResponse(message);
      setIsTyping(false);
      addMessage('ai', aiResponse);
    }, 800);
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

    // Check for location-based queries first
    if (lowerMessage.includes('nearby') || lowerMessage.includes('near me') || lowerMessage.includes('close')) {
      try {
        // Try to get user's location
        if (navigator.geolocation) {
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                  const response = await axios.post('/api/restaurants/nearby', {
                    latitude,
                    longitude
                  });
                  
                  const nearbyRestaurants = response.data.nearbyRestaurants;
                  if (nearbyRestaurants.length > 0) {
                    let reply = `📍 Found ${nearbyRestaurants.length} restaurants near you:\n\n`;
                    nearbyRestaurants.slice(0, 5).forEach((r, i) => {
                      reply += `${i + 1}. ${r.name}\n`;
                      reply += `   📍 ${r.distanceKm} km away\n`;
                      reply += `   ⭐ ${r.rating}/5 | 🕐 ${r.deliveryTime}\n\n`;
                    });
                    reply += "Would you like to see menus or get more details about any of these?";
                    resolve(reply);
                  } else {
                    resolve("📍 I couldn't find any restaurants that deliver to your current location. Try browsing all restaurants or check if you're in a delivery zone.");
                  }
                } catch (error) {
                  resolve("📍 I can see you're looking for nearby restaurants! Please check the home page where I automatically show restaurants that deliver to your location.");
                }
              },
              () => {
                resolve("📍 To show nearby restaurants, I need your location. Please allow location access or check the home page for location-based results!");
              }
            );
          });
        }
      } catch (error) {
        return "📍 I can help you find nearby restaurants! Check the home page where restaurants are automatically filtered based on your location.";
      }
    }

    // Greeting responses
    if (lowerMessage.match(/^(hi|hello|hey|good morning|good afternoon|good evening)/)) {
      const greetings = [
        "Hello! 👋 I'm here to help you find the perfect meal. What are you in the mood for today?",
        "Hi there! 🍽️ Ready to discover some delicious food? What can I help you with?",
        "Hey! 😊 I'm your food assistant. Looking for something specific or want recommendations?"
      ];
      return greetings[Math.floor(Math.random() * greetings.length)];
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

    // Smart contextual responses
    if (lowerMessage.includes('recommend') || lowerMessage.includes('suggest')) {
      const suggestions = [
        "🌟 Based on popularity, I'd recommend:\n• Biryani - Always a crowd favorite\n• Pizza - Quick and satisfying\n• Burgers - Great for a quick bite\n\nWhat type of cuisine interests you?",
        "🍽️ Here are some great options:\n• For spicy food lovers: Indian cuisine\n• For comfort food: Italian pasta & pizza\n• For healthy options: Salads and grilled items\n\nTell me your preference!",
        "⭐ Top picks right now:\n• Chicken Biryani - Aromatic and filling\n• Margherita Pizza - Classic choice\n• Paneer Tikka - Vegetarian favorite\n\nWant details about any of these?"
      ];
      return suggestions[Math.floor(Math.random() * suggestions.length)];
    }

    // Conversation starters
    if (lowerMessage.includes('what') && (lowerMessage.includes('good') || lowerMessage.includes('popular'))) {
      return "🔥 What's trending today:\n\n• Biryani dishes are very popular\n• Pizza combos are in demand\n• Healthy salad bowls are trending\n• Desserts are always a hit!\n\nAny of these sound appealing to you?";
    }

    // Default response with personality
    const defaultResponses = [
      "I'm here to help! 🤖\n\nI can assist with:\n• Restaurant recommendations\n• Menu suggestions\n• Delivery information\n• Pricing details\n• Order assistance\n\nWhat would you like to know?",
      "🍽️ I'm your food companion! I can help you:\n\n• Find the perfect restaurant\n• Discover new dishes\n• Check delivery options\n• Compare prices\n• Place orders\n\nWhat sounds interesting?",
      "Hey! 😊 I'm here to make your food ordering experience amazing!\n\nI can help with:\n• Personalized recommendations\n• Restaurant details\n• Menu exploration\n• Quick ordering\n\nWhat can I do for you today?"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (actionText) => {
    setInputMessage(actionText);
    setTimeout(() => {
      handleSendMessage();
    }, 100);
  };

  const updateVoiceSettings = (newSettings) => {
    setVoiceSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <>
      {/* AI Assistant Button - Bottom Left */}
      {!isOpen && (
        <div className="fixed bottom-20 left-4 z-50">
          <button
            onClick={() => setIsOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group relative"
            aria-label="Open AI Assistant"
          >
            <Mic size={28} className={isWakeWordActive ? "animate-pulse" : ""} />
            {isWakeWordActive && (
              <>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
              </>
            )}
          </button>
          
          {/* Wake Word Status */}
          {isWakeWordActive && (
            <div className="absolute -top-12 left-0 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg shadow-lg border border-purple-200 dark:border-purple-700 whitespace-nowrap">
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                Say "Hey Waiter"
              </p>
            </div>
          )}
        </div>
      )}

      {/* AI Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-50 w-80 sm:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-purple-500">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Brain size={28} className="animate-pulse" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg flex items-center gap-2">
                    AI Voice Assistant
                    {conversationMode && <MessageCircle size={16} className="animate-bounce" />}
                  </h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    {conversationMode ? 'Conversation Mode' : 'Online & Ready'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Voice Settings"
                >
                  <Settings size={18} />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSettings(false);
                    // Restart wake word detection when closing
                    setTimeout(() => startWakeWordDetection(), 500);
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close AI Assistant"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            {/* Controls */}
            <div className="space-y-2">
              {/* Wake Word Toggle */}
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <Mic size={14} />
                  <span className="text-xs font-medium">Wake Word: "Hey Waiter"</span>
                </div>
                <button
                  onClick={() => {
                    setIsWakeWordActive(!isWakeWordActive);
                    if (!isWakeWordActive) {
                      startWakeWordDetection();
                    } else {
                      stopWakeWordDetection();
                    }
                  }}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    isWakeWordActive ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      isWakeWordActive ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Conversation Mode Toggle */}
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <MessageCircle size={14} />
                  <span className="text-xs font-medium">Conversation Mode</span>
                </div>
                <button
                  onClick={() => setConversationMode(!conversationMode)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    conversationMode ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                      conversationMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Voice Settings Panel */}
            {showSettings && (
              <div className="mt-3 bg-white/10 rounded-lg p-3 space-y-3">
                <h4 className="text-sm font-semibold">Voice Settings</h4>
                
                {/* Voice Selection */}
                {availableVoices.length > 0 && (
                  <div>
                    <label className="text-xs font-medium block mb-1">Voice</label>
                    <select
                      value={voiceSettings.voice?.name || ''}
                      onChange={(e) => {
                        const selectedVoice = availableVoices.find(v => v.name === e.target.value);
                        updateVoiceSettings({ voice: selectedVoice });
                      }}
                      className="w-full text-xs bg-white/20 border border-white/30 rounded px-2 py-1 text-white"
                    >
                      {availableVoices.filter(voice => voice.lang.startsWith('en')).map((voice) => (
                        <option key={voice.name} value={voice.name} className="text-black">
                          {voice.name} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Speed Control */}
                <div>
                  <label className="text-xs font-medium block mb-1">Speed: {voiceSettings.rate.toFixed(1)}x</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Pitch Control */}
                <div>
                  <label className="text-xs font-medium block mb-1">Pitch: {voiceSettings.pitch.toFixed(1)}</label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Volume Control */}
                <div>
                  <label className="text-xs font-medium block mb-1">Volume: {Math.round(voiceSettings.volume * 100)}%</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.volume}
                    onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Test Voice Button */}
                <button
                  onClick={() => speak("Hello! This is how I sound with your current settings. I can help you find restaurants and food options.")}
                  className="w-full bg-white/20 hover:bg-white/30 text-white text-xs py-2 px-3 rounded transition-colors mb-2"
                >
                  Test Voice
                </button>
                
                {/* Test Symbol Cleaning */}
                <button
                  onClick={() => speak("📍 Found 3 restaurants near you: 🍕 Pizza Palace • ₹299 • ⭐ 4.5/5 | 🕐 25-30 min ✅ Available for delivery! 🚚")}
                  className="w-full bg-white/20 hover:bg-white/30 text-white text-xs py-2 px-3 rounded transition-colors"
                >
                  Test Symbol Cleaning
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          {messages.length <= 1 && (
            <div className="p-4 bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Zap size={16} className="text-purple-600" />
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.text)}
                      className="flex items-center gap-2 p-3 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left"
                    >
                      <IconComponent size={16} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              <div className="mb-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    {isListening && (
                      <>
                        <Mic size={16} className="text-purple-600 animate-pulse" />
                        <span className="text-purple-600 dark:text-purple-400 font-medium">Listening... Speak now</span>
                      </>
                    )}
                    {transcript && !isListening && (
                      <>
                        <Loader size={16} className="text-green-600 animate-spin" />
                        <span className="text-green-600 dark:text-green-400 font-medium">Processing: "{transcript}"</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              {/* Voice Button - Primary interaction */}
              <button
                onClick={toggleListening}
                disabled={isTyping}
                className={`p-4 rounded-xl transition-all flex-shrink-0 ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg'
                } text-white disabled:opacity-50`}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
              
              {/* Text Input - Optional fallback */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Or type here..."
                disabled={isListening || isTyping}
                className="flex-1 px-4 py-3 border-2 border-purple-300 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white placeholder-gray-400 disabled:opacity-50"
              />
              
              {/* Speaker Button - Stop AI voice */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-xl transition-all flex-shrink-0"
                  aria-label="Stop speaking"
                >
                  <Volume2 size={20} className="animate-pulse" />
                </button>
              )}
              
              {/* Send Button - Only for text input */}
              {inputMessage.trim() && !isListening && (
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send size={20} />
                </button>
              )}
            </div>
            
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-2">
                <Mic size={12} />
                {isListening ? 'Speak now - Auto-sends when done' : 'Click mic to speak • Auto-sends voice messages'}
              </p>
              {conversationMode && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 flex items-center justify-center gap-1">
                  <MessageCircle size={12} />
                  Conversation mode: AI will listen after responding
                </p>
              )}
            </div>
          </div>
          
          <div ref={messagesEndRef} />
        </div>
      )}
    </>
  );
}
