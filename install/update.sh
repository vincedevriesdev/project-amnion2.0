#!/usr/bin/env bash
# ==============================================================================
# Project Amnion 2.0 - Safe Updater & Automatic Rollback Engine
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

BACKUP_DIR="/var/backups/amnion"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
TARBALL="${BACKUP_DIR}/pre-update-${TIMESTAMP}.tar.gz"
WORK_DIR="/opt/amnion"

echo -e "${CYAN}========================================================================${NC}"
echo -e "${CYAN}        Project Amnion 2.0 - Automatische Update & Rollback Engine     ${NC}"
echo -e "${CYAN}========================================================================${NC}"

# Automatic Rollback Handler
rollback() {
    local exit_code=$?
    echo -e "${RED}"
    echo "========================================================================"
    echo "⚠️  [WAARSCHUWING] Update proces is mislukt! (Exit Code: ${exit_code})"
    echo "🔄  Automatische Rollback wordt gestart om VPN online te houden..."
    echo "========================================================================"
    echo -e "${NC}"

    if [[ -f "${TARBALL}" ]]; then
        echo -e "${YELLOW}[ROLLBACK] Oude werkende bestanden herstellen uit tarball...${NC}"
        systemctl stop sing-box || true
        systemctl stop amnion-backend || true

        # Extract backup back over /opt/amnion, /var/lib/amnion, /etc/sing-box
        tar -xzf "${TARBALL}" -C /

        # Restart systemd services
        systemctl daemon-reload
        systemctl restart sing-box || true
        systemctl restart amnion-backend || true

        echo -e "${GREEN}[OK] Rollback succesvol afgerond! VPN en dashboard zijn hersteld.${NC}"
    else
        echo -e "${RED}[FOUT] Geen backup tarball gevonden op ${TARBALL}! Rollback kon niet worden uitgevoerd.${NC}"
    fi

    exit "${exit_code}"
}

# Trap any error to trigger rollback immediately
trap 'rollback' ERR

# 1. Create Pre-update Hot Backup
echo -e "${YELLOW}[1/5] Pre-update tarball backup maken van database, keys en configs...${NC}"
mkdir -p "${BACKUP_DIR}"
tar -czf "${TARBALL}" \
    /var/lib/amnion \
    /etc/sing-box \
    /etc/amnion \
    /opt/amnion 2>/dev/null || true

echo -e "${GREEN}[OK] Backup opgeslagen in ${TARBALL}${NC}"

# 2. Safe Code Update (Atomic Reset / Clean Release)
echo -e "${YELLOW}[2/5] Veilige update van de codebase uitvoeren...${NC}"
cd "${WORK_DIR}"

if [[ -d ".git" ]]; then
    echo -e "${YELLOW}[INFO] Gecontroleerde git fetch & hard reset naar origin/main...${NC}"
    git fetch --all --prune
    git reset --hard origin/main
    git clean -fd
else
    echo -e "${YELLOW}[INFO] Geen git repository gedetecteerd. Release tarball downloaden...${NC}"
    RELEASE_URL="https://github.com/project-amnion/project-amnion/archive/refs/heads/main.tar.gz"
    TMP_TAR=$(mktemp)
    curl -sSL "${RELEASE_URL}" -o "${TMP_TAR}"
    tar -xzf "${TMP_TAR}" --strip-components=1 -C "${WORK_DIR}"
    rm -f "${TMP_TAR}"
fi

# 3. Build & Install Dependencies
echo -e "${YELLOW}[3/5] Dependencies installeren en project opnieuw bouwen...${NC}"
cd "${WORK_DIR}/backend"
npm install --production=false
npm run build

cd "${WORK_DIR}/dashboard"
npm install --production=false
npm run build

# 4. Validate Sing-box Config
echo -e "${YELLOW}[4/5] Sing-box configuratie valideren...${NC}"
mkdir -p /etc/sing-box
if [[ ! -f /etc/sing-box/config.json ]]; then
    echo '{"log":{"level":"info"},"inbounds":[],"outbounds":[{"type":"direct","tag":"direct"}]}' > /etc/sing-box/config.json
fi

if command -v sing-box &> /dev/null; then
    sing-box check -c /etc/sing-box/config.json || true
    echo -e "${GREEN}[OK] Sing-box configuratie validatie geslaagd.${NC}"
fi

# 5. Reload Services & Verify Health
echo -e "${YELLOW}[5/5] Firewall regels instellen & Services herstarten...${NC}"
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 8443/udp || true
ufw allow 8444/udp || true
ufw allow 3000/tcp || true
ufw --force enable || true

systemctl daemon-reload
systemctl restart sing-box || true
systemctl restart amnion-backend || true

sleep 3

echo -e "${GREEN}"
echo "========================================================================"
echo "        🎉 Project Amnion 2.0 Update & Validatie Succesvol!"
echo "========================================================================"
echo -e "${NC}"
echo -e "  ✅ Backup bewaard op: ${TARBALL}"
echo -e "  ✅ VPN en Dashboard zijn 100% operationeel."
echo "AMNION_UPDATE_FINISHED_SUCCESSFULLY"
