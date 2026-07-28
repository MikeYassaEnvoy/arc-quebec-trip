import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys, createStore } from 'idb-keyval';

/**
 * Photos are captured with <input type="file" accept="image/*" capture="environment">,
 * downscaled to <= MAX_EDGE px on the long edge, and stored as JPEG blobs in IndexedDB.
 * Only lightweight metadata (PhotoRecord) goes into the persisted Zustand/localStorage state.
 */

export const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

const photoStore = createStore('arc-yassa-photos', 'photos');

export interface ResizedPhoto {
  blob: Blob;
  width: number;
  height: number;
}

export async function resizeImageFile(file: File, maxEdge = MAX_EDGE): Promise<ResizedPhoto> {
  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is not available on this device.');
  ctx.drawImage(bitmap as CanvasImageSource, 0, 0, width, height);
  if ('close' in bitmap && typeof bitmap.close === 'function') bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY),
  );
  if (!blob) throw new Error('Could not save that photo.');
  return { blob, width, height };
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Safari occasionally refuses HEIC via createImageBitmap — fall through */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('That image could not be opened.'));
      img.src = url;
    });
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
}

export function makePhotoKey(challengeId: string): string {
  return `photo:${challengeId}:${Date.now()}`;
}

export async function savePhotoBlob(key: string, blob: Blob): Promise<void> {
  await idbSet(key, blob, photoStore);
}

export async function getPhotoBlob(key: string): Promise<Blob | undefined> {
  return idbGet<Blob>(key, photoStore);
}

export async function getPhotoUrl(key: string): Promise<string | undefined> {
  const blob = await getPhotoBlob(key);
  return blob ? URL.createObjectURL(blob) : undefined;
}

export async function deletePhoto(key: string): Promise<void> {
  await idbDel(key, photoStore);
}

export async function clearAllPhotos(): Promise<void> {
  const all = await idbKeys(photoStore);
  await Promise.all(all.map((k) => idbDel(k as IDBValidKey, photoStore)));
}
