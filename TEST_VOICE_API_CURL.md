# 🧪 TEST VOICE API WITH CURL - DETAILED GUIDE

## 📋 **PREREQUISITES**

### Check if curl is installed:
```bash
curl --version
```

**If not installed:**
- **Windows:** curl comes pre-installed in Windows 10/11
- **Mac/Linux:** Usually pre-installed
- **Alternative:** Use PowerShell (see below)

---

## 🎯 **METHOD 1: USING CURL (Windows CMD)**

### Step 1: Open Command Prompt
- Press `Win + R`
- Type: `cmd`
- Press Enter

### Step 2: Test Health Endpoint (Simple Test)
```bash
curl https://waitnot-restaurant-app.onrender.com/api/voice/health
```

**Expected Response:**
```json
{
  "status":"ok",
  "aiBackend":"huggingface",
  "huggingfaceLoaded":true,
  "huggingfaceError":null,
  "timestamp":"2025-11-29T..."
}
```

### Step 3: Test Voice Processing (Main Test)
```bash
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
```

**Expected Response:**
```json
{
  "action":"order",
  "items":[{"name":"Pizza","quantity":1,"price":299}],
  "table":"",
  "reply":"Sure! I've added 1 Pizza to your order.",
  "source":"huggingface-ai"
}
```

---

## 🎯 **METHOD 2: USING POWERSHELL (Recommended for Windows)**

### Step 1: Open PowerShell
- Press `Win + X`
- Select "Windows PowerShell" or "Terminal"

### Step 2: Test Health Endpoint
```powershell
Invoke-RestMethod -Uri "https://waitnot-restaurant-app.onrender.com/api/voice/health" -Method Get
```

### Step 3: Test Voice Processing
```powershell
$body = @{
    command = "Hey Aman, get me one pizza"
    restaurantId = "1"
    tableNumber = "2"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://waitnot-restaurant-app.onrender.com/api/voice/process" -Method Post -Body $body -ContentType "application/json"
```

**Expected Output:**
```
action : order
items  : {@{name=Pizza; quantity=1; price=299}}
table  : 2
reply  : Sure! I've added 1 Pizza to your order.
source : huggingface-ai
```

---

## 🎯 **METHOD 3: USING BATCH FILE (Easiest)**

### Create a test file: `test-voice-api.bat`

```batch
@echo off
echo ========================================
echo TESTING VOICE API
echo ========================================
echo.

echo Test 1: Health Check
echo ----------------------------------------
curl https://waitnot-restaurant-app.onrender.com/api/voice/health
echo.
echo.

echo Test 2: Simple Order (One Pizza)
echo ----------------------------------------
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
echo.
echo.

echo Test 3: Complex Order (Two Burgers and One Coke)
echo ----------------------------------------
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, I want two burgers and one coke\",\"restaurantId\":\"1\"}"
echo.
echo.

echo Test 4: Bill Request
echo ----------------------------------------
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, what's my bill?\",\"restaurantId\":\"1\"}"
echo.
echo.

echo ========================================
echo TESTS COMPLETE
echo ========================================
pause
```

**To run:**
1. Save the file as `test-voice-api.bat`
2. Double-click to run
3. See all test results

---

## 📊 **DETAILED TEST CASES**

### Test 1: Simple Order
```bash
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process \
  -H "Content-Type: application/json" \
  -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
```

**What it tests:**
- Wake word detection ("Hey Aman")
- Simple quantity (one)
- Single item (pizza)
- AI processing

**Expected:**
```json
{
  "action": "order",
  "items": [{"name": "Pizza", "quantity": 1}],
  "source": "huggingface-ai"
}
```

---

### Test 2: Complex Order
```bash
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process \
  -H "Content-Type: application/json" \
  -d "{\"command\":\"Hey Aman, I want two burgers and one coke\",\"restaurantId\":\"1\"}"
```

**What it tests:**
- Multiple items
- Different quantities
- Natural language ("I want")
- AI understanding

**Expected:**
```json
{
  "action": "order",
  "items": [
    {"name": "Burger", "quantity": 2},
    {"name": "Coke", "quantity": 1}
  ],
  "source": "huggingface-ai"
}
```

---

### Test 3: Bill Request
```bash
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process \
  -H "Content-Type: application/json" \
  -d "{\"command\":\"Hey Aman, what's my bill?\",\"restaurantId\":\"1\"}"
```

**What it tests:**
- Non-order action
- Question understanding
- Bill action

**Expected:**
```json
{
  "action": "bill",
  "items": [],
  "reply": "Let me fetch your bill amount.",
  "source": "huggingface-ai"
}
```

---

### Test 4: With Table Number
```bash
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process \
  -H "Content-Type: application/json" \
  -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\",\"tableNumber\":\"5\"}"
```

**What it tests:**
- Table number handling
- Complete order flow

**Expected:**
```json
{
  "action": "order",
  "items": [{"name": "Pizza", "quantity": 1}],
  "table": "5",
  "source": "huggingface-ai"
}
```

---

## 🔍 **UNDERSTANDING THE RESPONSE**

### Success Response Fields:

```json
{
  "action": "order",           // Type: order, bill, cancel, repeat, unknown
  "items": [...],              // Array of ordered items
  "table": "5",                // Table number (if provided)
  "reply": "Sure! I've...",    // AI's response message
  "source": "huggingface-ai"   // AI backend used
}
```

### Response Sources:
- **"huggingface-ai"** - ✅ AI processing worked
- **"fallback"** - ⚠️ Using keyword matching
- **"error"** - ❌ Error occurred

---

## ⏱️ **EXPECTED TIMING**

### First Request:
```
Request sent → 0s
Model loading → 5-10s
ASR processing → 2-3s
NLU processing → 3-5s
Total: 10-20 seconds
```

### Subsequent Requests:
```
Request sent → 0s
ASR processing → 2-3s
NLU processing → 3-5s (cached)
Total: 6-9 seconds
```

---

## 🚨 **TROUBLESHOOTING**

### Error 1: "curl: command not found"
**Solution:**
- Use PowerShell method instead
- Or install curl from: https://curl.se/download.html

### Error 2: Timeout
**Cause:** First request takes 10-20s
**Solution:** Wait longer, or increase timeout:
```bash
curl --max-time 30 -X POST ...
```

### Error 3: "source": "fallback"
**Cause:** AI processing failed
**Solution:**
- Check Hugging Face API key
- Verify health endpoint shows huggingfaceLoaded: true
- Check Render logs

### Error 4: "source": "error"
**Cause:** Server error
**Solution:**
- Check Render logs
- Verify restaurant ID exists
- Check command format

---

## 📈 **PERFORMANCE TESTING**

### Test Response Time:
```bash
curl -w "\nTime: %{time_total}s\n" -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
```

### Test Multiple Requests:
```bash
for /L %i in (1,1,5) do (
  echo Test %i
  curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
  echo.
)
```

---

## 🎯 **QUICK REFERENCE**

### Health Check:
```bash
curl https://waitnot-restaurant-app.onrender.com/api/voice/health
```

### Simple Order:
```bash
curl -X POST https://waitnot-restaurant-app.onrender.com/api/voice/process -H "Content-Type: application/json" -d "{\"command\":\"Hey Aman, get me one pizza\",\"restaurantId\":\"1\"}"
```

### With Pretty Print (PowerShell):
```powershell
Invoke-RestMethod -Uri "https://waitnot-restaurant-app.onrender.com/api/voice/process" -Method Post -Body '{"command":"Hey Aman, get me one pizza","restaurantId":"1"}' -ContentType "application/json" | ConvertTo-Json -Depth 10
```

---

## ✅ **SUCCESS CRITERIA**

### API is working when:
- [ ] Health endpoint returns 200 OK
- [ ] huggingfaceLoaded: true
- [ ] Voice command returns order JSON
- [ ] Response source is "huggingface-ai"
- [ ] Items are correctly identified
- [ ] Quantities are correct
- [ ] Response time < 20s (first) or < 10s (subsequent)

---

## 🎉 **READY TO TEST!**

**Choose your method:**
1. **Easiest:** Use the batch file (copy code above)
2. **Quick:** Use PowerShell commands
3. **Advanced:** Use curl commands

**All methods will show you that your Hugging Face voice API is working perfectly!** 🤗🎤✨

---

*Created: November 30, 2025*  
*API Endpoint: /api/voice/process*  
*Method: POST*  
*Backend: Hugging Face*
