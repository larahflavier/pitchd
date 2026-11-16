'use client';
import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion } from 'motion/react';
import { Check, Gift, Zap } from 'lucide-react';
import Mascot from './Mascot';
import ProgressRing from './ui/ProgressRing';
import { byId, currentStreak, setSize, todayStr } from '@/lib/engine';
import { levelProgress } from '@/lib/gamify';
import { play, vibrate } from '@/lib/sound';
import { smallBurst } from '@/lib/celebrate';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';

function CountUp({ to }) {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  useEffect(() => {
    if (reduce) { setV(to); return; }
    const c = animate(0, to, { duration: 0.8, delay: 0.3, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [to, reduce]);
  return <>{v}</>;
}

// Shown after every session. After the daily set it also closes the goal ring with a small burst.
export default function Summary({ kind, results, st, bonus, onOpenBonus, onHome, onMore }) {
  const right = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);
  const mood = right / results.length >= 0.6 ? 'happy' : 'oops';
  const streak = currentStreak(st);
  const daily = kind === 'daily';
  const xpToday = st.history[todayStr()]?.xp || 0;
  const lvl = levelProgress(st.xp || 0);
  const ringRef = useRef(null);
  const [fact, setFact] = useState(null); // the fun fact, once opened

  useEffect(() => {
    if (!daily) return;
    play('complete');
    vibrate([40, 40, 80]);
    // the ring finishes sweeping at about 0.6s, then it pops
    const t = setTimeout(() => {
      const r = ringRef.current?.getBoundingClientRect();
      if (r) smallBurst({ x: (r.left + r.width / 2) / window.innerWidth, y: (r.top + r.height / 2) / window.innerHeight });
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
    <div className="main center">
      {daily ? (
        <div className="mb-2 mt-1 flex justify-center">
          <div ref={ringRef}>
            <ProgressRing value={results.length} max={results.length} size={112} stroke={9} trackClass="stroke-line" fillClass="stroke-azure" animate>
              <Check size={38} strokeWidth={3} className="text-royal" />
            </ProgressRing>
          </div>
        </div>
      ) : (
        <div className="summary-mascot"><Mascot mood={mood} size={150} sparkles /></div>
      )}
      <div className="big">{right}/{results.length}</div>
      <p className="hint" style={{ margin: '8px 0 14px' }}>
        {daily ? (mood === 'happy' ? 'Set complete. Nice work.' : 'Set complete. The misses are the useful part.') : kind === 'bonus' ? 'Bonus done.' : 'Solid practice.'}
      </p>

      {daily && (
        <>
          <div className="stats" style={{ marginBottom: 10 }}>
            <div className="stat"><small>Streak</small><b>{streak}</b></div>
            <div className="stat"><small>Best</small><b>{st.best}</b></div>
          </div>
          <div className="mb-3.5 flex items-center justify-between rounded-[24px] bg-periwinkle p-4 text-left text-white">
            <span className="flex items-center gap-2 text-[15px] font-bold"><Zap size={18} strokeWidth={2.25} />+<CountUp to={xpToday} /> XP today</span>
            <span className="text-[13px] font-bold">Level {lvl.level} · {lvl.into}/{lvl.span}</span>
          </div>
        </>
      )}

      {daily && (bonus || fact) && (
        <div className="mb-3.5 rounded-[28px] bg-orange-soft p-5 text-left">
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

      {missed.length > 0 && (
        <div className="card misslist">
          <h3>Coming back for review</h3>
          <ul>{missed.map((r) => <li key={r.id}>{byId[r.id].q}</li>)}</ul>
        </div>
      )}
      <button className="btn" onClick={onHome}>Back home</button>
      <button className="btn ghost" onClick={onMore}>Practice {setSize(st)} more</button>
    </div>
  );
}
