# Project Amnion 2.0 - REST API Specification

Alle API endpoints zijn geprefixeerd met `/api/v1`. Authenticatie voor admin endpoints verloopt via de `amnion_session` HTTP-Only cookie.

---

## 🔐 Authenticatie (`/api/v1/auth`)

### `POST /api/v1/auth/login`
Logt een admin in en zet de `amnion_session` cookie.

**Rate Limit**: Max 5 pogingen per 15 minuten per IP.

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
Minstens 1 ingelogde sessie beëindigen en wist de cookie.

---

### `GET /api/v1/auth/me`
Controleert de huidige admin sessie status.

---

## 👥 Gebruikersbeheer (`/api/v1/users`)

### `GET /api/v1/users`
Haalt alle geregistreerde VPN-gebruikers op inclusief UUID's, actieve protocollen en Hiddify subscription tokens.

---

### `POST /api/v1/users`
Maakt een nieuwe VPN-gebruiker aan en genereert automatisch UUID en subscription tokens.

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
Bewerkt status of protocollen van een gebruiker.

---

### `DELETE /api/v1/users/:id`
Verwijder een VPN-gebruiker.

---

## 📲 Hiddify Subscriptions (`/api/v1/sub`)

### `GET /api/v1/sub/:token` (Publiek Endpoint)
Publiek endpoint voor Hiddify Next. Genereert een Base64-gecodeerde URI-lijst van alle actieve protocollen.

**Headers**:
- `Subscription-Userinfo`: `upload=0; download=usedBytes; total=limit; expire=timestamp`

---

### `GET /api/v1/sub/qr/svg?text=<URI>`
Genereert een SVG QR-code afbeelding.

---

## 📊 Monitoring & Systeem (`/api/v1/stats` & `/api/v1/system`)

### `GET /api/v1/stats/overview`
Haalt real-time CPU belasting, RAM gebruik, uptime en protocolverdeling op.

---

### `POST /api/v1/system/reload-singbox`
Voert een atomische configuratieswap uit (`config.json.tmp` -> `sing-box check` -> atomic rename -> `systemctl reload sing-box`).
