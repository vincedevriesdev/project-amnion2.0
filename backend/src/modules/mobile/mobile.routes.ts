import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { MobileService } from './mobile.service.js';

function bearerToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  return token.length >= 32 && token.length <= 256 ? token : null;
}

function statusFor(error: Error): number {
  if (error.message.includes('niet ingeschakeld') || error.message.includes('nog niet geconfigureerd')) return 404;
  if (error.message.includes('token')) return 401;
  return 400;
}

export async function mobileRoutes(fastify: FastifyInstance) {
  fastify.get('/region', {
    config: { rateLimit: { max: 30, timeWindow: '1 minute' } }
  }, async () => MobileService.region());

  fastify.post('/register', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } },
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['displayName', 'installationId'],
        properties: {
          displayName: { type: 'string', minLength: 2, maxLength: 32 },
          installationId: { type: 'string', minLength: 16, maxLength: 128 },
          devicePublicKey: { type: 'string', minLength: 32, maxLength: 256 },
          // Kept optional so older APKs remain compatible after the public
          // name-only onboarding was introduced.
          accessCode: { type: 'string', minLength: 8, maxLength: 128 },
          protocol: { type: 'string', enum: ['vless_reality', 'hysteria2', 'tuic'] }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await MobileService.register(request.body as any);
      reply.header('Cache-Control', 'no-store');
      return reply.status(201).send(result);
    } catch (error: any) {
      request.log.warn({ err: error, ip: request.ip }, 'mobile provisioning failed');
      return reply.status(statusFor(error)).send({ error: error.message });
    }
  });

  fastify.post('/profile/refresh', {
    config: { rateLimit: { max: 30, timeWindow: '1 hour' } }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearerToken(request);
    if (!token) return reply.status(401).send({ error: 'Apparaat-token ontbreekt' });
    try {
      const result = MobileService.refresh(token);
      reply.header('Cache-Control', 'no-store');
      return reply.send(result);
    } catch (error: any) {
      return reply.status(statusFor(error)).send({ error: error.message });
    }
  });

  fastify.post('/profile/revoke', {
    config: { rateLimit: { max: 10, timeWindow: '1 hour' } }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearerToken(request);
    if (!token) return reply.status(401).send({ error: 'Apparaat-token ontbreekt' });
    try {
      await MobileService.revoke(token);
      return reply.send({ status: 'ok' });
    } catch (error: any) {
      return reply.status(statusFor(error)).send({ error: error.message });
    }
  });

  fastify.post('/profile/protocol', {
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    schema: {
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['protocol'],
        properties: { protocol: { type: 'string', enum: ['vless_reality', 'hysteria2', 'tuic'] } }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const token = bearerToken(request);
    if (!token) return reply.status(401).send({ error: 'Apparaat-token ontbreekt' });
    try {
      const result = await MobileService.setProtocol(token, (request.body as any).protocol);
      reply.header('Cache-Control', 'no-store');
      return reply.send(result);
    } catch (error: any) {
      return reply.status(statusFor(error)).send({ error: error.message });
    }
  });
}
