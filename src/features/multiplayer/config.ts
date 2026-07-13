import { Platform } from 'react-native';

const DEV_URL = 'ws://localhost:8080';
/**
 * The deployed Render service (serves the exported web app AND the
 * multiplayer WebSocket endpoint on the same origin).
 */
const PROD_URL = 'wss://pallanguzhi-zyt6.onrender.com';

/**
 * Resolves the multiplayer server URL, in priority order:
 *  1. `EXPO_PUBLIC_SERVER_URL` env override (http(s) normalized to ws(s)).
 *  2. Web builds: the page's own origin — the deployed service hosts the
 *     web app and the WebSocket server together, so same-origin always works
 *     (localhost web dev falls through to the dev URL).
 *  3. Native: localhost in development, the deployed Render URL in production.
 */
export function serverUrl(): string {
  const env = process.env.EXPO_PUBLIC_SERVER_URL;
  if (env && env.length > 0) {
    if (env.startsWith('http://')) return `ws://${env.slice('http://'.length)}`;
    if (env.startsWith('https://')) return `wss://${env.slice('https://'.length)}`;
    return env;
  }
  if (Platform.OS === 'web') {
    const loc = (globalThis as { location?: { protocol?: string; host?: string; hostname?: string } })
      .location;
    const host = loc?.host;
    const hostname = loc?.hostname ?? '';
    const isLocal = hostname === 'localhost' || hostname.startsWith('127.') || hostname === '';
    if (host && !isLocal) {
      return `${loc?.protocol === 'https:' ? 'wss' : 'ws'}://${host}`;
    }
  }
  return __DEV__ ? DEV_URL : PROD_URL;
}
