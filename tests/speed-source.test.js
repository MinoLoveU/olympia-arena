import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import {JSDOM} from 'jsdom';
import {builtInBank} from '../multiplayer/bank.js';import {createRoom,act,snapshot} from '../multiplayer/game.js';
const qs=builtInBank.filter(q=>q.round==='Tăng tốc');
test('Speed source preserves 60 numbered free-text questions, images, repeated questions and private red answers',()=>{
 assert.equal(qs.length,60);assert.deepEqual(qs.map(q=>q.id),Array.from({length:60},(_,i)=>`speed-${i+1}`));
 assert.ok(qs.every(q=>[20,25,30].includes(q.duration)&&q.type==='text'&&q.choices.length===0&&!q.text.includes('Đáp án:')));
 assert.equal(qs.filter(q=>q.mediaType==='video').length,27);assert.equal(qs.filter(q=>q.mediaType==='image').length,6);
 assert.equal(qs[0].solution,'Đảng Lao động Việt Nam');assert.equal(qs[23].solution,'5/1941.');assert.equal(qs[47].solution,'Hữu nghị');assert.equal(qs[59].solution,'Hội liên hiệp thuộc địa.');
 assert.equal(qs[4].text,qs[34].text);assert.equal(qs[4].solution,qs[34].solution);
 assert.match(qs[19].text,/A\. Mặt trận Việt Minh[\s\S]*H\. Mặt trận Phản đế Đông Dương/);assert.match(qs[49].text,/A\. Mặt trận nhân dân thế giới[\s\S]*D\. Mặt trận đoàn kết dân tộc/);
 for(const q of qs){const r=createRoom();act(r,'host',{type:'preset',id:q.id});assert.equal(snapshot(r,'host').question.solution,q.solution);for(const role of ['display','p0','p1','p2']){const s=snapshot(r,role);assert.equal(s.question.solution,undefined);assert.equal(s.question.text,q.text);assert.equal(s.question.media,q.media||'');}act(r,'host',{type:'revealSolution',show:true});assert.equal(snapshot(r,'display').question.solution,q.solution);}
});
function boxes(buffer,start=0,end=buffer.length){const out=[];for(let p=start;p+8<=end;){let size=buffer.readUInt32BE(p),header=8;if(size===1){size=Number(buffer.readBigUInt64BE(p+8));header=16;}if(size===0)size=end-p;assert.ok(size>=header&&p+size<=end);out.push({type:buffer.toString('ascii',p+4,p+8),start:p+header,end:p+size});p+=size;}return out;}
test('All 27 bundled speed videos contain a video track and no audio track',()=>{
 for(const q of qs.filter(q=>q.mediaType==='video')){
  const b=readFileSync(new URL('..'+q.media,import.meta.url)),moov=boxes(b).find(x=>x.type==='moov');assert.ok(moov,q.id);
  const handlers=boxes(b,moov.start,moov.end).filter(x=>x.type==='trak').map(trak=>{const mdia=boxes(b,trak.start,trak.end).find(x=>x.type==='mdia');const h=boxes(b,mdia.start,mdia.end).find(x=>x.type==='hdlr');return b.toString('ascii',h.start+8,h.start+12);});
  assert.deepEqual(handlers,['vide'],q.id);
 }
});
test('Image choices preserve all labelled flags and book covers; diagram wrapper retains original image',()=>{
 for(const [number,count] of [[7,6],[11,7]]){const q=qs[number-1],d=new JSDOM(readFileSync(new URL('..'+q.media,import.meta.url),'utf8'),{contentType:'image/svg+xml'});assert.equal(d.window.document.querySelectorAll('image').length,count);assert.deepEqual([...d.window.document.querySelectorAll('text')].map(x=>x.textContent),Array.from({length:count},(_,i)=>String.fromCharCode(65+i)));d.window.close();}
 const d=new JSDOM(readFileSync(new URL('..'+qs[21].media,import.meta.url),'utf8'),{contentType:'image/svg+xml'});assert.equal(d.window.document.documentElement.getAttribute('viewBox'),'0 590 2048 400');assert.equal(d.window.document.querySelectorAll('image').length,1);d.window.close();
});


test('Nine replacement videos keep their question numbers; question 42 has no video or playback command',()=>{
 for(const n of [37,38,47,48,51,53,55,58,60])assert.equal(qs[n-1].media,`/assets/speed-source-${n}-v2.mp4`);
 const q=qs[41];assert.equal(q.media,undefined);assert.equal(q.mediaType,undefined);assert.equal(q.solution,'Cách mạng tháng 10 Nga năm 1917.');
 const r=createRoom();act(r,'host',{type:'preset',id:q.id});for(const role of ['host','display','p0','p1','p2'])assert.equal(snapshot(r,role).question.media,'');assert.throws(()=>act(r,'host',{type:'video',questionId:r.questionId,action:'play'}));
});
