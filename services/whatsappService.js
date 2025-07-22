/**
 * @file whatsappService.js
 * @description Layanan untuk mengelola interaksi dengan WhatsApp Web.
 * @requires whatsapp-web.js
 * @requires qrcode-terminal
 * @requires ../config/db
 * @requires ../models/Message
 * @requires ../models/Webhook
 * @requires crypto
 * @requires axios
 */

const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const Message = require('../models/Message');
const Webhook = require('../models/Webhook');
const axios = require('axios');
const crypto = require('crypto');

// Inisialisasi klien WhatsApp dengan otentikasi lokal
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.SESSION_FILE_PATH || './sessions'
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Event listener untuk pembuatan kode QR
client.on('qr', (qr) => {
  console.log('Pindai kode QR ini dengan WhatsApp Anda:', qr);
  qrcode.generate(qr, { small: true });
});

// Event listener saat klien siap digunakan
client.on('ready', () => {
  console.log('Klien WhatsApp siap digunakan!');
});

// Event listener untuk pesan masuk
client.on('message', async (msg) => {
  try {
    const messageData = {
      message_id: msg.id.id,
      from_number: msg.from,
      to_number: msg.to,
      message: msg.body,
      media_url: msg.hasMedia ? await downloadMedia(msg) : null,
      media_type: msg.hasMedia ? getMediaType(msg) : 'text',
      status: 'delivered',
      direction: 'incoming'
    };

    await Message.create(messageData);

    // Memicu webhook untuk pesan masuk
    const webhooks = await Webhook.findByEventType('message_received');
    triggerWebhooks(webhooks, messageData);
  } catch (error) {
    console.error('Gagal memproses pesan masuk:', error);
  }
});

// Event listener untuk status pengiriman pesan
client.on('message_ack', async (msg, ack) => {
  try {
    await Message.updateStatus(msg.id.id, ack);
    
    // Memicu webhook untuk pembaruan status
    const webhooks = await Webhook.findByEventType('message_status_update');
    triggerWebhooks(webhooks, { message_id: msg.id.id, status: ack });
  } catch (error) {
    console.error('Gagal memperbarui status pesan:', error);
  }
});

/**
 * @function downloadMedia
 * @description Mengunduh media dari pesan WhatsApp.
 * @param {object} msg - Objek pesan dari whatsapp-web.js.
 * @returns {Promise<string|null>} Data media dalam format base64 atau null jika gagal.
 */
async function downloadMedia(msg) {
  try {
    const media = await msg.downloadMedia();
    return media.data;
  } catch (error) {
    console.error('Gagal mengunduh media:', error);
    return null;
  }
}

/**
 * @function getMediaType
 * @description Menentukan tipe media dari pesan.
 * @param {object} msg - Objek pesan dari whatsapp-web.js.
 * @returns {string} Tipe media ('image', 'pdf', 'document').
 */
function getMediaType(msg) {
  if (msg.type === 'image') return 'image';
  if (msg.type === 'document') {
    return msg.mimetype === 'application/pdf' ? 'pdf' : 'document';
  }
  return msg.type;
}

/**
 * @function triggerWebhooks
 * @description Memicu webhook yang terdaftar untuk event tertentu.
 * @param {Array<object>} webhooks - Daftar webhook dari database.
 * @param {object} data - Data yang akan dikirim ke webhook.
 */
async function triggerWebhooks(webhooks, data) {
  for (const webhook of webhooks) {
    try {
      const signature = crypto.createHmac('sha256', webhook.secret_key)
        .update(JSON.stringify(data))
        .digest('hex');

      await axios.post(webhook.url, data, {
        headers: { 'X-Webhook-Signature': signature }
      });
    } catch (error) {
      console.error(`Gagal memicu webhook ${webhook.url}:`, error.message);
    }
  }
}

/**
 * @function sendMessage
 * @description Mengirim pesan teks atau media ke nomor WhatsApp.
 * @param {string} to - Nomor tujuan.
 * @param {string} message - Isi pesan teks.
 * @param {object|null} media - Objek media (opsional).
 * @returns {Promise<object>} Objek hasil pengiriman.
 */
async function sendMessage(to, message, media = null) {
  try {
    const number = await client.getNumberId(to);
    if (!number) {
      throw new Error('Nomor tidak terdaftar di WhatsApp');
    }

    let sentMessage;
    if (media) {
      const mediaData = new MessageMedia(media.mimetype, media.data, media.filename);
      sentMessage = await client.sendMessage(number._serialized, mediaData, { caption: message });
    } else {
      sentMessage = await client.sendMessage(number._serialized, message);
    }

    const messageData = {
      message_id: sentMessage.id.id,
      from_number: sentMessage.from,
      to_number: sentMessage.to,
      message: sentMessage.body,
      media_url: media ? 'media_sent' : null, // Tidak menyimpan base64 di DB
      media_type: media ? getMediaType({ type: media.mimetype.split('/')[0], mimetype: media.mimetype }) : 'text',
      status: 'sent',
      direction: 'outgoing'
    };

    await Message.create(messageData);

    return { success: true, messageId: sentMessage.id.id };
  } catch (error) {
    console.error('Gagal mengirim pesan:', error);
    return { success: false, error: error.message };
  }
}

// Memulai klien WhatsApp
client.initialize();

module.exports = {
  client,
  sendMessage
};