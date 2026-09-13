# Amnion VPN voor Android

Native Android-client voor Project Amnion, gebouwd met Kotlin, Jetpack Compose, Android `VpnService` en sing-box/libbox.

De app:

- kiest tussen de vooraf ingestelde Nederlandse en Duitse regio;
- maakt via de mobiele Amnion-API een persoonlijk profiel aan;
- slaat profiel en apparaat-token AES-GCM-versleuteld op met Android Keystore;
- bewaart de toegangscode niet;
- laat bestaande webdashboard- en Hiddify-functionaliteit volledig intact.

Vereisten: JDK 17 en Android SDK 35. Bouw lokaal met `gradlew.bat assembleDebug` op Windows of `./gradlew assembleDebug` op Linux/macOS. Zie `docs/MOBILE_APP.md` in de repositoryroot voor provisioning en release signing.

De APK is relatief groot omdat één universeel bestand de native sing-box-engine voor ARM32, ARM64, x86 en x86_64 bevat.
