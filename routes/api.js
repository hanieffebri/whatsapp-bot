const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middlewares/auth');
const rateLimiter = require('../middlewares/rateLimiter');

// Routes untuk pesan dengan autentikasi dan rate limiting
router.post('/messages', authMiddleware, rateLimiter, messageController.sendTextMessage);
router.post('/messages/media', authMiddleware, rateLimiter, messageController.sendMediaMessage);
router.get('/messages/:messageId/status', authMiddleware, messageController.getMessageStatus);
router.get('/messages', authMiddleware, messageController.getMessageHistory);

module.exports = router;