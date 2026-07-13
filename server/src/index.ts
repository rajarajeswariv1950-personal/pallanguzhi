import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { WebSocketServer } from 'ws';
import { RoomManager } from './rooms';
import { parseClientMessage } from './protocol';

const PORT = Number(process.env.PORT ?? 8080);
const manager = new RoomManager();

/**
 * Optional static hosting of the exported Expo web app, so ONE Render service
 * serves both the frontend and the multiplayer WebSocket endpoint on the same
 * origin. Defaults to the repo-root `dist/` produced by `npx expo export
 * --platform web`; override with STATIC_DIR. When the directory is absent the
 * server still runs (WebSocket + /health only), exactly as before.
 */
const STATIC_DIR = path.resolve(process.env.STATIC_DIR ?? path.join(__dirname, '..', '..', 'dist'));
const hasStatic = fs.existsSync(path.join(STATIC_DIR, 'index.html'));

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
};

function serveStatic(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = (req.url ?? '/').split('?')[0];
  // Resolve inside STATIC_DIR only — reject any path-traversal attempt.
  const requested = path.normalize(path.join(STATIC_DIR, decodeURIComponent(url)));
  if (!requested.startsWith(STATIC_DIR)) {
    res.writeHead(403).end();
    return;
  }
  let file = requested;
  if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    // SPA fallback: unknown routes load the app shell.
    file = path.join(STATIC_DIR, 'index.html');
  }
  const type = MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type });
  fs.createReadStream(file).pipe(res);
}

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: manager.size() }));
    return;
  }
  if (hasStatic) {
    serveStatic(req, res);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/plain' });
  res.end("Phoenix Neumed's Pallanguzhi server");
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (socket) => {
  socket.on('message', (data) => {
    const parsed = parseClientMessage(data.toString());
    if (!parsed.ok) {
      socket.send(JSON.stringify({ type: 'error', message: 'badMessage' }));
      return;
    }
    manager.handle(socket, parsed.message);
  });
  socket.on('close', () => manager.handleSocketClose(socket));
  socket.on('error', () => {
    /* a 'close' event follows; cleanup happens there */
  });
});

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Pallanguzhi server listening on :${PORT}${hasStatic ? ` (static: ${STATIC_DIR})` : ''}`);
});
