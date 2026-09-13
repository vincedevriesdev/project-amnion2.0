import test from 'node:test';
import assert from 'node:assert/strict';
import {
  accessCodeMatches,
  hashCredential,
  hashInstallationId,
  normalizeDevicePublicKey,
  normalizeDisplayName,
  normalizeInstallationId,
  slugifyName,
  validProtocols
} from '../dist/modules/mobile/mobile.validation.js';

test('normalizes a safe display name without changing Unicode letters', () => {
  assert.equal(normalizeDisplayName('  Vince   de Vries  '), 'Vince de Vries');
  assert.equal(normalizeDisplayName('Zoë'), 'Zoë');
});

test('rejects unsafe or oversized display names', () => {
  assert.throws(() => normalizeDisplayName('<script>'), /niet-toegestane/);
  assert.throws(() => normalizeDisplayName('a'), /tussen 2 en 32/);
  assert.throws(() => normalizeDisplayName('x'.repeat(33)), /tussen 2 en 32/);
});

test('validates installation identifiers and public keys', () => {
  assert.equal(normalizeInstallationId('550e8400-e29b-41d4-a716-446655440000'), '550e8400-e29b-41d4-a716-446655440000');
  assert.throws(() => normalizeInstallationId('../etc/passwd'), /Ongeldige/);
  assert.equal(normalizeDevicePublicKey(null), null);
  assert.equal(normalizeDevicePublicKey('A'.repeat(44)), 'A'.repeat(44));
});

test('compares access codes against SHA-256 hashes', () => {
  const expected = hashCredential('CorrectHorseBatteryStaple');
  assert.equal(accessCodeMatches('CorrectHorseBatteryStaple', [expected]), true);
  assert.equal(accessCodeMatches('wrong-password', [expected]), false);
  assert.equal(accessCodeMatches('CorrectHorseBatteryStaple', ['not-a-hash']), false);
});

test('installation hashes are deterministic but secret-dependent', () => {
  const first = hashInstallationId('installation-123456', 'secret-a');
  assert.equal(first, hashInstallationId('installation-123456', 'secret-a'));
  assert.notEqual(first, hashInstallationId('installation-123456', 'secret-b'));
});

test('protocol selection is allowlisted and always has a secure fallback', () => {
  assert.deepEqual(validProtocols(['tuic', 'invalid', 'vless_reality']), ['tuic', 'vless_reality']);
  assert.deepEqual(validProtocols([]), ['vless_reality']);
});

test('slugifies display names for internal usernames', () => {
  assert.equal(slugifyName('Vince de Vries'), 'vince-de-vries');
  assert.equal(slugifyName('!!!'), 'gebruiker');
});
