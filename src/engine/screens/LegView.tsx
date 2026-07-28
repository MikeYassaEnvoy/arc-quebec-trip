import type { Step } from '../../types';
import { challengesForStep } from '../content';
import { useRouter } from '../router';
import { selectPointsForLeg, useRaceStore, PRACTICE_LEG_ID } from '../store';
import { useLeg } from '../useContent';
import { Loading } from './Loading';
import { ui } from '../../../assets';

const KIND_ICON: Record<Step['kind'], string> = {
  'route-marker': '📍',
  detour: '🔀',
  roadblock: '🚧',
  'speed-bump': '⚡️',
  drive: '🚗',
  'pit-stop': '🏁',
};

/** Workstream E art for the step kinds that have a dedicated asset. */
const KIND_ART: Partial<Record<Step['kind'], string>> = {
  'route-marker': ui.marker,
  detour: ui.marker,
  roadblock: ui.marker,
  'speed-bump': ui.starburst,
  'pit-stop': ui['checkered-flag'],
};

const KIND_LABEL: Record<Step['kind'], string> = {
  'route-marker': 'Route Marker',
  detour: 'Detour',
  roadblock: 'Roadblock',
  'speed-bump': 'Speed Bump',
  drive: 'Drive',
  'pit-stop': 'Pit Stop',
};

export function LegView({ legId }: { legId: number }) {
  const { leg, loaded, loading } = useLeg(legId);
  const go = useRouter((s) => s.go);
  const reset = useRouter((s) => s.reset);
  const state = useRaceStore();

  if (loading || !leg) return <Loading what={`Leg ${legId}`} />;

  const legPoints = selectPointsForLeg(state, legId);
  const firstUnfinishedIndex = leg.steps.findIndex((s) => !state.stepsCompleted[s.id]);
  // Steps unlock in order; the parent menu can mark steps complete to jump ahead.
  const lastOpenIndex = firstUnfinishedIndex === -1 ? leg.steps.length - 1 : firstUnfinishedIndex;
  const isStepOpen = (index: number) => index <= lastOpenIndex;

  const openStep = (step: Step, index: number) => {
    if (!isStepOpen(index)) return;
    if (!state.cluesOpened[step.id]) {
      go({ name: 'clue', legId, stepId: step.id });
      return;
    }
    if (step.kind === 'pit-stop') {
      go({ name: 'pitstop', legId, stepId: step.id });
    } else if (step.detour && !state.detourChoices[step.id]) {
      go({ name: 'detour', legId, stepId: step.id });
    } else {
      go({ name: 'step', legId, stepId: step.id });
    }
  };

  return (
    <div className="screen legview">
      <header className="topbar topbar--sub">
        <button className="btn btn--nav" onClick={() => reset({ name: 'hq' })}>
          ← Race HQ
        </button>
        <div>
          <p className="kicker">
            Leg {leg.id} · {leg.date} · {leg.routeText}
          </p>
          <h1 className="h1">{leg.title}</h1>
        </div>
        <div className="topbar__stats">
          <div className="stat">
            <span className="stat__value">{legPoints}</span>
            <span className="stat__label">leg points</span>
          </div>
        </div>
      </header>

      {loaded?.source === 'fixture' && (
        <p className="banner banner--warn">
          Using placeholder content for this leg ({loaded.problem ?? 'content not found'}).
        </p>
      )}
      {legId === PRACTICE_LEG_ID && (
        <p className="banner">Practice leg! Learn the buttons. These points do not count.</p>
      )}

      <main className="steplist">
        {leg.steps.map((step, i) => {
          const done = !!state.stepsCompleted[step.id];
          const open = isStepOpen(i);
          const choice = state.detourChoices[step.id];
          const challenges = challengesForStep(step, choice);
          const doneCount = challenges.filter((c) => state.completed[c.id]).length;
          return (
            <button
              key={step.id}
              className={`stepcard${done ? ' is-done' : ''}${open ? '' : ' is-locked'}${
                open && !done ? ' is-current' : ''
              }`}
              onClick={() => openStep(step, i)}
              disabled={!open}
            >
              <span className="stepcard__icon">
                {done ? (
                  '✅'
                ) : !open ? (
                  <img className="stepcard__iconimg" src={ui.lock} alt="Locked" draggable={false} />
                ) : KIND_ART[step.kind] ? (
                  <img className="stepcard__iconimg" src={KIND_ART[step.kind]} alt="" draggable={false} />
                ) : (
                  KIND_ICON[step.kind]
                )}
              </span>
              <span className="stepcard__body">
                <span className="stepcard__kind">{KIND_LABEL[step.kind]}</span>
                <span className="stepcard__loc">{step.location}</span>
                <span className="stepcard__meta">
                  {step.scheduledTime ? `${step.scheduledTime} · ` : ''}
                  {step.kind === 'pit-stop'
                    ? 'Check in on the mat'
                    : challenges.length
                      ? `${doneCount}/${challenges.length} challenges`
                      : step.detour
                        ? 'Choose A or B'
                        : 'Tap to open'}
                </span>
              </span>
              <span className="stepcard__go">{done ? 'Done' : open ? '→' : ''}</span>
            </button>
          );
        })}
      </main>
    </div>
  );
}
