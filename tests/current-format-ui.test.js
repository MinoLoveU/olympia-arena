import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from '../server.js';import {hashPassword} from '../multiplayer/access.js';
const wait=async fn=>{for(let i=0;i<250;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error('Video UI timeout');};
test('Current five-screen UI opens the new finish source and unchanged warmup',async()=>{
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
 for(const round of ['Về đích']){
 host.querySelector('#round').value=round;host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));
 if(round==='Về đích'){host.querySelector('#finish-team').value='2';host.querySelector('#finish-team').dispatchEvent(new doms[0].window.Event('change'));assert.match(host.querySelector('#finish-team').textContent,/4\/4 câu/);}
 const options=[...host.querySelector('#preset-question').options];assert.equal(options.length,round==='Tăng tốc'?20:round==='Về đích'?4:10);assert.ok(options.every(o=>!o.disabled));assert.equal(host.querySelector('#publish-question').disabled,false);
 host.querySelector('#publish-question').click();await wait(()=>players.every(d=>d.querySelector('video')));assert.match(host.querySelector('#host-solution').textContent,/Ngoại giao vắc-xin/);
 for(const d of players){assert.equal(d.querySelector('#answer-text'),null);assert.equal(d.querySelector('#send-answer'),null);assert.ok(d.querySelector('#finish-buzz'));}
 blocked=false;host.querySelector('#play-video').click();await wait(()=>plays===4);assert.equal(rooms.get(room.id).phase,'ready');
 for(const d of [display,...players]){assert.equal(d.querySelector('video').muted,d!==display);assert.equal(d.querySelector('video').getAttribute('src').split('?')[0],'/assets/finish-compact-3-1.mp4');}
 host.querySelector('#stop-video').click();await wait(()=>pauses===4);
 }
 assert.equal(host.querySelector('#obstacle-set').options.length,2);
 host.querySelector('#round').value='Vượt chướng ngại vật';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));
 host.querySelector('#preset-question').value='compact-obstacle-1-1';host.querySelector('#publish-question').click();await wait(()=>players.every(d=>d.querySelector('.tiles img')));
 host.querySelector('#open-tile').click();await wait(()=>players.every(d=>d.querySelector('.cover-0').hidden));
 for(const dom of doms.slice(1)){
  const d=dom.window.document,style=d.createElement('style');style.textContent=readFileSync(new URL('../multiplayer/style.css',import.meta.url),'utf8');d.head.append(style);
  const img=d.querySelector('.tiles img');assert.equal(img.draggable,false);assert.equal(dom.window.getComputedStyle(img).objectFit,'cover');assert.equal(dom.window.getComputedStyle(img).pointerEvents,'none');
  const drag=new dom.window.Event('dragstart',{bubbles:true,cancelable:true});img.dispatchEvent(drag);assert.equal(drag.defaultPrevented,true);
  assert.equal(d.querySelectorAll('.picture-cover:not([hidden])').length,8);
 }

 host.querySelector('#start').click();await wait(()=>players.every(d=>!d.querySelector('#obstacle-buzz').disabled));
 players[1].querySelector('#obstacle-buzz').click();await wait(()=>host.querySelector('#obstacle-status').textContent.includes('giành quyền'));
 for(const d of [display,...players]){assert.match(d.querySelector('#obstacle-status').textContent,/60 điểm/);assert.equal(d.querySelectorAll('.score-card')[1].classList.contains('buzz-winner'),true);assert.equal(d.querySelector('#clock-text').textContent,'ĐOÁN CNV');}
 assert.equal(players[0].querySelector('#answer-text').disabled,true);
 host.querySelector('[data-obstacle-judge="wrong"]').click();await wait(()=>players[1].querySelector('#obstacle-buzz').textContent.includes('bị loại'));assert.equal(players[1].querySelector('#obstacle-buzz').disabled,true);
 host.querySelector('#obstacle-resume').click();await wait(()=>!players[0].querySelector('#answer-text').disabled);assert.equal(players[1].querySelector('#answer-text').disabled,true);
 players[0].querySelector('#answer-text').value='Bolshevik';players[0].querySelector('#answer-text').dispatchEvent(new doms[2].window.KeyboardEvent('keydown',{key:'Enter',cancelable:true}));await wait(()=>!players[0].querySelector('#answer-text'));
 host.querySelector('#stop').click();await wait(()=>!host.querySelector('[data-judge="correct"][data-player="0"]').disabled);host.querySelector('[data-judge="correct"][data-player="0"]').click();await wait(()=>display.querySelector('#scoreboard strong').textContent==='10');
 players[2].querySelector('#obstacle-buzz').click();await wait(()=>host.querySelector('#obstacle-status').textContent.includes('giành quyền'));host.querySelector('[data-obstacle-judge="correct"]').click();await wait(()=>display.querySelectorAll('#scoreboard strong')[2].textContent==='60');assert.ok(players.every(d=>d.querySelector('#obstacle-buzz').disabled));
 host.querySelector('#obstacle-set').value='2';host.querySelector('#select-obstacle-set').click();await wait(()=>display.querySelector('#round-name').textContent.includes('Bộ 2'));host.querySelector('#preset-question').value='compact-obstacle-2-1';host.querySelector('#publish-question').click();await wait(()=>!players[1].querySelector('#obstacle-buzz').disabled);
 host.querySelector('#round').value='Khởi động';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='warm-27';host.querySelector('#publish-question').click();await wait(()=>[display,...players].every(d=>d.querySelector('#question-title').textContent.includes('Lang Liêu')));
 }finally{for(const socket of sockets){socket.onclose=null;socket.onmessage=null;socket.terminate();}for(const dom of doms)dom.window.close();for(const socket of wss.clients)socket.terminate();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
