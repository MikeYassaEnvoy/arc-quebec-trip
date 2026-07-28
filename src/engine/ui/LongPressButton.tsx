import { useEffect, useRef, useState } from 'react';

/**
 * Kid-proofing: every destructive or irreversible action must be held, never tapped (§2).
 */
export function LongPressButton({
  onConfirm,
  children,
  holdMs = 1500,
  className = 'btn btn--red btn--huge',
  hint = 'Press and hold',
}: {
  onConfirm: () => void;
  children: React.ReactNode;
  holdMs?: number;
  className?: string;
  hint?: string;
}) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const timer = useRef<number | null>(null);
  const start = useRef(0);
  const done = useRef(false);

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    if (timer.current !== null) window.clearTimeout(timer.current);
    raf.current = null;
    timer.current = null;
    setProgress(0);
  };

  useEffect(() => stop, []);

  const begin = () => {
    done.current = false;
    start.current = performance.now();

    // The timer is what actually confirms — requestAnimationFrame only paints the
    // fill, and it stops firing whenever the tab is not being rendered.
    timer.current = window.setTimeout(() => {
      if (done.current) return;
      done.current = true;
      stop();
      onConfirm();
    }, holdMs);

    const tick = () => {
      if (done.current) return;
      setProgress(Math.min(1, (performance.now() - start.current) / holdMs));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  return (
    <button
      className={`${className} longpress`}
      onPointerDown={(e) => {
        e.preventDefault();
        begin();
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onContextMenu={(e) => e.preventDefault()}
    >
      <span className="longpress__fill" style={{ width: `${progress * 100}%` }} />
      <span className="longpress__label">
        {children}
        <small className="longpress__hint">{progress > 0 ? 'Keep holding…' : hint}</small>
      </span>
    </button>
  );
}
