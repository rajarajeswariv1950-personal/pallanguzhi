// End-to-end self-test for the multiplayer server.
// Start the server first (npm run dev), then: npm run smoke
import { WebSocket } from 'ws';

const URL = process.env.URL || 'ws://localhost:8080';

function client(name) {
  const ws = new WebSocket(URL);
  const queue = [];
  const waiters = [];
  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    const idx = waiters.findIndex((w) => w.pred(msg));
    if (idx >= 0) {
      const w = waiters.splice(idx, 1)[0];
      clearTimeout(w.timer);
      w.resolve(msg);
    } else {
      queue.push(msg);
    }
  });
  return {
    ws,
    open: () =>
      new Promise((resolve, reject) => {
        ws.on('open', resolve);
        ws.on('error', reject);
      }),
    send: (m) => ws.send(JSON.stringify(m)),
    wait: (pred, ms = 3000) =>
      new Promise((resolve, reject) => {
        const idx = queue.findIndex(pred);
        if (idx >= 0) {
          resolve(queue.splice(idx, 1)[0]);
          return;
        }
        const timer = setTimeout(() => reject(new Error(`${name}: timeout`)), ms);
        waiters.push({ pred, resolve, timer });
      }),
    close: () => ws.close(),
  };
}

const is = (type) => (m) => m.type === type;
let failures = 0;
function assert(cond, msg) {
  if (cond) {
    console.log('  \u2713', msg);
  } else {
    failures += 1;
    console.error('  \u2717', msg);
  }
}

async function main() {
  const A = client('A');
  await A.open();
  A.send({ type: 'createRoom' });
  const created = await A.wait(is('roomCreated'));
  assert(!!created.code && created.you === 0, 'A creates room and is host (you=0)');
  const code = created.code;

  const B = client('B');
  await B.open();
  B.send({ type: 'joinRoom', code });
  const joined = await B.wait(is('joinedRoom'));
  assert(joined.you === 1, 'B joins room as guest (you=1)');
  await A.wait((m) => m.type === 'presence' && !!m.presence.guest && m.presence.guest.connected);
  assert(true, 'A sees guest connected via presence');

  A.send({ type: 'ready', ready: true });
  B.send({ type: 'ready', ready: true });
  const started = await A.wait(is('gameStarted'));
  assert(
    !!started.state && started.state.pits.length === 14 && started.state.current === 0,
    'game starts: 14 pits, host (player 0) to move',
  );

  A.send({ type: 'move', pit: 0 });
  const afterMove = await B.wait(is('state'));
  assert(afterMove.state.current === 1, 'legal move applied; turn passes to guest');

  A.send({ type: 'move', pit: 1 });
  const inv1 = await A.wait(is('invalidMove'));
  assert(inv1.reason === 'notYourTurn', 'move out of turn is rejected');

  B.send({ type: 'move', pit: 0 });
  const inv2 = await B.wait(is('invalidMove'));
  assert(!!inv2, "move on opponent's pit is rejected");

  B.close();
  const oppGone = await A.wait(is('opponentDisconnected'), 5000);
  assert(!!oppGone, 'opponent disconnect is reported to the other player');

  A.close();
  console.log(failures === 0 ? '\nSMOKE PASSED' : `\nSMOKE FAILED (${failures} failure(s))`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('SMOKE ERROR', err);
  process.exit(1);
});
