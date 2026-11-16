import QUESTIONS from '@/data/questions.json';
import WEEKLY from '@/data/weekly.json';
import { emptyState, readState, writeState, clearState } from '@/lib/storage';
import { makePlan, planIsStale, setSizeFor } from '@/lib/curriculum';
import { XP, awardXp, displayStreak, streakOnComplete } from '@/lib/gamify';

export const TRACKS = {
  accounting: { label: 'Accounting', blurb: 'Statements, debits and credits, GAAP' },
  marketing: { label: 'Marketing', blurb: '4 Ps, segmentation, CAC and LTV' },
  supplychain: { label: 'Supply Chain', blurb: 'Inventory, lead time, bottlenecks' },
  management: { label: 'Management', blurb: 'Teams, leadership, change' },
};
export const CAT_LABELS = {
  behavioral: 'Behavioral',
  basics: 'Business Basics',
  news: 'News',
  accounting: 'Accounting',
  marketing: 'Marketing',
  supplychain: 'Supply Chain',
  management: 'Management',
};
export const SHARED = ['behavioral', 'basics', 'news'];
export const INTERVALS = [1, 3, 7, 14, 30]; // days until a missed question returns; passing the 30-day review masters it
export const SET_SIZE = 5; // size of the starter and review sets; daily sets use setSize(s)
export const setSize = (s) => setSizeFor(s.minutes);

// weekly questions are addressable like normal ones so misses go through review too
const WEEKLY_Q = WEEKLY.map((w) => ({ ...w, id: 'wk-' + w.weekOf, cat: 'news', weekly: true }));
export const byId = Object.fromEntries([...QUESTIONS, ...WEEKLY_Q].map((q) => [q.id, q]));

/* ---------- dates ---------- */
export function todayStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function addDays(dateStr, n) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return todayStr(new Date(y, m - 1, d + n));
}
export function lastNDays(n, end = todayStr()) {
  return Array.from({ length: n }, (_, i) => addDays(end, i - (n - 1)));
}

// Monday through Sunday of the week containing `today`
export function weekDays(today = todayStr()) {
  const [y, m, d] = today.split('-').map(Number);
  const sinceMonday = (new Date(y, m - 1, d).getDay() + 6) % 7;
  const monday = addDays(today, -sinceMonday);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/* ---------- seeded random so a refresh keeps the same set ---------- */
function hash(s) {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function rngFrom(seed) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function shuffle(arr, rng = Math.random) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------- state ---------- */
export const newState = emptyState;
export const loadState = readState;
export const saveState = writeState;
export const resetState = clearState;

/* ---------- selectors ---------- */
export function currentStreak(s) {
  return displayStreak(s, todayStr());
}
export function dueIds(s, today = todayStr()) {
  return Object.entries(s.cards)
    .filter(([id, c]) => c.loop && c.due && c.due <= today && byId[id])
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id]) => id);
}
export function loopCards(s) {
  return Object.entries(s.cards)
    .filter(([id, c]) => c.loop && byId[id])
    .sort((a, b) => a[1].due.localeCompare(b[1].due))
    .map(([id, c]) => ({ id, ...c }));
}
// Decks of question ids for the Review tab.
export function deckIds(s, deck) {
  if (deck === 'due') return dueIds(s);
  if (deck === 'missed') return loopCards(s).map((c) => c.id);
  if (deck === 'saved') return (s.saved || []).filter((id) => byId[id]);
  return [];
}
export function dueOn(s, date) {
  return Object.entries(s.cards).filter(([id, c]) => c.loop && c.due === date && byId[id]).length;
}
// cards coming due on each of the next n days, starting tomorrow; anything overdue counts as due today
export function forecast(s, n = 7, today = todayStr()) {
  return Array.from({ length: n }, (_, i) => {
    const date = addDays(today, i + 1);
    return { date, count: dueOn(s, date) };
  });
}
// answered questions per category (what a category deck would contain)
export function answeredByCat(s) {
  const out = {};
  for (const [id, c] of Object.entries(s.cards)) {
    const q = byId[id];
    if (q && c.right + c.wrong > 0) out[q.cat] = (out[q.cat] || 0) + 1;
  }
  return out;
}
export function toggleSaved(s, qid) {
  const has = (s.saved || []).includes(qid);
  return { ...s, saved: has ? s.saved.filter((id) => id !== qid) : [...(s.saved || []), qid] };
}
export function dailyDone(s) {
  return !!s.history[todayStr()]?.setDone;
}
export function currentWeekly(today = todayStr()) {
  const past = WEEKLY_Q.filter((w) => w.weekOf <= today).sort((a, b) => b.weekOf.localeCompare(a.weekOf));
  return past[0] || null;
}
export function mastery(s) {
  const out = {};
  for (const [id, c] of Object.entries(s.cards)) {
    const q = byId[id];
    if (!q) continue;
    const m = (out[q.cat] ||= { right: 0, wrong: 0 });
    m.right += c.right;
    m.wrong += c.wrong;
  }
  let right = 0, wrong = 0;
  for (const m of Object.values(out)) { right += m.right; wrong += m.wrong; }
  const pct = (r, w) => (r + w ? Math.round((100 * r) / (r + w)) : null);
  for (const m of Object.values(out)) m.pct = pct(m.right, m.wrong);
  return { byCat: out, overall: pct(right, wrong), answered: right + wrong };
}
export function fixedCount(s) {
  return Object.values(s.cards).filter((c) => c.fixed).length;
}

/* ---------- plan ---------- */
export function planProfile(s) {
  return { track: s.track, goal: s.goal, industry: s.industry, timeline: s.timeline, minutes: s.minutes, planStart: s.planStart };
}
// answers per category over the last 14 days; falls back to all-time numbers for categories with too few recent answers
export function planStats(s, today = todayStr()) {
  const days = Array.from({ length: 14 }, (_, i) => {
    const [y, m, d] = today.split('-').map(Number);
    return todayStr(new Date(y, m - 1, d - i));
  });
  const byCat = {};
  for (const day of days) {
    for (const [cat, b] of Object.entries(s.history[day]?.byCat || {})) {
      const t = (byCat[cat] ||= { answered: 0, correct: 0 });
      t.answered += b.answered;
      t.correct += b.correct;
    }
  }
  const all = mastery(s).byCat;
  for (const [cat, v] of Object.entries(all)) {
    if ((byCat[cat]?.answered || 0) < 3 && v.right + v.wrong >= 3) byCat[cat] = { answered: v.right + v.wrong, correct: v.right };
  }
  const overall = { answered: 0, correct: 0 };
  for (const b of Object.values(byCat)) { overall.answered += b.answered; overall.correct += b.correct; }
  return { byCat, overall };
}
function buildPlan(s, today) {
  return makePlan({ profile: planProfile(s), stats: planStats(s, today), today });
}
// Returns the state with a current plan. Rebuilds on goal edits, every Monday, and at each new plan week.
export function refreshPlan(s, { force = false } = {}) {
  if (!s.onboarded || !TRACKS[s.track]) return s;
  const today = todayStr();
  let n = s;
  if (!n.planStart) {
    // accounts from before onboarding existed: the plan starts at their first practice day
    const first = Object.keys(n.history).sort()[0];
    n = { ...n, planStart: first || today };
  }
  if (!force && n.plan && !planIsStale(n.plan, planProfile(n), today)) return n === s ? s : n;
  return { ...n, plan: buildPlan(n, today) };
}

// Profile edits (name, school, track, reminders...). Switching track rebuilds the plan and, if you haven't answered yet today, the set.
export function updateProfile(s, patch) {
  const n = { ...s, ...patch };
  if (patch.track && patch.track !== s.track && !Object.keys(n.today?.answers || {}).length) n.today = null;
  return refreshPlan(n);
}
// Goal edits restart the plan from today. Today's set is rebuilt only if you haven't started it.
export function applyGoals(s, patch) {
  const n = { ...s, ...patch, planStart: todayStr() };
  if (!Object.keys(n.today?.answers || {}).length) n.today = null;
  return refreshPlan(n, { force: true });
}

/* ---------- building a set ---------- */
function pick(cats, n, exclude, s, rng, target = null) {
  const pool = QUESTIONS.filter((q) => cats.includes(q.cat) && !exclude.has(q.id));
  let unseen = shuffle(pool.filter((q) => !s.cards[q.id]), rng);
  // closest to the target difficulty first; questions without a difficulty rank neutral (stable sort keeps the shuffle)
  if (target) unseen = unseen.sort((a, b) => Math.abs((a.difficulty || target) - target) - Math.abs((b.difficulty || target) - target));
  const seen = pool.filter((q) => s.cards[q.id]).sort((a, b) => (s.cards[a.id].last || '').localeCompare(s.cards[b.id].last || ''));
  return [...unseen, ...seen].slice(0, n);
}

// Split n slots across categories by weight (largest remainder; rng breaks ties).
function allocate(weights, n, rng) {
  const entries = Object.entries(weights);
  const total = entries.reduce((a, [, w]) => a + w, 0) || 1;
  const parts = entries.map(([cat, w]) => {
    const exact = (w / total) * n;
    return { cat, w, base: Math.floor(exact), rem: exact - Math.floor(exact) + rng() * 1e-6 };
  });
  let left = n - parts.reduce((a, p) => a + p.base, 0);
  for (const p of [...parts].sort((a, b) => b.rem - a.rem)) {
    if (left <= 0) break;
    p.base += 1;
    left -= 1;
  }
  return parts.sort((a, b) => b.w - a.w);
}

// Due reviews first (up to 40% of the set), then new questions split by the plan's weights.
export function buildSet(s, { extra = false } = {}) {
  const today = todayStr();
  const rng = rngFrom(today + s.track + (extra ? ':' + Date.now() : ''));
  const size = setSize(s);
  const plan = (s.plan && !planIsStale(s.plan, planProfile(s), today) ? s.plan : null) || buildPlan(s, today);
  const reviews = dueIds(s, today).slice(0, Math.ceil(size * 0.4));
  const used = new Set(reviews);
  const need = size - reviews.length;
  const fresh = [];
  for (const { cat, base } of allocate(plan.weights, need, rng)) {
    for (const q of pick([cat], base, used, s, rng, plan.difficulty)) { used.add(q.id); fresh.push(q.id); }
  }
  // a category ran out of questions: fill from any category, heaviest weight first
  if (fresh.length < need) {
    const order = Object.entries(plan.weights).sort((a, b) => b[1] - a[1]).map(([c]) => c);
    for (const cat of order) {
      for (const q of pick([cat], need - fresh.length, used, s, rng, plan.difficulty)) { used.add(q.id); fresh.push(q.id); }
      if (fresh.length >= need) break;
    }
  }
  return [...reviews, ...shuffle(fresh, rng)];
}
// one unseen question for the surprise bonus
export function buildBonusQuestion(s) {
  const rng = rngFrom(todayStr() + 'bonus' + s.track);
  const plan = s.plan || null;
  return pick([...SHARED, s.track], 1, new Set(), s, rng, plan?.difficulty).map((q) => q.id);
}
export const CATEGORY_SET_SIZE = 3;
// short practice from one category; unseen questions first, then the least recently seen
export function buildCategorySet(s, cat, n = CATEGORY_SET_SIZE) {
  const rng = rngFrom(todayStr() + cat + ':' + Date.now());
  return pick([cat], n, new Set(), s, rng).map((q) => q.id);
}
// 5 mixed questions to measure the starting level: one each of behavioral, basics, news, plus two from the track
export function buildQuickCheck(s) {
  const rng = rngFrom('quick' + s.track);
  const used = new Set();
  const out = [];
  for (const [cats, n] of [[['behavioral'], 1], [['basics'], 1], [['news'], 1], [[s.track], 2]]) {
    const got = pick(cats, n, used, s, rng);
    got.forEach((q) => { used.add(q.id); out.push(q.id); });
  }
  return shuffle(out, rng);
}
export function ensureToday(s) {
  const t = todayStr();
  s = refreshPlan(s);
  if (s.today?.date === t) return s;
  return { ...s, today: { date: t, ids: buildSet(s), answers: {} } };
}

/* ---------- recording ---------- */
// source 'deck' = flip-card review; mult doubles the XP (bonus question)
export function recordAnswer(s, qid, correct, { daily = false, source = null, mult = 1 } = {}) {
  const t = todayStr();
  const c = { box: 0, due: null, loop: false, fixed: false, right: 0, wrong: 0, last: null, ...s.cards[qid] };
  const wasReview = c.loop; // a card in the review loop earns review XP
  c.last = t;
  if (correct) {
    c.right += 1;
    // early practice (not due yet) counts toward stats but doesn't move the schedule
    if (c.loop && !(c.due && c.due > t)) {
      c.box += 1;
      if (c.box >= INTERVALS.length) { c.loop = false; c.due = null; c.fixed = true; }
      else c.due = addDays(t, INTERVALS[c.box]);
    }
  } else {
    c.wrong += 1;
    c.loop = true;
    c.fixed = false;
    c.box = 0;
    c.due = addDays(t, INTERVALS[0]);
  }
  const prev = s.history[t];
  const h = { answered: 0, correct: 0, setDone: false, ...prev, byCat: { ...(prev?.byCat || {}) } };
  h.answered += 1;
  if (correct) h.correct += 1;
  const cat = byId[qid]?.cat;
  if (cat) {
    const b = { answered: 0, correct: 0, ...h.byCat[cat] };
    b.answered += 1;
    if (correct) b.correct += 1;
    h.byCat[cat] = b;
  }
  // XP: right answers only, once per question per day
  const earned = correct && !(h.xpIds || []).includes(qid);
  if (earned) h.xpIds = [...(h.xpIds || []), qid];
  let next = { ...s, cards: { ...s.cards, [qid]: c }, history: { ...s.history, [t]: h } };
  if (earned) next = awardXp(next, (wasReview || source === 'deck' ? XP.review : XP.correct) * mult, t);
  if (daily && s.today?.date === t) next.today = { ...s.today, answers: { ...s.today.answers, [qid]: correct } };
  return next;
}
export function completeDaily(s) {
  const t = todayStr();
  const already = !!s.history[t]?.setDone;
  const h = { answered: 0, correct: 0, ...s.history[t], setDone: true };
  const { streak, used } = streakOnComplete(s, t);
  const next = {
    ...s,
    streak,
    best: Math.max(s.best, streak),
    lastDay: t,
    freezes: [...(s.freezes || []), ...used].slice(-60),
    history: { ...s.history, [t]: h },
  };
  return already ? next : awardXp(next, XP.setBonus, t); // finishing the set earns a bonus, once a day
}

/* ---------- pilot export ---------- */
export function statsText(s) {
  const m = mastery(s);
  const days = Object.values(s.history).filter((h) => h.setDone).length;
  const lines = [
    `Pitchd stats${s.name ? ' for ' + s.name : ''} (${s.track ? TRACKS[s.track].label : 'no track'})`,
    `Days completed: ${days} | Current streak: ${currentStreak(s)} | Best: ${s.best}`,
    `Questions answered: ${m.answered} | Accuracy: ${m.overall ?? 0}%`,
    `Mastered: ${fixedCount(s)} | Still in review: ${loopCards(s).length}`,
  ];
  for (const [cat, v] of Object.entries(m.byCat)) lines.push(`  ${CAT_LABELS[cat]}: ${v.pct}% (${v.right + v.wrong} answered)`);
  return lines.join('\n');
}
