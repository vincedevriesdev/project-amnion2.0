package net.opik.amnion.data

import net.opik.amnion.BuildConfig

enum class Region(
    val id: String,
    val label: String,
    val city: String,
    val code: String,
    val apiUrl: String,
    val exitIpv4: String
) {
    NETHERLANDS("nl", "Nederland", "Amsterdam", "NL", BuildConfig.NL_API_URL, "37.148.192.166"),
    GERMANY("de", "Duitsland", "Frankfurt", "DE", BuildConfig.DE_API_URL, "217.154.169.67")
}

enum class VpnProtocol(
    val id: String,
    val label: String,
    val shortLabel: String,
    val description: String,
    val port: Int
) {
    VLESS_REALITY("vless_reality", "VLESS + REALITY", "VLESS", "Betrouwbaar en lastig te blokkeren", 443),
    HYSTERIA2("hysteria2", "Hysteria 2", "HY2", "Snel op wisselende netwerken", 8443),
    TUIC("tuic", "TUIC v5", "TUIC", "Lage latency voor games", 8444);

    companion object {
        fun fromId(id: String?): VpnProtocol = entries.firstOrNull { it.id == id } ?: VLESS_REALITY
    }
}

data class VpnProfile(
    val regionId: String,
    val regionLabel: String,
    val displayName: String,
    val deviceToken: String,
    val protocolId: String,
    val configJson: String
)

enum class ConnectionState { DISCONNECTED, CONNECTING, CONNECTED, ERROR }
