'use client';
import { useMemo, useState } from 'react';
import { X, Bookmark } from 'lucide-react';
import Mascot from './Mascot';
import { byId, shuffle, CAT_LABELS } from '@/lib/engine';
import { play } from '@/lib/sound';

// Praise the method, not the person.
const RIGHT_LINES = [
  'Good call. That answer fits every detail in the question.',
  'Nice reasoning. You went with the idea, not the buzzword.',
  'Right idea. This is the reasoning interviewers listen for.',
  'Solid. Checking each option against the question works.',
  'That is how to work it out: rule out, then confirm.',
];
const WRONG_LINES = ['Close. This one comes back soon.', 'No worries, I\'ll save it for later.', 'Good to see now, not in the interview.'];

export default function Quiz({ ids, label, onAnswer, onFinish, onClose, reviewIds = [], saved = [], onToggleSave }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const [combo, setCombo] = useState(0); // correct answers in a row this set
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
  };
  const next = () => {
    const r = [...results, { id: q.id, correct }];
    if (idx + 1 >= ids.length) return onFinish(r);
    setResults(r);
    setIdx(idx + 1);
    setPicked(null);
  };

  const line = (correct ? RIGHT_LINES : WRONG_LINES)[(idx + q.id.length) % (correct ? RIGHT_LINES.length : WRONG_LINES.length)];

  return (
    <div className="main" key={q.id}>
      <div className="qtop">
        <button className="x" onClick={onClose} aria-label="Close"><X size={18} strokeWidth={2.25} /></button>
        <div className="bar"><i style={{ width: `${((idx + (answered ? 1 : 0)) / ids.length) * 100}%` }} /></div>
        <div className="count">{idx + 1}/{ids.length}</div>
      </div>

      <div>
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
              <Mascot mood={correct ? 'happy' : 'oops'} size={64} />
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
    </div>
  );
}
