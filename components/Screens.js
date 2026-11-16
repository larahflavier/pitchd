'use client';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAT_LABELS, currentStreak, fixedCount, mastery, lastNDays, quizCatsFor, todayStr } from '@/lib/engine';
import Stagger from './ui/Stagger';
import Roadmap from './Roadmap';
import SkillMap from './SkillMap';
import Badges from './Badges';

/* -------------------------------- Progress ------------------------------- */
export function Progress({ st }) {
  const m = mastery(st);
  const cats = quizCatsFor(st.track);
  const t = todayStr();
  const days = lastNDays(21);
  const streak = currentStreak(st);
  return (
    <Stagger className="main flex flex-col gap-4">
      <h1 className="text-[30px] font-bold leading-none tracking-tight">Progress</h1>

      {/* streak: a big number on royal, with a cyan flame */}
      <section className="rounded-[32px] bg-royal p-5 text-white">
        <div className="flex items-center gap-4">
          <Flame size={58} strokeWidth={2.25} className="text-cyan" aria-hidden="true" />
          <div>
            <p className="text-[68px] font-bold leading-none tabular-nums">{streak}</p>
            <p className="mt-1 text-[14px] font-bold text-white/85">day streak</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {[['Best', st.best], ['Answered', m.answered], ['Mastered', fixedCount(st)]].map(([label, n]) => (
            <div key={label} className="rounded-[20px] bg-white/15 px-3 py-2.5">
              <span className="block text-[11px] font-bold text-white/80">{label}</span>
              <b className="text-[22px] font-bold tabular-nums tracking-tight">{n}</b>
            </div>
          ))}
        </div>
      </section>

      <Roadmap st={st} />
      <SkillMap st={st} />
      <Badges st={st} />

      <section className="rounded-[28px] bg-surface p-5">
        <h2 className="text-base font-bold">Accuracy by category</h2>
        <div className="mt-3 flex flex-col gap-3">
          {cats.map((c) => {
            const v = m.byCat[c];
            return (
              <div key={c}>
                <div className="mb-1 flex justify-between text-[13px] font-semibold">
                  <span>{CAT_LABELS[c]}</span>
                  <span className="tabular-nums text-muted-foreground">{v ? `${v.pct}%` : '--'}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-line">
                  <i className="block h-full rounded-full bg-azure" style={{ width: `${v?.pct ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] font-medium text-muted-foreground">
          Based on every answer so far, including misses. Questions you master in Review count toward your mastered total.
        </p>
      </section>

      <section className="rounded-[28px] bg-surface p-5">
        <h2 className="text-base font-bold">Last 3 weeks</h2>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {days.map((d) => (
            <i
              key={d}
              title={d}
              className={cn('block aspect-square rounded-full', st.history[d]?.setDone ? 'bg-cyan' : 'bg-line', d === t && 'ring-2 ring-royal ring-offset-2 ring-offset-surface')}
            />
          ))}
        </div>
      </section>
    </Stagger>
  );
}
