import crypto from 'crypto';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';

export function generateUUID(): string {
  return uuidv4();
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

export function generateShortId(length: number = 8): string {
  return crypto.randomBytes(length / 2).toString('hex');
}

/**
 * Generate 100% valid Curve25519 Keypair for VLESS REALITY using sing-box CLI or Node JWK export
 */
export function generateRealityKeyPair(): { publicKey: string; privateKey: string } {
  try {
    const stdout = execSync('sing-box generate reality-keypair', { encoding: 'utf-8' });
    const privMatch = stdout.match(/PrivateKey:\s*([A-Za-z0-9_-]+)/i);
    const pubMatch = stdout.match(/PublicKey:\s*([A-Za-z0-9_-]+)/i);
    if (privMatch && pubMatch) {
      return {
        privateKey: privMatch[1].trim(),
        publicKey: pubMatch[1].trim()
      };
    }
  } catch {}

  // Native Node.js fallback using JWK export (guarantees exact matching X25519 32-byte raw keys)
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
  const privJwk = privateKey.export({ format: 'jwk' });
  const pubJwk = publicKey.export({ format: 'jwk' });

  if (privJwk.d && pubJwk.x) {
    return {
      privateKey: privJwk.d,
      publicKey: pubJwk.x
    };
  }

  throw new Error('Failed to generate REALITY keypair');
}
