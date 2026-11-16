// Run with: npm run validate
//
// Checks data/questions.json and data/weekly.json.
// Errors stop the build. Warnings (like questions still pending review) do not.
//
// Question fields:
//   required: id, cat, q, a
//   mcq (the default type): w (exactly 3 wrong answers) and e (explanation)
//   open / behavioral: keyPoints (3 or more, written by a person)
//   optional: track, type, difficulty (1-3), tags, tier, source, reviewedBy, reviewedAt, flag
//   Questions that use any new field must have reviewedBy. Older questions without the new
//   fields still work and are counted in a warning.
const q = require('../data/questions.json');
const w = require('../data/weekly.json');

const CATS = [
  'behavioral', 'basics', 'news',
  'accounting', 'finance', 'marketing', 'supplychain', 'management',
  'mechanical', 'electrical', 'industrial',
  'engfund', 'project',
];
const TRACKS = ['accounting', 'finance', 'marketing', 'supplychain', 'management', 'mechanical', 'electrical', 'industrial', 'engineering', 'shared'];
const TYPES = ['mcq', 'open', 'flashcard', 'behavioral'];
const TIERS = ['free', 'premium'];
const NEW_FIELDS = ['track', 'type', 'difficulty', 'keyPoints', 'tags', 'tier', 'source', 'reviewedBy', 'reviewedAt'];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const errors = [];
const warnings = [];
const ids = new Set();
const texts = new Map();
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

let legacyNoReview = 0;
const pending = {};
const isStr = (x) => typeof x === 'string' && x.trim().length > 0;

for (const item of q) {
  const at = item.id || '(no id)';
  if (!isStr(item.id)) errors.push('a question has no id');
  else if (ids.has(item.id)) errors.push(`duplicate id ${item.id}`);
  else ids.add(item.id);

  if (!CATS.includes(item.cat)) errors.push(`${at}: bad cat ${item.cat}`);
  if (!isStr(item.q)) errors.push(`${at}: missing q`);
  else {
    const key = norm(item.q);
    if (texts.has(key)) errors.push(`${at}: same question text as ${texts.get(key)}`);
    else texts.set(key, at);
  }
  if (!isStr(item.a)) errors.push(`${at}: missing a`);

  const type = item.type || 'mcq';
  if (!TYPES.includes(type)) errors.push(`${at}: bad type ${item.type}`);

  if (type === 'mcq') {
    if (!isStr(item.e)) errors.push(`${at}: missing e (explanation)`);
    if (!Array.isArray(item.w) || item.w.length !== 3) errors.push(`${at}: needs exactly 3 wrong answers`);
    else if (new Set([item.a, ...item.w]).size !== 4) errors.push(`${at}: duplicate options`);
  } else if (item.w !== undefined && !Array.isArray(item.w)) {
    errors.push(`${at}: w must be a list`);
  }

  if (type === 'open' || type === 'behavioral') {
    if (!Array.isArray(item.keyPoints) || item.keyPoints.length < 3) errors.push(`${at}: ${type} questions need 3 or more keyPoints`);
  }
  if (item.keyPoints !== undefined && (!Array.isArray(item.keyPoints) || !item.keyPoints.every(isStr))) errors.push(`${at}: keyPoints must be a list of text`);

  if (item.track !== undefined && !TRACKS.includes(item.track)) errors.push(`${at}: bad track ${item.track}`);
  if (item.difficulty !== undefined && ![1, 2, 3].includes(item.difficulty)) errors.push(`${at}: difficulty must be 1, 2, or 3`);
  if (item.tier !== undefined && !TIERS.includes(item.tier)) errors.push(`${at}: bad tier ${item.tier}`);
  if (item.tags !== undefined && (!Array.isArray(item.tags) || !item.tags.every(isStr))) errors.push(`${at}: tags must be a list of text`);
  if (item.source !== undefined && !isStr(item.source)) errors.push(`${at}: source must be text`);

  // engineering shared categories need to say which track they belong to
  if ((item.cat === 'engfund' || item.cat === 'project') && !item.track) errors.push(`${at}: ${item.cat} questions need a track`);

  // review: a person has to check every new question before it goes live
  const usesNew = NEW_FIELDS.some((f) => item[f] !== undefined);
  if (usesNew) {
    if (!isStr(item.reviewedBy)) errors.push(`${at}: reviewedBy is required (use "pending" until someone checks it)`);
    else if (item.reviewedBy === 'pending') {
      const k = item.track || item.cat;
      pending[k] = (pending[k] || 0) + 1;
    } else if (!DATE.test(item.reviewedAt || '')) errors.push(`${at}: reviewed by ${item.reviewedBy} but reviewedAt is not a date (YYYY-MM-DD)`);
  } else if (item.reviewedBy === undefined) {
    legacyNoReview += 1;
  }
}

for (const item of w) {
  if (!item.weekOf || !item.q || !item.a || item.w?.length !== 3) errors.push(`weekly ${item.weekOf}: malformed`);
}

const pendingTotal = Object.values(pending).reduce((a, b) => a + b, 0);
if (pendingTotal) {
  const by = Object.entries(pending).map(([k, n]) => `${k} ${n}`).join(', ');
  warnings.push(`${pendingTotal} questions are pending review and should not go live yet: ${by}`);
}
if (legacyNoReview) warnings.push(`${legacyNoReview} older questions have no reviewedBy field (they still work)`);
const flagged = q.filter((x) => x.flag).length + w.filter((x) => x.flag).length;
if (flagged) warnings.push(`${flagged} questions are flagged for a second look`);

const counts = {};
const types = {};
for (const item of q) {
  counts[item.cat] = (counts[item.cat] || 0) + 1;
  const t = item.type || 'mcq';
  types[t] = (types[t] || 0) + 1;
}
console.log('Questions:', q.length, '| weekly cards:', w.length);
console.log('By category:', counts);
console.log('By type:', types);

if (warnings.length) console.warn('\nWARNINGS:\n' + warnings.map((x) => '  - ' + x).join('\n'));
if (errors.length) {
  console.error('\nERRORS:\n' + errors.map((x) => '  - ' + x).join('\n'));
  process.exit(1);
}
console.log('\nOK' + (warnings.length ? ' (with warnings)' : ''));
