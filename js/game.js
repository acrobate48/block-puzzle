'use strict';
// ─── GAME RENDER ─────────────────────────────────────────────────────────────
// Premium UI state
let _goDisplayScore=0,_goRecBurst=false,_goReplayRect=null,_goMenuRect=null,_hudScorePulse=0;
let _uiRipples=[];
function _addUiRipple(x,y,col,maxR){_uiRipples.push({x,y,col:col||'#FFFFFF',maxR:maxR||32,born:Date.now()});}
// ─── ACHIEVEMENT SYSTEM ───────────────────────────────────────────────────────
function _unlockAchieve(idx){
  if(_achieveUnlocked[idx])return;
  _achieveUnlocked[idx]=true;
  try{localStorage.setItem('bp_achievements',JSON.stringify(_achieveUnlocked));}catch(e){}
  _achieveToasts.push({idx,born:Date.now()});
  if(typeof sndBonus==='function')sndBonus();
}
let _goVideoStarted=false;
let _goExploded=false; // board cells burst off on game-over
let _stampRings=[]; // ink-stamp concentric rings on piece placement
let _tiltX=0,_tiltY=0; // 3D drag tilt state

// ═══════════════════════════════════════════════════════════════════════════════
// ─── GRAPHICAL ENHANCEMENT SYSTEMS ───────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ─── 1. AMBIENT WEATHER PARTICLES ────────────────────────────────────────────
let _wx=[],_wxTheme=-1;
const _WX=[
  // 0=JUNGLE: leaves + fireflies
  {n:38,spawn:(W,H)=>{const L=Math.random()<0.68;return L?{x:rnd(-20,W+20),y:-15,vx:rnd(-0.5,0.5),vy:rnd(0.55,1.4),t:'leaf',rot:rnd(0,Math.PI*2),rv:rnd(-0.05,0.05),sz:rnd(5,11),col:rndc(['#3A8C20','#5CB030','#70A828','#C8A020','#A06010']),life:rnd(220,460),ml:460}:{x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.35,0.35),vy:rnd(-0.35,0.35),t:'fly',sz:rnd(2,4),col:rndc(['#90FF80','#D4FF40','#FFFF80','#80FFC0']),ph:rnd(0,Math.PI*2),life:rnd(180,440),ml:440};}},
  // 1=DESERT: drifting sand + heat shimmer dots
  {n:65,spawn:(W,H)=>({x:rnd(-10,W),y:rnd(H*0.55,H+5),vx:rnd(0.5,1.8),vy:rnd(-0.18,0.18),t:'sand',sz:rnd(1,3),col:Math.random()<0.5?'rgba(215,158,62,0.5)':'rgba(235,190,92,0.38)',life:rnd(100,260),ml:260})},
  // 2=OCEAN: rising bubbles + caustic shimmer
  {n:38,spawn:(W,H)=>({x:rnd(0,W),y:H+12,vx:rnd(-0.35,0.35),vy:rnd(-0.8,-1.8),t:'bubble',sz:rnd(2,10),col:'rgba(100,210,255,0.40)',life:rnd(140,370),ml:370})},
  // 3=VOLCAN: floating embers + lava sparks
  {n:55,spawn:(W,H)=>({x:rnd(0,W),y:rnd(H*0.45,H+20),vx:rnd(-0.7,0.7),vy:rnd(-2.2,-0.55),t:'ember',sz:rnd(1,4.5),col:rndc(['#FF6020','#FF9020','#FFCC40','#FF3010','#FFF080']),life:rnd(55,200),ml:200})},
  // 4=NUIT: shooting stars + city glow motes
  {n:10,spawn:(W,H)=>Math.random()<0.7?{x:rnd(0,W),y:rnd(0,H*0.45),vx:rnd(-4.5,-1.5),vy:rnd(0.5,1.4),t:'star',len:rnd(30,80),sz:rnd(1.2,2.5),col:'rgba(255,255,255,0.92)',life:rnd(22,55),ml:55}:{x:rnd(0,W),y:rnd(H*0.6,H),vx:rnd(-0.2,0.2),vy:rnd(-0.3,0),t:'glow',sz:rnd(1,3),col:rndc(['rgba(160,100,255,0.6)','rgba(80,150,255,0.5)','rgba(255,150,80,0.4)']),ph:rnd(0,Math.PI*2),life:rnd(120,320),ml:320}},
  // 5=ARCTIQUE: snowflakes
  {n:50,spawn:(W,H)=>({x:rnd(-25,W+25),y:-15,vx:rnd(-0.6,0.6),vy:rnd(0.45,1.4),t:'snow',sz:rnd(2,8),col:'rgba(200,235,255,0.78)',rot:rnd(0,Math.PI*2),rv:rnd(-0.03,0.03),life:rnd(200,520),ml:520})},
  // 6=COSMOS: cosmic dust + twinkling stars
  {n:60,spawn:(W,H)=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.12,0.12),vy:rnd(-0.12,0.12),t:'cosmos',sz:rnd(0.5,2.8),col:rndc(['rgba(200,120,255,0.85)','rgba(120,160,255,0.85)','rgba(255,255,255,0.95)','rgba(255,100,200,0.75)','rgba(100,255,255,0.75)']),ph:rnd(0,Math.PI*2),life:rnd(200,620),ml:620})},
  // 7=ENCHANTÉ: fireflies + sparkles
  {n:45,spawn:(W,H)=>({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.5,0.5),vy:rnd(-0.5,0.5),t:'fly',sz:rnd(2.5,5.5),col:rndc(['#60FF80','#A0FF60','#FFFF60','#FF80FF','#80FFFF','#C0FF80']),ph:rnd(0,Math.PI*2),life:rnd(200,520),ml:520})},
  // 8=PLAGE: foam + seagulls
  {n:40,spawn:(W,H)=>Math.random()<0.88?{x:rnd(0,W),y:rnd(H*0.65,H),vx:rnd(-0.7,0.7),vy:rnd(-0.15,0.05),t:'foam',sz:rnd(3,10),col:'rgba(255,255,255,0.52)',life:rnd(80,260),ml:260}:{x:-35,y:rnd(H*0.08,H*0.38),vx:rnd(0.9,2),vy:rnd(-0.1,0.1),t:'gull',sz:7,col:'rgba(255,255,255,0.72)',life:rnd(160,320),ml:320,wing:0,wv:rnd(0.09,0.16)}},
  // 9=NÉOPOLIS: katakana digital rain
  {n:48,spawn:(W,H)=>({x:rnd(0,W),y:-35,vx:0,vy:rnd(2.2,6.5),t:'rain',sz:rnd(7,15)|0,col:rndc(['#00FFCC','#00DDFF','#A040FF','#FF40C0','#40FF80','#FFFFFF']),char:String.fromCharCode(0x30A0+Math.floor(Math.random()*96)),life:rnd(38,165),ml:165})},
];
function _wxInit(ti){_wxTheme=ti;_wx=[];const cfg=_WX[ti];if(!cfg)return;for(let i=0;i<cfg.n;i++){const p=cfg.spawn(W,H);if(p.t==='leaf'||p.t==='snow')p.y=rnd(-20,H+20);if(p.t==='bubble')p.y=rnd(0,H+10);if(p.t==='cosmos'||p.t==='fly'||p.t==='glow')p.life=rnd(0,p.ml);if(p.t==='star')p.x=rnd(0,W),p.y=rnd(0,H*0.42);_wx.push(p);}}
function _drawWeather(t){
  if(_wxTheme!==curTheme){_wxInit(curTheme);return;}
  const cfg=_WX[curTheme];if(!cfg)return;
  ctx.save();
  for(let i=_wx.length-1;i>=0;i--){
    const p=_wx[i];
    p.x+=p.vx;p.y+=p.vy;p.life--;
    if(p.rot!==undefined)p.rot+=p.rv||0;
    if(p.wing!==undefined)p.wing+=p.wv;
    const ratio=p.life/p.ml;const fade=Math.min(1,ratio*(1-ratio)*4.2);
    const respawn=p.life<=0||(p.t==='leaf'&&p.y>H+35)||(p.t==='snow'&&p.y>H+20)||(p.t==='sand'&&p.x>W+15)||(p.t==='rain'&&p.y>H+30)||(p.t==='gull'&&p.x>W+40);
    if(respawn){const np=cfg.spawn(W,H);Object.assign(p,np);if(p.t==='leaf'||p.t==='snow')p.y=-18;if(p.t==='bubble')p.y=H+12;if(p.t==='rain')p.y=-35;if(p.t==='gull')p.x=-35;if(p.t==='star')p.x=rnd(0,W),p.y=rnd(0,H*0.4);continue;}
    switch(p.t){
      case 'leaf':{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=Math.min(fade,0.78);ctx.fillStyle=p.col;ctx.beginPath();ctx.ellipse(0,0,p.sz,p.sz*0.42,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(0,0,0,0.16)';ctx.lineWidth=0.5;ctx.stroke();ctx.restore();break;}
      case 'sand':ctx.globalAlpha=ratio*0.58;ctx.fillStyle=p.col;ctx.fillRect(p.x,p.y,p.sz,p.sz*0.4);break;
      case 'bubble':ctx.globalAlpha=fade*0.58;ctx.strokeStyle=p.col;ctx.lineWidth=Math.max(0.5,p.sz*0.14);ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.stroke();ctx.fillStyle=`rgba(180,235,255,${(fade*0.09).toFixed(3)})`;ctx.fill();break;
      case 'ember':ctx.globalAlpha=fade*0.92;ctx.fillStyle=p.col;ctx.shadowColor=p.col;ctx.shadowBlur=p.sz*3;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;break;
      case 'star':{const age=1-ratio;ctx.globalAlpha=fade*0.95;ctx.strokeStyle=p.col;ctx.lineWidth=p.sz;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.vx*age*p.len,p.y+p.vy*age*p.len);ctx.stroke();break;}
      case 'glow':{const pulse=0.5+0.5*Math.sin(t*0.005+p.ph);ctx.globalAlpha=fade*pulse*0.55;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*pulse,0,Math.PI*2);ctx.fill();break;}
      case 'snow':{ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.globalAlpha=fade*0.82;ctx.strokeStyle=p.col;ctx.lineWidth=Math.max(0.7,p.sz*0.2);for(let si=0;si<6;si++){ctx.save();ctx.rotate(si*Math.PI/3);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,p.sz);ctx.stroke();if(p.sz>4){ctx.beginPath();ctx.moveTo(0,p.sz*0.5);ctx.lineTo(p.sz*0.28,p.sz*0.3);ctx.stroke();ctx.beginPath();ctx.moveTo(0,p.sz*0.5);ctx.lineTo(-p.sz*0.28,p.sz*0.3);ctx.stroke();}ctx.restore();}ctx.restore();break;}
      case 'cosmos':{const pulse=0.45+0.55*Math.abs(Math.sin(t*0.003+p.ph));ctx.globalAlpha=pulse*0.82;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*pulse,0,Math.PI*2);ctx.fill();break;}
      case 'fly':{const pulse=0.4+0.6*Math.abs(Math.sin(t*0.007+p.ph));ctx.globalAlpha=pulse*0.88;ctx.fillStyle=p.col;ctx.shadowColor=p.col;ctx.shadowBlur=p.sz*3.8;ctx.beginPath();ctx.arc(p.x,p.y,p.sz*pulse,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;break;}
      case 'foam':ctx.globalAlpha=fade*0.55;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();break;
      case 'gull':{ctx.save();ctx.translate(p.x,p.y);ctx.globalAlpha=ratio*0.68;ctx.strokeStyle=p.col;ctx.lineWidth=1.6;ctx.lineCap='round';const wf=Math.sin(p.wing)*p.sz*0.7;ctx.beginPath();ctx.moveTo(-p.sz,wf);ctx.quadraticCurveTo(0,-p.sz*0.5,p.sz,wf);ctx.stroke();ctx.restore();break;}
      case 'rain':ctx.globalAlpha=ratio*0.78;ctx.fillStyle=p.col;ctx.shadowColor=p.col;ctx.shadowBlur=4;ctx.font=`${p.sz}px monospace`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(p.char,p.x,p.y);ctx.shadowBlur=0;break;
    }
  }
  ctx.globalAlpha=1;ctx.restore();
}

// ─── 2. CHROMATIC ABERRATION ─────────────────────────────────────────────────
function _drawChromaticAb(){
  if(shake<4)return;
  const str=cl((shake-4)/18,0,1);
  const bw=Math.max(5,W*0.04)|0;
  ctx.save();
  // Red fringe — left/right edges
  const rL=ctx.createLinearGradient(0,0,bw*3,0);
  rL.addColorStop(0,`rgba(255,30,30,${(str*0.28).toFixed(3)})`);rL.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rL;ctx.fillRect(0,0,bw*3,H);
  const rR=ctx.createLinearGradient(W,0,W-bw*3,0);
  rR.addColorStop(0,`rgba(0,220,255,${(str*0.26).toFixed(3)})`);rR.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rR;ctx.fillRect(W-bw*3,0,bw*3,H);
  // Top/bottom fringes
  const rT=ctx.createLinearGradient(0,0,0,bw*2);
  rT.addColorStop(0,`rgba(255,30,30,${(str*0.14).toFixed(3)})`);rT.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rT;ctx.fillRect(0,0,W,bw*2);
  const rB=ctx.createLinearGradient(0,H,0,H-bw*2);
  rB.addColorStop(0,`rgba(0,220,255,${(str*0.12).toFixed(3)})`);rB.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rB;ctx.fillRect(0,H-bw*2,W,bw*2);
  ctx.restore();
}

// ─── 3. COMBO COLOR GRADING ──────────────────────────────────────────────────
function _drawComboGrade(){
  if(combo<4||over)return;
  const lvl=cl(combo-4,0,6);
  const _cgCols=['rgba(255,80,0,','rgba(255,30,0,','rgba(200,0,0,','rgba(160,0,30,','rgba(100,0,80,','rgba(60,0,130,','rgba(40,0,170,'];
  const a=(lvl/9*0.38).toFixed(3);
  ctx.save();
  ctx.fillStyle=_cgCols[lvl]+a+')';ctx.fillRect(0,0,W,H);
  const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.12,W/2,H/2,Math.max(W,H)*0.72);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,_cgCols[lvl]+(lvl/9*0.28).toFixed(3)+')');
  ctx.fillStyle=vg;ctx.fillRect(0,0,W,H);
  ctx.restore();
}

// ─── 4. PERSISTENT CELL HALOS ────────────────────────────────────────────────
const _freshCells=new Map(); // r*100+c → {col,born,dur}
function _addFreshCell(r,c,col){_freshCells.set(r*100+c,{col,born:Date.now(),dur:2200});}
function _drawFreshHalos(){
  const now=Date.now();
  ctx.save();
  _freshCells.forEach((v,k)=>{
    const p=Math.min(1,(now-v.born)/v.dur);
    if(p>=1){_freshCells.delete(k);return;}
    const r=Math.floor(k/100),c=k%100;
    if(r<0||r>=ROWS||c<0||c>=COLS)return;
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
    const a=(1-p)*(1-p)*0.38;
    const gg=ctx.createRadialGradient(x+CELL/2,y+CELL/2,0,x+CELL/2,y+CELL/2,CELL*0.78);
    gg.addColorStop(0,hexA(v.col,a));gg.addColorStop(0.5,hexA(v.col,a*0.4));gg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=gg;ctx.fillRect(x-CELL*0.3,y-CELL*0.3,CELL*1.6,CELL*1.6);
  });
  ctx.restore();
}

// ─── 5. STRESS CRACKS (grid >78% full) ───────────────────────────────────────
function _drawStressCracks(fillRatio){
  if(fillRatio<0.78||over)return;
  const intensity=cl((fillRatio-0.78)/0.22,0,1);
  const _sc=seeded(42);
  ctx.save();ctx.globalAlpha=intensity*0.55;
  ctx.strokeStyle=`rgba(255,${(60-50*intensity)|0},${(40-30*intensity)|0},${(0.6+0.4*intensity).toFixed(2)})`;
  ctx.lineWidth=0.7+intensity*0.8;ctx.lineCap='round';
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(!grid[r][c])continue;
    if(_sc()>intensity*0.55+0.12)continue;
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
    const n=Math.floor(_sc()*2)+1;
    for(let ci=0;ci<n;ci++){
      const sx=x+_sc()*CELL,sy=y+_sc()*CELL;
      const ang=_sc()*Math.PI*2,len=CELL*(0.15+_sc()*0.35);
      ctx.beginPath();ctx.moveTo(sx,sy);
      ctx.lineTo(sx+Math.cos(ang)*len,sy+Math.sin(ang)*len);ctx.stroke();
      if(_sc()>0.5){ctx.beginPath();ctx.moveTo(sx+Math.cos(ang)*len*0.5,sy+Math.sin(ang)*len*0.5);ctx.lineTo(sx+Math.cos(ang+1.2)*len*0.4,sy+Math.sin(ang+1.2)*len*0.4);ctx.stroke();}
    }
  }
  ctx.restore();
}

// ─── 6. FLOOR GLOW EFFECT PER THEME ─────────────────────────────────────────
function _drawFloorEffect(t){
  const th=THEMES[curTheme];
  const fx=GRID_X,fy=GRID_Y+GH,fw=GW,fh=Math.min(TRAY_Y-fy,40);
  if(fh<4)return;
  ctx.save();
  const pulse=0.5+0.5*Math.sin(t*0.0012);
  switch(curTheme){
    case 2:{// Ocean — caustic shimmer
      const og=ctx.createLinearGradient(fx,fy,fx,fy+fh);
      og.addColorStop(0,hexA('#00E8FF',0.30*pulse));og.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=og;ctx.fillRect(fx,fy,fw,fh);
      // caustic ripples
      for(let ci=0;ci<5;ci++){const cx2=fx+fw*(0.1+ci*0.2)+Math.sin(t*0.001+ci)*fw*0.08;const cr=CELL*(0.3+0.2*Math.sin(t*0.0015+ci));ctx.strokeStyle=`rgba(80,220,255,${(0.18*pulse).toFixed(3)})`;ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx2,fy+fh*0.3,cr,0,Math.PI*2);ctx.stroke();}
      break;}
    case 3:{// Volcan — lava crack glow
      const lg=ctx.createLinearGradient(fx,fy,fx,fy+fh);
      lg.addColorStop(0,`rgba(255,60,0,${(0.38*pulse).toFixed(3)})`);lg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=lg;ctx.fillRect(fx,fy,fw,fh);
      // lava veins
      const _lv=seeded(77);for(let li=0;li<4;li++){const lx=fx+_lv()*fw;ctx.strokeStyle=`rgba(255,${(120+100*pulse)|0},0,${(0.45*pulse).toFixed(3)})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(lx,fy);ctx.lineTo(lx+(_lv()-0.5)*20,fy+fh);ctx.stroke();}
      break;}
    case 5:{// Arctique — ice mirror reflection
      ctx.globalAlpha=0.18;ctx.transform(1,0,0,-0.4,0,fy*1.4);
      const ig=ctx.createLinearGradient(fx,fy,fx,fy+fh*3);
      ig.addColorStop(0,'rgba(140,210,255,0.55)');ig.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ig;ctx.fillRect(fx,fy,fw,fh*3);
      ctx.setTransform(window.devicePixelRatio||1,0,0,window.devicePixelRatio||1,0,0);
      break;}
    case 9:{// Néopolis — neon floor glow
      const ng=ctx.createLinearGradient(fx,fy,fx,fy+fh);
      ng.addColorStop(0,`rgba(0,220,255,${(0.35*pulse).toFixed(3)})`);ng.addColorStop(0.5,`rgba(180,40,255,${(0.20*pulse).toFixed(3)})`);ng.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ng;ctx.fillRect(fx,fy,fw,fh);
      break;}
    default:{// Generic theme glow
      const dg=ctx.createLinearGradient(fx,fy,fx,fy+fh);
      dg.addColorStop(0,hexA(th.gridGlow||th.tm,0.18*pulse));dg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=dg;ctx.fillRect(fx,fy,fw,fh);
    }
  }
  ctx.restore();
}

// ─── 7. SCANLINES — NÉOPOLIS CRT ─────────────────────────────────────────────
function _drawScanlines(){
  if(curTheme!==9||over)return;
  const _nf=getNeonFlicker();
  ctx.save();ctx.globalAlpha=0.055*_nf;
  for(let sy=0;sy<H;sy+=4){ctx.fillStyle='rgba(0,0,0,0.9)';ctx.fillRect(0,sy,W,2);}
  // Subtle horizontal sweep line
  const sweepY=(Date.now()*0.04)%H;
  const sg=ctx.createLinearGradient(0,sweepY-8,0,sweepY+8);
  sg.addColorStop(0,'rgba(0,255,200,0)');sg.addColorStop(0.5,`rgba(0,255,200,${(0.06*_nf).toFixed(3)})`);sg.addColorStop(1,'rgba(0,255,200,0)');
  ctx.globalAlpha=_nf;ctx.fillStyle=sg;ctx.fillRect(0,sweepY-8,W,16);
  ctx.restore();
}

// ─── 18. GRID PULSE WAVE PROPAGATION ─────────────────────────────────────────
let _gridWaves=[]; // {cx,cy,born} — rings propagate across filled cells
function _triggerGridWave(worldX,worldY){_gridWaves.push({cx:worldX,cy:worldY,born:Date.now()});}
function _drawGridWave(t){
  if(!_gridWaves.length||!grid)return;
  const now=Date.now();
  ctx.save();
  _gridWaves=_gridWaves.filter(gw=>{
    const age=now-gw.born;const dur=800;
    const p=age/dur;if(p>=1)return false;
    const radius=p*Math.max(GW,GH)*0.85;
    const a=(1-p)*(1-p)*0.28;
    // Draw a glow ring at radius from source on filled cells
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(!grid[r][c])continue;
      const cx2=GRID_X+(c+0.5)*CELL,cy2=GRID_Y+(r+0.5)*CELL;
      const d=Math.sqrt((cx2-gw.cx)**2+(cy2-gw.cy)**2);
      const inRing=Math.abs(d-radius)<CELL*0.7;
      if(inRing){
        const da=a*(1-Math.abs(d-radius)/(CELL*0.7));
        if(da<0.01)continue;
        ctx.fillStyle=`rgba(255,255,255,${da.toFixed(3)})`;
        ctx.fillRect(GRID_X+c*CELL,GRID_Y+r*CELL,CELL,CELL);
      }
    }
    return true;
  });
  ctx.restore();
}

// ─── 19. AMBIENT GRID MIST ───────────────────────────────────────────────────
let _mistPhase=0;
function _drawGridMist(t){
  if(over)return;
  const th=THEMES[curTheme];
  _mistPhase+=0.0006;
  ctx.save();
  // Two slow-drifting mist blobs on the grid
  for(let mi=0;mi<2;mi++){
    const mx=GRID_X+GW*(0.3+mi*0.4+Math.sin(_mistPhase+mi*2.4)*0.22);
    const my=GRID_Y+GH*(0.4+Math.cos(_mistPhase*0.7+mi*1.8)*0.28);
    const mr=CELL*(2.5+Math.sin(_mistPhase*0.9+mi)*0.8);
    const mg=ctx.createRadialGradient(mx,my,0,mx,my,mr);
    mg.addColorStop(0,hexA(mi===0?th.tm:th.ta,0.055));
    mg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=mg;ctx.fillRect(GRID_X,GRID_Y,GW,GH);
  }
  ctx.restore();
}

// ─── 16. GHOST SNAP BOUNCE ────────────────────────────────────────────────────
let _lastSnapGr=-1,_lastSnapGc=-1,_snapBounce=0;
function _updateSnapBounce(gr,gc){
  if(gr!==_lastSnapGr||gc!==_lastSnapGc){_snapBounce=1.0;_lastSnapGr=gr;_lastSnapGc=gc;}
  else{_snapBounce=Math.max(0,_snapBounce*0.72);}
  return 1+_snapBounce*0.14;
}

// ─── 17. ROTATION SPIN FLASH ─────────────────────────────────────────────────
let _rotFlashes=[]; // {x,y,born,color}
function _triggerRotFlash(x,y,color){_rotFlashes.push({x,y,born:Date.now(),color:color||'#FFFFFF'});}
function _drawRotFlashes(){
  if(!_rotFlashes.length)return;
  const now=Date.now();
  ctx.save();
  _rotFlashes=_rotFlashes.filter(rf=>{
    const p=Math.min(1,(now-rf.born)/380);
    if(p>=1)return false;
    const a=(1-p)*(1-p)*0.75;
    const sz=CELL*(0.5+p*1.2);
    // Expanding ring
    ctx.strokeStyle=hexA(rf.color,a);ctx.lineWidth=2*(1-p)+0.5;
    ctx.shadowColor=rf.color;ctx.shadowBlur=10*(1-p);
    ctx.beginPath();ctx.arc(rf.x,rf.y,sz,0,Math.PI*2);ctx.stroke();
    // Rotation arc sweep
    ctx.strokeStyle=hexA(rf.color,a*0.5);ctx.lineWidth=1.5;
    ctx.beginPath();ctx.arc(rf.x,rf.y,sz*0.6,-Math.PI/2,-Math.PI/2+p*Math.PI*2);ctx.stroke();
    return true;
  });
  ctx.shadowBlur=0;ctx.restore();
}

// ─── 15. COMBO ENERGY BEAM ───────────────────────────────────────────────────
let _lastPlaceCx=0,_lastPlaceCy=0; // set from input.js on placement
let _comboBeamBorn=0;
function _triggerComboBeam(cx,cy){_lastPlaceCx=cx;_lastPlaceCy=cy;_comboBeamBorn=Date.now();}
function _drawComboBeam(t){
  if(combo<3||over)return;
  const age=Date.now()-_comboBeamBorn;
  if(age>600)return;
  const p=age/600;
  const a=(1-p)*(1-p)*0.55;
  if(a<0.01)return;
  // Target: HUD score position
  const _portrait=H>W;
  const _bh=GRID_Y-3;
  const tx=W/2,ty=_portrait?_bh/2:_bh/2;
  const th2=THEMES[curTheme];
  const col=combo>=6?'#FF40FF':combo>=4?'#FFA020':th2.tm;
  ctx.save();
  ctx.globalAlpha=a;
  ctx.strokeStyle=col;
  ctx.shadowColor=col;ctx.shadowBlur=10*(1-p);
  ctx.lineWidth=2-p;ctx.lineCap='round';
  // Beam: zigzag from piece to score
  const segs=6;
  ctx.beginPath();ctx.moveTo(_lastPlaceCx,_lastPlaceCy);
  for(let si=1;si<=segs;si++){
    const frac=si/(segs);
    const mx=lerp(_lastPlaceCx,tx,frac)+(Math.sin(si*7.3+t*0.05)*CELL*0.35*(1-p));
    const my=lerp(_lastPlaceCy,ty,frac)+(Math.cos(si*5.1+t*0.04)*CELL*0.25*(1-p));
    ctx.lineTo(mx,my);
  }
  ctx.stroke();
  // Dot at piece end
  ctx.fillStyle=col;ctx.beginPath();ctx.arc(_lastPlaceCx,_lastPlaceCy,4*(1-p),0,Math.PI*2);ctx.fill();
  ctx.restore();
}

// ─── 13. ALMOST-CLEAR ROW/COL HIGHLIGHT ──────────────────────────────────────
function _drawAlmostClear(t){
  if(over||!grid)return;
  ctx.save();
  const pulse=0.55+0.45*Math.abs(Math.sin(t*0.007));
  // Rows
  for(let r=0;r<ROWS;r++){
    const filled=grid[r].filter(Boolean).length;
    if(filled===COLS-1){
      const emptyC=grid[r].indexOf(null);
      if(emptyC>=0){
        const x=GRID_X+emptyC*CELL,y=GRID_Y+r*CELL;
        ctx.shadowColor='#FFD700';ctx.shadowBlur=CELL*0.6*pulse;
        ctx.strokeStyle=`rgba(255,215,0,${(0.8*pulse).toFixed(3)})`;ctx.lineWidth=2;
        const er=Math.max(2,CELL/6|0);rp(ctx,x+1,y+1,CELL-2,CELL-2,er);ctx.stroke();
        // Gold dot in center of empty cell
        ctx.fillStyle=`rgba(255,215,0,${(0.25*pulse).toFixed(3)})`;
        rp(ctx,x+1,y+1,CELL-2,CELL-2,er);ctx.fill();
      }
    }
  }
  // Cols
  for(let c=0;c<COLS;c++){
    let filled=0,emptyR=-1;
    for(let r=0;r<ROWS;r++){if(grid[r][c])filled++;else emptyR=r;}
    if(filled===ROWS-1&&emptyR>=0){
      const x=GRID_X+c*CELL,y=GRID_Y+emptyR*CELL;
      ctx.shadowColor='#60DDFF';ctx.shadowBlur=CELL*0.5*pulse;
      ctx.strokeStyle=`rgba(96,221,255,${(0.65*pulse).toFixed(3)})`;ctx.lineWidth=1.5;
      const er=Math.max(2,CELL/6|0);rp(ctx,x+1,y+1,CELL-2,CELL-2,er);ctx.stroke();
      ctx.fillStyle=`rgba(96,221,255,${(0.18*pulse).toFixed(3)})`;
      rp(ctx,x+1,y+1,CELL-2,CELL-2,er);ctx.fill();
    }
  }
  ctx.shadowBlur=0;ctx.restore();
}

// ─── 14. GHOST AFTERIMAGE TRAIL ──────────────────────────────────────────────
let _ghostTrail=[]; // [{shape,gr,gc,color,born}]
function _addGhostTrail(shape,gr,gc,color){
  _ghostTrail.push({shape,gr,gc,color,born:Date.now()});
  if(_ghostTrail.length>5)_ghostTrail.shift();
}
function _drawGhostTrail(t){
  if(!_ghostTrail.length)return;
  const now=Date.now();
  ctx.save();
  _ghostTrail.forEach((gt,gi)=>{
    const age=(now-gt.born)/320;
    if(age>1)return;
    const a=(1-age)*(gi+1)/_ghostTrail.length*0.18;
    if(a<0.01)return;
    ctx.globalAlpha=a;
    gt.shape.forEach((line,rr)=>line.forEach((v,cc)=>{
      if(v){const pr2=gt.gr+rr,pc2=gt.gc+cc;
        if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS)
          drawCell(ctx,gt.color,GRID_X+pc2*CELL,GRID_Y+pr2*CELL,CELL,selSkin,t);
      }
    }));
  });
  ctx.restore();
}

// ─── 9. LANDING COLUMN FLASH ─────────────────────────────────────────────────
let _landingFlashes=[]; // {cols:[c,..], born, color}
function _addLandingFlash(cols,color){_landingFlashes.push({cols:[...cols],born:Date.now(),color:color||'#FFFFFF'});}
function _drawLandingFlashes(){
  if(!_landingFlashes.length)return;
  const now=Date.now();
  ctx.save();
  _landingFlashes=_landingFlashes.filter(lf=>{
    const p=Math.min(1,(now-lf.born)/320);
    if(p>=1)return false;
    const a=(1-p)*(1-p)*0.45;
    lf.cols.forEach(c=>{
      if(c<0||c>=COLS)return;
      const x=GRID_X+c*CELL;
      const fg=ctx.createLinearGradient(x,GRID_Y,x,GRID_Y+GH);
      fg.addColorStop(0,hexA(lf.color,a*1.6));
      fg.addColorStop(0.5,hexA(lf.color,a*0.8));
      fg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=fg;ctx.fillRect(x,GRID_Y,CELL,GH);
    });
    return true;
  });
  ctx.restore();
}

// ─── 10. TRAY SPEED GLOW ─────────────────────────────────────────────────────
function _drawTraySpeedGlow(t){
  if(!lastPlaceTime||over)return;
  const elapsed=Date.now()-lastPlaceTime;
  let rc,gc2,bc2,glowA;
  if(elapsed<SPEED_TURBO){rc=40;gc2=220;bc2=100;glowA=0.70;}
  else if(elapsed<SPEED_FAST){rc=255;gc2=220;bc2=40;glowA=0.55;}
  else if(elapsed<SPEED_SLOW){rc=255;gc2=120;bc2=20;glowA=0.40;}
  else{rc=220;gc2=30;bc2=20;glowA=0.30;}
  const pulse=0.7+0.3*Math.abs(Math.sin(t*0.009));
  const a=(glowA*pulse).toFixed(3);
  ctx.save();
  ctx.shadowColor=`rgba(${rc},${gc2},${bc2},${a})`;
  ctx.shadowBlur=12*pulse;
  ctx.strokeStyle=`rgba(${rc},${gc2},${bc2},${a})`;
  ctx.lineWidth=1.5;
  rp(ctx,GRID_X,TRAY_Y,GW,TRAY_H,CR);ctx.stroke();
  ctx.restore();
}

// ─── 11. RAINBOW GLORY — score ≥ 100 000 ─────────────────────────────────────
function _drawRainbowGlory(t){
  if(score<100000||over)return;
  const speed=0.00045*(1+Math.min((score-100000)/400000,3));
  const hue=(t*speed*180/Math.PI)%360;
  const a=0.055+0.025*Math.sin(t*0.0022);
  ctx.save();
  ctx.fillStyle=`hsla(${hue|0},100%,60%,${a.toFixed(3)})`;ctx.fillRect(0,0,W,H);
  ctx.fillStyle=`hsla(${(hue+120)|0},100%,60%,${(a*0.6).toFixed(3)})`;ctx.fillRect(0,0,W,H);
  // Radial shimmer at grid center
  const rg=ctx.createRadialGradient(GRID_X+GW/2,GRID_Y+GH/2,0,GRID_X+GW/2,GRID_Y+GH/2,Math.max(GW,GH)*0.7);
  rg.addColorStop(0,`hsla(${(hue+60)|0},100%,75%,${(a*0.9).toFixed(3)})`);
  rg.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
  ctx.restore();
}

// ─── 12. ELECTRICITY ARCS ON GRID BORDER (combo ≥ 4) ────────────────────────
let _arcPhase=0;
function _drawElectricityBorder(t){
  if(combo<4||over)return;
  const intensity=cl((combo-4)/4,0,1);
  const th=THEMES[curTheme];
  _arcPhase+=0.18+intensity*0.12;
  ctx.save();
  ctx.shadowColor=th.gridGlow||th.tm;ctx.shadowBlur=6+4*intensity;
  ctx.strokeStyle=hexA(th.gridGlow||th.tm,0.55+0.35*intensity);
  ctx.lineWidth=1+intensity;ctx.lineCap='round';
  const arcCount=Math.floor(3+combo*0.8);
  for(let ai=0;ai<arcCount;ai++){
    const seed=ai*137.5;
    const perimeter=2*(GW+GH);
    const startPos=((_arcPhase*15+seed)%perimeter+perimeter)%perimeter;
    // Convert perimeter position to (x,y)
    function _perimPt(pos){
      if(pos<GW)return{x:GRID_X+pos,y:GRID_Y};
      pos-=GW;if(pos<GH)return{x:GRID_X+GW,y:GRID_Y+pos};
      pos-=GH;if(pos<GW)return{x:GRID_X+GW-pos,y:GRID_Y+GH};
      pos-=GW;return{x:GRID_X,y:GRID_Y+GH-pos};}
    const arcLen=CELL*(1.5+Math.sin(seed)*0.8);
    const p0=_perimPt(startPos),p1=_perimPt((startPos+arcLen)%perimeter);
    ctx.beginPath();ctx.moveTo(p0.x,p0.y);
    // Jagged arc via 3-4 midpoints
    const segs=3+Math.floor(Math.sin(seed*0.7+_arcPhase)*1.5+1.5);
    for(let s=1;s<=segs;s++){
      const frac=s/(segs+1);
      const mx=lerp(p0.x,p1.x,frac)+(Math.sin(_arcPhase*2.3+ai*77+s*13)*CELL*(0.06+0.12*intensity));
      const my=lerp(p0.y,p1.y,frac)+(Math.cos(_arcPhase*1.9+ai*53+s*17)*CELL*(0.06+0.12*intensity));
      ctx.lineTo(mx,my);
    }
    ctx.lineTo(p1.x,p1.y);ctx.stroke();
  }
  ctx.restore();
}

// ─── 20. GOD RAYS — outdoor themes (Jungle, Désert, Plage) ──────────────────
let _godRays=[]; // {x, angle, born, color}
let _godRayTimer=0;
function _spawnGodRay(){
  const outThemes=[0,1,8]; // Jungle, Désert, Plage
  if(!outThemes.includes(curTheme))return;
  if(Math.random()>0.004)return; // rare
  const th=THEMES[curTheme];
  _godRays.push({x:rnd(0,W),angle:rnd(Math.PI/2-0.4,Math.PI/2+0.4),born:Date.now(),color:th.hi||th.tm});
  if(_godRays.length>3)_godRays.shift();
}
function _drawGodRays(){
  if(!_godRays.length)return;
  const now=Date.now();
  ctx.save();
  _godRays=_godRays.filter(gr=>{
    const age=now-gr.born;const dur=3000;
    const p=age/dur;if(p>=1)return false;
    const a=(p<0.2?p/0.2:p>0.7?(1-p)/0.3:1)*0.10;
    ctx.save();
    const len=H*2;
    const bw=W*0.08;
    ctx.translate(gr.x,0);
    const sg=ctx.createLinearGradient(0,0,0,len);
    sg.addColorStop(0,hexA(gr.color,a));
    sg.addColorStop(0.3,hexA(gr.color,a*0.6));
    sg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=sg;
    ctx.beginPath();
    ctx.moveTo(-bw/2,0);ctx.lineTo(bw/2,0);
    ctx.lineTo(bw/2+len*Math.sin(gr.angle-Math.PI/2)*0.4,len);
    ctx.lineTo(-bw/2+len*Math.sin(gr.angle-Math.PI/2)*0.4,len);
    ctx.closePath();ctx.fill();
    ctx.restore();
    return true;
  });
  ctx.restore();
}

// ─── 21. LIGHTNING GRID (score ≥ 100 000) ───────────────────────────────────
let _lightningTimer=0;
let _lightnings=[]; // {pts:[{x,y}..], born, color}
function _maybeSpawnLightning(t){
  if(score<100000||over)return;
  if(Math.random()>0.003)return;
  // Diagonal bolt from random top edge to bottom
  const x0=rnd(GRID_X,GRID_X+GW),y0=GRID_Y;
  const x1=x0+rnd(-GW*0.4,GW*0.4),y1=GRID_Y+GH;
  const pts=[{x:x0,y:y0}];
  const segs=8+Math.floor(Math.random()*5);
  for(let s=1;s<segs;s++){
    const f=s/segs;
    pts.push({x:lerp(x0,x1,f)+rnd(-CELL*0.8,CELL*0.8),y:lerp(y0,y1,f)});
  }
  pts.push({x:x1,y:y1});
  const th=THEMES[curTheme];
  _lightnings.push({pts,born:Date.now(),color:th.hi||'#FFFFFF'});
  if(_lightnings.length>4)_lightnings.shift();
}
function _drawLightnings(){
  if(!_lightnings.length)return;
  const now=Date.now();
  ctx.save();
  _lightnings=_lightnings.filter(ln=>{
    const age=now-ln.born;const dur=350;
    const p=age/dur;if(p>=1)return false;
    const a=(1-p)*(1-p)*0.85;
    ctx.strokeStyle=hexA(ln.color,a);ctx.lineWidth=1.5*(1-p)+0.5;
    ctx.shadowColor=ln.color;ctx.shadowBlur=8*(1-p);
    ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(ln.pts[0].x,ln.pts[0].y);
    ln.pts.slice(1).forEach(pt=>ctx.lineTo(pt.x,pt.y));
    ctx.stroke();
    // Bright white core
    ctx.strokeStyle=`rgba(255,255,255,${(a*0.7).toFixed(3)})`;ctx.lineWidth=0.8*(1-p);
    ctx.beginPath();ctx.moveTo(ln.pts[0].x,ln.pts[0].y);
    ln.pts.slice(1).forEach(pt=>ctx.lineTo(pt.x,pt.y));
    ctx.stroke();
    return true;
  });
  ctx.shadowBlur=0;ctx.restore();
}

// ─── 26. RHYTHM HEARTBEAT PULSE ──────────────────────────────────────────────
let _lastBeat=0;
function _drawRhythmPulse(t){
  if(over||gameState!=='playing')return;
  const now=Date.now();
  const bpm=score>50000?80:60; // faster rhythm at higher score
  const beatInterval=60000/bpm;
  if(now-_lastBeat>=beatInterval){_lastBeat=now;}
  const beatAge=now-_lastBeat;
  if(beatAge>450)return; // only draw during first 450ms of each beat
  const p=beatAge/450;
  const a=(1-p)*(1-p)*0.18;
  if(a<0.01)return;
  const rad=(p*Math.max(GW,GH)*0.55);
  ctx.save();
  const th=THEMES[curTheme];
  ctx.strokeStyle=hexA(th.gridGlow||th.tm,a);
  ctx.lineWidth=3*(1-p)+0.5;
  ctx.shadowColor=th.gridGlow||th.tm;ctx.shadowBlur=8*(1-p);
  ctx.beginPath();ctx.arc(GRID_X+GW/2,GRID_Y+GH/2,rad,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}

// ─── 27. VOLCANO ERUPTION GUST ───────────────────────────────────────────────
function _spawnVolcanoGust(){
  if(curTheme!==3||over||Math.random()>0.006)return;
  // Burst of ember particles from random grid-bottom position
  const x=GRID_X+rnd(CELL,GW-CELL);const y=GRID_Y+GH;
  for(let i=0;i<15;i++){
    const a=rnd(-Math.PI*0.8,-Math.PI*0.2);const s=rnd(3,8);
    particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,color:rndc(['#FF6020','#FF9020','#FFCC40','#FF3010','#FFF080']),size:rnd(2,5),life:rnd(30,55),ml:55,circle:true});
  }
  screenFlash=Math.max(screenFlash,20);screenFlashCol='#FF4010';
  ripples.push({x,y,life:22,ml:22,maxR:CELL*2,color:'#FF6020'});
}

// ─── 28. COSMOS NEBULA DRIFT ─────────────────────────────────────────────────
let _nebulaPhase=0;
function _drawCosmosnNebula(t){
  if(curTheme!==6||over)return;
  _nebulaPhase+=0.00035;
  ctx.save();
  // Three overlapping color clouds drifting across the grid
  const cols=['rgba(160,40,255,','rgba(40,80,255,','rgba(255,40,160,'];
  for(let ni=0;ni<3;ni++){
    const nx=GRID_X+GW*(0.2+ni*0.3+Math.sin(_nebulaPhase+ni*2.1)*0.2);
    const ny=GRID_Y+GH*(0.3+Math.cos(_nebulaPhase*0.7+ni*1.7)*0.3);
    const nr=CELL*(2+Math.sin(_nebulaPhase*1.1+ni)*0.8);
    const ng=ctx.createRadialGradient(nx,ny,0,nx,ny,nr);
    ng.addColorStop(0,cols[ni]+'0.07)');ng.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=ng;ctx.fillRect(GRID_X,GRID_Y,GW,GH);
  }
  ctx.restore();
}

// ─── 25. ZAP ARCS BETWEEN POWER CELLS ────────────────────────────────────────
function _drawPowerZaps(t){
  if(!grid||over)return;
  const now=t;
  ctx.save();ctx.strokeStyle='rgba(255,230,0,0.35)';ctx.lineWidth=0.8;
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(!(gridStars[r][c]||gridBonus[r][c]))continue;
    // Check right and down neighbors
    [[0,1],[1,0]].forEach(([dr,dc])=>{
      const r2=r+dr,c2=c+dc;
      if(r2>=ROWS||c2>=COLS)return;
      if(!(gridStars[r2][c2]||gridBonus[r2][c2]))return;
      const x1=GRID_X+(c+0.5)*CELL,y1=GRID_Y+(r+0.5)*CELL;
      const x2=GRID_X+(c2+0.5)*CELL,y2=GRID_Y+(r2+0.5)*CELL;
      // Zigzag spark
      const pulse=Math.sin(now*0.015+r*11+c*7);
      if(pulse<0.1)return; // sparse
      const mx=lerp(x1,x2,0.5)+Math.sin(now*0.02+r*5+c*9)*CELL*0.2;
      const my=lerp(y1,y2,0.5)+Math.cos(now*0.018+r*7+c*13)*CELL*0.2;
      ctx.globalAlpha=(pulse-0.1)/0.9*0.55;
      ctx.shadowColor='#FFD700';ctx.shadowBlur=5;
      ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(mx,my);ctx.lineTo(x2,y2);ctx.stroke();
    });
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();
}

// ─── 22. NEON FLICKER — NÉOPOLIS ─────────────────────────────────────────────
let _neonFlicker=1.0,_neonFlickerT=0;
function _updateNeonFlicker(t){
  if(curTheme!==9)return;
  // Occasional random flicker
  if(Math.random()<0.004){_neonFlicker=0.3+Math.random()*0.5;_neonFlickerT=2+Math.random()*4;}
  if(_neonFlickerT>0){_neonFlickerT--;if(_neonFlickerT<=0)_neonFlicker=1.0;}
  else{_neonFlicker=Math.min(1.0,_neonFlicker+0.08);}
}
function getNeonFlicker(){return curTheme===9?_neonFlicker:1.0;}

// ─── 23. LENSFLARE at 100K+ ──────────────────────────────────────────────────
let _lensFlares=[]; // {x,y,born,col,size}
function _maybeSpawnLensFlare(){
  if(score<100000||over||Math.random()>0.003)return;
  const th=THEMES[curTheme];
  _lensFlares.push({x:rnd(W*0.1,W*0.9),y:rnd(0,H*0.25),born:Date.now(),col:th.hi||'#FFFFFF',size:rnd(30,80)});
  if(_lensFlares.length>3)_lensFlares.shift();
}
function _drawLensFlares(){
  if(!_lensFlares.length)return;
  const now=Date.now();
  ctx.save();
  _lensFlares=_lensFlares.filter(lf=>{
    const p=Math.min(1,(now-lf.born)/1200);if(p>=1)return false;
    const a=(p<0.15?p/0.15:p>0.6?(1-p)/0.4:1)*0.55;
    // Central bright disc
    const rg=ctx.createRadialGradient(lf.x,lf.y,0,lf.x,lf.y,lf.size);
    rg.addColorStop(0,`rgba(255,255,255,${a.toFixed(3)})`);
    rg.addColorStop(0.2,hexA(lf.col,a*0.6));
    rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg;ctx.fillRect(lf.x-lf.size,lf.y-lf.size,lf.size*2,lf.size*2);
    // Cross streaks
    ctx.save();ctx.strokeStyle=`rgba(255,255,255,${(a*0.5).toFixed(3)})`;ctx.lineWidth=1;
    ctx.shadowColor='#FFFFFF';ctx.shadowBlur=10;
    for(let si=0;si<4;si++){const ang=si*Math.PI/4;const len=lf.size*(1.5+si*0.3);ctx.beginPath();ctx.moveTo(lf.x-Math.cos(ang)*len*0.1,lf.y-Math.sin(ang)*len*0.1);ctx.lineTo(lf.x+Math.cos(ang)*len,lf.y+Math.sin(ang)*len);ctx.stroke();}
    // Small secondary flares along lens axis
    const axis=Math.PI*0.4;
    [0.4,0.7,1.1].forEach((d,di)=>{const fx=lf.x+Math.cos(axis)*lf.size*d*2,fy=lf.y+Math.sin(axis)*lf.size*d*2;const fr=lf.size*(0.12-di*0.03);if(fr<2)return;const fg2=ctx.createRadialGradient(fx,fy,0,fx,fy,fr);fg2.addColorStop(0,hexA(lf.col,a*0.45));fg2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=fg2;ctx.fillRect(fx-fr,fy-fr,fr*2,fr*2);});
    ctx.restore();
    return true;
  });
  ctx.restore();
}

// ─── 24. SNOW ACCUMULATION — ARCTIQUE ────────────────────────────────────────
let _snowAccum=Array(COLS).fill(0); // height of snow at bottom of each column
function _updateSnowAccum(t){
  if(curTheme!==5)return;
  // Slowly grow, cap at CELL*0.4
  if(Math.random()<0.015){const c=Math.floor(Math.random()*COLS);_snowAccum[c]=Math.min(CELL*0.4,_snowAccum[c]+0.5+Math.random()*1.5);}
  // Slowly melt when grid is empty in that column
  for(let c=0;c<COLS;c++){const colFull=grid.some(row=>row[c]);if(!colFull)_snowAccum[c]=Math.max(0,_snowAccum[c]-0.3);}
}
function _drawSnowAccum(){
  if(curTheme!==5||over)return;
  ctx.save();
  for(let c=0;c<COLS;c++){
    const h=_snowAccum[c];if(h<1)continue;
    const x=GRID_X+c*CELL,y=GRID_Y+GH-h;
    const sg=ctx.createLinearGradient(x,y,x,y+h);
    sg.addColorStop(0,'rgba(220,240,255,0.85)');sg.addColorStop(1,'rgba(180,220,255,0.55)');
    ctx.fillStyle=sg;
    // Rounded snow pile
    ctx.beginPath();ctx.moveTo(x,y+h);ctx.quadraticCurveTo(x+CELL*0.3,y,x+CELL/2,y);ctx.quadraticCurveTo(x+CELL*0.7,y,x+CELL,y+h);ctx.closePath();ctx.fill();
  }
  ctx.restore();
}

// ─── 39. AURORA BOREALIS — Night & Cosmos themes ────────────────────────────
let _auroraT=0;
function _drawAurora(t){
  if(curTheme!==4&&curTheme!==6)return; // Night=4, Cosmos=6
  _auroraT+=0.00035;
  ctx.save();
  const cols=curTheme===4
    ?['rgba(100,40,200,','rgba(40,100,200,','rgba(60,200,160,']
    :['rgba(180,40,255,','rgba(40,80,255,','rgba(255,40,200,'];
  const aH=H*0.28; // ribbon height at top
  for(let ai=0;ai<3;ai++){
    const ax=W*(0.1+ai*0.3+Math.sin(_auroraT+ai*2.1)*0.2);
    const ayw=aH*(0.4+Math.sin(_auroraT*0.7+ai*1.3)*0.3);
    const ang=ctx.createLinearGradient(ax-W*0.15,0,ax+W*0.15,0);
    ang.addColorStop(0,'rgba(0,0,0,0)');
    ang.addColorStop(0.5,cols[ai]+`${(0.055+0.03*Math.sin(_auroraT*1.1+ai)).toFixed(3)})`);
    ang.addColorStop(1,'rgba(0,0,0,0)');
    const ag=ctx.createLinearGradient(0,0,0,ayw);
    ag.addColorStop(0,cols[ai]+'0.05)');
    ag.addColorStop(0.6,cols[ai]+'0.028)');
    ag.addColorStop(1,'rgba(0,0,0,0)');
    ctx.save();ctx.globalCompositeOperation='screen';
    ctx.fillStyle=ang;ctx.fillRect(ax-W*0.22,0,W*0.44,ayw);
    ctx.fillStyle=ag;ctx.fillRect(0,0,W,ayw);
    ctx.restore();
  }
  ctx.restore();
}

// ─── 40. TRAY SLOT PIECE RADIANCE ────────────────────────────────────────────
function _drawTrayRadiance(){
  if(!tray||over)return;
  const pw=GW/3;
  ctx.save();
  for(let i=0;i<3;i++){
    const piece=tray[i];if(!piece||!piece.color)continue;
    if(drag&&drag.idx===i)continue;
    const cx=GRID_X+i*pw+pw/2,cy=TRAY_Y+TRAY_H/2;
    const rg=ctx.createRadialGradient(cx,cy,0,cx,cy,pw*0.62);
    rg.addColorStop(0,hexA(piece.color,0.12));
    rg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=rg;ctx.fillRect(GRID_X+i*pw,TRAY_Y,pw,TRAY_H);
  }
  ctx.restore();
}

// ─── 36. DEPTH FOG AT GRID BOTTOM — Ocean & Arctic ──────────────────────────
function _drawDepthFog(t){
  if(curTheme!==2&&curTheme!==5)return;
  const fh=CELL*1.8;
  const fy=GRID_Y+GH-fh;
  ctx.save();
  const pulse=0.5+0.5*Math.sin(t*0.0009);
  const fg=ctx.createLinearGradient(GRID_X,fy,GRID_X,fy+fh);
  if(curTheme===2){// Ocean: deep blue-green fog
    fg.addColorStop(0,'rgba(0,0,0,0)');
    fg.addColorStop(0.4,`rgba(0,30,80,${(0.18*pulse).toFixed(3)})`);
    fg.addColorStop(1,`rgba(0,10,50,${(0.32*pulse).toFixed(3)})`);
  }else{// Arctic: white ice mist
    fg.addColorStop(0,'rgba(0,0,0,0)');
    fg.addColorStop(0.4,`rgba(160,210,255,${(0.12*pulse).toFixed(3)})`);
    fg.addColorStop(1,`rgba(200,230,255,${(0.22*pulse).toFixed(3)})`);
  }
  ctx.fillStyle=fg;ctx.fillRect(GRID_X,fy,GW,fh);
  ctx.restore();
}

// ─── 37. ALMOST-FULL COLUMN DRIP — Ocean theme ──────────────────────────────
let _colDrips=[]; // {c,born,col}
function _updateColDrips(){
  if(curTheme!==2||!grid||over)return;
  for(let c=0;c<COLS;c++){
    const filled=grid.filter(row=>row[c]).length;
    if(filled>=ROWS-2&&Math.random()<0.025){
      _colDrips.push({c,born:Date.now(),col:rndc(['#40C8FF','#80F0FF','#FFFFFF','#20A8FF'])});
      if(_colDrips.length>20)_colDrips.shift();
    }
  }
}
function _drawColDrips(){
  if(!_colDrips.length)return;
  const now=Date.now();
  ctx.save();
  _colDrips=_colDrips.filter(d=>{
    const p=Math.min(1,(now-d.born)/500);if(p>=1)return false;
    const x=GRID_X+d.c*CELL+CELL/2+rnd(-CELL*0.25,CELL*0.25);
    const y=GRID_Y+p*GH;
    const a=(1-p)*(1-p)*0.7;
    // Droplet
    ctx.fillStyle=hexA(d.col,a);
    ctx.beginPath();ctx.arc(x,y,Math.max(1.5,CELL*0.08),0,Math.PI*2);ctx.fill();
    // Streak
    ctx.strokeStyle=hexA(d.col,a*0.45);ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(x,y-CELL*0.3*p);ctx.lineTo(x,y);ctx.stroke();
    return true;
  });
  ctx.restore();
}

// ─── 38. HEAT SHIMMER — Volcano theme ───────────────────────────────────────
let _heatT=0;
function _drawHeatShimmer(t){
  if(curTheme!==3||!grid||over)return;
  _heatT+=0.018;
  // Subtle upward wavy bands in columns with filled cells
  ctx.save();ctx.globalAlpha=0.045;
  for(let c=0;c<COLS;c++){
    const hasCell=grid.some(row=>row[c]);
    if(!hasCell)continue;
    const x=GRID_X+c*CELL;
    // Wavy gradient strip
    const hs=Math.sin(_heatT+c*0.7)*CELL*0.18;
    const hg=ctx.createLinearGradient(x,GRID_Y,x+hs,GRID_Y+GH);
    hg.addColorStop(0,'rgba(255,80,0,0)');
    hg.addColorStop(0.5,'rgba(255,120,20,1)');
    hg.addColorStop(1,'rgba(255,80,0,0)');
    ctx.fillStyle=hg;ctx.fillRect(x,GRID_Y,CELL,GH);
  }
  ctx.globalAlpha=1;ctx.restore();
}

// ─── 34. NÉOPOLIS HOLOGRAPHIC DEPTH LINES ───────────────────────────────────
function _drawHolographic(t){
  if(curTheme!==9||over)return;
  const _nf=getNeonFlicker();
  ctx.save();
  // Perspective lines from bottom to vanishing point above grid
  const vx=GRID_X+GW/2,vy=GRID_Y-GH*0.55;
  const pulse=0.45+0.45*Math.abs(Math.sin(t*0.004));
  ctx.strokeStyle=`rgba(0,220,255,${(0.055*pulse*_nf).toFixed(3)})`;
  ctx.lineWidth=0.5;
  for(let c=0;c<=COLS;c+=2){
    const bx=GRID_X+c*CELL,by=GRID_Y+GH;
    ctx.beginPath();ctx.moveTo(lerp(vx,bx,0.18),lerp(vy,by,0.18));ctx.lineTo(bx,by);ctx.stroke();
  }
  // Horizontal scan sweep
  const scanY=GRID_Y+((t*0.028)%GH);
  const scanG=ctx.createLinearGradient(GRID_X,scanY-8,GRID_X,scanY+8);
  scanG.addColorStop(0,'rgba(0,220,255,0)');
  scanG.addColorStop(0.5,`rgba(0,220,255,${(0.10*_nf*pulse).toFixed(3)})`);
  scanG.addColorStop(1,'rgba(0,220,255,0)');
  ctx.fillStyle=scanG;ctx.fillRect(GRID_X,scanY-8,GW,16);
  ctx.restore();
}

// ─── 35. CORNER SPARKS ON FRESHLY PLACED CELLS ──────────────────────────────
function _drawFreshCornerSparks(){
  if(!placedCellsMap.size)return;
  ctx.save();
  placedCellsMap.forEach((f,k)=>{
    if(f>=5)return; // only first 5 animation frames
    const r=Math.floor(k/100),c=k%100;
    if(r<0||r>=ROWS||c<0||c>=COLS||!grid||!grid[r][c])return;
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
    const col=grid[r][c];const csf=1-f/5;
    ctx.globalAlpha=csf*0.72;ctx.fillStyle=col;
    ctx.shadowColor=col;ctx.shadowBlur=CELL*0.12;
    const csz=Math.max(1.5,CELL*0.055);
    [[0,0],[CELL,0],[0,CELL],[CELL,CELL]].forEach(([ox,oy])=>{
      const oa=f*CELL*0.055;
      const px2=x+ox+(ox?oa:-oa),py2=y+oy+(oy?oa:-oa);
      ctx.beginPath();ctx.arc(px2,py2,csz,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle=hexA(col,csf*0.52);ctx.lineWidth=0.7;
      const sl=CELL*0.11*csf;
      ctx.beginPath();ctx.moveTo(px2-sl,py2);ctx.lineTo(px2+sl,py2);ctx.stroke();
      ctx.beginPath();ctx.moveTo(px2,py2-sl);ctx.lineTo(px2,py2+sl);ctx.stroke();
    });
  });
  ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
}

// ─── 31. PRISMATIC CRYSTAL SHIMMER — skin 1 (CRISTAL) ───────────────────────
function _drawCrystalShimmer(t){
  if(selSkin!==1||!grid||over)return;
  ctx.save();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(!grid[r][c])continue;
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
    const h=((t*0.05)+(r*22+c*17))%360|0;
    const a=0.10+0.07*Math.sin(t*0.006+r*0.8+c*0.6);
    ctx.globalAlpha=a;
    ctx.fillStyle=`hsl(${h},100%,72%)`;
    ctx.fillRect(x+2,y+2,CELL-4,CELL-4);
  }
  ctx.globalAlpha=1;ctx.restore();
}

// ─── 32. COMBO FIRE CELL GLOW ────────────────────────────────────────────────
function _drawComboFireCells(t){
  if(combo<5||!grid||over)return;
  const intensity=cl((combo-5)/4,0,1);
  ctx.save();
  for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
    if(!grid[r][c])continue;
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL;
    const flicker=0.5+0.5*Math.sin(t*0.022+r*3.7+c*5.1);
    const a=(0.08+0.12*intensity*flicker);
    const fg=ctx.createLinearGradient(x,y+CELL,x,y);
    fg.addColorStop(0,`rgba(255,60,0,${a.toFixed(3)})`);
    fg.addColorStop(0.4,`rgba(255,180,0,${(a*0.45).toFixed(3)})`);
    fg.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=fg;ctx.fillRect(x,y,CELL,CELL);
  }
  ctx.restore();
}

// ─── 33. COMBO GLOWING GRID LINES ────────────────────────────────────────────
function _drawComboGridLines(t){
  if(combo<3||over)return;
  const intensity=cl((combo-3)/6,0,1);
  const th=THEMES[curTheme];
  const col=th.gridGlow||th.ta;
  const pulse=0.55+0.45*Math.abs(Math.sin(t*0.011+combo*0.4));
  ctx.save();
  ctx.strokeStyle=hexA(col,(0.04+0.12*intensity)*pulse);
  ctx.lineWidth=0.8;ctx.shadowColor=col;ctx.shadowBlur=3*intensity;
  for(let gr2=1;gr2<ROWS;gr2++){ctx.beginPath();ctx.moveTo(GRID_X,GRID_Y+gr2*CELL);ctx.lineTo(GRID_X+GW,GRID_Y+gr2*CELL);ctx.stroke();}
  for(let gc2=1;gc2<COLS;gc2++){ctx.beginPath();ctx.moveTo(GRID_X+gc2*CELL,GRID_Y);ctx.lineTo(GRID_X+gc2*CELL,GRID_Y+GH);ctx.stroke();}
  ctx.shadowBlur=0;ctx.restore();
}

// ─── 29. GAME OVER BOARD EXPLOSION ──────────────────────────────────────────
function _triggerBoardExplosion(){
  if(!grid)return;
  for(let r=ROWS-1;r>=0;r--){
    for(let c=0;c<COLS;c++){
      if(!grid[r][c])continue;
      const delay=Math.floor((ROWS-1-r)*14+c*3+Math.random()*18);
      const cx=GRID_X+(c+0.5)*CELL,cy=GRID_Y+(r+0.5)*CELL;
      const col=grid[r][c];const ti=curTheme;
      setTimeout(()=>{
        for(let i=0;i<3;i++){
          const d=new Debris(cx+rnd(-CELL*0.28,CELL*0.28),cy+rnd(-CELL*0.28,CELL*0.28),col,ti);
          const ang=rnd(-Math.PI*0.95,-Math.PI*0.05)+rnd(-0.5,0.5);const spd=rnd(2.5,7);
          d.vx=Math.cos(ang)*spd;d.vy=Math.sin(ang)*spd-rnd(0.5,2.5);d.circ=false;debris.push(d);
        }
        particles.push({x:cx,y:cy,vx:rnd(-1.5,1.5),vy:rnd(-3.5,-0.5),color:col,size:CELL*0.3,life:30,ml:30,circle:true});
        ripples.push({x:cx,y:cy,life:12,ml:12,maxR:CELL*0.75,color:col});
      },delay);
    }
  }
}

// ─── 30. INK STAMP LANDING RINGS ─────────────────────────────────────────────
function _triggerStampRing(x,y,col,maxR){
  _stampRings.push({x,y,col,maxR:maxR||CELL*2.8,born:Date.now()});
}
function _drawStampRings(){
  if(!_stampRings.length)return;
  const now=Date.now();
  ctx.save();
  _stampRings=_stampRings.filter(sr=>{
    const p=Math.min(1,(now-sr.born)/480);if(p>=1)return false;
    for(let i=0;i<3;i++){
      const dp=cl(p-i*0.12,0,1);if(dp<=0)continue;
      const r=sr.maxR*Math.pow(dp,0.50)*(1+i*0.22);
      const a=(1-dp)*(1-dp)*0.58*(1-i*0.18);if(a<0.01)continue;
      ctx.strokeStyle=hexA(sr.col,a);ctx.lineWidth=Math.max(0.5,2.2*(1-dp));
      ctx.shadowColor=sr.col;ctx.shadowBlur=10*(1-dp)*(1-i*0.25);
      ctx.beginPath();ctx.arc(sr.x,sr.y,r,0,Math.PI*2);ctx.stroke();
    }
    return true;
  });
  ctx.shadowBlur=0;ctx.restore();
}

// ─── 8. PARALLAX OVERLAY LAYERS ──────────────────────────────────────────────
function _drawParallax(t){
  const th=THEMES[curTheme];
  // Layer 1: slow drifting gradient clouds (opacity ~0.06)
  const l1x=(Math.sin(t*0.00018)*W*0.06)|0;
  const l1y=(Math.cos(t*0.00012)*H*0.04)|0;
  ctx.save();ctx.globalAlpha=0.06;
  const p1=ctx.createRadialGradient(W*0.3+l1x,H*0.4+l1y,0,W*0.3+l1x,H*0.4+l1y,Math.max(W,H)*0.5);
  p1.addColorStop(0,th.tm);p1.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=p1;ctx.fillRect(0,0,W,H);
  // Layer 2: opposite drift
  const l2x=(Math.cos(t*0.00022)*W*0.07)|0;
  const l2y=(Math.sin(t*0.00016)*H*0.05)|0;
  const p2=ctx.createRadialGradient(W*0.7+l2x,H*0.6+l2y,0,W*0.7+l2x,H*0.6+l2y,Math.max(W,H)*0.42);
  p2.addColorStop(0,th.ta);p2.addColorStop(1,'rgba(0,0,0,0)');
  ctx.globalAlpha=0.045;ctx.fillStyle=p2;ctx.fillRect(0,0,W,H);
  ctx.restore();
}
function drawGame(t){
  const newTh=getCurTheme();
  if(newTh!==curTheme){const _prevTh=curTheme;curTheme=newTh;gameBg=buildBg(curTheme);gameFx=initFx(curTheme);screenFlash=180;screenFlashCol=THEMES[curTheme].tm;floats.push(new FloatText(`🎨 ${THEMES[curTheme].name}`,W/2,H*0.45,THEMES[curTheme].tm,1.3,120));if(typeof _ensureVidPlaying==='function')_ensureVidPlaying(curTheme);if(typeof playThemeTransition==='function')playThemeTransition(curTheme);_themeChangeCount++;if(_themeChangeCount>=5)_unlockAchieve(5);_goVideoStarted=false;}
  // Score animé
  if(displayScore<score){const _gap=score-displayScore;const _rate=_gap>5000?0.22:_gap>1000?0.16:0.12;displayScore=Math.min(score,displayScore+Math.max(1,Math.ceil(_gap*_rate)));_hudScorePulse=Math.min(1,_hudScorePulse+0.15);}else if(!over){_hudScorePulse=Math.max(0,_hudScorePulse-0.05);}
  // Milestone celebration
  if(!over&&_nextMilestoneIdx<_MILESTONES.length&&score>=_MILESTONES[_nextMilestoneIdx]){
    const _msLbls=['1K','5K','10K','50K','100K'];const _msL=_msLbls[_nextMilestoneIdx]||String(_MILESTONES[_nextMilestoneIdx]);
    const _msVids=['milestone_1k','milestone_5k','milestone_10k','milestone_50k','milestone_100k'];
    if(_msVids[_nextMilestoneIdx]&&typeof playEventVideo==='function')playEventVideo(_msVids[_nextMilestoneIdx],false);
    _nextMilestoneIdx++;
    screenFlash=Math.max(screenFlash,200);screenFlashCol='#FFD700';
    shake=Math.max(shake,14);shakePow=Math.max(shakePow,5);
    floats.push(new FloatText(`🏆 ${_msL} !`,W/2,H*0.38,'#FFD700',2.2,200));
    floats.push(new FloatText('MILESTONE !',W/2,H*0.48,'#FFA020',1.3,160));
    sndBonus();
  }
  // Achievement #8 — score 100K
  if(score>=100000)_unlockAchieve(7);
  // Achievement #7 — 3 min continuous play
  if(!over&&gameStartTime>0&&Date.now()-gameStartTime>=180000)_unlockAchieve(6);
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
  if(!over&&_goExploded)_goExploded=false;
  if(shake>0){shake--;shakeX=rnd(-shakePow,shakePow)|0;shakeY=rnd(-shakePow,shakePow)|0;}else{shakeX=0;shakeY=0;}
  if(!drawThemeVideo(curTheme,shakeX,shakeY)&&!drawThemeBg(curTheme,shakeX,shakeY)){ctx.drawImage(gameBg,shakeX,shakeY);}
  if(typeof drawThemeTransition==='function')drawThemeTransition();
  _drawParallax(t);
  // Aurora borealis (Night, Cosmos)
  _drawAurora(t);
  // God rays (Jungle, Désert, Plage)
  _spawnGodRay();_drawGodRays();
  // Lensflare at 100K+
  _maybeSpawnLensFlare();_drawLensFlares();
  // Neon flicker update (Néopolis)
  _updateNeonFlicker(t);
  drawFx(ctx,gameFx,t);
  _drawWeather(t);
  // ── DUST MOTES — lazy-initialized ambient floating particles ──────────────
  if(!dustMotes.length){for(let _di=0;_di<30;_di++)dustMotes.push({x:rnd(0,W),y:rnd(0,H),vx:rnd(-0.14,0.14),vy:rnd(-0.28,-0.04),a:rnd(0.03,0.13),sz:rnd(0.6,1.8),ph:rnd(0,Math.PI*2)});}
  ctx.save();
  dustMotes.forEach(dm=>{dm.x=(dm.x+dm.vx+W)%W;dm.y=(dm.y+dm.vy+H)%H;const _dp=0.5+0.5*Math.sin(t*0.0013+dm.ph);ctx.fillStyle=`rgba(255,255,255,${(dm.a*_dp).toFixed(3)})`;ctx.beginPath();ctx.arc(dm.x,dm.y,dm.sz,0,Math.PI*2);ctx.fill();});
  ctx.restore();
  // ── 3D Perspective tilt when dragging ────────────────────────────────────────
  if(drag&&!over){_tiltX+=((mouseX-W/2)/W*0.018-_tiltX)*0.08;_tiltY+=((mouseY-H/2)/H*0.012-_tiltY)*0.06;}
  else{_tiltX*=0.88;_tiltY*=0.88;}
  // Subtle grid heartbeat scale (±0.8% breath)
  const _breathSc=1+0.008*Math.sin(t*0.0028);
  ctx.save();ctx.translate(shakeX,shakeY);
  {const _gCx=GRID_X+GW/2,_gCy=GRID_Y+GH/2;ctx.translate(_gCx,_gCy);ctx.scale(_breathSc,_breathSc);ctx.translate(-_gCx,-_gCy);}
  if(Math.abs(_tiltX)>0.0005||Math.abs(_tiltY)>0.0005){
    const _gCx=GRID_X+GW/2,_gCy=GRID_Y+GH/2;
    ctx.translate(_gCx,_gCy);ctx.transform(1,_tiltY,_tiltX,1,0,0);ctx.translate(-_gCx,-_gCy);
  }
  // Grid frame (glass effect)
  const b2=Math.max(4,CELL*0.1|0);
  const fg3=ctx.createLinearGradient(GRID_X-b2,GRID_Y-b2,GRID_X-b2,GRID_Y+GH+b2);
  fg3.addColorStop(0,hexA(th.sl,0.9));fg3.addColorStop(1,hexA(th.dc,0.9));
  // Score-level glow multiplier: 1× at 0, 2.5× at 100K+
  const _scoreGlowMul=1+Math.min(1.5,score/66666);
  // Danger heartbeat: grid pulses brighter when >80% full
  const _fillNow=grid.reduce((s,row)=>s+row.filter(Boolean).length,0)/(ROWS*COLS);
  const _dangerBeat=_fillNow>0.80?1+0.5*Math.abs(Math.sin(t*(_fillNow>0.92?0.022:0.014))):1;
  ctx.save();ctx.shadowColor=th.gridGlow||th.ta;ctx.shadowBlur=(8+4*Math.sin(t*0.001))*_scoreGlowMul*_dangerBeat;
  rrect(ctx,GRID_X-b2,GRID_Y-b2,GW+b2*2,GH+b2*2,CR+b2,fg3,th.gridBorder||th.sl,1.5);
  ctx.restore();
  // Extra score milestone ring (overlay outside grid frame when score >= 5000)
  if(score>=5000&&!over){
    const _tier=score>=100000?4:score>=50000?3:score>=10000?2:score>=5000?1:0;
    const _tierCols=['#60C0FF','#60FFB0','#FFD060','#FF8020','#FF40FF'];
    const _tierA=(0.18+0.12*Math.abs(Math.sin(t*0.0014)))*Math.min(1,_tier*0.35+0.35);
    ctx.save();ctx.shadowColor=_tierCols[_tier-1]||_tierCols[0];ctx.shadowBlur=10*_dangerBeat;
    rp(ctx,GRID_X-b2-2,GRID_Y-b2-2,GW+b2*4+4,GH+b2*4+4,CR+b2+2);
    ctx.strokeStyle=hexA(_tierCols[_tier-1]||_tierCols[0],_tierA);ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  // Grid corner decorations
  if(typeof drawGridCorner==='function'){const _csz=Math.min(GW,GH)*0.14|0;if(_csz>=10){ctx.save();ctx.globalAlpha=0.72;drawGridCorner(curTheme,GRID_X,GRID_Y,_csz,0);drawGridCorner(curTheme,GRID_X+GW,GRID_Y,_csz,Math.PI/2);drawGridCorner(curTheme,GRID_X,GRID_Y+GH,_csz,-Math.PI/2);drawGridCorner(curTheme,GRID_X+GW,GRID_Y+GH,_csz,Math.PI);ctx.restore();}}
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
  // Animated grid atmosphere — ambient pulse + subtle grid lines
  ctx.save();
  const _ambP=0.06+0.04*Math.sin(t*0.0012);
  const _ambG=ctx.createLinearGradient(GRID_X,GRID_Y,GRID_X,GRID_Y+GH*0.45);
  _ambG.addColorStop(0,hexA(th.ta,_ambP));_ambG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=_ambG;ctx.fillRect(GRID_X,GRID_Y,GW,GH*0.45);
  const _glP=0.022+0.012*Math.sin(t*0.0018);
  ctx.strokeStyle=hexA(th.sl,_glP);ctx.lineWidth=0.5;
  for(let _gr2=0;_gr2<=ROWS;_gr2++){ctx.beginPath();ctx.moveTo(GRID_X,GRID_Y+_gr2*CELL);ctx.lineTo(GRID_X+GW,GRID_Y+_gr2*CELL);ctx.stroke();}
  for(let _gc2=0;_gc2<=COLS;_gc2++){ctx.beginPath();ctx.moveTo(GRID_X+_gc2*CELL,GRID_Y);ctx.lineTo(GRID_X+_gc2*CELL,GRID_Y+GH);ctx.stroke();}
  ctx.restore();
  // Néopolis holographic depth lines (behind cells)
  _drawHolographic(t);
  // Cells
  const _parasiteSet=new Set(parasites.map(p=>p.r*100+p.c));
  for(let r=0;r<ROWS;r++){for(let c=0;c<COLS;c++){
    const x=GRID_X+c*CELL,y=GRID_Y+r*CELL,color=grid[r][c];
    // Spring pop animation for recently placed cells
    const popF=placedCellsMap.get(r*100+c);
    if(color){
      if(popF!==undefined&&popF<_SPRING.length){
        const sc=_SPRING[popF];const off=(CELL*(1-sc)/2)|0;
        // Placement glow halo — fades with spring animation
        const _glA=(1-popF/_SPRING.length)*0.52;
        if(_glA>0.03){const _gx=x+CELL/2,_gy=y+CELL/2;const _gg2=ctx.createRadialGradient(_gx,_gy,0,_gx,_gy,CELL*0.78);_gg2.addColorStop(0,hexA(color,_glA*0.9));_gg2.addColorStop(0.5,hexA(color,_glA*0.35));_gg2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=_gg2;ctx.fillRect(x-CELL*0.3,y-CELL*0.3,CELL*1.6,CELL*1.6);}
        drawCell(ctx,color,x+off,y+off,Math.ceil(CELL*sc),selSkin,t);
      } else drawCell(ctx,color,x,y,CELL,selSkin,t);
      // Star overlay
      if(gridStars[r][c]){const sfsz=Math.max(8,CELL*0.38)|0;ctx.save();ctx.font=`${sfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.globalAlpha=0.9;ctx.fillStyle='#FFE030';ctx.shadowColor='#FFD700';ctx.shadowBlur=7;ctx.fillText('★',x+CELL/2,y+CELL/2);ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();}
      // Bonus overlay
      if(gridBonus[r][c]){const bsz=Math.max(10,CELL*0.72)|0;ctx.globalAlpha=0.93;if(gridBonus[r][c]==='bomb')drawBombIcon(ctx,x+CELL/2,y+CELL/2,bsz);else drawX2Icon(ctx,x+CELL/2,y+CELL/2,bsz);ctx.globalAlpha=1;}
      // Parasite overlay (if this cell is an active parasite source)
      if(_parasiteSet.has(r*100+c)){drawParasiteOverlay(ctx,x,y,CELL,t,r*17+c*31);}
    }else{
      // Empty cell — frosted glass with animated inner glow
      const er=Math.max(2,CELL/6|0);
      // Base: diagonal frosted fill
      const _efg=ctx.createLinearGradient(x+2,y+2,x+CELL-2,y+CELL-2);
      _efg.addColorStop(0,hexA(th.sl,0.10));_efg.addColorStop(1,hexA(th.ge,0.24));
      rp(ctx,x+2,y+2,CELL-4,CELL-4,er);ctx.fillStyle=_efg;ctx.fill();
      // Animated inner glow (position-offset phase for ripple feel)
      const _eig=ctx.createRadialGradient(x+CELL*0.38,y+CELL*0.32,0,x+CELL/2,y+CELL/2,CELL*0.52);
      _eig.addColorStop(0,hexA(th.sl,0.07+0.04*Math.abs(Math.sin(t*0.0016+(x+y)*0.002))));_eig.addColorStop(1,'rgba(0,0,0,0)');
      rp(ctx,x+2,y+2,CELL-4,CELL-4,er);ctx.fillStyle=_eig;ctx.fill();
      // Top-left glass reflection
      const _etg=ctx.createLinearGradient(x+2,y+2,x+CELL*0.55,y+CELL*0.42);
      _etg.addColorStop(0,'rgba(255,255,255,0.07)');_etg.addColorStop(1,'rgba(255,255,255,0)');
      rp(ctx,x+2,y+2,CELL-4,CELL-4,er);ctx.fillStyle=_etg;ctx.fill();
      // Border with subtle glow
      rp(ctx,x+2,y+2,CELL-4,CELL-4,er);ctx.strokeStyle=hexA(th.sl,0.16);ctx.lineWidth=1;ctx.stroke();
      // Center dot
      ctx.fillStyle=hexA(th.sl,0.15);ctx.beginPath();ctx.arc(x+CELL/2,y+CELL/2,Math.max(1,CELL*0.055),0,Math.PI*2);ctx.fill();
    }
  }}
  // Corner sparks on freshly placed cells
  _drawFreshCornerSparks();
  // Prismatic shimmer — Crystal skin
  _drawCrystalShimmer(t);
  // Combo fire cell overlay (combo ≥ 5)
  _drawComboFireCells(t);
  // Combo glowing grid dividers (combo ≥ 3)
  _drawComboGridLines(t);
  // Cosmos nebula drift
  _drawCosmosnNebula(t);
  // Rhythm heartbeat pulse
  _drawRhythmPulse(t);
  // Volcano eruption gust
  _spawnVolcanoGust();
  // Snow accumulation on Arctic grid bottom
  _updateSnowAccum(t);
  // Ambient grid mist
  _drawGridMist(t);
  // Grid pulse wave from recent placements
  _drawGridWave(t);
  // Power cell zap arcs (star ↔ X2 adjacent cells)
  _drawPowerZaps(t);
  // Almost-clear row/col golden highlight
  _drawAlmostClear(t);
  // Persistent halos on freshly placed cells
  _drawFreshHalos();
  _drawStampRings();
  // Landing column flash (brief streak down columns of placed piece)
  _drawLandingFlashes();
  // Snow accumulation display (Arctic theme)
  _drawSnowAccum();
  // Depth fog at grid bottom (Ocean/Arctic)
  _drawDepthFog(t);
  // Ocean column drips
  _updateColDrips();_drawColDrips();
  // Heat shimmer (Volcano)
  _drawHeatShimmer(t);
  // Floor glow effect below grid
  _drawFloorEffect(t);
  // Stress cracks on overcrowded grid
  {const _fr=grid.reduce((s,row)=>s+row.filter(Boolean).length,0)/(ROWS*COLS);_drawStressCracks(_fr);}
  // Update pop animations (O(1) per entry)
  placedCellsMap.forEach((f,k)=>{if(f+1>=_SPRING.length)placedCellsMap.delete(k);else placedCellsMap.set(k,f+1);});
  // Clear line sweep animations — Apple-style: flash + bright sweep + glow trail
  clearAnims=clearAnims.filter(a=>{
    const dur=520;
    const p=Math.min(1,(Date.now()-a.born)/dur);
    if(p>=1)return false;
    const eased=p<0.5?2*p*p:1-Math.pow(-2*p+2,2)/2; // ease-in-out quad
    const ring=Math.sin(p*Math.PI);
    // ── IMPACT FLASH — full-row/column white blaze at moment of clear ─────────
    if(p<0.22){
      const _sf=1-(p/0.22);
      const _fRows=[...new Set(a.cells.map(_fc=>_fc.r))],_fCols=[...new Set(a.cells.map(_fc=>_fc.c))];
      ctx.save();ctx.shadowColor='#FFFFFF';ctx.shadowBlur=CELL*0.9*_sf;
      _fRows.forEach(_r=>{const _fg=ctx.createLinearGradient(GRID_X,0,GRID_X+GW,0);_fg.addColorStop(0,'rgba(255,255,255,0)');_fg.addColorStop(0.1,`rgba(255,255,255,${(_sf*0.95).toFixed(3)})`);_fg.addColorStop(0.5,`rgba(255,255,255,${_sf.toFixed(3)})`);_fg.addColorStop(0.9,`rgba(255,255,255,${(_sf*0.95).toFixed(3)})`);_fg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=_fg;ctx.fillRect(GRID_X,GRID_Y+_r*CELL,GW,CELL);});
      _fCols.forEach(_c=>{const _fg=ctx.createLinearGradient(0,GRID_Y,0,GRID_Y+GH);_fg.addColorStop(0,'rgba(255,255,255,0)');_fg.addColorStop(0.1,`rgba(255,255,255,${(_sf*0.82).toFixed(3)})`);_fg.addColorStop(0.5,`rgba(255,255,255,${(_sf*0.88).toFixed(3)})`);_fg.addColorStop(0.9,`rgba(255,255,255,${(_sf*0.82).toFixed(3)})`);_fg.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=_fg;ctx.fillRect(GRID_X+_c*CELL,GRID_Y,CELL,GH);});
      ctx.shadowBlur=0;ctx.restore();
    }
    // Phase 1 (0-0.5): individual cells pulse + glow
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
    // Spotlight: subtle radial darkening outside dragged piece focus area
    {const sg=ctx.createRadialGradient(mouseX,mouseY,CELL*1.2,mouseX,mouseY,Math.max(W,H)*0.7);
    sg.addColorStop(0,'rgba(0,0,0,0)');sg.addColorStop(1,'rgba(0,0,0,0.22)');
    ctx.save();ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);ctx.restore();}
    const piece=tray[drag.idx];
    if(piece){
      const{gr,gc}=snapPos(mouseX,mouseY,piece.shape);
      const valid=_modeCanPlace(grid,piece.shape,gr,gc);
      const ghostColor=valid?piece.color:'#FF4040';
      // Ghost afterimage trail (fading previous positions)
      if(valid)_addGhostTrail(piece.shape,gr,gc,piece.color);
      _drawGhostTrail(t);
      // Column highlight — subtle pulse under ghost columns
      const hlA=(0.06+0.03*Math.sin(Date.now()*0.004)).toFixed(3);
      ctx.save();ctx.fillStyle=`rgba(255,255,255,${hlA})`;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pc2=gc+cc;if(pc2>=0&&pc2<COLS)ctx.fillRect(GRID_X+pc2*CELL,GRID_Y,CELL,GH);}}));
      ctx.restore();
      // Altitude-based shadow on grid: grows as piece is held higher above snap position
      const _altDist=Math.max(0,mouseY-(GRID_Y+(gr+piece.shape.length/2)*CELL));
      const _altA=cl(_altDist/(CELL*4),0,0.45);
      if(_altA>0.01){ctx.save();ctx.globalAlpha=_altA;
        piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pr2=gr+rr,pc2=gc+cc;
          if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS){
            const _sx=GRID_X+pc2*CELL+CELL*0.08,_sy=GRID_Y+pr2*CELL+CELL*0.08;
            const _sg=ctx.createRadialGradient(_sx+CELL*0.4,_sy+CELL*0.4,0,_sx+CELL*0.4,_sy+CELL*0.4,CELL*0.7);
            _sg.addColorStop(0,'rgba(0,0,0,0.5)');_sg.addColorStop(1,'rgba(0,0,0,0)');
            ctx.fillStyle=_sg;ctx.fillRect(_sx,_sy,CELL,CELL);
          }
        }}));ctx.restore();}
      // Ambient glow under ghost cells
      ctx.save();ctx.shadowColor=ghostColor;ctx.shadowBlur=CELL*0.65;ctx.globalAlpha=0.20;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pr2=gr+rr,pc2=gc+cc;
        if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS){const er=Math.max(2,CELL/6|0);rrect(ctx,GRID_X+pc2*CELL+2,GRID_Y+pr2*CELL+2,CELL-4,CELL-4,er,ghostColor,null);}
      }}));ctx.restore();
      // Ghost cells (translucent) with snap bounce scale
      const _snapSc=valid?_updateSnapBounce(gr,gc):1;
      ctx.globalAlpha=valid?0.38:0.28;
      piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pr2=gr+rr,pc2=gc+cc;
        if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS){
          if(_snapSc>1.001){
            const _gx=GRID_X+pc2*CELL+CELL/2,_gy=GRID_Y+pr2*CELL+CELL/2;
            const _gOff=CELL*(_snapSc-1)/2;
            ctx.save();ctx.translate(_gx,_gy);ctx.scale(_snapSc,_snapSc);ctx.translate(-_gx,-_gy);
            drawCell(ctx,ghostColor,GRID_X+pc2*CELL-_gOff,GRID_Y+pr2*CELL-_gOff,CELL*_snapSc,selSkin,t);
            ctx.restore();
          }else drawCell(ctx,ghostColor,GRID_X+pc2*CELL,GRID_Y+pr2*CELL,CELL,selSkin,t);
        }
      }}));
      ctx.globalAlpha=1;
      // ── Snap lock indicator — pulsing corner brackets on valid drop zone ──────
      if(valid){
        const _slT=0.55+0.45*Math.sin(Date.now()*0.009);
        const _slSz=Math.max(4,CELL*0.22)|0;
        ctx.save();ctx.strokeStyle=hexA(piece.color,0.85*_slT);ctx.lineWidth=2;
        ctx.shadowColor=piece.color;ctx.shadowBlur=8*_slT;
        piece.shape.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const pr2=gr+rr,pc2=gc+cc;
          if(pr2>=0&&pr2<ROWS&&pc2>=0&&pc2<COLS){
            const _sx=GRID_X+pc2*CELL,_sy=GRID_Y+pr2*CELL,_sc=CELL;
            // Four corner L-brackets
            ctx.beginPath();ctx.moveTo(_sx+_slSz,_sy);ctx.lineTo(_sx,_sy);ctx.lineTo(_sx,_sy+_slSz);ctx.stroke();
            ctx.beginPath();ctx.moveTo(_sx+_sc-_slSz,_sy);ctx.lineTo(_sx+_sc,_sy);ctx.lineTo(_sx+_sc,_sy+_slSz);ctx.stroke();
            ctx.beginPath();ctx.moveTo(_sx,_sy+_sc-_slSz);ctx.lineTo(_sx,_sy+_sc);ctx.lineTo(_sx+_slSz,_sy+_sc);ctx.stroke();
            ctx.beginPath();ctx.moveTo(_sx+_sc-_slSz,_sy+_sc);ctx.lineTo(_sx+_sc,_sy+_sc);ctx.lineTo(_sx+_sc,_sy+_sc-_slSz);ctx.stroke();
          }
        }}));
        ctx.restore();
      }
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
  // Tray slide-in animation — pieces slide up + fade in when a new tray appears
  const _trayAge=trayRefreshT>0?Date.now()-trayRefreshT:99999;
  const _trayT=Math.min(1,_trayAge/380);
  // Ease-out cubic: 1-(1-t)^3
  const _trayEased=1-Math.pow(1-_trayT,3);
  const _trayFade=_trayEased;
  const _traySlideY=((1-_trayEased)*TRAY_H*0.45)|0;
  // Tray slot piece color radiance
  _drawTrayRadiance();
  // Tray speed glow (color border based on think time)
  _drawTraySpeedGlow(t);
  // Danger tray pulse — extra red glow when grid is near-full
  if(_fillNow>0.85&&!over){
    const _dp=((_fillNow-0.85)/0.15);const _dpPulse=0.5+0.5*Math.abs(Math.sin(t*0.016*_dp+0.7));
    ctx.save();ctx.shadowColor=`rgba(255,30,0,${(_dp*0.9).toFixed(3)})`;ctx.shadowBlur=CELL*_dp*_dpPulse*2;
    ctx.strokeStyle=`rgba(255,30,0,${(_dp*0.6*_dpPulse).toFixed(3)})`;ctx.lineWidth=2;
    rp(ctx,GRID_X-1,TRAY_Y-1,GW+2,TRAY_H+2,CR+1);ctx.stroke();ctx.restore();
  }
  // Tray (glass)
  rrect(ctx,GRID_X,TRAY_Y,GW,TRAY_H,CR,th.trayBg||hexA(th.gbg,0.55),hexA(th.dc,0.5),1);
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
    const _bobY=(_trayT>=1&&!dim)?(Math.sin(Date.now()*0.0024+i*2.09)*PIECE_CELL*0.13)|0:0;
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
      // Tray slot hover glow (mouse over slot, not dragging)
      if(!drag){const _thov=mouseX>=GRID_X+i*pw&&mouseX<GRID_X+(i+1)*pw&&mouseY>=TRAY_Y&&mouseY<TRAY_Y+TRAY_H;
        if(_thov){const _hp=0.5+0.5*Math.abs(Math.sin(Date.now()*0.009));
          ctx.save();ctx.globalAlpha=0.36*_hp;ctx.shadowColor=piece.color;ctx.shadowBlur=PIECE_CELL*1.4*_hp;
          sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)drawCell(ctx,piece.color,ox+cc*PIECE_CELL,(oy+rr*PIECE_CELL+_bobY)|0,PIECE_CELL,selSkin,t);}));
          ctx.shadowBlur=0;ctx.restore();}}
      // Slide-in: fade + rise from below tray
      ctx.save();ctx.globalAlpha=_trayFade*(dim?0.3:1);
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v)drawCell(ctx,piece.color,ox+cc*PIECE_CELL,(oy+rr*PIECE_CELL+_traySlideY+_bobY)|0,PIECE_CELL,selSkin,t);}));
      ctx.restore();
    }
  }
  // ── Aperçu 2 prochains blocs ─────────────────────────────────────────────
  // Hide preview when bonus banner is active (avoids overlap at bottom of screen)
  if(nextTrayPreview&&!showAddCellsBonus){
    const pvY=TRAY_Y+TRAY_H+4;
    // Cap height so it never overflows the screen on small devices
    const pvH=Math.min(Math.max((CELL*1.3)|0,44),Math.max(12,H-pvY-2));
    if(pvH>12){
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
    } // end if(pvH>12)
  }
  ctx.restore();
  // Rotation flash rings
  _drawRotFlashes();
  // Drag trail — spawn energy particles + render behind piece each frame
  // Combo fire trail at combo ≥ 5
  if(drag&&!over){const _dtp=tray[drag.idx];const _trailRate=combo>=5?0.72:0.50;if(_dtp&&Math.random()<_trailRate){const _trailCol=combo>=5?rndc(['#FF6020','#FF9020','#FFCC40','#FF3010']):_dtp.color;dragTrail.push({x:mouseX+rnd(-CELL*0.18,CELL*0.18),y:mouseY+rnd(-CELL*0.10,CELL*0.10),vx:rnd(-0.30,0.30),vy:rnd(-0.90,-0.10),life:combo>=5?28:20,ml:combo>=5?28:20,color:_trailCol,sz:rnd(combo>=5?2:1.5,combo>=5?5:3.5)});}}
  dragTrail=dragTrail.filter(dt=>{dt.x+=dt.vx;dt.y+=dt.vy;dt.vy-=0.05;dt.life--;if(dt.life<=0)return false;const _da=dt.life/dt.ml;ctx.fillStyle=hexA(dt.color,_da*0.60);ctx.beginPath();ctx.arc(dt.x,dt.y,Math.max(1,dt.sz*_da),0,Math.PI*2);ctx.fill();return true;});
  // Dragged piece (on top, no shake) + speed timer indicator
  if(drag&&!over){
    const piece=tray[drag.idx];
    if(piece){
      const _liftScale=1.08;const _liftCell=Math.ceil(CELL*_liftScale);
      const sh=piece.shape,ox=(mouseX-sh[0].length*_liftCell/2)|0,oy=(mouseY-sh.length*_liftCell/2-CELL*0.22)|0;
      // Drop shadow — layered: color aura glow + dark drop shadow
      ctx.save();
      // Color aura behind lifted piece (drawn first, below piece)
      ctx.globalAlpha=0.20;
      sh.forEach((line,rr)=>line.forEach((v,cc)=>{if(v){const _ax=ox+cc*_liftCell+_liftCell/2,_ay=oy+rr*_liftCell+_liftCell/2+CELL*0.20;const _ag=ctx.createRadialGradient(_ax,_ay,0,_ax,_ay,_liftCell*0.70);_ag.addColorStop(0,piece.isParasite?'#00FF50':piece.color);_ag.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=_ag;ctx.fillRect(_ax-_liftCell,_ay-_liftCell,_liftCell*2,_liftCell*2);}}));
      ctx.globalAlpha=1;
      // Dark drop shadow + draw piece
      ctx.shadowColor='rgba(0,0,0,0.62)';ctx.shadowBlur=CELL*0.58;ctx.shadowOffsetX=CELL*0.04;ctx.shadowOffsetY=CELL*0.28;
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
  // Impact ripples — expanding rings from block placements and bomb blasts
  ripples=ripples.filter(ri=>{ri.life--;if(ri.life<=0)return false;const _rp=1-ri.life/ri.ml;ri.r=ri.maxR*_rp;const _ra=(ri.life/ri.ml)*0.55;ctx.save();ctx.strokeStyle=hexA(ri.color,_ra);ctx.lineWidth=Math.max(1,3.5*(1-_rp));ctx.shadowColor=ri.color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(ri.x,ri.y,ri.r,0,Math.PI*2);ctx.stroke();ctx.shadowBlur=0;ctx.restore();return true;});
  // Particles + Debris
  particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.13;p.life--;if(p.life<=0)return false;const ratio=p.life/p.ml,sz=Math.max(1,p.size*ratio);ctx.fillStyle=hexA(p.color,0.82*ratio);if(p.circle){ctx.beginPath();ctx.arc(p.x,p.y,sz,0,Math.PI*2);ctx.fill();}else ctx.fillRect(p.x-sz,p.y-sz,sz*2,sz*2);return true;});
  debris=debris.filter(d=>{d.draw(ctx);return d.update();});
  if(floats.length>40)floats.splice(0,floats.length-40);
  if(gameState!=='pause'){floats=floats.filter(f=>{f.draw(ctx);return f.update();});}else{floats=floats.filter(f=>f.update());}
  // Line clear video overlay — brief flash over grid area
  if(typeof drawEventVideo==='function')drawEventVideo('line_clear',0.60,GRID_X,GRID_Y,GW,GH);
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
  // Fill danger meter — vertical bar on right edge of grid
  if(!over&&_fillNow>0.5){
    const _dmH=GH*_fillNow;const _dmY=GRID_Y+GH-_dmH;const _dmX=GRID_X+GW+b2+2;const _dmW=3;
    const _dmCol=_fillNow>0.90?'#FF2020':_fillNow>0.75?'#FF8020':'#FFD700';
    const _dmPulse=_fillNow>0.75?0.6+0.4*Math.abs(Math.sin(t*0.012)):1;
    ctx.save();ctx.globalAlpha=0.60*_dmPulse;
    ctx.fillStyle=_dmCol;ctx.shadowColor=_dmCol;ctx.shadowBlur=4;
    ctx.fillRect(_dmX,_dmY,_dmW,_dmH);
    ctx.restore();
  }
  // Combo color grading
  _drawComboGrade();
  // Lightning grid at 100K+
  _maybeSpawnLightning(t);_drawLightnings();
  // Rainbow hue-shift glory overlay at 100K+
  _drawRainbowGlory(t);
  // Electricity arcs on grid border at combo ≥ 4
  _drawElectricityBorder(t);
  // Combo energy beam from last placed piece to HUD score
  _drawComboBeam(t);
  // Chromatic aberration on heavy shake
  _drawChromaticAb();
  // Néopolis CRT scanlines
  _drawScanlines();
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
    const _bpR=Math.min(CR*3,20);
    rrect(ctx,px3,py3,pw3,ph3,_bpR,ppg,null);
    // Gold border
    const pbord=ctx.createLinearGradient(px3,py3,px3+pw3,py3+ph3);
    pbord.addColorStop(0,'#FFE040');pbord.addColorStop(0.5,'#FFA000');pbord.addColorStop(1,'#FFE040');
    rp(ctx,px3,py3,pw3,ph3,_bpR);ctx.strokeStyle=pbord;ctx.lineWidth=2;ctx.stroke();
    // Shine top
    const psh=ctx.createLinearGradient(px3,py3,px3,py3+ph3*0.35);
    psh.addColorStop(0,'rgba(255,255,255,0.1)');psh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,px3,py3,pw3,ph3*0.35,_bpR);ctx.fillStyle=psh;ctx.fill();
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
      rrect(ctx,sx+3,sy+3,slotW-6,slotH-6,Math.min(CR*2,12),slBg,ishov?hexA('#FFD700',0.6):hexA('#FFFFFF',0.15),ishov?1.5:0.8);
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
    const _scR=Math.min(CR*3,20);
    rrect(ctx,scpX,scpY,scpW,scpH,_scR,spg,null);
    const spsh=ctx.createLinearGradient(scpX,scpY,scpX,scpY+scpH*0.35);
    spsh.addColorStop(0,'rgba(255,255,255,0.11)');spsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,scpX,scpY,scpW,scpH*0.35,_scR);ctx.fillStyle=spsh;ctx.fill();
    rp(ctx,scpX,scpY,scpW,scpH,_scR);ctx.strokeStyle=hexA(th.dc,0.7);ctx.lineWidth=2;ctx.stroke();
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
    // Reset animated score counter when panel first appears
    if(el<80){_goDisplayScore=0;_goRecBurst=false;if(!_goVideoStarted){_goVideoStarted=true;if(typeof startGameoverVideo==='function')startGameoverVideo(curTheme);}if(!_goExploded){_goExploded=true;_triggerBoardExplosion();}}
    const isRec=score>=best&&score>0;
    // Count up score display on game over screen
    if(_goDisplayScore<score){const _gg=score-_goDisplayScore;_goDisplayScore=Math.min(score,_goDisplayScore+Math.max(1,Math.ceil(_gg*(el<1400?0.055:0.20))));}
    // New record particle burst (one-time when count reaches final score)
    if(_goDisplayScore>=score&&!_goRecBurst&&isRec){_goRecBurst=true;for(let _i=0;_i<70;_i++){particles.push({x:W/2,y:H*0.42,vx:rnd(-7,7),vy:rnd(-9,-1),color:rndc(['#FFD700','#FF8C00','#FFEE60','#FFA020','#FFFFFF','#FF4080']),size:rnd(3,7),life:rnd(50,90),ml:90,circle:Math.random()>0.35});}if(typeof playEventVideo==='function')playEventVideo('celebration',false);}
    ctx.fillStyle=`rgba(0,0,0,${Math.min(0.84,el/600*0.84).toFixed(3)})`;ctx.fillRect(0,0,W,H);
    if(typeof drawGameoverVideo==='function')drawGameoverVideo(curTheme,0.40);
    if(isRec&&typeof drawEventVideo==='function')drawEventVideo('celebration',0.50);
    if(el>350){
      const pw2=Math.min(W-24,390),ph2=Math.round(H*0.62);
      const px=(W-pw2)/2,py=(H-ph2)/2-10;
      // Panel glass
      const pg2=ctx.createLinearGradient(px,py,px,py+ph2);
      pg2.addColorStop(0,hexA(th.gbg,0.97));pg2.addColorStop(1,hexA(th.bg,0.94));
      const _goR=Math.min(CR*3,20);
      rrect(ctx,px,py,pw2,ph2,_goR,pg2,null);
      // Panel shine
      const psg=ctx.createLinearGradient(px,py,px,py+ph2*0.35);
      psg.addColorStop(0,'rgba(255,255,255,0.13)');psg.addColorStop(1,'rgba(255,255,255,0)');
      rp(ctx,px,py,pw2,ph2*0.35,_goR);ctx.fillStyle=psg;ctx.fill();
      // Border: gold pulse on record, subtle otherwise
      if(isRec){ctx.save();ctx.shadowColor='#FFD700';ctx.shadowBlur=18+7*Math.abs(Math.sin(Date.now()*0.003));rp(ctx,px,py,pw2,ph2,_goR);ctx.strokeStyle=hexA('#FFD700',0.60);ctx.lineWidth=2;ctx.stroke();ctx.restore();}
      else{rp(ctx,px,py,pw2,ph2,_goR);ctx.strokeStyle=hexA(th.dc,0.7);ctx.lineWidth=2;ctx.stroke();}
      // Title
      const goSz=cl(pw2*0.12|0,16,40);
      drawPremText(ctx,'GAME OVER',W/2,py+ph2*0.14,`bold ${goSz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`,'#FF6040','#CC2010','rgba(0,0,0,0.6)','#FF4020',18,3);
      ctx.textAlign='center';ctx.textBaseline='middle';
      // Animated score reveal (fades in + counts up)
      const _revealA=Math.min(1,(el-350)/500);
      const scSz=cl(pw2*0.088|0,14,32);
      ctx.globalAlpha=_revealA;
      if(isRec){
        const _rpulse=0.94+0.06*Math.abs(Math.sin(Date.now()*0.005));
        ctx.save();ctx.translate(W/2,py+ph2*0.33);ctx.scale(1,_rpulse);ctx.translate(-W/2,0);
        drawPremText(ctx,`★  ${_goDisplayScore}  ★`,W/2,0,`bold ${scSz*1.15}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`,'#FFEE60','#FFA020','rgba(0,0,0,0.5)','#FFCC00',16,2.5);
        ctx.restore();
      }else{
        ctx.font=`bold ${scSz*1.1}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;
        const _sg2=ctx.createLinearGradient(0,py+ph2*0.26,0,py+ph2*0.40);
        _sg2.addColorStop(0,th.tm);_sg2.addColorStop(1,th.ta);
        ctx.fillStyle=_sg2;ctx.shadowColor=th.tm;ctx.shadowBlur=10;
        ctx.fillText(`${_goDisplayScore}`,W/2,py+ph2*0.33);ctx.shadowBlur=0;
      }
      ctx.globalAlpha=1;
      // Record label / best score
      const recSz=cl(scSz*0.78|0,9,20);
      ctx.font=`bold ${recSz}px system-ui,-apple-system,"SF Pro Display",Arial`;
      if(isRec){
        ctx.save();ctx.shadowColor='#FFD700';ctx.shadowBlur=10+4*Math.abs(Math.sin(Date.now()*0.004));
        ctx.fillStyle='#FFD700';ctx.fillText('✨ NOUVEAU RECORD !',W/2,py+ph2*0.46);
        ctx.shadowBlur=0;ctx.restore();
      }else{
        ctx.fillStyle=hexA(th.ta,0.85);ctx.fillText(`Meilleur : ${best}`,W/2,py+ph2*0.46);
      }
      // Stats line
      const stSz=cl(scSz*0.60|0,7,13);
      ctx.font=`${stSz}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.tg,0.80);
      const elapsed=Date.now()-gameStartTime;
      ctx.fillText(`⏱ ${Math.floor(elapsed/60000)}:${String(Math.floor(elapsed%60000/1000)).padStart(2,'0')}  ·  📊 ${totalLinesCleared} lignes  ·  ×${maxComboGame} max`,W/2,py+ph2*0.56);
      // Mini bar chart
      if(scoreHistory.length>1){
        const barsH=ph2*0.08,barsW=pw2*0.52,barsX=px+(pw2-barsW)/2,barsY=py+ph2*0.65;
        const maxV=Math.max(...scoreHistory,1);
        const bw3=Math.floor(barsW/scoreHistory.length)-3;
        scoreHistory.forEach((sv,si)=>{
          const bh3=Math.max(3,Math.round(barsH*(sv/maxV)));
          const bx3=barsX+si*(bw3+3);const by3=barsY+barsH-bh3;
          const isCur=si===scoreHistory.length-1;
          ctx.fillStyle=isCur?th.tm:hexA(th.tg,0.42);
          rrect(ctx,bx3,by3,bw3,bh3,2,ctx.fillStyle,null);
        });
        const lsz3=Math.max(6,stSz*0.85)|0;
        ctx.font=`${lsz3}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.tg,0.50);
        ctx.textAlign='left';ctx.fillText('historique',barsX,barsY-2);ctx.textAlign='center';
      }
      // ── Boutons REJOUER + MENU ────────────────────────────────────────────────
      const _btnH=cl(Math.round(ph2*0.115),36,52),_btnW=Math.floor((pw2-48)/2);
      const _btn1X=px+14,_btn2X=px+pw2-14-_btnW,_btnY=py+ph2-_btnH-14;
      // REJOUER button
      const _r1g=ctx.createLinearGradient(_btn1X,_btnY,_btn1X,_btnY+_btnH);
      _r1g.addColorStop(0,lerpC(th.ta,'#ffffff',0.15));_r1g.addColorStop(1,lerpC(th.ta,'#000000',0.40));
      ctx.save();ctx.shadowColor=th.ta;ctx.shadowBlur=10+5*Math.abs(Math.sin(Date.now()*0.004));
      rrect(ctx,_btn1X,_btnY,_btnW,_btnH,_btnH/2,_r1g,null);
      const _rsh1=ctx.createLinearGradient(_btn1X,_btnY,_btn1X,_btnY+_btnH*0.45);
      _rsh1.addColorStop(0,'rgba(255,255,255,0.28)');_rsh1.addColorStop(1,'rgba(255,255,255,0)');
      rp(ctx,_btn1X+2,_btnY+2,_btnW-4,_btnH*0.45,_btnH/2);ctx.fillStyle=_rsh1;ctx.fill();
      rp(ctx,_btn1X,_btnY,_btnW,_btnH,_btnH/2);ctx.strokeStyle=hexA(th.tm,0.60);ctx.lineWidth=1.5;ctx.stroke();
      ctx.shadowBlur=0;
      const _bfsz=cl(Math.floor(_btnH*0.44),10,19);
      drawPremText(ctx,'▶ REJOUER',_btn1X+_btnW/2,_btnY+_btnH/2,`bold ${_bfsz}px system-ui,-apple-system,"SF Pro Display",Arial`,'#FFFFFF',hexA(th.tm,0.7),'rgba(0,0,0,0.4)',th.ta,6,1.5);
      ctx.restore();
      _goReplayRect={x:_btn1X,y:_btnY,w:_btnW,h:_btnH};
      // MENU button
      const _r2g=ctx.createLinearGradient(_btn2X,_btnY,_btn2X,_btnY+_btnH);
      _r2g.addColorStop(0,'#2c2c3e');_r2g.addColorStop(1,'#14141f');
      ctx.save();
      rrect(ctx,_btn2X,_btnY,_btnW,_btnH,_btnH/2,_r2g,null);
      const _rsh2=ctx.createLinearGradient(_btn2X,_btnY,_btn2X,_btnY+_btnH*0.45);
      _rsh2.addColorStop(0,'rgba(255,255,255,0.13)');_rsh2.addColorStop(1,'rgba(255,255,255,0)');
      rp(ctx,_btn2X+2,_btnY+2,_btnW-4,_btnH*0.45,_btnH/2);ctx.fillStyle=_rsh2;ctx.fill();
      rp(ctx,_btn2X,_btnY,_btnW,_btnH,_btnH/2);ctx.strokeStyle='rgba(255,255,255,0.22)';ctx.lineWidth=1.5;ctx.stroke();
      ctx.shadowBlur=0;
      drawPremText(ctx,'🏠 MENU',_btn2X+_btnW/2,_btnY+_btnH/2,`bold ${_bfsz}px system-ui,-apple-system,"SF Pro Display",Arial`,'rgba(255,255,255,0.92)','rgba(200,200,220,0.70)','rgba(0,0,0,0.4)','rgba(200,200,255,0.45)',4,1.5);
      ctx.restore();
      _goMenuRect={x:_btn2X,y:_btnY,w:_btnW,h:_btnH};
      ctx.textAlign='left';ctx.textBaseline='alphabetic';
    }
  }
  // ── COMBO STREAK BADGE ───────────────────────────────────────────────────────
  if(combo>=3&&!over){
    const _cbPulse=0.88+0.12*Math.abs(Math.sin(t*0.016));
    const _cbfsz=cl(Math.floor(CELL*0.72*_cbPulse),16,36)|0;
    const _cbtxt=`🔥 COMBO ×${combo}`;
    // Portrait: show combo badge inside grid top (HUD fills above-grid space)
    // Landscape: show above grid in the available margin
    const _cbX=GRID_X+GW/2,_cbY=(H>W)?GRID_Y+_cbfsz*0.9:GRID_Y-_cbfsz*0.7;
    const _cbCol=combo>=6?'#FF40A0':combo>=4?'#FFA020':th.hi||th.tm;
    const _cbShad=combo>=6?'#FF2080':combo>=4?'#FF8000':th.tm;
    ctx.save();
    ctx.translate(_cbX,_cbY);
    // Scale bounce for big combos
    const _cbScale=combo>=6?1.0+0.08*Math.abs(Math.sin(t*0.022)):1.0;
    ctx.scale(_cbScale,_cbScale);
    // Starburst rays behind text (combo >= 5)
    if(combo>=5){
      const _cbRays=combo>=8?12:8;
      const _cbRayLen=_cbfsz*(combo>=8?2.2:1.6);
      ctx.save();ctx.rotate(t*0.008);
      for(let ri=0;ri<_cbRays;ri++){
        const ang=ri*(Math.PI*2/_cbRays);
        const rl=_cbRayLen*(ri%2===0?1:0.6);
        const ra=(combo>=8?0.35:0.22)*_cbPulse;
        const rg=ctx.createLinearGradient(0,0,Math.cos(ang)*rl,Math.sin(ang)*rl);
        rg.addColorStop(0,combo>=6?`rgba(255,40,128,${ra})`:`rgba(255,128,0,${ra})`);
        rg.addColorStop(1,'rgba(0,0,0,0)');
        ctx.strokeStyle=rg;ctx.lineWidth=combo>=8?2.5:1.8;
        ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(Math.cos(ang)*rl,Math.sin(ang)*rl);ctx.stroke();
      }
      ctx.restore();
      // Outer glow ring
      const _cbRing=ctx.createRadialGradient(0,0,_cbfsz*0.4,0,0,_cbfsz*1.4);
      _cbRing.addColorStop(0,combo>=6?'rgba(255,40,128,0.18)':'rgba(255,128,0,0.15)');
      _cbRing.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=_cbRing;ctx.beginPath();ctx.arc(0,0,_cbfsz*1.4,0,Math.PI*2);ctx.fill();
    }
    ctx.font=`bold ${_cbfsz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=_cbShad;ctx.shadowBlur=_cbfsz*(combo>=6?1.1:0.7);
    ctx.globalAlpha=0.94;
    ctx.fillStyle=_cbCol;
    ctx.fillText(_cbtxt,0,0);
    ctx.restore();
  }
  // ── PLACEMENT STREAK BADGE ──────────────────────────────────────────────────
  if(_placementStreak>=2&&!over&&gameState==='playing'){
    const _stfsz=Math.max(9,CELL*0.34)|0;
    const _stxt=`🎯 ×${_placementStreak}`;
    const _stCol=_placementStreak>=5?'#FF40D0':_placementStreak>=3?'#FFD700':'#60D0FF';
    ctx.save();ctx.globalAlpha=0.88;
    ctx.font=`bold ${_stfsz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillStyle=_stCol;ctx.shadowColor=_stCol;ctx.shadowBlur=6;
    ctx.fillText(_stxt,GRID_X+4,TRAY_Y-2);
    ctx.shadowBlur=0;ctx.globalAlpha=1;ctx.restore();
  }
  // ── MODE OVERLAYS ────────────────────────────────────────────────────────────
  _drawModeOverlays(t,th);
  // ── ACHIEVEMENT TOASTS ───────────────────────────────────────────────────────
  _achieveToasts=_achieveToasts.filter(_at=>{
    const _ap=Math.min(1,(Date.now()-_at.born)/3200);
    if(_ap>=1)return false;
    const _aSlide=_ap<0.12?_ap/0.12:1;
    const _aFade=_ap>0.72?(1-(_ap-0.72)/0.28):1;
    const _atW=Math.min(W*0.6,250);const _atH=Math.max(44,_atW*0.22)|0;
    const _atX=W-_atW-8;const _atY=60+_achieveToasts.indexOf(_at)*(_atH+6);
    ctx.save();
    ctx.globalAlpha=_aSlide*_aFade;
    ctx.translate(_atX+(1-_aSlide)*_atW*0.25,_atY);
    rrect(ctx,0,0,_atW,_atH,8,'rgba(12,6,28,0.94)',hexA(THEMES[curTheme].tm,0.65),1.5);
    // Shine
    const _ashg=ctx.createLinearGradient(0,0,0,_atH*0.5);
    _ashg.addColorStop(0,'rgba(255,255,255,0.10)');_ashg.addColorStop(1,'rgba(255,255,255,0)');
    rrect(ctx,1,1,_atW-2,_atH*0.5,7,_ashg,null);
    const _icSz=_atH-10;
    if(_achieveImgs[_at.idx])ctx.drawImage(_achieveImgs[_at.idx],5,5,_icSz,_icSz);
    const _atfz=Math.max(7,_atH*0.28|0);
    ctx.font=`bold ${_atfz}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.fillStyle='#FFFFFF';ctx.textAlign='left';ctx.textBaseline='middle';
    ctx.shadowColor=THEMES[curTheme].tm;ctx.shadowBlur=5;
    ctx.fillText('ACHIEVEMENT !',_icSz+12,_atH*0.34);
    const _atfz2=Math.max(6,_atH*0.22|0);
    ctx.font=`${_atfz2}px system-ui,-apple-system,"SF Pro Display",Arial`;
    ctx.fillStyle=hexA(THEMES[curTheme].ta,0.95);ctx.shadowBlur=0;
    ctx.fillText(ACHIEVEMENTS[_at.idx].label,_icSz+12,_atH*0.70);
    ctx.restore();
    return true;
  });
}

function _drawModeOverlays(t,th){
  const subMode=_getHistoireSubMode();
  const effectiveMode=currentMode==='histoire'?subMode:currentMode;
  // Portrait-aware: in portrait the HUD fills the entire space above the grid,
  // so mode overlays must render AT or INSIDE the grid top edge, not above it.
  const _portrait=H>W;
  // ── CHRONO ──
  if(effectiveMode==='chrono'&&!over){
    const now=Date.now();
    const dt=now-chronoLastTick;chronoLastTick=now;
    chronoTimeLeft=Math.max(0,chronoTimeLeft-dt);
    const frac=chronoTimeLeft/chronoMaxTime;
    // In portrait: bar overlays grid top (HUD fills above-grid space)
    // In landscape: bar floats above grid in the available margin
    const _cszLabel=cl(Math.floor(CELL*0.55),10,20);
    const barW=GW,barH=_portrait?Math.max(Math.max(6,CELL*0.18)|0,_cszLabel+6):Math.max(6,CELL*0.18)|0;
    const barX=GRID_X,barY=_portrait?GRID_Y:GRID_Y-barH-3;
    // Track bg
    rrect(ctx,barX,barY,barW,barH,barH/2,_portrait?'rgba(0,0,0,0.72)':'rgba(0,0,0,0.5)',null);
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
    // Seconds label — portrait: inside the bar; landscape: above the bar
    const sec=Math.ceil(chronoTimeLeft/1000);
    const csz=_cszLabel;
    const _shakeX=_urgent?(Math.sin(t*0.11)*3.5)|0:0;
    ctx.save();ctx.font=`bold ${csz}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    if(frac<0.3){ctx.fillStyle='#FF4020';ctx.shadowColor='#FF2010';ctx.shadowBlur=8+4*Math.abs(Math.sin(t*0.012));}else ctx.fillStyle='rgba(255,255,255,0.85)';
    ctx.fillText(`⏱ ${sec}`,GRID_X+GW/2+_shakeX,_portrait?barY+barH/2:barY-csz*0.6);ctx.restore();
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
    const _chR=Math.min(CR*2,16);
    rrect(ctx,cx2,cy2,cw,ch,_chR,cbg,null);
    rp(ctx,cx2,cy2,cw,ch,_chR);ctx.strokeStyle='rgba(200,80,255,0.55)';ctx.lineWidth=2;ctx.stroke();
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
      const _slR=Math.min(CR*2,12);
      rrect(ctx,sx,sy,sw,sh,_slR,sbg2,null);
      rp(ctx,sx,sy,sw,sh,_slR);ctx.strokeStyle=hexA(piece.color,hover?0.9:0.45);ctx.lineWidth=hover?2:1;ctx.stroke();
      if(hover){ctx.save();ctx.shadowColor=piece.color;ctx.shadowBlur=12;rp(ctx,sx,sy,sw,sh,_slR);ctx.strokeStyle=hexA(piece.color,0.8);ctx.lineWidth=2;ctx.stroke();ctx.restore();}
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
    // Blocked count badge — portrait: inside grid top; landscape: above grid
    const bcount=contraBlocked.length;
    const bw2=cl(Math.round(GW*0.52),80,180),bh2=cl(Math.round(H*0.048),20,34);
    const bx2=GRID_X+(GW-bw2)/2,by2=_portrait?(GRID_Y+4):(GRID_Y-bh2-4);
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
    // Portrait: badge overlays grid top to avoid HUD; landscape: above grid
    const bx2=GRID_X+(GW-bw2)/2,by2=_portrait?(GRID_Y+4):(GRID_Y-bh2-4);
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
  // Reset HUD button rects each frame so stale rects from previous layout aren't used
  _undoHudRect=null;_restartHudRect=null;
  const portrait=H>W;
  if(portrait){
    // Glass top bar
    const bh=GRID_Y-3;
    ctx.fillStyle=th.hudBg||'rgba(0,0,0,0.88)';ctx.fillRect(0,0,W,bh);
    ctx.strokeStyle=th.hudBorder||hexA(th.sl,0.35);ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,bh);ctx.lineTo(W,bh);ctx.stroke();
    // Thin combo accent bar along bottom of HUD strip
    if(combo>=2&&!over){const _cbFrac=Math.min(1,combo/8);const _cbCol=combo>=6?'#FF40A0':combo>=4?'#FFA020':th.tm;const _cbW=Math.round(W*_cbFrac);const _cbX=(W-_cbW)/2|0;const _cbg=ctx.createLinearGradient(_cbX,bh-2,_cbX+_cbW,bh-2);_cbg.addColorStop(0,hexA(th.ta,0));_cbg.addColorStop(0.3,_cbCol);_cbg.addColorStop(0.7,_cbCol);_cbg.addColorStop(1,hexA(th.ta,0));ctx.fillStyle=_cbg;ctx.fillRect(_cbX,bh-2,_cbW,2);}
    // Milestone progress bar — top edge of HUD strip (1px, shows progress to next milestone)
    if(!over){
      const _prevMs=_nextMilestoneIdx>0?_MILESTONES[_nextMilestoneIdx-1]:0;
      const _nextMs=_nextMilestoneIdx<_MILESTONES.length?_MILESTONES[_nextMilestoneIdx]:null;
      if(_nextMs){
        const _mFrac=Math.min(1,(score-_prevMs)/(_nextMs-_prevMs));
        const _mPulse=0.8+0.2*Math.abs(Math.sin(Date.now()*0.003));
        const _mCol=_nextMs>=100000?`hsl(${(Date.now()*0.05)%360|0},100%,65%)`:'#FFD700';
        const _mg=ctx.createLinearGradient(0,0,W*_mFrac,0);
        _mg.addColorStop(0,hexA(_mCol,0.18));_mg.addColorStop(0.7,hexA(_mCol,0.38*_mPulse));_mg.addColorStop(1,hexA(_mCol,0.55*_mPulse));
        ctx.fillStyle=_mg;ctx.fillRect(0,0,Math.round(W*_mFrac),2);
        // Sparkle at tip of progress bar
        ctx.save();ctx.shadowColor=_mCol;ctx.shadowBlur=4;ctx.fillStyle=hexA(_mCol,_mPulse);ctx.fillRect(Math.round(W*_mFrac)-2,0,2,2);ctx.restore();
      }else{// All milestones passed — rainbow fill
        const _rh=(Date.now()*0.04)%360|0;ctx.fillStyle=`hsl(${_rh},100%,60%)`;ctx.fillRect(0,0,W,2);}
    }
    // Score centré avec animation de pulsation + rainbow glow at 100K
    const fz=cl(bh*0.55|0,11,24);
    // New record indicator — subtle golden crown above score
    if(_newBestTriggered&&!over){
      const _crPulse=0.7+0.3*Math.abs(Math.sin(Date.now()*0.004));
      ctx.save();ctx.font=`${fz*0.6|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillStyle=`rgba(255,215,0,${(_crPulse*0.9).toFixed(3)})`;ctx.shadowColor='#FFD700';ctx.shadowBlur=8*_crPulse;
      ctx.fillText('♛',W/2,bh*0.12);ctx.restore();
    }
    // Score display with tier tint
    const _scoreTierCol=score>=100000?`hsl(${(Date.now()*0.06)%360|0},100%,70%)`:score>=50000?'#FFD700':score>=10000?'#FFA040':null;
    if(_hudScorePulse>0.01){const _sc=1+_hudScorePulse*0.22;ctx.save();ctx.translate(W/2,bh/2);ctx.scale(_sc,_sc);ctx.translate(-W/2,-bh/2);
      if(_scoreTierCol){ctx.shadowColor=_scoreTierCol;ctx.shadowBlur=10*_hudScorePulse;}
      drawScore(ctx,`${displayScore}`,W/2,bh/2,th,`bold ${fz*1.2}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`);ctx.restore();}
    else{
      if(_scoreTierCol){ctx.save();ctx.shadowColor=_scoreTierCol;ctx.shadowBlur=6;drawScore(ctx,`${displayScore}`,W/2,bh/2,th,`bold ${fz*1.2}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`);ctx.restore();}
      else drawScore(ctx,`${displayScore}`,W/2,bh/2,th,`bold ${fz*1.2}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`);
    }
    // New best — rotating golden orbit ring around score
    if(_newBestTriggered&&!over){
      const _orR=fz*0.92;
      const _orA=0.45+0.25*Math.abs(Math.sin(Date.now()*0.003));
      ctx.save();ctx.translate(W/2,bh/2);ctx.rotate(Date.now()*0.0018);
      ctx.strokeStyle=hexA('#FFD700',_orA);ctx.lineWidth=1.2;
      ctx.shadowColor='#FFD700';ctx.shadowBlur=7;
      ctx.setLineDash([_orR*0.38,_orR*0.16]);
      ctx.beginPath();ctx.arc(0,0,_orR,0,Math.PI*2);ctx.stroke();
      ctx.setLineDash([]);ctx.restore();
    }
    // Left: mode badge pill + record
    const modeInfo=MODES[currentMode]||MODES.survie;
    const _mbH=Math.min(bh*0.46|0,26),_mbW=cl(fz*4.4|0,60,118);
    const _mbX=4,_mbY=(bh-_mbH)/2|0;
    const _mbg=ctx.createLinearGradient(_mbX,_mbY,_mbX,_mbY+_mbH);
    _mbg.addColorStop(0,hexA(modeInfo.color,0.28));_mbg.addColorStop(1,hexA(modeInfo.color,0.10));
    rrect(ctx,_mbX,_mbY,_mbW,_mbH,_mbH/2,_mbg,hexA(modeInfo.color,0.55),1);
    const _mbsh=ctx.createLinearGradient(_mbX,_mbY,_mbX,_mbY+_mbH*0.48);
    _mbsh.addColorStop(0,'rgba(255,255,255,0.16)');_mbsh.addColorStop(1,'rgba(255,255,255,0)');
    rp(ctx,_mbX+1,_mbY+1,_mbW-2,_mbH*0.48,_mbH/2);ctx.fillStyle=_mbsh;ctx.fill();
    ctx.save();ctx.font=`bold ${fz*0.52|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=modeInfo.color;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.shadowColor=modeInfo.color;ctx.shadowBlur=5;ctx.fillText(modeInfo.icon+' '+modeInfo.name,_mbX+_mbW/2,_mbY+_mbH/2);ctx.shadowBlur=0;ctx.restore();
    // Record below badge
    ctx.font=`${fz*0.48|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=hexA(th.tg,0.65);ctx.textAlign='left';ctx.textBaseline='bottom';
    ctx.fillText(`REC: ${best}`,_mbX+4,bh-1);ctx.textBaseline='alphabetic';
    // Right: quatre boutons icônes — 🔄 restart | ↩ undo | ⏸ pause | 🔊 son
    const iconSz=cl(bh-4,24,44);
    const smSz=Math.max(18,iconSz*0.70|0); // smaller undo/restart icons
    const soundX=W-(iconSz+2)-4;
    const pauseX=soundX-(iconSz+5)-4;
    const undoX=pauseX-(smSz+5)-3;
    const restartX=undoX-(smSz+4)-2;
    const btnY=2;
    _soundRect={x:soundX,y:btnY,w:iconSz,h:iconSz};
    _pauseHudRect={x:pauseX,y:btnY,w:iconSz,h:iconSz};
    _undoHudRect={x:undoX,y:(bh-smSz)/2|0,w:smSz,h:smSz};
    _restartHudRect={x:restartX,y:(bh-smSz)/2|0,w:smSz,h:smSz};
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
    // Subtle pulse ring on pause button
    const _pbPulse=0.3+0.3*Math.abs(Math.sin(Date.now()*0.0025));
    ctx.save();ctx.strokeStyle=hexA(th.ta,_pbPulse*0.5);ctx.lineWidth=1;
    rp(ctx,pauseX-2,btnY-2,iconSz+4,iconSz+4,iconSz/4+1);ctx.stroke();ctx.restore();
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
    // ── Undo button ──
    {const _uav=_undoCount>0&&placeHistory.length>0;const _uby=(bh-smSz)/2|0;
    ctx.save();ctx.shadowColor=_uav?'#60D0FF':'rgba(0,0,0,0)';ctx.shadowBlur=_uav?5:0;
    const _ubg=ctx.createLinearGradient(undoX,_uby,undoX,_uby+smSz);
    _ubg.addColorStop(0,_uav?'rgba(0,55,110,0.82)':'rgba(20,20,22,0.60)');_ubg.addColorStop(1,_uav?'rgba(0,28,60,0.82)':'rgba(10,10,12,0.60)');
    rrect(ctx,undoX,_uby,smSz,smSz,smSz/4,_ubg,null);
    rp(ctx,undoX,_uby,smSz,smSz,smSz/4);ctx.strokeStyle=_uav?hexA('#60D0FF',0.70):'rgba(70,70,70,0.38)';ctx.lineWidth=1;ctx.stroke();
    ctx.shadowBlur=0;ctx.font=`${smSz*0.50|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=_uav?'rgba(255,255,255,0.92)':'rgba(90,90,90,0.70)';ctx.fillText('↩',undoX+smSz/2,_uby+smSz/2);
    if(_undoCount>0){const _ub=Math.max(6,smSz*0.30)|0;ctx.font=`bold ${_ub}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=_uav?'#60D0FF':'#555';ctx.textAlign='right';ctx.textBaseline='top';ctx.fillText(_undoCount,undoX+smSz-1,_uby+1);}
    ctx.restore();}
    // ── Restart button ──
    {const _rby=(bh-smSz)/2|0;
    ctx.save();ctx.shadowColor='rgba(255,100,40,0.45)';ctx.shadowBlur=4;
    const _rbg=ctx.createLinearGradient(restartX,_rby,restartX,_rby+smSz);
    _rbg.addColorStop(0,'rgba(72,18,0,0.82)');_rbg.addColorStop(1,'rgba(36,9,0,0.82)');
    rrect(ctx,restartX,_rby,smSz,smSz,smSz/4,_rbg,null);
    rp(ctx,restartX,_rby,smSz,smSz,smSz/4);ctx.strokeStyle='rgba(255,100,40,0.55)';ctx.lineWidth=1;ctx.stroke();
    ctx.shadowBlur=0;ctx.font=`${smSz*0.52|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='rgba(255,255,255,0.92)';ctx.fillText('🔄',restartX+smSz/2,_rby+smSz/2);
    ctx.restore();}
    // Theme name + combo — calé à gauche des boutons
    const rightEdge=restartX-8;
    ctx.font=`${fz*0.62}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='right';ctx.fillStyle=th.ta;ctx.textBaseline='middle';
    ctx.fillText(THEMES[curTheme].name,rightEdge,bh*0.38);
    if(combo>1){ctx.save();ctx.font=`bold ${fz*0.88}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle=th.tm;ctx.shadowColor=th.tm;ctx.shadowBlur=7;ctx.fillText(`×${combo}`,rightEdge,bh*0.72);ctx.restore();}
    let _bonusRow=bh*0.72;
    if(combo>1)_bonusRow=bh*0.52;
    const _bszBonus=fz*0.65;
    if(doublePointsUntil>Date.now()){const rem=Math.ceil((doublePointsUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${_bszBonus}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#30FFAA';ctx.shadowColor='#00FFB0';ctx.shadowBlur=5;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(`×2 ${rem}s`,rightEdge,_bonusRow);ctx.shadowBlur=0;ctx.restore();_bonusRow=Math.min(bh*(combo>1?0.88:0.68),bh-_bszBonus*1.2);}
    if(_enduranceBonusUntil>Date.now()){const erem=Math.ceil((_enduranceBonusUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${_bszBonus}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#60FFD0';ctx.shadowColor='#40EAB0';ctx.shadowBlur=5;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(`🏅×1.5 ${erem}s`,rightEdge,_bonusRow);ctx.shadowBlur=0;ctx.restore();}
    // HUD border decoration (bottom edge of portrait HUD strip)
    if(typeof drawHudBorder==='function')drawHudBorder(curTheme,0,bh-3,W,4);
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
    if(_enduranceBonusUntil>Date.now()){const erem=Math.ceil((_enduranceBonusUntil-Date.now())/1000);ctx.save();ctx.font=`bold ${fz*0.72}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.fillStyle='#60FFD0';ctx.shadowColor='#40EAB0';ctx.shadowBlur=4;ctx.fillText(`🏅×1.5 ${erem}s`,hx,cy);ctx.shadowBlur=0;ctx.restore();cy+=fz;}
    cy+=fz*0.4; // gap before action buttons
    // ── Undo button (landscape) ──
    {const _lbH=Math.max(20,fz*1.05)|0,_lbW=hw;const _uavL=_undoCount>0&&placeHistory.length>0;
    rrect(ctx,hx,cy,_lbW,_lbH,5,_uavL?'rgba(0,45,90,0.80)':'rgba(18,18,18,0.55)',_uavL?hexA('#60D0FF',0.60):'rgba(60,60,60,0.35)',1);
    ctx.save();ctx.font=`bold ${(_lbH*0.54)|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle=_uavL?'#60D0FF':'#505050';ctx.fillText(`↩ ANNULER (${_undoCount})`,hx+_lbW/2,cy+_lbH/2);ctx.restore();
    _undoHudRect={x:hx,y:cy,w:_lbW,h:_lbH};cy+=_lbH+3;}
    // ── Restart button (landscape) ──
    {const _lbH=Math.max(20,fz*1.05)|0,_lbW=hw;
    rrect(ctx,hx,cy,_lbW,_lbH,5,'rgba(60,14,0,0.80)',hexA('#FF8040',0.50),1);
    ctx.save();ctx.font=`bold ${(_lbH*0.54)|0}px system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillStyle='#FF8040';ctx.fillText('🔄 RESTART',hx+_lbW/2,cy+_lbH/2);ctx.restore();
    _restartHudRect={x:hx,y:cy,w:_lbW,h:_lbH};}
    ctx.textBaseline='alphabetic';
  }
  // ── UI ripples (HUD button press feedback) ──────────────────────────────────
  _uiRipples=_uiRipples.filter(_ur=>{
    const _up=Math.min(1,(Date.now()-_ur.born)/220);
    if(_up>=1)return false;
    const _ura=(1-_up)*(1-_up)*0.75;
    ctx.save();
    ctx.strokeStyle=hexA(_ur.col,_ura);ctx.lineWidth=2*(1-_up)+0.5;
    ctx.shadowColor=_ur.col;ctx.shadowBlur=10*(1-_up);
    ctx.beginPath();ctx.arc(_ur.x,_ur.y,_ur.maxR*Math.pow(_up,0.4),0,Math.PI*2);ctx.stroke();
    ctx.restore();
    return true;
  });
}

