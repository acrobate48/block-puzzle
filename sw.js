'use strict';
// ─── SERVICE WORKER — Block Puzzle Premium ────────────────────────────────────
// Strategy:
//   STATIC cache → cache-first (JS, SVG, HTML — precached on install)
//   VIDEO cache  → cache-first (MP4 — cached on first play, then always local)
// BASE is resolved dynamically from the SW scope, works on any hosting path.

const SW_VERSION = '1';
const CACHE_STATIC = 'bp-static-v' + SW_VERSION;
const CACHE_VIDEO  = 'bp-video-v'  + SW_VERSION;

// Paths relative to the SW scope (works on GitHub Pages subpaths too)
const STATIC_PATHS = [
  '',           // root / index.html
  'index.html',
  'config.js',
  // JS modules
  'js/audio.js',
  'js/canvas.js',
  'js/constants.js',
  'js/engine.js',
  'js/firebase.js',
  'js/game.js',
  'js/input.js',
  'js/logic.js',
  'js/loop.js',
  'js/menu.js',
  'js/modes.js',
  'js/render.js',
  'js/settings.js',
  'js/state.js',
  'js/ui.js',
  // Icons & manifest
  'assets/icons/favicon.svg',
  'assets/icons/apple-touch-icon.svg',
  'assets/icons/icon-192.svg',
  'assets/icons/icon-512.svg',
  'assets/icons/manifest.json',
  // Theme SVGs
  'assets/themes/jungle/bg.svg',
  'assets/themes/jungle/icon.svg',
  'assets/themes/jungle/hud_border.svg',
  'assets/themes/jungle/grid_corners.svg',
  'assets/themes/desert/bg.svg',
  'assets/themes/desert/icon.svg',
  'assets/themes/desert/hud_border.svg',
  'assets/themes/desert/grid_corners.svg',
  'assets/themes/ocean/bg.svg',
  'assets/themes/ocean/icon.svg',
  'assets/themes/ocean/hud_border.svg',
  'assets/themes/ocean/grid_corners.svg',
  'assets/themes/volcan/bg.svg',
  'assets/themes/volcan/icon.svg',
  'assets/themes/volcan/hud_border.svg',
  'assets/themes/volcan/grid_corners.svg',
  'assets/themes/nuit/bg.svg',
  'assets/themes/nuit/icon.svg',
  'assets/themes/nuit/hud_border.svg',
  'assets/themes/nuit/grid_corners.svg',
  'assets/themes/arctique/bg.svg',
  'assets/themes/arctique/icon.svg',
  'assets/themes/arctique/hud_border.svg',
  'assets/themes/arctique/grid_corners.svg',
  'assets/themes/cosmos/bg.svg',
  'assets/themes/cosmos/icon.svg',
  'assets/themes/cosmos/hud_border.svg',
  'assets/themes/cosmos/grid_corners.svg',
  'assets/themes/enchante/bg.svg',
  'assets/themes/enchante/icon.svg',
  'assets/themes/enchante/hud_border.svg',
  'assets/themes/enchante/grid_corners.svg',
  'assets/themes/plage/bg.svg',
  'assets/themes/plage/icon.svg',
  'assets/themes/plage/hud_border.svg',
  'assets/themes/plage/grid_corners.svg',
  'assets/themes/neopolis/bg.svg',
  'assets/themes/neopolis/icon.svg',
  'assets/themes/neopolis/hud_border.svg',
  'assets/themes/neopolis/grid_corners.svg',
  // Legacy flat-path SVG backgrounds (fallback paths used in canvas.js)
  'assets/backgrounds/bg_jungle.svg',
  'assets/backgrounds/bg_desert.svg',
  'assets/backgrounds/bg_ocean.svg',
  'assets/backgrounds/bg_volcan.svg',
  'assets/backgrounds/bg_nuit.svg',
  'assets/backgrounds/bg_arctique.svg',
  'assets/backgrounds/bg_cosmos.svg',
  'assets/backgrounds/bg_enchante.svg',
  'assets/backgrounds/bg_plage.svg',
  'assets/backgrounds/bg_neopolis.svg',
  // Skin SVGs
  'assets/skins/pierre/cell.svg',   'assets/skins/pierre/preview.svg',
  'assets/skins/cristal/cell.svg',  'assets/skins/cristal/preview.svg',
  'assets/skins/bois/cell.svg',     'assets/skins/bois/preview.svg',
  'assets/skins/metal/cell.svg',    'assets/skins/metal/preview.svg',
  'assets/skins/marbre/cell.svg',   'assets/skins/marbre/preview.svg',
  'assets/skins/candy/cell.svg',    'assets/skins/candy/preview.svg',
  'assets/skins/glace/cell.svg',    'assets/skins/glace/preview.svg',
  'assets/skins/feu/cell.svg',      'assets/skins/feu/preview.svg',
  'assets/skins/neon/cell.svg',     'assets/skins/neon/preview.svg',
  'assets/skins/galaxie/cell.svg',  'assets/skins/galaxie/preview.svg',
  // UI icons & badges
  'assets/ui/achievement_1.svg',  'assets/ui/achievement_2.svg',
  'assets/ui/achievement_3.svg',  'assets/ui/achievement_4.svg',
  'assets/ui/achievement_5.svg',  'assets/ui/achievement_6.svg',
  'assets/ui/achievement_7.svg',  'assets/ui/achievement_8.svg',
  'assets/ui/achievement_9.svg',  'assets/ui/achievement_10.svg',
  'assets/ui/trophy.svg',
  'assets/ui/trophy_1k.svg',   'assets/ui/trophy_5k.svg',
  'assets/ui/trophy_10k.svg',  'assets/ui/trophy_50k.svg',
  'assets/ui/trophy_100k.svg',
  'assets/ui/medal_gold.svg',  'assets/ui/medal_silver.svg',  'assets/ui/medal_bronze.svg',
  'assets/ui/badge_survie.svg',    'assets/ui/badge_chrono.svg',
  'assets/ui/badge_zen.svg',       'assets/ui/badge_contraintes.svg',
  'assets/ui/badge_histoire.svg',  'assets/ui/badge_choix.svg',
  'assets/ui/bomb.svg',       'assets/ui/combo_fire.svg',  'assets/ui/fire.svg',
  'assets/ui/heart.svg',      'assets/ui/lightning.svg',   'assets/ui/pause.svg',
  'assets/ui/pause_icon.svg', 'assets/ui/skull.svg',       'assets/ui/sound_off.svg',
  'assets/ui/sound_on.svg',   'assets/ui/speed_turbo.svg', 'assets/ui/star.svg',
  'assets/ui/x2.svg',
];

// ── Install: precache all static assets ───────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const base = self.registration.scope; // e.g. "https://user.github.io/repo/"
    const cache = await caches.open(CACHE_STATIC);
    // Cache each file individually — one failure won't block the rest
    await Promise.allSettled(
      STATIC_PATHS.map(p => cache.add(base + p).catch(() => {}))
    );
    await self.skipWaiting();
  })());
});

// ── Activate: delete stale caches from previous SW versions ──────────────────
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter(k => k !== CACHE_STATIC && k !== CACHE_VIDEO).map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

// ── Fetch: cache-first for same-origin requests ───────────────────────────────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Skip cross-origin (Firebase, CDN scripts)
  if (url.origin !== self.location.origin) return;

  const isVideo = url.pathname.endsWith('.mp4');
  const cacheName = isVideo ? CACHE_VIDEO : CACHE_STATIC;

  e.respondWith((async () => {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    try {
      const response = await fetch(e.request);
      if (response && response.status === 200) {
        cache.put(e.request, response.clone()); // store for next time
      }
      return response;
    } catch {
      return cached ?? new Response('', {status: 503});
    }
  })());
});
