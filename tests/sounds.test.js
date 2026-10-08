import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const source=readFileSync(new URL('../multiplayer/sounds.js',import.meta.url),'utf8');
function setup(AudioContext){const window={AudioContext};vm.runInNewContext(source,{window,Date});return new window.OlympiaSounds();}
const snapshot=(extra={})=>({role:'display',questionId:1,question:{type:'buzz'},phase:'open',deadline:10000,serverNow:5000,buzzes:[],judgements:{},...extra});
test('Cues follow confirmed transitions once, not sync/reconnect or other roles',()=>{
 const audio=setup(),events=[];audio.play=kind=>events.push(kind);
 audio.observe(snapshot());assert.deepEqual(events,[]);
 const buzz=snapshot({buzzes:[{player:2,rank:1}]});audio.observe(buzz);audio.observe(buzz);assert.deepEqual(events,['buzz']);
 audio.observe({...buzz,buzzes:[...buzz.buzzes,{player:0,rank:2}]});assert.equal(events.length,1);
 const correct={...buzz,judgements:{2:{result:'correct',version:1}}};audio.observe(correct);audio.observe(correct);assert.deepEqual(events,['buzz','correct']);
 audio.observe({...correct,judgements:{2:{result:'correct',version:2}}});assert.equal(events.length,2);
 audio.reset();audio.observe(correct);assert.equal(events.length,2);
 audio.observe({...correct,questionId:2});assert.equal(events.length,2);
 audio.reset();audio.observe(snapshot({role:'host'}));audio.observe({...correct,role:'host'});assert.equal(events.length,2);
 audio.reset();audio.observe(snapshot());audio.observe(snapshot({phase:'closed',deadline:null}));assert.equal(events.length,2);
 audio.reset();audio.observe(snapshot());audio.observe(snapshot({phase:'closed',serverNow:10000}));assert.equal(events.at(-1),'end');
 audio.observe(snapshot({phase:'closed',serverNow:10001}));assert.equal(events.filter(e=>e==='end').length,1);
});
test('Countdown ticks once per second, resets for buzzer extension, stops when closed',()=>{
 const audio=setup(),events=[];audio.play=kind=>events.push(kind);
 for(let i=0;i<10;i++)audio.tick(snapshot(),5);
 audio.tick(snapshot(),4);audio.tick(snapshot(),3);audio.tick(snapshot(),2);audio.tick(snapshot(),1);audio.tick(snapshot(),0);
 assert.deepEqual(events,['tick','tick','urgent','urgent','urgent']);
 audio.tick(snapshot({deadline:12000}),3);assert.equal(events.length,6);
 audio.tick(snapshot({phase:'closed'}),2);audio.tick(snapshot({role:'p0'}),2);assert.equal(events.length,6);
});
test('Audio requires an explicit enable, creates finite tones, and mutes immediately',async()=>{
 const tones=[],gains=[];
 class Audio {
  state='suspended';currentTime=0;destination={};
  async resume(){this.state='running';}
  createGain(){const gain={value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}};gains.push(gain);return {gain,connect(){},disconnect(){}};}
  createOscillator(){const tone={frequency:{},connect(){},disconnect(){},start(t){this.startTime=t;},stop(t){this.endTime=t;}};tones.push(tone);return tone;}
 }
 const audio=setup(Audio);audio.play('buzz');assert.equal(tones.length,0);
 assert.equal(await audio.toggle(),true);const before=tones.length;
 audio.play('buzz');audio.play('correct');audio.play('tick');audio.play('urgent');audio.play('end');
 assert.equal(tones.length-before,10);assert.ok(tones.every(t=>t.endTime>t.startTime&&t.endTime<1));
 assert.equal(await audio.toggle(),false);assert.equal(gains[0].value,0);const muted=tones.length;audio.play('correct');assert.equal(tones.length,muted);
 await assert.rejects(()=>setup().toggle(),/hỗ trợ/);
});
