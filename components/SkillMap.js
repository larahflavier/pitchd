'use client';
import { MessagesSquare, BookOpen, Newspaper, Calculator, Megaphone, Truck, Users } from 'lucide-react';
import { byId, CAT_LABELS, SHARED } from '@/lib/engine';

const ICONS = {
  behavioral: MessagesSquare, basics: BookOpen, news: Newspaper,
  accounting: Calculator, marketing: Megaphone, supplychain: Truck, management: Users,
};

// Topic tiles that fill in as cards are mastered. A card is mastered after its 30-day review.
// A topic is a category for now.
export default function SkillMap({ st }) {
  const total = {};
  for (const q of Object.values(byId)) if (!q.weekly) total[q.cat] = (total[q.cat] || 0) + 1;
  const mastered = {};
  for (const [id, c] of Object.entries(st.cards)) {
    if (c.fixed && byId[id]) mastered[byId[id].cat] = (mastered[byId[id].cat] || 0) + 1;
  }
  const cats = [...SHARED, st.track];
  return (
    <section className="mb-3.5">
      <h2 className="mb-2.5 text-base font-bold">Skill map</h2>
      <ul className="grid grid-cols-2 gap-2.5">
        {cats.map((c) => {
          const Icon = ICONS[c];
          const n = mastered[c] || 0;
          const t = total[c] || 1;
          const pct = Math.round((n / t) * 100);
          return (
            <li key={c} className="relative overflow-hidden rounded-[24px] bg-surface p-4">
              <i className="absolute inset-x-0 bottom-0 bg-periwinkle-soft transition-[height] duration-500" style={{ height: `${pct}%` }} />
              <div className="relative">
                <span className="grid size-10 place-items-center rounded-full bg-app"><Icon size={19} strokeWidth={2} /></span>
                <p className="mt-2.5 text-[14px] font-bold">{CAT_LABELS[c]}</p>
                <p className="text-[12px] font-medium text-muted-foreground">{n} of {t} mastered</p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
