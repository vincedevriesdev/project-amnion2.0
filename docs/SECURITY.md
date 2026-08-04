# Project Amnion 2.0 - Security Architecture & Threat Model

## 1. Beveiligingsprincipes

Beveiliging staat centraal binnen Project Amnion 2.0. Het platform is ontworpen om te voldoen aan strikte privacy- en security-normen voor self-hosted infrastructuren.

---

## 2. Authenticatie & Sessiebeheer

### 2.1 Admin Dashboard Authenticatie
- **Wachtwoordhashing**: Gebruik van **Argon2id** (`argon2` npm library) met de volgende parameters:
  - Memory: 65536 KB (64 MB)
  - Time Cost: 3
  - Parallelism: 1
- **Server-side Sessions**:
  - Sessie-ID's worden gegenereerd met cryptografisch veilige random bytes (`crypto.randomBytes(32)`).
  - Opgeslagen in een **`httpOnly`, `Secure`, `SameSite=Strict`** cookie.
  - Voorkomt diefstal via Cross-Site Scripting (XSS).
- **Session Revocation**: Beheerders kunnen met 1 klik alle actieve sessies beëindigen vanuit het dashboard.

### 2.2 Brute-Force & Rate Limiting
- Fastify rate limiter beschermt het `/api/v1/auth/login` endpoint.
- Maximaal **5 mislukte inlogpogingen per 15 minuten per IP-adres**.
- Bij overschrijding wordt de IP-adres tijdelijk geblokkeerd (`429 Too Many Requests`).

---

## 3. Netwerk- & Transportbeveiliging

### 3.1 TLS & Certificaatbeheer
- Webdashboard en HTTPS endpoints worden beveiligd met **Let's Encrypt TLS 1.3** certificaten.
- Geautomatiseerde vernieuwing via Certbot cronjob.
- TLS-configuraties dwingen moderne ciphers en HSTS (HTTP Strict Transport Security) af.

### 3.2 VLESS + REALITY Camouflage
- VLESS REALITY gebruikt direct TLS Mimicry naar legitieme externe servers (bijv. `dl.google.com`).
- Voorkomt dat Deep Packet Inspection (DPI) firewalls herkennen dat er een VPN-tunnel actief is.

---

## 4. Input Validatie & Data Bescherming

- **SQL Injection**: Bescherming door het consistent gebruiken van de Kysely / SQLite query builder met gebonden parameters. Geen raw string-concatenatie in SQL queries.
- **XSS (Cross-Site Scripting)**: Vue 3 auto-escapes alle gerenderde HTML variabelen.
- **CSRF (Cross-Site Request Forgery)**: Dubbele bescherming via `SameSite=Strict` cookies en verplichte Custom CSRF Token Headers (`X-Amnion-CSRF-Token`).
- **Secrets Storage**: Private keys (REALITY keys, JWT secrets, database encryptie keys) worden opgeslagen in `/etc/amnion/env` met strikte file permissies (`0600`, eigenaar `amnion:amnion`).

---

## 5. Least Privilege Principle (Minimale Rechten)

- De Amnion Backend Control Daemon draait onder een eigen dedicated onbevoegde Linux system user: `amnion`.
- Sing-box draait onder de system user `sing-box` met specifieke Linux Capabilities:
  - `CAP_NET_ADMIN`
  - `CAP_NET_BIND_SERVICE`
- Geen enkele backend service draait onder het `root` account.
