import { CONFIG } from '../../core/config/env.js';
import { db } from '../../core/database/db.js';
import { MobileProtocol, validProtocols } from './mobile.validation.js';

interface MobileProfileUser {
  username: string;
  uuid: string;
}

export class MobileProfileService {
  static build(user: MobileProfileUser, selectedProtocols?: MobileProtocol[]) {
    const host = (CONFIG.PUBLIC_IP || CONFIG.SERVER_DOMAIN).trim();
    const domain = (CONFIG.SERVER_DOMAIN || host).trim();
    const protocols = selectedProtocols || validProtocols(CONFIG.MOBILE_PROFILE_PROTOCOLS);
    const outbounds: any[] = [];

    if (protocols.includes('vless_reality')) {
      const publicKey = (db.prepare("SELECT value FROM system_config WHERE key = 'reality_public_key'").get() as any)?.value;
      const shortId = (db.prepare("SELECT value FROM system_config WHERE key = 'reality_short_id'").get() as any)?.value;
      if (!publicKey || !shortId) throw new Error('REALITY-sleutels ontbreken');
      outbounds.push({
        type: 'vless',
        tag: 'vless-reality',
        server: host,
        server_port: 443,
        uuid: user.uuid,
        flow: 'xtls-rprx-vision',
        tls: {
          enabled: true,
          server_name: 'dl.google.com',
          utls: { enabled: true, fingerprint: 'chrome' },
          reality: { enabled: true, public_key: publicKey, short_id: shortId }
        }
      });
    }

    if (protocols.includes('hysteria2')) {
      outbounds.push({
        type: 'hysteria2',
        tag: 'hysteria2',
        server: host,
        server_port: 8443,
        password: user.uuid,
        tls: { enabled: true, server_name: domain, insecure: CONFIG.MOBILE_ALLOW_INSECURE_TLS }
      });
    }

    if (protocols.includes('tuic')) {
      outbounds.push({
        type: 'tuic',
        tag: 'tuic',
        server: host,
        server_port: 8444,
        uuid: user.uuid,
        password: user.uuid,
        congestion_control: 'bbr',
        tls: { enabled: true, server_name: domain, alpn: ['h3'], insecure: CONFIG.MOBILE_ALLOW_INSECURE_TLS }
      });
    }

    const protocolTags = outbounds.map(outbound => outbound.tag);
    const selectedTag = protocolTags[0];

    outbounds.push({ type: 'direct', tag: 'direct' });

    return {
      log: { level: 'warn', timestamp: true },
      dns: {
        servers: [
          {
            type: 'tls',
            tag: 'secure-dns',
            server: '1.1.1.1',
            server_port: 853,
            detour: selectedTag,
            tls: { enabled: true, server_name: 'cloudflare-dns.com' }
          }
        ],
        final: 'secure-dns',
        // Both current Amnion regions have reliable IPv4. Keeping IPv6 inside
        // the TUN prevents leaks, while IPv4-only DNS avoids broken host IPv6
        // routes from making otherwise reachable websites time out.
        strategy: 'ipv4_only'
      },
      inbounds: [
        {
          type: 'tun',
          tag: 'tun-in',
          address: ['172.19.0.1/30', 'fdfe:dcba:9876::1/126'],
          mtu: 1400,
          auto_route: true,
          strict_route: true,
          stack: 'mixed',
          dns_mode: 'hijack'
        }
      ],
      outbounds,
      route: {
        auto_detect_interface: true,
        final: selectedTag
      }
    };
  }
}
