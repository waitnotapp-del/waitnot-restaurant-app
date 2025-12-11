@echo off
echo 🧪 Testing OpenAI Integration...
echo.

echo 📡 Testing AI Health Endpoint...
curl -X GET "http://localhost:5000/api/ai/health" -H "Content-Type: application/json"
echo.
echo.

echo 💬 Testing AI Chat Endpoint...
curl -X POST "http://localhost:5000/api/ai/chat" -H "Content-Type: application/json" -d "{\"message\":\"I want pizza\",\"userId\":\"test\",\"sessionId\":\"test123\"}"
echo.
echo.

echo ✅ Test complete! Check the responses above.
pause