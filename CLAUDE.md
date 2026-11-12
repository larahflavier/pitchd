# Pitchd

3-minute daily interview prep for business students. Next.js 14 (App Router), plain JavaScript (no TypeScript), no backend yet. Progress lives in localStorage under the key `pitchd:v1`.

## Layout

- `app/page.js`: top-level state and screen routing (onboarding, home, quiz, summary, review, progress)
- `components/Screens.js`: Onboarding, Home, Summary, Review, Progress
- `components/Quiz.js`: one question at a time with feedback
- `components/Mascot.js`: Pip, an inline SVG with moods `neutral`, `happy`, `oops`
- `lib/engine.js`: tracks, daily set building, spaced review (1, 3, 7 days), streaks, mastery
- `lib/utils.js`: `cn()` helper used by shadcn and 21st.dev components
- `data/questions.json`, `data/weekly.json`: question bank. Run `npm run validate` after editing.

## Design system

All tokens are in `app/globals.css` (`:root` and `@theme inline`). Use them; do not hard-code new hex values.

- App background `--app` #f4f5f9, cards white, borders `--line`
- Hero and highlight cards: `--periwinkle` #9aaeff
- Primary buttons: `--ink` #111318, fully rounded pills
- Correct answers and streaks: `--teal`; wrong answers: `--red`; review badges: `--orange`
- Font: Plus Jakarta Sans Variable, weights 500–700. Avoid 800.
- Icons: `lucide-react` only. No emoji in the UI.
- Flat style: no gradients, no tinted drop shadows. Separate cards with color, not shadow.

Older screens still use the class names in the `@layer components` block of `globals.css`. New or rebuilt UI should use Tailwind utilities with the tokens (`bg-periwinkle`, `text-ink`, `border-line`, etc.).

shadcn is configured in `components.json` with `tsx: false`, so components added with `npx shadcn@latest add ...` (including 21st.dev URLs) come in as `.jsx` under `components/ui`.

## Visual target

Flat, rounded mobile layout: light grey background, periwinkle feature card, black pill buttons, line icons in white circles, progress rings, colored category cards. Reference image: `design-reference.png` in the repo root if present.

## Next steps

1. Rebuild Home: action card at the top (title, black pill "Start" button, progress ring for today's set), weekly card, review card, week strip. Make Pip smaller.
2. Redraw Pip with flat fills to match the style (no gradient body or gloss).
3. Add 21st.dev components for the progress ring, category cards, and the set-complete screen.
4. Review tab: due-today list, missed list filtered by category, accuracy stats.
5. Later: Supabase accounts and database, mock interview mode, Stripe.

## Rules

- Work on a branch, not `main`. `main` is the live app on Vercel.
- Keep the quiz screens fast. Animation goes on transitions and the completion screen, not on answering.
- Run `npm run build` and `npm run validate` before committing.
