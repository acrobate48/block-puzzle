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

// ─── SVG BACKGROUND PRELOADER ─────────────────────────────────────────────
// Preloads SVG theme backgrounds from assets/backgrounds/.
// Used by drawGame/drawMenu as a high-quality replacement for procedural buildBg.
const _BG_NAMES=['bg_jungle','bg_desert','bg_ocean','bg_volcan','bg_nuit',
                 'bg_arctique','bg_cosmos','bg_enchante','bg_plage','bg_neopolis'];
const _bgImgs=new Array(10).fill(null);
const _bgReady=new Array(10).fill(false);
_BG_NAMES.forEach((name,i)=>{
  const img=new Image();
  img.onload=()=>{_bgImgs[i]=img;_bgReady[i]=true;};
  img.onerror=()=>{_bgReady[i]=false;};
  img.src=`assets/backgrounds/${name}.svg`;
});

// Draw background: use SVG if ready, else procedural canvas
function drawThemeBg(themeIdx,x,y,w,h){
  if(_bgReady[themeIdx]&&_bgImgs[themeIdx]){
    ctx.save();
    ctx.drawImage(_bgImgs[themeIdx],x,y,w||W,h||H);
    ctx.restore();
    return true;
  }
  return false;
}

// ─── VIDEO BACKGROUND PRELOADER ───────────────────────────────────────────
// Maps theme index → MP4 filename (themes that have animated videos)
// Index order matches _BG_NAMES: jungle=0,desert=1,ocean=2,volcan=3,nuit=4,
//   arctique=5,cosmos=6,enchante=7,plage=8,neopolis=9
const _BG_VIDEO_MAP={
  0:'bg_jungle',1:'bg_desert',2:'bg_ocean',3:'bg_volcan',4:'bg_nuit',
  5:'bg_arctique',6:'bg_cosmos',7:'bg_enchante',8:'bg_plage',9:'bg_neopolis'
};
const _bgVids=new Array(10).fill(null);
const _bgVidReady=new Array(10).fill(false);
(function _initBgVids(){
  Object.entries(_BG_VIDEO_MAP).forEach(([idxStr,name])=>{
    const i=+idxStr;
    const vid=document.createElement('video');
    vid.src=`assets/video/${name}.mp4`;
    vid.loop=true;vid.muted=true;vid.playsInline=true;vid.preload='auto';
    vid.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(vid);
    _bgVids[i]=vid;
    vid.addEventListener('canplaythrough',()=>{_bgVidReady[i]=true;vid.play().catch(()=>{});},{once:true});
    vid.load();
  });
})();

// Ensure video for current theme is playing (call when theme changes)
function _ensureVidPlaying(themeIdx){
  const vid=_bgVids[themeIdx];
  if(vid&&vid.paused&&_bgVidReady[themeIdx])vid.play().catch(()=>{});
}

// Draw video background: returns true if video was drawn
function drawThemeVideo(themeIdx,x,y,w,h){
  const vid=_bgVids[themeIdx];
  if(!vid||!_bgVidReady[themeIdx]||vid.readyState<2)return false;
  if(vid.paused)vid.play().catch(()=>{});
  ctx.save();
  ctx.drawImage(vid,x||0,y||0,w||W,h||H);
  ctx.restore();
  return true;
}

// ─── EVENT VIDEO OVERLAYS ─────────────────────────────────────────────────
// celebration.mp4, line_clear.mp4, game_logo_loop.mp4
const _EVT_VIDS={};
['celebration','line_clear','game_logo_loop'].forEach(name=>{
  const vid=document.createElement('video');
  vid.src=`assets/video/${name}.mp4`;
  vid.muted=true;vid.playsInline=true;vid.preload='auto';
  vid.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
  document.body.appendChild(vid);
  _EVT_VIDS[name]=vid;
});

// Trigger an event video from the start (non-looping by default)
function playEventVideo(name,loop){
  const vid=_EVT_VIDS[name];
  if(!vid)return;
  vid.loop=!!loop;vid.currentTime=0;
  vid.play().catch(()=>{});
}

// Draw an event video as a canvas overlay; returns true while active
function drawEventVideo(name,alpha,x,y,w,h){
  const vid=_EVT_VIDS[name];
  if(!vid||vid.paused||vid.ended||vid.readyState<2)return false;
  ctx.save();
  ctx.globalAlpha=alpha!=null?alpha:0.75;
  ctx.drawImage(vid,x||0,y||0,w||W,h||H);
  ctx.restore();
  return true;
}
