import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {builtInBank} from '../multiplayer/bank.js';
import {createRoom,act,snapshot} from '../multiplayer/game.js';
import {createGameServer} from '../server.js';
const finish=builtInBank.filter(q=>q.round==='Về đích');
test('Finish source: 20 per team, six videos, six English prompts, source images and matching exercise',()=>{
 for(let team=0;team<3;team++)assert.deepEqual(finish.filter(q=>q.players[0]===team).map(q=>q.label),Array.from({length:20},(_,i)=>`Đội ${team+1} · Câu ${i+1}/20 · 20 điểm`));
 assert.equal(finish.filter(q=>q.mediaType==='video').length,6);
 const english=finish.filter(q=>q.text.startsWith('Xin mời các bạn trả lời câu hỏi sau bằng Tiếng Anh'));
 assert.equal(english.length,6);assert.ok(english.every(q=>q.text==='Xin mời các bạn trả lời câu hỏi sau bằng Tiếng Anh'));
 assert.equal(finish.filter(q=>q.mediaType==='image').length,8);
 assert.match(finish.find(q=>q.players[0]===1&&q.label.includes('Câu 5/')).text,/1\. Việt Nam.*\n[\s\S]*A\. Đại hội VIII/);
 for(const q of finish){const room=createRoom();act(room,'host',{type:'preset',id:q.id});for(const role of ['display','p0','p1','p2'])assert.equal(snapshot(room,role).question.solution,undefined);assert.equal(snapshot(room,'host').question.solution,q.solution);}
});
test('MC video commands are authoritative, scoped to current question and independent of timer',()=>{
 const room=createRoom(),q=finish.find(q=>q.mediaType==='video');act(room,'host',{type:'preset',id:q.id});
 const command={type:'video',questionId:room.questionId,action:'play'};
 for(const role of ['display','p0','p1','p2'])assert.throws(()=>act(room,role,command));
 act(room,'host',command,1000);assert.equal(room.phase,'ready');assert.equal(room.deadline,null);
 for(const role of ['host','display','p0','p1','p2'])assert.deepEqual(snapshot(room,role).videoPlayback,room.videoPlayback);
 const sequence=room.videoPlayback.sequence;act(room,'host',command,2000);assert.ok(room.videoPlayback.sequence>sequence);
 act(room,'host',{...command,action:'stop'},3000);assert.equal(room.videoPlayback.action,'stop');
 act(room,'host',{type:'start'},4000);assert.equal(room.deadline,24000);act(room,'host',command,5000);assert.equal(room.deadline,24000);
 act(room,'host',{type:'close'});act(room,'host',{type:'preset',id:'finish-1'});assert.equal(snapshot(room,'display').videoPlayback,null);assert.throws(()=>act(room,'host',command));
});
test('Bundled videos support byte ranges, invalid ranges fail and answers module is private',async()=>{
 const {server}=createGameServer();server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 try{
  for(const q of finish.filter(q=>q.mediaType==='video')){const r=await fetch(base+q.media,{headers:{Range:'bytes=0-1023'}});assert.equal(r.status,206);assert.equal(r.headers.get('content-type'),'video/mp4');assert.equal((await r.arrayBuffer()).byteLength,1024);assert.match(r.headers.get('content-range'),/^bytes 0-1023\//);}
  const path=finish.find(q=>q.mediaType==='video').media;
  for(const range of ['bytes=9999999999-','bytes=20-5','bytes=','bytes=0-1,4-5'])assert.equal((await fetch(base+path,{headers:{Range:range}})).status,416);
  const suffix=await fetch(base+path,{headers:{Range:'bytes=-100'}});assert.equal(suffix.status,206);assert.equal((await suffix.arrayBuffer()).byteLength,100);
  assert.equal((await fetch(base+'/multiplayer/finish-bank.js')).status,404);
 }finally{server.closeAllConnections();await new Promise(r=>server.close(r));}
});
