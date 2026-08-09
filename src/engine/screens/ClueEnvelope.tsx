import { useState } from 'react';
import { findStep } from '../content';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { useLeg } from '../useContent';
import { FINAL_LEG_ID } from '../content';
import { Loading } from './Loading';
import { ui } from '../../../assets';

type Phase = 'sealed' | 'ripping' | 'riddle' | 'revealed';

/**
 * Clue envelope: rip-open animation → riddle → tap → plain-language reveal (§7A).
 */
export function ClueEnvelope({ legId, stepId }: { legId: number; stepId: string }) {
  const { leg, loading } = useLeg(legId);
  const go = useRouter((s) => s.go);
  const back = useRouter((s) => s.back);
  const openClue = useRaceStore((s) => s.openClue);
  const detourChoices = useRaceStore((s) => s.detourChoices);
  const finaleArmed = useRaceStore((s) => s.finaleArmed);
  const [phase, setPhase] = useState<Phase>('sealed');

  if (loading || !leg) return <Loading what="your clue" />;
  const step = findStep(leg, stepId);
  if (!step) return <Loading what="your clue" />;

  const rip = () => {
    if (phase !== 'sealed') return;
    setPhase('ripping');
    window.setTimeout(() => setPhase('riddle'), 850);
  };

  const proceed = () => {
    openClue(step.id);
    if (step.kind === 'pit-stop') go({ name: 'pitstop', legId, stepId });
    else if (step.detour && !detourChoices[step.id]) go({ name: 'detour', legId, stepId });
    else go({ name: 'step', legId, stepId });
  };

  return (
    <div className="screen clue">
      <button className="btn btn--nav clue__back" onClick={back}>
        ← Back
      </button>

      {phase === 'sealed' || phase === 'ripping' ? (
        <button className={`envelope envelope--art${phase === 'ripping' ? ' is-ripping' : ''}`} onClick={rip}>
          <img
            className="envelope__img"
            src={phase === 'ripping' ? ui['envelope-open'] : ui['envelope-closed']}
            alt="Clue envelope"
            draggable={false}
          />
          <span className="envelope__hint">{phase === 'ripping' ? 'RIIIIP!' : 'TAP TO RIP IT OPEN'}</span>
        </button>
      ) : (
        <div className="cluecard">
          {step.scheduledTime && <p className="kicker">{step.scheduledTime}</p>}
          <h1 className="cluecard__title">{step.location}</h1>
          <p className="riddle">{step.clueRiddle}</p>

          {phase === 'riddle' ? (
            <button className="btn btn--yellow btn--mega" onClick={() => setPhase('revealed')}>
              What does it mean? →
            </button>
          ) : (
            <>
              <div className="reveal">
                <p className="reveal__text">{step.clueReveal}</p>
              </div>
              {step.kind === 'pit-stop' && legId === FINAL_LEG_ID && !finaleArmed ? (
                <div className="finale-lock">
                  <p className="finale-lock__msg">
                    🔒 The finish line only unlocks at your real front door. Almost there, champion!
                  </p>
                  <button className="btn btn--yellow btn--huge" onClick={back}>
                    ← Back to the race
                  </button>
                </div>
              ) : (
                <button className="btn btn--red btn--mega" onClick={proceed}>
                  {step.kind === 'pit-stop' ? 'RUN TO THE MAT →' : "LET'S GO →"}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
