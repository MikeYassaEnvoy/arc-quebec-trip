# Bagel Catch (`bagel-catch`)

**Config** (all optional): `{ durationSeconds?: number = 45, targetScore?: number = 40, seed?: number }` — `seed` makes the drop pattern deterministic; omitted means a new pattern each play.

**Controls:** touch/drag along the bottom to slide the basket; big ❚❚ pause button (top-right) → Keep Catching / Quit (`onExit`).

**Scoring:** sesame bagel +1, golden honey bagel +5 (~8% spawn, falls faster), pigeon steals a bagel (−1, floored at 0). Spawn rate and fall speed ramp gently over the round. Reports `onComplete(min(points, targetScore), targetScore)` → 0–40 of 40 by default (fired by **Finish** only; **Play Again** restarts without reporting).
