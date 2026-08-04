#!/usr/bin/env bash
# ==============================================================================
# Project Amnion 2.0 - Restore Utility
# ==============================================================================

set -euo pipefail

if [[ $# -ne 1 ]]; then
    echo "Gebruik: $0 /pad/naar/amnion-backup-XXXX.tar.gz"
    exit 1
fi

TARBALL="$1"
if [[ ! -f "${TARBALL}" ]]; then
    echo "Fout: Bestand '${TARBALL}' bestaat niet!"
    exit 1
fi

echo "[INFO] Stopt tijdelijk services..."
systemctl stop sing-box || true
systemctl stop amnion-backend || true

echo "[INFO] Herstelt backup uit '${TARBALL}'..."
tar -xzf "${TARBALL}" -C /

echo "[INFO] Herstart services..."
systemctl start sing-box
systemctl start amnion-backend

echo "✅ Herstel succesvol afgerond."
