'use strict';
/**
 * gen_transitions.js
 * Génère 10 vidéos de transition thématique (540x960, 30fps, 60 frames, H.264 CRF20)
 * Usage: node gen_transitions.js  (depuis n'importe quel cwd)
 */

const { createCanvas } = require('canvas');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Config ───────────────────────────────────────────────────────────────────
const W = 540, H = 960, FPS = 30, TOTAL_FRAMES = 60;
const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const THEMES_DIR = path.join(__dirname);   // script lives inside assets/themes/

// ─── Palette des thèmes ───────────────────────────────────────────────────────
const THEMES = [
  { name: 'jungle',   bg: '#081508', tm: '#D4B030', hi: '#90FF80' },
  { name: 'desert',   bg: '#301C06', tm: '#E8B838', hi: '#FFE080' },
  { name: 'ocean',    bg: '#040C28', tm: '#50C8F0', hi: '#A0F0FF' },
  { name: 'volcan',   bg: '#180402', tm: '#F08020', hi: '#FFB060' },
  { name: 'nuit',     bg: '#050312', tm: '#A878F0', hi: '#E0B0FF' },
  { name: 'arctique', bg: '#08121E', tm: '#88E0F8', hi: '#C0F8FF' },
  { name: 'cosmos',   bg: '#020008', tm: '#B040F0', hi: '#E0A0FF' },
  { name: 'enchante', bg: '#030A06', tm: '#40F060', hi: '#A0FFC0' },
  { name: 'plage',    bg: '#1C0804', tm: '#F09838', hi: '#FFD080' },
  { name: 'neopolis', bg: '#010510', tm: '#00DDFF', hi: '#C0F0FF' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
/** hex '#RRGGBB' → { r, g, b } */
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** ease-out cubic */
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

/** ease-in cubic */
function easeIn(t) { return t * t * t; }

/** Spring overshoot: settle at 1 with bounce */
function spring(t) {
  // damped sine approximation
  if (t >= 1) return 1;
  const decay = 4.0;
  const freq  = 2.0;
  return 1 - Math.exp(-decay * t) * Math.cos(freq * Math.PI * t);
}

/** Lerp */
function lerp(a, b, t) { return a + (b - a) * t; }

/** Clamp t to [0,1] */
function clamp(t) { return Math.max(0, Math.min(1, t)); }

/** Local progress within [f0, f1] */
function localT(frame, f0, f1) { return clamp((frame - f0) / (f1 - f0)); }

// ─── Block colours per theme (6 block types) ─────────────────────────────────
function blockColors(theme) {
  const c = hexToRgb(theme.tm);
  const h = hexToRgb(theme.hi);
  // generate 6 hue-shifted variants
  return [
    theme.tm,
    theme.hi,
    `rgb(${Math.round(c.r*0.8)},${Math.round(c.g*1.1)},${Math.round(c.b*0.9)})`,
    `rgb(${Math.round(h.r*0.9)},${Math.round(h.g*0.8)},${Math.round(h.b*1.2)})`,
    `rgb(${Math.round(c.r*1.1)},${Math.round(c.g*0.7)},${Math.round(c.b*1.1)})`,
    `rgb(${Math.round(h.r*0.7)},${Math.round(h.g*1.2)},${Math.round(h.b*0.8)})`,
  ];
}

// ─── Draw one isometric block ─────────────────────────────────────────────────
function drawIsoBlock(ctx, cx, cy, s, color) {
  // s = half-size of cube face in iso projection
  const hx = s;        // horizontal half-extent
  const hy = s * 0.5;  // vertical half-extent (iso compression)
  const depth = s * 0.55;

  const c = hexToRgb(color);
  const darker  = `rgb(${Math.round(c.r*0.45)},${Math.round(c.g*0.45)},${Math.round(c.b*0.45)})`;
  const medium  = `rgb(${Math.round(c.r*0.65)},${Math.round(c.g*0.65)},${Math.round(c.b*0.65)})`;

  // Top face (brightest)
  ctx.beginPath();
  ctx.moveTo(cx,      cy - hy);       // top center
  ctx.lineTo(cx + hx, cy);            // right
  ctx.lineTo(cx,      cy + hy);       // bottom center
  ctx.lineTo(cx - hx, cy);            // left
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Left face (medium)
  ctx.beginPath();
  ctx.moveTo(cx - hx, cy);
  ctx.lineTo(cx,      cy + hy);
  ctx.lineTo(cx,      cy + hy + depth);
  ctx.lineTo(cx - hx, cy + depth);
  ctx.closePath();
  ctx.fillStyle = medium;
  ctx.fill();

  // Right face (darkest)
  ctx.beginPath();
  ctx.moveTo(cx + hx, cy);
  ctx.lineTo(cx,      cy + hy);
  ctx.lineTo(cx,      cy + hy + depth);
  ctx.lineTo(cx + hx, cy + depth);
  ctx.closePath();
  ctx.fillStyle = darker;
  ctx.fill();

  // Edge glow
  ctx.strokeStyle = 'rgba(255,255,255,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx,      cy - hy);
  ctx.lineTo(cx + hx, cy);
  ctx.lineTo(cx,      cy + hy);
  ctx.lineTo(cx - hx, cy);
  ctx.closePath();
  ctx.stroke();
}

// ─── Render one frame ─────────────────────────────────────────────────────────
function renderFrame(frame, theme, blocks, colors) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  const cx = W / 2, cy = H / 2;

  // ── Background fill (always) ──────────────────────────────────────────────
  ctx.fillStyle = theme.bg;
  ctx.fillRect(0, 0, W, H);

  // ── Phase 1: Flash blanc (frames 0-12) ───────────────────────────────────
  if (frame < 35) {
    // Iris wipe reveal: draw theme bg under circular clip first
    // (bg already drawn above)
    const irisT = frame < 12 ? 0 : easeOut(localT(frame, 12, 35));
    const irisR = irisT * W * 1.5;

    if (irisR > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
      ctx.clip();

      // Redraw theme bg inside iris (same colour — already there,
      // but we add a subtle radial gradient to give depth)
      const bg = hexToRgb(theme.bg);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, irisR);
      grad.addColorStop(0,   `rgba(${bg.r+20},${bg.g+20},${bg.b+20},1)`);
      grad.addColorStop(1,   theme.bg);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();

      // Glow ring at iris edge
      const glowAlpha = 0.85 * Math.sin(Math.PI * localT(frame, 12, 35));
      const tm = hexToRgb(theme.tm);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, irisR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${tm.r},${tm.g},${tm.b},${glowAlpha})`;
      ctx.lineWidth   = 18;
      ctx.shadowColor = theme.tm;
      ctx.shadowBlur  = 40;
      ctx.stroke();
      ctx.restore();
    }
  } else {
    // After iris fully open: draw themed radial gradient bg
    const bg = hexToRgb(theme.bg);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, W * 1.5);
    grad.addColorStop(0, `rgb(${bg.r+20},${bg.g+20},${bg.b+20})`);
    grad.addColorStop(1, theme.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Phase 1: Flash blanc pulse (frames 0-12) ─────────────────────────────
  if (frame <= 15) {
    const ft = localT(frame, 0, 12);
    // flash: ramp up 0→1 then down 1→0 over frames 0-12, peak at frame 6
    const flashT = frame <= 6
      ? easeOut(localT(frame, 0, 6))
      : 1 - easeIn(localT(frame, 6, 15));
    const alpha = flashT * 0.95;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    ctx.fillRect(0, 0, W, H);
  }

  // ── Phase 3: Blocs iso tombant (frames 35-50) ────────────────────────────
  if (frame >= 35 && frame <= 55) {
    const s = 28; // half-size
    const NUM_BLOCKS = 12;
    const STAGGER = 3; // frames entre chaque bloc

    for (let i = 0; i < NUM_BLOCKS; i++) {
      const startF = 35 + i * STAGGER;
      const endF   = startF + 20; // duration of fall per block
      if (frame < startF) continue;

      const raw = localT(frame, startF, endF);
      const spr = spring(raw);

      const bx = blocks[i].x;
      // final Y position (lower 60% of screen, staggered rows)
      const finalY = H * 0.55 + (i % 4) * 90;
      // start from above screen
      const startY = -80;
      const by = lerp(startY, finalY, spr);

      // alpha fade in
      const alpha = Math.min(1, raw * 4);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawIsoBlock(ctx, bx, by, s, colors[i % colors.length]);
      ctx.restore();
    }
  }

  // ── Phase 4: Fade out (frames 50-60) ─────────────────────────────────────
  if (frame >= 50) {
    const fadeT = easeIn(localT(frame, 50, 60));
    ctx.fillStyle = `rgba(0,0,0,${fadeT})`;
    ctx.fillRect(0, 0, W, H);
  }

  return canvas;
}

// ─── Generate one theme ────────────────────────────────────────────────────────
function generateTheme(theme) {
  console.log(`\n▶  ${theme.name.toUpperCase()}`);

  const themeDir  = path.join(THEMES_DIR, theme.name);
  const framesDir = path.join(themeDir, 'frames_trans');
  const outFile   = path.join(themeDir, 'transition.mp4');

  // Ensure dirs
  fs.mkdirSync(framesDir, { recursive: true });

  // Pre-compute block positions (fixed per theme, random-ish but seeded by index)
  const colors = blockColors(theme);
  const blocks = [];
  for (let i = 0; i < 12; i++) {
    // distribute across width with slight offset pattern
    blocks.push({
      x: 60 + ((i * 113 + 37) % (W - 120)),
    });
  }

  // Render frames
  for (let f = 0; f < TOTAL_FRAMES; f++) {
    const canvas = renderFrame(f, theme, blocks, colors);
    const buf    = canvas.toBuffer('image/png');
    const fname  = path.join(framesDir, `f${String(f).padStart(4,'0')}.png`);
    fs.writeFileSync(fname, buf);
    process.stdout.write(`\r  frame ${f+1}/${TOTAL_FRAMES}`);
  }
  console.log('  — frames OK');

  // Encode with ffmpeg
  const cmd = [
    `"${FFMPEG}"`,
    `-y`,
    `-framerate ${FPS}`,
    `-i "${path.join(framesDir, 'f%04d.png')}"`,
    `-c:v libx264`,
    `-crf 20`,
    `-pix_fmt yuv420p`,
    `-movflags +faststart`,
    `"${outFile}"`
  ].join(' ');

  execSync(cmd, { stdio: 'pipe' });
  console.log(`  — encoded → ${outFile}`);

  // Cleanup frames
  const files = fs.readdirSync(framesDir);
  for (const f of files) fs.unlinkSync(path.join(framesDir, f));
  fs.rmdirSync(framesDir);
  console.log('  — frames nettoyés');

  // Report size
  const stat = fs.statSync(outFile);
  const kb   = (stat.size / 1024).toFixed(1);
  console.log(`  — taille : ${kb} KB`);
  return { name: theme.name, path: outFile, size: stat.size };
}

// ─── Main ──────────────────────────────────────────────────────────────────────
console.log('=== gen_transitions.js ===');
console.log(`Résolution : ${W}×${H}  |  ${FPS}fps  |  ${TOTAL_FRAMES} frames (${(TOTAL_FRAMES/FPS).toFixed(1)}s)`);
console.log(`Thèmes     : ${THEMES.map(t=>t.name).join(', ')}`);
console.log('');

const results = [];
for (const theme of THEMES) {
  results.push(generateTheme(theme));
}

console.log('\n══════════════════════════════════════════');
console.log('  RÉSUMÉ — 10 MP4 générés');
console.log('══════════════════════════════════════════');
let total = 0;
for (const r of results) {
  const kb = (r.size / 1024).toFixed(1);
  console.log(`  ${r.name.padEnd(10)} ${kb.padStart(8)} KB   ${r.path}`);
  total += r.size;
}
console.log(`${''.padEnd(42,'─')}`);
console.log(`  ${'TOTAL'.padEnd(10)} ${(total/1024).toFixed(1).padStart(8)} KB`);
console.log('══════════════════════════════════════════');
