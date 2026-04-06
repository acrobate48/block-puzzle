'use strict';
// ─── LOOP ─────────────────────────────────────────────────────────────────────
let _lastTs=0,_prevGameState='';
let _fpsFrames=0,_fpsSec=Date.now(),_fpsVal=60;
// Auto low-perf mode: disable shadowBlur globally when FPS < 42 for 3s
let _lowPerfStrikes=0,_lowPerfActive=false;
var _lowPerf=false; // var so it's accessible from all scripts
function loop(ts){
  // Skip frames arriving faster than 120fps — reduces unnecessary GPU work on high-refresh displays
  if(ts-_lastTs<8){requestAnimationFrame(loop);return;}
  _lastTs=ts;
  // Cap particle arrays — prevents memory accumulation on long sessions (critical on iOS)
  if(typeof particles!=='undefined'&&particles.length>200)particles.splice(0,particles.length-200);
  if(typeof debris!=='undefined'&&debris.length>150)debris.splice(0,debris.length-150);
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
  try{
    if(gameState==='menu')drawMenu(ts);
    else if(gameState==='modeselect')drawModeSelect(ts);
    else if(gameState==='leaderboard')drawLeaderboard(ts);
    else if(gameState==='pause'){drawGame(ts);drawPause(ts);}
    else drawGame(ts);
  }catch(e){if(typeof _d==='function')_d('RENDER ERR: '+e.message+' state='+gameState);console.error('[BlockPuzzle] render error:',e);}
  // FPS counter (debug mode only)
  _fpsFrames++;
  if(Date.now()-_fpsSec>=1000){
    _fpsVal=_fpsFrames;_fpsFrames=0;_fpsSec=Date.now();
    // Auto low-perf: 3 consecutive seconds under 42fps → disable shadowBlur globally
    if(_fpsVal<42){_lowPerfStrikes++;if(_lowPerfStrikes>=3&&!_lowPerfActive){_lowPerfActive=true;_lowPerf=true;try{Object.defineProperty(ctx,'shadowBlur',{get:()=>0,set:()=>{},configurable:true});Object.defineProperty(ctx,'shadowColor',{get:()=>'transparent',set:()=>{},configurable:true});}catch(e){}}}else{_lowPerfStrikes=0;}
  }
  if(localStorage.getItem('bp_debug')==='1'){
    ctx.save();ctx.font='bold 11px monospace';ctx.fillStyle='rgba(255,255,0,0.8)';
    ctx.textAlign='right';ctx.textBaseline='top';ctx.fillText(`${_fpsVal}fps`,W-4,4);ctx.restore();
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
