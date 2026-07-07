// Copies the app's deterministic engine into the server so online move
// validation uses the EXACT same rules (single source of truth). The app
// engine is the canonical source; re-run this whenever it changes:
//   npm run sync   (also runs automatically before `dev` and `build`)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.resolve(here, '..', '..', 'src', 'features', 'game', 'engine.ts');
const DEST = path.resolve(here, '..', 'src', 'engine.ts');

const header = `/**
 * GENERATED FILE — DO NOT EDIT BY HAND.
 * Mirror of the app's deterministic rules engine
 * (src/features/game/engine.ts), copied by scripts/sync-engine.mjs so the
 * server validates moves with the identical ruleset. Edit the source engine,
 * then run \`npm run sync\`.
 */

`;

const source = fs.readFileSync(SOURCE, 'utf8');
fs.mkdirSync(path.dirname(DEST), { recursive: true });
fs.writeFileSync(DEST, header + source);
console.log('Synced engine ->', path.relative(process.cwd(), DEST));
