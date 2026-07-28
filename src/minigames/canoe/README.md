# Canoe Rapids (`canoe-rapids`)

**Config** (all optional): `{ durationSeconds?: number = 60, targetScore?: number = 25, seed?: number }` — `seed` makes the river deterministic; omitted means a fresh river each play.

**Controls:** touch/drag anywhere left–right to steer the canoe; big ❚❚ pause button (top-right) → Keep Paddling / Quit (`onExit`).

**Scoring:** +1 per maple leaf caught; a rock or log costs 1 leaf, flashes the canoe for 1.4s of invulnerability, and never ends the run. Reports `onComplete(min(leaves, targetScore), targetScore)` → 0–25 of 25 by default (only fired by the **Finish** button on the game-over screen; **Play Again** restarts without reporting).
