'use strict';
// Generate animated background videos for the 5 remaining themes:
// desert, nuit, arctique, enchante, plage
const {createCanvas}=require('canvas');
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');

const FFMPEG='c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const W=540,H=960,FPS=30,FRAMES=180;
const FRAMES_DIR=path.join(__dirname,'frames');
const OUT_DIR=path.join(__dirname);

if(!fs.existsSync(FRAMES_DIR))fs.mkdirSync(FRAMES_DIR,{recursive:true});

// ── THEME RENDERERS ──

function renderDesert(ctx,T){
  // Sky gradient — dawn/dusk amber
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#0A0408');sky.addColorStop(0.35,'#7A1C00');
  sky.addColorStop(0.6,'#D86020');sky.addColorStop(1,'#F0A040');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  // Sun disc
  const sunX=W*0.7+Math.sin(T*0.08)*30,sunY=H*0.28;
  const sunG=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,80);
  sunG.addColorStop(0,`rgba(255,220,80,${0.9+0.05*Math.sin(T*0.6)})`);
  sunG.addColorStop(0.3,'rgba(255,140,20,0.4)');sunG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=sunG;ctx.fillRect(0,0,W,H);
  // Dunes silhouette
  ctx.save();
  const duneCol=ctx.createLinearGradient(0,H*0.6,0,H);
  duneCol.addColorStop(0,'#C07030');duneCol.addColorStop(1,'#804820');
  ctx.fillStyle=duneCol;
  ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<=W;x+=10){
    const dy=Math.sin(x*0.012+T*0.05)*50+Math.sin(x*0.025+T*0.03)*30;
    if(x===0)ctx.lineTo(0,H*0.72+dy);else ctx.lineTo(x,H*0.72+dy);
  }
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  // Foreground dune darker
  ctx.fillStyle='#5A3010';
  ctx.beginPath();ctx.moveTo(0,H);
  for(let x=0;x<=W;x+=10){
    const dy=Math.sin(x*0.018+T*0.08+1.5)*40+Math.sin(x*0.032+T*0.04)*25;
    if(x===0)ctx.lineTo(0,H*0.84+dy);else ctx.lineTo(x,H*0.84+dy);
  }
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  ctx.restore();
  // Blowing sand particles
  for(let s=0;s<60;s++){
    const sx=((T*80+s*113)%W),sy=H*0.5+Math.sin(s*37.3)*H*0.4;
    const sa=0.1+0.08*Math.sin(T*2+s);
    ctx.globalAlpha=sa;
    ctx.fillStyle='#E0A050';
    ctx.beginPath();ctx.ellipse(sx,sy,3,0.8,Math.PI*0.1,0,Math.PI*2);ctx.fill();
  }
  // Heat shimmer lines
  for(let h2=0;h2<5;h2++){
    const hy=H*0.6+h2*20+Math.sin(T*1.5+h2)*5;
    ctx.globalAlpha=0.06+0.04*Math.sin(T*3+h2*0.7);
    ctx.strokeStyle='#FFD080';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(0,hy);
    for(let x=0;x<=W;x+=8){ctx.lineTo(x,hy+Math.sin(x*0.05+T*4+h2)*3);}
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}

function renderNuit(ctx,T){
  // Night sky gradient
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#00000A');sky.addColorStop(0.5,'#050820');sky.addColorStop(1,'#0A0C18');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  // Moon
  const moonX=W*0.75,moonY=H*0.18;
  const moonG=ctx.createRadialGradient(moonX,moonY,0,moonX,moonY,55);
  moonG.addColorStop(0,'rgba(245,240,200,0.95)');moonG.addColorStop(0.7,'rgba(220,215,160,0.4)');
  moonG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=moonG;ctx.fillRect(0,0,W,H);
  // Moon halo
  ctx.globalAlpha=0.12+0.05*Math.sin(T*0.4);
  const haloG=ctx.createRadialGradient(moonX,moonY,40,moonX,moonY,160);
  haloG.addColorStop(0,'rgba(220,215,160,0.3)');haloG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=haloG;ctx.fillRect(0,0,W,H);
  ctx.globalAlpha=1;
  // Stars
  for(let i=0;i<250;i++){
    const sx=(Math.sin(i*127.3)*0.5+0.5)*W,sy=(Math.cos(i*311.9)*0.5+0.5)*H*0.7;
    const twinkle=0.4+0.6*Math.abs(Math.sin(T*1.5+i*0.7));
    const sz=i%15===0?2.2:i%6===0?1.4:0.7;
    ctx.globalAlpha=(0.2+0.7*twinkle)*(i%20===0?1:0.5);
    ctx.fillStyle=i%10===0?'#B0D0FF':i%7===0?'#FFE0B0':'#FFFFFF';
    ctx.beginPath();ctx.arc(sx,sy,sz,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  // City lights at horizon
  const horiz=H*0.72;
  for(let c=0;c<40;c++){
    const cx=(Math.sin(c*73.1)*0.5+0.5)*W;
    const ch=3+Math.sin(c*47.3)*12;
    const cc=['#FF8020','#FFD030','#40A0FF','#FF4080'][c%4];
    const pulse=0.6+0.4*Math.sin(T*2+c*0.8);
    ctx.globalAlpha=0.5*pulse;
    ctx.fillStyle=cc;ctx.fillRect(cx-2,horiz-ch,4,ch+5);
    // Reflection in wet road
    ctx.globalAlpha=0.12*pulse;
    ctx.fillStyle=cc;ctx.fillRect(cx-1,horiz,2,ch*0.4);
  }
  // Shooting stars
  for(let ss=0;ss<3;ss++){
    const sph=T*0.15+ss*2.1;
    const ssX=((Math.sin(sph+ss*1.7)*0.5+0.5)*W*1.5-W*0.25);
    const ssY=((Math.cos(sph+ss*1.3)*0.5+0.5)*H*0.5);
    if(Math.sin(sph*3)>0.7){
      const trail=ctx.createLinearGradient(ssX,ssY,ssX-60,ssY+30);
      trail.addColorStop(0,'rgba(255,255,220,0.8)');trail.addColorStop(1,'rgba(255,255,220,0)');
      ctx.strokeStyle=trail;ctx.lineWidth=1.5;ctx.globalAlpha=0.7;
      ctx.beginPath();ctx.moveTo(ssX,ssY);ctx.lineTo(ssX-60,ssY+30);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
}

function renderArctique(ctx,T){
  // Dark icy background
  const sky=ctx.createLinearGradient(0,0,0,H);
  sky.addColorStop(0,'#000408');sky.addColorStop(0.4,'#020C18');
  sky.addColorStop(0.7,'#040E20');sky.addColorStop(1,'#0A1828');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  // Aurora borealis — multiple waving curtains
  const auroras=[
    {col:'#00FF80',y:H*0.15,amp:60,freq:0.008,speed:0.3},
    {col:'#40A0FF',y:H*0.25,amp:40,freq:0.012,speed:0.2},
    {col:'#A040FF',y:H*0.20,amp:50,freq:0.006,speed:0.4},
  ];
  auroras.forEach(({col,y,amp,freq,speed})=>{
    for(let band=0;band<6;band++){
      const bOff=band*15;
      const r=parseInt(col.slice(1,3),16),g=parseInt(col.slice(3,5),16),b=parseInt(col.slice(5,7),16);
      ctx.beginPath();ctx.moveTo(0,y+bOff);
      for(let x=0;x<=W;x+=4){
        const dy=amp*Math.sin(x*freq+T*speed+band*0.5)*Math.sin(T*0.15+band*0.3);
        ctx.lineTo(x,y+bOff+dy);
      }
      ctx.lineTo(W,H*0.55);ctx.lineTo(0,H*0.55);ctx.closePath();
      const aG=ctx.createLinearGradient(0,y+bOff-10,0,y+bOff+amp+bOff);
      aG.addColorStop(0,`rgba(${r},${g},${b},0)`);
      aG.addColorStop(0.3,`rgba(${r},${g},${b},${0.04+0.02*Math.sin(T*0.5+band)})`);
      aG.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.fillStyle=aG;ctx.fill();
    }
  });
  // Ice ground
  const iceGrad=ctx.createLinearGradient(0,H*0.75,0,H);
  iceGrad.addColorStop(0,'#1A3A4A');iceGrad.addColorStop(0.5,'#0E2030');iceGrad.addColorStop(1,'#081018');
  ctx.fillStyle=iceGrad;ctx.fillRect(0,H*0.75,W,H*0.25);
  // Ice surface shimmer
  for(let i=0;i<8;i++){
    const ix=(Math.sin(i*137)*0.5+0.5)*W,iy=H*0.76+i*8;
    ctx.globalAlpha=0.15+0.1*Math.sin(T*2+i);
    ctx.strokeStyle='#80D0E0';ctx.lineWidth=0.5;
    ctx.beginPath();ctx.moveTo(ix,iy);ctx.lineTo(ix+60+Math.sin(T+i)*20,iy+2);ctx.stroke();
  }
  // Snowflakes
  for(let s=0;s<50;s++){
    const sx=(Math.sin(s*73.7)*0.5+0.5)*W+Math.sin(T*0.3+s)*20;
    const sy=((T*20+s*25)%H);
    const ssz=0.8+s%5*0.4;
    ctx.globalAlpha=0.5+0.3*Math.sin(T+s);
    ctx.fillStyle='#C0E8F8';
    ctx.beginPath();ctx.arc(sx,sy,ssz,0,Math.PI*2);ctx.fill();
    // Snowflake arms
    ctx.strokeStyle='rgba(200,230,255,0.4)';ctx.lineWidth=0.5;
    for(let arm=0;arm<6;arm++){
      const angle=arm*Math.PI/3+T*0.1+s;
      ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+Math.cos(angle)*ssz*3,sy+Math.sin(angle)*ssz*3);ctx.stroke();
    }
  }
  ctx.globalAlpha=1;
}

function renderEnchante(ctx,T){
  // Deep magical forest — dark greens
  const bg=ctx.createLinearGradient(0,0,0,H);
  bg.addColorStop(0,'#020A08');bg.addColorStop(0.5,'#051A10');bg.addColorStop(1,'#030E08');
  ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
  // Magical glow orbs — several floating light sources
  const orbs=[
    {x:W*0.2,y:H*0.3,col:'#A0FFB0',r:120,speed:0.4,phase:0},
    {x:W*0.8,y:H*0.5,col:'#B080FF',r:100,speed:0.3,phase:2.1},
    {x:W*0.5,y:H*0.2,col:'#FFD0A0',r:80,speed:0.5,phase:4.2},
    {x:W*0.65,y:H*0.75,col:'#80D0FF',r:90,speed:0.35,phase:1.5},
  ];
  orbs.forEach(({x,y,col,r,speed,phase})=>{
    const ox=x+Math.sin(T*speed+phase)*40,oy=y+Math.cos(T*speed*0.7+phase)*30;
    const rr=parseInt(col.slice(1,3),16),gg=parseInt(col.slice(3,5),16),bb=parseInt(col.slice(5,7),16);
    const og=ctx.createRadialGradient(ox,oy,0,ox,oy,r*(1+0.15*Math.sin(T*speed*2+phase)));
    og.addColorStop(0,`rgba(${rr},${gg},${bb},0.12)`);og.addColorStop(0.5,`rgba(${rr},${gg},${bb},0.04)`);og.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=og;ctx.fillRect(0,0,W,H);
  });
  // Magical sparkles / fairy dust
  for(let f=0;f<80;f++){
    const fx=W*0.1+(f/80)*(W*0.8)+Math.sin(T*0.5+f*1.7)*25;
    const fy=H*0.05+f*10+Math.sin(T*0.8+f*1.1)*15;
    const glow=Math.pow(Math.abs(Math.sin(T*2.5+f*0.8)),2);
    const fc=['#A0FFB0','#FFD0A0','#B080FF','#80D0FF'][f%4];
    const rr=parseInt(fc.slice(1,3),16),gg=parseInt(fc.slice(3,5),16),bb=parseInt(fc.slice(5,7),16);
    ctx.globalAlpha=0.8*glow;
    ctx.shadowColor=fc;ctx.shadowBlur=8*glow;
    ctx.fillStyle=`rgba(${rr},${gg},${bb},1)`;
    const sz=0.5+glow*2;
    ctx.beginPath();ctx.arc(fx,fy,sz,0,Math.PI*2);ctx.fill();
    // Cross sparkle
    if(glow>0.5){
      ctx.lineWidth=0.5;ctx.strokeStyle=`rgba(${rr},${gg},${bb},${glow*0.7})`;
      ctx.beginPath();ctx.moveTo(fx-sz*3,fy);ctx.lineTo(fx+sz*3,fy);ctx.stroke();
      ctx.beginPath();ctx.moveTo(fx,fy-sz*3);ctx.lineTo(fx,fy+sz*3);ctx.stroke();
    }
  }
  // Floating leaves
  for(let l=0;l<15;l++){
    const lx=((T*15+l*80)%W)+Math.sin(T*0.5+l)*30;
    const ly=H*0.1+l*55+Math.sin(T*0.3+l*0.7)*20;
    ctx.globalAlpha=0.25+0.15*Math.sin(T+l);
    ctx.fillStyle=['#204010','#2A5018','#183008'][l%3];
    ctx.save();ctx.translate(lx,ly);ctx.rotate(Math.sin(T*0.8+l)*0.5);
    ctx.beginPath();ctx.ellipse(0,0,4,8,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  ctx.globalAlpha=1;ctx.shadowBlur=0;
}

function renderPlage(ctx,T){
  // Beach sunset gradient
  const sky=ctx.createLinearGradient(0,0,0,H*0.65);
  sky.addColorStop(0,'#050A18');sky.addColorStop(0.3,'#280818');
  sky.addColorStop(0.6,'#A03018');sky.addColorStop(1,'#E07030');
  ctx.fillStyle=sky;ctx.fillRect(0,0,W,H);
  // Sun on horizon
  const sunX=W*0.5+Math.sin(T*0.06)*40,sunY=H*0.62;
  const sunG=ctx.createRadialGradient(sunX,sunY,0,sunX,sunY,100);
  sunG.addColorStop(0,`rgba(255,200,60,${0.9+0.05*Math.sin(T*0.5)})`);
  sunG.addColorStop(0.4,'rgba(255,120,20,0.3)');sunG.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=sunG;ctx.fillRect(0,0,W,H);
  // Ocean — reflective golden water
  const seaGrad=ctx.createLinearGradient(0,H*0.6,0,H*0.75);
  seaGrad.addColorStop(0,'#1A1830');seaGrad.addColorStop(1,'#0C0C20');
  ctx.fillStyle=seaGrad;ctx.fillRect(0,H*0.6,W,H*0.15);
  // Sun reflection path on water
  const reflX=sunX,reflY=H*0.62;
  const refG=ctx.createLinearGradient(reflX,reflY,reflX,H*0.75);
  refG.addColorStop(0,`rgba(255,180,40,0.5)`);refG.addColorStop(1,'rgba(255,180,40,0.05)');
  ctx.fillStyle=refG;
  ctx.beginPath();ctx.moveTo(reflX-10,reflY);ctx.lineTo(reflX+10,reflY);ctx.lineTo(reflX+60,H*0.75);ctx.lineTo(reflX-60,H*0.75);ctx.closePath();ctx.fill();
  // Wave lines on water
  for(let w=0;w<8;w++){
    const wy=H*0.62+w*12+Math.sin(T*0.8+w*0.4)*3;
    const wA=0.08+0.06*Math.sin(T*1.5+w);
    ctx.strokeStyle=`rgba(255,200,100,${wA})`;ctx.lineWidth=1;
    ctx.beginPath();
    for(let x=0;x<=W;x+=6){ctx.lineTo(x,wy+Math.sin(x*0.04+T*2+w)*4);}
    ctx.stroke();
  }
  // Sandy beach
  const sand=ctx.createLinearGradient(0,H*0.74,0,H);
  sand.addColorStop(0,'#C07840');sand.addColorStop(1,'#A06030');
  ctx.fillStyle=sand;ctx.fillRect(0,H*0.74,W,H*0.26);
  // Sand ripple texture
  for(let r=0;r<10;r++){
    const ry=H*0.76+r*22;
    ctx.globalAlpha=0.08+0.04*Math.sin(T*0.5+r);
    ctx.strokeStyle='#D09050';ctx.lineWidth=0.7;
    ctx.beginPath();
    for(let x=0;x<=W;x+=8){ctx.lineTo(x,ry+Math.sin(x*0.03+r)*3);}
    ctx.stroke();
  }
  // Seagulls
  for(let g=0;g<6;g++){
    const gx=W*0.1+g*80+Math.sin(T*0.4+g)*40,gy=H*0.3+Math.sin(T*0.5+g*1.3)*30;
    const wing=Math.sin(T*3+g*0.8)*0.3;
    ctx.globalAlpha=0.5;ctx.strokeStyle='#604020';ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(gx-8,gy);ctx.quadraticCurveTo(gx-4,gy-4-wing*5,gx,gy);
    ctx.moveTo(gx,gy);ctx.quadraticCurveTo(gx+4,gy-4-wing*5,gx+8,gy);
    ctx.stroke();
  }
  ctx.globalAlpha=1;
}

// ── GENERATE ALL THEMES ──
const THEMES=[
  {name:'desert',render:renderDesert},
  {name:'nuit',render:renderNuit},
  {name:'arctique',render:renderArctique},
  {name:'enchante',render:renderEnchante},
  {name:'plage',render:renderPlage},
];

THEMES.forEach(({name,render})=>{
  console.log(`\n=== Generating ${name} (${FRAMES} frames) ===`);
  for(let f=0;f<FRAMES;f++){
    const canvas=createCanvas(W,H);
    const ctx2=canvas.getContext('2d');
    const Tsec=f/FPS;
    render(ctx2,Tsec);
    // Vignette
    const vig=ctx2.createRadialGradient(W/2,H/2,Math.min(W,H)*0.25,W/2,H/2,Math.max(W,H)*0.75);
    vig.addColorStop(0,'rgba(0,0,0,0)');vig.addColorStop(1,'rgba(0,0,0,0.45)');
    ctx2.fillStyle=vig;ctx2.fillRect(0,0,W,H);
    const buf=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(FRAMES_DIR,`${name}_${String(f).padStart(4,'0')}.png`),buf);
    if(f%60===0)process.stdout.write(`  frame ${f}/${FRAMES}\n`);
  }
  console.log(`Encoding bg_${name}.mp4...`);
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/${name}_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 22 -preset fast -tune animation "${OUT_DIR}/bg_${name}.mp4"`,{stdio:'inherit'});
  fs.readdirSync(FRAMES_DIR).forEach(fn=>{if(fn.startsWith(name+'_'))fs.unlinkSync(path.join(FRAMES_DIR,fn));});
  console.log(`  -> bg_${name}.mp4 done!`);
});
console.log('\nALL 5 REMAINING THEME VIDEOS COMPLETE!');
