'use client';
import { useEffect, useRef, useState } from 'react';
import { X, Bookmark, Check, RotateCcw } from 'lucide-react';
import Mascot from './Mascot';
import { cn } from '@/lib/utils';
import { byId, CAT_LABELS } from '@/lib/engine';

const SWIPE = 90; // px to drag before a swipe counts

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const on = (e) => setReduced(e.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}

// One card at a time. Tap to flip. After flipping: swipe right (or "Got it") or swipe left (or "Again").
export default function ReviewDeck({ title, ids, items = null, saved = [], onToggleSave, onGrade, onClose }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState(null); // 'left' | 'right'
  const [tally, setTally] = useState({ got: 0, again: 0 });
  const drag = useRef(null);
  const reduced = usePrefersReducedMotion();
  const done = i >= ids.length;
  const q = done ? null : items ? items.find((x) => x.id === ids[i]) : byId[ids[i]];

  const grade = (got) => {
    if (leaving || !flipped || !q) return;
    onGrade(q.id, got);
    setTally((t) => ({ got: t.got + (got ? 1 : 0), again: t.again + (got ? 0 : 1) }));
    const advance = () => { setI((n) => n + 1); setFlipped(false); setDx(0); setLeaving(null); };
    if (reduced) advance();
    else { setLeaving(got ? 'right' : 'left'); setTimeout(advance, 180); }
  };

  const onDown = (e) => {
    if (leaving) return;
    drag.current = { x: e.clientX, moved: false };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const delta = e.clientX - d.x;
    if (Math.abs(delta) > 6) d.moved = true;
    if (d.moved && flipped) setDx(delta);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (!d.moved) { setFlipped((f) => !f); return; }
    if (flipped && Math.abs(dx) > SWIPE) grade(dx > 0);
    else setDx(0);
  };

  // keyboard: space flips, arrows grade
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT') return;
      if (e.key === ' ') { e.preventDefault(); setFlipped((f) => !f); }
      else if (e.key === 'ArrowRight') grade(true);
      else if (e.key === 'ArrowLeft') grade(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (done) {
    return (
      <div className="main flex flex-col items-center text-center">
        <div className="mt-6"><Mascot mood="happy" size={130} sparkles /></div>
        <h1 className="mt-3 text-[26px] font-bold tracking-tight">{ids.length ? 'Deck done' : 'Nothing here yet'}</h1>
        {ids.length > 0 && (
          <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">
            {tally.got} of {ids.length} got it.{tally.again > 0 && ` ${tally.again} will come back tomorrow.`}
          </p>
        )}
        <button className="mt-6 w-full rounded-full bg-ink py-4 text-base font-semibold text-white active:scale-[0.98]" onClick={onClose}>Done</button>
      </div>
    );
  }

  const isSaved = saved.includes(q.id);
  const shift = leaving === 'right' ? 420 : leaving === 'left' ? -420 : dx;
  const tint = flipped && dx > 40 ? 'border-teal' : flipped && dx < -40 ? 'border-red' : 'border-line';

  return (
    <div className="main flex flex-col" key={q.id}>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={onClose} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface">
          <X size={18} strokeWidth={2.25} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ink transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(i / ids.length) * 100}%` }} />
        </div>
        <span className="min-w-9 text-right text-sm font-bold text-muted-foreground">{i + 1}/{ids.length}</span>
      </div>
      <p className="mb-3 text-[13px] font-bold text-muted-foreground">{title}</p>

      {/* the card */}
      <div
        role="button"
        tabIndex={0}
        aria-label={flipped ? 'Card back. Tap to flip.' : 'Card front. Tap to flip.'}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={() => { drag.current = null; setDx(0); }}
        className="relative h-[360px] select-none [perspective:1200px]"
        style={{
          touchAction: 'pan-y',
          transform: `translateX(${shift}px) rotate(${shift / 25}deg)`,
          opacity: leaving ? 0 : 1,
          transition: drag.current?.moved && !leaving ? 'none' : reduced ? 'none' : 'transform 180ms ease, opacity 180ms ease',
        }}
      >
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-300 [transform-style:preserve-3d] motion-reduce:transition-none',
            flipped && '[transform:rotateY(180deg)]',
          )}
        >
          {/* front */}
          <div className={cn('absolute inset-0 flex flex-col overflow-auto rounded-[32px] border-2 bg-surface p-6 [-webkit-backface-visibility:hidden] [backface-visibility:hidden]', tint)}>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-periwinkle-soft px-3 py-1 text-xs font-bold">{CAT_LABELS[q.cat]}</span>
              {onToggleSave && (
                <button
                  aria-label={isSaved ? 'Remove bookmark' : 'Bookmark'}
                  aria-pressed={isSaved}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerUp={(e) => e.stopPropagation()}
                  onClick={() => onToggleSave(q.id)}
                  className="grid size-9 place-items-center rounded-full bg-app"
                >
                  <Bookmark size={17} strokeWidth={2.25} className={isSaved ? 'fill-ink' : ''} />
                </button>
              )}
            </div>
            <p className="my-auto py-4 text-[22px] font-bold leading-snug tracking-tight">{q.q}</p>
            <p className="text-center text-[13px] font-semibold text-muted-foreground">Tap to flip</p>
          </div>

          {/* back */}
          <div className={cn('absolute inset-0 flex flex-col overflow-auto rounded-[32px] border-2 bg-surface p-6 [transform:rotateY(180deg)] [-webkit-backface-visibility:hidden] [backface-visibility:hidden]', tint)}>
            <span className="self-start rounded-full bg-teal-soft px-3 py-1 text-xs font-bold">Answer</span>
            <p className="mt-3 whitespace-pre-line text-[19px] font-bold leading-snug tracking-tight">{q.a}</p>
            {q.e && <p className="mt-3 text-[15px] font-medium leading-relaxed text-muted-foreground">{q.e}</p>}
            {Array.isArray(q.keyPoints) && q.keyPoints.length > 0 && (
              <ul className="mt-3 list-disc pl-5 text-[14px] font-medium text-muted-foreground">
                {q.keyPoints.map((k) => <li key={k}>{k}</li>)}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="mt-5 min-h-[56px]">
        {flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => grade(false)} className="inline-flex items-center justify-center gap-2 rounded-full bg-red-soft py-4 text-base font-semibold text-red active:scale-[0.98]">
              <RotateCcw size={18} strokeWidth={2.25} />Again
            </button>
            <button onClick={() => grade(true)} className="inline-flex items-center justify-center gap-2 rounded-full bg-ink py-4 text-base font-semibold text-white active:scale-[0.98]">
              <Check size={18} strokeWidth={2.5} />Got it
            </button>
          </div>
        ) : (
          <button onClick={() => setFlipped(true)} className="w-full rounded-full bg-ink py-4 text-base font-semibold text-white active:scale-[0.98]">Show answer</button>
        )}
        {flipped && <p className="mt-2.5 text-center text-[13px] font-medium text-muted-foreground">Swipe right for Got it, left for Again</p>}
      </div>
    </div>
  );
}
