'use strict';
// ============================================================
//  gen_desert_enchante_plage.js
//  Génère 3 vidéos MP4 (540x960, 30fps, 180 frames = 6s) pour
//  les thèmes Désert, Enchanté et Plage du jeu Block Puzzle.
// ============================================================

const { createCanvas } = require('c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/node_modules/canvas');
const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FFMPEG  = 'c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const W = 540, H = 960, FPS = 30, FRAMES = 180;
const BASE = 'c:/Users/Admin/Desktop/PROJET EN COURS/Block Puzzle/assets/themes';

// ─── Utilitaires ──────────────────────────────────────────────────────────────
function hex(h) {
  const r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
  return { r, g, b };
}
function rgba(h, a) {
  const c = hex(h);
  return `rgba(${c.r},${c.g},${c.b},${a})`;
}
function lerp(a, b, t) { return a + (b - a) * t; }

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }

function encodeVideo(framesDir, outMp4) {
  const cmd = `"${FFMPEG}" -y -framerate ${FPS} -i "${framesDir}/frame%04d.png" ` +
              `-c:v libx264 -pix_fmt yuv420p -crf 20 -preset fast "${outMp4}"`;
  console.log('  Encoding:', outMp4);
  execSync(cmd, { stdio: 'inherit' });
}

function cleanFrames(framesDir) {
  fs.readdirSync(framesDir).forEach(f => fs.unlinkSync(path.join(framesDir, f)));
  fs.rmdirSync(framesDir);
}

function saveFrame(canvas, framesDir, idx) {
  const buf = canvas.toBuffer('image/png');
  fs.writeFileSync(path.join(framesDir, `frame${String(idx).padStart(4,'0')}.png`), buf);
}

// ══════════════════════════════════════════════════════════════════════════════
//  THÈME 1 : DÉSERT
// ══════════════════════════════════════════════════════════════════════════════
function generateDesert() {
  console.log('\n=== DÉSERT ===');
  const themeDir  = path.join(BASE, 'desert');
  const framesDir = path.join(themeDir, 'frames');
  ensureDir(framesDir);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // Palette
  const BG     = '#301C06';
  const SAND_P = '#E8C070';
  const SUN_C  = '#F0A040';
  const ACCENT = '#E8B838';

  // ── Particules sable ────────────────────────────────────────────────────────
  const SAND_COUNT = 120;
  const sandP = Array.from({ length: SAND_COUNT }, (_, i) => ({
    x  : Math.random() * W,
    y  : 200 + Math.random() * (H - 200),   // densité vers le bas
    vx : 0.8 + Math.random() * 1.6,
    vy : (Math.random() - 0.5) * 0.3,
    phase: Math.random() * Math.PI * 2,
    a  : 0.3 + Math.random() * 0.3,
    size: 1 + Math.random()
  }));

  // ── Dunes (3 couches) ───────────────────────────────────────────────────────
  // Chaque dune est définie par un tableau de points de contrôle Y + vitesse de shift
  const duneConfigs = [
    { yBase: H * 0.82, amp: 28, freq: 0.0045, speed: 0.12, color: '#4A2808', alpha: 1.0 },
    { yBase: H * 0.87, amp: 20, freq: 0.006,  speed: 0.22, color: '#6A3810', alpha: 1.0 },
    { yBase: H * 0.92, amp: 14, freq: 0.008,  speed: 0.38, color: '#C07030', alpha: 1.0 }
  ];

  // ── Tourbillons ──────────────────────────────────────────────────────────────
  const whirls = [
    { x: W * 0.25, vx: 0.5, phase: 0 },
    { x: W * 0.72, vx: 0.35, phase: Math.PI }
  ];

  // ── Scorpion ─────────────────────────────────────────────────────────────────
  let scorpX = -60;
  const scorpY = H * 0.90;
  const scorpSpeed = 0.45;

  function drawDune(ctx, cfg, t) {
    const shift = t * cfg.speed;
    ctx.beginPath();
    ctx.moveTo(-10, H + 20);
    for (let x = -10; x <= W + 10; x += 4) {
      const y = cfg.yBase - cfg.amp * Math.sin((x + shift * 60) * cfg.freq)
                - cfg.amp * 0.4 * Math.sin((x * 1.7 + shift * 40) * cfg.freq);
      if (x === -10) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 10, H + 20);
    ctx.lineTo(-10, H + 20);
    ctx.closePath();
    ctx.fillStyle = cfg.color;
    ctx.globalAlpha = cfg.alpha;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawSun(ctx, t) {
    const pulse = 1 + 0.04 * Math.sin(t * 2.5);
    const cx = W * 0.6, cy = H * 0.78;
    const r  = 48 * pulse;
    // rayons
    const rayCount = 14;
    ctx.save();
    ctx.translate(cx, cy);
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + t * 0.15;
      const inner = r + 6;
      const outer = r + 22 + 8 * Math.sin(t * 3 + i);
      ctx.strokeStyle = rgba(SUN_C, 0.45);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
      ctx.lineTo(Math.cos(angle) * outer, Math.sin(angle) * outer);
      ctx.stroke();
    }
    // halo
    const grd = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 2.5);
    grd.addColorStop(0,   rgba(SUN_C, 0.35));
    grd.addColorStop(0.5, rgba(SUN_C, 0.10));
    grd.addColorStop(1,   rgba(SUN_C, 0));
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(0, 0, r * 2.5, 0, Math.PI * 2);
    ctx.fill();
    // soleil (demi-visible derrière dune)
    const sunGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
    sunGrd.addColorStop(0,   '#FFEE88');
    sunGrd.addColorStop(0.6, SUN_C);
    sunGrd.addColorStop(1,   '#C06010');
    ctx.fillStyle = sunGrd;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawMirages(ctx, t) {
    for (let m = 0; m < 2; m++) {
      const mx = W * (m === 0 ? 0.2 : 0.6);
      const mw = 120, mh = 12;
      ctx.save();
      ctx.globalAlpha = 0.18 + 0.06 * Math.sin(t * 3 + m);
      for (let line = 0; line < 6; line++) {
        const ly = H * 0.88 + line * 3.5 + m * 50;
        ctx.strokeStyle = '#88DDFF';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let xx = 0; xx <= mw; xx += 3) {
          const yy = ly + Math.sin((xx * 0.12) + t * 4 + line) * 2.5;
          if (xx === 0) ctx.moveTo(mx + xx, yy);
          else ctx.lineTo(mx + xx, yy);
        }
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawScorpion(ctx, x, y) {
    ctx.save();
    ctx.fillStyle = '#1A0C02';
    ctx.strokeStyle = '#1A0C02';
    ctx.lineWidth = 1.5;
    // Corps
    ctx.beginPath();
    ctx.ellipse(x, y, 12, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    // Tête
    ctx.beginPath();
    ctx.ellipse(x + 13, y, 6, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    // Pattes (4 de chaque côté)
    for (let i = 0; i < 4; i++) {
      const px = x - 8 + i * 5;
      const sign = [1, -1];
      sign.forEach(s => {
        ctx.beginPath();
        ctx.moveTo(px, y);
        ctx.lineTo(px - 4, y + s * 9);
        ctx.lineTo(px - 8, y + s * 12);
        ctx.stroke();
      });
    }
    // Queue (courbe vers le haut)
    ctx.beginPath();
    ctx.moveTo(x - 12, y);
    ctx.bezierCurveTo(x - 24, y - 5, x - 30, y - 20, x - 22, y - 32);
    ctx.stroke();
    // Dard
    ctx.beginPath();
    ctx.arc(x - 22, y - 32, 3, 0, Math.PI * 2);
    ctx.fill();
    // Pinces
    ctx.beginPath();
    ctx.moveTo(x + 18, y - 2);
    ctx.lineTo(x + 26, y - 8);
    ctx.lineTo(x + 30, y - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 18, y + 2);
    ctx.lineTo(x + 26, y + 8);
    ctx.lineTo(x + 30, y + 4);
    ctx.stroke();
    ctx.restore();
  }

  function drawWhirls(ctx, t) {
    whirls.forEach((w, wi) => {
      const cx = ((w.x + t * w.vx * 30) % (W + 80)) - 40;
      const baseY = H * 0.84 - wi * 30;
      ctx.save();
      ctx.globalAlpha = 0.35;
      for (let p = 0; p < 28; p++) {
        const angle  = (p / 28) * Math.PI * 4 + t * 2 + w.phase;
        const radius = p * 1.8;
        const px = cx + Math.cos(angle) * radius * 0.35;
        const py = baseY - p * 2.8 + Math.sin(angle) * radius * 0.5;
        const size = 1.5 + p * 0.08;
        ctx.fillStyle = rgba(SAND_P, 0.6 - p * 0.018);
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });
  }

  // Trails sable (offscreen accumulé)
  const trailCanvas = createCanvas(W, H);
  const tCtx = trailCanvas.getContext('2d');

  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS;

    // ── Fond gradient ciel ───────────────────────────────────────────────────
    ctx.globalAlpha = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#1A0A02');
    sky.addColorStop(0.45,'#301C06');
    sky.addColorStop(0.7, '#5A2C08');
    sky.addColorStop(1,   '#C07030');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // ── Soleil ───────────────────────────────────────────────────────────────
    drawSun(ctx, t);

    // ── Dunes (arrière → avant) ───────────────────────────────────────────────
    duneConfigs.forEach(cfg => drawDune(ctx, cfg, t));

    // ── Mirages ──────────────────────────────────────────────────────────────
    drawMirages(ctx, t);

    // ── Scorpion ─────────────────────────────────────────────────────────────
    scorpX += scorpSpeed;
    if (scorpX > W + 80) scorpX = -80;
    if (scorpX > -60 && scorpX < W + 60) {
      drawScorpion(ctx, scorpX, scorpY);
    }

    // ── Tourbillons ──────────────────────────────────────────────────────────
    drawWhirls(ctx, t);

    // ── Particules sable ─────────────────────────────────────────────────────
    sandP.forEach(p => {
      p.x += p.vx;
      p.y += p.vy + 0.3 * Math.sin(t * 2.5 + p.phase);
      if (p.x > W + 5) p.x = -5;
      if (p.y < 150) p.y = 150;
      if (p.y > H)   p.y = 200 + Math.random() * (H - 300);
      ctx.save();
      ctx.globalAlpha = p.a;
      ctx.fillStyle = SAND_P;
      ctx.beginPath();
      ctx.ellipse(p.x, p.y, p.size, p.size * 0.4, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    saveFrame(canvas, framesDir, f);
    if (f % 30 === 0) process.stdout.write(`  Frame ${f}/${FRAMES}\r`);
  }
  console.log(`  Frame ${FRAMES}/${FRAMES} - done`);

  encodeVideo(framesDir, path.join(themeDir, 'bg.mp4'));
  cleanFrames(framesDir);
  console.log('  DÉSERT terminé.');
}

// ══════════════════════════════════════════════════════════════════════════════
//  THÈME 2 : ENCHANTÉ
// ══════════════════════════════════════════════════════════════════════════════
function generateEnchante() {
  console.log('\n=== ENCHANTÉ ===');
  const themeDir  = path.join(BASE, 'enchante');
  const framesDir = path.join(themeDir, 'frames');
  ensureDir(framesDir);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // Palette
  const BG      = '#030A06';
  const GREEN   = '#40F060';
  const MAGIC   = '#80F040';
  const FAIRY   = '#FFD0A0';

  // ── Cercles runiques ─────────────────────────────────────────────────────────
  const runes = [
    { cx: W * 0.35, cy: H * 0.42, r: 110, dir: 1,  speed: 0.18 },
    { cx: W * 0.65, cy: H * 0.55, r:  85, dir: -1, speed: 0.24 }
  ];

  // ── Fées ─────────────────────────────────────────────────────────────────────
  const FAIRY_COUNT = 8;
  const fairyColors = ['#40F060','#FFD060','#40E0FF','#C080FF','#80FF80','#FFB040','#60FFDD','#FF80C0'];
  const fairies = Array.from({ length: FAIRY_COUNT }, (_, i) => ({
    ax: W  * (0.15 + 0.7 * Math.random()),
    ay: H  * (0.15 + 0.6 * Math.random()),
    bx: W  * (0.15 + 0.7 * Math.random()),
    by: H  * (0.15 + 0.6 * Math.random()),
    phase: (i / FAIRY_COUNT) * Math.PI * 2,
    speed: 0.4 + Math.random() * 0.5,
    color: fairyColors[i],
    trail: []
  }));

  // ── Champignons ───────────────────────────────────────────────────────────────
  const mushColors = ['#E03030','#E06020','#C04040','#D05030'];
  const mushrooms = [
    { x: W * 0.08, y: H * 0.88, r: 22 },
    { x: W * 0.25, y: H * 0.92, r: 16 },
    { x: W * 0.78, y: H * 0.89, r: 20 },
    { x: W * 0.92, y: H * 0.93, r: 14 }
  ];

  // ── Particules magiques ───────────────────────────────────────────────────────
  const PART_COUNT = 60;
  const magicParts = Array.from({ length: PART_COUNT }, () => ({
    x     : Math.random() * W,
    y     : Math.random() * H,
    vx    : (Math.random() - 0.5) * 0.6,
    vy    : -0.3 - Math.random() * 0.7,
    phase : Math.random() * Math.PI * 2,
    size  : 2 + Math.random() * 3,
    a     : 0.4 + Math.random() * 0.5,
    life  : Math.random(),
    color : [GREEN, MAGIC, FAIRY, '#C0FF80', '#FFFFFF'][Math.floor(Math.random() * 5)]
  }));

  // ── Feuilles tombantes ────────────────────────────────────────────────────────
  const LEAF_COUNT = 24;
  const leaves = Array.from({ length: LEAF_COUNT }, () => ({
    x    : Math.random() * W,
    y    : Math.random() * H * 0.7,
    vx   : (Math.random() - 0.5) * 0.5,
    vy   : 0.4 + Math.random() * 0.6,
    phase: Math.random() * Math.PI * 2,
    size : 3 + Math.random() * 5,
    rot  : Math.random() * Math.PI * 2,
    rotV : (Math.random() - 0.5) * 0.06,
    color: ['#40F060','#60D040','#80FF40','#20A030'][Math.floor(Math.random()*4)]
  }));

  function drawRunicCircle(ctx, rune, t) {
    const angle = t * rune.speed * rune.dir;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.8);
    ctx.save();
    ctx.translate(rune.cx, rune.cy);
    ctx.rotate(angle);
    // glow
    const glow = ctx.createRadialGradient(0, 0, rune.r * 0.85, 0, 0, rune.r * 1.2);
    glow.addColorStop(0, rgba(GREEN, 0.22 * pulse));
    glow.addColorStop(1, rgba(GREEN, 0));
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, rune.r * 1.2, 0, Math.PI * 2);
    ctx.fill();
    // cercle principal
    ctx.strokeStyle = rgba(GREEN, 0.55 + 0.3 * pulse);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rune.r, 0, Math.PI * 2);
    ctx.stroke();
    // cercle intérieur
    ctx.strokeStyle = rgba(MAGIC, 0.3 + 0.2 * pulse);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, rune.r * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    // runes (petits traits rayonnants)
    const runeCount = 12;
    for (let i = 0; i < runeCount; i++) {
      const a = (i / runeCount) * Math.PI * 2;
      const inner = rune.r - 12;
      const outer = rune.r + 8;
      ctx.strokeStyle = rgba(GREEN, 0.7 + 0.3 * pulse);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
      ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
      ctx.stroke();
      // petite croix runique
      const mx = Math.cos(a) * (rune.r - 20);
      const my = Math.sin(a) * (rune.r - 20);
      ctx.beginPath();
      ctx.moveTo(mx - 4, my);
      ctx.lineTo(mx + 4, my);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(mx, my - 4);
      ctx.lineTo(mx, my + 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFairy(ctx, fairy, t) {
    const ph = t * fairy.speed + fairy.phase;
    // Lissajous
    const x = fairy.ax + (fairy.bx - fairy.ax) * (0.5 + 0.5 * Math.sin(ph));
    const y = fairy.ay + (fairy.by - fairy.ay) * (0.5 + 0.5 * Math.sin(ph * 1.37 + 1));

    fairy.trail.push({ x, y, a: 0.7 });
    if (fairy.trail.length > 22) fairy.trail.shift();

    // traîne
    fairy.trail.forEach((pt, i) => {
      const alpha = (i / fairy.trail.length) * pt.a * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = fairy.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 2 * (i / fairy.trail.length), 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // halo
    const halo = ctx.createRadialGradient(x, y, 0, x, y, 18);
    halo.addColorStop(0, rgba(fairy.color.slice(0,7), 0.5));
    halo.addColorStop(1, rgba(fairy.color.slice(0,7), 0));
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, Math.PI * 2);
    ctx.fill();
    // corps lumière
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.9 + 0.1 * Math.sin(t * 5 + fairy.phase);
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function drawMushroom(ctx, m, t) {
    const pulse = 1 + 0.06 * Math.sin(t * 2.2 + m.x * 0.01);
    const r = m.r * pulse;
    ctx.save();
    ctx.translate(m.x, m.y);
    // glow
    const glow = ctx.createRadialGradient(0, -r * 0.3, 0, 0, -r * 0.3, r * 2);
    glow.addColorStop(0, 'rgba(255,120,20,0.18)');
    glow.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, -r * 0.3, r * 2, 0, Math.PI * 2);
    ctx.fill();
    // pied
    ctx.fillStyle = '#D4B090';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.4, r * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();
    // chapeau
    const mi = mushColors[Math.floor(m.x / W * mushColors.length)];
    ctx.fillStyle = mi;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.6, r, r * 0.65, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    // taches blanches
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    [[-r*0.3,-r*0.9],[r*0.25,-r*1.0],[0,-r*0.75],[-r*0.5,-r*0.7]].forEach(([tx,ty]) => {
      ctx.beginPath();
      ctx.arc(tx, ty, r * 0.13, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  function drawMagicParticle(ctx, p, t) {
    p.life += 0.008;
    if (p.life > 1) {
      p.life = 0;
      p.x = Math.random() * W;
      p.y = H * 0.9 + Math.random() * H * 0.1;
    }
    p.x += p.vx + 0.2 * Math.sin(t * 3 + p.phase);
    p.y += p.vy;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    const alpha = p.a * Math.sin(p.life * Math.PI);
    const s = p.size * (0.7 + 0.3 * Math.sin(t * 6 + p.phase));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = 1;
    // croix scintillante ✦
    ctx.beginPath();
    ctx.moveTo(p.x - s, p.y); ctx.lineTo(p.x + s, p.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - s); ctx.lineTo(p.x, p.y + s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x - s*0.7, p.y - s*0.7); ctx.lineTo(p.x + s*0.7, p.y + s*0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.x + s*0.7, p.y - s*0.7); ctx.lineTo(p.x - s*0.7, p.y + s*0.7);
    ctx.stroke();
    ctx.restore();
  }

  function drawTreeSilhouette(ctx, side, t) {
    const x = side === 'left' ? 0 : W;
    const sign = side === 'left' ? 1 : -1;
    ctx.save();
    ctx.fillStyle = '#010804';
    ctx.strokeStyle = '#010804';
    ctx.lineWidth = 8;
    // tronc
    ctx.beginPath();
    ctx.moveTo(x + sign * 10, H);
    ctx.bezierCurveTo(
      x + sign * 18, H * 0.75,
      x + sign * 28, H * 0.55,
      x + sign * 22, H * 0.35
    );
    ctx.stroke();
    // branches sinueuses
    const branchCount = 5;
    for (let i = 0; i < branchCount; i++) {
      const bx = x + sign * (12 + i * 4);
      const by = H * (0.72 - i * 0.08);
      const bangle = (Math.sin(t * 0.8 + i) * 0.1) + (side === 'left' ? 1 : -1) * 0.4;
      ctx.beginPath();
      ctx.lineWidth = 5 - i * 0.7;
      ctx.moveTo(bx, by);
      ctx.bezierCurveTo(
        bx + Math.cos(bangle) * 30, by - 20,
        bx + Math.cos(bangle) * 55, by - 35,
        bx + Math.cos(bangle) * 70, by - 20 + Math.sin(t + i) * 5
      );
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPortal(ctx, t) {
    const cx = W * 0.5, cy = H * 0.28;
    const r  = 70;
    const rot = t * 0.5;
    ctx.save();
    ctx.globalAlpha = 0.13 + 0.04 * Math.sin(t * 1.5);
    ctx.translate(cx, cy);
    // spirale
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = i === 0 ? GREEN : i === 1 ? MAGIC : '#FFFFFF';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 6; a += 0.08) {
        const sr = (a / (Math.PI * 6)) * r;
        const sx = Math.cos(a + rot + i * Math.PI * 0.67) * sr;
        const sy = Math.sin(a + rot + i * Math.PI * 0.67) * sr;
        if (a === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }
    // anneau
    ctx.strokeStyle = rgba(GREEN, 0.7);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawLeaf(ctx, leaf, t) {
    leaf.x += leaf.vx + 0.15 * Math.sin(t * 2 + leaf.phase);
    leaf.y += leaf.vy;
    leaf.rot += leaf.rotV;
    if (leaf.y > H + 20) { leaf.y = -10; leaf.x = Math.random() * W; }
    ctx.save();
    ctx.translate(leaf.x, leaf.y);
    ctx.rotate(leaf.rot);
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = leaf.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, leaf.size, leaf.size * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS;

    // Fond
    ctx.globalAlpha = 1;
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0,   '#010503');
    sky.addColorStop(0.4, '#030A06');
    sky.addColorStop(0.7, '#051208');
    sky.addColorStop(1,   '#030802');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // brume verte au sol
    const mist = ctx.createLinearGradient(0, H * 0.75, 0, H);
    mist.addColorStop(0, 'rgba(10,60,15,0)');
    mist.addColorStop(1, 'rgba(10,60,15,0.35)');
    ctx.fillStyle = mist;
    ctx.fillRect(0, H * 0.75, W, H * 0.25);

    // portail
    drawPortal(ctx, t);

    // cercles runiques
    runes.forEach(r => drawRunicCircle(ctx, r, t));

    // arbres silhouettes
    drawTreeSilhouette(ctx, 'left',  t);
    drawTreeSilhouette(ctx, 'right', t);

    // sol
    ctx.fillStyle = '#020D04';
    ctx.fillRect(0, H * 0.93, W, H * 0.07);

    // champignons
    mushrooms.forEach(m => drawMushroom(ctx, m, t));

    // feuilles
    leaves.forEach(l => drawLeaf(ctx, l, t));

    // particules magiques
    magicParts.forEach(p => drawMagicParticle(ctx, p, t));

    // fées
    fairies.forEach(fairy => drawFairy(ctx, fairy, t));

    saveFrame(canvas, framesDir, f);
    if (f % 30 === 0) process.stdout.write(`  Frame ${f}/${FRAMES}\r`);
  }
  console.log(`  Frame ${FRAMES}/${FRAMES} - done`);

  encodeVideo(framesDir, path.join(themeDir, 'bg.mp4'));
  cleanFrames(framesDir);
  console.log('  ENCHANTÉ terminé.');
}

// ══════════════════════════════════════════════════════════════════════════════
//  THÈME 3 : PLAGE
// ══════════════════════════════════════════════════════════════════════════════
function generatePlage() {
  console.log('\n=== PLAGE ===');
  const themeDir  = path.join(BASE, 'plage');
  const framesDir = path.join(themeDir, 'frames');
  ensureDir(framesDir);

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  // Palette
  const SEA    = '#50C8F0';
  const SAND   = '#C07840';
  const ACCENT = '#F09838';

  // ── Vagues (4 couches) ────────────────────────────────────────────────────────
  const waves = [
    { yBase: H * 0.58, amp: 8,  freq: 0.010, speed: 0.6,  color: 'rgba(80,200,240,0.18)',  foam: 'rgba(255,255,255,0.12)' },
    { yBase: H * 0.65, amp: 11, freq: 0.009, speed: 0.45, color: 'rgba(60,180,220,0.22)',  foam: 'rgba(255,255,255,0.15)' },
    { yBase: H * 0.72, amp: 14, freq: 0.008, speed: 0.32, color: 'rgba(40,160,200,0.28)',  foam: 'rgba(255,255,255,0.2)'  },
    { yBase: H * 0.78, amp: 18, freq: 0.007, speed: 0.22, color: 'rgba(30,140,180,0.38)',  foam: 'rgba(255,255,255,0.28)' }
  ];

  // ── Mouettes (5) ──────────────────────────────────────────────────────────────
  const gulls = Array.from({ length: 5 }, (_, i) => ({
    x    : Math.random() * W,
    y    : H * (0.08 + i * 0.04),
    vx   : 0.5 + Math.random() * 0.8,
    phase: (i / 5) * Math.PI * 2,
    size : 8 + Math.random() * 6,
    wing : 0
  }));

  // ── Reflet soleil ─────────────────────────────────────────────────────────────
  const GLINT_COUNT = 40;
  const glints = Array.from({ length: GLINT_COUNT }, (_, i) => ({
    x    : W * (0.35 + 0.3 * Math.random()),
    y    : H * (0.52 + 0.25 * (i / GLINT_COUNT)),
    phase: Math.random() * Math.PI * 2,
    size : 1 + Math.random() * 2.5
  }));

  // ── Coquillages ───────────────────────────────────────────────────────────────
  const shells = [
    { x: W * 0.15, y: H * 0.92, r: 8  },
    { x: W * 0.40, y: H * 0.95, r: 6  },
    { x: W * 0.60, y: H * 0.91, r: 10 },
    { x: W * 0.82, y: H * 0.94, r: 7  }
  ];

  function drawSkyAndSun(ctx, t) {
    // Dégradé ciel orange-rouge-violet
    const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55);
    sky.addColorStop(0,   '#1C0818');
    sky.addColorStop(0.25,'#3C1020');
    sky.addColorStop(0.55,'#A04020');
    sky.addColorStop(0.75,'#E08030');
    sky.addColorStop(1,   '#F0A040');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H * 0.56);

    // Soleil à l'horizon
    const sx = W * 0.62, sy = H * 0.53;
    const sr = 38 * (1 + 0.03 * Math.sin(t * 2));
    // rayons divergents
    const rc = 16;
    for (let i = 0; i < rc; i++) {
      const a = (i / rc) * Math.PI * 2 + t * 0.1;
      const inner = sr + 5;
      const outer = sr + 20 + 10 * Math.sin(t * 3 + i);
      ctx.save();
      ctx.strokeStyle = `rgba(240,160,40,${0.35 + 0.1 * Math.sin(t * 2 + i)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx + Math.cos(a) * inner, sy + Math.sin(a) * inner);
      ctx.lineTo(sx + Math.cos(a) * outer, sy + Math.sin(a) * outer);
      ctx.stroke();
      ctx.restore();
    }
    // halo soleil
    const halo = ctx.createRadialGradient(sx, sy, sr, sx, sy, sr * 3);
    halo.addColorStop(0,   'rgba(240,160,40,0.28)');
    halo.addColorStop(0.6, 'rgba(220,80,20,0.10)');
    halo.addColorStop(1,   'rgba(180,40,10,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(sx, sy, sr * 3, 0, Math.PI * 2);
    ctx.fill();
    // corps soleil
    const sunG = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
    sunG.addColorStop(0,   '#FFF0A0');
    sunG.addColorStop(0.5, '#F0A840');
    sunG.addColorStop(1,   '#E06020');
    ctx.fillStyle = sunG;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawWave(ctx, wave, t) {
    const shift = t * wave.speed * 80;
    ctx.beginPath();
    let first = true;
    for (let x = -10; x <= W + 10; x += 3) {
      const y = wave.yBase + wave.amp * Math.sin((x - shift) * wave.freq)
              + wave.amp * 0.4 * Math.sin((x - shift * 1.3) * wave.freq * 1.7);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(W + 10, H);
    ctx.lineTo(-10, H);
    ctx.closePath();
    ctx.fillStyle = wave.color;
    ctx.fill();
    // écume crête
    ctx.beginPath();
    first = true;
    for (let x = -10; x <= W + 10; x += 3) {
      const y = wave.yBase + wave.amp * Math.sin((x - shift) * wave.freq)
              + wave.amp * 0.4 * Math.sin((x - shift * 1.3) * wave.freq * 1.7);
      if (first) { ctx.moveTo(x, y); first = false; }
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = wave.foam;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawGull(ctx, gull, t) {
    gull.x += gull.vx;
    if (gull.x > W + 40) gull.x = -40;
    const wingAngle = Math.sin(t * 3 + gull.phase) * 0.35;
    const s = gull.size;
    ctx.save();
    ctx.translate(gull.x, gull.y + Math.sin(t * 1.2 + gull.phase) * 4);
    ctx.strokeStyle = '#1A0C06';
    ctx.lineWidth = 1.8;
    // aile gauche (arc)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-s * 0.5, -s * wingAngle, -s, 0);
    ctx.stroke();
    // aile droite (arc)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(s * 0.5, -s * wingAngle, s, 0);
    ctx.stroke();
    ctx.restore();
  }

  function drawSunReflection(ctx, t) {
    glints.forEach(g => {
      const flicker = Math.sin(t * 8 + g.phase);
      if (flicker < 0) return;
      ctx.save();
      ctx.globalAlpha = flicker * 0.7;
      ctx.fillStyle = '#FFEEAA';
      ctx.beginPath();
      ctx.arc(g.x + Math.sin(t * 2 + g.phase) * 3, g.y, g.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    // chemin lumineux
    ctx.save();
    ctx.globalAlpha = 0.15 + 0.05 * Math.sin(t * 2);
    const reflGrad = ctx.createLinearGradient(W * 0.62, H * 0.54, W * 0.5, H * 0.78);
    reflGrad.addColorStop(0,   'rgba(255,200,80,0.6)');
    reflGrad.addColorStop(0.5, 'rgba(255,160,40,0.3)');
    reflGrad.addColorStop(1,   'rgba(255,120,20,0)');
    ctx.fillStyle = reflGrad;
    ctx.beginPath();
    ctx.moveTo(W * 0.55, H * 0.54);
    ctx.lineTo(W * 0.69, H * 0.54);
    ctx.lineTo(W * 0.80, H * 0.79);
    ctx.lineTo(W * 0.30, H * 0.79);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawPalmTree(ctx, side, t) {
    const x = side === 'left' ? W * 0.06 : W * 0.94;
    const sign = side === 'left' ? 1 : -1;
    ctx.save();
    ctx.strokeStyle = '#2A1004';
    ctx.fillStyle   = '#2A1004';
    // tronc courbe
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(x, H);
    ctx.bezierCurveTo(
      x + sign * 12, H * 0.78,
      x + sign * 26, H * 0.58,
      x + sign * 20, H * 0.40
    );
    ctx.stroke();
    // palmes (5)
    const palmBase = { x: x + sign * 20, y: H * 0.40 };
    const palmAngles = [-0.7, -0.3, 0.1, 0.5, 0.9].map(a => a * Math.PI);
    palmAngles.forEach((a, i) => {
      const wave = Math.sin(t * 1.5 + i * 0.5) * 0.08;
      const pa = a + wave;
      const len = 60 + i * 8;
      ctx.lineWidth = 3 - i * 0.3;
      ctx.strokeStyle = '#244018';
      ctx.beginPath();
      ctx.moveTo(palmBase.x, palmBase.y);
      ctx.bezierCurveTo(
        palmBase.x + Math.cos(pa) * len * 0.4, palmBase.y + Math.sin(pa) * len * 0.4,
        palmBase.x + Math.cos(pa) * len * 0.75, palmBase.y + Math.sin(pa) * len * 0.5,
        palmBase.x + Math.cos(pa) * len, palmBase.y + Math.sin(pa) * len * 0.7
      );
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawShell(ctx, s) {
    ctx.save();
    ctx.fillStyle = '#D09060';
    ctx.strokeStyle = '#A06030';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // stries
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r * i / 3.5, Math.PI, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBeach(ctx) {
    const beach = ctx.createLinearGradient(0, H * 0.78, 0, H);
    beach.addColorStop(0,   '#D08840');
    beach.addColorStop(0.4, '#C07840');
    beach.addColorStop(1,   '#A05820');
    ctx.fillStyle = beach;
    ctx.fillRect(0, H * 0.78, W, H * 0.22);
  }

  function drawHorizon(ctx) {
    // mer de l'horizon à la vague de fond
    const sea = ctx.createLinearGradient(0, H * 0.54, 0, H * 0.60);
    sea.addColorStop(0,   'rgba(80,160,200,0.9)');
    sea.addColorStop(1,   'rgba(50,130,170,0.7)');
    ctx.fillStyle = sea;
    ctx.fillRect(0, H * 0.54, W, H * 0.07);
  }

  for (let f = 0; f < FRAMES; f++) {
    const t = f / FPS;

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#1C0804';
    ctx.fillRect(0, 0, W, H);

    // ciel + soleil
    drawSkyAndSun(ctx, t);

    // horizon mer
    drawHorizon(ctx);

    // reflet soleil sur l'eau
    drawSunReflection(ctx, t);

    // vagues
    waves.forEach(w => drawWave(ctx, w, t));

    // plage
    drawBeach(ctx);

    // palmiers
    drawPalmTree(ctx, 'left',  t);
    drawPalmTree(ctx, 'right', t);

    // coquillages
    shells.forEach(s => drawShell(ctx, s));

    // mouettes
    gulls.forEach(g => drawGull(ctx, g, t));

    saveFrame(canvas, framesDir, f);
    if (f % 30 === 0) process.stdout.write(`  Frame ${f}/${FRAMES}\r`);
  }
  console.log(`  Frame ${FRAMES}/${FRAMES} - done`);

  encodeVideo(framesDir, path.join(themeDir, 'bg.mp4'));
  cleanFrames(framesDir);
  console.log('  PLAGE terminée.');
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN
// ══════════════════════════════════════════════════════════════════════════════
(async () => {
  console.log('========================================');
  console.log(' Génération vidéos Block Puzzle Premium ');
  console.log('========================================');
  const t0 = Date.now();

  generateDesert();
  generateEnchante();
  generatePlage();

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n Terminé en ${elapsed}s`);
  console.log('Output:');
  ['desert','enchante','plage'].forEach(n =>
    console.log(`  ${BASE}/${n}/bg.mp4`)
  );
})();
