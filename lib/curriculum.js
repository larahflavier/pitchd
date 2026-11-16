// Rule-based curriculum. Plain functions only: no React, no window, no localStorage,
// so this file can move to a server route later without changes.
//
// Category keys used in weights: 'track' (the user's major track), 'behavioral', 'basics', 'news',
// plus 'engfund' and 'project' for engineering tracks.
// makePlan() returns weights keyed by the real category id (e.g. 'accounting') so the
// engine can use them directly.
import { goalPhrase } from './profile';

/* ------------------------------- phases --------------------------------- */
export const PHASES = [
  { id: 'foundations', name: 'Foundations', focus: 'Core concepts for your track and business basics' },
  { id: 'applied', name: 'Applied', focus: 'Track technicals, behavioral stories, and news' },
  { id: 'ready', name: 'Interview-ready', focus: 'Mock interviews, mixed sets, and weak spots' },
];

// Weekly themes cycle inside each phase. `cat` is boosted that week;
// 'weak' boosts whichever category the user scores lowest in; null is an even mix.
// `{track}` is replaced with the track name when shown.
const THEMES = {
  foundations: [
    { label: 'Business basics', cat: 'basics' },
    { label: '{track} fundamentals', cat: 'track' },
    { label: 'Reading the news', cat: 'news' },
  ],
  applied: [
    { label: 'Behavioral stories', cat: 'behavioral' },
    { label: '{track} technicals', cat: 'track' },
    { label: 'News and current events', cat: 'news' },
    { label: 'Mixed practice', cat: null },
  ],
  ready: [
    { label: 'Mock interviews', cat: null },
    { label: 'Weak spots', cat: 'weak' },
    { label: 'Final polish', cat: null },
  ],
};

// Phase tweaks: multiply a category's weight during that phase.
const PHASE_MULT = {
  foundations: { basics: 1.5, news: 0.6 },
  applied: {},
  ready: { behavioral: 1.2 },
};

// Starting weights per goal industry (percent). Edit these to tune a goal.
export const GOAL_TEMPLATES = {
  banking: { track: 50, behavioral: 30, basics: 0, news: 20 },
  consulting: { track: 25, behavioral: 40, basics: 20, news: 15 },
  accounting: { track: 50, behavioral: 25, basics: 15, news: 10 },
  engineering: { track: 50, behavioral: 35, basics: 5, news: 10 },
  marketing: { track: 40, behavioral: 30, basics: 15, news: 15 },
  other: { track: 35, behavioral: 30, basics: 25, news: 10 },
};

// engineering tracks add two shared categories
const EXTRA_WEIGHT = { engfund: 15, project: 15 };

const TARGET_ACC = 0.85; // the "85% rule": aim for 80-85% so practice stays hard but doable
const MIN_CAT_ANSWERS = 3; // need this many answers in a category before it shifts the weights
const MIN_OVERALL_ANSWERS = 8; // and this many overall before difficulty moves
const FLOOR = 5; // every category keeps a little weight so a weak spot can always be practiced

// Questions in a daily set for each daily-minutes choice (about 35 seconds each).
export const SET_SIZES = { 3: 5, 5: 8, 10: 16 };
export const setSizeFor = (minutes) => SET_SIZES[minutes] || SET_SIZES[3];

/* -------------------------------- dates --------------------------------- */
const DAY = 86400000;
const parse = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
};
const fmt = (dt) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
export const daysBetween = (a, b) => Math.round((parse(b) - parse(a)) / DAY);
export function mondayOf(date) {
  const dt = parse(date);
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
  return fmt(dt);
}

// Days from `today` to the interview date, or null if they didn't give one.
export function daysUntil(timeline, today) {
  if (!timeline || timeline.kind !== 'date' || !timeline.date) return null;
  return daysBetween(today, timeline.date);
}

/* ------------------------------ roadmap --------------------------------- */
// How many weeks the plan runs, measured from `from` (the plan's start date).
export function planWeeks(timeline, from) {
  switch (timeline?.kind) {
    case 'date': {
      const days = daysUntil(timeline, from);
      return Math.min(12, Math.max(2, Math.ceil((days ?? 42) / 7)));
    }
    case 'month': return 4;
    case 'semester': return 12;
    case 'year': return 12;
    default: return 6;
  }
}

// Splits the weeks across the three phases (about 40 / 40 / 20). Phases with 0 weeks are dropped later.
export function splitWeeks(weeks) {
  const foundations = Math.max(1, Math.round(weeks * 0.4));
  const ready = Math.max(1, Math.round(weeks * 0.2));
  const applied = Math.max(0, weeks - foundations - ready);
  return [foundations, applied, ready];
}

export function buildRoadmap(profile, from) {
  const weeks = planWeeks(profile.timeline, from);
  const lens = splitWeeks(weeks);
  let start = 1;
  const phases = PHASES.map((p, i) => {
    const len = lens[i];
    const out = { ...p, weeks: len, startWeek: start, endWeek: start + len - 1 };
    start += len;
    return out;
  }).filter((p) => p.weeks > 0);
  return {
    weeks,
    phases,
    title: `Your ${weeks}-week plan to ${goalPhrase(profile.goal, profile.industry)}`,
  };
}

// Where the user is in the plan today. Weeks are 7-day blocks counted from planStart.
export function position(profile, today) {
  const start = profile.planStart || today;
  const roadmap = buildRoadmap(profile, start);
  const raw = Math.max(1, Math.floor(daysBetween(start, today) / 7) + 1);
  const week = Math.min(raw, roadmap.weeks);
  const phaseIndex = Math.max(0, roadmap.phases.findIndex((p) => week >= p.startWeek && week <= p.endWeek));
  const phase = roadmap.phases[phaseIndex];
  const themes = THEMES[phase.id];
  const theme = themes[(week - phase.startWeek) % themes.length];
  return { roadmap, week, weeks: roadmap.weeks, finished: raw > roadmap.weeks, phase, phaseIndex, theme };
}

/* -------------------------------- plan ---------------------------------- */
// Anything that changes the plan shape. If this changes, the plan is rebuilt.
export function planSignature(profile) {
  const t = profile.timeline || {};
  return [profile.track, (profile.cats || []).join('+'), profile.goal, profile.industry, t.kind, t.date || '', profile.minutes, profile.planStart || ''].join('|');
}

const accuracy = (b) => (b && b.answered >= MIN_CAT_ANSWERS ? b.correct / b.answered : null);

// stats = { byCat: { [catId]: { answered, correct } }, overall: { answered, correct } }
export function makePlan({ profile, stats = { byCat: {}, overall: { answered: 0, correct: 0 } }, today }) {
  const pos = position(profile, today);
  const trackCat = profile.track;
  const cats = profile.cats && profile.cats.length ? profile.cats : ['behavioral', 'basics', 'news', trackCat];
  const tpl = GOAL_TEMPLATES[profile.industry] || GOAL_TEMPLATES.other;
  const tplByCat = { behavioral: tpl.behavioral, basics: tpl.basics, news: tpl.news, [trackCat]: tpl.track, ...EXTRA_WEIGHT };
  const mult = PHASE_MULT[pos.phase.id] || {};

  // weakest category (lowest accuracy among those with enough answers)
  let weakest = null;
  let weakestAcc = Infinity;
  for (const c of cats) {
    const a = accuracy(stats.byCat[c]);
    if (a !== null && a < weakestAcc) { weakest = c; weakestAcc = a; }
  }
  const themeCat = pos.theme.cat === 'track' ? trackCat : pos.theme.cat === 'weak' ? weakest : pos.theme.cat;

  const raw = {};
  for (const c of cats) {
    let w = Math.max(tplByCat[c] ?? 0, FLOOR);
    const phaseKey = c === trackCat ? 'track' : c;
    w *= mult[phaseKey] ?? 1;
    if (themeCat === c) w *= pos.theme.cat === 'weak' ? 1.5 : 1.4;
    const a = accuracy(stats.byCat[c]);
    if (a !== null && a < TARGET_ACC) w *= 1 + (TARGET_ACC - a) * 2; // lower accuracy, more practice
    raw[c] = w;
  }
  const total = Object.values(raw).reduce((x, y) => x + y, 0);
  const weights = {};
  for (const c of cats) weights[c] = Math.round((raw[c] / total) * 1000) / 1000;

  // difficulty 1-3: phase sets the baseline, accuracy nudges it toward the 80-85% zone
  let difficulty = pos.phaseIndex === 0 ? 1 : pos.phase.id === 'ready' ? 3 : 2;
  const o = stats.overall;
  if (o.answered >= MIN_OVERALL_ANSWERS) {
    const acc = o.correct / o.answered;
    if (acc > 0.9) difficulty += 1;
    else if (acc < 0.7) difficulty -= 1;
  }
  difficulty = Math.min(3, Math.max(1, difficulty));

  return {
    sig: planSignature(profile),
    monday: mondayOf(today),
    week: pos.week,
    builtOn: today,
    weights,
    difficulty,
  };
}

// The plan re-runs when goals change, every Monday, and when a new plan week starts.
export function planIsStale(plan, profile, today) {
  if (!plan || typeof plan !== 'object') return true;
  if (plan.sig !== planSignature(profile)) return true;
  if (plan.monday !== mondayOf(today)) return true;
  return plan.week !== position(profile, today).week;
}

// Turns a plan into text and data the screens can show.
export function describePlan(profile, plan, today, trackLabel = 'Track') {
  const pos = position(profile, today);
  const themeLabel = pos.theme.label.replace('{track}', trackLabel);
  const phases = pos.roadmap.phases.map((p, i) => ({
    ...p,
    state: pos.finished || i < pos.phaseIndex ? 'done' : i === pos.phaseIndex ? 'current' : 'upcoming',
  }));
  return {
    week: pos.week,
    weeks: pos.weeks,
    finished: pos.finished,
    phase: pos.phase,
    phases,
    theme: themeLabel,
    title: pos.roadmap.title,
    label: pos.finished ? 'Plan complete' : `Week ${pos.week} of ${pos.weeks} · ${pos.phase.name}`,
    step: `Week ${pos.week} · ${themeLabel}`,
    daysLeft: daysUntil(profile.timeline, today),
    weights: plan?.weights || null,
    difficulty: plan?.difficulty ?? null,
  };
}
