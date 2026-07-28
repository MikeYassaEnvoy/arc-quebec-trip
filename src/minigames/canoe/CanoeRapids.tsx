/**
 * Canoe Rapids — Workstream C2 (arcade mini-games).
 *
 * Touch-drag left/right to steer a canoe down a scrolling river for 60s.
 * Collect maple leaves (+1). Rocks and logs cost a leaf and flash the canoe —
 * never a hard fail, never a game-over-before-the-timer.
 *
 * Dependency free: React + canvas 2D only.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';

/* ------------------------------------------------------------------ config */

export interface CanoeConfig {
  /** Length of a round in seconds. Default 60. */
  durationSeconds: number;
  /** Leaves that count as a "perfect" run — this is the reported maxScore. Default 25. */
  targetScore: number;
  /** Optional RNG seed; omit for a different river every time. */
  seed?: number;
}

const DEFAULTS = { durationSeconds: 60, targetScore: 25 };

function clampNum(v: unknown, d: number, lo: number, hi: number): number {
  return typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
}

function readConfig(config: unknown): CanoeConfig {
  const c = (config && typeof config === 'object' ? config : {}) as Record<string, unknown>;
  return {
    durationSeconds: clampNum(c.durationSeconds, DEFAULTS.durationSeconds, 10, 300),
    targetScore: clampNum(c.targetScore, DEFAULTS.targetScore, 5, 200),
    seed: typeof c.seed === 'number' && isFinite(c.seed) ? c.seed : undefined,
  };
}

/** Tiny deterministic RNG (mulberry32) so a seeded config replays identically. */
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

/* ------------------------------------------------------------------- state */

type Phase = 'countdown' | 'playing' | 'paused' | 'over';

interface Obstacle {
  kind: 'rock' | 'log';
  x: number;
  y: number;
  w: number;
  h: number;
  spin: number;
}
interface LeafItem { x: number; y: number; r: number; rot: number; spin: number }
interface Pop { x: number; y: number; life: number; text: string; color: string }
interface Foam { x: number; y: number; len: number; w: number }
interface Tree { y: number; side: -1 | 1; s: number; off: number }

interface GameState {
  phase: Phase;
  countdown: number;
  t: number;
  score: number;
  canoeX: number;
  targetX: number;
  tilt: number;
  invuln: number;
  shake: number;
  obstacles: Obstacle[];
  leaves: LeafItem[];
  pops: Pop[];
  foam: Foam[];
  trees: Tree[];
  spawnO: number;
  spawnL: number;
  W: number;
  H: number;
  rng: () => number;
}

function createState(cfg: CanoeConfig): GameState {
  const rng = makeRng(cfg.seed ?? ((Date.now() ^ 0x9e3779b9) >>> 0));
  const W = 1180;
  const H = 820;
  const foam: Foam[] = [];
  for (let i = 0; i < 26; i++) {
    foam.push({ x: rng() * W, y: rng() * H, len: 18 + rng() * 46, w: 2 + rng() * 3 });
  }
  const trees: Tree[] = [];
  for (let i = 0; i < 16; i++) {
    trees.push({ y: rng() * H, side: rng() < 0.5 ? -1 : 1, s: 0.7 + rng() * 0.6, off: rng() * 0.6 });
  }
  return {
    phase: 'countdown',
    countdown: 3.2,
    t: 0,
    score: 0,
    canoeX: W / 2,
    targetX: W / 2,
    tilt: 0,
    invuln: 0,
    shake: 0,
    obstacles: [],
    leaves: [],
    pops: [],
    foam,
    trees,
    spawnO: 0.9,
    spawnL: 0.6,
    W,
    H,
    rng,
  };
}

/* ------------------------------------------------------------------ shapes */

/** Half of a stylized maple leaf outline (x right of centre, y down). */
const LEAF_HALF: Array<[number, number]> = [
  [0, -1],
  [0.18, -0.56],
  [0.46, -0.66],
  [0.33, -0.28],
  [0.82, -0.26],
  [0.6, 0.02],
  [1, 0.28],
  [0.36, 0.36],
  [0.46, 0.76],
  [0.13, 0.56],
  [0.11, 1],
];

function drawLeaf(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.scale(r, r);
  ctx.beginPath();
  ctx.moveTo(LEAF_HALF[0][0], LEAF_HALF[0][1]);
  for (let i = 1; i < LEAF_HALF.length; i++) ctx.lineTo(LEAF_HALF[i][0], LEAF_HALF[i][1]);
  for (let i = LEAF_HALF.length - 1; i >= 0; i--) ctx.lineTo(-LEAF_HALF[i][0], LEAF_HALF[i][1]);
  ctx.closePath();
  ctx.fillStyle = '#e01b24';
  ctx.fill();
  ctx.lineWidth = 0.12;
  ctx.strokeStyle = '#8c1013';
  ctx.stroke();
  ctx.restore();
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* --------------------------------------------------------------- component */

export const CanoeRapids: React.FC<MiniGameProps> = ({ config, onComplete, onExit }) => {
  const cfg = useMemo(() => readConfig(config), [config]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const gs = useRef<GameState>(createState(cfg));

  const [phase, setPhaseUi] = useState<Phase>('countdown');
  const [score, setScoreUi] = useState(0);
  const [timeLeft, setTimeLeftUi] = useState(cfg.durationSeconds);
  const [countLabel, setCountLabel] = useState('3');

  const setPhase = useCallback((p: Phase) => {
    gs.current.phase = p;
    setPhaseUi(p);
  }, []);

  const restart = useCallback(() => {
    gs.current = createState(cfg);
    setScoreUi(0);
    setTimeLeftUi(cfg.durationSeconds);
    setCountLabel('3');
    setPhase('countdown');
  }, [cfg, setPhase]);

  /* pause when the tab / app is hidden */
  useEffect(() => {
    const onVis = (): void => {
      if (document.hidden && (gs.current.phase === 'playing' || gs.current.phase === 'countdown')) {
        setPhase('paused');
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [setPhase]);

  /* main loop */
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

      /* keep the backing store matched to the container */
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
        const kx = s.W ? cssW / s.W : 1;
        s.canoeX *= kx;
        s.targetX *= kx;
        s.W = cssW;
        s.H = cssH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (s.phase === 'countdown') {
        s.countdown -= dt;
        const lbl = s.countdown > 2.2 ? '3' : s.countdown > 1.2 ? '2' : s.countdown > 0.2 ? '1' : 'GO!';
        setCountLabel((prev) => (prev === lbl ? prev : lbl));
        if (s.countdown <= -0.5) setPhase('playing');
      } else if (s.phase === 'playing') {
        update(s, dt, cfg);
        const left = Math.max(0, Math.ceil(cfg.durationSeconds - s.t));
        if (left !== lastSecond) {
          lastSecond = left;
          setTimeLeftUi(left);
        }
        setScoreUi((prev) => (prev === s.score ? prev : s.score));
        if (s.t >= cfg.durationSeconds) setPhase('over');
      }

      draw(ctx, s, cfg);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [cfg, setPhase]);

  /* pointer steering */
  const pointerActive = useRef(false);
  const steer = (clientX: number): void => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    gs.current.targetX = clientX - rect.left;
  };
  const onDown = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    pointerActive.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* Safari can refuse capture — steering still works via move events */
    }
    steer(e.clientX);
  };
  const onMove = (e: React.PointerEvent<HTMLCanvasElement>): void => {
    if (!pointerActive.current) return;
    steer(e.clientX);
  };
  const onUp = (): void => {
    pointerActive.current = false;
  };

  const finalScore = Math.min(gs.current.score, cfg.targetScore);

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

      {/* HUD */}
      <div style={S.hud}>
        <div style={S.pill}>
          <span style={S.pillIcon}>🍁</span> {score}
        </div>
        <div style={S.pill}>⏱ {timeLeft}s</div>
      </div>
      {phase === 'playing' || phase === 'countdown' ? (
        <button style={S.pauseBtn} onClick={() => setPhase('paused')} aria-label="Pause">
          ❚❚
        </button>
      ) : null}

      {phase === 'countdown' ? (
        <div style={S.overlayClear}>
          <div style={S.countdown}>{countLabel}</div>
          <div style={S.hint}>Drag left and right to steer!</div>
        </div>
      ) : null}

      {phase === 'paused' ? (
        <div style={S.overlay}>
          <div style={S.card}>
            <h2 style={S.h2}>Paused</h2>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={() => setPhase('playing')}>
                Keep Paddling
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
            <h2 style={S.h2}>Nice paddling! 🛶</h2>
            <div style={S.bigScore}>
              {gs.current.score} <span style={S.bigScoreSub}>maple leaves</span>
            </div>
            <p style={S.p}>
              {gs.current.score >= cfg.targetScore
                ? 'Perfect run — the river never stood a chance!'
                : gs.current.score >= cfg.targetScore * 0.6
                  ? 'Great steering down the rapids!'
                  : 'The rapids are tricky. Try again!'}
            </p>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={restart}>
                Play Again
              </button>
              <button style={S.btnGold} onClick={() => onComplete(finalScore, cfg.targetScore)}>
                Finish
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ update */

function riverBounds(s: GameState): { x: number; w: number } {
  const w = Math.min(s.W * 0.86, 780);
  return { x: (s.W - w) / 2, w };
}

function update(s: GameState, dt: number, cfg: CanoeConfig): void {
  s.t += dt;
  const progress = Math.min(1, s.t / cfg.durationSeconds);
  const speed = 220 + 190 * progress; // px/sec, gentle ramp
  const { x: rx, w: rw } = riverBounds(s);
  const lanes = 5;
  const laneW = rw / lanes;

  /* canoe follows the finger with a little lag */
  const half = Math.min(34, laneW * 0.42);
  const prevX = s.canoeX;
  const target = Math.max(rx + half, Math.min(rx + rw - half, s.targetX));
  s.canoeX += (target - s.canoeX) * Math.min(1, dt * 9);
  s.tilt = Math.max(-0.35, Math.min(0.35, (s.canoeX - prevX) * 0.02));

  if (s.invuln > 0) s.invuln -= dt;
  if (s.shake > 0) s.shake = Math.max(0, s.shake - dt * 3);

  /* scrolling scenery */
  for (const f of s.foam) {
    f.y += speed * 0.9 * dt;
    if (f.y > s.H + 40) {
      f.y = -40;
      f.x = rx + s.rng() * rw;
      f.len = 18 + s.rng() * 46;
    }
  }
  for (const tr of s.trees) {
    tr.y += speed * 0.55 * dt;
    if (tr.y > s.H + 80) {
      tr.y = -80;
      tr.s = 0.7 + s.rng() * 0.6;
      tr.off = s.rng() * 0.6;
      tr.side = s.rng() < 0.5 ? -1 : 1;
    }
  }

  /* spawning */
  s.spawnO -= dt;
  if (s.spawnO <= 0) {
    s.spawnO = 1.15 - 0.55 * progress + s.rng() * 0.35;
    const lane = Math.floor(s.rng() * lanes);
    const isLog = s.rng() < 0.4;
    const w = isLog ? laneW * 1.5 : laneW * 0.66;
    const h = isLog ? 30 : 46;
    const cx = rx + lane * laneW + laneW / 2;
    s.obstacles.push({
      kind: isLog ? 'log' : 'rock',
      x: Math.max(rx + w / 2, Math.min(rx + rw - w / 2, cx)),
      y: -h,
      w,
      h,
      spin: (s.rng() - 0.5) * 0.4,
    });
  }
  s.spawnL -= dt;
  if (s.spawnL <= 0) {
    s.spawnL = 0.8 - 0.25 * progress + s.rng() * 0.4;
    const lane = Math.floor(s.rng() * lanes);
    s.leaves.push({
      x: rx + lane * laneW + laneW / 2,
      y: -30,
      r: 17,
      rot: s.rng() * Math.PI,
      spin: (s.rng() - 0.5) * 2,
    });
  }

  /* movement + collisions */
  const canoeY = s.H - 130;
  const cw = half * 1.5;
  const ch = 78;

  for (let i = s.obstacles.length - 1; i >= 0; i--) {
    const o = s.obstacles[i];
    o.y += speed * dt;
    if (o.y - o.h > s.H + 20) {
      s.obstacles.splice(i, 1);
      continue;
    }
    if (s.invuln <= 0) {
      // forgiving hitboxes: shrink both boxes
      const ox = Math.abs(o.x - s.canoeX);
      const oy = Math.abs(o.y - canoeY);
      if (ox < (o.w * 0.4 + cw * 0.34) && oy < (o.h * 0.4 + ch * 0.34)) {
        s.invuln = 1.4;
        s.shake = 1;
        if (s.score > 0) {
          s.score -= 1;
          s.pops.push({ x: s.canoeX, y: canoeY - 40, life: 1, text: '-1 🍁', color: '#ffd166' });
        } else {
          s.pops.push({ x: s.canoeX, y: canoeY - 40, life: 1, text: 'Splash!', color: '#ffffff' });
        }
        s.obstacles.splice(i, 1);
      }
    }
  }

  for (let i = s.leaves.length - 1; i >= 0; i--) {
    const l = s.leaves[i];
    l.y += speed * dt;
    l.rot += l.spin * dt;
    if (l.y - l.r > s.H + 20) {
      s.leaves.splice(i, 1);
      continue;
    }
    const dx = l.x - s.canoeX;
    const dy = l.y - canoeY;
    if (Math.abs(dx) < l.r + cw * 0.55 && Math.abs(dy) < l.r + ch * 0.5) {
      s.score += 1;
      s.pops.push({ x: l.x, y: l.y, life: 1, text: '+1', color: '#ffe66d' });
      s.leaves.splice(i, 1);
    }
  }

  for (let i = s.pops.length - 1; i >= 0; i--) {
    const p = s.pops[i];
    p.life -= dt * 1.4;
    p.y -= dt * 46;
    if (p.life <= 0) s.pops.splice(i, 1);
  }
}

/* -------------------------------------------------------------------- draw */

function draw(ctx: CanvasRenderingContext2D, s: GameState, cfg: CanoeConfig): void {
  const { W, H } = s;
  const { x: rx, w: rw } = riverBounds(s);

  ctx.save();
  if (s.shake > 0) {
    ctx.translate((Math.random() - 0.5) * 8 * s.shake, (Math.random() - 0.5) * 8 * s.shake);
  }

  /* banks */
  ctx.fillStyle = '#2f7a3e';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#256433';
  ctx.fillRect(0, 0, rx * 0.6, H);
  ctx.fillRect(W - rx * 0.6, 0, rx * 0.6, H);

  for (const tr of s.trees) {
    const bx = tr.side < 0 ? rx * (0.15 + tr.off * 0.7) : W - rx * (0.15 + tr.off * 0.7);
    drawTree(ctx, bx, tr.y, 26 * tr.s);
  }

  /* water */
  const grad = ctx.createLinearGradient(rx, 0, rx + rw, 0);
  grad.addColorStop(0, '#2a6fb0');
  grad.addColorStop(0.5, '#3f9bd6');
  grad.addColorStop(1, '#2a6fb0');
  ctx.fillStyle = grad;
  ctx.fillRect(rx, 0, rw, H);

  /* sandy edges */
  ctx.fillStyle = '#e0c98a';
  ctx.fillRect(rx - 10, 0, 10, H);
  ctx.fillRect(rx + rw, 0, 10, H);

  /* foam */
  ctx.strokeStyle = 'rgba(255,255,255,0.55)';
  ctx.lineCap = 'round';
  for (const f of s.foam) {
    ctx.lineWidth = f.w;
    ctx.beginPath();
    ctx.moveTo(f.x, f.y);
    ctx.lineTo(f.x, f.y + f.len);
    ctx.stroke();
  }

  /* obstacles */
  for (const o of s.obstacles) {
    if (o.kind === 'log') drawLog(ctx, o);
    else drawRock(ctx, o);
  }

  /* leaves */
  for (const l of s.leaves) drawLeaf(ctx, l.x, l.y, l.r, l.rot);

  /* canoe */
  const canoeY = H - 130;
  const blink = s.invuln > 0 && Math.floor(s.invuln * 12) % 2 === 0;
  if (!blink) drawCanoe(ctx, s.canoeX, canoeY, s.tilt, s.invuln > 0);

  /* floating text */
  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  for (const p of s.pops) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 4;
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  /* progress bar down the right bank */
  const prog = Math.min(1, s.t / cfg.durationSeconds);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  roundRect(ctx, W - 26, 90, 12, H - 200, 6);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  roundRect(ctx, W - 26, 90, 12, Math.max(4, (H - 200) * prog), 6);
  ctx.fill();

  ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(x - r * 0.12, y, r * 0.24, r * 0.8);
  ctx.fillStyle = '#1f5c2c';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.5);
  ctx.lineTo(x + r * 0.8, y + r * 0.1);
  ctx.lineTo(x - r * 0.8, y + r * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#2a7a3a';
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.9);
  ctx.lineTo(x + r * 0.6, y - r * 0.5);
  ctx.lineTo(x - r * 0.6, y - r * 0.5);
  ctx.closePath();
  ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.ellipse(0, o.h * 0.42, o.w * 0.62, o.h * 0.24, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8d8d95';
  ctx.beginPath();
  ctx.moveTo(-o.w / 2, o.h / 2);
  ctx.lineTo(-o.w * 0.34, -o.h * 0.42);
  ctx.lineTo(o.w * 0.08, -o.h / 2);
  ctx.lineTo(o.w / 2, o.h * 0.18);
  ctx.lineTo(o.w * 0.3, o.h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#b6b6bd';
  ctx.beginPath();
  ctx.moveTo(-o.w * 0.34, -o.h * 0.42);
  ctx.lineTo(o.w * 0.08, -o.h / 2);
  ctx.lineTo(o.w * 0.02, o.h * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLog(ctx: CanvasRenderingContext2D, o: Obstacle): void {
  ctx.save();
  ctx.translate(o.x, o.y);
  ctx.rotate(o.spin);
  ctx.fillStyle = '#7a4a22';
  roundRect(ctx, -o.w / 2, -o.h / 2, o.w, o.h, o.h / 2);
  ctx.fill();
  ctx.fillStyle = '#a4703c';
  ctx.beginPath();
  ctx.ellipse(o.w / 2 - o.h * 0.18, 0, o.h * 0.2, o.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5c3517';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(o.w / 2 - o.h * 0.18, 0, o.h * 0.1, o.h * 0.26, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawCanoe(ctx: CanvasRenderingContext2D, x: number, y: number, tilt: number, hurt: boolean): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(tilt);

  /* wake */
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 46, 30, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  /* hull */
  ctx.beginPath();
  ctx.moveTo(0, -48);
  ctx.quadraticCurveTo(30, -14, 26, 20);
  ctx.quadraticCurveTo(20, 46, 0, 50);
  ctx.quadraticCurveTo(-20, 46, -26, 20);
  ctx.quadraticCurveTo(-30, -14, 0, -48);
  ctx.closePath();
  ctx.fillStyle = hurt ? '#ffb3a7' : '#c96b2e';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#5f3312';
  ctx.stroke();

  /* inside */
  ctx.beginPath();
  ctx.ellipse(0, 2, 15, 30, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#8c4a1e';
  ctx.fill();

  /* paddle */
  ctx.save();
  ctx.rotate(Math.sin(Date.now() / 180) * 0.4);
  ctx.strokeStyle = '#e6d3a3';
  ctx.lineWidth = 6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-34, 18);
  ctx.lineTo(34, -6);
  ctx.stroke();
  ctx.restore();

  /* paddler */
  ctx.fillStyle = '#e01b24';
  ctx.beginPath();
  ctx.ellipse(0, 6, 12, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f0c090';
  ctx.beginPath();
  ctx.arc(0, -12, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(0, -16, 10, Math.PI, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* ------------------------------------------------------------------ styles */

const S: Record<string, React.CSSProperties> = {
  wrap: {
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: 360,
    overflow: 'hidden',
    background: '#2f7a3e',
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
  pillIcon: { fontSize: 24 },
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
  countdown: {
    fontSize: 150,
    fontWeight: 900,
    color: '#fff',
    textShadow: '0 6px 0 rgba(0,0,0,0.35)',
  },
  hint: { fontSize: 28, fontWeight: 700, color: '#fff', textShadow: '0 3px 0 rgba(0,0,0,0.4)' },
  card: {
    background: '#fffdf5',
    borderRadius: 28,
    padding: '32px 44px',
    textAlign: 'center',
    boxShadow: '0 18px 44px rgba(0,0,0,0.35)',
    maxWidth: 620,
  },
  h2: { margin: '0 0 10px', fontSize: 42, color: '#c8102e' },
  p: { margin: '0 0 22px', fontSize: 24, color: '#444' },
  bigScore: { fontSize: 72, fontWeight: 900, color: '#1f5c2c', lineHeight: 1 },
  bigScoreSub: { fontSize: 26, fontWeight: 700, color: '#666' },
  row: { display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginTop: 14 },
  btnPrimary: {
    minWidth: 200,
    minHeight: 72,
    borderRadius: 20,
    border: 'none',
    background: '#c8102e',
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

export default CanoeRapids;
