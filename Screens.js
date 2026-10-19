'use client';
import { useState } from 'react';
import Mascot from './Mascot';
import {
  TRACKS, CAT_LABELS, byId, currentStreak, dueIds, loopCards, dailyDone, currentWeekly,
  mastery, fixedCount, lastNDays, todayStr, statsText, SET_SIZE,
} from './engine';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/* ------------------------------ Onboarding ------------------------------ */
export function Onboarding({ initialTrack, onDone }) {
  const [track, setTrack] = useState(initialTrack);
  const [name, setName] = useState('');
  return (
    <div className="main">
      <div className="center" style={{ marginBottom: 4 }}>
        <Mascot mood="happy" size={150} sparkles />
      </div>
      <div className="h1 center">Hey, I'm Pip.</div>
      <p className="hint center" style={{ margin: '6px 0 14px' }}>
        Three minutes a day of interview questions. Pick your major track and I'll mix it with behavioral, basics, and news.
      </p>
      <div className="tracks">
        {Object.entries(TRACKS).map(([id, t]) => (
          <button key={id} className={'track' + (track === id ? ' sel' : '')} onClick={() => setTrack(id)}>
            <b>{t.label}</b>
            <small>{t.blurb}</small>
          </button>
        ))}
      </div>
      <input className="text" placeholder="First name (optional)" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
      <button className="btn" disabled={!track} onClick={() => onDone(track, name.trim())}>Let's go</button>
    </div>
  );
}

/* --------------------------------- Home --------------------------------- */
export function Home({ st, onStartDaily, onStartExtra, onStartReview, onStartWeekly, goto }) {
  const streak = currentStreak(st);
  const done = dailyDone(st);
  const due = dueIds(st).length;
  const m = mastery(st);
  const week = currentWeekly();
  const weekAnswered = week && st.cards[week.id] && st.cards[week.id].last;
  const days = lastNDays(7);
  const t = todayStr();

  let line = "Ready for 3 minutes? Let's set up today's set.";
  if (done) line = 'Nice work today! Want to keep going?';
  else if (due > 0) line = `I saved ${Math.min(due, 2)} tricky one${due > 1 ? 's' : ''} for you today.`;
  else if (streak >= 3) line = `${streak} days in a row. Don't break it!`;

  return (
    <div className="main">
      <div className="top">
        <div>
          <div className="greet">{greeting()}{st.name ? `, ${st.name}` : ''}</div>
          <div className="date">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        </div>
        <div className="pill">🔥 {streak}</div>
      </div>

      <div className="hero">
        <div className="hero-name">Pip</div>
        <div className="hero-body">
          <div className="bubble">{line}</div>
          <div style={{ marginTop: 10 }}><Mascot mood={done ? 'happy' : 'neutral'} size={170} sparkles /></div>
        </div>
        <div className="stats">
          <div className="stat"><small>Streak</small><b>{streak} {streak === 1 ? 'day' : 'days'}</b></div>
          <div className="stat"><small>Mastery</small><b>{m.overall === null ? '--' : m.overall + '%'}</b></div>
        </div>
      </div>

      {done ? (
        <>
          <button className="btn" onClick={onStartExtra}>Practice {SET_SIZE} more</button>
          <div className="sub">Today's set is done. Extra practice won't change your streak.</div>
        </>
      ) : (
        <>
          <button className="btn" onClick={onStartDaily}>{st.today?.date === t && Object.keys(st.today.answers).length ? "Continue today's set" : "Start today's set"}</button>
          <div className="sub">{SET_SIZE} questions · about 3 min · {TRACKS[st.track].label} track</div>
        </>
      )}

      {week && (
        <div className="card week">
          <div className="tag">This week in business</div>
          <h3>{week.topic}</h3>
          <p>{weekAnswered ? 'You answered this one. Check Review if you missed it.' : 'One current-events question, refreshed every Monday.'}</p>
          {!weekAnswered && <button className="btn" onClick={onStartWeekly}>Answer it</button>}
        </div>
      )}

      {due > 0 && (
        <div className="card">
          <div className="card-head">
            <h3>{due} due for review</h3>
            <button className="link" onClick={onStartReview}>Practice now</button>
          </div>
          <p>Questions you missed come back after 1, 3, then 7 days.</p>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>This week</h3><button className="link" onClick={() => goto('progress')}>Progress</button></div>
        <div className="strip">
          {days.map((d) => {
            const [y, mo, da] = d.split('-').map(Number);
            const lbl = new Date(y, mo - 1, da).toLocaleDateString('en-US', { weekday: 'narrow' });
            const on = st.history[d]?.setDone;
            return (
              <div className="day" key={d}>
                {lbl}
                <div className={'dot' + (on ? ' on' : '') + (d === t ? ' today' : '')}>{on ? '✓' : ''}</div>
              </div>
            );
          })}
        </div>
      </div>
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
          <div className="stat"><small>Streak</small><b>🔥 {streak}</b></div>
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
      <button className="btn ghost" onClick={onMore}>Practice {SET_SIZE} more</button>
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
