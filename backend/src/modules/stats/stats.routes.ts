import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { StatsService } from './stats.service.js';
import { AuthService } from '../auth/auth.service.js';

export async function statsRoutes(fastify: FastifyInstance) {
  // Auth check
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.amnion_session;
    if (!token || !AuthService.validateSession(token)) {
      return reply.status(401).send({ error: 'Niet geautoriseerd' });
    }
  });

  fastify.get('/overview', {
    config: {
      rateLimit: {
        max: 60,
        timeWindow: '1 minute'
      }
    }
  }, async () => {
    return StatsService.getSystemMetrics();
  });
}
