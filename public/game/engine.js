import {ARENA, UNITS, DECK, DEFAULT_DECK, MAX_DECK, normalizeDeck} from './units.js';
import {PHYSICS_VERSION, staticFree, spawnPositions, navigationWaypoint, moveBody, resolveBodies, faceToward} from './physics.js';

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
      hp:core?2700:1650,maxHp:core?2700:1650,radius:core?40:32,range:core?226:226,damage:core?92:83,cd:0,
      cooldown:core?0.9:1.0,targetsAir:true,projectile:'tower',hit:0,anim:0});
    }
  }
  return g;
}
export function inRiver(x,y){return y>ARENA.riverTop && y<ARENA.riverBottom && !ARENA.bridges.some(b=>Math.abs(x-b)<=ARENA.bridgeHalf);}
export function canPlace(g,owner,id,x,y){
  if(g.phase!=='battle')return 'まだ出撃できません。';
  if(owner!==0 && owner!==1)return '参加者ではありません。';
  if(typeof id!=='string'||!Object.hasOwn(UNITS,id))return '不明なユニットです。';
  const d=UNITS[id];
  if(!Number.isFinite(x)||!Number.isFinite(y))return '配置位置が正しくありません。';
  if(x<48||x>672||y<58||y>982)return 'フィールドの内側に配置してください。';
  if(owner===0?y<ARENA.deployBottom:y>ARENA.deployTop)return '自分の陣地に配置してください。';
  if(!g.players[owner].hand.includes(id))return 'そのカードは手札にありません。';
  if(g.players[owner].energy+0.00001<d.cost)return 'エナジーが足りません。';
  if(g.units.filter(u=>u.hp>0).length+d.count>ARENA.maxUnits)return 'フィールドのユニット上限です。';
  if(!staticFree(g,d,{x,y},1))return '\u5efa\u7269\u3084\u5cb8\u304b\u3089\u5c11\u3057\u96e2\u3057\u3066\u914d\u7f6e\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  if(!spawnPositions(g,owner,d,x,y))return '\u914d\u7f6e\u3059\u308b\u7a7a\u9593\u304c\u3042\u308a\u307e\u305b\u3093\u3002\u5c11\u3057\u96e2\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  return null;
}
function event(g,type,data){g.events.push({id:g.nextId++,type,life:type==='death'?0.9:0.5,...data});}
export function deploy(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id],p=g.players[owner],index=p.hand.indexOf(id),positions=spawnPositions(g,owner,d,x,y);
  p.energy=Math.max(0,p.energy-d.cost);p.hand[index]=p.queue.shift();p.queue.push(id);
  for(let i=0;i<d.count;i++){
    const u={...d,id:`u${g.nextId++}`,type:id,owner,x:positions[i].x,y:positions[i].y,
      hp:d.hp,maxHp:d.hp,cd:0,spawn:0.5,anim:0,hit:0,walk:0,target:null,face:owner===0?-1:1,
      lane:x<360?190:530,age:0,facing:owner===0?-Math.PI/2:Math.PI/2,moving:false};
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
function isBacklineTarget(t){
  return !t.kind&&!t.building&&(!!t.projectile||t.range>=110);
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
  // Nightshade looks past the frontline when a ranged/backline target is close enough.
  if(u.targetPriority==='backline'){
    let best=null,bestD=Infinity;
    for(const t of entities){
      if(!targetable(u,t)||!isBacklineTarget(t))continue;
      const d=distance(u,t)-t.radius;
      if(d<=(u.priorityRange||300)&&d<bestD){best=t;bestD=d;}
    }
    if(best)return best;
  }
  // Nearest combatant in the aggro radius; buildings never chase.
  const reach=u.kind||u.building?u.range+30:Math.max(205,u.range+35);
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    const d=distance(u,t)-t.radius;
    if(d<=reach&&(d<bestD)){best=t;bestD=d;}
  }
  if(!best && !u.kind && !u.building)best=preferredTower(g,u);
  return best;
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
function damage(g,t,amount,owner){
  if(t.hp<=0)return;
  t.hp=Math.max(0,t.hp-amount);t.hit=.18;
  if(t.hp===0)event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:!!t.kind});
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
  const threat=g.units.filter(u=>u.owner!==owner&&u.hp>0&&(owner===1?u.y<450:u.y>590)).sort((a,b)=>distance(a,{x:360,y:owner===1?150:890})-distance(b,{x:360,y:owner===1?150:890}))[0];
  let choices=aff;
  if(threat?.air&&aff.some(id=>UNITS[id].targetsAir))choices=aff.filter(id=>UNITS[id].targetsAir);
  else if(!threat&&p.energy<7&&g.difficulty!=='hard'&&random(g)<.5)return;
  let id=choices[Math.floor(random(g)*choices.length)];
  if(!threat&&id==='cannon'&&aff.length>1)id=aff.find(k=>k!=='cannon');
  const lane=threat?(threat.x<360?190:530):(random(g)<.5?190:530);
  const baseY=owner===1?(threat?360:145):(threat?680:895);
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
  if(g.bot&&g.time>=g.botNext){
    runBot(g,1);g.botNext=g.time+(g.difficulty==='easy'?2.6:g.difficulty==='hard'?.65:1.3)+random(g)*.7;
  }
  resolveBodies(g,0);
  const entities=alive(g);
  for(const u of entities){
    if(u.hp<=0)continue;
    u.moving=false;
    u.hit=Math.max(0,(u.hit||0)-dt);u.anim=Math.max(0,(u.anim||0)-dt);u.cd=Math.max(0,u.cd-dt);u.healCd=Math.max(0,(u.healCd||0)-dt);
    if(!u.kind){
      u.age+=dt;
      if(u.lifetime&&u.age>=u.lifetime){damage(g,u,u.hp,1-u.owner);continue;}
      if(u.spawn>0){u.spawn=Math.max(0,u.spawn-dt);continue;}
    }
    healingPulse(g,u,entities);
    const target=getTarget(g,u,entities);
    if(!target){u.target=null;continue;}
    u.target=target.id;
    const reach=u.range+target.radius;
    if(distance(u,target)<=reach){
      faceToward(u,target.x,target.y);
      if(u.cd<=0)attack(g,u,target);
    }else if(!u.kind)move(g,u,target,dt);
  }
  for(const p of g.projectiles){
    p.life-=dt;const t=entities.find(e=>e.id===p.target&&e.hp>0);
    if(t){p.tx=t.x;p.ty=t.y;}
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
    units:g.units.map(u=>({id:u.id,type:u.type,owner:u.owner,x:rnd(u.x),y:rnd(u.y),hp:u.hp,maxHp:u.maxHp,radius:u.radius,air:u.air,building:!!u.building,anim:u.anim,hit:u.hit,walk:u.walk,spawn:u.spawn,face:u.face,facing:u.facing,moving:!!u.moving,mass:u.mass,age:u.age,charged:!!u.charged,chargeRun:rnd(u.chargeRun||0),slowed:(u.slowUntil||0)>g.time,slowRemaining:rnd(Math.max(0,(u.slowUntil||0)-g.time))})),
    towers:g.towers.map(t=>({id:t.id,kind:t.kind,owner:t.owner,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,radius:t.radius,anim:t.anim,hit:t.hit,facing:t.facing})),
    projectiles:g.projectiles.map(p=>({id:p.id,owner:p.owner,x:p.x,y:p.y,tx:p.tx,ty:p.ty,kind:p.kind})),
    events:g.events.map(e=>({...e})),bot:g.bot,difficulty:g.difficulty};
}
