const mysql = require('mysql2');
const dotenv = require('dotenv');
const encryptionService = require('../services/encryptionService');

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Enkripsi password admin default jika masih plaintext
pool.query('SELECT * FROM users WHERE username = "admin"', (err, results) => {
  if (err) throw err;
  
  if (results.length > 0 && results[0].password === 'temp_password') {
    const hashedPassword = encryptionService.encryptPassword('admin123'); // Password default
    pool.query('UPDATE users SET password = ? WHERE username = "admin"', [hashedPassword]);
  }
});

module.exports = pool;