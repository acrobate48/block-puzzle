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

// ─── THEME ASSET PATHS ────────────────────────────────────────────────────────
// All theme assets are organised in assets/themes/[name]/ : bg.svg, bg.mp4
// Index order matches THEMES[]: 0=jungle,1=desert,2=ocean,3=volcan,4=nuit,
//   5=arctique,6=cosmos,7=enchante,8=plage,9=neopolis
const _THEME_NAMES=['jungle','desert','ocean','volcan','nuit','arctique','cosmos','enchante','plage','neopolis'];

// ─── SVG BACKGROUND PRELOADER ─────────────────────────────────────────────────
const _bgImgs=new Array(10).fill(null);
const _bgReady=new Array(10).fill(false);
_THEME_NAMES.forEach((name,i)=>{
  const img=new Image();
  img.onload=()=>{_bgImgs[i]=img;_bgReady[i]=true;};
  img.onerror=()=>{
    // Fallback: try legacy flat path assets/backgrounds/bg_name.svg
    const img2=new Image();
    img2.onload=()=>{_bgImgs[i]=img2;_bgReady[i]=true;};
    img2.src=`assets/backgrounds/bg_${name}.svg`;
  };
  img.src=`assets/themes/${name}/bg.svg`;
});

function drawThemeBg(themeIdx,x,y,w,h){
  if(_bgReady[themeIdx]&&_bgImgs[themeIdx]){
    ctx.save();
    ctx.drawImage(_bgImgs[themeIdx],x||0,y||0,w||W,h||H);
    ctx.restore();
    return true;
  }
  return false;
}

// ─── VIDEO BACKGROUND PRELOADER ───────────────────────────────────────────────
const _bgVids=new Array(10).fill(null);
const _bgVidReady=new Array(10).fill(false);
(function _initBgVids(){
  _THEME_NAMES.forEach((name,i)=>{
    const vid=document.createElement('video');
    // Try new per-theme path first; fallback handled via onerror → src swap
    vid.src=`assets/themes/${name}/bg.mp4`;
    vid.loop=true;vid.muted=true;vid.playsInline=true;vid.preload='auto';
    vid.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
    document.body.appendChild(vid);
    _bgVids[i]=vid;
    vid.addEventListener('canplaythrough',()=>{_bgVidReady[i]=true;vid.play().catch(()=>{});},{once:true});
    vid.addEventListener('error',()=>{
      // Fallback to legacy flat path
      const vid2=document.createElement('video');
      vid2.src=`assets/video/bg_${name}.mp4`;
      vid2.loop=true;vid2.muted=true;vid2.playsInline=true;vid2.preload='auto';
      vid2.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
      document.body.appendChild(vid2);
      _bgVids[i]=vid2;
      vid2.addEventListener('canplaythrough',()=>{_bgVidReady[i]=true;vid2.play().catch(()=>{});},{once:true});
      vid2.load();
    },{once:true});
    vid.load();
  });
})();

function _ensureVidPlaying(themeIdx){
  const vid=_bgVids[themeIdx];
  if(vid&&vid.paused&&_bgVidReady[themeIdx])vid.play().catch(()=>{});
}

function drawThemeVideo(themeIdx,x,y,w,h){
  const vid=_bgVids[themeIdx];
  if(!vid||!_bgVidReady[themeIdx]||vid.readyState<2)return false;
  if(vid.paused)vid.play().catch(()=>{});
  ctx.save();
  ctx.drawImage(vid,x||0,y||0,w||W,h||H);
  ctx.restore();
  return true;
}

// ─── EVENT VIDEO OVERLAYS ─────────────────────────────────────────────────────
const _EVT_VIDS={};
['celebration','line_clear','game_logo_loop'].forEach(name=>{
  const vid=document.createElement('video');
  vid.src=`assets/video/${name}.mp4`;
  vid.muted=true;vid.playsInline=true;vid.preload='auto';
  vid.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
  document.body.appendChild(vid);
  _EVT_VIDS[name]=vid;
});

function playEventVideo(name,loop){
  const vid=_EVT_VIDS[name];
  if(!vid)return;
  vid.loop=!!loop;vid.currentTime=0;
  vid.play().catch(()=>{});
}

function drawEventVideo(name,alpha,x,y,w,h){
  const vid=_EVT_VIDS[name];
  if(!vid||vid.paused||vid.ended||vid.readyState<2)return false;
  ctx.save();
  ctx.globalAlpha=alpha!=null?alpha:0.75;
  ctx.drawImage(vid,x||0,y||0,w||W,h||H);
  ctx.restore();
  return true;
}
