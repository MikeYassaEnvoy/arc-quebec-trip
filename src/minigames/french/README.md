# FrenchPhraseGame (`french-phrases`)

**Config:** `{ pack: string }` — always loads `<BASE_URL>content/french/phrases.json`, then picks the pack (falls back to the first pack). The loader accepts `{packs:[{id,title,phrases:[{fr,phonetic,en}]}]}`, a bare array of packs, `{ "<pack-id>": {title,phrases} }`, `{ "<pack-id>": [...phrases] }`, or a flat phrase list.

**Flow:** LEARN (flip cards: French → phonetic + English, browse all, "I said it to a real person!" toggle per phrase) → QUIZ (English prompt, pick the French from 3 options) → results.

**Scoring:** `score` = quiz correct + real-person bonuses; `maxScore` = `phrases.length * 2`. Bonus toggles persist in `localStorage` under `arc:french:spoken` (keyed `packId::fr`), so the "French Speaker ×5" badge can also be derived from that key.

**Config tolerance:** the component also accepts the raw content id string (`"french:starter-pack"`) or `{variant|id|minigameId}` — integration does not have to build a config object.
