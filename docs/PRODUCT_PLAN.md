# Pitchd Product Plan (v2)

Last updated: Nov 15, 2026. Owner: Larah Flavier. Pricing and AI limits match the Checkpoint 11 deck.

This is the build plan for the next version of Pitchd. Claude Code should read it before starting any phase. Build one phase at a time, show a plan first, and stop for review after each screen.

---

## 0. Where things stand

- Next.js app on Vercel. No accounts or backend. Progress is saved in the browser (`localStorage`), so it's lost if the user switches devices or clears their browser.
- 71 questions total: 10 behavioral, 12 business basics, 9 news, and 10 each for Accounting, Marketing, Supply Chain, and Management.
- Spaced review exists: missed questions come back after 1, 3, and 7 days (`lib/engine.js`).
- The visual redesign is in progress on `redesign-foundation`. Home is done; Quiz, Summary, Review, Progress, and Onboarding are next. Finish that before starting Phase 1.

**Two problems to fix before premium launches:**
1. **The repo is public.** Everything in `data/questions.json` can be read by anyone on GitHub, and it's also bundled into the app, so anyone can read it in their browser. Premium questions can't live there. Make the repo private, and serve premium questions from the database only to paying users (see section 5).
2. **No accounts means no premium.** Payments need a logged-in user to attach the subscription to. Accounts come before Stripe.

---

## 1. What v2 has to prove

The deck promised investors these numbers at day 90. Every feature below should move one of them.

| Metric | What it measures | Feature that moves it |
|---|---|---|
| Onboarding completion | Share of new users who finish setup and their first set | Short onboarding, plan reveal |
| Day-7 retention | Share of users still practicing a week later | Personalized plan, streaks, reminders |
| Sets per active user per week | How often people practice | Daily goal, review deck, category drills |
| Free → paid conversion | Share who upgrade | Interview practice, bigger bank, all majors |
| Renewal rate | Share who pay a second month | Curriculum tied to their interview date |

---

## 2. App structure

```
Landing → Onboarding → Plan reveal → Home
                                      ├── Practice (daily set, category drills)
                                      ├── Interview (mock interviews, story builder)
                                      ├── Review (flashcard decks)
                                      ├── Progress (roadmap, mastery, stats)
                                      └── Account (profile, goals, plan, subscription)
```

Bottom tab bar: **Home · Interview · Review · Progress · Account** (5 tabs, Lucide icons).

---

## 3. Features

### 3.1 Landing page and onboarding

One question per screen, big tap targets, a progress bar at the top. It should take about 90 seconds.

1. **Landing:** the logo, one line ("3 minutes a day to walk into interviews ready"), a **Get started** button, and an "I already have an account" link.
2. **Name:** "What should we call you?"
3. **Year:** First-year / Sophomore / Junior / Senior / Grad.
4. **Major:** pick from the list in 3.8. This sets their track.
5. **Goal:** "What are you preparing for?" Internship / Full-time / Co-op, then an industry (e.g. banking, consulting, accounting, engineering, marketing, other).
6. **Timeline:** "When's your next interview or recruiting season?" A date picker, or quick options: "This month," "This semester," "Next year," "Not sure."
7. **Daily habit:** pick 3, 5, or 10 minutes a day, then "What time works best?" (sets the reminder). Ask for notification permission here.
8. **Quick check:** 5 mixed questions to measure their starting level. Label it "No pressure, this just sets your starting point."
9. **Plan reveal:** shows their roadmap ("Your 6-week plan to [goal]"), with step 1 already checked off for finishing setup. Button: **Start day 1**.

Don't ask them to create an account until after their first set ("Save your progress"). Asking first loses people before they've seen the app. An account is required for premium.

### 3.2 Personalized curriculum

Version 1 uses rules, not AI. That makes it predictable, free to run, and easy to adjust.

**Inputs:** track, goal and industry, year, timeline, daily minutes, quick-check results, and rolling accuracy by category.

**Output:** a plan split into three phases. Phase lengths scale with how far away the interview is.

| Phase | Focus | Mix |
|---|---|---|
| Foundations | Core concepts for their track, business basics | Mostly new questions, easier |
| Applied | Track technicals, behavioral stories, news | Harder questions, more review |
| Interview-ready | Mock interviews, mixed sets | Interview mode, weak spots |

**How the plan updates:**
- Each goal starts from a template with category weights (e.g. banking: 50% technical, 30% behavioral, 20% news).
- Weights shift toward the categories where the user scores lowest. Difficulty adjusts to keep their accuracy around 80–85% (see section 4, "85% rule").
- Each daily set serves due reviews first, then new questions by weight, and stays within their chosen minutes.
- The plan re-runs every Monday and whenever they edit their goals.
- Shown as a roadmap on the Progress tab: "Week 2 of 6 · Applied."

### 3.3 Home

Already being rebuilt in the redesign pass. Add:
- The current plan step ("Week 2 · Behavioral stories")
- Days until their interview, if they gave a date
- A daily goal ring that matches their chosen minutes

### 3.4 Review tab (cards)

- **Card stack:** question on the front; tap to flip to the answer and explanation. Swipe right for "Got it," swipe left for "Again." Buttons do the same on desktop.
- **Decks:** Due today, Missed, Saved (a bookmark on any question), By category, My stories (behavioral).
- **Spaced review upgrade:** intervals go from 1/3/7 days to 1/3/7/14/30 days, and a card counts as mastered after the 30-day review. "Again" sends it back to day 1.
- **Stats:** accuracy by category, mastered count, and a forecast ("12 cards due tomorrow").
- **Free:** Due today, Missed, and Saved decks. **Premium:** all category decks and custom decks.

### 3.5 Interview practice page

| Mode | What it is | Free | Premium |
|---|---|---|---|
| Quick drill | 3 questions, type your answer, compare to a model answer | Yes, self-check (no AI) | Yes |
| Mock interview | Choose track, company type, and length (10 or 20 min). 5–8 questions with a timer per answer | 1 per week, self-check against the question's key points (no AI) | AI feedback on every answer, using the monthly AI reviews |
| Story builder | Write 5–6 STAR stories once; the app tags each to the behavioral questions it answers | 2 stories, self-check | Unlimited stories; AI feedback uses the monthly AI reviews |
| History | Past mocks with scores over time | Yes | Yes |

**Self-check (free):** after answering, the user sees the model answer and the question's key points as a checklist and ticks off the ones they covered. No AI call, so free users cost nothing in AI.

**AI reviews (premium): 30 per month.** One AI review is one graded answer. This matches the AI budget in the Checkpoint 11 deck:

| Deck assumption | Value |
|---|---|
| Model | Claude Sonnet 4.6: $3 per 1M input tokens, $15 per 1M output tokens |
| Size of one AI exercise | ~4,000 input tokens + ~1,000 output tokens ≈ $0.027 |
| Exercises per paid month | 30 → $0.81 |
| Usage buffer | $0.19 |
| AI budget per paid month | **$1.00** |

- 30 reviews covers about 4–6 full mock interviews a month.
- Show a counter: "18 of 30 AI reviews left this month · resets Dec 1."
- When they run out, mocks fall back to self-check until the counter resets. No surprise charges.
- Log the tokens used on every review. If the real average differs from 4k in / 1k out, update the deck's AI line and either the cap or the price.

**AI feedback on each answer** (Claude API, run on the server, premium only):
- Structure: did it follow STAR, for behavioral questions?
- Key points: which of the question's human-written `keyPoints` the answer covered
- Specificity and length
- A score from 1 to 5, plus one suggested rewrite of the weakest sentence
- An overall summary at the end, which feeds the weak categories back into the curriculum

**Guardrails:** technical answers are graded only against human-written key points, not the AI's own judgment. Feedback is labeled as practice guidance. Free users never trigger an AI call.

Answers are typed. The deck says "text only," and its AI budget doesn't cover voice. Voice (record in the browser, transcribe, then grade) stays in Phase 5, and only ships after the deck adds a transcription cost line.

### 3.6 Account tab

- Profile: name, year, major
- Goals and timeline: editing these rebuilds the plan
- Tracks: switch tracks, or add a second one (premium)
- Reminders: time of day, on or off
- Plan: Free or Premium, with an upgrade button or "Manage subscription" (opens Stripe's billing page)
- Referral code
- Download my data, delete account, sign out

### 3.7 Premium model

Matches the Checkpoint 11 deck: one paid tier at **$12.99/month**, a free version with daily practice, and creators paid commission on premium sign-ups. Can owns these numbers.

**One-line answer to "what does $12.99 buy?"** (use this on the unit economics slide):
> Free: one 3-minute daily set for your major. Premium: every major, the full question bank, and AI-graded mock interviews.

| | Free | Premium |
|---|---|---|
| Daily set | ✓ | ✓ |
| Tracks | 1 | All, including engineering |
| Question bank | Free questions | Full bank plus company and industry packs |
| Category drills | 1 per day | Unlimited |
| Review decks | Due, Missed, Saved | All, plus custom decks |
| Mock interviews | 1 per week, self-check (no AI) | Unlimited mocks; AI feedback on up to 30 answers a month |
| Story builder | 2 stories, self-check | Unlimited; AI feedback counts toward the 30 |
| Analytics | Basic stats | Readiness score, category trends |
| Streak freezes | 1 per week | 2 per week |

**Unit economics per paying user** (deck numbers):

| | Per paid month |
|---|---|
| Price | $12.99 |
| AI allowance (30 reviews) | −$1.00 |
| Stripe fees (2.9% + $0.30 + 0.7% billing) | −$0.77 |
| **Contribution** | **$11.22** |

Over the deck's 3 billed months, that's $33.66 per customer against a $25 CAC, about 1.35x. Investors usually want 3x, so retention past month 3 is the number to improve. Creator commissions come out of this too. The deck counts creator spend under ads, so if commission is paid per sale, it lowers contribution on those customers.

**At launch: $12.99/month only.** That's the deck's model. Two options are not in the deck. Only add them if Can updates the deck to include them:
- **Semester plan, $39 for 4 months.** The deck expects $38.97 per customer (3 × $12.99), so this collects the same revenue upfront and removes the risk of users canceling after month 1. Contribution is about the same ($39 − $4 AI − $1.70 Stripe ≈ $33.30).
- **Free trial.** It delays revenue and changes the deck's 5% install-to-paid assumption. Skip it at launch. The free tier already lets people try the app.

**Deck fixes to send Can:**
1. The unit economics slide says $12.99 buys "Daily interview practice," but the competitor slide says daily practice is free. Use the one-line answer above.
2. The CAC numbers don't line up. $1 per install at 5% paid is a $20 CAC, not $25. A $30k budget at $1 per install is 30,000 installs; at 5%, that's 1,500 payers, not 1,200. Either conversion is about 4%, or the cost per install is about $1.25.

**Year 2 (not in the deck's revenue):** club and career center licenses, with a group code and a coach dashboard. Treat it as upside.

Don't put streak protection behind the paywall as the main reason to upgrade. Making people pay to avoid losing a streak works in the short term and makes users resent the app.

### 3.8 Majors and question bank

**Tracks**

| Group | Tracks |
|---|---|
| Business (now) | Accounting, Marketing, Supply Chain, Management |
| Business (add) | Finance (IB, markets, corporate finance), Economics, Business Analytics, Consulting (case basics) |
| Engineering (add) | Mechanical, Electrical/Computer, Industrial & Systems, Civil/Environmental, Chemical, Bioengineering |

Engineering internship interviews are mostly behavioral questions, a deep dive on a resume project, and conceptual technical questions. Pitchd covers those. Coding interviews for software roles are a different product (LeetCode already owns that), so leave them out.

New shared categories for engineering tracks: **Engineering fundamentals** and **Project deep dive**.

**Size targets.** If the daily set is 2 track questions plus 3 shared ones, a user needs 60 track and 90 shared questions to go 30 days without a repeat.

| | Free | Premium (extra) |
|---|---|---|
| Per track | 60 | +200 |
| Shared (behavioral, basics, news) | 90 | +150 |
| Packs (e.g. Big 4, banks, consulting, rotational programs) | none | 40–60 each |

**Rollout:** first Finance plus Mechanical, Electrical, and Industrial engineering; then the rest.

**Question format** (extends the current `id, cat, q, a, w, e`):

```
id, track, cat, type (mcq | open | flashcard | behavioral),
difficulty (1–3), q, a, w (wrong options), e (explanation),
keyPoints (for AI grading of open answers), tags (topic, firm),
tier (free | premium), source, reviewedBy, reviewedAt
```

**Quality rules:**
- AI can draft questions, but a person has to check every one before it goes live (`reviewedBy` is required).
- Finance and engineering technical questions get checked by a student who has passed that course, or by a TA.
- `npm run validate` checks every field and blocks duplicates.
- Every question has a "Report a problem" button.

### 3.9 Gamification

Section 4 has the research behind each item.

| Mechanic | What the user sees | Guardrail |
|---|---|---|
| Daily goal ring | Ring fills as the set progresses; it closes with a small burst | Goal sized to their chosen minutes |
| Streak | Flame count on Home; milestones at 3, 7, 30, and 100 days | 1 free freeze a week; no guilt-trip copy ("Pip misses you" is fine, "You failed" isn't) |
| XP and levels | XP per correct answer, bonus for finishing the set, level-up screen | XP for accuracy and reviews, never for speed alone |
| Combo | "3 in a row" counter during a set, with a bigger animation at 5 | No timer in practice mode |
| Surprise bonus | Sometimes after a set: a bonus question for 2× XP, a Pip outfit, or a fun fact | Never sold for money, never a loot box |
| Head start | Plan starts with step 1 already done after onboarding | |
| Fresh start | New weekly theme every Monday; a "new semester" plan in January and August | |
| Skill map | Topic tiles that fill in as cards get mastered | Mastery requires passing the 30-day review |
| Badges | First mock, 7-day streak, "Accounting basics mastered" | Only for real milestones |
| Leagues (later) | Weekly opt-in leaderboard by school or club | Opt-in, resets weekly, compares people at similar levels |
| Celebrations | Confetti, a short sound (off by default), phone vibration where supported | Follows the phone's reduced-motion setting; quiz answers stay instant |
| Feedback copy | "Nice, you used the matching principle" instead of "You're smart!" | Praise the method, not the person |

**Animation tools:** Motion (framer-motion) for screen transitions, the ring, and level-ups; canvas-confetti for celebrations. Keep each animation under about 600ms, and save the big ones for set completion and milestones.

### 3.10 Other features that add value

Ranked by value for the effort.

**Now (fits Phases 1–3)**
1. **Interview countdown and readiness score:** "Interview in 12 days · 74% ready." It gives the user a reason to practice today and a reason to pay.
2. **Share cards:** an image for Instagram or LinkedIn when they hit a streak or milestone. It's free marketing aimed at their friends.
3. **Referrals:** give a friend a free week of Premium, get a free week yourself. Cheaper than the deck's $25 CAC.

**Next**
4. **STAR story bank** (in 3.5): the strongest reason to keep paying across recruiting seasons.
5. **Company and industry packs:** a clear reason for premium, and they match how students actually search for prep.
6. **"What did they ask you?":** users submit questions they got in real interviews, moderated before going live. Over time this builds a question bank competitors don't have.

**Later**
7. **Networking prep mode:** questions to ask in coffee chats, organized by the person's role.
8. **Outcome tracking:** "Did you get the offer?" This produces testimonials and a number investors care about.
9. **Club and career center dashboard:** the B2B channel from the deck.

---

## 4. The science behind it

What the research supports, and what it means for Pitchd.

**How people learn**
- **Retrieval practice (testing effect).** Practicing recall beats rereading for long-term retention (Roediger & Karpicke, 2006). *In Pitchd:* every card asks before it shows the answer.
- **Spaced repetition.** Reviews spread out over growing gaps beat cramming (Cepeda et al., 2006). *In Pitchd:* the 1/3/7/14/30-day review schedule.
- **Interleaving.** Mixing topics in one session improves learning compared with doing one topic at a time (Rohrer & Taylor, 2007). *In Pitchd:* daily sets mix categories; drills are the exception.
- **Desirable difficulty.** Practice that feels a bit hard produces better retention than practice that feels easy (Bjork, 1994). An ~85% success rate is a good target for learning (Wilson et al., 2019). *In Pitchd:* adaptive difficulty aims for 80–85% accuracy.
- **Feedback.** Feedback works best when it explains why and what to do next, not just right or wrong (Hattie & Timperley, 2007). *In Pitchd:* every answer shows an explanation; mock feedback ends with one fix.

**What keeps people coming back**
- **Reward prediction error ("dopamine").** Dopamine responds most strongly to rewards that are better than expected, and less to predictable ones (Schultz, Dayan & Montague, 1997). *In Pitchd:* the occasional surprise bonus does more than identical rewards every time.
- **Goal gradient.** People speed up as they get close to a goal (Kivetz, Urminsky & Zheng, 2006). *In Pitchd:* the goal ring and "1 question left."
- **Endowed progress.** People are more likely to finish when they start with some progress already counted (Nunes & Drèze, 2006). *In Pitchd:* the plan starts with step 1 checked off.
- **Fresh start effect.** People start new goals more often at temporal landmarks like Mondays and new semesters (Dai, Milkman & Riis, 2014). *In Pitchd:* weekly themes and semester plans.
- **Loss aversion.** Losses feel about twice as strong as equal gains (Kahneman & Tversky, 1979). *In Pitchd:* this is why streaks work, and why they need freezes so they motivate without becoming stressful.
- **Implementation intentions.** Deciding "when and where I'll do it" makes follow-through more likely (Gollwitzer, 1999). *In Pitchd:* onboarding asks what time they'll practice, then reminds them then.
- **Self-determination theory.** Motivation that lasts comes from feeling competent, in control, and connected to others (Ryan & Deci, 2000). *In Pitchd:* mastery maps (competence), choosing goals and drills (control), clubs and leagues (connection).

**Cautions**
- **Gamification works, modestly.** A meta-analysis found small-to-medium positive effects on learning and motivation, and the effects depend heavily on design (Sailer & Homner, 2020). Points on their own don't help much.
- **Rewards can backfire.** Rewards that are expected and feel controlling can lower people's own interest in a task (Deci, Koestner & Ryan, 1999). Keep rewards about progress ("you mastered this"), not bribes.
- **Praise the process.** Praising ability ("you're smart") makes people avoid challenges; praising effort and strategy doesn't (Mueller & Dweck, 1998).

---

## 5. Tech setup

| Need | Tool |
|---|---|
| Hosting | Vercel (already in use) |
| Accounts | Supabase Auth: email link plus Google sign-in |
| Database | Supabase Postgres, with Row Level Security so users only see their own data |
| Payments | Stripe Checkout, the Stripe billing page, and a webhook that updates `subscriptions` |
| AI feedback | Claude API, called only from a server route; rate-limited by tier; cost logged |
| Analytics | PostHog (onboarding funnel, retention, conversion) |
| Errors | Sentry |
| Animation | Motion, canvas-confetti |

**Tables:** `profiles`, `goals`, `plans`, `questions`, `card_progress`, `attempts`, `sessions`, `xp_events`, `badges`, `stories`, `mock_interviews`, `mock_answers`, `subscriptions`, `referrals`.

**Rules:**
- Premium questions only come from the database through a server route that checks the subscription. They're never bundled into the app.
- API keys go in Vercel's environment variables, never in the repo.
- When a user signs up, copy their existing browser progress into their new account so nothing is lost.

---

## 6. Build phases

Each phase is one Claude Code session. Start each with: "Read docs/PRODUCT_PLAN.md and build Phase N. Show me the plan first, then do one screen at a time and stop for review after each."

| Phase | What gets built | Backend needed? |
|---|---|---|
| 0 | Finish the redesign pass on `redesign-foundation`; fix the blank page; merge to `main` | No |
| 1 | Landing and onboarding (3.1), rule-based curriculum (3.2), Review card decks (3.4), gamification v1: goal ring, streak freezes, XP, combo, celebrations (3.9). Data still saved in the browser | No |
| 2 | Accounts and database (Supabase), Account tab (3.6), move progress into the account, PostHog | Yes |
| 3 | Move the question bank into the database with `tier`, premium gating, Stripe, paywall, monthly AI review counter (3.7), make the repo private | Yes |
| 4 | Interview page: quick drill, mock interviews with self-check (free) and AI feedback capped at 30 reviews a month (premium), story builder, token logging (3.5) | Yes |
| 5 | Leagues, referrals, share cards, company packs. Voice answers only after the deck adds a transcription cost line | Yes |

**Content runs alongside every phase:** grow the bank toward the targets in 3.8, starting with Finance and three engineering tracks.

---

## 7. Suggested team split

Based on who owned which slide.

| Person | Owns |
|---|---|
| Larah | Building the app with Claude Code, technical review |
| Jesse | Onboarding copy, the curriculum templates for each goal |
| Makayla | Testing with 10 students after Phase 1; turning their feedback into changes |
| Corey | Weekly news questions, recruiting timelines by industry |
| Gabe | Referrals, share cards, launch to clubs |
| Can | Pricing tests, Stripe setup numbers, tracking the unit economics |
| Everyone | Writing or reviewing questions for one track each |

---

## 8. Open decisions

1. Make the GitHub repo private now? (Recommended; needed before premium content.)
2. Ask for an account before or after the first set? (Recommended: after.)
3. Add a semester plan ($39 for 4 months)? Needs a deck update first.
4. Is 30 AI reviews a month the right premium cap, or should the deck's AI budget change?
5. Which three engineering tracks go first?
6. Leaderboards: by school, by club, or none at launch?
7. Sound effects on or off by default?

---

## Sources

- Bjork, R. A. (1994). Memory and metamemory considerations in the training of human beings. In *Metacognition: Knowing about Knowing*. MIT Press.
- Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks. *Psychological Bulletin*, 132(3).
- Dai, H., Milkman, K. L., & Riis, J. (2014). The fresh start effect. *Management Science*, 60(10).
- Deci, E. L., Koestner, R., & Ryan, R. M. (1999). A meta-analytic review of experiments examining the effects of extrinsic rewards on intrinsic motivation. *Psychological Bulletin*, 125(6).
- Gollwitzer, P. M. (1999). Implementation intentions. *American Psychologist*, 54(7).
- Hattie, J., & Timperley, H. (2007). The power of feedback. *Review of Educational Research*, 77(1).
- Kahneman, D., & Tversky, A. (1979). Prospect theory. *Econometrica*, 47(2).
- Kivetz, R., Urminsky, O., & Zheng, Y. (2006). The goal-gradient hypothesis resurrected. *Journal of Marketing Research*, 43(1).
- Mueller, C. M., & Dweck, C. S. (1998). Praise for intelligence can undermine children's motivation and performance. *Journal of Personality and Social Psychology*, 75(1).
- Nunes, J. C., & Drèze, X. (2006). The endowed progress effect. *Journal of Consumer Research*, 32(4).
- Roediger, H. L., & Karpicke, J. D. (2006). Test-enhanced learning. *Psychological Science*, 17(3).
- Rohrer, D., & Taylor, K. (2007). The shuffling of mathematics problems improves learning. *Instructional Science*, 35.
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation. *American Psychologist*, 55(1).
- Sailer, M., & Homner, L. (2020). The gamification of learning: a meta-analysis. *Educational Psychology Review*, 32.
- Schultz, W., Dayan, P., & Montague, P. R. (1997). A neural substrate of prediction and reward. *Science*, 275.
- Wilson, R. C., Shenhav, A., Straccia, M. A., & Cohen, J. D. (2019). The eighty five percent rule for optimal learning. *Nature Communications*, 10.
