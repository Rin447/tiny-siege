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
test('worker health and config identify sixty-five units/buildings plus eight spells custom-deck game',async()=>{
 const r=await worker.fetch(req('/api/config'),env());const b=await r.json();assert.equal(b.version,'38.0.0');assert.equal(b.cards,73);assert.equal(b.units,65);assert.equal(b.spells,8);assert.equal(b.physicsVersion,72);assert.equal(b.maxDeck,8);assert.equal(b.game,'tiny-siege');for(const feature of ['shield-front-absorb','wind-knockback','phoenix-egg-revive','royal-ghost-stealth-splash','cyclone-field-pull','sky-bomber-all-targets','scrap-drill-ramping','bomb-carrier-suicide','iron-eye-mark-spin','tracker-hook','valkyrie-spin','gargoyle-three','gargoyle-swarm-six','global-move-speed-5-up-from-v26-1','valkyrie-axe-turn','leaf-archer-duo','iron-guard-damage-202','kragg-berserker-7-3760-842','mini-berserker-1390-755-1-6','leaf-archer-cost-3','golem-4256-260-2-5','mini-golem-one-fifth','golem-arm-sway','leaf-archer-duo-deploy-preview','tower-balance-4560-3200','battle-card-damage-hold','cannon-1000-200-1s','bat-horde-five-92-82-1-2','bomber-cost-2-arc-bomb','mega-knight-3993-263-jump-537','tombstone-skeleton-spawner','skeleton-squad-fifteen-81','skeleton-three-1-cost-81','iron-boar-1696-318-1-6-river-jump','iron-boar-context-river-route','riverbank-deploy-snap','healer-on-hit-110-three-allies','elixir-golem-split-energy','royal-giant-cannon-165','necromancer-5-839-1-1','dark-necromancer-4-907-304','poison-8s-91-21','spell-balance-fireball-689-159-arrowrain-366-75','lightning-top-four-1056-265','elixir-golem-demo-split-visual','mega-jump-windup-1-7','tracker-5-320','yuno-907-193-dash-387-ct2','sky-bomber-range-170','roster-prune-v29-3','first-strike-delay-0-25','laser-tower-ramp-1s','royal-giant-underarm-cannon','ice-golem-1228-84-death-blast','royal-giant-left-hand-cradle','skeleton-barrel-532-145-seven','skeleton-barrel-air-building-only','royal-giant-right-shell-left-cannon','skeleton-rush-1-2-9s-spawner','skeleton-rush-40pct-offscreen','giant-skeleton-3361-276-death-bomb-688','goblin-gang-three-plus-three','goblin-card-four-202-125','spear-goblin-card-three-133-81','mega-gargoyle-3-837-311','giant-skeleton-bomb-r58','apprentice-guards-six-wide-shield','ice-spirit-jump-freeze-1-1','fire-spirit-1-215-burst','oven-4-900-two-every-10s','oven-hp-decay-30','building-only-lane-routing','melee-aggro-150','special-ability-acquisition','size-vision-115-150-185','pre-hit-vision-release','asymmetric-lure-targeting','barbarians-five-716-192','siege-barbarian-966-charge-572-two','grid-map-18x32','tower-footprints-3x3-4x4','building-footprints-3x3','archer-range-five-cells','cell-based-ranges','cell-based-vision','structure-edge-range','grid-summon-formations','lane-centered-two-cell-bridges','river-grid-hidden','tower-edge-range-seven-cells','five-map-visual-themes','decorative-arena-border','decorative-terrain-layer','outer-decor-padding','legacy-inner-frame-removed','princess-261-range9-vision9','barbarian-smaller-art','siege-barbarian-overhead-log','building-visual-footprint-scale','structure-hitbox-separate-from-footprint','tower-body-hitboxes','laser-tower-decay-60','laser-tower-damage-tick-0-2','grid-snapped-building-placement','building-3x3-placement-preview','tower-placement-footprint-removed','laser-tower-base-42','fireball-delay-1-26-knockback','arrow-rain-delay-core-flight-r3-5','elixir-pump-6-1070-13s','summon-vulnerable-targetable','summon-active-hitbox','mega-knight-summon-invulnerable','release-to-place-cancel-outside','melee-range-three-tiers','prince-5-1920-charge-784','dark-prince-4-1200-shield240-charge-532','cyclone-5-5-one-second-fixed-damage','falche-boomerang-axe','rage-speed-zone','air-balloon-building-bomb','air-balloon-delayed-death-bomb','lumberjack-death-rage'])assert.ok(b.features.includes(feature),feature);
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
