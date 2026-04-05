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

function layoutMenu(){
  const SKW=Math.floor((W-18)/5)-4,SKH=Math.round(SKW*0.92);
  // Calcule où finit le sous-titre pour éviter le chevauchement
  const _fsz=cl(Math.floor(H*0.082),20,62);
  const _titleY=Math.round(H*0.086)+_fsz;
  const _subSz=cl(Math.floor(H*0.026),9,19);
  const _lblSz=cl(Math.floor(H*0.022),8,15);
  const _subBottom=Math.ceil(_titleY+_fsz*2.28+_subSz);
  const skGY=Math.max(_subBottom+_lblSz+8, Math.round(H*0.30));
  skinRects=Array.from({length:10},(_,i)=>({x:8+(i%5)*(SKW+4),y:skGY+(i<5?0:SKH+5),w:SKW,h:SKH}));
  const THW=Math.floor((W-18)/5)-4,THH=cl(Math.round(H*0.05),20,36);
  // +5 = gap inter-lignes skins, +_lblSz+8 = place pour le label "THÈME"
  const THY=skGY+SKH*2+5+_lblSz+16;
  themeRects=Array.from({length:10},(_,i)=>({x:8+(i%5)*(THW+4),y:THY+(i<5?0:THH+4),w:THW,h:THH}));
  const PW=cl(W-52,148,275),PH=cl(Math.round(H*0.075),36,58);
  const lastThY=THY+THH*2+7;
  const py0=lastThY+Math.round(H*0.018);
  // Son : petit bouton icône fixé en haut à droite (hors du flux vertical)
  _soundRect={x:W-44,y:6,w:38,h:38};
  // Réserve de l'espace pour RECORD + combo + "Toucher JOUER" en bas
  const _bsz=cl(Math.floor(H*0.020),8,14);
  const _btmReserve=_bsz*4.5+10;
  const numBtns=hasSave?3:2;
  const avail=H-_btmReserve-py0-PH*numBtns;
  const gap=cl(Math.floor(avail/(numBtns+1)),4,16);
  const _maxBtnY=H-_btmReserve-PH;
  const y0=Math.min(py0+gap,_maxBtnY);
  playRect={x:(W-PW)/2,y:y0,w:PW,h:PH};
  if(hasSave){
    const y1=Math.min(y0+PH+gap,_maxBtnY-PH);
    resumeRect={x:(W-PW)/2,y:y1,w:PW,h:PH};
    const y2=Math.min(y1+PH+gap,_maxBtnY);
    _lbRect={x:(W-PW)/2,y:y2,w:PW,h:PH};
  }else{
    resumeRect=null;
    const y1=Math.min(y0+PH+gap,_maxBtnY);
    _lbRect={x:(W-PW)/2,y:y1,w:PW,h:PH};
  }
}

function drawMenu(t){
  const th=THEMES[selTheme];
  ctx.drawImage(menuBg,0,0);
  drawFx(ctx,menuFx,t);
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
  for(let _ci=0;_ci<menuParts.length;_ci++){
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
  // Title
  const fsz=cl(Math.floor(H*0.082),20,62),font=`${fsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;
  const titleY=Math.round(H*0.086)+fsz;
  bounceTitle(ctx,'BLOCK',W/2,titleY,t,font,th.hi||th.tm,lerpC(th.tm,'#804000',0.4),th.ta,7);
  bounceTitle(ctx,'PUZZLE',W/2,titleY+fsz*1.1,t,font,th.ta,lerpC(th.ta,'#003060',0.5),th.tm,5);
  // Subtitle
  const subSz=cl(Math.floor(H*0.026),9,19);
  ctx.save();ctx.font=`${subSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;ctx.textAlign='center';ctx.shadowColor=th.tg;ctx.shadowBlur=6;
  ctx.fillText('— Choisis ton style —',W/2,titleY+fsz*2.28);ctx.restore();
  // SKIN label
  const lblSz=cl(Math.floor(H*0.022),8,15);
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
    // Preview
    const psz=Math.floor(h*0.42);
    drawCell(ctx,COLORS[i%COLORS.length],(x+w/2-psz/2)|0,y+5,psz,i,t);
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
    if(sel){ctx.save();ctx.shadowColor=sth.tm;ctx.shadowBlur=9;rp(ctx,x,y,w,h,h/3);ctx.strokeStyle=sth.tm;ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    // Full color theme bg
    const tg=ctx.createLinearGradient(x,y,x,y+h);
    tg.addColorStop(0,hexA(sth.tm,sel?0.92:0.78));tg.addColorStop(1,hexA(sth.ta,sel?0.82:0.62));
    rrect(ctx,x,y,w,h,h/3,tg,null);
    const tsh=ctx.createLinearGradient(x,y,x,y+h*0.5);tsh.addColorStop(0,'rgba(255,255,255,0.22)');tsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x,y,w,h,h/3);ctx.fillStyle=tsh;ctx.fill();
    rp(ctx,x,y,w,h,h/3);ctx.strokeStyle=sel?sth.tm:hexA(sth.dc,0.7);ctx.lineWidth=sel?2:1;ctx.stroke();
    const tfz=cl(Math.floor(h*0.44),6,12);
    ctx.save();ctx.font=`bold ${tfz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    if(sel){ctx.shadowColor=sth.tm;ctx.shadowBlur=5;}
    ctx.fillStyle='rgba(255,255,255,0.95)';ctx.fillText(sth.name,x+w/2,y+h/2);ctx.restore();
  });
  // ── JOUER ──
  if(playRect){
    const{x,y,w,h}=playRect;const now=Date.now();
    const pulse=0.5+0.5*Math.sin(now*0.004);
    ctx.save();ctx.shadowColor=th.ta;ctx.shadowBlur=20+pulse*14;
    rp(ctx,x-2,y-2,w+4,h+4,h/2+2);ctx.strokeStyle=hexA(th.ta,0.3+pulse*0.2);ctx.lineWidth=3;ctx.stroke();ctx.restore();
    const pbg=ctx.createLinearGradient(x,y,x,y+h);
    pbg.addColorStop(0,rgb(cl(hr(th.ta)+30,0,255),cl(hg(th.ta)+30,0,255),cl(hb(th.ta)+30,0,255)));
    pbg.addColorStop(0.5,th.ta);pbg.addColorStop(1,lerpC(th.ta,'#000',0.3));
    rrect(ctx,x,y,w,h,h/2,pbg,null);
    const shg=ctx.createLinearGradient(x,y,x,y+h*0.45);
    shg.addColorStop(0,'rgba(255,255,255,0.28)');shg.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x+2,y+2,w-4,h*0.45,h/2);ctx.fillStyle=shg;ctx.fill();
    rp(ctx,x,y,w,h,h/2);ctx.strokeStyle=hexA(th.tm,0.6);ctx.lineWidth=1.5;ctx.stroke();
    const pfz=cl(Math.floor(h*0.48),12,22);
    drawPremText(ctx,'▶  JOUER',x+w/2,y+h/2,`bold ${pfz}px system-ui,-apple-system,"SF Pro Display",Arial`,th.hi||th.tm,lerpC(th.tm,'#fff',0.3),'rgba(0,0,0,0.5)',th.tm,10,2.5);
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
  if(best>0){ctx.save();ctx.font=`bold ${bsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tm;ctx.shadowColor=th.tm;ctx.shadowBlur=5;ctx.fillText(`RECORD : ${best}`,W/2,btmY);ctx.restore();}
  if(bestCombo>1){ctx.save();ctx.font=`${bsz*0.82}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.ta,0.75);ctx.textAlign='center';ctx.fillText(`Meilleur combo : ×${bestCombo}`,W/2,btmY+bsz*1.2);ctx.restore();}
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
  const scoreH=24;
  const padV=20;
  const panelH=padV+titleH+10+badgeH+gap+bh*4+gap*3+scoreH+padV+52;
  const px=(W-pw)/2|0;
  const py=((H-panelH)/2)|0;
  _pauseBtns={_panel:{x:px,y:py,w:pw,h:panelH},_titleY:py+padV+titleH*0.78,_badgeY:py+padV+titleH+10,_scoreY:py+panelH-padV-scoreH-52};
  let cy=py+padV+titleH+10+badgeH+gap;
  ['resume','restart','sound','quit'].forEach(k=>{_pauseBtns[k]={x:px+10,y:cy,w:pw-20,h:bh};cy+=bh+gap;});
  const sliderY=_pauseBtns._scoreY+20;
  _volumeSliderRect={x:_pauseBtns._panel.x+20,y:sliderY,w:_pauseBtns._panel.w-40,h:20};
}

function drawPause(t){
  layoutPause();
  const th=THEMES[curTheme];
  const now=Date.now();
  const p=_pauseBtns._panel;
  // Dark overlay
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.75)';ctx.fillRect(0,0,W,H);
  // Panel glass
  const pg=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h);
  pg.addColorStop(0,hexA(th.gbg,0.97));pg.addColorStop(1,hexA(th.bg,0.95));
  rrect(ctx,p.x,p.y,p.w,p.h,20,pg,null);
  // Panel shine top
  const ps=ctx.createLinearGradient(p.x,p.y,p.x,p.y+p.h*0.45);
  ps.addColorStop(0,'rgba(255,255,255,0.10)');ps.addColorStop(1,'rgba(255,255,255,0)');
  ctx.save();rp(ctx,p.x,p.y,p.w,p.h,20);ctx.clip();ctx.fillStyle=ps;ctx.fillRect(p.x,p.y,p.w,p.h*0.45);ctx.restore();
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
    quit:{icon:'🏠',lbl:'MENU PRINCIPAL',g0:'#6A2C0A',g1:'#381505',border:'#FF7040'}
  };
  ['resume','restart','sound','quit'].forEach((k,i)=>{
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
      else if(k==='quit'){_pauseStartTime=0;gameState='menu';}
    }
  });
}

