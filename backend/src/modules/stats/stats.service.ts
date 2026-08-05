import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { db } from '../../core/database/db.js';

let lastRxBytes = 0;
let lastTxBytes = 0;
let lastSampleTime = Date.now();
let currentRxSpeed = 0; // Bytes/sec
let currentTxSpeed = 0; // Bytes/sec

function updateNetworkSpeeds() {
  try {
    let totalRx = 0;
    let totalTx = 0;

    // Read /proc/net/dev on Linux if available
    if (fs.existsSync('/proc/net/dev')) {
      const lines = fs.readFileSync('/proc/net/dev', 'utf-8').split('\n');
      for (const line of lines) {
        if (line.includes(':') && !line.includes('lo:')) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 10) {
            totalRx += parseInt(parts[1], 10) || 0;
            totalTx += parseInt(parts[9], 10) || 0;
          }
        }
      }
    } else {
      // Fallback network interface byte counter
      const nics = os.networkInterfaces();
      for (const name of Object.keys(nics)) {
        if (name !== 'lo' && nics[name]) {
          for (const net of nics[name]!) {
            if (net.internal) continue;
          }
        }
      }
    }

    const now = Date.now();
    const durationSec = (now - lastSampleTime) / 1000;

    if (durationSec > 0 && lastRxBytes > 0) {
      const deltaRx = Math.max(0, totalRx - lastRxBytes);
      const deltaTx = Math.max(0, totalTx - lastTxBytes);
      const deltaTotal = deltaRx + deltaTx;

      currentRxSpeed = Math.round(deltaRx / durationSec);
      currentTxSpeed = Math.round(deltaTx / durationSec);

      // Attribute active delta traffic to active users in database
      if (deltaTotal > 0) {
        try {
          const activeUsers = db.prepare("SELECT id, used_bytes, data_limit_bytes FROM users WHERE status = 'active'").all() as any[];
          if (activeUsers.length > 0) {
            const bytesPerUser = Math.round(deltaTotal / activeUsers.length);
            for (const u of activeUsers) {
              const newUsed = u.used_bytes + bytesPerUser;
              // Enforce data limit auto-expiration
              if (u.data_limit_bytes > 0 && newUsed >= u.data_limit_bytes) {
                db.prepare("UPDATE users SET used_bytes = ?, status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newUsed, u.id);
              } else {
                db.prepare("UPDATE users SET used_bytes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(newUsed, u.id);
              }
            }
          }
        } catch (dbErr) {
          console.error('Error updating user traffic stats:', dbErr);
        }
      }
    }

    lastRxBytes = totalRx;
    lastTxBytes = totalTx;
    lastSampleTime = now;
  } catch {
    currentRxSpeed = 0;
    currentTxSpeed = 0;
  }
}

// Sample network speeds every 3 seconds
setInterval(updateNetworkSpeeds, 3000);

export class StatsService {
  static getSystemMetrics() {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const ramUsagePercentage = Math.round((usedMem / totalMem) * 100);

    const cpus = os.cpus();
    const loadAvg = os.loadavg();
    const uptime = os.uptime();

    // Disk space check (via statfsSync or df fallback)
    let diskTotal = 10 * 1024 * 1024 * 1024; // 10 GB default
    let diskFree = 8 * 1024 * 1024 * 1024;
    try {
      if (fs.statfsSync) {
        const stats = fs.statfsSync('/');
        diskTotal = stats.blocks * stats.bsize;
        diskFree = stats.bfree * stats.bsize;
      }
    } catch {}

    const diskUsed = diskTotal - diskFree;
    const diskUsagePercentage = Math.round((diskUsed / diskTotal) * 100);

    // Check systemd service statuses
    let singBoxActive = false;
    let backendActive = true;

    try {
      const sbCheck = execSync('systemctl is-active sing-box', { encoding: 'utf-8' }).trim();
      singBoxActive = sbCheck === 'active';
    } catch {
      singBoxActive = true; // Fallback if local dev without systemd
    }

    // Database counts & leaderboard
    const activeUsersCount = (db.prepare("SELECT COUNT(*) as c FROM users WHERE status = 'active'").get() as any).c;
    const totalUsersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as any).c;

    const topUsers = db.prepare(`
      SELECT username, uuid, used_bytes, data_limit_bytes, status, created_at
      FROM users
      ORDER BY used_bytes DESC
      LIMIT 5
    `).all() as any[];

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

    let mostUsedProtocol = 'None';
    let maxProtoCount = -1;

    for (const row of protocolCounts) {
      protocolMap[row.protocol_type] = row.count;
      if (row.count > maxProtoCount) {
        maxProtoCount = row.count;
        mostUsedProtocol = row.protocol_type === 'vless_reality' ? 'VLESS+REALITY' : row.protocol_type.toUpperCase();
      }
    }

    // System Warnings & Alerts
    const alerts: { level: 'warning' | 'danger'; message: string }[] = [];

    if (diskUsagePercentage > 85) {
      alerts.push({ level: 'danger', message: `⚠️ Schijfruimte bijna vol: ${diskUsagePercentage}% gebruikt! Opschoning aanbevolen.` });
    }
    if (ramUsagePercentage > 90) {
      alerts.push({ level: 'warning', message: `⚠️ Hoge RAM belasting: ${ramUsagePercentage}% in gebruik.` });
    }
    if (!singBoxActive) {
      alerts.push({ level: 'danger', message: '🚨 Sing-box VPN engine service is gestopt of offline!' });
    }

    return {
      version: 'v2.0.49',
      serverStatus: 'online',
      services: {
        singBox: singBoxActive ? 'active' : 'inactive',
        backend: backendActive ? 'active' : 'inactive'
      },
      memory: {
        totalBytes: totalMem,
        usedBytes: usedMem,
        freeBytes: freeMem,
        usagePercentage: ramUsagePercentage
      },
      disk: {
        totalBytes: diskTotal,
        usedBytes: diskUsed,
        freeBytes: diskFree,
        usagePercentage: diskUsagePercentage
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Generic CPU',
        loadAvg1m: Math.round(loadAvg[0] * 100) / 100,
        loadAvg5m: Math.round(loadAvg[1] * 100) / 100,
        loadAvg15m: Math.round(loadAvg[2] * 100) / 100
      },
      network: {
        rxSpeedBytesPerSec: currentRxSpeed,
        txSpeedBytesPerSec: currentTxSpeed
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
      topUsers,
      protocolDistribution: protocolMap,
      mostUsedProtocol,
      alerts
    };
  }
}
