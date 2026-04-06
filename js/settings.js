'use strict';
// ─── SETTINGS ────────────────────────────────────────────────────────────────
// Persistent game settings — loaded from localStorage, applied globally.
// Categories: Audio, Visuel, Jeu, Contrôles

// ─── DEFAULT STATE ────────────────────────────────────────────────────────────
const SET = {
  // Audio
  sfxVol:     1.0,   // SFX volume multiplier (0–1)
  musicVol:   1.0,   // Music volume multiplier (0–1)
  muteAll:    false, // Mute everything
  // Visuel
  particles:  2,     // 0=Faible 1=Moyen 2=Élevé 3=Ultra
  shake:      2,     // 0=Off 1=Légère 2=Normale 3=Forte
  showFPS:    false,
  reducedMotion: false,
  // Jeu
  ghostPiece: true,
  gridLines:  true,
  autoSave:   30,    // seconds: 10/30/60/0=jamais
  histDiff:   1,     // 0=Facile 1=Normal 2=Difficile
  // Contrôles
  touchSens:  1.0,   // 0.5–2.0
  dragOffset: 1.5,   // cells above finger (0.5–3.0)
  haptic:     true
};

// ─── LOAD FROM LOCALSTORAGE ───────────────────────────────────────────────────
(function _loadSettings() {
  function _f(key, def) { const v = parseFloat(localStorage.getItem(key)); return isNaN(v) ? def : v; }
  function _b(key, def) { const v = localStorage.getItem(key); return v === null ? def : v === '1'; }
  function _i(key, def) { const v = parseInt(localStorage.getItem(key), 10); return isNaN(v) ? def : v; }
  try {
    SET.sfxVol        = _f('bp_sfx_vol',    1.0);
    SET.musicVol      = _f('bp_music_vol',  1.0);
    SET.muteAll       = _b('bp_mute',       false);
    SET.particles     = _i('bp_particles',  2);
    SET.shake         = _i('bp_shake',      2);
    SET.showFPS       = _b('bp_fps',        false);
    SET.reducedMotion = _b('bp_reduced',    false);
    SET.ghostPiece    = _b('bp_ghost',      true);
    SET.gridLines     = _b('bp_gridlines',  true);
    SET.autoSave      = _i('bp_autosave',   30);
    SET.histDiff      = _i('bp_hdiff',      1);
    SET.touchSens     = _f('bp_touch_sens', 1.0);
    SET.dragOffset    = _f('bp_drag_off',   1.5);
    SET.haptic        = _b('bp_haptic',     true);
  } catch(e) {}
})();

function _saveSET(key, val) {
  try { localStorage.setItem(key, String(val)); } catch(e) {}
}

// ─── UI STATE ─────────────────────────────────────────────────────────────────
let _settingsTab = 0;          // 0=Audio 1=Visuel 2=Jeu 3=Contrôles
let _settingsFrom = 'menu';    // where to return: 'menu' | 'pause'
let _setTabRects = [];
let _setBackRect = null;
let _setInteractRects = [];    // [{type, key, ...extra, rect}]
let _settingsScrollY = 0;      // future-proofing
// FPS tracking
let _fpsFrames = 0, _fpsLast = 0, _fpsDisplay = 0;

// ─── OPEN / CLOSE ─────────────────────────────────────────────────────────────
function openSettings(from) {
  _settingsFrom = from || 'menu';
  _settingsTab = 0;
  _setInteractRects = [];
  gameState = 'settings';
}

function closeSettings() {
  gameState = _settingsFrom === 'pause' ? 'pause' : 'menu';
}

// ─── FPS COUNTER ─────────────────────────────────────────────────────────────
function _tickFPS(ts) {
  _fpsFrames++;
  if (ts - _fpsLast >= 1000) {
    _fpsDisplay = _fpsFrames;
    _fpsFrames = 0;
    _fpsLast = ts;
  }
}

// ─── DRAW SETTINGS SCREEN ─────────────────────────────────────────────────────
function drawSettings(ts) {
  _tickFPS(ts);

  const th = THEMES[selTheme];
  // Background — reuse menu bg
  ctx.drawImage(menuBg, 0, 0);
  ctx.fillStyle = 'rgba(0,0,0,0.82)';
  ctx.fillRect(0, 0, W, H);

  _setInteractRects = [];

  // ── PANEL ──
  const pw = Math.min(W - 16, 420);
  const ph = Math.min(H - 16, 680);
  const px = ((W - pw) / 2) | 0;
  const py = ((H - ph) / 2) | 0;

  // Panel glass
  const pg = ctx.createLinearGradient(px, py, px, py + ph);
  pg.addColorStop(0, hexA(th.gbg, 0.97));
  pg.addColorStop(1, hexA(th.bg, 0.95));
  rrect(ctx, px, py, pw, ph, 20, pg, null);
  // Shine top
  const psh = ctx.createLinearGradient(px, py, px, py + ph * 0.35);
  psh.addColorStop(0, 'rgba(255,255,255,0.10)');
  psh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); rp(ctx, px, py, pw, ph, 20); ctx.clip();
  ctx.fillStyle = psh; ctx.fillRect(px, py, pw, ph * 0.35);
  ctx.restore();
  // Border
  rp(ctx, px, py, pw, ph, 20);
  ctx.strokeStyle = hexA(th.sl, 0.7); ctx.lineWidth = 1.5; ctx.stroke();

  // ── TITLE ──
  const tsz = cl(Math.floor(ph * 0.058), 16, 28);
  ctx.save();
  ctx.font = `bold ${tsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = th.tm; ctx.shadowColor = th.tm; ctx.shadowBlur = 10;
  ctx.fillText('⚙  PARAMÈTRES', px + pw / 2, py + tsz * 1.1);
  ctx.shadowBlur = 0; ctx.restore();

  // ── TABS ──
  const tabLabels = ['🔊 SON', '🎨 VISUEL', '🎮 JEU', '👆 CONTRÔLES'];
  const tabY = py + tsz * 2.4;
  const tabH = cl(Math.floor(ph * 0.072), 28, 44);
  const tabW = (pw - 12) / 4;
  _setTabRects = [];
  tabLabels.forEach((lbl, i) => {
    const tx = px + 6 + i * tabW;
    const sel = i === _settingsTab;
    // Tab bg
    const tbg = ctx.createLinearGradient(tx, tabY, tx, tabY + tabH);
    if (sel) {
      tbg.addColorStop(0, hexA(th.ta, 0.85));
      tbg.addColorStop(1, hexA(th.ta, 0.55));
    } else {
      tbg.addColorStop(0, hexA(th.gbg, 0.5));
      tbg.addColorStop(1, hexA(th.bg, 0.3));
    }
    rrect(ctx, tx + 1, tabY, tabW - 2, tabH, 10, tbg, sel ? hexA(th.tm, 0.7) : hexA(th.sl, 0.3), sel ? 1.5 : 1);
    if (sel) {
      ctx.save(); ctx.shadowColor = th.ta; ctx.shadowBlur = 8;
      rp(ctx, tx + 1, tabY, tabW - 2, tabH, 10); ctx.strokeStyle = th.ta; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    // Tab label — emoji + text split for size
    const parts = lbl.split(' ');
    const emoji = parts[0], label = parts.slice(1).join(' ');
    const esz = cl(Math.floor(tabH * 0.48), 11, 18);
    const lsz = cl(Math.floor(tabH * 0.28), 7, 11);
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `${esz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.fillStyle = sel ? '#fff' : hexA(th.tg, 0.80);
    ctx.fillText(emoji, tx + tabW / 2, tabY + tabH * 0.34);
    ctx.font = `bold ${lsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.fillStyle = sel ? th.tm : hexA(th.tg, 0.65);
    ctx.fillText(label, tx + tabW / 2, tabY + tabH * 0.76);
    ctx.restore();
    _setTabRects.push({ x: tx, y: tabY, w: tabW, h: tabH, tab: i });
  });

  // ── CONTENT AREA ──
  const contentX = px + 10;
  const contentY = tabY + tabH + 8;
  const contentW = pw - 20;
  const contentH = ph - (contentY - py) - 54;

  // Clip content area
  ctx.save();
  rp(ctx, contentX - 2, contentY - 2, contentW + 4, contentH + 4, 8);
  ctx.clip();

  if (_settingsTab === 0) _drawAudioTab(contentX, contentY, contentW, contentH, th, ts);
  else if (_settingsTab === 1) _drawVisuelTab(contentX, contentY, contentW, contentH, th, ts);
  else if (_settingsTab === 2) _drawJeuTab(contentX, contentY, contentW, contentH, th, ts);
  else _drawControlesTab(contentX, contentY, contentW, contentH, th, ts);

  ctx.restore();

  // ── BACK BUTTON ──
  const bbh = cl(Math.floor(ph * 0.072), 30, 44);
  const bbw = cl(pw * 0.42, 100, 160);
  const bbx = px + (pw - bbw) / 2;
  const bby = py + ph - bbh - 8;
  const bbg = ctx.createLinearGradient(bbx, bby, bbx, bby + bbh);
  bbg.addColorStop(0, '#383858'); bbg.addColorStop(1, '#1c1c2c');
  rrect(ctx, bbx, bby, bbw, bbh, bbh / 2, bbg, hexA(th.sl, 0.5), 1.5);
  const bfsz = cl(Math.floor(bbh * 0.48), 10, 18);
  ctx.save();
  ctx.font = `bold ${bfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fillText('← RETOUR', bbx + bbw / 2, bby + bbh / 2);
  ctx.restore();
  _setBackRect = { x: bbx, y: bby, w: bbw, h: bbh };

  // Separator above back
  ctx.save();
  ctx.strokeStyle = hexA(th.sl, 0.25); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(px + 14, bby - 6); ctx.lineTo(px + pw - 14, bby - 6); ctx.stroke();
  ctx.restore();

  // FPS overlay (if enabled)
  if (SET.showFPS) {
    ctx.save();
    ctx.font = `bold 13px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.fillStyle = '#00FF80'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.shadowColor = '#00FF80'; ctx.shadowBlur = 6;
    ctx.fillText(`FPS: ${_fpsDisplay}`, 6, 6);
    ctx.restore();
  }
}

// ─── ROW HELPERS ──────────────────────────────────────────────────────────────
function _rowH(contentH) { return cl(Math.floor(contentH / 5.2), 38, 62); }

function _rowBg(x, y, w, h, th, i) {
  ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
  rp(ctx, x, y, w, h, 8); ctx.fill();
}

function _rowLabel(lbl, x, y, h, th) {
  const fsz = cl(Math.floor(h * 0.30), 9, 14);
  ctx.save();
  ctx.font = `${fsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = th.tm;
  ctx.fillText(lbl, x + 8, y + h / 2);
  ctx.restore();
  return fsz;
}

// Toggle (On/Off) — returns hit rect
function _drawToggle(x, y, w, h, th, value, key) {
  const tw = cl(h * 1.7, 36, 52);
  const th2 = cl(h * 0.52, 16, 26);
  const tx = x + w - tw - 6;
  const ty = y + (h - th2) / 2;
  // Track
  const tg = value ? th.ta : hexA(th.sl, 0.5);
  rrect(ctx, tx, ty, tw, th2, th2 / 2, tg, null);
  // Shine on track
  const trsh = ctx.createLinearGradient(tx, ty, tx, ty + th2 * 0.5);
  trsh.addColorStop(0, 'rgba(255,255,255,0.15)');
  trsh.addColorStop(1, 'rgba(255,255,255,0)');
  rp(ctx, tx, ty, tw, th2, th2 / 2); ctx.fillStyle = trsh; ctx.fill();
  // Thumb
  const thumbX = value ? tx + tw - th2 + 1 : tx + 1;
  ctx.save();
  ctx.shadowColor = value ? th.ta : 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = value ? 5 : 2;
  ctx.fillStyle = value ? '#fff' : '#aaa';
  ctx.beginPath();
  ctx.arc(thumbX + th2 / 2 - 1, ty + th2 / 2, th2 / 2 - 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // Border
  rp(ctx, tx, ty, tw, th2, th2 / 2);
  ctx.strokeStyle = value ? hexA(th.tm, 0.6) : hexA(th.sl, 0.4);
  ctx.lineWidth = 1; ctx.stroke();
  return { x: tx - 4, y: ty - 6, w: tw + 8, h: th2 + 12, type: 'toggle', key };
}

// Slider — returns hit rect
function _drawSlider(x, y, w, h, th, value, min, max, key) {
  const sw = w * 0.38;
  const sh = cl(h * 0.28, 8, 14);
  const sx = x + w - sw - 6;
  const sy = y + (h - sh) / 2;
  const t = (value - min) / (max - min);
  // Track
  rrect(ctx, sx, sy, sw, sh, sh / 2, hexA(th.sl, 0.4), hexA(th.sl, 0.6), 1);
  // Fill
  const fillW = Math.max(sh, sw * t);
  rrect(ctx, sx, sy, fillW, sh, sh / 2, hexA(th.ta, 0.85), null);
  // Shine
  const ssh = ctx.createLinearGradient(sx, sy, sx, sy + sh * 0.5);
  ssh.addColorStop(0, 'rgba(255,255,255,0.22)');
  ssh.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); rp(ctx, sx, sy, fillW, sh, sh / 2); ctx.clip();
  ctx.fillStyle = ssh; ctx.fillRect(sx, sy, fillW, sh); ctx.restore();
  // Thumb
  const thumbX = sx + sw * t;
  ctx.save();
  ctx.shadowColor = th.tm; ctx.shadowBlur = 5;
  ctx.beginPath(); ctx.arc(thumbX, sy + sh / 2, sh * 0.8, 0, Math.PI * 2);
  ctx.fillStyle = th.tm; ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
  // Value label
  const vlsz = cl(Math.floor(h * 0.28), 8, 12);
  ctx.save();
  ctx.font = `bold ${vlsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
  ctx.fillStyle = th.tm;
  ctx.fillText(`${Math.round(value * 100)}%`, sx - 4, sy + sh / 2);
  ctx.restore();
  return { x: sx - 4, y: sy - 8, w: sw + 12, h: sh + 16, type: 'slider', key, min, max, sliderX: sx, sliderW: sw };
}

// Multi-choice chips — returns hit rects
function _drawChips(x, y, w, h, th, options, value, key) {
  const n = options.length;
  const chipW = Math.min((w * 0.55) / n - 3, 58);
  const chipH = cl(h * 0.52, 16, 28);
  const startX = x + w - n * (chipW + 3) - 4;
  const cy = y + (h - chipH) / 2;
  const rects = [];
  options.forEach((opt, i) => {
    const cx = startX + i * (chipW + 3);
    const sel = i === value;
    const cbg = ctx.createLinearGradient(cx, cy, cx, cy + chipH);
    if (sel) {
      cbg.addColorStop(0, hexA(th.ta, 0.90));
      cbg.addColorStop(1, hexA(th.ta, 0.60));
    } else {
      cbg.addColorStop(0, hexA(th.gbg, 0.60));
      cbg.addColorStop(1, hexA(th.bg, 0.40));
    }
    rrect(ctx, cx, cy, chipW, chipH, chipH / 2, cbg, sel ? hexA(th.tm, 0.7) : hexA(th.sl, 0.35), sel ? 1.5 : 1);
    if (sel) {
      ctx.save(); ctx.shadowColor = th.ta; ctx.shadowBlur = 6;
      rp(ctx, cx, cy, chipW, chipH, chipH / 2); ctx.strokeStyle = th.ta; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
    const fsz = cl(Math.floor(chipH * 0.44), 7, 12);
    ctx.save();
    ctx.font = `bold ${fsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = sel ? '#fff' : hexA(th.tg, 0.75);
    ctx.fillText(opt, cx + chipW / 2, cy + chipH / 2);
    ctx.restore();
    rects.push({ x: cx, y: cy - 4, w: chipW, h: chipH + 8, type: 'chip', key, val: i });
  });
  return rects;
}

// Section separator
function _drawSep(x, y, w, th) {
  ctx.save();
  ctx.strokeStyle = hexA(th.sl, 0.25); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x + 4, y); ctx.lineTo(x + w - 4, y); ctx.stroke();
  ctx.restore();
}

// ─── AUDIO TAB ────────────────────────────────────────────────────────────────
function _drawAudioTab(x, y, w, h, th, ts) {
  const rh = _rowH(h);
  let cy = y + 4;

  // Mute All
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Tout couper', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, SET.muteAll, 'muteAll'));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Master Volume (reuse bp_volume)
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Volume principal', x, cy, rh, th);
  _setInteractRects.push(_drawSlider(x, cy, w, rh, th, typeof _volume !== 'undefined' ? _volume : 0.7, 0, 1, 'masterVol'));
  cy += rh + 2;

  // SFX Volume
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Volume effets', x, cy, rh, th);
  _setInteractRects.push(_drawSlider(x, cy, w, rh, th, SET.sfxVol, 0, 1, 'sfxVol'));
  cy += rh + 2;

  // Music Volume
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Volume musique', x, cy, rh, th);
  _setInteractRects.push(_drawSlider(x, cy, w, rh, th, SET.musicVol, 0, 1, 'musicVol'));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // SFX on/off
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Effets sonores', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, typeof _soundEnabled !== 'undefined' ? _soundEnabled : true, 'sfxEnabled'));
  cy += rh + 2;

  // Music on/off
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Musique', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, typeof _musicEnabled !== 'undefined' ? _musicEnabled : true, 'musicEnabled'));
}

// ─── VISUEL TAB ───────────────────────────────────────────────────────────────
function _drawVisuelTab(x, y, w, h, th, ts) {
  const rh = _rowH(h);
  let cy = y + 4;

  // Theme preview row
  const lblsz = cl(Math.floor(rh * 0.30), 9, 14);
  ctx.save();
  ctx.font = `${lblsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = th.tm;
  ctx.fillText('Thème', x + 8, cy + rh * 0.38);
  ctx.restore();
  // Theme swatches
  const swN = THEMES.length;
  const swSize = cl(Math.floor(rh * 0.55), 16, 28);
  const swGap = 3;
  const swTotalW = swN * (swSize + swGap) - swGap;
  const swStartX = x + w - swTotalW - 6;
  const swY = cy + (rh - swSize) / 2;
  THEMES.forEach((thm, i) => {
    const sx = swStartX + i * (swSize + swGap);
    const sel = i === selTheme;
    ctx.save();
    if (sel) { ctx.shadowColor = thm.tm; ctx.shadowBlur = 7; }
    rrect(ctx, sx, swY, swSize, swSize, swSize / 3,
      ctx.createLinearGradient(sx, swY, sx + swSize, swY + swSize) ||
      thm.tm, sel ? thm.tm : hexA(thm.sl, 0.5), sel ? 2 : 1);
    // Build gradient manually
    const tsg = ctx.createLinearGradient(sx, swY, sx + swSize, swY + swSize);
    tsg.addColorStop(0, thm.tm); tsg.addColorStop(1, thm.ta);
    rrect(ctx, sx, swY, swSize, swSize, swSize / 3, tsg, sel ? '#fff' : hexA(thm.sl, 0.4), sel ? 2 : 1);
    if (sel) {
      ctx.font = `bold ${Math.floor(swSize * 0.55)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillText('✓', sx + swSize / 2, swY + swSize / 2);
    }
    ctx.restore();
    _setInteractRects.push({ x: sx - 3, y: swY - 3, w: swSize + 6, h: swSize + 6, type: 'theme', val: i });
  });
  cy += rh + 2;

  // Skin preview row
  ctx.save();
  ctx.font = `${lblsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = th.tm;
  ctx.fillText('Skin des blocs', x + 8, cy + rh * 0.38);
  ctx.restore();
  const skN = SKIN_NAMES.length;
  const skSize = swSize;
  const skGap = 3;
  const skTotalW = skN * (skSize + skGap) - skGap;
  const skStartX = x + w - skTotalW - 6;
  const skY = cy + (rh - skSize) / 2;
  SKIN_NAMES.forEach((_, i) => {
    const sx = skStartX + i * (skSize + skGap);
    const sel = i === selSkin;
    ctx.save();
    if (sel) { ctx.shadowColor = th.tm; ctx.shadowBlur = 5; }
    ctx.globalAlpha = sel ? 1.0 : 0.7;
    drawCell(ctx, COLORS[i % COLORS.length], sx | 0, skY | 0, skSize, i, ts);
    ctx.globalAlpha = 1;
    if (sel) {
      ctx.font = `bold ${Math.floor(skSize * 0.55)}px system-ui`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillText('✓', sx + skSize / 2, skY + skSize / 2);
    }
    ctx.restore();
    _setInteractRects.push({ x: sx - 3, y: skY - 3, w: skSize + 6, h: skSize + 6, type: 'skin', val: i });
  });
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Particle density
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Densité particules', x, cy, rh, th);
  _drawChips(x, cy, w, rh, th, ['Faible', 'Moyen', 'Élevé', 'Ultra'], SET.particles, 'particles')
    .forEach(r => _setInteractRects.push(r));
  cy += rh + 2;

  // Screen shake
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Secousse écran', x, cy, rh, th);
  _drawChips(x, cy, w, rh, th, ['Off', 'Légère', 'Normale', 'Forte'], SET.shake, 'shake')
    .forEach(r => _setInteractRects.push(r));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Show FPS
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Compteur FPS', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, SET.showFPS, 'showFPS'));
  cy += rh + 2;

  // Reduced motion
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Mouvements réduits', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, SET.reducedMotion, 'reducedMotion'));
}

// ─── JEU TAB ──────────────────────────────────────────────────────────────────
function _drawJeuTab(x, y, w, h, th, ts) {
  const rh = _rowH(h);
  let cy = y + 4;

  // Ghost piece
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Aperçu fantôme', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, SET.ghostPiece, 'ghostPiece'));
  cy += rh + 2;

  // Grid lines
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Lignes de grille', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, SET.gridLines, 'gridLines'));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Auto-save
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Sauvegarde auto', x, cy, rh, th);
  _drawChips(x, cy, w, rh, th, ['Jamais', '10 s', '30 s', '60 s'],
    [0, 10, 30, 60].indexOf(SET.autoSave) >= 0 ? [0, 10, 30, 60].indexOf(SET.autoSave) : 2, 'autoSave')
    .forEach(r => _setInteractRects.push(r));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Histoire difficulty
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Difficulté Histoire', x, cy, rh, th);
  _drawChips(x, cy, w, rh, th, ['Facile', 'Normal', 'Difficile'], SET.histDiff, 'histDiff')
    .forEach(r => _setInteractRects.push(r));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Info row for histoire diff
  const isz = cl(Math.floor(rh * 0.26), 8, 12);
  ctx.save();
  const _diffDescs = [
    'Cibles de score réduites, plus de temps.',
    'Progression standard — équilibrée.',
    'Cibles élevées, chrono serré !'
  ];
  ctx.font = `${isz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = hexA(th.tg, 0.65);
  ctx.fillText(_diffDescs[SET.histDiff], x + w / 2, cy);
  ctx.restore();
}

// ─── CONTRÔLES TAB ────────────────────────────────────────────────────────────
function _drawControlesTab(x, y, w, h, th, ts) {
  const rh = _rowH(h);
  let cy = y + 4;

  // Touch sensitivity
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Sensibilité tactile', x, cy, rh, th);
  _setInteractRects.push(_drawSlider(x, cy, w, rh, th, (SET.touchSens - 0.5) / 1.5, 0, 1, 'touchSens'));
  cy += rh + 2;

  // Drag offset
  _rowBg(x, cy, w, rh, th, 1);
  _rowLabel('Décalage du doigt', x, cy, rh, th);
  _setInteractRects.push(_drawSlider(x, cy, w, rh, th, (SET.dragOffset - 0.5) / 2.5, 0, 1, 'dragOffset'));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Offset visual hint
  const hint = `Pièce à ${SET.dragOffset.toFixed(1)} case(s) au-dessus du doigt`;
  const isz = cl(Math.floor(rh * 0.26), 8, 12);
  ctx.save();
  ctx.font = `${isz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = hexA(th.tg, 0.60);
  ctx.fillText(hint, x + w / 2, cy);
  ctx.restore();
  cy += isz + 10;

  // Haptic feedback
  _rowBg(x, cy, w, rh, th, 0);
  _rowLabel('Retour haptique', x, cy, rh, th);
  _setInteractRects.push(_drawToggle(x, cy, w, rh, th, SET.haptic, 'haptic'));
  cy += rh + 2;
  _drawSep(x, cy, w, th); cy += 3;

  // Info
  ctx.save();
  ctx.font = `${isz}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.fillStyle = hexA(th.tg, 0.50);
  ctx.fillText('Le retour haptique nécessite un appareil compatible.', x + w / 2, cy);
  ctx.restore();
}

// ─── HIT TEST / INTERACTION ───────────────────────────────────────────────────
function handleSettingsTap(tx, ty) {
  // Back button
  if (_setBackRect && tx >= _setBackRect.x && tx < _setBackRect.x + _setBackRect.w &&
      ty >= _setBackRect.y && ty < _setBackRect.y + _setBackRect.h) {
    closeSettings();
    return;
  }
  // Tab switch
  for (let i = 0; i < _setTabRects.length; i++) {
    const r = _setTabRects[i];
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) {
      _settingsTab = r.tab;
      _setInteractRects = [];
      return;
    }
  }
  // Setting interactions
  for (let i = 0; i < _setInteractRects.length; i++) {
    const r = _setInteractRects[i];
    if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) {
      _applySettingTap(r, tx);
      return;
    }
  }
}

function handleSettingsDrag(tx, ty) {
  // Drag on sliders
  for (let i = 0; i < _setInteractRects.length; i++) {
    const r = _setInteractRects[i];
    if (r.type === 'slider' && tx >= r.x - 10 && tx < r.x + r.w + 10 &&
        ty >= r.y - 10 && ty < r.y + r.h + 10) {
      const t = cl((tx - r.sliderX) / r.sliderW, 0, 1);
      _applySliderValue(r.key, t);
      return;
    }
  }
}

function _applySettingTap(r, tx) {
  if (r.type === 'toggle') {
    _applyToggle(r.key);
  } else if (r.type === 'chip') {
    _applyChip(r.key, r.val);
  } else if (r.type === 'slider') {
    const t = cl((tx - r.sliderX) / r.sliderW, 0, 1);
    _applySliderValue(r.key, t);
  } else if (r.type === 'theme') {
    selTheme = r.val;
    if(!_IS_IOS) menuBg = buildBg(selTheme);
  } else if (r.type === 'skin') {
    selSkin = r.val;
  }
}

function _applyToggle(key) {
  switch (key) {
    case 'muteAll':
      SET.muteAll = !SET.muteAll;
      _saveSET('bp_mute', SET.muteAll ? '1' : '0');
      _applyAudioSettings();
      break;
    case 'sfxEnabled':
      if (typeof _soundEnabled !== 'undefined') {
        // eslint-disable-next-line no-global-assign
        _soundEnabled = !_soundEnabled;
      }
      break;
    case 'musicEnabled':
      if (typeof toggleMusic === 'function') toggleMusic();
      break;
    case 'showFPS':
      SET.showFPS = !SET.showFPS;
      _saveSET('bp_fps', SET.showFPS ? '1' : '0');
      break;
    case 'reducedMotion':
      SET.reducedMotion = !SET.reducedMotion;
      _saveSET('bp_reduced', SET.reducedMotion ? '1' : '0');
      break;
    case 'ghostPiece':
      SET.ghostPiece = !SET.ghostPiece;
      _saveSET('bp_ghost', SET.ghostPiece ? '1' : '0');
      break;
    case 'gridLines':
      SET.gridLines = !SET.gridLines;
      _saveSET('bp_gridlines', SET.gridLines ? '1' : '0');
      break;
    case 'haptic':
      SET.haptic = !SET.haptic;
      _saveSET('bp_haptic', SET.haptic ? '1' : '0');
      break;
  }
}

function _applyChip(key, val) {
  switch (key) {
    case 'particles':
      SET.particles = val;
      _saveSET('bp_particles', val);
      break;
    case 'shake':
      SET.shake = val;
      _saveSET('bp_shake', val);
      break;
    case 'autoSave':
      SET.autoSave = [0, 10, 30, 60][val] || 0;
      _saveSET('bp_autosave', SET.autoSave);
      break;
    case 'histDiff':
      SET.histDiff = val;
      _saveSET('bp_hdiff', val);
      break;
  }
}

function _applySliderValue(key, t) {
  switch (key) {
    case 'masterVol':
      if (typeof _volume !== 'undefined') {
        // eslint-disable-next-line no-global-assign
        _volume = t;
        try { localStorage.setItem('bp_volume', String(t)); } catch(e) {}
      }
      break;
    case 'sfxVol':
      SET.sfxVol = t;
      _saveSET('bp_sfx_vol', t);
      _applyAudioSettings();
      break;
    case 'musicVol':
      SET.musicVol = t;
      _saveSET('bp_music_vol', t);
      _applyAudioSettings();
      break;
    case 'touchSens':
      SET.touchSens = 0.5 + t * 1.5;
      _saveSET('bp_touch_sens', SET.touchSens);
      break;
    case 'dragOffset':
      SET.dragOffset = 0.5 + t * 2.5;
      _saveSET('bp_drag_off', SET.dragOffset);
      break;
  }
}

// Apply audio settings to the Web Audio bus
function _applyAudioSettings() {
  if (typeof _sfxBus === 'undefined' || !_sfxBus) return;
  try {
    const mute = SET.muteAll;
    _sfxBus.gain.value = mute ? 0 : SET.sfxVol;
    if (typeof _musicBus !== 'undefined' && _musicBus) {
      const _MV = typeof _MUSIC_VOL !== 'undefined' ? _MUSIC_VOL : 0.38;
      _musicBus.gain.value = mute ? 0 : SET.musicVol * _MV;
    }
  } catch(e) {}
}

// ─── FPS DISPLAY (called from loop for game state too) ────────────────────────
function drawFPSOverlay(ts) {
  if (!SET.showFPS) return;
  _tickFPS(ts);
  ctx.save();
  ctx.font = 'bold 13px system-ui,-apple-system,"SF Pro Display",Arial';
  ctx.fillStyle = '#00FF80'; ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.shadowColor = '#00FF80'; ctx.shadowBlur = 6;
  ctx.fillText(`FPS: ${_fpsDisplay}`, 6, 6);
  ctx.restore();
}

// ─── SETTINGS GEAR BUTTON (drawn from menu.js) ────────────────────────────────
let _settingsMenuRect = null;

function drawSettingsBtn(x, y, w, h, th) {
  const now = Date.now();
  const pulse = 0.5 + 0.5 * Math.sin(now * 0.003);
  ctx.save();
  ctx.shadowColor = th.tm; ctx.shadowBlur = 5 + 3 * pulse;
  const sbg = ctx.createLinearGradient(x, y, x, y + h);
  sbg.addColorStop(0, hexA(th.gbg, 0.92));
  sbg.addColorStop(1, hexA(th.bg, 0.85));
  rrect(ctx, x, y, w, h, 10, sbg, null);
  const ssh = ctx.createLinearGradient(x, y, x, y + h * 0.5);
  ssh.addColorStop(0, 'rgba(255,255,255,0.15)');
  ssh.addColorStop(1, 'rgba(255,255,255,0)');
  rp(ctx, x + 2, y + 2, w - 4, h * 0.5, 8); ctx.fillStyle = ssh; ctx.fill();
  rp(ctx, x, y, w, h, 10); ctx.strokeStyle = hexA(th.tm, 0.55); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = `${Math.floor(h * 0.58)}px system-ui,-apple-system,"SF Pro Display",Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('⚙', x + w / 2, y + h / 2);
  ctx.restore();
  _settingsMenuRect = { x, y, w, h };
}
