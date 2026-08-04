import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SystemService } from './system.service.js';
import { AuthService } from '../auth/auth.service.js';

export async function systemRoutes(fastify: FastifyInstance) {
  // Auth check
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.amnion_session;
    if (!token || !AuthService.validateSession(token)) {
      return reply.status(401).send({ error: 'Niet geautoriseerd' });
    }
  });

  fastify.post('/reload-singbox', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await SystemService.syncAndReloadSingBox();
    if (!result.success) {
      return reply.status(500).send({ error: result.message });
    }
    return { status: 'ok', message: result.message };
  });

  fastify.post('/update', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await SystemService.triggerUpdate();
    return { status: 'ok', message: result.message };
  });

  fastify.get('/update-status', async () => {
    return SystemService.getUpdateStatus();
  });

  fastify.post('/rollback', async (request: FastifyRequest, reply: FastifyReply) => {
    const result = await SystemService.triggerRollback();
    if (!result.success) {
      return reply.status(500).send({ error: result.message });
    }
    return { status: 'ok', message: result.message };
  });

  fastify.get('/reality-info', async () => {
    return SystemService.getRealityDetails();
  });

  fastify.get('/logs', async (request: FastifyRequest) => {
    const { lines } = request.query as any;
    const lineCount = lines ? parseInt(lines, 10) : 100;
    const logs = await SystemService.getRecentLogs(lineCount);
    return { logs };
  });
}
