#!/bin/bash
# =============================================
# FILE: scripts/backup-database.sh
# Database Backup Script (REQ-134, REQ-135)
# =============================================

set -euo pipefail

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.sql"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${GREEN}Starting database backup...${NC}"
echo "Backup file: $BACKUP_FILE"

# Extract connection details from DATABASE_URL
# Format: postgresql://user:password@host:port/database
DB_URL="$DATABASE_URL"

# Perform backup using pg_dump
if command -v pg_dump &> /dev/null; then
    pg_dump "$DB_URL" > "$BACKUP_FILE"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup completed successfully${NC}"
    echo "Backup size: $BACKUP_SIZE"
else
    echo -e "${YELLOW}Warning: pg_dump not found. Attempting alternative method...${NC}"
    # Alternative: Use Supabase CLI or API if available
    echo -e "${RED}Error: pg_dump is required for database backups${NC}"
    exit 1
fi

# Compress backup
if command -v gzip &> /dev/null; then
    echo "Compressing backup..."
    gzip "$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE}.gz"
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Backup compressed: $BACKUP_SIZE${NC}"
fi

# Clean up old backups (REQ-135)
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "backup_*.sql*" -type f -mtime +$RETENTION_DAYS -delete
echo -e "${GREEN}Cleanup completed${NC}"

# Verify backup file exists and is not empty
if [ ! -s "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file is empty or does not exist${NC}"
    exit 1
fi

echo -e "${GREEN}Backup process completed successfully${NC}"
echo "Backup location: $BACKUP_FILE"

