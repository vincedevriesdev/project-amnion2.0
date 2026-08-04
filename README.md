# Project Amnion 2.0

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Platform: Ubuntu](https://img.shields.io/badge/Platform-Ubuntu%2020.04%20%7C%2022.04%20%7C%2024.04-orange.svg)](https://ubuntu.com)
[![Engine: sing-box](https://img.shields.io/badge/Engine-sing--box-blue.svg)](https://sing-box.sagernet.org/)
[![Client: Hiddify Next](https://img.shields.io/badge/Client-Hiddify%20Next-green.svg)](https://hiddify.com/)

**Project Amnion 2.0** is een modern, privacygericht, self-hosted VPN-platform voor Ubuntu Linux-servers. Het combineert de kracht en snelheid van de **sing-box** core engine met een intuïtief, modern webdashboard en 1-click uitrol.

---

## 🔑 Belangrijkste Kenmerken

- 🚀 **Multi-protocol Engine**: Beheer **Hysteria 2 (UDP 8443)**, **TUIC v5 (UDP 8444)**, en **VLESS + REALITY (TCP 443)** vanuit één centraal dashboard.
- 📲 **Naadloze Hiddify Next Integratie**: Automatische generatie van Hiddify-compatibele configuraties, QR-codes en self-healing abonnement-links.
- ⚡ **Extreem Lichtgewicht**: Geoptimaliseerd voor VPS-omgevingen met beperkte opslag (minder dan 500 MB schijfruimte en <100 MB RAM-geheugen).
- 🛡️ **Hoge Beveiliging**: Geïntegreerde Argon2id hashing, JWT/Session-authenticatie, CSRF-bescherming, rate-limiting en geautomatiseerde Let's Encrypt TLS-vernieuwing.
- 📊 **Real-time Monitoring & Analyses**: Direct inzicht in CPU, RAM, SSD schijfgebruik, live RX/TX netwerksnelheid, actieve sessies en protocolverdeling.
- 🔄 **Automated Installer & Live Update Engine**: Eenvoudige 1-line installatie, live voortgangstracker op het dashboard en geautomatiseerde tarball rollbacks bij fouten.

---

## 🛠️ Snelle Installatie (Ubuntu 20.04 / 22.04 / 24.04)

Voer het volgende commando uit als `root` op een schone Ubuntu VPS:

```bash
bash <(curl -fsSL -H "Cache-Control: no-cache" https://raw.githubusercontent.com/vincedevriesdev/project-amnion2.0/main/install/install.sh)
```

### 🔑 Standaard Inloggegevens (Eerste keer inloggen)

Na de installatie is het Web Dashboard bereikbaar via `http://<JOUW-VPS-IP>:3000` (of via jouw gekoppelde domeinnaam).

- **Gebruikersnaam**: `admin`
- **Wachtwoord**: `AmnionAdmin2026!`

> [!CAUTION]
> **BELANGRIJK VOOR JE BEVEILIGING**:
> Pas het standaard wachtwoord **direct aan** na de eerste keer inloggen! Dit kan vanuit de **Instellingen** in het dashboard.

---

## 🔄 Updates Uitvoeren

Je kunt Project Amnion 2.0 op twee manieren bijwerken naar de nieuwste versie:

1. **Via het Dashboard Panel**: Ga naar **Instellingen** ➔ **Amnion 2.0 Update Uitvoeren** en volg de live voortgangsindicator!
2. **Via de VPS Terminal**: Voer `bash /opt/amnion/install/update.sh` uit op je VPS als `root`.

---

## 📁 Repository Structuur

```text
project-amnion/
├── install/                # Geautomatiseerde installatie- en updatescripts
├── backend/                # Fastify TypeScript REST API & Control Daemon
├── dashboard/              # Web Dashboard SPA (Vue 3 / Vite)
├── config/                 # Sing-box & Systemd configuratiesjablonen
├── docs/                   # Uitgebreide documentatie (Architectuur & Protocollen)
├── scripts/                # Onderhouds- en back-upscripts
└── README.md
```

---

## 📖 Documentatie

- [Installatie-, Update- & Diagnosehandleiding](docs/INSTALLATION.md)
- [Architectuur Overzicht](docs/ARCHITECTURE.md)
- [Ondersteunde Protocollen & Netwerkcompatibiliteit](docs/PROTOCOLS.md)

---

## 📄 Licentie

Gepubliceerd onder de **MIT License**. Zie [LICENSE](LICENSE) voor meer informatie.
