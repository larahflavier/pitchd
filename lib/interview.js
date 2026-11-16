// Interview practice logic: drills, mock interviews, STAR stories. Self-check only, no AI.
// Pure functions (plus the question bank import), so this can move to a server later.
import QUESTIONS from '@/data/questions.json';
import { shuffle } from '@/lib/engine';
import { mondayOf } from '@/lib/curriculum';
import { XP, awardXp } from '@/lib/gamify';

/* --------------------------- free vs premium ---------------------------- */
export const FREE_STORY_LIMIT = 2;
export const FREE_MOCKS_PER_WEEK = 1;
export const STORY_TARGET = 6; // the plan suggests writing 5-6 stories
export const isPremium = (s) => s.tier === 'premium';

/* ------------------------ behavioral prompts --------------------------- */
// Generic STAR key points. A draft for a person to review before launch.
const STAR_POINTS = [
  'Sets the scene with one specific situation, not a general habit',
  'Says what the task or goal was',
  'Describes what you personally did, in first person ("I", not "we")',
  'Ends with a clear result, ideally with a number',
];

// Each prompt doubles as a story theme: a story is tagged with the themes it can answer.
export const THEMES = [
  {
    id: 'leadership', label: 'Leadership',
    q: 'Tell me about a time you led a team.',
    model: 'Pick one real moment where you guided others toward a goal. Name the goal, how you got people moving, and what changed because of it.',
    extra: 'Shows how you motivated or coordinated other people',
    keywords: ['led', 'lead', 'leading', 'leader', 'captain', 'president', 'organized', 'delegated', 'team', 'managed', 'coordinated'],
  },
  {
    id: 'conflict', label: 'Conflict',
    q: 'Tell me about a time you disagreed with a teammate.',
    model: 'Show you can disagree without drama: you listened first, found the real issue, and reached a result both sides could live with.',
    extra: 'Treats the other person fairly and focuses on the issue',
    keywords: ['disagree', 'conflict', 'argument', 'tension', 'clash', 'difficult', 'teammate', 'resolved'],
  },
  {
    id: 'failure', label: 'Failure',
    q: 'Tell me about a time you failed or made a mistake.',
    model: 'Pick a real, modest mistake. Own it without blaming others, say what you fixed, and give one lesson you now use.',
    extra: 'Owns the mistake and names a concrete lesson',
    keywords: ['mistake', 'mistakes', 'failed', 'failure', 'missed', 'wrong', 'lesson', 'error', 'fell short'],
  },
  {
    id: 'deadline', label: 'Tight deadline',
    q: 'Tell me about a time you worked under a tight deadline.',
    model: 'Show how you prioritized: what you cut, what you protected, and how you delivered on time.',
    extra: 'Explains how you prioritized under pressure',
    keywords: ['deadline', 'last minute', 'overnight', 'rush', 'tight', 'pressure', 'due', 'urgent'],
  },
  {
    id: 'persuasion', label: 'Persuasion',
    q: 'Tell me about a time you persuaded someone.',
    model: 'Start from what the other person cared about, then show how you made your case with evidence they would trust.',
    extra: 'Tailors the pitch to what the other person cares about',
    keywords: ['convince', 'persuade', 'pitch', 'proposal', 'buy-in', 'sell', 'presented', 'influence'],
  },
  {
    id: 'learning', label: 'Learning fast',
    q: 'Tell me about a time you learned something quickly.',
    model: 'Show your method: how you broke the topic down, where you practiced, and how you proved you had learned it.',
    extra: 'Explains how you learned, not just that you did',
    keywords: ['learned', 'learn', 'teach myself', 'taught myself', 'picked up', 'new tool', 'self-taught', 'quickly', 'course', 'tutorial'],
  },
  {
    id: 'initiative', label: 'Initiative',
    q: 'Tell me about a time you took initiative.',
    model: 'Show you spotted something nobody asked you to fix, acted on it, and made it stick.',
    extra: 'Spots a problem on your own and acts without being asked',
    keywords: ['initiative', 'started', 'launched', 'noticed', 'proposed', 'on my own', 'volunteered', 'created'],
  },
  {
    id: 'analysis', label: 'Using data',
    q: 'Tell me about a time you used data to solve a problem.',
    model: 'Name the question, what data you used and why, what it showed, and the decision it changed.',
    extra: 'Connects the data to a decision or outcome',
    keywords: ['data', 'analysis', 'spreadsheet', 'excel', 'numbers', 'analyzed', 'model', 'metrics'],
  },
];
export const themeById = Object.fromEntries(THEMES.map((t) => [t.id, t]));

function behavioralItem(theme) {
  return {
    id: 'beh-' + theme.id,
    kind: 'behavioral',
    cat: 'behavioral',
    q: theme.q,
    model: theme.model,
    explanation: 'Use the STAR structure: Situation, Task, Action, Result. Keep it under two minutes.',
    keyPoints: [...STAR_POINTS, theme.extra],
  };
}

function bankItem(q) {
  return {
    id: q.id,
    kind: 'technical',
    cat: q.cat,
    q: q.q,
    model: q.a,
    explanation: q.e || '',
    // human-written key points when the question has them; otherwise the self-check is a 3-step rating
    keyPoints: Array.isArray(q.keyPoints) && q.keyPoints.length ? q.keyPoints : null,
  };
}

function technicalPool(track, rng) {
  // questions with key points first, then the rest, each group shuffled
  const pool = shuffle(QUESTIONS.filter((q) => q.cat === track), rng);
  return [...pool.filter((q) => q.keyPoints?.length), ...pool.filter((q) => !q.keyPoints?.length)];
}

/* ------------------------------ sessions -------------------------------- */
export const COMPANY_TYPES = [
  { id: 'bank', label: 'Bank', behavioral: 0.3 },
  { id: 'consulting', label: 'Consulting firm', behavioral: 0.5 },
  { id: 'big4', label: 'Big 4 / accounting', behavioral: 0.35 },
  { id: 'corporate', label: 'Corporate', behavioral: 0.4 },
  { id: 'startup', label: 'Startup', behavioral: 0.5 },
];
export const MOCK_LENGTHS = [
  { minutes: 10, count: 5 },
  { minutes: 20, count: 8 },
];
export const secondsPerAnswer = (len) => Math.round((len.minutes * 60) / len.count);

// 3 questions: one behavioral, two from the user's track
export function buildDrill(track, rng = Math.random) {
  const theme = shuffle(THEMES, rng)[0];
  const tech = technicalPool(track, rng).slice(0, 2).map(bankItem);
  return [behavioralItem(theme), ...tech];
}

export function buildMock({ track, company, minutes }, rng = Math.random) {
  const len = MOCK_LENGTHS.find((l) => l.minutes === minutes) || MOCK_LENGTHS[0];
  const co = COMPANY_TYPES.find((c) => c.id === company) || COMPANY_TYPES[3];
  const nBeh = Math.min(THEMES.length, Math.max(1, Math.round(len.count * co.behavioral)));
  const beh = shuffle(THEMES, rng).slice(0, nBeh).map(behavioralItem);
  const tech = technicalPool(track, rng).slice(0, len.count - nBeh).map(bankItem);
  // a thin track: top up with more behavioral prompts so the mock is still full length
  const spare = THEMES.filter((t) => !beh.some((b) => b.id === 'beh-' + t.id)).map(behavioralItem);
  const items = [...beh, ...tech, ...spare].slice(0, len.count);
  return { items: shuffle(items, rng), seconds: secondsPerAnswer(len) };
}

// mark = { ticked: number[] (indexes into keyPoints), rating: 'nailed' | 'partly' | 'missed' | null }
const RATING = { nailed: 1, partly: 0.5, missed: 0 };
export function scoreItem(item, mark) {
  if (!mark) return 0;
  if (item.keyPoints) return item.keyPoints.length ? (mark.ticked?.length || 0) / item.keyPoints.length : 0;
  return RATING[mark.rating] ?? 0;
}
export function sessionEntry({ kind, track, company, minutes, items, marks, date }) {
  const scores = items.map((it, i) => Math.round(scoreItem(it, marks[i]) * 100) / 100);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  return {
    id: `${kind}-${Date.now()}`,
    kind,
    date,
    track,
    company: company || '',
    minutes: minutes || 0,
    score: Math.round(avg * 100),
    count: items.length,
    items: items.map((it, i) => ({ id: it.id, kind: it.kind, cat: it.cat, score: scores[i] })),
  };
}

// free users get one mock per Monday-to-Sunday week
export function mocksThisWeek(s, today) {
  const monday = mondayOf(today);
  return (s.interview?.sessions || []).filter((x) => x.kind === 'mock' && x.date >= monday).length;
}
export function canStartMock(s, today) {
  return isPremium(s) || mocksThisWeek(s, today) < FREE_MOCKS_PER_WEEK;
}
export function canAddStory(s) {
  return isPremium(s) || (s.interview?.stories || []).length < FREE_STORY_LIMIT;
}

/* ------------------------------- stories -------------------------------- */
export const STORY_CHECKS = [
  'The situation is one specific moment',
  'My task or goal is clear',
  'My actions use "I", not "we"',
  'The result has a number or a clear outcome',
  'I can tell it in about two minutes',
];

// keyword match against the story text: the top themes with at least one hit
export function suggestTags(story) {
  const text = [story.situation, story.task, story.action, story.result].join(' ').toLowerCase();
  return THEMES
    .map((t) => ({ id: t.id, hits: t.keywords.filter((k) => new RegExp(`\\b${k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text)).length }))
    .filter((x) => x.hits > 0)
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 3)
    .map((x) => x.id);
}
export const storyTags = (story) => (story.tagsAuto === false ? story.tags : suggestTags(story));

export function emptyStory() {
  return { id: '', title: '', situation: '', task: '', action: '', result: '', tags: [], tagsAuto: true, checks: [], updated: null };
}

/* ------------------------- state updates (pure) ------------------------- */
const cap = (arr, n) => arr.slice(Math.max(0, arr.length - n));
export function addSession(s, entry) {
  const iv = s.interview || { sessions: [], stories: [] };
  const next = { ...s, interview: { ...iv, sessions: cap([...iv.sessions, entry], 200) } };
  return awardXp(next, Math.round(entry.score * XP.interviewRate), entry.date); // XP for accuracy, not speed
}
export function upsertStory(s, story) {
  const iv = s.interview || { sessions: [], stories: [] };
  const exists = iv.stories.some((x) => x.id === story.id);
  const stories = exists ? iv.stories.map((x) => (x.id === story.id ? story : x)) : [...iv.stories, story];
  return { ...s, interview: { ...iv, stories } };
}
export function deleteStory(s, id) {
  const iv = s.interview || { sessions: [], stories: [] };
  return { ...s, interview: { ...iv, stories: iv.stories.filter((x) => x.id !== id) } };
}

// Stories as cards for the Review tab's "My stories" deck
export function storyCards(s) {
  return (s.interview?.stories || []).map((st) => ({
    id: 'story-' + st.id,
    cat: 'behavioral',
    q: `Walk me through: ${st.title || 'Untitled story'}`,
    a: `Situation: ${st.situation || '-'}\nTask: ${st.task || '-'}\nAction: ${st.action || '-'}\nResult: ${st.result || '-'}`,
    e: '',
  }));
}
