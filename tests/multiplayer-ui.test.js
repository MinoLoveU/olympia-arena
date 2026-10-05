import test from 'node:test';import assert from 'node:assert/strict';import {JSDOM} from 'jsdom';import {readFileSync} from 'node:fs';import {WebSocket} from 'ws';import {once} from 'node:events';import {createGameServer} from '../server.js';
const wait=async(fn)=>{const end=Date.now()+3500;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw Error('UI sync timeout');};
test('Five rendered clients: MC publishes, players type/choose, projection reveals, score stays manual',async()=>{
 const {server,wss}=createGameServer();server.listen(0,'127.0.0.1');await once(server,'listening');const base=`http://127.0.0.1:${server.address().port}`;const room=await(await fetch(base+'/api/rooms',{method:'POST'})).json();const doms=[],sockets=[];
 try{
 for(const role of ['host','display','p0','p1','p2']){const dom=new JSDOM(readFileSync(new URL('../multiplayer/index.html',import.meta.url),'utf8'),{url:base+'/#'+new URLSearchParams({room:room.id,token:room.tokens[role]}),runScripts:'outside-only',pretendToBeVisual:true});doms.push(dom);dom.window.WebSocket=class extends WebSocket{constructor(...args){super(...args);sockets.push(this);}};dom.window.eval(readFileSync(new URL('../multiplayer/client.js',import.meta.url),'utf8'));}
 const [host,display,p0,p1,p2]=doms.map(d=>d.window.document);await wait(()=>doms.every(d=>d.window.document.querySelector('#connection').className==='online'));
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
 }finally{for(const s of sockets){s.onclose=null;s.terminate();}for(const d of doms)d.window.close();wss.close();await new Promise(r=>server.close(r));}
});
