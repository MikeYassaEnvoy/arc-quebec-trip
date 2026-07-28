import { useState } from 'react';
import type { Challenge } from '../../types';
import { findChallenge, findStep } from '../content';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { useLeg } from '../useContent';
import { Confetti } from '../ui/Confetti';
import { MapleRating } from '../ui/MapleRating';
import { PhotoButton } from '../ui/PhotoButton';
import { Stopwatch } from '../ui/Stopwatch';
import { TriviaRunner } from '../ui/TriviaRunner';
import { Loading } from './Loading';

export function ChallengeView({
  legId,
  stepId,
  challengeId,
}: {
  legId: number;
  stepId: string;
  challengeId: string;
}) {
  const { leg, loading } = useLeg(legId);
  const go = useRouter((s) => s.go);
  const back = useRouter((s) => s.back);
  const completeChallenge = useRaceStore((s) => s.completeChallenge);
  const setProgress = useRaceStore((s) => s.setProgress);
  const progressAll = useRaceStore((s) => s.progress);
  const completed = useRaceStore((s) => s.completed);
  const photos = useRaceStore((s) => s.photos);
  const [celebrating, setCelebrating] = useState(false);

  if (loading || !leg) return <Loading what="this challenge" />;
  const step = findStep(leg, stepId);
  const challenge = findChallenge(leg, challengeId);
  if (!step || !challenge) return <Loading what="this challenge" />;

  const progress = progressAll[challengeId] ?? {};
  const isDone = !!completed[challengeId];
  const myPhoto = photos.find((p) => p.challengeId === challengeId);

  const patch = (p: Partial<typeof progress>) => setProgress(challengeId, p);

  // Reads live state instead of the render snapshot, so two fast taps never clobber
  // each other (React batches discrete events that land in the same task).
  const current = () => useRaceStore.getState().progress[challengeId] ?? {};
  const toggleCheck = (index: number, total: number) => {
    const cur = current().checked ?? [];
    setProgress(challengeId, {
      checked: Array.from({ length: total }, (_, k) => (k === index ? !cur[k] : !!cur[k])),
    });
  };
  const bumpCount = (delta: number | 'clear', absolute?: number) => {
    if (delta === 'clear') return setProgress(challengeId, { count: absolute ?? 0 });
    setProgress(challengeId, { count: Math.max(0, Math.min(9999, (current().count ?? 0) + delta)) });
  };

  const complete = () => {
    completeChallenge(legId, challenge, { photoKey: myPhoto?.key });
    setCelebrating(true);
  };

  if (celebrating) {
    return (
      <div className="screen celebrate">
        <Confetti burst pieces={90} />
        <div className="celebrate__inner">
          <p className="celebrate__big">CHALLENGE COMPLETE!</p>
          <p className="celebrate__points">+{challenge.points} points</p>
          <button className="btn btn--yellow btn--mega" onClick={back}>
            NEXT →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen challenge">
      <header className="topbar topbar--sub">
        <button className="btn btn--nav" onClick={back}>
          ← {step.location}
        </button>
        <div>
          <p className="kicker">
            {step.kind === 'roadblock' ? 'Roadblock' : challenge.type.replace('-', ' ')} · {challenge.points} pts
          </p>
          <h1 className="h1">{challenge.title}</h1>
        </div>
        <div />
      </header>

      <p className="instructions">{challenge.instructions}</p>

      <main className="challenge__body">
        <ChallengeBody
          challenge={challenge}
          progress={progress}
          patch={patch}
          toggleCheck={toggleCheck}
          bumpCount={bumpCount}
          onPlayMinigame={() =>
            go({
              name: 'minigame',
              legId,
              stepId,
              challengeId,
              minigameId: challenge.minigameId ?? 'unknown',
            })
          }
        />

        {challenge.photoPrompt && (
          <PhotoButton
            legId={legId}
            stepId={stepId}
            challengeId={challengeId}
            prompt={challenge.photoPrompt}
          />
        )}
      </main>

      <footer className="challenge__foot">
        <button className="btn btn--red btn--mega btn--complete" onClick={complete}>
          {isDone ? '✅ DONE — TAP AGAIN TO RE-BANK' : 'CHALLENGE COMPLETE!'}
        </button>
      </footer>
    </div>
  );
}

interface BodyProps {
  challenge: Challenge;
  progress: { checked?: boolean[]; count?: number; rating?: number; said?: boolean };
  patch: (p: { rating?: number; said?: boolean; triviaCorrect?: number; count?: number }) => void;
  toggleCheck: (index: number, total: number) => void;
  bumpCount: (delta: number | 'clear', absolute?: number) => void;
  onPlayMinigame: () => void;
}

function ChallengeBody({ challenge, progress, patch, toggleCheck, bumpCount, onPlayMinigame }: BodyProps) {
  switch (challenge.type) {
    case 'scavenger':
      return <Checklist items={challenge.checklist ?? []} progress={progress} onToggle={toggleCheck} />;

    case 'count':
      return <Counter value={progress.count ?? 0} bump={bumpCount} />;

    case 'taste':
      return (
        <>
          <MapleRating value={progress.rating ?? 0} onChange={(v) => patch({ rating: v })} />
          {challenge.checklist && challenge.checklist.length > 0 && (
            <Checklist items={challenge.checklist} progress={progress} onToggle={toggleCheck} />
          )}
        </>
      );

    case 'physical':
      return (
        <>
          <Stopwatch
            targetSeconds={challenge.timerSeconds}
            onFinish={(seconds) => patch({ count: Math.round(seconds) })}
          />
          {challenge.checklist && challenge.checklist.length > 0 && (
            <Checklist items={challenge.checklist} progress={progress} onToggle={toggleCheck} />
          )}
        </>
      );

    case 'trivia':
      return challenge.trivia?.length ? (
        <TriviaRunner
          questions={challenge.trivia}
          onDone={(correct) => patch({ triviaCorrect: correct })}
        />
      ) : (
        <p className="muted">No questions in this deck yet.</p>
      );

    case 'speak-french':
      return (
        <FrenchCard
          phrase={challenge.frenchPhrase}
          said={!!progress.said}
          onSaid={() => patch({ said: true })}
        />
      );

    case 'photo':
      return (
        <>
          <p className="lead">Take the photo with the camera button below. Then tap Challenge Complete.</p>
          {challenge.checklist && challenge.checklist.length > 0 && (
            <Checklist items={challenge.checklist} progress={progress} onToggle={toggleCheck} />
          )}
        </>
      );

    case 'minigame':
      return (
        <div className="minigame-launch">
          <p className="lead">Time for a car game!</p>
          <button className="btn btn--yellow btn--mega" onClick={onPlayMinigame}>
            ▶︎ PLAY {challenge.title.toUpperCase()}
          </button>
          <p className="muted">Mini-game id: {challenge.minigameId ?? '(none set)'}</p>
        </div>
      );

    default:
      return null;
  }
}

function Checklist({
  items,
  progress,
  onToggle,
}: {
  items: string[];
  progress: { checked?: boolean[] };
  onToggle: (index: number, total: number) => void;
}) {
  const checked = items.map((_, i) => progress.checked?.[i] ?? false);
  const toggle = (i: number) => onToggle(i, items.length);
  const found = checked.filter(Boolean).length;

  return (
    <div className="checklist">
      <p className="checklist__count">
        Found {found} of {items.length}
      </p>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <button
              className={`checkitem${checked[i] ? ' is-checked' : ''}`}
              onClick={() => toggle(i)}
              aria-pressed={checked[i]}
            >
              <span className="checkitem__box">{checked[i] ? '✔︎' : ''}</span>
              <span className="checkitem__text">{item}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Counter({
  value,
  bump,
}: {
  value: number;
  bump: (delta: number | 'clear', absolute?: number) => void;
}) {
  return (
    <div className="counter">
      <p className="counter__label">Type or tap your number</p>
      <div className="counter__row">
        <button className="btn btn--round" onClick={() => bump(-1)} aria-label="minus one">
          −
        </button>
        <input
          className="counter__input"
          inputMode="numeric"
          pattern="[0-9]*"
          value={String(value)}
          onChange={(e) => {
            const n = parseInt(e.target.value.replace(/\D/g, ''), 10);
            bump('clear', Number.isFinite(n) ? Math.min(9999, n) : 0);
          }}
          aria-label="Your count"
        />
        <button className="btn btn--round" onClick={() => bump(1)} aria-label="plus one">
          +
        </button>
      </div>
      <div className="row">
        <button className="btn btn--ghost" onClick={() => bump(5)}>
          +5
        </button>
        <button className="btn btn--ghost" onClick={() => bump(10)}>
          +10
        </button>
        <button className="btn btn--ghost" onClick={() => bump('clear', 0)}>
          Clear
        </button>
      </div>
      <p className="muted">Any honest answer counts!</p>
    </div>
  );
}

function FrenchCard({
  phrase,
  said,
  onSaid,
}: {
  phrase?: { fr: string; phonetic: string; en: string };
  said: boolean;
  onSaid: () => void;
}) {
  if (!phrase) return <p className="muted">No phrase set for this challenge yet.</p>;
  return (
    <div className="frenchcard">
      <p className="frenchcard__fr">{phrase.fr}</p>
      <p className="frenchcard__phon">say it like: <strong>{phrase.phonetic}</strong></p>
      <p className="frenchcard__en">means: {phrase.en}</p>
      <button className={`btn btn--yellow btn--huge${said ? ' is-on' : ''}`} onClick={onSaid}>
        {said ? '✅ I said it to a real person!' : 'I said it to a real person!'}
      </button>
    </div>
  );
}
