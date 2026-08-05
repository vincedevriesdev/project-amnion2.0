# Project Amnion 2.0 - REST API Specification

Alle API endpoints zijn geprefixeerd met `/api/v1`. Authenticatie voor admin endpoints verloopt via de `amnion_session` HTTP-Only cookie.

---

## 🔒 Rate Limiting Specificaties

- **Globaal API Limiet**: Maximaal **300 verzoeken per minuut** per IP-adres (voorkomt Rate Limit / 429 fouten bij real-time dashboard polling).
- **Login Endpoint (`/api/v1/auth/login`)**: Maximaal **30 pogingen per 15 minuten** per IP-adres.

---

## 🔐 Authenticatie (`/api/v1/auth`)

### `POST /api/v1/auth/login`
Logt een admin in en zet de `amnion_session` cookie.

**Rate Limit**: Max 30 pogingen per 15 minuten per IP.

**Request Body**:
```json
{
  "username": "admin",
  "password": "AmnionAdmin2026!"
}
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "admin": {
    "id": "uuid-v4",
    "username": "admin",
    "role": "admin"
  }
}
```

---

### `POST /api/v1/auth/logout`
Beëindigt de huidige admin sessie en wist de `amnion_session` cookie.

---

### `GET /api/v1/auth/me`
Controleert en retourneert de huidige admin sessie status.

---

## 👥 Gebruikersbeheer (`/api/v1/users`)

### `GET /api/v1/users`
Haalt alle geregistreerde VPN-gebruikers op inclusief UUID's, actieve protocollen, datalimieten en Hiddify subscription tokens.

---

### `POST /api/v1/users`
Maakt een nieuwe VPN-gebruiker aan, kent geselecteerde protocollen toe en genereert automatisch UUID's en subscription tokens.

**Request Body**:
```json
{
  "username": "vince-phone",
  "dataLimitBytes": 0,
  "expireAt": null,
  "protocols": ["hysteria2", "tuic", "vless_reality"]
}
```

---

### `PUT /api/v1/users/:id`
Bewerkt de status, datalimiet, vervaldatum of toegewezen protocollen van een gebruiker. Triggert automatisch een atomische sing-box herlaad.

---

### `DELETE /api/v1/users/:id`
Verwijdert een VPN-gebruiker en herlaadt de sing-box engine.

---

### `POST /api/v1/users/:id/reset-token`
Genereert een nieuw Hiddify abonnement-token voor de gebruiker.

---

## 📲 Hiddify Subscriptions (`/api/v1/sub`)

### `GET /api/v1/sub/:token` (Publiek Endpoint)
Publiek endpoint voor Hiddify Next. Genereert een Base64-gecodeerde URI-lijst van alle actieve protocollen (HY2, TUIC v5, VLESS REALITY).

**Headers**:
- `profile-title`: `Amnion VPN - <username>`
- `Subscription-Userinfo`: `upload=0; download=usedBytes; total=limit; expire=timestamp` (omitted `total=` for unlimited users to display "Unlimited" cleanly in Hiddify).

---

### `GET /api/v1/sub/qr/svg?text=<URI>`
Genereert een SVG QR-code afbeelding voor snelle camera-import.

---

## ⚙️ Systeem & Dashboard (`/api/v1/system`)

### `GET /api/v1/system/update-status`
Retourneert het huidige update-proces status (0-100% voortgang, actieve stap en logs).

---

### `POST /api/v1/system/trigger-update`
Start de geautomatiseerde update- en rollback engine im de achtergrond.

---

### `POST /api/v1/system/reload-singbox`
Voert een atomische Sing-box configuratieswap en service reload uit.

---

### `PUT /api/v1/system/change-password`
Wijzigt het admin wachtwoord via Argon2id.

---

## 📊 Monitoring & Statistieken (`/api/v1/stats`)

### `GET /api/v1/stats/overview`
Haalt real-time CPU belasting, RAM gebruik, schijfgebruik (SSD), netwerksnelheid (RX/TX bytes/sec) en protocolverdeling op.
