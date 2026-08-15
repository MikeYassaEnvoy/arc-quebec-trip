const fs = require('fs');
const { write, svgDoc, OUT, YELLOW, RED, WHITE, ROOT } = require('./lib.cjs');
const { starPath } = require('./gen-badges.cjs');

const S = (w = 5) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const FONT = `font-family="Helvetica Neue, Helvetica, Arial, sans-serif"`;

/* --------------------------- maple leaf --------------------------- */
// Fill is currentColor so the 1-5 maple-leaf rating can colour it from CSS.
const LEAF = 'M0-100 11-64 33-68 26-44 56-52 49-32 89-8 78 2 84 18 46 10 50 24 20 52 28 60 8 64 8 100-8 100-8 64-28 60-20 52-50 24-46 10-84 18-78 2-89-8-49-32-56-52-26-44-33-68-11-64Z';

write('ui/maple-leaf.svg', svgDoc({
  w: 200, h: 220, title: 'Maple leaf (rating unit, fill via currentColor)',
  body: `<g transform="translate(100,110)"><path d="${LEAF}" fill="currentColor" stroke="${OUT}" stroke-width="7" stroke-linejoin="round"/></g>`,
}));

/* --------------------------- clue envelope --------------------------- */
// Race stripes: yellow body, red flap, checkered corner.

const stripeCorner = (x, y) => `<g transform="translate(${x} ${y})">
  <path d="M0 0h26l-26 26z" fill="${RED}"/><path d="M30 0h26l-56 56v-26z" fill="${OUT}"/></g>`;

write('ui/envelope-closed.svg', svgDoc({
  w: 240, h: 168, title: 'Clue envelope — sealed',
  body: `<defs><clipPath id="ec"><rect x="6" y="6" width="228" height="156" rx="14"/></clipPath></defs>
<rect x="6" y="6" width="228" height="156" rx="14" fill="${YELLOW}"/>
<g clip-path="url(#ec)">
  <path d="M6 118h228v44H6z" fill="${RED}"/>
  <path d="M6 112h228v10H6z" fill="${WHITE}"/>
  <g>${[0, 1, 2, 3, 4, 5, 6, 7].map(i => i % 2 === 0
    ? `<rect x="${6 + i * 28.5}" y="140" width="28.5" height="22" fill="${OUT}"/>` : '').join('')}</g>
  <path d="M6 6h228L120 100z" fill="${RED}"/>
  <path d="M6 6 120 100 234 6" fill="none" ${S(6)}/>
</g>
<rect x="6" y="6" width="228" height="156" rx="14" fill="none" ${S(6)}/>
<circle cx="120" cy="96" r="30" fill="${WHITE}" ${S(6)}/>
<g transform="translate(120 96) scale(0.21)"><path d="${LEAF}" fill="${RED}" stroke="${OUT}" stroke-width="18" stroke-linejoin="round"/></g>`,
}));

write('ui/envelope-open.svg', svgDoc({
  w: 240, h: 216, title: 'Clue envelope — opened with the clue card',
  body: `<path d="M12 104 120 20 228 104Z" fill="${RED}" ${S(6)}/>
<g transform="rotate(-3 120 96)">
  <rect x="38" y="10" width="164" height="140" rx="10" fill="${WHITE}" ${S(5)}/>
  <rect x="38" y="10" width="164" height="26" rx="10" fill="${YELLOW}"/>
  <path d="M38 36h164" ${S(4)}/>
  <g fill="#C9C4B6"><rect x="56" y="54" width="128" height="10" rx="5"/><rect x="56" y="74" width="112" height="10" rx="5"/>
    <rect x="56" y="94" width="128" height="10" rx="5"/><rect x="56" y="114" width="76" height="10" rx="5"/></g>
</g>
<path d="M12 100 120 158 228 100v96a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="${YELLOW}" ${S(6)}/>
<path d="M12 172h216" stroke="${RED}" stroke-width="14" stroke-linecap="butt"/>
<path d="M12 100 120 158 228 100" fill="none" ${S(6)}/>
${stripeCorner(178, 176)}
<path d="M12 100 120 158 228 100v96a10 10 0 0 1-10 10H22a10 10 0 0 1-10-10z" fill="none" ${S(6)}/>`,
}));

/* --------------------------- pit stop mat --------------------------- */

function wedge(r1, r2, a0, a1) {
  const P = (r, a) => `${(r * Math.cos(a)).toFixed(2)} ${(r * Math.sin(a)).toFixed(2)}`;
  return `M${P(r2, a0)}A${r2} ${r2} 0 0 1 ${P(r2, a1)}L${P(r1, a1)}A${r1} ${r1} 0 0 0 ${P(r1, a0)}Z`;
}
let checkRing = '';
const N = 24;
for (let i = 0; i < N; i++) {
  const a0 = (i * 2 * Math.PI) / N, a1 = ((i + 1) * 2 * Math.PI) / N;
  checkRing += `<path d="${wedge(78, 96, a0, a1)}" fill="${i % 2 ? WHITE : OUT}"/>`;
}

write('ui/mat.svg', svgDoc({
  w: 260, h: 260, title: 'Pit stop mat',
  body: `<g transform="translate(130,130)">
  <ellipse cx="0" cy="8" rx="124" ry="120" fill="${OUT}" opacity="0.18"/>
  <circle r="124" fill="${OUT}"/>
  <circle r="118" fill="${YELLOW}"/>
  <g>${checkRing}</g>
  <circle r="96" fill="none" stroke="${OUT}" stroke-width="5"/>
  <circle r="78" fill="${RED}" stroke="${OUT}" stroke-width="5"/>
  <circle r="52" fill="${YELLOW}" stroke="${OUT}" stroke-width="5"/>
  <g transform="scale(0.42)"><path d="${LEAF}" fill="${RED}" stroke="${OUT}" stroke-width="12" stroke-linejoin="round"/></g>
</g>`,
}));

/* --------------------------- route marker flag --------------------------- */

write('ui/marker.svg', svgDoc({
  w: 130, h: 170, title: 'Route marker flag',
  body: `<ellipse cx="40" cy="158" rx="30" ry="8" fill="${OUT}" opacity="0.18"/>
<path d="M34 156V16" ${S(9)}/>
<path d="M40 14h74c-8 14-8 26 0 40H40Z" fill="${YELLOW}" ${S(5)}/>
<path d="M40 54h74c-8 14-8 26 0 40H40Z" fill="${RED}" ${S(5)}/>
<circle cx="34" cy="12" r="9" fill="${OUT}"/>
<path d="M20 156h28" ${S(9)}/>`,
}));

/* --------------------------- confetti sprite --------------------------- */
// Eight pieces, each with its own id so the engine can <use> them singly.

const pieces = [
  ['confetti-1', `<rect x="-11" y="-8" width="22" height="16" rx="3" fill="${YELLOW}"/>`],
  ['confetti-2', `<rect x="-9" y="-7" width="18" height="14" rx="3" fill="${RED}"/>`],
  ['confetti-3', `<circle r="9" fill="${WHITE}"/>`],
  ['confetti-4', `<path d="${starPath(5, 12, 5)}" fill="${YELLOW}"/>`],
  ['confetti-5', `<path d="M-12 8c6-16 18-16 24 0-6-8-18-8-24 0z" fill="#2E86C1"/>`],
  ['confetti-6', `<path d="M-11-9 11-9 0 10Z" fill="#2FB57C"/>`],
  ['confetti-7', `<path d="M-14 0c4-10 10-10 14 0s10 10 14 0" fill="none" stroke="${RED}" stroke-width="5" stroke-linecap="round"/>`],
  ['confetti-8', `<g transform="scale(0.13)"><path d="${LEAF}" fill="${RED}"/></g>`],
];

write('ui/confetti.svg', svgDoc({
  w: 320, h: 44, title: 'Confetti pieces sprite',
  body: pieces.map(([id, art], i) =>
    `<g id="${id}" transform="translate(${20 + i * 40} 22)" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round">${art}</g>`).join('\n'),
}));

/* --------------------------- panel + button decorations --------------------------- */

write('ui/stripe-bar.svg', svgDoc({
  w: 400, h: 28, title: 'Race stripe bar (tileable header rule)',
  body: `<rect x="0" y="0" width="400" height="28" fill="${YELLOW}"/>
<path d="M0 18h400v10H0z" fill="${RED}"/>
${Array.from({ length: 20 }, (_, i) => `<path d="M${i * 20} 0h12L${i * 20 - 6} 18H${i * 20 - 18}z" fill="${OUT}" opacity="${i % 2 ? 0.9 : 0.35}"/>`).join('')}
<rect x="0" y="0" width="400" height="28" fill="none" stroke="${OUT}" stroke-width="4"/>`,
}));

write('ui/banner.svg', svgDoc({
  w: 360, h: 110, title: 'Ribbon banner for panel titles',
  body: `<path d="M4 34 44 62 4 90V34Z" fill="#A81E14" ${S(5)}/>
<path d="M356 34 316 62l40 28V34Z" fill="#A81E14" ${S(5)}/>
<path d="M36 22h288c6 0 10 4 10 10v60c0 6-4 10-10 10H36c-6 0-10-4-10-10V32c0-6 4-10 10-10z" fill="${RED}" ${S(5)}/>
<path d="M40 36h280c4 0 6 2 6 6v40c0 4-2 6-6 6H40c-4 0-6-2-6-6V42c0-4 2-6 6-6z" fill="none" stroke="${YELLOW}" stroke-width="4" opacity="0.9"/>`,
}));

write('ui/starburst.svg', svgDoc({
  w: 260, h: 260, title: 'Celebration starburst backdrop',
  body: `<g transform="translate(130,130)">
  <path d="${starPath(16, 126, 78)}" fill="${YELLOW}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>
  <path d="${starPath(16, 100, 62)}" transform="rotate(11)" fill="${RED}" opacity="0.9"/>
  <circle r="56" fill="${WHITE}" stroke="${OUT}" stroke-width="5"/></g>`,
}));

write('ui/checkered-flag.svg', svgDoc({
  w: 160, h: 150, title: 'Checkered finish flag',
  body: `<path d="M22 142V14" ${S(9)}/>
<rect x="26" y="12" width="112" height="80" fill="${WHITE}" ${S(5)}/>
${[0, 1, 2, 3, 4, 5, 6, 7].map(c => [0, 1, 2, 3, 4].map(r => (c + r) % 2 === 0
    ? `<rect x="${26 + c * 14}" y="${12 + r * 16}" width="14" height="16" fill="${OUT}"/>` : '').join('')).join('')}
<rect x="26" y="12" width="112" height="80" fill="none" ${S(5)}/>
<circle cx="22" cy="10" r="9" fill="${RED}" ${S(4)}/>`,
}));

write('ui/lock.svg', svgDoc({
  w: 120, h: 140, title: 'Locked leg padlock',
  body: `<path d="M34 62V44a26 26 0 0 1 52 0v18" fill="none" ${S(12)}/>
<rect x="16" y="60" width="88" height="70" rx="14" fill="${YELLOW}" ${S(6)}/>
<circle cx="60" cy="88" r="11" fill="${OUT}"/>
<path d="M60 94v18" ${S(9)}/>`,
}));

write('ui/stopwatch.svg', svgDoc({
  w: 140, h: 154, title: 'Stopwatch for timed challenges',
  body: `<rect x="52" y="6" width="36" height="18" rx="6" fill="${OUT}"/>
<path d="M104 26 118 12" ${S(10)}/>
<circle cx="70" cy="88" r="58" fill="${RED}" ${S(6)}/>
<circle cx="70" cy="88" r="46" fill="${WHITE}" ${S(5)}/>
<g stroke="${OUT}" stroke-width="5" stroke-linecap="round">
  <path d="M70 48v8M70 120v8M30 88h8M102 88h8"/>
  <path d="M70 88 96 66" stroke-width="7"/></g>
<circle cx="70" cy="88" r="7" fill="${OUT}"/>`,
}));

/* --------------------------- app icon --------------------------- */

const iconBody = `<rect width="512" height="512" fill="${YELLOW}"/>
<path d="M0 512 512 172v340z" fill="#F0A800" opacity="0.55"/>
<g transform="translate(256 214) scale(1.66)"><path d="${LEAF}" fill="${RED}" stroke="${OUT}" stroke-width="12" stroke-linejoin="round"/></g>
<g>${[0, 1, 2, 3, 4, 5, 6, 7].map(c => [0, 1].map(r => (c + r) % 2 === 0
  ? `<rect x="${c * 64}" y="${400 + r * 56}" width="64" height="56" fill="${OUT}"/>`
  : `<rect x="${c * 64}" y="${400 + r * 56}" width="64" height="56" fill="${WHITE}"/>`).join('')).join('')}</g>
<rect x="0" y="396" width="512" height="8" fill="${OUT}"/>`;

write('icons/app-icon.svg', svgDoc({ w: 512, h: 512, title: 'The Amazing Race Canada — Yassa Edition app icon', body: iconBody }));

fs.writeFileSync(`${ROOT}/icons/splash-theme.json`, JSON.stringify({
  themeColor: '#DA291C',
  backgroundColor: '#FFC20E',
}, null, 2) + '\n');
console.log('icons/splash-theme.json');
