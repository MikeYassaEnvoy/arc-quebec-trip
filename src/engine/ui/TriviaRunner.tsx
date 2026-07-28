import { useState } from 'react';
import type { TriviaQuestion } from '../../types';

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
  if (!q) return null;

  const pick = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answerIndex) setCorrect((c) => c + 1);
  };

  const next = () => {
    const wasRight = picked === q.answerIndex;
    const totalCorrect = correct;
    if (index + 1 >= questions.length) {
      setFinished(true);
      onDone?.(totalCorrect, questions.length);
    } else {
      setIndex(index + 1);
      setPicked(null);
    }
    return wasRight;
  };

  if (finished) {
    return (
      <div className="trivia trivia--done">
        <p className="trivia__score">
          {correct} / {questions.length} correct!
        </p>
        <p className="muted">Great answering. Now tap Challenge Complete.</p>
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
        {q.choices.map((c, i) => {
          const state =
            picked === null ? '' : i === q.answerIndex ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
          return (
            <button key={i} className={`btn btn--answer${state}`} onClick={() => pick(i)}>
              {c}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="trivia__after">
          <p className={picked === q.answerIndex ? 'good' : 'bad'}>
            {picked === q.answerIndex ? '✅ Correct!' : `❌ The answer was: ${q.choices[q.answerIndex]}`}
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
