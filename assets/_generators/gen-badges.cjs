const { write, svgDoc, OUT, YELLOW, RED, WHITE } = require('./lib.cjs');

const S = (w = 4) => `stroke="${OUT}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

function starPath(points, rOut, rIn, rot = -Math.PI / 2) {
  let d = '';
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? rIn : rOut;
    const a = rot + (i * Math.PI) / points;
    d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ' ' + (Math.sin(a) * r).toFixed(1) + ' ';
  }
  return d + 'Z';
}

/* ---------------------------- icons ---------------------------- */
// Every icon is drawn around the origin and fits comfortably in r = 30.

const icons = {
  'race-rookie': () => {
    let checks = '';
    for (let c = 0; c < 4; c++) for (let r = 0; r < 3; r++)
      if ((c + r) % 2 === 0) checks += `<rect x="${-16 + c * 10}" y="${-26 + r * 10}" width="10" height="10" fill="${OUT}"/>`;
    return `<g ${S(4)}>
  <path d="M-20-28v54" stroke-width="6"/>
  <rect x="-16" y="-26" width="40" height="30" fill="${WHITE}"/></g>
${checks}
<rect x="-16" y="-26" width="40" height="30" fill="none" ${S(4)}/>
<path d="M-26 26h12" ${S(5)}/>`;
  },

  'cannon-blaster': () => `<g ${S(4)}>
  <circle cx="20" cy="-16" r="9" fill="${WHITE}"/><circle cx="30" cy="-24" r="6" fill="${WHITE}"/>
  <path d="M-24 2 12-18l7 12-36 20z" fill="#59616B"/>
  <circle cx="15" cy="-12" r="7.5" fill="#7E8791"/>
  <path d="M-28 4h14v16h-14z" fill="#8A5A1E"/>
  <circle cx="-16" cy="16" r="11" fill="#B4713D"/>
  <circle cx="-16" cy="16" r="3.5" fill="${OUT}"/>
  <path d="M-16 5v22M-27 16h22" stroke-width="3"/>
  <path d="M14 16h16" stroke-width="5"/></g>`,

  'road-warrior': () => `<g ${S(4)}>
  <circle cx="22" cy="-19" r="9" fill="${YELLOW}"/>
  <path d="M-34 30c14-10 20-24 22-42" fill="none" stroke="#59616B" stroke-width="13"/>
  <path d="M-34 30c14-10 20-24 22-42" fill="none" stroke="${WHITE}" stroke-width="3" stroke-dasharray="6 8"/>
  <g transform="translate(2,10)">
    <path d="M-26 4c0-5 3-8 8-8l4-9c1-3 4-5 7-5h10c3 0 6 2 8 4l8 10c5 1 9 4 9 8v6c0 3-2 5-5 5h-44c-3 0-5-2-5-5z" fill="${RED}"/>
    <path d="M-11-13h8v9h-12zM1-13h8c2 0 4 1 5 3l5 6H1z" fill="#CDEBFA" stroke="${OUT}" stroke-width="3"/>
    <circle cx="-14" cy="14" r="8" fill="${OUT}"/><circle cx="-14" cy="14" r="3" fill="${WHITE}"/>
    <circle cx="14" cy="14" r="8" fill="${OUT}"/><circle cx="14" cy="14" r="3" fill="${WHITE}"/>
  </g></g>`,

  'metro-master': () => `<g ${S(4)}>
  <path d="M-30 28h60" stroke-width="5"/>
  <circle cx="-13" cy="23" r="5" fill="${OUT}"/><circle cx="13" cy="23" r="5" fill="${OUT}"/>
  <path d="M-24-26h48c3 0 5 2 5 5v34c0 3-2 5-5 5h-48c-3 0-5-2-5-5v-34c0-3 2-5 5-5z" fill="#2E86C1"/>
  <rect x="-18" y="-19" width="16" height="15" rx="3" fill="#CDEBFA"/>
  <rect x="2" y="-19" width="16" height="15" rx="3" fill="#CDEBFA"/>
  <rect x="-11" y="2" width="22" height="14" rx="3" fill="${YELLOW}"/>
  <circle cx="-19" cy="9" r="4" fill="${WHITE}"/><circle cx="19" cy="9" r="4" fill="${WHITE}"/></g>`,

  'bagel-boss': () => {
    const seeds = [[-14, -14], [4, -18], [16, -6], [12, 12], [-6, 17], [-18, 4], [-2, -20], [20, 3]]
      .map(([x, y], i) => `<ellipse cx="${x}" cy="${y}" rx="3.4" ry="2.2" transform="rotate(${i * 37} ${x} ${y})" fill="#FFF3D0" stroke="${OUT}" stroke-width="1.8"/>`).join('');
    return `<circle cx="0" cy="0" r="27" fill="#D79A4E" ${S(4)}/>
<circle cx="0" cy="0" r="24" fill="#E9B76A" stroke="#B87F35" stroke-width="2"/>
${seeds}
<circle cx="0" cy="0" r="9" fill="#8A5A1E" ${S(4)}/>`;
  },

  'penguin-pal': () => `<g ${S(4)}>
  <path d="M-26 6c-4 10-2 16 4 16 4 0 8-6 10-14zM26 6c4 10 2 16-4 16-4 0-8-6-10-14z" fill="#2B3440"/>
  <ellipse cx="-9" cy="30" rx="9" ry="4.5" fill="#F2921D"/><ellipse cx="9" cy="30" rx="9" ry="4.5" fill="#F2921D"/>
  <ellipse cx="0" cy="4" rx="21" ry="25" fill="#2B3440"/>
  <ellipse cx="0" cy="9" rx="14" ry="19" fill="${WHITE}"/>
  <ellipse cx="0" cy="-16" rx="17" ry="15" fill="#2B3440"/>
  <path d="M-13-16c0-7 5-11 13-11s13 4 13 11c0 6-6 9-13 9s-13-3-13-9z" fill="${WHITE}"/></g>
<circle cx="-6" cy="-19" r="3.4" fill="${OUT}"/><circle cx="6" cy="-19" r="3.4" fill="${OUT}"/>
<path d="M-6-10 6-10 0-2z" fill="#F2921D" ${S(3)}/>`,

  'time-traveler': () => `<g ${S(4)}>
  <path d="M20-26c9 1 14 7 14 16" fill="none" stroke="#B87F35" stroke-width="4"/>
  <path d="M-17-4c0-18 7-28 17-28s17 10 17 28z" fill="#3B4358"/>
  <path d="M-34 12c0-15 13-26 34-26s34 11 34 26c0 7-11 7-15 2-5-5-11-7-19-7s-14 2-19 7c-4 5-15 5-15-2z" fill="#4C566E"/>
  <path d="M-22-2c13-6 31-6 44 0" fill="none" stroke="${YELLOW}" stroke-width="5"/>
  <path d="M22-24c7-7 14-9 18-7-5 2-7 7-7 11-3-2-8-3-11-4z" fill="${WHITE}"/></g>`,

  'goat-whisperer': () => `<g ${S(4)}>
  <path d="M-10-14c-6-12-14-18-22-16 2 8 8 14 14 20zM10-14c6-12 14-18 22-16-2 8-8 14-14 20z" fill="#C9A227"/>
  <ellipse cx="-19" cy="0" rx="10" ry="6" transform="rotate(-20 -19 0)" fill="#EDE6D8"/>
  <ellipse cx="19" cy="0" rx="10" ry="6" transform="rotate(20 19 0)" fill="#EDE6D8"/>
  <path d="M0-16c11 0 16 8 16 18 0 12-6 20-16 20s-16-8-16-20c0-10 5-18 16-18z" fill="#F7F3EA"/>
  <path d="M-7 20h14c0 10-3 14-7 14s-7-4-7-14z" fill="#F7F3EA"/>
  <ellipse cx="0" cy="14" rx="8" ry="6" fill="#E7B7B7"/></g>
<circle cx="-7" cy="-2" r="3.2" fill="${OUT}"/><circle cx="7" cy="-2" r="3.2" fill="${OUT}"/>
<circle cx="-3" cy="13" r="1.8" fill="${OUT}"/><circle cx="3" cy="13" r="1.8" fill="${OUT}"/>`,

  'maze-runner': () => `<rect x="-27" y="-27" width="54" height="54" rx="7" fill="#3E8E2E" ${S(4)}/>
<path d="M-19-27v12h12v12h-24v12h36v-24h-12v-12" fill="none" stroke="#A8E6A0" stroke-width="6" stroke-linejoin="round"/>
<path d="M7 21h12v-12" fill="none" stroke="#A8E6A0" stroke-width="6" stroke-linejoin="round"/>
<circle cx="-1" cy="-3" r="5" fill="${RED}" ${S(3)}/>`,

  'race-champion': () => `<g ${S(4)}>
  <path d="M-22-24c-10 0-14 6-12 14 2 8 9 12 16 12" fill="none" stroke="${OUT}" stroke-width="9"/>
  <path d="M22-24c10 0 14 6 12 14-2 8-9 12-16 12" fill="none" stroke="${OUT}" stroke-width="9"/>
  <path d="M-22-24c-10 0-14 6-12 14 2 8 9 12 16 12" fill="none" stroke="${YELLOW}" stroke-width="5"/>
  <path d="M22-24c10 0 14 6 12 14-2 8-9 12-16 12" fill="none" stroke="${YELLOW}" stroke-width="5"/>
  <path d="M-22-28h44v14c0 15-9 25-22 25S-22 1-22-14z" fill="${YELLOW}"/>
  <rect x="-6" y="10" width="12" height="12" fill="#E0A400"/>
  <rect x="-18" y="20" width="36" height="10" rx="4" fill="${YELLOW}"/></g>
<path d="${starPath(5, 9, 4)}" transform="translate(0,-10)" fill="${WHITE}" stroke="${OUT}" stroke-width="2.5"/>`,

  'first-win': () => `<path d="${starPath(5, 28, 12)}" fill="${YELLOW}" ${S(4)}/>
<path d="M-11-14l14-6h6v34h9v7h-30v-7h9v-22l-8 3z" fill="${OUT}"/>`,

  'french-speaker': () => `<path d="M-28-24h56c4 0 6 2 6 6v26c0 4-2 6-6 6H2l-13 13v-13h-17c-4 0-6-2-6-6v-26c0-4 2-6 6-6z" fill="${WHITE}" ${S(4)}/>
<g fill="#0F4C9B" transform="translate(0,-4) scale(0.86)">
  <path d="M0-18c4 5 6 10 6 15 0 4-2 7-6 9-4-2-6-5-6-9 0-5 2-10 6-15z"/>
  <path d="M-6 2c-3-6-9-9-14-6-5 3-4 10 1 13 5 2 10 1 13-1z"/>
  <path d="M6 2c3-6 9-9 14-6 5 3 4 10-1 13-5 2-10 1-13-1z"/>
  <rect x="-13" y="9" width="26" height="5" rx="2.5"/>
  <path d="M-5 14h10l3 10h-16z"/></g>`,

  'photographer': () => `<g ${S(4)}>
  <path d="M-11-19l4-8h14l4 8z" fill="#3A4250"/>
  <rect x="-28" y="-19" width="56" height="40" rx="8" fill="#3A4250"/>
  <circle cx="0" cy="2" r="15" fill="#CDEBFA"/>
  <circle cx="0" cy="2" r="8" fill="#2E86C1"/>
  <circle cx="19" cy="-11" r="3.5" fill="${RED}"/></g>
<path d="M-24-24l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="${YELLOW}" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>`,

  'fearless': () => `<g ${S(4)}>
  <ellipse cx="4" cy="10" rx="26" ry="18" fill="#F4F1E8"/>
  <circle cx="-7" cy="6" r="4.5" fill="#F4F1E8"/><circle cx="6" cy="-1" r="5" fill="#F4F1E8"/>
  <circle cx="18" cy="4" r="4.5" fill="#F4F1E8"/><circle cx="-2" cy="17" r="4" fill="#F4F1E8"/>
  <g>
    <ellipse cx="-18" cy="8" rx="9" ry="11" fill="#8A7566"/>
    <ellipse cx="-26" cy="0" rx="3" ry="5.5" fill="#8A7566"/>
    <ellipse cx="-10" cy="0" rx="3" ry="5.5" fill="#8A7566"/>
    <circle cx="-21" cy="6" r="1.8" fill="${OUT}"/><circle cx="-15" cy="6" r="1.8" fill="${OUT}"/>
    <path d="M-21 13c2 2 4 2 6 0" fill="none" stroke-width="2.5"/>
  </g>
  <g transform="rotate(14 14 -30)">
    <rect x="10" y="-40" width="8" height="16" rx="4" fill="#EFC49A"/>
    <rect x="2" y="-30" width="26" height="13" rx="6.5" fill="#EFC49A"/>
  </g>
  <path d="M-8 30h22M-1 30v5M9 30v5" stroke-width="3.5"/></g>`,

  'dino-tamer': () => `<g ${S(4)}>
  <g transform="translate(-2,2)">
    <path d="M-28 22c-2-16 4-34 20-38 14-4 30 2 34 14 1 4-2 6-6 6l-16 1 10 5c3 2 2 6-2 7l-12 2 7 5c3 2 1 6-3 6h-12c-11 0-19-1-20-8z" fill="#7BC96F"/>
    <path d="M-28 22l-6 8M-18 26l-4 9M-8 27l-2 9" fill="none" stroke-width="4"/>
    <circle cx="6" cy="-6" r="4.5" fill="#1A1A1A"/><circle cx="7.5" cy="-7.5" r="1.5" fill="#FFFFFF"/>
    <path d="M14 8l4 5M4 12l4 6" fill="none" stroke="#FFFFFF" stroke-width="3.5"/>
  </g></g>`,
};

/* ---------------------------- badge frame ---------------------------- */

const badges = [
  ['race-rookie', 'Race Rookie', '#8ED2F5'],
  ['cannon-blaster', 'Cannon Blaster', '#A8E6A0'],
  ['road-warrior', 'Road Warrior', '#D8E6F5'],
  ['metro-master', 'Metro Master', '#FFD98A'],
  ['bagel-boss', 'Bagel Boss', '#FFC8C2'],
  ['penguin-pal', 'Penguin Pal', '#BFEAFB'],
  ['time-traveler', 'Time Traveler', '#E2CFA8'],
  ['goat-whisperer', 'Goat Whisperer', '#C9E9F7'],
  ['maze-runner', 'Maze Runner', '#DCF0C8'],
  ['dino-tamer', 'Dino Tamer', '#C9EFC2'],
  ['race-champion', 'Race Champion', '#FFE0A0'],
  ['first-win', 'First Win', '#FFD0CB'],
  ['french-speaker', 'French Speaker', '#BFD4F5'],
  ['photographer', 'Photographer', '#E4D6F5'],
  ['fearless', 'Fearless', '#B8ECE6'],
];

const TAIL = `<path d="M34 62h27l-5 62-16-12-13 12z" transform="rotate(-13 47 70)"/>`;

for (const [id, name, disc] of badges) {
  const body = `<g id="ribbon" fill="${RED}" ${S(4.5)}>
  ${TAIL}
  <g transform="translate(120,0) scale(-1,1)">${TAIL}</g>
</g>
<rect x="44" y="80" width="32" height="15" rx="6" fill="${YELLOW}" ${S(4.5)}/>
<g id="medal">
  <circle cx="60" cy="50" r="43" fill="${YELLOW}" ${S(5)}/>
  <circle cx="60" cy="50" r="43" fill="none" stroke="#E0A400" stroke-width="2"/>
  <circle cx="60" cy="50" r="34" fill="${disc}" ${S(4)}/>
  <g id="icon" transform="translate(60,50)">${icons[id]()}</g>
</g>`;
  write(`badges/${id}.svg`, svgDoc({ w: 120, h: 132, title: `${name} badge`, body }));
}

module.exports = { icons, starPath };
