'use client';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import Mascot from './Mascot';
import { BadgeIcon } from './Badges';
import { badgeById } from '@/lib/badges';
import { play, vibrate } from '@/lib/sound';
import { bigBurst } from '@/lib/celebrate';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';

// Level-up and badge pop-ups. They queue while you are answering and show on the next calm screen,
// so nothing ever interrupts a question.
export default function Celebrations({ events, idle, onNext }) {
  const [ready, setReady] = useState(false);
  const has = events.length > 0;

  // wait a beat after the set-complete screen appears, so its own animation plays first
  useEffect(() => {
    if (!(idle && has)) { setReady(false); return; }
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, [idle, has]);

  const ev = ready ? events[0] : null;
  useEffect(() => {
    if (!ev) return;
    play(ev.type === 'level' ? 'levelUp' : 'badge');
    vibrate([30, 50, 30]);
    bigBurst();
  }, [ev]);

  const badge = ev?.type === 'badge' ? badgeById[ev.id] : null;
  return (
    <AnimatePresence>
      {ev && (
        <motion.div
          key={ev.type + (ev.id || ev.level)}
          className="fixed inset-0 z-50 grid place-items-center bg-ink/45 p-6"
          role="dialog"
          aria-modal="true"
          aria-label={ev.type === 'level' ? `Level ${ev.level}` : badge?.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="w-full max-w-[340px] rounded-[36px] bg-surface p-7 text-center"
            initial={{ scale: 0.88, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          >
            {ev.type === 'level' ? (
              <>
                <Mascot mood="happy" size={96} sparkles />
                <p className="mt-2 text-[13px] font-bold text-muted-foreground">Level up</p>
                <motion.p
                  className="text-[64px] font-bold leading-none tracking-tight"
                  initial={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
                >
                  {ev.level}
                </motion.p>
                <p className="mt-3 text-[15px] font-medium text-muted-foreground">
                  Careful answers and steady reviews got you here.
                </p>
              </>
            ) : (
              <>
                <motion.span
                  className="mx-auto grid size-20 place-items-center rounded-full bg-periwinkle"
                  initial={{ scale: 0.6, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.1 }}
                >
                  <BadgeIcon name={badge?.icon} size={34} />
                </motion.span>
                <p className="mt-4 text-[13px] font-bold text-muted-foreground">New badge</p>
                <h2 className="mt-0.5 text-[24px] font-bold leading-tight tracking-tight">{badge?.title}</h2>
                <p className="mt-2 text-[15px] font-medium text-muted-foreground">{badge?.desc}</p>
              </>
            )}
            <button
              autoFocus
              onClick={onNext}
              className={`${PRIMARY} ${SIZE.md} mt-6 w-full`}
            >
              {events.length > 1 ? 'Next' : 'Nice'}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
