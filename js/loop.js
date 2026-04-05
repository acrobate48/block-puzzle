'use strict';
// ─── LOOP ─────────────────────────────────────────────────────────────────────
let _lastTs=0,_prevGameState='';
function loop(ts){
  // Cap delta to 100ms — prevents spiral-of-death after tab switch
  _lastTs=ts;
  // Game-start sound on transition into playing
  if(gameState==='playing'&&_prevGameState!=='playing'){
    if(typeof sndStart==='function')sndStart();
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
