import type { FC } from 'react';
import type { MiniGameProps } from '../types';
import TriviaRunner from './trivia/TriviaRunner';
import FrenchPhraseGame from './french/FrenchPhraseGame';
import RoadBingo from './bingo/RoadBingo';
import MetroNavigator from './metro/MetroNavigator';

/**
 * Core (non-arcade) mini-games — Workstream C1.
 *
 * The app-wide registry (`src/minigames/registry.ts`, owned by integration)
 * should spread these in alongside the arcade games from Workstream C2:
 *
 *   export const games = { ...coreGames, ...arcadeGames };
 *
 * Config shapes:
 *   trivia          -> { deck: string, count?: number, shuffle?: boolean }
 *   french-phrases  -> { pack: string }
 *   road-bingo      -> { card: string }
 *   metro-navigator -> { from?: string, to?: string }
 */
export const coreGames: Record<string, FC<MiniGameProps>> = {
  trivia: TriviaRunner,
  'french-phrases': FrenchPhraseGame,
  'road-bingo': RoadBingo,
  'metro-navigator': MetroNavigator,
};

/**
 * Convenience aliases for the *family* prefixes actually used by the content packs
 * (`trivia:leg-1`, `french:starter-pack`, `road-bingo:401-east`, `minigame:metro-navigator`).
 * `src/engine/wiring.ts` resolves a content id by family first, so integration should do:
 *
 *   export const registry = { ...coreGames, ...coreGameAliases, ...arcadeGames };
 *
 * Note `french` (content) vs `french-phrases` (required registry key) — the alias bridges it.
 */
export const coreGameAliases: Record<string, FC<MiniGameProps>> = {
  french: FrenchPhraseGame,
  bingo: RoadBingo,
  'road-bingo-card': RoadBingo,
  metro: MetroNavigator,
};

export { TriviaRunner, FrenchPhraseGame, RoadBingo, MetroNavigator };
export default coreGames;
