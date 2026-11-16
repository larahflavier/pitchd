'use client';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Flame, Check, RotateCcw, CircleCheck, Newspaper, MessagesSquare, BookOpen, Calculator, Megaphone, Truck, Users,
  CalendarClock, Snowflake, Sparkles, X, Landmark, Cog, Cpu, Factory, Wrench,
} from 'lucide-react';
import Mascot from './Mascot';
import ProgressRing from './ui/ProgressRing';
import Stagger from './ui/Stagger';
import Sticker from './ui/Sticker';
import PeekEyes from './ui/PeekEyes';
import StackCard from './ui/StackCard';
import { PRIMARY, SECONDARY, SIZE } from './ui/button-styles';
import { cn } from '@/lib/utils';
import { spring } from '@/lib/motion';
import { describePlan } from '@/lib/curriculum';
import { levelProgress, freezesLeft } from '@/lib/gamify';
import {
  TRACKS, CAT_LABELS, currentStreak, dueIds, dailyDone, currentWeekly, planProfile, mastery, weekDays, todayStr,
  setSize, CATEGORY_SET_SIZE, quizCatsFor,
} from '@/lib/engine';

const CAT_ICONS = {
  behavioral: MessagesSquare, basics: BookOpen, news: Newspaper,
  accounting: Calculator, marketing: Megaphone, supplychain: Truck, management: Users,
  finance: Landmark, mechanical: Cog, electrical: Cpu, industrial: Factory, engfund: Wrench,
};
const CARD_LABELS = { ...CAT_LABELS, basics: 'Business basics' };

// Category cards rotate through the logo palette. Icon, label, and sticker tell them apart, so color never has to.
const FILLS = [
  { bg: 'bg-azure', text: 'text-white', sub: 'text-white/85', circle: 'bg-surface text-royal', sticker: 'cyan' },
  { bg: 'bg-royal', text: 'text-white', sub: 'text-white/85', circle: 'bg-surface text-royal', sticker: 'cyan' },
  { bg: 'bg-cyan', text: 'text-royal', sub: 'text-royal/80', circle: 'bg-surface text-royal', sticker: 'white' },
  { bg: 'bg-azure-soft', text: 'text-royal', sub: 'text-royal/75', circle: 'bg-surface text-royal', sticker: 'azure' },
  { bg: 'bg-cyan-soft', text: 'text-royal', sub: 'text-royal/75', circle: 'bg-surface text-royal', sticker: 'royal' },
];
const TILTS = [-1.4, 1.1, -0.9, 1.4, -1.1];
const STICKER_TILTS = [-10, 8, -6, 10, -8];

export function Home({ st, ready = true, onStartDaily, onStartExtra, onStartReview, onStartWeekly, onStartCategory, onDismiss, goto }) {
  const streak = currentStreak(st);
  const done = dailyDone(st);
  const due = dueIds(st).length;
  const week = currentWeekly();
  const weekAnswered = week && st.cards[week.id] && st.cards[week.id].last;
  const days = weekDays();
  const t = todayStr();
  const answered = st.today?.date === t ? Object.keys(st.today.answers || {}).length : 0;
  const size = st.today?.date === t ? st.today.ids.length : setSize(st);
  const shown = done ? size : Math.min(answered, size);
  const cats = quizCatsFor(st.track);
  const m = mastery(st);
  // fresh starts: a new theme every Monday, and a nudge to refresh goals in the first weeks of January and August
  const now = new Date();
  const dismissed = st.dismissed || [];
  const mondayKey = `monday-${t}`;
  const semKey = now.getDate() <= 21 && (now.getMonth() === 0 || now.getMonth() === 7) ? `semester-${now.getFullYear()}-${now.getMonth()}` : null;
  const lvl = levelProgress(st.xp || 0);
  const freeze = freezesLeft(st, t);
  const plan = describePlan(planProfile(st), st.plan, t, TRACKS[st.track].label);

  // Pip: walks in from the left once per browser session, then points at Start until the first tap of the day
  const pipKey = `pip-point-${t}`;
  const pointing = !done && !dismissed.includes(pipKey);
  const [walk, setWalk] = useState('wait'); // wait | walking | done
  useEffect(() => {
    if (!ready || walk !== 'wait') return;
    let play = true;
    try {
      if (sessionStorage.getItem('pitchd:pip-walk') === '1') play = false;
      else sessionStorage.setItem('pitchd:pip-walk', '1');
    } catch {}
    setWalk(play ? 'walking' : 'done');
  }, [ready, walk]);

  const start = () => {
    if (pointing) onDismiss(pipKey); // Pip stops pointing once you tap Start
    onStartDaily();
  };

  return (
    <Stagger className="main flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[30px] font-bold leading-none tracking-tight">Hello{st.name ? `, ${st.name}` : ''}</h1>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[15px] font-bold tabular-nums">
          <Flame size={16} strokeWidth={2.25} className="text-royal" />{streak}
        </div>
      </div>

      {/* level and streak freeze */}
      <div className="-mt-1 flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-azure-soft px-3 py-1 text-[13px] font-bold text-royal">Level {lvl.level}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="XP to next level" aria-valuemin={0} aria-valuemax={lvl.span} aria-valuenow={lvl.into}>
          <div className="h-full rounded-full bg-azure" style={{ width: `${lvl.pct}%` }} />
        </div>
        <span className="shrink-0 text-[12px] font-semibold tabular-nums text-muted-foreground">{lvl.into}/{lvl.span} XP</span>
      </div>
      {streak > 0 && freeze > 0 && (
        <p className="-mt-2 flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <Snowflake size={14} strokeWidth={2.25} />Streak freeze ready this week. It covers a missed day automatically.
        </p>
      )}

      {/* fresh start */}
      {semKey && !dismissed.includes(semKey) && (
        <section className="flex items-start gap-3 rounded-[28px] bg-azure-soft p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-royal"><Sparkles size={19} strokeWidth={2} /></span>
          <div className="min-w-0 flex-1 text-royal">
            <h3 className="text-[15px] font-bold">New semester, fresh start</h3>
            <p className="text-[13px] font-medium">Update your goals to rebuild your plan for the new term.</p>
            <button className="mt-2 text-[13px] font-bold underline underline-offset-4" onClick={() => goto('account')}>Update goals</button>
          </div>
          <button aria-label="Dismiss" onClick={() => onDismiss(semKey)} className="grid size-9 shrink-0 place-items-center rounded-full text-royal"><X size={16} strokeWidth={2.25} /></button>
        </section>
      )}
      {now.getDay() === 1 && !plan.finished && !dismissed.includes(mondayKey) && (
        <section className="flex items-start gap-3 rounded-[28px] bg-azure-soft p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface text-royal"><Sparkles size={19} strokeWidth={2} /></span>
          <div className="min-w-0 flex-1 text-royal">
            <h3 className="text-[15px] font-bold">New week, new theme</h3>
            <p className="text-[13px] font-medium">{plan.step}. Your plan updated this morning.</p>
          </div>
          <button aria-label="Dismiss" onClick={() => onDismiss(mondayKey)} className="grid size-9 shrink-0 place-items-center rounded-full text-royal"><X size={16} strokeWidth={2.25} /></button>
        </section>
      )}

      {/* hero: the royal action card */}
      <section className="relative rounded-[32px] p-5 text-white">
        {/* shared with the splash and the quiz: it shrinks in from the splash and grows into the quiz when you press Start.
            It only becomes the shared element once the splash is lifting, so the two never compete. */}
        {ready ? (
          <motion.div layoutId="set-card" className="absolute inset-0 bg-royal" style={{ borderRadius: 32 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }} />
        ) : (
          <div className="absolute inset-0 bg-royal" style={{ borderRadius: 32 }} />
        )}
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-white/80">
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </p>
              <h2 className="mt-1.5 text-[34px] font-bold leading-[1.02] tracking-tight">Today's set</h2>
            </div>
            <ProgressRing value={shown} max={size} size={60} stroke={6} trackClass="stroke-white/20" fillClass="stroke-cyan">
              <span className="text-[15px] font-bold tabular-nums">{shown}/{size}</span>
            </ProgressRing>
          </div>
          <p className="mt-3 text-[15px] font-semibold">{plan.finished ? 'Plan complete' : plan.step}</p>
          <p className="text-sm font-medium text-white/85">{TRACKS[st.track].label} · {size} questions · {st.minutes} min</p>
          {plan.daysLeft !== null && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold text-royal">
              <CalendarClock size={14} strokeWidth={2.25} />
              {plan.daysLeft > 1 ? `${plan.daysLeft} days until your interview` : plan.daysLeft === 1 ? '1 day until your interview' : plan.daysLeft === 0 ? 'Interview day' : 'Interview date has passed'}
            </p>
          )}
          <div className="mt-5 flex items-end justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {done ? (
                <>
                  <div className={`${PRIMARY} ${SIZE.md}`}><Check size={18} strokeWidth={2.5} />Done for today</div>
                  <button className={`${SECONDARY} ${SIZE.md}`} onClick={onStartExtra}>Practice {size} more</button>
                </>
              ) : (
                <button className={`${PRIMARY} ${SIZE.lg}`} onClick={start}>{answered > 0 ? 'Continue' : 'Start'}</button>
              )}
            </div>
            {/* Pip sits beside the pill and hangs a little over the card's edge */}
            <div className="relative z-10 -mb-8 -mr-1 shrink-0">
              {walk !== 'wait' && (
                <motion.div
                  initial={walk === 'walking' ? { x: -260 } : false}
                  animate={{ x: 0 }}
                  transition={{ duration: 1.1, ease: 'easeOut' }}
                  onAnimationComplete={() => setWalk('done')}
                >
                  {/* a little hop with each step */}
                  <motion.div
                    initial={false}
                    animate={walk === 'walking' ? { y: [0, -9, 0, -9, 0, -9, 0] } : { y: 0 }}
                    transition={{ duration: 1.1, ease: 'easeInOut' }}
                  >
                    <Mascot mood="neutral" pose={walk === 'done' && pointing ? 'point' : 'idle'} pointSide="left" size={80} onDark />
                  </motion.div>
                </motion.div>
              )}
            </div>
          </div>
          {done && <p className="mt-3 text-sm font-medium text-white/85">Extra practice won't change your streak.</p>}
        </div>
      </section>

      {/* category cards: stacked, a little tilted, with eyes peeking over the top */}
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h3 className="text-[20px] font-bold tracking-tight">Quick practice</h3>
          <span className="text-[13px] font-medium text-muted-foreground">{CATEGORY_SET_SIZE} questions</span>
        </div>
        <div className="pt-2.5">
          {cats.map((c, i) => {
            const f = FILLS[i % FILLS.length];
            const Icon = CAT_ICONS[c] || BookOpen;
            const v = m.byCat[c];
            const last = i === cats.length - 1;
            return (
              <StackCard key={c} tilt={TILTS[i % TILTS.length]} overlap={20} className={f.bg} style={last ? { marginBottom: 0 } : undefined}>
                <PeekEyes />
                <button
                  onClick={() => onStartCategory(c)}
                  className={cn('flex w-full items-center gap-3.5 rounded-[28px] p-4 text-left', f.text, last ? 'pb-4' : 'pb-9')}
                >
                  <span className={cn('grid size-12 shrink-0 place-items-center rounded-full', f.circle)}><Icon size={22} strokeWidth={2} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[19px] font-bold leading-tight tracking-tight">{CARD_LABELS[c]}</span>
                    <span className={cn('block text-[13px] font-medium', f.sub)}>
                      {v ? `${v.right + v.wrong} answered` : 'Not started yet'}
                    </span>
                  </span>
                </button>
                <span className="pointer-events-none absolute -top-3.5 right-4">
                  <Sticker fill={f.sticker} rotate={STICKER_TILTS[i % STICKER_TILTS.length]} size={58}>{v ? `${v.pct}%` : 'New'}</Sticker>
                </span>
              </StackCard>
            );
          })}
        </div>
      </section>

      {/* review due */}
      {due > 0 ? (
        <section className="flex items-center gap-3.5 rounded-[28px] bg-orange-soft p-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-full bg-orange text-[24px] font-bold tabular-nums text-ink">{due}</span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">Due today</h3>
            <p className="text-[13px] font-medium leading-snug text-ink/70">Missed questions come back after 1, 3, 7, 14, then 30 days.</p>
          </div>
          <button className={`${PRIMARY} ${SIZE.sm} shrink-0`} onClick={onStartReview}><RotateCcw size={15} strokeWidth={2.5} />Review</button>
        </section>
      ) : (
        <section className="flex items-center gap-3 rounded-[28px] bg-surface p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-app"><CircleCheck size={22} strokeWidth={2} className="text-royal" /></span>
          <div>
            <h3 className="text-base font-bold">Nothing due today</h3>
            <p className="text-[13px] font-medium leading-snug text-muted-foreground">Miss a question and it comes back here.</p>
          </div>
        </section>
      )}

      {/* weekly news */}
      {week ? (
        <section className="relative rounded-[28px] bg-azure p-5 pt-6 text-white">
          <span className="pointer-events-none absolute -top-5 right-4"><Sticker fill="cyan" rotate={10} points={12} size={82}>This week</Sticker></span>
          <p className="text-[13px] font-bold text-white/85">This week in business</p>
          <h3 className="mt-1.5 max-w-[15rem] text-[21px] font-bold leading-snug tracking-tight">{week.topic}</h3>
          {weekAnswered ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-white/90">
              <Check size={16} strokeWidth={2.5} />Answered. Check Review if you missed it.
            </p>
          ) : (
            <>
              <p className="mt-1.5 text-sm font-medium text-white/90">One current-events question, refreshed every Monday.</p>
              <button className={`${PRIMARY} ${SIZE.md} mt-4`} onClick={onStartWeekly}>Answer it</button>
            </>
          )}
        </section>
      ) : (
        <section className="flex items-center gap-3 rounded-[28px] bg-surface p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-app"><Newspaper size={21} strokeWidth={2} /></span>
          <div>
            <h3 className="text-base font-bold">No news question yet</h3>
            <p className="text-[13px] font-medium text-muted-foreground">A new one lands every Monday.</p>
          </div>
        </section>
      )}

      {/* week strip: done days cyan, today royal, the rest grey */}
      <section className="rounded-[28px] bg-surface p-5">
        <div className="mb-3.5 flex items-center justify-between">
          <h3 className="text-base font-bold">This week</h3>
          <button className="text-sm font-semibold text-royal underline underline-offset-4" onClick={() => goto('progress')}>Progress</button>
        </div>
        <div className="flex justify-between">
          {days.map((d) => {
            const [y, mo, da] = d.split('-').map(Number);
            const lbl = new Date(y, mo - 1, da).toLocaleDateString('en-US', { weekday: 'short' });
            const on = st.history[d]?.setDone;
            const isToday = d === t;
            return (
              <div key={d} className="flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className={isToday ? 'font-bold text-royal' : ''}>{lbl}</span>
                {isToday ? (
                  <motion.button
                    aria-label="Today"
                    className={cn('grid size-10 place-items-center rounded-full text-[14px] font-bold tabular-nums', on ? 'bg-cyan text-royal' : 'bg-royal text-white')}
                    // tapping today's chip makes it bounce
                    whileTap={{ scale: 1.2 }}
                    transition={spring.bouncy}
                  >
                    {on ? <Check size={17} strokeWidth={3} /> : da}
                  </motion.button>
                ) : (
                  <div className={cn('grid size-10 place-items-center rounded-full', on ? 'bg-cyan text-royal' : 'bg-line')}>
                    {on ? <Check size={17} strokeWidth={3} /> : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </Stagger>
  );
}
