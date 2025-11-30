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
  const [isSpeaking, setIsSpeaking] = useState(false); // Track if assistant is speaking
  const recognitionRef = useRef(null);
  const conversationStateRef = useRef(loadConversationState()); // Initialize ref with saved state
  const isSpeakingRef = useRef(false); // Ref for isSpeaking to use in callbacks

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
        console.log('TTS started, stopping recognition');
        setIsSpeaking(true);
        isSpeakingRef.current = true;
        if (recognitionRef.current && isListening) {
          try {
            recognitionRef.current.stop();
          } catch (e) {
            console.log('Could not stop recognition:', e);
          }
        }
      };
      
      // Resume recognition after speaking with longer delay
      utterance.onend = () => {
        console.log('TTS ended, will restart recognition in 2 seconds');
        setTimeout(() => {
          setIsSpeaking(false);
          isSpeakingRef.current = false;
          if (isListening) {
            try {
              recognitionRef.current?.start();
              console.log('Recognition restarted after TTS');
            } catch (e) {
              console.log('Could not restart recognition:', e);
            }
          }
        }, 2000); // Increased delay to 2 seconds
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
        let totalConfidence = 0;
        let finalResultsCount = 0;
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0].transcript;
          const confidence = result[0].confidence;
          
          if (result.isFinal) {
            console.log(`Speech result: "${transcript}" (confidence: ${(confidence * 100).toFixed(1)}%)`);
            
            // Accept all results (no confidence filtering)
            finalTranscript += transcript;
            totalConfidence += confidence;
            finalResultsCount++;
          }
        }

        if (finalTranscript) {
          const avgConfidence = finalResultsCount > 0 ? totalConfidence / finalResultsCount : 0;
          console.log(`Final transcript: "${finalTranscript}" (avg confidence: ${(avgConfidence * 100).toFixed(1)}%)`);
          
          setTranscript(finalTranscript);
          
          // Don't process if assistant is currently speaking
          if (isSpeakingRef.current) {
            console.log('Ignoring transcript while assistant is speaking:', finalTranscript);
            return;
          }
          
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
      // Request microphone permission with noise reduction constraints
      try {
        // For Capacitor/APK, permissions are handled via AndroidManifest
        // For web, request permission with audio constraints
        if (!Capacitor.isNativePlatform() && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          // Request microphone with noise suppression and echo cancellation
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              echoCancellation: true,        // Cancel echo from speakers
              noiseSuppression: true,        // Reduce background noise
              autoGainControl: true,         // Automatic volume adjustment
              sampleRate: 48000,             // Higher quality audio
              channelCount: 1                // Mono audio (sufficient for voice)
            }
          });
          
          console.log('Microphone initialized with noise reduction');
          console.log('Audio settings:', stream.getAudioTracks()[0].getSettings());
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
      
      // Check for wake word first - if present, don't load old state
      const hasWakeWord = lowerCommand.includes('hey aman') || 
                         lowerCommand.includes('hey amaan');
      
      // Only reload conversation state if NO wake word detected
      let latestState = null;
      if (!hasWakeWord) {
        latestState = loadConversationState();
        if (latestState) {
          conversationStateRef.current = latestState;
          setConversationState(latestState);
        }
      }
      console.log('Processing command:', lowerCommand);
      console.log('Restaurant ID:', restaurantId);
      console.log('Conversation state:', latestState || conversationState);
      
      // If we're in a conversation state, handle follow-up
      if (latestState || conversationStateRef.current) {
        console.log('In conversation, handling follow-up');
        await handleFollowUp(lowerCommand);
        return;
      }
      
      // Check if user is requesting a specific food item on home page
      // But only if NOT in a conversation already
      const hasFoodRequest = lowerCommand.includes('get me') || 
                            lowerCommand.includes('order') || 
                            lowerCommand.includes('i want') ||
                            lowerCommand.includes('add');
      
      console.log('Has food request keywords:', hasFoodRequest);
      
      if (hasWakeWord) {
        console.log('Wake word detected - clearing any old conversation state');
        // Aggressively clear all state
        localStorage.removeItem('aman_conversation_state');
        conversationStateRef.current = null;
        setConversationState(null);
        
        if (hasFoodRequest) {
          console.log('Starting fresh food order conversation');
          // Small delay to ensure state is cleared
          await new Promise(resolve => setTimeout(resolve, 100));
          await handleSpecificFoodRequest(lowerCommand);
          return;
        }
      }
      
      if (!restaurantId && hasFoodRequest && !conversationStateRef.current) {
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
      
      // Find matching items (with null safety)
      const matchingItems = allItems.filter(item => {
        if (!item || !item.name) return false;
        const itemName = item.name.toLowerCase();
        return itemName.includes(matchedFood) || matchedFood.includes(itemName.split(' ')[0]);
      });
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
      // Use the ref which has the latest state
      const currentState = conversationStateRef.current;
      
      if (!currentState) {
        console.log('No conversation state found in handleFollowUp');
        return;
      }
      
      console.log('HandleFollowUp - Current step:', currentState.step);
      
      if (currentState.step === 'awaiting_veg_preference') {
        // Determine veg/non-veg preference
        // Look for the LAST occurrence to get user's actual answer (not the question echo)
        const words = command.split(/\s+/);
        const lastFewWords = words.slice(-5).join(' '); // Check last 5 words only
        
        console.log('Checking veg preference in last words:', lastFewWords);
        
        // Check for non-veg first (more specific)
        const isNonVeg = lastFewWords.includes('non-veg') || 
                        lastFewWords.includes('non veg') ||
                        lastFewWords.includes('nonveg') ||
                        lastFewWords.includes('chicken') || 
                        lastFewWords.includes('meat') ||
                        (lastFewWords.includes('not') && lastFewWords.includes('veg'));
        
        // Check for veg (but not if it's part of "non-veg")
        const isVeg = !isNonVeg && (
          lastFewWords.includes('vegetarian') || 
          lastFewWords.includes('veg')
        );
        
        console.log('Detected - isVeg:', isVeg, 'isNonVeg:', isNonVeg);
        
        if (!isVeg && !isNonVeg) {
          const msg = "I didn't catch that. Please say 'vegetarian' or 'non-vegetarian'.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        // Filter items by preference and sort by rating
        const filteredItems = currentState.items
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
          const msg = `Sorry, no ${isVeg ? 'vegetarian' : 'non-vegetarian'} ${currentState.foodName || 'items'} found.`;
          setResponse(msg);
          speak(msg);
          saveConversationState(null);
          return;
        }
        
        // Get the best rated item
        const topItem = filteredItems[0];
        
        // If quantity was already specified in initial command, skip quantity question
        if (currentState.requestedQuantity) {
          const quantity = currentState.requestedQuantity;
          const ratingText = topItem.averageRating ? ` with ${topItem.averageRating} stars rating` : '';
          
          // Auto-fill user details
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          const userName = savedUser.name || 'Customer';
          const userPhone = savedUser.phone || '9876543210';
          const userAddress = savedUser.address || '123 Main Street, Mumbai';
          
          const msg = `Great! I've selected ${quantity} ${topItem.name} from ${topItem.restaurantName}${ratingText}. Placing your order with Cash on Delivery. Please wait...`;
          setResponse(msg);
          speak(msg);
          
          // Place order directly
          setTimeout(() => {
            placeVoiceOrder({
              selectedItem: topItem,
              quantity: quantity,
              name: userName,
              phone: userPhone,
              address: userAddress
            }, 'cash').catch(error => {
              console.error('Error placing order:', error);
              const errorMsg = "Sorry, there was an error placing your order. Please try again.";
              setResponse(errorMsg);
              speak(errorMsg);
            });
          }, 2000);
        } else {
          // Ask for quantity
          const ratingText = topItem.averageRating ? ` with ${topItem.averageRating} stars rating` : '';
          const msg = `Great! The best rated ${isVeg ? 'vegetarian' : 'non-vegetarian'} ${currentState.foodName || 'item'} is ${topItem.name} from ${topItem.restaurantName}${ratingText}. How many would you like to order?`;
          setResponse(msg);
          speak(msg);
          
          const newState = {
            step: 'awaiting_quantity',
            selectedItem: topItem,
            preference: isVeg ? 'veg' : 'non-veg'
          };
          saveConversationState(newState);
        }
        
      } else if (currentState.step === 'awaiting_quantity') {
        // Extract quantity
        const quantity = extractQuantity(command);
        
        if (quantity === 0) {
          const msg = "I didn't catch the quantity. Please say a number like 'one', 'two', or '1', '2'.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        const item = currentState.selectedItem;
        
        // Auto-fill user details from localStorage or use defaults
        const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = savedUser.name || 'Customer';
        const userPhone = savedUser.phone || '9876543210';
        const userAddress = savedUser.address || '123 Main Street, Mumbai';
        
        const msg = `Perfect! ${quantity} ${item.name}. Placing your order with Cash on Delivery. Please wait...`;
        setResponse(msg);
        speak(msg);
        
        // Place order directly with auto-filled details
        setTimeout(() => {
          placeVoiceOrder({
            selectedItem: item,
            quantity: quantity,
            name: userName,
            phone: userPhone,
            address: userAddress
          }, 'cash').catch(error => {
            console.error('Error placing order:', error);
            const errorMsg = "Sorry, there was an error placing your order. Please try again.";
            setResponse(errorMsg);
            speak(errorMsg);
          });
        }, 2000);
        
      } else if (currentState.step === 'awaiting_address') {
        // Save address
        const address = command.trim();
        
        if (address.length < 10) {
          const msg = "Please provide a complete address with street, area, and city.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        const msg = "Got it! Now, please provide your phone number.";
        setResponse(msg);
        speak(msg);
        
        const newState = {
          ...currentState,
          step: 'awaiting_phone',
          address: address
        };
        saveConversationState(newState);
        
      } else if (currentState.step === 'awaiting_phone') {
        // Extract phone number
        const phoneMatch = command.match(/\d{10}/);
        
        if (!phoneMatch) {
          const msg = "I didn't catch a valid 10-digit phone number. Please say your phone number clearly.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        const phone = phoneMatch[0];
        const msg = "Great! And what's your name?";
        setResponse(msg);
        speak(msg);
        
        const newState = {
          ...currentState,
          step: 'awaiting_name',
          phone: phone
        };
        saveConversationState(newState);
        
      } else if (currentState.step === 'awaiting_name') {
        // Save name
        const name = command.trim();
        
        if (name.length < 2) {
          const msg = "Please tell me your name.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        const msg = "Perfect! Would you like to pay by Cash on Delivery or Online Payment?";
        setResponse(msg);
        speak(msg);
        
        const newState = {
          ...currentState,
          step: 'awaiting_payment',
          name: name
        };
        saveConversationState(newState);
        
      } else if (currentState.step === 'awaiting_payment') {
        // Determine payment method
        const isCOD = command.includes('cash') || command.includes('cod') || command.includes('delivery');
        const isOnline = command.includes('online') || command.includes('upi') || command.includes('card');
        
        if (!isCOD && !isOnline) {
          const msg = "Please say 'Cash on Delivery' or 'Online Payment'.";
          setResponse(msg);
          speak(msg);
          return;
        }
        
        const paymentMethod = isCOD ? 'cash' : 'upi';
        
        // Place the order
        await placeVoiceOrder(currentState, paymentMethod);
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

  const placeVoiceOrder = async (state, paymentMethod) => {
    try {
      if (!state || !state.selectedItem) {
        throw new Error('Invalid order state');
      }
      
      const { selectedItem, quantity, name, phone, address } = state;
      
      // Validate required fields
      if (!quantity || quantity <= 0) {
        throw new Error('Invalid quantity');
      }
      if (!name || !phone || !address) {
        throw new Error('Missing customer information');
      }
      
      const msg = `Placing your order for ${quantity} ${selectedItem.name}. Please wait...`;
      setResponse(msg);
      speak(msg);
      
      // Create order via API
      const orderData = {
        restaurantId: selectedItem.restaurantId,
        items: [{
          menuItemId: selectedItem._id,
          name: selectedItem.name,
          price: selectedItem.price,
          quantity: quantity
        }],
        totalAmount: selectedItem.price * quantity,
        orderType: 'delivery',
        customerName: name,
        customerPhone: phone,
        deliveryAddress: address,
        paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid',
        paymentMethod: paymentMethod
      };
      
      console.log('Placing order:', orderData);
      
      const { data } = await axios.post('/api/orders', orderData);
      
      const successMsg = `Order placed successfully! Your order ID is ${data._id}. Total amount: ₹${orderData.totalAmount}. ${paymentMethod === 'cash' ? 'Pay cash on delivery.' : 'Payment will be processed.'} Thank you!`;
      setResponse(successMsg);
      speak(successMsg);
      
      saveConversationState(null);
      
      // Redirect to order confirmation after 5 seconds
      setTimeout(() => {
        window.location.href = `/restaurant/${selectedItem.restaurantId}`;
      }, 5000);
      
    } catch (error) {
      console.error('Error placing order:', error);
      const errorMsg = "Sorry, there was an error placing your order. Please try again or order manually.";
      setResponse(errorMsg);
      speak(errorMsg);
      saveConversationState(null);
    }
  };

  // Don't render if not supported
  if (!isSupported) {
    return null;
  }

  // Manual reset function
  const resetConversation = () => {
    localStorage.removeItem('aman_conversation_state');
    conversationStateRef.current = null;
    setConversationState(null);
    setResponse('');
    setTranscript('');
    console.log('Conversation manually reset');
  };

  return (
    <div className="fixed bottom-32 left-4 z-50 flex flex-col gap-2">
      {/* Reset Button (only show if in conversation) */}
      {conversationState && (
        <button
          onClick={resetConversation}
          className="p-2 rounded-full bg-gray-600 hover:bg-gray-700 text-white shadow-lg text-xs"
          title="Reset conversation"
        >
          ↻
        </button>
      )}
      
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
