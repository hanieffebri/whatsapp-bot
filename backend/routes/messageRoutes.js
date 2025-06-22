const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { authenticate, authenticateAPIKey } = require('../middlewares/auth');
const whatsappService = require('../services/whatsappService');
const logger = require('../utils/logger');
const db = require('../models');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only PDF and JPEG files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Send text message
router.post('/send', authenticateAPIKey, async (req, res) => {
  try {
    const { to, message } = req.body;

    if (!to || !message) {
      return res.status(400).json({ status: 'error', message: 'Recipient and message are required' });
    }

    const result = await whatsappService.sendMessage(to, message);

    res.json({
      status: 'success',
      data: {
        message: result
      }
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Send media message
router.post('/send-media', authenticateAPIKey, upload.single('file'), async (req, res) => {
  try {
    const { to, caption } = req.body;
    const file = req.file;

    if (!to || !file) {
      return res.status(400).json({ status: 'error', message: 'Recipient and file are required' });
    }

    // Determine media type based on file extension
    const ext = path.extname(file.originalname).toLowerCase();
    const type = ext === '.pdf' ? 'document' : 'image';

    const result = await whatsappService.sendMedia(to, file.path, caption, type);

    res.json({
      status: 'success',
      data: {
        message: result
      }
    });
  } catch (error) {
    logger.error('Error sending media:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Get messages
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, direction, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { user_id: req.user.id };
    if (direction) where.direction = direction;
    if (status) where.status = status;

    const messages = await db.Message.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      status: 'success',
      data: {
        messages: messages.rows,
        total: messages.count,
        page: parseInt(page),
        pages: Math.ceil(messages.count / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;