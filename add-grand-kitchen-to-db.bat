@echo off
echo 🏪 Adding The Grand Kitchen Restaurant to Database...
echo.

echo 📝 Running database script...
cd server
node scripts/addGrandKitchen.js
cd ..

echo.
echo ✅ The Grand Kitchen restaurant has been added!
echo.
echo 🎯 Restaurant Details:
echo - Name: The Grand Kitchen - Multi Cuisine Restaurant
echo - Cuisine: Indian, Chinese, Continental, Multi Cuisine
echo - Menu Items: 14 items (Indian, Chinese, Continental dishes)
echo - Rating: 4.2/5
echo - Delivery: Available (30-45 min)
echo.
echo 📋 Sample Menu Items Added:
echo - Butter Chicken - ₹280
echo - Paneer Butter Masala - ₹250
echo - Chicken Fried Rice - ₹220
echo - Veg Fried Rice - ₹180
echo - Chicken Manchurian - ₹260
echo - Pasta Alfredo - ₹240
echo - And 8 more items...
echo.
echo 🚀 You can now add more menu items via the restaurant dashboard!
pause