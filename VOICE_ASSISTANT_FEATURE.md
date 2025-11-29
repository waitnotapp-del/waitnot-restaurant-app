# 🎤 Voice Assistant Feature - "Hey Aman"

## Overview
Voice-activated AI assistant for hands-free ordering in restaurants using the wake word **"Hey Aman"**.

## Features

### 🔊 Wake-Word Activation
- **Wake Phrase**: "Hey Aman"
- Activates voice recognition and processes commands
- Works in real-time with continuous listening

### 🧠 AI Capabilities

#### 1. **Voice Ordering**
```
User: "Hey Aman, get me two masala dosas and one lime juice."
AI: "Sure! I've added two masala dosas and one lime juice to your order."
```

#### 2. **Bill Inquiry**
```
User: "Hey Aman, what is my bill?"
AI: "Let me fetch your bill amount."
```

#### 3. **Order Repeat**
```
User: "Hey Waitnot, repeat my order."
AI: "Here's your current order."
```

#### 4. **Item Cancellation**
```
User: "Hey Waitnot, cancel the biryani."
AI: "Which item would you like to cancel?"
```

#### 5. **Recommendations**
```
User: "Hey Waitnot, what do you recommend?"
AI: "Let me show you our popular items."
```

## Technical Implementation

### Frontend (VoiceAssistant.jsx)
- **Speech Recognition**: Uses Web Speech API (webkitSpeechRecognition)
- **Speech Synthesis**: Text-to-speech for AI responses
- **Real-time Transcription**: Shows what user is saying
- **Visual Feedback**: Animated microphone button and status panel

### Backend (voice.js API)
- **Intelligent Matching**: 
  - Exact name matching
  - Fuzzy matching using Levenshtein distance
  - Partial word matching
  - Confidence scoring (>50% threshold)

- **Quantity Extraction**:
  - Recognizes digits: "2", "5", "10"
  - Recognizes words: "one", "two", "three", etc.
  - Handles "a" and "an" as quantity 1

- **JSON Response Format**:
```json
{
  "action": "order",
  "items": [
    {
      "name": "masala dosa",
      "quantity": 2,
      "price": 80,
      "confidence": 0.95
    }
  ],
  "table": "5",
  "reply": "Sure! I've added two masala dosas to your order."
}
```

## Supported Actions

| Action | Trigger Words | Response |
|--------|--------------|----------|
| **order** | add, get, want, order | Adds items to cart |
| **bill** | bill, check, total | Shows bill amount |
| **repeat** | repeat, show order | Displays current order |
| **cancel** | cancel, remove | Removes items |
| **recommendation** | recommend, suggest, popular | Shows popular items |

## How It Works

### 1. User Activates
- Clicks microphone button
- Says "Hey Waitnot" followed by command

### 2. Processing
- Speech is converted to text
- Wake word is detected
- Command is sent to backend API

### 3. AI Analysis
- Extracts action type
- Matches menu items using fuzzy logic
- Extracts quantities
- Generates natural language response

### 4. Response
- AI speaks response using text-to-speech
- Items are automatically added to cart
- Visual confirmation shown

## Browser & Mobile Compatibility

### Desktop Browsers
- ✅ Chrome/Edge (webkitSpeechRecognition)
- ✅ Safari (SpeechRecognition)
- ❌ Firefox (limited support)

### Mobile Devices
- ✅ **Android Chrome** - Full support
- ✅ **Android Edge** - Full support
- ✅ **iOS Safari** - Full support (iOS 14.5+)
- ✅ **iOS Chrome** - Full support (uses Safari engine)
- ⚠️ **Requires HTTPS** - Voice recognition only works on secure connections

### Mobile-Specific Features
- ✅ Microphone permission handling
- ✅ Responsive UI (adapts to screen size)
- ✅ Touch-optimized button size
- ✅ Works with phone's built-in speech recognition
- ✅ Automatic permission request
- ✅ Clear error messages for denied permissions

## Usage Location
- **QR Order Page**: Available when customers scan table QR code
- **Positioned**: Bottom-left corner (above bottom nav)
- **Always Available**: Continuous listening mode

## Example Conversations

### Ordering Multiple Items
```
👤 "Hey Aman, get me one veg biryani and two lime juices."
🤖 "Great! I've added 1 veg biryani, 2 lime juices to your order."
```

### Checking Bill
```
👤 "Hey Waitnot, what's my bill?"
🤖 "Let me fetch your bill amount."
```

### Getting Recommendations
```
👤 "Hey Waitnot, what's popular here?"
🤖 "Let me show you our popular items."
```

## Security & Privacy
- Voice data is processed in real-time
- No audio recordings are stored
- Only text transcripts are sent to server
- Works offline for speech recognition (browser-based)

## Future Enhancements
- [ ] Multi-language support (Hindi, Tamil, etc.)
- [ ] Voice-based payment confirmation
- [ ] Dietary preference filtering
- [ ] Allergy warnings
- [ ] Custom wake word configuration
- [ ] Voice-based table service requests

## Testing

### Desktop Testing
1. Open QR Order page
2. Click microphone button
3. Say "Hey Waitnot, get me one coffee"
4. Verify item is added to cart
5. Check AI response is spoken aloud

### Mobile Testing (Android/iOS)
1. **Install APK** or open web app via HTTPS
2. Scan QR code to open order page
3. **Allow microphone permission** when prompted
4. Tap microphone button (bottom-left)
5. Say "Hey Waitnot, get me one biryani"
6. Verify:
   - Transcript appears in panel
   - AI processes command
   - Item added to cart
   - Voice response plays

### Troubleshooting Mobile Issues
- **No microphone button**: Browser doesn't support speech recognition
- **Permission denied**: Go to browser settings → Site permissions → Enable microphone
- **Not working on HTTP**: Must use HTTPS (production deployment)
- **Voice not recognized**: Speak clearly, check microphone is not muted

## APK (Android App) Support

### ✅ Fully Supported in APK
The voice assistant works natively in the Android APK through:
- **WebView Speech Recognition** - Uses Android's built-in speech recognition
- **Native Permissions** - Microphone access via AndroidManifest.xml
- **No Additional Plugins** - Works out of the box with Capacitor

### APK Configuration
**File**: `client/android/app/src/main/AndroidManifest.xml`

Added permissions:
```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
<uses-feature android:name="android.hardware.microphone" android:required="false" />
```

### How It Works in APK
1. **First Launch**: Android asks for microphone permission
2. **User Grants**: Permission saved for future use
3. **Voice Recognition**: Uses Android's native speech-to-text
4. **Text-to-Speech**: Uses Android's native TTS engine
5. **Seamless Experience**: Works exactly like native Android apps

### APK Testing Steps
1. Build APK with voice feature: `build-production-apk.bat`
2. Install APK on Android device
3. Open app and scan QR code
4. Tap microphone button (bottom-left)
5. **Grant microphone permission** when prompted
6. Say "Hey Waitnot, get me one coffee"
7. Verify order is added

### Troubleshooting APK Issues
- **Permission not requested**: Check AndroidManifest.xml has RECORD_AUDIO permission
- **Voice not working**: Go to Settings → Apps → Waitnot → Permissions → Enable Microphone
- **No speech recognition**: Ensure device has Google app installed (provides speech services)
- **TTS not working**: Check device has text-to-speech engine enabled in settings

### Advantages in APK vs Web
- ✅ Better performance (native speech recognition)
- ✅ Works offline (after initial setup)
- ✅ More accurate recognition
- ✅ Faster response time
- ✅ Better battery optimization
- ✅ No HTTPS requirement

## Files Modified/Created
- ✅ `client/src/components/VoiceAssistant.jsx` - Frontend component
- ✅ `server/routes/voice.js` - Backend API
- ✅ `server/server.js` - Added voice route
- ✅ `client/src/pages/QROrder.jsx` - Integrated voice assistant
- ✅ `client/android/app/src/main/AndroidManifest.xml` - Added microphone permissions

---

**Status**: ✅ Implemented and Ready to Use
**Wake Word**: "Hey Aman"
**Location**: QR Order Page (Bottom-left corner)
**APK Support**: ✅ Fully Working with Native Android Speech Recognition
