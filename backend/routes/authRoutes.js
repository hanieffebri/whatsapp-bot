const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const db = require('../models');
const logger = require('../utils/logger');
const { authenticate } = require('../middlewares/auth');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user already exists
    const existingUser = await db.User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ status: 'error', message: 'Username already exists' });
    }

    // Create new user
    const user = await db.User.create({
      username,
      password_hash: password // Will be hashed by model hook
    });

    // Generate token
    const token = user.generateAuthToken();

    res.status(201).json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          api_key: user.api_key
        },
        token
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find user
    const user = await db.User.findOne({ where: { username } });
    if (!user || !user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
    }

    // Generate token
    const token = user.generateAuthToken();

    res.json({
      status: 'success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          api_key: user.api_key
        },
        token
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', authenticate, async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.decode(token);

    // Add token to Redis blacklist with expiration time
    const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
    await req.redis.set(`blacklist:${token}`, 'true', 'EX', expiresIn);

    res.json({ status: 'success', message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;