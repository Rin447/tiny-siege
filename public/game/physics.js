import {ARENA} from './units.js';

/** Shared deterministic navigation and collision geometry. No browser APIs.
 * Ground bodies live on the lawn/bridges. Air bodies share a separate layer.
 * Buildings are static circles; tree/grass artwork is decorative only.
 */
export const PHYSICS_VERSION=13;
export const FIELD={left:34,right:686,top:28,bottom:1012};
const EPS=0.001,GRID=20,COLS=33,ROWS=49;
const worldCaches=new WeakMap();
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clampP=(n,a,b)=>Math.max(a,Math.min(b,n));
export const isStructure=u=>!!(u.kind||u.building);
export const bodyRadius=u=>u.radius||12;
export const sameLayer=(a,b)=>!!a.air===!!b.air;
export const solidStructures=g=>[...g.towers,...g.units.filter(u=>u.building)].filter(u=>u.hp>0);

export function deploymentAllowed(g,owner,x,y){
  if(owner!==0&&owner!==1)return false;
  if(owner===0&&y>=ARENA.deployBottom)return true;
  if(owner===1&&y<=ARENA.deployTop)return true;
  const enemy=1-owner,inset=ARENA.advancedDeployInset||120,centreHalf=ARENA.advancedCenterHalf||52;
  const sides=(g.towers||[]).filter(t=>t.owner===enemy&&t.kind==='tower');
  const fallen=sides.filter(t=>t.hp<=0);
  if(!fallen.length)return false;
  // Once both side towers are down, the enemy front half becomes one continuous deployment zone.
  if(fallen.length>=2){
    const line=owner===0?Math.max(...fallen.map(t=>t.y))+inset:Math.min(...fallen.map(t=>t.y))-inset;
    return owner===0?y>=line:y<=line;
  }
  // One tower down: only that lane plus a narrow centre connector gains ground.
  const t=fallen[0],left=t.x<360,laneOK=left?x<=320:x>=400,centreOK=Math.abs(x-360)<=centreHalf;
  if(!laneOK&&!centreOK)return false;
  return owner===0?y>=t.y+inset:y<=t.y-inset;
}
export function pairDistance(a,b,soft=false){
  const sum=bodyRadius(a)+bodyRadius(b);
  if(a.air&&b.air)return sum*(a.owner===b.owner?.9:1);
  return sum*(soft&&a.owner===b.owner?.90:1);
}
const water=[
  {l:0,r:ARENA.bridges[0]-ARENA.bridgeHalf,t:ARENA.riverTop,b:ARENA.riverBottom},
  {l:ARENA.bridges[0]+ARENA.bridgeHalf,r:ARENA.bridges[1]-ARENA.bridgeHalf,t:ARENA.riverTop,b:ARENA.riverBottom},
  {l:ARENA.bridges[1]+ARENA.bridgeHalf,r:ARENA.width,t:ARENA.riverTop,b:ARENA.riverBottom}
];
function rectDistance(p,r){return Math.hypot(p.x-clampP(p.x,r.l,r.r),p.y-clampP(p.y,r.t,r.b));}
export function terrainFree(u,p,margin=0){
  const r=bodyRadius(u)+margin;
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
  if(p.x<FIELD.left+r-EPS||p.x>FIELD.right-r+EPS||p.y<FIELD.top+r-EPS||p.y>FIELD.bottom-r+EPS)return false;
  return !!u.air||water.every(w=>rectDistance(p,w)>=r-EPS);
}
export function staticFree(g,u,p,margin=0,structures=null){
  if(!terrainFree(u,p,margin))return false;
  if(u.air)return true;
  return (structures||solidStructures(g)).every(s=>s.id===u.id||dist(p,s)>=bodyRadius(u)+bodyRadius(s)+margin-EPS);
}
function segmentPointDistance(a,b,p){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  const t=len?clampP(((p.x-a.x)*dx+(p.y-a.y)*dy)/len,0,1):0;
  return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y);
}
export function staticLineFree(g,u,a,b,margin=0,structures=null){
  if(!terrainFree(u,a,margin)||!terrainFree(u,b,margin))return false;
  if(u.air)return true;
  const r=bodyRadius(u)+margin;
  for(const s of structures||solidStructures(g))if(s.id!==u.id&&segmentPointDistance(a,b,s)<r+bodyRadius(s)-EPS)return false;
  // The river is axis-aligned. Sample only when the swept circle can reach it.
  if(Math.min(a.y,b.y)-r<=ARENA.riverBottom&&Math.max(a.y,b.y)+r>=ARENA.riverTop){
    const steps=Math.max(1,Math.ceil(dist(a,b)/4));
    for(let i=1;i<steps;i++)if(!terrainFree(u,{x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},margin))return false;
  }
  return true;
}
function topology(g){
  const structures=solidStructures(g);
  const key=structures.map(s=>`${s.id}:${s.x}:${s.y}:${s.radius}`).join('|');
  let cache=worldCaches.get(g);
  if(!cache||cache.key!==key){cache={key,structures,grids:new Map()};worldCaches.set(g,cache);}
  return cache;
}
function gridPoint(i){return {x:40+(i%COLS)*GRID,y:40+Math.floor(i/COLS)*GRID};}
function getGrid(g,u,cache){
  const r=bodyRadius(u);if(cache.grids.has(r))return cache.grids.get(r);
  const free=new Uint8Array(COLS*ROWS);
  for(let i=0;i<free.length;i++)free[i]=staticFree(g,u,gridPoint(i),2,cache.structures)?1:0;
  const data={free};cache.grids.set(r,data);return data;
}
class MinHeap {
  constructor(){this.items=[];this.order=0;}
  push(id,priority,cost){const a=this.items,v={id,priority,cost,order:this.order++};a.push(v);let i=a.length-1;while(i){const p=(i-1)>>1;if(!this.less(v,a[p]))break;a[i]=a[p];i=p;}a[i]=v;}
  less(a,b){return a.priority<b.priority-1e-8||(Math.abs(a.priority-b.priority)<1e-8&&a.order<b.order);}
  pop(){const a=this.items,top=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let k=i*2+1;if(k+1<a.length&&this.less(a[k+1],a[k]))k++;if(!this.less(a[k],v))break;a[i]=a[k];i=k;}a[i]=v;}return top;}
}
function routeToRange(g,u,target,reach,cache){
  const grid=getGrid(g,u,cache),len=grid.free.length,cost=new Float64Array(len).fill(Infinity),parent=new Int32Array(len).fill(-1),closed=new Uint8Array(len),heap=new MinHeap();
  const heuristic=p=>Math.max(0,dist(p,target)-reach);
  // Multiple visible starting cells avoid snapping/teleporting onto the grid.
  const cx=Math.round((u.x-40)/GRID),cy=Math.round((u.y-40)/GRID);
  for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
    const x=cx+ox,y=cy+oy;if(x<0||x>=COLS||y<0||y>=ROWS)continue;
    const id=y*COLS+x,p=gridPoint(id);
    if(grid.free[id]&&staticLineFree(g,u,u,p,0,cache.structures)){
      cost[id]=dist(u,p);heap.push(id,cost[id]+heuristic(p),cost[id]);
    }
  }
  // Keep tie-breaking local-seat symmetric (rotate 180 degrees for player 1).
  const f=u.owner===1?1:-1;
  const dirs=[[0,f],[-f,0],[f,0],[0,-f],[-f,f],[f,f],[-f,-f],[f,-f]];
  let end=-1,tail=null;
  while(heap.items.length){
    const cur=heap.pop(),id=cur.id;if(closed[id]||cur.cost>cost[id]+EPS)continue;
    closed[id]=1;const p=gridPoint(id);
    const remaining=dist(p,target);
    if(remaining<=reach){end=id;break;}
    if(remaining<reach+GRID*1.5){
      const d=Math.max(0,remaining-reach*.9),q={x:p.x+(target.x-p.x)*d/remaining,y:p.y+(target.y-p.y)*d/remaining};
      if(staticLineFree(g,u,p,q,1,cache.structures)){end=id;tail=q;break;}
    }
    const x=id%COLS,y=Math.floor(id/COLS);
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;if(nx<0||nx>=COLS||ny<0||ny>=ROWS)continue;
      const ni=ny*COLS+nx;if(!grid.free[ni]||closed[ni])continue;
      const q=gridPoint(ni);
      if(!staticLineFree(g,u,p,q,1,cache.structures))continue;
      const nc=cost[id]+Math.hypot(dx,dy)*GRID;
      if(nc+EPS<cost[ni]){cost[ni]=nc;parent[ni]=id;heap.push(ni,nc+heuristic(q),nc);}
    }
  }
  if(end<0)return [];
  const raw=[];while(end>=0){raw.push(gridPoint(end));end=parent[end];}raw.reverse();if(tail)raw.push(tail);
  // Line-of-sight string pulling: no cell-centre snapping or diagonal corner cuts.
  const result=[];let from={x:u.x,y:u.y},i=0;
  while(i<raw.length){let j=i;while(j+1<raw.length&&staticLineFree(g,u,from,raw[j+1],1,cache.structures))j++;result.push(raw[j]);from=raw[j];i=j+1;}
  return result;
}
export function navigationWaypoint(g,u,target,reach){
  const cache=topology(g),dx=target.x-u.x,dy=target.y-u.y,len=Math.hypot(dx,dy);
  if(len<.001)return {x:u.x,y:u.y};
  const stop=Math.max(0,len-reach+2),direct={x:u.x+dx/len*stop,y:u.y+dy/len*stop};
  if(u.air||staticLineFree(g,u,u,direct,1,cache.structures)){u._nav=null;return direct;}
  const now=g.time||0;let nav=u._nav;
  if(!nav||nav.key!==cache.key||nav.target!==target.id||
      ((dist(target,nav.aim)>35||!nav.points.length||u._stuck>.8)&&now>=nav.retry)){
    nav=u._nav={key:cache.key,target:target.id,aim:{x:target.x,y:target.y},points:routeToRange(g,u,target,Math.max(1,reach-2),cache),retry:now+.85};
  }
  while(nav.points.length&&dist(u,nav.points[0])<4)nav.points.shift();
  // Bypass obsolete waypoints only when the full body fits through the segment.
  while(nav.points.length>1&&staticLineFree(g,u,u,nav.points[1],1,cache.structures))nav.points.shift();
  return nav.points[0]||{x:u.x,y:u.y};
}
function timeOfContact(start,delta,other,radius){
  const x=start.x-other.x,y=start.y-other.y,a=delta.x*delta.x+delta.y*delta.y,b=x*delta.x+y*delta.y,c=x*x+y*y-radius*radius;
  if(a<1e-14)return 1;
  if(c<-.005){return b>=0?1:0;} // recovery may only move out of an existing overlap
  if(b>=0)return 1;
  const disc=b*b-a*c;if(disc<=0)return 1;
  const t=(-b-Math.sqrt(disc))/a;
  return t>=0&&t<1?Math.max(0,t-.0002):1;
}
function allowableFraction(g,u,dx,dy,{allies=true,soft=true}={}){
  const start={x:u.x,y:u.y},delta={x:dx,y:dy};let f=1;
  for(const v of g.units){
    if(v===u||v.id===u.id||v.hp<=0||!sameLayer(u,v)||isStructure(v))continue;
    if(!allies&&v.owner===u.owner)continue;
    const shoveable=!u.air&&!v.air&&u.owner!==v.owner&&u.shovePower&&((v.mass||1)<=u.shoveMassLimit);
    const collisionRadius=pairDistance(u,v,soft)*(shoveable?(u.shoveCompression||.65):1);
    f=Math.min(f,timeOfContact(start,delta,v,collisionRadius));
  }
  const end={x:u.x+dx*f,y:u.y+dy*f};
  if(!staticLineFree(g,u,start,end)){
    let lo=0,hi=f;for(let i=0;i<10;i++){const mid=(lo+hi)/2;if(staticLineFree(g,u,start,{x:start.x+dx*mid,y:start.y+dy*mid}))lo=mid;else hi=mid;}f=lo;
  }
  return f;
}
export function moveBody(g,u,dest,dt){
  const dx=dest.x-u.x,dy=dest.y-u.y,len=Math.hypot(dx,dy);if(len<.01)return 0;
  const step=Math.min(u.speed*dt,len),ux=dx/len,uy=dy/len;
  const straight=allowableFraction(g,u,ux*step,uy*step);
  let best={x:ux*step*straight,y:uy*step*straight,score:straight*step*1.25,side:0};
  if(straight<.995){
    // Pick a stable side around crowds; do not jitter left/right at equal costs.
    const prefer=u._avoidSide||((Number(String(u.id).replace(/\D/g,''))%2)?1:-1);
    for(const theta of [.35,.7,1.05,1.35,Math.PI/2,1.8])for(const sign of [prefer,-prefer]){
      const a=theta*sign,x=(ux*Math.cos(a)-uy*Math.sin(a))*step,y=(ux*Math.sin(a)+uy*Math.cos(a))*step;
      const f=allowableFraction(g,u,x,y),score=(x*ux+y*uy)*f+step*f*.25+(sign===prefer?.01:0);
      if(score>best.score+.0001)best={x:x*f,y:y*f,score,side:sign};
    }
  }
  u.x+=best.x;u.y+=best.y;if(best.side)u._avoidSide=best.side;
  const moved=Math.hypot(best.x,best.y);u._stuck=moved<step*.08?(u._stuck||0)+dt:0;
  return moved;
}
export function faceToward(u,x,y){
  const dx=x-u.x,dy=y-u.y;if(Math.hypot(dx,dy)<.01)return;
  u.facing=Math.atan2(dy,dx);
  // Hysteresis keeps near-horizontal movement from flipping front/back every tick.
  if(Math.abs(dy)>Math.abs(dx)*.18+.001)u.face=dy<0?-1:1;
}
function projectStatic(g,u){
  if(isStructure(u))return;
  const r=bodyRadius(u);u.x=clampP(u.x,FIELD.left+r,FIELD.right-r);u.y=clampP(u.y,FIELD.top+r,FIELD.bottom-r);
  if(u.air)return;
  for(let pass=0;pass<8;pass++){
    let changed=false;
    for(const s of solidStructures(g)){
      const d=dist(u,s),min=r+bodyRadius(s)+.02;
      if(d<min){let dx=d>.0001?(u.x-s.x)/d:(u.owner===0?-1:1),dy=d>.0001?(u.y-s.y)/d:0;u.x=s.x+dx*min;u.y=s.y+dy*min;changed=true;}
    }
    for(const w of water)if(rectDistance(u,w)<r){
      const candidates=[{x:w.l-r-.02,y:u.y},{x:w.r+r+.02,y:u.y},{x:u.x,y:w.t-r-.02},{x:u.x,y:w.b+r+.02}]
        .filter(p=>terrainFree(u,p)).sort((a,b)=>dist(a,u)-dist(b,u));
      if(candidates.length){u.x=candidates[0].x;u.y=candidates[0].y;changed=true;}
    }
    u.x=clampP(u.x,FIELD.left+r,FIELD.right-r);u.y=clampP(u.y,FIELD.top+r,FIELD.bottom-r);
    if(!changed||staticFree(g,u,u))break;
  }
}
export function resolveBodies(g,dt=.1){
  const units=g.units.filter(u=>u.hp>0&&u.burrowState!=='burrow');
  for(const u of units)projectStatic(g,u);
  for(let pass=0;pass<4;pass++)for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
    const a=units[i],b=units[j];if(!sameLayer(a,b)||isStructure(a)||isStructure(b))continue;
    const len=dist(a,b),min=pairDistance(a,b),over=min-len;if(over<=.005)continue;
    const side=(Number(String(a.id).replace(/\D/g,''))%2)?1:-1;
    const nx=len>.001?(a.x-b.x)/len:side,ny=len>.001?(a.y-b.y)/len:0;
    const ally=a.owner===b.owner,ia=1/(a.mass||1),ib=1/(b.mass||1),sum=ia+ib;
    const aShoves=!ally&&!a.air&&a.shovePower&&((b.mass||1)<=a.shoveMassLimit);
    const bShoves=!ally&&!b.air&&b.shovePower&&((a.mass||1)<=b.shoveMassLimit);
    // Allies gently compress. Enemies stay rigid, except a charging heavy unit can force lightweight troops aside.
    const amount=ally?Math.min(over*.42,dt*18):(over+.005+((aShoves||bShoves)?Math.min(3.2,dt*((aShoves?a.shovePower:b.shovePower)||0)):0));
    let shareA=ia/sum,shareB=ib/sum;
    if(aShoves&&!bShoves){shareA=.06;shareB=.94;} else if(bShoves&&!aShoves){shareA=.94;shareB=.06;}
    for(const [u,sign,share] of [[a,1,shareA],[b,-1,shareB]]){
      const dx=nx*amount*share*sign,dy=ny*amount*share*sign;
      const f=allowableFraction(g,u,dx,dy,{allies:false,soft:false});u.x+=dx*f;u.y+=dy*f;
    }
  }
  for(const u of units)projectStatic(g,u);
}
/** Find all group-spawn positions before charging energy. No displacement of enemies. */
function groupOffset(count,i,spacing=24){
  if(count<=1)return {x:0,y:0};
  if(count===3)return [{x:-spacing,y:8},{x:0,y:-16},{x:spacing,y:8}][i];
  if(count===5)return [{x:0,y:-24},{x:-22,y:-5},{x:22,y:-5},{x:-13,y:18},{x:13,y:18}][i];
  const cols=Math.ceil(Math.sqrt(count)),row=Math.floor(i/cols),col=i%cols;
  return {x:(col-(cols-1)/2)*spacing,y:(row-(Math.ceil(count/cols)-1)/2)*spacing};
}
export function spawnPositions(g,owner,data,x,y){
  const points=[],f=owner===0?1:-1;
  for(let i=0;i<data.count;i++){
    const off=groupOffset(data.count,i,data.radius<=10?20:24);
    const wanted={x:x+off.x*f,y:y+off.y*f};
    let found=null;
    // Ground buildings must remain exactly where clicked, not shift out from under the cursor.
    const rings=data.building?[0]:[0,12,24,36,48];
    for(const rr of rings){
      const n=rr?16:1;
      for(let k=0;k<n;k++){
        const a=k*Math.PI*2/n+(owner===1?Math.PI:0),p={x:wanted.x+Math.cos(a)*rr,y:wanted.y+Math.sin(a)*rr};
        if(p.x<48||p.x>672||p.y<58||p.y>982||!deploymentAllowed(g,owner,p.x,p.y))continue;
        if(!staticFree(g,data,p,1))continue;
        if(g.units.some(u=>u.hp>0&&sameLayer(data,u)&&dist(p,u)<bodyRadius(data)+bodyRadius(u)+.5))continue;
        if(points.some(q=>dist(p,q)<data.radius*2+.5))continue;
        found=p;break;
      }
      if(found)break;
    }
    if(!found)return null;points.push(found);
  }
  return points;
}
