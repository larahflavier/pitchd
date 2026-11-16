'use client';
import { useEffect, useState } from 'react';
import { X, Clock, Check, Lock } from 'lucide-react';
import Mascot from './Mascot';
import { cn } from '@/lib/utils';
import { CAT_LABELS } from '@/lib/engine';
import { scoreItem } from '@/lib/interview';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';

const PILL = `${PRIMARY} ${SIZE.lg} w-full`;
const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;
const RATINGS = [
  { id: 'nailed', label: 'Nailed it' },
  { id: 'partly', label: 'Partly' },
  { id: 'missed', label: 'Missed it' },
];

// Runs a list of questions: type an answer, then check yourself against the model answer.
// seconds > 0 adds a countdown per answer (mock interviews). No AI, nothing is graded for you.
export default function InterviewSession({ title, items, seconds = 0, onFinish, onExit }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState('answer'); // answer | check
  const [text, setText] = useState('');
  const [answers, setAnswers] = useState([]);
  const [marks, setMarks] = useState([]);
  const [left, setLeft] = useState(seconds);
  const [entry, setEntry] = useState(null);
  const item = items[idx];
  const mark = marks[idx] || { ticked: [], rating: null };

  useEffect(() => {
    if (!seconds || phase !== 'answer') return;
    const t = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(t);
  }, [seconds, phase, idx]);
  useEffect(() => {
    if (seconds && phase === 'answer' && left <= 0) setPhase('check');
  }, [left, phase, seconds]);

  const setMark = (patch) => setMarks((m) => { const n = [...m]; n[idx] = { ...mark, ...patch }; return n; });
  const toggle = (i) => setMark({ ticked: mark.ticked.includes(i) ? mark.ticked.filter((x) => x !== i) : [...mark.ticked, i] });

  const next = () => {
    const nm = [...marks]; nm[idx] = mark;
    const na = [...answers]; na[idx] = text;
    if (idx + 1 >= items.length) {
      setEntry(onFinish(nm));
      return;
    }
    setMarks(nm); setAnswers(na);
    setIdx(idx + 1); setPhase('answer'); setText(''); setLeft(seconds);
  };

  const exit = () => {
    if (entry || (idx === 0 && phase === 'answer' && !text) || window.confirm('Leave this session? Your answers will not be saved.')) onExit();
  };

  /* ---- results ---- */
  if (entry) {
    return (
      <div className="main flex flex-col">
        <div className="flex flex-col items-center text-center">
          <Mascot mood={entry.score >= 60 ? 'happy' : 'neutral'} size={110} sparkles={entry.score >= 60} />
          <h1 className="mt-2 text-[44px] font-bold leading-none tracking-tight">{entry.score}%</h1>
          <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">Your own self-check score. {title} is saved to History.</p>
        </div>
        <ul className="mt-5 flex flex-col gap-2">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-start justify-between gap-3 rounded-[20px] bg-surface p-4">
              <span>
                <span className="block text-[12px] font-bold text-muted-foreground">{CAT_LABELS[it.cat] || it.cat}</span>
                <span className="block text-[14px] font-semibold leading-snug">{it.q}</span>
              </span>
              <span className="shrink-0 rounded-full bg-app px-2.5 py-1 text-[13px] font-bold">{Math.round(entry.items[i].score * 100)}%</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-center gap-3 rounded-[20px] bg-periwinkle-soft p-4">
          <Lock size={18} strokeWidth={2.25} className="shrink-0" />
          <span className="flex-1 text-[14px] font-semibold">AI feedback on every answer</span>
          <span className="rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold">Premium</span>
        </div>
        <button className={cn(PILL, 'mt-5')} onClick={onExit}>Done</button>
      </div>
    );
  }

  const needsRating = !item.keyPoints;
  const canNext = !needsRating || !!mark.rating;
  const last = idx + 1 >= items.length;
  const timedOut = seconds > 0 && left <= 0;
  const pts = item.keyPoints ? `${mark.ticked.length}/${item.keyPoints.length}` : null;

  return (
    <div className="main flex flex-col" key={idx}>
      <div className="mb-4 flex items-center gap-3">
        <button onClick={exit} aria-label="Close" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface">
          <X size={18} strokeWidth={2.25} />
        </button>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-ink transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${((idx + (phase === 'check' ? 1 : 0)) / items.length) * 100}%` }} />
        </div>
        <span className="min-w-9 text-right text-sm font-bold text-muted-foreground">{idx + 1}/{items.length}</span>
      </div>

      <div className="mb-3 flex items-center justify-between">
        <span className="rounded-full bg-periwinkle-soft px-3 py-1 text-xs font-bold">{CAT_LABELS[item.cat] || item.cat}</span>
        {seconds > 0 && phase === 'answer' && (
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-bold', left <= 15 ? 'bg-red-soft text-red' : 'bg-surface')} role="timer">
            <Clock size={14} strokeWidth={2.25} />{fmt(left)}
          </span>
        )}
        {timedOut && phase === 'check' && <span className="rounded-full bg-orange-soft px-3 py-1 text-[13px] font-bold">Time's up</span>}
      </div>

      <h1 className="text-[22px] font-bold leading-snug tracking-tight">{item.q}</h1>

      {phase === 'answer' ? (
        <>
          <textarea
            className="mt-4 min-h-[180px] w-full resize-none rounded-[20px] border-2 border-line bg-surface p-4 text-base font-medium outline-none focus:border-ink"
            placeholder="Type your answer as you would say it"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button className={cn(PILL, 'mt-4')} onClick={() => setPhase('check')}>Check my answer</button>
        </>
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {text.trim() && (
            <div className="rounded-[20px] bg-surface p-4">
              <p className="text-xs font-bold text-muted-foreground">Your answer</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] font-medium leading-relaxed">{text}</p>
            </div>
          )}
          <div className="rounded-[20px] bg-teal-soft p-4">
            <p className="text-xs font-bold text-ink/70">Model answer</p>
            <p className="mt-1 whitespace-pre-wrap text-[15px] font-semibold leading-relaxed">{item.model}</p>
            {item.explanation && <p className="mt-2 text-[14px] font-medium leading-relaxed text-ink/70">{item.explanation}</p>}
          </div>

          {item.keyPoints ? (
            <div className="rounded-[20px] bg-surface p-4">
              <div className="flex items-center justify-between">
                <p className="text-[15px] font-bold">Tick what you covered</p>
                <span className="text-[13px] font-bold text-muted-foreground">{pts}</span>
              </div>
              <ul className="mt-2 flex flex-col gap-2">
                {item.keyPoints.map((k, i) => {
                  const on = mark.ticked.includes(i);
                  return (
                    <li key={k}>
                      <button
                        onClick={() => toggle(i)}
                        aria-pressed={on}
                        className={cn('flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left text-[14px] font-semibold', on ? 'border-teal bg-teal-soft' : 'border-line')}
                      >
                        <span className={cn('mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2', on ? 'border-royal bg-cyan text-royal' : 'border-line')}>
                          {on && <Check size={13} strokeWidth={3.5} />}
                        </span>
                        {k}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="rounded-[20px] bg-surface p-4">
              <p className="text-[15px] font-bold">How close was your answer?</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {RATINGS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setMark({ rating: r.id })}
                    aria-pressed={mark.rating === r.id}
                    className={cn('rounded-2xl border-2 px-2 py-3 text-[13px] font-bold', mark.rating === r.id ? 'border-ink bg-periwinkle-soft' : 'border-line')}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button className={PILL} disabled={!canNext} onClick={next}>{last ? 'See results' : 'Next question'}</button>
        </div>
      )}
    </div>
  );
}

export { scoreItem };
