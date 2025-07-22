/**
 * @file messageController.js
 * @description Controller untuk mengelola pesan WhatsApp.
 * @requires ../models/Message
 * @requires ../services/whatsappService
 */

const Message = require('../models/Message');
const { sendMessage } = require('../services/whatsappService');

module.exports = {
  /**
   * @function sendTextMessage
   * @description Mengirim pesan teks ke nomor WhatsApp.
   * @param {object} req - Objek permintaan Express.
   * @param {object} res - Objek respons Express.
   */
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

  /**
   * @function sendMediaMessage
   * @description Mengirim pesan media (gambar, PDF) ke nomor WhatsApp.
   * @param {object} req - Objek permintaan Express.
   * @param {object} res - Objek respons Express.
   */
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

  /**
   * @function getMessageStatus
   * @description Mendapatkan status pesan berdasarkan ID pesan.
   * @param {object} req - Objek permintaan Express.
   * @param {object} res - Objek respons Express.
   */
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

  /**
   * @function getMessageHistory
   * @description Mendapatkan riwayat pesan dengan paginasi.
   * @param {object} req - Objek permintaan Express.
   * @param {object} res - Objek respons Express.
   */
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