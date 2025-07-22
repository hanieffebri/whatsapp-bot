const db = require('../config/db');

class Webhook {
  // Cari webhook berdasarkan tipe event
  static async findByEventType(eventType) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM webhooks WHERE event_type = ? AND is_active = TRUE',
        [eventType],
        (err, results) => {
          if (err) return reject(err);
          resolve(results);
        }
      );
    });
  }
}

module.exports = Webhook;
