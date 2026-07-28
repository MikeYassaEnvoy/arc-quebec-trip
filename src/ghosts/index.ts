/**
 * Workstream D — ghosts, ceremonies & finale.
 * Public surface for the engine (src/engine/wiring.ts). See ./README.md.
 */
export { default as MeetTheTeams } from './MeetTheTeams';
export type { MeetTheTeamsProps } from './MeetTheTeams';

export { default as StandingsBoard } from './StandingsBoard';
export type { StandingsBoardProps } from './StandingsBoard';

export { default as PitStopCeremony } from './PitStopCeremony';
export type { PitStopCeremonyProps } from './PitStopCeremony';

export { default as FinaleSequence } from './FinaleSequence';
export type { FinaleSequenceProps } from './FinaleSequence';

/** Engine-shaped adapters — drop straight into src/engine/wiring.ts. */
export {
  ceremonyAdapters,
  DEFAULT_LEG_BADGES,
  setAvatarResolver,
  setPhotoUrlResolver,
  MeetTheTeamsAdapter,
  PitStopCeremonyAdapter,
  FinaleSequenceAdapter,
  StandingsBoardAdapter,
} from './engineAdapter';

export {
  SEASON_SCRIPT_URL,
  buildStandings,
  clearSeasonScriptCache,
  entryForLeg,
  fillTokens,
  loadSeasonScript,
  normalizePhotos,
  normalizeScript,
  ordinal,
  reactionFor,
  statsBand,
  statsLineFor,
  teamById,
} from './script';
export type { StandingRow, StatsBand } from './script';

export { PLAYER_ID } from './types';
export type { SeasonScript as GhostSeasonScript } from './types';
export type {
  AvatarResolver,
  HistoryEntry,
  LegStats,
  PhotoInput,
  PhotoItem,
  ScriptEntry,
  ScriptInput,
  SeasonScript,
  SeasonStats,
  StandingId,
  StatsLines,
  TeamIntro,
  TeamReactions,
} from './types';
