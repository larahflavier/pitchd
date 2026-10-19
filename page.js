'use client';
import { useEffect, useRef, useState } from 'react';
import Quiz from '../Quiz';
import { Onboarding, Home, Summary, Review, Progress } from '../Screens';
import {
  TRACKS, loadState, saveState, resetState, ensureToday, buildSet, dueIds, currentWeekly,
  recordAnswer, completeDaily, byId, SET_SIZE,
} from '../engine';

export default function Page() {
  const [st, setSt] = useState(null);
  const ref = useRef(null);
  const [tab, setTab] = useState('home');
  const [session, setSession] = useState(null); // { kind, ids, reviewIds, results? }
  const [urlTrack, setUrlTrack] = useState(null);

  useEffect(() => {
    const s = loadState();
    ref.current = s;
    setSt(s);
    const p = new URLSearchParams(window.location.search).get('track');
    if (p && TRACKS[p]) setUrlTrack(p);
  }, []);

  const persist = (n) => { ref.current = n; setSt(n); saveState(n); };

  if (!st) return <div className="app" />;

  const dueNow = dueIds(st).length;

  /* ---- starting sessions ---- */
  const startDaily = () => {
    const n = ensureToday(ref.current);
    persist(n);
    const remaining = n.today.ids.filter((id) => !(id in n.today.answers));
    setSession({ kind: 'daily', ids: remaining, reviewIds: dueIds(n) });
  };
  const startExtra = () => {
    const ids = buildSet(ref.current, { extra: true });
    setSession({ kind: 'extra', ids, reviewIds: dueIds(ref.current) });
  };
  const startReview = () => {
    const ids = dueIds(ref.current).slice(0, SET_SIZE);
    if (ids.length) setSession({ kind: 'review', ids, reviewIds: ids });
  };
  const startWeekly = () => {
    const w = currentWeekly();
    if (w) setSession({ kind: 'weekly', ids: [w.id], reviewIds: [] });
  };

  /* ---- during / after a session ---- */
  const onAnswer = (qid, correct) => persist(recordAnswer(ref.current, qid, correct, { daily: session.kind === 'daily' }));
  const onFinish = (results) => {
    let n = ref.current;
    let shown = results;
    if (session.kind === 'daily') {
      n = completeDaily(n);
      persist(n);
      shown = n.today.ids.map((id) => ({ id, correct: !!n.today.answers[id] }));
    }
    setSession({ ...session, done: true, results: shown });
  };
  const closeSession = () => setSession(null);

  const labelFor = { daily: "Today's set", extra: 'Extra practice', review: 'Review', weekly: 'This week in business' }[session?.kind];

  /* ---- render ---- */
  let body;
  if (!st.track) {
    body = (
      <Onboarding
        initialTrack={urlTrack}
        onDone={(track, name) => persist({ ...ref.current, track, name })}
      />
    );
  } else if (session?.done) {
    body = (
      <Summary
        kind={session.kind}
        results={session.results}
        st={st}
        onHome={() => { setSession(null); setTab('home'); }}
        onMore={() => { setSession(null); startExtra(); }}
      />
    );
  } else if (session) {
    body = (
      <Quiz
        ids={session.ids}
        reviewIds={session.reviewIds}
        label={labelFor}
        onAnswer={onAnswer}
        onFinish={onFinish}
        onClose={closeSession}
      />
    );
  } else if (tab === 'home') {
    body = <Home st={st} onStartDaily={startDaily} onStartExtra={startExtra} onStartReview={startReview} onStartWeekly={startWeekly} goto={setTab} />;
  } else if (tab === 'review') {
    body = <Review st={st} onStartReview={startReview} />;
  } else {
    body = (
      <Progress
        st={st}
        onTrack={(track) => persist({ ...ref.current, track, today: null })}
        onName={(name) => persist({ ...ref.current, name })}
        onReset={() => { persist(resetState()); setTab('home'); }}
      />
    );
  }

  const showTabs = st.track && !session;
  return (
    <div className="app">
      {body}
      {showTabs && (
        <nav className="tabbar">
          <button className={'tab' + (tab === 'home' ? ' active' : '')} onClick={() => setTab('home')}><span>🏠</span>Home</button>
          <button className={'tab' + (tab === 'review' ? ' active' : '')} onClick={() => setTab('review')}>
            <span>🔁</span>Review{dueNow > 0 && <i className="badge">{dueNow}</i>}
          </button>
          <button className={'tab' + (tab === 'progress' ? ' active' : '')} onClick={() => setTab('progress')}><span>📈</span>Progress</button>
        </nav>
      )}
    </div>
  );
}
