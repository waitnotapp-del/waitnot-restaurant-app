import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX, RotateCcw, Send } from 'lucide-react';
import axios from 'axios';

const VoiceAssistant = () => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [orderSession, setOrderSession] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [orderIntent, setOrderIntent] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const recognitionRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    // Initialize session ID
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setTranscript(transcript);
        handleVoiceInput(transcript);
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis;
    }

    // Get user location
    getCurrentLocation();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Location access denied:', error);
          // Use default location (Mumbai)
          setUserLocation({
            lat: 19.076,
            lng: 72.8777
          });
        }
      );
    }
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setError('');
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleVoiceInput = async (text) => {
    if (!text.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Add user message to conversation
      const userMessage = { role: 'user', content: text, timestamp: Date.now() };
      setConversation(prev => [...prev, userMessage]);

      // Send to waiter AI
      const response = await axios.post('/api/voice/query', {
        session_id: sessionId,
        text: text,
        user_location: userLocation
      });

      const { response: aiResponse, order_session, candidates: newCandidates, order_intent } = response.data;

      // Add AI response to conversation
      const aiMessage = { role: 'assistant', content: aiResponse, timestamp: Date.now() };
      setConversation(prev => [...prev, aiMessage]);

      setResponse(aiResponse);
      setOrderSession(order_session);
      setCandidates(newCandidates || []);
      setOrderIntent(order_intent);

      // Speak the response
      speakText(aiResponse);

    } catch (error) {
      console.error('Voice query error:', error);
      const errorMessage = error.response?.data?.fallback || 
                          "I'm having trouble right now. Could you please repeat your order?";
      setError(errorMessage);
      speakText(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextInput = (text) => {
    setTranscript(text);
    handleVoiceInput(text);
  };

  const speakText = (text) => {
    if (synthRef.current && text) {
      // Cancel any ongoing speech
      synthRef.current.cancel();
      
      // Clean text for speech (remove markdown, emojis, etc.)
      const cleanText = text
        .replace(/[⭐🍽️📍🕐]/g, '')
        .replace(/```json[\s\S]*?```/g, '')
        .replace(/\*\*/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;

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

  const clearSession = async () => {
    try {
      await axios.post('/api/voice/clear-session', {
        session_id: sessionId
      });
      
      // Reset state
      setConversation([]);
      setResponse('');
      setOrderSession(null);
      setCandidates([]);
      setOrderIntent(null);
      setTranscript('');
      setError('');
      
      // Generate new session ID
      setSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      
      speakText("Let's start fresh! What would you like to eat today?");
    } catch (error) {
      console.error('Clear session error:', error);
    }
  };

  const handleOrderConfirmation = () => {
    if (orderIntent) {
      // Here you would typically redirect to checkout or process the order
      console.log('Order Intent:', orderIntent);
      alert(`Order confirmed! ${orderIntent.quantity} ${orderIntent.food_name} from ${orderIntent.candidates?.[0]?.name}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          🎤 Voice Assistant
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Say "I want a burger" or click the mic to start ordering
        </p>
      </div>

      {/* Voice Controls */}
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={isListening ? stopListening : startListening}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
            isListening
              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          <span>{isListening ? 'Stop Listening' : 'Start Listening'}</span>
        </button>

        <button
          onClick={isSpeaking ? stopSpeaking : () => speakText(response)}
          disabled={!response || isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium transition-all ${
            isSpeaking
              ? 'bg-orange-500 hover:bg-orange-600 text-white'
              : 'bg-green-500 hover:bg-green-600 text-white'
          } ${!response || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
          <span>{isSpeaking ? 'Stop Speaking' : 'Repeat Response'}</span>
        </button>

        <button
          onClick={clearSession}
          disabled={isLoading}
          className={`flex items-center space-x-2 px-6 py-3 rounded-full font-medium bg-gray-500 hover:bg-gray-600 text-white transition-all ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <RotateCcw size={20} />
          <span>Start Over</span>
        </button>
      </div>

      {/* Text Input Alternative */}
      <div className="mb-6">
        <div className="flex space-x-2">
          <input
            type="text"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleTextInput(transcript)}
            placeholder="Or type your message here..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            disabled={isLoading}
          />
          <button
            onClick={() => handleTextInput(transcript)}
            disabled={!transcript.trim() || isLoading}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Processing...</p>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-300 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Order Session Status */}
      {orderSession && (
        <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Order Progress</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Food:</span>
              <p className="font-medium">{orderSession.food_name || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Type:</span>
              <p className="font-medium">
                {orderSession.veg_flag !== null 
                  ? (orderSession.veg_flag ? 'Vegetarian' : 'Non-vegetarian')
                  : 'Not specified'
                }
              </p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Quantity:</span>
              <p className="font-medium">{orderSession.quantity || 'Not specified'}</p>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Status:</span>
              <p className="font-medium capitalize">{orderSession.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Candidates */}
      {candidates.length > 0 && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">Available Restaurants</h3>
          <div className="space-y-3">
            {candidates.map((restaurant, index) => (
              <div key={restaurant.restaurant_id} className="bg-white dark:bg-gray-800 rounded-lg p-3 border">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-gray-800 dark:text-white">
                      {index + 1}. {restaurant.name}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      ⭐ {restaurant.rating}/5 • 📍 {restaurant.distance_km}km • 🕐 {restaurant.delivery_time}
                    </p>
                    {restaurant.menu_items && restaurant.menu_items.length > 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {restaurant.menu_items.slice(0, 2).map(item => item.name).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Intent */}
      {orderIntent && (
        <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3">Ready to Order!</h3>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3">
            <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(orderIntent, null, 2)}
            </pre>
          </div>
          <button
            onClick={handleOrderConfirmation}
            className="mt-3 px-6 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium"
          >
            Confirm Order
          </button>
        </div>
      )}

      {/* Conversation History */}
      {conversation.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Conversation</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {conversation.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-white border'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceAssistant;