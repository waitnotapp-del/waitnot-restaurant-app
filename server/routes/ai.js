import express from 'express';
import aiService from '../services/aiService.js';
import { restaurantDB } from '../db.js';

const router = express.Router();

// Store conversation history (in production, use Redis or database)
const conversationHistory = new Map();

// Enhanced AI chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous', sessionId, includeRestaurants = true } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    console.log(`🤖 AI Chat Request - User: ${userId}, Session: ${sessionId}, Message: "${message}"`);

    // Get conversation history
    const historyKey = `${userId}_${sessionId || 'default'}`;
    let history = conversationHistory.get(historyKey) || [];

    // Build context
    const context = {
      conversationHistory: history,
      userLocation: null // Can be enhanced to get user location
    };

    // Include restaurants if requested
    if (includeRestaurants) {
      try {
        const restaurants = await restaurantDB.findAll();
        context.restaurants = restaurants || [];
        console.log(`📊 Loaded ${context.restaurants.length} restaurants for AI context`);
      } catch (error) {
        console.warn('⚠️ Could not load restaurants for AI context:', error.message);
        context.restaurants = [];
      }
    }

    // Generate AI response
    const aiResponse = await aiService.generateResponse(message, context);

    // Update conversation history
    history.push(
      { role: 'user', content: message, timestamp: Date.now() },
      { role: 'assistant', content: aiResponse, timestamp: Date.now() }
    );

    // Keep only last 10 messages to prevent memory issues
    if (history.length > 10) {
      history = history.slice(-10);
    }
    
    conversationHistory.set(historyKey, history);

    // Auto-cleanup old conversations (older than 1 hour)
    setTimeout(() => {
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      for (const [key, msgs] of conversationHistory.entries()) {
        const lastMessage = msgs[msgs.length - 1];
        if (lastMessage && lastMessage.timestamp < oneHourAgo) {
          conversationHistory.delete(key);
        }
      }
    }, 1000);

    res.json({
      response: aiResponse,
      sessionId: sessionId || 'default',
      timestamp: Date.now(),
      model: aiService.model,
      restaurantCount: context.restaurants?.length || 0
    });

  } catch (error) {
    console.error('❌ AI Chat Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      fallback: "I'm having trouble right now, but I'm here to help! What would you like to eat? 🍽️"
    });
  }
});

// Get food recommendations
router.post('/recommendations', async (req, res) => {
  try {
    const { cuisine, dietary, budget, mood } = req.body;
    
    const recommendations = await aiService.generateFoodRecommendations({
      cuisine,
      dietary,
      budget,
      mood
    });

    res.json({
      recommendations,
      preferences: { cuisine, dietary, budget, mood },
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('❌ AI Recommendations Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate recommendations',
      fallback: "Try our popular items: Pizza, Burger, or Biryani! 🍕🍔🍛"
    });
  }
});

// Clear conversation history
router.post('/clear-session', (req, res) => {
  try {
    const { userId = 'anonymous', sessionId } = req.body;
    const historyKey = `${userId}_${sessionId || 'default'}`;
    
    conversationHistory.delete(historyKey);
    
    res.json({ 
      success: true, 
      message: 'Conversation history cleared' 
    });
  } catch (error) {
    console.error('❌ Clear Session Error:', error);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

// Health check for AI service
router.get('/health', async (req, res) => {
  try {
    const testResponse = await aiService.generateResponse('Hello', {});
    
    res.json({
      status: 'healthy',
      model: aiService.model,
      apiKeyConfigured: !!aiService.apiKey,
      testResponse: testResponse.substring(0, 50) + '...',
      timestamp: Date.now()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: Date.now()
    });
  }
});

export default router;