// Short UI sounds made with the Web Audio API. No audio files to ship.
// Browser only. Every call is wrapped so a blocked or missing audio device never breaks the app.
//
// The set (from the funk pass plan): pop (correct), thud (wrong, soft), combo (rising two-note, a
// longer one at 5), whoosh (a card flying off), chime (set complete, up to 1s). Everything else is a
// short extra. Each one is under 400ms except the chime and the two milestone sounds.
//
// Sound is only ever played from code that runs AFTER the answer is saved, never before.
// Muting is instant: every sound goes through one master gain that drops to 0 at once.

let ctx = null;
let master = null;
let sfxOn = true;
let hapticsOn = true;

export const soundEnabled = () => sfxOn;
export const hapticsEnabledNow = () => hapticsOn;

export function setSoundEnabled(on) {
  sfxOn = !!on;
  // silence anything already playing, right now, not on the next sound
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime);
    master.gain.setValueAtTime(sfxOn ? 1 : 0, ctx.currentTime);
  }
}
export function setHapticsEnabled(on) { hapticsOn = !!on; }

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    master = ctx.createGain();
    master.gain.value = sfxOn ? 1 : 0;
    master.connect(ctx.destination);
  }
  // browsers only allow audio after a tap, so resume on each call from a tap handler
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

/* ------------------------------- building blocks ------------------------------- */
// a tone with a quick fade in and out (no clicks), optionally gliding from f to f2
function tone(c, out, t0, { f, f2, start = 0, len, type = 'sine', vol = 0.1 }) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0 + start);
  if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + start + len);
  g.gain.setValueAtTime(0.0001, t0 + start);
  g.gain.exponentialRampToValueAtTime(vol, t0 + start + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len);
  o.connect(g).connect(out);
  o.start(t0 + start);
  o.stop(t0 + start + len + 0.02);
}

// filtered noise that sweeps from one pitch to another: the "whoosh"
function sweep(c, out, t0, { start = 0, len, from, to, vol }) {
  const frames = Math.ceil(c.sampleRate * (len + 0.05));
  const buf = c.createBuffer(1, frames, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(from, t0 + start);
  band.frequency.exponentialRampToValueAtTime(to, t0 + start + len);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0 + start);
  g.gain.exponentialRampToValueAtTime(vol, t0 + start + len * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + len);
  src.connect(band).connect(g).connect(out);
  src.start(t0 + start);
  src.stop(t0 + start + len + 0.05);
}

/* ---------------------------------- the sounds ---------------------------------- */
const SOUNDS = {
  // correct: a bright pop that rises, with a tiny sparkle on top (about 130ms)
  pop: (c, o, t) => {
    tone(c, o, t, { f: 520, f2: 900, len: 0.11, vol: 0.14 });
    tone(c, o, t, { f: 1320, start: 0.02, len: 0.08, vol: 0.04 });
  },
  // wrong: a soft low thud that sinks, never harsh (about 250ms)
  thud: (c, o, t) => {
    tone(c, o, t, { f: 150, f2: 62, len: 0.24, type: 'triangle', vol: 0.17 });
  },
  // 3 in a row: a rising two-note (about 230ms)
  combo: (c, o, t) => {
    tone(c, o, t, { f: 660, len: 0.09, vol: 0.1 });
    tone(c, o, t, { f: 990, start: 0.09, len: 0.14, vol: 0.11 });
  },
  // 5 in a row: the same rise with a third note on top (about 340ms)
  combo5: (c, o, t) => {
    tone(c, o, t, { f: 660, len: 0.09, vol: 0.1 });
    tone(c, o, t, { f: 880, start: 0.09, len: 0.09, vol: 0.1 });
    tone(c, o, t, { f: 1320, start: 0.18, len: 0.16, vol: 0.11 });
  },
  // a card flying off: a quick airy sweep (about 220ms)
  whoosh: (c, o, t) => {
    sweep(c, o, t, { len: 0.22, from: 500, to: 2600, vol: 0.5 });
  },
  // set complete: a three-note bell that rings out (about 0.95s)
  chime: (c, o, t) => {
    tone(c, o, t, { f: 784, len: 0.7, vol: 0.1 });
    tone(c, o, t, { f: 1568, len: 0.5, vol: 0.03 });
    tone(c, o, t, { f: 988, start: 0.11, len: 0.7, vol: 0.1 });
    tone(c, o, t, { f: 1976, start: 0.11, len: 0.5, vol: 0.03 });
    tone(c, o, t, { f: 1319, start: 0.22, len: 0.73, vol: 0.11 });
    tone(c, o, t, { f: 2638, start: 0.22, len: 0.5, vol: 0.03 });
  },
  // small extras
  flip: (c, o, t) => { tone(c, o, t, { f: 520, len: 0.05, vol: 0.05 }); },
  on: (c, o, t) => {
    tone(c, o, t, { f: 600, len: 0.07, vol: 0.08 });
    tone(c, o, t, { f: 800, start: 0.07, len: 0.1, vol: 0.08 });
  },
  // milestones (level up and badges), a little longer
  levelUp: (c, o, t) => {
    [392, 523, 659, 784].forEach((f, i) => tone(c, o, t, { f, start: i * 0.09, len: 0.12, type: 'triangle', vol: 0.1 }));
    tone(c, o, t, { f: 1047, start: 0.36, len: 0.5, type: 'triangle', vol: 0.11 });
  },
  badge: (c, o, t) => {
    tone(c, o, t, { f: 784, len: 0.1, vol: 0.1 });
    tone(c, o, t, { f: 988, start: 0.1, len: 0.1, vol: 0.1 });
    tone(c, o, t, { f: 1319, start: 0.2, len: 0.32, vol: 0.1 });
  },
};

export const SOUND_NAMES = Object.keys(SOUNDS);

export function play(name) {
  if (!sfxOn) return;
  try {
    const c = audio();
    const make = SOUNDS[name];
    if (!c || !make) return;
    make(c, master, c.currentTime);
  } catch {}
}

// Phone vibration where the browser supports it (Android Chrome; iPhones do not). Has its own switch.
export function vibrate(pattern = 30) {
  if (!hapticsOn) return;
  try { navigator.vibrate?.(pattern); } catch {}
}
export const canVibrate = () => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

// Development only: lets the sounds be rendered offline and measured (peak level and length).
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  window.__pitchdSound = { SOUNDS, masterGain: () => (master ? master.gain.value : null), isOn: () => sfxOn, hapticsOn: () => hapticsOn };
}
