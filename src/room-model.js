import {PHYSICS_VERSION} from '../public/game/physics.js';
import {createMatch, deploy, tick, viewMatch, finish, validateDeck} from '../public/game/engine.js';

export const ROOM_TTL = 2*60*60*1000;
export const RECONNECT_MS = 45_000;
export function cleanName(value){
  if(typeof value!=='string')throw new Error('名前を入力してください。');
  const s=value.trim().replace(/[\u0000-\u001f\u007f]/g,'');
  if(!s||[...s].length>16)throw new Error('名前は1〜16文字で入力してください。');
  return s;
}
export function makeToken(){return crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-','');}
export function newRoom(code,name,now=Date.now()){
  return {code,created:now,expires:now+ROOM_TTL,host:0,players:[{name:cleanName(name),token:makeToken(),ready:false,deck:null,connected:false,disconnectedAt:now},null],game:null,savedAt:now};
}
export class RoomModel {
  constructor(data,{now=()=>Date.now(),persist=()=>{},activity=()=>{}}={}){
    if(data.game&&data.game.phase!=='ended'&&data.game.physicsVersion!==PHYSICS_VERSION)finish(data.game,null,'ゲームが更新されました。待機室から再戦してください。');
    this.data=data;this.now=now;this.persist=persist;this.activity=activity;
    this.peers=new Map();this.lastTick=now();this.accumulator=0;this.lastSave=now();this.loopCount=0;
  }
  isExpired(){return this.now()>this.data.expires;}
  response(seat){return {ok:true,code:this.data.code,seat,token:this.data.players[seat].token};}
  join(name){
    if(this.isExpired())return {ok:false,error:'このルームは有効期限を過ぎています。'};
    if(this.data.game&&this.data.game.phase!=='ended')return {ok:false,error:'対戦中です。'};
    // Never evict a live member or the host. Unclaimed guest reservations expire.
    const old=this.data.players[1-this.data.host];
    if(old&&!old.connected&&this.now()-old.disconnectedAt>120_000)this.data.players[1-this.data.host]=null;
    const seat=this.data.players.findIndex(p=>!p);
    if(seat<0)return {ok:false,error:'このルームは2人で満員です。'};
    this.data.players[seat]={name:cleanName(name),token:makeToken(),ready:false,deck:null,connected:false,disconnectedAt:this.now()};
    if(!this.data.players[this.data.host])this.data.host=seat;
    if(this.data.game?.phase==='ended')this.data.game=null;
    for(const p of this.data.players)if(p)p.ready=false;
    this.changed();return this.response(seat);
  }
  addPeer(id,transport,restoreSeat=null){
    const conn={id,...transport,seat:restoreSeat,rateAt:this.now(),rate:0};
    this.peers.set(id,conn);
    if(restoreSeat!==null&&this.data.players[restoreSeat])this.data.players[restoreSeat].connected=true;
    return conn;
  }
  send(c,msg){try{c.send(JSON.stringify(msg));}catch{this.drop(c.id);}}
  error(c,text){this.send(c,{type:'error',error:text});}
  receive(id,raw){
    const c=this.peers.get(id);if(!c)return;
    if(typeof raw!=='string'||raw.length>2048){c.close(1009,'Too large');this.drop(id);return;}
    if(this.isExpired()){this.send(c,{type:'expired',error:'ルームの有効期限が切れました。'});c.close(4004,'Expired');this.drop(id);return;}
    const now=this.now();if(now-c.rateAt>=1000){c.rate=0;c.rateAt=now;}
    if(++c.rate>20){this.error(c,'操作が多すぎます。少し待ってください。');return;}
    let m;try{m=JSON.parse(raw);}catch{this.error(c,'通信形式が正しくありません。');return;}
    if(!m||typeof m!=='object'||Array.isArray(m)){this.error(c,'通信形式が正しくありません。');return;}
    if(c.seat===null){
      if(m.type!=='hello'||typeof m.token!=='string'){this.error(c,'接続の認証が必要です。');return;}
      const seat=this.data.players.findIndex(p=>p&&p.token===m.token);
      if(seat<0){this.send(c,{type:'auth-error',error:'参加情報が無効です。もう一度参加してください。'});c.close(4003,'Unauthorized');this.drop(id);return;}
      // Reconnect replaces the older socket; its later close cannot disconnect the new socket.
      for(const other of [...this.peers.values()])if(other.id!==id&&other.seat===seat){
        this.peers.delete(other.id);other.close(4001,'Replaced');
      }
      c.seat=seat;c.attach?.({id,seat});
      this.data.players[seat].connected=true;this.data.players[seat].disconnectedAt=null;
      this.lastTick=now;this.accumulator=0;
      this.send(c,{type:'welcome',seat,code:this.data.code});this.changed();return;
    }
    const seat=c.seat,p=this.data.players[seat];
    if(!p){this.error(c,'参加情報がありません。');return;}
    if(m.type==='ping'){this.send(c,{type:'pong',at:m.at});return;}
    if(m.type==='ready'){
      if(this.data.game){this.error(c,'待機ルームで準備してください。');return;}
      if(typeof m.ready!=='boolean'){this.error(c,'準備状態が正しくありません。');return;}
      if(m.ready){const deck=validateDeck(m.deck);if(!deck){this.error(c,'デッキは重複なしの6体を選んでください。');return;}p.deck=deck;}
      p.ready=m.ready;this.changed();return;
    }
    if(m.type==='start'){
      if(seat!==this.data.host){this.error(c,'開始できるのはホストです。');return;}
      if(this.data.game){this.error(c,'対戦はすでに開始しています。');return;}
      if(!this.data.players.every(v=>v?.connected&&v.ready&&validateDeck(v.deck))){this.error(c,'2人とも6体のデッキを決めて準備OKにしてください。');return;}
      const seed=crypto.getRandomValues(new Uint32Array(1))[0];
      this.data.game=createMatch({seed,decks:this.data.players.map(v=>v.deck)});this.lastTick=now;this.accumulator=0;this.changed();return;
    }
    if(m.type==='deploy'){
      if(!this.data.game){this.error(c,'ゲームが始まっていません。');return;}
      if(this.paused()){this.error(c,'再接続を待っています。');return;}
      const res=deploy(this.data.game,seat,m.card,m.x,m.y);
      if(!res.ok)this.error(c,res.error);else{this.send(c,{type:'placed',card:m.card});this.broadcast();}
      return;
    }
    if(m.type==='surrender'){
      if(this.data.game&&this.data.game.phase!=='ended'){
        finish(this.data.game,1-seat,'相手が降参しました');this.changed();
      }return;
    }
    if(m.type==='reset'){
      if(seat!==this.data.host){this.error(c,'再戦待機室に戻せるのはホストです。');return;}
      if(this.data.game?.phase!=='ended'){this.error(c,'対戦終了後に操作してください。');return;}
      this.data.game=null;for(const v of this.data.players)if(v)v.ready=false;
      this.changed();return;
    }
    if(m.type==='leave'){
      if(this.data.game&&this.data.game.phase!=='ended')finish(this.data.game,1-seat,'相手が退出しました');
      this.data.players[seat]=null;
      if(seat===this.data.host&&this.data.players[1-seat])this.data.host=1-seat;
      this.send(c,{type:'left'});this.peers.delete(id);c.close(1000,'Left');
      this.changed();return;
    }
    this.error(c,'未対応の操作です。');
  }
  paused(){
    if(!this.data.game||this.data.game.phase==='ended')return null;
    const missing=this.data.players.map((p,i)=>!p?.connected?i:-1).filter(i=>i>=0);
    if(!missing.length)return null;
    const since=Math.min(...missing.map(i=>this.data.players[i]?.disconnectedAt??this.now()));
    return {missing,seconds:Math.max(0,Math.ceil((RECONNECT_MS-(this.now()-since))/1000))};
  }
  drop(id){
    const c=this.peers.get(id);if(!c)return;
    this.peers.delete(id);
    if(c.seat!==null&&this.data.players[c.seat]&&![...this.peers.values()].some(v=>v.seat===c.seat)){
      const p=this.data.players[c.seat];p.connected=false;p.disconnectedAt=this.now();
      if(!this.data.game)p.ready=false;
      this.changed();
    }
  }
  snapshot(seat){
    const d=this.data;
    return {type:'state',code:d.code,host:d.host,seat,expires:d.expires,
      members:d.players.map((p,i)=>p?{seat:i,name:p.name,ready:p.ready,connected:p.connected,deckCount:Array.isArray(p.deck)?p.deck.length:0}:null),
      paused:this.paused(),game:d.game?viewMatch(d.game,seat):null,serverNow:this.now()};
  }
  broadcast(){for(const c of [...this.peers.values()])if(c.seat!==null)this.send(c,this.snapshot(c.seat));}
  changed(){this.data.savedAt=this.now();this.persist(this.data);this.broadcast();this.activity();}
  needsLoop(){return !!this.data.game&&this.data.game.phase!=='ended';}
  update(){
    const now=this.now();
    if(this.isExpired()){
      if(this.data.game&&this.data.game.phase!=='ended')finish(this.data.game,null,'ルームの有効期限が切れました');
      for(const c of [...this.peers.values()]){this.send(c,{type:'expired',error:'ルームの有効期限が切れました。'});c.close(4004,'Expired');}
      this.peers.clear();this.activity();return;
    }
    if(!this.needsLoop()){this.lastTick=now;return;}
    const paused=this.paused();
    if(paused){
      this.lastTick=now;this.accumulator=0;
      if(paused.seconds<=0){
        const winner=paused.missing.length===2?null:1-paused.missing[0];
        finish(this.data.game,winner,'45秒以内に再接続されませんでした');this.changed();
      }else if(++this.loopCount%5===0)this.broadcast();
      return;
    }
    this.accumulator+=Math.min(.5,Math.max(0,(now-this.lastTick)/1000));this.lastTick=now;
    while(this.accumulator>=.099999&&this.needsLoop()){tick(this.data.game,.1);this.accumulator-=.1;}
    if(++this.loopCount%2===0||!this.needsLoop())this.broadcast();
    if(now-this.lastSave>=5000||!this.needsLoop()){
      this.lastSave=now;this.data.savedAt=now;this.persist(this.data);
    }
    this.activity();
  }
}
