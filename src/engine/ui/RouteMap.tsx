import { useEffect, useRef } from 'react';
// Inlined so the CSS state classes (.locked/.done/.current) inside the SVG work.
import routeMapMarkup from '../../../assets/map/route-map.svg?raw';
import { stickers, STICKER_BY_LEG } from '../../../assets';

const SVG_NS = 'http://www.w3.org/2000/svg';
const LEGS = [0, 1, 2, 3, 4, 5, 6, 7, 8];

/**
 * Workstream E's souvenir route map, inlined and driven by race state.
 * Tapping an unlocked node opens that leg. Completed legs drop their city
 * sticker into the map's #sticker-slot-N anchor.
 */
export function RouteMap({
  legsCompleted,
  currentLegId,
  unlockedLegId,
  onSelectLeg,
}: {
  legsCompleted: number[];
  currentLegId: number;
  unlockedLegId: number;
  onSelectLeg: (legId: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef(onSelectLeg);
  selectRef.current = onSelectLeg;

  useEffect(() => {
    const root = hostRef.current;
    if (!root) return;
    const cleanups: (() => void)[] = [];

    for (const id of LEGS) {
      const node = root.querySelector<SVGGElement>(`#node-${id}`);
      const segment = root.querySelector<SVGGElement>(`#segment-${id}`);
      const done = legsCompleted.includes(id);
      const unlocked = id <= unlockedLegId;

      for (const el of [node, segment]) {
        el?.classList.toggle('done', done);
        el?.classList.toggle('locked', !unlocked);
      }
      node?.classList.toggle('current', id === currentLegId);

      if (node) {
        node.style.cursor = unlocked ? 'pointer' : 'default';
        node.setAttribute('role', 'button');
        node.setAttribute('aria-label', `Leg ${id}`);
        if (unlocked) {
          const onTap = () => selectRef.current(id);
          node.addEventListener('click', onTap);
          cleanups.push(() => node.removeEventListener('click', onTap));
        }
      }

      const slot = root.querySelector<SVGGElement>(`#sticker-slot-${id}`);
      if (slot) {
        slot.replaceChildren();
        const stickerUrl = stickers[STICKER_BY_LEG[id]];
        if (done && stickerUrl) {
          const img = document.createElementNS(SVG_NS, 'image');
          img.setAttribute('href', stickerUrl);
          img.setAttribute('x', '-30');
          img.setAttribute('y', '-32');
          img.setAttribute('width', '60');
          img.setAttribute('height', '60');
          slot.appendChild(img);
        }
      }
    }
    return () => cleanups.forEach((fn) => fn());
  }, [legsCompleted, currentLegId, unlockedLegId]);

  return (
    <div
      ref={hostRef}
      className="routemap-art"
      // Workstream E's hand-authored SVG, bundled at build time — not user content.
      dangerouslySetInnerHTML={{ __html: routeMapMarkup }}
    />
  );
}
