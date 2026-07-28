import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { ui } from '../../../assets';

const COLORS = ['#FFD11A', '#D6212A', '#111111', '#FFFFFF', '#2FB673'];

/** Every fourth piece is a maple leaf (Workstream E's SVG via a CSS mask). */
const leafMask: CSSProperties = {
  WebkitMaskImage: `url(${ui['maple-leaf']})`,
  maskImage: `url(${ui['maple-leaf']})`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
};

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
        const isLeaf = i % 4 === 0;
        return (
          <span
            key={i}
            className="confetti__bit"
            style={{
              left: `${left}%`,
              background: isLeaf ? '#D6212A' : COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${dur}s`,
              width: isLeaf ? size * 1.7 : size,
              height: size * 1.6,
              borderRadius: isLeaf ? 0 : i % 3 === 0 ? '50%' : '2px',
              ...(isLeaf ? leafMask : null),
            }}
          />
        );
      })}
    </div>
  );
}
