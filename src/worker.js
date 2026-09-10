import {PHYSICS_VERSION} from '../public/game/physics.js';
import {VERSION, DECK, UNIT_IDS, SPELL_IDS, MAX_DECK} from '../public/game/units.js';
import {RoomModel,newRoom,ROOM_TTL,cleanName} from './room-model.js';
import {finish} from '../public/game/engine.js';

function json(data,status=200){
  return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
function originOK(req){const o=req.headers.get('Origin');return !o||o===new URL(req.url).origin;}
async function body(req){
  if(Number(req.headers.get('Content-Length')||0)>2048)throw new Error('リクエストが大きすぎます。');
  // Stream with a size limit rather than trusting Content-Length.
  const reader=req.body?.getReader();if(!reader)throw new Error('入力がありません。');
  let size=0,parts=[];
  for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>2048){await reader.cancel();throw new Error('入力が大きすぎます。');}parts.push(value);}
  const all=new Uint8Array(size);let offset=0;for(const p of parts){all.set(p,offset);offset+=p.length;}
  return JSON.parse(new TextDecoder().decode(all));
}
function code(){return String(100000+crypto.getRandomValues(new Uint32Array(1))[0]%900000);}
export default {
  async fetch(request,env){
    try{
      const u=new URL(request.url),path=u.pathname;
      if(path==='/api/config')return json({ok:true,game:'tiny-siege',version:VERSION,cards:DECK.length,units:UNIT_IDS.length,spells:SPELL_IDS.length,physicsVersion:PHYSICS_VERSION,features:['back-views','ground-air-layers','solid-buildings','body-size-mass','depth-sorting','custom-deck','building-only-golem','charging-boar','shadow-rush-assassin','five-unit-swarm','healing-priest','frost-slow','chain-lightning','boar-shove','cannon-hp-decay','nightshade-half-aggro','frontline-inset','tower-hp-1.2','dormant-core-wake','golem-split','golem-death-blast','fireball-spell','golem-hp-2850','cannon-cost-3','knight-cost-3','blade-cost-2','kragg-berserker-7-2450-465','bone-swarm-twelve-45hp','poison-trap','arrow-rain','single-tower-centre-connector','double-tower-full-frontline','eight-card-deck','average-deck-cost','building-range-preview','structure-target-lock','weekly-patch-notes','tigger-underground-ambush','mud-dragon-splash','mud-zone-slow-dot','mud-dragon-range-halved','tigger-slower-burrow','blowdart-goblin','laser-tower-ramping','mud-dragon-hp-1600','blowdart-range-195','touch-building-pending-placement','spell-team-colors','patch-notes-major-grouping','deck-my-list','deck-my-list-verified-storage','deck-three-column-grid','deck-card-action-menu','deck-card-live-battle-demo','deck-sticky-selection','tigger-attack-20','moon-bat-four','ability-focused-live-demos','necromancer-bone-summoner','dark-necromancer-bat-summoner','ash-squad-three','summon-on-deploy','summon-intervals'],online:'durable-objects-websocket',maxPlayers:2,maxDeck:MAX_DECK});
      if(path==='/health')return json({ok:true});
      if(path.startsWith('/api/')){
        if(!originOK(request))return json({ok:false,error:'異なるサイトからの操作は拒否しました。'},403);
        const ip=request.headers.get('CF-Connecting-IP')||'unknown';
        const isSocket=path.endsWith('/socket');
        if(!isSocket&&env.ENTRY_LIMITER){
          const r=await env.ENTRY_LIMITER.limit({key:ip});if(!r.success)return json({ok:false,error:'操作が多すぎます。1分ほど待ってください。'},429);
        }
        if(path==='/api/rooms'&&request.method==='POST'){
          if(env.CREATE_LIMITER&&!(await env.CREATE_LIMITER.limit({key:ip})).success)return json({ok:false,error:'ルーム作成の回数制限です。1分ほど待ってください。'},429);
          const b=await body(request);cleanName(b.name);
          for(let i=0;i<8;i++){
            const roomCode=code(),stub=env.BATTLES.get(env.BATTLES.idFromName(roomCode));
            const res=await stub.fetch(new Request(`https://room.internal/create`,{method:'POST',body:JSON.stringify({code:roomCode,name:b.name})}));
            if(res.status!==409)return res;
          }
          return json({ok:false,error:'ルーム番号を確保できません。再試行してください。'},503);
        }
        const m=path.match(/^\/api\/rooms\/(\d{6})\/(join|socket)$/);
        if(m){
          const stub=env.BATTLES.get(env.BATTLES.idFromName(m[1]));
          if(m[2]==='join'&&request.method==='POST'){
            const b=await body(request);cleanName(b.name);
            return stub.fetch(new Request('https://room.internal/join',{method:'POST',body:JSON.stringify(b)}));
          }
          if(m[2]==='socket'&&request.headers.get('Upgrade')?.toLowerCase()==='websocket'){
            // No credentials are placed in URL logs. First WebSocket message authenticates.
            return stub.fetch(new Request('https://room.internal/socket',{headers:request.headers}));
          }
          return json({ok:false,error:'通信方法が正しくありません。'},405);
        }
        return json({ok:false,error:'APIが見つかりません。'},404);
      }
      return env.ASSETS.fetch(request);
    }catch(e){return json({ok:false,error:e instanceof SyntaxError?'入力形式が正しくありません。':(e.message||'サーバーエラー')},400);}
  }
};
export class BattleRoom {
  constructor(ctx,env){
    this.ctx=ctx;this.env=env;this.model=null;this.timer=null;this.pending=new Map();
    this.ready=ctx.blockConcurrencyWhile(async()=>{
      let data=await ctx.storage.get('room');
      if(!data)return;
      if(Date.now()>data.expires){await ctx.storage.deleteAll();await ctx.storage.deleteAlarm();return;}
      // Running matches are not silently rewound after a deployment or runtime restart.
      const interrupted=data.game&&data.game.phase!=='ended';
      if(interrupted)finish(data.game,null,'サーバーが再起動しました。再戦してください');
      for(const p of data.players)if(p){p.connected=false;p.disconnectedAt=Date.now();}
      this.setup(data);
      for(const ws of ctx.getWebSockets()){
        const a=ws.deserializeAttachment();
        if(a&&Number.isInteger(a.seat)&&data.players[a.seat])this.model.addPeer(a.id,this.transport(ws),a.seat);
        else try{ws.close(4003,'Reconnect');}catch{}
      }
      if(interrupted)await this.save(data);
    });
  }
  transport(ws){return {send:text=>ws.send(text),close:(c,r)=>{try{ws.close(c,r);}catch{}},attach:a=>ws.serializeAttachment(a)};}
  setup(data){
    this.model=new RoomModel(data,{persist:d=>this.ctx.waitUntil(this.save(d)),activity:()=>this.manageTimer()});
  }
  async save(d){const copy=structuredClone(d);await this.ctx.storage.put('room',copy);}
  manageTimer(){
    if(this.model?.needsLoop()&&!this.timer)this.timer=setInterval(()=>this.model.update(),100);
    if(!this.model?.needsLoop()&&this.timer){clearInterval(this.timer);this.timer=null;}
  }
  async fetch(request){
    await this.ready;const path=new URL(request.url).pathname;
    if(path==='/create'){
      if(this.model&&!this.model.isExpired())return json({ok:false},409);
      const b=await body(request),d=newRoom(b.code,b.name);
      this.setup(d);await this.save(d);await this.ctx.storage.setAlarm(d.expires);
      return json(this.model.response(0));
    }
    if(!this.model||this.model.isExpired())return json({ok:false,error:'PASSが違うか、ルームの有効期限が切れています。'},404);
    if(path==='/join'){const b=await body(request);const res=this.model.join(b.name);return json(res,res.ok?200:409);}
    if(path==='/socket'){
      if(this.ctx.getWebSockets().length>=6)return json({ok:false,error:'接続が混雑しています。'},429);
      const pair=new WebSocketPair(),client=pair[0],server=pair[1],id=crypto.randomUUID();
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({id,seat:null});
      this.model.addPeer(id,this.transport(server));
      const t=setTimeout(()=>{
        const c=this.model?.peers.get(id);if(c?.seat===null){c.close(4003,'Authentication timeout');this.model.drop(id);}
        this.pending.delete(id);
      },6000);
      this.pending.set(id,t);
      return new Response(null,{status:101,webSocket:client});
    }
    return json({ok:false,error:'Not found'},404);
  }
  async webSocketMessage(ws,message){
    await this.ready;const a=ws.deserializeAttachment();if(!a||!this.model)return;
    if(!this.model.peers.has(a.id))this.model.addPeer(a.id,this.transport(ws),a.seat);
    this.model.receive(a.id,message);
    if(this.model.peers.get(a.id)?.seat!==null){clearTimeout(this.pending.get(a.id));this.pending.delete(a.id);}
  }
  async webSocketClose(ws){await this.ready;this.closed(ws);try{ws.close(1000,'Closed');}catch{}}
  async webSocketError(ws){await this.ready;this.closed(ws);try{ws.close(1011,'Socket error');}catch{}}
  closed(ws){const a=ws.deserializeAttachment();if(!a)return;clearTimeout(this.pending.get(a.id));this.pending.delete(a.id);this.model?.drop(a.id);}
  async alarm(){
    await this.ready;
    if(this.timer){clearInterval(this.timer);this.timer=null;}
    for(const ws of this.ctx.getWebSockets())try{ws.close(4004,'Room expired');}catch{}
    this.model=null;await this.ctx.storage.deleteAll();await this.ctx.storage.deleteAlarm();
  }
}
