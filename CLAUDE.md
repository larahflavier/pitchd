# Pitchd

3-minute daily interview prep for business and engineering students. Next.js 14 (App Router), plain JavaScript (no TypeScript), no backend yet. Progress lives in localStorage under the key `pitchd:v2` (older `pitchd:v1` data is migrated on load).

Specs: `docs/PRODUCT_PLAN.md` (features and science) and `docs/FUNK_PASS_PLAN.md` (how the app looks and moves). If they disagree on features, the product plan wins. If they disagree on visuals or motion, the funk pass plan wins.

## Layout

- `app/page.js`: top-level state and screen routing (landing, onboarding, home, quiz, summary, review, interview, progress, account)
- `app/about/`: the About page (`/about`). `copy.js` is generated word for word from section 9 of the product plan.
- `components/Screens.js`: Home and Progress. `components/Summary.js`: set-complete screen.
- `components/Landing.js`, `Onboarding.js`: landing page and the 9-step onboarding
- `components/Quiz.js`: one question at a time with feedback. `Review.js` and `ReviewDeck.js`: card decks, flip and swipe.
- `components/Interview.js`, `InterviewSession.js`, `StoryBuilder.js`: drills, mock interviews, STAR stories (self-check only)
- `components/Account.js`, `TabBar.js`, `SoundToggle.js`, `Celebrations.js`, `Badges.js`, `SkillMap.js`
- `components/Roadmap.js`: the study plan roadmap on the Progress tab (not the "work in progress" page)
- `components/Mascot.js`: Pip, an inline SVG with moods `neutral`, `happy`, `oops`
- `components/ui/`: `ProgressRing`, `button-styles.js`, `Sticker`, `PeekEyes`, `StackCard`
- `lib/engine.js`: tracks, daily set building, spaced review (1, 3, 7, 14, 30 days), streaks, mastery
- `lib/storage.js`: `pitchd:v2` load, save, v1 migration, and cleanup of bad data
- `lib/curriculum.js`, `gamify.js`, `badges.js`, `bonus.js`, `interview.js`, `profile.js`: plan, XP and streak freezes, badges, surprise bonus, interview logic, option lists
- `lib/sound.js`, `lib/celebrate.js`: Web Audio sounds and confetti
- `lib/utils.js`: `cn()` helper used by shadcn and 21st.dev components
- `data/questions.json`, `data/weekly.json`: question bank. Run `npm run validate` after editing. New questions start with `reviewedBy: "pending"` until a person checks them.
- `public/brand/`: logo files (see Design system)
- The funk pass adds `components/{Splash,WorkInProgress}.js`, `lib/motion.js`, `lib/pip.js`, and `data/roadmap.json` as its steps land.

## Design system

All tokens are in `app/globals.css` (`:root` and `@theme inline`). Use them; do not hard-code new hex values.

- App background `--app` #f4f5f9, cards white (`--surface`), borders `--line`
- Logo palette: `--royal` (splash, hero cards, headings, button text and outlines), `--azure` (feature cards, progress fills), `--azure-soft` (chips, selected states), `--cyan` (primary button fill, correct answers, streaks), `--cyan-soft` (correct-answer panel)
- Cyan is a fill. Never use it as text or an icon on a light background (about 1.8:1). Use `--royal` text on cyan. White text on royal and on azure both pass.
- Old names `--periwinkle`, `--periwinkle-soft`, `--periwinkle-strong`, `--teal`, `--teal-soft` still work as aliases of the new tokens. They are removed in funk pass step F10, so use the new names in new code.
- Primary buttons: cyan pill, royal text, 2px royal border (use `PRIMARY` and `SIZE` from `components/ui/button-styles.js`). Secondary: white pill, 2px royal border (`SECONDARY`).
- Wrong answers: `--red`; review badges: `--orange`. Right and wrong never rely on color alone: use a `Check` or `X` icon too.
- Font: Plus Jakarta Sans Variable, weights 500–700. Avoid 800.
- Icons: `lucide-react` only. No emoji in the UI.
- Flat style: no gradients, no tinted drop shadows. Separate cards with color, not shadow. Stickers use a 2px royal outline.
- Logo files are in `public/brand/`. The logo appears on the splash and onboarding only. The logo's gradient stays inside the image files; the UI stays flat.
- Motion: use `lib/motion.js` springs. Animate only transform and opacity. Nothing animates before the answer state paints. Respect reduced motion.

Older screens still use the class names in the `@layer components` block of `globals.css`. New or rebuilt UI should use Tailwind utilities with the tokens (`bg-royal`, `text-royal`, `border-line`, etc.).

shadcn is configured in `components.json` with `tsx: false`, so components added with `npx shadcn@latest add ...` (including 21st.dev URLs) come in as `.jsx` under `components/ui`.

## Visual target

Flat, rounded mobile layout led by the Pitchd logo colors: royal and azure blocks, cyan highlights, stickers, tilted stacked cards, mascot that moves. Reference image: `design-reference.png` in the repo root if present.

## Not built, by design

Accounts, payments, AI feedback, school leagues, Pip outfits, and the Pip redraw. They appear on the Work in progress page (`data/roadmap.json`). Do not add UI that implies they work.

## Next steps

1. The funk pass: F1 to F10 in `docs/FUNK_PASS_PLAN.md`.
2. Redraw Pip with flat fills (the funk pass covers the recolor and movement; the full redraw stays queued).
3. Later: Supabase accounts and database, AI feedback, Stripe.

## Rules

- Work on a branch, not `main`. `main` is the live app on Vercel.
- Keep the quiz screens fast. Animation goes on transitions and the completion screen, not on answering.
- Never run `npm run build` while the dev server is running. Stop it, build, then restart it.
- Run `npm run build` and `npm run validate` before committing.
