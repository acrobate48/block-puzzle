# Block Puzzle — UI Icon Assets

Premium SVG icons for the game UI. All icons are self-contained with embedded gradients, filters, and glow effects.

---

## Icon Catalogue

| File | Size | Description | Usage |
|------|------|-------------|-------|
| `bomb.svg` | 64×64 | Dark metallic bomb with fuse cord, gold spark, drop shadow | Bomb bonus piece overlay; loaded via `_loadIcon('bomb', ...)` and drawn with `drawBombIconFast` |
| `star.svg` | 64×64 | 5-point gold star with outer glow, black outline, shine pass | Star cell overlay (bonus cells) |
| `x2.svg` | 64×64 | "×2" text in Impact font, gold gradient, dark outline, shine | Double-points bonus overlay; loaded via `_loadIcon('x2', ...)` |
| `trophy.svg` | 64×64 | Classic trophy cup, gold gradient, star emblem, base pedestal | Leaderboard / high-score record button (replaces 🏆) |
| `fire.svg` | 64×64 | Orange/red flame with yellow inner core, glow effect, clean paths | Combo streak indicator (replaces 🔥) |
| `speed_turbo.svg` | 64×64 | Electric yellow lightning bolt, blue-white glow halo | TURBO speed mode indicator |
| `skull.svg` | 64×64 | Stylised skull, green parasite glow (#00FF60), dark base | Parasite piece icon (replaces ☠) |
| `heart.svg` | 64×64 | Red heart with pink shine, specular highlight, glow | Second-chance lives button ("SECONDE CHANCE") |
| `pause.svg` | 60×60 | Two blue-accent bars on dark circle background | In-game pause button |
| `sound_on.svg` | 40×40 | Speaker cone + three blue sound wave arcs | Sound toggle — ON state |
| `sound_off.svg` | 40×40 | Dimmed speaker cone + red X cross | Sound toggle — OFF state |

---

## JavaScript Integration

Icons are preloaded at startup in `js/render.js` via the `_uiIcons` / `_uiIconsReady` system:

```js
// Preloaded automatically at module top-level:
_loadIcon('bomb',   'assets/ui/bomb.svg');
_loadIcon('star',   'assets/ui/star.svg');
_loadIcon('x2',     'assets/ui/x2.svg');
_loadIcon('fire',   'assets/ui/fire.svg');
_loadIcon('trophy', 'assets/ui/trophy.svg');
```

### Drawing a preloaded icon

```js
// Fast path: uses preloaded Image; falls back to canvas-drawn version
drawBombIconFast(ctx, cx, cy, sz);

// Generic helper for any loaded icon:
if (_uiIconsReady['star'] && _uiIcons['star']) {
  ctx.drawImage(_uiIcons['star'], x - sz/2, y - sz/2, sz, sz);
}
```

### Loading additional icons on demand

```js
_loadIcon('skull', 'assets/ui/skull.svg');
_loadIcon('heart', 'assets/ui/heart.svg');
_loadIcon('pause', 'assets/ui/pause.svg');
_loadIcon('sound_on',  'assets/ui/sound_on.svg');
_loadIcon('sound_off', 'assets/ui/sound_off.svg');
_loadIcon('speed_turbo', 'assets/ui/speed_turbo.svg');
_loadIcon('trophy',  'assets/ui/trophy.svg');
```

---

## Design Notes

- All icons use **embedded SVG gradients and filters** — no external dependencies.
- Icons are designed to render crisply at **HiDPI / Retina** resolutions because the canvas scales the SVG on draw.
- Glow effects are achieved with `feGaussianBlur`-based `feMerge` or `feDropShadow` filters, keeping the file sizes small.
- The `fire.svg` uses clean bezier paths — suitable for CSS/SMIL animation if needed.
- Colour palette is tuned to match the game's dark canvas aesthetic (`#40D8FF` accents, gold tones `#FFD700`→`#FFA000`, parasite green `#00FF60`).
