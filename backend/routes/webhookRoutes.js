const express = require('express');
const router = express.Router();
const { authenticate } = require('../middlewares/auth');
const db = require('../models');
const logger = require('../utils/logger');

// Create webhook
router.post('/', authenticate, async (req, res) => {
  try {
    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'URL and events array are required' 
      });
    }

    const webhook = await db.Webhook.create({
      user_id: req.user.id,
      url,
      events
    });

    res.status(201).json({
      status: 'success',
      data: {
        webhook
      }
    });
  } catch (error) {
    logger.error('Error creating webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Get all webhooks
router.get('/', authenticate, async (req, res) => {
  try {
    const webhooks = await db.Webhook.findAll({
      where: { user_id: req.user.id }
    });

    res.json({
      status: 'success',
      data: {
        webhooks
      }
    });
  } catch (error) {
    logger.error('Error fetching webhooks:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Update webhook
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, events, is_active } = req.body;

    const webhook = await db.Webhook.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!webhook) {
      return res.status(404).json({ status: 'error', message: 'Webhook not found' });
    }

    if (url) webhook.url = url;
    if (events) webhook.events = events;
    if (is_active !== undefined) webhook.is_active = is_active;

    await webhook.save();

    res.json({
      status: 'success',
      data: {
        webhook
      }
    });
  } catch (error) {
    logger.error('Error updating webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

// Delete webhook
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const webhook = await db.Webhook.findOne({
      where: { id, user_id: req.user.id }
    });

    if (!webhook) {
      return res.status(404).json({ status: 'error', message: 'Webhook not found' });
    }

    await webhook.destroy();

    res.json({
      status: 'success',
      message: 'Webhook deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting webhook:', error);
    res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
});

module.exports = router;