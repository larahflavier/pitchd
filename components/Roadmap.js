'use client';
import { CircleCheck, Circle, CircleDot, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRACKS, CAT_LABELS, todayStr, planProfile } from '@/lib/engine';
import { describePlan } from '@/lib/curriculum';

const MIX_COLORS = { behavioral: 'bg-teal', basics: 'bg-orange', news: 'bg-pink' };

// The plan on the Progress tab: where you are, the three phases, and this week's practice mix.
export default function Roadmap({ st }) {
  if (!st.onboarded || !TRACKS[st.track]) return null;
  const p = describePlan(planProfile(st), st.plan, todayStr(), TRACKS[st.track].label);
  const mix = p.weights
    ? Object.entries(p.weights).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <section className="mb-3.5 flex flex-col gap-3">
      <div className="rounded-[32px] bg-periwinkle p-5">
        <p className="text-[13px] font-bold text-ink/70">Your plan</p>
        <h2 className="mt-1 text-[22px] font-bold leading-tight tracking-tight">{p.label}</h2>
        {!p.finished && <p className="mt-1 text-[15px] font-semibold">This week: {p.theme}</p>}
        {p.finished && <p className="mt-1 text-[15px] font-semibold">Keep practicing, or edit your goals in Account to start a new plan.</p>}
        {p.daysLeft !== null && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold">
            <CalendarClock size={14} strokeWidth={2.25} />
            {p.daysLeft > 0 ? `${p.daysLeft} days until your interview` : p.daysLeft === 0 ? 'Interview day' : 'Interview date has passed'}
          </p>
        )}
      </div>

      <ul className="flex flex-col gap-2.5">
        {p.phases.map((ph) => {
          const Icon = ph.state === 'done' ? CircleCheck : ph.state === 'current' ? CircleDot : Circle;
          return (
            <li
              key={ph.id}
              className={cn('flex items-start gap-3 rounded-[20px] p-4', ph.state === 'current' ? 'bg-surface ring-2 ring-ink' : 'bg-surface')}
            >
              <Icon
                size={22}
                strokeWidth={2}
                className={cn('mt-0.5 shrink-0', ph.state === 'done' ? 'text-teal' : ph.state === 'current' ? 'text-ink' : 'text-muted-foreground')}
              />
              <span>
                <span className="block text-[15px] font-bold">{ph.name}</span>
                <span className="block text-[13px] font-medium text-muted-foreground">
                  {ph.weeks === 1 ? `Week ${ph.startWeek}` : `Weeks ${ph.startWeek}-${ph.endWeek}`}. {ph.focus}.
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      {mix.length > 0 && (
        <div className="rounded-[28px] bg-surface p-5">
          <h3 className="text-base font-bold">This week's mix</h3>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-line">
            {mix.map(([cat, w]) => (
              <i key={cat} className={cn('h-full', MIX_COLORS[cat] || 'bg-periwinkle-strong')} style={{ width: `${w * 100}%` }} />
            ))}
          </div>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {mix.map(([cat, w]) => (
              <li key={cat} className="flex items-center gap-1.5 text-[13px] font-semibold">
                <i className={cn('size-2.5 rounded-full', MIX_COLORS[cat] || 'bg-periwinkle-strong')} />
                {CAT_LABELS[cat]} {Math.round(w * 100)}%
              </li>
            ))}
          </ul>
          <p className="mt-2.5 text-[13px] font-medium text-muted-foreground">
            Shifts toward the topics you miss most. Updates every Monday.
          </p>
        </div>
      )}
    </section>
  );
}
