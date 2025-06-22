Prasyarat
Ubuntu Server (Saya asumsikan Ubuntu 22.04 LTS)

Node.js (v18 atau lebih baru)

MySQL

Redis

Nginx

Certbot (untuk SSL Let's Encrypt)

**Langkah 1: Persiapan Server**
#Update sistem

sudo apt update && sudo apt upgrade -y

#Install Node.js dan npm

curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

#Install MySQL

sudo apt install -y mysql-server
sudo mysql_secure_installation

#Install Redis

sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

#Install Nginx

sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

#Install Certbot untuk SSL

sudo apt install -y certbot python3-certbot-nginx

**Langkah 2: Setup Database MySQL**
#Login ke MySQL:

sudo mysql -u root -p

#Buat database dan user:

CREATE DATABASE whatsapp_bot;
CREATE USER 'whatsapp_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password_kuat_disini';
GRANT ALL PRIVILEGES ON whatsapp_bot.* TO 'whatsapp_user'@'localhost';
FLUSH PRIVILEGES;

#Buat tabel-tabel yang diperlukan:

USE whatsapp_bot;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    message_id VARCHAR(255) NOT NULL,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    content TEXT,
    media_url VARCHAR(255),
    media_type ENUM('image', 'document', 'audio', 'video', 'other'),
    status ENUM('pending', 'sent', 'delivered', 'read', 'failed'),
    direction ENUM('inbound', 'outbound') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX (from_number),
    INDEX (to_number)
);

CREATE TABLE webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    url VARCHAR(255) NOT NULL,
    events TEXT NOT NULL, -- JSON array of events to listen for
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

**Langkah 3: Setup Backend*
mkdir -p whatsapp-bot/backend
cd whatsapp-bot/backend
npm init -y

**Langkah 5: Konfigurasi Nginx dan SSL**

#Buat file konfigurasi Nginx

sudo nano /etc/nginx/sites-available/whatsapp-bot

isi dengan :

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Frontend
    location / {
        root /path/to/whatsapp-bot/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for real-time updates
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    access_log /var/log/nginx/whatsapp-bot.access.log;
    error_log /var/log/nginx/whatsapp-bot.error.log;
}

#Aktifkan konfigurasi dan dapatkan SSL

sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Dapatkan sertifikat SSL
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
sudo systemctl reload nginx

**Langkah 6: Deploy Aplikasi**

#Build frontend
cd whatsapp-bot/frontend
npm run build

#Jalankan backend (gunakan PM2 untuk production)

cd whatsapp-bot/backend
npm install -g pm2
pm2 start server.js --name whatsapp-bot
pm2 save
pm2 startup