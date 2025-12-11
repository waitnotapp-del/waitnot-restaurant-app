@echo off
echo 🏪 Adding The Grand Kitchen - Multi Cuisine Restaurant...
echo.

echo 📝 Step 1: Register the restaurant
curl -X POST https://waitnot-backend-42e3.onrender.com/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\": \"The Grand Kitchen - Multi Cuisine Restaurant\", \"description\": \"Authentic multi-cuisine restaurant serving delicious Indian, Chinese, and Continental dishes\", \"email\": \"grandkitchen@example.com\", \"password\": \"password123\", \"phone\": \"9876543210\", \"address\": \"123 Food Street, City\", \"cuisine\": [\"Indian\", \"Chinese\", \"Continental\", \"Multi Cuisine\"], \"isDeliveryAvailable\": true, \"deliveryTime\": \"30-45 min\", \"rating\": 4.2, \"tables\": 15}"

echo.
echo.

echo 📝 Step 2: Get all restaurants to find the new restaurant ID
curl -X GET https://waitnot-backend-42e3.onrender.com/api/restaurants

echo.
echo.

echo ✅ Restaurant registration complete!
echo.
echo 🎯 Next Steps:
echo 1. Copy the restaurant ID from the response above
echo 2. Use this ID to add menu items via: POST /api/restaurants/{ID}/menu
echo.
echo 📋 Example menu item request:
echo curl -X POST https://waitnot-backend-42e3.onrender.com/api/restaurants/{RESTAURANT_ID}/menu ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"name\": \"Butter Chicken\", \"price\": 280, \"category\": \"Main Course\", \"isVeg\": false, \"description\": \"Creamy tomato-based chicken curry\", \"available\": true}"
echo.
pause