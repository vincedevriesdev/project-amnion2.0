import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
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
   * Returns valid TLS cert and key paths (Let's Encrypt or fallback self-signed)
   */
  private static getTlsCertificatePaths(): { certPath: string; keyPath: string } {
    const domain = (CONFIG.SERVER_DOMAIN && CONFIG.SERVER_DOMAIN.trim()) ? CONFIG.SERVER_DOMAIN.trim() : 'localhost';
    const leCert = `/etc/letsencrypt/live/${domain}/fullchain.pem`;
    const leKey = `/etc/letsencrypt/live/${domain}/privkey.pem`;

    if (fs.existsSync(leCert) && fs.existsSync(leKey)) {
      return { certPath: leCert, keyPath: leKey };
    }

    // Fallback: Generate self-signed TLS cert in /etc/amnion if missing
    const certDir = '/etc/amnion';
    const selfCert = path.join(certDir, 'selfsigned.crt');
    const selfKey = path.join(certDir, 'selfsigned.key');

    if (!fs.existsSync(selfCert) || !fs.existsSync(selfKey)) {
      try {
        if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });
        execSync(`openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ${selfKey} -out ${selfCert} -subj "/CN=${domain}"`, { stdio: 'ignore' });
      } catch (err) {
        console.error('Self-signed certificate generation failed:', err);
      }
    }

    return { certPath: selfCert, keyPath: selfKey };
  }

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
    const hy2Users: { password: string }[] = [];
    const tuicUsers: { uuid: string; password: string }[] = [];
    const vlessUsers: { uuid: string; flow?: string }[] = [];

    for (const u of activeUsers) {
      if (u.protocol_type === 'hysteria2') {
        hy2Users.push({ password: u.uuid });
      } else if (u.protocol_type === 'tuic') {
        tuicUsers.push({ uuid: u.uuid, password: u.uuid });
      } else if (u.protocol_type === 'vless_reality') {
        vlessUsers.push({ uuid: u.uuid, flow: 'xtls-rprx-vision' });
      }
    }

    // Read REALITY keys from system config DB or generate defaults
    let realityPrivKey = db.prepare("SELECT value FROM system_config WHERE key = 'reality_private_key'").get() as any;
    let realityShortId = db.prepare("SELECT value FROM system_config WHERE key = 'reality_short_id'").get() as any;

    const tls = this.getTlsCertificatePaths();
    const serverDomain = (CONFIG.SERVER_DOMAIN && CONFIG.SERVER_DOMAIN.trim()) ? CONFIG.SERVER_DOMAIN.trim() : (CONFIG.PUBLIC_IP || 'localhost');

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
          server_name: serverDomain,
          certificate_path: tls.certPath,
          key_path: tls.keyPath
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
          server_name: serverDomain,
          alpn: ['h3'],
          certificate_path: tls.certPath,
          key_path: tls.keyPath
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
            private_key: realityPrivKey ? realityPrivKey.value : '',
            short_id: realityShortId ? [realityShortId.value] : ['c098e249']
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
        level: 'info'
      },
      inbounds,
      outbounds
    };
  }
}
