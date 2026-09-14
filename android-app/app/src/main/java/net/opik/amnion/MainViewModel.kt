package net.opik.amnion

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import net.opik.amnion.data.AmnionApi
import net.opik.amnion.data.ConnectionState
import net.opik.amnion.data.Region
import net.opik.amnion.data.SecureProfileStore
import net.opik.amnion.data.VpnProfile
import net.opik.amnion.data.VpnProtocol

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val store = SecureProfileStore(application)
    private val api = AmnionApi()
    private val diagnostics = application.getSharedPreferences("amnion_diagnostics", Application.MODE_PRIVATE)

    var profile by mutableStateOf(store.load())
        private set
    var selectedRegion by mutableStateOf(
        Region.entries.firstOrNull { it.id == profile?.regionId } ?: Region.NETHERLANDS
    )
        private set
    var displayName by mutableStateOf(profile?.displayName.orEmpty())
    var selectedProtocol by mutableStateOf(VpnProtocol.fromId(profile?.protocolId))
        private set
    var loading by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf(
        diagnostics.getString("last_vpn_stage", null)?.takeIf { it.startsWith("fout:") }
            ?.removePrefix("fout: ")?.let { "De vorige verbinding stopte bij: $it" }
    )
        private set
    var connectionState by mutableStateOf(ConnectionState.DISCONNECTED)
        private set
    var detectedIpv4 by mutableStateOf<String?>(null)
        private set
    var ipCheckMessage by mutableStateOf("Verbind om je VPN-IP te controleren")
        private set
    var ipCheckPassed by mutableStateOf<Boolean?>(null)
        private set

    fun setName(value: String) { displayName = value.take(32) }

    fun activate() {
        if (displayName.trim().length < 2) {
            errorMessage = "Vul een naam van minimaal twee tekens in."
            return
        }
        loading = true
        errorMessage = null
        viewModelScope.launch {
            runCatching {
                api.register(selectedRegion, displayName.trim(), store.installationId(), selectedProtocol)
            }.onSuccess(::activateProfile)
                .onFailure { errorMessage = it.message ?: "Amnion activeren is mislukt" }
            loading = false
        }
    }

    fun changeRegion(region: Region) {
        val current = profile ?: return
        if (region.id == current.regionId || loading) return
        if (connectionState == ConnectionState.CONNECTED || connectionState == ConnectionState.CONNECTING) {
            errorMessage = "Verbreek eerst de VPN om van land te wisselen."
            return
        }
        val previousRegion = selectedRegion
        selectedRegion = region
        loading = true
        errorMessage = null
        clearIpCheck()
        viewModelScope.launch {
            runCatching {
                val cached = store.load(region.id)
                val prepared = if (cached == null) {
                    api.register(region, displayName.trim(), store.installationId(), selectedProtocol)
                } else {
                    runCatching { api.refresh(region, cached) }.getOrElse {
                        api.register(region, displayName.trim(), store.installationId(), selectedProtocol)
                    }
                }
                if (prepared.protocolId == selectedProtocol.id) prepared
                else api.changeProtocol(region, prepared, selectedProtocol)
            }.onSuccess(::activateProfile)
                .onFailure {
                    selectedRegion = previousRegion
                    errorMessage = it.message ?: "Wisselen van land is mislukt"
                }
            loading = false
        }
    }

    fun changeProtocol(protocol: VpnProtocol) {
        val current = profile ?: return
        if (protocol.id == current.protocolId || loading) return
        if (connectionState == ConnectionState.CONNECTED || connectionState == ConnectionState.CONNECTING) {
            errorMessage = "Verbreek eerst de VPN om van protocol te wisselen."
            return
        }
        val previousProtocol = selectedProtocol
        selectedProtocol = protocol
        loading = true
        errorMessage = null
        clearIpCheck()
        viewModelScope.launch {
            runCatching { api.changeProtocol(selectedRegion, current, protocol) }
                .onSuccess(::activateProfile)
                .onFailure {
                    selectedProtocol = previousProtocol
                    errorMessage = it.message ?: "Protocol wisselen is mislukt"
                }
            loading = false
        }
    }

    fun resetUser() {
        if (connectionState == ConnectionState.CONNECTED || connectionState == ConnectionState.CONNECTING) return
        val oldProfiles = store.all()
        store.clear()
        profile = null
        selectedRegion = Region.NETHERLANDS
        selectedProtocol = VpnProtocol.VLESS_REALITY
        displayName = ""
        errorMessage = null
        clearIpCheck()
        oldProfiles.forEach { (regionId, stored) ->
            Region.entries.firstOrNull { it.id == regionId }?.let { region ->
                viewModelScope.launch { runCatching { api.revoke(region, stored) } }
            }
        }
    }

    fun updateConnection(status: String, message: String?) {
        connectionState = when (status) {
            "connecting" -> ConnectionState.CONNECTING
            "connected" -> ConnectionState.CONNECTED
            "error" -> ConnectionState.ERROR
            else -> ConnectionState.DISCONNECTED
        }
        when (status) {
            "connecting" -> {
                errorMessage = null
                detectedIpv4 = null
                ipCheckPassed = null
                ipCheckMessage = "VPN-route wordt gecontroleerd..."
            }
            "connected" -> {
                errorMessage = null
                diagnostics.edit().remove("last_vpn_stage").apply()
                verifyExitIp()
            }
            "error" -> {
                errorMessage = message ?: "De VPN-verbinding is gestopt"
                ipCheckPassed = false
                ipCheckMessage = "VPN-route kon niet worden gecontroleerd"
            }
            else -> clearIpCheck()
        }
    }

    private fun activateProfile(updated: VpnProfile) {
        store.save(updated)
        profile = updated
        displayName = updated.displayName
        selectedRegion = Region.entries.firstOrNull { it.id == updated.regionId } ?: selectedRegion
        selectedProtocol = VpnProtocol.fromId(updated.protocolId)
    }

    private fun verifyExitIp() {
        val expectedRegion = selectedRegion
        detectedIpv4 = null
        ipCheckPassed = null
        ipCheckMessage = "Extern IPv4 controleren..."
        viewModelScope.launch {
            var lastIp: String? = null
            repeat(3) { attempt ->
                if (connectionState != ConnectionState.CONNECTED) return@launch
                if (attempt > 0) delay(1_500)
                val result = runCatching { api.publicIpv4() }
                lastIp = result.getOrNull()
                if (lastIp == expectedRegion.exitIpv4) {
                    detectedIpv4 = lastIp
                    ipCheckPassed = true
                    ipCheckMessage = "IPv4 loopt via ${expectedRegion.label}"
                    return@launch
                }
            }
            detectedIpv4 = lastIp
            ipCheckPassed = if (lastIp == null) null else false
            ipCheckMessage = if (lastIp == null) {
                "IP-controle tijdelijk niet bereikbaar"
            } else {
                "Let op: dit is niet het IP van ${expectedRegion.label}"
            }
        }
    }

    private fun clearIpCheck() {
        detectedIpv4 = null
        ipCheckPassed = null
        ipCheckMessage = "Verbind om je VPN-IP te controleren"
    }
}
