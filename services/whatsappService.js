const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const db = require('../config/db');
const Message = require('../models/Message');
const Webhook = require('../models/Webhook');

// Inisialisasi WhatsApp client
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: process.env.SESSION_FILE_PATH
  }),
  puppeteer: {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

// Event ketika QR code dihasilkan
client.on('qr', (qr) => {
  console.log('QR RECEIVED', qr);
  qrcode.generate(qr, { small: true });
});

// Event ketika client siap
client.on('ready', () => {
  console.log('Client is ready!');
});

// Event ketika menerima pesan
client.on('message', async (msg) => {
  try {
    // Simpan pesan masuk ke database
    const messageData = {
      message_id: msg.id.id,
      from_number: msg.from,
      to_number: msg.to,
      message: msg.body,
      media_url: msg.hasMedia ? await downloadMedia(msg) : null,
      media_type: msg.hasMedia ? getMediaType(msg) : null,
      status: 'delivered',
      direction: 'incoming'
    };

    await Message.create(messageData);

    // Trigger webhook untuk pesan masuk
    const webhooks = await Webhook.findByEventType('message_received');
    triggerWebhooks(webhooks, messageData);
  } catch (error) {
    console.error('Error processing incoming message:', error);
  }
});

// Event ketika pesan terkirim
client.on('message_ack', async (msg, ack) => {
  try {
    // Update status pesan di database
    await Message.updateStatus(msg.id.id, ack);
    
    // Trigger webhook untuk update status
    const webhooks = await Webhook.findByEventType('message_status');
    triggerWebhooks(webhooks, {
      message_id: msg.id.id,
      status: ack
    });
  } catch (error) {
    console.error('Error updating message status:', error);
  }
});

// Fungsi untuk mengunduh media
async function downloadMedia(msg) {
  try {
    const media = await msg.downloadMedia();
    // Di sini Anda bisa menyimpan media ke storage (S3, local, dll)
    // Untuk contoh, kita kembalikan base64-nya saja
    return media.data;
  } catch (error) {
    console.error('Error downloading media:', error);
    return null;
  }
}

// Fungsi untuk menentukan tipe media
function getMediaType(msg) {
  if (msg.type === 'image') return 'image';
  if (msg.type === 'document') {
    const fileName = msg.media.filename || '';
    return fileName.endsWith('.pdf') ? 'pdf' : 'document';
  }
  return null;
}

// Fungsi untuk trigger webhook
async function triggerWebhooks(webhooks, data) {
  const axios = require('axios');
  
  for (const webhook of webhooks) {
    try {
      await axios.post(webhook.url, data, {
        headers: {
          'X-Webhook-Signature': webhook.secret_key ? 
            require('crypto').createHmac('sha256', webhook.secret_key)
              .update(JSON.stringify(data))
              .digest('hex') : null
        }
      });
    } catch (error) {
      console.error(`Error triggering webhook ${webhook.url}:`, error.message);
    }
  }
}

// Fungsi untuk mengirim pesan
async function sendMessage(to, message, media = null) {
  try {
    // Validasi nomor WhatsApp
    const number = await client.getNumberId(to);
    if (!number) throw new Error('Nomor tidak terdaftar di WhatsApp');

    let sentMessage;
    if (media) {
      // Kirim media
      const mediaData = new MessageMedia(media.mimetype, media.data, media.filename);
      sentMessage = await client.sendMessage(number._serialized, mediaData, { caption: message });
    } else {
      // Kirim pesan teks
      sentMessage = await client.sendMessage(number._serialized, message);
    }

    // Simpan pesan keluar ke database
    const messageData = {
      message_id: sentMessage.id.id,
      from_number: sentMessage.from,
      to_number: sentMessage.to,
      message: sentMessage.body,
      media_url: media ? media.data : null,
      media_type: media ? (media.mimetype.includes('image') ? 'image' : 'pdf') : null,
      status: 'sent',
      direction: 'outgoing'
    };

    await Message.create(messageData);

    return {
      success: true,
      messageId: sentMessage.id.id
    };
  } catch (error) {
    console.error('Error sending message:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Mulai client WhatsApp
client.initialize();

module.exports = {
  client,
  sendMessage
};