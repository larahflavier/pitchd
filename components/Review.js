'use client';
import { useState } from 'react';
import { RotateCcw, XCircle, Bookmark, NotebookPen, LayoutGrid, ChevronRight, Lock, Trophy, CalendarDays, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import Stagger from './ui/Stagger';
import PeekEyes from './ui/PeekEyes';
import { PRIMARY, SIZE } from './ui/button-styles';
import { CAT_LABELS, byId, quizCatsFor, deckIds, forecast, fixedCount, loopCards, mastery, answeredByCat, todayStr } from '@/lib/engine';

function DeckRow({ Icon, title, sub, count, onClick, disabled, tone = 'bg-app' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn('flex w-full items-center gap-3 rounded-[24px] bg-surface p-4 text-left', disabled && 'opacity-60')}
    >
      <span className={cn('grid size-12 shrink-0 place-items-center rounded-full text-royal', tone)}><Icon size={21} strokeWidth={2} /></span>
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold">{title}</span>
        <span className="block text-[13px] font-medium text-muted-foreground">{sub}</span>
      </span>
      {count !== undefined && <span className="text-lg font-bold tabular-nums">{count}</span>}
      {!disabled && <ChevronRight size={18} strokeWidth={2.25} className="text-muted-foreground" />}
    </button>
  );
}

const dueLabel = (d, t) => {
  if (!d || d <= t) return 'Due now';
  const diff = Math.round((new Date(d + 'T00:00:00') - new Date(t + 'T00:00:00')) / 86400000);
  return diff === 1 ? 'Tomorrow' : `In ${diff} days`;
};

export default function Review({ st, onOpenDeck }) {
  const t = todayStr();
  const [cat, setCat] = useState('all'); // category filter for the Missed list
  const due = deckIds(st, 'due').length;
  const saved = deckIds(st, 'saved').length;
  const stories = st.interview.stories.length;
  const mastered = fixedCount(st);
  const missedAll = loopCards(st);
  const days = forecast(st, 7);
  const tomorrow = days[0].count;
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const m = mastery(st);
  const cats = quizCatsFor(st.track);
  const seen = answeredByCat(st);

  // Missed list: every card still in review, filterable by category
  const missedCats = [...new Set(missedAll.map((c) => byId[c.id].cat))];
  const activeCat = missedCats.includes(cat) ? cat : 'all'; // a filter that empties out falls back to All
  const missed = activeCat === 'all' ? missedAll : missedAll.filter((c) => byId[c.id].cat === activeCat);

  return (
    <Stagger className="main flex flex-col gap-4">
      <h1 className="text-[30px] font-bold leading-none tracking-tight">Review</h1>

      {/* the due cards, as a deck */}
      <section className="relative pt-6">
        {due > 0 && (
          <>
            <i aria-hidden="true" className="absolute inset-x-5 top-0.5 h-[calc(100%-20px)] -rotate-3 rounded-[32px] bg-azure-soft" />
            <i aria-hidden="true" className="absolute inset-x-2.5 top-3 h-[calc(100%-22px)] rotate-2 rounded-[32px] bg-cyan" />
          </>
        )}
        <div className="relative rounded-[32px] bg-royal p-5 text-white">
          <PeekEyes />
          <p className="text-[13px] font-bold text-white/80">Due today</p>
          <div className="mt-1 flex items-end gap-3">
            <span className="text-[64px] font-bold leading-none tabular-nums">{due}</span>
            <span className="pb-2 text-[17px] font-bold">{due === 1 ? 'card' : 'cards'}</span>
          </div>
          {due > 0 ? (
            <>
              <p className="mt-1 text-sm font-medium text-white/85">Flip each one, then swipe right for Got it or left for Again.</p>
              <button className={`${PRIMARY} ${SIZE.lg} mt-4 w-full`} onClick={() => onOpenDeck('due')}>
                <RotateCcw size={18} strokeWidth={2.5} />Start review
              </button>
            </>
          ) : (
            <p className="mt-2 text-sm font-medium text-white/85">Nothing due right now. Miss a question and it comes back here.</p>
          )}
        </div>
      </section>

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[['Mastered', mastered], ['In review', missedAll.length], ['Due tomorrow', tomorrow]].map(([label, n]) => (
          <div key={label} className="rounded-[24px] bg-surface px-3.5 py-3">
            <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
            <b className="text-2xl font-bold tabular-nums tracking-tight">{n}</b>
          </div>
        ))}
      </div>

      {/* other decks */}
      <section className="flex flex-col gap-2.5">
        <DeckRow Icon={Bookmark} tone="bg-azure-soft" title="Saved" sub="Questions you bookmarked" count={saved} disabled={!saved} onClick={() => onOpenDeck('saved')} />
        <DeckRow Icon={NotebookPen} title="My stories" sub={stories ? 'Practice telling your STAR stories' : 'Write STAR stories in Interview'} count={stories} disabled={!stories} onClick={() => onOpenDeck('stories')} />
      </section>

      {/* missed list, filterable by category */}
      <section className="rounded-[28px] bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold"><XCircle size={18} strokeWidth={2} />Missed</h2>
          <span className="text-[13px] font-bold tabular-nums text-muted-foreground">{missedAll.length} {missedAll.length === 1 ? 'card' : 'cards'}</span>
        </div>
        {missedAll.length === 0 ? (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Check size={16} strokeWidth={2.5} className="text-royal" />Nothing missed right now. Questions you get wrong show up here.
          </p>
        ) : (
          <>
            <div className="-mx-5 mt-3 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex gap-2">
                {['all', ...missedCats].map((c) => {
                  const n = c === 'all' ? missedAll.length : missedAll.filter((x) => byId[x.id].cat === c).length;
                  const on = activeCat === c;
                  return (
                    <button
                      key={c}
                      onClick={() => setCat(c)}
                      aria-pressed={on}
                      className={cn('shrink-0 rounded-full border-2 px-3.5 py-2 text-[13px] font-bold', on ? 'border-royal bg-azure-soft text-royal' : 'border-line text-muted-foreground')}
                    >
                      {c === 'all' ? 'All' : CAT_LABELS[c]} <span className="tabular-nums">{n}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <ul className="mt-3 flex flex-col divide-y divide-line">
              {missed.map((c) => (
                <li key={c.id} className="flex items-start justify-between gap-3 py-3">
                  <span className="min-w-0">
                    <span className="line-clamp-2 block text-[14px] font-semibold leading-snug">{byId[c.id].q}</span>
                    <span className="mt-0.5 block text-[12px] font-medium text-muted-foreground">{CAT_LABELS[byId[c.id].cat]}</span>
                  </span>
                  <span className={cn('shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold', c.due && c.due <= t ? 'bg-orange text-ink' : 'bg-app text-muted-foreground')}>{dueLabel(c.due, t)}</span>
                </li>
              ))}
            </ul>
            <button className={`${PRIMARY} ${SIZE.md} mt-3 w-full`} onClick={() => onOpenDeck('missed', activeCat === 'all' ? undefined : activeCat)}>
              Study {activeCat === 'all' ? 'these' : CAT_LABELS[activeCat]}
            </button>
          </>
        )}
      </section>

      {/* premium category decks */}
      <section className="rounded-[28px] bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold"><LayoutGrid size={18} strokeWidth={2} />By category</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-azure-soft px-2.5 py-1 text-[11px] font-bold text-royal">
            <Lock size={11} strokeWidth={2.5} />Premium
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {cats.map((c) => (
            <li key={c} className="flex items-center justify-between text-[14px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-2"><Lock size={13} strokeWidth={2.25} />{CAT_LABELS[c]}</span>
              <span className="tabular-nums">{seen[c] || 0} cards</span>
            </li>
          ))}
        </ul>
      </section>

      {/* forecast */}
      <section className="rounded-[28px] bg-surface p-5">
        <h2 className="flex items-center gap-2 text-base font-bold"><CalendarDays size={18} strokeWidth={2} />Coming up</h2>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          {tomorrow === 0 ? 'No cards due tomorrow.' : `${tomorrow} ${tomorrow === 1 ? 'card' : 'cards'} due tomorrow.`}
        </p>
        <div className="mt-4 flex items-end justify-between gap-2">
          {days.map((d) => {
            const [y, mo, da] = d.date.split('-').map(Number);
            const lbl = new Date(y, mo - 1, da).toLocaleDateString('en-US', { weekday: 'short' });
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="text-xs font-bold tabular-nums">{d.count || ''}</span>
                <div className="flex h-16 w-full items-end">
                  <i className={cn('block w-full rounded-lg', d.count ? 'bg-azure' : 'bg-line')} style={{ height: d.count ? `${Math.max(12, (d.count / maxDay) * 100)}%` : '6px' }} />
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground">{lbl}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* accuracy */}
      <section className="rounded-[28px] bg-surface p-5">
        <h2 className="flex items-center gap-2 text-base font-bold"><Trophy size={18} strokeWidth={2} />Accuracy by category</h2>
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
          Missed cards return after 1, 3, 7, 14, then 30 days. Pass the 30-day review and the card is mastered. "Again" sends it back to day 1.
        </p>
      </section>
    </Stagger>
  );
}
