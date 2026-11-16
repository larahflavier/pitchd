// Badges are only for real milestones. Pure functions: given the state, which ones are earned?
import { byId, CAT_LABELS } from '@/lib/engine';

const CAT_MASTER_TARGET = 5; // cards to master in one category for its badge

function masteredByCat(s) {
  const out = {};
  for (const [id, c] of Object.entries(s.cards)) {
    const q = byId[id];
    if (q && c.fixed) out[q.cat] = (out[q.cat] || 0) + 1;
  }
  return out;
}
const masteredTotal = (s) => Object.values(s.cards).filter((c) => c.fixed).length;
const hasSession = (s, kind) => (s.interview?.sessions || []).some((x) => x.kind === kind);

const BASE = [
  { id: 'first-set', title: 'First set', desc: 'Finish your first daily set', icon: 'Flag', test: (s) => Object.values(s.history).some((h) => h.setDone) },
  { id: 'streak-3', title: '3-day streak', desc: 'Practice 3 days in a row', icon: 'Flame', test: (s) => s.best >= 3 },
  { id: 'streak-7', title: '7-day streak', desc: 'Practice 7 days in a row', icon: 'Flame', test: (s) => s.best >= 7 },
  { id: 'streak-30', title: '30-day streak', desc: 'Practice 30 days in a row', icon: 'Flame', test: (s) => s.best >= 30 },
  { id: 'streak-100', title: '100-day streak', desc: 'Practice 100 days in a row', icon: 'Flame', test: (s) => s.best >= 100 },
  { id: 'first-mock', title: 'First mock', desc: 'Finish a mock interview', icon: 'Timer', test: (s) => hasSession(s, 'mock') },
  { id: 'first-story', title: 'First story', desc: 'Write a STAR story', icon: 'NotebookPen', test: (s) => (s.interview?.stories || []).length >= 1 },
  { id: 'mastered-1', title: 'First card mastered', desc: 'Pass a card\'s 30-day review', icon: 'Award', test: (s) => masteredTotal(s) >= 1 },
  { id: 'mastered-10', title: '10 cards mastered', desc: 'Master 10 cards', icon: 'Award', test: (s) => masteredTotal(s) >= 10 },
  { id: 'mastered-25', title: '25 cards mastered', desc: 'Master 25 cards', icon: 'Trophy', test: (s) => masteredTotal(s) >= 25 },
];

const CATS = Object.entries(CAT_LABELS).map(([cat, label]) => ({
  id: `cat-${cat}`,
  title: `${label} mastered`,
  desc: `Master ${CAT_MASTER_TARGET} ${label} cards`,
  icon: 'GraduationCap',
  test: (s) => (masteredByCat(s)[cat] || 0) >= CAT_MASTER_TARGET,
}));

export const BADGES = [...BASE, ...CATS];
export const badgeById = Object.fromEntries(BADGES.map((b) => [b.id, b]));

// Returns the state with any newly earned badges recorded, and the ids that are new.
export function awardBadges(s, today) {
  const have = s.badges || {};
  const earned = BADGES.filter((b) => !have[b.id] && b.test(s)).map((b) => b.id);
  if (!earned.length) return { state: s, earned };
  const badges = { ...have };
  for (const id of earned) badges[id] = today;
  return { state: { ...s, badges }, earned };
}
