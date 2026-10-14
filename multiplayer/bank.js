import {finishQuestions} from './compact-finish-bank.js';
import {speedQuestions} from './compact-speed-bank.js';
import {obstacleSets} from './compact-obstacle-sets.js';
export {obstacleSets};
import {warmupQuestions} from './warmup-bank.js';
const obstacle='Vượt chướng ngại vật',speed='Tăng tốc',finish='Về đích';
const slot=(id,label,round,extra={})=>({id,label,round,text:'',solution:'',type:'text',duration:15,choices:[],pending:true,...extra});
export const cheerVideos=[1,2].flatMap(section=>['Đội Cầu truyền hình','Đội Chủ nghĩa tư bản','Đội Chủ nghĩa xã hội'].map((name,team)=>({id:`cheer-${section}-${team+1}`,label:name,round:section===1?'Cổ vũ · trước Khởi động':'Cổ vũ · trước Về đích',text:name,solution:'',type:'text',duration:15,choices:[],players:[],cheer:true,cheerSection:section,cheerTeam:team,media:'',mediaType:'video'})));
export const builtInBank=[
 ...cheerVideos.filter(q=>q.cheerSection===1),
 ...warmupQuestions,
 ...obstacleSets.flatMap(set=>[
  ...[...set.clues,set.center].map(([text,solution,media={}],i)=>({...slot(`compact-obstacle-${set.id}-${i===8?'center':i+1}`,i===8?'Ô trung tâm':`Gợi ý ${i+1}`,obstacle,{obstacleSet:set.id,clue:i,points:10}),text,solution,pending:false,...media})),
  {...slot(`compact-obstacle-${set.id}-answer`,'Đoán chướng ngại vật',obstacle,{obstacleSet:set.id,type:'buzz',obstacleGuess:true}),text:'Từ các gợi ý và bức hình được hé lộ, hãy gọi tên chướng ngại vật.',solution:set.answer,pending:false}
 ]),
 ...speedQuestions,
 ...cheerVideos.filter(q=>q.cheerSection===2),
 ...finishQuestions,

];
export const bankInfo={version:'compact-v1',title:'Olympia · Bộ đề chính thức',description:'Đã có 60 câu Khởi động và 2 chướng ngại vật (mỗi bộ 8 gợi ý và 1 trung tâm). Đã có 30 câu Tăng tốc. Đã có 4 câu Về đích/đội (2 câu 20 điểm, 2 câu 30 điểm). Hai phần Cổ vũ, mỗi phần có video của ba đội (chờ cập nhật).'};
