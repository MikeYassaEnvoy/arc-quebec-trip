import { useState } from 'react';
import type { Challenge, StepKind } from '../../types';
import { challengeConfig, findChallenge, findStep } from '../content';
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
  // Second counter for countStyle: 'duel' (e.g. two mini-golf scores).
  const bumpCount2 = (delta: number | 'clear', absolute?: number) => {
    if (delta === 'clear') return setProgress(challengeId, { count2: absolute ?? 0 });
    setProgress(challengeId, { count2: Math.max(0, Math.min(9999, (current().count2 ?? 0) + delta)) });
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
          stepKind={step.kind}
          progress={progress}
          patch={patch}
          toggleCheck={toggleCheck}
          bumpCount={bumpCount}
          bumpCount2={bumpCount2}
          onAutoComplete={complete}
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

        {/* Round 2 item 9: every challenge gets an optional photo button, kept visually
            secondary to the CHALLENGE COMPLETE button below. */}
        <PhotoButton
          legId={legId}
          stepId={stepId}
          challengeId={challengeId}
          prompt={challenge.photoPrompt ?? 'Snap a picture!'}
        />
      </main>

      {/* Trivia banks itself when the last question is answered — no manual button. */}
      {challenge.type !== 'trivia' && (
        <footer className="challenge__foot">
          <button className="btn btn--red btn--mega btn--complete" onClick={complete}>
            {isDone ? '✅ DONE — TAP AGAIN TO RE-BANK' : 'CHALLENGE COMPLETE!'}
          </button>
        </footer>
      )}
    </div>
  );
}

interface BodyProps {
  challenge: Challenge;
  stepKind: StepKind;
  progress: { checked?: boolean[]; count?: number; count2?: number; rating?: number; said?: boolean };
  patch: (p: { rating?: number; said?: boolean; triviaCorrect?: number; count?: number }) => void;
  toggleCheck: (index: number, total: number) => void;
  bumpCount: (delta: number | 'clear', absolute?: number) => void;
  bumpCount2: (delta: number | 'clear', absolute?: number) => void;
  onAutoComplete: () => void;
  onPlayMinigame: () => void;
}

function ChallengeBody({
  challenge,
  stepKind,
  progress,
  patch,
  toggleCheck,
  bumpCount,
  bumpCount2,
  onAutoComplete,
  onPlayMinigame,
}: BodyProps) {
  switch (challenge.type) {
    case 'scavenger':
      return (
        <Checklist
          items={challenge.checklist ?? []}
          progress={progress}
          onToggle={toggleCheck}
          style={challenge.checklistStyle}
        />
      );

    case 'count': {
      const config = challengeConfig(challenge) as { duelLabels?: [string, string] } | undefined;
      return (
        <Counter
          style={challenge.countStyle}
          duelLabels={config?.duelLabels}
          value={progress.count ?? 0}
          value2={progress.count2 ?? 0}
          hasValue={progress.count !== undefined}
          hasValue2={progress.count2 !== undefined}
          bump={bumpCount}
          bump2={bumpCount2}
        />
      );
    }

    case 'taste':
      return (
        <>
          <MapleRating value={progress.rating ?? 0} onChange={(v) => patch({ rating: v })} />
          {challenge.checklist && challenge.checklist.length > 0 && (
            <Checklist
              items={challenge.checklist}
              progress={progress}
              onToggle={toggleCheck}
              style={challenge.checklistStyle}
            />
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
            <Checklist
              items={challenge.checklist}
              progress={progress}
              onToggle={toggleCheck}
              style={challenge.checklistStyle}
            />
          )}
        </>
      );

    case 'trivia':
      return challenge.trivia?.length ? (
        <TriviaRunner
          questions={challenge.trivia}
          onDone={(correct) => {
            patch({ triviaCorrect: correct });
            // Let the score card show for a beat, then bank automatically.
            window.setTimeout(onAutoComplete, 3000);
          }}
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
            <Checklist
              items={challenge.checklist}
              progress={progress}
              onToggle={toggleCheck}
              style={challenge.checklistStyle}
            />
          )}
        </>
      );

    case 'minigame': {
      const launchText = challenge.launchText ?? (stepKind === 'drive' ? 'Time for a car game!' : 'Time for a game!');
      return (
        <div className="minigame-launch">
          <p className="lead">{launchText}</p>
          <button className="btn btn--yellow btn--mega" onClick={onPlayMinigame}>
            ▶︎ PLAY {challenge.title.toUpperCase()}
          </button>
        </div>
      );
    }

    default:
      return null;
  }
}

/**
 * Picks a column count for the checklist grid so the last row is never a lone
 * "orphan" item (e.g. 4 items always renders 2×2, never 3+1). Small item counts
 * only, which is all a checklist ever has.
 */
function pickChecklistColumns(n: number): number {
  if (n <= 1) return 1;
  for (const cols of [2, 3]) {
    if (n % cols === 0) return cols;
  }
  for (const cols of [2, 3, 4]) {
    if (n % cols !== 1) return cols;
  }
  return 2;
}

function Checklist({
  items,
  progress,
  onToggle,
  style = 'find',
}: {
  items: string[];
  progress: { checked?: boolean[] };
  onToggle: (index: number, total: number) => void;
  style?: 'find' | 'guess';
}) {
  const checked = items.map((_, i) => progress.checked?.[i] ?? false);
  const toggle = (i: number) => onToggle(i, items.length);
  const found = checked.filter(Boolean).length;
  const cols = pickChecklistColumns(items.length);

  return (
    <div className="checklist">
      <p className="checklist__count">
        {style === 'guess' ? 'Your guesses' : `Found ${found} of ${items.length}`}
      </p>
      <ul style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
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

function SingleCounter({
  label,
  value,
  bump,
}: {
  label?: string;
  value: number;
  bump: (delta: number | 'clear', absolute?: number) => void;
}) {
  return (
    <div className="counter__single">
      {label && <p className="counter__duellabel">{label}</p>}
      <div className="counter__row">
        <button className="btn btn--round" onClick={() => bump(-1)} aria-label={label ? `${label} minus one` : 'minus one'}>
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
          aria-label={label ? `${label} count` : 'Your count'}
        />
        <button className="btn btn--round" onClick={() => bump(1)} aria-label={label ? `${label} plus one` : 'plus one'}>
          +
        </button>
      </div>
    </div>
  );
}

function Counter({
  style,
  duelLabels,
  value,
  value2,
  hasValue,
  hasValue2,
  bump,
  bump2,
}: {
  style?: 'single' | 'duel';
  duelLabels?: [string, string];
  value: number;
  value2: number;
  hasValue: boolean;
  hasValue2: boolean;
  bump: (delta: number | 'clear', absolute?: number) => void;
  bump2: (delta: number | 'clear', absolute?: number) => void;
}) {
  if (style === 'duel') {
    const labels = duelLabels ?? ['Team A', 'Team B'];
    const bothIn = hasValue && hasValue2;
    const winnerText = !bothIn
      ? null
      : value === value2
        ? "It's a tie — great game, everyone!"
        : `🏆 ${value < value2 ? labels[0] : labels[1]} wins!`;

    return (
      <div className="counter counter--duel">
        <p className="counter__label">Enter both scores — lower wins!</p>
        <div className="counter__duelrow">
          <SingleCounter label={labels[0]} value={value} bump={bump} />
          <SingleCounter label={labels[1]} value={value2} bump={bump2} />
        </div>
        {winnerText && <p className="counter__winner">{winnerText}</p>}
        <p className="muted">It's mini-golf — the lower score wins!</p>
      </div>
    );
  }

  return (
    <div className="counter">
      <p className="counter__label">Type or tap your number</p>
      <SingleCounter value={value} bump={bump} />
      <div className="row">
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
