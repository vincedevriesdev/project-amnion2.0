import { CONFIG } from '../../core/config/env.js';
import { db } from '../../core/database/db.js';
import { generateSecureToken, generateUUID } from '../../core/utils/crypto.js';
import { UsersService } from '../users/users.service.js';
import { SystemService } from '../system/system.service.js';
import { MobileProfileService } from './mobile-profile.service.js';
import {
  accessCodeMatches,
  hashCredential,
  hashInstallationId,
  normalizeDevicePublicKey,
  normalizeDisplayName,
  normalizeInstallationId,
  slugifyName,
  validProtocols
} from './mobile.validation.js';

interface RegisterRequest {
  displayName?: unknown;
  installationId?: unknown;
  devicePublicKey?: unknown;
  accessCode?: unknown;
}

type SyncFunction = () => Promise<{ success: boolean; message: string }>;

export class MobileService {
  static assertEnabled() {
    if (!CONFIG.MOBILE_PROVISIONING_ENABLED) throw new Error('Mobiele provisioning is niet ingeschakeld');
    if (CONFIG.MOBILE_ACCESS_CODE_HASHES.length === 0) throw new Error('Mobiele provisioning is nog niet geconfigureerd');
  }

  static region() {
    return {
      id: CONFIG.MOBILE_REGION_ID,
      name: CONFIG.MOBILE_REGION_NAME,
      available: CONFIG.MOBILE_PROVISIONING_ENABLED,
      protocols: validProtocols(CONFIG.MOBILE_PROFILE_PROTOCOLS)
    };
  }

  private static profileResponse(record: any, user: any, rawDeviceToken: string) {
    return {
      deviceId: record.id,
      deviceToken: rawDeviceToken,
      region: this.region(),
      user: {
        displayName: record.display_name,
        status: user.status,
        expireAt: user.expire_at,
        dataLimitBytes: user.data_limit_bytes || 0
      },
      profile: {
        format: 'sing-box',
        version: 1,
        config: MobileProfileService.build(user)
      }
    };
  }

  static async register(payload: RegisterRequest, sync: SyncFunction = () => SystemService.syncAndReloadSingBox()) {
    this.assertEnabled();
    if (!accessCodeMatches(payload.accessCode, CONFIG.MOBILE_ACCESS_CODE_HASHES)) {
      throw new Error('Ongeldige toegangscode');
    }

    const displayName = normalizeDisplayName(payload.displayName);
    const installationId = normalizeInstallationId(payload.installationId);
    const publicKey = normalizeDevicePublicKey(payload.devicePublicKey);
    const installationHash = hashInstallationId(installationId, CONFIG.COOKIE_SECRET);
    const existing = db.prepare('SELECT * FROM mobile_devices WHERE installation_hash = ?').get(installationHash) as any;
    const rawDeviceToken = generateSecureToken(32);
    const tokenHash = hashCredential(rawDeviceToken);

    if (existing) {
      const user = UsersService.getUserById(existing.user_id) as any;
      if (!user) {
        db.prepare('DELETE FROM mobile_devices WHERE id = ?').run(existing.id);
      } else {
        db.prepare(`
          UPDATE mobile_devices
          SET display_name = ?, device_public_key = ?, device_token_hash = ?,
              updated_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(displayName, publicKey, tokenHash, existing.id);
        existing.display_name = displayName;
        return this.profileResponse(existing, user, rawDeviceToken);
      }
    }

    const suffix = installationHash.slice(0, 10);
    const internalUsername = `app-${slugifyName(displayName)}-${suffix}`;
    const expireAt = CONFIG.MOBILE_PROFILE_DAYS > 0
      ? new Date(Date.now() + CONFIG.MOBILE_PROFILE_DAYS * 86_400_000).toISOString()
      : null;
    const user = UsersService.createUser(
      internalUsername,
      CONFIG.MOBILE_DATA_LIMIT_BYTES,
      expireAt,
      validProtocols(CONFIG.MOBILE_PROFILE_PROTOCOLS)
    ) as any;
    const deviceId = generateUUID();

    try {
      db.prepare(`
        INSERT INTO mobile_devices
          (id, installation_hash, user_id, display_name, device_public_key, device_token_hash)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(deviceId, installationHash, user.id, displayName, publicKey, tokenHash);

      const syncResult = await sync();
      if (!syncResult.success) throw new Error(syncResult.message);
    } catch (error) {
      UsersService.deleteUser(user.id);
      // If writing succeeded but reloading sing-box failed, immediately try to
      // rewrite the configuration without the rolled-back credential.
      await sync().catch(() => undefined);
      throw error;
    }

    return this.profileResponse({ id: deviceId, display_name: displayName }, user, rawDeviceToken);
  }

  static refresh(rawDeviceToken: string) {
    this.assertEnabled();
    const tokenHash = hashCredential(rawDeviceToken);
    const record = db.prepare('SELECT * FROM mobile_devices WHERE device_token_hash = ?').get(tokenHash) as any;
    if (!record) throw new Error('Ongeldige of ingetrokken apparaat-token');
    const user = UsersService.getUserById(record.user_id) as any;
    if (!user || user.status !== 'active') throw new Error('VPN-profiel is niet actief');
    db.prepare('UPDATE mobile_devices SET last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(record.id);
    return this.profileResponse(record, user, rawDeviceToken);
  }

  static async revoke(rawDeviceToken: string, sync: SyncFunction = () => SystemService.syncAndReloadSingBox()) {
    this.assertEnabled();
    const tokenHash = hashCredential(rawDeviceToken);
    const record = db.prepare('SELECT * FROM mobile_devices WHERE device_token_hash = ?').get(tokenHash) as any;
    if (!record) throw new Error('Ongeldige of ingetrokken apparaat-token');
    UsersService.deleteUser(record.user_id);
    const syncResult = await sync();
    if (!syncResult.success) throw new Error(syncResult.message);
  }
}
