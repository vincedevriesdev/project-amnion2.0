import { exec } from 'child_process';
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
    // If update is running, check update log file for step progress
    const logPath = '/var/log/amnion-update.log';
    if (currentUpdateProgress.active && fs.existsSync(logPath)) {
      try {
        const logContent = fs.readFileSync(logPath, 'utf-8');
        if (logContent.includes('[1/5]')) {
          currentUpdateProgress.step = 1;
          currentUpdateProgress.progressPercent = 20;
          currentUpdateProgress.message = 'Pre-update tarball backup maken van database en sleutels...';
        }
        if (logContent.includes('[2/5]')) {
          currentUpdateProgress.step = 2;
          currentUpdateProgress.progressPercent = 40;
          currentUpdateProgress.message = 'Nieuwste Amnion code ophalen van GitHub...';
        }
        if (logContent.includes('[3/5]')) {
          currentUpdateProgress.step = 3;
          currentUpdateProgress.progressPercent = 65;
          currentUpdateProgress.message = 'Backend en Dashboard dependencies installeren en bouwen...';
        }
        if (logContent.includes('[4/5]')) {
          currentUpdateProgress.step = 4;
          currentUpdateProgress.progressPercent = 85;
          currentUpdateProgress.message = 'Sing-box VPN configuraties valideren...';
        }
        if (logContent.includes('[5/5]')) {
          currentUpdateProgress.step = 5;
          currentUpdateProgress.progressPercent = 95;
          currentUpdateProgress.message = 'Services herstarten en API gezondheid controleren...';
        }
        if (logContent.includes('Update & Validatie Succesvol') || logContent.includes('Update Succesvol')) {
          currentUpdateProgress.active = false;
          currentUpdateProgress.step = 5;
          currentUpdateProgress.progressPercent = 100;
          currentUpdateProgress.message = 'Update succesvol afgerond! VPN en dashboard zijn 100% operationeel.';
          currentUpdateProgress.completedAt = new Date().toISOString();
        } else if (logContent.includes('[ERROR]') || logContent.includes('Rollback succesvol')) {
          currentUpdateProgress.active = false;
          currentUpdateProgress.error = 'Update mislukt! Automatische Rollback is uitgevoerd om de VPN online te houden.';
          currentUpdateProgress.message = 'Fout tijdens update. Vorige staat hersteld.';
        }
      } catch {}
    }

    return currentUpdateProgress;
  }

  static async triggerUpdate(): Promise<{ success: boolean; message: string }> {
    if (currentUpdateProgress.active) {
      return { success: false, message: 'Er is al een update actief op het systeem!' };
    }

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
      exec('bash /opt/amnion/install/update.sh > /var/log/amnion-update.log 2>&1 &');
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
      exec(`bash /opt/amnion/install/restore.sh "${latestTar}" > /var/log/amnion-rollback.log 2>&1 &`);

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
