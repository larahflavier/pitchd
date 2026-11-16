import { cn } from '@/lib/utils';

// A card that sits slightly tilted and overlaps the card below it. Used on Home and Review only, never in the quiz.
// Put several in a column: each later card lands on top of the one before.
export default function StackCard({ tilt = -1.5, overlap = 20, className, style, children, ...rest }) {
  const t = Math.max(-2, Math.min(2, tilt)); // up to 2 degrees
  const o = Math.max(16, Math.min(24, overlap)); // 16 to 24px
  return (
    <div
      className={cn('relative rounded-[28px]', className)}
      style={{ transform: `rotate(${t}deg)`, marginBottom: -o, ...style }}
      {...rest}
    >
      {children}
    </div>
  );
}
