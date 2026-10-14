import {warmupQuestions} from './warmup-bank.js';
const obstacle='Vượt chướng ngại vật',speed='Tăng tốc',finish='Về đích';
const slot=(id,label,round,extra={})=>({id,label,round,text:'',solution:'',type:'text',duration:15,choices:[],pending:true,...extra});
export const obstacleSets=Array.from({length:2},(_,i)=>({id:String(i+1),name:'Chờ đề mới',answer:'',image:'/assets/obstacle-awaiting.svg'}));
export const builtInBank=[
 ...warmupQuestions,
 ...obstacleSets.flatMap(set=>[
  ...Array.from({length:9},(_,i)=>slot(`compact-obstacle-${set.id}-${i===8?'center':i+1}`,i===8?'Ô trung tâm':`Gợi ý ${i+1}`,obstacle,{obstacleSet:set.id,clue:i,points:10})),
  slot(`compact-obstacle-${set.id}-answer`,'Đoán chướng ngại vật',obstacle,{obstacleSet:set.id,type:'buzz',obstacleGuess:true})
 ]),
 ...Array.from({length:20},(_,i)=>slot(`compact-speed-${i+1}`,`Câu ${i+1}/20`,speed,{duration:25})),
 ...Array.from({length:3},(_,team)=>Array.from({length:4},(_,i)=>slot(`compact-finish-${team+1}-${i+1}`,`Đội ${team+1} · Câu ${i+1}/4 · ${i<2?20:30} điểm`,finish,{players:[team],points:i<2?20:30}))).flat(),
 ...[['17 nhân 6 bằng bao nhiêu?','102'],['Số nguyên tố lớn nhất nhỏ hơn 20 là số nào?','19'],['Điền số tiếp theo theo quy luật mỗi số bằng tổng hai số liền trước: 1, 1, 2, 3, 5, 8, …','13']].map(([text,solution],i)=>({...slot(`tie-${i+1}`,`Câu phụ ${i+1}/3`,'Câu hỏi phụ'),text,solution,pending:false,type:'buzz'}))
];
export const bankInfo={version:'compact-v1',title:'Olympia · Chờ bộ đề mới',description:'Khởi động giữ đủ 60 câu. Chờ đề mới: 2 chướng ngại vật (mỗi bộ 8 gợi ý và 1 trung tâm), 20 câu Tăng tốc, 4 câu Về đích/đội (2 câu 20 điểm, 2 câu 30 điểm). Giữ 3 câu phụ.'};
