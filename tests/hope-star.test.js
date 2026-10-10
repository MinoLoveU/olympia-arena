import test from 'node:test';import assert from 'node:assert/strict';
import {createRoom,act,snapshot} from '../multiplayer/game.js';import {builtInBank} from '../multiplayer/bank.js';
const select=(r,player,index=0)=>act(r,'host',{type:'preset',id:builtInBank.filter(q=>q.round==='Về đích'&&q.players[0]===player)[index].id});
const star=r=>act(r,'host',{type:'hopeStar',questionId:r.questionId});
const judge=(r,player,result)=>act(r,'host',{type:'judge',questionId:r.questionId,player,result,version:r.judgements[player]?.version||0});
test('Each team has two stars across its 20 finish questions; duplicate/stale/unauthorized use is rejected',()=>{
 const r=createRoom();assert.throws(()=>star(r));
 for(let player=0;player<3;player++){
  const questions=builtInBank.filter(q=>q.round==='Về đích'&&q.players[0]===player);assert.equal(questions.length,20);assert.ok(questions.every(q=>q.points===20));
  for(let index=0;index<2;index++){
   select(r,player,index);
   assert.throws(()=>act(r,'p0',{type:'hopeStar',questionId:r.questionId}));
   assert.throws(()=>act(r,'display',{type:'hopeStar',questionId:r.questionId}));
   assert.throws(()=>act(r,'host',{type:'hopeStar',questionId:r.questionId-1}));
   star(r);assert.equal(r.hopeUsed[player],index+1);assert.throws(()=>star(r));assert.equal(r.hopeUsed[player],index+1);
   for(const role of ['host','display','p0','p1','p2'])assert.equal(snapshot(r,role).hopeStar.player,player);
   act(r,'host',{type:'waiting'});assert.equal(r.hopeStar,null);
  }
  select(r,player,2);assert.throws(()=>star(r));assert.equal(r.hopeUsed[player],2);
 }
});
test('Star scoring is +40/-40, correction is a delta, clear does not refund a star',()=>{
 const r=createRoom();select(r,1);star(r);assert.throws(()=>judge(r,1,'correct'));
 act(r,'host',{type:'start'});assert.throws(()=>star(r));act(r,'host',{type:'close'});
 judge(r,1,'correct');assert.equal(r.teams[1].score,40);judge(r,1,'correct');assert.equal(r.teams[1].score,40);
 act(r,'host',{type:'score',player:1,score:100});judge(r,1,'wrong');assert.equal(r.teams[1].score,20);
 judge(r,1,'no-answer');assert.equal(r.teams[1].score,20);judge(r,1,'clear');assert.equal(r.teams[1].score,60);assert.equal(r.hopeUsed[1],1);
 assert.throws(()=>judge(r,0,'correct'));select(r,1,1);assert.equal(r.hopeStar,null);
 act(r,'host',{type:'close'});judge(r,1,'correct');assert.equal(r.teams[1].score,60);
});
test('Star only activates before starting a 20-point single-team finish question',()=>{
 const r=createRoom();act(r,'host',{type:'preset',id:'warm-1'});assert.throws(()=>star(r));
 select(r,0);act(r,'host',{type:'start'});assert.throws(()=>star(r));act(r,'host',{type:'close'});assert.throws(()=>star(r));
 act(r,'host',{type:'question',round:'Về đích',duration:15,question:{text:'Test',type:'text',players:[0,1],points:20}});assert.throws(()=>star(r));
 assert.deepEqual(r.hopeUsed,[0,0,0]);
});
test('Backup preserves used stars and scores, never replays active star; legacy defaults and validation are safe',()=>{
 const r=createRoom();select(r,2);star(r);act(r,'host',{type:'close'});judge(r,2,'correct');
 const backup=snapshot(r,'host'),fresh=createRoom();act(fresh,'host',{type:'restore',backup});
 assert.deepEqual(fresh.hopeUsed,[0,0,1]);assert.equal(fresh.hopeStar,null);assert.equal(fresh.teams[2].score,40);
 select(fresh,2,1);star(fresh);assert.equal(fresh.hopeUsed[2],2);
 for(const hopeUsed of [[3,0,0],[-1,0,0],[0,0],{},[0,1.5,0]])assert.throws(()=>act(fresh,'host',{type:'restore',backup:{...backup,hopeUsed}}));
 const {hopeUsed,...legacy}=backup;act(fresh,'host',{type:'restore',backup:legacy});assert.deepEqual(fresh.hopeUsed,[0,0,0]);
});
