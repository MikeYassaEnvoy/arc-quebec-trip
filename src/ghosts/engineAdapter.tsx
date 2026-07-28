/**
 * Adapter: engine-shaped ceremony props → this folder's components.
 *
 * Workstream A's `src/engine/ceremonyTypes.ts` defines its own prop shape
 * (`CeremonyContext & CeremonyCallbacks`). Rather than couple to that file, the
 * shapes below are duplicated structurally — `ceremonyAdapters` is assignable to
 * A's `Ceremonies` interface, so integration only needs:
 *
 *   import { ceremonyAdapters } from '../ghosts/engineAdapter';
 *   export const ceremonies: Ceremonies = ceremonyAdapters;
 *
 * (If A's contract drifts, TypeScript reports it right at that assignment.)
 *
 * The adapter loads `season-script.json` itself via `loadSeasonScript()` so the
 * ceremonies always get the full authored entry — the engine's zod schema
 * models only the five §3 fields and strips the rest.
 */
import { useEffect, useState } from 'react';
import type { GhostTeam, LegScriptEntry } from '../types';
import type { AvatarResolver, HistoryEntry, ScriptEntry, SeasonScript } from './types';
import { entryForLeg, loadSeasonScript } from './script';
import { ui as uiArt } from '../../assets';
import MeetTheTeamsView from './MeetTheTeams';
import PitStopCeremonyView from './PitStopCeremony';
import StandingsBoardView from './StandingsBoard';
import FinaleSequenceView from './FinaleSequence';

/* ---------------- engine-shaped props (structural copies) ---------------- */

interface EngineContext {
  legId: number;
  legTitle?: string;
  pitStop?: { hotelName: string; city: string };
  teamName: string;
  avatarId?: string;
  scriptEntry?: LegScriptEntry;
  teams: GhostTeam[];
  teamsRemaining?: number;
  completedChallenges?: { points: number }[];
  skippedChallenges?: unknown[];
  pointsThisLeg: number;
  seasonPoints: number;
  standingsHistory: HistoryEntry[];
}

interface EngineCallbacks {
  onAwardBadge: (badgeId: string) => void;
  onFinish: () => void;
  onExit: () => void;
}

type EnginePhoto = { key: string; prompt?: string; legId?: number };

/* ---------------- integration hooks ---------------- */

let artResolver: AvatarResolver | undefined;
/** Wire Workstream E's SVGs once at integration. */
export function setAvatarResolver(fn: AvatarResolver | undefined): void {
  artResolver = fn;
}

let photoUrlResolver: ((key: string) => string | undefined) | undefined;
/**
 * The engine hands the finale `PhotoRecord[]` (IndexedDB keys, no bytes).
 * Register a key → object-URL lookup to show the real photo reel; without it the
 * reel renders empty frames.
 */
export function setPhotoUrlResolver(fn: ((key: string) => string | undefined) | undefined): void {
  photoUrlResolver = fn;
}

/** Leg → badge id. Override at integration if Workstream E names them differently. */
export const DEFAULT_LEG_BADGES: Record<number, string> = {
  0: 'race-rookie',
  1: 'cannon-blaster',
  2: 'road-warrior',
  3: 'metro-master',
  4: 'bagel-boss',
  5: 'time-traveler',
  6: 'goat-whisperer',
  7: 'maze-runner',
  8: 'race-champion',
};

/* ---------------- shared plumbing ---------------- */

function useScript(): SeasonScript | null {
  const [script, setScript] = useState<SeasonScript | null>(null);
  useEffect(() => {
    let alive = true;
    loadSeasonScript()
      .then((s) => alive && setScript(s))
      .catch(() => alive && setScript({ teams: [], legs: [] }));
    return () => {
      alive = false;
    };
  }, []);
  return script;
}

function resolveEntry(
  script: SeasonScript | null,
  ctx: EngineContext,
): ScriptEntry | undefined {
  const authored = script ? entryForLeg(script, ctx.legId) : undefined;
  if (authored) return authored;
  if (ctx.scriptEntry) {
    return { ...ctx.scriptEntry, teamsRemaining: ctx.teamsRemaining, title: ctx.legTitle };
  }
  return undefined;
}

function rosterOf(script: SeasonScript | null, ctx: EngineContext): GhostTeam[] {
  return script && script.teams.length ? script.teams : ctx.teams;
}

function statsOf(ctx: EngineContext) {
  const done = ctx.completedChallenges?.length ?? 0;
  const skipped = ctx.skippedChallenges?.length ?? 0;
  return {
    pointsEarned: ctx.pointsThisLeg,
    challengesCompleted: done,
    challengesTotal: done + skipped,
  };
}

/* ---------------- adapters ---------------- */

export function MeetTheTeamsAdapter(props: EngineContext & EngineCallbacks) {
  const script = useScript();
  const teams = rosterOf(script, props);
  if (!script) return null;
  return (
    <MeetTheTeamsView
      teams={teams}
      script={script}
      teamName={props.teamName}
      playerAvatarId={props.avatarId ?? 'team-player'}
      avatarResolver={artResolver}
      onDone={() => {
        props.onAwardBadge(DEFAULT_LEG_BADGES[0]);
        props.onFinish();
      }}
    />
  );
}

export function PitStopCeremonyAdapter(props: EngineContext & EngineCallbacks) {
  const script = useScript();
  const entry = resolveEntry(script, props);
  if (!script || !entry) return null;
  const badgeId = DEFAULT_LEG_BADGES[props.legId];
  return (
    <PitStopCeremonyView
      entry={entry}
      teams={rosterOf(script, props)}
      teamName={props.teamName}
      legStats={statsOf(props)}
      badgeId={badgeId}
      history={props.standingsHistory}
      script={script}
      pitStopName={props.pitStop?.hotelName}
      playerAvatarId={props.avatarId ?? 'team-player'}
      avatarResolver={artResolver}
      matArtUrl={uiArt.mat}
      onDone={() => {
        if (badgeId) props.onAwardBadge(badgeId);
        props.onFinish();
      }}
    />
  );
}

export function FinaleSequenceAdapter(
  props: EngineContext & EngineCallbacks & { photos?: EnginePhoto[]; badges?: string[] },
) {
  const script = useScript();
  if (!script) return null;
  const badgeId = DEFAULT_LEG_BADGES[8];
  return (
    <FinaleSequenceView
      teams={rosterOf(script, props)}
      script={script}
      teamName={props.teamName}
      seasonStats={{
        totalPoints: props.seasonPoints,
        challengesCompleted: props.completedChallenges?.length,
        photosTaken: props.photos?.length,
        legsCompleted: props.standingsHistory?.length,
      }}
      badges={props.badges ?? []}
      photos={(props.photos ?? []).map((p) => ({
        key: p.key,
        url: photoUrlResolver?.(p.key),
        caption: p.prompt,
        legId: p.legId,
      }))}
      playerAvatarId={props.avatarId ?? 'team-player'}
      avatarResolver={artResolver}
      onDone={() => {
        if (badgeId) props.onAwardBadge(badgeId);
        props.onFinish();
      }}
    />
  );
}

export function StandingsBoardAdapter(props: {
  legId: number;
  teamName: string;
  avatarId?: string;
  yassaPlacement: number;
  teamsRemaining: number;
  teams: GhostTeam[];
  eliminatedTeamId?: string;
  onDone?: () => void;
}) {
  const script = useScript();
  const authored = script ? entryForLeg(script, props.legId) : undefined;
  const entry: ScriptEntry = authored ?? {
    legId: props.legId,
    yassaPlacement: props.yassaPlacement,
    eliminatedTeamId: props.eliminatedTeamId,
    teamsRemaining: props.teamsRemaining,
    ceremonyLines: [],
  };
  return (
    <StandingsBoardView
      teams={script && script.teams.length ? script.teams : props.teams}
      entry={entry}
      teamName={props.teamName}
      playerAvatarId={props.avatarId ?? 'team-player'}
      avatarResolver={artResolver}
      onSettled={props.onDone}
    />
  );
}

/** Drop-in object for `src/engine/wiring.ts`. */
export const ceremonyAdapters = {
  MeetTheTeams: MeetTheTeamsAdapter,
  PitStopCeremony: PitStopCeremonyAdapter,
  FinaleSequence: FinaleSequenceAdapter,
  StandingsBoard: StandingsBoardAdapter,
};
