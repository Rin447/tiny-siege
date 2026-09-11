import {ARENA, UNITS, DECK, DEFAULT_DECK, MAX_DECK, normalizeDeck, summonDelayFor} from './units.js';
import {PHYSICS_VERSION, staticFree, staticLineFree, spawnPositions, navigationWaypoint, moveBody, resolveBodies, faceToward, deploymentAllowed} from './physics.js';

export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
export function random(g){
  let x=g.rng|0; x^=x<<13; x^=x>>>17; x^=x<<5;
  g.rng=x>>>0; return g.rng/4294967296;
}
function shuffled(g,source=DEFAULT_DECK){const a=[...source];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function validateDeck(value){return normalizeDeck(value,{fallback:false});}
export function createMatch({seed=12345,bot=false,difficulty='normal',decks=[DEFAULT_DECK,DEFAULT_DECK]}={}){
  const g={physicsVersion:PHYSICS_VERSION,phase:'countdown',countdown:3,time:0,overtime:false,rng:seed||1,units:[],projectiles:[],zones:[],events:[],nextId:1,step:0,
    winner:null,reason:'',bot,difficulty,botNext:1.5,
    players:[{energy:5,hand:[],queue:[],deck:[]},{energy:5,hand:[],queue:[],deck:[]}],towers:[]};
  const safeDecks=[normalizeDeck(decks?.[0]),normalizeDeck(decks?.[1])];
  for(let owner=0;owner<2;owner++){
    const d=shuffled(g,safeDecks[owner]);g.players[owner].deck=[...safeDecks[owner]];g.players[owner].hand=d.slice(0,4);g.players[owner].queue=d.slice(4);
    for(let i=0;i<3;i++){
      const core=i===2,x=core?360:(i===0?190:530);
      g.towers.push({id:`t${owner}${i}`,kind:core?'core':'tower',owner,x,y:owner===0?(core?905:805):(core?135:235),
      hp:core?3240:1980,maxHp:core?3240:1980,radius:core?40:32,range:core?226:226,damage:core?92:83,cd:0,
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
  if(x<30||x>690||y<30||y>1010)return 'フィールドの内側を指定してください。';
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
  if(!deploymentAllowed(g,owner,x,y))return '自分の陣地、または破壊した敵サイドタワー側の前線に配置してください。';
  const deployCount=d.count+(d.summonOnDeploy?(d.summonCount||0):0);
  if(g.units.filter(u=>u.hp>0).length+deployCount>ARENA.maxUnits)return 'フィールドのユニット上限です。';
  const blockers=placementStructures(g);
  if(!staticFree(g,d,{x,y},1,blockers))return '建物や岸から少し離して配置してください。';
  if(!spawnPositions(g,owner,d,x,y,blockers))return '配置する空間がありません。少し離してください。';
  return null;
}
function event(g,type,data){g.events.push({id:g.nextId++,type,life:type==='death'?0.9:0.5,...data});}
function spendCard(g,owner,id){
  const p=g.players[owner],d=UNITS[id],index=p.hand.indexOf(id);
  p.energy=Math.max(0,p.energy-d.cost);p.hand[index]=p.queue.shift();p.queue.push(id);
}
function makeUnit(g,owner,type,x,y){
  const d=UNITS[type];
  return {...d,id:`u${g.nextId++}`,type,owner,x,y,hp:d.hp,maxHp:d.hp,cd:0,spawn:0.5,anim:0,hit:0,walk:0,target:null,targetLock:null,targetable:true,collisionDisabled:false,deploying:false,deployTotal:0,deployRemaining:0,face:owner===0?-1:1,
    lane:x<360?190:530,age:0,facing:owner===0?-Math.PI/2:Math.PI/2,moving:false,
    summonNextAt:d.summonInterval?g.time+d.summonInterval:null,summonCastingUntil:0,
    stunUntil:0,sparkCharged:false,sparkChargeStartAt:d.sparkChargeTime?g.time:null,sparkChargeProgress:0};
}
function startDeployment(g,u,cardData){
  const total=summonDelayFor(cardData);
  if(total<=0)return false;
  u.deploying=true;u.deployTotal=total;u.deployRemaining=total;u.targetable=false;u.collisionDisabled=true;u.spawn=0;u.target=null;u.targetLock=null;
  if(u.summonInterval)u.summonNextAt=null;
  if(u.sparkUnit){u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=null;}
  event(g,'deploy-start',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,card:cardData.id,duration:total,building:!!u.building});
  return true;
}
function completeDeployment(g,u){
  u.deploying=false;u.deployRemaining=0;u.targetable=true;u.collisionDisabled=false;u.target=null;u.targetLock=null;
  if(u.sparkUnit)u.sparkChargeStartAt=g.time;
  if(u.summonInterval)u.summonNextAt=g.time+u.summonInterval;
  event(g,'deploy-ready',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,building:!!u.building});
  if(u.summonOnDeploy&&u.summonType&&u.summonCount)summonMinions(g,u,true);
}
function updateDeployment(g,u,dt){
  if(!u.deploying)return false;
  u.moving=false;u.target=null;u.targetLock=null;u.targetable=false;u.collisionDisabled=true;
  u.deployRemaining=Math.max(0,(u.deployRemaining||0)-dt);
  if(u.deployRemaining<=1e-8){completeDeployment(g,u);return true;}
  return true;
}
function fireballTravelTime(core,target){return clamp(.45+distance(core,target)/620,.6,2);}
function arrowRainTravelTime(core,target){return clamp(.2+distance(core,target)/1150,.35,1);}
function burrowTravelTime(d,core,target){return clamp((d.burrowBase??.45)+distance(core,target)/(d.burrowSpeedDivisor||500),d.burrowMin??.7,d.burrowMax??2.2);}
function castSpell(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id],core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
  spendCard(g,owner,id);
  if(d.spell==='poison'){
    g.zones??=[];
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'poison',spell:'poison',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,
      tickEvery:d.tickEvery,nextTick:g.time,damage:d.damage,buildingDamage:d.buildingDamage,lingerDuration:d.lingerDuration,lingerDamage:d.lingerDamage});
    event(g,'poison-deploy',{x,y,owner,radius:d.radius});
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
  const arrow=d.spell==='arrowrain',travel=arrow?arrowRainTravelTime(core,{x,y}):fireballTravelTime(core,{x,y});
  g.projectiles.push({id:`p${g.nextId++}`,owner,kind:arrow?'arrowrain':'fireball',spell:d.spell,x:core.x,y:core.y,sx:core.x,sy:core.y,tx:x,ty:y,
    total:travel,remaining:travel,progress:0,damage:d.damage,buildingDamage:d.buildingDamage,splash:d.radius,targetsAir:true,life:travel+.2});
  event(g,arrow?'arrowrain-launch':'fireball-launch',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
  return {ok:true,spell:true,travelTime:travel};
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
  const positions=spawnPositions(g,owner,d,x,y,placementStructures(g));spendCard(g,owner,id);
  for(let i=0;i<d.count;i++){
    const unitType=(Array.isArray(d.spawnTypes)&&d.spawnTypes[i])||d.spawnType||id,u=makeUnit(g,owner,unitType,positions[i].x,positions[i].y);
    startDeployment(g,u,d);g.units.push(u);event(g,'spawn',{x:u.x,y:u.y,owner,card:id});
    if(!u.deploying&&u.summonOnDeploy&&u.summonType&&u.summonCount)summonMinions(g,u,true);
  }
  return {ok:true};
}
function alive(g){return [...g.units,...g.towers].filter(v=>v.hp>0);}
function targetable(source,target){return target.owner!==source.owner&&target.hp>0&&target.targetable!==false&&(!target.air||source.targetsAir);}
function lockedStructureTarget(u,entities){
  if(!(u.kind||u.building)||!u.target)return null;
  const t=entities.find(e=>e.id===u.target);
  if(!t||!targetable(u,t))return null;
  return distance(u,t)<=u.range+t.radius?t:null;
}
function nearestStructureTarget(u,entities){
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    const d=distance(u,t);
    if(d<=u.range+t.radius&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function preferredTower(g,u){
  const enemy=1-u.owner;
  const out=g.towers.find(t=>t.owner===enemy&&t.kind==='tower'&&t.x===u.lane&&t.hp>0);
  return out||g.towers.find(t=>t.owner===enemy&&t.kind==='core'&&t.hp>0);
}
function nearestMobileCombatTarget(u,entities){
  const reach=u.aggroRange??Math.max(205,u.range+35);
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    const d=distance(u,t)-t.radius-(u.aggroRange?u.range:0);
    if(d<=reach&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function commitMobileTarget(u,t){
  if(!u.kind&&!u.building&&!u.buildingOnly&&t&&targetable(u,t))u.targetLock=t.id;
}
function getTarget(g,u,entities){
  // Defensive structures keep the existing v13 contract: lock while the target remains valid and in range.
  // A closer enemy entering range does not steal aggro mid-lock.
  if(u.kind||u.building){
    const locked=lockedStructureTarget(u,entities);
    if(locked)return locked;
    return nearestStructureTarget(u,entities);
  }
  // Building-only mobile units NEVER hard-lock. They continuously re-evaluate the nearest enemy structure.
  // This intentionally allows pulls toward a newly-closer defence or even the central core.
  if(u.buildingOnly){
    u.targetLock=null;
    let best=null,bestD=Infinity;
    for(const t of entities){
      if(!targetable(u,t)||!(t.kind||t.building))continue;
      const d=distance(u,t)-t.radius;
      if(d<bestD){best=t;bestD=d;}
    }
    return best;
  }
  // Ordinary mobile units only hard-lock AFTER they actually commit an attack.
  // Until the first attack, they keep re-evaluating the nearest valid enemy every tick.
  // After an attack, leaving attack/aggro range does not break the lock: the unit chases the same target.
  if(u.targetLock){
    const locked=entities.find(t=>t.id===u.targetLock);
    if(locked&&targetable(u,locked))return locked;
    u.targetLock=null;
  }
  const best=nearestMobileCombatTarget(u,entities);
  if(best)return best;
  // A preferred tower is only a navigation objective while it is outside aggro range.
  // It becomes a real hard lock only after the unit actually attacks it.
  return preferredTower(g,u);
}
function dashEndpoint(u,t){
  const dx=u.x-t.x,dy=u.y-t.y,len=Math.hypot(dx,dy)||1;
  const stop=Math.max(1,u.range+t.radius-1);
  return {x:t.x+dx/len*stop,y:t.y+dy/len*stop};
}
function shadowRushTargetReady(g,u,t){
  if(!t||!targetable(u,t))return false;
  const gap=Math.max(0,distance(u,t)-(u.range+t.radius));
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
  commitMobileTarget(u,t);
  u.dashState='rush';u.dashEnd=end;u.invulnerableUntil=g.time+Math.max(.12,distance(u,end)/(u.dashSpeed||650)+.12);
  faceToward(u,t.x,t.y);event(g,'shadow-rush',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner});return true;
}
function finishShadowRush(g,u,t){
  u.dashState=null;u.invulnerableUntil=0;u.dashReadyAt=g.time+(u.dashCooldown||4);u.dashTarget=null;u.dashEnd=null;
  u.cd=Math.max(u.cd,u.cooldown);u.anim=.35;
  if(t&&t.hp>0&&targetable(u,t)&&distance(u,t)<=u.range+t.radius+14){
    const amount=Math.round(u.damage*(u.dashMultiplier||2));damage(g,t,amount,u.owner);
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
  const gap=Math.max(0,distance(u,t)-(u.range+t.radius));
  if(gap>(u.dashMaxRange||Infinity)+35)return false;
  const end=dashEndpoint(u,t);return staticLineFree(g,u,u,end,1);
}
function move(g,u,t,dt){
  if(!u.speed)return;
  const dest=navigationWaypoint(g,u,t,u.range+t.radius);
  const start={x:u.x,y:u.y};
  const frostFactor=(u.slowUntil||0)>g.time?(u.slowMoveFactor||1):1;
  const mudFactor=(u.mudUntil||0)>g.time?(u.mudSlowFactor||1):1;
  const moved=moveBody(g,u,dest,dt*frostFactor*mudFactor);
  if(moved>.025){
    faceToward(u,u.x+(u.x-start.x),u.y+(u.y-start.y));u.walk+=moved/Math.max(1,u.speed)*7;u.moving=true;
    if(u.chargeDistance&&u.buildingOnly){
      u.chargeRun=(u.chargeRun||0)+moved;
      if(!u.charged&&u.chargeRun>=u.chargeDistance){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner});}
    }
  }else if(u.chargeDistance){
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
  const base=count===2?[[-22,-12],[22,-12]]:count===3?[[0,-30],[-24,12],[24,12]]:Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/count;return [Math.cos(a)*28,Math.sin(a)*28];});
  const candidates=[];
  for(const [ox,oy] of base)candidates.push([ox,oy]);
  for(const r of [38,50,64])for(let i=0;i<12;i++){const a=i*Math.PI*2/12+(parent.owner===1?Math.PI:0);candidates.push([Math.cos(a)*r,Math.sin(a)*r]);}
  let made=0;
  for(const [ox0,oy0] of candidates){
    if(made>=count)break;const ox=ox0*f,oy=oy0*f,p={x:clamp(parent.x+ox,50,670),y:clamp(parent.y+oy,60,980)};
    if(!staticFree(g,d,p,0))continue;
    if(g.units.some(u=>u.hp>0&&!!u.air===!!d.air&&distance(p,u)<d.radius+(u.radius||12)*.80))continue;
    const u=makeUnit(g,parent.owner,d.id,p.x,p.y);u.spawn=.3;u.lane=parent.lane;u.summonedBy=parent.id;g.units.push(u);event(g,'summon-spawn',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id,initial});made++;
  }
  return made;
}
function updateSummoner(g,u){
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
  const f=parent.owner===0?1:-1,candidates=[[-22,4],[22,4],[-18,20],[18,20],[-32,-8],[32,-8],[0,28],[0,-28]];
  let made=0;
  for(const [ox,oy] of candidates){
    if(made>=count)break;const p={x:clamp(parent.x+ox,50,670),y:clamp(parent.y+oy*f,60,980)};
    if(!staticFree(g,d,p,0))continue;
    if(g.units.some(u=>u.hp>0&&!!u.air===!!d.air&&distance(p,u)<d.radius+(u.radius||12)*.72))continue;
    const u=makeUnit(g,parent.owner,d.id,p.x,p.y);u.spawn=.35;u.lane=parent.lane;g.units.push(u);event(g,'split-spawn',{x:u.x,y:u.y,owner:u.owner});made++;
  }
  // Crowded bridge/tower fights can leave no perfect free point. ResolveBodies will safely separate this fallback.
  while(made<count){const side=made?1:-1,u=makeUnit(g,parent.owner,d.id,clamp(parent.x+side*18,50,670),clamp(parent.y+10*f,60,980));u.spawn=.35;u.lane=parent.lane;g.units.push(u);event(g,'split-spawn',{x:u.x,y:u.y,owner:u.owner});made++;}
}
function handleUnitDeath(g,t){
  if(t._deathHandled)return;t._deathHandled=true;
  event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:t.type==='golem'});
  if(t.deathDamage&&t.deathRadius){
    event(g,'death-blast',{x:t.x,y:t.y,owner:t.owner,radius:t.deathRadius,damage:t.deathDamage,unitType:t.type});
    const victims=[...alive(g)];
    for(const v of victims)if(v.id!==t.id&&v.owner!==t.owner&&v.hp>0&&distance(t,v)<=t.deathRadius+(v.radius||12)*.35)damage(g,v,t.deathDamage,t.owner);
  }
  if(t.splitType&&t.splitCount)summonMiniGolems(g,t);
}
function damage(g,t,amount,owner){
  if(t.hp<=0||t.burrowState==='burrow'||t.targetable===false)return 0;
  if((t.invulnerableUntil||0)>g.time){if(t.type==='nightshade')event(g,'shadow-evade',{x:t.x,y:t.y,owner:t.owner});return 0;}
  const before=t.hp;t.hp=Math.max(0,t.hp-amount);t.hit=.18;
  if(t.kind==='core'&&t.hp<before)wakeCore(g,t.owner,'core-hit');
  if(t.hp===0){
    if(t.kind){event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:true});if(t.kind==='tower')wakeCore(g,t.owner,'side-down');}
    else handleUnitDeath(g,t);
  }
  return before-t.hp;
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
  if(t.chargeDistance){
    t.chargeRun=Math.max(0,(t.chargeRun||0)-45);
    if(t.chargeRun<t.chargeDistance*.8)t.charged=false;
  }
  event(g,'slow',{x:t.x,y:t.y,owner:p.owner,stage});
}
function resetSparkyCharge(g,u,delayUntil=g.time){
  if(!u.sparkUnit)return;
  u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=delayUntil;
}
function applyStun(g,t,duration,owner){
  const until=Math.max(t.stunUntil||0,g.time+(duration||0));t.stunUntil=until;t.target=null;t.targetLock=null;
  if(t.laserTower||t.laserUnit)resetLaserTower(t);
  if(t.sparkUnit)resetSparkyCharge(g,t,until);
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
function spellAreaImpact(g,p,type){
  event(g,type==='arrowrain'?'arrowrain-impact':'fireball-impact',{x:p.tx,y:p.ty,owner:p.owner,radius:p.splash,damage:p.damage});
  const centre={x:p.tx,y:p.ty};
  for(const t of [...alive(g)]){
    if(t.owner===p.owner||t.hp<=0)continue;
    if(distance(centre,t)>p.splash+(t.radius||12)*.35)continue;
    damage(g,t,(t.kind||t.building)?p.buildingDamage:p.damage,p.owner);
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
    const points=[];let current=target,amount=p.damage;const hit=new Set();
    for(let i=0;i<p.chainCount&&current;i++){
      const hitDamage=Array.isArray(p.chainDamages)&&Number.isFinite(p.chainDamages[i])?p.chainDamages[i]:Math.round(amount);
      hit.add(current.id);damage(g,current,hitDamage,p.owner);if(p.stunDuration&&current.hp>0)applyStun(g,current,p.stunDuration,p.owner);points.push({x:current.x,y:current.y,damage:hitDamage});
      amount*=p.chainFalloff||.8;
      const candidates=entities.filter(t=>!hit.has(t.id)&&targetable(p,t)&&!t.kind&&!t.building&&distance(current,t)<=p.chainRange+t.radius)
        .sort((a,b)=>distance(current,a)-distance(current,b)||String(a.id).localeCompare(String(b.id)));
      current=candidates[0]||null;
    }
    event(g,'chain',{x:p.x,y:p.y,owner:p.owner,points});
  }else if(p.splash){
    event(g,'blast',{x:p.x,y:p.y,owner:p.owner,radius:p.splash,color:p.kind});
    for(const t of entities)if(targetable(p,t)&&distance(t,p)<=p.splash+t.radius*.35){damage(g,t,p.damage,p.owner);if(t.hp>0&&p.slowDuration)applySlow(g,t,p);if(t.hp>0&&p.stunDuration&&(!p.stunUnitsOnly||(!t.kind&&!t.building)))applyStun(g,t,p.stunDuration,p.owner);}
    createMudZone(g,p);
  }else if(target&&targetable(p,target)){damage(g,target,p.damage,p.owner);applySlow(g,target,p);}
}
function attack(g,u,t){
  if(u.sparkUnit&&!u.sparkCharged)return;
  // First actual attack commits ordinary mobile units to this target.
  commitMobileTarget(u,t);
  const attackFactor=(u.slowUntil||0)>g.time?(u.slowAttackFactor||1):1;
  u.cd=u.cooldown/Math.max(.15,attackFactor);u.anim=.35;faceToward(u,t.x,t.y);u.target=t.id;
  let amount=(t.kind||t.building)&&Number.isFinite(u.structureDamage)?u.structureDamage:u.damage;
  if(u.sparkUnit){u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=g.time;event(g,'sparky-fire',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,radius:u.splash||90});}
  if(u.chargeMultiplier&&u.charged&&(t.kind||t.building)){
    amount=Math.round(amount*u.chargeMultiplier);u.charged=false;u.chargeRun=0;
    event(g,'charge-hit',{x:t.x,y:t.y,owner:u.owner,radius:48});
  }
  if(u.projectile){
    g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,x:u.x,y:u.y-6,sx:u.x,sy:u.y,tx:t.x,ty:t.y,target:t.id,
    kind:u.projectile,speed:u.projectile==='bomb'?220:(u.projectile==='lightning'?520:(u.projectile==='electro'?450:(u.projectile==='thrown_spear'?480:(u.projectile==='dart'?560:(u.projectile==='mud'?300:(u.projectile==='royal_arrow'?470:(u.projectile==='sparkblast'?340:390))))))),damage:amount,splash:u.splash||0,
    targetsAir:u.targetsAir,life:3,slowMove:u.slowMove,slowAttack:u.slowAttack,slowMoveStages:u.slowMoveStages,slowAttackStages:u.slowAttackStages,slowDuration:u.slowDuration,
    chainCount:u.chainCount,chainRange:u.chainRange,chainFalloff:u.chainFalloff,chainDamages:Array.isArray(u.chainDamages)?u.chainDamages.map(v=>u.damage?Math.round(v*(amount/u.damage)):0):u.chainDamages,stunDuration:u.stunDuration,stunUnitsOnly:u.stunUnitsOnly,mudRadius:u.mudRadius,mudDuration:u.mudDuration,mudTickEvery:u.mudTickEvery,mudDamage:u.mudDamage,mudSlow:u.mudSlow});
  }else{
    damage(g,t,amount,u.owner);event(g,'slash',{x:t.x,y:t.y,owner:u.owner,angle:Math.atan2(t.y-u.y,t.x-u.x),kind:u.type});
  }
}
function resetLaserTower(u){
  u.laserTarget=null;u.laserLockTime=0;u.laserStage=0;u.laserDps=u.laserBaseDps||20;
}
function updateLaserTower(g,u,t,dt){
  if(!u.laserTower&&!u.laserUnit)return false;
  if(!t){resetLaserTower(u);u.target=null;return true;}
  if(u.laserTarget!==t.id){
    if(u.laserUnit)commitMobileTarget(u,t);
    u.laserTarget=t.id;u.laserLockTime=0;u.laserStage=0;u.laserDps=u.laserBaseDps||20;
    event(g,'laser-lock',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner});
  }else u.laserLockTime=(u.laserLockTime||0)+dt;
  const every=u.laserRampEvery||1.5,mult=u.laserMultiplier||2,stage=Math.max(0,Math.floor((u.laserLockTime+1e-9)/every));
  if(stage!==(u.laserStage||0))event(g,'laser-ramp',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,stage});
  u.laserStage=stage;u.laserDps=(u.laserBaseDps||20)*Math.pow(mult,stage);u.target=t.id;u.anim=.12;faceToward(u,t.x,t.y);
  damage(g,t,u.laserDps*dt,u.owner);
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
    g.overtime=true;event(g,'overtime',{x:360,y:520});
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
  const enemies=g.units.filter(u=>u.owner!==owner&&u.hp>0),threat=enemies.filter(u=>(owner===1?u.y<450:u.y>590)).sort((a,b)=>distance(a,{x:360,y:owner===1?150:890})-distance(b,{x:360,y:owner===1?150:890}))[0];
  if(threat){
    const fireCluster=enemies.filter(u=>distance(u,threat)<=UNITS.fireball.radius+u.radius).length;
    const arrowCluster=enemies.filter(u=>distance(u,threat)<=UNITS.arrowrain.radius+u.radius).length;
    if(aff.includes('zap')&&(threat.type==='sparky'||threat.type==='lasertower'||fireCluster>=4)){deploy(g,owner,'zap',threat.x,threat.y);return;}
    if(aff.includes('poison')&&(threat.type==='boneswarm'||fireCluster>=4)){deploy(g,owner,'poison',threat.x,threat.y);return;}
    if(aff.includes('arrowrain')&&arrowCluster>=3){deploy(g,owner,'arrowrain',threat.x,threat.y);return;}
    if(aff.includes('fireball')&&(fireCluster>=2||threat.type==='frost'||threat.type==='lumina')){deploy(g,owner,'fireball',threat.x,threat.y);return;}
  }
  let choices=aff.filter(id=>!UNITS[id].spell);if(!choices.length){
    const target=threat||g.towers.find(t=>t.owner!==owner&&t.kind==='tower'&&t.hp>0)||g.towers.find(t=>t.owner!==owner&&t.kind==='core'&&t.hp>0);
    const spell=aff.includes('zap')?'zap':aff.includes('arrowrain')?'arrowrain':aff.includes('fireball')?'fireball':aff.includes('poison')?'poison':null;
    if(target&&spell)deploy(g,owner,spell,target.x,target.y);return;
  }
  if(threat?.air&&choices.some(id=>UNITS[id].targetsAir))choices=choices.filter(id=>UNITS[id].targetsAir);
  else if(!threat&&p.energy<7&&g.difficulty!=='hard'&&random(g)<.5)return;
  let id=choices[Math.floor(random(g)*choices.length)];
  if(!threat&&id==='cannon'&&choices.length>1)id=choices.find(k=>k!=='cannon')||id;
  if(id==='tigger'){
    const target=g.towers.filter(t=>t.owner!==owner&&t.hp>0).sort((a,b)=>(a.kind==='core')-(b.kind==='core')||a.hp-b.hp)[0];
    if(target){const y=clamp(target.y+(owner===1?-1:1)*(target.radius+34),60,980),x=clamp(target.x+(random(g)-.5)*70,55,665);if(deploy(g,owner,id,x,y).ok)return;}
  }
  const lane=threat?(threat.x<360?190:530):(random(g)<.5?190:530),baseY=owner===1?(threat?360:145):(threat?680:895);
  for(let i=0;i<8;i++){
    const x=clamp(lane+(random(g)-.5)*110,65,655),y=clamp(baseY+(random(g)-.5)*100,65,975);
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
  g.zones??=[];updatePoisonZones(g,dt);decayMudZones(g,dt);updateMudZones(g);
  refreshCoreWake(g);
  if(g.bot&&g.time>=g.botNext){
    runBot(g,1);g.botNext=g.time+(g.difficulty==='easy'?2.6:g.difficulty==='hard'?.65:1.3)+random(g)*.7;
  }
  resolveBodies(g,0);
  const entities=alive(g);
  for(const u of entities){
    if(u.hp<=0)continue;
    u.moving=false;
    const stunnedNow=(u.stunUntil||0)>g.time;
    u.hit=Math.max(0,(u.hit||0)-dt);u.anim=Math.max(0,(u.anim||0)-dt);if(!stunnedNow)u.cd=Math.max(0,u.cd-dt);u.healCd=Math.max(0,(u.healCd||0)-dt);
    updateLingeringPoison(g,u);if(u.hp<=0)continue;
    if(u.kind==='core'&&!u.awake){u.target=null;continue;}
    if(!u.kind){
      u.age+=dt;
      if(updateBurrow(g,u,dt))continue;
      if(updateDeployment(g,u,dt))continue;
      if(u.sparkUnit)updateSparkyCharge(g,u);
      if(u.spawn>0){u.spawn=Math.max(0,u.spawn-dt);continue;}
      if(u.decayPerSecond){decayStructure(g,u,u.decayPerSecond*dt);if(u.hp<=0)continue;}
    }
    if((u.stunUntil||0)>g.time){u.target=null;if(u.laserTower||u.laserUnit)resetLaserTower(u);continue;}
    if(!u.kind&&updateSummoner(g,u)){u.target=null;if(u.laserTower||u.laserUnit)resetLaserTower(u);continue;}
    if(updateShadowRush(g,u,entities,dt))continue;
    healingPulse(g,u,entities);
    const target=getTarget(g,u,entities);
    if(!target){if(u.laserTower||u.laserUnit)resetLaserTower(u);u.target=null;continue;}
    u.target=target.id;
    const reach=u.range+target.radius;
    if(u.laserTower||u.laserUnit){
      if(distance(u,target)<=reach)updateLaserTower(g,u,target,dt);
      else {resetLaserTower(u);if(u.laserUnit&&!u.kind&&!u.building)move(g,u,target,dt);}
      continue;
    }
    if(canShadowRush(g,u,target)){beginShadowWindup(g,u,target);continue;}
    if(distance(u,target)<=reach){
      faceToward(u,target.x,target.y);
      if(u.cd<=0)attack(g,u,target);
    }else if(!u.kind)move(g,u,target,dt);
  }
  for(const p of g.projectiles){
    p.life-=dt;
    if(p.spell==='fireball'||p.spell==='arrowrain'){
      p.remaining=Math.max(0,p.remaining-dt);p.progress=clamp(1-p.remaining/p.total,0,1);
      p.x=p.sx+(p.tx-p.sx)*p.progress;p.y=p.sy+(p.ty-p.sy)*p.progress;
      if(p.remaining<=1e-8){p.x=p.tx;p.y=p.ty;spellAreaImpact(g,p,p.spell);p.life=0;}
      continue;
    }
    const t=entities.find(e=>e.id===p.target&&e.hp>0);if(t){p.tx=t.x;p.ty=t.y;}
    const d=Math.hypot(p.tx-p.x,p.ty-p.y),step=p.speed*dt;
    if(d<=step+5){p.x=p.tx;p.y=p.ty;impact(g,p,entities);p.life=0;}
    else {p.x+=(p.tx-p.x)/d*step;p.y+=(p.ty-p.y)/d*step;}
  }
  g.projectiles=g.projectiles.filter(p=>p.life>0);
  g.units=g.units.filter(u=>u.hp>0);
  resolveBodies(g,dt);winCheck(g);
}
const rnd=v=>Math.round(v*100)/100;
export function viewMatch(g,seat=0){
  const p=g.players[seat];
  return {physicsVersion:PHYSICS_VERSION,phase:g.phase,countdown:g.countdown,time:rnd(g.time),overtime:g.overtime,winner:g.winner,reason:g.reason,
    scores:[towerScore(g,0),towerScore(g,1)],energy:rnd(p.energy),hand:[...p.hand],next:p.queue[0],deck:[...p.deck],
    units:g.units.map(u=>({id:u.id,type:u.type,owner:u.owner,x:rnd(u.x),y:rnd(u.y),hp:u.hp,maxHp:u.maxHp,radius:u.radius,air:u.air,building:!!u.building,anim:u.anim,hit:u.hit,walk:u.walk,spawn:u.spawn,face:u.face,facing:u.facing,moving:!!u.moving,mass:u.mass,age:u.age,target:u.target||null,targetable:u.targetable!==false,deploying:!!u.deploying,deployTotal:rnd(u.deployTotal||0),deployRemaining:rnd(u.deployRemaining||0),collisionDisabled:!!u.collisionDisabled,laserStage:u.laserStage||0,laserDps:rnd(u.laserDps||0),laserLockTime:rnd(u.laserLockTime||0),charged:!!u.charged,chargeRun:rnd(u.chargeRun||0),sparkCharged:!!u.sparkCharged,sparkChargeProgress:rnd(u.sparkChargeProgress||0),stunned:(u.stunUntil||0)>g.time,stunRemaining:rnd(Math.max(0,(u.stunUntil||0)-g.time)),slowed:(u.slowUntil||0)>g.time,slowStage:(u.slowUntil||0)>g.time?(u.slowStage||1):0,slowRemaining:rnd(Math.max(0,(u.slowUntil||0)-g.time)),poisoned:(u.poisonUntil||0)>g.time,poisonOwner:Number.isFinite(u.poisonOwner)?u.poisonOwner:null,poisonRemaining:rnd(Math.max(0,(u.poisonUntil||0)-g.time)),mudded:(u.mudUntil||0)>g.time,mudRemaining:rnd(Math.max(0,(u.mudUntil||0)-g.time)),burrowState:u.burrowState||null,burrowProgress:rnd(u.burrowProgress||0),summonType:u.summonType||null,summonCount:u.summonCount||0,summonRemaining:u.summonInterval?rnd(Math.max(0,(u.summonNextAt||g.time)-g.time)):0,summonCasting:(u.summonCastingUntil||0)>g.time,summonWindupRemaining:rnd(Math.max(0,(u.summonCastingUntil||0)-g.time)),dashState:u.dashState||null,dashWindupRemaining:rnd(Math.max(0,(u.dashWindupUntil||0)-g.time)),dashCooldownRemaining:rnd(Math.max(0,(u.dashReadyAt||0)-g.time)),invulnerable:(u.invulnerableUntil||0)>g.time})),
    towers:g.towers.map(t=>({id:t.id,kind:t.kind,owner:t.owner,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,radius:t.radius,anim:t.anim,hit:t.hit,facing:t.facing,awake:t.kind==='core'?!!t.awake:true,stunned:(t.stunUntil||0)>g.time,stunRemaining:rnd(Math.max(0,(t.stunUntil||0)-g.time))})),
    projectiles:g.projectiles.map(p=>({id:p.id,owner:p.owner,x:rnd(p.x),y:rnd(p.y),tx:rnd(p.tx),ty:rnd(p.ty),kind:p.kind,spell:p.spell||null,progress:rnd(p.progress||0),radius:p.splash||0})),
    zones:(g.zones||[]).map(z=>({id:z.id,owner:z.owner,kind:z.kind,spell:z.spell,x:rnd(z.x),y:rnd(z.y),radius:z.radius,remaining:rnd(z.remaining),total:z.total})),
    events:g.events.map(e=>({...e})),bot:g.bot,difficulty:g.difficulty};
}
