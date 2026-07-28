import { avatars as avatarArt } from '../../../assets';

/**
 * Kid-racer avatar set. Ids ('avatar-N') are what the store persists; `art` is
 * Workstream E's SVG from assets/index.ts, with the emoji kept as a fallback.
 */
export interface AvatarDef {
  id: string;
  name: string;
  emoji: string;
  color: string;
  art?: string;
}

export const AVATARS: AvatarDef[] = [
  { id: 'avatar-1', name: 'Maple', emoji: '🫎', color: '#D6212A', art: avatarArt['kid-1'] },
  { id: 'avatar-2', name: 'Dash', emoji: '🦫', color: '#FFD11A', art: avatarArt['kid-2'] },
  { id: 'avatar-3', name: 'Scout', emoji: '🐻', color: '#2FB673', art: avatarArt['kid-3'] },
  { id: 'avatar-4', name: 'Pilot', emoji: '🦆', color: '#2C86D6', art: avatarArt['kid-4'] },
  { id: 'avatar-5', name: 'Blaze', emoji: '🦊', color: '#F5821F', art: avatarArt['kid-5'] },
  { id: 'avatar-6', name: 'Boots', emoji: '🐺', color: '#8A6FE8', art: avatarArt['kid-6'] },
];

export const avatarById = (id: string): AvatarDef => AVATARS.find((a) => a.id === id) ?? AVATARS[0];
