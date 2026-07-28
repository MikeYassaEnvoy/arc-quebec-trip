import type React from 'react';
import type { Challenge, GhostTeam, LegResult, LegScriptEntry, PhotoRecord } from '../types';

/**
 * Props the engine hands to Workstream D's ceremony components.
 * The engine builds these from real store state, so ceremony dialogue can reference
 * what Yassa actually did on the leg (§5: "ceremony flavor lines should reference
 * what he actually did").
 */

export interface CompletedChallengeSummary {
  challenge: Challenge;
  stepId: string;
  stepLocation: string;
  points: number;
  at: string;
  photoKey?: string;
}

export interface CeremonyContext {
  legId: number;
  legTitle: string;
  legRouteText: string;
  pitStop: { hotelName: string; city: string };
  teamName: string;
  avatarId: string;

  /** From content/ghosts/season-script.json — undefined if the script has no entry for this leg. */
  scriptEntry?: LegScriptEntry;
  /** Ghost roster from the same file, minus teams eliminated on earlier legs (may be empty). */
  teams: GhostTeam[];
  /** Teams still in the race including Team Yassa. */
  teamsRemaining: number;

  /** What actually happened this leg. */
  completedChallenges: CompletedChallengeSummary[];
  skippedChallenges: Challenge[];
  pointsThisLeg: number;
  seasonPoints: number;
  standingsHistory: LegResult[];

  isPracticeLeg: boolean; // leg 0
  isFinalLeg: boolean; // leg 8
}

export interface CeremonyCallbacks {
  /** Award a badge (idempotent). */
  onAwardBadge: (badgeId: string) => void;
  /** Optional: override the LegResult the engine would otherwise derive from scriptEntry. */
  onRecordResult?: (result: LegResult) => void;
  /** Ceremony finished → engine banks the result, unlocks the next leg, returns to HQ. */
  onFinish: () => void;
  /** Bail out without finishing the leg (back button / parent escape hatch). */
  onExit: () => void;
}

export type MeetTheTeamsProps = CeremonyContext & CeremonyCallbacks;
export type PitStopCeremonyProps = CeremonyContext & CeremonyCallbacks;
export type FinaleSequenceProps = CeremonyContext &
  CeremonyCallbacks & {
    photos: PhotoRecord[];
    badges: string[];
  };

export interface StandingsBoardProps {
  legId: number;
  teamName: string;
  avatarId: string;
  yassaPlacement: number;
  teamsRemaining: number;
  teams: GhostTeam[];
  eliminatedTeamId?: string;
  /** Fired when the reveal animation has finished (optional). */
  onDone?: () => void;
}

export interface Ceremonies {
  MeetTheTeams: React.ComponentType<MeetTheTeamsProps>;
  PitStopCeremony: React.ComponentType<PitStopCeremonyProps>;
  FinaleSequence: React.ComponentType<FinaleSequenceProps>;
  StandingsBoard: React.ComponentType<StandingsBoardProps>;
}
