import assert from 'node:assert/strict';
import {performance} from 'node:perf_hooks';
import fs from 'node:fs/promises';
import {createMatch,deploy,tick,distance} from '../public/game/engine.js';
import {UNITS,DECK} from '../public/game/units.js';
import {staticFree} from '../public/game/physics.js';
const g=createMatch({seed:7421});g.phase='battle';for(const t of g.towers)t.damage=0;
let serial=0;
for(const owner of [0,1])for(let row=0;row<3;row++)for(let col=0;col<5;col++){
 const id=DECK[(serial++)%DECK.length],p=g.players[owner];p.energy=10;p.hand=[id,...DECK.filter(x=>x!==id).slice(0,3)];p.queue=DECK.filter(x=>!p.hand.includes(x));
 const x=100+col*125,y=640+row*115;deploy(g,owner,id,owner===0?x:720-x,owner===0?y:1040-y);
}
for(const u of g.units){u.damage=0;u.hp=100000;u.maxHp=100000;}
let worst=0,peak=g.units.length,maxFrame=0;const durations=[];
for(let i=0;i<300;i++){
 const s=performance.now();tick(g,.1);const ms=performance.now()-s;durations.push(ms);maxFrame=Math.max(maxFrame,ms);
 for(const u of g.units){assert.ok(staticFree(g,u,u),`inside obstacle ${u.id}`);assert.ok(Number.isFinite(u.x+u.y));}
 for(let a=0;a<g.units.length;a++)for(let b=a+1;b<g.units.length;b++){
  const u=g.units[a],v=g.units[b];if(u.owner===v.owner||!!u.air!==!!v.air)continue;
  let min=u.radius+v.radius;
  const uShoves=!u.air&&u.shovePower&&((v.mass||1)<=u.shoveMassLimit),vShoves=!v.air&&v.shovePower&&((u.mass||1)<=v.shoveMassLimit);
  if(uShoves&&!vShoves)min*=u.shoveCompression||.65;else if(vShoves&&!uShoves)min*=v.shoveCompression||.65;
  worst=Math.max(worst,min-distance(u,v));
 }
}
durations.sort((a,b)=>a-b);
const report={units:peak,steps:300,simulatedSeconds:30,meanMs:durations.reduce((a,b)=>a+b,0)/durations.length,p95Ms:durations[Math.floor(durations.length*.95)],maxFrameMs:maxFrame,maxEnemyOverlap:Math.max(0,worst),runtime:process.version,note:'Synthetic zero-damage congestion test on local Node. Shove-enabled lightweight compression is treated as intentional. Not a Cloudflare CPU/quota benchmark.'};
console.log(JSON.stringify(report,null,2));
assert.ok(worst<.05,`enemy overlap ${worst}`); // sub-pixel contact tolerance for large heavy bodies
await fs.writeFile(new URL('../docs/STRESS_RESULTS.json',import.meta.url),JSON.stringify(report,null,2));
