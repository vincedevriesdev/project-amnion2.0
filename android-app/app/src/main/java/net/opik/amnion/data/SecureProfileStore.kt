package net.opik.amnion.data

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import org.json.JSONObject
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

class SecureProfileStore(context: Context) {
    private val prefs = context.getSharedPreferences("amnion_secure", Context.MODE_PRIVATE)

    fun installationId(): String {
        val current = prefs.getString("installation_id", null)
        if (current != null) return current
        val created = java.util.UUID.randomUUID().toString()
        prefs.edit().putString("installation_id", created).apply()
        return created
    }

    fun save(profile: VpnProfile) {
        val profiles = all().toMutableMap().apply { put(profile.regionId, profile) }
        val json = JSONObject()
        profiles.forEach { (regionId, stored) -> json.put(regionId, toJson(stored)) }
        prefs.edit()
            .putString(PROFILES_KEY, encrypt(json.toString()))
            .putString(ACTIVE_REGION_KEY, profile.regionId)
            .remove(LEGACY_PROFILE_KEY)
            .apply()
    }

    fun load(): VpnProfile? {
        val profiles = all()
        val active = prefs.getString(ACTIVE_REGION_KEY, null)
        return profiles[active] ?: profiles.values.firstOrNull()
    }

    fun load(regionId: String): VpnProfile? = all()[regionId]

    fun all(): Map<String, VpnProfile> {
        val current = runCatching {
            val encoded = prefs.getString(PROFILES_KEY, null) ?: return@runCatching emptyMap()
            val json = JSONObject(decrypt(encoded))
            buildMap {
                json.keys().forEach { regionId -> put(regionId, fromJson(json.getJSONObject(regionId))) }
            }
        }.getOrDefault(emptyMap())
        if (current.isNotEmpty()) return current

        // Transparently migrate the single-region storage used by v1/v2.
        val legacy = runCatching {
            val encoded = prefs.getString(LEGACY_PROFILE_KEY, null) ?: return@runCatching null
            fromJson(JSONObject(decrypt(encoded)))
        }.getOrNull() ?: return emptyMap()
        val json = JSONObject().put(legacy.regionId, toJson(legacy))
        prefs.edit().putString(PROFILES_KEY, encrypt(json.toString()))
            .putString(ACTIVE_REGION_KEY, legacy.regionId).remove(LEGACY_PROFILE_KEY).apply()
        return mapOf(legacy.regionId to legacy)
    }

    fun clear() = prefs.edit().remove(LEGACY_PROFILE_KEY).remove(PROFILES_KEY).remove(ACTIVE_REGION_KEY).apply()

    private fun toJson(profile: VpnProfile) = JSONObject().apply {
        put("regionId", profile.regionId)
        put("regionLabel", profile.regionLabel)
        put("displayName", profile.displayName)
        put("deviceToken", profile.deviceToken)
        put("protocolId", profile.protocolId)
        put("configJson", profile.configJson)
    }

    private fun fromJson(json: JSONObject) = VpnProfile(
        json.getString("regionId"),
        json.getString("regionLabel"),
        json.getString("displayName"),
        json.getString("deviceToken"),
        json.optString("protocolId", VpnProtocol.VLESS_REALITY.id),
        json.getString("configJson")
    )

    private fun key(): SecretKey {
        val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
        (store.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
        return KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore").run {
            init(KeyGenParameterSpec.Builder(
                KEY_ALIAS,
                KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT
            ).setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .build())
            generateKey()
        }
    }

    private fun encrypt(value: String): String {
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.ENCRYPT_MODE, key())
        val payload = cipher.iv + cipher.doFinal(value.toByteArray(Charsets.UTF_8))
        return Base64.encodeToString(payload, Base64.NO_WRAP)
    }

    private fun decrypt(value: String): String {
        val payload = Base64.decode(value, Base64.NO_WRAP)
        val iv = payload.copyOfRange(0, 12)
        val encrypted = payload.copyOfRange(12, payload.size)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        cipher.init(Cipher.DECRYPT_MODE, key(), GCMParameterSpec(128, iv))
        return cipher.doFinal(encrypted).toString(Charsets.UTF_8)
    }

    companion object {
        private const val KEY_ALIAS = "amnion_profile_key_v1"
        private const val LEGACY_PROFILE_KEY = "profile"
        private const val PROFILES_KEY = "region_profiles_v3"
        private const val ACTIVE_REGION_KEY = "active_region_v3"
    }
}
