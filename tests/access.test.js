import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {readFileSync} from 'node:fs';
import {WebSocket} from 'ws';
import {JSDOM} from 'jsdom';
import {createGameServer} from '../server.js';
import {hashPassword} from '../multiplayer/access.js';
const password='test-only-password';
const wait=async(fn)=>{for(let i=0;i<150;i++){if(fn())return;await new Promise(r=>setTimeout(r,20));}throw Error('Timeout');};
test('Password gates room creation and MC sockets before links/state; display and players retain access',async()=>{
 const {server,wss}=createGameServer({accessHash:hashPassword(password)});
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`,clients=[];
 try{
  assert.equal((await fetch(base+'/api/rooms',{method:'POST'})).status,401);
  assert.equal((await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':'wrong'}})).status,401);
  const response=await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':password}});
  assert.equal(response.status,201);const room=await response.json();
  for(const role of ['host','display','p0']){
   const ws=new WebSocket(base.replace('http','ws')),messages=[];clients.push(ws);
   ws.on('message',raw=>messages.push(JSON.parse(raw)));await once(ws,'open');
   const join={type:'join',room:room.id,token:room.tokens[role]};ws.send(JSON.stringify(join));
   if(role!=='host'){await wait(()=>messages.some(m=>m.type==='state'));continue;}
   await wait(()=>messages.length);assert.deepEqual(messages.map(m=>m.type),['password-required']);messages.length=0;
   ws.send(JSON.stringify({...join,password:'wrong'}));await wait(()=>messages.length);
   assert.deepEqual(messages.map(m=>m.type),['password-required']);messages.length=0;
   ws.send(JSON.stringify({...join,password}));await wait(()=>messages.some(m=>m.type==='state'));
   assert.equal(messages.find(m=>m.type==='state').state.role,role);
  }
  // A fresh privileged socket with the same link still needs a password.
  const ws=new WebSocket(base.replace('http','ws'));clients.push(ws);await once(ws,'open');
  const message=once(ws,'message');ws.send(JSON.stringify({type:'join',room:room.id,token:room.tokens.host}));
  assert.equal(JSON.parse((await message)[0]).type,'password-required');
  for(let i=0;i<10;i++){
   const next=once(ws,'message');ws.send(JSON.stringify({type:'join',room:room.id,token:room.tokens.host,password:'wrong'}));await next;
  }
  const blocked=once(ws,'message');ws.send(JSON.stringify({type:'join',room:room.id,token:room.tokens.host,password}));
  assert.match(JSON.parse((await blocked)[0]).message,/một phút/);
  assert.equal((await fetch(base+'/multiplayer/access.js')).status,404);
 }finally{clients.forEach(ws=>ws.terminate());wss.close();await new Promise(r=>server.close(r));}
});
test('Reloaded MC page locks even with existing browser storage; wrong password can be retried',async()=>{
 const {server,wss}=createGameServer({accessHash:hashPassword(password)});server.listen(0,'127.0.0.1');await once(server,'listening');
 const base=`http://127.0.0.1:${server.address().port}`,doms=[],sockets=[];
 try{
  let url=base+'/';
  for(let page=0;page<2;page++){
   const dom=new JSDOM(readFileSync(new URL('../multiplayer/index.html',import.meta.url),'utf8'),{url,runScripts:'outside-only',pretendToBeVisual:true});doms.push(dom);
   const win=dom.window,d=win.document;
   win.fetch=(path,options)=>fetch(new URL(path,base),options);
   if(page)for(const storage of ['localStorage','sessionStorage'])for(const key of Object.keys(doms[0].window[storage]))win[storage].setItem(key,doms[0].window[storage].getItem(key));
   win.WebSocket=class extends WebSocket{constructor(...args){super(...args);sockets.push(this);}};
   win.eval(readFileSync(new URL('../multiplayer/client.js',import.meta.url),'utf8'));
   if(!page)d.querySelector('#create').click();
   await wait(()=>!d.querySelector('#access-gate').hidden);
   assert.equal(d.querySelector('#game').hidden,true);assert.equal(d.querySelector('#local-backups').hidden,true);
   assert.equal(d.querySelector('#scoreboard').children.length,0);
   const submit=value=>{d.querySelector('#access-password').value=value;d.querySelector('#access-form').dispatchEvent(new win.Event('submit',{cancelable:true}));};
   submit('wrong');await wait(()=>d.querySelector('#access-message').textContent.includes('chưa đúng'));
   assert.equal(d.querySelector('#game').hidden,true);submit(password);
   await wait(()=>d.querySelector('#connection').className==='online');
   url=win.location.href;
   assert.equal(d.querySelector('#access-gate').hidden,true);assert.equal(d.querySelector('#access-password').value,'');
   for(const storage of ['localStorage','sessionStorage'])for(const key of Object.keys(win[storage]))assert.ok(!win[storage].getItem(key).includes(password));
  }
 }finally{sockets.forEach(s=>{s.onclose=null;s.onmessage=null;s.terminate();});doms.forEach(d=>d.window.close());wss.close();await new Promise(r=>server.close(r));}
});
