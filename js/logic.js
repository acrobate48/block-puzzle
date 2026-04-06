'use strict';
// ─── GAME LOGIC ───────────────────────────────────────────────────────────────
// Rotate a shape 90° clockwise
function rotateShape(s){
  const rows=s.length,cols=s[0].length;
  const out=Array.from({length:cols},(_,r)=>Array.from({length:rows},(_,c)=>s[rows-1-c][r]));
  return out;
}
// Apply N*90° rotations
function rotateN(s,n){let r=s;for(let i=0;i<(n%4);i++)r=rotateShape(r);return r;}
function newPiece(){return{shape:rndc(SHAPES),color:rndc(COLORS)};}
function newParasitePiece(){return{shape:rndc(SHAPES.filter(s=>s.flat().reduce((a,v)=>a+v,0)<=4)),color:'#1A0A2E',isParasite:true};}
function newTray(g){
  // g = current grid (optional); use global `grid` when available
  const _g=(typeof g!=='undefined')?g:(typeof grid!=='undefined'?grid:null);
  const pieces=[
    {shape:SHAPES[_engPickIdx(_g)],color:rndc(COLORS)},
    {shape:SHAPES[_engPickIdx(_g)],color:rndc(COLORS)},
    {shape:SHAPES[_engPickIdx(_g)],color:rndc(COLORS)},
  ];
  // Anti-frustration guarantee: grid > 72% full → ensure ≥1 small piece (≤3 cells)
  if(_g){
    const fill=_g.reduce((s,row)=>s+row.filter(Boolean).length,0)/(ROWS*COLS);
    if(fill>0.72){
      const hasSmall=pieces.some(p=>p.shape.flat().reduce((a,v)=>a+v,0)<=3);
      if(!hasSmall){
        const smallS=SHAPES.filter(s=>s.flat().reduce((a,v)=>a+v,0)<=3);
        pieces[rndI(0,2)]={shape:rndc(smallS),color:rndc(COLORS)};
      }
    }
  }
  // Chaos event countdown — surprise tray injection every 10-17 trays
  _engChaosIn--;
  if(_engChaosIn<=0){
    _engChaosIn=10+rndI(0,7);
    _engChaosFlash=true;
    // 55% chance = hard chaos (large piece), 45% = lucky chaos (gift small/line piece)
    if(Math.random()<0.55){
      const bigS=SHAPES.filter(s=>s.flat().reduce((a,v)=>a+v,0)>=5);
      pieces[rndI(0,2)]={shape:rndc(bigS),color:rndc(COLORS)};
    }else{
      const giftS=_g?SHAPES.filter(s=>_engHasPot(s,_g)):SHAPES.filter(s=>s.flat().reduce((a,v)=>a+v,0)<=3);
      if(giftS.length>0)pieces[rndI(0,2)]={shape:rndc(giftS),color:rndc(COLORS)};
    }
  }
  // ~8% chance one slot becomes a parasite piece (only if none active on grid)
  if((typeof parasites==='undefined'||parasites.length===0)&&Math.random()<0.08){pieces[rndI(0,2)]=newParasitePiece();}
  return pieces;
}
function canPlace(grid,shape,row,col){for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c]){const gr=row+r,gc=col+c;if(gr<0||gr>=ROWS||gc<0||gc>=COLS||grid[gr][gc])return false;}return true;}
function placePiece(grid,shape,color,row,col){for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++)if(shape[r][c])grid[row+r][col+c]=color;}
function clearLines(grid){const rf=[],cf=[];for(let r=0;r<ROWS;r++)if(grid[r].every(v=>v))rf.push(r);for(let c=0;c<COLS;c++){let f=true;for(let r=0;r<ROWS;r++)if(!grid[r][c]){f=false;break;}if(f)cf.push(c);}const cl2=new Set(),clC={};rf.forEach(r=>{for(let c=0;c<COLS;c++){const k=r*100+c;cl2.add(k);clC[k]=grid[r][c];}});cf.forEach(c=>{for(let r=0;r<ROWS;r++){const k=r*100+c;cl2.add(k);clC[k]=grid[r][c];}});cl2.forEach(k=>{grid[Math.floor(k/100)][k%100]=null;});return{n:rf.length+cf.length,cells:[...cl2].map(k=>({r:Math.floor(k/100),c:k%100})),colors:clC};}
function anyValid(grid,tray){for(const p of tray)if(p){let s=p.shape;for(let rot=0;rot<4;rot++){for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(_modeCanPlace(grid,s,r,c))return true;s=rotateShape(s);}}return false;}
function _zenClearRows(){
  // Remove up to 2 rows with the most filled cells to make room
  const counts=Array.from({length:ROWS},(_,r)=>({r,n:grid[r].filter(Boolean).length}));
  counts.sort((a,b)=>b.n-a.n);
  const toClear=counts.slice(0,2).map(x=>x.r).filter(r=>counts.find(x=>x.r===r).n>0);
  toClear.forEach(r=>{grid[r]=Array(COLS).fill(null);gridStars[r]=Array(COLS).fill(false);gridBonus[r]=Array(COLS).fill(null);});
  if(toClear.length>0){screenFlash=100;screenFlashCol='#60C880';floats.push(new FloatText('🍃 ZEN — place libérée !',GRID_X+GW/2,GRID_Y+GH/2,'#60C880',1.0,80));}
}
// Fix C: Snap-to-grid corrected for visual lift offset.
// During drag the piece is rendered shifted upward by CELL*0.22 (see game.js
// drawDragPiece: oy = mouseY - sh.length*_liftCell/2 - CELL*0.22).
// We subtract that same offset from my so the grid highlight matches exactly
// where the piece *looks*, not where the raw finger position falls.
function snapPos(mx,my,shape){
  const _liftOffsetY=CELL*0.22;
  return{gr:Math.round((my-_liftOffsetY-GRID_Y)/CELL-shape.length/2),gc:Math.round((mx-GRID_X)/CELL-shape[0].length/2)};
}

// ─── PARTICLES / DEBRIS / FLOATTEXT ──────────────────────────────────────────
function spawnParticles(cells,n,pow,colors){cells.forEach(({r,c})=>{if(particles.length>=200)return;const cx=GRID_X+c*CELL+CELL/2,cy=GRID_Y+r*CELL+CELL/2;for(let i=0;i<n;i++){if(particles.length>=200)break;const a=rnd(0,Math.PI*2),s=rnd(1.5,4)*pow;particles.push({x:cx,y:cy,vx:Math.cos(a)*s,vy:Math.sin(a)*s-rnd(0,1.5),color:rndc(colors),life:28+rnd(0,28),ml:56,size:rnd(2,3.5*pow),circle:Math.random()<0.5});}});}
class Debris{
  constructor(x,y,color,ti){this.x=x;this.y=y;this.ml=44+rnd(0,28);this.life=this.ml;this.sz=4+rnd(0,9);this.wave=rnd(0,Math.PI*2);const r=hr(color||'#3AC644'),g=hg(color||'#3AC644'),b=hb(color||'#3AC644');if(ti===2){this.vx=rnd(-1,1);this.vy=rnd(-3,-0.8);this.grav=-0.02;this.circ=true;this.r=cl(r*0.2+70|0,0,255);this.g=cl(g*0.4+105|0,0,255);this.b=cl(b*0.55+140|0,0,255);}else if(ti===3){this.vx=rnd(-1.2,1.2);this.vy=rnd(1.2,4);this.grav=0.22;this.circ=false;this.r=cl(r*0.3+200|0,0,255);this.g=cl(g*0.1+42|0,0,255);this.b=4;}else{const a=rnd(0,Math.PI*2),sp=rnd(2.5,6);this.vx=Math.cos(a)*sp;this.vy=Math.sin(a)*sp-rnd(0,2.5);this.grav=0.13;this.circ=Math.random()<0.5;this.r=r;this.g=g;this.b=b;}}
  update(){this.x+=this.vx+Math.sin(this.wave)*0.3;this.y+=this.vy;this.vy+=this.grav;this.wave+=0.1;this.life--;return this.life>0;}
  draw(ctx){const rat=this.life/this.ml,a=(0.8*rat).toFixed(3),sz=Math.max(1,this.sz*(0.25+0.75*rat));ctx.fillStyle=`rgba(${this.r},${this.g},${this.b},${a})`;if(this.circ){ctx.beginPath();ctx.arc(this.x,this.y,sz,0,Math.PI*2);ctx.fill();}else ctx.fillRect(this.x-sz,this.y-sz,sz*2,sz*2);}
}
function spawnDebris(clC,ti,n){Object.entries(clC).forEach(([k,color])=>{if(debris.length>=150)return;const r=Math.floor(+k/100),c=(+k)%100;const cx=GRID_X+c*CELL+CELL/2,cy=GRID_Y+r*CELL+CELL/2;for(let i=0;i<n;i++){if(debris.length>=150)break;debris.push(new Debris(cx+rnd(-CELL/4,CELL/4),cy+rnd(-CELL/4,CELL/4),color,ti));}});
  // Extra spark ring burst for large clear events
  if(n>=4){Object.keys(clC).slice(0,3).forEach(k=>{if(particles.length>=200)return;const r2=Math.floor(+k/100),c2=(+k)%100;const cx=GRID_X+c2*CELL+CELL/2,cy=GRID_Y+r2*CELL+CELL/2;for(let i=0;i<6;i++){if(particles.length>=200)break;const a=i/6*Math.PI*2,spd=4+Math.random()*3;particles.push({x:cx,y:cy,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd-2,color:'#FFFFFF',life:22+Math.random()*18,ml:40,size:1.5+Math.random()*2,circle:true});}});}
}
class FloatText{
  constructor(text,x,y,col,sizeM=1,life=75){this.text=text;this.x=x;this.y=y;this.col=col;this.life=life;this.ml=life;this.vy=-1.1;this.sizeM=sizeM;}
  update(){this.y+=this.vy;this.vy*=0.97;this.life--;return this.life>0;}
  draw(ctx){if(this.y<0||this.y>H)return;const ratio=this.life/this.ml,fsz=Math.max(10,CELL*0.5*this.sizeM)|0;let scalePop=1.0;if(ratio>0.88){const popT=(this.ml-this.life)/(this.ml*0.12);scalePop=1.0+0.35*Math.sin(popT*Math.PI);}ctx.save();ctx.globalAlpha=ratio;ctx.font=`bold ${Math.round(fsz*scalePop)}px Impact,system-ui,-apple-system,"SF Pro Display",Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.shadowColor=this.col;ctx.shadowBlur=10;ctx.strokeStyle='rgba(0,0,0,0.55)';ctx.lineWidth=3;ctx.lineJoin='round';ctx.strokeText(this.text,this.x,this.y);ctx.fillStyle=this.col;ctx.fillText(this.text,this.x,this.y);ctx.restore();}
}
