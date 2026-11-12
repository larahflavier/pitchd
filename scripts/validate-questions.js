// Run with: npm run validate
const q = require('../data/questions.json');
const w = require('../data/weekly.json');

const CATS = ['behavioral', 'basics', 'news', 'accounting', 'marketing', 'supplychain', 'management'];
const errors = [];
const ids = new Set();

for (const item of q) {
  if (ids.has(item.id)) errors.push(`duplicate id ${item.id}`);
  ids.add(item.id);
  if (!CATS.includes(item.cat)) errors.push(`${item.id}: bad cat ${item.cat}`);
  if (!item.q || !item.a || !item.e) errors.push(`${item.id}: missing q/a/e`);
  if (!Array.isArray(item.w) || item.w.length !== 3) errors.push(`${item.id}: needs exactly 3 wrong answers`);
  else if (new Set([item.a, ...item.w]).size !== 4) errors.push(`${item.id}: duplicate options`);
}
for (const item of w) {
  if (!item.weekOf || !item.q || !item.a || item.w?.length !== 3) errors.push(`weekly ${item.weekOf}: malformed`);
}

const counts = {};
for (const item of q) counts[item.cat] = (counts[item.cat] || 0) + 1;
console.log('Questions:', q.length, counts, '| weekly cards:', w.length);
console.log('Flagged for review:', q.filter((x) => x.flag).length, '+', w.filter((x) => x.flag).length, 'weekly');

if (errors.length) {
  console.error('\nERRORS:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('OK');
