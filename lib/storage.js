// localStorage persistence for Pitchd. Pure functions plus a thin browser wrapper,
// so the migration and cleanup logic can move to a server later.
// Reads never throw: bad, old, or missing data falls back to defaults.

export const KEY_V2 = 'pitchd:v2';
export const KEY_V1 = 'pitchd:v1';
export const STATE_VERSION = 2;
export const LADDER = 5; // review steps: 1, 3, 7, 14, 30 days

function addDaysStr(d, n) {
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const num = (x, d = 0) => (typeof x === 'number' && Number.isFinite(x) ? x : d);
const str = (x, d = '') => (typeof x === 'string' ? x : d);
const dateOrNull = (x) => (typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null);

export function emptyState() {
  return {
    v: STATE_VERSION,
    track: null,
    name: '',
    streak: 0,
    best: 0,
    lastDay: null,
    history: {},
    cards: {},
    today: null,
    // profile, set during onboarding
    onboarded: false,
    school: '',
    year: '',
    goal: '',        // internship | fulltime | coop
    industry: '',
    timeline: { kind: 'unsure', date: null }, // kind: date | month | semester | year | unsure
    minutes: 5,      // 3 | 5 | 10
    remindAt: '19:00',
    remindPerm: 'default', // default | granted | denied | unsupported
    quick: null,     // { correct, total, at } from the starting-level check
    planStart: null,
    plan: null,      // snapshot from lib/curriculum.js makePlan()
    saved: [],       // bookmarked question ids
    ladder: LADDER,  // review schedule version: 5 steps (1/3/7/14/30 days)
    tier: 'free',    // free | premium (payments come later)
    interview: { sessions: [], stories: [] },
  };
}

const strArr = (a) => (Array.isArray(a) ? a.filter((x) => typeof x === 'string') : []);

function cleanSession(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !['drill', 'mock'].includes(x.kind) || !dateOrNull(x.date)) return null;
  return {
    id: x.id,
    kind: x.kind,
    date: x.date,
    track: str(x.track),
    company: str(x.company),
    minutes: num(x.minutes),
    score: Math.min(100, Math.max(0, num(x.score))),
    count: num(x.count),
    items: Array.isArray(x.items)
      ? x.items.filter(isObj).map((i) => ({ id: str(i.id), kind: str(i.kind), cat: str(i.cat), score: num(i.score) }))
      : [],
  };
}

function cleanStory(x) {
  if (!isObj(x) || typeof x.id !== 'string' || !x.id) return null;
  return {
    id: x.id,
    title: str(x.title),
    situation: str(x.situation),
    task: str(x.task),
    action: str(x.action),
    result: str(x.result),
    tags: strArr(x.tags),
    tagsAuto: x.tagsAuto !== false,
    checks: strArr(x.checks),
    updated: dateOrNull(x.updated),
  };
}

function cleanInterview(iv) {
  const out = { sessions: [], stories: [] };
  if (!isObj(iv)) return out;
  if (Array.isArray(iv.sessions)) out.sessions = iv.sessions.map(cleanSession).filter(Boolean).slice(-200);
  if (Array.isArray(iv.stories)) out.stories = iv.stories.map(cleanStory).filter(Boolean).slice(0, 30);
  return out;
}

function cleanTimeline(t) {
  const kinds = ['date', 'month', 'semester', 'year', 'unsure'];
  if (!isObj(t) || !kinds.includes(t.kind)) return { kind: 'unsure', date: null };
  const date = t.kind === 'date' ? dateOrNull(t.date) : null;
  return date || t.kind !== 'date' ? { kind: t.kind, date } : { kind: 'unsure', date: null };
}

function cleanCard(c) {
  if (!isObj(c)) return null;
  return {
    box: num(c.box),
    due: dateOrNull(c.due),
    loop: !!c.loop,
    fixed: !!c.fixed,
    right: num(c.right),
    wrong: num(c.wrong),
    last: dateOrNull(c.last),
  };
}

// Cards saved under the old 3-step ladder (1/3/7 days). A card that finished it
// ("fixed") has passed the 7-day review, so it continues at the 14-day step.
function toLadder5(c) {
  if (c.fixed) return { ...c, fixed: false, loop: true, box: 3, due: addDaysStr(c.last || todayISO(), 14) };
  if (c.loop) return { ...c, box: Math.min(c.box, 4) };
  return c;
}

function cleanHistory(h) {
  if (!isObj(h)) return null;
  const byCat = {};
  if (isObj(h.byCat)) {
    for (const [cat, b] of Object.entries(h.byCat)) {
      if (isObj(b)) byCat[cat] = { answered: num(b.answered), correct: num(b.correct) };
    }
  }
  return { answered: num(h.answered), correct: num(h.correct), setDone: !!h.setDone, byCat };
}

function cleanPlan(p) {
  if (!isObj(p) || typeof p.sig !== 'string' || !dateOrNull(p.monday) || !isObj(p.weights)) return null;
  const weights = {};
  for (const [k, v] of Object.entries(p.weights)) weights[k] = num(v);
  return {
    sig: p.sig,
    monday: p.monday,
    week: num(p.week, 1),
    builtOn: dateOrNull(p.builtOn),
    weights,
    difficulty: Math.min(3, Math.max(1, num(p.difficulty, 2))),
  };
}

// Accepts anything (any version, any garbage) and returns a valid v2 state.
export function normalize(raw) {
  const base = emptyState();
  if (!isObj(raw)) return base;

  const history = {};
  if (isObj(raw.history)) {
    for (const [day, h] of Object.entries(raw.history)) {
      const clean = dateOrNull(day) && cleanHistory(h);
      if (clean) history[day] = clean;
    }
  }
  const cards = {};
  if (isObj(raw.cards)) {
    for (const [id, c] of Object.entries(raw.cards)) {
      const clean = cleanCard(c);
      if (clean) cards[id] = raw.ladder === LADDER ? clean : toLadder5(clean);
    }
  }
  let today = null;
  if (isObj(raw.today) && dateOrNull(raw.today.date) && Array.isArray(raw.today.ids)) {
    today = {
      date: raw.today.date,
      ids: raw.today.ids.filter((id) => typeof id === 'string'),
      answers: isObj(raw.today.answers) ? raw.today.answers : {},
    };
  }

  return {
    ...base,
    track: typeof raw.track === 'string' && raw.track ? raw.track : null,
    name: str(raw.name),
    streak: num(raw.streak),
    best: Math.max(num(raw.best), num(raw.streak)),
    lastDay: dateOrNull(raw.lastDay),
    history,
    cards,
    today,
    // v1 users already picked a track, so they skip the new onboarding
    onboarded: !!raw.onboarded || (typeof raw.track === 'string' && !!raw.track),
    school: str(raw.school),
    year: str(raw.year),
    goal: str(raw.goal),
    industry: str(raw.industry),
    timeline: cleanTimeline(raw.timeline),
    minutes: [3, 5, 10].includes(raw.minutes) ? raw.minutes : 5,
    remindAt: /^\d{2}:\d{2}$/.test(raw.remindAt) ? raw.remindAt : '19:00',
    remindPerm: ['default', 'granted', 'denied', 'unsupported'].includes(raw.remindPerm) ? raw.remindPerm : 'default',
    quick: isObj(raw.quick) ? { correct: num(raw.quick.correct), total: num(raw.quick.total), at: dateOrNull(raw.quick.at) } : null,
    planStart: dateOrNull(raw.planStart),
    plan: cleanPlan(raw.plan),
    saved: Array.isArray(raw.saved) ? [...new Set(raw.saved.filter((x) => typeof x === 'string'))] : [],
    ladder: LADDER,
    tier: raw.tier === 'premium' ? 'premium' : 'free',
    interview: cleanInterview(raw.interview),
  };
}

// v1 -> v2 keeps every v1 field; v2 only adds fields with defaults.
export function migrate(raw) {
  return normalize(raw);
}

function readJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined; // missing, blocked, or corrupt
  }
}

export function writeState(s) {
  try { localStorage.setItem(KEY_V2, JSON.stringify(s)); return true; } catch { return false; }
}

// Prefer v2. If it's missing or unreadable, migrate v1 and save it as v2.
// v1 is left in place as a backup.
export function readState() {
  const v2 = readJSON(KEY_V2);
  if (isObj(v2)) return normalize(v2);
  const v1 = readJSON(KEY_V1);
  if (isObj(v1)) {
    const migrated = migrate(v1);
    writeState(migrated);
    return migrated;
  }
  return emptyState();
}

// Remove both keys, otherwise a reset would re-import the v1 backup on next load.
export function clearState() {
  try { localStorage.removeItem(KEY_V2); } catch {}
  try { localStorage.removeItem(KEY_V1); } catch {}
  return emptyState();
}
