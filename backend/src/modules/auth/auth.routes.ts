import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from './auth.service.js';

export async function authRoutes(fastify: FastifyInstance) {
  // Login route
  fastify.post('/login', {
    config: {
      rateLimit: {
        max: 5,
        timeWindow: '15 minutes'
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, password } = request.body as any;
    if (!username || !password) {
      return reply.status(400).send({ error: 'Gebruikersnaam en wachtwoord zijn verplicht' });
    }

    try {
      const ip = request.ip;
      const userAgent = request.headers['user-agent'] || '';
      const result = await AuthService.login(username, password, ip, userAgent);

      const isHttps = request.protocol === 'https';
      reply.setCookie('amnion_session', result.rawToken, {
        path: '/',
        httpOnly: true,
        secure: isHttps,
        sameSite: 'lax',
        expires: new Date(result.expiresAt)
      });

      return reply.send({ status: 'ok', admin: result.admin });
    } catch (err: any) {
      return reply.status(401).send({ error: err.message });
    }
  });

  // Logout route
  fastify.post('/logout', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.amnion_session;
    if (token) {
      AuthService.logout(token);
    }
    reply.clearCookie('amnion_session', { path: '/' });
    return reply.send({ status: 'ok' });
  });

  // Change password route
  fastify.post('/change-password', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.amnion_session;
    if (!token) return reply.status(401).send({ error: 'Niet ingelogd' });

    const session = AuthService.validateSession(token);
    if (!session) return reply.status(401).send({ error: 'Sessie verlopen' });

    const { oldPassword, newPassword } = request.body as any;
    if (!oldPassword || !newPassword) {
      return reply.status(400).send({ error: 'Oud en nieuw wachtwoord zijn verplicht' });
    }

    try {
      await AuthService.changePassword(session.admin_id, oldPassword, newPassword);
      reply.clearCookie('amnion_session', { path: '/' });
      return reply.send({ status: 'ok', message: 'Wachtwoord succesvol gewijzigd. Log opnieuw in.' });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Session check route
  fastify.get('/me', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.amnion_session;
    if (!token) {
      return reply.status(401).send({ error: 'Niet ingelogd' });
    }
    const session = AuthService.validateSession(token);
    if (!session) {
      return reply.status(401).send({ error: 'Sessie verlopen' });
    }
    return reply.send({
      admin: {
        id: session.admin_id,
        username: session.username,
        role: session.role
      }
    });
  });
}
