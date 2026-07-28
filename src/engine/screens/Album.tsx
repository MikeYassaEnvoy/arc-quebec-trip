import { useState } from 'react';
import { useRouter } from '../router';
import { useRaceStore } from '../store';
import { PhotoThumb } from '../ui/PhotoButton';
import { LongPressButton } from '../ui/LongPressButton';
import { deletePhoto } from '../photos';

export function Album() {
  const back = useRouter((s) => s.back);
  const photos = useRaceStore((s) => s.photos);
  const removePhoto = useRaceStore((s) => s.removePhoto);
  const [openKey, setOpenKey] = useState<string | null>(null);

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
        </div>
      </header>

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
            <LongPressButton
              className="btn btn--ghost btn--huge"
              hint="Hold to delete"
              onConfirm={() => {
                void deletePhoto(open.key);
                removePhoto(open.key);
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
