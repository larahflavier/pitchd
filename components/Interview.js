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
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';
import Stagger from './ui/Stagger';
import StackCard from './ui/StackCard';
import PeekEyes from './ui/PeekEyes';
import Sticker from './ui/Sticker';

const PILL = `${PRIMARY} ${SIZE.lg} w-full`;
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
  const lockedTag = (
    <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[11px] font-bold text-royal">
      <Lock size={11} strokeWidth={2.5} />Premium
    </span>
  );
  return (
    <Stagger className="main flex flex-col gap-4">
      <h1 className="text-[30px] font-bold leading-none tracking-tight">Interview</h1>

      {/* the three modes, stacked and a little tilted */}
      <section className="pt-3">
        <StackCard tilt={-1.3} overlap={20} className="bg-azure text-white">
          <PeekEyes />
          <div className="p-5 pb-11">
            <span className="grid size-12 place-items-center rounded-full bg-surface text-royal"><Zap size={22} strokeWidth={2} /></span>
            <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-tight">Quick drill</h2>
            <p className="mt-1 text-sm font-medium text-white/90">3 questions. Type your answer, then compare it to the model answer.</p>
            <button className={`${PRIMARY} ${SIZE.md} mt-4`} onClick={startDrill}>Start</button>
          </div>
          <span className="pointer-events-none absolute -top-3.5 right-4"><Sticker fill="cyan" rotate={9} size={62}>Free</Sticker></span>
        </StackCard>

        <StackCard tilt={1.1} overlap={20} className="bg-royal text-white">
          <PeekEyes />
          <div className="p-5 pb-11">
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-full bg-surface text-royal"><Timer size={22} strokeWidth={2} /></span>
              {mockOk ? (
                <span className="rounded-full bg-cyan px-3 py-1 text-xs font-bold text-royal">{premium ? 'Unlimited' : 'Free mock ready'}</span>
              ) : lockedTag}
            </div>
            <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-tight">Mock interview</h2>
            <p className="mt-1 text-sm font-medium text-white/90">5 to 8 questions with a timer on each answer. Pick a company type and length.</p>
            {mockOk ? (
              <button className={`${PRIMARY} ${SIZE.md} mt-4`} onClick={() => setView('mock-setup')}>Set up</button>
            ) : (
              <>
                <button className={`${PRIMARY} ${SIZE.md} mt-4`} disabled><Lock size={15} strokeWidth={2.5} />Set up</button>
                <p className="mt-2 text-[13px] font-medium text-white/85">
                  You used your {FREE_MOCKS_PER_WEEK} free mock this week ({used}). The next one unlocks Monday. Unlimited mocks are Premium.
                </p>
              </>
            )}
          </div>
        </StackCard>

        <StackCard tilt={-0.9} overlap={20} className="bg-cyan text-royal" style={{ marginBottom: 0 }}>
          <PeekEyes />
          <div className="p-5">
            <div className="flex items-start justify-between">
              <span className="grid size-12 place-items-center rounded-full bg-surface text-royal"><NotebookPen size={22} strokeWidth={2} /></span>
              <span className="rounded-full bg-surface px-3 py-1 text-[12px] font-bold tabular-nums text-royal">
                {st.interview.stories.length}{premium ? '' : ` of ${FREE_STORY_LIMIT}`} stories
              </span>
            </div>
            <h2 className="mt-3 text-[26px] font-bold leading-tight tracking-tight">Story builder</h2>
            <p className="mt-1 text-sm font-medium text-royal/85">
              Write your STAR stories once. We tag each to the {THEMES.length} behavioral questions it can answer.
            </p>
            <button className={`${SECONDARY} ${SIZE.md} mt-4`} onClick={() => setView('stories')}>Open</button>
          </div>
        </StackCard>
      </section>

      <section className="rounded-[28px] bg-surface p-5">
        <h2 className="flex items-center gap-2 text-base font-bold"><History size={18} strokeWidth={2} />History</h2>
        {sessions.length === 0 ? (
          <p className="mt-2 text-sm font-medium text-muted-foreground">Your drills and mocks show up here with your scores over time.</p>
        ) : (
          <>
            <div className="mt-4 flex h-16 items-end gap-1.5" aria-label="Recent scores">
              {recent.map((x) => (
                <i key={x.id} title={`${x.score}%`} className="block flex-1 rounded-md bg-azure" style={{ height: `${Math.max(8, x.score)}%` }} />
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
                  <span className="text-base font-bold tabular-nums">{x.score}%</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </Stagger>
  );
}
