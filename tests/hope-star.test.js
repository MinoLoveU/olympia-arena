import test from 'node:test';import assert from 'node:assert/strict';
import {createRoom,act,snapshot,expire} from '../multiplayer/game.js';
const select=(r,player=0,points=20,hopeStar=false)=>act(r,'host',{type:'question',round:'Về đích',duration:15,hopeStar,question:{text:'Test',type:'text',players:[player],points}});
const judge=(r,player,result,now=1000)=>act(r,'host',{type:'judge',questionId:r.questionId,player,result,version:r.judgements[player]?.version||0},now);
const buzz=(r,player,now=1001)=>act(r,'p'+player,{type:'finishBuzz',questionId:r.questionId},now);
test('One star per team, attached atomically before publication; late and unauthorized activation rejected',()=>{
 const r=createRoom();
 for(let p=0;p<3;p++){
  select(r,p,20,true);assert.equal(r.hopeUsed[p],1);
  for(const role of ['host','display','p0','p1','p2'])assert.equal(snapshot(r,role).hopeStar.player,p);
  assert.throws(()=>act(r,'host',{type:'hopeStar',questionId:r.questionId}));
  assert.throws(()=>act(r,'p0',{type:'question',round:'Về đích',hopeStar:true}));
  act(r,'host',{type:'waiting'});assert.equal(r.hopeStar,null);
  assert.throws(()=>select(r,p,30,true));assert.equal(r.question,null);assert.equal(r.hopeUsed[p],1);
 }
 assert.throws(()=>act(r,'host',{type:'question',round:'Về đích',duration:15,hopeStar:true,question:{text:'Bad',type:'text',players:[0,1],points:20}}));
});
test('Main scoring and star penalties use 20/30 points; correction preserves manual changes and refunds dependent steal',()=>{
 for(const points of [20,30])for(const star of [false,true]){
  const r=createRoom();select(r,0,points,star);assert.throws(()=>judge(r,0,'correct'));act(r,'host',{type:'close'});
  judge(r,0,'correct');assert.equal(r.teams[0].score,points*(star?2:1));judge(r,0,'correct');assert.equal(r.teams[0].score,points*(star?2:1));
  act(r,'host',{type:'score',player:0,score:100});
  judge(r,0,'wrong');assert.equal(r.teams[0].score,100-points*(star?3:1));assert.equal(r.deadline,6000);
  buzz(r,1);judge(r,1,'correct');assert.equal(r.teams[1].score,points);
  act(r,'host',{type:'score',player:1,score:100});
  judge(r,0,'clear');assert.equal(r.teams[0].score,100-points*(star?2:1));assert.equal(r.teams[1].score,100-points);assert.equal(r.finish.winner,null);
  assert.equal(r.hopeUsed[0],star?1:0);assert.throws(()=>judge(r,1,'correct'));
 }
});
test('Only rivals can buzz within five seconds; first arrival locks all others and only winner is judged',()=>{
 const r=createRoom();select(r);assert.throws(()=>buzz(r,1));act(r,'host',{type:'start'},0);assert.throws(()=>buzz(r,1));act(r,'host',{type:'close'});
 judge(r,0,'no-answer',1000);
 assert.throws(()=>buzz(r,0));assert.throws(()=>act(r,'display',{type:'finishBuzz',questionId:r.questionId},1001));assert.throws(()=>act(r,'p1',{type:'finishBuzz',questionId:r.questionId-1},1001));
 assert.throws(()=>act(r,'p0',{type:'answer',questionId:r.questionId,text:'late'},1001));
 assert.throws(()=>act(r,'host',{type:'revealSolution',show:true}));
 buzz(r,2,5999);assert.throws(()=>buzz(r,1,5999));assert.throws(()=>buzz(r,2,5999));
 assert.equal(r.phase,'closed');assert.equal(r.deadline,null);assert.equal(r.buzzes.length,1);assert.equal(r.finish.winner,2);
 assert.throws(()=>judge(r,1,'correct'));assert.throws(()=>act(r,'host',{type:'revealAnswers',show:true}));
 judge(r,2,'wrong');assert.equal(r.teams[2].score,-10);judge(r,2,'wrong');assert.equal(r.teams[2].score,-10);
 judge(r,2,'correct');assert.equal(r.teams[2].score,20);
 assert.throws(()=>act(r,'host',{type:'judge',questionId:r.questionId,player:2,result:'wrong',version:0}));
 judge(r,2,'clear');assert.equal(r.teams[2].score,0);judge(r,2,'no-answer');assert.equal(r.teams[2].score,-10);
 for(const role of ['host','display','p0','p1','p2'])assert.equal(snapshot(r,role).finish.winner,2);
 act(r,'host',{type:'revealSolution',show:true});act(r,'host',{type:'waiting'});assert.equal(snapshot(r,'host').finish,null);
});
test('Buzz deadline rejects at the boundary, expires and does not automatically mark main answer wrong',()=>{
 const r=createRoom();select(r,0,30);act(r,'host',{type:'start'},0);expire(r,15000);assert.equal(r.finish.stage,'main');assert.equal(r.teams[0].score,0);
 judge(r,0,'wrong',16000);assert.throws(()=>buzz(r,1,21000));assert.equal(expire(r,21000),true);assert.equal(r.finish.stage,'done');assert.equal(r.phase,'closed');assert.throws(()=>buzz(r,2,21001));
 judge(r,0,'clear',22000);judge(r,0,'wrong',22000);buzz(r,1,22001);judge(r,1,'wrong',22002);assert.equal(r.teams[1].score,-15);
});
test('Backup retains scores, migrates old used-star counts and never restores active finish attempts',()=>{
 const r=createRoom();select(r,2,20,true);act(r,'host',{type:'close'});judge(r,2,'correct');
 const backup=snapshot(r,'host'),fresh=createRoom();act(fresh,'host',{type:'restore',backup});
 assert.deepEqual(fresh.hopeUsed,[0,0,1]);assert.equal(snapshot(fresh,'host').finish,null);assert.equal(fresh.hopeStar,null);assert.equal(fresh.teams[2].score,40);assert.throws(()=>select(fresh,2,20,true));
 for(const hopeUsed of [[4,0,0],[-1,0,0],[0,0],{},[0,1.5,0]])assert.throws(()=>act(fresh,'host',{type:'restore',backup:{...backup,hopeUsed}}));
 act(fresh,'host',{type:'restore',backup:{...backup,hopeUsed:[3,2,0]}});assert.deepEqual(fresh.hopeUsed,[1,1,0]);
 const {hopeUsed,...legacy}=backup;act(fresh,'host',{type:'restore',backup:legacy});assert.deepEqual(fresh.hopeUsed,[0,0,0]);
});
