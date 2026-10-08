/* Short, original synthesized cues; only the projection enables playback. */
window.OlympiaSounds=class {
 constructor(){this.enabled=false;this.previous=null;this.lastTick=null;this.context=null;this.quietUntil=0;}
 async toggle(){
  if(this.enabled){this.enabled=false;if(this.master)this.master.gain.value=0;return false;}
  const Audio=window.AudioContext||window.webkitAudioContext;
  if(!Audio)throw Error('Trình duyệt chưa hỗ trợ âm thanh.');
  if(!this.context){this.context=new Audio();this.master=this.context.createGain();this.master.connect(this.context.destination);}
  await this.context.resume();
  if(this.context.state!=='running')throw Error('Chưa bật được âm thanh. Bấm lại nút Bật âm thanh.');
  this.master.gain.value=.22;this.enabled=true;this.play('enable');return true;
 }
 reset(){this.previous=null;this.lastTick=null;}
 observe(s){
  const previous=this.previous;this.previous=s;
  if(!previous||previous.questionId!==s.questionId){this.lastTick=null;return;}
  if(!s.question||s.role!=='display')return;
  if(!previous.buzzes.length&&s.buzzes.length)this.play('buzz');
  if(Object.entries(s.judgements||{}).some(([i,j])=>j.result==='correct'&&previous.judgements?.[i]?.result!=='correct'))this.play('correct');
  if(previous.phase==='open'&&s.phase==='closed'&&s.deadline&&s.serverNow>=s.deadline)this.play('end');
 }
 tick(s,left){
  if(s.role!=='display'||s.phase!=='open'||left<=0)return;
  const key=`${s.questionId}:${s.deadline}:${left}`;
  if(key===this.lastTick)return;this.lastTick=key;
  if(Date.now()>=this.quietUntil)this.play(left<=3?'urgent':'tick');
 }
 play(kind){
  if(!this.enabled||this.context?.state!=='running')return;
  const sequences={enable:[[660,0,.1],[880,.12,.16]],buzz:[[784,0,.18],[1175,.13,.38]],correct:[[523,0,.16],[659,.14,.16],[784,.28,.18],[1047,.44,.4]],tick:[[650,0,.045]],urgent:[[1000,0,.07]],end:[[440,0,.18],[330,.2,.35]]};
  if(['buzz','correct','end'].includes(kind))this.quietUntil=Date.now()+500;
  const now=this.context.currentTime;
  for(const [frequency,delay,duration] of sequences[kind]||[]){
   const oscillator=this.context.createOscillator(),gain=this.context.createGain(),start=now+delay;
   oscillator.type=kind==='buzz'?'triangle':'sine';oscillator.frequency.value=frequency;
   gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(kind==='tick'?.25:.65,start+.008);gain.gain.exponentialRampToValueAtTime(.001,start+duration);
   oscillator.connect(gain);gain.connect(this.master);oscillator.start(start);oscillator.stop(start+duration+.02);
   oscillator.onended=()=>{oscillator.disconnect();gain.disconnect();};
  }
 }
};
