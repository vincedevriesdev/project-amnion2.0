import fs from 'fs';
import http from 'http';
import https from 'https';
import { CONFIG } from './core/config/env.js';

const port = Number.parseInt(process.env.CONTROL_PLANE_HTTPS_PORT || '9443', 10);
const targetPort = CONFIG.PORT;
const certPath = process.env.CONTROL_PLANE_TLS_CERT
  || `/etc/letsencrypt/live/${CONFIG.SERVER_DOMAIN}/fullchain.pem`;
const keyPath = process.env.CONTROL_PLANE_TLS_KEY
  || `/etc/letsencrypt/live/${CONFIG.SERVER_DOMAIN}/privkey.pem`;

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
  throw new Error(`TLS-certificaat ontbreekt voor control-plane: ${certPath}`);
}

const server = https.createServer({
  cert: fs.readFileSync(certPath),
  key: fs.readFileSync(keyPath),
  minVersion: 'TLSv1.2'
}, (request, response) => {
  const requestPath = request.url || '/';
  if (!requestPath.startsWith('/api/v1/mobile/') && requestPath !== '/api/v1/mobile') {
    response.writeHead(404, {
      'content-type': 'application/json',
      'cache-control': 'no-store',
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff'
    });
    response.end(JSON.stringify({ error: 'Niet gevonden' }));
    return;
  }

  const remoteAddress = request.socket.remoteAddress || '';
  const headers: Record<string, string | string[] | undefined> = {
    ...request.headers,
    host: request.headers.host || CONFIG.SERVER_DOMAIN,
    'x-forwarded-for': remoteAddress,
    'x-forwarded-host': request.headers.host || CONFIG.SERVER_DOMAIN,
    'x-forwarded-proto': 'https'
  };

  delete headers.connection;
  delete headers['proxy-connection'];

  const upstream = http.request({
    hostname: '127.0.0.1',
    port: targetPort,
    method: request.method,
    path: requestPath,
    headers
  }, upstreamResponse => {
    response.writeHead(upstreamResponse.statusCode || 502, {
      ...upstreamResponse.headers,
      'strict-transport-security': 'max-age=31536000; includeSubDomains',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'same-origin'
    });
    upstreamResponse.pipe(response);
  });

  upstream.on('error', error => {
    console.error('Control-plane upstream error:', error.message);
    if (!response.headersSent) response.writeHead(502, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ error: 'Control-plane backend niet bereikbaar' }));
  });

  request.pipe(upstream);
});

server.requestTimeout = 30_000;
server.headersTimeout = 35_000;
server.keepAliveTimeout = 5_000;
server.listen(port, '::', () => {
  console.log(`Amnion HTTPS control-plane luistert op poort ${port}`);
});
