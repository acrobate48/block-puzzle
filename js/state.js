'use strict';
// ─── STATE ───────────────────────────────────────────────────────────────────
// Spring bounce curve: 10 frames, overshoots then settles (Apple-style)
const _SPRING=[0.46,0.74,0.98,1.14,1.18,1.11,1.05,1.02,1.01,1.00];
let best = 0;
try {
  const _rawBest=parseInt(localStorage.getItem('blockpuzzle_best')||'0',10);
  best=(Number.isInteger(_rawBest)&&_rawBest>=0&&_rawBest<=999999)?_rawBest:0;
} catch (err) {
  best = 0;
}
let bestCombo=0;try{const _rawCombo=parseInt(localStorage.getItem('bp_bestcombo')||'0',10);bestCombo=(Number.isInteger(_rawCombo)&&_rawCombo>=0&&_rawCombo<=999)?_rawCombo:0;}catch(e){}
let scoreHistory=[];try{scoreHistory=JSON.parse(localStorage.getItem('bp_scores')||'[]');}catch(e){scoreHistory=[];}
// Best score per mode — stored as {survie:0,chrono:0,...}
let bestPerMode={};try{bestPerMode=JSON.parse(localStorage.getItem('bp_best_mode')||'{}');}catch(e){bestPerMode={};}
function _saveModeScore(mode,sc){if(sc>0&&(!(mode in bestPerMode)||sc>bestPerMode[mode])){bestPerMode[mode]=sc;try{localStorage.setItem('bp_best_mode',JSON.stringify(bestPerMode));}catch(e){}}}
function _getModeScore(mode){return bestPerMode[mode]||0;}
let hasSave=false;try{hasSave=!!localStorage.getItem('bp_save');}catch(e){}
let gameState='menu';
let selSkin=0,selTheme=0;
let grid,tray,score,placed,over,combo,overT,curTheme;
let displayScore=0;
let _newBestTriggered=false; // fired once per game when score first beats best
const _MILESTONES=[1000,5000,10000,50000,100000];
let _nextMilestoneIdx=0; // index into _MILESTONES for next milestone to trigger
let _turboStreak=0; // consecutive TURBO placements
let _enduranceBonusTriggered=false; // 5-min session reward
let _enduranceBonusUntil=0; // timestamp until 1.5x bonus is active
let particles=[],debris=[],floats=[];
let screenFlash=0,screenFlashCol='#fff';
let shake=0,shakePow=0,shakeX=0,shakeY=0;
let drag=null,mouseX=W/2,mouseY=H/2;
let gameFx=null,gameBg=null;
let placedCellsMap=new Map(); // key=r*100+c, value=frame counter f
let clearAnims=[]; // line clear sweep animations
let fadeAlpha=0; // screen fade in on game start
let gridStars=Array.from({length:ROWS},()=>Array(COLS).fill(false));
let gridBonus=Array.from({length:ROWS},()=>Array(COLS).fill(null));
let secondChanceUsed=false,showSecondChance=false;
let secondChanceBtns={oui:null,non:null};
let doublePointsUntil=0;
let showAddCellsBonus=false,addCellsBonusRect=null,addCellsBonusTimer=10;
let showBonusPicker=false,bonusPickerPieces=[],bonusPickerRects=[];
let nextTrayPreview=null; // pré-généré pour l'aperçu "prochains blocs"
// Speed mechanic
let lastPlaceTime=0; // ms timestamp quand le dernier bloc a été posé
// thinkTime tiers (ms): <1500 TURBO, <4000 FAST, <8000 NORMAL, >=8000 SLOW
const SPEED_TURBO=1500,SPEED_FAST=4000,SPEED_SLOW=8000;
// Place history for second-chance undo (stores last 5 placements)
let placeHistory=[]; // [{cells:[{r,c,color}]}] max 5 entries
// Parasite system
let parasites=[]; // {r,c,born,lastTick} — active parasite source cells on grid
const PARASITE_TICK=3000; // ms between each eat
const PARASITE_LIFE=5000; // ms total lifespan
// Stats
let gameStartTime=0,totalLinesCleared=0,maxComboGame=0;
// Menu
let resumeRect=null;
