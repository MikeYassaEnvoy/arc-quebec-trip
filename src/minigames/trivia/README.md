# TriviaRunner (`trivia`)

**Config:** `{ deck: string, count?: number, shuffle?: boolean }` — loads `<BASE_URL>content/trivia/<deck>.json` at runtime. Deck file may be a bare `TriviaQuestion[]` or `{ questions: [...] }`; invalid entries are dropped. Default deck `leg-1`, default `count` 8, question order shuffled unless `shuffle: false`.

**Answer order:** each question's answer choices are re-shuffled (Fisher–Yates over choice indices, correct index remapped) every time that question is presented — the source `TriviaQuestion.choices` array is never mutated, so replaying the same deck gets a different on-screen order.

**Scoring:** `score` = correct answers, `maxScore` = questions asked (≤ count). Streak counter (fire at 3+) is flavour only; `onComplete` fires when the kid taps "Collect my points!" on the end screen.

**Failure:** missing/empty deck → friendly "deck is missing" screen with *Try again* and *Go back* (`onExit`).

**Config tolerance:** the component also accepts the raw content id string (`"trivia:leg-1"`) or `{variant|id|minigameId}` — integration does not have to build a config object.
