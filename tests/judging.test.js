import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,act,snapshot,expire} from '../multiplayer/game.js';
function prepare(id){const r=createRoom();act(r,'host',{type:'preset',id});act(r,'host',{type:'start'},100);return r;}
function judge(r,player,result,extra={}){return act(r,'host',{type:'judge',questionId:r.questionId,player,result,version:r.judgements[player]?.version||0,...extra});}
test('Private warm-up awards once, wrong/absent costs zero; corrections preserve manual adjustments',()=>{
 const r=prepare('warm-1');act(r,'host',{type:'close'});
 judge(r,0,'correct');assert.equal(r.teams[0].score,10);
 judge(r,0,'correct');assert.equal(r.teams[0].score,10);
 assert.throws(()=>judge(r,0,'wrong',{version:0}));assert.equal(r.teams[0].score,10);
 act(r,'host',{type:'score',player:0,score:50});judge(r,0,'wrong');assert.equal(r.teams[0].score,40);
 judge(r,0,'no-answer');assert.equal(r.teams[0].score,40);
 judge(r,0,'correct');assert.equal(r.teams[0].score,50);
 judge(r,0,'clear');assert.equal(r.teams[0].score,40);assert.equal(r.judgements[0].result,null);
 assert.throws(()=>judge(r,1,'correct'));
});
test('Common warm-up judges only first buzzer, +10 or -5 including silence, corrections replace previous award',()=>{
 const r=prepare('common-1');act(r,'p1',{type:'buzz',questionId:r.questionId},101);act(r,'p0',{type:'buzz',questionId:r.questionId},102);expire(r,3101);
 assert.throws(()=>judge(r,0,'correct'));
 judge(r,1,'no-answer');assert.equal(r.teams[1].score,-5);
 judge(r,1,'wrong');assert.equal(r.teams[1].score,-5);
 judge(r,1,'correct');assert.equal(r.teams[1].score,10);
 judge(r,1,'clear');assert.equal(r.teams[1].score,0);
 const empty=prepare('common-2');expire(empty,3100);assert.throws(()=>judge(empty,0,'no-answer'));assert.deepEqual(empty.teams.map(t=>t.score),[0,0,0]);
});
test('Judging enforces host, question ID, closed phase, version, and valid payload',()=>{
 const r=prepare('warm-1');assert.throws(()=>judge(r,0,'correct'));
 assert.throws(()=>act(r,'p0',{type:'judge',questionId:r.questionId,player:0,result:'correct',version:0},101));
 assert.throws(()=>act(r,'display',{type:'judge'}));act(r,'host',{type:'close'});
 assert.throws(()=>judge(r,0,'correct',{questionId:999}));assert.throws(()=>judge(r,3,'correct'));assert.throws(()=>judge(r,0,'bad'));assert.throws(()=>judge(r,0,'correct',{version:undefined}));
 judge(r,0,'correct');const before=r.teams[0].score;act(r,'host',{type:'preset',id:'warm-2'});act(r,'host',{type:'close'});
 assert.deepEqual(r.judgements,{});assert.throws(()=>judge(r,0,'correct',{questionId:1}));assert.equal(r.teams[0].score,before);
});
test('Other rounds record judgement without automatic points or opening obstacle tiles',()=>{
 for(const id of ['obstacle-1','speed-1','finish-1','tie-1']){
  const r=prepare(id);if(r.question.type==='buzz')act(r,'p0',{type:'buzz',questionId:r.questionId},101);act(r,'host',{type:'close'});
  for(const result of ['correct','wrong','no-answer']){judge(r,0,result);assert.equal(r.judgements[0].result,result);assert.equal(r.teams[0].score,0);}
  assert.deepEqual(r.opened,[]);
 }
});
test('Judgement synchronizes to all roles and backup restores totals without replaying awards',()=>{
 const r=prepare('warm-1');act(r,'host',{type:'close'});judge(r,0,'correct');
 for(const role of ['host','display','p0','p1','p2']){assert.equal(snapshot(r,role).judgements[0].result,'correct');assert.equal(snapshot(r,role).teams[0].score,10);}
 const fresh=createRoom();act(fresh,'host',{type:'restore',backup:snapshot(r,'host')});assert.equal(fresh.teams[0].score,10);assert.deepEqual(fresh.judgements,{});
 act(r,'host',{type:'waiting'});assert.deepEqual(r.judgements,{});assert.equal(r.teams[0].score,10);
});
