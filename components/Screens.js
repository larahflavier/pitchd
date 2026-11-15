'use client';
import { useState } from 'react';
import {
  Flame, Check, Target, RotateCcw, CircleCheck, Newspaper, MessagesSquare, BookOpen,
  Calculator, Megaphone, Truck, Users, CalendarClock,
} from 'lucide-react';
import Mascot from './Mascot';
import ProgressRing from './ui/ProgressRing';
import { cn } from '@/lib/utils';
import {
  TRACKS, CAT_LABELS, byId, currentStreak, dueIds, loopCards, dailyDone, currentWeekly,
  planProfile, mastery, fixedCount, lastNDays, weekDays, todayStr, statsText, SET_SIZE, setSize, CATEGORY_SET_SIZE, SHARED,
} from '@/lib/engine';
import Roadmap from './Roadmap';
import { describePlan } from '@/lib/curriculum';

/* --------------------------------- Home --------------------------------- */
const CAT_ICONS = {
  behavioral: MessagesSquare, basics: BookOpen, news: Newspaper,
  accounting: Calculator, marketing: Megaphone, supplychain: Truck, management: Users,
};
const CHIP_LABELS = { ...CAT_LABELS, basics: 'Basics' };
const PILL = 'inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-[15px] font-semibold text-white active:scale-[0.98]';

export function Home({ st, onStartDaily, onStartExtra, onStartReview, onStartWeekly, onStartCategory, goto }) {
  const streak = currentStreak(st);
  const done = dailyDone(st);
  const due = dueIds(st).length;
  const week = currentWeekly();
  const weekAnswered = week && st.cards[week.id] && st.cards[week.id].last;
  const days = weekDays();
  const t = todayStr();
  const answered = st.today?.date === t ? Object.keys(st.today.answers || {}).length : 0;
  const size = setSize(st);
  const shown = done ? size : Math.min(answered, size);
  const cats = [...SHARED, st.track];
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
              const Icon = CAT_ICONS[c];
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
            <p className="text-[13px] font-medium leading-snug text-ink/70">Missed questions come back after 1, 3, then 7 days.</p>
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

/* -------------------------------- Summary -------------------------------- */
export function Summary({ kind, results, st, onHome, onMore }) {
  const right = results.filter((r) => r.correct).length;
  const missed = results.filter((r) => !r.correct);
  const mood = right / results.length >= 0.6 ? 'happy' : 'oops';
  const streak = currentStreak(st);
  return (
    <div className="main center">
      <div className="summary-mascot"><Mascot mood={mood} size={170} sparkles /></div>
      <div className="big">{right}/{results.length}</div>
      <p className="hint" style={{ margin: '8px 0 14px' }}>
        {kind === 'daily' ? (mood === 'happy' ? 'Set complete. Nice work.' : 'Set complete. The misses are the useful part.') : 'Solid practice.'}
      </p>
      {kind === 'daily' && (
        <div className="stats" style={{ marginBottom: 14 }}>
          <div className="stat"><small>Streak</small><b>{streak}</b></div>
          <div className="stat"><small>Best</small><b>{st.best}</b></div>
        </div>
      )}
      {missed.length > 0 && (
        <div className="card misslist">
          <h3>Coming back for review</h3>
          <ul>{missed.map((r) => <li key={r.id}>{byId[r.id].q}</li>)}</ul>
        </div>
      )}
      <button className="btn" onClick={onHome}>Back home</button>
      <button className="btn ghost" onClick={onMore}>Practice {setSize(st)} more</button>
    </div>
  );
}

/* --------------------------------- Review -------------------------------- */
export function Review({ st, onStartReview }) {
  const cards = loopCards(st);
  const due = dueIds(st).length;
  const t = todayStr();
  const fmt = (d) => {
    if (d <= t) return 'Due now';
    const diff = Math.round((new Date(d + 'T00:00:00') - new Date(t + 'T00:00:00')) / 86400000);
    return diff === 1 ? 'Tomorrow' : `In ${diff} days`;
  };
  return (
    <div className="main">
      <div className="h1" style={{ marginBottom: 12 }}>Review</div>
      <div className="stats" style={{ marginBottom: 14 }}>
        <div className="stat"><small>In review</small><b>{cards.length}</b></div>
        <div className="stat"><small>Fixed for good</small><b>{fixedCount(st)}</b></div>
      </div>
      {cards.length === 0 ? (
        <div className="card center">
          <div style={{ display: 'flex', justifyContent: 'center' }}><Mascot mood="happy" size={110} /></div>
          <h3 style={{ marginTop: 8 }}>Nothing to review</h3>
          <p>Miss a question and it'll show up here. I bring it back after 1, 3, then 7 days.</p>
        </div>
      ) : (
        <>
          <button className="btn" disabled={due === 0} onClick={onStartReview}>
            {due ? `Review ${Math.min(due, SET_SIZE)} due now` : 'Nothing due yet'}
          </button>
          <div className="spacer" />
          <div className="card">
            <ul className="list">
              {cards.map((c) => (
                <li key={c.id}>
                  <span>{byId[c.id].q}<br /><span className="hint">{CAT_LABELS[byId[c.id].cat]}</span></span>
                  <small>{fmt(c.due)}</small>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------- Progress ------------------------------- */
export function Progress({ st, onTrack, onName, onReset }) {
  const m = mastery(st);
  const [copied, setCopied] = useState(false);
  const cats = ['behavioral', 'basics', 'news', st.track];
  const days = lastNDays(21);
  const copy = async () => {
    try { await navigator.clipboard.writeText(statsText(st)); setCopied(true); setTimeout(() => setCopied(false), 2000); }
    catch { window.prompt('Copy your stats:', statsText(st)); }
  };
  return (
    <div className="main">
      <div className="h1" style={{ marginBottom: 12 }}>Progress</div>
      <Roadmap st={st} />
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
        <p>Based on every answer so far, including misses. Questions you fix in Review count toward your fixed total.</p>
      </div>

      <div className="card">
        <h3>Last 3 weeks</h3>
        <div className="cal">{days.map((d) => <div key={d} className={st.history[d]?.setDone ? 'on' : ''} title={d} />)}</div>
      </div>

      <div className="card">
        <h3>Your track</h3>
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(TRACKS).map(([id, t]) => (
            <button key={id} className={'chip'} onClick={() => onTrack(id)} style={{ border: 0, cursor: 'pointer', outline: st.track === id ? '2px solid var(--blue-500)' : 'none' }}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="spacer" />
        <input className="text" placeholder="First name (optional)" value={st.name} onChange={(e) => onName(e.target.value)} maxLength={24} style={{ marginBottom: 0 }} />
      </div>

      <div className="card">
        <h3>Share your stats</h3>
        <p>Copies a short summary you can text back to whoever's running the pilot.</p>
        <div className="spacer" />
        <button className="btn secondary small" onClick={copy}>{copied ? 'Copied!' : 'Copy my stats'}</button>
      </div>

      <div className="card">
        <h3>Tip</h3>
        <p>Add Pitchd to your home screen from your browser's share menu so it opens like an app. Progress is saved on this device only.</p>
        <div className="spacer" />
        <button className="btn ghost small" onClick={() => { if (window.confirm('Erase all progress on this device?')) onReset(); }} style={{ color: 'var(--red)', padding: 0 }}>
          Reset all progress
        </button>
      </div>
    </div>
  );
}
