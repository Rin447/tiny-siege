import {ARENA, UNITS, DECK, DEFAULT_DECK, MAX_DECK, normalizeDeck} from './units.js';
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
  const g={physicsVersion:PHYSICS_VERSION,phase:'countdown',countdown:3,time:0,overtime:false,rng:seed||1,units:[],projectiles:[],events:[],nextId:1,step:0,
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
  if(!deploymentAllowed(g,owner,x,y))return '自分の陣地、または破壊した敵サイドタワー側の前線に配置してください。';
  if(g.units.filter(u=>u.hp>0).length+d.count>ARENA.maxUnits)return 'フィールドのユニット上限です。';
  if(!staticFree(g,d,{x,y},1))return '建物や岸から少し離して配置してください。';
  if(!spawnPositions(g,owner,d,x,y))return '配置する空間がありません。少し離してください。';
  return null;
}
function event(g,type,data){g.events.push({id:g.nextId++,type,life:type==='death'?0.9:0.5,...data});}
function spendCard(g,owner,id){
  const p=g.players[owner],d=UNITS[id],index=p.hand.indexOf(id);
  p.energy=Math.max(0,p.energy-d.cost);p.hand[index]=p.queue.shift();p.queue.push(id);
}
function makeUnit(g,owner,type,x,y){
  const d=UNITS[type];
  return {...d,id:`u${g.nextId++}`,type,owner,x,y,hp:d.hp,maxHp:d.hp,cd:0,spawn:0.5,anim:0,hit:0,walk:0,target:null,face:owner===0?-1:1,
    lane:x<360?190:530,age:0,facing:owner===0?-Math.PI/2:Math.PI/2,moving:false};
}
function fireballTravelTime(core,target){return clamp(.45+distance(core,target)/620,.6,2);}
function castSpell(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id],core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0),travel=fireballTravelTime(core,{x,y});
  spendCard(g,owner,id);
  g.projectiles.push({id:`p${g.nextId++}`,owner,kind:'fireball',spell:'fireball',x:core.x,y:core.y,sx:core.x,sy:core.y,tx:x,ty:y,
    total:travel,remaining:travel,progress:0,damage:d.damage,buildingDamage:d.buildingDamage,splash:d.radius,targetsAir:true,life:travel+.2});
  event(g,'fireball-launch',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
  return {ok:true,spell:true,travelTime:travel};
}
export function deploy(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id];if(d.spell)return castSpell(g,owner,id,x,y);
  const positions=spawnPositions(g,owner,d,x,y);spendCard(g,owner,id);
  for(let i=0;i<d.count;i++){
    const u=makeUnit(g,owner,id,positions[i].x,positions[i].y);
    g.units.push(u);event(g,'spawn',{x:u.x,y:u.y,owner});
  }
  return {ok:true};
}
function alive(g){return [...g.units,...g.towers].filter(v=>v.hp>0);}
function targetable(source,target){return target.owner!==source.owner&&target.hp>0&&(!target.air||source.targetsAir);}
function preferredTower(g,u){
  const enemy=1-u.owner;
  const out=g.towers.find(t=>t.owner===enemy&&t.kind==='tower'&&t.x===u.lane&&t.hp>0);
  return out||g.towers.find(t=>t.owner===enemy&&t.kind==='core'&&t.hp>0);
}
function getTarget(g,u,entities){
  // Building-only units ignore troops completely and march toward the nearest enemy structure.
  if(u.buildingOnly){
    let best=null,bestD=Infinity;
    for(const t of entities){
      if(!targetable(u,t)||!(t.kind||t.building))continue;
      const d=distance(u,t)-t.radius;
      if(d<bestD){best=t;bestD=d;}
    }
    return best;
  }
  // Nearest combatant in the aggro radius; buildings never chase.
  const reach=u.kind||u.building?u.range+30:(u.aggroRange??Math.max(205,u.range+35));
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    const d=distance(u,t)-t.radius-(u.aggroRange?u.range:0);
    if(d<=reach&&(d<bestD)){best=t;bestD=d;}
  }
  if(!best && !u.kind && !u.building)best=preferredTower(g,u);
  return best;
}
function dashEndpoint(u,t){
  const dx=u.x-t.x,dy=u.y-t.y,len=Math.hypot(dx,dy)||1;
  const stop=Math.max(1,u.range+t.radius-1);
  return {x:t.x+dx/len*stop,y:t.y+dy/len*stop};
}
function canShadowRush(g,u,t){
  if(!u.dashWindup||g.time<(u.dashReadyAt||0)||u.dashState)return false;
  const gap=Math.max(0,distance(u,t)-(u.range+t.radius));
  if(gap<(u.dashMinRange||0)||gap>(u.dashAggroRange??u.dashMaxRange??Infinity))return false;
  const end=dashEndpoint(u,t);
  return staticLineFree(g,u,u,end,1);
}
function beginShadowWindup(g,u,t){
  u.dashState='windup';u.dashTarget=t.id;u.dashWindupUntil=g.time+u.dashWindup;u.moving=false;
  faceToward(u,t.x,t.y);event(g,'shadow-windup',{x:u.x,y:u.y,owner:u.owner});
}
function beginShadowRush(g,u,t){
  const end=dashEndpoint(u,t);
  if(!staticLineFree(g,u,u,end,1)){u.dashState=null;u.dashTarget=null;return false;}
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
  const t=entities.find(e=>e.id===u.dashTarget&&e.hp>0);
  if(u.dashState==='windup'){
    u.moving=false;if(t)faceToward(u,t.x,t.y);
    if(g.time+1e-8>=u.dashWindupUntil){
      if(!t||!targetable(u,t)||!canRushAfterWindup(g,u,t)){u.dashState=null;u.dashTarget=null;u.dashReadyAt=g.time+.35;}
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
function canRushAfterWindup(g,u,t){
  const gap=Math.max(0,distance(u,t)-(u.range+t.radius));
  if(gap>(u.dashMaxRange||Infinity)+35)return false;
  const end=dashEndpoint(u,t);return staticLineFree(g,u,u,end,1);
}
function move(g,u,t,dt){
  if(!u.speed)return;
  const dest=navigationWaypoint(g,u,t,u.range+t.radius);
  const start={x:u.x,y:u.y};
  const moveFactor=(u.slowUntil||0)>g.time?(u.slowMoveFactor||1):1;
  const moved=moveBody(g,u,dest,dt*moveFactor);
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
  if(t.hp<=0)return 0;
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
  t.slowUntil=Math.max(t.slowUntil||0,g.time+p.slowDuration);
  t.slowMoveFactor=Math.min(t.slowMoveFactor||1,p.slowMove||1);
  t.slowAttackFactor=Math.min(t.slowAttackFactor||1,p.slowAttack||1);
  if(t.chargeDistance){
    t.chargeRun=Math.max(0,(t.chargeRun||0)-45);
    if(t.chargeRun<t.chargeDistance*.8)t.charged=false;
  }
  event(g,'slow',{x:t.x,y:t.y,owner:p.owner});
}
function fireballImpact(g,p){
  event(g,'fireball-impact',{x:p.tx,y:p.ty,owner:p.owner,radius:p.splash,damage:p.damage});
  const centre={x:p.tx,y:p.ty};
  for(const t of [...alive(g)]){
    if(t.owner===p.owner||t.hp<=0)continue;
    if(distance(centre,t)>p.splash+(t.radius||12)*.35)continue;
    damage(g,t,(t.kind||t.building)?p.buildingDamage:p.damage,p.owner);
  }
}
function impact(g,p,entities){
  const target=entities.find(t=>t.id===p.target);
  if(p.chainCount&&target&&targetable(p,target)){
    const points=[];let current=target,amount=p.damage;const hit=new Set();
    for(let i=0;i<p.chainCount&&current;i++){
      hit.add(current.id);damage(g,current,Math.round(amount),p.owner);points.push({x:current.x,y:current.y});
      amount*=p.chainFalloff||.8;
      const candidates=entities.filter(t=>!hit.has(t.id)&&targetable(p,t)&&!t.kind&&!t.building&&distance(current,t)<=p.chainRange+t.radius)
        .sort((a,b)=>distance(current,a)-distance(current,b)||String(a.id).localeCompare(String(b.id)));
      current=candidates[0]||null;
    }
    event(g,'chain',{x:p.x,y:p.y,owner:p.owner,points});
  }else if(p.splash){
    event(g,'blast',{x:p.x,y:p.y,owner:p.owner,radius:p.splash,color:p.kind});
    for(const t of entities)if(targetable(p,t)&&distance(t,p)<=p.splash+t.radius*.35)damage(g,t,p.damage,p.owner);
  }else if(target&&targetable(p,target)){damage(g,target,p.damage,p.owner);applySlow(g,target,p);}
}
function attack(g,u,t){
  const attackFactor=(u.slowUntil||0)>g.time?(u.slowAttackFactor||1):1;
  u.cd=u.cooldown/Math.max(.15,attackFactor);u.anim=.35;faceToward(u,t.x,t.y);u.target=t.id;
  let amount=u.damage;
  if(u.chargeMultiplier&&u.charged&&(t.kind||t.building)){
    amount=Math.round(amount*u.chargeMultiplier);u.charged=false;u.chargeRun=0;
    event(g,'charge-hit',{x:t.x,y:t.y,owner:u.owner,radius:48});
  }
  if(u.projectile){
    g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,x:u.x,y:u.y-6,sx:u.x,sy:u.y,tx:t.x,ty:t.y,target:t.id,
    kind:u.projectile,speed:u.projectile==='bomb'?220:(u.projectile==='lightning'?520:390),damage:amount,splash:u.splash||0,
    targetsAir:u.targetsAir,life:3,slowMove:u.slowMove,slowAttack:u.slowAttack,slowDuration:u.slowDuration,
    chainCount:u.chainCount,chainRange:u.chainRange,chainFalloff:u.chainFalloff});
  }else{
    damage(g,t,amount,u.owner);event(g,'slash',{x:t.x,y:t.y,owner:u.owner,angle:Math.atan2(t.y-u.y,t.x-u.x),kind:u.type});
  }
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
  if(aff.includes('fireball')&&threat){
    const clustered=enemies.filter(u=>distance(u,threat)<=UNITS.fireball.radius+u.radius).length;
    if(clustered>=2||threat.type==='frost'||threat.type==='lumina'){
      deploy(g,owner,'fireball',threat.x,threat.y);return;
    }
  }
  let choices=aff.filter(id=>!UNITS[id].spell);if(!choices.length){
    const target=threat||g.towers.find(t=>t.owner!==owner&&t.kind==='tower'&&t.hp>0)||g.towers.find(t=>t.owner!==owner&&t.kind==='core'&&t.hp>0);
    if(target)deploy(g,owner,'fireball',target.x,target.y);return;
  }
  if(threat?.air&&choices.some(id=>UNITS[id].targetsAir))choices=choices.filter(id=>UNITS[id].targetsAir);
  else if(!threat&&p.energy<7&&g.difficulty!=='hard'&&random(g)<.5)return;
  let id=choices[Math.floor(random(g)*choices.length)];
  if(!threat&&id==='cannon'&&choices.length>1)id=choices.find(k=>k!=='cannon')||id;
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
  refreshCoreWake(g);
  if(g.bot&&g.time>=g.botNext){
    runBot(g,1);g.botNext=g.time+(g.difficulty==='easy'?2.6:g.difficulty==='hard'?.65:1.3)+random(g)*.7;
  }
  resolveBodies(g,0);
  const entities=alive(g);
  for(const u of entities){
    if(u.hp<=0)continue;
    u.moving=false;
    u.hit=Math.max(0,(u.hit||0)-dt);u.anim=Math.max(0,(u.anim||0)-dt);u.cd=Math.max(0,u.cd-dt);u.healCd=Math.max(0,(u.healCd||0)-dt);
    if(u.kind==='core'&&!u.awake){u.target=null;continue;}
    if(!u.kind){
      u.age+=dt;
      if(u.spawn>0){u.spawn=Math.max(0,u.spawn-dt);continue;}
      if(u.decayPerSecond){decayStructure(g,u,u.decayPerSecond*dt);if(u.hp<=0)continue;}
    }
    if(updateShadowRush(g,u,entities,dt))continue;
    healingPulse(g,u,entities);
    const target=getTarget(g,u,entities);
    if(!target){u.target=null;continue;}
    u.target=target.id;
    const reach=u.range+target.radius;
    if(canShadowRush(g,u,target)){beginShadowWindup(g,u,target);continue;}
    if(distance(u,target)<=reach){
      faceToward(u,target.x,target.y);
      if(u.cd<=0)attack(g,u,target);
    }else if(!u.kind)move(g,u,target,dt);
  }
  for(const p of g.projectiles){
    p.life-=dt;
    if(p.spell==='fireball'){
      p.remaining=Math.max(0,p.remaining-dt);p.progress=clamp(1-p.remaining/p.total,0,1);
      p.x=p.sx+(p.tx-p.sx)*p.progress;p.y=p.sy+(p.ty-p.sy)*p.progress;
      if(p.remaining<=1e-8){p.x=p.tx;p.y=p.ty;fireballImpact(g,p);p.life=0;}
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
    units:g.units.map(u=>({id:u.id,type:u.type,owner:u.owner,x:rnd(u.x),y:rnd(u.y),hp:u.hp,maxHp:u.maxHp,radius:u.radius,air:u.air,building:!!u.building,anim:u.anim,hit:u.hit,walk:u.walk,spawn:u.spawn,face:u.face,facing:u.facing,moving:!!u.moving,mass:u.mass,age:u.age,charged:!!u.charged,chargeRun:rnd(u.chargeRun||0),slowed:(u.slowUntil||0)>g.time,slowRemaining:rnd(Math.max(0,(u.slowUntil||0)-g.time)),dashState:u.dashState||null,dashWindupRemaining:rnd(Math.max(0,(u.dashWindupUntil||0)-g.time)),dashCooldownRemaining:rnd(Math.max(0,(u.dashReadyAt||0)-g.time)),invulnerable:(u.invulnerableUntil||0)>g.time})),
    towers:g.towers.map(t=>({id:t.id,kind:t.kind,owner:t.owner,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,radius:t.radius,anim:t.anim,hit:t.hit,facing:t.facing,awake:t.kind==='core'?!!t.awake:true})),
    projectiles:g.projectiles.map(p=>({id:p.id,owner:p.owner,x:rnd(p.x),y:rnd(p.y),tx:rnd(p.tx),ty:rnd(p.ty),kind:p.kind,spell:p.spell||null,progress:rnd(p.progress||0),radius:p.splash||0})),
    events:g.events.map(e=>({...e})),bot:g.bot,difficulty:g.difficulty};
}
