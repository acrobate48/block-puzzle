'use strict';
const {createCanvas}=require('canvas');
const fs=require('fs');
const path=require('path');
const {execSync}=require('child_process');

const FFMPEG='c:/Users/Admin/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1-full_build/bin/ffmpeg.exe';
const FRAMES_DIR=path.join(__dirname,'frames');
const OUT_DIR=path.join(__dirname);

function lerp(a,b,t){return a+(b-a)*t;}
function easeOut(t){return 1-(1-t)*(1-t);}

const COLORS=['#3AC644','#C6D026','#DA4E30','#EE8A1C','#4EBC80','#9E3AC6','#30B2C6','#EEB23A','#62DA4E','#E040A0'];

// ── VIDEO 1: CELEBRATION ──
{
  const W=540,H=960,FRAMES=90,FPS=30;
  // Confetti particles — use fixed seed-like values for reproducibility
  const confetti=Array.from({length:80},(_,i)=>({
    x:W/2+(((i*137.5)%100)/100-0.5)*W*0.3,
    y:H/2+(((i*73.1)%100)/100-0.5)*H*0.2,
    vx:(((i*41.3)%100)/100-0.5)*12,
    vy:-(8+(((i*29.7)%100)/100)*14),
    rot:((i*57.3)%100)/100*Math.PI*2,
    rotV:(((i*19.9)%100)/100-0.5)*0.3,
    w:8+(((i*83.7)%100)/100)*16,
    h:4+(((i*61.1)%100)/100)*8,
    col:COLORS[i%COLORS.length],
    gravity:0.4+(((i*47.3)%100)/100)*0.2
  }));
  // Stars burst
  const stars=Array.from({length:20},(_,i)=>({
    x:W/2,y:H/2,
    angle:i/20*Math.PI*2,
    speed:5+(((i*53.9)%100)/100)*10,
    size:3+(((i*31.7)%100)/100)*8,
    col:i%2===0?'#FFD700':'#FFFFFF',
    life:1
  }));

  console.log('Generating celebration frames...');
  for(let f=0;f<FRAMES;f++){
    const canvas=createCanvas(W,H);
    const ctx=canvas.getContext('2d');
    const T=f/FPS,tNorm=f/FRAMES;

    // Dark bg (game over screen style)
    ctx.fillStyle='rgba(0,0,0,0.85)';ctx.fillRect(0,0,W,H);

    // Center burst flash
    if(f<10){
      const flash=1-f/10;
      const g=ctx.createRadialGradient(W/2,H/2,0,W/2,H/2,W*0.5);
      g.addColorStop(0,`rgba(255,220,50,${0.8*flash})`);
      g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    }

    // Star rays
    stars.forEach((s,i)=>{
      const dist=easeOut(tNorm)*s.speed*30*(1-tNorm*0.5);
      const sx=W/2+Math.cos(s.angle)*dist,sy=H/2+Math.sin(s.angle)*dist;
      const alpha=Math.max(0,1-tNorm*1.5);
      ctx.save();ctx.globalAlpha=alpha;
      ctx.fillStyle=s.col;ctx.shadowColor=s.col;ctx.shadowBlur=s.size*2;
      // 4-point star shape
      ctx.beginPath();
      for(let pt=0;pt<8;pt++){
        const a=pt*Math.PI/4,r=pt%2===0?s.size:s.size*0.35;
        if(pt===0){ctx.moveTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);}else{ctx.lineTo(sx+Math.cos(a)*r,sy+Math.sin(a)*r);}
      }
      ctx.closePath();ctx.fill();
      ctx.restore();
    });

    // Confetti — update physics then draw
    confetti.forEach(p=>{
      p.x+=p.vx; p.y+=p.vy; p.vy+=p.gravity; p.rot+=p.rotV;
      if(p.y>H+50){p.y=-10;p.x=((p.x*137)%W);p.vy=-(5+(((p.vx*73)%100)/100)*8);p.vx=(((p.vx*41)%100)/100-0.5)*6;}
      const alpha=p.y>H*0.8?Math.max(0,1-(p.y-H*0.8)/(H*0.2)):1;
      ctx.save();ctx.globalAlpha=alpha*0.9;
      ctx.translate(p.x,p.y);ctx.rotate(p.rot);
      ctx.fillStyle=p.col;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
    });

    // NEW RECORD text
    const textAlpha=f<10?f/10:f>70?1-(f-70)/20:1;
    ctx.save();ctx.globalAlpha=textAlpha;
    const pulse=1+0.05*Math.sin(T*8);
    ctx.translate(W/2,H/2+20);ctx.scale(pulse,pulse);
    ctx.font='bold 72px Impact, Arial Black, sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const tg=ctx.createLinearGradient(0,-36,0,36);
    tg.addColorStop(0,'#FFFFC0');tg.addColorStop(0.4,'#FFD700');tg.addColorStop(1,'#FF9000');
    ctx.shadowColor='#FFD700';ctx.shadowBlur=40;
    ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=6;ctx.lineJoin='round';
    ctx.strokeText('\u2605 RECORD \u2605',0,0);
    ctx.fillStyle=tg;ctx.fillText('\u2605 RECORD \u2605',0,0);
    ctx.restore();

    const buf=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(FRAMES_DIR,`cel_${String(f).padStart(4,'0')}.png`),buf);
    if(f%15===0)process.stdout.write(`  celebration: frame ${f}/${FRAMES}\n`);
  }
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/cel_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${OUT_DIR}/celebration.mp4"`,{stdio:'inherit'});
  fs.readdirSync(FRAMES_DIR).forEach(fn=>{if(fn.startsWith('cel_'))fs.unlinkSync(path.join(FRAMES_DIR,fn));});
  console.log('celebration.mp4 done!');
}

// ── VIDEO 2: LINE CLEAR EFFECT ──
{
  const W=400,H=80,FRAMES=30,FPS=30;
  console.log('Generating line_clear frames...');
  for(let f=0;f<FRAMES;f++){
    const canvas=createCanvas(W,H);
    const ctx=canvas.getContext('2d');
    const T=f/FRAMES;
    const eased=T<0.5?2*T*T:1-Math.pow(-2*T+2,2)/2;

    ctx.fillStyle='#060E06';ctx.fillRect(0,0,W,H);

    // White flash at start
    if(T<0.25){const flash=1-T/0.25;ctx.fillStyle=`rgba(255,255,255,${flash*0.9})`;ctx.fillRect(0,0,W,H);}

    // Colored cells with pop animation
    for(let c=0;c<10;c++){
      const cellW=W/10,x=c*cellW;
      const delay=c/20;
      const ct=Math.max(0,Math.min(1,(T-delay)*3));
      const scale=ct>0?ct*(1.2-ct*0.2):0;
      const col=COLORS[c%COLORS.length];
      ctx.save();ctx.globalAlpha=Math.max(0,1-T*1.5);
      ctx.translate(x+cellW/2,H/2);ctx.scale(scale,scale);
      ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=15;
      ctx.fillRect(-cellW/2+2,-H/2+2,cellW-4,H-4);
      ctx.restore();
    }

    // Sweep beam left to right
    const sweepX=eased*W;
    const sg=ctx.createLinearGradient(sweepX-40,0,sweepX+15,0);
    sg.addColorStop(0,'rgba(255,255,255,0)');
    sg.addColorStop(0.6,`rgba(255,255,255,${0.8*(1-T)})`);
    sg.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);

    const buf=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(FRAMES_DIR,`lc_${String(f).padStart(4,'0')}.png`),buf);
  }
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/lc_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 16 -preset fast "${OUT_DIR}/line_clear.mp4"`,{stdio:'inherit'});
  fs.readdirSync(FRAMES_DIR).forEach(fn=>{if(fn.startsWith('lc_'))fs.unlinkSync(path.join(FRAMES_DIR,fn));});
  console.log('line_clear.mp4 done!');
}

// ── VIDEO 3: LOGO LOOP ──
{
  const W=540,H=300,FRAMES=120,FPS=30;
  const BLOCK_COLS=['#3AC644','#C6D026','#DA4E30','#EE8A1C','#4EBC80','#9E3AC6'];
  console.log('Generating logo_loop frames...');
  for(let f=0;f<FRAMES;f++){
    const canvas=createCanvas(W,H);
    const ctx=canvas.getContext('2d');
    const T=f/FPS;

    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,'#0F1A0F');bg.addColorStop(1,'#060A0A');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    // 6 animated blocks (2 rows of 3)
    const bsz=44,bpad=8;
    const totalW=3*(bsz+bpad)-bpad,totalH=2*(bsz+bpad)-bpad;
    const bstartX=(W-totalW)/2-20,bstartY=(H-totalH)/2;
    BLOCK_COLS.forEach((col,i)=>{
      const col2=i%3,row2=Math.floor(i/3);
      const bx=bstartX+col2*(bsz+bpad);
      const by=bstartY+row2*(bsz+bpad);
      const bob=Math.sin(T*2+i*0.7)*4;
      const pulse=0.85+0.15*Math.abs(Math.sin(T*1.5+i*0.9));
      ctx.save();
      ctx.shadowColor=col;ctx.shadowBlur=12*pulse;
      const g=ctx.createLinearGradient(bx,by+bob,bx+bsz,by+bob+bsz);
      g.addColorStop(0,col+'FF');g.addColorStop(1,col+'99');
      ctx.fillStyle=g;
      // Use fillRect with rounded corner simulation (roundRect may not be available in older canvas)
      ctx.beginPath();
      const r=8,bxr=bx,byr=by+bob;
      ctx.moveTo(bxr+r,byr);
      ctx.lineTo(bxr+bsz-r,byr);
      ctx.quadraticCurveTo(bxr+bsz,byr,bxr+bsz,byr+r);
      ctx.lineTo(bxr+bsz,byr+bsz-r);
      ctx.quadraticCurveTo(bxr+bsz,byr+bsz,bxr+bsz-r,byr+bsz);
      ctx.lineTo(bxr+r,byr+bsz);
      ctx.quadraticCurveTo(bxr,byr+bsz,bxr,byr+bsz-r);
      ctx.lineTo(bxr,byr+r);
      ctx.quadraticCurveTo(bxr,byr,bxr+r,byr);
      ctx.closePath();
      ctx.fill();
      // Highlight
      ctx.globalAlpha=0.3;ctx.fillStyle='rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.moveTo(bxr+r,byr+3);
      ctx.lineTo(bxr+bsz-r,byr+3);
      ctx.quadraticCurveTo(bxr+bsz-3,byr+3,bxr+bsz-3,byr+r);
      ctx.lineTo(bxr+bsz-3,byr+bsz*0.4);
      ctx.lineTo(bxr+3,byr+bsz*0.4);
      ctx.lineTo(bxr+3,byr+r);
      ctx.quadraticCurveTo(bxr+3,byr+3,bxr+r,byr+3);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    // Title text
    ctx.font='bold 58px Impact, Arial Black, sans-serif';
    ctx.textAlign='left';ctx.textBaseline='middle';
    const tx=bstartX+3*(bsz+bpad)+12;
    const shimmer=Math.sin(T*3)*0.15;
    const tg=ctx.createLinearGradient(tx,H/2-25,tx,H/2+25);
    tg.addColorStop(0,`rgba(255,255,${Math.round(160+shimmer*60)},1)`);
    tg.addColorStop(0.4,'#FFD700');tg.addColorStop(1,'#FF9000');
    ctx.shadowColor='#FFD700';ctx.shadowBlur=20+10*Math.abs(Math.sin(T*2));
    ctx.strokeStyle='rgba(0,0,0,0.4)';ctx.lineWidth=5;
    ctx.strokeText('BLOCK',tx,H/2-18);ctx.strokeText('PUZZLE',tx,H/2+22);
    ctx.fillStyle=tg;ctx.fillText('BLOCK',tx,H/2-18);
    ctx.fillStyle='#50C8F0';ctx.shadowColor='#50C8F0';ctx.shadowBlur=15;
    ctx.fillText('PUZZLE',tx,H/2+22);
    ctx.shadowBlur=0;

    const buf=canvas.toBuffer('image/png');
    fs.writeFileSync(path.join(FRAMES_DIR,`logo_${String(f).padStart(4,'0')}.png`),buf);
    if(f%30===0)process.stdout.write(`  logo: frame ${f}/${FRAMES}\n`);
  }
  execSync(`"${FFMPEG}" -y -framerate ${FPS} -i "${FRAMES_DIR}/logo_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 18 -preset fast "${OUT_DIR}/game_logo_loop.mp4"`,{stdio:'inherit'});
  fs.readdirSync(FRAMES_DIR).forEach(fn=>{if(fn.startsWith('logo_'))fs.unlinkSync(path.join(FRAMES_DIR,fn));});
  console.log('game_logo_loop.mp4 done!');
}

console.log('\nALL UI ANIMATION VIDEOS COMPLETE!');
