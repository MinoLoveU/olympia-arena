// Bộ đề tự biên soạn: kiến thức phổ thông, không phải đề chính thức của VTV.
const warm='Khởi động',obstacle='Vượt chướng ngại vật',speed='Tăng tốc',finish='Về đích',tie='Câu hỏi phụ';
const make=(id,label,round,text,solution,extra={})=>({id,label,round,text,solution,type:'text',duration:15,choices:[],...extra});
const privatePairs=[
['Thủ đô của Việt Nam là thành phố nào?','Hà Nội'],['9 nhân 7 bằng bao nhiêu?','63'],['Tác giả Truyện Kiều là ai?','Nguyễn Du'],['Nước có công thức hóa học là gì?','H₂O (H2O)'],['Một tuần có bao nhiêu ngày?','7'],['Trong tiếng Anh, “book” có nghĩa là gì?','Sách'],
['Hành tinh nào được gọi là hành tinh đỏ?','Sao Hỏa'],['Bình phương của 8 bằng bao nhiêu?','64'],['Tác giả Dế Mèn phiêu lưu ký là ai?','Tô Hoài'],['Kim loại có ký hiệu hóa học Fe là gì?','Sắt'],['Một giờ có bao nhiêu phút?','60'],['Trong tiếng Anh, “school” có nghĩa là gì?','Trường học'],
['Đại dương có diện tích lớn nhất trên Trái Đất là gì?','Thái Bình Dương'],['12 nhân 6 bằng bao nhiêu?','72'],['Tác giả bài thơ Qua Đèo Ngang là ai?','Bà Huyện Thanh Quan'],['Nguyên tố có ký hiệu hóa học O là gì?','Oxy (oxi)'],['Một thế kỷ có bao nhiêu năm?','100'],['Trong tiếng Anh, “library” có nghĩa là gì?','Thư viện']];
// Nine new private questions per team. Keep original IDs for saved matches.
const extraPrivatePairs=[
 [
  ['Một hình vuông có bao nhiêu cạnh?','4'],
  ['15 cộng 27 bằng bao nhiêu?','42'],
  ['Một mét bằng bao nhiêu xăng-ti-mét?','100'],
  ['Trong tiếng Anh, “cat” có nghĩa là gì?','Con mèo'],
  ['Cơ quan nào bơm máu đi khắp cơ thể người?','Tim'],
  ['Điền từ: “Uống nước nhớ …”.','Nguồn'],
  ['Trái Đất quay quanh ngôi sao nào?','Mặt Trời'],
  ['Một năm không nhuận có bao nhiêu ngày?','365'],
  ['Hình có ba cạnh được gọi là hình gì?','Tam giác']
 ],
 [
  ['Một hình lập phương có bao nhiêu mặt?','6'],
  ['56 chia 7 bằng bao nhiêu?','8'],
  ['Một ki-lô-gam bằng bao nhiêu gam?','1000'],
  ['Trong tiếng Anh, “dog” có nghĩa là gì?','Con chó'],
  ['Con người dùng cơ quan nào để hô hấp: phổi hay mang?','Phổi'],
  ['Điền từ: “Ăn quả nhớ kẻ … cây”.','Trồng'],
  ['Vệ tinh tự nhiên của Trái Đất có tên là gì?','Mặt Trăng'],
  ['Một năm có bao nhiêu tháng?','12'],
  ['Góc có số đo 90 độ được gọi là góc gì?','Góc vuông']
 ],
 [
  ['Một hình chữ nhật có bao nhiêu góc vuông?','4'],
  ['100 trừ 37 bằng bao nhiêu?','63'],
  ['Một ki-lô-mét bằng bao nhiêu mét?','1000'],
  ['Trong tiếng Anh, “fish” có nghĩa là gì?','Con cá'],
  ['Con người dùng giác quan nào để nghe âm thanh?','Thính giác'],
  ['Điền từ: “Lá lành đùm lá …”.','Rách'],
  ['Hành tinh chúng ta đang sống có tên là gì?','Trái Đất'],
  ['Một ngày có bao nhiêu giờ?','24'],
  ['Góc có số đo 180 độ được gọi là góc gì?','Góc bẹt']
 ]
];
const commonPairs=[
['Số nguyên tố nhỏ nhất là số nào?','2'],['Một tam giác có tổng ba góc trong bằng bao nhiêu độ?','180°'],['Loài vật nào thường được gọi là “chúa sơn lâm” trong tiếng Việt?','Hổ'],['Số La Mã X biểu thị số mấy?','10'],['Đàn bầu truyền thống có bao nhiêu dây?','1'],['Số tiếp theo của dãy 3, 6, 12, 24, … là gì?','48'],['Đơn vị đo tần số trong hệ SI là gì?','Hertz (Hz)'],['Một byte gồm bao nhiêu bit?','8'],['Từ nào trái nghĩa với “khiêm tốn”?','Kiêu ngạo / tự phụ (chấp nhận từ đồng nghĩa phù hợp)'],['Ở điều kiện thông thường, chất nào có ba trạng thái: rắn là băng, lỏng và hơi?','Nước'],['Một hình lục giác có bao nhiêu cạnh?','6'],['Điền từ: “Có công mài sắt, có ngày nên …”.','Kim'],['Một tá có bao nhiêu đơn vị?','12'],['Số nhỏ nhất có ba chữ số là số nào?','100'],['Một giờ rưỡi bằng bao nhiêu phút?','90']];
export const builtInBank=[
 ...extraPrivatePairs.flatMap((extra,team)=>[...privatePairs.slice(team*6,team*6+6),...extra].map(([text,solution],i)=>make(
  `warm-${i<6?team*6+i+1:19+team*9+i-6}`,
  `Đội ${team+1} · Câu ${i+1}/15`,warm,text,solution,{duration:3,players:[team],points:10}
 ))),
 ...commonPairs.map(([text,solution],i)=>make(`common-${i+1}`,`Khởi động chung · Câu ${i+1}/15`,warm,text,solution,{type:'buzz',duration:3,buzzAnswerSeconds:3,points:10})),
 make('obstacle-1','Hàng 1',obstacle,'Hiện tượng các giọt nước rơi từ mây xuống mặt đất được gọi là gì?','MƯA',{clue:0,points:10}),
 make('obstacle-2','Hàng 2',obstacle,'Điền từ: Mặt Trời là nguồn cung cấp nhiệt và … tự nhiên cho Trái Đất.','ÁNH SÁNG',{clue:1,points:10}),
 make('obstacle-3','Hàng 3',obstacle,'Khối thủy tinh thường có tiết diện tam giác, dùng để phân tích ánh sáng trắng thành dải màu, gọi là gì?','LĂNG KÍNH',{clue:2,points:10}),
 make('obstacle-4','Hàng 4',obstacle,'Theo cách gọi bảy sắc quen thuộc, dải màu đỏ, da cam, vàng, lục, lam, chàm, tím có mấy màu?','BẢY (7)',{clue:3,points:10}),
 make('obstacle-center','Ô trung tâm',obstacle,'Trong dải màu đỏ, da cam, vàng, lục, lam, chàm, tím, màu nào đứng trước da cam?','ĐỎ',{clue:4,points:10}),
 make('obstacle-answer','Đoán chướng ngại vật',obstacle,'Từ các hàng ngang và bức hình được hé lộ, hãy gọi tên chướng ngại vật gồm 7 chữ cái (không tính khoảng trắng).','CẦU VỒNG',{type:'buzz',duration:15,obstacleGuess:true}),
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
export const bankInfo={title:'Chinh phục tri thức · Bộ đề 01',description:'82 mục chơi cho 3 đội: 60 Khởi động (15 câu riêng mỗi đội + 15 câu chung), 5 ô gợi ý + 1 chướng ngại vật, 4 Tăng tốc, 9 Về đích, 3 câu phụ.'};
