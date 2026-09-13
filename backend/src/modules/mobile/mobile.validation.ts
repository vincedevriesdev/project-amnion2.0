import crypto from 'crypto';

export const MOBILE_PROTOCOLS = ['hysteria2', 'tuic', 'vless_reality'] as const;
export type MobileProtocol = typeof MOBILE_PROTOCOLS[number];

export function normalizeDisplayName(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Naam is verplicht');
  const normalized = value.normalize('NFKC').trim().replace(/\s+/g, ' ');
  if (normalized.length < 2 || normalized.length > 32) {
    throw new Error('Naam moet tussen 2 en 32 tekens lang zijn');
  }
  if (!/^[\p{L}\p{N} ._'’-]+$/u.test(normalized)) {
    throw new Error('Naam bevat niet-toegestane tekens');
  }
  return normalized;
}

export function normalizeInstallationId(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Ongeldige apparaatidentiteit');
  const normalized = value.trim();
  if (normalized.length < 16 || normalized.length > 128 || !/^[A-Za-z0-9._:-]+$/.test(normalized)) {
    throw new Error('Ongeldige apparaatidentiteit');
  }
  return normalized;
}

export function normalizeDevicePublicKey(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string') throw new Error('Ongeldige apparaatsleutel');
  const normalized = value.trim();
  if (normalized.length < 32 || normalized.length > 256 || !/^[A-Za-z0-9+/=_-]+$/.test(normalized)) {
    throw new Error('Ongeldige apparaatsleutel');
  }
  return normalized;
}

export function hashCredential(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

export function hashInstallationId(value: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(value, 'utf8').digest('hex');
}

export function accessCodeMatches(accessCode: unknown, allowedHashes: string[]): boolean {
  if (typeof accessCode !== 'string' || accessCode.length < 8 || accessCode.length > 128) return false;
  const actual = Buffer.from(hashCredential(accessCode.trim()), 'hex');
  return allowedHashes.some(candidate => {
    if (!/^[a-fA-F0-9]{64}$/.test(candidate)) return false;
    const expected = Buffer.from(candidate, 'hex');
    return expected.length === actual.length && crypto.timingSafeEqual(actual, expected);
  });
}

export function validProtocols(protocols: string[]): MobileProtocol[] {
  const configured = new Set(protocols);
  const valid = MOBILE_PROTOCOLS.filter(protocol => configured.has(protocol));
  return valid.length > 0 ? valid : ['vless_reality'];
}

export function slugifyName(value: string): string {
  const slug = value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18);
  return slug || 'gebruiker';
}
