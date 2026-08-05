import { db } from '../../core/database/db.js';
import { generateUUID, generateSecureToken } from '../../core/utils/crypto.js';
import fs from 'fs';

export class UsersService {
  static listUsers() {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];

    // Parse recent sing-box log lines to determine active protocol per user
    const recentLogs = this.getRecentSingBoxLogs();

    return users.map(user => {
      const protocols = db.prepare('SELECT protocol_type, is_enabled FROM user_protocols WHERE user_id = ?').all(user.id);
      const subToken = db.prepare('SELECT token FROM subscription_tokens WHERE user_id = ?').get(user.id) as any;

      // Find active protocol from recent log matches or sub token access
      const activeProtocol = recentLogs.lastProtocol || 'Standby';

      return {
        ...user,
        protocols,
        activeProtocol,
        subscriptionToken: subToken ? subToken.token : null
      };
    });
  }

  private static getRecentSingBoxLogs() {
    let lastProtocol = 'HY2';
    try {
      const logFile = '/var/log/sing-box/sing-box.log';
      if (fs.existsSync(logFile)) {
        const content = fs.readFileSync(logFile, 'utf-8');
        const lines = content.trim().split('\n').slice(-50);
        for (let i = lines.length - 1; i >= 0; i--) {
          const l = lines[i];
          if (l.includes('inbound/tuic')) {
            lastProtocol = 'TUIC v5';
            break;
          } else if (l.includes('inbound/hy2') || l.includes('inbound/hysteria2')) {
            lastProtocol = 'Hysteria 2';
            break;
          } else if (l.includes('inbound/vless')) {
            lastProtocol = 'VLESS REALITY';
            break;
          }
        }
      }
    } catch {}
    return { lastProtocol };
  }

  static getUserById(id: string) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!user) return null;

    const protocols = db.prepare('SELECT * FROM user_protocols WHERE user_id = ?').all(id);
    const subToken = db.prepare('SELECT token FROM subscription_tokens WHERE user_id = ?').get(id) as any;

    return {
      ...user,
      protocols,
      subscriptionToken: subToken ? subToken.token : null
    };
  }

  static createUser(username: string, dataLimitBytes: number = 0, expireAt: string | null = null, protocols: string[] = ['hysteria2', 'tuic', 'vless_reality']) {
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
      throw new Error('Gebruikersnaam bestaat al');
    }

    const userId = generateUUID();
    const userUUID = generateUUID();
    const subToken = generateSecureToken(16);

    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO users (id, username, uuid, status, data_limit_bytes, expire_at)
        VALUES (?, ?, ?, 'active', ?, ?)
      `).run(userId, username, userUUID, dataLimitBytes, expireAt);

      db.prepare(`
        INSERT INTO subscription_tokens (id, user_id, token)
        VALUES (?, ?, ?)
      `).run(generateUUID(), userId, subToken);

      const validProtocols = ['hysteria2', 'tuic', 'vless_reality'];
      for (const p of validProtocols) {
        const isEnabled = protocols.includes(p) ? 1 : 0;
        db.prepare(`
          INSERT INTO user_protocols (id, user_id, protocol_type, is_enabled)
          VALUES (?, ?, ?, ?)
        `).run(generateUUID(), userId, p, isEnabled);
      }
    });

    transaction();
    return this.getUserById(userId);
  }

  static updateUser(id: string, updates: { username?: string; status?: string; dataLimitBytes?: number; expireAt?: string | null; protocols?: string[] }) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) throw new Error('Gebruiker niet gevonden');

    const transaction = db.transaction(() => {
      if (updates.username) {
        db.prepare('UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(updates.username, id);
      }
      if (updates.status) {
        db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(updates.status, id);
      }
      if (updates.dataLimitBytes !== undefined) {
        db.prepare('UPDATE users SET data_limit_bytes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(updates.dataLimitBytes, id);
      }
      if (updates.expireAt !== undefined) {
        db.prepare('UPDATE users SET expire_at = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(updates.expireAt, id);
      }

      if (updates.protocols) {
        const validProtocols = ['hysteria2', 'tuic', 'vless_reality'];
        for (const p of validProtocols) {
          const isEnabled = updates.protocols.includes(p) ? 1 : 0;
          db.prepare(`
            INSERT INTO user_protocols (id, user_id, protocol_type, is_enabled)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, protocol_type) DO UPDATE SET is_enabled = ?
          `).run(generateUUID(), id, p, isEnabled, isEnabled);
        }
      }
    });

    transaction();
    return this.getUserById(id);
  }

  static resetUserToken(id: string) {
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(id);
    if (!user) throw new Error('Gebruiker niet gevonden');

    const newToken = generateSecureToken(16);
    db.prepare('UPDATE subscription_tokens SET token = ? WHERE user_id = ?').run(newToken, id);
    return { subscriptionToken: newToken };
  }

  static deleteUser(id: string) {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
  }

  static exportUsersData() {
    const users = db.prepare('SELECT * FROM users').all() as any[];
    return users.map(user => {
      const protocols = db.prepare('SELECT protocol_type, is_enabled FROM user_protocols WHERE user_id = ? AND is_enabled = 1').all(user.id) as any[];
      const subToken = db.prepare('SELECT token FROM subscription_tokens WHERE user_id = ?').get(user.id) as any;
      return {
        id: user.id,
        username: user.username,
        uuid: user.uuid,
        status: user.status,
        data_limit_bytes: user.data_limit_bytes,
        used_bytes: user.used_bytes,
        expire_at: user.expire_at,
        created_at: user.created_at,
        protocols: protocols.map(p => p.protocol_type),
        subscriptionToken: subToken ? subToken.token : generateSecureToken(16)
      };
    });
  }

  static importUsersData(importList: any[]) {
    if (!Array.isArray(importList) || importList.length === 0) {
      throw new Error('Ongeldige of lege gebruikerslijst voor import');
    }

    let importedCount = 0;
    const transaction = db.transaction(() => {
      for (const item of importList) {
        if (!item.username || !item.uuid) continue;

        const userId = item.id || generateUUID();
        const userUUID = item.uuid;
        const subToken = item.subscriptionToken || generateSecureToken(16);
        const dataLimit = item.data_limit_bytes || 0;
        const status = item.status || 'active';
        const expireAt = item.expire_at || null;
        const protocols = Array.isArray(item.protocols) ? item.protocols : ['hysteria2', 'tuic', 'vless_reality'];

        db.prepare(`
          INSERT INTO users (id, username, uuid, status, data_limit_bytes, expire_at)
          VALUES (?, ?, ?, ?, ?, ?)
          ON CONFLICT(username) DO UPDATE SET
            uuid = excluded.uuid,
            status = excluded.status,
            data_limit_bytes = excluded.data_limit_bytes,
            expire_at = excluded.expire_at,
            updated_at = CURRENT_TIMESTAMP
        `).run(userId, item.username, userUUID, status, dataLimit, expireAt);

        // Fetch actual inserted/updated user ID
        const current = db.prepare('SELECT id FROM users WHERE username = ?').get(item.username) as any;
        const actualId = current.id;

        // Clean existing token then insert new token safely
        db.prepare('DELETE FROM subscription_tokens WHERE user_id = ?').run(actualId);
        db.prepare(`
          INSERT INTO subscription_tokens (id, user_id, token)
          VALUES (?, ?, ?)
        `).run(generateUUID(), actualId, subToken);

        const validProtocols = ['hysteria2', 'tuic', 'vless_reality'];
        for (const p of validProtocols) {
          const isEnabled = protocols.includes(p) ? 1 : 0;
          db.prepare(`
            INSERT INTO user_protocols (id, user_id, protocol_type, is_enabled)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id, protocol_type) DO UPDATE SET is_enabled = ?
          `).run(generateUUID(), actualId, p, isEnabled, isEnabled);
        }
        importedCount++;
      }
    });

    transaction();
    return { count: importedCount };
  }
}
