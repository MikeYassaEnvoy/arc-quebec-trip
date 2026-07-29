# Canoe Rapids (`canoe-rapids`)

**Config** (all optional): `{ durationSeconds?: number = 60, targetScore?: number = 25, seed?: number }` — `seed` makes the river deterministic; omitted means a fresh river each play.

**Controls:** touch/drag anywhere left–right to steer the canoe; big ❚❚ pause button (top-right) → Keep Paddling / Quit (`onExit`).

**Scoring:** +1 per maple leaf caught; a rock or log costs 1 leaf, flashes the canoe for 1.4s of invulnerability, and never ends the run. Reports `onComplete(min(leaves, targetScore), targetScore)` → 0–25 of 25 by default (only fired by the **Finish** button on the game-over screen; **Play Again** restarts without reporting).

**Spawn clearance:** the pure spawn/clearance math lives in `spawnLogic.ts` (no DOM/canvas/React imports, so it can be unit tested standalone). A maple leaf is never spawned within safe-clearance of an existing rock/log, and a rock/log is never spawned within safe-clearance of an existing leaf — "too close" means both less than 1.5× canoe width apart laterally AND less than the current-speed steering-reaction gap apart vertically. If every lane is blocked, that spawn cycle is skipped rather than forcing an unreachable leaf. Because leaves and obstacles always scroll at the same per-frame speed, the gap between any two spawned items is frozen at spawn time, so a single clearance check at spawn is sufficient for the item's whole time on screen.
