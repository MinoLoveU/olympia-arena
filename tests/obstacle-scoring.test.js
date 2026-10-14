import test from 'node:test';import assert from 'node:assert/strict';
import {createRoom,act,snapshot,expire} from '../multiplayer/game.js';
import {obstacleGame,obstaclePoints} from '../multiplayer/obstacle-game.js';
const select=(r,n,set='1')=>act(r,'host',{type:'preset',id:`compact-obstacle-${set}-${n===9?'center':n}`},1000);
const command=(r,role,type,extra={},now=2000)=>act(r,role,{type,obstacleSet:r.obstacleSet,questionId:r.questionId,version:obstacleGame(r).version,...extra},now);
const buzz=(r,p,now=2000)=>command(r,`p${p}`,'obstacleBuzz',{},now);
const judge=(r,result,now=2100)=>command(r,'host','obstacleJudge',{attemptId:(obstacleGame(r).pending||obstacleGame(r).last).id,result},now);
const clueJudge=(r,p,result)=>act(r,'host',{type:'judge',questionId:r.questionId,player:p,result,version:r.judgements[p]?.version||0});
test('Obstacle reward uses selected clue count including center; clues score +10 with safe corrections',()=>{
 const r=createRoom();for(let n=1;n<=9;n++){select(r,n);assert.equal(obstaclePoints(r),[60,55,50,45,40,35,30,20,10][n-1]);act(r,'host',{type:'close'});clueJudge(r,0,'correct');clueJudge(r,0,'correct');assert.equal(r.teams[0].score,n*10);if(n===9){assert.ok(r.opened.includes(8));clueJudge(r,0,'wrong');assert.ok(!r.opened.includes(8));assert.equal(r.teams[0].score,80);}}
});
test('Separate buzzer arbitrates first arrival, pauses clue, rejects races/stale/foreign roles, and eliminates only this set',()=>{
 const r=createRoom();act(r,'host',{type:'round',round:'Vượt chướng ngại vật'});assert.throws(()=>buzz(r,0));select(r,1);act(r,'host',{type:'start'},1000);
 const version=obstacleGame(r).version;buzz(r,1,4000);assert.equal(obstacleGame(r).pending.player,1);assert.equal(r.phase,'closed');assert.equal(obstacleGame(r).paused.remaining,12000);assert.equal(expire(r,90000),false);
 assert.throws(()=>act(r,'p0',{type:'obstacleBuzz',obstacleSet:'1',questionId:r.questionId,version},4000));assert.throws(()=>buzz(r,0));assert.throws(()=>command(r,'display','obstacleJudge'));assert.throws(()=>act(r,'host',{type:'waiting'}));
 judge(r,'wrong');assert.deepEqual(obstacleGame(r).eliminated,[1]);assert.equal(r.teams[1].score,0);assert.throws(()=>buzz(r,1));command(r,'host','obstacleResume',{},8000);assert.equal(r.deadline,20000);
 assert.throws(()=>act(r,'p1',{type:'answer',questionId:r.questionId,text:'No'},9000));act(r,'p0',{type:'answer',questionId:r.questionId,text:'Yes'},9000);act(r,'host',{type:'close'});assert.throws(()=>clueJudge(r,1,'correct'));clueJudge(r,0,'correct');
 act(r,'host',{type:'obstacleSet',id:'2'});select(r,1,'2');buzz(r,1);judge(r,'wrong');act(r,'host',{type:'close'});act(r,'host',{type:'obstacleSet',id:'1'});assert.deepEqual(obstacleGame(r).eliminated,[1]);
 const fresh=createRoom();act(fresh,'host',{type:'restore',backup:snapshot(r,'host')});assert.deepEqual(obstacleGame(fresh).eliminated,[1]);assert.equal(fresh.teams[0].score,10);assert.equal(obstacleGame(fresh).pending,null);
});
test('Guess judgement awards once, supports correcting elimination and score, and ends only the solved set',()=>{
 const r=createRoom();select(r,1);buzz(r,0);judge(r,'wrong');judge(r,'clear');assert.deepEqual(obstacleGame(r).eliminated,[]);judge(r,'correct');assert.equal(r.teams[0].score,60);judge(r,'correct');assert.equal(r.teams[0].score,60);assert.throws(()=>buzz(r,1));
 act(r,'host',{type:'score',player:0,score:100});judge(r,'wrong');assert.equal(r.teams[0].score,40);assert.deepEqual(obstacleGame(r).eliminated,[0]);buzz(r,1);assert.equal(obstacleGame(r).pending.points,60);judge(r,'correct');
 act(r,'host',{type:'obstacleSet',id:'2'});assert.equal(obstacleGame(r).solved,false);select(r,1,'2');assert.equal(snapshot(r,'p0').obstacle.solution,undefined);
});
test('Final 15 seconds pauses for an oral guess, resumes remaining time, then locks at deadline',()=>{
 const r=createRoom();for(let n=1;n<=9;n++)select(r,n);act(r,'host',{type:'close'});command(r,'host','obstacleFinal',{},10000);assert.equal(obstacleGame(r).finalDeadline,25000);
 buzz(r,2,15000);assert.equal(obstacleGame(r).pending.points,10);assert.equal(obstacleGame(r).paused.finalRemaining,10000);judge(r,'wrong');command(r,'host','obstacleResume',{},30000);assert.equal(obstacleGame(r).finalDeadline,40000);assert.equal(expire(r,39999),false);assert.throws(()=>buzz(r,0,40000));assert.equal(expire(r,40000),true);assert.throws(()=>buzz(r,0,40001));
});
