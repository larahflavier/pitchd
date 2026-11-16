import { cn } from '@/lib/utils';

// Starburst and speech-bubble stickers. Flat fills from the palette, a 2px royal outline instead of a shadow.
// Keep the text to one to three words. Text is uppercase.
const FILLS = {
  cyan: { bg: 'bg-cyan', css: 'var(--cyan)', text: 'text-royal' },
  'cyan-soft': { bg: 'bg-cyan-soft', css: 'var(--cyan-soft)', text: 'text-royal' },
  azure: { bg: 'bg-azure', css: 'var(--azure)', text: 'text-white' },
  'azure-soft': { bg: 'bg-azure-soft', css: 'var(--azure-soft)', text: 'text-royal' },
  royal: { bg: 'bg-royal', css: 'var(--royal)', text: 'text-white' },
  white: { bg: 'bg-surface', css: 'var(--surface)', text: 'text-royal' },
};

// polygon points for an n-pointed star inside a 100 x 100 box
function burstPoints(n) {
  const outer = 48;
  const inner = outer * 0.8;
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (i * Math.PI) / n - Math.PI / 2;
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)},${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export default function Sticker({ variant = 'burst', fill = 'cyan', rotate = -8, points = 10, size = 84, className, children }) {
  const f = FILLS[fill] || FILLS.cyan;
  const r = Math.max(-12, Math.min(12, rotate)); // stickers tilt up to 12 degrees

  if (variant === 'bubble') {
    return (
      <span
        className={cn('relative inline-block rounded-[18px] border-2 border-royal px-3.5 py-2 text-[13px] font-bold uppercase leading-none tracking-wide', f.bg, f.text, className)}
        style={{ transform: `rotate(${r}deg)` }}
      >
        {children}
        <i className={cn('absolute -bottom-[7px] left-5 block size-3 rotate-45 border-b-2 border-r-2 border-royal', f.bg)} aria-hidden="true" />
      </span>
    );
  }

  const n = Math.max(8, Math.min(12, points));
  return (
    <span className={cn('relative inline-block', className)} style={{ width: size, height: size, transform: `rotate(${r}deg)` }}>
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <polygon points={burstPoints(n)} fill={f.css} stroke="var(--royal)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className={cn('absolute inset-0 grid place-items-center px-[18%] text-center text-[11px] font-bold uppercase leading-[1.05] tracking-wide', f.text)}>
        {children}
      </span>
    </span>
  );
}
