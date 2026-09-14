# Amnion Android-app en mobiele toegang

De map `android-app/` bevat een zelfstandige Android VPN-client. Het bestaande webdashboard, de abonnementlinks en Hiddify-profielen blijven werken. Mobiele apparaten gebruiken dezelfde gebruikers- en sing-box-laag via een afzonderlijke, optioneel ingeschakelde API.

## Architectuur

- De app vraagt bij de eerste start alleen om een herkenbare naam.
- Daarna kan de gebruiker zonder nieuwe handmatige registratie tussen Nederland, Duitsland, VLESS + REALITY, Hysteria2 en TUIC wisselen.
- De app maakt de benodigde toegang per regio automatisch aan. Alle drie protocollen worden server-side voor die gebruiker geactiveerd, zodat protocolwissels geen sing-box-herstart vereisen.
- Nieuwe appregistraties zijn bewust openbaar voor bezitters van de APK en worden begrensd met IP-rate-limits. Er is geen appwachtwoord of toegangscode.
- Android bewaart per regio de apparaat-token en sing-box-configuratie versleuteld met een niet-exporteerbare Android Keystore-sleutel.
- Na verbinden vraagt de app via de VPN-route het externe IPv4-adres op en vergelijkt dat met de gekozen uitgang.
- De mobiele API gebruikt TLS op `https://<domein>:9443/api/v1/mobile`. Poort 9443 geeft geen dashboard- of beheerroutes door.

## API activeren

Na een installatie of update:

```bash
bash /opt/amnion/install/mobile-access.sh enable nl "Nederland"
```

Andere acties:

```bash
bash /opt/amnion/install/mobile-access.sh status
bash /opt/amnion/install/mobile-access.sh disable
```

Uitschakelen blokkeert nieuwe mobiele API-aanvragen. Bestaande normale Amnion/Hiddify-profielen blijven werken.

## Omgevingsvariabelen

| Variabele | Standaard | Betekenis |
| --- | --- | --- |
| `MOBILE_PROVISIONING_ENABLED` | `false` | Zet de mobiele API aan of uit |
| `MOBILE_REGION_ID` | `standalone` | Stabiele korte regio-id, bijvoorbeeld `nl` |
| `MOBILE_REGION_NAME` | `Deze server` | Naam die de app toont |
| `MOBILE_PROFILE_PROTOCOLS` | alle drie | Allowlist: `vless_reality,hysteria2,tuic` |
| `MOBILE_DATA_LIMIT_BYTES` | `0` | Limiet per mobiele gebruiker; 0 is onbeperkt |
| `MOBILE_PROFILE_DAYS` | `0` | Geldigheidsduur; 0 verloopt niet automatisch |
| `CONTROL_PLANE_HTTPS_PORT` | `9443` | TLS-poort van de mobiele control-plane |

## Endpoints

- `GET /api/v1/mobile/region` — publieke regiometadata, met rate-limit.
- `POST /api/v1/mobile/register` — naam en installatie-id vereist; maximaal tien pogingen per IP per uur.
- `POST /api/v1/mobile/profile/refresh` — beperkte bearer apparaat-token vereist.
- `POST /api/v1/mobile/profile/protocol` — selecteert het gewenste protocol zonder sing-box-herstart.
- `POST /api/v1/mobile/profile/revoke` — trekt de regionale apparaattoegang in en verwijdert de mobiele gebruiker.

Antwoorden met VPN-configuraties hebben `Cache-Control: no-store`. De reverse proxy vertrouwt geen door de internetclient aangeleverde IP-headers.

## Android bouwen

Voor een debugbuild:

```bash
cd android-app
./gradlew assembleDebug
```

Een blijvend ondertekende release gebruikt uitsluitend lokale omgevingsvariabelen; zet de keystore nooit in Git:

```text
AMNION_SIGNING_STORE_FILE
AMNION_SIGNING_STORE_PASSWORD
AMNION_SIGNING_KEY_ALIAS
AMNION_SIGNING_KEY_PASSWORD
```

Daarna bouwt `./gradlew assembleRelease` de release-APK. De vaste regiourls en verwachte uitgangs-IP's staan in de Android-code.

## Certificaatvernieuwing

Installatie en update plaatsen een Certbot deploy-hook die `amnion-control-plane` na een geslaagde Let's Encrypt-vernieuwing herstart. Hierdoor pakt de API automatisch het vernieuwde certificaat op.
