import { useEffect, useRef, useState } from 'react';
import type { PhotoRecord } from '../../types';
import { deletePhoto, getPhotoUrl, makePhotoKey, resizeImageFile, savePhotoBlob } from '../photos';
import { useRaceStore } from '../store';

/**
 * Optional photo capture. Never required to finish a challenge (§1: honor system).
 * Uses the camera directly on iPad Safari and downscales to <=1280px before IndexedDB.
 */
export function PhotoButton({
  legId,
  stepId,
  challengeId,
  prompt,
  onSaved,
}: {
  legId: number;
  stepId: string;
  challengeId: string;
  prompt: string;
  onSaved?: (photo: PhotoRecord) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const addPhoto = useRaceStore((s) => s.addPhoto);
  const removePhoto = useRaceStore((s) => s.removePhoto);
  // NOTE: select the raw array then filter — a selector returning a fresh array each call
  // trips useSyncExternalStore's snapshot check and re-renders forever.
  const allPhotos = useRaceStore((s) => s.photos);
  const photos = allPhotos.filter((p) => p.challengeId === challengeId);
  const hasPhoto = photos.length > 0;

  const handle = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const { blob, width, height } = await resizeImageFile(file);
      const key = makePhotoKey(challengeId);
      await savePhotoBlob(key, blob);
      const record: PhotoRecord = {
        key,
        legId,
        stepId,
        challengeId,
        prompt,
        at: new Date().toISOString(),
        width,
        height,
      };
      // Retake semantics: a new shot replaces this challenge's previous photo(s),
      // in the store and in IndexedDB. Save-then-delete so a failed save keeps the old one.
      const stale = photos.map((p) => p.key);
      addPhoto(record);
      for (const staleKey of stale) {
        removePhoto(staleKey);
        void deletePhoto(staleKey).catch(() => {
          /* orphaned blob — harmless, cleared on full reset */
        });
      }
      onSaved?.(record);
    } catch (e) {
      setError((e as Error).message || 'That photo did not save.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="photobtn">
      <input
        ref={inputRef}
        className="visually-hidden"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => void handle(e.target.files?.[0])}
      />
      <div className="photobtn__row">
        <button className="btn btn--photo btn--huge" disabled={busy} onClick={() => inputRef.current?.click()}>
          📸 {busy ? 'Saving…' : hasPhoto ? 'Retake picture' : prompt}
        </button>
        {photos.map((p) => (
          <PhotoThumb key={p.key} photoKey={p.key} alt={p.prompt} />
        ))}
      </div>
      {!hasPhoto && <span className="muted">Photos are always optional.</span>}
      {error && <span className="bad">{error}</span>}
    </div>
  );
}

export function PhotoThumb({
  photoKey,
  alt,
  className = 'thumb',
}: {
  photoKey: string;
  alt?: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let alive = true;
    void getPhotoUrl(photoKey).then((u) => {
      if (!alive) {
        if (u) URL.revokeObjectURL(u);
        return;
      }
      if (u) {
        revoked = u;
        setUrl(u);
      }
    });
    return () => {
      alive = false;
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [photoKey]);

  if (!url) return <div className={`${className} thumb--empty`} aria-hidden="true" />;
  return <img className={className} src={url} alt={alt ?? 'Race photo'} />;
}
