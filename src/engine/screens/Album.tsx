import { useEffect, useRef, useState } from 'react';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { PhotoThumb } from '../ui/PhotoButton';
import { LongPressButton } from '../ui/LongPressButton';
import { deletePhoto, getPhotoBlob } from '../photos';

/** leg-3-snap-the-cannon.jpg — readable filenames once photos leave the app. */
function shareFileName(legId: number, prompt: string, key: string): string {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  const suffix = key.slice(-4).replace(/[^a-z0-9]/gi, '');
  return `leg-${legId}-${slug || 'photo'}-${suffix}.jpg`;
}

export function Album() {
  const back = useRouter((s) => s.back);
  const photos = useRaceStore((s) => s.photos);
  const removePhoto = useRaceStore((s) => s.removePhoto);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  // Prefetch every photo as a File up front: navigator.share must run close to
  // the tap (Safari drops the share sheet after slow async work), so the tap
  // handlers below need the bytes already in hand. Read-only — storage untouched.
  const files = useRef<Map<string, File>>(new Map());
  const [filesReady, setFilesReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      for (const p of photos) {
        if (files.current.has(p.key)) continue;
        const blob = await getPhotoBlob(p.key);
        if (!alive) return;
        if (blob) {
          files.current.set(
            p.key,
            new File([blob], shareFileName(p.legId, p.prompt, p.key), {
              type: blob.type || 'image/jpeg',
            }),
          );
        }
      }
      if (alive) setFilesReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [photos]);

  const canShareFiles = (list: File[]): boolean =>
    typeof navigator.share === 'function' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: list });

  const share = async (list: File[]) => {
    if (list.length === 0) return;
    if (!canShareFiles(list)) {
      setShareNote('Sharing is not available in this browser — try on the iPad.');
      return;
    }
    try {
      await navigator.share({ files: list });
      setShareNote(null);
    } catch (e) {
      // AbortError = user closed the sheet; anything else is worth surfacing.
      if ((e as Error).name !== 'AbortError') {
        setShareNote('That share did not work — try fewer photos at once.');
      }
    }
  };

  const open = photos.find((p) => p.key === openKey);

  return (
    <div className="screen album">
      <header className="topbar topbar--sub">
        <button className="btn btn--nav" onClick={back}>
          ← Back
        </button>
        <div>
          <p className="kicker">Souvenirs</p>
          <h1 className="h1">Photo Album</h1>
        </div>
        <div className="topbar__stats">
          <div className="stat">
            <span className="stat__value">{photos.length}</span>
            <span className="stat__label">photos</span>
          </div>
          {photos.length > 0 && (
            <button
              className="btn btn--yellow"
              disabled={!filesReady}
              onClick={() => void share([...files.current.values()])}
            >
              {filesReady ? '⬆︎ Share all' : 'Preparing…'}
            </button>
          )}
        </div>
      </header>

      {shareNote && <p className="bad">{shareNote}</p>}

      {photos.length === 0 ? (
        <p className="empty">No photos yet. Look for the 📸 button on challenges!</p>
      ) : (
        <div className="albumgrid">
          {photos
            .slice()
            .reverse()
            .map((p) => (
              <button key={p.key} className="albumgrid__cell" onClick={() => setOpenKey(p.key)}>
                <PhotoThumb photoKey={p.key} alt={p.prompt} className="albumgrid__img" />
                <span className="albumgrid__cap">
                  Leg {p.legId} · {p.prompt}
                </span>
              </button>
            ))}
        </div>
      )}

      {open && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <PhotoThumb photoKey={open.key} alt={open.prompt} className="lightbox__img" />
          <p className="lightbox__cap">
            Leg {open.legId} · {open.prompt}
          </p>
          <div className="row">
            <button className="btn btn--yellow btn--huge" onClick={() => setOpenKey(null)}>
              Close
            </button>
            <button
              className="btn btn--photo btn--huge"
              disabled={!files.current.has(open.key)}
              onClick={() => {
                const f = files.current.get(open.key);
                if (f) void share([f]);
              }}
            >
              ⬆︎ Share / Save
            </button>
            <LongPressButton
              className="btn btn--ghost btn--huge"
              hint="Hold to delete"
              onConfirm={() => {
                void deletePhoto(open.key);
                removePhoto(open.key);
                files.current.delete(open.key);
                setOpenKey(null);
              }}
            >
              Delete photo
            </LongPressButton>
          </div>
        </div>
      )}
    </div>
  );
}
