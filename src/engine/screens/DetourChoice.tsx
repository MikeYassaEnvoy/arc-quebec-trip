import { findStep } from '../content';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { useLeg } from '../useContent';
import { Loading } from './Loading';

/** Detour: pick A or B. The choice is remembered in the store (§3 detourChoices). */
export function DetourChoice({ legId, stepId }: { legId: number; stepId: string }) {
  const { leg, loading } = useLeg(legId);
  const replace = useRouter((s) => s.replace);
  const back = useRouter((s) => s.back);
  const chooseDetour = useRaceStore((s) => s.chooseDetour);
  const current = useRaceStore((s) => s.detourChoices[stepId]);

  if (loading || !leg) return <Loading what="the detour" />;
  const step = findStep(leg, stepId);
  if (!step?.detour) return <Loading what="the detour" />;

  const pick = (key: 'a' | 'b') => {
    chooseDetour(stepId, key);
    replace({ name: 'step', legId, stepId });
  };

  return (
    <div className="screen detour">
      <button className="btn btn--nav detour__back" onClick={back}>
        ← Back
      </button>
      <header className="detour__head">
        <p className="kicker">Detour · {step.location}</p>
        <h1 className="h1 h1--mega">Pick one. Only one.</h1>
        <p className="lead">{step.clueReveal}</p>
      </header>

      <div className="detour__options">
        {(['a', 'b'] as const).map((key) => {
          const opt = step.detour![key];
          const points = opt.challenges.reduce((n, c) => n + c.points, 0);
          return (
            <button
              key={key}
              className={`detourcard detourcard--${key}${current === key ? ' is-picked' : ''}`}
              onClick={() => pick(key)}
            >
              <span className="detourcard__letter">{key.toUpperCase()}</span>
              <span className="detourcard__label">{opt.label}</span>
              <span className="detourcard__blurb">{opt.blurb}</span>
              <span className="detourcard__points">{points} pts</span>
              <span className="btn btn--yellow btn--huge detourcard__cta">CHOOSE {opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
