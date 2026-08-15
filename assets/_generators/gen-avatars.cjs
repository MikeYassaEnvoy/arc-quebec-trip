const { write, svgDoc, bust, OUT, YELLOW, RED, WHITE } = require('./lib.cjs');

/* ================= KID TEAM AVATARS (player picks one) ================= */

const kids = [
  { id: 1, name: 'Kid racer 1 — red bandana',
    bg: '#BFEAFB', skin: '#F7D7B8', hair: '#C0782E', hairStyle: 'spiky',
    hat: 'bandana', hatColor: RED, hatColor2: WHITE, shirt: YELLOW, shirt2: WHITE,
    pack: RED, strap: '#1F6FB2', mouth: 'open' },
  { id: 2, name: 'Kid racer 2 — braids and beads',
    bg: '#FFE9A8', skin: '#D9A066', hair: '#2B1B12', hair2: YELLOW, hairStyle: 'braids',
    hat: 'headband', hatColor: RED, shirt: '#2E86C1', shirt2: WHITE,
    pack: YELLOW, strap: RED, mouth: 'smile' },
  { id: 3, name: 'Kid racer 3 — big curls',
    bg: '#A8E6A0', skin: '#8A5230', hair: '#1A1A1A', hairStyle: 'afro',
    hat: 'bandana', hatColor: YELLOW, hatColor2: RED, shirt: RED, shirt2: WHITE,
    pack: '#2E86C1', strap: YELLOW, mouth: 'open' },
  { id: 4, name: 'Kid racer 4 — ponytail and cap',
    bg: '#FFC8C2', skin: '#EFC49A', hair: '#E8C36B', hairStyle: 'ponytail',
    hat: 'cap', hatColor: RED, hatColor2: WHITE, shirt: '#2FB57C', shirt2: WHITE,
    pack: YELLOW, strap: '#1A1A1A', mouth: 'smile' },
  { id: 5, name: 'Kid racer 5 — space buns',
    bg: '#D8C4F5', skin: '#B4713D', hair: '#4A2A18', hairStyle: 'buns',
    hat: 'headband', hatColor: YELLOW, shirt: RED, shirt2: YELLOW,
    pack: '#2FB57C', strap: WHITE, mouth: 'open' },
  { id: 6, name: 'Kid racer 6 — yellow cap',
    bg: '#FFD98A', skin: '#5E3620', hair: '#1A1A1A', hairStyle: 'short',
    hat: 'cap', hatColor: YELLOW, hatColor2: '#1A1A1A', shirt: WHITE, shirt2: RED,
    pack: RED, strap: '#2E86C1', mouth: 'smile' },
];

for (const k of kids) {
  const body = `<defs><clipPath id="k${k.id}c"><circle cx="84" cy="84" r="77"/></clipPath></defs>
<circle cx="84" cy="84" r="77" fill="${k.bg}"/>
<g clip-path="url(#k${k.id}c)">
  <circle cx="84" cy="70" r="60" fill="${WHITE}" opacity="0.3"/>
  <g transform="translate(8,-10) scale(0.95)">${bust(k)}</g>
</g>
<circle cx="84" cy="84" r="77" fill="none" stroke="${OUT}" stroke-width="6"/>`;
  write(`avatars/kid-${k.id}.svg`, svgDoc({ w: 168, h: 168, title: k.name, body }));
}

/* ================= GHOST TEAM AVATAR PAIRS ================= */
// Two racers on a team card. Left figure drawn after right so it overlaps cleanly.

function teamCard({ file, title, bg, bg2, accent, left, right, props = '' }) {
  const body = `<defs><clipPath id="cc"><rect x="5" y="5" width="270" height="166" rx="26"/></clipPath></defs>
<rect x="5" y="5" width="270" height="166" rx="26" fill="${bg}"/>
<g clip-path="url(#cc)">
  <path d="M0 118h280v60H0z" fill="${bg2}"/>
  <g opacity="0.45" fill="${WHITE}"><circle cx="46" cy="44" r="20"/><circle cx="72" cy="38" r="14"/><circle cx="236" cy="52" r="18"/><circle cx="212" cy="44" r="12"/></g>
  ${props}
  <g transform="translate(143.6,26) scale(0.78)">${bust(right)}</g>
  <g transform="translate(11.6,30) scale(0.78)">${bust(left)}</g>
</g>
<rect x="5" y="5" width="270" height="166" rx="26" fill="none" stroke="${OUT}" stroke-width="6"/>
<rect x="14" y="14" width="252" height="148" rx="19" fill="none" stroke="${accent}" stroke-width="4" opacity="0.75"/>`;
  write(file, svgDoc({ w: 280, h: 176, title, body }));
}

// Team Maple — Ava & Liam, Toronto siblings. Strong friendly rivals. Red + white.
teamCard({
  file: 'avatars/ghost-maple.svg', title: 'Team Maple — Ava and Liam, Toronto',
  bg: '#FFD7D2', bg2: '#F7A9A0', accent: RED,
  props: `<g transform="translate(140,86) scale(2.6)" fill="${RED}" opacity="0.18">
    <path d="M0-22 5-9l13-5-5 12 12 3-10 8 4 12-14-5-9 10-2-14-13 2 6-11-11-7 12-4-4-13 12 6z"/></g>`,
  left: { skin: '#EFC49A', hair: '#5A3520', hairStyle: 'long', hat: 'headband', hatColor: RED,
          shirt: RED, shirt2: WHITE, pack: WHITE, strap: WHITE, mouth: 'smile' },
  right: { skin: '#EFC49A', hair: '#5A3520', hairStyle: 'short', hat: 'cap', hatColor: WHITE, hatColor2: RED,
           shirt: WHITE, shirt2: RED, pack: RED, strap: RED, mouth: 'open' },
});

// The Rock Hoppers — Finn & Rose, Newfoundland climbers. Helmets, cheerful daredevils.
teamCard({
  file: 'avatars/ghost-rockhoppers.svg', title: 'The Rock Hoppers — Finn and Rose, Newfoundland',
  bg: '#BFEAFB', bg2: '#7FD4F5', accent: '#1F6FB2',
  props: `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round" fill="#9AA6AE">
    <path d="M-6 176 34 108l26 42 18-26 34 52z"/><path d="M196 176l38-64 24 40 22-22v46z"/></g>`,
  left: { skin: '#F7D7B8', hair: '#C0782E', hairStyle: 'short', hat: 'helmet', hatColor: '#FF7A18', hatColor2: WHITE,
          shirt: '#1F6FB2', shirt2: YELLOW, pack: YELLOW, strap: '#1A1A1A', mouth: 'open' },
  right: { skin: '#D9A066', hair: '#2B1B12', hairStyle: 'ponytail', hat: 'helmet', hatColor: YELLOW, hatColor2: WHITE,
           shirt: '#2FB57C', shirt2: WHITE, pack: '#FF7A18', strap: '#1A1A1A', mouth: 'open' },
});

// Prairie Thunder — Wyatt & June, Saskatchewan ranch kids. Cowboy hats, wheat, big sky.
teamCard({
  file: 'avatars/ghost-prairie.svg', title: 'Prairie Thunder — Wyatt and June, Saskatchewan',
  bg: '#FFE9A8', bg2: '#E3B24A', accent: '#8A5A1E',
  props: `<g stroke="#8A5A1E" stroke-width="5" stroke-linecap="round" opacity="0.85">
    <path d="M18 176v-40M32 176v-34M266 176v-42M252 176v-32"/></g>
  <circle cx="240" cy="40" r="22" fill="${YELLOW}" stroke="${OUT}" stroke-width="5"/>`,
  left: { skin: '#F7D7B8', hair: '#A8551E', hairStyle: 'short', hat: 'cowboy', hatColor: '#B4713D', hatColor2: '#5E3620',
          shirt: '#C8452F', shirt2: WHITE, pack: '#5E3620', strap: '#8A5A1E', mouth: 'open' },
  right: { skin: '#EFC49A', hair: '#E8C36B', hairStyle: 'braids', hair2: RED, hat: 'cowboy', hatColor: '#D9A066', hatColor2: '#8A5A1E',
           shirt: '#2E86C1', shirt2: WHITE, pack: '#B4713D', strap: '#8A5A1E', mouth: 'smile' },
});

// The Tide Riders — Coco & Marlow, Nova Scotia surfers. Laid back, shades, waves.
teamCard({
  file: 'avatars/ghost-tide.svg', title: 'The Tide Riders — Coco and Marlow, Nova Scotia',
  bg: '#C6F2EC', bg2: '#37B6C4', accent: '#0E7C86',
  props: `<g fill="none" stroke="${WHITE}" stroke-width="6" stroke-linecap="round" opacity="0.85">
    <path d="M6 150c14-12 26-12 40 0s26 12 40 0"/><path d="M186 158c14-12 26-12 40 0s26 12 40 0"/></g>
  <g transform="translate(252 96) rotate(18)" stroke="${OUT}" stroke-width="5">
    <path d="M0 0c14 16 14 56 0 74-14-18-14-58 0-74z" fill="${YELLOW}"/><path d="M0 8v58" stroke="${RED}" stroke-width="5"/></g>`,
  left: { skin: '#D9A066', hair: '#1A1A1A', hairStyle: 'wavy', hat: 'visor', hatColor: '#FF7A18',
          shirt: '#0E7C86', shirt2: YELLOW, pack: YELLOW, strap: WHITE, mouth: 'smile' },
  right: { skin: '#B4713D', hair: '#E8C36B', hairStyle: 'wavy', hat: 'none', eyewear: 'sunglasses', shades: '#0E7C86',
           shirt: YELLOW, shirt2: '#0E7C86', pack: '#37B6C4', strap: RED, mouth: 'open' },
});

/* ================= HOST (two poses) ================= */

const JACKET = '#2F3B4C';
const SKIN = '#EFC49A';

function limb(d, w) {
  return `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + 9}" stroke-linecap="round"/>
  <path d="${d}" fill="none" stroke="${JACKET}" stroke-width="${w}" stroke-linecap="round"/>`;
}

function hostBody(arms, mouth, extras) {
  return `<ellipse cx="90" cy="209" rx="54" ry="9" fill="${OUT}" opacity="0.15"/>
<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <rect x="64" y="146" width="24" height="52" rx="11" fill="${JACKET}"/>
  <rect x="92" y="146" width="24" height="52" rx="11" fill="${JACKET}"/>
  <rect x="54" y="188" width="38" height="18" rx="9" fill="${OUT}"/>
  <rect x="88" y="188" width="38" height="18" rx="9" fill="${OUT}"/>
</g>
${arms}
<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M54 154c-2-38 8-58 36-58s38 20 36 58z" fill="${JACKET}"/>
  <path d="M76 98h28l-14 30z" fill="${WHITE}"/>
  <path d="M68 96c8-4 14 8 22 8s14-12 22-8c8 4 6 18-4 20-6 2-12-4-18-4s-12 6-18 4c-10-2-12-16-4-20z" fill="${YELLOW}"/>
  <path d="M86 62h8v34h-8z" fill="${SKIN}"/>
  <ellipse cx="60" cy="66" rx="7" ry="9" fill="${SKIN}"/><ellipse cx="120" cy="66" rx="7" ry="9" fill="${SKIN}"/>
  <ellipse cx="90" cy="62" rx="31" ry="33" fill="${SKIN}"/>
  <path d="M60 62c0-30 12-44 30-44s30 14 30 44c-4-14-14-20-30-20s-26 6-30 20z" fill="#3B2415"/>
  <path d="M62 48c14-8 24 6 36 2 6-2 12-8 18-14-6-12-16-18-26-18-18 0-30 12-28 30z" fill="#3B2415"/>
</g>
<g>
  <ellipse cx="78" cy="62" rx="4.8" ry="5.8" fill="${OUT}"/><ellipse cx="102" cy="62" rx="4.8" ry="5.8" fill="${OUT}"/>
  <circle cx="76.4" cy="60" r="1.8" fill="${WHITE}"/><circle cx="100.4" cy="60" r="1.8" fill="${WHITE}"/>
  <path d="M70 50c4-4 10-4 14-1M96 49c4-3 10-3 14 1" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>
  ${mouth}
</g>
${extras || ''}`;
}

const smileClosed = `<path d="M76 76c6 10 22 10 28 0" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`;
const smileOpen = `<path d="M74 74c8 0 24 0 32 0 0 12-7 19-16 19s-16-7-16-19z" fill="${OUT}"/><path d="M82 88c4-4 12-4 16 0" fill="#E8607A"/>`;

// Pose 1 — welcoming, holding a clue envelope.
const armsNeutral = `${limb('M62 112C46 128 42 146 44 164', 18)}
${limb('M118 112c16 12 20 28 18 44', 18)}
<circle cx="44" cy="168" r="11" fill="${SKIN}" stroke="${OUT}" stroke-width="5"/>
<circle cx="136" cy="158" r="11" fill="${SKIN}" stroke="${OUT}" stroke-width="5"/>
<g transform="translate(112 140) rotate(-12)" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round">
  <rect x="0" y="0" width="46" height="32" rx="4" fill="${WHITE}"/>
  <path d="M0 0h46v9H0z" fill="${YELLOW}"/><path d="M0 23h46v9H0z" fill="${RED}"/>
  <path d="M0 0l23 17L46 0" fill="none"/></g>`;

// Pose 2 — big cheer, arms up.
const armsCheer = `${limb('M60 116C40 106 30 88 30 68', 18)}
${limb('M120 116c20-10 30-28 30-48', 18)}
<circle cx="28" cy="60" r="12" fill="${SKIN}" stroke="${OUT}" stroke-width="5"/>
<circle cx="152" cy="60" r="12" fill="${SKIN}" stroke="${OUT}" stroke-width="5"/>`;

const cheerConfetti = `<g stroke="${OUT}" stroke-width="3" stroke-linejoin="round">
  <rect x="14" y="24" width="12" height="9" rx="2" fill="${YELLOW}" transform="rotate(-20 20 28)"/>
  <rect x="46" y="12" width="11" height="8" rx="2" fill="${RED}" transform="rotate(24 51 16)"/>
  <rect x="120" y="16" width="12" height="9" rx="2" fill="${YELLOW}" transform="rotate(-32 126 20)"/>
  <rect x="154" y="28" width="11" height="8" rx="2" fill="${RED}" transform="rotate(18 159 32)"/>
  <circle cx="36" cy="8" r="5" fill="${RED}"/><circle cx="146" cy="6" r="5" fill="${YELLOW}"/></g>`;

write('avatars/host.svg', svgDoc({ w: 180, h: 220, title: 'Race host — welcome pose with clue envelope',
  body: hostBody(armsNeutral, smileClosed) }));
write('avatars/host-cheer.svg', svgDoc({ w: 180, h: 220, title: 'Race host — cheering pose',
  body: hostBody(armsCheer, smileOpen, cheerConfetti) }));
