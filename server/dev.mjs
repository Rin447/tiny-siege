import {PHYSICS_VERSION} from '../public/game/physics.js';
/**
 * Zero-dependency development server (Node.js 22+).
 * Shared authoritative simulation; minimal RFC6455 text transport for local testing.
 * Use Cloudflare Workers, not this development HTTP server, for Internet deployment.
 */
import http from 'node:http';
import {createHash,randomUUID,randomInt} from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {RoomModel,newRoom,cleanName} from '../src/room-model.js';
import {VERSION,DECK,UNIT_IDS,SPELL_IDS,MAX_DECK} from '../public/game/units.js';
const here=path.dirname(fileURLToPath(import.meta.url)),publicDir=path.resolve(here,'../public');
const port=Number(process.env.PORT||3000),host=process.env.HOST||'0.0.0.0';
const rooms=new Map(),limits=new Map(),sockets=new Set();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json'};
function sendJSON(res,data,status=200){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));}
function allowed(req){return !req.headers.origin||req.headers.origin===`http://${req.headers.host}`;}
async function readBody(req){let text='';for await(const b of req){text+=b;if(Buffer.byteLength(text)>2048)throw new Error('Too large');}return JSON.parse(text);}
function limit(req,max=80){
  const k=req.socket.remoteAddress,now=Date.now();let l=limits.get(k);
  if(!l||now-l.at>60000){l={at:now,n:0};limits.set(k,l);}
  return ++l.n<=max;
}
function makeModel(data){
  let timer=null;
  const model=new RoomModel(data,{activity:()=>{
    if(model.needsLoop()&&!timer)timer=setInterval(()=>model.update(),100);
    if(!model.needsLoop()&&timer){clearInterval(timer);timer=null;}
  }});
  model.cleanup=()=>{if(timer)clearInterval(timer);for(const p of model.peers.values())p.close(1001,'Server closing');};
  return model;
}
const server=http.createServer(async(req,res)=>{
  try{
    const u=new URL(req.url,`http://${req.headers.host}`);
    if(u.pathname==='/health')return sendJSON(res,{ok:true});
    if(u.pathname==='/api/config')return sendJSON(res,{ok:true,game:'tiny-siege',version:VERSION,cards:DECK.length,units:UNIT_IDS.length,spells:SPELL_IDS.length,physicsVersion:PHYSICS_VERSION,features:['back-views','ground-air-layers','solid-buildings','body-size-mass','depth-sorting','custom-deck','building-only-golem','charging-boar','shadow-rush-assassin','five-unit-swarm','healing-priest','frost-slow','chain-lightning','boar-shove','cannon-hp-decay','nightshade-half-aggro','frontline-inset','tower-hp-1.2','dormant-core-wake','golem-split','golem-death-blast','fireball-spell','golem-4256-260-2-5','mini-golem-one-fifth','cannon-cost-3','knight-cost-3','blade-cost-2','kragg-berserker-7-2450-465','skeleton-squad-fifteen-81','poison-trap','arrow-rain','single-tower-centre-connector','double-tower-full-frontline','eight-card-deck','average-deck-cost','building-range-preview','structure-target-lock','weekly-patch-notes','tigger-underground-ambush','mud-dragon-splash','mud-zone-slow-dot','mud-dragon-range-halved','tigger-slower-burrow','blowdart-goblin','laser-tower-ramping','mud-dragon-hp-1600','blowdart-range-195','touch-building-instant-placement','spell-team-colors','patch-notes-major-grouping','deck-my-list','deck-my-list-verified-storage','deck-three-column-grid','deck-card-action-menu','deck-card-live-battle-demo','deck-sticky-selection','tigger-attack-20','moon-bat-four','ability-focused-live-demos','necromancer-bone-summoner','dark-necromancer-bat-summoner','ash-squad-three','summon-on-deploy','summon-intervals','princess-long-range-splash','zap-stun-target-reset','sparky-always-charge','sparky-zap-charge-reset','rune-mage-cost-3','leaf-archer-cost-2','berserker-cooldown-1.8','mobile-unit-target-lock','attack-commit-target-lock','pre-attack-nearest-retarget','building-only-lane-routing','melee-aggro-150','special-ability-acquisition','size-vision-115-150-185','pre-hit-vision-release','asymmetric-lure-targeting','zap-mobile-lock-reset','dosranboss-pack-summon','dosranboss-on-deploy-summon','dosranboss-v19-2-balance','tigger-attack-40-cooldown-1-1','necromancer-splash-45','iron-boar-1696-318-1-6-river-jump','iron-boar-context-river-route','cost-based-summon-delay','summon-invulnerable-untargetable','summon-collision-disabled','summon-progress-telegraph','golem-summon-delay-2-5','sparky-summon-delay-1-8','tigger-burrow-only-delay','summoner-on-ready-wave','tigger-unit-120-structure-70','frost-cost-3-splash-38','frost-three-stage-stack','harpy-chain-stun-1s','goblin-squad-three-plus-two','goblin-spear-throw-range-160','harpy-chain-fixed-damage','electrowizard-splash-stun','single-update-history','stun-cooldown-freeze','laser-dragon-ramping','sky-bomber-all-targets','mini-berserker','mega-knight-drop-jump','iron-eye-mark-spin','tracker-hook','golem-arm-sway','leaf-archer-duo-deploy-preview','tower-balance-4560-3200','battle-card-damage-hold','cannon-1000-200-1s','bat-horde-five-92-82-1-2','bomber-cost-2-arc-bomb','skeleton-three-1-cost-81','tombstone-skeleton-spawner','mega-knight-3993-263-jump-537','riverbank-deploy-snap','healer-on-hit-110-three-allies','elixir-golem-split-energy','royal-giant-cannon-165','necromancer-5-839-1-1','dark-necromancer-4-907-304','poison-8s-91-21','spell-balance-fireball-689-159-arrowrain-366-75','lightning-top-four-1056-265','elixir-golem-demo-split-visual','mega-jump-windup-1-7','tracker-5-320','yuno-907-193-dash-387-ct2','sky-bomber-range-170','roster-prune-v29-3','first-strike-delay-0-25','laser-tower-ramp-1s','royal-giant-underarm-cannon','ice-golem-1228-84-death-blast','ice-golem-building-only','royal-giant-left-hand-cradle','skeleton-barrel-532-145-seven','skeleton-barrel-air-building-only','royal-giant-right-shell-left-cannon','royal-giant-v29-2-look-restored','skeleton-rush-1-2-9s-spawner','skeleton-rush-40pct-offscreen','giant-skeleton-3361-276-death-bomb-688','goblin-gang-three-plus-three','goblin-card-four-202-125','spear-goblin-card-three-133-81','mega-gargoyle-3-837-311','giant-skeleton-bomb-r58','apprentice-guards-six-wide-shield','ice-spirit-jump-freeze-1-1','fire-spirit-1-215-burst','oven-4-900-two-every-10s','oven-hp-decay-30','barbarians-five-716-192','siege-barbarian-966-charge-572-two','grid-map-18x32','river-two-row-grid','tower-footprints-3x3-4x4','building-footprints-3x3','archer-range-five-cells','cell-based-ranges','cell-based-vision','structure-edge-range','grid-summon-formations','lane-centered-two-cell-bridges','river-grid-hidden','tower-edge-range-seven-cells','five-map-visual-themes','decorative-arena-border','decorative-terrain-layer'],online:'local-node-websocket',maxPlayers:2,maxDeck:MAX_DECK});
    if(u.pathname.startsWith('/api/')){
      if(!allowed(req))return sendJSON(res,{ok:false,error:'異なるサイトからの操作は拒否しました。'},403);
      if(!limit(req))return sendJSON(res,{ok:false,error:'リクエストが多すぎます。'},429);
      if(u.pathname==='/api/rooms'&&req.method==='POST'){
        const b=await readBody(req);cleanName(b.name);
        let code;do{code=String(randomInt(100000,1000000));}while(rooms.has(code));
        const model=makeModel(newRoom(code,b.name));rooms.set(code,model);return sendJSON(res,model.response(0));
      }
      const m=u.pathname.match(/^\/api\/rooms\/(\d{6})\/join$/);
      if(m&&req.method==='POST'){
        const room=rooms.get(m[1]);if(!room)return sendJSON(res,{ok:false,error:'PASSが違うか、ルームがありません。'},404);
        const b=await readBody(req);const r=room.join(b.name);return sendJSON(res,r,r.ok?200:409);
      }
      return sendJSON(res,{ok:false,error:'API not found'},404);
    }
    if(!['GET','HEAD'].includes(req.method))return sendJSON(res,{ok:false},405);
    const requested=decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname);
    const file=path.resolve(publicDir,'.'+requested);
    if(!file.startsWith(publicDir+path.sep))return sendJSON(res,{ok:false},403);
    let bytes;try{bytes=await fs.readFile(file);}catch{return sendJSON(res,{ok:false,error:'Not found'},404);}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY'});
    res.end(req.method==='HEAD'?undefined:bytes);
  }catch(e){sendJSON(res,{ok:false,error:e.message},400);}
});
function frame(op,payload=Buffer.alloc(0)){
  const p=Buffer.isBuffer(payload)?payload:Buffer.from(payload);
  let h;if(p.length<126)h=Buffer.from([0x80|op,p.length]);else if(p.length<65536){h=Buffer.alloc(4);h[0]=0x80|op;h[1]=126;h.writeUInt16BE(p.length,2);}
  else{h=Buffer.alloc(10);h[0]=0x80|op;h[1]=127;h.writeBigUInt64BE(BigInt(p.length),2);}
  return Buffer.concat([h,p]);
}
server.on('upgrade',(req,socket,head)=>{
  const m=req.url?.match(/^\/api\/rooms\/(\d{6})\/socket$/),model=m&&rooms.get(m[1]);
  const key=req.headers['sec-websocket-key'];
  if(!model||model.isExpired()||!allowed(req)||req.headers.upgrade?.toLowerCase()!=='websocket'||req.headers['sec-websocket-version']!=='13'||typeof key!=='string'||Buffer.from(key,'base64').length!==16||model.peers.size>=6){
    socket.end('HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n');return;
  }
  const accept=createHash('sha1').update(key+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  const id=randomUUID();sockets.add(socket);let buffer=Buffer.alloc(0),done=false,authTimer;
  function close(code=1000,reason=''){
    if(done)return;done=true;clearTimeout(authTimer);
    const body=Buffer.alloc(2+Buffer.byteLength(reason));body.writeUInt16BE(code);body.write(reason,2);
    socket.end(frame(8,body));model.drop(id);sockets.delete(socket);
  }
  model.addPeer(id,{send:text=>{
    if(done||socket.destroyed)throw new Error('closed');
    if(socket.writableLength>1_000_000){close(1013,'Slow consumer');return;}
    socket.write(frame(1,text));
  },close});
  authTimer=setTimeout(()=>{if(model.peers.get(id)?.seat===null)close(4003,'Authentication timeout');},6000);
  function parse(chunk){
    buffer=Buffer.concat([buffer,chunk]);
    if(buffer.length>65536){close(1009,'Too large');return;}
    while(buffer.length>=2&&!done){
      const b0=buffer[0],b1=buffer[1],op=b0&15;
      if((b0&0x70)||!(b0&0x80)||!(b1&0x80)){close(1002,'Unsupported frame');return;}
      const lengthCode=b1&127;let n=lengthCode,off=2;
      if(lengthCode===126){if(buffer.length<4)return;n=buffer.readUInt16BE(2);off=4;}
      if(lengthCode===127){close(1009,'Too large');return;}
      if(n>8192||((op&8)&&n>125)){close(1009,'Too large');return;}
      if(buffer.length<off+4+n)return;
      const mask=buffer.subarray(off,off+4),p=Buffer.from(buffer.subarray(off+4,off+4+n));buffer=buffer.subarray(off+4+n);
      for(let i=0;i<n;i++)p[i]^=mask[i%4];
      if(op===8){close();return;}
      if(op===9){socket.write(frame(10,p));continue;}
      if(op===10)continue;
      if(op!==1){close(1003,'Text only');return;}
      let text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(p);}catch{close(1007,'Bad UTF8');return;}
      model.receive(id,text);
      if(model.peers.get(id)?.seat!==null)clearTimeout(authTimer);
    }
  }
  socket.on('data',parse);
  socket.on('close',()=>{clearTimeout(authTimer);model.drop(id);sockets.delete(socket);});
  socket.on('error',()=>{clearTimeout(authTimer);model.drop(id);sockets.delete(socket);});
  if(head.length)parse(head);
});
const cleaner=setInterval(()=>{
  for(const [code,m] of rooms)if(m.isExpired()){m.cleanup();rooms.delete(code);}
  for(const [ip,l] of limits)if(Date.now()-l.at>120000)limits.delete(ip);
},30000);
cleaner.unref();
server.listen(port,host,()=>{
  console.log(`\nTINY SIEGE v${VERSION}\nLocal: http://localhost:${port}\nLAN: http://<this-PC-IP>:${port}\nCtrl+C to stop. Local rooms are memory-only.\n`);
});
function shutdown(){clearInterval(cleaner);for(const m of rooms.values())m.cleanup();for(const s of sockets)s.destroy();server.close(()=>process.exit(0));}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
