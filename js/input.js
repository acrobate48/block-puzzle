'use strict';
// ─── INPUT ───────────────────────────────────────────────────────────────────
// Fix A: Minimum drag distance (px) before a pointer-move is treated as a drag.
// Prevents finger trembles from accidentally shifting the ghost piece.
const _DRAG_THRESHOLD = 8;
// Fix D: Debounce for game-state-changing HUD buttons (ms).
// Prevents accidental double-fires when a user taps a button quickly twice.
let _lastTapT = 0;
const _TAP_DEBOUNCE = 300;

function getPos(e){if(e.touches&&e.touches.length>0)return{x:e.touches[0].clientX,y:e.touches[0].clientY};if(e.changedTouches&&e.changedTouches.length>0)return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};return{x:e.clientX,y:e.clientY};}
function onDown(e){e.preventDefault();const{x,y}=getPos(e);mouseX=x;mouseY=y;_tapStartX=x;_tapStartY=y;
  if(gameState==='menu'){handleMenuTap(x,y);return;}
  if(gameState==='modeselect'){handleModeSelectTap(x,y);return;}
  if(gameState==='pause'){return;}
  if(gameState==='leaderboard'){if(_backLbRect&&x>=_backLbRect.x&&x<_backLbRect.x+_backLbRect.w&&y>=_backLbRect.y&&y<_backLbRect.y+_backLbRect.h){gameState='menu';}return;}
  if(gameState==='gameover'){
    if(_goReplayRect&&x>=_goReplayRect.x&&x<_goReplayRect.x+_goReplayRect.w&&y>=_goReplayRect.y&&y<_goReplayRect.y+_goReplayRect.h){if(typeof stopGameoverVideo==='function')stopGameoverVideo(curTheme);_goVideoStarted=false;resetGame();gameState='playing';return;}
    if(_goMenuRect&&x>=_goMenuRect.x&&x<_goMenuRect.x+_goMenuRect.w&&y>=_goMenuRect.y&&y<_goMenuRect.y+_goMenuRect.h){gameState='menu';return;}
    if(Date.now()-overT>1200)gameState='menu';return;}
  // Block tray drag only when in choix PICKING phase; all other modes allow normal drag
  const _inChoixPick=(currentMode==='choix'||_getHistoireSubMode()==='choix')&&choixState==='picking';
  if(gameState==='playing'&&!over&&!showSecondChance&&!showBonusPicker&&!_inChoixPick){const pw=GW/3;for(let i=0;i<3;i++){if(x>=GRID_X+i*pw&&x<GRID_X+(i+1)*pw&&y>=TRAY_Y&&y<TRAY_Y+TRAY_H&&tray[i]){drag={idx:i};
    // Pickup ripple + dust burst from tray slot
    const _pcx=GRID_X+(i+0.5)*pw,_pcy=TRAY_Y+TRAY_H/2;
    ripples.push({x:_pcx,y:_pcy,life:16,ml:16,maxR:CELL*1.1,color:tray[i].color});
    for(let _dp=0;_dp<6;_dp++){const _da=_dp/6*Math.PI*2;particles.push({x:_pcx,y:_pcy,vx:Math.cos(_da)*rnd(0.8,2.2),vy:Math.sin(_da)*rnd(0.8,2.2)-0.5,color:tray[i].color,size:rnd(1.5,3),life:rnd(12,22),ml:22,circle:true});}
    break;}}}}
function onMove(e){e.preventDefault();const{x,y}=getPos(e);
  // Fix A: Only commit the new pointer position (and let the ghost piece follow)
  // once the finger has moved beyond the dead-zone threshold.  Until then we
  // keep mouseX/mouseY at the tap origin so the piece doesn't jitter.
  if(drag){
    const _dist=Math.sqrt((x-_tapStartX)**2+(y-_tapStartY)**2);
    if(_dist<_DRAG_THRESHOLD)return;
  }
  mouseX=x;mouseY=y;
  if(gameState==='pause'&&_volumeSliderRect){
    const{x:vx,y:vy,w:vw,h:vh}=_volumeSliderRect;
    if(mouseY>=vy-14&&mouseY<=vy+vh+14){
      _volume=cl((mouseX-vx)/vw,0,1);
      try{localStorage.setItem('bp_volume',String(_volume));}catch(e){}
    }
  }
}
function shuffleArr(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}}

function onUp(e){
  e.preventDefault();const{x,y}=getPos(e);mouseX=x;mouseY=y;
  // Pause overlay
  if(gameState==='pause'){handlePauseTap(x,y);return;}
  // Fix D: Debounce guard — ignore HUD button taps that arrive within
  // _TAP_DEBOUNCE ms of the previous one.  Drag-release placement is exempt
  // (checked later after this block) so normal gameplay is unaffected.
  const _nowTap=Date.now();
  const _hudBtnHit=(
    (gameState==='playing'&&_pauseHudRect&&x>=_pauseHudRect.x&&x<_pauseHudRect.x+_pauseHudRect.w&&y>=_pauseHudRect.y&&y<_pauseHudRect.y+_pauseHudRect.h)||
    (gameState==='playing'&&_soundRect&&x>=_soundRect.x&&x<_soundRect.x+_soundRect.w&&y>=_soundRect.y&&y<_soundRect.y+_soundRect.h)||
    (gameState==='playing'&&!over&&_undoHudRect&&x>=_undoHudRect.x&&x<_undoHudRect.x+_undoHudRect.w&&y>=_undoHudRect.y&&y<_undoHudRect.y+_undoHudRect.h)||
    (gameState==='playing'&&!over&&_restartHudRect&&x>=_restartHudRect.x&&x<_restartHudRect.x+_restartHudRect.w&&y>=_restartHudRect.y&&y<_restartHudRect.y+_restartHudRect.h)
  );
  if(_hudBtnHit&&(_nowTap-_lastTapT)<_TAP_DEBOUNCE){drag=null;return;}
  if(_hudBtnHit)_lastTapT=_nowTap;
  // Pause HUD button
  if(gameState==='playing'&&_pauseHudRect&&x>=_pauseHudRect.x&&x<_pauseHudRect.x+_pauseHudRect.w&&y>=_pauseHudRect.y&&y<_pauseHudRect.y+_pauseHudRect.h){
    if(typeof _addUiRipple==='function')_addUiRipple(_pauseHudRect.x+_pauseHudRect.w/2,_pauseHudRect.y+_pauseHudRect.h/2,THEMES[curTheme]?.ta||'#FFFFFF',_pauseHudRect.w);
    gameState='pause';_pauseStartTime=Date.now();return;}
  // Sound toggle (in-game bar only — menu has its own handler in handleMenuTap)
  if(gameState==='playing'&&_soundRect&&x>=_soundRect.x&&x<_soundRect.x+_soundRect.w&&y>=_soundRect.y&&y<_soundRect.y+_soundRect.h){
    if(typeof _addUiRipple==='function')_addUiRipple(_soundRect.x+_soundRect.w/2,_soundRect.y+_soundRect.h/2,_soundEnabled?'#FF6060':'#40D8FF',_soundRect.w);
    _soundEnabled=!_soundEnabled;return;}
  // ── MODE taps ──
  if(gameState==='playing'){
    const subMode=_getHistoireSubMode();
    const eMode=currentMode==='histoire'?subMode:currentMode;
    // Choix: pick a piece from overlay
    if(eMode==='choix'&&choixState==='picking'){
      for(let i=0;i<choixOptionRects.length;i++){
        const r=choixOptionRects[i];
        if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h){
          tray[0]=choixOptions[i];tray[1]=null;tray[2]=null;
          choixState='placing';return;
        }
      }
      return; // tap outside overlay → ignore
    }
    // (Choix tray refresh is handled in the placement block below)
    // Histoire: tap "niveau suivant" button
    if(currentMode==='histoire'&&histoireGoalMet&&histoireNextRect){
      const r=histoireNextRect;
      if(x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h){
        const isLast=histoireLevel>=HISTOIRE_LEVELS.length-1;
        if(isLast){
          // Histoire complétée — écran félicitations puis retour menu
          histoireLevel=0;
          try{localStorage.setItem('bp_histoire','0');}catch(e2){}
          screenFlash=255;screenFlashCol='#FFD700';
          floats.push(new FloatText('🏆 HISTOIRE COMPLÈTE !',W/2,H*0.35,'#FFD700',2.0,220));
          floats.push(new FloatText('Félicitations ! Toutes les épreuves réussies.',W/2,H*0.50,'#FFFFFF',1.1,220));
          floats.push(new FloatText('🎉',W/2,H*0.65,'#FFD700',2.5,220));
          setTimeout(()=>{gameState='menu';},4000);return;
        }
        histoireLevel=histoireLevel+1;
        try{localStorage.setItem('bp_histoire',String(histoireLevel));}catch(e2){}
        resetGame();return;
      }
    }
  }
  // ── Undo last placement ──────────────────────────────────────────────────────
  if(gameState==='playing'&&!over&&_undoHudRect&&x>=_undoHudRect.x&&x<_undoHudRect.x+_undoHudRect.w&&y>=_undoHudRect.y&&y<_undoHudRect.y+_undoHudRect.h){
    if(typeof _addUiRipple==='function')_addUiRipple(_undoHudRect.x+_undoHudRect.w/2,_undoHudRect.y+_undoHudRect.h/2,'#60D0FF',_undoHudRect.w*0.6);
    if(_undoCount>0&&placeHistory.length>0){
      const last=placeHistory.pop();
      last.cells.forEach(({r,c})=>{grid[r][c]=null;gridStars[r][c]=false;gridBonus[r][c]=null;});
      parasites=parasites.filter(p=>!last.cells.some(cl=>cl.r===p.r&&cl.c===p.c));
      // Restore piece to the slot it came from (or first empty slot)
      const slot=(last.trayIdx!==undefined&&!tray[last.trayIdx])?last.trayIdx:(!tray[0]?0:!tray[1]?1:!tray[2]?2:-1);
      if(slot>=0&&last.piece)tray[slot]=last.piece;
      placed=Math.max(0,placed-1);_undoCount--;_placementStreak=0;
      floats.push(new FloatText(`↩ ANNULÉ (${_undoCount} restant${_undoCount!==1?'s':''})`,W/2,H*0.45,'#60D0FF',1.1,100));
      screenFlash=80;screenFlashCol='#60D0FF';sndBonus();
    }else if(_undoCount<=0){
      floats.push(new FloatText("❌ Plus d'annulations !",W/2,H*0.45,'#FF6060',0.9,80));
    }
    drag=null;return;
  }
  // ── Quick restart ─────────────────────────────────────────────────────────────
  if(gameState==='playing'&&!over&&_restartHudRect&&x>=_restartHudRect.x&&x<_restartHudRect.x+_restartHudRect.w&&y>=_restartHudRect.y&&y<_restartHudRect.y+_restartHudRect.h){
    if(typeof _addUiRipple==='function')_addUiRipple(_restartHudRect.x+_restartHudRect.w/2,_restartHudRect.y+_restartHudRect.h/2,'#FF8040',_restartHudRect.w*0.6);
    if(score>best){best=score;try{localStorage.setItem('blockpuzzle_best',String(best));}catch(e2){}}
    resetGame();drag=null;return;
  }
  // Second chance buttons
  if(showSecondChance){
    const ob=secondChanceBtns.oui,nb=secondChanceBtns.non;
    if(ob&&x>=ob.x&&x<ob.x+ob.w&&y>=ob.y&&y<ob.y+ob.h){
      // Remove last up to 5 placed cells still on the grid
      const toUndo=placeHistory.splice(-5);
      toUndo.reverse().forEach(entry=>{
        entry.cells.forEach(({r,c})=>{
          grid[r][c]=null;gridStars[r][c]=false;gridBonus[r][c]=null;
        });
        // remove any parasites from those cells
        parasites=parasites.filter(p=>!entry.cells.some(cl=>cl.r===p.r&&cl.c===p.c));
      });
      // Refresh tray with 3–5 new pieces
      tray=newTray();
      showSecondChance=false;secondChanceUsed=true;combo=0;drag=null;
      screenFlash=160;screenFlashCol='#40FF80';
      floats.push(new FloatText('SECONDE CHANCE !',W/2,H/2,'#40FF80',1.4,120));
      return;
    }
    if(nb&&x>=nb.x&&x<nb.x+nb.w&&y>=nb.y&&y<nb.y+nb.h){
      showSecondChance=false;secondChanceUsed=true;
      over=true;overT=Date.now();
      if(score>best){best=score;try{localStorage.setItem('blockpuzzle_best',String(best));}catch(e2){}}
      scoreHistory.push(score);scoreHistory.sort((a,b)=>b-a);scoreHistory=scoreHistory.slice(0,5);
      try{localStorage.setItem('bp_scores',JSON.stringify(scoreHistory));}catch(e2){}
      try{localStorage.removeItem('bp_save');}catch(e2){}hasSave=false;
      _triggerScoreSubmit(score);
      sndGameOver();
      setTimeout(()=>{gameState='gameover';},2000);drag=null;return;
    }
    drag=null;return;
  }
  // Bonus picker overlay
  if(showBonusPicker){
    // Check if a piece was picked
    let picked=false;
    for(let i=0;i<bonusPickerRects.length;i++){
      const br2=bonusPickerRects[i];
      if(x>=br2.x&&x<br2.x+br2.w&&y>=br2.y&&y<br2.y+br2.h){
        const chosen=bonusPickerPieces[br2.idx];
        // Fill first empty slot (there is always one since bonus triggers right after placing)
        let placed2=false;
        for(let s=0;s<tray.length;s++){if(!tray[s]){tray[s]=chosen;placed2=true;break;}}
        if(!placed2){tray[0]=chosen;}
        showBonusPicker=false;bonusPickerPieces=[];bonusPickerRects=[];
        drag=null;picked=true;break;
      }
    }
    if(!picked){
      // Tapped outside panel — dismiss
      const pw3=Math.min(W-20,400),ph3=Math.round(H*0.38);
      const px3=(W-pw3)/2,py3=(H-ph3)/2;
      if(x<px3||x>px3+pw3||y<py3||y>py3+ph3){
        showBonusPicker=false;bonusPickerPieces=[];bonusPickerRects=[];
      }
    }
    drag=null;return;
  }
  // Bonus banner click — open picker
  if(showAddCellsBonus&&addCellsBonusRect){
    const br=addCellsBonusRect;
    if(x>=br.x&&x<br.x+br.w&&y>=br.y&&y<br.y+br.h){
      bonusPickerPieces=Array.from({length:5},()=>newPiece());
      showBonusPicker=true;showAddCellsBonus=false;addCellsBonusRect=null;
      sndBonus();
      drag=null;return;
    }
  }
  if(drag&&gameState==='playing'&&!over&&!showSecondChance){
    const piece=tray[drag.idx];
    // Short tap (minimal finger movement) → rotate piece 90° clockwise
    if(piece&&Math.hypot(x-_tapStartX,y-_tapStartY)<CELL*0.45){
      tray[drag.idx]={...piece,shape:rotateShape(piece.shape)};
      drag=null;return;
    }
    if(piece){const{gr,gc}=snapPos(x,y,piece.shape);if(_modeCanPlace(grid,piece.shape,gr,gc)){
      placePiece(grid,piece.shape,piece.color,gr,gc);
      sndPlace();
      // Placement impact — spring shake + expanding ripple ring
      shake=Math.max(shake,3+Math.min(combo,3));shakePow=Math.max(shakePow,1.5+Math.min(combo,2)*0.5);
      const _rcx=GRID_X+(gc+piece.shape[0].length*0.5)*CELL,_rcy=GRID_Y+(gr+piece.shape.length*0.5)*CELL;
      ripples.push({x:_rcx,y:_rcy,life:32,ml:32,maxR:CELL*(1.4+piece.shape.flat().filter(Boolean).length*0.09),color:piece.color});
      // Impact dust puff — tiny particles bursting outward from each placed cell edge
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){
        const _ix=GRID_X+(gc+cc+0.5)*CELL,_iy=GRID_Y+(gr+rr+0.5)*CELL;
        for(let _d=0;_d<5;_d++){
          const _da=rnd(0,Math.PI*2);
          const _spd=rnd(1.2,3.5);
          particles.push({x:_ix,y:_iy,vx:Math.cos(_da)*_spd,vy:Math.sin(_da)*_spd-0.8,color:piece.color,size:rnd(1,2.5),life:rnd(10,18),ml:18,circle:true});
        }
      }}));
      // ── Speed mechanic ───────────────────────────────────────────────────
      const now2=Date.now();
      const thinkMs=lastPlaceTime>0?now2-lastPlaceTime:4000;
      lastPlaceTime=now2;
      // Chrono: reset timer on successful placement
      if(_getHistoireSubMode()==='chrono'||currentMode==='chrono'){chronoTimeLeft=chronoMaxTime;chronoLastTick=now2;}
      let speedMul=1.0,speedLabel=null,speedCol='#FFFFFF';
      if(thinkMs<SPEED_TURBO){
        if(typeof _unlockAchieve==='function')_unlockAchieve(3); // Achievement #4 — turbo
        _turboStreak++;speedMul=1.8;speedCol='#FF4020';
        if(_turboStreak>=5){speedLabel=`⚡⚡ TURBO STREAK ×${_turboStreak}`;speedMul=2.5;}
        else if(_turboStreak>=3){speedLabel=`⚡ STREAK ×${_turboStreak}`;speedMul=2.0;}
        else{speedLabel='⚡ TURBO ×1.8';}
      }else if(thinkMs<SPEED_FAST){_turboStreak=0;speedMul=1.3;speedLabel='⚡ RAPIDE ×1.3';speedCol='#FFA020';}
      else if(thinkMs>=SPEED_SLOW){_turboStreak=0;speedMul=0.8;speedLabel='🐢 LENT ×0.8';speedCol='#88AAFF';}
      else{_turboStreak=0;}
      // ── Pop anim + stars/bonus assignment per cell ────────────────────────
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const ri=gr+rr,ci=gc+cc;placedCellsMap.set(ri*100+ci,0);
        if(piece.isParasite){
          parasites.push({r:ri,c:ci,born:now2,lastTick:now2});
          gridStars[ri][ci]=false;gridBonus[ri][ci]=null;
        }else{
          const rn=Math.random();gridStars[ri][ci]=rn<0.15;
          if(!gridStars[ri][ci]){const rn2=Math.random();gridBonus[ri][ci]=rn2<0.05?'bomb':rn2<0.09?'x2':null;}else gridBonus[ri][ci]=null;
        }
      }}));
      // ── Record in place history (for second chance undo) ─────────────────
      {
        const hCells=[];
        piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)hCells.push({r:gr+rr,c:gc+cc,color:piece.color});}));
        placeHistory.push({cells:hCells,piece:{shape:piece.shape,color:piece.color},trayIdx:drag.idx});
        if(placeHistory.length>5)placeHistory.shift();
      }
      // Petites particules de placement + impact flash ripple
      {const pcells2=[];piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)pcells2.push({r:gr+rr,c:gc+cc});}));spawnParticles(pcells2,2,0.45,[piece.color]);
      // Impact flash: single white ripple from piece centroid
      const _icx=GRID_X+(gc+piece.shape[0].length/2)*CELL,_icy=GRID_Y+(gr+piece.shape.length/2)*CELL;
      ripples.push({x:_icx,y:_icy,life:20,ml:20,maxR:CELL*(0.8+piece.shape[0].length*0.3),color:'#FFFFFF'});
      ripples.push({x:_icx,y:_icy,life:14,ml:14,maxR:CELL*(0.5+piece.shape[0].length*0.2),color:piece.color});
      // Landing column flash
      if(typeof _addLandingFlash==='function'){const _lcols=new Set();piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)_lcols.add(gc+cc);}));_addLandingFlash([..._lcols],piece.color);}}
      tray[drag.idx]=null;placed++;
      // Fresh cell halos
      if(typeof _addFreshCell==='function')piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)_addFreshCell(gr+rr,gc+cc,piece.color);}));
      // Achievement #1 (first block) + #10 (200 blocks)
      if(typeof _unlockAchieve==='function'){_totalBlocksPlaced++;if(_totalBlocksPlaced===1)_unlockAchieve(0);if(_totalBlocksPlaced>=200)_unlockAchieve(9);}
      showAddCellsBonus=false;addCellsBonusTimer--;
      if(addCellsBonusTimer<=0){showAddCellsBonus=true;addCellsBonusTimer=Math.floor(rnd(8,15));}
      const ti=getCurTheme(),{n,cells,colors}=clearLines(grid);
      if(n>0){
        sndClear(n);
        if(typeof playEventVideo==='function')playEventVideo('line_clear',false);
        totalLinesCleared+=n;
        // Achievement #3 — 10 lines cleared
        if(typeof _unlockAchieve==='function'&&totalLinesCleared>=10)_unlockAchieve(2);
        // Animation sweep
        clearAnims.push({cells:[...cells],born:Date.now(),color:THEMES[ti].tm});
        // ── CINEMATIC SHATTER — shockwave rings + directional debris ────────────
        {const _cCx=cells.reduce((s,{c})=>s+c,0)/cells.length;
        const _cCy=cells.reduce((s,{r})=>s+r,0)/cells.length;
        const _cPx=GRID_X+(_cCx+0.5)*CELL,_cPy=GRID_Y+(_cCy+0.5)*CELL;
        const _maxR=Math.max(GW,GH)*0.9;
        ripples.push({x:_cPx,y:_cPy,life:55,ml:55,maxR:_maxR,color:THEMES[ti].tm});
        ripples.push({x:_cPx,y:_cPy,life:40,ml:40,maxR:_maxR*0.6,color:'#FFFFFF'});
        if(n>=2)ripples.push({x:_cPx,y:_cPy,life:28,ml:28,maxR:_maxR*0.38,color:THEMES[ti].ta||THEMES[ti].hi||'#FFFF80'});
        // Directional shards fly outward from centroid
        cells.forEach(({r,c})=>{
          const cx2=GRID_X+(c+0.5)*CELL,cy2=GRID_Y+(r+0.5)*CELL;
          const dx=cx2-_cPx,dy=cy2-_cPy;
          const dist=Math.sqrt(dx*dx+dy*dy)||1;
          const ndx=dx/dist,ndy=dy/dist;
          const col=(colors&&colors[r*100+c])||THEMES[ti].tm;
          const ns=3+Math.floor(Math.random()*3);
          for(let si=0;si<ns;si++){
            const spd=rnd(3,7+n);const spr=rnd(-0.8,0.8);
            particles.push({x:cx2+rnd(-CELL*0.3,CELL*0.3),y:cy2+rnd(-CELL*0.3,CELL*0.3),
              vx:ndx*spd+spr,vy:ndy*spd+spr-2.8,
              color:col,size:rnd(1.8,4.5),life:rnd(28,48)|0,ml:48,circle:Math.random()>0.4});
          }
          // Two directional square shards per cell
          for(let di=0;di<2;di++){const d=new Debris(cx2+rnd(-CELL*0.25,CELL*0.25),cy2+rnd(-CELL*0.25,CELL*0.25),col,ti);d.vx=ndx*rnd(2,5+n)+rnd(-1,1);d.vy=ndy*rnd(1.5,4)-rnd(1,3.5);d.circ=false;debris.push(d);}
        });}
        let starPts=0;const bombList=[];let hasX2=false;
        // Kill parasites in cleared lines
        const clearedSet=new Set(cells.map(({r,c})=>r*100+c));
        const pBefore=parasites.length;
        parasites=parasites.filter(p=>!clearedSet.has(p.r*100+p.c));
        if(parasites.length<pBefore)floats.push(new FloatText('☠ PARASITE ÉLIMINÉ',GRID_X+GW/2,GRID_Y+GH*0.4,'#00FF80',1.0,90));
        cells.forEach(({r,c})=>{if(gridStars[r][c])starPts+=25;if(gridBonus[r][c]==='bomb')bombList.push({r,c});if(gridBonus[r][c]==='x2')hasX2=true;gridStars[r][c]=false;gridBonus[r][c]=null;});
        const bombKilled=[];
        bombList.forEach(({r,c})=>{for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const br=r+dr,bc=c+dc;if(br>=0&&br<ROWS&&bc>=0&&bc<COLS&&grid[br][bc]){bombKilled.push({r:br,c:bc});grid[br][bc]=null;gridStars[br][bc]=false;gridBonus[br][bc]=null;}}});
        if(bombKilled.length>0){
          spawnParticles(bombKilled,10,2.5,['#FF6020','#FFA020','#FF2010','#FFFF60']);
          // Extra debris shards from bomb
          const _bClC={};bombKilled.forEach(({r,c})=>{_bClC[r*100+c]='#FF4010';});spawnDebris(_bClC,0,5);
          // Shockwave ripple from blast center
          const _bCx=bombKilled.reduce((s,{c})=>s+c,0)/bombKilled.length,_bCy=bombKilled.reduce((s,{r})=>s+r,0)/bombKilled.length;
          ripples.push({x:GRID_X+(_bCx+0.5)*CELL,y:GRID_Y+(_bCy+0.5)*CELL,life:45,ml:45,maxR:CELL*4.5,color:'#FF8020'});
          ripples.push({x:GRID_X+(_bCx+0.5)*CELL,y:GRID_Y+(_bCy+0.5)*CELL,life:35,ml:35,maxR:CELL*3,color:'#FFFFFF'});
          shake=Math.max(shake,14);shakePow=Math.max(shakePow,6);screenFlash=Math.min(255,screenFlash+120);screenFlashCol='#FF4010';
        }
        if(hasX2)doublePointsUntil=Date.now()+60000;
        combo++;
        // Achievement #2 (combo×3) + #9 (combo×5)
        if(typeof _unlockAchieve==='function'){if(combo>=3)_unlockAchieve(1);if(combo>=5)_unlockAchieve(8);}
        if(combo>bestCombo){bestCombo=combo;try{localStorage.setItem('bp_bestcombo',String(bestCombo));}catch(e2){}}
        maxComboGame=Math.max(maxComboGame,combo);
        if(combo>=2){sndCombo(combo);
          // Sparkle burst — star-shaped particles scatter across grid on combos
          const _sk=Math.min(combo*5,24);
          for(let _si=0;_si<_sk;_si++){const _sa=rnd(0,Math.PI*2),_ss=rnd(2.5,6+combo*0.4);
            particles.push({x:GRID_X+rnd(CELL*0.5,GW-CELL*0.5),y:GRID_Y+rnd(CELL*0.5,GH-CELL*0.5),vx:Math.cos(_sa)*_ss*0.5,vy:Math.sin(_sa)*_ss*0.5-1.8,color:rndc(['#FFD700','#FF80FF','#80FFFF','#FF6060','#FFFFFF']),life:(36+rnd(0,22))|0,ml:60,size:rnd(1.8,3.8),circle:true});}
        }
        let pts=Math.round(n===1?100*(1+(combo-1)*0.5):n===2?350*(1+(combo-1)*0.5):n*165*(1+(combo-1)*0.5));
        pts+=starPts;
        pts=Math.round(pts*speedMul);
        if(Date.now()<doublePointsUntil)pts=pts*2;
        if(Date.now()<_enduranceBonusUntil)pts=Math.round(pts*1.5);
        score+=pts;
        // Milestones
        while(_nextMilestoneIdx<_MILESTONES.length&&score>=_MILESTONES[_nextMilestoneIdx]){
          const mv=_MILESTONES[_nextMilestoneIdx];_nextMilestoneIdx++;
          const mlabel=mv>=1000?`${mv/1000}K`:`${mv}`;
          floats.push(new FloatText(`🎯 ${mlabel} POINTS !`,W/2,H*0.42,THEMES[getCurTheme()].hi||'#FFD700',1.6,150));
          screenFlash=Math.max(screenFlash,160);shake=Math.max(shake,10);shakePow=Math.max(shakePow,4);
        }
        // Nouveau record
        if(!_newBestTriggered&&score>best){_newBestTriggered=true;best=score;try{localStorage.setItem('blockpuzzle_best',String(best));}catch(e2){}
          screenFlash=255;screenFlashCol='#FFD700';shake=Math.max(shake,16);shakePow=Math.max(shakePow,7);
          floats.push(new FloatText('🏆 NOUVEAU RECORD !',W/2,H*0.38,'#FFD700',2.0,180));
          spawnParticles(Array.from({length:12},(_,i)=>({r:rndI(0,ROWS-1),c:i})),5,2,['#FFD700','#FFF0A0','#FFA500']);}
        spawnParticles(cells,6,1.2,THEMES[ti].pc);spawnDebris(colors,ti,8);
      // Combo energy beam
      if(combo>=3&&typeof _triggerComboBeam==='function'){const _bcx=GRID_X+(gc+piece.shape[0].length/2)*CELL,_bcy=GRID_Y+(gr+piece.shape.length/2)*CELL;_triggerComboBeam(_bcx,_bcy);}
        if(n>=2){shake=Math.max(shake,10);shakePow=Math.max(shakePow,3+(n>=3?4:0));}
        screenFlash=Math.max(screenFlash,80+(n>=3?120:0));screenFlashCol=THEMES[ti].tm;
        const miny=Math.min(...cells.map(c=>c.r));
        floats.push(new FloatText(n>=3?`★ +${pts} ★`:`+${pts}`,GRID_X+GW/2,GRID_Y+miny*CELL,THEMES[ti].tm));
        if(n>=4){floats.push(new FloatText('★★★★ QUADRUPLE !',W/2,H*0.36,'#FF40FF',2.2,170));shake=Math.max(shake,18);shakePow=Math.max(shakePow,8);}
        else if(n===3){floats.push(new FloatText('★★★ TRIPLE !',W/2,H*0.36,'#FFD700',1.9,150));shake=Math.max(shake,14);shakePow=Math.max(shakePow,6);}
        else if(n===2){floats.push(new FloatText('★★ DOUBLE !',GRID_X+GW/2,GRID_Y+GH*0.28,'#FF8800',1.5,120));}
        if(n>=2){const cn=Math.min(n,4);floats.push(new FloatText(`COMBO ×${cn} POINT`,GRID_X+GW/2,GRID_Y+GH/2,THEMES[ti].hi||'#FFD700',1.6,110));}
        if(starPts>0)floats.push(new FloatText(`★+${starPts}`,GRID_X+GW/2,GRID_Y+miny*CELL-CELL*1.5,THEMES[ti].hi||'#FFE030',1.2,90));
        if(hasX2)floats.push(new FloatText('×2 POINTS 60s',GRID_X+GW/2,GRID_Y+GH*0.35,'#30FFAA',1.1,100));
        const newTh=getCurTheme();if(newTh!==curTheme){curTheme=newTh;gameBg=buildBg(curTheme);gameFx=initFx(curTheme);screenFlash=200;screenFlashCol=THEMES[newTh].tm;floats.push(new FloatText(`🎨 ${THEMES[curTheme].name}`,W/2,H*0.45,THEMES[curTheme].tm,1.3,120));}
        // ── Perfect Clear bonus — entire board emptied ────────────────────────
        if(grid.every(row=>row.every(v=>!v||v==='__BLOCKED__'))){
          if(typeof _unlockAchieve==='function')_unlockAchieve(4); // Achievement #5 — perfect clear
          const pcPts=500;score+=pcPts;
          screenFlash=255;screenFlashCol='#FFD700';shake=Math.max(shake,22);shakePow=Math.max(shakePow,10);
          floats.push(new FloatText('💥 PERFECT CLEAR !',W/2,H*0.30,'#FFD700',2.4,260));
          floats.push(new FloatText(`+${pcPts} BONUS`,GRID_X+GW/2,GRID_Y+GH*0.4,'#FFF0A0',1.7,210));
          spawnParticles(Array.from({length:8},()=>({r:rndI(0,9),c:rndI(0,9)})),8,2.0,['#FFD700','#FFF0A0','#FF8040','#FF40D0','#40FFFF']);
          sndClear4();
        }
        // ── Streak: consecutive line-clearing placements ──────────────────────
        _placementStreak++;
        if(_placementStreak>=3){
          const streakBonus=Math.round(pts*0.1*(_placementStreak-2));
          if(streakBonus>0){score+=streakBonus;floats.push(new FloatText(`🔥 STREAK ×${_placementStreak} +${streakBonus}`,GRID_X+GW/2,GRID_Y+GH*0.12,THEMES[ti].hi||THEMES[ti].tm,0.88,72));}
        }
      }else{combo=0;_placementStreak=0;}
      // Speed float (show regardless of line clear)
      if(speedLabel)floats.push(new FloatText(speedLabel,GRID_X+GW/2,GRID_Y+GH*0.25,speedCol,0.85,70));
      const subM=_getHistoireSubMode();const eM=currentMode==='histoire'?subM:currentMode;
      if(tray.every(p=>p===null)&&eM!=='choix'){tray=nextTrayPreview||newTray();nextTrayPreview=newTray();trayRefreshT=Date.now();
        // Tray refresh burst — sparkles from each new piece slot
        tray.forEach((p,pi)=>{if(!p)return;const pw4=GW/3;const _tx=GRID_X+pi*pw4+pw4/2,_ty=TRAY_Y+TRAY_H/2;
          for(let _si=0;_si<6;_si++){const _sa=_si/6*Math.PI*2;particles.push({x:_tx,y:_ty,vx:Math.cos(_sa)*rnd(1.5,3.5),vy:Math.sin(_sa)*rnd(1.5,3.5)-0.8,color:p.color,size:rnd(2,4),life:rnd(20,40),ml:40,circle:true});}
          ripples.push({x:_tx,y:_ty,life:18,ml:18,maxR:pw4*0.55,color:p.color});});}

      if(tray.every(p=>p===null)&&eM==='choix'){_generateChoixOptions();}
      // Sauvegarde automatique
      try{localStorage.setItem('bp_save',JSON.stringify({v:1,grid,score,placed,combo,curTheme,gridStars,gridBonus,tray:tray.map(p=>p?{shape:p.shape,color:p.color,isParasite:!!p.isParasite}:null),ntp:nextTrayPreview?nextTrayPreview.map(p=>p?{shape:p.shape,color:p.color}:null):null,gameStartTime,totalLinesCleared,maxComboGame}));}catch(e2){}
      hasSave=true;
      // For choix mode use choixOptions as the validity check (tray is empty between picks)
      const _validCheck=eM==='choix'?choixOptions:tray;
      if(_validCheck.length>0&&!anyValid(grid,_validCheck)){
        const _eM_zen=currentMode==='histoire'?_getHistoireSubMode():currentMode;
        if(_eM_zen==='zen'){
          // Zen: no game over — clear 2 bottom-most filled rows instead
          _zenClearRows();
          tray=newTray();
        }else{
          if(score>best){best=score;try{localStorage.setItem('blockpuzzle_best',String(best));}catch(e2){}}
          scoreHistory.push(score);scoreHistory.sort((a,b)=>b-a);scoreHistory=scoreHistory.slice(0,5);
          try{localStorage.setItem('bp_scores',JSON.stringify(scoreHistory));}catch(e2){}
          if(_eM_zen!=='zen'&&!secondChanceUsed){showSecondChance=true;}
          else{
            over=true;overT=Date.now();
            try{localStorage.removeItem('bp_save');}catch(e2){}hasSave=false;
            _triggerScoreSubmit(score);
            sndGameOver();
            setTimeout(()=>{gameState='gameover';},2000);
          }
        }
      }
    }}
    drag=null;if(typeof _ghostTrail!=='undefined')_ghostTrail.length=0;
  }
}
function handleMenuTap(x,y){
  layoutMenu();
  for(let i=0;i<skinRects.length;i++){const{x:rx,y:ry,w,h}=skinRects[i];if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){selSkin=i;if(typeof _addMenuRipple==='function')_addMenuRipple(rx+w/2,ry+h/2,COLORS[i%COLORS.length],Math.max(w,h)*1.4);return;}}
  for(let i=0;i<themeRects.length;i++){const{x:rx,y:ry,w,h}=themeRects[i];if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){selTheme=i;menuBg=buildBg(i);menuFx=initFx(i);
    if(typeof _addMenuRipple==='function'){
      _addMenuRipple(rx+w/2,ry+h/2,THEMES[i].tm,Math.max(w,h)*1.6);
      // Burst 8 particles in theme color from card center
      for(let _bp=0;_bp<8;_bp++){const _bang=_bp/8*Math.PI*2;menuParts.push({x:rx+w/2,y:ry+h/2,vx:Math.cos(_bang)*rnd(1.8,4),vy:Math.sin(_bang)*rnd(1.8,4),color:THEMES[i].tm,size:rnd(2,5),life:rnd(22,40),ml:40,star:true});}
    }
    return;}}
  if(playRect){const{x:rx,y:ry,w,h}=playRect;if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){gameState='modeselect';return;}}
  if(hasSave&&resumeRect){const{x:rx,y:ry,w,h}=resumeRect;if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){if(loadSave())return;}}
  if(_lbRect){const{x:rx,y:ry,w,h}=_lbRect;if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){gameState='leaderboard';return;}}
  if(_soundRect){const{x:rx,y:ry,w,h}=_soundRect;if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){_soundEnabled=!_soundEnabled;return;}}
}
function handleModeSelectTap(x,y){
  layoutModeSelect();
  // Back
  if(_modeBackRect&&x>=_modeBackRect.x&&x<_modeBackRect.x+_modeBackRect.w&&y>=_modeBackRect.y&&y<_modeBackRect.y+_modeBackRect.h){gameState='menu';return;}
  // Mode cards — select
  for(const rect of modeSelectRects){if(x>=rect.x&&x<rect.x+rect.w&&y>=rect.y&&y<rect.y+rect.h){currentMode=rect.key;return;}}
  // Play button
  if(_modePlayRect){const{x:rx,y:ry,w,h}=_modePlayRect;if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){try{localStorage.removeItem('bp_save');}catch(e2){}hasSave=false;resize();resetGame();gameState='playing';return;}}
}
window.addEventListener('keydown',e=>{
  if(gameState==='gameover'){gameState='menu';return;}
  if(gameState==='leaderboard'){gameState='menu';return;}
  if(gameState==='modeselect'){if(e.key==='Escape')gameState='menu';return;}
  if(gameState==='menu'&&(e.key==='Enter'||e.key===' ')){gameState='modeselect';return;}
  if(gameState==='pause'){
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){
      if(_pauseStartTime>0){chronoLastTick+=Date.now()-_pauseStartTime;_pauseStartTime=0;}
      gameState='playing';
    }
    return;
  }
  if(gameState==='playing'){
    if(e.key==='Escape'||e.key==='p'||e.key==='P'){gameState='pause';_pauseStartTime=Date.now();return;}
    if(e.key==='r'||e.key==='R'){
      if(score>best){best=score;try{localStorage.setItem('blockpuzzle_best',String(best));}catch(err){}}
      resetGame();
    }
  }
});
canvas.addEventListener('mousedown',onDown,{passive:false});
canvas.addEventListener('mousemove',onMove,{passive:false});
canvas.addEventListener('mouseup',onUp,{passive:false});
canvas.addEventListener('touchstart',onDown,{passive:false});
canvas.addEventListener('touchmove',onMove,{passive:false});
canvas.addEventListener('touchend',onUp,{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());

