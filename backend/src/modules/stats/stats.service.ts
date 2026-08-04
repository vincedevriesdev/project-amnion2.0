import os from 'os';
import { db } from '../../core/database/db.js';

export class StatsService {
  static getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const uptime = os.uptime();

    // Database counts
    const activeUsersCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'active'").get() as any).c;
    const totalUsersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;

    // Protocol distribution
    const protocolCounts = db.prepare(`
      SELECT protocol_type, COUNT(*) as count
      FROM user_protocols
      WHERE is_enabled = 1
      GROUP BY protocol_type
    `).all() as any[];

    const protocolMap: Record<string, number> = {
      hysteria2: 0,
      tuic: 0,
      vless_reality: 0
    };

    for (const row of protocolCounts) {
      protocolMap[row.protocol_type] = row.count;
    }

    return {
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usagePercentage: Math.round((usedMem / totalMem) * 100)
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Generic CPU',
        loadAvg1m: Math.round(loadAvg[0] * 100) / 100,
        loadAvg5m: Math.round(loadAvg[1] * 100) / 100,
        loadAvg15m: Math.round(loadAvg[2] * 100) / 100
      },
      system: {
        uptimeSeconds: Math.round(uptime),
        platform: os.platform(),
        release: os.release()
      },
      users: {
        active: activeUsersCount,
        total: totalUsersCount
      },
      protocolDistribution: protocolMap
    };
  }
}
