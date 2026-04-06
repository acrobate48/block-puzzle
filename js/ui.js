'use strict';
// ─── MODE SELECT SCREEN ──────────────────────────────────────────────────────
function layoutModeSelect(){
  modeSelectRects=[];
  const cols=2,rows=3;
  const padX=10,padY=8;
  const bw=Math.floor((W-padX*(cols+1))/cols);
  const bh=cl(Math.floor((H*0.62)/rows),52,90);
  const totalH=rows*(bh+padY)-padY;
  const startY=Math.round((H-totalH)*0.52);
  MODE_KEYS.forEach((k,i)=>{
    const col=i%cols,row=Math.floor(i/cols);
    modeSelectRects.push({key:k,x:padX+(bw+padX)*col,y:startY+(bh+padY)*row,w:bw,h:bh});
  });
}

function drawModeSelect(t){
  const th=THEMES[selTheme];
  if(menuBg)ctx.drawImage(menuBg,0,0);
  else{ctx.fillStyle=th.sky||'#060A0A';ctx.fillRect(0,0,W,H);}
  if(!_IS_IOS){drawFx(ctx,menuFx,t);
  menuDeco.forEach(b=>{b.x=(b.x+b.vx+W)%W;b.y=(b.y+b.vy+H)%H;ctx.globalAlpha=0.08;drawCell(ctx,b.color,b.x-b.sz/2|0,b.y-b.sz/2|0,b.sz|0,b.skin,t);ctx.globalAlpha=1;});}
  ctx.fillStyle='rgba(0,0,0,0.62)';ctx.fillRect(0,0,W,H);
  layoutModeSelect();
  // Title
  const tsz=cl(Math.floor(H*0.06),14,40);
  ctx.save();ctx.font=`bold ${tsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle=th.tm;
  ctx.fillText('CHOISIR UN MODE',W/2,Math.round(H*0.10));ctx.restore();
  // Subtitle
  const ssz=cl(Math.floor(H*0.022),8,14);
  ctx.save();ctx.font=`${ssz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.fillStyle=hexA(th.tg,0.65);
  ctx.fillText('Quel défi veux-tu relever ?',W/2,Math.round(H*0.17));ctx.restore();
  // Mode cards
  modeSelectRects.forEach(({key,x,y,w,h})=>{
    const m=MODES[key];const sel=key===currentMode;const now=Date.now();
    const _hov=!sel&&mouseX>=x&&mouseX<x+w&&mouseY>=y&&mouseY<y+h;
    // Glow if selected or hovered
    if(sel){ctx.save();ctx.shadowColor=m.color;ctx.shadowBlur=18+6*Math.sin(now*0.004);
      rp(ctx,x-2,y-2,w+4,h+4,12);ctx.strokeStyle=hexA(m.color,0.7);ctx.lineWidth=2.5;ctx.stroke();ctx.restore();}
    else if(_hov){ctx.save();ctx.shadowColor=m.color;ctx.shadowBlur=10;rp(ctx,x-1,y-1,w+2,h+2,12);ctx.strokeStyle=hexA(m.color,0.4);ctx.lineWidth=1.5;ctx.stroke();ctx.restore();}
    // Card bg
    if(_IS_IOS){
      rrect(ctx,x,y,w,h,12,hexA(th.gbg,sel?0.9:0.62),sel?hexA(m.color,0.8):hexA(th.sl,0.4),sel?2:1);
      ctx.fillStyle=hexA(m.color,0.7);ctx.fillRect(x,y,w,4);
    }else{
    const cbg=ctx.createLinearGradient(x,y,x,y+h);
    cbg.addColorStop(0,hexA(th.gbg,sel?0.9:_hov?0.75:0.62));cbg.addColorStop(1,hexA(th.bg,sel?0.8:_hov?0.58:0.45));
    rrect(ctx,x,y,w,h,12,cbg,null);
    // Top shine
    const csh=ctx.createLinearGradient(x,y,x,y+h*0.4);
    csh.addColorStop(0,_hov?'rgba(255,255,255,0.18)':'rgba(255,255,255,0.12)');csh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,x+2,y+2,w-4,h*0.4,10);ctx.fillStyle=csh;ctx.fill();
    // Border
    rp(ctx,x,y,w,h,12);ctx.strokeStyle=sel?hexA(m.color,0.8):_hov?hexA(m.color,0.4):hexA(th.sl,0.4);ctx.lineWidth=sel?2:_hov?1.5:1;ctx.stroke();
    // Color accent bar top
    const ab=ctx.createLinearGradient(x,y,x+w,y);
    ab.addColorStop(0,hexA(m.color,0.8));ab.addColorStop(1,hexA(m.color,0.2));
    rp(ctx,x,y,w,4,12);ctx.fillStyle=ab;ctx.fill();}
    // Icon
    const isz=cl(Math.floor(h*0.38),14,32);
    ctx.save();ctx.font=`${isz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(m.icon,x+w*0.18,y+h*0.38);ctx.restore();
    // Name
    const nsz=cl(Math.floor(h*0.22),8,18);
    ctx.save();ctx.font=`bold ${nsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillStyle=sel?m.color:th.tm;
    if(sel){ctx.shadowColor=m.color;ctx.shadowBlur=5;}
    ctx.fillText(m.name,x+w*0.32,y+h*0.35);ctx.restore();
    // Description
    const dsz=cl(Math.floor(h*0.15),6,12);
    ctx.save();ctx.font=`${dsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.textBaseline='top';
    ctx.fillStyle=hexA(th.tg,0.75);
    const lines=m.desc.split('\n');
    lines.forEach((ln,li)=>ctx.fillText(ln,x+w*0.32,y+h*0.55+li*(dsz*1.35)));
    ctx.restore();
    // Best score for this mode
    const _modeBest=_getModeScore(key);
    if(_modeBest>0){const _mbsz=cl(Math.floor(h*0.13),5,10);ctx.save();ctx.font=`bold ${_mbsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillStyle=hexA(m.color,0.82);ctx.fillText(`REC: ${_modeBest}`,x+w-6,y+h*0.78);ctx.restore();}
    // Selected check
    if(sel){ctx.save();ctx.font=`bold ${nsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=m.color;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText('✓',x+w-8,y+h*0.35);ctx.restore();}
  });
  // Histoire progression indicator
  if(histoireLevel>0){
    const hz=cl(Math.floor(H*0.02),7,13);
    ctx.save();ctx.font=`bold ${hz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.fillStyle='#FF6080';
    ctx.shadowColor='#FF6080';ctx.shadowBlur=5;
    ctx.fillText(`📖 Histoire : niveau ${histoireLevel+1}/${HISTOIRE_LEVELS.length}`,W/2,Math.round(H*0.93));ctx.restore();
  }
  // JOUER button
  const bw2=cl(W-52,130,240),bh2=cl(Math.round(H*0.075),32,52);
  const bx=(W-bw2)/2,by=Math.round(H*0.89)-bh2;
  const pulse=0.5+0.5*Math.sin(t*0.004);
  const selM=MODES[currentMode];
  ctx.save();
  if(_IS_IOS){
    rrect(ctx,bx,by,bw2,bh2,bh2/2,selM.color,null);
  }else{
  ctx.shadowColor=selM.color;ctx.shadowBlur=16+pulse*12;
  const pbg2=ctx.createLinearGradient(bx,by,bx,by+bh2);
  pbg2.addColorStop(0,lerpC(selM.color,'#fff',0.2));pbg2.addColorStop(1,lerpC(selM.color,'#000',0.3));
  rrect(ctx,bx,by,bw2,bh2,bh2/2,pbg2,null);
  const psh=ctx.createLinearGradient(bx,by,bx,by+bh2*0.45);
  psh.addColorStop(0,'rgba(255,255,255,0.25)');psh.addColorStop(1,'rgba(255,255,255,0)');
  rp(ctx,bx+2,by+2,bw2-4,bh2*0.45,bh2/2);ctx.fillStyle=psh;ctx.fill();
  rp(ctx,bx,by,bw2,bh2,bh2/2);ctx.strokeStyle=hexA(selM.color,0.6);ctx.lineWidth=1.5;ctx.stroke();
  ctx.shadowBlur=0;}
  const pfz=cl(Math.floor(bh2*0.48),10,20);
  drawPremText(ctx,`▶  JOUER EN MODE ${selM.name}`,bx+bw2/2,by+bh2/2,`bold ${pfz}px system-ui,-apple-system,"SF Pro Display",Arial`,'#FFFFFF',hexA(selM.color,0.6),'rgba(0,0,0,0.5)',selM.color,8,2);
  ctx.restore();
  _modePlayRect={x:bx,y:by,w:bw2,h:bh2};
  // Back button
  const backSz=cl(Math.floor(H*0.035),10,22);
  ctx.save();ctx.font=`${backSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.textBaseline='middle';
  ctx.fillStyle=hexA(th.tg,0.6);ctx.fillText('← Retour',8,Math.round(H*0.04));ctx.restore();
  _modeBackRect={x:0,y:0,w:cl(W*0.25,60,140),h:Math.round(H*0.08)};
}
let _modePlayRect=null,_modeBackRect=null;

// ─── LEADERBOARD SCREEN ──────────────────────────────────────────────────────
function drawLeaderboard(t){
  const th=THEMES[selTheme];
  if(menuBg)ctx.drawImage(menuBg,0,0);
  else{ctx.fillStyle=th.sky||'#060A0A';ctx.fillRect(0,0,W,H);}
  if(!_IS_IOS){drawFx(ctx,menuFx,t);
  menuDeco.forEach(b=>{b.x=(b.x+b.vx+W)%W;b.y=(b.y+b.vy+H)%H;ctx.globalAlpha=0.07;drawCell(ctx,b.color,b.x-b.sz/2|0,b.y-b.sz/2|0,b.sz|0,b.skin,t);ctx.globalAlpha=1;});}
  ctx.fillStyle='rgba(0,0,0,0.74)';ctx.fillRect(0,0,W,H);
  // Panel
  const pw=Math.min(W-18,420),ph=Math.round(H*0.84);
  const px=(W-pw)/2,py=(H-ph)/2;
  if(_IS_IOS){rrect(ctx,px,py,pw,ph,18,hexA(th.gbg,0.96),hexA('#FFD700',0.55),2);}else{
  const pg=ctx.createLinearGradient(px,py,px,py+ph);
  pg.addColorStop(0,hexA(th.gbg,0.96));pg.addColorStop(1,hexA(th.bg,0.93));
  rrect(ctx,px,py,pw,ph,18,pg,null);
  const psg=ctx.createLinearGradient(px,py,px,py+ph*0.28);
  psg.addColorStop(0,'rgba(255,255,255,0.10)');psg.addColorStop(1,'rgba(255,255,255,0)');
  rp(ctx,px,py,pw,ph*0.28,18);ctx.fillStyle=psg;ctx.fill();
  if(!_IS_IOS){rp(ctx,px,py,pw,ph,18);ctx.strokeStyle=hexA('#FFD700',0.55);ctx.lineWidth=2;ctx.stroke();}}
  // Title
  const tsz=cl(pw*0.098|0,15,32);
  ctx.save();ctx.font=`bold ${tsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='#FFD700';ctx.shadowColor='#FFD700';ctx.shadowBlur=12+5*Math.sin(t*0.002);
  ctx.fillText('🏆 CLASSEMENT MONDIAL',W/2,py+ph*0.085);ctx.restore();
  // Live badge
  const ssz=cl(pw*0.052|0,8,14);
  ctx.save();ctx.font=`bold ${ssz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.fillStyle='#FF4040';
  ctx.shadowColor='#FF4040';ctx.shadowBlur=6+3*Math.abs(Math.sin(t*0.003));
  ctx.fillText('● EN DIRECT',W/2,py+ph*0.15);ctx.restore();
  // Separator
  ctx.save();ctx.strokeStyle=hexA('#FFD700',0.28);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(px+18,py+ph*0.175);ctx.lineTo(px+pw-18,py+ph*0.175);ctx.stroke();ctx.restore();
  // Entries
  const medals=['🥇','🥈','🥉'];
  const listTop=py+ph*0.185,listH=ph*0.595;
  const entryH=listH/10;
  const entrySz=cl(entryH*0.48|0,9,17);
  if(leaderboardData.length===0){
    ctx.save();ctx.font=`${entrySz*1.1}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=hexA(th.tg,0.55);ctx.fillText('Chargement…',W/2,listTop+listH/2);ctx.restore();
  }else{
    leaderboardData.slice(0,10).forEach((e,i)=>{
      const ey=listTop+i*entryH;
      // Row bg
      ctx.fillStyle=i%2===0?'rgba(255,255,255,0.06)':'rgba(255,255,255,0.02)';
      rp(ctx,px+8,ey+1,pw-16,entryH-2,4);ctx.fill();
      // Highlight player's own entry
      if(e.pseudo===playerPseudo){ctx.fillStyle='rgba(64,255,128,0.08)';rp(ctx,px+8,ey+1,pw-16,entryH-2,4);ctx.fill();}
      ctx.save();ctx.textBaseline='middle';
      // Rank / medal
      if(i<3){ctx.font=`${entrySz*1.05}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.fillText(medals[i],px+13,ey+entryH/2);}
      else{ctx.font=`bold ${entrySz*0.9}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.fillStyle=hexA(th.tg,0.65);ctx.fillText(`#${i+1}`,px+14,ey+entryH/2);}
      // Pseudo
      ctx.font=`bold ${entrySz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';
      const isSelf=e.pseudo===playerPseudo;
      ctx.fillStyle=isSelf?'#40FF80':th.tm;
      if(isSelf){ctx.shadowColor='#40FF80';ctx.shadowBlur=5;}
      ctx.fillText(e.pseudo,px+46,ey+entryH/2);
      ctx.shadowBlur=0;
      // Score
      ctx.textAlign='right';ctx.font=`bold ${entrySz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;
      ctx.fillStyle=i<3?'#FFD700':th.ta;
      ctx.fillText(e.score.toLocaleString('fr-FR'),px+pw-14,ey+entryH/2);
      ctx.restore();
    });
  }
  // Separator
  const sepY=listTop+listH+5;
  ctx.save();ctx.strokeStyle=hexA('#FFD700',0.18);ctx.lineWidth=1;
  ctx.beginPath();ctx.moveTo(px+18,sepY);ctx.lineTo(px+pw-18,sepY);ctx.stroke();ctx.restore();
  // Personal best
  if(best>0){
    const ysz=cl(pw*0.052|0,8,14);
    ctx.save();ctx.font=`bold ${ysz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.fillStyle='rgba(255,255,255,0.55)';
    const pseudo=playerPseudo||'Toi';
    ctx.fillText(`Ton record : ${best.toLocaleString('fr-FR')}  (${pseudo})`,W/2,sepY+ysz*1.6);ctx.restore();
  }
  // Back button
  const bw=cl(pw*0.46|0,100,180),bh2=cl(Math.round(H*0.068),28,48);
  const bx2=(W-bw)/2,by2=py+ph-bh2-14;
  let bbg;
  if(_IS_IOS){bbg='#383858';}else{bbg=ctx.createLinearGradient(bx2,by2,bx2,by2+bh2);
  bbg.addColorStop(0,'#383858');bbg.addColorStop(1,'#1c1c2c');}
  rrect(ctx,bx2,by2,bw,bh2,bh2/2,bbg,null);
  rp(ctx,bx2,by2,bw,bh2,bh2/2);ctx.strokeStyle=hexA(th.dc,0.5);ctx.lineWidth=1.5;ctx.stroke();
  const bfz=cl(Math.floor(bh2*0.5),10,18);
  ctx.save();ctx.font=`bold ${bfz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillStyle='rgba(255,255,255,0.8)';ctx.fillText('← RETOUR',bx2+bw/2,by2+bh2/2);ctx.restore();
  _backLbRect={x:bx2,y:by2,w:bw,h:bh2};
}

