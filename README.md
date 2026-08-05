# Project Amnion 2.0

[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Platform: Ubuntu](https://img.shields.io/badge/Platform-Ubuntu%2020.04%20%7C%2022.04%20%7C%2024.04-orange.svg)](https://ubuntu.com)
[![Engine: sing-box](https://img.shields.io/badge/Engine-sing--box-blue.svg)](https://sing-box.sagernet.org/)
[![Client: Hiddify Next](https://img.shields.io/badge/Client-Hiddify%20Next-green.svg)](https://hiddify.com/)

---

## 🌟 Introductie: Wat is Project Amnion 2.0?

**Project Amnion 2.0** is een krachtig, modern en privacygericht **self-hosted VPN-beheerplatform** ontworpen voor Ubuntu Linux-servers. 

Het is speciaal gebouwd om individuen en organisaties te voorzien van een eigen, onafhankelijke VPN-infrastructuur die **100% bestand is tegen censuur, Deep Packet Inspection (DPI) en netwerkblokkades**. Amnion 2.0 combineert de razendsnelle Go-gebaseerde **sing-box** VPN-engine met een schitterend Glassmorphism webdashboard (Vue 3 + Vite + Fastify TypeScript) en een volledig geautomatiseerde 1-line installer en live update-engine.

> [!NOTE]
> ### 💡 Geïnspireerd door AmneziaVPN
> **Project Amnion 2.0** ontleent zijn filosofie en visie aan het fantastische open-source project **[AmneziaVPN](https://amnezia.org/)**. 
> Waar AmneziaVPN pionierde met het idee van een self-hosted, anti-censuur VPN-infrastructuur onder eigen beheer, herinterpreteert Amnion 2.0 deze visie tot een extreem lichtgewicht, web-gebaseerd platform dat geoptimaliseerd is voor minimale resource-footprints (<100 MB RAM, <500 MB schijfruimte), native **sing-box 1.9** protocol-integratie (Hysteria 2, TUIC v5, VLESS REALITY) en directe mobiele uitrol via **Hiddify Next**.

---

## 🔑 Belangrijkste Kenmerken

- 🚀 **Multi-Protocol Engine**: Beheer **Hysteria 2 (UDP 8443)**, **TUIC v5 (UDP 8444)**, en **VLESS + REALITY (TCP 443)** vanuit één centraal dashboard.
- 📲 **Naadloze Hiddify Next Integratie**: Automatische generatie van Hiddify-compatibele configuraties, QR-codes en self-healing abonnement-links.
- ⚡ **Extreem Lichtgewicht**: Geoptimaliseerd voor goedkope VPS-omgevingen met beperkte opslag (minder dan 500 MB schijfruimte en <100 MB RAM-geheugen).
- 🛡️ **Enterprise Beveiliging**: Argon2id wachtwoord-hashing, cryptografische sessies, rate-limiting (300 req/min algemeen, 30 req/15min login), CSRF-bescherming en geautomatiseerde Let's Encrypt / fallback TLS-certificaten.
- 📊 **Real-time Monitoring & Analytics**: Live inzicht in CPU, RAM, SSD schijfgebruik, live RX/TX netwerksnelheid, actieve sessies en protocolverdeling.
- 🔄 **Automated Installer & Rollback Engine**: Eenvoudige 1-line installatie, live voortgangstracker op het dashboard en geautomatiseerde tarball rollbacks bij fouten.

---

## 🛠️ Snelle Installatie (Ubuntu 20.04 / 22.04 / 24.04 LTS)

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
> Pas het standaard wachtwoord **direct aan** na de eerste keer inloggen! Dit kan vanuit het menu **Instellingen** in het dashboard.

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
├── dashboard/              # Web Dashboard SPA (Vue 3 / Vite / Tailwind)
├── config/                 # Sing-box & Systemd configuratiesjablonen
├── docs/                   # Uitgebreide documentatie (Architectuur, Security, Protocollen, Database, API)
├── scripts/                # Onderhouds- en back-upscripts
└── README.md
```

---

## 📖 Documentatie

- [Installatie-, Update- & Diagnosehandleiding](docs/INSTALLATION.md)
- [Beveiligingsarchitectuur & Threat Model](docs/SECURITY.md)
- [Architectuur Overzicht & Componenten](docs/ARCHITECTURE.md)
- [Ondersteunde Protocollen & Netwerkcompatibiliteit](docs/PROTOCOLS.md)
- [REST API Specificatie](docs/API.md)
- [Database Schema Specificatie](docs/DATABASE.md)

---

## 📄 Licentie

Gepubliceerd onder de **GNU General Public License v3.0 (GPLv3)**. Zie [LICENSE](LICENSE) voor meer informatie.
