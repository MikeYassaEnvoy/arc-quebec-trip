import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';
import './RoadBingo.css';

/**
 * RoadBingo — 4x4 tap-to-stamp card for the drive stretches.
 *
 * config: { card: string }  -> loads `<base>content/bingo/<card>.json`
 *   file shape: { id, title, cells: [{ label, emoji }] }  (16 cells)
 *
 * Stamps persist in localStorage per card id, so the card survives app switches.
 * score = stamps + 3 per completed line; maxScore = 16 + 3*10 = 46 (blackout).
 */

/** Accepts a config object, or the raw content id ('road-bingo:401-east'). */
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

interface Cell {
  label: string;
  emoji?: string;
}

interface Card {
  id: string;
  title: string;
  cells: Cell[];
}

type Phase = 'loading' | 'error' | 'playing';

const SIZE = 4;
const CELL_COUNT = SIZE * SIZE;
const LINE_POINTS = 3;
const MAX_SCORE = CELL_COUNT + LINE_POINTS * (SIZE + SIZE + 2); // 46

const BASE: string =
  ((import.meta as unknown as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/') || '/';

function contentUrl(path: string): string {
  const base = BASE.endsWith('/') ? BASE : `${BASE}/`;
  return `${base}${path.replace(/^\//, '')}`;
}

function storageKey(cardId: string) {
  return `arc:bingo:${cardId}`;
}

function loadStamps(cardId: string): boolean[] {
  const empty = new Array<boolean>(CELL_COUNT).fill(false);
  try {
    const raw = window.localStorage.getItem(storageKey(cardId));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed) && parsed.length === CELL_COUNT) {
      return parsed.map((v) => v === true);
    }
  } catch {
    /* ignore */
  }
  return empty;
}

function saveStamps(cardId: string, stamps: boolean[]) {
  try {
    window.localStorage.setItem(storageKey(cardId), JSON.stringify(stamps));
  } catch {
    /* private mode — ignore */
  }
}

/** All 10 winning lines as index arrays. */
const LINES: number[][] = (() => {
  const lines: number[][] = [];
  for (let r = 0; r < SIZE; r += 1) {
    lines.push(Array.from({ length: SIZE }, (_, c) => r * SIZE + c));
  }
  for (let c = 0; c < SIZE; c += 1) {
    lines.push(Array.from({ length: SIZE }, (_, r) => r * SIZE + c));
  }
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + i));
  lines.push(Array.from({ length: SIZE }, (_, i) => i * SIZE + (SIZE - 1 - i)));
  return lines;
})();

function completedLines(stamps: boolean[]): number[][] {
  return LINES.filter((line) => line.every((i) => stamps[i]));
}

function normalizeCard(raw: unknown, fallbackId: string): Card | null {
  const obj = raw as Record<string, unknown> | null;
  const rawCells: unknown = Array.isArray(raw) ? raw : obj?.cells ?? obj?.items;
  if (!Array.isArray(rawCells) || rawCells.length === 0) return null;
  const cells: Cell[] = rawCells.slice(0, CELL_COUNT).map((c) => {
    if (typeof c === 'string') return { label: c };
    const cell = c as Record<string, unknown>;
    return {
      label: String(cell.label ?? cell.text ?? cell.name ?? '?'),
      emoji: typeof cell.emoji === 'string' ? cell.emoji : undefined,
    };
  });
  while (cells.length < CELL_COUNT) cells.push({ label: 'Free space', emoji: '🍁' });
  return {
    id: typeof obj?.id === 'string' ? (obj.id as string) : fallbackId,
    title: typeof obj?.title === 'string' ? (obj.title as string) : 'Road Bingo',
    cells,
  };
}

export default function RoadBingo({ config, onComplete, onExit }: MiniGameProps) {
  const cardName = pickVariant(config, ['card', 'deck', 'name'], '401-east');

  const [phase, setPhase] = useState<Phase>('loading');
  const [card, setCard] = useState<Card | null>(null);
  const [stamps, setStamps] = useState<boolean[]>(() => new Array<boolean>(CELL_COUNT).fill(false));
  const [celebration, setCelebration] = useState<'' | 'bingo' | 'blackout'>('');
  const [reload, setReload] = useState(0);
  const knownLines = useRef(0);
  const collected = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    fetch(contentUrl(`content/bingo/${cardName}.json`))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((raw) => {
        if (cancelled) return;
        const parsed = normalizeCard(raw, cardName);
        if (!parsed) throw new Error('bad card');
        const saved = loadStamps(parsed.id);
        setCard(parsed);
        setStamps(saved);
        knownLines.current = completedLines(saved).length;
        collected.current = false;
        setPhase('playing');
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [cardName, reload]);

  const lines = useMemo(() => completedLines(stamps), [stamps]);
  const litCells = useMemo(() => {
    const set = new Set<number>();
    lines.forEach((line) => line.forEach((i) => set.add(i)));
    return set;
  }, [lines]);
  const stampedCount = stamps.filter(Boolean).length;
  const blackout = stampedCount === CELL_COUNT;
  const score = stampedCount + lines.length * LINE_POINTS;

  useEffect(() => {
    if (!card) return;
    if (blackout) {
      setCelebration('blackout');
    } else if (lines.length > knownLines.current) {
      setCelebration('bingo');
    }
    knownLines.current = lines.length;
  }, [lines.length, blackout, card]);

  useEffect(() => {
    if (!celebration) return undefined;
    const t = window.setTimeout(() => setCelebration(''), celebration === 'blackout' ? 4000 : 2200);
    return () => window.clearTimeout(t);
  }, [celebration]);

  const toggle = useCallback(
    (i: number) => {
      if (!card) return;
      setStamps((prev) => {
        const next = prev.slice();
        next[i] = !next[i];
        saveStamps(card.id, next);
        return next;
      });
    },
    [card],
  );

  const clearCard = useCallback(() => {
    if (!card) return;
    const fresh = new Array<boolean>(CELL_COUNT).fill(false);
    knownLines.current = 0;
    setStamps(fresh);
    saveStamps(card.id, fresh);
  }, [card]);

  const finish = useCallback(() => {
    if (collected.current) return;
    collected.current = true;
    onComplete(score, MAX_SCORE);
  }, [score, onComplete]);

  if (phase === 'loading') {
    return (
      <div className="bg-root bg-center">
        <div className="bg-spin" aria-hidden="true">
          🚗
        </div>
        <p className="bg-big">Printing your bingo card…</p>
      </div>
    );
  }

  if (phase === 'error' || !card) {
    return (
      <div className="bg-root bg-center">
        <div className="bg-xl" aria-hidden="true">
          🛑
        </div>
        <h2 className="bg-title">Oops! That bingo card is missing.</h2>
        <p className="bg-big">
          We could not find the <strong>{cardName}</strong> card.
        </p>
        <div className="bg-row">
          <button type="button" className="bg-btn bg-ghost" onClick={() => setReload((r) => r + 1)}>
            Try again
          </button>
          <button type="button" className="bg-btn bg-primary" onClick={onExit}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-root">
      <header className="bg-bar">
        <button type="button" className="bg-exit" onClick={onExit} aria-label="Leave bingo">
          ✕
        </button>
        <h2 className="bg-heading">{card.title}</h2>
        <div className="bg-score">
          <span className="bg-score-num">{stampedCount}/16</span>
          <span className="bg-score-lines">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>
      </header>

      <div className="bg-grid">
        {card.cells.map((cell, i) => {
          const on = stamps[i];
          let cls = 'bg-cell';
          if (on) cls += ' stamped';
          if (litCells.has(i)) cls += ' inline-win';
          return (
            <button key={`${cell.label}-${i}`} type="button" className={cls} onClick={() => toggle(i)}>
              <span className="bg-cell-emoji" aria-hidden="true">
                {cell.emoji ?? '🔍'}
              </span>
              <span className="bg-cell-label">{cell.label}</span>
              {on && (
                <span className="bg-stamp" aria-hidden="true">
                  <span className="bg-stamp-mark">🍁</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <footer className="bg-foot">
        <button type="button" className="bg-btn bg-ghost bg-small" onClick={clearCard}>
          New card (clear stamps)
        </button>
        <button type="button" className="bg-btn bg-primary" onClick={finish}>
          {blackout ? 'BLACKOUT! Collect points 🏆' : `Done for now — collect ${score} pts`}
        </button>
      </footer>

      {celebration && (
        <div className={`bg-celebrate ${celebration}`} role="status">
          <div className="bg-celebrate-card">
            <div className="bg-celebrate-emoji" aria-hidden="true">
              {celebration === 'blackout' ? '🏆' : '🎉'}
            </div>
            <p className="bg-celebrate-text">
              {celebration === 'blackout' ? 'BLACKOUT! Full card!' : 'BINGO!'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
