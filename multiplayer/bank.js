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
 make('obstacle-1','Gợi ý 1',obstacle,'Hiện tượng các giọt nước rơi từ mây xuống mặt đất được gọi là gì?','MƯA',{clue:0,points:10}),
 make('obstacle-2','Gợi ý 2',obstacle,'Điền từ: Mặt Trời là nguồn cung cấp nhiệt và … tự nhiên cho Trái Đất.','ÁNH SÁNG',{clue:1,points:10}),
 make('obstacle-3','Gợi ý 3',obstacle,'Khối thủy tinh thường có tiết diện tam giác, dùng để phân tích ánh sáng trắng thành dải màu, gọi là gì?','LĂNG KÍNH',{clue:2,points:10}),
 make('obstacle-4','Gợi ý 4',obstacle,'Theo cách gọi bảy sắc quen thuộc, dải màu đỏ, da cam, vàng, lục, lam, chàm, tím có mấy màu?','BẢY (7)',{clue:3,points:10}),
 make('obstacle-5','Gợi ý 5',obstacle,'Hiện tượng ánh sáng đổi hướng khi truyền xiên qua mặt phân cách giữa hai môi trường trong suốt gọi là gì?','KHÚC XẠ',{clue:4,points:10}),
 make('obstacle-6','Gợi ý 6',obstacle,'Hiện tượng ánh sáng bị hắt trở lại môi trường cũ khi gặp một bề mặt được gọi là gì?','PHẢN XẠ',{clue:5,points:10}),
 make('obstacle-7','Gợi ý 7',obstacle,'Ánh sáng trắng qua lăng kính bị phân tách thành nhiều màu. Hiện tượng đó gọi là gì?','TÁN SẮC',{clue:6,points:10}),
 make('obstacle-8','Gợi ý 8',obstacle,'Vật thể hình cầu rất nhỏ tạo nên mưa, có thể làm ánh sáng khúc xạ và phản xạ bên trong, là gì?','GIỌT NƯỚC',{clue:7,points:10}),
 make('obstacle-center','Ô trung tâm',obstacle,'Trong dải màu đỏ, da cam, vàng, lục, lam, chàm, tím, màu nào đứng trước da cam?','ĐỎ',{clue:8,points:10}),
 make('obstacle-answer','Đoán chướng ngại vật',obstacle,'Từ các gợi ý và bức hình được hé lộ, hãy gọi tên chướng ngại vật gồm 7 chữ cái (không tính khoảng trắng).','CẦU VỒNG',{type:'buzz',duration:15,obstacleGuess:true}),
 make('tie-1','Câu phụ 1/3',tie,'17 nhân 6 bằng bao nhiêu?','102',{type:'buzz'}),
 make('tie-2','Câu phụ 2/3',tie,'Số nguyên tố lớn nhất nhỏ hơn 20 là số nào?','19',{type:'buzz'}),
 make('tie-3','Câu phụ 3/3',tie,'Điền số tiếp theo theo quy luật mỗi số bằng tổng hai số liền trước: 1, 1, 2, 3, 5, 8, …','13',{type:'buzz'})
];

export const builtInBank=[
 ...finishQuestions,
 ...speedQuestions,
 ...originalBank.map(q=>q.round===finish?{...q,points:20,duration:15,label:q.label.replace('30 điểm','20 điểm').replace(/Câu (\d+) ·/, 'Câu $1/20 ·')}:q.round===obstacle?{...q,obstacleSet:'1'}:q),
 ...obstacleSets.slice(1).flatMap(set=>[
  ...[...set.clues,set.center].map(([text,solution],i)=>make(`obstacle-${set.id}-${i===8?'center':i+1}`,i===8?'Ô trung tâm':`Gợi ý ${i+1}`,obstacle,text,solution,{clue:i,points:10,obstacleSet:set.id})),
  make(`obstacle-${set.id}-answer`,'Đoán chướng ngại vật',obstacle,'Từ các gợi ý và bức hình được hé lộ, hãy gọi tên chướng ngại vật.',set.answer,{type:'buzz',obstacleGuess:true,obstacleSet:set.id})
 ])
].map(q=>q.round===speed?{...q,type:'text',choices:[],duration:25}:q.round===finish?{...q,duration:15}:q);
export const bankInfo={title:'Chinh phục tri thức · Bộ đề 01',description:'263 vị trí (262 câu đã điền): Khởi động có 59 câu và 1 vị trí trống, 8 bộ Chướng ngại vật (64 gợi ý ngoài + 8 trung tâm + 8 lượt đoán), 60 Tăng tốc, 60 Về đích (đều 20 điểm), 3 câu phụ.'};
