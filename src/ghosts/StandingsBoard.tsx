/**
 * Animated placement reveal. Rows slide in and settle into the scripted
 * finishing order; the player's row is highlighted; eliminated teams gray out
 * and take a farewell stamp.
 *
 * Placements come ONLY from the script entry — nothing here is computed from
 * gameplay.
 */
import { useEffect, useMemo, useState } from 'react';
import type { GhostTeam } from '../types';
import type { AvatarResolver, HistoryEntry, ScriptEntry } from './types';
import { buildStandings, ordinal } from './script';
import { TeamAvatar, usePrefersReducedMotion } from './shared';
import './StandingsBoard.css';

export interface StandingsBoardProps {
  teams: GhostTeam[];
  /** The script entry for the leg being revealed. */
  entry: ScriptEntry;
  teamName: string;
  /** Past leg results — used to gray out teams eliminated on earlier legs. */
  history?: HistoryEntry[];
  avatarResolver?: AvatarResolver;
  playerAvatarId?: string;
  /** Fires once every row has settled (ceremony uses it to gate the next beat). */
  onSettled?: () => void;
  /** Skip the stagger (e.g. inside the finale recap). */
  instant?: boolean;
  /** Show the "ELIMINATED" stamp on this leg's cut team. Default true. */
  showEliminationStamp?: boolean;
  title?: string;
}

const ROW_MS = 260;

export default function StandingsBoard({
  teams,
  entry,
  teamName,
  history = [],
  avatarResolver,
  playerAvatarId = 'team-player',
  onSettled,
  instant = false,
  showEliminationStamp = true,
  title,
}: StandingsBoardProps) {
  const reduced = usePrefersReducedMotion();
  const skipAnim = instant || reduced;

  const rows = useMemo(
    () => buildStandings(entry, teams, teamName, history, playerAvatarId),
    [entry, teams, teamName, history, playerAvatarId],
  );

  const [settled, setSettled] = useState(skipAnim);

  useEffect(() => {
    if (skipAnim) {
      setSettled(true);
      onSettled?.();
      return;
    }
    setSettled(false);
    const total = rows.length * ROW_MS + 500;
    const t = window.setTimeout(() => {
      setSettled(true);
      onSettled?.();
    }, total);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.legId, rows.length, skipAnim]);

  return (
    <section className="arc-standings" aria-label="Standings">
      <h3 className="arc-standings-title">
        {title ?? (entry.legId > 0 ? `Leg ${entry.legId} Standings` : 'Standings')}
      </h3>
      <ol className="arc-standings-list">
        {rows.map((row, i) => {
          const gone = row.eliminatedNow || row.eliminatedEarlier;
          return (
            <li
              key={row.id}
              className={[
                'arc-row',
                row.isPlayer ? 'arc-row-player' : '',
                gone ? 'arc-row-out' : '',
                row.eliminatedNow && showEliminationStamp ? 'arc-row-cut' : '',
                settled ? 'arc-row-settled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={skipAnim ? undefined : { animationDelay: `${i * ROW_MS}ms` }}
            >
              <span className="arc-row-place">{row.place}</span>
              <TeamAvatar
                avatarId={row.avatarId}
                name={row.name}
                teamId={row.isPlayer ? undefined : row.id}
                size={72}
                resolver={avatarResolver}
              />
              <span className="arc-row-name">
                {row.name}
                {row.members && <em className="arc-row-members">{row.members}</em>}
              </span>
              {row.isPlayer && <span className="arc-row-you">YOU · {ordinal(row.place)}</span>}
              {row.eliminatedEarlier && <span className="arc-row-stamp">ELIMINATED</span>}
              {row.eliminatedNow && showEliminationStamp && (
                <span className="arc-row-stamp arc-row-stamp-new">ELIMINATED</span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
