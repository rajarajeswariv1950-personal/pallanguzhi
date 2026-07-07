// Generates premium, tasteful game SFX + a seamless ambient loop as 16-bit PCM
// WAV files. Pure Node, no dependencies. Re-run with: node scripts/generate-audio.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', 'assets', 'audio');
fs.mkdirSync(OUT, { recursive: true });

const SR = 44100;
const TAU = Math.PI * 2;

function writeWav(name, samples, sampleRate = SR) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE((s * 32767) | 0, 44 + i * 2);
  }
  fs.writeFileSync(path.join(OUT, name), buf);
  return n / sampleRate;
}

const env = (t, dur, attack = 0.005, release = 0.08) => {
  if (t < attack) return t / attack;
  const relStart = dur - release;
  if (t > relStart) return Math.max(0, (dur - t) / release);
  return 1;
};
// soft sine with a touch of 2nd harmonic for warmth
const voice = (ph) => Math.sin(ph) + 0.18 * Math.sin(2 * ph);

// A single decaying note buffer
function note(freq, dur, { gain = 0.5, attack = 0.006, decay = 0.5, harmonic = 0.18 } = {}) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const ph = TAU * freq * t;
    const a = t < attack ? t / attack : Math.exp(-(t - attack) / decay);
    out[i] = gain * a * (Math.sin(ph) + harmonic * Math.sin(2 * ph));
  }
  return out;
}

function mixSequence(notes) {
  // notes: [{freq,dur,startsAt,opts}]
  const end = Math.max(...notes.map((x) => x.startsAt + x.dur));
  const total = Math.floor((end + 0.05) * SR);
  const out = new Float32Array(total);
  for (const nt of notes) {
    const buf = note(nt.freq, nt.dur, nt.opts);
    const off = Math.floor(nt.startsAt * SR);
    for (let i = 0; i < buf.length; i++) out[off + i] += buf[i];
  }
  // soft-limit
  for (let i = 0; i < out.length; i++) out[i] = Math.tanh(out[i] * 1.1);
  return out;
}

// 1) tap — soft short click
writeWav('tap.wav', note(880, 0.06, { gain: 0.35, decay: 0.04, harmonic: 0.4 }));

// 2) seed drop — woody low tok
(() => {
  const dur = 0.13;
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const a = Math.exp(-t / 0.035);
    // low body + tiny noise transient for "wood"
    const body = Math.sin(TAU * 196 * t) + 0.5 * Math.sin(TAU * 392 * t);
    const noise = t < 0.006 ? (Math.random() * 2 - 1) * 0.4 : 0;
    out[i] = 0.5 * a * (body * 0.6 + noise);
  }
  writeWav('seed.wav', out);
})();

// 3) capture — bright rewarding two-note chime
writeWav(
  'capture.wav',
  mixSequence([
    { freq: 659.25, dur: 0.18, startsAt: 0.0, opts: { gain: 0.4, decay: 0.18 } },
    { freq: 987.77, dur: 0.28, startsAt: 0.08, opts: { gain: 0.4, decay: 0.25 } },
  ]),
);

// 4) turn change — gentle two-tone
writeWav(
  'turn.wav',
  mixSequence([
    { freq: 523.25, dur: 0.12, startsAt: 0.0, opts: { gain: 0.32, decay: 0.12 } },
    { freq: 783.99, dur: 0.16, startsAt: 0.07, opts: { gain: 0.32, decay: 0.16 } },
  ]),
);

// 5) win — ascending celebratory arpeggio
writeWav(
  'win.wav',
  mixSequence([
    { freq: 523.25, dur: 0.22, startsAt: 0.0, opts: { gain: 0.36, decay: 0.3 } },
    { freq: 659.25, dur: 0.22, startsAt: 0.12, opts: { gain: 0.36, decay: 0.3 } },
    { freq: 783.99, dur: 0.24, startsAt: 0.24, opts: { gain: 0.36, decay: 0.34 } },
    { freq: 1046.5, dur: 0.5, startsAt: 0.36, opts: { gain: 0.4, decay: 0.5 } },
  ]),
);

// 6) ambient — seamless soft pad loop (6s @ 22050). Integer cycles => seamless.
(() => {
  const sr = 22050;
  const dur = 6;
  const n = Math.floor(dur * sr);
  const out = new Float32Array(n);
  const chord = [110, 164.81, 220, 329.63]; // A2 E3 A3 E4
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const lfo = 0.5 + 0.5 * Math.sin(TAU * (1 / dur) * t); // 1 cycle per loop -> seamless
    let s = 0;
    for (const f of chord) s += Math.sin(TAU * f * t);
    out[i] = 0.16 * (s / chord.length) * (0.6 + 0.4 * lfo);
  }
  writeWav('ambient.wav', out, sr);
})();

console.log('Audio assets written to', OUT);
for (const f of fs.readdirSync(OUT)) {
  const st = fs.statSync(path.join(OUT, f));
  console.log(' -', f, (st.size / 1024).toFixed(1) + ' KB');
}
