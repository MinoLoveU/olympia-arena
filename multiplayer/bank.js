import {finishQuestions} from './finish-bank.js';
import {warmupQuestions} from './warmup-bank.js';
import {speedQuestions} from './speed-bank.js';
import {obstacleSets} from './obstacle-sets.js';
export {obstacleSets};
// Khởi động, Tăng tốc và Về đích theo tài liệu của chủ tài khoản.
const warm='Khởi động',obstacle='Vượt chướng ngại vật',speed='Tăng tốc',finish='Về đích',tie='Câu hỏi phụ';
const make=(id,label,round,text,solution,extra={})=>({id,label,round,text,solution,type:'text',duration:15,choices:[],...extra});
const originalBank=[
 ...warmupQuestions,
 make('tie-1','Câu phụ 1/3',tie,'17 nhân 6 bằng bao nhiêu?','102',{type:'buzz'}),
 make('tie-2','Câu phụ 2/3',tie,'Số nguyên tố lớn nhất nhỏ hơn 20 là số nào?','19',{type:'buzz'}),
 make('tie-3','Câu phụ 3/3',tie,'Điền số tiếp theo theo quy luật mỗi số bằng tổng hai số liền trước: 1, 1, 2, 3, 5, 8, …','13',{type:'buzz'})
];

export const builtInBank=[
 ...finishQuestions,
 ...speedQuestions,
 ...originalBank.map(q=>q.round===finish?{...q,points:20,duration:15,label:q.label.replace('30 điểm','20 điểm').replace(/Câu (\d+) ·/, 'Câu $1/20 ·')}:q.round===obstacle?{...q,obstacleSet:'1'}:q),
 ...obstacleSets.flatMap(set=>[
  ...[...set.clues,set.center].map(([text,solution,media={}],i)=>make(`obstacle-${set.id==='1'?'':set.id+'-'}${i===8?'center':i+1}`,i===8?'Ô trung tâm':`Gợi ý ${i+1}`,obstacle,text,solution,{clue:i,points:10,obstacleSet:set.id,...media})),
  make(`obstacle-${set.id==='1'?'':set.id+'-'}answer`,'Đoán chướng ngại vật',obstacle,'Từ các gợi ý và bức hình được hé lộ, hãy gọi tên chướng ngại vật.',set.answer,{type:'buzz',obstacleGuess:true,obstacleSet:set.id})
 ])
].map(q=>q.round===speed?{...q,type:'text',choices:[],duration:q.duration||25}:q.round===finish?{...q,duration:15}:q);
export const bankInfo={title:'Chinh phục tri thức · Bộ đề 01',description:'263 vị trí (262 câu đã điền): Khởi động có 59 câu và 1 vị trí trống, 8 bộ Chướng ngại vật (64 gợi ý ngoài + 8 trung tâm + 8 lượt đoán), 60 Tăng tốc, 60 Về đích (đều 20 điểm), 3 câu phụ.'};
