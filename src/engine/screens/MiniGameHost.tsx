import { useRef, useState } from 'react';
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
  const replace = useRouter((s) => s.replace);
  const recordMinigameSession = useRaceStore((s) => s.recordMinigameSession);
  const completeChallenge = useRaceStore((s) => s.completeChallenge);
  const [result, setResult] = useState<{ score: number; max: number; awarded: number } | null>(null);
  // Guards against a double-tapped Finish button in a mini-game firing onComplete
  // twice — without this, the score/bonus would bank (and the session count) twice.
  const bankedRef = useRef(false);

  if (loading || !leg) return <Loading what="the game" />;

  const challenge = findChallenge(leg, challengeId);
  const config = resolveMinigameConfig(minigameId, challenge);
  const { Component, isStub } = resolveMiniGame(minigameId);

  // After a score banks, land back on the STEP screen — never back on the "PLAY …"
  // launch prompt. We know legId/stepId directly, so replace the route rather than
  // relying on how many entries deep the launch prompt happened to push.
  const backToStep = () => replace({ name: 'step', legId, stepId });

  if (result) {
    return (
      <div className="screen celebrate">
        <Confetti burst pieces={70} />
        <div className="celebrate__inner">
          <p className="celebrate__big">GAME OVER!</p>
          <p className="celebrate__points">
            {result.score} / {result.max} · +{result.awarded + (challenge?.points ?? 0)} points
          </p>
          <button className="btn btn--yellow btn--mega" onClick={backToStep}>
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
          if (bankedRef.current) return;
          bankedRef.current = true;
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
