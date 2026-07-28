# The Amazing Race Canada: Yassa Edition — Build Plan

**Deliverable:** An offline-capable iPad web app (PWA) that turns the family's Aug 2–9, 2026 Québec road trip into an 8-leg Amazing Race Canada season for a 7–9-year-old early/confident reader.

**Hard deadline:** Installable on the iPad by **Saturday, Aug 1, 2026** (trip starts Aug 2). Today is July 27.

**Source itinerary:** `Quebec_Road_Trip_Itinerary_1.md` (copy into `content/reference/` — it is the ground truth for locations, times, and addresses).

---

## 1. Locked product decisions (do not re-litigate)

| Decision | Choice |
|---|---|
| Platform | Web app / PWA — Add to Home Screen from Safari, fullscreen, fully offline after install |
| Game mode | **Hybrid**: real-world challenges at each stop + on-screen mini-games for drives |
| Reading level | Age ~7–9. Short sentences, riddle-flavored clues, trivia allowed, **easy** scavenger lists (4–6 items). Every clue ≤ 3 short sentences |
| Verification | **Honor system** — big "Challenge Complete!" button, no parent gate. Optional "Add a photo" button on challenges where a photo is fun (never required) |
| Opponents | **4 ghost teams**, scripted comeback arc (see §5). He is never eliminated |
| Rewards | In-app only: badges, trophies, unlocking souvenir route map |
| Mini-games | All four: destination trivia, road bingo / I-spy, French phrase game, arcade mini-games |

---

## 2. Architecture

- **Stack:** Vite + React + TypeScript. No backend, no network calls at runtime. All content baked in as typed JSON. `vite-plugin-pwa` for the service worker (precache everything: JS, JSON, SVG, audio).
- **State:** Single Zustand (or React context) store persisted to `localStorage` on every change. State = current leg, per-challenge completion, points, photos (stored as base64/IndexedDB), standings history, unlocked badges.
- **Photos:** `<input type="file" accept="image/*" capture="environment">` → resized to ≤1280px → IndexedDB. This works in Safari PWAs with no permissions infrastructure.
- **No date gating.** Legs unlock sequentially (finish leg N → leg N+1 unlocks). A hidden dev/parent unlock (tap the app version 7 times) can jump legs in case a day gets skipped or reordered.
- **Target device:** iPad Safari, landscape-primary, design for 1180×820 logical px (works 1024×768 up). Big touch targets (≥64px). Kid-proof: no destructive actions without a long-press.
- **Deployment:** static host with HTTPS (GitHub Pages or Netlify — decide at integration; both fine). Then Safari → Share → Add to Home Screen on the iPad.

### Repo layout (each workstream owns its directories — no overlaps)

```
/src
  /engine        ← Workstream A (screens, store, routing, PWA)
  /minigames     ← Workstreams C1 & C2 (one folder per game)
  /ghosts        ← Workstream D (standings sim, ceremonies, finale)
  /types.ts      ← FROZEN contracts, defined in §3. Only integration may amend.
/content
  /legs/leg-1.json … leg-8.json    ← Workstream B
  /trivia/leg-1.json …             ← Workstream B
  /bingo/                          ← Workstream B
  /french/phrases.json             ← Workstream B
  /ghosts/season-script.json       ← Workstream D
/assets
  /avatars /badges /map /ui /icons ← Workstream E (all SVG + PNG app icons)
```

---

## 3. Frozen data contracts

All agents code against these. They are copied verbatim into `src/types.ts` by Workstream A before anything else merges.

```ts
export type ChallengeType =
  | 'scavenger'      // checklist of things to find/spot (4–6 items, tap to check)
  | 'count'          // "How many X?" — enter a number, any honest answer accepted
  | 'taste'          // try/eat something, then tap a fun rating (1–5 maple leaves)
  | 'physical'       // do a thing (timed via in-app stopwatch, or just do it)
  | 'trivia'         // 3–5 multiple-choice questions answered on the spot
  | 'speak-french'   // say a phrase to a real person; app shows phrase + phonetics
  | 'photo'          // take a specific photo (still honor-system completable)
  | 'minigame';      // launches a registered mini-game (drives / rainy backup)

export type StepKind =
  | 'route-marker'   // ordinary stop
  | 'detour'         // choose one of two challenge bundles (A or B)
  | 'roadblock'      // "Who's up for it?" framing — solo challenge for Yassa
  | 'speed-bump'     // quick bonus task
  | 'drive'          // car stretch → mini-games
  | 'pit-stop';      // hotel check-in → standings ceremony

export interface Challenge {
  id: string;                 // 'l3-basilica-ispy'
  type: ChallengeType;
  title: string;              // 'Stars of Notre-Dame'
  instructions: string;       // ≤3 short sentences, age 7–9
  checklist?: string[];       // scavenger/photo lists
  trivia?: TriviaQuestion[];
  frenchPhrase?: { fr: string; phonetic: string; en: string };
  timerSeconds?: number;      // physical challenges with a countdown/stopwatch
  minigameId?: string;        // when type === 'minigame'
  points: number;             // see §6 point economy
  photoPrompt?: string;       // enables optional photo button, e.g. 'Snap the cannon!'
}

export interface DetourOption { label: string; blurb: string; challenges: Challenge[]; }

export interface Step {
  id: string;                 // 'l1-s2'
  kind: StepKind;
  location: string;           // 'Fort Henry'
  scheduledTime?: string;     // '1:00 PM' — display only, never enforced
  clueRiddle: string;         // riddle shown on the envelope, ≤2 lines
  clueReveal: string;         // plain-language 'go here, do this' after tapping open
  challenges?: Challenge[];   // route-marker/roadblock/speed-bump/drive
  detour?: { a: DetourOption; b: DetourOption };
  funFact?: string;           // one-liner shown after completion
}

export interface Leg {
  id: number;                 // 1–8
  title: string;              // 'Kingston: Forts & Cannons'
  date: string;               // '2026-08-02'
  routeText: string;          // 'Ajax → Kingston'
  steps: Step[];
  pitStop: { hotelName: string; city: string };
}

export interface TriviaQuestion {
  q: string; choices: string[]; answerIndex: number; funFact?: string;
}

// Mini-game plugin contract — every game is a React component:
export interface MiniGameProps {
  config?: unknown;                        // game-specific JSON from content pack
  onComplete: (score: number, maxScore: number) => void;
  onExit: () => void;
}
// Registered in src/minigames/registry.ts as Record<string, React.FC<MiniGameProps>>

// Ghost season script:
export interface GhostTeam {
  id: string; name: string; members: [string, string];
  avatarId: string; tagline: string; personality: string; // used in ceremony flavor text
}
export interface LegScriptEntry {
  legId: number;
  yassaPlacement: number;         // scripted placement 1..teamsRemaining
  eliminatedTeamId?: string;      // team cut at this pit stop, if any
  ceremonyLines: string[];        // host dialogue, ≤3 lines, references the placement
  closeCall?: string;             // optional drama beat ('Team Maple arrived 2 minutes ahead!')
}
```

**State shape (Workstream A owns, others read):** `{ teamName, avatarId, currentLegId, completed: Record<challengeId, {at: string, points: number, photoKey?: string}>, detourChoices: Record<stepId,'a'|'b'>, standingsHistory: LegScriptEntry-results, badges: string[] }`

---

## 4. The eight legs — full challenge content spec (Workstream B implements)

Tone for all clue text: playful race-host voice, riddles kept guessable by a 7–9-year-old, with the reveal always stating the location plainly. Every leg ends with the pit-stop step at that night's hotel.

### Leg 0 — "Backyard Trial Run" (practice leg — play at home any day before Aug 2)
Purpose: learn every app mechanic before the real race. Unlocked immediately after onboarding; completing it unlocks Leg 1. Points don't count toward the season total.
1. **route-marker — Living Room Starting Line**: first clue-envelope rip-open (tutorial copy explains "this is how clues work"); `trivia` 3 easy warm-up questions about the trip (Which city has a castle hotel? What animal lives at the Biodôme? What do you say for "hello" in French?). 5 pts.
2. **route-marker — The Backyard**: `scavenger` "Explorer Training": something green, a bug, a rock smaller than your thumb, something that can fly, something older than you. Teaches the tap-to-check list. 10 pts.
3. **speed-bump — Around the House**: `physical` stopwatch tutorial — run around the yard (or house) twice, beat 60 seconds. photoPrompt: 'Victory pose!' (teaches the optional photo button). 5 pts.
4. **drive — Couch Test Drive**: `minigame` — practice Road Bingo card `bingo:backyard` (16 around-the-house items) and a taste of TriviaRunner. Teaches how car stretches work. 5 pts.
5. **pit-stop — Home Starting Line**: **"Meet the Teams" ceremony** — the host welcomes Team Yassa to the race and introduces all four rival teams (avatars + taglines, one drama tease each: "Keep your eye on Team Maple…"). No placements, no elimination. Awards the **Race Rookie** badge and reveals the full route map with Leg 1 pulsing.

### Leg 1 — Sun Aug 2 · "Kingston: Forts & Cannons" (Ajax → Kingston)
1. **drive** (Ajax → Kingston, ~2h): mini-games `trivia:leg-1` (Kingston & forts deck) + `road-bingo:401-east` card.
2. **route-marker — Bread & Butter Bakery**: `taste` "Mystery Pastry" — pick any pastry, rate it, guess one ingredient (checklist of guesses). 10 pts.
3. **roadblock — Fort Henry**: "Who's ready to be a soldier?" — `physical` join the drill or march like a guard for 30s (in-app stopwatch); `count` cannons you can find; `trivia` 3 questions (answers learnable on site: what year, what color coats, what animal is the mascot — David the goat!). 30 pts. photoPrompt: 'Salute!'
4. **route-marker — Novel Idea bookshop**: `scavenger` find: a book with a boat on the cover, a book about Canada, a book with your first initial in the title, the kids' section. 15 pts.
5. **speed-bump — Lake Ontario Park**: `physical` playground circuit — slide, swing 10 swings, splash pad dash — beat 4 minutes on the stopwatch. 10 pts.
6. **route-marker — Copper Penny (dinner)**: `trivia` "Dinner Table Trivia" 3 questions recapping the day. 5 pts.
7. **pit-stop — Comfort Suites Kingston Central**: ceremony (scripted 2nd place, see §5).

### Leg 2 — Mon Aug 3 · "The Long Road to Montréal" (Kingston → Montréal)
1. **drive**: `trivia:leg-2` (Montréal deck) + `road-bingo:st-lawrence` + `french:starter-pack` (bonjour / merci / s'il vous plaît).
2. **detour — Lamoureux Park, Cornwall**: **Splash** (splash-pad relay: get wet at 3 different sprayers) **or** **Search** (riverfront scavenger: a ship, a flag, a bench, a bird, something red). 20 pts either.
3. **route-marker — Mount Royal / Kondiaronk Belvedere**: `scavenger` "Spot from the Top": a skyscraper, the river, a church roof, something green, a bridge. photoPrompt: 'Team photo at the lookout!' 20 pts.
4. **route-marker — Provigo**: `scavenger` "Supermarket Sweep": find the 4 dinner ingredients (parent picks them), plus one item with French-only packaging. 15 pts.
5. **speed-bump — say *bonjour* to the hotel front desk**: `speak-french`. 5 pts.
6. **pit-stop — Hôtel Monroe**: ceremony — **scripted 4th of 5, dramatic near-miss; Team Prairie Thunder eliminated** (see §5).

### Leg 3 — Tue Aug 4 · "Secrets of Old Montréal"
1. **route-marker — Metro ride**: `minigame:metro-navigator` — trace the route Guy-Concordia → Berri-UQAM → Place-d'Armes on an in-app simplified metro map before riding it for real. 10 pts.
2. **route-marker — Notre-Dame Basilica**: `scavenger` "I-Spy in the Basilica": gold stars on the ceiling, the giant organ pipes, blue light, a spiral staircase, a candle. 20 pts.
3. **route-marker — Place Jacques-Cartier**: `scavenger` "Busker Bingo": a street performer, an artist drawing someone, a flag, a horse (or horse statue/carriage), someone speaking French. 15 pts.
4. **roadblock — Montréal Science Centre**: "Who's got the brains?" — complete any 3 hands-on exhibits, then `trivia` 3 science questions. 30 pts.
5. **route-marker — Café Olimpico (evening)**: `speak-french`/order challenge — say "Un cannoli, s'il vous plaît" + `taste` rate the cannoli. 10 pts.
6. **pit-stop — Hôtel Monroe**: ceremony (scripted 3rd of 4).

### Leg 4 — Wed Aug 5 · "Bagels, Beasts & Bugs" (Mile End + Olympic Park)
1. **detour — St-Viateur Bagel**: **Watch** (watch the bakers, then answer: what makes Montréal bagels special — wood fire! honey water!) **or** **Taste** (blind-taste sesame vs plain, guess which is which). 20 pts.
2. **roadblock — Biodôme**: "Who's the animal expert?" — `scavenger` Ecosystem Hunt: penguin, sloth (hard mode — they hide!), a fish bigger than your head, a bird with a long beak, the lynx. `trivia` 3 animal questions from the leg-4 deck. 30 pts. photoPrompt: 'Penguin pose!'
3. **route-marker — Poutine Centrale**: `taste` "Judge's Table: Poutine" — rate on the maple-leaf scale, name the 3 ingredients of a classic poutine. 10 pts.
4. **route-marker — Insectarium**: `scavenger` "Bug Bingo": a butterfly landing, something with more than 6 legs, a leaf-shaped insect, the biggest beetle you can find. 15 pts.
5. **route-marker — Place des Festivals (evening)**: `physical` light-fountain dare + one First Peoples' Festival activity (listen to drumming / visit a teepee). 10 pts.
6. **pit-stop — Hôtel Monroe**: ceremony — **scripted 1st place win!** — **The Tide Riders eliminated**.

### Leg 5 — Thu Aug 6 · "Race to the Walled City" (Montréal → Québec City)
1. **drive**: `trivia:leg-5` (Québec City & New France deck) + `road-bingo:autoroute-20` + `french:pack-2` (je m'appelle… / où est… / merci beaucoup).
2. **route-marker — Trois-Rivières riverfront**: `physical` riverside run-around: touch 3 benches, find the river, 20 jumping jacks. 10 pts.
3. **route-marker — Funiculaire du Vieux-Québec**: ride up; `photo` "Castle Shot" — photograph Château Frontenac from Dufferin Terrace; `count` how many turrets/towers can you count? 15 pts.
4. **roadblock — Fêtes de la Nouvelle-France**: "Who can travel back in time?" — `scavenger` find: a soldier, a fancy hat, a drum, someone in a long dress, a wooden barrel; `speak-french` greet a costumed performer with "Bonjour!". 25 pts.
5. **route-marker — Metro Plus supermarket**: `scavenger` Supermarket Dash round 2 — harder: everything on the list must be found in under 15 minutes (stopwatch). 15 pts.
6. **pit-stop — Hôtel Le Dauphin**: ceremony (scripted 2nd of 3, close call).

### Leg 6 — Fri Aug 7 · "The Citadelle Showdown" (Québec City)
1. **roadblock — Citadelle**: "Who's brave enough for the cannon?" — watch the band show; on the tour, gather intel for `trivia`: what animal is the regiment mascot (Batisse the goat!), what year, how loud is the noon cannon (cover your ears!). 30 pts. photoPrompt: 'Guard face — no smiling!'
2. **route-marker — Plains of Abraham**: `physical` "Battlefield Sprint" — race to a monument and back, beat your parent or the 90-second clock. 15 pts.
3. **route-marker — Musée de la civilisation**: `scavenger` hands-on hunt: try 3 interactive exhibits, find something older than 100 years, find something from a boat. 20 pts.
4. **route-marker — Morrin Centre**: `scavenger` "Prison Break": find a cell, the oldest-looking book, a spiral staircase, something written in English. Completing it "unlocks the escape". 15 pts.
5. **route-marker — La Buche (dinner)**: `taste` "Sugar Shack Judge" — try tourtière or shepherd's pie + something maple; rate both. 10 pts.
6. **pit-stop — Hôtel Le Dauphin**: ceremony — **scripted 1st place** — **Team Maple eliminated** → finale is Yassa vs. The Rock Hoppers.

### Leg 7 — Sat Aug 8 · "Mazes, Dinosaurs & Ribs" (Québec City → Brockville)
1. **route-marker — deTerroir café**: `taste` breakfast treat rating. 5 pts.
2. **roadblock — Domaine de Maizerets**: "Who can escape the maze?" — `physical` the hedge maze, timed with the in-app stopwatch; two runs, beat your own time. Backup `scavenger` (gardens + playground) if maze is closed. 30 pts.
3. **drive** (longest leg): full mini-game lineup — `arcade:canoe-rapids`, `trivia:leg-7`, `road-bingo:homeward`.
4. **route-marker — Madrid 2.0**: `count` + `photo` "Dino Census": count every dinosaur statue, photo with the scariest one, `trivia` 2 dino questions. 15 pts.
5. **route-marker — Brockville Ribfest**: `taste` "Judge's Table: Ribs" — official scorecard: messiness, smokiness, yum factor; `physical` one Kids Zone activity; bonus badge if the fireworks happen. 20 pts.
6. **pit-stop — St. Lawrence College Residence**: ceremony (scripted 2nd of 2 — heartbreaker by minutes, sets up finale).

### Leg 8 — Sun Aug 9 · "THE FINALE: Race to the Finish" (Brockville → Ajax)
1. **route-marker — Richard's Coffeehouse**: `taste` final breakfast rating. 5 pts.
2. **roadblock — Aquatarium**: "Who's brave enough for the touch tank?" — `physical` touch-tank bravery + `scavenger` spot: an otter, something with claws, the biggest fish, the ship's wheel; climb the ship structure. 30 pts. photoPrompt: 'Captain of the ship!'
3. **drive**: `arcade:bagel-catch` championship round + finale trivia (mixed deck from the whole trip — "The Recap Round").
4. **route-marker — The Big Apple**: `physical` "The Final Challenge" — mini-golf head-to-head vs. parent, plus `taste` apple pie verdict. 25 pts.
5. **pit-stop — HOME, Ajax = FINISH LINE**: finale sequence (§5): photo-finish animation, **1st place**, trophy, confetti, full-season recap (every badge, every photo, standings history, total points).

---

## 5. Ghost teams & season script (Workstream D implements)

Four rival teams (final names/avatars up to the art + ghosts agents, these are the spec):

| id | Name | Members | Personality |
|---|---|---|---|
| `maple` | Team Maple | Ava & Liam, sisters–brother from Toronto | The strong rivals — friendly but always just ahead… until Leg 6 |
| `rockhoppers` | The Rock Hoppers | Finn & Rose, climbers from Newfoundland | Cheerful daredevils — finale opponents |
| `prairie` | Prairie Thunder | Wyatt & June, ranch kids from Saskatchewan | Fast starters, bad navigators — first out |
| `tide` | The Tide Riders | Coco & Marlow, surfers from Nova Scotia | Laid-back, always almost late — out at leg 4 |

**Scripted arc** (`season-script.json`): **L0 intro ceremony** (Meet the Teams — no placement, no elimination) · L1 2nd/5 · L2 **4th/5** (lowest moment; Prairie Thunder eliminated) · L3 3rd/4 · L4 **1st** (first win; Tide Riders eliminated) · L5 2nd/3 · L6 **1st** (Team Maple eliminated) · L7 2nd/2 (lost "by two minutes" — heartbreaker) · L8 **1st — champion**, photo-finish vs. Rock Hoppers.

Placements are **scripted regardless of performance**, but ceremony flavor lines should reference what he actually did (challenges completed, points earned) so it feels responsive: e.g. skip-heavy leg → "Team Maple nearly caught you at the maze!" Ceremony screen = pit-stop mat, host dialogue (text + simple host avatar), standings board animation, elimination farewell ("I'm sorry to tell you… you've been eliminated from the race"), badge award.

---

## 6. Point economy, badges, souvenir map

- Challenges award their listed points; detours award once. Mini-games award up to 10 pts/session (repeatable, but only first 3 sessions/leg count — anti-farming).
- **Badges** (Workstream E draws, D awards): one per leg (Race Rookie for Leg 0, Cannon Blaster, Metro Master, Bagel Boss, Penguin Pal, Time Traveler, Goat Whisperer, Maze Runner, Race Champion) + specials (First Win, French Speaker ×5 phrases, Photographer ×10 photos, Fearless — touch tank).
- **Souvenir route map**: stylized Ontario–Québec road map; each pit-stop reveals the next segment + a sticker at the city. Finale unlocks the complete animated map replay.

---

## 7. Parallel workstreams — agent task specs

Contracts in §3 are frozen; all six workstreams start **simultaneously**. Nobody edits another stream's directories. Integration (§8) merges.

### A — Race Engine & App Shell (1 agent, largest task)
Scaffold Vite+React+TS+PWA. Implement `types.ts` verbatim; Zustand store + localStorage persistence + IndexedDB photo store; screens: Onboarding (team name + avatar pick), Race HQ (map + current leg + standings), Leg view (step list with lock/done states), Clue envelope (rip-open animation → riddle → reveal), Challenge view (per-type UI: checklist, counter, maple-leaf rating, stopwatch, trivia runner, French phrase card, optional-photo button, big **CHALLENGE COMPLETE** button with confetti), Detour choice screen, Pit-stop hand-off point (renders Workstream D's ceremony component), Album, Badges. Hidden parent menu (7 taps on version): jump/skip legs, reset. Loads content from `/content/**` via a typed loader with schema validation (zod). Stub mini-game registry + stub ceremony component so the app runs standalone before merge. iPad landscape CSS, ≥64px targets, kid-proof.

### B — Content Packs (2 agents: legs 0–4, legs 5–8)
Author `content/legs/leg-N.json` per §4 (every step, clue riddle + reveal, challenges, points, photoPrompts, funFacts), `content/trivia/leg-N.json` (8–10 questions each; Leg 0's deck is 5 easy warm-ups; age-appropriate, answers verifiable from the itinerary/common knowledge), bingo cards (`backyard`, `401-east`, `st-lawrence`, `autoroute-20`, `homeward` — 16 cells each, road-trip-spottable items), `content/french/phrases.json` (2 packs, phrase + phonetics + English). Validate against §3 types (agents run the zod schema from a shared `content/schema.ts` they copy from §3). Reading level: every sentence ≤ 12 words.

### C1 — Mini-games: Trivia, French, Road Bingo (1 agent)
Three components implementing `MiniGameProps` + `registry.ts` entries: **TriviaRunner** (deck loader, one-question-at-a-time, big answer cards, streak fire animation, funFact reveal), **FrenchPhraseGame** (hear-ish via phonetics display, flip-card learn mode, then match-the-phrase quiz; "I said it to a real person!" bonus button), **RoadBingo** (4×4 tap-to-stamp card, bingo-line detection, celebratory stamp animation). Each works standalone in a dev harness page.

### C2 — Arcade mini-games (1 agent)
Three canvas/DOM touch games implementing `MiniGameProps`: **Canoe Rapids** (tilt-free: touch-drag to steer down a scrolling river, dodge rocks, 60s), **Bagel Catch** (catch falling bagels in a basket, dodge pigeons, 45s), **Maze Escape** (drag through a generated maze, 3 difficulty levels — thematically tied to the Maizerets hedge maze). Simple, forgiving, 7-year-old-appropriate physics. Standalone dev harness.

### D — Ghosts, Ceremonies & Finale (1 agent)
`season-script.json` per §5 (all ceremony dialogue, close-calls, elimination lines); **MeetTheTeams** intro ceremony for Leg 0 (host welcome + rival introductions, no standings); **StandingsBoard** component (animated placement reveal); **PitStopCeremony** component (mat scene, host lines referencing actual completed challenges/points via props, elimination sequence, badge award, next-leg tease); **FinaleSequence** (photo-finish animation, trophy, confetti storm, season recap: stats + photo reel + full map replay). Consumes only §3 types + store selectors; renders with placeholder art until E merges.

### E — Art & Assets (1 agent)
All SVG: 6 kid-team avatars (Yassa picks one) + 4 ghost-team avatar pairs matching §5 personalities; host character (2 poses); 12+ badges (§6 list); stylized route map with 8 city nodes + sticker states; clue envelope (closed/open); pit-stop mat; UI kit (buttons, maple-leaf rating, confetti sprites); app icon + iOS splash/`apple-touch-icon` PNGs; `manifest.webmanifest` theme. Style: bright flat cartoon, Amazing Race yellow/red/black palette, chunky outlines. Deliver with a `assets/index.ts` export map + a preview HTML page.

### F — Integration, QA & Ship (1 agent, runs AFTER A–E; sequential)
Merge all streams; replace stubs (registry, ceremony, art); zod-validate all content; full season playthrough via parent menu (all 8 legs, every challenge type, both detour branches, all mini-games, finale); offline test (airplane-mode reload); iPad viewport checks (1180×820 and 1024×768, landscape + portrait warning screen); Safari-specific checks (IndexedDB photos, Add-to-Home-Screen standalone mode, no 300ms tap delay); deploy to static host with HTTPS; produce `INSTALL.md` (3-step Add-to-Home-Screen instructions with screenshots) and `PARENT-GUIDE.md` (one page/leg: challenges list, what to prep — e.g. pick Provigo ingredients, check maze open, warn about noon cannon).

**Dependency graph:** A, B×2, C1, C2, D, E all parallel → F. Six-ish agents wide, then one to land it.

---

## 8. Open items for integration day

- Choice of static host (GitHub Pages vs Netlify) — integration builds and verifies locally; the actual public deploy waits for Mike's go-ahead.
- Yassa's team name — entered in onboarding, not hardcoded (default suggestion: "Team Yassa").
