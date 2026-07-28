# TriviaRunner (`trivia`)

**Config:** `{ deck: string, count?: number, shuffle?: boolean }` — loads `<BASE_URL>content/trivia/<deck>.json` at runtime. Deck file may be a bare `TriviaQuestion[]` or `{ questions: [...] }`; invalid entries are dropped. Default deck `leg-1`, default `count` 8, shuffled unless `shuffle: false`.

**Scoring:** `score` = correct answers, `maxScore` = questions asked (≤ count). Streak counter (fire at 3+) is flavour only; `onComplete` fires when the kid taps "Collect my points!" on the end screen.

**Failure:** missing/empty deck → friendly "deck is missing" screen with *Try again* and *Go back* (`onExit`).

**Config tolerance:** the component also accepts the raw content id string (`"trivia:leg-1"`) or `{variant|id|minigameId}` — integration does not have to build a config object.
