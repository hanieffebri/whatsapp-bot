-- Tabel untuk Pengguna (Users)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel untuk Pesan (Messages)
CREATE TABLE messages (
    message_id INT AUTO_INCREMENT PRIMARY KEY,
    from_number VARCHAR(20) NOT NULL,
    to_number VARCHAR(20) NOT NULL,
    message TEXT,
    media_url VARCHAR(2083),
    media_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'sent',
    direction VARCHAR(10) DEFAULT 'outbound',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel untuk Webhooks
CREATE TABLE webhooks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    url VARCHAR(2083) NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    secret_key VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Menambahkan beberapa index untuk optimasi query
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_messages_from_number ON messages(from_number);
CREATE INDEX idx_messages_to_number ON messages(to_number);
CREATE INDEX idx_webhooks_event_type ON webhooks(event_type);
