package net.opik.amnion.data

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import javax.net.ssl.HttpsURLConnection

class AmnionApi {
    suspend fun register(
        region: Region,
        displayName: String,
        accessCode: String,
        installationId: String,
        protocol: VpnProtocol
    ): VpnProfile =
        withContext(Dispatchers.IO) {
            val body = JSONObject().apply {
                put("displayName", displayName)
                put("accessCode", accessCode)
                put("installationId", installationId)
                put("protocol", protocol.id)
            }
            val response = request("${region.apiUrl}/register", body, null)
            val remoteRegion = response.getJSONObject("region")
            val user = response.getJSONObject("user")
            val profile = response.getJSONObject("profile")
            VpnProfile(
                regionId = remoteRegion.getString("id"),
                regionLabel = remoteRegion.getString("name"),
                displayName = user.getString("displayName"),
                deviceToken = response.getString("deviceToken"),
                protocolId = profile.optString("protocol", protocol.id),
                configJson = profile.getJSONObject("config").toString()
            )
        }

    suspend fun refresh(region: Region, profile: VpnProfile): VpnProfile = withContext(Dispatchers.IO) {
        val response = request("${region.apiUrl}/profile/refresh", JSONObject(), profile.deviceToken)
        val user = response.getJSONObject("user")
        val remoteRegion = response.getJSONObject("region")
        profile.copy(
            displayName = user.getString("displayName"),
            regionLabel = remoteRegion.getString("name"),
            protocolId = response.getJSONObject("profile").optString("protocol", profile.protocolId),
            configJson = response.getJSONObject("profile").getJSONObject("config").toString()
        )
    }

    suspend fun changeProtocol(region: Region, profile: VpnProfile, protocol: VpnProtocol): VpnProfile =
        withContext(Dispatchers.IO) {
            val response = request(
                "${region.apiUrl}/profile/protocol",
                JSONObject().put("protocol", protocol.id),
                profile.deviceToken
            )
            val user = response.getJSONObject("user")
            val remoteRegion = response.getJSONObject("region")
            val remoteProfile = response.getJSONObject("profile")
            profile.copy(
                displayName = user.getString("displayName"),
                regionLabel = remoteRegion.getString("name"),
                protocolId = remoteProfile.optString("protocol", protocol.id),
                configJson = remoteProfile.getJSONObject("config").toString()
            )
        }

    suspend fun revoke(region: Region, profile: VpnProfile) = withContext(Dispatchers.IO) {
        request("${region.apiUrl}/profile/revoke", JSONObject(), profile.deviceToken)
        Unit
    }

    private fun request(url: String, body: JSONObject, token: String?): JSONObject {
        val connection = URL(url).openConnection() as HttpsURLConnection
        connection.requestMethod = "POST"
        connection.connectTimeout = 12_000
        connection.readTimeout = 20_000
        connection.doOutput = true
        connection.setRequestProperty("Content-Type", "application/json")
        connection.setRequestProperty("Accept", "application/json")
        connection.setRequestProperty("User-Agent", "Amnion-Android/${net.opik.amnion.BuildConfig.VERSION_NAME}")
        if (token != null) connection.setRequestProperty("Authorization", "Bearer $token")
        connection.outputStream.use { it.write(body.toString().toByteArray(Charsets.UTF_8)) }
        val stream = if (connection.responseCode in 200..299) connection.inputStream else connection.errorStream
        val text = stream?.bufferedReader()?.use { it.readText() }.orEmpty()
        if (connection.responseCode !in 200..299) {
            val message = runCatching { JSONObject(text).getString("error") }.getOrDefault("Serverfout ${connection.responseCode}")
            throw IllegalStateException(message)
        }
        if (connection.responseCode == HttpURLConnection.HTTP_NO_CONTENT) return JSONObject()
        return JSONObject(text)
    }
}
