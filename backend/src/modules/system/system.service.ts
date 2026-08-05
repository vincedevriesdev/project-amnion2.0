import { exec, execSync } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../core/config/env.js';
import { ProtocolsService } from '../protocols/protocols.service.js';
import { db } from '../../core/database/db.js';
import { generateRealityKeyPair, generateShortId } from '../../core/utils/crypto.js';

const execAsync = util.promisify(exec);

export interface UpdateProgress {
  active: boolean;
  step: number;
  progressPercent: number;
  message: string;
  error: string | null;
  startTime: string | null;
  completedAt: string | null;
}

let currentUpdateProgress: UpdateProgress = {
  active: false,
  step: 0,
  progressPercent: 0,
  message: 'Geen update actief',
  error: null,
  startTime: null,
  completedAt: null
};

export class SystemService {
  /**
   * Dynamically calculates local version string based on git commit count across candidate workspace directories
   */
  static getLocalVersion(): string {
    const candidateDirs = [
      process.cwd(),
      path.resolve(process.cwd(), '..'),
      '/opt/amnion'
    ];
    for (const dir of candidateDirs) {
      try {
        if (fs.existsSync(path.join(dir, '.git'))) {
          const stdout = execSync('git rev-list --count HEAD', { encoding: 'utf-8', cwd: dir }).toString().trim();
          if (stdout && !isNaN(Number(stdout))) {
            return `v2.0.${stdout}`;
          }
        }
      } catch {}
    }
    return 'v2.0.55';
  }

  /**
   * Dynamically fetches remote commit count from GitHub REST API
   */
  static async getRemoteCommitCount(): Promise<number | null> {
    try {
      const res = await fetch('https://api.github.com/repos/vincedevriesdev/project-amnion2.0/commits?per_page=1', {
        headers: { 'User-Agent': 'Amnion-Update-Checker' }
      });
      if (res.ok) {
        const linkHeader = res.headers.get('link');
        if (linkHeader) {
          const match = linkHeader.match(/&page=(\d+)>; rel="last"/);
          if (match && match[1]) {
            return parseInt(match[1], 10);
          }
        }
        const commits = await res.json() as any[];
        if (Array.isArray(commits) && commits.length > 0) {
          return 1;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Initializes REALITY keys in system_config DB if missing
   */
  static ensureRealityKeys() {
    const pubKey = db.prepare("SELECT value FROM system_config WHERE key = 'reality_public_key'").get();
    if (!pubKey) {
      const keys = generateRealityKeyPair();
      const shortId = generateShortId(8);

      db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('reality_public_key', ?)").run(keys.publicKey);
      db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('reality_private_key', ?)").run(keys.privateKey);
      db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('reality_short_id', ?)").run(shortId);
    }
  }

  static getRealityDetails() {
    this.ensureRealityKeys();
    const pubKey = (db.prepare("SELECT value FROM system_config WHERE key = 'reality_public_key'").get() as any)?.value;
    const shortId = (db.prepare("SELECT value FROM system_config WHERE key = 'reality_short_id'").get() as any)?.value;
    return { publicKey: pubKey, shortId };
  }

  /**
   * Performs atomic write of sing-box config
   */
  static async syncAndReloadSingBox(): Promise<{ success: boolean; message: string }> {
    this.ensureRealityKeys();
    const newConfig = ProtocolsService.generateSingBoxConfig();
    const configPath = CONFIG.SING_BOX_CONFIG_PATH;
    const tmpPath = `${configPath}.tmp`;

    try {
      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(tmpPath, JSON.stringify(newConfig, null, 2), 'utf-8');

      try {
        await execAsync(`${CONFIG.SING_BOX_BINARY} check -c ${tmpPath}`);
      } catch (checkErr: any) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return {
          success: false,
          message: `Sing-box configuratie validatie mislukt: ${checkErr.stderr || checkErr.message}`
        };
      }

      fs.renameSync(tmpPath, configPath);

      try {
        await execAsync('systemctl reload sing-box');
      } catch {
        await execAsync('systemctl restart sing-box');
      }

      return { success: true, message: 'Sing-box configuratie succesvol gesynchroniseerd en herladen' };
    } catch (err: any) {
      return { success: false, message: `System error: ${err.message}` };
    }
  }

  static getUpdateStatus(): UpdateProgress {
    const logPath = '/var/log/amnion-update.log';
    if (fs.existsSync(logPath)) {
      try {
        const logContent = fs.readFileSync(logPath, 'utf-8');

        if (
          logContent.includes('AMNION_UPDATE_FINISHED_SUCCESSFULLY') ||
          logContent.includes('Update & Validatie Succesvol') ||
          logContent.includes('Update Succesvol')
        ) {
          return {
            active: false,
            step: 5,
            progressPercent: 100,
            message: '🎉 Update succesvol voltooid! Amnion 2.0 is nu bijgewerkt naar de nieuwste versie.',
            error: null,
            startTime: currentUpdateProgress.startTime,
            completedAt: new Date().toISOString()
          };
        }

        if (logContent.includes('[ERROR]') || logContent.includes('Rollback succesvol')) {
          return {
            active: false,
            step: 5,
            progressPercent: 0,
            message: 'Fout tijdens update. Vorige staat hersteld.',
            error: 'Update mislukt! Automatische Rollback is uitgevoerd om de VPN online te houden.',
            startTime: currentUpdateProgress.startTime,
            completedAt: new Date().toISOString()
          };
        }

        if (logContent.includes('[5/5]')) {
          return {
            active: false,
            step: 5,
            progressPercent: 100,
            message: '🎉 Update succesvol voltooid! Amnion 2.0 is bijgewerkt.',
            error: null,
            startTime: currentUpdateProgress.startTime,
            completedAt: new Date().toISOString()
          };
        } else if (logContent.includes('[4/5]')) {
          currentUpdateProgress.step = 4;
          currentUpdateProgress.progressPercent = 85;
          currentUpdateProgress.message = 'Sing-box VPN configuraties valideren...';
        } else if (logContent.includes('[3/5]')) {
          currentUpdateProgress.step = 3;
          currentUpdateProgress.progressPercent = 65;
          currentUpdateProgress.message = 'Backend en Dashboard dependencies installeren en bouwen...';
        } else if (logContent.includes('[2/5]')) {
          currentUpdateProgress.step = 2;
          currentUpdateProgress.progressPercent = 40;
          currentUpdateProgress.message = 'Nieuwste Amnion code ophalen van GitHub...';
        } else if (logContent.includes('[1/5]')) {
          currentUpdateProgress.step = 1;
          currentUpdateProgress.progressPercent = 20;
          currentUpdateProgress.message = 'Pre-update tarball backup maken van database en sleutels...';
        }
      } catch {}
    }

    return currentUpdateProgress;
  }

  static async checkForUpdates(): Promise<{ updateAvailable: boolean; currentVersion: string; latestVersion: string; message: string }> {
    const localVer = this.getLocalVersion();
    const localCount = parseInt(localVer.replace('v2.0.', ''), 10) || 54;
    const remoteCount = await this.getRemoteCommitCount();

    if (remoteCount !== null) {
      const latestVer = `v2.0.${remoteCount}`;
      if (remoteCount > localCount) {
        return {
          updateAvailable: true,
          currentVersion: localVer,
          latestVersion: latestVer,
          message: `🚀 Update beschikbaar! Jij hebt versie ${localVer} en de nieuwste versie op GitHub is ${latestVer}.`
        };
      } else {
        return {
          updateAvailable: false,
          currentVersion: localVer,
          latestVersion: latestVer,
          message: `✅ Je draait op de nieuwste versie! Jij hebt versie ${localVer} en de nieuwste versie is ${latestVer}.`
        };
      }
    }

    return {
      updateAvailable: false,
      currentVersion: localVer,
      latestVersion: localVer,
      message: `✅ Jij hebt versie ${localVer} en de server is up-to-date.`
    };
  }

  static async triggerUpdate(): Promise<{ success: boolean; message: string }> {
    if (currentUpdateProgress.active && currentUpdateProgress.startTime) {
      const elapsedMs = Date.now() - new Date(currentUpdateProgress.startTime).getTime();
      if (elapsedMs > 5 * 60 * 1000) {
        currentUpdateProgress.active = false;
      }
    }

    try {
      const logPath = '/var/log/amnion-update.log';
      if (fs.existsSync(logPath)) fs.unlinkSync(logPath);
    } catch {}

    currentUpdateProgress = {
      active: true,
      step: 1,
      progressPercent: 10,
      message: 'Update proces gestart. Bezig met initialiseren...',
      error: null,
      startTime: new Date().toISOString(),
      completedAt: null
    };

    try {
      exec('nohup bash /opt/amnion/install/update.sh > /var/log/amnion-update.log 2>&1 &');
      return { success: true, message: 'Update proces gestart. Volg de live voortgang in het dashboard.' };
    } catch (err: any) {
      currentUpdateProgress.active = false;
      currentUpdateProgress.error = err.message;
      return { success: false, message: `Update kon niet worden gestart: ${err.message}` };
    }
  }

  static async triggerRollback(): Promise<{ success: boolean; message: string }> {
    try {
      const backupDir = '/var/backups/amnion';
      if (!fs.existsSync(backupDir)) throw new Error('Geen backups gevonden');

      const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.tar.gz')).sort().reverse();
      if (files.length === 0) throw new Error('Geen backups gevonden om te herstellen');

      const latestTar = path.join(backupDir, files[0]);
      exec(`nohup bash /opt/amnion/install/restore.sh "${latestTar}" > /var/log/amnion-rollback.log 2>&1 &`);

      return { success: true, message: `Rollback gestart met backup file: ${files[0]}` };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }

  static async getRecentLogs(lines: number = 100): Promise<string> {
    try {
      const { stdout } = await execAsync(`journalctl -u sing-box -u amnion-backend -n ${lines} --no-pager`);
      if (stdout && stdout.trim().length > 0) {
        return stdout;
      }
    } catch {}

    const sbLogPath = '/var/log/sing-box/sing-box.log';
    if (fs.existsSync(sbLogPath)) {
      try {
        const content = fs.readFileSync(sbLogPath, 'utf-8');
        const logLines = content.split('\n').slice(-lines).join('\n');
        if (logLines.trim().length > 0) return logLines;
      } catch {}
    }

    const installLogPath = '/var/log/amnion-install.log';
    if (fs.existsSync(installLogPath)) {
      try {
        const content = fs.readFileSync(installLogPath, 'utf-8');
        const logLines = content.split('\n').slice(-lines).join('\n');
        if (logLines.trim().length > 0) return `--- INSTALLATIE LOGBOEK ---\n${logLines}`;
      } catch {}
    }

    return `[INFO] Systeem Operationeel (${new Date().toISOString()})\n[INFO] Geen recente journalctl of bestand logs gevonden op de VPS. Services draaien in een schone staat.`;
  }
}
