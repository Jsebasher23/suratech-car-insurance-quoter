// Serves the PRODUCTION build with the SAME security headers as nginx.conf and proxies /api
// (GET/HEAD only) to Strapi. Lets e2e verify the real bundle under the real CSP without Docker
// (added after review finding RV-01, which `ng serve` could never have caught).
// Usage: npx ng build && node scripts/preview-prod.mjs   →  http://localhost:8081
import { createServer, request } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const ROOT = new URL('../dist/frontend/browser/', import.meta.url).pathname;
const PORT = Number(process.env.PORT ?? 8081);
const STRAPI = new URL(process.env.STRAPI_URL ?? 'http://localhost:1337');
const HEADERS = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
};
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.svg': 'image/svg+xml' };

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname.startsWith('/api/')) {
    if (!['GET', 'HEAD'].includes(req.method ?? '')) return res.writeHead(403, HEADERS).end();
    const up = request({ hostname: STRAPI.hostname, port: STRAPI.port, path: url.pathname + url.search, method: req.method }, (r) => {
      res.writeHead(r.statusCode ?? 502, { ...r.headers, ...HEADERS });
      r.pipe(res);
    });
    up.on('error', () => res.writeHead(502, HEADERS).end());
    return up.end();
  }
  let file = normalize(join(ROOT, decodeURIComponent(url.pathname)));
  if (!file.startsWith(ROOT)) return res.writeHead(400, HEADERS).end();
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(ROOT, 'index.html'); // SPA fallback
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { ...HEADERS, 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404, HEADERS).end();
  }
}).listen(PORT, () => console.log(`preview (prod build + CSP) on http://localhost:${PORT}`));
