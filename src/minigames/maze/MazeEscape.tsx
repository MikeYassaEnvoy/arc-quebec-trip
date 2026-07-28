/**
 * Maze Escape — Workstream C2 (arcade mini-games).
 *
 * Drag a marker with your finger from the START gate to the EXIT gate of a
 * hedge maze (Domaine de Maizerets theme). The marker follows the finger but
 * slides along hedge walls instead of passing through them.
 *
 * Mazes are generated with a seeded recursive backtracker, so a given
 * {level, seed} always produces the exact same maze.
 *
 * Dependency free: React + canvas 2D only.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';

/* ------------------------------------------------------------------ config */

export type MazeLevel = 1 | 2 | 3;

export interface MazeConfig {
  /** 1 = 6x6, 2 = 9x9, 3 = 12x12. Default 1. */
  level: MazeLevel;
  /** Maze seed. Stable default so a level always looks the same. */
  seed: number;
}

/** Fallback seed — never call Math.random for maze generation. */
const DEFAULT_SEED = 20260808;
const SIZES: Record<MazeLevel, number> = { 1: 6, 2: 9, 3: 12 };
/** Par times in seconds per level, used for the time-bonus bands. */
const PAR: Record<MazeLevel, number> = { 1: 30, 2: 60, 3: 100 };
const MAX_SCORE = 100;

function readConfig(config: unknown): MazeConfig {
  const c = (config && typeof config === 'object' ? config : {}) as Record<string, unknown>;
  const lvlRaw = typeof c.level === 'number' ? Math.round(c.level) : 1;
  const level = (lvlRaw === 2 || lvlRaw === 3 ? lvlRaw : 1) as MazeLevel;
  const seed =
    typeof c.seed === 'number' && isFinite(c.seed) ? Math.floor(c.seed) : DEFAULT_SEED;
  return { level, seed };
}

/** Tiny deterministic RNG (mulberry32). */
function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return function rng(): number {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* -------------------------------------------------------------- generation */

export interface Maze {
  /** Cells per side (6 / 9 / 12). */
  n: number;
  /** Grid side length = 2n + 1. */
  g: number;
  /** blocked[row][col] — true = hedge. */
  blocked: boolean[][];
  /** Grid coords of the start opening and the exit opening. */
  startCell: [number, number];
  exitCell: [number, number];
}

export function generateMaze(n: number, seed: number): Maze {
  const g = 2 * n + 1;
  const blocked: boolean[][] = [];
  for (let r = 0; r < g; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < g; c++) row.push(true);
    blocked.push(row);
  }
  const visited: boolean[][] = [];
  for (let i = 0; i < n; i++) {
    const row: boolean[] = [];
    for (let j = 0; j < n; j++) row.push(false);
    visited.push(row);
  }

  const rng = makeRng(seed >>> 0);
  const dirs: Array<[number, number]> = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  const stack: Array<[number, number]> = [[0, 0]];
  visited[0][0] = true;
  blocked[1][1] = false;

  while (stack.length > 0) {
    const top = stack[stack.length - 1];
    const ci = top[0];
    const cj = top[1];

    /* Fisher-Yates shuffle of the four directions with the seeded rng */
    const order: Array<[number, number]> = dirs.slice() as Array<[number, number]>;
    for (let k = order.length - 1; k > 0; k--) {
      const m = Math.floor(rng() * (k + 1));
      const tmp = order[k];
      order[k] = order[m];
      order[m] = tmp;
    }

    let moved = false;
    for (let k = 0; k < order.length; k++) {
      const ni = ci + order[k][0];
      const nj = cj + order[k][1];
      if (ni < 0 || nj < 0 || ni >= n || nj >= n) continue;
      if (visited[ni][nj]) continue;
      visited[ni][nj] = true;
      blocked[2 * ni + 1][2 * nj + 1] = false;
      blocked[ci + ni + 1][cj + nj + 1] = false; // wall between the two cells
      stack.push([ni, nj]);
      moved = true;
      break;
    }
    if (!moved) stack.pop();
  }

  /* gates */
  blocked[0][1] = false; // entrance, above cell (0,0)
  blocked[2 * n][2 * n - 1] = false; // exit, below cell (n-1,n-1)

  return { n, g, blocked, startCell: [0, 1], exitCell: [2 * n, 2 * n - 1] };
}

/* ------------------------------------------------------------------- state */

type Phase = 'countdown' | 'playing' | 'paused' | 'over';

interface Layout {
  cs: number;
  ox: number;
  oy: number;
}

interface GameState {
  phase: Phase;
  countdown: number;
  t: number;
  maze: Maze;
  x: number;
  y: number;
  r: number;
  targetX: number;
  targetY: number;
  dragging: boolean;
  trail: Array<[number, number]>;
  bump: number;
  layout: Layout;
  W: number;
  H: number;
  finished: boolean;
  celebrate: number;
}

function createState(cfg: MazeConfig): GameState {
  const n = SIZES[cfg.level];
  const maze = generateMaze(n, cfg.seed + cfg.level * 7919);
  /* W/H/cs start at 0 so the first animation frame always lays the maze out
     against the real container size (and places the marker at START). */
  const layout: Layout = { cs: 0, ox: 0, oy: 0 };
  return {
    phase: 'countdown',
    countdown: 3.2,
    t: 0,
    maze,
    x: 0,
    y: 0,
    r: 12,
    targetX: 0,
    targetY: 0,
    dragging: false,
    trail: [],
    bump: 0,
    layout,
    W: 0,
    H: 0,
    finished: false,
    celebrate: 0,
  };
}

const TOP_PAD = 96;
const PAD = 20;

function relayout(s: GameState): void {
  const g = s.maze.g;
  const availW = Math.max(120, s.W - PAD * 2);
  const availH = Math.max(120, s.H - TOP_PAD - PAD);
  const cs = Math.max(12, Math.min(availW / g, availH / g));
  s.layout = {
    cs,
    ox: (s.W - g * cs) / 2,
    oy: TOP_PAD + (availH - g * cs) / 2,
  };
  s.r = cs * 0.3;
}

function gridCenter(s: GameState, row: number, col: number): [number, number] {
  const { cs, ox, oy } = s.layout;
  return [ox + col * cs + cs / 2, oy + row * cs + cs / 2];
}

function resetMarker(s: GameState): void {
  const p = gridCenter(s, 1, 1);
  s.x = p[0];
  s.y = p[1];
  s.targetX = p[0];
  s.targetY = p[1];
  s.trail = [[p[0], p[1]]];
}

/* --------------------------------------------------------------- collision */

function collides(s: GameState, x: number, y: number): boolean {
  const { cs, ox, oy } = s.layout;
  const g = s.maze.g;
  const r = s.r;

  if (x - r < ox || y - r < oy || x + r > ox + g * cs || y + r > oy + g * cs) return true;

  const c0 = Math.max(0, Math.floor((x - r - ox) / cs));
  const c1 = Math.min(g - 1, Math.floor((x + r - ox) / cs));
  const r0 = Math.max(0, Math.floor((y - r - oy) / cs));
  const r1 = Math.min(g - 1, Math.floor((y + r - oy) / cs));

  for (let row = r0; row <= r1; row++) {
    for (let col = c0; col <= c1; col++) {
      if (!s.maze.blocked[row][col]) continue;
      const rx = ox + col * cs;
      const ry = oy + row * cs;
      const nx = Math.max(rx, Math.min(x, rx + cs));
      const ny = Math.max(ry, Math.min(y, ry + cs));
      const dx = x - nx;
      const dy = y - ny;
      if (dx * dx + dy * dy < r * r) return true;
    }
  }
  return false;
}

function moveMarker(s: GameState, dt: number): void {
  if (!s.dragging || s.finished) return;
  const maxSpeed = s.layout.cs * 11; // px/sec — fast but never teleports through walls
  let dx = s.targetX - s.x;
  let dy = s.targetY - s.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 0.4) return;
  const allowed = Math.min(dist, maxSpeed * dt);
  dx = (dx / dist) * allowed;
  dy = (dy / dist) * allowed;

  const stepMax = Math.max(1, s.r * 0.35);
  const steps = Math.max(1, Math.ceil(allowed / stepMax));
  const sx = dx / steps;
  const sy = dy / steps;

  for (let i = 0; i < steps; i++) {
    let blockedThis = false;
    if (sx !== 0) {
      if (!collides(s, s.x + sx, s.y)) s.x += sx;
      else blockedThis = true;
    }
    if (sy !== 0) {
      if (!collides(s, s.x, s.y + sy)) s.y += sy;
      else blockedThis = true;
    }
    if (blockedThis) s.bump = Math.min(1, s.bump + 0.2);
  }

  const last = s.trail[s.trail.length - 1];
  if (!last || Math.hypot(s.x - last[0], s.y - last[1]) > s.layout.cs * 0.16) {
    s.trail.push([s.x, s.y]);
    if (s.trail.length > 1200) s.trail.shift();
  }

  const exit = gridCenter(s, s.maze.exitCell[0], s.maze.exitCell[1]);
  if (Math.hypot(s.x - exit[0], s.y - exit[1]) < s.layout.cs * 0.5) {
    s.finished = true;
    s.celebrate = 1.1;
  }
}

/* ---------------------------------------------------------------- scoring */

export function mazeScore(level: MazeLevel, seconds: number): number {
  const par = PAR[level];
  let bonus: number;
  if (seconds <= par * 0.6) bonus = 40;
  else if (seconds <= par) bonus = 32;
  else if (seconds <= par * 1.6) bonus = 22;
  else if (seconds <= par * 2.5) bonus = 12;
  else bonus = 6;
  return 60 + bonus;
}

function medalFor(level: MazeLevel, seconds: number): string {
  const s = mazeScore(level, seconds);
  if (s >= 100) return '🥇 Gold hedge-runner!';
  if (s >= 92) return '🥈 Silver — so quick!';
  if (s >= 82) return '🥉 Bronze — nicely done!';
  return '🍁 You escaped the maze!';
}

/* --------------------------------------------------------------- component */

export const MazeEscape: React.FC<MiniGameProps> = ({ config, onComplete, onExit }) => {
  const cfg = useMemo(() => readConfig(config), [config]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const gs = useRef<GameState>(createState(cfg));

  const [phase, setPhaseUi] = useState<Phase>('countdown');
  const [elapsed, setElapsedUi] = useState(0);
  const [countLabel, setCountLabel] = useState('3');

  const setPhase = useCallback((p: Phase) => {
    gs.current.phase = p;
    setPhaseUi(p);
  }, []);

  const restart = useCallback(() => {
    /* fresh state with W/H = 0 — the next frame lays it out for the container */
    gs.current = createState(cfg);
    setElapsedUi(0);
    setCountLabel('3');
    setPhase('countdown');
  }, [cfg, setPhase]);

  useEffect(() => {
    const onVis = (): void => {
      if (document.hidden && (gs.current.phase === 'playing' || gs.current.phase === 'countdown')) {
        setPhase('paused');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [setPhase]);

  useEffect(() => {
    let raf = 0;
    let last = 0;
    let lastSecond = -1;

    const step = (now: number): void => {
      raf = requestAnimationFrame(step);
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (!last) last = now;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.05) dt = 0.05;
      if (dt < 0) dt = 0;

      const s = gs.current;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(320, wrap.clientWidth || window.innerWidth);
      const cssH = Math.max(320, wrap.clientHeight || window.innerHeight);
      if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);
        canvas.style.width = cssW + 'px';
        canvas.style.height = cssH + 'px';
      }
      if (s.W !== cssW || s.H !== cssH) {
        const oldCs = s.layout.cs;
        const oldOx = s.layout.ox;
        const oldOy = s.layout.oy;
        s.W = cssW;
        s.H = cssH;
        relayout(s);
        if (oldCs > 0) {
          const k = s.layout.cs / oldCs;
          const remap = (px: number, py: number): [number, number] => [
            s.layout.ox + (px - oldOx) * k,
            s.layout.oy + (py - oldOy) * k,
          ];
          const p = remap(s.x, s.y);
          s.x = p[0];
          s.y = p[1];
          const tp = remap(s.targetX, s.targetY);
          s.targetX = tp[0];
          s.targetY = tp[1];
          s.trail = s.trail.map((pt) => remap(pt[0], pt[1]));
        }
        if (s.trail.length === 0) resetMarker(s);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (s.phase === 'countdown') {
        s.countdown -= dt;
        const lbl = s.countdown > 2.2 ? '3' : s.countdown > 1.2 ? '2' : s.countdown > 0.2 ? '1' : 'GO!';
        setCountLabel((prev) => (prev === lbl ? prev : lbl));
        if (s.countdown <= -0.5) setPhase('playing');
      } else if (s.phase === 'playing') {
        s.t += dt;
        moveMarker(s, dt);
        if (s.bump > 0) s.bump = Math.max(0, s.bump - dt * 2.5);
        const sec = Math.floor(s.t);
        if (sec !== lastSecond) {
          lastSecond = sec;
          setElapsedUi(sec);
        }
        if (s.finished) {
          s.celebrate -= dt;
          if (s.celebrate <= 0) setPhase('over');
        }
      }

      draw(ctx, s, cfg);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cfg, setPhase]);

  /* pointer dragging */
  const toLocal = (clientX: number, clientY: number): [number, number] => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    return [clientX - rect.left, clientY - rect.top];
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = gs.current;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is best-effort */
    }
    const p = toLocal(e.clientX, e.clientY);
    s.targetX = p[0];
    s.targetY = p[1];
    s.dragging = true;
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    const s = gs.current;
    if (!s.dragging) return;
    const p = toLocal(e.clientX, e.clientY);
    s.targetX = p[0];
    s.targetY = p[1];
  };
  const onUp = (): void => {
    gs.current.dragging = false;
  };

  const s = gs.current;
  const seconds = s.t;
  const finalScore = mazeScore(cfg.level, seconds);
  const mm = Math.floor(elapsed / 60);
  const ss = elapsed % 60;
  const clock = `${mm}:${ss < 10 ? '0' : ''}${ss}`;

  return (
    <div ref={wrapRef} style={S.wrap}>
      <canvas
        ref={canvasRef}
        style={S.canvas}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
      />

      <div style={S.hud}>
        <div style={S.pill}>⏱ {clock}</div>
        <div style={S.pill}>Level {cfg.level}</div>
      </div>
      {phase === 'playing' || phase === 'countdown' ? (
        <button style={S.pauseBtn} onClick={() => setPhase('paused')} aria-label="Pause">
          ❚❚
        </button>
      ) : null}

      {phase === 'countdown' ? (
        <div style={S.overlayClear}>
          <div style={S.countdown}>{countLabel}</div>
          <div style={S.hint}>Drag your finger from START to EXIT!</div>
        </div>
      ) : null}

      {phase === 'paused' ? (
        <div style={S.overlay}>
          <div style={S.card}>
            <h2 style={S.h2}>Paused</h2>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={() => setPhase('playing')}>
                Keep Going
              </button>
              <button style={S.btnGhost} onClick={onExit}>
                Quit
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === 'over' ? (
        <div style={S.overlay}>
          <div style={S.card}>
            <h2 style={S.h2}>You escaped! 🌿</h2>
            <div style={S.bigScore}>
              {clock} <span style={S.bigScoreSub}>on level {cfg.level}</span>
            </div>
            <p style={S.p}>{medalFor(cfg.level, seconds)}</p>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={restart}>
                Play Again
              </button>
              <button style={S.btnGold} onClick={() => onComplete(finalScore, MAX_SCORE)}>
                Finish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* -------------------------------------------------------------------- draw */

function draw(ctx: CanvasRenderingContext2D, s: GameState, cfg: MazeConfig): void {
  const { W, H } = s;
  const { cs, ox, oy } = s.layout;
  const g = s.maze.g;

  ctx.fillStyle = '#cfe3b0';
  ctx.fillRect(0, 0, W, H);

  /* maze floor */
  ctx.fillStyle = '#f0e4c6';
  ctx.fillRect(ox, oy, g * cs, g * cs);

  /* gravel speckles on the paths (deterministic) */
  ctx.fillStyle = 'rgba(160,140,100,0.28)';
  for (let i = 0; i < 220; i++) {
    const a = (i * 2654435761) >>> 0;
    const px = ox + ((a % 1000) / 1000) * g * cs;
    const py = oy + (((a >>> 10) % 1000) / 1000) * g * cs;
    ctx.fillRect(px, py, 2, 2);
  }

  /* hedges */
  for (let row = 0; row < g; row++) {
    for (let col = 0; col < g; col++) {
      if (!s.maze.blocked[row][col]) continue;
      const x = ox + col * cs;
      const y = oy + row * cs;
      ctx.fillStyle = '#2e7d32';
      ctx.fillRect(x, y, cs + 0.5, cs + 0.5);
      /* leafy texture — deterministic per cell */
      const h = ((row * 73856093) ^ (col * 19349663)) >>> 0;
      ctx.fillStyle = 'rgba(27,94,32,0.75)';
      for (let k = 0; k < 3; k++) {
        const hx = ((h >>> (k * 5)) % 100) / 100;
        const hy = ((h >>> (k * 7 + 3)) % 100) / 100;
        ctx.beginPath();
        ctx.arc(x + hx * cs, y + hy * cs, cs * 0.13, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(122,192,109,0.55)';
      ctx.beginPath();
      ctx.arc(x + cs * 0.32, y + cs * 0.28, cs * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  /* gates */
  const start = gridCenter(s, s.maze.startCell[0], s.maze.startCell[1]);
  const exit = gridCenter(s, s.maze.exitCell[0], s.maze.exitCell[1]);

  ctx.fillStyle = '#f2b705';
  ctx.fillRect(start[0] - cs / 2, start[1] - cs / 2, cs, cs);
  ctx.fillStyle = '#231f20';
  ctx.font = `bold ${Math.max(11, cs * 0.34)}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START', start[0], start[1]);

  const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 260);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(exit[0] - cs / 2, exit[1] - cs / 2, cs, cs);
  ctx.globalAlpha = 0.35 * pulse;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(exit[0] - cs / 2, exit[1] - cs / 2, cs, cs);
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.fillText('EXIT', exit[0], exit[1]);

  /* breadcrumb trail */
  if (s.trail.length > 1) {
    ctx.strokeStyle = 'rgba(242,183,5,0.75)';
    ctx.lineWidth = Math.max(3, cs * 0.16);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(s.trail[0][0], s.trail[0][1]);
    for (let i = 1; i < s.trail.length; i++) ctx.lineTo(s.trail[i][0], s.trail[i][1]);
    ctx.stroke();
  }

  /* marker */
  const r = s.r;
  ctx.save();
  ctx.translate(s.x, s.y);
  if (s.bump > 0) ctx.translate((Math.random() - 0.5) * 3 * s.bump, (Math.random() - 0.5) * 3 * s.bump);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.75, r * 0.9, r * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = s.finished ? '#f2b705' : '#c8102e';
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = Math.max(2, r * 0.16);
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-r * 0.32, -r * 0.18, r * 0.17, 0, Math.PI * 2);
  ctx.arc(r * 0.32, -r * 0.18, r * 0.17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#231f20';
  ctx.beginPath();
  ctx.arc(-r * 0.3, -r * 0.16, r * 0.08, 0, Math.PI * 2);
  ctx.arc(r * 0.34, -r * 0.16, r * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* finish flourish */
  if (s.finished && s.celebrate > 0) {
    const k = 1 - s.celebrate / 1.1;
    ctx.strokeStyle = 'rgba(242,183,5,0.85)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(exit[0], exit[1], cs * (0.6 + k * 2.4), 0, Math.PI * 2);
    ctx.stroke();
  }

  /* title strip */
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1b5e20';
  ctx.fillText(`Maizerets Hedge Maze — Level ${cfg.level}`, W / 2, 52);
}

/* ------------------------------------------------------------------ styles */

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 360,
    overflow: 'hidden',
    background: '#cfe3b0',
    touchAction: 'none',
    WebkitUserSelect: 'none',
    userSelect: 'none',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  canvas: { display: 'block', width: '100%', height: '100%', touchAction: 'none' },
  hud: { position: 'absolute', top: 14, left: 14, display: 'flex', gap: 12, pointerEvents: 'none' },
  pill: {
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    borderRadius: 999,
    padding: '10px 20px',
    fontSize: 26,
    fontWeight: 800,
    minWidth: 90,
    textAlign: 'center',
  },
  pauseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 72,
    height: 72,
    borderRadius: 999,
    border: 'none',
    background: 'rgba(0,0,0,0.55)',
    color: '#fff',
    fontSize: 26,
    fontWeight: 800,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayClear: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  countdown: { fontSize: 150, fontWeight: 900, color: '#fff', textShadow: '0 6px 0 rgba(0,0,0,0.35)' },
  hint: { fontSize: 28, fontWeight: 700, color: '#fff', textShadow: '0 3px 0 rgba(0,0,0,0.4)' },
  card: {
    background: '#fffdf5',
    borderRadius: 28,
    padding: '32px 44px',
    textAlign: 'center',
    boxShadow: '0 18px 44px rgba(0,0,0,0.35)',
    maxWidth: 620,
  },
  h2: { margin: '0 0 10px', fontSize: 42, color: '#1b5e20' },
  p: { margin: '10px 0 18px', fontSize: 24, color: '#444' },
  bigScore: { fontSize: 66, fontWeight: 900, color: '#c8102e', lineHeight: 1 },
  bigScoreSub: { fontSize: 24, fontWeight: 700, color: '#666' },
  row: { display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 },
  btnPrimary: {
    minWidth: 200,
    minHeight: 72,
    borderRadius: 20,
    border: 'none',
    background: '#1b5e20',
    color: '#fff',
    fontSize: 28,
    fontWeight: 800,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  btnGold: {
    minWidth: 200,
    minHeight: 72,
    borderRadius: 20,
    border: 'none',
    background: '#f2b705',
    color: '#231f20',
    fontSize: 28,
    fontWeight: 800,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
  btnGhost: {
    minWidth: 200,
    minHeight: 72,
    borderRadius: 20,
    border: '3px solid #999',
    background: '#fff',
    color: '#444',
    fontSize: 28,
    fontWeight: 800,
    cursor: 'pointer',
    touchAction: 'manipulation',
  },
};

export default MazeEscape;
