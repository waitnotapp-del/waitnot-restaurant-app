@echo off
echo 🍕 Testing Pizza Search in Voice API...
echo.

echo Test 1: Direct pizza request
curl -X POST https://waitnot-backend-42e3.onrender.com/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"I want pizza\", \"userId\": \"test123\", \"sessionId\": \"session1\"}"

echo.
echo.

echo Test 2: Get me pizza
curl -X POST https://waitnot-backend-42e3.onrender.com/api/voice/chat ^
  -H "Content-Type: application/json" ^
  -d "{\"message\": \"get me pizza\", \"userId\": \"test123\", \"sessionId\": \"session2\"}"

echo.
echo.

echo Test 3: Check restaurants endpoint directly
curl -X GET https://waitnot-backend-42e3.onrender.com/api/restaurants

echo.
echo ✅ Pizza search tests complete!
pause