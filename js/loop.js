'use strict';
// ─── LOOP ─────────────────────────────────────────────────────────────────────
function loop(ts){
  ctx.clearRect(0,0,W,H);
  if(gameState==='menu')drawMenu(ts);
  else if(gameState==='modeselect')drawModeSelect(ts);
  else if(gameState==='leaderboard')drawLeaderboard(ts);
  else if(gameState==='pause'){drawGame(ts);drawPause(ts);}
  else drawGame(ts);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
