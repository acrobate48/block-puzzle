'use strict';
// ─── FIREBASE LEADERBOARD ─────────────────────────────────────────────────────
let _lbRect=null,_backLbRect=null;
let leaderboardData=[];
let playerPseudo='';try{playerPseudo=localStorage.getItem('bp_pseudo')||'';}catch(e){}
let _fbDb=null;
(function(){
  if(typeof firebase==='undefined')return; // Firebase SDK not loaded (iOS)
  try{
    const cfg=window.FIREBASE_CONFIG;
    const app=firebase.initializeApp(cfg);
    _fbDb=firebase.database(app);
    _fbDb.ref('leaderboard').orderByChild('score').limitToLast(10).on('value',snap=>{
      const arr=[];snap.forEach(ch=>{const v=ch.val();if(v){const _ps=String(v.pseudo||'').slice(0,16);const _sc=Math.floor(Number(v.score));if(_ps&&Number.isFinite(_sc)&&_sc>0&&_sc<=999999){arr.push({pseudo:_ps,score:_sc});}}});
      arr.sort((a,b)=>b.score-a.score);leaderboardData=arr;
    });
  }catch(e){console.warn('Firebase init:',e);}
})();
function submitScore(pseudo,sc){
  // Rate-limit: une soumission max toutes les 10 secondes
  if(window._lastSubmit&&Date.now()-window._lastSubmit<10000)return;
  window._lastSubmit=Date.now();
  if(!_fbDb||!pseudo||sc<=0)return;
  // Sanitisation pseudo: uniquement lettres, chiffres, espaces, tirets, points, underscores
  pseudo=String(pseudo).trim().slice(0,16);
  if(!/^[\w\-. ]{1,16}$/u.test(pseudo))pseudo=pseudo.replace(/[^\w\-. ]/gu,'').slice(0,16)||'???';
  if(!pseudo)pseudo='???';
  // Validation score
  if(!Number.isInteger(sc)||sc<=0||sc>999999)return;
  _fbDb.ref('leaderboard').orderByChild('pseudo').equalTo(pseudo).once('value',snap=>{
    let key=null,prev=0;
    snap.forEach(ch=>{key=ch.key;prev=Number(ch.val().score)||0;});
    if(!key||sc>prev){
      const ref=key?_fbDb.ref('leaderboard/'+key):_fbDb.ref('leaderboard').push();
      ref.set({pseudo,score:sc,date:Date.now()});
    }
  });
}
function showPseudoOverlay(sc){
  const wrap=document.getElementById('lb-pseudo-wrap');
  const inp=document.getElementById('lb-pseudo-inp');
  const btn=document.getElementById('lb-pseudo-btn');
  if(!wrap||!inp||!btn)return;
  inp.value=playerPseudo;
  wrap.style.display='flex';
  setTimeout(()=>{try{inp.focus();}catch(e){}},120);
  const submit=()=>{
    const p=inp.value.trim().slice(0,16);
    if(!p){inp.style.borderColor='#ff4040';setTimeout(()=>{inp.style.borderColor='#4080ff';},600);return;}
    playerPseudo=p;
    try{localStorage.setItem('bp_pseudo',p);}catch(e){}
    submitScore(p,sc);
    wrap.style.display='none';
    btn.removeEventListener('click',submit);inp.removeEventListener('keydown',onKey);
  };
  const onKey=e=>{if(e.key==='Enter')submit();};
  btn.removeEventListener('click',submit);inp.removeEventListener('keydown',onKey);
  btn.addEventListener('click',submit);inp.addEventListener('keydown',onKey);
}
function _triggerScoreSubmit(sc){
  if(sc<=0)return;
  _saveModeScore(currentMode,sc);
  if(playerPseudo)submitScore(playerPseudo,sc);
  else showPseudoOverlay(sc);
}

function resetGame(){
  grid=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  tray=newTray();nextTrayPreview=newTray();score=0;placed=0;over=false;combo=0;overT=0;
  displayScore=0;_newBestTriggered=false;_nextMilestoneIdx=0;_turboStreak=0;_enduranceBonusTriggered=false;_enduranceBonusUntil=0;_engReset();
  particles=[];debris=[];floats=[];screenFlash=0;shake=0;drag=null;placedCellsMap.clear();clearAnims=[];
  gridStars=Array.from({length:ROWS},()=>Array(COLS).fill(false));
  gridBonus=Array.from({length:ROWS},()=>Array(COLS).fill(null));
  secondChanceUsed=false;showSecondChance=false;doublePointsUntil=0;
  showAddCellsBonus=false;addCellsBonusTimer=Math.floor(rnd(8,15));showBonusPicker=false;bonusPickerPieces=[];bonusPickerRects=[];parasites=[];lastPlaceTime=Date.now();placeHistory=[];_placementStreak=0;_undoCount=3;ripples=[];dragTrail=[];
  gameStartTime=Date.now();totalLinesCleared=0;maxComboGame=0;
  // Mode-specific reset
  contraBlocked=[];choixState='picking';choixOptions=[];choixOptionRects=[];choixSelected=-1;
  histoireGoalMet=false;histoireNextRect=null;
  curTheme=selTheme;gameFx=initFx(selTheme);gameBg=_IS_IOS?null:buildBg(selTheme);fadeAlpha=1;
  _initMode();
}
function getCurTheme(){return(selTheme+Math.floor(score/500))%THEMES.length;}

function loadSave(){
  try{
    const sv=JSON.parse(localStorage.getItem('bp_save')||'null');if(!sv||sv.v!==1)return false;
    resetGame();
    grid=sv.grid;score=sv.score;placed=sv.placed;combo=sv.combo;curTheme=sv.curTheme||selTheme;
    gridStars=sv.gridStars;gridBonus=sv.gridBonus;
    tray=sv.tray.map(p=>p?{shape:p.shape,color:p.color,isParasite:!!p.isParasite}:null);
    nextTrayPreview=sv.ntp?sv.ntp.map(p=>p?{shape:p.shape,color:p.color}:null):newTray();
    gameStartTime=Date.now()-(sv.gameStartTime?Date.now()-sv.gameStartTime:0);
    totalLinesCleared=sv.totalLinesCleared||0;maxComboGame=sv.maxComboGame||0;
    displayScore=score;
    gameBg=_IS_IOS?null:buildBg(curTheme);gameFx=initFx(curTheme);
    gameState='playing';fadeAlpha=0.6;
    return true;
  }catch(e){return false;}
}

function tickParasites(){
  const now=Date.now();
  parasites.forEach(p=>{
    if(now-p.born>=PARASITE_LIFE){return;}
    if(now-p.lastTick>=PARASITE_TICK){
      p.lastTick=now;
      const dirs=[[-1,0],[1,0],[0,-1],[0,1]];
      shuffleArr(dirs);
      for(const[dr,dc] of dirs){
        const nr=p.r+dr,nc=p.c+dc;
        if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&grid[nr][nc]){
          grid[nr][nc]=null;
          gridStars[nr][nc]=false;gridBonus[nr][nc]=null;
          spawnParticles([{r:nr,c:nc}],5,1,['#00FF60','#40FF90','#1A0A3E']);
          shake=Math.max(shake,4);shakePow=Math.max(shakePow,2);
          floats.push(new FloatText('☠ PARASITE',GRID_X+nc*CELL+CELL/2,GRID_Y+nr*CELL,'#00FF60',0.8,55));
          break;
        }
      }
    }
  });
  parasites=parasites.filter(p=>now-p.born<PARASITE_LIFE);
  // Determine which pieces are "playable" for the current mode
  const _tkEM=currentMode==='histoire'?_getHistoireSubMode():currentMode;
  const _tkCheck=_tkEM==='choix'?choixOptions:tray.filter(Boolean);
  if(_tkCheck.length>0&&!anyValid(grid,_tkCheck)&&!showSecondChance){
    const _eM_zen=currentMode==='histoire'?_getHistoireSubMode():currentMode;
    if(_eM_zen==='zen'){_zenClearRows();tray=newTray();}
    else if(!secondChanceUsed){showSecondChance=true;}
    else{over=true;overT=Date.now();setTimeout(()=>{gameState='gameover';},2000);}
  }
}
const _parasiteInterval=setInterval(()=>{if(gameState==='playing'&&!over)tickParasites();},150);
