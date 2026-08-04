import Fastify from 'fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyRateLimit from '@fastify/rate-limit';
import { CONFIG } from './core/config/env.js';
import { initDatabase } from './core/database/db.js';
import { AuthService } from './modules/auth/auth.service.js';
import { SystemService } from './modules/system/system.service.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { subscriptionsRoutes } from './modules/subscriptions/subscriptions.routes.js';
import { statsRoutes } from './modules/stats/stats.routes.js';
import { systemRoutes } from './modules/system/system.routes.js';

import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';

const fastify = Fastify({
  logger: {
    level: 'info'
  }
});

async function startServer() {
  try {
    // 1. Initialize SQLite Database & Tables
    initDatabase();
    await AuthService.createInitialAdminIfNone();

    // Automatically sync & write sing-box config on backend startup
    try {
      await SystemService.syncAndReloadSingBox();
    } catch (syncErr) {
      console.error('Initial sing-box sync warning:', syncErr);
    }

    // 2. Register Middleware Plugins
    await fastify.register(fastifyCors, {
      origin: true,
      credentials: true
    });

    await fastify.register(fastifyCookie, {
      secret: CONFIG.COOKIE_SECRET
    });

    await fastify.register(fastifyRateLimit, {
      max: 300,
      timeWindow: '1 minute'
    });

    // 3. Register Domain Routes
    await fastify.register(authRoutes, { prefix: '/api/v1/auth' });
    await fastify.register(usersRoutes, { prefix: '/api/v1/users' });
    await fastify.register(subscriptionsRoutes, { prefix: '/api/v1/sub' });
    await fastify.register(statsRoutes, { prefix: '/api/v1/stats' });
    await fastify.register(systemRoutes, { prefix: '/api/v1/system' });

    // Health check endpoint
    fastify.get('/api/v1/health', async () => {
      return { status: 'ok', service: 'Project Amnion Backend', timestamp: new Date().toISOString() };
    });

    // 4. Serve Dashboard Static SPA
    const dashboardDist = path.join(process.cwd(), '../dashboard/dist');
    if (fs.existsSync(dashboardDist)) {
      await fastify.register(fastifyStatic, {
        root: dashboardDist,
        prefix: '/'
      });
      fastify.setNotFoundHandler((request, reply) => {
        if (request.url.startsWith('/api/')) {
          return reply.status(404).send({ error: `API route niet gevonden: ${request.url}` });
        }
        reply.sendFile('index.html');
      });
    }

    // 5. Start Server Listening
    await fastify.listen({ port: CONFIG.PORT, host: CONFIG.HOST });
    console.log(`🚀 Amnion Backend Control Daemon running on http://${CONFIG.HOST}:${CONFIG.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

startServer();
