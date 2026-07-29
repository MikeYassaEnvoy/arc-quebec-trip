/**
 * Leg 8 finale: photo finish → confetti storm → trophy → season recap.
 * The player always wins — the photo finish is scripted, not simulated.
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { GhostTeam } from '../types';
import type {
  AvatarResolver,
  PhotoInput,
  ScriptEntry,
  ScriptInput,
  SeasonStats,
} from './types';
import { PLAYER_ID } from './types';
import {
  entryForLeg,
  fillTokens,
  normalizePhotos,
  normalizeScript,
  ordinal,
  teamById,
} from './script';
import { BadgeChip, BigButton, ConfettiStorm, HostDialogue, TeamAvatar, useTimedStep } from './shared';
import './FinaleSequence.css';

export interface FinaleSequenceProps {
  teams: GhostTeam[];
  /** Whole season script, or all entries. */
  script: ScriptInput;
  teamName: string;
  seasonStats: SeasonStats;
  /** Badge ids earned across the season. Renders gracefully when empty. */
  badges?: string[];
  /** Photo reel: data/object URLs, or {url, caption, legId}. Empty is fine. */
  photos?: PhotoInput[];
  onDone: () => void;

  /* optional */
  avatarResolver?: AvatarResolver;
  playerAvatarId?: string;
  hostName?: string;
  /** Pretty names for badge ids, e.g. { 'cannon-blaster': 'Cannon Blaster' }. */
  badgeLabels?: Record<string, string>;
  /** Slot for Workstream E's animated route-map replay. */
  mapReplay?: ReactNode;
}

type Phase = 'photofinish' | 'win' | 'trophy' | 'recap';

const FALLBACK_FINISH = ['Two teams. One mat. Here they come!', 'And it is... {team}!'];

export default function FinaleSequence({
  teams,
  script,
  teamName,
  seasonStats,
  badges = [],
  photos = [],
  onDone,
  avatarResolver,
  playerAvatarId = 'team-player',
  hostName = 'The Host',
  badgeLabels = {},
  mapReplay,
}: FinaleSequenceProps) {
  const { entries, reactions } = normalizeScript(script);
  const finalEntry: ScriptEntry | undefined = entryForLeg(entries, 8) ?? entries[entries.length - 1];

  const [phase, setPhase] = useState<Phase>('photofinish');
  const [crossed, setCrossed] = useState(false);
  const [finishLine, setFinishLine] = useState(0);

  /** The one rival still standing at the finale. */
  const rival = useMemo<GhostTeam | undefined>(() => {
    const fromOrder = finalEntry?.order?.find((id) => id !== PLAYER_ID);
    if (fromOrder) return teamById(teams, fromOrder);
    const cut = new Set(entries.map((e) => e.eliminatedTeamId).filter(Boolean) as string[]);
    return teams.find((t) => !cut.has(t.id));
  }, [finalEntry, teams, entries]);

  const finishLines = (
    finalEntry?.photoFinishLines?.length ? finalEntry.photoFinishLines : FALLBACK_FINISH
  ).map((l) => fillTokens(l, teamName));

  const winLines = (finalEntry?.ceremonyLines ?? []).map((l) => fillTokens(l, teamName));
  const recapLines = (finalEntry?.recapLines ?? []).map((l) => fillTokens(l, teamName));

  const rivalLine = rival
    ? fillTokens(reactions[rival.id]?.finale ?? `${rival.members[0]}: "Great race!"`, teamName)
    : '';

  // Race animation timing: captions tick over, then the player edges ahead.
  useTimedStep(finishLine, 1500, () => {
    if (phase !== 'photofinish') return;
    if (finishLine < finishLines.length - 1) setFinishLine(finishLine + 1);
    else setCrossed(true);
  });

  const raceEntries = entries.filter((e) => e.legId >= 1);
  const photoItems = normalizePhotos(photos);
  const wins = raceEntries.filter((e) => e.yassaPlacement === 1).length;

  return (
    <div className="arc-scene arc-finale">
      {/* ---------------- photo finish ---------------- */}
      {phase === 'photofinish' && (
        <div className="arc-finale-stage arc-photofinish">
          <span className="arc-eyebrow">Leg 8 · The Finish Line</span>
          <div className={`arc-track${crossed ? ' arc-track-done' : ''}`}>
            <div className="arc-lane">
              <div className="arc-runner arc-runner-player">
                <TeamAvatar
                  avatarId={playerAvatarId}
                  name={teamName}
                  size={92}
                  resolver={avatarResolver}
                />
                <span>{teamName}</span>
              </div>
            </div>
            <div className="arc-lane">
              <div className="arc-runner arc-runner-rival">
                <TeamAvatar
                  avatarId={rival?.avatarId ?? 'ghost-rockhoppers'}
                  name={rival?.name ?? 'Rivals'}
                  teamId={rival?.id}
                  size={92}
                  resolver={avatarResolver}
                />
                <span>{rival?.name ?? 'Rivals'}</span>
              </div>
            </div>
            <div className="arc-finishline" aria-hidden="true" />
          </div>

          <p className="arc-finale-caption">{finishLines[finishLine]}</p>

          {crossed && (
            <>
              <p className="arc-photofinish-flash">PHOTO FINISH!</p>
              <div className="arc-footer">
                <BigButton onClick={() => setPhase('win')}>Who won?! →</BigButton>
              </div>
            </>
          )}
        </div>
      )}

      {/* ---------------- the win ---------------- */}
      {phase === 'win' && (
        <div className="arc-finale-stage">
          <ConfettiStorm count={120} storm />
          <h1 className="arc-finale-champs">CHAMPIONS!</h1>
          <p className="arc-finale-sub">
            {teamName} — champions of The Amazing Race Canada: Yassa Edition
          </p>
          {finalEntry?.closeCall && <p className="arc-finale-caption">{finalEntry.closeCall}</p>}
          <HostDialogue
            lines={winLines}
            hostName={hostName}
            avatarResolver={avatarResolver}
            onDone={() => setPhase('trophy')}
          />
        </div>
      )}

      {/* ---------------- trophy ---------------- */}
      {phase === 'trophy' && (
        <div className="arc-finale-stage arc-trophy-stage">
          <ConfettiStorm count={120} storm />
          <div className="arc-trophy" aria-label="Trophy" role="img">
            {avatarResolver?.('trophy', { size: 240 }) ?? '🏆'}
          </div>
          <h2 className="arc-trophy-title">{teamName}</h2>
          <p className="arc-trophy-sub">Winners of The Amazing Race Canada: Yassa Edition</p>
          {rivalLine && <p className="arc-finale-quote">{rivalLine}</p>}
          <div className="arc-footer">
            <BigButton onClick={() => setPhase('recap')}>See your season →</BigButton>
          </div>
        </div>
      )}

      {/* ---------------- recap ---------------- */}
      {phase === 'recap' && (
        <div className="arc-finale-recap">
          <header className="arc-recap-head">
            <span className="arc-eyebrow">Season Recap</span>
            <h2 className="arc-recap-title">{teamName}</h2>
            {recapLines[0] && <p className="arc-recap-line">{recapLines[0]}</p>}
          </header>

          <div className="arc-recap-stats">
            <Stat value={seasonStats.totalPoints} label="total points" />
            <Stat
              value={
                seasonStats.challengesTotal
                  ? `${seasonStats.challengesCompleted ?? 0}/${seasonStats.challengesTotal}`
                  : (seasonStats.challengesCompleted ?? 0)
              }
              label="challenges"
            />
            <Stat value={wins} label={wins === 1 ? 'leg won' : 'legs won'} />
            <Stat value={badges.length} label="badges" />
            <Stat value={seasonStats.photosTaken ?? photoItems.length} label="photos" />
          </div>
          <p className="arc-recap-note">
            Your points are your season score — every leg's place came from time on the course.
          </p>

          <section className="arc-recap-section">
            <h3 className="arc-recap-h3">Every leg</h3>
            <ol className="arc-timeline">
              {raceEntries.map((e) => {
                const cut = teamById(teams, e.eliminatedTeamId);
                return (
                  <li
                    key={e.legId}
                    className={`arc-timeline-item${e.yassaPlacement === 1 ? ' arc-timeline-win' : ''}`}
                  >
                    <span className="arc-timeline-leg">Leg {e.legId}</span>
                    <span className="arc-timeline-place">
                      {e.yassaPlacement === 1 ? '🥇 1st' : ordinal(e.yassaPlacement)}
                    </span>
                    <span className="arc-timeline-title">{e.title ?? ''}</span>
                    {cut && <span className="arc-timeline-cut">{cut.name} eliminated</span>}
                  </li>
                );
              })}
            </ol>
          </section>

          <section className="arc-recap-section">
            <h3 className="arc-recap-h3">Badge wall</h3>
            {badges.length ? (
              <div className="arc-badgewall">
                {badges.map((b) => (
                  <BadgeChip
                    key={b}
                    badgeId={b}
                    label={badgeLabels[b]}
                    size={96}
                    resolver={avatarResolver}
                  />
                ))}
              </div>
            ) : (
              <p className="arc-empty">Badges you earn appear here.</p>
            )}
          </section>

          <section className="arc-recap-section">
            <h3 className="arc-recap-h3">Photo reel</h3>
            {photoItems.length ? (
              <div className="arc-photoreel">
                {photoItems.map((p, i) => (
                  <figure className="arc-photo" key={p.key ?? i}>
                    {p.url ? (
                      <img src={p.url} alt={p.caption ?? `Race photo ${i + 1}`} />
                    ) : (
                      <div className="arc-photo-empty">📷</div>
                    )}
                    {p.caption && <figcaption>{p.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            ) : (
              <p className="arc-empty">Photos you took on the road appear here.</p>
            )}
          </section>

          {mapReplay && (
            <section className="arc-recap-section">
              <h3 className="arc-recap-h3">Your route</h3>
              <div className="arc-mapslot">{mapReplay}</div>
            </section>
          )}

          <div className="arc-footer">
            <BigButton onClick={onDone}>Finish 🏁</BigButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="arc-stat">
      <span className="arc-stat-value">{value}</span>
      <span className="arc-stat-label">{label}</span>
    </div>
  );
}
