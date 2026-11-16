'use client';
import { useState } from 'react';
import { ChevronLeft, Check, CircleCheck, Circle } from 'lucide-react';
import Mascot from './Mascot';
import Quiz from './Quiz';
import { cn } from '@/lib/utils';
import { TRACKS, todayStr } from '@/lib/engine';
import { buildRoadmap } from '@/lib/curriculum';
import { SCHOOLS, YEARS, GOALS, INDUSTRIES, TIMELINES, MINUTES, REMIND_TIMES, MAJORS_SOON } from '@/lib/profile';

const STEPS = ['name', 'school', 'year', 'major', 'goal', 'timeline', 'habit', 'quick', 'plan'];
const PILL = 'inline-flex w-full items-center justify-center rounded-full bg-ink px-6 py-4 text-base font-semibold text-white active:scale-[0.98] disabled:opacity-35';
const FIELD = 'w-full rounded-[20px] border-2 border-line bg-surface px-4 py-4 text-base font-semibold outline-none focus:border-ink';

function Option({ selected, onClick, children, sub, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-[20px] border-2 px-4 py-4 text-left text-base font-semibold active:scale-[0.99]',
        selected ? 'border-ink bg-periwinkle-soft' : 'border-line bg-surface',
        disabled && 'opacity-40',
      )}
    >
      <span>
        {children}
        {sub && <span className="mt-0.5 block text-[13px] font-medium text-muted-foreground">{sub}</span>}
      </span>
      {selected && <Check size={18} strokeWidth={3} className="shrink-0" />}
    </button>
  );
}

function Chip({ selected, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-full border-2 px-4 py-2.5 text-sm font-semibold',
        selected ? 'border-ink bg-periwinkle-soft' : 'border-line bg-surface',
      )}
    >
      {children}
    </button>
  );
}

const Title = ({ children, sub }) => (
  <div className="mb-5">
    <h1 className="text-[26px] font-bold leading-tight tracking-tight">{children}</h1>
    {sub && <p className="mt-1.5 text-[15px] font-medium text-muted-foreground">{sub}</p>}
  </div>
);

export default function Onboarding({ initial, initialTrack, onBackToLanding, onStartQuick, onAnswer, onDone }) {
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    name: initial.name || '',
    school: initial.school || '',
    year: initial.year || '',
    track: initialTrack || initial.track || null,
    goal: initial.goal || '',
    industry: initial.industry || '',
    tlKind: initial.timeline?.kind === 'unsure' ? '' : initial.timeline?.kind || '',
    tlDate: initial.timeline?.date || '',
    minutes: initial.minutes || 5,
    remindAt: initial.remindAt || '19:00',
  });
  const [remindPerm, setRemindPerm] = useState(initial.remindPerm || 'default');
  const [quickIds, setQuickIds] = useState(null);
  const [quizOn, setQuizOn] = useState(false);
  const [quick, setQuick] = useState(null);
  const set = (patch) => setD((x) => ({ ...x, ...patch }));
  const id = STEPS[step];

  const ok = {
    name: true,
    school: !!d.school,
    year: !!d.year,
    major: !!d.track,
    goal: !!d.goal && !!d.industry,
    timeline: !!d.tlKind && (d.tlKind !== 'date' || !!d.tlDate),
    habit: !!d.remindAt,
  }[id] ?? true;

  const profile = () => ({
    name: d.name.trim(),
    school: d.school,
    year: d.year,
    track: d.track,
    goal: d.goal,
    industry: d.industry,
    timeline: { kind: d.tlKind || 'unsure', date: d.tlKind === 'date' ? d.tlDate : null },
    minutes: d.minutes,
    remindAt: d.remindAt,
    remindPerm,
    remindOn: remindPerm === 'granted',
  });

  const back = () => (step === 0 ? onBackToLanding() : setStep(step - 1));

  const askPermission = async () => {
    let perm = 'unsupported';
    try {
      if (typeof Notification !== 'undefined') {
        perm = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
      }
    } catch {}
    setRemindPerm(perm);
    return perm;
  };

  const next = async () => {
    if (id === 'habit') {
      const perm = await askPermission();
      // save the profile so far, so the quick check can pick questions from the chosen track
      setQuickIds(onStartQuick({ ...profile(), remindPerm: perm, remindOn: perm === 'granted' }));
    }
    setStep(step + 1);
  };

  const skipQuick = () => setStep(STEPS.indexOf('plan'));

  /* ---- quick check ---- */
  if (id === 'quick' && quizOn && quickIds) {
    return (
      <Quiz
        ids={quickIds}
        label="Quick check"
        onAnswer={onAnswer}
        onFinish={(results) => {
          setQuick({ correct: results.filter((r) => r.correct).length, total: results.length, at: todayStr() });
          setQuizOn(false);
          setStep(STEPS.indexOf('plan'));
        }}
        onClose={() => { setQuizOn(false); skipQuick(); }}
      />
    );
  }

  const roadmap = id === 'plan' ? buildRoadmap(profile(), todayStr()) : null;
  const showBar = id !== 'plan';

  return (
    <div className="main flex flex-col" key={id}>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={back}
          aria-label="Back"
          className="grid size-10 shrink-0 place-items-center rounded-full border border-line bg-surface"
        >
          <ChevronLeft size={20} strokeWidth={2.25} />
        </button>
        {showBar && (
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
            <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        )}
      </div>

      <div className="flex-1">
        {id === 'name' && (
          <>
            <Title sub="Just a first name is fine.">What should we call you?</Title>
            <input className={FIELD} placeholder="First name" value={d.name} maxLength={24} autoFocus onChange={(e) => set({ name: e.target.value })} />
          </>
        )}

        {id === 'school' && (
          <>
            <Title sub="We use this for school leagues.">Where do you go to school?</Title>
            <div className="flex flex-col gap-2.5">
              {SCHOOLS.map((s) => <Option key={s} selected={d.school === s} onClick={() => set({ school: s })}>{s}</Option>)}
            </div>
          </>
        )}

        {id === 'year' && (
          <>
            <Title>What year are you?</Title>
            <div className="flex flex-col gap-2.5">
              {YEARS.map((y) => <Option key={y} selected={d.year === y} onClick={() => set({ year: y })}>{y}</Option>)}
            </div>
          </>
        )}

        {id === 'major' && (
          <>
            <Title sub="This sets your track. You can change it later.">What's your major?</Title>
            <div className="flex flex-col gap-2.5">
              {Object.entries(TRACKS).map(([tid, t]) => (
                <Option key={tid} selected={d.track === tid} onClick={() => set({ track: tid })} sub={t.blurb}>{t.label}</Option>
              ))}
            </div>
            <p className="mb-2 mt-5 text-[13px] font-semibold text-muted-foreground">Coming soon</p>
            <div className="flex flex-wrap gap-2">
              {MAJORS_SOON.map((m) => (
                <span key={m} className="rounded-full border border-line px-3 py-1.5 text-[13px] font-semibold text-muted-foreground">{m}</span>
              ))}
            </div>
            <p className="mt-3 text-[13px] font-medium text-muted-foreground">Don't see yours? Pick the closest track for now.</p>
          </>
        )}

        {id === 'goal' && (
          <>
            <Title>What are you preparing for?</Title>
            <div className="flex flex-col gap-2.5">
              {GOALS.map((g) => <Option key={g.id} selected={d.goal === g.id} onClick={() => set({ goal: g.id })}>{g.label}</Option>)}
            </div>
            <p className="mb-2 mt-6 text-[15px] font-bold">Which industry?</p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((i) => <Chip key={i.id} selected={d.industry === i.id} onClick={() => set({ industry: i.id })}>{i.label}</Chip>)}
            </div>
          </>
        )}

        {id === 'timeline' && (
          <>
            <Title sub="Your plan gets shorter or longer to fit.">When's your next interview or recruiting season?</Title>
            <div className="flex flex-col gap-2.5">
              {TIMELINES.map((t) => <Option key={t.id} selected={d.tlKind === t.id} onClick={() => set({ tlKind: t.id })}>{t.label}</Option>)}
            </div>
            {d.tlKind === 'date' && (
              <input
                type="date"
                aria-label="Interview date"
                className={cn(FIELD, 'mt-3')}
                min={todayStr()}
                value={d.tlDate}
                onChange={(e) => set({ tlDate: e.target.value })}
              />
            )}
          </>
        )}

        {id === 'habit' && (
          <>
            <Title>How much time a day?</Title>
            <div className="grid grid-cols-3 gap-2.5">
              {MINUTES.map((m) => (
                <button
                  key={m}
                  onClick={() => set({ minutes: m })}
                  aria-pressed={d.minutes === m}
                  className={cn('rounded-[20px] border-2 py-4 text-center', d.minutes === m ? 'border-ink bg-periwinkle-soft' : 'border-line bg-surface')}
                >
                  <span className="block text-2xl font-bold">{m}</span>
                  <span className="text-[13px] font-semibold text-muted-foreground">minutes</span>
                </button>
              ))}
            </div>
            <p className="mb-2 mt-7 text-[15px] font-bold">What time works best?</p>
            <div className="flex flex-wrap gap-2">
              {REMIND_TIMES.map((t) => (
                <Chip key={t.time} selected={d.remindAt === t.time} onClick={() => set({ remindAt: t.time })}>{t.label}</Chip>
              ))}
            </div>
            <input type="time" aria-label="Reminder time" className={cn(FIELD, 'mt-3')} value={d.remindAt} onChange={(e) => set({ remindAt: e.target.value })} />
            <p className="mt-3 text-[13px] font-medium text-muted-foreground">
              Your browser will ask to allow notifications. Reminders start working once accounts launch.
            </p>
          </>
        )}

        {id === 'quick' && (
          <div className="flex flex-col items-center pt-4 text-center">
            <Mascot mood="neutral" size={110} />
            <h1 className="mt-3 text-[26px] font-bold leading-tight tracking-tight">Quick check</h1>
            <p className="mt-2 max-w-[18rem] text-[15px] font-medium text-muted-foreground">
              5 mixed questions. No pressure, this just sets your starting point.
            </p>
          </div>
        )}

        {id === 'plan' && roadmap && (
          <>
            <div className="mb-5 rounded-[32px] bg-periwinkle p-5">
              <Mascot mood="happy" size={72} />
              <h1 className="mt-2 text-[24px] font-bold leading-tight tracking-tight">{roadmap.title}</h1>
              {quick && (
                <p className="mt-1.5 text-sm font-semibold text-ink/70">Starting point: {quick.correct} of {quick.total} on the quick check.</p>
              )}
            </div>
            <ul className="flex flex-col gap-2.5">
              <li className="flex items-center gap-3 rounded-[20px] bg-surface p-4">
                <CircleCheck size={22} strokeWidth={2} className="shrink-0 text-teal" />
                <span className="text-[15px] font-bold">Finish setup</span>
              </li>
              {roadmap.phases.map((p) => (
                <li key={p.id} className="flex items-start gap-3 rounded-[20px] bg-surface p-4">
                  <Circle size={22} strokeWidth={2} className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span>
                    <span className="block text-[15px] font-bold">{p.name}</span>
                    <span className="block text-[13px] font-medium text-muted-foreground">
                      {p.weeks === 1 ? `Week ${p.startWeek}` : `Weeks ${p.startWeek}-${p.endWeek}`}. {p.focus}.
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2 pb-2">
        {id === 'quick' ? (
          <>
            <button className={PILL} onClick={() => setQuizOn(true)}>Start quick check</button>
            <button className="py-2 text-[15px] font-semibold text-muted-foreground" onClick={skipQuick}>Skip for now</button>
          </>
        ) : id === 'plan' ? (
          <button className={PILL} onClick={() => onDone({ ...profile(), quick, onboarded: true, planStart: todayStr() })}>
            Start day 1
          </button>
        ) : (
          <button className={PILL} disabled={!ok} onClick={next}>Continue</button>
        )}
      </div>
    </div>
  );
}
