import { restaurantDB } from '../db.js';
import bcrypt from 'bcryptjs';

async function addGrandKitchen() {
  try {
    console.log('🏪 Adding The Grand Kitchen - Multi Cuisine Restaurant...');
    
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const restaurantData = {
      name: "The Grand Kitchen - Multi Cuisine Restaurant",
      description: "Authentic multi-cuisine restaurant serving delicious Indian, Chinese, and Continental dishes",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
      rating: 4.2,
      deliveryTime: "30-45 min",
      cuisine: ["Indian", "Chinese", "Continental", "Multi Cuisine"],
      address: "123 Food Street, City",
      phone: "9876543210",
      email: "grandkitchen@example.com",
      password: hashedPassword,
      isDeliveryAvailable: true,
      tables: 15,
      menu: [
        {
          name: "Butter Chicken",
          price: 280,
          category: "Main Course",
          isVeg: false,
          description: "Creamy tomato-based chicken curry",
          available: true
        },
        {
          name: "Paneer Butter Masala",
          price: 250,
          category: "Main Course", 
          isVeg: true,
          description: "Rich and creamy paneer curry",
          available: true
        },
        {
          name: "Chicken Fried Rice",
          price: 220,
          category: "Main Course",
          isVeg: false,
          description: "Wok-tossed rice with chicken and vegetables",
          available: true
        },
        {
          name: "Veg Fried Rice",
          price: 180,
          category: "Main Course",
          isVeg: true,
          description: "Wok-tossed rice with fresh vegetables",
          available: true
        },
        {
          name: "Chicken Manchurian",
          price: 260,
          category: "Main Course",
          isVeg: false,
          description: "Indo-Chinese chicken in spicy sauce",
          available: true
        },
        {
          name: "Veg Manchurian",
          price: 200,
          category: "Main Course",
          isVeg: true,
          description: "Vegetable balls in tangy sauce",
          available: true
        },
        {
          name: "Chicken Tikka",
          price: 300,
          category: "Starters",
          isVeg: false,
          description: "Grilled chicken marinated in spices",
          available: true
        },
        {
          name: "Paneer Tikka",
          price: 250,
          category: "Starters",
          isVeg: true,
          description: "Grilled cottage cheese with spices",
          available: true
        },
        {
          name: "Pasta Alfredo",
          price: 240,
          category: "Main Course",
          isVeg: true,
          description: "Creamy white sauce pasta",
          available: true
        },
        {
          name: "Chicken Pasta",
          price: 280,
          category: "Main Course",
          isVeg: false,
          description: "Pasta with grilled chicken in tomato sauce",
          available: true
        },
        {
          name: "Gulab Jamun",
          price: 80,
          category: "Desserts",
          isVeg: true,
          description: "Sweet milk dumplings in sugar syrup",
          available: true
        },
        {
          name: "Ice Cream",
          price: 60,
          category: "Desserts",
          isVeg: true,
          description: "Vanilla ice cream",
          available: true
        },
        {
          name: "Fresh Lime Soda",
          price: 50,
          category: "Drinks",
          isVeg: true,
          description: "Refreshing lime drink",
          available: true
        },
        {
          name: "Lassi",
          price: 70,
          category: "Drinks",
          isVeg: true,
          description: "Traditional yogurt drink",
          available: true
        }
      ]
    };
    
    const restaurant = await restaurantDB.create(restaurantData);
    console.log('✅ Restaurant added successfully!');
    console.log('🆔 Restaurant ID:', restaurant._id);
    console.log('📋 Menu items added:', restaurant.menu.length);
    
    return restaurant;
  } catch (error) {
    console.error('❌ Error adding restaurant:', error);
    throw error;
  }
}

// Run the script
addGrandKitchen()
  .then(() => {
    console.log('🎉 The Grand Kitchen restaurant has been added to the database!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to add restaurant:', error);
    process.exit(1);
  });