const fs = require('fs');
const { write, svgDoc, OUT, YELLOW, RED, WHITE, ROOT } = require('./lib.cjs');

/* maskable app icon — everything inside the centred 80% safe zone */
write('icons/app-icon-maskable.svg', svgDoc({
  w: 512, h: 512, title: 'App icon (maskable, safe-zone padded)',
  body: `<rect width="512" height="512" fill="${YELLOW}"/>
<circle cx="256" cy="256" r="196" fill="#FFD24A"/>
<circle cx="256" cy="256" r="196" fill="none" stroke="${OUT}" stroke-width="10" opacity="0.25"/>
<g transform="translate(256 252) scale(1.42)"><path d="M0-100 11-64 33-68 26-44 56-52 49-32 89-8 78 2 84 18 46 10 50 24 20 52 28 60 8 64 8 100-8 100-8 64-28 60-20 52-50 24-46 10-84 18-78 2-89-8-49-32-56-52-26-44-33-68-11-64Z" fill="${RED}" stroke="${OUT}" stroke-width="12" stroke-linejoin="round"/></g>`,
}));

/* ------------------------------------------------------------------ */

const list = d => fs.readdirSync(`${ROOT}/${d}`).filter(f => f.endsWith('.svg')).sort();
const key = f => f.replace(/\.svg$/, '');

const avatarFiles = list('avatars');
const kids = avatarFiles.filter(f => f.startsWith('kid-'));
const ghosts = avatarFiles.filter(f => f.startsWith('ghost-'));
const hosts = avatarFiles.filter(f => f.startsWith('host'));
const badges = list('badges');
const mapFiles = list('map');
const stickers = mapFiles.filter(f => f.startsWith('sticker-'));
const mapCore = mapFiles.filter(f => !f.startsWith('sticker-'));
const ui = list('ui');
const iconSvgs = list('icons');

const entry = (k, p) => `  '${k}': new URL('./${p}', import.meta.url).href,`;

const block = (name, type, docs, rows) =>
  `${docs}\nexport const ${name} = {\n${rows.join('\n')}\n} as const;\nexport type ${type} = keyof typeof ${name};\n`;

const ts = `/**
 * Asset export map — Workstream E (art & assets).
 *
 * Every value is a build-time URL produced by \`new URL(..., import.meta.url)\`,
 * which Vite statically rewrites and includes in the bundle (so the PWA service
 * worker precaches them for offline play). Import from here, never by raw path:
 *
 *   import { avatars, badges, ui } from '../../assets';
 *   <img src={avatars['kid-3']} alt="" />
 *
 * Style: bright flat cartoon, chunky #1A1A1A outlines, Amazing Race palette.
 * All artwork is hand-authored SVG with no external font or network dependency.
 */

export const palette = {
  yellow: '#FFC20E',
  red: '#DA291C',
  ink: '#1A1A1A',
  white: '#FFFFFF',
  sky: '#7FD4F5',
  skyPale: '#BFEAFB',
  grass: '#3E8E2E',
  grassPale: '#A8E6A0',
  water: '#4FA3D9',
  paper: '#F6ECD2',
} as const;

${block('avatars', 'AvatarId',
    '/** Six kid racers the player picks from during onboarding. */',
    kids.map(f => entry(key(f), `avatars/${f}`)))}
${block('ghostAvatars', 'GhostAvatarId',
    '/** Rival team portraits. Keys match `GhostTeam.id` / `avatarId` in src/types.ts. */',
    ghosts.map(f => entry(key(f).replace('ghost-', ''), `avatars/${f}`)))}
${block('host', 'HostPose',
    '/** Race host, two poses — `idle` for clue/ceremony dialogue, `cheer` for wins. */',
    [entry('idle', 'avatars/host.svg'), entry('cheer', 'avatars/host-cheer.svg')])}
${block('badges', 'BadgeId',
    '/** All badge art. Keys are the canonical badge ids awarded by Workstream D. */',
    badges.map(f => entry(key(f), `badges/${f}`)))}
${block('map', 'MapAssetId',
    '/** Souvenir route map. See MAP_NODE_IDS / MAP_SEGMENT_IDS for the DOM hooks. */',
    mapCore.map(f => entry(key(f), `map/${f}`)))}
${block('stickers', 'StickerId',
    '/** City stickers earned at each pit stop and dropped onto the route map. */',
    stickers.map(f => entry(key(f).replace('sticker-', ''), `map/${f}`)))}
${block('ui', 'UiAssetId',
    '/** UI kit: envelopes, pit-stop mat, rating leaf, confetti, decorations. */',
    ui.map(f => entry(key(f), `ui/${f}`)))}
${block('icons', 'IconAssetId',
    '/** App icons. PNG exports live next to these for the web manifest. */',
    [...iconSvgs.map(f => entry(key(f), `icons/${f}`)),
      entry('apple-touch-icon', 'icons/apple-touch-icon.png'),
      entry('icon-192', 'icons/icon-192.png'),
      entry('icon-512', 'icons/icon-512.png'),
      entry('icon-512-maskable', 'icons/icon-512-maskable.png'),
      entry('icon-192-maskable', 'icons/icon-192-maskable.png')])}
/**
 * route-map.svg exposes one \`#segment-N\` and one \`#node-N\` per leg (N = 0…8).
 * Add \`.locked\` to dim, \`.done\` to turn the road red, \`.current\` to pulse the
 * node. \`#sticker-slot-N\` is an empty anchor \`<g>\` positioned just above each
 * node — drop a city sticker in there when the leg is completed.
 */
export const MAP_NODE_IDS = [
${Array.from({ length: 9 }, (_, i) => `  'node-${i}',`).join('\n')}
] as const;

export const MAP_SEGMENT_IDS = [
${Array.from({ length: 9 }, (_, i) => `  'segment-${i}',`).join('\n')}
] as const;

/** Which city sticker a leg unlocks (leg id -> sticker key). */
export const STICKER_BY_LEG: Record<number, StickerId> = {
  0: 'home',
  1: 'kingston',
  2: 'montreal',
  3: 'montreal',
  4: 'montreal',
  5: 'quebec',
  6: 'quebec',
  7: 'brockville',
  8: 'home',
};

/** Suggested PWA manifest colours (also in icons/splash-theme.json). */
export const theme = {
  themeColor: '#DA291C',
  backgroundColor: '#FFC20E',
} as const;

const assets = { avatars, ghostAvatars, host, badges, map, stickers, ui, icons };
export default assets;
`;

fs.writeFileSync(`${ROOT}/index.ts`, ts);
console.log('index.ts', (ts.length / 1024).toFixed(1) + ' KB');

/* ------------------------------ preview.html ------------------------------ */

const card = (label, src, cls = '') =>
  `      <figure class="card ${cls}"><div class="art"><img src="${src}" alt="${label}"></div><figcaption>${label}</figcaption></figure>`;

const section = (title, note, cards) =>
  `  <section>\n    <h2>${title}</h2>\n    <p class="note">${note}</p>\n    <div class="grid">\n${cards.join('\n')}\n    </div>\n  </section>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Art pack — The Amazing Race Canada: Yassa Edition</title>
<style>
  :root { --ink:#1A1A1A; --yellow:#FFC20E; --red:#DA291C; --paper:#F6ECD2; }
  * { box-sizing:border-box; }
  body { margin:0; padding:0 0 64px; font:15px/1.5 -apple-system,BlinkMacSystemFont,"Helvetica Neue",Arial,sans-serif;
         color:var(--ink); background:#FAF7F0; }
  header { background:var(--yellow); border-bottom:6px solid var(--ink); padding:22px 28px; }
  header h1 { margin:0; font-size:24px; letter-spacing:.5px; }
  header p { margin:6px 0 0; font-size:14px; }
  header .stripes { display:flex; height:10px; margin-top:14px; border:3px solid var(--ink); border-radius:6px; overflow:hidden; }
  header .stripes i { flex:1; }
  section { max-width:1180px; margin:34px auto 0; padding:0 28px; }
  h2 { font-size:19px; margin:0 0 2px; border-left:8px solid var(--red); padding-left:10px; }
  .note { margin:0 0 16px 18px; color:#6b6659; font-size:13px; }
  .grid { display:grid; gap:16px; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); }
  .card { margin:0; background:#fff; border:3px solid var(--ink); border-radius:14px; overflow:hidden; }
  .card .art { display:flex; align-items:center; justify-content:center; height:150px; padding:12px; background:#fff; }
  .card.wide { grid-column:1 / -1; }
  .card.wide .art { height:auto; }
  .card img { max-width:100%; max-height:100%; display:block; }
  figcaption { font:600 12px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace; padding:8px 10px;
               border-top:3px solid var(--ink); background:var(--paper); word-break:break-all; }
  .swatches { display:flex; flex-wrap:wrap; gap:10px; }
  .sw { width:110px; border:3px solid var(--ink); border-radius:10px; overflow:hidden; font:600 11px/1 ui-monospace,monospace; }
  .sw b { display:block; height:46px; }
  .sw span { display:block; padding:6px; background:#fff; }
  body.dark { background:#22262b; color:#f2efe6; }
  body.dark .card .art { background:#f4f1e8; }
  .toggle { position:fixed; right:18px; bottom:18px; z-index:9; border:3px solid var(--ink); background:var(--yellow);
            border-radius:999px; padding:10px 18px; font:600 13px/1 sans-serif; cursor:pointer; }
</style>
</head>
<body>
<header>
  <h1>Art pack — The Amazing Race Canada: Yassa Edition</h1>
  <p>Workstream E. Hand-authored SVG, bright flat cartoon, chunky outlines, race yellow / red / black.
     Every caption is the key exported from <code>assets/index.ts</code>.</p>
  <div class="stripes"><i style="background:#DA291C"></i><i style="background:#fff"></i><i style="background:#1A1A1A"></i><i style="background:#fff"></i><i style="background:#DA291C"></i></div>
</header>

${section('Palette', 'Shared across every asset.',
  [['yellow', '#FFC20E'], ['red', '#DA291C'], ['ink', '#1A1A1A'], ['white', '#FFFFFF'], ['sky', '#7FD4F5'],
   ['grass', '#3E8E2E'], ['water', '#4FA3D9'], ['paper', '#F6ECD2']]
    .map(([n, c]) => `      <div class="sw"><b style="background:${c}"></b><span>${n}<br>${c}</span></div>`))
    .replace('class="grid"', 'class="swatches"')}

${section('Kid avatars <code>avatars[…]</code>', 'Six racers to pick from in onboarding.',
    kids.map(f => card(key(f), `avatars/${f}`)))}

${section('Ghost teams <code>ghostAvatars[…]</code>', 'Rival pairs — keys match GhostTeam.id.',
    ghosts.map(f => card(key(f).replace('ghost-', ''), `avatars/${f}`)))}

${section('Host <code>host[…]</code>', 'Two poses for clue reveals and ceremonies.',
    [card('idle', 'avatars/host.svg'), card('cheer', 'avatars/host-cheer.svg')])}

${section('Badges <code>badges[…]</code>', 'One per leg plus the four specials.',
    badges.map(f => card(key(f), `badges/${f}`)))}

${section('Route map <code>map[…]</code>', 'IDs: #segment-0…8, #node-0…8, #sticker-slot-0…8. Classes: .locked .done .current.',
    mapCore.map(f => card(key(f), `map/${f}`, 'wide')))}

${section('City stickers <code>stickers[…]</code>', 'Revealed at each pit stop, dropped onto the map.',
    stickers.map(f => card(key(f).replace('sticker-', ''), `map/${f}`)))}

${section('UI kit <code>ui[…]</code>', 'maple-leaf.svg fills from currentColor so ratings can colour it.',
    ui.map(f => card(key(f), `ui/${f}`)))}

${section('Icons <code>icons[…]</code>', 'SVG source plus PNG exports for the web manifest and Add to Home Screen.',
    [...iconSvgs.map(f => card(key(f), `icons/${f}`)),
      card('apple-touch-icon (180)', 'icons/apple-touch-icon.png'),
      card('icon-192', 'icons/icon-192.png'),
      card('icon-512', 'icons/icon-512.png'),
      card('icon-512-maskable', 'icons/icon-512-maskable.png'),
      card('icon-192-maskable', 'icons/icon-192-maskable.png')])}

<button class="toggle" onclick="document.body.classList.toggle('dark')">Toggle dark backdrop</button>
</body>
</html>
`;

fs.writeFileSync(`${ROOT}/preview.html`, html);
console.log('preview.html', (html.length / 1024).toFixed(1) + ' KB');
