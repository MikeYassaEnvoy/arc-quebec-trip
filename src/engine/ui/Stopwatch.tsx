import { useEffect, useRef, useState } from 'react';

/** "30 seconds" / "5 minutes" / "2 min 15 sec" — used for the target label and milestone banner. */
function describeDuration(seconds: number): string {
  if (seconds >= 60 && seconds % 60 === 0) {
    const m = seconds / 60;
    return `${m} minute${m === 1 ? '' : 's'}`;
  }
  if (seconds >= 60) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m} min ${s} sec`;
  }
  return `${seconds} seconds`;
}

/**
 * FIXES-ROUND2 item 5: a `timerSeconds` target ≥ 60s always renders as m:ss, even before
 * the clock has organically reached a minute, so the running clock never disagrees with
 * the target label.
 */
function fmt(ms: number, forceMinutes: boolean) {
  const totalSeconds = Math.max(0, ms) / 1000;
  if (forceMinutes || totalSeconds >= 60) {
    const whole = Math.floor(totalSeconds);
    const m = Math.floor(whole / 60);
    const s = whole % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }
  return `${totalSeconds.toFixed(1)}s`;
}

/**
 * Stopwatch for `physical` challenges. Always counts UP from 0:00 — there is no
 * countdown mode. When `targetSeconds` is set, a persistent celebratory banner appears
 * once elapsed time passes it, but the clock keeps running; kids can keep playing as
 * long as they like. Pausing and resuming never resets the displayed time.
 */
export function Stopwatch({
  targetSeconds,
  onFinish,
}: {
  targetSeconds?: number;
  onFinish?: (elapsedSeconds: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<null | { seconds: number }>(null);
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

  const forceMinutes = !!targetSeconds && targetSeconds >= 60;
  const milestoneHit = !!targetSeconds && elapsed >= targetSeconds * 1000;

  const start = () => {
    setResult(null);
    // Resume from wherever `elapsed` already is — never jumps back to 0.
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
    setResult({ seconds });
    onFinish?.(seconds);
  };
  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setResult(null);
  };

  return (
    <div className="stopwatch">
      <p className="stopwatch__target">
        {targetSeconds ? `Try to play for ${describeDuration(targetSeconds)}!` : 'Time yourself!'}
      </p>

      <div className="stopwatch__display" aria-live="off">
        {fmt(elapsed, forceMinutes)}
      </div>

      {milestoneHit && (
        <p className="stopwatch__milestone" aria-live="polite">
          {targetSeconds && targetSeconds >= 60
            ? `🎉 ${describeDuration(targetSeconds)} of play — done!`
            : `🎉 ${targetSeconds} seconds — you did it!`}
        </p>
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
        <p className="stopwatch__result is-good">
          🏁 Total time: {fmt(result.seconds * 1000, forceMinutes)}
        </p>
      )}
    </div>
  );
}
