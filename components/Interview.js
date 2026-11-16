'use client';
import { useEffect, useState } from 'react';
import { Zap, Timer, NotebookPen, History, Lock, ArrowLeft } from 'lucide-react';
import InterviewSession from './InterviewSession';
import StoryBuilder from './StoryBuilder';
import { cn } from '@/lib/utils';
import { TRACKS, todayStr } from '@/lib/engine';
import {
  COMPANY_TYPES, MOCK_LENGTHS, THEMES, FREE_MOCKS_PER_WEEK, FREE_STORY_LIMIT, buildDrill, buildMock, secondsPerAnswer,
  sessionEntry, addSession, mocksThisWeek, canStartMock, isPremium,
} from '@/lib/interview';

const PILL = 'inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-35';
const PREMIUM_TAG = (
  <span className="inline-flex items-center gap-1 rounded-full bg-periwinkle-soft px-2 py-0.5 text-[11px] font-bold">
    <Lock size={11} strokeWidth={2.5} />Premium
  </span>
);

function Chip({ on, onClick, children }) {
  return (
    <button onClick={onClick} aria-pressed={on}
      className={cn('rounded-full border-2 px-4 py-2.5 text-sm font-semibold', on ? 'border-ink bg-periwinkle-soft' : 'border-line bg-surface')}>
      {children}
    </button>
  );
}

const when = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function Interview({ st, onUpdate, onImmersive }) {
  const [view, setView] = useState('hub'); // hub | mock-setup | run | stories
  const [run, setRun] = useState(null);
  const [storyEditing, setStoryEditing] = useState(false);
  const [company, setCompany] = useState('bank');
  const [minutes, setMinutes] = useState(10);
  const today = todayStr();
  const premium = isPremium(st);
  const sessions = st.interview.sessions;
  const mockOk = canStartMock(st, today);
  const recent = sessions.slice(-10);

  // hide the tab bar while a session or a story is open, so a stray tap can't drop your work
  useEffect(() => { onImmersive(view === 'run' || storyEditing); return () => onImmersive(false); }, [view, storyEditing]); // eslint-disable-line react-hooks/exhaustive-deps

  const startDrill = () => {
    setRun({ kind: 'drill', title: 'Quick drill', items: buildDrill(st.track), seconds: 0, track: st.track });
    setView('run');
  };
  const startMock = () => {
    const m = buildMock({ track: st.track, company, minutes });
    setRun({ kind: 'mock', title: 'Mock interview', items: m.items, seconds: m.seconds, track: st.track, company, minutes });
    setView('run');
  };

  if (view === 'run' && run) {
    return (
      <InterviewSession
        title={run.title}
        items={run.items}
        seconds={run.seconds}
        onExit={() => { setView('hub'); setRun(null); }}
        onFinish={(marks) => {
          const entry = sessionEntry({ ...run, marks, date: today });
          onUpdate((s) => addSession(s, entry));
          return entry;
        }}
      />
    );
  }

  if (view === 'stories') {
    return <StoryBuilder st={st} onUpdate={onUpdate} onBack={() => setView('hub')} onEditing={setStoryEditing} />;
  }

  if (view === 'mock-setup') {
    const len = MOCK_LENGTHS.find((l) => l.minutes === minutes);
    const sec = secondsPerAnswer(len);
    return (
      <div className="main flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setView('hub')} aria-label="Back" className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface">
            <ArrowLeft size={18} strokeWidth={2.25} />
          </button>
          <h1 className="text-[22px] font-bold tracking-tight">Mock interview</h1>
        </div>

        <section>
          <h2 className="mb-2 text-[15px] font-bold">Track</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TRACKS).map(([id, t]) => id === st.track ? (
              <Chip key={id} on onClick={() => {}}>{t.label}</Chip>
            ) : (
              <span key={id} className="inline-flex items-center gap-1.5 rounded-full border-2 border-line px-4 py-2.5 text-sm font-semibold text-muted-foreground opacity-70">
                <Lock size={13} strokeWidth={2.25} />{t.label}
              </span>
            ))}
          </div>
          <p className="mt-2 flex items-center gap-2 text-[13px] font-medium text-muted-foreground">Other tracks {PREMIUM_TAG}</p>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-bold">Company type</h2>
          <div className="flex flex-wrap gap-2">
            {COMPANY_TYPES.map((c) => <Chip key={c.id} on={company === c.id} onClick={() => setCompany(c.id)}>{c.label}</Chip>)}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-[15px] font-bold">Length</h2>
          <div className="flex gap-2">
            {MOCK_LENGTHS.map((l) => <Chip key={l.minutes} on={minutes === l.minutes} onClick={() => setMinutes(l.minutes)}>{l.minutes} minutes</Chip>)}
          </div>
          <p className="mt-2 text-[13px] font-medium text-muted-foreground">
            {len.count} questions, {Math.floor(sec / 60)}:{String(sec % 60).padStart(2, '0')} per answer. Then you check yourself against the key points.
          </p>
        </section>

        <button className={PILL} onClick={startMock}>Start mock interview</button>
      </div>
    );
  }

  /* ---- hub ---- */
  const used = mocksThisWeek(st, today);
  return (
    <div className="main flex flex-col gap-4">
      <h1 className="text-[22px] font-bold tracking-tight">Interview</h1>

      <section className="rounded-[32px] bg-periwinkle p-5">
        <span className="grid size-12 place-items-center rounded-full bg-surface"><Zap size={22} strokeWidth={2} /></span>
        <h2 className="mt-4 text-[22px] font-bold tracking-tight">Quick drill</h2>
        <p className="mt-0.5 text-sm font-medium text-ink/70">3 questions. Type your answer, then compare it to the model answer.</p>
        <button className="mt-4 inline-flex items-center justify-center rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white active:scale-[0.98]" onClick={startDrill}>Start</button>
      </section>

      <section className="rounded-[28px] bg-surface p-5">
        <div className="flex items-start justify-between">
          <span className="grid size-12 place-items-center rounded-full bg-app"><Timer size={22} strokeWidth={2} /></span>
          {mockOk ? <span className="rounded-full bg-teal-soft px-3 py-1 text-xs font-bold">{premium ? 'Unlimited' : 'Free mock ready'}</span> : PREMIUM_TAG}
        </div>
        <h2 className="mt-4 text-lg font-bold tracking-tight">Mock interview</h2>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          5 to 8 questions with a timer on each answer. Pick a company type and length.
        </p>
        {mockOk ? (
          <button className={cn(PILL, 'mt-4')} onClick={() => setView('mock-setup')}>Set up</button>
        ) : (
          <>
            <button className={cn(PILL, 'mt-4')} disabled>Set up</button>
            <p className="mt-2 text-[13px] font-medium text-muted-foreground">
              You used your {FREE_MOCKS_PER_WEEK} free mock this week ({used}). The next one unlocks Monday. Unlimited mocks are Premium.
            </p>
          </>
        )}
      </section>

      <section className="rounded-[28px] bg-surface p-5">
        <div className="flex items-start justify-between">
          <span className="grid size-12 place-items-center rounded-full bg-app"><NotebookPen size={22} strokeWidth={2} /></span>
          <span className="text-[13px] font-bold text-muted-foreground">{st.interview.stories.length}{premium ? '' : ` of ${FREE_STORY_LIMIT}`} stories</span>
        </div>
        <h2 className="mt-4 text-lg font-bold tracking-tight">Story builder</h2>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">
          Write your STAR stories once. We tag each to the {THEMES.length} behavioral questions it can answer.
        </p>
        <button className={cn(PILL, 'mt-4')} onClick={() => setView('stories')}>Open</button>
      </section>

      <section className="rounded-[28px] bg-surface p-5">
        <h2 className="flex items-center gap-2 text-base font-bold"><History size={18} strokeWidth={2} />History</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm font-medium text-muted-foreground">Your drills and mocks show up here with your scores over time.</p>
        ) : (
          <>
            <div className="mt-4 flex h-16 items-end gap-1.5" aria-label="Recent scores">
              {recent.map((x) => (
                <i key={x.id} title={`${x.score}%`} className="block flex-1 rounded-md bg-periwinkle-strong" style={{ height: `${Math.max(8, x.score)}%` }} />
              ))}
            </div>
            <ul className="mt-3 flex flex-col divide-y divide-line">
              {[...sessions].reverse().slice(0, 8).map((x) => (
                <li key={x.id} className="flex items-center justify-between py-2.5">
                  <span>
                    <span className="block text-[14px] font-bold">
                      {x.kind === 'mock' ? `Mock${x.company ? ` · ${COMPANY_TYPES.find((c) => c.id === x.company)?.label || ''}` : ''}` : 'Quick drill'}
                    </span>
                    <span className="block text-[12px] font-medium text-muted-foreground">{when(x.date)} · {x.count} questions{x.minutes ? ` · ${x.minutes} min` : ''}</span>
                  </span>
                  <span className="text-base font-bold">{x.score}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
