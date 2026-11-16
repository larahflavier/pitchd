// Surprise bonus after the daily set. Shows up on roughly 1 day in 3, so it stays a surprise.
// It is never for sale and never a loot box: the reward is a fun fact or a bonus question worth 2x XP.

export const FACTS = [
  'STAR stands for Situation, Task, Action, Result. It is a simple way to structure behavioral answers.',
  'For "Tell me about yourself", try present, past, future: who you are now, what got you here, and why this role.',
  'Pausing to think before you answer is fine. A few quiet seconds feel longer to you than to the interviewer.',
  'Ending an interview with a thoughtful question shows you did your homework.',
  'A short thank-you email within a day of an interview is standard etiquette.',
  'Putting a number on a result, like "cut processing time by 20%", makes a story easier to remember.',
  'In a case interview, thinking out loud lets the interviewer follow your reasoning.',
  'The matching principle in accounting ties an expense to the revenue it helped earn.',
  'CAC is customer acquisition cost: sales and marketing spend divided by the new customers it won.',
  'Lead time is the time between placing an order and receiving it.',
  'A balance sheet always balances: assets equal liabilities plus equity.',
  'Many interviewers care more about how you reason than whether you land on a perfect answer.',
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Decided by the date, so reloading the page can't re-roll it.
export function bonusFor(s, today) {
  if (s.bonus?.date === today) return null; // already opened today
  const h = hash(`${today}|${s.name}|${s.streak}`);
  if (h % 3 !== 0) return null;
  return { kind: (h >>> 3) % 2 ? 'question' : 'fact', fact: FACTS[(h >>> 5) % FACTS.length] };
}

export const claimBonus = (s, kind, today) => ({ ...s, bonus: { date: today, kind } });
