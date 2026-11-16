'use client';
import { MessagesSquare, BookOpen, Newspaper, Calculator, Megaphone, Truck, Users, Landmark, Cog, Cpu, Factory, Wrench } from 'lucide-react';
import PeekEyes from './ui/PeekEyes';
import { cn } from '@/lib/utils';
import { byId, CAT_LABELS, quizCatsFor, questionsFor } from '@/lib/engine';

const ICONS = {
  behavioral: MessagesSquare, basics: BookOpen, news: Newspaper,
  accounting: Calculator, marketing: Megaphone, supplychain: Truck, management: Users,
  finance: Landmark, mechanical: Cog, electrical: Cpu, industrial: Factory, engfund: Wrench,
};

// Each tile starts as a soft color and fills with its loud color, from the bottom, as cards are mastered.
// The labels sit on white pills so they read the same at any fill level.
const TONES = [
  { soft: 'bg-azure-soft', loud: 'bg-azure' },
  { soft: 'bg-cyan-soft', loud: 'bg-cyan' },
  { soft: 'bg-azure-soft', loud: 'bg-royal' },
  { soft: 'bg-cyan-soft', loud: 'bg-azure' },
  { soft: 'bg-azure-soft', loud: 'bg-cyan' },
];

// A card is mastered after its 30-day review. A topic is a category for now.
export default function SkillMap({ st }) {
  const mastered = {};
  for (const [id, c] of Object.entries(st.cards)) {
    if (c.fixed && byId[id]) mastered[byId[id].cat] = (mastered[byId[id].cat] || 0) + 1;
  }
  const cats = quizCatsFor(st.track);
  return (
    <section>
      <h2 className="mb-4 text-[20px] font-bold tracking-tight">Skill map</h2>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-5 pt-1">
        {cats.map((c, i) => {
          const Icon = ICONS[c] || BookOpen;
          const tone = TONES[i % TONES.length];
          const n = mastered[c] || 0;
          const t = questionsFor(c, st.track).length || 1;
          const pct = Math.round((n / t) * 100);
          return (
            <li key={c} className={cn('relative h-[136px] rounded-[24px]', tone.soft)}>
              <PeekEyes size={18} />
              {/* the fill, clipped to the tile's rounded corners */}
              <div className="absolute inset-0 overflow-hidden rounded-[24px]" aria-hidden="true">
                <i className={cn('absolute inset-x-0 bottom-0 transition-[height] duration-500 motion-reduce:transition-none', tone.loud)} style={{ height: `${pct}%` }} />
              </div>
              <div className="relative flex h-full flex-col justify-between p-3.5">
                <span className="grid size-10 place-items-center rounded-full bg-surface text-royal"><Icon size={19} strokeWidth={2} /></span>
                <div className="flex flex-col items-start gap-1">
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[13px] font-bold leading-none text-royal">{CAT_LABELS[c]}</span>
                  <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold leading-none tabular-nums text-royal">{n} of {t} mastered</span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
