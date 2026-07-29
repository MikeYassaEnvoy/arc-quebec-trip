/**
 * Workstream E — Photo Finish registry fragment.
 *
 * Integration merges this into `src/engine/wiring.ts`, e.g.
 *   import { photoFinishGames } from '../minigames/registry.photofinish';
 *   export const minigameRegistry: MiniGameRegistry = {
 *     ...coreGames,
 *     ...coreGameAliases,
 *     ...arcadeGames,
 *     ...photoFinishGames,
 *   };
 *
 * Registry key matches the `minigameId` used by content/legs/leg-8.json's
 * "The Final Puzzle" step (challenge `l8-finalpuzzle-photofinish`): `photo-finish`.
 */
import type { FC } from 'react';
import type { MiniGameProps } from '../types';
import PhotoFinish from './photofinish/PhotoFinish';

export const photoFinishGames: Record<string, FC<MiniGameProps>> = {
  'photo-finish': PhotoFinish,
};

export { PhotoFinish };
export default photoFinishGames;
