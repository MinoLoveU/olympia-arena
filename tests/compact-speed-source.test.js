import test from 'node:test';import assert from 'node:assert/strict';import {existsSync,readFileSync} from 'node:fs';import {execFileSync} from 'node:child_process';
import {speedQuestions} from '../multiplayer/compact-speed-bank.js';import {createRoom,act,snapshot} from '../multiplayer/game.js';
test('30 speed questions retain free text, source answers, visual labels and private solutions',()=>{
 assert.equal(speedQuestions.length,30);assert.equal(new Set(speedQuestions.map(q=>q.id)).size,30);
 for(const [i,q] of speedQuestions.entries()){assert.equal(q.label,`Câu ${i+1}/30`);assert.equal(q.type,'text');assert.equal(q.duration,({16:50,3:23,8:30,15:30,17:30,20:30,23:30,13:20,25:29,28:20,30:17})[i+1]||25);assert.ok(q.solution);assert.ok(!q.text.includes('Đáp án:'));if(q.media)assert.ok(existsSync(new URL('..'+q.media,import.meta.url)));const r=createRoom();act(r,'host',{type:'preset',id:q.id});for(const role of ['display','p0','p1','p2']){assert.equal(snapshot(r,role).question.solution,undefined);assert.equal(snapshot(r,role).question.text,q.text);assert.equal(snapshot(r,role).duration,q.duration);}assert.equal(snapshot(r,'host').question.solution,q.solution);act(r,'host',{type:'start'},1000);act(r,'p0',{type:'answer',questionId:r.questionId,text:'test'},1000+q.duration*1000-1);assert.throws(()=>act(r,'p1',{type:'answer',questionId:r.questionId,text:'late'},1000+q.duration*1000));}
 assert.match(speedQuestions[10].text,/7 tác phẩm/);assert.deepEqual(speedQuestions[13].matchingColumns.map(c=>c.length),[4,4]);assert.match(speedQuestions[26].text,/D\. Mặt trận đoàn kết dân tộc/);assert.equal(speedQuestions[26].solution,'DBCA');assert.equal(speedQuestions[27].solution,'Hội Phản đế đồng minh');assert.equal(speedQuestions[3].media,'/assets/speed-compact-4-1.png');assert.equal(speedQuestions[3].mediaType,'image');for(const n of [6,28]){assert.equal(speedQuestions[n-1].media,`/assets/speed-compact-${n}-v2.mp4`);assert.equal(speedQuestions[n-1].mediaType,'video');assert.equal(speedQuestions[n-1].duration,n===28?20:25);}
 for(const [n,count] of [[7,6],[11,7]])assert.equal((readFileSync(new URL('..'+speedQuestions[n-1].media,import.meta.url),'utf8').match(/<image /g)||[]).length,count);
});
test('All eleven current speed videos have video only, without audio tracks',()=>{
 const videos=speedQuestions.filter(q=>q.mediaType==='video');assert.equal(videos.length,11);
 for(const q of videos){const streams=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_type','-of','json',new URL('..'+q.media,import.meta.url).pathname],{encoding:'utf8'})).streams;assert.deepEqual(streams.map(s=>s.codec_type),['video']);}
});

test('Speed video starts the authoritative clock once; replay and stop preserve answers and timing',()=>{
 const r=createRoom();act(r,'host',{type:'preset',id:'compact-speed-28'});
 const play={type:'video',questionId:r.questionId,action:'play'};
 assert.throws(()=>act(r,'p0',play,1000));
 assert.throws(()=>act(r,'host',{...play,questionId:r.questionId+1},1000));
 act(r,'host',play,1000);assert.equal(r.phase,'open');assert.equal(r.startedAt,r.videoPlayback.at);assert.equal(r.deadline,21000);
 act(r,'p0',{type:'answer',questionId:r.questionId,text:'test'},2345);
 act(r,'host',play,3000);assert.equal(r.startedAt,1000);assert.equal(r.deadline,21000);assert.equal(r.answers[0].elapsedMs,1345);
 act(r,'host',{...play,action:'stop'},4000);assert.equal(r.phase,'open');assert.equal(r.deadline,21000);
 assert.throws(()=>act(r,'p1',{type:'answer',questionId:r.questionId,text:'late'},21000));
 act(r,'host',{type:'close'},22000);act(r,'host',play,23000);assert.equal(r.phase,'closed');assert.equal(r.deadline,null);
});
