import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {JSDOM} from 'jsdom';
import {builtInBank,obstacleSets} from '../multiplayer/bank.js';
import {createRoom,act,snapshot} from '../multiplayer/game.js';
const choose=(r,id)=>act(r,'host',{type:'obstacleSet',id});
const play=(r,id)=>act(r,'host',{type:'preset',id});
test('Expanded catalog: 60 speed, 60 finish at 20 points, 8 complete obstacle sets',()=>{
 const speed=builtInBank.filter(q=>q.round==='Tăng tốc'),finish=builtInBank.filter(q=>q.round==='Về đích');
 assert.equal(speed.length,60);assert.equal(new Set(speed.map(q=>q.text)).size,60);assert.equal(speed.filter(q=>q.duration===20).length,30);assert.equal(speed.filter(q=>q.duration===30).length,30);
 assert.equal(finish.length,60);assert.equal(new Set(finish.map(q=>q.text)).size,60);assert.ok(finish.every(q=>q.points===20&&q.duration===15));
 for(let i=0;i<3;i++)assert.equal(finish.filter(q=>q.players[0]===i).length,20);
 assert.equal(obstacleSets.length,8);
 for(const set of obstacleSets){const qs=builtInBank.filter(q=>q.obstacleSet===set.id);assert.equal(qs.length,10);assert.deepEqual(qs.filter(q=>q.clue!==undefined).map(q=>q.clue),[0,1,2,3,4,5,6,7,8]);assert.equal(qs.filter(q=>q.obstacleGuess).length,1);assert.ok(existsSync(new URL('..'+set.image,import.meta.url)));}
});
test('Visual counting answers match SVG contents',()=>{
 for(const q of builtInBank.filter(q=>q.media?.includes('speed-visual-'))){
  const doc=new JSDOM(readFileSync(new URL('..'+q.media,import.meta.url),'utf8'),{contentType:'image/svg+xml'});
  const tag=q.text.includes('hình tròn')?'circle':q.text.includes('hình vuông')?'rect':'path';
  const fill=q.text.includes('vàng')?'#ffd85b':q.text.includes('cyan')?'#6ddbea':'#f38d9f';
  assert.equal(doc.window.document.querySelectorAll(`${tag}[fill="${fill}"]`).length,Number(q.solution),q.id);doc.window.close();
 }
});
test('All 260 filled presets can be played, including center gates in each set',()=>{
 const r=createRoom();
 for(const round of ['Khởi động','Tăng tốc','Về đích','Câu hỏi phụ'])for(const q of builtInBank.filter(q=>q.round===round&&!q.pending)){play(r,q.id);assert.equal(r.question.solution,q.solution);}
 for(const set of obstacleSets){choose(r,set.id);const qs=builtInBank.filter(q=>q.obstacleSet===set.id);const center=qs.find(q=>q.clue===8);assert.throws(()=>play(r,center.id));for(const q of qs){play(r,q.id);assert.equal(r.question.solution,q.solution);}}
 assert.equal(r.usedQuestions.length,260);assert.equal(new Set(r.usedQuestions).size,260);
});
test('Switching sets, leaving round, and backup preserve independent progress without leaking host catalog',()=>{
 const r=createRoom();choose(r,'1');play(r,'obstacle-1');act(r,'host',{type:'tile',open:true});
 choose(r,'2');assert.deepEqual(r.opened,[]);assert.equal(r.image,'/assets/obstacle-2.svg');assert.equal(r.question,null);
 assert.throws(()=>play(r,'obstacle-2'));play(r,'obstacle-2-3');act(r,'host',{type:'tile',open:true});
 act(r,'host',{type:'round',round:'Tăng tốc'});const backup=snapshot(r,'host');assert.deepEqual(backup.obstacleProgress['2'].opened,[2]);
 const fresh=createRoom();act(fresh,'host',{type:'restore',backup});choose(fresh,'1');assert.deepEqual(fresh.opened,[0]);assert.deepEqual(fresh.usedClues,[0]);choose(fresh,'2');assert.deepEqual(fresh.opened,[2]);assert.deepEqual(fresh.usedClues,[2]);
 for(const role of ['display','p0','p1','p2']){const view=snapshot(fresh,role);assert.equal(view.obstacleSets,undefined);assert.equal(view.obstacleProgress,undefined);assert.equal(view.catalog,undefined);assert.equal(view.obstacleSet,'2');}
 play(fresh,'obstacle-2-4');act(fresh,'host',{type:'start'});assert.throws(()=>choose(fresh,'3'));assert.equal(fresh.obstacleSet,'2');
 act(fresh,'host',{type:'close'});assert.throws(()=>choose(fresh,'9'));assert.throws(()=>act(fresh,'p0',{type:'obstacleSet',id:'3'}));
 assert.throws(()=>act(fresh,'host',{type:'restore',backup:{...backup,obstacleProgress:{'2':{opened:[99],usedClues:[]}}}}));
});

test('All added visual assets are served; answer modules remain private',async()=>{
 const {createGameServer}=await import('../server.js');const {once}=await import('node:events');const {server}=createGameServer();server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`;
 try{for(const path of new Set([...obstacleSets.map(s=>s.image),...builtInBank.map(q=>q.media)].filter(Boolean))){const res=await fetch(base+path);assert.equal(res.status,200,path);if(path.endsWith('.jpg'))assert.match(res.headers.get('content-type'),/^image\/jpeg/);}for(const path of ['/multiplayer/expanded-bank.js','/multiplayer/obstacle-sets.js','/multiplayer/visual-questions.js','/multiplayer/warmup-bank.js'])assert.equal((await fetch(base+path)).status,404);}
 finally{await new Promise(r=>server.close(r));}
});
