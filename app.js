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
app.use(helmet());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Set view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // limit setiap IP ke 100 request per windowMs
});
app.use(limiter);

// Koneksi database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    process.exit(1);
  }
  console.log('Connected to database');
});

// Routes
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
app.use('/webhooks', require('./routes/webhooks'));

// Dashboard route
app.get('/dashboard', (req, res) => {
  res.render('dashboard');
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// SSL options (gunakan sertifikat Anda sendiri)
const sslOptions = {
  key: fs.readFileSync(path.join(__dirname, 'config/ssl/private.key')),
  cert: fs.readFileSync(path.join(__dirname, 'config/ssl/certificate.crt'))
};

// Buat server HTTPS
const httpsPort = process.env.HTTPS_PORT || 443;
https.createServer(sslOptions, app).listen(httpsPort, () => {
  console.log(`Server running on https://localhost:${httpsPort}`);
});

// Server HTTP untuk redirect ke HTTPS (opsional)
if (process.env.HTTP_PORT) {
  const http = require('http');
  const httpApp = express();
  httpApp.use((req, res) => {
    res.redirect(`https://${req.headers.host}${req.url}`);
  });
  http.createServer(httpApp).listen(process.env.HTTP_PORT, () => {
    console.log(`HTTP redirect server running on port ${process.env.HTTP_PORT}`);
  });
}

// Inisialisasi WhatsApp client
require('./services/whatsappService');