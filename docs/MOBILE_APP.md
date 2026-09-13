# Amnion Android-app en mobiele provisioning

De map `android-app/` bevat een zelfstandige Android VPN-client. Het bestaande webdashboard, de abonnementlinks en Hiddify-profielen zijn niet vervangen of visueel aangepast. Mobiele accounts gebruiken dezelfde gebruikers- en sing-box-laag, maar krijgen een afzonderlijke, optioneel ingeschakelde provisioning-API.

## Architectuur

- De app laat de gebruiker een vooraf ingebouwde regio en VPN-protocol kiezen en vraagt om een weergavenaam en toegangscode.
- Registratie verloopt uitsluitend via TLS op `https://<domein>:9443/api/v1/mobile`.
- De toegangscode wordt niet op de telefoon bewaard. Op de server staat alleen een SHA-256-hash van een willekeurige code.
- Na registratie bewaart Android de apparaat-token en sing-box-config versleuteld met een niet-exporteerbare Android Keystore-sleutel.
- Het VPN-verkeer loopt via Android `VpnService` en sing-box/libbox. De gebruiker kan kiezen tussen VLESS + REALITY, Hysteria2 en TUIC en later wisselen zonder opnieuw te registreren.
- Poort 9443 geeft alleen de mobiele API door; dashboard- en beheerroutes zijn daar niet beschikbaar.

## API activeren

Na een installatie of update:

```bash
bash /opt/amnion/install/mobile-access.sh enable nl "Nederland" "EEN-LANGE-WILLEKEURIGE-CODE"
```

Gebruik op alle regio's dezelfde code als één app-code toegang tot alle regio's moet geven. Laat het laatste argument weg om een sterke code te laten genereren. De eenmalige lokale kopie staat alleen voor root leesbaar in `/root/amnion-mobile-access-code.txt`.

Andere acties:

```bash
bash /opt/amnion/install/mobile-access.sh status
bash /opt/amnion/install/mobile-access.sh disable
```

Uitschakelen verwijdert de lokale kopie van de toegangscode en blokkeert nieuwe API-aanvragen. Bestaande normale Amnion/Hiddify-profielen blijven werken.

## Omgevingsvariabelen

| Variabele | Standaard | Betekenis |
| --- | --- | --- |
| `MOBILE_PROVISIONING_ENABLED` | `false` | Zet de mobiele API aan of uit |
| `MOBILE_REGION_ID` | `standalone` | Stabiele korte regio-id, bijvoorbeeld `nl` |
| `MOBILE_REGION_NAME` | `Deze server` | Naam die de app toont |
| `MOBILE_ACCESS_CODE_HASHES` | leeg | Komma-gescheiden SHA-256-hashes |
| `MOBILE_PROFILE_PROTOCOLS` | alle drie | Allowlist: `vless_reality,hysteria2,tuic` |
| `MOBILE_DATA_LIMIT_BYTES` | `0` | Limiet per mobiel profiel; 0 is onbeperkt |
| `MOBILE_PROFILE_DAYS` | `0` | Geldigheidsduur; 0 verloopt niet automatisch |
| `CONTROL_PLANE_HTTPS_PORT` | `9443` | TLS-poort van de mobiele control-plane |

## Endpoints

- `GET /api/v1/mobile/region` — publieke regiometadata, met rate-limit.
- `POST /api/v1/mobile/register` — toegangscode vereist; maximaal vijf pogingen per IP per uur.
- `POST /api/v1/mobile/profile/refresh` — bearer apparaat-token vereist.
- `POST /api/v1/mobile/profile/revoke` — trekt het mobiele profiel in en verwijdert de bijbehorende VPN-gebruiker.

- `POST /api/v1/mobile/profile/protocol` — wisselt het protocol; bearer apparaat-token vereist.

Antwoorden met profielen hebben `Cache-Control: no-store`. De reverse proxy vertrouwt geen door de internetclient aangeleverde IP-headers.

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

Daarna bouwt `./gradlew assembleRelease` de release-APK. De vaste regiourls staan als buildconfiguratie in `android-app/app/build.gradle.kts`.

## Certificaatvernieuwing

Installatie en update plaatsen een Certbot deploy-hook die `amnion-control-plane` na een geslaagde Let's Encrypt-vernieuwing herstart. Hierdoor pakt de API automatisch het vernieuwde certificaat op.
