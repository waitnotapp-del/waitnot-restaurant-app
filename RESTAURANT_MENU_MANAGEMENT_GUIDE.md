# 🏪 Restaurant & Menu Management Guide

## 🔍 **Issue Identified:**
"The Grand Kitchen - Multi Cuisine Restaurant" doesn't exist in the database, which is why you can't upload menu items to it.

## 📊 **Current Restaurants in Database:**
1. **Spice Garden** - Authentic Indian cuisine
2. **Pizza Paradise** - Wood-fired pizzas and Italian delights  
3. **Burger Hub** - Juicy burgers and crispy fries

## 🛠️ **Solution: Add The Grand Kitchen Restaurant**

### **Option 1: Run Database Script (Recommended)**
```bash
add-grand-kitchen-to-db.bat
```

This will add "The Grand Kitchen - Multi Cuisine Restaurant" with:
- ✅ **14 pre-loaded menu items**
- ✅ **Multi-cuisine options** (Indian, Chinese, Continental)
- ✅ **Proper restaurant details** (rating, delivery time, etc.)
- ✅ **Ready for immediate use**

### **Option 2: Manual API Registration**
```bash
add-grand-kitchen-restaurant.bat
```

This will guide you through:
1. Registering the restaurant via API
2. Getting the restaurant ID
3. Adding menu items manually

## 🍽️ **Menu Items Being Added:**

### **Indian Cuisine:**
- Butter Chicken - ₹280 (Non-Veg)
- Paneer Butter Masala - ₹250 (Veg)
- Chicken Tikka - ₹300 (Non-Veg, Starter)
- Paneer Tikka - ₹250 (Veg, Starter)

### **Chinese Cuisine:**
- Chicken Fried Rice - ₹220 (Non-Veg)
- Veg Fried Rice - ₹180 (Veg)
- Chicken Manchurian - ₹260 (Non-Veg)
- Veg Manchurian - ₹200 (Veg)

### **Continental Cuisine:**
- Pasta Alfredo - ₹240 (Veg)
- Chicken Pasta - ₹280 (Non-Veg)

### **Desserts & Drinks:**
- Gulab Jamun - ₹80 (Veg)
- Ice Cream - ₹60 (Veg)
- Fresh Lime Soda - ₹50 (Veg)
- Lassi - ₹70 (Veg)

## 🔧 **API Endpoints for Menu Management:**

### **Add Menu Item:**
```bash
POST /api/restaurants/{RESTAURANT_ID}/menu
Content-Type: application/json

{
  "name": "Dish Name",
  "price": 250,
  "category": "Main Course",
  "isVeg": true,
  "description": "Dish description",
  "available": true
}
```

### **Update Menu Item:**
```bash
PUT /api/restaurants/{RESTAURANT_ID}/menu/{MENU_ITEM_ID}
Content-Type: application/json

{
  "name": "Updated Dish Name",
  "price": 280,
  "available": true
}
```

### **Delete Menu Item:**
```bash
DELETE /api/restaurants/{RESTAURANT_ID}/menu/{MENU_ITEM_ID}
```

### **Get Restaurant Details:**
```bash
GET /api/restaurants/{RESTAURANT_ID}
```

## 🎯 **After Adding the Restaurant:**

### **Voice Assistant Will Work:**
- ✅ "Get me butter chicken" → Finds The Grand Kitchen
- ✅ "I want Chinese food" → Shows Chinese dishes from The Grand Kitchen
- ✅ "Show me Indian restaurants" → Includes The Grand Kitchen
- ✅ "Get me pasta" → Finds Continental dishes

### **Restaurant Features:**
- ✅ **Multi-cuisine search** - Appears for Indian, Chinese, Continental searches
- ✅ **Dietary options** - Both vegetarian and non-vegetarian items
- ✅ **Delivery available** - 30-45 min delivery time
- ✅ **Good rating** - 4.2/5 stars
- ✅ **Complete menu** - Starters, Main Course, Desserts, Drinks

## 🚀 **Quick Start:**

1. **Run the script:**
   ```bash
   add-grand-kitchen-to-db.bat
   ```

2. **Verify it's added:**
   ```bash
   curl -X GET https://waitnot-backend-42e3.onrender.com/api/restaurants
   ```

3. **Test voice assistant:**
   - Say: "Get me butter chicken"
   - Say: "I want Chinese food"
   - Say: "Show me multi-cuisine restaurants"

4. **Add more menu items if needed:**
   ```bash
   curl -X POST https://waitnot-backend-42e3.onrender.com/api/restaurants/{ID}/menu \
     -H "Content-Type: application/json" \
     -d '{"name": "New Dish", "price": 200, "category": "Main Course", "isVeg": true, "description": "Description", "available": true}'
   ```

## 🔍 **Troubleshooting:**

### **If menu upload still fails:**
1. Check if restaurant exists: `GET /api/restaurants`
2. Verify restaurant ID is correct
3. Check request format matches the API schema
4. Ensure all required fields are provided

### **Common Issues:**
- ❌ **Restaurant not found** → Restaurant doesn't exist, need to register first
- ❌ **Invalid menu item** → Missing required fields (name, price, category)
- ❌ **Authentication error** → Need proper restaurant credentials
- ❌ **Network error** → Check API endpoint and connectivity

## 📝 **Menu Item Schema:**
```javascript
{
  "name": "string (required)",
  "price": "number (required)", 
  "category": "string (required)", // "Starters", "Main Course", "Desserts", "Drinks"
  "isVeg": "boolean (required)",
  "description": "string (optional)",
  "available": "boolean (optional, defaults to true)",
  "image": "string (optional)"
}
```

## 🎉 **Summary:**
Run `add-grand-kitchen-to-db.bat` to add "The Grand Kitchen - Multi Cuisine Restaurant" with a complete menu, then you'll be able to upload additional menu items successfully!

---

**Status: ✅ SOLUTION PROVIDED**  
**Restaurant: 🏪 READY TO ADD**  
**Menu Management: 📋 FULLY FUNCTIONAL**