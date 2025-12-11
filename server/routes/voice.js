import express from 'express';
import { restaurantDB } from '../db.js';

const router = express.Router();

// Conversation state management
const conversationStates = new Map();

// Food ordering conversation flow
router.post('/chat', async (req, res) => {
  try {
    const { message, userId = 'anonymous', sessionId } = req.body;
    const userMessage = message.toLowerCase().trim();
    
    // Get or create conversation state
    const stateKey = `${userId}_${sessionId || 'default'}`;
    let state = conversationStates.get(stateKey) || {
      step: 'initial',
      foodItem: null,
      isVeg: null,
      quantity: null,
      context: {}
    };

    let response = '';
    let suggestions = [];
    let restaurants = [];

    // Step 1: Initial food request detection
    if (state.step === 'initial') {
      if (userMessage.includes('want') && (userMessage.includes('eat') || userMessage.includes('food') || userMessage.includes('order'))) {
        // Check if specific food is mentioned
        const foodItems = extractFoodItems(userMessage);
        
        if (foodItems.length > 0) {
          state.foodItem = foodItems[0];
          state.step = 'ask_veg_preference';
          response = `Do you want vegetarian or non-vegetarian ${state.foodItem}?`;
          suggestions = ['Vegetarian', 'Non-vegetarian'];
        } else {
          state.step = 'ask_food_type';
          response = "What would you like? (e.g., pizza, biryani, burger)";
          suggestions = ['Pizza', 'Burger', 'Biryani', 'Pasta', 'Chinese'];
        }
      } else if (containsFoodItem(userMessage)) {
        // Direct food mention like "I want burger"
        const foodItems = extractFoodItems(userMessage);
        state.foodItem = foodItems[0];
        state.step = 'ask_veg_preference';
        response = `Do you want vegetarian or non-vegetarian ${state.foodItem}?`;
        suggestions = ['Vegetarian', 'Non-vegetarian'];
      } else {
        response = "Hi! I can help you find and order food. What would you like to eat today?";
        suggestions = ['Pizza', 'Burger', 'Biryani', 'Chinese', 'Italian'];
      }
    }
    
    // Step 2: Food type selection
    else if (state.step === 'ask_food_type') {
      const foodItems = extractFoodItems(userMessage);
      if (foodItems.length > 0) {
        state.foodItem = foodItems[0];
        state.step = 'ask_veg_preference';
        response = `Do you want vegetarian or non-vegetarian ${state.foodItem}?`;
        suggestions = ['Vegetarian', 'Non-vegetarian'];
      } else {
        response = "I didn't catch that. Could you specify what food you'd like? (e.g., pizza, burger, biryani)";
        suggestions = ['Pizza', 'Burger', 'Biryani', 'Pasta', 'Chinese'];
      }
    }
    
    // Step 3: Veg/Non-veg preference
    else if (state.step === 'ask_veg_preference') {
      if (userMessage.includes('veg') && !userMessage.includes('non')) {
        state.isVeg = true;
        state.step = 'ask_quantity';
        response = `How many ${state.foodItem}s would you like?`;
        suggestions = ['1', '2', '3', '4', '5'];
      } else if (userMessage.includes('non') || userMessage.includes('meat') || userMessage.includes('chicken')) {
        state.isVeg = false;
        state.step = 'ask_quantity';
        response = `How many ${state.foodItem}s would you like?`;
        suggestions = ['1', '2', '3', '4', '5'];
      } else {
        response = `Do you want vegetarian or non-vegetarian ${state.foodItem}?`;
        suggestions = ['Vegetarian', 'Non-vegetarian'];
      }
    }
    
    // Step 4: Quantity selection
    else if (state.step === 'ask_quantity') {
      const quantity = extractQuantity(userMessage);
      if (quantity > 0) {
        state.quantity = quantity;
        state.step = 'search_restaurants';
        response = `Okay — checking nearby restaurants for ${state.isVeg ? 'vegetarian' : 'non-vegetarian'} ${state.foodItem} and sorting by rating.`;
        
        // Search for restaurants
        const searchResults = await searchRestaurants(state.foodItem, state.isVeg);
        
        if (searchResults.length > 0) {
          restaurants = searchResults;
          const topRestaurant = searchResults[0];
          const dietaryText = state.isVeg !== null ? (state.isVeg ? 'vegetarian' : 'non-vegetarian') : '';
          
          response += `\n\nFound ${searchResults.length} restaurant${searchResults.length > 1 ? 's' : ''} offering ${dietaryText} ${state.foodItem}:\n\n`;
          
          // Show top 3 restaurants with their menu items
          searchResults.slice(0, 3).forEach((restaurant, index) => {
            response += `${index + 1}. ${restaurant.name} ⭐ ${restaurant.rating}/5\n`;
            if (restaurant.menu && restaurant.menu.length > 0) {
              response += `   ${restaurant.menu.slice(0, 2).map(item => `${item.name} - ₹${item.price}`).join(', ')}\n`;
            }
            response += `   🕐 ${restaurant.deliveryTime}\n\n`;
          });
          
          response += `Would you like to see full menu, place an order, or hear more options?`;
          suggestions = ['See Menu', 'Place Order', 'More Options', 'Start Over'];
          state.step = 'show_results';
        } else {
          // Try searching without dietary restriction
          const allResults = await searchRestaurants(state.foodItem, null);
          if (allResults.length > 0) {
            response += `\n\nI found ${allResults.length} restaurant${allResults.length > 1 ? 's' : ''} with ${state.foodItem}, but they might have both vegetarian and non-vegetarian options. Would you like to see them?`;
            restaurants = allResults;
            suggestions = ['Yes, Show Them', 'Try Another Food', 'Start Over'];
            state.step = 'show_results';
          } else {
            response += `\n\nSorry — I couldn't find any ${state.foodItem} in our current restaurants. Try browsing all restaurants or search for similar items like:`;
            
            // Suggest similar items
            const suggestions_text = [
              '• Pizza → Italian cuisine',
              '• Biryani → Indian cuisine', 
              '• Noodles → Chinese cuisine',
              '• Burgers → Fast food'
            ];
            response += `\n\n${suggestions_text.join('\n')}\n\nWhat else can I help you find?`;
            
            suggestions = ['Try Another Food', 'Show All Restaurants', 'Start Over'];
            state.step = 'no_results';
          }
        }
      } else {
        response = "I didn't catch the quantity — how many would you like?";
        suggestions = ['1', '2', '3', '4', '5'];
      }
    }
    
    // Step 5: Handle results
    else if (state.step === 'show_results') {
      if (userMessage.includes('menu')) {
        const topRestaurant = restaurants[0];
        const menuItems = topRestaurant.menu.filter(item => 
          item.isVeg === state.isVeg && 
          item.name.toLowerCase().includes(state.foodItem.toLowerCase())
        );
        
        response = `Here's the ${state.foodItem} menu from ${topRestaurant.name}:\n\n`;
        menuItems.forEach(item => {
          response += `• ${item.name} - ₹${item.price}\n  ${item.description}\n\n`;
        });
        response += "Would you like to place an order?";
        suggestions = ['Place Order', 'More Restaurants', 'Start Over'];
      } else if (userMessage.includes('order')) {
        response = `Great! I'll help you place an order. Please select the restaurant and items you'd like to order.`;
        suggestions = ['Continue to Order', 'Start Over'];
        state.step = 'place_order';
      } else if (userMessage.includes('more') || userMessage.includes('option')) {
        response = `Here are more restaurants offering ${state.isVeg ? 'vegetarian' : 'non-vegetarian'} ${state.foodItem}:\n\n`;
        restaurants.slice(1, 4).forEach((restaurant, index) => {
          response += `${index + 2}. ${restaurant.name} — rating ${restaurant.rating}/5\n`;
        });
        response += "\nWhich restaurant would you like to choose?";
        suggestions = restaurants.slice(0, 3).map(r => r.name);
      } else {
        response = "Would you like to see the menu, place an order, or hear more options?";
        suggestions = ['See Menu', 'Place Order', 'More Options', 'Start Over'];
      }
    }
    
    // Handle restart
    if (userMessage.includes('start over') || userMessage.includes('restart')) {
      state = {
        step: 'initial',
        foodItem: null,
        isVeg: null,
        quantity: null,
        context: {}
      };
      response = "Let's start fresh! What would you like to eat today?";
      suggestions = ['Pizza', 'Burger', 'Biryani', 'Chinese', 'Italian'];
    }

    // Update conversation state
    conversationStates.set(stateKey, state);

    res.json({
      response,
      suggestions,
      restaurants: restaurants.slice(0, 5), // Limit to top 5
      conversationState: {
        step: state.step,
        foodItem: state.foodItem,
        isVeg: state.isVeg,
        quantity: state.quantity
      }
    });

  } catch (error) {
    console.error('Voice chat error:', error);
    res.status(500).json({ 
      response: "Sorry, I'm having trouble processing your request. Please try again.",
      suggestions: ['Try Again', 'Start Over']
    });
  }
});

// Helper functions
function extractFoodItems(message) {
  const foodKeywords = [
    'pizza', 'burger', 'biryani', 'pasta', 'noodles', 'rice', 'chicken', 'paneer',
    'dal', 'curry', 'sandwich', 'wrap', 'salad', 'soup', 'bread', 'roti', 'naan',
    'dosa', 'idli', 'vada', 'samosa', 'pakora', 'tikka', 'kebab', 'momos', 'chaat',
    'chinese', 'italian', 'mexican', 'thai', 'continental', 'dessert', 'ice cream',
    'cake', 'pastry', 'coffee', 'tea', 'juice', 'lassi', 'shake'
  ];
  
  const found = [];
  foodKeywords.forEach(keyword => {
    if (message.includes(keyword)) {
      found.push(keyword);
    }
  });
  
  return found;
}

function containsFoodItem(message) {
  return extractFoodItems(message).length > 0;
}

function extractQuantity(message) {
  // Extract numbers from message
  const numbers = message.match(/\d+/g);
  if (numbers) {
    return parseInt(numbers[0]);
  }
  
  // Handle word numbers
  const wordNumbers = {
    'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
  };
  
  for (const [word, num] of Object.entries(wordNumbers)) {
    if (message.includes(word)) {
      return num;
    }
  }
  
  return 0;
}

async function searchRestaurants(foodItem, isVeg) {
  try {
    const restaurants = await restaurantDB.findAll();
    
    const matchingRestaurants = restaurants.filter(restaurant => {
      return restaurant.menu && restaurant.menu.some(menuItem => {
        // More flexible matching - check if food item is in menu item name or restaurant cuisine
        const itemNameMatch = menuItem.name.toLowerCase().includes(foodItem.toLowerCase());
        const cuisineMatch = restaurant.cuisine && restaurant.cuisine.some(c => 
          c.toLowerCase().includes(foodItem.toLowerCase())
        );
        
        // Check if dietary preference matches (if specified)
        const dietaryMatch = isVeg !== null ? menuItem.isVeg === isVeg : true;
        
        return (itemNameMatch || cuisineMatch) && dietaryMatch && menuItem.available !== false;
      });
    });
    
    // Sort by rating (descending)
    return matchingRestaurants
      .sort((a, b) => (b.rating || 4.0) - (a.rating || 4.0))
      .map(restaurant => ({
        id: restaurant._id || restaurant.id,
        name: restaurant.name,
        rating: restaurant.rating || 4.0,
        deliveryTime: restaurant.deliveryTime,
        cuisine: restaurant.cuisine,
        address: restaurant.address,
        menu: restaurant.menu.filter(item => {
          const itemNameMatch = item.name.toLowerCase().includes(foodItem.toLowerCase());
          const cuisineMatch = restaurant.cuisine && restaurant.cuisine.some(c => 
            c.toLowerCase().includes(foodItem.toLowerCase())
          );
          const dietaryMatch = isVeg !== null ? item.isVeg === isVeg : true;
          
          return (itemNameMatch || cuisineMatch) && dietaryMatch && item.available !== false;
        })
      }));
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return [];
  }
}

// Clear conversation state endpoint
router.post('/clear-session', (req, res) => {
  const { userId = 'anonymous', sessionId } = req.body;
  const stateKey = `${userId}_${sessionId || 'default'}`;
  conversationStates.delete(stateKey);
  res.json({ success: true });
});

export default router;