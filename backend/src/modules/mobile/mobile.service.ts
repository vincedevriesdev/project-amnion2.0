import { CONFIG } from '../../core/config/env.js';
import { db } from '../../core/database/db.js';
import { generateSecureToken, generateUUID } from '../../core/utils/crypto.js';
import { UsersService } from '../users/users.service.js';
import { SystemService } from '../system/system.service.js';
import { MobileProfileService } from './mobile-profile.service.js';
import {
  hashCredential,
  hashInstallationId,
  normalizeDevicePublicKey,
  normalizeDisplayName,
  normalizeInstallationId,
  normalizeProtocol,
  slugifyName,
  validProtocols
} from './mobile.validation.js';

interface RegisterRequest {
  displayName?: unknown;
  installationId?: unknown;
  devicePublicKey?: unknown;
  accessCode?: unknown; // ignored; retained for backwards-compatible clients
  protocol?: unknown;
}

type SyncFunction = () => Promise<{ success: boolean; message: string }>;

export class MobileService {
  static assertEnabled() {
    if (!CONFIG.MOBILE_PROVISIONING_ENABLED) throw new Error('Mobiele provisioning is niet ingeschakeld');
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
        protocol: record.protocol_type || 'vless_reality',
        config: MobileProfileService.build(user, [record.protocol_type || 'vless_reality'])
      }
    };
  }

  static async register(payload: RegisterRequest, sync: SyncFunction = () => SystemService.syncAndReloadSingBox()) {
    this.assertEnabled();
    const displayName = normalizeDisplayName(payload.displayName);
    const installationId = normalizeInstallationId(payload.installationId);
    const publicKey = normalizeDevicePublicKey(payload.devicePublicKey);
    const allowedProtocols = validProtocols(CONFIG.MOBILE_PROFILE_PROTOCOLS);
    const protocol = normalizeProtocol(payload.protocol, allowedProtocols);
    const installationHash = hashInstallationId(installationId, CONFIG.COOKIE_SECRET);
    const existing = db.prepare('SELECT * FROM mobile_devices WHERE installation_hash = ?').get(installationHash) as any;
    const rawDeviceToken = generateSecureToken(32);
    const tokenHash = hashCredential(rawDeviceToken);

    if (existing) {
      const user = UsersService.getUserById(existing.user_id) as any;
      if (!user) {
        db.prepare('DELETE FROM mobile_devices WHERE id = ?').run(existing.id);
      } else {
        const enabledProtocols = (UsersService.getUserById(existing.user_id)?.protocols || [])
          .filter((item: any) => item.is_enabled)
          .map((item: any) => item.protocol_type)
          .sort();
        const expectedProtocols = [...allowedProtocols].sort();
        if (JSON.stringify(enabledProtocols) !== JSON.stringify(expectedProtocols)) {
          const previousProtocols = enabledProtocols;
          UsersService.updateUser(existing.user_id, { protocols: allowedProtocols });
          const syncResult = await sync();
          if (!syncResult.success) {
            UsersService.updateUser(existing.user_id, { protocols: previousProtocols });
            await sync().catch(() => undefined);
            throw new Error(syncResult.message);
          }
        }
        db.prepare(`
          UPDATE mobile_devices
          SET display_name = ?, protocol_type = ?, device_public_key = ?, device_token_hash = ?,
              updated_at = CURRENT_TIMESTAMP, last_seen_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(displayName, protocol, publicKey, tokenHash, existing.id);
        existing.display_name = displayName;
        existing.protocol_type = protocol;
        user.protocols = UsersService.getUserById(existing.user_id)?.protocols || user.protocols;
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
      allowedProtocols
    ) as any;
    const deviceId = generateUUID();

    try {
      db.prepare(`
        INSERT INTO mobile_devices
          (id, installation_hash, user_id, display_name, protocol_type, device_public_key, device_token_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(deviceId, installationHash, user.id, displayName, protocol, publicKey, tokenHash);

      const syncResult = await sync();
      if (!syncResult.success) throw new Error(syncResult.message);
    } catch (error) {
      UsersService.deleteUser(user.id);
      // If writing succeeded but reloading sing-box failed, immediately try to
      // rewrite the configuration without the rolled-back credential.
      await sync().catch(() => undefined);
      throw error;
    }

    return this.profileResponse({ id: deviceId, display_name: displayName, protocol_type: protocol }, user, rawDeviceToken);
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

  static async setProtocol(rawDeviceToken: string, requested: unknown) {
    this.assertEnabled();
    const tokenHash = hashCredential(rawDeviceToken);
    const record = db.prepare('SELECT * FROM mobile_devices WHERE device_token_hash = ?').get(tokenHash) as any;
    if (!record) throw new Error('Ongeldige of ingetrokken apparaat-token');
    const user = UsersService.getUserById(record.user_id) as any;
    if (!user || user.status !== 'active') throw new Error('VPN-profiel is niet actief');

    const protocol = normalizeProtocol(requested, validProtocols(CONFIG.MOBILE_PROFILE_PROTOCOLS));
    if (protocol !== (record.protocol_type || 'vless_reality')) {
      db.prepare(`UPDATE mobile_devices SET protocol_type = ?, updated_at = CURRENT_TIMESTAMP,
        last_seen_at = CURRENT_TIMESTAMP WHERE id = ?`).run(protocol, record.id);
      record.protocol_type = protocol;
    }
    return this.profileResponse(record, UsersService.getUserById(record.user_id), rawDeviceToken);
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
