'use client';
import { useEffect, useRef, useState } from 'react';
import Quiz from '@/components/Quiz';
import TabBar from '@/components/TabBar';
import { motion, MotionConfig, AnimatePresence } from 'motion/react';
import { Progress } from '@/components/Screens';
import { Home } from '@/components/Home';
import Summary from '@/components/Summary';
import Celebrations from '@/components/Celebrations';
import { awardBadges } from '@/lib/badges';
import { bonusFor, claimBonus } from '@/lib/bonus';
import { levelFor } from '@/lib/gamify';
import Review from '@/components/Review';
import Interview from '@/components/Interview';
import Account from '@/components/Account';
import SoundToggle from '@/components/SoundToggle';
import { setSoundEnabled } from '@/lib/sound';
import { storyCards } from '@/lib/interview';
import ReviewDeck from '@/components/ReviewDeck';
import Splash from '@/components/Splash';
import { PipProvider } from '@/lib/pip';
import Onboarding from '@/components/Onboarding';
import {
  TRACKS, loadState, refreshPlan, updateProfile, applyGoals, saveState, resetState, ensureToday, buildSet, buildCategorySet, dueIds, currentWeekly,
  recordAnswer, completeDaily, buildQuickCheck, deckIds, toggleSaved, buildBonusQuestion, todayStr,
} from '@/lib/engine';

export default function Page() {
  const [st, setSt] = useState(null);
  const ref = useRef(null);
  const [tab, setTab] = useState('home');
  const [session, setSession] = useState(null); // { kind, ids, reviewIds, results? }
  const [urlTrack, setUrlTrack] = useState(null);
  const [deck, setDeck] = useState(null); // { title, ids, items? }: a flip-card review session
  const [events, setEvents] = useState([]); // level-ups and badges waiting for a calm screen
  const [immersive, setImmersive] = useState(false); // hides the tab bar during an interview session
  const prevKey = useRef(null); // the last screen that was on display, so the right transition plays
  const keyRef = useRef(null); // the screen being drawn now
  const splashDecided = useRef(false);
  const [wipe, setWipe] = useState(false); // the royal wipe into the set-complete screen
  const [splash, setSplash] = useState(null); // 'full' for new users, 'short' for returning users, once per session

  useEffect(() => {
    let s = refreshPlan(loadState());
    if (s.onboarded) s = awardBadges(s, todayStr()).state; // existing progress earns its badges quietly
    ref.current = s;
    setSt(s);
    saveState(s);
    const p = new URLSearchParams(window.location.search).get('track');
    if (p && TRACKS[p]) setUrlTrack(p);
    // splash: new users always see the full one. Returning users see a short one once per browser session.
    // If storage is blocked we can't remember, so they see the short one on every open.
    // decide once. React's dev mode runs effects twice, and the second run would see the key the first one wrote.
    if (!splashDecided.current) {
      splashDecided.current = true;
      let mode = s.onboarded ? 'short' : 'full';
      if (s.onboarded) {
        try {
          if (sessionStorage.getItem('pitchd:splash') === '1') mode = null;
          else sessionStorage.setItem('pitchd:splash', '1');
        } catch {}
      }
      setSplash(mode);
    }
  }, []);

  // after every draw: remember which screen is up, and start the royal wipe when a quiz ends
  useEffect(() => {
    const k = keyRef.current;
    if (k === prevKey.current) return;
    if (k === 'summary' && prevKey.current === 'quiz') setWipe(true);
    prevKey.current = k;
  });

  // keep the audio module in step with the saved setting (Account and the header both write it)
  useEffect(() => { if (st) setSoundEnabled(st.sound !== false); }, [st?.sound]); // eslint-disable-line react-hooks/exhaustive-deps

  // every save: record new badges, and queue a pop-up for each level-up or badge
  const persist = (n) => {
    const prev = ref.current;
    const evs = [];
    if (n.onboarded) {
      const { state, earned } = awardBadges(n, todayStr());
      n = state;
      if (prev && levelFor(n.xp || 0) > levelFor(prev.xp || 0)) evs.push({ type: 'level', level: levelFor(n.xp || 0) });
      for (const id of earned) evs.push({ type: 'badge', id });
    }
    ref.current = n; setSt(n); saveState(n);
    if (evs.length) setEvents((e) => [...e, ...evs]);
  };

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
  const DECK_TITLES = { due: 'Due today', missed: 'Missed', saved: 'Saved', stories: 'My stories' };
  const startDeck = (kind) => {
    if (kind === 'stories') {
      const items = storyCards(ref.current);
      if (items.length) setDeck({ title: DECK_TITLES.stories, ids: items.map((x) => x.id), items });
      return;
    }
    const ids = deckIds(ref.current, kind);
    if (ids.length) setDeck({ title: DECK_TITLES[kind], ids });
  };
  const startReview = () => startDeck('due');
  const startWeekly = () => {
    const w = currentWeekly();
    if (w) setSession({ kind: 'weekly', ids: [w.id], reviewIds: [] });
  };

  /* ---- during / after a session ---- */
  const onAnswer = (qid, correct) =>
    persist(recordAnswer(ref.current, qid, correct, { daily: session.kind === 'daily', mult: session.kind === 'bonus' ? 2 : 1 }));
  // surprise bonus: opening it uses up today's roll. A bonus question is worth double XP.
  const openBonus = (kind) => {
    persist(claimBonus(ref.current, kind, todayStr()));
    if (kind === 'question') {
      const ids = buildBonusQuestion(ref.current);
      if (ids.length) setSession({ kind: 'bonus', ids, reviewIds: [] });
    }
  };
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

  const labelFor = { daily: "Today's set", extra: 'Extra practice', review: 'Review', category: 'Quick practice', weekly: 'This week in business', bonus: 'Bonus question (double XP)' }[session?.kind];

  /* ---- render ---- */
  let body;
  if (!st.onboarded || !TRACKS[st.track]) {
    body = (
      <Onboarding
        initial={st}
        initialTrack={urlTrack}
        ready={!splash}
        soundOn={st.sound !== false}
        onSound={(sound) => persist({ ...ref.current, sound })}
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
    );
  } else if (deck) {
    body = (
      <ReviewDeck
        title={deck.title}
        ids={deck.ids}
        items={deck.items}
        saved={st.saved}
        onToggleSave={deck.items ? undefined : (qid) => persist(toggleSaved(ref.current, qid))}
        // story cards are practice only: they don't touch the review schedule
        onGrade={(qid, got) => { if (!deck.items) persist(recordAnswer(ref.current, qid, got, { source: 'deck' })); }}
        onClose={() => setDeck(null)}
      />
    );
  } else if (session?.done) {
    body = (
      <Summary
        kind={session.kind}
        results={session.results}
        st={st}
        bonus={session.kind === 'daily' ? bonusFor(st, todayStr()) : null}
        onOpenBonus={openBonus}
        onHome={() => { setSession(null); setTab('home'); }}
        onMore={() => { setSession(null); startExtra(); }}
        onReview={() => { setSession(null); setTab('review'); }}
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
        fromHome={prevKey.current === 'home'}
      />
    );
  } else if (tab === 'home') {
    body = <Home st={st} ready={!splash} onStartDaily={startDaily} onStartExtra={startExtra} onStartReview={startReview} onStartWeekly={startWeekly} onStartCategory={startCategory} onDismiss={(key) => persist({ ...ref.current, dismissed: [...(ref.current.dismissed || []), key] })} goto={setTab} />;
  } else if (tab === 'interview') {
    body = <Interview st={st} onUpdate={(fn) => persist(fn(ref.current))} onImmersive={setImmersive} />;
  } else if (tab === 'review') {
    body = <Review st={st} onOpenDeck={startDeck} />;
  } else if (tab === 'account') {
    body = (
      <Account
        st={st}
        onPatch={(patch) => persist(updateProfile(ref.current, patch))}
        onSaveGoals={(patch) => persist(applyGoals(ref.current, patch))}
        onReset={() => { persist(resetState()); setEvents([]); setTab('home'); }}
      />
    );
  } else {
    body = (
      <Progress st={st} />
    );
  }

  const showTabs = st.onboarded && st.track && !session && !deck && !immersive;
  // pop-ups wait until nobody is mid-question
  const quizActive = !!session && !session.done;
  const idle = st.onboarded && !quizActive && !deck && !immersive;
  // a new key fades the next screen in; answering inside a quiz never changes it
  const screenKey = !st.onboarded || !TRACKS[st.track]
    ? 'onboarding'
    : deck ? 'deck' : session ? (session.done ? 'summary' : 'quiz') : tab;
  keyRef.current = screenKey; // read by the effect near the top; writing the same value twice is harmless
  return (
    <MotionConfig reducedMotion="user">
     <PipProvider>
      <div className="app">
        {st.onboarded && (
          <div className="relative z-30 -mb-1 flex justify-end">
            <SoundToggle on={st.sound !== false} onChange={(sound) => persist({ ...ref.current, sound })} />
          </div>
        )}
        <motion.div
          key={screenKey}
          className="relative flex flex-1 flex-col"
          // Home to Quiz: the card grows into the screen instead (shared layout), so no fade here.
          // Every other change is a quick crossfade with an 8px rise. Nothing slides sideways.
          initial={prevKey.current === 'home' && screenKey === 'quiz' ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.15, ease: 'easeOut' }}
        >
          {body}
        </motion.div>
        <AnimatePresence>
          {wipe && (
            <motion.div
              key="wipe"
              className="pointer-events-none absolute inset-0 z-40 bg-royal"
              initial={{ y: '100%' }}
              animate={{ y: '0%' }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: [0.2, 0.8, 0.2, 1] }}
              onAnimationComplete={() => setWipe(false)}
            />
          )}
        </AnimatePresence>
        {showTabs && <TabBar tab={tab} onChange={setTab} reviewDue={dueNow} />}
        <Celebrations events={events} idle={idle} onNext={() => setEvents((e) => e.slice(1))} />
        <AnimatePresence>
          {splash && (
            <Splash
              key="splash"
              mode={splash}
              soundOn={st.sound !== false}
              onSound={(sound) => persist({ ...ref.current, sound })}
              onDone={() => setSplash(null)}
            />
          )}
        </AnimatePresence>
      </div>
     </PipProvider>
    </MotionConfig>
  );
}
