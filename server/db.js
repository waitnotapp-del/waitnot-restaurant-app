import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'data');

// Initialize database
export async function initDB() {
  try {
    await fs.mkdir(DB_PATH, { recursive: true });
    
    const files = ['restaurants.json', 'orders.json', 'reels.json', 'users.json', 'reviews.json', 'locations.json'];
    for (const file of files) {
      const filePath = path.join(DB_PATH, file);
      try {
        await fs.access(filePath);
      } catch {
        await fs.writeFile(filePath, JSON.stringify([], null, 2));
      }
    }
    console.log('✅ Local database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Generic read function
async function readData(filename) {
  try {
    const data = await fs.readFile(path.join(DB_PATH, filename), 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Generic write function
async function writeData(filename, data) {
  await fs.writeFile(path.join(DB_PATH, filename), JSON.stringify(data, null, 2));
}

// Generate unique ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Restaurant operations
export const restaurantDB = {
  async findAll() {
    return await readData('restaurants.json');
  },
  
  async findById(id) {
    const restaurants = await readData('restaurants.json');
    return restaurants.find(r => r._id === id);
  },
  
  async findOne(query) {
    const restaurants = await readData('restaurants.json');
    return restaurants.find(r => {
      for (const key in query) {
        if (r[key] !== query[key]) return false;
      }
      return true;
    });
  },
  
  async create(data) {
    const restaurants = await readData('restaurants.json');
    const newRestaurant = {
      _id: generateId(),
      ...data,
      menu: data.menu || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    restaurants.push(newRestaurant);
    await writeData('restaurants.json', restaurants);
    return newRestaurant;
  },
  
  async update(id, data) {
    const restaurants = await readData('restaurants.json');
    const index = restaurants.findIndex(r => r._id === id);
    if (index === -1) return null;
    
    restaurants[index] = {
      ...restaurants[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    await writeData('restaurants.json', restaurants);
    return restaurants[index];
  },
  
  async search(query) {
    const restaurants = await readData('restaurants.json');
    if (!query) return restaurants;
    
    const searchTerm = query.toLowerCase();
    return restaurants.filter(r => {
      const nameMatch = r.name?.toLowerCase().includes(searchTerm);
      const cuisineMatch = r.cuisine?.some(c => c.toLowerCase().includes(searchTerm));
      const menuMatch = r.menu?.some(m => m.name?.toLowerCase().includes(searchTerm));
      return nameMatch || cuisineMatch || menuMatch;
    });
  },
  
  async addMenuItem(restaurantId, menuItem) {
    const restaurant = await this.findById(restaurantId);
    if (!restaurant) return null;
    
    const newItem = { _id: generateId(), ...menuItem };
    restaurant.menu.push(newItem);
    return await this.update(restaurantId, restaurant);
  },
  
  async updateMenuItem(restaurantId, menuItemId, data) {
    const restaurant = await this.findById(restaurantId);
    if (!restaurant) return null;
    
    const menuIndex = restaurant.menu.findIndex(m => m._id === menuItemId);
    if (menuIndex === -1) return null;
    
    restaurant.menu[menuIndex] = { ...restaurant.menu[menuIndex], ...data };
    return await this.update(restaurantId, restaurant);
  },
  
  async deleteMenuItem(restaurantId, menuItemId) {
    const restaurant = await this.findById(restaurantId);
    if (!restaurant) return null;
    
    restaurant.menu = restaurant.menu.filter(m => m._id !== menuItemId);
    return await this.update(restaurantId, restaurant);
  }
};

// Order operations
export const orderDB = {
  async findAll() {
    return await readData('orders.json');
  },
  
  async findById(id) {
    const orders = await readData('orders.json');
    return orders.find(o => o._id === id);
  },
  
  async findByRestaurant(restaurantId) {
    const orders = await readData('orders.json');
    return orders.filter(o => o.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async findByPhone(phone) {
    const orders = await readData('orders.json');
    return orders.filter(o => o.customerPhone === phone)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async create(data) {
    const orders = await readData('orders.json');
    const newOrder = {
      _id: generateId(),
      ...data,
      status: data.status || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    orders.push(newOrder);
    await writeData('orders.json', orders);
    return newOrder;
  },
  
  async update(id, data) {
    const orders = await readData('orders.json');
    const index = orders.findIndex(o => o._id === id);
    if (index === -1) return null;
    
    orders[index] = {
      ...orders[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    await writeData('orders.json', orders);
    return orders[index];
  }
};

// Reel operations
export const reelDB = {
  async findAll() {
    const reels = await readData('reels.json');
    const restaurants = await readData('restaurants.json');
    
    return reels.map(reel => ({
      ...reel,
      restaurantId: restaurants.find(r => r._id === reel.restaurantId)
    })).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async findById(id) {
    const reels = await readData('reels.json');
    return reels.find(r => r._id === id);
  },
  
  async create(data) {
    const reels = await readData('reels.json');
    const newReel = {
      _id: generateId(),
      ...data,
      menuItemId: data.menuItemId || null,
      views: 0,
      likes: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    reels.push(newReel);
    await writeData('reels.json', reels);
    return newReel;
  },
  
  async update(id, data) {
    const reels = await readData('reels.json');
    const index = reels.findIndex(r => r._id === id);
    if (index === -1) return null;
    
    reels[index] = {
      ...reels[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    await writeData('reels.json', reels);
    return reels[index];
  },
  
  async incrementViews(id) {
    const reel = await this.findById(id);
    if (!reel) return null;
    return await this.update(id, { views: (reel.views || 0) + 1 });
  },
  
  async incrementLikes(id) {
    const reel = await this.findById(id);
    if (!reel) return null;
    return await this.update(id, { likes: (reel.likes || 0) + 1 });
  },
  
  async delete(id) {
    const reels = await readData('reels.json');
    const index = reels.findIndex(r => r._id === id);
    if (index === -1) return null;
    
    const deleted = reels[index];
    reels.splice(index, 1);
    await writeData('reels.json', reels);
    return deleted;
  }
};

// User operations
export const userDB = {
  async findAll() {
    return await readData('users.json');
  },
  
  async findById(id) {
    const users = await readData('users.json');
    return users.find(u => u._id === id);
  },
  
  async findByPhone(phone) {
    const users = await readData('users.json');
    return users.find(u => u.phone === phone);
  },
  
  async findByUsername(username) {
    const users = await readData('users.json');
    return users.find(u => u.username === username);
  },
  
  async create(data) {
    const users = await readData('users.json');
    const newUser = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    users.push(newUser);
    await writeData('users.json', users);
    return newUser;
  },
  
  async update(id, data) {
    const users = await readData('users.json');
    const index = users.findIndex(u => u._id === id);
    if (index === -1) return null;
    
    users[index] = {
      ...users[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    await writeData('users.json', users);
    return users[index];
  }
};


// Location operations
export const locationDB = {
  async findAll() {
    return await readData('locations.json');
  },
  
  async findById(id) {
    const locations = await readData('locations.json');
    return locations.find(l => l._id === id);
  },
  
  async findByUser(userId) {
    const locations = await readData('locations.json');
    return locations.filter(l => l.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async findRecent(userId, limit = 5) {
    const locations = await this.findByUser(userId);
    return locations.slice(0, limit);
  },
  
  async create(data) {
    const locations = await readData('locations.json');
    const newLocation = {
      _id: generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    locations.push(newLocation);
    await writeData('locations.json', locations);
    return newLocation;
  },
  
  async update(id, data) {
    const locations = await readData('locations.json');
    const index = locations.findIndex(l => l._id === id);
    if (index === -1) return null;
    
    locations[index] = {
      ...locations[index],
      ...data,
      updatedAt: new Date().toISOString()
    };
    await writeData('locations.json', locations);
    return locations[index];
  },
  
  async delete(id) {
    const locations = await readData('locations.json');
    const index = locations.findIndex(l => l._id === id);
    if (index === -1) return null;
    
    const deleted = locations[index];
    locations.splice(index, 1);
    await writeData('locations.json', locations);
    return deleted;
  }
};

// Review operations
export const reviewDB = {
  async findAll() {
    return await readData('reviews.json');
  },
  
  async findById(id) {
    const reviews = await readData('reviews.json');
    return reviews.find(r => r._id === id);
  },
  
  async findByItem(restaurantId, itemId) {
    const reviews = await readData('reviews.json');
    return reviews.filter(r => r.restaurantId === restaurantId && r.itemId === itemId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async findByRestaurant(restaurantId) {
    const reviews = await readData('reviews.json');
    return reviews.filter(r => r.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },
  
  async create(data) {
    const reviews = await readData('reviews.json');
    const newReview = {
      _id: generateId(),
      ...data,
      createdAt: data.createdAt || new Date().toISOString()
    };
    reviews.push(newReview);
    await writeData('reviews.json', reviews);
    return newReview;
  },
  
  async getAverageRating(restaurantId, itemId) {
    const reviews = await this.findByItem(restaurantId, itemId);
    if (reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }
};
