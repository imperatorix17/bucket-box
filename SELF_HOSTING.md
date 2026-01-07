# CloudVault Self-Hosting Guide

This guide explains how to deploy CloudVault on your own server (VPS, NAS, or local machine).

## Prerequisites

- Node.js 18+ installed
- A server with at least 512MB RAM
- Basic knowledge of Linux/terminal commands

## Project Structure

```
cloudvault/
├── src/                    # Frontend React app
├── server/                 # Backend Node.js server
│   ├── index.js           # Main server file
│   ├── database.js        # SQLite database
│   ├── storage.js         # Filesystem management
│   └── package.json       # Server dependencies
├── dist/                   # Built frontend (after build)
└── SELF_HOSTING.md        # This file
```

## Quick Start

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url> cloudvault
cd cloudvault

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Configure Backend

```bash
# Copy environment example
cp server/.env.example server/.env

# Edit configuration
nano server/.env
```

**server/.env configuration:**
```env
PORT=3001
STORAGE_PATH=./data/storage
DATABASE_PATH=./data/database.sqlite
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_secure_password
```

### 3. Build Frontend

```bash
# Create frontend .env
cp .env.example .env

# Edit to point to your server
nano .env
```

**.env configuration:**
```env
VITE_API_URL=https://your-domain.com/api
VITE_AUTH_USERNAME=your_username
VITE_AUTH_PASSWORD=your_secure_password
```

```bash
# Build the frontend
npm run build
```

### 4. Start the Server

```bash
cd server
npm start
```

The server will start on port 3001 (or your configured port).

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the server with PM2
cd server
pm2 start index.js --name cloudvault

# Save PM2 configuration
pm2 save

# Enable auto-start on boot
pm2 startup
```

### Using Systemd

Create `/etc/systemd/system/cloudvault.service`:

```ini
[Unit]
Description=CloudVault Storage Server
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/cloudvault/server
ExecStart=/usr/bin/node index.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable cloudvault
sudo systemctl start cloudvault
```

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    location / {
        root /path/to/cloudvault/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Increase timeouts for file uploads
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
        proxy_read_timeout 300;
        
        # Increase max body size for uploads
        client_max_body_size 100M;
    }
}
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Storage Management

### File Storage Location

Files are stored in `STORAGE_PATH` (default: `./data/storage`):

```
data/
├── storage/
│   ├── bucket-name-1/
│   │   ├── file1.jpg
│   │   └── folder/
│   │       └── file2.pdf
│   └── bucket-name-2/
│       └── ...
└── database.sqlite
```

### Backup

```bash
# Backup everything
tar -czf cloudvault-backup-$(date +%Y%m%d).tar.gz data/

# Backup only database
cp data/database.sqlite data/database.sqlite.backup
```

### Restore

```bash
# Stop the server first
pm2 stop cloudvault

# Restore from backup
tar -xzf cloudvault-backup-YYYYMMDD.tar.gz

# Restart
pm2 start cloudvault
```

## Troubleshooting

### Server won't start
- Check if port is already in use: `lsof -i :3001`
- Verify Node.js version: `node --version` (needs 18+)
- Check logs: `pm2 logs cloudvault`

### Upload fails
- Check Nginx `client_max_body_size`
- Verify storage path permissions
- Check disk space: `df -h`

### Database errors
- Ensure write permissions on data directory
- Try deleting database and restarting (data will be lost)

## Security Recommendations

1. **Change default credentials** immediately
2. **Use HTTPS** with a valid SSL certificate
3. **Firewall**: Only expose ports 80/443
4. **Regular backups** of the data directory
5. **Keep Node.js updated** for security patches

## API Reference

### Authentication
All endpoints (except public file access) require Basic Auth header:
```
Authorization: Basic base64(username:password)
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Verify credentials |
| GET | /api/buckets | List all buckets |
| POST | /api/buckets | Create bucket |
| DELETE | /api/buckets/:id | Delete bucket |
| GET | /api/buckets/:id/items | List items in bucket |
| POST | /api/buckets/:id/folders | Create folder |
| POST | /api/buckets/:id/upload | Upload file |
| DELETE | /api/items/:id | Delete item |
| GET | /api/files/* | Access file (public for public buckets) |

## Support

For issues, please open a GitHub issue or contact the maintainer.
