# RoadBingo (`road-bingo`)

**Config:** `{ card: string }` — loads `<BASE_URL>content/bingo/<card>.json`, shape `{ id, title, cells: [{ label, emoji }] }` with 16 cells (extra cells ignored, short cards padded with a free space; plain string cells also accepted). Default card `401-east`.

**Play:** 4×4 tap-to-stamp grid, maple-leaf stamp animation, live bingo-line detection (4 rows + 4 cols + 2 diagonals) with a celebration overlay; full card = BLACKOUT.

**Scoring:** `score` = stamped cells + 3 per completed line; `maxScore` = 46 (blackout). `onComplete` fires on the footer "collect" button — the card is a whole-drive activity, so the kid can leave and come back.

**Persistence:** stamps saved to `localStorage` key `arc:bingo:<cardId>`; "New card (clear stamps)" resets that card.

**Config tolerance:** the component also accepts the raw content id string (`"road-bingo:401-east"`) or `{variant|id|minigameId}` — integration does not have to build a config object.
