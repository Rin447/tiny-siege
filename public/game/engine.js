import {ARENA, TOWER_GRID, MAP_THEMES, gridRectCenter, cellsToWorld, UNITS, DECK, DEFAULT_DECK, MAX_DECK, normalizeDeck, summonDelayFor, visionRangeFor, visionSizeFor} from './units.js';
import {PHYSICS_VERSION, staticFree, staticLineFree, spawnPositions, navigationWaypoint, moveBody, displaceBody, resolveBodies, faceToward, deploymentAllowed, deploymentWater, snapDeploymentPoint} from './physics.js';

export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
const safeInset=(u=null)=>Math.max(ARENA.cellSize*.5,(u?.radius||0)+ARENA.cellSize*.25);
function clampInsideArena(v,axis,u=null){const m=safeInset(u);return axis==='x'?clamp(v,m,ARENA.width-m):clamp(v,m,ARENA.height-m);}
export function random(g){
  let x=g.rng|0; x^=x<<13; x^=x>>>17; x^=x<<5;
  g.rng=x>>>0; return g.rng/4294967296;
}
function shuffled(g,source=DEFAULT_DECK){const a=[...source];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function validateDeck(value){return normalizeDeck(value,{fallback:false});}
export function createMatch({seed=12345,bot=false,difficulty='normal',decks=[DEFAULT_DECK,DEFAULT_DECK],mapTheme=null}={}){
  const normalizedSeed=(Number(seed)||1)>>>0;
  const chosenTheme=MAP_THEMES.includes(mapTheme)?mapTheme:MAP_THEMES[normalizedSeed%MAP_THEMES.length];
  const g={physicsVersion:PHYSICS_VERSION,mapTheme:chosenTheme,phase:'countdown',countdown:3,time:0,overtime:false,rng:seed||1,units:[],projectiles:[],zones:[],events:[],nextId:1,step:0,
    winner:null,reason:'',bot,difficulty,botNext:1.5,
    players:[{energy:5,hand:[],queue:[],deck:[]},{energy:5,hand:[],queue:[],deck:[]}],towers:[]};
  const safeDecks=[normalizeDeck(decks?.[0]),normalizeDeck(decks?.[1])];
  for(let owner=0;owner<2;owner++){
    const d=shuffled(g,safeDecks[owner]);g.players[owner].deck=[...safeDecks[owner]];g.players[owner].hand=d.slice(0,4);g.players[owner].queue=d.slice(4);
    const layout=owner===0?TOWER_GRID.blue:TOWER_GRID.red;
    const specs=[['left',false],['right',false],['core',true]];
    for(let i=0;i<specs.length;i++){
      const [slot,core]=specs[i],rect=layout[slot],pos=gridRectCenter(...rect),footprintCells=core?ARENA.coreTowerCells:ARENA.sideTowerCells;
      g.towers.push({id:`t${owner}${i}`,kind:core?'core':'tower',slot,owner,x:pos.x,y:pos.y,
      footprintCols:footprintCells,footprintRows:footprintCells,footprintCells:`${footprintCells}x${footprintCells}`,placementFootprint:false,
      hitboxCols:core?2.7:2.1,hitboxRows:3.0,
      hp:core?4560:3200,maxHp:core?4560:3200,radius:core?40:32,rangeCells:7,range:cellsToWorld(7),damage:core?85:105,cd:0,
      cooldown:core?0.9:1.0,targetsAir:true,projectile:'tower',hit:0,anim:0,awake:!core});
    }
  }
  return g;
}
export function inRiver(x,y){return y>ARENA.riverTop && y<ARENA.riverBottom && !ARENA.bridges.some(b=>Math.abs(x-b)<=ARENA.bridgeHalf);}
function placementStructures(g){return [...g.towers,...g.units.filter(u=>u.building&&u.hp>0)];}
export function canPlace(g,owner,id,x,y){
  if(g.phase!=='battle')return 'まだ出撃できません。';
  if(owner!==0 && owner!==1)return '参加者ではありません。';
  if(typeof id!=='string'||!DECK.includes(id))return '不明なカードです。';
  const d=UNITS[id];
  if(!Number.isFinite(x)||!Number.isFinite(y))return '指定位置が正しくありません。';
  if(d.spell==='skeletonrush'){
    const visibleInset=(d.radius||110)*(1-(d.offscreenFraction??.4));
    if(x<visibleInset||x>ARENA.width-visibleInset||y<visibleInset||y>ARENA.height-visibleInset)return '\u30d5\u30a3\u30fc\u30eb\u30c9\u5185\u306b\u7bc4\u56f2\u306e60%\u4ee5\u4e0a\u304c\u6b8b\u308b\u4f4d\u7f6e\u3092\u6307\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  }else {const margin=ARENA.cellSize*.5;if(x<margin||x>ARENA.width-margin||y<margin||y>ARENA.height-margin)return '\u30d5\u30a3\u30fc\u30eb\u30c9\u306e\u5185\u5074\u3092\u6307\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002';}
  if(!g.players[owner].hand.includes(id))return 'そのカードは手札にありません。';
  if(g.players[owner].energy+0.00001<d.cost)return 'エナジーが足りません。';
  if(d.spell){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
    if(!core)return '本拠地が破壊されているため呪文を使えません。';
    return null;
  }
  if(d.tunnelAnywhere){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
    if(!core)return '本拠地が破壊されているため地下移動できません。';
    if(g.units.filter(u=>u.hp>0).length+1>ARENA.maxUnits)return 'フィールドのユニット上限です。';
    if(!staticFree(g,d,{x,y},1))return '水上や建物の中には出現できません。少し離してください。';
    return null;
  }
  const placementPoint=d.building?snapDeploymentPoint(owner,d,x,y):{x,y};
  if(!deploymentAllowed(g,owner,placementPoint.x,placementPoint.y))return '自分の陣地、または破壊した敵サイドタワー側の前線に配置してください。';
  if(deploymentWater(placementPoint.x,placementPoint.y))return '川の上には配置できません。橋か芝生を指定してください。';
  const deployCount=d.count+(d.summonOnDeploy?(d.summonCount||0):0);
  if(g.units.filter(u=>u.hp>0).length+deployCount>ARENA.maxUnits)return 'フィールドのユニット上限です。';
  const blockers=placementStructures(g),p=d.building?placementPoint:snapDeploymentPoint(owner,d,x,y);
  if(!staticFree(g,d,p,1,blockers))return '建物や岸から少し離して配置してください。';
  if(!spawnPositions(g,owner,d,p.x,p.y,blockers))return '配置する空間がありません。少し離してください。';
  return null;
}
function event(g,type,data){g.events.push({id:g.nextId++,type,life:(type==='death'||type==='elixir-split')?0.9:0.5,...data});}
function spendCard(g,owner,id){
  const p=g.players[owner],d=UNITS[id],index=p.hand.indexOf(id);
  p.energy=Math.max(0,p.energy-d.cost);p.hand[index]=p.queue.shift();p.queue.push(id);
}
function makeUnit(g,owner,type,x,y){
  const d=UNITS[type];
  return {...d,id:`u${g.nextId++}`,type,owner,x,y,hp:d.hp,maxHp:d.hp,cd:0,spawn:0.5,anim:0,hit:0,walk:0,target:null,targetLock:null,firstStrikeTarget:null,firstStrikeReadyAt:0,targetable:true,collisionDisabled:false,deploying:false,deployTotal:0,deployRemaining:0,face:owner===0?-1:1,
    lane:x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],age:0,facing:owner===0?-Math.PI/2:Math.PI/2,moving:false,
    summonNextAt:d.summonInterval?g.time+d.summonInterval:null,summonCastingUntil:0,energyNextAt:null,
    stunUntil:0,sparkCharged:false,sparkChargeStartAt:d.sparkChargeTime?g.time:null,sparkChargeProgress:0,
    shieldHp:d.shieldMax||0,maxShieldHp:d.shieldMax||0,stealthed:false,stealthUntil:0,revived:false,
    iceSpiritState:null,iceSpiritTarget:null,iceSpiritStartedAt:0,iceSpiritProgress:0,iceSpiritStartX:null,iceSpiritStartY:null,iceSpiritEndX:null,iceSpiritEndY:null,
    fireSpiritState:null,fireSpiritTarget:null,fireSpiritStartedAt:0,fireSpiritProgress:0,fireSpiritStartX:null,fireSpiritStartY:null,fireSpiritEndX:null,fireSpiritEndY:null,
    ramChargeTime:0,charged:false,chargeRun:0,axeInFlight:false,
    drillTarget:null,drillLockTime:0,drillStage:0,drillDps:d.drillBaseDps||0,laserDamageElapsed:0,crusherTarget:null,crusherStage:0,
    megaJumpState:null,megaJumpTarget:null,megaJumpWindupUntil:0,megaJumpTargetX:null,megaJumpTargetY:null,megaJumpProgress:0,megaJumpStartedAt:0,megaJumpStartX:null,megaJumpStartY:null,megaJumpEndX:null,megaJumpEndY:null,
    riverJumpMode:d.riverJumper?boarRiverRouteForSpawn(d,owner,x,y):null,riverJumpState:null,riverJumpProgress:0,riverJumpStartedAt:0,riverJumpStartX:null,riverJumpStartY:null,riverJumpEndX:null,riverJumpEndY:null,
    ironSpinUsed:false,ironSpinState:null,ironSpinStartedAt:0,ironSpinProgress:0,ironSpinStartX:null,ironSpinStartY:null,ironSpinEndX:null,ironSpinEndY:null,ironSpinTarget:null,ironSpinHitIds:[],
    hookState:null,hookTarget:null,hookWindupUntil:0,hookReadyAt:0,hookProgress:0,hookStartedAt:0,hookStartX:null,hookStartY:null,hookEndX:null,hookEndY:null,hookTargetX:null,hookTargetY:null,hookAirTarget:null,hookAirAttackUntil:0,hookControlUntil:0,
    ironMarked:false,ironMarkOwner:null,ironMarkDamage:0,ironMarkThreshold:0,ironMarkBurstDamage:0,ironMarkBonus:0,
    eggHatchAt:d.eggUnit?g.time+(d.eggHatchTime||4):null};
}
function startDeployment(g,u,cardData){
  const total=summonDelayFor(cardData);
  if(total<=0)return false;
  // Deployment is part of combat now: normal units/buildings can be targeted,
  // damaged, stunned and hit by area effects from the moment placement is confirmed.
  // Mega Knight keeps its special drop protection until landing completes.
  const protectedDrop=!!u.megaKnight;
  u.deploying=true;u.deployTotal=total;u.deployRemaining=total;u.targetable=!protectedDrop;u.collisionDisabled=protectedDrop;u.spawn=0;u.target=null;u.targetLock=null;
  if(u.summonInterval)u.summonNextAt=null;
  if(u.energyPump)u.energyNextAt=null;
  if(u.sparkUnit){u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=null;}
  event(g,'deploy-start',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,card:cardData.id,duration:total,building:!!u.building,protectedDrop});
  if(u.megaKnight)event(g,'mega-drop-zone',{x:u.x,y:u.y,owner:u.owner,radius:u.dropRadius||48,duration:total,life:total});
  return true;
}
function completeDeployment(g,u){
  u.deploying=false;u.deployRemaining=0;u.targetable=true;u.collisionDisabled=false;u.target=null;u.targetLock=null;
  if(u.sparkUnit)u.sparkChargeStartAt=g.time;
  if(u.summonInterval)u.summonNextAt=g.time+u.summonInterval;
  if(u.energyPump&&u.energyInterval)u.energyNextAt=g.time+u.energyInterval;
  if(u.stealthDuration){u.stealthed=true;u.stealthUntil=g.time+u.stealthDuration;event(g,'stealth-start',{x:u.x,y:u.y,owner:u.owner,duration:u.stealthDuration});}
  event(g,'deploy-ready',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,building:!!u.building});
  if(u.megaKnight&&u.dropDamage){megaAreaDamage(g,u,u.x,u.y,u.dropDamage,u.dropRadius||48,'mega-drop-impact',false);u.cd=Math.max(u.cd,u.cooldown||1.6);}
  if(u.summonOnDeploy&&u.summonType&&u.summonCount)summonMinions(g,u,true);
}
function updateDeployment(g,u,dt){
  if(!u.deploying)return false;
  const protectedDrop=!!u.megaKnight;
  // A summoning unit never acts on its own, but normal deployments remain real
  // combat bodies so enemies and spells can interact with them before completion.
  u.moving=false;u.target=null;u.targetLock=null;u.targetable=!protectedDrop;u.collisionDisabled=protectedDrop;
  u.deployRemaining=Math.max(0,(u.deployRemaining||0)-dt);
  if(u.deployRemaining<=1e-8){completeDeployment(g,u);return true;}
  return true;
}
function fireballTravelTime(core,target){return clamp(.45+distance(core,target)/620,.6,2);}
function arrowRainTravelTime(core,target){return clamp(.32+distance(core,target)/500,.55,2.4);}
function burrowTravelTime(d,core,target){return clamp((d.burrowBase??.45)+distance(core,target)/(d.burrowSpeedDivisor||500),d.burrowMin??.7,d.burrowMax??2.2);}
function deployRageZone(g,owner,x,y,d=UNITS.rage,source='spell'){
  g.zones??=[];const delay=d.activationDelay||1.5;
  const z={id:`z${g.nextId++}`,owner,kind:'rage',spell:'rage',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,activated:false,activateAt:g.time+delay,
    placementTime:d.placementTime||.5,boostMultiplier:d.boostMultiplier||1.3,damage:d.damage,buildingDamage:d.buildingDamage,source};
  g.zones.push(z);event(g,'rage-deploy',{x,y,owner,radius:d.radius,duration:delay,placementTime:d.placementTime||.5,source});return z;
}
function castSpell(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id],core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
  spendCard(g,owner,id);
  if(d.spell==='lightning'){
    const centre={x,y},targets=alive(g)
      .filter(t=>t.owner!==owner&&t.hp>0&&t.targetable!==false&&t.burrowState!=='burrow'&&distance(centre,t)<=d.radius+(t.radius||12)*.35)
      .sort((a,b)=>b.hp-a.hp||String(a.id).localeCompare(String(b.id)))
      .slice(0,d.maxTargets||4);
    event(g,'lightning-cast',{x,y,owner,radius:d.radius,targets:targets.length});
    for(const t of targets){const amount=(t.kind||t.building)?d.buildingDamage:d.damage;event(g,'lightning-hit',{x:t.x,y:t.y,owner,targetOwner:t.owner,building:!!(t.kind||t.building),damage:amount});damage(g,t,amount,owner,{spell:true});}
    return {ok:true,spell:true,travelTime:0,targets:targets.length};
  }
  if(d.spell==='skeletonrush'){
    g.zones??=[];const delay=d.activationDelay||1.2,duration=d.zoneDuration||9;
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'skeletonrush',spell:'skeletonrush',x,y,radius:d.radius,remaining:duration,total:duration,activateAt:g.time+delay,expiresAt:g.time+delay+duration,nextSpawnAt:g.time+delay+(d.firstSpawnDelay||3),spawnEvery:d.spawnEvery||.5,spawnType:d.spawnType||'skeleton',activated:false});
    event(g,'skeletonrush-deploy',{x,y,owner,radius:d.radius,duration:delay});
    return {ok:true,spell:true,travelTime:delay};
  }
  if(d.spell==='poison'){
    g.zones??=[];
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'poison',spell:'poison',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,
      tickEvery:d.tickEvery,nextTick:g.time,damage:d.damage,buildingDamage:d.buildingDamage,lingerDuration:d.lingerDuration,lingerDamage:d.lingerDamage});
    event(g,'poison-deploy',{x,y,owner,radius:d.radius});
    return {ok:true,spell:true,travelTime:0};
  }
  if(d.spell==='rage'){
    const z=deployRageZone(g,owner,x,y,d,'spell');const delay=Math.max(0,z.activateAt-g.time);
    return {ok:true,spell:true,travelTime:delay,activationDelay:delay};
  }
  if(d.spell==='cyclone'){
    g.zones??=[];
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'cyclone',spell:'cyclone',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,pullSpeed:d.pullSpeed||210});
    event(g,'cyclone-deploy',{x,y,owner,radius:d.radius,duration:d.zoneDuration,damage:d.damage,buildingDamage:d.buildingDamage});
    const centre={x,y};
    for(const t of [...alive(g)]){
      if(t.owner===owner||t.hp<=0||distance(centre,t)>d.radius+(t.radius||12)*.35)continue;
      damage(g,t,(t.kind||t.building)?d.buildingDamage:d.damage,owner,{spell:true,zone:'cyclone'});
    }
    return {ok:true,spell:true,travelTime:0};
  }
  if(d.spell==='zap'){
    event(g,'zap-impact',{x,y,owner,radius:d.radius,damage:d.damage,stunDuration:d.stunDuration});
    const centre={x,y};
    for(const t of alive(g)){
      if(t.owner===owner||t.hp<=0||t.targetable===false||t.burrowState==='burrow'||distance(centre,t)>d.radius+(t.radius||12)*.35)continue;
      damage(g,t,(t.kind||t.building)?d.buildingDamage:d.damage,owner);
      if(t.hp>0)applyStun(g,t,d.stunDuration,owner);
    }
    return {ok:true,spell:true,travelTime:0};
  }
  const arrow=d.spell==='arrowrain',travel=arrow?arrowRainTravelTime(core,{x,y}):fireballTravelTime(core,{x,y}),launchDelay=d.launchDelay||0;
  g.projectiles.push({id:`p${g.nextId++}`,owner,kind:arrow?'arrowrain':'fireball',spell:d.spell,x:core.x,y:core.y,sx:core.x,sy:core.y,tx:x,ty:y,
    flightTotal:travel,total:travel,remaining:travel,launchDelay,delayRemaining:launchDelay,launched:launchDelay<=0,progress:0,damage:d.damage,buildingDamage:d.buildingDamage,splash:d.radius,knockbackCells:d.knockbackCells||0,targetsAir:true,life:launchDelay+travel+.3});
  event(g,arrow?'arrowrain-aim':'fireball-aim',{x,y,owner,radius:d.radius,duration:launchDelay,travel});
  if(launchDelay<=0)event(g,arrow?'arrowrain-launch':'fireball-launch',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
  return {ok:true,spell:true,travelTime:launchDelay+travel,launchDelay,flightTime:travel};
}
export function deploy(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id];if(d.spell)return castSpell(g,owner,id,x,y);
  if(d.tunnelAnywhere){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0),travel=burrowTravelTime(d,core,{x,y});
    spendCard(g,owner,id);
    const u=makeUnit(g,owner,id,core.x,core.y);u.spawn=0;u.targetable=false;u.burrowState='burrow';u.burrowFrom={x:core.x,y:core.y};u.burrowTo={x,y};u.burrowTotal=travel;u.burrowRemaining=travel;u.burrowProgress=0;
    g.units.push(u);event(g,'burrow-start',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
    return {ok:true,burrow:true,travelTime:travel};
  }
  const placement=snapDeploymentPoint(owner,d,x,y),positions=spawnPositions(g,owner,d,placement.x,placement.y,placementStructures(g));spendCard(g,owner,id);
  for(let i=0;i<d.count;i++){
    const unitType=(Array.isArray(d.spawnTypes)&&d.spawnTypes[i])||d.spawnType||id,u=makeUnit(g,owner,unitType,positions[i].x,positions[i].y);
    startDeployment(g,u,d);g.units.push(u);event(g,'spawn',{x:u.x,y:u.y,owner,card:id});
    if(!u.deploying&&u.summonOnDeploy&&u.summonType&&u.summonCount)summonMinions(g,u,true);
  }
  return {ok:true};
}
function alive(g){return [...g.units,...g.towers].filter(v=>v.hp>0);}
function rageZoneActive(g,z){return z?.kind==='rage'&&z.activated&&z.remaining>1e-8;}
function rageSpeedFactor(g,t){
  if(!t||t.hp<=0)return 1;
  for(const z of g.zones||[])if(rageZoneActive(g,z)&&z.owner===t.owner&&distance(z,t)<=z.radius+(t.radius||12)*.25)return z.boostMultiplier||1.3;
  return 1;
}
function targetable(source,target){return target.owner!==source.owner&&target.hp>0&&target.targetable!==false&&!target.stealthed&&(!target.air||source.targetsAir);}
function areaTargetable(source,target){return target.owner!==source.owner&&target.hp>0&&target.targetable!==false&&target.burrowState!=='burrow'&&(!target.air||source.targetsAir);}
function megaAreaDamage(g,u,x,y,amount,radius,eventType='mega-impact',shieldable=false){
  let hits=0;const centre={x,y};
  for(const v of [...alive(g)]){
    if(v.id===u.id||!areaTargetable(u,v)||distance(centre,v)>radius+(v.radius||12)*.35)continue;
    if(damage(g,v,amount,u.owner,{shieldable,sourceX:x,sourceY:y,megaImpact:true})>0)hits++;
  }
  event(g,eventType,{x,y,owner:u.owner,radius,damage:amount,hits});return hits;
}
function megaJumpReady(u,t){
  if(!u.megaKnight||!t||!targetable(u,t))return false;
  const d=distance(u,t);return d>=(u.jumpMinRange||cellsToWorld(2.5))&&d<=(u.jumpMaxRange||cellsToWorld(5));
}
function megaLeapEndpoint(u,t){
  const dx=u.x-t.x,dy=u.y-t.y,len=Math.hypot(dx,dy)||1,stop=Math.max(1,(u.radius||12)+(t.radius||12)-1);
  return {x:t.x+dx/len*stop,y:t.y+dy/len*stop};
}
function beginMegaJumpWindup(g,u,t){
  u.megaJumpState='windup';u.megaJumpTarget=t.id;u.megaJumpWindupUntil=g.time+(u.jumpWindup||2);u.megaJumpTargetX=t.x;u.megaJumpTargetY=t.y;u.megaJumpProgress=0;u.moving=false;u.target=t.id;
  faceToward(u,t.x,t.y);event(g,'mega-jump-windup',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,radius:u.jumpRadius||48,duration:u.jumpWindup||2,life:u.jumpWindup||2});
}
function beginMegaLeap(g,u,t){
  const end=t?megaLeapEndpoint(u,t):{x:u.megaJumpTargetX??u.x,y:u.megaJumpTargetY??u.y};
  u.megaJumpState='leap';u.megaJumpStartedAt=g.time;u.megaJumpProgress=0;u.megaJumpTarget=t?.id||u.megaJumpTarget;
  u.megaJumpStartX=u.x;u.megaJumpStartY=u.y;u.megaJumpEndX=end.x;u.megaJumpEndY=end.y;u.megaJumpTargetX=end.x;u.megaJumpTargetY=end.y;
  u.collisionDisabled=true;u.moving=true;
  if(t&&targetable(u,t)){u.target=t.id;u.targetLock=t.id;markFirstStrikeComplete(g,u,t);faceToward(u,t.x,t.y);}
  const duration=u.jumpTravelTime||1.5;
  event(g,'mega-jump',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner,duration,life:duration});
}
function finishMegaLeap(g,u,t){
  u.collisionDisabled=false;u.megaJumpState=null;u.megaJumpProgress=1;u.moving=false;
  if(t&&t.hp>0&&targetable(u,t)){u.target=t.id;u.targetLock=t.id;faceToward(u,t.x,t.y);}else{u.target=null;u.targetLock=null;}
  u.cd=Math.max(u.cd,u.cooldown||1.6);megaAreaDamage(g,u,u.x,u.y,u.jumpDamage||Math.round(u.damage*1.5),u.jumpRadius||48,'mega-jump-impact',false);
}
function updateMegaJump(g,u,entities,dt){
  if(!u.megaKnight||!u.megaJumpState)return false;
  if(u.megaJumpState==='windup'){
    let current=entities.find(e=>e.id===u.megaJumpTarget&&targetable(u,e))||null;
    if(!u.targetLock){
      const candidates=entities.filter(e=>e.id!==u.id&&targetable(u,e)&&distance(u,e)<=(u.jumpMaxRange||cellsToWorld(5))).sort((a,b)=>distance(u,a)-distance(u,b)||String(a.id).localeCompare(String(b.id)));
      if(candidates.length&&(!current||distance(u,candidates[0])<distance(u,current)-.001))current=candidates[0];
    }
    if(!current){u.megaJumpState=null;u.megaJumpTarget=null;u.megaJumpWindupUntil=0;u.megaJumpProgress=0;return false;}
    u.megaJumpTarget=current.id;u.megaJumpTargetX=current.x;u.megaJumpTargetY=current.y;u.target=current.id;u.moving=false;faceToward(u,current.x,current.y);
    const total=Math.max(.01,u.jumpWindup||2);u.megaJumpProgress=clamp(1-Math.max(0,u.megaJumpWindupUntil-g.time)/total,0,1);
    if(g.time+1e-8>=u.megaJumpWindupUntil)beginMegaLeap(g,u,current);
    return true;
  }
  if(u.megaJumpState==='leap'){
    const t=entities.find(e=>e.id===u.megaJumpTarget&&e.hp>0)||null;
    const duration=Math.max(.01,u.jumpTravelTime||1.5),raw=clamp((g.time-(u.megaJumpStartedAt??g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
    const sx=Number.isFinite(u.megaJumpStartX)?u.megaJumpStartX:u.x,sy=Number.isFinite(u.megaJumpStartY)?u.megaJumpStartY:u.y;
    const ex=Number.isFinite(u.megaJumpEndX)?u.megaJumpEndX:(u.megaJumpTargetX??u.x),ey=Number.isFinite(u.megaJumpEndY)?u.megaJumpEndY:(u.megaJumpTargetY??u.y);
    u.megaJumpProgress=raw;u.moving=true;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;faceToward(u,ex,ey);
    if(raw>=1-1e-8){u.x=ex;u.y=ey;finishMegaLeap(g,u,t);}
    return true;
  }
  return false;
}
function beginIceSpiritLeap(g,u,t){
  if(!u.iceSpirit||!t||!targetable(u,t))return false;
  commitMobileTarget(u,t);markFirstStrikeComplete(g,u,t);faceToward(u,t.x,t.y);
  u.iceSpiritState='leap';u.iceSpiritTarget=t.id;u.iceSpiritStartedAt=g.time;u.iceSpiritProgress=0;
  u.iceSpiritStartX=u.x;u.iceSpiritStartY=u.y;u.iceSpiritEndX=t.x;u.iceSpiritEndY=t.y;u.collisionDisabled=true;u.moving=true;u.target=t.id;
  const duration=u.iceLeapDuration||.24;event(g,'ice-spirit-leap',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,duration,life:duration});return true;
}
function finishIceSpiritLeap(g,u,entities){
  const radius=u.iceBlastRadius||48,amount=u.damage||110,duration=u.stunDuration||1.1,centre={x:u.x,y:u.y};
  let hits=0;
  for(const v of [...alive(g)]){
    if(v.id===u.id||v.owner===u.owner||v.hp<=0||v.targetable===false||v.burrowState==='burrow')continue;
    if(distance(centre,v)>radius+(v.radius||12)*.35)continue;
    const beforeHp=v.hp,beforeShield=v.shieldHp||0;
    damage(g,v,amount,u.owner,{shieldable:true,sourceX:u.x,sourceY:u.y});
    const hit=v.hp<beforeHp-1e-8||(v.shieldHp||0)<beforeShield-1e-8;
    if(hit){hits++;if(v.hp>0)applyStun(g,v,duration,u.owner);}
  }
  event(g,'ice-spirit-burst',{x:u.x,y:u.y,owner:u.owner,radius,damage:amount,stunDuration:duration,hits});
  u.collisionDisabled=false;u.iceSpiritState=null;u.iceSpiritProgress=1;u.hp=0;handleUnitDeath(g,u);
}
function updateIceSpiritLeap(g,u,entities,dt){
  if(!u.iceSpirit||u.iceSpiritState!=='leap')return false;
  const t=entities.find(e=>e.id===u.iceSpiritTarget&&e.hp>0&&targetable(u,e))||null;
  if(t){u.iceSpiritEndX=t.x;u.iceSpiritEndY=t.y;faceToward(u,t.x,t.y);}
  const duration=Math.max(.05,u.iceLeapDuration||.24),raw=clamp((g.time-(u.iceSpiritStartedAt??g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=Number.isFinite(u.iceSpiritStartX)?u.iceSpiritStartX:u.x,sy=Number.isFinite(u.iceSpiritStartY)?u.iceSpiritStartY:u.y;
  const ex=Number.isFinite(u.iceSpiritEndX)?u.iceSpiritEndX:u.x,ey=Number.isFinite(u.iceSpiritEndY)?u.iceSpiritEndY:u.y;
  u.iceSpiritProgress=raw;u.moving=true;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;
  if(raw>=1-1e-8){u.x=ex;u.y=ey;finishIceSpiritLeap(g,u,entities);}
  return true;
}

function beginFireSpiritLeap(g,u,t){
  if(!u.fireSpirit||!t||!targetable(u,t))return false;
  commitMobileTarget(u,t);markFirstStrikeComplete(g,u,t);faceToward(u,t.x,t.y);
  u.fireSpiritState='leap';u.fireSpiritTarget=t.id;u.fireSpiritStartedAt=g.time;u.fireSpiritProgress=0;
  u.fireSpiritStartX=u.x;u.fireSpiritStartY=u.y;u.fireSpiritEndX=t.x;u.fireSpiritEndY=t.y;u.collisionDisabled=true;u.moving=true;u.target=t.id;
  const duration=u.fireLeapDuration||.24;event(g,'fire-spirit-leap',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,duration,life:duration});return true;
}
function finishFireSpiritLeap(g,u,entities){
  const radius=u.fireBlastRadius||48,amount=u.damage||215,centre={x:u.x,y:u.y};let hits=0;
  for(const v of [...alive(g)]){
    if(v.id===u.id||v.owner===u.owner||v.hp<=0||v.targetable===false||v.burrowState==='burrow')continue;
    if(distance(centre,v)>radius+(v.radius||12)*.35)continue;
    const beforeHp=v.hp,beforeShield=v.shieldHp||0;damage(g,v,amount,u.owner,{shieldable:true,sourceX:u.x,sourceY:u.y});
    if(v.hp<beforeHp-1e-8||(v.shieldHp||0)<beforeShield-1e-8)hits++;
  }
  event(g,'fire-spirit-burst',{x:u.x,y:u.y,owner:u.owner,radius,damage:amount,hits});
  u.collisionDisabled=false;u.fireSpiritState=null;u.fireSpiritProgress=1;u.hp=0;handleUnitDeath(g,u);
}
function updateFireSpiritLeap(g,u,entities,dt){
  if(!u.fireSpirit||u.fireSpiritState!=='leap')return false;
  const t=entities.find(e=>e.id===u.fireSpiritTarget&&e.hp>0&&targetable(u,e))||null;
  if(t){u.fireSpiritEndX=t.x;u.fireSpiritEndY=t.y;faceToward(u,t.x,t.y);}
  const duration=Math.max(.05,u.fireLeapDuration||.24),raw=clamp((g.time-(u.fireSpiritStartedAt??g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=Number.isFinite(u.fireSpiritStartX)?u.fireSpiritStartX:u.x,sy=Number.isFinite(u.fireSpiritStartY)?u.fireSpiritStartY:u.y;
  const ex=Number.isFinite(u.fireSpiritEndX)?u.fireSpiritEndX:u.x,ey=Number.isFinite(u.fireSpiritEndY)?u.fireSpiritEndY:u.y;
  u.fireSpiritProgress=raw;u.moving=true;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;
  if(raw>=1-1e-8){u.x=ex;u.y=ey;finishFireSpiritLeap(g,u,entities);}
  return true;
}
function boarRiverRouteForSpawn(u,owner,x,y){
  if(!u.riverJumper)return null;
  if(ARENA.bridges.some(b=>Math.abs(x-b)<=ARENA.bridgeHalf))return 'bridge';
  const band=u.riverJumpSpawnBand||ARENA.cellSize*2.5;
  const besideRiver=owner===0
    ? y>=ARENA.riverBottom&&y<=ARENA.riverBottom+band
    : y<=ARENA.riverTop&&y>=ARENA.riverTop-band;
  return besideRiver?'river':'bridge';
}
function boarRiverTargetAcross(u,target){
  return !!target&&(u.owner===0?target.y<ARENA.riverTop:target.y>ARENA.riverBottom);
}
function boarRiverApproachPoint(u,target){
  if(!u.riverJumper||u.riverJumpMode!=='river'||u.riverJumpState||!boarRiverTargetAcross(u,target))return null;
  const r=u.radius||18,onOwnSide=u.owner===0?u.y>=ARENA.riverBottom:u.y<=ARENA.riverTop;
  if(!onOwnSide)return null;
  return {x:u.x,y:u.owner===0?ARENA.riverBottom+r+2:ARENA.riverTop-r-2};
}
function boarRiverJumpLanding(g,u,target){
  if(!u.riverJumper||u.riverJumpMode!=='river'||!target)return null;
  const r=u.radius||18,y=u.owner===0?ARENA.riverTop-r-2:ARENA.riverBottom+r+2;
  const aimed=clampInsideArena(u.x,'x',u);
  for(const off of [0,-ARENA.cellSize*.3,ARENA.cellSize*.3,-ARENA.cellSize*.6,ARENA.cellSize*.6,-ARENA.cellSize,ARENA.cellSize]){
    const p={x:clampInsideArena(aimed+off,'x',u),y};
    if(staticFree(g,u,p,0))return p;
  }
  return null;
}
function beginBoarRiverJump(g,u,target){
  if(!u.riverJumper||u.riverJumpMode!=='river'||u.riverJumpState||!target||target.owner===u.owner)return false;
  const trigger=u.riverJumpTrigger||ARENA.cellSize,near=u.owner===0?(u.y>=ARENA.riverBottom&&u.y<=ARENA.riverBottom+trigger):(u.y<=ARENA.riverTop&&u.y>=ARENA.riverTop-trigger);
  if(!near||!boarRiverTargetAcross(u,target))return false;
  const end=boarRiverJumpLanding(g,u,target);if(!end)return false;
  u.riverJumpState='leap';u.riverJumpStartedAt=g.time;u.riverJumpProgress=0;u.riverJumpStartX=u.x;u.riverJumpStartY=u.y;u.riverJumpEndX=end.x;u.riverJumpEndY=end.y;u.collisionDisabled=true;u.moving=true;u._nav=null;
  faceToward(u,end.x,end.y);event(g,'boar-river-jump',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner,duration:u.riverJumpTravelTime||1.2,life:u.riverJumpTravelTime||1.2});return true;
}
function updateBoarRiverJump(g,u,dt){
  if(!u.riverJumper||u.riverJumpState!=='leap')return false;
  const duration=Math.max(.1,u.riverJumpTravelTime||1.2),raw=clamp((g.time-(u.riverJumpStartedAt||g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=u.riverJumpStartX??u.x,sy=u.riverJumpStartY??u.y,ex=u.riverJumpEndX??u.x,ey=u.riverJumpEndY??u.y;
  u.riverJumpProgress=raw;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;u.moving=true;faceToward(u,ex,ey);
  if(raw>=1-1e-8){
    u.x=ex;u.y=ey;u.riverJumpState=null;u.riverJumpProgress=1;u.collisionDisabled=false;u.moving=false;u._nav=null;
    const travelled=Math.hypot(ex-sx,ey-sy);u.walk+=(travelled/Math.max(1,u.speed))*7;
    if(u.chargeDistance){u.chargeRun=(u.chargeRun||0)+travelled;if(!u.charged&&u.chargeRun>=u.chargeDistance){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner});}}
    event(g,'boar-river-land',{x:u.x,y:u.y,owner:u.owner});
  }
  return true;
}

function pointSegmentDistance(px,py,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;if(len2<1e-8)return Math.hypot(px-ax,py-ay);
  const t=clamp(((px-ax)*dx+(py-ay)*dy)/len2,0,1),x=ax+dx*t,y=ay+dy*t;return Math.hypot(px-x,py-y);
}
function applyIronMark(g,t,source){
  if(!t||t.hp<=0||t.kind||t.building||t.targetable===false||!source?.ironMark)return false;
  const fresh=!t.ironMarked||t.ironMarkOwner!==source.owner;
  t.ironMarked=true;t.ironMarkOwner=source.owner;t.ironMarkThreshold=source.markThreshold||500;t.ironMarkBurstDamage=source.markBurstDamage||300;t.ironMarkBonus=source.markDamageBonus??.20;
  if(fresh){t.ironMarkDamage=0;event(g,'iron-mark',{x:t.x,y:t.y,owner:source.owner,targetOwner:t.owner});}
  return true;
}
function ironSpinCandidate(g,u,entities){
  if(!u.ironSpinOnce||u.ironSpinUsed||u.ironSpinState)return null;
  return entities.filter(t=>t.id!==u.id&&t.owner!==u.owner&&t.hp>0&&!t.kind&&!t.building&&!t.air&&t.targetable!==false&&!t.stealthed&&t.burrowState!=='burrow'&&distance(u,t)<=u.spinTriggerRange+(t.radius||12)*.25)
    .sort((a,b)=>distance(u,a)-distance(u,b)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function beginIronSpin(g,u,t){
  const dx=t.x-u.x,dy=t.y-u.y,len=Math.hypot(dx,dy)||1,desired=u.spinDistance||cellsToWorld(3.5);
  let end=null;
  for(const d of [desired,desired*.85,desired*.70]){
    const p={x:clampInsideArena(u.x+dx/len*d,'x',u),y:clampInsideArena(u.y+dy/len*d,'y',u)};
    if(staticLineFree(g,u,u,p,1)){end=p;break;}
  }
  if(!end)return false;
  u.ironSpinUsed=true;u.ironSpinState='rush';u.ironSpinStartedAt=g.time;u.ironSpinProgress=0;u.ironSpinStartX=u.x;u.ironSpinStartY=u.y;u.ironSpinEndX=end.x;u.ironSpinEndY=end.y;u.ironSpinTarget=t.id;u.ironSpinHitIds=[];u.collisionDisabled=true;u.target=null;u.targetLock=null;u.moving=true;faceToward(u,t.x,t.y);
  event(g,'iron-spin',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner,duration:u.spinDuration||.4,life:u.spinDuration||.4});return true;
}
function finishIronSpin(u){u.ironSpinState=null;u.ironSpinProgress=1;u.collisionDisabled=false;u.moving=false;u.target=null;u.targetLock=null;u.cd=Math.max(u.cd,.35);}
function updateIronSpin(g,u,entities,dt){
  if(!u.ironSpinState)return false;
  const duration=Math.max(.05,u.spinDuration||.4),raw=clamp((g.time-(u.ironSpinStartedAt||g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=u.ironSpinStartX??u.x,sy=u.ironSpinStartY??u.y,ex=u.ironSpinEndX??u.x,ey=u.ironSpinEndY??u.y,px=u.x,py=u.y;
  u.ironSpinProgress=raw;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;u.moving=true;faceToward(u,ex,ey);
  const hit=new Set(u.ironSpinHitIds||[]),radius=u.spinHitRadius||22;
  for(const v of entities){
    if(hit.has(v.id)||v.id===u.id||v.owner===u.owner||v.hp<=0||v.kind||v.building||v.air||v.targetable===false||v.burrowState==='burrow')continue;
    if(pointSegmentDistance(v.x,v.y,px,py,u.x,u.y)>radius+(v.radius||12)*.5)continue;
    hit.add(v.id);damage(g,v,u.spinDamage||180,u.owner,{shieldable:true,sourceX:px,sourceY:py,ironSpin:true});
    if(v.hp>0){applyIronMark(g,v,u);applySlow(g,v,{owner:u.owner,slowDuration:u.spinSlowDuration||2.5,slowMove:u.spinSlowMove||.7,slowAttack:1});}
  }
  u.ironSpinHitIds=[...hit];if(raw>=1-1e-8){u.x=ex;u.y=ey;finishIronSpin(u);}return true;
}
function trackerHookValid(u,t){return !!t&&t.id!==u.id&&t.owner!==u.owner&&t.hp>0&&t.targetable!==false&&!t.stealthed&&t.burrowState!=='burrow';}
function trackerHookCandidate(g,u,entities){
  if(!u.tracker||u.hookState||g.time+1e-8<(u.hookReadyAt||0))return null;
  const valid=entities.filter(t=>trackerHookValid(u,t)&&distance(u,t)<=u.hookRange+(t.radius||12)*.25&&((t.air)||(distance(u,t)>=(u.hookMinRange||55))));
  const locked=u.targetLock&&valid.find(t=>t.id===u.targetLock);if(locked)return locked;
  return valid.sort((a,b)=>distance(u,a)-distance(u,b)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function beginTrackerHook(g,u,t){
  u.hookState='windup';u.hookTarget=t.id;u.hookWindupUntil=g.time+(u.hookWindup||.6);u.hookProgress=0;u.hookTargetX=t.x;u.hookTargetY=t.y;u.moving=false;u.target=t.id;faceToward(u,t.x,t.y);
  event(g,'tracker-hook-windup',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,duration:u.hookWindup||.6,life:u.hookWindup||.6});
}
function startTrackerPull(g,u,t){
  const duration=u.hookPullDuration||.45;u.hookStartedAt=g.time;u.hookProgress=0;u.hookReadyAt=g.time+(u.hookCooldown||4);u.hookTargetX=t.x;u.hookTargetY=t.y;
  const dx=t.x-u.x,dy=t.y-u.y,len=Math.hypot(dx,dy)||1,stop=Math.max(1,(u.radius||12)+(t.radius||12)-2);
  if(t.kind||t.building){
    u.hookState='pull-self';u.hookStartX=u.x;u.hookStartY=u.y;u.hookEndX=t.x-dx/len*stop;u.hookEndY=t.y-dy/len*stop;u.collisionDisabled=true;
  }else{
    u.hookState='pull-target';u.hookStartX=t.x;u.hookStartY=t.y;u.hookEndX=u.x+dx/len*stop;u.hookEndY=u.y+dy/len*stop;t.hookControlUntil=g.time+duration+.05;t.target=null;t.targetLock=null;t.moving=false;
  }
  event(g,'tracker-hook',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,mode:(t.kind||t.building)?'self':t.air?'air':'ground',duration,life:duration});
}
function cancelTrackerHook(g,u){
  if(!u.tracker)return;u.hookState=null;u.hookTarget=null;u.hookProgress=0;u.collisionDisabled=false;
}
function finishTrackerPull(g,u,t){
  const wasAir=!!t?.air;u.hookState=null;u.hookProgress=1;u.collisionDisabled=false;u.moving=false;
  if(t&&t.hp>0){u.target=t.id;u.targetLock=t.id;markFirstStrikeComplete(g,u,t);if(wasAir){u.hookAirTarget=t.id;u.hookAirAttackUntil=g.time+(u.hookAirAttackDuration||2);event(g,'tracker-air-window',{x:u.x,y:u.y,owner:u.owner,duration:u.hookAirAttackDuration||2,life:u.hookAirAttackDuration||2});}}
}
function updateTrackerHook(g,u,entities,dt){
  if(!u.tracker||!u.hookState)return false;let t=entities.find(e=>e.id===u.hookTarget&&e.hp>0)||null;
  if(u.hookState==='windup'){
    if(!trackerHookValid(u,t)){cancelTrackerHook(g,u);return false;}u.moving=false;u.hookTargetX=t.x;u.hookTargetY=t.y;faceToward(u,t.x,t.y);u.hookProgress=clamp(1-Math.max(0,u.hookWindupUntil-g.time)/Math.max(.05,u.hookWindup||.6),0,1);
    if(g.time+1e-8>=u.hookWindupUntil)startTrackerPull(g,u,t);return true;
  }
  const duration=Math.max(.05,u.hookPullDuration||.45),raw=clamp((g.time-(u.hookStartedAt||g.time))/duration,0,1),p=raw*raw*(3-2*raw);u.hookProgress=raw;
  if(u.hookState==='pull-self'){
    u.x=(u.hookStartX??u.x)+((u.hookEndX??u.x)-(u.hookStartX??u.x))*p;u.y=(u.hookStartY??u.y)+((u.hookEndY??u.y)-(u.hookStartY??u.y))*p;u.moving=true;if(t)faceToward(u,t.x,t.y);
  }else if(u.hookState==='pull-target'){
    if(!t){cancelTrackerHook(g,u);return false;}t.x=(u.hookStartX??t.x)+((u.hookEndX??t.x)-(u.hookStartX??t.x))*p;t.y=(u.hookStartY??t.y)+((u.hookEndY??t.y)-(u.hookStartY??t.y))*p;t.hookControlUntil=Math.max(t.hookControlUntil||0,g.time+.12);t.moving=false;u.moving=false;faceToward(u,t.x,t.y);
  }
  if(raw>=1-1e-8){if(u.hookState==='pull-self'){u.x=u.hookEndX;u.y=u.hookEndY;}else if(t){t.x=u.hookEndX;t.y=u.hookEndY;t.hookControlUntil=g.time;}finishTrackerPull(g,u,t);}return true;
}
export function structureFootprintRect(t){
  if(!(t?.kind||t?.building))return null;
  const fallbackCols=Math.max(.5,Math.min(t.footprintCols||ARENA.defaultBuildingCells,((t.radius||20)*2)/ARENA.cellSize));
  const fallbackRows=Math.max(.5,Math.min(t.footprintRows||ARENA.defaultBuildingCells,((t.radius||20)*2)/ARENA.cellSize));
  const cols=t.hitboxCols||fallbackCols,rows=t.hitboxRows||fallbackRows;
  const hw=cols*ARENA.cellSize/2,hh=rows*ARENA.cellSize/2;
  return {l:t.x-hw,r:t.x+hw,t:t.y-hh,b:t.y+hh,hw,hh};
}
export function targetEdgePoint(source,target){
  const rect=structureFootprintRect(target);
  if(!rect)return {x:target.x,y:target.y};
  return {x:clamp(source.x,rect.l,rect.r),y:clamp(source.y,rect.t,rect.b)};
}
export function targetGap(source,target){
  const sourceRect=source?.kind?structureFootprintRect(source):null,targetRect=structureFootprintRect(target);
  if(sourceRect&&targetRect){
    const dx=Math.max(targetRect.l-sourceRect.r,sourceRect.l-targetRect.r,0),dy=Math.max(targetRect.t-sourceRect.b,sourceRect.t-targetRect.b,0);
    return Math.hypot(dx,dy);
  }
  if(targetRect){const p=targetEdgePoint(source,target);return distance(source,p);}
  if(sourceRect){
    const px=clamp(target.x,sourceRect.l,sourceRect.r),py=clamp(target.y,sourceRect.t,sourceRect.b);
    return distance(target,{x:px,y:py});
  }
  return Math.max(0,distance(source,target)-(target?.radius||0));
}
function lockedStructureTarget(u,entities){
  if(!(u.kind||u.building)||!u.target)return null;
  const t=entities.find(e=>e.id===u.target);
  if(!t||!targetable(u,t))return null;
  return targetGap(u,t)<=u.range?t:null;
}
function nearestStructureTarget(u,entities){
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    const d=targetGap(u,t);
    if(d<=u.range&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function preferredTower(g,u){
  const enemy=1-u.owner;
  const out=g.towers.find(t=>t.owner===enemy&&t.kind==='tower'&&t.x===u.lane&&t.hp>0);
  return out||g.towers.find(t=>t.owner===enemy&&t.kind==='core'&&t.hp>0);
}
function mobileVisionRange(u){
  return visionRangeFor(u);
}
function nearestMobileCombatTarget(u,entities){
  const sight=mobileVisionRange(u),explicit=Number.isFinite(u.aggroRange);
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    // Size vision is centre-to-centre. Specialist sight keeps its tuned contract; Princess uses exactly the same edge-gap as her attack range.
    const raw=distance(u,t),d=u.visionMatchesRange?targetGap(u,t):(explicit?Math.max(0,raw-(t.radius||0)-(u.range||0)):raw);
    if(d<=sight&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function megaJumpCandidate(u,entities){
  if(!u.megaKnight||u.targetLock)return null;
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(t.id===u.id||!megaJumpReady(u,t))continue;
    const d=distance(u,t);
    if(d<bestD){best=t;bestD=d;}
  }
  return best;
}
function nearbyDefensiveBuilding(u,entities){
  const pull=u.buildingPullRange??cellsToWorld(4.5);
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!t.building||!targetable(u,t))continue;
    const d=targetGap(u,t);
    if(d<=pull&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function buildingOnlyTarget(g,u,entities){
  // Player-placed defensive buildings may still pull a siege unit when they are genuinely nearby.
  const defence=nearbyDefensiveBuilding(u,entities);if(defence)return defence;
  const enemy=1-u.owner;
  // Otherwise preserve the lane chosen at deployment. Never cross the arena just because the opposite tower survives.
  const laneTower=g.towers.find(t=>t.owner===enemy&&t.kind==='tower'&&t.x===u.lane&&t.hp>0);
  if(laneTower)return laneTower;
  return g.towers.find(t=>t.owner===enemy&&t.kind==='core'&&t.hp>0)||null;
}
function resetFirstStrike(u){u.firstStrikeTarget=null;u.firstStrikeReadyAt=0;}
function markFirstStrikeComplete(g,u,t){
  if(!u.kind&&t){u.firstStrikeTarget=t.id;u.firstStrikeReadyAt=g.time;}
}
function firstStrikeReady(g,u,t){
  if(u.kind)return true; // Arena towers keep their existing response timing.
  const delay=Number.isFinite(u.firstStrikeDelay)?Math.max(0,u.firstStrikeDelay):Math.max(0,ARENA.firstStrikeDelay||0);
  if(delay<=0)return true;
  if(u.firstStrikeTarget!==t.id){u.firstStrikeTarget=t.id;u.firstStrikeReadyAt=g.time+delay;return false;}
  return g.time+1e-8>=u.firstStrikeReadyAt;
}
function commitMobileTarget(u,t){
  if(!u.kind&&!u.building&&!u.buildingOnly&&t&&targetable(u,t))u.targetLock=t.id;
}
function getTarget(g,u,entities){
  if(u.tracker&&u.hookAirTarget){
    const air=entities.find(t=>t.id===u.hookAirTarget&&t.hp>0&&t.owner!==u.owner&&t.air&&t.targetable!==false&&!t.stealthed&&t.burrowState!=='burrow');
    if((u.hookAirAttackUntil||0)>g.time&&air)return air;
    if(u.targetLock===u.hookAirTarget)u.targetLock=null;u.hookAirTarget=null;u.hookAirAttackUntil=0;
  }
  // Defensive structures keep the existing v13 contract: lock while the target remains valid and in range.
  // A closer enemy entering range does not steal aggro mid-lock.
  if(u.kind||u.building){
    const locked=lockedStructureTarget(u,entities);
    if(locked)return locked;
    return nearestStructureTarget(u,entities);
  }
  // Siege units keep their deployment lane instead of crossing to the opposite side tower.
  // Nearby player-placed defence buildings can still pull them off the route.
  if(u.buildingOnly){
    u.targetLock=null;
    return buildingOnlyTarget(g,u,entities);
  }
  // Ordinary mobile units use size-based vision before engagement.
  // Small / medium / large bodies see progressively farther, so a large unit can be lured by a smaller one that has not noticed it.
  // Before the first attack, leaving vision immediately releases pursuit and the unit resumes its tower route.
  // After an attack commits the lock, leaving vision no longer breaks pursuit.
  if(u.targetLock){
    const locked=entities.find(t=>t.id===u.targetLock);
    if(locked&&targetable(u,locked))return locked;
    u.targetLock=null;
  }
  const best=nearestMobileCombatTarget(u,entities);
  if(best)return best;
  // Special ability acquisition is deliberately separate from ordinary vision.
  // Mega Knight jump, Tracker hook and other ability-specific ranges do not widen everyone else's sight.
  const jumpTarget=megaJumpCandidate(u,entities);if(jumpTarget)return jumpTarget;
  // A preferred tower is only a navigation objective while it is outside aggro range.
  // It becomes a real hard lock only after the unit actually attacks it.
  return preferredTower(g,u);
}
function dashEndpoint(u,t){
  const edge=targetEdgePoint(u,t),dx=u.x-edge.x,dy=u.y-edge.y,len=Math.hypot(dx,dy)||1;
  const stop=Math.max(1,u.range-1);
  return {x:edge.x+dx/len*stop,y:edge.y+dy/len*stop};
}
function shadowRushTargetReady(g,u,t){
  if(!t||!targetable(u,t))return false;
  const gap=Math.max(0,targetGap(u,t)-u.range);
  if(gap<(u.dashMinRange||0)||gap>(u.dashAggroRange??u.dashMaxRange??Infinity))return false;
  const end=dashEndpoint(u,t);
  return staticLineFree(g,u,u,end,1);
}
function canShadowRush(g,u,t){
  if(!u.dashWindup||g.time<(u.dashReadyAt||0)||u.dashState)return false;
  return shadowRushTargetReady(g,u,t);
}
function beginShadowWindup(g,u,t){
  u.dashState='windup';u.dashTarget=t.id;u.dashWindupUntil=g.time+u.dashWindup;u.moving=false;
  faceToward(u,t.x,t.y);event(g,'shadow-windup',{x:u.x,y:u.y,owner:u.owner});
}
function beginShadowRush(g,u,t){
  const end=dashEndpoint(u,t);
  if(!staticLineFree(g,u,u,end,1)){u.dashState=null;u.dashTarget=null;return false;}
  // The rush itself is the attack commitment, so the target becomes locked here, not during windup.
  commitMobileTarget(u,t);markFirstStrikeComplete(g,u,t);
  u.dashState='rush';u.dashEnd=end;u.invulnerableUntil=g.time+Math.max(.12,distance(u,end)/(u.dashSpeed||650)+.12);
  faceToward(u,t.x,t.y);event(g,'shadow-rush',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner});return true;
}
function finishShadowRush(g,u,t){
  u.dashState=null;u.invulnerableUntil=0;u.dashReadyAt=g.time+(u.dashCooldown||4);u.dashTarget=null;u.dashEnd=null;
  u.cd=Math.max(u.cd,u.cooldown);u.anim=.35;
  if(t&&t.hp>0&&targetable(u,t)&&targetGap(u,t)<=u.range+ARENA.cellSize*.35){
    const amount=Number.isFinite(u.dashDamage)?u.dashDamage:Math.round(u.damage*(u.dashMultiplier||2));damage(g,t,amount,u.owner);
    event(g,'shadow-hit',{x:t.x,y:t.y,owner:u.owner,amount});
  }
}
function updateShadowRush(g,u,entities,dt){
  if(!u.dashState)return false;
  let t=entities.find(e=>e.id===u.dashTarget&&e.hp>0);
  if(u.dashState==='windup'){
    // Windup is still pre-attack: keep following the currently nearest rush-valid target.
    // This prevents a fast enemy from dragging Nightshade forever before the rush actually starts.
    const nearest=nearestMobileCombatTarget(u,entities);
    if(nearest&&shadowRushTargetReady(g,u,nearest)){
      t=nearest;u.dashTarget=t.id;u.target=t.id;
    }else if(!t||!shadowRushTargetReady(g,u,t)){
      u.dashState=null;u.dashTarget=null;u.dashReadyAt=g.time+.35;return true;
    }
    u.moving=false;faceToward(u,t.x,t.y);
    if(g.time+1e-8>=u.dashWindupUntil){
      if(!canRushAfterWindup(g,u,t)){u.dashState=null;u.dashTarget=null;u.dashReadyAt=g.time+.35;}
      else beginShadowRush(g,u,t);
    }
    return true;
  }
  if(u.dashState==='rush'){
    if(!t){finishShadowRush(g,u,null);return true;}
    const end=dashEndpoint(u,t),dx=end.x-u.x,dy=end.y-u.y,len=Math.hypot(dx,dy),step=Math.min((u.dashSpeed||650)*dt,len);
    if(len>.001){u.x+=dx/len*step;u.y+=dy/len*step;faceToward(u,t.x,t.y);u.walk+=step/Math.max(1,u.speed)*7;u.moving=true;}
    if(len<=step+.5||g.time+dt>=(u.invulnerableUntil||0)){u.x=end.x;u.y=end.y;finishShadowRush(g,u,t);}
    return true;
  }
  return false;
}
function updateBurrow(g,u,dt){
  if(u.burrowState!=='burrow')return false;
  u.moving=false;u.target=null;u.targetLock=null;u.targetable=false;u.burrowRemaining=Math.max(0,(u.burrowRemaining||0)-dt);
  const total=Math.max(.001,u.burrowTotal||1),progress=clamp(1-u.burrowRemaining/total,0,1);u.burrowProgress=progress;
  const a=u.burrowFrom||u,b=u.burrowTo||u;u.x=a.x+(b.x-a.x)*progress;u.y=a.y+(b.y-a.y)*progress;
  if(u.burrowRemaining<=1e-8){u.x=b.x;u.y=b.y;u.burrowState=null;u.targetable=true;u.spawn=.25;event(g,'burrow-arrive',{x:u.x,y:u.y,owner:u.owner});}
  return true;
}
function canRushAfterWindup(g,u,t){
  const gap=Math.max(0,targetGap(u,t)-u.range);
  if(gap>(u.dashMaxRange||Infinity)+ARENA.cellSize)return false;
  const end=dashEndpoint(u,t);return staticLineFree(g,u,u,end,1);
}
function buildingLaneCoreWaypoint(g,u,t){
  if(!u.buildingOnly||!t||t.kind!=='core')return null;
  const enemy=1-u.owner,side=g.towers.find(v=>v.owner===enemy&&v.kind==='tower'&&v.x===u.lane);
  if(!side||side.hp>0)return null;
  const forward=u.owner===0?-1:1,turnY=side.y+forward*ARENA.cellSize*1.5;
  const beforeTurn=forward<0?u.y>turnY:u.y<turnY;
  return beforeTurn?{id:`lane-core-${enemy}-${u.lane}`,x:u.lane,y:turnY,radius:1}:null;
}
function move(g,u,t,dt){
  if(!u.speed)return;
  const lanePoint=buildingLaneCoreWaypoint(g,u,t),edge=(t.kind||t.building)?targetEdgePoint(u,t):null;
  const navTarget=edge?{id:`edge-${t.id}`,x:edge.x,y:edge.y,radius:0}:t;
  const navReach=edge?u.range:u.range+(t.radius||0);
  const dest=boarRiverApproachPoint(u,t)||(lanePoint?navigationWaypoint(g,u,lanePoint,2):navigationWaypoint(g,u,navTarget,navReach));
  const start={x:u.x,y:u.y};
  const frostFactor=(u.slowUntil||0)>g.time?(u.slowMoveFactor||1):1;
  const mudFactor=(u.mudUntil||0)>g.time?(u.mudSlowFactor||1):1;
  const ramSpeedFactor=u.siegeRam&&u.charged?(u.ramChargeSpeedMultiplier||1.35):1;
  const mountedSpeedFactor=u.mountedCharge&&u.charged?(u.chargeSpeedMultiplier||1.25):1;
  const rageFactor=rageSpeedFactor(g,u);
  const moved=moveBody(g,u,dest,dt*frostFactor*mudFactor*ramSpeedFactor*mountedSpeedFactor*rageFactor);
  if(moved>.025){
    faceToward(u,u.x+(u.x-start.x),u.y+(u.y-start.y));u.walk+=moved/Math.max(1,u.speed)*7;u.moving=true;
    if(u.siegeRam){
      u.ramChargeTime=(u.ramChargeTime||0)+dt;
      if(!u.charged&&u.ramChargeTime+1e-8>=(u.ramChargeAfter||2)){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner,kind:'siege-ram'});}
    }else if(u.mountedCharge){
      if(!u.charged){
        u.chargeRun=(u.chargeRun||0)+moved;
        if(u.chargeRun+1e-8>=u.chargeDistance){u.chargeRun=u.chargeDistance;u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner,kind:u.type,distance:u.chargeDistance});}
      }
    }else if(u.chargeDistance&&u.buildingOnly){
      u.chargeRun=(u.chargeRun||0)+moved;
      if(!u.charged&&u.chargeRun>=u.chargeDistance){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner});}
    }
  }else if(u.siegeRam&&!u.charged){
    u.ramChargeTime=0;
  }else if(u.mountedCharge&&!u.charged){
    resetMountedCharge(u);
  }else if(u.chargeDistance&&!u.mountedCharge){
    u.chargeRun=Math.max(0,(u.chargeRun||0)-dt*90);
    if(u.chargeRun<u.chargeDistance*.55)u.charged=false;
  }
}
function wakeCore(g,owner,reason='wake'){
  const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
  if(!core||core.awake)return false;
  core.awake=true;event(g,'core-awake',{x:core.x,y:core.y,owner,reason});return true;
}
function refreshCoreWake(g){
  for(const owner of [0,1]){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
    if(!core||core.awake)continue;
    if(core.hp<core.maxHp||g.towers.some(t=>t.owner===owner&&t.kind==='tower'&&t.hp<=0))wakeCore(g,owner,core.hp<core.maxHp?'core-hit':'side-down');
  }
}
function summonMinions(g,parent,initial=false){
  const d=UNITS[parent.summonType];if(!d||!parent.summonCount)return 0;
  const available=Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length),count=Math.min(parent.summonCount,available);if(!count)return 0;
  const f=parent.owner===0?1:-1;
  const cs=ARENA.cellSize,buildingClear=parent.building?((parent.hitboxRows||Math.min(parent.footprintRows||ARENA.defaultBuildingCells,2))*cs/2+(d.radius||10)+cs*.25):0;
  const forward=buildingClear||cs*.30;
  const base=count===2?[[-cs*.55,-forward],[cs*.55,-forward]]:count===3?[[0,-Math.max(cs*.75,forward)],[-cs*.60,Math.max(cs*.30,buildingClear?forward*.20:cs*.30)],[cs*.60,Math.max(cs*.30,buildingClear?forward*.20:cs*.30)]]:Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/count;const r=Math.max(cs*.70,buildingClear);return [Math.cos(a)*r,Math.sin(a)*r];});
  const candidates=[];
  for(const [ox,oy] of base)candidates.push([ox,oy]);
  for(const r of [ARENA.cellSize,ARENA.cellSize*1.3,ARENA.cellSize*1.7])for(let i=0;i<12;i++){const a=i*Math.PI*2/12+(parent.owner===1?Math.PI:0);candidates.push([Math.cos(a)*r,Math.sin(a)*r]);}
  let made=0;
  for(const [ox0,oy0] of candidates){
    if(made>=count)break;const ox=ox0*f,oy=oy0*f,p={x:clampInsideArena(parent.x+ox,'x',d),y:clampInsideArena(parent.y+oy,'y',d)};
    if(!staticFree(g,d,p,0))continue;
    if(g.units.some(u=>u.hp>0&&!!u.air===!!d.air&&distance(p,u)<d.radius+(u.radius||12)*.80))continue;
    const u=makeUnit(g,parent.owner,d.id,p.x,p.y);u.spawn=.3;u.lane=parent.lane;u.summonedBy=parent.id;g.units.push(u);event(g,'summon-spawn',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id,initial});made++;
  }
  return made;
}
function updateSummoner(g,u,dt=0){
  const rage=rageSpeedFactor(g,u);if(rage>1&&dt>0&&Number.isFinite(u.summonNextAt))u.summonNextAt-=dt*(rage-1);if(rage>1&&dt>0&&(u.summonCastingUntil||0)>g.time)u.summonCastingUntil-=dt*(rage-1);
  if(!u.summonType||!u.summonInterval||!Number.isFinite(u.summonNextAt)||u.hp<=0)return false;
  if((u.summonCastingUntil||0)>g.time+1e-8)return true;
  if(u.summonCastingUntil&&g.time+1e-8>=u.summonCastingUntil){
    summonMinions(g,u,false);u.summonCastingUntil=0;
    do{u.summonNextAt+=u.summonInterval;}while(u.summonNextAt<=g.time+1e-8);
    return false;
  }
  if(g.time+1e-8<u.summonNextAt)return false;
  if((u.summonWindup||0)>0){
    u.summonCastingUntil=g.time+u.summonWindup;u.target=null;u.targetLock=null;u.cd=Math.max(u.cd,u.summonWindup);
    event(g,'summon-channel',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,duration:u.summonWindup});
    return true;
  }
  summonMinions(g,u,false);
  do{u.summonNextAt+=u.summonInterval;}while(u.summonNextAt<=g.time+1e-8);
  return false;
}

function summonMiniGolems(g,parent){
  const d=UNITS[parent.splitType||'mini_golem'];if(!d)return;
  const count=Math.min(parent.splitCount||2,Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length));
  const cs=ARENA.cellSize,f=parent.owner===0?1:-1,candidates=[[-cs*.55,cs*.1],[cs*.55,cs*.1],[-cs*.45,cs*.5],[cs*.45,cs*.5],[-cs*.8,-cs*.2],[cs*.8,-cs*.2],[0,cs*.7],[0,-cs*.7]];
  let made=0;
  for(const [ox,oy] of candidates){
    if(made>=count)break;const p={x:clampInsideArena(parent.x+ox,'x',d),y:clampInsideArena(parent.y+oy*f,'y',d)};
    if(!staticFree(g,d,p,0))continue;
    if(g.units.some(u=>u.hp>0&&!!u.air===!!d.air&&distance(p,u)<d.radius+(u.radius||12)*.72))continue;
    const u=makeUnit(g,parent.owner,d.id,p.x,p.y);u.spawn=.35;u.lane=parent.lane;g.units.push(u);event(g,'split-spawn',{x:u.x,y:u.y,owner:u.owner,minion:d.id});made++;
  }
  // Crowded bridge/tower fights can leave no perfect free point. ResolveBodies will safely separate this fallback.
  while(made<count){const side=made?1:-1,u=makeUnit(g,parent.owner,d.id,clampInsideArena(parent.x+side*ARENA.cellSize*.45,'x',d),clampInsideArena(parent.y+ARENA.cellSize*.25*f,'y',d));u.spawn=.35;u.lane=parent.lane;g.units.push(u);event(g,'split-spawn',{x:u.x,y:u.y,owner:u.owner,minion:d.id});made++;}
}
function summonDeathMinions(g,parent){
  const d=UNITS[parent.deathSummonType];if(!d||!parent.deathSummonCount)return 0;
  const available=Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length),count=Math.min(parent.deathSummonCount,available);if(!count)return 0;
  const cs=ARENA.cellSize,f=parent.owner===0?1:-1,candidates=[[0,-cs*.7],[-cs*.65,0],[cs*.65,0],[0,cs*.7],[-cs*.95,-cs*.5],[cs*.95,-cs*.5],[-cs*.95,cs*.5],[cs*.95,cs*.5]];let made=0;
  for(const [ox,oy] of candidates){
    if(made>=count)break;const pos={x:clampInsideArena(parent.x+ox,'x',d),y:clampInsideArena(parent.y+oy*f,'y',d)};
    if(!staticFree(g,d,pos,0))continue;
    const u=makeUnit(g,parent.owner,d.id,pos.x,pos.y);u.spawn=0;u.lane=parent.lane;u.summonedBy=parent.id;g.units.push(u);event(g,'death-summon',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id});made++;
  }
  while(made<count){
    const a=(made/count)*Math.PI*2,p2={x:clampInsideArena(parent.x+Math.cos(a)*ARENA.cellSize*.55,'x',d),y:clampInsideArena(parent.y+Math.sin(a)*ARENA.cellSize*.55,'y',d)},u=makeUnit(g,parent.owner,d.id,p2.x,p2.y);
    u.spawn=0;u.lane=parent.lane;u.summonedBy=parent.id;u.collisionDisabled=false;g.units.push(u);event(g,'death-summon',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id});made++;
  }
  return made;
}

function revealStealth(g,u,reason='reveal'){
  if(!u.stealthed)return false;u.stealthed=false;u.stealthUntil=0;u.target=null;u.targetLock=null;event(g,'stealth-reveal',{x:u.x,y:u.y,owner:u.owner,reason});return true;
}
function updateStealth(g,u){if(u.stealthed&&g.time+1e-8>=(u.stealthUntil||0))revealStealth(g,u,'timeout');}
function frontShieldHit(t,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!(t.shieldHp>0))return false;
  const dx=x-t.x,dy=y-t.y,len=Math.hypot(dx,dy);if(len<.001)return true;
  const facing=Number.isFinite(t.facing)?t.facing:(t.owner===0?-Math.PI/2:Math.PI/2),dot=(dx/len)*Math.cos(facing)+(dy/len)*Math.sin(facing);
  return dot>=Math.cos(((t.shieldArcDeg||120)/2)*Math.PI/180);
}
function knockbackAmountFor(t){const m=t.mass||1;if(m>=12)return 0;if(m<=1.5)return 34;if(m<=5)return 20;return 8;}
function gravityAmountFor(t){const m=t.mass||1;if(m>=12)return 0;if(m<=1.5)return 28;if(m<=5)return 16;return 6;}
function forceToward(g,t,x,y,amount){
  if(!amount||t.kind||t.building||t.eggUnit||t.hp<=0)return 0;const dx=x-t.x,dy=y-t.y,len=Math.hypot(dx,dy);if(len<.001)return 0;return displaceBody(g,t,dx/len*amount,dy/len*amount);
}
function forceAway(g,t,x,y,amount){
  if(!amount||t.kind||t.building||t.eggUnit||t.hp<=0)return 0;const dx=t.x-x,dy=t.y-y,len=Math.hypot(dx,dy);if(len<.001)return 0;return displaceBody(g,t,dx/len*amount,dy/len*amount);
}
function findPhoenixEggPoint(g,t){
  const d=UNITS[t.eggType||'phoenix_egg'],base={x:clampInsideArena(t.x,'x',d),y:clampInsideArena(t.y,'y',d)};
  if(staticFree(g,d,base,0))return base;
  for(const r of [ARENA.cellSize*.5,ARENA.cellSize,ARENA.cellSize*1.5,ARENA.cellSize*2,ARENA.cellSize*3,ARENA.cellSize*4,ARENA.cellSize*5])for(let i=0;i<16;i++){const a=i*Math.PI*2/16,p={x:clampInsideArena(base.x+Math.cos(a)*r,'x',d),y:clampInsideArena(base.y+Math.sin(a)*r,'y',d)};if(staticFree(g,d,p,0))return p;}
  return {x:t.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],y:t.owner===0?ARENA.riverBottom+ARENA.cellSize:ARENA.riverTop-ARENA.cellSize};
}
function spawnPhoenixEgg(g,t){
  const type=t.eggType||'phoenix_egg',d=UNITS[type];if(!d)return null;const p=findPhoenixEggPoint(g,t),egg=makeUnit(g,t.owner,type,p.x,p.y);egg.spawn=.2;egg.lane=t.lane;egg.eggHatchAt=g.time+(egg.eggHatchTime||4);g.units.push(egg);event(g,'phoenix-egg',{x:egg.x,y:egg.y,owner:egg.owner,duration:egg.eggHatchTime||4});return egg;
}
function hatchEgg(g,egg){
  const d=UNITS[egg.hatchType||'phoenix'];if(!d||egg.hp<=0)return false;const u=makeUnit(g,egg.owner,d.id,egg.x,egg.y);u.hp=Math.round(d.hp*.5);u.maxHp=d.hp;u.spawn=.35;u.revived=true;u.lane=egg.lane;egg._hatched=true;egg.hp=0;g.units.push(u);event(g,'phoenix-revive',{x:u.x,y:u.y,owner:u.owner,hp:u.hp});return true;
}
function updateRageZones(g,dt){
  g.zones??=[];
  for(const z of g.zones){
    if(z.kind!=='rage'||z.remaining<=0)continue;
    if(!z.activated&&g.time+1e-8>=z.activateAt){
      z.activated=true;event(g,'rage-activate',{x:z.x,y:z.y,owner:z.owner,radius:z.radius,duration:z.total,boost:z.boostMultiplier||1.3});
      for(const t of [...alive(g)]){
        if(t.owner===z.owner||t.hp<=0||distance(z,t)>z.radius+(t.radius||12)*.35)continue;
        damage(g,t,(t.kind||t.building)?z.buildingDamage:z.damage,z.owner,{spell:true,zone:'rage'});
      }
    }
    if(z.activated)z.remaining=Math.max(0,z.remaining-dt);
  }
  g.zones=g.zones.filter(z=>z.kind!=='rage'||z.remaining>1e-8);
}
function updateCycloneZones(g,dt){
  g.zones??=[];const units=g.units.filter(u=>u.hp>0&&!u.kind&&!u.building&&!u.eggUnit&&u.targetable!==false&&u.burrowState!=='burrow');
  for(const z of g.zones){
    if(z.kind!=='cyclone'||z.remaining<=0)continue;
    z.remaining=Math.max(0,z.remaining-dt);
    for(const t of units){
      if(t.owner===z.owner||t.hp<=0)continue;const d=distance(z,t);if(d>z.radius+(t.radius||12)*.25)continue;
      const m=t.mass||1,factor=m>=12?.1:m<=1.5?1:m<=5?.65:.3,step=(z.pullSpeed||210)*factor*dt;forceToward(g,t,z.x,z.y,Math.min(step,Math.max(0,d-2)));
    }
  }
  g.zones=g.zones.filter(z=>z.kind!=='cyclone'||z.remaining>1e-8);
}
function skeletonRushSpawnPoint(g,z){
  const d=UNITS[z.spawnType||'skeleton'];if(!d)return null;
  const valid=p=>staticFree(g,d,p,0)&&!g.units.some(u=>u.hp>0&&!u.air&&!u.building&&distance(p,u)<(d.radius||7)+(u.radius||12)*.45);
  for(let i=0;i<32;i++){
    const a=random(g)*Math.PI*2,r=Math.sqrt(random(g))*Math.max(0,(z.radius||cellsToWorld(3.5))-(d.radius||7)),p={x:z.x+Math.cos(a)*r,y:z.y+Math.sin(a)*r};
    if(valid(p))return p;
  }
  for(const frac of [.2,.4,.6,.8])for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16+(z.owner?Math.PI/16:0),r=(z.radius||cellsToWorld(3.5))*frac,p={x:z.x+Math.cos(a)*r,y:z.y+Math.sin(a)*r};
    if(valid(p))return p;
  }
  return null;
}
function spawnSkeletonRushMinion(g,z){
  if(g.units.filter(u=>u.hp>0).length>=ARENA.maxUnits)return false;
  const d=UNITS[z.spawnType||'skeleton'],p=skeletonRushSpawnPoint(g,z);if(!d||!p)return false;
  const u=makeUnit(g,z.owner,d.id,p.x,p.y);u.spawn=.2;u.summonedBy=z.id;u.lane=p.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];g.units.push(u);
  event(g,'skeletonrush-spawn',{x:u.x,y:u.y,owner:u.owner,minion:d.id});return true;
}
function updateSkeletonRushZones(g,dt){
  for(const z of g.zones||[]){
    if(z.kind!=='skeletonrush')continue;
    if(g.time+1e-8<z.activateAt){z.remaining=z.total;continue;}
    if(!z.activated){z.activated=true;event(g,'skeletonrush-activate',{x:z.x,y:z.y,owner:z.owner,radius:z.radius});}
    while(z.nextSpawnAt<=g.time+1e-8&&z.nextSpawnAt<=z.expiresAt+1e-8){spawnSkeletonRushMinion(g,z);z.nextSpawnAt+=z.spawnEvery||.5;}
    z.remaining=Math.max(0,z.expiresAt-g.time);
  }
}
function updateDelayedDeathBombs(g,dt){
  for(const z of g.zones||[]){
    if(z.kind!=='giantskeletonbomb'&&z.kind!=='airballoonbomb')continue;
    z.remaining=Math.max(0,z.detonateAt-g.time);
    if(z.detonated||g.time+1e-8<z.detonateAt)continue;
    const balloon=z.kind==='airballoonbomb';z.detonated=true;event(g,balloon?'airballoon-bomb-explode':'giantskeleton-bomb-explode',{x:z.x,y:z.y,owner:z.owner,radius:z.radius,damage:z.damage});
    const centre={x:z.x,y:z.y};
    for(const v of [...alive(g)]){
      if(v.owner===z.owner||v.hp<=0)continue;
      const gap=(v.kind||v.building)?targetGap(centre,v):distance(centre,v);
      if(gap>z.radius+(v.kind||v.building?0:(v.radius||12)*.35))continue;
      if(v.air&&!v.kind&&!v.building)continue;
      damage(g,v,z.damage,z.owner,{spell:true,giantSkeletonBomb:!balloon,airBalloonBomb:balloon});
    }
    z.remaining=0;
  }
}
function handleUnitDeath(g,t){
  if(t._deathHandled)return;t._deathHandled=true;
  event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:t.type==='golem'});
  if(t.deathBombDamage&&t.deathBombRadius&&t.deathBombDelay){
    const kind=t.deathBombKind||'giantskeletonbomb',balloon=kind==='airballoonbomb';
    g.zones??=[];g.zones.push({id:`z${g.nextId++}`,owner:t.owner,kind,x:t.x,y:t.y,radius:t.deathBombRadius,damage:t.deathBombDamage,total:t.deathBombDelay,remaining:t.deathBombDelay,detonateAt:g.time+t.deathBombDelay,detonated:false});
    event(g,balloon?'airballoon-bomb-place':'giantskeleton-bomb-place',{x:t.x,y:t.y,owner:t.owner,radius:t.deathBombRadius,duration:t.deathBombDelay});
  }
  if(t.deathRage){deployRageZone(g,t.owner,t.x,t.y,UNITS.rage,'lumberjack');event(g,'lumberjack-rage-drop',{x:t.x,y:t.y,owner:t.owner,radius:UNITS.rage.radius,duration:UNITS.rage.activationDelay||1.5});}
  if(Number.isFinite(t.enemyEnergyOnDeath)&&t.enemyEnergyOnDeath>0){
    const enemy=t.owner===0?1:0,p=g.players[enemy],before=p.energy;
    p.energy=Math.min(ARENA.maxEnergy,p.energy+t.enemyEnergyOnDeath);
    const granted=p.energy-before;
    if(granted>1e-8)event(g,'energy-gift',{x:t.x,y:t.y,owner:enemy,sourceOwner:t.owner,amount:granted});
  }
  if(Number.isFinite(t.ownerEnergyOnDeath)&&t.ownerEnergyOnDeath>0){
    const p=g.players[t.owner],before=p.energy;p.energy=Math.min(ARENA.maxEnergy,p.energy+t.ownerEnergyOnDeath);const granted=p.energy-before;
    event(g,'pump-break-energy',{x:t.x,y:t.y,owner:t.owner,amount:granted,requested:t.ownerEnergyOnDeath});
  }
  if(t.deathDamage&&t.deathRadius){
    event(g,'death-blast',{x:t.x,y:t.y,owner:t.owner,radius:t.deathRadius,damage:t.deathDamage,unitType:t.type});
    const victims=[...alive(g)];
    for(const v of victims)if(v.id!==t.id&&v.owner!==t.owner&&v.hp>0&&distance(t,v)<=t.deathRadius+(v.radius||12)*.35)damage(g,v,t.deathDamage,t.owner);
  }
  if(t.splitType&&t.splitCount){
    if(t.type==='elixirgolem'||t.type==='elixir_golem_mid')event(g,'elixir-split',{x:t.x,y:t.y,owner:t.owner,fromType:t.type,toType:t.splitType,count:t.splitCount,stage:t.elixirStage||1});
    summonMiniGolems(g,t);
  }
  if(t.deathSummonType&&t.deathSummonCount)summonDeathMinions(g,t);
  if(t.phoenixRevive&&!t.revived)spawnPhoenixEgg(g,t);
  if(t.carrierDeathDamage&&t.carrierDeathRadius&&!t._carrierReachedTarget){
    event(g,'carrier-blast',{x:t.x,y:t.y,owner:t.owner,radius:t.carrierDeathRadius,damage:t.carrierDeathDamage});
    const victims=[...alive(g)];
    for(const v of victims)if(v.id!==t.id&&v.owner!==t.owner&&v.hp>0&&!v.kind&&!v.building&&distance(t,v)<=t.carrierDeathRadius+(v.radius||12)*.35)damage(g,v,t.carrierDeathDamage,t.owner);
  }
}
function damage(g,t,amount,owner,meta={}){
  if(t.hp<=0||t.burrowState==='burrow'||t.targetable===false)return 0;
  if((t.invulnerableUntil||0)>g.time){if(t.type==='nightshade')event(g,'shadow-evade',{x:t.x,y:t.y,owner:t.owner});return 0;}
  if(t.stealthed&&amount>0)revealStealth(g,t,'damage');
  const markActive=t.ironMarked&&t.ironMarkOwner===owner&&!meta.markBurst;
  if(markActive&&amount>0)amount*=1+(t.ironMarkBonus||.20);
  let hpAmount=amount,absorbed=0;
  if(t.siegeTurtle&&t.moving&&meta.ranged&&!meta.spell&&hpAmount>0){
    const reduction=clamp(t.movingRangedReduction||.40,0,.9);hpAmount*=1-reduction;
    event(g,'turtle-shell',{x:t.x,y:t.y,owner:t.owner,reduction});
  }
  if(t.shieldAll&&t.shieldHp>0&&amount>0){
    absorbed=Math.min(t.shieldHp,amount);t.shieldHp=Math.max(0,t.shieldHp-absorbed);hpAmount=t.shieldNoOverflow?0:Math.max(0,amount-absorbed);
    event(g,'shield-hit',{x:t.x,y:t.y,owner:t.owner,absorbed,shieldHp:t.shieldHp,maxShieldHp:t.maxShieldHp||t.shieldMax||0});if(t.shieldHp<=1e-8)event(g,'shield-break',{x:t.x,y:t.y,owner:t.owner});
  }else if(meta.shieldable&&!meta.spell&&t.shieldHp>0&&frontShieldHit(t,meta.sourceX,meta.sourceY)){
    const wanted=amount*(t.shieldAbsorb||.65);absorbed=Math.min(t.shieldHp,wanted);t.shieldHp=Math.max(0,t.shieldHp-absorbed);hpAmount=Math.max(0,amount-absorbed);
    event(g,'shield-hit',{x:t.x,y:t.y,owner:t.owner,absorbed,shieldHp:t.shieldHp,maxShieldHp:t.maxShieldHp||t.shieldMax||0});if(t.shieldHp<=1e-8)event(g,'shield-break',{x:t.x,y:t.y,owner:t.owner});
  }
  const before=t.hp;t.hp=Math.max(0,t.hp-hpAmount);t.hit=.18;
  const dealt=before-t.hp;
  let markBurst=0;
  if(markActive&&dealt>0&&t.hp>0){
    t.ironMarkDamage=(t.ironMarkDamage||0)+dealt;
    if(t.ironMarkDamage+1e-8>=(t.ironMarkThreshold||500)){
      markBurst=t.ironMarkBurstDamage||300;t.ironMarked=false;t.ironMarkOwner=null;t.ironMarkDamage=0;
      event(g,'iron-mark-break',{x:t.x,y:t.y,owner,damage:markBurst});damage(g,t,markBurst,owner,{markBurst:true,spell:true});
    }
  }
  if(t.siegeTurtle&&dealt>0&&!meta.ranged&&!meta.spell&&!meta.retaliation&&!meta.markBurst){
    const ratio=Number.isFinite(t.retaliationRatio)?t.retaliationRatio:(1/3);
    const radius=Number.isFinite(t.retaliationRadius)?t.retaliationRadius:54;
    const retaliate=Math.max(1,Math.round(dealt*ratio));
    let triggered=false;
    for(const v of g.units){
      if(v.hp<=0||v.owner===t.owner||v.id===t.id||v.air||v.kind||v.building||v.targetable===false||v.burrowState==='burrow')continue;
      if(distance(t,v)>radius+(v.radius||12)*.35)continue;
      triggered=true;
      damage(g,v,retaliate,t.owner,{retaliation:true,sourceX:t.x,sourceY:t.y});
    }
    if(triggered)event(g,'turtle-retaliation',{x:t.x,y:t.y,owner:t.owner,radius,damage:retaliate});
  }
  if(t.kind==='core'&&t.hp<before)wakeCore(g,t.owner,'core-hit');
  if(t.hp===0){
    t.ironMarked=false;t.ironMarkOwner=null;t.ironMarkDamage=0;
    if(t.kind){event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:true});if(t.kind==='tower')wakeCore(g,t.owner,'side-down');}
    else handleUnitDeath(g,t);
  }
  return absorbed+dealt;
}
function decayStructure(g,t,amount){
  if(t.hp<=0||amount<=0)return;
  t.hp=Math.max(0,t.hp-amount);
  if(t.hp===0)handleUnitDeath(g,t);
}
function heal(g,t,amount,owner){
  if(t.hp<=0||t.hp>=t.maxHp||t.kind||t.building)return 0;
  const before=t.hp;t.hp=Math.min(t.maxHp,t.hp+amount);
  const restored=t.hp-before;if(restored>0)event(g,'heal',{x:t.x,y:t.y,owner,amount:restored});
  return restored;
}
function healOnHitPulse(g,sourceId){
  if(!sourceId)return 0;
  const u=g.units.find(q=>q.id===sourceId&&q.hp>0);if(!u||!u.healOnHit)return 0;
  const amount=u.healOnHit,range=u.healOnHitRange||cellsToWorld(4),maxAllies=Math.max(0,u.healOnHitMaxAllies??3);
  let healed=heal(g,u,amount,u.owner)>0?1:0;
  const allies=g.units.filter(t=>t.id!==u.id&&t.owner===u.owner&&t.hp>0&&!t.kind&&!t.building&&!t.eggUnit&&t.hp<t.maxHp&&distance(u,t)<=range+(t.radius||12));
  allies.sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp)||a.hp/a.maxHp-b.hp/b.maxHp||String(a.id).localeCompare(String(b.id)));
  for(const t of allies.slice(0,maxAllies))if(heal(g,t,amount,u.owner)>0)healed++;
  if(healed)event(g,'healer-pulse',{x:u.x,y:u.y,owner:u.owner,radius:range,amount,targets:healed});
  return healed;
}
function applySlow(g,t,p){
  if(!p.slowDuration||t.kind||t.building||t.air)return;
  const active=(t.slowUntil||0)>g.time;
  const moveStages=Array.isArray(p.slowMoveStages)?p.slowMoveStages:null;
  const attackStages=Array.isArray(p.slowAttackStages)?p.slowAttackStages:null;
  const maxStage=Math.max(moveStages?.length||0,attackStages?.length||0,1);
  const stage=Math.min(maxStage,active?Math.max(1,(t.slowStage||1)+1):1);
  t.slowStage=stage;
  t.slowUntil=g.time+p.slowDuration;
  if(moveStages)t.slowMoveFactor=moveStages[Math.min(stage-1,moveStages.length-1)];
  else t.slowMoveFactor=Math.min(t.slowMoveFactor||1,p.slowMove||1);
  if(attackStages)t.slowAttackFactor=attackStages[Math.min(stage-1,attackStages.length-1)];
  else t.slowAttackFactor=Math.min(t.slowAttackFactor||1,p.slowAttack||1);
  if(t.chargeDistance&&t.buildingOnly&&!t.mountedCharge){
    t.chargeRun=Math.max(0,(t.chargeRun||0)-45);
    if(t.chargeRun<t.chargeDistance*.8)t.charged=false;
  }
  event(g,'slow',{x:t.x,y:t.y,owner:p.owner,stage});
}
function resetSparkyCharge(g,u,delayUntil=g.time){
  if(!u.sparkUnit)return;
  u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=delayUntil;
}
function resetMountedCharge(u){
  if(!u?.mountedCharge)return;
  u.chargeRun=0;u.charged=false;
}
function applyStun(g,t,duration,owner){
  const until=Math.max(t.stunUntil||0,g.time+(duration||0)),keepMegaLock=t.megaKnight?t.targetLock:null;t.stunUntil=until;t.target=null;t.targetLock=keepMegaLock;
  if(t.ironSpinState){t.ironSpinState=null;t.ironSpinProgress=0;t.collisionDisabled=false;}
  if(t.tracker&&t.hookState)cancelTrackerHook(g,t);
  if(t.laserTower||t.laserUnit)resetLaserTower(t);
  if(t.drillUnit)resetDrill(t);
  if(t.crusherRamp)resetCrusher(t);
  if(t.sparkUnit)resetSparkyCharge(g,t,until);
  if(t.siegeRam){t.charged=false;t.ramChargeTime=0;}
  if(t.mountedCharge)resetMountedCharge(t);
  if(t.dashState){t.dashState=null;t.dashTarget=null;t.dashEnd=null;t.invulnerableUntil=0;t.dashReadyAt=Math.max(t.dashReadyAt||0,until+.35);}
  event(g,'stun',{x:t.x,y:t.y,owner,targetOwner:t.owner,duration});
}
function updateSparkyCharge(g,u){
  if(!u.sparkUnit||u.hp<=0)return;
  if(u.sparkCharged){u.sparkChargeProgress=1;return;}
  if(!Number.isFinite(u.sparkChargeStartAt))u.sparkChargeStartAt=g.time;
  const total=Math.max(.1,u.sparkChargeTime||3.5),progress=clamp((g.time-u.sparkChargeStartAt)/total,0,1);u.sparkChargeProgress=progress;
  if(progress>=1-1e-8){u.sparkCharged=true;u.sparkChargeProgress=1;event(g,'sparky-ready',{x:u.x,y:u.y,owner:u.owner});}
}
function fireballKnockback(g,p,t,centre){
  if(!p.knockbackCells||t.hp<=0||t.kind||t.building||t.eggUnit||visionSizeFor(t)==='large')return 0;
  let dx=t.x-centre.x,dy=t.y-centre.y,len=Math.hypot(dx,dy);
  if(len<.001){dx=centre.x-p.sx;dy=centre.y-p.sy;len=Math.hypot(dx,dy);}
  if(len<.001){dx=0;dy=p.owner===0?-1:1;len=1;}
  const amount=cellsToWorld(p.knockbackCells),moved=displaceBody(g,t,dx/len*amount,dy/len*amount);
  if(moved>0)event(g,'fireball-knockback',{x:t.x,y:t.y,owner:p.owner,amount:moved,sourceX:centre.x,sourceY:centre.y});
  return moved;
}
function spellAreaImpact(g,p,type){
  event(g,type==='arrowrain'?'arrowrain-impact':'fireball-impact',{x:p.tx,y:p.ty,owner:p.owner,radius:p.splash,damage:p.damage});
  const centre={x:p.tx,y:p.ty};
  for(const t of [...alive(g)]){
    if(t.owner===p.owner||t.hp<=0)continue;
    if(distance(centre,t)>p.splash+(t.radius||12)*.35)continue;
    damage(g,t,(t.kind||t.building)?p.buildingDamage:p.damage,p.owner,{spell:true});
    if(type==='fireball'&&t.hp>0)fireballKnockback(g,p,t,centre);
  }
}
function insideEnemyPoison(g,t,owner){
  return (g.zones||[]).some(z=>z.kind==='poison'&&z.owner===owner&&z.remaining>0&&distance(z,t)<=z.radius+(t.radius||12)*.25);
}
function updatePoisonZones(g,dt){
  g.zones??=[];
  const entities=alive(g);
  for(const z of g.zones){
    if(z.kind!=='poison')continue;
    z.remaining=Math.max(0,z.remaining-dt);
    while(z.remaining>0&&z.nextTick<=g.time+1e-8){
      for(const t of entities){
        if(t.owner===z.owner||t.hp<=0||t.targetable===false||distance(z,t)>z.radius+(t.radius||12)*.25)continue;
        const dealt=damage(g,t,(t.kind||t.building)?z.buildingDamage:z.damage,z.owner);
        if(dealt>0&&!t.kind&&!t.building&&t.hp>0){
          t.poisonOwner=z.owner;t.poisonUntil=Math.max(t.poisonUntil||0,g.time+z.lingerDuration);
          t.poisonDamage=Math.max(t.poisonDamage||0,z.lingerDamage);t.poisonTickEvery=z.tickEvery;
          t.poisonNextAt=Math.max(t.poisonNextAt||0,g.time+z.tickEvery);
        }
      }
      z.nextTick+=z.tickEvery;
    }
  }
  g.zones=g.zones.filter(z=>z.remaining>1e-8);
}
function decayMudZones(g,dt){for(const z of g.zones||[])if(z.kind==='mud')z.remaining=Math.max(0,z.remaining-dt);g.zones=(g.zones||[]).filter(z=>z.remaining>1e-8);}
function updateLingeringPoison(g,t){
  if(t.hp<=0||t.kind||t.building||!(t.poisonUntil>g.time)||!Number.isFinite(t.poisonOwner))return;
  if(insideEnemyPoison(g,t,t.poisonOwner))return;
  const every=t.poisonTickEvery||.5;
  while((t.poisonNextAt||0)<=g.time+1e-8&&t.poisonUntil>=(t.poisonNextAt||0)-1e-8){
    damage(g,t,t.poisonDamage||18,t.poisonOwner);t.poisonNextAt=(t.poisonNextAt||g.time)+every;
    if(t.hp<=0)break;
  }
}
function createMudZone(g,p){
  if(!p.mudRadius||!p.mudDuration)return;
  g.zones??=[];g.zones.push({id:`z${g.nextId++}`,owner:p.owner,kind:'mud',x:p.x,y:p.y,radius:p.mudRadius,remaining:p.mudDuration,total:p.mudDuration,tickEvery:p.mudTickEvery||.5,damage:p.mudDamage||30,slow:p.mudSlow||.7});
  event(g,'mud-deploy',{x:p.x,y:p.y,owner:p.owner,radius:p.mudRadius});
}
function updateMudZones(g){
  const zones=(g.zones||[]).filter(z=>z.kind==='mud'&&z.remaining>0);if(!zones.length)return;
  for(const t of alive(g)){
    if(t.hp<=0||t.kind||t.building||t.air||t.targetable===false||t.burrowState==='burrow')continue;
    const z=zones.find(q=>q.owner!==t.owner&&distance(q,t)<=q.radius+(t.radius||12)*.25);if(!z)continue;
    t.mudUntil=Math.max(t.mudUntil||0,g.time+Math.min(.55,z.remaining));t.mudSlowFactor=Math.min(t.mudSlowFactor||1,z.slow||.7);
    if((t.mudNextAt??-Infinity)<=g.time+1e-8){damage(g,t,z.damage||30,z.owner);t.mudNextAt=g.time+(z.tickEvery||.5);}
  }
}
function impact(g,p,entities){
  const target=entities.find(t=>t.id===p.target);
  if(p.chainCount&&target&&targetable(p,target)){
    const points=[];let current=target,amount=p.damage,source={x:p.sx,y:p.sy};const hit=new Set();
    for(let i=0;i<p.chainCount&&current;i++){
      const hitDamage=Array.isArray(p.chainDamages)&&Number.isFinite(p.chainDamages[i])?p.chainDamages[i]:Math.round(amount);
      hit.add(current.id);damage(g,current,hitDamage,p.owner,{shieldable:true,ranged:true,sourceX:source.x,sourceY:source.y});if(p.stunDuration&&current.hp>0)applyStun(g,current,p.stunDuration,p.owner);points.push({x:current.x,y:current.y,damage:hitDamage});
      source={x:current.x,y:current.y};amount*=p.chainFalloff||.8;
      const candidates=entities.filter(t=>!hit.has(t.id)&&targetable(p,t)&&!t.kind&&!t.building&&distance(current,t)<=p.chainRange+t.radius)
        .sort((a,b)=>distance(current,a)-distance(current,b)||String(a.id).localeCompare(String(b.id)));
      current=candidates[0]||null;
    }
    event(g,'chain',{x:p.x,y:p.y,owner:p.owner,points});
  }else if(p.splash){
    event(g,'blast',{x:p.x,y:p.y,owner:p.owner,radius:p.splash,color:p.kind});
    for(const t of entities)if(areaTargetable(p,t)&&distance(t,p)<=p.splash+t.radius*.35){
      damage(g,t,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:p.sx,sourceY:p.sy});
      if(t.hp>0&&p.gravityPull){const moved=forceToward(g,t,p.x,p.y,gravityAmountFor(t));if(moved>0)event(g,'gravity-pull',{x:t.x,y:t.y,owner:p.owner,amount:moved});}
      if(t.hp>0&&p.slowDuration)applySlow(g,t,p);if(t.hp>0&&p.stunDuration&&(!p.stunUnitsOnly||(!t.kind&&!t.building)))applyStun(g,t,p.stunDuration,p.owner);
    }
    createMudZone(g,p);
  }else if(target&&targetable(p,target)){
    const wasIronMarked=!!(p.ironMark&&target.ironMarked&&target.ironMarkOwner===p.owner);
    const dealt=damage(g,target,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:p.sx,sourceY:p.sy});
    if(dealt>0&&p.sourceUnitId)healOnHitPulse(g,p.sourceUnitId);
    if(target.hp>0&&p.ironMark&&!wasIronMarked)applyIronMark(g,target,{ironMark:true,owner:p.owner,markDamageBonus:p.markDamageBonus,markThreshold:p.markThreshold,markBurstDamage:p.markBurstDamage});
    if(target.hp>0&&p.knockback){const moved=forceAway(g,target,p.sx,p.sy,knockbackAmountFor(target));if(moved>0)event(g,'wind-push',{x:target.x,y:target.y,owner:p.owner,amount:moved});}
    applySlow(g,target,p);
  }
}
function projectileSpeed(kind){
  return ({bomb:180,sky_bomb:260,airballoon_bomb:250,lightning:520,electro:450,wind:430,gravity:360,phoenix_fire:420,thrown_spear:480,dart:560,iron_arrow:500,mud:300,royal_arrow:470,royal_shell:310,sparkblast:340})[kind]||390;
}
function beginFalcheAxe(g,u,t){
  const dx=t.x-u.x,dy=t.y-u.y,len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len,range=u.axeTravelRange||cellsToWorld(7);
  const ex=clamp(u.x+nx*range,0,ARENA.width),ey=clamp(u.y+ny*range,0,ARENA.height),rage=rageSpeedFactor(g,u);
  commitMobileTarget(u,t);faceToward(u,t.x,t.y);u.cd=u.cooldown;u.anim=.35;u.target=t.id;u.axeInFlight=true;u.moving=false;
  g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,kind:'executioner_axe',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:ex,ty:ey,ex,ey,phase:'out',speed:(u.axeSpeed||260)*rage,damage:u.damage,hitWidth:u.axeHitWidth||cellsToWorld(2),sourceUnitId:u.id,outHits:[],backHits:[],progress:0,life:6});
  event(g,'falche-throw',{x:u.x,y:u.y,tx:ex,ty:ey,owner:u.owner,range,damage:u.damage});
}
function falcheAxeHits(g,p,a,b,entities){
  const hits=p.phase==='out'?p.outHits:p.backHits,half=(p.hitWidth||cellsToWorld(2))/2;
  for(const t of entities){
    if(t.owner===p.owner||t.hp<=0||t.targetable===false||t.burrowState==='burrow'||hits.includes(t.id))continue;
    if(pointSegmentDistance(t.x,t.y,a.x,a.y,b.x,b.y)>half+(t.radius||12)*.35)continue;
    hits.push(t.id);damage(g,t,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:a.x,sourceY:a.y});event(g,'falche-hit',{x:t.x,y:t.y,owner:p.owner,phase:p.phase,damage:p.damage});
  }
}
function updateFalcheAxe(g,p,dt,entities){
  const a={x:p.x,y:p.y},target=p.phase==='out'?{x:p.ex,y:p.ey}:{x:p.sx,y:p.sy},d=Math.hypot(target.x-p.x,target.y-p.y),step=(p.speed||260)*dt;
  if(d<=step+1e-8){p.x=target.x;p.y=target.y;falcheAxeHits(g,p,a,p,entities);
    if(p.phase==='out'){p.phase='back';p.progress=1;event(g,'falche-return',{x:p.x,y:p.y,tx:p.sx,ty:p.sy,owner:p.owner});}
    else {p.life=0;const source=g.units.find(u=>u.id===p.sourceUnitId&&u.hp>0);if(source){source.axeInFlight=false;event(g,'falche-catch',{x:source.x,y:source.y,owner:source.owner});}}
    return;
  }
  p.x+=(target.x-p.x)/d*step;p.y+=(target.y-p.y)/d*step;falcheAxeHits(g,p,a,p,entities);
  const full=Math.max(1,Math.hypot(p.ex-p.sx,p.ey-p.sy)),leg=Math.hypot(p.x-p.sx,p.y-p.sy)/full;p.progress=p.phase==='out'?clamp(leg,0,1):clamp(2-leg,1,2);
}
function attack(g,u,t){
  if(u.sparkUnit&&!u.sparkCharged)return;
  if(u.executionerAxe){beginFalcheAxe(g,u,t);return;}
  const mountedChargeHit=!!(u.mountedCharge&&u.charged);
  if(u.mountedCharge)resetMountedCharge(u); // Any attack interrupts the continuous-walk charge gauge.
  // First actual attack commits ordinary mobile units to this target.
  commitMobileTarget(u,t);
  const attackFactor=(u.slowUntil||0)>g.time?(u.slowAttackFactor||1):1;
  u.cd=u.cooldown/Math.max(.15,attackFactor);u.anim=u.valkyrieSpin?.5:.35;faceToward(u,t.x,t.y);u.target=t.id;
  if(u.siegeRam&&(t.kind||t.building)){
    const charged=!!u.charged,amount=charged?(u.ramChargeDamage||572):(u.ramImpactDamage||u.suicideDamage||u.damage);
    damage(g,t,amount,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y});
    event(g,'ram-hit',{x:t.x,y:t.y,owner:u.owner,amount,charged,radius:charged?54:40});
    u.charged=false;u.ramChargeTime=0;u._carrierReachedTarget=true;u.hp=0;handleUnitDeath(g,u);return;
  }
  if(u.suicideUnit&&(t.kind||t.building)){
    const amount=u.suicideDamage||u.damage;damage(g,t,amount,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y});
    event(g,'suicide-hit',{x:t.x,y:t.y,owner:u.owner,amount});u._carrierReachedTarget=true;u.hp=0;handleUnitDeath(g,u);return;
  }
  let amount=(t.kind||t.building)&&Number.isFinite(u.structureDamage)?u.structureDamage:u.damage;
  if(mountedChargeHit)amount=u.chargeDamage||amount*2;
  if(u.crusherRamp&&(t.kind||t.building)){
    if(u.crusherTarget!==t.id){u.crusherTarget=t.id;u.crusherStage=0;}
    const stages=Array.isArray(u.crusherDamages)?u.crusherDamages:[u.damage];
    amount=stages[Math.min(u.crusherStage||0,stages.length-1)];
  }
  if(u.stealthed){amount=Math.round(amount*(u.stealthFirstMultiplier||1));revealStealth(g,u,'attack');}
  if(u.sparkUnit){u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=g.time;event(g,'sparky-fire',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,radius:u.splash||90});}
  if(u.chargeMultiplier&&u.charged&&(t.kind||t.building)){
    amount=Math.round(amount*u.chargeMultiplier);u.charged=false;u.chargeRun=0;
    event(g,'charge-hit',{x:t.x,y:t.y,owner:u.owner,radius:48});
  }
  if(u.projectile){
    g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,x:u.x,y:u.y-6,sx:u.x,sy:u.y,tx:t.x,ty:t.y,target:t.id,
    kind:u.projectile,speed:projectileSpeed(u.projectile),damage:amount,splash:u.splash||0,sourceUnitId:u.id,
    targetsAir:u.targetsAir,life:3,slowMove:u.slowMove,slowAttack:u.slowAttack,slowMoveStages:u.slowMoveStages,slowAttackStages:u.slowAttackStages,slowDuration:u.slowDuration,
    ironMark:!!u.ironMark,markDamageBonus:u.markDamageBonus,markThreshold:u.markThreshold,markBurstDamage:u.markBurstDamage,sourceUnitType:u.type,
    chainCount:u.chainCount,chainRange:u.chainRange,chainFalloff:u.chainFalloff,chainDamages:Array.isArray(u.chainDamages)?u.chainDamages.map(v=>u.damage?Math.round(v*(amount/u.damage)):0):u.chainDamages,stunDuration:u.stunDuration,stunUnitsOnly:u.stunUnitsOnly,mudRadius:u.mudRadius,mudDuration:u.mudDuration,mudTickEvery:u.mudTickEvery,mudDamage:u.mudDamage,mudSlow:u.mudSlow,knockback:!!u.knockback,gravityPull:!!u.gravityPull});
  }else{
    if(u.valkyrieSpin&&u.meleeSplash)megaAreaDamage(g,u,u.x,u.y,amount,u.meleeSplash,'valkyrie-spin',true);
    else if(u.meleeSplash)megaAreaDamage(g,u,t.x,t.y,amount,u.meleeSplash,u.megaKnight?'mega-smash':'slash-splash',true);
    else damage(g,t,amount,u.owner,{shieldable:true,sourceX:u.x,sourceY:u.y});
    if(mountedChargeHit)event(g,'mounted-charge-hit',{x:t.x,y:t.y,owner:u.owner,amount,kind:u.type,radius:u.meleeSplash||24});
    event(g,'slash',{x:t.x,y:t.y,owner:u.owner,angle:Math.atan2(t.y-u.y,t.x-u.x),kind:u.type});
    if(u.crusherRamp){
      const stages=Array.isArray(u.crusherDamages)?u.crusherDamages:[u.damage];u.crusherStage=Math.min((u.crusherStage||0)+1,stages.length-1);
      event(g,'crusher-hit',{x:t.x,y:t.y,owner:u.owner,amount,stage:u.crusherStage});
    }
  }
}
function resetDrill(u){u.drillTarget=null;u.drillLockTime=0;u.drillStage=0;u.drillDps=u.drillBaseDps||90;}
function updateDrill(g,u,t,dt){
  if(!u.drillUnit)return false;
  if(!t){resetDrill(u);u.target=null;return true;}
  if(u.drillTarget!==t.id){u.drillTarget=t.id;u.drillLockTime=0;u.drillStage=0;u.drillDps=u.drillBaseDps||90;event(g,'drill-lock',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner});}
  else u.drillLockTime=(u.drillLockTime||0)+dt;
  const stages=Array.isArray(u.drillDpsStages)&&u.drillDpsStages.length?u.drillDpsStages:[u.drillBaseDps||90];
  const stage=Math.min(stages.length-1,Math.max(0,Math.floor((u.drillLockTime+1e-9)/(u.drillRampEvery||1.5))));
  if(stage!==(u.drillStage||0))event(g,'drill-ramp',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,stage,dps:stages[stage]});
  u.drillStage=stage;u.drillDps=stages[stage];u.target=t.id;u.anim=.12;faceToward(u,t.x,t.y);damage(g,t,u.drillDps*dt,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y});return true;
}
function grantPumpEnergy(g,u,reason='cycle'){
  if(!u.energyPump||u.hp<=0)return 0;const p=g.players[u.owner],amount=u.energyAmount||1,before=p.energy;p.energy=Math.min(ARENA.maxEnergy,p.energy+amount);const granted=p.energy-before;
  event(g,'pump-energy',{x:u.x,y:u.y,owner:u.owner,amount:granted,requested:amount,reason});return granted;
}
function updateEnergyPump(g,u,dt=0){
  const rage=rageSpeedFactor(g,u);if(rage>1&&dt>0&&Number.isFinite(u.energyNextAt))u.energyNextAt-=dt*(rage-1);
  if(!u.energyPump||u.hp<=0||!u.energyInterval||!Number.isFinite(u.energyNextAt))return;
  while(g.time+1e-8>=u.energyNextAt&&u.hp>0){grantPumpEnergy(g,u,'cycle');u.energyNextAt+=u.energyInterval;}
}
function resetCrusher(u){u.crusherTarget=null;u.crusherStage=0;}
function resetLaserTower(u){
  u.laserTarget=null;u.laserLockTime=0;u.laserStage=0;u.laserDps=u.laserBaseDps||20;u.laserDamageElapsed=0;
}
function updateLaserTower(g,u,t,dt){
  if(!u.laserTower&&!u.laserUnit)return false;
  if(!t){resetLaserTower(u);u.target=null;return true;}
  if(u.laserTarget!==t.id){
    if(u.laserUnit)commitMobileTarget(u,t);
    u.laserTarget=t.id;u.laserLockTime=0;u.laserStage=0;u.laserDps=u.laserBaseDps||20;u.laserDamageElapsed=0;
    event(g,'laser-lock',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner});
  }else u.laserLockTime=(u.laserLockTime||0)+dt;
  const every=u.laserRampEvery||1.5,mult=u.laserMultiplier||2,stage=Math.max(0,Math.floor((u.laserLockTime+1e-9)/every));
  if(stage!==(u.laserStage||0))event(g,'laser-ramp',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,stage});
  u.laserStage=stage;u.laserDps=(u.laserBaseDps||20)*Math.pow(mult,stage);u.target=t.id;u.anim=.12;faceToward(u,t.x,t.y);
  const damageTick=Number.isFinite(u.laserDamageTick)?Math.max(.01,u.laserDamageTick):0;
  if(damageTick>0){
    u.laserDamageElapsed=(u.laserDamageElapsed||0)+dt;
    while(u.laserDamageElapsed+1e-9>=damageTick&&t.hp>0){
      u.laserDamageElapsed=Math.max(0,u.laserDamageElapsed-damageTick);
      damage(g,t,u.laserDps*damageTick,u.owner,{shieldable:true,ranged:true,sourceX:u.x,sourceY:u.y});
    }
  }else damage(g,t,u.laserDps*dt,u.owner,{shieldable:true,ranged:true,sourceX:u.x,sourceY:u.y});
  return true;
}
function healingPulse(g,u,entities){
  if(!u.healPower||u.healCd>0)return;
  const allies=entities.filter(t=>t.id!==u.id&&t.owner===u.owner&&!t.kind&&!t.building&&t.hp>0&&t.hp<t.maxHp&&distance(u,t)<=u.healRange+t.radius);
  if(!allies.length)return;
  allies.sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp)||a.hp/a.maxHp-b.hp/b.maxHp||String(a.id).localeCompare(String(b.id)));
  const target=allies[0];
  if(heal(g,target,u.healPower,u.owner)>0){u.healCd=u.healCooldown;u.anim=Math.max(u.anim,.3);faceToward(u,target.x,target.y);}
}

export function towerScore(g,owner){
  const enemy=g.towers.filter(t=>t.owner!==owner);
  return enemy.some(t=>t.kind==='core'&&t.hp<=0)?3:enemy.filter(t=>t.hp<=0).length;
}
export function finish(g,winner,reason){g.phase='ended';g.winner=winner;g.reason=reason;}
function winCheck(g){
  const dead=[0,1].map(o=>g.towers.find(t=>t.owner===o&&t.kind==='core').hp<=0);
  if(dead[0]||dead[1]){finish(g,dead[0]&&dead[1]?null:(dead[0]?1:0),'本拠地が破壊されました');return;}
  const scores=[towerScore(g,0),towerScore(g,1)];
  if(g.time>=ARENA.duration-1e-7&&!g.overtime){
    if(scores[0]!==scores[1]){finish(g,scores[0]>scores[1]?0:1,'制限時間・タワー破壊数');return;}
    g.overtime=true;event(g,'overtime',{x:ARENA.midX,y:ARENA.height/2});
  }
  if(g.overtime&&scores[0]!==scores[1]){finish(g,scores[0]>scores[1]?0:1,'延長戦・先にタワーを破壊');return;}
  if(g.time>=ARENA.duration+ARENA.overtime-1e-7){
    const hp=[0,1].map(o=>g.towers.filter(t=>t.owner===o).reduce((s,t)=>s+t.hp,0));
    finish(g,hp[0]===hp[1]?null:(hp[0]>hp[1]?0:1),'延長終了・残りタワーHP合計');
  }
}
export function runBot(g,owner=1){
  const p=g.players[owner],aff=p.hand.filter(id=>UNITS[id].cost<=p.energy);
  if(!aff.length)return;
  const enemies=g.units.filter(u=>u.owner!==owner&&u.hp>0),threat=enemies.filter(u=>(owner===1?u.y<ARENA.riverTop-ARENA.cellSize:u.y>ARENA.riverBottom+ARENA.cellSize)).sort((a,b)=>distance(a,{x:ARENA.midX,y:owner===1?ARENA.cellSize*3:ARENA.height-ARENA.cellSize*3})-distance(b,{x:ARENA.midX,y:owner===1?ARENA.cellSize*3:ARENA.height-ARENA.cellSize*3}))[0];
  if(threat){
    const fireCluster=enemies.filter(u=>distance(u,threat)<=UNITS.fireball.radius+u.radius).length;
    const arrowCluster=enemies.filter(u=>distance(u,threat)<=UNITS.arrowrain.radius+u.radius).length;
    if(aff.includes('zap')&&(threat.type==='sparky'||threat.type==='lasertower'||fireCluster>=4)){deploy(g,owner,'zap',threat.x,threat.y);return;}
    if(aff.includes('lightning')&&(threat.hp>=900||fireCluster>=3)){deploy(g,owner,'lightning',threat.x,threat.y);return;}
    if(aff.includes('poison')&&((threat.type==='boneswarm'||threat.type==='skeleton')||fireCluster>=4)){deploy(g,owner,'poison',threat.x,threat.y);return;}
    if(aff.includes('skeletonrush')&&random(g)<.35){const tower=g.towers.find(t=>t.owner!==owner&&t.kind==='tower'&&t.hp>0)||g.towers.find(t=>t.owner!==owner&&t.kind==='core'&&t.hp>0);if(tower){deploy(g,owner,'skeletonrush',tower.x,tower.y);return;}}
    if(aff.includes('cyclone')&&arrowCluster>=3){deploy(g,owner,'cyclone',threat.x,threat.y);return;}
    if(aff.includes('arrowrain')&&arrowCluster>=3){deploy(g,owner,'arrowrain',threat.x,threat.y);return;}
    if(aff.includes('fireball')&&(fireCluster>=2||threat.type==='frost'||threat.type==='lumina')){deploy(g,owner,'fireball',threat.x,threat.y);return;}
  }
  let choices=aff.filter(id=>!UNITS[id].spell);if(!choices.length){
    const target=threat||g.towers.find(t=>t.owner!==owner&&t.kind==='tower'&&t.hp>0)||g.towers.find(t=>t.owner!==owner&&t.kind==='core'&&t.hp>0);
    const spell=aff.includes('skeletonrush')?'skeletonrush':aff.includes('lightning')?'lightning':aff.includes('zap')?'zap':aff.includes('cyclone')?'cyclone':aff.includes('arrowrain')?'arrowrain':aff.includes('fireball')?'fireball':aff.includes('poison')?'poison':null;
    if(target&&spell)deploy(g,owner,spell,target.x,target.y);return;
  }
  if(threat?.air&&choices.some(id=>UNITS[id].targetsAir))choices=choices.filter(id=>UNITS[id].targetsAir);
  else if(!threat&&p.energy<7&&g.difficulty!=='hard'&&random(g)<.5)return;
  let id=choices[Math.floor(random(g)*choices.length)];
  if(!threat&&id==='cannon'&&choices.length>1)id=choices.find(k=>k!=='cannon')||id;
  if(id==='tigger'){
    const target=g.towers.filter(t=>t.owner!==owner&&t.hp>0).sort((a,b)=>(a.kind==='core')-(b.kind==='core')||a.hp-b.hp)[0];
    if(target){const y=clampInsideArena(target.y+(owner===1?-1:1)*(target.radius+ARENA.cellSize),'y',UNITS[id]),x=clampInsideArena(target.x+(random(g)-.5)*ARENA.cellSize*1.75,'x',UNITS[id]);if(deploy(g,owner,id,x,y).ok)return;}
  }
  const lane=threat?(threat.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1]):(random(g)<.5?ARENA.lanes[0]:ARENA.lanes[1]),baseY=owner===1?(threat?ARENA.riverTop-ARENA.cellSize*3:ARENA.cellSize*4):(threat?ARENA.riverBottom+ARENA.cellSize*3:ARENA.height-ARENA.cellSize*4);
  for(let i=0;i<8;i++){
    const x=clampInsideArena(lane+(random(g)-.5)*ARENA.cellSize*3,'x',UNITS[id]),y=clampInsideArena(baseY+(random(g)-.5)*ARENA.cellSize*2.5,'y',UNITS[id]);
    if(deploy(g,owner,id,x,y).ok)break;
  }
}
export function tick(g,dt=ARENA.tick){
  if(!Number.isFinite(dt)||dt<=0||dt>.25)throw new RangeError('tick must be (0, .25]');
  if(g.phase==='ended')return;
  if(g.phase==='countdown'){
    g.countdown=Math.max(0,g.countdown-dt);if(g.countdown<=0.000001){g.countdown=0;g.phase='battle';}
    return;
  }
  // Bound displacement per substep, even when a slow client advances a large dt.
  if(dt>.100001){let left=dt;while(left>1e-8&&g.phase!=='ended'){const step=Math.min(.1,left);tick(g,step);left-=step;}return;}
  g.time+=dt;g.step++;
  for(const p of g.players)p.energy=Math.min(10,p.energy+dt*(g.time>=120?1.25:.625));
  g.events=g.events.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0);
  g.zones??=[];updateSkeletonRushZones(g,dt);updateDelayedDeathBombs(g,dt);updatePoisonZones(g,dt);decayMudZones(g,dt);updateMudZones(g);updateRageZones(g,dt);updateCycloneZones(g,dt);
  refreshCoreWake(g);
  if(g.bot&&g.time>=g.botNext){
    runBot(g,1);g.botNext=g.time+(g.difficulty==='easy'?2.6:g.difficulty==='hard'?.65:1.3)+random(g)*.7;
  }
  resolveBodies(g,0);
  const entities=alive(g);
  for(const u of entities){
    if(u.hp<=0)continue;
    u.moving=false;
    if(u.eggUnit){if(Number.isFinite(u.eggHatchAt)&&g.time+1e-8>=u.eggHatchAt)hatchEgg(g,u);continue;}
    updateStealth(g,u);
    const stunnedNow=(u.stunUntil||0)>g.time,rageFactor=rageSpeedFactor(g,u),actionDt=dt*rageFactor;
    u.hit=Math.max(0,(u.hit||0)-dt);u.anim=Math.max(0,(u.anim||0)-dt);if(!stunnedNow)u.cd=Math.max(0,u.cd-actionDt);u.healCd=Math.max(0,(u.healCd||0)-actionDt);
    updateLingeringPoison(g,u);if(u.hp<=0)continue;
    if(u.kind==='core'&&!u.awake){u.target=null;continue;}
    if(!u.kind){
      u.age+=dt;
      if(updateBurrow(g,u,dt))continue;
      if(updateDeployment(g,u,dt))continue;
      if(u.sparkUnit)updateSparkyCharge(g,u);
      if(u.spawn>0){u.spawn=Math.max(0,u.spawn-dt);continue;}
      if(u.decayPerSecond){decayStructure(g,u,u.decayPerSecond*dt);if(u.hp<=0)continue;}
      if(u.energyPump)updateEnergyPump(g,u,dt);
      if(updateBoarRiverJump(g,u,dt))continue;
    }
    if((u.hookControlUntil||0)>g.time){u.target=null;u.moving=false;continue;}
    if((u.stunUntil||0)>g.time){u.target=null;if(u.laserTower||u.laserUnit)resetLaserTower(u);if(u.drillUnit)resetDrill(u);if(u.crusherRamp)resetCrusher(u);continue;}
    if(u.executionerAxe&&u.axeInFlight){u.moving=false;u.target=null;continue;}
    if(!u.kind&&updateSummoner(g,u,dt)){u.target=null;if(u.laserTower||u.laserUnit)resetLaserTower(u);continue;}
    if(updateMegaJump(g,u,entities,dt))continue;
    if(updateIceSpiritLeap(g,u,entities,dt))continue;
    if(updateFireSpiritLeap(g,u,entities,dt))continue;
    if(updateShadowRush(g,u,entities,dt))continue;
    if(updateIronSpin(g,u,entities,dt))continue;
    if(updateTrackerHook(g,u,entities,dt))continue;
    const spinTarget=ironSpinCandidate(g,u,entities);if(spinTarget&&beginIronSpin(g,u,spinTarget))continue;
    const hookTarget=trackerHookCandidate(g,u,entities);if(hookTarget){beginTrackerHook(g,u,hookTarget);continue;}
    healingPulse(g,u,entities);
    const target=getTarget(g,u,entities);
    if(!target){if(u.laserTower||u.laserUnit)resetLaserTower(u);if(u.drillUnit)resetDrill(u);if(u.crusherRamp)resetCrusher(u);if(u.mountedCharge&&!u.charged)resetMountedCharge(u);resetFirstStrike(u);u.target=null;continue;}
    u.target=target.id;
    if(u.iceSpirit&&distance(u,target)<=((u.iceLeapRange||cellsToWorld(2))+(target.radius||0))){beginIceSpiritLeap(g,u,target);continue;}
    if(u.fireSpirit&&distance(u,target)<=((u.fireLeapRange||cellsToWorld(2))+(target.radius||0))){beginFireSpiritLeap(g,u,target);continue;}
    if(beginBoarRiverJump(g,u,target))continue;
    const reach=u.range;
    const attackGap=targetGap(u,target);
    if(u.megaKnight&&megaJumpReady(u,target)){beginMegaJumpWindup(g,u,target);continue;}
    if(u.crusherRamp&&u.crusherTarget&&(u.crusherTarget!==target.id||attackGap>reach))resetCrusher(u);
    if(u.drillUnit){
      if(attackGap<=reach){
        faceToward(u,target.x,target.y);if(u.drillTarget&&u.drillTarget!==target.id)resetDrill(u);
        if(firstStrikeReady(g,u,target))updateDrill(g,u,target,actionDt);
      }else {resetFirstStrike(u);resetDrill(u);move(g,u,target,dt);}
      continue;
    }
    if(u.laserTower||u.laserUnit){
      if(attackGap<=reach){
        faceToward(u,target.x,target.y);if(u.laserTarget&&u.laserTarget!==target.id)resetLaserTower(u);
        if(firstStrikeReady(g,u,target))updateLaserTower(g,u,target,actionDt);
      }else {resetFirstStrike(u);resetLaserTower(u);if(u.laserUnit&&!u.kind&&!u.building)move(g,u,target,dt);}
      continue;
    }
    if(canShadowRush(g,u,target)){beginShadowWindup(g,u,target);continue;}
    if(attackGap<=reach){
      if(u.mountedCharge&&!u.charged&&(u.chargeRun||0)>0)resetMountedCharge(u);
      faceToward(u,target.x,target.y);
      // Start the short first-strike preparation as soon as a new target is in range.
      // It runs in parallel with any remaining ordinary attack cooldown so target changes
      // do not add an unnecessary extra quarter-second after that cooldown finishes.
      const firstReady=firstStrikeReady(g,u,target);
      if(u.cd<=0&&firstReady)attack(g,u,target);
    }else if(!u.kind){resetFirstStrike(u);move(g,u,target,dt);}
  }
  for(const p of g.projectiles){
    p.life-=dt;
    if(p.kind==='executioner_axe'){updateFalcheAxe(g,p,dt,entities);continue;}
    if(p.spell==='fireball'||p.spell==='arrowrain'){
      let flightDt=dt;
      if((p.delayRemaining||0)>1e-8){const used=Math.min(flightDt,p.delayRemaining);p.delayRemaining=Math.max(0,p.delayRemaining-used);flightDt-=used;p.x=p.sx;p.y=p.sy;p.progress=0;
        if(p.delayRemaining<=1e-8&&!p.launched){p.launched=true;event(g,p.spell==='arrowrain'?'arrowrain-launch':'fireball-launch',{x:p.sx,y:p.sy,tx:p.tx,ty:p.ty,owner:p.owner,travel:p.flightTotal||p.total});}
        if(flightDt<=1e-8)continue;
      }
      if(!p.launched){p.launched=true;event(g,p.spell==='arrowrain'?'arrowrain-launch':'fireball-launch',{x:p.sx,y:p.sy,tx:p.tx,ty:p.ty,owner:p.owner,travel:p.flightTotal||p.total});}
      p.remaining=Math.max(0,p.remaining-flightDt);p.progress=clamp(1-p.remaining/Math.max(.001,p.flightTotal||p.total),0,1);
      p.x=p.sx+(p.tx-p.sx)*p.progress;p.y=p.sy+(p.ty-p.sy)*p.progress;
      if(p.remaining<=1e-8){p.x=p.tx;p.y=p.ty;spellAreaImpact(g,p,p.spell);p.life=0;}
      continue;
    }
    const t=entities.find(e=>e.id===p.target&&e.hp>0);if(t){p.tx=t.x;p.ty=t.y;}
    const d=Math.hypot(p.tx-p.x,p.ty-p.y),step=p.speed*dt;
    if(p.kind==='bomb'){
      const full=Math.max(1,Math.hypot(p.tx-p.sx,p.ty-p.sy));
      p.progress=clamp(1-d/full,0,1);
    }
    if(d<=step+5){p.x=p.tx;p.y=p.ty;p.progress=1;impact(g,p,entities);p.life=0;}
    else {p.x+=(p.tx-p.x)/d*step;p.y+=(p.ty-p.y)/d*step;}
  }
  g.projectiles=g.projectiles.filter(p=>p.life>0);
  g.units=g.units.filter(u=>u.hp>0);
  resolveBodies(g,dt);winCheck(g);
}
const rnd=v=>Math.round(v*100)/100;
export function viewMatch(g,seat=0){
  const p=g.players[seat];
  return {physicsVersion:PHYSICS_VERSION,mapTheme:g.mapTheme||'grass',phase:g.phase,countdown:g.countdown,time:rnd(g.time),overtime:g.overtime,winner:g.winner,reason:g.reason,
    scores:[towerScore(g,0),towerScore(g,1)],energy:rnd(p.energy),hand:[...p.hand],next:p.queue[0],deck:[...p.deck],
    units:g.units.map(u=>({id:u.id,type:u.type,owner:u.owner,x:rnd(u.x),y:rnd(u.y),hp:u.hp,maxHp:u.maxHp,radius:u.radius,air:u.air,building:!!u.building,footprintCols:u.footprintCols||0,footprintRows:u.footprintRows||0,hitboxCols:u.hitboxCols||0,hitboxRows:u.hitboxRows||0,anim:u.anim,hit:u.hit,walk:u.walk,spawn:u.spawn,face:u.face,facing:u.facing,moving:!!u.moving,mass:u.mass,age:u.age,target:u.target||null,firstStrikeRemaining:rnd(Math.max(0,(u.firstStrikeReadyAt||0)-g.time)),targetable:u.targetable!==false,deploying:!!u.deploying,deployTotal:rnd(u.deployTotal||0),deployRemaining:rnd(u.deployRemaining||0),collisionDisabled:!!u.collisionDisabled,laserStage:u.laserStage||0,laserDps:rnd(u.laserDps||0),laserLockTime:rnd(u.laserLockTime||0),charged:!!u.charged,chargeRun:rnd(u.chargeRun||0),mountedCharge:!!u.mountedCharge,chargeProgress:u.mountedCharge&&u.chargeDistance?rnd(clamp((u.chargeRun||0)/u.chargeDistance,0,1)):0,axeInFlight:!!u.axeInFlight,rageActive:rageSpeedFactor(g,u)>1,ramChargeProgress:rnd(clamp((u.ramChargeTime||0)/Math.max(.01,u.ramChargeAfter||2),0,1)),sparkCharged:!!u.sparkCharged,sparkChargeProgress:rnd(u.sparkChargeProgress||0),stunned:(u.stunUntil||0)>g.time,stunRemaining:rnd(Math.max(0,(u.stunUntil||0)-g.time)),slowed:(u.slowUntil||0)>g.time,slowStage:(u.slowUntil||0)>g.time?(u.slowStage||1):0,slowRemaining:rnd(Math.max(0,(u.slowUntil||0)-g.time)),poisoned:(u.poisonUntil||0)>g.time,poisonOwner:Number.isFinite(u.poisonOwner)?u.poisonOwner:null,poisonRemaining:rnd(Math.max(0,(u.poisonUntil||0)-g.time)),mudded:(u.mudUntil||0)>g.time,mudRemaining:rnd(Math.max(0,(u.mudUntil||0)-g.time)),burrowState:u.burrowState||null,burrowProgress:rnd(u.burrowProgress||0),summonType:u.summonType||null,summonCount:u.summonCount||0,summonRemaining:u.summonInterval?rnd(Math.max(0,(u.summonNextAt||g.time)-g.time)):0,summonCasting:(u.summonCastingUntil||0)>g.time,summonWindupRemaining:rnd(Math.max(0,(u.summonCastingUntil||0)-g.time)),energyPump:!!u.energyPump,energyPumpProgress:u.energyPump&&u.energyInterval&&Number.isFinite(u.energyNextAt)?rnd(clamp(1-(u.energyNextAt-g.time)/u.energyInterval,0,1)):0,energyPumpRemaining:u.energyPump&&Number.isFinite(u.energyNextAt)?rnd(Math.max(0,u.energyNextAt-g.time)):0,dashState:u.dashState||null,dashWindupRemaining:rnd(Math.max(0,(u.dashWindupUntil||0)-g.time)),dashCooldownRemaining:rnd(Math.max(0,(u.dashReadyAt||0)-g.time)),invulnerable:(u.invulnerableUntil||0)>g.time,shieldHp:rnd(u.shieldHp||0),maxShieldHp:rnd(u.maxShieldHp||0),stealthed:!!u.stealthed,stealthRemaining:rnd(Math.max(0,(u.stealthUntil||0)-g.time)),eggHatchRemaining:u.eggUnit?rnd(Math.max(0,(u.eggHatchAt||g.time)-g.time)):0,revived:!!u.revived,drillStage:u.drillStage||0,drillDps:rnd(u.drillDps||0),drillLockTime:rnd(u.drillLockTime||0),crusherStage:u.crusherStage||0,iceSpiritState:u.iceSpiritState||null,iceSpiritProgress:rnd(u.iceSpiritProgress||0),fireSpiritState:u.fireSpiritState||null,fireSpiritProgress:rnd(u.fireSpiritProgress||0),megaJumpState:u.megaJumpState||null,megaJumpProgress:rnd(u.megaJumpProgress||0),megaJumpWindupRemaining:rnd(Math.max(0,(u.megaJumpWindupUntil||0)-g.time)),megaJumpTargetX:Number.isFinite(u.megaJumpTargetX)?rnd(u.megaJumpTargetX):null,megaJumpTargetY:Number.isFinite(u.megaJumpTargetY)?rnd(u.megaJumpTargetY):null,megaJumpStartX:Number.isFinite(u.megaJumpStartX)?rnd(u.megaJumpStartX):null,megaJumpStartY:Number.isFinite(u.megaJumpStartY)?rnd(u.megaJumpStartY):null,megaJumpEndX:Number.isFinite(u.megaJumpEndX)?rnd(u.megaJumpEndX):null,megaJumpEndY:Number.isFinite(u.megaJumpEndY)?rnd(u.megaJumpEndY):null,jumpRadius:u.jumpRadius||0,riverJumpMode:u.riverJumpMode||null,riverJumpState:u.riverJumpState||null,riverJumpProgress:rnd(u.riverJumpProgress||0),riverJumpEndX:Number.isFinite(u.riverJumpEndX)?rnd(u.riverJumpEndX):null,riverJumpEndY:Number.isFinite(u.riverJumpEndY)?rnd(u.riverJumpEndY):null,ironSpinUsed:!!u.ironSpinUsed,ironSpinState:u.ironSpinState||null,ironSpinProgress:rnd(u.ironSpinProgress||0),ironSpinEndX:Number.isFinite(u.ironSpinEndX)?rnd(u.ironSpinEndX):null,ironSpinEndY:Number.isFinite(u.ironSpinEndY)?rnd(u.ironSpinEndY):null,ironMarked:!!u.ironMarked,ironMarkOwner:Number.isFinite(u.ironMarkOwner)?u.ironMarkOwner:null,ironMarkProgress:u.ironMarked?rnd(clamp((u.ironMarkDamage||0)/Math.max(1,u.ironMarkThreshold||500),0,1)):0,hookState:u.hookState||null,hookProgress:rnd(u.hookProgress||0),hookCooldownRemaining:rnd(Math.max(0,(u.hookReadyAt||0)-g.time)),hookTargetX:Number.isFinite(u.hookTargetX)?rnd(u.hookTargetX):null,hookTargetY:Number.isFinite(u.hookTargetY)?rnd(u.hookTargetY):null,hookAirAttackRemaining:rnd(Math.max(0,(u.hookAirAttackUntil||0)-g.time)),turtleShellActive:!!(u.siegeTurtle&&u.moving)})),
    towers:g.towers.map(t=>({id:t.id,kind:t.kind,slot:t.slot||null,owner:t.owner,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,radius:t.radius,footprintCols:t.footprintCols||0,footprintRows:t.footprintRows||0,hitboxCols:t.hitboxCols||0,hitboxRows:t.hitboxRows||0,rangeCells:t.rangeCells||0,anim:t.anim,hit:t.hit,facing:t.facing,awake:t.kind==='core'?!!t.awake:true,stunned:(t.stunUntil||0)>g.time,stunRemaining:rnd(Math.max(0,(t.stunUntil||0)-g.time)),rageActive:rageSpeedFactor(g,t)>1})),
    projectiles:g.projectiles.map(p=>({id:p.id,owner:p.owner,x:rnd(p.x),y:rnd(p.y),sx:rnd(p.sx||p.x),sy:rnd(p.sy||p.y),tx:rnd(p.tx),ty:rnd(p.ty),kind:p.kind,spell:p.spell||null,phase:p.phase||null,hitWidth:rnd(p.hitWidth||0),progress:rnd(p.progress||0),radius:p.splash||0,launched:p.launched!==false,delayRemaining:rnd(p.delayRemaining||0),launchDelay:rnd(p.launchDelay||0),flightTotal:rnd(p.flightTotal||p.total||0)})),
    zones:(g.zones||[]).map(z=>({id:z.id,owner:z.owner,kind:z.kind,spell:z.spell,x:rnd(z.x),y:rnd(z.y),radius:z.radius,remaining:rnd(z.remaining),total:z.total,boostMultiplier:z.boostMultiplier||1,active:(z.kind==='skeletonrush'||z.kind==='rage')?g.time+1e-8>=z.activateAt:true,activationRemaining:(z.kind==='skeletonrush'||z.kind==='rage')?rnd(Math.max(0,z.activateAt-g.time)):0,detonateRemaining:(z.kind==='giantskeletonbomb'||z.kind==='airballoonbomb')?rnd(Math.max(0,z.detonateAt-g.time)):0})),
    events:g.events.map(e=>({...e})),bot:g.bot,difficulty:g.difficulty};
}
