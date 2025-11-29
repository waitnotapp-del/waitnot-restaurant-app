import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// System prompt for order processing
const SYSTEM_PROMPT = `You are the Waitnot Voice AI assistant. Your job is to convert customer speech into structured order JSON.

RULES:
1. Extract food items, quantities, and table numbers from user speech
2. Always return ONLY valid JSON, no extra text
3. If unclear, set action to "unknown"
4. Be conversational but precise

OUTPUT FORMAT (MANDATORY):
{
  "action": "order|cancel|bill|repeat|unknown",
  "items": [{"name": "item name", "quantity": number}],
  "table": "table number or empty",
  "reply": "friendly confirmation message"
}

EXAMPLES:
Input: "get me two masala dosas"
Output: {"action":"order","items":[{"name":"masala dosa","quantity":2}],"table":"","reply":"Sure! I've added two masala dosas to your order."}

Input: "what's my bill"
Output: {"action":"bill","items":[],"table":"","reply":"Let me fetch your bill amount."}

Input: "cancel the pizza"
Output: {"action":"cancel","items":[{"name":"pizza","quantity":1}],"table":"","reply":"I'll cancel the pizza from your order."}`;

/**
 * Process voice command using OpenRouter LLM
 * @param {string} transcript - User's speech converted to text
 * @param {Array} menuItems - Available menu items for context
 * @returns {Promise<Object>} Structured order JSON
 */
export async function processVoiceWithAI(transcript, menuItems = []) {
  try {
    // Build context with menu items
    const menuContext = menuItems.length > 0 
      ? `\n\nAVAILABLE MENU ITEMS:\n${menuItems.map(item => `- ${item.name} (₹${item.price})`).join('\n')}`
      : '';

    const userPrompt = `Customer said: "${transcript}"${menuContext}\n\nConvert this to order JSON:`;

    const response = await axios.post(
      `${OPENROUTER_BASE_URL}/chat/completions`,
      {
        model: 'openai/gpt-4o-mini', // Fast and cost-effective
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2, // Low temperature for precise orders
        max_tokens: 300,
        response_format: { type: 'json_object' } // Force JSON output
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://waitnot-restaurant-app.onrender.com',
          'X-Title': 'Waitnot Voice Assistant'
        }
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    console.log('OpenRouter AI Response:', aiResponse);

    // Parse and validate JSON
    const orderData = JSON.parse(aiResponse);
    
    // Validate structure
    if (!orderData.action || !orderData.reply) {
      throw new Error('Invalid AI response structure');
    }

    return orderData;

  } catch (error) {
    console.error('OpenRouter AI Error:', error.message);
    
    // Fallback to keyword-based processing
    return {
      action: 'unknown',
      items: [],
      table: '',
      reply: "Sorry, I didn't understand that. Could you please repeat?"
    };
  }
}

/**
 * Transcribe audio using Whisper via OpenRouter
 * @param {Buffer} audioBuffer - Audio data
 * @returns {Promise<string>} Transcribed text
 */
export async function transcribeAudio(audioBuffer) {
  try {
    // Note: OpenRouter doesn't directly support audio transcription
    // This would need to use Whisper API or similar
    // For now, we'll use browser's built-in speech recognition
    throw new Error('Audio transcription should use browser Speech Recognition API');
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

/**
 * Validate and repair order JSON
 * @param {Object} orderData - Order data from AI
 * @param {Array} menuItems - Available menu items
 * @returns {Object} Validated and repaired order
 */
export function validateAndRepairOrder(orderData, menuItems) {
  const repaired = { ...orderData };

  // Ensure required fields
  if (!repaired.action) repaired.action = 'unknown';
  if (!repaired.items) repaired.items = [];
  if (!repaired.table) repaired.table = '';
  if (!repaired.reply) repaired.reply = 'Processing your request...';

  // Validate action
  const validActions = ['order', 'cancel', 'bill', 'repeat', 'unknown'];
  if (!validActions.includes(repaired.action)) {
    repaired.action = 'unknown';
  }

  // Match items with menu
  if (repaired.items.length > 0 && menuItems.length > 0) {
    repaired.items = repaired.items.map(item => {
      const menuItem = findBestMenuMatch(item.name, menuItems);
      if (menuItem) {
        return {
          name: menuItem.name,
          quantity: item.quantity || 1,
          price: menuItem.price,
          _id: menuItem._id
        };
      }
      return item;
    });
  }

  return repaired;
}

/**
 * Find best matching menu item using fuzzy matching
 * @param {string} spokenName - Item name from speech
 * @param {Array} menuItems - Available menu items
 * @returns {Object|null} Best matching menu item
 */
function findBestMenuMatch(spokenName, menuItems) {
  const lowerSpoken = spokenName.toLowerCase();
  
  // Exact match
  let match = menuItems.find(item => 
    item.name.toLowerCase() === lowerSpoken
  );
  if (match) return match;

  // Partial match
  match = menuItems.find(item => 
    item.name.toLowerCase().includes(lowerSpoken) ||
    lowerSpoken.includes(item.name.toLowerCase())
  );
  if (match) return match;

  // Word-by-word match
  const spokenWords = lowerSpoken.split(' ');
  match = menuItems.find(item => {
    const itemWords = item.name.toLowerCase().split(' ');
    return spokenWords.some(word => itemWords.includes(word));
  });

  return match || null;
}

export default {
  processVoiceWithAI,
  transcribeAudio,
  validateAndRepairOrder
};
