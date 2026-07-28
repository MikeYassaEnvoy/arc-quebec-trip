// ---------------------------------------------------------------------------
// FROZEN DATA CONTRACTS — PLAN.md §3, copied verbatim.
// Only the integration workstream may amend anything above the divider.
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Engine-side additions (Workstream A owns; everyone may read).
// These do not change any §3 shape — they only describe saved game state.
// ---------------------------------------------------------------------------

/** One completed challenge, keyed by Challenge['id'] in the store. */
export interface CompletedEntry {
  at: string;              // ISO timestamp
  points: number;          // points actually banked (0 for leg 0 in season totals)
  photoKey?: string;       // IndexedDB key of an attached photo, if any
}

/** What the app records after a pit-stop ceremony runs — the "standingsHistory" of §3. */
export interface LegResult {
  legId: number;
  yassaPlacement: number;
  teamsRemaining: number;
  eliminatedTeamId?: string;
  pointsEarned: number;
  completedAt: string;     // ISO timestamp
}

/** Metadata for a photo whose bytes live in IndexedDB under `key`. */
export interface PhotoRecord {
  key: string;             // IndexedDB key
  legId: number;
  stepId: string;
  challengeId: string;
  prompt: string;          // the photoPrompt that asked for it
  at: string;              // ISO timestamp
  width: number;
  height: number;
}

/** The full season script file (content/ghosts/season-script.json, Workstream D). */
export interface SeasonScript {
  teams: GhostTeam[];
  legs: LegScriptEntry[];
}
