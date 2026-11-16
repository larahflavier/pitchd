'use client';
import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Bookmark } from 'lucide-react';
import Mascot from './Mascot';
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
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0); // correct answers in a row this set
  const pip = usePip();
  // the backdrop starts as the Home card's azure when we come from Home, then settles to the page color
  const [settled, setSettled] = useState(!fromHome);
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), 60);
    return () => clearTimeout(t);
  }, [settled]);
  const q = byId[ids[idx]];

  const options = useMemo(() => shuffle([q.a, ...q.w]), [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const answered = picked !== null;
  const correct = answered && picked === q.a;

  const choose = (opt) => {
    if (answered) return;
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
    const r = [...results, { id: q.id, correct }];
    if (idx + 1 >= ids.length) return onFinish(r);
    setResults(r);
    setIdx(idx + 1);
    setPicked(null);
  };

  const line = (correct ? RIGHT_LINES : WRONG_LINES)[(idx + q.id.length) % (correct ? RIGHT_LINES.length : WRONG_LINES.length)];

  return (
    <div className="main">
      {/* shared with the Home card: the card grows into this backdrop */}
      <motion.div
        layoutId="set-card"
        className={'absolute -z-10 transition-colors duration-300 ' + (settled ? 'bg-app' : 'bg-azure')}
        style={{ left: -18, right: -18, top: 0, bottom: 'calc(-1 * (env(safe-area-inset-bottom) + 12px))', borderRadius: 0 }}
        transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
      />
      <div className="qtop">
        <button className="x" onClick={onClose} aria-label="Close"><X size={18} strokeWidth={2.25} /></button>
        <div className="bar"><i style={{ width: `${((idx + (answered ? 1 : 0)) / ids.length) * 100}%` }} /></div>
        <div className="count">{idx + 1}/{ids.length}</div>
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
      <div className="flex items-start justify-between gap-3">
       <div className="min-w-0 flex-1">
        <span className="chip">{CAT_LABELS[q.cat]}</span>
        {reviewIds.includes(q.id) && <span className="chip review">Review</span>}
        {q.weekly && <span className="chip">This week</span>}
        {label && !q.weekly && !reviewIds.includes(q.id) && <span className="hint">{label}</span>}
        {onToggleSave && (
          <button
            aria-label={saved.includes(q.id) ? 'Remove bookmark' : 'Bookmark this question'}
            aria-pressed={saved.includes(q.id)}
            onClick={() => onToggleSave(q.id)}
            className="float-right grid size-9 place-items-center rounded-full border border-line bg-surface"
          >
            <Bookmark size={16} strokeWidth={2.25} className={saved.includes(q.id) ? 'fill-ink' : ''} />
          </button>
        )}
       </div>
       {/* Pip watches the question and reacts to your answer. Small, so it never covers the options. */}
       <div className="-mt-1 shrink-0"><Mascot pose="think" size={56} reactive /></div>
      </div>

      <div className="qtext">{q.q}</div>

      {options.map((opt) => {
        let cls = 'opt';
        if (answered) {
          if (opt === q.a) cls += ' right';
          else if (opt === picked) cls += ' wrong';
          else cls += ' dim';
        }
        return (
          <button key={opt} className={cls} onClick={() => choose(opt)} disabled={answered && opt !== picked && opt !== q.a}>
            {opt}
          </button>
        );
      })}

      {answered && (
        <>
          <div className="explain">
            <div className="fbrow">
              <div>
                {correct && combo >= 3 && (
                  <span className={'combo' + (combo >= 5 ? ' combo-big' : '')} aria-live="polite">{combo} in a row</span>
                )}
                <b className={correct ? 'ok' : 'no'}>{line}</b>
                <div style={{ marginTop: 4 }}>{q.e}</div>
              </div>
            </div>
          </div>
          <button className="btn" onClick={next}>{idx + 1 >= ids.length ? 'See results' : 'Next'}</button>
        </>
      )}
        </motion.div>
       </AnimatePresence>
      </div>
    </div>
  );
}
