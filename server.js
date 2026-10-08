import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {networkInterfaces} from 'node:os';
import {WebSocketServer,WebSocket} from 'ws';
import {builtInBank,obstacleSets} from './multiplayer/bank.js';
import {createRoom,authenticate,snapshot,act,expire} from './multiplayer/game.js';
import {verifyPassword} from './multiplayer/access.js';
const root=fileURLToPath(new URL('.',import.meta.url));
function sameOrigin(origin,host){try{return !origin||new URL(origin).host===host;}catch{return false;}}
export function createGameServer({accessHash=process.env.OLYMPIA_ACCESS_HASH}={}){
 const rooms=new Map();
 const attempts=new Map();
 function checkPassword(password,key){
  const now=Date.now(),entry=attempts.get(key);
  if(entry&&entry.until>now&&entry.count>=10)return 'Thử quá nhiều lần. Chờ một phút rồi thử lại.';
  if(verifyPassword(password,accessHash)){attempts.delete(key);return '';}
  attempts.set(key,{count:entry&&entry.until>now?entry.count+1:1,until:entry&&entry.until>now?entry.until:now+60000});
  return 'Mật khẩu chưa đúng. Vui lòng nhập lại.';
 }
 const allowed=new Map([['/','multiplayer/index.html'],['/app.js','multiplayer/client.js'],['/style.css','style.css'],['/multiplayer.css','multiplayer/style.css'],['/assets/library.svg','assets/library.svg'],['/assets/obstacle-rainbow.svg','assets/obstacle-rainbow.svg'],['/assets/speed-shapes.svg','assets/speed-shapes.svg'],['/assets/speed-motion.mp4','assets/speed-motion.mp4'],['/assets/olympia-title.webp','assets/olympia-title.webp']]);
 for(const url of [...builtInBank.map(q=>q.media),...obstacleSets.map(s=>s.image)].filter(Boolean)){if(url.startsWith('/assets/'))allowed.set(url,url.slice(1));}
 const server=http.createServer(async(req,res)=>{
  const path=new URL(req.url,'http://local').pathname;
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.method==='POST'&&path==='/api/rooms'){
   // Same-origin requests only; remote players receive an existing role link.
   if(!sameOrigin(req.headers.origin,req.headers.host))return json(403,{error:'Origin không hợp lệ'});
   const denied=checkPassword(req.headers['x-olympia-password'],'create:'+req.socket.remoteAddress);
   if(denied)return json(401,{error:denied});
   if(rooms.size>=100)return json(429,{error:'Máy chủ đã đủ phòng.'});
   const room=createRoom();rooms.set(room.id,room);return json(201,{id:room.id,tokens:room.tokens});
  }
  if(req.method==='GET'&&path==='/health')return json(200,{ok:true});
  if(req.method!=='GET'||!allowed.has(path)){res.writeHead(404);res.end('Not found');return;}
  try{const file=allowed.get(path),data=await readFile(root+file);const ext=file.split('.').pop();res.writeHead(200,{'Content-Type':{html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml',webp:'image/webp',mp4:'video/mp4'}[ext],'Cache-Control':'no-cache','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'});res.end(data);}catch{res.writeHead(500);res.end('Không đọc được tệp.');}
 });
 const wss=new WebSocketServer({server,maxPayload:16384});
 function broadcast(room){for(const [socket,role] of room.connections)if(socket.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'state',state:snapshot(room,role)}));}
 wss.on('connection',(socket,req)=>{
  if(!sameOrigin(req.headers.origin,req.headers.host)){socket.close(1008,'Origin');return;}
  socket.on('error',()=>{});
  let room,role,count=0,window=Date.now();const authTimer=setTimeout(()=>socket.close(1008,'Authentication timeout'),120000);
  socket.on('message',raw=>{try{
   if(Date.now()-window>1000){window=Date.now();count=0;}if(++count>30)throw Error('Thao tác quá nhanh.');
   const msg=JSON.parse(raw);
   if(!room){if(msg.type!=='join')throw Error('Cần tham gia phòng.');const found=rooms.get(msg.room);const foundRole=found&&authenticate(found,msg.token);if(!foundRole)throw Error('Liên kết phòng không hợp lệ hoặc phòng đã đóng.');
    if(foundRole==='host'){
     const denied=msg.password===undefined?'Nhập mật khẩu để mở màn điều khiển MC.':checkPassword(msg.password,found.id+':'+foundRole);
     if(denied){socket.send(JSON.stringify({type:'password-required',message:denied}));return;}
    }
    room=found;role=foundRole;clearTimeout(authTimer);room.connections.set(socket,role);if(role==='host')socket.send(JSON.stringify({type:'links',tokens:room.tokens}));broadcast(room);return;}
   if(msg.type==='sync'){socket.send(JSON.stringify({type:'state',state:snapshot(room,role)}));return;}
   act(room,role,msg);broadcast(room);
  }catch(error){socket.send(JSON.stringify({type:'error',message:error.message,fatal:!room}));if(!room)socket.close(1008,'Invalid room');}});
  socket.on('close',()=>{clearTimeout(authTimer);if(room){room.connections.delete(socket);broadcast(room);}});
 });
 const ticker=setInterval(()=>{const now=Date.now();for(const [key,entry] of attempts)if(entry.until<=now)attempts.delete(key);for(const [id,room] of rooms){if(expire(room,now))broadcast(room);if(!room.connections.size&&now-room.updatedAt>86400000)rooms.delete(id);}},100);
 server.on('close',()=>{clearInterval(ticker);wss.close();});
 return {server,wss,rooms};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const port=Number(process.env.PORT||4173),{server}=createGameServer();server.listen(port,'0.0.0.0',()=>{
  console.log(`Olympia multiplayer: http://localhost:${port}`);
  for(const entries of Object.values(networkInterfaces()))for(const ip of entries||[])if(ip.family==='IPv4'&&!ip.internal)console.log(`LAN: http://${ip.address}:${port}`);
  console.log('Giữ tiến trình chạy suốt trận. Phòng lưu trong RAM; khởi động lại máy chủ sẽ tạo trận mới.');
 });
}
