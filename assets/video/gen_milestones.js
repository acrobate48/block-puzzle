'use strict';
const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const OUT_DIR = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/video';
const FRAMES_DIR = path.join(OUT_DIR, 'frames');
const W = 540, H = 540, FPS = 30;
const CX = W / 2, CY = H / 2;

// ── helpers ────────────────────────────────────────────────────────────────

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function lerp(a, b, t) { return a + (b - a) * clamp(t, 0, 1); }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; }
function bounceOut(t) {
  const n1 = 7.5625, d1 = 2.75;
  if (t < 1/d1) return n1*t*t;
  else if (t < 2/d1) return n1*(t-=1.5/d1)*t+0.75;
  else if (t < 2.5/d1) return n1*(t-=2.25/d1)*t+0.9375;
  else return n1*(t-=2.625/d1)*t+0.984375;
}
function progress(f, start, end) { return clamp((f - start) / (end - start), 0, 1); }

function clearDir(dir) {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(f => {
      const fp = path.join(dir, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) fs.rmSync(fp, { recursive: true, force: true });
      else fs.unlinkSync(fp);
    });
  } else {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function saveFrame(canvas, dir, idx) {
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(dir, `frame_${String(idx).padStart(5,'0')}.png`), buf);
}

function encodeVideo(framesDir, outFile, fps) {
  const cmd = `"${FFMPEG}" -y -framerate ${fps} -i "${framesDir}/frame_%05d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${outFile}"`;
  console.log('  Encoding:', outFile);
  execSync(cmd, { stdio: 'pipe' });
  const stat = fs.statSync(outFile);
  console.log(`  Done: ${(stat.size/1024).toFixed(1)} KB`);
}

// seeded pseudo-random for reproducibility
function makeRng(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

// ── Drawing primitives ─────────────────────────────────────────────────────

function drawStar(ctx, x, y, r, color, alpha=1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = Math.PI * 2 * i / 5 - Math.PI/2;
    const aInner = a + Math.PI/5;
    if (i===0) ctx.moveTo(x + Math.cos(a)*r, y + Math.sin(a)*r);
    else ctx.lineTo(x + Math.cos(a)*r, y + Math.sin(a)*r);
    ctx.lineTo(x + Math.cos(aInner)*r*0.4, y + Math.sin(aInner)*r*0.4);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawGoldenText(ctx, text, x, y, size, alpha=1, glowR=30) {
  ctx.save();
  ctx.globalAlpha = alpha;
  // glow
  ctx.shadowColor = '#FFD700';
  ctx.shadowBlur = glowR;
  ctx.font = `bold ${size}px Impact, Arial Black, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // gradient
  const grd = ctx.createLinearGradient(x - size*1.5, y - size/2, x + size*1.5, y + size/2);
  grd.addColorStop(0, '#FFF176');
  grd.addColorStop(0.3, '#FFD700');
  grd.addColorStop(0.6, '#FFA000');
  grd.addColorStop(1, '#FFD700');
  // outline
  ctx.strokeStyle = '#7B4F00';
  ctx.lineWidth = size * 0.06;
  ctx.lineJoin = 'round';
  ctx.strokeText(text, x, y);
  ctx.fillStyle = grd;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawFirework(ctx, cx, cy, rays, color1, color2, explodeR, tailLen, alpha=1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < rays; i++) {
    const angle = (Math.PI * 2 * i / rays);
    const r1 = explodeR * 0.2;
    const r2 = explodeR;
    const r3 = explodeR + tailLen;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(angle)*r1, cy + Math.sin(angle)*r1);
    ctx.lineTo(cx + Math.cos(angle)*r2, cy + Math.sin(angle)*r2);
    const grd = ctx.createLinearGradient(
      cx + Math.cos(angle)*r1, cy + Math.sin(angle)*r1,
      cx + Math.cos(angle)*r3, cy + Math.sin(angle)*r3
    );
    grd.addColorStop(0, color1);
    grd.addColorStop(0.6, color2);
    grd.addColorStop(1, 'transparent');
    ctx.strokeStyle = grd;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    // sparkle at tip
    ctx.beginPath();
    ctx.arc(cx + Math.cos(angle)*r2, cy + Math.sin(angle)*r2, 3, 0, Math.PI*2);
    ctx.fillStyle = color1;
    ctx.fill();
  }
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
// MILESTONE 1K — 45 frames
// ══════════════════════════════════════════════════════════════════════════
function gen1k() {
  console.log('\n[1/5] milestone_1k — 45 frames');
  clearDir(FRAMES_DIR);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = makeRng(42);

  // Pre-generate stars
  const stars = Array.from({length:20}, () => {
    const angle = rng() * Math.PI * 2;
    const dist = 80 + rng() * 130;
    return {
      x: CX + Math.cos(angle)*dist,
      y: CY + Math.sin(angle)*dist,
      vx: Math.cos(angle) * (1.5 + rng()*2.5),
      vy: Math.sin(angle) * (1.5 + rng()*2.5),
      r: 4 + rng()*6,
      color: ['#FFD700','#FFF176','#FFECB3','#FF8F00'][Math.floor(rng()*4)],
      startFrame: 10 + Math.floor(rng()*8)
    };
  });

  for (let f = 0; f < 45; f++) {
    // background — transparent black
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0,0,W,H);

    // f0-8: golden flash
    if (f <= 8) {
      const t = progress(f, 0, 8);
      const flashA = Math.sin(t * Math.PI) * 0.55;
      const grd = ctx.createRadialGradient(CX,CY,10,CX,CY,200);
      grd.addColorStop(0, `rgba(255,230,80,${flashA})`);
      grd.addColorStop(0.6, `rgba(255,180,0,${flashA*0.4})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,W,H);
    }

    // f10-40: stars flying out
    for (const s of stars) {
      if (f < s.startFrame) continue;
      const elapsed = f - s.startFrame;
      const sx = s.x + s.vx * elapsed;
      const sy = s.y + s.vy * elapsed;
      const lifeT = progress(elapsed, 0, 30);
      const alpha = lifeT < 0.7 ? easeOut(lifeT/0.7) : 1 - progress(lifeT, 0.7, 1);
      drawStar(ctx, sx, sy, s.r, s.color, alpha);
    }

    // f5-30: "1 000" scale bounce
    if (f >= 5) {
      const t = progress(f, 5, 22);
      const scale = bounceOut(t);
      const fadeA = f >= 35 ? 1 - progress(f, 35, 45) : 1;
      ctx.save();
      ctx.translate(CX, CY);
      ctx.scale(scale, scale);
      ctx.translate(-CX, -CY);
      drawGoldenText(ctx, '1 000', CX, CY, 72, fadeA, 20);
      ctx.restore();
    } else {
      // nothing yet
    }

    saveFrame(canvas, FRAMES_DIR, f);
  }
  encodeVideo(FRAMES_DIR, path.join(OUT_DIR, 'milestone_1k.mp4'), FPS);
}

// ══════════════════════════════════════════════════════════════════════════
// MILESTONE 5K — 60 frames
// ══════════════════════════════════════════════════════════════════════════
function gen5k() {
  console.log('\n[2/5] milestone_5k — 60 frames');
  clearDir(FRAMES_DIR);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = makeRng(137);

  const confetti = Array.from({length:50}, () => ({
    x: rng() * W,
    y: -20 - rng() * 100,
    vy: 2.5 + rng() * 3.5,
    vx: (rng()-0.5) * 2,
    r: 5 + rng() * 7,
    angle: rng() * Math.PI,
    spin: (rng()-0.5)*0.2,
    color: ['#FFD700','#E91E63','#2196F3','#4CAF50','#FF5722','#9C27B0'][Math.floor(rng()*6)]
  }));

  for (let f = 0; f < 60; f++) {
    ctx.clearRect(0,0,W,H);

    // f0-15: radial light explosion
    if (f <= 15) {
      const t = progress(f, 0, 15);
      const burst = easeOut(t);
      const R = 20 + burst * 260;
      const a = (1 - t) * 0.7;
      const grd = ctx.createRadialGradient(CX,CY,0,CX,CY,R);
      grd.addColorStop(0, `rgba(255,255,255,${a*0.9})`);
      grd.addColorStop(0.3, `rgba(255,215,0,${a*0.7})`);
      grd.addColorStop(0.7, `rgba(255,140,0,${a*0.3})`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,W,H);
    }

    // f5-30: 3 expanding rings
    for (let ring = 0; ring < 3; ring++) {
      const start = 5 + ring * 6;
      if (f < start) continue;
      const t = progress(f, start, start + 30);
      const R = t * (180 + ring * 40);
      const a = 1 - t;
      ctx.save();
      ctx.globalAlpha = a * 0.8;
      ctx.beginPath();
      ctx.arc(CX, CY, R, 0, Math.PI*2);
      ctx.strokeStyle = ring === 0 ? '#FFD700' : ring === 1 ? '#FFF176' : '#FF8F00';
      ctx.lineWidth = 3 - ring * 0.5;
      ctx.stroke();
      ctx.restore();
    }

    // f15-55: confetti
    if (f >= 15) {
      for (const c of confetti) {
        const elapsed = f - 15;
        const cx2 = c.x + c.vx * elapsed;
        const cy2 = c.y + c.vy * elapsed;
        if (cy2 > H + 20) continue;
        const a = f >= 50 ? 1 - progress(f, 50, 55) : 1;
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(cx2, cy2);
        ctx.rotate(c.angle + c.spin * elapsed);
        ctx.fillStyle = c.color;
        ctx.fillRect(-c.r/2, -c.r/4, c.r, c.r/2);
        ctx.restore();
      }
    }

    // f10-45: "5 000" + halo
    if (f >= 10) {
      const tAppear = progress(f, 10, 25);
      const scale = bounceOut(tAppear);
      const fadeA = f >= 50 ? 1 - progress(f, 50, 60) : 1;
      // halo
      const haloA = Math.sin(f * 0.3) * 0.3 + 0.5;
      ctx.save();
      ctx.globalAlpha = fadeA * haloA * 0.6;
      const halo = ctx.createRadialGradient(CX,CY,20,CX,CY,120);
      halo.addColorStop(0, 'rgba(255,215,0,0.8)');
      halo.addColorStop(1, 'transparent');
      ctx.fillStyle = halo;
      ctx.fillRect(0,0,W,H);
      ctx.restore();

      ctx.save();
      ctx.translate(CX, CY);
      ctx.scale(scale, scale);
      ctx.translate(-CX, -CY);
      drawGoldenText(ctx, '5 000', CX, CY, 82, fadeA, 30);
      ctx.restore();
    }

    saveFrame(canvas, FRAMES_DIR, f);
  }
  encodeVideo(FRAMES_DIR, path.join(OUT_DIR, 'milestone_5k.mp4'), FPS);
}

// ══════════════════════════════════════════════════════════════════════════
// MILESTONE 10K — 75 frames
// ══════════════════════════════════════════════════════════════════════════
function gen10k() {
  console.log('\n[3/5] milestone_10k — 75 frames');
  clearDir(FRAMES_DIR);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = makeRng(256);

  // Firework rays (20 rays, colors per ray)
  const fwColors = ['#FF5252','#FF8F00','#FFD700','#69F0AE','#40C4FF','#EA80FC'];
  const rays = Array.from({length:20}, (_, i) => ({
    angle: (Math.PI*2*i/20) + rng()*0.15,
    color1: fwColors[Math.floor(rng()*fwColors.length)],
    color2: '#FFFFFF',
    lenFactor: 0.7 + rng()*0.6
  }));

  // confetti+stars
  const particles = Array.from({length:80}, () => ({
    x: rng()*W, y: -10 - rng()*120,
    vx: (rng()-0.5)*3, vy: 2+rng()*4,
    r: 3+rng()*6,
    isStar: rng()>0.5,
    angle: rng()*Math.PI*2, spin: (rng()-0.5)*0.25,
    color: ['#FFD700','#FF4081','#40C4FF','#CCFF90','#FF8F00','#CE93D8'][Math.floor(rng()*6)],
    startFrame: 20+Math.floor(rng()*15)
  }));

  // orbital particles (ring)
  const orbitals = Array.from({length:16}, (_, i) => ({
    baseAngle: (Math.PI*2*i/16),
    r: 130, speed: 0.06,
    color: i%2===0?'#FFD700':'#FFF176',
    size: 4+rng()*3
  }));

  for (let f = 0; f < 75; f++) {
    ctx.clearRect(0,0,W,H);

    // dark background
    ctx.fillStyle = '#050510';
    ctx.fillRect(0,0,W,H);

    // f0-30: firework explosion
    if (f <= 30) {
      const t = progress(f, 0, 30);
      const explodeR = easeOut(t) * 200;
      const alpha = t < 0.5 ? easeOut(t*2) : 1 - easeOut((t-0.5)*2);
      for (const ray of rays) {
        ctx.save();
        ctx.globalAlpha = alpha;
        const x1 = CX + Math.cos(ray.angle)*explodeR*0.15;
        const y1 = CY + Math.sin(ray.angle)*explodeR*0.15;
        const x2 = CX + Math.cos(ray.angle)*explodeR*ray.lenFactor;
        const y2 = CY + Math.sin(ray.angle)*explodeR*ray.lenFactor;
        const grd = ctx.createLinearGradient(x1,y1,x2,y2);
        grd.addColorStop(0, ray.color2);
        grd.addColorStop(1, ray.color1);
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      }
      // central burst
      const burstA = Math.max(0, (0.4-t)/0.4);
      if (burstA > 0) {
        const grd2 = ctx.createRadialGradient(CX,CY,0,CX,CY,80*easeOut(t));
        grd2.addColorStop(0, `rgba(255,255,255,${burstA*0.9})`);
        grd2.addColorStop(0.5, `rgba(255,215,0,${burstA*0.5})`);
        grd2.addColorStop(1, 'transparent');
        ctx.fillStyle = grd2;
        ctx.fillRect(0,0,W,H);
      }
    }

    // f20-65: rain of particles
    for (const p of particles) {
      if (f < p.startFrame || f > 65) continue;
      const elapsed = f - p.startFrame;
      const px = p.x + p.vx * elapsed;
      const py = p.y + p.vy * elapsed;
      if (py > H+20) continue;
      const a = f >= 60 ? 1 - progress(f, 60, 65) : 1;
      if (p.isStar) {
        drawStar(ctx, px, py, p.r, p.color, a);
      } else {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(px, py);
        ctx.rotate(p.angle + p.spin*elapsed);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2, -p.r/4, p.r, p.r/2);
        ctx.restore();
      }
    }

    // f25-60: orbital ring of particles
    if (f >= 25 && f <= 60) {
      const tOrbit = progress(f, 25, 60);
      const orbitA = tOrbit < 0.2 ? tOrbit/0.2 : tOrbit > 0.8 ? 1-(tOrbit-0.8)/0.2 : 1;
      for (const o of orbitals) {
        const angle = o.baseAngle + f * o.speed;
        const ox = CX + Math.cos(angle) * o.r;
        const oy = CY + Math.sin(angle) * o.r;
        drawStar(ctx, ox, oy, o.size, o.color, orbitA * 0.9);
      }
    }

    // f30-55: trophies (stylized)
    if (f >= 30 && f <= 55) {
      const tT = progress(f, 30, 45);
      const sc = bounceOut(tT);
      const tFade = f >= 62 ? 1-progress(f,62,75) : 1;
      for (const side of [-1, 1]) {
        const tx = CX + side * 185;
        const ty = CY + 10;
        ctx.save();
        ctx.globalAlpha = sc * tFade;
        ctx.translate(tx, ty);
        ctx.scale(sc * 0.7, sc * 0.7);
        // cup
        ctx.beginPath();
        ctx.moveTo(-18, -30);
        ctx.bezierCurveTo(-20, 0, -14, 20, 0, 28);
        ctx.bezierCurveTo(14, 20, 20, 0, 18, -30);
        ctx.closePath();
        const tGrd = ctx.createLinearGradient(-18,-30,18,28);
        tGrd.addColorStop(0, '#FFD700');
        tGrd.addColorStop(0.5, '#FFF176');
        tGrd.addColorStop(1, '#FF8F00');
        ctx.fillStyle = tGrd;
        ctx.fill();
        // base
        ctx.fillRect(-12, 28, 24, 6);
        ctx.fillRect(-18, 34, 36, 5);
        // handles
        ctx.beginPath();
        ctx.arc(-22, -5, 8, Math.PI*0.5, Math.PI*1.5);
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(22, -5, 8, -Math.PI*0.5, Math.PI*0.5);
        ctx.stroke();
        ctx.restore();
      }
    }

    // f20-60: "10 000" text
    if (f >= 20) {
      const tApp = progress(f, 20, 35);
      const sc = bounceOut(tApp);
      const fadeA = f >= 65 ? 1-progress(f, 65, 75) : 1;
      ctx.save();
      ctx.translate(CX, CY);
      ctx.scale(sc, sc);
      ctx.translate(-CX, -CY);
      // chromé avec glow intense
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 40;
      drawGoldenText(ctx, '10 000', CX, CY, 80, fadeA, 40);
      ctx.restore();
    }

    saveFrame(canvas, FRAMES_DIR, f);
  }
  encodeVideo(FRAMES_DIR, path.join(OUT_DIR, 'milestone_10k.mp4'), FPS);
}

// ══════════════════════════════════════════════════════════════════════════
// MILESTONE 50K — 90 frames
// ══════════════════════════════════════════════════════════════════════════
function gen50k() {
  console.log('\n[4/5] milestone_50k — 90 frames');
  clearDir(FRAMES_DIR);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = makeRng(512);

  // Starfield background
  const bgStars = Array.from({length:120}, () => ({
    x: rng()*W, y: rng()*H,
    r: 0.5 + rng()*1.5,
    bright: 0.3 + rng()*0.7,
    twinkle: rng()*Math.PI*2
  }));

  // 3 fireworks: triangle positions, different colors
  const fwDefs = [
    { cx: CX,       cy: CY - 120, colors: ['#FFD700','#FFF176','#FF8F00'], rays: 22 }, // gold top
    { cx: CX - 130, cy: CY + 80,  colors: ['#FF1744','#FF5252','#FF8A80'], rays: 18 }, // red left
    { cx: CX + 130, cy: CY + 80,  colors: ['#2979FF','#40C4FF','#82B1FF'], rays: 18 }  // blue right
  ];
  const fwRays = fwDefs.map(fw => ({
    ...fw,
    rays: Array.from({length: fw.rays}, (_, i) => ({
      angle: (Math.PI*2*i/fw.rays) + rng()*0.2,
      len: 0.7 + rng()*0.6,
      color: fw.colors[Math.floor(rng()*fw.colors.length)]
    }))
  }));

  // 100 golden particles cascade
  const particles = Array.from({length:100}, () => ({
    x: rng()*W, y: -10-rng()*200,
    vx: (rng()-0.5)*2.5, vy: 1.5+rng()*4,
    r: 3+rng()*5,
    color: ['#FFD700','#FFF176','#FFECB3','#FF8F00','#FF6F00'][Math.floor(rng()*5)],
    isStar: rng()>0.4,
    angle: rng()*Math.PI*2, spin: (rng()-0.5)*0.3,
    startFrame: 20+Math.floor(rng()*20)
  }));

  for (let f = 0; f < 90; f++) {
    ctx.clearRect(0,0,W,H);

    // Starfield background — fades in f0-20
    const bgA = progress(f, 0, 20);
    ctx.fillStyle = `rgb(${Math.round(lerp(0,2,bgA))},${Math.round(lerp(0,2,bgA))},${Math.round(lerp(0,15,bgA))})`;
    ctx.fillRect(0,0,W,H);
    for (const s of bgStars) {
      const twink = 0.5 + 0.5*Math.sin(f*0.15 + s.twinkle);
      ctx.save();
      ctx.globalAlpha = bgA * s.bright * twink;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // f0-50: 3 fireworks in triangle
    for (const fw of fwRays) {
      const startOffset = fwDefs.indexOf(fwDefs.find(d=>d.cx===fw.cx && d.cy===fw.cy)) * 5;
      const t = progress(f, startOffset, 50 + startOffset);
      if (t <= 0) continue;
      const R = easeOut(Math.min(t*2,1)) * 130;
      const pulse = 0.5 + 0.5*Math.sin(f*0.4);
      const alpha = t < 0.3 ? t/0.3 : t > 0.7 ? (1-t)/0.3 : 1;

      for (const ray of fw.rays) {
        const x1 = fw.cx + Math.cos(ray.angle)*R*0.1;
        const y1 = fw.cy + Math.sin(ray.angle)*R*0.1;
        const x2 = fw.cx + Math.cos(ray.angle)*R*ray.len;
        const y2 = fw.cy + Math.sin(ray.angle)*R*ray.len;
        ctx.save();
        ctx.globalAlpha = alpha * (0.7 + 0.3*pulse);
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        const grd = ctx.createLinearGradient(x1,y1,x2,y2);
        grd.addColorStop(0, '#FFFFFF');
        grd.addColorStop(1, ray.color);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
      // glowing core
      const coreA = Math.max(0, (0.5-t)/0.5)*0.8;
      if (coreA > 0) {
        const g = ctx.createRadialGradient(fw.cx,fw.cy,0,fw.cx,fw.cy,40);
        g.addColorStop(0,`rgba(255,255,255,${coreA})`);
        g.addColorStop(1,'transparent');
        ctx.fillStyle = g;
        ctx.fillRect(0,0,W,H);
      }
    }

    // f20-75: 100 golden particles cascade
    for (const p of particles) {
      if (f < p.startFrame || f > 75) continue;
      const elapsed = f - p.startFrame;
      const px = p.x + p.vx*elapsed;
      const py = p.y + p.vy*elapsed;
      if (py > H+20) continue;
      const a = f >= 70 ? 1-progress(f,70,75) : 1;
      if (p.isStar) {
        drawStar(ctx, px, py, p.r, p.color, a);
      } else {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(px,py);
        ctx.rotate(p.angle+p.spin*elapsed);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);
        ctx.restore();
      }
    }

    // f30-65: laurel crown around text
    if (f >= 30 && f <= 65) {
      const tL = progress(f, 30, 45);
      const scL = bounceOut(tL);
      const fadeL = f >= 62 ? 1-progress(f,62,65) : 1;
      ctx.save();
      ctx.globalAlpha = scL * fadeL;
      // draw laurel as arc of leaves
      for (let i = 0; i < 24; i++) {
        const angle = Math.PI + (Math.PI * i / 23);
        const lx = CX + Math.cos(angle)*115;
        const ly = CY + Math.sin(angle)*55;
        ctx.save();
        ctx.translate(lx,ly);
        ctx.rotate(angle + Math.PI/2);
        ctx.scale(scL, scL);
        ctx.beginPath();
        ctx.ellipse(0, 0, 6, 12, 0, 0, Math.PI*2);
        ctx.fillStyle = i % 3 === 0 ? '#66BB6A' : '#388E3C';
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();
    }

    // f25-70: "50 000"
    if (f >= 25) {
      const tApp = progress(f, 25, 40);
      const sc = bounceOut(tApp);
      const fadeA = f >= 75 ? 1-progress(f,75,90) : 1;
      ctx.save();
      ctx.translate(CX,CY);
      ctx.scale(sc,sc);
      ctx.translate(-CX,-CY);
      // double contour
      ctx.font = `bold 96px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = fadeA;
      ctx.strokeStyle = '#FF8F00';
      ctx.lineWidth = 14;
      ctx.lineJoin = 'round';
      ctx.strokeText('50 000', CX, CY);
      ctx.strokeStyle = '#7B4F00';
      ctx.lineWidth = 8;
      ctx.strokeText('50 000', CX, CY);
      drawGoldenText(ctx, '50 000', CX, CY, 96, fadeA, 45);
      ctx.restore();
    }

    saveFrame(canvas, FRAMES_DIR, f);
  }
  encodeVideo(FRAMES_DIR, path.join(OUT_DIR, 'milestone_50k.mp4'), FPS);
}

// ══════════════════════════════════════════════════════════════════════════
// MILESTONE 100K — 120 frames
// ══════════════════════════════════════════════════════════════════════════
function gen100k() {
  console.log('\n[5/5] milestone_100k — 120 frames');
  clearDir(FRAMES_DIR);
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');
  const rng = makeRng(1024);

  // Cosmic background stars
  const bgStars = Array.from({length:200}, () => ({
    x: rng()*W, y: rng()*H,
    r: 0.3+rng()*2, bright: 0.2+rng()*0.8,
    twinkle: rng()*Math.PI*2
  }));

  // Nebula blobs
  const nebulae = Array.from({length:5}, () => ({
    x: rng()*W, y: rng()*H,
    r: 60+rng()*100,
    hue: 250+rng()*60  // purplish
  }));

  // 5 fireworks — cascade positions
  const fwPositions = [
    { cx: CX,       cy: CY-140, delay:  0, colors:['#FFD700','#FFF176','#FFCA28'] },
    { cx: CX-160,   cy: CY-40,  delay:  8, colors:['#E040FB','#CE93D8','#F48FB1'] },
    { cx: CX+160,   cy: CY-40,  delay: 12, colors:['#40C4FF','#82B1FF','#FFFFFF'] },
    { cx: CX-100,   cy: CY+130, delay: 18, colors:['#FF5252','#FF8A80','#FF6D00'] },
    { cx: CX+100,   cy: CY+130, delay: 22, colors:['#69F0AE','#B9F6CA','#CCFF90'] }
  ];
  const allFwRays = fwPositions.map(fw => ({
    ...fw,
    rays: Array.from({length:20}, (_, i) => ({
      angle: (Math.PI*2*i/20)+rng()*0.18,
      len: 0.6+rng()*0.8,
      color: fw.colors[Math.floor(rng()*fw.colors.length)]
    }))
  }));

  // 12 orbital stars
  const orbitStars = Array.from({length:12}, (_, i) => ({
    baseAngle: Math.PI*2*i/12,
    orbitR: 138, speed: 0.08,
    r: 7+rng()*4,
    color: i%2===0?'#FFD700':'#FFFFFF'
  }));

  // Confetti + stars intense
  const particles = Array.from({length:130}, () => ({
    x: rng()*W, y: -10-rng()*250,
    vx: (rng()-0.5)*3.5, vy: 1.5+rng()*5,
    r: 3+rng()*7, isStar: rng()>0.45,
    angle: rng()*Math.PI*2, spin: (rng()-0.5)*0.3,
    color: ['#FFD700','#FF4081','#40C4FF','#B2FF59','#FF6D00','#E040FB','#FFF176'][Math.floor(rng()*7)],
    startFrame: 20+Math.floor(rng()*25)
  }));

  // Shockwave rings
  const shockwaves = [
    { startFrame: 30, maxR: 200, color: 'rgba(255,215,0,' },
    { startFrame: 50, maxR: 240, color: 'rgba(180,120,255,' }
  ];

  for (let f = 0; f < 120; f++) {
    ctx.clearRect(0,0,W,H);

    // ─ Cosmic background f0-30 ─
    const bgT = progress(f, 0, 30);
    const r = Math.round(lerp(0, 5, bgT));
    const g = Math.round(lerp(0, 0, bgT));
    const b = Math.round(lerp(5, 20, bgT));
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(0,0,W,H);

    // Nebula purple glow
    for (const neb of nebulae) {
      ctx.save();
      ctx.globalAlpha = bgT * 0.12;
      const grd = ctx.createRadialGradient(neb.x,neb.y,0,neb.x,neb.y,neb.r);
      grd.addColorStop(0, `hsla(${neb.hue},80%,40%,1)`);
      grd.addColorStop(1, 'transparent');
      ctx.fillStyle = grd;
      ctx.fillRect(0,0,W,H);
      ctx.restore();
    }

    // Background stars
    for (const s of bgStars) {
      const twink = 0.5+0.5*Math.sin(f*0.12+s.twinkle);
      ctx.save();
      ctx.globalAlpha = bgT * s.bright * twink;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fill();
      ctx.restore();
    }

    // ─ 5 Fireworks f0-70 ─
    for (const fw of allFwRays) {
      const fStart = fw.delay;
      const fEnd = 70 + fw.delay * 0.5;
      const t = progress(f, fStart, fEnd);
      if (t <= 0 || t >= 1) continue;
      const R = easeOut(Math.min(t*1.8,1)) * 120;
      const pulse = 0.6+0.4*Math.sin(f*0.5+fw.delay);
      const alpha = t < 0.2 ? t/0.2 : t > 0.7 ? (1-t)/0.3 : 1;

      for (const ray of fw.rays) {
        const x1 = fw.cx + Math.cos(ray.angle)*R*0.08;
        const y1 = fw.cy + Math.sin(ray.angle)*R*0.08;
        const x2 = fw.cx + Math.cos(ray.angle)*R*ray.len;
        const y2 = fw.cy + Math.sin(ray.angle)*R*ray.len;
        ctx.save();
        ctx.globalAlpha = alpha * pulse;
        ctx.beginPath();
        ctx.moveTo(x1,y1);
        ctx.lineTo(x2,y2);
        const grd = ctx.createLinearGradient(x1,y1,x2,y2);
        grd.addColorStop(0,'#FFFFFF');
        grd.addColorStop(1,ray.color);
        ctx.strokeStyle = grd;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
      // sparkle dots on tips
      for (let i = 0; i < 4; i++) {
        const ray = fw.rays[i*5];
        const x2 = fw.cx + Math.cos(ray.angle)*R*ray.len;
        const y2 = fw.cy + Math.sin(ray.angle)*R*ray.len;
        ctx.save();
        ctx.globalAlpha = alpha * 0.9;
        ctx.beginPath();
        ctx.arc(x2,y2,3,0,Math.PI*2);
        ctx.fillStyle = ray.color;
        ctx.fill();
        ctx.restore();
      }
    }

    // ─ Particles f20-90 ─
    for (const p of particles) {
      if (f < p.startFrame || f > 90) continue;
      const elapsed = f - p.startFrame;
      const px = p.x + p.vx*elapsed;
      const py = p.y + p.vy*elapsed;
      if (py > H+20) continue;
      const a = f >= 85 ? 1-progress(f,85,90) : 1;
      if (p.isStar) {
        drawStar(ctx, px, py, p.r, p.color, a);
      } else {
        ctx.save();
        ctx.globalAlpha = a;
        ctx.translate(px,py);
        ctx.rotate(p.angle+p.spin*elapsed);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r/2,-p.r/4,p.r,p.r/2);
        ctx.restore();
      }
    }

    // ─ Shockwaves f30-80 ─
    for (const sw of shockwaves) {
      if (f < sw.startFrame) continue;
      const t = progress(f, sw.startFrame, sw.startFrame + 50);
      if (t >= 1) continue;
      const R = t * sw.maxR;
      const a = (1-t) * 0.8;
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(CX,CY,R,0,Math.PI*2);
      ctx.strokeStyle = sw.color + a + ')';
      ctx.lineWidth = 3 + (1-t)*5;
      ctx.stroke();
      ctx.restore();
    }

    // ─ 12 orbital stars f35-85 ─
    if (f >= 35 && f <= 85) {
      const tO = progress(f, 35, 85);
      const orbitA = tO < 0.15 ? tO/0.15 : tO > 0.85 ? (1-tO)/0.15 : 1;
      for (const o of orbitStars) {
        const angle = o.baseAngle + f * o.speed;
        const ox = CX + Math.cos(angle)*o.orbitR;
        const oy = CY + Math.sin(angle)*o.orbitR;
        const trail = 0.35;
        ctx.save();
        ctx.globalAlpha = orbitA * trail;
        ctx.beginPath();
        ctx.arc(ox,oy,o.r*0.6,0,Math.PI*2);
        ctx.fillStyle = o.color;
        ctx.fill();
        ctx.restore();
        drawStar(ctx, ox, oy, o.r, o.color, orbitA);
      }
    }

    // ─ "100 000" chromé f30-90 ─
    if (f >= 30) {
      const tApp = progress(f, 30, 48);
      const sc = bounceOut(tApp);
      const fadeA = f >= 100 ? 1-progress(f,100,120) : 1;

      ctx.save();
      ctx.translate(CX, CY-15);
      ctx.scale(sc,sc);
      ctx.translate(-CX, -(CY-15));

      // chrome gradient: blanc→or→blanc→or
      ctx.font = `bold 96px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.globalAlpha = fadeA;

      // glow layers
      for (let g=0; g<3; g++) {
        ctx.shadowColor = g===0?'#FFFFFF': g===1?'#FFD700':'#FF8F00';
        ctx.shadowBlur = 50 - g*10;
        const chromGrd = ctx.createLinearGradient(CX-200, CY-60, CX+200, CY+60);
        chromGrd.addColorStop(0,   '#FFFFFF');
        chromGrd.addColorStop(0.2, '#FFD700');
        chromGrd.addColorStop(0.4, '#FFFFFF');
        chromGrd.addColorStop(0.6, '#FFD700');
        chromGrd.addColorStop(0.8, '#FFF9C4');
        chromGrd.addColorStop(1,   '#FFD700');
        ctx.strokeStyle = g===0?'#000000':'#7B4F00';
        ctx.lineWidth = g===0?12:6;
        ctx.lineJoin='round';
        ctx.strokeText('100 000', CX, CY-15);
        ctx.fillStyle = chromGrd;
        ctx.fillText('100 000', CX, CY-15);
      }
      ctx.restore();
    }

    // ─ "LÉGENDAIRE !" rouge/or f40-90 ─
    if (f >= 40) {
      const tLeg = progress(f, 40, 55);
      const scLeg = bounceOut(tLeg);
      const fadeA = f >= 100 ? 1-progress(f,100,120) : 1;
      ctx.save();
      ctx.translate(CX, CY+52);
      ctx.scale(scLeg, scLeg);
      ctx.translate(-CX, -(CY+52));
      ctx.globalAlpha = fadeA;
      ctx.font = `bold 28px Impact, Arial Black, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FF1744';
      ctx.shadowBlur = 20;
      ctx.strokeStyle = '#7B0000';
      ctx.lineWidth = 5;
      ctx.lineJoin='round';
      ctx.strokeText('LÉGENDAIRE !', CX, CY+52);
      const legGrd = ctx.createLinearGradient(CX-100,CY+40,CX+100,CY+65);
      legGrd.addColorStop(0,'#FF1744');
      legGrd.addColorStop(0.5,'#FFD700');
      legGrd.addColorStop(1,'#FF1744');
      ctx.fillStyle = legGrd;
      ctx.fillText('LÉGENDAIRE !', CX, CY+52);
      ctx.restore();
    }

    saveFrame(canvas, FRAMES_DIR, f);
  }
  encodeVideo(FRAMES_DIR, path.join(OUT_DIR, 'milestone_100k.mp4'), FPS);
}

// ── Main ───────────────────────────────────────────────────────────────────
console.log('=== Block Puzzle Milestone Videos ===');
console.log(`Output: ${OUT_DIR}`);
console.log(`Canvas: ${W}x${H} @ ${FPS}fps`);

gen1k();
gen5k();
gen10k();
gen50k();
gen100k();

console.log('\n=== All milestones generated! ===');
// Print sizes
['1k','5k','10k','50k','100k'].forEach(id => {
  const f = path.join(OUT_DIR, `milestone_${id}.mp4`);
  if (fs.existsSync(f)) {
    console.log(`  milestone_${id}.mp4: ${(fs.statSync(f).size/1024).toFixed(1)} KB`);
  }
});
