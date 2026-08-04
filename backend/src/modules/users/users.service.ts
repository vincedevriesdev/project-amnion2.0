import { db } from '../../core/database/db.js';
import { generateUUID, generateSecureToken } from '../../core/utils/crypto.js';

export class UsersService {
  static listUsers() {
    const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as any[];
    return users.map(user => {
      const protocols = db.prepare('SELECT protocol_type, is_enabled FROM user_protocols WHERE user_id = ?').all(user.id);
      const subToken = db.prepare('SELECT token FROM subscription_tokens WHERE user_id = ?').get(user.id) as any;
      return {
        ...user,
        protocols,
        subscriptionToken: subToken ? subToken.token : null
      };
    });
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
}
