import { cn } from '@/lib/utils';

// Flat progress ring. Colors come from Tailwind classes so they stay on the tokens.
export default function ProgressRing({
  value,
  max,
  size = 56,
  stroke = 5,
  trackClass = 'stroke-line',
  fillClass = 'stroke-ink',
  animate = false,
  className,
  children,
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  return (
    <div className={cn('relative grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className={trackClass} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          className={cn(fillClass, animate && 'ring-sweep')}
          style={animate ? { '--ring-c': c, '--ring-to': c * (1 - pct) } : undefined}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  );
}
