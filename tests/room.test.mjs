import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RoomModel,newRoom,cleanName,ROOM_TTL} from '../src/room-model.js';
function setup(){
 let now=10000;const d=newRoom('123456','Rin',now);const model=new RoomModel(d,{now:()=>now});
 const out=[[],[]],closed=[];const res=model.join('Taro');
 function attach(id,seat,token){
  model.addPeer(id,{send:s=>out[seat].push(JSON.parse(s)),close:(c,r)=>closed.push([id,c,r])});
  model.receive(id,JSON.stringify({type:'hello',token}));
 }
 attach('a',0,d.players[0].token);attach('b',1,res.token);
 function msg(id,m){now+=60;model.receive(id,JSON.stringify(m));}
 function step(ms){now+=ms;model.update();}
 return {model,d,out,closed,msg,step,attach,now:()=>now,advance:ms=>now+=ms};
}
test('names reject empty, too long and nonstring input',()=>{
 for(const n of ['',null,'x'.repeat(17)])assert.throws(()=>cleanName(n));assert.equal(cleanName('  Rin  '),'Rin');
});
test('new room has two hour TTL, six digit code and strong private token',()=>{
 const d=newRoom('123456','Rin',1000);assert.equal(d.expires,1000+ROOM_TTL);assert.equal(d.players[0].token.length,64);assert.notEqual(d.players[0].token,newRoom('123456','Rin').players[0].token);
});
test('two members connect, third cannot join',()=>{
 const s=setup();assert.equal(s.model.join('third').ok,false);assert.ok(s.d.players.every(p=>p.connected));
});
test('unauthenticated sockets receive no room state',()=>{
 const s=setup(),m=[];s.model.addPeer('bad',{send:x=>m.push(JSON.parse(x)),close:()=>{}});
 s.model.broadcast();assert.equal(m.length,0);s.model.receive('bad','{"type":"start"}');assert.equal(m.at(-1).type,'error');
});
test('wrong token is rejected',()=>{
 const s=setup(),m=[];s.model.addPeer('bad',{send:x=>m.push(JSON.parse(x)),close:()=>{}});
 s.model.receive('bad','{"type":"hello","token":"wrong"}');assert.equal(m.at(-1).type,'auth-error');assert.equal(s.model.peers.has('bad'),false);
});
test('snapshots expose no member authentication tokens',()=>{
 const s=setup();const text=JSON.stringify(s.model.snapshot(0));assert.ok(!text.includes(s.d.players[0].token));assert.ok(!text.includes('"token"'));
});
test('only ready connected players and host may start',()=>{
 const s=setup();s.msg('a',{type:'start'});assert.equal(s.d.game,null);
 s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('b',{type:'start'});assert.equal(s.d.game,null);
 s.msg('a',{type:'start'});assert.equal(s.d.game.phase,'countdown');
});
test('server owns player seat and ignores forged owner in commands',()=>{
 const s=setup();s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('a',{type:'start'});
 for(let i=0;i<31;i++)s.step(100);
 const g=s.d.game;assert.equal(g.phase,'battle');
 const card=g.players[0].hand.find(id=>['bat','blade','archer','spear','bomber'].includes(id));
 g.players[0].energy=10;
 s.msg('a',{type:'deploy',owner:1,card,x:100,y:300});assert.equal(g.units.length,0);
 s.msg('a',{type:'deploy',owner:1,card,x:100,y:650});assert.ok(g.units.every(u=>u.owner===0));
});
test('disconnect pauses game and reconnect restores without resetting time',()=>{
 const s=setup();s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('a',{type:'start'});
 for(let i=0;i<35;i++)s.step(100);
 const before=s.d.game.time,token=s.d.players[1].token;s.model.drop('b');
 assert.ok(s.model.paused());s.step(1000);assert.equal(s.d.game.time,before);
 s.attach('b2',1,token);assert.equal(s.model.paused(),null);s.step(100);assert.ok(s.d.game.time>before);
});
test('old socket close cannot disconnect replacement socket',()=>{
 const s=setup();s.attach('a2',0,s.d.players[0].token);s.model.drop('a');assert.ok(s.d.players[0].connected);assert.equal(s.model.peers.has('a'),false);
});
test('45 second disconnect forfeits; both disconnect draw',()=>{
 for(const both of [false,true]){
 const s=setup();s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('a',{type:'start'});
 s.model.drop('b');if(both)s.model.drop('a');s.step(45001);
 assert.equal(s.d.game.phase,'ended');assert.equal(s.d.game.winner,both?null:0);
 }
});
test('surrender ends a game and host can reset to same lobby',()=>{
 const s=setup();s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('a',{type:'start'});
 s.msg('b',{type:'surrender'});assert.equal(s.d.game.winner,0);
 s.msg('b',{type:'reset'});assert.ok(s.d.game);s.msg('a',{type:'reset'});assert.equal(s.d.game,null);assert.equal(s.d.code,'123456');assert.ok(s.d.players.every(p=>!p.ready));
});
test('explicit leave promotes remaining member to host',()=>{
 const s=setup();s.msg('a',{type:'leave'});assert.equal(s.d.host,1);assert.equal(s.d.players[0],null);assert.equal(s.model.join('New').seat,0);
});
test('malformed, oversized and unknown socket messages cannot mutate game',()=>{
 const s=setup();s.model.receive('a','not json');assert.equal(s.d.game,null);
 s.msg('a',{type:'bogus'});assert.equal(s.d.game,null);s.model.receive('a','x'.repeat(2049));assert.equal(s.model.peers.has('a'),false);
});
test('expired rooms reject new joins and close participants',()=>{
 const s=setup();s.advance(ROOM_TTL+1);assert.equal(s.model.join('Guest').ok,false);s.model.update();assert.equal(s.model.peers.size,0);
});
test('join during live game rejected',()=>{
 const s=setup();s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('a',{type:'start'});
 assert.equal(s.model.join('late').ok,false);
});
test('repeated state snapshots never leak the other hand',()=>{
 const s=setup();s.msg('a',{type:'ready',ready:true});s.msg('b',{type:'ready',ready:true});s.msg('a',{type:'start'});
 assert.equal(s.model.snapshot(0).game.players,undefined);assert.equal(s.model.snapshot(1).game.rng,undefined);
});
