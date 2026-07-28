/**
 * Asset export map — Workstream E (art & assets).
 *
 * Every value is a build-time URL produced by `new URL(..., import.meta.url)`,
 * which Vite statically rewrites and includes in the bundle (so the PWA service
 * worker precaches them for offline play). Import from here, never by raw path:
 *
 *   import { avatars, badges, ui } from '../../assets';
 *   <img src={avatars['kid-3']} alt="" />
 *
 * Style: bright flat cartoon, chunky #1A1A1A outlines, Amazing Race palette.
 * All artwork is hand-authored SVG with no external font or network dependency.
 */

export const palette = {
  yellow: '#FFC20E',
  red: '#DA291C',
  ink: '#1A1A1A',
  white: '#FFFFFF',
  sky: '#7FD4F5',
  skyPale: '#BFEAFB',
  grass: '#3E8E2E',
  grassPale: '#A8E6A0',
  water: '#4FA3D9',
  paper: '#F6ECD2',
} as const;

/** Six kid racers the player picks from during onboarding. */
export const avatars = {
  'kid-1': new URL('./avatars/kid-1.svg', import.meta.url).href,
  'kid-2': new URL('./avatars/kid-2.svg', import.meta.url).href,
  'kid-3': new URL('./avatars/kid-3.svg', import.meta.url).href,
  'kid-4': new URL('./avatars/kid-4.svg', import.meta.url).href,
  'kid-5': new URL('./avatars/kid-5.svg', import.meta.url).href,
  'kid-6': new URL('./avatars/kid-6.svg', import.meta.url).href,
} as const;
export type AvatarId = keyof typeof avatars;

/** Rival team portraits. Keys match `GhostTeam.id` / `avatarId` in src/types.ts. */
export const ghostAvatars = {
  'maple': new URL('./avatars/ghost-maple.svg', import.meta.url).href,
  'prairie': new URL('./avatars/ghost-prairie.svg', import.meta.url).href,
  'rockhoppers': new URL('./avatars/ghost-rockhoppers.svg', import.meta.url).href,
  'tide': new URL('./avatars/ghost-tide.svg', import.meta.url).href,
} as const;
export type GhostAvatarId = keyof typeof ghostAvatars;

/** Race host, two poses — `idle` for clue/ceremony dialogue, `cheer` for wins. */
export const host = {
  'idle': new URL('./avatars/host.svg', import.meta.url).href,
  'cheer': new URL('./avatars/host-cheer.svg', import.meta.url).href,
} as const;
export type HostPose = keyof typeof host;

/** All badge art. Keys are the canonical badge ids awarded by Workstream D. */
export const badges = {
  'bagel-boss': new URL('./badges/bagel-boss.svg', import.meta.url).href,
  'cannon-blaster': new URL('./badges/cannon-blaster.svg', import.meta.url).href,
  'fearless': new URL('./badges/fearless.svg', import.meta.url).href,
  'first-win': new URL('./badges/first-win.svg', import.meta.url).href,
  'french-speaker': new URL('./badges/french-speaker.svg', import.meta.url).href,
  'goat-whisperer': new URL('./badges/goat-whisperer.svg', import.meta.url).href,
  'maze-runner': new URL('./badges/maze-runner.svg', import.meta.url).href,
  'metro-master': new URL('./badges/metro-master.svg', import.meta.url).href,
  'penguin-pal': new URL('./badges/penguin-pal.svg', import.meta.url).href,
  'photographer': new URL('./badges/photographer.svg', import.meta.url).href,
  'race-champion': new URL('./badges/race-champion.svg', import.meta.url).href,
  'race-rookie': new URL('./badges/race-rookie.svg', import.meta.url).href,
  'road-warrior': new URL('./badges/road-warrior.svg', import.meta.url).href,
  'time-traveler': new URL('./badges/time-traveler.svg', import.meta.url).href,
} as const;
export type BadgeId = keyof typeof badges;

/** Souvenir route map. See MAP_NODE_IDS / MAP_SEGMENT_IDS for the DOM hooks. */
export const map = {
  'route-map': new URL('./map/route-map.svg', import.meta.url).href,
} as const;
export type MapAssetId = keyof typeof map;

/** City stickers earned at each pit stop and dropped onto the route map. */
export const stickers = {
  'brockville': new URL('./map/sticker-brockville.svg', import.meta.url).href,
  'cornwall': new URL('./map/sticker-cornwall.svg', import.meta.url).href,
  'home': new URL('./map/sticker-home.svg', import.meta.url).href,
  'kingston': new URL('./map/sticker-kingston.svg', import.meta.url).href,
  'montreal': new URL('./map/sticker-montreal.svg', import.meta.url).href,
  'quebec': new URL('./map/sticker-quebec.svg', import.meta.url).href,
} as const;
export type StickerId = keyof typeof stickers;

/** UI kit: envelopes, pit-stop mat, rating leaf, confetti, decorations. */
export const ui = {
  'banner': new URL('./ui/banner.svg', import.meta.url).href,
  'checkered-flag': new URL('./ui/checkered-flag.svg', import.meta.url).href,
  'confetti': new URL('./ui/confetti.svg', import.meta.url).href,
  'envelope-closed': new URL('./ui/envelope-closed.svg', import.meta.url).href,
  'envelope-open': new URL('./ui/envelope-open.svg', import.meta.url).href,
  'lock': new URL('./ui/lock.svg', import.meta.url).href,
  'maple-leaf': new URL('./ui/maple-leaf.svg', import.meta.url).href,
  'marker': new URL('./ui/marker.svg', import.meta.url).href,
  'mat': new URL('./ui/mat.svg', import.meta.url).href,
  'starburst': new URL('./ui/starburst.svg', import.meta.url).href,
  'stopwatch': new URL('./ui/stopwatch.svg', import.meta.url).href,
  'stripe-bar': new URL('./ui/stripe-bar.svg', import.meta.url).href,
} as const;
export type UiAssetId = keyof typeof ui;

/** App icons. PNG exports live next to these for the web manifest. */
export const icons = {
  'app-icon-maskable': new URL('./icons/app-icon-maskable.svg', import.meta.url).href,
  'app-icon': new URL('./icons/app-icon.svg', import.meta.url).href,
  'apple-touch-icon': new URL('./icons/apple-touch-icon.png', import.meta.url).href,
  'icon-192': new URL('./icons/icon-192.png', import.meta.url).href,
  'icon-512': new URL('./icons/icon-512.png', import.meta.url).href,
  'icon-512-maskable': new URL('./icons/icon-512-maskable.png', import.meta.url).href,
  'icon-192-maskable': new URL('./icons/icon-192-maskable.png', import.meta.url).href,
} as const;
export type IconAssetId = keyof typeof icons;

/**
 * route-map.svg exposes one `#segment-N` and one `#node-N` per leg (N = 0…8).
 * Add `.locked` to dim, `.done` to turn the road red, `.current` to pulse the
 * node. `#sticker-slot-N` is an empty anchor `<g>` positioned just above each
 * node — drop a city sticker in there when the leg is completed.
 */
export const MAP_NODE_IDS = [
  'node-0',
  'node-1',
  'node-2',
  'node-3',
  'node-4',
  'node-5',
  'node-6',
  'node-7',
  'node-8',
] as const;

export const MAP_SEGMENT_IDS = [
  'segment-0',
  'segment-1',
  'segment-2',
  'segment-3',
  'segment-4',
  'segment-5',
  'segment-6',
  'segment-7',
  'segment-8',
] as const;

/** Which city sticker a leg unlocks (leg id -> sticker key). */
export const STICKER_BY_LEG: Record<number, StickerId> = {
  0: 'home',
  1: 'kingston',
  2: 'montreal',
  3: 'montreal',
  4: 'montreal',
  5: 'quebec',
  6: 'quebec',
  7: 'brockville',
  8: 'home',
};

/** Suggested PWA manifest colours (also in icons/splash-theme.json). */
export const theme = {
  themeColor: '#DA291C',
  backgroundColor: '#FFC20E',
} as const;

const assets = { avatars, ghostAvatars, host, badges, map, stickers, ui, icons };
export default assets;
