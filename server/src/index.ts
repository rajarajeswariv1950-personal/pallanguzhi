import http from 'node:http';
import { WebSocketServer } from 'ws';
import { RoomManager } from './rooms';
import { parseClientMessage } from './protocol';

const PORT = Number(process.env.PORT ?? 8080);
const manager = new RoomManager();

const httpServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', rooms: manager.size() }));
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
  console.log(`Pallanguzhi server listening on :${PORT}`);
});
