const DEFAULT_URL = 'ws://localhost:8080';

/**
 * Resolves the multiplayer server URL. Set `EXPO_PUBLIC_SERVER_URL` (e.g.
 * `wss://your-service.onrender.com`) for devices/production. http(s) values are
 * normalized to ws(s). Defaults to localhost for development.
 */
export function serverUrl(): string {
  const env = process.env.EXPO_PUBLIC_SERVER_URL;
  if (env && env.length > 0) {
    if (env.startsWith('http://')) return `ws://${env.slice('http://'.length)}`;
    if (env.startsWith('https://')) return `wss://${env.slice('https://'.length)}`;
    return env;
  }
  return DEFAULT_URL;
}
