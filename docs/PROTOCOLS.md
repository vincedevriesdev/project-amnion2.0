# Project Amnion 2.0 - VPN Protocollen & Hiddify Next Integratie

## 1. Protocoloverzicht

Project Amnion 2.0 gebruikt **sing-box** om drie moderne protocollen te ondersteunen. Elk protocol dient een specifiek netwerkscenario.

---

### 🚀 1. Hysteria 2 (HY2)

- **Transport**: QUIC / UDP (Poort 8443)
- **Congestion Control**: Agressieve BBR-variant
- **Beste Use Case**: Slechte mobiele verbindingen (4G/5G), drukke Wi-Fi-netwerken, netwerken met pakketverlies (packet loss).
- **Werking**:
  - Hysteria2 is specifiek ontworpen om maximale snelheden te behalen op instabiele of gecensureerde netwerken met hoog pakketverlies.
  - Maakt gebruik van UDP en een gemodificeerd QUIC-protocol dat verloren pakketjes razendsnel herstelt zonder de doorvoer (throughput) in te storten.
- **Voor- & Nadelen**:
  - ✅ Extreem snel op mobiele data en instabiele Wi-Fi.
  - ✅ Bestand tegen pakketverlies.
  - ❌ UDP-verkeer kan door sommige hele strenge ISP's (of netwerken op scholen/hotels) gecapped of geblokkeerd worden.

---

### ⚡ 2. TUIC (v5)

- **Transport**: QUIC / UDP (Poort 8444)
- **Handshake**: 0-RTT (Zero Round-Trip Time)
- **Beste Use Case**: Hoge internetsnelheden met minimale latency (browsing, VoIP, gaming).
- **Werking**:
  - TUIC combineert QUIC multiplexing met 0-RTT handshakes. Dit betekent dat bij het openen van nieuwe verbindingen de vertraging (latency) minimaal is.
- **Voor- & Nadelen**:
  - ✅ Extreem lage latency en snelle opstarttijd van verbindingen.
  - ✅ Efficiënte multiplexing (meerdere streams over 1 UDP socket).
  - ❌ Vereist een goed UDP-netwerk zonder zware throttling.

---

### 🛡️ 3. VLESS + REALITY

- **Transport**: TCP + TLS Camouflage (Poort 443)
- **Handshake**: Direct TLS SNI Mimicry (Vision flow)
- **Beste Use Case**: Netwerken met Deep Packet Inspection (DPI) of strikte firewalls (zoals GFW, bedrijfsinternet of openbare netwerken die VPN-verkeer blokkeren).
- **Werking**:
  - REALITY omzeilt de noodzaak voor een eigen TLS-certificaat door het TLS-handshakeverkeer te vermommen als regulier HTTPS-verkeer naar een legitieme externe website (bijv. `dl.google.com`, `www.microsoft.com` of `icloud.com`).
  - Een DPI-firewall ziet alleen een normale, beveiligde HTTPS-sessie naar een vertrouwde domeinnaam.
- **Voor- & Nadelen**:
  - ✅ Onzichtbaar voor geavanceerde DPI-firewalls.
  - ✅ Geen eigen domeinnaam of TLS-certificaat vereist voor dit specifieke protocol.
  - ✅ Werkt op traditioneel TCP (vrijwel nooit geblokkeerd door ISP's).
  - ❌ Iets complexere configuratie (vereist EC25519 keypair generation & SNI selectie).

---

## 2. Hiddify Next Compatibility & Subscription Standards

Hiddify Next is de officiële client voor Project Amnion 2.0. Het dashboard genereert automatisch de volgende indelingen met vriendelijke Emoji-labels:

1. **Subscriptie URL (`http://<server-host>:3000/api/v1/sub/<token>`)**:
   - Geef een Hiddify-compatibele Base64 configuratie-stream terug.
   - Hiddify Next kan deze link periodiek auto-vernieuwen.
2. **Directe URI Schemas**:
   - Hysteria 2: `hysteria2://<uuid>@<host>:8443?insecure=1&sni=<domain>#🚀 HY2 (Mobiel 4G/5G) - <username>`
   - TUIC v5: `tuic://<uuid>:<uuid>@<host>:8444?congestion_control=bbr&allow_insecure=1&insecure=1&sni=<domain>#⚡ TUIC v5 (Lage Latency) - <username>`
   - VLESS REALITY: `vless://<uuid>@<host>:443?type=tcp&security=reality&pbk=<public_key>&fp=chrome&sni=dl.google.com&sid=<short_id>&flow=xtls-rprx-vision#🛡️ VLESS REALITY (Camouflage) - <username>`
3. **QR Codes**:
   - Genereert SVG / PNG QR-codes van de URI's of Subscription URL voor directe camera-import in de mobiele Hiddify app.
