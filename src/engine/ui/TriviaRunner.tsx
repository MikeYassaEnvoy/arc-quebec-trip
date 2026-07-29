import { useMemo, useState } from 'react';
import type { TriviaQuestion } from '../../types';

/** Fisher–Yates over indices 0..n-1. Never touches the source array. */
function shuffledIndices(n: number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Inline trivia runner used by `trivia` challenges (the drive-time TriviaRunner
 * mini-game from Workstream C1 is a separate, richer component).
 */
export function TriviaRunner({
  questions,
  onDone,
}: {
  questions: TriviaQuestion[];
  onDone?: (correct: number, total: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const q = questions[index];

  // Runtime answer shuffle (round 2 item 2): a fresh permutation per question, so the
  // correct answer isn't always in the same slot. `order[displayIndex]` is the original
  // choice index; the source `questions` array is never mutated.
  const order = useMemo(() => (q ? shuffledIndices(q.choices.length) : []), [q]);
  const correctDisplayIndex = q ? order.indexOf(q.answerIndex) : -1;

  if (!q) return null;

  const pick = (displayIndex: number) => {
    if (picked !== null) return;
    setPicked(displayIndex);
    if (displayIndex === correctDisplayIndex) setCorrect((c) => c + 1);
  };

  const next = () => {
    if (index + 1 >= questions.length) {
      setFinished(true);
      onDone?.(correct, questions.length);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
  };

  if (finished) {
    return (
      <div className="trivia trivia--done">
        <p className="trivia__score">
          {correct} / {questions.length} correct!
        </p>
        <p className="trivia__banking">Banking your points…</p>
      </div>
    );
  }

  return (
    <div className="trivia">
      <div className="trivia__dots">
        {questions.map((_, i) => (
          <span key={i} className={`dot${i < index ? ' is-done' : ''}${i === index ? ' is-now' : ''}`} />
        ))}
      </div>
      <p className="trivia__q">{q.q}</p>
      <div className="trivia__choices">
        {order.map((origIndex, displayIndex) => {
          const state =
            picked === null
              ? ''
              : displayIndex === correctDisplayIndex
                ? ' is-right'
                : displayIndex === picked
                  ? ' is-wrong'
                  : ' is-dim';
          return (
            <button key={origIndex} className={`btn btn--answer${state}`} onClick={() => pick(displayIndex)}>
              {q.choices[origIndex]}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="trivia__after">
          <p className={picked === correctDisplayIndex ? 'good' : 'bad'}>
            {picked === correctDisplayIndex ? '✅ Correct!' : `❌ The answer was: ${q.choices[q.answerIndex]}`}
          </p>
          {q.funFact && <p className="funfact">💡 {q.funFact}</p>}
          <button className="btn btn--yellow btn--huge" onClick={next}>
            {index + 1 >= questions.length ? 'See my score' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  );
}
