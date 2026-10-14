import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {WebSocket} from 'ws';
import {createGameServer} from './fixtures/full-pack.js';
import {hashPassword} from '../multiplayer/access.js';
const wait=async fn=>{const end=Date.now()+3000;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,10));}throw Error('Timeout');};
async function setup(heartbeatMs=30000){const app=createGameServer({accessHash:hashPassword('test-only-password'),heartbeatMs});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');const base=`http://127.0.0.1:${app.server.address().port}`;const room=await(await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':'test-only-password'}})).json();const clients=[];
 async function join(role,options={}){const ws=new WebSocket(base.replace('http','ws'),options),c={ws,messages:[],state:null};clients.push(c);ws.on('message',raw=>{const m=JSON.parse(raw);c.messages.push(m);if(m.type==='state')c.state=m.state;});await once(ws,'open');ws.send(JSON.stringify({type:'join',room:room.id,token:room.tokens[role],password:'test-only-password'}));await wait(()=>c.state);return c;}
 return {...app,base,room,join,async close(){for(const c of clients)c.ws.terminate();app.wss.close();await new Promise(r=>app.server.close(r));}};
}
test('Current-revision sync is lightweight; stale sync catches up, preserving legacy clients',async()=>{
 const app=await setup();try{const host=await app.join('host');host.messages=[];host.ws.send(JSON.stringify({type:'sync',revision:host.state.revision}));await wait(()=>host.messages.length);assert.equal(host.messages[0].type,'heartbeat');assert.equal(host.messages[0].state,undefined);assert.ok(JSON.stringify(host.messages[0]).length<100);
 host.messages=[];host.ws.send(JSON.stringify({type:'sync',revision:-1}));await wait(()=>host.messages.length);assert.equal(host.messages[0].type,'state');assert.equal(host.state.catalog.length,263);
 host.messages=[];host.ws.send(JSON.stringify({type:'sync'}));await wait(()=>host.messages.length);assert.equal(host.messages[0].type,'state');
 }finally{await app.close();}
});
test('Heartbeat removes half-open clients; healthy clients and room scores survive reconnect',async()=>{
 const app=await setup(100);try{const host=await app.join('host');host.ws.send(JSON.stringify({type:'score',player:0,score:120}));await wait(()=>host.state.teams[0].score===120);
 const dead=await app.join('p0',{autoPong:false});await wait(()=>dead.ws.readyState===WebSocket.CLOSED);assert.equal(host.ws.readyState,WebSocket.OPEN);await wait(()=>!host.state.online.p0);
 const fresh=await app.join('p0');assert.equal(fresh.state.teams[0].score,120);assert.equal(app.rooms.get(app.room.id).connections.size,2);
 }finally{await app.close();}
});
test('Stalled outgoing queue is disconnected without losing room state or other receivers',async()=>{
 const app=await setup();try{const host=await app.join('host'),player=await app.join('p0');const room=app.rooms.get(app.room.id),serverSocket=[...room.connections].find(([,role])=>role==='p0')[0];Object.defineProperty(serverSocket,'bufferedAmount',{value:5*1024*1024,configurable:true});host.ws.send(JSON.stringify({type:'score',player:1,score:80}));await wait(()=>player.ws.readyState===WebSocket.CLOSED);assert.equal(host.ws.readyState,WebSocket.OPEN);await wait(()=>host.state.teams[1].score===80);assert.equal(room.teams[1].score,80);
 }finally{await app.close();}
});

test('MC survives blocked browser storage and watchdog reconnects a silent socket without losing scores',async()=>{
 const {JSDOM}=await import('jsdom'),{readFileSync}=await import('node:fs');const app=await setup(),sockets=[];let dom;
 try{
 const control=await app.join('host');control.ws.send(JSON.stringify({type:'score',player:2,score:90}));await wait(()=>control.state.teams[2].score===90);
 dom=new JSDOM(readFileSync(new URL('../multiplayer/index.html',import.meta.url),'utf8'),{url:app.base+'/#'+new URLSearchParams({room:app.room.id,token:app.room.tokens.host}),runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window,d=w.document;w.Storage.prototype.setItem=()=>{throw Error('Storage unavailable');};w.WebSocket=class extends WebSocket{constructor(...args){super(...args);sockets.push(this);}};
 w.eval(readFileSync(new URL('../multiplayer/sounds.js',import.meta.url),'utf8'));w.eval(readFileSync(new URL('../multiplayer/client.js',import.meta.url),'utf8'));
 await wait(()=>!d.querySelector('#access-gate').hidden);d.querySelector('#access-password').value='test-only-password';d.querySelector('#access-form').dispatchEvent(new w.Event('submit',{cancelable:true}));
 await wait(()=>d.querySelector('#connection').className==='online');assert.equal(d.querySelector('#backup-warning').hidden,false);assert.equal(d.querySelectorAll('#scoreboard strong')[2].textContent,'90');
 const old=sockets[0],now=w.Date.now;old.onmessage=null;w.Date.now=()=>now()+25000;w.checkConnection();w.Date.now=now;
 await wait(()=>sockets.length===2&&d.querySelector('#connection').className==='online');assert.equal(d.querySelector('#access-gate').hidden,true);assert.equal(d.querySelectorAll('#scoreboard strong')[2].textContent,'90');await wait(()=>old.readyState===WebSocket.CLOSED);
 assert.equal(d.querySelector('#backup-warning').hidden,false);
 }finally{for(const s of sockets){s.onclose=null;s.terminate();}dom?.window.close();await app.close();}
});
