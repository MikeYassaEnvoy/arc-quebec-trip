# Maze Escape (`maze-escape`)

**Config:** `{ level?: 1 | 2 | 3 = 1, seed?: number = 20260808 }` — level 1 = 6×6, 2 = 9×9, 3 = 12×12 cells. Maze is built by a seeded recursive backtracker (`seed + level * 7919`), so a given `{level, seed}` is always the same maze — no unseeded randomness.

**Controls:** press anywhere and drag; the marker chases your finger, slides along hedge walls and can never pass through them. Leaves a gold breadcrumb trail. Big ❚❚ pause button → Keep Going / Quit (`onExit`).

**Scoring:** timer counts up; finishing at the red EXIT gate scores 60 (completion) + a time band of 40 / 32 / 22 / 12 / 6 versus par (30s / 60s / 100s per level). Reports `onComplete(66–100, 100)` via the **Finish** button; quitting reports nothing.

Theme: Domaine de Maizerets hedge maze (PLAN §4, Leg 7 roadblock).
