const Message = require('../models/Message');
const { client, sendMessage } = require('../services/whatsappService');
const encryptionService = require('../services/encryptionService');

module.exports = {
  // Kirim pesan teks
  sendTextMessage: async (req, res) => {
    try {
      const { to, message } = req.body;
      
      if (!to || !message) {
        return res.status(400).json({ error: 'Nomor tujuan dan pesan diperlukan' });
      }

      const result = await sendMessage(to, message);
      
      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending text message:', error);
      res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
  },

  // Kirim pesan media
  sendMediaMessage: async (req, res) => {
    try {
      const { to, message, media } = req.body;
      
      if (!to || !media || !media.data || !media.mimetype) {
        return res.status(400).json({ error: 'Nomor tujuan dan media diperlukan' });
      }

      const result = await sendMessage(to, message || '', media);
      
      if (result.success) {
        res.json({
          success: true,
          messageId: result.messageId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error sending media message:', error);
      res.status(500).json({ error: 'Gagal mengirim media' });
    }
  },

  // Dapatkan status pesan
  getMessageStatus: async (req, res) => {
    try {
      const { messageId } = req.params;
      
      const message = await Message.findById(messageId);
      if (!message) {
        return res.status(404).json({ error: 'Pesan tidak ditemukan' });
      }

      res.json({
        status: message.status
      });
    } catch (error) {
      console.error('Error getting message status:', error);
      res.status(500).json({ error: 'Gagal mendapatkan status pesan' });
    }
  },

  // Dapatkan riwayat pesan
  getMessageHistory: async (req, res) => {
    try {
      const { page = 1, limit = 10 } = req.query;
      
      const messages = await Message.findAll(parseInt(page), parseInt(limit));
      res.json(messages);
    } catch (error) {
      console.error('Error getting message history:', error);
      res.status(500).json({ error: 'Gagal mendapatkan riwayat pesan' });
    }
  }
};