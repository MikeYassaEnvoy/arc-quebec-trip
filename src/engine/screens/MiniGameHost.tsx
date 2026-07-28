import { useState } from 'react';
import { findChallenge, resolveMinigameConfig } from '../content';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { useLeg } from '../useContent';
import { resolveMiniGame } from '../wiring';
import { Confetti } from '../ui/Confetti';
import { Loading } from './Loading';

/**
 * Hosts a registered mini-game. Everything game-specific comes through wiring.ts,
 * so swapping the stub for Workstreams C1/C2 needs no change here.
 */
export function MiniGameHost({
  legId,
  stepId,
  challengeId,
  minigameId,
}: {
  legId: number;
  stepId: string;
  challengeId: string;
  minigameId: string;
}) {
  const { leg, loading } = useLeg(legId);
  const back = useRouter((s) => s.back);
  const recordMinigameSession = useRaceStore((s) => s.recordMinigameSession);
  const completeChallenge = useRaceStore((s) => s.completeChallenge);
  const [result, setResult] = useState<{ score: number; max: number; awarded: number } | null>(null);

  if (loading || !leg) return <Loading what="the game" />;

  const challenge = findChallenge(leg, challengeId);
  const config = resolveMinigameConfig(minigameId, challenge);
  const { Component, isStub } = resolveMiniGame(minigameId);

  if (result) {
    return (
      <div className="screen celebrate">
        <Confetti burst pieces={70} />
        <div className="celebrate__inner">
          <p className="celebrate__big">GAME OVER!</p>
          <p className="celebrate__points">
            {result.score} / {result.max} · +{result.awarded + (challenge?.points ?? 0)} points
          </p>
          <button className="btn btn--yellow btn--mega" onClick={back}>
            BACK TO THE RACE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen minigamehost">
      {isStub && <p className="banner banner--warn">Placeholder game — the real one lands at integration.</p>}
      <Component
        config={config}
        onComplete={(score, maxScore) => {
          const awarded = recordMinigameSession(legId, minigameId, score, maxScore);
          if (challenge) completeChallenge(legId, challenge, { bonusPoints: awarded });
          setResult({ score, max: maxScore, awarded });
        }}
        onExit={back}
      />
      <p className="muted mono minigamehost__meta">
        {minigameId} · step {stepId}
      </p>
    </div>
  );
}
