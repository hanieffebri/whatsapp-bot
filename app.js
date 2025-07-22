/**
 * @file app.js
 * @description File utama untuk aplikasi bot WhatsApp.
 * @requires dotenv
 * @requires express
 * @requires https
 * @requires fs
 * @requires path
 * @requires body-parser
 * @requires cors
 * @requires helmet
 * @requires express-rate-limit
 * @requires ./config/db
 * @requires ./routes/api
 * @requires ./routes/auth
 * @requires ./routes/webhooks
 * @requires ./services/whatsappService
 */

require('dotenv').config();
const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const db = require('./config/db');

// Inisialisasi Express
const app = express();

// Middleware
app.use(helmet()); // Mengamankan aplikasi dengan mengatur berbagai header HTTP
app.use(cors()); // Mengizinkan permintaan dari domain lain
app.use(bodyParser.json()); // Mem-parsing body permintaan JSON
app.use(bodyParser.urlencoded({ extended: true })); // Mem-parsing body permintaan URL-encoded
app.use(express.static(path.join(__dirname, 'public'))); // Menyajikan file statis dari direktori 'public'

// Set view engine ke EJS
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Rate limiting untuk mencegah serangan brute-force
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Batasi setiap IP hingga 100 permintaan per windowMs
  message: 'Terlalu banyak permintaan dari IP ini, silakan coba lagi setelah 15 menit'
});
app.use('/api/', limiter); // Terapkan rate limiter ke rute API

// Koneksi ke database MySQL
db.connect((err) => {
  if (err) {
    console.error('Gagal terhubung ke database:', err);
    process.exit(1); // Keluar dari proses jika koneksi gagal
  }
  console.log('Berhasil terhubung ke database');
});

// Rute aplikasi
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/webhooks', require('./routes/webhooks'));

/**
 * @route GET /dashboard
 * @description Merender halaman dasbor.
 * @param {object} req - Objek permintaan Express.
 * @param {object} res - Objek respons Express.
 */
app.get('/dashboard', (req, res) => {
  res.render('dashboard', { title: 'Dasbor Bot WhatsApp' });
});

// Middleware penanganan kesalahan (error handling)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Terjadi kesalahan pada server!');
});

// Opsi SSL untuk HTTPS
try {
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, 'config/ssl/private.key')),
    cert: fs.readFileSync(path.join(__dirname, 'config/ssl/certificate.crt'))
  };

  // Membuat dan menjalankan server HTTPS
  const httpsPort = process.env.HTTPS_PORT || 443;
  https.createServer(sslOptions, app).listen(httpsPort, () => {
    console.log(`Server berjalan di https://localhost:${httpsPort}`);
  });
} catch (error) {
  console.warn('Gagal memuat sertifikat SSL. Server HTTPS tidak akan dimulai.');
  console.warn('Pastikan file private.key dan certificate.crt ada di direktori config/ssl/');
  // Jika sertifikat SSL tidak ada, jalankan server HTTP biasa untuk pengembangan
  const httpPort = process.env.HTTP_PORT || 3000;
  app.listen(httpPort, () => {
    console.log(`Server HTTP berjalan di http://localhost:${httpPort}`);
  });
}

// Opsional: Server HTTP untuk mengalihkan ke HTTPS
if (process.env.HTTP_PORT) {
  const http = require('http');
  const httpApp = express();
  httpApp.use((req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
  });
  http.createServer(httpApp).listen(process.env.HTTP_PORT, () => {
    console.log(`Server pengalihan HTTP berjalan di port ${process.env.HTTP_PORT}`);
  });
}

// Inisialisasi klien WhatsApp
require('./services/whatsappService');