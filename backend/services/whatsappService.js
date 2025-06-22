const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
const db = require('../models');
const webhookService = require('./webhookService');
const config = require('../config');

let whatsappClient = null;

const initialize = () => {
  // Create sessions directory if it doesn't exist
  if (!fs.existsSync(config.whatsapp.sessionDir)) {
    fs.mkdirSync(config.whatsapp.sessionDir, { recursive: true });
  }

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ dataPath: config.whatsapp.sessionDir }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
  });

  whatsappClient.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    logger.info('QR Code generated, please scan with your WhatsApp');
  });

  whatsappClient.on('authenticated', () => {
    logger.info('WhatsApp client authenticated');
  });

  whatsappClient.on('auth_failure', (msg) => {
    logger.error('Authentication failure:', msg);
  });

  whatsappClient.on('ready', () => {
    logger.info('WhatsApp client is ready');
  });

  whatsappClient.on('disconnected', (reason) => {
    logger.warn('WhatsApp client disconnected:', reason);
  });

  whatsappClient.on('message', async (message) => {
    try {
      logger.info(`New message from ${message.from}: ${message.body}`);
      
      // Save message to database
      const savedMessage = await db.Message.create({
        user_id: 1, // You'll need to determine the user ID
        message_id: message.id.id,
        from_number: message.from,
        to_number: message.to,
        content: message.body,
        status: 'delivered',
        direction: 'inbound'
      });

      // Trigger webhooks
      await webhookService.triggerWebhooks('message', {
        message: savedMessage,
        event: 'message:inbound'
      });
    } catch (error) {
      logger.error('Error processing incoming message:', error);
    }
  });

  whatsappClient.on('message_ack', async (message, ack) => {
    try {
      logger.info(`Message ack update: ${message.id.id} - ${ack}`);
      
      // Update message status in database
      await db.Message.update(
        { status: ack === 3 ? 'read' : ack === 2 ? 'delivered' : 'sent' },
        { where: { message_id: message.id.id } }
      );

      // Trigger webhooks
      await webhookService.triggerWebhooks('message_ack', {
        message_id: message.id.id,
        status: ack,
        event: `message:${ack === 3 ? 'read' : ack === 2 ? 'delivered' : 'sent'}`
      });
    } catch (error) {
      logger.error('Error processing message ack:', error);
    }
  });

  whatsappClient.initialize();
};

const getClient = () => {
  if (!whatsappClient) {
    throw new Error('WhatsApp client not initialized');
  }
  return whatsappClient;
};

const sendMessage = async (to, content) => {
  try {
    const client = getClient();
    const message = await client.sendMessage(to, content);
    
    // Save to database
    const savedMessage = await db.Message.create({
      user_id: 1, // You'll need to determine the user ID
      message_id: message.id.id,
      from_number: message.from,
      to_number: message.to,
      content: message.body,
      status: 'sent',
      direction: 'outbound'
    });

    // Trigger webhooks
    await webhookService.triggerWebhooks('message', {
      message: savedMessage,
      event: 'message:outbound'
    });

    return savedMessage;
  } catch (error) {
    logger.error('Error sending message:', error);
    throw error;
  }
};

const sendMedia = async (to, filePath, caption = '', type = 'document') => {
  try {
    const client = getClient();
    const media = MessageMedia.fromFilePath(filePath);
    let message;

    if (type === 'image') {
      message = await client.sendMessage(to, media, { caption });
    } else {
      message = await client.sendMessage(to, media, { caption, sendMediaAsDocument: true });
    }

    // Save to database
    const savedMessage = await db.Message.create({
      user_id: 1, // You'll need to determine the user ID
      message_id: message.id.id,
      from_number: message.from,
      to_number: message.to,
      content: caption,
      media_url: filePath,
      media_type: type,
      status: 'sent',
      direction: 'outbound'
    });

    // Trigger webhooks
    await webhookService.triggerWebhooks('message', {
      message: savedMessage,
      event: 'message:outbound'
    });

    return savedMessage;
  } catch (error) {
    logger.error('Error sending media:', error);
    throw error;
  }
};

module.exports = {
  initialize,
  getClient,
  sendMessage,
  sendMedia
};