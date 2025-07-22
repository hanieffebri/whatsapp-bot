# Dokumentasi Proyek Bot WhatsApp

Selamat datang di dokumentasi proyek Bot WhatsApp. Dokumen ini akan memandu Anda melalui arsitektur, API, dan cara penggunaan aplikasi ini.

## 1. Arsitektur Proyek

Aplikasi ini dibangun dengan Node.js dan menggunakan pola desain Model-View-Controller (MVC) untuk memisahkan logika bisnis, data, dan antarmuka pengguna.

### Struktur Direktori

Berikut adalah penjelasan singkat tentang struktur direktori utama:

- **`/config`**: Berisi file konfigurasi, seperti koneksi database (`db.js`) dan sertifikat SSL.
- **`/controllers`**: Berisi file-file yang bertanggung jawab untuk menangani logika bisnis dan permintaan dari klien.
- **`/middlewares`**: Berisi middleware Express, seperti untuk autentikasi dan pembatasan laju (rate limiting).
- **`/models`**: Berisi model data yang merepresentasikan tabel di database dan menyediakan fungsi untuk berinteraksi dengan tabel tersebut.
- **`/public`**: Berisi file-file statis, seperti CSS dan JavaScript untuk antarmuka pengguna.
- **`/routes`**: Berisi file-file yang mendefinisikan rute API dan menghubungkannya dengan controller yang sesuai.
- **`/services`**: Berisi layanan pihak ketiga atau logika yang lebih kompleks, seperti interaksi dengan WhatsApp (`whatsappService.js`) dan enkripsi.
- **`/views`**: Berisi file-file template EJS untuk merender halaman web, seperti dasbor.
- **`app.js`**: File utama yang menginisialisasi aplikasi Express, middleware, dan server.
- **`package.json`**: Berisi daftar dependensi proyek dan skrip yang dapat dijalankan.
- **`.env`**: File untuk menyimpan variabel lingkungan, seperti kredensial database dan kunci rahasia.

## 2. Dokumentasi API

API ini memungkinkan Anda untuk mengirim pesan, memeriksa status, dan melihat riwayat pesan melalui permintaan HTTP. Semua endpoint API memerlukan autentikasi menggunakan token JWT.

### Autentikasi

Sebelum menggunakan API, Anda harus mendapatkan token autentikasi dengan melakukan login.

#### `POST /auth/login`

Mendapatkan token JWT untuk autentikasi.

- **Request Body**:
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **Contoh Permintaan**:
  ```bash
  curl -X POST https://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
  ```
- **Contoh Respons Sukses**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Kemungkinan Kesalahan**:
  - `401 Unauthorized`: Username atau password salah.

### Pesan

Endpoint untuk mengelola pesan.

#### `POST /api/messages`

Mengirim pesan teks ke nomor WhatsApp.

- **Headers**:
  - `Authorization`: `Bearer <token>`
- **Request Body**:
  ```json
  {
    "to": "6281234567890",
    "message": "Halo dari API"
  }
  ```
- **Contoh Permintaan**:
  ```bash
  curl -X POST https://localhost/api/messages \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"6281234567890","message":"Halo dari API"}'
  ```
- **Contoh Respons Sukses**:
  ```json
  {
    "success": true,
    "messageId": "true_6281234567890@c.us_3EB0..."
  }
  ```
- **Kemungkinan Kesalahan**:
  - `400 Bad Request`: Nomor tujuan atau pesan tidak ada.
  - `401 Unauthorized`: Token tidak valid atau tidak ada.

#### `POST /api/messages/media`

Mengirim pesan dengan media (gambar, PDF).

- **Headers**:
  - `Authorization`: `Bearer <token>`
- **Request Body**:
  ```json
  {
    "to": "6281234567890",
    "message": "Lihat gambar ini",
    "media": {
      "data": "<base64_encoded_file>",
      "mimetype": "image/jpeg",
      "filename": "foto.jpg"
    }
  }
  ```
- **Contoh Permintaan**:
  ```bash
  curl -X POST https://localhost/api/messages/media \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"to":"6281234567890","message":"Lihat gambar ini","media":{"data":"...","mimetype":"image/jpeg","filename":"foto.jpg"}}'
  ```
- **Contoh Respons Sukses**:
  ```json
  {
    "success": true,
    "messageId": "true_6281234567890@c.us_3EB0..."
  }
  ```
- **Kemungkinan Kesalahan**:
  - `400 Bad Request`: Data media tidak lengkap.
  - `401 Unauthorized`: Token tidak valid atau tidak ada.

#### `GET /api/messages/:messageId/status`

Mendapatkan status pesan berdasarkan ID pesan.

- **Headers**:
  - `Authorization`: `Bearer <token>`
- **URL Parameters**:
  - `messageId`: ID pesan yang didapat saat mengirim.
- **Contoh Permintaan**:
  ```bash
  curl -X GET https://localhost/api/messages/true_6281234567890@c.us_3EB0.../status \
  -H "Authorization: Bearer <token>"
  ```
- **Contoh Respons Sukses**:
  ```json
  {
    "status": "delivered"
  }
  ```
- **Kemungkinan Kesalahan**:
  - `404 Not Found`: Pesan tidak ditemukan.
  - `401 Unauthorized`: Token tidak valid atau tidak ada.

#### `GET /api/messages`

Mendapatkan riwayat pesan dengan paginasi.

- **Headers**:
  - `Authorization`: `Bearer <token>`
- **Query Parameters**:
  - `page` (opsional, default: 1): Nomor halaman.
  - `limit` (opsional, default: 10): Jumlah pesan per halaman.
- **Contoh Permintaan**:
  ```bash
  curl -X GET "https://localhost/api/messages?page=1&limit=5" \
  -H "Authorization: Bearer <token>"
  ```
- **Contoh Respons Sukses**:
  ```json
  [
    {
      "id": 1,
      "message_id": "true_6281234567890@c.us_3EB0...",
      "from_number": "6281234567890",
      "to_number": "6289876543210",
      "message": "Halo",
      "status": "sent",
      "direction": "outgoing",
      "created_at": "2023-10-27T10:00:00.000Z"
    }
  ]
  ```
- **Kemungkinan Kesalahan**:
  - `401 Unauthorized`: Token tidak valid atau tidak ada.

## 3. Panduan Penggunaan

Berikut adalah panduan langkah demi langkah untuk menjalankan dan menggunakan aplikasi ini.

### Menjalankan Aplikasi

1. **Instal Dependensi**:
   ```bash
   npm install
   ```
2. **Konfigurasi Lingkungan**:
   - Salin file `.env.example` menjadi `.env`.
   - Isi variabel lingkungan yang diperlukan, seperti `DB_HOST`, `DB_USER`, `DB_PASSWORD`, dan `DB_NAME`.
3. **Jalankan Aplikasi**:
   ```bash
   node app.js
   ```
   Aplikasi akan berjalan di `https://localhost`.

### Autentikasi WhatsApp

Saat pertama kali menjalankan aplikasi, Anda perlu mengautentikasi akun WhatsApp Anda.

1. **Pindai Kode QR**:
   - Setelah menjalankan `node app.js`, sebuah kode QR akan muncul di terminal.
   - Buka WhatsApp di ponsel Anda, pergi ke **Pengaturan > Perangkat Tertaut > Tautkan Perangkat**, lalu pindai kode QR tersebut.
2. **Sesi Tersimpan**:
   - Setelah berhasil, sesi Anda akan disimpan secara lokal. Anda tidak perlu memindai ulang setiap kali memulai ulang aplikasi, kecuali jika Anda keluar dari sesi.

### Menggunakan API

Setelah aplikasi berjalan dan terautentikasi, Anda dapat menggunakan API.

1. **Dapatkan Token**:
   - Gunakan endpoint `POST /auth/login` untuk mendapatkan token JWT.
2. **Kirim Pesan**:
   - Gunakan endpoint `POST /api/messages` untuk mengirim pesan teks atau `POST /api/messages/media` untuk mengirim pesan dengan media.
   - Sertakan token JWT di header `Authorization`.
3. **Periksa Status**:
   - Gunakan endpoint `GET /api/messages/:messageId/status` untuk memeriksa status pengiriman pesan.

## 4. Konfigurasi dan Kustomisasi

Aplikasi ini dapat dikonfigurasi melalui variabel lingkungan di file `.env`.

### Variabel Lingkungan

- `DB_HOST`: Hostname dari server database MySQL Anda.
- `DB_USER`: Nama pengguna untuk koneksi database.
- `DB_PASSWORD`: Kata sandi untuk koneksi database.
- `DB_NAME`: Nama database yang digunakan.
- `JWT_SECRET`: Kunci rahasia untuk menandatangani token JWT. Ganti dengan string acak yang kuat.
- `JWT_EXPIRES_IN`: Waktu kedaluwarsa token JWT (misalnya, `1h`, `7d`).
- `SESSION_FILE_PATH`: Path untuk menyimpan file sesi WhatsApp.
- `HTTPS_PORT`: Port untuk server HTTPS (default: 443).
- `HTTP_PORT`: Port untuk server HTTP yang akan mengalihkan ke HTTPS (opsional).

### Sertifikat SSL

Untuk menjalankan server dengan HTTPS, Anda memerlukan sertifikat SSL.

- Letakkan file kunci privat Anda di `config/ssl/private.key`.
- Letakkan file sertifikat Anda di `config/ssl/certificate.crt`.

Untuk pengembangan, Anda dapat membuat sertifikat self-signed.
