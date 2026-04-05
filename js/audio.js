'use strict';
// ─── AUDIO & HAPTIC FEEDBACK ──────────────────────────────────────────────────
// All sounds synthesized via Web Audio API — no external files required

let _ac = null;
let _soundEnabled = true;
let _musicEnabled = true;
let _volume = 0.7;
// _musicVolume is the relative music/SFX balance (not user-facing)
const _MUSIC_VOL = 0.38;

// Persist prefs
try { const _sv = parseFloat(localStorage.getItem('bp_volume')); if (!isNaN(_sv)) _volume = Math.max(0, Math.min(1, _sv)); } catch(e) {}
try { if (localStorage.getItem('bp_music') === '0') _musicEnabled = false; } catch(e) {}

function _getAC() {
  if (!_ac) try { _ac = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
  return _ac;
}

// ─── BUS ARCHITECTURE ────────────────────────────────────────────────────────
// masterGain (pass-through, gain=1) → destination
//   sfxBus  → masterGain   (SFX at full volume, _volume applied per-note)
//   musicBus → masterGain  (music at _MUSIC_VOL fraction of _volume)
let _masterGain = null, _sfxBus = null, _musicBus = null;

function _getBus() {
  const ac = _getAC();
  if (!ac) return null;
  if (ac.state === 'suspended') ac.resume().catch(() => {});
  if (!_masterGain) {
    _masterGain = ac.createGain();
    _masterGain.gain.value = 1.0;
    _masterGain.connect(ac.destination);
    _sfxBus = ac.createGain();
    _sfxBus.gain.value = 1.0;
    _sfxBus.connect(_masterGain);
    _musicBus = ac.createGain();
    _musicBus.gain.value = _musicEnabled ? _MUSIC_VOL : 0;
    _musicBus.connect(_masterGain);
  }
  return { ac, sfx: _sfxBus, music: _musicBus };
}

// ─── HAPTICS ─────────────────────────────────────────────────────────────────
function _vib(pattern) {
  try { if (navigator.vibrate) navigator.vibrate(pattern); } catch(e) {}
}

// ─── SYNTHESIS PRIMITIVES ────────────────────────────────────────────────────

// Oscillator with ADSR envelope + optional pitch ramp
// freqRamp: [{dt, f}] — pitch keyframes relative to start time
function _osc(freq, dur, type, vol, delay, dest, ac, freqRamp, detune) {
  try {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type || 'sine';
    o.frequency.value = freq;
    if (detune) o.detune.value = detune;
    o.connect(g);
    g.connect(dest);
    const t = ac.currentTime + (delay || 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol * _volume, t + 0.010);
    if (freqRamp) freqRamp.forEach(({dt, f}) => o.frequency.linearRampToValueAtTime(f, t + dt));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.start(t);
    o.stop(t + dur + 0.06);
  } catch(e) {}
}

// 2-operator FM synthesis — carrier + modulator
function _fm(carrier, modRatio, modIndex, dur, vol, delay, dest, ac) {
  try {
    const modFreq = carrier * modRatio;
    const mod = ac.createOscillator();
    const modG = ac.createGain();
    const car = ac.createOscillator();
    const outG = ac.createGain();
    mod.frequency.value = modFreq;
    modG.gain.value = modFreq * modIndex;
    car.frequency.value = carrier;
    car.type = 'sine';
    mod.connect(modG);
    modG.connect(car.frequency);
    car.connect(outG);
    outG.connect(dest);
    const t = ac.currentTime + (delay || 0);
    outG.gain.setValueAtTime(0.0001, t);
    outG.gain.linearRampToValueAtTime(vol * _volume, t + 0.010);
    outG.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    mod.start(t); mod.stop(t + dur + 0.06);
    car.start(t); car.stop(t + dur + 0.06);
  } catch(e) {}
}

// Bandpass-filtered white noise burst (percussive click/snap transient)
function _noise(dur, cutoff, vol, delay, dest, ac) {
  try {
    const bufLen = Math.ceil(ac.sampleRate * Math.min(dur + 0.05, 1.0));
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    const filt = ac.createBiquadFilter();
    filt.type = 'bandpass';
    filt.frequency.value = cutoff;
    filt.Q.value = 1.8;
    const g = ac.createGain();
    const t = ac.currentTime + (delay || 0);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol * _volume, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(dest);
    src.start(t);
    src.stop(t + dur + 0.06);
  } catch(e) {}
}

// Safe write to global visual state (state.js loaded after audio.js)
function _setFlash(strength, col) {
  try {
    if (typeof screenFlash !== 'undefined') {
      // eslint-disable-next-line no-undef
      screenFlash = Math.max(screenFlash, strength);
      // eslint-disable-next-line no-undef
      if (col) screenFlashCol = col;
    }
  } catch(e) {}
}
function _setShake(amt, pow) {
  try {
    if (typeof shake !== 'undefined') {
      // eslint-disable-next-line no-undef
      shake = Math.max(shake, amt);
      // eslint-disable-next-line no-undef
      shakePow = Math.max(shakePow, pow);
    }
  } catch(e) {}
}

// ─── SOUND EFFECTS ───────────────────────────────────────────────────────────

// Block placement: satisfying snap with bass thump
function sndPlace() {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  // Bass thump — sine with rapid pitch drop
  _osc(95, 0.14, 'sine', 0.20, 0, sfx, ac, [{dt: 0.03, f: 48}, {dt: 0.14, f: 28}]);
  // Click transient — high bandpass noise
  _noise(0.032, 2500, 0.14, 0, sfx, ac);
  // Snap tick — clipped square pulse
  _osc(1050, 0.022, 'square', 0.050, 0.002, sfx, ac);
  _vib(15);
}

// Line clear: ascending chime sequence — pitch and count scale with lines cleared
function sndClear(n) {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  // Pentatonic scale ascending from C5
  const scale = [523.25, 659.26, 783.99, 880.00, 1046.50, 1318.51];
  const count = Math.min(n + 1, scale.length);
  for (let i = 0; i < count; i++) {
    const f = scale[i];
    // FM bell tone — metallic with shimmer
    _fm(f, 3.1, 0.95, 0.42 - i * 0.01, 0.20, i * 0.075, sfx, ac);
    // Octave shimmer layer
    _osc(f * 2, 0.15, 'sine', 0.048, i * 0.075 + 0.018, sfx, ac);
  }
  // Sub-bass punch reinforces impact on 2+ lines
  if (n >= 2) {
    _osc(58, 0.24, 'sine', 0.26, 0, sfx, ac, [{dt: 0.05, f: 28}]);
  }
  // Audio-visual sync: flash strength and color scale with lines cleared
  _setFlash(80 + n * 55, n >= 3 ? '#80FFFF' : '#FFFFFF');
  _vib(n >= 3 ? [50, 20, 50, 20, 80] : n >= 2 ? [35, 15, 35] : [25, 10, 25]);
}

// Legacy alias (called from game.js when 4 lines cleared at once)
function sndClear4() { sndClear(4); }

// Combo: triumphant chord arpeggio — grows with combo count
function sndCombo(c) {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  // C major pentatonic chord roots: C4 E4 G4 B4 D5
  const roots = [261.63, 329.63, 392.00, 493.88, 587.33];
  const count = Math.min(c, 5);
  for (let i = 0; i < count; i++) {
    const root = roots[i];
    // FM chord voice — warm and triumphant
    _fm(root, 2.0, 1.05, 0.28, 0.17 + i * 0.02, i * 0.085, sfx, ac);
    // Just-tuned 5th for richness
    _osc(root * 1.498, 0.22, 'triangle', 0.075 + i * 0.01, i * 0.085 + 0.03, sfx, ac);
    // High shimmer sparkle on strong combos
    if (c >= 4) _osc(root * 3, 0.10, 'sine', 0.032, i * 0.085 + 0.06, sfx, ac);
  }
  // Audio-visual sync
  if (c >= 3) _setFlash(105 + c * 20, '#FFD700');
  if (c >= 4) _setShake(3 + c, 1 + (c > 5 ? 2 : 0));
  _vib(c >= 4 ? [30, 15, 30, 15, 60] : [40]);
}

// Game over: dramatic descending sweep + low rumble
function sndGameOver() {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  // Three cascading descending sawtooth sweeps
  _osc(220, 0.55, 'sawtooth', 0.22, 0, sfx, ac, [{dt: 0.10, f: 185}, {dt: 0.55, f: 72}]);
  _osc(165, 0.65, 'sawtooth', 0.17, 0.30, sfx, ac, [{dt: 0.12, f: 130}, {dt: 0.65, f: 52}]);
  _osc(110, 0.75, 'sawtooth', 0.12, 0.65, sfx, ac, [{dt: 0.14, f: 85}, {dt: 0.75, f: 36}]);
  // Sub rumble reinforces finality
  _noise(0.70, 105, 0.09, 0.28, sfx, ac);
  // Stop background music
  stopMusic();
  // Dramatic flash + shake
  _setFlash(200, '#FF2020');
  _setShake(18, 6);
  _vib([80, 40, 80, 40, 120]);
}

// Milestone / bonus reward sparkle
function sndBonus() {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  _fm(660, 2.2, 0.72, 0.14, 0.17, 0, sfx, ac);
  _fm(880, 2.2, 0.68, 0.16, 0.15, 0.10, sfx, ac);
  _fm(1100, 2.0, 0.62, 0.20, 0.19, 0.20, sfx, ac);
  _vib([20, 10, 20]);
}

// Game start fanfare — rising 4-note stab
function sndStart() {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  const fanfare = [261.63, 329.63, 392.00, 523.25];
  fanfare.forEach((f, i) => {
    _fm(f, 2.5, 1.0, 0.22, 0.15 + i * 0.02, i * 0.108, sfx, ac);
    _osc(f * 2, 0.10, 'triangle', 0.042, i * 0.108, sfx, ac);
  });
  // Start ambient music after fanfare settles
  stopMusic();
  setTimeout(() => startMusic(), 580);
  _vib([20, 10, 20, 10, 40]);
}

// Subtle menu/UI interaction click
function sndMenu() {
  if (!_soundEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, sfx } = b;
  _noise(0.026, 2900, 0.065, 0, sfx, ac);
  _osc(680, 0.032, 'sine', 0.042, 0.003, sfx, ac);
}

// ─── BACKGROUND MUSIC ─────────────────────────────────────────────────────────
// Procedural lo-fi ambient pads + pentatonic arpeggio + beat-synced screen pulse

// Pentatonic scale — C2 through A5 (spread for pad/arp layering)
const _PENTA = [130.81, 164.81, 196.00, 220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 523.25];

// Chord voicings: indices into _PENTA (I, V, Asus, Am)
const _CHORDS = [
  [4, 6, 7, 9],  // C  E  G  C5  (I major)
  [7, 9, 4, 6],  // G  C5 E  G   (V)
  [4, 5, 7, 9],  // C  D  G  C5  (suspended)
  [6, 7, 9, 4],  // E  G  C5 C   (vi relative)
];

let _music = {
  running: false,
  padTid:  0,
  arpTid:  0,
  beatTid: 0,
  bpm:     70,
  intensity: 0, // 0 = calm/zen, 1 = intense/high-score
  chord:   0,
};

// Build and schedule a pad layer voice
function _musicPad() {
  if (!_music.running || !_musicEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, music } = b;
  const chord = _CHORDS[_music.chord % _CHORDS.length];
  const barSec = (60 / _music.bpm) * 4; // one bar in seconds
  const baseVol = (0.026 + _music.intensity * 0.018) * _volume;
  const lp = 800 + _music.intensity * 900; // LP cutoff adapts to intensity

  chord.forEach((idx, i) => {
    try {
      const freq = _PENTA[idx % _PENTA.length];
      const tOffset = i * 0.065; // gentle stagger

      // Sub pad — half frequency, very soft
      const oSub = ac.createOscillator();
      const fSub = ac.createBiquadFilter();
      const gSub = ac.createGain();
      oSub.type = 'sine';
      oSub.frequency.value = freq * 0.5;
      fSub.type = 'lowpass';
      fSub.frequency.value = 380;
      const tSub = ac.currentTime + tOffset;
      const durSub = barSec * 1.65;
      gSub.gain.setValueAtTime(0, tSub);
      gSub.gain.linearRampToValueAtTime(baseVol * 0.65, tSub + 0.18);
      gSub.gain.setValueAtTime(baseVol * 0.65, tSub + durSub - 0.30);
      gSub.gain.linearRampToValueAtTime(0, tSub + durSub);
      oSub.connect(fSub); fSub.connect(gSub); gSub.connect(music);
      oSub.start(tSub); oSub.stop(tSub + durSub + 0.1);

      // Main pad — triangle, slight detune per voice for warmth
      const oPad = ac.createOscillator();
      const fPad = ac.createBiquadFilter();
      const gPad = ac.createGain();
      oPad.type = 'triangle';
      oPad.frequency.value = freq;
      oPad.detune.value = (i % 2 === 0 ? 4 : -4) + _music.intensity * 6;
      fPad.type = 'lowpass';
      fPad.frequency.value = lp;
      fPad.Q.value = 0.5;
      const tPad = ac.currentTime + tOffset;
      const durPad = barSec * 1.65;
      gPad.gain.setValueAtTime(0, tPad);
      gPad.gain.linearRampToValueAtTime(baseVol, tPad + 0.22);
      gPad.gain.setValueAtTime(baseVol, tPad + durPad - 0.35);
      gPad.gain.linearRampToValueAtTime(0, tPad + durPad);
      oPad.connect(fPad); fPad.connect(gPad); gPad.connect(music);
      oPad.start(tPad); oPad.stop(tPad + durPad + 0.1);
    } catch(e) {}
  });

  // Advance to next chord every 2 bars
  _music.padTid = setTimeout(() => {
    _music.chord = (_music.chord + 1) % _CHORDS.length;
    _musicPad();
  }, barSec * 2 * 1000);
}

// Pentatonic arpeggiator — runs above the pads
function _musicArp() {
  if (!_music.running || !_musicEnabled) return;
  const b = _getBus(); if (!b) return;
  const { ac, music } = b;
  const chord = _CHORDS[_music.chord % _CHORDS.length];
  const beatMs = 60000 / _music.bpm;
  // Up/down pentatonic pattern with some jumps
  const pat = [0, 1, 2, 3, 2, 1, 0, 2, 1, 3, 0, 2];
  let step = 0;

  function tick() {
    if (!_music.running || !_musicEnabled) return;
    const idx = chord[pat[step % pat.length]];
    const freq = _PENTA[idx % _PENTA.length] * 2; // one octave above pad
    const vol = (0.012 + _music.intensity * 0.010) * _volume;
    const dur = (beatMs / 1000) * 0.52;

    try {
      const o = ac.createOscillator();
      const filt = ac.createBiquadFilter();
      const g = ac.createGain();
      o.type = 'triangle';
      o.frequency.value = freq;
      filt.type = 'bandpass';
      filt.frequency.value = freq * 1.4;
      filt.Q.value = 1.8;
      const t = ac.currentTime;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.014);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(filt); filt.connect(g); g.connect(music);
      o.start(t); o.stop(t + dur + 0.05);
    } catch(e2) {}

    step++;
    // Slight swing: every other note slightly delayed
    const swing = step % 2 === 0 ? beatMs * 0.47 : beatMs * 0.53;
    _music.arpTid = setTimeout(tick, swing);
  }

  tick();
}

// Beat pulse — fires every quarter note, optionally triggers screen sync
function _musicBeat() {
  if (!_music.running || !_musicEnabled) return;
  const beatMs = 60000 / _music.bpm;

  function tick() {
    if (!_music.running) return;
    // Subtle on-beat screen pulse (only when actively playing, not menu/gameover)
    try {
      if (typeof gameState !== 'undefined' && gameState === 'playing' &&
          typeof over !== 'undefined' && !over &&
          typeof screenFlash !== 'undefined' && screenFlash < 18) {
        screenFlash = 14;
        if (!screenFlashCol || screenFlashCol === '#fff') screenFlashCol = '#ffffff';
      }
    } catch(e) {}
    _music.beatTid = setTimeout(tick, beatMs);
  }

  tick();
}

// Start procedural music (called by sndStart and toggleMusic)
function startMusic() {
  if (_music.running) return;
  const b = _getBus(); if (!b) return;
  _music.running = true;
  _music.chord = 0;
  _musicPad();
  setTimeout(() => _musicArp(), 120);
  _musicBeat();
}

// Stop all music (called by sndGameOver and toggleMusic)
function stopMusic() {
  _music.running = false;
  clearTimeout(_music.padTid);
  clearTimeout(_music.arpTid);
  clearTimeout(_music.beatTid);
}

// Adapt music intensity to game state (0=calm/zen, 1=intense)
// Call this from game logic when score crosses thresholds or mode changes
function setMusicIntensity(v) {
  _music.intensity = Math.max(0, Math.min(1, v));
  _music.bpm = Math.round(62 + _music.intensity * 30); // 62–92 bpm
}

// Toggle background music on/off
function toggleMusic() {
  _musicEnabled = !_musicEnabled;
  try { localStorage.setItem('bp_music', _musicEnabled ? '1' : '0'); } catch(e) {}
  if (_musicBus) {
    const ac = _getAC();
    if (ac) _musicBus.gain.setTargetAtTime(_musicEnabled ? _MUSIC_VOL : 0, ac.currentTime, 0.3);
  }
  if (_musicEnabled && !_music.running) startMusic();
  else if (!_musicEnabled) stopMusic();
}

// ─── LEGACY RECTS (read/written by menu.js, game.js, input.js) ───────────────
let _soundRect = null, _pauseHudRect = null, _pauseBtns = {}, _pauseStartTime = 0;
let _volumeSliderRect = null;
