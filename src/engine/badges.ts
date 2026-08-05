/**
 * Placeholder badge catalogue (§6). Workstream E draws the real art and Workstream D
 * awards leg badges from the ceremony via `onAwardBadge`. The engine only awards the
 * defaults below when nothing else does, so the Badges screen is never empty.
 */
export interface BadgeDef {
  id: string;
  name: string;
  emoji: string;
  how: string;
}

export const BADGES: BadgeDef[] = [
  { id: 'race-rookie', name: 'Race Rookie', emoji: '🎒', how: 'Finish the practice leg' },
  { id: 'cannon-blaster', name: 'Cannon Blaster', emoji: '💥', how: 'Conquer Fort Henry' },
  { id: 'road-warrior', name: 'Road Warrior', emoji: '🛣️', how: 'Survive the long drive to Montréal' },
  { id: 'metro-master', name: 'Metro Master', emoji: '🚇', how: 'Navigate the Montréal metro' },
  { id: 'bagel-boss', name: 'Bagel Boss', emoji: '🥯', how: 'Win the bagel detour' },
  { id: 'penguin-pal', name: 'Penguin Pal', emoji: '🐧', how: 'Find every Biodôme animal' },
  { id: 'time-traveler', name: 'Time Traveler', emoji: '⏳', how: 'Visit New France' },
  { id: 'goat-whisperer', name: 'Goat Whisperer', emoji: '🐐', how: 'Meet Batisse at the Citadelle' },
  { id: 'maze-runner', name: 'Maze Runner', emoji: '🌀', how: 'Escape the great maze' },
  { id: 'dino-tamer', name: 'Dino Tamer', emoji: '🦖', how: 'Count every Madrid 2.0 dinosaur' },
  { id: 'race-champion', name: 'Race Champion', emoji: '🏆', how: 'Win the whole race' },
  { id: 'first-win', name: 'First Win', emoji: '🥇', how: 'Finish a leg in first place' },
  { id: 'french-speaker', name: 'French Speaker', emoji: '🇫🇷', how: 'Complete a French phrase challenge' },
  { id: 'photographer', name: 'Photographer', emoji: '📸', how: 'Take 10 race photos' },
  { id: 'fearless', name: 'Fearless', emoji: '🐙', how: 'Touch the touch tank' },
];

export const badgeById = (id: string): BadgeDef =>
  BADGES.find((b) => b.id === id) ?? { id, name: id, emoji: '🏅', how: '' };

/** Leg badges awarded by the engine if the ceremony does not award its own.
 * A leg may earn several (e.g. leg 4: the SOS maze AND the bagel detour). */
export const DEFAULT_LEG_BADGE: Record<number, string[]> = {
  0: ['race-rookie'],
  1: ['cannon-blaster'],
  2: ['road-warrior', 'penguin-pal'],
  3: ['metro-master'],
  4: ['maze-runner', 'bagel-boss'],
  5: ['time-traveler'],
  6: ['goat-whisperer'],
  7: ['dino-tamer', 'maze-runner'],
  8: ['race-champion'],
};
