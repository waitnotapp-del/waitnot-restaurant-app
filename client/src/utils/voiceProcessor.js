import VoiceStorage from './voiceStorage.js';
import { calculateDistance, getCurrentLocation, sortRestaurantsByRating } from './locationUtils.js';

class VoiceProcessor {
  constructor() {
    this.storage = new VoiceStorage();
    this.currentRequest = null;
    this.restaurants = [];
    this.isInitialized = false;
  }

  async init() {
    if (!this.isInitialized) {
      await this.storage.init();
      this.isInitialized = true;
    }
  }

  // Extract food name from user message
  extractFoodName(message) {
    const foodKeywords = {
      // Pizza variants
      'pizza': 'pizza',
      'pepperoni': 'pizza',
      'margherita': 'pizza',
      'cheese pizza': 'pizza',
      
      // Burger variants
      'burger': 'burger',
      'cheeseburger': 'burger',
      'hamburger': 'burger',
      'veggie burger': 'burger',
      
      // Indian dishes
      'biryani': 'biryani',
      'chicken biryani': 'biryani',
      'veg biryani': 'biryani',
      'butter chicken': 'chicken',
      'chicken tikka': 'chicken',
      'paneer tikka': 'paneer',
      'dal': 'dal',
      'curry': 'curry',
      
      // Chinese dishes
      'fried rice': 'rice',
      'noodles': 'noodles',
      'manchurian': 'manchurian',
      
      // Continental
      'pasta': 'pasta',
      'sandwich': 'sandwich'
    };

    const lowerMessage = message.toLowerCase();
    
    for (const [keyword, foodName] of Object.entries(foodKeywords)) {
      if (lowerMessage.includes(keyword)) {
        return foodName;
      }
    }
    
    return null;
  }

  // Extract dietary preference
  extractVegOption(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('veg') && !lowerMessage.includes('non')) {
      return 'veg';
    } else if (lowerMessage.includes('non-veg') || lowerMessage.includes('nonveg') || 
               lowerMessage.includes('meat') || lowerMessage.includes('chicken')) {
      return 'nonveg';
    }
    
    return null;
  }

  // Extract quantity
  extractQuantity(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for numbers
    const numbers = message.match(/\d+/g);
    if (numbers) {
      return parseInt(numbers[0]);
    }
    
    // Check for word numbers
    const wordNumbers = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    
    for (const [word, num] of Object.entries(wordNumbers)) {
      if (lowerMessage.includes(word)) {
        return num;
      }
    }
    
    return null;
  }

  // Process user message and return response
  async processMessage(message, restaurants = []) {
    await this.init();
    this.restaurants = restaurants;
    
    const lowerMessage = message.toLowerCase();
    
    // Check if we have an active request
    if (!this.currentRequest) {
      // Check if user is requesting food
      if (lowerMessage.includes('want') || lowerMessage.includes('get me') || lowerMessage.includes('order')) {
        const foodName = this.extractFoodName(message);
        
        if (foodName) {
          // Create new request
          this.currentRequest = this.storage.createRequest(foodName);
          await this.storage.saveRequest(this.currentRequest);
          
          return {
            response: `Do you want vegetarian or non-vegetarian ${foodName}?`,
            suggestions: ['Vegetarian', 'Non-vegetarian'],
            status: 'collecting'
          };
        } else {
          return {
            response: "What would you like to eat? (e.g., pizza, burger, biryani)",
            suggestions: ['Pizza', 'Burger', 'Biryani', 'Pasta', 'Chinese'],
            status: 'idle'
          };
        }
      }
      
      return {
        response: "Hi! I can help you order food. What would you like to eat?",
        suggestions: ['Pizza', 'Burger', 'Biryani', 'Chinese', 'Italian'],
        status: 'idle'
      };
    }

    // Continue with existing request
    if (this.currentRequest.status === 'collecting') {
      // Check for veg option
      if (!this.currentRequest.vegOption) {
        const vegOption = this.extractVegOption(message);
        if (vegOption) {
          this.currentRequest.vegOption = vegOption;
          await this.storage.updateRequest(this.currentRequest.id, { vegOption });
          
          return {
            response: `How many ${this.currentRequest.foodName}s would you like?`,
            suggestions: ['1', '2', '3', '4', '5'],
            status: 'collecting'
          };
        } else {
          return {
            response: `Do you want vegetarian or non-vegetarian ${this.currentRequest.foodName}?`,
            suggestions: ['Vegetarian', 'Non-vegetarian'],
            status: 'collecting'
          };
        }
      }

      // Check for quantity
      if (!this.currentRequest.quantity) {
        const quantity = this.extractQuantity(message);
        if (quantity) {
          this.currentRequest.quantity = quantity;
          this.currentRequest.status = 'searching';
          await this.storage.updateRequest(this.currentRequest.id, { 
            quantity, 
            status: 'searching' 
          });
          
          // Get user location and search
          try {
            const location = await getCurrentLocation();
            this.currentRequest.userLocation = location;
            await this.storage.updateRequest(this.currentRequest.id, { userLocation: location });
            
            const results = await this.searchNearbyRestaurants();
            return results;
          } catch (error) {
            return {
              response: "I need your location to find nearby restaurants. Please allow location access and try again.",
              suggestions: ['Try Again', 'Start Over'],
              status: 'failed'
            };
          }
        } else {
          return {
            response: "How many would you like? Please specify a number.",
            suggestions: ['1', '2', '3', '4', '5'],
            status: 'collecting'
          };
        }
      }
    }

    // Handle other states or reset
    if (lowerMessage.includes('start over') || lowerMessage.includes('cancel')) {
      await this.resetCurrentRequest();
      return {
        response: "Let's start fresh! What would you like to eat?",
        suggestions: ['Pizza', 'Burger', 'Biryani', 'Chinese', 'Italian'],
        status: 'idle'
      };
    }

    return {
      response: "I didn't understand. Could you please repeat?",
      suggestions: ['Start Over'],
      status: 'error'
    };
  }

  async searchNearbyRestaurants() {
    if (!this.currentRequest || !this.currentRequest.userLocation) {
      return {
        response: "Location not available. Please try again.",
        suggestions: ['Try Again', 'Start Over'],
        status: 'failed'
      };
    }

    const { foodName, vegOption, userLocation } = this.currentRequest;
    const userLat = userLocation.lat;
    const userLng = userLocation.lng;

    // Filter restaurants by delivery radius and food availability
    const nearbyRestaurants = this.restaurants.filter(restaurant => {
      // Check if restaurant has coordinates (use default if not)
      const restLat = restaurant.latitude || 12.3;
      const restLng = restaurant.longitude || 76.6;
      const deliveryRadius = restaurant.deliveryRadiusKm || 10;
      
      // Check if in delivery radius
      const distance = calculateDistance(userLat, userLng, restLat, restLng);
      const inRadius = distance <= deliveryRadius;
      
      // Check if restaurant has the requested food
      const hasFood = restaurant.menu && restaurant.menu.some(item => {
        const nameMatch = item.name.toLowerCase().includes(foodName.toLowerCase());
        const cuisineMatch = restaurant.cuisine && restaurant.cuisine.some(c => 
          c.toLowerCase().includes(foodName.toLowerCase())
        );
        const vegMatch = vegOption ? item.isVeg === (vegOption === 'veg') : true;
        const available = item.available !== false;
        
        return (nameMatch || cuisineMatch) && vegMatch && available;
      });
      
      return inRadius && hasFood;
    });

    if (nearbyRestaurants.length === 0) {
      this.currentRequest.status = 'completed';
      await this.storage.updateRequest(this.currentRequest.id, { 
        status: 'completed',
        results: []
      });
      
      await this.resetCurrentRequest();
      
      return {
        response: `That ${foodName} isn't available nearby. Try browsing all restaurants or search for similar items.`,
        suggestions: ['Show All Restaurants', 'Try Another Food', 'Start Over'],
        status: 'no_results'
      };
    }

    // Sort by rating and add distance info
    const sortedRestaurants = sortRestaurantsByRating(nearbyRestaurants, userLocation)
      .map(restaurant => {
        const distance = calculateDistance(
          userLat, userLng, 
          restaurant.latitude || 12.3, 
          restaurant.longitude || 76.6
        );
        
        const matchingItems = restaurant.menu.filter(item => {
          const nameMatch = item.name.toLowerCase().includes(foodName.toLowerCase());
          const cuisineMatch = restaurant.cuisine && restaurant.cuisine.some(c => 
            c.toLowerCase().includes(foodName.toLowerCase())
          );
          const vegMatch = vegOption ? item.isVeg === (vegOption === 'veg') : true;
          const available = item.available !== false;
          
          return (nameMatch || cuisineMatch) && vegMatch && available;
        });
        
        return {
          ...restaurant,
          distance,
          matchingItems
        };
      });

    // Update request with results
    this.currentRequest.status = 'found';
    this.currentRequest.results = sortedRestaurants;
    await this.storage.updateRequest(this.currentRequest.id, { 
      status: 'found',
      results: sortedRestaurants
    });

    // Format response
    const dietaryText = vegOption === 'veg' ? 'vegetarian' : vegOption === 'nonveg' ? 'non-vegetarian' : '';
    let response = `Found ${sortedRestaurants.length} restaurant${sortedRestaurants.length > 1 ? 's' : ''} with ${dietaryText} ${foodName}:\n\n`;
    
    sortedRestaurants.slice(0, 3).forEach((restaurant, index) => {
      response += `${index + 1}. ${restaurant.name} ⭐ ${restaurant.rating}/5\n`;
      response += `   📍 ${restaurant.distance}km away | 🕐 ${restaurant.deliveryTime}\n`;
      
      if (restaurant.matchingItems.length > 0) {
        const items = restaurant.matchingItems.slice(0, 2)
          .map(item => `${item.name} - ₹${item.price}`)
          .join(', ');
        response += `   ${items}\n`;
      }
      response += '\n';
    });
    
    response += `Which restaurant would you like to order from?`;
    
    return {
      response,
      suggestions: sortedRestaurants.slice(0, 3).map(r => r.name).concat(['Start Over']),
      restaurants: sortedRestaurants,
      status: 'found'
    };
  }

  async resetCurrentRequest() {
    if (this.currentRequest) {
      await this.storage.updateRequest(this.currentRequest.id, { 
        status: 'cancelled',
        updatedAt: Date.now()
      });
    }
    this.currentRequest = null;
  }

  async getCurrentRequest() {
    return this.currentRequest;
  }

  async getRequestHistory() {
    return await this.storage.getAllRequests();
  }
}

export default VoiceProcessor;