/**
 * Hugging Face AI Service for Waitnot Voice Assistant
 * Handles ASR, NLU, and TTS using Hugging Face Inference API
 */

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';
const HF_BASE_URL = 'https://api-inference.huggingface.co/models';

// Model configurations
const MODELS = {
  ASR: 'openai/whisper-small', // Fast ASR model
  NLU: 'mistralai/Mistral-7B-Instruct-v0.2', // Compact NLU model
  TTS: 'facebook/mms-tts-eng' // Text-to-speech model
};

// System prompt for NLU
const NLU_SYSTEM_PROMPT = `You are Aman, the Waitnot Voice AI assistant. Convert the user transcript into the exact JSON schema shown. Output ONLY the JSON and nothing else. Map menu synonyms to canonical names when possible. If uncertain, set action to 'unknown' and use 'reply' to ask a clarifying question.

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
Output: {"action":"bill","items":[],"table":"","reply":"Let me fetch your bill amount."}`;

/**
 * Call Hugging Face Inference API
 */
async function callHuggingFace(modelId, payload, options = {}) {
  const maxRetries = options.retries || 3;
  const timeout = options.timeout || 30000;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(`${HF_BASE_URL}/${modelId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HF API Error (${response.status}): ${error}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error(`HF API attempt ${attempt}/${maxRetries} failed:`, error.message);
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
}

/**
 * Speech to Text using Hugging Face Whisper
 * @param {Buffer} audioBuffer - Audio data (WAV/MP3)
 * @returns {Promise<string>} Transcribed text
 */
export async function speechToText(audioBuffer) {
  try {
    console.log('🎤 Starting ASR with Hugging Face Whisper...');
    
    const result = await callHuggingFace(MODELS.ASR, {
      inputs: audioBuffer.toString('base64')
    }, { timeout: 15000 });
    
    const transcript = result.text || result[0]?.text || '';
    console.log('✅ ASR Result:', transcript);
    
    return transcript.trim();
    
  } catch (error) {
    console.error('❌ ASR Error:', error.message);
    throw new Error('Speech recognition failed');
  }
}

/**
 * Natural Language Understanding using Hugging Face LLM
 * @param {string} transcript - User's speech text
 * @param {Array} menuItems - Available menu items for context
 * @returns {Promise<Object>} Structured order JSON
 */
export async function processVoiceWithAI(transcript, menuItems = []) {
  try {
    console.log('🤖 Starting NLU with Hugging Face...');
    
    // Build context with menu items
    const menuContext = menuItems.length > 0 
      ? `\n\nAVAILABLE MENU ITEMS:\n${menuItems.map(item => `- ${item.name} (₹${item.price})`).join('\n')}`
      : '';
    
    const userPrompt = `${NLU_SYSTEM_PROMPT}\n\nCustomer said: "${transcript}"${menuContext}\n\nConvert this to order JSON:`;
    
    const result = await callHuggingFace(MODELS.NLU, {
      inputs: userPrompt,
      parameters: {
        temperature: 0.1,
        max_new_tokens: 300,
        return_full_text: false
      }
    }, { timeout: 20000 });
    
    // Extract generated text
    const generatedText = result[0]?.generated_text || result.generated_text || '';
    console.log('🤖 NLU Raw Response:', generatedText);
    
    // Try to extract JSON from response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in NLU response');
    }
    
    const orderData = JSON.parse(jsonMatch[0]);
    console.log('✅ NLU Parsed:', orderData);
    
    // Validate structure
    if (!orderData.action || !orderData.reply) {
      throw new Error('Invalid NLU response structure');
    }
    
    return orderData;
    
  } catch (error) {
    console.error('❌ NLU Error:', error.message);
    
    // Fallback to unknown
    return {
      action: 'unknown',
      items: [],
      table: '',
      reply: "Sorry, I didn't understand that. Could you please repeat?"
    };
  }
}

/**
 * Text to Speech using Hugging Face TTS
 * @param {string} text - Text to convert to speech
 * @returns {Promise<Buffer>} Audio buffer
 */
export async function textToSpeech(text) {
  try {
    console.log('🔊 Starting TTS with Hugging Face...');
    
    const result = await callHuggingFace(MODELS.TTS, {
      inputs: text
    }, { timeout: 10000 });
    
    // Result should be audio buffer
    console.log('✅ TTS Generated');
    return result;
    
  } catch (error) {
    console.error('❌ TTS Error:', error.message);
    throw new Error('Text-to-speech failed');
  }
}

/**
 * Validate and repair order JSON
 * @param {Object} orderData - Order data from NLU
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

/**
 * Health check for Hugging Face service
 */
export async function healthCheck() {
  try {
    // Test with a simple NLU call
    const testResult = await callHuggingFace(MODELS.NLU, {
      inputs: "test",
      parameters: { max_new_tokens: 10 }
    }, { timeout: 5000, retries: 1 });
    
    return {
      status: 'ok',
      models: MODELS,
      apiKeyConfigured: !!HUGGINGFACE_API_KEY
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      models: MODELS,
      apiKeyConfigured: !!HUGGINGFACE_API_KEY
    };
  }
}

export default {
  speechToText,
  processVoiceWithAI,
  textToSpeech,
  validateAndRepairOrder,
  healthCheck
};
