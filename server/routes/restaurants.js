import express from 'express';
import { restaurantDB } from '../db.js';

const router = express.Router();

// Search restaurants
router.get('/search', async (req, res) => {
  try {
    const { q, delivery } = req.query;
    let restaurants = await restaurantDB.search(q);
    
    if (delivery === 'true') {
      restaurants = restaurants.filter(r => r.isDeliveryAvailable);
    }
    
    // Remove password from response
    restaurants = restaurants.map(r => {
      const { password, ...rest } = r;
      return rest;
    });
    
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    let restaurants = await restaurantDB.findAll();
    restaurants = restaurants.map(r => {
      const { password, ...rest } = r;
      return rest;
    });
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update table count (MUST be before GET /:id)
router.patch('/:id/tables', async (req, res) => {
  try {
    console.log('Updating table count for restaurant:', req.params.id);
    console.log('Request body:', req.body);
    
    const { tables } = req.body;
    
    if (typeof tables !== 'number' || tables < 0) {
      console.log('Invalid table count:', tables);
      return res.status(400).json({ error: 'Invalid table count' });
    }
    
    const restaurant = await restaurantDB.update(req.params.id, { tables });
    if (!restaurant) {
      console.log('Restaurant not found:', req.params.id);
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    
    console.log('Table count updated successfully:', restaurant.tables);
    
    const { password, ...rest } = restaurant;
    res.json(rest);
  } catch (error) {
    console.error('Error updating table count:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get restaurant by ID
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await restaurantDB.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    
    // Add ratings to menu items
    if (restaurant.menu && restaurant.menu.length > 0) {
      const { reviewDB } = await import('../db.js');
      
      restaurant.menu = await Promise.all(restaurant.menu.map(async (item) => {
        const reviews = await reviewDB.findByItem(req.params.id, item._id);
        const averageRating = reviews.length > 0
          ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
          : 0;
        
        return {
          ...item,
          averageRating: parseFloat(averageRating),
          reviewCount: reviews.length
        };
      }));
    }
    
    const { password, ...rest } = restaurant;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add menu item
router.post('/:id/menu', async (req, res) => {
  try {
    const restaurant = await restaurantDB.addMenuItem(req.params.id, req.body);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update menu item
router.put('/:id/menu/:menuId', async (req, res) => {
  try {
    const restaurant = await restaurantDB.updateMenuItem(req.params.id, req.params.menuId, req.body);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant or menu item not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete menu item
router.delete('/:id/menu/:menuId', async (req, res) => {
  try {
    const restaurant = await restaurantDB.deleteMenuItem(req.params.id, req.params.menuId);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant or menu item not found' });
    res.json(restaurant);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment settings
router.patch('/:id/payment-settings', async (req, res) => {
  try {
    const { upiId, upiName, acceptCash, acceptUPI } = req.body;
    
    const paymentSettings = {
      upiId: upiId || '',
      upiName: upiName || '',
      acceptCash: acceptCash !== undefined ? acceptCash : true,
      acceptUPI: acceptUPI !== undefined ? acceptUPI : false
    };
    
    const restaurant = await restaurantDB.update(req.params.id, { paymentSettings });
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    
    const { password, ...rest } = restaurant;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update location settings
router.patch('/:id/location-settings', async (req, res) => {
  try {
    const { latitude, longitude, deliveryRadiusKm, address } = req.body;
    
    // Validate coordinates
    if (latitude !== undefined && (isNaN(latitude) || latitude < -90 || latitude > 90)) {
      return res.status(400).json({ error: 'Invalid latitude. Must be between -90 and 90' });
    }
    
    if (longitude !== undefined && (isNaN(longitude) || longitude < -180 || longitude > 180)) {
      return res.status(400).json({ error: 'Invalid longitude. Must be between -180 and 180' });
    }
    
    if (deliveryRadiusKm !== undefined && (isNaN(deliveryRadiusKm) || deliveryRadiusKm < 0)) {
      return res.status(400).json({ error: 'Invalid delivery radius. Must be a positive number' });
    }
    
    const locationSettings = {};
    if (latitude !== undefined) locationSettings.latitude = parseFloat(latitude);
    if (longitude !== undefined) locationSettings.longitude = parseFloat(longitude);
    if (deliveryRadiusKm !== undefined) locationSettings.deliveryRadiusKm = parseFloat(deliveryRadiusKm);
    if (address !== undefined) locationSettings.address = address;
    
    const restaurant = await restaurantDB.update(req.params.id, locationSettings);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    
    const { password, ...rest } = restaurant;
    res.json(rest);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get nearby restaurants based on user location
router.post('/nearby', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Import distance utility
    const { haversineDistanceKm } = await import('../utils/distance.js');
    
    // Get all restaurants
    const allRestaurants = await restaurantDB.findAll();
    
    // Filter and sort restaurants by distance
    const nearbyRestaurants = allRestaurants
      .map(restaurant => {
        // Skip restaurants without location data
        if (!restaurant.latitude || !restaurant.longitude || !restaurant.deliveryRadiusKm) {
          return null;
        }
        
        // Calculate distance
        const distanceKm = haversineDistanceKm(
          latitude,
          longitude,
          restaurant.latitude,
          restaurant.longitude
        );
        
        // Check if within delivery radius
        const isWithinRadius = distanceKm <= restaurant.deliveryRadiusKm;
        
        if (!isWithinRadius) {
          return null;
        }
        
        // Remove password from response and add distance
        const { password, ...restaurantData } = restaurant;
        return {
          ...restaurantData,
          distanceKm: parseFloat(distanceKm.toFixed(2))
        };
      })
      .filter(restaurant => restaurant !== null) // Remove null entries
      .sort((a, b) => a.distanceKm - b.distanceKm); // Sort by distance (closest first)
    
    res.json({
      nearbyRestaurants,
      count: nearbyRestaurants.length,
      userLocation: { latitude, longitude }
    });
  } catch (error) {
    console.error('Error finding nearby restaurants:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check delivery availability
router.post('/:id/check-delivery', async (req, res) => {
  try {
    const { userLatitude, userLongitude } = req.body;
    
    if (!userLatitude || !userLongitude) {
      return res.status(400).json({ error: 'User location is required' });
    }
    
    const restaurant = await restaurantDB.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ error: 'Restaurant not found' });
    
    // If restaurant doesn't have location configured, allow delivery
    if (!restaurant.latitude || !restaurant.longitude || !restaurant.deliveryRadiusKm) {
      return res.json({ 
        allowed: true, 
        distance: null,
        message: 'Restaurant location not configured' 
      });
    }
    
    // Import distance utility
    const { haversineDistanceKm } = await import('../utils/distance.js');
    const distance = haversineDistanceKm(userLatitude, userLongitude, restaurant.latitude, restaurant.longitude);
    
    const allowed = distance <= restaurant.deliveryRadiusKm;
    
    res.json({
      allowed,
      distance: parseFloat(distance.toFixed(2)),
      deliveryRadiusKm: restaurant.deliveryRadiusKm,
      message: allowed 
        ? 'You are in the delivery zone' 
        : 'You are outside the delivery zone'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
