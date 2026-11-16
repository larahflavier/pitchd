'use client';
import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'motion/react';
import SoundToggle from './SoundToggle';
import { spring } from '@/lib/motion';

// The royal opening screen: the bubble drops in, the white wordmark rises under it, then the tagline.
// mode 'full' is about 1.4s (new users). mode 'short' is about 0.8s (returning users, once per session).
// Tap or press a key to skip. Reduced motion shows the final frame for 600ms.
export default function Splash({ mode = 'full', soundOn, onSound, onDone }) {
  const reduced = useReducedMotion();
  const full = mode === 'full';
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => {
    const t = setTimeout(() => done.current(), reduced ? 600 : full ? 1400 : 800);
    return () => clearTimeout(t);
  }, [reduced, full]);

  // with reduced motion every piece starts in its final state
  const start = (from) => (reduced ? false : from);

  return (
    <motion.div
      className="no-press fixed inset-0 z-[80] cursor-pointer"
      role="button"
      tabIndex={0}
      aria-label="Pitchd. Tap to skip."
      onClick={() => done.current()}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') done.current(); }}
    >
      {/* The royal panel is shared with the Home hero card: on Home it shrinks into the card.
          Elsewhere it simply stays royal while the contents fade, then goes. */}
      <motion.div
        layoutId="set-card"
        className="absolute inset-0 bg-royal"
        style={{ borderRadius: 0 }}
        exit={{ opacity: 1, transition: { duration: 0.5 } }}
        transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center"
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
      >
      <div
        className="absolute right-4"
        style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <SoundToggle on={soundOn} onChange={onSound} />
      </div>

      {/* bubble: drops in, squashes on landing, then a small pop */}
      <motion.div
        className="w-[40vw] max-w-[172px]"
        initial={start(full ? { y: -80, opacity: 0 } : { scale: 0.82, opacity: 0 })}
        animate={full ? { y: 0, opacity: 1 } : { scale: 1, opacity: 1 }}
        transition={full ? { ...spring.bouncy, opacity: { duration: 0.15 } } : { duration: 0.25, ease: 'easeOut' }}
      >
        <motion.div
          style={{ transformOrigin: '50% 100%' }}
          initial={start({ scaleX: 1, scaleY: 1 })}
          animate={full && !reduced ? { scaleX: [1, 1.1, 0.97, 1.05, 1], scaleY: [1, 0.88, 1.03, 0.98, 1] } : { scaleX: 1, scaleY: 1 }}
          transition={{ delay: 0.25, duration: 0.45, times: [0, 0.25, 0.55, 0.8, 1] }}
        >
          <motion.div layoutId="brand-bubble" transition={spring.soft}>
            <Image src="/brand/pitchd-bubble.png" width={660} height={631} priority alt="" className="h-auto w-full" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* wordmark fades up */}
      <motion.div
        className="mt-5 w-[52vw] max-w-[224px]"
        initial={start({ opacity: 0, y: 12 })}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: full ? 0.5 : 0.15, duration: 0.3, ease: 'easeOut' }}
      >
        <Image src="/brand/pitchd-wordmark-white.png" width={1490} height={405} priority alt="Pitchd" className="h-auto w-full" />
      </motion.div>

      {/* tagline, new users only */}
      {full && (
        <motion.p
          className="mt-5 flex items-center gap-3 text-[11px] font-bold tracking-[0.22em] text-white"
          initial={start({ opacity: 0 })}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.85, duration: 0.3 }}
        >
          <i className="block h-0.5 w-6 rounded-full bg-cyan" aria-hidden="true" />
          YOUR INTERNSHIP PREP APP
          <i className="block h-0.5 w-6 rounded-full bg-cyan" aria-hidden="true" />
        </motion.p>
      )}
      </motion.div>
    </motion.div>
  );
}
