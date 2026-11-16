# Pitchd Funk Pass v2: logo-led look, motion, mascot, and the "work in progress" page

Status: plan only, no code yet. Revised Nov 15, 2026 after Lea confirmed direction. This version replaces v1 (the Wall Street theme and lime/navy palette are gone).
Builds on `docs/PRODUCT_PLAN.md` (structure, features, science). This file covers how the app looks and moves. If the two disagree on features, PRODUCT_PLAN.md wins. If they disagree on visuals or motion, this file wins.

## Confirmed direction (Lea, Nov 15)

- Colors come from the Pitchd logo only, plus black and off-white. Red and orange stay as functional colors (wrong answers, review badges).
- Hero surfaces mix by screen: royal navy for Home, the set-complete screen, and the splash; mid blue for other feature cards.
- Primary buttons are cyan pills with navy text.
- The logo is used on the splash and onboarding only. Not as stickers, patterns, loading marks, or in the tab bar.
- Splash: bubble icon on blue, white wordmark below.
- The Wall Street layer (ticker, bells, trade slip, pressure clock) is dropped.
- Kept: funkier shapes, Pip moving and reacting, new transitions, swipe review cards, and the Work in progress page.

## How Claude Code should use this file

1. Read this file and `CLAUDE.md`. Reply with a one-screen summary of the build order (section 10) and anything that conflicts with the current code. Do not code yet.
2. Build one step at a time (F1, F2, ...). After each step: stop the dev server, `npm run build`, `npm run validate`, restart the dev server, then ask me to check on localhost before committing. One commit per step, on the working branch, never `main`.
3. Before step F3, open `components/Mascot.js` and list which parts of Pip are separate shapes (arms, tuft, eyes, belly) and which are one path. Say what can move.
4. If a step needs a decision from section 11 that is still open, stop and ask me, with the default stated.

Rules that never change: flat fills in the app UI, no tinted drop shadows, `lucide-react` icons only, no emoji in the UI, color values only in `app/globals.css` tokens, quiz answering stays instant.
One exception to "no gradients": the logo image files themselves contain a gradient (the bubble). Use them as images and never recreate that gradient in CSS.

---

## 1. Creative direction

One line: **funky and confident, led by the Pitchd logo.** The app should feel like the logo looks: bold rounded type, a bright blue and cyan pair, and a speech-bubble friendliness. It should not feel like a white-card template.

What we take from the references:

| Reference | Take this | Skip this |
|---|---|---|
| Aptivo (coral cards) | Cards with little eyes peeking over the top edge. Mascot peeking in from the screen edge. | Kid-level copy |
| Charmi (blue and lime) | Starburst and speech-bubble stickers ("Hello!", "Let's start!"). Date chips. Stacked, slightly tilted cards. Big chunky headlines. | The lime color and the wellness mood |
| Loop (cream and blue) | Big mascot empty states that talk. Floating pill tab bar. | Thin outline icons |
| Duo | The mascot reacts to what you do on every screen, and moves. | Guilt-trip notifications |

"Funky" checklist (Claude Code should check each screen against this):
- Each screen has one element that is tilted, oversized, or overlaps its container (a sticker, a card edge, Pip leaning in).
- No screen is only white cards on grey. Each has one big blue color block.
- Headlines are large and heavy. Body text stays calm.
- Something on every screen is alive (Pip idle, a ring filling), and it never slows a tap.

## 2. Color

Sampled from `public/brand/pitchd-logo-full.png`.

Add these tokens to `:root` and `@theme inline` in `app/globals.css`:

| Token | Value | Source in logo | Use |
|---|---|---|---|
| `--royal` | #042f97 | Wordmark | Splash, Home hero, set-complete screen, headings on light backgrounds, button text, outlines |
| `--azure` | #0874c8 | Speech bubble | Feature cards (weekly card, Account profile, category cards), progress fills, links |
| `--azure-soft` | #e0eefa | Tint of azure | Chips, selected states, soft backdrops |
| `--cyan` | #14d4d4 | The "d" and the burst lines | Primary button fill, correct answers, streaks, highlights |
| `--cyan-soft` | #d9f7f7 | Tint of cyan | Correct-answer panel, soft chips |

Keep as they are: `--app` (off-white), `--surface` (white), `--ink` (body text and black), `--muted`, `--line`, `--red` and `--red-soft` (wrong answers), `--orange` and `--orange-soft` (review badges).

Migration (do not break existing screens):
- Add the new tokens first. Point the old names at them as aliases: `--periwinkle` to `--azure`, `--periwinkle-soft` to `--azure-soft`, `--periwinkle-strong` to `--azure`, `--teal` to `--cyan`, `--teal-soft` to `--cyan-soft`. Remove `--pink` and replace its uses.
- Then replace old class names screen by screen as each is rebuilt. Delete the aliases in step F10 once nothing uses them.

Rules:
- Max two loud colors per screen (for example royal + cyan, or azure + cyan).
- Cyan is a fill color. Never use cyan as text on white or off-white (about 1.8:1). Use `--royal` text on cyan (about 6:1).
- White text on royal and on azure both pass 4.5:1.
- Primary button: `bg-cyan text-royal font-bold` full pill. On light surfaces, add a 2px `--royal` border so the button shape reads. On royal surfaces, no border.
- Secondary button: white fill, 2px royal border, royal text, full pill.
- Category cards cannot rely on hue alone (the palette is small). Tell categories apart by icon, label, and a sticker. Rotate fills among azure, royal, cyan, and their soft tints.
- Right and wrong feedback never rely on color alone: correct = cyan-soft panel with a `Check` icon, wrong = red-soft panel with an `X` icon.
- Stickers get a 2px royal outline instead of any shadow.

## 3. The logo in the app

Assets are in `public/brand/` (commit them):
- `pitchd-logo-full.png`: the original full logo, 2172 x 724, on white. For the README, social images, and anywhere on a white background.
- `pitchd-bubble.png`: the bubble with its cyan burst lines, transparent background, 660 x 631.
- `pitchd-wordmark-white.png`: "Pitchd" all white, transparent background, 1490 x 405. Made from the original by recoloring.

If a vector version (SVG) of the logo exists, swap it in later. The PNGs are enough for now. Use `next/image` with explicit width and height.

**Splash screen** (new component `components/Splash.js`)
- Full-screen `--royal`.
- The bubble icon (about 40% of screen width) drops in with `spring.bouncy` from slightly above, with a small squash on landing. The cyan burst lines are part of the image. Add a tiny scale pop on the whole icon after the landing.
- The white wordmark fades up beneath it (translateY 12px to 0, 300ms), then the tagline "YOUR INTERNSHIP PREP APP" fades in below in white at 70% opacity, small caps, wide letter spacing, with a short cyan line on each side (CSS, not an image).
- Total about 1.4s. Tap anywhere to skip. Respect reduced motion (show the final frame, hold 600ms).
- New users: full splash, then onboarding. Returning users: a shorter 0.8s version, once per browser session (use `sessionStorage` in a try/catch). If storage is blocked, show the short version every open.

**Onboarding** (logo stays small here, the colors do the work)
- Top band: royal, rounded bottom corners (28px), about 28% of screen height. The bubble icon sits top left at about 44px. A step counter sits top right in white.
- Step 1 (welcome): the top band grows to full screen. Large bubble icon, Pip peeks in from the bottom edge and waves, headline "Interview prep in 3 minutes a day." in white, cyan pill "Get started".
- Later steps: band shrinks back to the top. Choices are tiles below it on `--app`.
- Sound toggle visible top right from the first screen (PRODUCT_PLAN.md decision 7).

**Not in scope** (Lea said no): logo as stickers or patterns, logo in the tab bar, logo on loading states, a Pip redesigned to look like the logo.

## 4. Type and shapes

Type:
- Default: keep Plus Jakarta Sans for everything. Get the chunk from size (headlines 28 to 32px, hero numbers 48 to 64px), weight 700, and tight tracking on large text. No new font until Lea says yes (decision D1).
- Use `tabular-nums` on XP, streak, and any counting number so digits do not jump.
- Uppercase only for sticker text and the splash tagline.

Shapes (reusable components in `components/ui/`):
- `Sticker.js`: starburst (8 to 12 points) and speech-bubble variants, 2px royal outline, optional rotation (-12 to 12 degrees), one to three words. Fill from the palette.
- `PeekEyes.js`: two white circles with ink pupils on the top edge of a card. Blink every 3 to 6 seconds (random). Pupils drift toward the last tap. Used on category cards on Home and Progress. Flat shapes only.
- `StackCard.js`: card wrapper that can sit tilted (-2 to 2 degrees) and overlap the card below by 16 to 24px. Home and Review only. Never in the quiz.
- Radius: keep `--radius` (1.25rem) for cards, 28px for hero cards, full pill for buttons and chips.

## 5. Pip moves

Pip's shape does not change. We animate it and swap its fills to the logo palette. The full Pip redraw and outfits stay on the "not built" list (section 9).

Recolor (part of step F3): remove Pip's gradient body and gloss highlight and use flat fills: body `--azure`, arms and tuft `--royal`, belly white at low opacity, cheeks `--cyan-soft`, eyes and mouth `--ink`. No shape edits. If this turns out to need path changes, stop and tell me.

API:
```
<Mascot pose="idle" size={96} />   // pose controls the animation; mood still controls the face
```
Keep `mood` as is (`neutral`, `happy`, `oops`). Add `pose`. Export `usePip()` from `lib/pip.js` with `pip.react('correct' | 'wrong' | 'combo' | 'complete')` so any screen can trigger a reaction without prop drilling.

Poses (all with the `motion` library, springs, transform and opacity only):

| Pose | When | Motion |
|---|---|---|
| `idle` | default | Slow breathing (scale 1 to 1.03, 3s loop). Blink every 3 to 5s (random). Tuft sways a few degrees. |
| `peek` | splash to onboarding, empty states | Slides in from the screen edge, eyes first, then body. Settles into `wave`. |
| `wave` | welcome, new day | One arm swings three times (about 900ms), body tilts 4 degrees. |
| `think` | question on screen | Head tilt 6 degrees, eyes look up and aside. Subtle. |
| `hype` | correct answer | Hop (up 14px, squash 0.92 on landing), arms up, back to idle. 450ms. |
| `combo` | 3 correct in a row; bigger at 5 | Higher hop, at 5 a full spin. Cyan star shapes burst out (flat). |
| `oops` | wrong answer | Slump (scaleY 0.94), one wobble, eyes glance at the correct answer. Never mocking. Back to idle in 600ms. |
| `celebrate` | set complete | Looping side-to-side bounce, arms alternate, one confetti burst. |
| `sleepy` | streak at risk (evening, no set done) | Slow yawn, half-closed eyes, small "zz" sticker. |
| `point` | Home, first visit each day | Arm points at the Start pill, small nudge every 8s until tapped. |
| `tinker` | Work in progress page | Slow side-to-side wobble, eyes up, a lucide `Wrench` icon floats beside. No hard hat (that would be an outfit). |

Placement and size:
- Quiz: small (56 to 72px), in a corner of the question card. Reactions never cover answers.
- Home: small, beside the action card title.
- Onboarding welcome, set-complete, Work in progress, empty states: large (140 to 200px).
- On Home, Pip walks in from the left edge (translateX with a step bounce) to sit beside the Start pill, once per session.

Rules:
- Reactions start after the answer is already marked. The answer state paints first.
- Tapping Next cancels the current reaction immediately.
- Reduced motion: no movement, static pose for the same mood.
- Quiz reactions are under 700ms. Longer ones (celebrate, wave) only on non-quiz screens.

## 6. Interaction and transitions (no more fade left and right)

Install `motion` if not already there (it may come from Phase 1 item 8b). Put shared springs and variants in `lib/motion.js`:

```
spring.snappy = { type: 'spring', stiffness: 420, damping: 30 }
spring.bouncy = { type: 'spring', stiffness: 380, damping: 16 }
spring.soft   = { type: 'spring', stiffness: 220, damping: 26 }
```

Screen to screen:

| From to | Transition |
|---|---|
| Splash to onboarding or Home | The royal screen shrinks into the top band (onboarding) or the Home hero card (Home). The bubble icon moves to its new spot (shared layout). |
| Home to Quiz | The action card expands to fill the screen (shared layout via `layoutId`), about 350ms. Pip rides along. |
| Question to next question | Current card flies up and off (about 200ms), next card scales in from 0.94 underneath. Answers stay still. |
| Quiz to set-complete | Royal wipes up from the bottom. Pip drops in with a bounce. |
| Tab to tab | Crossfade plus 8px rise (150ms). No horizontal slide. The active tab indicator slides between tabs (`layoutId`) and the icon bounces. |
| Onboarding step to step | Top band resizes smoothly. Pip hops to the new spot. Content pops in with `spring.bouncy`, 40ms stagger. |
| Sheets (level-up, badge) | Slide up from the bottom, drag down to dismiss. |
| Lists (Home cards, Review due list, Progress tiles) | Stagger in, 30ms per item, once per visit. |

Micro-interactions:
- Every tappable element: press scale 0.97 with `spring.snappy`, springs back on release.
- Answer pills: selected state paints on the same frame as the tap. After that, correct gets a color wipe from the tap point and a check pop. Wrong gets a two-cycle shake (about 250ms). Flourish only after the state change.
- Progress ring and bars fill with `spring.soft`. Numbers count up with tabular digits.
- Tab bar: floating pill, `--royal` background, active tab shown as a `--cyan` circle with a royal icon. Interview is the raised center tab.
- Week strip chips: done days cyan, today royal with white text, future days `--line`. Tapping today bounces the chip.
- Haptics: `navigator.vibrate(10)` on correct, 20 on wrong, Android only, behind the same toggle as sound.

Performance budget:
- Animate only `transform` and `opacity`.
- No animation longer than 400ms except the splash, celebrate, and idle loops.
- Idle loops pause when the tab is hidden and when reduced motion is on.
- Answer tap to visual change stays under one frame. If an animation makes answering feel slower, remove it.

## 7. Screen by screen

**Splash and onboarding**: section 3.

**Home**
- Hero: `--royal` action card with the set title in large white type, a cyan Start pill, and a progress ring (cyan on a royal-dark track). Pip small beside the title, `point` pose on the first visit each day. Label above the title is plain: today's date.
- Below: category cards stacked and slightly tilted with PeekEyes, in azure, royal, cyan and soft tints (icons and stickers tell them apart). Weekly card in azure with a starburst sticker. Review card with an orange "Due today" count.
- Week strip: chips as in section 6.
- Floating pill tab bar.

**Quiz**
- Question in a big white card on a soft azure backdrop. Category sticker top left. Combo chip top right (cyan fill, royal text). Pip small in the card corner, `think` pose.
- Answers: tall pills, bold, same instant selection as now.
- Top bar: 5-segment progress (cyan filled, `--line` empty).
- Feedback panel after answering: cyan-soft with `Check`, or red-soft with `X`, one line of method praise (PRODUCT_PLAN.md 3.9), and a Next pill.

**Set-complete** (replaces the plain summary look): royal full screen, Pip celebrating, confetti burst, goal ring closes, score and XP count up, streak shown as a big number with a `Flame` icon in cyan. A tappable orange chip at the bottom: "3 cards due tomorrow". Copy by score: 5/5 "Perfect set.", 3 to 4 "Solid set.", 0 to 2 "Rough day. These come back tomorrow, that's the point."

**Interview tab**: mode cards (Story bank, Mock, Drill) as stacked tilted cards. Locked premium modes show a `Lock` icon and open the Work in progress page, not a paywall.

**Review tab**: due cards as a deck. Swipe right = Got it, swipe left = Missed. The card tilts under the finger and a stamp ("GOT IT" / "MISSED") fades in. Buttons also available. A "Missed" list below, filterable by category chip.

**Progress tab**: skill map as colored tiles with PeekEyes that fill as cards are mastered. Streak as a big number on a royal card with a cyan `Flame`. Badges grid: unlocked in color, locked grey with a lock.

**Account tab**: profile card in azure, settings list (sound, haptics, reduced motion follows the system), and a "What's coming" row that opens the Work in progress page.

**About page**: as in PRODUCT_PLAN.md section 9, with a royal header and sticker headings.

## 8. Sound and haptics

Builds on PRODUCT_PLAN.md decision 7 (sounds on by default, a mute button visible on open).
- Sounds (short, under 400ms): `pop` (correct), `thud` (wrong, soft), `combo` (rising two-note), `whoosh` (card fly-off), `chime` (set complete, up to 1s).
- Generate with the Web Audio API so there are no audio files to ship. If that sounds cheap on test, ask me before adding files.
- One master sound toggle and one haptics toggle in Account, both stored in `pitchd:v2`.
- Sound never plays before the answer is registered.

## 9. The "Work in progress" page

Purpose: be honest about what is not built yet, without making the app look broken.

Route and access:
- New screen key `roadmap` in `app/page.js`, component `components/Roadmap.js`.
- Opened from: the Account tab "What's coming" row, the lock on premium Interview modes, the AI feedback button, and any league or account entry point. Back returns to where the user came from.

Layout:
- Royal header with Pip in `tinker` pose (large), a `Wrench` icon sticker tilted on the side, and a heavy headline: **"This is a work in progress!"** Subtext: "We're a student team building this in public. Here's what isn't built yet, and why."
- A vertical stack of cards, one per item: a lucide icon in a white circle, the name, one line on what it will do, a "Why later" line, a status chip ("Not built yet"), and an "I want this" button.
- Footer: "Seen something broken? Tell us" mailto link. The address is a constant in `data/roadmap.json` (decision D3).

The six items (copy as written):

| Icon (lucide) | Name | What it will do | Why later |
|---|---|---|---|
| `UserRound` | Accounts and sync | Save your progress across devices so you can switch from phone to laptop. | Needs a database. Your progress lives on this device for now. |
| `CreditCard` | Premium | Unlock the bigger question bank and the Interview modes. | Payments come after accounts. |
| `Sparkles` | AI feedback | Grade your spoken or written answers and tell you what to fix. | Needs accounts first so we can keep it fair and affordable. |
| `Trophy` | School leagues | Compete with students at Lehigh and nearby schools. | Needs accounts and enough users to be fun. |
| `Shirt` | Pip outfits | Dress Pip up for your streaks and badges. | Pip's art is being reworked first. |
| `PencilRuler` | Pip redraw | A new, flatter Pip that matches the rest of the app. | In the design queue (CLAUDE.md next step 2). |

Rules:
- Do not show a price. Payments are not built, so nothing here should look like a checkout.
- No fake forms, fake loading states, or waitlist email field (no backend yet).
- "I want this" stores a tap locally in `pitchd:v2` under `interest: { accounts: true, ... }` and shows a cyan check with "Noted". Add a small line under the buttons: "Saved on this device."
- Statuses live in `data/roadmap.json` so the team can change one to "In progress" or "Live" without touching components. Chip styles: Not built yet = `--line` fill, In progress = `--azure-soft` fill, Live = `--cyan-soft` fill.
- Keep this list in sync with PRODUCT_PLAN.md and the README "not built" line.

## 10. Build order

Do these after Phase 1 item 8b has landed. Each step is one commit.

| Step | What | Check |
|---|---|---|
| F1 | Commit `public/brand/` assets. Add the new color tokens and old-name aliases. Build `Sticker`, `PeekEyes`, `StackCard`. Update `CLAUDE.md` (section 11). Restyle primary and secondary buttons. | A temporary sampler route shows tokens, buttons, and shapes. Delete the route after I check it. |
| F2 | `Splash.js` and the onboarding top band with the logo. Wire the new-user and returning-user splash. | Splash plays once, tap skips, reduced motion shows a still frame. |
| F3 | `lib/motion.js`, press scale on tappables, reduced-motion handling, floating pill tab bar with sliding indicator. Pip fill recolor, then poses and `usePip()`: idle, wave, hype, oops, think first; then combo, celebrate, point, sleepy, peek. | Tabs no longer slide sideways. Quiz tap-to-feedback speed is unchanged. |
| F4 | Transitions: splash to Home, Home to Quiz shared layout, question card stack, set-complete wipe, sheets, list stagger. | No fade-left or fade-right anywhere. |
| F5 | Home rebuild: royal hero, stacked category cards with PeekEyes, week chips. | Funky and readable at 375px width. |
| F6 | Quiz and set-complete: azure backdrop, combo chip, segmented progress, counting numbers, confetti. | A full 5-question set feels fast. |
| F7 | Review deck with swipe, Progress skill map and badges, Interview stacked mode cards. | Swipe works with a mouse and touch, and buttons work too. |
| F8 | Work in progress page and `data/roadmap.json`; wire all entry points. | Every "not built" item opens this page. No price anywhere. |
| F9 | Sound set and haptics polish, toggles in Account. | Mute works instantly. Nothing plays before an answer registers. |
| F10 | QA: 375px and 430px widths, reduced motion on, 4x CPU throttle in Chrome DevTools, contrast check (cyan never as text on light), tap targets at least 44px, remove old color aliases and unused `--pink`. `npm run build`, `npm run validate`. | Report any screen that drops frames. |

Never run `npm run build` while the dev server is running. Stop it, build, then restart.

## 11. Decisions and CLAUDE.md updates

Open decisions (defaults in bold; ask me before changing them):
- D1. Display font for headlines: **none, keep Plus Jakarta Sans**. The logo wordmark is a heavy rounded sans, so a rounded heavy font (such as Nunito 800) could match it better. Needs Lea's yes.
- D2. Pip outfits: **not built**.
- D3. Team email for the Work in progress footer: **needed from Lea**.
- D4. Sounds from the Web Audio API: **yes**, no audio files unless it sounds cheap.
- D5. Cyan pill on light surfaces has a 2px royal border: **yes** (cyan on white is too faint to read as a button without it).

`CLAUDE.md` edits to make in step F1:
- Design system: replace the periwinkle, teal, and pink lines with the logo palette (`--royal`, `--azure`, `--azure-soft`, `--cyan`, `--cyan-soft`). Keep red for wrong answers and orange for review badges.
- Replace "Primary buttons: `--ink` #111318, fully rounded pills" with "Primary buttons: cyan pill, royal text, 2px royal border on light surfaces. Secondary: white pill, 2px royal border."
- Replace the Visual target paragraph: "Flat, rounded mobile layout led by the Pitchd logo colors: royal and azure blocks, cyan highlights, stickers, tilted stacked cards, mascot that moves."
- Add: "Logo files are in `public/brand/`. The logo appears on the splash and onboarding only. The logo's gradient stays inside the image files; the UI stays flat."
- Add: "Motion: use `lib/motion.js` springs. Animate only transform and opacity. Nothing animates before the answer state paints. Respect reduced motion."
- Add: "Not built, by design: accounts, payments, AI feedback, school leagues, Pip outfits, and the Pip redraw. They appear on the Work in progress page (`data/roadmap.json`). Do not add UI that implies they work."
- Update Layout: `components/{Splash,Roadmap}.js`, `components/ui/{Sticker,PeekEyes,StackCard}.js`, `lib/motion.js`, `lib/pip.js`, `data/roadmap.json`, `public/brand/`.
- Next steps: Pip redraw (step 2) stays queued. Pip movement and the logo recolor are covered here.
