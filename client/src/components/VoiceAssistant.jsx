import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export default function VoiceAssistant({ restaurantId, tableNumber, onOrderProcessed }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const recognitionRef = useRef(null);

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
          // Check for wake word
          if (finalTranscript.toLowerCase().includes('hey waitnot')) {
            // Provide immediate feedback
            speak('Yes, I am listening!');
            setResponse('🎤 Activated! Processing your command...');
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
      const { data } = await axios.post('/api/voice/process', {
        command,
        restaurantId,
        tableNumber
      });

      setResponse(data.reply);
      speak(data.reply);

      // Handle different actions
      if (data.action === 'order' && data.items.length > 0) {
        onOrderProcessed?.(data);
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      const errorMsg = "Sorry, I couldn't process that. Please try again.";
      setResponse(errorMsg);
      speak(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  const speak = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
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
        className={`p-3 sm:p-4 rounded-full shadow-lg transition-all duration-300 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : permissionDenied
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary hover:bg-red-600'
        } text-white`}
        aria-label={isListening ? 'Stop listening' : 'Start listening'}
      >
        {isListening ? <Mic size={24} className="sm:w-7 sm:h-7" /> : <MicOff size={24} className="sm:w-7 sm:h-7" />}
      </button>

      {/* Voice Status Panel */}
      {(isListening || transcript || response) && (
        <div className="absolute bottom-20 left-0 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-3 sm:p-4 border border-gray-200 dark:border-gray-700">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
            <Volume2 size={20} className="text-primary" />
            <h3 className="font-bold text-gray-800 dark:text-white">Voice Assistant</h3>
            {isListening && (
              <span className="ml-auto text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Listening...
              </span>
            )}
          </div>

          {/* Wake Word Hint */}
          {isListening && !transcript && (
            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-700 dark:text-blue-300">
              💡 Say: <strong>"Hey Waitnot"</strong> to activate
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
