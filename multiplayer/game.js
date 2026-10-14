import {OBSTACLE,obstacleGame,obstacleView,obstacleBackup,restoreObstacleGames,obstacleCommand,expireObstacle} from './obstacle-game.js';
import {migrateObstacleBackup} from './obstacle-migration.js';
import {builtInBank,bankInfo,obstacleSets} from './bank.js';
import {randomBytes} from 'node:crypto';
const teamNames=['Đội Cầu truyền hình','Đội Chủ nghĩa tư bản','Đội Chủ nghĩa xã hội'];
const token=()=>randomBytes(24).toString('base64url');
export function createRoom({questionBank={builtInBank,bankInfo,obstacleSets}}={}){return {obstacleGames:{},questionBank,id:randomBytes(6).toString('hex'),tokens:{host:token(),display:token(),p0:token(),p1:token(),p2:token()},revision:0,questionId:0,usedQuestions:[],hopeUsed:[0,0,0],hopeStar:null,videoPlayback:null,round:'Khởi động',teams:[0,1,2].map(i=>({name:teamNames[i],score:0})),question:null,phase:'waiting',deadline:null,duration:15,answers:{},judgements:{},buzzes:[],showAnswers:false,showSolution:false,obstacleSet:'1',obstacleProgress:{},opened:[],selectedClue:null,usedClues:[],image:questionBank.obstacleSets[0].image,log:'Mời MC chọn câu hỏi.',connections:new Map(),updatedAt:Date.now()};}
export function authenticate(room,secret){return Object.keys(room.tokens).find(role=>room.tokens[role]===secret)||null;}
export function snapshot(room,role,now=Date.now()){
 const {builtInBank,bankInfo,obstacleSets}=room.questionBank;
 const {revision,questionId,round,teams,phase,deadline,duration,buzzes,showAnswers,showSolution,opened,selectedClue,usedClues,image,log,judgements,hopeUsed,hopeStar}=room;
 const question=room.question?{text:room.question.text,type:room.question.type,choices:room.question.choices,media:room.question.media,mediaType:room.question.mediaType,matchingColumns:room.question.matchingColumns,players:room.question.players,obstacleGuess:!!room.question.obstacleGuess,points:room.question.points,label:room.question.label,...(role==='host'||showSolution?{solution:room.question.solution}:{})}:null;
 const answers=Object.fromEntries(Object.entries(room.answers).map(([id,a])=>[id,{...a,text:role==='host'||showAnswers||role===`p${id}`?a.text:null}]));
 return {obstacle:obstacleView(room,role),...(role==='host'?{obstacleGames:obstacleBackup(room),catalog:builtInBank,bankInfo,usedQuestions:room.usedQuestions,obstacleSets:obstacleSets.map(({id,name})=>({id,name})),obstacleProgress:room.round==='Vượt chướng ngại vật'?{...room.obstacleProgress,[room.obstacleSet]:{opened:room.opened,usedClues:room.usedClues,image:room.image}}:room.obstacleProgress}:{}),revision,questionId,round,teams,phase,deadline,duration,buzzes,showAnswers,showSolution,opened,selectedClue,usedClues,image,log,question,answers,judgements,hopeUsed:[...hopeUsed],hopeStar:hopeStar?{...hopeStar}:null,obstacleSet:room.obstacleSet,obstacleClueCount:8,obstacleBankVersion:2,questionBankVersion:bankInfo.version,videoPlayback:room.question?.mediaType==='video'&&room.videoPlayback?.questionId===room.questionId?room.videoPlayback:null,serverNow:now,role,online:Object.fromEntries(['host','display','p0','p1','p2'].map(r=>[r,[...room.connections.values()].includes(r)]))};
}
const fail=message=>{throw Error(message);};
const clean=(s,max=2000)=>typeof s==='string'?s.trim().slice(0,max):'';
function restoredObstacleImage(id,url,obstacleSets){
 const fallback=obstacleSets.find(s=>s.id===id).image;
 if(/^\/assets\/obstacle-(?:rainbow|awaiting|[2-8])\.svg$/.test(url||''))return fallback;
 return /^(https?:\/\/|\/assets\/)/.test(url||'')?url:fallback;
}
function saveObstacle(room){
 if(room.round==='Vượt chướng ngại vật')room.obstacleProgress[room.obstacleSet]={opened:[...room.opened],usedClues:[...room.usedClues],image:room.image};
}
function loadObstacle(room,id){
 const {obstacleSets}=room.questionBank;
 const set=obstacleSets.find(s=>s.id===id),progress=room.obstacleProgress[id];
 room.obstacleSet=id;room.opened=[...(progress?.opened||[])];room.usedClues=[...(progress?.usedClues||[])];room.image=progress?.image||set.image;
}
export function act(room,role,msg,now=Date.now()){
 const {builtInBank,bankInfo,obstacleSets}=room.questionBank;
 if(!msg||typeof msg.type!=='string')fail('Lệnh không hợp lệ.');
 if(obstacleCommand(room,role,msg,now)){saveObstacle(room);room.updatedAt=now;room.revision++;return snapshot(room,role,now);}
 const og=obstacleGame(room);
 if(room.round===OBSTACLE&&role==='host'&&['preset','question','round','obstacleSet','waiting','start','restore'].includes(msg.type)&&(og.pending||og.paused&&!og.solved&&!og.ended||og.finalDeadline!==null))fail('Chấm lượt đoán và tiếp tục hoặc khóa trước khi đổi câu.');
 if(role==='host'){
  if(msg.type==='obstacleSet'){
   if(room.phase==='open')fail('Khóa trả lời trước khi đổi bộ.');
   if(!obstacleSets.some(s=>s.id===msg.id))fail('Bộ chướng ngại vật không tồn tại.');
   saveObstacle(room);loadObstacle(room,msg.id);room.round='Vượt chướng ngại vật';
   room.question=null;room.questionId++;room.selectedClue=null;room.phase='waiting';room.deadline=null;room.answers={};room.judgements={};room.hopeStar=null;room.buzzes=[];room.showAnswers=false;room.showSolution=false;
   room.log=`Đã chọn bộ chướng ngại vật ${msg.id}. Mời đội chọn gợi ý.`;
  }else if(msg.type==='preset'){
   const entry=builtInBank.find(q=>q.id===msg.id);if(!entry)fail('Câu hỏi không tồn tại trong bộ đề.');
   if(entry.pending)fail('Câu này đang để trống trong tài liệu, chưa thể mở.');
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
   if(round===OBSTACLE&&(og.solved||og.ended))fail('Bộ chướng ngại vật đã kết thúc.');
   if(round==='Vượt chướng ngại vật'&&!q.obstacleGuess){
    if(!Number.isInteger(clue)||clue<0||clue>8)fail('Chọn hàng trước khi mở câu hỏi.');
    if(clues.includes(clue))fail('Câu này đã được chọn.');
    const required=builtInBank.filter(entry=>entry.obstacleSet===room.obstacleSet&&entry.clue<8&&!entry.pending);
    if(clue===8&&!required.every(entry=>clues.includes(entry.clue)))fail('Chọn hết các gợi ý có câu hỏi trước ô trung tâm.');
   }
   if(round!==room.round){saveObstacle(room);if(round==='Vượt chướng ngại vật')loadObstacle(room,room.obstacleSet);else{room.opened=[];room.usedClues=[];}}room.round=round;
   room.videoPlayback=null;room.questionId++;room.question={text:clean(q.text),solution:clean(q.solution),type:round==='Tăng tốc'?'text':q.type,choices:round==='Tăng tốc'?[]:choices,media:clean(q.media,2000),mediaType:['image','audio','video'].includes(q.mediaType)?q.mediaType:'image',players:q.players||[0,1,2],obstacleGuess:!!q.obstacleGuess,points:q.points,label:q.label||'',buzzAnswerSeconds:q.buzzAnswerSeconds};
   if(Array.isArray(q.matchingColumns)&&q.matchingColumns.length===2&&q.matchingColumns.every(col=>Array.isArray(col)&&col.length===4&&col.every(x=>typeof x==='string')))room.question.matchingColumns=q.matchingColumns.map(col=>col.map(x=>clean(x,400)));
   room.selectedClue=round==='Vượt chướng ngại vật'&&!q.obstacleGuess?clue:null;if(room.selectedClue!==null)room.usedClues.push(clue);
   room.duration=round==='Tăng tốc'?(builtInBank.find(entry=>entry.id===q.id&&entry.round===round)?.duration??25):round==='Về đích'?15:seconds;room.phase='ready';room.deadline=null;room.answers={};room.judgements={};room.hopeStar=null;room.buzzes=[];room.showAnswers=false;room.showSolution=false;room.log='Câu hỏi đã mở. Chờ MC bắt đầu.';
  }else if(msg.type==='round'){
   if(room.phase==='open')fail('Đóng nhận đáp án trước khi đổi vòng.');
   saveObstacle(room);room.round=clean(msg.round,80);room.question=null;room.selectedClue=null;if(room.round==='Vượt chướng ngại vật')loadObstacle(room,room.obstacleSet);else{room.opened=[];room.usedClues=[];}room.answers={};room.judgements={};room.hopeStar=null;room.buzzes=[];room.phase='waiting';room.deadline=null;room.showAnswers=false;room.showSolution=false;room.log='Mời đội chơi chọn câu hỏi.';
  }else if(msg.type==='hopeStar'){
   if(msg.questionId!==room.questionId)fail('Câu hỏi đã đổi. Kiểm tra lại câu đang mở.');
   if(room.round!=='Về đích'||room.phase!=='ready'||![20,30].includes(room.question?.points)||room.question.players.length!==1)fail('Chọn câu Về đích 20 hoặc 30 điểm và dùng sao trước khi bắt đầu.');
   const player=room.question.players[0];
   if(!Number.isInteger(player)||player<0||player>2)fail('Đội không hợp lệ.');
   if(room.hopeStar)fail('Câu này đã dùng Ngôi sao hy vọng.');
   if(room.hopeUsed[player]>=3)fail('Đội này đã dùng hết ba ngôi sao.');
   room.hopeUsed[player]++;room.hopeStar={questionId:room.questionId,player};
   room.log=`${room.teams[player].name} dùng Ngôi sao hy vọng: đúng +${room.question.points*2}, sai/không trả lời −${room.question.points*2}. Còn ${3-room.hopeUsed[player]} sao.`;
  }else if(msg.type==='video'){
   if(!room.question||room.question.mediaType!=='video'||msg.questionId!==room.questionId)fail('Câu hiện tại không có video hoặc đã đổi.');
   if(!['play','stop'].includes(msg.action))fail('Lệnh video không hợp lệ.');
   room.videoPlayback={questionId:room.questionId,sequence:room.revision+1,action:msg.action,at:now};
   room.log=msg.action==='play'?'Đang phát video trên màn trình chiếu. MC bấm Bắt đầu khi muốn tính giờ trả lời.':'Đã dừng video.';
  }else if(msg.type==='start'){
   if(!room.question||room.phase!=='ready')fail('Cần mở câu hỏi mới trước khi bắt đầu.');room.phase='open';room.startedAt=now;room.deadline=now+room.duration*1000;room.log='Đang nhận đáp án / chuông.';
  }else if(msg.type==='close'){
   if(room.round===OBSTACLE){if(og.pending)fail('Chấm lượt đoán CNV trước.');const finalPaused=og.paused?.finalRemaining!==null&&og.paused?.finalRemaining!==undefined;og.paused=null;if(og.finalDeadline!==null||finalPaused){og.finalDeadline=null;og.ended=true;}og.version++;}
   room.phase=room.question?'closed':'waiting';room.deadline=null;room.log='Đã khóa nhận đáp án.';
  }else if(msg.type==='waiting'){
   if(room.phase==='open')fail('Đóng nhận đáp án trước.');room.question=null;room.selectedClue=null;room.phase='waiting';room.deadline=null;room.showAnswers=false;room.showSolution=false;room.answers={};room.judgements={};room.hopeStar=null;room.buzzes=[];room.log='Mời đội chơi chọn câu hỏi tiếp theo.';
  }else if(msg.type==='judge'){
   if(!room.question||msg.questionId!==room.questionId)fail('Câu hỏi đã đổi. Chấm câu đang hiển thị.');
   if(room.phase!=='closed')fail('Khóa trả lời trước khi chấm.');
   const player=msg.player,result=msg.result;
   if(!Number.isInteger(player)||player<0||player>2||!['correct','wrong','no-answer','clear'].includes(result))fail('Kết quả chấm không hợp lệ.');
   if(!room.question.players.includes(player))fail('Câu này dành cho đội khác.');
   if(room.round===OBSTACLE&&(og.pending||og.eliminated.includes(player)||room.question.obstacleGuess))fail('Đội bị loại hoặc đang chờ chấm lượt đoán CNV.');
   if(room.question.type==='buzz'&&room.buzzes[0]?.player!==player)fail('Chỉ chấm đội giành chuông đầu tiên.');
   const previous=room.judgements[player];
   if(msg.version!==(previous?.version||0))fail('Kết quả đã thay đổi. Kiểm tra lại trước khi chấm.');
   const normalized=result==='clear'?null:result;
   if(previous?.result===normalized)return snapshot(room,role,now);
   if(room.round==='Tăng tốc'){
    if(result==='correct'&&!room.answers[player])fail('Đội chưa gửi đáp án.');
    const next={...room.judgements,[player]:{result:normalized,points:0,version:(previous?.version||0)+1,correctOrder:result==='correct'?room.revision+1:null}};
    const ordered=Object.keys(next).filter(i=>next[i].result==='correct').sort((a,b)=>next[a].correctOrder-next[b].correctOrder);
    const scores=room.teams.map(t=>t.score);
    for(const key of Object.keys(next)){
     const rank=ordered.indexOf(key),points=rank<0?0:([40,30,20,10][rank]||0),old=room.judgements[key];
     scores[key]+=points-(old?.points||0);
     if(!Number.isFinite(scores[key])||Math.abs(scores[key])>100000)fail('Điểm vượt giới hạn.');
     next[key]={...next[key],points,version:next[key].version+(Number(key)!==player&&points!==(old?.points||0)?1:0)};
    }
    room.judgements=next;room.teams.forEach((t,i)=>t.score=scores[i]);
    room.log='Tăng tốc: điểm 40–30–20–10 theo thứ tự MC tích Đúng; sửa/bỏ chấm tự xếp lại điểm.';
    room.updatedAt=now;room.revision++;return snapshot(room,role,now);
   }
   const starred=room.round==='Về đích'&&room.hopeStar?.questionId===room.questionId&&room.hopeStar.player===player;
   const points=starred?(result==='correct'?room.question.points*2:['wrong','no-answer'].includes(result)?-room.question.points*2:0):room.round===OBSTACLE?(result==='correct'?10:0):room.round==='Khởi động'?(result==='correct'?10:room.question.type==='buzz'&&['wrong','no-answer'].includes(result)?-5:0):0;
   const score=room.teams[player].score+points-(previous?.points||0);
   if(!Number.isFinite(score)||Math.abs(score)>100000)fail('Điểm vượt giới hạn.');
   room.teams[player].score=score;
   room.judgements[player]={result:normalized,points,version:(previous?.version||0)+1};
   if(room.round===OBSTACLE&&room.selectedClue===8){room.opened=room.opened.filter(i=>i!==8);if(Object.values(room.judgements).some(j=>j.result==='correct'))room.opened.push(8);}
   const label={correct:'Đúng',wrong:'Sai','no-answer':'Không trả lời',clear:'Bỏ chấm'}[result];
   room.log=`${room.teams[player].name}: ${label}. ${room.round==='Khởi động'||room.round===OBSTACLE||starred?`Điểm câu này: ${points>0?'+':''}${points}.`:'Chỉ ghi nhận; điểm vòng này do MC nhập.'}`;
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
   let b=msg.backup;
   if(b&&bankInfo.version==='compact-v1'&&b.questionBankVersion!==bankInfo.version)b={...b,obstacleGames:{},obstacleSet:'1',obstacleProgress:{},opened:[],usedClues:[],image:obstacleSets[0].image,usedQuestions:Array.isArray(b.usedQuestions)?b.usedQuestions.filter(id=>/^(warm-|common-|tie-)/.test(id)):[]};
   else b=migrateObstacleBackup(b,obstacleSets);
   if(!b||!Array.isArray(b.teams)||b.teams.length!==3||b.teams.some(t=>!clean(t.name,40)||!Number.isFinite(t.score)||Math.abs(t.score)>100000))fail('Bản sao không hợp lệ.');
   if(b.obstacleClueCount!==undefined&&b.obstacleClueCount!==8)fail('Phiên bản ô hình không hỗ trợ.');
   const legacy=b.obstacleClueCount===undefined;
   const hopeUsed=b.hopeUsed===undefined?[0,0,0]:b.hopeUsed;
   if(!Array.isArray(hopeUsed)||hopeUsed.length!==3||hopeUsed.some(n=>!Number.isInteger(n)||n<0||n>3))fail('Số ngôi sao trong bản sao không hợp lệ.');
   if(!Array.isArray(b.opened)||!Array.isArray(b.usedClues)||[...b.opened,...b.usedClues].some(i=>!Number.isInteger(i)||i<0||i>(legacy?4:8)))fail('Các ô hình trong bản sao không hợp lệ.');
   const setId=b.obstacleSet||'1';if(!obstacleSets.some(s=>s.id===setId))fail('Bộ trong bản sao không hợp lệ.');
   const games=restoreObstacleGames(room,b.obstacleGames);
   const progress={};
   if(b.obstacleProgress){
    if(typeof b.obstacleProgress!=='object'||Array.isArray(b.obstacleProgress))fail('Tiến độ không hợp lệ.');
    for(const [id,p] of Object.entries(b.obstacleProgress)){
     if(!obstacleSets.some(s=>s.id===id)||!p||!Array.isArray(p.opened)||!Array.isArray(p.usedClues)||[...p.opened,...p.usedClues].some(i=>!Number.isInteger(i)||i<0||i>8))fail('Tiến độ ô hình không hợp lệ.');
     progress[id]={opened:[...new Set(p.opened)],usedClues:[...new Set(p.usedClues)],image:restoredObstacleImage(id,p.image,obstacleSets)};
    }
   }
   room.obstacleGames=games;room.hopeUsed=[...hopeUsed];room.obstacleSet=setId;room.obstacleProgress=progress;
   room.usedQuestions=Array.isArray(b.usedQuestions)?b.usedQuestions.filter(id=>builtInBank.some(q=>q.id===id)):[];
   room.teams=b.teams.map((t,i)=>({name:clean(t.name,40)===`Đội ${i+1}`?teamNames[i]:clean(t.name,40),score:t.score}));room.round=clean(b.round,80);room.opened=[...new Set(b.opened.map(i=>legacy&&i===4?8:i))];room.usedClues=[...new Set(b.usedClues.map(i=>legacy&&i===4?8:i))];
   room.question=null;room.questionId++;room.selectedClue=null;room.phase='waiting';room.deadline=null;room.answers={};room.judgements={};room.hopeStar=null;room.buzzes=[];room.showAnswers=false;room.showSolution=false;
   room.image=restoredObstacleImage(setId,b.image,obstacleSets);
   if(room.round==='Vượt chướng ngại vật'||!b.obstacleProgress)room.obstacleProgress[setId]={opened:[...room.opened],usedClues:[...room.usedClues],image:room.image};
   room.log='Đã khôi phục điểm và ô hình; MC chọn câu tiếp theo. Đáp án/chuông cũ chỉ nằm trong bản sao để đối chiếu.';
  }else if(msg.type==='image'){
   const url=clean(msg.url);if(!/^(https?:\/\/|\/assets\/)/.test(url))fail('Ảnh cần URL http(s).');room.image=url;
  }else fail('Lệnh MC không hợp lệ.');
 }else if(/^p[0-2]$/.test(role)){
  const player=Number(role[1]);if(room.round===OBSTACLE&&(og.eliminated.includes(player)||og.pending||og.paused||og.solved||og.ended||room.question?.obstacleGuess))fail('Không có quyền trả lời gợi ý ở thời điểm này.');if(room.question?.players&&!room.question.players.includes(player))fail('Câu này dành cho đội khác.');if(msg.questionId!==room.questionId)fail('Câu hỏi đã đổi. Vui lòng gửi lại ở câu hiện tại.');
  if(room.phase!=='open'||!room.question||(room.deadline!==null&&now>=room.deadline))fail('Chưa mở hoặc đã hết thời gian nhận đáp án.');
  if(msg.type==='buzz'){
   if(room.question.type!=='buzz')fail('Câu này không dùng chuông.');
   if(room.buzzes.some(b=>b.player===player))fail('Đã ghi nhận chuông của bạn.');
   if(!room.buzzes.length){if(room.round==='Khởi động')room.deadline=null;else if(room.question.buzzAnswerSeconds)room.deadline=now+room.question.buzzAnswerSeconds*1000;}room.buzzes.push({player,rank:room.buzzes.length+1,receivedAt:now});room.log=`Chuông thứ ${room.buzzes.length}: ${room.teams[player].name}.`;
  }else if(msg.type==='answer'){
   if(room.answers[player])fail('Đã nhận đáp án đầu tiên; không thể thay đổi.');
   if(room.question.type==='buzz'&&room.buzzes[0]?.player!==player)fail('Chỉ đội giành chuông đầu tiên được trả lời.');
   const text=room.round==='Tăng tốc'?(typeof msg.text==='string'?msg.text.trim():''):clean(msg.text,1000);if(!text)fail('Đáp án không được để trống.');
   if(room.question.type==='choice'&&!room.question.choices.includes(text))fail('Lựa chọn không hợp lệ.');
   room.answers[player]={text,receivedAt:now,...(room.round==='Tăng tốc'?{elapsedMs:Math.max(0,now-room.startedAt),rank:Object.keys(room.answers).length+1}:{})};room.log=`Đã nhận đáp án ${room.teams[player].name}.`;
  }else fail('Người chơi không được điều khiển cuộc thi.');
 }else fail('Màn trình chiếu chỉ được xem.');
 saveObstacle(room);room.updatedAt=now;room.revision++;return snapshot(room,role,now);
}
export function expire(room,now=Date.now()){if(expireObstacle(room,now)){room.revision++;return true;}if(room.phase==='open'&&room.deadline!==null&&now>=room.deadline){room.phase='closed';room.log='Hết giờ. Đã khóa nhận đáp án.';room.revision++;return true;}return false;}
