package net.opik.amnion.data

import net.opik.amnion.BuildConfig

enum class Region(val id: String, val label: String, val city: String, val flag: String, val apiUrl: String) {
    NETHERLANDS("nl", "Nederland", "Amsterdam", "🇳🇱", BuildConfig.NL_API_URL),
    GERMANY("de", "Duitsland", "Duitsland", "🇩🇪", BuildConfig.DE_API_URL)
}

data class VpnProfile(
    val regionId: String,
    val regionLabel: String,
    val displayName: String,
    val deviceToken: String,
    val configJson: String
)

enum class ConnectionState { DISCONNECTED, CONNECTING, CONNECTED, ERROR }
