import QUESTIONS from '../data/questions.json';
import WEEKLY from '../data/weekly.json';

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
export const INTERVALS = [1, 3, 7]; // days until a missed question returns, per successful return
export const SET_SIZE = 5;
const KEY = 'pitchd:v1';

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
export function newState() {
  return { v: 1, track: null, name: '', streak: 0, best: 0, lastDay: null, history: {}, cards: {}, today: null };
}
export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...newState(), ...JSON.parse(raw) } : newState();
  } catch {
    return newState();
  }
}
export function saveState(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}
export function resetState() {
  try { localStorage.removeItem(KEY); } catch {}
  return newState();
}

/* ---------- selectors ---------- */
export function currentStreak(s) {
  const t = todayStr();
  return s.lastDay === t || s.lastDay === addDays(t, -1) ? s.streak : 0;
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

/* ---------- building a set ---------- */
function pick(cats, n, exclude, s, rng) {
  const pool = QUESTIONS.filter((q) => cats.includes(q.cat) && !exclude.has(q.id));
  const unseen = shuffle(pool.filter((q) => !s.cards[q.id]), rng);
  const seen = pool.filter((q) => s.cards[q.id]).sort((a, b) => (s.cards[a.id].last || '').localeCompare(s.cards[b.id].last || ''));
  return [...unseen, ...seen].slice(0, n);
}
export function buildSet(s, { extra = false } = {}) {
  const today = todayStr();
  const rng = rngFrom(today + s.track + (extra ? ':' + Date.now() : ''));
  const reviews = dueIds(s, today).slice(0, 2);
  const used = new Set(reviews);
  const need = SET_SIZE - reviews.length;
  const sharedN = Math.min(2, need);
  const shared = pick(SHARED, sharedN, used, s, rng);
  shared.forEach((q) => used.add(q.id));
  const track = pick([s.track], need - shared.length, used, s, rng);
  const fresh = shuffle([...shared, ...track], rng).map((q) => q.id);
  return [...reviews, ...fresh];
}
export function ensureToday(s) {
  const t = todayStr();
  if (s.today?.date === t) return s;
  return { ...s, today: { date: t, ids: buildSet(s), answers: {} } };
}

/* ---------- recording ---------- */
export function recordAnswer(s, qid, correct, { daily = false } = {}) {
  const t = todayStr();
  const c = { box: 0, due: null, loop: false, fixed: false, right: 0, wrong: 0, last: null, ...s.cards[qid] };
  c.last = t;
  if (correct) {
    c.right += 1;
    if (c.loop) {
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
  const h = { answered: 0, correct: 0, setDone: false, ...s.history[t] };
  h.answered += 1;
  if (correct) h.correct += 1;
  const next = { ...s, cards: { ...s.cards, [qid]: c }, history: { ...s.history, [t]: h } };
  if (daily && s.today?.date === t) next.today = { ...s.today, answers: { ...s.today.answers, [qid]: correct } };
  return next;
}
export function completeDaily(s) {
  const t = todayStr();
  const h = { answered: 0, correct: 0, ...s.history[t], setDone: true };
  let streak = s.streak;
  if (s.lastDay === t) { /* already counted today */ }
  else if (s.lastDay === addDays(t, -1)) streak += 1;
  else streak = 1;
  return { ...s, streak, best: Math.max(s.best, streak), lastDay: t, history: { ...s.history, [t]: h } };
}

/* ---------- pilot export ---------- */
export function statsText(s) {
  const m = mastery(s);
  const days = Object.values(s.history).filter((h) => h.setDone).length;
  const lines = [
    `Pitchd stats${s.name ? ' for ' + s.name : ''} (${s.track ? TRACKS[s.track].label : 'no track'})`,
    `Days completed: ${days} | Current streak: ${currentStreak(s)} | Best: ${s.best}`,
    `Questions answered: ${m.answered} | Accuracy: ${m.overall ?? 0}%`,
    `Missed then fixed: ${fixedCount(s)} | Still in review: ${loopCards(s).length}`,
  ];
  for (const [cat, v] of Object.entries(m.byCat)) lines.push(`  ${CAT_LABELS[cat]}: ${v.pct}% (${v.right + v.wrong} answered)`);
  return lines.join('\n');
}
