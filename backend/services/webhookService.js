const axios = require('axios');
const logger = require('../utils/logger');
const db = require('../models');

const triggerWebhooks = async (eventType, data) => {
  try {
    const webhooks = await db.Webhook.findAll({
      where: {
        is_active: true,
        events: {
          [db.Sequelize.Op.like]: `%${eventType}%`
        }
      }
    });

    for (const webhook of webhooks) {
      try {
        await axios.post(webhook.url, {
          event: eventType,
          data: data,
          timestamp: new Date().toISOString()
        }, {
          timeout: 5000 // 5 seconds timeout
        });
        logger.info(`Webhook triggered successfully for ${webhook.url}`);
      } catch (error) {
        logger.error(`Failed to trigger webhook ${webhook.url}:`, error.message);
      }
    }
  } catch (error) {
    logger.error('Error triggering webhooks:', error);
  }
};

module.exports = {
  triggerWebhooks
};