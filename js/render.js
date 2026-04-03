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

    case 4:fx.stars=Array.from({length:120},()=>({x:rnd(0,W),y:rnd(0,H*0.78),br:rnd(80,210),ph:rnd(0,Math.PI*2),sp:rnd(0.002,0.006),sz:Math.random()<0.18?2:1}));fx.shoot=null;fx.st=rnd(80,200);fx.ao=0;break;
    case 5:fx.snow=Array.from({length:35},()=>({x:rnd(0,W),y:rnd(0,H),vy:rnd(0.25,0.9),vx:rnd(-0.25,0.25),sz:rnd(2.5,8),rot:rnd(0,360),vrot:rnd(-0.8,0.8),a:rnd(0.35,0.85)}));fx.ao=0;break;
    case 6:fx.nebula=Array.from({length:5},()=>({x:rnd(W*0.1,W*0.9),y:rnd(H*0.1,H*0.9),r:rnd(55,130),col:rndc(['#3808A0','#700850','#0838A0','#501878']),a:rnd(0.05,0.12),vx:rnd(-0.06,0.06),vy:rnd(-0.05,0.05)}));fx.comet=null;fx.ct=rnd(120,280);break;
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
      break;}

    case 4:[[60,175,115],[75,115,215],[115,55,195],[38,155,175]].forEach(([r,g,b],i)=>{const ay=H*0.05+i*32+13*Math.sin(t*0.001+i*1.2),aw=18+9*Math.sin(t*0.0013+i*0.7),ag=ctx.createLinearGradient(0,ay,0,ay+aw+22);const aa=(0.16*Math.abs(Math.sin(t*0.001+i))).toFixed(3);ag.addColorStop(0,`rgba(${r},${g},${b},0)`);ag.addColorStop(0.5,`rgba(${r},${g},${b},${aa})`);ag.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.fillStyle=ag;ctx.fillRect(0,ay,W,aw+22);});fx.stars.forEach(st=>{const br=cl(st.br*(0.5+0.5*Math.sin(t*st.sp+st.ph)),18,255)|0;ctx.fillStyle=`rgba(${br},${br},${cl(br+20,0,255)},0.9)`;ctx.beginPath();ctx.arc(st.x,st.y,st.sz,0,Math.PI*2);ctx.fill();});fx.st-=1/60;if(fx.st<=0){fx.shoot={x:rnd(0,W),y:rnd(0,H*0.25),vx:rnd(5,9),vy:rnd(2,4),life:28};fx.st=rnd(90,220);}if(fx.shoot){fx.shoot.x+=fx.shoot.vx;fx.shoot.y+=fx.shoot.vy;fx.shoot.life--;if(fx.shoot.life>0){const a2=(fx.shoot.life/28).toFixed(2);ctx.strokeStyle=`rgba(255,255,210,${a2})`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(fx.shoot.x,fx.shoot.y);ctx.lineTo(fx.shoot.x-fx.shoot.vx*4,fx.shoot.y-fx.shoot.vy*4);ctx.stroke();}else fx.shoot=null;}break;
    case 5:[[78,195,250],[110,175,255],[95,215,195]].forEach(([r,g,b],i)=>{const ay=H*0.04+i*28+10*Math.sin(t*0.001+i*1.3),aw=14+8*Math.sin(t*0.0012+i*0.8);const ag=ctx.createLinearGradient(0,ay,0,ay+aw+18);const aa=(0.12*Math.abs(Math.sin(t*0.0009+i))).toFixed(3);ag.addColorStop(0,`rgba(${r},${g},${b},0)`);ag.addColorStop(0.5,`rgba(${r},${g},${b},${aa})`);ag.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.fillStyle=ag;ctx.fillRect(0,ay,W,aw+18);});fx.snow.forEach(sf=>{sf.x+=sf.vx+Math.sin(t*0.001+sf.y*0.018)*0.28;sf.y+=sf.vy;sf.rot+=sf.vrot;if(sf.y>H+18){sf.y=-12;sf.x=Math.random()*W;}ctx.save();ctx.translate(sf.x,sf.y);ctx.rotate(sf.rot*Math.PI/180);ctx.strokeStyle=`rgba(195,232,255,${sf.a})`;ctx.lineWidth=1;const sl=sf.sz;for(let a=0;a<6;a++){const rad=a*Math.PI/3;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(rad)*sl,Math.sin(rad)*sl);ctx.stroke();const mx=Math.cos(rad)*sl*0.55,my=Math.sin(rad)*sl*0.55,b1=Math.cos(rad+Math.PI/4)*sl*0.22,b2=Math.sin(rad+Math.PI/4)*sl*0.22;ctx.beginPath();ctx.moveTo(mx-b1,my-b2);ctx.lineTo(mx+b1,my+b2);ctx.stroke();}ctx.restore();});break;
    case 6:fx.nebula.forEach(nb=>{nb.x=(nb.x+nb.vx+W)%W;nb.y=(nb.y+nb.vy+H)%H;const ng=ctx.createRadialGradient(nb.x,nb.y,4,nb.x,nb.y,nb.r);ng.addColorStop(0,hexA(nb.col,nb.a));ng.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ng;ctx.beginPath();ctx.arc(nb.x,nb.y,nb.r,0,Math.PI*2);ctx.fill();});fx.ct-=1/60;if(fx.ct<=0){fx.comet={x:rnd(0,W),y:rnd(0,H*0.22),vx:rnd(6,11),vy:rnd(2,5),life:32};fx.ct=rnd(140,320);}if(fx.comet){fx.comet.x+=fx.comet.vx;fx.comet.y+=fx.comet.vy;fx.comet.life--;if(fx.comet.life>0){const a2=(fx.comet.life/32).toFixed(2),cg=ctx.createLinearGradient(fx.comet.x,fx.comet.y,fx.comet.x-fx.comet.vx*7,fx.comet.y-fx.comet.vy*7);cg.addColorStop(0,`rgba(190,140,255,${a2})`);cg.addColorStop(1,'rgba(80,40,190,0)');ctx.strokeStyle=cg;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(fx.comet.x,fx.comet.y);ctx.lineTo(fx.comet.x-fx.comet.vx*7,fx.comet.y-fx.comet.vy*7);ctx.stroke();ctx.fillStyle=`rgba(215,175,255,${a2})`;ctx.beginPath();ctx.arc(fx.comet.x,fx.comet.y,2.5,0,Math.PI*2);ctx.fill();}else fx.comet=null;}break;
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

    case 8:fx.wo+=0.009;[[0.08,H-40],[0.15,H-24],[0.24,H-9]].forEach(([a,yb])=>{ctx.fillStyle=hexA(th.dc,a);ctx.beginPath();ctx.moveTo(0,H);for(let wx=0;wx<=W+8;wx+=6){const wy=yb+9*Math.sin(wx*0.014+fx.wo);wx===0?ctx.moveTo(wx,wy):ctx.lineTo(wx,wy);}ctx.lineTo(W,H);ctx.closePath();ctx.fill();});ctx.fillStyle='rgba(255,190,90,0.05)';ctx.fillRect(0,H-55,W,55);fx.jelly.forEach(jl=>{jl.x=(jl.x+jl.vx+W)%W;jl.y+=jl.vy+Math.sin(t*jl.psp+jl.ph)*0.12;if(jl.y<-jl.sz*2.5){jl.y=H+jl.sz;jl.x=rnd(0,W);}const pulse=0.82+0.18*Math.sin(t*jl.psp*2.2+jl.ph);const jr=hr(jl.col),jg=hg(jl.col),jb=hb(jl.col);const jw=jl.sz*pulse,jh=jl.sz*0.58*pulse;ctx.save();const jglow=ctx.createRadialGradient(jl.x,jl.y,0,jl.x,jl.y,jw*1.7);jglow.addColorStop(0,`rgba(${jr},${jg},${jb},0.18)`);jglow.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=jglow;ctx.beginPath();ctx.arc(jl.x,jl.y,jw*1.7,0,Math.PI*2);ctx.fill();const jdome=ctx.createRadialGradient(jl.x,jl.y-jh*0.3,jw*0.1,jl.x,jl.y,jw);jdome.addColorStop(0,`rgba(255,255,255,0.38)`);jdome.addColorStop(0.4,`rgba(${jr},${jg},${jb},0.28)`);jdome.addColorStop(1,`rgba(${jr},${jg},${jb},0.08)`);ctx.fillStyle=jdome;ctx.beginPath();ctx.ellipse(jl.x,jl.y,jw,jh,0,Math.PI,0);ctx.closePath();ctx.fill();ctx.strokeStyle=`rgba(${jr},${jg},${jb},0.30)`;ctx.lineWidth=0.8;ctx.stroke();for(let ti2=0;ti2<4;ti2++){const tx=jl.x+(ti2-1.5)*jw*0.45;const tph2=jl.tph[ti2];const wave1=Math.sin(t*0.002+tph2)*jw*0.28,wave2=Math.sin(t*0.0017+tph2+1.2)*jw*0.22;const tlen=jl.sz*(1.2+0.4*Math.abs(Math.sin(t*jl.psp+tph2)));ctx.strokeStyle=`rgba(${jr},${jg},${jb},0.28)`;ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(tx,jl.y);ctx.bezierCurveTo(tx+wave1,jl.y+tlen*0.35,tx+wave2,jl.y+tlen*0.65,tx+wave1*0.5,jl.y+tlen);ctx.stroke();}ctx.restore();});fx.birds.forEach(b=>{b.x=(b.x+b.vx)%W;const by=b.y+Math.sin(t*0.002+b.phase)*5;ctx.strokeStyle='rgba(55,18,8,0.55)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(b.x,by);ctx.quadraticCurveTo(b.x+b.sz/2,by-b.sz*0.42,b.x+b.sz,by);ctx.stroke();});break;
    case 9:{const _g9=ctx.createLinearGradient(0,fx.gY,0,fx.gY+45);_g9.addColorStop(0,'rgba(0,70,160,0.10)');_g9.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=_g9;ctx.fillRect(0,fx.gY,W,45);fx.rain.forEach(r=>{r.y+=r.vy;if(r.y>H+r.len){r.y=-r.len;r.x=rnd(0,W);}ctx.strokeStyle=`rgba(80,150,220,${r.a})`;ctx.lineWidth=0.7;ctx.beginPath();ctx.moveTo(r.x,r.y);ctx.lineTo(r.x+1.5,r.y+r.len);ctx.stroke();});fx.wins.forEach(w=>{const p=0.5+0.5*Math.sin(t*w.sp+w.ph);const a=((w.on?0.42+0.28*p:0.04+0.07*p)).toFixed(2);ctx.fillStyle=w.col==='#00DDFF'?`rgba(0,220,255,${a})`:w.col==='#A040FF'?`rgba(160,55,255,${a})`:`rgba(255,210,100,${a})`;ctx.fillRect(w.x,w.y,w.w,w.h);if(Math.random()<0.003)w.on=!w.on;});fx.vehicles.forEach(v=>{v.x+=v.vx;if(v.x>W+v.trail+10){v.x=-v.trail-10;v.y=rnd(H*0.22,H*0.57);v.vx=rnd(2.8,7.0);v.col=rndc(['#00DDFF','#FF40A0','#FF8020','#A040FF','#40FFD0']);}const _t9=ctx.createLinearGradient(v.x-v.trail,v.y,v.x,v.y);_t9.addColorStop(0,'rgba(0,0,0,0)');_t9.addColorStop(1,hexA(v.col,0.88));ctx.strokeStyle=_t9;ctx.lineWidth=v.sz*0.45;ctx.beginPath();ctx.moveTo(v.x-v.trail,v.y);ctx.lineTo(v.x,v.y);ctx.stroke();ctx.save();ctx.shadowColor=v.col;ctx.shadowBlur=v.sz*5.5;ctx.fillStyle=hexA(v.col,0.95);ctx.beginPath();ctx.arc(v.x,v.y,v.sz,0,Math.PI*2);ctx.fill();ctx.restore();});fx.holo=(fx.holo+0.9)%H;ctx.fillStyle='rgba(0,200,255,0.020)';ctx.fillRect(0,fx.holo,W,2);break;}
  }
}
