/**
 * Server-validated premium access-code redemption — unit tests.
 * The backend is mocked at the fetch layer so every branch of the
 * redeem contract (ok / invalid / used / revoked / network) is covered.
 */
const mockStore = new Map<string, string>();

jest.mock('@/utils/persist', () => ({
  StorageKeys: {
    language: 'pnp.language',
    settings: 'pnp.settings',
    profileName: 'pnp.profile.name',
    entitlement: 'pnp.entitlement',
    deviceId: 'pnp.deviceId',
    musicHintDismissed: 'pnp.musicHintDismissed',
  },
  storage: {
    getString: async (k: string) => mockStore.get(k) ?? null,
    setString: async (k: string, v: string) => void mockStore.set(k, v),
    getJSON: async (k: string) => (mockStore.has(k) ? JSON.parse(mockStore.get(k)!) : null),
    setJSON: async (k: string, v: unknown) => void mockStore.set(k, JSON.stringify(v)),
    remove: async (k: string) => void mockStore.delete(k),
  },
}));

import { normalizeAccessCode, redeemAccessCode } from '@/features/premium/accessCodeApi';
import { useEntitlementStore } from '@/store/entitlementStore';

const fetchMock = jest.fn();

function respondOnce(status: number, body: unknown, nonJson = false) {
  fetchMock.mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: nonJson ? () => Promise.reject(new Error('not json')) : () => Promise.resolve(body),
  });
}

function lastRequestBody(): { code: string; deviceId: string } {
  const [, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return JSON.parse((init as { body: string }).body);
}

beforeEach(() => {
  (globalThis as { fetch: unknown }).fetch = fetchMock;
  fetchMock.mockReset();
  mockStore.clear();
  useEntitlementStore.getState().relock();
});

describe('normalizeAccessCode', () => {
  it('uppercases and strips separators/whitespace', () => {
    expect(normalizeAccessCode(' abcd-efgh 23km ')).toBe('ABCDEFGH23KM');
  });
});

describe('redeemAccessCode / entitlementStore.redeemCode', () => {
  it('accepted code unlocks premium via the server and persists it', async () => {
    respondOnce(200, { ok: true });
    const result = await useEntitlementStore.getState().redeemCode('abcd-efgh-jkmn-pqrs');
    expect(result).toBe('ok');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://pallanguzhi-room-api.onrender.com/premium/redeem');
    expect((init as { method: string }).method).toBe('POST');
    expect(lastRequestBody().code).toBe('ABCDEFGHJKMNPQRS'); // normalized before sending
    const s = useEntitlementStore.getState();
    expect(s.premium).toBe(true);
    expect(s.source).toBe('friendCode');
    expect(JSON.parse(mockStore.get('pnp.entitlement')!)).toEqual({
      premium: true,
      source: 'friendCode',
    });
  });

  it('invalid code is refused and premium stays locked', async () => {
    respondOnce(404, { ok: false, error: 'invalid_code' });
    expect(await useEntitlementStore.getState().redeemCode('WRONG-CODE-0000')).toBe('invalid');
    expect(useEntitlementStore.getState().premium).toBe(false);
    // relock() in beforeEach persists the locked default — it must still be locked.
    expect(JSON.parse(mockStore.get('pnp.entitlement')!)).toEqual({
      premium: false,
      source: 'none',
    });
  });

  it('already-used and revoked codes report their exact state', async () => {
    respondOnce(409, { ok: false, error: 'code_used' });
    expect(await redeemAccessCode('AAAA-BBBB-CCCC-DDDD')).toBe('used');
    respondOnce(410, { ok: false, error: 'code_revoked' });
    expect(await redeemAccessCode('AAAA-BBBB-CCCC-DDDD')).toBe('revoked');
    expect(useEntitlementStore.getState().premium).toBe(false);
  });

  it('an old deploy without the endpoint (plain 404) reads as a network problem', async () => {
    respondOnce(404, null, true);
    expect(await redeemAccessCode('AAAA-BBBB-CCCC-DDDD')).toBe('network');
  });

  it('an unreachable server fails closed as network', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    expect(await redeemAccessCode('AAAA-BBBB-CCCC-DDDD')).toBe('network');
    expect(useEntitlementStore.getState().premium).toBe(false);
  });

  it('empty input never touches the network', async () => {
    expect(await redeemAccessCode('  --  ')).toBe('invalid');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('deviceId is generated once and reused across redemptions', async () => {
    respondOnce(404, { ok: false, error: 'invalid_code' });
    await redeemAccessCode('AAAA-BBBB-CCCC-DDDD');
    const first = lastRequestBody().deviceId;
    respondOnce(404, { ok: false, error: 'invalid_code' });
    await redeemAccessCode('EEEE-FFFF-GGGG-HHHH');
    expect(first).toMatch(/^[0-9a-f]{32}$/);
    expect(lastRequestBody().deviceId).toBe(first);
  });
});
