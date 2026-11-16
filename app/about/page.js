import { Brain, Repeat, Shuffle, Gauge, MessageCircle, Clock, Target, Flag, CalendarDays, Flame, Gift, Users, BookOpen } from 'lucide-react';
import AboutHeader from '@/components/AboutHeader';
import { ABOUT } from './copy';

export const metadata = {
  title: 'Why it works | Pitchd',
  description: 'The research behind Pitchd: how people remember what they learn and how habits stick.',
};

// One line icon per item, in the same order as the copy
const ICONS = {
  'You answer before you see the answer.': Brain,
  'Missed questions come back.': Repeat,
  'Topics are mixed.': Shuffle,
  "It's a little hard on purpose.": Gauge,
  'Every answer explains why.': MessageCircle,
  'You pick when you practice.': Clock,
  'The ring fills as you go.': Target,
  'Your plan starts with a step done.': Flag,
  'New week, new theme.': CalendarDays,
  'Streaks, with freezes.': Flame,
  "Sometimes there's a bonus.": Gift,
  'Levels, mastery, and your school.': Users,
};

// text between asterisks is italic (journal names and short citations)
function Rich({ text }) {
  return text.split('*').map((part, i) => (i % 2 ? <em key={i}>{part}</em> : <span key={i}>{part}</span>));
}

export default function AboutPage() {
  return (
    <div className="app">
      <AboutHeader />
      <main className="main flex flex-col gap-5 pb-6">
        <header className="rounded-[32px] bg-azure p-6 text-white">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight">{ABOUT.title}</h1>
          <p className="mt-2 text-[15px] font-semibold leading-relaxed">{ABOUT.intro}</p>
        </header>

        {ABOUT.groups.map((g) => (
          <section key={g.name} aria-labelledby={g.name.replace(/\s+/g, '-')}>
            <h2 id={g.name.replace(/\s+/g, '-')} className="mb-3 text-[20px] font-bold tracking-tight">{g.name}</h2>
            <ul className="flex flex-col gap-3">
              {g.items.map((item) => {
                const Icon = ICONS[item.title] || BookOpen;
                return (
                  <li key={item.title} className="rounded-[24px] bg-surface p-5">
                    <span className="grid size-11 place-items-center rounded-full bg-app"><Icon size={20} strokeWidth={2} /></span>
                    <h3 className="mt-3 text-[17px] font-bold leading-snug tracking-tight">{item.title}</h3>
                    <p className="mt-1.5 text-[15px] font-medium leading-relaxed">{item.body}</p>
                    <p className="mt-2.5 text-[12px] font-medium text-muted-foreground"><em>{item.source}</em></p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        <section aria-labelledby="dont">
          <h2 id="dont" className="mb-3 text-[20px] font-bold tracking-tight">What we don't do</h2>
          <ul className="flex flex-col gap-2.5 rounded-[24px] bg-surface p-5">
            {ABOUT.dont.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] font-medium leading-relaxed">
                <i className="mt-2 size-1.5 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                <span><Rich text={line} /></span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="honest" className="rounded-[24px] bg-azure-soft p-5">
          <h2 id="honest" className="text-[20px] font-bold tracking-tight">The honest version</h2>
          <p className="mt-2 text-[15px] font-medium leading-relaxed">{ABOUT.honest}</p>
        </section>

        <section aria-labelledby="sources">
          <h2 id="sources" className="mb-3 text-[20px] font-bold tracking-tight">Sources</h2>
          <ul className="flex flex-col gap-2 text-[12.5px] font-medium leading-relaxed text-muted-foreground">
            {ABOUT.sources.map((s) => <li key={s}><Rich text={s} /></li>)}
          </ul>
        </section>
      </main>
    </div>
  );
}
