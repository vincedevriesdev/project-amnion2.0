# Project Amnion 2.0 - Security Architecture & Threat Model

## 1. Beveiligingsprincipes

Beveiliging en privacy staan centraal binnen **Project Amnion 2.0**. Het platform is ontworpen om te voldoen aan strikte security- en privacy-normen voor self-hosted VPN-infrastructuren.

---

## 2. Authenticatie & Sessiebeheer

### 2.1 Admin Dashboard Authenticatie
- **Wachtwoordhashing**: Wachtwoorden worden beveiligd met **Argon2id** (`argon2` npm library) met de volgende parameters:
  - Memory: 65536 KB (64 MB)
  - Time Cost: 3
  - Parallelism: 1
  - Cryptografisch unieke salt per wachtwoord.
- **Server-side Sessions**:
  - Sessie-ID's worden gegenereerd via cryptografisch veilige random bytes (`crypto.randomUUID()`).
  - Opgeslagen in een **`httpOnly`, `sameSite: 'lax'`, `secure`** cookie (`amnion_session`).
  - Voorkomt diefstal van sessies via Cross-Site Scripting (XSS).
- **Session Revocation**: Beheerders kunnen met 1 klik alle actieve sessies beëindigen vanuit het dashboard.

### 2.2 Brute-Force & Rate Limiting (Up-to-Date Config)
Om zowel misbruik te voorkomen als een soepele gebruikerservaring te bieden, zijn de rate limits geoptimaliseerd:
- **Login Endpoint (`/api/v1/auth/login`)**:
  - Maximaal **30 verzoeken per 15 minuten per IP-adres**.
  - Dit verhoogde limiet voorkomt dat legitieme beheerders per ongeluk worden buitengesloten (`429 Too Many Requests`), terwijl brute-force aanvallen effectief geblokkeerd blijven.
- **Globaal API Limiet (`/api/v1/*`)**:
  - Maximaal **300 verzoeken per minuut** per IP-adres in `app.ts`.
  - Dit garandeert dat real-time dashboard polling (live RX/TX netwerksnelheid en CPU/RAM grafieken) ongestoord kan blijven verversen zonder rate-limit fouten.

---

## 3. Netwerk- & Transportbeveiliging

### 3.1 TLS & Certificaatbeheer (Inclusief Fallback Engine)
- Webdashboard en HTTPS endpoints worden beveiligd met **Let's Encrypt TLS 1.3** certificaten via Certbot.
- **Automatische Self-Signed Fallback**: Indien Let's Encrypt nog niet is uitgegeven op de VPS, genereert `ProtocolsService` automatisch een 10-jarig self-signed SSL-certificaat (`/etc/amnion/selfsigned.crt` en `selfsigned.key`) via OpenSSL. Hierdoor blijven TUIC v5 en Hysteria 2 altijd direct online.
- TLS-configuraties dwingen moderne ciphers en HSTS (HTTP Strict Transport Security) af.

### 3.2 VLESS + REALITY Camouflage
- VLESS REALITY gebruikt direct TLS Mimicry naar legitieme externe servers (bijv. `dl.google.com`).
- Werkt op basis van Curve25519 keypairs (`reality_private_key`, `reality_public_key`, `short_id`).
- Voorkomt dat geavanceerde Deep Packet Inspection (DPI) firewalls herkennen dat er een VPN-tunnel actief is.

---

## 4. Input Validatie & Data Bescherming

- **SQL Injection**: Bescherming door het consistent gebruiken van SQLite query binding met gebonden parameters. Geen raw string-concatenatie in SQL queries.
- **XSS (Cross-Site Scripting)**: Vue 3 auto-escapes alle gerenderde HTML variabelen in het dashboard.
- **Secrets Storage**: Private keys (REALITY keys, JWT secrets, cookie geheimen) worden opgeslagen in `/etc/amnion/env` met strikte Linux bestandskenmerken (`0600`).

---

## 5. Automated Rollback Garantiemotor

- Bij elke update via `install/update.sh` of het dashboard wordt er vooraf een complete tarball backup gemaakt in `/var/backups/amnion/pre-update-TIMESTAMP.tar.gz`.
- Als het TypeScript bouwen (`npm run build`), de `sing-box check` of de API gezondheidstest (`/api/v1/health`) faalt, grijpt de Rollback Engine binnen 1 seconde in en herstelt de werkende backup.

---

## 6. Least Privilege Principle (Minimale Rechten)

- De Amnion Backend Control Daemon draait onder een dedicated Linux service.
- Sing-box draait onder de system service met specifieke Linux Capabilities (`CAP_NET_ADMIN`, `CAP_NET_BIND_SERVICE`).
- Firewall regels (UFW) worden automatisch beheerd voor de 5 benodigde poorten (`80/tcp`, `443/tcp`, `8443/udp`, `8444/udp`, `3000/tcp`).
