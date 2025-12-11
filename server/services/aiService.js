import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY;
    this.model = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b:free';
    this.baseURL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ OpenRouter API key not found. AI features will use fallback responses.');
    }
  }

  async generateResponse(userMessage, context = {}) {
    if (!this.apiKey) {
      return this.getFallbackResponse(userMessage, context);
    }

    try {
      const systemPrompt = this.buildSystemPrompt(context);
      
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userMessage
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://waitnot-app.com',
            'X-Title': 'WaitNot Food Delivery Assistant'
          },
          timeout: 10000 // 10 second timeout
        }
      );

      const aiResponse = response.data.choices[0]?.message?.content;
      
      if (!aiResponse) {
        console.warn('Empty response from OpenRouter API');
        return this.getFallbackResponse(userMessage, context);
      }

      console.log('✅ OpenRouter AI Response generated successfully');
      return aiResponse.trim();

    } catch (error) {
      console.error('❌ OpenRouter API Error:', error.response?.data || error.message);
      
      // Return fallback response on error
      return this.getFallbackResponse(userMessage, context);
    }
  }

  buildSystemPrompt(context) {
    const { restaurants = [], userLocation, conversationHistory = [] } = context;
    
    let systemPrompt = `You are WaitNot AI Assistant, a helpful food delivery assistant. You help users find restaurants, browse menus, and place orders.

PERSONALITY:
- Friendly, enthusiastic, and helpful
- Use food emojis appropriately (🍕🍔🍜🥗🍰)
- Keep responses concise but informative
- Always try to be solution-oriented

CAPABILITIES:
- Help users find restaurants and food items
- Provide restaurant information (ratings, delivery time, menu items)
- Assist with food ordering process
- Answer questions about cuisine types and dietary preferences
- Suggest alternatives when requested items aren't available

RESPONSE GUIDELINES:
- Keep responses under 200 words
- Use bullet points for lists
- Include relevant emojis
- Always end with a helpful question or suggestion
- If you don't know something, suggest browsing restaurants or contacting support

CURRENT CONTEXT:`;

    if (restaurants.length > 0) {
      systemPrompt += `\n\nAVAILABLE RESTAURANTS (${restaurants.length} total):`;
      restaurants.slice(0, 5).forEach((restaurant, index) => {
        systemPrompt += `\n${index + 1}. ${restaurant.name} - ${restaurant.cuisine?.join(', ')} - ⭐${restaurant.rating}/5 - 🕐${restaurant.deliveryTime}`;
        if (restaurant.menu && restaurant.menu.length > 0) {
          const popularItems = restaurant.menu.slice(0, 3).map(item => `${item.name} (₹${item.price})`).join(', ');
          systemPrompt += `\n   Popular items: ${popularItems}`;
        }
      });
    }

    if (userLocation) {
      systemPrompt += `\n\nUSER LOCATION: Available (can suggest nearby restaurants)`;
    }

    if (conversationHistory.length > 0) {
      systemPrompt += `\n\nRECENT CONVERSATION:`;
      conversationHistory.slice(-3).forEach(msg => {
        systemPrompt += `\n${msg.role}: ${msg.content}`;
      });
    }

    systemPrompt += `\n\nIMPORTANT: Always be helpful and try to guide users toward making a food order or finding what they're looking for.`;

    return systemPrompt;
  }

  getFallbackResponse(userMessage, context) {
    const lowerMessage = userMessage.toLowerCase();
    const { restaurants = [] } = context;

    // Handle food requests
    if (lowerMessage.includes('pizza')) {
      const pizzaRestaurants = restaurants.filter(r => 
        r.cuisine?.some(c => c.toLowerCase().includes('pizza')) ||
        r.menu?.some(item => item.name.toLowerCase().includes('pizza'))
      );
      
      if (pizzaRestaurants.length > 0) {
        return `🍕 Found ${pizzaRestaurants.length} restaurant${pizzaRestaurants.length > 1 ? 's' : ''} with pizza! ${pizzaRestaurants[0].name} is highly rated at ⭐${pizzaRestaurants[0].rating}/5. Would you like to see their menu or place an order?`;
      }
    }

    if (lowerMessage.includes('burger')) {
      const burgerRestaurants = restaurants.filter(r => 
        r.cuisine?.some(c => c.toLowerCase().includes('burger')) ||
        r.menu?.some(item => item.name.toLowerCase().includes('burger'))
      );
      
      if (burgerRestaurants.length > 0) {
        return `🍔 Great choice! ${burgerRestaurants[0].name} serves amazing burgers with ⭐${burgerRestaurants[0].rating}/5 rating. Ready to order?`;
      }
    }

    if (lowerMessage.includes('biryani')) {
      const biryaniRestaurants = restaurants.filter(r => 
        r.cuisine?.some(c => c.toLowerCase().includes('indian')) ||
        r.menu?.some(item => item.name.toLowerCase().includes('biryani'))
      );
      
      if (biryaniRestaurants.length > 0) {
        return `🍛 Delicious biryani available at ${biryaniRestaurants[0].name}! They're rated ⭐${biryaniRestaurants[0].rating}/5. Shall I show you their biryani options?`;
      }
    }

    // Handle greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return `👋 Hello! I'm your WaitNot AI Assistant. I can help you find delicious food from ${restaurants.length} restaurants. What are you craving today? 🍕🍔🍜`;
    }

    // Handle help requests
    if (lowerMessage.includes('help')) {
      return `🤖 I'm here to help! I can:\n\n• Find restaurants by food type\n• Show menus and prices\n• Help you place orders\n• Suggest popular dishes\n\nWhat would you like to eat today?`;
    }

    // Default response
    return `🍽️ I'd love to help you find something delicious! We have ${restaurants.length} restaurants available. Try asking for specific foods like "pizza", "burger", or "biryani", or just tell me what you're in the mood for! 😊`;
  }

  async generateFoodRecommendations(preferences = {}) {
    const { cuisine, dietary, budget, mood } = preferences;
    
    const prompt = `Suggest 3 food items based on these preferences:
- Cuisine: ${cuisine || 'any'}
- Dietary: ${dietary || 'any'}  
- Budget: ${budget || 'moderate'}
- Mood: ${mood || 'hungry'}

Provide brief, appetizing descriptions for each suggestion.`;

    return await this.generateResponse(prompt, {});
  }
}

export default new AIService();