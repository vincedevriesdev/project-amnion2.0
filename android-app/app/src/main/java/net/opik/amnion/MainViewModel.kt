package net.opik.amnion

import android.app.Application
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
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
    var displayName by mutableStateOf(profile?.displayName.orEmpty())
    var selectedProtocol by mutableStateOf(VpnProtocol.fromId(profile?.protocolId))
    var accessCode by mutableStateOf("")
    var loading by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf(
        diagnostics.getString("last_vpn_stage", null)?.takeIf { it.startsWith("fout:") }
            ?.removePrefix("fout: ")?.let { "De vorige verbinding stopte bij: $it" }
    )
        private set
    var connectionState by mutableStateOf(ConnectionState.DISCONNECTED)
        private set

    fun selectRegion(region: Region) { selectedRegion = region }
    fun selectProtocol(protocol: VpnProtocol) { selectedProtocol = protocol }
    fun setName(value: String) { displayName = value.take(32) }
    fun updateAccessCode(value: String) { accessCode = value.take(128) }

    fun provision() {
        if (displayName.trim().length < 2) {
            errorMessage = "Vul een naam van minimaal twee tekens in."
            return
        }
        if (accessCode.length < 8) {
            errorMessage = "Vul je Amnion-toegangscode in."
            return
        }
        loading = true
        errorMessage = null
        viewModelScope.launch {
            runCatching {
                api.register(selectedRegion, displayName.trim(), accessCode, store.installationId(), selectedProtocol)
            }.onSuccess { created ->
                store.save(created)
                profile = created
                accessCode = ""
            }.onFailure { errorMessage = it.message ?: "Registreren is mislukt" }
            loading = false
        }
    }

    fun changeProtocol(protocol: VpnProtocol) {
        val current = profile ?: return
        if (connectionState == ConnectionState.CONNECTED || connectionState == ConnectionState.CONNECTING) {
            errorMessage = "Verbreek eerst de VPN om van protocol te wisselen."
            return
        }
        val region = Region.entries.firstOrNull { it.id == current.regionId } ?: return
        selectedProtocol = protocol
        loading = true
        errorMessage = null
        viewModelScope.launch {
            runCatching { api.changeProtocol(region, current, protocol) }
                .onSuccess { updated ->
                    store.save(updated)
                    profile = updated
                }
                .onFailure {
                    selectedProtocol = VpnProtocol.fromId(current.protocolId)
                    errorMessage = it.message ?: "Protocol wisselen is mislukt"
                }
            loading = false
        }
    }

    fun forgetProfile() {
        val oldProfile = profile
        store.clear()
        profile = null
        selectedProtocol = VpnProtocol.VLESS_REALITY
        connectionState = ConnectionState.DISCONNECTED
        if (oldProfile != null) {
            val oldRegion = Region.entries.firstOrNull { it.id == oldProfile.regionId }
            if (oldRegion != null) viewModelScope.launch {
                // Local removal must always work; server cleanup is best-effort
                // in case the selected server is temporarily offline.
                runCatching { api.revoke(oldRegion, oldProfile) }
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
            "connecting" -> errorMessage = null
            "connected" -> {
                errorMessage = null
                diagnostics.edit().remove("last_vpn_stage").apply()
            }
            "error" -> errorMessage = message ?: "De VPN-verbinding is gestopt"
        }
    }
}
