// Shared character-drawing helpers for the Amazing Race Canada: Yassa Edition art pack.
// Bright flat cartoon, chunky dark outlines, AR yellow/red/black palette.
const fs = require('fs');
const path = require('path');

// Art pack generators. Regenerate everything with:
//   node assets/_generators/gen-avatars.cjs && node assets/_generators/gen-badges.cjs \
//     && node assets/_generators/gen-map.cjs && node assets/_generators/gen-ui.cjs \
//     && node assets/_generators/gen-index.cjs
const ROOT = path.resolve(__dirname, '..');
const OUT = '#1A1A1A';       // chunky outline
const YELLOW = '#FFC20E';
const RED = '#DA291C';
const WHITE = '#FFFFFF';

function write(rel, svg) {
  const p = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, svg.replace(/\n\s*\n/g, '\n'));
  const kb = (Buffer.byteLength(svg) / 1024).toFixed(1);
  console.log(`${rel.padEnd(34)} ${kb} KB`);
}

function svgDoc({ w, h, title, body, style = '' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${title}">
<title>${title}</title>
${style}
${body}
</svg>
`;
}

/* ------------------------------------------------------------------ *
 * Character bust. Local coordinate space is 160 x 180.
 * Head ellipse: cx 80, cy 82, rx 36, ry 38.
 * ------------------------------------------------------------------ */

const CAP_SWOOP = 'M42 84C42 46 58 32 80 32c24 0 36 16 36 54-2-16-10-24-22-26-12-2-26 6-36 14-6 4-12 6-16 10z';
const CAP_ROUND = 'M42 86C42 48 58 34 80 34s38 14 38 52c-4-18-16-26-38-26s-34 8-38 26z';

function hairBack(style, hair, hair2) {
  switch (style) {
    case 'afro':
      return `<g fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <circle cx="80" cy="52" r="34"/><circle cx="46" cy="66" r="22"/><circle cx="114" cy="66" r="22"/>
  <circle cx="56" cy="40" r="20"/><circle cx="104" cy="40" r="20"/></g>`;
    case 'long':
      return `<path d="M38 70c0-26 18-42 42-42s42 16 42 42v76c0 6-6 10-14 8-6-2-8-10-8-22V96H60v56c0 12-2 20-8 22-8 2-14-2-14-8z" fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'ponytail':
      return `<g fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M108 44c20-8 40 4 42 26 2 21-8 37-22 43-9 4-17-3-12-12 9-16 10-30 1-42-4-6-7-11-9-15z"/></g>`;
    case 'braids':
      return `<g fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M44 74c-10 6-14 22-12 38 2 14 8 22 16 22s12-8 10-20c-2-14-4-26-2-36z"/>
  <path d="M116 74c10 6 14 22 12 38-2 14-8 22-16 22s-12-8-10-20c2-14 4-26 2-36z"/></g>
  <g fill="${hair2 || YELLOW}" stroke="${OUT}" stroke-width="4"><circle cx="48" cy="136" r="8"/><circle cx="112" cy="136" r="8"/></g>`;
    case 'wavy':
      return `<path d="M38 76c0-28 18-44 42-44s42 16 42 44v34c-6-4-10 6-16 2s-6-12-14-12-10 10-18 10-12-10-20-8-10 10-16 12z" fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'buns':
      return `<g fill="${hair}" stroke="${OUT}" stroke-width="5"><circle cx="40" cy="46" r="17"/><circle cx="120" cy="46" r="17"/></g>`;
    default:
      return '';
  }
}

function hairFront(style, hair) {
  switch (style) {
    case 'afro':
      return `<path d="M46 78c2-18 14-28 34-28s32 10 34 28c-8-12-20-18-34-18s-26 6-34 18z" fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'spiky':
      return `<path d="M42 82 48 50l10 16 8-24 10 20 8-22 10 22 10-18 8 22 10-14 4 30c-8-16-22-24-42-24s-34 8-44 24z" fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'buns':
    case 'braids':
      return `<path d="${CAP_ROUND}" fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'none':
      return '';
    default:
      return `<path d="${CAP_SWOOP}" fill="${hair}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
  }
}

function headwear(kind, c1, c2) {
  switch (kind) {
    case 'bandana':
      return `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M44 74c2-24 16-38 36-38s34 14 36 38c-16-10-30-14-36-14s-20 4-36 14z" fill="${c1}"/>
  <path d="M116 62c10-2 18 2 24 10-8 2-12 6-14 12-6-8-10-16-10-22z" fill="${c1}"/>
  <path d="M50 56h60" stroke="${c2 || WHITE}" stroke-width="6" stroke-linecap="round" fill="none"/></g>`;
    case 'cap':
      return `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M42 68c0-24 16-40 38-40s38 16 38 40c-16-10-24-12-38-12s-24 2-38 12z" fill="${c1}"/>
  <path d="M114 60h26c6 0 8 12 0 14l-30 2z" fill="${c2 || c1}"/>
  <circle cx="80" cy="28" r="6" fill="${c2 || WHITE}"/></g>`;
    case 'helmet':
      return `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M40 70c0-26 18-44 40-44s40 18 40 44z" fill="${c1}"/>
  <path d="M34 66h92c4 0 6 4 6 8s-2 8-6 8H34c-4 0-6-4-6-8s2-8 6-8z" fill="${c2 || WHITE}"/>
  <path d="M58 44h10M78 38h6M96 44h10" stroke="${OUT}" stroke-width="6" stroke-linecap="round"/>
  <path d="M44 84c-2 14 4 26 14 32M116 84c2 14-4 26-14 32" fill="none" stroke="${OUT}" stroke-width="4"/></g>`;
    case 'cowboy':
      return `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M50 54c0-22 10-36 30-36s30 14 30 36z" fill="${c1}"/>
  <path d="M22 58c0-8 18-12 58-12s58 4 58 12-26 14-58 14-58-6-58-14z" fill="${c1}"/>
  <path d="M50 50c18 6 42 6 60 0" fill="none" stroke="${c2 || '#5E3620'}" stroke-width="7"/></g>`;
    case 'headband':
      return `<path d="M42 66c10-8 24-12 38-12s28 4 38 12c-2 8-4 12-6 14-12-8-20-10-32-10s-20 2-32 10c-2-2-4-6-6-14z" fill="${c1}" stroke="${OUT}" stroke-width="5" stroke-linejoin="round"/>`;
    case 'visor':
      return `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M42 64c10-10 24-14 38-14s28 4 38 14c-4 6-6 8-8 10-10-8-18-10-30-10s-20 2-30 10z" fill="${c1}"/>
  <path d="M116 58h24c6 0 8 10 0 12l-26 2z" fill="${c1}"/></g>`;
    default:
      return '';
  }
}

function face(o) {
  const eyes = o.eyewear === 'sunglasses'
    ? `<g stroke="${OUT}" stroke-width="5" stroke-linejoin="round">
  <path d="M46 74h64v6c0 10-6 16-16 16s-14-6-16-12c-2 6-6 12-16 12s-16-6-16-16z" fill="${o.shades || '#2E86C1'}"/>
  <path d="M42 74h76" stroke-linecap="round"/></g>`
    : `<g>
  <ellipse cx="66" cy="80" rx="5.5" ry="6.5" fill="${OUT}"/><ellipse cx="94" cy="80" rx="5.5" ry="6.5" fill="${OUT}"/>
  <circle cx="64" cy="77.5" r="2" fill="${WHITE}"/><circle cx="92" cy="77.5" r="2" fill="${WHITE}"/>
  ${['helmet','cowboy','visor','headband','bandana'].includes(o.hat) ? '' : `<path d="M58 66c5-4 11-4 15-1M87 65c4-3 10-3 15 1" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`}</g>`;
  const mouth = o.mouth === 'open'
    ? `<path d="M66 96c8 0 20 0 28 0 0 10-6 16-14 16s-14-6-14-16z" fill="${OUT}"/><path d="M72 108c4-4 12-4 16 0" fill="#E8607A" stroke="none"/>`
    : `<path d="M66 96c6 10 22 10 28 0" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`;
  return `${eyes}
<g fill="${RED}" opacity="0.25"><ellipse cx="53" cy="94" rx="9" ry="6"/><ellipse cx="107" cy="94" rx="9" ry="6"/></g>
${mouth}`;
}

// Full bust: backpack + shirt + head. o: {skin, hair, hairStyle, shirt, shirt2, hat, hatColor, hatColor2, strap}
function bust(o) {
  const strap = o.strap || YELLOW;
  return `<g stroke-linejoin="round">
  <!-- backpack peeking over the shoulders -->
  <g fill="${o.pack || RED}" stroke="${OUT}" stroke-width="5">
    <rect x="14" y="142" width="27" height="40" rx="12"/><rect x="119" y="142" width="27" height="40" rx="12"/>
  </g>
  ${hairBack(o.hairStyle, o.hair, o.hair2)}
  <path d="M68 108h24v28H68z" fill="${o.skin}" stroke="${OUT}" stroke-width="5"/>
  <!-- shirt -->
  <path d="M26 182c0-30 22-48 54-48s54 18 54 48z" fill="${o.shirt}" stroke="${OUT}" stroke-width="5"/>
  <path d="M62 136c4 10 10 16 18 16s14-6 18-16" fill="${o.shirt2 || WHITE}" stroke="${OUT}" stroke-width="5"/>
  <!-- backpack straps -->
  <g fill="${strap}" stroke="${OUT}" stroke-width="4.5">
    <path d="M52 139c-6 13-8 27-8 43h11c0-17 3-29 8-39z"/>
    <path d="M108 139c6 13 8 27 8 43h-11c0-17-3-29-8-39z"/>
  </g>
  <!-- head -->
  <ellipse cx="44" cy="86" rx="8" ry="10" fill="${o.skin}" stroke="${OUT}" stroke-width="5"/>
  <ellipse cx="116" cy="86" rx="8" ry="10" fill="${o.skin}" stroke="${OUT}" stroke-width="5"/>
  <ellipse cx="80" cy="82" rx="37" ry="39" fill="${o.skin}" stroke="${OUT}" stroke-width="5"/>
  ${hairFront(o.hairStyle, o.hair)}
  ${['bandana','headband','helmet','visor','cowboy'].includes(o.hat) && o.hairStyle !== 'none'
    ? `<g fill="${o.hair}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"><path d="M47 64c-7 9-9 20-6 32 9-5 13-16 13-28z"/><path d="M113 64c7 9 9 20 6 32-9-5-13-16-13-28z"/></g>` : ''}
  ${headwear(o.hat, o.hatColor, o.hatColor2)}
  ${face(o)}
</g>`;
}

module.exports = { write, svgDoc, bust, bust_face: face, OUT, YELLOW, RED, WHITE, ROOT };
