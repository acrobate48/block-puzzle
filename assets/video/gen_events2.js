'use strict';
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const OUT_DIR = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/video';
const FRAMES_DIR = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/video/frames';

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }
function easeOut(t) { return 1 - Math.pow(1 - clamp(t, 0, 1), 3); }

function saveFrame(canvas, dir, idx) {
  const buf = canvas.toBuffer('image/png');
  const p = path.join(dir, `frame_${String(idx).padStart(4, '0')}.png`);
  fs.writeFileSync(p, buf);
}

function encodeVideo(framesDir, outFile, fps, width, height) {
  const pattern = path.join(framesDir, 'frame_%04d.png');
  const cmd = `"${FFMPEG}" -y -framerate ${fps} -i "${pattern}" -vf "scale=${width}:${height}" -c:v libx264 -pix_fmt yuv420p -crf 18 "${outFile}"`;
  console.log('Encoding:', outFile);
  execSync(cmd, { stdio: 'inherit' });
}

function clearFrames(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => {
      if (f.endsWith('.png')) fs.unlinkSync(path.join(dir, f));
    });
  }
  ensureDir(dir);
}

// ─────────────────────────────────────────────────────────────────
// 1. PERFECT CLEAR — 540x960, 30fps, 90 frames
// ─────────────────────────────────────────────────────────────────
function genPerfectClear() {
  const W = 540, H = 960, FRAMES = 90;
  const framesDir = path.join(FRAMES_DIR, 'perfect_clear');
  clearFrames(framesDir);

  // Seed confetti
  const rng = (() => { let s = 42; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })();
  const CONFETTI_COLORS = ['#FF4040','#FF8040','#FFD040','#40FF80','#40C0FF','#C040FF','#FF40C0'];
  const confetti = Array.from({length: 200}, (_, i) => ({
    x: rng() * W,
    y: -10 - rng() * 200,
    vx: (rng() - 0.5) * 2,
    vy: rng() * 2 + 1,
    rot: rng() * Math.PI * 2,
    vrot: (rng() - 0.5) * 0.2,
    color: CONFETTI_COLORS[Math.floor(rng() * CONFETTI_COLORS.length)],
    startFrame: 10 + Math.floor(rng() * 20),
  }));

  // Orbital particles
  const ORBIT_COUNT = 20;
  const orbitParticles = Array.from({length: ORBIT_COUNT}, (_, i) => ({
    angle: (i / ORBIT_COUNT) * Math.PI * 2,
    speed: 0.06 + rng() * 0.03,
    r: 100 + rng() * 40,
  }));

  const RAYS = 8;
  const RAY_COLORS = ['#FF4040','#FF8040','#FFD040','#40FF80','#40C0FF','#C040FF','#FF40C0','#FFFFFF'];

  for (let f = 0; f < FRAMES; f++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Background — deep dark blue-purple
    const bg = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, H * 0.7);
    bg.addColorStop(0, '#1a0040');
    bg.addColorStop(1, '#000010');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // f0-10: white flash
    if (f < 10) {
      const flashAlpha = lerp(1, 0.02, f / 10);
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // f10-40: 8 rainbow rays
    if (f >= 10 && f < 40) {
      const t = (f - 10) / 30;
      const spin = t * 0.4;
      ctx.save();
      ctx.translate(W/2, H/2);
      for (let r = 0; r < RAYS; r++) {
        const angle = (r / RAYS) * Math.PI * 2 + spin;
        const halfSpread = Math.PI / RAYS * 0.5;
        const sinOp = 0.5 + 0.5 * Math.sin(t * Math.PI * 2 + r);
        ctx.globalAlpha = sinOp * 0.65 * easeOut(t);

        const grad = ctx.createLinearGradient(0, 0,
          Math.cos(angle) * H, Math.sin(angle) * H);
        grad.addColorStop(0, RAY_COLORS[r]);
        grad.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(angle - halfSpread) * H, Math.sin(angle - halfSpread) * H);
        ctx.lineTo(Math.cos(angle + halfSpread) * H, Math.sin(angle + halfSpread) * H);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
      }
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // f10-60: confetti
    if (f >= 10 && f < 60) {
      confetti.forEach(c => {
        if (f < c.startFrame) return;
        const age = f - c.startFrame;
        const cx = c.x + c.vx * age;
        const cy = c.y + c.vy * age + 0.075 * age * age; // gravity 0.15/2
        const rot = c.rot + c.vrot * age;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = c.color;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(-1, -4, 2, 8);
        ctx.restore();
        ctx.globalAlpha = 1;
      });
    }

    // f20-70: PERFECT CLEAR text with spring bounce
    if (f >= 20 && f < 70) {
      const tf = f - 20;
      const dur = 50;
      let scale = 1;
      if (tf < 15) {
        // spring: 0 → 1.2 → 1.0
        const p = tf / 15;
        scale = p < 0.7 ? lerp(0, 1.25, p / 0.7) : lerp(1.25, 1.0, (p - 0.7) / 0.3);
      }
      const fadeOut = tf > 40 ? 1 - (tf - 40) / 10 : 1;
      ctx.save();
      ctx.globalAlpha = clamp(fadeOut, 0, 1);
      ctx.translate(W/2, H/2 - 30);
      ctx.scale(scale, scale);

      // Glow
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 30;

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // PERFECT
      ctx.font = 'bold 68px Impact, Arial Black, sans-serif';
      const perfGrad = ctx.createLinearGradient(-150, -40, 150, 40);
      perfGrad.addColorStop(0, '#FFFFFF');
      perfGrad.addColorStop(0.5, '#FFD700');
      perfGrad.addColorStop(1, '#FFFFFF');
      ctx.fillStyle = perfGrad;
      ctx.fillText('PERFECT', 0, -45);

      // CLEAR!
      ctx.font = 'bold 68px Impact, Arial Black, sans-serif';
      const clearGrad = ctx.createLinearGradient(-130, -40, 130, 40);
      clearGrad.addColorStop(0, '#FFD700');
      clearGrad.addColorStop(0.5, '#FFFFFF');
      clearGrad.addColorStop(1, '#FFD700');
      ctx.fillStyle = clearGrad;
      ctx.fillText('CLEAR !', 0, 35);

      ctx.restore();
      ctx.globalAlpha = 1;

      // f20-70: orbital golden particles
      if (f >= 20 && f < 70) {
        const orbitAge = (f - 20) / 50;
        orbitParticles.forEach(op => {
          const a = op.angle + op.speed * (f - 20);
          const px = W/2 + Math.cos(a) * op.r;
          const py = H/2 - 30 + Math.sin(a) * op.r * 0.35;
          ctx.beginPath();
          ctx.arc(px, py, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFD700';
          ctx.globalAlpha = 0.8 * clamp(orbitAge * 3, 0, 1) * clamp(fadeOut, 0, 1);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
      }
    }

    // f70-90: fade out
    if (f >= 70) {
      const fadeAlpha = (f - 70) / 20;
      ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    saveFrame(canvas, framesDir, f);
  }

  const outFile = path.join(OUT_DIR, 'perfect_clear.mp4');
  encodeVideo(framesDir, outFile, 30, W, H);
  console.log('perfect_clear.mp4 done — 540x960 @ 30fps, 90 frames');
}

// ─────────────────────────────────────────────────────────────────
// 2. NEW RECORD — 540x960, 30fps, 120 frames
// ─────────────────────────────────────────────────────────────────
function genNewRecord() {
  const W = 540, H = 960, FRAMES = 120;
  const framesDir = path.join(FRAMES_DIR, 'new_record');
  clearFrames(framesDir);

  const rng = (() => { let s = 137; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })();

  // 200 stars
  const stars = Array.from({length: 200}, () => ({
    x: rng() * W,
    y: rng() * H,
    size: rng() * 2 + 0.5,
    fadeStart: rng() * 18,
    brightness: 0.4 + rng() * 0.6,
  }));

  // 5 fireworks
  const FW_COLORS = [
    ['#FFD700','#FFA500'],
    ['#FF2020','#FF8040'],
    ['#4080FF','#80C0FF'],
    ['#FF40C0','#FFD700'],
    ['#40FFB0','#FFD700'],
  ];
  const fireworks = [
    { x: W*0.25, y: H*0.20, startF: 0,  color: FW_COLORS[0] },
    { x: W*0.75, y: H*0.30, startF: 6,  color: FW_COLORS[1] },
    { x: W*0.50, y: H*0.12, startF: 12, color: FW_COLORS[2] },
    { x: W*0.15, y: H*0.40, startF: 18, color: FW_COLORS[3] },
    { x: W*0.85, y: H*0.22, startF: 24, color: FW_COLORS[4] },
  ];
  const TRAILS = 24;

  // Medals (5-pointed stars)
  const medals = Array.from({length: 50}, () => ({
    x: rng() * W,
    y: -20 - rng() * 200,
    size: 8 + rng() * 8,
    vx: (rng() - 0.5) * 1.5,
    vy: rng() * 2 + 1.5,
    rot: rng() * Math.PI * 2,
    vrot: (rng() - 0.5) * 0.15,
    startFrame: 50 + Math.floor(rng() * 20),
  }));

  function drawStar5(ctx, cx, cy, r, rot) {
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = rot + (i * Math.PI) / 5 - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r * 0.4;
      const x = cx + Math.cos(a) * rad;
      const y = cy + Math.sin(a) * rad;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function drawFirework(ctx, fw, f) {
    if (f < fw.startF || f >= fw.startF + 40) return;
    const age = f - fw.startF;
    const t = age / 40;

    // Central glow
    const glowR = lerp(0, 20, clamp(age / 8, 0, 1)) * (1 - easeOut(clamp((age - 20) / 20, 0, 1)));
    if (glowR > 0) {
      const glowGrad = ctx.createRadialGradient(fw.x, fw.y, 0, fw.x, fw.y, glowR);
      glowGrad.addColorStop(0, fw.color[0]);
      glowGrad.addColorStop(1, 'transparent');
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 24 trails
    for (let i = 0; i < TRAILS; i++) {
      const angle = (i / TRAILS) * Math.PI * 2;
      const maxDist = 110;
      const dist = easeOut(clamp(age / 20, 0, 1)) * maxDist;
      const fade = 1 - clamp((age - 15) / 25, 0, 1);
      const tx = fw.x + Math.cos(angle) * dist;
      const ty = fw.y + Math.sin(angle) * dist + 0.3 * dist * dist / maxDist; // slight gravity
      const trailLen = 10;
      const tx2 = fw.x + Math.cos(angle) * Math.max(0, dist - trailLen);
      const ty2 = fw.y + Math.sin(angle) * Math.max(0, dist - trailLen) + 0.3 * Math.max(0, dist - trailLen) * Math.max(0, dist - trailLen) / maxDist;

      ctx.globalAlpha = fade * 0.85;
      ctx.strokeStyle = i % 2 === 0 ? fw.color[0] : fw.color[1];
      ctx.lineWidth = 2;
      ctx.shadowColor = fw.color[0];
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.lineTo(tx2, ty2);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    ctx.globalAlpha = 1;
  }

  function drawTrophy(ctx, progress, W, H) {
    // Rises from bottom
    const baseY = H * 0.58;
    const offsetY = lerp(H * 0.3, 0, easeOut(progress));
    const cy = baseY + offsetY;
    const cx = W / 2;

    ctx.save();
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 40 * progress;

    // Cup body (oval ellipse)
    const cupW = 80, cupH = 90;
    const cupGrad = ctx.createLinearGradient(cx - cupW, cy - cupH / 2, cx + cupW, cy + cupH / 2);
    cupGrad.addColorStop(0, '#CC8800');
    cupGrad.addColorStop(0.3, '#FFD700');
    cupGrad.addColorStop(0.7, '#FFE84D');
    cupGrad.addColorStop(1, '#CC8800');

    // Body
    ctx.beginPath();
    ctx.ellipse(cx, cy, cupW, cupH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = cupGrad;
    ctx.fill();

    // Rim top
    ctx.beginPath();
    ctx.ellipse(cx, cy - cupH / 2, cupW + 6, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFE84D';
    ctx.fill();

    // Left handle
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.ellipse(cx - cupW - 10, cy - 10, 18, 28, -0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Right handle
    ctx.beginPath();
    ctx.ellipse(cx + cupW + 10, cy - 10, 18, 28, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    // Stem
    const stemGrad = ctx.createLinearGradient(cx - 12, cy + cupH/2, cx + 12, cy + cupH/2 + 40);
    stemGrad.addColorStop(0, '#CC8800');
    stemGrad.addColorStop(1, '#FFD700');
    ctx.fillStyle = stemGrad;
    ctx.fillRect(cx - 12, cy + cupH/2 - 5, 24, 45);

    // Base
    const baseGrad = ctx.createLinearGradient(cx - 55, cy + cupH/2 + 38, cx + 55, cy + cupH/2 + 55);
    baseGrad.addColorStop(0, '#CC8800');
    baseGrad.addColorStop(0.5, '#FFE84D');
    baseGrad.addColorStop(1, '#CC8800');
    ctx.fillStyle = baseGrad;
    ctx.beginPath();
    ctx.ellipse(cx, cy + cupH/2 + 40, 55, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Star inside cup
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#FFFF80';
    drawStar5(ctx, cx, cy - 10, 28, -Math.PI/2);
    const starGrad = ctx.createRadialGradient(cx, cy - 10, 0, cx, cy - 10, 28);
    starGrad.addColorStop(0, '#FFFFAA');
    starGrad.addColorStop(1, '#FFD700');
    ctx.fillStyle = starGrad;
    ctx.fill();

    ctx.restore();
  }

  for (let f = 0; f < FRAMES; f++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Background black with subtle gradient
    ctx.fillStyle = '#000008';
    ctx.fillRect(0, 0, W, H);

    // f0-20: stars fade in
    stars.forEach(s => {
      if (f < s.fadeStart) return;
      const alpha = clamp((f - s.fadeStart) / 8, 0, 1) * s.brightness;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,220,${alpha})`;
      ctx.fill();
    });

    // f0-40: fireworks
    ctx.save();
    fireworks.forEach(fw => drawFirework(ctx, fw, f));
    ctx.restore();

    // f25-70: trophy rises
    if (f >= 25 && f < 70) {
      const tProgress = clamp((f - 25) / 30, 0, 1);
      const fadeOut = f > 60 ? 1 - (f - 60) / 10 : 1;
      ctx.globalAlpha = clamp(fadeOut, 0, 1);
      drawTrophy(ctx, tProgress, W, H);
      ctx.globalAlpha = 1;
    }

    // f40-90: NOUVEAU RECORD! text
    if (f >= 40 && f < 90) {
      const tf = f - 40;
      let scale = 1;
      if (tf < 15) {
        const p = tf / 15;
        scale = p < 0.7 ? lerp(0, 1.25, p / 0.7) : lerp(1.25, 1.0, (p - 0.7) / 0.3);
      }
      const fadeOut = tf > 40 ? 1 - (tf - 40) / 10 : 1;

      ctx.save();
      ctx.globalAlpha = clamp(fadeOut, 0, 1);
      ctx.translate(W/2, H * 0.80);
      ctx.scale(scale, scale);

      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 25;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 52px Impact, Arial Black, sans-serif';

      const recGrad = ctx.createLinearGradient(-200, -30, 200, 30);
      recGrad.addColorStop(0, '#FFD700');
      recGrad.addColorStop(0.4, '#FFFFAA');
      recGrad.addColorStop(0.6, '#FFFFAA');
      recGrad.addColorStop(1, '#FFD700');
      ctx.fillStyle = recGrad;
      ctx.fillText('NOUVEAU', 0, -32);
      ctx.fillText('RECORD !', 0, 32);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // f50-90: medals rain
    if (f >= 50 && f < 90) {
      medals.forEach(m => {
        if (f < m.startFrame) return;
        const age = f - m.startFrame;
        const mx = m.x + m.vx * age;
        const my = m.y + m.vy * age + 0.075 * age * age;
        const rot = m.rot + m.vrot * age;
        const fadeOut = f > 80 ? 1 - (f - 80) / 10 : 1;
        ctx.save();
        ctx.globalAlpha = 0.9 * clamp(fadeOut, 0, 1);
        ctx.translate(mx, my);
        ctx.rotate(rot);
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 8;
        drawStar5(ctx, 0, 0, m.size, 0);
        const mg = ctx.createRadialGradient(0, 0, 0, 0, 0, m.size);
        mg.addColorStop(0, '#FFFFAA');
        mg.addColorStop(1, '#CC8800');
        ctx.fillStyle = mg;
        ctx.fill();
        ctx.restore();
        ctx.globalAlpha = 1;
      });
    }

    // f90-120: progressive fade out
    if (f >= 90) {
      const fadeAlpha = (f - 90) / 30;
      ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    saveFrame(canvas, framesDir, f);
  }

  const outFile = path.join(OUT_DIR, 'new_record.mp4');
  encodeVideo(framesDir, outFile, 30, W, H);
  console.log('new_record.mp4 done — 540x960 @ 30fps, 120 frames');
}

// ─────────────────────────────────────────────────────────────────
// 3. BOMB EXPLODE — 400x400, 30fps, 45 frames
// ─────────────────────────────────────────────────────────────────
function genBombExplode() {
  const W = 400, H = 400, FRAMES = 45;
  const CX = W / 2, CY = H / 2;
  const framesDir = path.join(FRAMES_DIR, 'bomb_explode');
  clearFrames(framesDir);

  const rng = (() => { let s = 999; return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; }; })();

  // 16 debris
  const DEBRIS_COLORS = ['#FF6000','#FF3000','#FF8800','#CC2200','#111111','#FF4400'];
  const debris = Array.from({length: 16}, (_, i) => {
    const angle = (i / 16) * Math.PI * 2 + rng() * 0.3;
    const speed = 6 + rng() * 5;
    return {
      angle,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rot: rng() * Math.PI * 2,
      vrot: (rng() - 0.5) * 0.4,
      color: DEBRIS_COLORS[Math.floor(rng() * DEBRIS_COLORS.length)],
    };
  });

  // 3 smoke circles
  const smoke = Array.from({length: 3}, (_, i) => ({
    x: CX + (rng() - 0.5) * 40,
    vx: (rng() - 0.5) * 1.5,
    vy: -(1.5 + rng() * 1.5),
    r0: 20 + rng() * 20,
  }));

  // 40 sparks
  const sparks = Array.from({length: 40}, () => {
    const angle = rng() * Math.PI * 2;
    const speed = 3 + rng() * 8;
    return {
      x: CX, y: CY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      size: 1 + rng() * 1.5,
    };
  });

  for (let f = 0; f < FRAMES; f++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext('2d');

    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, W, H);

    // f0-5: white flash
    if (f < 5) {
      const flashAlpha = lerp(1, 0, f / 5);
      ctx.fillStyle = `rgba(255,255,255,${flashAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    // f5-15: fireball
    if (f >= 5 && f < 15) {
      const age = f - 5;
      const t = age / 10;
      const r = lerp(0, 160, easeOut(t));

      const fireGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r);
      fireGrad.addColorStop(0,   '#FFFFFF');
      fireGrad.addColorStop(0.2, '#FFFF80');
      fireGrad.addColorStop(0.5, '#FF8000');
      fireGrad.addColorStop(0.8, '#FF2000');
      fireGrad.addColorStop(1,   'transparent');
      ctx.shadowColor = '#FF6000';
      ctx.shadowBlur = 40;
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(CX, CY, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // After f15 — lingering glow
    if (f >= 15 && f < 30) {
      const age = f - 15;
      const fade = 1 - age / 15;
      const r = 160 * fade;
      const fireGrad = ctx.createRadialGradient(CX, CY, 0, CX, CY, r + 20);
      fireGrad.addColorStop(0, `rgba(255,120,0,${0.4 * fade})`);
      fireGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fireGrad;
      ctx.beginPath();
      ctx.arc(CX, CY, r + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // f5-25: debris
    if (f >= 5 && f < 25) {
      const age = f - 5;
      debris.forEach(d => {
        const dx = CX + d.vx * age;
        const dy = CY + d.vy * age + 0.15 * age * age;
        const rot = d.rot + d.vrot * age;
        const fade = 1 - clamp((age - 10) / 10, 0, 1);
        ctx.save();
        ctx.globalAlpha = fade;
        ctx.translate(dx, dy);
        ctx.rotate(rot);
        ctx.fillStyle = d.color;
        ctx.fillRect(-2, -6, 4, 12);
        ctx.restore();
        ctx.globalAlpha = 1;
      });
    }

    // f10-30: shockwave ring
    if (f >= 10 && f < 30) {
      const age = f - 10;
      const t = age / 20;
      const ringR = lerp(0, 200, easeOut(t));
      const ringAlpha = 1 - t;
      ctx.globalAlpha = ringAlpha;
      ctx.strokeStyle = `rgba(255,180,60,1)`;
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(CX, CY, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Outer faint ring
      ctx.strokeStyle = `rgba(255,255,255,${ringAlpha * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(CX, CY, ringR + 6, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    // f15-45: smoke
    if (f >= 15) {
      const age = f - 15;
      smoke.forEach((s, si) => {
        const sx = s.x + s.vx * age;
        const sy = CY - 10 + s.vy * age;
        const sr = s.r0 + age * 2.5;
        const alpha = 0.18 * clamp(1 - age / 30, 0, 1);
        if (alpha <= 0) return;
        const smokeGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        smokeGrad.addColorStop(0, `rgba(40,40,40,${alpha})`);
        smokeGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = smokeGrad;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // f15-45: sparks
    if (f >= 15) {
      const age = f - 15;
      sparks.forEach(sp => {
        const sx = sp.x + sp.vx * age;
        const sy = sp.y + sp.vy * age + 0.15 * age * age;
        const fade = clamp(1 - age / 30, 0, 1);
        if (fade <= 0) return;
        ctx.beginPath();
        ctx.arc(sx, sy, sp.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,${Math.floor(180 * fade)},0,${fade})`;
        ctx.fill();
      });
    }

    // f35-45: rapid fade out
    if (f >= 35) {
      const fadeAlpha = (f - 35) / 10;
      ctx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
      ctx.fillRect(0, 0, W, H);
    }

    saveFrame(canvas, framesDir, f);
  }

  const outFile = path.join(OUT_DIR, 'bomb_explode.mp4');
  encodeVideo(framesDir, outFile, 30, W, H);
  console.log('bomb_explode.mp4 done — 400x400 @ 30fps, 45 frames');
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────
console.log('=== Generating event videos ===');
console.log('[1/3] perfect_clear — 540x960, 30fps, 90 frames...');
genPerfectClear();
console.log('[2/3] new_record — 540x960, 30fps, 120 frames...');
genNewRecord();
console.log('[3/3] bomb_explode — 400x400, 30fps, 45 frames...');
genBombExplode();
console.log('=== All 3 event videos generated ===');
