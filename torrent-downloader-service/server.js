const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const { generateId } = require('./utils');
const axios = require('axios');
const FormData = require('form-data');
const mtproto = require('./telegram_mtproto');

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

// Telegram integration
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // channel or chat id
const TELEGRAM_INDEX_FILE = path.join(DOWNLOAD_DIR, 'telegram_index.json');
// How long to keep local file after a successful upload (default: 1 hour)
const LOCAL_DELETE_AFTER_UPLOAD_MS = process.env.LOCAL_DELETE_AFTER_UPLOAD_MS ? Number(process.env.LOCAL_DELETE_AFTER_UPLOAD_MS) : 60 * 60 * 1000;

function loadTelegramIndex() {
  try {
    if (fs.existsSync(TELEGRAM_INDEX_FILE)) {
      return fs.readJsonSync(TELEGRAM_INDEX_FILE);
    }
  } catch (e) {
    console.error('Failed to load telegram index:', e);
  }
  return {};
}

function saveTelegramIndex(index) {
  try {
    fs.writeJsonSync(TELEGRAM_INDEX_FILE, index, { spaces: 2 });
  } catch (e) {
    console.error('Failed to save telegram index:', e);
  }
}

const telegramIndex = loadTelegramIndex();

async function uploadFileToTelegram(filePath, caption) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('Telegram bot token or chat id not configured');
  }

  const form = new FormData();
  form.append('chat_id', TELEGRAM_CHAT_ID);
  form.append('document', fs.createReadStream(filePath));
  if (caption) form.append('caption', caption);

  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument`;

  const resp = await axios.post(url, form, {
    headers: form.getHeaders(),
    maxContentLength: Infinity,
    maxBodyLength: Infinity
  });

  if (resp.data && resp.data.ok && resp.data.result && resp.data.result.document) {
    return resp.data.result.document.file_id;
  }

  throw new Error('Telegram upload failed');
}

async function getTelegramFileUrl(fileId) {
  if (!TELEGRAM_BOT_TOKEN) throw new Error('Telegram bot token not configured');
  const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`;
  const resp = await axios.get(url);
  if (resp.data && resp.data.ok && resp.data.result && resp.data.result.file_path) {
    return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${resp.data.result.file_path}`;
  }
  throw new Error('Failed to get telegram file URL');
}

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
    const torrentUri = typeof magnetUri === 'string' ? magnetUri.trim() : '';

    if (!torrentUri) {
      return res.status(400).json({ error: 'Magnet URI is required' });
    }

    if (!/^magnet:\?/i.test(torrentUri)) {
      return res.status(400).json({ error: 'Invalid magnet URI format' });
    }

    try {
      const magnetMatch = torrentUri.match(/xt=urn:btih:([a-zA-Z0-9]{32,40})/i);
      if (!magnetMatch) {
        throw new Error('Missing btih info hash');
      }
    } catch (parseError) {
      console.error('Invalid torrent identifier:', parseError.message || parseError);
      return res.status(400).json({ error: `Invalid torrent identifier: ${parseError.message || 'bad magnet'}` });
    }

    if (!client) {
      return res.status(503).json({ error: 'Torrent client not ready' });
    }

    // Check Telegram index first to avoid re-downloading (supports bot API and MTProto entries)
    const telegramEntry = telegramIndex[torrentUri] || Object.values(telegramIndex).find(e => e.file_name === fileName);
    if (telegramEntry) {
      const downloadId = generateId();

      if (telegramEntry.source === 'mtproto') {
        const downloadInfo = {
          id: downloadId,
          source: 'mtproto',
          mtprotoPeer: telegramEntry.peer,
          mtprotoMessageId: telegramEntry.message_id,
          fileName: telegramEntry.file_name || fileName,
          size: telegramEntry.size,
          startTime: Date.now(),
          status: 'completed'
        };
        activeDownloads.set(downloadId, downloadInfo);
        return res.json({ downloadId, message: 'File available on Telegram (MTProto), fetched metadata', source: 'mtproto' });
      } else {
        const downloadInfo = {
          id: downloadId,
          source: 'telegram',
          telegramFileId: telegramEntry.file_id,
          fileName: telegramEntry.file_name || fileName,
          startTime: Date.now(),
          status: 'completed'
        };
        activeDownloads.set(downloadId, downloadInfo);
        return res.json({ downloadId, message: 'File available on Telegram (Bot API), fetched metadata', source: 'telegram' });
      }
    }

    const downloadId = generateId();

    // Add torrent
    try {
      client.add(torrentUri, { path: DOWNLOAD_DIR }, (torrent) => {
      console.log(`Started downloading: ${torrent.name}`);

      const downloadInfo = {
        id: downloadId,
        magnetUri: torrentUri,
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

        (async () => {
          try {
            // Find the largest file to upload
            let targetFile = torrent.files[0];
            for (const file of torrent.files) {
              if (file.length > targetFile.length) {
                targetFile = file;
              }
            }

            const filePath = path.join(DOWNLOAD_DIR, targetFile.path);
            const caption = torrentUri || torrent.infoHash || torrent.name;

            let uploadSucceeded = false;

            try {
              // First attempt Bot API upload (for smaller files)
              try {
                const fileId = await uploadFileToTelegram(filePath, caption);
                telegramIndex[torrentUri || torrent.infoHash || torrent.name] = {
                  source: 'bot',
                  file_id: fileId,
                  file_name: targetFile.name,
                  size: targetFile.length,
                  uploadedAt: Date.now()
                };
                saveTelegramIndex(telegramIndex);
                downloadInfo.telegramFileId = fileId;
                uploadSucceeded = true;
                console.log('Uploaded to Telegram (bot), file_id:', fileId);
              } catch (err) {
                console.error('Telegram Bot API upload failed:', err.message || err);
              }

              // If MTProto is enabled, also try uploading to the MTProto channel (for larger files)
              if (mtproto && mtproto.mtprotoEnabled && process.env.TELEGRAM_MT_CHANNEL) {
                try {
                  const mtRes = await mtproto.uploadFileToChannel(filePath, process.env.TELEGRAM_MT_CHANNEL, caption);
                  telegramIndex[torrentUri || torrent.infoHash || torrent.name] = Object.assign({}, mtRes, {
                    source: 'mtproto',
                    uploadedAt: Date.now()
                  });
                  saveTelegramIndex(telegramIndex);
                  downloadInfo.mtprotoPeer = mtRes.peer;
                  downloadInfo.mtprotoMessageId = mtRes.messageId;
                  uploadSucceeded = true;
                  console.log('Uploaded to Telegram (MTProto), messageId:', mtRes.messageId);
                } catch (err) {
                  console.error('MTProto upload failed:', err.message || err);
                }
              }
            } catch (error) {
              console.error('Post-download processing error:', error);
            }

            // Schedule cleanup: if upload succeeded, remove local file after configured delay (default 1 hour),
            // otherwise keep for 24 hours as a fallback
            const cleanupDelay = uploadSucceeded ? LOCAL_DELETE_AFTER_UPLOAD_MS : 24 * 60 * 60 * 1000;
            setTimeout(async () => {
              try {
                // remove local file to save space
                try {
                  if (fs.existsSync(filePath)) {
                    await fs.remove(filePath);
                    console.log(`Removed local file after upload: ${filePath}`);
                  }
                } catch (e) {
                  console.error('Failed to remove local file during cleanup:', e);
                }

                torrent.destroy();
                activeDownloads.delete(downloadId);
                console.log(`Cleaned up download: ${downloadId}`);
              } catch (error) {
                console.error('Cleanup error:', error);
              }
            }, cleanupDelay);
          } catch (error) {
            console.error('Post-download processing error:', error);
          }
        })();
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
    } catch (addError) {
      console.error('Failed to add torrent:', addError);
      return res.status(400).json({ error: `Failed to add torrent: ${addError.message || String(addError)}` });
    }

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

  // If the file is available on Telegram, stream from Telegram
  if (download.source === 'mtproto' && download.mtprotoPeer && download.mtprotoMessageId) {
    try {
      const localName = `${download.mtprotoPeer}_${download.mtprotoMessageId}_${download.fileName}`.replace(/[^a-zA-Z0-9._-]/g, '_');
      const localPath = path.join(DOWNLOAD_DIR, localName);

      if (!fs.existsSync(localPath)) {
        // download the media from telegram to local path
        await mtproto.downloadFileFromMessage(download.mtprotoPeer, download.mtprotoMessageId, localPath);
      }

      const stats = await fs.stat(localPath);
      const total = stats.size;
      const range = req.headers.range;
      const mimeType = mime.lookup(download.fileName) || 'application/octet-stream';

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Content-Disposition', `inline; filename="${download.fileName}"`);

      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? Math.min(parseInt(parts[1], 10), total - 1) : total - 1;
        const chunkSize = (end - start) + 1;

        res.status(206);
        res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
        res.setHeader('Content-Length', chunkSize);

        const stream = fs.createReadStream(localPath, { start, end });
        stream.pipe(res);
        stream.on('error', (err) => {
          console.error('MTProto local stream error:', err);
          if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
        });
        return;
      }

      res.setHeader('Content-Length', total);
      const stream = fs.createReadStream(localPath);
      stream.pipe(res);
      stream.on('end', () => {
        console.log(`MTProto file served for downloadId: ${downloadId}`);
      });
      stream.on('error', (err) => {
        console.error('MTProto local stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
      });
      return;
    } catch (err) {
      console.error('Failed to stream from MTProto, falling back to local if available:', err.message || err);
    }
  }

  if (download.source === 'telegram' && download.telegramFileId) {
    try {
      const tgUrl = await getTelegramFileUrl(download.telegramFileId);
      const tgResp = await axios.get(tgUrl, { responseType: 'stream' });

      // Propagate headers where possible
      res.setHeader('Content-Type', tgResp.headers['content-type'] || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${download.fileName || 'file'}"`);
      res.setHeader('Accept-Ranges', 'bytes');

      tgResp.data.pipe(res);
      tgResp.data.on('end', () => {
        console.log(`Telegram file streamed for downloadId: ${downloadId}`);
      });
      tgResp.data.on('error', (err) => {
        console.error('Telegram stream error:', err);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file from Telegram' });
      });
      return;
    } catch (err) {
      console.error('Failed to stream from Telegram, falling back to local if available:', err.message || err);
      // continue to attempt local streaming if torrent exists
    }
  }

  if (!torrent) {
    return res.status(404).json({ error: 'No local torrent file available' });
  }

  // Find the largest file (usually the movie file)
  let targetFile = torrent.files[0];
  for (const file of torrent.files) {
    if (file.length > targetFile.length) {
      targetFile = file;
    }
  }

  const total = targetFile.length;
  const range = req.headers.range;
  const fileName = download.fileName || targetFile.name;
  const mimeType = mime.lookup(fileName) || 'application/octet-stream';

  res.setHeader('Content-Type', mimeType);
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? Math.min(parseInt(parts[1], 10), total - 1) : total - 1;
    const chunkSize = (end - start) + 1;

    res.status(206);
    res.setHeader('Content-Range', `bytes ${start}-${end}/${total}`);
    res.setHeader('Content-Length', chunkSize);

    const stream = targetFile.createReadStream({ start, end });
    stream.pipe(res);
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
    });
  } else {
    res.setHeader('Content-Length', total);
    const stream = targetFile.createReadStream();
    stream.pipe(res);
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
      if (!res.headersSent) res.status(500).json({ error: 'Failed to stream file' });
    });
  }
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
