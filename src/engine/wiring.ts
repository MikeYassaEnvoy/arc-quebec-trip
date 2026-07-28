import type React from 'react';
import type { MiniGameProps } from '../types';
import type { Ceremonies } from './ceremonyTypes';
import StubMiniGame from './stubs/StubMiniGame';
import { coreGames, coreGameAliases } from '../minigames/registry.core';
import { arcadeGames } from '../minigames/registry.arcade';
import { ceremonyAdapters } from '../ghosts/engineAdapter';

/**
 * ============================================================================
 * SINGLE INTEGRATION POINT
 * ============================================================================
 * This is the only file integration has to edit to swap the placeholders for the
 * real modules. Nothing else in src/engine imports the mini-games or ceremonies.
 *
 * Mini-games (Workstreams C1/C2) — replace with:
 *   import { registry } from '../minigames/registry';
 *   export const minigameRegistry: MiniGameRegistry = registry;
 * Every entry must be a React component taking §3 `MiniGameProps`:
 *   { config?: unknown; onComplete: (score: number, maxScore: number) => void; onExit: () => void }
 *
 * Ceremonies (Workstream D) — replace with:
 *   import { MeetTheTeams, PitStopCeremony, FinaleSequence, StandingsBoard } from '../ghosts';
 *   export const ceremonies: Ceremonies = { MeetTheTeams, PitStopCeremony, FinaleSequence, StandingsBoard };
 * Prop shapes live in ./ceremonyTypes.ts (re-exported below).
 * ============================================================================
 */

export type MiniGameComponent = React.ComponentType<MiniGameProps>;
export type MiniGameRegistry = Record<string, MiniGameComponent>;

/** Registry keys may be the full content id ('trivia:leg-1') or a bare family/game id ('trivia'). */
export const minigameRegistry: MiniGameRegistry = {
  ...coreGames,
  ...coreGameAliases,
  ...arcadeGames,
};

export const ceremonies: Ceremonies = ceremonyAdapters;

/** Fallback rendered when a content minigameId has no registry entry. */
export const fallbackMiniGame: MiniGameComponent = StubMiniGame;

/**
 * Resolution order for a content id like 'road-bingo:401-east':
 *   1. exact key                       'road-bingo:401-east'
 *   2. family (before the colon)       'road-bingo'
 *   3. variant (after the colon)       '401-east'
 *   4. fallbackMiniGame (stub)
 */
export function resolveMiniGame(minigameId: string): { Component: MiniGameComponent; isStub: boolean } {
  const exact = minigameRegistry[minigameId];
  if (exact) return { Component: exact, isStub: false };

  const idx = minigameId.indexOf(':');
  if (idx !== -1) {
    const family = minigameId.slice(0, idx);
    const variant = minigameId.slice(idx + 1);
    const byFamily = minigameRegistry[family];
    if (byFamily) return { Component: byFamily, isStub: false };
    const byVariant = minigameRegistry[variant];
    if (byVariant) return { Component: byVariant, isStub: false };
  }
  return { Component: fallbackMiniGame, isStub: true };
}

export type {
  Ceremonies,
  CeremonyContext,
  CeremonyCallbacks,
  CompletedChallengeSummary,
  MeetTheTeamsProps,
  PitStopCeremonyProps,
  FinaleSequenceProps,
  StandingsBoardProps,
} from './ceremonyTypes';
