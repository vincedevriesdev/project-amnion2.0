# Project Amnion 2.0 - Complete Installatie, Update & Diagnose Handleiding

Handleiding voor de geautomatiseerde installatie, updates, rollback-engine en netwerkdiagnose van **Project Amnion 2.0** op Ubuntu Linux (20.04 / 22.04 / 24.04 LTS).

---

## 🚀 1. Snelle 1-Line Installatie

Voer het onderstaande commando uit als `root` op een schone Ubuntu VPS:

```bash
bash <(curl -fsSL -H "Cache-Control: no-cache" https://raw.githubusercontent.com/vincedevriesdev/project-amnion2.0/main/install/install.sh)
```

### Wat het installatiescript automatisch uitvoert:
1. **Systeemcontrole**: Valideert `root` permissies, Ubuntu OS en CPU architectuur (`amd64` / `arm64`).
2. **Afhankelijkheden**: Installeert Node.js 20 LTS, `sing-box` v1.9.3 release binary, Certbot, UFW firewall, SQLite3 en OpenSSL.
3. **Netwerk & Firewall**: Opent automatisch alle vereiste poorten in UFW:
   - `80/tcp` (Let's Encrypt Certbot)
   - `443/tcp` (VLESS REALITY HTTPS Camouflage)
   - `8443/udp` (Hysteria 2 QUIC)
   - `8444/udp` (TUIC v5 QUIC)
   - `3000/tcp` (Web Management Dashboard)
4. **Codebase & Services**: Bouwt de Fastify TypeScript backend en Vue 3 Vite Dashboard en registreert de systemd services (`sing-box.service` en `amnion-backend.service`).
5. **Cryptografie**: Genereert unieke Curve25519 REALITY sleutels en JWT cookie geheimen.
6. **Schijfbescherming (10 GB VPS)**: Stelt een `journald` geheugencap in op max 100 MB.

---

## 🔑 2. Eerste Keer Inloggen

Na installatie is het Web Dashboard bereikbaar via:
- **URL**: `http://<JOUW-VPS-IP>:3000` (of `http://vpn.jouwdomein.nl:3000`)
- **Standaard Gebruikersnaam**: `admin`
- **Standaard Wachtwoord**: `AmnionAdmin2026!`

> ⚠️ **Beveiligingsadvies**: Wijzig het admin wachtwoord direct na inloggen via het menu **Instellingen**!

---

## 🔄 3. Updates Uitvoeren (2 Methoden)

### Methode A: Via het Web Dashboard (Aanbevolen)
1. Log in op het Dashboard.
2. Ga in het menu naar **Instellingen**.
3. Klik op **"Amnion 2.0 Update Uitvoeren"**.
4. Volg de live geanimeerde voortgangsbalk (0% tot 100%) en herlaad de pagina zodra de update gereed is!

### Methode B: Via de VPS Terminal
Voer dit commando uit op de VPS als `root`:

```bash
bash /opt/amnion/install/update.sh
```

---

## 🛡️ 4. Automatische Rollback Garantiemotor

Het updatescript bevat een ingebouwde veiligheids-trap (`trap 'rollback' ERR`):
1. Maakt **vooraf** een complete hot-backup tarball op in `/var/backups/amnion/pre-update-TIMESTAMP.tar.gz`.
2. Haalt de nieuwste code op via `git fetch && git reset --hard origin/main`.
3. Valideert de `sing-box` configuratie via `sing-box check`.
4. Test de backend gezondheid via `http://127.0.0.1:3000/api/v1/health`.
5. **Mislukt er een stap?** De Rollback motor grijpt binnen 1 seconde in, herstelt de tarball backup en start de services opnieuw op. De VPN en het dashboard blijven 100% online zonder downtime.

---

## 🩺 5. Live Diagnose & Troubleshooting Commando's

Als een VPN-protocol of client niet lijkt te verbinden, gebruik dan deze handige commando's op jouw VPS terminal:

### 1. Live Sing-box Logboeken Streamen
Stream live alle inkomende verbindingen, handshakes en netwerkverzoeken:
```bash
journalctl -u sing-box -f
```

### 2. Actieve Luisterpoorten Controleren
Controleer of Sing-box luistert op poort 443 (TCP), 8443 (UDP) en 8444 (UDP):
```bash
ss -tulpn | grep -E '443|8443|8444'
```

### 3. Live Pakketten Vangen (Netwerk-Test)
Test of inkomend netwerkverkeer van jouw telefoon de VPS fysiek bereikt:
```bash
tcpdump -n -i any udp port 8444
```

### 4. Sing-box JSON Validatie
Valideer de geldigheid van de actieve Sing-box configuratie:
```bash
sing-box check -c /etc/sing-box/config.json
```

---

## 🛠️ 6. Onderhouds- en Beheerscripts

| Script | Omschrijving | Commando |
| :--- | :--- | :--- |
| **Update** | Veilige update naar nieuwste release met rollback | `bash /opt/amnion/install/update.sh` |
| **Backup** | Maakt een hot backup van DB, keys en certs | `bash /opt/amnion/install/backup.sh` |
| **Restore** | Herstelt een eerdere tarball backup | `bash /opt/amnion/install/restore.sh /pad/naar/backup.tar.gz` |
| **Repair** | Herstelt permissies, firewall en TLS certs | `bash /opt/amnion/install/repair.sh` |
| **Uninstall** | Verwijdert Amnion en sing-box van de VPS | `bash /opt/amnion/install/uninstall.sh` |
