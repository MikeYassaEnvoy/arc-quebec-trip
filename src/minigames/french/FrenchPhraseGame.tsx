import { useCallback, useEffect, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';
import './FrenchPhraseGame.css';

/**
 * FrenchPhraseGame — LEARN (flip cards) then QUIZ (match the phrase).
 *
 * config: { pack: string }  -> pack id inside `<base>content/french/phrases.json`
 *
 * score    = quiz answers correct
 * maxScore = phrases.length  (one point per phrase, quiz alone defines it)
 */

export interface Phrase {
  fr: string;
  phonetic: string;
  en: string;
}

interface Pack {
  id: string;
  title: string;
  phrases: Phrase[];
}

type Phase = 'loading' | 'error' | 'learn' | 'quiz' | 'done';

const BASE: string =
  ((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/') || '/';

function contentUrl(path: string): string {
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

/** Accepts a config object, or the raw content id ('french:starter-pack'). */
function pickVariant(config: unknown, keys: string[], fallback: string): string {
  const strip = (value: string) => {
    const i = value.lastIndexOf(':');
    return i === -1 ? value : value.slice(i + 1);
  };
  if (typeof config === 'string' && config) return strip(config) || fallback;
  const obj = config as Record<string, unknown> | null;
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of [...keys, 'variant', 'id', 'minigameId']) {
    const value = obj[key];
    if (typeof value === 'string' && value) return strip(value);
  }
  return fallback;
}

function isPhrase(value: unknown): value is Phrase {
  const p = value as Phrase | null;
  return !!p && typeof p.fr === 'string' && typeof p.en === 'string';
}

function toPhrases(value: unknown): Phrase[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isPhrase).map((p) => ({
    fr: p.fr,
    en: p.en,
    phonetic: typeof p.phonetic === 'string' ? p.phonetic : '',
  }));
}

/**
 * Tolerant normalizer. Accepts:
 *   { packs: [{ id, title, phrases: [...] }] }
 *   [{ id, title, phrases: [...] }]
 *   { "starter-pack": { title, phrases: [...] }, ... }
 *   { "starter-pack": [ ...phrases ], ... }
 *   [ { fr, en, phonetic, pack? } ]      (flat list)
 */
function normalizePacks(raw: unknown): Pack[] {
  const out: Pack[] = [];

  const pushPack = (id: string, title: unknown, phrases: Phrase[]) => {
    if (phrases.length === 0) return;
    out.push({ id, title: typeof title === 'string' && title ? title : id, phrases });
  };

  const fromEntry = (entry: unknown, fallbackId: string) => {
    if (Array.isArray(entry)) {
      pushPack(fallbackId, fallbackId, toPhrases(entry));
      return;
    }
    const obj = entry as Record<string, unknown> | null;
    if (!obj) return;
    const id = typeof obj.id === 'string' ? obj.id : fallbackId;
    const phrases = toPhrases(obj.phrases ?? obj.items ?? obj.cards);
    pushPack(id, obj.title ?? obj.name, phrases);
  };

  if (Array.isArray(raw)) {
    if (raw.length > 0 && raw.every(isPhrase)) {
      // flat list, maybe tagged with `pack`
      const flat = raw as Array<Phrase & { pack?: string }>;
      const groups = new Map<string, Phrase[]>();
      flat.forEach((p) => {
        const key = String(p.pack ?? 'all');
        const list = groups.get(key) ?? [];
        list.push(p);
        groups.set(key, list);
      });
      groups.forEach((phrases, id) => pushPack(id, id, toPhrases(phrases)));
    } else {
      raw.forEach((entry, i) => fromEntry(entry, `pack-${i + 1}`));
    }
    return out;
  }

  const obj = raw as Record<string, unknown> | null;
  if (!obj) return out;

  if (Array.isArray(obj.packs)) {
    obj.packs.forEach((entry, i) => fromEntry(entry, `pack-${i + 1}`));
    return out;
  }

  Object.keys(obj).forEach((key) => fromEntry(obj[key], key));
  return out;
}

function shuffled<T>(list: T[]): T[] {
  const arr = list.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

interface QuizItem {
  phrase: Phrase;
  options: string[];
  answerIndex: number;
}

function buildQuiz(phrases: Phrase[]): QuizItem[] {
  const filler = ['Bonjour !', 'Merci beaucoup', "S'il vous plaît", 'Au revoir', 'Oui, merci'];
  return shuffled(phrases).map((phrase) => {
    const pool = phrases.filter((p) => p.fr !== phrase.fr).map((p) => p.fr);
    const distractors = shuffled(pool).slice(0, 2);
    shuffled(filler).forEach((candidate) => {
      if (distractors.length >= 2) return;
      if (candidate !== phrase.fr && !distractors.includes(candidate)) distractors.push(candidate);
    });
    const options = shuffled([phrase.fr, ...distractors]);
    return { phrase, options, answerIndex: options.indexOf(phrase.fr) };
  });
}

export default function FrenchPhraseGame({ config, onComplete, onExit }: MiniGameProps) {
  const packId = pickVariant(config, ['pack', 'deck', 'name'], 'starter-pack');

  const [phase, setPhase] = useState<Phase>('loading');
  const [pack, setPack] = useState<Pack | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [quiz, setQuiz] = useState<QuizItem[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [quizCorrect, setQuizCorrect] = useState(0);
  const [reload, setReload] = useState(0);
  const collected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    fetch(contentUrl('content/french/phrases.json'))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;
        const packs = normalizePacks(raw);
        if (packs.length === 0) throw new Error('no packs');
        const chosen =
          packs.find((p) => p.id === packId) ??
          packs.find((p) => p.id.toLowerCase() === packId.toLowerCase()) ??
          packs[0];
        setPack(chosen);
        setCardIndex(0);
        setFlipped(false);
        setQuizIndex(0);
        setPicked(null);
        setQuizCorrect(0);
        collected.current = false;
        setPhase('learn');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [packId, reload]);

  const phrases = pack?.phrases ?? [];

  const startQuiz = useCallback(() => {
    setQuiz(buildQuiz(phrases));
    setQuizIndex(0);
    setPicked(null);
    setQuizCorrect(0);
    setPhase('quiz');
  }, [phrases]);

  const answer = useCallback(
    (choice: number) => {
      if (picked !== null) return;
      setPicked(choice);
      if (choice === quiz[quizIndex]?.answerIndex) setQuizCorrect((c) => c + 1);
    },
    [picked, quiz, quizIndex],
  );

  const nextQuestion = useCallback(() => {
    if (quizIndex >= quiz.length - 1) setPhase('done');
    else {
      setQuizIndex((i) => i + 1);
      setPicked(null);
    }
  }, [quizIndex, quiz.length]);

  const maxScore = Math.max(1, phrases.length);
  const score = quizCorrect;

  const collect = useCallback(() => {
    if (collected.current) return;
    collected.current = true;
    onComplete(score, maxScore);
  }, [score, maxScore, onComplete]);

  if (phase === 'loading') {
    return (
      <div className="fr-root fr-center">
        <div className="fr-spin" aria-hidden="true">
          ⚜️
        </div>
        <p className="fr-big-text">Chargement… (loading!)</p>
      </div>
    );
  }

  if (phase === 'error' || !pack) {
    return (
      <div className="fr-root fr-center">
        <div className="fr-emoji-xl" aria-hidden="true">
          🥖
        </div>
        <h2 className="fr-title">Oh non! The phrase book is missing.</h2>
        <p className="fr-big-text">
          We could not open the <strong>{packId}</strong> pack.
        </p>
        <div className="fr-row">
          <button type="button" className="fr-btn fr-ghost" onClick={() => setReload((r) => r + 1)}>
            Try again
          </button>
          <button type="button" className="fr-btn fr-primary" onClick={onExit}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- LEARN ---------------- */
  if (phase === 'learn') {
    const phrase = phrases[cardIndex];
    return (
      <div className="fr-root">
        <header className="fr-bar">
          <button type="button" className="fr-exit" onClick={onExit} aria-label="Leave the game">
            ✕
          </button>
          <div className="fr-mode">
            <span className="fr-mode-on">1. Learn</span>
            <span className="fr-mode-off">2. Quiz</span>
          </div>
          <div className="fr-count">
            {cardIndex + 1} / {phrases.length}
          </div>
        </header>

        <button
          type="button"
          className={flipped ? 'fr-card flipped' : 'fr-card'}
          onClick={() => setFlipped((f) => !f)}
          aria-label="Flip the card"
        >
          <span className="fr-card-inner">
            <span className="fr-face fr-front">
              <span className="fr-flag" aria-hidden="true">
                ⚜️
              </span>
              <span className="fr-fr">{phrase.fr}</span>
              <span className="fr-hint">tap to flip</span>
            </span>
            <span className="fr-face fr-back">
              <span className="fr-phonetic">{phrase.phonetic || phrase.fr}</span>
              <span className="fr-en">“{phrase.en}”</span>
              <span className="fr-hint">tap to flip back</span>
            </span>
          </span>
        </button>

        <div className="fr-row fr-nav">
          <button
            type="button"
            className="fr-btn fr-ghost"
            disabled={cardIndex === 0}
            onClick={() => {
              setCardIndex((i) => Math.max(0, i - 1));
              setFlipped(false);
            }}
          >
            ← Back
          </button>
          {cardIndex < phrases.length - 1 ? (
            <button
              type="button"
              className="fr-btn fr-primary"
              onClick={() => {
                setCardIndex((i) => Math.min(phrases.length - 1, i + 1));
                setFlipped(false);
              }}
            >
              Next phrase →
            </button>
          ) : (
            <button type="button" className="fr-btn fr-go" onClick={startQuiz}>
              Start the quiz! 🎯
            </button>
          )}
          {cardIndex < phrases.length - 1 && (
            <button type="button" className="fr-btn fr-go fr-skip" onClick={startQuiz}>
              Quiz me now 🎯
            </button>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- QUIZ ---------------- */
  if (phase === 'quiz') {
    const item = quiz[quizIndex];
    if (!item) return null;
    const answered = picked !== null;
    const right = answered && picked === item.answerIndex;
    return (
      <div className="fr-root">
        <header className="fr-bar">
          <button type="button" className="fr-exit" onClick={onExit} aria-label="Leave the game">
            ✕
          </button>
          <div className="fr-mode">
            <span className="fr-mode-off">1. Learn</span>
            <span className="fr-mode-on">2. Quiz</span>
          </div>
          <div className="fr-count">
            {quizIndex + 1} / {quiz.length}
          </div>
        </header>

        <p className="fr-prompt">How do you say…</p>
        <h2 className="fr-english">“{item.phrase.en}”</h2>

        <div className="fr-options">
          {item.options.map((opt, i) => {
            let cls = 'fr-option';
            if (answered) {
              if (i === item.answerIndex) cls += ' right';
              else if (i === picked) cls += ' wrong';
              else cls += ' dim';
            }
            return (
              <button
                key={opt + i}
                type="button"
                className={cls}
                disabled={answered}
                onClick={() => answer(i)}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className={right ? 'fr-feedback good' : 'fr-feedback bad'}>
            <p className="fr-verdict">
              {right ? 'Oui! Parfait! 🎉' : `Almost! It is “${item.phrase.fr}”.`}
            </p>
            <p className="fr-say-it">
              Say it like this: <strong>{item.phrase.phonetic || item.phrase.fr}</strong>
            </p>
            <button type="button" className="fr-btn fr-primary" onClick={nextQuestion}>
              {quizIndex >= quiz.length - 1 ? 'See my score!' : 'Next →'}
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ---------------- DONE ---------------- */
  return (
    <div className="fr-root fr-center">
      <div className="fr-emoji-xl" aria-hidden="true">
        🎉
      </div>
      <h2 className="fr-title">
        {quizCorrect} / {quiz.length} right!
      </h2>

      <div className="fr-row">
        <button type="button" className="fr-btn fr-ghost" onClick={() => setReload((r) => r + 1)}>
          Play again
        </button>
        <button type="button" className="fr-btn fr-primary" onClick={collect}>
          Collect {score} of {maxScore} points!
        </button>
      </div>
    </div>
  );
}
