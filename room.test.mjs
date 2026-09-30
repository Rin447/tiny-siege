import test from 'node:test';
import assert from 'node:assert/strict';
import {RoomModel,newRoom,cleanName,ROOM_TTL} from '../src/room-model.js';
import {DECK} from '../src/game-core.js';
const TEST_DECK=DECK.slice(0,8);

function setup(){
  let now=10_000;
  const data=newRoom('123456','Rin',now);
  const model=new RoomModel(data,{now:()=>now});
  const out=[[],[]];
  const guest=model.join('Taro');
  function attach(id,seat,token){
    model.addPeer(id,{send:s=>out[seat].push(JSON.parse(s)),close:()=>{}});
    model.receive(id,JSON.stringify({type:'hello',token}));
  }
  attach('a',0,data.players[0].token);
  attach('b',1,guest.token);
  function msg(id,m){now+=60;model.receive(id,JSON.stringify(m));}
  function step(ms){now+=ms;model.update();}
  return {model,data,out,msg,step,advance:ms=>now+=ms};
}

test('name validation and room TTL',()=>{
  assert.equal(cleanName('  Rin  '),'Rin');
  assert.throws(()=>cleanName(''));
  assert.throws(()=>cleanName('x'.repeat(17)));
  const d=newRoom('123456','Rin',1000);
  assert.equal(d.expires,1000+ROOM_TTL);
  assert.equal(d.players[0].token.length,64);
});

test('two-player room hides private tokens from snapshots',()=>{
  const s=setup();
  const snap=s.model.snapshot(0);
  const text=JSON.stringify(snap);
  assert.equal(s.data.players.filter(Boolean).length,2);
  assert.equal(text.includes('"token"'),false);
  assert.equal(text.includes(s.data.players[1].token),false);
});

test('both valid decks are required and only host can start',()=>{
  const s=setup();
  s.msg('a',{type:'ready',ready:true,deck:[...TEST_DECK]});
  s.msg('b',{type:'ready',ready:true,deck:[...TEST_DECK]});
  s.msg('b',{type:'start'});
  assert.equal(s.data.game,null);
  s.msg('a',{type:'start'});
  assert.ok(s.data.game);
  assert.equal(s.data.game.phase,'countdown');
});

test('disconnect pauses and reconnect timeout ends the match',()=>{
  const s=setup();
  s.msg('a',{type:'ready',ready:true,deck:[...TEST_DECK]});
  s.msg('b',{type:'ready',ready:true,deck:[...TEST_DECK]});
  s.msg('a',{type:'start'});
  for(let i=0;i<35;i++)s.step(100);
  assert.equal(s.data.game.phase,'battle');
  const before=s.data.game.time;
  s.model.drop('b');
  s.step(1000);
  assert.equal(s.data.game.time,before);
  s.step(45_001);
  assert.equal(s.data.game.phase,'ended');
  assert.equal(s.data.game.winner,0);
});
