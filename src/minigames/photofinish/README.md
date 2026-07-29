# Photo Finish (Agent E — finale mini-game)

Registered under the exact key **`photo-finish`**, wired to `content/legs/leg-8.json`
step `l8-s5` ("The Final Puzzle") → challenge `l8-finalpuzzle-photofinish`
(`type: "minigame"`, `minigameId: "photo-finish"`, 25 pts).

## Files

- `PhotoFinish.tsx` — the component, implements `MiniGameProps` from `src/types.ts`.
- `PhotoFinish.css` — self-contained styles (`pf-` prefix), bright yellow/red/black
  cartoon style matching `RoadBingo`/`TriviaRunner`. Includes compact-height modes at
  `max-height: 799px` / `719px` to match the engine's iPad-9th-gen breakpoints, and was
  spot-verified at both 1080×690 and 1180×820 with a seeded photo pool (see "Verification").
- `../registry.photofinish.ts` — the only other file this workstream touches. Exports
  `photoFinishGames: Record<string, FC<MiniGameProps>>` with the single `photo-finish` key.

## Wiring instructions (for integration)

`src/engine/wiring.ts` currently does:

```ts
import { coreGames, coreGameAliases } from '../minigames/registry.core';
import { arcadeGames } from '../minigames/registry.arcade';

export const minigameRegistry: MiniGameRegistry = {
  ...coreGames,
  ...coreGameAliases,
  ...arcadeGames,
};
```

Add one import and one spread:

```ts
import { photoFinishGames } from '../minigames/registry.photofinish';

export const minigameRegistry: MiniGameRegistry = {
  ...coreGames,
  ...coreGameAliases,
  ...arcadeGames,
  ...photoFinishGames,
};
```

No other change is needed — `resolveMiniGame('photo-finish')` will then hit the exact-key
match, and `MiniGameHost` already awards `challenge.points` (25) on `onComplete`, plus up to
+10 bonus (first 3 sessions/leg) proportional to `score/maxScore`, which is always `25/25`
on a win, so the bonus is automatically maxed on the very first successful play.

## Photo selection logic

Pure function of the race store's `photos: PhotoRecord[]` (`src/engine/store.ts`) and the
photo blob store (`src/engine/photos.ts`). No content-pack `config` is required or read.

1. Group all `PhotoRecord`s by `legId`.
2. Within each leg, keep only the **earliest-taken** photo (`at` timestamp).
3. Sort the resulting one-per-leg list **ascending by `legId`** (0 → 8) — this is the
   chronological "correct order" used for scoring; `legId` is monotonic with the trip
   timeline, so no separate date-sort is needed across legs.
4. For each chosen photo, resolve its **stop name**: `loadLeg(legId)` (read-only import
   from `src/engine/content.ts`) then `findStep(leg, photo.stepId)?.location`, falling back
   to `leg.title` if the step can't be found (e.g. stale `stepId` from an older content
   edit). The photo's pixel data comes from `getPhotoUrl(photo.key)` (object URL, revoked
   on unmount).

## Gameplay (tap-tap, no drag)

- **Photo grid** (unpaired photos) and **stop chips** (unpaired, shuffled independently of
  the photo order) sit at the top. Tapping a photo arms it (pulses); tapping a chip while a
  photo is armed (or vice versa) creates a **pair**, which moves into the "Matched" tray.
  Tapping the same armed photo/chip again just deselects it.
- **Tray**: tap a paired tile to arm it, then tap a numbered slot to place it — swapping out
  whatever was already there (the evicted tile returns to the tray). Tapping an *armed* tray
  tile a second time **un-pairs** it back into a raw photo + chip (mistake recovery at the
  pairing stage).
- **Slots**: tapping a filled slot with nothing armed picks that pair back up into the tray
  (undo placement). Tapping an armed tray tile onto any slot places it there.
- **CHECK**: compares each slot's occupant against the true chronological order *and* its
  paired chip. All correct → celebration screen (confetti + "PHOTO FINISH!") and, on tapping
  "Collect 25 points", `onComplete(25, 25)`. Otherwise a message states only the **count**
  of wrong slots — `"N aren't quite right — keep trying!"` (`"1 isn't…"` for the singular) —
  never which ones. Retries are unlimited; nothing is scored until a full correct pass.

## Graceful degradation

- **0 photos anywhere**: friendly full-screen message ("No photos in the album yet — go
  snap some memories first!") with a single button that calls `onExit`. No dead-end.
- **1–2 legs with photos** (`< 3`, per the brief): "simple mode" — the chip-matching step is
  skipped entirely; the photo cards themselves become the placeable tiles ("Only a few
  photos so far — just put them in order!"), and CHECK only verifies chronological order.
- **Missing/undeletable blob**: if `getPhotoUrl` can't produce a URL (e.g. the IndexedDB
  entry was cleared but the metadata record wasn't), the card/tile/slot falls back to a 📷
  placeholder icon instead of a broken `<img>`, so the puzzle stays playable.

## Verification performed

- `npx tsc -b` — clean, no errors in `photofinish/` or `registry.photofinish.ts`.
- Live dev-server test (`npm run dev`) with a seeded fake photo pool (canvas-generated
  JPEG blobs saved via the real `savePhotoBlob`, records pushed into the real
  `useRaceStore`), driving the component directly (bypassing `wiring.ts`, which integration
  still owns): verified at 1080×690 and 1180×820 —
  - 5-leg full pairing mode: pair → place → CHECK → win → `onComplete(25, 25)`.
  - Deliberate 2-wrong placement → `"2 aren't quite right — keep trying!"`, no reveal.
  - Undo: re-tap a filled slot (returns tile to tray) and re-tap an armed tray tile
    (splits pair back into raw photo + chip).
  - 2-photo pool → simple order-only mode with the "only a few photos" note.
  - 0-photo pool → empty-state screen, "Back to the race" button fires `onExit`.
  - 9-leg full pool (legs 0–8) at both viewports — no clipping/overflow in any of the three
    board sections (source pool, tray, numbered slots), including a mid-game state with all
    three sections populated at once. Real stop names resolved correctly from
    `content/legs/*.json` via `loadLeg`/`findStep`.
