// Rule-based curriculum. Plain functions only: no React, no window, no localStorage,
// so this file can move to a server route later without changes.
import { goalPhrase } from './profile';

export const PHASES = [
  { id: 'foundations', name: 'Foundations', focus: 'Core concepts for your track and business basics' },
  { id: 'applied', name: 'Applied', focus: 'Track technicals, behavioral stories, and news' },
  { id: 'ready', name: 'Interview-ready', focus: 'Mock interviews, mixed sets, and weak spots' },
];

const DAY = 86400000;
const parse = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day);
};

// Days from `today` to the interview date, or null if they didn't give one.
export function daysUntil(timeline, today) {
  if (!timeline || timeline.kind !== 'date' || !timeline.date) return null;
  return Math.round((parse(timeline.date) - parse(today)) / DAY);
}

// How many weeks the plan runs. Capped so a far-off date still gives a usable plan.
export function planWeeks(timeline, today) {
  switch (timeline?.kind) {
    case 'date': {
      const days = daysUntil(timeline, today);
      return Math.min(12, Math.max(2, Math.ceil((days ?? 42) / 7)));
    }
    case 'month': return 4;
    case 'semester': return 12;
    case 'year': return 12;
    default: return 6;
  }
}

// Splits the weeks across the three phases (about 40 / 40 / 20). Phases with 0 weeks are dropped.
export function splitWeeks(weeks) {
  const foundations = Math.max(1, Math.round(weeks * 0.4));
  const ready = Math.max(1, Math.round(weeks * 0.2));
  const applied = Math.max(0, weeks - foundations - ready);
  return [foundations, applied, ready];
}

export function buildRoadmap(profile, today) {
  const weeks = planWeeks(profile.timeline, today);
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
