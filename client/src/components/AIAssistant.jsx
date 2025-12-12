import { useState, useEffect, useRef } from 'react';
import { Mic, X, Send, Loader, MicOff, Volume2, Settings, Star, MapPin, Clock, Zap, Brain, MessageCircle } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Add custom styles for better scrolling and animations
const customStyles = `
  .scrollbar-thin {
    scrollbar-width: thin;
  }
  .scrollbar-thumb-purple-300 {
    scrollbar-color: #d8b4fe transparent;
  }
  .scrollbar-track-transparent {
    scrollbar-track-color: transparent;
  }
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-in-out;
  }
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  /* Webkit scrollbar styling */
  .scrollbar-thin::-webkit-scrollbar {
    width: 4px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: transparent;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: #d8b4fe;
    border-radius: 2px;
  }
  .scrollbar-thin::-webkit-scrollbar-thumb:hover {
    background: #c084fc;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = customStyles;
  document.head.appendChild(styleSheet);
}

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
  const [isRecognitionRunning, setIsRecognitionRunning] = useState(false);
  const [recognitionAttempts, setRecognitionAttempts] = useState(0);
  const [conversationState, setConversationState] = useState({
    step: 'initial',
    foodItem: null,
    isVeg: null,
    quantity: null,
    sessionId: null
  });
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
  
  // Ordering flow states
  const [orderingFlow, setOrderingFlow] = useState({
    isActive: false,
    step: null, // 'item_selection', 'dietary_preference', 'quantity', 'confirmation', 'address'
    selectedItem: null,
    selectedRestaurant: null,
    quantity: 1,
    dietaryPreference: null,
    userLocation: null,
    orderDetails: {}
  });
  const [currentOrder, setCurrentOrder] = useState({
    items: [],
    restaurant: null,
    totalAmount: 0,
    deliveryAddress: null
  });
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

  // Initialize wake word detection - FIXED VERSION
  useEffect(() => {
    // Cleanup any existing recognition first
    if (wakeWordRecognitionRef.current) {
      try {
        wakeWordRecognitionRef.current.stop();
        wakeWordRecognitionRef.current = null;
      } catch (e) {
        console.log('Cleanup wake word recognition:', e.message);
      }
    }

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      try {
        wakeWordRecognitionRef.current = new SpeechRecognition();
        wakeWordRecognitionRef.current.continuous = true;
        wakeWordRecognitionRef.current.interimResults = true;
        wakeWordRecognitionRef.current.lang = 'en-US';

        wakeWordRecognitionRef.current.onresult = (event) => {
          const last = event.results.length - 1;
          const transcript = event.results[last][0].transcript.toLowerCase();
          
          // Check for wake word "hey waiter"
          if (transcript.includes('hey waiter') || 
              transcript.includes('hey walter') || 
              transcript.includes('a waiter') ||
              transcript.includes('hey writer')) {
            console.log('✅ Wake word detected!');
            setWakeWordDetected(true);
            setIsOpen(true);
            setIsRecognitionRunning(false);
            setRecognitionAttempts(0);
            
            // Stop wake word detection immediately
            try {
              wakeWordRecognitionRef.current?.stop();
            } catch (e) {
              console.log('Stop wake word recognition:', e.message);
            }
            
            // Speak confirmation
            speak("Yes, I'm here! How can I help you?");
            
            // Add welcome message
            addMessage('ai', "I heard you! What would you like to know?");
          }
        };

        wakeWordRecognitionRef.current.onerror = (event) => {
          console.error('Wake word recognition error:', event.error);
          setIsRecognitionRunning(false);
          
          // Don't restart on certain errors to prevent loops
          if (event.error === 'not-allowed' || 
              event.error === 'service-not-allowed' ||
              event.error === 'aborted') {
            console.log('Wake word detection stopped due to:', event.error);
            setRecognitionAttempts(5); // Stop trying
            return;
          }
        };

        wakeWordRecognitionRef.current.onstart = () => {
          setIsRecognitionRunning(true);
          console.log('Wake word recognition started successfully');
        };

        wakeWordRecognitionRef.current.onend = () => {
          setIsRecognitionRunning(false);
          
          // Only restart if conditions are met and we haven't exceeded attempts
          if (isWakeWordActive && 
              !isOpen && 
              wakeWordRecognitionRef.current && 
              recognitionAttempts < 5) {
            setTimeout(() => {
              if (!isRecognitionRunning && !isOpen) {
                startWakeWordDetection();
              }
            }, 3000); // Longer delay to prevent rapid restarts
          }
        };
      } catch (error) {
        console.error('Failed to initialize wake word detection:', error);
      }
    }

    return () => {
      // Proper cleanup
      if (wakeWordRecognitionRef.current) {
        try {
          wakeWordRecognitionRef.current.stop();
          wakeWordRecognitionRef.current = null;
        } catch (e) {
          console.log('Cleanup on unmount:', e.message);
        }
      }
    };
  }, [isWakeWordActive]); // Remove isOpen dependency to prevent loops

  // Start wake word detection on mount - with proper state management
  useEffect(() => {
    if (isWakeWordActive && !isOpen && !isRecognitionRunning) {
      // Add delay to ensure proper initialization
      const timer = setTimeout(() => {
        if (!isRecognitionRunning && !isOpen) {
          startWakeWordDetection();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
    
    return () => {
      if (wakeWordRecognitionRef.current && isRecognitionRunning) {
        try {
          wakeWordRecognitionRef.current.stop();
          setIsRecognitionRunning(false);
        } catch (e) {
          console.log('Cleanup error:', e.message);
        }
      }
    };
  }, [isWakeWordActive, isOpen, isRecognitionRunning]);

  const startWakeWordDetection = () => {
    // Prevent multiple instances and limit attempts
    if (!wakeWordRecognitionRef.current || 
        isOpen || 
        !isWakeWordActive || 
        isRecognitionRunning ||
        recognitionAttempts >= 5) {
      return;
    }

    try {
      console.log('👂 Wake word detection started - Say "Hey Waiter"');
      setIsRecognitionRunning(true);
      setRecognitionAttempts(prev => prev + 1);
      wakeWordRecognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start wake word detection:', error);
      setIsRecognitionRunning(false);
      
      // Stop trying if we get "already started" error
      if (error.message && error.message.includes('already started')) {
        console.log('Recognition already active, stopping attempts');
        return;
      }
      
      // Reset attempts after a longer delay
      setTimeout(() => {
        setRecognitionAttempts(0);
      }, 10000); // Reset after 10 seconds
    }
  };

  const stopWakeWordDetection = () => {
    if (wakeWordRecognitionRef.current && isRecognitionRunning) {
      try {
        wakeWordRecognitionRef.current.stop();
        setIsRecognitionRunning(false);
        setRecognitionAttempts(0);
        console.log('🛑 Wake word detection stopped');
      } catch (error) {
        console.error('Error stopping wake word detection:', error);
        setIsRecognitionRunning(false);
      }
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

    try {
      addMessage('user', message);
      setInputMessage('');
      setTranscript('');
      setIsTyping(true);

      // Get AI response with error handling
      setTimeout(async () => {
        try {
          const aiResponse = await getAIResponse(message);
          setIsTyping(false);
          addMessage('ai', aiResponse || "I'm here to help! What would you like to know?");
        } catch (error) {
          console.error('Error getting AI response:', error);
          setIsTyping(false);
          addMessage('ai', "Sorry, I encountered an issue. Please try again!");
        }
      }, 800);
    } catch (error) {
      console.error('Error in handleVoiceMessage:', error);
      setIsTyping(false);
      addMessage('ai', "Sorry, something went wrong. Please try again!");
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    try {
      addMessage('user', inputMessage);
      const userQuery = inputMessage;
      setInputMessage('');
      setIsTyping(true);

      // Get AI response with error handling
      setTimeout(async () => {
        try {
          const aiResponse = await getAIResponse(userQuery);
          setIsTyping(false);
          addMessage('ai', aiResponse || "I'm here to help! What would you like to know?");
        } catch (error) {
          console.error('Error getting AI response:', error);
          setIsTyping(false);
          addMessage('ai', "Sorry, I encountered an issue. Please try again!");
        }
      }, 800);
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      setIsTyping(false);
      addMessage('ai', "Sorry, something went wrong. Please try again!");
    }
  };

  // Handle ordering flow conversations
  const handleOrderingFlow = async (message, lowerMessage) => {
    const { step, selectedItem, selectedRestaurant, quantity } = orderingFlow;

    switch (step) {
      case 'dietary_preference':
        if (lowerMessage.includes('veg') || lowerMessage.includes('vegetarian')) {
          setOrderingFlow(prev => ({ ...prev, dietaryPreference: 'vegetarian', step: 'quantity' }));
          return `Great choice! 🥗 How many ${selectedItem.name} would you like to order?\n\nJust say the number (e.g., "2" or "three").`;
        } else if (lowerMessage.includes('non-veg') || lowerMessage.includes('chicken') || lowerMessage.includes('meat')) {
          setOrderingFlow(prev => ({ ...prev, dietaryPreference: 'non-vegetarian', step: 'quantity' }));
          return `Perfect! 🍖 How many ${selectedItem.name} would you like to order?\n\nJust say the number (e.g., "2" or "three").`;
        } else {
          return `I need to know your dietary preference for ${selectedItem.name}:\n\n🥗 Say "vegetarian" or "veg"\n🍖 Say "non-vegetarian" or "non-veg"\n\nWhich would you prefer?`;
        }

      case 'quantity':
        const quantityMatch = message.match(/(\d+|one|two|three|four|five|six|seven|eight|nine|ten)/i);
        if (quantityMatch) {
          const numberWords = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
          const qty = isNaN(quantityMatch[1]) ? numberWords[quantityMatch[1].toLowerCase()] : parseInt(quantityMatch[1]);
          
          if (qty && qty > 0 && qty <= 10) {
            const totalPrice = selectedItem.price * qty;
            setOrderingFlow(prev => ({ ...prev, quantity: qty, step: 'confirmation' }));
            
            return `Perfect! 📝 Here's your order summary:\n\n🏪 Restaurant: ${selectedRestaurant.name}\n🍽️ Item: ${selectedItem.name}\n📊 Quantity: ${qty}\n💰 Total: ₹${totalPrice}\n🕐 Delivery Time: ${selectedRestaurant.deliveryTime}\n\nShould I place this order for you? Say "yes" to confirm or "no" to cancel.`;
          } else {
            return `Please specify a valid quantity between 1 and 10. How many ${selectedItem.name} would you like?`;
          }
        } else {
          return `I didn't catch the quantity. How many ${selectedItem.name} would you like to order? (1-10)`;
        }

      case 'confirmation':
        if (lowerMessage.includes('yes') || lowerMessage.includes('confirm') || lowerMessage.includes('place order')) {
          return await placeOrder();
        } else if (lowerMessage.includes('no') || lowerMessage.includes('cancel')) {
          setOrderingFlow({ isActive: false, step: null, selectedItem: null, selectedRestaurant: null, quantity: 1, dietaryPreference: null, userLocation: null, orderDetails: {} });
          return `No problem! 😊 Your order has been cancelled. Is there anything else I can help you with?`;
        } else {
          return `Please confirm your order:\n\n✅ Say "yes" or "confirm" to place the order\n❌ Say "no" or "cancel" to cancel\n\nWhat would you like to do?`;
        }

      default:
        setOrderingFlow({ isActive: false, step: null, selectedItem: null, selectedRestaurant: null, quantity: 1, dietaryPreference: null, userLocation: null, orderDetails: {} });
        return "Let me help you with something else. What would you like to know?";
    }
  };

  // Place order function
  const placeOrder = async () => {
    try {
      const { selectedItem, selectedRestaurant, quantity, dietaryPreference } = orderingFlow;
      const totalAmount = selectedItem.price * quantity;

      // Get user location for delivery
      if (navigator.geolocation) {
        return new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              try {
                // Create order
                const orderData = {
                  restaurantId: selectedRestaurant._id,
                  items: [{
                    itemId: selectedItem._id,
                    name: selectedItem.name,
                    price: selectedItem.price,
                    quantity: quantity,
                    dietaryPreference: dietaryPreference
                  }],
                  totalAmount: totalAmount,
                  deliveryAddress: {
                    latitude,
                    longitude,
                    address: "Current Location" // You can enhance this with reverse geocoding
                  },
                  orderType: 'delivery',
                  paymentMethod: 'cash_on_delivery'
                };

                // Here you would typically send to your order API
                // const response = await axios.post('/api/orders', orderData);
                
                // For now, simulate successful order
                setCurrentOrder({
                  items: orderData.items,
                  restaurant: selectedRestaurant,
                  totalAmount: totalAmount,
                  deliveryAddress: orderData.deliveryAddress
                });

                // Reset ordering flow
                setOrderingFlow({ isActive: false, step: null, selectedItem: null, selectedRestaurant: null, quantity: 1, dietaryPreference: null, userLocation: null, orderDetails: {} });

                resolve(`🎉 Order placed successfully!\n\n📋 Order Details:\n🏪 ${selectedRestaurant.name}\n🍽️ ${quantity}x ${selectedItem.name}\n💰 Total: ₹${totalAmount}\n🚚 Delivery: ${selectedRestaurant.deliveryTime}\n📍 To your current location\n\n📱 You'll receive updates on your order status. Thank you for using our service!`);
              } catch (error) {
                resolve(`❌ Sorry, there was an issue placing your order. Please try again or contact support.`);
              }
            },
            () => {
              resolve(`📍 I need your location to complete the delivery. Please allow location access and try again.`);
            }
          );
        });
      } else {
        return `📍 Location services are not available. Please ensure location is enabled and try again.`;
      }
    } catch (error) {
      return `❌ Sorry, there was an issue placing your order. Please try again.`;
    }
  };

  // Start ordering flow for a specific item
  const startOrderingFlow = (item, restaurant) => {
    setOrderingFlow({
      isActive: true,
      step: 'dietary_preference',
      selectedItem: item,
      selectedRestaurant: restaurant,
      quantity: 1,
      dietaryPreference: null,
      userLocation: null,
      orderDetails: {}
    });

    return `Great choice! 🍽️ I'd love to help you order ${item.name} from ${restaurant.name}.\n\n${item.description ? `📝 ${item.description}\n` : ''}💰 Price: ₹${item.price}\n⭐ Rating: ${item.rating || 'N/A'}/5\n\nFirst, do you prefer:\n🥗 Vegetarian\n🍖 Non-vegetarian\n\nWhich option would you like?`;
  };

  const getAIResponse = async (message) => {
    const lowerMessage = message.toLowerCase();

    try {
      // Initialize session ID if not exists
      if (!conversationState.sessionId) {
        const newSessionId = `session_${Date.now().toString().slice(-6)}_${Math.random().toString(36).slice(2, 8)}`;
        setConversationState(prev => ({ ...prev, sessionId: newSessionId }));
      }
      
      // Try OpenAI-powered AI endpoint first
      const aiResponse = await axios.post('/api/ai/chat', {
        message: message,
        userId: 'user123', // You can get this from auth context
        sessionId: conversationState.sessionId || `temp_${Date.now()}`,
        includeRestaurants: true
      });

      const { response, restaurantCount } = aiResponse.data;
      
      console.log(`✅ OpenAI Response generated (${restaurantCount} restaurants in context)`);
      return response;
      
    } catch (error) {
      console.error('❌ OpenAI API error, falling back to voice API:', error);
      
      // Fallback to voice API
      try {
        const response = await axios.post('/api/voice/chat', {
          message: message,
          userId: 'user123',
          sessionId: conversationState.sessionId || `temp_${Date.now()}`
        });

        const { response: aiResponse, suggestions, restaurants: foundRestaurants, conversationState: newState } = response.data;
        
        // Update conversation state
        if (newState) {
          setConversationState(prev => ({
            ...prev,
            step: newState.step,
            foodItem: newState.foodItem,
            isVeg: newState.isVeg,
            quantity: newState.quantity
          }));
        }
        
        // Update restaurants if found
        if (foundRestaurants && foundRestaurants.length > 0) {
          setRestaurants(foundRestaurants);
        }
        
        return aiResponse;
      } catch (voiceError) {
        console.error('❌ Voice API also failed, using enhanced fallback:', voiceError);
        // Enhanced fallback with restaurant search
        return getEnhancedAIResponseWithSearch(message, lowerMessage);
      }
    }
  };

  const getEnhancedAIResponseWithSearch = async (message, lowerMessage) => {
    // Handle food requests with basic search
    if (lowerMessage.includes('want') || lowerMessage.includes('get me') || lowerMessage.includes('order')) {
      const foodItems = ['burger', 'pizza', 'biryani', 'chicken', 'pasta', 'noodles'];
      const foundFood = foodItems.find(food => lowerMessage.includes(food));
      
      if (foundFood) {
        // Search restaurants for this food item
        const matchingRestaurants = restaurants.filter(restaurant => {
          // Check menu items
          const hasMenuItems = restaurant.menu && restaurant.menu.some(item => 
            item.name.toLowerCase().includes(foundFood) && item.available !== false
          );
          
          // Check cuisine types
          const hasCuisine = restaurant.cuisine && restaurant.cuisine.some(cuisine => 
            cuisine.toLowerCase().includes(foundFood.toLowerCase())
          );
          
          return hasMenuItems || hasCuisine;
        });
        
        if (matchingRestaurants.length > 0) {
          let response = `🍽️ Found ${foundFood.toUpperCase()} at ${matchingRestaurants.length} restaurant${matchingRestaurants.length > 1 ? 's' : ''}:\n\n`;
          
          matchingRestaurants.slice(0, 3).forEach((restaurant, index) => {
            response += `${index + 1}. ${restaurant.name}\n`;
            response += `⭐ ${restaurant.rating}/5 | 🕐 ${restaurant.deliveryTime}\n`;
            
            const foodMenuItems = restaurant.menu.filter(item => {
              const nameMatch = item.name.toLowerCase().includes(foundFood);
              const cuisineMatch = restaurant.cuisine && restaurant.cuisine.some(cuisine => 
                cuisine.toLowerCase().includes(foundFood.toLowerCase())
              );
              const available = item.available !== false;
              
              return (nameMatch || cuisineMatch) && available;
            });
            
            if (foodMenuItems.length > 0) {
              response += `${foundFood.toUpperCase()} Items:\n`;
              foodMenuItems.slice(0, 2).forEach(item => {
                response += `• ${item.name} - ₹${item.price}\n`;
              });
            }
            response += '\n';
          });
          
          response += `🛒 To place an order, just tell me which restaurant and items you'd like!`;
          return response;
        } else {
          return `🔍 I couldn't find any ${foundFood} items in our current restaurants. Try browsing all restaurants or search for similar items like:\n\n• Pizza → Italian cuisine\n• Biryani → Indian cuisine\n• Noodles → Chinese cuisine\n• Burgers → Fast food\n\nWhat else can I help you find?`;
        }
      }
    }
    
    return await getSimpleAIResponse(message, lowerMessage);
  };

  const getSimpleAIResponse = async (message, lowerMessage) => {
    // Simple test response to check if AI is working
    if (lowerMessage.includes('test') || lowerMessage.includes('hello')) {
      return "✅ AI Assistant is working! I can help you with:\n\n🍽️ Finding restaurants\n📋 Viewing menus\n🛒 Placing orders\n🎤 Voice commands\n\nWhat would you like to do?";
    }

    // Handle ordering flow if active
    if (orderingFlow.isActive) {
      return handleOrderingFlow(message, lowerMessage);
    }

    // Handle direct food mentions (like just saying "pizza")
    const foodItems = ['burger', 'pizza', 'biryani', 'chicken', 'pasta', 'noodles'];
    const foundFood = foodItems.find(food => lowerMessage.includes(food));
    
    if (foundFood && !lowerMessage.includes('want') && !lowerMessage.includes('get me') && !lowerMessage.includes('order')) {
      // Search restaurants for this food item
      const matchingRestaurants = restaurants.filter(restaurant => {
        // Check menu items
        const hasMenuItems = restaurant.menu && restaurant.menu.some(item => 
          item.name.toLowerCase().includes(foundFood) && item.available !== false
        );
        
        // Check cuisine types
        const hasCuisine = restaurant.cuisine && restaurant.cuisine.some(cuisine => 
          cuisine.toLowerCase().includes(foundFood.toLowerCase())
        );
        
        return hasMenuItems || hasCuisine;
      });
      
      if (matchingRestaurants.length > 0) {
        let response = `🍽️ Found ${foundFood.toUpperCase()} at ${matchingRestaurants.length} restaurant${matchingRestaurants.length > 1 ? 's' : ''}:\n\n`;
        
        matchingRestaurants.slice(0, 3).forEach((restaurant, index) => {
          response += `${index + 1}. ${restaurant.name}\n`;
          response += `⭐ ${restaurant.rating}/5 | 🕐 ${restaurant.deliveryTime}\n`;
          
          const foodMenuItems = restaurant.menu.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(foundFood);
            const cuisineMatch = restaurant.cuisine && restaurant.cuisine.some(cuisine => 
              cuisine.toLowerCase().includes(foundFood.toLowerCase())
            );
            const available = item.available !== false;
            
            return (nameMatch || cuisineMatch) && available;
          });
          
          if (foodMenuItems.length > 0) {
            response += `${foundFood.toUpperCase()} Items:\n`;
            foodMenuItems.slice(0, 2).forEach(item => {
              response += `• ${item.name} - ₹${item.price}\n`;
            });
          }
          response += '\n';
        });
        
        response += `🛒 To place an order, just tell me which restaurant and items you'd like!`;
        return response;
      } else {
        return `🔍 I couldn't find any ${foundFood} items in our current restaurants. Try browsing all restaurants or search for similar items like:\n\n• Pizza → Italian cuisine\n• Biryani → Indian cuisine\n• Noodles → Chinese cuisine\n• Burgers → Fast food\n\nWhat else can I help you find?`;
      }
    }

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

    // Handle menu requests
    if (lowerMessage.includes('menu') || lowerMessage.includes('show menu')) {
      // Check if asking for specific restaurant menu
      const restaurantMatch = restaurants.find(r => 
        lowerMessage.includes(r.name.toLowerCase())
      );
      
      if (restaurantMatch) {
        let response = `📋 ${restaurantMatch.name} - Full Menu\n\n`;
        response += `⭐ ${restaurantMatch.rating}/5 | 🕐 ${restaurantMatch.deliveryTime}\n\n`;
        
        if (restaurantMatch.menu && restaurantMatch.menu.length > 0) {
          // Group items by category if available
          const categories = {};
          restaurantMatch.menu.forEach(item => {
            const category = item.category || 'Main Items';
            if (!categories[category]) categories[category] = [];
            categories[category].push(item);
          });
          
          Object.keys(categories).forEach(category => {
            response += `🍽️ ${category}:\n`;
            categories[category].slice(0, 8).forEach((item, i) => {
              response += `${i + 1}. ${item.name} - ₹${item.price}`;
              if (item.rating) response += ` (⭐ ${item.rating}/5)`;
              if (item.description) response += `\n   ${item.description.substring(0, 50)}...`;
              response += `\n`;
            });
            response += `\n`;
          });
          
          if (restaurantMatch.menu.length > 8) {
            response += `...and ${restaurantMatch.menu.length - 8} more items available!\n\n`;
          }
        } else {
          response += `Menu not available. Please visit the restaurant page for full details.\n\n`;
        }
        
        response += `Would you like to order from ${restaurantMatch.name}?`;
        return response;
      } else {
        // General menu request
        return "📋 To see a restaurant's menu, try:\n\n• 'Show [Restaurant Name] menu'\n• 'What's on the menu at [Restaurant]'\n• Or browse restaurants on the home page\n\nWhich restaurant menu would you like to see?";
      }
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
        restaurantMatch.menu.slice(0, 5).forEach((item, i) => {
          response += `${i + 1}. ${item.name} - ₹${item.price}`;
          if (item.rating) response += ` (⭐ ${item.rating}/5)`;
          response += `\n`;
        });
        
        if (restaurantMatch.menu.length > 5) {
          response += `\n...and ${restaurantMatch.menu.length - 5} more items! Say 'show ${restaurantMatch.name} menu' for full menu.`;
        }
      }
      
      response += `\n\nWould you like to see the full menu or visit this restaurant?`;
      return response;
    }

    // Enhanced search for specific food items with comprehensive menu exploration
    const foodKeywords = [
      'pizza', 'burger', 'biryani', 'pasta', 'sandwich', 'chicken', 'noodles', 
      'rice', 'curry', 'salad', 'soup', 'dessert', 'cake', 'ice cream', 'coffee',
      'tea', 'juice', 'paneer', 'dal', 'roti', 'naan', 'dosa', 'idli', 'samosa',
      'momos', 'rolls', 'wrap', 'kebab', 'tikka', 'tandoor', 'fried', 'grilled',
      'chinese', 'italian', 'indian', 'mexican', 'thai', 'continental'
    ];
    
    const searchedFood = foodKeywords.find(keyword => lowerMessage.includes(keyword));
    
    if (searchedFood) {
      // Find restaurants that serve this food type
      const relevantRestaurants = [];
      const allMatchingItems = [];
      
      restaurants.forEach(restaurant => {
        let restaurantHasFood = false;
        const restaurantItems = [];
        
        // Check menu items
        restaurant.menu?.forEach(item => {
          const itemName = item.name.toLowerCase();
          const itemDescription = item.description?.toLowerCase() || '';
          
          // More comprehensive matching
          if (itemName.includes(searchedFood) || 
              itemDescription.includes(searchedFood) ||
              (searchedFood === 'pizza' && (itemName.includes('margherita') || itemName.includes('pepperoni'))) ||
              (searchedFood === 'chinese' && (itemName.includes('noodles') || itemName.includes('fried rice') || itemName.includes('manchurian'))) ||
              (searchedFood === 'indian' && (itemName.includes('curry') || itemName.includes('dal') || itemName.includes('paneer'))) ||
              (searchedFood === 'italian' && (itemName.includes('pasta') || itemName.includes('pizza'))) ||
              (searchedFood === 'chicken' && itemName.includes('chicken')) ||
              (searchedFood === 'biryani' && itemName.includes('biryani'))) {
            
            restaurantHasFood = true;
            restaurantItems.push({
              ...item,
              restaurantName: restaurant.name,
              restaurantId: restaurant._id,
              restaurantRating: restaurant.rating,
              deliveryTime: restaurant.deliveryTime
            });
            
            allMatchingItems.push({
              ...item,
              restaurantName: restaurant.name,
              restaurantId: restaurant._id,
              restaurantRating: restaurant.rating,
              deliveryTime: restaurant.deliveryTime
            });
          }
        });
        
        // Check cuisine type
        if (restaurant.cuisine?.some(c => c.toLowerCase().includes(searchedFood))) {
          restaurantHasFood = true;
        }
        
        if (restaurantHasFood) {
          relevantRestaurants.push({
            ...restaurant,
            matchingItems: restaurantItems
          });
        }
      });
      
      if (relevantRestaurants.length > 0) {
        let response = `🍽️ Found ${searchedFood.toUpperCase()} at ${relevantRestaurants.length} restaurants:\n\n`;
        
        // Show restaurants with their specific items
        relevantRestaurants.slice(0, 4).forEach((restaurant, i) => {
          response += `${i + 1}. 🏪 ${restaurant.name}\n`;
          response += `   ⭐ ${restaurant.rating}/5 | 🕐 ${restaurant.deliveryTime}\n`;
          
          if (restaurant.matchingItems.length > 0) {
            response += `   ${searchedFood.toUpperCase()} Items:\n`;
            restaurant.matchingItems.slice(0, 3).forEach((item, j) => {
              response += `   • ${item.name} - ₹${item.price}`;
              if (item.rating) response += ` (⭐ ${item.rating}/5)`;
              response += `\n`;
            });
            
            if (restaurant.matchingItems.length > 3) {
              response += `   • ...and ${restaurant.matchingItems.length - 3} more ${searchedFood} items\n`;
            }
          } else {
            response += `   🍴 Specializes in ${restaurant.cuisine?.join(', ')}\n`;
          }
          response += `\n`;
        });
        
        if (relevantRestaurants.length > 4) {
          response += `...and ${relevantRestaurants.length - 4} more restaurants serve ${searchedFood}!\n\n`;
        }
        
        // Show top-rated items across all restaurants
        if (allMatchingItems.length > 0) {
          const topItems = allMatchingItems
            .filter(item => item.rating && item.rating >= 4)
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 3);
          
          if (topItems.length > 0) {
            response += `🌟 Top-rated ${searchedFood} items:\n`;
            topItems.forEach((item, i) => {
              response += `${i + 1}. ${item.name} - ₹${item.price}\n`;
              response += `   ⭐ ${item.rating}/5 | 📍 ${item.restaurantName}\n`;
            });
          }
        }
        
        // Check for ordering intent
        const orderingKeywords = ['order', 'buy', 'get', 'want', 'need', 'craving', 'hungry for'];
        const hasOrderingIntent = orderingKeywords.some(keyword => lowerMessage.includes(keyword));
        
        if (hasOrderingIntent && allMatchingItems.length > 0) {
          // Get user location and find nearest restaurant with the best item
          if (navigator.geolocation) {
            return new Promise((resolve) => {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const { latitude, longitude } = position.coords;
                  
                  // Find the best item from nearest restaurants
                  const bestItem = allMatchingItems
                    .filter(item => item.rating && item.rating >= 4)
                    .sort((a, b) => b.rating - a.rating)[0];
                  
                  if (bestItem) {
                    const restaurant = relevantRestaurants.find(r => r._id === bestItem.restaurantId);
                    const orderResponse = startOrderingFlow(bestItem, restaurant);
                    resolve(orderResponse);
                  } else {
                    resolve(response + `\n\n🛒 To place an order, just tell me which item you'd like!`);
                  }
                },
                () => {
                  resolve(response + `\n\n🛒 To place an order, just tell me which item you'd like!`);
                }
              );
            });
          }
        }
        
        response += `\n\n🛒 Ready to order? Just say "I want [item name]" and I'll help you place the order!\n\nOr would you like to see full menus first?`;
        return response;
      } else {
        return `🔍 I couldn't find any ${searchedFood} items in our current restaurants. Try browsing all restaurants or search for similar items like:\n\n• Pizza → Italian cuisine\n• Biryani → Indian cuisine\n• Noodles → Chinese cuisine\n• Burgers → Fast food\n\nWhat else can I help you find?`;
      }
    }

    // Detect specific item ordering intent
    const orderingPhrases = ['i want', 'i need', 'order', 'get me', 'buy', 'i\'ll have', 'can i get'];
    const hasSpecificOrderIntent = orderingPhrases.some(phrase => lowerMessage.includes(phrase));
    
    if (hasSpecificOrderIntent) {
      // Try to find specific item mentioned
      const allItems = [];
      restaurants.forEach(restaurant => {
        restaurant.menu?.forEach(item => {
          allItems.push({
            ...item,
            restaurant: restaurant,
            restaurantName: restaurant.name,
            restaurantId: restaurant._id
          });
        });
      });
      
      // Find item that matches the message
      const matchedItem = allItems.find(item => {
        const itemName = item.name.toLowerCase();
        const words = lowerMessage.split(' ');
        return words.some(word => itemName.includes(word) && word.length > 3);
      });
      
      if (matchedItem) {
        return startOrderingFlow(matchedItem, matchedItem.restaurant);
      } else {
        return "🍽️ I'd love to help you order! Could you be more specific about what you'd like? For example:\n\n• 'I want pizza'\n• 'Order chicken biryani'\n• 'Get me a burger'\n\nWhat would you like to eat?";
      }
    }

    // Food recommendations
    if (lowerMessage.includes('food') || lowerMessage.includes('eat') || lowerMessage.includes('hungry')) {
      return "🍽️ Great! Let me help you find something delicious.\n\nPopular choices:\n• Biryani - Aromatic and flavorful\n• Pizza - Classic favorite\n• Burgers - Quick and satisfying\n• Chinese - Variety of options\n• Indian - Rich and spicy\n\nWhat sounds good to you? Just say 'I want [food name]' to start ordering!";
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

  const resetConversation = () => {
    setConversationState({
      step: 'initial',
      foodItem: null,
      isVeg: null,
      quantity: null,
      sessionId: `session_${Date.now().toString().slice(-6)}_${Math.random().toString(36).slice(2, 8)}`
    });
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
        <div className="fixed bottom-20 left-4 z-50 w-80 sm:w-96 h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-purple-200 dark:border-purple-700">
          {/* Chat Header - Compact */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Brain size={24} className="animate-pulse" />
                  <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white"></div>
                </div>
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    AI Voice Assistant
                    {conversationMode && <MessageCircle size={14} className="animate-bounce" />}
                  </h3>
                  <p className="text-xs opacity-90 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                    {conversationMode ? 'Conversation Mode' : 'Online & Ready'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Voice Settings"
                >
                  <Settings size={16} />
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowSettings(false);
                    setRecognitionAttempts(0); // Reset attempts
                    setTimeout(() => {
                      if (isWakeWordActive && !isRecognitionRunning) {
                        startWakeWordDetection();
                      }
                    }, 1000);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close AI Assistant"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            
            {/* Compact Controls */}
            <div className="space-y-1.5">
              {/* Wake Word Toggle */}
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <Mic size={12} />
                  <span className="text-xs font-medium">Wake Word: "Hey Waiter"</span>
                </div>
                <button
                  onClick={() => {
                    const newState = !isWakeWordActive;
                    setIsWakeWordActive(newState);
                    setRecognitionAttempts(0); // Reset attempts
                    
                    if (newState && !isRecognitionRunning) {
                      setTimeout(() => startWakeWordDetection(), 1000);
                    } else {
                      stopWakeWordDetection();
                    }
                  }}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    isWakeWordActive ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      isWakeWordActive ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Conversation Mode Toggle */}
              <div className="flex items-center justify-between bg-white/10 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <MessageCircle size={12} />
                  <span className="text-xs font-medium">Conversation Mode</span>
                </div>
                <button
                  onClick={() => setConversationMode(!conversationMode)}
                  className={`relative inline-flex h-4 w-7 items-center rounded-full transition-colors ${
                    conversationMode ? 'bg-green-400' : 'bg-gray-400'
                  }`}
                >
                  <span
                    className={`inline-block h-2.5 w-2.5 transform rounded-full bg-white transition-transform ${
                      conversationMode ? 'translate-x-3.5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Collapsible Voice Settings Panel */}
            {showSettings && (
              <div className="mt-2 bg-white/10 rounded-lg p-2.5 space-y-2 max-h-48 overflow-y-auto">
                <h4 className="text-xs font-semibold">Voice Settings</h4>
                
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
                          {voice.name.split(' ')[0]} ({voice.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Compact Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs font-medium block mb-1">Speed</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.rate}
                      onChange={(e) => updateVoiceSettings({ rate: parseFloat(e.target.value) })}
                      className="w-full h-1"
                    />
                    <span className="text-xs opacity-75">{voiceSettings.rate.toFixed(1)}x</span>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium block mb-1">Pitch</label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.pitch}
                      onChange={(e) => updateVoiceSettings({ pitch: parseFloat(e.target.value) })}
                      className="w-full h-1"
                    />
                    <span className="text-xs opacity-75">{voiceSettings.pitch.toFixed(1)}</span>
                  </div>
                  
                  <div>
                    <label className="text-xs font-medium block mb-1">Volume</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.volume}
                      onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                      className="w-full h-1"
                    />
                    <span className="text-xs opacity-75">{Math.round(voiceSettings.volume * 100)}%</span>
                  </div>
                </div>

                {/* Compact Test Buttons */}
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => speak("Hello! This is how I sound with your current settings.")}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 px-2 rounded transition-colors"
                  >
                    Test Voice
                  </button>
                  
                  <button
                    onClick={() => speak("📍 Found 3 restaurants near you: 🍕 Pizza Palace • ₹299 • ⭐ 4.5/5")}
                    className="bg-white/20 hover:bg-white/30 text-white text-xs py-1.5 px-2 rounded transition-colors"
                  >
                    Test Clean
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions - Compact */}
          {messages.length <= 1 && (
            <div className="p-3 bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 border-b border-purple-200 dark:border-purple-800 flex-shrink-0">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Zap size={14} className="text-purple-600" />
                Quick Actions
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {quickActions.map((action) => {
                  const IconComponent = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuickAction(action.text)}
                      className="flex items-center gap-2 p-2.5 bg-white dark:bg-gray-700 rounded-lg border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-left shadow-sm hover:shadow-md"
                    >
                      <IconComponent size={14} className="text-purple-600 dark:text-purple-400 flex-shrink-0" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-tight">{action.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Messages Container - Enhanced Scrolling */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gradient-to-b from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 scrollbar-thin scrollbar-thumb-purple-300 scrollbar-track-transparent">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border border-purple-200 dark:border-purple-800'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Brain size={14} className="text-purple-600 dark:text-purple-400" />
                      <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">AI Assistant</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-line leading-relaxed">{message.text}</p>
                  <p className={`text-xs mt-1.5 opacity-75 ${
                    message.sender === 'user' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator - Enhanced */}
            {isTyping && (
              <div className="flex justify-start animate-fadeIn">
                <div className="bg-white dark:bg-gray-700 rounded-2xl p-3 shadow-sm border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Scroll anchor */}
            <div ref={messagesEndRef} className="h-1" />
          </div>

          {/* Input Area - Compact & Clean */}
          <div className="p-3 bg-white dark:bg-gray-800 border-t border-purple-200 dark:border-purple-800 flex-shrink-0">
            {/* Voice Status - Compact */}
            {(isListening || transcript) && (
              <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-2 text-sm">
                  {isListening && (
                    <>
                      <Mic size={14} className="text-purple-600 animate-pulse" />
                      <span className="text-purple-600 dark:text-purple-400 font-medium">Listening... Speak now</span>
                    </>
                  )}
                  {transcript && !isListening && (
                    <>
                      <Loader size={14} className="text-green-600 animate-spin" />
                      <span className="text-green-600 dark:text-green-400 font-medium text-xs">Processing: "{transcript.substring(0, 30)}..."</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex gap-2 items-center">
              {/* Voice Button - Primary interaction */}
              <button
                onClick={toggleListening}
                disabled={isTyping}
                className={`p-3 rounded-xl transition-all flex-shrink-0 shadow-lg hover:shadow-xl ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105'
                } text-white disabled:opacity-50`}
                aria-label={isListening ? "Stop listening" : "Start voice input"}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              {/* Text Input - Sleek design */}
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Or type here..."
                disabled={isListening || isTyping}
                className="flex-1 px-3 py-2.5 border border-purple-300 dark:border-purple-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white placeholder-gray-400 disabled:opacity-50 text-sm transition-all"
              />
              
              {/* Speaker Button - Stop AI voice */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="bg-orange-500 hover:bg-orange-600 text-white p-2.5 rounded-xl transition-all flex-shrink-0 shadow-md hover:shadow-lg"
                  aria-label="Stop speaking"
                >
                  <Volume2 size={16} className="animate-pulse" />
                </button>
              )}
              
              {/* Send Button - Only for text input */}
              {inputMessage.trim() && !isListening && (
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2.5 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex-shrink-0 hover:scale-105"
                  aria-label="Send message"
                >
                  <Send size={16} />
                </button>
              )}
            </div>
            
            {/* Status Text - Compact */}
            <div className="mt-2 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1">
                <Mic size={10} />
                {isListening ? 'Speak now - Auto-sends when done' : 'Click mic to speak • Auto-sends voice messages'}
              </p>
              {conversationMode && (
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5 flex items-center justify-center gap-1">
                  <MessageCircle size={10} />
                  Conversation mode: AI will listen after responding
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
