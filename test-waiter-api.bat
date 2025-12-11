@echo off
echo Testing Waiter AI Voice Assistant API
echo =====================================

set API_URL=http://localhost:5000/api/voice

echo.
echo 1. Testing initial food request...
curl -X POST %API_URL%/query ^
  -H "Content-Type: application/json" ^
  -d "{\"session_id\": \"test_session_1\", \"text\": \"I want a burger\", \"user_location\": {\"lat\": 19.076, \"lng\": 72.8777}}"

echo.
echo.
echo 2. Testing veg preference...
curl -X POST %API_URL%/query ^
  -H "Content-Type: application/json" ^
  -d "{\"session_id\": \"test_session_1\", \"text\": \"veg\"}"

echo.
echo.
echo 3. Testing quantity...
curl -X POST %API_URL%/query ^
  -H "Content-Type: application/json" ^
  -d "{\"session_id\": \"test_session_1\", \"text\": \"2\"}"

echo.
echo.
echo 4. Testing restaurant search endpoint...
curl -X POST %API_URL%/restaurants/search ^
  -H "Content-Type: application/json" ^
  -d "{\"food_name\": \"burger\", \"veg_flag\": true, \"quantity\": 2, \"lat\": 19.076, \"lng\": 72.8777}"

echo.
echo.
echo 5. Testing session clear...
curl -X POST %API_URL%/clear-session ^
  -H "Content-Type: application/json" ^
  -d "{\"session_id\": \"test_session_1\"}"

echo.
echo.
echo Testing complete!
pause