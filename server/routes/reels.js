import express from 'express';
import { reelDB } from '../db.js';

const router = express.Router();

// Get all reels (optionally filter by restaurant)
router.get('/', async (req, res) => {
  try {
    // Set cache headers for better performance
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'ETag': `reels-${Date.now()}`,
      'Content-Type': 'application/json'
    });

    const reels = await reelDB.findAll();
    
    // Filter by restaurant if restaurantId query param is provided
    const { restaurantId, limit, offset } = req.query;
    let filteredReels = reels;
    
    if (restaurantId) {
      filteredReels = reels.filter(reel => {
        const reelRestaurantId = reel.restaurantId?._id || reel.restaurantId;
        return reelRestaurantId === restaurantId;
      });
      console.log(`Filtered reels for restaurant ${restaurantId}:`, filteredReels.length);
    }
    
    // Add pagination support
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset) || 0;
      filteredReels = filteredReels.slice(offsetNum, offsetNum + limitNum);
    }
    
    res.json(filteredReels); // Keep backward compatibility
  } catch (error) {
    console.error('Error fetching reels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get nearby reels based on user location
router.post('/nearby', async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Set cache headers
    res.set({
      'Cache-Control': 'public, max-age=300', // 5 minutes
      'Content-Type': 'application/json'
    });
    
    // Import distance utility
    const { haversineDistanceKm } = await import('../utils/distance.js');
    
    // Get all reels
    const allReels = await reelDB.findAll();
    
    // Filter reels by restaurant delivery zones
    const nearbyReels = allReels.filter(reel => {
      const restaurant = reel.restaurantId;
      
      // Skip reels from restaurants without location data
      if (!restaurant || !restaurant.latitude || !restaurant.longitude || !restaurant.deliveryRadiusKm) {
        return true; // Include reels from restaurants without location setup
      }
      
      // Calculate distance between user and restaurant
      const distanceKm = haversineDistanceKm(
        latitude,
        longitude,
        restaurant.latitude,
        restaurant.longitude
      );
      
      // Include reel if user is within delivery radius
      return distanceKm <= restaurant.deliveryRadiusKm;
    });
    
    console.log(`Location-based reel filtering: ${nearbyReels.length} out of ${allReels.length} reels are nearby`);
    
    res.json({
      reels: nearbyReels,
      total: allReels.length,
      nearby: nearbyReels.length,
      userLocation: { latitude, longitude },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching nearby reels:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reels by restaurant ID (dedicated endpoint for better clarity)
router.get('/restaurant/:restaurantId', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const reels = await reelDB.findAll();
    
    const filteredReels = reels.filter(reel => {
      const reelRestaurantId = reel.restaurantId?._id || reel.restaurantId;
      return reelRestaurantId === restaurantId;
    });
    
    console.log(`Reels for restaurant ${restaurantId}:`, filteredReels.length);
    res.json(filteredReels);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create reel
router.post('/', async (req, res) => {
  try {
    console.log('Creating reel with data:', req.body);
    
    // Validate required fields
    const { videoUrl, dishName, price, restaurantId } = req.body;
    
    if (!videoUrl?.trim()) {
      return res.status(400).json({ error: 'Video URL is required' });
    }
    if (!dishName?.trim()) {
      return res.status(400).json({ error: 'Dish name is required' });
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    if (!restaurantId?.trim()) {
      return res.status(400).json({ error: 'Restaurant ID is required' });
    }
    
    // Validate URL format
    try {
      new URL(videoUrl);
    } catch {
      return res.status(400).json({ error: 'Invalid video URL format' });
    }
    
    // Clean and prepare data
    const reelData = {
      ...req.body,
      dishName: dishName.trim(),
      videoUrl: videoUrl.trim(),
      price: parseFloat(price)
    };
    
    const reel = await reelDB.create(reelData);
    console.log('Reel created:', reel);
    res.status(201).json(reel);
  } catch (error) {
    console.error('Error creating reel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Increment views
router.patch('/:id/view', async (req, res) => {
  try {
    const reel = await reelDB.incrementViews(req.params.id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });
    res.json(reel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle like
router.patch('/:id/like', async (req, res) => {
  try {
    const reel = await reelDB.incrementLikes(req.params.id);
    if (!reel) return res.status(404).json({ error: 'Reel not found' });
    res.json(reel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update reel
router.put('/:id', async (req, res) => {
  try {
    console.log('Updating reel:', req.params.id, 'with data:', req.body);
    
    // Get existing reel to verify it exists
    const existingReel = await reelDB.findById(req.params.id);
    if (!existingReel) {
      console.log('Reel not found:', req.params.id);
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    // Validate fields if provided
    const { videoUrl, dishName, price, restaurantId } = req.body;
    
    if (videoUrl !== undefined && !videoUrl?.trim()) {
      return res.status(400).json({ error: 'Video URL cannot be empty' });
    }
    if (dishName !== undefined && !dishName?.trim()) {
      return res.status(400).json({ error: 'Dish name cannot be empty' });
    }
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) <= 0)) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    
    // Validate URL format if provided
    if (videoUrl) {
      try {
        new URL(videoUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid video URL format' });
      }
    }
    
    // Verify restaurant ownership if restaurantId is being changed
    if (restaurantId && existingReel.restaurantId !== restaurantId) {
      console.warn('⚠️ Unauthorized reel update attempt');
      console.warn('Reel belongs to:', existingReel.restaurantId);
      console.warn('Update requested by:', restaurantId);
      return res.status(403).json({ error: 'Unauthorized: Cannot update reels from another restaurant' });
    }
    
    // Clean data
    const updateData = { ...req.body };
    if (dishName) updateData.dishName = dishName.trim();
    if (videoUrl) updateData.videoUrl = videoUrl.trim();
    if (price) updateData.price = parseFloat(price);
    
    const reel = await reelDB.update(req.params.id, updateData);
    console.log('Reel updated:', reel);
    res.json(reel);
  } catch (error) {
    console.error('Error updating reel:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete reel
router.delete('/:id', async (req, res) => {
  try {
    console.log('Deleting reel:', req.params.id);
    
    // Get existing reel to verify it exists
    const existingReel = await reelDB.findById(req.params.id);
    if (!existingReel) {
      console.log('Reel not found:', req.params.id);
      return res.status(404).json({ error: 'Reel not found' });
    }
    
    // Optional: Add restaurant verification if restaurantId is provided in query
    if (req.query.restaurantId && existingReel.restaurantId !== req.query.restaurantId) {
      console.warn('⚠️ Unauthorized reel deletion attempt');
      console.warn('Reel belongs to:', existingReel.restaurantId);
      console.warn('Delete requested by:', req.query.restaurantId);
      return res.status(403).json({ error: 'Unauthorized: Cannot delete reels from another restaurant' });
    }
    
    const reel = await reelDB.delete(req.params.id);
    console.log('Reel deleted:', reel);
    res.json({ message: 'Reel deleted successfully', reel });
  } catch (error) {
    console.error('Error deleting reel:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
