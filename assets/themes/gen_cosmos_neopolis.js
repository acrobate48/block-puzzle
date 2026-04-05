'use strict';
// ============================================================
// gen_cosmos_neopolis.js
// Generates bg.mp4 for themes: COSMOS and NEOPOLIS
// 540x960, 30fps, 180 frames (6s loop), H.264 MP4
// ============================================================
const { createCanvas } = require('c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/node_modules/canvas');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const W = 540, H = 960, FPS = 30, FRAMES = 180;
const BASE = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/themes';

// ─── helpers ────────────────────────────────────────────────
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function rng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

function encodeVideo(framesDir, outMp4) {
  const cmd = [
    `"${FFMPEG}"`,
    `-y -framerate ${FPS}`,
    `-i "${framesDir}/frame%04d.png"`,
    `-c:v libx264 -preset slow -crf 18`,
    `-pix_fmt yuv420p`,
    `-movflags +faststart`,
    `"${outMp4}"`
  ].join(' ');
  console.log('  [ffmpeg] encoding…');
  execSync(cmd, { stdio: 'pipe' });
}

function cleanFrames(framesDir) {
  const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
  for (const f of files) fs.unlinkSync(path.join(framesDir, f));
  fs.rmdirSync(framesDir);
  console.log(`  [clean] removed ${files.length} frames`);
}

// ────────────────────────────────────────────────────────────
// THEME 1 : COSMOS
// ────────────────────────────────────────────────────────────
function renderCosmos(framesDir) {
  const rand = rng(42);

  // --- Star field (fixed) ---
  const STAR_COUNT = 200;
  const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
    const r = rng(i * 7919 + 13);
    return {
      x: r() * W,
      y: r() * H,
      r: r() * 1.4 + 0.3,
      freq: r() * 3 + 0.5,
      phase: r() * Math.PI * 2,
    };
  });

  // --- Nebulae (3 clouds) ---
  const nebulae = [
    { cx: 0.25 * W, cy: 0.35 * H, r: 120, phase: 0.0, speed: 0.6 },
    { cx: 0.72 * W, cy: 0.60 * H, r: 90,  phase: 2.1, speed: 0.8 },
    { cx: 0.50 * W, cy: 0.80 * H, r: 100, phase: 4.2, speed: 0.5 },
  ];

  // --- Meteorites (5) ---
  const meteors = Array.from({ length: 5 }, (_, i) => {
    const r = rng(i * 3571 + 99);
    const goLeft = r() > 0.5;
    return {
      startX: goLeft ? W * 0.6 + r() * W * 0.4 : -r() * W * 0.3,
      startY: r() * H * 0.3,
      dx: goLeft ? -(180 + r() * 120) : (180 + r() * 120),
      dy: 200 + r() * 150,
      trailLen: 80 + r() * 40,
      radius: 4 + r() * 4,
      phase: (i / 5) * FRAMES,   // staggered start
      duration: 30 + r() * 20,   // frames to cross
    };
  });

  // --- Shooting stars (8) ---
  const shootingStars = Array.from({ length: 8 }, (_, i) => {
    const r = rng(i * 1231 + 7);
    return {
      x: r() * W,
      y: r() * H * 0.5,
      len: 20 + r() * 20,
      angle: -0.3 + r() * 0.6,   // near-horizontal
      phase: r() * FRAMES,
      duration: 6 + r() * 8,
    };
  });

  // --- Vortex particles (spiral at centre-bottom) ---
  const VORTEX_COUNT = 60;
  const vortexP = Array.from({ length: VORTEX_COUNT }, (_, i) => {
    const r = rng(i * 2053 + 5);
    return {
      arm: i / VORTEX_COUNT * Math.PI * 4,  // 2 full turns
      dist: 20 + r() * 80,
      speed: 0.008 + r() * 0.01,
      size: 1 + r() * 2,
      alpha: 0.3 + r() * 0.5,
    };
  });

  for (let f = 0; f < FRAMES; f++) {
    const T = f / FPS;  // time in seconds
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // ── Background ──
    ctx.fillStyle = '#020008';
    ctx.fillRect(0, 0, W, H);

    // ── Nebulae ──
    for (const n of nebulae) {
      const pulse = 1 + 0.15 * Math.sin(T * n.speed * Math.PI * 2 + n.phase);
      const grad = ctx.createRadialGradient(n.cx, n.cy, 0, n.cx, n.cy, n.r * pulse);
      grad.addColorStop(0,   'rgba(128, 0, 220, 0.22)');
      grad.addColorStop(0.4, 'rgba(80,  0, 160, 0.14)');
      grad.addColorStop(0.7, 'rgba(40,  0, 100, 0.08)');
      grad.addColorStop(1,   'rgba(0,   0,  30, 0.00)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
    }

    // ── Star field ──
    for (const s of stars) {
      const alpha = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(T * s.freq + s.phase));
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 220, 255, ${alpha.toFixed(3)})`;
      ctx.fill();
    }

    // ── Planet (top-left) ──
    const planetX = 90, planetY = 110, planetR = 80;
    const ringAngle = T * 0.12;  // slow rotation of rings
    // Planet shadow backdrop
    const pGrad = ctx.createRadialGradient(planetX - 20, planetY - 20, 5, planetX, planetY, planetR);
    pGrad.addColorStop(0,   '#5060E0');
    pGrad.addColorStop(0.4, '#3030A0');
    pGrad.addColorStop(0.7, '#200870');
    pGrad.addColorStop(1,   '#10004A');
    ctx.save();
    ctx.beginPath();
    ctx.arc(planetX, planetY, planetR, 0, Math.PI * 2);
    ctx.fillStyle = pGrad;
    ctx.fill();
    // Dark-side shadow
    const shadowGrad = ctx.createRadialGradient(planetX + 40, planetY + 30, 0, planetX + 40, planetY + 30, planetR * 1.2);
    shadowGrad.addColorStop(0,   'rgba(0,0,10,0.7)');
    shadowGrad.addColorStop(1,   'rgba(0,0,10,0.0)');
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore();
    // Rings (ellipse, rotated)
    ctx.save();
    ctx.translate(planetX, planetY);
    ctx.rotate(ringAngle);
    for (let ring = 0; ring < 3; ring++) {
      const ro = planetR * (1.3 + ring * 0.18);
      const ri = planetR * (1.15 + ring * 0.18);
      const alpha = 0.5 - ring * 0.12;
      ctx.beginPath();
      ctx.ellipse(0, 0, ro, ro * 0.28, 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(140, 100, 240, ${alpha})`;
      ctx.lineWidth = (ro - ri);
      ctx.stroke();
    }
    ctx.restore();

    // ── Shooting stars ──
    for (const ss of shootingStars) {
      const localT = ((f - ss.phase + FRAMES) % FRAMES);
      if (localT > ss.duration) continue;
      const prog = localT / ss.duration;
      const alpha = prog < 0.3 ? prog / 0.3 : (1 - prog) / 0.7;
      const sx = ss.x + prog * ss.len * Math.cos(ss.angle);
      const sy = ss.y + prog * ss.len * Math.sin(ss.angle);
      const ex = ss.x + (prog + 0.05) * ss.len * Math.cos(ss.angle);
      const ey = ss.y + (prog + 0.05) * ss.len * Math.sin(ss.angle);
      const g = ctx.createLinearGradient(sx, sy, ex, ey);
      g.addColorStop(0, `rgba(255,255,255,${(alpha * 0.9).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // ── Meteorites ──
    for (const m of meteors) {
      const localT = ((f - m.phase + FRAMES * 2) % FRAMES);
      if (localT > m.duration) continue;
      const prog = localT / m.duration;
      const headX = m.startX + m.dx * prog;
      const headY = m.startY + m.dy * prog;
      const tailX = headX - (m.dx / m.duration) * (m.trailLen / Math.hypot(m.dx, m.dy)) * m.trailLen;
      const tailY = headY - (m.dy / m.duration) * (m.trailLen / Math.hypot(m.dx, m.dy)) * m.trailLen;
      // Trail gradient
      const trailGrad = ctx.createLinearGradient(headX, headY, tailX, tailY);
      trailGrad.addColorStop(0,   'rgba(255, 240, 180, 0.95)');
      trailGrad.addColorStop(0.3, 'rgba(255, 140,  60, 0.70)');
      trailGrad.addColorStop(0.7, 'rgba(200,  40,  20, 0.30)');
      trailGrad.addColorStop(1,   'rgba(100,   0,   0, 0.00)');
      ctx.beginPath();
      ctx.moveTo(headX, headY);
      ctx.lineTo(tailX, tailY);
      ctx.strokeStyle = trailGrad;
      ctx.lineWidth = m.radius * 0.7;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Glowing head
      const headGrad = ctx.createRadialGradient(headX, headY, 0, headX, headY, m.radius * 2);
      headGrad.addColorStop(0,   'rgba(255, 255, 240, 1.0)');
      headGrad.addColorStop(0.5, 'rgba(255, 220, 100, 0.8)');
      headGrad.addColorStop(1,   'rgba(255, 120,  40, 0.0)');
      ctx.beginPath();
      ctx.arc(headX, headY, m.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = headGrad;
      ctx.fill();
    }

    // ── Vortex (centre-bottom) ──
    const vx = W * 0.5, vy = H * 0.82;
    for (const p of vortexP) {
      const angle = p.arm + T * p.speed * Math.PI * 2 * 6;
      const px = vx + Math.cos(angle) * p.dist;
      const py = vy + Math.sin(angle) * p.dist * 0.35;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(160, 60, 240, ${p.alpha.toFixed(2)})`;
      ctx.fill();
    }

    // Save frame
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(framesDir, `frame${String(f + 1).padStart(4, '0')}.png`), buf);
    if ((f + 1) % 30 === 0) process.stdout.write(`  [cosmos] frame ${f + 1}/${FRAMES}\n`);
  }
}

// ────────────────────────────────────────────────────────────
// THEME 2 : NEOPOLIS
// ────────────────────────────────────────────────────────────
function renderNeopolis(framesDir) {
  // Palette
  const BG      = '#010510';
  const CYAN    = [0, 221, 255];
  const VIOLET  = [160, 64, 255];
  const GRID_C  = [26, 56, 136];

  // ── Matrix rain columns (15) ──
  const COLS_COUNT = 15;
  const COL_W = Math.floor(W / COLS_COUNT);
  const CHAR_H = 18;
  const ROWS = Math.ceil(H / CHAR_H) + 4;
  const matrixChars = '01234567890ABCDEF';
  const rainCols = Array.from({ length: COLS_COUNT }, (_, i) => {
    const r = rng(i * 1999 + 7);
    return {
      x: i * COL_W + Math.floor(COL_W / 2),
      speed: 0.4 + r() * 0.8,   // rows per frame
      offset: r() * ROWS,
      chars: Array.from({ length: ROWS }, () => matrixChars[Math.floor(r() * matrixChars.length)]),
    };
  });

  // ── Circuit lines (6) ──
  // Each line: a sequence of L-shaped segments, with a signal dot running along it
  const circuitLines = [
    { pts: [{x:0.05*W, y:0.12*H},{x:0.35*W, y:0.12*H},{x:0.35*W, y:0.30*H},{x:0.65*W, y:0.30*H}], color: CYAN,   speed: 0.18 },
    { pts: [{x:W,      y:0.22*H},{x:0.60*W, y:0.22*H},{x:0.60*W, y:0.45*H},{x:0.20*W, y:0.45*H}], color: VIOLET, speed: 0.14 },
    { pts: [{x:0.10*W, y:0.55*H},{x:0.40*W, y:0.55*H},{x:0.40*W, y:0.72*H},{x:0.80*W, y:0.72*H}], color: CYAN,   speed: 0.20 },
    { pts: [{x:W,      y:0.65*H},{x:0.55*W, y:0.65*H},{x:0.55*W, y:0.85*H},{x:0.15*W, y:0.85*H}], color: VIOLET, speed: 0.16 },
    { pts: [{x:0.20*W, y:0.90*H},{x:0.20*W, y:0.78*H},{x:0.70*W, y:0.78*H},{x:0.70*W, y:0.95*H}], color: CYAN,   speed: 0.22 },
    { pts: [{x:0.80*W, y:0.05*H},{x:0.80*W, y:0.18*H},{x:0.30*W, y:0.18*H},{x:0.30*W, y:0.38*H}], color: VIOLET, speed: 0.12 },
  ];

  // Pre-compute total lengths for each circuit line
  for (const cl of circuitLines) {
    cl.segLens = [];
    cl.totalLen = 0;
    for (let i = 0; i < cl.pts.length - 1; i++) {
      const dx = cl.pts[i+1].x - cl.pts[i].x;
      const dy = cl.pts[i+1].y - cl.pts[i].y;
      const len = Math.hypot(dx, dy);
      cl.segLens.push(len);
      cl.totalLen += len;
    }
    cl.trailFrac = 0.25; // trail = 25% of total length
  }

  function getPointOnLine(cl, frac) {
    frac = ((frac % 1) + 1) % 1;
    let dist = frac * cl.totalLen;
    for (let i = 0; i < cl.segLens.length; i++) {
      if (dist <= cl.segLens[i]) {
        const t = dist / cl.segLens[i];
        return {
          x: lerp(cl.pts[i].x, cl.pts[i+1].x, t),
          y: lerp(cl.pts[i].y, cl.pts[i+1].y, t),
        };
      }
      dist -= cl.segLens[i];
    }
    return cl.pts[cl.pts.length - 1];
  }

  // ── Holographic orb ──
  const orbBase = { cx: W * 0.72, cy: H * 0.48, r: 48 };

  // ── Perspective grid vanishing point ──
  const VP = { x: W * 0.5, y: H * 0.42 };
  const GRID_LINES_H = 12;  // horizontal lines
  const GRID_LINES_V = 10;  // vertical lines (rays from VP)

  for (let f = 0; f < FRAMES; f++) {
    const T = f / FPS;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // ── Background ──
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, W, H);

    // ── Perspective grid ──
    ctx.save();
    ctx.globalAlpha = 0.35;
    // Vertical rays from vanishing point
    for (let v = 0; v <= GRID_LINES_V; v++) {
      const tx = (v / GRID_LINES_V) * W;
      const g = ctx.createLinearGradient(VP.x, VP.y, tx, H);
      g.addColorStop(0, `rgba(${GRID_C.join(',')},0)`);
      g.addColorStop(1, `rgba(${GRID_C.join(',')},0.9)`);
      ctx.beginPath();
      ctx.moveTo(VP.x, VP.y);
      ctx.lineTo(tx, H);
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Horizontal lines scrolling downward
    const scroll = (T * 60) % (H / GRID_LINES_H);
    for (let h = 0; h <= GRID_LINES_H + 1; h++) {
      const yRaw = VP.y + (h / GRID_LINES_H) * (H - VP.y) + scroll * (h / GRID_LINES_H);
      const y = yRaw % (H - VP.y) + VP.y;
      if (y < VP.y || y > H) continue;
      const frac = (y - VP.y) / (H - VP.y);
      const xLeft  = lerp(VP.x, 0, frac);
      const xRight = lerp(VP.x, W, frac);
      const alpha = frac * 0.8;
      ctx.beginPath();
      ctx.moveTo(xLeft, y);
      ctx.lineTo(xRight, y);
      ctx.strokeStyle = `rgba(${GRID_C.join(',')},${alpha.toFixed(3)})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // ── Matrix rain ──
    ctx.save();
    ctx.font = `bold ${CHAR_H - 2}px monospace`;
    ctx.textAlign = 'center';
    for (const col of rainCols) {
      const head = (col.offset + f * col.speed) % ROWS;
      for (let r = 0; r < ROWS; r++) {
        const rowPos = (head - r + ROWS) % ROWS;
        const x = col.x;
        const y = rowPos * CHAR_H;
        if (y < 0 || y > H) continue;
        let alpha, color;
        if (r === 0) {
          alpha = 1.0;
          color = '255,255,255';
        } else {
          const fade = Math.max(0, 1 - r / 14);
          alpha = fade * 0.85;
          // green → cyan gradient
          const gr = Math.round(lerp(180, 221, 1 - r / 14));
          color = `0,${gr},${Math.round(lerp(80, 255, 1 - r / 14))}`;
        }
        if (alpha < 0.02) continue;
        ctx.fillStyle = `rgba(${color},${alpha.toFixed(3)})`;
        ctx.fillText(col.chars[(Math.floor(rowPos)) % col.chars.length], x, y);
      }
    }
    ctx.restore();

    // ── Circuit lines ──
    for (const cl of circuitLines) {
      const [cr, cg, cb] = cl.color;
      // Draw full path dimly
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.strokeStyle = `rgb(${cr},${cg},${cb})`;
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(cl.pts[0].x, cl.pts[0].y);
      for (let i = 1; i < cl.pts.length; i++) ctx.lineTo(cl.pts[i].x, cl.pts[i].y);
      ctx.stroke();
      ctx.restore();

      // Signal dot + trail
      const headFrac = (T * cl.speed) % 1;
      const TRAIL_STEPS = 30;
      for (let s = 0; s < TRAIL_STEPS; s++) {
        const frac = headFrac - (s / TRAIL_STEPS) * cl.trailFrac;
        const pt = getPointOnLine(cl, ((frac % 1) + 1) % 1);
        const alpha = (1 - s / TRAIL_STEPS) * 0.85;
        const r = (s === 0) ? 4 : 2;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha.toFixed(3)})`;
        ctx.fill();
      }
    }

    // ── Holographic orb ──
    const wobble = Math.sin(T * 0.8) * 8;
    const orbX = orbBase.cx + wobble;
    const orbY = orbBase.cy + Math.cos(T * 0.6) * 6;
    const orbR = orbBase.r;
    // Outer glow
    const gGlow = ctx.createRadialGradient(orbX, orbY, 0, orbX, orbY, orbR * 2.2);
    gGlow.addColorStop(0,   'rgba(0,221,255,0.08)');
    gGlow.addColorStop(1,   'rgba(0,221,255,0.00)');
    ctx.fillStyle = gGlow;
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR * 2.2, 0, Math.PI * 2);
    ctx.fill();
    // Sphere body
    const gOrb = ctx.createRadialGradient(orbX - orbR * 0.3, orbY - orbR * 0.3, 2, orbX, orbY, orbR);
    gOrb.addColorStop(0,   'rgba(160,220,255,0.35)');
    gOrb.addColorStop(0.5, 'rgba(0,180,255,0.18)');
    gOrb.addColorStop(1,   'rgba(0,60,180,0.08)');
    ctx.beginPath();
    ctx.arc(orbX, orbY, orbR, 0, Math.PI * 2);
    ctx.fillStyle = gOrb;
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,221,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Rotating rings around orb
    for (let ring = 0; ring < 3; ring++) {
      const ra = T * (0.5 + ring * 0.3) + ring * Math.PI / 3;
      ctx.save();
      ctx.translate(orbX, orbY);
      ctx.rotate(ra);
      ctx.beginPath();
      ctx.ellipse(0, 0, orbR * (1.3 + ring * 0.2), orbR * (0.22 + ring * 0.06), ring * 0.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(0,221,255,${(0.5 - ring * 0.12).toFixed(2)})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.restore();
    }

    // ── Glitch effect (every ~2s, lasts 3-5 frames) ──
    const GLITCH_PERIOD = 60;  // frames
    const localGlitch = f % GLITCH_PERIOD;
    if (localGlitch < 5) {
      const gRng = rng(Math.floor(f / GLITCH_PERIOD) * 997 + 1);
      const numBands = 2 + Math.floor(gRng() * 3);
      for (let b = 0; b < numBands; b++) {
        const by = Math.floor(gRng() * (H - 30));
        const bh = Math.floor(4 + gRng() * 12);
        const shift = Math.floor((gRng() - 0.5) * 50);
        try {
          const imgData = ctx.getImageData(0, by, W, bh);
          ctx.putImageData(imgData, shift, by);
          // Chromatic split: red channel offset
          const imgR = ctx.getImageData(Math.max(0, shift - 3), by, W, bh);
          const imgB = ctx.getImageData(Math.min(W - 1, shift + 3), by, W, bh);
          // Tint the band cyan
          const data = imgData.data;
          for (let px = 0; px < data.length; px += 4) {
            data[px]     = clamp(data[px]     - 20, 0, 255);  // R down
            data[px + 2] = clamp(data[px + 2] + 40, 0, 255);  // B up
          }
          ctx.putImageData(imgData, shift, by);
        } catch (e) { /* ignore out-of-bounds */ }
      }
    }

    // ── Scanlines (CRT) ──
    ctx.save();
    ctx.globalAlpha = 0.06;
    for (let y = 0; y < H; y += 3) {
      ctx.fillStyle = 'rgba(0,0,0,1)';
      ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();

    // Save frame
    const buf = canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(framesDir, `frame${String(f + 1).padStart(4, '0')}.png`), buf);
    if ((f + 1) % 30 === 0) process.stdout.write(`  [neopolis] frame ${f + 1}/${FRAMES}\n`);
  }
}

// ────────────────────────────────────────────────────────────
// MAIN
// ────────────────────────────────────────────────────────────
async function main() {
  // ── COSMOS ──
  console.log('\n=== COSMOS ===');
  const cosmosDir   = path.join(BASE, 'cosmos');
  const cosmosFrames = path.join(cosmosDir, 'frames');
  const cosmosMp4   = path.join(cosmosDir, 'bg.mp4');
  ensureDir(cosmosFrames);
  console.log('  [render] generating frames…');
  renderCosmos(cosmosFrames);
  encodeVideo(cosmosFrames, cosmosMp4);
  cleanFrames(cosmosFrames);
  const cosmosSize = fs.statSync(cosmosMp4).size;
  console.log(`  [done] cosmos/bg.mp4 — ${(cosmosSize / 1024 / 1024).toFixed(2)} MB`);

  // ── NEOPOLIS ──
  console.log('\n=== NEOPOLIS ===');
  const neoDir    = path.join(BASE, 'neopolis');
  const neoFrames = path.join(neoDir, 'frames');
  const neoMp4    = path.join(neoDir, 'bg.mp4');
  ensureDir(neoFrames);
  console.log('  [render] generating frames…');
  renderNeopolis(neoFrames);
  encodeVideo(neoFrames, neoMp4);
  cleanFrames(neoFrames);
  const neoSize = fs.statSync(neoMp4).size;
  console.log(`  [done] neopolis/bg.mp4 — ${(neoSize / 1024 / 1024).toFixed(2)} MB`);

  console.log('\n=== ALL DONE ===');
  console.log(`cosmos/bg.mp4   : ${(cosmosSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`neopolis/bg.mp4 : ${(neoSize / 1024 / 1024).toFixed(2)} MB`);
}

main().catch(err => { console.error(err); process.exit(1); });
