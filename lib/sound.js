// Short UI sounds made with the Web Audio API. No audio files.
// Browser only. Every call is wrapped so a blocked or missing audio device never breaks the app.

let ctx = null;
let enabled = true;

export function setSoundEnabled(on) { enabled = !!on; }
export const soundEnabled = () => enabled;

function audio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const C = window.AudioContext || window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  // browsers only allow audio after a tap, so resume on each call from a tap handler
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// [frequency Hz, start sec, length sec, wave, volume]
const SOUNDS = {
  correct: [[660, 0, 0.09, 'sine', 0.1], [880, 0.08, 0.16, 'sine', 0.1]],
  wrong: [[260, 0, 0.18, 'triangle', 0.09], [196, 0.12, 0.22, 'triangle', 0.08]],
  flip: [[520, 0, 0.05, 'sine', 0.05]],
  combo: [[523, 0, 0.08, 'sine', 0.09], [659, 0.07, 0.08, 'sine', 0.09], [784, 0.14, 0.18, 'sine', 0.1]],
  combo5: [[523, 0, 0.08, 'sine', 0.1], [659, 0.07, 0.08, 'sine', 0.1], [784, 0.14, 0.08, 'sine', 0.1], [1047, 0.21, 0.28, 'sine', 0.11]],
  complete: [[523, 0, 0.12, 'sine', 0.1], [659, 0.1, 0.12, 'sine', 0.1], [784, 0.2, 0.12, 'sine', 0.1], [1047, 0.3, 0.4, 'sine', 0.11]],
  levelUp: [[392, 0, 0.1, 'triangle', 0.1], [523, 0.1, 0.1, 'triangle', 0.1], [659, 0.2, 0.1, 'triangle', 0.1], [784, 0.3, 0.1, 'triangle', 0.1], [1047, 0.4, 0.45, 'triangle', 0.11]],
  badge: [[784, 0, 0.1, 'sine', 0.1], [988, 0.1, 0.1, 'sine', 0.1], [1319, 0.2, 0.35, 'sine', 0.1]],
  on: [[600, 0, 0.07, 'sine', 0.08], [800, 0.07, 0.1, 'sine', 0.08]],
};

export function play(name) {
  if (!enabled) return;
  try {
    const c = audio();
    const notes = SOUNDS[name];
    if (!c || !notes) return;
    const now = c.currentTime;
    for (const [freq, start, len, wave, vol] of notes) {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = wave;
      osc.frequency.value = freq;
      // quick fade in and out so there are no clicks
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(vol, now + start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + len);
      osc.connect(gain).connect(c.destination);
      osc.start(now + start);
      osc.stop(now + start + len + 0.02);
    }
  } catch {}
}

// Phone vibration where supported. Follows the sound switch.
export function vibrate(pattern = 30) {
  if (!enabled) return;
  try { navigator.vibrate?.(pattern); } catch {}
}
