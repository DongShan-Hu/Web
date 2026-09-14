import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, realpath, stat } from 'node:fs/promises';
import { resolve, relative, sep, extname, isAbsolute } from 'node:path';
import { publicRoot } from './check.mjs';

const port = Number(process.env.PORT || 4173);
const root = await realpath(publicRoot);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4', '.pdf': 'application/pdf', '.ico': 'image/x-icon' };
function within(target) { const rel = relative(root, target); return rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel); }
const server = createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-cache');
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return; }
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    const pathname = decodeURIComponent(url.pathname);
    if (pathname === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); res.end(req.method === 'HEAD' ? undefined : 'ok\n'); return; }
    if (pathname.split('/').some(part => part.startsWith('.')) || pathname.includes('\\')) { res.writeHead(403); res.end(); return; }
    let file = resolve(root, `.${pathname}`);
    if (!within(file)) { res.writeHead(403); res.end(); return; }
    let info = await stat(file);
    if (info.isDirectory()) {
      if (!url.pathname.endsWith('/')) { res.writeHead(301, { Location: `${url.pathname}/${url.search}` }); res.end(); return; }
      file = resolve(file, 'index.html');
      info = await stat(file);
    }
    if (!info.isFile() || !within(await realpath(file))) { res.writeHead(403); res.end(); return; }
    res.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    res.setHeader('Accept-Ranges', 'bytes');
    let start = 0, end = info.size - 1;
    const range = req.headers.range?.match(/^bytes=(\d*)-(\d*)$/);
    if (range && req.method === 'GET') {
      if (!range[1] && !range[2]) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return; }
      if (range[1]) { start = Number(range[1]); end = range[2] ? Math.min(Number(range[2]), end) : end; }
      else { start = Math.max(0, info.size - Number(range[2])); }
      if (start > end || start >= info.size || (!range[1] && Number(range[2]) === 0)) { res.writeHead(416, { 'Content-Range': `bytes */${info.size}` }); res.end(); return; }
      res.statusCode = 206;
      res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
    }
    res.setHeader('Content-Length', Math.max(0, end - start + 1));
    if (req.method === 'HEAD' || info.size === 0) { res.end(); return; }
    const stream = createReadStream(file, { start, end });
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  } catch (error) {
    res.statusCode = error instanceof URIError ? 400 : 404;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(req.method === 'HEAD' ? undefined : await readFile(resolve(root, '404.html')));
  }
});
server.on('error', error => { console.error(`预览启动失败：${error.message}`); process.exit(1); });
server.listen(port, '127.0.0.1', () => console.log(`本地预览：http://127.0.0.1:${port}（仅本机访问）`));
