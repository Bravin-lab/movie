require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const mime = require('mime-types');
const { generateId } = require('./utils');
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
const TELEGRAM_INDEX_FILE = path.join(DOWNLOAD_DIR, 'telegram_index.json');
// How long to keep local file after a successful upload (default: 1 hour)
const LOCAL_DELETE_AFTER_UPLOAD_MS = process.env.LOCAL_DELETE_AFTER_UPLOAD_MS ? Number(process.env.LOCAL_DELETE_AFTER_UPLOAD_MS) : 60 * 60 * 1000;

function normalizeLookupText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\([^\)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractMagnetParts(torrentUri) {
  try {
    const query = String(torrentUri || '').split('?')[1] || '';
    const params = new URLSearchParams(query);
    return {
      infoHash: (params.get('xt') || '').replace(/^urn:btih:/i, '').toLowerCase(),
      displayName: params.get('dn') || '',
    };
  } catch {
    return { infoHash: '', displayName: '' };
  }
}

function getTelegramIndexKey(entry) {
  if (!entry || typeof entry !== 'object') {
    return null;
  }

  const infoHash = normalizeLookupText(entry.infoHash || extractMagnetParts(entry.torrentUri).infoHash);
  if (infoHash) {
    return infoHash;
  }

  const fallbackName = normalizeLookupText(
    entry.normalizedFileName || entry.file_name || entry.fileName || entry.requestedFileName || entry.displayName
  );

  return fallbackName || null;
}

function normalizeTelegramIndex(index) {
  const normalizedIndex = {};

  for (const [legacyKey, entry] of Object.entries(index || {})) {
    const normalizedEntry = {
      ...(entry || {}),
      infoHash: entry?.infoHash || extractMagnetParts(entry?.torrentUri).infoHash,
      file_name: entry?.file_name || entry?.fileName || entry?.requestedFileName,
      normalizedFileName: normalizeLookupText(
        entry?.normalizedFileName || entry?.file_name || entry?.fileName || entry?.requestedFileName || entry?.displayName
      ),
    };

    const key = getTelegramIndexKey(normalizedEntry) || normalizeLookupText(legacyKey);
    if (!key) {
      continue;
    }

    normalizedIndex[key] = normalizedEntry;
  }

  return normalizedIndex;
}

function getRequestTelegramIndexKey({ torrentUri, rawTorrentUri, fileName }) {
  const { infoHash, displayName } = extractMagnetParts(torrentUri || rawTorrentUri);
  return normalizeLookupText(infoHash || displayName || fileName || torrentUri || rawTorrentUri);
}

function findTelegramEntry({ torrentUri, rawTorrentUri, fileName }) {
  const directKey = getRequestTelegramIndexKey({ torrentUri, rawTorrentUri, fileName });
  if (directKey && telegramIndex[directKey]) {
    return telegramIndex[directKey];
  }

  const { infoHash, displayName } = extractMagnetParts(torrentUri);
  const candidateSet = new Set(
    [torrentUri, rawTorrentUri, infoHash, displayName, fileName]
      .filter(Boolean)
      .map(normalizeLookupText)
  );

  for (const [key, entry] of Object.entries(telegramIndex)) {
    const entryValues = [
      key,
      entry?.torrentUri,
      entry?.infoHash,
      entry?.file_name,
      entry?.fileName,
      entry?.requestedFileName,
      entry?.normalizedFileName,
      entry?.displayName,
    ]
      .filter(Boolean)
      .map(normalizeLookupText);

    if (entryValues.some((value) => candidateSet.has(value))) {
      return entry;
    }
  }

  return null;
}

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

const telegramIndex = normalizeTelegramIndex(loadTelegramIndex());

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
    const rawTorrentUri = typeof magnetUri === 'string' ? magnetUri.trim() : '';
    const torrentUri = (() => {
      try {
        return decodeURIComponent(rawTorrentUri);
      } catch {
        return rawTorrentUri;
      }
    })();

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
    const requestKey = getRequestTelegramIndexKey({ torrentUri, rawTorrentUri, fileName });
    const telegramEntry =
      (requestKey && telegramIndex[requestKey]) ||
      telegramIndex[torrentUri] ||
      telegramIndex[rawTorrentUri] ||
      findTelegramEntry({ torrentUri, rawTorrentUri, fileName });
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
            if (!torrent.files || torrent.files.length === 0) {
              throw new Error('No files found in torrent');
            }

            let targetFile = torrent.files[0];
            for (const file of torrent.files) {
              if (file.length > targetFile.length) {
                targetFile = file;
              }
            }

            const filePath = path.join(DOWNLOAD_DIR, targetFile.path);
            const caption = torrentUri || torrent.infoHash || torrent.name;
            const canUseMtProto = Boolean(mtproto && mtproto.mtprotoEnabled && process.env.TELEGRAM_MT_CHANNEL);

            let uploadSucceeded = false;

            try {
              if (canUseMtProto) {
                const mtRes = await mtproto.uploadFileToChannel(filePath, process.env.TELEGRAM_MT_CHANNEL, caption);
                const telegramKey = normalizeLookupText(torrent.infoHash || extractMagnetParts(torrentUri).infoHash || torrent.name);
                telegramIndex[telegramKey] = Object.assign({}, mtRes, {
                  source: 'mtproto',
                  torrentUri,
                  infoHash: torrent.infoHash,
                  file_name: fileName || torrent.name,
                  normalizedFileName: normalizeLookupText(fileName || torrent.name),
                  uploadedAt: Date.now()
                });
                saveTelegramIndex(telegramIndex);
                downloadInfo.mtprotoPeer = mtRes.peer;
                downloadInfo.mtprotoMessageId = mtRes.messageId;
                uploadSucceeded = true;
                console.log('Uploaded to Telegram (MTProto), messageId:', mtRes.messageId);
              } else {
                console.log('MTProto upload skipped: TELEGRAM_MTPROTO or TELEGRAM_MT_CHANNEL not configured');
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
  const size = torrent?.length || download.size || 0;
  res.json({
    id: downloadId,
    fileName: download.fileName,
    status: download.status,
    progress: download.progress || 0,
    speed: download.speed || 0,
    peers: download.peers || 0,
    size,
    downloaded: torrent?.downloaded || size,
    timeRemaining: torrent?.timeRemaining || 0,
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

  if (!torrent) {
    return res.status(404).json({ error: 'No local torrent file available' });
  }

  // Find the largest file (usually the movie file)
  if (!torrent.files || torrent.files.length === 0) {
    return res.status(404).json({ error: 'No files available in local torrent' });
  }

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
