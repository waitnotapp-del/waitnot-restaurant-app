@echo off
echo 🎤 Testing Voice Assistant Conversation Flow...
echo.

echo 📦 Installing dependencies and building...
cd server
call npm install
cd ../client
call npm install
call npm run build
cd ..

echo 🧪 Testing Voice API Endpoints...
echo.

echo Test 1: Initial food request
curl -X POST http://localhost:5000/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"I want something to eat\", \"userId\": \"test123\"}"

echo.
echo.

echo Test 2: Specific food request
curl -X POST http://localhost:5000/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"I want a burger\", \"userId\": \"test123\"}"

echo.
echo.

echo Test 3: Veg preference
curl -X POST http://localhost:5000/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"vegetarian\", \"userId\": \"test123\"}"

echo.
echo.

echo Test 4: Quantity
curl -X POST http://localhost:5000/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"one\", \"userId\": \"test123\"}"

echo.
echo ✅ Voice conversation flow tests complete!
echo.
echo 🎯 Expected Flow:
echo 1. "I want something to eat" → "What would you like? (e.g., pizza, biryani, burger)"
echo 2. "I want a burger" → "Do you want vegetarian or non-vegetarian burger?"
echo 3. "Vegetarian" → "How many burgers would you like?"
echo 4. "One" → "Okay — checking nearby restaurants for vegetarian burger..."
echo.
pause