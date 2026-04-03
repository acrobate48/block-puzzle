'use strict';
// ─── GAME RENDER ─────────────────────────────────────────────────────────────
function drawGame(t){
  const newTh=getCurTheme();
  if(newTh!==curTheme){const _prevTh=curTheme;curTheme=newTh;gameBg=buildBg(curTheme);gameFx=initFx(curTheme);screenFlash=180;screenFlashCol=THEMES[curTheme].tm;floats.push(new FloatText(`🎨 ${THEMES[curTheme].name}`,W/2,H*0.45,THEMES[curTheme].tm,1.3,120));}
  // Score animé
  if(displayScore<score){const _gap=score-displayScore;const _rate=_gap>5000?0.22:_gap>1000?0.16:0.12;displayScore=Math.min(score,displayScore+Math.max(1,Math.ceil(_gap*_rate)));}
  // Chaos event notification
  if(_engChaosFlash&&!over){
    _engChaosFlash=false;
    const _ph=_engPhase();
    const _isChaosHard=Math.random()<0.55; // already determined in newTray, just display matching label
    const _chaosLbl=_isChaosHard?'💥 CHAOS ! Grosse pièce !':'🎁 CHANCE ! Pièce cadeau !';
    const _chaosCol=_isChaosHard?'#FF6020':'#60FFD0';
    floats.push(new FloatText(_chaosLbl,W/2,H*0.44,_chaosCol,1.6,160));
    screenFlash=Math.max(screenFlash,180);screenFlashCol=_chaosCol;
    shake=Math.max(shake,10);shakePow=Math.max(shakePow,4);sndBonus();
  }
  // Endurance bonus — reward 5 minutes of continuous play
  if(!_enduranceBonusTriggered&&!over&&gameStartTime>0&&Date.now()-gameStartTime>=300000){
    _enduranceBonusTriggered=true;_enduranceBonusUntil=Date.now()+30000;
    screenFlash=200;screenFlashCol='#60FFD0';shake=Math.max(shake,12);shakePow=Math.max(shakePow,5);
    floats.push(new FloatText('🏅 ENDURANCE ! ×1.5 pendant 30s',W/2,H*0.40,'#60FFD0',1.5,180));
    sndBonus();
  }
  const th=THEMES[curTheme];
  if(shake>0){shake--;shakeX=rnd(-shakePow,shakePow)|0;shakeY=rnd(-shakePow,shakePow)|0;}else{shakeX=0;shakeY=0;}
  ctx.drawImage(gameBg,shakeX,shakeY);
  drawFx(ctx,gameFx,t);
  ctx.save();ctx.translate(shakeX,shakeY);
  // Grid frame (glass effect)
  const b2=Math.max(4,CELL*0.1|0);
  const fg3=ctx.createLinearGradient(GRID_X-b2,GRID_Y-b2,GRID_X-b2,GRID_Y+GH+b2);
  fg3.addColorStop(0,hexA(th.sl,0.9));fg3.addColorStop(1,hexA(th.dc,0.9));
  rrect(ctx,GRID_X-b2,GRID_Y-b2,GW+b2*2,GH+b2*2,CR+b2,fg3,null);
  // Grid glass inner
  const gig=ctx.createLinearGradient(GRID_X,GRID_Y,GRID_X,GRID_Y+GH);
  gig.addColorStop(0,hexA(th.gbg,0.90));gig.addColorStop(1,hexA(th.ge,0.90));
  ctx.fillStyle=gig;ctx.fillRect(GRID_X,GRID_Y,GW,GH);
  // Inner rim light — top + left edge brighter (Apple glassmorphism)
  const rimT=ctx.createLinearGradient(GRID_X,GRID_Y,GRID_X,GRID_Y+GH*0.12);
  rimT.addColorStop(0,'rgba(255,255,255,0.14)');rimT.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=rimT;ctx.fillRect(GRID_X,GRID_Y,GW,GH*0.12);
  const rimL=ctx.createLinearGradient(GRID_X,GRID_Y,GRID_X+GW*0.06,GRID_Y);
  rimL.addColorStop(0,'rgba(255,255,255,0.09)');rimL.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=rimL;ctx.fillRect(GRID_X,GRID_Y,GW*0.06,GH);
  // Cells
  const _parasiteSet=new Set(parasites.map(p=>p.r*100+p.c));
  for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL,color=grid[r][c];
    // Spring pop animation for recently placed cells
    const popF=placedCellsMap.get(r*100+c);
    if(color){
      if(popF!==undefined&&popF<_SPRING.length){
        const sc=_SPRING[popF];const off=(CELL*(1-sc)/2)|0;
        drawCell(ctx,color,x+off,y+off,Math.ceil(CELL*sc),selSkin,t);
      } else drawCell(ctx,color,x,y,CELL,selSkin,t);
      // Star overlay
      if(gridStars[r][c]){const sfsz=Math.max(8,CELL*0.38)|0;ctx.save();ctx.font=`${sfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=0.9;ctx.fillStyle='#FFE030';ctx.shadowColor='#FFD700';ctx.shadowBlur=7;ctx.fillText('★',x+CELL/2,y+CELL/2);ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();}
      // Bonus overlay
      if(gridBonus[r][c]){const bsz=Math.max(10,CELL*0.72)|0;ctx.globalAlpha=0.93;if(gridBonus[r][c]==='bomb')drawBombIcon(ctx,x+CELL/2,y+CELL/2,bsz);else drawX2Icon(ctx,x+CELL/2,y+CELL/2,bsz);ctx.globalAlpha=1;}
      // Parasite overlay (if this cell is an active parasite source)
      if(_parasiteSet.has(r*100+c)){drawParasiteOverlay(ctx,x,y,CELL,t,r*17+c*31);}
    }else{
      // Empty cell — subtle rounded inset with center dot (Apple style)
      const er=Math.max(2,CELL/6|0);
      rrect(ctx,x+2,y+2,CELL-4,CELL-4,er,hexA(th.ge,0.30),hexA(th.sl,0.10),1);
      ctx.fillStyle=hexA(th.sl,0.14);
      ctx.beginPath();ctx.arc(x+CELL/2,y+CELL/2,Math.max(1,CELL*0.055),0,Math.PI*2);ctx.fill();
    }
  }}
  // Update pop animations (O(1) per entry)
  placedCellsMap.forEach((f,k)=>{if(f+1>=_SPRING.length)placedCellsMap.delete(k);else placedCellsMap.set(k,f+1);});
  // Clear line sweep animations — Apple-style: flash + bright sweep + glow trail
  clearAnims=clearAnims.filter(a=>{
    const dur=520;
    const p=Math.min(1,(Date.now()-a.born)/dur);
    if(p>=1)return false;
    const eased=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; // ease-in-out quad
    const ring=Math.sin(p*Math.PI);
    // Phase 1 (0-0.4): cells flash white then fade out
    if(p<0.5){
      const flashA=ring*0.9;
      a.cells.forEach(({r,c})=>{
        const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
        const er=Math.max(2,CELL/6|0);
        ctx.save();ctx.shadowColor=a.color;ctx.shadowBlur=CELL*0.5*ring;
        rrect(ctx,x+1,y+1,CELL-2,CELL-2,er,`rgba(255,255,255,${(flashA).toFixed(3)})`,null);
        ctx.restore();
      });
    }
    // Sweep beam: bright vertical light moving left-to-right
    const sweepX=GRID_X+eased*GW;
    const beamW=CELL*3.5;
    const sg=ctx.createLinearGradient(sweepX-beamW,0,sweepX+beamW*0.4,0);
    sg.addColorStop(0,'rgba(255,255,255,0)');
    sg.addColorStop(0.55,hexA(a.color,0.65*ring));
    sg.addColorStop(0.75,'rgba(255,255,255,'+(0.50*ring).toFixed(3)+')');
    sg.addColorStop(1,'rgba(255,255,255,0)');
    // Clip to the cleared rows only
    const rows=[...new Set(a.cells.map(c=>c.r))];
    ctx.save();
    ctx.beginPath();
    rows.forEach(r=>{ctx.rect(GRID_X,GRID_Y+r*CELL,GW,CELL);});
    ctx.clip();
    ctx.fillStyle=sg;ctx.fillRect(GRID_X,GRID_Y,GW,GH);
    ctx.restore();
    return true;
  });
  // Ghost piece (snap preview) + column highlight + ambient glow
  // ── HINT FLASH ── show a valid placement after 12s idle (no drag active)
  if(!drag&&gameState==='playing'&&!over&&lastPlaceTime>0&&Date.now()-lastPlaceTime>12000){
    const _ht=Date.now();const _hPulse=0.3+0.3*Math.abs(Math.sin(_ht*0.005));
    let _hDone=false;
    for(let _hi=0;_hi<tray.length&&!_hDone;_hi++){const _hp=tray[_hi];if(!_hp)continue;
      for(let _hr=0;_hr<ROWS&&!_hDone;_hr++){for(let _hc=0;_hc<COLS&&!_hDone;_hc++){
        if(_modeCanPlace(grid,_hp.shape,_hr,_hc)){
          ctx.save();ctx.globalAlpha=_hPulse;ctx.strokeStyle=THEMES[curTheme].hi||THEMES[curTheme].tm;ctx.lineWidth=2;ctx.setLineDash([3,3]);
          _hp.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const _hx=GRID_X+(_hc+cc)*CELL,_hy=GRID_Y+(_hr+rr)*CELL;const _er=Math.max(2,CELL/6|0);rp(ctx,_hx+1,_hy+1,CELL-2,CELL-2,_er);ctx.stroke();}}));
          ctx.setLineDash([]);ctx.restore();_hDone=true;
        }
      }}
    }
  }
  if(drag&&gameState==='playing'&&!over){
    const piece=tray[drag.idx];
    if(piece){
      const{gr,gc}=snapPos(mouseX,mouseY,piece.shape);
      const valid=_modeCanPlace(grid,piece.shape,gr,gc);
      const ghostColor=valid?piece.color:'#FF4040';
      // Column highlight — subtle pulse under ghost columns
      const hlA=(0.06+0.03*Math.sin(Date.now()*0.004)).toFixed(3);
      ctx.save();ctx.fillStyle=`rgba(255,255,255,${hlA})`;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pc2=gc+cc;if(pc2>=0&&pc2<COLS)ctx.fillRect(GRID_X+pc2*CELL,GRID_Y,CELL,GH);}}));
      ctx.restore();
      // Ambient glow under ghost cells
      ctx.save();ctx.shadowColor=ghostColor;ctx.shadowBlur=CELL*0.65;ctx.globalAlpha=0.20;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pr2=gr+rr,pc2=gc+cc;
        if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS){const er=Math.max(2,CELL/6|0);rrect(ctx,GRID_X+pc2*CELL+2,GRID_Y+pr2*CELL+2,CELL-4,CELL-4,er,ghostColor,null);}
      }}));ctx.restore();
      // Ghost cells (translucent)
      ctx.globalAlpha=valid?0.38:0.28;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pr2=gr+rr,pc2=gc+cc;
        if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS)drawCell(ctx,ghostColor,GRID_X+pc2*CELL,GRID_Y+pr2*CELL,CELL,selSkin,t);
      }}));
      ctx.globalAlpha=1;
    }
  }
  // ── Phase badge — subtle indicator of current engagement phase ──────────────
  if(!over&&gameState==='playing'){
    const _ph2=_engPhase();
    const _phPulse=0.55+0.45*Math.abs(Math.sin(Date.now()*0.003));
    const _phSz=Math.max(7,Math.min(11,TRAY_H*0.18))|0;
    ctx.save();
    ctx.font=`bold ${_phSz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.textAlign='right';ctx.textBaseline='bottom';
    ctx.globalAlpha=_phPulse*0.72;
    ctx.fillStyle=_ph2.col;ctx.shadowColor=_ph2.col;ctx.shadowBlur=5;
    ctx.fillText(_ph2.label,GRID_X+GW-4,TRAY_Y-3);
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
  // Tray (glass)
  const tbg2=ctx.createLinearGradient(GRID_X,TRAY_Y,GRID_X,TRAY_Y+TRAY_H);
  tbg2.addColorStop(0,hexA(th.gbg,0.55));tbg2.addColorStop(1,hexA(th.ge,0.4));
  rrect(ctx,GRID_X,TRAY_Y,GW,TRAY_H,CR,tbg2,hexA(th.dc,0.5),1);
  const topShine=ctx.createLinearGradient(GRID_X,TRAY_Y,GRID_X,TRAY_Y+TRAY_H*0.4);
  topShine.addColorStop(0,'rgba(255,255,255,0.08)');topShine.addColorStop(1,'rgba(255,255,255,0)');
  rrect(ctx,GRID_X,TRAY_Y,GW,TRAY_H,CR,topShine,null);
  const pw=GW/3;
  for(let i=0;i<3;i++){
    if(i>0){ctx.strokeStyle=hexA(th.dc,0.3);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(GRID_X+i*pw,TRAY_Y+4);ctx.lineTo(GRID_X+i*pw,TRAY_Y+TRAY_H-4);ctx.stroke();}
    const piece=tray[i];
    if(!piece){
      // Empty slot — breathing outline to indicate absence
      const _ep=0.4+0.4*Math.abs(Math.sin(t*0.008+i*1.3));
      const _er2=Math.max(4,pw*0.12)|0;
      const _ex=GRID_X+i*pw+pw*0.18,_ey=TRAY_Y+TRAY_H*0.22,_ew=pw*0.64,_eh=TRAY_H*0.56;
      ctx.save();ctx.strokeStyle=hexA(th.sl,_ep);ctx.lineWidth=1.5;ctx.setLineDash([4,4]);
      rp(ctx,_ex,_ey,_ew,_eh,_er2);ctx.stroke();ctx.setLineDash([]);
      ctx.globalAlpha=_ep*0.5;ctx.font=`${Math.max(10,TRAY_H*0.28)|0}px system-ui,-apple-system,"SF Pro Display",Arial`;
      ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle=th.tg;ctx.fillText('·',GRID_X+i*pw+pw/2,TRAY_Y+TRAY_H/2);
      ctx.globalAlpha=1;ctx.restore();
      continue;
    }
    const sh=piece.shape,pcw=sh[0].length*PIECE_CELL,pch=sh.length*PIECE_CELL;
    const ox=(GRID_X+i*pw+pw/2-pcw/2)|0,oy=(TRAY_Y+(TRAY_H-pch)/2)|0;
    const dim=drag&&drag.idx===i;
    if(piece.isParasite){
      // Parasite piece: draw with special corrupted skin + glow border
      const pulse=0.5+0.5*Math.sin(t*0.006+i*2.1);
      ctx.save();ctx.shadowColor=`rgba(0,255,80,${0.5+0.4*pulse})`;ctx.shadowBlur=PIECE_CELL*0.6;
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)drawParasiteCell(ctx,ox+cc*PIECE_CELL,oy+rr*PIECE_CELL,PIECE_CELL,t,rr*17+cc*31);}));
      ctx.shadowBlur=0;ctx.restore();
      // Label "☠ PARASITE"
      const lsz=cl(Math.floor(TRAY_H*0.16),7,12);
      ctx.save();ctx.font=`bold ${lsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle=`rgba(0,${(200+55*pulse)|0},60,0.95)`;ctx.shadowColor='#00FF60';ctx.shadowBlur=6;
      ctx.fillText('☠ PARASITE',GRID_X+i*pw+pw/2,TRAY_Y+TRAY_H-lsz*0.75);ctx.shadowBlur=0;ctx.restore();
    }else{
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)drawCell(ctx,piece.color,ox+cc*PIECE_CELL,oy+rr*PIECE_CELL,PIECE_CELL,selSkin,t,dim?0.3:1);}));
    }
  }
  // ── Aperçu 2 prochains blocs ─────────────────────────────────────────────
  if(nextTrayPreview){
    const pvH=Math.max((CELL*1.3)|0,44);
    const pvY=TRAY_Y+TRAY_H+4;
    // Panel
    const pvBg=ctx.createLinearGradient(GRID_X,pvY,GRID_X,pvY+pvH);
    pvBg.addColorStop(0,hexA(th.gbg,0.38));pvBg.addColorStop(1,hexA(th.ge,0.25));
    rrect(ctx,GRID_X,pvY,GW,pvH,CR,pvBg,hexA(th.dc,0.28),1);
    // Label "SUIVANT" à gauche
    const lsz=Math.max(7,pvH*0.22)|0;
    ctx.save();ctx.font=`bold ${lsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.fillStyle=hexA(th.tg,0.7);ctx.fillText('SUIVANT',GRID_X+5,pvY+pvH/2);ctx.restore();
    // Affiche les 2 premiers blocs du prochain tray (indices 0 et 1)
    const pvPc=Math.floor(CELL*0.42);
    const pvSlotW=GW/2;
    for(let i=0;i<2;i++){
      const piece=nextTrayPreview[i];if(!piece)continue;
      const sh=piece.shape;
      const pcw=sh[0].length*pvPc,pch=sh.length*pvPc;
      const ox=(GRID_X+i*pvSlotW+pvSlotW/2-pcw/2)|0,oy=(pvY+(pvH-pch)/2)|0;
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{
        if(v)drawCell(ctx,piece.color,ox+cc*pvPc,oy+rr*pvPc,pvPc,selSkin,t,0.55);
      }));
      // Séparateur entre les 2 slots
      if(i===0){ctx.strokeStyle=hexA(th.dc,0.22);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(GRID_X+pvSlotW,pvY+4);ctx.lineTo(GRID_X+pvSlotW,pvY+pvH-4);ctx.stroke();}
    }
  }
  ctx.restore();
  // Dragged piece (on top, no shake) + speed timer indicator
  if(drag&&!over){
    const piece=tray[drag.idx];
    if(piece){
      const _liftScale=1.08;const _liftCell=Math.ceil(CELL*_liftScale);
      const sh=piece.shape,ox=(mouseX-sh[0].length*_liftCell/2)|0,oy=(mouseY-sh.length*_liftCell/2-CELL*0.22)|0;
      // Drop shadow
      ctx.save();ctx.shadowColor='rgba(0,0,0,0.55)';ctx.shadowBlur=CELL*0.5;ctx.shadowOffsetY=CELL*0.25;
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){if(piece.isParasite)drawParasiteCell(ctx,ox+cc*_liftCell,oy+rr*_liftCell,_liftCell,t,rr*17+cc*31);else drawCell(ctx,piece.color,ox+cc*_liftCell,oy+rr*_liftCell,_liftCell,selSkin,t);}}));
      ctx.restore();
      // Speed ring indicator (arc showing elapsed think time)
      if(lastPlaceTime>0){
        const elapsed=Date.now()-lastPlaceTime;
        const maxT=SPEED_SLOW; // full ring at SLOW threshold
        const frac=Math.min(1,elapsed/maxT);
        // Color: green → yellow → orange → red
        let rc,gc2,bc2;
        if(frac<0.25){rc=lerp(40,255,frac/0.25)|0;gc2=220;bc2=40;}
        else if(frac<0.55){rc=255;gc2=lerp(220,140,(frac-0.25)/0.3)|0;bc2=40;}
        else{rc=255;gc2=lerp(140,40,(frac-0.55)/0.45)|0;bc2=40;}
        const pcx=ox+sh[0].length*_liftCell/2,pcy=oy+sh.length*_liftCell/2;
        const ringR=sh[0].length*_liftCell*0.6;
        ctx.save();
        ctx.strokeStyle=`rgba(${rc},${gc2},${bc2},0.82)`;ctx.lineWidth=4;ctx.lineCap='round';
        ctx.shadowColor=`rgba(${rc},${gc2},${bc2},0.6)`;ctx.shadowBlur=8;
        ctx.beginPath();ctx.arc(pcx,pcy,ringR,-Math.PI/2,-Math.PI/2+frac*Math.PI*2);ctx.stroke();
        // Label near ring
        const lsz=Math.max(8,CELL*0.28)|0;
        ctx.font=`bold ${lsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowBlur=0;
        const label=elapsed<SPEED_TURBO?'⚡ TURBO':elapsed<SPEED_FAST?'⚡ RAPIDE':elapsed>=SPEED_SLOW?'🐢 LENT':'';
        if(label){ctx.fillStyle=`rgba(${rc},${gc2},${bc2},0.9)`;ctx.fillText(label,pcx,pcy-ringR-lsz);}
        ctx.restore();
      }
    }
  }
  // Particles + Debris
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.13;p.life--;if(p.life<=0)return false;const ratio=p.life/p.ml,sz=Math.max(1,p.size*ratio);ctx.fillStyle=hexA(p.color,0.82*ratio);if(p.circle){ctx.beginPath();ctx.arc(p.x,p.y,sz,0,Math.PI*2);ctx.fill();}else ctx.fillRect(p.x-sz,p.y-sz,sz*2,sz*2);return true;});
  debris=debris.filter(d=>{d.draw(ctx);return d.update();});
  if(gameState!=='pause'){floats=floats.filter(f=>{f.draw(ctx);return f.update();});}else{floats=floats.filter(f=>f.update());}
  // Screen flash
  if(screenFlash>0){ctx.fillStyle=hexA(screenFlashCol,screenFlash/255*0.48);ctx.fillRect(0,0,W,H);screenFlash=Math.max(0,screenFlash-5);}
  // Danger zone — red vignette when grid > 75% full
  if(!over){
    const _filled=grid.reduce((s,row)=>s+row.filter(Boolean).length,0);
    const _fillRatio=_filled/(ROWS*COLS);
    if(_fillRatio>0.75){
      const _danger=(_fillRatio-0.75)/0.25; // 0→1 as fill goes 75%→100%
      const _pulse=0.5+0.5*Math.abs(Math.sin(t*(_fillRatio>0.90?0.018:0.010)));
      const _dv=ctx.createRadialGradient(GRID_X+GW/2,GRID_Y+GH/2,Math.min(GW,GH)*0.25,GRID_X+GW/2,GRID_Y+GH/2,Math.max(GW,GH)*0.82);
      _dv.addColorStop(0,'rgba(0,0,0,0)');_dv.addColorStop(1,`rgba(200,20,0,${(_danger*0.45*_pulse).toFixed(3)})`);
      ctx.fillStyle=_dv;ctx.fillRect(0,0,W,H);
    }
  }
  // Fade in
  if(fadeAlpha>0){ctx.fillStyle=`rgba(0,0,0,${fadeAlpha.toFixed(3)})`;ctx.fillRect(0,0,W,H);fadeAlpha=Math.max(0,fadeAlpha-0.04);}
  // HUD
  drawHUD(th);
  // Vignette
  const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.28,W/2,H/2,Math.max(W,H)*0.68);
  vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,0.38)');
  ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
  // Bonus banner (piece picker)
  if(showAddCellsBonus&&!over&&!showSecondChance&&!showBonusPicker){
    const bw2=Math.min(W-20,360),bh2=Math.round(H*0.092)+2;
    const bx2=(W-bw2)/2,by2=H-bh2-8;
    const pulse2=0.5+0.5*Math.sin(Date.now()*0.005);
    // Background
    const bbg=ctx.createLinearGradient(bx2,by2,bx2,by2+bh2);
    bbg.addColorStop(0,'rgba(20,0,60,0.97)');bbg.addColorStop(1,'rgba(60,20,120,0.95)');
    rrect(ctx,bx2,by2,bw2,bh2,bh2/2,bbg,null);
    // Gold border pulse
    rp(ctx,bx2,by2,bw2,bh2,bh2/2);
    const bord=ctx.createLinearGradient(bx2,by2,bx2+bw2,by2+bh2);
    bord.addColorStop(0,'#FFE040');bord.addColorStop(0.5,'#FFA000');bord.addColorStop(1,'#FFE040');
    ctx.strokeStyle=bord;ctx.lineWidth=1.5+pulse2;ctx.stroke();
    // Star icon left
    const ico=bh2*0.45;
    ctx.save();ctx.font=`${ico|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor='#FFD700';ctx.shadowBlur=10;ctx.fillStyle='#FFD700';ctx.fillText('🎁',bx2+bh2*0.62,by2+bh2/2);ctx.shadowBlur=0;ctx.restore();
    // Text
    const bfsz2=cl(Math.floor(bh2*0.29),8,14);
    ctx.save();ctx.font=`bold ${bfsz2}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    const tg2=ctx.createLinearGradient(0,by2+bh2*0.15,0,by2+bh2*0.85);
    tg2.addColorStop(0,'#FFF0A0');tg2.addColorStop(0.5,'#FFD700');tg2.addColorStop(1,'#FFA020');
    ctx.fillStyle=tg2;ctx.shadowColor='rgba(255,200,0,0.6)';ctx.shadowBlur=8;
    ctx.fillText('BONUS  —  Touchez pour choisir une pièce !',bx2+bw2/2+bh2*0.2,by2+bh2/2);
    ctx.shadowBlur=0;ctx.restore();
    addCellsBonusRect={x:bx2,y:by2,w:bw2,h:bh2};
  }else if(!showAddCellsBonus&&!showBonusPicker){addCellsBonusRect=null;}
  // Bonus piece picker overlay
  if(showBonusPicker&&!over&&!showSecondChance){
    bonusPickerRects=[];
    ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,W,H);
    const pw3=Math.min(W-20,400),ph3=Math.round(H*0.38);
    const px3=(W-pw3)/2,py3=(H-ph3)/2;
    // Panel
    const ppg=ctx.createLinearGradient(px3,py3,px3,py3+ph3);
    ppg.addColorStop(0,'rgba(20,0,60,0.98)');ppg.addColorStop(1,'rgba(5,0,20,0.97)');
    rrect(ctx,px3,py3,pw3,ph3,16,ppg,null);
    // Gold border
    const pbord=ctx.createLinearGradient(px3,py3,px3+pw3,py3+ph3);
    pbord.addColorStop(0,'#FFE040');pbord.addColorStop(0.5,'#FFA000');pbord.addColorStop(1,'#FFE040');
    rp(ctx,px3,py3,pw3,ph3,16);ctx.strokeStyle=pbord;ctx.lineWidth=2;ctx.stroke();
    // Shine top
    const psh=ctx.createLinearGradient(px3,py3,px3,py3+ph3*0.35);
    psh.addColorStop(0,'rgba(255,255,255,0.1)');psh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,px3,py3,pw3,ph3*0.35,16);ctx.fillStyle=psh;ctx.fill();
    // Title
    const tsz=cl(pw3*0.062|0,10,19);
    ctx.save();ctx.font=`bold ${tsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    const ttg=ctx.createLinearGradient(0,py3+ph3*0.06,0,py3+ph3*0.2);
    ttg.addColorStop(0,'#FFF0A0');ttg.addColorStop(1,'#FFA000');
    ctx.fillStyle=ttg;ctx.shadowColor='rgba(255,200,0,0.7)';ctx.shadowBlur=12;
    ctx.fillText('✦  BONUS — Choisissez une pièce !  ✦',px3+pw3/2,py3+ph3*0.13);
    ctx.shadowBlur=0;ctx.restore();
    // 5 pieces grid
    const N=bonusPickerPieces.length;
    const slotW=pw3/N;const slotH=ph3*0.72;const slotY=py3+ph3*0.23;
    bonusPickerPieces.forEach((piece,i)=>{
      const sx=px3+i*slotW,sy=slotY;
      // Slot background
      const ishov=(mouseX>=sx&&mouseX<sx+slotW&&mouseY>=sy&&mouseY<sy+slotH);
      const slBg=ctx.createLinearGradient(sx,sy,sx,sy+slotH);
      slBg.addColorStop(0,ishov?'rgba(255,200,0,0.22)':'rgba(255,255,255,0.06)');
      slBg.addColorStop(1,ishov?'rgba(255,140,0,0.12)':'rgba(255,255,255,0.02)');
      rrect(ctx,sx+3,sy+3,slotW-6,slotH-6,10,slBg,ishov?hexA('#FFD700',0.6):hexA('#FFFFFF',0.15),ishov?1.5:0.8);
      // Draw piece centered in slot
      const sh=piece.shape;
      const pcol=sh[0].length,prow=sh.length;
      const maxDim=Math.max(pcol,prow);
      const pc2=Math.floor((slotW-16)/maxDim);
      const ox=sx+(slotW-pcol*pc2)/2,oy=sy+(slotH-prow*pc2)/2;
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)drawCell(ctx,piece.color,ox+cc*pc2|0,oy+rr*pc2|0,pc2,selSkin,t);}));
      bonusPickerRects.push({x:sx,y:sy,w:slotW,h:slotH,idx:i});
    });
    // Dismiss hint
    const hsz=cl(pw3*0.038|0,8,12);
    ctx.save();ctx.font=`${hsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='rgba(180,180,200,0.7)';
    ctx.fillText('(appuyez en dehors pour ignorer)',px3+pw3/2,py3+ph3*0.93);ctx.restore();
  }
  // Second Chance Panel
  if(showSecondChance){
    const scpW=Math.min(W-24,360),scpH=Math.round(H*0.4);
    const scpX=(W-scpW)/2,scpY=(H-scpH)/2;
    ctx.fillStyle='rgba(0,0,0,0.76)';ctx.fillRect(0,0,W,H);
    const spg=ctx.createLinearGradient(scpX,scpY,scpX,scpY+scpH);
    spg.addColorStop(0,hexA(th.gbg,0.97));spg.addColorStop(1,hexA(th.bg,0.95));
    rrect(ctx,scpX,scpY,scpW,scpH,16,spg,null);
    const spsh=ctx.createLinearGradient(scpX,scpY,scpX,scpY+scpH*0.35);
    spsh.addColorStop(0,'rgba(255,255,255,0.11)');spsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,scpX,scpY,scpW,scpH*0.35,16);ctx.fillStyle=spsh;ctx.fill();
    rp(ctx,scpX,scpY,scpW,scpH,16);ctx.strokeStyle=hexA(th.dc,0.7);ctx.lineWidth=2;ctx.stroke();
    const qSz=cl(scpW*0.068|0,10,20);
    ctx.save();ctx.font=`bold ${qSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=th.hi||th.tm;ctx.shadowColor=th.tm;ctx.shadowBlur=12;
    ctx.fillText('SECONDE CHANCE ?',scpX+scpW/2,scpY+scpH*0.18);
    ctx.shadowBlur=0;
    const scSub=cl(qSz*0.72|0,8,14);
    ctx.font=`${scSub}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.tg,0.9);ctx.shadowBlur=0;
    ctx.fillText('OUI : retire les 5 derniers blocs posés',scpX+scpW/2,scpY+scpH*0.33);
    ctx.fillText('et remplace le plateau par 3 à 5 nouvelles pièces',scpX+scpW/2,scpY+scpH*0.44);
    ctx.shadowBlur=0;ctx.restore();
    const btnW=Math.floor(scpW*0.32),btnH=Math.floor(scpH*0.2);
    const ouiX=scpX+scpW*0.12,ouiY=scpY+scpH*0.55;
    const ouiG=ctx.createLinearGradient(ouiX,ouiY,ouiX,ouiY+btnH);
    ouiG.addColorStop(0,'#40C060');ouiG.addColorStop(1,'#205030');
    rrect(ctx,ouiX,ouiY,btnW,btnH,btnH/3,ouiG,null);
    ctx.save();ctx.font=`bold ${Math.floor(btnH*0.5)}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#FFF';ctx.shadowColor='#60FF80';ctx.shadowBlur=6;ctx.fillText('OUI',ouiX+btnW/2,ouiY+btnH/2);ctx.restore();
    secondChanceBtns.oui={x:ouiX,y:ouiY,w:btnW,h:btnH};
    const nonX=scpX+scpW*0.56,nonY=ouiY;
    const nonG=ctx.createLinearGradient(nonX,nonY,nonX,nonY+btnH);
    nonG.addColorStop(0,'#C04040');nonG.addColorStop(1,'#601020');
    rrect(ctx,nonX,nonY,btnW,btnH,btnH/3,nonG,null);
    ctx.save();ctx.font=`bold ${Math.floor(btnH*0.5)}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#FFF';ctx.shadowColor='#FF6060';ctx.shadowBlur=6;ctx.fillText('NON',nonX+btnW/2,nonY+btnH/2);ctx.restore();
    secondChanceBtns.non={x:nonX,y:nonY,w:btnW,h:btnH};
  }
  // Game Over
  if(over){
    const el=Date.now()-overT;
    ctx.fillStyle=`rgba(0,0,0,${Math.min(0.78,el/600*0.78).toFixed(3)})`;ctx.fillRect(0,0,W,H);
    if(el>350){
      const pw2=Math.min(W-24,390),ph2=Math.round(H*0.52);
      const px=(W-pw2)/2,py=(H-ph2)/2-10;
      // Panel glass
      const pg2=ctx.createLinearGradient(px,py,px,py+ph2);
      pg2.addColorStop(0,hexA(th.gbg,0.95));pg2.addColorStop(1,hexA(th.bg,0.92));
      rrect(ctx,px,py,pw2,ph2,18,pg2,null);
      // Panel shine
      const psg=ctx.createLinearGradient(px,py,px,py+ph2*0.4);
      psg.addColorStop(0,'rgba(255,255,255,0.1)');psg.addColorStop(1,'rgba(255,255,255,0)');
      rp(ctx,px,py,pw2,ph2*0.4,18);ctx.fillStyle=psg;ctx.fill();
      rp(ctx,px,py,pw2,ph2,18);ctx.strokeStyle=hexA(th.dc,0.7);ctx.lineWidth=2;ctx.stroke();
      // Title
      const goSz=cl(pw2*0.12|0,16,40);
      drawPremText(ctx,'GAME OVER',W/2,py+ph2*0.20,`bold ${goSz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`,'#FF6040','#CC2010','rgba(0,0,0,0.6)','#FF4020',18,3);
      ctx.textAlign='center';ctx.textBaseline='middle';
      // Score
      const scSz=cl(pw2*0.075|0,12,26);
      const isRec=score>=best&&score>0;
      if(isRec){drawPremText(ctx,`★  ${score}  ★`,W/2,py+ph2*0.39,`bold ${scSz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`,'#FFEE60','#FFA020','rgba(0,0,0,0.5)','#FFCC00',12,2.5);}
      else{ctx.font=`bold ${scSz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tm;ctx.fillText(`Score : ${score}`,W/2,py+ph2*0.39);}
      ctx.font=`bold ${scSz*0.88}px system-ui,-apple-system,"SF Pro Display",Arial`;
      ctx.fillStyle=isRec?th.hi||th.ta:th.ta;ctx.fillText(isRec?'NOUVEAU RECORD !':` Record : ${best}`,W/2,py+ph2*0.54);
      // Stats détaillées
      const stSz=cl(scSz*0.65|0,8,14);
      ctx.font=`${stSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;
      const elapsed=Date.now()-gameStartTime;
      ctx.fillText(`⏱ ${Math.floor(elapsed/60000)}:${String(Math.floor(elapsed%60000/1000)).padStart(2,'0')}  |  📊 ${totalLinesCleared} lignes  |  ×${maxComboGame} max`,W/2,py+ph2*0.73);
      // Mini bar chart — last 5 scores
      if(scoreHistory.length>1){
        const barsH=ph2*0.10,barsW=pw2*0.58,barsX=px+(pw2-barsW)/2,barsY=py+ph2*0.805;
        const maxV=Math.max(...scoreHistory,1);
        const bw2=Math.floor(barsW/scoreHistory.length)-3;
        scoreHistory.forEach((sv,si)=>{
          const bh3=Math.max(3,Math.round(barsH*(sv/maxV)));
          const bx2=barsX+si*(bw2+3);const by2=barsY+barsH-bh3;
          const isCur=si===scoreHistory.length-1;
          ctx.fillStyle=isCur?th.tm:hexA(th.tg,0.5);
          rrect(ctx,bx2,by2,bw2,bh3,2,ctx.fillStyle,null);
        });
        const lsz2=Math.max(7,stSz*0.85)|0;
        ctx.font=`${lsz2}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.tg,0.6);
        ctx.textAlign='left';ctx.fillText('historique',barsX,barsY-3);ctx.textAlign='center';
      }
      if(el>1200){
        const tapA=0.5+0.5*Math.abs(Math.sin(Date.now()*0.004));
        ctx.globalAlpha=tapA;ctx.font=`bold ${scSz*0.85}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#A0E8A0';ctx.shadowColor='#A0E8A0';ctx.shadowBlur=6;
        ctx.fillText('Toucher pour continuer',W/2,py+ph2*0.94);ctx.shadowBlur=0;ctx.globalAlpha=1;
      }
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }
  }
  // ── COMBO STREAK BADGE ───────────────────────────────────────────────────────
  if(combo>=3&&!over){
    const _cbPulse=0.88+0.12*Math.abs(Math.sin(t*0.016));
    const _cbfsz=cl(Math.floor(CELL*0.72*_cbPulse),16,36)|0;
    const _cbtxt=`🔥 COMBO ×${combo}`;
    ctx.save();
    ctx.font=`bold ${_cbfsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=combo>=6?'#FF2080':combo>=4?'#FF8000':th.tm;ctx.shadowBlur=_cbfsz*0.7;
    ctx.globalAlpha=0.92;
    ctx.fillStyle=combo>=6?'#FF40A0':combo>=4?'#FFA020':th.hi||th.tm;
    ctx.fillText(_cbtxt,GRID_X+GW/2,GRID_Y-_cbfsz*0.7);
    ctx.restore();
  }
  // ── MODE OVERLAYS ────────────────────────────────────────────────────────────
  _drawModeOverlays(t,th);
}

function _drawModeOverlays(t,th){
  const subMode=_getHistoireSubMode();
  const effectiveMode=currentMode==='histoire'?subMode:currentMode;
  // ── CHRONO ──
  if(effectiveMode==='chrono'&&!over){
    const now=Date.now();
    const dt=now-chronoLastTick;chronoLastTick=now;
    chronoTimeLeft=Math.max(0,chronoTimeLeft-dt);
    const frac=chronoTimeLeft/chronoMaxTime;
    const barW=GW,barH=Math.max(6,CELL*0.18)|0;
    const barX=GRID_X,barY=GRID_Y-barH-3;
    // Track bg
    rrect(ctx,barX,barY,barW,barH,barH/2,'rgba(0,0,0,0.5)',null);
    // Fill — green→yellow→orange→red
    const col=frac>0.5?lerpC('#40FF60','#FFD700',(1-frac)*2):lerpC('#FFD700','#FF2020',(0.5-frac)*2);
    if(frac>0)rrect(ctx,barX,barY,Math.ceil(barW*frac),barH,barH/2,col,null);
    // Pulsing border when critical
    if(frac<0.25){ctx.save();ctx.shadowColor='#FF2020';ctx.shadowBlur=8+4*Math.sin(t*0.015);rp(ctx,barX,barY,barW,barH,barH/2);ctx.strokeStyle='rgba(255,50,20,0.7)';ctx.lineWidth=2;ctx.stroke();ctx.restore();}
    // URGENCE < 2s : vignette rouge + shake grille
    const _urgent=chronoTimeLeft<2000;
    if(_urgent){
      const _pulse=0.5+0.5*Math.abs(Math.sin(t*0.022));
      const _vr=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.72);
      _vr.addColorStop(0,'rgba(0,0,0,0)');_vr.addColorStop(1,`rgba(220,20,0,${(0.28*_pulse).toFixed(3)})`);
      ctx.fillStyle=_vr;ctx.fillRect(0,0,W,H);
    }
    // Seconds label
    const sec=Math.ceil(chronoTimeLeft/1000);
    const csz=cl(Math.floor(CELL*0.55),10,20);
    const _shakeX=_urgent?(Math.sin(t*0.11)*3.5)|0:0;
    ctx.save();ctx.font=`bold ${csz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    if(frac<0.3){ctx.fillStyle='#FF4020';ctx.shadowColor='#FF2010';ctx.shadowBlur=8+4*Math.abs(Math.sin(t*0.012));}else ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText(`⏱ ${sec}`,GRID_X+GW/2+_shakeX,barY-csz*0.6);ctx.restore();
    // Timeout → game over
    if(chronoTimeLeft<=0&&!over){
      over=true;overT=Date.now();
      if(score>best){best=score;try{localStorage.setItem('blockpuzzle_best',String(best));}catch(e2){}}
      scoreHistory.push(score);scoreHistory.sort((a,b)=>b-a);scoreHistory=scoreHistory.slice(0,5);
      try{localStorage.setItem('bp_scores',JSON.stringify(scoreHistory));}catch(e2){}
      try{localStorage.removeItem('bp_save');}catch(e2){}hasSave=false;
      _triggerScoreSubmit(score);sndGameOver();
      setTimeout(()=>{gameState='gameover';},2000);
    }
  }
  // ── CHOIX / STRATÉGIE ──
  if((effectiveMode==='choix')&&choixState==='picking'&&!over){
    // Full picker overlay
    ctx.fillStyle='rgba(0,0,0,0.72)';ctx.fillRect(0,0,W,H);
    const cw=Math.min(W-16,380),ch=Math.round(H*0.44);
    const cx2=(W-cw)/2,cy2=(H-ch)/2;
    const cbg=ctx.createLinearGradient(cx2,cy2,cx2,cy2+ch);
    cbg.addColorStop(0,'rgba(30,10,50,0.97)');cbg.addColorStop(1,'rgba(15,5,25,0.95)');
    rrect(ctx,cx2,cy2,cw,ch,16,cbg,null);
    rp(ctx,cx2,cy2,cw,ch,16);ctx.strokeStyle='rgba(200,80,255,0.55)';ctx.lineWidth=2;ctx.stroke();
    const ctsz=cl(Math.floor(ch*0.12),10,20);
    ctx.save();ctx.font=`bold ${ctsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#D040FF';ctx.shadowColor='#D040FF';ctx.shadowBlur=8;
    ctx.fillText('🎯 CHOISIS TON BLOC',cx2+cw/2,cy2+ch*0.11);ctx.restore();
    // 3 piece cards
    const slotW=cw/3;choixOptionRects=[];
    choixOptions.forEach((piece,i)=>{
      const sx=cx2+i*slotW+6,sy=cy2+ch*0.2,sw=slotW-12,sh=ch*0.62;
      choixOptionRects.push({x:sx,y:sy,w:sw,h:sh});
      const hover=mouseX>=sx&&mouseX<sx+sw&&mouseY>=sy&&mouseY<sy+sh;
      const sbg2=ctx.createLinearGradient(sx,sy,sx,sy+sh);
      sbg2.addColorStop(0,hexA(piece.color,hover?0.38:0.20));sbg2.addColorStop(1,hexA(piece.color,hover?0.22:0.10));
      rrect(ctx,sx,sy,sw,sh,10,sbg2,null);
      rp(ctx,sx,sy,sw,sh,10);ctx.strokeStyle=hexA(piece.color,hover?0.9:0.45);ctx.lineWidth=hover?2:1;ctx.stroke();
      if(hover){ctx.save();ctx.shadowColor=piece.color;ctx.shadowBlur=12;rp(ctx,sx,sy,sw,sh,10);ctx.strokeStyle=hexA(piece.color,0.8);ctx.lineWidth=2;ctx.stroke();ctx.restore();}
      // Piece preview centred in card
      const pcw=piece.shape[0].length,pch=piece.shape.length;
      const pc=cl(Math.floor(sw/(pcw+1.5)),8,28);
      const ox2=(sx+sw/2-pcw*pc/2)|0,oy2=(sy+sh*0.42-pch*pc/2)|0;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)drawCell(ctx,piece.color,ox2+cc*pc,oy2+rr*pc,pc,selSkin,t);}));
    });
    ctx.save();ctx.font=`${cl(Math.floor(ch*0.075),8,13)}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(255,255,255,0.45)';ctx.fillText('Touche un bloc pour le sélectionner',cx2+cw/2,cy2+ch*0.9);ctx.restore();
  }
  // ── CONTRAINTES ──
  if((effectiveMode==='contraintes')&&!over){
    // Render blocked cells with crosshatch + red tint
    contraBlocked.forEach(({r,c})=>{
      const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
      ctx.save();ctx.globalAlpha=0.72;
      ctx.fillStyle='rgba(180,20,20,0.45)';ctx.fillRect(x,y,CELL,CELL);
      // Crosshatch
      ctx.strokeStyle='rgba(255,60,40,0.55)';ctx.lineWidth=1.2;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+CELL,y+CELL);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+CELL,y);ctx.lineTo(x,y+CELL);ctx.stroke();
      ctx.strokeStyle='rgba(255,60,40,0.35)';ctx.strokeRect(x+1,y+1,CELL-2,CELL-2);
      ctx.globalAlpha=1;ctx.restore();
    });
    // Blocked count badge
    const bcount=contraBlocked.length;
    const bw2=cl(Math.round(GW*0.52),80,180),bh2=cl(Math.round(H*0.048),20,34);
    const bx2=GRID_X+(GW-bw2)/2,by2=GRID_Y-bh2-4;
    rrect(ctx,bx2,by2,bw2,bh2,bh2/2,'rgba(100,10,10,0.85)',null);
    rp(ctx,bx2,by2,bw2,bh2,bh2/2);ctx.strokeStyle='rgba(255,60,40,0.55)';ctx.lineWidth=1.2;ctx.stroke();
    const bfsz=cl(Math.floor(bh2*0.52),8,14);
    ctx.save();ctx.font=`bold ${bfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#FF6050';ctx.fillText(`⚠ ${bcount} cases bloquées`,bx2+bw2/2,by2+bh2/2);ctx.restore();
  }
  // ── HISTOIRE ──
  if(currentMode==='histoire'&&!over){
    const lvlDef=HISTOIRE_LEVELS[histoireLevel%HISTOIRE_LEVELS.length];
    const bw2=Math.min(GW,280),bh2=cl(Math.round(H*0.055),22,38);
    const bx2=GRID_X+(GW-bw2)/2,by2=GRID_Y-bh2-4;
    const hmet=histoireGoalMet;
    const hcol=hmet?'#40FF80':'#FF6080';
    rrect(ctx,bx2,by2,bw2,bh2,bh2/2,hmet?'rgba(10,40,15,0.9)':'rgba(40,8,20,0.9)',null);
    rp(ctx,bx2,by2,bw2,bh2,bh2/2);ctx.strokeStyle=hexA(hcol,0.55);ctx.lineWidth=1.5;ctx.stroke();
    const hfsz=cl(Math.floor(bh2*0.52),7,14);
    ctx.save();ctx.font=`bold ${hfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=hcol;
    const lvNum=histoireLevel+1;
    const isLastLvl=histoireLevel>=HISTOIRE_LEVELS.length-1;
    ctx.fillText(`📖 Niv.${lvNum}/${HISTOIRE_LEVELS.length}: ${lvlDef.label}`,bx2+bw2/2,by2+bh2/2);ctx.restore();
    // Goal met → show next button or completion screen
    if(hmet){
      const el2=Date.now()-histoireGoalMetT;
      if(el2>1000){
        ctx.fillStyle=`rgba(0,0,0,${Math.min(0.75,el2/1500*0.75).toFixed(3)})`;ctx.fillRect(0,0,W,H);
        const npw=Math.min(W-24,320),nph=cl(Math.round(H*0.42),130,230);
        const npx=(W-npw)/2,npy=(H-nph)/2;
        if(isLastLvl){
          // ── HISTOIRE TERMINÉE ──
          const cbg=ctx.createLinearGradient(npx,npy,npx,npy+nph);
          cbg.addColorStop(0,'rgba(20,10,40,0.98)');cbg.addColorStop(1,'rgba(5,3,12,0.98)');
          rrect(ctx,npx,npy,npw,nph,16,cbg,null);
          rp(ctx,npx,npy,npw,nph,16);ctx.strokeStyle='rgba(255,200,50,0.9)';ctx.lineWidth=2.5;ctx.stroke();
          const nfsz=cl(npw*0.09|0,12,26);
          ctx.save();ctx.font=`bold ${nfsz*1.2}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#FFD700';ctx.shadowColor='#FFD700';ctx.shadowBlur=18;
          ctx.fillText('🏆 HISTOIRE TERMINÉE !',W/2,npy+nph*0.22);ctx.shadowBlur=0;
          ctx.font=`${nfsz*0.7}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='rgba(255,220,100,0.9)';
          ctx.fillText('50 niveaux complétés !',W/2,npy+nph*0.40);
          ctx.font=`${nfsz*0.6}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='rgba(200,180,255,0.7)';
          ctx.fillText('La progression repart de zéro',W/2,npy+nph*0.54);ctx.restore();
          const nbw=Math.min(npw-40,200),nbh=cl(Math.round(nph*0.20),28,44);
          const nbx=(W-nbw)/2,nby=npy+nph*0.68;
          const nbg2=ctx.createLinearGradient(nbx,nby,nbx,nby+nbh);
          nbg2.addColorStop(0,'#806000');nbg2.addColorStop(1,'#402800');
          rrect(ctx,nbx,nby,nbw,nbh,nbh/2,nbg2,null);
          rp(ctx,nbx,nby,nbw,nbh,nbh/2);ctx.strokeStyle='rgba(255,200,50,0.7)';ctx.lineWidth=1.5;ctx.stroke();
          const nbfsz=cl(Math.floor(nbh*0.5),10,18);
          ctx.save();ctx.font=`bold ${nbfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#FFD700';ctx.fillText('🏠  RETOUR AU MENU',nbx+nbw/2,nby+nbh/2);ctx.restore();
          histoireNextRect={x:nbx,y:nby,w:nbw,h:nbh};
        } else {
          // ── NIVEAU RÉUSSI ──
          rrect(ctx,npx,npy,npw,nph,16,'rgba(5,20,10,0.97)',null);
          rp(ctx,npx,npy,npw,nph,16);ctx.strokeStyle='rgba(64,255,100,0.7)';ctx.lineWidth=2;ctx.stroke();
          const nfsz=cl(npw*0.09|0,12,26);
          ctx.save();ctx.font=`bold ${nfsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#40FF80';ctx.shadowColor='#40FF80';ctx.shadowBlur=10;
          ctx.fillText(`✅ NIVEAU ${lvNum} RÉUSSI !`,W/2,npy+nph*0.24);ctx.shadowBlur=0;
          ctx.font=`${nfsz*0.65}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='rgba(255,255,255,0.7)';
          ctx.fillText(lvlDef.label,W/2,npy+nph*0.40);
          // Progress bar
          const pbw=npw*0.75,pbh=8,pbx=npx+(npw-pbw)/2,pby=npy+nph*0.52;
          ctx.fillStyle='rgba(255,255,255,0.12)';rrect(ctx,pbx,pby,pbw,pbh,4,'rgba(255,255,255,0.12)',null);
          const prog=lvNum/HISTOIRE_LEVELS.length;
          rrect(ctx,pbx,pby,pbw*prog,pbh,4,'#40FF80',null);
          ctx.font=`${nfsz*0.55}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='rgba(150,255,180,0.6)';
          ctx.fillText(`${lvNum} / ${HISTOIRE_LEVELS.length}`,npx+npw/2,pby+pbh+12);ctx.restore();
          const nbw=Math.min(npw-40,200),nbh=cl(Math.round(nph*0.20),28,44);
          const nbx=(W-nbw)/2,nby=npy+nph*0.70;
          const nbg2=ctx.createLinearGradient(nbx,nby,nbx,nby+nbh);
          nbg2.addColorStop(0,'#2A6040');nbg2.addColorStop(1,'#143020');
          rrect(ctx,nbx,nby,nbw,nbh,nbh/2,nbg2,null);
          rp(ctx,nbx,nby,nbw,nbh,nbh/2);ctx.strokeStyle='rgba(64,255,100,0.6)';ctx.lineWidth=1.5;ctx.stroke();
          const nbfsz=cl(Math.floor(nbh*0.5),10,18);
          ctx.save();ctx.font=`bold ${nbfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
          ctx.fillStyle='#FFFFFF';ctx.fillText('▶  NIVEAU SUIVANT',nbx+nbw/2,nby+nbh/2);ctx.restore();
          histoireNextRect={x:nbx,y:nby,w:nbw,h:nbh};
        }
      }
    }
    _checkHistoireGoal();
  }
}

function drawHUD(th){
  const portrait=H>W;
  if(portrait){
    // Glass top bar
    const bh=GRID_Y-3;
    const hg2=ctx.createLinearGradient(0,0,0,bh);
    hg2.addColorStop(0,'rgba(0,0,0,0.60)');hg2.addColorStop(1,'rgba(0,0,0,0.38)');
    ctx.fillStyle=hg2;ctx.fillRect(0,0,W,bh);
    ctx.strokeStyle=hexA(th.sl,0.35);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,bh);ctx.lineTo(W,bh);ctx.stroke();
    // Score centré
    const fz=cl(bh*0.55|0,11,24);
    drawScore(ctx,`${displayScore}`,W/2,bh/2,th,`bold ${fz*1.2}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`);
    // Left: mode + record
    const modeInfo=MODES[currentMode]||MODES.survie;
    ctx.font=`bold ${fz*0.62}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=modeInfo.color;ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.shadowColor=modeInfo.color;ctx.shadowBlur=4;ctx.fillText(modeInfo.icon+' '+modeInfo.name,8,bh*0.3);ctx.shadowBlur=0;
    ctx.font=`${fz*0.62}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;ctx.fillText(`REC: ${best}`,8,bh*0.72);
    // Right: deux boutons icônes carrés — ⏸ pause | 🔊 son
    const iconSz=cl(bh-4,24,44);
    const soundX=W-(iconSz+2)-4;
    const pauseX=soundX-(iconSz+4)-4;
    const btnY=2;
    _soundRect={x:soundX,y:btnY,w:iconSz,h:iconSz};
    _pauseHudRect={x:pauseX,y:btnY,w:iconSz,h:iconSz};
    // ── Pause button ──
    ctx.save();
    ctx.shadowColor=th.ta;ctx.shadowBlur=5;
    const pbg=ctx.createLinearGradient(pauseX,btnY,pauseX,btnY+iconSz);
    pbg.addColorStop(0,hexA(th.ta,0.50));pbg.addColorStop(1,hexA(th.ta,0.22));
    rrect(ctx,pauseX,btnY,iconSz,iconSz,iconSz/4,pbg,null);
    rp(ctx,pauseX,btnY,iconSz,iconSz,iconSz/4);ctx.strokeStyle=hexA(th.ta,0.65);ctx.lineWidth=1;ctx.stroke();
    ctx.shadowBlur=0;ctx.font=`${iconSz*0.56|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=th.hi||th.tm;ctx.fillText('⏸',pauseX+iconSz/2,btnY+iconSz/2);
    ctx.restore();
    // ── Son button ──
    ctx.save();
    const sOn=_soundEnabled;
    ctx.shadowColor=sOn?'#40D8FF':'#FF6060';ctx.shadowBlur=5;
    const sbg2=ctx.createLinearGradient(soundX,btnY,soundX,btnY+iconSz);
    sbg2.addColorStop(0,sOn?'#1A3A50':'#3A1010');sbg2.addColorStop(1,sOn?'#0A1A26':'#1E0808');
    rrect(ctx,soundX,btnY,iconSz,iconSz,iconSz/4,sbg2,null);
    rp(ctx,soundX,btnY,iconSz,iconSz,iconSz/4);ctx.strokeStyle=hexA(sOn?'#40D8FF':'#FF6060',0.55);ctx.lineWidth=1;ctx.stroke();
    ctx.shadowBlur=0;ctx.font=`${iconSz*0.58|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.fillText(sOn?'🔊':'🔇',soundX+iconSz/2,btnY+iconSz/2);
    ctx.restore();
    // Theme name + combo — calé à gauche des deux boutons
    const rightEdge=pauseX-8;
    ctx.font=`${fz*0.62}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='right';ctx.fillStyle=th.ta;ctx.textBaseline='middle';
    ctx.fillText(THEMES[curTheme].name,rightEdge,bh*0.38);
    if(combo>1){ctx.save();ctx.font=`bold ${fz*0.88}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tm;ctx.shadowColor=th.tm;ctx.shadowBlur=7;ctx.fillText(`×${combo}`,rightEdge,bh*0.72);ctx.restore();}
    let _bonusRow=bh*0.72;
    if(combo>1)_bonusRow=bh*0.52;
    if(doublePointsUntil>Date.now()){const rem=Math.ceil((doublePointsUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${fz*0.65}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#30FFAA';ctx.shadowColor='#00FFB0';ctx.shadowBlur=5;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(`×2 ${rem}s`,rightEdge,_bonusRow);ctx.shadowBlur=0;ctx.restore();_bonusRow=bh*(combo>1?0.92:0.72);}
    if(_enduranceBonusUntil>Date.now()){const erem=Math.ceil((_enduranceBonusUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${fz*0.65}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#60FFD0';ctx.shadowColor='#40EAB0';ctx.shadowBlur=5;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(`🏅×1.5 ${erem}s`,rightEdge,_bonusRow);ctx.shadowBlur=0;ctx.restore();}
    ctx.textAlign='left';ctx.textBaseline='alphabetic';
  }else{
    const hx=GRID_X+GW+8,hw=W-hx-5;
    const hg3=ctx.createLinearGradient(hx,GRID_Y,hx,GRID_Y+GH);
    hg3.addColorStop(0,hexA(th.gbg,0.72));hg3.addColorStop(1,hexA(th.bg,0.55));
    rrect(ctx,hx-3,GRID_Y,hw+3,GH,8,hg3,hexA(th.dc,0.45),1);
    let cy=GRID_Y+12;const fz=cl(hw*0.14|0,8,18);
    ctx.font=`${fz*0.72}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;ctx.textBaseline='top';ctx.fillText('SCORE',hx,cy);cy+=fz*0.85;
    drawScore(ctx,`${displayScore}`,hx+hw/2,cy+fz*0.7,th,`bold ${fz*1.35}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`);cy+=fz*1.65;
    ctx.font=`${fz*0.72}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;ctx.textBaseline='top';ctx.fillText(`REC: ${best}`,hx,cy);cy+=fz;
    ctx.fillText(`Pièces: ${placed}`,hx,cy);cy+=fz*1.2;
    if(combo>1){ctx.save();ctx.font=`bold ${fz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tm;ctx.shadowColor=th.tm;ctx.shadowBlur=7;ctx.fillText(`★ ×${combo}`,hx,cy);ctx.restore();cy+=fz*1.2;}
    ctx.font=`${fz*0.72}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tg;ctx.fillText(THEMES[curTheme].name,hx,cy);cy+=fz;
    if(doublePointsUntil>Date.now()){const rem=Math.ceil((doublePointsUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${fz*0.72}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#30FFAA';ctx.shadowColor='#00FFB0';ctx.shadowBlur=4;ctx.fillText(`×2 ${rem}s`,hx,cy);ctx.shadowBlur=0;ctx.restore();cy+=fz;}
    if(_enduranceBonusUntil>Date.now()){const erem=Math.ceil((_enduranceBonusUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${fz*0.72}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#60FFD0';ctx.shadowColor='#40EAB0';ctx.shadowBlur=4;ctx.fillText(`🏅×1.5 ${erem}s`,hx,cy);ctx.shadowBlur=0;ctx.restore();}
    ctx.textBaseline='alphabetic';
  }
}

