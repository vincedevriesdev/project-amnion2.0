import { db } from '../../core/database/db.js';
import { CONFIG } from '../../core/config/env.js';
import QRCode from 'qrcode';

export class SubscriptionsService {
  static getSubscriptionData(token: string) {
    const tokenRecord = db.prepare('SELECT user_id FROM subscription_tokens WHERE token = ? AND is_active = 1').get(token) as any;
    if (!tokenRecord) {
      throw new Error('Ongeldige of verlopen abonnementstoken');
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND status = "active"').get(tokenRecord.user_id) as any;
    if (!user) {
      throw new Error('Gebruiker is niet actief');
    }

    const protocols = db.prepare('SELECT protocol_type FROM user_protocols WHERE user_id = ? AND is_enabled = 1').all(user.id) as any[];

    const rawHost = CONFIG.SERVER_DOMAIN || CONFIG.PUBLIC_IP || '127.0.0.1';
    const host = rawHost.trim();
    const sniDomain = (CONFIG.SERVER_DOMAIN && CONFIG.SERVER_DOMAIN.trim()) ? CONFIG.SERVER_DOMAIN.trim() : host;
    const uris: string[] = [];

    // Read REALITY public key from DB
    let realityPubKey = db.prepare("SELECT value FROM system_config WHERE key = 'reality_public_key'").get() as any;
    let realityShortId = db.prepare("SELECT value FROM system_config WHERE key = 'reality_short_id'").get() as any;

    const pubKeyStr = realityPubKey ? realityPubKey.value : 'PUBLIC_KEY_PLACEHOLDER';
    const shortIdStr = realityShortId ? realityShortId.value : 'a1b2c3d4';

    for (const p of protocols) {
      if (p.protocol_type === 'hysteria2') {
        const hy2 = `hysteria2://${user.uuid}@${host}:8443/?insecure=1&sni=${sniDomain}#Amnion-HY2-${user.username}`;
        uris.push(hy2);
      } else if (p.protocol_type === 'tuic') {
        const tuic = `tuic://${user.uuid}:${user.uuid}@${host}:8444/?congestion_control=bbr&udp_relay_mode=native&alpn=h3&sni=${sniDomain}#Amnion-TUIC-${user.username}`;
        uris.push(tuic);
      } else if (p.protocol_type === 'vless_reality') {
        const vless = `vless://${user.uuid}@${host}:443?type=tcp&security=reality&pbk=${pubKeyStr}&fp=chrome&sni=dl.google.com&sid=${shortIdStr}&flow=xtls-rprx-vision#Amnion-VLESS-${user.username}`;
        uris.push(vless);
      }
    }

    return {
      user: {
        username: user.username,
        dataLimitBytes: user.data_limit_bytes,
        usedBytes: user.used_bytes,
        expireAt: user.expire_at
      },
      uris,
      base64Config: Buffer.from(uris.join('\n')).toString('base64')
    };
  }

  static async generateQrSvg(text: string): Promise<string> {
    return QRCode.toString(text, { type: 'svg', margin: 2, color: { dark: '#0f172a', light: '#ffffff' } });
  }
}
