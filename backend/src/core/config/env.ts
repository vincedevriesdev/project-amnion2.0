import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

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
};
