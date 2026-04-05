'use strict';
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const BASE = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/themes';
const W = 540, H = 960, FPS = 30, FRAMES = 90;

// ── helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
function easeInOut(t) { return t < 0.5 ? 2*t*t : -1+(4-2*t)*t; }
function easeIn(t) { return t * t; }

function rand(lo, hi) { return lo + Math.random() * (hi - lo); }
function randInt(lo, hi) { return Math.floor(rand(lo, hi)); }

function fillBg(ctx, hex) {
  ctx.fillStyle = hex;
  ctx.fillRect(0, 0, W, H);
}

// Draw "GAME OVER" with common parameters
// appears: t in [0..1], 0 = invisible, 1 = full
// themeColor: hex string for color
function drawGameOver(ctx, appears, themeColor, glitch = false) {
  if (appears <= 0) return;
  const alpha = clamp(appears, 0, 1);
  const scale = lerp(0.8, 1.0, easeInOut(alpha));
  const { r, g, b } = hexToRgb(themeColor);

  ctx.save();
  ctx.translate(W/2, H/2);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  if (glitch) {
    // RGB split
    const offset = (1 - alpha) * 12;
    ctx.shadowBlur = 0;
    ctx.font = 'bold 80px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(255,0,0,0.7)`;
    ctx.fillText('GAME OVER', -offset, 0);
    ctx.fillStyle = `rgba(0,255,255,0.7)`;
    ctx.fillText('GAME OVER', offset, 0);
  }

  ctx.font = `bold 80px ${glitch ? 'monospace' : 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = `rgba(${r},${g},${b},0.9)`;
  ctx.shadowBlur = 30 * alpha;
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fillText('GAME OVER', 0, 0);

  ctx.restore();
}

// Overlay fade to black
function fadeBlack(ctx, t) {
  if (t <= 0) return;
  ctx.fillStyle = `rgba(0,0,0,${clamp(t,0,1)})`;
  ctx.fillRect(0, 0, W, H);
}

// t: 0..1 within the [0..1.5s] window  => 0..1
// t_text: 0..1 within [1.5..2.2s]
// t_fade: 0..1 within [2.2..3s]
function getTimes(frame) {
  const t = frame / (FRAMES - 1); // 0..1 over 3s
  const tAnim  = clamp(t / 0.5, 0, 1);          // 0..1 in 0-1.5s
  const tText  = clamp((t - 0.5) / 0.233, 0, 1);// 0..1 in 1.5-2.2s
  const tFade  = clamp((t - 0.733) / 0.267, 0,1);// 0..1 in 2.2-3s
  return { t, tAnim, tText, tFade };
}

// ── frame generators ──────────────────────────────────────────────────────────

// Seeded-ish deterministic particles using frame index + seed
function makeParticles(n, seed) {
  const ps = [];
  for (let i = 0; i < n; i++) {
    const s = (seed * 9301 + i * 49297 + 233) % 233280 / 233280;
    const s2 = (seed * 2341 + i * 12347 + 1337) % 233280 / 233280;
    const s3 = (seed * 7177 + i * 31337 + 42) % 233280 / 233280;
    const s4 = (seed * 5701 + i * 17393 + 999) % 233280 / 233280;
    const s5 = (seed * 3571 + i * 8221 + 7) % 233280 / 233280;
    ps.push({ x: s * W, y: s2 * H, vx: (s3 - 0.5) * 3, vy: s4 * 6 + 1, r: s5 * 4 + 1 });
  }
  return ps;
}

// ── JUNGLE ───────────────────────────────────────────────────────────────────
function genJungle(canvas, frame, leaves, raindrops) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#081508');

  // Rain: intensity grows with tAnim
  const rainAlpha = easeIn(tAnim) * 0.7;
  const rainCount = Math.floor(80 * tAnim) + 5;
  ctx.strokeStyle = `rgba(100,180,100,${rainAlpha * 0.6})`;
  ctx.lineWidth = 1;
  for (let i = 0; i < rainCount; i++) {
    const rd = raindrops[i % raindrops.length];
    const x = (rd.x + frame * rd.vx * 0.5) % W;
    const y = (rd.y + frame * rd.vy * 1.5) % H;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 2, y + 14);
    ctx.stroke();
  }

  // Leaves
  const leafCount = Math.floor(30 * tAnim) + 2;
  for (let i = 0; i < leafCount; i++) {
    const lf = leaves[i % leaves.length];
    const x = (lf.x + frame * lf.vx) % W;
    const y = (lf.y + frame * lf.vy) % H;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(frame * 0.05 + i);
    ctx.fillStyle = `rgba(60,${100 + i % 80},40,${0.5 + tAnim * 0.4})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Dark fog growing
  const fogAlpha = tAnim * 0.4;
  const grad = ctx.createRadialGradient(W/2, H, H * 0.2, W/2, H, H);
  grad.addColorStop(0, `rgba(0,0,0,0)`);
  grad.addColorStop(1, `rgba(0,8,0,${fogAlpha})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  drawGameOver(ctx, tText, '#D4B030');
  fadeBlack(ctx, tFade);
}

// ── DESERT ───────────────────────────────────────────────────────────────────
function genDesert(canvas, frame, sand) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#301C06');

  // Sun
  const sunAlpha = clamp(1 - tAnim * 1.5, 0, 1);
  if (sunAlpha > 0) {
    ctx.save();
    const sunGrad = ctx.createRadialGradient(W*0.7, H*0.2, 0, W*0.7, H*0.2, 70);
    sunGrad.addColorStop(0, `rgba(255,220,60,${sunAlpha})`);
    sunGrad.addColorStop(1, `rgba(255,120,0,0)`);
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Sand particles storm
  const sandDensity = easeIn(tAnim);
  const count = Math.floor(200 * sandDensity) + 10;
  for (let i = 0; i < count; i++) {
    const p = sand[i % sand.length];
    const x = (p.x + frame * (p.vx * 3 + 2)) % W;
    const y = (p.y + frame * p.vy * 0.3 + (i % 3) * 0.5) % H;
    ctx.fillStyle = `rgba(${180 + (i%60)},${100 + (i%40)},${30 + (i%30)},${0.3 + sandDensity * 0.5})`;
    ctx.fillRect(x, y, p.r, p.r * 0.5);
  }

  // Sand overlay from bottom
  const sandH = H * tAnim * 0.6;
  if (sandH > 0) {
    const g = ctx.createLinearGradient(0, H - sandH - 60, 0, H);
    g.addColorStop(0, `rgba(180,100,30,0)`);
    g.addColorStop(1, `rgba(180,100,30,${tAnim * 0.7})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, H - sandH - 60, W, sandH + 60);
  }

  drawGameOver(ctx, tText, '#E8B838');
  fadeBlack(ctx, tFade);
}

// ── OCEAN ─────────────────────────────────────────────────────────────────────
function genOcean(canvas, frame, bubbles) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#040C28');

  // Water rising from bottom
  const waterH = H * easeInOut(tAnim) * 0.85;
  const waterY = H - waterH;
  const wg = ctx.createLinearGradient(0, waterY, 0, H);
  wg.addColorStop(0, `rgba(10,60,140,0.85)`);
  wg.addColorStop(1, `rgba(2,20,80,0.95)`);
  ctx.fillStyle = wg;
  ctx.fillRect(0, waterY, W, waterH);

  // Wave top edge
  ctx.beginPath();
  ctx.moveTo(0, waterY);
  for (let x = 0; x <= W; x += 4) {
    const wave = Math.sin((x / 40) + frame * 0.15) * 8;
    ctx.lineTo(x, waterY + wave);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = `rgba(20,100,200,0.4)`;
  ctx.fill();

  // Bubbles
  const bCount = Math.floor(40 * tAnim) + 5;
  for (let i = 0; i < bCount; i++) {
    const b = bubbles[i % bubbles.length];
    const bx = b.x + Math.sin(frame * 0.05 + i) * 5;
    const by = (b.y - frame * b.vy * 0.8) % H;
    if (by < waterY) continue;
    ctx.beginPath();
    ctx.arc(bx, by, b.r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(80,180,220,${0.3 + tAnim * 0.4})`;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawGameOver(ctx, tText, '#50C8F0');
  fadeBlack(ctx, tFade);
}

// ── VOLCAN ────────────────────────────────────────────────────────────────────
function genVolcan(canvas, frame, embers) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#180402');

  // Lava wave rising from bottom
  const lavaH = H * easeIn(tAnim) * 0.9;
  const lavaY = H - lavaH;

  // Main lava body
  const lg = ctx.createLinearGradient(0, lavaY, 0, H);
  lg.addColorStop(0, `rgba(255,100,10,0.9)`);
  lg.addColorStop(0.4, `rgba(200,40,5,0.95)`);
  lg.addColorStop(1, `rgba(120,10,0,1)`);
  ctx.fillStyle = lg;

  // Lava wave top
  ctx.beginPath();
  ctx.moveTo(0, lavaY);
  for (let x = 0; x <= W; x += 3) {
    const wave = Math.sin((x/30) + frame * 0.12) * 15 + Math.cos((x/20) + frame * 0.08) * 8;
    ctx.lineTo(x, lavaY + wave);
  }
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fill();

  // Glow above lava
  if (tAnim > 0.1) {
    const glowH = 80 * tAnim;
    const gg = ctx.createLinearGradient(0, lavaY - glowH, 0, lavaY);
    gg.addColorStop(0, `rgba(255,80,0,0)`);
    gg.addColorStop(1, `rgba(255,80,0,${tAnim * 0.5})`);
    ctx.fillStyle = gg;
    ctx.fillRect(0, lavaY - glowH, W, glowH);
  }

  // Embers floating up
  const eCount = Math.floor(50 * tAnim) + 5;
  for (let i = 0; i < eCount; i++) {
    const e = embers[i % embers.length];
    const ex = e.x + Math.sin(frame * 0.07 + i) * 12;
    const ey = (e.y - frame * e.vy * 1.2) % H;
    if (ey > lavaY) continue;
    const ea = clamp(1 - (lavaY - ey) / (H * 0.4), 0, 1);
    ctx.beginPath();
    ctx.arc(ex, ey, e.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,${100 + (i%100)},0,${ea * 0.8})`;
    ctx.fill();
  }

  drawGameOver(ctx, tText, '#F08020');
  fadeBlack(ctx, tFade);
}

// ── NUIT ──────────────────────────────────────────────────────────────────────
function genNuit(canvas, frame, lights) {
  const ctx = canvas.getContext('2d');
  const { t, tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#050312');

  // City silhouette
  ctx.fillStyle = '#0a0820';
  for (let i = 0; i < 12; i++) {
    const bw = 30 + (i * 37) % 60;
    const bh = 100 + (i * 53) % 250;
    const bx = i * 50 - 20;
    ctx.fillRect(bx, H - bh, bw, bh);
  }

  // City lights that go out progressively
  const outFraction = tAnim;
  for (let i = 0; i < lights.length; i++) {
    const progress = i / lights.length;
    const isOut = progress < outFraction;
    if (isOut) continue;
    const l = lights[i];
    const flicker = Math.sin(frame * 0.4 + i * 2.3) * 0.15 + 0.85;
    ctx.fillStyle = `rgba(${l.r},${l.g},${l.b},${flicker * 0.7})`;
    ctx.fillRect(l.x, l.y, 5, 5);
  }

  // Power flash at start (frame < 5)
  if (frame < 5) {
    const flashAlpha = clamp(1 - frame / 5, 0, 1);
    ctx.fillStyle = `rgba(255,255,255,${flashAlpha * 0.6})`;
    ctx.fillRect(0, 0, W, H);
  }

  // Darkness growing
  const darkAlpha = easeIn(tAnim) * 0.7;
  ctx.fillStyle = `rgba(0,0,0,${darkAlpha})`;
  ctx.fillRect(0, 0, W, H);

  drawGameOver(ctx, tText, '#A878F0');
  fadeBlack(ctx, tFade);
}

// ── ARCTIQUE ──────────────────────────────────────────────────────────────────
function genArctique(canvas, frame, crystals) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#08121E');

  // Northern lights hint
  const nlAlpha = (1 - tAnim) * 0.3;
  if (nlAlpha > 0) {
    const nlg = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    nlg.addColorStop(0, `rgba(40,120,80,${nlAlpha})`);
    nlg.addColorStop(0.5, `rgba(20,60,100,${nlAlpha * 0.5})`);
    nlg.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = nlg;
    ctx.fillRect(0, 0, W, H * 0.5);
  }

  // Frost overlay growing from edges
  const frostAlpha = easeIn(tAnim) * 0.85;

  // Top edge
  const tg = ctx.createLinearGradient(0, 0, 0, H * 0.4 * tAnim);
  tg.addColorStop(0, `rgba(180,220,255,${frostAlpha})`);
  tg.addColorStop(1, `rgba(180,220,255,0)`);
  ctx.fillStyle = tg;
  ctx.fillRect(0, 0, W, H * 0.4 * tAnim);

  // Bottom edge
  const bg2 = ctx.createLinearGradient(0, H - H * 0.4 * tAnim, 0, H);
  bg2.addColorStop(0, `rgba(180,220,255,0)`);
  bg2.addColorStop(1, `rgba(180,220,255,${frostAlpha})`);
  ctx.fillStyle = bg2;
  ctx.fillRect(0, H - H * 0.4 * tAnim, W, H * 0.4 * tAnim);

  // Left edge
  const lg2 = ctx.createLinearGradient(0, 0, W * 0.35 * tAnim, 0);
  lg2.addColorStop(0, `rgba(180,220,255,${frostAlpha})`);
  lg2.addColorStop(1, `rgba(180,220,255,0)`);
  ctx.fillStyle = lg2;
  ctx.fillRect(0, 0, W * 0.35 * tAnim, H);

  // Right edge
  const rg = ctx.createLinearGradient(W - W * 0.35 * tAnim, 0, W, 0);
  rg.addColorStop(0, `rgba(180,220,255,0)`);
  rg.addColorStop(1, `rgba(180,220,255,${frostAlpha})`);
  ctx.fillStyle = rg;
  ctx.fillRect(W - W * 0.35 * tAnim, 0, W * 0.35 * tAnim, H);

  // Frost crystals
  const cCount = Math.floor(crystals.length * tAnim);
  ctx.strokeStyle = `rgba(180,230,255,0.6)`;
  ctx.lineWidth = 1;
  for (let i = 0; i < cCount; i++) {
    const c = crystals[i];
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    const s = c.size * tAnim;
    for (let a = 0; a < 6; a++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, s);
      ctx.stroke();
      // side branches
      ctx.beginPath();
      ctx.moveTo(0, s * 0.4);
      ctx.lineTo(s * 0.2, s * 0.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, s * 0.4);
      ctx.lineTo(-s * 0.2, s * 0.6);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawGameOver(ctx, tText, '#88E0F8');
  fadeBlack(ctx, tFade);
}

// ── COSMOS ────────────────────────────────────────────────────────────────────
function genCosmos(canvas, frame, stars) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#020008');

  // Stars disappearing (sucked in)
  const surviveRatio = 1 - easeIn(tAnim);
  const sCount = Math.floor(stars.length * surviveRatio);
  for (let i = 0; i < sCount; i++) {
    const s = stars[i];
    // Pull toward center
    const dx = W/2 - s.x, dy = H/2 - s.y;
    const pull = easeIn(tAnim) * 0.4;
    const sx = s.x + dx * pull;
    const sy = s.y + dy * pull;
    ctx.fillStyle = `rgba(255,255,255,${s.alpha * (1 - tAnim * 0.8)})`;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Black hole vortex
  const bhR = easeIn(tAnim) * 140;
  if (bhR > 0) {
    // Accretion disk
    for (let ring = 3; ring > 0; ring--) {
      const rr = bhR * (ring / 3);
      const rg = ctx.createRadialGradient(W/2, H/2, rr * 0.3, W/2, H/2, rr);
      rg.addColorStop(0, `rgba(80,0,160,${tAnim * 0.7 / ring})`);
      rg.addColorStop(0.7, `rgba(160,60,255,${tAnim * 0.3 / ring})`);
      rg.addColorStop(1, `rgba(0,0,0,0)`);
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, W, H);
    }

    // Spiral arms (just lines rotating)
    ctx.save();
    ctx.translate(W/2, H/2);
    for (let arm = 0; arm < 6; arm++) {
      const angle = (arm / 6) * Math.PI * 2 + frame * 0.15;
      ctx.rotate(Math.PI * 2 / 6);
      ctx.beginPath();
      for (let r2 = bhR * 0.2; r2 < bhR * 1.1; r2 += 2) {
        const a2 = angle + r2 * 0.04;
        const px = Math.cos(a2) * r2;
        const py = Math.sin(a2) * r2;
        if (r2 === bhR * 0.2) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = `rgba(180,80,255,${tAnim * 0.4})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();

    // Core black hole
    const cg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, bhR * 0.35);
    cg.addColorStop(0, `rgba(0,0,0,1)`);
    cg.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);
  }

  drawGameOver(ctx, tText, '#B040F0');
  fadeBlack(ctx, tFade);
}

// ── ENCHANTE ──────────────────────────────────────────────────────────────────
function genEnchante(canvas, frame, sparks) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#030A06');

  // Background forest glow fading
  const glowAlpha = (1 - tAnim) * 0.5;
  if (glowAlpha > 0) {
    const fg = ctx.createRadialGradient(W/2, H*0.7, 0, W/2, H*0.7, W*0.8);
    fg.addColorStop(0, `rgba(30,80,30,${glowAlpha})`);
    fg.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = fg;
    ctx.fillRect(0, 0, W, H);
  }

  // Runic circles fading
  const circleAlpha = clamp(1 - tAnim * 1.5, 0, 1);
  if (circleAlpha > 0) {
    const cx = W/2, cy = H/2;
    for (let c = 0; c < 3; c++) {
      const rr = 80 + c * 70;
      const ca = circleAlpha * (1 - c * 0.2);
      ctx.beginPath();
      ctx.arc(cx, cy, rr, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(60,200,80,${ca * 0.6})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Rune marks
      for (let m = 0; m < 8; m++) {
        const angle = (m / 8) * Math.PI * 2 + frame * 0.02 * (c % 2 ? 1 : -1);
        const mx = cx + Math.cos(angle) * rr;
        const my = cy + Math.sin(angle) * rr;
        ctx.fillStyle = `rgba(80,220,100,${ca * 0.8})`;
        ctx.fillRect(mx - 3, my - 3, 6, 6);
      }
    }
  }

  // Sparks dying out
  const sparkSurvive = 1 - easeIn(tAnim);
  const sCount = Math.floor(sparks.length * sparkSurvive);
  for (let i = 0; i < sCount; i++) {
    const s = sparks[i];
    const sx = (s.x + frame * s.vx) % W;
    const sy = (s.y + frame * s.vy) % H;
    const sa = (1 - tAnim) * 0.8;
    ctx.beginPath();
    ctx.arc(sx, sy, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(80,220,80,${sa})`;
    ctx.shadowColor = '#40F060';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  drawGameOver(ctx, tText, '#40F060');
  fadeBlack(ctx, tFade);
}

// ── PLAGE ─────────────────────────────────────────────────────────────────────
function genPlage(canvas, frame, foam) {
  const ctx = canvas.getContext('2d');
  const { tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#1C0804');

  // Sunset sky
  const sunsetAlpha = clamp(1 - tAnim * 1.2, 0, 1);
  if (sunsetAlpha > 0) {
    const sg = ctx.createLinearGradient(0, 0, 0, H * 0.6);
    sg.addColorStop(0, `rgba(20,10,40,${sunsetAlpha})`);
    sg.addColorStop(0.3, `rgba(180,60,20,${sunsetAlpha * 0.8})`);
    sg.addColorStop(0.6, `rgba(220,140,20,${sunsetAlpha * 0.6})`);
    sg.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = sg;
    ctx.fillRect(0, 0, W, H * 0.6);
  }

  // Sun setting (moving down and fading)
  const sunY = H * 0.25 + tAnim * H * 0.3;
  const sunAlpha = clamp(1 - tAnim * 1.5, 0, 1);
  if (sunAlpha > 0) {
    const sunG = ctx.createRadialGradient(W*0.5, sunY, 0, W*0.5, sunY, 60);
    sunG.addColorStop(0, `rgba(255,200,50,${sunAlpha})`);
    sunG.addColorStop(1, `rgba(255,100,0,0)`);
    ctx.fillStyle = sunG;
    ctx.fillRect(0, 0, W, H);
  }

  // Giant wave crashing from right, moving left
  const waveProgress = easeIn(tAnim);
  const waveX = W - W * waveProgress * 1.3;
  if (waveProgress > 0) {
    const wg = ctx.createLinearGradient(waveX, 0, waveX + W * 0.4, 0);
    wg.addColorStop(0, `rgba(20,80,180,0.9)`);
    wg.addColorStop(0.5, `rgba(40,120,220,0.85)`);
    wg.addColorStop(1, `rgba(100,180,255,0.7)`);
    ctx.fillStyle = wg;

    // Wave shape (vertical from sky to bottom)
    ctx.beginPath();
    ctx.moveTo(waveX, 0);
    for (let y = 0; y <= H; y += 4) {
      const wx = waveX + Math.sin(y / 60 + frame * 0.1) * 20;
      ctx.lineTo(wx, y);
    }
    ctx.lineTo(W, H); ctx.lineTo(W, 0); ctx.closePath();
    ctx.fill();

    // Foam (white frothy edge)
    ctx.strokeStyle = `rgba(255,255,255,0.7)`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let y = 0; y <= H; y += 4) {
      const wx = waveX + Math.sin(y / 60 + frame * 0.1) * 20;
      if (y === 0) ctx.moveTo(wx, y); else ctx.lineTo(wx, y);
    }
    ctx.stroke();

    // Foam particles
    const fCount = Math.floor(foam.length * waveProgress);
    for (let i = 0; i < fCount; i++) {
      const f = foam[i];
      const fx = waveX - f.x * 50 - frame * f.vx * 0.3;
      const fy = f.y;
      ctx.fillStyle = `rgba(255,255,255,${f.r / 6})`;
      ctx.beginPath();
      ctx.arc(fx, fy, f.r * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGameOver(ctx, tText, '#F09838');
  fadeBlack(ctx, tFade);
}

// ── NEOPOLIS ─────────────────────────────────────────────────────────────────
function genNeopolis(canvas, frame, glitchSeeds) {
  const ctx = canvas.getContext('2d');
  const { t, tAnim, tText, tFade } = getTimes(frame);

  fillBg(ctx, '#010510');

  // City grid / circuit background
  ctx.strokeStyle = `rgba(0,100,180,${0.15 + tAnim * 0.1})`;
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Neon city skyline
  const neonAlpha = clamp(1 - tAnim * 1.2, 0, 1);
  if (neonAlpha > 0) {
    for (let b = 0; b < 10; b++) {
      const bx = b * 60 - 20;
      const bh = 200 + (b * 73) % 300;
      const bw = 40 + (b * 37) % 30;
      ctx.fillStyle = `rgba(0,${20 + b*5},${40 + b*8},${neonAlpha})`;
      ctx.fillRect(bx, H - bh, bw, bh);
      // Neon outline
      ctx.strokeStyle = `rgba(0,200,255,${neonAlpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx, H - bh, bw, bh);
    }
  }

  // Glitch intensity increases with tAnim
  const glitchIntensity = easeIn(tAnim);

  // Scanlines
  const scanAlpha = 0.1 + glitchIntensity * 0.3;
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = `rgba(0,0,0,${scanAlpha})`;
    ctx.fillRect(0, y, W, 2);
  }

  // RGB horizontal shift glitches
  const numGlitches = Math.floor(glitchIntensity * 20);
  for (let g = 0; g < numGlitches; g++) {
    const seed = glitchSeeds[g % glitchSeeds.length];
    const gy = (seed.y + frame * 7 + g * 47) % H;
    const gh = 2 + seed.h;
    const shift = (seed.x - W/2) * glitchIntensity * 0.15;

    // Copy a slice and shift it
    try {
      const imageData = ctx.getImageData(0, gy, W, gh);
      ctx.putImageData(imageData, shift, gy);
      // Red channel copy
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = `rgba(255,0,0,${glitchIntensity * 0.1})`;
      ctx.fillRect(shift + 5, gy, W, gh);
      ctx.fillStyle = `rgba(0,255,255,${glitchIntensity * 0.1})`;
      ctx.fillRect(shift - 5, gy, W, gh);
      ctx.globalCompositeOperation = 'source-over';
    } catch(e) {}
  }

  // Color corruption blocks
  const blockCount = Math.floor(glitchIntensity * 15);
  for (let b = 0; b < blockCount; b++) {
    const seed = glitchSeeds[(b * 3) % glitchSeeds.length];
    const bx = (seed.x + frame * 13) % W;
    const by = (seed.y + frame * 5) % H;
    const bw2 = 10 + seed.h * 3;
    const bh2 = 2 + seed.h;
    const colors = ['rgba(0,221,255,', 'rgba(255,0,100,', 'rgba(0,255,0,'];
    ctx.fillStyle = colors[b % 3] + `${glitchIntensity * 0.6})`;
    ctx.fillRect(bx, by, bw2, bh2);
  }

  // Screen freeze/crash: solid block appears near end of anim
  if (tAnim > 0.7) {
    const crashAlpha = (tAnim - 0.7) / 0.3;
    ctx.fillStyle = `rgba(0,50,80,${crashAlpha * 0.4})`;
    ctx.fillRect(0, 0, W, H);
    // "NO SIGNAL" style bars
    for (let bar = 0; bar < 5; bar++) {
      const by2 = (bar / 5) * H;
      const ba = crashAlpha * (0.1 + bar * 0.05);
      ctx.fillStyle = `rgba(0,221,255,${ba})`;
      ctx.fillRect(0, by2, W, 2);
    }
  }

  drawGameOver(ctx, tText, '#00DDFF', true);
  fadeBlack(ctx, tFade);
}

// ── MAIN ──────────────────────────────────────────────────────────────────────

const themes = [
  {
    name: 'jungle',
    gen: (canvas, frame, data) => genJungle(canvas, frame, data.leaves, data.raindrops),
    init: () => ({
      leaves: makeParticles(60, 101),
      raindrops: makeParticles(120, 202)
    })
  },
  {
    name: 'desert',
    gen: (canvas, frame, data) => genDesert(canvas, frame, data.sand),
    init: () => ({ sand: makeParticles(300, 303) })
  },
  {
    name: 'ocean',
    gen: (canvas, frame, data) => genOcean(canvas, frame, data.bubbles),
    init: () => ({ bubbles: makeParticles(80, 404) })
  },
  {
    name: 'volcan',
    gen: (canvas, frame, data) => genVolcan(canvas, frame, data.embers),
    init: () => ({ embers: makeParticles(100, 505) })
  },
  {
    name: 'nuit',
    gen: (canvas, frame, data) => genNuit(canvas, frame, data.lights),
    init: () => {
      const lights = [];
      for (let b = 0; b < 12; b++) {
        const bx = b * 50 - 20;
        const bh = 100 + (b * 53) % 250;
        for (let wy = 0; wy < 15; wy++) {
          for (let wx2 = 0; wx2 < 5; wx2++) {
            if (Math.random() > 0.4) {
              lights.push({
                x: bx + wx2 * 8 + 4,
                y: H - bh + wy * 14 + 10,
                r: 220 + randInt(0, 35),
                g: 190 + randInt(0, 40),
                b: 100 + randInt(0, 80)
              });
            }
          }
        }
      }
      return { lights };
    }
  },
  {
    name: 'arctique',
    gen: (canvas, frame, data) => genArctique(canvas, frame, data.crystals),
    init: () => {
      const crystals = [];
      for (let i = 0; i < 60; i++) {
        crystals.push({
          x: rand(0, W), y: rand(0, H),
          angle: rand(0, Math.PI),
          size: rand(8, 25)
        });
      }
      return { crystals };
    }
  },
  {
    name: 'cosmos',
    gen: (canvas, frame, data) => genCosmos(canvas, frame, data.stars),
    init: () => {
      const stars = [];
      for (let i = 0; i < 200; i++) {
        stars.push({ x: rand(0,W), y: rand(0,H), r: rand(0.5,2.5), alpha: rand(0.4,1) });
      }
      return { stars };
    }
  },
  {
    name: 'enchante',
    gen: (canvas, frame, data) => genEnchante(canvas, frame, data.sparks),
    init: () => ({ sparks: makeParticles(120, 808) })
  },
  {
    name: 'plage',
    gen: (canvas, frame, data) => genPlage(canvas, frame, data.foam),
    init: () => ({ foam: makeParticles(80, 909) })
  },
  {
    name: 'neopolis',
    gen: (canvas, frame, data) => genNeopolis(canvas, frame, data.glitchSeeds),
    init: () => {
      const glitchSeeds = [];
      for (let i = 0; i < 50; i++) {
        glitchSeeds.push({ x: randInt(0,W), y: randInt(0,H), h: randInt(1,8) });
      }
      return { glitchSeeds };
    }
  }
];

async function generateTheme(theme) {
  const framesDir = path.join(BASE, theme.name, 'frames_go');
  const outFile = path.join(BASE, theme.name, 'gameover.mp4');

  // Create frames directory
  fs.mkdirSync(framesDir, { recursive: true });

  const canvas = createCanvas(W, H);
  const data = theme.init();

  console.log(`  Generating ${FRAMES} frames for ${theme.name}...`);
  for (let f = 0; f < FRAMES; f++) {
    theme.gen(canvas, f, data);
    const buf = canvas.toBuffer('image/png');
    const framePath = path.join(framesDir, `frame_${String(f).padStart(4,'0')}.png`);
    fs.writeFileSync(framePath, buf);
    if ((f+1) % 30 === 0) process.stdout.write(`    ${f+1}/${FRAMES}\n`);
  }

  console.log(`  Encoding ${theme.name}...`);
  const cmd = [
    `"${FFMPEG}"`,
    `-y`,
    `-framerate ${FPS}`,
    `-i "${path.join(framesDir, 'frame_%04d.png')}"`,
    `-c:v libx264`,
    `-crf 20`,
    `-pix_fmt yuv420p`,
    `-movflags +faststart`,
    `"${outFile}"`
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'pipe' });
  } catch (e) {
    console.error(`  FFMPEG error for ${theme.name}:`, e.stderr ? e.stderr.toString().slice(-500) : e.message);
    throw e;
  }

  // Cleanup frames
  console.log(`  Cleaning up frames...`);
  const files = fs.readdirSync(framesDir);
  for (const f2 of files) fs.unlinkSync(path.join(framesDir, f2));
  fs.rmdirSync(framesDir);

  // Report size
  const stat = fs.statSync(outFile);
  const sizeKB = (stat.size / 1024).toFixed(1);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(2);
  console.log(`  ✓ ${theme.name}/gameover.mp4 → ${sizeMB} MB (${sizeKB} KB)`);
  return { name: theme.name, size: stat.size, sizeMB, sizeKB };
}

async function main() {
  console.log('=== Game Over Video Generator ===');
  console.log(`Spec: ${W}x${H} @ ${FPS}fps, ${FRAMES} frames (3s), H.264 CRF20\n`);

  const results = [];
  for (const theme of themes) {
    console.log(`\n[${theme.name.toUpperCase()}]`);
    try {
      const r = await generateTheme(theme);
      results.push(r);
    } catch (e) {
      console.error(`FAILED: ${theme.name} — ${e.message}`);
      results.push({ name: theme.name, error: e.message });
    }
  }

  console.log('\n=== SUMMARY ===');
  for (const r of results) {
    if (r.error) {
      console.log(`  ✗ ${r.name}: ERROR — ${r.error}`);
    } else {
      console.log(`  ✓ ${r.name}: ${r.sizeMB} MB`);
    }
  }
  console.log('\nDone.');
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
