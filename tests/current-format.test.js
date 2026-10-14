import test from 'node:test';
import assert from 'node:assert/strict';
import {builtInBank,obstacleSets,bankInfo} from '../multiplayer/bank.js';
import {warmupQuestions} from '../multiplayer/warmup-bank.js';
import {createRoom,act,snapshot} from '../multiplayer/game.js';
test('Current pack preserves warmup and reserves exactly the requested empty slots',()=>{
 assert.deepEqual(builtInBank.filter(q=>q.round==='Khởi động'),warmupQuestions);
 assert.equal(builtInBank.length,115);assert.equal(obstacleSets.length,2);
 assert.equal(builtInBank.filter(q=>q.pending).length,32);
 assert.equal(builtInBank.filter(q=>q.round==='Tăng tốc').length,20);
 for(let p=0;p<3;p++){const qs=builtInBank.filter(q=>q.round==='Về đích'&&q.players[0]===p);assert.deepEqual(qs.map(q=>q.points),[20,20,30,30]);assert.ok(qs.every(q=>q.duration===15));}
 const r=createRoom();for(const q of builtInBank.filter(q=>q.pending)){assert.equal(q.text,'');assert.equal(q.solution,'');assert.equal(q.media,undefined);assert.throws(()=>act(r,'host',{type:'preset',id:q.id}));}
 assert.equal(r.question,null);assert.deepEqual(r.usedQuestions,[]);
 for(const role of ['display','p0','p1','p2'])assert.equal(snapshot(r,role).catalog,undefined);
});
test('30-point hope star awards and corrects 60 points without duplicating awards',()=>{
 const bank=builtInBank.map(q=>q.id==='compact-finish-1-3'?{...q,pending:false,text:'Test',solution:'4'}:q);
 const r=createRoom({questionBank:{builtInBank:bank,obstacleSets,bankInfo}});
 act(r,'host',{type:'preset',id:'compact-finish-1-3'});act(r,'host',{type:'hopeStar',questionId:r.questionId});act(r,'host',{type:'close'});
 const judge=result=>act(r,'host',{type:'judge',questionId:r.questionId,player:0,result,version:r.judgements[0]?.version||0});
 judge('correct');assert.equal(r.teams[0].score,60);judge('correct');assert.equal(r.teams[0].score,60);judge('wrong');assert.equal(r.teams[0].score,-60);judge('clear');assert.equal(r.teams[0].score,0);assert.equal(r.hopeUsed[0],1);
});
test('Old backups retain scores and warmup progress without restoring obsolete rounds',()=>{
 const r=createRoom(),b={...snapshot(r,'host'),questionBankVersion:undefined,obstacleSet:'8',opened:[1],usedClues:[1],usedQuestions:['warm-1','speed-1','finish-1','obstacle-8-1']};b.teams[0].score=80;
 act(r,'host',{type:'restore',backup:b});assert.equal(r.teams[0].score,80);assert.deepEqual(r.usedQuestions,['warm-1']);assert.equal(r.obstacleSet,'1');assert.deepEqual(r.opened,[]);assert.equal(r.image,obstacleSets[0].image);
});

test('Two source obstacle sets open all 18 clues with private answers and independent masks',()=>{
 assert.deepEqual(obstacleSets.map(s=>s.name),['Cách mạng tháng 10','Bản án chế độ thực dân Pháp']);
 const r=createRoom();for(const set of obstacleSets){act(r,'host',{type:'obstacleSet',id:set.id});assert.equal(r.question,null);assert.throws(()=>act(r,'host',{type:'preset',id:`compact-obstacle-${set.id}-center`}));
 for(const q of builtInBank.filter(q=>q.obstacleSet===set.id)){act(r,'host',{type:'preset',id:q.id});assert.equal(snapshot(r,'host').question.solution,q.solution);for(const role of ['display','p0','p1','p2'])assert.equal(snapshot(r,role).question.solution,undefined);if(q.clue!==undefined)act(r,'host',{type:'tile',open:true});}
 assert.equal(r.opened.length,9);}
 const b=snapshot(r,'host');b.image='/assets/obstacle-awaiting.svg';act(r,'host',{type:'restore',backup:b});assert.equal(r.image,obstacleSets[1].image);
});
