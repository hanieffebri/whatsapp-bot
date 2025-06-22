const jwt = require('jsonwebtoken');
const redis = require('../utils/redis');
const config = require('../config');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    let token;
    
    // Check for token in Authorization header or query parameter
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.api_key) {
      token = req.query.api_key;
    }

    if (!token) {
      return res.status(401).json({ status: 'error', message: 'No token provided' });
    }

    // Check if token is blacklisted in Redis
    const isBlacklisted = await redis.get(`blacklist:${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ status: 'error', message: 'Token has been revoked' });
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret);

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

const authenticateAPIKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;

    if (!apiKey) {
      return res.status(401).json({ status: 'error', message: 'No API key provided' });
    }

    // Find user by API key
    const user = await req.db.User.findOne({ where: { api_key: apiKey } });

    if (!user || !user.is_active) {
      return res.status(401).json({ status: 'error', message: 'Invalid API key' });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    logger.error('API key authentication error:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
};

module.exports = {
  authenticate,
  authenticateAPIKey
};