const { write, svgDoc, OUT, YELLOW, RED, WHITE } = require('./lib.cjs');
const { icons, starPath } = require('./gen-badges.cjs');

const S = (w = 4) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const FONT = `font-family="Helvetica Neue, Helvetica, Arial, sans-serif"`;

/* ============================ ROUTE MAP ============================ *
 * 900 x 520. Every leg has  #segment-N  (the dashed road drawn INTO
 * node N) and  #node-N  (the city dot). Both carry class="segment" /
 * class="node" so the app can add .locked / .done / .current.
 * #sticker-slot-N is an empty anchor group for dropping a city sticker.
 * ================================================================== */

const NODES = [
  { i: 0, x: 110, y: 374, label: 'HOME · AJAX', lx: 110, ly: 416, anchor: 'middle' },
  { i: 1, x: 300, y: 344, label: 'KINGSTON', lx: 300, ly: 386, anchor: 'middle' },
  { i: 2, x: 598, y: 254, label: '', lx: 0, ly: 0 },
  { i: 3, x: 652, y: 240, label: 'MONTRÉAL', lx: 640, ly: 300, anchor: 'middle' },
  { i: 4, x: 628, y: 196, label: '', lx: 0, ly: 0 },
  { i: 5, x: 784, y: 192, label: '', lx: 0, ly: 0 },
  { i: 6, x: 832, y: 160, label: 'QUÉBEC CITY', lx: 798, ly: 118, anchor: 'middle' },
  { i: 7, x: 400, y: 262, label: 'BROCKVILLE', lx: 396, ly: 228, anchor: 'middle' },
  { i: 8, x: 176, y: 318, label: 'FINISH', lx: 176, ly: 278, anchor: 'middle' },
];

const SEGMENTS = [
  // 0 — the backyard practice lap, a little loop around home
  'M110 374C58 386 30 356 46 332 62 310 100 334 110 374',
  // 1 — Ajax to Kingston along the lake shore
  'M110 374C162 392 228 376 300 344',
  // 2 — Kingston to Montreal via Cornwall
  'M300 344C368 330 400 316 455 300C520 282 552 268 598 254',
  // 3 — around Old Montreal
  'M598 254C616 274 642 268 652 240',
  // 4 — Mile End and Olympic Park
  'M652 240C666 218 652 194 628 196',
  // 5 — Montreal to Quebec City via Trois-Rivieres
  'M628 196C664 214 704 218 742 206C760 200 772 194 784 192',
  // 6 — around the walled city
  'M784 192C794 170 814 154 832 160',
  // 7 — the long haul home to Brockville
  'M832 160C702 108 560 138 480 190C446 212 420 238 400 262',
  // 8 — Brockville to Ajax, FINISH
  'M400 262C334 244 256 258 214 288 200 298 188 308 176 318',
];

const river = `M250 500C330 476 386 456 452 428C540 390 596 366 668 330C752 288 812 256 900 226`;

const trees = [[70, 120], [128, 96], [196, 140], [262, 96], [352, 128], [430, 90],
  [520, 132], [560, 76], [640, 108], [714, 66], [790, 92], [880, 96], [316, 200], [468, 96]];

const mapBody = `<defs>
  <clipPath id="mapclip"><rect x="4" y="4" width="892" height="512" rx="22"/></clipPath>
</defs>
<style>
  .segment{transition:opacity .45s ease}
  .segment.locked{opacity:.14}
  .segment.done .seg-line{stroke:${RED}}
  .node{transition:opacity .45s ease}
  .node.locked .node-disc{fill:#DCD5C1}
  .node.locked .node-num{fill:#8B856E}
  .node-pulse{opacity:0;transform-box:fill-box;transform-origin:center}
  .node.current .node-pulse{opacity:1;animation:ar-pulse 1.7s ease-out infinite}
  @keyframes ar-pulse{0%{transform:scale(.85);opacity:.85}100%{transform:scale(2.1);opacity:0}}
  @media (prefers-reduced-motion:reduce){.node.current .node-pulse{animation:none;opacity:.5}}
</style>
<g clip-path="url(#mapclip)">
  <rect x="4" y="4" width="892" height="512" fill="#F6ECD2"/>
  <!-- Canadian side -->
  <path d="M-10-10H910V150C820 190 742 226 668 262 596 296 540 322 452 360 386 388 330 410 250 430L-10 396Z" fill="#CCE6AE"/>
  <path d="M-10 300C60 286 140 292 214 322 268 344 300 372 286 402 268 442 150 470 40 470L-10 452Z" fill="#BCDD9C"/>
  <!-- provincial border -->
  <path d="M556-10 570 96 596 210 616 330" fill="none" stroke="#7A9A5C" stroke-width="5" stroke-dasharray="14 12" stroke-linecap="round"/>
  <!-- Lake Ontario + the St. Lawrence -->
  <ellipse cx="120" cy="478" rx="230" ry="108" fill="#4FA3D9"/>
  <path d="${river}" fill="none" stroke="#4FA3D9" stroke-width="52" stroke-linecap="round"/>
  <path d="${river}" fill="none" stroke="#6FC0EA" stroke-width="36" stroke-linecap="round"/>
  <ellipse cx="120" cy="478" rx="214" ry="94" fill="#6FC0EA"/>
  <g fill="none" stroke="${WHITE}" stroke-width="4" stroke-linecap="round" opacity="0.7">
    <path d="M300 470c14-8 26-8 40 0s26 8 40 0"/><path d="M520 400c14-8 26-8 40 0s26 8 40 0"/>
    <path d="M740 300c14-8 26-8 40 0s26 8 40 0"/><path d="M60 460c14-8 26-8 40 0s26 8 40 0"/>
  </g>
  <!-- little boat -->
  <g transform="translate(392 452)" ${S(4)}>
    <path d="M-22 6h44l-8 14h-28z" fill="${WHITE}"/><path d="M0 6v-24l18 18z" fill="${RED}"/>
  </g>
  <!-- trees -->
  <g ${S(3.5)}>${trees.map(([x, y], i) => `<g transform="translate(${x} ${y}) scale(${i % 3 === 0 ? 1.15 : 0.9})">
    <rect x="-3" y="6" width="6" height="12" fill="#8A5A1E"/>
    <path d="M0-22 14 6H-14z" fill="${i % 2 ? '#3E8E2E' : '#4FA33A'}"/></g>`).join('')}</g>
  <!-- labels -->
  <g ${FONT} font-weight="700" fill="#6C8A50" opacity="0.85">
    <text x="150" y="70" font-size="26" letter-spacing="6">ONTARIO</text>
    <text x="686" y="52" font-size="26" letter-spacing="6">QUÉBEC</text>
  </g>
  <g ${FONT} font-weight="700" fill="#B9A87C" opacity="0.95">
    <text x="628" y="490" font-size="20" letter-spacing="5">NEW YORK</text>
  </g>
  <g ${FONT} font-weight="700" fill="#1F6FA8" opacity="0.9">
    <text x="52" y="486" font-size="15" letter-spacing="2">LAKE ONTARIO</text>
    <text x="560" y="404" font-size="15" letter-spacing="2" transform="rotate(-24 560 404)">ST. LAWRENCE RIVER</text>
  </g>
  <!-- ================= ROUTE ================= -->
  <g id="route" fill="none" stroke-linecap="round">
    ${SEGMENTS.map((d, i) => `<g id="segment-${i}" class="segment">
      <path class="seg-shadow" d="${d}" stroke="${OUT}" stroke-width="13" opacity="0.16"/>
      <path class="seg-line" d="${d}" stroke="${OUT}" stroke-width="7" stroke-dasharray="17 13"/>
    </g>`).join('\n    ')}
  </g>
  <!-- ================= NODES ================= -->
  ${NODES.map(n => `<g id="node-${n.i}" class="node">
    <circle class="node-pulse" cx="${n.x}" cy="${n.y}" r="20" fill="none" stroke="${RED}" stroke-width="5"/>
    <circle cx="${n.x}" cy="${n.y}" r="21" fill="${WHITE}" stroke="${OUT}" stroke-width="5"/>
    <circle class="node-disc" cx="${n.x}" cy="${n.y}" r="14" fill="${YELLOW}" stroke="${OUT}" stroke-width="3"/>
    <text class="node-num" x="${n.x}" y="${n.y + 6}" text-anchor="middle" ${FONT} font-size="17" font-weight="700" fill="${OUT}">${n.i}</text>
    ${n.label ? `<text x="${n.lx}" y="${n.ly}" text-anchor="${n.anchor}" ${FONT} font-size="17" font-weight="700" fill="${OUT}" stroke="${WHITE}" stroke-width="5" paint-order="stroke">${n.label}</text>` : ''}
    <g id="sticker-slot-${n.i}" transform="translate(${n.x} ${n.y - 46})"></g>
  </g>`).join('\n  ')}
  <!-- finish flag -->
  <g transform="translate(214 300) scale(0.6)" ${S(5)}>
    <path d="M-4 34V-26" stroke-width="7"/>
    <rect x="-4" y="-26" width="44" height="30" fill="${WHITE}"/>
    ${[0, 1, 2, 3].map(c => [0, 1, 2].map(r => (c + r) % 2 === 0
      ? `<rect x="${-4 + c * 11}" y="${-26 + r * 10}" width="11" height="10" fill="${OUT}" stroke="none"/>` : '').join('')).join('')}
    <rect x="-4" y="-26" width="44" height="30" fill="none"/>
  </g>
  <!-- compass rose -->
  <g transform="translate(846 448)">
    <circle r="34" fill="${WHITE}" stroke="${OUT}" stroke-width="4" opacity="0.94"/>
    <path d="M0-27 8-4 0 4-8-4z" fill="${RED}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <path d="M0 27 8 4 0-4-8 4z" fill="#59616B" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
    <text x="0" y="-30" text-anchor="middle" ${FONT} font-size="13" font-weight="700" fill="${OUT}">N</text>
  </g>
</g>
<rect x="4" y="4" width="892" height="512" rx="22" fill="none" stroke="${OUT}" stroke-width="8"/>
<rect x="16" y="16" width="868" height="488" rx="14" fill="none" stroke="${YELLOW}" stroke-width="5" opacity="0.85"/>`;

write('map/route-map.svg', svgDoc({ w: 900, h: 520, title: 'Souvenir route map — Ontario to Québec', body: mapBody }));

/* ============================ CITY STICKERS ============================ */

const chateau = () => `<g ${S(4)}>
  <rect x="-30" y="-2" width="15" height="28" fill="#F0E0BE"/><rect x="15" y="-2" width="15" height="28" fill="#F0E0BE"/>
  <path d="M-32-2-22.5-24-13-2zM13-2 22.5-24 32-2z" fill="#2E7D6E"/>
  <rect x="-16" y="-6" width="32" height="32" fill="#F0E0BE"/>
  <rect x="-9" y="-24" width="18" height="30" fill="#F0E0BE"/>
  <path d="M-14-24 0-50 14-24z" fill="#2E7D6E"/>
  <path d="M-4-52h8v10h-8z" fill="${RED}"/></g>
<g fill="#2E5C8A"><rect x="-4" y="-18" width="8" height="10" rx="4"/><rect x="-12" y="4" width="8" height="11" rx="4"/>
  <rect x="4" y="4" width="8" height="11" rx="4"/><rect x="-26" y="8" width="7" height="10" rx="3.5"/><rect x="19" y="8" width="7" height="10" rx="3.5"/></g>
<path d="M-34 26h68" ${S(5)}/>`;

const ribs = () => `<g ${S(4)}>
  <path d="M-14-20h34c8 0 12 5 12 11s-4 11-12 11h-34z" fill="#A24A22"/>
  <path d="M-14 2h34c8 0 12 5 12 11s-4 11-12 11h-34z" fill="#A24A22"/>
  <g fill="#F4EAD6"><path d="M-26-22h14v10h-14a5 5 0 0 1 0-10z"/><path d="M-26-10h14v10h-14a5 5 0 0 1 0-10z"/>
    <path d="M-26 0h14v10h-14a5 5 0 0 1 0-10z"/><path d="M-26 12h14v10h-14a5 5 0 0 1 0-10z"/></g></g>
<g fill="#6E2A10" opacity="0.55"><rect x="-6" y="-16" width="26" height="4" rx="2"/><rect x="-6" y="6" width="26" height="4" rx="2"/></g>`;

const splash = () => `<g ${S(4)}>
  <path d="M-14 4-20-22-8-8 0-26 8-8 20-22 14 4z" fill="#8FD9F7"/>
  <path d="M-30 6c9-7 17-7 26 0s17 7 26 0 11-4 14-2v24h-66z" fill="#4FA3D9"/></g>
<g fill="#8FD9F7" ${S(3)}><circle cx="-24" cy="-14" r="5"/><circle cx="25" cy="-16" r="4"/><circle cx="0" cy="-32" r="4"/></g>
<path d="M-22 14c7-4 13-4 20 0" fill="none" stroke="${WHITE}" stroke-width="3.5" stroke-linecap="round"/>`;

const stickers = [
  ['home', 'Home · Ajax finish line', icons['race-champion'], '#FFE0A0'],
  ['kingston', 'Kingston · cannon', icons['cannon-blaster'], '#A8E6A0'],
  ['cornwall', 'Cornwall · splash pad', splash, '#BFEAFB'],
  ['montreal', 'Montréal · bagel', icons['bagel-boss'], '#FFC8C2'],
  ['quebec', 'Québec City · château', () => `<g transform="translate(0,7) scale(0.8)">${chateau()}</g>`, '#C9E9F7'],
  ['brockville', 'Brockville · ribs', ribs, '#FFD98A'],
];

for (const [id, title, icon, disc] of stickers) {
  const body = `<circle cx="56" cy="56" r="52" fill="${WHITE}" stroke="${OUT}" stroke-width="4"/>
<circle cx="56" cy="56" r="44" fill="${disc}" stroke="${OUT}" stroke-width="4"/>
<path d="${starPath(12, 44, 38)}" transform="translate(56,56)" fill="${WHITE}" opacity="0.35"/>
<g transform="translate(56,56) scale(1.12)">${icon()}</g>`;
  write(`map/sticker-${id}.svg`, svgDoc({ w: 112, h: 112, title: `${title} sticker`, body }));
}
