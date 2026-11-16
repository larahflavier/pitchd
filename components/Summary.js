'use client';
import { useEffect, useRef, useState } from 'react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { Flame, Gift, RotateCcw, Zap } from 'lucide-react';
import Mascot from './Mascot';
import ProgressRing from './ui/ProgressRing';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';
import { spring } from '@/lib/motion';
import { byId, currentStreak, forecast, setSize, todayStr } from '@/lib/engine';
import { levelProgress } from '@/lib/gamify';
import { play, vibrate } from '@/lib/sound';
import { smallBurst, bigBurst } from '@/lib/celebrate';

// Counts up from 0 with tabular digits so the numbers never jump sideways.
function CountUp({ to, delay = 0.3 }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) { setV(to); return; }
    const c = animate(0, to, { duration: 0.8, delay, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, reduce, delay]);
  return <span className="tabular-nums">{v}</span>;
}

// The royal celebration after a set. The goal ring closes with a burst, the score and XP count up,
// and Pip celebrates. Copy follows the score and praises the work, not the person.
export default function Summary({ kind, results, st, bonus, onOpenBonus, onHome, onMore, onReview }) {
  const total = results.length;
  const right = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);
  const pct = total ? right / total : 0;
  const daily = kind === 'daily';
  const good = pct >= 0.6;
  const headline = kind === 'bonus' ? 'Bonus done.' : pct === 1 ? 'Perfect set.' : good ? 'Solid set.' : "Rough day. These come back tomorrow, that's the point.";
  const streak = currentStreak(st);
  const xpToday = st.history[todayStr()]?.xp || 0;
  const lvl = levelProgress(st.xp || 0);
  const dueTomorrow = forecast(st, 1)[0].count;
  const ringRef = useRef(null);
  const [fact, setFact] = useState(null); // the fun fact, once opened

  useEffect(() => {
    if (!daily && !(good && pct === 1)) return;
    if (daily) { play('chime'); vibrate([40, 40, 80]); }
    // the ring finishes sweeping at about 0.6s, then it pops
    const t = setTimeout(() => {
      const r = ringRef.current?.getBoundingClientRect();
      if (pct === 1) bigBurst();
      else if (r) smallBurst({ x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight });
    }, 650);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const open = () => {
    if (!bonus) return;
    play('badge');
    if (bonus.kind === 'fact') setFact(bonus.fact);
    onOpenBonus(bonus.kind);
  };

  return (
    <div
      className="main relative -mx-[18px] flex flex-col items-center bg-royal px-[18px] text-center text-white"
      // fills the whole screen, up behind the sound toggle
      style={{ marginTop: 'calc(-1 * (env(safe-area-inset-top) + 50px))', marginBottom: 'calc(-1 * (env(safe-area-inset-bottom) + 12px))', paddingTop: 'calc(env(safe-area-inset-top) + 64px)', paddingBottom: 'calc(env(safe-area-inset-bottom) + 36px)', minHeight: '100dvh' }}
    >
      <motion.div
        // Pip drops in with a bounce, just after the royal wipe lifts
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ ...spring.bouncy, delay: 0.45 }}
      >
        <Mascot mood={good ? 'happy' : 'oops'} pose={good ? 'celebrate' : 'idle'} size={150} sparkles={good} onDark />
      </motion.div>

      {/* the goal ring closes, and the score counts up inside it */}
      <div ref={ringRef} className="mt-2">
        <ProgressRing value={daily ? total : right} max={total} size={132} stroke={11} trackClass="stroke-white/20" fillClass="stroke-cyan" animate>
          <span className="text-[34px] font-bold leading-none"><CountUp to={right} />/{total}</span>
        </ProgressRing>
      </div>

      <h1 className="mt-4 max-w-[19rem] text-[30px] font-bold leading-[1.08] tracking-tight">{headline}</h1>

      {daily && (
        <div className="mt-5 flex items-center justify-center gap-3">
          <Flame size={44} strokeWidth={2.25} className="text-cyan" aria-hidden="true" />
          <div className="text-left">
            <p className="text-[56px] font-bold leading-none tabular-nums">{streak}</p>
            <p className="text-[13px] font-bold text-white/85">day streak · best {st.best}</p>
          </div>
        </div>
      )}

      {daily && (
        <div className="mt-5 flex w-full items-center justify-between rounded-[24px] bg-white/15 px-4 py-3.5 text-left">
          <span className="flex items-center gap-2 text-[16px] font-bold"><Zap size={18} strokeWidth={2.25} className="text-cyan" /><span>+<CountUp to={xpToday} /> XP today</span></span>
          <span className="text-[13px] font-bold text-white/90">Level {lvl.level} · {lvl.into}/{lvl.span}</span>
        </div>
      )}

      {daily && (bonus || fact) && (
        <div className="mt-4 w-full rounded-[28px] bg-orange-soft p-5 text-left text-ink">
          <span className="flex items-center gap-2 text-[15px] font-bold"><Gift size={18} strokeWidth={2.25} />Surprise</span>
          {fact ? (
            <p className="mt-2 text-[15px] font-medium leading-relaxed">{fact}</p>
          ) : (
            <>
              <p className="mt-1 text-[14px] font-medium text-ink/70">
                {bonus.kind === 'question' ? 'A bonus question. Get it right for double XP.' : 'A fun fact for the road.'}
              </p>
              <button className={`${PRIMARY} ${SIZE.sm} mt-3`} onClick={open}>
                {bonus.kind === 'question' ? 'Try it' : 'Open'}
              </button>
            </>
          )}
        </div>
      )}

      {dueTomorrow > 0 && (
        <button
          onClick={onReview}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-orange px-4 py-2.5 text-[14px] font-bold text-ink"
        >
          <RotateCcw size={16} strokeWidth={2.5} />
          {dueTomorrow} {dueTomorrow === 1 ? 'card' : 'cards'} due tomorrow
        </button>
      )}

      {missed.length > 0 && (
        <div className="mt-4 w-full rounded-[24px] bg-surface p-5 text-left text-ink">
          <h2 className="text-[16px] font-bold">Coming back for review</h2>
          <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-5 text-[14px] font-medium text-muted-foreground">
            {missed.map((r) => <li key={r.id}>{byId[r.id].q}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-auto flex w-full flex-col gap-2.5 pt-6">
        <button className={`${PRIMARY} ${SIZE.lg} w-full`} onClick={onHome}>Back home</button>
        <button className={`${SECONDARY} ${SIZE.lg} w-full`} onClick={onMore}>Practice {setSize(st)} more</button>
      </div>
    </div>
  );
}
