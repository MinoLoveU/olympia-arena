import test from 'node:test';import assert from 'node:assert/strict';import {existsSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {finishQuestions} from '../multiplayer/compact-finish-bank.js';import {createRoom,act,snapshot} from '../multiplayer/game.js';
test('New finish pack has four ordered questions per team, source answers, equations and private solutions',()=>{
 assert.equal(finishQuestions.length,12);
 assert.deepEqual(finishQuestions.map(q=>q.solution),['Global problem','Điện đường trường trạm vùng cao','Mang chuông đi đánh xứ người','18/11','Làng Văn hoá-Du lịch các dân tộc Việt Nam','Hòa nhập nhưng không hòa tan','Quỹ “Vì người nghèo”','Free trade area','Ngoại giao vắc-xin','Xuân Quê hương','Bamboo diplomacy','Ngày Văn hóa các dân tộc Việt Nam']);
 for(let team=0;team<3;team++){
  const qs=finishQuestions.filter(q=>q.players[0]===team);assert.equal(qs.length,4);assert.deepEqual(qs.map(q=>q.points),[20,20,30,30]);
  for(const [i,q] of qs.entries()){assert.equal(q.id,`compact-finish-${team+1}-${i+1}`);assert.equal(q.duration,15);assert.equal(q.pending,false);assert.ok(q.text);assert.ok(!q.text.includes('Hello everyone'));assert.ok(!q.text.includes('=>'));if(q.media)assert.ok(existsSync(new URL('..'+q.media,import.meta.url)));
   const room=createRoom();act(room,'host',{type:'preset',id:q.id});
   for(const role of ['host','display','p0','p1','p2']){const s=snapshot(room,role);assert.equal(s.question.text,q.text);assert.equal(s.question.solution,role==='host'?q.solution:undefined);assert.equal(s.finish.owner,team);assert.equal(s.question.points,q.points);}
  }
 }
 assert.equal(finishQuestions.filter(q=>/^Xin mời.*Tiếng Anh/.test(q.text)).length,3);
 assert.equal(finishQuestions.filter(q=>q.mediaType==='image').length,3);
 assert.match(finishQuestions[11].text,/4x - 16 = 60\n3y \+ 8 = 20/);
 assert.equal(finishQuestions[3].media,'/assets/finish-compact-1-4.png');
 assert.match(finishQuestions[6].label,/Câu 3\/4/);
});
test('All three new finish videos retain sound and browser-compatible video',()=>{
 const qs=finishQuestions.filter(q=>q.mediaType==='video');assert.equal(qs.length,3);
 for(const q of qs){
  const data=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type,codec_name,pix_fmt:format=duration','-of','json',new URL('..'+q.media,import.meta.url).pathname],{encoding:'utf8'}));
  assert.deepEqual(data.streams.map(s=>s.codec_name),['h264','aac']);assert.equal(data.streams[0].pix_fmt,'yuv420p');assert.ok(Number(data.format.duration)>20);
  const r=createRoom();act(r,'host',{type:'preset',id:q.id});act(r,'host',{type:'video',questionId:r.questionId,action:'play'});assert.equal(r.phase,'ready');assert.equal(r.deadline,null);
 }
});
