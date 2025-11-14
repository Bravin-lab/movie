const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const { generateId } = require('./utils');

const app = express();
const PORT = process.env.PORT || 3001;
const DOWNLOAD_DIR = path.join(__dirname, 'downloads');

// Ensure download directory exists
fs.ensureDirSync(DOWNLOAD_DIR);

// Initialize WebTorrent client with dynamic import
let client;
(async () => {
  const { default: WebTorrent } = await import('webtorrent');
  client = new WebTorrent();
})();

// Store active downloads
const activeDownloads = new Map();

// Middleware
app.use(cors());
app.use(express.json());



// Clean up old files (older than 24 hours)
async function cleanupOldFiles() {
  try {
    const files = await fs.readdir(DOWNLOAD_DIR);
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const file of files) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtime.getTime() > maxAge) {
        await fs.remove(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// Start download endpoint
app.post('/api/download/start', async (req, res) => {
  try {
    const { magnetUri, fileName } = req.body;

    if (!magnetUri) {
      return res.status(400).json({ error: 'Magnet URI is required' });
    }

    if (!client) {
      return res.status(503).json({ error: 'Torrent client not ready' });
    }

    const downloadId = generateId();

    // Add torrent
    client.add(magnetUri, { path: DOWNLOAD_DIR }, (torrent) => {
      console.log(`Started downloading: ${torrent.name}`);

      const downloadInfo = {
        id: downloadId,
        torrent: torrent,
        fileName: fileName || torrent.name,
        startTime: Date.now(),
        status: 'downloading'
      };

      activeDownloads.set(downloadId, downloadInfo);

      // Monitor progress
      torrent.on('download', (bytes) => {
        downloadInfo.progress = (torrent.progress * 100).toFixed(2);
        downloadInfo.speed = torrent.downloadSpeed;
        downloadInfo.peers = torrent.numPeers;
      });

      torrent.on('done', () => {
        console.log(`Download completed: ${torrent.name}`);
        downloadInfo.status = 'completed';

        // Schedule cleanup after 24 hours
        setTimeout(async () => {
          try {
            torrent.destroy();
            activeDownloads.delete(downloadId);
            console.log(`Cleaned up download: ${downloadId}`);
          } catch (error) {
            console.error('Cleanup error:', error);
          }
        }, 24 * 60 * 60 * 1000); // 24 hours
      });

      torrent.on('error', (error) => {
        console.error('Torrent error:', error);
        downloadInfo.status = 'error';
        downloadInfo.error = error.message;
      });

      res.json({
        downloadId,
        message: 'Download started',
        torrentName: torrent.name
      });
    });

  } catch (error) {
    console.error('Download start error:', error);
    res.status(500).json({ error: 'Failed to start download' });
  }
});

// Get download status
app.get('/api/download/status/:downloadId', (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download) {
    return res.status(404).json({ error: 'Download not found' });
  }

  const torrent = download.torrent;
  res.json({
    id: downloadId,
    fileName: download.fileName,
    status: download.status,
    progress: download.progress || 0,
    speed: download.speed || 0,
    peers: download.peers || 0,
    size: torrent.length,
    downloaded: torrent.downloaded,
    timeRemaining: torrent.timeRemaining,
    error: download.error
  });
});

// Download file endpoint
app.get('/api/download/file/:downloadId', async (req, res) => {
  const { downloadId } = req.params;
  const download = activeDownloads.get(downloadId);

  if (!download || download.status !== 'completed') {
    return res.status(404).json({ error: 'Download not ready or not found' });
  }

  const torrent = download.torrent;

  // Find the largest file (usually the movie file)
  let targetFile = torrent.files[0];
  for (const file of torrent.files) {
    if (file.length > targetFile.length) {
      targetFile = file;
    }
  }

  const filePath = path.join(DOWNLOAD_DIR, targetFile.path);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';

  // Set headers for download
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Content-Disposition', `attachment; filename="${download.fileName || targetFile.name}"`);
  res.setHeader('Content-Length', targetFile.length);

  // Stream the file
  const stream = targetFile.createReadStream();
  stream.pipe(res);

  // Clean up after download completes
  stream.on('end', () => {
    console.log(`File served and scheduled for cleanup: ${downloadId}`);
    // Schedule cleanup after 1 hour (give time for download to complete)
    setTimeout(async () => {
      try {
        torrent.destroy();
        activeDownloads.delete(downloadId);
        console.log(`Cleaned up download: ${downloadId}`);
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    }, 60 * 60 * 1000); // 1 hour
  });

  stream.on('error', (error) => {
    console.error('Stream error:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  });
});

// List active downloads
app.get('/api/downloads', (req, res) => {
  const downloads = Array.from(activeDownloads.values()).map(download => ({
    id: download.id,
    fileName: download.fileName,
    status: download.status,
    progress: download.progress || 0,
    speed: download.speed || 0,
    peers: download.peers || 0
  }));

  res.json({ downloads });
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    activeDownloads: activeDownloads.size,
    clientReady: !!client
  });
});

// Start cleanup interval (every hour)
setInterval(cleanupOldFiles, 60 * 60 * 1000);

// Start server
app.listen(PORT, () => {
  console.log(`Torrent downloader service running on port ${PORT}`);
  console.log(`Download directory: ${DOWNLOAD_DIR}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  if (client) {
    client.destroy(() => {
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
