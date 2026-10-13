import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from '../server.js';import {hashPassword} from '../multiplayer/access.js';
const wait=async fn=>{for(let i=0;i<250;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error('Video UI timeout');};
test('MC starts/replays/stops display video; blocked autoplay offers explicit play and other devices stay silent',async()=>{
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
 for(const d of [host,...players])assert.equal(d.querySelector('video'),null);
 host.querySelector('#play-video').click();await wait(()=>!display.querySelector('#video-permission').hidden);assert.equal(rooms.get(room.id).deadline,null);
 blocked=false;display.querySelector('#video-permission').click();await wait(()=>display.querySelector('#video-permission').hidden);assert.equal(plays,2);
 sockets[1].send(JSON.stringify({type:'sync'}));await new Promise(r=>setTimeout(r,80));assert.equal(plays,2);
 host.querySelector('#play-video').click();await wait(()=>plays===3);host.querySelector('#stop-video').click();await wait(()=>pauses===1);assert.equal(display.querySelector('video').currentTime,0);
 host.querySelector('#preset-question').value='finish-2';host.querySelector('#publish-question').click();await wait(()=>!display.querySelector('video'));assert.equal(host.querySelector('#play-video').hidden,true);
 host.querySelector('#round').value='Tăng tốc';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='speed-3';host.querySelector('#publish-question').click();await wait(()=>display.querySelector('video')?.getAttribute('src')==='/assets/speed-source-3.mp4');
 assert.equal(display.querySelector('video').muted,true);assert.equal(display.querySelector('video').hasAttribute('muted'),true);assert.match(display.querySelector('#video-permission').textContent,/không tiếng/);
 host.querySelector('#play-video').click();await wait(()=>plays===4);assert.equal(display.querySelector('video').muted,true);for(const d of [host,...players])assert.equal(d.querySelector('video'),null);
 }finally{for(const socket of sockets){socket.onclose=null;socket.onmessage=null;socket.terminate();}for(const dom of doms)dom.window.close();for(const socket of wss.clients)socket.terminate();server.closeAllConnections();await new Promise(r=>server.close(r));}
});
