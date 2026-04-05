'use strict';
// ─── ENGAGEMENT ENGINE ────────────────────────────────────────────────────────
// Adaptive piece generation: tension/release cycle + chaos events + anti-frustration
// Creates psychological flow: player is never bored AND never helplessly blocked

const _ENG_PHASES=[
  {dur:28000,id:'build',  label:'🌊 FLOW',   col:'#40D0FF'}, // balanced, familiarisation
  {dur:14000,id:'tension',label:'⚡ TENSION',col:'#FF8020'}, // harder pieces, build pressure
  {dur: 8000,id:'release',label:'✨ CHANCE', col:'#60FFD0'}, // easier + line-clear bias, reward
];
let _engPhaseIdx=0,_engPhaseStart=Date.now(),_engHistory=[]; // last 8 shape indices given
let _engChaosIn=10+Math.floor(Math.random()*8); // tray-renewal countdown to next chaos (10-17 trays)
let _engChaosFlash=false; // set true when chaos tray is generated → drawGame shows notification

function _engReset(){
  _engPhaseIdx=0;_engPhaseStart=Date.now();_engHistory=[];
  _engChaosIn=10+Math.floor(Math.random()*8);_engChaosFlash=false;
}

function _engPhase(){
  // Wall-clock phase advancement
  let elapsed=Date.now()-_engPhaseStart;
  while(elapsed>=_ENG_PHASES[_engPhaseIdx].dur){
    elapsed-=_ENG_PHASES[_engPhaseIdx].dur;
    _engPhaseStart+=_ENG_PHASES[_engPhaseIdx].dur;
    _engPhaseIdx=(_engPhaseIdx+1)%_ENG_PHASES.length;
  }
  return _ENG_PHASES[_engPhaseIdx];
}

// Non-destructive: returns lines that would clear if shape placed at (row,col)
function _engPotLines(shape,g,row,col){
  const placed=new Set();
  for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c]){
    const gr=row+r,gc=col+c;
    if(gr<0||gr>=ROWS||gc<0||gc>=COLS||g[gr][gc])return 0;
    placed.add(gr*100+gc);
  }
  let lines=0;
  const rows2=new Set([...placed].map(k=>Math.floor(k/100)));
  const cols2=new Set([...placed].map(k=>k%100));
  rows2.forEach(r=>{for(let c=0;c<COLS;c++){if(!g[r][c]&&!placed.has(r*100+c))return;}lines++;});
  cols2.forEach(c=>{for(let r=0;r<ROWS;r++){if(!g[r][c]&&!placed.has(r*100+c))return;}lines++;});
  return lines;
}
// True if this shape can clear a line from ANYWHERE on the grid
function _engHasPot(shape,g){
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(_engPotLines(shape,g,r,c)>0)return true;
  return false;
}

// Pick a SHAPES index using weighted probability based on phase + grid state
function _engPickIdx(g){
  if(!g)return Math.floor(Math.random()*SHAPES.length);
  const ph=_engPhase();
  const fill=g.reduce((s,row)=>s+row.filter(Boolean).length,0)/(ROWS*COLS);

  const weights=SHAPES.map((shape,idx)=>{
    let w=1.0;
    const cells=shape.flat().reduce((a,v)=>a+v,0);

    // ① Anti-repetition — penalise recently used shapes (prevents monotony)
    const rc=_engHistory.filter(h=>h===idx).length;
    w*=Math.max(0.06,1-rc*0.38);

    // ② Phase bias
    if(ph.id==='tension'){
      // Bigger pieces = harder to fit = pressure mounts
      w*=0.40+cells*0.18;
    }else if(ph.id==='release'){
      // Smaller pieces = easier = relief
      w*=Math.max(0.12,2.4-cells*0.27);
      // Heavily boost pieces that could clear a line (reward feeling)
      if(fill>0.35&&_engHasPot(shape,g))w*=2.8;
      // Extra boost when bonus-star cells exist and shape can clear them
      const starCount=(typeof gridStars!=='undefined')?gridStars.reduce((s,row)=>s+row.filter(Boolean).length,0):0;
      if(starCount>0&&_engHasPot(shape,g))w*=1.4;
    }
    // build: neutral (just anti-repetition applies)

    // ③ Anti-frustration: grid filling up → small pieces get priority
    if(fill>0.65)w*=Math.max(0.18,2.0-cells*0.32);

    // ④ Salvation: very full grid + can clear lines → emergency boost
    if(fill>0.78&&_engHasPot(shape,g))w*=3.2;

    return Math.max(0.01,w);
  });

  const total=weights.reduce((a,b)=>a+b,0);
  let r2=Math.random()*total;
  for(let i=0;i<SHAPES.length;i++){
    r2-=weights[i];
    if(r2<=0){_engHistory.push(i);if(_engHistory.length>8)_engHistory.shift();return i;}
  }
  _engHistory.push(SHAPES.length-1);if(_engHistory.length>8)_engHistory.shift();
  return SHAPES.length-1;
}
