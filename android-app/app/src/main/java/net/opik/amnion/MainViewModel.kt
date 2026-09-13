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

class MainViewModel(application: Application) : AndroidViewModel(application) {
    private val store = SecureProfileStore(application)
    private val api = AmnionApi()

    var profile by mutableStateOf(store.load())
        private set
    var selectedRegion by mutableStateOf(
        Region.entries.firstOrNull { it.id == profile?.regionId } ?: Region.NETHERLANDS
    )
    var displayName by mutableStateOf(profile?.displayName.orEmpty())
    var accessCode by mutableStateOf("")
    var loading by mutableStateOf(false)
        private set
    var errorMessage by mutableStateOf<String?>(null)
        private set
    var connectionState by mutableStateOf(ConnectionState.DISCONNECTED)
        private set

    fun selectRegion(region: Region) { selectedRegion = region }
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
                api.register(selectedRegion, displayName.trim(), accessCode, store.installationId())
            }.onSuccess { created ->
                store.save(created)
                profile = created
                accessCode = ""
            }.onFailure { errorMessage = it.message ?: "Registreren is mislukt" }
            loading = false
        }
    }

    fun forgetProfile() {
        val oldProfile = profile
        store.clear()
        profile = null
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
        if (status == "error") errorMessage = message ?: "De VPN-verbinding is gestopt"
    }
}
