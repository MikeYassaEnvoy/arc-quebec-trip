import { useEffect, useMemo, useRef, useState } from 'react';
import type { MiniGameProps } from '../../types';
import { findStep, loadLeg } from '../../engine/content';
import { useRaceStore } from '../../engine/store';
import { getPhotoUrl } from '../../engine/photos';
import { Confetti } from '../../engine/ui/Confetti';
import './PhotoFinish.css';

/**
 * Photo Finish — the race's final mini-game (registry key `photo-finish`).
 *
 * No content-pack config is needed: the puzzle is built entirely from photos
 * already sitting in the album (src/engine/photos.ts + the race store's
 * `photos: PhotoRecord[]`). See README.md in this folder for the full
 * selection/scoring writeup.
 */

const MAX_SCORE = 25;
const SIMPLE_MODE_MAX_LEGS = 3; // fewer than this many photos -> order-only mode
const DENSE_MODE_MIN = 13; // this many photos or more -> compact tile sizing

interface PoolItem {
  photoId: string; // PhotoRecord.key
  legId: number;
  /** Position of the photo's step within its leg — trip order ground truth. */
  orderKey: number;
  url: string; // object URL, or '' if the blob could not be loaded
  stopName: string;
}

/** A placeable tile. `chipId` is present only in full (photo+stop) mode. */
interface Tile {
  photoId: string;
  chipId?: string;
}

type Phase = 'loading' | 'empty' | 'simple' | 'full';
type Armed = { kind: 'photo' | 'chip' | 'tile'; id: string } | null;

function shuffled<T>(items: T[]): T[] {
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function chipIdFor(photoId: string): string {
  return `chip-${photoId}`;
}

export default function PhotoFinish({ onComplete, onExit }: MiniGameProps) {
  const rawPhotos = useRaceStore((s) => s.photos);

  const [phase, setPhase] = useState<Phase>('loading');
  const [pool, setPool] = useState<PoolItem[]>([]);
  const objectUrls = useRef<string[]>([]);

  // Build the pool: every challenge photo (one per challenge — retake replaces),
  // sorted by real trip order: leg, then the step's position within its leg.
  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (rawPhotos.length === 0) {
        setPhase('empty');
        return;
      }
      // Legacy saves may hold several records per challenge; keep the earliest.
      const byChallenge = new Map<string, (typeof rawPhotos)[number]>();
      for (const p of rawPhotos) {
        const existing = byChallenge.get(p.challengeId);
        if (!existing || new Date(p.at).getTime() < new Date(existing.at).getTime()) {
          byChallenge.set(p.challengeId, p);
        }
      }
      // Load each involved leg once — needed both for the drive-step filter
      // below and for stop names / trip order later.
      const legCache = new Map<number, Awaited<ReturnType<typeof loadLeg>>['leg']>();
      for (const p of byChallenge.values()) {
        if (!legCache.has(p.legId)) {
          legCache.set(p.legId, (await loadLeg(p.legId)).leg);
          if (cancelled) return;
        }
      }

      // Drive-step photos (mini-game screens, in-car shots) make ambiguous
      // puzzle cards and their "stop" is a highway — exclude them BEFORE the
      // per-leg draw so they never displace real stops.
      const stopPhotos = Array.from(byChallenge.values()).filter((p) => {
        const leg = legCache.get(p.legId);
        const step = leg ? findStep(leg, p.stepId) : undefined;
        return step?.kind !== 'drive';
      });

      // Cap at 3 photos per leg, picked at random, so a photo-heavy week
      // doesn't turn the finale into a 30-tile monster.
      const byLeg = new Map<number, (typeof rawPhotos)[number][]>();
      for (const p of stopPhotos) {
        const list = byLeg.get(p.legId) ?? [];
        list.push(p);
        byLeg.set(p.legId, list);
      }
      const chosen = Array.from(byLeg.values()).flatMap((list) =>
        list.length <= 3 ? list : shuffled(list).slice(0, 3),
      );
      if (chosen.length === 0) {
        setPhase('empty');
        return;
      }

      const items: PoolItem[] = [];
      for (const rec of chosen) {
        const leg = legCache.get(rec.legId)!;
        const url = await getPhotoUrl(rec.key);
        if (cancelled) return;
        const stepIndex = leg.steps.findIndex((s) => s.id === rec.stepId);
        const step = findStep(leg, rec.stepId);
        const stopName = step?.location ?? leg.title;
        if (url) objectUrls.current.push(url);
        items.push({
          photoId: rec.key,
          legId: rec.legId,
          orderKey: rec.legId * 100 + (stepIndex === -1 ? 99 : stepIndex),
          url: url ?? '',
          stopName,
        });
      }
      if (cancelled) return;
      items.sort((a, b) => a.orderKey - b.orderKey);
      setPool(items);
      setPhase(items.length < SIMPLE_MODE_MAX_LEGS ? 'simple' : 'full');
    }

    run();
    return () => {
      cancelled = true;
    };
    // rawPhotos only meaningfully changes when the album changes, which does not
    // happen mid-game — intentionally not re-running on every store tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(
    () => () => {
      objectUrls.current.forEach((u) => URL.revokeObjectURL(u));
    },
    [],
  );

  // Stable shuffles, computed once the pool is known.
  const shuffledPhotoIds = useMemo(() => shuffled(pool.map((p) => p.photoId)), [pool]);
  const shuffledChipIds = useMemo(() => shuffled(pool.map((p) => chipIdFor(p.photoId))), [pool]);
  const chipLabel = useMemo(() => {
    const m = new Map<string, string>();
    pool.forEach((p) => m.set(chipIdFor(p.photoId), p.stopName));
    return m;
  }, [pool]);
  const photoById = useMemo(() => new Map(pool.map((p) => [p.photoId, p])), [pool]);

  // Generic tile-placement state, shared by both modes.
  const [tiles, setTiles] = useState<Record<string, Tile>>({});
  const [trayTileIds, setTrayTileIds] = useState<string[]>([]);
  const [placements, setPlacements] = useState<(string | null)[]>([]);
  const [armed, setArmed] = useState<Armed>(null);

  // Full-mode-only raw pools (photos/chips not yet paired).
  const [unpairedPhotoIds, setUnpairedPhotoIds] = useState<string[]>([]);
  const [unpairedChipIds, setUnpairedChipIds] = useState<string[]>([]);

  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const collected = useRef(false);

  // Reset/initialize game state once the mode is known.
  useEffect(() => {
    if (phase === 'full') {
      setUnpairedPhotoIds(shuffledPhotoIds);
      setUnpairedChipIds(shuffledChipIds);
      setTiles({});
      setTrayTileIds([]);
      setPlacements(new Array(pool.length).fill(null));
      setArmed(null);
      setMessage(null);
      setSuccess(false);
    } else if (phase === 'simple') {
      const initTiles: Record<string, Tile> = {};
      shuffledPhotoIds.forEach((id) => {
        initTiles[id] = { photoId: id };
      });
      setTiles(initTiles);
      setTrayTileIds(shuffledPhotoIds);
      setPlacements(new Array(pool.length).fill(null));
      setArmed(null);
      setMessage(null);
      setSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function finish() {
    if (collected.current) return;
    collected.current = true;
    onComplete(MAX_SCORE, MAX_SCORE);
  }

  function tapPhoto(photoId: string) {
    if (armed?.kind === 'photo' && armed.id === photoId) {
      setArmed(null);
      return;
    }
    if (armed?.kind === 'chip') {
      const chipId = armed.id;
      const tileId = `${photoId}__${chipId}`;
      setTiles((t) => ({ ...t, [tileId]: { photoId, chipId } }));
      setUnpairedPhotoIds((ids) => ids.filter((i) => i !== photoId));
      setUnpairedChipIds((ids) => ids.filter((i) => i !== chipId));
      setTrayTileIds((ids) => [...ids, tileId]);
      setArmed(null);
      setMessage(null);
      return;
    }
    setArmed({ kind: 'photo', id: photoId });
  }

  function tapChip(chipId: string) {
    if (armed?.kind === 'chip' && armed.id === chipId) {
      setArmed(null);
      return;
    }
    if (armed?.kind === 'photo') {
      const photoId = armed.id;
      const tileId = `${photoId}__${chipId}`;
      setTiles((t) => ({ ...t, [tileId]: { photoId, chipId } }));
      setUnpairedPhotoIds((ids) => ids.filter((i) => i !== photoId));
      setUnpairedChipIds((ids) => ids.filter((i) => i !== chipId));
      setTrayTileIds((ids) => [...ids, tileId]);
      setArmed(null);
      setMessage(null);
      return;
    }
    setArmed({ kind: 'chip', id: chipId });
  }

  function tapTrayTile(tileId: string) {
    if (armed?.kind === 'tile' && armed.id === tileId) {
      // Re-tap to undo: full-mode pairs split back apart; simple-mode tiles just deselect.
      const tile = tiles[tileId];
      if (tile?.chipId) {
        setTrayTileIds((ids) => ids.filter((i) => i !== tileId));
        setTiles((t) => {
          const next = { ...t };
          delete next[tileId];
          return next;
        });
        setUnpairedPhotoIds((ids) => [...ids, tile.photoId]);
        setUnpairedChipIds((ids) => [...ids, tile.chipId as string]);
      }
      setArmed(null);
      return;
    }
    setArmed({ kind: 'tile', id: tileId });
  }

  function tapSlot(slotIndex: number) {
    if (armed?.kind === 'tile') {
      const tileId = armed.id;
      const prevIdx = placements.indexOf(tileId);
      const evicted = placements[slotIndex];
      const nextPlacements = placements.slice();
      if (prevIdx !== -1) nextPlacements[prevIdx] = null;
      nextPlacements[slotIndex] = tileId;
      let nextTray = trayTileIds.filter((id) => id !== tileId);
      if (evicted && evicted !== tileId) nextTray = [...nextTray, evicted];
      setPlacements(nextPlacements);
      setTrayTileIds(nextTray);
      setArmed(null);
      setMessage(null);
      return;
    }
    const occupied = placements[slotIndex];
    if (occupied) {
      const nextPlacements = placements.slice();
      nextPlacements[slotIndex] = null;
      setPlacements(nextPlacements);
      setTrayTileIds([...trayTileIds, occupied]);
      setMessage(null);
    }
  }

  function handleCheck() {
    let wrong = 0;
    for (let i = 0; i < pool.length; i += 1) {
      const tileId = placements[i];
      if (!tileId) {
        wrong += 1;
        continue;
      }
      const tile = tiles[tileId];
      const placed = tile ? photoById.get(tile.photoId) : undefined;
      // Two photos from the same stop are interchangeable in the order, and any
      // chip bearing the right stop name counts — kids can't tell twins apart.
      const photoOk = placed?.orderKey === pool[i].orderKey;
      const chipOk = tile?.chipId ? chipLabel.get(tile.chipId) === placed?.stopName : true;
      if (!photoOk || !chipOk) wrong += 1;
    }
    if (wrong === 0) {
      setSuccess(true);
      setMessage(null);
    } else {
      setMessage(`${wrong} ${wrong === 1 ? "isn't" : "aren't"} quite right — keep trying!`);
    }
  }

  // ---------------------------------------------------------------- render

  if (phase === 'loading') {
    return (
      <div className="pf-root pf-center">
        <div className="pf-spin" aria-hidden="true">
          📸
        </div>
        <p className="pf-big">Gathering your photos…</p>
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="pf-root pf-center">
        <div className="pf-xl" aria-hidden="true">
          🖼️
        </div>
        <h2 className="pf-title">No photos in the album yet</h2>
        <p className="pf-big">Go snap some memories first, then come back to play!</p>
        <button type="button" className="pf-btn pf-primary" onClick={onExit}>
          Back to the race
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pf-root pf-center">
        <Confetti burst pieces={90} />
        <div className="pf-win-card">
          <div className="pf-win-emoji" aria-hidden="true">
            🏁
          </div>
          <p className="pf-win-text">PHOTO FINISH!</p>
          <p className="pf-big">You matched your whole trip!</p>
          <button type="button" className="pf-btn pf-primary pf-mega" onClick={finish}>
            Collect {MAX_SCORE} points 🏆
          </button>
        </div>
      </div>
    );
  }

  const simple = phase === 'simple';

  return (
    <div className={`pf-root${pool.length >= DENSE_MODE_MIN ? ' pf-dense' : ''}`}>
      <header className="pf-bar">
        <button type="button" className="pf-exit" onClick={onExit} aria-label="Leave Photo Finish">
          ✕
        </button>
        <h2 className="pf-heading">Photo Finish</h2>
        <div className="pf-score">
          <span className="pf-score-num">
            {placements.filter(Boolean).length}/{pool.length}
          </span>
          <span className="pf-score-label">placed</span>
        </div>
      </header>

      <div className="pf-board">
        {simple && (
          <p className="pf-note">Only a few photos so far — just put them in order!</p>
        )}
        {!simple && (
          <p className="pf-note">Tap a photo, then tap its stop to match them.</p>
        )}

        {!simple && (unpairedPhotoIds.length > 0 || unpairedChipIds.length > 0) && (
          <section className="pf-section">
            {unpairedPhotoIds.length > 0 && (
              <div className="pf-photo-grid">
                {unpairedPhotoIds.map((id) => {
                  const item = photoById.get(id);
                  const isArmed = armed?.kind === 'photo' && armed.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`pf-photo-card${isArmed ? ' armed' : ''}`}
                      onClick={() => tapPhoto(id)}
                    >
                      {item?.url ? (
                        <img src={item.url} alt="A memory from the trip" className="pf-photo-img" />
                      ) : (
                        <span className="pf-photo-fallback" aria-hidden="true">
                          📷
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
            {unpairedChipIds.length > 0 && (
              <div className="pf-chip-row">
                {unpairedChipIds.map((id) => {
                  const isArmed = armed?.kind === 'chip' && armed.id === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`pf-chip${isArmed ? ' armed' : ''}`}
                      onClick={() => tapChip(id)}
                    >
                      {chipLabel.get(id)}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {trayTileIds.length > 0 && (
          <section className="pf-section">
            {!simple && <p className="pf-section-label">Matched — tap one, then tap a number below</p>}
            <div className="pf-tray">
              {trayTileIds.map((tileId) => {
                const tile = tiles[tileId];
                const item = tile ? photoById.get(tile.photoId) : undefined;
                const isArmed = armed?.kind === 'tile' && armed.id === tileId;
                return (
                  <button
                    key={tileId}
                    type="button"
                    className={`pf-tray-tile${isArmed ? ' armed' : ''}`}
                    onClick={() => tapTrayTile(tileId)}
                  >
                    {item?.url ? (
                      <img src={item.url} alt="A memory from the trip" className="pf-tray-img" />
                    ) : (
                      <span className="pf-photo-fallback" aria-hidden="true">
                        📷
                      </span>
                    )}
                    {tile?.chipId && <span className="pf-tray-chip">{chipLabel.get(tile.chipId)}</span>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <section className="pf-section pf-slots-section">
          <p className="pf-section-label">Put them in order — 1 is first</p>
          <div className="pf-slots">
            {placements.map((tileId, i) => {
              const tile = tileId ? tiles[tileId] : undefined;
              const item = tile ? photoById.get(tile.photoId) : undefined;
              return (
                <button
                  key={i}
                  type="button"
                  className={`pf-slot${tileId ? ' filled' : ''}`}
                  onClick={() => tapSlot(i)}
                >
                  <span className="pf-slot-num">{i + 1}</span>
                  {item?.url && <img src={item.url} alt="Placed memory" className="pf-slot-img" />}
                  {tile && !item?.url && (
                    <span className="pf-photo-fallback" aria-hidden="true">
                      📷
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="pf-foot">
        {message && (
          <p className="pf-message" role="status">
            {message}
          </p>
        )}
        <button type="button" className="pf-btn pf-primary" onClick={handleCheck}>
          CHECK
        </button>
      </footer>
    </div>
  );
}
