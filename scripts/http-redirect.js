const http = require('http');

const port = 80;
const server = http.createServer((req, res) => {
  const host = req.headers.host ? req.headers.host.split(':')[0] : 'amnion.webredirect.org';
  res.writeHead(302, {
    Location: `https://${host}:3000${req.url}`,
    'Cache-Control': 'no-cache'
  });
  res.end();
});

server.listen(port, '::', () => {
  console.log(`Amnion HTTP Redirector running on port ${port} -> https://:3000`);
});
