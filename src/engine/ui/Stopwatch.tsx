import { useEffect, useRef, useState } from 'react';

function fmt(ms: number) {
  const total = Math.max(0, Math.floor(ms / 100) / 10);
  const m = Math.floor(total / 60);
  const s = (total % 60).toFixed(1).padStart(4, '0');
  return m > 0 ? `${m}:${s.padStart(4, '0')}` : `${s}s`;
}

/**
 * Stopwatch for `physical` challenges. With `targetSeconds` it also runs a countdown
 * ring against the target ("beat 60 seconds"); without one it is a plain stopwatch.
 */
export function Stopwatch({
  targetSeconds,
  onFinish,
}: {
  targetSeconds?: number;
  onFinish?: (elapsedSeconds: number, beatTarget: boolean) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { seconds: number; beat: boolean }>(null);
  const startedAt = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    if (!running) return;
    const tick = () => {
      setElapsed(performance.now() - startedAt.current);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [running]);

  const remaining = targetSeconds ? Math.max(0, targetSeconds * 1000 - elapsed) : 0;
  const pct = targetSeconds ? Math.min(1, elapsed / (targetSeconds * 1000)) : 0;
  const overTime = !!targetSeconds && elapsed > targetSeconds * 1000;

  const start = () => {
    setResult(null);
    startedAt.current = performance.now() - elapsed;
    setRunning(true);
  };
  const stop = () => {
    // Read the clock directly: requestAnimationFrame stops firing when the tab is
    // backgrounded, so the `elapsed` state can be stale by seconds.
    const finalMs = performance.now() - startedAt.current;
    setRunning(false);
    setElapsed(finalMs);
    const seconds = finalMs / 1000;
    const beat = targetSeconds ? seconds <= targetSeconds : true;
    setResult({ seconds, beat });
    onFinish?.(seconds, beat);
  };
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setResult(null);
  };

  return (
    <div className={`stopwatch${overTime ? ' is-over' : ''}`}>
      {targetSeconds ? (
        <p className="stopwatch__target">Beat {targetSeconds} seconds!</p>
      ) : (
        <p className="stopwatch__target">Time yourself!</p>
      )}

      <div className="stopwatch__display" aria-live="off">
        {targetSeconds && running ? fmt(remaining) : fmt(elapsed)}
      </div>
      {targetSeconds && (
        <div className="stopwatch__bar">
          <span style={{ width: `${pct * 100}%` }} />
        </div>
      )}

      <div className="row">
        {!running ? (
          <button className="btn btn--yellow btn--huge" onClick={start}>
            {elapsed > 0 ? '▶︎ Keep going' : '▶︎ START'}
          </button>
        ) : (
          <button className="btn btn--red btn--huge" onClick={stop}>
            ■ STOP
          </button>
        )}
        <button className="btn btn--ghost" onClick={reset}>
          Reset
        </button>
      </div>

      {result && (
        <p className={`stopwatch__result${result.beat ? ' is-good' : ''}`}>
          {result.beat
            ? `🎉 ${result.seconds.toFixed(1)} seconds — you beat the clock!`
            : `${result.seconds.toFixed(1)} seconds. Try again, or keep racing!`}
        </p>
      )}
    </div>
  );
}
