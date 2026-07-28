/**
 * Season-script loading + the small pure helpers every ceremony component uses.
 * No React in here so it can be unit-tested / used by the engine directly.
 */
import type { GhostTeam } from '../types';
import type {
  LegStats,
  PhotoInput,
  PhotoItem,
  ScriptEntry,
  ScriptInput,
  SeasonScript,
  StandingId,
  TeamReactions,
} from './types';
import { PLAYER_ID } from './types';

/** Respects Vite's base path so it works on GitHub Pages sub-paths too. */
export const SEASON_SCRIPT_URL = `${
  (import.meta.env?.BASE_URL ?? '/').replace(/\/?$/, '/')
}content/ghosts/season-script.json`;

let cached: SeasonScript | null = null;

/**
 * Fetch + shape-check `/content/ghosts/season-script.json`.
 * Result is cached for the session (the file is precached by the service worker,
 * so this works offline after install). Throws on a missing/!ok/malformed file.
 */
export async function loadSeasonScript(
  url: string = SEASON_SCRIPT_URL,
): Promise<SeasonScript> {
  if (cached) return cached;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`season-script.json failed to load (${res.status})`);
  }
  const raw: unknown = await res.json();
  cached = assertSeasonScript(raw);
  return cached;
}

/** Drop the module cache (dev/parent-menu reset). */
export function clearSeasonScriptCache(): void {
  cached = null;
}

function assertSeasonScript(raw: unknown): SeasonScript {
  const data = raw as Partial<SeasonScript> | null;
  if (!data || typeof data !== 'object') {
    throw new Error('season-script.json: not an object');
  }
  if (!Array.isArray(data.teams) || data.teams.length === 0) {
    throw new Error('season-script.json: missing teams[]');
  }
  const legs = data.legs ?? data.entries;
  if (!Array.isArray(legs) || legs.length === 0) {
    throw new Error('season-script.json: missing legs[]');
  }
  for (const t of data.teams as GhostTeam[]) {
    if (!t.id || !t.name || !Array.isArray(t.members) || t.members.length !== 2) {
      throw new Error(`season-script.json: bad team "${String(t?.id)}"`);
    }
  }
  for (const e of legs as ScriptEntry[]) {
    if (typeof e.legId !== 'number' || typeof e.yassaPlacement !== 'number') {
      throw new Error(`season-script.json: bad entry "${String(e?.legId)}"`);
    }
    if (!Array.isArray(e.ceremonyLines)) {
      throw new Error(`season-script.json: entry ${e.legId} has no ceremonyLines`);
    }
  }
  return { ...(data as SeasonScript), legs: legs as ScriptEntry[] };
}

/**
 * Accept the whole script object (`{ teams, legs }`, the shape of
 * `SeasonScript` in ../types) or a bare array of leg entries.
 */
export function normalizeScript(input: ScriptInput): {
  entries: ScriptEntry[];
  teams: GhostTeam[];
  reactions: Record<string, TeamReactions>;
} {
  if (Array.isArray(input)) {
    return { entries: input as ScriptEntry[], teams: [], reactions: {} };
  }
  const obj = input as SeasonScript;
  return {
    entries: (obj.legs ?? obj.entries ?? []) as ScriptEntry[],
    teams: obj.teams ?? [],
    reactions: obj.reactions ?? {},
  };
}

export function entryForLeg(input: ScriptInput, legId: number): ScriptEntry | undefined {
  return normalizeScript(input).entries.find((e) => e.legId === legId);
}

/**
 * Replace the script's tokens.
 *   {team} player's team name · {points} · {done} · {total}
 */
export function fillTokens(
  line: string,
  teamName: string,
  stats?: Partial<LegStats>,
): string {
  return line
    .replace(/\{team\}/g, teamName)
    .replace(/\{points\}/g, String(stats?.pointsEarned ?? 0))
    .replace(/\{done\}/g, String(stats?.challengesCompleted ?? 0))
    .replace(/\{total\}/g, String(stats?.challengesTotal ?? 0));
}

/** Completion band used to pick which `statsLines` variant the host says. */
export type StatsBand = 'heavy' | 'mid' | 'light';

export function statsBand(stats: LegStats | undefined): StatsBand {
  if (!stats || !stats.challengesTotal) return 'mid';
  const ratio = stats.challengesCompleted / stats.challengesTotal;
  if (ratio >= 0.8) return 'heavy';
  if (ratio >= 0.4) return 'mid';
  return 'light';
}

/**
 * The one host line that reacts to what the player actually did. Uses the
 * leg's authored `statsLines` when present, otherwise a safe generic.
 */
export function statsLineFor(entry: ScriptEntry, stats: LegStats, teamName: string): string {
  const band = statsBand(stats);
  const authored = entry.statsLines?.[band];
  const fallback: Record<StatsBand, string> = {
    heavy:
      'You finished {done} of {total} challenges and banked {points} points. Nothing could slow you down today!',
    mid: 'You banked {points} points and finished {done} challenges. Good racing out there.',
    light:
      'You picked up {points} points today. The other teams were close behind you the whole way!',
  };
  return fillTokens(authored ?? fallback[band], teamName, stats);
}

export interface StandingRow {
  id: StandingId;
  place: number;
  name: string;
  members: string;
  avatarId: string;
  isPlayer: boolean;
  /** Eliminated at THIS pit stop. */
  eliminatedNow: boolean;
  /** Already gone before this pit stop. */
  eliminatedEarlier: boolean;
}

/**
 * Build the ranked rows for a leg, straight from the script's `order`.
 * Placements are never computed from gameplay.
 */
export function buildStandings(
  entry: ScriptEntry,
  teams: GhostTeam[],
  teamName: string,
  history: { legId: number; eliminatedTeamId?: string }[] = [],
  playerAvatarId = 'team-player',
): StandingRow[] {
  const goneBefore = new Set(
    history
      .filter((h) => h.legId < entry.legId && h.eliminatedTeamId)
      .map((h) => h.eliminatedTeamId as string),
  );

  let order = entry.order && entry.order.length ? [...entry.order] : null;
  if (!order) {
    // No authored order (bare LegScriptEntry): derive a sensible one that still
    // honours the scripted placement.
    const alive = teams.filter((t) => !goneBefore.has(t.id)).map((t) => t.id);
    order = [...alive];
    const place = Math.min(Math.max(entry.yassaPlacement, 1), alive.length + 1);
    order.splice(place - 1, 0, PLAYER_ID);
    if (entry.eliminatedTeamId) {
      const i = order.indexOf(entry.eliminatedTeamId);
      if (i >= 0) order.push(...order.splice(i, 1));
    }
  }

  return order.map((id, i) => {
    const isPlayer = id === PLAYER_ID;
    const team = teams.find((t) => t.id === id);
    return {
      id,
      place: i + 1,
      name: isPlayer ? teamName : (team?.name ?? id),
      members: isPlayer ? 'You' : (team?.members?.join(' & ') ?? ''),
      avatarId: isPlayer ? playerAvatarId : (team?.avatarId ?? `ghost-${id}`),
      isPlayer,
      eliminatedNow: !isPlayer && id === entry.eliminatedTeamId,
      eliminatedEarlier: !isPlayer && goneBefore.has(id),
    };
  });
}

export function teamById(teams: GhostTeam[], id: string | undefined): GhostTeam | undefined {
  return id ? teams.find((t) => t.id === id) : undefined;
}

export function reactionFor(
  reactions: Record<string, TeamReactions>,
  teamId: string,
  kind: keyof TeamReactions,
): string | undefined {
  return reactions[teamId]?.[kind];
}

export function normalizePhotos(photos: PhotoInput[] | undefined): PhotoItem[] {
  if (!photos) return [];
  return photos.map((p, i) =>
    typeof p === 'string' ? { key: `photo-${i}`, url: p } : { key: `photo-${i}`, ...p },
  );
}

/** Human label for a placement: 1st, 2nd, 3rd… */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`;
}
