#!/usr/bin/env node
'use strict';
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.woff':'font/woff','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8'};

function createPreviewServer(directory) {
  const root = fs.realpathSync(directory);
  return http.createServer(async (request, response) => {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const fail = (status, message) => { response.writeHead(status, {'Content-Type':'text/plain; charset=utf-8'}); response.end(message); };
    if (!['GET','HEAD'].includes(request.method)) return fail(405,'Method not allowed');
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url,'http://localhost').pathname); }
    catch (_) { return fail(400,'Invalid path'); }
    if (pathname.includes('\0')) return fail(400,'Invalid path');
    const target = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
    if (!target.startsWith(root + path.sep)) return fail(403,'Outside preview root');
    try {
      const real = await fs.promises.realpath(target);
      if (!real.startsWith(root + path.sep)) return fail(403,'Outside preview root');
      const stat = await fs.promises.stat(real);
      if (!stat.isFile()) return fail(404,'Not found');
      const content = await fs.promises.readFile(real);
      response.writeHead(200, {'Content-Type':types[path.extname(real)] || 'application/octet-stream'});
      response.end(request.method === 'HEAD' ? undefined : content);
    } catch (error) {
      fail(error.code === 'ENOENT' || error.code === 'ENOTDIR' ? 404 : 500, 'Preview asset unavailable');
    }
  });
}

if (require.main === module) {
  const port = Number(process.argv[2] || 4173);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Use a port from 1 to 65535.');
  const server = createPreviewServer(path.join(__dirname,'..','tizen'));
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port,'127.0.0.1',() => console.log('Vibe TV local preview: http://127.0.0.1:' + port + ' (no TV connection)'));
}
module.exports = { createPreviewServer };
