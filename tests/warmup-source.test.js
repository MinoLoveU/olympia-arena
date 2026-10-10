import test from 'node:test';import assert from 'node:assert/strict';
import {builtInBank} from '../multiplayer/bank.js';import {createRoom,act,snapshot} from '../multiplayer/game.js';
const question=id=>builtInBank.find(q=>q.id===id);
test('Source warm-up preserves numbering/blanks and separates bold answers from bold prompt emphasis',()=>{
 const qs=builtInBank.filter(q=>q.round==='Khởi động');assert.equal(qs.length,60);assert.equal(qs.filter(q=>!q.pending).length,57);
 assert.deepEqual(qs.filter(q=>q.pending).map(q=>q.id),['warm-27','warm-36','warm-45']);
 assert.equal(question('warm-1').solution,'Lúa nước.');
 const math=qs.find(q=>q.label==='Đội 1 · Câu 10/15');assert.ok(math.text.includes('4 × 10³ = ?'));assert.equal(math.solution,'Bốn nghìn năm.');
 const english=qs.find(q=>q.label==='Đội 2 · Câu 5/15');assert.equal(english.text,'In which year was the American Declaration of Independence adopted?');assert.equal(english.solution,'1776.');
 assert.equal(question('common-11').solution,'2');assert.ok(!question('common-11').text.endsWith('(2)'));
 for(const prefix of ['Tư tưởng khẳng định chủ quyền quốc gia là thiêng liêng','Trong cách diễn đạt về chiều dài lịch sử','“22. Đánh giá về tinh hoa tri thức nhân loại'])assert.ok(!qs.some(q=>q.text.startsWith(prefix)));
 const r=createRoom();for(const q of qs.filter(q=>q.pending)){assert.throws(()=>act(r,'host',{type:'preset',id:q.id}),/để trống/);assert.equal(r.question,null);}assert.deepEqual(r.usedQuestions,[]);
});
test('Common question 5 carries source image while answer stays private until revealed',()=>{
 const r=createRoom();act(r,'host',{type:'preset',id:'common-5'});
 assert.equal(r.question.text,'Hình ảnh này nói lên truyền thống tốt đẹp nào của dân tộc ta?');assert.equal(r.question.solution,'Đoàn kết dân tộc');
 for(const role of ['display','p0','p1','p2']){const q=snapshot(r,role).question;assert.equal(q.media,'/assets/warmup-common-5.jpg');assert.equal(q.mediaType,'image');assert.equal(q.solution,undefined);assert.equal(q.type,'buzz');}
 assert.equal(snapshot(r,'host').question.solution,'Đoàn kết dân tộc');
});
