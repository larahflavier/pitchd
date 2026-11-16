# Pitchd

3-minute daily interview prep for business and engineering students. Next.js 14 (App Router), no backend, no accounts. Progress and streaks live in the browser's localStorage (`pitchd:v2`).

## What's in it

- **Daily set**: sized to the minutes you pick (5, 8, or 16 questions), built from a rule-based study plan for your track, goal, and interview date. Tracks: Accounting, Finance, Marketing, Supply Chain, Management, Mechanical, Electrical/Computer, Industrial & Systems.
- **Streaks**: finish the daily set to extend. A missed day is covered by a streak freeze (1 a week). Extra practice does not count.
- **Review**: a missed question returns after 1, 3, 7, 14, then 30 days, and is mastered after the 30-day review. Review cards flip and swipe, and there is a Missed list you can filter by category.
- **Interview practice**: quick drills, mock interviews, and a STAR story builder. All self-check, no AI.
- **Progress**: study plan, XP and levels, badges, a skill map, and accuracy by category.
- **This Week in Business**: one news card, chosen from `data/weekly.json` by `weekOf` date.
- **Account tab**: profile, goals (editing rebuilds the plan), reminders, sound, and "Download my data" or "Copy my stats" for the pilot.
- **Pre-selected track links**: `https://YOUR-URL/?track=accounting` (also `finance`, `marketing`, `supplychain`, `management`, `mechanical`, `electrical`, `industrial`).

## Not built yet

Accounts and sync, Premium (payments), AI feedback, school leagues, Pip outfits, and the Pip redraw. They appear inside the app on the Work in progress page, which reads `data/roadmap.json`. Change a status there to "in-progress" or "live" when one ships. Keep this list in sync with `docs/PRODUCT_PLAN.md`.

## Editing content

- Questions: `data/questions.json`. Each has `cat`, `q`, `a` (correct), and `e` (explanation). Multiple-choice questions also have `w` (exactly 3 wrong answers). Options are shuffled at runtime. New questions use the extended fields (`track`, `type`, `difficulty`, `keyPoints`, `tier`, `reviewedBy`, ...) and start with `reviewedBy: "pending"` until a person checks them. A `flag` field is a note for the reviewer and is never shown to users.
- Weekly card: add an entry to `data/weekly.json` with `weekOf` set to a Monday (YYYY-MM-DD). The newest entry on or before today is shown. **The three seeded entries are placeholders. Replace them with real headlines.**
- Work in progress page: edit `data/roadmap.json` (the six items and their statuses).
- After editing, run `npm run validate`.

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build check
```

## Deploy (new GitHub repo + separate Vercel project)

```bash
cd pitchd
git init
git add .
git commit -m "Pitchd MVP"
git branch -M main
# create an empty repo named `pitchd` on github.com first, then:
git remote add origin https://github.com/<your-username>/pitchd.git
git push -u origin main
```

Then on vercel.com: **Add New → Project → Import `pitchd`**. Framework is auto-detected as Next.js; leave defaults and deploy. This creates a separate project from Line Item.

## Known limits (v1)

- No push reminders. Your daily text is the reminder; users can add the site to their home screen.
- Progress is per device and per browser. Clearing site data or switching phones resets it.
- No server-side tracking: pilot data comes from the Copy my stats text.
