import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {ARENA,UNITS,DECK,MAX_DECK,summonDelayFor} from '../public/game/units.js';
import {createMatch,deploy,tick} from '../public/game/engine.js';

function ready(g,o,id){const pool=[id,...DECK.filter(x=>x!==id)].slice(0,MAX_DECK);g.players[o].energy=10;g.players[o].deck=[...pool];g.players[o].hand=pool.slice(0,4);g.players[o].queue=pool.slice(4);}
function advance(g,sec){let left=sec;while(left>1e-9){const dt=Math.min(.02,left);tick(g,dt);left-=dt;}}
function battle(seed=7701){const g=createMatch({seed});g.phase='battle';g.countdown=0;g.towers.forEach(t=>{t.damage=0;t.range=0;});return g;}

test('v37.7 normal construction is immediately targetable while timers wait for completion',()=>{
  const g=battle();ready(g,0,'elixirpump');assert.ok(deploy(g,0,'elixirpump',300,860).ok);const pump=g.units.find(u=>u.type==='elixirpump');
  assert.ok(pump.deploying);assert.equal(pump.targetable,true);assert.equal(pump.collisionDisabled,false);assert.equal(pump.energyNextAt,null);
  const hp0=pump.hp,delay=summonDelayFor(UNITS.elixirpump);advance(g,delay-.1);
  assert.ok(pump.deploying);assert.equal(pump.hp,hp0,'natural HP decay must not start during construction');assert.equal(pump.energyNextAt,null,'pump generation timer must not start during construction');
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',pump.x,pump.y).ok);assert.equal(pump.hp,hp0-UNITS.zap.buildingDamage,'construction must take spell damage');
  advance(g,.12);assert.equal(pump.deploying,false);assert.ok(Number.isFinite(pump.energyNextAt));const afterReady=pump.hp;advance(g,.2);assert.ok(pump.hp<afterReady,'natural decay starts only after construction completes');
});

test('v37.7 summon-on-ready abilities do not fire before the parent is ready',()=>{
  const g=battle(7702);ready(g,0,'oven');assert.ok(deploy(g,0,'oven',300,860).ok);const oven=g.units.find(u=>u.type==='oven');
  assert.ok(oven.deploying);assert.equal(g.units.filter(u=>u.type==='firespirit').length,0);advance(g,summonDelayFor(UNITS.oven)-.05);assert.equal(g.units.filter(u=>u.type==='firespirit').length,0);
  advance(g,.08);assert.equal(oven.deploying,false);assert.equal(g.units.filter(u=>u.type==='firespirit').length,2);
});

test('v37.7 Mega Knight stays protected during its special drop summon',()=>{
  const g=battle(7703);ready(g,0,'megaknight');assert.ok(deploy(g,0,'megaknight',360,800).ok);const mega=g.units.find(u=>u.type==='megaknight'),hp=mega.hp;
  assert.ok(mega.deploying);assert.equal(mega.targetable,false);assert.equal(mega.collisionDisabled,true);
  ready(g,1,'zap');assert.ok(deploy(g,1,'zap',mega.x,mega.y).ok);assert.equal(mega.hp,hp);assert.equal(mega.stunUntil,0);
  advance(g,summonDelayFor(UNITS.megaknight)-.05);assert.equal(mega.targetable,false);advance(g,.08);assert.equal(mega.deploying,false);assert.equal(mega.targetable,true);assert.equal(mega.collisionDisabled,false);
});

test('v37.7 incoming area damage can hit a unit while it is still summoning',()=>{
  const g=battle(7704);ready(g,1,'golem');assert.ok(deploy(g,1,'golem',360,480).ok);const golem=g.units.find(u=>u.type==='golem'),hp=golem.hp;
  assert.ok(golem.deploying);ready(g,0,'lightning');assert.ok(deploy(g,0,'lightning',golem.x,golem.y).ok);assert.ok(golem.hp<hp);assert.ok(golem.deploying,'being hit does not finish summon early');
});

test('v37.7 battlefield placement confirms on pointer release and cancels outside the arena',async()=>{
  const app=await readFile(new URL('../public/app.js',import.meta.url),'utf8');
  const down=app.match(/arenaCanvas\.addEventListener\('pointerdown',[\s\S]*?\n\}\);/m)?.[0]||'';
  const up=app.match(/arenaCanvas\.addEventListener\('pointerup',[\s\S]*?\n\}\);/m)?.[0]||'';
  assert.ok(down.includes('arenaPlacementPointerId=e.pointerId'));
  assert.ok(!down.includes('place('),'pointerdown must not deploy immediately');
  assert.ok(up.includes('const p=pointFromEvent(e,true)'));
  assert.ok(up.includes('place(p)'),'pointerup inside arena confirms deployment');
  assert.ok(up.includes('cancelArenaPlacement({deselect:true})'),'pointerup outside arena cancels and deselects');
});
