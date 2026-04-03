'use strict';
// ─── INPUT ───────────────────────────────────────────────────────────────────
function getPos(e){if(e.touches&&e.touches.length>0)return{x:e.touches[0].clientX,y:e.touches[0].clientY};if(e.changedTouches&&e.changedTouches.length>0)return{x:e.changedTouches[0].clientX,y:e.changedTouches[0].clientY};return{x:e.clientX,y:e.clientY};}
function onDown(e){e.preventDefault();const{x,y}=getPos(e);mouseX=x;mouseY=y;
  if(gameState==='menu'){handleMenuTap(x,y);return;}
  if(gameState==='modeselect'){handleModeSelectTap(x,y);return;}
  if(gameState==='pause'){return;}
  if(gameState==='leaderboard'){if(_backLbRect&&x>=_backLbRect.x&&x<_backLbRect.x+_backLbRect.w&&y>=_backLbRect.y&&y<_backLbRect.y+_backLbRect.h){gameState='menu';}return;}
  if(gameState==='gameover'){if(Date.now()-overT>1200)gameState='menu';return;}
  // Block tray drag only when in choix PICKING phase; all other modes allow normal drag
  const _inChoixPick=(currentMode==='choix'||_getHistoireSubMode()==='choix')&&choixState==='picking';
  if(gameState==='playing'&&!over&&!showSecondChance&&!showBonusPicker&&!_inChoixPick){const pw=GW/3;for(let i=0;i<3;i++){if(x>=GRID_X+i*pw&&x<GRID_X+(i+1)*pw&&y>=TRAY_Y&&y<TRAY_Y+TRAY_H&&tray[i]){drag={idx:i};break;}}}}
function onMove(e){e.preventDefault();const{x,y}=getPos(e);mouseX=x;mouseY=y;
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
  // Pause HUD button
  if(gameState==='playing'&&_pauseHudRect&&x>=_pauseHudRect.x&&x<_pauseHudRect.x+_pauseHudRect.w&&y>=_pauseHudRect.y&&y<_pauseHudRect.y+_pauseHudRect.h){gameState='pause';_pauseStartTime=Date.now();return;}
  // Sound toggle (in-game bar only — menu has its own handler in handleMenuTap)
  if(gameState==='playing'&&_soundRect&&x>=_soundRect.x&&x<_soundRect.x+_soundRect.w&&y>=_soundRect.y&&y<_soundRect.y+_soundRect.h){_soundEnabled=!_soundEnabled;return;}
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
    if(piece){const{gr,gc}=snapPos(x,y,piece.shape);if(_modeCanPlace(grid,piece.shape,gr,gc)){
      placePiece(grid,piece.shape,piece.color,gr,gc);
      sndPlace();
      // ── Speed mechanic ───────────────────────────────────────────────────
      const now2=Date.now();
      const thinkMs=lastPlaceTime>0?now2-lastPlaceTime:4000;
      lastPlaceTime=now2;
      // Chrono: reset timer on successful placement
      if(_getHistoireSubMode()==='chrono'||currentMode==='chrono'){chronoTimeLeft=chronoMaxTime;chronoLastTick=now2;}
      let speedMul=1.0,speedLabel=null,speedCol='#FFFFFF';
      if(thinkMs<SPEED_TURBO){
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
        placeHistory.push({cells:hCells});
        if(placeHistory.length>5)placeHistory.shift();
      }
      // Petites particules de placement
      {const pcells2=[];piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)pcells2.push({r:gr+rr,c:gc+cc});}));spawnParticles(pcells2,2,0.45,[piece.color]);}
      tray[drag.idx]=null;placed++;
      showAddCellsBonus=false;addCellsBonusTimer--;
      if(addCellsBonusTimer<=0){showAddCellsBonus=true;addCellsBonusTimer=Math.floor(rnd(8,15));}
      const ti=getCurTheme(),{n,cells,colors}=clearLines(grid);
      if(n>0){
        sndClear(n);
        totalLinesCleared+=n;
        // Animation sweep
        clearAnims.push({cells:[...cells],born:Date.now(),color:THEMES[ti].tm});
        let starPts=0;const bombList=[];let hasX2=false;
        // Kill parasites in cleared lines
        const clearedSet=new Set(cells.map(({r,c})=>r*100+c));
        const pBefore=parasites.length;
        parasites=parasites.filter(p=>!clearedSet.has(p.r*100+p.c));
        if(parasites.length<pBefore)floats.push(new FloatText('☠ PARASITE ÉLIMINÉ',GRID_X+GW/2,GRID_Y+GH*0.4,'#00FF80',1.0,90));
        cells.forEach(({r,c})=>{if(gridStars[r][c])starPts+=25;if(gridBonus[r][c]==='bomb')bombList.push({r,c});if(gridBonus[r][c]==='x2')hasX2=true;gridStars[r][c]=false;gridBonus[r][c]=null;});
        const bombKilled=[];
        bombList.forEach(({r,c})=>{for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){const br=r+dr,bc=c+dc;if(br>=0&&br<ROWS&&bc>=0&&bc<COLS&&grid[br][bc]){bombKilled.push({r:br,c:bc});grid[br][bc]=null;gridStars[br][bc]=false;gridBonus[br][bc]=null;}}});
        if(bombKilled.length>0){spawnParticles(bombKilled,8,2,['#FF6020','#FFA020','#FF2010']);shake=Math.max(shake,14);shakePow=Math.max(shakePow,6);screenFlash=Math.min(255,screenFlash+120);screenFlashCol='#FF4010';}
        if(hasX2)doublePointsUntil=Date.now()+60000;
        combo++;
        if(combo>bestCombo){bestCombo=combo;try{localStorage.setItem('bp_bestcombo',String(bestCombo));}catch(e2){}}
        maxComboGame=Math.max(maxComboGame,combo);
        if(combo>=2)sndCombo(combo);
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
      }else combo=0;
      // Speed float (show regardless of line clear)
      if(speedLabel)floats.push(new FloatText(speedLabel,GRID_X+GW/2,GRID_Y+GH*0.25,speedCol,0.85,70));
      const subM=_getHistoireSubMode();const eM=currentMode==='histoire'?subM:currentMode;
      if(tray.every(p=>p===null)&&eM!=='choix'){tray=nextTrayPreview||newTray();nextTrayPreview=newTray();}
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
    drag=null;
  }
}
function handleMenuTap(x,y){
  layoutMenu();
  for(let i=0;i<skinRects.length;i++){const{x:rx,y:ry,w,h}=skinRects[i];if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){selSkin=i;return;}}
  for(let i=0;i<themeRects.length;i++){const{x:rx,y:ry,w,h}=themeRects[i];if(x>=rx&&x<rx+w&&y>=ry&&y<ry+h){selTheme=i;menuBg=buildBg(i);menuFx=initFx(i);return;}}
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

