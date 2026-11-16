'use client';
import { motion } from 'motion/react';
import { House, Briefcase, Layers, ChartNoAxesColumn, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';

export const TABS = [
  { id: 'home', label: 'Home', Icon: House },
  { id: 'interview', label: 'Interview', Icon: Briefcase, raised: true },
  { id: 'review', label: 'Review', Icon: Layers },
  { id: 'progress', label: 'Progress', Icon: ChartNoAxesColumn },
  { id: 'account', label: 'Account', Icon: User },
];

// Floating royal pill. The active tab is a cyan circle that slides to the tab you pick, and its icon bounces.
// Interview is the raised tab. Tabs never slide sideways like pages do.
export default function TabBar({ tab, onChange, reviewDue = 0 }) {
  return (
    <nav
      aria-label="Main"
      className="sticky bottom-2 z-10 mt-6 before:absolute before:inset-[-34px_-18px_-20px] before:-z-10 before:bg-app before:content-['']"
    >
      <ul className="grid grid-cols-5 items-end rounded-full bg-royal px-2 pb-1.5 pt-2">
        {TABS.map(({ id, label, Icon, raised }) => {
          const on = tab === id;
          return (
            <li key={id}>
              <button
                onClick={() => onChange(id)}
                aria-current={on ? 'page' : undefined}
                className="relative flex w-full min-h-[56px] flex-col items-center justify-end gap-0.5 rounded-full"
              >
                <span
                  className={cn(
                    'relative grid place-items-center rounded-full',
                    raised ? 'size-[52px] -translate-y-3.5' : 'size-10',
                    raised && !on && 'bg-azure',
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 rounded-full bg-cyan"
                      transition={spring.snappy}
                    />
                  )}
                  <motion.span
                    key={on ? 'on' : 'off'}
                    className={cn('relative', on ? 'text-royal' : 'text-white')}
                    initial={on ? { scale: 0.75 } : false}
                    animate={{ scale: 1 }}
                    transition={spring.bouncy}
                  >
                    <Icon size={raised ? 23 : 21} strokeWidth={2.25} />
                  </motion.span>
                  {id === 'review' && reviewDue > 0 && (
                    <i className="absolute -right-1 -top-0.5 rounded-full bg-orange px-1.5 py-px text-[10px] font-bold not-italic leading-tight text-ink">
                      {reviewDue}
                    </i>
                  )}
                </span>
                <span className={cn('text-[11px] font-bold leading-none', raised && '-mt-3', on ? 'text-white' : 'text-white/75')}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
