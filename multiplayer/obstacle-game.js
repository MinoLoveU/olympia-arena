export const OBSTACLE='Vượt chướng ngại vật';
const fail=message=>{throw Error(message);};
export function obstacleGame(room){return room.obstacleGames[room.obstacleSet]??= {version:0,eliminated:[],solved:false,ended:false,pending:null,last:null,paused:null,finalDeadline:null,finalStarted:false};}
export function obstaclePoints(room){return room.usedClues.includes(8)?10:([60,60,55,50,45,40,35,30,20][room.usedClues.filter(i=>i<8).length]||20);}
export function obstacleView(room,role){const g=obstacleGame(room);return {...g,points:obstaclePoints(room),canBuzz:room.round===OBSTACLE&&room.usedClues.length>0&&!g.pending&&!g.solved&&!g.ended,...(role==='host'?{solution:room.questionBank.obstacleSets.find(s=>s.id===room.obstacleSet).answer}:{})};}
export function obstacleBackup(room){return Object.fromEntries(Object.entries(room.obstacleGames).map(([id,g])=>[id,{eliminated:[...g.eliminated],solved:g.solved,ended:g.ended}]));}
export function restoreObstacleGames(room,data){const result={};if(data===undefined)return result;if(!data||typeof data!=='object'||Array.isArray(data))fail('Tiến độ đoán CNV không hợp lệ.');for(const [id,g] of Object.entries(data)){if(!room.questionBank.obstacleSets.some(s=>s.id===id)||!g||!Array.isArray(g.eliminated)||g.eliminated.some(p=>!Number.isInteger(p)||p<0||p>2)||typeof g.solved!=='boolean'||typeof g.ended!=='boolean')fail('Tiến độ đoán CNV không hợp lệ.');result[id]={version:0,eliminated:[...new Set(g.eliminated)],solved:g.solved,ended:g.ended,pending:null,last:null,paused:null,finalDeadline:null,finalStarted:false};}return result;}
export function expireObstacle(room,now){if(room.round!==OBSTACLE)return false;const g=obstacleGame(room);if(g.finalDeadline!==null&&now>=g.finalDeadline){g.finalDeadline=null;g.ended=true;g.version++;room.log='Hết 15 giây đoán chướng ngại vật cuối cùng.';return true;}return false;}
export function obstacleCommand(room,role,msg,now){
 if(!['obstacleBuzz','obstacleJudge','obstacleResume','obstacleFinal'].includes(msg.type))return false;
 if(room.round!==OBSTACLE||msg.obstacleSet!==room.obstacleSet||msg.questionId!==room.questionId)fail('Bộ hoặc câu hỏi đã đổi.');
 const g=obstacleGame(room);if(msg.version!==g.version)fail('Lượt đoán đã thay đổi. Kiểm tra lại màn hình.');
 if(msg.type==='obstacleBuzz'){
  if(!/^p[0-2]$/.test(role))fail('Chỉ đội chơi được giành quyền.');
  const player=Number(role[1]);
  if(!room.usedClues.length)fail('Chờ MC mở gợi ý đầu tiên.');
  if(g.eliminated.includes(player))fail('Đội đã bị loại khỏi chướng ngại vật này.');
  if(g.pending||g.solved||g.ended||g.finalDeadline!==null&&now>=g.finalDeadline)fail('Không còn nhận chuông đoán chướng ngại vật.');
  if(!g.paused){g.paused={phase:room.phase,remaining:room.phase==='open'&&room.deadline!==null?Math.max(0,room.deadline-now):null,finalRemaining:g.finalDeadline!==null?Math.max(0,g.finalDeadline-now):null};if(g.paused.remaining===0)g.paused.phase='closed';}
  room.phase=room.question?'closed':'waiting';room.deadline=null;g.finalDeadline=null;
  g.pending={id:room.revision+1,player,points:obstaclePoints(room),receivedAt:now,questionId:room.questionId};g.last=null;
  room.log=`${room.teams[player].name} giành quyền đoán CNV (${g.pending.points} điểm). Trả lời miệng; MC chấm riêng CNV.`;
 }else{
  if(role!=='host')fail('Chỉ MC được điều khiển.');
  if(msg.type==='obstacleJudge'){
   if(!g.pending&&(room.phase==='open'||g.finalDeadline!==null))fail('Khóa trả lời trước khi sửa lượt đoán.');
   const attempt=g.pending||g.last;
   if(!attempt||msg.attemptId!==attempt.id||attempt.questionId!==room.questionId||!['correct','wrong','no-answer','clear'].includes(msg.result))fail('Lượt đoán hoặc kết quả không hợp lệ.');
   const result=msg.result==='clear'?null:msg.result;
   if(!g.pending&&attempt.result===result)return true;
   const points=result==='correct'?attempt.points:0,old=attempt.awarded||0,score=room.teams[attempt.player].score+points-old;
   if(!Number.isFinite(score)||Math.abs(score)>100000)fail('Điểm vượt giới hạn.');
   const base=attempt.baseEliminated||[...g.eliminated];
   g.eliminated=[...base];if(['wrong','no-answer'].includes(result))g.eliminated.push(attempt.player);
   g.solved=result==='correct';g.ended=g.solved||g.eliminated.length===3;
   room.teams[attempt.player].score=score;
   g.last={...attempt,baseEliminated:base,result,awarded:points};g.pending=null;
   room.log=`${room.teams[attempt.player].name}: ${result==='correct'?`đoán đúng CNV, +${points} điểm`:result?'đoán sai/không trả lời, bị loại khỏi bộ này':'đã bỏ chấm lượt đoán CNV'}.`;
  }else if(msg.type==='obstacleResume'){
   if(g.pending||g.solved||g.ended||!g.paused)fail('Chưa thể tiếp tục.');
   const p=g.paused;g.paused=null;room.phase=p.phase;room.deadline=p.phase==='open'&&p.remaining!==null?now+p.remaining:null;
   if(p.finalRemaining!==null)g.finalDeadline=now+p.finalRemaining;
   room.log='Tiếp tục phần chướng ngại vật.';
  }else{
   if(!room.usedClues.includes(8)||(room.question&&room.phase!=='closed')||g.pending||g.paused||g.solved||g.ended||g.finalStarted)fail('Chấm xong ô trung tâm rồi mở 15 giây đoán cuối.');
   g.finalStarted=true;g.finalDeadline=now+15000;room.log='15 giây đoán CNV cuối: đúng +10 điểm.';
  }
 }
 g.version++;return true;
}
