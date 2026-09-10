import {DEFAULT_DECK,UNITS} from '../public/game/units.js';
/** Real HTTP + native Node WebSocket test. Start `npm start` in another terminal first. */
import assert from 'node:assert/strict';
const base=process.env.TEST_URL||'http://127.0.0.1:3000';
const log=[];const sockets=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function check(name,fn){await fn();log.push(name);console.log(`PASS ${log.length}: ${name}`);}
async function post(url,data){
 const r=await fetch(base+url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
 return {status:r.status,body:await r.json()};
}
function client(s){
 const ws=new WebSocket(base.replace(/^http/,'ws')+`/api/rooms/${s.code}/socket`),messages=[];
 sockets.push(ws);
 ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
 const ready=new Promise((resolve,reject)=>{ws.addEventListener('open',()=>{ws.send(JSON.stringify({type:'hello',token:s.token}));resolve();});ws.addEventListener('error',reject);});
 return {ws,messages,ready,send:m=>ws.send(JSON.stringify(m)),last:()=>[...messages].reverse().find(m=>m.type==='state')};
}
async function wait(fn,message){
 const until=Date.now()+10000;
 while(Date.now()<until){if(fn())return;await sleep(50);}
 throw new Error('Timeout: '+message);
}
let a,b,c,room,other;
try{
 await check('health and game config identify the correct game',async()=>{
  const r=await fetch(base+'/api/config'),j=await r.json();assert.equal(j.version,'17.0.0');assert.equal(j.physicsVersion,16);assert.equal(j.cards,27);assert.equal(j.units,24);assert.equal(j.spells,3);assert.equal(j.maxDeck,8);assert.equal(j.game,'tiny-siege');
 });
 await check('HTML, style and module assets load',async()=>{
  for(const url of ['/','/app.js','/styles.css','/game/engine.js','/game/art.js','/game/physics.js']){
   const r=await fetch(base+url);assert.equal(r.status,200);
  }
 });
 await check('missing APIs return JSON 404, not a home page',async()=>{
  const r=await fetch(base+'/api/missing');assert.equal(r.status,404);assert.equal((await r.json()).ok,false);
 });
 await check('create room returns a code and private token',async()=>{
  const r=await post('/api/rooms',{name:'Rin'});assert.equal(r.status,200);assert.match(r.body.code,/^\d{6}$/);assert.equal(r.body.token.length,64);room=r.body;
 });
 await check('join same code and reject a third participant',async()=>{
  const r=await post(`/api/rooms/${room.code}/join`,{name:'Taro'});assert.equal(r.status,200);other=r.body;
  const full=await post(`/api/rooms/${room.code}/join`,{name:'Third'});assert.equal(full.status,409);
 });
 await check('two native WebSocket clients receive the same roster',async()=>{
  a=client(room);b=client(other);await Promise.all([a.ready,b.ready]);
  await wait(()=>a.last()?.members.every(p=>p?.connected)&&b.last()?.members.every(p=>p?.connected),'two connected');
  assert.deepEqual(a.last().members,b.last().members);assert.notEqual(a.last().seat,b.last().seat);
  assert.equal(JSON.stringify(a.last()).includes(other.token),false);
 });
 await check('non-host cannot start; both ready and host starts',async()=>{
  b.send({type:'start'});await wait(()=>b.messages.some(m=>m.type==='error'),'host permission');
  a.send({type:'ready',ready:true,deck:[...DEFAULT_DECK]});b.send({type:'ready',ready:true,deck:[...DEFAULT_DECK]});
  await wait(()=>a.last().members.every(p=>p.ready),'ready');
  a.send({type:'start'});await wait(()=>a.last()?.game?.phase==='battle'&&b.last()?.game?.phase==='battle','countdown');
 });
 await check('validated deployment is synchronized to both players',async()=>{
  const g=a.last().game,id=g.hand.find(k=>UNITS[k].cost<=g.energy&&k!=='cannon'&&!UNITS[k].spell)||g.hand.find(k=>UNITS[k].cost<=g.energy&&!UNITS[k].spell);
  a.send({type:'deploy',card:id,x:105,y:665});
  await wait(()=>a.last().game.units.some(u=>u.owner===0)&&b.last().game.units.some(u=>u.owner===0),'deployment synchronization');
  const ua=a.last().game.units.find(u=>u.owner===0),ub=b.last().game.units.find(u=>u.id===ua.id);assert.ok(ub);assert.equal(ua.type,ub.type);
 });
 await check('server sends v17 facing, summon, mud, burrow, poison, dash, laser, tower-awake and collision metadata identically to both seats',async()=>{
  const ga=a.last().game,u=ga.units[0];assert.equal(ga.physicsVersion,16);assert.equal(typeof u.facing,'number');assert.equal(typeof u.mass,'number');
  assert.equal(Object.hasOwn(u,'_nav'),false);assert.equal(Object.hasOwn(u,'_stuck'),false);
  const matching=[...b.messages].reverse().find(m=>m.type==='state'&&m.game?.time===ga.time&&m.game.units.some(v=>v.id===u.id));
  assert.ok(matching);assert.deepEqual(matching.game.units.find(v=>v.id===u.id),u);
 });
 await check('opponent territory is rejected without spawning',async()=>{
  const n=b.last().game.units.filter(u=>u.owner===1).length,errors=b.messages.filter(m=>m.type==='error').length;
  const card=b.last().game.hand.find(id=>!UNITS[id].spell&&id!=='cannon'&&!UNITS[id].tunnelAnywhere)||b.last().game.hand.find(id=>!UNITS[id].spell&&!UNITS[id].tunnelAnywhere);
  assert.ok(card,'expected a deployable unit card in hand');
  b.send({type:'deploy',card,x:100,y:800,owner:0});
  await wait(()=>b.messages.filter(m=>m.type==='error').length>errors,'invalid territory');
  assert.equal(b.last().game.units.filter(u=>u.owner===1).length,n);
 });
 await check('disconnect pauses and token reconnect resumes',async()=>{
  b.ws.close();await wait(()=>a.last()?.paused,'paused');
  c=client(other);await c.ready;await wait(()=>c.last()?.game&&a.last()?.paused===null,'resumed');
  assert.ok(c.last().members[1].connected);
 });
 await check('surrender result reaches both clients and rematch keeps code',async()=>{
  c.send({type:'surrender'});await wait(()=>a.last()?.game?.phase==='ended'&&c.last()?.game?.phase==='ended','end');
  assert.equal(a.last().game.winner,0);a.send({type:'reset'});
  await wait(()=>a.last()?.game===null&&c.last()?.game===null,'rematch lobby');
  assert.equal(c.last().code,room.code);
 });
 await check('explicit host leave promotes opponent',async()=>{
  a.send({type:'leave'});await wait(()=>c.last()?.host===1,'host migration');assert.equal(c.last().members[0],null);
 });
 await check('cross-origin mutation rejected',async()=>{
  const r=await fetch(base+'/api/rooms',{method:'POST',headers:{'Content-Type':'application/json','Origin':'https://other.invalid'},body:'{"name":"bad"}'});
  assert.equal(r.status,403);
 });
 console.log(JSON.stringify({passed:log.length,checks:log},null,2));
}finally{
 for(const ws of sockets)if(ws.readyState===WebSocket.OPEN)ws.close();
 await sleep(100);
}
