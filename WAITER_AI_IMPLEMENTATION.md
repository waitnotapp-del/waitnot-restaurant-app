# Waiter AI Voice Assistant Implementation

## Overview

This implementation provides a complete "waiter" AI voice assistant system for the Waitnot restaurant platform, following the specifications provided. The system waits for users to finish their requests and processes them intelligently using OpenRouter AI.

## System Architecture

### Backend Implementation

#### 1. Enhanced Voice Routes (`server/routes/voice.js`)

**Main Endpoint: `/api/voice/query`**
- Processes voice/text input from users
- Maintains session state for order collection
- Integrates with OpenRouter AI for intelligent responses
- Handles order flow from food selection to restaurant matching

**Restaurant Search: `/api/voice/restaurants/search`**
- Filters restaurants by food availability and dietary preferences
- Calculates distances using Haversine formula
- Ranks results by rating and feedback count
- Respects delivery radius constraints

**Session Management: `/api/voice/clear-session`**
- Clears conversation history and order sessions
- Supports both old and new session formats

#### 2. Enhanced AI Service (`server/services/aiService.js`)

**New Method: `generateResponseWithPrompt()`**
- Accepts custom system prompts for specialized AI behavior
- Optimized for waiter-specific conversations
- Includes fallback responses for offline scenarios

**Waiter-Specific Fallbacks**
- Handles common food requests without API calls
- Provides appropriate responses for dietary preferences
- Maintains conversation flow during API failures

### Frontend Implementation

#### 1. Voice Assistant Component (`client/src/components/VoiceAssistant.jsx`)

**Features:**
- Web Speech API integration for voice input/output
- Real-time conversation display
- Order progress tracking
- Restaurant candidate display
- Order intent visualization

**Voice Controls:**
- Start/Stop listening with visual feedback
- Text-to-speech for AI responses
- Manual text input as alternative
- Session reset functionality

#### 2. Test Page (`client/src/pages/VoiceTest.jsx`)

**Purpose:**
- Comprehensive testing interface
- Usage examples and instructions
- API endpoint documentation
- Real-time conversation testing

## Core Features

### 1. Order Collection Flow

The system follows the specified order collection sequence:

1. **Food Item Detection**
   - Extracts food names from natural language
   - Supports various food categories (pizza, burger, biryani, etc.)
   - Handles both direct mentions and contextual requests

2. **Dietary Preference Collection**
   - Asks for veg/non-veg preference when applicable
   - Remembers user choices throughout session
   - Allows modifications before final confirmation

3. **Quantity Collection**
   - Accepts numeric and word-based quantities
   - Validates reasonable quantity ranges
   - Supports quantity changes during conversation

4. **Location Handling**
   - Uses browser geolocation API
   - Falls back to default location if denied
   - Maintains location throughout session

### 2. Restaurant Matching & Ranking

**Filtering Logic:**
```javascript
// Filter restaurants by food availability
const hasFood = restaurant.menu.some(menuItem => {
  const nameMatch = menuItem.name.toLowerCase().includes(foodName.toLowerCase());
  const vegMatch = vegFlag !== null ? menuItem.isVeg === vegFlag : true;
  const available = menuItem.available !== false;
  return nameMatch && vegMatch && available;
});
```

**Distance Calculation:**
```javascript
// Haversine formula for accurate distance calculation
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}
```

**Ranking Algorithm:**
1. Filter by delivery radius
2. Sort by rating (descending)
3. Use feedback count as tiebreaker
4. Limit to top 3 results for voice presentation

### 3. Session Management

**Order Session Structure:**
```javascript
{
  status: 'collecting' | 'searching' | 'found' | 'placed' | 'cancelled',
  history: [{ role, content, timestamp }],
  food_name: string | null,
  veg_flag: boolean | null,
  quantity: number | null,
  user_location: { lat, lng } | null,
  created_at: timestamp
}
```

**Auto-Cleanup:**
- Sessions expire after 30 minutes of inactivity
- Automatic cleanup prevents memory leaks
- Graceful handling of expired sessions

### 4. Order Intent Generation

When all required information is collected, the system generates a structured order intent:

```json
{
  "type": "order_intent",
  "food_name": "Veg Burger",
  "veg_flag": true,
  "quantity": 1,
  "user_location": { "lat": 12.9716, "lng": 77.5946 },
  "candidates": [
    {
      "restaurant_id": "r123",
      "name": "BellaCafe",
      "distance_km": 2.1,
      "rating": 4.8
    }
  ],
  "selected_restaurant_id": "r123"
}
```

## API Endpoints

### POST /api/voice/query

**Request:**
```json
{
  "session_id": "session_123",
  "text": "I want a burger",
  "user_location": {
    "lat": 19.076,
    "lng": 72.8777
  }
}
```

**Response:**
```json
{
  "response": "Veg or non-veg?",
  "session_id": "session_123",
  "order_session": {
    "status": "collecting",
    "food_name": "burger",
    "veg_flag": null,
    "quantity": null,
    "user_location": { "lat": 19.076, "lng": 72.8777 }
  },
  "candidates": [],
  "order_intent": null,
  "timestamp": 1703123456789
}
```

### POST /api/voice/restaurants/search

**Request:**
```json
{
  "food_name": "burger",
  "veg_flag": true,
  "quantity": 2,
  "lat": 19.076,
  "lng": 72.8777
}
```

**Response:**
```json
{
  "restaurants": [
    {
      "restaurant_id": "r123",
      "name": "BellaCafe",
      "distance_km": 2.1,
      "rating": 4.8,
      "feedback_count": 150,
      "delivery_time": "30-40 min",
      "within_delivery_radius": true,
      "menu_items": [...]
    }
  ],
  "total_found": 1,
  "search_criteria": {...}
}
```

## Testing

### Backend Testing

Use the provided test script:
```bash
test-waiter-api.bat
```

This script tests:
1. Initial food request processing
2. Dietary preference handling
3. Quantity collection
4. Restaurant search functionality
5. Session management

### Frontend Testing

1. Navigate to `/voice-test` in the application
2. Test voice input using the microphone
3. Test text input as an alternative
4. Verify conversation flow and order tracking
5. Test session reset functionality

### Manual Test Cases

**Test Case 1: Complete Order Flow**
1. Say: "I want a burger"
2. Respond: "Veg"
3. Respond: "2"
4. Verify restaurant results and order intent

**Test Case 2: Direct Request**
1. Say: "Get me a veg pizza"
2. Respond: "1"
3. Verify immediate restaurant search

**Test Case 3: Error Handling**
1. Say: "I want something"
2. Verify clarification request
3. Test invalid responses

## Configuration

### Environment Variables

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=openai/gpt-oss-120b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

### Default Settings

- Session timeout: 30 minutes
- Default location: Mumbai (19.076, 72.8777)
- Default delivery radius: 10km
- Maximum restaurants shown: 3
- AI response timeout: 15 seconds

## Performance Optimizations

1. **Session Cleanup**: Automatic cleanup of expired sessions
2. **Response Caching**: Fallback responses for common scenarios
3. **Distance Calculation**: Efficient Haversine formula implementation
4. **Memory Management**: Limited conversation history storage
5. **Error Handling**: Graceful degradation with fallback responses

## Security Considerations

1. **API Key Protection**: Server-side OpenRouter API calls only
2. **Input Validation**: Sanitization of user inputs
3. **Rate Limiting**: Built-in rate limiting middleware
4. **Session Security**: Unique session IDs with expiration
5. **Location Privacy**: Optional location sharing

## Future Enhancements

1. **Multi-language Support**: Extend to support multiple languages
2. **Voice Biometrics**: User identification through voice
3. **Order History**: Integration with user order history
4. **Payment Integration**: Direct payment processing
5. **Restaurant Notifications**: Real-time order notifications
6. **Advanced NLP**: Better food item extraction and understanding

## Troubleshooting

### Common Issues

1. **Speech Recognition Not Working**
   - Ensure HTTPS connection
   - Check browser permissions
   - Verify microphone access

2. **AI Responses Failing**
   - Check OpenRouter API key
   - Verify network connectivity
   - Review API rate limits

3. **Location Not Available**
   - Enable browser location permissions
   - Check GPS/network location services
   - Fallback to manual location entry

4. **Restaurant Search Empty**
   - Verify restaurant data in database
   - Check food item matching logic
   - Review delivery radius settings

### Debug Mode

Enable debug logging by setting:
```javascript
console.log('🎤 Waiter AI Debug Mode Enabled');
```

This provides detailed logging of:
- Session state changes
- Restaurant filtering logic
- AI prompt construction
- Response processing

## Conclusion

This implementation provides a complete, production-ready voice assistant system that follows the specified requirements. The system is designed to be scalable, maintainable, and user-friendly, with comprehensive error handling and fallback mechanisms.

The modular architecture allows for easy extension and customization, while the comprehensive testing suite ensures reliability and performance.