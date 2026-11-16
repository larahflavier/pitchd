'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronLeft, Check, CircleCheck, Circle } from 'lucide-react';
import Mascot from './Mascot';
import Quiz from './Quiz';
import SoundToggle from './SoundToggle';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';
import { TRACKS, TRACK_GROUPS, todayStr } from '@/lib/engine';
import { buildRoadmap } from '@/lib/curriculum';
import { SCHOOLS, YEARS, GOALS, INDUSTRIES, TIMELINES, MINUTES, REMIND_TIMES, MAJORS_SOON } from '@/lib/profile';
import { PRIMARY, SIZE } from './ui/button-styles';

const STEPS = ['welcome', 'name', 'school', 'year', 'major', 'goal', 'timeline', 'habit', 'quick', 'plan'];
const TOTAL = STEPS.length - 1; // the welcome screen is not counted
const PILL = `${PRIMARY} ${SIZE.lg} w-full`;
const FIELD = 'w-full rounded-[20px] border-2 border-line bg-surface px-4 py-4 text-base font-semibold outline-none focus:border-royal';

// What the royal band says at the top of each step
const META = {
  name: { title: 'What should we call you?', sub: 'Just a first name is fine.' },
  school: { title: 'Where do you go to school?', sub: 'We use this for school leagues.' },
  year: { title: 'What year are you?' },
  major: { title: "What's your major?", sub: 'This sets your track. You can change it later.' },
  goal: { title: 'What are you preparing for?' },
  timeline: { title: "When's your next interview or recruiting season?", sub: 'Your plan gets shorter or longer to fit.' },
  habit: { title: 'How much time a day?' },
  quick: { title: 'Quick check', sub: '5 mixed questions. No pressure, this just sets your starting point.' },
};

// Choices pop in one after another (40ms apart) when a step opens.
const POP = { hidden: { opacity: 0, scale: 0.94, y: 8 }, show: { opacity: 1, scale: 1, y: 0, transition: spring.bouncy } };
function PopList({ className, children }) {
  return (
    <motion.div className={className} initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.04 } } }}>
      {children}
    </motion.div>
  );
}

function Option({ selected, onClick, children, sub, disabled }) {
  return (
    <motion.button
      variants={POP}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-[20px] border-2 px-4 py-4 text-left text-base font-semibold active:scale-[0.99]',
        selected ? 'border-royal bg-azure-soft' : 'border-line bg-surface',
        disabled && 'opacity-40',
      )}
    >
      <span>
        {children}
        {sub && <span className="mt-0.5 block text-[13px] font-medium text-muted-foreground">{sub}</span>}
      </span>
      {selected && <Check size={18} strokeWidth={3} className="shrink-0" />}
    </motion.button>
  );
}

function Chip({ selected, onClick, children }) {
  return (
    <motion.button
      variants={POP}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        'rounded-full border-2 px-4 py-2.5 text-sm font-semibold',
        selected ? 'border-royal bg-azure-soft' : 'border-line bg-surface',
      )}
    >
      {children}
    </motion.button>
  );
}

export default function Onboarding({ initial, initialTrack, ready = true, onOpenWip, soundOn, onSound, onStartQuick, onAnswer, onDone }) {
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
  const welcome = id === 'welcome';

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

  const back = () => setStep(Math.max(0, step - 1));

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
  const meta = id === 'plan'
    ? { title: roadmap.title, sub: quick ? `Starting point: ${quick.correct} of ${quick.total} on the quick check.` : undefined }
    : META[id];

  return (
    <div className="flex flex-1 flex-col">
      {/* royal band: full screen on the welcome step, a top band after that */}
      <div
        className="relative -mx-[18px] flex flex-col overflow-hidden rounded-b-[28px] bg-royal px-[18px] pb-6 text-white"
        style={{
          marginTop: 'calc(-1 * (env(safe-area-inset-top) + 18px))',
          paddingTop: 'calc(env(safe-area-inset-top) + 14px)',
          minHeight: welcome ? 'calc(100dvh - 12px)' : '28dvh',
          transition: 'min-height 380ms cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
      >
        {welcome ? (
          <>
            <div className="flex justify-end"><SoundToggle on={soundOn} onChange={onSound} /></div>
            <div className="flex flex-1 flex-col items-center justify-center pb-6 text-center">
              {/* the splash bubble flies here when the splash lifts */}
              <div className="aspect-[660/631] w-[44%] max-w-[190px]">
                {ready && (
                  <motion.div layoutId="brand-bubble" className="size-full" transition={spring.soft}>
                    <Image src="/brand/pitchd-bubble.png" width={660} height={631} priority alt="Pitchd" className="h-full w-full" />
                  </motion.div>
                )}
              </div>
              <h1 className="mt-6 max-w-[17rem] text-[34px] font-bold leading-[1.05] tracking-tight">Interview prep in 3 minutes a day.</h1>
            </div>

            <div className="relative">
              {/* Pip peeks over the top edge of the button */}
              <div className="pointer-events-none absolute -top-[84px] right-7 h-[88px] overflow-hidden">
                {ready && <Mascot mood="happy" pose="peek" size={104} onDark />}
              </div>
              <button className={`${PILL} relative`} onClick={() => setStep(1)}>Get started</button>
              <div className="mt-4 flex flex-col items-center gap-2.5 text-[15px] font-semibold">
                <button className="underline underline-offset-4" onClick={() => onOpenWip?.('accounts')}>I already have an account</button>
                <Link href="/about" className="text-white/90 underline underline-offset-4">Why it works</Link>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <motion.div layoutId="brand-bubble" className="aspect-[660/631] h-11" transition={spring.soft}>
                  <Image src="/brand/pitchd-bubble.png" width={660} height={631} alt="Pitchd" className="h-full w-full" />
                </motion.div>
                <button onClick={back} aria-label="Back" className="grid size-9 place-items-center rounded-full bg-white/15 text-white active:scale-95">
                  <ChevronLeft size={19} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-[13px] font-bold tabular-nums">{step}/{TOTAL}</span>
                <SoundToggle on={soundOn} onChange={onSound} />
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/20" role="progressbar" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={step}>
              <div className="h-full rounded-full bg-cyan transition-[width] duration-300" style={{ width: `${(step / TOTAL) * 100}%` }} />
            </div>
            <div className="mt-auto pt-6">
              <h1 className="text-[28px] font-bold leading-[1.08] tracking-tight">{meta?.title}</h1>
              {meta?.sub && <p className="mt-2 text-[15px] font-medium text-white/90">{meta.sub}</p>}
            </div>
          </>
        )}
      </div>

      {!welcome && (
        <div className="main flex flex-col pt-6" key={id}>
          <div className="flex-1">
            {id === 'name' && (
              <input className={FIELD} placeholder="First name" value={d.name} maxLength={24} autoFocus onChange={(e) => set({ name: e.target.value })} />
            )}

            {id === 'school' && (
              <PopList className="flex flex-col gap-2.5">
                {SCHOOLS.map((s) => <Option key={s} selected={d.school === s} onClick={() => set({ school: s })}>{s}</Option>)}
              </PopList>
            )}

            {id === 'year' && (
              <PopList className="flex flex-col gap-2.5">
                {YEARS.map((y) => <Option key={y} selected={d.year === y} onClick={() => set({ year: y })}>{y}</Option>)}
              </PopList>
            )}

            {id === 'major' && (
              <>
                {Object.entries(TRACK_GROUPS).map(([gid, glabel]) => (
                  <div key={gid} className="mb-4">
                    <p className="mb-2 text-[13px] font-bold text-muted-foreground">{glabel}</p>
                    <PopList className="flex flex-col gap-2.5">
                      {Object.entries(TRACKS).filter(([, t]) => t.group === gid).map(([tid, t]) => (
                        <Option key={tid} selected={d.track === tid} onClick={() => set({ track: tid })} sub={t.blurb}>{t.label}</Option>
                      ))}
                    </PopList>
                  </div>
                ))}
                <p className="mb-2 mt-2 text-[13px] font-semibold text-muted-foreground">Coming soon</p>
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
                <PopList className="flex flex-col gap-2.5">
                  {GOALS.map((g) => <Option key={g.id} selected={d.goal === g.id} onClick={() => set({ goal: g.id })}>{g.label}</Option>)}
                </PopList>
                <p className="mb-2 mt-6 text-[15px] font-bold">Which industry?</p>
                <PopList className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((i) => <Chip key={i.id} selected={d.industry === i.id} onClick={() => set({ industry: i.id })}>{i.label}</Chip>)}
                </PopList>
              </>
            )}

            {id === 'timeline' && (
              <>
                <PopList className="flex flex-col gap-2.5">
                  {TIMELINES.map((t) => <Option key={t.id} selected={d.tlKind === t.id} onClick={() => set({ tlKind: t.id })}>{t.label}</Option>)}
                </PopList>
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
                <div className="grid grid-cols-3 gap-2.5">
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      onClick={() => set({ minutes: m })}
                      aria-pressed={d.minutes === m}
                      className={cn('rounded-[20px] border-2 py-4 text-center', d.minutes === m ? 'border-royal bg-azure-soft' : 'border-line bg-surface')}
                    >
                      <span className="block text-2xl font-bold tabular-nums">{m}</span>
                      <span className="text-[13px] font-semibold text-muted-foreground">minutes</span>
                    </button>
                  ))}
                </div>
                <p className="mb-2 mt-7 text-[15px] font-bold">What time works best?</p>
                <PopList className="flex flex-wrap gap-2">
                  {REMIND_TIMES.map((t) => (
                    <Chip key={t.time} selected={d.remindAt === t.time} onClick={() => set({ remindAt: t.time })}>{t.label}</Chip>
                  ))}
                </PopList>
                <input type="time" aria-label="Reminder time" className={cn(FIELD, 'mt-3')} value={d.remindAt} onChange={(e) => set({ remindAt: e.target.value })} />
                <p className="mt-3 text-[13px] font-medium text-muted-foreground">
                  Your browser will ask to allow notifications. Reminders start working once accounts launch.
                </p>
              </>
            )}

            {id === 'quick' && (
              <div className="flex justify-center pt-4"><Mascot mood="neutral" pose="think" size={130} /></div>
            )}

            {id === 'plan' && roadmap && (
              <ul className="flex flex-col gap-2.5">
                <li className="flex items-center gap-3 rounded-[20px] bg-surface p-4">
                  <CircleCheck size={22} strokeWidth={2} className="shrink-0 text-royal" />
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
      )}
    </div>
  );
}
