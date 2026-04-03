'use strict';
// ─── WEB AUDIO ────────────────────────────────────────────────────────────────
let _ac=null,_soundEnabled=true;
let _volume=0.7;try{const _sv=parseFloat(localStorage.getItem('bp_volume'));if(!isNaN(_sv))_volume=Math.max(0,Math.min(1,_sv));}catch(e){}
function _getAC(){if(!_ac)try{_ac=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}return _ac;}
function _tone(freq,dur,type,vol,delay){
  if(!_soundEnabled)return;
  try{const ac=_getAC();if(!ac)return;
  const o=ac.createOscillator(),g=ac.createGain();
  o.connect(g);g.connect(ac.destination);o.type=type||'square';o.frequency.value=freq;
  const t=ac.currentTime+(delay||0);
  g.gain.setValueAtTime(0.001,t);g.gain.linearRampToValueAtTime((vol||0.15)*_volume,t+0.01);
  g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  o.start(t);o.stop(t+dur+0.05);}catch(e){}
}
function _vib(pattern){try{if(navigator.vibrate)navigator.vibrate(pattern);}catch(e){}}
function sndPlace(){_tone(200,0.06,'square',0.10);_vib(18);}
function sndClear(n){_tone(440,0.10,'sine',0.20);_tone(660,0.12,'sine',0.16,0.08);if(n>=2)_tone(880,0.14,'sine',0.18,0.17);_vib(n>=3?[40,20,40]:30);}
function sndCombo(c){const b=400+c*60;_tone(b,0.09,'sine',0.22);_tone(b*1.5,0.09,'sine',0.18,0.09);_tone(b*2,0.16,'sine',0.22,0.18);_vib(c>=4?[30,15,30,15,60]:40);}
function sndGameOver(){_tone(220,0.35,'sawtooth',0.22);_tone(165,0.45,'sawtooth',0.18,0.32);_tone(110,0.55,'sawtooth',0.15,0.65);_vib([80,40,80,40,120]);}
function sndBonus(){_tone(660,0.07,'sine',0.18);_tone(880,0.07,'sine',0.18,0.09);_tone(1100,0.11,'sine',0.22,0.18);_vib([20,10,20]);}
let _soundRect=null,_pauseHudRect=null,_pauseBtns={},_pauseStartTime=0;
let _volumeSliderRect=null;
