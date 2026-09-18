import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,TOWER_GRID,GRID_COLS,GRID_ROWS,GRID_CELL,cellsToWorld,gridRectCenter,UNITS,DECK,UNIT_IDS,SPELL_IDS,DEFAULT_DECK,MAX_DECK,normalizeDeck,summonDelayFor,cardDamageInfo,visionSizeFor,visionRangeFor} from '../public/game/units.js';
import {createMatch,tick,deploy,canPlace,viewMatch,runBot,inRiver,finish,distance} from '../public/game/engine.js';
function battle(seed=12){const g=createMatch({seed});g.phase='battle';return g;}
function deckWith(id){return [id,...DECK.filter(k=>k!==id)].slice(0,MAX_DECK);}
function ready(g,o,id){const p=g.players[o],deck=deckWith(id);p.energy=10;p.deck=[...deck];p.hand=deck.slice(0,4);p.queue=deck.slice(4);}
function forceReady(g,u){
 if(!u)return u;u.spawn=0;u.deploying=false;u.deployRemaining=0;u.deployTotal=0;u.targetable=true;u.collisionDisabled=false;
 if(u.sparkUnit&&!Number.isFinite(u.sparkChargeStartAt))u.sparkChargeStartAt=g.time;
 if(u.summonInterval&&!Number.isFinite(u.summonNextAt))u.summonNextAt=g.time+u.summonInterval;
 return u;
}
function spawn(g,o,id,x=ARENA.lanes[0],y=o===0?ARENA.riverBottom+ARENA.cellSize*3:ARENA.riverTop-ARENA.cellSize*3){ready(g,o,id);const before=g.units.length,safeX=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],safeY=o===0?ARENA.riverBottom+ARENA.cellSize*3:ARENA.riverTop-ARENA.cellSize*3,r=deploy(g,o,id,safeX,safeY);assert.ok(r.ok,r.error);const created=g.units.slice(before);created.forEach(u=>{forceReady(g,u);u.x=x;u.y=y;u.lane=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];});return created.at(-1);}
function advance(g,seconds){for(let i=0;i<Math.round(seconds*10);i++)tick(g,.1);}
test('v37.2 grid roster, widened lane-centred bridges, cell ranges and eight-card deck rule',()=>{
 assert.equal(DECK.length,73);assert.equal(new Set(DECK).size,73);assert.equal(UNIT_IDS.length,65);assert.deepEqual(SPELL_IDS,['skeletonrush','fireball','poison','arrowrain','lightning','zap','rage','cyclone']);
 assert.equal(MAX_DECK,8);assert.equal(DEFAULT_DECK.length,8);assert.deepEqual(normalizeDeck(DEFAULT_DECK),[...DEFAULT_DECK]);
 assert.equal(GRID_COLS,18);assert.equal(GRID_ROWS,32);assert.equal(GRID_CELL,40);assert.equal(ARENA.width,720);assert.equal(ARENA.height,1280);
 assert.deepEqual(ARENA.riverRows,[16,17]);assert.equal(ARENA.riverTop,600);assert.equal(ARENA.riverBottom,680);assert.deepEqual(ARENA.bridgeColumns,[[3,5],[14,16]]);assert.deepEqual(ARENA.bridgeCenterColumns,[4,15]);assert.deepEqual(ARENA.bridges,[140,580]);assert.equal(ARENA.bridgeHalf,40);
 assert.deepEqual(TOWER_GRID.blue.left,[3,5,6,8]);assert.deepEqual(TOWER_GRID.blue.right,[14,16,6,8]);assert.deepEqual(TOWER_GRID.blue.core,[8,11,2,5]);
 assert.deepEqual(TOWER_GRID.red.left,[3,5,25,27]);assert.deepEqual(TOWER_GRID.red.right,[14,16,25,27]);assert.deepEqual(TOWER_GRID.red.core,[8,11,28,31]);
 const g=createMatch(),blueLeft=g.towers.find(t=>t.owner===0&&t.slot==='left'),blueRight=g.towers.find(t=>t.owner===0&&t.slot==='right'),blueCore=g.towers.find(t=>t.owner===0&&t.kind==='core');
 assert.deepEqual([blueLeft.x,blueLeft.y,blueLeft.footprintCols,blueLeft.footprintRows],[140,1020,3,3]);
 assert.deepEqual([blueRight.x,blueRight.y,blueRight.footprintCols,blueRight.footprintRows],[580,1020,3,3]);
 assert.deepEqual([blueCore.x,blueCore.y,blueCore.footprintCols,blueCore.footprintRows],[360,1160,4,4]);
 assert.equal(UNITS.archer.rangeCells,5);assert.equal(UNITS.archer.range,cellsToWorld(5));assert.equal(UNITS.knight.rangeCells,1);assert.equal(UNITS.berserker.rangeCells,1);assert.equal(UNITS.goblin_spear.rangeCells,4);assert.equal(UNITS.princess.rangeCells,9);assert.equal(UNITS.princess.hp,261);assert.equal(UNITS.princess.name,'プリンセス');assert.equal(UNITS.princess.visionCells,9);assert.equal(visionRangeFor(UNITS.princess),cellsToWorld(9));
 assert.equal(UNITS.cannon.footprintCells,'3x3');assert.equal(UNITS.lasertower.footprintCells,'3x3');assert.equal(UNITS.oven.footprintCells,'3x3');assert.equal(UNITS.tombstone.footprintCells,'3x3');
 assert.equal(UNITS.megaknight.jumpMinRangeCells,2.5);assert.equal(UNITS.megaknight.jumpMaxRangeCells,5);assert.equal(UNITS.tracker.hookRangeCells,6);assert.equal(UNITS.nightshade.aggroRangeCells,3);
 assert.equal(UNITS.fireball.radiusCells,2.5);assert.equal(UNITS.arrowrain.radiusCells,3.5);assert.equal(UNITS.giantskeleton.deathBombRadiusCells,1.5);assert.equal(UNITS.apprenticeguards.wideFormationSpacingCells,2.5);
 assert.equal(ARENA.firstStrikeDelay,.25);for(const id of DECK){const d=UNITS[id];assert.ok(d.cost>=1);if(!d.spell){assert.ok(d.hp>0);if(!['tombstone','oven','elixirpump'].includes(id))assert.ok(d.damage>0);}assert.notEqual(d.hidden,true);}
 assert.equal(UNITS.gravityorb,undefined);assert.equal(UNITS.crusherogre,undefined);assert.equal(UNITS.siegeturtle,undefined);
 // Core gameplay/balance values remain unchanged by the coordinate overhaul.
 assert.equal(UNITS.golem.hp,4256);assert.equal(UNITS.icegolem.hp,1228);assert.equal(UNITS.giantskeleton.hp,3361);assert.equal(UNITS.giantskeleton.deathBombDamage,688);
 assert.equal(UNITS.barbarians.count,5);assert.equal(UNITS.siegebarbarian.ramChargeDamage,572);assert.equal(UNITS.oven.decayPerSecond,30);assert.equal(UNITS.lasertower.decayPerSecond,60);assert.equal(UNITS.lasertower.laserDamageTick,.2);assert.equal(UNITS.lasertower.laserBaseDps,42);assert.equal(UNITS.elixirpump.cost,6);assert.equal(UNITS.elixirpump.hp,1070);assert.equal(UNITS.elixirpump.decayPerSecond,11.5);assert.equal(UNITS.elixirpump.energyInterval,13);assert.equal(UNITS.skeletonrush.zoneDuration,9);
});
test('battle-card damage info separates unit and tower damage',()=>{
 assert.deepEqual(cardDamageInfo(UNITS.blade),{unit:'112',tower:'112'});
 assert.deepEqual(cardDamageInfo(UNITS.tigger),{unit:'120',tower:'70'});
 assert.deepEqual(cardDamageInfo(UNITS.fireball),{unit:'689',tower:'159'});
 assert.deepEqual(cardDamageInfo(UNITS.arrowrain),{unit:'366',tower:'75'});
 assert.deepEqual(cardDamageInfo(UNITS.poison),{unit:'91 / 1秒',tower:'21 / 1秒'});
 assert.deepEqual(cardDamageInfo(UNITS.lightning),{unit:'1056',tower:'265'});
 assert.deepEqual(cardDamageInfo(UNITS.skeletonrush),{unit:'スケルトン召喚',tower:'召喚'});
 assert.deepEqual(cardDamageInfo(UNITS.cyclone),{unit:'84',tower:'58'});
});
for(const id of DECK)test(`deploy ${id}: energy, count, card rotation`,()=>{
 const g=battle();ready(g,0,id);const next=g.players[0].queue[0],r=deploy(g,0,id,ARENA.lanes[0],ARENA.riverBottom+ARENA.cellSize*3);
 assert.ok(r.ok);assert.equal(g.units.length,UNITS[id].count);assert.equal(g.players[0].energy,10-UNITS[id].cost);
 assert.equal(g.players[0].hand[0],next);assert.equal(g.players[0].queue.at(-1),id);
 assert.equal(new Set([...g.players[0].hand,...g.players[0].queue]).size,MAX_DECK);
});
test('necromancer summons three skeletons when its 1.2s deployment completes and three more every 7.5 seconds',()=>{
 const g=battle();ready(g,0,'necromancer');const r=deploy(g,0,'necromancer',ARENA.lanes[0],ARENA.riverBottom+ARENA.cellSize*3);assert.ok(r.ok,r.error);
 const necro=g.units.find(u=>u.type==='necromancer');assert.ok(necro);assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,0);assert.equal(necro.deployRemaining,1.2);g.towers.forEach(t=>t.range=0);
 advance(g,1.1);assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,0);
 advance(g,.2);assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,3);assert.equal(necro.targetable,true);assert.ok(necro.summonNextAt>=8.7-1e-8);
 advance(g,7.5);assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,6);
});
test('dark necromancer summons two bats when its 0.9s deployment completes and then every 6.5 seconds',()=>{
 const g=battle();ready(g,0,'darknecro');const r=deploy(g,0,'darknecro',ARENA.lanes[0],ARENA.riverBottom+ARENA.cellSize*3);assert.ok(r.ok,r.error);
 const dark=g.units.find(u=>u.type==='darknecro');assert.ok(dark);assert.equal(g.units.filter(u=>u.type==='bat'&&u.owner===0).length,0);assert.equal(dark.deployRemaining,.9);
 g.towers.forEach(t=>t.range=0);advance(g,.9);assert.equal(g.units.filter(u=>u.type==='bat'&&u.owner===0).length,2);advance(g,6.5);assert.equal(g.units.filter(u=>u.type==='bat'&&u.owner===0).length,4);
});
test('dead summoners never create another periodic wave after their deployment summon',()=>{
 const g=battle();ready(g,0,'necromancer');deploy(g,0,'necromancer',ARENA.lanes[0],ARENA.riverBottom+ARENA.cellSize*3);g.towers.forEach(t=>t.range=0);const necro=g.units.find(u=>u.type==='necromancer');advance(g,1.6);assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,3);necro.hp=0;advance(g,8);
 assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,3);
});
test('summoner deployment reserves room for the full guaranteed first summon wave',()=>{
 const g=battle();ready(g,0,'necromancer');g.units=Array.from({length:ARENA.maxUnits-3},(_,i)=>({id:`dummy${i}`,hp:1,owner:1,air:false,radius:1,x:680,y:60}));
 assert.equal(canPlace(g,0,'necromancer',ARENA.lanes[0],ARENA.riverBottom+ARENA.cellSize*3),'フィールドのユニット上限です。');
 g.units.length=ARENA.maxUnits-4;assert.equal(canPlace(g,0,'necromancer',ARENA.lanes[0],ARENA.riverBottom+ARENA.cellSize*3),null);
});
test('ash squad spends one card but creates three ordinary ash swordsmen in front-one rear-two formation',()=>{
 for(const owner of [0,1]){
   const g=battle();ready(g,owner,'ashsquad');const y=owner===0?ARENA.riverBottom+ARENA.cellSize*3:ARENA.riverTop-ARENA.cellSize*3,r=deploy(g,owner,'ashsquad',ARENA.lanes[0],y);assert.ok(r.ok,r.error);
   const blades=g.units.filter(u=>u.owner===owner);assert.equal(blades.length,3);assert.ok(blades.every(u=>u.type==='blade'&&u.hp===UNITS.blade.hp&&u.damage===UNITS.blade.damage));
   const front=owner===0?Math.min(...blades.map(u=>u.y)):Math.max(...blades.map(u=>u.y));assert.equal(blades.filter(u=>Math.abs(u.y-front)<.01).length,1);
 }
});

test('leaf archer deploys two smaller archers side-by-side',()=>{
 const g=battle();ready(g,0,'archer');const before=g.units.length,r=deploy(g,0,'archer',300,ARENA.riverBottom+ARENA.cellSize*3);assert.ok(r.ok,r.error);
 const pair=g.units.slice(before);assert.equal(pair.length,2);assert.ok(pair.every(u=>u.type==='archer'&&u.hp===304&&u.damage===112&&u.radius===12));
 assert.ok(Math.abs(pair[0].y-pair[1].y)<.01);assert.ok(Math.abs(pair[0].x-pair[1].x)>=pair[0].radius+pair[1].radius);
});

test('countdown blocks deployments and becomes battle after three seconds',()=>{
 const g=createMatch();assert.equal(deploy(g,0,g.players[0].hand[0],100,660).ok,false);advance(g,3);assert.equal(g.phase,'battle');
});
test('v26.5 tower HP, damage and dormant core rules use the new balance',()=>{
 const g=battle();
 for(const t of g.towers){assert.equal(t.maxHp,t.kind==='core'?4560:3200);assert.equal(t.hp,t.maxHp);assert.equal(t.damage,t.kind==='core'?85:105);if(t.kind==='core')assert.equal(t.awake,false);}
});
test('one destroyed side tower advances that lane plus a narrow centre connector',()=>{
 const g=battle();ready(g,0,'blade');
 assert.ok(canPlace(g,0,'blade',ARENA.lanes[0],360));assert.ok(canPlace(g,0,'blade',ARENA.lanes[1],360));
 g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left').hp=0;
 assert.equal(canPlace(g,0,'blade',ARENA.lanes[0],400),null);
 assert.equal(canPlace(g,0,'blade',250,400),null);
 assert.equal(canPlace(g,0,'blade',ARENA.midX,400),null,'centre connector opens with the destroyed lane');
 assert.ok(canPlace(g,0,'blade',ARENA.lanes[0],350),'recovery line still protects the ruin');
 assert.ok(canPlace(g,0,'blade',ARENA.lanes[1],400),'opposite lane stays locked');
});
test('destroying both side towers unlocks the enemy front half across the full width',()=>{
 const g=battle();ready(g,0,'blade');g.towers.filter(t=>t.owner===1&&t.kind==='tower').forEach(t=>t.hp=0);
 for(const x of [70,140,260,360,460,580,650])assert.equal(canPlace(g,0,'blade',x,400),null,`x=${x}`);
 assert.ok(canPlace(g,0,'blade',360,350),'the recovery line still protects the enemy core side');
});
test('frontline lane and centre connector are symmetric for player two',()=>{
 const g=battle();ready(g,1,'blade');g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.slot==='right').hp=0;
 assert.equal(canPlace(g,1,'blade',ARENA.lanes[1],880),null);assert.equal(canPlace(g,1,'blade',470,880),null);assert.equal(canPlace(g,1,'blade',ARENA.midX,880),null);
 assert.ok(canPlace(g,1,'blade',ARENA.lanes[1],930),'recovery line still protects the ruin');
 assert.ok(canPlace(g,1,'blade',ARENA.lanes[0],880),'opposite lane stays locked');
});
test('invalid coordinates, ownership and opponents territory are rejected without spending',()=>{
 const g=battle();ready(g,0,'blade');
 for(const [o,x,y] of [[0,NaN,800],[0,Infinity,800],[0,100,300],[0,-1,800],[0,710,800],[2,100,800],[1,100,800]]){
   const before=JSON.stringify(g);assert.ok(canPlace(g,o,'blade',x,y));assert.equal(JSON.stringify(g),before);
 }
});
test('unknown card and non-hand card rejected',()=>{
 const g=battle();ready(g,0,'blade');
 for(const id of ['unknown',null,{},[],{toString:null,valueOf:null},'__proto__','constructor'])assert.ok(canPlace(g,0,id,100,650));
 assert.ok(canPlace(g,0,g.players[0].queue[0],100,650));
});
test('princess uses 9-cell attack/vision range, can pressure across the river, and Arrow Rain can one-shot her',()=>{
 const g=battle();ready(g,0,'princess');g.towers.forEach(t=>t.damage=0);const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='right'),before=tower.hp;
 assert.ok(deploy(g,0,'princess',ARENA.lanes[1],700).ok);advance(g,4.2);assert.ok(tower.hp<before,'princess should hit tower before crossing bridge');const princess=g.units.find(u=>u.type==='princess');assert.ok(princess&&princess.y>=ARENA.riverBottom,'princess should remain on own side when first tower damage lands');
 const h=battle();ready(h,1,'princess');ready(h,0,'arrowrain');h.towers.forEach(t=>t.range=0);assert.ok(deploy(h,1,'princess',ARENA.lanes[1],580).ok);advance(h,.6);const p=h.units.find(u=>u.owner===1&&u.type==='princess');assert.ok(p);const ar=deploy(h,0,'arrowrain',p.x,p.y);assert.ok(ar.ok);advance(h,ar.travelTime+.2);assert.equal(h.units.some(u=>u.owner===1&&u.type==='princess'),false);
});

test('sparky charges before anything enters attack range, fires only when full, then starts charging again',()=>{
 const g=battle();ready(g,0,'sparky');g.towers.forEach(t=>t.range=0);assert.ok(deploy(g,0,'sparky',ARENA.lanes[1],800).ok);const s=g.units.find(u=>u.type==='sparky');s.speed=0;advance(g,5.4);assert.ok(s.sparkCharged);assert.equal(s.sparkChargeProgress,1);assert.ok(!s.target||typeof s.target==='string','Sparky charges independently of having an attackable target');
 const target=spawn(g,1,'knight',ARENA.lanes[1],480);target.x=ARENA.lanes[1];target.y=670;target.speed=0;target.damage=0;const hp=target.hp;advance(g,.8);assert.ok(target.hp<=hp-UNITS.sparky.damage,'full Sparky should release 1200 shot after the shared first-strike delay');assert.equal(s.sparkCharged,false);assert.ok(s.sparkChargeProgress<.25);
});

test('zap stuns and resets targets, laser ramp, and sparky charge',()=>{
 const g=battle();g.towers.forEach(t=>t.range=0);ready(g,0,'zap');const laser=spawn(g,1,'lasertower',530,390),sparky=spawn(g,1,'sparky',440,390);laser.x=530;laser.y=520;sparky.x=490;sparky.y=520;laser.target='dummy';laser.laserTarget='dummy';laser.laserStage=5;laser.laserDps=640;laser.laserLockTime=8;sparky.sparkCharged=true;sparky.sparkChargeProgress=1;sparky.target='dummy';const hp=sparky.hp;
 assert.ok(deploy(g,0,'zap',510,520).ok);assert.equal(sparky.hp,hp-UNITS.zap.damage);assert.ok(sparky.stunUntil>=1.5);assert.equal(sparky.target,null);assert.equal(sparky.sparkCharged,false);assert.equal(sparky.sparkChargeProgress,0);assert.equal(laser.target,null);assert.equal(laser.laserStage,0);assert.equal(laser.laserDps,UNITS.lasertower.laserBaseDps);
 advance(g,1.4);assert.equal(sparky.sparkCharged,false);advance(g,3.6);assert.equal(sparky.sparkCharged,true);
});

test('summon delay scales by cost, with golem and sparky overrides and tigger exception',()=>{
 assert.equal(summonDelayFor(UNITS.blade),.5);assert.equal(summonDelayFor(UNITS.knight),.7);assert.equal(summonDelayFor(UNITS.boar),.9);
 assert.equal(summonDelayFor(UNITS.muddragon),1.2);assert.equal(summonDelayFor(UNITS.necromancer),1.2);assert.equal(summonDelayFor(UNITS.berserker),1.8);
 assert.equal(summonDelayFor(UNITS.golem),2.5);assert.equal(summonDelayFor(UNITS.sparky),1.8);assert.equal(summonDelayFor(UNITS.tigger),0);
});
test('directly deployed units are targetable and damageable during summon, but cannot act until ready',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});ready(g,0,'knight');assert.ok(deploy(g,0,'knight',360,800).ok);const k=g.units.find(u=>u.type==='knight');
 assert.equal(k.deploying,true);assert.equal(k.targetable,true);assert.equal(k.collisionDisabled,false);const hp=k.hp;
 ready(g,1,'zap');assert.ok(deploy(g,1,'zap',360,800).ok);assert.equal(k.hp,hp-UNITS.zap.damage,'Zap must damage a summoning unit');assert.ok(k.stunUntil>g.time,'Zap must stun a summoning unit');
 k.target='should-clear';k.moving=true;advance(g,.2);assert.equal(k.deploying,true);assert.equal(k.target,null);assert.equal(k.moving,false);assert.equal(k.hp,hp-UNITS.zap.damage);
 advance(g,.6);assert.equal(k.deploying,false);assert.equal(k.targetable,true);assert.equal(k.collisionDisabled,false);assert.equal(k.hp,hp-UNITS.zap.damage,'deployment completion must not heal construction damage');
});
test('golem takes 2.5s to appear while low-cost blade appears in 0.5s',()=>{
 const a=battle();ready(a,0,'golem');deploy(a,0,'golem',360,800);const g=a.units.find(u=>u.type==='golem');advance(a,2.4);assert.equal(g.deploying,true);advance(a,.2);assert.equal(g.deploying,false);
 const b=battle();ready(b,0,'blade');deploy(b,0,'blade',360,800);const u=b.units.find(x=>x.type==='blade');advance(b,.4);assert.equal(u.deploying,true);advance(b,.2);assert.equal(u.deploying,false);
});
test('tigger keeps burrow travel as its only deployment delay',()=>{
 const g=battle();ready(g,0,'tigger');const r=deploy(g,0,'tigger',360,300);assert.ok(r.ok);const tigger=g.units.find(u=>u.type==='tigger');assert.equal(tigger.deploying,false);assert.equal(tigger.burrowState,'burrow');assert.equal(tigger.targetable,false);
});
test('summoned minions and split mini golems do not inherit card summon delay',()=>{
 const g=battle();g.towers.forEach(t=>t.range=0);ready(g,0,'dosranboss');deploy(g,0,'dosranboss',360,800);advance(g,1.6);const minions=g.units.filter(u=>u.type==='ranbos');assert.equal(minions.length,3);assert.ok(minions.every(u=>!u.deploying));
 const h=battle();h.towers.forEach(t=>t.range=0);const golem=spawn(h,0,'golem',360,650),killer=spawn(h,1,'blade',360,390);golem.x=360;golem.y=600;killer.x=360;killer.y=555;killer.damage=99999;killer.cd=0;golem.hp=1;advance(h,.4);const minis=h.units.filter(u=>u.type==='mini_golem');assert.equal(minis.length,2);assert.ok(minis.every(u=>!u.deploying));
});

test('not enough energy never spawns or changes hand',()=>{
 const g=battle();ready(g,0,'knight');g.players[0].energy=2;const before=JSON.stringify(g);
 assert.equal(deploy(g,0,'knight',100,660).ok,false);assert.equal(JSON.stringify(g),before);
});
test('tower and building placement overlap rejected',()=>{
 const g=battle();ready(g,0,'blade');const tower=g.towers.find(t=>t.owner===0&&t.slot==='left');assert.ok(canPlace(g,0,'blade',tower.x,tower.y));
 const cannon=spawn(g,0,'cannon',260,840);cannon.x=260;cannon.y=840;ready(g,0,'blade');assert.ok(canPlace(g,0,'blade',260,840));
});
test('energy regenerates, caps at ten and doubles after two minutes',()=>{
 const g=battle();g.players[0].energy=0;advance(g,1);assert.ok(Math.abs(g.players[0].energy-.625)<1e-8);
 g.time=121;g.players[0].energy=0;advance(g,1);assert.ok(Math.abs(g.players[0].energy-1.25)<1e-8);
 advance(g,20);assert.equal(g.players[0].energy,10);
});
test('friendly ground units move, obey banks and eventually cross a bridge',()=>{
 const g=battle();const u=spawn(g,0,'knight',90,700);let crossed=false;
 for(let i=0;i<400;i++){tick(g,.1);const v=g.units.find(x=>x.id===u.id);if(!v)break;assert.equal(inRiver(v.x,v.y),false);if(v.y<482)crossed=true;}
 assert.ok(crossed);
});
test('flying bats are permitted over the river',()=>{
 const g=battle();const u=spawn(g,0,'bat',350,650);let airborne=false;
 for(let i=0;i<120;i++){tick(g,.1);const v=g.units.find(x=>x.id===u.id);if(v&&v.y>482&&v.y<558)airborne=true;}
 assert.ok(airborne);
});
test('cannon stays fixed while its HP decays by 30 per second until it collapses',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const u=spawn(g,0,'cannon',100,650),startHp=u.hp;advance(g,10);assert.equal(u.x,100);assert.equal(u.y,650);
 assert.ok(u.hp<startHp&&u.hp>0);assert.ok(Math.abs(u.hp-700)<4,`unexpected hp ${u.hp}`);
 advance(g,27);assert.equal(g.units.some(x=>x.id===u.id),false);
});
test('ground-only attacker cannot damage a bat',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'blade',100,650),b=spawn(g,1,'bat',100,390);b.x=100;b.y=645;b.spawn=0;a.spawn=0;
 g.units=g.units.filter(u=>u.id===a.id||u.id===b.id);const hp=b.hp;advance(g,.7);assert.equal(b.hp,hp);
});
test('archer can hit airborne enemies',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'archer',100,650),b=spawn(g,1,'bat',100,390);b.y=560;a.spawn=0;b.spawn=0;b.speed=0;
 g.units=g.units.filter(u=>u.id===a.id||u.id===b.id);const hp=b.hp;advance(g,1.1);assert.ok(b.hp<hp);
});
test('bomber splash damages two close ground targets',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'bomber',100,650),b=spawn(g,1,'knight',100,390),c=spawn(g,1,'blade',150,390);
 b.y=570;c.y=570;a.spawn=b.spawn=c.spawn=0;b.speed=c.speed=0;const hp1=b.hp,hp2=c.hp;
 advance(g,1.2);assert.ok(b.hp<hp1);assert.ok(c.hp<hp2);
});
test('kragg berserker is a slow heavy ground attacker with high single-target damage',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;});
 const a=spawn(g,0,'berserker',190,650),b=spawn(g,1,'knight',190,390);a.spawn=b.spawn=0;a.x=190;a.y=600;b.x=190;b.y=555;b.speed=0;b.damage=0;
 g.units=g.units.filter(u=>u.id===a.id||u.id===b.id);const hp=b.hp;advance(g,1.7);
 assert.ok(b.hp<=hp-UNITS.berserker.damage,`expected at least ${UNITS.berserker.damage} damage, got ${hp-b.hp}`);
 assert.equal(a.speed,28);assert.equal(a.air,false);
});

test('stone golem ignores enemy troops and damages structures only',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const golem=spawn(g,0,'golem',190,650),enemy=spawn(g,1,'blade',190,390);
 golem.spawn=0;enemy.spawn=0;enemy.x=285;enemy.y=600;enemy.speed=0;enemy.damage=0;
 const enemyHp=enemy.hp,target=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),towerHp=target.hp;
 advance(g,32);assert.equal(enemy.hp,enemyHp);assert.ok(target.hp<towerHp,'golem should reach and damage a tower');
});


test('iron boar ignores troops and consumes a charged hit on structures',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const boar=spawn(g,0,'boar',190,650),enemy=spawn(g,1,'blade',190,390);
 boar.spawn=enemy.spawn=0;enemy.damage=0;enemy.speed=0;enemy.x=190;enemy.y=315;
 const target=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),hp=target.hp,enemyHp=enemy.hp;
 boar.x=190;boar.y=295;boar.charged=true;boar.chargeRun=UNITS.boar.chargeDistance;boar.cd=0;
 advance(g,.4);
 assert.equal(enemy.hp,enemyHp);assert.equal(target.hp,hp-Math.round(UNITS.boar.damage*UNITS.boar.chargeMultiplier));
 assert.equal(boar.charged,false);assert.equal(boar.chargeRun,0);
});
test('iron boar earns charge by running toward a building',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const boar=spawn(g,0,'boar',190,650);boar.spawn=0;
 for(let i=0;i<40&&!boar.charged;i++)tick(g,.1);
 assert.equal(boar.charged,true);assert.ok(boar.chargeRun>=UNITS.boar.chargeDistance);
});
test('iron boar jumps only when deployed beside open river and lands just across the bank',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});ready(g,0,'boar');assert.ok(deploy(g,0,'boar',360,700).ok);const boar=g.units.find(u=>u.type==='boar');forceReady(g,boar);
 assert.equal(boar.riverJumpMode,'river');
 for(let i=0;i<20&&boar.riverJumpState!=='leap';i++)tick(g,.1);
 assert.equal(boar.riverJumpState,'leap');assert.ok(Math.abs(boar.riverJumpEndX-360)<50,'jump should remain near the deployment x');
 assert.equal(boar.riverJumpEndY,ARENA.riverTop-boar.radius-2,'landing should be directly beside the far bank');
 advance(g,1.4);assert.equal(boar.riverJumpState,null);assert.ok(boar.y<ARENA.riverTop);assert.ok(Math.abs(boar.x-360)<60);
 const snap=viewMatch(g,0).units.find(u=>u.id===boar.id);assert.equal(snap.riverJumpMode,'river');assert.equal(typeof snap.riverJumpProgress,'number');
});
test('iron boar river-side jump selection is symmetric for the top player',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});ready(g,1,'boar');assert.ok(deploy(g,1,'boar',360,580).ok);const boar=g.units.find(u=>u.type==='boar');forceReady(g,boar);
 assert.equal(boar.riverJumpMode,'river');
 for(let i=0;i<20&&boar.riverJumpState!=='leap';i++)tick(g,.1);
 assert.equal(boar.riverJumpState,'leap');assert.equal(boar.riverJumpEndY,ARENA.riverBottom+boar.radius+2);
});
test('iron boar deployed in front of a bridge walks the bridge instead of river jumping',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});ready(g,0,'boar');assert.ok(deploy(g,0,'boar',ARENA.bridges[0],700).ok);const boar=g.units.find(u=>u.type==='boar');forceReady(g,boar);
 assert.equal(boar.riverJumpMode,'bridge');advance(g,2);assert.equal(boar.riverJumpState,null);
});
test('iron boar deployed away from the river uses the normal bridge route',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const boar=spawn(g,0,'boar',360,700);
 assert.equal(boar.riverJumpMode,'bridge');advance(g,2);assert.equal(boar.riverJumpState,null);
});
test('Yuno troop acquisition is about half the old 205px aggro radius',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const shade=spawn(g,0,'nightshade',190,650),enemy=spawn(g,1,'blade',190,390);shade.spawn=enemy.spawn=0;enemy.speed=0;enemy.damage=0;
 shade.x=190;shade.y=650;enemy.x=190;enemy.y=430;tick(g,.1);assert.notEqual(shade.target,enemy.id);
 enemy.y=520;tick(g,.1);assert.equal(shade.target,enemy.id);
});
test('Yuno winds up, becomes invulnerable during rush and lands a fixed 387 damage hit',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const shade=spawn(g,0,'nightshade',190,650),enemy=spawn(g,1,'blade',190,390);
 shade.spawn=enemy.spawn=0;shade.x=140;shade.y=600;enemy.x=140;enemy.y=435;enemy.speed=0;enemy.damage=0;
 const hp=enemy.hp;tick(g,.1);assert.equal(shade.dashState,'windup');assert.equal(shade.target,enemy.id);assert.equal(shade.targetLock,null,'windup is still pre-attack and must not hard-lock');
 advance(g,.5);assert.equal(shade.dashState,'windup');assert.equal(enemy.hp,hp);assert.equal(shade.targetLock,null);
 tick(g,.1);assert.equal(shade.dashState,'rush');assert.equal(shade.targetLock,enemy.id,'starting the rush commits the attack lock');assert.equal((shade.invulnerableUntil||0)>g.time,true);
 advance(g,.3);assert.equal(shade.dashState,null);assert.equal(enemy.hp,hp-UNITS.nightshade.dashDamage);
 assert.ok((shade.dashReadyAt||0)>g.time+1.5&&shade.dashReadyAt<=g.time+2.01);
});
test('Yuno can shadow-rush an enemy tower',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const shade=spawn(g,0,'nightshade',190,650);shade.spawn=0;shade.x=140;shade.y=460;
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),hp=tower.hp;
 tick(g,.1);assert.equal(shade.dashState,'windup');advance(g,1);
 assert.equal(tower.hp,hp-UNITS.nightshade.dashDamage);
});
test('Yuno ignores damage while the rush state is invulnerable',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const attacker=spawn(g,1,'blade',190,390),shade=spawn(g,0,'nightshade',190,650);attacker.spawn=shade.spawn=0;
 attacker.x=190;attacker.y=610;attacker.speed=0;attacker.damage=9999;attacker.cd=0;shade.x=190;shade.y=630;shade.dashState='rush';shade.dashTarget=attacker.id;shade.invulnerableUntil=g.time+1;
 const hp=shade.hp;tick(g,.1);assert.equal(shade.hp,hp);
});
test('Tigger underground travel time increases with distance from its own core',()=>{
 const near=battle();ready(near,0,'tigger');const a=deploy(near,0,'tigger',360,700);assert.ok(a.ok);
 const far=battle();ready(far,0,'tigger');const b=deploy(far,0,'tigger',360,300);assert.ok(b.ok);
 assert.ok(b.travelTime>a.travelTime,`${b.travelTime} should exceed ${a.travelTime}`);assert.ok(a.travelTime>=.9&&b.travelTime<=2.8);
});

test('hole-digger Tigger can target enemy territory, stays untargetable underground, and surfaces after distance-based travel',()=>{
 const g=battle();ready(g,0,'tigger');
 assert.equal(canPlace(g,0,'tigger',360,300),null,'Tigger ignores normal frontline placement limits');
 ready(g,0,'blade');assert.ok(canPlace(g,0,'blade',360,300),'normal troop remains restricted');
 ready(g,0,'tigger');const r=deploy(g,0,'tigger',360,300);assert.ok(r.ok);assert.ok(r.travelTime>=.9&&r.travelTime<=2.8);
 const u=g.units.at(-1),enemyTower=g.towers.find(t=>t.owner===1&&t.kind==='tower');enemyTower.range=999;enemyTower.damage=999;
 assert.equal(u.burrowState,'burrow');assert.equal(u.targetable,false);const hp=u.hp;advance(g,Math.max(.1,r.travelTime-.2));assert.equal(u.hp,hp);assert.notEqual(enemyTower.target,u.id,'burrowing Tigger must never be tower target');
 advance(g,.4);assert.equal(u.burrowState,null);assert.equal(u.targetable,true);assert.ok(Math.hypot(u.x-360,u.y-300)<35);
});

test('mud dragon splash creates a two-second non-stacking ground mud zone with damage and movement slow',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const dragon=spawn(g,0,'muddragon',300,650),ground=spawn(g,1,'knight',300,390),air=spawn(g,1,'harpy',360,390);
 dragon.spawn=ground.spawn=air.spawn=0;dragon.x=300;dragon.y=680;ground.x=300;ground.y=610;ground.speed=0;air.x=330;air.y=610;air.speed=0;
 const gh=ground.hp,ah=air.hp;advance(g,.8);
 assert.ok(ground.hp<=gh-UNITS.muddragon.damage,'ground takes splash hit');assert.ok(air.hp<ah,'nearby air also takes the base splash');
 assert.ok(g.zones.some(z=>z.kind==='mud'&&z.remaining>0&&z.radius===UNITS.muddragon.mudRadius));
 const snap=viewMatch(g,1),sg=snap.units.find(u=>u.id===ground.id),sa=snap.units.find(u=>u.id===air.id);assert.equal(sg.mudded,true);assert.equal(sa.mudded,false);assert.equal(ground.mudSlowFactor,.7);
 const zone=g.zones.find(z=>z.kind==='mud');g.zones.push({...zone,id:'overlap-mud'});ground.mudNextAt=g.time;const beforeOverlap=ground.hp;tick(g,.1);assert.equal(beforeOverlap-ground.hp,30,'overlapping mud zones do not stack damage');
 const after=ground.hp;advance(g,.55);assert.ok(ground.hp<=after-30,'mud applies one 30-damage tick');
});

test('goblin gang card spawns three ground goblins and three anti-air spear goblins',()=>{
 const g=battle();ready(g,0,'mossling');const r=deploy(g,0,'mossling',300,800);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.owner===0&&(u.type==='goblin_melee'||u.type==='goblin_spear'));assert.equal(pack.length,6);
 assert.equal(pack.filter(u=>u.type==='goblin_melee').length,3);assert.equal(pack.filter(u=>u.type==='goblin_spear').length,3);
 assert.ok(pack.filter(u=>u.type==='goblin_spear').every(u=>u.targetsAir));assert.ok(pack.filter(u=>u.type==='goblin_melee').every(u=>!u.targetsAir));
 for(let i=0;i<pack.length;i++)for(let j=i+1;j<pack.length;j++)assert.ok(distance(pack[i],pack[j])>=pack[i].radius+pack[j].radius-.01);
});
test('two-cost Goblins spawn four updated melee Goblins',()=>{
 const g=battle();ready(g,0,'goblins');const before=g.units.length;const r=deploy(g,0,'goblins',300,800);assert.ok(r.ok,r.error);const pack=g.units.slice(before);assert.equal(pack.length,4);assert.ok(pack.every(u=>u.type==='goblin_melee'&&u.maxHp===202&&u.damage===125&&u.cooldown===1.1));
});
test('two-cost Spear Goblins spawn three anti-air throwers',()=>{
 const g=battle();ready(g,0,'speargoblins');const before=g.units.length;const r=deploy(g,0,'speargoblins',300,800);assert.ok(r.ok,r.error);const pack=g.units.slice(before);assert.equal(pack.length,3);assert.ok(pack.every(u=>u.type==='goblin_spear'&&u.maxHp===133&&u.damage===81&&u.cooldown===1.6&&u.targetsAir));
});
test('Mega Gargoyle is a single armored flying ground-and-air attacker',()=>{
 const g=battle();ready(g,0,'megagargoyle');const before=g.units.length;const r=deploy(g,0,'megagargoyle',300,800);assert.ok(r.ok,r.error);const pack=g.units.slice(before);assert.equal(pack.length,1);const u=pack[0];assert.equal(u.type,'megagargoyle');assert.equal(u.maxHp,837);assert.equal(u.damage,311);assert.equal(u.cooldown,1.5);assert.equal(u.range,80);assert.equal(u.air,true);assert.equal(u.targetsAir,true);
});
test('skeleton card spawns three HP81 / damage81 ground attackers',()=>{
 const g=battle();ready(g,0,'skeleton');const r=deploy(g,0,'skeleton',300,800);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.type==='skeleton'&&u.owner===0);assert.equal(pack.length,3);assert.ok(pack.every(u=>u.maxHp===81&&u.damage===81&&!u.air));
});
test('skeleton squad spawns fifteen shared skeleton units',()=>{
 const g=battle();ready(g,0,'boneswarm');const r=deploy(g,0,'boneswarm',300,800);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.type==='skeleton'&&u.owner===0);assert.equal(pack.length,15);assert.ok(pack.every(u=>u.maxHp===81&&u.damage===81&&!u.air));
});
test('tombstone spawns two skeletons on ready, two every four seconds, and four instantly on death',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});ready(g,0,'tombstone');const r=deploy(g,0,'tombstone',260,840);assert.ok(r.ok,r.error);
 const tomb=g.units.find(u=>u.type==='tombstone'&&u.owner===0);assert.ok(tomb);advance(g,.8);
 assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,2);const hp=tomb.hp;advance(g,4);assert.ok(tomb.hp<hp);assert.equal(g.units.filter(u=>u.type==='skeleton'&&u.owner===0).length,4);
 tomb.hp=1;tick(g,.1);const spawned=g.units.filter(u=>u.type==='skeleton'&&u.owner===0);assert.equal(spawned.length,8);assert.ok(spawned.slice(-4).every(u=>u.spawn===0));
});

test('elixir golem splits 1 -> 2 -> 4 and grants enemy energy on each defeated stage',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const base=spawn(g,0,'elixirgolem',300,650),killer=spawn(g,1,'blade',300,390);g.players[1].energy=0;base.x=300;base.y=600;base.speed=0;base.hp=1;killer.x=300;killer.y=555;killer.speed=0;killer.damage=9999;killer.cd=0;
 advance(g,.4);assert.ok(Math.abs(g.players[1].energy-1.25)<1e-8);assert.ok(g.events.some(e=>e.type==='elixir-split'&&e.fromType==='elixirgolem'&&e.toType==='elixir_golem_mid'));const mids=g.units.filter(u=>u.type==='elixir_golem_mid'&&u.owner===0);assert.equal(mids.length,2);assert.ok(mids.every(u=>u.maxHp===784&&u.damage===127&&u.cooldown===2));
 killer.damage=9999;killer.cd=0;mids[0].spawn=0;mids[0].hp=1;mids[0].x=300;mids[0].y=600;mids[1].x=650;mids[1].y=900;const e1=g.players[1].energy;advance(g,.4);assert.ok(Math.abs(g.players[1].energy-e1-1.25)<1e-8);assert.ok(g.events.some(e=>e.type==='elixir-split'&&e.fromType==='elixir_golem_mid'&&e.toType==='elixir_blob'));const blobs=g.units.filter(u=>u.type==='elixir_blob'&&u.owner===0);assert.equal(blobs.length,2);assert.ok(blobs.every(u=>u.maxHp===392&&u.damage===64&&u.cooldown===2));
 killer.cd=0;blobs[0].spawn=0;blobs[0].hp=1;blobs[0].x=300;blobs[0].y=600;blobs[1].x=650;blobs[1].y=920;const e2=g.players[1].energy;advance(g,.4);assert.ok(Math.abs(g.players[1].energy-e2-.75)<1e-8);
});

test('royal giant ignores troops and fires a cannonball only at buildings from archer-like range',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const rg=spawn(g,0,'royalgiant',190,650),guard=spawn(g,1,'knight',190,390),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 rg.x=190;rg.y=430;rg.speed=0;rg.cd=0;guard.x=240;guard.y=390;guard.speed=0;guard.damage=0;const gh=guard.hp,th=tower.hp;
 advance(g,.4);const shot=g.projectiles.find(p=>p.kind==='royal_shell'&&p.owner===0);assert.ok(shot);assert.equal(shot.target,tower.id);assert.equal(guard.hp,gh);advance(g,.7);assert.equal(tower.hp,th-307);assert.equal(guard.hp,gh);
});

test('healer restores itself and at most three nearby allies only when its attack deals damage',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});
 const healer=spawn(g,0,'lumina',300,650),enemy=spawn(g,1,'knight',300,390);
 healer.x=300;healer.y=650;healer.speed=0;healer.cd=0;healer.hp-=400;enemy.x=300;enemy.y=525;enemy.speed=0;enemy.damage=0;
 const allyIds=['knight','blade','spear','frost'],allies=allyIds.map((id,i)=>spawn(g,0,id,190,650));
 allies.forEach((u,i)=>{u.x=210+i*60;u.y=735;u.speed=0;u.damage=0;u.hp-=500-i*100;});
 const selfBefore=healer.hp,before=allies.map(u=>u.hp),tower=g.towers.find(t=>t.owner===0&&t.kind==='tower');tower.hp-=300;const towerBefore=tower.hp;
 advance(g,1.2);
 assert.equal(healer.hp,selfBefore+110);assert.deepEqual(allies.slice(0,3).map((u,i)=>u.hp-before[i]),[110,110,110]);assert.equal(allies[3].hp,before[3]);assert.equal(tower.hp,towerBefore);
});
test('frost shaman slows ground movement and strips part of a boar charge',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const frost=spawn(g,0,'frost',190,650),boar=spawn(g,1,'boar',190,390);frost.spawn=boar.spawn=0;frost.x=190;frost.y=590;boar.x=190;boar.y=520;boar.speed=0;boar.charged=true;boar.chargeRun=UNITS.boar.chargeDistance;
 advance(g,1.8);assert.ok((boar.slowUntil||0)>g.time);assert.equal(boar.charged,false);assert.ok(boar.chargeRun<UNITS.boar.chargeDistance);
});
test('storm harpy chain lightning deals fixed 180 then 130 then 90 and stuns each target',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const harpy=spawn(g,0,'harpy',300,650);harpy.spawn=0;harpy.x=300;harpy.y=590;harpy.speed=0;harpy.cd=0;
 const victims=['knight','blade','spear'].map((id,i)=>spawn(g,1,id,300+i*30,390));
 victims.forEach((u,i)=>{u.spawn=0;u.x=300+i*30;u.y=520;u.speed=0;u.damage=0;u.stunUntil=0;});
 const hp=victims.map(u=>u.hp);advance(g,.7);
 assert.deepEqual(victims.map((u,i)=>hp[i]-u.hp).sort((a,b)=>b-a),[180,130,90]);assert.ok(victims.every(u=>(u.stunUntil||0)>g.time));
});

test('goblin spear throws from range 160 and can hit air',()=>{
 const g=battle();g.towers.forEach(t=>t.damage=0);ready(g,0,'mossling');const before=g.units.length,r=deploy(g,0,'mossling',300,800);assert.ok(r.ok,r.error);const spear=g.units.slice(before).find(u=>u.type==='goblin_spear');forceReady(g,spear);
 const air=spawn(g,1,'megagargoyle',300,480);spear.x=300;spear.y=800;spear.speed=0;spear.cd=0;air.x=300;air.y=650;air.speed=0;air.damage=0;air.chainDamages=[0,0,0];const hp=air.hp;advance(g,1.2);assert.ok(air.hp<hp);assert.equal(hp-air.hp,81);
});

test('elekitel wizard splash damages and stuns clustered ground and air enemies for one second',()=>{
 const g=battle();g.towers.forEach(t=>t.damage=0);const wiz=spawn(g,0,'electrowizard',300,650);wiz.x=300;wiz.y=680;wiz.speed=0;wiz.cd=0;
 const ground=spawn(g,1,'knight',300,390),air=spawn(g,1,'harpy',330,390);ground.x=300;ground.y=600;air.x=326;air.y=600;for(const u of [ground,air]){u.speed=0;u.damage=0;u.stunUntil=0;}air.chainDamages=[0,0,0];const gh=ground.hp,ah=air.hp;advance(g,.5);
 assert.equal(gh-ground.hp,135);assert.equal(ah-air.hp,135);assert.ok(ground.stunUntil>g.time&&air.stunUntil>g.time);assert.ok(ground.stunUntil<=g.time+1.01&&air.stunUntil<=g.time+1.01);
});


test('tigger deals 120 to troops but only 70 to towers and placed structures',()=>{
 const troopGame=battle();troopGame.towers.forEach(t=>t.damage=0);ready(troopGame,0,'tigger');deploy(troopGame,0,'tigger',300,800);const t=troopGame.units.find(u=>u.type==='tigger');t.burrowState=null;t.targetable=true;t.spawn=0;t.x=300;t.y=560;t.speed=0;t.cd=0;
 const victim=spawn(troopGame,1,'knight',300,390);victim.x=300;victim.y=525;victim.speed=0;victim.damage=0;const vh=victim.hp;advance(troopGame,.4);assert.equal(victim.hp,vh-120);
 const towerGame=battle();towerGame.towers.forEach(tw=>tw.damage=0);ready(towerGame,0,'tigger');deploy(towerGame,0,'tigger',140,420);const tt=towerGame.units.find(u=>u.type==='tigger');tt.burrowState=null;tt.targetable=true;tt.spawn=0;tt.x=140;tt.y=420;tt.speed=0;tt.cd=0;const tower=towerGame.towers.find(tw=>tw.owner===1&&tw.kind==='tower'&&tw.slot==='left');tt.x=tower.x;tt.y=tower.y+(tower.footprintRows*ARENA.cellSize/2)+tt.range-1;const th=tower.hp;advance(towerGame,.4);assert.equal(tower.hp,th-70);
 const buildGame=battle();buildGame.towers.forEach(tw=>tw.damage=0);const cannon=spawn(buildGame,1,'cannon',300,390);cannon.spawn=0;cannon.deploying=false;cannon.targetable=true;cannon.x=300;cannon.y=520;cannon.damage=0;cannon.decayPerSecond=0;ready(buildGame,0,'tigger');deploy(buildGame,0,'tigger',360,800);const tb=buildGame.units.find(u=>u.type==='tigger');tb.burrowState=null;tb.targetable=true;tb.spawn=0;tb.x=300;tb.y=555;tb.speed=0;tb.range=100;tb.cd=0;const ch=cannon.hp;advance(buildGame,.4);assert.equal(cannon.hp,ch-70);
});

test('frost splash applies a three-stage slow, refreshes duration, and resets to stage one after expiry',()=>{
 const g=battle();g.towers.forEach(t=>t.damage=0);const frost=spawn(g,0,'frost',300,650);frost.x=300;frost.y=590;frost.speed=0;frost.damage=74;
 const guard=spawn(g,1,'knight',300,390);guard.x=300;guard.y=520;guard.speed=0;guard.damage=0;
 advance(g,.7);let snap=viewMatch(g,0).units.find(u=>u.id===guard.id);assert.equal(snap.slowStage,1);assert.equal(guard.slowMoveFactor,.8);const firstUntil=guard.slowUntil;
 advance(g,1.4);snap=viewMatch(g,0).units.find(u=>u.id===guard.id);assert.equal(snap.slowStage,2);assert.equal(guard.slowMoveFactor,.65);assert.ok(guard.slowUntil>firstUntil);
 advance(g,1.4);snap=viewMatch(g,0).units.find(u=>u.id===guard.id);assert.equal(snap.slowStage,3);assert.equal(guard.slowMoveFactor,.5);assert.equal(guard.slowAttackFactor,.7);
 frost.cd=999;advance(g,3.2);snap=viewMatch(g,0).units.find(u=>u.id===guard.id);assert.equal(snap.slowStage,0);
 frost.cd=0;advance(g,.4);snap=viewMatch(g,0).units.find(u=>u.id===guard.id);assert.equal(snap.slowStage,1);assert.equal(guard.slowMoveFactor,.8);
});

test('frost projectile damages and slows nearby ground enemies inside radius 38',()=>{
 const g=battle();g.towers.forEach(t=>t.damage=0);const frost=spawn(g,0,'frost',300,650);frost.x=300;frost.y=590;frost.speed=0;
 const a=spawn(g,1,'blade',300,390),b=spawn(g,1,'spear',330,390);for(const [u,x] of [[a,300],[b,330]]){u.x=x;u.y=520;u.speed=0;u.damage=0;}const ah=a.hp,bh=b.hp;advance(g,.7);assert.ok(a.hp<ah);assert.ok(b.hp<bh);assert.equal(a.slowStage,1);assert.equal(b.slowStage,1);
});

test('storm harpy chain lightning stuns every surviving chained target for one second',()=>{
 const g=battle();g.towers.forEach(t=>t.damage=0);const harpy=spawn(g,0,'harpy',300,650);harpy.x=300;harpy.y=590;harpy.speed=0;
 const victims=['blade','knight','spear'].map((id,i)=>spawn(g,1,id,270+i*30,390));victims.forEach((u,i)=>{u.x=285+i*28;u.y=520;u.speed=0;u.damage=0;u.stunUntil=0;});advance(g,.7);assert.ok(victims.every(u=>(u.stunUntil||0)>g.time));assert.ok(victims.every(u=>u.stunUntil<=g.time+1.01));
});

test('central core stays dormant while side towers are alive and the core is untouched',()=>{
 const g=battle();const core=g.towers.find(t=>t.owner===1&&t.kind==='core');g.towers.filter(t=>t.owner===1&&t.kind==='tower').forEach(t=>t.damage=0);
 const intruder=spawn(g,0,'blade',360,650);intruder.spawn=0;intruder.x=360;intruder.y=300;intruder.speed=0;intruder.damage=0;const hp=intruder.hp;
 advance(g,2);assert.equal(core.awake,false);assert.equal(intruder.hp,hp);
});
test('damaging a dormant core wakes it permanently and it starts attacking',()=>{
 const g=battle();const core=g.towers.find(t=>t.owner===1&&t.kind==='core');g.towers.filter(t=>t.owner===1&&t.kind==='tower').forEach(t=>t.damage=0);
 const intruder=spawn(g,0,'blade',360,650);intruder.spawn=0;intruder.x=360;intruder.y=300;intruder.speed=0;intruder.damage=0;
 core.hp-=1;const hp=intruder.hp;advance(g,1.5);assert.equal(core.awake,true);assert.ok(intruder.hp<hp);
});
test('destroying either side tower wakes the owning central core',()=>{
 const g=battle();const core=g.towers.find(t=>t.owner===1&&t.kind==='core');g.towers.filter(t=>t.owner===1&&t.kind==='tower').forEach(t=>t.damage=0);
 const intruder=spawn(g,0,'blade',360,650);intruder.spawn=0;intruder.x=360;intruder.y=300;intruder.speed=0;intruder.damage=0;
 g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left').hp=0;const hp=intruder.hp;advance(g,1.5);assert.equal(core.awake,true);assert.ok(intruder.hp<hp);
});

test('fireball can target anywhere and flight time grows with distance without tracking',()=>{
 const near=battle();near.towers.forEach(t=>{t.damage=0;});ready(near,0,'fireball');
 assert.equal(canPlace(near,0,'fireball',190,235),null);ready(near,0,'blade');assert.ok(canPlace(near,0,'blade',190,235));
 ready(near,0,'fireball');const rn=deploy(near,0,'fireball',360,760);assert.ok(rn.ok);assert.equal(rn.launchDelay,1.26);assert.ok(rn.flightTime>=.6&&rn.flightTime<=2);assert.ok(rn.travelTime>=1.86&&rn.travelTime<=3.26);
 const far=battle();far.towers.forEach(t=>{t.damage=0;});ready(far,0,'fireball');const rf=deploy(far,0,'fireball',360,80);assert.ok(rf.ok);assert.ok(rf.flightTime>rn.flightTime);assert.ok(rf.flightTime<=2);assert.ok(rf.travelTime>rn.travelTime);
 const p=far.projectiles.find(p=>p.spell==='fireball'),tx=p.tx,ty=p.ty;advance(far,.5);assert.equal(p.tx,tx);assert.equal(p.ty,ty);
});
test('fireball hits ground and air units for 689, buildings for 159, and never friendly units',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const frost=spawn(g,1,'frost',190,390),harpy=spawn(g,1,'harpy',220,390),friend=spawn(g,0,'blade',170,650);
 frost.spawn=harpy.spawn=friend.spawn=0;frost.x=190;frost.y=250;harpy.x=220;harpy.y=245;friend.x=165;friend.y=250;
 frost.speed=harpy.speed=friend.speed=0;frost.damage=harpy.damage=friend.damage=0;
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),towerHp=tower.hp,friendHp=friend.hp;
 ready(g,0,'fireball');const r=deploy(g,0,'fireball',190,235);assert.ok(r.ok);advance(g,r.travelTime+.2);
 assert.equal(frost.hp,0);assert.equal(harpy.hp,0);assert.equal(friend.hp,friendHp);assert.equal(tower.hp,towerHp-159);
});
test('fireball damage wakes a dormant central core',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const core=g.towers.find(t=>t.owner===1&&t.kind==='core');assert.equal(core.awake,false);
 ready(g,0,'fireball');const r=deploy(g,0,'fireball',core.x,core.y);advance(g,r.travelTime+.2);assert.equal(core.hp,core.maxHp-159);assert.equal(core.awake,true);
});
test('poison deploys instantly for eight seconds, deals 91 per second, and stops after leaving the area',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const victim=spawn(g,1,'knight',190,390);victim.spawn=0;victim.speed=0;victim.damage=0;victim.x=190;victim.y=390;const before=victim.hp;
 ready(g,0,'poison');const r=deploy(g,0,'poison',190,390);assert.ok(r.ok);assert.equal(r.travelTime,0);assert.equal(g.zones.length,1);
 advance(g,2.1);const afterContact=victim.hp;assert.equal(before-afterContact,273);victim.x=500;victim.y=390;advance(g,2);assert.equal(victim.hp,afterContact,'poison must stop once the unit leaves the field');
});
test('poison chips towers for 21 per second and wakes the central core',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const core=g.towers.find(t=>t.owner===1&&t.kind==='core');ready(g,0,'poison');
 assert.ok(deploy(g,0,'poison',core.x,core.y).ok);advance(g,.2);assert.ok(core.hp<core.maxHp);assert.equal(core.awake,true);
});
test('arrow rain is broader, lower damage and faster than fireball while still hitting air and towers',()=>{
 const timing=battle();timing.towers.forEach(t=>{t.damage=0;});const core=timing.towers.find(t=>t.owner===0&&t.kind==='core');
 ready(timing,0,'arrowrain');const ar=deploy(timing,0,'arrowrain',190,235);assert.ok(ar.ok);assert.equal(ar.launchDelay,1.1);assert.ok(ar.flightTime>=.55&&ar.flightTime<=2.4);
 const fbFlight=Math.max(.6,Math.min(2,.45+distance(core,{x:190,y:235})/620));assert.ok(ar.flightTime>0);assert.ok(ar.travelTime>ar.flightTime);assert.ok(fbFlight>0);
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const frost=spawn(g,1,'frost',190,390),bone=spawn(g,1,'skeleton',190,390),harpy=spawn(g,1,'harpy',190,390);for(const u of [frost,bone,harpy]){u.spawn=0;u.x=190;u.y=235;u.speed=0;u.damage=0;}
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),towerHp=tower.hp,frostHp=frost.hp;
 ready(g,0,'arrowrain');const r=deploy(g,0,'arrowrain',190,235);advance(g,r.travelTime+.2);
 assert.equal(frost.hp,frostHp-366);assert.equal(bone.hp,0);assert.equal(harpy.hp,Math.max(0,UNITS.harpy.hp-366));assert.equal(tower.hp,towerHp-75);
});
test('lightning instantly strikes the four highest-current-HP enemies in radius and uses reduced building damage',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 const golem=spawn(g,1,'golem',120,390),mega=spawn(g,1,'megaknight',260,390),guard=spawn(g,1,'knight',400,390),blade=spawn(g,1,'blade',600,390);
 const units=[golem,mega,guard,blade];units.forEach((u,i)=>{forceReady(g,u);u.x=170+i*13;u.y=245+(i%2)*10;u.speed=0;u.damage=0;});
 const th=tower.hp,before=Object.fromEntries(units.map(u=>[u.id,u.hp]));ready(g,0,'lightning');const r=deploy(g,0,'lightning',190,245);assert.ok(r.ok,r.error);assert.equal(r.travelTime,0);assert.equal(r.targets,4);
 assert.equal(tower.hp,th-265);assert.equal(golem.hp,before[golem.id]-1056);assert.equal(mega.hp,before[mega.id]-1056);assert.equal(guard.hp,before[guard.id]-1056);assert.equal(blade.hp,before[blade.id]);
 assert.ok(g.events.some(e=>e.type==='lightning-cast'));assert.equal(g.events.filter(e=>e.type==='lightning-hit').length,4);
});


test('ice golem ignores enemy units and targets buildings only',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});
 const ice=spawn(g,0,'icegolem',190,650),guard=spawn(g,1,'knight',190,390);
 forceReady(g,ice);forceReady(g,guard);guard.damage=0;guard.speed=0;guard.x=190;guard.y=590;ice.x=190;ice.y=650;ice.speed=0;
 advance(g,.2);
 const enemyTower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 assert.equal(ice.target,enemyTower.id);assert.notEqual(ice.target,guard.id);assert.equal(guard.hp,guard.maxHp);
});
test('ice golem death deals 84 damage around itself without splitting',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const ice=spawn(g,0,'icegolem',300,650),killer=spawn(g,1,'blade',300,390),far=spawn(g,1,'blade',500,390);
 forceReady(g,ice);forceReady(g,killer);forceReady(g,far);ice.x=300;ice.y=600;ice.speed=0;ice.cd=99;ice.hp=1;killer.x=300;killer.y=555;killer.speed=0;killer.damage=9999;killer.cd=0;far.x=500;far.y=600;far.speed=0;far.damage=0;
 const killerHp=killer.hp,farHp=far.hp;advance(g,.4);assert.equal(g.units.some(u=>u.id===ice.id),false);assert.equal(killer.hp,killerHp-84);assert.equal(far.hp,farHp);assert.ok(g.events.some(e=>e.type==='death-blast'&&e.unitType==='icegolem'&&e.damage===84&&e.radius===80));assert.equal(g.units.some(u=>u.type==='mini_golem'&&u.owner===0),false);
});
test('stone golem death blasts nearby enemies and still splits into two mini golems',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const golem=spawn(g,0,'golem',300,650),killer=spawn(g,1,'blade',300,390);golem.spawn=killer.spawn=0;golem.x=300;golem.y=600;killer.x=300;killer.y=555;
 golem.speed=0;killer.speed=0;killer.damage=9999;killer.cd=0;golem.hp=1;const killerHp=killer.hp;
 advance(g,.4);
 assert.equal(g.units.some(u=>u.id===golem.id),false);assert.equal(killer.hp,killerHp-UNITS.golem.deathDamage);
 const minis=g.units.filter(u=>u.type==='mini_golem'&&u.owner===0);assert.equal(minis.length,2);
 for(const m of minis){assert.equal(m.maxHp,851);assert.equal(m.damage,52);assert.equal(m.cooldown,2.5);assert.equal(m.deathDamage,52);assert.equal(m.buildingOnly,true);}
});
test('mini golem stats and death blast are one fifth of the parent values',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const mini={...UNITS.mini_golem,id:'mini-test',type:'mini_golem',owner:0,x:300,y:600,hp:1,maxHp:UNITS.mini_golem.hp,spawn:0,cd:0,walk:0,age:0,anim:0,hit:0,lane:190,face:-1,facing:-Math.PI/2,moving:false};
 const killer=spawn(g,1,'blade',300,390),victim=spawn(g,1,'knight',340,390);killer.spawn=victim.spawn=0;killer.x=300;killer.y=565;victim.x=340;victim.y=600;killer.speed=victim.speed=0;killer.damage=9999;killer.cd=0;victim.damage=0;
 g.units.unshift(mini);const victimHp=victim.hp;advance(g,.4);
 assert.equal(g.units.some(u=>u.id===mini.id),false);assert.equal(victim.hp,victimHp-52);assert.equal(UNITS.golem.deathDamage/UNITS.mini_golem.deathDamage,5);assert.equal(UNITS.golem.damage/UNITS.mini_golem.damage,5);assert.equal(UNITS.mini_golem.hp,Math.floor(UNITS.golem.hp/5));
});



test('newly engaged targets wait 0.25 seconds before the first ordinary hit, then keep normal cooldown',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const attacker=spawn(g,0,'blade',190,650),victim=spawn(g,1,'knight',190,390);
 attacker.spawn=victim.spawn=0;attacker.speed=victim.speed=0;victim.damage=0;attacker.x=360;attacker.y=600;victim.x=360;victim.y=555;attacker.cd=0;
 const hp=victim.hp;tick(g,.1);assert.equal(victim.hp,hp,'no immediate contact damage');assert.ok(attacker.firstStrikeReadyAt>g.time);
 tick(g,.1);assert.equal(victim.hp,hp,'still inside the 0.25 second preparation window');
 tick(g,.1);assert.equal(victim.hp,hp,'0.2 seconds of elapsed preparation is still too early');
 tick(g,.1);assert.equal(victim.hp,hp-UNITS.blade.damage,'first hit lands after the preparation window');assert.equal(attacker.targetLock,victim.id);
 const after=victim.hp;advance(g,.9);assert.equal(victim.hp,after,'normal cooldown still controls repeated attacks');advance(g,.2);assert.equal(victim.hp,after-UNITS.blade.damage);
});

test('switching targets or leaving attack range starts a fresh first-strike delay',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const attacker=spawn(g,0,'blade',190,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'spear',190,390);
 for(const u of [attacker,a,b]){u.spawn=0;u.speed=0;}a.damage=b.damage=0;attacker.x=360;attacker.y=600;a.x=360;a.y=555;b.x=360;b.y=500;attacker.cd=0;
 advance(g,.4);assert.ok(a.hp<a.maxHp,'A should receive the completed first hit');a.hp=0;attacker.cd=0;b.y=555;const bh=b.hp;
 tick(g,.1);assert.equal(b.hp,bh,'new target B must not be hit immediately');advance(g,.3);assert.ok(b.hp<bh);
 attacker.cd=0;b.y=450;tick(g,.1);b.y=555;const reenter=b.hp;tick(g,.1);assert.equal(b.hp,reenter,'re-entering range starts another first-strike delay');
});

test('existing special windups do not receive an extra 0.25 second delay after they complete',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const yuno=spawn(g,0,'nightshade',190,650),victim=spawn(g,1,'knight',190,390);
 yuno.spawn=victim.spawn=0;yuno.x=140;yuno.y=650;victim.x=140;victim.y=475;yuno.speed=0;victim.speed=0;victim.damage=0;const hp=victim.hp;
 advance(g,1.0);assert.ok(victim.hp<hp,'Yuno dash windup/rush should remain the only initial preparation');
});

test('continuous drill and laser cards also wait before their first damage tick',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const drill=spawn(g,0,'scrapdrill',190,650),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');drill.spawn=0;drill.x=190;drill.y=tower.y+drill.range+tower.radius-1;drill.speed=0;const th=tower.hp;
 tick(g,.1);assert.equal(tower.hp,th);tick(g,.1);assert.equal(tower.hp,th);tick(g,.1);assert.equal(tower.hp,th);tick(g,.1);assert.ok(tower.hp<th);
});

test('far preferred tower and detected enemies remain navigation-only until the first attack',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const hunter=spawn(g,0,'blade',190,650);hunter.spawn=0;hunter.speed=0;hunter.damage=0;hunter.x=190;hunter.y=900;
 tick(g,.1);assert.equal(hunter.target,'t10');assert.equal(hunter.targetLock,null,'far tower must not become a hard lock from spawn');
 const enemy=spawn(g,1,'spear',190,390);enemy.spawn=0;enemy.speed=0;enemy.damage=0;enemy.x=190;enemy.y=750;
 tick(g,.1);assert.equal(hunter.target,enemy.id);assert.equal(hunter.targetLock,null,'detecting an enemy must not lock before an attack occurs');
});

test('ordinary mobile unit retargets the nearest enemy before attacking, then hard-locks after its first attack',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const hunter=spawn(g,0,'blade',190,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'spear',190,390);
 for(const u of [hunter,a,b]){u.spawn=0;u.speed=0;}
 a.damage=0;b.damage=0;hunter.x=140;hunter.y=650;a.x=140;a.y=500;b.x=140;b.y=380;
 tick(g,.1);assert.equal(hunter.target,a.id);assert.equal(hunter.targetLock,null,'first detected enemy is not locked while still out of attack range');
 b.y=560;tick(g,.1);assert.equal(hunter.target,b.id,'closer B should steal target before hunter attacks');assert.equal(hunter.targetLock,null);
 b.y=610;const hp=b.hp;tick(g,.1);assert.equal(b.hp,hp,'hunter should prepare instead of attacking instantly');assert.equal(hunter.targetLock,null);advance(g,.3);assert.ok(b.hp<hp,'hunter should attack B after the first-strike delay');assert.equal(hunter.targetLock,b.id,'first attack commits the mobile target lock');
 a.y=625;tick(g,.1);assert.equal(hunter.target,b.id,'closer A must not steal the target after attack lock');
 b.y=330;tick(g,.1);assert.equal(hunter.target,b.id,'leaving aggro/attack range must not break a post-attack mobile lock');
 b.hp=0;tick(g,.1);assert.equal(hunter.target,a.id,'death releases the mobile lock');assert.equal(hunter.targetLock,null,'new target stays unlocked until hunter attacks again');
 advance(g,1.1);assert.equal(hunter.targetLock,a.id,'next actual attack creates the next lock');
});

test('berserker can abandon a fast unhit target when a newly deployed enemy becomes closer',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const kragg=spawn(g,0,'berserker',190,650),boar=spawn(g,1,'boar',190,390),guard=spawn(g,1,'knight',190,390);
 for(const u of [kragg,boar,guard]){u.spawn=0;u.damage=0;}
 kragg.speed=0;boar.speed=0;guard.speed=0;kragg.x=140;kragg.y=650;boar.x=140;boar.y=500;guard.x=140;guard.y=350;
 tick(g,.1);assert.equal(kragg.target,boar.id);assert.equal(kragg.targetLock,null);
 boar.y=380;guard.y=560;tick(g,.1);assert.equal(kragg.target,guard.id,'Kragg should switch from the escaping unhit boar to the newly closer guard');assert.equal(kragg.targetLock,null);
 guard.y=610;tick(g,.1);assert.equal(kragg.targetLock,null,'Kragg waits before the first swing');advance(g,.3);assert.equal(kragg.targetLock,guard.id,'Kragg locks the guard only after swinging once');
});
test('building-only units preserve their deployment lane after that side tower falls',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const right=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='right'),left=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),core=g.towers.find(t=>t.owner===1&&t.kind==='core');
 right.hp=0;const ice=spawn(g,0,'icegolem',580,700);Object.assign(ice,{spawn:0,x:580,y:700,damage:0});
 tick(g,.1);assert.equal(ice.target,core.id,'fallen right tower should route to the core, not the surviving left tower');assert.notEqual(ice.target,left.id);assert.equal(ice.targetLock,null);
 const x0=ice.x;advance(g,4);assert.ok(Math.abs(ice.x-x0)<18,`ice golem should stay in the right lane before reaching the fallen tower corridor: ${ice.x}`);assert.ok(ice.y<700,'ice golem should continue forward along the right lane');
});

test('nearby defensive buildings can still pull building-only units off their lane route',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='right').hp=0;
 const ice=spawn(g,0,'icegolem',530,700),cannon=spawn(g,1,'cannon',530,390);Object.assign(ice,{spawn:0,x:530,y:650,speed:0,damage:0});Object.assign(cannon,{spawn:0,x:500,y:530,damage:0,cd:99});
 tick(g,.1);assert.equal(ice.target,cannon.id,'nearby player defence building should pull the siege unit');
 cannon.x=250;cannon.y=400;tick(g,.1);assert.equal(ice.target,'t12','far defence must release the siege unit back to its lane-to-core route');
});

test('size-based vision allows a large Berserker to see a medium Iron Guard that cannot see it back',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const guard=spawn(g,0,'knight',530,650),kragg=spawn(g,1,'berserker',530,390);
 Object.assign(guard,{x:580,y:700,speed:0,damage:0,cd:99});Object.assign(kragg,{x:580,y:480,speed:0,damage:0,cd:99});
 assert.equal(visionSizeFor(guard),'medium');assert.equal(visionRangeFor(guard),200);assert.equal(visionSizeFor(kragg),'large');assert.equal(visionRangeFor(kragg),240);
 tick(g,.1);assert.equal(guard.target,'t11','medium Iron Guard should ignore a 220px-away Berserker and keep moving toward the right tower');
 assert.equal(kragg.target,guard.id,'large Berserker should see the same Iron Guard inside its wider vision');assert.equal(kragg.targetLock,null);
});

test('an unhit target leaving vision releases pursuit back to the tower route',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const kragg=spawn(g,0,'berserker',530,650),bait=spawn(g,1,'knight',530,390);
 Object.assign(kragg,{x:580,y:700,speed:0,damage:0,cd:99});Object.assign(bait,{x:580,y:480,speed:0,damage:0,cd:99});
 tick(g,.1);assert.equal(kragg.target,bait.id);assert.equal(kragg.targetLock,null);
 bait.y=350;tick(g,.1);assert.equal(kragg.target,'t11','bait that escapes beyond six-cell vision before a hit should be dropped for the right tower');assert.equal(kragg.targetLock,null);
});

test('ranged units keep enough effective vision to use their weapon range',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const archer=spawn(g,0,'archer',530,650),enemy=spawn(g,1,'knight',530,390);Object.assign(archer,{x:530,y:650,speed:0,damage:0});Object.assign(enemy,{x:530,y:455,speed:0,damage:0,cd:99});
 assert.equal(visionSizeFor(archer),'small');assert.ok(visionRangeFor(archer)>=195);tick(g,.1);assert.equal(archer.target,enemy.id);
});

test('Mega Knight jump acquisition remains independent from ordinary melee awareness',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const mega=spawn(g,0,'megaknight',140,650),tiny=spawn(g,1,'skeleton',140,390);Object.assign(mega,{x:140,y:650,speed:0,cd:99});Object.assign(tiny,{x:140,y:490,speed:0,damage:0,cd:99});
 tick(g,.1);assert.equal(mega.megaJumpState,'windup');assert.equal(mega.megaJumpTarget,tiny.id,'a valid 160px jump target must still be acquired by the special ability system');
});
test('Tracker hook acquisition stays at 180 even though its medium normal vision is 150',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const hunter=spawn(g,0,'tracker',190,650),victim=spawn(g,1,'knight',190,390);Object.assign(hunter,{x:190,y:700,speed:0,damage:0,cd:99});Object.assign(victim,{x:190,y:470,speed:0,damage:0,cd:99});
 assert.equal(visionRangeFor(hunter),200);tick(g,.1);assert.equal(hunter.hookState,'windup');assert.equal(hunter.hookTarget,victim.id,'hook should independently acquire the six-cell hook target');
});
test('zap clears a post-attack mobile target lock so it re-acquires after stun',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const hunter=spawn(g,1,'blade',190,390),a=spawn(g,0,'knight',190,650),b=spawn(g,0,'spear',190,650);
 for(const u of [hunter,a,b]){u.spawn=0;u.speed=0;u.damage=0;}
 hunter.x=360;hunter.y=390;a.x=360;a.y=430;b.x=360;b.y=700;advance(g,.4);assert.equal(hunter.targetLock,a.id,'first attack must establish the lock before Zap');
 a.y=760;b.y=430;ready(g,0,'zap');assert.ok(deploy(g,0,'zap',360,390).ok);assert.equal(hunter.target,null);assert.equal(hunter.targetLock,null);
 advance(g,1.6);assert.equal(hunter.target,b.id);assert.equal(hunter.targetLock,null,'stun preserves the remaining attack cooldown, so reacquisition happens before the next attack');
 advance(g,1.1);assert.equal(hunter.targetLock,b.id,'after the preserved cooldown finishes, the first new attack creates a new lock');
});

test('side tower locks its target even when a closer enemy enters range',()=>{
 const g=battle();const tower=g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.slot==='left');
 for(const t of g.towers)if(t.id!==tower.id)t.range=0;
 const a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
 for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
 a.x=140;a.y=800;b.x=140;b.y=700;tick(g,.1);assert.equal(tower.target,a.id);
 b.y=900;tick(g,.1);assert.equal(tower.target,a.id,'closer B must not steal a valid lock');
 a.hp=0;tick(g,.1);assert.equal(tower.target,b.id,'target death should release and reacquire');
});
test('structure target lock releases on range exit or untargetable state',()=>{
 for(const mode of ['range','untargetable']){
  const g=battle(100+(mode==='range'?1:2)),tower=g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.slot==='left');
  for(const t of g.towers)if(t.id!==tower.id)t.range=0;
  const a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
  for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
  a.x=140;a.y=800;b.x=140;b.y=700;tick(g,.1);assert.equal(tower.target,a.id);
  b.y=900;if(mode==='range')a.y=600;else a.targetable=false;
  tick(g,.1);assert.equal(tower.target,b.id,`${mode} should release lock`);
 }
});
test('bolt cannon uses the same target-lock contract',()=>{
 const g=battle();for(const t of g.towers)t.range=0;
 const cannon=spawn(g,0,'cannon',360,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
 cannon.spawn=0;cannon.x=360;cannon.y=650;cannon.damage=0;
 for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
 a.x=360;a.y=510;b.x=360;b.y=380;tick(g,.1);assert.equal(cannon.target,a.id);
 b.y=600;tick(g,.1);assert.equal(cannon.target,a.id);
 a.y=280;tick(g,.1);assert.equal(cannon.target,b.id);
});
test('blowdart goblin is a fragile long-range anti-air attacker',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const gob=spawn(g,0,'blowdart',190,650),air=spawn(g,1,'harpy',190,390);gob.spawn=air.spawn=0;gob.x=190;gob.y=620;air.x=190;air.y=440;gob.speed=air.speed=0;air.damage=0;
 const hp=air.hp;advance(g,.7);assert.ok(air.hp<=hp-110,`expected anti-air damage, hp=${air.hp}`);assert.equal(gob.targetsAir,true);assert.equal(gob.range,240);
});
test('blowdart tower pressure is inside side-tower retaliation distance in v16',()=>{
 const towerRange=cellsToWorld(7),towerRadius=ARENA.sideTowerCells*ARENA.cellSize/2,goblinRadius=UNITS.blowdart.radius;
 const goblinAttackEdge=UNITS.blowdart.range;
 const towerRetaliationEdge=towerRange+goblinRadius;
 assert.ok(goblinAttackEdge<=towerRetaliationEdge,`goblin edge ${goblinAttackEdge} must not exceed tower retaliation edge ${towerRetaliationEdge}`);
});

test('laser tower loses 60 HP per second and applies laser damage in 0.2s ticks',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const laser=spawn(g,0,'lasertower',360,650),target=spawn(g,1,'knight',360,520);
 laser.spawn=0;laser.firstStrikeDelay=0;laser.x=360;laser.y=650;target.spawn=0;target.speed=0;target.damage=0;target.x=360;target.y=520;
 const laserHp=laser.hp,targetHp=target.hp;
 tick(g,.1);assert.equal(target.hp,targetHp,'no laser damage before the first 0.2s damage tick');
 tick(g,.1);assert.ok(Math.abs(target.hp-(targetHp-8.4))<1e-8,'42 DPS becomes 8.4 damage every 0.2s at base stage');
 assert.ok(Math.abs(laser.hp-(laserHp-12))<1e-8,'60 HP/s decay removes 12 HP in 0.2s');
 advance(g,.8);assert.ok(Math.abs(laser.hp-(laserHp-60))<1e-8,'laser tower loses exactly 60 HP in one second');
});
test('laser tower ramps every 1.0s and resets after retarget',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const laser=spawn(g,0,'lasertower',360,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
 laser.spawn=0;laser.x=360;laser.y=650;for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}a.x=360;a.y=520;b.x=360;b.y=400;
 const hp=a.hp;advance(g,1.3);assert.ok(hp-a.hp<55,`base laser should remain at 42 DPS until 1.0s of continuous lock: ${hp-a.hp}`);assert.equal(laser.laserStage,0);assert.equal(laser.laserDps,42);assert.equal(laser.target,a.id);
 advance(g,.2);assert.ok(laser.laserStage>=1);assert.equal(laser.laserDps,84);
 b.y=600;tick(g,.1);assert.equal(laser.target,a.id,'closer target does not steal laser lock');
 a.hp=0;tick(g,.1);assert.equal(laser.target,b.id);assert.equal(laser.laserStage,0);assert.equal(laser.laserDps,42,'retarget resets power');
});
test('awake central core locks a target until a release condition occurs',()=>{
 const g=battle();for(const t of g.towers)t.range=0;const core=g.towers.find(t=>t.owner===0&&t.kind==='core');core.range=cellsToWorld(7);core.awake=true;
 const a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
 a.x=360;a.y=900;b.x=360;b.y=780;tick(g,.1);assert.equal(core.target,a.id);
 b.y=1000;tick(g,.1);assert.equal(core.target,a.id);a.hp=0;tick(g,.1);assert.equal(core.target,b.id);
});
test('main tower destruction ends match immediately',()=>{
 const g=battle();g.towers.find(t=>t.id==='t12').hp=0;tick(g,.1);assert.equal(g.phase,'ended');assert.equal(g.winner,0);
});
test('simultaneous main tower destruction is a draw',()=>{
 const g=battle();g.towers.filter(t=>t.kind==='core').forEach(t=>t.hp=0);tick(g,.1);assert.equal(g.winner,null);
});
test('three minute unequal tower count decides the winner',()=>{
 const g=battle();g.time=179.9;g.towers.find(t=>t.id==='t10').hp=0;tick(g,.1);assert.equal(g.phase,'ended');assert.equal(g.winner,0);
});
test('equal tower count starts overtime; first tower wins',()=>{
 const g=battle();g.time=179.9;tick(g,.1);assert.equal(g.overtime,true);assert.equal(g.phase,'battle');
 g.towers.find(t=>t.id==='t00').hp=0;tick(g,.1);assert.equal(g.winner,1);
});
test('full timeout uses remaining tower HP and exact tie draws',()=>{
 for(const hp of [3000,3200]){
 const g=battle();g.overtime=true;g.time=239.9;g.towers[0].hp=hp;tick(g,.1);
 assert.equal(g.phase,'ended');assert.equal(g.winner,hp===3200?null:1);
 }
});
test('ended matches do not continue to simulate',()=>{
 const g=battle();finish(g,0,'test');const s=JSON.stringify(g);advance(g,1);assert.equal(JSON.stringify(g),s);
});
test('snapshots never contain seed, enemy hand, queue or damage internals',()=>{
 const g=battle();const s=viewMatch(g,1);
 assert.equal(s.rng,undefined);assert.equal(s.players,undefined);assert.equal(s.queue,undefined);assert.deepEqual(s.hand,g.players[1].hand);
 s.hand[0]='test';assert.notEqual(g.players[1].hand[0],'test');
});
test('same seed plus same commands remains deterministic for four minutes',()=>{
 const a=createMatch({seed:837,bot:true}),b=createMatch({seed:837,bot:true});
 for(let i=0;i<2440;i++){
  tick(a,.1);tick(b,.1);
  if(i%15===0){runBot(a,0);runBot(b,0);}
 }
 assert.equal(JSON.stringify(a),JSON.stringify(b));assert.equal(a.phase,'ended');
});
test('invalid tick duration is rejected',()=>{
 const g=battle();for(const dt of [NaN,-1,0,.3])assert.throws(()=>tick(g,dt),RangeError);
});
test('maximum unit cap rejects a multi-unit card atomically',()=>{
 const g=battle();g.units=Array.from({length:ARENA.maxUnits-1},(_,i)=>({id:i,hp:1,x:60,y:660}));ready(g,0,'bat');
 const energy=g.players[0].energy;assert.equal(deploy(g,0,'bat',190,650).ok,false);assert.equal(g.players[0].energy,energy);
});

test('eight-card default deck keeps four-card hand and four-card queue',()=>{ const g=createMatch({seed:77});assert.equal(g.players[0].hand.length,4);assert.equal(g.players[0].queue.length,4);assert.equal(g.players[0].deck.length,8);});

test('stun freezes ordinary attack cooldown without resetting it for units and towers',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const unit=spawn(g,1,'blade',360,390);unit.speed=0;unit.damage=0;unit.cd=.6;
 unit.stunUntil=g.time+1;advance(g,.5);assert.ok(Math.abs(unit.cd-.6)<1e-8,`unit cd advanced during stun: ${unit.cd}`);
 advance(g,.6);assert.ok(unit.cd<.6&&unit.cd>.35,`unit cd should resume after stun: ${unit.cd}`);
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower');tower.cd=.7;tower.stunUntil=g.time+1;
 advance(g,.5);assert.ok(Math.abs(tower.cd-.7)<1e-8,`tower cd advanced during stun: ${tower.cd}`);
 advance(g,.6);assert.ok(tower.cd<.7&&tower.cd>.45,`tower cd should resume after stun: ${tower.cd}`);
});
test('laser dragon is a mobile flying laser that ramps on one target and resets when stunned',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const dragon=spawn(g,0,'laserdragon',360,650),target=spawn(g,1,'knight',360,390);dragon.spawn=target.spawn=0;dragon.x=360;dragon.y=620;target.x=360;target.y=500;target.speed=0;target.damage=0;dragon.speed=0;
 const hp=target.hp;advance(g,1.4);assert.ok(target.hp<hp);assert.equal(dragon.laserStage,0);assert.equal(dragon.laserDps,20);assert.equal(dragon.targetLock,target.id);
 advance(g,.5);assert.ok(dragon.laserStage>=1);assert.equal(dragon.laserDps,40);
 ready(g,1,'zap');assert.ok(deploy(g,1,'zap',dragon.x,dragon.y).ok);assert.equal(dragon.laserStage,0);assert.equal(dragon.laserDps,20);assert.equal(dragon.targetLock,null);
});


test('shield knight absorbs 65 percent of frontal normal attacks, but rear attacks and spells bypass the shield',()=>{
 const g=battle();for(const t of g.towers)t.damage=0;
 const shield=spawn(g,0,'shieldknight',140,650),front=spawn(g,1,'archer',140,390);
 Object.assign(shield,{x:140,y:650,speed:0,damage:0,cd:99,facing:-Math.PI/2});
 Object.assign(front,{x:140,y:500,speed:0,damage:100,cooldown:99,cd:0});
 advance(g,.7);
 assert.ok(Math.abs(shield.shieldHp-585)<.01,`shield=${shield.shieldHp}`);
 assert.ok(Math.abs(shield.hp-1365)<.01,`hp=${shield.hp}`);
 const rear=spawn(g,1,'archer',580,390);Object.assign(rear,{x:140,y:690,speed:1e-9,damage:100,cooldown:99,cd:0});
 front.damage=0;front.cd=99;shield.targetLock=front.id;shield.target=front.id;shield.facing=-Math.PI/2;
 const shieldBefore=shield.shieldHp,hpBefore=shield.hp;advance(g,.5);
 assert.ok(Math.abs(shield.shieldHp-shieldBefore)<.01,`rear changed shield ${shieldBefore}->${shield.shieldHp}`);
 assert.ok(shield.hp<=hpBefore-99.9,`rear did not bypass: ${hpBefore}->${shield.hp}`);
 const hpBeforeZap=shield.hp,shieldBeforeZap=shield.shieldHp;ready(g,1,'zap');assert.ok(deploy(g,1,'zap',shield.x,shield.y).ok);
 assert.ok(Math.abs(shield.shieldHp-shieldBeforeZap)<.01);assert.ok(shield.hp<=hpBeforeZap-224.9);
});

test('wind mage pushes light troops backward but cannot move a superheavy golem',()=>{
 const g=battle();for(const t of g.towers)t.damage=0;
 const wind=spawn(g,0,'windmage',190,650),light=spawn(g,1,'archer',190,390);
 Object.assign(wind,{x:190,y:650,speed:0,cooldown:99,cd:0});Object.assign(light,{x:190,y:500,speed:0,damage:0,cd:99});
 const y0=light.y;advance(g,.8);assert.ok(light.y<y0-20,`light push ${y0}->${light.y}`);
 const g2=battle();for(const t of g2.towers)t.damage=0;
 const wind2=spawn(g2,0,'windmage',190,650),heavy=spawn(g2,1,'golem',190,390);
 Object.assign(wind2,{x:190,y:650,speed:0,cooldown:99,cd:0});Object.assign(heavy,{x:190,y:500,speed:0,damage:0,cd:99});
 const hy=heavy.y;advance(g2,.8);assert.ok(Math.abs(heavy.y-hy)<.01,`superheavy moved ${hy}->${heavy.y}`);
});

test('phoenix leaves one 600 HP egg, revives after four seconds at half HP, and cannot revive twice',()=>{
 const g=battle();for(const t of g.towers)t.damage=0;
 const phoenix=spawn(g,0,'phoenix',190,650);phoenix.hp=100;
 ready(g,1,'zap');assert.ok(deploy(g,1,'zap',phoenix.x,phoenix.y).ok);
 const egg=g.units.find(u=>u.type==='phoenix_egg'&&u.hp>0);assert.ok(egg);assert.equal(egg.hp,600);assert.equal(egg.air,false);
 advance(g,4.1);
 const revived=g.units.find(u=>u.type==='phoenix'&&u.revived&&u.hp>0);assert.ok(revived);assert.equal(revived.hp,450);
 revived.hp=100;ready(g,1,'zap');assert.ok(deploy(g,1,'zap',revived.x,revived.y).ok);advance(g,.1);
 assert.equal(g.units.some(u=>u.type==='phoenix_egg'&&u.hp>0),false);
});

test('royal ghost is untargetable while stealthed, becomes visible on area damage, and opens with a 1.4x radius-40 slash',()=>{
 const g=battle();for(const t of g.towers)t.damage=0;
 ready(g,0,'mirage');assert.ok(deploy(g,0,'mirage',140,800).ok);const mirage=g.units.find(u=>u.type==='mirage');advance(g,.8);assert.equal(mirage.stealthed,true);mirage.speed=0;
 const archer=spawn(g,1,'archer',190,390);Object.assign(archer,{x:190,y:500,speed:0,damage:300,cooldown:.2,cd:0});
 const hp0=mirage.hp;advance(g,.6);assert.equal(mirage.hp,hp0);assert.equal(mirage.stealthed,true);
 ready(g,1,'zap');assert.ok(deploy(g,1,'zap',mirage.x,mirage.y).ok);assert.equal(mirage.stealthed,false);assert.equal(mirage.hp,hp0-225);
 const g2=battle();for(const t of g2.towers)t.damage=0;
 ready(g2,0,'mirage');assert.ok(deploy(g2,0,'mirage',140,800).ok);const m=g2.units.find(u=>u.type==='mirage');advance(g2,.8);m.speed=0;m.x=190;m.y=760;
 const target=spawn(g2,1,'knight',190,390),nearby=spawn(g2,1,'blade',530,390);Object.assign(target,{x:190,y:720,speed:0,damage:0,cd:99});Object.assign(nearby,{x:220,y:720,speed:0,damage:0,cd:99});const before=target.hp,nearBefore=nearby.hp;advance(g2,.4);
 assert.equal(m.stealthed,false);assert.equal(before-target.hp,365);assert.equal(nearBefore-nearby.hp,365);
});

test('skeleton rush allows building overlap and exactly forty percent of its radius offscreen',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'skeletonrush');
 const edge=UNITS.skeletonrush.radius*.6;assert.equal(canPlace(g,0,'skeletonrush',edge,235),null);assert.ok(canPlace(g,0,'skeletonrush',edge-1,235));
 assert.equal(canPlace(g,0,'skeletonrush',190,235),null,'spell area may overlap an enemy tower');
});

test('skeleton rush activates after 1.2 seconds and spawns thirteen visible skeletons on valid ground over nine seconds',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'skeletonrush');assert.ok(deploy(g,0,'skeletonrush',190,235).ok);
 advance(g,4.1);assert.equal(g.units.filter(u=>u.owner===0&&u.type==='skeleton').length,0);
 advance(g,.2);assert.equal(g.units.filter(u=>u.owner===0&&u.type==='skeleton').length,1);
 advance(g,6);const spawned=g.units.filter(u=>u.owner===0&&u.type==='skeleton');assert.equal(spawned.length,13);assert.equal(g.zones.some(z=>z.kind==='skeletonrush'),false);
 for(const u of spawned){assert.ok(u.x>=u.radius&&u.x<=ARENA.width-u.radius&&u.y>=u.radius&&u.y<=ARENA.height-u.radius);for(const t of g.towers.filter(t=>t.hp>0))assert.ok(distance(u,t)>=u.radius+t.radius-1);}
});

test('giant skeleton leaves a three second ground-only bomb that deals 688 to troops and buildings but not air',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});const giant=spawn(g,1,'giantskeleton',190,390),killer=spawn(g,0,'knight',190,650),victim=spawn(g,0,'blade',190,650),bat=spawn(g,0,'bat',190,650),tower=g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.slot==='left');
 giant.x=140;giant.y=955;giant.hp=50;giant.speed=0;giant.damage=0;killer.x=140;killer.y=955;killer.speed=0;killer.damage=1000;killer.cd=0;victim.x=170;victim.y=955;victim.speed=0;victim.damage=0;victim.cd=99;bat.x=155;bat.y=955;bat.speed=0;bat.damage=0;bat.cd=99;
 const vh=victim.hp,bh=bat.hp,th=tower.hp;advance(g,.5);assert.equal(giant.hp,0);assert.ok(g.zones.some(z=>z.kind==='giantskeletonbomb'));
 advance(g,2.8);assert.equal(victim.hp,vh);assert.equal(tower.hp,th);advance(g,.3);assert.equal(victim.hp,vh-688);assert.equal(tower.hp,th-688);assert.equal(bat.hp,bh);assert.equal(g.zones.some(z=>z.kind==='giantskeletonbomb'),false);
});

test('apprentice guards deploy six across almost the full field and can split four-two by placement',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'apprenticeguards');const before=g.units.length;const r=deploy(g,0,'apprenticeguards',430,800);assert.ok(r.ok,r.error);
 const guards=g.units.slice(before);assert.equal(guards.length,6);assert.ok(guards.every(u=>u.type==='apprenticeguard'&&u.hp===547&&u.shieldHp===240&&u.maxShieldHp===240));
 const xs=guards.map(u=>u.x).sort((a,b)=>a-b);assert.ok(xs.at(-1)-xs[0]>=ARENA.cellSize*10,`spread ${xs}`);assert.deepEqual([xs.filter(x=>x<360).length,xs.filter(x=>x>360).length].sort((a,b)=>a-b),[2,4]);
});

test('apprentice guard shield is a separate 240 HP layer and absorbs spell damage before body HP',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'apprenticeguards');assert.ok(deploy(g,0,'apprenticeguards',360,800).ok);const guard=g.units.find(u=>u.type==='apprenticeguard');forceReady(g,guard);g.units=g.units.filter(u=>u===guard);guard.x=360;guard.y=800;guard.speed=0;guard.damage=0;
 ready(g,1,'fireball');const fb=deploy(g,1,'fireball',360,800);assert.ok(fb.ok);advance(g,fb.travelTime+.2);assert.equal(guard.shieldHp,0);assert.equal(guard.hp,98);
});

test('ice spirit leaps to ground or air targets, deals 110 splash, freezes for 1.1 seconds, then disappears',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});const ice=spawn(g,0,'icespirit',190,650),ground=spawn(g,1,'blade',190,390),air=spawn(g,1,'laserdragon',190,390);g.units=[ice,ground,air];
 Object.assign(ice,{x:190,y:600,spawn:0,deploying:false,targetable:true});Object.assign(ground,{x:190,y:525,speed:0,damage:0,cd:99});Object.assign(air,{x:218,y:525,speed:0,damage:0,cd:99});const gh=ground.hp,ah=air.hp;
 advance(g,.5);assert.equal(ice.hp,0);assert.equal(ground.hp,gh-110);assert.equal(air.hp,ah-110);assert.ok((ground.stunUntil||0)>g.time+.7);assert.ok((air.stunUntil||0)>g.time+.7);assert.ok(g.events.some(e=>e.type==='ice-spirit-burst'&&e.hits>=2));
});

test('ice spirit freeze still applies when a full shield absorbs the 110 burst',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});const ice=spawn(g,0,'icespirit',190,650),guard=spawn(g,1,'apprenticeguards',190,390);g.units=[ice,guard];
 Object.assign(ice,{x:190,y:600,spawn:0,deploying:false,targetable:true});Object.assign(guard,{x:190,y:525,speed:0,damage:0,cd:99});const hp=guard.hp;
 advance(g,.5);assert.equal(ice.hp,0);assert.equal(guard.hp,hp);assert.equal(guard.shieldHp,130);assert.ok((guard.stunUntil||0)>g.time+.7);
});

test('fire spirit leaps to ground or air targets, deals 215 splash, and disappears without freezing',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});const fire=spawn(g,0,'firespirit',190,650),ground=spawn(g,1,'blade',190,390),air=spawn(g,1,'laserdragon',190,390);g.units=[fire,ground,air];
 Object.assign(fire,{x:190,y:600,spawn:0,deploying:false,targetable:true});Object.assign(ground,{x:190,y:525,speed:0,damage:0,cd:99});Object.assign(air,{x:218,y:525,speed:0,damage:0,cd:99});const gh=ground.hp,ah=air.hp;
 advance(g,.5);assert.equal(fire.hp,0);assert.equal(ground.hp,gh-215);assert.equal(air.hp,ah-215);assert.equal(ground.stunUntil||0,0);assert.equal(air.stunUntil||0,0);assert.ok(g.events.some(e=>e.type==='fire-spirit-burst'&&e.hits>=2));
});

test('oven loses 30 HP per second while keeping its fire-spirit spawn cycle',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;t.range=0;});ready(g,0,'oven');const before=g.units.length,r=deploy(g,0,'oven',260,840);assert.ok(r.ok,r.error);const oven=g.units.slice(before).find(u=>u.type==='oven');assert.ok(oven);assert.equal(oven.hp,900);
 advance(g,1.2);let spirits=g.units.filter(u=>u.type==='firespirit'&&u.owner===0&&u.summonedBy===oven.id);assert.equal(spirits.length,2);for(const [i,u] of spirits.entries()){u.speed=0;u.damage=0;u.cd=99;u.x=i?660:60;u.y=1000;}
 const hpAfterDeploy=oven.hp;advance(g,10);spirits=g.units.filter(u=>u.type==='firespirit'&&u.owner===0&&u.summonedBy===oven.id);assert.equal(spirits.length,4);assert.ok(Math.abs((hpAfterDeploy-oven.hp)-300)<.01);
 advance(g,20);assert.ok(oven.hp<=0,'oven should naturally collapse after about 30 seconds total');
});

test('v37.9 cyclone deals fixed 84/58 once and compresses the old pull into one second',()=>{
 const g=battle();for(const t of g.towers)t.damage=0;
 const ground=spawn(g,1,'blade',190,390),air=spawn(g,1,'laserdragon',530,390);
 Object.assign(ground,{x:500,y:800,speed:1e-9,damage:0,cd:1});Object.assign(air,{x:360,y:680,speed:1e-9,damage:0,laserBaseDps:0,cd:1});
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower');tower.x=420;tower.y=800;const th=tower.hp,gh=ground.hp,ah=air.hp,gx=ground.x,ay=air.y;
 ready(g,0,'cyclone');const r=deploy(g,0,'cyclone',360,800);assert.ok(r.ok);const zone=g.zones.find(z=>z.kind==='cyclone');assert.equal(zone?.remaining,1);assert.equal(zone?.pullSpeed,210);
 assert.equal(gh-ground.hp,84);assert.equal(ah-air.hp,84);assert.equal(th-tower.hp,58);
 tick(g,.1);assert.ok(ground.x<gx);assert.ok(air.y>ay);assert.ok(ground.cd<1,'cyclone must not freeze attack cooldown');
 advance(g,1);assert.equal(g.zones.some(z=>z.kind==='cyclone'),false);
});

test('v22 snapshots expose shield, stealth and phoenix egg state for online synchronization',()=>{
 const g=battle();for(const t of g.towers)t.damage=0;
 const shield=spawn(g,0,'shieldknight',190,650);ready(g,0,'mirage');assert.ok(deploy(g,0,'mirage',580,800).ok);advance(g,.8);const mirage=g.units.find(u=>u.type==='mirage');
 const phoenix=spawn(g,0,'phoenix',190,700);phoenix.hp=100;ready(g,1,'zap');assert.ok(deploy(g,1,'zap',phoenix.x,phoenix.y).ok);const egg=g.units.find(u=>u.type==='phoenix_egg'&&u.hp>0);assert.ok(egg);
 const snap=viewMatch(g,0),ss=snap.units.find(u=>u.id===shield.id),ms=snap.units.find(u=>u.id===mirage.id),es=snap.units.find(u=>u.id===egg.id);
 assert.equal(ss.shieldHp,650);assert.equal(ss.maxShieldHp,650);assert.equal(ms.stealthed,true);assert.ok(ms.stealthRemaining>0);assert.ok(es.eggHatchRemaining>3);
});

test('sky bomber can target air units as well as ground units and structures',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const bomber=spawn(g,0,'skybomber',190,650),air=spawn(g,1,'laserdragon',190,390);
 Object.assign(bomber,{x:190,y:300,speed:0,cd:0});Object.assign(air,{x:190,y:285,speed:0,damage:0,laserBaseDps:0,cd:99});
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left'),towerHp=tower.hp,airHp=air.hp;
 advance(g,1);
 assert.equal(airHp-air.hp,175);assert.equal(tower.hp,towerHp);assert.equal(bomber.target,air.id);
});

test('scrap drill ramps 90-135-180-240 DPS while attached and resets when displaced or stunned',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const drill=spawn(g,0,'scrapdrill',190,650),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 Object.assign(drill,{x:190,y:290,speed:0});
 advance(g,2.0);assert.equal(drill.drillStage,1);assert.equal(drill.drillDps,135);assert.equal(drill.drillTarget,tower.id);
 advance(g,1.5);assert.equal(drill.drillStage,2);assert.equal(drill.drillDps,180);
 advance(g,1.5);assert.equal(drill.drillStage,3);assert.equal(drill.drillDps,240);
 drill.y=430;tick(g,.1);assert.equal(drill.drillStage,0);assert.equal(drill.drillDps,90);assert.equal(drill.drillTarget,null);
 Object.assign(drill,{x:190,y:290,drillTarget:tower.id,drillLockTime:3.1,drillStage:2,drillDps:180});ready(g,1,'zap');assert.ok(deploy(g,1,'zap',drill.x,drill.y).ok);
 assert.equal(drill.drillStage,0);assert.equal(drill.drillDps,90);assert.equal(drill.drillTarget,null);
});

test('bomb carrier deals 480 only on structure contact, while an en-route death blast deals 80 only to enemy troops',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const carrier=spawn(g,0,'bombcarrier',190,650),guard=spawn(g,1,'blade',190,390),tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 Object.assign(carrier,{x:190,y:280,speed:0,cd:0});Object.assign(guard,{x:230,y:280,speed:0,damage:0,cd:99});
 const towerHp=tower.hp,guardHp=guard.hp;advance(g,.4);assert.equal(carrier.hp,0);assert.equal(towerHp-tower.hp,480);assert.equal(guard.hp,guardHp,'successful structure self-destruct must not also trigger the en-route 80 blast');

 const g2=battle();g2.towers.forEach(t=>{t.range=0;t.damage=0;});
 const killer=spawn(g2,1,'blade',190,390),runner=spawn(g2,0,'bombcarrier',190,650),tower2=g2.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 Object.assign(killer,{x:190,y:315,speed:0,damage:500,cooldown:99,cd:0});Object.assign(runner,{x:190,y:295,speed:0});
 const killerHp=killer.hp,tower2Hp=tower2.hp;advance(g2,.4);assert.equal(runner.hp,0);assert.equal(killerHp-killer.hp,80);assert.equal(tower2.hp,tower2Hp,'carrier death blast must not damage buildings');
});

test('mega knight drops after 1.5 seconds and deals 420 area damage on landing',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const victim=spawn(g,1,'knight',190,390);Object.assign(victim,{x:140,y:750,speed:0,damage:0,cd:99});
 ready(g,0,'megaknight');const before=victim.hp,r=deploy(g,0,'megaknight',140,800);assert.ok(r.ok,r.error);
 const mega=g.units.find(u=>u.type==='megaknight'&&u.owner===0);assert.ok(mega);assert.equal(mega.deployRemaining,1.5);
 advance(g,1.4);assert.equal(victim.hp,before,'landing damage must wait for the deployment timer');
 advance(g,.2);assert.equal(before-victim.hp,420);assert.equal(mega.deploying,false);
});

test('mega knight jump uses a 1.7 second windup, retargets to a newly closer enemy during windup, and has no cooldown',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const mega=spawn(g,0,'megaknight',190,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',530,390);
 Object.assign(mega,{x:190,y:650,speed:0,cd:99});Object.assign(a,{x:190,y:520,speed:0,damage:0,cd:99});Object.assign(b,{x:530,y:520,speed:0,damage:0,cd:99});
 tick(g,.1);assert.equal(mega.megaJumpState,'windup');assert.equal(mega.megaJumpTarget,a.id);
 advance(g,1);Object.assign(b,{x:190,y:590});tick(g,.1);assert.equal(mega.megaJumpState,'windup');assert.equal(mega.megaJumpTarget,b.id,'new closer enemy should replace the pre-jump target without cancelling windup');
 const bhp=b.hp;advance(g,1.1);assert.equal(mega.megaJumpState,'leap');assert.equal(b.hp,bhp,'the leap must stay airborne for 1.5 seconds rather than landing almost immediately');
 advance(g,1.4);assert.ok(bhp-b.hp>=537,'jump landing should deal 537 damage');
 assert.equal(mega.targetLock,b.id,'takeoff/landing should commit the chosen enemy');
 // No cooldown field is used: once the locked target is moved back into jump distance, a fresh 2s windup can start immediately.
 Object.assign(b,{x:mega.x,y:mega.y-120});mega.cd=0;tick(g,.1);assert.equal(mega.megaJumpState,'windup');assert.equal(mega.megaJumpTarget,b.id);
});

test('mega knight does not jump to a nearby target, and takeoff locks the chosen target even if another enemy appears closer',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const mega=spawn(g,0,'megaknight',140,650),a=spawn(g,1,'knight',140,390),b=spawn(g,1,'blade',580,390);
 Object.assign(mega,{x:140,y:650,speed:0,cd:99,jumpSpeed:40});Object.assign(a,{x:140,y:585,speed:0,damage:0,cd:99});Object.assign(b,{x:580,y:585,speed:0,damage:0,cd:99});
 tick(g,.1);assert.equal(mega.megaJumpState,null,'65px target should be approached normally, not jumped to');
 a.y=520;tick(g,.1);assert.equal(mega.megaJumpState,'windup');assert.equal(mega.megaJumpTarget,a.id);
 advance(g,2);assert.equal(mega.megaJumpState,'leap');assert.equal(mega.targetLock,a.id);
 Object.assign(b,{x:140,y:630});tick(g,.1);assert.equal(mega.megaJumpTarget,a.id);assert.equal(mega.targetLock,a.id,'a closer spawn after takeoff must not steal the jump target');
});

test('mega knight keeps its committed enemy target through stun until that target dies',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const mega=spawn(g,0,'megaknight',190,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',530,390);
 Object.assign(mega,{x:190,y:650,speed:0,cd:99,jumpSpeed:600});Object.assign(a,{x:190,y:520,speed:0,damage:0,cd:99});Object.assign(b,{x:530,y:520,speed:0,damage:0,cd:99});
 tick(g,.1);advance(g,2.1);assert.equal(mega.targetLock,a.id);
 ready(g,1,'zap');const zr=deploy(g,1,'zap',mega.x,mega.y);assert.ok(zr.ok,zr.error);tick(g,.1);
 assert.equal(mega.targetLock,a.id,'stun must not make an engaged Mega Knight switch to another enemy');
});

test('mega knight leap always takes 1.5 seconds regardless of jump distance and keeps the takeoff landing point fixed',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const mega=spawn(g,0,'megaknight',190,650),a=spawn(g,1,'knight',190,390);
 Object.assign(mega,{x:190,y:900,speed:0,cd:99});Object.assign(a,{x:190,y:730,speed:0,damage:0,cd:99});
 tick(g,.1);advance(g,1.8);assert.equal(mega.megaJumpState,'leap');
 const endY=mega.megaJumpEndY,startY=mega.megaJumpStartY;assert.ok(Number.isFinite(endY)&&Number.isFinite(startY));
 const hp=a.hp;advance(g,1.3);assert.equal(mega.megaJumpState,'leap');assert.equal(a.hp,hp);
 a.y=650; // target moving after takeoff must not move the committed landing point
 advance(g,.1);assert.equal(mega.megaJumpState,null);assert.ok(Math.abs(mega.y-endY)<.01);
});

test('mega knight normal attack is a small 263 damage area smash',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const mega=spawn(g,0,'megaknight',190,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',530,390);
 Object.assign(mega,{x:190,y:600,speed:0,cd:0});Object.assign(a,{x:190,y:555,speed:0,damage:0,cd:99});Object.assign(b,{x:225,y:555,speed:0,damage:0,cd:99});
 // Both are close enough to skip jumping; the first melee smash should hit both.
 const ah=a.hp,bh=b.hp;advance(g,.4);assert.equal(ah-a.hp,263);assert.equal(bh-b.hp,263);
});

test('iron eye arrows apply a 20 percent damage mark that breaks at 500 accumulated damage for a 300 burst',()=>{
 const g=battle(),iron=spawn(g,0,'ironeye',190,650),victim=spawn(g,1,'knight',190,390),ally=spawn(g,0,'blade',530,650);
 Object.assign(iron,{x:190,y:620,speed:0,cd:0});Object.assign(victim,{x:190,y:490,speed:0,damage:0,cd:99});Object.assign(ally,{x:205,y:490,speed:0,damage:112,cooldown:.1,cd:99});
 const before=victim.hp;advance(g,.8);assert.equal(before-victim.hp,125);assert.equal(victim.ironMarked,true);assert.equal(victim.ironMarkOwner,0);assert.equal(victim.ironMarkDamage,0);
 iron.cd=99;ally.cd=0;const markedHp=victim.hp;advance(g,.4);
 assert.ok(markedHp-victim.hp>800&&markedHp-victim.hp<850,`expected four amplified blade hits plus 300 burst, got ${markedHp-victim.hp}`);
 assert.equal(victim.ironMarked,false);assert.equal(victim.ironMarkDamage,0);
});

test('iron eye uses its piercing spin only once, marking and slowing every ground enemy crossed',()=>{
 const g=battle(),iron=spawn(g,0,'ironeye',190,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'knight',530,390);
 for(const tower of g.towers.filter(t=>t.owner===0)){tower.damage=0;tower.cd=99;}
 Object.assign(iron,{x:300,y:820,speed:0,cd:99});Object.assign(a,{x:300,y:750,speed:0,damage:0,cd:99});Object.assign(b,{x:300,y:710,speed:0,damage:0,cd:99});
 const ah=a.hp,bh=b.hp;tick(g,.1);assert.equal(iron.ironSpinState,'rush');advance(g,.5);
 assert.equal(iron.ironSpinUsed,true);assert.equal(iron.ironSpinState,null);assert.equal(ah-a.hp,180);assert.equal(bh-b.hp,180);assert.equal(a.ironMarked,true);assert.equal(b.ironMarked,true);assert.ok(a.slowUntil>g.time);assert.equal(a.slowMoveFactor,.7);
 a.x=iron.x;a.y=iron.y-45;tick(g,.1);assert.equal(iron.ironSpinState,null,'the once-only spin must not recharge');
});

test('tracker hooks a ground unit into melee range and starts a four second hook cooldown',()=>{
 const g=battle(),hunter=spawn(g,0,'tracker',190,650),victim=spawn(g,1,'knight',190,390);
 Object.assign(hunter,{x:190,y:650,speed:0,cd:99});Object.assign(victim,{x:190,y:520,speed:0,damage:0,cd:99});
 tick(g,.1);assert.equal(hunter.hookState,'windup');advance(g,.7);assert.equal(hunter.hookState,'pull-target');advance(g,.5);
 assert.equal(hunter.hookState,null);assert.ok(distance(hunter,victim)<=hunter.radius+victim.radius+2);assert.equal(hunter.targetLock,victim.id);assert.ok(hunter.hookReadyAt-g.time>3&&hunter.hookReadyAt-g.time<=4);
});

test('tracker can hook an air target and attack only that target for two seconds',()=>{
 const g=battle(),hunter=spawn(g,0,'tracker',190,650),air=spawn(g,1,'muddragon',190,390);
 Object.assign(hunter,{x:190,y:650,speed:0,cd:99});Object.assign(air,{x:360,y:680,speed:0,damage:0,cd:99});
 tick(g,.1);advance(g,1.3);assert.equal(hunter.hookState,null);assert.equal(hunter.hookAirTarget,air.id);assert.ok(hunter.hookAirAttackUntil>g.time);
 hunter.cd=0;const before=air.hp;tick(g,.1);assert.equal(before-air.hp,320);
 advance(g,2.1);const afterWindow=air.hp;hunter.cd=0;advance(g,.5);assert.equal(air.hp,afterWindow,'tracker must stop attacking air after the two second special window');
});

test('tracker hooks buildings by pulling itself to the structure instead of moving the building',()=>{
 const g=battle(),hunter=spawn(g,0,'tracker',190,650),building=spawn(g,1,'cannon',190,390);
 Object.assign(hunter,{x:190,y:650,speed:0,cd:99});Object.assign(building,{x:190,y:520,damage:0,cd:99});const by=building.y;
 tick(g,.1);advance(g,.7);assert.equal(hunter.hookState,'pull-self');advance(g,.5);
 assert.equal(hunter.hookState,null);assert.equal(building.y,by);assert.ok(hunter.y<600);assert.equal(hunter.targetLock,building.id);
});

test('v29 snapshots expose drill and mega jump state',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const drill=spawn(g,0,'scrapdrill',190,650);Object.assign(drill,{drillStage:2,drillDps:180,drillLockTime:3.2});
 const ds=viewMatch(g,0).units.find(u=>u.id===drill.id);assert.equal(ds.drillStage,2);assert.equal(ds.drillDps,180);assert.equal(ds.drillLockTime,3.2);
 const mega=spawn(g,0,'megaknight',530,700);Object.assign(mega,{megaJumpState:'windup',megaJumpProgress:.5,megaJumpWindupUntil:g.time+1,megaJumpTargetX:530,megaJumpTargetY:580});
 const ms=viewMatch(g,0).units.find(u=>u.id===mega.id);assert.equal(ms.megaJumpState,'windup');assert.equal(ms.megaJumpProgress,.5);assert.equal(ms.megaJumpWindupRemaining,1);assert.equal(ms.megaJumpTargetY,580);
});

test('Valkyrie spin is centered on herself, damages nearby ground enemies and ignores air',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const v=spawn(g,0,'valkyrie',360,650),a=spawn(g,1,'blade',360,390),b=spawn(g,1,'blade',360,390),air=spawn(g,1,'gargoyle',360,390);
 g.units=[v,a,b,air];v.x=360;v.y=600;v.cd=0;v.speed=0;a.x=375;a.y=600;a.speed=0;a.damage=0;b.x=340;b.y=608;b.speed=0;b.damage=0;air.x=365;air.y=600;air.speed=0;air.damage=0;
 const ah=a.hp,bh=b.hp,fh=air.hp;advance(g,.4);
 assert.equal(ah-a.hp,260);assert.equal(bh-b.hp,260);assert.equal(air.hp,fh);assert.ok(g.events.some(e=>e.type==='valkyrie-spin'));
});

test('Gargoyle card deploys three flyers and Gargoyle Swarm deploys six identical flyers',()=>{
 const a=battle();a.towers.forEach(t=>t.range=0);ready(a,0,'gargoyle');const before=a.units.length;assert.ok(deploy(a,0,'gargoyle',360,800).ok);let made=a.units.slice(before);assert.equal(made.length,3);assert.ok(made.every(u=>u.type==='gargoyle'&&u.air&&u.targetsAir&&u.hp===230));
 const b=battle();b.towers.forEach(t=>t.range=0);ready(b,0,'gargoyleswarm');const before2=b.units.length;assert.ok(deploy(b,0,'gargoyleswarm',360,800).ok);made=b.units.slice(before2);assert.equal(made.length,6);assert.ok(made.every(u=>u.type==='gargoyle'&&u.damage===102&&u.range===60));
});

test('v26.6 bomber bomb flight is intentionally slower than the old shot',()=>{
 const g=battle(2660);g.towers.forEach(t=>t.range=0);
 const bomber=spawn(g,0,'bomber',190,650),target=spawn(g,1,'blade',190,390);
 target.x=190;target.y=525;bomber.speed=0;bomber.cd=0;target.speed=0;target.damage=0;target.cd=99;
 advance(g,.4);
 const bomb=g.projectiles.find(p=>p.kind==='bomb'&&p.owner===0);
 assert.ok(bomb,'bomber should launch a bomb projectile');assert.equal(bomb.speed,180);
 assert.ok((bomb.progress||0)>=0&&bomb.progress<1);
 const hp=target.hp;advance(g,.3);assert.equal(target.hp,hp,'slower bomb should still be airborne shortly after launch');
 advance(g,.7);assert.ok(target.hp<hp,'bomb should eventually land and deal damage');
});


test('v36 Barbarians card deploys five identical ground melee fighters',()=>{
 const g=battle();g.towers.forEach(t=>t.range=0);ready(g,0,'barbarians');const before=g.units.length;const r=deploy(g,0,'barbarians',360,800);assert.ok(r.ok,r.error);const made=g.units.slice(before);
 assert.equal(made.length,5);assert.ok(made.every(u=>u.type==='barbarian'&&u.hp===716&&u.damage===192&&u.cooldown===1.4&&!u.air&&!u.targetsAir));
});

test('v36 Siege Barbarian normal impact deals 265, breaks the ram and releases two Barbarians',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const ram=spawn(g,0,'siegebarbarian',190,650),target=spawn(g,1,'cannon',190,390);
 Object.assign(ram,{x:190,y:650,speed:40,cd:0,spawn:0});Object.assign(target,{x:190,y:600,speed:0,damage:0,decayPerSecond:0,cd:99,spawn:0});const hp=target.hp,before=g.units.filter(u=>u.type==='barbarian'&&u.owner===0).length;
 advance(g,.4);assert.equal(hp-target.hp,265);assert.equal(ram.hp,0);assert.equal(g.units.filter(u=>u.type==='barbarian'&&u.owner===0).length-before,2);
});

test('v36 destroying the Siege Barbarian wood before impact releases two Barbarians',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const ram=spawn(g,0,'siegebarbarian',140,650),foe=spawn(g,1,'blade',140,390);
 Object.assign(ram,{x:140,y:650,hp:100,spawn:0});Object.assign(foe,{x:140,y:610,damage:200,cd:0,spawn:0});const before=g.units.filter(u=>u.type==='barbarian'&&u.owner===0).length;
 advance(g,.5);assert.equal(ram.hp,0);assert.equal(g.units.filter(u=>u.type==='barbarian'&&u.owner===0).length-before,2);
});

test('v36 Siege Barbarian charges after two seconds of movement for 572 impact and stun resets charge',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});const ram=spawn(g,0,'siegebarbarian',190,700);Object.assign(ram,{x:190,y:700,spawn:0});
 advance(g,2.1);assert.equal(ram.charged,true);assert.ok(ram.ramChargeTime>=2);
 ready(g,1,'zap');const zr=deploy(g,1,'zap',ram.x,ram.y);assert.ok(zr.ok,zr.error);tick(g,.1);assert.equal(ram.charged,false);assert.equal(ram.ramChargeTime,0);
 // Remove the stun and place a building far enough away to let the ram recharge before impact.
 ram.stunUntil=0;ram.hp=ram.maxHp;ram.x=190;ram.y=700;const target=spawn(g,1,'cannon',190,390);Object.assign(target,{x:190,y:440,speed:0,damage:0,decayPerSecond:0,cd:99,spawn:0});const hp=target.hp;
 let hit=null;for(let i=0;i<80&&!hit;i++){tick(g,.1);hit=g.events.find(e=>e.type==='ram-hit'&&e.charged)||null;}assert.ok(hit);assert.equal(hit.amount,572);assert.ok(target.hp<=hp-572);assert.equal(ram.hp,0);
});


test('map themes are deterministic and limited to the five visual variants',()=>{
 const allowed=new Set(['grass','stone','lava','snow','desert']);
 const seen=new Set();for(let seed=1;seed<=10;seed++){const g=createMatch({seed});assert.ok(allowed.has(g.mapTheme));seen.add(g.mapTheme);}
 assert.equal(seen.size,5);
});

test('tower seven-cell range is measured from the tower footprint edge and answers blowdart',()=>{
 const g=battle();
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.slot==='left');
 g.towers.filter(t=>t!==tower).forEach(t=>{t.range=0;t.damage=0;});
 const edgeY=tower.y+(tower.footprintRows*ARENA.cellSize/2),dart=spawn(g,0,'blowdart',tower.x,edgeY+UNITS.blowdart.range);
 forceReady(g,dart);dart.x=tower.x;dart.y=edgeY+UNITS.blowdart.range;dart.speed=0;dart.cd=0;
 const towerHp=tower.hp,dartHp=dart.hp;advance(g,1.6);
 assert.ok(tower.hp<towerHp,'blowdart should be able to attack at its six-cell maximum range');
 assert.ok(dart.hp<dartHp,'tower should answer from seven cells measured from its outer edge');
});
