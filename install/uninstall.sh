#!/usr/bin/env bash
# ==============================================================================
# Project Amnion 2.0 - Uninstaller Utility
# ==============================================================================

set -euo pipefail

read -rp "WEET JE ZEKER dat je Project Amnion 2.0 en alle VPN configuraties wilt verwijderen? (j/N): " CONFIRM
if [[ "${CONFIRM}" != "j" && "${CONFIRM}" != "J" ]]; then
    echo "Deïnstallatie geannuleerd."
    exit 0
fi

echo "[INFO] Services stoppen en uitschakelen..."
systemctl stop sing-box || true
systemctl stop amnion-backend || true
systemctl disable sing-box || true
systemctl disable amnion-backend || true

echo "[INFO] Systemd unit files en bestanden verwijderen..."
rm -f /etc/systemd/system/sing-box.service
rm -f /etc/systemd/system/amnion-backend.service
systemctl daemon-reload

rm -rf /opt/amnion
rm -rf /etc/amnion
rm -rf /etc/sing-box
rm -rf /var/lib/amnion
rm -f /usr/local/bin/sing-box

echo "✅ Project Amnion 2.0 is succesvol verwijderd van dit systeem."
