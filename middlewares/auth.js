const jwt = require('jsonwebtoken');
const encryptionService = require('../services/encryptionService');
require('dotenv').config();

module.exports = async (req, res, next) => {
  try {
    // Dapatkan token dari header
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Akses ditolak. Token diperlukan.' });
    }

    // Verifikasi token
    const decoded = encryptionService.verifyToken(token);
    
    // Tambahkan user ke request
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token tidak valid.' });
  }
};