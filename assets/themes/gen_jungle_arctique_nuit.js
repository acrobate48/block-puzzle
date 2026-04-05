'use strict';
// ============================================================
//  Générateur de fonds animés — Jungle / Arctique / Nuit
//  540×960 px — 30 fps — 180 frames (6 s en boucle) — H.264
// ============================================================
const { createCanvas } = require('c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/node_modules/canvas');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const W = 540, H = 960, FPS = 30, FRAMES = 180;
const THEMES_DIR = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/themes';

// ─── utilitaires ─────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function rnd(a, b)     { return a + Math.random() * (b - a); }
function rndInt(a, b)  { return Math.floor(rnd(a, b + 1)); }
function seededRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ─── encode ──────────────────────────────────────────────────
function encodeVideo(framesDir, outMp4) {
  const cmd = `"${FFMPEG}" -y -framerate ${FPS} -i "${framesDir}/frame%04d.png" `
    + `-c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart "${outMp4}"`;
  console.log('  [ffmpeg] encoding…');
  execSync(cmd, { stdio: 'inherit' });
}

function clearFrames(framesDir) {
  fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
  fs.rmdirSync(framesDir);
}

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function saveFrame(canvas, framesDir, i) {
  const buf = canvas.toBuffer('image/png');
  const name = `frame${String(i).padStart(4, '0')}.png`;
  fs.writeFileSync(path.join(framesDir, name), buf);
}

// ════════════════════════════════════════════════════════════
//  THÈME 1 — JUNGLE
// ════════════════════════════════════════════════════════════
function generateJungle() {
  console.log('\n=== JUNGLE ===');
  const framesDir = path.join(THEMES_DIR, 'jungle', 'frames');
  const outMp4    = path.join(THEMES_DIR, 'jungle', 'bg.mp4');
  ensureDir(framesDir);

  const rng = seededRng(42);

  // ── pluie tropicale ──────────────────────────────────────
  const raindrops = Array.from({ length: 80 }, () => ({
    x:   rng() * W,
    y:   rng() * H,
    len: rng() * 4 + 2,        // 2–6 px
    spd: rng() * 6 + 8,        // px/frame
    op:  rng() * 0.2 + 0.4,    // 0.4–0.6
  }));

  // ── feuilles tombantes ───────────────────────────────────
  const leaves = Array.from({ length: 12 }, (_, i) => ({
    x:    rng() * W,
    y:    rng() * H,
    spd:  rng() * 1.5 + 0.8,
    rot:  rng() * Math.PI * 2,
    rotS: (rng() - 0.5) * 0.12,
    sw:   rng() * 0.04 + 0.02,  // swing horizontal
    phase: rng() * Math.PI * 2,
    dark: rng() > 0.5,
  }));

  // ── lucioles ─────────────────────────────────────────────
  const fireflies = Array.from({ length: 30 }, () => ({
    x:     rng() * W,
    y:     rng() * H * 0.7 + H * 0.15,
    baseX: rng() * W,
    baseY: rng() * H * 0.7 + H * 0.15,
    ampX:  rng() * 30 + 10,
    ampY:  rng() * 20 + 8,
    freqX: rng() * 0.04 + 0.02,
    freqY: rng() * 0.03 + 0.015,
    phase: rng() * Math.PI * 2,
    blinkPhase: rng() * Math.PI * 2,
    r:     rng() * 2 + 1,
    green: rng() > 0.4,
  }));

  // ── rayons ───────────────────────────────────────────────
  const rays = Array.from({ length: 5 }, (_, i) => ({
    x:     80 + i * 100,
    w:     rng() * 30 + 20,
    phase: rng() * Math.PI * 2,
    freq:  rng() * 0.03 + 0.015,
  }));

  // ── feuillage bords ──────────────────────────────────────
  const foliage = [];
  for (let i = 0; i < 18; i++) {
    const side = i < 9 ? 'left' : 'right';
    foliage.push({
      x:  side === 'left' ? rng() * 80 - 20 : W - rng() * 80 + 20,
      y:  rng() * H,
      r:  rng() * 40 + 20,
      op: rng() * 0.5 + 0.4,
    });
  }

  for (let f = 0; f < FRAMES; f++) {
    const T = f / FPS;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // fond gradient
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0,    '#081508');
    grad.addColorStop(0.6,  '#0F2310');
    grad.addColorStop(1,    '#122814');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // brouillard sol
    const fogGrad = ctx.createLinearGradient(0, H * 0.75, 0, H);
    fogGrad.addColorStop(0, 'rgba(60,120,50,0)');
    fogGrad.addColorStop(1, 'rgba(60,120,50,0.18)');
    ctx.fillStyle = fogGrad;
    ctx.fillRect(0, H * 0.75, W, H * 0.25);

    // rayons divins
    for (const ray of rays) {
      const op = 0.04 + 0.08 * (0.5 + 0.5 * Math.sin(T * ray.freq * Math.PI * 2 + ray.phase));
      const rg = ctx.createLinearGradient(0, 0, 0, H * 0.65);
      rg.addColorStop(0, `rgba(212,176,48,${op})`);
      rg.addColorStop(1, 'rgba(212,176,48,0)');
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(ray.x - ray.w / 2, 0);
      ctx.lineTo(ray.x + ray.w / 2, 0);
      ctx.lineTo(ray.x + ray.w, H * 0.65);
      ctx.lineTo(ray.x - ray.w, H * 0.65);
      ctx.closePath();
      ctx.fillStyle = rg;
      ctx.fill();
      ctx.restore();
    }

    // feuillage silhouette
    for (const fl of foliage) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(5,18,5,${fl.op})`;
      ctx.fill();
      ctx.restore();
    }

    // pluie tropicale
    ctx.save();
    for (const d of raindrops) {
      const cx = ((d.x + f * 0.8) % (W + 20)) - 10;
      const cy = ((d.y + f * d.spd) % (H + 10));
      ctx.strokeStyle = `rgba(160,220,200,${d.op})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 1.5, cy + d.len);
      ctx.stroke();
    }
    ctx.restore();

    // feuilles tombantes
    for (const lf of leaves) {
      const ly = ((lf.y + f * lf.spd) % (H + 20));
      const lx = lf.x + Math.sin(T * lf.sw * Math.PI * 2 + lf.phase) * 25;
      const rot = lf.rot + f * lf.rotS;
      ctx.save();
      ctx.translate(lx % W, ly);
      ctx.rotate(rot);
      ctx.scale(1, 1.75);
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 7, 0, 0, Math.PI * 2);
      ctx.fillStyle = lf.dark ? 'rgba(20,50,10,0.85)' : 'rgba(40,80,20,0.75)';
      ctx.fill();
      ctx.restore();
    }

    // lucioles
    for (const ff of fireflies) {
      const ffx = ff.baseX + Math.sin(T * ff.freqX * Math.PI * 2 + ff.phase) * ff.ampX;
      const ffy = ff.baseY + Math.cos(T * ff.freqY * Math.PI * 2 + ff.phase) * ff.ampY;
      const blink = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(T * 3 + ff.blinkPhase));
      const col = ff.green ? `rgba(120,255,80,${blink})` : `rgba(255,238,80,${blink})`;
      ctx.save();
      ctx.shadowColor = ff.green ? '#80FF60' : '#FFEE80';
      ctx.shadowBlur  = 15 * blink;
      ctx.beginPath();
      ctx.arc(ffx, ffy, ff.r, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.restore();
    }

    if (f % 30 === 0) process.stdout.write(`  jungle frame ${f}/${FRAMES}\r`);
    saveFrame(canvas, framesDir, f);
  }
  console.log('\n  frames done, encoding…');
  encodeVideo(framesDir, outMp4);
  clearFrames(framesDir);
  console.log('  jungle OK →', outMp4);
}

// ════════════════════════════════════════════════════════════
//  THÈME 2 — ARCTIQUE
// ════════════════════════════════════════════════════════════
function generateArctique() {
  console.log('\n=== ARCTIQUE ===');
  const framesDir = path.join(THEMES_DIR, 'arctique', 'frames');
  const outMp4    = path.join(THEMES_DIR, 'arctique', 'bg.mp4');
  ensureDir(framesDir);

  const rng = seededRng(77);

  // ── étoiles fixes ────────────────────────────────────────
  const stars = Array.from({ length: 150 }, () => ({
    x:     rng() * W,
    y:     rng() * H * 0.65,
    r:     rng() * 1.2 + 0.3,
    twinkPhase: rng() * Math.PI * 2,
    twinkFreq:  rng() * 2 + 1,
  }));

  // ── neige ─────────────────────────────────────────────────
  const flakes = Array.from({ length: 80 }, () => ({
    x:   rng() * W,
    y:   rng() * H,
    r:   rng() * 2.5 + 0.5,
    spd: rng() * 1.5 + 0.5,
    drift: (rng() - 0.5) * 0.8,
    arms: rng() > 0.65,  // big flake with arms
  }));

  // ── cristaux hexagonaux ───────────────────────────────────
  const crystals = Array.from({ length: 5 }, () => ({
    x:      rng() * W,
    y:      rng() * H * 0.6,
    size:   rng() * 25 + 18,
    rotSpd: (rng() - 0.5) * 0.008,
    rot:    rng() * Math.PI,
    driftX: (rng() - 0.5) * 0.3,
    driftY: rng() * 0.15 + 0.05,
    op:     rng() * 0.2 + 0.1,
  }));

  // ── rideaux aurore ────────────────────────────────────────
  // 4 rideaux : vert, cyan, bleu, violet
  const auroraColors = [
    { r: 0,   g: 255, b: 128 },  // vert
    { r: 0,   g: 220, b: 255 },  // cyan
    { r: 64,  g: 160, b: 255 },  // bleu
    { r: 160, g: 64,  b: 255 },  // violet
  ];
  const auroraRideau = auroraColors.map((col, ci) => ({
    col,
    freq:   0.015 + ci * 0.007,
    phaseX: rng() * Math.PI * 2,
    phaseT: rng() * Math.PI * 2,
    yBase:  H * (0.08 + ci * 0.07),
    height: H * (0.22 + rng() * 0.12),
    ampX:   W * (0.3 + rng() * 0.2),
    speed:  0.4 + rng() * 0.4,
    bands:  8,
  }));

  function drawHex(ctx, cx, cy, size) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      const mx = cx + size * Math.cos(a);
      const my = cy + size * Math.sin(a);
      i === 0 ? ctx.moveTo(mx, my) : ctx.lineTo(mx, my);
    }
    ctx.closePath();
  }

  for (let f = 0; f < FRAMES; f++) {
    const T = f / FPS;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // fond nuit polaire
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, '#030810');
    bg.addColorStop(0.5, '#08121E');
    bg.addColorStop(1, '#0E1A28');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // étoiles (derrière l'aurore)
    for (const st of stars) {
      const twink = 0.5 + 0.5 * Math.sin(T * st.twinkFreq + st.twinkPhase);
      ctx.save();
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,235,255,${0.4 + 0.6 * twink})`;
      ctx.fill();
      ctx.restore();
    }

    // aurore boréale — 4 rideaux
    ctx.save();
    for (const rd of auroraRideau) {
      const { col, bands, yBase, height, ampX, freq, phaseX, phaseT, speed } = rd;
      for (let b = 0; b < bands; b++) {
        const bFrac = b / bands;
        const tOffset = T * speed + phaseT + b * 0.4;
        // ondulation verticale
        const yTop = yBase + Math.sin(tOffset * 1.3) * height * 0.15
                           + Math.sin(tOffset * 0.7 + 1.2) * height * 0.1;
        const yBot = yTop + height * (0.4 + 0.6 * bFrac);

        // opacité variable par bande
        const baseOp = (0.5 - Math.abs(bFrac - 0.5)) * 0.7;
        const op = baseOp * (0.4 + 0.6 * Math.sin(tOffset * 0.9 + b));

        const grad = ctx.createLinearGradient(0, yTop, 0, yBot);
        grad.addColorStop(0,   `rgba(${col.r},${col.g},${col.b},0)`);
        grad.addColorStop(0.3, `rgba(${col.r},${col.g},${col.b},${op.toFixed(3)})`);
        grad.addColorStop(0.7, `rgba(${col.r},${col.g},${col.b},${(op * 0.6).toFixed(3)})`);
        grad.addColorStop(1,   `rgba(${col.r},${col.g},${col.b},0)`);

        ctx.beginPath();
        // chemin ondulé horizontal
        const steps = 16;
        ctx.moveTo(0, yTop);
        for (let s = 0; s <= steps; s++) {
          const px = (s / steps) * W;
          const wave = Math.sin(px / ampX * Math.PI * 2 + tOffset * 2 + phaseX + b)
                     + 0.4 * Math.sin(px / ampX * Math.PI * 4 + tOffset + b * 0.7);
          const py = yTop + wave * height * 0.18;
          s === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        for (let s = steps; s >= 0; s--) {
          const px = (s / steps) * W;
          const wave = Math.sin(px / ampX * Math.PI * 2 + tOffset * 2 + phaseX + b)
                     + 0.4 * Math.sin(px / ampX * Math.PI * 4 + tOffset + b * 0.7);
          const py = yBot + wave * height * 0.12;
          ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
    }
    ctx.restore();

    // cristaux hexagonaux
    for (const cr of crystals) {
      const cx = (cr.x + cr.driftX * f) % W;
      const cy = cr.y + cr.driftY * (f % (H * 0.6));
      const rot = cr.rot + f * cr.rotSpd;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rot);
      ctx.globalAlpha = cr.op;
      // hexagone extérieur
      drawHex(ctx, 0, 0, cr.size);
      ctx.strokeStyle = 'rgba(136,224,248,0.6)';
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // hexagone intérieur
      drawHex(ctx, 0, 0, cr.size * 0.55);
      ctx.strokeStyle = 'rgba(136,224,248,0.3)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
      // fill translucide
      drawHex(ctx, 0, 0, cr.size);
      ctx.fillStyle = 'rgba(136,224,248,0.06)';
      ctx.fill();
      ctx.restore();
    }

    // neige
    for (const fl of flakes) {
      const fy = ((fl.y + f * fl.spd) % (H + 10));
      const fx = ((fl.x + f * fl.drift + W) % W);
      ctx.save();
      ctx.fillStyle = 'rgba(220,240,255,0.85)';
      ctx.strokeStyle = 'rgba(220,240,255,0.6)';
      ctx.lineWidth = 0.7;
      if (fl.arms && fl.r > 1.5) {
        // flocon avec bras
        for (let arm = 0; arm < 6; arm++) {
          const a = (Math.PI / 3) * arm;
          ctx.beginPath();
          ctx.moveTo(fx, fy);
          ctx.lineTo(fx + Math.cos(a) * fl.r * 2.5, fy + Math.sin(a) * fl.r * 2.5);
          ctx.stroke();
        }
      }
      ctx.beginPath();
      ctx.arc(fx, fy, fl.r * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // sol glacé (25% bas)
    const iceY = H * 0.75;
    const iceGrad = ctx.createLinearGradient(0, iceY, 0, H);
    iceGrad.addColorStop(0, 'rgba(100,180,220,0.18)');
    iceGrad.addColorStop(0.3, 'rgba(80,160,200,0.28)');
    iceGrad.addColorStop(1, 'rgba(60,130,180,0.35)');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, iceY, W, H - iceY);

    // reflet aurore sur glace (simplifié)
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.scale(1, -0.18);
    ctx.translate(0, -(iceY + (H - iceY)) * (1 / 0.18));
    // redessiner une version floue de l'aurore dans le reflet
    for (const rd of auroraRideau) {
      const { col } = rd;
      const rg = ctx.createLinearGradient(0, 0, W, 0);
      rg.addColorStop(0, `rgba(${col.r},${col.g},${col.b},0)`);
      rg.addColorStop(0.3, `rgba(${col.r},${col.g},${col.b},0.15)`);
      rg.addColorStop(0.7, `rgba(${col.r},${col.g},${col.b},0.12)`);
      rg.addColorStop(1, `rgba(${col.r},${col.g},${col.b},0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();

    if (f % 30 === 0) process.stdout.write(`  arctique frame ${f}/${FRAMES}\r`);
    saveFrame(canvas, framesDir, f);
  }
  console.log('\n  frames done, encoding…');
  encodeVideo(framesDir, outMp4);
  clearFrames(framesDir);
  console.log('  arctique OK →', outMp4);
}

// ════════════════════════════════════════════════════════════
//  THÈME 3 — NUIT (cityscape)
// ════════════════════════════════════════════════════════════
function generateNuit() {
  console.log('\n=== NUIT ===');
  const framesDir = path.join(THEMES_DIR, 'nuit', 'frames');
  const outMp4    = path.join(THEMES_DIR, 'nuit', 'bg.mp4');
  ensureDir(framesDir);

  const rng = seededRng(99);

  // ── skyline ───────────────────────────────────────────────
  const buildings = [];
  let bx = 0;
  while (bx < W + 30) {
    const bw = rndInt(25, 65);
    const bh = rndInt(60, 280);
    buildings.push({ x: bx, w: bw, h: bh, y: H - bh });
    bx += bw + rndInt(1, 6);
  }

  // fenêtres pré-calculées par immeuble
  const buildingWindows = buildings.map(b => {
    const wins = [];
    const cols = Math.max(1, Math.floor(b.w / 10) - 1);
    const rows = Math.max(1, Math.floor(b.h / 12) - 2);
    for (let col = 0; col < cols; col++) {
      for (let row = 0; row < rows; row++) {
        const warmRand = rng();
        const col3 = warmRand < 0.5  ? 'rgba(255,230,100,0.9)'
                   : warmRand < 0.75 ? 'rgba(255,180,60,0.9)'
                   :                   'rgba(240,240,220,0.9)';
        wins.push({
          wx: b.x + 5 + col * 10,
          wy: b.y + 8 + row * 12,
          col: col3,
          rand: rng(),  // pour le clignotement
        });
      }
    }
    return wins;
  });

  // ── étoiles ────────────────────────────────────────────────
  const stars = Array.from({ length: 120 }, () => ({
    x:     rng() * W,
    y:     rng() * H * 0.55,
    r:     rng() * 1.0 + 0.2,
    twink: rng() * Math.PI * 2,
    freq:  rng() * 1.5 + 0.5,
  }));

  // ── lune ──────────────────────────────────────────────────
  const moonR = 50;
  const moonStartX = W * 0.72;
  const moonY = H * 0.14;
  // cratères
  const craters = [
    { dx: -15, dy: -12, r: 8  },
    { dx: 12,  dy: 5,   r: 6  },
    { dx: -5,  dy: 16,  r: 5  },
    { dx: 18,  dy: -18, r: 4  },
    { dx: -20, dy: 8,   r: 4  },
  ];

  // ── nuages ─────────────────────────────────────────────────
  const clouds = [
    { x: W * 0.1, y: H * 0.22, r: 35, spd: 0.18, op: 0.25 },
    { x: W * 0.7, y: H * 0.30, r: 28, spd: 0.12, op: 0.20 },
  ];

  // ── voitures ───────────────────────────────────────────────
  const skylineTop = H - Math.max(...buildings.map(b => b.h));
  const roadLevels = [H - 22, H - 48];
  const cars = [
    { x: -30,  spd:  2.2, dir: 1,  road: 0, col: '#E04040' },
    { x: W+30, spd: -2.0, dir: -1, road: 0, col: '#4080E0' },
    { x: -60,  spd:  1.6, dir: 1,  road: 1, col: '#D0D0D0' },
    { x: W+60, spd: -2.5, dir: -1, road: 1, col: '#E8A020' },
  ];

  // ── réverbères ─────────────────────────────────────────────
  const lampposts = [W * 0.15, W * 0.5, W * 0.82];

  // ── étoiles filantes ───────────────────────────────────────
  // 3 étoiles filantes, chacune toutes les ~60 frames
  const shootingStars = [
    { startFrame: 15,  x: W * 0.8, y: H * 0.08, len: 80, angle: Math.PI * 0.82 },
    { startFrame: 75,  x: W * 0.3, y: H * 0.12, len: 90, angle: Math.PI * 0.78 },
    { startFrame: 135, x: W * 0.6, y: H * 0.06, len: 75, angle: Math.PI * 0.85 },
  ];

  function drawCloud(ctx, cx, cy, r) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.8, cy + r * 0.15, r * 0.75, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.6, cy + r * 0.2, r * 0.65, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.3, cy - r * 0.4, r * 0.6, 0, Math.PI * 2);
  }

  for (let f = 0; f < FRAMES; f++) {
    const T = f / FPS;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // fond ciel nuit
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#050312');
    sky.addColorStop(0.4, '#0A0620');
    sky.addColorStop(0.75,'#120830');
    sky.addColorStop(1,   '#1A0A40');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // étoiles
    for (const st of stars) {
      const tw = 0.55 + 0.45 * Math.sin(T * st.freq + st.twink);
      ctx.save();
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,210,255,${tw * 0.85})`;
      ctx.fill();
      ctx.restore();
    }

    // lune (dérive très lentement)
    const moonX = moonStartX + Math.sin(T * 0.05) * 4;
    ctx.save();
    // halo lune
    const halo = ctx.createRadialGradient(moonX, moonY, moonR * 0.9, moonX, moonY, moonR * 2.2);
    halo.addColorStop(0,   'rgba(245,240,200,0.18)');
    halo.addColorStop(0.4, 'rgba(245,240,200,0.06)');
    halo.addColorStop(1,   'rgba(245,240,200,0)');
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();
    // corps lune
    const moonGrad = ctx.createRadialGradient(moonX - 12, moonY - 12, 4, moonX, moonY, moonR);
    moonGrad.addColorStop(0, '#FDFAE0');
    moonGrad.addColorStop(0.6, '#F5F0C8');
    moonGrad.addColorStop(1, '#D8D0A0');
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fillStyle = moonGrad;
    ctx.fill();
    // cratères
    for (const cr of craters) {
      ctx.beginPath();
      ctx.arc(moonX + cr.dx, moonY + cr.dy, cr.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(180,165,110,0.45)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(moonX + cr.dx - 1, moonY + cr.dy - 1, cr.r * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,248,210,0.3)';
      ctx.fill();
    }
    ctx.restore();

    // nuages sombres
    for (const cl of clouds) {
      const cx = ((cl.x + f * cl.spd) % (W + cl.r * 3)) - cl.r;
      ctx.save();
      drawCloud(ctx, cx, cl.y, cl.r);
      ctx.fillStyle = `rgba(15,8,30,${cl.op})`;
      ctx.fill();
      ctx.restore();
    }

    // étoiles filantes
    for (const ss of shootingStars) {
      const elapsed = f - ss.startFrame;
      if (elapsed >= 0 && elapsed < 18) {
        const progress = elapsed / 18;
        const headX = ss.x + Math.cos(ss.angle) * ss.len * progress;
        const headY = ss.y + Math.sin(ss.angle) * ss.len * progress;
        const tailX = ss.x + Math.cos(ss.angle) * ss.len * Math.max(0, progress - 0.4);
        const tailY = ss.y + Math.sin(ss.angle) * ss.len * Math.max(0, progress - 0.4);
        const trailAlpha = Math.sin(progress * Math.PI);
        ctx.save();
        const sg = ctx.createLinearGradient(tailX, tailY, headX, headY);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(1, `rgba(255,255,255,${trailAlpha})`);
        ctx.strokeStyle = sg;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.stroke();
        // tête brillante
        ctx.shadowColor = 'white';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(headX, headY, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,' + trailAlpha + ')';
        ctx.fill();
        ctx.restore();
      }
    }

    // skyline immeubles
    ctx.save();
    ctx.fillStyle = '#06040F';
    for (const b of buildings) {
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    // contours légers
    ctx.strokeStyle = 'rgba(80,60,140,0.3)';
    ctx.lineWidth = 0.8;
    for (const b of buildings) {
      ctx.strokeRect(b.x, b.y, b.w, b.h);
    }
    ctx.restore();

    // fenêtres
    for (let bi = 0; bi < buildings.length; bi++) {
      const wins = buildingWindows[bi];
      for (const w of wins) {
        // clignotement : 25% chance de s'allumer (per 30 frames)
        // on utilise une valeur pseudo-stable par frame block
        const block = Math.floor(f / 6);
        const onOff = (Math.sin(w.rand * 1234 + block * 7.3) > 0.5);
        if (!onOff) continue;
        ctx.save();
        ctx.shadowColor = w.col;
        ctx.shadowBlur  = 4;
        ctx.fillStyle   = w.col;
        ctx.fillRect(w.wx, w.wy, 5, 7);
        ctx.restore();
      }
    }

    // réverbères
    for (const lx of lampposts) {
      // poteau
      ctx.save();
      ctx.strokeStyle = 'rgba(150,140,180,0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, H);
      ctx.lineTo(lx, H - 80);
      ctx.stroke();
      // bras horizontal
      ctx.beginPath();
      ctx.moveTo(lx, H - 80);
      ctx.lineTo(lx + 12, H - 85);
      ctx.stroke();
      // ampoule + cone
      const pulse = 1 + 0.06 * Math.sin(T * 2.5 + lx);
      const coneH = 90 * pulse;
      const cg = ctx.createLinearGradient(lx + 12, H - 85, lx + 12, H - 85 + coneH);
      cg.addColorStop(0, 'rgba(255,220,80,0.55)');
      cg.addColorStop(0.4, 'rgba(255,200,60,0.20)');
      cg.addColorStop(1, 'rgba(255,180,40,0)');
      ctx.beginPath();
      ctx.moveTo(lx + 12, H - 85);
      ctx.lineTo(lx + 12 - 28, H - 85 + coneH);
      ctx.lineTo(lx + 12 + 28, H - 85 + coneH);
      ctx.closePath();
      ctx.fillStyle = cg;
      ctx.fill();
      // point lumineux
      ctx.shadowColor = '#FFE050';
      ctx.shadowBlur  = 12 * pulse;
      ctx.beginPath();
      ctx.arc(lx + 12, H - 86, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#FFF080';
      ctx.fill();
      ctx.restore();
    }

    // voitures
    for (const car of cars) {
      const carX = ((car.x + f * car.spd) % (W + 60));
      const adjustedX = car.dir === 1 ? carX - 30 : W - carX + 30;
      const cy = roadLevels[car.road];

      ctx.save();
      // carrosserie
      ctx.fillStyle = car.col;
      ctx.fillRect(adjustedX, cy - 6, 16, 6);
      // toit arrondi
      ctx.beginPath();
      ctx.ellipse(adjustedX + 8, cy - 6, 5, 3, 0, Math.PI, 0);
      ctx.fillStyle = car.col;
      ctx.fill();
      // phares
      const headDir = car.dir === 1 ? 1 : -1;
      const hx1 = adjustedX + (car.dir === 1 ? 14 : 2);
      const hx2 = hx1;
      ctx.shadowColor = 'rgba(255,240,180,0.8)';
      ctx.shadowBlur  = 10;
      ctx.fillStyle   = 'rgba(255,240,180,0.95)';
      ctx.beginPath();
      ctx.arc(hx1, cy - 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(hx1, cy - 1, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // lueur néon sur le sol (reflet route)
    const roadGlow = ctx.createLinearGradient(0, H - 55, 0, H);
    roadGlow.addColorStop(0, 'rgba(168,120,240,0.04)');
    roadGlow.addColorStop(0.5, 'rgba(112,184,240,0.06)');
    roadGlow.addColorStop(1, 'rgba(40,10,80,0.3)');
    ctx.fillStyle = roadGlow;
    ctx.fillRect(0, H - 55, W, 55);

    if (f % 30 === 0) process.stdout.write(`  nuit frame ${f}/${FRAMES}\r`);
    saveFrame(canvas, framesDir, f);
  }
  console.log('\n  frames done, encoding…');
  encodeVideo(framesDir, outMp4);
  clearFrames(framesDir);
  console.log('  nuit OK →', outMp4);
}

// ════════════════════════════════════════════════════════════
//  MAIN
// ════════════════════════════════════════════════════════════
(async () => {
  const t0 = Date.now();
  try {
    generateJungle();
    generateArctique();
    generateNuit();
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n✓ Terminé en ${elapsed}s`);
    console.log('  jungle   → ' + path.join(THEMES_DIR, 'jungle/bg.mp4'));
    console.log('  arctique → ' + path.join(THEMES_DIR, 'arctique/bg.mp4'));
    console.log('  nuit     → ' + path.join(THEMES_DIR, 'nuit/bg.mp4'));
  } catch (e) {
    console.error('\nERREUR:', e.message);
    process.exit(1);
  }
})();
