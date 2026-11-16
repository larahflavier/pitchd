'use client';
import { RotateCcw, XCircle, Bookmark, NotebookPen, LayoutGrid, ChevronRight, Lock, Trophy, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CAT_LABELS, quizCatsFor, deckIds, forecast, fixedCount, loopCards, mastery, answeredByCat } from '@/lib/engine';

function DeckRow({ Icon, title, sub, count, onClick, disabled, premium, tone = 'bg-app' }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-3 rounded-[24px] bg-surface p-4 text-left active:scale-[0.99]',
        disabled && 'opacity-60',
      )}
    >
      <span className={cn('grid size-12 shrink-0 place-items-center rounded-full', tone)}><Icon size={21} strokeWidth={2} /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-base font-bold">
          {title}
          {premium && (
            <span className="inline-flex items-center gap-1 rounded-full bg-periwinkle-soft px-2 py-0.5 text-[11px] font-bold">
              <Lock size={11} strokeWidth={2.5} />Premium
            </span>
          )}
        </span>
        <span className="block text-[13px] font-medium text-muted-foreground">{sub}</span>
      </span>
      {count !== undefined && <span className="text-lg font-bold">{count}</span>}
      {!disabled && <ChevronRight size={18} strokeWidth={2.25} className="text-muted-foreground" />}
    </button>
  );
}

export default function Review({ st, onOpenDeck }) {
  const due = deckIds(st, 'due').length;
  const missed = deckIds(st, 'missed').length;
  const saved = deckIds(st, 'saved').length;
  const stories = st.interview.stories.length;
  const mastered = fixedCount(st);
  const inReview = loopCards(st).length;
  const days = forecast(st, 7);
  const tomorrow = days[0].count;
  const maxDay = Math.max(1, ...days.map((d) => d.count));
  const m = mastery(st);
  const cats = quizCatsFor(st.track);
  const seen = answeredByCat(st);

  return (
    <div className="main flex flex-col gap-4">
      <h1 className="text-[22px] font-bold tracking-tight">Review</h1>

      {/* stats */}
      <div className="grid grid-cols-3 gap-2.5">
        {[['Mastered', mastered], ['In review', inReview], ['Due tomorrow', tomorrow]].map(([label, n]) => (
          <div key={label} className="rounded-[24px] bg-surface px-3.5 py-3">
            <span className="block text-xs font-semibold text-muted-foreground">{label}</span>
            <b className="text-2xl font-bold tracking-tight">{n}</b>
          </div>
        ))}
      </div>

      {/* decks */}
      <section className="flex flex-col gap-2.5">
        <DeckRow Icon={RotateCcw} tone="bg-orange-soft" title="Due today" sub={due ? 'Flip through what is ready' : 'Nothing due right now'} count={due} disabled={!due} onClick={() => onOpenDeck('due')} />
        <DeckRow Icon={XCircle} tone="bg-red-soft" title="Missed" sub="Everything you got wrong, still in review" count={missed} disabled={!missed} onClick={() => onOpenDeck('missed')} />
        <DeckRow Icon={Bookmark} tone="bg-periwinkle-soft" title="Saved" sub="Questions you bookmarked" count={saved} disabled={!saved} onClick={() => onOpenDeck('saved')} />
        <DeckRow Icon={NotebookPen} title="My stories" sub={stories ? 'Practice telling your STAR stories' : 'Write STAR stories in Interview'} count={stories} disabled={!stories} onClick={() => onOpenDeck('stories')} />
      </section>

      {/* premium category decks */}
      <section className="rounded-[28px] bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-base font-bold"><LayoutGrid size={18} strokeWidth={2} />By category</h2>
          <span className="inline-flex items-center gap-1 rounded-full bg-periwinkle-soft px-2.5 py-1 text-[11px] font-bold">
            <Lock size={11} strokeWidth={2.5} />Premium
          </span>
        </div>
        <ul className="mt-3 flex flex-col gap-2">
          {cats.map((c) => (
            <li key={c} className="flex items-center justify-between text-[14px] font-semibold text-muted-foreground">
              <span className="flex items-center gap-2"><Lock size={13} strokeWidth={2.25} />{CAT_LABELS[c]}</span>
              <span>{seen[c] || 0} cards</span>
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
                <span className="text-xs font-bold">{d.count || ''}</span>
                <div className="flex h-16 w-full items-end">
                  <i className={cn('block w-full rounded-lg', d.count ? 'bg-periwinkle-strong' : 'bg-line')} style={{ height: d.count ? `${Math.max(12, (d.count / maxDay) * 100)}%` : '6px' }} />
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
                  <span className="text-muted-foreground">{v ? `${v.pct}%` : '--'}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-line">
                  <i className="block h-full rounded-full bg-teal" style={{ width: `${v?.pct ?? 0}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-[13px] font-medium text-muted-foreground">
          Missed cards return after 1, 3, 7, 14, then 30 days. Pass the 30-day review and the card is mastered. "Again" sends it back to day 1.
        </p>
      </section>
    </div>
  );
}
