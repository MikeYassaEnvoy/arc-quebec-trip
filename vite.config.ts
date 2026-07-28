import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * `content/` (Workstream B + D) and `assets/` (Workstream E) live at the repo root
 * rather than inside `public/`, so this plugin:
 *   - serves them at /content/** and /assets/** during `vite dev`
 *   - copies them into dist/ at build time (before vite-plugin-pwa's closeBundle
 *     runs its precache glob, so every JSON/SVG/PNG gets precached).
 */
/**
 * Never serve or ship these subpaths: content/reference/ holds the family's
 * personal itinerary (hotel confirmation numbers). It stays on disk for
 * authoring but must not reach the dev server, dist/, or the SW precache.
 */
const PRIVATE_SUBPATHS = ['content/reference'];

const isPrivatePath = (rel: string) =>
  PRIVATE_SUBPATHS.some((p) => rel === p || rel.startsWith(`${p}/`));

function serveRootStaticDirs(dirs: string[]): Plugin {
  const mime: Record<string, string> = {
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp3': 'audio/mpeg',
    '.md': 'text/markdown; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
  };

  const copyDir = (from: string, to: string) => {
    if (!fs.existsSync(from)) return;
    fs.cpSync(from, to, {
      recursive: true,
      filter: (src) => !isPrivatePath(path.relative(root, src).split(path.sep).join('/')),
    });
  };

  return {
    name: 'race-serve-root-static-dirs',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const [url, query] = (req.url || '').split('?');
        // Module requests must reach Vite's transform pipeline: TS sources under
        // assets/ (index.ts) and any ?raw / ?import / ?url style asset imports.
        if (query !== undefined || url.endsWith('.ts') || url.endsWith('.tsx')) return next();
        const hit = dirs.find((d) => url.startsWith(`/${d}/`));
        if (!hit) return next();
        const rel = decodeURIComponent(url.slice(1));
        if (isPrivatePath(rel)) {
          res.statusCode = 404;
          return res.end('Not found');
        }
        const abs = path.join(root, rel);
        if (!abs.startsWith(path.join(root, hit)) || !fs.existsSync(abs) || fs.statSync(abs).isDirectory()) {
          return next();
        }
        res.setHeader('Content-Type', mime[path.extname(abs).toLowerCase()] ?? 'application/octet-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.end(fs.readFileSync(abs));
      });
    },
    // preview server needs the same treatment only if dist copy failed; dist copy handles it.
    writeBundle(options) {
      const outDir = options.dir ?? path.join(root, 'dist');
      for (const d of dirs) copyDir(path.join(root, d), path.join(outDir, d));
    },
  };
}

export default defineConfig({
  // Override with VITE_BASE=/repo-name/ when deploying to a subpath (e.g. GitHub Pages).
  base: process.env.VITE_BASE ?? '/',
  plugins: [
    react(),
    serveRootStaticDirs(['content', 'assets']),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'favicon.svg'],
      manifest: false, // we ship public/manifest.webmanifest ourselves (Workstream E may restyle it)
      workbox: {
        globPatterns: ['**/*.{js,css,html,json,svg,png,jpg,jpeg,webp,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
    // Bundles go to dist/build/ so that dist/assets/ stays exactly Workstream E's art
    // directory (copied from the repo root) with no chance of a filename collision.
    assetsDir: 'build',
  },
  server: { host: true },
});
