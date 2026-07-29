# Round 2 fixes — parallel agent plan

Source: parent playtest feedback (July 28, 2026). Trip starts Aug 2 — all fixes land and deploy this week.
App: offline iPad PWA, Vite + React + TS. Read PLAN.md §3 for the base contracts. Verify vs 1080×690 viewport (iPad 9th gen Safari) — compact-height CSS modes exist at max-height 799/719px.

## New shared content contracts (frozen — Agent A implements, Agent B uses)

Extra optional fields on `Challenge` (zod schemas use passthrough + `config?: unknown`, so no schema change needed, but ADD them to the zod challenge schema + types.ts for clarity):

- `checklistStyle?: 'find' | 'guess'` — `'guess'` renders header "Your guesses" (no "Found X of Y" counter). Default `'find'` keeps current behavior.
- `launchText?: string` — replaces the mini-game launch line "Time for a car game!" (metro uses "A game for the Métro ride!").
- `countStyle?: 'single' | 'duel'` — `'duel'` renders TWO labeled counters via `config.duelLabels: [string, string]` (e.g. ["Team Yassa", "The Grown-Ups"]) and announces the lower-score winner (golf rules) on completion.
- Stopwatch: `timerSeconds` ≥ 60 displays as m:ss everywhere (target AND running clock).

## Agent A — Engine UX (`src/engine/**` and `src/types.ts` only; do not touch content/, src/minigames/, src/ghosts/)

1. TriviaRunner (engine inline, `src/engine/ui/TriviaRunner.tsx`): finished card — score + "Banking your points…" in large type (≥1.5em, match `.lead`+); auto-complete delay 1400ms → 3000ms.
2. Runtime answer shuffle in the same component: shuffle choice order on mount per question (Fisher–Yates over indices, remap answerIndex). Never mutate the source array.
3. MiniGameHost (`src/engine/screens/MiniGameHost.tsx`): after onComplete banks the score, navigate back to the STEP screen (router back past the challenge view / launch prompt). Never land on the "PLAY …" prompt again. If the game calls onExit (quit, no score), returning to the launch prompt is fine.
4. Stop-complete screen (`funfactscreen`): visual hierarchy — the stop/location title becomes the biggest element; fun-fact message secondary; the next-stop teaser (e.g. "Bread & Butter Bakery") at least as prominent as the fun-fact text.
5. Stopwatch (`src/engine/ui/Stopwatch.tsx`) rework: ALWAYS counts up from 0:00, no countdown mode, no reset-to-0 flash on resume; when elapsed passes `timerSeconds` show a persistent celebratory milestone banner ("🎉 30 seconds — you did it!" / "🎉 5 minutes of play — done!") while the clock keeps counting; Stop shows total elapsed. m:ss format when target ≥ 60s.
6. Counter: remove the +5 and +10 quick buttons (keep +/−, typing, Clear). Implement `countStyle: 'duel'` per the contract above (two counters + winner banner; lower wins).
7. ChallengeView: delete the "Mini-game id: …" muted line. Use `launchText` when present; default stays "Time for a car game!" only when the step kind is `drive`, else "Time for a game!".
8. Checklist CSS: 4-item checklists must render 2×2 (no 3+1 orphan). General rule preferred (e.g. grid auto-fit that avoids single-orphan rows) — verify with 4, 5, 6, 8 items at 1080×690 and 1180×820.
9. Photo option on EVERY challenge: render PhotoButton always; when `photoPrompt` is missing use generic copy "📸 Snap a picture!". Keep it visually secondary to the task.
10. `checklistStyle: 'guess'` per contract (header "Your guesses", no Found X of Y).
11. French-speaker badge: award on the FIRST completed challenge of type `speak-french` (from the store's completed map — no localStorage `arc:french:spoken` dependency; remove that check from App.tsx).
12. Types/zod: add the three new optional fields to types.ts + contentSchema.ts.
Gate: `tsc -b && vite build` clean.

## Agent B — Content (`content/legs/*.json` ONLY; validate every edit with python3 -m json.tool)

Keep reading level (sentences ≤12 words, ≤3 sentences). Do not touch trivia/bingo/french/ghosts files.
1. Leg 1 Bread & Butter: reframe as guessing — title like "Pastry Detective", instructions "What do you think is inside?", `checklistStyle: "guess"`, ~8 plausible ingredients (butter, sugar, chocolate, cinnamon, apple, almond, vanilla, a pinch of salt). Keep taste rating. photoPrompt: eating shot.
2. Leg 1 Novel Idea: remove the ask-a-seller instruction; add 2 more find items (total 6).
3. Leg 1 Lake Ontario Park: `timerSeconds: 300`; instructions say "5 minutes of playing" (minutes, never "300 seconds").
4. Leg 2 Lamoureux detour: REPLACE "Splash" with "Count" — Riverfront Count: count boats on the St. Lawrence + gulls + flags (count challenge, calm option). "Search" branch unchanged.
5. Leg 2 Provigo groceries: checklist = pasta, sausage, pasta sauce, cheese, cereal, milk (6 items).
6. Leg 3 Metro Navigator challenge: add `launchText: "A game for the Métro ride!"` (it is played on transit, not in the car).
7. Leg 4 Poutine: drop the ingredient checklist entirely — rate + photo of eating only.
8. Leg 4 Insectarium: rename "Bug Bingo" → "Bug Safari"; expand the list (butterfly landing, 6+ legs, leaf-shaped insect, biggest beetle, something that glows, a chrysalis, an ant at work, something with wings but not flying).
9. Leg 4 Place des Festivals: remove the light-fountain dare (keep the festival activity).
10. Leg 6 La Buche: split into TWO taste challenges — "Judge's Table: Main Dish" (tourtière/shepherd's pie) and "Judge's Table: Maple Dessert", each own rating + eating photoPrompt, points split.
11. Leg 7 Kids Zone: remove the high-five prompt.
12. Leg 8 drive: REMOVE the Recap Round trivia challenge (keep Bagel Catch).
13. Leg 8 Big Apple golf: replace timer with score entry — type `count`, `countStyle: "duel"`, `config: {"duelLabels": ["Team Yassa", "The Grown-Ups"]}`, instructions about entering both mini-golf scores, lower score wins.
14. Leg 8: add a NEW route-marker step "The Final Puzzle" between the Big Apple and the finish-line pit stop: clue riddle about remembering the whole journey; one challenge, type `minigame`, `minigameId: "photo-finish"`, 25 pts, title "Photo Finish".
15. All food/taste challenges across all legs: eating-photo photoPrompt (e.g. "Snap a picture of you eating it!") where missing.

## Agent C — Mini-games (`src/minigames/**` only)

1. FrenchPhraseGame: remove the "I said it to a real person!" bonus button and its `arc:french:spoken` localStorage writes; rescale maxScore accordingly.
2. C1 TriviaRunner (minigame): same runtime answer shuffle as Agent A item 2.
3. CanoeRapids: collectible/obstacle spawn tuning — a maple leaf must never spawn within a safe-clearance radius of a rock/log (define clearance ≥ 1.5× canoe width laterally and enough vertical gap to steer), so every leaf is attainable without a forced collision. Verify with the deterministic-seed harness approach used before (simulated runs in scratchpad).

## Agent D — Race narrative (`content/ghosts/season-script.json` + `src/ghosts/**` only)

1. Elimination language: pre-mat tension uses "may be eliminated"; actual eliminations state it plainly ("I'm sorry to tell you… you HAVE been eliminated"); non-elimination legs get the classic relief beat ("This is a non-elimination leg — you're still in the race!"). Audit every leg's ceremonyLines/closeCall.
2. Time-vs-points reframe (user decision): placements are explained as TIME ON THE COURSE; points are the season score. Host lines must connect them, e.g. "You banked 85 points today — but the Rock Hoppers ran the course six minutes faster." Update StandingsBoard/PitStopCeremony copy where it implies points decide placement. Keep the scripted arc untouched.
Validate JSON; keep reading level.

## Agent E — Photo Finish finale (`src/minigames/photofinish/**` + `src/minigames/registry.photofinish.ts` — nothing else)

New minigame `photo-finish`, React component implementing MiniGameProps. It may IMPORT (read-only) the engine photo store (`src/engine/photos.ts`) and race store to get photos + their legId/stop metadata — do not edit engine files.
Design: auto-pick one photo per leg (0–8) that has any photo (prefer earliest-taken per leg); shuffled photo cards + shuffled stop-name chips; kid-friendly TAP-TAP pairing (tap a photo, tap a stop chip) and an ordered row of numbered slots to arrange pairs chronologically; a pair/slot can be re-tapped to undo. "CHECK" button → if all correct: big win celebration + onComplete(maxScore); else a friendly "X aren't quite right — keep trying!" (never reveal which) and unlimited retries. Handle small pools gracefully (fewer than 3 legs with photos → simplified order-only puzzle; zero photos → friendly message + onExit). Registry export `photoFinishGames` keyed exactly `photo-finish`. Touch targets ≥60px; verify layout at 1080×690 and 1180×820.

## Integration (after all five)
Merge registry.photofinish into wiring.ts; tsc + build; playthrough spot-checks (trivia shuffle+timing, minigame return-to-step, stopwatch milestone, duel golf, guess checklist, 2×2 layout, ceremonies copy, Photo Finish with seeded photos); deploy via push (CI) and verify live.
