import { useEffect, useState } from 'react';

const COLORS = ['#FFD11A', '#D6212A', '#111111', '#FFFFFF', '#2FB673'];

/** Pure-CSS confetti burst. `burst` toggling to true restarts it. */
export function Confetti({ burst = false, pieces = 60 }: { burst?: boolean; pieces?: number }) {
  const [runId, setRunId] = useState(0);

  useEffect(() => {
    if (burst) setRunId((n) => n + 1);
  }, [burst]);

  if (!burst) return null;

  return (
    <div className="confetti" key={runId} aria-hidden="true">
      {Array.from({ length: pieces }).map((_, i) => {
        const left = Math.round((i / pieces) * 100 + (i % 7) * 1.5) % 100;
        const delay = (i % 12) * 0.09;
        const dur = 1.7 + ((i * 37) % 13) / 10;
        const size = 8 + ((i * 13) % 10);
        return (
          <span
            key={i}
            className="confetti__bit"
            style={{
              left: `${left}%`,
              background: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              width: size,
              height: size * 1.6,
              borderRadius: i % 3 === 0 ? '50%' : '2px',
            }}
          />
        );
      })}
    </div>
  );
}
