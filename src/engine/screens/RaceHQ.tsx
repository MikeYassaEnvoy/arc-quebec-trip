import { useRaceStore, selectSeasonPoints, APP_VERSION, PRACTICE_LEG_ID } from '../store';
import { useRouter } from '../router';
import { useAllLegs } from '../useContent';
import { avatarById } from '../ui/avatars';
import { FINAL_LEG_ID } from '../content';
import { VersionTapper } from './ParentMenu';
import { RouteMap } from '../ui/RouteMap';

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

export function RaceHQ() {
  const state = useRaceStore();
  const go = useRouter((s) => s.go);
  const { legs, loading } = useAllLegs();

  const seasonPoints = selectSeasonPoints(state);
  const avatar = avatarById(state.avatarId);
  const last = state.standingsHistory[state.standingsHistory.length - 1];
  const currentLeg = legs?.find((l) => l.leg.id === state.currentLegId)?.leg;

  return (
    <div className="screen hq">
      <header className="topbar">
        <div className="topbar__team">
          <span className="topbar__avatar" style={{ ['--avatar-color' as string]: avatar.color }}>
            {avatar.art ? <img className="topbar__avatarimg" src={avatar.art} alt="" draggable={false} /> : avatar.emoji}
          </span>
          <div>
            <p className="kicker">Race HQ</p>
            <h1 className="h2">{state.teamName}</h1>
          </div>
        </div>
        <div className="topbar__stats">
          <Stat label="Points" value={seasonPoints} />
          <Stat label="Badges" value={state.badges.length} />
          <Stat label="Photos" value={state.photos.length} />
          <Stat label="Last leg" value={last ? ordinal(last.yassaPlacement) : '—'} />
        </div>
        <nav className="topbar__nav">
          <button className="btn btn--nav" onClick={() => go({ name: 'album' })}>
            📷 Album
          </button>
          <button className="btn btn--nav" onClick={() => go({ name: 'badges' })}>
            🏅 Badges
          </button>
        </nav>
      </header>

      <main className="hq__body">
        <section className="hq__map card">
          <h2 className="h2">Route Map</h2>
          <RouteMap
            legsCompleted={state.legsCompleted}
            currentLegId={state.currentLegId}
            unlockedLegId={state.unlockedLegId}
            onSelectLeg={(legId) => go({ name: 'leg', legId })}
          />
          {loading && <p className="muted">Loading the route…</p>}
        </section>

        <section className="hq__current card card--hot">
          <p className="kicker">{state.currentLegId === FINAL_LEG_ID ? 'The Finale' : 'Current leg'}</p>
          <h2 className="h1">
            Leg {state.currentLegId}
            {currentLeg ? `: ${currentLeg.title}` : ''}
          </h2>
          {currentLeg && (
            <p className="lead">
              {currentLeg.routeText} · {currentLeg.steps.length} stops · Pit stop:{' '}
              {currentLeg.pitStop.hotelName}
            </p>
          )}
          {state.currentLegId === PRACTICE_LEG_ID && (
            <p className="muted">Practice leg — points do not count toward the season.</p>
          )}
          <button
            className="btn btn--red btn--mega"
            onClick={() => go({ name: 'leg', legId: state.currentLegId })}
          >
            {state.legsCompleted.includes(state.currentLegId) ? 'REVISIT LEG →' : 'CONTINUE RACING →'}
          </button>
        </section>

        <section className="hq__standings card">
          <h2 className="h2">Standings</h2>
          {state.standingsHistory.length === 0 ? (
            <p className="muted">No pit stops yet. Your placements show up here.</p>
          ) : (
            <ul className="standingslist">
              {state.standingsHistory.map((r) => (
                <li key={r.legId}>
                  <span className="pill pill--yellow">Leg {r.legId}</span>
                  <strong>{ordinal(r.yassaPlacement)}</strong>
                  <span className="muted">
                    {r.pointsEarned} pts{r.eliminatedTeamId ? ` · ${r.eliminatedTeamId} eliminated` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="footer">
        <VersionTapper label={`v${APP_VERSION}`} />
      </footer>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
