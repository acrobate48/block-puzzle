'use strict';
const {createCanvas}=require('canvas');
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');

const FFMPEG='c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const W=540,H=960,FPS=30,FRAMES=180;
const FRAMES_DIR=path.join(__dirname,'frames');
const OUT_DIR=path.join(__dirname);

function lerp(a,b,t){return a+(b-a)*t;}
function hex(h){return{r:parseInt(h.slice(1,3),16),g:parseInt(h.slice(3,5),16),b:parseInt(h.slice(5,7),16)};}

// ── THEME RENDERERS ──

function renderCosmos(ctx,T){
  // Deep space black
  ctx.fillStyle='#020008';ctx.fillRect(0,0,W,H);
  // Nebula clouds
  [[W*0.3,H*0.4,200,'#380880'],[W*0.7,H*0.6,150,'#200060'],[W*0.5,H*0.25,120,'#B040F0']].forEach(([nx,ny,nr,nc])=>{
    const ox=nx+Math.sin(T*0.15)*30,oy=ny+Math.cos(T*0.12)*20;
    const g=ctx.createRadialGradient(ox,oy,0,ox,oy,nr*(1+0.1*Math.sin(T*0.3)));
    const c=hex(nc);g.addColorStop(0,`rgba(${c.r},${c.g},${c.b},0.18)`);g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  });
  // Stars — seeded for consistency
  for(let i=0;i<180;i++){
    const sx=(Math.sin(i*127.1)*0.5+0.5)*W,sy=(Math.cos(i*311.7)*0.5+0.5)*H;
    const pulse=0.5+0.5*Math.sin(T*2+i*0.8);
    const sz=i%12===0?2.5:i%5===0?1.5:0.8;
    ctx.fillStyle=`rgba(255,255,255,${0.3+0.5*pulse*((i%3===0)?1:0.4)})`;
    ctx.beginPath();ctx.arc(sx,sy,sz*pulse,0,Math.PI*2);ctx.fill();
  }
  // Moving galaxy particles
  for(let i=0;i<50;i++){
    const angle=i/50*Math.PI*2+T*0.05,dist=50+i*2.5;
    const px=W/2+Math.cos(angle)*dist,py=H/2+Math.sin(angle)*dist*0.4;
    const pc=['#B040F0','#6080F0','#E0A0FF'][i%3];
    ctx.globalAlpha=0.15+0.1*Math.sin(T+i);
    ctx.fillStyle=pc;ctx.beginPath();ctx.arc(px,py,1,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
}

function renderNeopolis(ctx,T){
  ctx.fillStyle='#010510';ctx.fillRect(0,0,W,H);
  // Grid floor perspective
  ctx.save();ctx.strokeStyle='rgba(0,221,255,0.12)';ctx.lineWidth=0.5;
  const VP={x:W/2,y:H*0.5};
  for(let i=-8;i<=8;i++){
    const x=W/2+i*40;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(VP.x+(x-VP.x)*3,H);ctx.stroke();
  }
  for(let j=0;j<12;j++){
    const y=H*0.5+j*50+((T*30)%50);
    ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();
  }
  ctx.restore();
  // Neon circuit lines
  ctx.save();
  [[0.1,0.3,0.5,0.3,'#00DDFF'],[0.6,0.5,0.9,0.5,'#A040FF'],[0.2,0.7,0.8,0.7,'#FF40C0']].forEach(([x1,y1,x2,y2,col])=>{
    const pulse=0.5+0.5*Math.sin(T*2+(x1*5));
    ctx.strokeStyle=col;ctx.lineWidth=1.5;ctx.globalAlpha=0.4*pulse;
    ctx.shadowColor=col;ctx.shadowBlur=8;
    ctx.beginPath();ctx.moveTo(x1*W,y1*H);ctx.lineTo(x2*W,y2*H);ctx.stroke();
  });
  // Digital rain columns
  for(let c2=0;c2<6;c2++){
    const cx=c2*90+45,cy=((T*80+c2*150)%H);
    ctx.globalAlpha=0.25;ctx.fillStyle='#00DDFF';
    for(let d=0;d<5;d++){
      ctx.font=`bold ${10+d*2}px monospace`;ctx.textAlign='center';
      ctx.globalAlpha=0.25-d*0.04;
      ctx.fillText(['0','1'][Math.floor((T*5+c2+d)%2)],cx,(cy-d*20+H)%H);
    }
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;ctx.restore();
  // Neon orb
  const orbX=W/2+Math.sin(T*0.4)*100,orbY=H*0.4+Math.cos(T*0.3)*60;
  const og=ctx.createRadialGradient(orbX,orbY,0,orbX,orbY,120);
  og.addColorStop(0,'rgba(0,221,255,0.15)');og.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=og;ctx.fillRect(0,0,W,H);
}

function renderOcean(ctx,T){
  // Deep underwater
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#040C28');bg.addColorStop(0.6,'#070F38');bg.addColorStop(1,'#090F44');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Caustic light rays from surface
  ctx.save();
  for(let r=0;r<8;r++){
    const angle=-0.3+r*0.08+Math.sin(T*0.5+r)*0.04;
    const x1=W/2+(r-4)*60+Math.sin(T+r)*20;
    const x2=W/2+(r-4)*200;
    const g=ctx.createLinearGradient(x1,0,x2,H);
    g.addColorStop(0,`rgba(80,200,240,${0.07+0.04*Math.sin(T*1.5+r)})`);
    g.addColorStop(0.6,'rgba(80,200,240,0.01)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;
    ctx.beginPath();ctx.moveTo(x1-15,0);ctx.lineTo(x1+15,0);ctx.lineTo(x2+40,H);ctx.lineTo(x2-40,H);ctx.fill();
  }
  ctx.restore();
  // Bubble streams
  for(let b=0;b<30;b++){
    const bx=(Math.sin(b*73.1)*0.5+0.5)*W;
    const by=((H-((T*40+b*35)%H)));
    const pulse=0.5+0.5*Math.sin(T*3+b);
    ctx.globalAlpha=0.18*pulse;
    ctx.strokeStyle='#50C8F0';ctx.lineWidth=1;
    ctx.beginPath();ctx.arc(bx,by,2+b%4,0,Math.PI*2);ctx.stroke();
  }
  // Bioluminescent particles
  for(let p=0;p<20;p++){
    const px=(Math.cos(p*137.5)*0.5+0.5)*W,py=H*0.3+((T*15+p*60)%H*0.6);
    ctx.globalAlpha=0.4*Math.abs(Math.sin(T*2+p));
    ctx.fillStyle='#28AAA0';ctx.shadowColor='#28AAA0';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc(px,py,1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}

function renderJungle(ctx,T){
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#060E06');bg.addColorStop(1,'#0F2310');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // God rays
  ctx.save();
  for(let r=0;r<6;r++){
    const rx=W*0.2+r*(W*0.12)+Math.sin(T*0.3+r)*15;
    const g=ctx.createLinearGradient(rx,0,rx+30,H);
    g.addColorStop(0,`rgba(212,176,48,${0.06+0.03*Math.sin(T*0.8+r)})`);
    g.addColorStop(0.4,'rgba(212,176,48,0.02)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(rx,0);ctx.lineTo(rx+20,0);ctx.lineTo(rx+80,H);ctx.lineTo(rx+60,H);ctx.fill();
  }
  ctx.restore();
  // Fireflies
  for(let f=0;f<25;f++){
    const fx=W*0.1+(f/25)*(W*0.8)+Math.sin(T*0.5+f*1.3)*30;
    const fy=H*0.15+f*30+Math.cos(T*0.7+f*0.9)*20;
    const glow=0.5+0.5*Math.sin(T*3+f*2.1);
    ctx.globalAlpha=0.7*glow;
    ctx.shadowColor='#D4B030';ctx.shadowBlur=12*glow;
    ctx.fillStyle='#FFEE80';
    ctx.beginPath();ctx.arc(fx,fy,1.5,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}

function renderVolcan(ctx,T){
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#100302');bg.addColorStop(0.7,'#240804');bg.addColorStop(1,'#401008');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Lava glow from bottom
  const lava=ctx.createRadialGradient(W/2,H,0,W/2,H,H*0.7);
  lava.addColorStop(0,`rgba(200,60,0,${0.3+0.1*Math.sin(T*0.8)})`);
  lava.addColorStop(0.4,'rgba(160,30,0,0.08)');lava.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=lava;ctx.fillRect(0,0,W,H);
  // Embers rising
  for(let e=0;e<40;e++){
    const ex=(Math.sin(e*113.7)*0.5+0.5)*W;
    const ey=((H-((T*60+e*40)%H)));
    const pulse=0.6+0.4*Math.sin(T*4+e);
    ctx.globalAlpha=0.6*pulse*(ey/H);
    const eCol=e%3===0?'#FF8020':e%3===1?'#FF4010':'#FFB050';
    ctx.fillStyle=eCol;ctx.shadowColor=eCol;ctx.shadowBlur=6*pulse;
    ctx.beginPath();ctx.arc(ex,ey,1+e%3,0,Math.PI*2);ctx.fill();
  }
  // Rock crack glow
  ctx.save();ctx.strokeStyle=`rgba(255,80,20,${0.12+0.08*Math.sin(T*0.5)})`;ctx.lineWidth=2;
  ctx.shadowColor='#FF4010';ctx.shadowBlur=15;
  [[0.2,0.6,0.4,0.9],[0.6,0.5,0.8,0.8],[0.3,0.8,0.6,1.0]].forEach(([x1,y1,x2,y2])=>{
    ctx.beginPath();ctx.moveTo(x1*W,y1*H);ctx.quadraticCurveTo((x1+x2)/2*W+20,(y1+y2)/2*H,x2*W,y2*H);ctx.stroke();
  });
  ctx.restore();ctx.globalAlpha=1;ctx.shadowBlur=0;
}

// ── GENERATE ALL THEMES ──
const THEMES=[
  {name:'cosmos',render:renderCosmos},
  {name:'neopolis',render:renderNeopolis},
  {name:'ocean',render:renderOcean},
  {name:'jungle',render:renderJungle},
  {name:'volcan',render:renderVolcan},
];

// Ensure frames dir exists
if(!fs.existsSync(FRAMES_DIR))fs.mkdirSync(FRAMES_DIR,{recursive:true});

THEMES.forEach(({name,render})=>{
  console.log(`\n=== Generating ${name} (${FRAMES} frames) ===`);
  for(let f=0;f<FRAMES;f++){
    const canvas=createCanvas(W,H);
    const ctx=canvas.getContext('2d');
    const T=f/FPS;
    render(ctx,T);
    // Vignette
    const vig=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.75);
    vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,0.5)');
    ctx.fillStyle=vig;ctx.fillRect(0,0,W,H);
    const buf=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(FRAMES_DIR,`${name}_${String(f).padStart(4,'0')}.png`),buf);
    if(f%60===0)console.log(`  frame ${f}/${FRAMES}`);
  }
  console.log(`Encoding bg_${name}.mp4...`);
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/${name}_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 22 -preset fast -tune animation "${OUT_DIR}/bg_${name}.mp4"`,{stdio:'inherit'});
  // Cleanup frames
  fs.readdirSync(FRAMES_DIR).forEach(fn=>{if(fn.startsWith(name+'_'))fs.unlinkSync(path.join(FRAMES_DIR,fn));});
  console.log(`  -> bg_${name}.mp4 done!`);
});
console.log('\nALL THEME VIDEOS COMPLETE!');
