import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';

const dbPath = path.join(os.tmpdir(), `amnion-test-${process.pid}.db`);
process.env.NODE_ENV = 'test';
process.env.DB_PATH = dbPath;
process.env.SERVER_DOMAIN = 'vpn.example.test';
process.env.PUBLIC_IP = '203.0.113.10';
process.env.MOBILE_PROFILE_PROTOCOLS = 'vless_reality,hysteria2,tuic';
process.env.MOBILE_PROVISIONING_ENABLED = 'true';
process.env.MOBILE_REGION_ID = 'test';
process.env.MOBILE_REGION_NAME = 'Testregio';
process.env.MOBILE_ACCESS_CODE_HASHES = crypto.createHash('sha256').update('test-access-code').digest('hex');

const { db, initDatabase } = await import('../dist/core/database/db.js');
const { UsersService } = await import('../dist/modules/users/users.service.js');
const { SubscriptionsService } = await import('../dist/modules/subscriptions/subscriptions.service.js');
const { MobileProfileService } = await import('../dist/modules/mobile/mobile-profile.service.js');
const { MobileService } = await import('../dist/modules/mobile/mobile.service.js');
const { mobileRoutes } = await import('../dist/modules/mobile/mobile.routes.js');

initDatabase();
db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('reality_public_key', ?)")
  .run('A7vH97mM53CGu8pMUqkOdDdnlD9Zdz4wwNOkAnIs1kM');
db.prepare("INSERT OR REPLACE INTO system_config (key, value) VALUES ('reality_short_id', ?)")
  .run('a1b2c3d4');

after(() => {
  db.close();
  for (const suffix of ['', '-wal', '-shm']) {
    try { fs.unlinkSync(dbPath + suffix); } catch {}
  }
});

test('existing Hiddify subscription output remains available', () => {
  const user = UsersService.createUser('existing-hiddify-user');
  const data = SubscriptionsService.getSubscriptionData(user.subscriptionToken);
  assert.equal(data.user.username, 'existing-hiddify-user');
  assert.match(data.plainTextConfig, /hysteria2:\/\//);
  assert.match(data.plainTextConfig, /tuic:\/\//);
  assert.match(data.plainTextConfig, /vless:\/\//);
});

test('mobile profile is isolated and uses a TUN with VLESS REALITY', () => {
  const user = UsersService.createUser('mobile-test-user', 0, null, ['vless_reality']);
  const config = MobileProfileService.build(user);
  assert.equal(config.inbounds[0].type, 'tun');
  assert.equal(config.route.final, 'vless-reality');
  const outbound = config.outbounds.find(item => item.tag === 'vless-reality');
  assert.equal(outbound.server, '203.0.113.10');
  assert.equal(outbound.uuid, user.uuid);
  assert.equal(outbound.tls.reality.public_key, 'A7vH97mM53CGu8pMUqkOdDdnlD9Zdz4wwNOkAnIs1kM');
  assert.equal(config.dns.servers[0].detour, 'vless-reality');
});

test('every selectable mobile protocol passes an installed sing-box validator', { skip: !process.env.SING_BOX_TEST_BINARY }, () => {
  for (const protocol of ['vless_reality', 'hysteria2', 'tuic']) {
    const user = UsersService.createUser(`singbox-${protocol}`, 0, null, [protocol]);
    const config = MobileProfileService.build(user, [protocol]);
    const configPath = path.join(os.tmpdir(), `amnion-singbox-${protocol}-${process.pid}.json`);
    fs.writeFileSync(configPath, JSON.stringify(config));
    try {
      const result = spawnSync(process.env.SING_BOX_TEST_BINARY, ['check', '-c', configPath], { encoding: 'utf8' });
      assert.equal(result.status, 0, `${protocol}: ${result.stdout}\n${result.stderr}`);
    } finally {
      try { fs.unlinkSync(configPath); } catch {}
    }
  }
});

test('mobile registration is idempotent and rotates the device token', async () => {
  const payload = {
    displayName: 'Mobiele Tester',
    installationId: '550e8400-e29b-41d4-a716-446655440000',
    accessCode: 'test-access-code'
  };
  const fakeSync = async () => ({ success: true, message: 'test' });
  const first = await MobileService.register(payload, fakeSync);
  const second = await MobileService.register({ ...payload, protocol: 'hysteria2' }, fakeSync);
  assert.equal(first.deviceId, second.deviceId);
  assert.notEqual(first.deviceToken, second.deviceToken);
  assert.equal(first.region.id, 'test');
  assert.equal(second.user.displayName, 'Mobiele Tester');
  assert.equal(first.profile.protocol, 'vless_reality');
  assert.equal(second.profile.protocol, 'hysteria2');
  assert.equal(second.profile.config.route.final, 'hysteria2');
  assert.equal(db.prepare('SELECT COUNT(*) AS count FROM mobile_devices').get().count, 1);
});

test('an authenticated mobile device can change protocol without changing its token', async () => {
  const payload = {
    displayName: 'Protocol Tester',
    installationId: '550e8400-e29b-41d4-a716-446655440009',
    accessCode: 'test-access-code',
    protocol: 'vless_reality'
  };
  const fakeSync = async () => ({ success: true, message: 'test' });
  const created = await MobileService.register(payload, fakeSync);
  const changed = await MobileService.setProtocol(created.deviceToken, 'tuic', fakeSync);
  assert.equal(changed.profile.protocol, 'tuic');
  assert.equal(changed.profile.config.route.final, 'tuic');
  assert.equal(MobileService.refresh(created.deviceToken).profile.protocol, 'tuic');
});

test('mobile HTTP routes expose region metadata and reject a bad access code', async () => {
  const Fastify = (await import('fastify')).default;
  const fastifyRateLimit = (await import('@fastify/rate-limit')).default;
  const app = Fastify({ logger: false });
  await app.register(fastifyRateLimit, { max: 300, timeWindow: '1 minute' });
  await app.register(mobileRoutes, { prefix: '/api/v1/mobile' });

  try {
    const region = await app.inject({ method: 'GET', url: '/api/v1/mobile/region' });
    assert.equal(region.statusCode, 200);
    assert.deepEqual(region.json().protocols, ['hysteria2', 'tuic', 'vless_reality']);

    const rejected = await app.inject({
      method: 'POST',
      url: '/api/v1/mobile/register',
      payload: {
        displayName: 'Vince',
        installationId: '550e8400-e29b-41d4-a716-446655440001',
        accessCode: 'wrong-code'
      }
    });
    assert.equal(rejected.statusCode, 401);
    assert.equal(rejected.json().error, 'Ongeldige toegangscode');
  } finally {
    await app.close();
  }
});
