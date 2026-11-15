// Option lists for onboarding and the Account tab. Plain data, no React.

export const SCHOOLS = ['Lehigh', 'Lafayette', 'Penn', 'Villanova', 'Princeton', 'Drexel', 'Other'];
export const YEARS = ['First-year', 'Sophomore', 'Junior', 'Senior', 'Grad'];

export const GOALS = [
  { id: 'internship', label: 'Internship', phrase: 'an internship' },
  { id: 'fulltime', label: 'Full-time', phrase: 'a full-time role' },
  { id: 'coop', label: 'Co-op', phrase: 'a co-op' },
];
export const INDUSTRIES = [
  { id: 'banking', label: 'Banking' },
  { id: 'consulting', label: 'Consulting' },
  { id: 'accounting', label: 'Accounting' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'other', label: 'Other' },
];

export const TIMELINES = [
  { id: 'date', label: 'I have a date' },
  { id: 'month', label: 'This month' },
  { id: 'semester', label: 'This semester' },
  { id: 'year', label: 'Next year' },
  { id: 'unsure', label: 'Not sure' },
];

export const MINUTES = [3, 5, 10];
export const REMIND_TIMES = [
  { time: '08:00', label: 'Morning' },
  { time: '12:30', label: 'Lunch' },
  { time: '19:00', label: 'Evening' },
  { time: '21:30', label: 'Night' },
];

// Majors from the product plan that have no questions yet. Shown disabled in onboarding.
export const MAJORS_SOON = ['Economics', 'Business Analytics', 'Consulting', 'Civil/Environmental', 'Chemical', 'Bioengineering'];

// "land an internship in banking"
export function goalPhrase(goal, industry) {
  const g = GOALS.find((x) => x.id === goal);
  const i = INDUSTRIES.find((x) => x.id === industry);
  const base = g ? g.phrase : 'the role you want';
  return `land ${base}${i && i.id !== 'other' ? ` in ${i.label.toLowerCase()}` : ''}`;
}
