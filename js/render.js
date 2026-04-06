'use strict';
// ─── UI ASSET PRELOADER ──────────────────────────────────────────────────────
// Preloads SVG icons from assets/ui/ for hardware-accelerated canvas drawing.
// Falls back to canvas-drawn versions if image fails to load.
const _UI={};
['bomb','star','x2','trophy','combo_fire','lightning','skull','heart'].forEach(n=>{
  const img=new Image();
  img.onload=()=>{_UI[n]=img;};
  img.src=`assets/ui/${n}.svg`;
});
// Fast draw: use preloaded image or fallback to canvas
function _drawUiIcon(ctx,name,cx,cy,sz){
  if(_UI[name]){ctx.drawImage(_UI[name],cx-sz/2,cy-sz/2,sz,sz);}
}
// ─── LEGACY ICON LOADER ───────────────────────────────────────────────────────
const _uiIcons={};
const _uiIconsReady={};
function _loadIcon(name,path){
  const img=new Image();
  img.onload=()=>{_uiIcons[name]=img;_uiIconsReady[name]=true;};
  img.onerror=()=>{_uiIconsReady[name]=false;};
  img.src=path;
}
_loadIcon('bomb','assets/ui/bomb.svg');
_loadIcon('star','assets/ui/star.svg');
_loadIcon('x2','assets/ui/x2.svg');
_loadIcon('fire','assets/ui/fire.svg');
_loadIcon('trophy','assets/ui/trophy.svg');
// ─── UTILS ───────────────────────────────────────────────────────────────────
function hr(h){return parseInt(h.slice(1,3),16)}
function hg(h){return parseInt(h.slice(3,5),16)}
function hb(h){return parseInt(h.slice(5,7),16)}
function rgb(r,g,b){return`rgb(${r|0},${g|0},${b|0})`}
function rgba(r,g,b,a){return`rgba(${r|0},${g|0},${b|0},${+a.toFixed(3)})`}
function hexA(h,a){return rgba(hr(h),hg(h),hb(h),a)}
function cl(v,lo,hi){return v<lo?lo:v>hi?hi:v}
function lerp(a,b,t){return a+(b-a)*t}
function lerpC(c1,c2,t){return rgb(lerp(hr(c1),hr(c2),t),lerp(hg(c1),hg(c2),t),lerp(hb(c1),hb(c2),t))}
function rnd(lo,hi){return lo+Math.random()*(hi-lo)}
function rndI(lo,hi){return lo+(Math.random()*(hi-lo+1))|0}
function rndc(a){return a[Math.floor(Math.random()*a.length)]}
function seeded(s){let v=s;return()=>{v=(v*1664525+1013904223)&0xffffffff;return(v>>>0)/4294967296}}

// Rounded rect path (no fill/stroke)
function rp(ctx,x,y,w,h,r){
  r=Math.min(r,w/2,h/2);
  ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();
}
// Rounded rect fill+stroke
function rrect(ctx,x,y,w,h,r,fill,stroke,lw=1){
  rp(ctx,x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.stroke()}
}
// Clip to rounded rect, call fn, restore
function rclip(ctx,x,y,sz,r,fn){ctx.save();rp(ctx,x,y,sz,sz,r);ctx.clip();fn();ctx.restore();}

// ─── PREMIUM TEXT ─────────────────────────────────────────────────────────────
// Gradient + outline + glow for title characters
function drawPremText(ctx,text,x,y,font,topCol,botCol,outlineCol,glowCol,glowSz=14,lw=3){
  ctx.save();ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
  const fsz=parseFloat((font.match(/[\d.]+/)||['14'])[0]);
  const g=ctx.createLinearGradient(0,y-fsz*0.5,0,y+fsz*0.5);
  g.addColorStop(0,topCol);g.addColorStop(0.55,botCol);g.addColorStop(1,lerpC(botCol,'#000000',0.3));
  if(glowCol){ctx.shadowColor=glowCol;ctx.shadowBlur=glowSz;}
  ctx.strokeStyle=outlineCol||'rgba(0,0,0,0.6)';ctx.lineWidth=lw;ctx.lineJoin='round';ctx.strokeText(text,x,y);
  ctx.shadowBlur=0;ctx.fillStyle=g;ctx.fillText(text,x,y);
  // Shine pass
  ctx.globalAlpha=0.18;
  const sg=ctx.createLinearGradient(x,y-fsz*0.5,x,y+fsz*0.1);
  sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg;ctx.fillText(text,x,y);
  ctx.globalAlpha=1;ctx.restore();
}

// Animated bouncing title (per char premium)
function bounceTitle(ctx,text,cx,by,t,font,topCol,botCol,glowCol,amp=7){
  ctx.save();ctx.font=font;ctx.textBaseline='middle';
  const chars=text.split('');
  const widths=chars.map(c=>ctx.measureText(c).width+1);
  const total=widths.reduce((s,w)=>s+w,0);
  let x=cx-total/2;
  const fsz=parseFloat((font.match(/[\d.]+/)||['14'])[0]);
  chars.forEach((ch,i)=>{
    const bob=Math.sin(t*0.0024+i*0.78)*amp;
    const shine=Math.sin(t*0.0028+i*0.4)*0.2;
    const gr=cl(hr(topCol)+shine*40,0,255),gg=cl(hg(topCol)+shine*40,0,255),gb=cl(hb(topCol)+shine*40,0,255);
    const g=ctx.createLinearGradient(x,by+bob-fsz*0.5,x,by+bob+fsz*0.5);
    g.addColorStop(0,rgb(gr,gg,gb));g.addColorStop(0.6,botCol);g.addColorStop(1,lerpC(botCol,'#000',0.4));
    ctx.save();
    ctx.shadowColor=glowCol;ctx.shadowBlur=16+Math.abs(bob);
    ctx.strokeStyle='rgba(0,0,0,0.55)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeText(ch,x,by+bob);
    ctx.shadowBlur=0;ctx.fillStyle=g;ctx.fillText(ch,x,by+bob);
    ctx.globalAlpha=0.22;
    const sg=ctx.createLinearGradient(x,by+bob-fsz*0.5,x,by+bob);
    sg.addColorStop(0,'#fff');sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fillText(ch,x,by+bob);
    ctx.globalAlpha=1;ctx.restore();
    x+=widths[i];
  });
  ctx.restore();
}
function titleWidth(ctx,text,font){ctx.save();ctx.font=font;const w=text.split('').reduce((s,c)=>s+ctx.measureText(c).width+1,0);ctx.restore();return w;}

// Small label with gradient + subtle glow
function labelText(ctx,text,x,y,col,font,align='center',glow=false){
  ctx.save();ctx.font=font;ctx.textAlign=align;ctx.textBaseline='middle';
  if(glow){ctx.shadowColor=col;ctx.shadowBlur=8;}
  ctx.fillStyle=col;ctx.fillText(text,x,y);
  ctx.shadowBlur=0;ctx.restore();
}

// ─── BONUS ICONS ─────────────────────────────────────────────────────────────
function drawBombIcon(ctx,cx,cy,sz){
  ctx.save();
  // Shadow under bomb
  ctx.shadowColor='rgba(0,0,0,0.5)';ctx.shadowBlur=sz*0.3;ctx.shadowOffsetY=sz*0.08;
  // Bomb body – dark sphere
  const bg=ctx.createRadialGradient(cx-sz*0.12,cy-sz*0.1,sz*0.04,cx,cy+sz*0.05,sz*0.38);
  bg.addColorStop(0,'#555');bg.addColorStop(0.45,'#1A1A1A');bg.addColorStop(1,'#000');
  ctx.fillStyle=bg;ctx.beginPath();ctx.arc(cx,cy+sz*0.05,sz*0.38,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  // Shine spot
  ctx.fillStyle='rgba(255,255,255,0.28)';
  ctx.beginPath();ctx.ellipse(cx-sz*0.12,cy-sz*0.08,sz*0.13,sz*0.09,-0.4,0,Math.PI*2);ctx.fill();
  // Fuse cord (brown bezier)
  ctx.strokeStyle='#7B4F12';ctx.lineWidth=sz*0.09;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(cx+sz*0.26,cy-sz*0.28);
  ctx.quadraticCurveTo(cx+sz*0.48,cy-sz*0.52,cx+sz*0.32,cy-sz*0.68);ctx.stroke();
  // Fuse metal cap (small rect at top of body)
  ctx.fillStyle='#888';ctx.strokeStyle='#555';ctx.lineWidth=sz*0.04;
  ctx.beginPath();ctx.arc(cx+sz*0.26,cy-sz*0.25,sz*0.06,0,Math.PI*2);ctx.fill();ctx.stroke();
  // Spark / ember at fuse tip
  ctx.shadowColor='#FF8800';ctx.shadowBlur=sz*0.5;
  ctx.fillStyle='#FFE040';ctx.beginPath();ctx.arc(cx+sz*0.32,cy-sz*0.68,sz*0.09,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(cx+sz*0.32,cy-sz*0.68,sz*0.04,0,Math.PI*2);ctx.fill();
  // Spark rays
  ctx.strokeStyle='#FFA020';ctx.lineWidth=sz*0.06;ctx.lineCap='round';ctx.shadowBlur=sz*0.3;
  const rays=[[0,-1],[0.7,-0.7],[-0.6,-0.8],[0.85,0.1]];
  rays.forEach(([dx,dy])=>{const base=sz*0.1;ctx.beginPath();ctx.moveTo(cx+sz*0.32+dx*base,cy-sz*0.68+dy*base);ctx.lineTo(cx+sz*0.32+dx*(base+sz*0.14),cy-sz*0.68+dy*(base+sz*0.14));ctx.stroke();});
  ctx.shadowBlur=0;ctx.restore();
}
function drawBombIconFast(ctx,cx,cy,sz){
  if(_uiIconsReady['bomb']&&_uiIcons['bomb']){
    ctx.drawImage(_uiIcons['bomb'],cx-sz/2,cy-sz/2,sz,sz);
  } else {
    drawBombIcon(ctx,cx,cy,sz);
  }
}
function drawX2Icon(ctx,cx,cy,sz){
  ctx.save();
  const fsz=sz*0.72;
  ctx.font=`bold ${fsz|0}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  // Dark outline + shadow
  ctx.shadowColor='rgba(0,0,0,0.7)';ctx.shadowBlur=sz*0.25;
  ctx.strokeStyle='#4A2000';ctx.lineWidth=fsz*0.16;ctx.lineJoin='round';ctx.strokeText('×2',cx,cy);
  ctx.shadowBlur=0;
  // Gold gradient fill
  const g=ctx.createLinearGradient(cx,cy-fsz*0.5,cx,cy+fsz*0.5);
  g.addColorStop(0,'#FFF0A0');g.addColorStop(0.2,'#FFD700');g.addColorStop(0.6,'#FFA000');g.addColorStop(1,'#D46000');
  ctx.fillStyle=g;ctx.fillText('×2',cx,cy);
  // Shine pass
  ctx.globalAlpha=0.35;
  const sg=ctx.createLinearGradient(cx,cy-fsz*0.5,cx,cy+fsz*0.05);
  sg.addColorStop(0,'#fff');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg;ctx.fillText('×2',cx,cy);
  ctx.globalAlpha=1;ctx.restore();
}

// Parasite cell skin (replaces normal skin for parasite pieces/overlay)
function drawParasiteCell(ctx,x,y,sz,t,phase){
  rclip(ctx,x,y,sz,sz/4,()=>{
    // Dark corrupted base
    const bg=ctx.createRadialGradient(x+sz*0.4,y+sz*0.35,0,x+sz/2,y+sz/2,sz*0.7);
    bg.addColorStop(0,'#2A0A4E');bg.addColorStop(0.5,'#120228');bg.addColorStop(1,'#050010');
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Pulsing green veins
    const pulse=0.5+0.5*Math.sin(t*0.006+phase);
    ctx.strokeStyle=`rgba(0,${(180+60*pulse)|0},${(40+20*pulse)|0},${(0.55+0.35*pulse).toFixed(2)})`;
    ctx.lineWidth=Math.max(1,sz*0.06);ctx.lineCap='round';
    // Vein pattern (seeded by position)
    const vr=seeded((x*31+y*17)&0xffff);
    for(let i=0;i<3;i++){
      const sx2=x+vr()*sz,sy2=y+vr()*sz,ex=x+vr()*sz,ey=y+vr()*sz;
      const mx=sx2+(ex-sx2)*0.5+Math.sin(t*0.004+i)*sz*0.12,my=sy2+(ey-sy2)*0.5+Math.cos(t*0.003+i)*sz*0.12;
      ctx.beginPath();ctx.moveTo(sx2,sy2);ctx.quadraticCurveTo(mx,my,ex,ey);ctx.stroke();
    }
    // Toxic glow dots
    ctx.shadowColor=`rgba(0,255,80,${0.6+0.4*pulse})`;ctx.shadowBlur=sz*0.4;
    const dr=seeded((x*13+y*29)&0xffff);
    for(let i=0;i<2;i++){
      ctx.fillStyle=`rgba(40,${(200+55*pulse)|0},60,${(0.7+0.3*pulse).toFixed(2)})`;
      ctx.beginPath();ctx.arc(x+dr()*sz,y+dr()*sz,sz*0.07,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    // Top shine
    const sh=ctx.createLinearGradient(x,y,x,y+sz*0.4);
    sh.addColorStop(0,'rgba(120,40,255,0.15)');sh.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sh;ctx.fillRect(x,y,sz,sz);
  });
}
// Parasite grid overlay (pulsing corrupt aura drawn on top of the host cell)
function drawParasiteOverlay(ctx,x,y,sz,t,phase){
  const pulse=0.5+0.5*Math.sin(t*0.007+phase);
  // Dark vignette border
  const bg=ctx.createRadialGradient(x+sz/2,y+sz/2,sz*0.18,x+sz/2,y+sz/2,sz*0.72);
  bg.addColorStop(0,'rgba(0,200,50,0)');bg.addColorStop(0.6,`rgba(0,80,20,${(0.18+0.12*pulse).toFixed(2)})`);bg.addColorStop(1,`rgba(0,180,40,${(0.38+0.22*pulse).toFixed(2)})`);
  ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
  // Scanning line
  const scanY=y+((t*0.06+phase*sz)%sz);
  const sg=ctx.createLinearGradient(x,scanY-2,x,scanY+3);
  sg.addColorStop(0,'rgba(0,255,80,0)');sg.addColorStop(0.5,`rgba(0,255,80,${(0.28*pulse).toFixed(2)})`);sg.addColorStop(1,'rgba(0,255,80,0)');
  ctx.fillStyle=sg;ctx.fillRect(x,scanY-2,sz,5);
  // Skull emoji hint (small, pulsing)
  const esz=Math.max(8,sz*0.36)|0;
  ctx.save();ctx.font=`${esz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.globalAlpha=0.55+0.35*pulse;ctx.shadowColor='#00FF50';ctx.shadowBlur=sz*0.3;
  ctx.fillText('☠',x+sz/2,y+sz/2);ctx.shadowBlur=0;ctx.restore();
}

// Score number with digit gradient
function drawScore(ctx,text,x,y,th,font){
  ctx.save();ctx.font=font;ctx.textAlign='center';ctx.textBaseline='middle';
  const fsz=parseFloat((font.match(/[\d.]+/)||['14'])[0]);
  const g=ctx.createLinearGradient(0,y-fsz*0.5,0,y+fsz*0.5);
  g.addColorStop(0,th.hi||th.tm);g.addColorStop(0.5,th.tm);g.addColorStop(1,lerpC(th.ta,'#000',0.2));
  // Bloom pass 1 — wide soft glow
  const _sgCol=th.scoreGlow||th.tm;
  ctx.globalAlpha=0.22;ctx.shadowColor=_sgCol;ctx.shadowBlur=fsz*1.1;
  ctx.fillStyle=th.hi||th.tm;ctx.fillText(text,x,y);
  // Bloom pass 2 — tight inner glow (scoreGlow shadowColor=12)
  ctx.globalAlpha=0.40;ctx.shadowColor=_sgCol;ctx.shadowBlur=Math.max(12,fsz*0.45);ctx.fillText(text,x,y);
  // Final crisp pass
  ctx.globalAlpha=1;ctx.shadowBlur=0;
  ctx.strokeStyle='rgba(0,0,0,0.55)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeText(text,x,y);
  ctx.fillStyle=g;ctx.fillText(text,x,y);
  // Shine pass
  ctx.globalAlpha=0.20;
  const sg=ctx.createLinearGradient(x,y-fsz*0.5,x,y+fsz*0.05);
  sg.addColorStop(0,'rgba(255,255,255,1)');sg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sg;ctx.fillText(text,x,y);
  ctx.globalAlpha=1;ctx.restore();
}

// ─── CELL CACHE ───────────────────────────────────────────────────────────────
// ── 3D bevel + specular — baked into every skin ──────────────────────────────
function _drawBevel(ctx,x,y,sz){
  const r=Math.max(3,sz/5|0);
  ctx.save();
  rp(ctx,x,y,sz,sz,r);ctx.clip();
  // Top light face — strong upper highlight (top-left light source)
  const tg=ctx.createLinearGradient(x,y,x,y+sz*0.30);
  tg.addColorStop(0,'rgba(255,255,255,0.58)');tg.addColorStop(0.45,'rgba(255,255,255,0.16)');tg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=tg;ctx.fillRect(x,y,sz,sz*0.30);
  // Left light face
  const lg=ctx.createLinearGradient(x,y,x+sz*0.24,y);
  lg.addColorStop(0,'rgba(255,255,255,0.40)');lg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=lg;ctx.fillRect(x,y,sz*0.24,sz);
  // Bottom dark face — deeper shadow for 3D depth
  const bg=ctx.createLinearGradient(x,y+sz*0.66,x,y+sz);
  bg.addColorStop(0,'rgba(0,0,0,0)');bg.addColorStop(1,'rgba(0,0,0,0.52)');
  ctx.fillStyle=bg;ctx.fillRect(x,y+sz*0.66,sz,sz*0.34);
  // Right dark face
  const rg=ctx.createLinearGradient(x+sz*0.68,y,x+sz,y);
  rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,0.40)');
  ctx.fillStyle=rg;ctx.fillRect(x+sz*0.68,y,sz*0.32,sz);
  // Inner rim light — bright hairline at top & left (raised block face illusion)
  const rimW=Math.max(0.8,sz*0.030);
  ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=rimW;ctx.lineCap='square';
  ctx.beginPath();ctx.moveTo(x+r+rimW,y+rimW*0.5);ctx.lineTo(x+sz-r-rimW,y+rimW*0.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+rimW*0.5,y+r+rimW);ctx.lineTo(x+rimW*0.5,y+sz-r-rimW);ctx.stroke();
  // Inner AO — dark hairline at bottom & right (ambient occlusion between blocks)
  const aoW=Math.max(0.8,sz*0.024);
  ctx.strokeStyle='rgba(0,0,0,0.28)';ctx.lineWidth=aoW;
  ctx.beginPath();ctx.moveTo(x+r+aoW,y+sz-aoW*0.5);ctx.lineTo(x+sz-r-aoW,y+sz-aoW*0.5);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x+sz-aoW*0.5,y+r+aoW);ctx.lineTo(x+sz-aoW*0.5,y+sz-r-aoW);ctx.stroke();
  // Specular spot — strong top-left corner glow
  const sp=ctx.createRadialGradient(x+sz*0.24,y+sz*0.18,0,x+sz*0.24,y+sz*0.18,sz*0.44);
  sp.addColorStop(0,'rgba(255,255,255,0.58)');sp.addColorStop(0.25,'rgba(255,255,255,0.20)');sp.addColorStop(0.65,'rgba(255,255,255,0.04)');sp.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sp;ctx.fillRect(x,y,sz,sz);
  // Micro-specular pinpoint hot spot
  ctx.fillStyle='rgba(255,255,255,0.32)';
  ctx.beginPath();ctx.arc(x+sz*0.19,y+sz*0.14,sz*0.048,0,Math.PI*2);ctx.fill();
  ctx.restore();
}

function getCached(col,sz,skin,t){
  const animated=ANIMATED_SKINS.has(skin);
  // On iOS: animated skins rendered at t=0 (no animation) — prevents cache key rotating
  // every 100ms which would grow CELL_CACHE indefinitely (GPU OOM crash on iPhone)
  const k=(!_IS_IOS&&animated)?`${skin}_${col}_${sz}_${Math.floor(t/100)}`:`${skin}_${col}_${sz}`;
  if(CELL_CACHE.has(k))return CELL_CACHE.get(k);
  // Safety cap: prevent unbounded growth (critical — each entry is an offscreen GPU canvas)
  if(CELL_CACHE.size>=200)CELL_CACHE.clear();
  const oc=document.createElement('canvas');oc.width=sz;oc.height=sz;
  const c2=oc.getContext('2d');
  if(!c2)return oc; // iOS canvas context limit exceeded — return empty canvas to avoid crash
  const bakeT=(!_IS_IOS&&animated)?Math.floor(t/100)*100:0;
  SKIN_FNS[skin](c2,col,0,0,sz,bakeT);
  _drawBevel(c2,0,0,sz);
  CELL_CACHE.set(k,oc);return oc;
}
function drawCell(ctx,col,x,y,sz,skin,t,alpha=1){
  x=x|0;y=y|0;sz=sz|0;if(sz<1)return;
  if(_IS_IOS){
    // Ultra-minimal: flat colored rect — no offscreen canvas, no GPU textures, no shadows
    if(alpha<1)ctx.globalAlpha=alpha;
    const _r=Math.max(2,sz/6|0);
    ctx.fillStyle=col;rp(ctx,x+1,y+1,sz-2,sz-2,_r);ctx.fill();
    // Tiny top highlight for depth
    ctx.fillStyle='rgba(255,255,255,0.18)';ctx.fillRect(x+2,y+2,sz-4,Math.max(1,sz*0.14|0));
    if(alpha<1)ctx.globalAlpha=1;
    return;
  }
  // Drop shadow (drawn before skin, outside clip)
  const _r=Math.max(3,sz/5|0);
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.38)';ctx.shadowBlur=sz*0.14;ctx.shadowOffsetX=sz*0.04;ctx.shadowOffsetY=sz*0.07;
  rp(ctx,x,y,sz,sz,_r);ctx.fillStyle='#000';ctx.fill();
  ctx.restore();
  if(alpha<1)ctx.globalAlpha=alpha;
  const _thCG=(typeof curTheme!=='undefined'&&THEMES[curTheme])?THEMES[curTheme].cellGlow:null;
  if(_thCG){ctx.save();ctx.shadowColor=_thCG;ctx.shadowBlur=4;ctx.drawImage(getCached(col,sz,skin,t),x,y);ctx.restore();}
  else ctx.drawImage(getCached(col,sz,skin,t),x,y);
  if(alpha<1)ctx.globalAlpha=1;
}

// ─── 10 PREMIUM SKINS ─────────────────────────────────────────────────────────
// All skins use rclip for rounded corners + detailed multi-layer rendering

function skinPierre(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/5,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    // Base diagonal gradient
    const bg=ctx.createLinearGradient(x,y,x+sz,y+sz);
    bg.addColorStop(0,rgb(cl(r+65,0,255),cl(g+65,0,255),cl(b+65,0,255)));
    bg.addColorStop(0.45,rgb(cl(r+10,0,255),cl(g+10,0,255),cl(b+10,0,255)));
    bg.addColorStop(1,rgb(cl(r-45,0,255),cl(g-45,0,255),cl(b-45,0,255)));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Stone grain lines (7 lines, varied opacity, slight curve via bezier)
    for(let i=0;i<7;i++){
      const gy=y+2+i*(sz-4)/7;
      const a=i%3===0?0.16:i%2===0?0.10:0.06;
      const lc=i%2?`rgba(255,255,255,${a})`:`rgba(0,0,0,${a})`;
      ctx.strokeStyle=lc;ctx.lineWidth=0.5+Math.random()*0.5;
      ctx.beginPath();ctx.moveTo(x+1,gy+Math.sin(i*1.1)*1.5);
      ctx.bezierCurveTo(x+sz*0.28,gy+Math.sin(i*0.9+0.5)*2.2,x+sz*0.65,gy-Math.sin(i*1.3+1)*1.8,x+sz-1,gy+Math.cos(i*0.7)*1.5);
      ctx.stroke();
    }
    // AO corners (ambient occlusion — dark radial at each corner)
    [[x,y],[x+sz,y],[x,y+sz],[x+sz,y+sz]].forEach(([cx3,cy3])=>{
      const ao=ctx.createRadialGradient(cx3,cy3,0,cx3,cy3,sz*0.38);
      ao.addColorStop(0,'rgba(0,0,0,0.22)');ao.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ao;ctx.fillRect(x,y,sz,sz);
    });
    // Top-left light
    const lg=ctx.createLinearGradient(x,y,x+sz*0.65,y+sz*0.55);
    lg.addColorStop(0,'rgba(255,255,255,0.30)');lg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lg;ctx.fillRect(x,y,sz,sz);
    // Bottom-right shadow
    const sg=ctx.createLinearGradient(x+sz*0.38,y+sz*0.38,x+sz,y+sz);
    sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,0,0,0.32)');
    ctx.fillStyle=sg;ctx.fillRect(x,y,sz,sz);
    // Sub-pixel stone texture dots (12 micro-specks)
    ctx.fillStyle='rgba(255,255,255,0.12)';
    for(let i=0;i<12;i++){const px=x+4+((i*37)%Math.max(sz-8,1)),py=y+4+((i*53)%Math.max(sz-8,1));ctx.beginPath();ctx.arc(px,py,0.5,0,Math.PI*2);ctx.fill();}
    // Scratches (2 lines, angled)
    ctx.lineWidth=0.5;
    ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.beginPath();ctx.moveTo(x+sz*0.12,y+sz*0.14);ctx.lineTo(x+sz*0.38,y+sz*0.26);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.12)';ctx.beginPath();ctx.moveTo(x+sz*0.58,y+sz*0.62);ctx.lineTo(x+sz*0.75,y+sz*0.72);ctx.stroke();
  });
}

function skinCristal(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/4,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const cx2=x+sz/2,cy2=y+sz/2;
    // Deep inner radial gradient
    const bg=ctx.createRadialGradient(x+sz*0.32,y+sz*0.28,0,x+sz/2,y+sz/2,sz*0.72);
    bg.addColorStop(0,rgb(cl(r+100,0,255),cl(g+100,0,255),cl(b+100,0,255)));
    bg.addColorStop(0.35,rgb(cl(r+45,0,255),cl(g+45,0,255),cl(b+45,0,255)));
    bg.addColorStop(0.75,rgb(cl(r+10,0,255),cl(g+10,0,255),cl(b+10,0,255)));
    bg.addColorStop(1,rgb(cl(r-25,0,255),cl(g-25,0,255),cl(b-25,0,255)));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // 5 facet triangles (top, left, right, bottom-left, bottom-right)
    const facets=[
      ['rgba(255,255,255,0.22)',[x+2,y+2],[x+sz-3,y+2],[cx2,cy2]],
      ['rgba(255,255,255,0.10)',[x+2,y+2],[x+2,y+sz-3],[cx2,cy2]],
      ['rgba(255,255,255,0.06)',[x+sz-3,y+2],[x+sz-3,y+sz-3],[cx2,cy2]],
      ['rgba(0,0,0,0.18)',[x+sz-3,y+sz-3],[x+2,y+sz-3],[cx2,cy2]],
      ['rgba(0,0,0,0.08)',[x+2,y+sz*0.55],[cx2,cy2],[x+2,y+sz-3]],
    ];
    facets.forEach(([fc,p1,p2,p3])=>{ctx.fillStyle=fc;ctx.beginPath();ctx.moveTo(p1[0],p1[1]);ctx.lineTo(p2[0],p2[1]);ctx.lineTo(p3[0],p3[1]);ctx.closePath();ctx.fill();});
    // Internal facet edge lines (sub-pixel, 0.5px)
    ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(x+2,y+2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(x+sz-3,y+2);ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(x+2,y+sz-3);ctx.stroke();
    // Main sparkle (core + halo)
    const sp=ctx.createRadialGradient(x+sz*0.3,y+sz*0.27,0,x+sz*0.3,y+sz*0.27,sz*0.22);
    sp.addColorStop(0,'rgba(255,255,255,1)');sp.addColorStop(0.3,'rgba(255,255,255,0.7)');sp.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sp;ctx.beginPath();ctx.arc(x+sz*0.3,y+sz*0.27,sz*0.22,0,Math.PI*2);ctx.fill();
    // Star flare rays (4 rays from sparkle center)
    ctx.save();ctx.translate(x+sz*0.3,y+sz*0.27);
    ctx.strokeStyle='rgba(255,255,255,0.55)';ctx.lineWidth=0.6;
    for(let ri=0;ri<4;ri++){const ang=ri*Math.PI/2;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*sz*0.28,Math.sin(ang)*sz*0.28);ctx.stroke();}
    ctx.restore();
    // Secondary micro sparkle
    ctx.fillStyle='rgba(255,255,255,0.6)';
    ctx.beginPath();ctx.arc(x+sz*0.68,y+sz*0.60,sz*0.055,0,Math.PI*2);ctx.fill();
    // Diamond outline
    const dr=sz*0.27;
    ctx.strokeStyle='rgba(255,255,255,0.38)';ctx.lineWidth=0.7;
    ctx.beginPath();ctx.moveTo(cx2,cy2-dr);ctx.lineTo(cx2+dr,cy2);ctx.lineTo(cx2,cy2+dr);ctx.lineTo(cx2-dr,cy2);ctx.closePath();ctx.stroke();
    // Inner diamond (smaller, brighter)
    const dr2=sz*0.13;
    ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(cx2,cy2-dr2);ctx.lineTo(cx2+dr2,cy2);ctx.lineTo(cx2,cy2+dr2);ctx.lineTo(cx2-dr2,cy2);ctx.closePath();ctx.stroke();
  });
}

function skinBois(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/6,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const wr=cl(r*0.55+55|0,0,255),wg=cl(g*0.55+35|0,0,255),wb=cl(b*0.4+12|0,0,255);
    // Warm base fill
    const wbg=ctx.createLinearGradient(x,y,x+sz,y+sz);
    wbg.addColorStop(0,rgb(cl(wr+18,0,255),cl(wg+12,0,255),cl(wb+6,0,255)));
    wbg.addColorStop(1,rgb(cl(wr-12,0,255),cl(wg-8,0,255),cl(wb-4,0,255)));
    ctx.fillStyle=wbg;ctx.fillRect(x,y,sz,sz);
    // Wood grain — 9 lines with unique bezier curves and phase offsets
    for(let i=0;i<9;i++){
      const gy=y+1+i*(sz-2)/9;
      const ph=i*0.73;
      const dk=i%3===0?0.16:i%3===1?0.09:0.05;
      const lw=i%3===0?sz/9:sz/14;
      ctx.strokeStyle=`rgba(0,0,0,${dk})`;ctx.lineWidth=lw;
      ctx.beginPath();
      ctx.moveTo(x,gy+Math.sin(ph)*sz*0.055);
      ctx.bezierCurveTo(
        x+sz*0.25,gy+Math.sin(ph+0.8)*sz*0.07,
        x+sz*0.62,gy-Math.sin(ph+1.5)*sz*0.05,
        x+sz,gy+Math.sin(ph+2.1)*sz*0.04
      );
      ctx.stroke();
    }
    // Knot with 3 concentric rings
    const kx=x+sz*0.68,ky=y+sz*0.62,kr=sz/9;
    [[kr,'rgba(0,0,0,0.32)',sz/11],[kr*1.7,'rgba(0,0,0,0.18)',sz/15],[kr*2.5,'rgba(0,0,0,0.09)',sz/20]].forEach(([rad,sc,lw])=>{
      ctx.strokeStyle=sc;ctx.lineWidth=lw;
      ctx.beginPath();ctx.ellipse(kx,ky,rad,rad*0.68,-0.3,0,Math.PI*2);ctx.stroke();
    });
    // End-grain dot cluster (top-right corner micro-texture)
    ctx.fillStyle='rgba(0,0,0,0.10)';
    for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+sz*0.82+(i%3)*sz*0.04,y+sz*0.08+(Math.floor(i/3))*sz*0.06,sz*0.018,0,Math.PI*2);ctx.fill();}
    // Side bevel highlight (left edge)
    const lbev=ctx.createLinearGradient(x,y,x+sz*0.12,y);
    lbev.addColorStop(0,'rgba(255,255,255,0.22)');lbev.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lbev;ctx.fillRect(x,y,sz*0.12,sz);
    // Top shine strip
    const lg=ctx.createLinearGradient(x,y,x,y+sz*0.28);
    lg.addColorStop(0,'rgba(255,255,255,0.20)');lg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lg;ctx.fillRect(x,y,sz,sz*0.28);
  });
}

function skinMetal(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/6,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const mr=cl(r*0.25+110|0,0,255),mg=cl(g*0.25+110|0,0,255),mb=cl(b*0.25+115|0,0,255);
    ctx.fillStyle=rgb(mr,mg,mb);ctx.fillRect(x,y,sz,sz);
    // Brushed metal — 12 micro horizontal strokes, varied brightness
    for(let i=0;i<12;i++){
      const t2=i/12,gy=y+t2*sz,gh=sz/12+1;
      const bright=Math.sin(t2*Math.PI)*62+(i%3===1?18:0);
      ctx.fillStyle=`rgba(${cl(bright+152,0,255)|0},${cl(bright+152,0,255)|0},${cl(bright+158,0,255)|0},0.32)`;
      ctx.fillRect(x,gy,sz,gh);
    }
    // Sub-pixel brush micro-lines (horizontal scratches, 0.5px)
    ctx.lineWidth=0.5;
    for(let i=0;i<8;i++){
      const ly=y+sz*(0.1+i*0.1);const a=(0.04+Math.sin(i*1.3)*0.03).toFixed(3);
      ctx.strokeStyle=`rgba(255,255,255,${a})`;
      ctx.beginPath();ctx.moveTo(x+1,ly);ctx.lineTo(x+sz-1,ly);ctx.stroke();
    }
    // Diagonal specular streak
    const sg=ctx.createLinearGradient(x,y+sz*0.28,x+sz,y+sz*0.44);
    sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(0.42,'rgba(255,255,255,0.58)');
    sg.addColorStop(0.5,'rgba(255,255,255,0.75)');sg.addColorStop(0.58,'rgba(255,255,255,0.58)');
    sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fillRect(x,y,sz,sz);
    // Cross-scratch marks (2 thin diagonal scratches)
    ctx.lineWidth=0.5;
    ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.beginPath();ctx.moveTo(x+sz*0.20,y+sz*0.30);ctx.lineTo(x+sz*0.50,y+sz*0.20);ctx.stroke();
    ctx.strokeStyle='rgba(255,255,255,0.10)';ctx.beginPath();ctx.moveTo(x+sz*0.55,y+sz*0.65);ctx.lineTo(x+sz*0.80,y+sz*0.55);ctx.stroke();
    // Outer bevel highlight
    ctx.strokeStyle='rgba(255,255,255,0.35)';ctx.lineWidth=sz/11;ctx.strokeRect(x+sz/22,y+sz/22,sz-sz/11,sz-sz/11);
    // Inner bevel shadow
    ctx.strokeStyle='rgba(0,0,0,0.38)';ctx.lineWidth=1;ctx.strokeRect(x+sz*0.10,y+sz*0.10,sz*0.80,sz*0.80);
    // Rivet dots at corners
    const rvOff=sz*0.12;
    [[x+rvOff,y+rvOff],[x+sz-rvOff,y+rvOff],[x+rvOff,y+sz-rvOff],[x+sz-rvOff,y+sz-rvOff]].forEach(([rx,ry])=>{
      ctx.fillStyle='rgba(0,0,0,0.30)';ctx.beginPath();ctx.arc(rx,ry,sz*0.055,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.28)';ctx.beginPath();ctx.arc(rx-sz*0.012,ry-sz*0.012,sz*0.028,0,Math.PI*2);ctx.fill();
    });
    // Tint overlay
    const tg=ctx.createRadialGradient(x+sz/2,y+sz/2,0,x+sz/2,y+sz/2,sz*0.72);
    tg.addColorStop(0,rgba(r,g,b,0.18));tg.addColorStop(1,rgba(r,g,b,0.0));
    ctx.fillStyle=tg;ctx.fillRect(x,y,sz,sz);
  });
}

function skinMarbre(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/5,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const base=rgb(cl(r*0.12+188,0,255),cl(g*0.12+188,0,255),cl(b*0.12+195,0,255));
    ctx.fillStyle=base;ctx.fillRect(x,y,sz,sz);
    // Marble veins using bezier
    const vc=rgb(cl(r*0.5+60,0,255),cl(g*0.5+60,0,255),cl(b*0.5+70,0,255));
    ctx.strokeStyle=rgba(hr(vc),hg(vc),hb(vc),0.45);ctx.lineWidth=sz/14;
    ctx.beginPath();ctx.moveTo(x+sz*0.05,y+sz*0.35);ctx.bezierCurveTo(x+sz*0.3,y+sz*0.1,x+sz*0.65,y+sz*0.85,x+sz*0.95,y+sz*0.6);ctx.stroke();
    ctx.strokeStyle=rgba(hr(vc),hg(vc),hb(vc),0.22);ctx.lineWidth=sz/20;
    ctx.beginPath();ctx.moveTo(x+sz*0.15,y+sz*0.7);ctx.bezierCurveTo(x+sz*0.45,y+sz*0.5,x+sz*0.72,y+sz*0.18,x+sz*0.9,y+sz*0.38);ctx.stroke();
    ctx.strokeStyle=rgba(hr(vc),hg(vc),hb(vc),0.14);ctx.lineWidth=sz/26;
    ctx.beginPath();ctx.moveTo(x+sz*0.55,y+sz*0.05);ctx.bezierCurveTo(x+sz*0.4,y+sz*0.4,x+sz*0.7,y+sz*0.55,x+sz*0.5,y+sz*0.95);ctx.stroke();
    // Polish highlight
    const pg=ctx.createLinearGradient(x,y,x+sz*0.5,y+sz*0.4);
    pg.addColorStop(0,'rgba(255,255,255,0.22)');pg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=pg;ctx.fillRect(x,y,sz,sz);
    ctx.strokeStyle='rgba(180,180,200,0.45)';ctx.lineWidth=1;ctx.strokeRect(x+0.5,y+0.5,sz-1,sz-1);
  });
}

function skinCandy(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/3.5,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const g2=ctx.createLinearGradient(x,y,x+sz,y+sz);
    g2.addColorStop(0,rgb(cl(r+70,0,255),cl(g+70,0,255),cl(b+70,0,255)));
    g2.addColorStop(0.4,col);
    g2.addColorStop(1,rgb(cl(r-60,0,255),cl(g-60,0,255),cl(b-60,0,255)));
    ctx.fillStyle=g2;ctx.fillRect(x,y,sz,sz);
    // Main specular
    const sg=ctx.createRadialGradient(x+sz*0.32,y+sz*0.28,sz*0.04,x+sz*0.32,y+sz*0.28,sz*0.42);
    sg.addColorStop(0,'rgba(255,255,255,0.82)');sg.addColorStop(0.5,'rgba(255,255,255,0.25)');sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fillRect(x,y,sz,sz);
    // Secondary small shine
    ctx.fillStyle='rgba(255,255,255,0.55)';
    ctx.beginPath();ctx.ellipse(x+sz*0.72,y+sz*0.7,sz*0.08,sz*0.06,0.5,0,Math.PI*2);ctx.fill();
    // Rim
    const rg=ctx.createLinearGradient(x,y,x+sz,y+sz);
    rg.addColorStop(0,rgba(cl(r+100,0,255),cl(g+100,0,255),cl(b+100,0,255),0.4));
    rg.addColorStop(1,rgba(cl(r-30,0,255),cl(g-30,0,255),cl(b-30,0,255),0.4));
    ctx.strokeStyle=rg;ctx.lineWidth=sz/18;ctx.strokeRect(x+sz/18,y+sz/18,sz-sz/9,sz-sz/9);
  });
}

function skinGlace(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/4,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const ir=cl(r*0.18+162,0,255),ig_=cl(g*0.18+182,0,255),ib=cl(b*0.18+202,0,255);
    // 3-stop ice gradient
    const bg=ctx.createLinearGradient(x,y,x+sz,y+sz);
    bg.addColorStop(0,rgb(cl(ir+35,0,255),cl(ig_+32,0,255),cl(ib+28,0,255)));
    bg.addColorStop(0.5,rgb(cl(ir+8,0,255),cl(ig_+8,0,255),cl(ib+10,0,255)));
    bg.addColorStop(1,rgb(cl(ir-8,0,255),cl(ig_-5,0,255),ib));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Internal ice refraction crack lines (6 thin diagonal lines, sub-pixel)
    ctx.lineWidth=0.5;
    [[-0.18,-0.12,0.42,0.38],[0.08,-0.05,0.78,0.55],[0.22,0.10,0.68,0.82],[0.05,0.55,0.48,0.90],[0.62,0.05,0.95,0.72],[0.32,0.32,0.88,0.22]].forEach(([ax,ay,bx2,by2])=>{
      const a2=0.04+Math.random()*0.06;
      ctx.strokeStyle=`rgba(180,220,255,${a2.toFixed(2)})`;
      ctx.beginPath();ctx.moveTo(x+sz*ax,y+sz*ay);ctx.lineTo(x+sz*bx2,y+sz*by2);ctx.stroke();
    });
    // Snowflake (6 arms with secondary branches and tip dots)
    const cx2=x+sz/2,cy2=y+sz/2;
    ctx.strokeStyle='rgba(215,238,255,0.72)';ctx.lineWidth=Math.max(0.7,sz/20);
    for(let a=0;a<6;a++){
      const rad=a*Math.PI/3;
      const ex=cx2+Math.cos(rad)*sz*0.40,ey=cy2+Math.sin(rad)*sz*0.40;
      ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(ex,ey);ctx.stroke();
      // Primary cross-branch
      const mx=cx2+Math.cos(rad)*sz*0.24,my=cy2+Math.sin(rad)*sz*0.24;
      const b1=Math.cos(rad+Math.PI/3)*sz*0.11,b2=Math.sin(rad+Math.PI/3)*sz*0.11;
      ctx.lineWidth=Math.max(0.5,sz/28);
      ctx.beginPath();ctx.moveTo(mx-b1,my-b2);ctx.lineTo(mx+b1,my+b2);ctx.stroke();
      // Secondary branch (outer, smaller)
      const ox=cx2+Math.cos(rad)*sz*0.34,oy=cy2+Math.sin(rad)*sz*0.34;
      const c1=Math.cos(rad+Math.PI/3)*sz*0.07,c2=Math.sin(rad+Math.PI/3)*sz*0.07;
      ctx.beginPath();ctx.moveTo(ox-c1,oy-c2);ctx.lineTo(ox+c1,oy+c2);ctx.stroke();
      // Tip dot
      ctx.fillStyle='rgba(255,255,255,0.62)';ctx.beginPath();ctx.arc(ex,ey,sz*0.028,0,Math.PI*2);ctx.fill();
      ctx.lineWidth=Math.max(0.7,sz/20);
    }
    // Core glow (radial, white center)
    const cg=ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,sz*0.12);
    cg.addColorStop(0,'rgba(255,255,255,0.88)');cg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx2,cy2,sz*0.12,0,Math.PI*2);ctx.fill();
    // AO frost at corners
    [[x,y],[x+sz,y],[x,y+sz],[x+sz,y+sz]].forEach(([fx2,fy2])=>{
      const ao=ctx.createRadialGradient(fx2,fy2,0,fx2,fy2,sz*0.35);
      ao.addColorStop(0,'rgba(180,220,255,0.15)');ao.addColorStop(1,'rgba(180,220,255,0)');
      ctx.fillStyle=ao;ctx.fillRect(x,y,sz,sz);
    });
    // Top shine
    const lg=ctx.createLinearGradient(x,y,x,y+sz*0.40);
    lg.addColorStop(0,'rgba(255,255,255,0.35)');lg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lg;ctx.fillRect(x,y,sz,sz);
  });
}

function skinFeu(ctx,col,x,y,sz,t){
  rclip(ctx,x,y,sz,sz/7,()=>{
    const fl=Math.sin(t*0.009+x*0.1+y*0.08)*15;
    const tip=rgb(255,cl(195+fl,0,255),cl(20+fl,0,40));
    const mid=rgb(cl(255,0,255),cl(100+fl/2,0,200),0);
    const bas=rgb(cl(180-Math.abs(fl)/2,0,255),cl(30,0,80),0);
    // Fire gradient background
    const fg=ctx.createLinearGradient(x,y,x,y+sz);
    fg.addColorStop(0,tip);fg.addColorStop(0.4,mid);fg.addColorStop(1,bas);
    ctx.fillStyle=fg;ctx.fillRect(x,y,sz,sz);
    // Flame shape
    const flPts=[[x+sz/2,y+sz*0.08],[x+sz*0.78,y+sz*0.38+fl/6],[x+sz*0.68,y+sz*0.55],[x+sz/2,y+sz*0.4],[x+sz*0.32,y+sz*0.55],[x+sz*0.22,y+sz*0.38+fl/6]];
    ctx.fillStyle=`rgba(255,${cl(240+fl,0,255)},120,0.65)`;
    ctx.beginPath();flPts.forEach(([fx,fy],i)=>i?ctx.lineTo(fx,fy):ctx.moveTo(fx,fy));ctx.closePath();ctx.fill();
    // Inner hot core
    const cg=ctx.createRadialGradient(x+sz/2,y+sz*0.6,0,x+sz/2,y+sz*0.6,sz*0.3);
    cg.addColorStop(0,'rgba(255,255,200,0.7)');cg.addColorStop(1,'rgba(255,150,0,0)');
    ctx.fillStyle=cg;ctx.fillRect(x,y,sz,sz);
    // Sparkle dots
    for(let i=0;i<3;i++){const sp=Math.sin(t*0.015+i*2.1);const px2=x+sz*(0.35+i*0.15)+sp*sz*0.08,py2=y+sz*(0.2+Math.cos(t*0.01+i)*0.12);ctx.fillStyle='rgba(255,255,180,0.8)';ctx.beginPath();ctx.arc(px2,py2,sz/11,0,Math.PI*2);ctx.fill();}
  });
}

function skinNeon(ctx,col,x,y,sz,t){
  rclip(ctx,x,y,sz,sz/5,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const p=Math.sin(t*0.006+x*0.04+y*0.03)*24;
    const gr=cl(r+95+p,0,255)|0,gg=cl(g+95+p,0,255)|0,gb=cl(b+95+p,0,255)|0;
    // Dark background
    ctx.fillStyle=rgb(r/9|0,g/9|0,b/9|0);ctx.fillRect(x,y,sz,sz);
    // Inner glow
    const ig=ctx.createRadialGradient(x+sz/2,y+sz/2,0,x+sz/2,y+sz/2,sz*0.55);
    ig.addColorStop(0,rgba(gr,gg,gb,0.15+Math.abs(p)/200));ig.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ig;ctx.fillRect(x,y,sz,sz);
    // Neon rings
    const alpha=(0.6+Math.abs(p)/80).toFixed(2);
    ctx.shadowColor=rgb(gr,gg,gb);ctx.shadowBlur=sz/4;
    ctx.strokeStyle=`rgba(${gr},${gg},${gb},${alpha})`;ctx.lineWidth=sz/9;ctx.strokeRect(x+sz/9,y+sz/9,sz-sz/4.5,sz-sz/4.5);
    ctx.shadowBlur=sz/6;
    ctx.strokeStyle=rgba(cl(r+50+p/2,0,255)|0,cl(g+50+p/2,0,255)|0,cl(b+50+p/2,0,255)|0,0.8);
    ctx.lineWidth=sz/16;ctx.strokeRect(x+sz/5,y+sz/5,sz*0.6,sz*0.6);
    ctx.shadowBlur=0;
    ctx.strokeStyle='rgba(255,255,255,0.45)';ctx.lineWidth=1;ctx.strokeRect(x+sz/4,y+sz/4,sz/2,sz/2);
    // Corner sparks
    [[x+sz/7,y+sz/7],[x+sz-sz/7,y+sz/7],[x+sz/7,y+sz-sz/7],[x+sz-sz/7,y+sz-sz/7]].forEach(([cx2,cy2])=>{
      ctx.fillStyle=rgb(gr,gg,gb);ctx.shadowColor=rgb(gr,gg,gb);ctx.shadowBlur=4;
      ctx.beginPath();ctx.arc(cx2,cy2,sz/11,0,Math.PI*2);ctx.fill();
    });
    ctx.shadowBlur=0;
  });
}

function skinGalaxie(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/4.5,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const cx2=x+sz/2,cy2=y+sz/2;
    // Deep space background radial
    const bg=ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,sz*0.7);
    bg.addColorStop(0,rgb(cl(r*0.28+45,0,255),cl(g*0.28+28,0,255),cl(b*0.28+62,0,255)));
    bg.addColorStop(0.6,rgb(cl(r*0.12+18,0,255),cl(g*0.12+12,0,255),cl(b*0.12+28,0,255)));
    bg.addColorStop(1,rgb(r/10|0,g/10|0,b/10|0));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // 2 nebula blobs at different positions
    [[x+sz*0.55,y+sz*0.42,sz*0.42,rgba(r,g,b,0.25)],[x+sz*0.28,y+sz*0.60,sz*0.28,rgba(cl(r+40,0,255),cl(g+20,0,255),cl(b+60,0,255),0.14)]].forEach(([nx,ny,nr,nc2])=>{
      const ng=ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
      ng.addColorStop(0,nc2);ng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ng;ctx.beginPath();ctx.arc(nx,ny,nr,0,Math.PI*2);ctx.fill();
    });
    // Stars — 28 with deterministic positions + cross flares on bright
    const rng=seeded(r*29+g*17+b*11+sz);
    for(let i=0;i<28;i++){
      const sx=x+2+rng()*(sz-4),sy=y+2+rng()*(sz-4);
      const big=rng()<0.12,br=0.38+rng()*0.62;
      const sr2=cl(r+120,0,255),sg2=cl(g+110,0,255),sb2=cl(b+155,0,255);
      ctx.fillStyle=rgba(sr2,sg2,sb2,br);
      ctx.beginPath();ctx.arc(sx,sy,big?1.8:0.8,0,Math.PI*2);ctx.fill();
      if(big&&br>0.7){// cross flare on bright stars
        ctx.strokeStyle=rgba(sr2,sg2,sb2,0.28);ctx.lineWidth=0.5;
        ctx.beginPath();ctx.moveTo(sx-sz*0.06,sy);ctx.lineTo(sx+sz*0.06,sy);ctx.stroke();
        ctx.beginPath();ctx.moveTo(sx,sy-sz*0.06);ctx.lineTo(sx,sy+sz*0.06);ctx.stroke();
      }
    }
    // Dual spiral arms (two bezier spirals, symmetric)
    const sCol=rgba(cl(r+82,0,255),cl(g+82,0,255),cl(b+122,0,255),0.22);
    ctx.strokeStyle=sCol;ctx.lineWidth=sz/18;
    ctx.beginPath();for(let a=0;a<Math.PI*3.2;a+=0.08){const ar=a/(Math.PI*3.2)*sz*0.38;ctx.lineTo(cx2+Math.cos(a)*ar,cy2+Math.sin(a)*ar);}ctx.stroke();
    ctx.strokeStyle=rgba(cl(r+70,0,255),cl(g+70,0,255),cl(b+110,0,255),0.14);ctx.lineWidth=sz/24;
    ctx.beginPath();for(let a=0;a<Math.PI*3.2;a+=0.08){const ar=a/(Math.PI*3.2)*sz*0.36;ctx.lineTo(cx2+Math.cos(a+Math.PI)*ar,cy2+Math.sin(a+Math.PI)*ar);}ctx.stroke();
    // Event horizon ring
    ctx.strokeStyle=rgba(cl(r+60,0,255),cl(g+60,0,255),cl(b+100,0,255),0.30);ctx.lineWidth=0.7;
    ctx.beginPath();ctx.arc(cx2,cy2,sz*0.10,0,Math.PI*2);ctx.stroke();
    // Star cluster at center core
    const cg=ctx.createRadialGradient(cx2,cy2,0,cx2,cy2,sz*0.14);
    cg.addColorStop(0,'rgba(255,255,255,0.82)');cg.addColorStop(0.4,'rgba(240,220,255,0.45)');cg.addColorStop(1,'rgba(200,180,255,0)');
    ctx.fillStyle=cg;ctx.beginPath();ctx.arc(cx2,cy2,sz*0.14,0,Math.PI*2);ctx.fill();
  });
}

const SKIN_FNS=[skinPierre,skinCristal,skinBois,skinMetal,skinMarbre,
                skinCandy,skinGlace,skinFeu,skinNeon,skinGalaxie];

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function buildBg(ti){
  const th=THEMES[ti];
  const oc=document.createElement('canvas');oc.width=W;oc.height=H;
  const c=oc.getContext('2d');
  // Deep gradient
  const g=c.createLinearGradient(0,0,0,H);
  g.addColorStop(0,th.sky);g.addColorStop(0.5,lerpC(th.sky,th.bg,0.7));g.addColorStop(1,th.bg);
  c.fillStyle=g;c.fillRect(0,0,W,H);
  const rng=seeded(ti*7919+W+H);
  // Soft blobs
  for(let i=0;i<40;i++){
    const lx=rng()*W,ly=rng()*H,lr=20+rng()*50;
    c.fillStyle=rgba(hr(th.dc),hg(th.dc),hb(th.dc),0.04+rng()*0.07);
    c.beginPath();c.ellipse(lx,ly,lr,lr*0.65,rng()*Math.PI,0,Math.PI*2);c.fill();
  }
  // Theme-specific static detail
  if(ti===4||ti===6){for(let i=0;i<(ti===6?300:180);i++){const sx=rng()*W,sy=rng()*H,br=80+rng()*175|0,big=rng()<0.06;c.fillStyle=ti===6?rgba(cl(br+20,0,255),br/2|0,cl(br+30,0,255),0.85):rgba(br,br,cl(br+18,0,255),0.82);c.beginPath();c.arc(sx,sy,big?2:1,0,Math.PI*2);c.fill();}}
  if(ti===1){
    const _b1=seeded(ti*7919+W+H);
    // Low sun with heat halo
    const _bSX=W*0.72,_bSY=H*0.38;
    const _bSg1=c.createRadialGradient(_bSX,_bSY,0,_bSX,_bSY,H*0.28);
    _bSg1.addColorStop(0,'rgba(255,210,100,0.22)');_bSg1.addColorStop(0.45,'rgba(255,140,30,0.10)');_bSg1.addColorStop(1,'rgba(255,80,0,0)');
    c.fillStyle=_bSg1;c.fillRect(0,0,W,H);
    const _bSg2=c.createRadialGradient(_bSX,_bSY,0,_bSX,_bSY,H*0.07);
    _bSg2.addColorStop(0,'rgba(255,230,140,0.70)');_bSg2.addColorStop(0.6,'rgba(255,180,60,0.30)');_bSg2.addColorStop(1,'rgba(255,140,20,0)');
    c.fillStyle=_bSg2;c.fillRect(0,0,W,H);
    // Atmospheric heat haze band above horizon
    const _bHZ=H*0.58;
    const _bHg=c.createLinearGradient(0,_bHZ-H*0.18,0,_bHZ);
    _bHg.addColorStop(0,'rgba(255,120,20,0)');_bHg.addColorStop(0.6,'rgba(255,100,10,0.07)');_bHg.addColorStop(1,'rgba(220,70,5,0.17)');
    c.fillStyle=_bHg;c.fillRect(0,_bHZ-H*0.18,W,H*0.18);
    // Far dunes — faint silhouettes low on horizon
    c.fillStyle='rgba(80,38,8,0.55)';
    c.beginPath();c.moveTo(0,H);
    for(let _bx=0;_bx<=W;_bx+=W/22){const _bdy=_bHZ-H*0.04*(0.5+0.5*Math.sin(_bx*0.018+1.3))-H*0.025*(0.5+0.5*Math.sin(_bx*0.031+0.7));_bx===0?c.moveTo(_bx,_bdy):c.lineTo(_bx,_bdy);}
    c.lineTo(W,H);c.closePath();c.fill();
    // Mid dunes — darker, taller, gradient
    const _bMY=_bHZ+H*0.06;
    const _bMg=c.createLinearGradient(0,_bMY-H*0.12,0,H);
    _bMg.addColorStop(0,'rgba(56,24,4,0.78)');_bMg.addColorStop(1,'rgba(32,12,2,0.90)');
    c.fillStyle=_bMg;
    c.beginPath();c.moveTo(0,H);
    for(let _bx=0;_bx<=W;_bx+=W/18){const _bdy=_bMY-H*0.10*(0.5+0.5*Math.sin(_bx*0.014+2.1))-H*0.05*(0.5+0.5*Math.sin(_bx*0.028+0.3));_bx===0?c.moveTo(_bx,_bdy):c.lineTo(_bx,_bdy);}
    c.lineTo(W,H);c.closePath();c.fill();
    // Mid dune crest highlight rim
    c.strokeStyle='rgba(230,160,60,0.22)';c.lineWidth=2;
    c.beginPath();
    for(let _bx=0;_bx<=W;_bx+=W/18){const _bdy=_bMY-H*0.10*(0.5+0.5*Math.sin(_bx*0.014+2.1))-H*0.05*(0.5+0.5*Math.sin(_bx*0.028+0.3));_bx===0?c.moveTo(_bx,_bdy):c.lineTo(_bx,_bdy);}
    c.stroke();
    // Near dunes — foreground, very dark
    const _bNY=_bHZ+H*0.18;
    const _bNg=c.createLinearGradient(0,_bNY-H*0.08,0,H);
    _bNg.addColorStop(0,'rgba(28,10,2,0.92)');_bNg.addColorStop(1,'rgba(16,5,1,0.98)');
    c.fillStyle=_bNg;
    c.beginPath();c.moveTo(0,H);
    for(let _bx=0;_bx<=W;_bx+=W/14){const _bdy=_bNY-H*0.12*(0.5+0.5*Math.sin(_bx*0.011+0.5))-H*0.06*(0.5+0.5*Math.sin(_bx*0.023+1.8));_bx===0?c.moveTo(_bx,_bdy):c.lineTo(_bx,_bdy);}
    c.lineTo(W,H);c.closePath();c.fill();
    // Near dune crest rim
    c.strokeStyle='rgba(180,90,20,0.18)';c.lineWidth=2.5;
    c.beginPath();
    for(let _bx=0;_bx<=W;_bx+=W/14){const _bdy=_bNY-H*0.12*(0.5+0.5*Math.sin(_bx*0.011+0.5))-H*0.06*(0.5+0.5*Math.sin(_bx*0.023+1.8));_bx===0?c.moveTo(_bx,_bdy):c.lineTo(_bx,_bdy);}
    c.stroke();
    // Sand dust motes scattered in air
    for(let _bi=0;_bi<55;_bi++){const _bx=_b1()*W,_by=_bHZ-H*0.25+_b1()*H*0.32,_br=0.5+_b1()*2.5;c.fillStyle=`rgba(200,130,50,${(0.04+_b1()*0.09).toFixed(2)})`;c.beginPath();c.ellipse(_bx,_by,_br*2.2,_br,_b1()*Math.PI,0,Math.PI*2);c.fill();}
  }
  if(ti===9){
    const r9=seeded(ti*7919+W+H);
    const _gY=H*0.62;
    // Stars
    for(let i=0;i<70;i++){const sx=r9()*W,sy=r9()*H*0.52;const br=(65+r9()*150)|0;c.fillStyle=`rgba(${br},${br},${cl(br+40,0,255)},${(0.35+r9()*0.55).toFixed(2)})`;c.fillRect(sx,sy,r9()<0.12?2:1,1);}
    // Horizon atmospheric glow
    const _hg=c.createLinearGradient(0,_gY-H*0.22,0,_gY);_hg.addColorStop(0,'rgba(0,8,30,0)');_hg.addColorStop(0.65,'rgba(0,30,100,0.07)');_hg.addColorStop(1,'rgba(0,60,180,0.16)');c.fillStyle=_hg;c.fillRect(0,_gY-H*0.22,W,H*0.22);
    // Far buildings (silhouettes)
    for(let b=0;b<22;b++){const bw=r9()*(W*0.065)+W*0.022,bh=r9()*H*0.18+H*0.06,bx=b*(W/21)+r9()*6-2,by=_gY-bh;c.fillStyle='#010810';c.fillRect(bx,by,bw,bh);if(r9()<0.4){c.fillStyle=r9()<0.5?'rgba(0,160,255,0.55)':'rgba(255,50,80,0.65)';c.fillRect(bx+bw/2-1,by-5,2,6);}}
    // Near buildings with neon edges + windows
    for(let b=0;b<12;b++){
      const bw=r9()*(W*0.11)+W*0.05,bh=r9()*H*0.30+H*0.14,bx=b*(W/11.5)+r9()*12-4,by=_gY-bh;
      c.fillStyle='#020B1C';c.fillRect(bx,by,bw,bh);
      const ec=r9()<0.5?[0,200,255]:[150,40,255];
      c.strokeStyle=`rgba(${ec[0]},${ec[1]},${ec[2]},0.22)`;c.lineWidth=1.5;c.strokeRect(bx+1,by+1,bw-2,bh-2);
      const _rg=c.createLinearGradient(bx,by,bx,by+bh*0.2);_rg.addColorStop(0,`rgba(${ec[0]},${ec[1]},${ec[2]},0.25)`);_rg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=_rg;c.fillRect(bx,by,bw,bh*0.2);
      // Static windows
      const wcc=r9()<0.6?[0,190,255]:[190,160,80];const wcs=Math.max(2,Math.floor(bw/13)),wrs=Math.max(2,Math.floor(bh/15));
      for(let wr=0;wr<wrs;wr++)for(let wc=0;wc<wcs;wc++){if(r9()<0.40){const wx=bx+4+wc*(bw-8)/wcs,wy=by+bh*0.22+wr*(bh*0.72)/wrs;c.fillStyle=`rgba(${wcc[0]},${wcc[1]},${wcc[2]},${(0.10+r9()*0.18).toFixed(2)})`;c.fillRect(wx,wy,Math.max(3,(bw-8)/wcs-3),Math.max(2,(bh*0.72)/wrs/1.7-2));}}
    }
    // Ground
    const _gg=c.createLinearGradient(0,_gY,0,H);_gg.addColorStop(0,'#010A18');_gg.addColorStop(1,'#010610');c.fillStyle=_gg;c.fillRect(0,_gY,W,H-_gY);
    // Perspective grid on ground
    c.strokeStyle='rgba(0,100,200,0.06)';c.lineWidth=1;
    for(let g=1;g<=7;g++){const gy2=_gY+(H-_gY)*g/8;c.beginPath();c.moveTo(0,gy2);c.lineTo(W,gy2);c.stroke();}
    for(let g=-6;g<=6;g++){c.beginPath();c.moveTo(W/2+g*(W/5),H);c.lineTo(W/2,_gY);c.stroke();}
    // Horizon neon line
    c.strokeStyle='rgba(0,150,255,0.22)';c.lineWidth=1.5;c.beginPath();c.moveTo(0,_gY);c.lineTo(W,_gY);c.stroke();
  }
  if(ti===5){
    const _b5=seeded(ti*7919+W+H);
    // Aurora borealis — deux bandes verticales colorées subtiles
    const _b5aY1=H*0.12,_b5aY2=H*0.34;
    [[_b5aY1,H*0.22,'rgba(40,220,180,0.06)','rgba(80,180,255,0.09)'],[_b5aY2,H*0.18,'rgba(60,140,255,0.05)','rgba(140,80,255,0.07)']].forEach(([ay,aw,c1,c2])=>{const _b5ag=c.createLinearGradient(0,ay,0,ay+aw);_b5ag.addColorStop(0,'rgba(0,0,0,0)');_b5ag.addColorStop(0.45,c1);_b5ag.addColorStop(0.72,c2);_b5ag.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=_b5ag;c.fillRect(0,ay,W,aw);});
    // Montagnes lointaines — silhouettes pâles bleutées (arrière-plan)
    const _b5hFar=H*0.62;
    const _b5mgFar=c.createLinearGradient(0,_b5hFar-H*0.20,0,_b5hFar+2);
    _b5mgFar.addColorStop(0,'rgba(80,120,160,0)');_b5mgFar.addColorStop(0.5,'rgba(55,95,140,0.28)');_b5mgFar.addColorStop(1,'rgba(40,75,120,0.42)');
    c.fillStyle=_b5mgFar;
    c.beginPath();c.moveTo(0,H);
    for(let _b5x=0;_b5x<=W;_b5x+=W/28){const _b5dy=_b5hFar-H*0.17*(0.4+0.6*Math.abs(Math.sin(_b5x*0.019+2.3)))-H*0.06*(0.5+0.5*Math.sin(_b5x*0.041+0.9));_b5x===0?c.moveTo(_b5x,_b5dy):c.lineTo(_b5x,_b5dy);}
    c.lineTo(W,H);c.closePath();c.fill();
    // Cimes lointaines — liseret blanc neigeux
    c.strokeStyle='rgba(180,220,255,0.28)';c.lineWidth=1.5;
    c.beginPath();
    for(let _b5x=0;_b5x<=W;_b5x+=W/28){const _b5dy=_b5hFar-H*0.17*(0.4+0.6*Math.abs(Math.sin(_b5x*0.019+2.3)))-H*0.06*(0.5+0.5*Math.sin(_b5x*0.041+0.9));_b5x===0?c.moveTo(_b5x,_b5dy):c.lineTo(_b5x,_b5dy);}
    c.stroke();
    // Montagnes moyennes — plus sombres, plus proches
    const _b5hMid=H*0.68;
    const _b5mgMid=c.createLinearGradient(0,_b5hMid-H*0.16,0,H);
    _b5mgMid.addColorStop(0,'rgba(28,55,88,0)');_b5mgMid.addColorStop(0.25,'rgba(18,42,72,0.62)');_b5mgMid.addColorStop(1,'rgba(10,24,46,0.88)');
    c.fillStyle=_b5mgMid;
    c.beginPath();c.moveTo(0,H);
    for(let _b5x=0;_b5x<=W;_b5x+=W/20){const _b5dy=_b5hMid-H*0.14*(0.4+0.6*Math.abs(Math.sin(_b5x*0.015+0.7)))-H*0.07*(0.5+0.5*Math.sin(_b5x*0.033+1.9));_b5x===0?c.moveTo(_b5x,_b5dy):c.lineTo(_b5x,_b5dy);}
    c.lineTo(W,H);c.closePath();c.fill();
    // Liseret neige sur montagnes moyennes
    c.strokeStyle='rgba(200,235,255,0.38)';c.lineWidth=2;
    c.beginPath();
    for(let _b5x=0;_b5x<=W;_b5x+=W/20){const _b5dy=_b5hMid-H*0.14*(0.4+0.6*Math.abs(Math.sin(_b5x*0.015+0.7)))-H*0.07*(0.5+0.5*Math.sin(_b5x*0.033+1.9));_b5x===0?c.moveTo(_b5x,_b5dy):c.lineTo(_b5x,_b5dy);}
    c.stroke();
    // Stalactites de glace pendant du haut
    const _b5nS=12;
    for(let _b5i=0;_b5i<_b5nS;_b5i++){
      const _b5sx=_b5()*W,_b5sh=H*(0.06+_b5()*0.10),_b5sw=3+_b5()*6;
      const _b5sg=c.createLinearGradient(_b5sx,0,_b5sx,_b5sh);
      _b5sg.addColorStop(0,'rgba(160,220,255,0.55)');_b5sg.addColorStop(0.7,'rgba(100,180,255,0.28)');_b5sg.addColorStop(1,'rgba(140,210,255,0)');
      c.fillStyle=_b5sg;
      c.beginPath();c.moveTo(_b5sx-_b5sw/2,0);c.lineTo(_b5sx+_b5sw/2,0);c.lineTo(_b5sx,_b5sh);c.closePath();c.fill();
      // reflet blanc sur la face gauche
      c.fillStyle='rgba(230,245,255,0.22)';
      c.beginPath();c.moveTo(_b5sx-_b5sw/2,0);c.lineTo(_b5sx-_b5sw*0.08,0);c.lineTo(_b5sx-_b5sw*0.08+1,_b5sh*0.55);c.closePath();c.fill();
    }
    // Sol glacé avec reflets — gradient + lustre
    const _b5gY=H*0.74;
    const _b5ig=c.createLinearGradient(0,_b5gY,0,H);
    _b5ig.addColorStop(0,'rgba(100,180,240,0.10)');_b5ig.addColorStop(0.4,'rgba(70,150,220,0.18)');_b5ig.addColorStop(1,'rgba(40,100,180,0.28)');
    c.fillStyle=_b5ig;c.fillRect(0,_b5gY,W,H-_b5gY);
    // Ligne de sol nette avec brillance
    c.strokeStyle='rgba(160,220,255,0.35)';c.lineWidth=1.5;c.beginPath();c.moveTo(0,_b5gY);c.lineTo(W,_b5gY);c.stroke();
    // Reflets de lumière sur la glace (ellipses lumineuses)
    for(let _b5i=0;_b5i<6;_b5i++){
      const _b5rx=_b5()*W,_b5ry=_b5gY+_b5()*(H-_b5gY)*0.6,_b5rw=30+_b5()*60,_b5rh=4+_b5()*8;
      const _b5rg=c.createRadialGradient(_b5rx,_b5ry,0,_b5rx,_b5ry,_b5rw);
      _b5rg.addColorStop(0,'rgba(190,235,255,0.18)');_b5rg.addColorStop(1,'rgba(120,200,255,0)');
      c.fillStyle=_b5rg;c.beginPath();c.ellipse(_b5rx,_b5ry,_b5rw,_b5rh,0,0,Math.PI*2);c.fill();
    }
    // Brume froide au sol (haze arctique)
    const _b5mist=c.createLinearGradient(0,_b5gY-H*0.12,0,_b5gY+H*0.08);
    _b5mist.addColorStop(0,'rgba(120,190,240,0)');_b5mist.addColorStop(0.55,'rgba(100,170,230,0.07)');_b5mist.addColorStop(1,'rgba(80,150,220,0.14)');
    c.fillStyle=_b5mist;c.fillRect(0,_b5gY-H*0.12,W,H*0.20);
  }
  if(ti===3){
    const _b3=seeded(ti*7919+W+H);
    // ── VOLCAN : background 3D/4K ─────────────────────────────────────────────
    // Horizon Y de référence (ligne de sol volcanique)
    const _b3HZ=H*0.58;
    // Point de fuite centré légèrement à droite pour la perspective
    const _b3VPX=W*0.54;

    // 1. LUEUR DU MAGMA SOUS L'HORIZON — fond incandescent
    const _b3lava=c.createRadialGradient(_b3VPX,_b3HZ*1.05,0,_b3VPX,_b3HZ*1.05,W*0.72);
    _b3lava.addColorStop(0,'rgba(255,90,10,0.28)');
    _b3lava.addColorStop(0.28,'rgba(220,45,4,0.14)');
    _b3lava.addColorStop(0.55,'rgba(160,20,2,0.07)');
    _b3lava.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b3lava;c.fillRect(0,0,W,H);

    // 2. STRATO-VOLCAN CENTRAL — relief volumétrique 3 faces
    const _b3VX=_b3VPX*0.97,_b3VBase=_b3HZ+H*0.04;
    const _b3VW=W*0.52,_b3VH=H*0.48;
    const _b3VPeak={x:_b3VX,y:_b3VBase-_b3VH};
    const _b3VLeft={x:_b3VX-_b3VW*0.5,y:_b3VBase};
    const _b3VRight={x:_b3VX+_b3VW*0.5,y:_b3VBase};
    const _b3VCraterL={x:_b3VX-_b3VW*0.09,y:_b3VBase-_b3VH+H*0.04};
    const _b3VCraterR={x:_b3VX+_b3VW*0.09,y:_b3VBase-_b3VH+H*0.04};

    // Face ombre (droite — éclairage depuis la gauche/haut)
    const _b3shFace=c.createLinearGradient(_b3VX,_b3VPeak.y,_b3VRight.x,_b3VBase);
    _b3shFace.addColorStop(0,'rgba(28,4,2,0.92)');
    _b3shFace.addColorStop(0.45,'rgba(44,8,3,0.88)');
    _b3shFace.addColorStop(1,'rgba(18,3,1,0.95)');
    c.fillStyle=_b3shFace;
    c.beginPath();c.moveTo(_b3VPeak.x,_b3VPeak.y);c.lineTo(_b3VRight.x,_b3VRight.y);c.lineTo(_b3VBase<=H?_b3VRight.x:_b3VRight.x,H);c.lineTo(_b3VPeak.x,H);c.closePath();c.fill();
    c.beginPath();c.moveTo(_b3VPeak.x,_b3VPeak.y);c.lineTo(_b3VRight.x,_b3VRight.y);c.lineTo(_b3VCraterR.x,_b3VCraterR.y);c.closePath();c.fill();

    // Face éclairée (gauche — highlight chaud)
    const _b3litFace=c.createLinearGradient(_b3VLeft.x,_b3VBase,_b3VX,_b3VPeak.y);
    _b3litFace.addColorStop(0,'rgba(60,14,4,0.90)');
    _b3litFace.addColorStop(0.4,'rgba(85,22,6,0.82)');
    _b3litFace.addColorStop(0.75,'rgba(110,32,8,0.72)');
    _b3litFace.addColorStop(1,'rgba(130,40,10,0.60)');
    c.fillStyle=_b3litFace;
    c.beginPath();c.moveTo(_b3VLeft.x,_b3VLeft.y);c.lineTo(_b3VPeak.x,_b3VPeak.y);c.lineTo(_b3VCraterL.x,_b3VCraterL.y);c.closePath();c.fill();
    c.beginPath();c.moveTo(_b3VLeft.x,_b3VLeft.y);c.lineTo(_b3VPeak.x,_b3VPeak.y);c.lineTo(_b3VX,_b3VBase);c.lineTo(_b3VLeft.x,_b3VBase);c.closePath();c.fill();

    // Rim light sur l'arête gauche (normal-map simulé : filet de lumière orange)
    const _b3rimG=c.createLinearGradient(_b3VLeft.x,_b3VBase,_b3VPeak.x,_b3VPeak.y);
    _b3rimG.addColorStop(0,'rgba(255,100,20,0)');
    _b3rimG.addColorStop(0.5,'rgba(255,120,30,0.18)');
    _b3rimG.addColorStop(1,'rgba(255,150,50,0.06)');
    c.strokeStyle=_b3rimG;c.lineWidth=2.5;
    c.beginPath();c.moveTo(_b3VLeft.x,_b3VLeft.y);c.lineTo(_b3VPeak.x,_b3VPeak.y);c.stroke();

    // Base du volcan — sol de roche noire fondue
    const _b3baseG=c.createLinearGradient(0,_b3VBase-H*0.04,0,H);
    _b3baseG.addColorStop(0,'rgba(12,2,1,0)');
    _b3baseG.addColorStop(0.3,'rgba(14,3,1,0.88)');
    _b3baseG.addColorStop(1,'rgba(8,1,0,0.97)');
    c.fillStyle=_b3baseG;c.fillRect(0,_b3VBase-H*0.04,W,H-(_b3VBase-H*0.04));

    // 3. CRATÈRE INCANDESCENT — lueur interne + bord de magma
    const _b3CY=_b3VPeak.y+H*0.022,_b3CR=_b3VW*0.095;
    // Lueur de lave dans le cratère
    const _b3cg=c.createRadialGradient(_b3VPeak.x,_b3CY,0,_b3VPeak.x,_b3CY,_b3CR*2.8);
    _b3cg.addColorStop(0,'rgba(255,220,80,0.72)');
    _b3cg.addColorStop(0.18,'rgba(255,130,20,0.52)');
    _b3cg.addColorStop(0.42,'rgba(220,60,5,0.28)');
    _b3cg.addColorStop(0.75,'rgba(160,30,2,0.10)');
    _b3cg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b3cg;c.fillRect(0,0,W,H);
    // Bord du cratère (ellipse sombre avec liseré incandescent)
    c.fillStyle='rgba(10,2,1,0.80)';
    c.beginPath();c.ellipse(_b3VPeak.x,_b3CY,_b3CR,_b3CR*0.38,0,0,Math.PI*2);c.fill();
    c.strokeStyle='rgba(255,140,30,0.60)';c.lineWidth=1.5;
    c.beginPath();c.ellipse(_b3VPeak.x,_b3CY,_b3CR,_b3CR*0.38,0,0,Math.PI*2);c.stroke();
    // Coeur ultra-chaud
    c.fillStyle='rgba(255,250,180,0.55)';
    c.beginPath();c.ellipse(_b3VPeak.x,_b3CY,_b3CR*0.38,_b3CR*0.14,0,0,Math.PI*2);c.fill();

    // 4. PERSPECTIVE À POINT DE FUITE — fissures de lave au sol convergeant vers VP
    const _b3nFissures=9;
    for(let _b3i=0;_b3i<_b3nFissures;_b3i++){
      const _b3t=_b3i/(_b3nFissures-1);
      const _b3bx=_b3t*W,_b3by=H;
      const _b3vpOffX=(_b3()*2-1)*W*0.06;
      const _b3vpOffY=(_b3()*2-1)*H*0.04;
      const _b3vx2=_b3VPX+_b3vpOffX,_b3vy2=_b3HZ+H*0.12+_b3vpOffY;
      const _b3dist=Math.abs(_b3t-0.5)*2;
      const _b3fa=(0.28-_b3dist*0.20)*(_b3()*0.4+0.6);
      const _b3fg=c.createLinearGradient(_b3bx,_b3by,_b3vx2,_b3vy2);
      _b3fg.addColorStop(0,`rgba(255,80,8,${(_b3fa*0.55).toFixed(3)})`);
      _b3fg.addColorStop(0.45,`rgba(255,140,20,${(_b3fa).toFixed(3)})`);
      _b3fg.addColorStop(1,'rgba(255,200,60,0)');
      c.strokeStyle=_b3fg;
      c.lineWidth=Math.max(0.5,(1.8-_b3dist*1.2)*(1+_b3()*0.6));
      c.beginPath();c.moveTo(_b3bx,_b3by);
      const _b3mx=(_b3bx+_b3vx2)*0.5+(_b3()*2-1)*W*0.04;
      const _b3my=(_b3by+_b3vy2)*0.5+H*0.06;
      c.quadraticCurveTo(_b3mx,_b3my,_b3vx2,_b3vy2);
      c.stroke();
    }

    // 5. PLAINE VOLCANIQUE — lignes de perspective horizontal (sol)
    const _b3nLines=8;
    for(let _b3i=1;_b3i<=_b3nLines;_b3i++){
      const _b3lp=_b3i/_b3nLines;
      const _b3ly=_b3HZ+(_b3lp*_b3lp)*(H-_b3HZ)*0.92;
      const _b3la=(0.05+_b3lp*0.10)*(_b3()*0.3+0.7);
      c.strokeStyle=`rgba(180,55,8,${_b3la.toFixed(3)})`;
      c.lineWidth=Math.max(0.5,_b3lp*1.8);
      c.beginPath();c.moveTo(0,_b3ly);c.lineTo(W,_b3ly);c.stroke();
    }

    // 6. ROCHERS EN AVANT-PLAN avec ombres portées allongées
    const _b3nRocks=7;
    for(let _b3i=0;_b3i<_b3nRocks;_b3i++){
      const _b3rx=(_b3i/_b3nRocks+_b3()*0.04)*W+_b3()*W*0.06;
      const _b3ry=_b3HZ+H*0.28+_b3()*H*0.16;
      const _b3rw=(18+_b3()*38)*(0.5+(_b3ry-_b3HZ)/(H-_b3HZ));
      const _b3rh=_b3rw*(0.42+_b3()*0.28);
      // Ombre portée allongée
      const _b3sdx=_b3rw*1.8,_b3sdy=_b3rh*0.55;
      const _b3sG=c.createRadialGradient(_b3rx+_b3sdx*0.55,_b3ry+_b3sdy*0.9,2,_b3rx+_b3sdx*0.5,_b3ry+_b3sdy,_b3rw*1.4);
      _b3sG.addColorStop(0,'rgba(0,0,0,0.42)');
      _b3sG.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b3sG;
      c.beginPath();c.ellipse(_b3rx+_b3sdx*0.5,_b3ry+_b3sdy*0.55,_b3rw*1.55,_b3rh*0.38,0,0,Math.PI*2);c.fill();
      // Corps du rocher — face éclairée haut-gauche
      const _b3rockG=c.createRadialGradient(_b3rx-_b3rw*0.28,_b3ry-_b3rh*0.32,0,_b3rx,_b3ry,_b3rw*0.9);
      _b3rockG.addColorStop(0,'rgba(72,20,6,0.95)');
      _b3rockG.addColorStop(0.45,'rgba(40,10,3,0.97)');
      _b3rockG.addColorStop(1,'rgba(18,4,1,0.98)');
      c.fillStyle=_b3rockG;
      c.beginPath();c.ellipse(_b3rx,_b3ry,_b3rw,_b3rh,_b3()*0.6-0.3,0,Math.PI*2);c.fill();
      // Rim light magma (normal-map simulé)
      const _b3rlG=c.createRadialGradient(_b3rx-_b3rw*0.55,_b3ry-_b3rh*0.45,0,_b3rx-_b3rw*0.4,_b3ry-_b3rh*0.3,_b3rw*0.7);
      _b3rlG.addColorStop(0,'rgba(255,110,20,0.18)');
      _b3rlG.addColorStop(1,'rgba(255,80,10,0)');
      c.fillStyle=_b3rlG;
      c.beginPath();c.ellipse(_b3rx,_b3ry,_b3rw,_b3rh,_b3()*0.6-0.3,0,Math.PI*2);c.fill();
      // Craquelures de lave sub-pixel (détails 4K)
      c.strokeStyle='rgba(255,80,8,0.28)';c.lineWidth=0.8;
      for(let _b3ci=0;_b3ci<3;_b3ci++){
        const _b3cx0=_b3rx+(_b3()*2-1)*_b3rw*0.55,_b3cy0=_b3ry+(_b3()*2-1)*_b3rh*0.45;
        const _b3cx1=_b3cx0+(_b3()*2-1)*_b3rw*0.28,_b3cy1=_b3cy0+(_b3()*2-1)*_b3rh*0.22;
        c.beginPath();c.moveTo(_b3cx0,_b3cy0);c.lineTo(_b3cx1,_b3cy1);c.stroke();
      }
    }

    // 7. ATMOSPHERIC PERSPECTIVE — fumée volcanique désaturée vers l'horizon
    const _b3smokeHZ=c.createLinearGradient(0,_b3VPeak.y-H*0.05,0,_b3HZ);
    _b3smokeHZ.addColorStop(0,'rgba(0,0,0,0)');
    _b3smokeHZ.addColorStop(0.4,'rgba(30,12,6,0.06)');
    _b3smokeHZ.addColorStop(0.75,'rgba(50,18,8,0.14)');
    _b3smokeHZ.addColorStop(1,'rgba(80,28,10,0.22)');
    c.fillStyle=_b3smokeHZ;c.fillRect(0,_b3VPeak.y-H*0.05,W,_b3HZ-(_b3VPeak.y-H*0.05));
    // Volutes de fumée depuis le cratère (atmospheric depth haze)
    const _b3nSmoke=14;
    for(let _b3i=0;_b3i<_b3nSmoke;_b3i++){
      const _b3sp=_b3i/_b3nSmoke;
      const _b3sx=_b3VPeak.x+(_b3()*2-1)*_b3VW*0.12*_b3sp;
      const _b3sy=_b3VPeak.y-H*0.04-_b3sp*H*0.32;
      const _b3sr=(14+_b3sp*55)*(0.7+_b3()*0.6);
      const _b3smr=cl(50-_b3sp*32,0,255)|0,_b3smg=cl(18-_b3sp*12,0,255)|0,_b3smb=cl(10-_b3sp*6,0,255)|0;
      const _b3sa=(0.14-_b3sp*0.09)*(0.5+_b3()*0.5);
      if(_b3sa>0.005){
        const _b3smG=c.createRadialGradient(_b3sx,_b3sy,0,_b3sx,_b3sy,_b3sr);
        _b3smG.addColorStop(0,`rgba(${_b3smr},${_b3smg},${_b3smb},${_b3sa.toFixed(3)})`);
        _b3smG.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=_b3smG;c.beginPath();c.ellipse(_b3sx,_b3sy,_b3sr,_b3sr*0.52,(_b3()*2-1)*0.5,0,Math.PI*2);c.fill();
      }
    }

    // 8. DÉTAILS 4K — grain de cendres (< 1px) + veines de lave sub-pixel
    const _b3nAsh=220;
    for(let _b3i=0;_b3i<_b3nAsh;_b3i++){
      const _b3ax=_b3()*W,_b3ay=_b3()*H;
      const _b3ab=(0.06+_b3()*0.12)*(1-_b3ay/H*0.5);
      c.fillStyle=`rgba(90,30,8,${_b3ab.toFixed(3)})`;
      c.fillRect(_b3ax,_b3ay,_b3()*1.2+0.3,_b3()*1.2+0.3);
    }
    c.lineWidth=0.6;
    const _b3nVeins=18;
    for(let _b3i=0;_b3i<_b3nVeins;_b3i++){
      const _b3vx0=_b3()*W,_b3vy0=_b3HZ+_b3()*(H-_b3HZ)*0.85;
      const _b3vx1=_b3vx0+(_b3()*2-1)*40,_b3vy1=_b3vy0+(_b3()*2-1)*12;
      const _b3vbr=0.08+_b3()*0.14;
      c.strokeStyle=`rgba(255,70,5,${_b3vbr.toFixed(3)})`;
      c.beginPath();c.moveTo(_b3vx0,_b3vy0);
      c.quadraticCurveTo((_b3vx0+_b3vx1)/2+(_b3()*2-1)*8,(_b3vy0+_b3vy1)/2,_b3vx1,_b3vy1);
      c.stroke();
    }
  }
  // ── ti=8 PLAGE — coucher de soleil tropical, perspective océan, palmiers 3D ──
  if(ti===8){
    const _b8=seeded(ti*7919+W+H);
    const _b8HZ=H*0.52,_b8VPX=W*0.48;
    // 1. SOLEIL + halo radial multi-couches
    const _b8SX=W*0.62,_b8SY=_b8HZ-H*0.022;
    const _b8h1=c.createRadialGradient(_b8SX,_b8SY,0,_b8SX,_b8SY,H*0.72);
    _b8h1.addColorStop(0,'rgba(255,200,80,0.36)');_b8h1.addColorStop(0.12,'rgba(255,130,30,0.22)');
    _b8h1.addColorStop(0.30,'rgba(240,70,10,0.11)');_b8h1.addColorStop(0.55,'rgba(180,30,5,0.05)');
    _b8h1.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=_b8h1;c.fillRect(0,0,W,H);
    const _b8h2=c.createRadialGradient(_b8SX,_b8SY,0,_b8SX,_b8SY,H*0.22);
    _b8h2.addColorStop(0,'rgba(255,220,130,0.55)');_b8h2.addColorStop(0.35,'rgba(255,150,40,0.28)');
    _b8h2.addColorStop(0.70,'rgba(220,80,15,0.10)');_b8h2.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b8h2;c.fillRect(0,0,W,H);
    const _b8dg=c.createRadialGradient(_b8SX,_b8SY,0,_b8SX,_b8SY,H*0.048);
    _b8dg.addColorStop(0,'rgba(255,255,200,0.95)');_b8dg.addColorStop(0.28,'rgba(255,220,80,0.82)');
    _b8dg.addColorStop(0.62,'rgba(255,160,30,0.42)');_b8dg.addColorStop(1,'rgba(255,100,10,0)');
    c.fillStyle=_b8dg;c.beginPath();c.arc(_b8SX,_b8SY,H*0.048,0,Math.PI*2);c.fill();
    // 2. ATMOSPHERIC PERSPECTIVE — brume chaude sur l'horizon
    const _b8atg=c.createLinearGradient(0,_b8HZ-H*0.20,0,_b8HZ+H*0.06);
    _b8atg.addColorStop(0,'rgba(255,140,40,0)');_b8atg.addColorStop(0.42,'rgba(255,110,25,0.09)');
    _b8atg.addColorStop(0.72,'rgba(230,80,10,0.18)');_b8atg.addColorStop(1,'rgba(180,50,5,0.28)');
    c.fillStyle=_b8atg;c.fillRect(0,_b8HZ-H*0.20,W,H*0.26);
    // 3. OCEAN — perspective à point de fuite
    const _b8seg=c.createLinearGradient(0,_b8HZ,0,H);
    _b8seg.addColorStop(0,'rgba(200,90,20,0.55)');_b8seg.addColorStop(0.18,'rgba(140,50,10,0.45)');
    _b8seg.addColorStop(0.45,'rgba(60,20,4,0.60)');_b8seg.addColorStop(1,'rgba(20,6,1,0.80)');
    c.fillStyle=_b8seg;c.fillRect(0,_b8HZ,W,H-_b8HZ);
    // Vagues convergeant vers VP (distribution quadratique)
    for(let _b8i=1;_b8i<=14;_b8i++){
      const _b8p=_b8i/14,_b8p2=_b8p*_b8p;
      const _b8wy=_b8HZ+_b8p2*(H-_b8HZ)*0.94;
      const _b8wa=(0.03+_b8p*0.09)*(_b8()*0.3+0.7);
      c.strokeStyle=`rgba(${(220-_b8p*60)|0},${(110-_b8p*40)|0},${(25-_b8p*10)|0},${_b8wa.toFixed(3)})`;
      c.lineWidth=Math.max(0.4,_b8p2*2.2);c.beginPath();
      const _b8amp=_b8p*(H-_b8HZ)*0.012;
      for(let _b8x=0;_b8x<=W;_b8x+=4){
        const _b8yw=_b8wy+Math.sin(_b8x*0.022+_b8i*0.8)*_b8amp+Math.sin(_b8x*0.011+_b8i*0.5)*_b8amp*0.5;
        _b8x===0?c.moveTo(_b8x,_b8yw):c.lineTo(_b8x,_b8yw);
      }c.stroke();
    }
    // Lignes radiales de perspective sur l'eau
    for(let _b8i=0;_b8i<10;_b8i++){
      const _b8t=_b8i/10,_b8rBX=_b8t*W;
      const _b8pa=(0.03+Math.abs(0.5-_b8t)*0.06)*(_b8()*0.35+0.65);
      const _b8rg=c.createLinearGradient(_b8VPX,_b8HZ,_b8rBX,H);
      _b8rg.addColorStop(0,'rgba(255,160,50,0)');_b8rg.addColorStop(0.5,`rgba(200,100,20,${(_b8pa*0.55).toFixed(3)})`);
      _b8rg.addColorStop(1,`rgba(100,40,5,${_b8pa.toFixed(3)})`);
      c.strokeStyle=_b8rg;c.lineWidth=Math.max(0.3,(0.8+Math.abs(0.5-_b8t)*1.0)*(_b8()*0.4+0.6));
      c.beginPath();c.moveTo(_b8VPX,_b8HZ);c.lineTo(_b8rBX,H);c.stroke();
    }
    // Reflet solaire sur l'eau (colonne trapézoïdale)
    const _b8rfg=c.createLinearGradient(_b8SX,_b8HZ,_b8SX,H);
    _b8rfg.addColorStop(0,'rgba(255,200,80,0.28)');_b8rfg.addColorStop(0.28,'rgba(255,140,30,0.14)');
    _b8rfg.addColorStop(0.65,'rgba(200,80,10,0.06)');_b8rfg.addColorStop(1,'rgba(100,30,2,0)');
    c.fillStyle=_b8rfg;c.beginPath();
    c.moveTo(_b8SX-H*0.014,_b8HZ);c.lineTo(_b8SX+H*0.014,_b8HZ);
    c.lineTo(_b8SX+(H-_b8HZ)*0.38,H);c.lineTo(_b8SX-(H-_b8HZ)*0.38,H);c.closePath();c.fill();
    // 4. PARALLAXE COUCHE 1 — île lointaine désaturée (atmospheric depth haze)
    const _b8fHZ=_b8HZ-H*0.008;
    const _b8ipts=[];
    for(let _b8x=0;_b8x<=W;_b8x+=W/32){
      _b8ipts.push([_b8x,_b8fHZ-H*0.028*(0.3+0.7*Math.abs(Math.sin(_b8x*0.022+3.1)))-H*0.012*(0.5+0.5*Math.sin(_b8x*0.048+1.1))]);
    }
    c.fillStyle='rgba(130,55,15,0.32)';c.beginPath();c.moveTo(0,_b8HZ+2);
    _b8ipts.forEach(([_b8ix,_b8iy],_b8k)=>_b8k===0?c.moveTo(_b8ix,_b8iy):c.lineTo(_b8ix,_b8iy));
    c.lineTo(W,_b8HZ+2);c.closePath();c.fill();
    const _b8ihz=c.createLinearGradient(0,_b8fHZ-H*0.04,0,_b8fHZ+H*0.01);
    _b8ihz.addColorStop(0,'rgba(255,130,40,0)');_b8ihz.addColorStop(0.55,'rgba(220,90,20,0.12)');
    _b8ihz.addColorStop(1,'rgba(200,70,10,0.22)');c.fillStyle=_b8ihz;
    c.beginPath();c.moveTo(0,_b8fHZ-H*0.04);
    _b8ipts.forEach(([_b8ix,_b8iy],_b8k)=>_b8k===0?c.moveTo(_b8ix,_b8iy):c.lineTo(_b8ix,_b8iy));
    c.lineTo(W,_b8HZ+2);c.closePath();c.fill();
    // 5. PARALLAXE COUCHE 2 — dunes de sable (avant-plan)
    const _b8sY=H*0.72;
    const _b8sdg=c.createLinearGradient(0,_b8sY-H*0.06,0,H);
    _b8sdg.addColorStop(0,'rgba(0,0,0,0)');_b8sdg.addColorStop(0.12,'rgba(185,88,22,0.78)');
    _b8sdg.addColorStop(0.50,'rgba(155,65,14,0.90)');_b8sdg.addColorStop(1,'rgba(100,38,6,0.97)');
    const _b8dpts=[];
    for(let _b8x=0;_b8x<=W;_b8x+=W/22){
      _b8dpts.push([_b8x,_b8sY-H*0.055*(0.4+0.6*Math.sin(_b8x*0.018+0.4))-H*0.022*(0.5+0.5*Math.sin(_b8x*0.042+2.1))]);
    }
    c.fillStyle=_b8sdg;c.beginPath();c.moveTo(0,H);
    _b8dpts.forEach(([_b8dx,_b8dy],_b8k)=>_b8k===0?c.moveTo(_b8dx,_b8dy):c.lineTo(_b8dx,_b8dy));
    c.lineTo(W,H);c.closePath();c.fill();
    // Crête de dune — rim light chaud (normal-map simulé)
    c.strokeStyle='rgba(255,160,50,0.22)';c.lineWidth=1.8;c.beginPath();
    _b8dpts.forEach(([_b8dx,_b8dy],_b8k)=>_b8k===0?c.moveTo(_b8dx,_b8dy):c.lineTo(_b8dx,_b8dy));c.stroke();
    // Liseré d'écume sur le bord de l'eau
    const _b8foamY=_b8HZ+H*0.08;
    c.strokeStyle='rgba(255,220,180,0.20)';c.lineWidth=1.2;c.beginPath();
    for(let _b8x=0;_b8x<=W;_b8x+=3){
      const _b8fy=_b8foamY+Math.sin(_b8x*0.038+1.7)*H*0.006+Math.sin(_b8x*0.019)*H*0.004;
      _b8x===0?c.moveTo(_b8x,_b8fy):c.lineTo(_b8x,_b8fy);
    }c.stroke();
    // 6. PALMIERS — relief volumétrique + ombres portées allongées
    const _b8pXs=[W*0.05,W*0.16,W*0.74,W*0.84,W*0.94];
    const _b8pHs=[H*0.44,H*0.38,H*0.41,H*0.36,H*0.46];
    for(let _b8pi=0;_b8pi<5;_b8pi++){
      const _b8px=_b8pXs[_b8pi]+(_b8()*2-1)*W*0.025;
      const _b8pBy=_b8sY-H*0.022*(0.4+0.6*Math.sin(_b8px*0.018+0.4));
      const _b8pH=_b8pHs[_b8pi]*(0.82+_b8()*0.36);
      const _b8pTX=_b8px+(_b8()*2-1)*_b8pH*0.22,_b8pTY=_b8pBy-_b8pH;
      const _b8tw=Math.max(3,_b8pH*0.030);
      // Ombre portée allongée (direction opposée au soleil)
      const _b8shdx=(_b8px-_b8SX)*0.55,_b8shdy=(_b8pBy-_b8SY)*0.22;
      const _b8shg=c.createLinearGradient(_b8px,_b8pBy,_b8px+_b8shdx*1.4,_b8pBy+_b8shdy*1.4);
      _b8shg.addColorStop(0,'rgba(0,0,0,0.38)');_b8shg.addColorStop(0.45,'rgba(0,0,0,0.14)');
      _b8shg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=_b8shg;
      c.beginPath();c.moveTo(_b8px-_b8tw,_b8pBy);
      c.quadraticCurveTo(_b8px+_b8shdx*0.7+_b8tw*2,_b8pBy+_b8shdy*0.5+4,_b8px+_b8shdx*1.35,_b8pBy+_b8shdy*1.2);
      c.quadraticCurveTo(_b8px+_b8shdx*0.7-_b8tw*2,_b8pBy+_b8shdy*0.5+4,_b8px+_b8tw,_b8pBy);
      c.closePath();c.fill();
      // Tronc — normal-map simulé : face ombre (droite) + face éclairée (gauche)
      const _b8tsh=c.createLinearGradient(_b8px+_b8tw,_b8pBy,_b8pTX+_b8tw,_b8pTY);
      _b8tsh.addColorStop(0,'rgba(40,12,2,0.92)');_b8tsh.addColorStop(1,'rgba(28,8,1,0.95)');
      const _b8tlt=c.createLinearGradient(_b8px-_b8tw,_b8pBy,_b8pTX-_b8tw,_b8pTY);
      _b8tlt.addColorStop(0,'rgba(200,105,30,0.90)');_b8tlt.addColorStop(0.55,'rgba(155,72,16,0.88)');
      _b8tlt.addColorStop(1,'rgba(120,52,10,0.82)');
      c.strokeStyle=_b8tsh;c.lineWidth=_b8tw*2;c.lineCap='round';
      c.beginPath();c.moveTo(_b8px,_b8pBy);
      c.quadraticCurveTo(_b8px+(_b8pTX-_b8px)*0.42+_b8pH*0.04,_b8pBy-_b8pH*0.55,_b8pTX,_b8pTY);c.stroke();
      c.strokeStyle=_b8tlt;c.lineWidth=_b8tw*1.2;
      c.beginPath();c.moveTo(_b8px-_b8tw*0.4,_b8pBy);
      c.quadraticCurveTo(_b8px-_b8tw*0.3+(_b8pTX-_b8px)*0.42+_b8pH*0.04,_b8pBy-_b8pH*0.55,_b8pTX-_b8tw*0.5,_b8pTY);c.stroke();
      // Segments d'écorce sub-pixel (détails 4K)
      c.strokeStyle='rgba(80,28,5,0.28)';c.lineWidth=0.7;
      const _b8nBk=Math.max(5,(_b8pH/H*18)|0);
      for(let _b8bi=0;_b8bi<_b8nBk;_b8bi++){
        const _b8bt=(_b8bi+0.5)/_b8nBk;
        const _b8bx0=lerp(_b8px,_b8pTX,_b8bt),_b8by0=lerp(_b8pBy,_b8pTY,_b8bt);
        const _b8bw=_b8tw*(1-_b8bt*0.55);
        c.beginPath();c.moveTo(_b8bx0-_b8bw,_b8by0+_b8bw*0.3);
        c.quadraticCurveTo(_b8bx0,_b8by0-_b8bw*0.15,_b8bx0+_b8bw,_b8by0+_b8bw*0.3);c.stroke();
      }
      // Palmes — 7 feuilles rayonnantes avec normal-map soleil
      for(let _b8fi=0;_b8fi<7;_b8fi++){
        const _b8fa=(_b8fi/7)*Math.PI*2+_b8()*0.28;
        const _b8fl=_b8pH*(0.22+_b8()*0.14);
        const _b8fex=_b8pTX+Math.cos(_b8fa)*_b8fl,_b8fey=_b8pTY+Math.sin(_b8fa)*_b8fl*0.65+_b8fl*0.18;
        // Ombre de palme
        const _b8fsa=(0.15+Math.max(0,Math.sin(_b8fa))*0.12)*0.6;
        c.strokeStyle=`rgba(10,3,0,${_b8fsa.toFixed(2)})`;c.lineWidth=3.5;c.lineCap='round';
        c.beginPath();c.moveTo(_b8pTX+2,_b8pTY+3);
        c.quadraticCurveTo((_b8pTX+_b8fex)*0.5+2,(_b8pTY+_b8fey)*0.5+6,_b8fex+2,_b8fey+4);c.stroke();
        // Face éclairée/ombre selon angle face au soleil
        const _b8flit=Math.cos(_b8fa)*0.5+0.5;
        const _b8fRc=cl(30+_b8flit*35,0,255)|0,_b8fGc=cl(55+_b8flit*28,0,255)|0,_b8fBc=cl(5+_b8flit*5,0,255)|0;
        c.strokeStyle=`rgba(${_b8fRc},${_b8fGc},${_b8fBc},0.88)`;
        c.lineWidth=Math.max(1.2,3.5-_b8fl/H*18);c.lineCap='round';
        c.beginPath();c.moveTo(_b8pTX,_b8pTY);
        c.quadraticCurveTo((_b8pTX+_b8fex)*0.5+(_b8()*2-1)*_b8fl*0.12,(_b8pTY+_b8fey)*0.5-_b8fl*0.08,_b8fex,_b8fey);c.stroke();
        // Veinure centrale (détail 4K sub-pixel 0.7px)
        c.strokeStyle=`rgba(${cl(_b8fRc+30,0,255)},${cl(_b8fGc+20,0,255)},${_b8fBc},0.45)`;c.lineWidth=0.7;
        c.beginPath();c.moveTo(_b8pTX,_b8pTY);
        c.quadraticCurveTo((_b8pTX+_b8fex)*0.5+(_b8()*2-1)*_b8fl*0.08,(_b8pTY+_b8fey)*0.5-_b8fl*0.06,_b8fex,_b8fey);c.stroke();
      }
    }
    // 7. GRAIN DE SABLE 4K — micro-texture sub-pixel < 1.5px
    for(let _b8i=0;_b8i<280;_b8i++){
      const _b8gx=_b8()*W,_b8gy=_b8sY+_b8()*(H-_b8sY);
      const _b8gdp=(_b8gy-_b8sY)/(H-_b8sY);
      const _b8ga=(0.07+_b8()*0.15)*(0.3+_b8gdp*0.7);
      const _b8gsz=(_b8()*1.2+0.3)*(0.3+_b8gdp*0.8);
      c.fillStyle=`rgba(${(200+(_b8()*30)|0)},${(95+(_b8()*20)|0)},${(18+(_b8()*10)|0)},${_b8ga.toFixed(3)})`;
      c.fillRect(_b8gx,_b8gy,_b8gsz,_b8gsz*0.6);
    }
    // 8. MOUSSE D'ECUME sub-pixel sur bord de l'eau
    for(let _b8i=0;_b8i<90;_b8i++){
      const _b8fmx=_b8()*W;
      const _b8fmy=_b8foamY+Math.sin(_b8fmx*0.038+1.7)*H*0.006+(_b8()*2-1)*H*0.010;
      c.fillStyle=`rgba(255,220,180,${(0.08+_b8()*0.14).toFixed(3)})`;
      c.beginPath();c.arc(_b8fmx,_b8fmy,1.2+_b8()*1.8,0,Math.PI*2);c.fill();
    }
    // 9. GOD RAYS depuis le soleil (triangles fins, gradient sub-pixel)
    for(let _b8i=0;_b8i<9;_b8i++){
      const _b8ra=(_b8i/9)*Math.PI*2+_b8()*0.2;
      const _b8rl=(0.45+_b8()*0.42)*Math.max(W,H);
      const _b8rex=_b8SX+Math.cos(_b8ra)*_b8rl,_b8rey=_b8SY+Math.sin(_b8ra)*_b8rl;
      const _b8rw2=3+_b8()*18;
      const _b8rop=(0.018+_b8()*0.030)*(_b8ra>Math.PI*0.3&&_b8ra<Math.PI*0.9?0.4:1.0);
      if(_b8rop<0.005)continue;
      const _b8rgd=c.createLinearGradient(_b8SX,_b8SY,_b8rex,_b8rey);
      _b8rgd.addColorStop(0,`rgba(255,210,90,${(_b8rop*1.8).toFixed(3)})`);
      _b8rgd.addColorStop(0.18,`rgba(255,160,40,${_b8rop.toFixed(3)})`);
      _b8rgd.addColorStop(0.55,`rgba(220,100,20,${(_b8rop*0.4).toFixed(3)})`);
      _b8rgd.addColorStop(1,'rgba(150,50,5,0)');
      const _b8rnx=-Math.sin(_b8ra),_b8rny=Math.cos(_b8ra);
      c.fillStyle=_b8rgd;c.beginPath();
      c.moveTo(_b8SX+_b8rnx*_b8rw2*0.3,_b8SY+_b8rny*_b8rw2*0.3);
      c.lineTo(_b8SX-_b8rnx*_b8rw2*0.3,_b8SY-_b8rny*_b8rw2*0.3);
      c.lineTo(_b8rex-_b8rnx*_b8rw2,_b8rey-_b8rny*_b8rw2);
      c.lineTo(_b8rex+_b8rnx*_b8rw2,_b8rey+_b8rny*_b8rw2);
      c.closePath();c.fill();
    }
  }
  // ── ti=4 NUIT — ville nocturne 3D, lune, gratte-ciel, projecteurs ──
  if(ti===4){
    const _b4=seeded(ti*7919+W+H);
    // Lune avec halo radial
    const _b4mx=W*0.78,_b4my=H*0.15;
    const _b4halo=c.createRadialGradient(_b4mx,_b4my,0,_b4mx,_b4my,H*0.22);
    _b4halo.addColorStop(0,'rgba(255,248,220,0.14)');_b4halo.addColorStop(0.4,'rgba(220,210,180,0.05)');_b4halo.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b4halo;c.fillRect(0,0,W,H);
    const _b4disc=c.createRadialGradient(_b4mx-H*0.012,_b4my-H*0.012,0,_b4mx,_b4my,H*0.055);
    _b4disc.addColorStop(0,'rgba(255,255,240,0.96)');_b4disc.addColorStop(0.55,'rgba(240,235,200,0.88)');_b4disc.addColorStop(1,'rgba(200,190,150,0.60)');
    c.fillStyle=_b4disc;c.beginPath();c.arc(_b4mx,_b4my,H*0.055,0,Math.PI*2);c.fill();
    // 14 bâtiments avec fenêtres allumées
    const _b4bldgs=[];
    for(let _b4i=0;_b4i<14;_b4i++){
      const _b4bx=(_b4i/13)*W*0.97+_b4()*W*0.06-W*0.02;
      const _b4bh=H*(0.14+_b4()*0.30);
      const _b4bw=16+_b4()*42;
      const _b4by=H-_b4bh;
      _b4bldgs.push({x:_b4bx,y:_b4by,w:_b4bw,h:_b4bh});
      const _b4bg=c.createLinearGradient(_b4bx,_b4by,_b4bx,H);
      _b4bg.addColorStop(0,'rgba(14,20,36,0.96)');_b4bg.addColorStop(1,'rgba(8,12,22,0.99)');
      c.fillStyle=_b4bg;c.fillRect(_b4bx,_b4by,_b4bw,_b4bh);
      // Liseré rim-light gauche
      c.strokeStyle='rgba(70,95,155,0.20)';c.lineWidth=1;
      c.beginPath();c.moveTo(_b4bx,H);c.lineTo(_b4bx,_b4by);c.stroke();
      // Fenêtres allumées (grille)
      const _b4cols=Math.max(1,Math.floor(_b4bw/10));
      const _b4rows=Math.max(1,Math.floor(_b4bh/12));
      const _b4winCols=['rgba(255,228,145,0.75)','rgba(175,215,255,0.65)','rgba(255,198,100,0.60)'];
      for(let _b4wr=0;_b4wr<_b4rows;_b4wr++)for(let _b4wc=0;_b4wc<_b4cols;_b4wc++){
        if(_b4()>0.55)continue;
        c.fillStyle=_b4winCols[Math.floor(_b4()*3)];
        c.fillRect(_b4bx+_b4wc*10+2,_b4by+_b4wr*12+3,3,2);
      }
    }
    // Lueur de skyline sur horizon
    const _b4hzg=c.createLinearGradient(0,H*0.55,0,H*0.72);
    _b4hzg.addColorStop(0,'rgba(35,55,120,0)');_b4hzg.addColorStop(0.45,'rgba(35,55,120,0.10)');_b4hzg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b4hzg;c.fillRect(0,H*0.55,W,H*0.17);
    // 3 projecteurs depuis le sol
    [[W*0.20,W*0.22],[W*0.50,W*0.48],[W*0.78,W*0.80]].forEach(([ox])=>{
      const _b4sg=c.createLinearGradient(ox,H,ox,H*0.06);
      _b4sg.addColorStop(0,'rgba(180,205,255,0.09)');_b4sg.addColorStop(0.6,'rgba(140,175,255,0.04)');_b4sg.addColorStop(1,'rgba(110,150,255,0)');
      c.fillStyle=_b4sg;c.beginPath();c.moveTo(ox-4,H);c.lineTo(ox+4,H);c.lineTo(ox+28,H*0.06);c.lineTo(ox-28,H*0.06);c.closePath();c.fill();
    });
    // Brume basse
    const _b4mg=c.createLinearGradient(0,H*0.80,0,H);
    _b4mg.addColorStop(0,'rgba(20,30,62,0)');_b4mg.addColorStop(1,'rgba(20,30,62,0.32)');
    c.fillStyle=_b4mg;c.fillRect(0,H*0.80,W,H*0.20);
  }
  // ── ti=6 COSMOS — nébuleuse 3D, galaxie, planète gazeuse ──
  if(ti===6){
    const _b6=seeded(ti*7919+W+H);
    // Bande de la Voie Lactée diagonale
    const _b6mwg=c.createLinearGradient(0,H*0.18,W,H*0.62);
    _b6mwg.addColorStop(0,'rgba(120,80,180,0.06)');_b6mwg.addColorStop(0.5,'rgba(200,160,255,0.10)');_b6mwg.addColorStop(1,'rgba(80,60,140,0.05)');
    c.fillStyle=_b6mwg;
    c.beginPath();c.moveTo(0,H*0.10);c.lineTo(W,H*0.55);c.lineTo(W,H*0.70);c.lineTo(0,H*0.25);c.closePath();c.fill();
    // 3 couches de nébuleuse
    [[W*0.30,H*0.35,H*0.38,'rgba(80,20,160,0.12)'],[W*0.65,H*0.55,H*0.32,'rgba(0,40,180,0.10)'],[W*0.50,H*0.20,H*0.28,'rgba(160,0,120,0.09)']].forEach(([nx,ny,nr,col])=>{
      const _b6ng=c.createRadialGradient(nx,ny,0,nx,ny,nr);
      _b6ng.addColorStop(0,col);_b6ng.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b6ng;c.fillRect(0,0,W,H);
    });
    // 80 étoiles variées (seeded)
    for(let _b6i=0;_b6i<80;_b6i++){
      const _b6sx=_b6()*W,_b6sy=_b6()*H*0.88,_b6sz=0.5+_b6()*2.5;
      const _b6br=120+_b6()*135|0,_b6big=_b6()<0.12;
      if(_b6big){
        c.fillStyle=`rgba(${Math.min(255,_b6br+60)},${Math.min(255,_b6br+40)},${Math.min(255,_b6br+80)},0.90)`;
        c.beginPath();c.arc(_b6sx,_b6sy,_b6sz,0,Math.PI*2);c.fill();
        c.strokeStyle=`rgba(${Math.min(255,_b6br+40)},${Math.min(255,_b6br+20)},${Math.min(255,_b6br+60)},0.32)`;
        c.lineWidth=0.5;
        c.beginPath();c.moveTo(_b6sx-_b6sz*3,_b6sy);c.lineTo(_b6sx+_b6sz*3,_b6sy);c.stroke();
        c.beginPath();c.moveTo(_b6sx,_b6sy-_b6sz*3);c.lineTo(_b6sx,_b6sy+_b6sz*3);c.stroke();
      }else{
        c.fillStyle=`rgba(${_b6br},${Math.max(0,_b6br-20)},${Math.min(255,_b6br+30)},${(0.5+_b6()*0.5).toFixed(2)})`;
        c.beginPath();c.arc(_b6sx,_b6sy,_b6sz,0,Math.PI*2);c.fill();
      }
    }
    // Planète gazeuse avec anneau
    const _b6px=W*0.72,_b6py=H*0.22,_b6pr=H*0.075;
    const _b6atm=c.createRadialGradient(_b6px,_b6py+H*0.012,0,_b6px,_b6py,_b6pr*1.45);
    _b6atm.addColorStop(0,'rgba(220,180,100,0.14)');_b6atm.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b6atm;c.fillRect(0,0,W,H);
    // Anneau (ellipse)
    c.save();c.beginPath();c.ellipse(_b6px,_b6py+H*0.012,_b6pr*1.75,_b6pr*0.33,0,0,Math.PI*2);
    c.strokeStyle='rgba(180,140,80,0.32)';c.lineWidth=H*0.010;c.stroke();c.restore();
    // Corps planète
    const _b6pg=c.createRadialGradient(_b6px-_b6pr*0.25,_b6py-_b6pr*0.22,0,_b6px,_b6py,_b6pr);
    _b6pg.addColorStop(0,'rgba(220,185,115,0.90)');_b6pg.addColorStop(0.6,'rgba(170,120,65,0.88)');_b6pg.addColorStop(1,'rgba(100,68,36,0.82)');
    c.fillStyle=_b6pg;c.beginPath();c.arc(_b6px,_b6py,_b6pr,0,Math.PI*2);c.fill();
    // Profondeur atmosphérique en bas
    const _b6dg=c.createLinearGradient(0,H*0.76,0,H);
    _b6dg.addColorStop(0,'rgba(10,5,30,0)');_b6dg.addColorStop(1,'rgba(10,5,30,0.52)');
    c.fillStyle=_b6dg;c.fillRect(0,H*0.76,W,H*0.24);
  }
  // ── ti=7 ENCHANTÉ — forêt magique 3D, cristaux, brume ──
  if(ti===7){
    const _b7=seeded(ti*7919+W+H);
    // Lueur céleste radiale au centre-haut
    const _b7sg=c.createRadialGradient(W/2,0,0,W/2,0,H*0.62);
    _b7sg.addColorStop(0,'rgba(60,20,120,0.22)');_b7sg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b7sg;c.fillRect(0,0,W,H);
    // 20 orbes bokeh lointains
    const _b7bokeh=['#6020C0','#20A080','#C06020','#4080FF'];
    for(let _b7i=0;_b7i<20;_b7i++){
      const _b7bx=_b7()*W,_b7by=_b7()*H*0.72,_b7br=8+_b7()*26;
      const _b7col=_b7bokeh[Math.floor(_b7()*4)];
      const _b7or=hr(_b7col),_b7og=hg(_b7col),_b7ob=hb(_b7col);
      const _b7bg=c.createRadialGradient(_b7bx,_b7by,0,_b7bx,_b7by,_b7br);
      _b7bg.addColorStop(0,`rgba(${_b7or},${_b7og},${_b7ob},0.18)`);_b7bg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b7bg;c.beginPath();c.arc(_b7bx,_b7by,_b7br,0,Math.PI*2);c.fill();
    }
    // 6 silhouettes d'arbres magiques
    const _b7txs=[W*0.02,W*0.14,W*0.28,W*0.68,W*0.82,W*0.96];
    const _b7aura=['rgba(100,0,180,0.11)','rgba(0,160,120,0.10)','rgba(180,100,0,0.09)'];
    _b7txs.forEach((_b7tx,_b7ti2)=>{
      const _b7th=H*(0.40+_b7()*0.22);
      const _b7tby=H,_b7tty=H-_b7th;
      const _b7offset=(_b7()*2-1)*_b7th*0.12;
      // Ombre portée
      const _b7aurg=c.createRadialGradient(_b7tx+_b7offset,_b7tty,0,_b7tx+_b7offset,_b7tty,_b7th*0.35);
      const _b7ac=_b7aura[_b7ti2%3];
      _b7aurg.addColorStop(0,_b7ac);_b7aurg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b7aurg;c.fillRect(0,0,W,H);
      // Tronc
      const _b7tw=3+_b7()*5;
      c.strokeStyle='rgba(18,7,36,0.90)';c.lineWidth=_b7tw*2;c.lineCap='round';
      c.beginPath();c.moveTo(_b7tx,_b7tby);c.lineTo(_b7tx+_b7offset,_b7tty+_b7th*0.12);c.stroke();
      // Canopée
      c.fillStyle='rgba(5,18,10,0.84)';
      c.beginPath();c.ellipse(_b7tx+_b7offset,_b7tty+_b7th*0.10,_b7th*0.18,_b7th*0.28,0,0,Math.PI*2);c.fill();
      // Points lumineux sur canopée (3 par arbre)
      const _b7dcols=['#A040FF','#40FFB0','#FF8040'];
      for(let _b7d=0;_b7d<3;_b7d++){
        const _b7dx=_b7tx+_b7offset+(_b7()*2-1)*_b7th*0.12,_b7dy=_b7tty+_b7()*_b7th*0.18;
        c.shadowColor=_b7dcols[_b7d%3];c.shadowBlur=8;
        c.fillStyle=_b7dcols[_b7d%3];c.beginPath();c.arc(_b7dx,_b7dy,2+_b7()*2,0,Math.PI*2);c.fill();
      }
      c.shadowBlur=0;
    });
    // 3 formations de cristaux en avant-plan
    [W*0.12,W*0.45,W*0.78].forEach((_b7cx,_b7ci)=>{
      for(let _b7s=0;_b7s<4;_b7s++){
        const _b7sh=28+_b7()*32,_b7sw=7+_b7()*8;
        const _b7sx=_b7cx+(_b7s-1.5)*(_b7sw+4);
        const _b7sy=H-_b7sh;
        const _b7cg=c.createLinearGradient(_b7sx,_b7sy,_b7sx,H);
        _b7cg.addColorStop(0,'rgba(120,80,220,0.82)');_b7cg.addColorStop(1,'rgba(40,20,80,0.72)');
        c.fillStyle=_b7cg;
        c.beginPath();c.moveTo(_b7sx,_b7sy);c.lineTo(_b7sx-_b7sw/2,H);c.lineTo(_b7sx+_b7sw/2,H);c.closePath();c.fill();
        c.strokeStyle='rgba(180,140,255,0.50)';c.lineWidth=1;c.stroke();
        // Lueur interne du cristal
        const _b7tipcol=c.createRadialGradient(_b7sx,_b7sy,0,_b7sx,_b7sy,_b7sw*1.2);
        _b7tipcol.addColorStop(0,'rgba(200,180,255,0.32)');_b7tipcol.addColorStop(1,'rgba(0,0,0,0)');
        c.fillStyle=_b7tipcol;c.beginPath();c.arc(_b7sx,_b7sy,_b7sw*1.2,0,Math.PI*2);c.fill();
      }
    });
    // 3 couches de brume au sol
    [[H*0.72,W*0.80,'rgba(80,20,160,0.07)'],[H*0.82,W*0.90,'rgba(40,10,100,0.09)'],[H*0.91,W*1.02,'rgba(20,5,60,0.11)']].forEach(([_b7my,_b7mw,_b7mc])=>{
      const _b7mg=c.createRadialGradient(W/2,_b7my,10,W/2,_b7my,_b7mw/2);
      _b7mg.addColorStop(0,_b7mc);_b7mg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b7mg;c.beginPath();c.ellipse(W/2,_b7my,_b7mw/2,28+_b7()*18,0,0,Math.PI*2);c.fill();
    });
  }
  // ── ti=0 JUNGLE — canopée tropical, arbres 3 profondeurs, lumière filtrée ──
  if(ti===0){
    const _b0=seeded(ti*7919+W+H);
    // Warm canopy light filter
    const _b0sky=c.createLinearGradient(0,0,0,H*0.50);
    _b0sky.addColorStop(0,'rgba(40,120,20,0.38)');_b0sky.addColorStop(0.55,'rgba(20,80,10,0.18)');_b0sky.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b0sky;c.fillRect(0,0,W,H*0.50);
    // 5 diagonal light shafts through canopy
    for(let _b0i=0;_b0i<5;_b0i++){
      const _b0rx=_b0()*W*0.85+W*0.06,_b0rw=6+_b0()*18;
      const _b0rg=c.createLinearGradient(_b0rx,0,_b0rx+H*0.18,H*0.65);
      _b0rg.addColorStop(0,`rgba(200,255,120,${(0.045+_b0()*0.065).toFixed(3)})`);
      _b0rg.addColorStop(0.55,`rgba(160,230,80,${(0.018+_b0()*0.025).toFixed(3)})`);
      _b0rg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b0rg;c.beginPath();
      c.moveTo(_b0rx-_b0rw,0);c.lineTo(_b0rx+_b0rw,0);
      c.lineTo(_b0rx+_b0rw+H*0.18,H*0.65);c.lineTo(_b0rx-_b0rw+H*0.18,H*0.65);
      c.closePath();c.fill();
    }
    // 20 bokeh light spots (dappled sunlight)
    for(let _b0i=0;_b0i<20;_b0i++){
      const _b0lx=_b0()*W,_b0ly=_b0()*H*0.58,_b0lr=6+_b0()*32;
      const _b0lg=c.createRadialGradient(_b0lx,_b0ly,0,_b0lx,_b0ly,_b0lr);
      _b0lg.addColorStop(0,`rgba(210,255,130,${(0.06+_b0()*0.09).toFixed(3)})`);
      _b0lg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b0lg;c.beginPath();c.ellipse(_b0lx,_b0ly,_b0lr,_b0lr*0.55,_b0()*Math.PI,0,Math.PI*2);c.fill();
    }
    // Far canopy silhouette — tight irregular peaks at top
    c.fillStyle='rgba(6,28,8,0.68)';
    c.beginPath();c.moveTo(0,0);c.lineTo(0,H*0.15*(0.3+0.7*Math.abs(Math.sin(0.022+1.1))));
    for(let _b0x=W/26;_b0x<=W+2;_b0x+=W/26){
      const _b0dy=H*(0.06+0.09*Math.abs(Math.sin(_b0x*0.022+1.1))+0.03*Math.abs(Math.sin(_b0x*0.044+0.4)));
      c.lineTo(_b0x,_b0dy);
    }
    c.lineTo(W,0);c.closePath();c.fill();
    // Mid canopy — taller, wider crowns
    c.fillStyle='rgba(4,22,6,0.75)';
    c.beginPath();c.moveTo(0,0);c.lineTo(0,H*(0.12+0.16*Math.abs(Math.sin(0.018+2.2))));
    for(let _b0x=W/20;_b0x<=W+2;_b0x+=W/20){
      const _b0dy=H*(0.12+0.16*Math.abs(Math.sin(_b0x*0.018+2.2))+0.06*Math.abs(Math.sin(_b0x*0.036+1.0)));
      c.lineTo(_b0x,_b0dy);
    }
    c.lineTo(W,0);c.closePath();c.fill();
    // 4 mid-depth trees — trunk + dual-crown ellipse
    [W*0.09,W*0.24,W*0.70,W*0.88].forEach((_b0tx,_b0tii)=>{
      const _b0th=H*(0.36+_b0()*0.22),_b0tw=5+_b0()*9;
      const _b0tg=c.createLinearGradient(_b0tx,H,_b0tx,H-_b0th);
      _b0tg.addColorStop(0,'rgba(10,4,2,0.72)');_b0tg.addColorStop(1,'rgba(18,8,3,0.32)');
      c.fillStyle=_b0tg;c.fillRect(_b0tx-_b0tw/2,H-_b0th,_b0tw,_b0th);
      const _b0cr=32+_b0()*42,_b0cy=H-_b0th+_b0cr*0.18;
      c.fillStyle='rgba(3,18,5,0.68)';
      c.beginPath();c.ellipse(_b0tx,_b0cy,_b0cr*0.78,_b0cr*0.58,0,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(3,16,4,0.55)';
      c.beginPath();c.ellipse(_b0tx+_b0cr*0.22,_b0cy-_b0cr*0.20,_b0cr*0.55,_b0cr*0.42,0.3,0,Math.PI*2);c.fill();
      // Aura verte
      const _b0ag=c.createRadialGradient(_b0tx,_b0cy,3,_b0tx,_b0cy,_b0cr*1.1);
      _b0ag.addColorStop(0,'rgba(18,75,10,0.11)');_b0ag.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b0ag;c.beginPath();c.arc(_b0tx,_b0cy,_b0cr*1.1,0,Math.PI*2);c.fill();
    });
    // Ground dark mossy
    const _b0gg=c.createLinearGradient(0,H*0.78,0,H);
    _b0gg.addColorStop(0,'rgba(0,0,0,0)');_b0gg.addColorStop(0.18,'rgba(4,18,4,0.58)');_b0gg.addColorStop(1,'rgba(2,10,2,0.84)');
    c.fillStyle=_b0gg;c.fillRect(0,H*0.78,W,H*0.22);
    // 3 foreground tree silhouettes (full height)
    [W*0.02,W*0.50,W*0.96].forEach(_b0ftx=>{
      const _b0fth=H*(0.58+_b0()*0.20),_b0ftw=8+_b0()*18;
      c.fillStyle='rgba(2,12,3,0.84)';c.fillRect(_b0ftx-_b0ftw/2,H-_b0fth,_b0ftw,_b0fth);
      const _b0fcr=50+_b0()*55,_b0fcy=H-_b0fth+_b0fcr*0.28;
      c.fillStyle='rgba(2,10,3,0.78)';
      c.beginPath();c.ellipse(_b0ftx,_b0fcy,_b0fcr*0.88,_b0fcr*0.62,0,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(1,8,2,0.65)';
      c.beginPath();c.ellipse(_b0ftx+_b0fcr*0.28,_b0fcy-_b0fcr*0.18,_b0fcr*0.62,_b0fcr*0.48,0.35,0,Math.PI*2);c.fill();
    });
    // Mid-ground moisture haze
    const _b0mist=c.createLinearGradient(0,H*0.62-H*0.06,0,H*0.62+H*0.10);
    _b0mist.addColorStop(0,'rgba(0,0,0,0)');_b0mist.addColorStop(0.45,'rgba(28,72,18,0.07)');_b0mist.addColorStop(1,'rgba(10,45,8,0.14)');
    c.fillStyle=_b0mist;c.fillRect(0,H*0.56,W,H*0.16);
    // Sub-pixel leaf texture 4K
    for(let _b0i=0;_b0i<65;_b0i++){
      const _b0lx=_b0()*W,_b0ly=_b0()*H*0.50;
      c.fillStyle=`rgba(${(38+_b0()*28)|0},${(115+_b0()*55)|0},${(18+_b0()*18)|0},${(0.12+_b0()*0.18).toFixed(2)})`;
      c.fillRect(_b0lx,_b0ly,_b0()*1.4+0.3,_b0()*1.4+0.3);
    }
  }
  // ── ti=2 OCÉAN — scène sous-marine, coraux, caustiques, profondeur ──
  if(ti===2){
    const _b2=seeded(ti*7919+W+H);
    // Deep underwater gradient
    const _b2dg=c.createLinearGradient(0,0,0,H);
    _b2dg.addColorStop(0,'rgba(0,100,170,0.22)');_b2dg.addColorStop(0.38,'rgba(0,55,110,0.20)');
    _b2dg.addColorStop(0.72,'rgba(0,22,65,0.30)');_b2dg.addColorStop(1,'rgba(0,6,32,0.48)');
    c.fillStyle=_b2dg;c.fillRect(0,0,W,H);
    // Surface water (top of screen)
    const _b2surfY=H*0.09;
    const _b2sg=c.createLinearGradient(0,0,0,_b2surfY+H*0.10);
    _b2sg.addColorStop(0,'rgba(80,190,255,0.22)');_b2sg.addColorStop(0.38,'rgba(40,140,220,0.10)');_b2sg.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b2sg;c.fillRect(0,0,W,_b2surfY+H*0.10);
    // Surface wave silhouette
    c.strokeStyle='rgba(120,215,255,0.22)';c.lineWidth=1.5;
    c.beginPath();
    for(let _b2x=0;_b2x<=W;_b2x+=5){
      const _b2wy=_b2surfY+Math.sin(_b2x*0.026+1.1)*H*0.009+Math.sin(_b2x*0.014+0.5)*H*0.005;
      _b2x===0?c.moveTo(_b2x,_b2wy):c.lineTo(_b2x,_b2wy);
    }c.stroke();
    // 5 underwater god ray columns (static)
    for(let _b2i=0;_b2i<5;_b2i++){
      const _b2rx=(_b2i/4)*W*0.88+W*0.06;
      const _b2rg=c.createLinearGradient(_b2rx,_b2surfY,_b2rx+H*0.10,H*0.72);
      _b2rg.addColorStop(0,`rgba(120,220,255,${(0.05+_b2()*0.05).toFixed(3)})`);
      _b2rg.addColorStop(0.55,`rgba(80,170,240,${(0.02+_b2()*0.025).toFixed(3)})`);
      _b2rg.addColorStop(1,'rgba(0,0,0,0)');
      const _b2rw=10+_b2()*22;
      c.fillStyle=_b2rg;c.beginPath();
      c.moveTo(_b2rx-_b2rw,_b2surfY);c.lineTo(_b2rx+_b2rw,_b2surfY);
      c.lineTo(_b2rx+_b2rw+H*0.10,H*0.72);c.lineTo(_b2rx-_b2rw+H*0.10,H*0.72);
      c.closePath();c.fill();
    }
    // 18 caustic light ellipses near floor
    const _b2cfloor=H*0.73;
    for(let _b2i=0;_b2i<18;_b2i++){
      const _b2cx=_b2()*W*0.92+W*0.04,_b2cy=_b2cfloor+_b2()*H*0.22;
      const _b2cr=10+_b2()*38,_b2ca=0.04+_b2()*0.07;
      const _b2cg=c.createRadialGradient(_b2cx,_b2cy,0,_b2cx,_b2cy,_b2cr);
      _b2cg.addColorStop(0,`rgba(90,195,255,${_b2ca.toFixed(3)})`);_b2cg.addColorStop(1,'rgba(0,0,0,0)');
      c.fillStyle=_b2cg;c.beginPath();c.ellipse(_b2cx,_b2cy,_b2cr,_b2cr*0.42,_b2()*Math.PI,0,Math.PI*2);c.fill();
    }
    // Sea floor
    const _b2floor=c.createLinearGradient(0,_b2cfloor-H*0.02,0,H);
    _b2floor.addColorStop(0,'rgba(0,0,0,0)');_b2floor.addColorStop(0.16,'rgba(8,26,48,0.55)');_b2floor.addColorStop(1,'rgba(3,12,25,0.80)');
    c.fillStyle=_b2floor;c.fillRect(0,_b2cfloor,W,H-_b2cfloor);
    // Sand ripple lines (sub-pixel HiDPI)
    for(let _b2i=0;_b2i<8;_b2i++){
      const _b2sy=_b2cfloor+H*0.04+_b2()*H*0.18;
      c.strokeStyle=`rgba(60,130,175,${(0.04+_b2()*0.05).toFixed(3)})`;c.lineWidth=0.6;
      c.beginPath();
      for(let _b2x=0;_b2x<=W;_b2x+=8){
        const _b2wy=_b2sy+Math.sin(_b2x*0.032+_b2i*1.0)*H*0.003;
        _b2x===0?c.moveTo(_b2x,_b2wy):c.lineTo(_b2x,_b2wy);
      }c.stroke();
    }
    // 12 coral formations
    const _b2coralY=H*0.76;
    const _b2cols=['rgba(255,78,58,0.65)','rgba(255,138,78,0.62)','rgba(195,55,175,0.58)','rgba(72,195,155,0.62)','rgba(255,175,55,0.60)'];
    for(let _b2i=0;_b2i<12;_b2i++){
      const _b2cx=(_b2i/12+_b2()*0.03)*W+_b2()*W*0.03;
      const _b2ch=H*(0.042+_b2()*0.095),_b2cw=4+_b2()*10;
      const _b2cc=_b2cols[_b2i%_b2cols.length];
      c.fillStyle=_b2cc;c.fillRect(_b2cx-_b2cw/2,_b2coralY-_b2ch,_b2cw,_b2ch);
      // 3 branches
      for(let _b2b=0;_b2b<3;_b2b++){
        const _b2bh=_b2coralY-_b2ch*(0.28+_b2b*0.22);
        const _b2bx=_b2cx+(_b2()*2-1)*_b2cw*1.6,_b2bw=Math.max(2,_b2cw*0.55);
        c.fillRect(_b2bx-_b2bw/2,_b2bh,_b2bw,_b2ch*0.35);
        c.beginPath();c.arc(_b2bx,_b2bh,_b2bw*0.9,0,Math.PI*2);c.fill();
      }
      c.beginPath();c.arc(_b2cx,_b2coralY-_b2ch,_b2cw,0,Math.PI*2);c.fill();
    }
    // 5 rocks with algae
    for(let _b2i=0;_b2i<5;_b2i++){
      const _b2rx=(_b2i/5+_b2()*0.08)*W,_b2ry=H*(0.64+_b2()*0.13);
      const _b2rw=18+_b2()*55,_b2rh=_b2rw*(0.35+_b2()*0.28);
      c.fillStyle='rgba(4,14,28,0.62)';
      c.beginPath();c.ellipse(_b2rx,_b2ry,_b2rw,_b2rh,_b2()*0.5-0.25,0,Math.PI*2);c.fill();
      c.fillStyle=`rgba(8,${(75+_b2()*38)|0},${(55+_b2()*28)|0},0.38)`;
      c.beginPath();c.ellipse(_b2rx,_b2ry-_b2rh*0.52,_b2rw*0.38,_b2rh*0.20,0,0,Math.PI*2);c.fill();
    }
    // Centre depth bloom
    const _b2bloom=c.createRadialGradient(W*0.5,H*0.44,H*0.04,W*0.5,H*0.44,H*0.58);
    _b2bloom.addColorStop(0,'rgba(0,55,115,0.08)');_b2bloom.addColorStop(1,'rgba(0,0,0,0)');
    c.fillStyle=_b2bloom;c.fillRect(0,0,W,H);
  }
  // Vignette
  const vg=c.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,0.45)');
  c.fillStyle=vg;c.fillRect(0,0,W,H);
  return oc;
}

// ─── THEME FX ─────────────────────────────────────────────────────────────────
function initFx(ti){
  const fx={ti};
  switch(ti){
    case 0:fx.leaves=Array.from({length:20},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(0.3,0.9),vx:rnd(-0.25,0.25),ang:rnd(0,360),vrot:rnd(-1.2,1.2),sz:rnd(5,12),wave:rnd(0,Math.PI*2),col:rndc(['#2A8020','#3AA030','#48C040'])}));fx.glows=Array.from({length:14},()=>({x:rnd(0,W),y:rnd(H*0.42,H*0.92),vx:rnd(-0.18,0.18),vy:rnd(-0.22,0.08),ph:rnd(0,Math.PI*2),psp:rnd(0.0016,0.004),sz:rnd(2.2,5.5),col:rndc(['#A8FF60','#C0FF40','#70FF90','#E8FF80'])}));fx.mist=Array.from({length:6},()=>({x:rnd(-120,W+120),y:rnd(H*0.72,H*0.96),w:rnd(130,260),h:rnd(22,48),vx:rnd(0.08,0.22),a:rnd(0.04,0.10),ph:rnd(0,Math.PI*2)}));break;
    case 1:{
      // Grains de sable avec z-depth (3 couches de profondeur)
      fx._fXgrains=Array.from({length:72},()=>{const z=rnd(0.08,1.0);return{x:rnd(0,W),y:rnd(0,H),z,vx:rnd(0.6,1.8)*(0.15+z*0.9),vy:rnd(-0.06,0.06)*z,sz:rnd(0.4,1.0)*(0.2+z*0.85),a:rnd(0.10,0.28)*(0.25+z*0.8)};});
      // Source soleil (position fixe, utilisée pour les god rays)
      fx._fXsunX=W*0.76; fx._fXsunY=H*0.20;
      // God rays — 8 rayons volumétriques partant du soleil
      fx._fXrays=Array.from({length:8},()=>({ang:rnd(-0.55,0.55)+Math.PI*0.5,len:rnd(0.52,0.92),w:rnd(14,42),ph:rnd(0,Math.PI*2),sp:rnd(0.0004,0.0009),a:rnd(0.025,0.055)}));
      // Colonnes de chaleur (heat shimmer) — lignes verticales ondulantes
      fx._fXheat=Array.from({length:9},()=>({x:rnd(W*0.04,W*0.96),vy:rnd(-0.35,-0.18),a:rnd(0.03,0.07),ph:rnd(0,Math.PI*2),h:rnd(H*0.18,H*0.36),w:rnd(6,18)}));
      // Particules de poussière lointaines (dust devils) — très lentes, lointain
      fx._fXdust=Array.from({length:16},()=>({x:rnd(0,W),y:rnd(H*0.38,H*0.72),vx:rnd(0.08,0.28),vy:rnd(-0.05,0.04),sz:rnd(3,8),a:rnd(0.025,0.06),ph:rnd(0,Math.PI*2)}));
      break;}

    case 2:{
      // Bulles avec z-depth : z=0 lointain (petit/transparent), z=1 proche (grand/opaque)
      fx.bubbles=Array.from({length:28},()=>{const z=rnd(0.05,1.0);return{x:rnd(0,W),y:rnd(H*0.35,H),z,vy:rnd(-0.12,-0.04)*(0.15+z*0.9),vx:rnd(-0.08,0.08),sz:rnd(1.2,2.8)*(0.18+z*0.88),a:rnd(0.10,0.25)*(0.25+z*0.78),wave:rnd(0,Math.PI*2),trail:[]};});
      // God rays sous-marins : colonnes de lumière solaire ondulantes venant d'en haut
      fx._fXwRays=Array.from({length:7},()=>({x:rnd(W*0.05,W*0.95),w:rnd(18,44),ph:rnd(0,Math.PI*2),sp:rnd(0.00028,0.00065),a:rnd(0.022,0.052)}));
      // Surface de l'eau pour les reflets dynamiques (y de la ligne de surface)
      fx._fXsurfY=H*0.08;
      // Reflets : copies miroir des bulles proches, légèrement décalées et déformées
      fx._fXreflect=[];
      // Phase d'oscillation globale de la surface
      fx._fXwPh=0;
      fx.wo=0;
      // Bancs de poissons (3 bancs, chacun 8 individus)
      fx._fXfish=Array.from({length:3},()=>({
        x:rnd(0,W),y:rnd(H*0.22,H*0.75),
        vx:rnd(0.4,1.1)*(Math.random()<0.5?1:-1),
        col:rndc(['#60D0FF','#40A0FF','#80FFD0','#A080FF']),
        members:Array.from({length:8},(_,mi)=>({ox:mi*12-42,oy:(mi%3-1)*10,ph:rnd(0,Math.PI*2)}))
      }));
      break;}

    case 3:{
      // Braises classiques (inchangées)
      fx.embers=Array.from({length:30},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(-1.2,-0.3),vx:rnd(-0.35,0.35),sz:rnd(1,3.5),life:rnd(0,120),ml:120,rc:rndc([255,255,200]),gc_:rndc([80,140,40])}));
      // Source du cratère (point de fuite des god rays)
      fx._fXcrX=W*0.54; fx._fXcrY=H*0.155;
      // God rays volcaniques — 10 rayons partant du cratère
      fx._fXvolRays=Array.from({length:10},()=>({
        ang:rnd(-Math.PI*0.72,-Math.PI*0.28), // demi-cercle supérieur autour du cratère
        len:rnd(0.38,0.75),                    // longueur relative à H
        w:rnd(18,52),                          // largeur de base
        ph:rnd(0,Math.PI*2),                   // phase d'animation
        sp:rnd(0.00035,0.00075),               // vitesse de pulsation
        a:rnd(0.028,0.068)                     // alpha de base
      }));
      // Cendres volcaniques avec z-depth — 3 couches (0=lointain / 1=proche)
      fx._fXash=Array.from({length:55},()=>{
        const z=rnd(0.06,1.0);
        return{
          x:rnd(0,W),
          y:rnd(0,H),
          z,
          vx:rnd(-0.35,0.35)*(0.12+z*0.8),
          vy:rnd(-0.85,-0.12)*(0.15+z*0.85),  // les cendres proches montent plus vite
          sz:rnd(0.5,1.2)*(0.18+z*0.88),       // taille proportionnelle au z-depth
          a:rnd(0.08,0.24)*(0.22+z*0.82),      // opacité proportionnelle au z-depth
          ph:rnd(0,Math.PI*2),
          life:rnd(0,180), ml:180
        };
      });
      // Nuages de fumée volumétriques — montant lentement du cratère, grossissant
      fx._fXsmoke=Array.from({length:9},()=>({
        x:W*0.54+rnd(-W*0.04,W*0.04),
        y:rnd(H*0.10,H*0.52),
        vy:rnd(-0.28,-0.10),
        vx:rnd(-0.18,0.18),
        r:rnd(18,52),
        a:rnd(0.035,0.080),
        ph:rnd(0,Math.PI*2),
        grow:rnd(0.06,0.14)   // expansion progressive
      }));
      break;}

    case 4:{
      fx.stars=Array.from({length:120},()=>({x:rnd(0,W),y:rnd(0,H*0.78),br:rnd(80,210),ph:rnd(0,Math.PI*2),sp:rnd(0.002,0.006),sz:Math.random()<0.18?2:1}));
      fx.shoot=null;fx.st=rnd(80,200);
      fx._fX4wins=Array.from({length:30},()=>({x:rnd(W*0.03,W*0.94),y:rnd(H*0.40,H*0.72),w:rnd(3,7),h:rnd(2,5),ph:rnd(0,Math.PI*2),sp:rnd(0.001,0.006),col:rndc(['#FFE090','#B0D0FF','#FFB060']),on:Math.random()<0.65}));
      fx._fX4lights=[{ox:W*0.22,ang:-Math.PI*0.72,sp:0.00035,ph:0},{ox:W*0.78,ang:-Math.PI*0.28,sp:0.00028,ph:Math.PI}];
      fx._fX4bats=Array.from({length:8},()=>({x:rnd(-60,W+60),y:rnd(H*0.08,H*0.38),vx:rnd(0.5,1.8)*(Math.random()<0.5?1:-1),ph:rnd(0,Math.PI*2),sz:rnd(6,12)}));
      break;}
    case 5:fx.snow=Array.from({length:35},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(0.25,0.9),vx:rnd(-0.25,0.25),sz:rnd(2.5,8),rot:rnd(0,360),vrot:rnd(-0.8,0.8),a:rnd(0.35,0.85)}));fx.ao=0;break;
    case 6:{
      fx._fX6layers=[
        Array.from({length:80},()=>({x:rnd(0,W),y:rnd(0,H),sz:rnd(0.4,0.9),br:rnd(100,180),ph:rnd(0,Math.PI*2),sp:rnd(0.002,0.004),vx:0.04})),
        Array.from({length:50},()=>({x:rnd(0,W),y:rnd(0,H),sz:rnd(0.8,1.6),br:rnd(140,220),ph:rnd(0,Math.PI*2),sp:rnd(0.003,0.006),vx:0.10})),
        Array.from({length:25},()=>({x:rnd(0,W),y:rnd(0,H),sz:rnd(1.4,2.8),br:rnd(180,255),ph:rnd(0,Math.PI*2),sp:rnd(0.004,0.009),vx:0.22}))
      ];
      fx.nebula=Array.from({length:5},()=>({x:rnd(W*0.1,W*0.9),y:rnd(H*0.1,H*0.9),r:rnd(55,130),col:rndc(['#3808A0','#700850','#0838A0','#501878']),a:rnd(0.05,0.12),vx:rnd(-0.04,0.04),vy:rnd(-0.03,0.03)}));
      fx._fX6meteors=[];fx._fX6meteorT=rnd(180,360);
      fx.comet=null;fx.ct=rnd(140,320);
      break;}
    case 7:{
      // Lucioles avec z-depth (profondeur simulée 0=lointain, 1=proche)
      fx._fXflies=Array.from({length:28},()=>{const z=rnd(0.05,1.0);return{x:rnd(0,W),y:rnd(H*0.15,H*0.92),z,vx:rnd(-0.18,0.18)*(0.2+z*0.9),vy:rnd(-0.22,0.22)*(0.2+z*0.9),ph:rnd(0,Math.PI*2),psp:rnd(0.0015,0.0045),col:rndc(['#40F060','#80F040','#40FFBC','#60FFD0','#B0FF60']),trail:[]};});
      // Spores bioluminescentes z-depth — montant lentement, bloom 4K
      fx._fXspores=Array.from({length:18},()=>{const z=rnd(0.05,0.85);return{x:rnd(0,W),y:rnd(H*0.3,H),z,vy:rnd(-0.08,0.0)*(0.15+z*0.6),vx:rnd(-0.06,0.06),ph:rnd(0,Math.PI*2),sz:rnd(0.8,2.2)*(0.3+z*0.7),a:rnd(0.18,0.55)*(0.3+z*0.7)};});
      // Couches de feuillage en parallaxe — 3 profondeurs
      fx._fXleaves=Array.from({length:24},()=>{const z=rndc([0.12,0.12,0.38,0.38,0.38,0.72,0.72,1.0]);return{x:rnd(-30,W+30),y:rnd(H*0.04,H*0.88),z,vx:rnd(0.04,0.10)*(0.08+z*0.7),vy:rnd(0.02,0.08)*(0.1+z*0.5),ang:rnd(0,Math.PI*2),vrot:rnd(-0.008,0.008)*(0.5+z),sz:rnd(4,9)*(0.2+z*0.8),wave:rnd(0,Math.PI*2),col:rndc(['#1A6018','#28801E','#38A028','#509030','#206828'])};});
      // God ray — rayon lunaire volumétrique traversant la canopée
      fx._fXmoonRay={x:W*rnd(0.25,0.72),w:rnd(32,62),a:0,ph:rnd(0,Math.PI*2)};
      // Sol sombre — y référence pour ombres dynamiques
      fx._fXgroundY=H*0.90;
      break;}

    case 8:fx.wo=0;fx.birds=Array.from({length:5},()=>({x:rnd(0,W),y:rnd(H*0.06,H*0.30),vx:rnd(0.5,1.2)*(Math.random()<0.5?1:-1),phase:rnd(0,Math.PI*2),sz:rnd(6,14)}));fx.jelly=Array.from({length:6},()=>({x:rnd(0,W),y:rnd(H*0.35,H*0.82),vx:rnd(-0.14,0.14),vy:rnd(-0.22,-0.07),sz:rnd(14,30),ph:rnd(0,Math.PI*2),psp:rnd(0.0018,0.004),col:rndc(['#FF80C0','#80D0FF','#A060FF','#60FFD0','#FFB040']),tph:Array.from({length:4},()=>rnd(0,Math.PI*2))}));fx._b8glitter=Array.from({length:22},()=>({x:rnd(0,W),y:rnd(H*0.52,H*0.88),ph:rnd(0,Math.PI*2),sp:rnd(0.004,0.010),sz:rnd(1.2,3.5)}));break;
    case 9:fx.vehicles=Array.from({length:5},()=>({x:rnd(-120,-10),y:rnd(H*0.22,H*0.57),vx:rnd(2.8,7.0),col:rndc(['#00DDFF','#FF40A0','#FF8020','#A040FF','#40FFD0']),sz:rnd(2.5,5.5),trail:rnd(28,60)}));fx.rain=Array.from({length:55},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(7,15),len:rnd(8,20),a:rnd(0.06,0.15)}));fx.wins=Array.from({length:85},()=>({x:rnd(4,W-4),y:rnd(H*0.10,H*0.59),w:rnd(4,9),h:rnd(3,7),col:rndc(['#00DDFF','#A040FF','#FFD080']),ph:rnd(0,Math.PI*2),sp:rnd(0.002,0.009),on:Math.random()<0.65}));fx.holo=0;fx.gY=H*0.62;fx._n9signs=Array.from({length:3},(_,si)=>({x:W*(0.18+si*0.28),y:H*(0.12+si*0.06),w:W*0.18,h:H*0.055,col:rndc(['#00DDFF','#FF40A0','#A040FF']),ph:rnd(0,Math.PI*2),sp:rnd(0.003,0.008),flicker:0,flickerT:0}));break;
  }
  return fx;
}

function drawFx(ctx,fx,t){
  if(!fx)return;
  const th=THEMES[fx.ti];
  switch(fx.ti){
    case 0:{
      // ── JUNGLE — god rays, z-depth feuilles, lucioles, brume ──

      // 1. GOD RAYS à travers la canopée — rayons diagonaux animés
      ctx.save();
      fx.mist.forEach((m,_mi)=>{
        const _ray_x=m.x*0.85+W*0.08,_ray_w=10+_mi*7;
        const pulse=0.5+0.5*Math.abs(Math.sin(t*0.00042+_mi*1.8));
        const _rg=ctx.createLinearGradient(_ray_x,0,_ray_x+H*0.16,H*0.62);
        _rg.addColorStop(0,`rgba(185,255,110,${(0.038*pulse).toFixed(3)})`);
        _rg.addColorStop(0.5,`rgba(150,230,80,${(0.018*pulse).toFixed(3)})`);
        _rg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=_rg;ctx.beginPath();
        ctx.moveTo(_ray_x-_ray_w,0);ctx.lineTo(_ray_x+_ray_w,0);
        ctx.lineTo(_ray_x+_ray_w+H*0.16,H*0.62);ctx.lineTo(_ray_x-_ray_w+H*0.16,H*0.62);
        ctx.closePath();ctx.fill();
      });
      ctx.restore();

      // 2. Brume de sol — ellipses ondulantes (fond, avant les feuilles)
      fx.mist.forEach(m=>{m.x=(m.x+m.vx);if(m.x>W+m.w){m.x=-m.w;m.y=rnd(H*0.72,H*0.96);}
        const wave=Math.sin(t*0.00065+m.ph)*m.h*0.28;
        const mg=ctx.createRadialGradient(m.x,m.y+wave,2,m.x,m.y+wave,m.w*0.55);
        mg.addColorStop(0,`rgba(175,238,150,${(m.a).toFixed(3)})`);
        mg.addColorStop(0.6,`rgba(110,195,90,${(m.a*0.42).toFixed(3)})`);
        mg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=mg;ctx.beginPath();ctx.ellipse(m.x,m.y+wave,m.w*0.55,m.h,0,0,Math.PI*2);ctx.fill();
      });

      // 3. Feuilles z-depth — triées lointain→proche, taille+alpha selon z
      ctx.save();
      fx.leaves.sort((a,b)=>(a.sz-b.sz));
      fx.leaves.forEach(lf=>{
        lf.x+=lf.vx+Math.sin(t*0.001+lf.wave)*0.32;lf.y+=lf.vy;lf.ang+=lf.vrot;lf.wave+=0.018;
        if(lf.y>H+18){lf.y=-15;lf.x=Math.random()*W;}
        const a2=lf.ang*Math.PI/180,sz=lf.sz;
        const zFactor=cl((sz-5)/7,0,1); // 0=lointain 1=proche
        ctx.globalAlpha=0.25+0.35*zFactor;
        ctx.fillStyle=lf.col;
        ctx.beginPath();
        ctx.moveTo(lf.x+Math.cos(a2)*sz,lf.y+Math.sin(a2)*sz);
        ctx.lineTo(lf.x+Math.cos(a2+2.1)*sz*0.5,lf.y+Math.sin(a2+2.1)*sz*0.5);
        ctx.lineTo(lf.x,lf.y);ctx.closePath();ctx.fill();
        // Vein sub-pixel sur feuilles proches
        if(zFactor>0.6){
          ctx.globalAlpha=0.12*zFactor;
          ctx.strokeStyle=`rgba(80,180,40,0.7)`;ctx.lineWidth=0.5;
          ctx.beginPath();ctx.moveTo(lf.x,lf.y);ctx.lineTo(lf.x+Math.cos(a2)*sz,lf.y+Math.sin(a2)*sz);ctx.stroke();
        }
      });
      ctx.globalAlpha=1;ctx.restore();

      // 4. Lucioles pulsantes (bloom cinématographique)
      fx.glows.forEach(gl=>{
        gl.x+=gl.vx+Math.sin(t*0.0009+gl.ph)*0.38;gl.y+=gl.vy+Math.cos(t*0.0007+gl.ph*1.3)*0.22;gl.ph+=gl.psp;
        if(gl.x<-12)gl.x=W+12;if(gl.x>W+12)gl.x=-12;
        if(gl.y<H*0.35)gl.vy=Math.abs(gl.vy)*0.6+0.05;
        if(gl.y>H+10){gl.y=rnd(H*0.42,H*0.92);gl.x=rnd(0,W);}
        const pulse=0.45+0.55*Math.abs(Math.sin(t*gl.psp*2.8+gl.ph));
        // Aura bloom (shadowBlur simulé par gradient)
        const gr=ctx.createRadialGradient(gl.x,gl.y,0,gl.x,gl.y,gl.sz*5.5);
        gr.addColorStop(0,hexA(gl.col,0.68*pulse));gr.addColorStop(0.38,hexA(gl.col,0.16*pulse));gr.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=gr;ctx.beginPath();ctx.arc(gl.x,gl.y,gl.sz*5.5,0,Math.PI*2);ctx.fill();
        // Core bright dot
        ctx.save();ctx.shadowColor=gl.col;ctx.shadowBlur=gl.sz*4;
        ctx.fillStyle=hexA(gl.col,0.92*pulse);ctx.beginPath();ctx.arc(gl.x,gl.y,gl.sz*0.75,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;ctx.restore();
      });
      break;}
    case 1:{
      const _fXsX=fx._fXsunX,_fXsY=fx._fXsunY;

      // 1. GOD RAYS VOLUMÉTRIQUES — rayons du soleil désertique (en premier, sous tout)
      ctx.save();
      fx._fXrays.forEach(ray=>{
        const pulse=0.55+0.45*Math.abs(Math.sin(t*ray.sp*1.7+ray.ph));
        const ang=ray.ang+Math.sin(t*ray.sp+ray.ph)*0.18;
        const endX=_fXsX+Math.cos(ang)*ray.len*H;
        const endY=_fXsY+Math.sin(ang)*ray.len*H;
        const halfW=ray.w*0.5;
        const perpX=-Math.sin(ang),perpY=Math.cos(ang);
        // Dégradé le long du rayon — lumineux près du soleil, s'efface vers l'extrémité
        const rg=ctx.createLinearGradient(_fXsX,_fXsY,endX,endY);
        rg.addColorStop(0,`rgba(255,220,80,${(ray.a*pulse*1.4).toFixed(3)})`);
        rg.addColorStop(0.18,`rgba(255,190,55,${(ray.a*pulse).toFixed(3)})`);
        rg.addColorStop(0.55,`rgba(240,155,30,${(ray.a*pulse*0.38).toFixed(3)})`);
        rg.addColorStop(1,'rgba(200,110,10,0)');
        ctx.fillStyle=rg;
        ctx.beginPath();
        ctx.moveTo(_fXsX+perpX*halfW*0.22,_fXsY+perpY*halfW*0.22);
        ctx.lineTo(_fXsX-perpX*halfW*0.22,_fXsY-perpY*halfW*0.22);
        ctx.lineTo(endX-perpX*ray.w*(1.5+pulse*0.8),endY-perpY*ray.w*(1.5+pulse*0.8));
        ctx.lineTo(endX+perpX*ray.w*(1.5+pulse*0.8),endY+perpY*ray.w*(1.5+pulse*0.8));
        ctx.closePath();ctx.fill();
      });
      ctx.restore();

      // 2. SOLEIL avec halo bloom cinématographique (shadowBlur 28-40px)
      ctx.save();
      // Halo externe large — subsurface scattering atmosphérique
      const _fXsg1=ctx.createRadialGradient(_fXsX,_fXsY,8,_fXsX,_fXsY,H*0.30);
      _fXsg1.addColorStop(0,'rgba(255,230,100,0.22)');_fXsg1.addColorStop(0.3,'rgba(255,180,40,0.08)');_fXsg1.addColorStop(1,'rgba(255,120,0,0)');
      ctx.fillStyle=_fXsg1;ctx.beginPath();ctx.arc(_fXsX,_fXsY,H*0.30,0,Math.PI*2);ctx.fill();
      // Halo intermédiaire chaud
      const _fXsg2=ctx.createRadialGradient(_fXsX,_fXsY,4,_fXsX,_fXsY,46);
      _fXsg2.addColorStop(0,'rgba(255,245,140,0.95)');_fXsg2.addColorStop(0.55,'rgba(255,195,55,0.30)');_fXsg2.addColorStop(1,'rgba(255,140,20,0)');
      ctx.shadowColor='rgba(255,210,60,0.9)';ctx.shadowBlur=36;
      ctx.fillStyle=_fXsg2;ctx.beginPath();ctx.arc(_fXsX,_fXsY,46,0,Math.PI*2);ctx.fill();
      // Disque solaire net
      ctx.shadowBlur=0;
      const _fXsd=ctx.createRadialGradient(_fXsX-4,_fXsY-4,0,_fXsX,_fXsY,17);
      _fXsd.addColorStop(0,'rgba(255,255,220,1)');_fXsd.addColorStop(0.6,'rgba(255,220,80,1)');_fXsd.addColorStop(1,'rgba(255,180,30,0.9)');
      ctx.shadowColor='rgba(255,230,80,0.85)';ctx.shadowBlur=28;
      ctx.fillStyle=_fXsd;ctx.beginPath();ctx.arc(_fXsX,_fXsY,17,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.restore();

      // 3. DUST DEVILS — nuages de poussière lointains (depth of field : flous via alpha faible)
      fx._fXdust.forEach(d=>{
        d.x+=d.vx+Math.sin(t*0.00055+d.ph)*0.22;
        d.y+=d.vy+Math.cos(t*0.00042+d.ph*1.4)*0.12;
        if(d.x>W+d.sz*2){d.x=-d.sz*2;}
        if(d.y<H*0.30||d.y>H*0.78){d.vy*=-1;}
        const pulse=0.55+0.45*Math.abs(Math.sin(t*0.00095+d.ph));
        // Gradient radial doux — depth of field simulé (éléments lointains = très transparents)
        const dg=ctx.createRadialGradient(d.x,d.y,0,d.x,d.y,d.sz*3.2);
        dg.addColorStop(0,`rgba(195,155,75,${(d.a*pulse).toFixed(3)})`);
        dg.addColorStop(0.5,`rgba(175,130,55,${(d.a*pulse*0.4).toFixed(3)})`);
        dg.addColorStop(1,'rgba(155,110,35,0)');
        ctx.fillStyle=dg;ctx.beginPath();ctx.ellipse(d.x,d.y,d.sz*3.2,d.sz*1.8,0,0,Math.PI*2);ctx.fill();
      });

      // 4. COLONNES DE CHALEUR (heat shimmer) — lignes verticales ondulantes près de l'horizon
      ctx.save();
      fx._fXheat.forEach(hc=>{
        hc.ph+=0.011;
        const baseY=H*0.56+Math.sin(t*0.00038+hc.ph)*H*0.04;
        const sway=Math.sin(t*0.00095+hc.ph*2.2)*hc.w*0.55;
        // Colonne de distorsion thermique — dégradé vertical, plus opaque à la base
        const hg2=ctx.createLinearGradient(hc.x+sway,baseY,hc.x+sway*0.4,baseY-hc.h);
        hg2.addColorStop(0,`rgba(255,185,55,${(hc.a*1.1).toFixed(3)})`);
        hg2.addColorStop(0.45,`rgba(240,155,35,${(hc.a*0.55).toFixed(3)})`);
        hg2.addColorStop(1,'rgba(220,130,20,0)');
        ctx.strokeStyle=hg2;ctx.lineWidth=0.8;
        ctx.beginPath();
        ctx.moveTo(hc.x+sway,baseY);
        ctx.bezierCurveTo(
          hc.x+sway+Math.sin(t*0.0007+hc.ph)*hc.w*0.7,baseY-hc.h*0.35,
          hc.x+sway*0.5+Math.cos(t*0.00055+hc.ph+1)*hc.w*0.55,baseY-hc.h*0.68,
          hc.x+sway*0.2,baseY-hc.h
        );
        ctx.stroke();
      });
      ctx.restore();

      // 5. GRAINS DE SABLE z-depth — triés par z (lointain → proche), taille+opacité selon z
      fx._fXgrains.sort((a,b)=>a.z-b.z);
      ctx.save();
      fx._fXgrains.forEach(g=>{
        g.x=(g.x+g.vx);if(g.x>W+2)g.x=-2;
        g.y+=g.vy+Math.sin(t*0.0018+g.x*0.012)*0.08*g.z;
        // Couleur chaude — les grains proches sont plus saturés/foncés
        const warm=185+g.z*30|0,mid=140+g.z*15|0,cool=55+g.z*10|0;
        ctx.fillStyle=`rgba(${warm},${mid},${cool},${g.a.toFixed(3)})`;
        // Depth of field : grains lointains (z<0.3) dessinés avec un trait fin
        if(g.z<0.3){
          // Arrière-plan : très petits, trail ultra-fin HiDPI (lineWidth 0.5px)
          ctx.fillRect(g.x,g.y,g.sz*0.6,g.sz*0.6);
        } else if(g.z<0.65){
          // Plan intermédiaire
          ctx.beginPath();ctx.arc(g.x,g.y,g.sz,0,Math.PI*2);ctx.fill();
        } else {
          // Premier plan : plus grands, bloom léger
          ctx.shadowColor=`rgba(210,165,75,${(g.a*0.7).toFixed(3)})`;ctx.shadowBlur=g.sz*3.5;
          ctx.beginPath();ctx.arc(g.x,g.y,g.sz*1.15,0,Math.PI*2);ctx.fill();
          ctx.shadowBlur=0;
          // Trail ultra-fin HiDPI — sillon du grain dans le vent
          ctx.strokeStyle=`rgba(${warm},${mid},${cool},${(g.a*0.28).toFixed(3)})`;
          ctx.lineWidth=0.5;
          ctx.beginPath();ctx.moveTo(g.x,g.y);ctx.lineTo(g.x-g.vx*4.5,g.y);ctx.stroke();
        }
      });
      ctx.restore();
      break;}

    case 2:{
      // ── OCÉAN — god rays, z-depth bulles, reflets dynamiques, trails HiDPI ──
      fx.wo+=0.012;
      fx._fXwPh+=0.008;

      // 1. GOD RAYS SOUS-MARINS — colonnes de lumière solaire ondulantes (dessinées en premier)
      ctx.save();
      ctx.globalCompositeOperation='screen';
      fx._fXwRays.forEach(ray=>{
        const pulse=0.52+0.48*Math.abs(Math.sin(t*ray.sp+ray.ph));
        const sway=Math.sin(t*ray.sp*1.4+ray.ph)*ray.w*0.55;
        const rx=ray.x+sway;
        // Rayon lumineux du haut (surface) vers le bas (fond) — s'élargit en descendant
        const rg=ctx.createLinearGradient(rx,fx._fXsurfY,rx,H);
        rg.addColorStop(0,`rgba(120,210,255,${(ray.a*pulse*1.5).toFixed(3)})`);
        rg.addColorStop(0.28,`rgba(80,185,240,${(ray.a*pulse).toFixed(3)})`);
        rg.addColorStop(0.65,`rgba(40,155,210,${(ray.a*pulse*0.38).toFixed(3)})`);
        rg.addColorStop(1,'rgba(0,80,160,0)');
        ctx.fillStyle=rg;
        const halfTop=ray.w*0.35,halfBot=ray.w*(1.6+pulse*0.7);
        ctx.beginPath();
        ctx.moveTo(rx-halfTop,fx._fXsurfY);
        ctx.lineTo(rx+halfTop,fx._fXsurfY);
        ctx.lineTo(rx+halfBot+sway*0.4,H);
        ctx.lineTo(rx-halfBot+sway*0.4,H);
        ctx.closePath();ctx.fill();
      });
      ctx.globalCompositeOperation='source-over';
      ctx.restore();

      // 2. VAGUES DE SURFACE (inchangées, 3 couches)
      [[16,1.0,0.09,H-44],[11,1.3,0.16,H-27],[7,1.6,0.24,H-11]].forEach(([amp,sp,a,yb])=>{
        ctx.fillStyle=hexA(th.dc,a);ctx.beginPath();ctx.moveTo(0,H);
        for(let wx=0;wx<=W+8;wx+=6){const wy=yb+amp*Math.sin(wx*0.012+fx.wo*sp);wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}
        ctx.lineTo(W,H);ctx.closePath();ctx.fill();
      });

      // 3. REFLETS DYNAMIQUES DE SURFACE — miroir eau qui ondule au-dessus des bulles proches
      // On dessine les reflets des bulles z>0.55 projetées sur la surface supérieure
      ctx.save();
      fx.bubbles.filter(b=>b.z>0.55&&b.y>fx._fXsurfY).forEach(b=>{
        // Position miroir : symétrie par rapport à surfY, avec distorsion sinusoïdale
        const distort=Math.sin(t*0.0018+b.x*0.022+fx._fXwPh)*b.sz*1.8;
        const ry=fx._fXsurfY-(b.y-fx._fXsurfY)*0.18+distort; // reflet très proche de la surface
        if(ry<0||ry>fx._fXsurfY+H*0.12)return;
        // L'alpha du reflet décroît avec la distance à la surface
        const dist=b.y-fx._fXsurfY;
        const rAlpha=cl(b.a*(0.28-dist/(H*0.8)),0,0.22);
        if(rAlpha<0.005)return;
        // Reflet = ellipse aplatie horizontalement (perspective eau)
        const rg=ctx.createRadialGradient(b.x+distort*0.5,ry,0,b.x+distort*0.5,ry,b.sz*(1.4+b.z));
        rg.addColorStop(0,`rgba(160,230,255,${rAlpha.toFixed(3)})`);
        rg.addColorStop(0.5,`rgba(100,200,240,${(rAlpha*0.45).toFixed(3)})`);
        rg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=rg;
        ctx.beginPath();ctx.ellipse(b.x+distort*0.5,ry,b.sz*(1.2+b.z),b.sz*(0.28+b.z*0.18),0,0,Math.PI*2);ctx.fill();
      });
      ctx.restore();

      // 4. BULLES z-depth — triées lointain→proche, taille+opacité selon profondeur
      fx.bubbles.sort((a,b)=>a.z-b.z);
      ctx.save();
      fx.bubbles.forEach(b=>{
        b.x+=b.vx+Math.sin(t*0.001+b.wave)*0.25*(0.3+b.z*0.8);
        b.y+=b.vy;
        b.wave+=0.013;
        if(b.y<-b.sz*2){
          b.y=H+b.sz;b.x=rnd(0,W);
          b.vy=rnd(-0.12,-0.04)*(0.15+b.z*0.9);
        }
        // Trail ultra-fin HiDPI (0.5px) pour les bulles proches
        b.trail.push({x:b.x,y:b.y});if(b.trail.length>6)b.trail.shift();

        // Depth of field : bulles lointaines (z<0.3) très petites/transparentes
        if(b.z<0.3){
          // Arrière-plan : cercle ultra-discret, pas de bloom
          ctx.strokeStyle=`rgba(140,200,255,${(b.a*0.7).toFixed(3)})`;ctx.lineWidth=0.5;
          ctx.beginPath();ctx.arc(b.x,b.y,b.sz,0,Math.PI*2);ctx.stroke();
        } else if(b.z<0.62){
          // Plan intermédiaire : contour + reflet interne
          ctx.strokeStyle=`rgba(160,220,255,${b.a.toFixed(3)})`;ctx.lineWidth=0.8;
          ctx.beginPath();ctx.arc(b.x,b.y,b.sz,0,Math.PI*2);ctx.stroke();
          ctx.fillStyle=`rgba(255,255,255,${(b.a*0.22).toFixed(3)})`;
          ctx.beginPath();ctx.arc(b.x-b.sz*0.3,b.y-b.sz*0.32,Math.max(0.5,b.sz*0.26),0,Math.PI*2);ctx.fill();
          // Trail ultra-fin HiDPI
          if(b.trail.length>2){
            ctx.strokeStyle=`rgba(160,220,255,${(b.a*0.18).toFixed(3)})`;ctx.lineWidth=0.5;
            ctx.beginPath();ctx.moveTo(b.trail[0].x,b.trail[0].y);
            for(let _fXbi=1;_fXbi<b.trail.length;_fXbi++)ctx.lineTo(b.trail[_fXbi].x,b.trail[_fXbi].y);
            ctx.stroke();
          }
        } else {
          // Premier plan : bulle grande avec bloom cinématographique (shadowBlur 18-32px)
          ctx.save();
          ctx.shadowColor=`rgba(100,200,255,${(b.a*0.85).toFixed(3)})`;
          ctx.shadowBlur=cl(18+b.z*14,18,32);
          // Halo gradient radial dense (subsurface scattering eau)
          const halo=ctx.createRadialGradient(b.x,b.y,0,b.x,b.y,b.sz*3.2);
          halo.addColorStop(0,`rgba(140,220,255,${(b.a*0.28).toFixed(3)})`);
          halo.addColorStop(0.45,`rgba(80,180,240,${(b.a*0.10).toFixed(3)})`);
          halo.addColorStop(1,'rgba(0,0,0,0)');
          ctx.fillStyle=halo;ctx.beginPath();ctx.arc(b.x,b.y,b.sz*3.2,0,Math.PI*2);ctx.fill();
          ctx.shadowBlur=0;
          // Contour de la bulle — lineWidth 1px HiDPI net
          ctx.strokeStyle=`rgba(180,235,255,${(b.a*1.1).toFixed(3)})`;ctx.lineWidth=1.0;
          ctx.beginPath();ctx.arc(b.x,b.y,b.sz,0,Math.PI*2);ctx.stroke();
          // Reflet interne (spéculaire)
          ctx.fillStyle=`rgba(255,255,255,${(b.a*0.55).toFixed(3)})`;
          ctx.beginPath();ctx.arc(b.x-b.sz*0.32,b.y-b.sz*0.32,b.sz*0.28,0,Math.PI*2);ctx.fill();
          // Micro-reflet secondaire
          ctx.fillStyle=`rgba(200,245,255,${(b.a*0.30).toFixed(3)})`;
          ctx.beginPath();ctx.ellipse(b.x+b.sz*0.42,b.y+b.sz*0.38,b.sz*0.12,b.sz*0.07,0.8,0,Math.PI*2);ctx.fill();
          ctx.shadowBlur=0;ctx.restore();
          // Trail ultra-fin HiDPI long (profite du ×2 HiDPI)
          if(b.trail.length>2){
            ctx.strokeStyle=`rgba(160,225,255,${(b.a*0.22).toFixed(3)})`;ctx.lineWidth=0.5;
            ctx.beginPath();ctx.moveTo(b.trail[0].x,b.trail[0].y);
            for(let _fXbi=1;_fXbi<b.trail.length;_fXbi++)ctx.lineTo(b.trail[_fXbi].x,b.trail[_fXbi].y);
            ctx.stroke();
          }
        }
      });
      ctx.restore();
      // 5. Bancs de poissons — silhouettes animées z-depth
      ctx.save();
      fx._fXfish.forEach(school=>{
        school.x+=school.vx;
        if(school.x>W+80)school.x=-80;if(school.x<-80)school.x=W+80;
        const _fr=hr(school.col),_fg=hg(school.col),_fb=hb(school.col);
        school.members.forEach((m,_mi)=>{
          const _fx=school.x+m.ox*(school.vx>0?1:-1);
          const _fy=school.y+m.oy+Math.sin(t*0.0028+m.ph+_mi*0.4)*4;
          const _fsz=3+(_mi%3)*1.5;
          ctx.save();ctx.translate(_fx,_fy);ctx.scale(school.vx>0?1:-1,1);
          ctx.fillStyle=`rgba(${_fr},${_fg},${_fb},0.55)`;
          ctx.beginPath();ctx.moveTo(_fsz*1.6,0);ctx.lineTo(-_fsz,_fsz*0.55);ctx.lineTo(-_fsz*0.5,0);ctx.lineTo(-_fsz,_fsz*-0.55);ctx.closePath();ctx.fill();
          ctx.restore();
        });
      });
      ctx.restore();
      break;}

    case 3:{
      // ── VOLCAN — god rays, z-depth cendres, fumée volumétrique, bloom 4K ──

      const _fXcrX=fx._fXcrX, _fXcrY=fx._fXcrY;

      // 1. GOD RAYS VOLCANIQUES — cônes orangés/rouges partant du cratère (dessinés en premier)
      ctx.save();
      ctx.globalCompositeOperation='screen';
      fx._fXvolRays.forEach(ray=>{
        const pulse=0.52+0.48*Math.abs(Math.sin(t*ray.sp+ray.ph));
        const ang=ray.ang+Math.sin(t*ray.sp*0.8+ray.ph)*0.14;
        const endX=_fXcrX+Math.cos(ang)*ray.len*H;
        const endY=_fXcrY+Math.sin(ang)*ray.len*H;
        const halfW=ray.w*0.5;
        const perpX=-Math.sin(ang), perpY=Math.cos(ang);
        const rg=ctx.createLinearGradient(_fXcrX,_fXcrY,endX,endY);
        rg.addColorStop(0,`rgba(255,160,20,${(ray.a*pulse*1.6).toFixed(3)})`);
        rg.addColorStop(0.12,`rgba(255,100,10,${(ray.a*pulse).toFixed(3)})`);
        rg.addColorStop(0.50,`rgba(220,55,5,${(ray.a*pulse*0.35).toFixed(3)})`);
        rg.addColorStop(1,'rgba(120,20,2,0)');
        ctx.fillStyle=rg;
        ctx.beginPath();
        ctx.moveTo(_fXcrX+perpX*halfW*0.18,_fXcrY+perpY*halfW*0.18);
        ctx.lineTo(_fXcrX-perpX*halfW*0.18,_fXcrY-perpY*halfW*0.18);
        ctx.lineTo(endX-perpX*ray.w*(1.4+pulse*0.7),endY-perpY*ray.w*(1.4+pulse*0.7));
        ctx.lineTo(endX+perpX*ray.w*(1.4+pulse*0.7),endY+perpY*ray.w*(1.4+pulse*0.7));
        ctx.closePath();ctx.fill();
      });
      ctx.globalCompositeOperation='source-over';
      ctx.restore();

      // 2. BLOOM CRATÈRE — halo cinématographique (shadowBlur 28-40px, subsurface scattering)
      ctx.save();
      const _fXpulse=0.55+0.45*Math.abs(Math.sin(t*0.00085));
      // Halo externe large — lueur magmatique
      const _fXhalo1=ctx.createRadialGradient(_fXcrX,_fXcrY,6,_fXcrX,_fXcrY,H*0.22);
      _fXhalo1.addColorStop(0,`rgba(255,140,20,${(0.18*_fXpulse).toFixed(3)})`);
      _fXhalo1.addColorStop(0.35,`rgba(220,60,5,${(0.07*_fXpulse).toFixed(3)})`);
      _fXhalo1.addColorStop(1,'rgba(140,20,2,0)');
      ctx.fillStyle=_fXhalo1;ctx.beginPath();ctx.arc(_fXcrX,_fXcrY,H*0.22,0,Math.PI*2);ctx.fill();
      // Halo intermédiaire chaud — bloom cinématographique
      const _fXhalo2=ctx.createRadialGradient(_fXcrX,_fXcrY,2,_fXcrX,_fXcrY,38);
      _fXhalo2.addColorStop(0,`rgba(255,220,80,${(0.88*_fXpulse).toFixed(3)})`);
      _fXhalo2.addColorStop(0.5,`rgba(255,140,30,${(0.28*_fXpulse).toFixed(3)})`);
      _fXhalo2.addColorStop(1,'rgba(220,60,5,0)');
      ctx.shadowColor=`rgba(255,180,30,0.9)`;ctx.shadowBlur=34;
      ctx.fillStyle=_fXhalo2;ctx.beginPath();ctx.arc(_fXcrX,_fXcrY,38,0,Math.PI*2);ctx.fill();
      // Disque incandescent net
      ctx.shadowBlur=0;
      const _fXcore=ctx.createRadialGradient(_fXcrX-3,_fXcrY-3,0,_fXcrX,_fXcrY,12);
      _fXcore.addColorStop(0,'rgba(255,255,200,1)');_fXcore.addColorStop(0.55,'rgba(255,220,80,1)');_fXcore.addColorStop(1,'rgba(255,160,20,0.85)');
      ctx.shadowColor='rgba(255,200,50,0.9)';ctx.shadowBlur=26;
      ctx.fillStyle=_fXcore;ctx.beginPath();ctx.arc(_fXcrX,_fXcrY,12,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;ctx.restore();

      // 3. FUMÉE VOLUMÉTRIQUE — nuages qui montent et grossissent depuis le cratère
      fx._fXsmoke.forEach(sm=>{
        sm.x+=sm.vx+Math.sin(t*0.00042+sm.ph)*0.18;
        sm.y+=sm.vy;sm.r+=sm.grow;sm.a*=0.9985;
        if(sm.y<-sm.r*2||sm.a<0.008){
          sm.x=_fXcrX+rnd(-W*0.04,W*0.04);
          sm.y=_fXcrY+rnd(-H*0.01,H*0.03);
          sm.r=rnd(14,32);sm.a=rnd(0.035,0.075);sm.grow=rnd(0.06,0.14);
        }
        const pulse=0.62+0.38*Math.abs(Math.sin(t*0.00055+sm.ph));
        // Gradient radial dense — subsurface scattering simulé
        const smg=ctx.createRadialGradient(sm.x,sm.y,0,sm.x,sm.y,sm.r);
        const sr=cl(52-sm.r*0.18,0,255)|0, sg=cl(20-sm.r*0.06,0,255)|0, sb=cl(10-sm.r*0.04,0,255)|0;
        smg.addColorStop(0,`rgba(${sr},${sg},${sb},${(sm.a*pulse).toFixed(3)})`);
        smg.addColorStop(0.55,`rgba(${sr},${sg},${sb},${(sm.a*pulse*0.38).toFixed(3)})`);
        smg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=smg;ctx.beginPath();ctx.ellipse(sm.x,sm.y,sm.r,sm.r*0.6,0,0,Math.PI*2);ctx.fill();
      });

      // 4. LAVE ONDULANTE AU SOL (inchangée, conservée)
      {const lg=ctx.createLinearGradient(0,H-55,0,H);lg.addColorStop(0,'rgba(210,48,5,0)');lg.addColorStop(1,'rgba(210,48,5,0.5)');ctx.fillStyle=lg;ctx.fillRect(0,H-55,W,55);}
      ctx.fillStyle='rgb(188,38,4)';ctx.beginPath();ctx.moveTo(0,H);
      for(let lx=0;lx<=W+8;lx+=8){const ly=H-12+8*Math.sin(lx*0.025+t*0.002);lx===0?ctx.moveTo(lx,ly):ctx.lineTo(lx,ly);}
      ctx.lineTo(W,H);ctx.closePath();ctx.fill();

      // 5. BRAISES CLASSIQUES (inchangées, conservées)
      fx.embers.forEach(em=>{
        em.x+=em.vx+Math.sin(t*0.003+em.x*0.02)*0.4;em.y+=em.vy;em.life--;
        if(em.life<=0||em.y<-10){em.x=Math.random()*W;em.y=H-20;em.vy=rnd(-1.2,-0.3);em.life=120;}
        const ratio=em.life/em.ml;
        ctx.fillStyle=`rgba(${em.rc},${em.gc_},5,${(0.68*ratio).toFixed(2)})`;
        ctx.beginPath();ctx.arc(em.x,em.y,em.sz,0,Math.PI*2);ctx.fill();
      });

      // 6. CENDRES VOLCANIQUES z-depth — triées lointain→proche, taille+opacité selon profondeur
      fx._fXash.sort((a,b)=>a.z-b.z);
      ctx.save();
      fx._fXash.forEach(as=>{
        as.x+=as.vx+Math.sin(t*0.00072+as.ph)*0.25*as.z;
        as.y+=as.vy;as.life--;
        if(as.life<=0||as.y<-8){
          as.x=rnd(0,W);as.y=rnd(H*0.20,H*0.90);
          as.vy=rnd(-0.85,-0.12)*(0.15+as.z*0.85);
          as.life=as.ml;
        }
        const ratio=as.life/as.ml;
        // Couleur : cendres proches plus chaudes/orangées, lointaines plus grises
        const warmR=cl(160+as.z*60,0,255)|0;
        const warmG=cl(55+as.z*35,0,255)|0;
        const warmB=cl(10+as.z*12,0,255)|0;
        const finalA=(as.a*ratio).toFixed(3);
        if(as.z<0.28){
          // Arrière-plan : pixels ultra-fins (depth of field — lointain = flou simulé par opacité faible)
          ctx.fillStyle=`rgba(${warmR},${warmG},${warmB},${finalA})`;
          ctx.fillRect(as.x,as.y,as.sz*0.5,as.sz*0.5);
        } else if(as.z<0.62){
          // Plan intermédiaire : petits ronds
          ctx.fillStyle=`rgba(${warmR},${warmG},${warmB},${finalA})`;
          ctx.beginPath();ctx.arc(as.x,as.y,as.sz,0,Math.PI*2);ctx.fill();
          // Trail ultra-fin HiDPI 0.5px dans le vent
          ctx.strokeStyle=`rgba(${warmR},${warmG},${warmB},${(as.a*ratio*0.22).toFixed(3)})`;
          ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(as.x,as.y);ctx.lineTo(as.x-as.vx*3.5,as.y-as.vy*1.5);ctx.stroke();
        } else {
          // Premier plan : particules grandes avec bloom cinématographique (shadowBlur 18-32px)
          ctx.shadowColor=`rgba(255,120,10,${(as.a*ratio*0.75).toFixed(3)})`;
          ctx.shadowBlur=cl(18+as.z*14,18,32);
          ctx.fillStyle=`rgba(${warmR},${warmG},${warmB},${finalA})`;
          ctx.beginPath();ctx.arc(as.x,as.y,as.sz*1.2,0,Math.PI*2);ctx.fill();
          ctx.shadowBlur=0;
          // Trail HiDPI long — sillon de cendre dans l'air chaud
          ctx.strokeStyle=`rgba(${warmR},${warmG},${warmB},${(as.a*ratio*0.30).toFixed(3)})`;
          ctx.lineWidth=0.6;ctx.beginPath();ctx.moveTo(as.x,as.y);ctx.lineTo(as.x-as.vx*5.5,as.y-as.vy*2.2);ctx.stroke();
          // Éclat spéculaire (particule à haute température, subsurface scattering)
          ctx.fillStyle=`rgba(255,255,200,${(as.a*ratio*0.45*as.z).toFixed(3)})`;
          ctx.beginPath();ctx.arc(as.x-as.sz*0.3,as.y-as.sz*0.3,as.sz*0.32,0,Math.PI*2);ctx.fill();
        }
      });
      ctx.restore();

      // 7. COULÉES DE LAVE ANIMÉES — rivières incandescentes qui coulent vers le bas
      ctx.save();ctx.globalCompositeOperation='screen';
      [[H*0.72,8,0.055],[H*0.80,6,0.042],[H*0.88,5,0.032]].forEach(([baseY,amp,alpha],_li)=>{
        const _lph=t*0.00055*(1+_li*0.35);
        const _lg=ctx.createLinearGradient(0,baseY-amp*2,0,baseY+amp*2);
        _lg.addColorStop(0,'rgba(0,0,0,0)');
        _lg.addColorStop(0.35,`rgba(255,${(90-_li*18)|0},${(_li===0?8:4)},${(alpha*1.4).toFixed(3)})`);
        _lg.addColorStop(0.50,`rgba(255,${(140-_li*22)|0},10,${(alpha*2.0).toFixed(3)})`);
        _lg.addColorStop(0.65,`rgba(255,${(90-_li*18)|0},4,${(alpha*1.4).toFixed(3)})`);
        _lg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=_lg;
        ctx.beginPath();
        const _step2=Math.ceil(W/60);
        const _topL=[],_botL=[];
        for(let _lx=0;_lx<=W+_step2;_lx+=_step2){
          const _lw1=Math.sin(_lx*0.014+_lph)*amp;
          const _lw2=Math.sin(_lx*0.028+_lph*1.6)*amp*0.4;
          const _ly=baseY+_lw1+_lw2;
          _topL.push([_lx,_ly-amp*1.2]);_botL.push([_lx,_ly+amp*1.2]);
        }
        _topL.forEach(([_lx,_ly],_li2)=>_li2===0?ctx.moveTo(_lx,_ly):ctx.lineTo(_lx,_ly));
        for(let _li2=_botL.length-1;_li2>=0;_li2--)ctx.lineTo(_botL[_li2][0],_botL[_li2][1]);
        ctx.closePath();ctx.fill();
      });
      ctx.globalCompositeOperation='source-over';ctx.restore();
      break;}

    case 4:{
      // 1. Aurora ribbons — rubans ondulants (même qualité qu'ARCTIQUE)
      const _n4auroras=[
        {r:60,g:200,b:120,yBase:H*0.055,amp:H*0.032,freq:0.0072,phMul:1.00,aMul:1.0,wid:H*0.048},
        {r:70,g:110,b:220,yBase:H*0.12,amp:H*0.024,freq:0.0088,phMul:1.40,aMul:0.72,wid:H*0.035},
        {r:120,g:50,b:200,yBase:H*0.18,amp:H*0.018,freq:0.0105,phMul:0.75,aMul:0.52,wid:H*0.025},
        {r:35,g:165,b:180,yBase:H*0.09,amp:H*0.014,freq:0.0060,phMul:1.65,aMul:0.38,wid:H*0.018},
      ];
      ctx.save();ctx.globalCompositeOperation='screen';
      _n4auroras.forEach((ao,_aoi)=>{
        const _ph=t*0.00030*(ao.phMul)+_aoi*2.15;
        const _al=(0.14+0.08*Math.abs(Math.sin(t*0.00050*(ao.phMul)+_aoi*1.5)))*ao.aMul;
        const _step=Math.ceil(W/48);
        const _top=[],_bot=[];
        for(let _ax=0;_ax<=W+_step;_ax+=_step){
          const _w1=Math.sin(_ax*ao.freq+_ph)*ao.amp;
          const _w2=Math.sin(_ax*ao.freq*1.72+_ph*1.32)*ao.amp*0.35;
          const _w3=Math.sin(_ax*ao.freq*0.48+_ph*0.65)*ao.amp*0.20;
          const _cy=ao.yBase+_w1+_w2+_w3;
          _top.push([_ax,_cy-ao.wid*0.5]);_bot.push([_ax,_cy+ao.wid*0.5]);
        }
        const _g4=ctx.createLinearGradient(0,ao.yBase-ao.amp-ao.wid,0,ao.yBase+ao.amp+ao.wid);
        _g4.addColorStop(0,'rgba(0,0,0,0)');
        _g4.addColorStop(0.28,`rgba(${ao.r},${ao.g},${ao.b},${_al.toFixed(3)})`);
        _g4.addColorStop(0.50,`rgba(${ao.r},${ao.g},${ao.b},${(_al*1.6).toFixed(3)})`);
        _g4.addColorStop(0.72,`rgba(${ao.r},${ao.g},${ao.b},${_al.toFixed(3)})`);
        _g4.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=_g4;
        ctx.beginPath();
        _top.forEach(([_ax,_ay],_ai)=>_ai===0?ctx.moveTo(_ax,_ay):ctx.lineTo(_ax,_ay));
        for(let _ai=_bot.length-1;_ai>=0;_ai--)ctx.lineTo(_bot[_ai][0],_bot[_ai][1]);
        ctx.closePath();ctx.fill();
      });
      ctx.globalCompositeOperation='source-over';ctx.restore();
      // 2. Étoiles scintillantes
      fx.stars.forEach(st=>{const br=cl(st.br*(0.5+0.5*Math.sin(t*st.sp+st.ph)),18,255)|0;ctx.fillStyle=`rgba(${br},${br},${cl(br+20,0,255)},0.9)`;ctx.beginPath();ctx.arc(st.x,st.y,st.sz,0,Math.PI*2);ctx.fill();});
      // 3. Clignotement des fenêtres de la ville
      fx._fX4wins.forEach(w=>{
        const pulse=0.5+0.5*Math.sin(t*w.sp+w.ph);
        const a=((w.on?0.45+0.25*pulse:0.05+0.07*pulse)).toFixed(2);
        ctx.fillStyle=w.col==='#FFE090'?`rgba(255,220,130,${a})`:w.col==='#B0D0FF'?`rgba(175,210,255,${a})`:`rgba(255,178,80,${a})`;
        ctx.fillRect(w.x,w.y,w.w,w.h);
        if(Math.random()<0.002)w.on=!w.on;
      });
      // 4. Projecteurs rotatifs
      ctx.save();
      fx._fX4lights.forEach(sl=>{
        sl.ang+=sl.sp;
        const endX=sl.ox+Math.cos(sl.ang)*H*0.85,endY=H+Math.sin(sl.ang)*H*0.85;
        const sg=ctx.createLinearGradient(sl.ox,H,endX,endY);
        sg.addColorStop(0,'rgba(200,220,255,0.08)');sg.addColorStop(0.6,'rgba(160,190,255,0.03)');sg.addColorStop(1,'rgba(120,160,255,0)');
        ctx.fillStyle=sg;
        const perpX=-Math.sin(sl.ang)*12,perpY=Math.cos(sl.ang)*12;
        ctx.beginPath();ctx.moveTo(sl.ox-6,H);ctx.lineTo(sl.ox+6,H);ctx.lineTo(endX+perpX,endY+perpY);ctx.lineTo(endX-perpX,endY-perpY);ctx.closePath();ctx.fill();
      });
      ctx.restore();
      // 5. Chauves-souris volantes
      ctx.save();
      fx._fX4bats.forEach(bt=>{
        bt.x=(bt.x+bt.vx+W*1.2)%(W*1.2)-W*0.1;
        const by=bt.y+Math.sin(t*0.0028+bt.ph)*8;
        const wf=Math.sin(t*0.012+bt.ph),sz=bt.sz;
        ctx.strokeStyle='rgba(18,8,38,0.58)';ctx.lineWidth=1.2;
        ctx.beginPath();ctx.moveTo(bt.x,by);ctx.quadraticCurveTo(bt.x-sz*0.7,by-sz*0.5*wf,bt.x-sz,by+sz*0.1);ctx.stroke();
        ctx.beginPath();ctx.moveTo(bt.x,by);ctx.quadraticCurveTo(bt.x+sz*0.7,by-sz*0.5*wf,bt.x+sz,by+sz*0.1);ctx.stroke();
      });
      ctx.restore();
      // 6. Étoile filante
      fx.st-=1/60;if(fx.st<=0){fx.shoot={x:rnd(0,W),y:rnd(0,H*0.25),vx:rnd(5,9),vy:rnd(2,4),life:28};fx.st=rnd(90,220);}
      if(fx.shoot){fx.shoot.x+=fx.shoot.vx;fx.shoot.y+=fx.shoot.vy;fx.shoot.life--;if(fx.shoot.life>0){const a2=(fx.shoot.life/28).toFixed(2);ctx.strokeStyle=`rgba(255,255,210,${a2})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx.shoot.x,fx.shoot.y);ctx.lineTo(fx.shoot.x-fx.shoot.vx*4,fx.shoot.y-fx.shoot.vy*4);ctx.stroke();}else fx.shoot=null;}
      break;}
    case 5:{
      // ── AURORA BOREALIS — rubans ondulants polychromes ──
      const _aoRibbons=[
        {r:40,g:255,b:140,yBase:H*0.08,amp:H*0.038,freq:0.0080,phMul:1.00,aMul:1.0,wid:H*0.052},
        {r:60,g:180,b:255,yBase:H*0.15,amp:H*0.028,freq:0.0095,phMul:1.35,aMul:0.75,wid:H*0.038},
        {r:160,g:60,b:255,yBase:H*0.21,amp:H*0.022,freq:0.0110,phMul:0.82,aMul:0.55,wid:H*0.028},
        {r:40,g:230,b:200,yBase:H*0.10,amp:H*0.018,freq:0.0068,phMul:1.60,aMul:0.40,wid:H*0.020},
      ];
      ctx.save();ctx.globalCompositeOperation='screen';
      _aoRibbons.forEach((ao,_aoi)=>{
        const _aoPhase=t*0.00032*(ao.phMul)+_aoi*2.08;
        const _aoAlpha=(0.10+0.07*Math.abs(Math.sin(t*0.00055*(ao.phMul)+_aoi*1.4)))*ao.aMul;
        const _step=Math.ceil(W/50);
        const _top=[],_bot=[];
        for(let _ax=0;_ax<=W+_step;_ax+=_step){
          const _w1=Math.sin(_ax*ao.freq+_aoPhase)*ao.amp;
          const _w2=Math.sin(_ax*ao.freq*1.65+_aoPhase*1.28)*ao.amp*0.38;
          const _w3=Math.sin(_ax*ao.freq*0.52+_aoPhase*0.68)*ao.amp*0.22;
          const _cy=ao.yBase+_w1+_w2+_w3;
          _top.push([_ax,_cy-ao.wid*0.5]);_bot.push([_ax,_cy+ao.wid*0.5]);
        }
        const _aoGrad=ctx.createLinearGradient(0,ao.yBase-ao.amp-ao.wid,0,ao.yBase+ao.amp+ao.wid);
        _aoGrad.addColorStop(0,'rgba(0,0,0,0)');
        _aoGrad.addColorStop(0.28,`rgba(${ao.r},${ao.g},${ao.b},${(_aoAlpha).toFixed(3)})`);
        _aoGrad.addColorStop(0.50,`rgba(${ao.r},${ao.g},${ao.b},${(_aoAlpha*1.55).toFixed(3)})`);
        _aoGrad.addColorStop(0.72,`rgba(${ao.r},${ao.g},${ao.b},${(_aoAlpha).toFixed(3)})`);
        _aoGrad.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=_aoGrad;
        ctx.beginPath();
        _top.forEach(([_ax,_ay],_ai)=>_ai===0?ctx.moveTo(_ax,_ay):ctx.lineTo(_ax,_ay));
        for(let _ai=_bot.length-1;_ai>=0;_ai--)ctx.lineTo(_bot[_ai][0],_bot[_ai][1]);
        ctx.closePath();ctx.fill();
      });
      ctx.globalCompositeOperation='source-over';ctx.restore();
      // Snowflakes (cristaux hexagonaux)
      fx.snow.forEach(sf=>{sf.x+=sf.vx+Math.sin(t*0.001+sf.y*0.018)*0.28;sf.y+=sf.vy;sf.rot+=sf.vrot;if(sf.y>H+18){sf.y=-12;sf.x=Math.random()*W;}ctx.save();ctx.translate(sf.x,sf.y);ctx.rotate(sf.rot*Math.PI/180);ctx.strokeStyle=`rgba(195,232,255,${sf.a})`;ctx.lineWidth=1;const sl=sf.sz;for(let _a=0;_a<6;_a++){const rad=_a*Math.PI/3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(rad)*sl,Math.sin(rad)*sl);ctx.stroke();const mx=Math.cos(rad)*sl*0.55,my=Math.sin(rad)*sl*0.55,b1=Math.cos(rad+Math.PI/4)*sl*0.22,b2=Math.sin(rad+Math.PI/4)*sl*0.22;ctx.beginPath();ctx.moveTo(mx-b1,my-b2);ctx.lineTo(mx+b1,my+b2);ctx.stroke();}ctx.restore();});
      // Ice sparkles on ground surface
      const _iceY=H*0.74;
      for(let _si=0;_si<5;_si++){
        const _sx=(_si/5)*W*0.88+W*0.06+Math.sin(t*0.00022+_si*1.4)*W*0.04;
        const _sp=0.48+0.52*Math.abs(Math.sin(t*0.0028+_si*2.1));
        ctx.save();ctx.globalAlpha=0.32*_sp;ctx.strokeStyle=`rgba(180,238,255,${_sp.toFixed(2)})`;ctx.lineWidth=0.8;
        const _ssz=2.5+_sp*3.5;
        for(let _sj=0;_sj<4;_sj++){const _sang=_sj*Math.PI/4;ctx.beginPath();ctx.moveTo(_sx-Math.cos(_sang)*_ssz,_iceY-Math.sin(_sang)*_ssz);ctx.lineTo(_sx+Math.cos(_sang)*_ssz,_iceY+Math.sin(_sang)*_ssz);ctx.stroke();}
        ctx.restore();
      }
      break;}
    case 6:{
      // 1. Nébuleuse scintillante (blobs colorés)
      fx.nebula.forEach(nb=>{
        nb.x=(nb.x+nb.vx+W)%W;nb.y=(nb.y+nb.vy+H)%H;
        const pulse=0.6+0.4*Math.abs(Math.sin(t*0.00055+nb.r*0.01));
        const ng=ctx.createRadialGradient(nb.x,nb.y,4,nb.x,nb.y,nb.r);
        ng.addColorStop(0,hexA(nb.col,nb.a*pulse));ng.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=ng;ctx.beginPath();ctx.arc(nb.x,nb.y,nb.r,0,Math.PI*2);ctx.fill();
      });
      // 2. Champ d'étoiles parallaxe 3 couches
      fx._fX6layers.forEach((layer,li)=>{
        layer.forEach(st=>{
          st.x=(st.x+st.vx+W)%W;
          const br=cl(st.br*(0.55+0.45*Math.sin(t*st.sp+st.ph)),18,255)|0;
          ctx.fillStyle=`rgba(${br},${Math.max(0,br-20)},${Math.min(255,br+35)},${li===2?0.95:li===1?0.80:0.60})`;
          ctx.beginPath();ctx.arc(st.x,st.y,st.sz,0,Math.PI*2);ctx.fill();
          if(li===2&&st.sz>2.2){
            ctx.strokeStyle=`rgba(${br},${Math.max(0,br-20)},${Math.min(255,br+40)},0.22)`;ctx.lineWidth=0.5;
            ctx.beginPath();ctx.moveTo(st.x-st.sz*3,st.y);ctx.lineTo(st.x+st.sz*3,st.y);ctx.stroke();
            ctx.beginPath();ctx.moveTo(st.x,st.y-st.sz*3);ctx.lineTo(st.x,st.y+st.sz*3);ctx.stroke();
          }
        });
      });
      // 3. Pluie de météorites
      fx._fX6meteorT-=1;
      if(fx._fX6meteorT<=0){const cnt=5+Math.floor(Math.random()*4);for(let _fxi=0;_fxi<cnt;_fxi++)fx._fX6meteors.push({x:rnd(0,W),y:rnd(-20,H*0.3),vx:rnd(4,9),vy:rnd(2,5),life:rnd(18,32),ml:32,col:rndc(['#C0B0FF','#A0C0FF','#FFE0B0'])});fx._fX6meteorT=rnd(200,400);}
      ctx.save();
      fx._fX6meteors=fx._fX6meteors.filter(m=>{
        m.x+=m.vx;m.y+=m.vy;m.life--;if(m.life<=0)return false;
        const a2=(m.life/m.ml).toFixed(2);
        const mg=ctx.createLinearGradient(m.x,m.y,m.x-m.vx*6,m.y-m.vy*6);
        mg.addColorStop(0,hexA(m.col,parseFloat(a2)*0.9));mg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.strokeStyle=mg;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(m.x,m.y);ctx.lineTo(m.x-m.vx*6,m.y-m.vy*6);ctx.stroke();
        ctx.shadowColor=m.col;ctx.shadowBlur=6;ctx.fillStyle=hexA(m.col,parseFloat(a2));ctx.beginPath();ctx.arc(m.x,m.y,1.8,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
        return true;
      });
      ctx.restore();
      // 4. Comète (conservée)
      fx.ct-=1/60;if(fx.ct<=0){fx.comet={x:rnd(0,W),y:rnd(0,H*0.22),vx:rnd(6,11),vy:rnd(2,5),life:32};fx.ct=rnd(140,320);}
      if(fx.comet){fx.comet.x+=fx.comet.vx;fx.comet.y+=fx.comet.vy;fx.comet.life--;if(fx.comet.life>0){const a2=(fx.comet.life/32).toFixed(2),cg=ctx.createLinearGradient(fx.comet.x,fx.comet.y,fx.comet.x-fx.comet.vx*7,fx.comet.y-fx.comet.vy*7);cg.addColorStop(0,`rgba(190,140,255,${a2})`);cg.addColorStop(1,'rgba(80,40,190,0)');ctx.strokeStyle=cg;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(fx.comet.x,fx.comet.y);ctx.lineTo(fx.comet.x-fx.comet.vx*7,fx.comet.y-fx.comet.vy*7);ctx.stroke();ctx.fillStyle=`rgba(215,175,255,${a2})`;ctx.beginPath();ctx.arc(fx.comet.x,fx.comet.y,2.5,0,Math.PI*2);ctx.fill();}else fx.comet=null;}
      break;}
    case 7:{
      // ── JUNGLE NOCTURNE — z-depth, parallaxe, god ray, ombres dynamiques ──

      // 1. Brume de sol verte (fond)
      {const gg2=ctx.createLinearGradient(0,H-65,0,H);gg2.addColorStop(0,'rgba(10,60,22,0)');gg2.addColorStop(1,'rgba(10,60,22,0.28)');ctx.fillStyle=gg2;ctx.fillRect(0,H-65,W,65);}

      // 2. God ray lunaire — lumière volumétrique (lointain, dessiné en premier)
      {const mr=fx._fXmoonRay;mr.a=(mr.a+0.4)%H;const sway=Math.sin(t*0.00035+mr.ph)*W*0.035;const rx=mr.x+sway;const pulse=0.55+0.45*Math.abs(Math.sin(t*0.00055+mr.ph));
      ctx.save();
      // Rayon principal — cone de lumière lunaire bleutée
      const rg1=ctx.createLinearGradient(rx,0,rx,H*0.78);rg1.addColorStop(0,`rgba(155,200,255,${(0.045*pulse).toFixed(3)})`);rg1.addColorStop(0.55,`rgba(100,180,240,${(0.025*pulse).toFixed(3)})`);rg1.addColorStop(1,'rgba(80,140,210,0)');
      ctx.fillStyle=rg1;
      ctx.beginPath();ctx.moveTo(rx-mr.w*0.3,0);ctx.lineTo(rx+mr.w*0.3,0);ctx.lineTo(rx+mr.w*1.8,H*0.78);ctx.lineTo(rx-mr.w*1.8,H*0.78);ctx.closePath();ctx.fill();
      // Halo central ultra-lumineux (bloom cinématographique shadowBlur=32)
      ctx.shadowColor='rgba(160,220,255,0.7)';ctx.shadowBlur=32;
      const rg2=ctx.createLinearGradient(rx,0,rx,H*0.55);rg2.addColorStop(0,`rgba(200,230,255,${(0.06*pulse).toFixed(3)})`);rg2.addColorStop(1,'rgba(160,210,255,0)');
      ctx.fillStyle=rg2;
      ctx.beginPath();ctx.moveTo(rx-mr.w*0.12,0);ctx.lineTo(rx+mr.w*0.12,0);ctx.lineTo(rx+mr.w*0.55,H*0.55);ctx.lineTo(rx-mr.w*0.55,H*0.55);ctx.closePath();ctx.fill();
      ctx.shadowBlur=0;ctx.restore();}

      // 3. Feuillage en parallaxe — tri par z croissant (lointain → proche)
      // Trier une fois par frame (24 éléments, négligeable)
      fx._fXleaves.sort((a,b)=>a.z-b.z);
      fx._fXleaves.forEach(lf=>{
        lf.x+=lf.vx;lf.y+=lf.vy+Math.sin(t*0.00065+lf.wave)*0.18*lf.z;lf.ang+=lf.vrot;lf.wave+=0.012;
        if(lf.x>W+lf.sz*2){lf.x=-lf.sz*2;lf.y=rnd(H*0.04,H*0.88);}
        // Depth of field simulé : éléments lointains plus transparents et flous (réduit via globalAlpha)
        const depthAlpha=0.12+lf.z*0.55;
        ctx.save();ctx.globalAlpha=depthAlpha;
        // Ombre dynamique sur le sol projetée par la feuille (visible seulement si proche)
        if(lf.z>0.55){
          const shadowScale=0.25+lf.z*0.35;
          const shadowY=fx._fXgroundY+2;const shadowAlpha=(lf.z-0.55)*0.22;
          ctx.fillStyle=`rgba(0,18,6,${shadowAlpha.toFixed(3)})`;
          ctx.beginPath();ctx.ellipse(lf.x,shadowY,lf.sz*shadowScale*1.8,lf.sz*shadowScale*0.4,0,0,Math.PI*2);ctx.fill();
        }
        // Feuille elle-même — taille proportionnelle à z (devant = grande)
        const a=lf.ang,sz=lf.sz;
        ctx.fillStyle=lf.col;
        ctx.beginPath();ctx.moveTo(lf.x+Math.cos(a)*sz,lf.y+Math.sin(a)*sz);
        ctx.quadraticCurveTo(lf.x+Math.cos(a+1.05)*sz*0.7,lf.y+Math.sin(a+1.05)*sz*0.7,lf.x+Math.cos(a+2.1)*sz*0.45,lf.y+Math.sin(a+2.1)*sz*0.45);
        ctx.quadraticCurveTo(lf.x,lf.y,lf.x+Math.cos(a)*sz,lf.y+Math.sin(a)*sz);
        ctx.closePath();ctx.fill();
        // Nervure centrale — trait ultra-fin HiDPI (lineWidth 0.5px)
        ctx.strokeStyle=`rgba(180,255,140,${(depthAlpha*0.55).toFixed(3)})`;ctx.lineWidth=0.5;
        ctx.beginPath();ctx.moveTo(lf.x,lf.y);ctx.lineTo(lf.x+Math.cos(a)*sz*0.85,lf.y+Math.sin(a)*sz*0.85);ctx.stroke();
        ctx.restore();
      });

      // 4. Spores bioluminescentes — z-depth + bloom 4K (lointain=petit/discret, proche=grand/lumineux)
      fx._fXspores.forEach(sp=>{
        sp.x+=sp.vx+Math.sin(t*0.00088+sp.ph)*0.14*sp.z;
        sp.y+=sp.vy;sp.ph+=0.007;
        if(sp.y<-8){sp.y=H+8;sp.x=rnd(0,W);}
        const pulse=0.38+0.62*Math.abs(Math.sin(t*0.0028+sp.ph));
        const finalAlpha=sp.a*pulse;
        // Taille varie avec z : proche = grande, lointain = petite (z-depth authentique)
        const finalSz=sp.sz*(0.4+sp.z*0.8);
        ctx.save();
        if(sp.z>0.5){
          // Bloom cinematographique sur les spores proches — shadowBlur 22-38px
          ctx.shadowColor=`rgba(80,255,120,${(0.55*pulse).toFixed(3)})`;
          ctx.shadowBlur=cl(22+sp.z*16,22,38);
        }
        // Halo gradient radial (subsurface scattering simulé)
        const haloR=finalSz*(2.8+sp.z*2.5);
        const sg=ctx.createRadialGradient(sp.x,sp.y,0,sp.x,sp.y,haloR);
        sg.addColorStop(0,`rgba(80,255,120,${(finalAlpha*0.62).toFixed(3)})`);
        sg.addColorStop(0.4,`rgba(60,200,80,${(finalAlpha*0.18).toFixed(3)})`);
        sg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=sg;ctx.beginPath();ctx.arc(sp.x,sp.y,haloR,0,Math.PI*2);ctx.fill();
        // Corps de la spore
        ctx.fillStyle=`rgba(140,255,160,${finalAlpha.toFixed(3)})`;
        ctx.beginPath();ctx.arc(sp.x,sp.y,finalSz,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;ctx.restore();
      });

      // 5. Lucioles z-depth — triées par z, ombres projetées au sol, trails HiDPI
      fx._fXflies.sort((a,b)=>a.z-b.z);
      fx._fXflies.forEach(fl=>{
        fl.x+=fl.vx+Math.sin(t*0.0014+fl.ph)*0.42*fl.z;
        fl.y+=fl.vy+Math.cos(t*0.001+fl.ph)*0.30*fl.z;
        fl.x=(fl.x+W)%W;if(fl.y<H*0.08)fl.vy=Math.abs(fl.vy);if(fl.y>H*0.95)fl.vy=-Math.abs(fl.vy);
        fl.ph+=fl.psp;
        // Enregistrement trail (ultra-fin HiDPI)
        fl.trail.push({x:fl.x,y:fl.y});if(fl.trail.length>8)fl.trail.shift();

        const pulse=0.32+0.68*Math.abs(Math.sin(t*fl.psp*2.2+fl.ph));
        // Taille proportionnelle au z (particule devant = plus grande)
        const baseSz=0.7+fl.z*3.8;
        const finalSz=baseSz*pulse;
        // Opacité proportionnelle au z
        const fa=cl(0.12+fl.z*0.82,0,1)*pulse;

        // Ombre dynamique projetée sur le sol (seulement lucioles assez proches)
        if(fl.z>0.42){
          const shadowDist=fx._fXgroundY-fl.y;const shadowAlpha=cl((fl.z-0.42)*0.18*pulse,0,0.18);
          if(shadowDist>0&&shadowAlpha>0.01){
            const shadowSz=baseSz*(0.5+fl.z*0.6);
            ctx.fillStyle=`rgba(0,60,10,${shadowAlpha.toFixed(3)})`;
            ctx.beginPath();ctx.ellipse(fl.x,fx._fXgroundY+1,shadowSz*2.2,shadowSz*0.45,0,0,Math.PI*2);ctx.fill();
          }
        }

        ctx.save();
        // Trail ultra-fin — lineWidth 0.5-0.8px (profite du HiDPI ×2)
        if(fl.trail.length>2){
          ctx.beginPath();ctx.moveTo(fl.trail[0].x,fl.trail[0].y);
          for(let _fXti=1;_fXti<fl.trail.length;_fXti++)ctx.lineTo(fl.trail[_fXti].x,fl.trail[_fXti].y);
          ctx.strokeStyle=hexA(fl.col,fa*0.22);ctx.lineWidth=0.5;ctx.stroke();
        }
        // Bloom cinématographique — shadowBlur croissant avec z (22→38px pour les plus proches)
        ctx.shadowColor=fl.col;ctx.shadowBlur=cl(8+fl.z*30,8,38);
        // Halo gradient radial dense (subsurface scattering)
        const hR=finalSz*(4.2+fl.z*3.5);
        const fg2=ctx.createRadialGradient(fl.x,fl.y,0,fl.x,fl.y,hR);
        fg2.addColorStop(0,hexA(fl.col,fa*0.88));fg2.addColorStop(0.35,hexA(fl.col,fa*0.22));fg2.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=fg2;ctx.beginPath();ctx.arc(fl.x,fl.y,hR,0,Math.PI*2);ctx.fill();
        // Corps de la luciole
        ctx.shadowBlur=cl(4+fl.z*14,4,18);
        ctx.fillStyle=hexA(fl.col,cl(fa*1.15,0,1));ctx.beginPath();ctx.arc(fl.x,fl.y,finalSz,0,Math.PI*2);ctx.fill();
        // Éclat spéculaire central blanc (depth-of-field inversé : devant = plus net/lumineux)
        ctx.shadowBlur=0;ctx.fillStyle=`rgba(255,255,255,${(fa*0.55*fl.z).toFixed(3)})`;
        ctx.beginPath();ctx.arc(fl.x-finalSz*0.28,fl.y-finalSz*0.25,finalSz*0.28,0,Math.PI*2);ctx.fill();
        ctx.restore();
      });
      break;}

    case 8:{fx.wo+=0.009;
      // Vagues avec écume sur les crêtes
      [[0.08,H-40,7],[0.15,H-24,9],[0.24,H-9,11]].forEach(([a,yb,amp])=>{
        ctx.fillStyle=hexA(th.dc,a);ctx.beginPath();ctx.moveTo(0,H);
        for(let wx=0;wx<=W+8;wx+=6){const wy=yb+amp*Math.sin(wx*0.014+fx.wo);wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}
        ctx.lineTo(W,H);ctx.closePath();ctx.fill();
        // Écume sur crête de vague
        ctx.save();ctx.globalAlpha=a*0.55;ctx.strokeStyle='rgba(255,255,255,0.65)';ctx.lineWidth=0.8;
        ctx.beginPath();
        for(let wx=0;wx<=W+8;wx+=6){const wy=yb+amp*Math.sin(wx*0.014+fx.wo)-1;wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}
        ctx.stroke();ctx.restore();
      });
      ctx.fillStyle='rgba(255,190,90,0.05)';ctx.fillRect(0,H-55,W,55);
      // Reflet solaire glitter — éclats scintillants sur l'eau
      if(fx._b8glitter){
        ctx.save();
        fx._b8glitter.forEach(g=>{
          const pulse=0.5+0.5*Math.abs(Math.sin(t*g.sp+g.ph));
          if(pulse<0.35)return;
          const _gy=g.y+Math.sin(t*g.sp*0.6+g.ph)*8;
          ctx.globalAlpha=pulse*0.62;
          ctx.fillStyle=`rgba(255,230,130,${pulse.toFixed(2)})`;
          ctx.save();ctx.translate(g.x,_gy);ctx.scale(1+pulse*0.5,0.6);
          ctx.beginPath();ctx.arc(0,0,g.sz*pulse,0,Math.PI*2);ctx.fill();ctx.restore();
          // Cross flare (reflet cruciforme)
          ctx.strokeStyle=`rgba(255,240,180,${(pulse*0.45).toFixed(2)})`;ctx.lineWidth=0.6;
          const _cl=g.sz*2.8*pulse;
          ctx.beginPath();ctx.moveTo(g.x-_cl,_gy);ctx.lineTo(g.x+_cl,_gy);ctx.stroke();
          ctx.beginPath();ctx.moveTo(g.x,_gy-_cl*0.55);ctx.lineTo(g.x,_gy+_cl*0.55);ctx.stroke();
        });
        ctx.globalAlpha=1;ctx.restore();
      }fx.jelly.forEach(jl=>{jl.x=(jl.x+jl.vx+W)%W;jl.y+=jl.vy+Math.sin(t*jl.psp+jl.ph)*0.12;if(jl.y<-jl.sz*2.5){jl.y=H+jl.sz;jl.x=rnd(0,W);}const pulse=0.82+0.18*Math.sin(t*jl.psp*2.2+jl.ph);const jr=hr(jl.col),jg=hg(jl.col),jb=hb(jl.col);const jw=jl.sz*pulse,jh=jl.sz*0.58*pulse;ctx.save();const jglow=ctx.createRadialGradient(jl.x,jl.y,0,jl.x,jl.y,jw*1.7);jglow.addColorStop(0,`rgba(${jr},${jg},${jb},0.18)`);jglow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=jglow;ctx.beginPath();ctx.arc(jl.x,jl.y,jw*1.7,0,Math.PI*2);ctx.fill();const jdome=ctx.createRadialGradient(jl.x,jl.y-jh*0.3,jw*0.1,jl.x,jl.y,jw);jdome.addColorStop(0,`rgba(255,255,255,0.38)`);jdome.addColorStop(0.4,`rgba(${jr},${jg},${jb},0.28)`);jdome.addColorStop(1,`rgba(${jr},${jg},${jb},0.08)`);ctx.fillStyle=jdome;ctx.beginPath();ctx.ellipse(jl.x,jl.y,jw,jh,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.strokeStyle=`rgba(${jr},${jg},${jb},0.30)`;ctx.lineWidth=0.8;ctx.stroke();for(let ti2=0;ti2<4;ti2++){const tx=jl.x+(ti2-1.5)*jw*0.45;const tph2=jl.tph[ti2];const wave1=Math.sin(t*0.002+tph2)*jw*0.28,wave2=Math.sin(t*0.0017+tph2+1.2)*jw*0.22;const tlen=jl.sz*(1.2+0.4*Math.abs(Math.sin(t*jl.psp+tph2)));ctx.strokeStyle=`rgba(${jr},${jg},${jb},0.28)`;ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(tx,jl.y);ctx.bezierCurveTo(tx+wave1,jl.y+tlen*0.35,tx+wave2,jl.y+tlen*0.65,tx+wave1*0.5,jl.y+tlen);ctx.stroke();}ctx.restore();});fx.birds.forEach(b=>{b.x=(b.x+b.vx)%W;const by=b.y+Math.sin(t*0.002+b.phase)*5;ctx.strokeStyle='rgba(55,18,8,0.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b.x,by);ctx.quadraticCurveTo(b.x+b.sz/2,by-b.sz*0.42,b.x+b.sz,by);ctx.stroke();});break;}
    case 9:{const _g9=ctx.createLinearGradient(0,fx.gY,0,fx.gY+45);_g9.addColorStop(0,'rgba(0,70,160,0.10)');_g9.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=_g9;ctx.fillRect(0,fx.gY,W,45);fx.rain.forEach(r=>{r.y+=r.vy;if(r.y>H+r.len){r.y=-r.len;r.x=rnd(0,W);}ctx.strokeStyle=`rgba(80,150,220,${r.a})`;ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+1.5,r.y+r.len);ctx.stroke();});fx.wins.forEach(w=>{const p=0.5+0.5*Math.sin(t*w.sp+w.ph);const a=((w.on?0.42+0.28*p:0.04+0.07*p)).toFixed(2);ctx.fillStyle=w.col==='#00DDFF'?`rgba(0,220,255,${a})`:w.col==='#A040FF'?`rgba(160,55,255,${a})`:`rgba(255,210,100,${a})`;ctx.fillRect(w.x,w.y,w.w,w.h);if(Math.random()<0.003)w.on=!w.on;});fx.vehicles.forEach(v=>{v.x+=v.vx;if(v.x>W+v.trail+10){v.x=-v.trail-10;v.y=rnd(H*0.22,H*0.57);v.vx=rnd(2.8,7.0);v.col=rndc(['#00DDFF','#FF40A0','#FF8020','#A040FF','#40FFD0']);}const _t9=ctx.createLinearGradient(v.x-v.trail,v.y,v.x,v.y);_t9.addColorStop(0,'rgba(0,0,0,0)');_t9.addColorStop(1,hexA(v.col,0.88));ctx.strokeStyle=_t9;ctx.lineWidth=v.sz*0.45;ctx.beginPath();ctx.moveTo(v.x-v.trail,v.y);ctx.lineTo(v.x,v.y);ctx.stroke();ctx.save();ctx.shadowColor=v.col;ctx.shadowBlur=v.sz*5.5;ctx.fillStyle=hexA(v.col,0.95);ctx.beginPath();ctx.arc(v.x,v.y,v.sz,0,Math.PI*2);ctx.fill();ctx.restore();});fx.holo=(fx.holo+0.9)%H;ctx.fillStyle='rgba(0,200,255,0.020)';ctx.fillRect(0,fx.holo,W,2);
      // Neon sign panels
      if(fx._n9signs){fx._n9signs.forEach(sg=>{
        sg.flickerT--;
        if(sg.flickerT<=0){sg.flicker=Math.random()<0.08?1:0;sg.flickerT=Math.floor(rnd(8,40));}
        const p=0.55+0.45*Math.sin(t*sg.sp+sg.ph);
        const a=(sg.flicker?0.12:0.75+0.25*p).toFixed(2);
        const sr=hr(sg.col),sg2=hg(sg.col),sb=hb(sg.col);
        // Panel background
        ctx.save();
        ctx.shadowColor=sg.col;ctx.shadowBlur=sg.flicker?4:12+8*p;
        ctx.fillStyle=`rgba(${sr*0.12|0},${sg2*0.12|0},${sb*0.12|0},0.72)`;
        rp(ctx,sg.x,sg.y,sg.w,sg.h,sg.h*0.22);ctx.fill();
        // Neon border
        ctx.strokeStyle=`rgba(${sr},${sg2},${sb},${a})`;ctx.lineWidth=1.2;
        rp(ctx,sg.x,sg.y,sg.w,sg.h,sg.h*0.22);ctx.stroke();
        // Inner glow strip (top)
        const sgg=ctx.createLinearGradient(sg.x,sg.y,sg.x,sg.y+sg.h*0.4);
        sgg.addColorStop(0,`rgba(${sr},${sg2},${sb},${(parseFloat(a)*0.22).toFixed(2)})`);
        sgg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.fillStyle=sgg;rp(ctx,sg.x,sg.y,sg.w,sg.h*0.4,sg.h*0.22);ctx.fill();
        ctx.restore();
        // Puddle reflection on ground
        ctx.save();
        ctx.globalAlpha=(sg.flicker?0.04:0.18+0.10*p);
        ctx.scale(1,-0.22);
        const ry=-(fx.gY+sg.h*1.5);
        ctx.shadowColor=sg.col;ctx.shadowBlur=8;
        ctx.strokeStyle=`rgba(${sr},${sg2},${sb},0.7)`;ctx.lineWidth=1.0;
        rp(ctx,sg.x,ry,sg.w,sg.h,sg.h*0.22);ctx.stroke();
        ctx.restore();
      });}
      // Ground puddle rain ring ripples
      if(fx.rain&&Math.random()<0.04){const rr=fx.rain[Math.floor(Math.random()*fx.rain.length)];if(rr.y>H*0.85){ctx.save();ctx.globalAlpha=0.18;ctx.strokeStyle='rgba(80,180,255,0.5)';ctx.lineWidth=0.6;ctx.beginPath();ctx.ellipse(rr.x,H*0.95,rnd(3,8),rnd(1,2.5),0,0,Math.PI*2);ctx.stroke();ctx.restore();}}
      break;}
  }
}
