'use client';
import { Flag, Flame, Timer, NotebookPen, Award, Trophy, GraduationCap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BADGES } from '@/lib/badges';

const ICONS = { Flag, Flame, Timer, NotebookPen, Award, Trophy, GraduationCap };
export function BadgeIcon({ name, size = 22 }) {
  const Icon = ICONS[name] || Award;
  return <Icon size={size} strokeWidth={2} />;
}

const when = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Earned badges are colored. Locked ones stay grey and say what earns them.
export default function Badges({ st }) {
  const earned = BADGES.filter((b) => st.badges?.[b.id]).length;
  return (
    <section className="mb-3.5 rounded-[28px] bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Badges</h2>
        <span className="text-[13px] font-bold text-muted-foreground">{earned} of {BADGES.length}</span>
      </div>
      <ul className="mt-3 grid grid-cols-3 gap-2.5">
        {BADGES.map((b) => {
          const date = st.badges?.[b.id];
          return (
            <li key={b.id} className={cn('flex flex-col items-center rounded-[20px] p-2.5 text-center', date ? 'bg-periwinkle-soft' : 'bg-app')}>
              <span className={cn('grid size-11 place-items-center rounded-full', date ? 'bg-periwinkle' : 'bg-line text-muted-foreground')}>
                {date ? <BadgeIcon name={b.icon} /> : <Lock size={17} strokeWidth={2.25} />}
              </span>
              <span className={cn('mt-1.5 text-[12px] font-bold leading-tight', !date && 'text-muted-foreground')}>{b.title}</span>
              <span className="mt-0.5 text-[10.5px] font-medium leading-tight text-muted-foreground">{date ? when(date) : b.desc}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
