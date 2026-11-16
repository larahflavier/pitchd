// Shared springs, so every animation in the app feels like the same hand made it.
// Animate only transform and opacity. Respect reduced motion (MotionConfig in app/page.js handles most of it).
export const spring = {
  snappy: { type: 'spring', stiffness: 420, damping: 30 }, // taps and small moves
  bouncy: { type: 'spring', stiffness: 380, damping: 16 }, // things that land and settle
  soft: { type: 'spring', stiffness: 220, damping: 26 },   // rings, bars, big surfaces
};
