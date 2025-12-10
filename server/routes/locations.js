import express from 'express';
import { locationDB } from '../db.js';

const router = express.Router();

// Save user location
router.post('/save', async (req, res) => {
  try {
    const { latitude, longitude, address, userId, sessionId } = req.body;
    
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }
    
    // Create location record
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      address: address || null,
      userId: userId || null,
      sessionId: sessionId || null,
      timestamp: new Date().toISOString(),
      source: 'user_detection' // Could be 'user_detection', 'manual_entry', etc.
    };
    
    const savedLocation = await locationDB.create(locationData);
    
    res.json({
      success: true,
      location: savedLocation,
      message: 'Location saved successfully'
    });
  } catch (error) {
    console.error('Error saving location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's recent locations
router.get('/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 5 } = req.query;
    
    const recentLocations = await locationDB.findRecent(userId, parseInt(limit));
    
    res.json({
      locations: recentLocations,
      count: recentLocations.length
    });
  } catch (error) {
    console.error('Error fetching recent locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all locations for a user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userLocations = await locationDB.findByUser(userId);
    
    res.json({
      locations: userLocations,
      count: userLocations.length
    });
  } catch (error) {
    console.error('Error fetching user locations:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update location data
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const updatedLocation = await locationDB.update(id, updateData);
    
    if (!updatedLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      success: true,
      location: updatedLocation,
      message: 'Location updated successfully'
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete location
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedLocation = await locationDB.delete(id);
    
    if (!deletedLocation) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({
      success: true,
      message: 'Location deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get location analytics (for admin/restaurant dashboard)
router.get('/analytics', async (req, res) => {
  try {
    const allLocations = await locationDB.findAll();
    
    // Basic analytics
    const analytics = {
      totalLocations: allLocations.length,
      uniqueUsers: [...new Set(allLocations.filter(l => l.userId).map(l => l.userId))].length,
      locationsToday: allLocations.filter(l => {
        const today = new Date().toDateString();
        return new Date(l.createdAt).toDateString() === today;
      }).length,
      locationsThisWeek: allLocations.filter(l => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(l.createdAt) >= weekAgo;
      }).length
    };
    
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching location analytics:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;