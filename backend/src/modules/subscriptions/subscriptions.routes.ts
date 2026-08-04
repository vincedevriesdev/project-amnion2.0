import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubscriptionsService } from './subscriptions.service.js';

export async function subscriptionsRoutes(fastify: FastifyInstance) {
  // 1. Static routes FIRST (so /qr/svg is not captured as :token)
  fastify.get('/qr/svg', async (request: FastifyRequest, reply: FastifyReply) => {
    const { text } = request.query as any;
    if (!text) return reply.status(400).send({ error: 'Text parameter is verplicht' });

    try {
      const svg = await SubscriptionsService.generateQrSvg(text);
      reply.header('Content-Type', 'image/svg+xml');
      return reply.send(svg);
    } catch (err: any) {
      return reply.status(500).send({ error: 'QR generatie mislukt' });
    }
  });

  // 2. Wildcard subscription token endpoint SECOND
  fastify.get('/:token', async (request: FastifyRequest, reply: FastifyReply) => {
    const { token } = request.params as any;
    if (!token || token === 'qr') {
      return reply.status(404).send({ error: 'Ongeldige token' });
    }

    try {
      const data = SubscriptionsService.getSubscriptionData(token);

      // Set headers for Hiddify / sing-box client compatibility
      reply.header('Subscription-Userinfo', `upload=0; download=${data.user.usedBytes}; total=${data.user.dataLimitBytes}; expire=${data.user.expireAt ? new Date(data.user.expireAt).getTime() / 1000 : 0}`);
      reply.header('profile-update-interval', '6');
      reply.header('profile-title', `Amnion-${data.user.username}`);
      reply.header('Content-Type', 'text/plain; charset=utf-8');

      // Return base64 encoded URI list (standard Hiddify / V2Ray subscription format)
      return reply.send(data.base64Config);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
