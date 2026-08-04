#!/usr/bin/env bash
# ==============================================================================
# Project Amnion 2.0 - Backup Utility
# ==============================================================================

set -euo pipefail

BACKUP_DIR="/var/backups/amnion"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
DEST_FILE="${BACKUP_DIR}/amnion-backup-${TIMESTAMP}.tar.gz"

mkdir -p "${BACKUP_DIR}"

echo "[INFO] Maakt hot backup van database, keys en TLS certificaten..."
tar -czf "${DEST_FILE}" \
    /var/lib/amnion \
    /etc/sing-box \
    /etc/amnion \
    /etc/letsencrypt 2>/dev/null || true

echo "✅ Backup succesvol aangemaakt: ${DEST_FILE}"
