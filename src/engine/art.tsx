/**
 * Integration glue between the engine and Workstream E's art pack.
 *
 * Everything imports art ONLY via assets/index.ts (so Vite fingerprints the
 * files and the service worker precaches them). This module also feeds art to
 * Workstream D's ceremonies (setAvatarResolver) and resolves finale photo keys
 * to IndexedDB object URLs (setPhotoUrlResolver).
 */
import { avatars, ghostAvatars, host, badges } from '../../assets';
import { setAvatarResolver, setPhotoUrlResolver } from '../ghosts/engineAdapter';
import { getPhotoUrl } from './photos';

/** Engine avatar ids ('avatar-1'…) → Workstream E kid art ('kid-1'…). */
export function kidAvatarArt(avatarId: string): string | undefined {
  const kidKey = avatarId.replace(/^avatar-/, 'kid-') as keyof typeof avatars;
  return avatars[kidKey];
}

export function badgeArt(badgeId: string): string | undefined {
  return badges[badgeId as keyof typeof badges];
}

/**
 * Art lookup for the ceremony components. Ids requested by src/ghosts:
 * 'ghost-maple' | 'ghost-rockhoppers' | 'ghost-prairie' | 'ghost-tide',
 * the player's avatar id ('avatar-N', default 'team-player'), 'host',
 * 'trophy', and each badge id.
 */
function ceremonyArtUrl(id: string): string | undefined {
  if (id.startsWith('ghost-')) {
    return ghostAvatars[id.replace(/^ghost-/, '') as keyof typeof ghostAvatars];
  }
  if (id.startsWith('avatar-') || id.startsWith('kid-')) return kidAvatarArt(id);
  if (id === 'team-player') return avatars['kid-1'];
  if (id === 'host') return host.idle;
  if (id === 'trophy') return undefined; // emoji 🏆 placeholder reads best
  return badgeArt(id);
}

/* ---------------- finale photo reel ---------------- */

const photoUrlCache = new Map<string, string>();

/** Resolve IndexedDB photo blobs to object URLs ahead of the finale reel. */
export async function primePhotoUrls(keys: string[]): Promise<void> {
  await Promise.all(
    keys
      .filter((k) => !photoUrlCache.has(k))
      .map(async (k) => {
        try {
          const url = await getPhotoUrl(k);
          if (url) photoUrlCache.set(k, url);
        } catch {
          /* a missing photo just renders as an empty frame */
        }
      }),
  );
}

/** Call once at startup (main.tsx). */
export function wireCeremonyArt(): void {
  setAvatarResolver((id, { size }) => {
    const url = ceremonyArtUrl(id);
    if (!url) return null;
    return (
      <img
        src={url}
        width={size}
        height={size}
        alt=""
        draggable={false}
        style={{ width: size, height: size, objectFit: 'contain', display: 'block' }}
      />
    );
  });
  setPhotoUrlResolver((key) => photoUrlCache.get(key));
}
