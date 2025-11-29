import express from 'express';
import * as db from '../db.js';

const router = express.Router();

// Feature flag for AI processing
const USE_AI_PROCESSING = process.env.USE_AI_PROCESSING === 'true';

// Try to import Hugging Face service (optional)
let processVoiceWithAI = null;
let validateAndRepairOrder = null;
let huggingfaceLoaded = false;
let huggingfaceError = null;

// Load Hugging Face service asynchronously - completely optional
const loadHuggingFace = async () => {
  try {
    const hfModule = await import('../services/huggingface.js');
    processVoiceWithAI = hfModule.processVoiceWithAI;
    validateAndRepairOrder = hfModule.validateAndRepairOrder;
    huggingfaceLoaded = true;
    console.log('✅ Hugging Face AI service loaded successfully');
  } catch (error) {
    huggingfaceError = error.message;
    console.log('⚠️ Hugging Face AI service not available:', error.message);
    console.log('   Voice assistant will use fallback keyword matching');
  }
};

// Start loading (don't await - let it load in background)
setTimeout(() => {
  loadHuggingFace().catch(err => {
    console.error('Failed to load Hugging Face (using fallback):', err.message);
  });
}, 100);

// Helper function to extract quantity from text
function extractQuantity(text) {
  const numberWords = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
    'a': 1, 'an': 1
  };

  // Check for digit
  const digitMatch = text.match(/\b(\d+)\b/);
  if (digitMatch) return parseInt(digitMatch[1]);

  // Check for word
  for (const [word, num] of Object.entries(numberWords)) {
    if (text.toLowerCase().includes(word)) return num;
  }

  return 1; // Default quantity
}

// Helper function to calculate Levenshtein distance
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Helper function to match menu items
function matchMenuItem(spokenText, menuItems) {
  const matches = [];
  const lowerSpoken = spokenText.toLowerCase();
  
  menuItems.forEach(item => {
    const itemName = item.name.toLowerCase();
    let confidence = 0;
    
    // Exact match
    if (lowerSpoken.includes(itemName)) {
      confidence = 1.0;
    }
    // Fuzzy match using Levenshtein distance
    else {
      const distance = levenshteinDistance(itemName, lowerSpoken);
      const maxLength = Math.max(itemName.length, lowerSpoken.length);
      confidence = 1 - (distance / maxLength);
    }
    
    // Check for partial word matches
    const itemWords = itemName.split(' ');
    const spokenWords = lowerSpoken.split(' ');
    const wordMatches = itemWords.filter(word => 
      spokenWords.some(spoken => spoken.includes(word) || word.includes(spoken))
    );
    
    if (wordMatches.length > 0) {
      confidence = Math.max(confidence, wordMatches.length / itemWords.length);
    }
    
    if (confidence > 0.5) {
      matches.push({ item, confidence });
    }
  });
  
  // Sort by confidence
  matches.sort((a, b) => b.confidence - a.confidence);
  return matches;
}

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    aiBackend: 'huggingface',
    huggingfaceLoaded,
    huggingfaceError,
    timestamp: new Date().toISOString()
  });
});

// Process voice command
router.post('/process', async (req, res) => {
  try {
    const { command, restaurantId, tableNumber } = req.body;
    
    console.log('Voice command received:', { command, restaurantId, tableNumber });
    console.log('Hugging Face status:', { loaded: huggingfaceLoaded, error: huggingfaceError });
    
    if (!command) {
      return res.status(400).json({ 
        action: 'error',
        items: [],
        table: '',
        reply: 'Command is required',
        error: 'Command is required' 
      });
    }

    const lowerCommand = command.toLowerCase();
    
    // Remove wake words (support variations)
    const cleanCommand = lowerCommand
      .replace(/hey aman,?/gi, '')
      .replace(/hey amaan,?/gi, '')
      .replace(/hey aaman,?/gi, '')
      .trim();
    
    console.log('Clean command:', cleanCommand);

    // Get restaurant menu for context
    let restaurant = null;
    let menuItems = [];
    
    if (restaurantId) {
      restaurant = await db.getRestaurantById(restaurantId);
      if (restaurant && restaurant.menu) {
        menuItems = restaurant.menu;
      }
    }

    // Try AI processing first if enabled and available
    if (USE_AI_PROCESSING && process.env.HUGGINGFACE_API_KEY && huggingfaceLoaded && processVoiceWithAI && validateAndRepairOrder) {
      try {
        console.log('Using Hugging Face AI processing...');
        const aiResult = await processVoiceWithAI(cleanCommand, menuItems);
        const validatedResult = validateAndRepairOrder(aiResult, menuItems);
        
        console.log('AI Result:', validatedResult);
        
        return res.json({
          action: validatedResult.action,
          items: validatedResult.items,
          table: tableNumber || validatedResult.table || '',
          reply: validatedResult.reply,
          source: 'huggingface-ai'
        });
      } catch (aiError) {
        console.error('Hugging Face AI processing failed, falling back to keyword matching:', aiError.message);
        // Continue to fallback logic below
      }
    } else if (USE_AI_PROCESSING && !huggingfaceLoaded) {
      console.log('Hugging Face still loading, using fallback...');
    }
    
    // Determine action
    let action = 'order';
    let reply = '';
    let items = [];
    
    // Check for bill request
    if (cleanCommand.includes('bill') || cleanCommand.includes('check') || cleanCommand.includes('total')) {
      action = 'bill';
      reply = "Let me fetch your bill amount.";
      return res.json({ action, items, table: tableNumber, reply });
    }
    
    // Check for repeat order
    if (cleanCommand.includes('repeat') || cleanCommand.includes('show order')) {
      action = 'repeat';
      reply = "Here's your current order.";
      return res.json({ action, items, table: tableNumber, reply });
    }
    
    // Check for cancel
    if (cleanCommand.includes('cancel') || cleanCommand.includes('remove')) {
      action = 'cancel';
      reply = "Which item would you like to cancel?";
      return res.json({ action, items, table: tableNumber, reply });
    }
    
    // Check for recommendation
    if (cleanCommand.includes('recommend') || cleanCommand.includes('suggest') || cleanCommand.includes('popular')) {
      action = 'recommendation';
      reply = "Let me show you our popular items.";
      return res.json({ action, items, table: tableNumber, reply });
    }
    
    // Process order - get restaurant menu
    if (restaurantId) {
      const restaurant = await db.getRestaurantById(restaurantId);
      console.log('Restaurant found:', restaurant ? restaurant.name : 'Not found');
      
      if (restaurant && restaurant.menu) {
        console.log('Menu items count:', restaurant.menu.length);
        const matches = matchMenuItem(cleanCommand, restaurant.menu);
        console.log('Matches found:', matches.length, matches.map(m => ({ name: m.item.name, confidence: m.confidence })));
        
        if (matches.length > 0) {
          // Extract quantities for each matched item
          const quantity = extractQuantity(cleanCommand);
          console.log('Extracted quantity:', quantity);
          
          // Take only the best match
          const bestMatch = matches[0];
          items.push({
            name: bestMatch.item.name,
            quantity: quantity,
            price: bestMatch.item.price,
            _id: bestMatch.item._id,
            confidence: bestMatch.confidence
          });
          
          // Generate reply
          reply = `Sure! I've added ${quantity} ${bestMatch.item.name}${quantity > 1 ? 's' : ''} to your order.`;
        } else {
          reply = "Sorry, I couldn't find that item on the menu. Could you please repeat?";
        }
      } else {
        reply = "Sorry, I couldn't load the menu. Please try again.";
      }
    } else {
      reply = "Please scan the QR code at your table first to start ordering.";
    }
    
    return res.json({
      action,
      items,
      table: tableNumber || '',
      reply,
      source: 'fallback'
    });
    
  } catch (error) {
    console.error('Voice processing error:', error);
    console.error('Error stack:', error.stack);
    
    // Always return 200 with error action to avoid breaking the client
    return res.json({ 
      action: 'error',
      items: [],
      table: '',
      reply: "Sorry, I encountered an error. Please try again.",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error',
      source: 'error'
    });
  }
});

export default router;
