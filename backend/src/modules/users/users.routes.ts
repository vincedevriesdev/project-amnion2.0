import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UsersService } from './users.service.js';
import { AuthService } from '../auth/auth.service.js';

export async function usersRoutes(fastify: FastifyInstance) {
  // Auth check middleware
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.amnion_session;
    if (!token || !AuthService.validateSession(token)) {
      return reply.status(401).send({ error: 'Niet geautoriseerd' });
    }
  });

  fastify.get('/', async () => {
    return { users: UsersService.listUsers() };
  });

  fastify.get('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const user = UsersService.getUserById(id);
    if (!user) return reply.status(404).send({ error: 'Gebruiker niet gevonden' });
    return { user };
  });

  fastify.post('/', async (request: FastifyRequest, reply: FastifyReply) => {
    const { username, dataLimitBytes, expireAt, protocols } = request.body as any;
    if (!username) return reply.status(400).send({ error: 'Gebruikersnaam is verplicht' });

    try {
      const user = UsersService.createUser(username, dataLimitBytes, expireAt, protocols);
      return reply.status(201).send({ user });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.put('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    try {
      const user = UsersService.updateUser(id, request.body as any);
      return { user };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post('/:id/reset-token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    try {
      const res = UsersService.resetUserToken(id);
      return { status: 'ok', ...res };
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.delete('/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    UsersService.deleteUser(id);
    return { status: 'ok' };
  });
}
