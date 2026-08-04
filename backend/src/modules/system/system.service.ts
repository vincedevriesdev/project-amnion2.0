import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { CONFIG } from '../../core/config/env.js';
import { ProtocolsService } from '../protocols/protocols.service.js';
import { db } from '../../core/database/db.js';
import { generateRealityKeyPair, generateShortId } from '../../core/utils/crypto.js';

const execAsync = util.promisify(exec);

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

  static async triggerUpdate(): Promise<{ success: boolean; message: string }> {
    try {
      // Run update script asynchronously in background
      exec('bash /opt/amnion/install/update.sh > /var/log/amnion-update.log 2>&1 &');
      return { success: true, message: 'Update proces gestart in de achtergrond! Bekijk de logboeken voor voortgang.' };
    } catch (err: any) {
      return { success: false, message: `Update kon niet worden gestart: ${err.message}` };
    }
  }

  static async triggerRollback(): Promise<{ success: boolean; message: string }> {
    try {
      // Find latest backup tarball
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
      return stdout;
    } catch {
      return 'Logboeken konden niet worden opgehaald via journalctl';
    }
  }
}
