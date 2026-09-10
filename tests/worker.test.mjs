/** Adapter tests use a small Durable Objects API substitute; not a workerd runtime test. */
import {test} from 'node:test';
import assert from 'node:assert/strict';
import worker,{BattleRoom} from '../src/worker.js';
function ctx(){
 const store=new Map(),sockets=[],wait=[];
 return {
 store,sockets,wait,storage:{
  get:async k=>store.get(k),put:async(k,v)=>store.set(k,structuredClone(v)),
  deleteAll:async()=>store.clear(),deleteAlarm:async()=>{},setAlarm:async t=>store.set('alarm',t)
 },
 blockConcurrencyWhile:fn=>fn(),waitUntil:p=>wait.push(p),getWebSockets:()=>sockets,acceptWebSocket:ws=>sockets.push(ws)
 };
}
function env(){
 const rooms=new Map();
 return {rooms,BATTLES:{idFromName:n=>n,get:n=>{
   if(!rooms.has(n)){const c=ctx(),d=new BattleRoom(c,{});rooms.set(n,{c,d});}
   return rooms.get(n).d;
 }},ASSETS:{fetch:async()=>new Response('asset')}};
}
function req(url,method='GET',data=null,origin='https://test.invalid'){
 return new Request('https://test.invalid'+url,{method,headers:{'Content-Type':'application/json','Origin':origin},body:data?JSON.stringify(data):undefined});
}
test('worker health and config identify twenty-one units plus three spells custom-deck game',async()=>{
 const r=await worker.fetch(req('/api/config'),env());const b=await r.json();assert.equal(b.version,'17.0.0');assert.equal(b.cards,27);assert.equal(b.units,24);assert.equal(b.spells,3);assert.equal(b.physicsVersion,16);assert.equal(b.maxDeck,8);assert.equal(b.game,'tiny-siege');
});
test('worker static assets use ASSETS binding',async()=>{
 const r=await worker.fetch(req('/'),env());assert.equal(await r.text(),'asset');
});
test('worker origin guard and API 404',async()=>{
 const e=env();assert.equal((await worker.fetch(req('/api/rooms','POST',{name:'Rin'},'https://evil.invalid'),e)).status,403);
 assert.equal((await worker.fetch(req('/api/no'),e)).status,404);
});
test('worker entry and creation rate limits',async()=>{
 const e=env();e.ENTRY_LIMITER={limit:async()=>({success:false})};assert.equal((await worker.fetch(req('/api/rooms','POST',{name:'Rin'}),e)).status,429);
 delete e.ENTRY_LIMITER;e.CREATE_LIMITER={limit:async()=>({success:false})};assert.equal((await worker.fetch(req('/api/rooms','POST',{name:'Rin'}),e)).status,429);
});
test('worker creates room, persists it and joins through DO fetch adapter',async()=>{
 const e=env(),r=await worker.fetch(req('/api/rooms','POST',{name:'Rin'}),e),b=await r.json();
 assert.equal(r.status,200);assert.match(b.code,/^\d{6}$/);
 const found=e.rooms.get(b.code);assert.equal(found.c.store.get('room').code,b.code);assert.ok(found.c.store.get('alarm'));
 const j=await worker.fetch(req(`/api/rooms/${b.code}/join`,'POST',{name:'Taro'}),e);assert.equal(j.status,200);assert.equal((await j.json()).seat,1);
});
test('unknown DO room returns not-found rather than creating a new game',async()=>{
 const r=await worker.fetch(req('/api/rooms/111111/join','POST',{name:'Rin'}),env());assert.equal(r.status,404);
});
test('large request is rejected before parsing',async()=>{
 const r=await worker.fetch(req('/api/rooms','POST',{name:'a'.repeat(5000)}),env());assert.equal(r.status,400);
});
test('DO storage restoration interrupts active games instead of rewinding',async()=>{
 const e=env(),r=await worker.fetch(req('/api/rooms','POST',{name:'Rin'}),e),b=await r.json(),o=e.rooms.get(b.code);
 const data=o.c.store.get('room');data.game={phase:'battle',time:42};o.c.store.set('room',data);
 const restarted=new BattleRoom(o.c,{});await restarted.ready;
 assert.equal(restarted.model.data.game.phase,'ended');assert.equal(restarted.model.data.game.winner,null);
});
test('DO alarm deletes stored room and makes it unavailable',async()=>{
 const e=env(),r=await worker.fetch(req('/api/rooms','POST',{name:'Rin'}),e),b=await r.json(),o=e.rooms.get(b.code);
 await o.d.alarm();assert.equal(o.d.model,null);assert.equal(o.c.store.size,0);
});
test('DO WebSocket handshake and first-frame authentication',async()=>{
 const originalResponse=globalThis.Response,originalPair=globalThis.WebSocketPair;
 class FakeSocket{
  constructor(){this.sent=[];this.attachment=null;this.closed=false;}
  send(s){this.sent.push(JSON.parse(s));}close(){this.closed=true;}
  serializeAttachment(v){this.attachment=v;}deserializeAttachment(){return this.attachment;}
 }
 globalThis.WebSocketPair=class{constructor(){this[0]=new FakeSocket();this[1]=new FakeSocket();}};
 globalThis.Response=class extends originalResponse{
  constructor(b,i={}){if(i.status===101)return {status:101,webSocket:i.webSocket};super(b,i);}
 };
 let d;
 try{
  const e=env(),r=await worker.fetch(req('/api/rooms','POST',{name:'Rin'}),e),b=await r.json();d=e.rooms.get(b.code).d;
  const res=await worker.fetch(new Request(`https://test.invalid/api/rooms/${b.code}/socket`,{headers:{Upgrade:'websocket',Origin:'https://test.invalid'}}),e);
  assert.equal(res.status,101);
  const ws=e.rooms.get(b.code).c.sockets[0];assert.equal(ws.sent.length,0);
  await d.webSocketMessage(ws,JSON.stringify({type:'hello',token:b.token}));
  assert.equal(ws.deserializeAttachment().seat,0);assert.ok(ws.sent.some(m=>m.type==='welcome'));assert.ok(ws.sent.some(m=>m.type==='state'));
  await d.webSocketClose(ws);assert.equal(d.model.data.players[0].connected,false);
 }finally{
  if(d){for(const t of d.pending.values())clearTimeout(t);if(d.timer)clearInterval(d.timer);}
  globalThis.Response=originalResponse;globalThis.WebSocketPair=originalPair;
 }
});
