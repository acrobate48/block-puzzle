'use strict';
// ─── MENU ────────────────────────────────────────────────────────────────────
let menuBg=buildBg(0),menuFx=initFx(0);
let menuDeco=Array.from({length:12},()=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.28,0.28),vy:rnd(-0.18,0.18),color:rndc(COLORS),skin:rndI(0,9),sz:rnd(22,48)}));
let menuParts=Array.from({length:70},(_,i)=>{
  const big=i<12;
  return{x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.5,0.5),vy:rnd(big?-0.5:-1.4,big?-0.15:-0.3),
    color:rndc(COLORS),size:big?rnd(4,9):rnd(1.5,4),life:rnd(0,big?240:180),ml:big?240:180,star:big};
});
let skinRects=[],themeRects=[],playRect=null;
// ─── LIVE THEME HOVER PREVIEW ─────────────────────────────────────────────────
let _menuHoverTheme=-1,_menuHoverAlpha=0;
// ─── MENU CLICK RIPPLES ───────────────────────────────────────────────────────
let _menuRipples=[];
function _addMenuRipple(x,y,col,maxR){
  _menuRipples.push({x,y,r:0,maxR:maxR||90,col,born:Date.now()});
}

function layoutMenu(){
  // Compact mode for small/medium screens (height < 750px) to prevent layout overflow
  const _compact=H<750;
  const SKW=Math.floor((W-18)/5)-4;
  // On compact screens: tighter font sizing to save vertical space
  const _fsz=_compact?cl(Math.floor(H*0.070),18,38):cl(Math.floor(H*0.082),20,62);
  const _titleY=Math.round(H*(_compact?0.072:0.086))+_fsz;
  const _subSz=cl(Math.floor(H*0.022),8,15);
  const _lblSz=cl(Math.floor(H*0.020),7,13);
  const _subBottom=Math.ceil(_titleY+_fsz*2.28+_subSz);
  // On compact screens: smaller skin cards and tighter gaps
  const SKH=_compact?Math.round(SKW*0.62):Math.round(SKW*0.92);
  const _skMinY=_compact?Math.round(H*0.22):Math.round(H*0.30);
  const skGY=Math.max(_subBottom+_lblSz+(_compact?3:8),_skMinY);
  skinRects=Array.from({length:10},(_,i)=>({x:8+(i%5)*(SKW+4),y:skGY+(i<5?0:SKH+(_compact?3:5)),w:SKW,h:SKH}));
  const THW=Math.floor((W-18)/5)-4;
  // Compact: smaller theme buttons
  const THH=_compact?cl(Math.round(H*0.038),16,24):cl(Math.round(H*0.05),20,36);
  // Compact: tighter inter-section gaps
  const _skThGap=_compact?(_lblSz+5):(_lblSz+16);
  const _skRowGap=_compact?2:5;
  const THY=skGY+SKH*2+_skRowGap+_skThGap;
  themeRects=Array.from({length:10},(_,i)=>({x:8+(i%5)*(THW+4),y:THY+(i<5?0:THH+(_compact?2:4)),w:THW,h:THH}));
  const PW=cl(W-52,148,275);
  const PH=_compact?cl(Math.round(H*0.068),32,46):cl(Math.round(H*0.075),36,58);
  const lastThY=THY+THH*2+(_compact?3:7);
  // Son : petit bouton icône fixé en haut à droite (hors du flux vertical)
  _soundRect={x:W-44,y:6,w:38,h:38};
  // Réserve de l'espace pour RECORD + combo + "Toucher JOUER" en bas
  const _bsz=cl(Math.floor(H*0.020),8,14);
  const _btmReserve=_bsz*4.5+10;
  const numBtns=hasSave?3:2;
  // Minimum gap between buttons (compact: 3px, normal: 4px)
  const _minBtnGap=_compact?3:4;
  // Total vertical space required by button stack
  const _btnStack=PH*numBtns+_minBtnGap*(numBtns-1);
  // Available zone: from just below theme section to just above bottom reserve
  const _btnZoneTop=lastThY+(_compact?3:Math.round(H*0.018));
  const _btnZoneBot=H-_btmReserve;
  // Center buttons in the available zone; if zone too small, anchor to bottom so
  // buttons never overflow into the bottom-text reserve (may slightly overlap themes)
  const _btnZoneH=_btnZoneBot-_btnZoneTop;
  const _extraPad=Math.max(0,Math.floor((_btnZoneH-_btnStack)/2));
  // Ideal start: centered in zone. Hard floor: must end before _btnZoneBot
  const py0=Math.min(_btnZoneTop+_extraPad,_btnZoneBot-_btnStack);
  const gap=_minBtnGap;
  // Place buttons top-to-bottom: JOUER, REPRENDRE (if save), CLASSEMENT
  playRect={x:(W-PW)/2,y:py0,w:PW,h:PH};
  if(hasSave){
    const y1=py0+PH+gap;
    resumeRect={x:(W-PW)/2,y:y1,w:PW,h:PH};
    const y2=y1+PH+gap;
    _lbRect={x:(W-PW)/2,y:y2,w:PW,h:PH};
  }else{
    resumeRect=null;
    const y1=py0+PH+gap;
    _lbRect={x:(W-PW)/2,y:y1,w:PW,h:PH};
  }
}

function drawMenu(t){
  const th=THEMES[selTheme];
  if(!drawThemeVideo(selTheme,0,0)&&!drawThemeBg(selTheme,0,0)){ctx.drawImage(menuBg,0,0);}
  // Live hover theme preview — detect which theme button is hovered
  {let _hovIdx=-1;for(let _ti=0;_ti<themeRects.length;_ti++){const _tr=themeRects[_ti];if(_tr&&mouseX>=_tr.x&&mouseX<_tr.x+_tr.w&&mouseY>=_tr.y&&mouseY<_tr.y+_tr.h){_hovIdx=_ti;break;}}
  if(_hovIdx>=0&&_hovIdx!==selTheme){_menuHoverTheme=_hovIdx;_menuHoverAlpha=Math.min(0.45,_menuHoverAlpha+0.04);}else{_menuHoverAlpha=Math.max(0,_menuHoverAlpha-0.06);}
  if(_menuHoverAlpha>0.01&&_menuHoverTheme>=0){ctx.save();ctx.globalAlpha=_menuHoverAlpha;if(!drawThemeBg(_menuHoverTheme,0,0)){const _hBg=buildBg(_menuHoverTheme);ctx.drawImage(_hBg,0,0);}ctx.restore();}}
  drawFx(ctx,menuFx,t);
  // ── Menu click ripples ──────────────────────────────────────────────────────
  _menuRipples=_menuRipples.filter(_mr=>{
    const _mp=Math.min(1,(Date.now()-_mr.born)/380);
    if(_mp>=1)return false;
    const _mrad=_mr.maxR*Math.pow(_mp,0.45);
    const _ma=(1-_mp)*(1-_mp)*0.85;
    ctx.save();
    ctx.strokeStyle=hexA(_mr.col,_ma);ctx.lineWidth=2.5-_mp*2;
    ctx.shadowColor=_mr.col;ctx.shadowBlur=18*(1-_mp);
    ctx.beginPath();ctx.arc(_mr.x,_mr.y,_mrad,0,Math.PI*2);ctx.stroke();
    if(_mp>0.18){
      const _mp2=(_mp-0.18)/0.82;
      ctx.strokeStyle=hexA(_mr.col,(1-_mp2)*(1-_mp2)*0.4);
      ctx.lineWidth=1.5*(1-_mp2);ctx.shadowBlur=8*(1-_mp2);
      ctx.beginPath();ctx.arc(_mr.x,_mr.y,_mr.maxR*0.55*Math.pow(_mp2,0.45),0,Math.PI*2);ctx.stroke();
    }
    ctx.restore();
    return true;
  });
  // Animated dot grid overlay (subtle premium texture)
  {const _gs=Math.round(Math.min(W,H)*0.088);const _gt=t*0.00045;ctx.save();ctx.fillStyle=hexA(th.tm,0.055);for(let _gy=_gs*0.5;_gy<H+_gs;_gy+=_gs){for(let _gx=_gs*0.5;_gx<W+_gs;_gx+=_gs){const _ox=Math.sin(_gt+_gy*0.014)*9,_oy=Math.cos(_gt+_gx*0.012)*9;ctx.beginPath();ctx.arc(_gx+_ox,_gy+_oy,1.3,0,Math.PI*2);ctx.fill();}}ctx.restore();}
  // Deco blocks
  menuDeco.forEach(b=>{b.x=(b.x+b.vx+W)%W;b.y=(b.y+b.vy+H)%H;ctx.globalAlpha=0.11;drawCell(ctx,b.color,b.x-b.sz/2|0,b.y-b.sz/2|0,b.sz|0,b.skin,t);ctx.globalAlpha=1;});
  // Particles
  menuParts.forEach(p=>{
    p.x+=p.vx;p.y+=p.vy;p.life--;
    if(p.life<=0||p.y<-10){
      p.x=rnd(0,W);p.y=H+rnd(0,20);
      p.vx=rnd(-0.5,0.5);p.vy=p.star?rnd(-0.5,-0.15):rnd(-1.4,-0.3);
      p.color=rndc(COLORS);p.life=p.ml;
    }
    const a=(p.life/p.ml)*(p.star?0.7:0.55);
    ctx.save();
    if(p.star){
      // Étoile scintillante
      const pulse=0.7+0.3*Math.abs(Math.sin(p.life*0.07));
      ctx.shadowColor=p.color;ctx.shadowBlur=p.size*2.5*pulse;
      ctx.fillStyle=hexA(p.color,a*pulse);
      ctx.beginPath();
      const r1=p.size*pulse,r2=r1*0.45,pts=5;
      for(let j=0;j<pts*2;j++){
        const ang=j*Math.PI/pts-Math.PI/2;
        const r=j%2===0?r1:r2;
        j===0?ctx.moveTo(p.x+Math.cos(ang)*r,p.y+Math.sin(ang)*r):ctx.lineTo(p.x+Math.cos(ang)*r,p.y+Math.sin(ang)*r);
      }
      ctx.closePath();ctx.fill();
    }else{
      ctx.fillStyle=hexA(p.color,a);
      ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.restore();
  });
  // Constellation — lignes entre particules proches
  ctx.save();
  const _cDist=W*0.17;
  for(let _ci=0;_ci<menuParts.length;_ci+=2){
    const _pa=menuParts[_ci];
    for(let _cj=_ci+1;_cj<menuParts.length;_cj++){
      const _pb=menuParts[_cj];
      const _cdx=_pa.x-_pb.x,_cdy=_pa.y-_pb.y;
      const _cd=Math.sqrt(_cdx*_cdx+_cdy*_cdy);
      if(_cd<_cDist){
        ctx.strokeStyle=`rgba(255,255,255,${((1-_cd/_cDist)*0.10).toFixed(3)})`;
        ctx.lineWidth=0.5;ctx.beginPath();ctx.moveTo(_pa.x,_pa.y);ctx.lineTo(_pb.x,_pb.y);ctx.stroke();
      }
    }
  }
  ctx.restore();
  // Overlay
  ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,W,H);
  layoutMenu();
  // Title — compact mode uses smaller font to save vertical space on small/medium screens
  const _menuCompact=H<750;
  const fsz=_menuCompact?cl(Math.floor(H*0.070),18,38):cl(Math.floor(H*0.082),20,62);
  const font=`${fsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;
  const titleY=Math.round(H*(_menuCompact?0.072:0.086))+fsz;
  bounceTitle(ctx,'BLOCK',W/2,titleY,t,font,th.hi||th.tm,lerpC(th.tm,'#804000',0.4),th.ta,7);
  bounceTitle(ctx,'PUZZLE',W/2,titleY+fsz*1.1,t,font,th.ta,lerpC(th.ta,'#003060',0.5),th.tm,5);
  // Subtitle
  const subSz=cl(Math.floor(H*0.022),8,15);
  ctx.save();ctx.font=`${subSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;ctx.textAlign='center';ctx.shadowColor=th.tg;ctx.shadowBlur=6;
  ctx.fillText('— Choisis ton style —',W/2,titleY+fsz*2.28);ctx.restore();
  // SKIN label
  const lblSz=cl(Math.floor(H*0.020),7,13);
  if(skinRects.length){labelText(ctx,'SKIN',W/2,skinRects[0].y-lblSz-1,th.tg,`bold ${lblSz}px system-ui,-apple-system,"SF Pro Display",Arial`,'center',true);}
  // Skin cards — glassmorphism
  skinRects.forEach((sr,i)=>{
    const sel=i===selSkin;const{x,y,w,h}=sr;
    // Glow ring for selected
    if(sel){const t2=Date.now()*0.003;const gr=0.65+0.35*Math.sin(t2);ctx.save();ctx.shadowColor=th.tm;ctx.shadowBlur=14*gr;rp(ctx,x-1,y-1,w+2,h+2,h/5);ctx.strokeStyle=th.tm;ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    // Glass bg
    const glass=ctx.createLinearGradient(x,y,x,y+h);
    glass.addColorStop(0,hexA(th.gbg,sel?0.88:0.62));glass.addColorStop(1,hexA(th.gbg,sel?0.7:0.45));
    rrect(ctx,x,y,w,h,h/5,glass,null);
    // Inner light top
    const lig=ctx.createLinearGradient(x,y,x,y+h*0.4);
    lig.addColorStop(0,'rgba(255,255,255,0.12)');lig.addColorStop(1,'rgba(255,255,255,0)');
    rrect(ctx,x,y,w,h*0.45,h/5,lig,null);
    // Border
    rp(ctx,x,y,w,h,h/5);ctx.strokeStyle=sel?th.tm:hexA(th.sl,0.5);ctx.lineWidth=sel?2:1;ctx.stroke();
    // Preview — SVG skin card or fallback to canvas cell
    const psz=Math.floor(h*0.52);
    const _spW=Math.min(psz,w-8),_spH=_spW;
    const _spX=(x+w/2-_spW/2)|0,_spY=y+3;
    if(!(typeof drawSkinPreview==='function'&&drawSkinPreview(i,_spX,_spY,_spW,_spH))){
      drawCell(ctx,COLORS[i%COLORS.length],(x+w/2-psz/2)|0,y+5,psz,i,t);
    }
    // Shimmer sweep on selected card
    if(sel){
      const shimT=(Date.now()*0.0015)%(1.6);const shimP=Math.max(0,shimT-0.3);const shimX=x-w*0.25+shimP*(w*1.5);
      ctx.save();rp(ctx,x+1,y+1,w-2,h-2,h/5);ctx.clip();
      const sg=ctx.createLinearGradient(shimX-w*0.18,y,shimX+w*0.18,y+h);
      sg.addColorStop(0,'rgba(255,255,255,0)');sg.addColorStop(0.5,'rgba(255,255,255,0.22)');sg.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=sg;ctx.fillRect(shimX-w*0.25,y,w*0.5,h);ctx.restore();
      // Occasional sparkle from selected card
      if(Math.random()<0.045)menuParts.push({x:rnd(x,x+w),y:rnd(y,y+h),vx:rnd(-0.4,0.4),vy:rnd(-1.8,-0.5),color:th.tm,size:rnd(1.5,3.5),life:rnd(40,80),ml:80,star:true});
    }
    // Name
    const nfz=cl(Math.floor(h*0.19),7,14);
    ctx.save();ctx.font=`bold ${nfz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    if(sel){ctx.shadowColor=th.tm;ctx.shadowBlur=6;}
    ctx.fillStyle=sel?th.tm:th.ta;ctx.fillText(SKIN_NAMES[i],x+w/2,y+h-nfz*0.6);
    ctx.restore();
    if(sel){ctx.font=`bold ${nfz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tm;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('✓',x+4,y+nfz+3);}
  });
  // THEME label
  if(themeRects.length){labelText(ctx,'THÈME',W/2,themeRects[0].y-lblSz-1,th.tg,`bold ${lblSz}px system-ui,-apple-system,"SF Pro Display",Arial`,'center',true);}
  // Theme buttons
  themeRects.forEach((tr,i)=>{
    const sth=THEMES[i],sel=i===selTheme;const{x,y,w,h}=tr;
    // Hover aura (non-selected)
    const _isThHov=!sel&&mouseX>=x-3&&mouseX<x+w+3&&mouseY>=y-3&&mouseY<y+h+3;
    if(_isThHov){const _hA=0.55+0.15*Math.sin(Date.now()*0.006);ctx.save();ctx.shadowColor=sth.tm;ctx.shadowBlur=12*_hA;rp(ctx,x-1,y-1,w+2,h+2,h/3+1);ctx.strokeStyle=hexA(sth.tm,_hA*0.7);ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}
    if(sel){ctx.save();ctx.shadowColor=sth.tm;ctx.shadowBlur=9;rp(ctx,x,y,w,h,h/3);ctx.strokeStyle=sth.tm;ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    // Full color theme bg
    const tg=ctx.createLinearGradient(x,y,x,y+h);
    tg.addColorStop(0,hexA(sth.tm,sel?1.0:0.97));tg.addColorStop(1,hexA(sth.ta,sel?0.95:0.90));
    rrect(ctx,x,y,w,h,h/3,tg,null);
    const tsh=ctx.createLinearGradient(x,y,x,y+h*0.5);tsh.addColorStop(0,'rgba(255,255,255,0.22)');tsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x,y,w,h,h/3);ctx.fillStyle=tsh;ctx.fill();
    rp(ctx,x,y,w,h,h/3);ctx.strokeStyle=sel?sth.tm:hexA(sth.dc,0.7);ctx.lineWidth=sel?2:1;ctx.stroke();
    const tfz=cl(Math.floor(h*0.44),6,12);
    // Theme icon (small icon left of text)
    const _ticW=Math.min(w*0.28,h*1.4)|0,_ticH=h;
    const _iconDrawn=typeof drawThemeIcon==='function'&&drawThemeIcon(i,x,y,_ticW,_ticH);
    ctx.save();ctx.font=`bold ${tfz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.textAlign=_iconDrawn?'right':'center';ctx.textBaseline='middle';
    if(sel){ctx.shadowColor=sth.tm;ctx.shadowBlur=5;}
    ctx.fillStyle='rgba(255,255,255,0.95)';ctx.fillText(sth.name,_iconDrawn?x+w-3:x+w/2,y+h/2);ctx.restore();
  });
  // ── JOUER ──
  if(playRect){
    const{x,y,w,h}=playRect;const now=Date.now();
    const pulse=0.5+0.5*Math.sin(now*0.004);
    // Hover detection — proximity glow boost
    const _isHov=mouseX>=x-8&&mouseX<x+w+8&&mouseY>=y-8&&mouseY<y+h+8;
    const _hovBoost=_isHov?1.4:1.0;
    // Strong outer glow ring (double layer)
    ctx.save();
    ctx.shadowColor=th.ta;ctx.shadowBlur=(28+pulse*18)*_hovBoost;
    rp(ctx,x-3,y-3,w+6,h+6,h/2+3);ctx.strokeStyle=hexA(th.ta,(0.22+pulse*0.18)*_hovBoost);ctx.lineWidth=4;ctx.stroke();
    ctx.shadowBlur=(12+pulse*8)*_hovBoost;
    rp(ctx,x-6,y-6,w+12,h+12,h/2+6);ctx.strokeStyle=hexA(th.ta,(0.10+pulse*0.08)*_hovBoost);ctx.lineWidth=3;ctx.stroke();
    ctx.restore();
    // Main button gradient
    const pbg=ctx.createLinearGradient(x,y,x,y+h);
    pbg.addColorStop(0,rgb(cl(hr(th.ta)+38,0,255),cl(hg(th.ta)+38,0,255),cl(hb(th.ta)+38,0,255)));
    pbg.addColorStop(0.45,th.ta);pbg.addColorStop(1,lerpC(th.ta,'#000',0.35));
    rrect(ctx,x,y,w,h,h/2,pbg,null);
    // Top shine (pill-shape top half)
    const shg=ctx.createLinearGradient(x,y,x,y+h*0.48);
    shg.addColorStop(0,'rgba(255,255,255,0.32)');shg.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x+2,y+2,w-4,h*0.48,h/2);ctx.fillStyle=shg;ctx.fill();
    // Animated shimmer sweep
    const _shimX=x+((now*0.0008)%(w+h*2))-h;
    ctx.save();ctx.beginPath();rp(ctx,x,y,w,h,h/2);ctx.clip();
    const _shg=ctx.createLinearGradient(_shimX,y,_shimX+h*1.2,y+h);
    _shg.addColorStop(0,'rgba(255,255,255,0)');_shg.addColorStop(0.4,'rgba(255,255,255,0.18)');
    _shg.addColorStop(0.5,'rgba(255,255,255,0.26)');_shg.addColorStop(0.6,'rgba(255,255,255,0.18)');
    _shg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=_shg;ctx.fillRect(x,y,w,h);ctx.restore();
    // Double border
    rp(ctx,x,y,w,h,h/2);ctx.strokeStyle=hexA(th.tm,0.65);ctx.lineWidth=1.5;ctx.stroke();
    rp(ctx,x+1.5,y+1.5,w-3,h-3,h/2-1.5);ctx.strokeStyle='rgba(255,255,255,0.18)';ctx.lineWidth=1;ctx.stroke();
    const pfz=cl(Math.floor(h*0.48),12,22);
    drawPremText(ctx,'JOUER',x+w/2,y+h/2,`bold ${pfz}px system-ui,-apple-system,"SF Pro Display",Arial`,th.hi||th.tm,lerpC(th.tm,'#fff',0.3),'rgba(0,0,0,0.5)',th.tm,10,2.5);
    ctx.textAlign='center';ctx.textBaseline='middle';
  }
  // ── REPRENDRE (si sauvegarde) ── [between JOUER and CLASSEMENT]
  if(hasSave&&resumeRect){
    const{x,y,w,h}=resumeRect;
    const pulse2=0.5+0.5*Math.sin(Date.now()*0.003);
    ctx.save();ctx.shadowColor='#40FF80';ctx.shadowBlur=12+pulse2*8;
    const rbg=ctx.createLinearGradient(x,y,x,y+h);
    rbg.addColorStop(0,'#30A050');rbg.addColorStop(1,'#1A5030');
    rrect(ctx,x,y,w,h,h/2,rbg,null);
    const rsh=ctx.createLinearGradient(x,y,x,y+h*0.45);
    rsh.addColorStop(0,'rgba(255,255,255,0.22)');rsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x+2,y+2,w-4,h*0.45,h/2);ctx.fillStyle=rsh;ctx.fill();
    rp(ctx,x,y,w,h,h/2);ctx.strokeStyle=hexA('#40FF80',0.5);ctx.lineWidth=1.5;ctx.stroke();
    ctx.shadowBlur=0;
    const rfz=cl(Math.floor(h*0.48),12,22);
    drawPremText(ctx,'▶  REPRENDRE',x+w/2,y+h/2,`bold ${rfz}px system-ui,-apple-system,"SF Pro Display",Arial`,'#FFFFFF','#A0FFB0','rgba(0,0,0,0.5)','#40FF80',8,2);
    ctx.restore();
  }
  // ── CLASSEMENT MONDIAL ──
  if(_lbRect){
    const{x,y,w,h}=_lbRect;
    const pulse3=0.5+0.5*Math.sin(Date.now()*0.0027);
    ctx.save();ctx.shadowColor='#FFD700';ctx.shadowBlur=10+pulse3*10;
    const lbg=ctx.createLinearGradient(x,y,x,y+h);
    lbg.addColorStop(0,'#705010');lbg.addColorStop(1,'#3A2800');
    rrect(ctx,x,y,w,h,h/2,lbg,null);
    const lsh=ctx.createLinearGradient(x,y,x,y+h*0.45);
    lsh.addColorStop(0,'rgba(255,255,255,0.18)');lsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x+2,y+2,w-4,h*0.45,h/2);ctx.fillStyle=lsh;ctx.fill();
    rp(ctx,x,y,w,h,h/2);ctx.strokeStyle=hexA('#FFD700',0.55);ctx.lineWidth=1.5;ctx.stroke();
    ctx.shadowBlur=0;
    const lfz=cl(Math.floor(h*0.46),12,21);
    drawPremText(ctx,'🏆  CLASSEMENT',x+w/2,y+h/2,`bold ${lfz}px system-ui,-apple-system,"SF Pro Display",Arial`,'#FFD700','#B8860B','rgba(0,0,0,0.5)','#FFD700',8,2);
    ctx.restore();
  }
  // ── BOUTON SON (icône fixée en haut à droite) ──
  if(_soundRect){
    const{x,y,w,h}=_soundRect;const on=_soundEnabled;
    ctx.save();
    const pulse=0.5+0.5*Math.sin(Date.now()*0.003);
    ctx.shadowColor=on?'#40D8FF':'#FF6060';ctx.shadowBlur=6+4*pulse;
    const sbg=ctx.createLinearGradient(x,y,x,y+h);
    sbg.addColorStop(0,on?'#1A3A50':'#3A1010');sbg.addColorStop(1,on?'#0A1A26':'#1E0808');
    rrect(ctx,x,y,w,h,10,sbg,null);
    const ssh=ctx.createLinearGradient(x,y,x,y+h*0.5);
    ssh.addColorStop(0,'rgba(255,255,255,0.18)');ssh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x+2,y+2,w-4,h*0.5,8);ctx.fillStyle=ssh;ctx.fill();
    rp(ctx,x,y,w,h,10);ctx.strokeStyle=hexA(on?'#40D8FF':'#FF6060',0.6);ctx.lineWidth=1.5;ctx.stroke();
    ctx.shadowBlur=0;
    ctx.font=`${Math.floor(h*0.58)}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(on?'🔊':'🔇',x+w/2,y+h/2);
    ctx.restore();
  }
  // Best personal score
  const bsz=cl(Math.floor(H*0.020),8,14);
  const btmY=H-bsz*2.5;
  ctx.textAlign='center';ctx.textBaseline='alphabetic';
  if(best>0){ctx.save();ctx.font=`bold ${bsz*1.18}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='alphabetic';ctx.shadowColor=th.tm;ctx.shadowBlur=12;ctx.fillStyle=th.tm;ctx.fillText(`★ RECORD : ${best}`,W/2,btmY);ctx.shadowBlur=22;ctx.shadowColor=th.hi||th.tm;ctx.globalAlpha=0.38;ctx.fillText(`★ RECORD : ${best}`,W/2,btmY);ctx.globalAlpha=1;ctx.restore();
    // Animated sparkles around record score
    if(Math.random()<0.06)menuParts.push({x:rnd(W/2-60,W/2+60),y:btmY+rnd(-bsz*0.5,bsz*0.1),vx:rnd(-0.6,0.6),vy:rnd(-1.5,-0.3),color:th.tm,size:rnd(1.5,3),life:rnd(30,60),ml:60,star:true});}
  if(bestCombo>1){ctx.save();ctx.font=`${bsz*0.85}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.ta,0.80);ctx.textAlign='center';ctx.shadowColor=th.ta;ctx.shadowBlur=4;ctx.fillText(`Meilleur combo : ×${bestCombo}`,W/2,btmY+bsz*1.35);ctx.restore();}
  ctx.font=`${bsz*0.76}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.tg,0.45);ctx.fillText('Toucher JOUER pour commencer',W/2,H-4);
  ctx.textAlign='left';ctx.textBaseline='alphabetic';
}

// ─── PAUSE MENU ──────────────────────────────────────────────────────────────
function layoutPause(){
  const pw=Math.min(W-32,310);
  const bh=cl(H*0.076,40,58);
  const gap=10;
  const titleH=cl(H*0.10,48,68);
  const badgeH=26;
  const scoreH=20;
  const sliderH=20;
  const padV=18;
  // Gap between last button and score line (always at least 8px)
  const postBtnGap=Math.max(8,Math.round(H*0.012));
  // Gap between score line and volume slider label+slider
  const sliderLabelH=16;
  const panelH=padV+titleH+10+badgeH+gap+bh*5+gap*4+postBtnGap+scoreH+sliderLabelH+sliderH+padV;
  const px=(W-pw)/2|0;
  // Clamp panel so it stays on screen (at least 4px from each edge)
  const panelHClamped=Math.min(panelH,H-8);
  const py=Math.max(4,((H-panelHClamped)/2)|0);
  _pauseBtns={_panel:{x:px,y:py,w:pw,h:panelHClamped},_titleY:py+padV+titleH*0.78,_badgeY:py+padV+titleH+10};
  let cy=py+padV+titleH+10+badgeH+gap;
  ['resume','restart','sound','music','quit'].forEach(k=>{_pauseBtns[k]={x:px+10,y:cy,w:pw-20,h:bh};cy+=bh+gap;});
  // Score line starts after last button with guaranteed gap
  const _scoreY=cy-gap+postBtnGap;
  _pauseBtns._scoreY=_scoreY;
  // Volume slider below score line
  const sliderY=_scoreY+scoreH+sliderLabelH;
  _volumeSliderRect={x:px+20,y:sliderY,w:pw-40,h:sliderH};
}

function drawPause(t){
  layoutPause();
  const th=THEMES[curTheme];
  const now=Date.now();
  const p=_pauseBtns._panel;
  // Dark overlay
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
  // Animated ambient orbs behind panel
  ctx.save();
  for(let oi=0;oi<5;oi++){
    const ox=p.x+p.w*(0.1+oi*0.2+Math.sin(now*0.00055+oi*2.1)*0.12);
    const oy=p.y+p.h*(0.15+oi*0.16+Math.cos(now*0.00042+oi*1.7)*0.12);
    const or2=p.w*(0.08+oi*0.015);
    const og=ctx.createRadialGradient(ox,oy,0,ox,oy,or2);
    og.addColorStop(0,hexA(oi%2===0?th.tm:th.ta,0.12));og.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=og;ctx.fillRect(ox-or2,oy-or2,or2*2,or2*2);
  }
  ctx.restore();
  // Panel glass
  const pg=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
  pg.addColorStop(0,hexA(th.gbg,0.97));pg.addColorStop(1,hexA(th.bg,0.95));
  rrect(ctx,p.x,p.y,p.w,p.h,20,pg,null);
  // Panel shine top
  const ps=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h*0.45);
  ps.addColorStop(0,'rgba(255,255,255,0.10)');ps.addColorStop(1,'rgba(255,255,255,0)');
  ctx.save();rp(ctx,p.x,p.y,p.w,p.h,20);ctx.clip();ctx.fillStyle=ps;ctx.fillRect(p.x,p.y,p.w,p.h*0.45);ctx.restore();
  // Animated panel border (rotating gradient)
  const _pbPulse=0.5+0.5*Math.abs(Math.sin(now*0.0025));
  ctx.save();ctx.shadowColor=th.tm;ctx.shadowBlur=8*_pbPulse;
  rp(ctx,p.x,p.y,p.w,p.h,20);ctx.strokeStyle=hexA(th.tm,0.35+0.25*_pbPulse);ctx.lineWidth=1.5+_pbPulse;ctx.stroke();ctx.restore();
  // Panel border
  rp(ctx,p.x,p.y,p.w,p.h,20);ctx.strokeStyle=hexA(th.sl,0.7);ctx.lineWidth=1.5;ctx.stroke();
  // Title
  const tsz=cl(p.h*0.10,18,30);
  drawPremText(ctx,'⏸  PAUSE',p.x+p.w/2,_pauseBtns._titleY,`bold ${tsz}px system-ui,-apple-system,"SF Pro Display",Arial`,th.hi||th.tm,th.ta,'rgba(0,0,0,0.5)',th.hi||th.tm,10,2);
  // Mode badge
  const mode=MODES[currentMode]||MODES.survie;
  const bw2=ctx.measureText(mode.icon+' '+mode.name).width+30;
  ctx.font=`bold 13px system-ui,-apple-system,"SF Pro Display",Arial`;
  const bx2=(W-bw2)/2|0;
  const by2=_pauseBtns._badgeY|0;
  rrect(ctx,bx2,by2,bw2,24,12,hexA(mode.color,0.22),hexA(mode.color,0.80),1.5);
  ctx.font='bold 13px system-ui,-apple-system,"SF Pro Display",Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=mode.color;
  ctx.fillText(mode.icon+' '+mode.name,p.x+p.w/2,by2+12);
  // Buttons
  const btnDefs={
    resume:{icon:'▶',lbl:'REPRENDRE',g0:th.ta,g1:lerpC(th.ta,'#000000',0.5),border:th.tm},
    restart:{icon:'🔁',lbl:'RECOMMENCER',g0:'#1C3A3A',g1:'#0C1E1E',border:th.tg},
    sound:{icon:_soundEnabled?'🔊':'🔇',lbl:_soundEnabled?'SON  ON':'SON  OFF',
      g0:_soundEnabled?'#1A4455':'#5A1A1A',g1:_soundEnabled?'#0A2230':'#2C0D0D',
      border:_soundEnabled?'#40D8FF':'#FF6060'},
    music:{icon:_musicEnabled?'🎵':'🔇',lbl:_musicEnabled?'MUSIQUE ON':'MUSIQUE OFF',
      g0:_musicEnabled?'#1A3A55':'#3A1A5A',g1:_musicEnabled?'#0A1E30':'#1E0A2C',
      border:_musicEnabled?'#60C8FF':'#C060FF'},
    quit:{icon:'🏠',lbl:'MENU PRINCIPAL',g0:'#6A2C0A',g1:'#381505',border:'#FF7040'}
  };
  ['resume','restart','sound','music','quit'].forEach((k,i)=>{
    const btn=_pauseBtns[k];const def=btnDefs[k];
    const{x:bx,y:by,w:bw,h:bh}=btn;const br=bh/2;
    const pulse=0.5+0.5*Math.sin(now*0.003+i*1.2);
    // Glow border
    ctx.save();ctx.shadowColor=def.border;ctx.shadowBlur=8+pulse*8;
    rp(ctx,bx,by,bw,bh,br);ctx.strokeStyle=def.border;ctx.lineWidth=1.5;ctx.stroke();ctx.restore();
    // Fill gradient
    const bg=ctx.createLinearGradient(bx,by,bx,by+bh);
    bg.addColorStop(0,def.g0);bg.addColorStop(1,def.g1);
    rrect(ctx,bx,by,bw,bh,br,bg,def.border,1.5);
    // Shine
    const sh=ctx.createLinearGradient(bx,by,bx,by+bh*0.45);
    sh.addColorStop(0,'rgba(255,255,255,0.16)');sh.addColorStop(1,'rgba(255,255,255,0)');
    ctx.save();rp(ctx,bx,by,bw,bh,br);ctx.clip();ctx.fillStyle=sh;ctx.fillRect(bx,by,bw,bh*0.45);ctx.restore();
    // Label
    const fs=cl(bh*0.40,12,20);
    ctx.font=`bold ${fs}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(255,255,255,0.95)';
    ctx.shadowColor=def.border;ctx.shadowBlur=4;
    ctx.fillText(def.icon+'  '+def.lbl,bx+bw/2,by+bh/2);
    ctx.shadowBlur=0;
  });
  // Score actuel
  const scSz=cl(H*0.026,10,14);
  ctx.font=`${scSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=th.tm;
  ctx.fillText(`Score actuel : ${score}`,p.x+p.w/2,_pauseBtns._scoreY+scSz/2);
  // Volume slider
  if(_volumeSliderRect){
    const{x:vx,y:vy,w:vw,h:vh}=_volumeSliderRect;
    const th2=THEMES[curTheme];
    // Label
    ctx.font=`bold ${cl(vh*0.7,9,13)}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillStyle=th2.tg;ctx.fillText('🔊 Volume',vx,vy-10);
    // Track background
    rrect(ctx,vx,vy,vw,vh,vh/2,hexA(th2.sl,0.4),hexA(th2.sl,0.7),1);
    // Filled portion
    const fillW=Math.max(vh,vw*_volume);
    rrect(ctx,vx,vy,fillW,vh,vh/2,hexA(th2.ta,0.85),null);
    // Shine
    const ssh2=ctx.createLinearGradient(vx,vy,vx,vy+vh*0.5);
    ssh2.addColorStop(0,'rgba(255,255,255,0.25)');ssh2.addColorStop(1,'rgba(255,255,255,0)');
    ctx.save();rp(ctx,vx,vy,fillW,vh,vh/2);ctx.clip();ctx.fillStyle=ssh2;ctx.fillRect(vx,vy,fillW,vh);ctx.restore();
    // Thumb
    const tx2=vx+vw*_volume;
    ctx.save();ctx.shadowColor=th2.tm;ctx.shadowBlur=6;
    ctx.beginPath();ctx.arc(tx2,vy+vh/2,vh*0.75,0,Math.PI*2);
    ctx.fillStyle=th2.tm;ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,0.6)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
    // Value text
    ctx.font=`bold ${cl(vh*0.65,8,12)}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='right';ctx.fillStyle=th2.tm;
    ctx.fillText(`${Math.round(_volume*100)}%`,vx+vw,vy-10);
  }
  ctx.restore();
}

function handlePauseTap(x,y){
  if(_volumeSliderRect){
    const{x:vx,y:vy,w:vw,h:vh}=_volumeSliderRect;
    if(x>=vx-10&&x<=vx+vw+10&&y>=vy-10&&y<=vy+vh+10){
      _volume=cl((x-vx)/vw,0,1);
      try{localStorage.setItem('bp_volume',String(_volume));}catch(e){}
      return;
    }
  }
  if(!_pauseBtns.resume)return;
  ['resume','restart','sound','quit'].forEach(k=>{
    const b=_pauseBtns[k];if(!b)return;
    if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){
      if(k==='resume'){
        if(_pauseStartTime>0){chronoLastTick+=Date.now()-_pauseStartTime;_pauseStartTime=0;}
        gameState='playing';
      }else if(k==='restart'){_pauseStartTime=0;resetGame();gameState='playing';}
      else if(k==='sound'){_soundEnabled=!_soundEnabled;}
      else if(k==='music'){if(typeof toggleMusic==='function')toggleMusic();}
      else if(k==='quit'){_pauseStartTime=0;gameState='menu';}
    }
  });
}

