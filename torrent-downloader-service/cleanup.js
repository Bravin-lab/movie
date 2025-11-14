const fs = require('fs-extra');
const path = require('path');

const DOWNLOAD_DIR = path.join(__dirname, 'downloads');
const MAX_AGE_HOURS = 24; // Delete files older than 24 hours

async function cleanup() {
  try {
    console.log('Starting cleanup process...');

    // Ensure downloads directory exists
    await fs.ensureDir(DOWNLOAD_DIR);

    const files = await fs.readdir(DOWNLOAD_DIR);
    const now = Date.now();
    const maxAge = MAX_AGE_HOURS * 60 * 60 * 1000; // Convert hours to milliseconds

    let deletedCount = 0;
    let totalSize = 0;

    for (const file of files) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const stats = await fs.stat(filePath);

      // Check if file is older than max age
      if (now - stats.mtime.getTime() > maxAge) {
        const size = stats.size;
        await fs.remove(filePath);
        deletedCount++;
        totalSize += size;
        console.log(`Deleted: ${file} (${(size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }

    console.log(`Cleanup completed. Deleted ${deletedCount} files, freed ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

    // Log current disk usage
    const remainingFiles = await fs.readdir(DOWNLOAD_DIR);
    let currentSize = 0;
    for (const file of remainingFiles) {
      const filePath = path.join(DOWNLOAD_DIR, file);
      const stats = await fs.stat(filePath);
      currentSize += stats.size;
    }

    console.log(`Remaining files: ${remainingFiles.length}, total size: ${(currentSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
}

// Run cleanup if called directly
if (require.main === module) {
  cleanup();
}

module.exports = { cleanup };
