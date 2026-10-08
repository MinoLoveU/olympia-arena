import {hashPassword} from '../multiplayer/access.js';
import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from '../server.js';
const wait=async(fn)=>{const end=Date.now()+3500;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw Error('UI sync timeout');};
test('Five clients: oral judging adjusts warm-up scores; later rounds keep manual scoring',async()=>{
 const {server,wss}=createGameServer({accessHash:hashPassword('test-only-password')});server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;const room=await(await fetch(base+'/api/rooms',{method:'POST',headers:{'X-Olympia-Password':'test-only-password'}})).json();const doms=[],sockets=[];
 try{
 for(const role of ['host','display','p0','p1','p2']){const dom=new JSDOM(readFileSync(new URL('../multiplayer/index.html',import.meta.url),'utf8'),{url:base+'/#'+new URLSearchParams({room:room.id,token:room.tokens[role]}),runScripts:'outside-only',pretendToBeVisual:true});doms.push(dom);dom.window.WebSocket=class extends WebSocket{constructor(...args){super(...args);sockets.push(this);}};dom.window.eval(readFileSync(new URL('../multiplayer/client.js',import.meta.url),'utf8'));}
 const [host,display,p0,p1,p2]=doms.map(d=>d.window.document);
 for(const dom of doms.slice(0,2)){
  const d=dom.window.document;await wait(()=>!d.querySelector('#access-gate').hidden);
  assert.equal(d.querySelector('#game').hidden,true);
  assert.equal(d.querySelector('#scoreboard').children.length,0);
  d.querySelector('#access-password').value='test-only-password';
  d.querySelector('#access-form').dispatchEvent(new dom.window.Event('submit',{cancelable:true}));
 }
 await wait(()=>doms.every(d=>d.window.document.querySelector('#connection').className==='online'));
 // Projection follows window resizes even without the Fullscreen API.
 const projection=doms[1].window;
 for(const height of [900,360,768]){
  Object.defineProperty(projection,'innerHeight',{configurable:true,value:height});
  projection.dispatchEvent(new projection.Event('resize'));
  await wait(()=>display.body.style.getPropertyValue('--screen-height')===height+'px');
  assert.equal(display.body.style.getPropertyValue('--u'),height/100+'px');
 }
 assert.equal(host.body.style.getPropertyValue('--screen-height'),'');
 let entered=0,exited=0;
 display.documentElement.webkitRequestFullscreen=()=>{entered++;};
 display.querySelector('#fullscreen').click();await wait(()=>entered===1);
 Object.defineProperty(display,'webkitFullscreenElement',{configurable:true,value:display.documentElement});
 display.webkitExitFullscreen=()=>{exited++;};
 display.dispatchEvent(new projection.Event('webkitfullscreenchange'));
 assert.match(display.querySelector('#fullscreen').textContent,/Thoát/);
 display.querySelector('#fullscreen').click();await wait(()=>exited===1);
 Object.defineProperty(display,'webkitFullscreenElement',{configurable:true,value:null});
 // Warm-up is oral: private questions have no inputs, common questions only buzz.
 assert.ok([...host.querySelectorAll('.host-extra')].every(el=>!el.open));
 host.querySelector('#preset-question').value='warm-1';host.querySelector('#publish-question').click();
 await wait(()=>p0.querySelector('#response').textContent.includes('Khởi động riêng'));
 for(const d of [p0,p1,p2])assert.equal(d.querySelector('#response input,#response textarea,#response button'),null);
 host.querySelector('#start').click();await wait(()=>!host.querySelector('#stop').disabled);
 host.querySelector('#stop').click();await wait(()=>!host.querySelector('#publish-question').disabled);
 host.querySelector('[data-judge="correct"][data-player="0"]').click();
 await wait(()=>[host,display,p0,p1,p2].every(d=>d.querySelector('#scoreboard strong').textContent==='10'));
 assert.match(display.querySelector('#answer-cards').textContent,/✓ Đúng/);
 host.querySelector('[data-judge="wrong"][data-player="0"]').click();await wait(()=>display.querySelector('#scoreboard strong').textContent==='0');
 host.querySelector('[data-judge="clear"][data-player="0"]').click();await wait(()=>!display.querySelector('.judgement-badge'));
 host.querySelector('#preset-question').value='common-1';host.querySelector('#publish-question').click();
 await wait(()=>[p0,p1,p2].every(d=>d.querySelector('#buzz')?.disabled));
 host.querySelector('#start').click();await wait(()=>!p1.querySelector('#buzz').disabled);
 p1.querySelector('#buzz').click();await wait(()=>p1.querySelector('#receipt').textContent.includes('Bạn giành quyền'));
 p0.querySelector('#buzz').click();await wait(()=>p0.querySelector('#buzz').textContent.includes('thứ 2'));
 for(const d of [p0,p1,p2])assert.equal(d.querySelector('#answer-text,#send-answer,input[name="choice"]'),null);
 assert.equal(p1.querySelector('#buzz').disabled,true);
 assert.match(display.querySelectorAll('#answer-cards p')[1].textContent,/Giành quyền/);
 assert.equal(host.querySelector('#show-answers').hidden,true);
 assert.equal(host.querySelector('#scoreboard strong').textContent,'0');
 host.querySelector('#stop').click();await wait(()=>!host.querySelector('#publish-question').disabled);
 assert.equal(host.querySelector('[data-judge="correct"][data-player="0"]').disabled,true);
 host.querySelector('[data-judge="no-answer"][data-player="1"]').click();await wait(()=>display.querySelectorAll('#scoreboard strong')[1].textContent==='-5');
 host.querySelector('[data-judge="correct"][data-player="1"]').click();await wait(()=>p2.querySelectorAll('#scoreboard strong')[1].textContent==='10');
 host.querySelector('[data-judge="clear"][data-player="1"]').click();await wait(()=>display.querySelectorAll('#scoreboard strong')[1].textContent==='0');
 host.querySelector('#preset-question').value='common-2';host.querySelector('#publish-question').click();
 await wait(()=>p1.querySelector('#buzz').textContent==='BẤM CHUÔNG');
 assert.equal(p1.querySelector('#buzz').disabled,true);
 assert.ok(!display.querySelector('#buzz-results').textContent);
 assert.equal(host.querySelector('#question-input'),null);assert.equal(host.querySelector('#bank-file'),null);host.querySelector('#round').value='Tăng tốc';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));host.querySelector('#preset-question').value='speed-3';host.querySelector('#publish-question').click();await wait(()=>[display,p0,p1,p2].every(d=>d.querySelector('#question-title').textContent.includes('Có 3 hộp')));
 assert.equal(p0.querySelector('#answer-text').disabled,true);host.querySelector('#start').click();await wait(()=>!p0.querySelector('#answer-text').disabled);
 p1.querySelector('#answer-text').value='Đang soạn';p0.querySelector('#answer-text').value='Đáp án đội 1';p0.querySelector('#send-answer').click();await wait(()=>display.querySelector('#answer-cards').textContent.includes('Đã gửi đáp án'));assert.equal(p1.querySelector('#answer-text').value,'Đang soạn');assert.ok(!display.querySelector('#answer-cards').textContent.includes('Đáp án đội 1'));
 host.querySelector('#stop').click();await wait(()=>!host.querySelector('#show-answers').disabled);host.querySelector('#show-answers').click();await wait(()=>display.querySelector('#answer-cards').textContent.includes('Đáp án đội 1'));assert.ok(!display.querySelector('#solution').textContent.includes('30 viên bi'));
 host.querySelector('#score-0').value='45';host.querySelector('[data-save-score="0"]').click();await wait(()=>p2.querySelector('#scoreboard strong').textContent==='45');
 host.querySelector('#preset-question').value='speed-2';host.querySelector('#publish-question').click();await wait(()=>p0.querySelectorAll('input[name="choice"]').length===4);host.querySelector('#start').click();await wait(()=>!p0.querySelector('input[name="choice"]').disabled);p0.querySelectorAll('input[name="choice"]')[1].checked=true;p0.querySelector('#send-answer').click();await wait(()=>host.querySelector('#answer-cards p').textContent==='⅔ → ½ → 0,75 → 0,8');assert.equal(host.querySelector('#scoreboard strong').textContent,'45');
 host.querySelector('#stop').click();await wait(()=>!host.querySelector('#publish-question').disabled);
 host.querySelector('#round').value='Vượt chướng ngại vật';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));
 host.querySelector('#set-round').click();await wait(()=>display.querySelectorAll('.picture-cover').length===9);
 assert.equal(host.querySelector('option[value="obstacle-center"]').disabled,true);
 const cells=[...display.querySelectorAll('.picture-cover')];
 assert.equal(new Set(cells.map(el=>el.style.getPropertyValue('--column')+','+el.style.getPropertyValue('--row'))).size,9);
 assert.equal(display.querySelector('.cover-8').style.getPropertyValue('--column'),'1');
 assert.equal(display.querySelector('.cover-8').style.getPropertyValue('--row'),'1');
 host.querySelector('#preset-question').value='obstacle-8';host.querySelector('#publish-question').click();
 await wait(()=>!host.querySelector('#open-tile').disabled);
 host.querySelector('#open-tile').click();await wait(()=>[display,p0,p1,p2].every(d=>d.querySelector('.cover-7').hidden));
 assert.equal(display.querySelectorAll('.picture-cover[hidden]').length,1);assert.equal(display.querySelector('.cover-8').hidden,false);
 host.querySelector('#waiting').click();await wait(()=>display.querySelector('#question-title').textContent==='Mời đội chơi chọn câu hỏi');
 assert.equal(display.querySelector('.cover-7').hidden,true);
 // Pause between scenarios to stay below the production 30-message/second limit.
 await new Promise(r=>setTimeout(r,1100));
 // Equal outer squares and a centered, larger overlay overlapping all eight.
 const rects=[...display.querySelectorAll('.picture-cover')].map(el=>Object.fromEntries(['x','y','w','h'].map(k=>[k,parseFloat(el.style.getPropertyValue('--tile-'+k))])));
 const outer=rects.slice(0,8),center=rects[8];
 assert.ok(outer.every(r=>r.w===outer[0].w&&r.h===outer[0].h&&r.w===r.h));
 assert.equal(center.w,38);assert.equal(center.h,38);
 assert.equal(center.x+center.w/2,50);assert.equal(center.y+center.h/2,50);
 const overlaps=(a,b)=>a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h;
 assert.ok(outer.every(r=>r.w<center.w&&overlaps(r,center)));
 // Every point of the image remains masked initially, even around the center edges.
 for(let x=.5;x<100;x++)for(let y=.5;y<100;y++)assert.ok(rects.some(r=>x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h));
 const css=readFileSync(new URL('../multiplayer/style.css',import.meta.url),'utf8');
 assert.match(css,/\.tiles \.cover-8\{z-index:2/);
 assert.equal(host.querySelectorAll('#obstacle-set option').length,8);
 host.querySelector('#obstacle-set').value='2';host.querySelector('#select-obstacle-set').click();
 await wait(()=>display.querySelector('#round-name').textContent.includes('Bộ 2'));
 assert.equal(display.querySelector('#picture img').getAttribute('src'),'/assets/obstacle-2.svg');
 assert.equal(display.querySelectorAll('.picture-cover[hidden]').length,0);
 assert.equal(host.querySelectorAll('#preset-question option').length,10);
 assert.equal(host.querySelector('option[value="obstacle-2-center"]').disabled,true);
 host.querySelector('#preset-question').value='obstacle-2-1';host.querySelector('#publish-question').click();await wait(()=>!host.querySelector('#open-tile').disabled);
 host.querySelector('#open-tile').click();await wait(()=>display.querySelector('.cover-0').hidden);
 host.querySelector('#obstacle-set').value='1';host.querySelector('#select-obstacle-set').click();await wait(()=>display.querySelector('#round-name').textContent.includes('Bộ 1')).catch(e=>{throw Error(host.querySelector('#error').textContent||e.message);});
 assert.equal(display.querySelector('.cover-7').hidden,true);assert.equal(display.querySelector('.cover-0').hidden,false);
 host.querySelector('#round').value='Về đích';host.querySelector('#round').dispatchEvent(new doms[0].window.Event('change'));assert.equal(host.querySelectorAll('#preset-question option').length,60);
 host.querySelector('#preset-question').value='finish-60';host.querySelector('#publish-question').click();await wait(()=>p2.querySelector('#question-title').textContent.includes('chia cho 5 được thương 7'));assert.ok(p2.querySelector('#answer-text'));
 assert.equal(p2.querySelector('#clock-text').textContent,'15 GIÂY');
 }finally{for(const s of sockets){s.onclose=null;s.terminate();}for(const d of doms)d.window.close();wss.close();await new Promise(r=>server.close(r));}
});
