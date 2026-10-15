import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,act,snapshot} from './fixtures/full-pack.js';
import {builtInBank} from '../multiplayer/archive-bank.js';
const setup=()=>{const r=createRoom();act(r,'host',{type:'preset',id:'speed-2'});act(r,'host',{type:'start'},1000);return r;};
const answer=(r,p,text='đáp án',now=1234)=>act(r,`p${p}`,{type:'answer',questionId:r.questionId,text},now);
const judge=(r,p,result)=>act(r,'host',{type:'judge',questionId:r.questionId,player:p,result,version:r.judgements[p]?.version||0});
test('All 60 speed questions use free text; long Unicode answers remain intact and server times/ranks survive close',()=>{
 assert.equal(builtInBank.filter(q=>q.round==='Tăng tốc').length,60);
 assert.ok(builtInBank.filter(q=>q.round==='Tăng tốc').every(q=>q.type==='text'&&q.choices.length===0));
 const r=setup(),long='Tư tưởng Hồ Chí Minh 🌟 '.repeat(2000);
 answer(r,2,long,2234);answer(r,0,'hai',2234);answer(r,1,'ba',5556);
 assert.equal(r.answers[2].text,long.trim());assert.deepEqual([2,0,1].map(i=>[r.answers[i].rank,r.answers[i].elapsedMs]),[[1,1234],[2,1234],[3,4556]]);
 assert.equal(snapshot(r,'display').answers[2].text,null);assert.throws(()=>answer(r,2,'đổi',6000));
 act(r,'host',{type:'close'});act(r,'host',{type:'revealAnswers',show:true});
 for(const role of ['host','display','p0','p1','p2']){const s=snapshot(r,role);assert.equal(s.answers[2].elapsedMs,1234);assert.equal(s.answers[2].text,long.trim());}
});
test('Speed points follow MC correct-click order rather than receipt order, never duplicate, and repair ranks on corrections',()=>{
 const r=setup();for(const p of [2,0,1])answer(r,p);act(r,'host',{type:'close'});
 judge(r,1,'wrong');judge(r,0,'correct');judge(r,2,'correct');judge(r,1,'correct');
 assert.deepEqual(r.teams.map(t=>t.score),[40,20,30]);judge(r,0,'correct');assert.deepEqual(r.teams.map(t=>t.score),[40,20,30]);
 const stale=r.judgements[2].version;act(r,'host',{type:'score',player:2,score:100});judge(r,0,'wrong');
 assert.deepEqual(r.teams.map(t=>t.score),[0,30,110]);assert.throws(()=>act(r,'host',{type:'judge',questionId:r.questionId,player:2,result:'wrong',version:stale}));
 judge(r,0,'correct');assert.deepEqual(r.teams.map(t=>t.score),[20,30,110]);judge(r,2,'clear');assert.deepEqual(r.teams.map(t=>t.score),[30,40,70]);
 judge(r,1,'no-answer');assert.deepEqual(r.teams.map(t=>t.score),[40,0,70]);
 const restored=createRoom();act(restored,'host',{type:'restore',backup:snapshot(r,'host')});assert.deepEqual(restored.teams.map(t=>t.score),[40,0,70]);assert.deepEqual(restored.judgements,{});
 act(r,'host',{type:'preset',id:'speed-3'});assert.deepEqual(r.judgements,{});assert.deepEqual(r.answers,{});
});
test('Speed judging rejects missing answer, open phase and non-host; deadline remains authoritative',()=>{
 const r=setup();answer(r,0);assert.throws(()=>judge(r,0,'correct'));
 assert.throws(()=>answer(r,1,'late',26000));assert.throws(()=>act(r,'p0',{type:'judge',questionId:r.questionId,player:0,result:'correct',version:0},1500));
 act(r,'host',{type:'close'});assert.throws(()=>judge(r,1,'correct'));judge(r,1,'no-answer');assert.equal(r.teams[1].score,0);
});

test('Round-wide clocks enforce 25-second default for custom speed questions and 15 seconds for finish',()=>{
 for(const [round,seconds] of [['Tăng tốc',25],['Về đích',15]]){
  const r=createRoom();act(r,'host',{type:'question',round,duration:20,question:{text:'Kiểm tra thời gian',type:'text',players:[0],points:20}});assert.equal(r.duration,seconds);
  act(r,'host',{type:'start'},1000);assert.equal(r.deadline,1000+seconds*1000);
  if(round==='Tăng tốc')act(r,'p0',{type:'answer',questionId:r.questionId,text:'Trước hạn'},r.deadline-1);
  else assert.throws(()=>act(r,'p0',{type:'answer',questionId:r.questionId,text:'Trước hạn'},r.deadline-1),/trả lời miệng/);
  const late=createRoom();act(late,'host',{type:'preset',id:round==='Tăng tốc'?'speed-1':'finish-1'});act(late,'host',{type:'start'},1000);assert.throws(()=>act(late,'p0',{type:'answer',questionId:late.questionId,text:'Đúng hạn'},1000+seconds*1000));
 }
});


test('Every speed preset uses its requested duration and rejects answers at the exact deadline',()=>{
 const longer=[3,10,21,23,30,33,39,46],shorter=[17,19,27,32,36,48,51,55,58,60];
 for(let n=1;n<=60;n++){
  const r=createRoom(),seconds=longer.includes(n)?30:shorter.includes(n)?20:25;
  act(r,'host',{type:'preset',id:`speed-${n}`});assert.equal(r.duration,seconds,`question ${n}`);
  assert.equal(builtInBank.find(q=>q.id===`speed-${n}`).duration,seconds);
  act(r,'host',{type:'start'},1000);assert.equal(r.deadline,1000+seconds*1000);
  act(r,'p0',{type:'answer',questionId:r.questionId,text:'Trước hạn'},r.deadline-1);
  assert.throws(()=>act(r,'p1',{type:'answer',questionId:r.questionId,text:'Hết hạn'},r.deadline));
 }
});
