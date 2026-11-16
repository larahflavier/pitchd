'use client';
import {
  Flame, Check, Target, RotateCcw, CircleCheck, Newspaper, MessagesSquare, BookOpen,
  Calculator, Megaphone, Truck, Users, CalendarClock, Snowflake, Sparkles, X, Landmark, Cog, Cpu, Factory, Wrench,
} from 'lucide-react';
import Mascot from './Mascot';
import ProgressRing from './ui/ProgressRing';
import { cn } from '@/lib/utils';
import {
  TRACKS, CAT_LABELS, byId, currentStreak, dueIds, dailyDone, currentWeekly,
  planProfile, mastery, lastNDays, weekDays, todayStr, setSize, CATEGORY_SET_SIZE, quizCatsFor,
} from '@/lib/engine';
import Roadmap from './Roadmap';
import SkillMap from './SkillMap';
import Badges from './Badges';
import { describePlan } from '@/lib/curriculum';
import { levelProgress, freezesLeft } from '@/lib/gamify';

/* --------------------------------- Home --------------------------------- */
const CAT_ICONS = {
  behavioral: MessagesSquare, basics: BookOpen, news: Newspaper,
  accounting: Calculator, marketing: Megaphone, supplychain: Truck, management: Users,
  finance: Landmark, mechanical: Cog, electrical: Cpu, industrial: Factory, engfund: Wrench,
};
const CHIP_LABELS = { ...CAT_LABELS, basics: 'Basics', engfund: 'Fundamentals', electrical: 'Electrical', industrial: 'Industrial' };
const PILL = 'inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white active:scale-[0.98]';

export function Home({ st, onStartDaily, onStartExtra, onStartReview, onStartWeekly, onStartCategory, onDismiss, goto }) {
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
  // fresh starts: a new theme every Monday, and a nudge to refresh goals in the first weeks of January and August
  const now = new Date();
  const dismissed = st.dismissed || [];
  const mondayKey = `monday-${t}`;
  const semKey = now.getDate() <= 21 && (now.getMonth() === 0 || now.getMonth() === 7) ? `semester-${now.getFullYear()}-${now.getMonth()}` : null;
  const lvl = levelProgress(st.xp || 0);
  const freeze = freezesLeft(st, t);
  const plan = describePlan(planProfile(st), st.plan, t, TRACKS[st.track].label);

  return (
    <div className="main flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[22px] font-bold tracking-tight">Hello{st.name ? `, ${st.name}` : ''}</div>
          <div className="mt-0.5 text-sm font-medium text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-2 text-[15px] font-bold">
          <Flame size={16} strokeWidth={2.25} className="text-teal" />{streak}
        </div>
      </div>

      {/* level and streak freeze */}
      <div className="-mt-1 flex items-center gap-3">
        <span className="shrink-0 rounded-full bg-periwinkle-soft px-3 py-1 text-[13px] font-bold">Level {lvl.level}</span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="XP to next level" aria-valuemin={0} aria-valuemax={lvl.span} aria-valuenow={lvl.into}>
          <div className="h-full rounded-full bg-periwinkle-strong" style={{ width: `${lvl.pct}%` }} />
        </div>
        <span className="shrink-0 text-[12px] font-semibold text-muted-foreground">{lvl.into}/{lvl.span} XP</span>
      </div>
      {streak > 0 && freeze > 0 && (
        <p className="-mt-2 flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground">
          <Snowflake size={14} strokeWidth={2.25} />Streak freeze ready this week. It covers a missed day automatically.
        </p>
      )}

      {/* fresh start */}
      {semKey && !dismissed.includes(semKey) && (
        <section className="flex items-start gap-3 rounded-[28px] bg-periwinkle-soft p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface"><Sparkles size={19} strokeWidth={2} /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold">New semester, fresh start</h3>
            <p className="text-[13px] font-medium text-ink/70">Update your goals to rebuild your plan for the new term.</p>
            <button className="mt-2 text-[13px] font-bold text-periwinkle-strong" onClick={() => goto('account')}>Update goals</button>
          </div>
          <button aria-label="Dismiss" onClick={() => onDismiss(semKey)} className="grid size-8 shrink-0 place-items-center rounded-full"><X size={16} strokeWidth={2.25} /></button>
        </section>
      )}
      {now.getDay() === 1 && !plan.finished && !dismissed.includes(mondayKey) && (
        <section className="flex items-start gap-3 rounded-[28px] bg-periwinkle-soft p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface"><Sparkles size={19} strokeWidth={2} /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-[15px] font-bold">New week, new theme</h3>
            <p className="text-[13px] font-medium text-ink/70">{plan.step}. Your plan updated this morning.</p>
          </div>
          <button aria-label="Dismiss" onClick={() => onDismiss(mondayKey)} className="grid size-8 shrink-0 place-items-center rounded-full"><X size={16} strokeWidth={2.25} /></button>
        </section>
      )}

      {/* action card */}
      <section className="rounded-[32px] bg-periwinkle p-5">
        <div className="flex items-start justify-between">
          <span className="grid size-12 place-items-center rounded-full bg-surface"><Target size={22} strokeWidth={2} /></span>
          <ProgressRing value={shown} max={size} size={58} stroke={5} trackClass="stroke-white" fillClass="stroke-ink">
            <span className="text-[15px] font-bold">{shown}/{size}</span>
          </ProgressRing>
        </div>
        <h2 className="mt-4 text-[22px] font-bold tracking-tight">Today's set</h2>
        <p className="mt-0.5 text-[15px] font-semibold">{plan.finished ? 'Plan complete' : plan.step}</p>
        <p className="text-sm font-medium text-ink/70">{TRACKS[st.track].label} · {size} questions · {st.minutes} min</p>
        {plan.daysLeft !== null && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 text-[13px] font-bold">
            <CalendarClock size={14} strokeWidth={2.25} />
            {plan.daysLeft > 1 ? `${plan.daysLeft} days until your interview` : plan.daysLeft === 1 ? '1 day until your interview' : plan.daysLeft === 0 ? 'Interview day' : 'Interview date has passed'}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {done ? (
            <>
              <div className={PILL}><Check size={18} strokeWidth={2.5} />Done for today</div>
              <button className="inline-flex items-center justify-center rounded-full bg-surface px-6 py-3 text-[15px] font-semibold text-ink active:scale-[0.98]" onClick={onStartExtra}>
                Practice {size} more
              </button>
            </>
          ) : (
            <button className={PILL} onClick={onStartDaily}>{answered > 0 ? 'Continue' : 'Start'}</button>
          )}
        </div>
        {done && <p className="mt-3 text-sm font-medium text-ink/70">Extra practice won't change your streak.</p>}
      </section>

      {/* category practice */}
      <section>
        <div className="mb-2.5 flex items-baseline justify-between">
          <h3 className="text-base font-bold">Quick practice</h3>
          <span className="text-[13px] font-medium text-muted-foreground">{CATEGORY_SET_SIZE} questions</span>
        </div>
        <div className="-mx-[18px] overflow-x-auto px-[18px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex gap-2">
            {cats.map((c) => {
              const Icon = CAT_ICONS[c] || BookOpen;
              return (
                <button
                  key={c}
                  onClick={() => onStartCategory(c)}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-semibold active:bg-ink active:text-white"
                >
                  <Icon size={16} strokeWidth={2} />{CHIP_LABELS[c]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* review due */}
      {due > 0 ? (
        <section className="flex items-center gap-3 rounded-[28px] bg-orange-soft p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-surface"><RotateCcw size={21} strokeWidth={2} /></span>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold">{due} due today</h3>
            <p className="text-[13px] font-medium leading-snug text-ink/70">Missed questions come back after 1, 3, 7, 14, then 30 days.</p>
          </div>
          <button className={PILL + ' shrink-0 !px-5 !py-2.5 !text-sm'} onClick={onStartReview}>Review</button>
        </section>
      ) : (
        <section className="flex items-center gap-3 rounded-[28px] bg-surface p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-app"><CircleCheck size={22} strokeWidth={2} className="text-teal" /></span>
          <div>
            <h3 className="text-base font-bold">Nothing due today</h3>
            <p className="text-[13px] font-medium leading-snug text-muted-foreground">Miss a question and it comes back here.</p>
          </div>
        </section>
      )}

      {/* weekly news */}
      <section className="rounded-[28px] bg-surface p-5">
        {week ? (
          <>
            <span className="inline-block rounded-full bg-periwinkle-soft px-3 py-1 text-xs font-bold">This week in business</span>
            <h3 className="mt-3 text-lg font-bold leading-snug tracking-tight">{week.topic}</h3>
            {weekAnswered ? (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <Check size={16} strokeWidth={2.5} className="text-teal" />Answered. Check Review if you missed it.
              </p>
            ) : (
              <>
                <p className="mt-1.5 text-sm font-medium text-muted-foreground">One current-events question, refreshed every Monday.</p>
                <button className={PILL + ' mt-4'} onClick={onStartWeekly}>Answer it</button>
              </>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3">
            <span className="grid size-12 shrink-0 place-items-center rounded-full bg-app"><Newspaper size={21} strokeWidth={2} /></span>
            <div>
              <h3 className="text-base font-bold">No news question yet</h3>
              <p className="text-[13px] font-medium text-muted-foreground">A new one lands every Monday.</p>
            </div>
          </div>
        )}
      </section>

      {/* week strip */}
      <section className="rounded-[28px] bg-surface p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold">This week</h3>
          <button className="text-sm font-semibold text-periwinkle-strong" onClick={() => goto('progress')}>Progress</button>
        </div>
        <div className="flex justify-between">
          {days.map((d) => {
            const [y, mo, da] = d.split('-').map(Number);
            const lbl = new Date(y, mo - 1, da).toLocaleDateString('en-US', { weekday: 'short' });
            const on = st.history[d]?.setDone;
            const isToday = d === t;
            return (
              <div key={d} className="flex flex-col items-center gap-2 text-xs font-semibold text-muted-foreground">
                <span className={isToday ? 'text-ink' : ''}>{lbl}</span>
                <div
                  className={cn(
                    'grid size-9 place-items-center rounded-full border text-white',
                    on ? 'border-teal bg-teal' : d > t ? 'border-dashed border-line bg-app' : 'border-line bg-app',
                    isToday && 'border-2 border-ink',
                  )}
                >
                  {on ? <Check size={16} strokeWidth={3} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

/* -------------------------------- Progress ------------------------------- */
export function Progress({ st }) {
  const m = mastery(st);
  const cats = quizCatsFor(st.track);
  const days = lastNDays(21);
  return (
    <div className="main">
      <div className="h1" style={{ marginBottom: 12 }}>Progress</div>
      <Roadmap st={st} />
      <SkillMap st={st} />
      <Badges st={st} />
      <div className="kpis">
        <div className="stat"><small>Streak</small><b>{currentStreak(st)}</b></div>
        <div className="stat"><small>Best</small><b>{st.best}</b></div>
        <div className="stat"><small>Answered</small><b>{m.answered}</b></div>
      </div>

      <div className="card">
        <h3>Accuracy by category</h3>
        {cats.map((c) => {
          const v = m.byCat[c];
          return (
            <div className="row" key={c}>
              <span>{CAT_LABELS[c]}</span>
              <div className="meter"><i style={{ width: `${v?.pct ?? 0}%` }} /></div>
              <em>{v ? v.pct + '%' : '--'}</em>
            </div>
          );
        })}
        <p>Based on every answer so far, including misses. Questions you master in Review count toward your mastered total.</p>
      </div>

      <div className="card">
        <h3>Last 3 weeks</h3>
        <div className="cal">{days.map((d) => <div key={d} className={st.history[d]?.setDone ? 'on' : ''} title={d} />)}</div>
      </div>
    </div>
  );
}
