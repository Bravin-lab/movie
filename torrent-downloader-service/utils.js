// Utility functions for torrent downloader service

const crypto = require('crypto');

// Generate unique ID for downloads
function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  generateId
};
