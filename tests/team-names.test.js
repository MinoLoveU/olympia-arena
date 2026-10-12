import test from 'node:test';import assert from 'node:assert/strict';
import {createRoom,act,snapshot} from '../multiplayer/game.js';
import {builtInBank} from '../multiplayer/bank.js';
const names=['Đội Cầu truyền hình','Đội Chủ nghĩa tư bản','Đội Chủ nghĩa xã hội'];
test('Named teams preserve custom backup names and migrate old generic names',()=>{
 const r=createRoom();assert.deepEqual(r.teams.map(t=>t.name),names);
 const backup=snapshot(r,'host');backup.teams=backup.teams.map((t,i)=>({...t,name:i===1?'Tên riêng':`Đội ${i+1}`}));
 act(r,'host',{type:'restore',backup});assert.deepEqual(r.teams.map(t=>t.name),[names[0],'Tên riêng',names[2]]);
});
test('Finish permits any team order and keeps eligibility, stars and progress with the chosen team',()=>{
 const r=createRoom();for(const player of [2,0,1]){
  const q=builtInBank.find(q=>q.round==='Về đích'&&q.players[0]===player);act(r,'host',{type:'preset',id:q.id});act(r,'host',{type:'hopeStar',questionId:r.questionId});act(r,'host',{type:'start'},1000);
  assert.throws(()=>act(r,`p${(player+1)%3}`,{type:'answer',questionId:r.questionId,text:'Sai đội'},1001));act(r,`p${player}`,{type:'answer',questionId:r.questionId,text:'Đáp án'},1001);act(r,'host',{type:'close'});act(r,'host',{type:'judge',questionId:r.questionId,player,result:'correct',version:0});
 }
 assert.deepEqual(r.teams.map(t=>t.score),[40,40,40]);assert.deepEqual(r.hopeUsed,[1,1,1]);assert.equal(r.usedQuestions.length,3);
});
