# src/ghosts — Ghosts, Ceremonies & Finale (Workstream D)

Everything the rival teams do: the Leg 0 "Meet the Teams" intro, the pit-stop
ceremonies for legs 1–7, the standings board, and the Leg 8 finale.

**Placements are scripted.** They come only from
`content/ghosts/season-script.json`. Nothing in this folder computes a placement
from gameplay — `legStats` only changes *which flavour line the host says*.

---

## Fastest path for integration (one line in `wiring.ts`)

`src/engine/ceremonyTypes.ts` defines its own prop shape. `engineAdapter.tsx`
already maps it onto these components and is **verified assignable** to A's
`Ceremonies` interface:

```ts
// src/engine/wiring.ts
import { ceremonyAdapters } from '../ghosts/engineAdapter';
export const ceremonies: Ceremonies = ceremonyAdapters;
```

Optional one-time hooks (call once at startup, e.g. in `main.tsx`):

```ts
import { setAvatarResolver, setPhotoUrlResolver, DEFAULT_LEG_BADGES } from '../ghosts';
setAvatarResolver((id, { size }) => ART[id] ? <Art .../> : null);   // Workstream E
setPhotoUrlResolver((key) => objectUrlCache.get(key));              // finale photo reel
```

The adapters call `onAwardBadge(DEFAULT_LEG_BADGES[legId])` then `onFinish()`.
Edit `DEFAULT_LEG_BADGES` in `engineAdapter.tsx` if Workstream E names badges
differently. The adapter loads the script itself (see the zod note below), so it
does **not** depend on `useSeasonScript()`.

---

## Quick wiring (direct components)

```tsx
import {
  loadSeasonScript, MeetTheTeams, PitStopCeremony, FinaleSequence,
  entryForLeg, type GhostSeasonScript,
} from '../ghosts';

const script: GhostSeasonScript = await loadSeasonScript();  // /content/ghosts/season-script.json
const entry = entryForLeg(script, legId)!;                   // ScriptEntry (superset of LegScriptEntry)

// Leg 0
<MeetTheTeams teams={script.teams} script={script} teamName={teamName} onDone={finishLeg0} />

// Legs 1–7
<PitStopCeremony
  entry={entry} teams={script.teams} teamName={teamName}
  legStats={{ pointsEarned, challengesCompleted, challengesTotal }}
  badgeId="cannon-blaster" history={standingsHistory} script={script}
  onDone={finishLeg}
/>

// Leg 8
<FinaleSequence
  teams={script.teams} script={script} teamName={teamName}
  seasonStats={{ totalPoints }} badges={badges} photos={photoUrls}
  onDone={goToAlbum}
/>
```

`onDone` is where the engine does its own work: award the badge, push the entry
onto `standingsHistory`, unlock the next leg, navigate.

---

## Data

### `loadSeasonScript(url?) => Promise<GhostSeasonScript>`
Fetches `${import.meta.env.BASE_URL}content/ghosts/season-script.json`
(`SEASON_SCRIPT_URL`), shape-checks it, caches per session. Throws on a
missing/malformed file. `clearSeasonScriptCache()` for the parent-menu reset.
The file must be precached by the service worker (it lives under `/content/**`).

### `GhostSeasonScript` (exported as `SeasonScript` inside this folder)
Structurally compatible with `SeasonScript` in `src/types.ts` (`{ teams, legs }`):
```ts
{
  version, playerTeamId: 'yassa', hostName,
  teams: GhostTeam[],            // §3 shape, exactly
  legs: ScriptEntry[],           // legs 0..8  (`entries` accepted as an alias)
  reactions: Record<teamId, { farewell, onOtherElimination, finale }>
}
```

> **⚠️ zod note for integration.** `src/engine/contentSchema.ts` models only the
> five §3 fields, and zod objects **strip unknown keys** — loading the script
> through `engine/content.ts` throws away `order`, `statsLines`, `intros`,
> `outroLines`, `eliminationLines`, `nextLegTease`, `reactions`, … Either add
> `.passthrough()` to `legScriptEntrySchema` / `seasonScriptSchema`, or let these
> components load the file themselves (the adapter already does). Everything
> degrades gracefully if stripped, but the leg-specific flavour is lost.
>
> Leg 0 is authored with `yassaPlacement: 1` **only** to satisfy that schema's
> `min(1)`. It carries `isIntro: true`; no component reads its placement.

### `ScriptEntry extends LegScriptEntry`
Frozen §3 fields (`legId`, `yassaPlacement`, `eliminatedTeamId?`,
`ceremonyLines`, `closeCall?`) plus optional additions, all authored in the JSON:

| field | use |
|---|---|
| `isIntro` | Leg 0 marker — placement is meaningless |
| `teamsRemaining` | "2nd place of 5" |
| `order: string[]` | full ranked finish order, `'yassa'` = the player. Empty on Leg 0. |
| `title` | leg title shown in the header |
| `intros: {teamId, tease}[]` | Leg 0 only |
| `outroLines` | Leg 0 only — "the race starts NOW" |
| `eliminationLines` | host's farewell script (last line is "…eliminated from the race.") |
| `statsLines: {heavy, mid, light}` | picked by completion ratio (≥80% / 40–79% / <40%) |
| `nextLegTease` | closing card |
| `photoFinishLines`, `recapLines` | Leg 8 only |

A plain `LegScriptEntry[]` also works everywhere — components fall back to
generic lines and derive an order from `yassaPlacement`.

### Text tokens
Any line may contain `{team}` (player team name), `{points}`, `{done}`,
`{total}`. Components substitute them via `fillTokens()`.

### Scripted arc (already authored, verified consistent)
L0 intro · L1 2nd/5 · L2 4th/5 + **prairie** out · L3 3rd/4 · L4 1st + **tide**
out · L5 2nd/3 · L6 1st + **maple** out · L7 2nd/2 ("by two minutes") ·
L8 1st, champion vs **rockhoppers**.

---

## Components

All four render a full-screen scene (`.arc-scene`, `min-height: 100svh`) sized
for iPad landscape; drop them in as the whole route/screen. Every tap target is
≥64px. All CSS is scoped under `.arc-*`.

### `<MeetTheTeams>` — Leg 0 ceremony
```ts
{
  teams: GhostTeam[];
  script: ScriptInput;            // SeasonScript | ScriptEntry[] | LegScriptEntry[]
  teamName: string;
  onDone: () => void;
  avatarResolver?: AvatarResolver;   // optional
  playerAvatarId?: string;           // default 'team-player'
  hostName?: string;                 // default 'Jon'
}
```
Host welcome → one card per rival (avatar, members, tagline, personality + a
drama tease) → line-up → "THE RACE IS ON!" → `onDone`. No placements.

### `<StandingsBoard>` — animated placement reveal
```ts
{
  teams: GhostTeam[];
  entry: ScriptEntry;
  teamName: string;
  history?: HistoryEntry[];       // [{legId, yassaPlacement, eliminatedTeamId?}] — past legs
  avatarResolver?: AvatarResolver;
  playerAvatarId?: string;
  onSettled?: () => void;         // fires when the stagger finishes
  instant?: boolean;              // skip the animation
  showEliminationStamp?: boolean; // default true
  title?: string;
}
```
Rows slide in staggered (260ms apart) in scripted order; the player's row is
gold-highlighted with a `YOU · 2nd` pill; teams eliminated on earlier legs are
grayed with an `ELIMINATED` stamp. Reusable on the Race HQ screen — pass
`instant` there.

### `<PitStopCeremony>` — legs 1–7
```ts
{
  entry: ScriptEntry;
  teams: GhostTeam[];
  teamName: string;
  legStats: { pointsEarned: number; challengesCompleted: number; challengesTotal: number };
  badgeId?: string;               // omit to skip the award beat
  onDone: () => void;
  history?: HistoryEntry[];
  script?: ScriptInput;           // supplies the team reaction lines
  reactions?: Record<string, TeamReactions>;  // overrides `script`
  avatarResolver?: AvatarResolver;
  playerAvatarId?: string;
  hostName?: string;
  pitStopName?: string;           // e.g. leg.pitStop.hotelName
  badgeLabel?: string;            // pretty badge name; defaults to title-cased id
}
```
Beats: **mat** (player avatar lands on the checkered mat, big placement number,
points/challenges strip, host dialogue tapped line-by-line) → **standings** →
**elimination** (host script, then the cut team's one-liner + a survivor's
reaction) → **badge** → **next-leg tease** → `onDone`.

`legStats` is required and is woven into the host's second line via
`statsLineFor()`: ≥80% complete → the "nothing could slow you down" variant,
40–79% → neutral, <40% → the "Team Maple nearly caught you" variant. Every
variant is authored per leg in the JSON. Confetti fires automatically when the
scripted placement is 1st.

### `<FinaleSequence>` — Leg 8
```ts
{
  teams: GhostTeam[];
  script: ScriptInput;            // all entries (SeasonScript preferred — carries reactions)
  teamName: string;
  seasonStats: {
    totalPoints: number;
    challengesCompleted?: number; challengesTotal?: number;
    legsCompleted?: number; photosTaken?: number; milesDriven?: number;
  };
  badges?: string[];              // badge ids — empty renders a friendly placeholder
  photos?: (string | { key?, url?, caption?, legId? })[];  // empty is fine
  onDone: () => void;
  avatarResolver?: AvatarResolver;
  playerAvatarId?: string;
  hostName?: string;
  badgeLabels?: Record<string, string>;
  mapReplay?: ReactNode;          // slot for Workstream E's animated route map
}
```
Photo finish (player edges ahead, ~5.6s, captions from `photoFinishLines`) →
"PHOTO FINISH!" → confetti storm + CHAMPIONS + host lines → trophy + the Rock
Hoppers' finale line → scrollable season recap (stat tiles, per-leg timeline
with eliminations, badge wall, photo reel, optional map slot) → `onDone`.

Photos must be object/data URLs already resolved from IndexedDB — this component
does no async work. Through the adapter, the engine only supplies `PhotoRecord`
keys, so register `setPhotoUrlResolver(key => url)` or the reel renders empty
frames (captions still show).

---

## Art hand-off (Workstream E)

Nothing here imports from `assets/`. Every avatar/badge/trophy goes through one
optional prop:

```ts
type AvatarResolver = (id: string, ctx: { size: number; teamId?: string }) => ReactNode;
```

Ids requested: `ghost-maple`, `ghost-rockhoppers`, `ghost-prairie`,
`ghost-tide`, the player's chosen avatar id (default `team-player`), `host`,
`trophy`, and each `badgeId`. Return `null`/`undefined` for anything you don't
have and the emoji/initials placeholder is used. Wire it once at integration:

```tsx
const resolveArt: AvatarResolver = (id, { size }) => {
  const Art = ART[id];
  return Art ? <Art width={size} height={size} /> : null;
};
```

## Accessibility / kid-proofing
- `prefers-reduced-motion` disables typing, confetti and row animations.
- No destructive controls; every screen advances only forward.
- Tap-to-skip on every typed line so an impatient 7-year-old is never stuck.
