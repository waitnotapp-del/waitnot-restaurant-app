@echo off
echo ========================================
echo 🧪 Testing Deployed API Endpoints
echo ========================================

set BACKEND_URL=https://waitnot-restaurant-app.onrender.com

echo.
echo 🔍 Testing Backend Health...
curl -s %BACKEND_URL%/health
echo.
echo.

echo 🏪 Testing Restaurants Endpoint...
curl -s %BACKEND_URL%/api/restaurants | jq .
echo.
echo.

echo 📍 Testing Location Settings Endpoint...
echo Testing: %BACKEND_URL%/api/restaurants/midc8u9d91l99mo7yxq/location-settings
curl -s -X PATCH %BACKEND_URL%/api/restaurants/midc8u9d91l99mo7yxq/location-settings ^
  -H "Content-Type: application/json" ^
  -d "{\"latitude\":12.343706,\"longitude\":76.618138,\"deliveryRadiusKm\":5,\"address\":\"456 Oak Avenue, City\"}"
echo.
echo.

echo 🗺️ Testing Locations Save Endpoint...
curl -s -X POST %BACKEND_URL%/api/locations/save ^
  -H "Content-Type: application/json" ^
  -d "{\"latitude\":12.343706,\"longitude\":76.618138,\"address\":\"Test Address\"}"
echo.
echo.

echo ========================================
echo 🎯 API Test Complete
echo ========================================
pause