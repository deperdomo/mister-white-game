// Banda sonora del tutorial: música + efectos sintetizados, sin dependencias ni samples.
// Uso: node make-audio.mjs  →  assets/soundtrack.wav
// ponytail: los tiempos de los efectos están duplicados a mano con index.html
// (misma rejilla: 120 BPM, compás = 2 s). Si mueves una escena, mueve su cue aquí.
import { writeFileSync } from "node:fs";

const SR = 44100, DUR = 42, N = SR * DUR;
const L = new Float32Array(N), R = new Float32Array(N);
const BEAT = 0.5, BAR = 2;

let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1; // ruido determinista
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Escribe `dur` segundos de fn(dt) en t, con ganancia y paneo (-1..1).
function add(t, dur, gain, pan, fn) {
  const i0 = Math.round(t * SR), n = Math.round(dur * SR);
  const gl = gain * Math.cos(((pan + 1) * Math.PI) / 4), gr = gain * Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && i0 + i < N; i++) {
    if (i0 + i < 0) continue;
    const s = fn(i / SR, i);
    L[i0 + i] += s * gl;
    R[i0 + i] += s * gr;
  }
}

// Ruido pasado por un filtro de estado variable con frecuencia f(dt); mode: "bp" | "hp" | "lp".
function noise(f, q, mode = "bp") {
  let lo = 0, bp = 0;
  return (dt) => {
    const c = 2 * Math.sin((Math.PI * Math.min(f(dt), SR / 6)) / SR);
    const x = rnd();
    lo += c * bp;
    const hp = x - lo - q * bp;
    bp += c * hp;
    return mode === "bp" ? bp : mode === "hp" ? hp : lo;
  };
}

// ── Instrumentos ──────────────────────────────────────────────
const kick = (t, g = 0.9) => {
  let ph = 0;
  add(t, 0.35, g, 0, (dt) => {
    ph += (2 * Math.PI * (45 + 90 * Math.exp(-dt * 28))) / SR;
    return Math.sin(ph) * Math.exp(-dt * 9);
  });
};
const snap = (t, g = 0.5) => {
  const nz = noise(() => 2100, 0.35);
  add(t, 0.18, g, 0.15, (dt) => nz(dt) * (Math.exp(-dt * 45) + 0.6 * Math.exp(-Math.abs(dt - 0.012) * 400)));
};
const hat = (t, g = 0.12) => {
  const nz = noise(() => 8000, 0.8, "hp");
  add(t, 0.06, g, -0.3, (dt) => nz(dt) * Math.exp(-dt * 90));
};
const bass = (t, midi, dur = 0.45, g = 0.55) => {
  const f = hz(midi);
  add(t, dur, g, 0, (dt) => {
    const env = Math.min(1, dt * 300) * Math.exp(-dt * 4.5) * Math.min(1, (dur - dt) * 80);
    return Math.tanh(1.6 * (Math.sin(2 * Math.PI * f * dt) + 0.35 * Math.sin(4 * Math.PI * f * dt))) * env;
  });
};
// Piano eléctrico: FM con índice que decae.
const keys = (t, midis, dur = 0.5, g = 0.13) => {
  midis.forEach((m, k) => {
    const f = hz(m);
    add(t + k * 0.008, dur, g, (k - 1) * 0.35, (dt) => {
      const env = Math.min(1, dt * 400) * Math.exp(-dt * 5) * Math.min(1, (dur - dt) * 60);
      return Math.sin(2 * Math.PI * f * dt + 1.8 * Math.exp(-dt * 9) * Math.sin(2 * Math.PI * f * dt)) * env;
    });
  });
};
// Vibráfono para la melodía.
const vibes = (t, midi, dur = 0.6, g = 0.2) => {
  const f = hz(midi);
  add(t, dur, g, 0.25, (dt) => {
    const env = Math.min(1, dt * 500) * Math.exp(-dt * 4) * Math.min(1, (dur - dt) * 40);
    return (Math.sin(2 * Math.PI * f * dt) + 0.25 * Math.exp(-dt * 14) * Math.sin(8 * Math.PI * f * dt)) * env * (1 + 0.15 * Math.sin(2 * Math.PI * 5.5 * dt));
  });
};
const pad = (t, midis, dur, g = 0.05) => {
  midis.forEach((m, k) => {
    for (const det of [-0.07, 0.07]) {
      const f = hz(m + det);
      add(t, dur, g, det * 10, (dt) => Math.sin(2 * Math.PI * f * dt + k) * Math.min(1, dt / 0.8) * Math.min(1, (dur - dt) / 0.6) * (1 + 0.3 * Math.sin(2 * Math.PI * 6 * dt)));
    }
  });
};

// ── Efectos ───────────────────────────────────────────────────
const whoosh = (t, dur = 0.5, g = 0.35, up = true) => {
  const nz = noise((dt) => (up ? 300 + 4200 * (dt / dur) ** 2 : 4500 - 4000 * (dt / dur)), 0.5);
  add(t, dur, g, 0, (dt) => nz(dt) * Math.sin((Math.PI * dt) / dur) ** 2);
};
const thud = (t, g = 0.9) => {
  kick(t, g);
  const nz = noise(() => 900, 0.9, "lp");
  add(t, 0.12, g * 0.5, 0, (dt) => nz(dt) * Math.exp(-dt * 40));
};
const flip = (t, pan = 0) => {
  const nz = noise((dt) => 1500 + 9000 * dt, 0.6);
  add(t, 0.22, 0.4, pan, (dt) => nz(dt) * Math.sin((Math.PI * dt) / 0.22) ** 2);
  add(t + 0.2, 0.05, 0.3, pan, (dt) => Math.sin(2 * Math.PI * 1700 * dt) * Math.exp(-dt * 120));
};
const pop = (t, pitch = 1, pan = 0, g = 0.4) => {
  let ph = 0;
  add(t, 0.09, g, pan, (dt) => {
    ph += (2 * Math.PI * pitch * (380 + 700 * (dt / 0.09))) / SR;
    return Math.sin(ph) * Math.sin((Math.PI * dt) / 0.09);
  });
};
// "Wah-wah" cómico descendente para la pista torpe de Mr. White.
const wobble = (t, g = 0.3) => {
  [[58, 0], [57, 0.28], [56, 0.56]].forEach(([m, off], k) => {
    let ph = 0;
    const dur = k === 2 ? 0.7 : 0.26;
    add(t + off, dur, g, 0.4, (dt) => {
      ph += (2 * Math.PI * hz(m - (k === 2 ? dt * 1.5 : 0)) * (1 + 0.012 * Math.sin(2 * Math.PI * 6 * dt))) / SR;
      const saw = Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.33 * Math.sin(3 * ph);
      return saw * Math.min(1, dt * 60) * Math.min(1, (dur - dt) * 12) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 7 * dt));
    });
  });
};
const tick = (t, pan = 0) => add(t, 0.08, 0.45, pan, (dt) => Math.sin(2 * Math.PI * 1150 * dt) * Math.exp(-dt * 70));
const ding = (t, midi = 88, g = 0.25, pan = 0) => {
  const f = hz(midi);
  add(t, 1.2, g, pan, (dt) => (Math.sin(2 * Math.PI * f * dt) + 0.5 * Math.sin(2 * Math.PI * f * 2.76 * dt) * Math.exp(-dt * 6)) * Math.exp(-dt * 4.5));
};
const riser = (t, dur) => {
  const nz = noise((dt) => 400 + 7000 * (dt / dur) ** 2, 0.4);
  let ph = 0;
  add(t, dur, 0.3, 0, (dt) => {
    ph += (2 * Math.PI * (110 * 2 ** ((2 * dt) / dur))) / SR;
    return (nz(dt) * 0.8 + Math.sin(ph) * 0.4) * (dt / dur) ** 2;
  });
};

// ── Música: swing noir en Re menor ────────────────────────────
const CH = {
  Dm: { walk: [[38, 41, 45, 48], [50, 48, 45, 41]], stab: [53, 57, 60, 64] },
  Gm: { walk: [[43, 46, 50, 53]], stab: [53, 58, 62, 65] },
  A7: { walk: [[45, 49, 52, 55]], stab: [55, 61, 65, 67] },
};
//            0     1     2     3     4     5     6     7     8     9     10    11    12    13    14    15    16    17    18    19    20
const bars = ["Dm", "Dm", "Dm", "Gm", "A7", "Dm", "Dm", "Gm", "A7", "Dm", "Dm", "Gm", "A7", "Dm", "Dm", "Gm", "A7", "Dm", "Gm", "A7", "Dm"];
const SW = BEAT * 0.66; // corchea con swing
// Motivo de 4 compases: [compás, tiempo (en negras), midi, duración]
const motif = [
  [0, 0, 74, 0.3], [0, 0.66, 77, 0.3], [0, 1, 81, 0.9], [0, 3, 79, 0.3], [0, 3.66, 77, 0.3],
  [1, 0, 74, 0.8], [1, 2.66, 72, 0.3], [1, 3, 74, 0.5],
  [2, 0, 70, 0.3], [2, 0.66, 74, 0.3], [2, 1, 79, 0.9], [2, 3, 77, 0.3], [2, 3.66, 74, 0.3],
  [3, 0, 77, 0.4], [3, 1, 76, 0.4], [3, 2, 73, 0.4], [3, 3, 69, 0.7],
];

pad(0, [38, 45, 50], 6.2, 0.06); // drone de la intro
bars.forEach((name, b) => {
  const t0 = b * BAR, ch = CH[name];
  const intro = b < 3, twist = b === 15 || b === 16, final = b === 20, outro = b >= 17;
  if (final) return;
  // chasquidos en 2 y 4 (siempre)
  snap(t0 + BEAT, twist ? 0.25 : 0.5);
  snap(t0 + 3 * BEAT, twist ? 0.25 : 0.5);
  // bajo caminante
  if (b >= 1) {
    const walk = ch.walk[b % ch.walk.length];
    walk.forEach((m, k) => (!twist || k % 2 === 0) && bass(t0 + k * BEAT, m, twist ? 0.9 : 0.45));
  }
  if (intro || twist) return;
  kick(t0, 0.7);
  kick(t0 + 2 * BEAT, 0.55);
  for (let k = 0; k < 4; k++) {
    hat(t0 + k * BEAT, 0.1);
    hat(t0 + k * BEAT + SW, 0.16);
  }
  keys(t0 + BEAT + SW, ch.stab, 0.35);
  keys(t0 + 3 * BEAT, ch.stab, 0.6);
  if (b >= 5) {
    const mb = (b - 5) % 4;
    motif.filter(([mBar]) => mBar === mb).forEach(([, beat, midi, dur]) => {
      const tt = t0 + Math.floor(beat) * BEAT + (beat % 1 ? SW : 0);
      vibes(tt, midi, dur);
      if (outro) vibes(tt, midi + 12, dur, 0.1); // octava arriba en el cierre
    });
  }
  if (outro) kick(t0 + BEAT + SW, 0.35);
});
pad(30, [43, 50, 58, 61], 4, 0.06); // tensión del giro
// acorde final
kick(40, 1); bass(40, 38, 1.9, 0.6); keys(40, [50, 57, 62, 65, 69, 76], 2, 0.16); vibes(40, 86, 1.9, 0.2); ding(40, 86, 0.18);

// ── Cues de efectos (ver index.html) ──────────────────────────
// Escena 1 · gancho
thud(1.0, 0.6); thud(1.5, 0.6); whoosh(1.7, 0.3, 0.2); thud(2.0, 1); pop(3.5, 0.8, 0, 0.25);
whoosh(5.55, 0.45);
// Escena 2 · título
thud(6.0, 0.9); ding(6.0, 81, 0.2); pop(7.5, 1);
[8.2, 8.35, 8.5].forEach((t, i) => pop(t, 1.2 + i * 0.15, i - 1, 0.25));
whoosh(9.55, 0.45);
// Escena 3 · cartas
[10.5, 10.7, 10.9, 11.1].forEach((t, i) => { whoosh(t, 0.22, 0.25, false); tick(t + 0.2, (i - 1.5) / 2); });
[12.0, 12.6, 13.2].forEach((t, i) => { flip(t, (i - 1.5) / 2); ding(t + 0.25, 86 + i * 2, 0.12, (i - 1.5) / 2); });
flip(14.0, 0.75); thud(14.25, 1); wobble(14.3, 0.22); pop(15.5, 0.9, 0, 0.25);
whoosh(17.55, 0.45);
// Escena 4 · pistas
[18.5, 18.62, 18.74, 18.86].forEach((t, i) => pop(t, 0.9 + i * 0.1, (i - 1.5) / 2, 0.25));
[19.5, 20.25, 21.0].forEach((t, i) => pop(t, 1.3 + i * 0.12, (i - 1.5) / 2, 0.45));
wobble(22.0, 0.32); tick(23.0, -0.5); tick(23.12, 0); tick(23.24, 0.3); pop(23.75, 0.9, 0, 0.25);
whoosh(25.55, 0.45);
// Escena 5 · votación
[27.0, 27.5, 28.0].forEach((t, i) => { whoosh(t - 0.2, 0.2, 0.2); tick(t, 0.5); pop(t, 1 + i * 0.25, 0.5, 0.3); });
thud(29.0, 1.1); ding(29.02, 74, 0.15);
whoosh(29.8, 0.4, 0.3, false); pop(30.5, 0.7, 0, 0.35); ding(32.0, 93, 0.12);
riser(32.6, 1.4);
// Escena 6 · llamada a jugar
thud(34.0, 1.1); ding(34.0, 86, 0.22); thud(35.0, 0.7); pop(36.5, 1.1, 0, 0.45);
add(38.0, 0.05, 0.6, 0, (dt) => Math.sin(2 * Math.PI * 900 * dt) * Math.exp(-dt * 150)); thud(38.02, 0.9);
for (let i = 0; i < 14; i++) ding(38.05 + i * 0.07, 84 + ((i * 7) % 17), 0.07, ((i * 5) % 9) / 4 - 1);

// ── Máster: saturación suave, normalizado y fundido final ─────
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1); R[i] = Math.tanh(R[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
if (!(peak > 0.2)) throw new Error(`mezcla sospechosa (pico ${peak})`); // check mínimo: ni silencio ni NaN
const norm = 0.89 / peak, fadeFrom = N - SR * 0.5;
const wav = Buffer.alloc(44 + N * 4);
wav.write("RIFF", 0); wav.writeUInt32LE(36 + N * 4, 4); wav.write("WAVEfmt ", 8);
wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(2, 22);
wav.writeUInt32LE(SR, 24); wav.writeUInt32LE(SR * 4, 28); wav.writeUInt16LE(4, 32); wav.writeUInt16LE(16, 34);
wav.write("data", 36); wav.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const f = i > fadeFrom ? (N - i) / (N - fadeFrom) : 1;
  wav.writeInt16LE(Math.round(L[i] * norm * f * 32767), 44 + i * 4);
  wav.writeInt16LE(Math.round(R[i] * norm * f * 32767), 46 + i * 4);
}
writeFileSync(new URL("./assets/soundtrack.wav", import.meta.url), wav);
console.log(`assets/soundtrack.wav · ${DUR}s · pico previo ${peak.toFixed(2)}`);
