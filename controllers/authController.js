const db = require('../config/db');
const encryptionService = require('../services/encryptionService');

module.exports = {
  // Login user
  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password diperlukan' });
      }

      // Cari user di database
      db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Kesalahan server' });
        }
        
        if (results.length === 0) {
          return res.status(401).json({ error: 'Kredensial tidak valid' });
        }
        
        const user = results[0];
        
        // Bandingkan password
        const isMatch = await encryptionService.comparePassword(password, user.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Kredensial tidak valid' });
        }
        
        // Generate token
        const token = encryptionService.generateToken(user.id);
        
        res.json({
          success: true,
          token
        });
      });
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Kesalahan server' });
    }
  },

  // Dapatkan user yang sedang login
  getMe: async (req, res) => {
    try {
      const userId = req.user.id;
      
      db.query('SELECT id, username, created_at FROM users WHERE id = ?', [userId], (err, results) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Kesalahan server' });
        }
        
        if (results.length === 0) {
          return res.status(404).json({ error: 'User tidak ditemukan' });
        }
        
        res.json(results[0]);
      });
    } catch (error) {
      console.error('Error getting user:', error);
      res.status(500).json({ error: 'Kesalahan server' });
    }
  }
};