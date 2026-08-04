#!/usr/bin/env bash
# ==============================================================================
# Project Amnion 2.0 - Repair Utility
# ==============================================================================

set -euo pipefail

echo "[INFO] Rechten herstellen..."
chmod 0600 /etc/amnion/env || true
chmod 0644 /etc/systemd/system/sing-box.service || true
chmod 0644 /etc/systemd/system/amnion-backend.service || true

echo "[INFO] Sing-box configuratie checken..."
if command -v sing-box &> /dev/null; then
    sing-box check -c /etc/sing-box/config.json || echo "[WARN] Sing-box check heeft waarschuwingen"
fi

echo "[INFO] Certbot vernieuwen proberen..."
certbot renew --quiet || true

echo "[INFO] Systemd services herladen en herstarten..."
systemctl daemon-reload
systemctl restart sing-box
systemctl restart amnion-backend

echo "✅ Reparaties afgerond."
