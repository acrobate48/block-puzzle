'use strict';
const {createCanvas} = require('canvas');
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const W = 1080, H = 1920;
const FRAMES_DIR = path.join(__dirname, 'frames');
const INTRO_FRAMES = 120;
const SPLASH_FRAMES = 180;
const FPS = 30;

// Ensure output dirs exist
const VIDEO_OUT = path.join(__dirname);
if (!fs.existsSync(FRAMES_DIR)) fs.mkdirSync(FRAMES_DIR, {recursive: true});

function hex(h) {
  return {
    r: parseInt(h.slice(1,3), 16),
    g: parseInt(h.slice(3,5), 16),
    b: parseInt(h.slice(5,7), 16)
  };
}
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t) { return 1 - (1 - t) * (1 - t); }
function easeInOut(t) { return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t+2, 2)/2; }
function clamp(v, mn, mx) { return Math.max(mn, Math.min(mx, v)); }

function rrect(ctx, x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.arcTo(x+w, y,   x+w, y+h, r);
  ctx.arcTo(x+w, y+h, x,   y+h, r);
  ctx.arcTo(x,   y+h, x,   y,   r);
  ctx.arcTo(x,   y,   x+w, y,   r);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
}

// ─────────────────────────────────────────────
// INTRO FRAMES
// ─────────────────────────────────────────────
console.log('Generating intro frames...');

const BLOCK_COLORS = ['#3AC644','#C6D026','#DA4E30','#EE8A1C','#9E3AC6','#30B2C6'];
const BLOCK_SIZE = 160;
const GRID_COLS = 2, GRID_ROWS = 3;
const GRID_W = GRID_COLS * (BLOCK_SIZE + 20) - 20;
const GRID_H = GRID_ROWS * (BLOCK_SIZE + 20) - 20;
const GRID_X = (W - GRID_W) / 2;
const GRID_Y = (H - GRID_H) / 2 - 80;

// Starting positions (off-screen edges)
const START_POS = [
  [-200,           H/2],
  [W + 200,        H/2 - 200],
  [-200,           H/2 + 400],
  [W + 200,        H/2 + 200],
  [-200,           H/2 - 300],
  [W + 200,        H/2 + 100]
];

// Final grid positions
const END_POS = [];
for (let r = 0; r < GRID_ROWS; r++) {
  for (let c = 0; c < GRID_COLS; c++) {
    END_POS.push([GRID_X + c*(BLOCK_SIZE+20), GRID_Y + r*(BLOCK_SIZE+20)]);
  }
}

for (let f = 0; f < INTRO_FRAMES; f++) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Background ──
  const bgT = clamp(f / 59, 0, 1);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  const r1 = Math.round(lerp(0,  8, bgT));
  const g1 = Math.round(lerp(0, 21, bgT));
  const b1 = Math.round(lerp(0,  8, bgT));
  const r2 = Math.round(lerp(0, 15, bgT));
  const g2 = Math.round(lerp(0, 35, bgT));
  const b2 = Math.round(lerp(0, 16, bgT));
  bg.addColorStop(0, `rgb(${r1},${g1},${b1})`);
  bg.addColorStop(1, `rgb(${r2},${g2},${b2})`);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Phase 1 & 2 (0-89): blocks flying in then settled ──
  if (f <= 89) {
    BLOCK_COLORS.forEach((col, i) => {
      let t;
      if (f < 30) {
        t = easeOut(f / 29);
      } else {
        t = 1;
      }
      const sx = lerp(START_POS[i][0], END_POS[i][0], t);
      const sy = lerp(START_POS[i][1], END_POS[i][1], t);

      const glowIntensity = f < 30 ? 0 : clamp((f - 29) / 30, 0, 1);
      const c2 = hex(col);

      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 40 * glowIntensity;

      // Block gradient
      const grad = ctx.createLinearGradient(sx, sy, sx + BLOCK_SIZE, sy + BLOCK_SIZE);
      grad.addColorStop(0, `rgba(${clamp(c2.r+50,0,255)},${clamp(c2.g+50,0,255)},${clamp(c2.b+50,0,255)},1)`);
      grad.addColorStop(0.5, col);
      grad.addColorStop(1, `rgba(${clamp(c2.r-40,0,255)},${clamp(c2.g-40,0,255)},${clamp(c2.b-40,0,255)},1)`);
      rrect(ctx, sx, sy, BLOCK_SIZE, BLOCK_SIZE, 18, grad);

      // Shine highlight
      ctx.shadowBlur = 0;
      const shine = ctx.createLinearGradient(sx, sy, sx, sy + BLOCK_SIZE * 0.5);
      shine.addColorStop(0, 'rgba(255,255,255,0.28)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      rrect(ctx, sx+4, sy+4, BLOCK_SIZE-8, BLOCK_SIZE*0.5, 14, null);
      ctx.fillStyle = shine;
      ctx.fill();

      ctx.restore();
    });
  } else {
    // Frames 90-119: still render settled blocks
    BLOCK_COLORS.forEach((col, i) => {
      const sx = END_POS[i][0];
      const sy = END_POS[i][1];
      const c2 = hex(col);

      ctx.save();
      ctx.shadowColor = col;
      ctx.shadowBlur = 40;

      const grad = ctx.createLinearGradient(sx, sy, sx + BLOCK_SIZE, sy + BLOCK_SIZE);
      grad.addColorStop(0, `rgba(${clamp(c2.r+50,0,255)},${clamp(c2.g+50,0,255)},${clamp(c2.b+50,0,255)},1)`);
      grad.addColorStop(0.5, col);
      grad.addColorStop(1, `rgba(${clamp(c2.r-40,0,255)},${clamp(c2.g-40,0,255)},${clamp(c2.b-40,0,255)},1)`);
      rrect(ctx, sx, sy, BLOCK_SIZE, BLOCK_SIZE, 18, grad);

      ctx.shadowBlur = 0;
      const shine = ctx.createLinearGradient(sx, sy, sx, sy + BLOCK_SIZE * 0.5);
      shine.addColorStop(0, 'rgba(255,255,255,0.28)');
      shine.addColorStop(1, 'rgba(255,255,255,0)');
      rrect(ctx, sx+4, sy+4, BLOCK_SIZE-8, BLOCK_SIZE*0.5, 14, null);
      ctx.fillStyle = shine;
      ctx.fill();

      ctx.restore();
    });
  }

  // ── Phase 3 (60-89): "BLOCK" and "PUZZLE" text sliding in ──
  if (f >= 60) {
    const tText = easeInOut(clamp((f - 60) / 29, 0, 1));
    const textY_block  = lerp(GRID_Y - 300, GRID_Y - 100, tText);
    const textY_puzzle = lerp(GRID_Y + GRID_H + 300, GRID_Y + GRID_H + 110, tText);
    const textAlpha = tText;

    ctx.save();
    ctx.globalAlpha = textAlpha;
    const fsz = 160;
    ctx.font = `bold ${fsz}px Impact, "Arial Black", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // BLOCK
    const gB = ctx.createLinearGradient(0, textY_block - fsz/2, 0, textY_block + fsz/2);
    gB.addColorStop(0,   '#FFFFC0');
    gB.addColorStop(0.4, '#FFD700');
    gB.addColorStop(1,   '#FF9000');
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 60;
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeText('BLOCK', W/2, textY_block);
    ctx.fillStyle = gB;
    ctx.fillText('BLOCK', W/2, textY_block);

    // PUZZLE
    const gP = ctx.createLinearGradient(0, textY_puzzle - fsz/2, 0, textY_puzzle + fsz/2);
    gP.addColorStop(0,   '#C0F0FF');
    gP.addColorStop(0.4, '#50C8F0');
    gP.addColorStop(1,   '#1060A0');
    ctx.shadowColor = '#50C8F0';
    ctx.shadowBlur = 50;
    ctx.strokeText('PUZZLE', W/2, textY_puzzle);
    ctx.fillStyle = gP;
    ctx.fillText('PUZZLE', W/2, textY_puzzle);

    ctx.restore();
  }

  // ── Phase 4 (90-119): PREMIUM subtitle + particle burst ──
  if (f >= 90) {
    const tP = easeInOut(clamp((f - 90) / 29, 0, 1));

    ctx.save();
    ctx.globalAlpha = tP;
    ctx.font = 'bold 64px Impact, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#D4B030';
    ctx.shadowColor = '#D4B030';
    ctx.shadowBlur = 30;
    ctx.fillText('\u2726  PREMIUM  \u2726', W/2, GRID_Y + GRID_H + 200);
    ctx.restore();

    // Particle burst
    const particleCount = Math.floor(tP * 30);
    for (let p = 0; p < particleCount; p++) {
      const angle = (p / 30) * Math.PI * 2;
      const dist  = 150 + p * 8;
      const px = W/2 + Math.cos(angle) * dist;
      const py = H/2 + Math.sin(angle) * dist;
      const pCol = BLOCK_COLORS[p % BLOCK_COLORS.length];
      ctx.save();
      ctx.globalAlpha = tP * 0.85;
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fillStyle = pCol;
      ctx.shadowColor = pCol;
      ctx.shadowBlur = 20;
      ctx.fill();
      ctx.restore();
    }
  }

  // Save frame
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(FRAMES_DIR, `intro_${String(f).padStart(4,'0')}.png`), buf);
  if (f % 20 === 0) console.log(`  Intro frame ${f}/${INTRO_FRAMES}`);
}
console.log('Intro frames done.');

// ─────────────────────────────────────────────
// SPLASH LOOP FRAMES
// ─────────────────────────────────────────────
console.log('Generating splash frames...');

// Seeded-random-ish so particles are deterministic across calls
const PARTICLES = Array.from({length: 40}, (_, i) => {
  const seed = i * 1.618033988;
  const frac = (n) => n - Math.floor(n);
  return {
    x:     frac(seed * 3.14)  * W,
    y:     frac(seed * 2.71)  * H,
    vx:    (frac(seed * 5.77) - 0.5) * 0.4,
    vy:    -(0.3 + frac(seed * 7.39) * 0.8),
    col:   i % 2 === 0 ? '#D4B030' : '#5DC940',
    sz:    2 + frac(seed * 11.3) * 4,
    phase: frac(seed * 13.7)  * Math.PI * 2
  };
});

const ORBS = [
  {x: W*0.3, y: H*0.4, r: 250, col: '#1A3810', phX: 0,   phY: 0.7},
  {x: W*0.7, y: H*0.6, r: 200, col: '#0F2820', phX: 2,   phY: 1.3},
  {x: W*0.5, y: H*0.3, r: 180, col: '#2E4820', phX: 4,   phY: 0.5},
];

for (let f = 0; f < SPLASH_FRAMES; f++) {
  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const T      = f / FPS; // time in seconds

  // ── Background ──
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#081508');
  bg.addColorStop(1, '#0F2310');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // ── Light orbs ──
  ORBS.forEach(orb => {
    const ox = orb.x + Math.sin(T * 0.4 + orb.phX) * 80;
    const oy = orb.y + Math.cos(T * 0.3 + orb.phY) * 60;
    const g  = ctx.createRadialGradient(ox, oy, 0, ox, oy, orb.r);
    g.addColorStop(0,   orb.col + 'FF');
    g.addColorStop(0.5, orb.col + '40');
    g.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  });

  // ── Dot grid ──
  ctx.save();
  ctx.globalAlpha = 0.04;
  const gs  = 60;
  const rot = T * 0.008;
  ctx.translate(W/2, H/2);
  ctx.rotate(rot);
  ctx.translate(-W/2, -H/2);
  ctx.fillStyle = '#D4B030';
  for (let gy = -gs; gy < H + gs; gy += gs) {
    for (let gx = -gs; gx < W + gs; gx += gs) {
      ctx.beginPath();
      ctx.arc(gx, gy, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // ── Particles ──
  PARTICLES.forEach(p => {
    const px    = ((p.x + p.vx * f * 2) % W + W) % W;
    const py    = ((p.y + p.vy * f * 3) % H + H) % H;
    const pulse = 0.4 + 0.4 * Math.sin(T * 2 + p.phase);
    ctx.save();
    ctx.globalAlpha = 0.5 * pulse;
    ctx.shadowColor = p.col;
    ctx.shadowBlur  = p.sz * 3;
    ctx.fillStyle   = p.col;
    ctx.beginPath();
    ctx.arc(px, py, p.sz * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  // ── Vignette ──
  const vig = ctx.createRadialGradient(W/2, H/2, H*0.25, W/2, H/2, H*0.8);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Save frame
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(FRAMES_DIR, `splash_${String(f).padStart(4,'0')}.png`), buf);
  if (f % 30 === 0) console.log(`  Splash frame ${f}/${SPLASH_FRAMES}`);
}
console.log('Splash frames done.');

// ─────────────────────────────────────────────
// ENCODE WITH FFMPEG
// ─────────────────────────────────────────────
const introOut  = path.join(VIDEO_OUT, 'intro.mp4');
const splashOut = path.join(VIDEO_OUT, 'splash_loop.mp4');

console.log('Encoding intro.mp4...');
execSync(
  `"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/intro_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${introOut}"`,
  {stdio: 'inherit'}
);

console.log('Encoding splash_loop.mp4...');
execSync(
  `"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/splash_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 20 -preset fast "${splashOut}"`,
  {stdio: 'inherit'}
);

// ── Cleanup frames ──
console.log('Cleaning up frame files...');
fs.readdirSync(FRAMES_DIR).forEach(name => {
  if (name.startsWith('intro_') || name.startsWith('splash_')) {
    fs.unlinkSync(path.join(FRAMES_DIR, name));
  }
});

console.log('\nDONE:');
console.log('  ' + introOut);
console.log('  ' + splashOut);
