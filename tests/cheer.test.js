import test from 'node:test';import assert from 'node:assert/strict';import {builtInBank,bankInfo,obstacleSets,cheerVideos} from '../multiplayer/bank.js';import {createRoom,act,snapshot} from '../multiplayer/game.js';
test('Six cheer slots replace tie questions, allow repeated selection, never accept answers or affect scores',()=>{
 assert.equal(cheerVideos.length,6);assert.equal(builtInBank.some(q=>q.round==='Câu hỏi phụ'),false);
 assert.deepEqual([...new Set(builtInBank.map(q=>q.round))],['Cổ vũ · trước Khởi động','Khởi động','Vượt chướng ngại vật','Tăng tốc','Cổ vũ · trước Về đích','Về đích']);
 const r=createRoom({questionBank:{bankInfo,obstacleSets,builtInBank:builtInBank.map(q=>q.cheer?{...q,media:''}:q)}});r.teams[0].score=50;
 for(const q of cheerVideos){
  for(let twice=0;twice<2;twice++)act(r,'host',{type:'preset',id:q.id});
  assert.equal(r.phase,'closed');assert.equal(r.deadline,null);assert.equal(snapshot(r,'display').question.text,r.teams[q.cheerTeam].name);
  for(const p of ['p0','p1','p2']){assert.equal(snapshot(r,p).question,null);assert.equal(snapshot(r,p).videoPlayback,null);assert.throws(()=>act(r,p,{type:'answer',questionId:r.questionId,text:'x'}));}
  assert.throws(()=>act(r,'host',{type:'start'}));assert.throws(()=>act(r,'host',{type:'video',questionId:r.questionId,action:'play'}));
 }
 assert.deepEqual(r.usedQuestions,[]);assert.deepEqual(r.teams.map(t=>t.score),[50,0,0]);
 act(r,'host',{type:'preset',id:'warm-1'});assert.equal(snapshot(r,'p0').question.text,r.question.text);assert.equal(r.phase,'ready');
});
test('Uploaded cheer video command and URL are delivered only to controller and projection',()=>{
 const bank={builtInBank:builtInBank.map(q=>q.id==='cheer-1-1'?{...q,media:'/assets/finish-compact-1-3.mp4'}:q),bankInfo,obstacleSets};
 const r=createRoom({questionBank:bank});act(r,'host',{type:'preset',id:'cheer-1-1'});
 for(const action of ['play','stop']){act(r,'host',{type:'video',questionId:r.questionId,action});
  for(const role of ['host','display'])assert.equal(snapshot(r,role).videoPlayback.action,action);
  for(const role of ['p0','p1','p2']){assert.equal(snapshot(r,role).question,null);assert.equal(snapshot(r,role).videoPlayback,null);}
  assert.equal(r.deadline,null);
 }
});

test('All six supplied cheer videos have playable picture and audio and correct section/team routing',async()=>{
 const {execFileSync}=await import('node:child_process');
 for(const q of cheerVideos){
  assert.equal(q.media,`/assets/cheer-${q.cheerSection}-${q.cheerTeam+1}.mp4`);
  const data=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,pix_fmt:format=duration','-of','json',new URL('..'+q.media,import.meta.url).pathname],{encoding:'utf8'}));
  assert.deepEqual(data.streams.map(s=>s.codec_name),['h264','aac']);assert.equal(data.streams[0].pix_fmt,'yuv420p');assert.ok(Number(data.format.duration)>15);
  const r=createRoom();act(r,'host',{type:'preset',id:q.id});act(r,'host',{type:'video',questionId:r.questionId,action:'play'});
  assert.equal(snapshot(r,'display').question.media,q.media);assert.equal(snapshot(r,'display').videoPlayback.action,'play');
  for(const role of ['p0','p1','p2'])assert.equal(snapshot(r,role).videoPlayback,null);
  assert.equal(r.phase,'closed');assert.equal(r.deadline,null);
 }
});
