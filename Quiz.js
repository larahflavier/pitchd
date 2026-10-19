'use client';
import { useMemo, useState } from 'react';
import Mascot from './Mascot';
import { byId, shuffle, CAT_LABELS } from '../lib/engine';

const RIGHT_LINES = ['Nice one!', 'That\'s it!', 'Locked in.', 'Correct!', 'You got it.'];
const WRONG_LINES = ['Close. This one comes back soon.', 'No worries, I\'ll save it for later.', 'Good to see now, not in the interview.'];

export default function Quiz({ ids, label, onAnswer, onFinish, onClose, reviewIds = [] }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [results, setResults] = useState([]);
  const q = byId[ids[idx]];

  const options = useMemo(() => shuffle([q.a, ...q.w]), [q.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const answered = picked !== null;
  const correct = answered && picked === q.a;

  const choose = (opt) => {
    if (answered) return;
    setPicked(opt);
    onAnswer(q.id, opt === q.a);
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
        <button className="x" onClick={onClose} aria-label="Close">✕</button>
        <div className="bar"><i style={{ width: `${((idx + (answered ? 1 : 0)) / ids.length) * 100}%` }} /></div>
        <div className="count">{idx + 1}/{ids.length}</div>
      </div>

      <div>
        <span className="chip">{CAT_LABELS[q.cat]}</span>
        {reviewIds.includes(q.id) && <span className="chip review">Review</span>}
        {q.weekly && <span className="chip">This week</span>}
        {label && !q.weekly && !reviewIds.includes(q.id) && <span className="hint">{label}</span>}
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
