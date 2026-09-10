import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,DEFAULT_DECK,MAX_DECK,normalizeDeck} from '../public/game/units.js';
import {createMatch,tick,deploy,canPlace,viewMatch,runBot,inRiver,finish,distance} from '../public/game/engine.js';
function battle(seed=12){const g=createMatch({seed});g.phase='battle';return g;}
function deckWith(id){return [id,...DECK.filter(k=>k!==id)].slice(0,MAX_DECK);}
function ready(g,o,id){const p=g.players[o],deck=deckWith(id);p.energy=10;p.deck=[...deck];p.hand=deck.slice(0,4);p.queue=deck.slice(4);}
function spawn(g,o,id,x=190,y=o===0?650:390){ready(g,o,id);const r=deploy(g,o,id,x,y);assert.ok(r.ok,r.error);return g.units.at(-1);}
function advance(g,seconds){for(let i=0;i<Math.round(seconds*10);i++)tick(g,.1);}
test('thirty selectable cards, twenty-six unit cards plus four spells, and eight-card deck rule',()=>{
 assert.equal(DECK.length,30);assert.equal(new Set(DECK).size,30);assert.equal(UNIT_IDS.length,26);assert.deepEqual(SPELL_IDS,['fireball','poison','arrowrain','zap']);
 assert.equal(MAX_DECK,8);assert.equal(DEFAULT_DECK.length,8);assert.deepEqual(normalizeDeck(DEFAULT_DECK),[...DEFAULT_DECK]);
 for(const id of DECK){const d=UNITS[id];assert.ok(d.cost>=1&&d.damage>0);if(!d.spell)assert.ok(d.hp>0);assert.notEqual(d.hidden,true);}
 assert.equal(DECK.includes('mini_golem'),false);assert.equal(UNITS.mini_golem.hidden,true);
 assert.equal(UNITS.golem.cost,8);assert.equal(UNITS.golem.hp,2850);assert.equal(UNITS.golem.damage,288);assert.equal(UNITS.golem.deathDamage,180);assert.equal(UNITS.golem.splitCount,2);
 assert.equal(UNITS.mini_golem.hp,1050);assert.equal(UNITS.mini_golem.damage,96);assert.equal(UNITS.mini_golem.deathDamage,60);
 assert.equal(UNITS.fireball.cost,4);assert.equal(UNITS.fireball.damage,560);assert.equal(UNITS.fireball.buildingDamage,140);assert.equal(UNITS.fireball.radius,90);
 assert.equal(UNITS.poison.cost,3);assert.equal(UNITS.poison.radius,90);assert.equal(UNITS.poison.zoneDuration,6);assert.equal(UNITS.poison.lingerDuration,3);
 assert.equal(UNITS.arrowrain.cost,3);assert.equal(UNITS.arrowrain.damage,330);assert.equal(UNITS.arrowrain.buildingDamage,80);assert.equal(UNITS.arrowrain.radius,130);
 assert.equal(UNITS.boneswarm.cost,4);assert.equal(UNITS.boneswarm.count,12);assert.equal(UNITS.boneswarm.hp,45);assert.equal(UNITS.boneswarm.damage,42);
 assert.equal(UNITS.bat.cost,2);assert.equal(UNITS.bat.count,4);assert.equal(UNITS.bat.hp,145);assert.equal(UNITS.bat.damage,46);
 assert.equal(UNITS.nightshade.cost,3);assert.equal(UNITS.nightshade.hp,520);assert.equal(UNITS.nightshade.damage,228);assert.equal(UNITS.nightshade.dashMultiplier,2);assert.equal(UNITS.nightshade.aggroRange,105);assert.equal(UNITS.nightshade.dashAggroRange,105);
 assert.equal(UNITS.blade.cost,2);assert.equal(UNITS.blade.hp,780);assert.equal(UNITS.blade.damage,112);
 assert.equal(UNITS.knight.cost,3);assert.equal(UNITS.knight.hp,1850);assert.equal(UNITS.knight.damage,98);
 assert.equal(UNITS.berserker.cost,7);assert.equal(UNITS.berserker.hp,2450);assert.equal(UNITS.berserker.damage,465);assert.equal(UNITS.berserker.targetsAir,false);assert.ok(UNITS.berserker.mass>UNITS.knight.mass);
 assert.equal(UNITS.cannon.cost,3);assert.equal(UNITS.cannon.hp,1080);assert.equal(UNITS.cannon.decayPerSecond,30);assert.equal('lifetime' in UNITS.cannon,false);
 assert.equal(UNITS.tigger.cost,3);assert.equal(UNITS.tigger.hp,1100);assert.equal(UNITS.tigger.damage,20);assert.equal(UNITS.tigger.tunnelAnywhere,true);assert.equal(UNITS.tigger.burrowMin,.9);assert.equal(UNITS.tigger.burrowMax,2.8);
 assert.equal(UNITS.muddragon.cost,5);assert.equal(UNITS.muddragon.hp,1600);assert.equal(UNITS.muddragon.damage,200);assert.equal(UNITS.muddragon.range,78);assert.equal(UNITS.muddragon.splash,45);assert.equal(UNITS.muddragon.mudDuration,2);assert.equal(UNITS.muddragon.mudDamage,30);
 assert.equal(UNITS.blowdart.cost,3);assert.equal(UNITS.blowdart.hp,240);assert.equal(UNITS.blowdart.damage,110);assert.equal(UNITS.blowdart.cooldown,.5);assert.equal(UNITS.blowdart.range,195);assert.equal(UNITS.blowdart.targetsAir,true);
 assert.equal(UNITS.lasertower.cost,5);assert.equal(UNITS.lasertower.hp,2000);assert.equal(UNITS.lasertower.laserTower,true);assert.equal(UNITS.lasertower.laserBaseDps,20);assert.equal(UNITS.lasertower.laserRampEvery,1.5);assert.equal(UNITS.lasertower.targetsAir,true);
 assert.equal(UNITS.necromancer.cost,6);assert.equal(UNITS.necromancer.hp,1350);assert.equal(UNITS.necromancer.damage,125);assert.equal(UNITS.necromancer.targetsAir,true);assert.equal(UNITS.necromancer.splash,54);assert.equal(UNITS.necromancer.summonType,'boneswarm');assert.equal(UNITS.necromancer.summonCount,3);assert.equal(UNITS.necromancer.summonInterval,7.5);assert.equal(UNITS.necromancer.summonOnDeploy,true);
 assert.equal(UNITS.darknecro.cost,5);assert.equal(UNITS.darknecro.hp,1150);assert.equal(UNITS.darknecro.damage,165);assert.equal(UNITS.darknecro.targetsAir,false);assert.equal(UNITS.darknecro.summonType,'bat');assert.equal(UNITS.darknecro.summonCount,2);assert.equal(UNITS.darknecro.summonInterval,6.5);assert.equal(UNITS.darknecro.range,34);assert.equal(UNITS.darknecro.projectile,undefined);assert.equal(UNITS.darknecro.summonOnDeploy,true);
 assert.equal(UNITS.ashsquad.cost,5);assert.equal(UNITS.ashsquad.count,3);assert.equal(UNITS.ashsquad.spawnType,'blade');
 assert.equal(UNITS.archer.cost,2);assert.equal(UNITS.mage.cost,3);assert.equal(UNITS.berserker.cooldown,1.8);
 assert.equal(UNITS.princess.cost,3);assert.equal(UNITS.princess.hp,300);assert.equal(UNITS.princess.damage,275);assert.equal(UNITS.princess.cooldown,3);assert.equal(UNITS.princess.range,350);assert.equal(UNITS.princess.splash,70);assert.equal(UNITS.princess.targetsAir,true);
 assert.equal(UNITS.zap.cost,2);assert.equal(UNITS.zap.damage,225);assert.equal(UNITS.zap.stunDuration,1.5);assert.equal(UNITS.zap.radius,78);
 assert.equal(UNITS.sparky.cost,6);assert.equal(UNITS.sparky.hp,1500);assert.equal(UNITS.sparky.damage,1200);assert.equal(UNITS.sparky.range,145);assert.equal(UNITS.sparky.splash,90);assert.equal(UNITS.sparky.sparkChargeTime,3.5);assert.equal(UNITS.sparky.targetsAir,false);
});
for(const id of DECK)test(`deploy ${id}: energy, count, card rotation`,()=>{
 const g=battle();ready(g,0,id);const next=g.players[0].queue[0],r=deploy(g,0,id,190,650);
 assert.ok(r.ok);assert.equal(g.units.length,UNITS[id].count+(UNITS[id].summonOnDeploy?UNITS[id].summonCount:0));assert.equal(g.players[0].energy,10-UNITS[id].cost);
 assert.equal(g.players[0].hand[0],next);assert.equal(g.players[0].queue.at(-1),id);
 assert.equal(new Set([...g.players[0].hand,...g.players[0].queue]).size,MAX_DECK);
});
test('necromancer summons three bones immediately and three more every 7.5 seconds',()=>{
 const g=battle();ready(g,0,'necromancer');const r=deploy(g,0,'necromancer',190,650);assert.ok(r.ok,r.error);
 const necro=g.units.find(u=>u.type==='necromancer');assert.ok(necro);assert.equal(g.units.filter(u=>u.type==='boneswarm'&&u.owner===0).length,3);assert.equal(necro.summonNextAt,7.5);g.towers.forEach(t=>t.range=0);
 advance(g,7.3);assert.equal(g.units.filter(u=>u.type==='boneswarm'&&u.owner===0).length,3);
 // Keep the fixture alive and isolated so the timer itself is what is being tested.
 necro.hp=necro.maxHp;g.towers.forEach(t=>t.range=0);advance(g,.3);assert.equal(g.units.filter(u=>u.type==='boneswarm'&&u.owner===0).length,6);
});
test('dark necromancer is melee and summons two bats immediately and two more every 6.5 seconds',()=>{
 const g=battle();ready(g,0,'darknecro');const r=deploy(g,0,'darknecro',190,650);assert.ok(r.ok,r.error);
 const dark=g.units.find(u=>u.type==='darknecro');assert.ok(dark);assert.equal(g.units.filter(u=>u.type==='bat'&&u.owner===0).length,2);assert.equal(dark.summonNextAt,6.5);
 g.towers.forEach(t=>t.range=0);advance(g,6.3);assert.equal(g.units.filter(u=>u.type==='bat'&&u.owner===0).length,2);advance(g,.3);assert.equal(g.units.filter(u=>u.type==='bat'&&u.owner===0).length,4);
});
test('dead summoners never create another periodic wave',()=>{
 const g=battle();ready(g,0,'necromancer');deploy(g,0,'necromancer',190,650);g.towers.forEach(t=>t.range=0);const necro=g.units.find(u=>u.type==='necromancer');necro.hp=0;advance(g,7);
 assert.equal(g.units.filter(u=>u.type==='boneswarm'&&u.owner===0).length,3);
});
test('summoner deployment reserves room for the full guaranteed first summon wave',()=>{
 const g=battle();ready(g,0,'necromancer');g.units=Array.from({length:ARENA.maxUnits-3},(_,i)=>({id:`dummy${i}`,hp:1,owner:1,air:false,radius:1,x:680,y:60}));
 assert.equal(canPlace(g,0,'necromancer',190,650),'フィールドのユニット上限です。');
 g.units.length=ARENA.maxUnits-4;assert.equal(canPlace(g,0,'necromancer',190,650),null);
});
test('ash squad spends one card but creates three ordinary ash swordsmen in front-one rear-two formation',()=>{
 for(const owner of [0,1]){
   const g=battle();ready(g,owner,'ashsquad');const y=owner===0?650:390,r=deploy(g,owner,'ashsquad',190,y);assert.ok(r.ok,r.error);
   const blades=g.units.filter(u=>u.owner===owner);assert.equal(blades.length,3);assert.ok(blades.every(u=>u.type==='blade'&&u.hp===UNITS.blade.hp&&u.damage===UNITS.blade.damage));
   const front=owner===0?Math.min(...blades.map(u=>u.y)):Math.max(...blades.map(u=>u.y));assert.equal(blades.filter(u=>Math.abs(u.y-front)<.01).length,1);
 }
});

test('countdown blocks deployments and becomes battle after three seconds',()=>{
 const g=createMatch();assert.equal(deploy(g,0,g.players[0].hand[0],100,660).ok,false);advance(g,3);assert.equal(g.phase,'battle');
});
test('tower HP and dormant core rules remain unchanged in v16',()=>{
 const g=battle();
 for(const t of g.towers){assert.equal(t.maxHp,t.kind==='core'?3240:1980);assert.equal(t.hp,t.maxHp);if(t.kind==='core')assert.equal(t.awake,false);}
});
test('one destroyed side tower advances that lane plus a narrow centre connector',()=>{
 const g=battle();ready(g,0,'blade');
 assert.ok(canPlace(g,0,'blade',190,355));assert.ok(canPlace(g,0,'blade',530,355));
 g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190).hp=0;
 assert.equal(canPlace(g,0,'blade',190,355),null);
 assert.equal(canPlace(g,0,'blade',250,370),null);
 assert.equal(canPlace(g,0,'blade',360,370),null,'centre connector opens with the destroyed lane');
 assert.ok(canPlace(g,0,'blade',190,330),'cannot deploy inside the recovery buffer near the ruin');
 assert.ok(canPlace(g,0,'blade',530,370),'opposite lane stays locked');
 assert.ok(canPlace(g,0,'blade',450,370),'space between centre connector and opposite lane stays locked');
});
test('destroying both side towers unlocks the enemy front half across the full width',()=>{
 const g=battle();ready(g,0,'blade');
 g.towers.filter(t=>t.owner===1&&t.kind==='tower').forEach(t=>t.hp=0);
 for(const x of [70,190,300,360,420,530,650])assert.equal(canPlace(g,0,'blade',x,370),null,`x=${x}`);
 assert.ok(canPlace(g,0,'blade',360,330),'the recovery line still protects the enemy core side');
});
test('frontline lane and centre connector are symmetric for player two',()=>{
 const g=battle();ready(g,1,'blade');g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.x===530).hp=0;
 assert.equal(canPlace(g,1,'blade',530,685),null);assert.equal(canPlace(g,1,'blade',500,670),null);assert.equal(canPlace(g,1,'blade',360,670),null);
 assert.ok(canPlace(g,1,'blade',530,710),'cannot deploy inside the recovery buffer near the ruin');
 assert.ok(canPlace(g,1,'blade',190,670),'opposite lane stays locked');
});
test('invalid coordinates, ownership and opponents territory are rejected without spending',()=>{
 const g=battle();ready(g,0,'blade');
 for(const [o,x,y] of [[0,NaN,650],[0,Infinity,650],[0,100,200],[0,-1,650],[0,700,650],[0,100,1000],[2,100,650],[1,100,650]]){
   const before=JSON.stringify(g);assert.ok(canPlace(g,o,'blade',x,y));assert.equal(JSON.stringify(g),before);
 }
});
test('unknown card and non-hand card rejected',()=>{
 const g=battle();ready(g,0,'blade');
 for(const id of ['unknown',null,{},[],{toString:null,valueOf:null},'__proto__','constructor'])assert.ok(canPlace(g,0,id,100,650));
 assert.ok(canPlace(g,0,g.players[0].queue[0],100,650));
});
test('princess archer can damage a side tower from own side of the river and Arrow Rain can one-shot her',()=>{
 const g=battle();ready(g,0,'princess');g.towers.forEach(t=>t.damage=0);const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===530),before=tower.hp;
 assert.ok(deploy(g,0,'princess',530,600).ok);advance(g,4.2);assert.ok(tower.hp<before,'princess should hit tower before crossing bridge');const princess=g.units.find(u=>u.type==='princess');assert.ok(princess&&princess.y>=ARENA.riverBottom,'princess should remain on own side when first tower damage lands');
 const h=battle();ready(h,1,'princess');ready(h,0,'arrowrain');h.towers.forEach(t=>t.range=0);assert.ok(deploy(h,1,'princess',530,400).ok);advance(h,.6);const p=h.units.find(u=>u.owner===1&&u.type==='princess');assert.ok(p);assert.ok(deploy(h,0,'arrowrain',p.x,p.y).ok);advance(h,1.2);assert.equal(h.units.some(u=>u.owner===1&&u.type==='princess'),false);
});

test('sparky charges before anything enters attack range, fires only when full, then starts charging again',()=>{
 const g=battle();ready(g,0,'sparky');g.towers.forEach(t=>t.range=0);assert.ok(deploy(g,0,'sparky',530,650).ok);const s=g.units.find(u=>u.type==='sparky');s.speed=0;advance(g,3.6);assert.ok(s.sparkCharged);assert.equal(s.sparkChargeProgress,1);assert.ok(s.target,'Sparky may know a distant tower but must charge without needing an attackable target in range');
 const target=spawn(g,1,'knight',530,390);target.x=530;target.y=520;target.speed=0;target.damage=0;const hp=target.hp;advance(g,.5);assert.ok(target.hp<=hp-UNITS.sparky.damage,'full Sparky should release 1200 shot');assert.equal(s.sparkCharged,false);assert.ok(s.sparkChargeProgress<.25);
});

test('zap stuns and resets targets, laser ramp, and sparky charge',()=>{
 const g=battle();g.towers.forEach(t=>t.range=0);ready(g,0,'zap');const laser=spawn(g,1,'lasertower',530,390),sparky=spawn(g,1,'sparky',440,390);laser.x=530;laser.y=520;sparky.x=490;sparky.y=520;laser.target='dummy';laser.laserTarget='dummy';laser.laserStage=5;laser.laserDps=640;laser.laserLockTime=8;sparky.sparkCharged=true;sparky.sparkChargeProgress=1;sparky.target='dummy';const hp=sparky.hp;
 assert.ok(deploy(g,0,'zap',510,520).ok);assert.equal(sparky.hp,hp-UNITS.zap.damage);assert.ok(sparky.stunUntil>=1.5);assert.equal(sparky.target,null);assert.equal(sparky.sparkCharged,false);assert.equal(sparky.sparkChargeProgress,0);assert.equal(laser.target,null);assert.equal(laser.laserStage,0);assert.equal(laser.laserDps,UNITS.lasertower.laserBaseDps);
 advance(g,1.4);assert.equal(sparky.sparkCharged,false);advance(g,3.6);assert.equal(sparky.sparkCharged,true);
});

test('not enough energy never spawns or changes hand',()=>{
 const g=battle();ready(g,0,'knight');g.players[0].energy=2;const before=JSON.stringify(g);
 assert.equal(deploy(g,0,'knight',100,660).ok,false);assert.equal(JSON.stringify(g),before);
});
test('tower and building placement overlap rejected',()=>{
 const g=battle();ready(g,0,'blade');assert.ok(canPlace(g,0,'blade',190,805));
 spawn(g,0,'cannon',100,650);ready(g,0,'blade');assert.ok(canPlace(g,0,'blade',100,650));
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
 const g=battle();const u=spawn(g,0,'cannon',100,650),startHp=u.hp;advance(g,10);assert.equal(u.x,100);assert.equal(u.y,650);
 assert.ok(u.hp<startHp&&u.hp>0);assert.ok(Math.abs(u.hp-795)<4,`unexpected hp ${u.hp}`);
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
 assert.equal(a.speed,32);assert.equal(a.air,false);
});

test('stone golem ignores enemy troops and damages structures only',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const golem=spawn(g,0,'golem',190,650),enemy=spawn(g,1,'blade',190,390);
 golem.spawn=0;enemy.spawn=0;enemy.x=285;enemy.y=600;enemy.speed=0;enemy.damage=0;
 const enemyHp=enemy.hp,target=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),towerHp=target.hp;
 advance(g,32);assert.equal(enemy.hp,enemyHp);assert.ok(target.hp<towerHp,'golem should reach and damage a tower');
});


test('iron boar ignores troops and consumes a charged hit on structures',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const boar=spawn(g,0,'boar',190,650),enemy=spawn(g,1,'blade',190,390);
 boar.spawn=enemy.spawn=0;enemy.damage=0;enemy.speed=0;enemy.x=190;enemy.y=315;
 const target=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),hp=target.hp,enemyHp=enemy.hp;
 boar.x=190;boar.y=295;boar.charged=true;boar.chargeRun=UNITS.boar.chargeDistance;boar.cd=0;
 tick(g,.1);
 assert.equal(enemy.hp,enemyHp);assert.equal(target.hp,hp-Math.round(UNITS.boar.damage*UNITS.boar.chargeMultiplier));
 assert.equal(boar.charged,false);assert.equal(boar.chargeRun,0);
});
test('iron boar earns charge by running toward a building',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const boar=spawn(g,0,'boar',190,650);boar.spawn=0;
 for(let i=0;i<40&&!boar.charged;i++)tick(g,.1);
 assert.equal(boar.charged,true);assert.ok(boar.chargeRun>=UNITS.boar.chargeDistance);
});
test('nightshade troop acquisition is about half the old 205px aggro radius',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const shade=spawn(g,0,'nightshade',190,650),enemy=spawn(g,1,'blade',190,390);shade.spawn=enemy.spawn=0;enemy.speed=0;enemy.damage=0;
 shade.x=190;shade.y=650;enemy.x=190;enemy.y=430;tick(g,.1);assert.notEqual(shade.target,enemy.id);
 enemy.y=520;tick(g,.1);assert.equal(shade.target,enemy.id);
});
test('nightshade winds up, becomes invulnerable during rush and lands a double-damage opening hit',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const shade=spawn(g,0,'nightshade',190,650),enemy=spawn(g,1,'blade',190,390);
 shade.spawn=enemy.spawn=0;shade.x=190;shade.y=600;enemy.x=190;enemy.y=450;enemy.speed=0;enemy.damage=0;
 const hp=enemy.hp;tick(g,.1);assert.equal(shade.dashState,'windup');assert.equal(shade.target,enemy.id);
 advance(g,.5);assert.equal(shade.dashState,'windup');assert.equal(enemy.hp,hp);
 tick(g,.1);assert.equal(shade.dashState,'rush');assert.equal((shade.invulnerableUntil||0)>g.time,true);
 advance(g,.3);assert.equal(shade.dashState,null);assert.equal(enemy.hp,hp-Math.round(UNITS.nightshade.damage*UNITS.nightshade.dashMultiplier));
 assert.ok((shade.dashReadyAt||0)>g.time+3.5);
});
test('nightshade can shadow-rush an enemy tower',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const shade=spawn(g,0,'nightshade',190,650);shade.spawn=0;shade.x=190;shade.y=400;
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),hp=tower.hp;
 tick(g,.1);assert.equal(shade.dashState,'windup');advance(g,1);
 assert.equal(tower.hp,hp-Math.round(UNITS.nightshade.damage*UNITS.nightshade.dashMultiplier));
});
test('nightshade ignores damage while the rush state is invulnerable',()=>{
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
 assert.ok(g.zones.some(z=>z.kind==='mud'&&z.remaining>0&&z.radius===45));
 const snap=viewMatch(g,1),sg=snap.units.find(u=>u.id===ground.id),sa=snap.units.find(u=>u.id===air.id);assert.equal(sg.mudded,true);assert.equal(sa.mudded,false);assert.equal(ground.mudSlowFactor,.7);
 const zone=g.zones.find(z=>z.kind==='mud');g.zones.push({...zone,id:'overlap-mud'});ground.mudNextAt=g.time;const beforeOverlap=ground.hp;tick(g,.1);assert.equal(beforeOverlap-ground.hp,30,'overlapping mud zones do not stack damage');
 const after=ground.hp;advance(g,.55);assert.ok(ground.hp<=after-30,'mud applies one 30-damage tick');
});

test('mossling card spawns five legal individual bodies',()=>{
 const g=battle();ready(g,0,'mossling');const r=deploy(g,0,'mossling',300,680);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.type==='mossling');assert.equal(pack.length,5);
 for(let i=0;i<pack.length;i++)for(let j=i+1;j<pack.length;j++)assert.ok(distance(pack[i],pack[j])>=pack[i].radius+pack[j].radius-.01);
});
test('bone swarm spawns twelve ultra-fragile individual ground attackers',()=>{
 const g=battle();ready(g,0,'boneswarm');const r=deploy(g,0,'boneswarm',300,680);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.type==='boneswarm');assert.equal(pack.length,12);assert.ok(pack.every(u=>u.maxHp===45&&u.damage===42&&!u.air));
});

test('lumina priest heals a damaged nearby ally but never a building',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const priest=spawn(g,0,'lumina',300,650),tank=spawn(g,0,'knight',330,650);priest.spawn=tank.spawn=0;priest.damage=0;tank.speed=0;
 tank.hp-=500;const before=tank.hp, tower=g.towers.find(t=>t.owner===0&&t.kind==='tower');tower.hp-=300;const towerBefore=tower.hp;
 advance(g,1.4);assert.ok(tank.hp>before);assert.equal(tower.hp,towerBefore);
});
test('frost shaman slows ground movement and strips part of a boar charge',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const frost=spawn(g,0,'frost',190,650),boar=spawn(g,1,'boar',190,390);frost.spawn=boar.spawn=0;frost.x=190;frost.y=590;boar.x=190;boar.y=520;boar.speed=0;boar.charged=true;boar.chargeRun=UNITS.boar.chargeDistance;
 advance(g,1.8);assert.ok((boar.slowUntil||0)>g.time);assert.equal(boar.charged,false);assert.ok(boar.chargeRun<UNITS.boar.chargeDistance);
});
test('storm harpy chain lightning damages up to three clustered enemies',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const harpy=spawn(g,0,'harpy',300,650);harpy.spawn=0;harpy.x=300;harpy.y=590;
 const victims=['mossling','mossling','blade'].map((id,i)=>spawn(g,1,id,270+i*30,390));
 victims.forEach((u,i)=>{u.spawn=0;u.x=285+i*28;u.y=520;u.speed=0;u.damage=0;});
 const hp=victims.map(u=>u.hp);advance(g,1.5);assert.ok(victims.every((u,i)=>u.hp<hp[i]));
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
 g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190).hp=0;const hp=intruder.hp;advance(g,1.5);assert.equal(core.awake,true);assert.ok(intruder.hp<hp);
});

test('fireball can target anywhere and flight time grows with distance without tracking',()=>{
 const near=battle();near.towers.forEach(t=>{t.damage=0;});ready(near,0,'fireball');
 assert.equal(canPlace(near,0,'fireball',190,235),null);ready(near,0,'blade');assert.ok(canPlace(near,0,'blade',190,235));
 ready(near,0,'fireball');const rn=deploy(near,0,'fireball',360,760);assert.ok(rn.ok);assert.ok(rn.travelTime>=.6&&rn.travelTime<=2);
 const far=battle();far.towers.forEach(t=>{t.damage=0;});ready(far,0,'fireball');const rf=deploy(far,0,'fireball',360,80);assert.ok(rf.ok);assert.ok(rf.travelTime>rn.travelTime);assert.ok(rf.travelTime<=2);
 const p=far.projectiles.find(p=>p.spell==='fireball'),tx=p.tx,ty=p.ty;advance(far,.5);assert.equal(p.tx,tx);assert.equal(p.ty,ty);
});
test('fireball hits ground and air units for 560, buildings for 140, and never friendly units',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const frost=spawn(g,1,'frost',190,390),harpy=spawn(g,1,'harpy',220,390),friend=spawn(g,0,'blade',170,650);
 frost.spawn=harpy.spawn=friend.spawn=0;frost.x=190;frost.y=250;harpy.x=220;harpy.y=245;friend.x=165;friend.y=250;
 frost.speed=harpy.speed=friend.speed=0;frost.damage=harpy.damage=friend.damage=0;
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),towerHp=tower.hp,friendHp=friend.hp;
 ready(g,0,'fireball');const r=deploy(g,0,'fireball',190,235);assert.ok(r.ok);advance(g,r.travelTime+.2);
 assert.equal(frost.hp,0);assert.equal(harpy.hp,0);assert.equal(friend.hp,friendHp);assert.equal(tower.hp,towerHp-140);
});
test('fireball damage wakes a dormant central core',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const core=g.towers.find(t=>t.owner===1&&t.kind==='core');assert.equal(core.awake,false);
 ready(g,0,'fireball');const r=deploy(g,0,'fireball',core.x,core.y);advance(g,r.travelTime+.2);assert.equal(core.hp,core.maxHp-140);assert.equal(core.awake,true);
});
test('poison trap deploys instantly, wipes bone swarm quickly and leaves lingering poison',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});ready(g,1,'boneswarm');assert.ok(deploy(g,1,'boneswarm',190,390).ok);
 const pack=g.units.filter(u=>u.type==='boneswarm');pack.forEach(u=>{u.spawn=0;u.speed=0;u.damage=0;});
 ready(g,0,'poison');const r=deploy(g,0,'poison',190,390);assert.ok(r.ok);assert.equal(r.travelTime,0);assert.equal(g.zones.length,1);
 advance(g,.7);assert.equal(g.units.filter(u=>u.type==='boneswarm'&&u.owner===1).length,0);
 const victim=spawn(g,1,'blade',190,390);victim.spawn=0;victim.speed=0;victim.damage=0;victim.x=190;victim.y=390;const before=victim.hp;
 advance(g,.4);victim.x=500;victim.y=390;const afterContact=victim.hp;advance(g,1.2);assert.ok(afterContact<before);assert.ok(victim.hp<afterContact,'poison continues after leaving the area');
});
test('poison trap chips towers at reduced damage and wakes the central core',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const core=g.towers.find(t=>t.owner===1&&t.kind==='core');ready(g,0,'poison');
 assert.ok(deploy(g,0,'poison',core.x,core.y).ok);advance(g,.2);assert.ok(core.hp<core.maxHp);assert.equal(core.awake,true);
});
test('arrow rain is broader, lower damage and faster than fireball while still hitting air and towers',()=>{
 const timing=battle();timing.towers.forEach(t=>{t.damage=0;});const core=timing.towers.find(t=>t.owner===0&&t.kind==='core');
 ready(timing,0,'arrowrain');const ar=deploy(timing,0,'arrowrain',190,235);assert.ok(ar.ok);assert.ok(ar.travelTime>=.35&&ar.travelTime<=1);
 const fbTime=Math.max(.6,Math.min(2,.45+distance(core,{x:190,y:235})/620));assert.ok(ar.travelTime<fbTime);
 const g=battle();g.towers.forEach(t=>{t.damage=0;});const frost=spawn(g,1,'frost',190,390),bone=spawn(g,1,'boneswarm',190,390),harpy=spawn(g,1,'harpy',190,390);for(const u of [frost,bone,harpy]){u.spawn=0;u.x=190;u.y=235;u.speed=0;u.damage=0;}
 const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190),towerHp=tower.hp,frostHp=frost.hp;
 ready(g,0,'arrowrain');const r=deploy(g,0,'arrowrain',190,235);advance(g,r.travelTime+.2);
 assert.equal(frost.hp,frostHp-330);assert.equal(bone.hp,0);assert.equal(harpy.hp,Math.max(0,UNITS.harpy.hp-330));assert.equal(tower.hp,towerHp-80);
});
test('stone golem death blasts nearby enemies and still splits into two mini golems',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const golem=spawn(g,0,'golem',300,650),killer=spawn(g,1,'blade',300,390);golem.spawn=killer.spawn=0;golem.x=300;golem.y=600;killer.x=300;killer.y=555;
 golem.speed=0;killer.speed=0;killer.damage=9999;killer.cd=0;golem.hp=1;const killerHp=killer.hp;
 tick(g,.1);
 assert.equal(g.units.some(u=>u.id===golem.id),false);assert.equal(killer.hp,killerHp-UNITS.golem.deathDamage);
 const minis=g.units.filter(u=>u.type==='mini_golem'&&u.owner===0);assert.equal(minis.length,2);
 for(const m of minis){assert.equal(m.maxHp,1050);assert.equal(m.damage,96);assert.equal(m.buildingOnly,true);}
});
test('mini golem death blast is exactly one third of the parent blast',()=>{
 const g=battle();g.towers.forEach(t=>{t.damage=0;});
 const mini={...UNITS.mini_golem,id:'mini-test',type:'mini_golem',owner:0,x:300,y:600,hp:1,maxHp:UNITS.mini_golem.hp,spawn:0,cd:0,walk:0,age:0,anim:0,hit:0,lane:190,face:-1,facing:-Math.PI/2,moving:false};
 const killer=spawn(g,1,'blade',300,390),victim=spawn(g,1,'knight',340,390);killer.spawn=victim.spawn=0;killer.x=300;killer.y=565;victim.x=340;victim.y=600;killer.speed=victim.speed=0;killer.damage=9999;killer.cd=0;victim.damage=0;
 g.units.unshift(mini);const victimHp=victim.hp;tick(g,.1);
 assert.equal(g.units.some(u=>u.id===mini.id),false);assert.equal(victim.hp,victimHp-60);assert.equal(UNITS.golem.deathDamage/UNITS.mini_golem.deathDamage,3);
});
test('side tower locks its target even when a closer enemy enters range',()=>{
 const g=battle();const tower=g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.x===190);
 for(const t of g.towers)if(t.id!==tower.id)t.range=0;
 const a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
 for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
 a.x=190;a.y=650;b.x=190;b.y=500;tick(g,.1);assert.equal(tower.target,a.id);
 b.y=740;tick(g,.1);assert.equal(tower.target,a.id,'closer B must not steal a valid lock');
 a.hp=0;tick(g,.1);assert.equal(tower.target,b.id,'target death should release and reacquire');
});
test('structure target lock releases on range exit or untargetable state',()=>{
 for(const mode of ['range','untargetable']){
  const g=battle(100+(mode==='range'?1:2)),tower=g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.x===190);
  for(const t of g.towers)if(t.id!==tower.id)t.range=0;
  const a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
  for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
  a.x=190;a.y=650;b.x=190;b.y=500;tick(g,.1);assert.equal(tower.target,a.id);
  b.y=740;if(mode==='range')a.y=500;else a.targetable=false;
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
 a.y=350;tick(g,.1);assert.equal(cannon.target,b.id);
});
test('blowdart goblin is a fragile long-range anti-air attacker',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const gob=spawn(g,0,'blowdart',190,650),air=spawn(g,1,'harpy',190,390);gob.spawn=air.spawn=0;gob.x=190;gob.y=620;air.x=190;air.y=440;gob.speed=air.speed=0;air.damage=0;
 const hp=air.hp;advance(g,.7);assert.ok(air.hp<=hp-110,`expected anti-air damage, hp=${air.hp}`);assert.equal(gob.targetsAir,true);assert.equal(gob.range,195);
});
test('blowdart tower pressure is inside side-tower retaliation distance in v16',()=>{
 const towerRange=226,towerRadius=32,goblinRadius=UNITS.blowdart.radius;
 const goblinAttackEdge=UNITS.blowdart.range+towerRadius;
 const towerRetaliationEdge=towerRange+goblinRadius;
 assert.ok(goblinAttackEdge<=towerRetaliationEdge,`goblin edge ${goblinAttackEdge} must not exceed tower retaliation edge ${towerRetaliationEdge}`);
});

test('laser tower starts below bone-swarm kill speed, ramps every 1.5s, and resets after retarget',()=>{
 const g=battle();g.towers.forEach(t=>{t.range=0;t.damage=0;});
 const laser=spawn(g,0,'lasertower',360,650),a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);
 laser.spawn=0;laser.x=360;laser.y=650;for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}a.x=360;a.y=520;b.x=360;b.y=400;
 const hp=a.hp;advance(g,1.4);assert.ok(hp-a.hp<45,`base laser should not delete a bone-sized HP in first 1.4s: ${hp-a.hp}`);assert.equal(laser.laserStage,0);assert.equal(laser.laserDps,20);assert.equal(laser.target,a.id);
 advance(g,.3);assert.ok(laser.laserStage>=1);assert.equal(laser.laserDps,40);
 b.y=600;tick(g,.1);assert.equal(laser.target,a.id,'closer target does not steal laser lock');
 a.hp=0;tick(g,.1);assert.equal(laser.target,b.id);assert.equal(laser.laserStage,0);assert.equal(laser.laserDps,20,'retarget resets power');
});
test('awake central core locks a target until a release condition occurs',()=>{
 const g=battle();for(const t of g.towers)t.range=0;const core=g.towers.find(t=>t.owner===0&&t.kind==='core');core.range=226;core.awake=true;
 const a=spawn(g,1,'knight',190,390),b=spawn(g,1,'blade',190,390);for(const u of [a,b]){u.spawn=0;u.speed=0;u.damage=0;}
 a.x=360;a.y=735;b.x=360;b.y=650;tick(g,.1);assert.equal(core.target,a.id);
 b.y=820;tick(g,.1);assert.equal(core.target,a.id);a.hp=0;tick(g,.1);assert.equal(core.target,b.id);
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
 for(const hp of [1800,1980]){
 const g=battle();g.overtime=true;g.time=239.9;g.towers[0].hp=hp;tick(g,.1);
 assert.equal(g.phase,'ended');assert.equal(g.winner,hp===1980?null:1);
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
