/**
 * Workstream D — ghost/ceremony types.
 *
 * The §3 frozen contracts (`GhostTeam`, `LegScriptEntry`) live in `src/types.ts`
 * and are NOT redefined here. Everything below is a strict *superset* used by the
 * ceremony UI: `ScriptEntry extends LegScriptEntry`, so anything typed as a
 * `LegScriptEntry` can be passed straight into these components.
 */
import type { ReactNode } from 'react';
import type { GhostTeam, LegScriptEntry } from '../types';

/** Token used in `order` / eliminations to mean "the player's team". */
export const PLAYER_ID = 'yassa';

/** Placement-order token: a ghost team id, or PLAYER_ID for the player. */
export type StandingId = string;

export interface TeamIntro {
  teamId: string;
  /** One drama tease shown in the Leg 0 Meet the Teams ceremony. */
  tease: string;
}

/** Leg-specific host lines chosen by how much of the leg the player completed. */
export interface StatsLines {
  /** ≥ 80% of challenges completed. */
  heavy: string;
  /** 40–79%. */
  mid: string;
  /** < 40%. */
  light: string;
}

/**
 * Superset of the frozen `LegScriptEntry`. Extra fields are all optional so a
 * bare `LegScriptEntry` still type-checks as a `ScriptEntry`.
 */
export interface ScriptEntry extends LegScriptEntry {
  /**
   * Leg 0 only: this is the "Meet the Teams" intro — `yassaPlacement` is
   * meaningless (it is 1 purely to satisfy the engine's zod `min(1)`) and no
   * component reads it.
   */
  isIntro?: boolean;
  /** Number of teams (including the player) still racing at this pit stop. */
  teamsRemaining?: number;
  /**
   * Full ranked finishing order for the leg, ids top-to-bottom, using
   * PLAYER_ID for the player. Empty for Leg 0. Always agrees with
   * `yassaPlacement`; the board renders from this, never from computed results.
   */
  order?: StandingId[];
  title?: string;
  /** Leg 0 only: rival introductions. */
  intros?: TeamIntro[];
  /** Leg 0 only: "the race starts now" beat. */
  outroLines?: string[];
  /** Host lines for the elimination sequence (last line is the farewell). */
  eliminationLines?: string[];
  /** Picked by completion ratio and woven into the host's dialogue. */
  statsLines?: StatsLines;
  /** Shown on the closing card of the ceremony. */
  nextLegTease?: string;
  /** Leg 8 only: photo-finish call. */
  photoFinishLines?: string[];
  /** Leg 8 only: lines that open the season recap. */
  recapLines?: string[];
}

export interface TeamReactions {
  /** Said by the team as it is eliminated. */
  farewell: string;
  /** Said by a surviving team when someone else goes home. */
  onOtherElimination: string;
  /** Said at the finale (from the mat or from the sidelines). */
  finale: string;
}

/**
 * Structurally compatible with `SeasonScript` in ../types (`{ teams, legs }`),
 * just with the richer entry type and the extra authored fields.
 */
export interface SeasonScript {
  version?: number;
  playerTeamId?: string;
  hostName?: string;
  teams: GhostTeam[];
  legs: ScriptEntry[];
  /** Accepted alias for `legs` (older drafts). */
  entries?: ScriptEntry[];
  reactions?: Record<string, TeamReactions>;
}

/** Components accept either the whole script object or just its leg entries. */
export type ScriptInput =
  | SeasonScript
  | { teams?: GhostTeam[]; legs: LegScriptEntry[] }
  | ScriptEntry[]
  | LegScriptEntry[];

/** What the player actually did on this leg — drives responsive host lines. */
export interface LegStats {
  pointsEarned: number;
  challengesCompleted: number;
  challengesTotal: number;
}

export interface SeasonStats {
  totalPoints: number;
  challengesCompleted?: number;
  challengesTotal?: number;
  legsCompleted?: number;
  photosTaken?: number;
  milesDriven?: number;
}

/** A photo for the finale reel. Plain strings (data/object URLs) also work. */
export interface PhotoItem {
  key?: string;
  /** data: or object URL. When absent the slot renders as a placeholder frame. */
  url?: string;
  caption?: string;
  legId?: number;
}

export type PhotoInput = string | PhotoItem;

/**
 * Optional art hook. Workstream E's SVGs get wired in at integration by passing
 * a resolver; until then every avatar falls back to an emoji/initials chip.
 * Return `null`/`undefined` for any id you do not have art for.
 */
export type AvatarResolver = (
  avatarId: string,
  ctx: { size: number; teamId?: string },
) => ReactNode;

/** Minimum shape needed from the store's standings history. */
export interface HistoryEntry {
  legId: number;
  yassaPlacement: number;
  eliminatedTeamId?: string;
}
