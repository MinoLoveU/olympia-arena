import {builtInBank,bankInfo,obstacleSets} from './bank.js';
import {randomBytes} from 'node:crypto';
const token=()=>randomBytes(24).toString('base64url');
export function createRoom(){return {id:randomBytes(6).toString('hex'),tokens:{host:token(),display:token(),p0:token(),p1:token(),p2:token()},revision:0,questionId:0,usedQuestions:[],round:'Khởi động',teams:[0,1,2].map(i=>({name:`Đội ${i+1}`,score:0})),question:null,phase:'waiting',deadline:null,duration:15,answers:{},judgements:{},buzzes:[],showAnswers:false,showSolution:false,obstacleSet:'1',obstacleProgress:{},opened:[],selectedClue:null,usedClues:[],image:'/assets/obstacle-rainbow.svg',log:'Mời MC chọn câu hỏi.',connections:new Map(),updatedAt:Date.now()};}
export function authenticate(room,secret){return Object.keys(room.tokens).find(role=>room.tokens[role]===secret)||null;}
export function snapshot(room,role,now=Date.now()){
 const {revision,questionId,round,teams,phase,deadline,duration,buzzes,showAnswers,showSolution,opened,selectedClue,usedClues,image,log,judgements}=room;
 const question=room.question?{text:room.question.text,type:room.question.type,choices:room.question.choices,media:room.question.media,mediaType:room.question.mediaType,players:room.question.players,points:room.question.points,label:room.question.label,...(role==='host'||showSolution?{solution:room.question.solution}:{})}:null;
 const answers=Object.fromEntries(Object.entries(room.answers).map(([id,a])=>[id,{...a,text:role==='host'||showAnswers||role===`p${id}`?a.text:null}]));
 return {...(role==='host'?{catalog:builtInBank,bankInfo,usedQuestions:room.usedQuestions,obstacleSets:obstacleSets.map(({id,name})=>({id,name})),obstacleProgress:room.round==='Vượt chướng ngại vật'?{...room.obstacleProgress,[room.obstacleSet]:{opened:room.opened,usedClues:room.usedClues,image:room.image}}:room.obstacleProgress}:{}),revision,questionId,round,teams,phase,deadline,duration,buzzes,showAnswers,showSolution,opened,selectedClue,usedClues,image,log,question,answers,judgements,obstacleSet:room.obstacleSet,obstacleClueCount:8,serverNow:now,role,online:Object.fromEntries(['host','display','p0','p1','p2'].map(r=>[r,[...room.connections.values()].includes(r)]))};
}
const fail=message=>{throw Error(message);};
const clean=(s,max=2000)=>typeof s==='string'?s.trim().slice(0,max):'';
function saveObstacle(room){
 if(room.round==='Vượt chướng ngại vật')room.obstacleProgress[room.obstacleSet]={opened:[...room.opened],usedClues:[...room.usedClues],image:room.image};
}
function loadObstacle(room,id){
 const set=obstacleSets.find(s=>s.id===id),progress=room.obstacleProgress[id];
 room.obstacleSet=id;room.opened=[...(progress?.opened||[])];room.usedClues=[...(progress?.usedClues||[])];room.image=progress?.image||set.image;
}
export function act(room,role,msg,now=Date.now()){
 if(!msg||typeof msg.type!=='string')fail('Lệnh không hợp lệ.');
 if(role==='host'){
  if(msg.type==='obstacleSet'){
   if(room.phase==='open')fail('Khóa trả lời trước khi đổi bộ.');
   if(!obstacleSets.some(s=>s.id===msg.id))fail('Bộ chướng ngại vật không tồn tại.');
   saveObstacle(room);loadObstacle(room,msg.id);room.round='Vượt chướng ngại vật';
   room.question=null;room.questionId++;room.selectedClue=null;room.phase='waiting';room.deadline=null;room.answers={};room.judgements={};room.buzzes=[];room.showAnswers=false;room.showSolution=false;
   room.log=`Đã chọn bộ chướng ngại vật ${msg.id}. Mời đội chọn gợi ý.`;
  }else if(msg.type==='preset'){
   const entry=builtInBank.find(q=>q.id===msg.id);if(!entry)fail('Câu hỏi không tồn tại trong bộ đề.');
   if(entry.obstacleSet&&entry.obstacleSet!==room.obstacleSet)fail('Chọn đúng bộ chướng ngại vật trước khi mở gợi ý.');
   if(room.usedQuestions.includes(entry.id))fail('Câu này đã được mở. Hãy chọn câu chưa chơi.');
   act(room,'host',{type:'question',question:entry,round:entry.round,clue:entry.clue,duration:entry.duration},now);
   room.usedQuestions.push(entry.id);return snapshot(room,role,now);
  }else if(msg.type==='question'){
   if(room.phase==='open')fail('Đóng nhận đáp án trước khi đổi câu.');
   const q=msg.question;if(!q||!clean(q.text)||!['text','choice','buzz'].includes(q.type))fail('Câu hỏi không hợp lệ.');
   const choices=Array.isArray(q.choices)?q.choices.map(c=>clean(c,200)).filter(Boolean).slice(0,8):[];
   if(q.type==='choice'&&choices.length<2)fail('Cần ít nhất hai lựa chọn.');
   const seconds=Number(msg.duration);if(!Number.isInteger(seconds)||seconds<1||seconds>600)fail('Thời gian từ 1 đến 600 giây.');
   const round=clean(msg.round,80)||'Khởi động';const clue=msg.clue;
   const clues=room.round==='Vượt chướng ngại vật'?room.usedClues:(room.obstacleProgress[room.obstacleSet]?.usedClues||[]);
   if(round==='Vượt chướng ngại vật'&&!q.obstacleGuess){
    if(!Number.isInteger(clue)||clue<0||clue>8)fail('Chọn hàng trước khi mở câu hỏi.');
    if(clues.includes(clue))fail('Câu này đã được chọn.');
    if(clue===8&&clues.filter(n=>n<8).length<8)fail('Chọn đủ tám gợi ý trước ô trung tâm.');
   }
   if(round!==room.round){saveObstacle(room);if(round==='Vượt chướng ngại vật')loadObstacle(room,room.obstacleSet);else{room.opened=[];room.usedClues=[];}}room.round=round;
   room.questionId++;room.question={text:clean(q.text),solution:clean(q.solution),type:q.type,choices,media:clean(q.media,2000),mediaType:['image','audio','video'].includes(q.mediaType)?q.mediaType:'image',players:q.players||[0,1,2],points:q.points,label:q.label||'',buzzAnswerSeconds:q.buzzAnswerSeconds};
   room.selectedClue=round==='Vượt chướng ngại vật'&&!q.obstacleGuess?clue:null;if(room.selectedClue!==null)room.usedClues.push(clue);
   room.duration=seconds;room.phase='ready';room.deadline=null;room.answers={};room.judgements={};room.buzzes=[];room.showAnswers=false;room.showSolution=false;room.log='Câu hỏi đã mở. Chờ MC bắt đầu.';
  }else if(msg.type==='round'){
   if(room.phase==='open')fail('Đóng nhận đáp án trước khi đổi vòng.');
   saveObstacle(room);room.round=clean(msg.round,80);room.question=null;room.selectedClue=null;if(room.round==='Vượt chướng ngại vật')loadObstacle(room,room.obstacleSet);else{room.opened=[];room.usedClues=[];}room.answers={};room.judgements={};room.buzzes=[];room.phase='waiting';room.deadline=null;room.showAnswers=false;room.showSolution=false;room.log='Mời đội chơi chọn câu hỏi.';
  }else if(msg.type==='start'){
   if(!room.question||room.phase!=='ready')fail('Cần mở câu hỏi mới trước khi bắt đầu.');room.phase='open';room.deadline=now+room.duration*1000;room.log='Đang nhận đáp án / chuông.';
  }else if(msg.type==='close'){
   room.phase=room.question?'closed':'waiting';room.deadline=null;room.log='Đã khóa nhận đáp án.';
  }else if(msg.type==='waiting'){
   if(room.phase==='open')fail('Đóng nhận đáp án trước.');room.question=null;room.selectedClue=null;room.phase='waiting';room.deadline=null;room.showAnswers=false;room.showSolution=false;room.answers={};room.judgements={};room.buzzes=[];room.log='Mời đội chơi chọn câu hỏi tiếp theo.';
  }else if(msg.type==='judge'){
   if(!room.question||msg.questionId!==room.questionId)fail('Câu hỏi đã đổi. Chấm câu đang hiển thị.');
   if(room.phase!=='closed')fail('Khóa trả lời trước khi chấm.');
   const player=msg.player,result=msg.result;
   if(!Number.isInteger(player)||player<0||player>2||!['correct','wrong','no-answer','clear'].includes(result))fail('Kết quả chấm không hợp lệ.');
   if(!room.question.players.includes(player))fail('Câu này dành cho đội khác.');
   if(room.question.type==='buzz'&&room.buzzes[0]?.player!==player)fail('Chỉ chấm đội giành chuông đầu tiên.');
   const previous=room.judgements[player];
   if(msg.version!==(previous?.version||0))fail('Kết quả đã thay đổi. Kiểm tra lại trước khi chấm.');
   const normalized=result==='clear'?null:result;
   if(previous?.result===normalized)return snapshot(room,role,now);
   const points=room.round==='Khởi động'?(result==='correct'?10:room.question.type==='buzz'&&['wrong','no-answer'].includes(result)?-5:0):0;
   const score=room.teams[player].score+points-(previous?.points||0);
   if(!Number.isFinite(score)||Math.abs(score)>100000)fail('Điểm vượt giới hạn.');
   room.teams[player].score=score;
   room.judgements[player]={result:normalized,points,version:(previous?.version||0)+1};
   const label={correct:'Đúng',wrong:'Sai','no-answer':'Không trả lời',clear:'Bỏ chấm'}[result];
   room.log=`${room.teams[player].name}: ${label}. ${room.round==='Khởi động'?`Điểm câu này: ${points>0?'+':''}${points}.`:'Chỉ ghi nhận; điểm vòng này do MC nhập.'}`;
  }else if(msg.type==='score'){
   if(!Number.isInteger(msg.player)||msg.player<0||msg.player>2||!Number.isFinite(msg.score)||Math.abs(msg.score)>100000)fail('Điểm không hợp lệ.');room.teams[msg.player].score=msg.score;room.log=`MC đặt điểm ${room.teams[msg.player].name}: ${msg.score}.`;
  }else if(msg.type==='name'){
   if(!Number.isInteger(msg.player)||msg.player<0||msg.player>2||!clean(msg.name,40))fail('Tên không hợp lệ.');room.teams[msg.player].name=clean(msg.name,40);
  }else if(msg.type==='revealAnswers'){
   if(room.phase==='open')fail('Khóa nhận đáp án trước khi công bố.');room.showAnswers=!!msg.show;
  }else if(msg.type==='revealSolution'){
   if(room.phase==='open')fail('Khóa nhận đáp án trước khi công bố.');room.showSolution=!!msg.show;
  }else if(msg.type==='tile'){
   if(room.round!=='Vượt chướng ngại vật'||room.selectedClue===null)fail('Chưa chọn câu hỏi chướng ngại vật.');
   room.opened=room.opened.filter(i=>i!==room.selectedClue);if(msg.open)room.opened.push(room.selectedClue);
  }else if(msg.type==='restore'){
   if(room.phase==='open')fail('Khóa nhận đáp án trước khi khôi phục.');
   const b=msg.backup;
   if(!b||!Array.isArray(b.teams)||b.teams.length!==3||b.teams.some(t=>!clean(t.name,40)||!Number.isFinite(t.score)||Math.abs(t.score)>100000))fail('Bản sao không hợp lệ.');
   if(b.obstacleClueCount!==undefined&&b.obstacleClueCount!==8)fail('Phiên bản ô hình không hỗ trợ.');
   const legacy=b.obstacleClueCount===undefined;
   if(!Array.isArray(b.opened)||!Array.isArray(b.usedClues)||[...b.opened,...b.usedClues].some(i=>!Number.isInteger(i)||i<0||i>(legacy?4:8)))fail('Các ô hình trong bản sao không hợp lệ.');
   const setId=b.obstacleSet||'1';if(!obstacleSets.some(s=>s.id===setId))fail('Bộ trong bản sao không hợp lệ.');
   const progress={};
   if(b.obstacleProgress){
    if(typeof b.obstacleProgress!=='object'||Array.isArray(b.obstacleProgress))fail('Tiến độ không hợp lệ.');
    for(const [id,p] of Object.entries(b.obstacleProgress)){
     if(!obstacleSets.some(s=>s.id===id)||!p||!Array.isArray(p.opened)||!Array.isArray(p.usedClues)||[...p.opened,...p.usedClues].some(i=>!Number.isInteger(i)||i<0||i>8))fail('Tiến độ ô hình không hợp lệ.');
     progress[id]={opened:[...new Set(p.opened)],usedClues:[...new Set(p.usedClues)],image:/^(https?:\/\/|\/assets\/)/.test(p.image||'')?p.image:obstacleSets.find(s=>s.id===id).image};
    }
   }
   room.obstacleSet=setId;room.obstacleProgress=progress;
   room.usedQuestions=Array.isArray(b.usedQuestions)?b.usedQuestions.filter(id=>builtInBank.some(q=>q.id===id)):[];
   room.teams=b.teams.map(t=>({name:clean(t.name,40),score:t.score}));room.round=clean(b.round,80);room.opened=[...new Set(b.opened.map(i=>legacy&&i===4?8:i))];room.usedClues=[...new Set(b.usedClues.map(i=>legacy&&i===4?8:i))];
   room.question=null;room.questionId++;room.selectedClue=null;room.phase='waiting';room.deadline=null;room.answers={};room.judgements={};room.buzzes=[];room.showAnswers=false;room.showSolution=false;
   room.image=/^(https?:\/\/|\/assets\/)/.test(b.image||'')?b.image:obstacleSets.find(s=>s.id===setId).image;
   if(room.round==='Vượt chướng ngại vật'||!b.obstacleProgress)room.obstacleProgress[setId]={opened:[...room.opened],usedClues:[...room.usedClues],image:room.image};
   room.log='Đã khôi phục điểm và ô hình; MC chọn câu tiếp theo. Đáp án/chuông cũ chỉ nằm trong bản sao để đối chiếu.';
  }else if(msg.type==='image'){
   const url=clean(msg.url);if(!/^(https?:\/\/|\/assets\/)/.test(url))fail('Ảnh cần URL http(s).');room.image=url;
  }else fail('Lệnh MC không hợp lệ.');
 }else if(/^p[0-2]$/.test(role)){
  const player=Number(role[1]);if(room.question?.players&&!room.question.players.includes(player))fail('Câu này dành cho đội khác.');if(msg.questionId!==room.questionId)fail('Câu hỏi đã đổi. Vui lòng gửi lại ở câu hiện tại.');
  if(room.phase!=='open'||!room.question||now>=room.deadline)fail('Chưa mở hoặc đã hết thời gian nhận đáp án.');
  if(msg.type==='buzz'){
   if(room.question.type!=='buzz')fail('Câu này không dùng chuông.');
   if(room.buzzes.some(b=>b.player===player))fail('Đã ghi nhận chuông của bạn.');
   if(!room.buzzes.length&&room.question.buzzAnswerSeconds)room.deadline=now+room.question.buzzAnswerSeconds*1000;room.buzzes.push({player,rank:room.buzzes.length+1,receivedAt:now});room.log=`Chuông thứ ${room.buzzes.length}: ${room.teams[player].name}.`;
  }else if(msg.type==='answer'){
   if(room.answers[player])fail('Đã nhận đáp án đầu tiên; không thể thay đổi.');
   if(room.question.type==='buzz'&&room.buzzes[0]?.player!==player)fail('Chỉ đội giành chuông đầu tiên được trả lời.');
   const text=clean(msg.text,1000);if(!text)fail('Đáp án không được để trống.');
   if(room.question.type==='choice'&&!room.question.choices.includes(text))fail('Lựa chọn không hợp lệ.');
   room.answers[player]={text,receivedAt:now};room.log=`Đã nhận đáp án ${room.teams[player].name}.`;
  }else fail('Người chơi không được điều khiển cuộc thi.');
 }else fail('Màn trình chiếu chỉ được xem.');
 saveObstacle(room);room.updatedAt=now;room.revision++;return snapshot(room,role,now);
}
export function expire(room,now=Date.now()){if(room.phase==='open'&&now>=room.deadline){room.phase='closed';room.log='Hết giờ. Đã khóa nhận đáp án.';room.revision++;return true;}return false;}
