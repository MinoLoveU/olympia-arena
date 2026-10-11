// Compressed traffic-volume check, NOT a three-hour wall-clock soak test.
import {createGameServer} from '../server.js';
import {hashPassword} from '../multiplayer/access.js';
import {WebSocket} from 'ws';
import {once} from 'node:events';
import assert from 'node:assert/strict';
const app=createGameServer({accessHash:hashPassword('stability-test-only')});app.server.listen(0,'127.0.0.1');await once(app.server,'listening');
const base=`http://127.0.0.1:${app.server.address().port}`,clients=[];
const wait=async fn=>{const end=Date.now()+5000;while(!fn()){if(Date.now()>end)throw Error('Sync timeout');await new Promise(r=>setTimeout(r,5));}};
try{
const room=await(await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':'stability-test-only'}})).json();
for(const role of ['host','display','p0','p1','p2']){const ws=new WebSocket(base.replace('http','ws')),c={ws,state:null,count:0,bytes:0};clients.push(c);ws.on('message',raw=>{const m=JSON.parse(raw);assert.notEqual(m.type,'error');c.bytes+=raw.length;if(m.type==='state')c.state=m.state;if(m.type==='heartbeat')c.count++;});await once(ws,'open');ws.send(JSON.stringify({type:'join',room:room.id,token:room.tokens[role],password:'stability-test-only'}));await wait(()=>c.state);}
await wait(()=>clients.every(c=>Object.values(c.state.online).every(Boolean)));global.gc?.();const startHeap=process.memoryUsage().heapUsed,start=Date.now();
for(let batch=0;batch<108;batch++){
 for(let i=0;i<20;i++)for(const c of clients)c.ws.send(JSON.stringify({type:'sync',revision:c.state.revision}));
 await wait(()=>clients.every(c=>c.count===(batch+1)*20));
 if((batch+1)%27===0)console.log(`Completed ${(batch+1)*100}/10800 sync replies; five connections healthy.`);
 await new Promise(r=>setTimeout(r,1100));
}
const host=clients[0];host.ws.send(JSON.stringify({type:'score',player:0,score:123}));await wait(()=>clients.every(c=>c.state.teams[0].score===123));
global.gc?.();const growth=(process.memoryUsage().heapUsed-startHeap)/1024/1024;assert.ok(growth<32,`Unexpected retained heap growth: ${growth} MiB`);assert.ok(clients.every(c=>c.ws.readyState===WebSocket.OPEN));assert.equal(app.rooms.get(room.id).connections.size,5);
console.log(JSON.stringify({syncReplies:10800,connections:5,elapsedSeconds:Math.round((Date.now()-start)/1000),retainedHeapGrowthMiB:Number(growth.toFixed(2)),receivedBytes:clients.reduce((n,c)=>n+c.bytes,0),finalScoreSynced:true,scope:'3 hours of 5-second sync traffic compressed; not 3 hours elapsed'}));
}finally{for(const c of clients)c.ws.terminate();app.wss.close();await new Promise(r=>app.server.close(r));}
