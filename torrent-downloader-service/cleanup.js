const fs = require('fs-extra');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const MAX_AGE_HOURS = 12; // Delete files older than 12 hours
const PROTECTED_FILES = new Set(['telegram_index.json']);
const RUN_INTERVAL_MS = 60 * 60 * 1000; // 1 hour

async function cleanup() {
  console.log('Starting cleanup process...');

  try {
    // Ensure downloads directory exists
    await fs.ensureDir(DOWNLOAD_DIR);

    const files = await fs.readdir(DOWNLOAD_DIR);
    const now = Date.now();
    const maxAge = MAX_AGE_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

    let deletedCount = 0;
    let totalSize = 0;

    for (const file of files) {
      // Skip protected files
      if (PROTECTED_FILES.has(file)) {
        console.log(`Skipping protected file: ${file}`);
        continue;
      }

      const filePath = path.join(DOWNLOAD_DIR, file);
      let stats;
      try {
        stats = await fs.stat(filePath);
      } catch (err) {
        console.warn(`Unable to stat ${file}:`, err.message || err);
        continue;
      }

      // Check if file is older than max age
      if (now - stats.mtime.getTime() > maxAge) {
        const size = stats.size;
        try {
          await fs.remove(filePath);
          deletedCount++;
          totalSize += size;
          console.log(`Deleted: ${file} (${(size / 1024 / 1024).toFixed(2)} MB)`);
        } catch (err) {
          console.warn(`Failed to delete ${file}:`, err.message || err);
        }
      }
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} files, freed ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Log current disk usage
    const remainingFiles = await fs.readdir(DOWNLOAD_DIR);
    let currentSize = 0;
    for (const file of remainingFiles) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      try {
        const stats = await fs.stat(filePath);
        if (stats.isFile()) currentSize += stats.size;
      } catch (err) {
        // ignore
      }
    }

    console.log(`Remaining files: ${remainingFiles.length}, total size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('Cleanup error:', error);
    // Do not exit the process when running scheduled cleanups
  }
}

// When run directly, execute once and schedule hourly runs
if (require.main === module) {
  cleanup().catch((err) => console.error('Initial cleanup error:', err));

  // Schedule recurring cleanup every hour
  setInterval(() => {
    cleanup().catch((err) => console.error('Scheduled cleanup error:', err));
  }, RUN_INTERVAL_MS);
}

module.exports = { cleanup };
