import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps, TriviaQuestion } from '../../types';
import './TriviaRunner.css';

/**
 * TriviaRunner — one-question-at-a-time trivia for the drive stretches.
 *
 * config: { deck: string; count?: number; shuffle?: boolean }
 *   deck  -> loads `<base>content/trivia/<deck>.json`
 *   count -> max questions asked this session (default 8)
 *
 * score = correct answers, maxScore = questions asked. The engine caps points.
 */

interface TriviaConfig {
  deck?: string;
  count?: number;
  shuffle?: boolean;
}

type Phase = 'loading' | 'error' | 'playing' | 'done';

const BASE: string =
  ((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/') || '/';

function contentUrl(path: string): string {
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

/**
 * The engine may hand us the config object from content, or just the content id
 * ('trivia:leg-1'). Accept both, plus generic {variant|id} keys.
 */
export function pickVariant(config: unknown, keys: string[], fallback: string): string {
  const strip = (value: string) => {
    const i = value.lastIndexOf(':');
    return i === -1 ? value : value.slice(i + 1);
  };
  if (typeof config === 'string' && config) {
    const v = strip(config);
    return v || fallback;
  }
  const obj = config as Record<string, unknown> | null;
  if (!obj || typeof obj !== 'object') return fallback;
  for (const key of [...keys, 'variant', 'id', 'minigameId']) {
    const value = obj[key];
    if (typeof value === 'string' && value) return strip(value);
  }
  return fallback;
}

/** Accepts an array, or {questions|deck|trivia|items: [...]}. */
function normalizeDeck(raw: unknown): TriviaQuestion[] {
  const holder = raw as Record<string, unknown> | null;
  const candidate: unknown = Array.isArray(raw)
    ? raw
    : holder?.questions ?? holder?.deck ?? holder?.trivia ?? holder?.items ?? [];
  if (!Array.isArray(candidate)) return [];
  return candidate.filter((q): q is TriviaQuestion => {
    const item = q as TriviaQuestion | null;
    return (
      !!item &&
      typeof item.q === 'string' &&
      Array.isArray(item.choices) &&
      item.choices.length >= 2 &&
      typeof item.answerIndex === 'number' &&
      item.answerIndex >= 0 &&
      item.answerIndex < item.choices.length
    );
  });
}

function shuffled<T>(list: T[]): T[] {
  const out = list.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const CHEERS = ['Nice!', 'Yes!', 'Bang on!', 'You got it!', 'Champion!'];
const OOPS = ['So close!', 'Not quite!', 'Next one!', 'Good guess!'];

export default function TriviaRunner({ config, onComplete, onExit }: MiniGameProps) {
  const cfg = (typeof config === 'object' && config ? config : {}) as TriviaConfig;
  const deckName = pickVariant(config, ['deck', 'pack', 'name'], 'leg-1');
  const limit = typeof cfg.count === 'number' && cfg.count > 0 ? cfg.count : 8;

  const [phase, setPhase] = useState<Phase>('loading');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [reload, setReload] = useState(0);
  const collected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    fetch(contentUrl(`content/trivia/${deckName}.json`))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;
        const deck = normalizeDeck(raw);
        if (deck.length === 0) throw new Error('empty deck');
        const ordered = cfg.shuffle === false ? deck : shuffled(deck);
        setQuestions(ordered.slice(0, limit));
        setIndex(0);
        setPicked(null);
        setCorrectCount(0);
        setStreak(0);
        setBestStreak(0);
        collected.current = false;
        setPhase('playing');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckName, limit, reload]);

  const question = questions[index];
  const total = questions.length;
  const isLast = index >= total - 1;

  const pick = useCallback(
    (choice: number) => {
      if (picked !== null || !question) return;
      setPicked(choice);
      const right = choice === question.answerIndex;
      if (right) {
        setCorrectCount((c) => c + 1);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => (next > b ? next : b));
          return next;
        });
      } else {
        setStreak(0);
      }
    },
    [picked, question],
  );

  const next = useCallback(() => {
    if (isLast) {
      setPhase('done');
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  }, [isLast]);

  const playAgain = useCallback(() => setReload((r) => r + 1), []);

  const collect = useCallback(() => {
    if (collected.current) return;
    collected.current = true;
    onComplete(correctCount, total || 1);
  }, [correctCount, total, onComplete]);

  const cheer = useMemo(
    () => CHEERS[Math.floor(Math.random() * CHEERS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, picked],
  );
  const oops = useMemo(
    () => OOPS[Math.floor(Math.random() * OOPS.length)],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [index, picked],
  );

  if (phase === 'loading') {
    return (
      <div className="trv-root trv-center">
        <div className="trv-spinner" aria-hidden="true">
          🍁
        </div>
        <p className="trv-loading-text">Loading trivia…</p>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="trv-root trv-center">
        <div className="trv-oops-face" aria-hidden="true">
          🧭
        </div>
        <h2 className="trv-oops-title">Oops! This trivia deck is missing.</h2>
        <p className="trv-oops-body">
          We could not find <strong>{deckName}</strong>. Let&apos;s try something else!
        </p>
        <div className="trv-row">
          <button type="button" className="trv-btn trv-btn-ghost" onClick={playAgain}>
            Try again
          </button>
          <button type="button" className="trv-btn trv-btn-primary" onClick={onExit}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'done') {
    const pct = total ? correctCount / total : 0;
    const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;
    return (
      <div className="trv-root trv-center trv-end">
        <div className="trv-confetti" aria-hidden="true">
          🎉
        </div>
        <h2 className="trv-end-title">
          {correctCount} out of {total}!
        </h2>
        <div className="trv-stars" aria-label={`${stars} stars`}>
          {[0, 1, 2].map((i) => (
            <span key={i} className={i < stars ? 'trv-star on' : 'trv-star'}>
              ★
            </span>
          ))}
        </div>
        <p className="trv-end-sub">
          Best streak: <strong>{bestStreak}</strong> in a row {bestStreak >= 3 ? '🔥' : ''}
        </p>
        <div className="trv-row">
          <button type="button" className="trv-btn trv-btn-ghost" onClick={playAgain}>
            Play again
          </button>
          <button type="button" className="trv-btn trv-btn-primary" onClick={collect}>
            Collect my points!
          </button>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const answered = picked !== null;
  const gotIt = answered && picked === question.answerIndex;

  return (
    <div className="trv-root">
      <header className="trv-bar">
        <button type="button" className="trv-exit" onClick={onExit} aria-label="Leave trivia">
          ✕
        </button>
        <div className="trv-progress">
          <div className="trv-progress-fill" style={{ width: `${((index + 1) / total) * 100}%` }} />
          <span className="trv-progress-text">
            {index + 1} / {total}
          </span>
        </div>
        <div className={streak >= 3 ? 'trv-streak hot' : 'trv-streak'}>
          {streak >= 3 && (
            <span className="trv-fire" aria-hidden="true">
              🔥
            </span>
          )}
          <span className="trv-streak-num">{streak}</span>
        </div>
      </header>

      <h2 className="trv-question">{question.q}</h2>

      <div className="trv-grid">
        {question.choices.map((choice, i) => {
          let cls = 'trv-card';
          if (answered) {
            if (i === question.answerIndex) cls += ' right';
            else if (i === picked) cls += ' wrong';
            else cls += ' dim';
          }
          return (
            <button
              key={i}
              type="button"
              className={cls}
              disabled={answered}
              onClick={() => pick(i)}
            >
              <span className="trv-card-letter">{'ABCD'[i] ?? '?'}</span>
              <span className="trv-card-text">{choice}</span>
              {answered && i === question.answerIndex && <span className="trv-tick">✓</span>}
              {answered && i === picked && i !== question.answerIndex && (
                <span className="trv-cross">✕</span>
              )}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={gotIt ? 'trv-feedback good' : 'trv-feedback bad'}>
          <p className="trv-verdict">
            {gotIt ? `${cheer} 🎉` : `${oops} The answer is ${question.choices[question.answerIndex]}.`}
          </p>
          {question.funFact && (
            <p className="trv-funfact">
              <span aria-hidden="true">💡</span> {question.funFact}
            </p>
          )}
          <button type="button" className="trv-btn trv-btn-primary trv-next" onClick={next}>
            {isLast ? 'See my score!' : 'Next question →'}
          </button>
        </div>
      )}
    </div>
  );
}
