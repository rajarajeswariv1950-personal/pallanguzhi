/**
 * End-to-end proof that the OWNER'S REAL CODES unlock premium even when the
 * deployed server is stale or unreachable — this is exactly the failure that
 * happened in production (the Render deploy predated the current code batch
 * and answered 'invalid' for every issued code).
 *
 * The real codes are read from server/data/premium-codes.json AT TEST TIME
 * (single source of truth); no plaintext code is embedded in this file.
 */
import { readFileSync } from 'fs';
import { join } from 'path';

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

import { redeemAccessCode, matchesBundledCode, normalizeAccessCode } from '@/features/premium/accessCodeApi';
import { useEntitlementStore } from '@/store/entitlementStore';

const codesDoc = JSON.parse(
  readFileSync(join(__dirname, '..', '..', '..', '..', 'server', 'data', 'premium-codes.json'), 'utf8'),
) as { ownerCode: string; friendCodes: Record<string, string> };

const fetchMock = jest.fn();

beforeEach(() => {
  (globalThis as { fetch: unknown }).fetch = fetchMock;
  fetchMock.mockReset();
  mockStore.clear();
  useEntitlementStore.getState().relock();
});

const staleDeploySaysInvalid = () =>
  fetchMock.mockResolvedValue({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ ok: false, error: 'invalid_code' }),
  });

describe('bundled hash manifest covers the real issued codes', () => {
  it('owner code and every friend code hash into the manifest', () => {
    expect(matchesBundledCode(normalizeAccessCode(codesDoc.ownerCode))).toBe(true);
    for (const code of Object.keys(codesDoc.friendCodes)) {
      expect(matchesBundledCode(normalizeAccessCode(code))).toBe(true);
    }
  });

  it('rejects codes that were never issued', () => {
    expect(matchesBundledCode('PNP0000XXXX')).toBe(false);
    expect(matchesBundledCode('')).toBe(false);
  });
});

describe('redemption survives a stale/unreachable server (the production bug)', () => {
  it("owner code unlocks even when a STALE deploy answers 'invalid'", async () => {
    staleDeploySaysInvalid();
    const result = await useEntitlementStore.getState().redeemCode(codesDoc.ownerCode);
    expect(result).toBe('ok');
    expect(useEntitlementStore.getState().premium).toBe(true);
  });

  it("a friend code (typed lowercase, with dashes) unlocks against a stale deploy", async () => {
    staleDeploySaysInvalid();
    const friend = Object.keys(codesDoc.friendCodes)[0].toLowerCase();
    expect(await redeemAccessCode(friend)).toBe('ok');
  });

  it('owner code unlocks fully OFFLINE (server unreachable)', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    expect(await redeemAccessCode(codesDoc.ownerCode)).toBe('ok');
  });

  it("never-issued codes still fail: server 'invalid' stays invalid, offline stays network", async () => {
    staleDeploySaysInvalid();
    expect(await redeemAccessCode('PNP-0000-XXXX')).toBe('invalid');
    fetchMock.mockRejectedValue(new Error('offline'));
    expect(await redeemAccessCode('PNP-0000-XXXX')).toBe('network');
    expect(useEntitlementStore.getState().premium).toBe(false);
  });

  it("a server-confirmed 'used' / 'revoked' status is FINAL — the fallback never overrides it", async () => {
    const friend = Object.keys(codesDoc.friendCodes)[1];
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ ok: false, error: 'code_used' }),
    });
    expect(await redeemAccessCode(friend)).toBe('used');
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 410,
      json: () => Promise.resolve({ ok: false, error: 'code_revoked' }),
    });
    expect(await redeemAccessCode(friend)).toBe('revoked');
    expect(useEntitlementStore.getState().premium).toBe(false);
  });
});
