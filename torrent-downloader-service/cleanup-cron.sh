#!/bin/bash

# Cleanup script for torrent downloader service
# Run this script via cron to clean up old downloads

# Change to the script directory
cd "$(dirname "$0")"

# Run cleanup
node cleanup.js

# Log cleanup completion
echo "$(date): Cleanup completed" >> cleanup.log
