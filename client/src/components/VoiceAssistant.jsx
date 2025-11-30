import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export default function VoiceAssistant({ restaurantId, tableNumber, onOrderProcessed }) {
  // Load conversation state from localStorage on mount
  const loadConversationState = () => {
    try {
      const saved = localStorage.getItem('aman_conversation_state');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error('Error loading conversation state:', e);
      return null;
    }
  };

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [wakeWordDetected, setWakeWordDetected] = useState(false);
  const [conversationState, setConversationState] = useState(loadConversationState); // Load from localStorage
  const [recommendedItems, setRecommendedItems] = useState([]);
  const recognitionRef = useRef(null);
  const conversationStateRef = useRef(loadConversationState()); // Initialize ref with saved state

  // Helper function to speak text
  const speak = (text) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.volume = 1.0;
      
      // Pause recognition while speaking to avoid feedback loop
      utterance.onstart = () => {
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.log('Could not stop recognition:', e);
          }
        }
      };
      
      // Resume recognition after speaking
      utterance.onend = () => {
        if (isListening) {
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
            } catch (e) {
              console.log('Could not restart recognition:', e);
            }
          }, 500);
        }
      };
      
      window.speechSynthesis.speak(utterance);
    }
  };

  // Helper function to play beep sound
  const playBeep = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  // Helper to save conversation state to both state and localStorage
  const saveConversationState = (newState) => {
    console.log('Saving conversation state:', newState);
    setConversationState(newState);
    conversationStateRef.current = newState;
    
    // Persist to localStorage
    try {
      if (newState === null) {
        localStorage.removeItem('aman_conversation_state');
      } else {
        localStorage.setItem('aman_conversation_state', JSON.stringify(newState));
      }
    } catch (e) {
      console.error('Error saving conversation state:', e);
    }
  };

  // Update ref whenever conversationState changes
  useEffect(() => {
    conversationStateRef.current = conversationState;
  }, [conversationState]);

  useEffect(() => {
    // Check if browser supports speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(finalTranscript);
          
          const lowerTranscript = finalTranscript.toLowerCase();
          const hasWakeWord = lowerTranscript.includes('hey aman') || 
                             lowerTranscript.includes('hey amaan') ||
                             lowerTranscript.includes('hey aman');
          
          // If in conversation, process any response (no wake word needed)
          // Otherwise, only process if wake word is detected
          if (conversationStateRef.current || hasWakeWord) {
            if (hasWakeWord) {
              // Provide immediate feedback for wake word
              setWakeWordDetected(true);
              playBeep();
              setResponse('🎤 Activated! I am listening...');
              setTimeout(() => speak('Yes, listening!'), 100);
            }
            
            processVoiceCommand(finalTranscript);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed' || event.error === 'permission-denied') {
          setPermissionDenied(true);
          setResponse('Microphone permission denied. Please enable it in your browser settings.');
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        if (isListening) {
          try {
            recognitionRef.current.start();
          } catch (error) {
            console.error('Failed to restart recognition:', error);
            setIsListening(false);
          }
        }
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      // Request microphone permission on mobile/APK
      try {
        // For Capacitor/APK, permissions are handled via AndroidManifest
        // For web, request permission
        if (!Capacitor.isNativePlatform() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        
        recognitionRef.current?.start();
        setIsListening(true);
        setTranscript('');
        setResponse('');
        setPermissionDenied(false);
      } catch (error) {
        console.error('Microphone permission error:', error);
        setPermissionDenied(true);
        const errorMsg = Capacitor.isNativePlatform() 
          ? 'Please allow microphone access in your device settings.'
          : 'Please allow microphone access to use voice commands.';
        setResponse(errorMsg);
      }
    }
  };

  const processVoiceCommand = async (command) => {
    setIsProcessing(true);
    try {
      const lowerCommand = command.toLowerCase();
      console.log('Processing command:', lowerCommand);
      console.log('Restaurant ID:', restaurantId);
      console.log('Conversation state:', conversationState);
      
      // If we're in a conversation state, handle follow-up
      if (conversationState) {
        console.log('In conversation, handling follow-up');
        await handleFollowUp(lowerCommand);
        return;
      }
      
      // Check if user is requesting a specific food item on home page
      const hasFoodRequest = lowerCommand.includes('get me') || 
                            lowerCommand.includes('order') || 
                            lowerCommand.includes('i want') ||
                            lowerCommand.includes('add');
      
      console.log('Has food request keywords:', hasFoodRequest);
      
      if (!restaurantId && hasFoodRequest) {
        console.log('Handling specific food request');
        await handleSpecificFoodRequest(lowerCommand);
        return;
      }
      
      // Check if user is asking for recommendations on home page (no restaurantId)
      if (!restaurantId && (
        lowerCommand.includes('recommend') || 
        lowerCommand.includes('suggest') || 
        lowerCommand.includes('best') ||
        lowerCommand.includes('top rated') ||
        lowerCommand.includes('popular')
      )) {
        await handleRecommendationRequest();
        return;
      }
      
      // Regular order processing for QR order page
      if (restaurantId) {
        const { data } = await axios.post('/api/voice/process', {
          command,
          restaurantId,
          tableNumber
        });

        setResponse(data.reply);
        setTimeout(() => speak(data.reply), 500);

        if (data.action === 'order' && data.items.length > 0) {
          onOrderProcessed?.(data);
        }
      } else {
        const msg = "Please scan the QR code at your table first to start ordering.";
        setResponse(msg);
        speak(msg);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMsg = "Sorry, I couldn't process that. Please try again.";
      setResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
      setWakeWordDetected(false);
    }
  };

  const handleSpecificFoodRequest = async (command) => {
    try {
      console.log('Processing food request:', command);
      
      // Extract quantity from command
      const requestedQuantity = extractQuantity(command);
      console.log('Extracted quantity:', requestedQuantity);
      
      // Fetch all restaurants with their menus
      const { data: restaurants } = await axios.get('/api/restaurants');
      console.log('Fetched restaurants:', restaurants.length);
      
      // Collect all menu items with ratings
      const allItems = [];
      restaurants.forEach(restaurant => {
        if (restaurant.menu) {
          restaurant.menu.forEach(item => {
            allItems.push({
              ...item,
              restaurantId: restaurant._id,
              restaurantName: restaurant.name
            });
          });
        }
      });
      console.log('Total menu items:', allItems.length);
      
      // Extract food item name from command - expanded list
      const foodKeywords = [
        'pizza', 'burger', 'biryani', 'pasta', 'chicken', 'paneer', 'naan', 
        'rice', 'dal', 'tikka', 'fries', 'shake', 'lassi', 'coke', 'pepsi',
        'sandwich', 'wrap', 'salad', 'soup', 'bread', 'roti', 'paratha',
        'dosa', 'idli', 'vada', 'samosa', 'pakora', 'kebab', 'curry',
        'masala', 'korma', 'butter', 'tandoori', 'fried', 'grilled'
      ];
      let matchedFood = null;
      
      for (const keyword of foodKeywords) {
        if (command.includes(keyword)) {
          matchedFood = keyword;
          console.log('Matched food keyword:', matchedFood);
          break;
        }
      }
      
      if (!matchedFood) {
        console.log('No food keyword matched in command:', command);
        const msg = "I couldn't identify the food item. Could you please be more specific? Try saying something like 'get me pizza' or 'order burger'.";
        setResponse(msg);
        speak(msg);
        return;
      }
      
      // Find matching items
      const matchingItems = allItems.filter(item => 
        item.name.toLowerCase().includes(matchedFood) ||
        matchedFood.includes(item.name.toLowerCase().split(' ')[0])
      );
      console.log('Matching items found:', matchingItems.length);
      
      if (matchingItems.length === 0) {
        const msg = `Sorry, I couldn't find any ${matchedFood} in our restaurants. Try asking for something else!`;
        setResponse(msg);
        speak(msg);
        return;
      }
      
      // Store matched items and ask for veg/non-veg preference
      const newState = {
        step: 'awaiting_veg_preference',
        items: matchingItems,
        foodName: matchedFood,
        requestedQuantity: requestedQuantity || null
      };
      
      saveConversationState(newState);
      
      const msg = `Sure! Would you like a vegetarian or non-vegetarian ${matchedFood}?`;
      setResponse(msg);
      speak(msg);
      
    } catch (error) {
      console.error('Error handling food request:', error);
      const msg = "Sorry, I couldn't process your request. Please try again.";
      setResponse(msg);
      speak(msg);
    }
  };

  const handleRecommendationRequest = async () => {
    try {
      // Fetch all restaurants with their menus
      const { data: restaurants } = await axios.get('/api/restaurants');
      
      // Collect all menu items with ratings
      const allItems = [];
      restaurants.forEach(restaurant => {
        if (restaurant.menu) {
          restaurant.menu.forEach(item => {
            allItems.push({
              ...item,
              restaurantId: restaurant._id,
              restaurantName: restaurant.name
            });
          });
        }
      });
      
      // Filter items with ratings and sort by rating
      const ratedItems = allItems
        .filter(item => item.averageRating && item.averageRating > 0)
        .sort((a, b) => b.averageRating - a.averageRating)
        .slice(0, 10); // Top 10 items
      
      if (ratedItems.length === 0) {
        const msg = "Sorry, I couldn't find any rated items at the moment.";
        setResponse(msg);
        speak(msg);
        return;
      }
      
      setRecommendedItems(ratedItems);
      
      // Ask for veg/non-veg preference
      const msg = "I found some highly rated items! Do you want vegetarian or non-vegetarian options?";
      setResponse(msg);
      speak(msg);
      
      const newState = {
        step: 'awaiting_veg_preference',
        items: ratedItems
      };
      saveConversationState(newState);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      const msg = "Sorry, I couldn't fetch recommendations. Please try again.";
      setResponse(msg);
      speak(msg);
    }
  };

  const handleFollowUp = async (command) => {
    try {
      if (conversationState.step === 'awaiting_veg_preference') {
        // Determine veg/non-veg preference
        const isVeg = command.includes('veg') && !command.includes('non');
        const isNonVeg = command.includes('non') || command.includes('chicken') || command.includes('meat');
        
        if (!isVeg && !isNonVeg) {
          const msg = "I didn't catch that. Please say 'vegetarian' or 'non-vegetarian'.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        // Filter items by preference and sort by rating
        const filteredItems = conversationState.items
          .filter(item => {
            if (isVeg) return item.isVeg === true;
            if (isNonVeg) return item.isVeg === false;
            return true;
          })
          .sort((a, b) => {
            // Sort by rating (highest first), then by review count
            if (b.averageRating !== a.averageRating) {
              return (b.averageRating || 0) - (a.averageRating || 0);
            }
            return (b.reviewCount || 0) - (a.reviewCount || 0);
          });
        
        if (filteredItems.length === 0) {
          const msg = `Sorry, no ${isVeg ? 'vegetarian' : 'non-vegetarian'} ${conversationState.foodName || 'items'} found.`;
          setResponse(msg);
          speak(msg);
          saveConversationState(null);
          return;
        }
        
        // Get the best rated item
        const topItem = filteredItems[0];
        
        // If quantity was already specified in initial command, skip quantity question
        if (conversationState.requestedQuantity) {
          const quantity = conversationState.requestedQuantity;
          const ratingText = topItem.averageRating ? ` with ${topItem.averageRating} stars rating` : '';
          const msg = `Great choice! I've added ${quantity} ${topItem.name} from ${topItem.restaurantName}${ratingText} to your cart. Redirecting you now...`;
          setResponse(msg);
          speak(msg);
          
          setTimeout(() => {
            const cartItem = { ...topItem, quantity };
            localStorage.setItem('voice_cart_item', JSON.stringify(cartItem));
            window.location.href = `/restaurant/${topItem.restaurantId}`;
          }, 2000);
          
          saveConversationState(null);
        } else {
          // Ask for quantity
          const ratingText = topItem.averageRating ? ` with ${topItem.averageRating} stars rating` : '';
          const msg = `Great! The best rated ${isVeg ? 'vegetarian' : 'non-vegetarian'} ${conversationState.foodName || 'item'} is ${topItem.name} from ${topItem.restaurantName}${ratingText}. How many would you like to add to your cart?`;
          setResponse(msg);
          speak(msg);
          
          const newState = {
            step: 'awaiting_quantity',
            selectedItem: topItem,
            preference: isVeg ? 'veg' : 'non-veg'
          };
          saveConversationState(newState);
        }
        
      } else if (conversationState.step === 'awaiting_quantity') {
        // Extract quantity
        const quantity = extractQuantity(command);
        
        if (quantity === 0) {
          const msg = "I didn't catch the quantity. Please say a number like 'one', 'two', or '1', '2'.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        const item = conversationState.selectedItem;
        
        // Navigate to restaurant page with item in cart
        const msg = `Perfect! Adding ${quantity} ${item.name} to your cart. Redirecting you to ${item.restaurantName}...`;
        setResponse(msg);
        speak(msg);
        
        // Store cart item in localStorage and redirect
        setTimeout(() => {
          const cartItem = {
            ...item,
            quantity
          };
          localStorage.setItem('voice_cart_item', JSON.stringify(cartItem));
          window.location.href = `/restaurant/${item.restaurantId}`;
        }, 2000);
        
        saveConversationState(null);
      }
    } catch (error) {
      console.error('Error handling follow-up:', error);
      const msg = "Sorry, something went wrong. Please try again.";
      setResponse(msg);
      speak(msg);
      saveConversationState(null);
    } finally {
      setIsProcessing(false);
      setWakeWordDetected(false);
    }
  };

  const extractQuantity = (text) => {
    const numberWords = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };

    // Check for digit
    const digitMatch = text.match(/\b(\d+)\b/);
    if (digitMatch) return parseInt(digitMatch[1]);

    // Check for word
    for (const [word, num] of Object.entries(numberWords)) {
      if (text.includes(word)) return num;
    }

    return 0;
  };

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  return (
    <div className="fixed bottom-32 left-4 z-50">
      {/* Voice Button */}
      <button
        onClick={toggleListening}
        disabled={permissionDenied}
        className={`p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 relative ${
          wakeWordDetected
            ? 'bg-green-500 hover:bg-green-600 scale-110'
            : isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : permissionDenied
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary hover:bg-red-600'
        } text-white`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <Mic size={24} className="sm:w-7 sm:h-7" /> : <MicOff size={24} className="sm:w-7 sm:h-7" />}
        
        {/* Wake word detected indicator */}
        {wakeWordDetected && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></span>
        )}
      </button>

      {/* Voice Status Panel */}
      {(isListening || transcript || response) && (
        <div className="absolute bottom-20 left-0 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Volume2 size={20} className="text-primary" />
            <h3 className="font-bold text-gray-800 dark:text-white">Aman Assistant</h3>
            {isListening && (
              <span className="ml-auto text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Listening...
              </span>
            )}
          </div>

          {/* Wake Word Hint */}
          {isListening && !transcript && !wakeWordDetected && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
              💡 Say: <strong>"Hey Aman"</strong> to activate
            </div>
          )}
          
          {/* Wake Word Detected */}
          {wakeWordDetected && (
            <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-700 dark:text-green-300 animate-pulse">
              ✅ <strong>Wake word detected!</strong> Listening to your command...
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="mb-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">You said:</p>
              <p className="text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                {transcript}
              </p>
            </div>
          )}

          {/* Processing */}
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              Processing...
            </div>
          )}

          {/* Response */}
          {response && !isProcessing && (
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Waitnot:</p>
              <p className="text-sm text-primary font-medium bg-red-50 dark:bg-red-900/20 p-2 rounded">
                {response}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
