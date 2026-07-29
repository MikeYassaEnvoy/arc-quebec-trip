# FrenchPhraseGame (`french-phrases`)

**Config:** `{ pack: string }` — always loads `<BASE_URL>content/french/phrases.json`, then picks the pack (falls back to the first pack). The loader accepts `{packs:[{id,title,phrases:[{fr,phonetic,en}]}]}`, a bare array of packs, `{ "<pack-id>": {title,phrases} }`, `{ "<pack-id>": [...phrases] }`, or a flat phrase list.

**Flow:** LEARN (flip cards: French → phonetic + English, browse all) → QUIZ (English prompt, pick the French from 3 options) → results.

**Scoring:** `score` = quiz correct answers; `maxScore` = `phrases.length`. The quiz alone defines the score — there is no bonus step and no `localStorage` usage in this game.

**Config tolerance:** the component also accepts the raw content id string (`"french:starter-pack"`) or `{variant|id|minigameId}` — integration does not have to build a config object.
