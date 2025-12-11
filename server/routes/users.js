import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { userDB } from '../db.js';

const router = express.Router();

// Store OTPs temporarily (in production, use Redis)
const otpStore = new Map();

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send SMS via MSG91
const sendSMS = async (phone, otp) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY || '480068AuNZVGZoLD69289ec2P1';
    
    // MSG91 API endpoint for sending OTP
    const url = `https://control.msg91.com/api/v5/otp?authkey=${authKey}&mobile=91${phone}&otp=${otp}`;
    
    const response = await axios.get(url);
    
    console.log('MSG91 Response:', response.data);
    return response.data;
  } catch (error) {
    console.error('MSG91 Error:', error.response?.data || error.message);
    throw error;
  }
};

// Register new user with username and password
router.post('/register', async (req, res) => {
  try {
    const { username, password, name, phone } = req.body;

    if (!username || !password || !name || !phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if username already exists
    const existingUser = await userDB.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = await userDB.create({
      username,
      password: hashedPassword,
      name,
      phone,
      createdAt: new Date()
    });

    res.json({
      success: true,
      message: 'Registration successful'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Login with username and password
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user by username
    const user = await userDB.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send OTP (in production, integrate with SMS service like Twilio)
router.post('/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || phone.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number required' });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with 5 minute expiry
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes
    });

    // Send SMS via MSG91
    try {
      await sendSMS(phone, otp);
      console.log(`✅ OTP sent to ${phone}: ${otp}`);
      
      res.json({ 
        success: true, 
        message: 'OTP sent to your phone',
        // For development/testing, show OTP
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      });
    } catch (smsError) {
      console.error('Failed to send SMS, but OTP stored:', smsError);
      
      // Still return success with OTP for development
      res.json({ 
        success: true, 
        message: 'OTP generated (SMS service unavailable)',
        otp: otp // Show OTP if SMS fails
      });
    }
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP and login/register
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP required' });
    }

    // Check OTP
    const storedOTP = otpStore.get(phone);
    
    console.log(`Verifying OTP for ${phone}`);
    console.log(`Stored OTP:`, storedOTP);
    console.log(`Provided OTP:`, otp);
    
    if (!storedOTP) {
      console.log('❌ OTP not found in store');
      return res.status(400).json({ error: 'OTP not found or expired. Please request a new OTP.' });
    }

    if (storedOTP.expiresAt < Date.now()) {
      console.log('❌ OTP expired');
      otpStore.delete(phone);
      return res.status(400).json({ error: 'OTP expired. Please request a new OTP.' });
    }

    if (storedOTP.otp !== otp) {
      console.log('❌ Invalid OTP');
      return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
    }
    
    console.log('✅ OTP verified successfully');

    // OTP verified, remove from store
    otpStore.delete(phone);

    // Check if user exists
    let user = await userDB.findByPhone(phone);

    if (!user) {
      // Create new user
      user = await userDB.create({
        phone,
        name: name || 'User',
        createdAt: new Date()
      });
    } else if (name && name !== user.name) {
      // Update name if provided
      user = await userDB.update(user._id, { name });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, phone: user.phone },
      process.env.JWT_SECRET || 'your_jwt_secret_key_here',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    const user = await userDB.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      phone: user.phone,
      name: user.name,
      address: user.address || ''
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    const user = await userDB.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, phone, address, currentPassword, newPassword } = req.body;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await userDB.update(user._id, {
        name,
        phone,
        address,
        password: hashedPassword
      });
    } else {
      // Update without password change
      await userDB.update(user._id, {
        name,
        phone,
        address
      });
    }

    // Get updated user
    const updatedUser = await userDB.findById(user._id);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address || ''
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's order history
router.get('/orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here');
    const user = await userDB.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get orders by phone number
    const { orderDB } = await import('../db.js');
    const orders = await orderDB.findByPhone(user.phone);

    res.json(orders);
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
