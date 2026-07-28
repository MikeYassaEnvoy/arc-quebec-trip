/**
 * Bagel Catch — Workstream C2 (arcade mini-games).
 *
 * Drag the basket along the bottom to catch falling Montréal bagels for 45s.
 * Sesame bagel +1, rare golden honey bagel +5 (falls faster), pigeons steal a bagel.
 *
 * Dependency free: React + canvas 2D only.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';

/* ------------------------------------------------------------------ config */

export interface BagelConfig {
  /** Length of a round in seconds. Default 45. */
  durationSeconds: number;
  /** Points that count as a "perfect" run — this is the reported maxScore. Default 40. */
  targetScore: number;
  /** Optional RNG seed; omit for a different drop pattern every time. */
  seed?: number;
}

const DEFAULTS = { durationSeconds: 45, targetScore: 40 };

function clampNum(v: unknown, d: number, lo: number, hi: number): number {
  return typeof v === 'number' && isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d;
}

function readConfig(config: unknown): BagelConfig {
  const c = (config && typeof config === 'object' ? config : {}) as Record<string, unknown>;
  return {
    durationSeconds: clampNum(c.durationSeconds, DEFAULTS.durationSeconds, 10, 300),
    targetScore: clampNum(c.targetScore, DEFAULTS.targetScore, 5, 400),
    seed: typeof c.seed === 'number' && isFinite(c.seed) ? c.seed : undefined,
  };
}

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
type FallKind = 'sesame' | 'golden' | 'pigeon';

interface Faller {
  kind: FallKind;
  x: number;
  y: number;
  r: number;
  vy: number;
  vx: number;
  rot: number;
  spin: number;
  flap: number;
}
interface Pop { x: number; y: number; life: number; text: string; color: string }
interface Cloud { x: number; y: number; s: number; v: number }

interface GameState {
  phase: Phase;
  countdown: number;
  t: number;
  score: number;
  caught: number;
  golden: number;
  pigeons: number;
  basketX: number;
  targetX: number;
  hurt: number;
  fallers: Faller[];
  pops: Pop[];
  clouds: Cloud[];
  spawn: number;
  W: number;
  H: number;
  rng: () => number;
}

function createState(cfg: BagelConfig): GameState {
  const rng = makeRng(cfg.seed ?? ((Date.now() ^ 0x85ebca6b) >>> 0));
  const W = 1180;
  const H = 820;
  const clouds: Cloud[] = [];
  for (let i = 0; i < 6; i++) {
    clouds.push({ x: rng() * W, y: 40 + rng() * 220, s: 0.6 + rng() * 0.9, v: 8 + rng() * 14 });
  }
  return {
    phase: 'countdown',
    countdown: 3.2,
    t: 0,
    score: 0,
    caught: 0,
    golden: 0,
    pigeons: 0,
    basketX: W / 2,
    targetX: W / 2,
    hurt: 0,
    fallers: [],
    pops: [],
    clouds,
    spawn: 0.6,
    W,
    H,
    rng,
  };
}

/* --------------------------------------------------------------- component */

export const BagelCatch: React.FC<MiniGameProps> = ({ config, onComplete, onExit }) => {
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
        const kx = s.W ? cssW / s.W : 1;
        const ky = s.H ? cssH / s.H : 1;
        s.basketX *= kx;
        s.targetX *= kx;
        for (const f of s.fallers) {
          f.x *= kx;
          f.y *= ky;
        }
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
      /* capture is best-effort */
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

  const s = gs.current;
  const finalScore = Math.max(0, Math.min(s.score, cfg.targetScore));

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
        <div style={S.pill}>🥯 {score}</div>
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
          <div style={S.hint}>Slide the basket. Catch the bagels!</div>
        </div>
      ) : null}

      {phase === 'paused' ? (
        <div style={S.overlay}>
          <div style={S.card}>
            <h2 style={S.h2}>Paused</h2>
            <div style={S.row}>
              <button style={S.btnPrimary} onClick={() => setPhase('playing')}>
                Keep Catching
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
            <h2 style={S.h2}>Bagels secured! 🥯</h2>
            <div style={S.bigScore}>
              {s.score} <span style={S.bigScoreSub}>points</span>
            </div>
            <p style={S.p}>
              {s.caught} sesame · {s.golden} golden honey · {s.pigeons} pigeon
              {s.pigeons === 1 ? '' : 's'} snuck past you
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

function basketMetrics(s: GameState): { w: number; h: number; y: number } {
  const w = Math.max(120, Math.min(200, s.W * 0.15));
  const h = w * 0.55;
  return { w, h, y: s.H - h - 34 };
}

function update(s: GameState, dt: number, cfg: BagelConfig): void {
  s.t += dt;
  const progress = Math.min(1, s.t / cfg.durationSeconds);
  const { w: bw, h: bh, y: by } = basketMetrics(s);

  const target = Math.max(bw / 2, Math.min(s.W - bw / 2, s.targetX));
  s.basketX += (target - s.basketX) * Math.min(1, dt * 12);
  if (s.hurt > 0) s.hurt -= dt;

  for (const c of s.clouds) {
    c.x += c.v * dt;
    if (c.x - 120 * c.s > s.W) c.x = -120 * c.s;
  }

  /* spawn ramp: starts easy, speeds up gently */
  s.spawn -= dt;
  if (s.spawn <= 0) {
    s.spawn = (0.95 - 0.4 * progress) * (0.7 + s.rng() * 0.7);
    const roll = s.rng();
    const margin = 60;
    const x = margin + s.rng() * Math.max(1, s.W - margin * 2);
    if (roll < 0.08) {
      s.fallers.push({
        kind: 'golden',
        x,
        y: -50,
        r: 34,
        vy: 320 + 130 * progress,
        vx: 0,
        rot: 0,
        spin: 2.4,
        flap: 0,
      });
    } else if (roll < 0.08 + 0.2 + 0.12 * progress) {
      s.fallers.push({
        kind: 'pigeon',
        x,
        y: -50,
        r: 32,
        vy: 175 + 95 * progress,
        vx: (s.rng() < 0.5 ? -1 : 1) * (35 + 45 * progress),
        rot: 0,
        spin: 0,
        flap: s.rng() * 6,
      });
    } else {
      s.fallers.push({
        kind: 'sesame',
        x,
        y: -50,
        r: 32,
        vy: 195 + 145 * progress,
        vx: 0,
        rot: s.rng() * Math.PI,
        spin: (s.rng() - 0.5) * 1.6,
        flap: 0,
      });
    }
  }

  for (let i = s.fallers.length - 1; i >= 0; i--) {
    const f = s.fallers[i];
    f.y += f.vy * dt;
    f.x += f.vx * dt;
    f.rot += f.spin * dt;
    f.flap += dt * 9;
    if (f.vx !== 0 && (f.x < 40 || f.x > s.W - 40)) f.vx *= -1;

    if (f.y - f.r > s.H + 20) {
      s.fallers.splice(i, 1);
      continue;
    }

    /* catch test: generous — the whole basket mouth plus a bit of slack */
    const mouthTop = by - 8;
    const inX = Math.abs(f.x - s.basketX) < bw / 2 + f.r * 0.55;
    const inY = f.y + f.r * 0.5 > mouthTop && f.y - f.r * 0.5 < by + bh * 0.7;
    if (inX && inY) {
      if (f.kind === 'sesame') {
        s.score += 1;
        s.caught += 1;
        s.pops.push({ x: f.x, y: by - 26, life: 1, text: '+1', color: '#ffe66d' });
      } else if (f.kind === 'golden') {
        s.score += 5;
        s.golden += 1;
        s.pops.push({ x: f.x, y: by - 26, life: 1.3, text: '+5 GOLDEN!', color: '#ffd166' });
      } else {
        s.pigeons += 1;
        s.hurt = 0.9;
        if (s.score > 0) {
          s.score -= 1;
          s.pops.push({ x: f.x, y: by - 26, life: 1.1, text: 'Pigeon stole one!', color: '#ff8f8f' });
        } else {
          s.pops.push({ x: f.x, y: by - 26, life: 1.1, text: 'Shoo, pigeon!', color: '#ffffff' });
        }
      }
      s.fallers.splice(i, 1);
    }
  }

  for (let i = s.pops.length - 1; i >= 0; i--) {
    const p = s.pops[i];
    p.life -= dt * 1.3;
    p.y -= dt * 44;
    if (p.life <= 0) s.pops.splice(i, 1);
  }
}

/* -------------------------------------------------------------------- draw */

function draw(ctx: CanvasRenderingContext2D, s: GameState, cfg: BagelConfig): void {
  const { W, H } = s;

  /* sky */
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#8ecae6');
  sky.addColorStop(1, '#e8f4fb');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  for (const c of s.clouds) drawCloud(ctx, c.x, c.y, 60 * c.s);

  /* Mile End rooftops */
  drawSkyline(ctx, W, H);

  /* ground */
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(0, H - 30, W, 30);
  ctx.fillStyle = '#a8871c';
  ctx.fillRect(0, H - 30, W, 6);

  for (const f of s.fallers) {
    if (f.kind === 'pigeon') drawPigeon(ctx, f);
    else drawBagel(ctx, f.x, f.y, f.r, f.rot, f.kind === 'golden');
  }

  const { w: bw, h: bh, y: by } = basketMetrics(s);
  drawBasket(ctx, s.basketX, by, bw, bh, s.hurt > 0);

  ctx.textAlign = 'center';
  ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
  for (const p of s.pops) {
    ctx.globalAlpha = Math.max(0, Math.min(1, p.life));
    ctx.fillStyle = p.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 4;
    ctx.strokeText(p.text, p.x, p.y);
    ctx.fillText(p.text, p.x, p.y);
  }
  ctx.globalAlpha = 1;

  /* time bar */
  const prog = Math.min(1, s.t / cfg.durationSeconds);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(0, H - 8, W, 8);
  ctx.fillStyle = '#c8102e';
  ctx.fillRect(0, H - 8, W * (1 - prog), 8);
}

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath();
  ctx.arc(x, y, r * 0.5, 0, Math.PI * 2);
  ctx.arc(x + r * 0.45, y - r * 0.16, r * 0.38, 0, Math.PI * 2);
  ctx.arc(x - r * 0.45, y + r * 0.06, r * 0.33, 0, Math.PI * 2);
  ctx.arc(x + r * 0.1, y + r * 0.22, r * 0.36, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyline(ctx: CanvasRenderingContext2D, W: number, H: number): void {
  ctx.fillStyle = '#7d6b8f';
  const base = H - 30;
  let x = -20;
  let i = 0;
  while (x < W + 40) {
    const w = 70 + ((i * 37) % 60);
    const h = 90 + ((i * 53) % 120);
    ctx.fillRect(x, base - h, w, h);
    ctx.fillStyle = '#ffe9a8';
    for (let wy = base - h + 16; wy < base - 24; wy += 34) {
      for (let wx = x + 12; wx < x + w - 18; wx += 28) {
        if (((wx + wy + i) | 0) % 3 !== 0) ctx.fillRect(wx, wy, 12, 16);
      }
    }
    ctx.fillStyle = '#7d6b8f';
    x += w + 14;
    i++;
  }
}

function drawBagel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
  golden: boolean
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);

  if (golden) {
    ctx.shadowColor = 'rgba(255,200,40,0.9)';
    ctx.shadowBlur = 22;
  }

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fillStyle = golden ? '#f6c945' : '#d9a75b';
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 3;
  ctx.strokeStyle = golden ? '#b8860b' : '#a3733a';
  ctx.stroke();

  /* highlight */
  ctx.beginPath();
  ctx.arc(-r * 0.28, -r * 0.3, r * 0.24, 0, Math.PI * 2);
  ctx.fillStyle = golden ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)';
  ctx.fill();

  /* sesame seeds / sparkles */
  ctx.fillStyle = golden ? '#fff6cc' : '#f5ecd7';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3;
    const rr = r * (0.55 + ((i * 7) % 5) * 0.06);
    ctx.save();
    ctx.translate(Math.cos(a) * rr, Math.sin(a) * rr);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.11, r * 0.05, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

function drawPigeon(ctx: CanvasRenderingContext2D, f: Faller): void {
  const { x, y } = f;
  const r = f.r;
  const flap = Math.sin(f.flap) * 0.7;
  ctx.save();
  ctx.translate(x, y);

  /* wings */
  ctx.fillStyle = '#8e99a8';
  ctx.save();
  ctx.rotate(-0.5 + flap);
  ctx.beginPath();
  ctx.ellipse(-r * 0.8, 0, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.rotate(0.5 - flap);
  ctx.beginPath();
  ctx.ellipse(r * 0.8, 0, r * 0.8, r * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  /* body */
  ctx.fillStyle = '#6b7684';
  ctx.beginPath();
  ctx.ellipse(0, r * 0.1, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  /* head */
  ctx.fillStyle = '#5c6773';
  ctx.beginPath();
  ctx.arc(0, -r * 0.45, r * 0.32, 0, Math.PI * 2);
  ctx.fill();

  /* beak */
  ctx.fillStyle = '#f2a541';
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.35);
  ctx.lineTo(r * 0.1, -r * 0.18);
  ctx.lineTo(-r * 0.1, -r * 0.18);
  ctx.closePath();
  ctx.fill();

  /* eyes */
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(-r * 0.13, -r * 0.52, r * 0.09, 0, Math.PI * 2);
  ctx.arc(r * 0.13, -r * 0.52, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(-r * 0.13, -r * 0.52, r * 0.045, 0, Math.PI * 2);
  ctx.arc(r * 0.13, -r * 0.52, r * 0.045, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBasket(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  h: number,
  hurt: boolean
): void {
  ctx.save();
  ctx.translate(cx, y);
  if (hurt) ctx.translate(Math.sin(Date.now() / 40) * 4, 0);

  /* mouth */
  ctx.fillStyle = '#7a4a22';
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h * 0.2, 0, 0, Math.PI * 2);
  ctx.fill();

  /* body */
  ctx.beginPath();
  ctx.moveTo(-w / 2, 0);
  ctx.lineTo(w / 2, 0);
  ctx.lineTo(w * 0.34, h);
  ctx.lineTo(-w * 0.34, h);
  ctx.closePath();
  ctx.fillStyle = hurt ? '#e0a06a' : '#c98a4b';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#7a4a22';
  ctx.stroke();

  /* weave */
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(122,74,34,0.6)';
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    const half = (w / 2) * (1 - t * 0.32);
    ctx.beginPath();
    ctx.moveTo(-half, h * t);
    ctx.lineTo(half, h * t);
    ctx.stroke();
  }
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo((w / 2) * (i / 2.5), 0);
    ctx.lineTo(w * 0.34 * (i / 2.5), h);
    ctx.stroke();
  }

  /* rim */
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#8f5a2a';
  ctx.beginPath();
  ctx.ellipse(0, 0, w / 2, h * 0.2, 0, 0, Math.PI * 2);
  ctx.stroke();

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
    background: '#8ecae6',
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
    maxWidth: 640,
  },
  h2: { margin: '0 0 10px', fontSize: 42, color: '#c8102e' },
  p: { margin: '10px 0 18px', fontSize: 22, color: '#444' },
  bigScore: { fontSize: 72, fontWeight: 900, color: '#b8860b', lineHeight: 1 },
  bigScoreSub: { fontSize: 26, fontWeight: 700, color: '#666' },
  row: { display: 'flex', gap: 18, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 },
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

export default BagelCatch;
