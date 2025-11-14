# VPS Setup Guide for Torrent Downloader Service

This guide explains how to host the torrent downloader service on a VPS and connect it to your Vercel-deployed Next.js application.

## Prerequisites

- A VPS server (Ubuntu/Debian recommended)
- Node.js installed on VPS
- Domain name or static IP for the VPS
- Vercel account with your Next.js app deployed

## Step 1: Prepare the Torrent Service for Deployment

The torrent downloader service is located in the `torrent-downloader-service/` directory.

### 1.1 Install Dependencies on VPS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (if not already installed)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx (optional, for reverse proxy)
sudo apt install nginx -y
```

### 1.2 Upload Service Files to VPS

Upload the entire `torrent-downloader-service/` directory to your VPS:

```bash
# On your local machine
scp -r torrent-downloader-service/ user@your-vps-ip:/home/user/

# Or use git clone if you have the repo on GitHub
git clone https://github.com/your-repo.git
cd your-repo/torrent-downloader-service
```

### 1.3 Install Dependencies and Configure

```bash
cd torrent-downloader-service
npm install

# Create downloads directory
mkdir downloads
```

## Step 2: Configure Firewall and Security

### 2.1 Open Ports

```bash
# Allow port 3001 (or your chosen port)
sudo ufw allow 3001
sudo ufw enable
```

### 2.2 Set Up Nginx Reverse Proxy (Optional but Recommended)

Create nginx config:

```bash
sudo nano /etc/nginx/sites-available/torrent-service
```

Add this configuration:

```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/torrent-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 3: Start the Service

### 3.1 Using PM2

```bash
# Start the service
pm2 start server.js --name "torrent-service"

# Save PM2 configuration
pm2 save

# Set up PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

### 3.2 Alternative: Using systemd

Create a service file:

```bash
sudo nano /etc/systemd/system/torrent-service.service
```

Add:

```
[Unit]
Description=Torrent Downloader Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/home/your-user/torrent-downloader-service
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable torrent-service
sudo systemctl start torrent-service
sudo systemctl status torrent-service
```

## Step 4: Set Up SSL (Recommended)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com
```

## Step 5: Connect to Vercel

### 5.1 Set Environment Variable in Vercel

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add a new variable:
   - Name: `TORRENT_SERVICE_URL`
   - Value: `https://your-domain.com` (or `http://your-vps-ip:3001` if no domain)
   - Environment: Production (and Preview/Staging if needed)

### 5.2 Redeploy Your Vercel App

After setting the environment variable, redeploy your Next.js app:

```bash
# If using Vercel CLI
vercel --prod
```

## Step 6: Test the Connection

### 6.1 Test Torrent Service Directly

```bash
curl http://your-domain.com/health
# Should return: {"status":"ok","activeDownloads":0}
```

### 6.2 Test from Vercel App

Make a request to your download API endpoint and check if it communicates with the VPS service.

## Step 7: Set Up Automated Cleanup

### 7.1 Cron Job for Cleanup

```bash
# Edit crontab
crontab -e

# Add this line to run cleanup every hour
0 * * * * cd /home/your-user/torrent-downloader-service && node cleanup.js
```

## Monitoring and Maintenance

### Check Service Status

```bash
# PM2
pm2 status

# systemd
sudo systemctl status torrent-service
```

### View Logs

```bash
# PM2 logs
pm2 logs torrent-service

# systemd logs
sudo journalctl -u torrent-service -f
```

### Restart Service

```bash
# PM2
pm2 restart torrent-service

# systemd
sudo systemctl restart torrent-service
```

## Security Considerations

1. **Firewall**: Only open necessary ports (80, 443, 22)
2. **SSL**: Always use HTTPS
3. **Rate Limiting**: Consider adding rate limiting to prevent abuse
4. **Authentication**: Add API key authentication if needed
5. **Storage**: Monitor disk usage as torrent files can be large

## Troubleshooting

### Common Issues

1. **Port not accessible**: Check firewall and nginx configuration
2. **Service not starting**: Check logs for errors
3. **Connection refused from Vercel**: Verify TORRENT_SERVICE_URL and CORS settings
4. **Out of disk space**: Monitor storage and adjust cleanup settings

### Debug Commands

```bash
# Check if service is running
netstat -tlnp | grep 3001

# Test API endpoints
curl -X POST http://localhost:3001/api/download/start \
  -H "Content-Type: application/json" \
  -d '{"magnetUri":"magnet:?xt=urn:btih:..."}'
```

## Cost Considerations

- VPS costs vary by provider (DigitalOcean, Linode, AWS, etc.)
- Storage costs for downloaded files
- Bandwidth usage for torrent downloads

## Alternative Deployment Options

- **Docker**: Containerize the service for easier deployment
- **Heroku**: For simpler deployment (though less control)
- **AWS Lambda**: For serverless deployment (may have limitations with torrents)

---

This setup provides a robust, production-ready torrent downloading service that integrates seamlessly with your Vercel-hosted Next.js application.
