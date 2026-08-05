# Project Amnion 2.0 - System Architecture & Technical Specification

## 1. Introductie

**Project Amnion 2.0** is een enterprise-grade, privacy-first self-hosted VPN-oplossing ontworpen om te draaien op Linux (specifiek Ubuntu 20.04/22.04/24.04 LTS). 

De kerndoelstellingen van de architectuur zijn:
1. **Zero-leaks & Hoge Privacy**: Minimale dataverzameling, geen onnodige IP-logging.
2. **Resource Efficiëntie**: Geschikt voor kleine VPS'en met slechts 10 GB SSD en 1 GB RAM. Total schijfgebruik (inclusief OS & logs) blijft onder de 500 MB, met een strikt 100 MB plafond voor systemd journald logs.
3. **Domain-Driven Modulair**: Eenvoudig uitbreidbaar met nieuwe VPN-protocollen of beheersfuncties.
4. **Hiddify Compatibility**: Direct bruikbaar in de mobiele en desktop client Hiddify Next via QR-codes en Base64 subscription streams.

---

## 2. Componenten & Architectuur

Project Amnion 2.0 bestaat uit drie hoofdlagen:

```text
+-----------------------------------------------------------------------+
|                          Hiddify Next Client                          |
+-----------------------------------------------------------------------+
        | vless://                     | hy2://                | tuic://
        v                              v                       v
+-----------------------------------------------------------------------+
|                       sing-box Engine (Inbounds)                      |
|                  VLESS+REALITY (TCP) | Hysteria2 (UDP) | TUIC (UDP)   |
+-----------------------------------------------------------------------+
                                       ^
                                       | Dynamic JSON Config Sync (Atomic Swap)
+-----------------------------------------------------------------------+
|              Amnion Backend Control Daemon (Fastify Node TS)          |
|    Domain Modules | WebSocket Stats | Systemd Manager | Log Rotation   |
+-----------------------------------------------------------------------+
        ^                                      | SQLite Read/Write (WAL)
        | HTTP/REST                            v
+--------------------------------+   +----------------------------------+
|    Amnion Web Dashboard (SPA)  |   |    SQLite Database (WAL Mode)    |
|   (Vue 3 + Vite + Pinia Stores) |   |    (/var/lib/amnion/amnion.db)   |
+--------------------------------+   +----------------------------------+
```

### 2.1 Backend Domain Modules (`backend/src/modules/`)
- **Technologie**: Node.js v20+ met TypeScript en **Fastify**.
- **Domain Modules**:
  - `auth`: Server-side sessions, Argon2id hashing, rate limiting (300 req/min global, 30 req/15min login), CSRF.
  - `users`: UUID generatie, gebruiker beheer, status & data limieten.
  - `protocols`: Hysteria 2, TUIC v5 en VLESS+REALITY protocol definities.
  - `subscriptions`: Generatie van Hiddify-compatibele subscription links & SVG QR-codes.
  - `stats`: Systeem- en netwerkstatistieken via `/proc` en `/sys` & real-time RX/TX monitoring.
  - `system`: Systemd client voor sing-box atomic config swaps, update-status tracking en geautomatiseerde tarball rollbacks.

### 2.2 VPN Engine (`sing-box`)
- **Technologie**: `sing-box` (Go-gebaseerde universele netwerkproxy engine).
- **Kenmerken**: Single-binary daemon met native ondersteuning voor Hysteria 2, TUIC v5, en VLESS met REALITY en Vision flow.

### 2.3 Web Dashboard (`dashboard/`)
- **Technologie**: SPA gebouwd met Vite + Vue 3 + Pinia Stores + Vue Router + Tailwind CSS / Vanilla Glassmorphism CSS.

### 2.4 Database & Data Opslag (`database/`)
- **Technologie**: **SQLite3** in WAL (Write-Ahead Logging) modus (`/var/lib/amnion/amnion.db`).

---

## 3. Opslag- & Logbeheer (10 GB SSD Constraint)

Op VPS'en met slechts 10 GB schijfruimte mag het log- en tijdelijke bestandstotaal **nooit de 1 GB overschrijden**.

1. **Systemd Journald Limits**: Maximaal 100 MB (`/etc/systemd/journald.conf.d/amnion.conf`).
2. **Sing-box Log Rotating**: Geheugen-efficiënte stdout en `info`/`warn` loglevels.
3. **Database Audit Logs**: Automatische retentie van 30 dagen.

---

## 4. Installatie & Lifecycle Scripts (`install/`)

- `install.sh`: Schone, geautomatiseerde installatie op Ubuntu 20.04/22.04/24.04.
- `update.sh`: Back-up & veilige update met automatische rollback bij validatiefouten.
- `backup.sh`: Maakt instant hot backups van database, configuraties en TLS certs.
- `restore.sh`: Herstelt een eerder gemaakte tarball back-up.
- `repair.sh`: Herstelt bestand permissies, vernieuwt certs en herstart services.
- `uninstall.sh`: Nette verwijdering van Amnion en sing-box van het systeem.
