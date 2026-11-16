'use client';
import { useEffect, useRef, useState } from 'react';
import Quiz from '@/components/Quiz';
import TabBar from '@/components/TabBar';
import Placeholder from '@/components/Placeholder';
import { Home, Summary, Progress } from '@/components/Screens';
import Review from '@/components/Review';
import ReviewDeck from '@/components/ReviewDeck';
import Landing from '@/components/Landing';
import Onboarding from '@/components/Onboarding';
import {
  TRACKS, loadState, refreshPlan, saveState, resetState, ensureToday, buildSet, buildCategorySet, dueIds, currentWeekly,
  recordAnswer, completeDaily, buildQuickCheck, deckIds, toggleSaved,
} from '@/lib/engine';

export default function Page() {
  const [st, setSt] = useState(null);
  const ref = useRef(null);
  const [tab, setTab] = useState('home');
  const [session, setSession] = useState(null); // { kind, ids, reviewIds, results? }
  const [urlTrack, setUrlTrack] = useState(null);
  const [deck, setDeck] = useState(null); // { title, ids }: a flip-card review session
  const [started, setStarted] = useState(false); // past the landing page

  useEffect(() => {
    const s = refreshPlan(loadState());
    ref.current = s;
    setSt(s);
    saveState(s);
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
    if (!remaining.length) {
      // every answer is already saved (quit before "See results"): finish instead of opening an empty quiz
      const c = completeDaily(n);
      persist(c);
      setSession({ kind: 'daily', ids: [], reviewIds: [], done: true, results: c.today.ids.map((id) => ({ id, correct: !!c.today.answers[id] })) });
      return;
    }
    setSession({ kind: 'daily', ids: remaining, reviewIds: dueIds(n) });
  };
  const startCategory = (cat) => {
    const ids = buildCategorySet(ref.current, cat);
    if (ids.length) setSession({ kind: 'category', ids, reviewIds: [] });
  };
  const startExtra = () => {
    const ids = buildSet(ref.current, { extra: true });
    setSession({ kind: 'extra', ids, reviewIds: dueIds(ref.current) });
  };
  const DECK_TITLES = { due: 'Due today', missed: 'Missed', saved: 'Saved' };
  const startDeck = (kind) => {
    const ids = deckIds(ref.current, kind);
    if (ids.length) setDeck({ title: DECK_TITLES[kind], ids });
  };
  const startReview = () => startDeck('due');
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

  const labelFor = { daily: "Today's set", extra: 'Extra practice', review: 'Review', category: 'Quick practice', weekly: 'This week in business' }[session?.kind];

  /* ---- render ---- */
  let body;
  if (!st.onboarded || !TRACKS[st.track]) {
    body = started ? (
      <Onboarding
        initial={st}
        initialTrack={urlTrack}
        onBackToLanding={() => setStarted(false)}
        // save the profile so far, then pick the quick-check questions from the chosen track
        onStartQuick={(profile) => {
          persist({ ...ref.current, ...profile });
          return buildQuickCheck(ref.current);
        }}
        onAnswer={(qid, correct) => persist(recordAnswer(ref.current, qid, correct))}
        onDone={(profile) => {
          persist(refreshPlan({ ...ref.current, ...profile }, { force: true }));
          setTab('home');
          startDaily();
        }}
      />
    ) : (
      <Landing onStart={() => setStarted(true)} />
    );
  } else if (deck) {
    body = (
      <ReviewDeck
        title={deck.title}
        ids={deck.ids}
        saved={st.saved}
        onToggleSave={(qid) => persist(toggleSaved(ref.current, qid))}
        onGrade={(qid, got) => persist(recordAnswer(ref.current, qid, got))}
        onClose={() => setDeck(null)}
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
        saved={st.saved}
        onToggleSave={(qid) => persist(toggleSaved(ref.current, qid))}
      />
    );
  } else if (tab === 'home') {
    body = <Home st={st} onStartDaily={startDaily} onStartExtra={startExtra} onStartReview={startReview} onStartWeekly={startWeekly} onStartCategory={startCategory} goto={setTab} />;
  } else if (tab === 'interview') {
    body = <Placeholder title="Interview" text="Mock interviews and the story builder are coming soon." />;
  } else if (tab === 'review') {
    body = <Review st={st} onOpenDeck={startDeck} />;
  } else if (tab === 'account') {
    body = <Placeholder title="Account" text="Your profile, goals, and settings are coming soon." />;
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

  const showTabs = st.onboarded && st.track && !session && !deck;
  return (
    <div className="app">
      {body}
      {showTabs && <TabBar tab={tab} onChange={setTab} reviewDue={dueNow} />}
    </div>
  );
}
