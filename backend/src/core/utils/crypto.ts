import crypto from 'crypto';
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
 * Generate Curve25519 Keypair for VLESS REALITY
 */
export function generateRealityKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519', {
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' },
  });

  // Extract raw 32 bytes from DER structures for sing-box compatibility
  const pubRaw = publicKey.subarray(publicKey.length - 32).toString('base64url');
  const privRaw = privateKey.subarray(privateKey.length - 32).toString('base64url');

  return {
    publicKey: pubRaw,
    privateKey: privRaw,
  };
}
