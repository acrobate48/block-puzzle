'use strict';
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
  ctx.globalAlpha=0.22;ctx.shadowColor=th.tm;ctx.shadowBlur=fsz*1.1;
  ctx.fillStyle=th.hi||th.tm;ctx.fillText(text,x,y);
  // Bloom pass 2 — tight inner glow
  ctx.globalAlpha=0.40;ctx.shadowBlur=fsz*0.45;ctx.fillText(text,x,y);
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
  // Top light bevel
  const tg=ctx.createLinearGradient(x,y,x,y+sz*0.24);
  tg.addColorStop(0,'rgba(255,255,255,0.44)');tg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=tg;ctx.fillRect(x,y,sz,sz*0.24);
  // Left light bevel
  const lg=ctx.createLinearGradient(x,y,x+sz*0.22,y);
  lg.addColorStop(0,'rgba(255,255,255,0.30)');lg.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=lg;ctx.fillRect(x,y,sz*0.22,sz);
  // Bottom dark bevel
  const bg=ctx.createLinearGradient(x,y+sz*0.70,x,y+sz);
  bg.addColorStop(0,'rgba(0,0,0,0)');bg.addColorStop(1,'rgba(0,0,0,0.38)');
  ctx.fillStyle=bg;ctx.fillRect(x,y+sz*0.70,sz,sz*0.30);
  // Right dark bevel
  const rg=ctx.createLinearGradient(x+sz*0.70,y,x+sz,y);
  rg.addColorStop(0,'rgba(0,0,0,0)');rg.addColorStop(1,'rgba(0,0,0,0.28)');
  ctx.fillStyle=rg;ctx.fillRect(x+sz*0.70,y,sz*0.30,sz);
  // Specular spot — top-left corner glow
  const sp=ctx.createRadialGradient(x+sz*0.26,y+sz*0.20,0,x+sz*0.26,y+sz*0.20,sz*0.40);
  sp.addColorStop(0,'rgba(255,255,255,0.40)');sp.addColorStop(0.45,'rgba(255,255,255,0.10)');sp.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=sp;ctx.fillRect(x,y,sz,sz);
  ctx.restore();
}

function getCached(col,sz,skin){
  const k=`${skin}_${col}_${sz}`;
  if(CELL_CACHE.has(k))return CELL_CACHE.get(k);
  const oc=document.createElement('canvas');oc.width=sz;oc.height=sz;
  const c2=oc.getContext('2d');
  SKIN_FNS[skin](c2,col,0,0,sz,0);
  _drawBevel(c2,0,0,sz);
  CELL_CACHE.set(k,oc);return oc;
}
function drawCell(ctx,col,x,y,sz,skin,t,alpha=1){
  x=x|0;y=y|0;sz=sz|0;if(sz<1)return;
  // Drop shadow (drawn before skin, outside clip)
  const _r=Math.max(3,sz/5|0);
  ctx.save();
  ctx.shadowColor='rgba(0,0,0,0.38)';ctx.shadowBlur=sz*0.14;ctx.shadowOffsetX=sz*0.04;ctx.shadowOffsetY=sz*0.07;
  rp(ctx,x,y,sz,sz,_r);ctx.fillStyle='#000';ctx.fill();
  ctx.restore();
  if(alpha<1)ctx.globalAlpha=alpha;
  if(ANIMATED_SKINS.has(skin)){SKIN_FNS[skin](ctx,col,x,y,sz,t);_drawBevel(ctx,x,y,sz);}
  else ctx.drawImage(getCached(col,sz,skin),x,y);
  if(alpha<1)ctx.globalAlpha=1;
}

// ─── 10 PREMIUM SKINS ─────────────────────────────────────────────────────────
// All skins use rclip for rounded corners + detailed multi-layer rendering

function skinPierre(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/5,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    // Base gradient
    const bg=ctx.createLinearGradient(x,y,x+sz,y+sz);
    bg.addColorStop(0,rgb(cl(r+60,0,255),cl(g+60,0,255),cl(b+60,0,255)));
    bg.addColorStop(1,rgb(cl(r-40,0,255),cl(g-40,0,255),cl(b-40,0,255)));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Stone grain lines
    const dk=rgba(0,0,0,0.12);const li=rgba(255,255,255,0.1);
    for(let i=0;i<4;i++){const gy=y+4+i*(sz-4)/4;ctx.strokeStyle=i%2?li:dk;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+2,gy+Math.sin(i)*2);ctx.lineTo(x+sz-2,gy+Math.cos(i+1)*2);ctx.stroke();}
    // Top-left light
    const lg=ctx.createLinearGradient(x,y,x+sz*0.6,y+sz*0.6);
    lg.addColorStop(0,'rgba(255,255,255,0.28)');lg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lg;ctx.fillRect(x,y,sz,sz);
    // Bottom-right shadow
    const sg=ctx.createLinearGradient(x+sz*0.4,y+sz*0.4,x+sz,y+sz);
    sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,0,0,0.3)');
    ctx.fillStyle=sg;ctx.fillRect(x,y,sz,sz);
    // Scratch detail
    ctx.strokeStyle='rgba(255,255,255,0.2)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x+sz*0.15,y+sz*0.15);ctx.lineTo(x+sz*0.4,y+sz*0.25);ctx.stroke();
  });
}

function skinCristal(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/4,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    // Deep inner color
    const bg=ctx.createRadialGradient(x+sz*0.35,y+sz*0.3,0,x+sz/2,y+sz/2,sz*0.7);
    bg.addColorStop(0,rgb(cl(r+90,0,255),cl(g+90,0,255),cl(b+90,0,255)));
    bg.addColorStop(0.5,rgb(cl(r+30,0,255),cl(g+30,0,255),cl(b+30,0,255)));
    bg.addColorStop(1,rgb(cl(r-20,0,255),cl(g-20,0,255),cl(b-20,0,255)));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Facet triangles
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.beginPath();ctx.moveTo(x+2,y+2);ctx.lineTo(x+sz-3,y+2);ctx.lineTo(x+sz/2,y+sz/2);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.08)';
    ctx.beginPath();ctx.moveTo(x+2,y+2);ctx.lineTo(x+2,y+sz-3);ctx.lineTo(x+sz/2,y+sz/2);ctx.closePath();ctx.fill();
    ctx.fillStyle='rgba(0,0,0,0.15)';
    ctx.beginPath();ctx.moveTo(x+sz-3,y+sz-3);ctx.lineTo(x+2,y+sz-3);ctx.lineTo(x+sz/2,y+sz/2);ctx.closePath();ctx.fill();
    // Sparkle
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.beginPath();ctx.arc(x+sz*0.3,y+sz*0.28,sz/9,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.beginPath();ctx.arc(x+sz*0.3,y+sz*0.28,sz/5,0,Math.PI*2);ctx.fill();
    // Diamond outline
    const cx2=x+sz/2,cy2=y+sz/2,dr=sz/4;
    ctx.strokeStyle='rgba(255,255,255,0.4)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(cx2,cy2-dr);ctx.lineTo(cx2+dr,cy2);ctx.lineTo(cx2,cy2+dr);ctx.lineTo(cx2-dr,cy2);ctx.closePath();ctx.stroke();
  });
}

function skinBois(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/6,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const wr=cl(r*0.55+55|0,0,255),wg=cl(g*0.55+35|0,0,255),wb=cl(b*0.4+12|0,0,255);
    ctx.fillStyle=rgb(wr,wg,wb);ctx.fillRect(x,y,sz,sz);
    // Wood grain
    for(let i=0;i<6;i++){
      const gy=y+2+i*(sz/6);const dk=i%2===0?0.14:0.07;
      ctx.strokeStyle=`rgba(0,0,0,${dk})`;ctx.lineWidth=sz/10;
      ctx.beginPath();ctx.moveTo(x,gy+Math.sin(i*1.2)*sz*0.05);ctx.bezierCurveTo(x+sz*0.3,gy+Math.sin(i)*sz*0.06,x+sz*0.7,gy-Math.sin(i+1)*sz*0.04,x+sz,gy+Math.sin(i*0.8)*sz*0.03);ctx.stroke();
    }
    // Knot
    const kx=x+sz*0.72,ky=y+sz*0.68,kr=sz/8;
    ctx.strokeStyle='rgba(0,0,0,0.25)';ctx.lineWidth=sz/12;
    ctx.beginPath();ctx.ellipse(kx,ky,kr,kr*0.7,-0.3,0,Math.PI*2);ctx.stroke();
    ctx.strokeStyle='rgba(0,0,0,0.12)';ctx.lineWidth=sz/16;
    ctx.beginPath();ctx.ellipse(kx,ky,kr*1.6,kr*1.1,-0.3,0,Math.PI*2);ctx.stroke();
    // Light edge
    const lg=ctx.createLinearGradient(x,y,x,y+sz/3);
    lg.addColorStop(0,'rgba(255,255,255,0.18)');lg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=lg;ctx.fillRect(x,y,sz,sz);
  });
}

function skinMetal(ctx,col,x,y,sz,_t){
  rclip(ctx,x,y,sz,sz/6,()=>{
    const r=hr(col),g=hg(col),b=hb(col);
    const mr=cl(r*0.25+110|0,0,255),mg=cl(g*0.25+110|0,0,255),mb=cl(b*0.25+115|0,0,255);
    ctx.fillStyle=rgb(mr,mg,mb);ctx.fillRect(x,y,sz,sz);
    // Brushed metal horizontal bands
    const stripes=8;
    for(let i=0;i<stripes;i++){
      const t2=i/stripes,gy=y+t2*sz,gh=sz/stripes;
      const bright=Math.sin(t2*Math.PI)*55;
      ctx.fillStyle=`rgba(${bright+160|0},${bright+160|0},${bright+165|0},0.35)`;
      ctx.fillRect(x,gy,sz,gh+1);
    }
    // Specular streak
    const sg=ctx.createLinearGradient(x,y+sz*0.3,x+sz,y+sz*0.45);
    sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(0.45,'rgba(255,255,255,0.55)');
    sg.addColorStop(0.5,'rgba(255,255,255,0.7)');sg.addColorStop(0.55,'rgba(255,255,255,0.55)');
    sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fillRect(x,y,sz,sz);
    // Edge bevel
    ctx.strokeStyle='rgba(255,255,255,0.3)';ctx.lineWidth=sz/10;ctx.strokeRect(x+sz/20,y+sz/20,sz-sz/10,sz-sz/10);
    ctx.strokeStyle='rgba(0,0,0,0.35)';ctx.lineWidth=1;ctx.strokeRect(x+sz/10,y+sz/10,sz-sz/5,sz-sz/5);
    // Tint overlay
    const tg=ctx.createRadialGradient(x+sz/2,y+sz/2,0,x+sz/2,y+sz/2,sz*0.7);
    tg.addColorStop(0,rgba(r,g,b,0.15));tg.addColorStop(1,rgba(r,g,b,0.0));
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
    const ir=cl(r*0.18+160,0,255),ig_=cl(g*0.18+180,0,255),ib=cl(b*0.18+200,0,255);
    const bg=ctx.createLinearGradient(x,y,x+sz,y+sz);
    bg.addColorStop(0,rgb(cl(ir+30,0,255),cl(ig_+30,0,255),cl(ib+25,0,255)));
    bg.addColorStop(1,rgb(ir,ig_,ib));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Snowflake
    const cx2=x+sz/2,cy2=y+sz/2;
    ctx.strokeStyle='rgba(220,240,255,0.7)';ctx.lineWidth=Math.max(1,sz/18);
    for(let a=0;a<6;a++){
      const rad=a*Math.PI/3,ex=cx2+Math.cos(rad)*sz*0.38,ey=cy2+Math.sin(rad)*sz*0.38;
      ctx.beginPath();ctx.moveTo(cx2,cy2);ctx.lineTo(ex,ey);ctx.stroke();
      const mx=cx2+Math.cos(rad)*sz*0.22,my=cy2+Math.sin(rad)*sz*0.22;
      const b1=Math.cos(rad+Math.PI/4)*sz*0.1,b2=Math.sin(rad+Math.PI/4)*sz*0.1;
      ctx.beginPath();ctx.moveTo(mx-b1,my-b2);ctx.lineTo(mx+b1,my+b2);ctx.stroke();
    }
    ctx.fillStyle='rgba(255,255,255,0.8)';ctx.beginPath();ctx.arc(cx2,cy2,sz/9,0,Math.PI*2);ctx.fill();
    // Frost edges
    const fg=ctx.createRadialGradient(x+sz/2,y+sz/2,sz*0.3,x+sz/2,y+sz/2,sz*0.6);
    fg.addColorStop(0,'rgba(200,235,255,0)');fg.addColorStop(1,'rgba(200,235,255,0.18)');
    ctx.fillStyle=fg;ctx.fillRect(x,y,sz,sz);
    // Top shine
    const lg=ctx.createLinearGradient(x,y,x,y+sz*0.38);
    lg.addColorStop(0,'rgba(255,255,255,0.32)');lg.addColorStop(1,'rgba(255,255,255,0)');
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
    // Deep space bg
    const bg=ctx.createRadialGradient(x+sz*0.4,y+sz*0.38,0,x+sz/2,y+sz/2,sz*0.65);
    bg.addColorStop(0,rgb(cl(r*0.25+40,0,255),cl(g*0.25+25,0,255),cl(b*0.25+55,0,255)));
    bg.addColorStop(1,rgb(r/8|0,g/8|0,b/8|0));
    ctx.fillStyle=bg;ctx.fillRect(x,y,sz,sz);
    // Nebula wisps
    const nc=ctx.createRadialGradient(x+sz*0.55,y+sz*0.45,0,x+sz*0.55,y+sz*0.45,sz*0.4);
    nc.addColorStop(0,rgba(r,g,b,0.28));nc.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=nc;ctx.fillRect(x,y,sz,sz);
    // Stars
    const rng=seeded(r*29+g*17+b*11+sz);
    for(let i=0;i<16;i++){const sx=x+2+rng()*(sz-4),sy=y+2+rng()*(sz-4),big=rng()<0.15;const br=0.4+rng()*0.6;ctx.fillStyle=rgba(cl(r+120,0,255),cl(g+110,0,255),cl(b+155,0,255),br);ctx.fillRect(sx,sy,big?2:1,big?2:1);}
    // Spiral hint
    ctx.strokeStyle=rgba(cl(r+80,0,255),cl(g+80,0,255),cl(b+120,0,255),0.2);ctx.lineWidth=sz/20;
    ctx.beginPath();for(let a=0;a<Math.PI*3;a+=0.1){const ar=a/(Math.PI*3)*sz*0.35;ctx.lineTo(x+sz/2+Math.cos(a)*ar,y+sz/2+Math.sin(a)*ar);}ctx.stroke();
    // Center bright
    const cg=ctx.createRadialGradient(x+sz*0.42,y+sz*0.4,0,x+sz*0.42,y+sz*0.4,sz*0.18);
    cg.addColorStop(0,'rgba(255,255,255,0.7)');cg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=cg;ctx.fillRect(x,y,sz,sz);
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
  if(ti===5){// Icy ground
    const ig=c.createLinearGradient(0,H*0.75,0,H);ig.addColorStop(0,'rgba(140,200,255,0)');ig.addColorStop(1,'rgba(140,200,255,0.12)');c.fillStyle=ig;c.fillRect(0,H*0.75,W,H*0.25);
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
    case 1:fx.grains=Array.from({length:50},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(1.2,2.8),vy:rnd(-0.12,0.12),sz:rnd(1,2.2),a:rnd(0.15,0.4)}));break;
    case 2:fx.bubbles=Array.from({length:22},()=>({x:rnd(0,W),y:rnd(H*0.4,H),vy:rnd(-0.35,-0.09),vx:rnd(-0.1,0.1),sz:rnd(2,7),a:rnd(0.12,0.32),wave:rnd(0,Math.PI*2)}));fx.wo=0;break;
    case 3:fx.embers=Array.from({length:30},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(-1.2,-0.3),vx:rnd(-0.35,0.35),sz:rnd(1,3.5),life:rnd(0,120),ml:120,rc:rndc([255,255,200]),gc_:rndc([80,140,40])}));break;
    case 4:fx.stars=Array.from({length:120},()=>({x:rnd(0,W),y:rnd(0,H*0.78),br:rnd(80,210),ph:rnd(0,Math.PI*2),sp:rnd(0.002,0.006),sz:Math.random()<0.18?2:1}));fx.shoot=null;fx.st=rnd(80,200);fx.ao=0;break;
    case 5:fx.snow=Array.from({length:35},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(0.25,0.9),vx:rnd(-0.25,0.25),sz:rnd(2.5,8),rot:rnd(0,360),vrot:rnd(-0.8,0.8),a:rnd(0.35,0.85)}));fx.ao=0;break;
    case 6:fx.nebula=Array.from({length:5},()=>({x:rnd(W*0.1,W*0.9),y:rnd(H*0.1,H*0.9),r:rnd(55,130),col:rndc(['#3808A0','#700850','#0838A0','#501878']),a:rnd(0.05,0.12),vx:rnd(-0.06,0.06),vy:rnd(-0.05,0.05)}));fx.comet=null;fx.ct=rnd(120,280);break;
    case 7:fx.flies=Array.from({length:22},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.35,0.35),vy:rnd(-0.4,0.4),ph:rnd(0,Math.PI*2),col:rndc(['#40F060','#80F040','#40FFBC']),sz:rnd(1.5,4.5)}));break;
    case 8:fx.wo=0;fx.birds=Array.from({length:3},()=>({x:rnd(0,W),y:rnd(H*0.08,H*0.32),vx:rnd(0.4,1.0),phase:rnd(0,Math.PI*2),sz:rnd(8,15)}));fx.jelly=Array.from({length:6},()=>({x:rnd(0,W),y:rnd(H*0.35,H*0.82),vx:rnd(-0.14,0.14),vy:rnd(-0.22,-0.07),sz:rnd(14,30),ph:rnd(0,Math.PI*2),psp:rnd(0.0018,0.004),col:rndc(['#FF80C0','#80D0FF','#A060FF','#60FFD0','#FFB040']),tph:Array.from({length:4},()=>rnd(0,Math.PI*2))}));break;
    case 9:fx.vehicles=Array.from({length:5},()=>({x:rnd(-120,-10),y:rnd(H*0.22,H*0.57),vx:rnd(2.8,7.0),col:rndc(['#00DDFF','#FF40A0','#FF8020','#A040FF','#40FFD0']),sz:rnd(2.5,5.5),trail:rnd(28,60)}));fx.rain=Array.from({length:55},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(7,15),len:rnd(8,20),a:rnd(0.06,0.15)}));fx.wins=Array.from({length:85},()=>({x:rnd(4,W-4),y:rnd(H*0.10,H*0.59),w:rnd(4,9),h:rnd(3,7),col:rndc(['#00DDFF','#A040FF','#FFD080']),ph:rnd(0,Math.PI*2),sp:rnd(0.002,0.009),on:Math.random()<0.65}));fx.holo=0;fx.gY=H*0.62;break;
  }
  return fx;
}

function drawFx(ctx,fx,t){
  const th=THEMES[fx.ti];
  switch(fx.ti){
    case 0:{
      // Brume de sol ondulante (couche basse)
      fx.mist.forEach(m=>{m.x=(m.x+m.vx);if(m.x>W+m.w){m.x=-m.w;m.y=rnd(H*0.72,H*0.96);}const wave=Math.sin(t*0.00065+m.ph)*m.h*0.28;const mg=ctx.createRadialGradient(m.x,m.y+wave,2,m.x,m.y+wave,m.w*0.55);mg.addColorStop(0,`rgba(180,240,160,${(m.a).toFixed(3)})`);mg.addColorStop(0.6,`rgba(120,200,100,${(m.a*0.45).toFixed(3)})`);mg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=mg;ctx.beginPath();ctx.ellipse(m.x,m.y+wave,m.w*0.55,m.h,0,0,Math.PI*2);ctx.fill();});
      // Feuilles tombantes
      ctx.save();fx.leaves.forEach(lf=>{lf.x+=lf.vx+Math.sin(t*0.001+lf.wave)*0.3;lf.y+=lf.vy;lf.ang+=lf.vrot;lf.wave+=0.018;if(lf.y>H+18){lf.y=-15;lf.x=Math.random()*W;}const a=lf.ang*Math.PI/180,sz=lf.sz;ctx.globalAlpha=0.38;ctx.fillStyle=lf.col;ctx.beginPath();ctx.moveTo(lf.x+Math.cos(a)*sz,lf.y+Math.sin(a)*sz);ctx.lineTo(lf.x+Math.cos(a+2.1)*sz*0.5,lf.y+Math.sin(a+2.1)*sz*0.5);ctx.lineTo(lf.x,lf.y);ctx.closePath();ctx.fill();});ctx.restore();
      // Lucioles lumineuses pulsantes
      fx.glows.forEach(gl=>{gl.x+=gl.vx+Math.sin(t*0.0009+gl.ph)*0.38;gl.y+=gl.vy+Math.cos(t*0.0007+gl.ph*1.3)*0.22;gl.ph+=gl.psp;if(gl.x<-12)gl.x=W+12;if(gl.x>W+12)gl.x=-12;if(gl.y<H*0.35)gl.vy=Math.abs(gl.vy)*0.6+0.05;if(gl.y>H+10){gl.y=rnd(H*0.42,H*0.92);gl.x=rnd(0,W);}const pulse=0.45+0.55*Math.abs(Math.sin(t*gl.psp*2.8+gl.ph));const gr=ctx.createRadialGradient(gl.x,gl.y,0,gl.x,gl.y,gl.sz*4.5);gr.addColorStop(0,hexA(gl.col,0.72*pulse));gr.addColorStop(0.45,hexA(gl.col,0.18*pulse));gr.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=gr;ctx.beginPath();ctx.arc(gl.x,gl.y,gl.sz*4.5,0,Math.PI*2);ctx.fill();ctx.fillStyle=hexA(gl.col,0.90*pulse);ctx.beginPath();ctx.arc(gl.x,gl.y,gl.sz*0.7,0,Math.PI*2);ctx.fill();});break;}
    case 1:fx.grains.forEach(g=>{g.x=(g.x+g.vx)%W;g.y+=g.vy+Math.sin(t*0.002+g.x*0.01)*0.1;ctx.fillStyle=`rgba(185,145,65,${g.a})`;ctx.beginPath();ctx.arc(g.x,g.y,g.sz,0,Math.PI*2);ctx.fill();});const sx=W-50,sy=40;const sg2=ctx.createRadialGradient(sx,sy,6,sx,sy,36);sg2.addColorStop(0,'rgba(255,235,75,0.95)');sg2.addColorStop(1,'rgba(255,195,55,0)');ctx.fillStyle=sg2;ctx.beginPath();ctx.arc(sx,sy,36,0,Math.PI*2);ctx.fill();ctx.fillStyle='#FFD030';ctx.beginPath();ctx.arc(sx,sy,15,0,Math.PI*2);ctx.fill();for(let a=0;a<12;a++){const rad=a*Math.PI/6+t*0.0004;ctx.strokeStyle='rgba(255,210,50,0.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sx+Math.cos(rad)*19,sy+Math.sin(rad)*19);ctx.lineTo(sx+Math.cos(rad)*30,sy+Math.sin(rad)*30);ctx.stroke();}break;
    case 2:fx.wo+=0.012;[[16,1.0,0.09,H-44],[11,1.3,0.16,H-27],[7,1.6,0.24,H-11]].forEach(([amp,sp,a,yb])=>{ctx.fillStyle=hexA(th.dc,a);ctx.beginPath();ctx.moveTo(0,H);for(let wx=0;wx<=W+8;wx+=6){const wy=yb+amp*Math.sin(wx*0.012+fx.wo*sp);wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}ctx.lineTo(W,H);ctx.closePath();ctx.fill();});fx.bubbles.forEach(b=>{b.x+=b.vx+Math.sin(t*0.001+b.wave)*0.25;b.y+=b.vy;b.wave+=0.013;if(b.y<-10){b.y=H+10;b.x=Math.random()*W;}ctx.strokeStyle=`rgba(160,220,255,${b.a})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(b.x,b.y,b.sz,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(255,255,255,${(b.a*0.28).toFixed(2)})`;ctx.beginPath();ctx.arc(b.x-b.sz*0.3,b.y-b.sz*0.3,Math.max(1,b.sz*0.28),0,Math.PI*2);ctx.fill();});break;
    case 3:const lg=ctx.createLinearGradient(0,H-55,0,H);lg.addColorStop(0,'rgba(210,48,5,0)');lg.addColorStop(1,'rgba(210,48,5,0.5)');ctx.fillStyle=lg;ctx.fillRect(0,H-55,W,55);ctx.fillStyle='rgb(188,38,4)';ctx.beginPath();ctx.moveTo(0,H);for(let lx=0;lx<=W+8;lx+=8){const ly=H-12+8*Math.sin(lx*0.025+t*0.002);lx===0?ctx.moveTo(lx,ly):ctx.lineTo(lx,ly);}ctx.lineTo(W,H);ctx.closePath();ctx.fill();fx.embers.forEach(em=>{em.x+=em.vx+Math.sin(t*0.003+em.x*0.02)*0.4;em.y+=em.vy;em.life--;if(em.life<=0||em.y<-10){em.x=Math.random()*W;em.y=H-20;em.vy=rnd(-1.2,-0.3);em.life=120;}const ratio=em.life/em.ml;ctx.fillStyle=`rgba(${em.rc},${em.gc_},5,${(0.68*ratio).toFixed(2)})`;ctx.beginPath();ctx.arc(em.x,em.y,em.sz,0,Math.PI*2);ctx.fill();});break;
    case 4:[[60,175,115],[75,115,215],[115,55,195],[38,155,175]].forEach(([r,g,b],i)=>{const ay=H*0.05+i*32+13*Math.sin(t*0.001+i*1.2),aw=18+9*Math.sin(t*0.0013+i*0.7),ag=ctx.createLinearGradient(0,ay,0,ay+aw+22);const aa=(0.16*Math.abs(Math.sin(t*0.001+i))).toFixed(3);ag.addColorStop(0,`rgba(${r},${g},${b},0)`);ag.addColorStop(0.5,`rgba(${r},${g},${b},${aa})`);ag.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.fillStyle=ag;ctx.fillRect(0,ay,W,aw+22);});fx.stars.forEach(st=>{const br=cl(st.br*(0.5+0.5*Math.sin(t*st.sp+st.ph)),18,255)|0;ctx.fillStyle=`rgba(${br},${br},${cl(br+20,0,255)},0.9)`;ctx.beginPath();ctx.arc(st.x,st.y,st.sz,0,Math.PI*2);ctx.fill();});fx.st-=1/60;if(fx.st<=0){fx.shoot={x:rnd(0,W),y:rnd(0,H*0.25),vx:rnd(5,9),vy:rnd(2,4),life:28};fx.st=rnd(90,220);}if(fx.shoot){fx.shoot.x+=fx.shoot.vx;fx.shoot.y+=fx.shoot.vy;fx.shoot.life--;if(fx.shoot.life>0){const a2=(fx.shoot.life/28).toFixed(2);ctx.strokeStyle=`rgba(255,255,210,${a2})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx.shoot.x,fx.shoot.y);ctx.lineTo(fx.shoot.x-fx.shoot.vx*4,fx.shoot.y-fx.shoot.vy*4);ctx.stroke();}else fx.shoot=null;}break;
    case 5:[[78,195,250],[110,175,255],[95,215,195]].forEach(([r,g,b],i)=>{const ay=H*0.04+i*28+10*Math.sin(t*0.001+i*1.3),aw=14+8*Math.sin(t*0.0012+i*0.8);const ag=ctx.createLinearGradient(0,ay,0,ay+aw+18);const aa=(0.12*Math.abs(Math.sin(t*0.0009+i))).toFixed(3);ag.addColorStop(0,`rgba(${r},${g},${b},0)`);ag.addColorStop(0.5,`rgba(${r},${g},${b},${aa})`);ag.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.fillStyle=ag;ctx.fillRect(0,ay,W,aw+18);});fx.snow.forEach(sf=>{sf.x+=sf.vx+Math.sin(t*0.001+sf.y*0.018)*0.28;sf.y+=sf.vy;sf.rot+=sf.vrot;if(sf.y>H+18){sf.y=-12;sf.x=Math.random()*W;}ctx.save();ctx.translate(sf.x,sf.y);ctx.rotate(sf.rot*Math.PI/180);ctx.strokeStyle=`rgba(195,232,255,${sf.a})`;ctx.lineWidth=1;const sl=sf.sz;for(let a=0;a<6;a++){const rad=a*Math.PI/3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(rad)*sl,Math.sin(rad)*sl);ctx.stroke();const mx=Math.cos(rad)*sl*0.55,my=Math.sin(rad)*sl*0.55,b1=Math.cos(rad+Math.PI/4)*sl*0.22,b2=Math.sin(rad+Math.PI/4)*sl*0.22;ctx.beginPath();ctx.moveTo(mx-b1,my-b2);ctx.lineTo(mx+b1,my+b2);ctx.stroke();}ctx.restore();});break;
    case 6:fx.nebula.forEach(nb=>{nb.x=(nb.x+nb.vx+W)%W;nb.y=(nb.y+nb.vy+H)%H;const ng=ctx.createRadialGradient(nb.x,nb.y,4,nb.x,nb.y,nb.r);ng.addColorStop(0,hexA(nb.col,nb.a));ng.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ng;ctx.beginPath();ctx.arc(nb.x,nb.y,nb.r,0,Math.PI*2);ctx.fill();});fx.ct-=1/60;if(fx.ct<=0){fx.comet={x:rnd(0,W),y:rnd(0,H*0.22),vx:rnd(6,11),vy:rnd(2,5),life:32};fx.ct=rnd(140,320);}if(fx.comet){fx.comet.x+=fx.comet.vx;fx.comet.y+=fx.comet.vy;fx.comet.life--;if(fx.comet.life>0){const a2=(fx.comet.life/32).toFixed(2),cg=ctx.createLinearGradient(fx.comet.x,fx.comet.y,fx.comet.x-fx.comet.vx*7,fx.comet.y-fx.comet.vy*7);cg.addColorStop(0,`rgba(190,140,255,${a2})`);cg.addColorStop(1,'rgba(80,40,190,0)');ctx.strokeStyle=cg;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(fx.comet.x,fx.comet.y);ctx.lineTo(fx.comet.x-fx.comet.vx*7,fx.comet.y-fx.comet.vy*7);ctx.stroke();ctx.fillStyle=`rgba(215,175,255,${a2})`;ctx.beginPath();ctx.arc(fx.comet.x,fx.comet.y,2.5,0,Math.PI*2);ctx.fill();}else fx.comet=null;}break;
    case 7:const gg2=ctx.createLinearGradient(0,H-55,0,H);gg2.addColorStop(0,'rgba(16,90,35,0)');gg2.addColorStop(1,'rgba(16,90,35,0.22)');ctx.fillStyle=gg2;ctx.fillRect(0,H-55,W,55);fx.flies.forEach(fl=>{fl.x+=fl.vx+Math.sin(t*0.0014+fl.ph)*0.45;fl.y+=fl.vy+Math.cos(t*0.001+fl.ph)*0.32;fl.x=(fl.x+W)%W;fl.y=(fl.y+H)%H;fl.ph+=0.009;const fa=0.28+0.72*Math.abs(Math.sin(t*0.003+fl.ph));const fg2=ctx.createRadialGradient(fl.x,fl.y,0,fl.x,fl.y,fl.sz*3);fg2.addColorStop(0,hexA(fl.col,fa*0.9));fg2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=fg2;ctx.beginPath();ctx.arc(fl.x,fl.y,fl.sz*3,0,Math.PI*2);ctx.fill();ctx.fillStyle=hexA(fl.col,fa);ctx.beginPath();ctx.arc(fl.x,fl.y,fl.sz,0,Math.PI*2);ctx.fill();});break;
    case 8:fx.wo+=0.009;[[0.08,H-40],[0.15,H-24],[0.24,H-9]].forEach(([a,yb])=>{ctx.fillStyle=hexA(th.dc,a);ctx.beginPath();ctx.moveTo(0,H);for(let wx=0;wx<=W+8;wx+=6){const wy=yb+9*Math.sin(wx*0.014+fx.wo);wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}ctx.lineTo(W,H);ctx.closePath();ctx.fill();});ctx.fillStyle='rgba(255,190,90,0.05)';ctx.fillRect(0,H-55,W,55);fx.jelly.forEach(jl=>{jl.x=(jl.x+jl.vx+W)%W;jl.y+=jl.vy+Math.sin(t*jl.psp+jl.ph)*0.12;if(jl.y<-jl.sz*2.5){jl.y=H+jl.sz;jl.x=rnd(0,W);}const pulse=0.82+0.18*Math.sin(t*jl.psp*2.2+jl.ph);const jr=hr(jl.col),jg=hg(jl.col),jb=hb(jl.col);const jw=jl.sz*pulse,jh=jl.sz*0.58*pulse;ctx.save();const jglow=ctx.createRadialGradient(jl.x,jl.y,0,jl.x,jl.y,jw*1.7);jglow.addColorStop(0,`rgba(${jr},${jg},${jb},0.18)`);jglow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=jglow;ctx.beginPath();ctx.arc(jl.x,jl.y,jw*1.7,0,Math.PI*2);ctx.fill();const jdome=ctx.createRadialGradient(jl.x,jl.y-jh*0.3,jw*0.1,jl.x,jl.y,jw);jdome.addColorStop(0,`rgba(255,255,255,0.38)`);jdome.addColorStop(0.4,`rgba(${jr},${jg},${jb},0.28)`);jdome.addColorStop(1,`rgba(${jr},${jg},${jb},0.08)`);ctx.fillStyle=jdome;ctx.beginPath();ctx.ellipse(jl.x,jl.y,jw,jh,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.strokeStyle=`rgba(${jr},${jg},${jb},0.30)`;ctx.lineWidth=0.8;ctx.stroke();for(let ti2=0;ti2<4;ti2++){const tx=jl.x+(ti2-1.5)*jw*0.45;const tph2=jl.tph[ti2];const wave1=Math.sin(t*0.002+tph2)*jw*0.28,wave2=Math.sin(t*0.0017+tph2+1.2)*jw*0.22;const tlen=jl.sz*(1.2+0.4*Math.abs(Math.sin(t*jl.psp+tph2)));ctx.strokeStyle=`rgba(${jr},${jg},${jb},0.28)`;ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(tx,jl.y);ctx.bezierCurveTo(tx+wave1,jl.y+tlen*0.35,tx+wave2,jl.y+tlen*0.65,tx+wave1*0.5,jl.y+tlen);ctx.stroke();}ctx.restore();});fx.birds.forEach(b=>{b.x=(b.x+b.vx)%W;const by=b.y+Math.sin(t*0.002+b.phase)*5;ctx.strokeStyle='rgba(55,18,8,0.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b.x,by);ctx.quadraticCurveTo(b.x+b.sz/2,by-b.sz*0.42,b.x+b.sz,by);ctx.stroke();});break;
    case 9:{const _g9=ctx.createLinearGradient(0,fx.gY,0,fx.gY+45);_g9.addColorStop(0,'rgba(0,70,160,0.10)');_g9.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=_g9;ctx.fillRect(0,fx.gY,W,45);fx.rain.forEach(r=>{r.y+=r.vy;if(r.y>H+r.len){r.y=-r.len;r.x=rnd(0,W);}ctx.strokeStyle=`rgba(80,150,220,${r.a})`;ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+1.5,r.y+r.len);ctx.stroke();});fx.wins.forEach(w=>{const p=0.5+0.5*Math.sin(t*w.sp+w.ph);const a=((w.on?0.42+0.28*p:0.04+0.07*p)).toFixed(2);ctx.fillStyle=w.col==='#00DDFF'?`rgba(0,220,255,${a})`:w.col==='#A040FF'?`rgba(160,55,255,${a})`:`rgba(255,210,100,${a})`;ctx.fillRect(w.x,w.y,w.w,w.h);if(Math.random()<0.003)w.on=!w.on;});fx.vehicles.forEach(v=>{v.x+=v.vx;if(v.x>W+v.trail+10){v.x=-v.trail-10;v.y=rnd(H*0.22,H*0.57);v.vx=rnd(2.8,7.0);v.col=rndc(['#00DDFF','#FF40A0','#FF8020','#A040FF','#40FFD0']);}const _t9=ctx.createLinearGradient(v.x-v.trail,v.y,v.x,v.y);_t9.addColorStop(0,'rgba(0,0,0,0)');_t9.addColorStop(1,hexA(v.col,0.88));ctx.strokeStyle=_t9;ctx.lineWidth=v.sz*0.45;ctx.beginPath();ctx.moveTo(v.x-v.trail,v.y);ctx.lineTo(v.x,v.y);ctx.stroke();ctx.save();ctx.shadowColor=v.col;ctx.shadowBlur=v.sz*5.5;ctx.fillStyle=hexA(v.col,0.95);ctx.beginPath();ctx.arc(v.x,v.y,v.sz,0,Math.PI*2);ctx.fill();ctx.restore();});fx.holo=(fx.holo+0.9)%H;ctx.fillStyle='rgba(0,200,255,0.020)';ctx.fillRect(0,fx.holo,W,2);break;}
  }
}
