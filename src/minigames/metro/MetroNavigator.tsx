import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';
import './MetroNavigator.css';

/**
 * MetroNavigator — trace a route on a simplified Montréal metro map.
 *
 * config: { from?: string; to?: string }
 *   Station id OR label, accent/punctuation tolerant.
 *   Default: Guy-Concordia -> Place-d'Armes (transfer at Berri-UQAM).
 *
 * score = correct stations tapped minus wrong taps; maxScore = stations in the route.
 */

interface MetroConfig {
  from?: string;
  to?: string;
}

interface Station {
  id: string;
  label: string;
  x: number;
  y: number;
  lines: Array<'green' | 'orange'>;
  labelX: number;
  labelY: number;
  anchor: 'start' | 'middle' | 'end';
}

const STATIONS: Station[] = [
  {
    id: 'guy-concordia',
    label: 'Guy-Concordia',
    x: 140,
    y: 330,
    lines: ['green'],
    labelX: 140,
    labelY: 392,
    anchor: 'middle',
  },
  {
    id: 'place-des-arts',
    label: 'Place-des-Arts',
    x: 380,
    y: 330,
    lines: ['green'],
    labelX: 380,
    labelY: 282,
    anchor: 'middle',
  },
  {
    id: 'berri-uqam',
    label: 'Berri-UQAM',
    x: 560,
    y: 330,
    lines: ['green', 'orange'],
    labelX: 596,
    labelY: 392,
    anchor: 'start',
  },
  {
    id: 'viau',
    label: 'Viau',
    x: 800,
    y: 330,
    lines: ['green'],
    labelX: 800,
    labelY: 392,
    anchor: 'middle',
  },
  {
    id: 'place-darmes',
    label: "Place-d'Armes",
    x: 330,
    y: 470,
    lines: ['orange'],
    labelX: 330,
    labelY: 528,
    anchor: 'middle',
  },
  {
    id: 'laurier',
    label: 'Laurier',
    x: 430,
    y: 120,
    lines: ['orange'],
    labelX: 430,
    labelY: 84,
    anchor: 'middle',
  },
];

interface Edge {
  a: string;
  b: string;
  line: 'green' | 'orange';
}

const EDGES: Edge[] = [
  { a: 'guy-concordia', b: 'place-des-arts', line: 'green' },
  { a: 'place-des-arts', b: 'berri-uqam', line: 'green' },
  { a: 'berri-uqam', b: 'viau', line: 'green' },
  { a: 'place-darmes', b: 'berri-uqam', line: 'orange' },
  { a: 'berri-uqam', b: 'laurier', line: 'orange' },
];

const LINE_COLOR = { green: '#00a54f', orange: '#f28d1a' } as const;

function byId(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function resolveStation(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const want = slug(value);
  const hit = STATIONS.find((s) => slug(s.id) === want || slug(s.label) === want);
  return hit ? hit.id : fallback;
}

/** Shortest station path (BFS) — returns ids including both ends. */
function findPath(from: string, to: string): string[] {
  if (from === to) return [from];
  const neighbours = new Map<string, string[]>();
  EDGES.forEach(({ a, b }) => {
    neighbours.set(a, [...(neighbours.get(a) ?? []), b]);
    neighbours.set(b, [...(neighbours.get(b) ?? []), a]);
  });
  const queue: string[][] = [[from]];
  const seen = new Set<string>([from]);
  while (queue.length) {
    const path = queue.shift() as string[];
    const last = path[path.length - 1];
    for (const next of neighbours.get(last) ?? []) {
      if (seen.has(next)) continue;
      const extended = [...path, next];
      if (next === to) return extended;
      seen.add(next);
      queue.push(extended);
    }
  }
  return [from];
}

function edgeLine(a: string, b: string): 'green' | 'orange' {
  const hit = EDGES.find((e) => (e.a === a && e.b === b) || (e.a === b && e.b === a));
  return hit ? hit.line : 'green';
}

function pathD(ids: string[]): string {
  return ids
    .map((id, i) => {
      const s = byId(id);
      if (!s) return '';
      return `${i === 0 ? 'M' : 'L'}${s.x},${s.y}`;
    })
    .join(' ');
}

export default function MetroNavigator({ config, onComplete, onExit }: MiniGameProps) {
  const cfg = (typeof config === 'object' && config ? config : {}) as MetroConfig;
  const fromId = resolveStation(cfg.from, 'guy-concordia');
  const toId = resolveStation(cfg.to, 'place-darmes');

  const route = useMemo(() => findPath(fromId, toId), [fromId, toId]);
  const [progress, setProgress] = useState(0); // stations correctly tapped after the start
  const [wrongTaps, setWrongTaps] = useState(0);
  const [wiggleId, setWiggleId] = useState<string | null>(null);
  const collected = useRef(false);

  useEffect(() => {
    setProgress(0);
    setWrongTaps(0);
    collected.current = false;
  }, [fromId, toId]);

  useEffect(() => {
    if (!wiggleId) return undefined;
    const t = window.setTimeout(() => setWiggleId(null), 600);
    return () => window.clearTimeout(t);
  }, [wiggleId]);

  const start = byId(fromId);
  const end = byId(toId);
  const needed = Math.max(1, route.length - 1);
  const complete = progress >= route.length - 1;
  const nextId = complete ? null : route[progress + 1];
  const currentStation = byId(route[progress]) ?? start;

  const tap = useCallback(
    (station: Station) => {
      if (complete) return;
      if (station.id === route[progress + 1]) {
        setProgress((p) => p + 1);
      } else if (station.id !== route[progress]) {
        setWrongTaps((w) => w + 1);
        setWiggleId(station.id);
      }
    },
    [complete, progress, route],
  );

  const score = Math.max(0, needed - wrongTaps);
  const collect = useCallback(() => {
    if (collected.current) return;
    collected.current = true;
    onComplete(score, needed);
  }, [score, needed, onComplete]);

  const reset = useCallback(() => {
    setProgress(0);
    setWrongTaps(0);
    collected.current = false;
  }, []);

  const tracedIds = route.slice(0, progress + 1);
  const transferId = route.find(
    (id, i) => i > 0 && i < route.length - 1 && (byId(id)?.lines.length ?? 0) > 1,
  );

  return (
    <div className="mt-root">
      <header className="mt-bar">
        <button type="button" className="mt-exit" onClick={onExit} aria-label="Leave the metro map">
          ✕
        </button>
        <div className="mt-mission">
          <span className="mt-mission-label">YOUR RIDE</span>
          <span className="mt-mission-text">
            {start?.label} <span aria-hidden="true">→</span> {end?.label}
          </span>
        </div>
        <div className="mt-steps">
          {progress} / {needed}
        </div>
      </header>

      <p className="mt-hint">
        {complete
          ? 'You made it! All aboard! 🚆'
          : progress === 0
            ? `Tap the next station on the way. Start at ${start?.label}.`
            : transferId && route[progress] === transferId
              ? `Transfer here! Now take the ${edgeLine(route[progress], route[progress + 1]) === 'green' ? 'GREEN' : 'ORANGE'} line.`
              : `Nice! Next stop after ${byId(route[progress])?.label}.`}
      </p>

      <div className="mt-map-wrap">
        <svg className="mt-map" viewBox="0 0 900 560" role="img" aria-label="Simplified Montréal metro map">
          <rect x="0" y="0" width="900" height="560" rx="28" className="mt-bgrect" />

          {/* base lines */}
          {EDGES.map((e) => {
            const a = byId(e.a);
            const b = byId(e.b);
            if (!a || !b) return null;
            return (
              <line
                key={`base-${e.a}-${e.b}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={LINE_COLOR[e.line]}
                strokeWidth={18}
                strokeLinecap="round"
                opacity={0.35}
              />
            );
          })}

          {/* traced (correct) route */}
          {tracedIds.map((id, i) => {
            if (i === 0) return null;
            const a = byId(tracedIds[i - 1]);
            const b = byId(id);
            if (!a || !b) return null;
            return (
              <line
                key={`lit-${id}`}
                className="mt-lit"
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={LINE_COLOR[edgeLine(tracedIds[i - 1], id)]}
                strokeWidth={22}
                strokeLinecap="round"
              />
            );
          })}

          {/* stations */}
          {STATIONS.map((s) => {
            const isStart = s.id === fromId;
            const isEnd = s.id === toId;
            const isDone = tracedIds.includes(s.id);
            const isNext = s.id === nextId;
            const classes = [
              'mt-station',
              isDone ? 'done' : '',
              isNext ? 'next' : '',
              wiggleId === s.id ? 'wiggle' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g key={s.id} className={classes} onClick={() => tap(s)} role="button" tabIndex={0}>
                {/* generous invisible touch target */}
                <circle cx={s.x} cy={s.y} r={48} fill="transparent" />
                {isNext && <circle className="mt-ping" cx={s.x} cy={s.y} r={34} />}
                <circle
                  className="mt-dot"
                  cx={s.x}
                  cy={s.y}
                  r={s.lines.length > 1 ? 28 : 22}
                  fill={isDone ? '#ffffff' : '#ffffff'}
                  stroke="#16181d"
                  strokeWidth={7}
                />
                {s.lines.length > 1 && (
                  <circle cx={s.x} cy={s.y} r={11} fill="#16181d" opacity={0.85} />
                )}
                {isEnd && (
                  <text className="mt-pin" x={s.x} y={s.y - 44} textAnchor="middle">
                    🏁
                  </text>
                )}
                {isStart && (
                  <text className="mt-pin" x={s.x} y={s.y - 44} textAnchor="middle">
                    🚩
                  </text>
                )}
                <text
                  className="mt-label"
                  x={s.labelX}
                  y={s.labelY}
                  textAnchor={s.anchor}
                >
                  {s.label}
                </text>
              </g>
            );
          })}

          {/* the little train */}
          {!complete && currentStation && (
            <g
              className="mt-train"
              style={{ transform: `translate(${currentStation.x}px, ${currentStation.y}px)` }}
            >
              <text x={0} y={0} textAnchor="middle" dominantBaseline="central">
                🚆
              </text>
            </g>
          )}
          {complete && (
            <g className="mt-train">
              <text x={0} y={0} textAnchor="middle" dominantBaseline="central">
                🚆
              </text>
              <animateMotion dur="2.6s" repeatCount="indefinite" rotate="auto" path={pathD(route)} />
            </g>
          )}

          {/* legend */}
          <g className="mt-legend">
            <line x1={60} y1={40} x2={110} y2={40} stroke={LINE_COLOR.green} strokeWidth={14} strokeLinecap="round" />
            <text x={122} y={47}>Green line</text>
            <line x1={250} y1={40} x2={300} y2={40} stroke={LINE_COLOR.orange} strokeWidth={14} strokeLinecap="round" />
            <text x={312} y={47}>Orange line</text>
          </g>
        </svg>
      </div>

      <footer className="mt-foot">
        {complete ? (
          <>
            <div className="mt-win" role="status">
              🎉 Route traced! {wrongTaps === 0 ? 'Perfect run!' : `${wrongTaps} wrong taps.`}
            </div>
            <button type="button" className="mt-btn mt-ghost" onClick={reset}>
              Ride again
            </button>
            <button type="button" className="mt-btn mt-primary" onClick={collect}>
              Collect {score} of {needed} points!
            </button>
          </>
        ) : (
          <>
            <div className="mt-tip">Tap the stations in order. Wrong stop? It will wiggle!</div>
            <button type="button" className="mt-btn mt-ghost" onClick={reset}>
              Start over
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
