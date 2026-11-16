// Confetti for set completion and milestones. Browser only.
// Colors come from the CSS tokens in globals.css, so there are no hard-coded hex values here.
import confetti from 'canvas-confetti';

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function colors() {
  const css = getComputedStyle(document.documentElement);
  return ['--royal', '--azure', '--cyan', '--orange', '--ink']
    .map((v) => css.getPropertyValue(v).trim())
    .filter(Boolean);
}

const base = () => ({ colors: colors(), zIndex: 70, disableForReducedMotion: true, ticks: 140 });

// a small pop, used when the daily ring closes. origin is { x, y } from 0 to 1
export function smallBurst(origin = { x: 0.5, y: 0.4 }) {
  if (reduced()) return;
  try { confetti({ ...base(), particleCount: 36, spread: 70, startVelocity: 24, scalar: 0.8, origin }); } catch {}
}

// bigger, for level-ups and badges
export function bigBurst() {
  if (reduced()) return;
  try {
    const o = base();
    confetti({ ...o, particleCount: 70, angle: 60, spread: 65, startVelocity: 45, origin: { x: 0, y: 0.75 } });
    confetti({ ...o, particleCount: 70, angle: 120, spread: 65, startVelocity: 45, origin: { x: 1, y: 0.75 } });
  } catch {}
}
