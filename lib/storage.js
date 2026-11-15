// localStorage persistence for Pitchd. Pure functions plus a thin browser wrapper,
// so the migration and cleanup logic can move to a server later.
// Reads never throw: bad, old, or missing data falls back to defaults.

export const KEY_V2 = 'pitchd:v2';
export const KEY_V1 = 'pitchd:v1';
export const STATE_VERSION = 2;

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
  };
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
    ...(c.saved ? { saved: true } : {}),
  };
}

function cleanHistory(h) {
  if (!isObj(h)) return null;
  return { answered: num(h.answered), correct: num(h.correct), setDone: !!h.setDone };
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
      if (clean) cards[id] = clean;
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
