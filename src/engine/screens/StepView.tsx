import { useState } from 'react';
import type { Challenge } from '../../types';
import { challengesForStep, findStep } from '../content';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { useLeg } from '../useContent';
import { Loading } from './Loading';
import { LongPressButton } from '../ui/LongPressButton';

const TYPE_ICON: Record<Challenge['type'], string> = {
  scavenger: '🔎',
  count: '🔢',
  taste: '😋',
  physical: '🏃',
  trivia: '❓',
  'speak-french': '🇫🇷',
  photo: '📸',
  minigame: '🎮',
};

export function StepView({ legId, stepId }: { legId: number; stepId: string }) {
  const { leg, loading } = useLeg(legId);
  const go = useRouter((s) => s.go);
  const replace = useRouter((s) => s.replace);
  const back = useRouter((s) => s.back);
  const state = useRaceStore();
  const completeStep = useRaceStore((s) => s.completeStep);
  const [showFunFact, setShowFunFact] = useState(false);

  if (loading || !leg) return <Loading what="this stop" />;
  const step = findStep(leg, stepId);
  if (!step) return <Loading what="this stop" />;

  const choice = state.detourChoices[step.id];
  const challenges = challengesForStep(step, choice);
  const doneIds = challenges.filter((c) => state.completed[c.id]);
  const allDone = challenges.length > 0 && doneIds.length === challenges.length;
  const anyDone = doneIds.length > 0;

  const finish = () => {
    completeStep(step.id);
    if (step.funFact && !showFunFact) {
      setShowFunFact(true);
      return;
    }
    back();
  };

  if (showFunFact) {
    return (
      <div className="screen funfactscreen">
        <div className="card card--hot">
          <p className="kicker">Stop complete — {step.location}</p>
          <h1 className="h1">Did you know?</h1>
          <p className="lead">{step.funFact}</p>
          <button className="btn btn--yellow btn--mega" onClick={() => replace({ name: 'leg', legId })}>
            NEXT CLUE →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen stepview">
      <header className="topbar topbar--sub">
        <button className="btn btn--nav" onClick={() => replace({ name: 'leg', legId })}>
          ← Leg {legId}
        </button>
        <div>
          <p className="kicker">
            {step.kind.replace('-', ' ')}
            {step.scheduledTime ? ` · ${step.scheduledTime}` : ''}
          </p>
          <h1 className="h1">{step.location}</h1>
        </div>
        <div />
      </header>

      <p className="banner banner--reveal">{step.clueReveal}</p>

      {step.detour && choice && (
        <div className="detourbar">
          <span className="pill pill--yellow">
            Detour: {step.detour[choice].label}
          </span>
          {!anyDone && (
            <button
              className="btn btn--nav"
              onClick={() => go({ name: 'detour', legId, stepId })}
            >
              Change my choice
            </button>
          )}
        </div>
      )}

      <main className="challengelist">
        {challenges.length === 0 && <p className="muted">No challenges here — just enjoy the stop!</p>}
        {challenges.map((c) => {
          const done = !!state.completed[c.id];
          return (
            <button
              key={c.id}
              className={`challengecard${done ? ' is-done' : ''}`}
              onClick={() => go({ name: 'challenge', legId, stepId, challengeId: c.id })}
            >
              <span className="challengecard__icon">{done ? '✅' : TYPE_ICON[c.type]}</span>
              <span className="challengecard__body">
                <span className="challengecard__title">{c.title}</span>
                <span className="challengecard__meta">
                  {c.type.replace('-', ' ')} · {c.points} pts
                  {done ? ' · complete' : ''}
                </span>
              </span>
              <span className="challengecard__go">{done ? 'Redo' : '→'}</span>
            </button>
          );
        })}
      </main>

      <footer className="stepview__foot">
        {allDone ? (
          <button className="btn btn--red btn--mega" onClick={finish}>
            FINISH THIS STOP →
          </button>
        ) : (
          <LongPressButton
            className="btn btn--ghost btn--huge"
            hint="Hold to skip this stop"
            onConfirm={finish}
          >
            Skip this stop
          </LongPressButton>
        )}
      </footer>
    </div>
  );
}
