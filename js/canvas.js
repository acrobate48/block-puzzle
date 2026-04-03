'use strict';
// ─── CANVAS ───────────────────────────────────────────────────────────────────
const canvas=document.getElementById('c');
const ctx=canvas.getContext('2d');
let W,H,CELL,GRID_X,GRID_Y,GW,GH,TRAY_Y,TRAY_H,PIECE_CELL,CR;

function resize(){
  W=window.innerWidth;H=window.innerHeight;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);
  canvas.style.width=W+'px';canvas.style.height=H+'px';
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const portrait=H>W;
  CELL=portrait?Math.floor((W-14)/COLS):Math.floor((H-52)/ROWS);
  CR=Math.max(3,CELL/7|0);
  GW=CELL*COLS;GH=CELL*ROWS;
  GRID_X=portrait?((W-GW)/2)|0:(W*0.06)|0;
  TRAY_H=Math.max((CELL*2.1)|0,68);
  const top=portrait?52:0;
  GRID_Y=portrait?top+Math.max(((H-top-GH-TRAY_H-14)/2)|0,0):((H-GH)/2)|0;
  if(GRID_Y<top)GRID_Y=top;
  TRAY_Y=GRID_Y+GH+6;
  PIECE_CELL=Math.floor(CELL*0.58);
  CELL_CACHE.clear();
}
let _resizeTimer=null;
window.addEventListener('resize',()=>{clearTimeout(_resizeTimer);_resizeTimer=setTimeout(()=>{resize();menuBg=buildBg(selTheme);},100);},false);
resize();
