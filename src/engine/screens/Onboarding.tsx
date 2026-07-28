import { useState } from 'react';
import { useRaceStore } from '../store';
import { useRouter } from '../router';
import { AVATARS } from '../ui/avatars';
import { FIRST_LEG_ID } from '../content';

export function Onboarding() {
  const finishOnboarding = useRaceStore((s) => s.finishOnboarding);
  const reset = useRouter((s) => s.reset);
  const [name, setName] = useState('Team Yassa');
  const [avatarId, setAvatarId] = useState(AVATARS[0].id);

  const start = () => {
    finishOnboarding(name, avatarId);
    reset({ name: 'leg', legId: FIRST_LEG_ID });
  };

  return (
    <div className="screen onboarding">
      <div className="onboarding__inner">
        <header className="onboarding__head">
          <p className="kicker">The Amazing Race Canada</p>
          <h1 className="h1 h1--mega">YASSA EDITION</h1>
          <p className="lead">Racers, welcome! Two questions before the starting line.</p>
        </header>

        <section className="card">
          <h2 className="h2">1. What is your team called?</h2>
          <input
            className="input input--big"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            aria-label="Team name"
            autoComplete="off"
            spellCheck={false}
          />
        </section>

        <section className="card">
          <h2 className="h2">2. Pick your racer</h2>
          <div className="avatarpick">
            {AVATARS.map((a) => (
              <button
                key={a.id}
                className={`avatarpick__opt${avatarId === a.id ? ' is-picked' : ''}`}
                style={{ ['--avatar-color' as string]: a.color }}
                onClick={() => setAvatarId(a.id)}
                aria-pressed={avatarId === a.id}
              >
                <span className="avatarpick__face">{a.emoji}</span>
                <span className="avatarpick__name">{a.name}</span>
              </button>
            ))}
          </div>
        </section>

        <button className="btn btn--red btn--mega" onClick={start} disabled={!name.trim()}>
          START THE RACE →
        </button>
      </div>
    </div>
  );
}
