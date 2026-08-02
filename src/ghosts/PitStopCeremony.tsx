/**
 * The pit-stop ceremony for legs 1–7 (and any leg with a scripted placement).
 *
 * Beats: mat arrival → host lines (one of them reacts to what the player
 * actually did this leg) → standings reveal → elimination sequence (if the
 * script says so) → badge award → next-leg tease.
 *
 * The placement is ALWAYS the scripted one. `legStats` only changes flavour.
 */
import { useMemo, useState } from 'react';
import type { GhostTeam } from '../types';
import type {
  AvatarResolver,
  HistoryEntry,
  LegStats,
  ScriptEntry,
  ScriptInput,
  TeamReactions,
} from './types';
import { fillTokens, normalizeScript, ordinal, statsLineFor, teamById } from './script';
import { BadgeChip, BigButton, ConfettiStorm, HostDialogue, TeamAvatar } from './shared';
import StandingsBoard from './StandingsBoard';
import './PitStopCeremony.css';

export interface PitStopCeremonyProps {
  /** Scripted entry for this leg. */
  entry: ScriptEntry;
  teams: GhostTeam[];
  teamName: string;
  /** What the player actually did — woven into the host's dialogue. */
  legStats: LegStats;
  /** Badge awarded for finishing this leg (e.g. 'cannon-blaster'). */
  badgeId?: string;
  /** Called when the ceremony is over. */
  onDone: () => void;

  /* optional */
  /** Past leg results, so earlier eliminations stay grayed out. */
  history?: HistoryEntry[];
  /** Whole script (or entries) — only used to look up team reactions. */
  script?: ScriptInput;
  /** Explicit reactions map; wins over `script`. */
  reactions?: Record<string, TeamReactions>;
  avatarResolver?: AvatarResolver;
  playerAvatarId?: string;
  hostName?: string;
  /** Hotel/city shown on the mat, e.g. 'Comfort Suites Kingston Central'. */
  pitStopName?: string;
  /** Pretty badge name; defaults to a title-cased badgeId. */
  badgeLabel?: string;
  /** Workstream E's pit-stop mat art (SVG url); falls back to the CSS mat. */
  matArtUrl?: string;
}

type Phase = 'mat' | 'standings' | 'elimination' | 'badge' | 'tease';

export default function PitStopCeremony({
  entry,
  teams,
  teamName,
  legStats,
  badgeId,
  onDone,
  history = [],
  script,
  reactions,
  avatarResolver,
  playerAvatarId = 'team-player',
  hostName = 'Jon',
  pitStopName,
  badgeLabel,
  matArtUrl,
}: PitStopCeremonyProps) {
  const [phase, setPhase] = useState<Phase>('mat');
  const [standingsSettled, setStandingsSettled] = useState(false);
  const [elimStep, setElimStep] = useState<'host' | 'farewell'>('host');

  const reactionMap = useMemo<Record<string, TeamReactions>>(
    () => reactions ?? (script ? normalizeScript(script).reactions : {}),
    [reactions, script],
  );

  const isWin = entry.yassaPlacement === 1;
  const cutTeam = teamById(teams, entry.eliminatedTeamId);

  /** Host script for the mat: placement → responsive stats line → drama → rest. */
  const matLines = useMemo(() => {
    const scripted = entry.ceremonyLines ?? [];
    const lines: string[] = [];
    if (scripted[0]) lines.push(scripted[0]);
    lines.push(statsLineFor(entry, legStats, teamName));
    if (entry.closeCall) lines.push(entry.closeCall);
    lines.push(...scripted.slice(1));
    return lines.map((l) => fillTokens(l, teamName, legStats));
  }, [entry, legStats, teamName]);

  const elimLines = useMemo(() => {
    if (!cutTeam) return [];
    const scripted = entry.eliminationLines?.length
      ? entry.eliminationLines
      : [
          `${cutTeam.name}... you raced hard today.`,
          "I'm sorry to tell you... you've been eliminated from the race.",
        ];
    return scripted.map((l) => fillTokens(l, teamName, legStats));
  }, [cutTeam, entry.eliminationLines, teamName, legStats]);

  const farewell = cutTeam
    ? fillTokens(
        reactionMap[cutTeam.id]?.farewell ??
          `${cutTeam.members[0]}: "What a race. Go get 'em, ${teamName}!"`,
        teamName,
        legStats,
      )
    : '';

  const survivorLine = useMemo(() => {
    if (!cutTeam) return '';
    const survivor = teams.find(
      (t) =>
        t.id !== cutTeam.id &&
        !history.some((h) => h.eliminatedTeamId === t.id) &&
        reactionMap[t.id]?.onOtherElimination,
    );
    return survivor ? fillTokens(reactionMap[survivor.id].onOtherElimination, teamName) : '';
  }, [cutTeam, teams, history, reactionMap, teamName]);

  const afterStandings = () => setPhase(cutTeam ? 'elimination' : badgeId ? 'badge' : 'tease');

  return (
    <div className="arc-scene arc-pitstop">
      {isWin && phase !== 'elimination' && <ConfettiStorm count={64} />}

      <header className="arc-pitstop-header">
        <span className="arc-eyebrow">
          Leg {entry.legId} · Pit Stop{pitStopName ? ` · ${pitStopName}` : ''}
        </span>
        {entry.title && <h1 className="arc-pitstop-title">{entry.title}</h1>}
      </header>

      {/* ---------------- mat ---------------- */}
      {phase === 'mat' && (
        <div className="arc-pitstop-stage">
          <div className="arc-mat">
            <div className={`arc-mat-surface${matArtUrl ? ' arc-mat-surface--art' : ''}`}>
              {matArtUrl && (
                <img className="arc-mat-art" src={matArtUrl} alt="" draggable={false} aria-hidden="true" />
              )}
              <TeamAvatar
                avatarId={playerAvatarId}
                name={teamName}
                size={132}
                resolver={avatarResolver}
                className="arc-mat-team"
              />
            </div>
            <div className="arc-mat-place">
              <span className="arc-mat-placenum">{entry.yassaPlacement}</span>
              <span className="arc-mat-placeword">
                {ordinal(entry.yassaPlacement)} place
                {entry.teamsRemaining ? ` of ${entry.teamsRemaining}` : ''}
              </span>
            </div>
          </div>
          <div className="arc-legstats">
            <span>
              <strong>{legStats.pointsEarned}</strong> points
            </span>
            <span>
              <strong>
                {legStats.challengesCompleted}/{legStats.challengesTotal}
              </strong>{' '}
              challenges
            </span>
          </div>
          <p className="arc-legstats-note">
            Points build your season score. Placement is about time on the course.
          </p>
          <HostDialogue
            lines={matLines}
            hostName={hostName}
            avatarResolver={avatarResolver}
            onDone={() => setPhase('standings')}
          />
        </div>
      )}

      {/* ---------------- standings ---------------- */}
      {phase === 'standings' && (
        <div className="arc-pitstop-stage">
          <StandingsBoard
            teams={teams}
            entry={entry}
            teamName={teamName}
            history={history}
            avatarResolver={avatarResolver}
            playerAvatarId={playerAvatarId}
            onSettled={() => setStandingsSettled(true)}
            showEliminationStamp={false}
          />
          <div className="arc-footer">
            <BigButton onClick={afterStandings} tone={standingsSettled ? 'primary' : 'quiet'}>
              Continue →
            </BigButton>
          </div>
        </div>
      )}

      {/* ---------------- elimination ---------------- */}
      {phase === 'elimination' && cutTeam && (
        <div className="arc-pitstop-stage arc-elim">
          <div className="arc-elim-team">
            <TeamAvatar
              avatarId={cutTeam.avatarId}
              name={cutTeam.name}
              teamId={cutTeam.id}
              size={168}
              resolver={avatarResolver}
              className={elimStep === 'farewell' ? 'arc-elim-gray' : undefined}
            />
            <h2 className="arc-elim-name">{cutTeam.name}</h2>
            <p className="arc-elim-members">{cutTeam.members.join(' & ')}</p>
          </div>

          {elimStep === 'host' ? (
            <HostDialogue
              lines={elimLines}
              hostName={hostName}
              avatarResolver={avatarResolver}
              onDone={() => setElimStep('farewell')}
            />
          ) : (
            <div className="arc-elim-farewell">
              <p className="arc-elim-quote">{farewell}</p>
              {survivorLine && <p className="arc-elim-quote arc-elim-quote-sub">{survivorLine}</p>}
              <div className="arc-footer">
                <BigButton onClick={() => setPhase(badgeId ? 'badge' : 'tease')}>
                  Say goodbye 👋
                </BigButton>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- badge ---------------- */}
      {phase === 'badge' && badgeId && (
        <div className="arc-pitstop-stage arc-award">
          <ConfettiStorm count={50} />
          <h2 className="arc-award-title">Badge unlocked!</h2>
          <BadgeChip
            badgeId={badgeId}
            label={badgeLabel}
            size={180}
            resolver={avatarResolver}
          />
          <p className="arc-award-sub">Added to your badge wall.</p>
          <div className="arc-footer">
            <BigButton onClick={() => setPhase('tease')}>Nice! →</BigButton>
          </div>
        </div>
      )}

      {/* ---------------- next leg ---------------- */}
      {phase === 'tease' && (
        <div className="arc-pitstop-stage arc-tease">
          <span className="arc-eyebrow">Coming up</span>
          <p className="arc-tease-text">
            {entry.nextLegTease ?? 'Get some rest. The next leg starts in the morning!'}
          </p>
          <div className="arc-footer">
            <BigButton onClick={onDone}>Back to Race HQ →</BigButton>
          </div>
        </div>
      )}
    </div>
  );
}
