const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const params=new URLSearchParams(location.hash.slice(1));let room=params.get('room'),secret=params.get('token'),socket,state,clockOffset=0,lastQuestion=null,lastResponseMode=null,bankItems=[],links,stopReconnect=false;
const roles={host:'BÀN ĐIỀU KHIỂN MC',display:'MÀN TRÌNH CHIẾU',p0:'NGƯỜI CHƠI 1',p1:'NGƯỜI CHƠI 2',p2:'NGƯỜI CHƠI 3'};
function error(message){$('#error').textContent=message;$('#error').hidden=false;}
function send(msg){if(socket?.readyState!==WebSocket.OPEN){error('Mất kết nối. Chờ kết nối lại trước khi thao tác.');return false;}$('#error').hidden=true;socket.send(JSON.stringify(msg));return true;}
$('#create').onclick=async()=>{try{$('#create').disabled=true;const response=await fetch('/api/rooms',{method:'POST'}),data=await response.json();if(!response.ok)throw Error(data.error||'Không tạo được phòng.');room=data.id;secret=data.tokens.host;links=data.tokens;sessionStorage.setItem(`olympia-links-${room}`,JSON.stringify(links));location.hash=new URLSearchParams({room,token:secret}).toString();connect();}catch(e){error(e.message);$('#create').disabled=false;}};
function connect(){
 stopReconnect=false;
 $('#lobby').hidden=true;$('#connection').textContent='Đang kết nối…';$('#connection').className='';
 socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}`);
 socket.onopen=()=>socket.send(JSON.stringify({type:'join',room,token:secret}));
 socket.onmessage=e=>{const msg=JSON.parse(e.data);if(msg.type==='links'){links=msg.tokens;sessionStorage.setItem(`olympia-links-${room}`,JSON.stringify(links));return;}if(msg.type==='error'){error(msg.message);if(msg.fatal){stopReconnect=true;$('#lobby').hidden=false;}return;}if(msg.type==='state'){state=msg.state;clockOffset=state.serverNow-Date.now();$('#connection').textContent='● Đã đồng bộ';$('#connection').className='online';render();}};
 socket.onclose=()=>{$('#connection').textContent='● Mất kết nối · đang thử lại';$('#connection').className='offline';$('#response').querySelectorAll('button,input,textarea').forEach(el=>el.disabled=true);if(!stopReconnect)setTimeout(connect,1500);else $('#connection').textContent='Phòng không còn tồn tại';};
 socket.onerror=()=>{};
}
function safeURL(url){return /^(https?:\/\/|\/assets\/)/.test(url||'')?url:'';}
function media(q){if(!q?.media)return '';const src=esc(safeURL(q.media));return q.mediaType==='audio'?`<audio controls src="${src}"></audio>`:q.mediaType==='video'?`<video controls src="${src}"></video>`:`<img src="${src}" alt="Gợi ý câu hỏi">`;}
function render(){
 const s=state,host=s.role==='host',player=/^p[0-2]$/.test(s.role);document.body.dataset.role=s.role;
 $('#game').hidden=false;$('#host-panel').hidden=!host;$('#player-panel').hidden=!player;$('#role-name').textContent=roles[s.role];$('#room-name').textContent=`PHÒNG ${room.toUpperCase()}`;$('#round-name').textContent=s.round;
 $('#scoreboard').innerHTML=s.teams.map((t,i)=>`<div class="score-card"><span>${esc(t.name)}<small>${s.online[`p${i}`]?'● Đã kết nối':'○ Chưa kết nối'}</small></span><strong>${t.score}</strong></div>`).join('');
 $('#question-title').textContent=s.question?.text||(s.round==='Vượt chướng ngại vật'?'Mời đội chơi chọn câu hỏi':'Chờ MC mở câu hỏi');
 $('#phase-label').textContent=({waiting:'CHƯA MỞ CÂU HỎI',ready:'CÂU HỎI ĐÃ MỞ · CHỜ HIỆU LỆNH',open:'ĐANG NHẬN ĐÁP ÁN',closed:'ĐÃ KHÓA NHẬN ĐÁP ÁN'})[s.phase];
 if(lastQuestion!==s.questionId||!s.question){$('#question-media').innerHTML=media(s.question);lastQuestion=s.questionId;}
 $('#solution').hidden=!s.showSolution||!s.question;$('#solution').textContent=`Đáp án: ${s.question?.solution||''}`;
 $('#picture').innerHTML=s.round==='Vượt chướng ngại vật'?`<div class="obstacle-picture"><div class="tiles"><img src="${esc(safeURL(s.image))}" alt="Hình gợi ý"><span class="picture-label"></span>${[0,1,2,3,4].map(i=>`<span class="picture-cover cover-${i}" ${s.opened.includes(i)?'hidden':''}>${i===4?'★':i+1}</span>`).join('')}</div><p class="picture-label">${s.selectedClue===null?'Đội chọn hàng, MC mở câu hỏi':s.selectedClue===4?'Ô trung tâm':`Hàng ${s.selectedClue+1}`}</p></div>`:'';
 $('#answer-status').textContent=s.showAnswers?'ĐÃ CÔNG BỐ':'CHỜ MC CÔNG BỐ';
 $('#answer-cards').innerHTML=s.teams.map((t,i)=>{const a=s.answers[i];return `<div class="answer-card"><b>${esc(t.name)}</b><p>${a?(a.text===null?'✓ Đã gửi đáp án':esc(a.text)):'Chưa gửi đáp án'}</p><small>${a?'Đã ghi nhận trên máy chủ':''}</small></div>`;}).join('');
 $('#buzz-results').innerHTML=s.buzzes.length?'<b>THỨ TỰ CHUÔNG</b><br>'+s.buzzes.map(b=>`${b.rank===1?'⚑':'·'} ${b.rank}. ${esc(s.teams[b.player].name)}${b.rank===1?' — Giành quyền trả lời':''}`).join('<br>'):'';
 if(player)renderPlayer();
 if(host){
  $('#game-log').textContent=s.log;$('#host-solution').textContent=s.question?`Đáp án riêng MC: ${s.question.solution||'(chưa nhập)'}`:'';try{localStorage.setItem(`olympia-live-backup-${room}`,JSON.stringify(s));}catch{}$('#start').disabled=s.phase!=='ready';$('#stop').disabled=s.phase!=='open';$('#waiting').disabled=s.phase==='open';$('#set-round').disabled=s.phase==='open';$('#publish-question').disabled=s.phase==='open';
  $('#show-answers').disabled=s.phase==='open';$('#show-solution').disabled=s.phase==='open';$('#show-answers').textContent=s.showAnswers?'Ẩn đáp án các đội':'Công bố đáp án các đội';$('#show-solution').textContent=s.showSolution?'Ẩn đáp án chuẩn':'Hiện đáp án chuẩn';
  $('#open-tile').disabled=s.round!=='Vượt chướng ngại vật'||s.selectedClue===null;$('#close-tile').disabled=$('#open-tile').disabled;
  if(!$('#score-editor').children.length){$('#score-editor').innerHTML=s.teams.map((t,i)=>`<div class="score-edit"><input id="name-${i}" value="${esc(t.name)}" aria-label="Tên đội ${i+1}"><input id="score-${i}" type="number" value="${t.score}" aria-label="Điểm đội ${i+1}"><button data-save-score="${i}">Lưu</button></div>`).join('');document.querySelectorAll('[data-save-score]').forEach(b=>b.onclick=()=>{const i=+b.dataset.saveScore;send({type:'name',player:i,name:$(`#name-${i}`).value});send({type:'score',player:i,score:Number($(`#score-${i}`).value)});});}
  for(let i=0;i<3;i++){for(const key of ['name','score']){const field=$(`#${key}-${i}`);if(field&&document.activeElement!==field)field.value=s.teams[i][key];}}
  if(!links){try{links=JSON.parse(sessionStorage.getItem(`olympia-links-${room}`));}catch{}}
  if(links&&!$('#links').children.length){$('#links').innerHTML=Object.entries(links).map(([r,t])=>`<label class="share-link">${roles[r]}<input readonly data-link="${r}" value="${esc(location.origin+'/#'+new URLSearchParams({room,token:t}))}"><button data-copy="${r}">Sao chép liên kết</button></label>`).join('');document.querySelectorAll('[data-copy]').forEach(b=>b.onclick=async()=>{const input=document.querySelector(`[data-link="${b.dataset.copy}"]`);try{await navigator.clipboard.writeText(input.value);b.textContent='Đã sao chép';}catch{input.select();b.textContent='Nhấn Ctrl/Cmd+C để sao chép';}});}
 }
 updateClock();
}
function renderPlayer(){
 const s=state,i=+s.role[1],a=s.answers[i],winner=s.buzzes[0]?.player,canAnswer=s.question?.type!=='buzz'||winner===i;
 const mode=`${s.questionId}:${s.question?.type}:${canAnswer}:${!!a}:${!!s.question}`;
 if(mode!==lastResponseMode){lastResponseMode=mode;const q=s.question;
  $('#response').innerHTML=!q?'<p>Chờ MC mở câu hỏi.</p>':a?'<p>✓ Máy chủ đã nhận đáp án. Không thể thay đổi.</p>':q.type==='buzz'&&!canAnswer?'<button id="buzz" class="buzz-button">BẤM CHUÔNG</button>':`${q.type==='choice'?`<div class="choices">${q.choices.map(c=>`<label><input type="radio" name="choice" value="${esc(c)}"> ${esc(c)}</label>`).join('')}</div>`:'<textarea id="answer-text" maxlength="1000" placeholder="Nhập đáp án của bạn…" aria-label="Đáp án"></textarea>'}<button id="send-answer" class="primary">Gửi đáp án cuối cùng</button>`;
  $('#buzz')?.addEventListener('click',()=>send({type:'buzz',questionId:state.questionId}));
  $('#send-answer')?.addEventListener('click',()=>{const text=$('#answer-text')?.value||document.querySelector('input[name="choice"]:checked')?.value||'';if(!text.trim()){error('Hãy điền hoặc chọn đáp án.');return;}send({type:'answer',questionId:state.questionId,text});});
 }
 const active=s.phase==='open'&&socket?.readyState===WebSocket.OPEN;
 $('#response').querySelectorAll('button,input,textarea').forEach(el=>el.disabled=!active);
 if($('#buzz')&&s.buzzes.some(b=>b.player===i)){$('#buzz').disabled=true;$('#buzz').textContent=`Đã ghi nhận chuông thứ ${s.buzzes.find(b=>b.player===i).rank}`;}
 $('#receipt').textContent=a?'Đáp án đã được lưu trên máy chủ.':!active?'Chờ MC bắt đầu hoặc câu hỏi đã kết thúc.':s.question?.type==='buzz'&&winner!==undefined?`Đội giành quyền: ${s.teams[winner].name}`:'Đang nhận đáp án. Chỉ đáp án gửi đầu tiên được ghi nhận.';
}
function updateClock(){if(!state)return;const left=state.phase==='open'?Math.max(0,Math.ceil((state.deadline-Date.now()-clockOffset)/1000)):state.phase==='ready'?state.duration:0;$('#clock-text').textContent=state.question?`${String(left).padStart(2,'0')} GIÂY`:'—';if(state.phase==='open'&&left===0)$('#response').querySelectorAll('button,input,textarea').forEach(el=>el.disabled=true);}
setInterval(updateClock,100);setInterval(()=>{if(socket?.readyState===WebSocket.OPEN)socket.send(JSON.stringify({type:'sync'}));},5000);
$('#start').onclick=()=>send({type:'start'});$('#stop').onclick=()=>send({type:'close'});$('#waiting').onclick=()=>send({type:'waiting'});$('#set-round').onclick=()=>send({type:'round',round:$('#round').value});$('#show-answers').onclick=()=>send({type:'revealAnswers',show:!state.showAnswers});$('#show-solution').onclick=()=>send({type:'revealSolution',show:!state.showSolution});$('#open-tile').onclick=()=>send({type:'tile',open:true});$('#close-tile').onclick=()=>send({type:'tile',open:false});$('#set-image').onclick=()=>send({type:'image',url:$('#obstacle-image').value});
function draft(){return {text:$('#question-input').value,solution:$('#solution-input').value,type:$('#type').value,choices:$('#choices').value.split('\n').filter(Boolean),media:$('#media-url').value,mediaType:$('#media-type').value};}
$('#publish-question').onclick=()=>send({type:'question',question:draft(),round:$('#round').value,clue:Number($('#clue').value),duration:Number($('#duration').value)});
$('#round').onchange=()=>{$('#clue-label').hidden=$('#round').value!=='Vượt chướng ngại vật';};$('#round').onchange();
$('#bank-file').onchange=async e=>{try{const bank=JSON.parse(await e.target.files[0].text());bankItems=[];for(const [key,round] of [['warm','Khởi động'],['speed','Tăng tốc'],['finish','Về đích'],['tie','Câu hỏi phụ']])for(const q of bank[key]||[])bankItems.push({...q,round});if(bank.obstacle){for(const [i,q]of [...(bank.obstacle.clues||[]),bank.obstacle.center].entries())if(q)bankItems.push({...q,round:'Vượt chướng ngại vật',clue:i});if(bank.obstacle.image)$('#obstacle-image').value=bank.obstacle.image.startsWith('assets/')?'/'+bank.obstacle.image:bank.obstacle.image;}if(!bankItems.length)throw Error('Không tìm thấy câu hỏi trong tệp.');$('#bank-question').innerHTML=bankItems.map((q,i)=>`<option value="${i}">${esc(q.round)} · ${esc(q.text?.slice(0,70))}</option>`).join('');}catch(e){error(e.message);}};
$('#load-question').onclick=()=>{const q=bankItems[+$('#bank-question').value];if(!q)return;$('#round').value=q.round;$('#round').onchange();$('#clue').value=q.clue??0;$('#question-input').value=q.text||'';$('#solution-input').value=q.answer||q.solution||'';$('#type').value=['text','choice','buzz'].includes(q.type)?q.type:'text';$('#choices').value=(q.choices||[]).join('\n');$('#media-url').value=q.media||'';$('#media-type').value=q.mediaType||'image';};
$('#download-question').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(draft(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='olympia-question.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
if(room&&secret)connect();

function downloadJSON(data,name){const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#download-match').onclick=()=>downloadJSON(state,`olympia-${room}-backup.json`);
$('#restore-match').onchange=async e=>{try{send({type:'restore',backup:JSON.parse(await e.target.files[0].text())});}catch(e){error(e.message);}};

try{
 const backups=Object.keys(localStorage).filter(key=>key.startsWith('olympia-live-backup-'));
 $('#backup-list').innerHTML=backups.length?backups.map((key,i)=>`<button data-backup="${i}">Tải bản sao phòng ${esc(key.slice('olympia-live-backup-'.length))}</button>`).join(''):'<p>Chưa có bản sao trên thiết bị này.</p>';
 document.querySelectorAll('[data-backup]').forEach(b=>b.onclick=()=>{const key=backups[+b.dataset.backup];downloadJSON(JSON.parse(localStorage.getItem(key)),key+'.json');});
}catch{}
