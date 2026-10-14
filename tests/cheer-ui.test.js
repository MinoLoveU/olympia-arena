import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from '../server.js';import {hashPassword} from '../multiplayer/access.js';
const wait=async fn=>{for(let i=0;i<250;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error('Video UI timeout');};
import {builtInBank,bankInfo,obstacleSets} from '../multiplayer/bank.js';
test('Cheer menus and projection-only playback across five clients',async()=>{
 const {server,wss,rooms}=createGameServer({accessHash:hashPassword('test-only-password'),questionBank:{bankInfo,obstacleSets,builtInBank:builtInBank.map(q=>q.id==='cheer-1-1'?{...q,media:'/assets/finish-compact-1-3.mp4'}:q)}});server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;
 const room=await(await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':'test-only-password'}})).json(),doms=[],sockets=[];let plays=0,pauses=0,blocked=true;
 try{
 for(const role of ['host','display','p0','p1','p2']){
  const dom=new JSDOM(readFileSync(new URL('../multiplayer/index.html',import.meta.url),'utf8'),{url:base+'/#'+new URLSearchParams({room:room.id,token:room.tokens[role]}),runScripts:'outside-only',pretendToBeVisual:true});doms.push(dom);const style=dom.window.document.createElement('style');style.textContent=readFileSync(new URL('../multiplayer/style.css',import.meta.url),'utf8');dom.window.document.head.append(style);
  dom.window.HTMLMediaElement.prototype.play=function(){plays++;return blocked?Promise.reject(Error('autoplay')):Promise.resolve();};dom.window.HTMLMediaElement.prototype.pause=function(){pauses++;};
  dom.window.WebSocket=class extends WebSocket{constructor(...args){super(...args);sockets.push(this);}};
  dom.window.eval(readFileSync(new URL('../multiplayer/sounds.js',import.meta.url),'utf8'));dom.window.eval(readFileSync(new URL('../multiplayer/client.js',import.meta.url),'utf8'));
 }
 const [host,display,...players]=doms.map(d=>d.window.document);

 await wait(()=>!host.querySelector('#access-gate').hidden);host.querySelector('#access-password').value='test-only-password';host.querySelector('#access-form').dispatchEvent(new doms[0].window.Event('submit',{cancelable:true}));
 await wait(()=>doms.every(d=>d.window.document.querySelector('#connection').className==='online'));
 assert.deepEqual([...host.querySelector('#round').options].map(o=>o.textContent),['Cổ vũ · trước Khởi động','Khởi động','Vượt chướng ngại vật','Tăng tốc','Cổ vũ · trước Về đích','Về đích']);
 host.querySelector('#round').value='Cổ vũ · trước Khởi động';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));
 assert.equal(host.querySelectorAll('[data-cheer]').length,3);
 host.querySelector('[data-cheer="cheer-1-2"]').click();await wait(()=>display.querySelector('#question-title').textContent.includes('Chủ nghĩa tư bản'));
 assert.equal(display.querySelector('#phase-label').textContent,'CHỜ VIDEO CỔ VŨ');assert.equal(host.querySelector('#play-video').hidden,true);
 host.querySelector('[data-cheer="cheer-1-1"]').click();await wait(()=>display.querySelector('video'));
 blocked=false;host.querySelector('#play-video').click();await wait(()=>plays===1);
 for(const d of [host,...players])assert.equal(d.querySelector('video'),null);
 for(const d of players){assert.equal(d.querySelector('#question-title').textContent,'Chờ phần thi tiếp theo');assert.equal(doms[2].window.getComputedStyle(d.querySelector('#player-panel')).display,'none');}
 assert.equal(doms[1].window.getComputedStyle(display.querySelector('#scoreboard')).display,'none');
 assert.equal(doms[1].window.getComputedStyle(display.querySelector('#results')).display,'none');
 assert.equal(rooms.get(room.id).deadline,null);
 host.querySelector('#stop-video').click();await wait(()=>pauses===1);
 host.querySelector('#round').value='Cổ vũ · trước Về đích';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));
 assert.equal(host.querySelectorAll('[data-cheer]').length,3);host.querySelector('[data-cheer="cheer-2-3"]').click();await wait(()=>display.querySelector('#question-title').textContent.includes('Chủ nghĩa xã hội'));
 assert.equal(display.querySelector('video'),null);
 host.querySelector('#round').value='Khởi động';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='warm-1';host.querySelector('#publish-question').click();await wait(()=>!display.body.classList.contains('cheer-mode'));
 assert.notEqual(doms[1].window.getComputedStyle(display.querySelector('#scoreboard')).display,'none');
 }finally{for(const socket of sockets){socket.onclose=null;socket.onmessage=null;socket.terminate();}for(const dom of doms)dom.window.close();for(const socket of wss.clients)socket.terminate();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
