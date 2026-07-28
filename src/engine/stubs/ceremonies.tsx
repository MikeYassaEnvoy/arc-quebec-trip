import type {
  Ceremonies,
  FinaleSequenceProps,
  MeetTheTeamsProps,
  PitStopCeremonyProps,
  StandingsBoardProps,
} from '../ceremonyTypes';
import { Confetti } from '../ui/Confetti';

/**
 * Placeholder ceremonies. Workstream D replaces these by repointing src/engine/wiring.ts.
 * They render real store data so the props contract is exercised end to end before merge.
 */

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
};

export function StubStandingsBoard({
  teamName,
  yassaPlacement,
  teamsRemaining,
  teams,
  eliminatedTeamId,
}: StandingsBoardProps) {
  const rivals = teams.length ? teams : [];
  return (
    <div className="standings">
      <div className="standings__row standings__row--you">
        <span className="standings__place">{ordinal(yassaPlacement)}</span>
        <span className="standings__name">{teamName}</span>
      </div>
      {rivals.map((t) => (
        <div key={t.id} className={`standings__row${t.id === eliminatedTeamId ? ' standings__row--out' : ''}`}>
          <span className="standings__place">—</span>
          <span className="standings__name">{t.name}</span>
          {t.id === eliminatedTeamId && <span className="pill pill--red">Eliminated</span>}
        </div>
      ))}
      <p className="muted">{teamsRemaining} teams still racing.</p>
    </div>
  );
}

export function StubMeetTheTeams(props: MeetTheTeamsProps) {
  const { teamName, teams, onFinish, onExit, scriptEntry } = props;
  return (
    <div className="screen ceremony">
      <div className="card ceremony__card">
        <p className="pill pill--yellow">Ceremony placeholder</p>
        <h1 className="h1">Meet the Teams</h1>
        <p className="lead">
          Welcome to the Amazing Race Canada, {teamName}! Here are the teams you are up against.
        </p>
        {(scriptEntry?.ceremonyLines ?? []).map((line, i) => (
          <p key={i} className="host-line">“{line}”</p>
        ))}
        <div className="teamgrid">
          {teams.length === 0 && <p className="muted">Ghost teams arrive with Workstream D.</p>}
          {teams.map((t) => (
            <div key={t.id} className="teamgrid__team">
              <div className="teamgrid__avatar">🏁</div>
              <strong>{t.name}</strong>
              <span className="muted">{t.tagline}</span>
            </div>
          ))}
        </div>
        <div className="row">
          <button className="btn btn--yellow btn--huge" onClick={onFinish}>
            Let’s race!
          </button>
          <button className="btn btn--ghost" onClick={onExit}>
            Not yet
          </button>
        </div>
      </div>
    </div>
  );
}

export function StubPitStopCeremony(props: PitStopCeremonyProps) {
  const {
    legId,
    legTitle,
    teamName,
    avatarId,
    teams,
    scriptEntry,
    completedChallenges,
    pointsThisLeg,
    seasonPoints,
    pitStop,
    isPracticeLeg,
    onFinish,
    onExit,
  } = props;
  const placement = scriptEntry?.yassaPlacement ?? 1;
  const teamsRemaining = Math.max(placement, teams.length + 1 || placement);

  return (
    <div className="screen ceremony">
      <Confetti burst={placement === 1} />
      <div className="card ceremony__card">
        <p className="pill pill--yellow">Ceremony placeholder</p>
        <h1 className="h1">Pit Stop — {pitStop.hotelName}</h1>
        <p className="lead">
          {teamName}, you are the {ordinal(placement)} team to arrive.
        </p>
        {isPracticeLeg && <p className="muted">Practice leg — these points do not count.</p>}
        {(scriptEntry?.ceremonyLines ?? [
          `That is the end of Leg ${legId}: ${legTitle}.`,
          `You banked ${pointsThisLeg} points and finished ${completedChallenges.length} challenges.`,
        ]).map((line, i) => (
          <p key={i} className="host-line">“{line}”</p>
        ))}
        {scriptEntry?.closeCall && <p className="drama">{scriptEntry.closeCall}</p>}

        <StubStandingsBoard
          legId={legId}
          teamName={teamName}
          avatarId={avatarId}
          yassaPlacement={placement}
          teamsRemaining={teamsRemaining}
          teams={teams}
          eliminatedTeamId={scriptEntry?.eliminatedTeamId}
        />

        <p className="muted">
          Leg points: {pointsThisLeg} · Season total: {seasonPoints}
        </p>

        <div className="row">
          <button className="btn btn--yellow btn--huge" onClick={onFinish}>
            Finish the leg
          </button>
          <button className="btn btn--ghost" onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export function StubFinaleSequence(props: FinaleSequenceProps) {
  const { teamName, seasonPoints, badges, photos, standingsHistory, onFinish, onExit } = props;
  return (
    <div className="screen ceremony">
      <Confetti burst />
      <div className="card ceremony__card">
        <p className="pill pill--yellow">Finale placeholder</p>
        <h1 className="h1">🏆 {teamName} — Race Champions!</h1>
        <p className="lead">You crossed the finish line first. The whole season is yours.</p>
        <ul className="recap">
          <li>Season points: <strong>{seasonPoints}</strong></li>
          <li>Badges earned: <strong>{badges.length}</strong></li>
          <li>Photos taken: <strong>{photos.length}</strong></li>
          <li>Legs raced: <strong>{standingsHistory.length}</strong></li>
        </ul>
        <div className="row">
          <button className="btn btn--yellow btn--huge" onClick={onFinish}>
            See the season recap
          </button>
          <button className="btn btn--ghost" onClick={onExit}>
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

export const stubCeremonies: Ceremonies = {
  MeetTheTeams: StubMeetTheTeams,
  PitStopCeremony: StubPitStopCeremony,
  FinaleSequence: StubFinaleSequence,
  StandingsBoard: StubStandingsBoard,
};
