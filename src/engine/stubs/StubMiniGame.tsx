import { useState } from 'react';
import type { MiniGameProps } from '../../types';

/**
 * Placeholder mini-game. Implements MiniGameProps exactly as §3 specifies, so the real
 * games from Workstreams C1/C2 drop in with no engine change.
 */
export default function StubMiniGame({ config, onComplete, onExit }: MiniGameProps) {
  const [score, setScore] = useState(0);
  const maxScore = 10;
  const label = describeConfig(config);

  return (
    <div className="screen minigame-stub">
      <div className="card minigame-stub__card">
        <h1 className="h1">Mini-Game Placeholder</h1>
        <p className="lead">
          The real game gets wired in at integration. Tap the button to practice scoring.
        </p>
        {label && <p className="muted mono">{label}</p>}

        <div className="minigame-stub__score" aria-live="polite">
          {score} / {maxScore}
        </div>

        <div className="row">
          <button
            className="btn btn--yellow btn--huge"
            onClick={() => setScore((s) => Math.min(maxScore, s + 1))}
          >
            +1 point
          </button>
          <button className="btn btn--red btn--huge" onClick={() => onComplete(score, maxScore)}>
            Finish game
          </button>
        </div>
        <button className="btn btn--ghost" onClick={onExit}>
          Leave game
        </button>
      </div>
    </div>
  );
}

function describeConfig(config: unknown): string | null {
  if (!config) return 'No content pack found for this game yet.';
  if (typeof config === 'object') {
    const keys = Object.keys(config as Record<string, unknown>).slice(0, 6);
    return `config keys: ${keys.join(', ') || '(empty)'}`;
  }
  return String(config);
}
