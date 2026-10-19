# Pitchd

3-minute daily interview prep for business students. Next.js 14 (App Router), no backend, no accounts. Progress and streaks live in the browser's localStorage.

## What's in it

- **Daily set**: 5 questions (2 shared: behavioral, basics, or news, plus 3 from your track). Tracks: Accounting, Marketing, Supply Chain, Management.
- **Streaks**: complete the daily set to extend. Extra practice does not count.
- **Missed-question review**: a miss returns after 1 day. Get it right and it returns after 3, then 7, then it's marked fixed. Miss it again and the ladder restarts. Up to 2 due reviews are folded into each daily set.
- **Mastery**: accuracy by category (Behavioral, Business Basics, News, your track).
- **This Week in Business**: one news card, chosen from `data/weekly.json` by `weekOf` date.
- **Copy my stats** (Progress tab): friends can paste a summary back to you for the pilot.
- **Pre-selected track links**: `https://YOUR-URL/?track=accounting` (also `marketing`, `supplychain`, `management`).

## Editing content

- Questions: `data/questions.json`. Each has `cat`, `q`, `a` (correct), `w` (exactly 3 wrong answers), `e` (explanation). Options are shuffled at runtime. A `flag` field is a note for the reviewer and is never shown to users.
- Weekly card: add an entry to `data/weekly.json` with `weekOf` set to a Monday (YYYY-MM-DD). The newest entry on or before today is shown. **The three seeded entries are placeholders. Replace them with real headlines.**
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
