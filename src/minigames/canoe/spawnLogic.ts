/**
 * Pure spawn-clearance helpers for Canoe Rapids.
 *
 * Extracted from CanoeRapids.tsx so the spawn/clearance math can be unit
 * tested outside React/canvas (see the Node harness used during Round 2
 * fixes). Keep this file free of DOM/canvas/React imports.
 *
 * Rule: a maple leaf must never spawn within "safe-clearance" of an existing
 * rock/log, and (symmetrically) a rock/log must never spawn within
 * safe-clearance of an existing leaf — so every leaf that appears on screen
 * is genuinely collectable without forcing a collision.
 *
 * Because leaves and obstacles all scroll down at the same per-frame speed,
 * the (dx, dy) offset between any two spawned items is frozen at spawn time
 * (both x are constant, both y advance by the same `speed * dt` each frame).
 * That means clearance only needs to be checked once, at spawn time, for it
 * to hold for the item's entire lifetime on screen.
 */

export interface SpawnBox {
  x: number;
  y: number;
  halfW: number;
  halfH: number;
}

/** Minimum lateral clearance, expressed as a multiple of the canoe's full width. */
export const LATERAL_CLEARANCE_FACTOR = 1.5;

/** How many seconds of steering time a leaf/obstacle pair must leave the player. */
export const DEFAULT_STEER_SECONDS = 0.5;

export function minLateralClearance(canoeWidth: number): number {
  return LATERAL_CLEARANCE_FACTOR * canoeWidth;
}

/** Vertical gap (px) needed to react and steer clear at the given scroll speed. */
export function minVerticalGapForSpeed(
  speedPxPerSec: number,
  steerSeconds: number = DEFAULT_STEER_SECONDS,
): number {
  return Math.max(0, speedPxPerSec) * steerSeconds;
}

/** Matches the canoe half-width formula used by the live update loop. */
export function canoeHalfWidth(laneW: number): number {
  return Math.min(34, laneW * 0.42);
}

/**
 * True when `candidate` keeps at least the required lateral AND vertical
 * clearance from every box in `existing`. A pair only counts as "too close"
 * (unattainable) when it is close in BOTH dimensions at once — if the two
 * items are far apart laterally (different, well-separated lanes) or far
 * apart vertically (plenty of time to react), the leaf is still reachable.
 */
export function hasClearance(
  candidate: SpawnBox,
  existing: SpawnBox[],
  minLateral: number,
  minVertical: number,
): boolean {
  for (const o of existing) {
    const lateralGap = Math.abs(candidate.x - o.x) - candidate.halfW - o.halfW;
    const verticalGap = Math.abs(candidate.y - o.y) - candidate.halfH - o.halfH;
    if (lateralGap < minLateral && verticalGap < minVertical) return false;
  }
  return true;
}

export interface LaneSpawnParams {
  lanes: number;
  laneW: number;
  rx: number;
  y: number;
  halfW: number;
  halfH: number;
  minLateral: number;
  minVertical: number;
}

/**
 * Returns a lane index (0-based) whose center keeps clearance from every box
 * in `existing`, trying lanes in a shuffled order so spawns don't always
 * prefer the leftmost clear lane. Returns null when every lane is blocked
 * (caller should skip this spawn cycle rather than force a collision).
 */
export function pickClearLane(
  params: LaneSpawnParams,
  existing: SpawnBox[],
  rng: () => number,
): number | null {
  const { lanes, laneW, rx, y, halfW, halfH, minLateral, minVertical } = params;
  const order = shuffleIndices(lanes, rng);
  for (const lane of order) {
    const cx = rx + lane * laneW + laneW / 2;
    const candidate: SpawnBox = { x: cx, y, halfW, halfH };
    if (hasClearance(candidate, existing, minLateral, minVertical)) return lane;
  }
  return null;
}

export function shuffleIndices(n: number, rng: () => number): number[] {
  const arr = Array.from({ length: n }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
