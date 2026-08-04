import { db } from '../../core/database/db.js';
import { CONFIG } from '../../core/config/env.js';

export interface SingBoxConfig {
  log: {
    level: string;
    output?: string;
  };
  inbounds: any[];
  outbounds: any[];
}

export class ProtocolsService {
  /**
   * Generates complete sing-box JSON configuration structure based on DB state
   */
  static generateSingBoxConfig(): SingBoxConfig {
    const activeUsers = db.prepare(`
      SELECT u.id, u.username, u.uuid, p.protocol_type
      FROM users u
      JOIN user_protocols p ON u.id = p.user_id
      WHERE u.status = 'active' AND p.is_enabled = 1
    `).all() as any[];

    // Group active UUIDs per protocol
    const hy2Users: { name: string; password: string }[] = [];
    const tuicUsers: { name: string; uuid: string; password: string }[] = [];
    const vlessUsers: { name: string; uuid: string; flow?: string }[] = [];

    for (const u of activeUsers) {
      if (u.protocol_type === 'hysteria2') {
        hy2Users.push({ name: u.username, password: u.uuid });
      } else if (u.protocol_type === 'tuic') {
        tuicUsers.push({ name: u.username, uuid: u.uuid, password: u.uuid });
      } else if (u.protocol_type === 'vless_reality') {
        vlessUsers.push({ name: u.username, uuid: u.uuid, flow: 'xtls-rprx-vision' });
      }
    }

    // Read REALITY keys from system config DB or generate defaults
    let realityPrivKey = db.prepare("SELECT value FROM system_config WHERE key = 'reality_private_key'").get() as any;
    let realityShortId = db.prepare("SELECT value FROM system_config WHERE key = 'reality_short_id'").get() as any;

    const inbounds: any[] = [
      // 1. Hysteria 2 Inbound (UDP 8443)
      {
        type: 'hysteria2',
        tag: 'hy2-in',
        listen: '::',
        listen_port: 8443,
        users: hy2Users,
        tls: {
          enabled: true,
          server_name: CONFIG.SERVER_DOMAIN,
          certificate_path: `/etc/letsencrypt/live/${CONFIG.SERVER_DOMAIN}/fullchain.pem`,
          key_path: `/etc/letsencrypt/live/${CONFIG.SERVER_DOMAIN}/privkey.pem`
        }
      },
      // 2. TUIC Inbound (UDP 8444)
      {
        type: 'tuic',
        tag: 'tuic-in',
        listen: '::',
        listen_port: 8444,
        users: tuicUsers,
        congestion_control: 'bbr',
        tls: {
          enabled: true,
          server_name: CONFIG.SERVER_DOMAIN,
          certificate_path: `/etc/letsencrypt/live/${CONFIG.SERVER_DOMAIN}/fullchain.pem`,
          key_path: `/etc/letsencrypt/live/${CONFIG.SERVER_DOMAIN}/privkey.pem`
        }
      },
      // 3. VLESS + REALITY Inbound (TCP 443)
      {
        type: 'vless',
        tag: 'vless-in',
        listen: '::',
        listen_port: 443,
        users: vlessUsers,
        tls: {
          enabled: true,
          server_name: 'dl.google.com',
          reality: {
            enabled: true,
            handshake: {
              server: 'dl.google.com',
              server_port: 443
            },
            private_key: realityPrivKey ? realityPrivKey.value : 'uL7N4...placeholder',
            short_id: [realityShortId ? realityShortId.value : 'a1b2c3d4']
          }
        }
      }
    ];

    const outbounds = [
      {
        type: 'direct',
        tag: 'direct'
      },
      {
        type: 'block',
        tag: 'block'
      }
    ];

    return {
      log: {
        level: 'warn',
        output: '/var/log/sing-box/sing-box.log'
      },
      inbounds,
      outbounds
    };
  }
}
