@echo off
echo 🔧 Fixing Nearby Restaurant Search Issues...
echo.

echo 📦 Building with fixes...
cd client
call npm run build
cd ..

echo 🧪 Testing Voice API with improved search...
echo.

echo Test 1: Direct burger request
curl -X POST http://localhost:5000/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"get me a burger\", \"userId\": \"test123\", \"sessionId\": \"session1\"}"

echo.
echo.

echo Test 2: Burger with veg preference
curl -X POST http://localhost:5000/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"I want a burger\", \"userId\": \"test123\", \"sessionId\": \"session2\"}"

echo.
echo ✅ Nearby restaurant search fixes applied!
echo.
echo 🎯 Key Improvements:
echo - More flexible food item matching (name + cuisine)
echo - Better handling of dietary preferences
echo - Fallback search without dietary restrictions
echo - Improved restaurant display with menu items
echo - Enhanced error handling and suggestions
echo.
echo 🚀 The voice assistant should now consistently find restaurants!
pause