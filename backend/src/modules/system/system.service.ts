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

  /**
   * Performs atomic write of sing-box config:
   * 1. Write to /etc/sing-box/config.json.tmp
   * 2. Run sing-box check -c config.json.tmp
   * 3. Atomic rename to config.json
   * 4. Trigger systemctl reload sing-box
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

      // Step 1: Write tmp file
      fs.writeFileSync(tmpPath, JSON.stringify(newConfig, null, 2), 'utf-8');

      // Step 2: Validate via sing-box check (if sing-box is installed)
      try {
        await execAsync(`${CONFIG.SING_BOX_BINARY} check -c ${tmpPath}`);
      } catch (checkErr: any) {
        // Validation failed! Delete tmp file and abort
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
        return {
          success: false,
          message: `Sing-box configuratie validatie mislukt: ${checkErr.stderr || checkErr.message}`
        };
      }

      // Step 3: Atomic rename
      fs.renameSync(tmpPath, configPath);

      // Step 4: Graceful systemd reload
      try {
        await execAsync('systemctl reload sing-box');
      } catch (reloadErr: any) {
        // Fallback: try restarting if reload fails
        await execAsync('systemctl restart sing-box');
      }

      return { success: true, message: 'Sing-box configuratie succesvol gesynchroniseerd en herladen' };
    } catch (err: any) {
      return { success: false, message: `System error: ${err.message}` };
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
