import { BADGES } from '../badges';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { badgeArt } from '../art';

function BadgeArt({ id, emoji }: { id: string; emoji: string }) {
  const art = badgeArt(id);
  if (art) return <img className="badge__img" src={art} alt="" draggable={false} />;
  return <>{emoji}</>;
}

export function Badges() {
  const back = useRouter((s) => s.back);
  const earned = useRaceStore((s) => s.badges);

  return (
    <div className="screen badges">
      <header className="topbar topbar--sub">
        <button className="btn btn--nav" onClick={back}>
          ← Back
        </button>
        <div>
          <p className="kicker">Trophy case</p>
          <h1 className="h1">Badges</h1>
        </div>
        <div className="topbar__stats">
          <div className="stat">
            <span className="stat__value">
              {earned.length}/{BADGES.length}
            </span>
            <span className="stat__label">earned</span>
          </div>
        </div>
      </header>

      <div className="badgegrid">
        {BADGES.map((b) => {
          const got = earned.includes(b.id);
          return (
            <div key={b.id} className={`badge${got ? ' is-earned' : ''}`}>
              <span className="badge__art">{got ? <BadgeArt id={b.id} emoji={b.emoji} /> : '❔'}</span>
              <span className="badge__name">{got ? b.name : '???'}</span>
              <span className="badge__how">{b.how}</span>
            </div>
          );
        })}
      </div>
      {earned.filter((id) => !BADGES.some((b) => b.id === id)).length > 0 && (
        <div className="badgegrid">
          {earned
            .filter((id) => !BADGES.some((b) => b.id === id))
            .map((id) => (
              <div key={id} className="badge is-earned">
                <span className="badge__art">
                  <BadgeArt id={id} emoji="🏅" />
                </span>
                <span className="badge__name">{id}</span>
                <span className="badge__how">Awarded during a ceremony</span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
