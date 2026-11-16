// Shared button looks, so every button in the app matches.
//   PRIMARY:   cyan pill, royal text, 2px royal outline (the outline keeps it readable on light surfaces)
//   SECONDARY: white pill, 2px royal outline, royal text
// Add size and layout classes next to these, for example `${PRIMARY} ${SIZE.lg} w-full`.
const BASE = 'inline-flex items-center justify-center gap-2 rounded-full border-2 border-royal font-bold text-royal transition-transform active:scale-[0.97] disabled:opacity-35';

export const PRIMARY = `${BASE} bg-cyan`;
export const SECONDARY = `${BASE} bg-surface`;
export const SIZE = {
  sm: 'px-5 py-2.5 text-sm',
  md: 'px-6 py-3 text-[15px]',
  lg: 'px-6 py-4 text-base',
};
