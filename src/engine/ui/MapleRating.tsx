import type { CSSProperties } from 'react';
import { ui } from '../../../assets';

const LABELS = ['', 'Nope!', 'Meh', 'Pretty good', 'Yum!', 'BEST EVER!'];

/**
 * Workstream E's maple-leaf.svg fills from currentColor, so it is applied as a
 * CSS mask over a currentColor box: gold when selected, grey when not.
 */
const leafMask: CSSProperties = {
  WebkitMaskImage: `url(${ui['maple-leaf']})`,
  maskImage: `url(${ui['maple-leaf']})`,
  WebkitMaskRepeat: 'no-repeat',
  maskRepeat: 'no-repeat',
  WebkitMaskPosition: 'center',
  maskPosition: 'center',
  WebkitMaskSize: 'contain',
  maskSize: 'contain',
};

/** 1–5 maple-leaf taste rating (§7A). */
export function MapleRating({
  value,
  onChange,
  label = 'How was it?',
}: {
  value: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="maple">
      <p className="maple__label">{label}</p>
      <div className="maple__row" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} maple leaves`}
            className={`maple__leaf${n <= value ? ' is-on' : ''}`}
            onClick={() => onChange(n)}
          >
            <span className="maple__leafart" style={leafMask} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="maple__verdict">{value ? LABELS[value] : 'Tap the leaves!'}</p>
    </div>
  );
}
