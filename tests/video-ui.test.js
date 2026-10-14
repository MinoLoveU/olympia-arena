import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from './fixtures/full-pack.js';import {hashPassword} from '../multiplayer/access.js';
const wait=async fn=>{for(let i=0;i<250;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error('Video UI timeout');};
test('MC synchronizes display and player videos; blocked autoplay uses an icon without notice text',async()=>{
 const {server,wss,rooms}=createGameServer({accessHash:hashPassword('test-only-password')});server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 const room=await(await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':'test-only-password'}})).json(),doms=[],sockets=[];let plays=0,pauses=0,blocked=true;
 try{
 for(const role of ['host','display','p0','p1','p2']){
  const dom=new JSDOM(readFileSync(new URL('../multiplayer/index.html',import.meta.url),'utf8'),{url:base+'/#'+new URLSearchParams({room:room.id,token:room.tokens[role]}),runScripts:'outside-only',pretendToBeVisual:true});doms.push(dom);
  dom.window.HTMLMediaElement.prototype.play=function(){plays++;return blocked?Promise.reject(Error('autoplay')):Promise.resolve();};dom.window.HTMLMediaElement.prototype.pause=function(){pauses++;};
  dom.window.WebSocket=class extends WebSocket{constructor(...args){super(...args);sockets.push(this);}};
  dom.window.eval(readFileSync(new URL('../multiplayer/sounds.js',import.meta.url),'utf8'));dom.window.eval(readFileSync(new URL('../multiplayer/client.js',import.meta.url),'utf8'));
 }
 const [host,display,...players]=doms.map(d=>d.window.document);
 await wait(()=>!host.querySelector('#access-gate').hidden);host.querySelector('#access-password').value='test-only-password';host.querySelector('#access-form').dispatchEvent(new doms[0].window.Event('submit',{cancelable:true}));
 await wait(()=>doms.every(d=>d.window.document.querySelector('#connection').className==='online'));
 host.querySelector('#round').value='Về đích';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#finish-team').value='0';host.querySelector('#finish-team').dispatchEvent(new doms[0].window.Event('change'));
 host.querySelector('#preset-question').value='finish-3';host.querySelector('#publish-question').click();await wait(()=>display.querySelector('video'));
 assert.equal(plays,0);assert.equal(host.querySelector('#play-video').hidden,false);
 assert.equal(host.querySelector('video'),null);for(const d of players)assert.ok(d.querySelector('video'));
 host.querySelector('#play-video').click();await wait(()=>[display,...players].every(d=>!d.querySelector('#video-permission').hidden));for(const d of [display,...players]){assert.equal(d.querySelector('#video-permission').textContent,'▶');assert.equal(d.querySelector('#video-permission').getAttribute('aria-label'),'Phát video');}assert.equal(rooms.get(room.id).deadline,null);
 blocked=false;for(const d of [display,...players])d.querySelector('#video-permission').click();await wait(()=>[display,...players].every(d=>d.querySelector('#video-permission').hidden));assert.equal(plays,8);
 sockets[1].send(JSON.stringify({type:'sync'}));await new Promise(r=>setTimeout(r,80));assert.equal(plays,8);
 host.querySelector('#play-video').click();await wait(()=>plays===12);host.querySelector('#stop-video').click();await wait(()=>pauses===4);assert.equal(display.querySelector('video').currentTime,0);
 host.querySelector('#preset-question').value='finish-2';host.querySelector('#publish-question').click();await wait(()=>!display.querySelector('video'));assert.equal(host.querySelector('#play-video').hidden,true);
 host.querySelector('#round').value='Tăng tốc';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='speed-3';host.querySelector('#publish-question').click();await wait(()=>display.querySelector('video')?.getAttribute('src')==='/assets/speed-source-3.mp4');
 assert.equal(display.querySelector('video').muted,true);assert.equal(display.querySelector('video').hasAttribute('muted'),true);for(const d of players)assert.equal(d.querySelector('video').muted,true);
 host.querySelector('#play-video').click();await wait(()=>plays===16);assert.equal(display.querySelector('video').muted,true);assert.equal(host.querySelector('video'),null);for(const d of players)assert.ok(d.querySelector('video'));
 host.querySelector('#preset-question').value='speed-14';host.querySelector('#publish-question').click();await wait(()=>doms.every(d=>!d.window.document.querySelector('#question-matching').hidden));
 for(const d of [host,display,...players]){
  const columns=[...d.querySelectorAll('#question-matching ol')];assert.equal(columns.length,2);
  assert.deepEqual([...columns[0].children].map(el=>el.textContent[0]),['1','2','3','4']);assert.deepEqual([...columns[1].children].map(el=>el.textContent[0]),['A','B','C','D']);
  assert.match(columns[0].lastChild.textContent,/chống đế quốc xâm lược/);assert.match(columns[1].lastChild.textContent,/Việt - Lào - Campuchia/);assert.equal(d.querySelector('#question-matching').textContent.includes('1-B'),false);
 }
 host.querySelector('#preset-question').value='speed-11';host.querySelector('#publish-question').click();await wait(()=>players[0].querySelector('#question-title').textContent.includes('7 tác phẩm'));assert.equal(display.querySelector('#question-matching').hidden,true);for(const d of players)assert.ok(d.querySelector('#question-media img'));
 const game=rooms.get(room.id);game.judgements[0]={result:'correct',points:40,version:1};game.judgements[1]={result:'wrong',points:0,version:1};game.revision++;for(const socket of sockets)socket.send(JSON.stringify({type:'sync'}));await wait(()=>display.querySelector('.judgement-badge.correct'));assert.equal(display.querySelector('.judgement-badge.correct').textContent,'✓ Đúng. +40 điểm');assert.equal(display.querySelector('.judgement-badge.wrong').textContent,'✕ Sai. 0 điểm');
 host.querySelector('#round').value='Vượt chướng ngại vật';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='obstacle-2';host.querySelector('#publish-question').click();await wait(()=>[display,...players].every(d=>d.querySelector('video')?.getAttribute('src')==='/assets/obstacle-song-1-v2.mp4'));
 for(const d of [display,...players])assert.equal(d.querySelector('video').muted,false);assert.equal(host.querySelector('#play-video').hidden,false);
 host.querySelector('#play-video').click();await wait(()=>plays===20);assert.equal(rooms.get(room.id).deadline,null);host.querySelector('#stop-video').click();await wait(()=>pauses===8);
 }finally{for(const socket of sockets){socket.onclose=null;socket.onmessage=null;socket.terminate();}for(const dom of doms)dom.window.close();for(const socket of wss.clients)socket.terminate();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
