import {warmupQuestions} from './warmup-bank.js';
import {speedReasoning,speedOrders,finishPairs} from './expanded-bank.js';
import {visualQuestions} from './visual-questions.js';
import {obstacleSets} from './obstacle-sets.js';
export {obstacleSets};
// Khởi động theo tài liệu của chủ tài khoản; các vòng còn lại tự biên soạn.
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
 make('speed-1','Câu 1 · Nhìn nhanh',speed,'Quan sát hình: có bao nhiêu hình tam giác màu vàng?','5',{duration:20,media:'/assets/speed-shapes.svg',mediaType:'image'}),
 make('speed-2','Câu 2 · Sắp xếp',speed,'Chọn cách sắp xếp các số theo thứ tự tăng dần.','½ → ⅔ → 0,75 → 0,8',{duration:20,type:'choice',choices:['½ → ⅔ → 0,75 → 0,8','⅔ → ½ → 0,75 → 0,8','½ → 0,75 → ⅔ → 0,8','0,8 → 0,75 → ⅔ → ½']}),
 make('speed-3','Câu 3 · Suy luận',speed,'Có 3 hộp, mỗi hộp chứa 4 túi, mỗi túi có 5 viên bi. Lấy ra 2 túi từ mỗi hộp. Còn lại tổng cộng bao nhiêu viên bi?','30 viên bi: 3 × (4 − 2) × 5.',{duration:30}),
 make('speed-4','Câu 4 · Đoạn băng',speed,'Xem đoạn băng trên màn trình chiếu. Hình vuông chuyển động từ trái sang phải có màu gì?','Xanh dương',{duration:30,type:'choice',choices:['Đỏ','Vàng','Xanh dương','Trắng'],media:'/assets/speed-motion.mp4',mediaType:'video'}),
 make('finish-1','Đội 1 · Câu 1 · 20 điểm',finish,'Một hình chữ nhật dài 12 cm, rộng 8 cm. Chu vi bằng bao nhiêu cm?','40 cm: (12 + 8) × 2.',{players:[0],points:20}),
 make('finish-2','Đội 1 · Câu 2 · 20 điểm',finish,'Trong các số sau, số nào chia hết cho cả 3 và 5?','45',{players:[0],points:20,type:'choice',choices:['25','32','45','52']}),
 make('finish-3','Đội 1 · Câu 3 · 30 điểm',finish,'Một người đi nửa quãng đường với vận tốc 30 km/h, nửa còn lại với vận tốc 60 km/h. Không nghỉ dọc đường, vận tốc trung bình cả hành trình là bao nhiêu?','40 km/h. Gọi mỗi nửa quãng đường là d: 2d ÷ (d/30 + d/60) = 40.',{players:[0],points:30,duration:20}),
 make('finish-4','Đội 2 · Câu 1 · 20 điểm',finish,'Một hình vuông có cạnh 9 cm. Diện tích bằng bao nhiêu cm²?','81 cm².',{players:[1],points:20}),
 make('finish-5','Đội 2 · Câu 2 · 20 điểm',finish,'Phân số nào bằng 0,625?','5/8',{players:[1],points:20,type:'choice',choices:['3/8','5/8','2/3','3/4']}),
 make('finish-6','Đội 2 · Câu 3 · 30 điểm',finish,'Một vòi riêng lẻ đổ đầy bể trong 6 giờ, vòi khác trong 3 giờ. Bể ban đầu rỗng, mở đồng thời cả hai vòi với lưu lượng không đổi thì bao lâu đầy bể?','2 giờ: 1/6 + 1/3 = 1/2 bể mỗi giờ.',{players:[1],points:30,duration:20}),
 make('finish-7','Đội 3 · Câu 1 · 20 điểm',finish,'Một tam giác có đáy 14 cm và chiều cao tương ứng 6 cm. Diện tích bằng bao nhiêu cm²?','42 cm²: 14 × 6 ÷ 2.',{players:[2],points:20}),
 make('finish-8','Đội 3 · Câu 2 · 20 điểm',finish,'Số nào là số nguyên tố?','29',{players:[2],points:20,type:'choice',choices:['21','27','29','33']}),
 make('finish-9','Đội 3 · Câu 3 · 30 điểm',finish,'Một món hàng được giảm 20%, sau đó tăng 25% trên giá đã giảm. Giá cuối cùng bằng bao nhiêu phần trăm giá ban đầu?','100%: 0,8 × 1,25 = 1.',{players:[2],points:30,duration:20}),
 make('tie-1','Câu phụ 1/3',tie,'17 nhân 6 bằng bao nhiêu?','102',{type:'buzz'}),
 make('tie-2','Câu phụ 2/3',tie,'Số nguyên tố lớn nhất nhỏ hơn 20 là số nào?','19',{type:'buzz'}),
 make('tie-3','Câu phụ 3/3',tie,'Điền số tiếp theo theo quy luật mỗi số bằng tổng hai số liền trước: 1, 1, 2, 3, 5, 8, …','13',{type:'buzz'})
];

const extraSpeed=[
 ...visualQuestions.map(q=>({...q,type:'text',duration:20,mediaType:'image',kind:'Nhìn nhanh'})),
 ...speedOrders.map(([order,items])=>({text:`Sắp xếp ${order}: ${[items[2],items[0],items[3],items[1]].join(' ; ')}.`,solution:items.join(' → '),duration:20,kind:'Sắp xếp'})),
 ...speedReasoning.map(([text,solution])=>({text,solution,duration:30,kind:'Suy luận'}))
];
export const builtInBank=[
 ...originalBank.map(q=>q.round===finish?{...q,points:20,duration:15,label:q.label.replace('30 điểm','20 điểm').replace(/Câu (\d+) ·/, 'Câu $1/20 ·')}:q.round===obstacle?{...q,obstacleSet:'1'}:q),
 ...extraSpeed.map((q,i)=>make(`speed-${i+5}`,`Câu ${i+5}/60 · ${q.kind}`,speed,q.text,q.solution,q)),
 ...finishPairs.map(([text,solution],i)=>{const team=Math.floor(i/17);return make(`finish-${i+10}`,`Đội ${team+1} · Câu ${i%17+4}/20 · 20 điểm`,finish,text,solution,{players:[team],points:20,duration:15});}),
 ...obstacleSets.slice(1).flatMap(set=>[
  ...[...set.clues,set.center].map(([text,solution],i)=>make(`obstacle-${set.id}-${i===8?'center':i+1}`,i===8?'Ô trung tâm':`Gợi ý ${i+1}`,obstacle,text,solution,{clue:i,points:10,obstacleSet:set.id})),
  make(`obstacle-${set.id}-answer`,'Đoán chướng ngại vật',obstacle,'Từ các gợi ý và bức hình được hé lộ, hãy gọi tên chướng ngại vật.',set.answer,{type:'buzz',obstacleGuess:true,obstacleSet:set.id})
 ])
];
export const bankInfo={title:'Chinh phục tri thức · Bộ đề 01',description:'263 vị trí (260 câu đã điền): Khởi động có 57 câu và 3 vị trí trống, 8 bộ Chướng ngại vật (64 gợi ý ngoài + 8 trung tâm + 8 lượt đoán), 60 Tăng tốc, 60 Về đích (đều 20 điểm), 3 câu phụ.'};
