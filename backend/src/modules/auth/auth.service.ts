import { db } from '../../core/database/db.js';
import { verifyPassword, hashPassword, hashToken } from '../../core/utils/hash.js';
import { generateSecureToken, generateUUID } from '../../core/utils/crypto.js';

export class AuthService {
  static async login(username: string, password: string, ipAddress: string, userAgent: string) {
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username) as any;
    if (!admin) {
      throw new Error('Ongeldige gebruikersnaam of wachtwoord');
    }

    const isValid = await verifyPassword(admin.password_hash, password);
    if (!isValid) {
      throw new Error('Ongeldige gebruikersnaam of wachtwoord');
    }

    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);
    const sessionId = generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    db.prepare(`
      INSERT INTO sessions (id, admin_id, token_hash, ip_address, user_agent, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(sessionId, admin.id, tokenHash, ipAddress, userAgent, expiresAt);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (id, admin_id, action, details_json, ip_address)
      VALUES (?, ?, ?, ?, ?)
    `).run(generateUUID(), admin.id, 'LOGIN_SUCCESS', JSON.stringify({ username }), ipAddress);

    return { rawToken, expiresAt, admin: { id: admin.id, username: admin.username, role: admin.role } };
  }

  static validateSession(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    const session = db.prepare(`
      SELECT s.*, a.username, a.role FROM sessions s
      JOIN admins a ON s.admin_id = a.id
      WHERE s.token_hash = ? AND s.expires_at > CURRENT_TIMESTAMP
    `).get(tokenHash) as any;

    if (!session) return null;
    return session;
  }

  static logout(rawToken: string) {
    const tokenHash = hashToken(rawToken);
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
  }

  static async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    const admin = db.prepare('SELECT * FROM admins WHERE id = ?').get(adminId) as any;
    if (!admin) throw new Error('Admin niet gevonden');

    const isValid = await verifyPassword(admin.password_hash, oldPassword);
    if (!isValid) throw new Error('Huidig wachtwoord is onjuist');

    if (newPassword.length < 8) {
      throw new Error('Nieuw wachtwoord moet minimaal 8 tekens lang zijn');
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE admins SET password_hash = ? WHERE id = ?').run(newHash, adminId);

    // Revoke other sessions for security
    db.prepare('DELETE FROM sessions WHERE admin_id = ?').run(adminId);
  }

  static async createInitialAdminIfNone(password: string = 'AmnionAdmin2026!') {
    const count = (db.prepare('SELECT COUNT(*) as count FROM admins').get() as any).count;
    if (count === 0) {
      const adminId = generateUUID();
      const pwdHash = await hashPassword(password);
      db.prepare(`
        INSERT INTO admins (id, username, password_hash, role)
        VALUES (?, 'admin', ?, 'admin')
      `).run(adminId, pwdHash);
    }
  }
}
