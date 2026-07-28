/**
 * Placeholder avatar set. Workstream E ships real SVGs (assets/avatars/*) — at integration
 * these ids stay the same and the `emoji` field gets swapped for an <img src> from
 * assets/index.ts. Nothing else in the engine needs to change.
 */
export interface AvatarDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
}

export const AVATARS: AvatarDef[] = [
  { id: 'avatar-1', name: 'Moose', emoji: '🫎', color: '#D6212A' },
  { id: 'avatar-2', name: 'Beaver', emoji: '🦫', color: '#FFD11A' },
  { id: 'avatar-3', name: 'Bear', emoji: '🐻', color: '#2FB673' },
  { id: 'avatar-4', name: 'Loon', emoji: '🦆', color: '#2C86D6' },
  { id: 'avatar-5', name: 'Fox', emoji: '🦊', color: '#F5821F' },
  { id: 'avatar-6', name: 'Husky', emoji: '🐺', color: '#8A6FE8' },
];

export const avatarById = (id: string): AvatarDef => AVATARS.find((a) => a.id === id) ?? AVATARS[0];
