'use strict';
// ============================================================
// gen_volcan_ocean.js — génère bg.mp4 pour VOLCAN et OCEAN
// 540x960px, 30fps, 180 frames (6s loop), H.264 MP4
// ============================================================
const { createCanvas } = require('c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/node_modules/canvas');
const fs   = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const BASE   = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/themes';
const W = 540, H = 960, FPS = 30, FRAMES = 180;

// ─── helpers ────────────────────────────────────────────────
function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function hex2rgb(hex) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return { r, g, b };
}

function rgba(hex, a) {
  const { r, g, b } = hex2rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function mod(v, m) { return ((v % m) + m) % m; }

// seeded pseudo-random for deterministic positions
function mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function saveFrame(canvas, dir, idx) {
  const buf = canvas.toBuffer('image/png');
  const p = path.join(dir, `frame_${String(idx).padStart(5,'0')}.png`);
  fs.writeFileSync(p, buf);
}

function encodeVideo(framesDir, outMp4) {
  const pattern = path.join(framesDir, 'frame_%05d.png');
  const args = [
    '-y',
    '-framerate', String(FPS),
    '-i', pattern,
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-crf', '18',
    '-preset', 'slow',
    '-movflags', '+faststart',
    outMp4
  ];
  console.log(`  Encoding → ${outMp4}`);
  const res = spawnSync(FFMPEG, args, { stdio: 'inherit', maxBuffer: 200 * 1024 * 1024 });
  if (res.status !== 0) throw new Error('FFmpeg failed with code ' + res.status);
}

function deleteFrames(framesDir) {
  const files = fs.readdirSync(framesDir).filter(f => f.endsWith('.png'));
  for (const f of files) fs.unlinkSync(path.join(framesDir, f));
  console.log(`  Deleted ${files.length} frames.`);
}

// ============================================================
//  THÈME 1 : VOLCAN
// ============================================================
function drawVolcan(ctx, T, rng_init) {
  const rng = mulberry32(42); // deterministic for static elements

  // ── Fond : gradient + cracks ─────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#180402');
  bgGrad.addColorStop(1, '#401008');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Cracks (crosshatch irrégulier) — dessinés une fois avec seed fixe
  ctx.save();
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = 1;
  const crackRng = mulberry32(7);
  for (let i = 0; i < 18; i++) {
    const x0 = crackRng() * W;
    const y0 = crackRng() * H;
    const len = 40 + crackRng() * 120;
    const ang = crackRng() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    // zigzag
    let cx = x0, cy = y0;
    for (let s = 0; s < 4; s++) {
      const nx = cx + Math.cos(ang + (crackRng()-0.5)*0.8) * len/4;
      const ny = cy + Math.sin(ang + (crackRng()-0.5)*0.8) * len/4;
      ctx.lineTo(nx, ny);
      cx = nx; cy = ny;
    }
    ctx.stroke();
  }
  ctx.restore();

  // ── Lueur du sol (pulsante) ───────────────────────────────
  const glowOpacity = 0.3 + 0.15 * Math.sin(T * 2 * Math.PI);
  const groundGrad = ctx.createRadialGradient(W/2, H, 0, W/2, H, W * 1.2);
  groundGrad.addColorStop(0,   rgba('#FF6020', glowOpacity));
  groundGrad.addColorStop(0.4, rgba('#F03810', glowOpacity * 0.6));
  groundGrad.addColorStop(1,   rgba('#180402', 0));
  ctx.fillStyle = groundGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Fumée (3 colonnes) ────────────────────────────────────
  const smokeRng = mulberry32(99);
  for (let s = 0; s < 3; s++) {
    const sx = (s + 1) * W / 4 + (smokeRng() - 0.5) * 60;
    // fumée monte lentement
    for (let p = 0; p < 8; p++) {
      const toff = mod(T - p * 0.07, 1);
      const sy = H - toff * H * 0.6;
      const sw = 20 + p * 8 + Math.sin(T * 3 + p) * 10;
      const so = (1 - toff) * 0.12;
      const drift = Math.sin(T * 1.5 + s * 2 + p * 0.5) * 20 * toff;
      const smokeGrad = ctx.createRadialGradient(sx + drift, sy, 0, sx + drift, sy, sw);
      smokeGrad.addColorStop(0,   `rgba(80,60,55,${so})`);
      smokeGrad.addColorStop(1,   `rgba(40,30,28,0)`);
      ctx.fillStyle = smokeGrad;
      ctx.beginPath();
      ctx.arc(sx + drift, sy, sw, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Rivières de lave (3) ──────────────────────────────────
  // Chaque rivière est un path bezier oscillant, y offset = T*50%H
  const rivers = [
    { x: W * 0.18, amp: 35, phase: 0,        freq: 1.8, w: 38 },
    { x: W * 0.52, amp: 28, phase: 1.5,      freq: 2.1, w: 45 },
    { x: W * 0.82, amp: 40, phase: 0.9,      freq: 1.6, w: 32 },
  ];

  for (const rv of rivers) {
    const yOff = mod(T * 0.5, 1) * H; // défilement vers le bas

    // dessiner la rivière en segments
    const steps = 30;
    const pts = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // y va de -H à H (on enroule)
      const y = mod(-H + t * H * 2 + yOff, H * 2) - H;
      const x = rv.x + Math.sin(t * Math.PI * rv.freq * 2 + T * Math.PI * 2 * 0.3 + rv.phase) * rv.amp;
      pts.push({ x, y });
    }

    // glow extérieur (lave refroidie)
    ctx.save();
    ctx.lineWidth = rv.w + 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(60,8,0,0.55)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const pm = pts[i-1], p = pts[i];
      const mx = (pm.x + p.x) / 2, my = (pm.y + p.y) / 2;
      ctx.quadraticCurveTo(pm.x, pm.y, mx, my);
    }
    ctx.stroke();

    // lave principale avec dégradé (on utilise un strokeStyle gradient en faisant plusieurs passes)
    // Core : rouge-orange-jaune (3 passes de largeur décroissante)
    const lavaColors = [
      { w: rv.w, color: 'rgba(200,20,0,0.85)' },
      { w: rv.w * 0.65, color: 'rgba(240,56,16,0.9)' },
      { w: rv.w * 0.35, color: 'rgba(255,180,40,0.95)' },
    ];

    for (const lc of lavaColors) {
      ctx.lineWidth = lc.w;
      ctx.strokeStyle = lc.color;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const pm = pts[i-1], p = pts[i];
        const mx = (pm.x + p.x) / 2, my = (pm.y + p.y) / 2;
        ctx.quadraticCurveTo(pm.x, pm.y, mx, my);
      }
      ctx.stroke();
    }

    // glow feather (flou visuel via couches transparentes)
    ctx.lineWidth = rv.w * 2.2;
    ctx.strokeStyle = 'rgba(240,80,10,0.12)';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const pm = pts[i-1], p = pts[i];
      const mx = (pm.x + p.x) / 2, my = (pm.y + p.y) / 2;
      ctx.quadraticCurveTo(pm.x, pm.y, mx, my);
    }
    ctx.stroke();

    ctx.restore();
  }

  // ── Bulles de lave (20) ───────────────────────────────────
  const bubbleRng = mulberry32(17);
  const NUM_BUBBLES = 20;
  for (let i = 0; i < NUM_BUBBLES; i++) {
    const bPhase = bubbleRng(); // 0-1 initial phase
    const bX_base = bubbleRng() * W;
    const bSpeed  = 0.04 + bubbleRng() * 0.08; // vitesse de montée (fraction H/frame)
    const bYraw   = mod(bPhase + T * bSpeed, 1); // 0=haut, 1=bas → inverse: monte
    // bulle monte de bas en haut : y = H*(1 - bYraw)
    const by = H * (1 - bYraw);
    const bx = bX_base + Math.sin(T * 3 + i * 1.3) * 8;

    // taille : grossit en approchant d'une rivière de lave (y ~ H/2 ± 200)
    const nearLava = Math.exp(-Math.pow((by - H*0.5) / 150, 2));
    const br = lerp(3, 14, nearLava);

    // éclaboussure si très proche d'une rivière
    if (nearLava > 0.85) {
      // particules d'éclaboussure
      const numSpark = 5;
      for (let sp = 0; sp < numSpark; sp++) {
        const ang = (sp / numSpark) * Math.PI * 2 + T * 10;
        const dist = br * 1.8 * (1 - nearLava + 0.2);
        const sx = bx + Math.cos(ang) * dist;
        const sy = by + Math.sin(ang) * dist;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(255,140,20,${0.7 * nearLava})`;
        ctx.fill();
      }
    }

    // bulle principale
    const gBub = ctx.createRadialGradient(bx - br*0.3, by - br*0.3, 0, bx, by, br);
    gBub.addColorStop(0, 'rgba(255,200,60,0.9)');
    gBub.addColorStop(0.5, 'rgba(240,80,10,0.8)');
    gBub.addColorStop(1, 'rgba(140,10,0,0.6)');
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fillStyle = gBub;
    ctx.fill();
  }

  // ── Braises / cendres (50) ────────────────────────────────
  const emberRng = mulberry32(33);
  const NUM_EMBERS = 50;
  for (let i = 0; i < NUM_EMBERS; i++) {
    const ePhase  = emberRng();
    const eX_base = emberRng() * W;
    const eSpeed  = 0.03 + emberRng() * 0.07;
    const eColor  = emberRng() > 0.5 ? '#F08020' : '#F03810';
    const eSz     = 1.5 + emberRng() * 3;
    // tombe depuis haut
    const eyRaw = mod(ePhase + T * eSpeed, 1);
    const ey = eyRaw * H;
    // zigzag horizontal
    const ex = eX_base + Math.sin(T * 4 + i * 0.7) * 15 + Math.cos(T * 2.5 + i) * 8;
    const alpha = 0.4 + 0.5 * Math.sin(T * 8 + i * 1.1);

    ctx.beginPath();
    ctx.arc(ex, ey, eSz, 0, Math.PI*2);
    ctx.fillStyle = rgba(eColor, alpha);
    ctx.fill();

    // petite trainée
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - Math.sin(T*4+i*0.7)*4, ey - 8);
    ctx.strokeStyle = rgba(eColor, alpha * 0.4);
    ctx.lineWidth = eSz * 0.7;
    ctx.stroke();
  }
}

// ============================================================
//  THÈME 2 : OCEAN
// ============================================================
function drawOcean(ctx, T) {

  // ── Fond : gradient + sable ───────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#040C28');
  bgGrad.addColorStop(1, '#090F44');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Sable au fond (ligne irrégulière + particules)
  const sandY = H - 40;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(0, H);
  // ligne irrégulière de sable
  const sandRng = mulberry32(55);
  const sandPts = 20;
  for (let i = 0; i <= sandPts; i++) {
    const sx = (i / sandPts) * W;
    const sy = sandY + (sandRng() - 0.5) * 18 + Math.sin(T * 0.5 + i * 0.8) * 5;
    ctx.lineTo(sx, sy);
  }
  ctx.lineTo(W, H);
  ctx.closePath();
  const sandGrad = ctx.createLinearGradient(0, sandY, 0, H);
  sandGrad.addColorStop(0, 'rgba(180,150,90,0.55)');
  sandGrad.addColorStop(1, 'rgba(120,100,60,0.3)');
  ctx.fillStyle = sandGrad;
  ctx.fill();

  // particules de sable
  const sandPRng = mulberry32(66);
  for (let i = 0; i < 30; i++) {
    const px = sandPRng() * W;
    const py = sandY + sandPRng() * 30;
    const pr = 0.8 + sandPRng() * 1.5;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI*2);
    ctx.fillStyle = `rgba(200,175,110,0.4)`;
    ctx.fill();
  }
  ctx.restore();

  // ── Rayons lumineux (caustics) — 6 colonnes ───────────────
  for (let r = 0; r < 6; r++) {
    const rx = (r + 0.5) * (W / 6) + Math.sin(T * 0.8 + r) * 15;
    const rw = 20 + Math.sin(T * 1.2 + r * 0.9) * 10;
    const ro = (0.04 + 0.04 * Math.sin(T * 2 + r * 1.3));
    const rayGrad = ctx.createLinearGradient(rx, 0, rx, H * 0.8);
    rayGrad.addColorStop(0,   `rgba(80,200,240,${ro})`);
    rayGrad.addColorStop(0.6, `rgba(80,200,240,${ro * 0.4})`);
    rayGrad.addColorStop(1,   `rgba(80,200,240,0)`);
    ctx.fillStyle = rayGrad;
    ctx.fillRect(rx - rw/2, 0, rw, H * 0.8);
  }

  // ── Particules bioluminescentes (15) ──────────────────────
  const bioRng = mulberry32(88);
  for (let i = 0; i < 15; i++) {
    const bx = bioRng() * W + Math.sin(T * 0.7 + i * 1.1) * 20;
    const by = bioRng() * H * 0.85 + Math.cos(T * 0.5 + i * 0.8) * 15;
    const br = 2 + 1.5 * Math.sin(T * 3 + i * 2.1);
    const ba = 0.4 + 0.4 * Math.sin(T * 4 + i * 1.7);
    // glow
    const bioGrad = ctx.createRadialGradient(bx, by, 0, bx, by, br * 4);
    bioGrad.addColorStop(0, `rgba(32,232,192,${ba})`);
    bioGrad.addColorStop(1, `rgba(32,232,192,0)`);
    ctx.fillStyle = bioGrad;
    ctx.beginPath();
    ctx.arc(bx, by, br * 4, 0, Math.PI*2);
    ctx.fill();
    // point central
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI*2);
    ctx.fillStyle = `rgba(32,232,192,${ba})`;
    ctx.fill();
  }

  // ── Bulles (40) ───────────────────────────────────────────
  const bubRng = mulberry32(22);
  for (let i = 0; i < 40; i++) {
    const bPhase = bubRng();
    const bXbase = bubRng() * W;
    const bSpeed = 0.02 + bubRng() * 0.06;
    const bR     = 1.5 + bubRng() * 4;
    const bYraw  = mod(bPhase + T * bSpeed, 1);
    const by     = H * (1 - bYraw); // monte de bas en haut
    const bx     = bXbase + Math.sin(T * 2 + i * 0.9) * 6;
    const ba     = 0.25 + 0.15 * Math.sin(T * 5 + i);

    ctx.beginPath();
    ctx.arc(bx, by, bR, 0, Math.PI*2);
    ctx.strokeStyle = `rgba(80,200,240,${ba})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
    // reflet
    ctx.beginPath();
    ctx.arc(bx - bR*0.3, by - bR*0.3, bR*0.25, 0, Math.PI*2);
    ctx.fillStyle = `rgba(255,255,255,${ba * 0.6})`;
    ctx.fill();
  }

  // ── Méduses (4) ───────────────────────────────────────────
  const jellyRng = mulberry32(44);
  const jellyColors = [
    { body: 'rgba(220,120,255,', glow: 'rgba(80,232,240,' },
    { body: 'rgba(180,80,230,',  glow: 'rgba(80,200,240,' },
    { body: 'rgba(240,140,220,', glow: 'rgba(32,232,192,' },
    { body: 'rgba(200,100,255,', glow: 'rgba(80,200,240,' },
  ];

  for (let j = 0; j < 4; j++) {
    const jxBase = jellyRng() * (W - 80) + 40;
    const jyBase = jellyRng() * (H * 0.55) + H * 0.1;
    // yo-yo vertical
    const jyOff = Math.sin(T * 2 * Math.PI * (0.12 + j*0.03) + j * 1.4) * 60;
    const jx = jxBase + Math.sin(T * 2 * Math.PI * 0.08 + j * 2) * 25;
    const jy = jyBase + jyOff;
    const jR = 18 + j * 5;
    const jAlpha = 0.55 + 0.15 * Math.sin(T * 3 + j);
    const jc = jellyColors[j];

    // glow extérieur
    const glowG = ctx.createRadialGradient(jx, jy, 0, jx, jy, jR * 2.5);
    glowG.addColorStop(0, jc.glow + `${jAlpha * 0.4})`);
    glowG.addColorStop(1, jc.glow + '0)');
    ctx.fillStyle = glowG;
    ctx.beginPath();
    ctx.arc(jx, jy, jR * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // corps (demi-cercle haut)
    ctx.save();
    ctx.beginPath();
    ctx.arc(jx, jy, jR, Math.PI, 0);
    ctx.closePath();
    const bodyGrad = ctx.createRadialGradient(jx, jy - jR*0.3, 0, jx, jy, jR);
    bodyGrad.addColorStop(0, jc.body + `${jAlpha + 0.1})`);
    bodyGrad.addColorStop(0.7, jc.body + `${jAlpha})`);
    bodyGrad.addColorStop(1, jc.body + `${jAlpha * 0.3})`);
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    // bordure luminescente
    ctx.strokeStyle = jc.glow + '0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // tentacules (8)
    const numTentacles = 8;
    for (let t = 0; t < numTentacles; t++) {
      const tx_start = jx - jR * 0.8 + (t / (numTentacles-1)) * jR * 1.6;
      const ty_start = jy + 2;
      const tLen = 30 + jellyRng() * 25;
      ctx.beginPath();
      ctx.moveTo(tx_start, ty_start);
      // sinueux
      const segs = 5;
      for (let s = 1; s <= segs; s++) {
        const ts = s / segs;
        const tentX = tx_start + Math.sin(T * 3 + t * 1.2 + s * 0.8) * (8 * ts);
        const tentY = ty_start + ts * tLen;
        ctx.lineTo(tentX, tentY);
      }
      ctx.strokeStyle = jc.glow + `${jAlpha * 0.65})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // ── Bancs de poissons (2) ─────────────────────────────────
  const schoolDefs = [
    { dir: 1,  y: H * 0.30, count: 10, speed: 0.06, size: 14, phase: 0 },
    { dir: -1, y: H * 0.55, count: 8,  speed: 0.045, size: 16, phase: 0.4 },
  ];

  for (const school of schoolDefs) {
    const numFish = school.count;
    // position de tête du banc (cycle 0-1)
    const headT = mod(T * school.speed + school.phase, 1);
    const headX = school.dir === 1
      ? lerp(-80, W + 80, headT)
      : lerp(W + 80, -80, headT);
    const headY = school.y;

    // formation : les poissons suivent en décalé (S-curve formation)
    for (let f = 0; f < numFish; f++) {
      const fOffset = f / numFish;
      // décalage en temps pour la formation
      const fishT = mod(headT - fOffset * 0.08, 1);
      const fishX = school.dir === 1
        ? lerp(-80, W + 80, fishT)
        : lerp(W + 80, -80, fishT);
      // ondulation en Y pour former un S
      const fishY = headY + Math.sin(fishT * Math.PI * 6 + f * 0.6) * 20
                           + (f % 3 - 1) * 12;
      const sz = school.size * (1 - f * 0.02);
      const alpha = 0.7 + 0.2 * Math.sin(T * 4 + f);

      ctx.save();
      ctx.translate(fishX, fishY);
      ctx.scale(school.dir, 1); // flip pour direction

      // angle de nage (légère ondulation)
      const swimAngle = Math.sin(T * 6 + f * 0.8) * 0.15;
      ctx.rotate(swimAngle);

      // corps du poisson (ellipse)
      ctx.beginPath();
      ctx.ellipse(0, 0, sz, sz * 0.45, 0, 0, Math.PI * 2);
      const fishGrad = ctx.createRadialGradient(-sz*0.2, 0, 0, 0, 0, sz);
      fishGrad.addColorStop(0, `rgba(80,200,240,${alpha})`);
      fishGrad.addColorStop(0.6, `rgba(40,170,160,${alpha})`);
      fishGrad.addColorStop(1, `rgba(20,120,120,${alpha * 0.6})`);
      ctx.fillStyle = fishGrad;
      ctx.fill();

      // queue (bezier)
      const qWave = Math.sin(T * 8 + f * 1.2) * 0.4;
      ctx.beginPath();
      ctx.moveTo(-sz * 0.7, 0);
      ctx.quadraticCurveTo(-sz * 1.2, sz * 0.45 + qWave * sz * 0.3, -sz * 1.5, sz * 0.4);
      ctx.quadraticCurveTo(-sz * 1.2, -sz * 0.1 + qWave * sz * 0.3, -sz * 0.7, 0);
      ctx.fillStyle = `rgba(40,170,160,${alpha * 0.8})`;
      ctx.fill();

      // oeil
      ctx.beginPath();
      ctx.arc(sz * 0.35, -sz * 0.1, sz * 0.12, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(sz * 0.37, -sz * 0.1, sz * 0.07, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10,30,60,${alpha})`;
      ctx.fill();

      ctx.restore();
    }
  }
}

// ============================================================
//  MAIN — génération séquentielle
// ============================================================
async function generateTheme(name, drawFn) {
  const themeDir  = path.join(BASE, name);
  const framesDir = path.join(themeDir, 'frames');
  const outMp4    = path.join(themeDir, 'bg.mp4');

  ensureDir(themeDir);
  ensureDir(framesDir);

  console.log(`\n=== Génération THÈME : ${name.toUpperCase()} ===`);
  console.log(`  Frames : ${FRAMES} (${FRAMES/FPS}s @ ${FPS}fps) — ${W}x${H}px`);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');
  const rng    = mulberry32(123);

  for (let f = 0; f < FRAMES; f++) {
    const T = f / FRAMES; // 0..1 (une période)
    ctx.clearRect(0, 0, W, H);
    drawFn(ctx, T, rng);
    saveFrame(canvas, framesDir, f);
    if (f % 30 === 0) process.stdout.write(`  Frame ${f}/${FRAMES}\r`);
  }
  console.log(`  Frame ${FRAMES}/${FRAMES} — OK                    `);

  encodeVideo(framesDir, outMp4);
  deleteFrames(framesDir);

  const stat = fs.statSync(outMp4);
  console.log(`  Taille finale : ${(stat.size / 1024 / 1024).toFixed(2)} MB → ${outMp4}`);
  return stat.size;
}

(async () => {
  try {
    const t0 = Date.now();

    await generateTheme('volcan', drawVolcan);
    await generateTheme('ocean',  drawOcean);

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n=== TERMINÉ en ${elapsed}s ===`);
  } catch(e) {
    console.error('ERREUR :', e);
    process.exit(1);
  }
})();
