#!/usr/bin/env bash
# ==============================================================================
# Project Amnion 2.0 - Master Automated Installer for Ubuntu Linux
# ==============================================================================

set -euo pipefail

# Color formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

LOG_FILE="/var/log/amnion-install.log"
exec > >(tee -a "${LOG_FILE}") 2>&1

echo -e "${CYAN}"
echo "========================================================================"
echo "         Project Amnion 2.0 - Self-Hosted VPN Master Installer"
echo "========================================================================"
echo -e "${NC}"

# Error Handler Trap
on_error() {
    local exit_code=$1
    local line_no=$2
    local command=$3
    echo -e "${RED}[ERROR] Installatie mislukt op regel ${line_no}!${NC}"
    echo -e "${RED}[ERROR] Commando: '${command}' (Exit Code: ${exit_code})${NC}"
    echo -e "${YELLOW}[INFO] Bekijk het installatielogboek in: ${LOG_FILE}${NC}"
    exit "${exit_code}"
}
trap 'on_error $? $LINENO "$BASH_COMMAND"' ERR

# 1. Check Root Privileges
if [[ "$EUID" -ne 0 ]]; then
    echo -e "${RED}[FOUT] Dit installatiescript moet worden uitgevoerd als root!${NC}"
    exit 1
fi

# 2. Check Operating System (Ubuntu Only)
if ! grep -qi "ubuntu" /etc/os-release; then
    echo -e "${RED}[FOUT] Project Amnion 2.0 is momenteel alleen geschikt voor Ubuntu Linux!${NC}"
    exit 1
fi

# 3. Detect Architecture
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    SINGBOX_ARCH="amd64"
elif [[ "$ARCH" == "aarch64" ]]; then
    SINGBOX_ARCH="arm64"
else
    echo -e "${RED}[FOUT] Niet-ondersteunde CPU-architectuur: ${ARCH}${NC}"
    exit 1
fi
echo -e "${GREEN}[OK] CPU-architectuur gedetecteerd: ${ARCH} (${SINGBOX_ARCH})${NC}"

# 4. Fetch Public IP
PUBLIC_IP=$(curl -s --max-time 10 https://ifconfig.me || echo "127.0.0.1")
echo -e "${GREEN}[OK] Publiek IP-adres: ${PUBLIC_IP}${NC}"

# 5. Interactive Domain & Email Inputs
DOMAIN="${DOMAIN:-}"
if [[ -z "${DOMAIN}" ]]; then
    read -rp "Voer jouw domeinnaam in (bijv. vpn.jouwdomein.nl): " DOMAIN
fi

ADMIN_EMAIL="${ADMIN_EMAIL:-}"
if [[ -z "${ADMIN_EMAIL}" ]]; then
    read -rp "Voer jouw e-mailadres in voor Let's Encrypt TLS: " ADMIN_EMAIL
fi

# 6. Install System Dependencies & Node.js
echo -e "${YELLOW}[1/7] Afhankelijkheden en Node.js installeren...${NC}"
apt-get update -y
apt-get install -y curl wget git ufw certbot build-essential tar unzip sqlite3

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi
echo -e "${GREEN}[OK] Node.js $(node -v) geïnstalleerd.${NC}"

# 7. Download and Install sing-box Binary
echo -e "${YELLOW}[2/7] sing-box VPN engine downloaden en installeren...${NC}"
SINGBOX_VERSION="1.9.3"
SINGBOX_URL="https://github.com/SagerNet/sing-box/releases/download/v${SINGBOX_VERSION}/sing-box-${SINGBOX_VERSION}-linux-${SINGBOX_ARCH}.tar.gz"

TMP_DIR=$(mktemp -d)
wget -qO "${TMP_DIR}/sing-box.tar.gz" "${SINGBOX_URL}"
tar -xzf "${TMP_DIR}/sing-box.tar.gz" -C "${TMP_DIR}"
mv "${TMP_DIR}"/sing-box-*/sing-box /usr/local/bin/sing-box
chmod +x /usr/local/bin/sing-box
rm -rf "${TMP_DIR}"

echo -e "${GREEN}[OK] sing-box $(sing-box version | head -n 1) geïnstalleerd.${NC}"

# 8. Setup Directory Structure & Download Amnion Codebase
echo -e "${YELLOW}[3/7] Amnion codebase downloaden van GitHub naar /opt/amnion...${NC}"
mkdir -p /etc/amnion
mkdir -p /etc/sing-box
mkdir -p /var/log/sing-box
mkdir -p /var/lib/amnion

rm -rf /opt/amnion
git clone https://github.com/vincedevriesdev/project-amnion2.0.git /opt/amnion

# 9. Build Backend & Dashboard
echo -e "${YELLOW}[4/7] Backend en Dashboard bouwen...${NC}"
cd /opt/amnion/backend
npm install
npm run build

cd /opt/amnion/dashboard
npm install
npm run build

# 10. Generate Environment Variables & Secrets
echo -e "${YELLOW}[5/7] Beveiliging en TLS-certificaten configureren...${NC}"
COOKIE_SECRET=$(openssl rand -hex 32)
cat <<EOF > /etc/amnion/env
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
DB_PATH=/var/lib/amnion/amnion.db
COOKIE_SECRET=${COOKIE_SECRET}
SING_BOX_CONFIG_PATH=/etc/sing-box/config.json
SING_BOX_BINARY=/usr/local/bin/sing-box
SERVER_DOMAIN=${DOMAIN}
PUBLIC_IP=${PUBLIC_IP}
EOF
chmod 0600 /etc/amnion/env

# Issue TLS Cert via Certbot Standalone if needed
if [[ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]]; then
    echo -e "${YELLOW}[INFO] Vragen TLS-certificaat aan bij Let's Encrypt voor ${DOMAIN}...${NC}"
    certbot certonly --standalone --non-interactive --agree-tos -m "${ADMIN_EMAIL}" -d "${DOMAIN}" || true
fi

# 11. Configure Journald Cap (10 GB VPS Protection)
mkdir -p /etc/systemd/journald.conf.d
cat <<EOF > /etc/systemd/journald.conf.d/amnion.conf
[Journal]
SystemMaxUse=100M
SystemKeepFree=1G
MaxRetentionSec=14day
EOF
systemctl restart systemd-journald

# 12. Firewall Configuration (UFW)
echo -e "${YELLOW}[6/7] Firewall regels instellen (UFW)...${NC}"
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 8443/udp || true
ufw allow 8444/udp || true
ufw allow 3000/tcp || true

# 13. Systemd Services Setup
echo -e "${YELLOW}[7/7] Systemd services registreren en starten...${NC}"
cp /opt/amnion/config/systemd/sing-box.service /etc/systemd/system/
cp /opt/amnion/config/systemd/amnion-backend.service /etc/systemd/system/

systemctl daemon-reload
systemctl enable --now sing-box
systemctl enable --now amnion-backend

echo -e "${GREEN}"
echo "========================================================================"
echo "        🎉 Project Amnion 2.0 - Installatie Succesvol Afgerond!"
echo "========================================================================"
echo -e "${NC}"
echo -e "  🌐 Dashboard URL:    ${CYAN}http://${DOMAIN}:3000${NC} (of http://${PUBLIC_IP}:3000)"
echo -e "  🔑 Standaard Login:  Gebruikersnaam: ${CYAN}admin${NC} | Wachtwoord: ${CYAN}AmnionAdmin2026!${NC}"
echo -e "  📄 Installatielog:   ${LOG_FILE}"
echo ""
echo -e "${YELLOW}Tip: Verander direct het standaard wachtwoord via het dashboard!${NC}"
