import test from 'node:test';import assert from 'node:assert/strict';
import {builtInBank,obstacleSets} from '../multiplayer/bank.js';
import {createRoom,act,snapshot} from '../multiplayer/game.js';
test('Obstacle source keeps eight answers, all four red questions and four clue images private until publication',()=>{
 assert.deepEqual(obstacleSets.map(s=>s.answer),['Thuế máu','Cách mạng tháng 10','Bảo hộ','Quốc tế Cộng Sản','Thuộc địa','Chia để trị','Bản án chế độ thực dân Pháp','Chủ nghĩa tư bản']);
 const qs=builtInBank.filter(q=>q.obstacleSet);assert.equal(qs.length,80);assert.equal(qs.filter(q=>!q.pending).length,80);
 assert.equal(qs.filter(q=>q.pending).length,0);
 assert.deepEqual(['obstacle-2-center','obstacle-4-center','obstacle-6-center','obstacle-8-center'].map(id=>qs.find(q=>q.id===id).solution),['Quốc tế cộng sản','Đoàn kết quốc tế.','Phân hóa.','Tư hữu.']);
 assert.deepEqual(qs.filter(q=>q.media).map(q=>q.id),['obstacle-3-6','obstacle-5-3','obstacle-5-8','obstacle-7-2']);
 assert.ok(obstacleSets.every(s=>s.image&&!s.imagePending));
 for(const set of obstacleSets){const room=createRoom();act(room,'host',{type:'obstacleSet',id:set.id});assert.equal(room.question,null);
  for(const q of qs.filter(q=>q.obstacleSet===set.id)){
   if(q.pending){assert.throws(()=>act(room,'host',{type:'preset',id:q.id}),/để trống/);continue;}
   act(room,'host',{type:'preset',id:q.id});assert.equal(snapshot(room,'host').question.solution,q.solution);
   for(const role of ['display','p0','p1','p2']){const view=snapshot(room,role);assert.equal(view.question.solution,undefined);assert.equal(view.catalog,undefined);assert.equal(view.question.media,q.media||'');}
  }
 }
});
test('Centers unlock after all playable outer clues and old backups adopt new source pictures',()=>{
 for(const sid of ['5','6','7']){const r=createRoom();act(r,'host',{type:'obstacleSet',id:sid});const center=`obstacle-${sid}-center`;
  const clues=builtInBank.filter(q=>q.obstacleSet===sid&&q.clue<8&&!q.pending);assert.equal(clues.length,8);
  for(const q of clues){assert.throws(()=>act(r,'host',{type:'preset',id:center}));act(r,'host',{type:'preset',id:q.id});}
  act(r,'host',{type:'preset',id:center});assert.equal(r.selectedClue,8);
 }
 const r=createRoom(),b=snapshot(r,'host');b.image='/assets/obstacle-rainbow.svg';b.obstacleProgress={'2':{image:'/assets/obstacle-2.svg',opened:[1],usedClues:[1]}};
 act(r,'host',{type:'restore',backup:b});assert.equal(r.image,obstacleSets[0].image);act(r,'host',{type:'obstacleSet',id:'2'});assert.equal(r.image,obstacleSets[1].image);assert.deepEqual(r.opened,[1]);
});

test('Reordered source restores old set and question progress by identity',()=>{
 const r=createRoom(),b={...snapshot(r,'host'),obstacleBankVersion:undefined,round:'Vượt chướng ngại vật',obstacleSet:'2',image:'/assets/obstacle-source-2.png',opened:[1],usedClues:[1],usedQuestions:['obstacle-2-2','obstacle-5-center','speed-1'],obstacleProgress:{'2':{image:'/assets/obstacle-source-2.png',opened:[1],usedClues:[1]}}};
 act(r,'host',{type:'restore',backup:b});assert.equal(r.obstacleSet,'3');assert.equal(r.image,obstacleSets[2].image);assert.deepEqual(r.opened,[8]);assert.deepEqual(r.usedClues,[8]);assert.deepEqual(r.usedQuestions,['obstacle-3-center','obstacle-2-8','speed-1']);
 const restored=createRoom();act(restored,'host',{type:'restore',backup:snapshot(r,'host')});assert.equal(restored.obstacleSet,'3');assert.deepEqual(restored.opened,[8]);
});
