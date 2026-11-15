'use client';
import { House, Briefcase, Layers, ChartNoAxesColumn, User } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TABS = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'interview', label: 'Interview', Icon: Briefcase },
  { id: 'review', label: 'Review', Icon: Layers },
  { id: 'progress', label: 'Progress', Icon: ChartNoAxesColumn },
  { id: 'account', label: 'Account', Icon: User },
];

export default function TabBar({ tab, onChange, reviewDue = 0 }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-2 z-10 mt-3 grid grid-cols-5 gap-1 rounded-full border border-line bg-surface p-1.5 before:absolute before:inset-[-12px_-18px_-20px] before:-z-10 before:bg-app before:content-['']"
    >
      {TABS.map(({ id, label, Icon }) => {
        const on = tab === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-current={on ? 'page' : undefined}
            className={cn(
              'relative flex flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[11px] font-semibold',
              on ? 'bg-periwinkle-soft text-ink' : 'text-muted-foreground',
            )}
          >
            <Icon size={20} strokeWidth={2} />
            {label}
            {id === 'review' && reviewDue > 0 && (
              <i className="absolute left-[calc(50%+6px)] top-1 rounded-full bg-orange px-1.5 py-px text-[10px] font-bold not-italic text-white">
                {reviewDue}
              </i>
            )}
          </button>
        );
      })}
    </nav>
  );
}
