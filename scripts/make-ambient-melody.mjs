/**
 * Generates the app's background music: a warm, lively, premium loop suited to a
 * traditional Tamil board game — energetic and charming without being busy.
 *
 * Musical design:
 *  - Raga Mohanam (Carnatic major pentatonic: Sa Ri2 Ga3 Pa Da2 = C D E G A) so
 *    every note is consonant and pleasant.
 *  - A gentle rhythmic PULSE: a soft plucked bass on the beat + an eighth-note
 *    pentatonic arpeggio ostinato, giving lift and momentum.
 *  - A singable melody line floating on top (bell/pluck tone).
 *  - A soft tanpura-like drone (Sa + Pa) underneath for warmth.
 *  - A light hand-percussion tick on off-beats for a traditional, living feel.
 *  - SEAMLESS LOOP via an equal-power crossfade of the tail into the head — no
 *    volume dip at the loop point (unlike a fade-to-silence), so it stays lively.
 *
 * Fully deterministic (no RNG): percussion uses a fixed hash-noise so re-running
 * always produces the identical file.
 *
 * Output: assets/audio/ambient-melody.wav (mono, 22.05 kHz, 16-bit PCM).
 * Run with: node scripts/make-ambient-melody.mjs
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SR = 22050;
const BPM = 116; // lively but relaxed
const BEAT = 60 / BPM; // seconds per beat
const BAR = BEAT * 4;
const BARS = 16;
const DUR = BAR * BARS; // exact whole number of bars
const CF = Math.floor(0.35 * SR); // crossfade length for the seamless loop
const N = Math.floor(SR * DUR);
const R = new Float64Array(N + CF); // render a little extra for the crossfade tail

// ── Deterministic hash noise in [-1, 1] (for soft percussion) ──────────────
function noise(i) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return 2 * (x - Math.floor(x)) - 1;
}

// ── Note frequencies (Mohanam / C major pentatonic) ────────────────────────
const C2 = 65.41, G2 = 98.0, A2 = 110.0;
const C3 = 130.81, E3 = 164.81, G3 = 196.0, A3 = 220.0;
const C4 = 261.63, D4 = 293.66, E4 = 329.63, G4 = 392.0, A4 = 440.0;
const C5 = 523.25, D5 = 587.33, E5 = 659.25;

// ── Voice: a plucked/struck tone with soft attack + exponential decay ───────
function pluck(startT, freq, gain, dur, { bright = 0.35, vib = 0 } = {}) {
  const start = Math.floor(startT * SR);
  const len = Math.floor(dur * SR);
  const attack = Math.max(4, Math.floor(0.006 * SR));
  for (let k = 0; k < len; k += 1) {
    const idx = start + k;
    if (idx < 0 || idx >= R.length) continue;
    const t = k / SR;
    let env;
    if (k < attack) env = k / attack;
    else env = Math.pow(1 - (k - attack) / (len - attack), 2.0); // smooth decay
    const f = vib ? freq * (1 + vib * Math.sin(2 * Math.PI * 5.5 * t)) : freq;
    const w =
      Math.sin(2 * Math.PI * f * t) +
      bright * Math.sin(2 * Math.PI * f * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * f * 3 * t);
    R[idx] += w * env * gain;
  }
}

// ── Layer 1: tanpura-like drone (Sa + Pa), slow tremolo, low level ─────────
for (let i = 0; i < R.length; i += 1) {
  const t = i / SR;
  const trem = 0.86 + 0.14 * Math.sin(2 * Math.PI * 0.08 * t);
  let s = 0;
  for (const f of [C3, G3]) {
    s += Math.sin(2 * Math.PI * f * t);
    s += 0.22 * Math.sin(2 * Math.PI * f * 2 * t);
  }
  R[i] += s * 0.03 * trem;
}

// ── Layer 2: bass pulse on every beat (root per bar) ───────────────────────
const barRoots = [C2, G2, A2, G2]; // gentle I–V–vi–V pentatonic motion
const totalBeats = Math.ceil((DUR + CF / SR) / BEAT);
for (let b = 0; b < totalBeats; b += 1) {
  const tB = b * BEAT;
  const root = barRoots[Math.floor(b / 4) % barRoots.length];
  // Slightly stronger on the downbeat for groove.
  const onDown = b % 4 === 0;
  pluck(tB, root, onDown ? 0.34 : 0.24, BEAT * 0.95, { bright: 0.18 });
}

// ── Layer 3: eighth-note pentatonic arpeggio ostinato (movement/charm) ─────
const arp = [C4, E4, G4, A4, G4, E4, D4, E4];
const eighth = BEAT / 2;
const totalEighths = Math.ceil((DUR + CF / SR) / eighth);
for (let e = 0; e < totalEighths; e += 1) {
  const tE = e * eighth;
  const note = arp[e % arp.length];
  // Accent every other eighth a touch to imply a lilt.
  const g = e % 2 === 0 ? 0.11 : 0.08;
  pluck(tE, note, g, eighth * 1.6, { bright: 0.45 });
}

// ── Layer 4: melody — a warm, singable phrase (repeats over the loop) ───────
// [note, beats] pairs. Total beats per statement = 16 (4 bars); repeats x4 = 16 bars.
const phrase = [
  [G4, 1], [A4, 1], [C5, 2],
  [A4, 1], [G4, 1], [E4, 2],
  [D4, 1], [E4, 1], [G4, 1], [A4, 1],
  [G4, 2], [E4, 2],
];
let mt = 0;
while (mt < DUR + CF / SR) {
  for (const [note, beats] of phrase) {
    if (mt >= DUR + CF / SR) break;
    pluck(mt, note, 0.16, beats * BEAT * 0.98, { bright: 0.5, vib: 0.004 });
    // soft octave shimmer an octave up, very quiet
    pluck(mt, note * 2, 0.04, beats * BEAT * 0.7, { bright: 0.2 });
    mt += beats * BEAT;
  }
}

// ── Layer 5: soft hand-percussion tick on the off-beats (subtle life) ──────
for (let b = 0; b < totalBeats; b += 1) {
  const tTick = (b + 0.5) * BEAT; // the "and" of each beat
  const start = Math.floor(tTick * SR);
  const len = Math.floor(0.05 * SR);
  for (let k = 0; k < len; k += 1) {
    const idx = start + k;
    if (idx < 0 || idx >= R.length) continue;
    const env = Math.pow(1 - k / len, 3.0);
    // band-ish tick: noise shaped by a mid sine, kept quiet
    R[idx] += (0.5 * noise(idx) + 0.5 * Math.sin(2 * Math.PI * 2200 * (k / SR))) * env * 0.035;
  }
}

// ── Normalize with headroom + warm soft-clip ───────────────────────────────
let peak = 0;
for (let i = 0; i < R.length; i += 1) peak = Math.max(peak, Math.abs(R[i]));
const norm = peak > 0 ? 0.7 / peak : 1;
for (let i = 0; i < R.length; i += 1) R[i] = Math.tanh(R[i] * norm * 1.15) * 0.9;

// ── Seamless loop: equal-power crossfade the tail (R[N..N+CF]) into the head ─
const out = new Float64Array(N);
for (let i = 0; i < N; i += 1) out[i] = R[i];
for (let k = 0; k < CF; k += 1) {
  const a = k / CF; // 0→1 across the head
  const fadeIn = Math.sin((a * Math.PI) / 2); // equal-power
  const fadeOut = Math.cos((a * Math.PI) / 2);
  out[k] = R[k] * fadeIn + R[N + k] * fadeOut;
}

// ── Encode 16-bit PCM WAV ──────────────────────────────────────────────────
const bytesPerSample = 2;
const dataSize = N * bytesPerSample;
const buf = Buffer.alloc(44 + dataSize);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write('WAVE', 8);
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20); // PCM
buf.writeUInt16LE(1, 22); // mono
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * bytesPerSample, 28);
buf.writeUInt16LE(bytesPerSample, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(dataSize, 40);
for (let i = 0; i < N; i += 1) {
  const v = Math.max(-1, Math.min(1, out[i]));
  buf.writeInt16LE(Math.round(v * 32767), 44 + i * bytesPerSample);
}

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, '..', 'assets', 'audio', 'ambient-melody.wav');
writeFileSync(outPath, buf);
console.log(
  `Wrote ${outPath} (${(dataSize / 1024 / 1024).toFixed(2)} MB, ${DUR.toFixed(2)}s, ${BPM} BPM, seamless loop)`,
);
