'use client';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

// Two eyes peeking over the top edge of a card. Put it inside a `relative` card.
// They blink every 3 to 6 seconds and the pupils drift toward your last tap.
// Flat shapes only. Reduced motion: still eyes, no blinking or drifting.
export default function PeekEyes({ size = 22, gap = 6, className = '' }) {
  const reduced = useReducedMotion();
  const ref = useRef(null);
  const [blink, setBlink] = useState(false);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const pupil = Math.round(size * 0.44);
  const reach = size * 0.2;

  useEffect(() => {
    if (reduced) return;
    let next;
    let back;
    const loop = () => {
      next = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          setBlink(true);
          back = setTimeout(() => setBlink(false), 140);
        }
        loop();
      }, 3000 + Math.random() * 3000);
    };
    loop();
    return () => { clearTimeout(next); clearTimeout(back); };
  }, [reduced]);

  useEffect(() => {
    if (reduced) return;
    const onTap = (e) => {
      const r = ref.current?.getBoundingClientRect();
      if (!r) return;
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      const d = Math.hypot(dx, dy) || 1;
      const k = Math.min(1, d / 90); // close taps move the pupils less
      setLook({ x: (dx / d) * k * reach, y: (dy / d) * k * reach });
    };
    window.addEventListener('pointerdown', onTap);
    return () => window.removeEventListener('pointerdown', onTap);
  }, [reduced, reach]);

  return (
    <span ref={ref} aria-hidden="true" className={`pointer-events-none absolute -top-[11px] left-6 flex ${className}`} style={{ gap }}>
      {[0, 1].map((i) => (
        <span
          key={i}
          className="grid place-items-center rounded-full border-2 border-royal bg-surface"
          style={{ width: size, height: size, transform: `scaleY(${blink ? 0.12 : 1})`, transition: 'transform 90ms ease-out' }}
        >
          <i
            className="block rounded-full bg-ink"
            style={{ width: pupil, height: pupil, transform: `translate(${look.x}px, ${look.y}px)`, transition: 'transform 140ms ease-out' }}
          />
        </span>
      ))}
    </span>
  );
}
