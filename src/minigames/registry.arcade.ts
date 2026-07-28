/**
 * Workstream C2 — arcade mini-game registry fragment.
 *
 * Integration merges this into `src/minigames/registry.ts`, e.g.
 *   export const miniGames = { ...coreGames, ...arcadeGames };
 *
 * Keys match the `minigameId` values used in the content packs
 * (PLAN §4 refers to them as `arcade:canoe-rapids`, `arcade:bagel-catch`).
 */
import type { FC } from 'react';
import type { MiniGameProps } from '../types';
import CanoeRapids from './canoe/CanoeRapids';
import BagelCatch from './bagel/BagelCatch';
import MazeEscape from './maze/MazeEscape';

export const arcadeGames: Record<string, FC<MiniGameProps>> = {
  'canoe-rapids': CanoeRapids,
  'bagel-catch': BagelCatch,
  'maze-escape': MazeEscape,
};

export { CanoeRapids, BagelCatch, MazeEscape };
export default arcadeGames;
