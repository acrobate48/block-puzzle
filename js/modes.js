'use strict';
// ─── MODE MANAGER ────────────────────────────────────────────────────────────
let currentMode='survie'; // 'survie'|'chrono'|'choix'|'contraintes'|'histoire'|'zen'
let modeSelectRects=[];

// Chrono mode
let chronoTimeLeft=8000,chronoMaxTime=8000,chronoLastTick=0;

// Choix / Stratégie mode
let choixState='picking'; // 'picking'|'placing'
let choixOptions=[],choixOptionRects=[],choixSelected=-1;

// Contraintes mode
let contraBlocked=[]; // [{r,c}] cells that are blocked (cannot place on)

// Histoire mode
let histoireLevel=0;try{histoireLevel=parseInt(localStorage.getItem('bp_histoire')||'0',10)||0;}catch(e){}
let histoireGoalMet=false,histoireGoalMetT=0,histoireNextRect=null;

const MODES={
  survie: {name:'SURVIE',   icon:'♾',  desc:'Blocs infinis.\nDure le plus longtemps!',  color:'#40FF80'},
  chrono: {name:'CHRONO',   icon:'⏱',  desc:'8 sec par bloc.\nDépêche-toi!',             color:'#FF8020'},
  choix:  {name:'STRATÉGIE',icon:'🎯', desc:'Choisis ton bloc\nparmi 3 options.',        color:'#D040FF'},
  contraintes:{name:'CONTRAINTES',icon:'⚠',desc:'Cases bloquées.\nAdapte-toi!',         color:'#FFD700'},
  histoire:{name:'HISTOIRE',icon:'📖', desc:'50 niveaux progressifs.\nAtteins le score de chaque niveau !',color:'#FF6080'},
  zen:    {name:'ZEN',      icon:'🍃', desc:'Aucun game over.\nJoue sans limite !',         color:'#60C880'},
};
const MODE_KEYS=['survie','chrono','choix','contraintes','histoire','zen'];

// Histoire: 50 niveaux — score progressif (niveau N = N×100 pts)
// Niveaux 1-20 : Survie (apprentissage)
// Niveaux 21-35 : Chrono (pression du temps)
// Niveaux 36-50 : Contraintes (cases bloquées)
const HISTOIRE_LEVELS=(()=>{
  const lvls=[];
  for(let i=0;i<50;i++){
    const n=i+1;
    let mode,goalVal,label;
    if(n<=20){mode='survie';goalVal=n*100;label=`Marque ${n*100} pts`;}
    else if(n<=35){mode='chrono';goalVal=Math.round(n*120);label=`${Math.round(n*120)} pts en temps limité`;}
    else if(n%2===0){mode='contraintes';goalVal=Math.round(n*150);label=`${Math.round(n*150)} pts avec contraintes`;lvls.push({mode,goalType:'score',goalVal,label});continue;}
    else{mode='contraintes';goalVal=Math.min(n-30,15);label=`Efface ${Math.min(n-30,15)} lignes`;lvls.push({mode,goalType:'lines',goalVal,label});continue;}
    lvls.push({mode,goalType:'score',goalVal,label});
  }
  return lvls;
})();

function _modeCanPlace(grid,shape,row,col){
  for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c]){
    const gr=row+r,gc=col+c;
    if(gr<0||gr>=ROWS||gc<0||gc>=COLS)return false;
    if(grid[gr][gc])return false; // null=empty; '__BLOCKED__','__CRACKED__' or color = occupied
  }
  return true;
}

function _generateContraBlocked(){
  // 8–14 random blocked cells, avoid edges fully (keep some space playable)
  contraBlocked=[];
  const count=8+rndI(0,6);
  const used=new Set();
  let tries=0;
  while(contraBlocked.length<count&&tries<200){
    tries++;
    const r=rndI(1,8),c=rndI(1,8);
    const k=r*100+c;
    if(!used.has(k)){used.add(k);contraBlocked.push({r,c,hp:2});}
  }
}

function _generateChoixOptions(){
  choixOptions=[newPiece(),newPiece(),newPiece()];
  choixOptionRects=[];
  choixSelected=-1;
  choixState='picking';
  tray=[null,null,null]; // clear tray until pick
}

function _initMode(){
  // Called at start of each game to set up mode-specific state
  if(currentMode==='chrono'){
    chronoTimeLeft=chronoMaxTime;chronoLastTick=Date.now();
  }else if(currentMode==='choix'){
    _generateChoixOptions();
  }else if(currentMode==='contraintes'){
    _generateContraBlocked();
    // Mark blocked cells visually (dark fill)
    contraBlocked.forEach(({r,c})=>{grid[r][c]='__BLOCKED__';});
  }else if(currentMode==='histoire'){
    const lvlDef=HISTOIRE_LEVELS[histoireLevel%HISTOIRE_LEVELS.length];
    const subMode=lvlDef.mode;
    currentMode='histoire'; // keep as histoire, but apply sub-mode init
    _applyHistoireSubMode(subMode);
    histoireGoalMet=false;
  }
}

function _applyHistoireSubMode(subMode){
  if(subMode==='chrono'){
    // Dynamic time for HISTOIRE chrono levels: 8s at level 21 → 5s at level 35
    if(histoireLevel>=20&&histoireLevel<35){chronoMaxTime=Math.round(8000-(histoireLevel-20)*(3000/15));}
    chronoTimeLeft=chronoMaxTime;chronoLastTick=Date.now();
  }else if(subMode==='choix'){
    _generateChoixOptions();
  }else if(subMode==='contraintes'){
    _generateContraBlocked();
    contraBlocked.forEach(({r,c})=>{grid[r][c]='__BLOCKED__';});
  }
}

function _getHistoireSubMode(){
  if(currentMode!=='histoire')return currentMode;
  return HISTOIRE_LEVELS[histoireLevel%HISTOIRE_LEVELS.length].mode;
}

function _checkHistoireGoal(){
  if(currentMode!=='histoire'||histoireGoalMet)return;
  const lvlDef=HISTOIRE_LEVELS[histoireLevel%HISTOIRE_LEVELS.length];
  let met=false;
  if(lvlDef.goalType==='score'&&score>=lvlDef.goalVal)met=true;
  else if(lvlDef.goalType==='pieces'&&placed>=lvlDef.goalVal)met=true;
  else if(lvlDef.goalType==='lines'&&totalLinesCleared>=lvlDef.goalVal)met=true;
  else if(lvlDef.goalType==='combo'&&maxComboGame>=lvlDef.goalVal)met=true;
  if(met){histoireGoalMet=true;histoireGoalMetT=Date.now();}
}
