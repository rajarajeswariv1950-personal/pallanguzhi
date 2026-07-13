/**
 * The pure-JS SHA-256 must agree with Node's native implementation — it is
 * the foundation of the offline code-unlock fallback.
 */
import { createHash } from 'crypto';
import { sha256Hex } from '@/features/premium/sha256';

const native = (s: string) => createHash('sha256').update(s, 'utf8').digest('hex');

describe('sha256Hex', () => {
  it('matches the official FIPS 180-4 test vectors', () => {
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')).toBe(
      '248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1',
    );
  });

  it('matches Node crypto for code-shaped and arbitrary inputs', () => {
    const samples = [
      'PNP2BKPCA4PRQR9',
      'PNPGJWVP9AJ',
      'PNP-ABCD-EFGH',
      'a'.repeat(55), // padding boundary
      'a'.repeat(56),
      'a'.repeat(64),
      'a'.repeat(119),
      'unicode ✓ தமிழ் 🎲',
    ];
    for (const s of samples) expect(sha256Hex(s)).toBe(native(s));
  });
});
