// Map the first source import to the reordered 14 October source.
const mapping={"1":{"id":"1","clues":[0,1,2,8,3,4,5,6,7]},"2":{"id":"3","clues":[0,8,1,2,3,4,5,6,7]},"3":{"id":"5","clues":[0,1,2,3,8,4,5,6,7]},"4":{"id":"7","clues":[8,0,1,2,3,4,5,6,7]},"5":{"id":"2","clues":[0,8,1,2,3,4,5,6,7]},"6":{"id":"4","clues":[0,1,8,2,3,4,5,6,7]},"7":{"id":"6","clues":[8,0,1,2,3,4,5,6,7]},"8":{"id":"8","clues":[0,1,2,3,4,5,6,7,8]}};
const oldImage=url=>/^\/assets\/obstacle-source-\d+(?:-pending)?\.(?:png|jpg|svg)$/.test(url||'');
export function migrateObstacleBackup(b,sets){
 if(!b||b.obstacleBankVersion===2||!oldImage(b.image)&&!Object.values(b.obstacleProgress||{}).some(p=>oldImage(p?.image)))return b;
 const image=(url,id)=>oldImage(url)?sets.find(s=>s.id===id)?.image:url;
 const indexes=(a,m)=>Array.isArray(a)?a.map(i=>m.clues[i]??i):a;
 const current=mapping[b.obstacleSet||'1'];if(!current)return b;
 const progress=Object.fromEntries(Object.entries(b.obstacleProgress||{}).map(([id,p])=>{const m=mapping[id];return m&&p?[m.id,{...p,opened:indexes(p.opened,m),usedClues:indexes(p.usedClues,m),image:image(p.image,m.id)}]:[id,p];}));
 const used=Array.isArray(b.usedQuestions)?b.usedQuestions.map(id=>{const match=/^obstacle-(?:([2-8])-)?(center|answer|[1-8])$/.exec(id);if(!match)return id;const m=mapping[match[1]||'1'],clue=match[2]==='answer'?'answer':m.clues[match[2]==='center'?8:Number(match[2])-1];return 'obstacle-'+(m.id==='1'?'':m.id+'-')+(clue==='answer'?'answer':clue===8?'center':clue+1);}):b.usedQuestions;
 return {...b,obstacleBankVersion:2,obstacleSet:current.id,opened:indexes(b.opened,current),usedClues:indexes(b.usedClues,current),image:image(b.image,current.id),obstacleProgress:progress,usedQuestions:used};
}
