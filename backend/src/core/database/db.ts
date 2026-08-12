import Database, { Database as DatabaseType } from 'better-sqlite3';
import { CONFIG } from '../config/env.js';
import path from 'path';
import fs from 'fs';

// Ensure directory exists for database file
const dbDir = path.dirname(CONFIG.DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db: DatabaseType = new Database(CONFIG.DB_PATH);

// Enforce SQLite PRAGMAs for concurrency & reliability
db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        uuid TEXT NOT NULL UNIQUE,
        status TEXT CHECK(status IN ('active', 'disabled', 'expired')) DEFAULT 'active',
        data_limit_bytes INTEGER DEFAULT 0,
        used_bytes INTEGER DEFAULT 0,
        expire_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_protocols (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        protocol_type TEXT CHECK(protocol_type IN ('hysteria2', 'tuic', 'vless_reality')) NOT NULL,
        settings_json TEXT DEFAULT '{}',
        is_enabled INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, protocol_type)
    );

    CREATE TABLE IF NOT EXISTS admins (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        two_factor_secret TEXT NULL,
        role TEXT CHECK(role IN ('admin', 'viewer')) DEFAULT 'admin',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        admin_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        ip_address TEXT NOT NULL,
        user_agent TEXT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscription_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        admin_id TEXT NULL,
        action TEXT NOT NULL,
        details_json TEXT DEFAULT '{}',
        ip_address TEXT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration for used_bytes in user_protocols
  try {
    db.exec('ALTER TABLE user_protocols ADD COLUMN used_bytes INTEGER DEFAULT 0');
  } catch {}
}
