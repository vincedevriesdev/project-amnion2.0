# Amnion VPN voor Android

Native Android-client voor Project Amnion, gebouwd met Kotlin, Jetpack Compose, Android `VpnService` en sing-box/libbox.

De app:

- vraagt bij de eerste start alleen om een herkenbare naam;
- wisselt daarna direct tussen Nederland, Duitsland, VLESS + REALITY, Hysteria2 en TUIC;
- beheert de benodigde regionale apparaattoegang automatisch op de achtergrond;
- slaat apparaat-tokens en sing-box-configuraties AES-GCM-versleuteld op met Android Keystore;
- controleert na verbinden welk extern IPv4-adres websites werkelijk zien;
- laat bestaande webdashboard- en Hiddify-functionaliteit volledig intact.

Vereisten: JDK 17 en Android SDK 35. Bouw lokaal met `gradlew.bat assembleDebug` op Windows of `./gradlew assembleDebug` op Linux/macOS. Zie `docs/MOBILE_APP.md` in de repositoryroot voor provisioning en release signing.

De APK is relatief groot omdat één universeel bestand de native sing-box-engine voor ARM32, ARM64, x86 en x86_64 bevat.
