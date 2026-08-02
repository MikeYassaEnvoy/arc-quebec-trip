/**
 * Shared ceremony furniture: avatars, the host's tap-to-advance dialogue box,
 * confetti and big kid-sized buttons. Internal to src/ghosts.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { AvatarResolver } from './types';
import './shared.css';

/* ------------------------------------------------------------------ */
/* placeholder art (swapped for Workstream E's SVGs via avatarResolver) */
/* ------------------------------------------------------------------ */

const PLACEHOLDER_EMOJI: Record<string, string> = {
  'ghost-maple': '🍁',
  'ghost-rockhoppers': '🧗',
  'ghost-prairie': '🐎',
  'ghost-tide': '🏄',
  'team-player': '⭐',
  host: '🎤',
  trophy: '🏆',
};

const PLACEHOLDER_HUE: Record<string, string> = {
  'ghost-maple': '#e03131',
  'ghost-rockhoppers': '#1c7ed6',
  'ghost-prairie': '#f08c00',
  'ghost-tide': '#0ca678',
  'team-player': '#7048e8',
  host: '#212529',
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function TeamAvatar({
  avatarId,
  name,
  teamId,
  size = 96,
  resolver,
  className,
}: {
  avatarId: string;
  name: string;
  teamId?: string;
  size?: number;
  resolver?: AvatarResolver;
  className?: string;
}) {
  const art = resolver?.(avatarId, { size, teamId });
  const emoji = PLACEHOLDER_EMOJI[avatarId];
  return (
    <div
      className={`arc-avatar${className ? ` ${className}` : ''}`}
      style={{
        width: size,
        height: size,
        background: PLACEHOLDER_HUE[avatarId] ?? '#495057',
        fontSize: Math.round(size * (emoji ? 0.52 : 0.36)),
      }}
      role="img"
      aria-label={name}
    >
      {art ?? emoji ?? initials(name)}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* motion                                                              */
/* ------------------------------------------------------------------ */

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);
  return reduced;
}

/** Fires `cb` once after `ms`; restarts when `key` changes. */
export function useTimedStep(key: unknown, ms: number, cb: () => void): void {
  const saved = useRef(cb);
  saved.current = cb;
  useEffect(() => {
    const t = window.setTimeout(() => saved.current(), ms);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, ms]);
}

/* ------------------------------------------------------------------ */
/* host dialogue                                                       */
/* ------------------------------------------------------------------ */

/**
 * Host lines revealed one at a time, letter by letter. Tap anywhere:
 * first tap finishes the current line, next tap moves on. `onDone` fires
 * after the last line is tapped past.
 */
export function HostDialogue({
  lines,
  onDone,
  hostName = 'Jon',
  avatarResolver,
  charMs = 26,
  children,
}: {
  lines: string[];
  onDone: () => void;
  hostName?: string;
  avatarResolver?: AvatarResolver;
  charMs?: number;
  children?: ReactNode;
}) {
  const safeLines = useMemo(() => lines.filter((l) => !!l && l.trim().length), [lines]);
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [chars, setChars] = useState(0);

  const line = safeLines[index] ?? '';

  useEffect(() => {
    setChars(reduced ? line.length : 0);
  }, [index, line, reduced]);

  useEffect(() => {
    if (chars >= line.length) return;
    const t = window.setTimeout(() => setChars((c) => c + 1), charMs);
    return () => window.clearTimeout(t);
  }, [chars, line, charMs]);

  // Nothing to say — hand straight back to the caller.
  useEffect(() => {
    if (safeLines.length === 0) onDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeLines.length]);

  const lineDone = chars >= line.length;

  const advance = () => {
    if (!lineDone) {
      setChars(line.length);
      return;
    }
    if (index < safeLines.length - 1) setIndex(index + 1);
    else onDone();
  };

  if (safeLines.length === 0) return null;

  return (
    <button type="button" className="arc-dialogue" onClick={advance}>
      <div className="arc-dialogue-host">
        <TeamAvatar avatarId="host" name={hostName} size={112} resolver={avatarResolver} />
        <span className="arc-dialogue-hostname">{hostName}</span>
      </div>
      <div className="arc-dialogue-body">
        {safeLines.slice(0, index).map((prev, i) => (
          <p className="arc-dialogue-past" key={`${i}-${prev}`}>
            {prev}
          </p>
        ))}
        <p className="arc-dialogue-current">
          {line.slice(0, chars)}
          {!lineDone && <span className="arc-caret" aria-hidden="true" />}
        </p>
        {children}
        <span className="arc-tap-hint">
          {lineDone
            ? index < safeLines.length - 1
              ? 'Tap to continue →'
              : 'Tap to keep going →'
            : 'Tap to skip'}
        </span>
      </div>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* confetti + buttons                                                  */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ['#ffd43b', '#e03131', '#ffffff', '#1c7ed6', '#0ca678', '#f76707'];

export function ConfettiStorm({ count = 70, storm = false }: { count?: number; storm?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        i,
        left: Math.random() * 100,
        delay: Math.random() * (storm ? 2.5 : 1.2),
        dur: 2.4 + Math.random() * 2.6,
        size: 8 + Math.random() * 12,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        spin: Math.random() > 0.5 ? 1 : -1,
      })),
    [count, storm],
  );
  if (reduced) return null;
  return (
    <div className="arc-confetti" aria-hidden="true">
      {bits.map((b) => (
        <span
          key={b.i}
          className="arc-confetti-bit"
          style={{
            left: `${b.left}%`,
            width: b.size,
            height: b.size * 0.6,
            background: b.color,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.dur}s`,
            ['--spin' as string]: `${b.spin * 720}deg`,
          }}
        />
      ))}
    </div>
  );
}

export function BigButton({
  children,
  onClick,
  tone = 'primary',
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: 'primary' | 'quiet';
}) {
  return (
    <button type="button" className={`arc-bigbtn arc-bigbtn-${tone}`} onClick={onClick}>
      {children}
    </button>
  );
}

/** Badge chip — real art arrives via `avatarResolver` at integration. */
export function BadgeChip({
  badgeId,
  size = 120,
  resolver,
  label,
}: {
  badgeId: string;
  size?: number;
  resolver?: AvatarResolver;
  label?: string;
}) {
  const art = resolver?.(badgeId, { size });
  const pretty =
    label ??
    badgeId
      .replace(/^badge-/, '')
      .split(/[-_]/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  return (
    <div className="arc-badge" style={{ width: size }}>
      <div className="arc-badge-disc" style={{ width: size, height: size, fontSize: size * 0.4 }}>
        {art ?? '🏅'}
      </div>
      <span className="arc-badge-label">{pretty}</span>
    </div>
  );
}
