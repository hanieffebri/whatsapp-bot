const db = require('../config/db');

class Message {
  // Buat pesan baru
  static async create(data) {
    const { message_id, from_number, to_number, message, media_url, media_type, status, direction } = data;
    
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO messages (message_id, from_number, to_number, message, media_url, media_type, status, direction) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [message_id, from_number, to_number, message, media_url, media_type, status, direction],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }

  // Update status pesan
  static async updateStatus(messageId, status) {
    return new Promise((resolve, reject) => {
      db.query(
        'UPDATE messages SET status = ? WHERE message_id = ?',
        [status, messageId],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }

  // Dapatkan pesan berdasarkan ID
  static async findById(id) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM messages WHERE id = ?',
        [id],
        (err, results) => {
          if (err) return reject(err);
          resolve(results[0]);
        }
      );
    });
  }

  // Dapatkan semua pesan dengan pagination
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM messages ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [limit, offset],
        (err, results) => {
          if (err) return reject(err);
          
          // Hitung total pesan untuk pagination
          db.query('SELECT COUNT(*) as total FROM messages', (err, countResults) => {
            if (err) return reject(err);
            
            resolve({
              messages: results,
              total: countResults[0].total,
              page,
              limit,
              totalPages: Math.ceil(countResults[0].total / limit)
            });
          });
        }
      );
    });
  }
}

module.exports = Message;