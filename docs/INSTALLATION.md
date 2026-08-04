# Project Amnion 2.0 - Installatie & Update Handleiding

## 🚀 1-Line Snelle Installatie (Ubuntu 20.04 / 22.04 / 24.04)

Voer het onderstaande commando uit op een schone Ubuntu VPS als `root`:

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/project-amnion/project-amnion/main/install/install.sh)
```

### Wat het installatiescript automatisch uitvoert:
1. Controleert op rootrechten, Ubuntu OS en CPU-architectuur (`amd64` / `arm64`).
2. Installeert Node.js LTS, `sing-box` release binary, Certbot, UFW firewall en SQLite.
3. Vraagt je domeinnaam en e-mailadres voor Let's Encrypt TLS.
4. Bouwt de Fastify Backend en Vite Vue 3 Dashboard.
5. Genereert veilige REALITY sleutels en JWT cookie geheimen.
6. Registreert en start systemd services (`sing-box.service` en `amnion-backend.service`).
7. Stelt de `journald` geheugencap in op max 100 MB voor 10 GB VPS bescherming.

---

## 🔄 Updates Uitvoeren

Om Project Amnion 2.0 veilig bij te werken naar de nieuwste versie:

```bash
bash /opt/amnion/install/update.sh
```

### Veiligheidsgarantie & Automatische Rollback:
1. Het updatescript maakt **eerst** een complete tarball backup in `/var/backups/amnion/pre-update-TIMESTAMP.tar.gz`.
2. Haalt de nieuwste code op via gecontroleerde `git fetch && git reset --hard` of schone release tarball.
3. Valideert de nieuwe `sing-box` configuratie via `sing-box check`.
4. Valideert de gezondheid van de backend via `/api/v1/health`.
5. **Automatische Rollback**: Als er ergens in de keten een fout optreedt, wordt de backup automatisch teruggezet en blijven de VPN-server en het dashboard 100% online zonder downtime!

---

## 🛠️ Extra Beheerscripts

| Script | Omschrijving | Commando |
| :--- | :--- | :--- |
| **Backup** | Maakt een hot backup van DB, keys en certs | `bash /opt/amnion/install/backup.sh` |
| **Restore** | Herstelt een eerdere tarball backup | `bash /opt/amnion/install/restore.sh /pad/naar/backup.tar.gz` |
| **Repair** | Herstelt permissies en vernieuwt TLS certs | `bash /opt/amnion/install/repair.sh` |
| **Uninstall** | Verwijdert Amnion en sing-box van de VPS | `bash /opt/amnion/install/uninstall.sh` |
