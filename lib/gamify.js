// Gamification rules: XP, levels, streak freezes. Pure functions, no browser APIs.
// XP rewards accuracy and reviews, never speed. Streak freezes are never sold.
import { mondayOf, daysBetween } from './curriculum';

export const XP = {
  correct: 10,      // a new correct answer (once per question per day)
  review: 5,        // a correct review or flip-card "Got it"
  setBonus: 20,     // finishing the daily set
  interviewRate: 0.3, // drill or mock: score% x 0.3, so up to 30
};

/* ------------------------------- levels --------------------------------- */
// Level 1 starts at 0 XP, level 2 at 50, level 3 at 200, level 4 at 450...
export const levelFor = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 50)) + 1;
export const levelStart = (level) => 50 * (level - 1) ** 2;
export function levelProgress(xp) {
  const level = levelFor(xp);
  const start = levelStart(level);
  const span = levelStart(level + 1) - start;
  return { level, into: xp - start, span, pct: Math.round(((xp - start) / span) * 100) };
}

// Adds XP to the total and to the day's history (kept per day for weekly leagues later).
export function awardXp(s, amount, day) {
  if (!amount || amount < 0) return s;
  const prev = s.history[day];
  const h = { answered: 0, correct: 0, setDone: false, byCat: {}, xpIds: [], ...prev, xp: (prev?.xp || 0) + amount };
  return { ...s, xp: (s.xp || 0) + amount, history: { ...s.history, [day]: h } };
}

/* ---------------------------- streak freezes ---------------------------- */
export const freezesPerWeek = (tier) => (tier === 'premium' ? 2 : 1);

const addDay = (d, n) => {
  const [y, m, day] = d.split('-').map(Number);
  const dt = new Date(y, m - 1, day + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

// Can the missed days between lastDay and today be covered by freezes?
// Each missed day needs one freeze, and each week only has so many.
export function coverGap(s, today) {
  if (!s.lastDay) return { ok: false, used: [] };
  const n = daysBetween(s.lastDay, today) - 1; // missed days: the ones strictly between
  if (n <= 0) return { ok: true, used: [] };
  if (n > 14) return { ok: false, used: [] };
  const limit = freezesPerWeek(s.tier);
  const perWeek = {};
  for (const d of s.freezes || []) { const w = mondayOf(d); perWeek[w] = (perWeek[w] || 0) + 1; }
  const used = [];
  for (let i = 1; i <= n; i++) {
    const day = addDay(s.lastDay, i);
    const w = mondayOf(day);
    if ((perWeek[w] || 0) >= limit) return { ok: false, used: [] };
    perWeek[w] = (perWeek[w] || 0) + 1;
    used.push(day);
  }
  return { ok: true, used };
}

// The streak to show today. A missed day keeps the streak alive if a freeze covers it.
export function displayStreak(s, today) {
  if (!s.streak || !s.lastDay) return 0;
  if (s.lastDay === today) return s.streak;
  return coverGap(s, today).ok ? s.streak : 0;
}

// Streak after completing today's set, plus the freeze days it used.
export function streakOnComplete(s, today) {
  if (s.lastDay === today) return { streak: s.streak, used: [] };
  const cover = coverGap(s, today);
  return cover.ok && s.streak > 0 ? { streak: s.streak + 1, used: cover.used } : { streak: 1, used: [] };
}

export function freezesLeft(s, today) {
  const w = mondayOf(today);
  const used = (s.freezes || []).filter((d) => mondayOf(d) === w).length;
  return Math.max(0, freezesPerWeek(s.tier) - used);
}
