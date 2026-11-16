# Pitchd Funk Pass: look, motion, mascot, and the "work in progress" page

Status: plan only, no code yet. Written Nov 15, 2026.
Builds on `docs/PRODUCT_PLAN.md` (structure, features, science). This file covers how the app looks and moves. If the two disagree on features, PRODUCT_PLAN.md wins. If they disagree on visuals or motion, this file wins.

## How Claude Code should use this file

1. Read this file and `CLAUDE.md`. Reply with a one-screen summary of the build order (section 10) and anything that conflicts with the current code. Do not code yet.
2. Build one step at a time (F1, F2, ...). After each step: `npm run build` (dev server stopped first), `npm run validate`, then ask me to check on localhost before committing. Commit each step separately on the working branch, never `main`.
3. Before step F3, open `components/Mascot.js` and list which parts of Pip are separate shapes (arms, tuft, eyes, belly) and which are one path. Say what can move. Do not redraw Pip. The redraw stays "not built" (section 9).
4. If a step needs a decision from the list in section 11, stop and ask with the default stated.

Guardrails that never change (from CLAUDE.md): flat fills, no gradients, no tinted drop shadows, `lucide-react` icons only, no emoji in the UI, tokens in `app/globals.css` only, quiz answering stays instant.

---

## 1. Creative direction

One line: **a friendly trading floor.** The app should feel like a fast morning on a desk: loud color blocks, a ticker running, a bell at open and close, and a mascot who is clearly in on it. The jokes are about markets. The tone toward the student stays kind.

What we take from the references:

| Reference | Take this | Skip this |
|---|---|---|
| Aptivo (coral cards) | Cards that have little eyes peeking over the top edge. Mascot peeking in from the screen edge on onboarding. | Kid-level copy |
| Charmi (blue + lime) | Acid lime on deep blue. Starburst and speech-bubble stickers ("Hello!", "Let's start!"). Date chips. Stacked, slightly tilted cards. Chunky headline type. | Pastel wellness mood |
| Loop (cream + blue) | Big mascot empty states that talk ("It's never too late to start a new thing"). Floating pill tab bar with a center action. | Thin outline icons |
| Neurotransmitter characters | Each character has a personality and a speech bubble. | A whole cast. We keep one mascot (Pip). |
| Duo | The mascot reacts to what you do on every screen, and moves. | Guilt-trip notifications |

Wall Street layer (details in section 4): ticker tape, opening and closing bell, a trade-slip summary, bull and bear colors, a 3:00 session clock.

What "funky" means in practice, so Claude Code can check itself:
- At least one screen element per screen is tilted, oversized, or overlapping its container (a sticker, a starburst, a card edge).
- No screen is only white cards on grey. Each screen has one big color block (navy, periwinkle, lime, or pink).
- Headlines are chunky and large. Body text stays calm.
- Something on every screen is alive (Pip idle, ticker moving, ring filling), without ever slowing a tap.

## 2. Color

Keep every token already in `app/globals.css`. Add these four to `:root` and `@theme inline` (names below are the tokens; do not hard-code the hex anywhere else):

| Token | Value | Use |
|---|---|---|
| `--navy` | #16205b | Dark hero surfaces: Home action card, set-complete, onboarding welcome, ticker bar |
| `--lime` | #c9f26b | Highlight on `--navy` or `--ink` only: Start pill on dark cards, completed week chips, combo chip, XP numbers |
| `--lime-soft` | #eefbc8 | Light version for chips on white |
| `--bull` / `--bear` | alias of `--teal` / `--red` | Names used in ticker and trade-slip code so the market metaphor reads in the source |

Rules:
- Max two loud colors on one screen (for example navy + lime, or periwinkle + pink).
- Lime is never used as text on white. On white, use `--ink` text on a `--lime-soft` chip.
- Primary buttons stay black pills (`--ink`). The one exception: on `--navy` surfaces the primary pill is `--lime` with `--ink` text.
- Category colors for cards (Accounting, Valuation, Markets, and so on): rotate periwinkle, pink, orange, teal, lime. Each category keeps the same color everywhere.
- Contrast: all text pairs must hit 4.5:1. Check lime on navy (passes) and ink on lime (passes).
- Still no gradients, no tinted shadows. Stickers get a 2px `--ink` outline instead of a shadow.

## 3. Type and shapes

Type:
- Add one display font for **headlines and big numbers only**: Bricolage Grotesque Variable (`@fontsource-variable/bricolage-grotesque`), weight 700. Body, buttons, and labels stay Plus Jakarta Sans 500–700.
- Add token `--font-display`. Tailwind class `font-display`.
- Use tabular numbers (`tabular-nums`) for XP, streak, timers, and ticker values so digits do not jump while counting.
- Headline sizes: screen title 28–32px, hero number 48–64px. Uppercase only for ticker symbols and sticker text.

Shapes (build as reusable components in `components/ui/`):
- `Sticker.js`: starburst (8–12 points) and speech-bubble variants, 2px ink outline, optional rotation prop (−12° to 12°). Text inside, one to three words.
- `PeekEyes.js`: two white circles with ink pupils, sits on the top edge of a card, blinks every 3–6 seconds (random), pupils drift toward the pointer or the last tap. Used on category cards on Home and Progress. Pure flat shapes, no outfit art.
- `StackCard.js`: card wrapper that can sit tilted (−2° to 2°) and overlap the card below by 16–24px, like the Charmi habit cards. Home and Review only. Never in the quiz.
- Corner radius: keep `--radius` (1.25rem) for cards, full pill for buttons and chips, 28px for hero cards.
- Wavy divider (Loop): one SVG wave under the Home hero. Optional, skip if it looks busy.

## 4. The Wall Street layer

Everything here is copy and small components. No real money, no gambling mechanics (no loot boxes, no random paid rewards).

**Ticker tape** (`components/ui/Ticker.js`)
- A thin `--navy` bar under the status area on Home only. Text scrolls left slowly (about 40px per second, CSS animation, paused when the tab is hidden and when reduced motion is on).
- Items are the user's own numbers written like tickers, each with a lucide `TrendingUp` (bull, teal) or `TrendingDown` (bear, red) icon:
  `STREAK 6 ▲` · `XP +20 ▲` · `DUE 3 ▼` · `MASTERED 12 ▲` · `WEEK: VALUATION`
  (Use the icons, not the ▲ ▼ characters.)
- Tapping an item jumps to its screen (streak to Progress, due to Review).

**Opening bell** (Home)
- The daily action card reads "Market open" with today's date, the set title, and the Start pill. Start label: "Ring the bell" on the first set of the day, "Practice 5 more" after.
- The first Start tap of the day plays the bell sound once and Pip rings it (a small arm swing, section 5).

**Closing bell** (set-complete screen, replaces the plain summary look)
- Navy full-screen. Pip celebrates. A "trade slip" card slides up:
  `TODAY'S CLOSE` · `Score 4/5` · `XP +20` · `Streak 7 days` · `Cards due tomorrow 3`
  Use a monospace-looking layout with tabular numbers. Dashed tear line at the top edge of the slip.
- Counting animation on XP and streak (0 to value in about 700ms).
- Copy for results: 5/5 "Perfect close.", 3–4 "Solid close.", 0–2 "Rough day. These come back tomorrow, that's the point."

**Session clock (opt-in "Pressure mode")**
- Setting in Account: Pressure mode, default off. When on, a 3:00 clock counts down at the top of the quiz. Running out ends the set with the answers given so far. No XP penalty, no streak penalty, no red flashing.
- Reason: time pressure builds interview realism but raises anxiety for some students, so it is a choice. Speed never earns XP (PRODUCT_PLAN.md 3.9 stays).

**Language bank** (use these, avoid inventing new jargon for every screen)
- Streak: "Position held" in the ticker only. Everywhere else it stays "streak".
- Due reviews: "Due today". Missed cards: "Back on the desk".
- Weekly theme: "Sector of the week".
- Mastered card: "Closed out".
- Keep headlines plain English. The market voice goes in stickers, the ticker, and the trade slip.

## 5. Pip moves (without a redraw)

Pip stays the current character. We animate it, we do not change its art. The redraw and outfits stay on the "not built" list (section 9). If Claude Code finds that arms, tuft, and eyes are separate shapes in `Mascot.js`, animate those parts. If something is one merged path, move the whole body only.

API:
```
<Mascot pose="idle" size={96} />   // pose controls the animation; mood still controls the face
```
Keep `mood` as is (`neutral`, `happy`, `oops`). Add `pose`. Export a hook `usePip()` from `lib/pip.js` with `pip.react('correct' | 'wrong' | 'combo' | 'complete' | 'bell')` so any screen can trigger a reaction without prop drilling.

Poses and what they do (all with the `motion` library, springs, transform and opacity only):

| Pose | When | Motion |
|---|---|---|
| `idle` | default | Slow breathing (scale 1 to 1.03, 3s loop). Blink every 3–5s (random). Tuft sways a few degrees. |
| `peek` | onboarding start, empty states | Slides in from the screen edge, eyes first, then body. Settles and does `wave`. |
| `wave` | welcome, new day | One arm swings three times (about 900ms total), body tilts 4°. |
| `bell` | first Start tap of the day | Arm swings once, small hop. Pairs with the bell sound. |
| `think` | while a question is on screen | Head tilt 6°, eyes look up and to the side. Subtle. |
| `hype` | correct answer | Hop (translateY −14px, squash 0.92 on landing), arms up, then back to idle. 450ms. |
| `combo` | 3 correct in a row (bigger at 5) | Higher hop with a spin of 360° at 5. Lime sparkle shapes burst out (flat star shapes). |
| `oops` | wrong answer | Slump (scale Y 0.94), one wobble, then eyes return to the correct answer's side. Never mocking. Back to idle in 600ms. |
| `celebrate` | set complete | Looping dance: side-to-side bounce with arms alternating, confetti burst once. |
| `sleepy` | streak at risk (evening, no set done) | Slow yawn, half-closed eyes, a small "zz" sticker. |
| `point` | Home, first visit each day | Arm points at the Start pill, small nudge toward it every 8s until tapped. |
| `tinker` | WIP page (section 9) | Slow side-to-side wobble with eyes up, a lucide `Wrench` icon floating beside, no hard hat (that would be an outfit). |

Placement and size:
- Quiz: small (56–72px) in a corner next to the question. Reactions play there and never cover the answers.
- Home: small, beside the action card title. Not the star of the screen.
- Onboarding, closing bell, WIP page, empty states: large (140–200px).
- Pip can travel: on Home, Pip walks (translateX, with a step bounce) from the left edge to sit beside the Start pill on first load. Max once per session.

Rules:
- Reactions never block input. Tapping Next cancels the current reaction immediately.
- Reactions start after the answer is already marked (right or wrong). The answer state paints first.
- Reduced motion: no movement. Swap to a static pose for the same mood.
- Keep reaction durations under 700ms in the quiz. Longer ones (celebrate, wave) only on non-quiz screens.

## 6. Interaction and transitions (no more fade left and right)

Install `motion` (it may already be installed from Phase 1 item 8b). Put shared springs and variants in `lib/motion.js` so every screen uses the same feel:

```
spring.snappy = { type: 'spring', stiffness: 420, damping: 30 }
spring.bouncy = { type: 'spring', stiffness: 380, damping: 16 }
spring.soft   = { type: 'spring', stiffness: 220, damping: 26 }
```

Screen-to-screen:

| From to | Transition |
|---|---|
| Home to Quiz | The action card expands to fill the screen (shared layout via `layoutId`), about 350ms. Pip rides along. |
| Question to next question | Question card stack: current card flies up and off (about 200ms), next card scales in from 0.94 underneath. Answers stay still. |
| Quiz to closing bell | Screen wipes to navy from the bottom. Pip drops in with a bounce, slip slides up. |
| Tab to tab | Crossfade plus 8px rise (150ms). No horizontal slide. The tab indicator pill slides between tabs (`layoutId`) and the icon does a small bounce. |
| Onboarding step to step | Pip hops to the new position and does a pose. Content pops in with `spring.bouncy`, 40ms stagger per element. |
| Sheets (level-up, badge, review rating) | Slide up from the bottom, drag down to dismiss. |
| Lists (Home cards, Review due list, Progress tiles) | Stagger in, 30ms per item, once per visit. |

Micro-interactions:
- Every tappable element: press scale 0.97 with `spring.snappy`. Release springs back.
- Answer pills: selected state paints on the same frame as the tap. After that, correct gets a color wipe from the tap point and a check pop. Wrong gets a two-cycle shake (about 250ms). Flourish only after the state change, never before.
- Progress ring and bars fill with `spring.soft`. Numbers count up with tabular digits.
- Tab bar: floating pill (Loop style), `--ink` background, active tab shown as a `--lime` circle with an `--ink` icon. The Interview tab can be the raised center action.
- Week strip chips: done days lime, today ink, future grey. Tapping today bounces the chip.
- Pull-to-refresh is not needed. Skip it.
- Haptics: `navigator.vibrate(10)` on correct and 20 on wrong, Android only, behind the same sound and haptics toggle. iOS ignores it, that is fine.

Performance budget:
- Only animate `transform` and `opacity`. No layout-thrashing animation.
- No animation longer than 400ms except celebrate, ticker, and idle loops.
- Idle loops pause when the tab is hidden and when reduced motion is on.
- Quiz answer tap to visual change must stay under one frame. If a change makes answering feel slower, remove the animation.

## 7. Screen by screen

**Onboarding**
- Welcome: full `--navy`. Pip peeks in from the bottom edge, waves. Big headline in `font-display`: "Interview prep that moves fast." Speech-bubble sticker "Let's start!" tilted next to Pip. Lime pill: "Get started".
- Each step: Pip in the corner reacts to the choice (hop on select). Major and school choices are colored tiles with PeekEyes. Progress dots are replaced by a thin lime bar on navy.
- Sound toggle visible top right from the first screen (from PRODUCT_PLAN.md decision 7).

**Home**
- Top: ticker tape bar.
- Hero: `--navy` action card, "Market open" label, set title in `font-display`, lime Start pill, progress ring (lime on a navy track). Pip small beside the title, `point` pose on first visit each day.
- Below: category cards as a stack with slight tilt and PeekEyes, each in its category color. Weekly card ("Sector of the week") as a periwinkle card with a starburst sticker. Review card with orange "Due today" count.
- Week strip: Charmi-style chips.
- Floating pill tab bar at the bottom.

**Quiz**
- Question in a big white card on a colored backdrop (the category color, soft version). Category sticker top left. Combo chip top right (lime). Pip small, bottom of the question card, `think` pose.
- Answers: tall pills, bold. Same instant selection as now.
- Top bar: thin segmented progress (5 segments) in lime on navy, or ink on white. Optional 3:00 clock when Pressure mode is on.
- Feedback sheet after answering: teal or red-soft panel with one line of method praise (PRODUCT_PLAN.md 3.9) and a Next pill.

**Closing bell (summary)**: section 4. Review-due teaser at the bottom ("3 cards due tomorrow") as a tappable orange chip.

**Interview tab**: mode cards as stacked tilted cards (Story bank, Mock, Drill). Locked premium modes show a small lock icon and open the WIP page (section 9) instead of a paywall.

**Review tab**: due cards shown as a deck. Swipe right = Got it, swipe left = Missed, with the card tilting under the finger and a stamp ("CLOSED OUT" / "BACK ON THE DESK") fading in. Buttons also available for accessibility. "Back on the desk" list below, filterable by category chip.

**Progress tab**: skill map as colored tiles with PeekEyes that fill as cards are mastered. Streak as a big `font-display` number on a navy card with a lime flame (lucide `Flame`). Badges grid: unlocked ones in color, locked ones grey with a lock.

**Account tab**: profile card on periwinkle, settings list (sound, haptics, Pressure mode, reduced motion follows the system), "What's coming" row that opens the WIP page.

**About page**: keep as planned in PRODUCT_PLAN.md section 9. Give it the same hero treatment (navy header, sticker headings).

## 8. Sound and haptics

Builds on PRODUCT_PLAN.md decision 7 (sounds on by default, a mute button visible on open).
- Sound list (short, under 400ms except the bell): `tick` (ticker item change, very quiet), `pop` (correct), `thud` (wrong, soft), `combo` (rising two-note), `bell` (opening and closing bell, up to 1.2s), `whoosh` (card stack fly-off).
- Generate with the Web Audio API (no audio files to ship) unless that sounds cheap on test; if so, ask me before adding files.
- One master toggle plus a separate haptics toggle in Account. Both stored in `pitchd:v2`.
- Sound never plays before the answer is registered.

## 9. The "Work in progress" page

Purpose: be honest about what is not built yet, without making the app look broken. It also gives the team a way to see what people want next.

Route and access:
- New screen key `roadmap` in `app/page.js`, component `components/Roadmap.js`.
- Opened from: Account tab "What's coming" row, the lock on premium Interview modes, the AI feedback button, and any league or account entry point. Back button returns to where the user came from.

Layout:
- Navy header with Pip in `tinker` pose (large), a Wrench icon sticker tilted on the side, and a headline in `font-display`: **"This is a work in progress!"** Subtext: "We're a student team building this in public. Here's what isn't built yet, and why."
- A vertical stack of cards, one per item, each with: a lucide icon in a white circle, the feature name, one line on what it will do, a "Why later" line, a status chip ("Not built yet"), and an "I want this" button.
- Footer: "Seen something broken? Tell us" mailto link to the team address (placeholder constant in one config file, ask me for the address).

The six items (copy to use as written):

| Icon (lucide) | Name | What it will do | Why later |
|---|---|---|---|
| `UserRound` | Accounts and sync | Save your progress across devices so you can switch from phone to laptop. | Needs a database. Your progress lives on this device for now. |
| `CreditCard` | Premium | Unlock the bigger question bank and the Interview modes. | Payments come after accounts. |
| `Sparkles` | AI feedback | Grade your spoken or written answers and tell you what to fix. | Needs accounts first so we can keep it fair and affordable. |
| `Trophy` | School leagues | Compete with students at Lehigh and nearby schools. | Needs accounts and enough users to be fun. |
| `Shirt` | Pip outfits | Dress Pip up for your streaks and badges. | Pip's art is being reworked first. |
| `PencilRuler` | Pip redraw | A new, flatter Pip that matches the rest of the app. | In the design queue (CLAUDE.md next step 2). |

Rules for this page:
- Do not show a price. Payments are not built, so nothing here should look like a checkout.
- No fake forms, no fake loading states, no "join waitlist" email field (no backend yet).
- "I want this" stores a tap locally in `pitchd:v2` under `interest: { accounts: true, ... }` and shows a teal check with "Noted". When accounts and analytics exist, this becomes the demand signal. Until then it is local only; say so in a small line under the buttons: "Saved on this device."
- Statuses live in one data file, `data/roadmap.json`, so the team can change a status to "In progress" or "Live" without touching component code. Chip colors: Not built yet = grey, In progress = periwinkle, Live = teal.
- Keep this list in sync with PRODUCT_PLAN.md and the README "not built" line.

## 10. Build order

Do these after Phase 1 item 8b has landed (it installs `motion` and `canvas-confetti`). Each step is one commit.

| Step | What | Check |
|---|---|---|
| F1 | Tokens (navy, lime, lime-soft, bull/bear), Bricolage display font, `Sticker`, `PeekEyes`, `StackCard`. Update `CLAUDE.md` design section (section 11). | Style sampler visible on a temporary route, then delete the route. |
| F2 | `lib/motion.js` springs and variants, press scale on all tappables, reduced-motion handling, floating pill tab bar with sliding indicator. | Tabs no longer slide sideways. Reduced motion turns movement off. |
| F3 | Pip poses and `usePip()`: idle, wave, hype, oops, think first. Then combo, celebrate, bell, point, sleepy, peek. | Quiz tap-to-feedback is unchanged in speed. Pip reacts after. |
| F4 | Transitions: Home to Quiz shared layout, question card stack, closing-bell wipe, sheets, list stagger. | No fade-left or fade-right left anywhere. |
| F5 | Home rebuild: ticker, navy hero, stacked category cards with PeekEyes, week chips. | Looks funky and still readable at 375px width. |
| F6 | Quiz and closing bell: category backdrop, combo chip, segmented progress, trade slip, counting numbers. Optional Pressure mode clock. | Full 5-question set feels fast. |
| F7 | Review deck with swipe, Progress skill map and badges, Interview stacked mode cards. | Swipe works with a mouse and touch, and buttons work too. |
| F8 | Work in progress page and `data/roadmap.json`; wire the four entry points. | Every "not built" item opens this page. No price shown anywhere. |
| F9 | Sound set and haptics polish, master toggles in Account. | Mute works instantly. Nothing plays before an answer is registered. |
| F10 | QA pass: 375px and 430px widths, reduced motion on, slow CPU throttle in Chrome DevTools (4x), contrast check, tap targets at least 44px, `npm run build`, `npm run validate`. | Report any screen that drops frames. |

Never run `npm run build` while the dev server is running. Stop the server, build, restart.

## 11. Decisions and CLAUDE.md updates

Decisions (defaults in bold; ask me before changing them):
1. Display font for headlines: **Bricolage Grotesque 700**. Alternative: keep Plus Jakarta only and get the chunk from size and color.
2. Lime as the highlight on dark surfaces: **yes**. Alternative: periwinkle only.
3. Pressure mode (3:00 clock): **opt-in, default off**.
4. Pip outfits: **not built** (stays on the WIP page).
5. Sounds from the Web Audio API: **yes**, no audio files unless it sounds cheap.
6. Team contact address for the WIP page footer: **needed from me**.

`CLAUDE.md` edits to make in step F1:
- Design system: add `--navy`, `--lime`, `--lime-soft`, `--bull`, `--bear`. Replace "Font: Plus Jakarta Sans Variable, weights 500–700. Avoid 800." with "Body: Plus Jakarta Sans Variable 500–700. Display (headlines and big numbers only): Bricolage Grotesque Variable 700."
- Add: "Stickers use a 2px ink outline, no shadows. Lime is for dark surfaces and chips only. Max two loud colors per screen."
- Add: "Motion: use `lib/motion.js` springs. Only animate transform and opacity. Nothing animates before the answer state paints. Respect reduced motion."
- Add: "Not built, by design: accounts, payments, AI feedback, school leagues, Pip outfits, and the Pip redraw. These appear on the Work in progress page (`data/roadmap.json`). Do not add UI that implies they work."
- Update Layout: `components/Roadmap.js`, `components/ui/{Sticker,PeekEyes,StackCard,Ticker}.js`, `lib/motion.js`, `lib/pip.js`, `data/roadmap.json`.
- Update Next steps: Pip redraw (step 2) stays queued. Motion for the current Pip is covered here.
