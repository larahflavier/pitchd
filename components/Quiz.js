'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { X, Bookmark, Check } from 'lucide-react';
import Mascot from './Mascot';
import Sticker from './ui/Sticker';
import { PRIMARY, SIZE } from './ui/button-styles';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';
import { byId, shuffle, CAT_LABELS } from '@/lib/engine';
import { play } from '@/lib/sound';
import { usePip } from '@/lib/pip';

// Praise the method, not the person.
const RIGHT_LINES = [
  'Good call. That answer fits every detail in the question.',
  'Nice reasoning. You went with the idea, not the buzzword.',
  'Right idea. This is the reasoning interviewers listen for.',
  'Solid. Checking each option against the question works.',
  'That is how to work it out: rule out, then confirm.',
];
const WRONG_LINES = ['Close. This one comes back soon.', 'No worries, I\'ll save it for later.', 'Good to see now, not in the interview.'];

export default function Quiz({ ids, label, onAnswer, onFinish, onClose, reviewIds = [], saved = [], onToggleSave, fromHome = false }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [tap, setTap] = useState({ x: '50%', y: '50%' }); // where the answer was tapped, so the color grows from there
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0); // correct answers in a row this set
  const pip = usePip();
  const reduced = useReducedMotion();
  const nextRef = useRef(null);
  // the backdrop starts as the Home card's royal when we come from Home, then settles to soft azure
  const [settled, setSettled] = useState(!fromHome);
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), 60);
    return () => clearTimeout(t);
  }, [settled]);
  const q = byId[ids[idx]];

  // after you answer, bring the feedback and the Next button into view. Nothing sticks over the explanation.
  const answeredNow = picked !== null;
  useEffect(() => {
    if (!answeredNow) return;
    const f = requestAnimationFrame(() => nextRef.current?.scrollIntoView({ block: 'end', behavior: reduced ? 'auto' : 'smooth' }));
    return () => cancelAnimationFrame(f);
  }, [answeredNow, reduced]);

  const options = useMemo(() => shuffle([q.a, ...q.w]), [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const answered = picked !== null;
  const correct = answered && picked === q.a;

  const choose = (opt, e) => {
    if (answered) return;
    // The tapped answer paints as selected in this same frame (setPicked). Wipes, shakes and Pip come after.
    const r = e?.currentTarget?.getBoundingClientRect?.();
    if (r && e.clientX) setTap({ x: `${((e.clientX - r.left) / r.width) * 100}%`, y: `${((e.clientY - r.top) / r.height) * 100}%` });
    setPicked(opt);
    onAnswer(q.id, opt === q.a);
    // sound and the combo chip come after the answer is saved, so answering stays instant
    const right = opt === q.a;
    const n = right ? combo + 1 : 0;
    setCombo(n);
    play(right ? (n === 5 ? 'combo5' : n === 3 ? 'combo' : 'correct') : 'wrong');
    // Pip reacts after the answer is already marked
    pip.react(right ? (n === 5 ? 'combo5' : n === 3 ? 'combo' : 'correct') : 'wrong');
  };
  const next = () => {
    pip.cancel(); // tapping Next ends any reaction right away
    window.scrollTo({ top: 0, behavior: 'auto' }); // the next question starts at the top
    const r = [...results, { id: q.id, correct }];
    if (idx + 1 >= ids.length) return onFinish(r);
    setResults(r);
    setIdx(idx + 1);
    setPicked(null);
  };

  const line = (correct ? RIGHT_LINES : WRONG_LINES)[(idx + q.id.length) % (correct ? RIGHT_LINES.length : WRONG_LINES.length)];
  const isSaved = saved.includes(q.id);
  const done = idx + (answered ? 1 : 0);

  return (
    <div className="main">
      {/* shared with the Home card: the card grows into this soft azure backdrop */}
      <motion.div
        layoutId="set-card"
        className={'absolute -z-10 transition-colors duration-300 ' + (settled ? 'bg-azure-soft' : 'bg-royal')}
        style={{ left: -18, right: -18, top: 0, bottom: 'calc(-1 * (env(safe-area-inset-bottom) + 12px))', borderRadius: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      />

      {/* top bar: close, one segment per question, count */}
      <div className="mb-8 flex items-center gap-3">
        <button onClick={onClose} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-royal">
          <X size={18} strokeWidth={2.5} />
        </button>
        <div className="flex flex-1 gap-1" role="progressbar" aria-valuemin={0} aria-valuemax={ids.length} aria-valuenow={done}>
          {ids.map((id, i) => (
            <i
              key={id + i}
              className={cn('h-2.5 flex-1 rounded-full transition-colors duration-200', i < done ? 'bg-cyan ring-[1.5px] ring-royal' : 'bg-surface')}
            />
          ))}
        </div>
        <span className="min-w-9 text-right text-sm font-bold tabular-nums text-royal">{idx + 1}/{ids.length}</span>
      </div>

      {/* The question card. Tapping Next sends it flying up (200ms) and the next one scales in underneath. The answers never animate. */}
      <div className="relative">
        <AnimatePresence initial mode="popLayout">
          <motion.div
            key={q.id}
            initial={idx === 0 ? { opacity: 0 } : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1, transition: { duration: 0.2, delay: idx === 0 ? 0.12 : 0 } }}
            exit={{ opacity: 0, y: -70, transition: { duration: 0.2, ease: 'easeIn' } }}
          >
            <div className="relative rounded-[28px] bg-surface px-5 pb-6 pt-7">
              {/* category sticker, top left. Pip and the combo chip sit on the top edge at the right. */}
              <span className="pointer-events-none absolute -top-3.5 left-4"><Sticker variant="bubble" fill="azure" rotate={-4}>{CAT_LABELS[q.cat]}</Sticker></span>
              <div className="absolute -top-9 right-3"><Mascot pose="think" size={58} reactive /></div>
              {combo >= 3 && (
                <motion.span
                  key={combo}
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={spring.bouncy}
                  aria-live="polite"
                  className={cn(
                    'absolute -top-3.5 right-[82px] rounded-full border-2 border-royal bg-cyan font-bold tabular-nums text-royal',
                    combo >= 5 ? 'px-4 py-1.5 text-[15px]' : 'px-3 py-1 text-[13px]',
                  )}
                >
                  {combo} in a row
                </motion.span>
              )}

              <div className="mb-3 flex flex-wrap items-center gap-2">
                {reviewIds.includes(q.id) && <span className="rounded-full bg-orange-soft px-3 py-1 text-xs font-bold text-ink">Review</span>}
                {q.weekly && <span className="rounded-full bg-azure-soft px-3 py-1 text-xs font-bold text-royal">This week</span>}
                {label && !q.weekly && !reviewIds.includes(q.id) && <span className="text-xs font-semibold text-muted-foreground">{label}</span>}
              </div>

              <h1 className="pr-1 text-[24px] font-bold leading-[1.22] tracking-tight">{q.q}</h1>

              {onToggleSave && (
                <button
                  aria-label={isSaved ? 'Remove bookmark' : 'Bookmark this question'}
                  aria-pressed={isSaved}
                  onClick={() => onToggleSave(q.id)}
                  className="absolute bottom-3 right-3 grid size-10 place-items-center rounded-full bg-app text-royal"
                >
                  <Bookmark size={17} strokeWidth={2.25} className={isSaved ? 'fill-royal' : ''} />
                </button>
              )}
            </div>

            {/* answers: tall pills. The tapped one is marked at once; the color wipe and shake come right after. */}
            <div className="mt-4 flex flex-col gap-3">
              {options.map((opt) => {
                const isRight = answered && opt === q.a;
                const isWrongPick = answered && opt === picked && opt !== q.a;
                const isPick = opt === picked;
                return (
                  <button
                    key={opt}
                    onClick={(e) => choose(opt, e)}
                    disabled={answered && !isPick && !isRight}
                    style={{ '--wx': tap.x, '--wy': tap.y }}
                    className={cn(
                      'relative flex min-h-[60px] w-full items-center justify-between gap-3 overflow-hidden rounded-[24px] border-2 bg-surface px-5 py-4 text-left text-[16px] font-bold leading-snug',
                      !answered && 'border-line',
                      isPick && 'border-royal',
                      isRight && 'border-royal bg-cyan-soft',
                      isWrongPick && 'border-red',
                      answered && !isRight && !isPick && 'opacity-55',
                      isWrongPick && 'opt-shake',
                    )}
                  >
                    {/* the result color grows from where you tapped */}
                    {isPick && <span aria-hidden="true" className={cn('opt-wipe absolute inset-0', isRight ? 'bg-cyan-soft' : 'bg-red-soft')} />}
                    <span className="relative">{opt}</span>
                    {isRight && (
                      <span className="relative grid size-7 shrink-0 animate-[pop_0.3s_ease] place-items-center rounded-full bg-cyan text-royal" aria-label="Correct">
                        <Check size={16} strokeWidth={3.25} />
                      </span>
                    )}
                    {isWrongPick && (
                      <span className="relative grid size-7 shrink-0 animate-[pop_0.3s_ease] place-items-center rounded-full bg-red text-white" aria-label="Not quite">
                        <X size={16} strokeWidth={3.25} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {answered && (
              <>
                {/* feedback: cyan-soft with a check, or red-soft with an X. Never color alone. */}
                <div className={cn('mt-4 flex animate-[pop_0.25s_ease] gap-3 rounded-[24px] p-4', correct ? 'bg-cyan-soft' : 'bg-red-soft')}>
                  <span className={cn('grid size-8 shrink-0 place-items-center rounded-full', correct ? 'bg-cyan text-royal' : 'bg-red text-white')}>
                    {correct ? <Check size={17} strokeWidth={3.25} /> : <X size={17} strokeWidth={3.25} />}
                  </span>
                  <div className="min-w-0">
                    <b className="block text-[15px] font-bold leading-snug">{line}</b>
                    <p className="mt-1 text-[14px] font-medium leading-relaxed text-ink/80">{q.e}</p>
                  </div>
                </div>
                <button ref={nextRef} className={`${PRIMARY} ${SIZE.lg} mt-4 w-full scroll-mb-4`} onClick={next}>{idx + 1 >= ids.length ? 'See results' : 'Next'}</button>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
