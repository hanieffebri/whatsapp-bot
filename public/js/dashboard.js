document.addEventListener('DOMContentLoaded', function() {
  // Variabel global
  let currentPage = 1;
  const limit = 10;
  let token = localStorage.getItem('whatsapp_token');
  
  // Cek autentikasi
  if (!token) {
    window.location.href = '/auth/login';
    return;
  }
  
  // Inisialisasi
  initConnectionStatus();
  loadMessages(currentPage);
  setupEventListeners();
  
  // Fungsi untuk inisialisasi status koneksi
  function initConnectionStatus() {
    fetch('/api/whatsapp/status', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      updateConnectionStatus(data.status);
    })
    .catch(error => {
      console.error('Error getting connection status:', error);
    });
  }
  
  // Fungsi untuk memuat pesan
  function loadMessages(page) {
    fetch(`/api/messages?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      renderMessages(data.messages);
      renderPagination(data.totalPages, page);
    })
    .catch(error => {
      console.error('Error loading messages:', error);
    });
  }
  
  // Fungsi untuk render pesan ke tabel
  function renderMessages(messages) {
    const tbody = document.querySelector('#messages-table tbody');
    tbody.innerHTML = '';
    
    messages.forEach(msg => {
      const tr = document.createElement('tr');
      
      // Tentukan arah pesan
      const direction = msg.direction === 'incoming' ? 'From' : 'To';
      const number = direction === 'From' ? msg.from_number : msg.to_number;
      
      tr.innerHTML = `
        <td>${direction}: ${number}</td>
        <td>${msg.direction === 'incoming' ? 'You' : number}</td>
        <td>${msg.message || (msg.media_type ? `[${msg.media_type.toUpperCase()}]` : '')}</td>
        <td><span class="badge ${getStatusBadgeClass(msg.status)}">${msg.status}</span></td>
        <td>${new Date(msg.created_at).toLocaleString()}</td>
      `;
      
      tbody.appendChild(tr);
    });
  }
  
  // Fungsi untuk render pagination
  function renderPagination(totalPages, currentPage) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    
    // Tombol Previous
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
    prevLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        loadMessages(currentPage - 1);
      }
    });
    pagination.appendChild(prevLi);
    
    // Nomor halaman
    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === currentPage ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', (e) => {
        e.preventDefault();
        loadMessages(i);
      });
      pagination.appendChild(li);
    }
    
    // Tombol Next
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
    nextLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        loadMessages(currentPage + 1);
      }
    });
    pagination.appendChild(nextLi);
  }
  
  // Fungsi untuk mendapatkan class badge berdasarkan status
  function getStatusBadgeClass(status) {
    switch (status) {
      case 'sent': return 'bg-primary';
      case 'delivered': return 'bg-info';
      case 'read': return 'bg-success';
      case 'failed': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
  
  // Fungsi untuk update status koneksi
  function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    statusElement.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    
    if (status === 'connected') {
      statusElement.className = 'navbar-text me-3 text-success';
      document.getElementById('connect-btn').style.display = 'none';
      document.getElementById('disconnect-btn').style.display = 'inline-block';
    } else {
      statusElement.className = 'navbar-text me-3 text-danger';
      document.getElementById('connect-btn').style.display = 'inline-block';
      document.getElementById('disconnect-btn').style.display = 'none';
      
      // Tampilkan QR code jika perlu
      if (status === 'waiting_for_qr') {
        fetch('/api/whatsapp/qr', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        .then(response => response.json())
        .then(data => {
          QRCode.toCanvas(document.getElementById('qrcode'), data.qr, {
            width: 200,
            margin: 2
          }, function(error) {
            if (error) console.error('Error generating QR code:', error);
          });
        });
      }
    }
  }
  
  // Fungsi untuk setup event listeners
  function setupEventListeners() {
    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('whatsapp_token');
      window.location.href = '/auth/login';
    });
    
    // Connect WhatsApp
    document.getElementById('connect-btn').addEventListener('click', () => {
      fetch('/api/whatsapp/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          initConnectionStatus();
        }
      })
      .catch(error => {
        console.error('Error connecting WhatsApp:', error);
      });
    });
    
    // Disconnect WhatsApp
    document.getElementById('disconnect-btn').addEventListener('click', () => {
      fetch('/api/whatsapp/disconnect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          initConnectionStatus();
        }
      })
      .catch(error => {
        console.error('Error disconnecting WhatsApp:', error);
      });
    });
    
    // Kirim pesan
    document.getElementById('send-message-form').addEventListener('submit', (e) => {
      e.preventDefault();
      
      const recipient = document.getElementById('recipient').value;
      const message = document.getElementById('message').value;
      const mediaFile = document.getElementById('media').files[0];
      
      if (!recipient || !message) {
        alert('Recipient and message are required');
        return;
      }
      
      if (mediaFile) {
        // Kirim media
        const reader = new FileReader();
        reader.onload = function(e) {
          const mediaData = {
            data: e.target.result.split(',')[1], // Ambil base64 tanpa prefix
            mimetype: mediaFile.type,
            filename: mediaFile.name
          };
          
          sendMessage(recipient, message, mediaData);
        };
        reader.readAsDataURL(mediaFile);
      } else {
        // Kirim pesan teks biasa
        sendMessage(recipient, message);
      }
    });
  }
  
  // Fungsi untuk mengirim pesan
  function sendMessage(to, message, media = null) {
    const endpoint = media ? '/api/messages/media' : '/api/messages';
    const body = media ? { to, message, media } : { to, message };
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Message sent successfully');
        document.getElementById('send-message-form').reset();
        loadMessages(currentPage);
      } else {
        alert(`Failed to send message: ${data.error}`);
      }
    })
    .catch(error => {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    });
  }
  
  // Setup WebSocket untuk update realtime
  setupWebSocket();
  
  function setupWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/realtime`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      ws.send(JSON.stringify({ token }));
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'connection_status') {
        updateConnectionStatus(data.status);
      } else if (data.type === 'new_message') {
        loadMessages(currentPage);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      // Coba reconnect setelah 5 detik
      setTimeout(setupWebSocket, 5000);
    };
  }
});