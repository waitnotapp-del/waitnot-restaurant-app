# 🚀 AI Voice Assistant - Quick Start Guide

## Get Started in 5 Minutes!

### Step 1: Get OpenRouter API Key (2 minutes)

1. Go to https://openrouter.ai/
2. Click "Sign Up" or "Log In"
3. Navigate to "API Keys" section
4. Click "Create API Key"
5. Copy the key (starts with `sk-or-v1-...`)

### Step 2: Configure Environment (1 minute)

Add to `server/.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
USE_AI_PROCESSING=true
```

### Step 3: Install Dependencies (1 minute)

```bash
cd server
npm install axios express-rate-limit
```

Or run the setup script:
```bash
setup-ai-voice.bat
```

### Step 4: Restart Server (30 seconds)

```bash
cd server
npm start
```

### Step 5: Test It! (30 seconds)

1. Open the app
2. Scan QR code
3. Tap microphone button
4. Say: **"Hey Aman, get me one pizza"**
5. ✅ Watch AI process your order!

---

## How It Works

```
You: "Hey Aman, get me two burgers"
     ↓
🎤 Wake word detected
     ↓
🗣️ Speech converted to text
     ↓
🤖 OpenRouter AI processes: "get me two burgers"
     ↓
📋 AI returns: {"action":"order","items":[{"name":"burger","quantity":2}]}
     ↓
✅ 2 burgers added to cart
     ↓
🔊 "Sure! I've added two burgers to your order."
```

---

## Test Commands

Try these voice commands:

### Orders:
- "Hey Aman, get me one pizza"
- "Hey Aman, I want two burgers and one coke"
- "Hey Aman, add three samosas"

### Bill:
- "Hey Aman, what's my bill?"
- "Hey Aman, show me the total"

### Cancel:
- "Hey Aman, cancel the pizza"
- "Hey Aman, remove the burger"

---

## Troubleshooting

### ❌ "Sorry, I couldn't process that"
**Fix**: Check OPENROUTER_API_KEY in server/.env

### ❌ Items not added to cart
**Fix**: Make sure item names match menu items

### ❌ No response from AI
**Fix**: Check server logs for errors

### ❌ "Too many requests"
**Fix**: Wait 1 minute (rate limit: 10 requests/minute)

---

## Cost

- **Per Order**: ~$0.0001 (1/100th of a cent!)
- **1000 Orders**: ~$0.10
- **Extremely affordable!**

---

## Features

✅ Wake word detection ("Hey Aman")
✅ Natural language understanding
✅ Menu-aware processing
✅ Fuzzy item matching
✅ Quantity extraction
✅ Multi-item orders
✅ Bill requests
✅ Cancel requests
✅ Fallback to keyword matching
✅ Text-to-speech responses
✅ Rate limiting
✅ Error handling

---

## What's Next?

1. **Test with real orders**
2. **Monitor API usage** at https://openrouter.ai/
3. **Adjust prompts** if needed
4. **Add more menu items**
5. **Train staff** on voice commands

---

## Support

Need help? Check:
- `AI_VOICE_ASSISTANT_INTEGRATION.md` - Full documentation
- `VOICE_ASSISTANT_FEATURE.md` - Feature details
- Server logs - `console.log` output

---

**You're all set! Start ordering with your voice! 🎤🤖**
