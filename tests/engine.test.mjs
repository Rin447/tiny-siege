import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ARENA,UNITS,DECK,UNIT_IDS,SPELL_IDS,DEFAULT_DECK,MAX_DECK,normalizeDeck} from '../public/game/units.js';
import {createMatch,tick,deploy,canPlace,viewMatch,runBot,inRiver,finish,distance} from '../public/game/engine.js';
function battle(seed=12){const g=createMatch({seed});g.phase='battle';return g;}
function deckWith(id){return [id,...DECK.filter(k=>k!==id)].slice(0,MAX_DECK);}
function ready(g,o,id){const p=g.players[o],deck=deckWith(id);p.energy=10;p.deck=[...deck];p.hand=deck.slice(0,4);p.queue=deck.slice(4);}
function spawn(g,o,id,x=190,y=o===0?650:390){ready(g,o,id);const r=deploy(g,o,id,x,y);assert.ok(r.ok,r.error);return g.units.at(-1);}
function advance(g,seconds){for(let i=0;i<Math.round(seconds*10);i++)tick(g,.1);}
test('seventeen selectable cards, sixteen units plus one spell, and six-card deck rule',()=>{
 assert.equal(DECK.length,17);assert.equal(new Set(DECK).size,17);assert.equal(UNIT_IDS.length,16);assert.deepEqual(SPELL_IDS,['fireball']);
 assert.equal(MAX_DECK,6);assert.equal(DEFAULT_DECK.length,6);assert.deepEqual(normalizeDeck(DEFAULT_DECK),[...DEFAULT_DECK]);
 for(const id of DECK){const d=UNITS[id];assert.ok(d.cost>=1&&d.damage>0);if(!d.spell)assert.ok(d.hp>0);assert.notEqual(d.hidden,true);}
 assert.equal(DECK.includes('mini_golem'),false);assert.equal(UNITS.mini_golem.hidden,true);
 assert.equal(UNITS.golem.cost,8);assert.equal(UNITS.golem.hp,2850);assert.equal(UNITS.golem.damage,288);assert.equal(UNITS.golem.deathDamage,180);assert.equal(UNITS.golem.splitCount,2);
 assert.equal(UNITS.mini_golem.hp,1050);assert.equal(UNITS.mini_golem.damage,96);assert.equal(UNITS.mini_golem.deathDamage,60);
 assert.equal(UNITS.fireball.cost,4);assert.equal(UNITS.fireball.damage,560);assert.equal(UNITS.fireball.buildingDamage,140);assert.equal(UNITS.fireball.radius,90);
 assert.equal(UNITS.nightshade.cost,3);assert.equal(UNITS.nightshade.hp,520);assert.equal(UNITS.nightshade.damage,228);assert.equal(UNITS.nightshade.dashMultiplier,2);assert.equal(UNITS.nightshade.aggroRange,105);assert.equal(UNITS.nightshade.dashAggroRange,105);
 assert.equal(UNITS.knight.cost,4);assert.equal(UNITS.knight.hp,1850);assert.equal(UNITS.knight.damage,98);
 assert.equal(UNITS.berserker.cost,6);assert.equal(UNITS.berserker.hp,1950);assert.equal(UNITS.berserker.damage,360);assert.equal(UNITS.berserker.targetsAir,false);assert.ok(UNITS.berserker.mass>UNITS.knight.mass);
 assert.equal(UNITS.cannon.hp,1080);assert.equal(UNITS.cannon.decayPerSecond,30);assert.equal('lifetime' in UNITS.cannon,false);
});
for(const id of DECK)test(`deploy ${id}: energy, count, card rotation`,()=>{
 const g=battle();ready(g,0,id);const next=g.players[0].queue[0],r=deploy(g,0,id,190,650);
 assert.ok(r.ok);assert.equal(g.units.length,UNITS[id].count);assert.equal(g.players[0].energy,10-UNITS[id].cost);
 assert.equal(g.players[0].hand[0],next);assert.equal(g.players[0].queue.at(-1),id);
 assert.equal(new Set([...g.players[0].hand,...g.players[0].queue]).size,MAX_DECK);
});
test('countdown blocks deployments and becomes battle after three seconds',()=>{
 const g=createMatch();assert.equal(deploy(g,0,g.players[0].hand[0],100,660).ok,false);advance(g,3);assert.equal(g.phase,'battle');
});
test('tower HP and dormant core rules remain unchanged in v9',()=>{
 const g=battle();
 for(const t of g.towers){assert.equal(t.maxHp,t.kind==='core'?3240:1980);assert.equal(t.hp,t.maxHp);if(t.kind==='core')assert.equal(t.awake,false);}
});
test('destroying an enemy side tower advances only that lane but leaves a 120px recovery buffer',()=>{
 const g=battle();ready(g,0,'blade');
 assert.ok(canPlace(g,0,'blade',190,355));assert.ok(canPlace(g,0,'blade',530,355));
 g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===190).hp=0;
 assert.equal(canPlace(g,0,'blade',190,355),null);
 assert.equal(canPlace(g,0,'blade',250,370),null);
 assert.ok(canPlace(g,0,'blade',190,330),'cannot deploy inside the recovery buffer near the ruin');
 assert.ok(canPlace(g,0,'blade',530,370),'opposite lane stays locked');
 assert.ok(canPlace(g,0,'blade',360,370),'centre strip stays locked');
});
test('frontline recovery buffer is symmetric for player two',()=>{
 const g=battle();ready(g,1,'blade');g.towers.find(t=>t.owner===0&&t.kind==='tower'&&t.x===530).hp=0;
 assert.equal(canPlace(g,1,'blade',530,685),null);assert.equal(canPlace(g,1,'blade',500,670),null);
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
test('not enough energy never spawns or changes hand',()=>{
 const g=battle();ready(g,0,'knight');g.players[0].energy=3;const before=JSON.stringify(g);
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
test('mossling card spawns five legal individual bodies',()=>{
 const g=battle();ready(g,0,'mossling');const r=deploy(g,0,'mossling',300,680);assert.ok(r.ok,r.error);
 const pack=g.units.filter(u=>u.type==='mossling');assert.equal(pack.length,5);
 for(let i=0;i<pack.length;i++)for(let j=i+1;j<pack.length;j++)assert.ok(distance(pack[i],pack[j])>=pack[i].radius+pack[j].radius-.01);
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
