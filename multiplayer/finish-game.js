export const FINISH='Về đích';
const fail=message=>{throw Error(message);};
export function finishView(room){return room.round===FINISH&&room.question&&room.finish?.questionId===room.questionId?{...room.finish}:null;}
export function finishCommand(room,role,msg,now){
 const f=finishView(room);
 if(msg.type==='finishBuzz'){
  if(!/^p[0-2]$/.test(role)||!f||msg.questionId!==room.questionId)fail('Không có quyền giành câu Về đích này.');
  const player=Number(role[1]);
  if(player===f.owner||f.stage!=='buzz'||room.phase!=='open'||now>=room.deadline)fail('Chưa mở hoặc đã hết 5 giây giành quyền.');
  room.finish.stage='answer';room.finish.winner=player;room.phase='closed';room.deadline=null;
  room.buzzes=[{player,rank:1,receivedAt:now}];
  room.log=`${room.teams[player].name} giành quyền. Trả lời miệng; MC ghi nhận đáp án đầu tiên rồi chấm.`;
  return true;
 }
 if(!f)return false;
 if(role!=='host'){
  if(msg.type==='answer'&&f.stage!=='main')fail('Lượt trả lời chính đã kết thúc.');
  return false;
 }
 if(['revealSolution','revealAnswers'].includes(msg.type)&&msg.show&&f.stage!=='done')fail('Chấm xong câu Về đích trước khi công bố đáp án.');
 if(msg.type==='close'&&f.stage==='buzz'){room.finish.stage='done';}
 if(msg.type!=='judge')return false;
 if(msg.questionId!==room.questionId||room.phase!=='closed')fail('Khóa trả lời trước khi chấm câu hiện tại.');
 const {player,result}=msg;
 if(!Number.isInteger(player)||!['correct','wrong','no-answer','clear'].includes(result))fail('Kết quả chấm không hợp lệ.');
 if(player!==f.owner&&player!==f.winner)fail('Chỉ chấm đội chính hoặc đội giành quyền.');
 const old=room.judgements[player],normalized=result==='clear'?null:result;
 if(msg.version!==(old?.version||0))fail('Kết quả đã thay đổi. Kiểm tra lại trước khi chấm.');
 if(old?.result===normalized)return true;
 const base=room.question.points,star=!!room.hopeStar;
 const points=result==='correct'?(player===f.owner&&star?base*2:base):['wrong','no-answer'].includes(result)?(player===f.owner?(star?-base:0):-base/2):0;
 const next={...room.judgements,[player]:{result:normalized,points,version:(old?.version||0)+1}};
 // Correcting the main response invalidates the dependent steal, refunding only its award.
 if(player===f.owner&&f.winner!==null){const previous=next[f.winner];next[f.winner]={result:null,points:0,version:(previous?.version||0)+1};}
 const scores=room.teams.map((t,i)=>t.score+(next[i]?.points||0)-(room.judgements[i]?.points||0));
 if(scores.some(n=>!Number.isFinite(n)||Math.abs(n)>100000))fail('Điểm vượt giới hạn.');
 room.judgements=next;room.teams.forEach((t,i)=>t.score=scores[i]);
 if(player===f.owner){
  room.finish.winner=null;room.buzzes=[];room.showAnswers=false;room.showSolution=false;
  if(['wrong','no-answer'].includes(result)){
   room.finish.stage='buzz';room.phase='open';room.deadline=now+5000;
   room.log='Hai đội còn lại có 5 giây giành quyền trả lời. Đúng cộng điểm câu hỏi; sai/không trả lời trừ một nửa.';
  }else {room.finish.stage=result==='clear'?'main':'done';room.deadline=null;room.log='Đã cập nhật kết quả đội chính và điểm Về đích.';}
 }else{
  room.finish.stage=result==='clear'?'answer':'done';
  room.log=`${room.teams[player].name}: ${result==='correct'?'Đúng':result==='clear'?'Bỏ chấm':'Sai / không trả lời'}. Điểm lượt giành quyền: ${points}.`;
 }
 return true;
}
export function expireFinish(room,now){
 if(finishView(room)?.stage==='buzz'&&room.phase==='open'&&now>=room.deadline){
  room.finish.stage='done';room.phase='closed';room.log='Hết 5 giây. Không có đội giành quyền.';return true;
 }return false;
}
