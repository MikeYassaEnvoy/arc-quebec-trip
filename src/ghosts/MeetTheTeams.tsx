/**
 * Leg 0 pit stop — "Meet the Teams".
 * Host welcomes the player, introduces all four rivals with a drama tease,
 * then reveals that the race is on. No placements, no elimination.
 */
import { useState } from 'react';
import type { GhostTeam } from '../types';
import type { AvatarResolver, ScriptInput } from './types';
import { entryForLeg, fillTokens } from './script';
import { BigButton, ConfettiStorm, HostDialogue, TeamAvatar } from './shared';
import './MeetTheTeams.css';

export interface MeetTheTeamsProps {
  /** The four ghost teams (from season-script.json). */
  teams: GhostTeam[];
  /** Whole season script, or just its entries. */
  script: ScriptInput;
  /** Player's team name from onboarding. */
  teamName: string;
  /** Called when the ceremony finishes (engine awards Race Rookie + unlocks Leg 1). */
  onDone: () => void;
  /** Optional: swap emoji placeholders for Workstream E art. */
  avatarResolver?: AvatarResolver;
  /** Optional: the avatar the player picked in onboarding. */
  playerAvatarId?: string;
  hostName?: string;
}

type Phase = 'welcome' | 'intros' | 'outro' | 'go';

const FALLBACK_WELCOME = [
  'Welcome to The Amazing Race Canada, {team}!',
  'Four teams are here to race you across Ontario and Québec.',
  'Say hello. Tomorrow, none of them will slow down for you.',
];
const FALLBACK_OUTRO = ['That is your competition, {team}.', 'The race... starts... NOW!'];

export default function MeetTheTeams({
  teams,
  script,
  teamName,
  onDone,
  avatarResolver,
  playerAvatarId = 'team-player',
  hostName = 'The Host',
}: MeetTheTeamsProps) {
  const entry = entryForLeg(script, 0);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [introIndex, setIntroIndex] = useState(0);

  const welcomeLines = (entry?.ceremonyLines?.length ? entry.ceremonyLines : FALLBACK_WELCOME).map(
    (l) => fillTokens(l, teamName),
  );
  const outroLines = (entry?.outroLines?.length ? entry.outroLines : FALLBACK_OUTRO).map((l) =>
    fillTokens(l, teamName),
  );

  const introOrder = entry?.intros?.length
    ? entry.intros
        .map((i) => ({ team: teams.find((t) => t.id === i.teamId), tease: i.tease }))
        .filter((x): x is { team: GhostTeam; tease: string } => !!x.team)
    : teams.map((team) => ({ team, tease: team.personality }));

  const current = introOrder[introIndex];

  const nextIntro = () => {
    if (introIndex < introOrder.length - 1) setIntroIndex(introIndex + 1);
    else setPhase('outro');
  };

  return (
    <div className="arc-scene arc-meet">
      <header className="arc-meet-header">
        <span className="arc-eyebrow">Leg 0 · Starting Line</span>
        <h1 className="arc-meet-title">Meet the Teams</h1>
      </header>

      {phase === 'welcome' && (
        <div className="arc-meet-stage">
          <div className="arc-meet-player">
            <TeamAvatar
              avatarId={playerAvatarId}
              name={teamName}
              size={168}
              resolver={avatarResolver}
            />
            <span className="arc-meet-playername">{teamName}</span>
            <span className="arc-meet-playertag">That's you!</span>
          </div>
          <HostDialogue
            lines={welcomeLines}
            hostName={hostName}
            avatarResolver={avatarResolver}
            onDone={() => setPhase('intros')}
          />
        </div>
      )}

      {phase === 'intros' && current && (
        <div className="arc-meet-stage">
          <div className="arc-meet-card" key={current.team.id}>
            <TeamAvatar
              avatarId={current.team.avatarId}
              name={current.team.name}
              teamId={current.team.id}
              size={200}
              resolver={avatarResolver}
            />
            <div className="arc-meet-card-text">
              <h2 className="arc-meet-teamname">{current.team.name}</h2>
              <p className="arc-meet-members">{current.team.members.join(' & ')}</p>
              <p className="arc-meet-tagline">“{current.team.tagline}”</p>
              <p className="arc-meet-personality">{current.team.personality}</p>
            </div>
            <span className="arc-meet-count">
              {introIndex + 1} / {introOrder.length}
            </span>
          </div>
          <HostDialogue
            key={current.team.id}
            lines={[fillTokens(current.tease, teamName)]}
            hostName={hostName}
            avatarResolver={avatarResolver}
            onDone={nextIntro}
          />
        </div>
      )}

      {phase === 'outro' && (
        <div className="arc-meet-stage">
          <div className="arc-meet-lineup">
            {teams.map((t) => (
              <div className="arc-meet-lineup-item" key={t.id}>
                <TeamAvatar
                  avatarId={t.avatarId}
                  name={t.name}
                  teamId={t.id}
                  size={104}
                  resolver={avatarResolver}
                />
                <span>{t.name}</span>
              </div>
            ))}
          </div>
          <HostDialogue
            lines={outroLines}
            hostName={hostName}
            avatarResolver={avatarResolver}
            onDone={() => setPhase('go')}
          />
        </div>
      )}

      {phase === 'go' && (
        <div className="arc-meet-go">
          <ConfettiStorm count={60} />
          <h2 className="arc-meet-gotitle">THE RACE IS ON!</h2>
          <p className="arc-meet-gosub">
            {entry?.nextLegTease ?? 'Leg 1 is unlocked. Good luck, racers!'}
          </p>
          <div className="arc-footer">
            <BigButton onClick={onDone}>Start the Race →</BigButton>
          </div>
        </div>
      )}
    </div>
  );
}
