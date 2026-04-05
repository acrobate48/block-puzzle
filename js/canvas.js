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
['celebration','line_clear','game_logo_loop','milestone_1k','milestone_5k','milestone_10k','milestone_50k','milestone_100k','perfect_clear','new_record','bomb_explode'].forEach(name=>{
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

// ─── THEME ICON PRELOADER ─────────────────────────────────────────────────────
const _themeIconImgs=new Array(10).fill(null);
_THEME_NAMES.forEach((name,i)=>{const img=new Image();img.onload=()=>{_themeIconImgs[i]=img;};img.src=`assets/themes/${name}/icon.svg`;});
function drawThemeIcon(themeIdx,x,y,w,h){
  const img=_themeIconImgs[themeIdx];if(!img)return false;
  ctx.save();ctx.drawImage(img,x,y,w||80,h||56);ctx.restore();return true;
}

// ─── HUD BORDER PRELOADER ─────────────────────────────────────────────────────
const _hudBorderImgs=new Array(10).fill(null);
_THEME_NAMES.forEach((name,i)=>{const img=new Image();img.onload=()=>{_hudBorderImgs[i]=img;};img.src=`assets/themes/${name}/hud_border.svg`;});
function drawHudBorder(themeIdx,x,y,w,h){
  const img=_hudBorderImgs[themeIdx];if(!img)return false;
  ctx.save();ctx.drawImage(img,x,y,w,h||20);ctx.restore();return true;
}

// ─── GRID CORNER PRELOADER ────────────────────────────────────────────────────
const _gridCornerImgs=new Array(10).fill(null);
_THEME_NAMES.forEach((name,i)=>{const img=new Image();img.onload=()=>{_gridCornerImgs[i]=img;};img.src=`assets/themes/${name}/grid_corners.svg`;});
function drawGridCorner(themeIdx,cx,cy,sz,rot){
  const img=_gridCornerImgs[themeIdx];if(!img)return false;
  ctx.save();ctx.translate(cx,cy);if(rot)ctx.rotate(rot);
  ctx.drawImage(img,0,0,sz,sz);ctx.restore();return true;
}

// ─── SKIN PREVIEW PRELOADER ───────────────────────────────────────────────────
const _SKIN_NAMES_DIR=['pierre','cristal','bois','metal','marbre','candy','glace','feu','neon','galaxie'];
const _skinPreviewImgs=new Array(10).fill(null);
_SKIN_NAMES_DIR.forEach((name,i)=>{const img=new Image();img.onload=()=>{_skinPreviewImgs[i]=img;};img.src=`assets/skins/${name}/preview.svg`;});
function drawSkinPreview(skinIdx,x,y,w,h){
  const img=_skinPreviewImgs[skinIdx];if(!img)return false;
  ctx.save();ctx.drawImage(img,x,y,w,h);ctx.restore();return true;
}

// ─── ACHIEVEMENT ICON PRELOADER ───────────────────────────────────────────────
const _achieveImgs=new Array(10).fill(null);
for(let _ai=0;_ai<10;_ai++){const img=new Image();const _idx=_ai;img.onload=()=>{_achieveImgs[_idx]=img;};img.src=`assets/ui/achievement_${_ai+1}.svg`;}

// ─── TROPHY / MEDAL PRELOADERS ────────────────────────────────────────────────
const _trophyImgs={};
['1k','5k','10k','50k','100k'].forEach(n=>{const img=new Image();img.onload=()=>{_trophyImgs[n]=img;};img.src=`assets/ui/trophy_${n}.svg`;});
const _medalImgs={};
['gold','silver','bronze'].forEach(n=>{const img=new Image();img.onload=()=>{_medalImgs[n]=img;};img.src=`assets/ui/medal_${n}.svg`;});

// ─── THEME TRANSITION VIDEO ───────────────────────────────────────────────────
const _transVids=new Array(10).fill(null);const _transVidReady=new Array(10).fill(false);
(function(){_THEME_NAMES.forEach((name,i)=>{
  const vid=document.createElement('video');
  vid.src=`assets/themes/${name}/transition.mp4`;
  vid.muted=true;vid.playsInline=true;vid.preload='auto';
  vid.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
  document.body.appendChild(vid);_transVids[i]=vid;
  vid.addEventListener('canplaythrough',()=>{_transVidReady[i]=true;},{once:true});
  vid.load();
});})();
let _transActive=false,_transTheme=0,_transBorn=0;
const _TRANS_DUR=2000;
function playThemeTransition(themeIdx){
  const vid=_transVids[themeIdx];if(!vid)return;
  vid.currentTime=0;vid.play().catch(()=>{});
  _transActive=true;_transTheme=themeIdx;_transBorn=Date.now();
}
function drawThemeTransition(){
  if(!_transActive)return false;
  const p=(Date.now()-_transBorn)/_TRANS_DUR;
  if(p>=1){_transActive=false;return false;}
  const vid=_transVids[_transTheme];
  if(!vid||vid.readyState<2){if(p>=1)_transActive=false;return false;}
  const alpha=p<0.5?p*2:2-p*2;
  ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(vid,0,0,W,H);ctx.restore();
  return true;
}

// ─── GAMEOVER VIDEO ───────────────────────────────────────────────────────────
const _gameoverVids=new Array(10).fill(null);const _gameoverVidReady=new Array(10).fill(false);
(function(){_THEME_NAMES.forEach((name,i)=>{
  const vid=document.createElement('video');
  vid.src=`assets/themes/${name}/gameover.mp4`;
  vid.loop=true;vid.muted=true;vid.playsInline=true;vid.preload='auto';
  vid.style.cssText='position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;pointer-events:none;';
  document.body.appendChild(vid);_gameoverVids[i]=vid;
  vid.addEventListener('canplaythrough',()=>{_gameoverVidReady[i]=true;},{once:true});
  vid.load();
});})();
function startGameoverVideo(themeIdx){const vid=_gameoverVids[themeIdx];if(vid){vid.currentTime=0;vid.play().catch(()=>{});}}
function stopGameoverVideo(themeIdx){const vid=_gameoverVids[themeIdx];if(vid)vid.pause();}
function drawGameoverVideo(themeIdx,alpha,x,y,w,h){
  const vid=_gameoverVids[themeIdx];
  if(!vid||!_gameoverVidReady[themeIdx]||vid.readyState<2)return false;
  if(vid.paused)vid.play().catch(()=>{});
  ctx.save();ctx.globalAlpha=alpha!=null?alpha:0.55;
  ctx.drawImage(vid,x||0,y||0,w||W,h||H);ctx.restore();return true;
}
