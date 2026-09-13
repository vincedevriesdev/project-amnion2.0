import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

function envBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function envInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function envList(value: string | undefined, fallback: string[] = []): string[] {
  if (!value) return fallback;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'production',
  PORT: parseInt(process.env.PORT || '3000', 10),
  HOST: process.env.HOST || '0.0.0.0',
  DB_PATH: process.env.DB_PATH || path.join(process.cwd(), 'amnion.db'),
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'amnion-super-secret-cookie-key-change-in-prod-32bytes',
  SING_BOX_CONFIG_PATH: process.env.SING_BOX_CONFIG_PATH || '/etc/sing-box/config.json',
  SING_BOX_BINARY: process.env.SING_BOX_BINARY || 'sing-box',
  SERVER_DOMAIN: process.env.SERVER_DOMAIN || 'localhost',
  PUBLIC_IP: process.env.PUBLIC_IP || '127.0.0.1',
  MOBILE_PROVISIONING_ENABLED: envBoolean(process.env.MOBILE_PROVISIONING_ENABLED, false),
  MOBILE_REGION_ID: process.env.MOBILE_REGION_ID || 'standalone',
  MOBILE_REGION_NAME: process.env.MOBILE_REGION_NAME || 'Deze server',
  MOBILE_ACCESS_CODE_HASHES: envList(process.env.MOBILE_ACCESS_CODE_HASHES),
  MOBILE_DATA_LIMIT_BYTES: Math.max(0, envInteger(process.env.MOBILE_DATA_LIMIT_BYTES, 0)),
  MOBILE_PROFILE_DAYS: Math.max(0, envInteger(process.env.MOBILE_PROFILE_DAYS, 0)),
  MOBILE_PROFILE_PROTOCOLS: envList(process.env.MOBILE_PROFILE_PROTOCOLS, ['vless_reality', 'hysteria2', 'tuic']),
  MOBILE_ALLOW_INSECURE_TLS: envBoolean(process.env.MOBILE_ALLOW_INSECURE_TLS, false),
};
