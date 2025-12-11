@echo off
echo 🎤 Testing Conversation Flow with Pepperoni Pizza...
echo.

echo Test 1: User says "I want pepperoni"
curl -X POST https://waitnot-backend-42e3.onrender.com/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"I want pepperoni\", \"userId\": \"testuser\", \"sessionId\": \"test123\"}"

echo.
echo.

echo Test 2: User says "vegetarian" (should continue with pepperoni pizza)
curl -X POST https://waitnot-backend-42e3.onrender.com/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"vegetarian\", \"userId\": \"testuser\", \"sessionId\": \"test123\"}"

echo.
echo.

echo Test 3: User says "1" (quantity)
curl -X POST https://waitnot-backend-42e3.onrender.com/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"1\", \"userId\": \"testuser\", \"sessionId\": \"test123\"}"

echo.
echo ✅ Conversation flow test complete!
echo.
echo 🎯 Expected Flow:
echo 1. "I want pepperoni" → "Do you want vegetarian or non-vegetarian pizza?"
echo 2. "vegetarian" → "How many pizzas would you like?"
echo 3. "1" → "Searching for vegetarian pizza restaurants..."
echo.
pause