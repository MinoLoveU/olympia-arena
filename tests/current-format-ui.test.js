import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from '../server.js';import {hashPassword} from '../multiplayer/access.js';
const wait=async fn=>{for(let i=0;i<250;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error('Video UI timeout');};
test('Current five-screen UI shows pending slots and still opens unchanged warmup',async()=>{
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
 for(const round of ['Vượt chướng ngại vật','Tăng tốc','Về đích']){
 host.querySelector('#round').value=round;host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));
 if(round==='Về đích'){host.querySelector('#finish-team').value='2';host.querySelector('#finish-team').dispatchEvent(new doms[0].window.Event('change'));assert.match(host.querySelector('#finish-team').textContent,/4\/4 câu/);}
 const options=[...host.querySelector('#preset-question').options];assert.equal(options.length,round==='Tăng tốc'?20:round==='Về đích'?4:10);assert.ok(options.every(o=>o.disabled));assert.equal(host.querySelector('#publish-question').disabled,true);assert.match(host.querySelector('#preset-preview').textContent,/chờ bộ đề mới/);
 }
 assert.equal(host.querySelector('#obstacle-set').options.length,2);
 host.querySelector('#round').value='Khởi động';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='warm-27';host.querySelector('#publish-question').click();await wait(()=>[display,...players].every(d=>d.querySelector('#question-title').textContent.includes('Lang Liêu')));
 }finally{for(const socket of sockets){socket.onclose=null;socket.onmessage=null;socket.terminate();}for(const dom of doms)dom.window.close();for(const socket of wss.clients)socket.terminate();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
