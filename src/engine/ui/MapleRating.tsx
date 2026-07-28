const LABELS = ['', 'Nope!', 'Meh', 'Pretty good', 'Yum!', 'BEST EVER!'];

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
            🍁
          </button>
        ))}
      </div>
      <p className="maple__verdict">{value ? LABELS[value] : 'Tap the leaves!'}</p>
    </div>
  );
}
