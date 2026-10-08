import test from 'node:test';import assert from 'node:assert/strict';import {builtInBank} from '../multiplayer/bank.js';import {createRoom,act,snapshot} from '../multiplayer/game.js';import {existsSync} from 'node:fs';
test('Complete built-in pack: 86 unique entries, answers, timings and bundled media',()=>{assert.equal(builtInBank.length,86);assert.equal(new Set(builtInBank.map(q=>q.id)).size,86);assert.deepEqual(['Khởi động','Vượt chướng ngại vật','Tăng tốc','Về đích','Câu hỏi phụ'].map(round=>builtInBank.filter(q=>q.round===round).length),[60,10,4,9,3]);for(const q of builtInBank){assert.ok(q.text&&q.solution&&q.duration>0);if(q.type==='choice')assert.ok(q.choices.includes(q.solution));if(q.media)assert.ok(existsSync(new URL('..'+q.media,import.meta.url)));}assert.deepEqual(builtInBank.filter(q=>q.round==='Tăng tốc').map(q=>q.duration),[20,20,30,30]);});
test('Only host gets built-in catalog; preset opens correct question without typed content',()=>{const r=createRoom();assert.equal(snapshot(r,'host').catalog.length,86);for(const role of ['display','p0','p1','p2'])assert.equal(snapshot(r,role).catalog,undefined);assert.throws(()=>act(r,'p0',{type:'preset',id:'speed-1'}));act(r,'host',{type:'preset',id:'speed-2'});assert.equal(r.question.type,'choice');assert.equal(r.duration,20);assert.equal(snapshot(r,'display').question.solution,undefined);assert.throws(()=>act(r,'host',{type:'preset',id:'speed-2'}));});
test('Private questions accept only assigned team; common buzzer grants three new seconds',()=>{const r=createRoom();act(r,'host',{type:'preset',id:'warm-1'});act(r,'host',{type:'start'},100);assert.throws(()=>act(r,'p1',{type:'answer',questionId:1,text:'Hà Nội'},101));act(r,'p0',{type:'answer',questionId:1,text:'Hà Nội'},102);act(r,'host',{type:'close'});act(r,'host',{type:'preset',id:'common-1'});act(r,'host',{type:'start'},10000);act(r,'p2',{type:'buzz',questionId:2},12000);assert.equal(r.deadline,15000);});
test('Obstacle choice preserves waiting, independent masks and final answer',()=>{const r=createRoom();act(r,'host',{type:'round',round:'Vượt chướng ngại vật'});assert.equal(r.question,null);act(r,'host',{type:'preset',id:'obstacle-3'});assert.equal(r.selectedClue,2);act(r,'host',{type:'tile',open:true});act(r,'host',{type:'waiting'});assert.equal(r.question,null);assert.deepEqual(r.opened,[2]);act(r,'host',{type:'preset',id:'obstacle-answer'});assert.equal(r.question.type,'buzz');assert.equal(r.selectedClue,null);assert.equal(r.question.solution,'CẦU VỒNG');});

test('Warm-up has 15 private questions per team and 15 common questions, preserving saved IDs',()=>{
 const warm=builtInBank.filter(q=>q.round==='Khởi động');
 assert.equal(new Set(warm.map(q=>q.text)).size,60);
 for(let team=0;team<3;team++){
  const questions=warm.filter(q=>q.players?.includes(team));
  assert.equal(questions.length,15);
  assert.deepEqual(questions.map(q=>q.label),Array.from({length:15},(_,i)=>`Đội ${team+1} · Câu ${i+1}/15`));
  assert.ok(questions.every(q=>q.players.length===1&&q.type==='text'&&q.duration===3&&q.points===10));
  for(let i=1;i<=6;i++)assert.deepEqual(warm.find(q=>q.id===`warm-${team*6+i}`).players,[team]);
 }
 const common=warm.filter(q=>q.type==='buzz');assert.equal(common.length,15);
 assert.deepEqual(common.map(q=>q.id),Array.from({length:15},(_,i)=>`common-${i+1}`));
 assert.ok(common.every(q=>!q.players&&q.duration===3&&q.buzzAnswerSeconds===3));
 const room=createRoom();
 for(const q of warm){act(room,'host',{type:'preset',id:q.id});assert.equal(room.question.text,q.text);assert.equal(room.question.solution,q.solution);}
 assert.equal(room.usedQuestions.length,60);
});

test('Eight obstacle clues may be selected in any order; center unlocks only after all eight',()=>{
 const r=createRoom();act(r,'host',{type:'round',round:'Vượt chướng ngại vật'});
 assert.throws(()=>act(r,'host',{type:'preset',id:'obstacle-center'}));
 for(const n of [8,3,1,6,2,7,4,5]){
  act(r,'host',{type:'preset',id:`obstacle-${n}`});assert.equal(r.selectedClue,n-1);assert.equal(r.duration,15);
  const before=[...r.opened];act(r,'host',{type:'tile',open:true});assert.deepEqual(r.opened,[...before,n-1]);
  act(r,'host',{type:'tile',open:false});assert.deepEqual(r.opened,before);
  act(r,'host',{type:'tile',open:true});act(r,'host',{type:'waiting'});assert.equal(r.question,null);
  assert.throws(()=>act(r,'host',{type:'preset',id:`obstacle-${n}`}));
  if(r.usedClues.length<8)assert.throws(()=>act(r,'host',{type:'preset',id:'obstacle-center'}));
 }
 act(r,'host',{type:'preset',id:'obstacle-center'});assert.equal(r.selectedClue,8);assert.ok(!r.opened.includes(8));
 act(r,'host',{type:'tile',open:true});assert.equal(new Set(r.opened).size,9);
 act(r,'host',{type:'preset',id:'obstacle-answer'});assert.equal(r.selectedClue,null);assert.equal(r.question.type,'buzz');
 assert.deepEqual(r.teams.map(t=>t.score),[0,0,0]);
});
test('Nine-mask backup round trips, migrates old center, and rejects invalid indices',()=>{
 const r=createRoom(),backup={...snapshot(r,'host'),opened:[0,4,7,8],usedClues:[0,1,2,3,4,5,6,7,8]};
 act(r,'host',{type:'restore',backup});assert.deepEqual(r.opened,[0,4,7,8]);assert.deepEqual(r.usedClues,backup.usedClues);
 const {obstacleClueCount,...old}=backup;
 act(r,'host',{type:'restore',backup:{...old,opened:[1,4],usedClues:[0,1,2,3,4]}});assert.deepEqual(r.opened,[1,8]);assert.deepEqual(r.usedClues,[0,1,2,3,8]);
 assert.throws(()=>act(r,'host',{type:'restore',backup:{...backup,opened:[9]}}));
 assert.throws(()=>act(r,'host',{type:'restore',backup:{...old,opened:[7]}}));
});
