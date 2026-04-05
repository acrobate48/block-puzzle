'use strict';
// ─── LOOP ─────────────────────────────────────────────────────────────────────
let _lastTs=0,_prevGameState='';
function loop(ts){
  // Skip frames arriving faster than 120fps — reduces unnecessary GPU work on high-refresh displays
  if(ts-_lastTs<8){requestAnimationFrame(loop);return;}
  _lastTs=ts;
  // Game-start sound on transition into playing
  if(gameState==='playing'&&_prevGameState!=='playing'){
    if(typeof sndStart==='function')sndStart();
  }
  // Adapt music intensity to score and mode (cheap — just sets numbers)
  if(gameState==='playing'&&typeof setMusicIntensity==='function'){
    const _zen=(typeof currentMode!=='undefined'&&currentMode==='zen');
    const _intensity=_zen?0.08:Math.min(1,(typeof score!=='undefined'?score:0)/25000);
    setMusicIntensity(_intensity);
  }
  _prevGameState=gameState;
  ctx.clearRect(0,0,W,H);
  if(gameState==='menu')drawMenu(ts);
  else if(gameState==='modeselect')drawModeSelect(ts);
  else if(gameState==='leaderboard')drawLeaderboard(ts);
  else if(gameState==='pause'){drawGame(ts);drawPause(ts);}
  else drawGame(ts);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
