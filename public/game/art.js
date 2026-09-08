import {ARENA, UNITS, TEAM_COLORS} from './units.js';
import {clamp} from './engine.js';

// Lightweight procedural cut-out rig: hips, knees, shoulders, hands and equipment.
// All illustrations are original vectors; no external art or font assets are loaded.
const TAU=Math.PI*2;
function path(ctx,pts,fill,stroke=null,w=1){
  ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function line(c,x,y,x2,y2,color,w=2){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r,color,stroke){
  c.beginPath();c.roundRect(x,y,w,h,r);if(color){c.fillStyle=color;c.fill();}
  if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}
}
function limb(c,x,y,a,len,color,width){
  c.save();c.translate(x,y);c.rotate(a);line(c,0,0,0,len,color,width);c.restore();
}
function sword(c,a=0){
  c.save();c.rotate(a);
  path(c,[[-2,3],[-3,-27],[0,-36],[4,-27],[3,3]],'#e5eef0','#3b565f',1.2);
  line(c,0,-27,0,1,'#fff9dd',1);
  rr(c,-8,1,16,4,2,'#efc16b');rr(c,-2,5,4,8,1,'#785341');c.restore();
}
function shield(c,col){
  path(c,[[-10,-14],[10,-14],[11,2],[0,14],[-11,2]],col,'#29494c',2);
  path(c,[[-7,-10],[-1,-10],[-1,8],[-7,1]],'#f4e3a3');line(c,-6,-6,6,-6,'#f3ca77',2);
}
// Rear cut-out variants share the gait and shoulder rig with the original art.
function drawBackHumanoid(c,type,opts){
 const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0;
 const team=TEAM_COLORS[opts.owner||0],ink='#233945',skin='#e4b78f',heavy=type==='knight',w=heavy?19:13;
 const body=type==='mage'?'#60527d':type==='archer'?'#526c44':type==='bomber'?'#7c5742':heavy?'#879ca2':'#42676b';
 c.save();c.scale(-1,1);c.translate(0,Math.sin(walk)*1.5+(opts.idle?Math.sin(t*2)*.65:0));
 const swing=attack?Math.sin((1-attack/.35)*Math.PI)*1.5:Math.sin(walk)*.18;
 for(const side of [-1,1]){
  c.save();c.translate(side*(heavy?8:6),-11);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.36:0));
  limb(c,0,0,0,13,heavy?'#637d88':'#45504c',heavy?9:7);rr(c,-5,9,heavy?12:10,6,2,ink);line(c,-3,12,3,12,'#71807a',1);c.restore();
 }
 // Paint far arms before back plates, with visible equipment rear surfaces.
 c.save();c.translate(w+1,-32);c.rotate(type==='spear'?-swing*.55:-swing-.2);
 line(c,0,0,1,13,body,heavy?12:8);ellipse(c,1,13,4,4,skin);c.translate(1,13);
 if(type==='blade'||heavy)sword(c,.3);
 else if(type==='spear'){
  line(c,0,18,0,-43,'#a1744b',3);path(c,[[0,-58],[-5,-42],[0,-37],[5,-42]],'#cde2da',ink,1);line(c,-4,-30,4,-30,team,4);
 }else if(type==='mage'){
  line(c,0,16,0,-31,'#aa9270',4);path(c,[[0,-47],[-9,-36],[0,-25],[9,-36]],'#baa2f0','#524572',2);ellipse(c,0,-36,4,5,attack?'#fff5d7':'#e8d6ff');
 }else if(type==='bomber'){
  ellipse(c,0,-2,9,10,'#254450');line(c,0,-13,4,-18,'#e8bf77',2);ellipse(c,5,-19,3,3,'#ffd389');
 }
 c.restore();c.save();c.translate(-w-2,-32);c.rotate(-.12-Math.sin(walk)*.12);
 line(c,0,0,-3,14,body,heavy?12:8);ellipse(c,-3,15,4,4,skin);
 if(heavy||type==='blade'){
  c.translate(-5,12);path(c,[[-10,-14],[10,-14],[11,2],[0,14],[-11,2]],'#6c6554',ink,2);
  line(c,-5,-10,-5,4,'#b5986d',2);line(c,5,-10,5,4,'#b5986d',2);rr(c,-8,-3,16,6,2,'#473c33');
 }else if(type==='archer'){
  c.translate(-7,4);c.strokeStyle='#c79960';c.lineWidth=3;c.beginPath();c.arc(0,0,20,-Math.PI/2,Math.PI/2);c.stroke();line(c,0,-20,0,20,'#eadaba',1);
 }
 c.restore();
 if(type==='mage')path(c,[[-12,-29],[13,-29],[20,2],[0,-3],[-20,2]],'#564875',ink,1);
 rr(c,-w,-39,w*2,29,heavy?7:6,body,ink);rr(c,-w,-36,w*2,8,3,team);
 if(heavy){
  path(c,[[-17,-28],[0,-32],[17,-28],[15,-13],[0,-8],[-15,-13]],'#a6b9b4',ink,1);
  line(c,0,-29,0,-12,'#637d81',2);line(c,-13,-20,13,-20,'#708c8c',1.5);
  for(const x of [-12,12])for(const y of [-25,-15])ellipse(c,x,y,1.4,1.4,'#e3ddbc');
  rr(c,-w-4,-40,12,10,3,'#9cafb1',ink);rr(c,w-8,-40,12,10,3,'#9cafb1',ink);
 }else if(type==='archer'){
  path(c,[[-13,-34],[10,-37],[17,-8],[3,1],[-16,-5]],'#43624c',ink,1);line(c,1,-30,7,-6,'#688260',1.5);
  c.save();c.translate(7,-22);c.rotate(.32);
  for(const x of [-4,0,4]){line(c,x,-19,x,8,'#dbc79a',1.6);path(c,[[x,-21],[x-3,-28],[x,-26],[x+3,-28]],'#d9dda4',ink,.6);}
  rr(c,-7,-12,14,28,4,'#986b49',ink);rr(c,-8,-13,16,5,2,'#d2a572');line(c,-4,-5,-4,11,'#bb8955',1);c.restore();
 }else if(type==='mage'){
  path(c,[[-12,-32],[12,-32],[18,0],[0,-4],[-18,0]],'#695787',ink,1);
  line(c,-10,-30,-15,-3,'#a391b7',1);line(c,10,-30,15,-3,'#a391b7',1);
  path(c,[[0,-27],[5,-21],[0,-14],[-5,-21]],null,'#dcc987',1.5);line(c,0,-12,0,-7,'#dcc987',1.5);
 }else if(type==='bomber'){
  for(const x of [-8,8])line(c,x,-36,x,-10,'#c1a175',3);
  ellipse(c,-5,-31,6,7,'#223d49');ellipse(c,6,-32,6,7,'#304854');line(c,6,-38,9,-43,'#efd189',1.5);
  rr(c,-13,-30,26,23,5,'#b58a59',ink);rr(c,-13,-30,26,8,4,'#ccaa73');rr(c,-3,-26,6,17,1,'#655041');rr(c,-3,-18,6,5,1,'#e1c287');
 }else{
  line(c,-10,-33,9,-16,'#a89061',3);line(c,9,-33,-9,-16,'#8d7752',2);rr(c,-w,-15,w*2,5,1,'#463e33');
 }
 const hy=-48;
 if(type==='mage'){
  path(c,[[-18,hy-5],[-7,hy-18],[2,hy-37],[12,hy-16],[20,hy-5]],'#6b5a8d',ink,1.6);
  path(c,[[-16,hy-8],[16,hy-8],[18,hy-4],[-18,hy-4]],'#c7ac71');
  path(c,[[-9,hy-3],[9,hy-3],[10,hy+9],[0,hy+14],[-10,hy+9]],'#5d4d77',ink,1);line(c,0,hy-28,6,hy-11,'#907ea7',1.2);
 }else if(type==='archer'){
  path(c,[[-13,hy+8],[-14,hy-10],[0,hy-22],[14,hy-10],[13,hy+9],[0,hy+14]],'#5d7e54',ink,1.5);
  line(c,0,hy-18,0,hy+9,'#839b66',1.5);line(c,8,hy-17,13,hy-29,'#d4c886',3);path(c,[[13,hy-30],[19,hy-31],[16,hy-21]],'#ecd18c');
 }else if(heavy){
  rr(c,-15,hy-15,30,27,8,'#94aaaf',ink);rr(c,-15,hy+3,30,10,4,'#657f89',ink);line(c,-9,hy-8,9,hy-8,'#bfcfcb',2);
  rr(c,-3,hy-15,6,27,1,'#c6d2c9');path(c,[[-3,hy-13],[-4,hy-27],[8,hy-28],[13,hy-18]],team,ink,1);
 }else if(type==='bomber'){
  rr(c,-13,hy-15,26,27,8,'#9e6e49',ink);rr(c,-13,hy-2,26,5,2,'#3b4344');rr(c,-3,hy-3,6,7,1,'#b0b5a1');line(c,0,hy-12,0,hy-5,'#c59a67',1.5);
 }else{
  const helm=type==='spear'?'#b87856':'#8fa6aa';rr(c,-12,hy-14,24,26,7,helm,ink);
  path(c,[[-2,hy-13],[-5,hy-29],[4,hy-26],[9,hy-15]],type==='spear'?'#efb686':team,ink,1);
  rr(c,-12,hy+3,24,8,2,type==='spear'?'#815441':'#687f85');line(c,-8,hy-8,7,hy-8,type==='spear'?'#d7a276':'#b7c9c6',1.5);
 }
 if(opts.hit){c.globalAlpha*=.55;ellipse(c,0,-28,19,30,'#fff8db');}c.restore();
}

function drawStoneGolem(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0;
  const ink='#263d41',stone='#8c9484',stoneLight='#b7b8a2',stoneDark='#636f66',moss='#71885a',moss2='#93a96d',rune='#70d8ff';
  const team=TEAM_COLORS[opts.owner||0],back=!!opts.back;
  const bob=(moving?Math.sin(walk)*1.25:Math.sin(t*1.5)*.35);
  c.save();c.translate(0,bob);
  // Heavy legs: short steps, broad feet and visible knee blocks.
  for(const side of [-1,1]){
    const step=Math.sin(walk+(side>0?Math.PI:0))*(moving?.16:0);
    c.save();c.translate(side*15,-7);c.rotate(step);
    path(c,[[-10,-6],[8,-8],[12,6],[7,17],[-11,16],[-14,5]],stoneDark,ink,1.6);
    rr(c,-14,12,29,11,4,'#525d58',ink);line(c,-8,16,10,16,'#9aa18f',1);c.restore();
  }
  // Back shoulder/torso mass first.
  path(c,[[-29,-50],[-19,-67],[0,-73],[20,-66],[31,-48],[27,-15],[10,-3],[-10,-3],[-29,-16]],stone,ink,2);
  path(c,[[-22,-54],[-7,-69],[9,-68],[24,-50],[15,-43],[-14,-43]],stoneLight,null);
  path(c,[[-31,-46],[-22,-63],[-12,-58],[-18,-40]],moss,ink,1);
  path(c,[[9,-67],[25,-59],[30,-44],[16,-48]],moss2,ink,1);
  // Team pennant/strap keeps side identity clear without changing the character palette.
  rr(c,-5,-64,10,39,3,team,ink);line(c,0,-60,0,-30,'#ead79c',1.4);
  // Arms are oversized; attack throws the leading fist forward.
  const thrust=attack?Math.sin((1-attack/.35)*Math.PI):0;
  for(const side of [-1,1]){
    c.save();c.translate(side*29,-48);c.rotate(side*(.14+Math.sin(walk)*.04)+(side>0?-.28:0)*thrust);
    path(c,[[-9,-5],[8,-8],[14,7],[11,25],[-8,27],[-15,10]],side>0?stoneLight:stone,ink,1.7);
    path(c,[[-11,3],[-4,-5],[3,-3],[-1,10]],moss,null);
    c.translate(side>0?2*thrust:0,22+10*thrust);
    path(c,[[-12,-5],[9,-8],[16,2],[11,14],[-11,15],[-17,4]],'#69736c',ink,1.8);
    for(const x of [-8,0,8])line(c,x,7,x+2,12,'#a6aa99',1.4);
    c.restore();
  }
  // Head block and identity details.
  if(back){
    rr(c,-17,-84,34,27,7,'#777f74',ink);rr(c,-12,-80,24,9,3,'#626d66');
    path(c,[[-11,-76],[-2,-84],[10,-80],[14,-69],[-4,-67]],moss,ink,1);
    // Large rear rune: visible when the player's unit walks away from camera.
    c.strokeStyle=rune;c.lineWidth=2.7;c.beginPath();c.arc(0,-41,9,.2,Math.PI*1.8);c.stroke();
    line(c,6,-45,12,-40,rune,2);ellipse(c,0,-41,2.6,2.6,'#baf3ff');
    // Small stone banner mount.
    rr(c,-11,-92,22,10,3,'#5d665f',ink);rr(c,-7,-99,14,8,2,'#899184',ink);
  }else{
    rr(c,-18,-85,36,29,8,'#92988b',ink);path(c,[[-18,-79],[0,-91],[18,-79],[13,-62],[-13,-62]],stoneLight,ink,1.4);
    rr(c,-14,-77,28,11,3,'#44555a',ink);
    ellipse(c,-7,-72,3.5,3.2,rune);ellipse(c,7,-72,3.5,3.2,rune);
    if(opts.hit){ellipse(c,-7,-72,6,5,'#d8fbff');ellipse(c,7,-72,6,5,'#d8fbff');}
    path(c,[[-8,-58],[0,-53],[8,-58],[5,-48],[-5,-48]],stoneDark,ink,1);
    // Shoulder rune references the concept art while remaining readable at game scale.
    c.strokeStyle=rune;c.lineWidth=2.2;c.beginPath();c.arc(18,-51,7,.2,Math.PI*1.8);c.stroke();line(c,22,-55,27,-52,rune,1.7);
  }
  // Moss drapes make the silhouette organic and distinct from the metal knight.
  path(c,[[-24,-43],[-18,-35],[-21,-27],[-12,-31],[-8,-19],[-2,-31],[-5,-47]],moss2,null);
  path(c,[[13,-63],[23,-55],[20,-45],[29,-39],[18,-34],[13,-42]],moss,null);
  if(opts.hit){c.globalAlpha*=.38;ellipse(c,0,-43,34,42,'#fff5c9');}
  c.restore();
}

export function visualFacing(u,seat=0){
 const world=u.facing??((u.face??(u.owner===0?-1:1))<0?-Math.PI/2:Math.PI/2);
 const angle=world+(seat===1?Math.PI:0),face=(u.face??(u.owner===0?-1:1))*(seat===1?-1:1);
 return {angle,back:face<0,mirror:Math.abs(Math.cos(angle))>.75&&Math.cos(angle)<0};
}
export function renderOrder(g,seat=0){
 const all=[...g.towers.map(t=>({entity:t,tower:true})),...g.units.map(u=>({entity:u,tower:false}))];
 return all.sort((a,b)=>((a.entity.air?2000:0)+orient(a.entity,seat).y)-((b.entity.air?2000:0)+orient(b.entity,seat).y)||String(a.entity.id).localeCompare(String(b.entity.id)));
}

export function drawUnit(c,type,x,y,scale=1,opts={}){
  const d=UNITS[type],t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,team=TEAM_COLORS[opts.owner||0];
  const ink='#233945',skin='#f0c7a2',dark='#233e42';
  const moving=opts.moving??walk!==0,bob=Math.sin(walk)*1.5+(opts.idle?Math.sin(t*2)*.65:0);
  c.save();c.translate(x,y);c.scale(scale,scale);
  if(opts.alpha!=null)c.globalAlpha=opts.alpha;
  if(!opts.noShadow)ellipse(c,0,5,type==='golem'?32:type==='knight'?23:18,type==='golem'?9:6,'#172f3435');
  if(opts.mirror)c.scale(-1,1);
  if(type==='golem'){drawStoneGolem(c,opts);c.restore();return;}
  if(opts.back&&type!=='bat'&&type!=='cannon'){drawBackHumanoid(c,type,opts);c.restore();return;}
  if(type==='bat'){
    const flap=Math.sin(t*13+walk)*.55;
    c.translate(0,-20+Math.sin(t*5)*2);
    for(const side of [-1,1]){
      c.save();c.scale(side,1);c.rotate(flap);
      path(c,[[3,0],[18,-19],[30,-21],[26,-6],[32,6],[20,0],[17,11],[11,6],[5,11]],'#755f97',ink,1.4);
      path(c,[[6,1],[20,-11],[18,3]],'#b49fdb');c.restore();
    }
    ellipse(c,0,0,8,13,'#3c3559');path(c,[[-7,-6],[-6,-22],[0,-11],[6,-22],[8,-7]],'#544565',ink,1);
    if(opts.back){line(c,0,-8,0,10,'#8b77ab',2);path(c,[[-3,11],[0,18],[3,11]],'#675182');rr(c,-5,3,10,4,1,team);}
    else {ellipse(c,-3,-7,2,2,'#fcdb87');ellipse(c,3,-7,2,2,'#fcdb87');path(c,[[-2,1],[0,5],[2,1]],'#fff4df');rr(c,-5,3,10,4,1,team);}
    c.restore();return;
  }
  if(type==='cannon'){
    ellipse(c,0,2,25,12,'#1c383f');ellipse(c,0,-1,22,10,'#a2b3ab');
    for(const side of [-1,1]){rr(c,side*18-5,-8,10,20,4,'#354c50','#142c33');line(c,side*18-3,-4,side*18+3,-4,'#6d8584',2);}
    path(c,[[-15,-10],[0,-17],[16,-10],[16,0],[0,8],[-15,0]],team,ink,2);
    ellipse(c,0,-12,17,9,'#426268');ellipse(c,0,-14,13,7,'#839793');
    c.save();c.translate(0,-15);c.rotate((opts.facing??(-Math.PI/2-.38))+Math.PI/2);c.translate(0,attack?4*Math.sin((1-attack/.35)*Math.PI):0);
    rr(c,-9,-33,18,34,5,'#335259','#183238');rr(c,-8,-33,16,7,3,'#a3b6ab');
    ellipse(c,0,-33,7,4,ink);line(c,-4,-23,-4,-7,'#81a09b',2);
    if(attack){ellipse(c,0,-39,9+Math.sin(t*40)*3,12,'#ffe6a1');}
    c.restore();ellipse(c,0,-8,4,3,'#ebc56d');c.restore();return;
  }
  c.translate(0,bob);
  const heavy=type==='knight',w=heavy?19:13,body=type==='mage'?'#60527d':type==='archer'?'#526c44':type==='bomber'?'#7c5742':heavy?'#879ca2':'#42676b';
  // Legs share the same pendulum rig across six humanoids.
  for(const s of [-1,1]){
    c.save();c.translate(s*(heavy?8:6),-11);c.rotate(Math.sin(walk+(s>0?Math.PI:0))*(moving?.36:0));
    limb(c,0,0,0,13,heavy?'#637d88':'#45504c',heavy?9:7);rr(c,-5,9,heavy?12:10,6,2,ink);c.restore();
  }
  if(type==='mage')path(c,[[-12,-29],[13,-29],[20,2],[0,-3],[-20,2]],'#564875',ink,1);
  if(type==='archer')path(c,[[-13,-32],[7,-37],[20,-7],[7,0],[-16,-5]],'#43624c');
  rr(c,-w,-39,w*2,29,heavy?7:6,body,ink);
  rr(c,-w,-36,w*2,8,3,team);
  if(heavy){rr(c,-15,-26,30,13,3,'#b1c1bd');line(c,0,-24,0,-16,'#617d81',2);}
  else{line(c,-10,-30,8,-16,'#b09963',4);rr(c,-w,-15,w*2,5,1,'#463e33');rr(c,-3,-16,6,6,1,'#eec477');}
  const swing=attack?Math.sin((1-attack/.35)*Math.PI)*1.7:Math.sin(walk)*.18;
  // Left shoulder: shield, bow, a carried bomb or cloth sleeve.
  c.save();c.translate(-w-2,-32);c.rotate(-.12-Math.sin(walk)*.12);
  line(c,0,0,-3,14,body,heavy?12:8);ellipse(c,-3,15,4,4,skin);
  if(type==='knight'||type==='blade'){c.translate(-5,12);shield(c,heavy?'#49646a':team);}
  if(type==='archer'){
    c.translate(-7,4);c.strokeStyle='#c79960';c.lineWidth=3;c.beginPath();c.arc(0,0,20,-Math.PI/2,Math.PI/2);c.stroke();
    line(c,0,-20,0,20,'#eadaba',1);line(c,0,0,24,0,'#eadaba',2);path(c,[[24,-3],[31,0],[24,3]],'#dae4d9');
  }
  if(type==='bomber'){ellipse(c,-7,4,10,11,'#223d49');line(c,-7,-7,-4,-13,'#d6b672',2);ellipse(c,-4,-15,3,3,'#f2b76e');}
  c.restore();
  // Right shoulder and weapon attachment.
  c.save();c.translate(w+1,-32);c.rotate(type==='spear'?-swing*.55:swing-.2);
  line(c,0,0,1,13,body,heavy?12:8);ellipse(c,1,13,4,4,skin);c.translate(1,13);
  if(type==='blade'||type==='knight')sword(c,.3);
  else if(type==='spear'){
    line(c,0,18,0,-43,'#a1744b',3);
    path(c,[[0,-58],[-5,-42],[0,-37],[5,-42]],'#cde2da',ink,1);line(c,-4,-30,4,-30,team,4);
  }else if(type==='mage'){
    line(c,0,16,0,-31,'#aa9270',4);path(c,[[0,-47],[-9,-36],[0,-25],[9,-36]],'#baa2f0','#524572',2);
    ellipse(c,0,-36,4,5,attack?'#fff':'#e8d6ff');
  }else if(type==='bomber'){
    ellipse(c,0,-2,9,10,'#254450');line(c,0,-13,4,-18,'#e8bf77',2);ellipse(c,5,-19,3,3,'#ffd389');
  }
  c.restore();
  // Distinct head silhouettes carry most of the visual identity.
  const hy=-48;
  ellipse(c,0,hy,heavy?13:11,12,skin);
  if(type==='mage'){
    path(c,[[-18,hy-5],[-7,hy-18],[2,hy-37],[12,hy-16],[20,hy-5]],'#6b5a8d',ink,1.6);
    path(c,[[-16,hy-8],[16,hy-8],[18,hy-4],[-18,hy-4]],'#c7ac71');
    path(c,[[-9,hy+7],[0,hy+23],[10,hy+7]],'#e7dbc2');ellipse(c,-3,hy+3,1.4,1.6,ink);ellipse(c,4,hy+3,1.4,1.6,ink);
  }else if(type==='archer'){
    path(c,[[-13,hy+9],[-14,hy-10],[0,hy-22],[14,hy-10],[13,hy+9],[6,hy-6],[-6,hy-6]],'#5d7e54',ink,1.5);
    line(c,8,hy-17,13,hy-29,'#d4c886',3);path(c,[[13,hy-30],[19,hy-31],[16,hy-21]],'#ecd18c');
    ellipse(c,-3,hy+1,1.3,1.8,ink);ellipse(c,4,hy+1,1.3,1.8,ink);
  }else if(heavy){
    rr(c,-15,hy-15,30,27,8,'#a6b9bd',ink);rr(c,-12,hy-5,24,12,3,'#263e4a');
    line(c,-7,hy,-4,hy,'#f6d17c',2);line(c,4,hy,7,hy,'#f6d17c',2);rr(c,-3,hy-15,6,27,1,'#c6d2c9');
    path(c,[[-3,hy-13],[-4,hy-27],[8,hy-28],[13,hy-18]],team,ink,1);
  }else if(type==='bomber'){
    rr(c,-13,hy-15,26,16,7,'#b57c4d',ink);rr(c,-12,hy-2,24,9,3,'#3b4344');
    for(const s of [-1,1]){ellipse(c,s*6,hy+1,5,5,'#ead0a1');ellipse(c,s*6,hy+1,3,3,'#739c9f');}
    line(c,-3,hy+8,3,hy+8,'#884e37',1.5);
  }else{
    rr(c,-12,hy-14,24,15,5,type==='spear'?'#b87856':'#8fa6aa',ink);
    path(c,[[-2,hy-13],[-5,hy-29],[4,hy-26],[9,hy-15]],type==='spear'?'#efb686':team,ink,1);
    line(c,-12,hy,12,hy,'#c5d1bd',3);
    ellipse(c,-4,hy+5,1.5,1.7,ink);ellipse(c,4,hy+5,1.5,1.7,ink);
  }
  if(opts.hit){c.globalAlpha=.65;ellipse(c,0,-28,19,30,'#fff8db');}
  c.restore();
}
function tree(c,x,y,s=1){
  c.save();c.translate(x,y);c.scale(s,s);ellipse(c,3,8,17,6,'#263f4430');rr(c,-3,-3,6,15,2,'#947e57');
  path(c,[[0,-39],[-18,-3],[18,-3]],'#487864');path(c,[[0,-52],[-14,-19],[14,-19]],'#598970');
  path(c,[[0,-50],[0,-18],[13,-19]],'#6b9779');c.restore();
}
function stone(c,x,y,s=1){path(c,[[x-10*s,y],[x-5*s,y-8*s],[x+7*s,y-9*s],[x+13*s,y],[x+4*s,y+6*s]],'#9dab91','#6c806b',1);}
let terrainCache=null;
function makeTerrain(){
  const c=document.createElement('canvas');c.width=720;c.height=1040;const q=c.getContext('2d');
  // Floating island plinth and inset playing lawn.
  q.fillStyle='#172b35';q.fillRect(0,0,720,1040);
  rr(q,13,15,694,1014,38,'#7e876d');rr(q,20,10,680,1014,32,'#b7bd95');
  rr(q,32,19,656,996,24,'#738e73');rr(q,43,28,634,977,22,'#8ca27d');
  for(let r=0;r<17;r++)for(let k=0;k<11;k++){q.fillStyle=(r+k)%2?'#92a780':'#8da37c';q.fillRect(43+k*57.6,28+r*57.45,57.7,57.55);}
  // Two warm stone paths and subtle deployment stripes.
  for(const x of [190,530]){
    rr(q,x-44,101,88,838,9,'#b4b791');
    for(let y=115;y<940;y+=32){
      rr(q,x-37+(Math.floor(y/32)%2?4:0),y,34,26,3,'#bfc19d');
      rr(q,x+2,y,32,26,3,'#b8bd96');
    }
  }
  for(const owner of [0,1]){
    const y=owner===0?862:82;
    rr(q,285,y,150,95,18,owner===0?'#76a395':'#b4957c');
    q.strokeStyle=owner===0?'#bad3b0':'#dec4a2';q.lineWidth=2;q.strokeRect(301,y+15,118,62);
  }
  // River: banks, turquoise current, stepping bridges.
  q.fillStyle='#46676a';q.fillRect(35,472,650,96);q.fillStyle='#66989a';q.fillRect(32,483,656,75);
  q.fillStyle='#77a9a4';q.fillRect(32,493,656,8);q.fillStyle='#56878e';q.fillRect(32,543,656,11);
  for(let x=45;x<670;x+=48){line(q,x,515,x+22,515,'#acd0bb88',2);line(q,x+15,536,x+32,536,'#acd0bb70',2);}
  for(const x of [190,530]){
    rr(q,x-48,470,96,103,5,'#665e47');rr(q,x-42,465,84,104,3,'#ccb58a');
    for(let y=469;y<565;y+=14){rr(q,x-41,y,82,11,2,'#d6c19a');line(q,x-30,y+4,x+20,y+4,'#b7a07a',1);}
    for(const s of [-1,1]){
      rr(q,x+s*48-5,461,10,116,3,'#9a855d');rr(q,x+s*48-6,459,12,14,2,'#e6cca0');rr(q,x+s*48-6,564,12,14,2,'#e6cca0');
    }
  }
  // Original scenery and hand-stippled lawn.
  let seed=46;function r(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
  for(let i=0;i<180;i++){
    const x=50+r()*620,y=40+r()*956;
    if(y>455&&y<585||Math.abs(x-190)<48||Math.abs(x-530)<48)continue;
    q.globalAlpha=.4;line(q,x,y,x+2,y-3,'#d0d6a0',1);line(q,x+3,y,x+5,y-5,'#496d55',1);q.globalAlpha=1;
  }
  for(const [x,y,s] of [[70,130,1.1],[650,910,1.1],[62,395,.9],[660,375,.85],[58,695,.9],[658,720,1],[290,340,.55],[412,694,.55]])tree(q,x,y,s);
  for(const [x,y] of [[320,412],[396,623],[64,872],[655,160],[54,593]])stone(q,x,y,.8);
  for(const [x,y] of [[69,188],[650,858],[357,329],[362,737]]){
    ellipse(q,x,y,7,3,'#66866a');ellipse(q,x-3,y-3,2.8,2.8,'#efd5a0');ellipse(q,x+3,y-2,2,2,'#f3e3b5');
  }
  // Decked observation plaques.
  q.font='600 10px sans-serif';q.textAlign='center';q.fillStyle='#d1d5b8';q.fillText('THE CROSSING',360,530);
  return c;
}
function drawTower(c,t,seat,time){
  const pos=orient(t,seat),owner=t.owner===seat?0:1,col=TEAM_COLORS[owner],core=t.kind==='core';
  const x=pos.x,y=pos.y,size=core?1.25:1;
  c.save();c.translate(x,y);c.scale(size,size);
  if(t.hp<=0){
    ellipse(c,0,9,37,13,'#273c3c55');
    for(const p of [[-20,5],[8,12],[-5,-6],[23,1]])stone(c,p[0],p[1],.8);
    rr(c,-4,-9,8,13,1,'#52615a');c.restore();return;
  }
  ellipse(c,4,13,40,13,'#203a3955');
  path(c,[[-33,-4],[0,10],[33,-4],[33,15],[0,30],[-33,15]],'#55666a','#35494e',1.5);
  path(c,[[-33,-4],[0,-20],[33,-4],[0,11]],'#bbc2aa','#667572',1.5);
  path(c,[[-26,-37],[26,-37],[26,6],[0,19],[-26,6]],'#8ca09b','#3b5459',2);
  path(c,[[0,-37],[26,-37],[26,6],[0,19]],'#6b8382');
  for(let sy=-27;sy<6;sy+=12)line(c,-25,sy,25,sy,'#b8c5ad50',1.2);
  rr(c,-11,-25,22,26,3,'#28444e');path(c,[[-8,-22],[8,-22],[8,-7],[0,0],[-8,-7]],col);
  line(c,0,-20,0,-7,'#f4d68e',2);line(c,-5,-14,5,-14,'#f4d68e',2);
  path(c,[[-31,-39],[0,-51],[31,-39],[0,-24]],'#cad0b5','#496168',2);
  for(const sx of [-25,-10,7,22])rr(c,sx-5,-48,10,15,2,'#b8c9b8','#617b7b');
  if(core){
    path(c,[[0,-82],[-17,-64],[0,-44],[17,-64]],col,'#f1d79a',2);
    path(c,[[0,-82],[0,-44],[17,-64]],owner===0?'#a3d9bd':'#f2c4a2');
    line(c,24,-78,24,-40,'#654f3b',2);path(c,[[25,-78],[49+Math.sin(time*3)*2,-74],[42,-61],[25,-66]],col);
  }else{
    c.save();c.translate(0,-44);c.rotate((t.facing??(t.owner===0?-Math.PI/2:Math.PI/2))+(seat===1?Math.PI:0)+Math.PI/2);
    rr(c,-7,-22,14,24,3,'#364f56','#243d44');ellipse(c,0,-22,7,4,'#acc1b3');ellipse(c,0,-22,4,2,'#233b43');c.restore();
  }
  if(t.hit){c.globalAlpha=.32;ellipse(c,0,-26,34,36,'#fff7cd');c.globalAlpha=1;}
  // Health bars stay legible after arena flip.
  rr(c,-33,-96,66,7,3,'#253d4566');rr(c,-32,-95,64*clamp(t.hp/t.maxHp,0,1),5,2,col);
  c.font='bold 10px sans-serif';c.fillStyle='#f6eed9';c.textAlign='center';c.fillText(String(Math.ceil(t.hp)),0,-101);
  c.restore();
}
export function orient(p,seat){return seat===1?{x:720-p.x,y:1040-p.y}:{x:p.x,y:p.y};}
export function drawArena(canvas,snapshot,options={}){
  const c=canvas.getContext('2d'),seat=options.seat||0,time=options.time||0;
  if(!terrainCache)terrainCache=makeTerrain();
  c.clearRect(0,0,canvas.width,canvas.height);
  c.save();c.scale(canvas.width/720,canvas.height/1040);c.drawImage(terrainCache,0,0);
  const g=snapshot;if(!g){c.restore();return;}
  if(options.selected&&g.phase==='battle'){
    c.fillStyle='#4abdaf18';c.fillRect(46,600,628,382);
    c.setLineDash([9,10]);line(c,46,600,674,600,'#d3eed788',2);c.setLineDash([]);
    c.fillStyle='#e3f2d5';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('ここに配置',360,628);
  }
  const markerUnits=[];
  for(const item of renderOrder(g,seat)){
    if(item.tower){drawTower(c,item.entity,seat,time);continue;}
    const u=item.entity,p=orient(u,seat),owner=u.owner===seat?0:1,facing=visualFacing(u,seat);
    c.strokeStyle=TEAM_COLORS[owner]+'b0';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y+4,u.radius+4,(u.radius+4)*.34,0,0,TAU);c.stroke();
    drawUnit(c,u.type,p.x,p.y,u.type==='bat'?.93:.95,{time,walk:u.walk,moving:u.moving,owner,anim:u.anim,hit:u.hit,alpha:u.spawn>0?.5:1,back:facing.back,mirror:u.building?false:facing.mirror,facing:facing.angle});
    const hp=u.hp/u.maxHp,w=u.type==='golem'?50:u.type==='knight'?38:28;
    if(hp<.999){rr(c,p.x-w/2,p.y-(u.air?48:82),w,5,2,'#25363eaa');rr(c,p.x-w/2+1,p.y-(u.air?47:81),(w-2)*hp,3,1,TEAM_COLORS[owner]);}
    if(owner===0&&!u.air&&!u.building&&g.towers.some(t=>{const q=orient(t,seat);return t.hp>0&&q.y>p.y&&q.y-p.y<90&&Math.abs(q.x-p.x)<t.radius+8;}))markerUnits.push(p);
  }
  // Position hints remain visible if a tower occludes a friendly sprite.
  for(const p of markerUnits){c.save();c.globalAlpha=.8;path(c,[[p.x,p.y-7],[p.x+4,p.y],[p.x,p.y+7],[p.x-4,p.y]],null,'#dcf5bf',1.5);c.restore();}
  if(options.physics){
    c.save();c.lineWidth=1.5;c.setLineDash([4,3]);
    for(const e of [...g.towers,...g.units])if(e.hp>0){const p=orient(e,seat);c.strokeStyle=e.air?'#e1c3ff':(e.kind||e.building)?'#ffe0a0':'#d6f7df';c.beginPath();c.arc(p.x,p.y,e.radius,0,TAU);c.stroke();}
    c.restore();
  }
  for(const p of g.projectiles){
    const pos=orient(p,seat),target=orient({x:p.tx,y:p.ty},seat),angle=Math.atan2(target.y-pos.y,target.x-pos.x);
    c.save();c.translate(pos.x,pos.y-10);c.rotate(angle);
    if(p.kind==='arrow'){line(c,-10,0,7,0,'#f2dfb8',2);path(c,[[6,-3],[13,0],[6,3]],'#edf5df');}
    else if(p.kind==='bomb'){ellipse(c,0,0,8,8,'#2a3941');line(c,0,-7,4,-11,'#fbd078',2);}
    else{ellipse(c,0,0,p.kind==='orb'?8:5,p.kind==='orb'?8:5,p.kind==='orb'?'#c8b0f1':'#f9d494');ellipse(c,-4,0,3,3,'#fff3ca');}
    c.restore();
  }
  for(const e of g.events){
    const p=orient(e,seat),fade=clamp(e.life/(e.type==='death'?.9:.5),0,1);c.save();c.globalAlpha=fade;
    if(e.type==='spawn'){
      c.strokeStyle=TEAM_COLORS[e.owner===seat?0:1];c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,30*(1-fade)+15,10*(1-fade)+5,0,0,TAU);c.stroke();
    }else if(e.type==='slash'){
      c.strokeStyle='#fff1c0';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y-18,20+(1-fade)*13,-2.5,-.3);c.stroke();
    }else if(e.type==='death'||e.type==='blast'){
      for(let i=0;i<8;i++){
        const a=i*TAU/8+e.id,len=(1-fade)*(e.type==='blast'?e.radius:35);
        ellipse(c,p.x+Math.cos(a)*len,p.y-12+Math.sin(a)*len*.7,4+fade*9,4+fade*8,e.type==='blast'?'#f2cf8c':'#ece2c6');
      }
    }
    c.restore();
  }
  const ghost=options.ghost;
  if(options.selected&&ghost&&g.phase==='battle'){
    c.globalAlpha=.35;ellipse(c,ghost.x,ghost.y,UNITS[options.selected].radius+10,10,ghost.valid?'#d9f3bb':'#fa9b80');c.globalAlpha=1;
    drawUnit(c,options.selected,ghost.x,ghost.y,.9,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2});
    c.strokeStyle=ghost.valid?'#eaf9c8':'#ff987f';c.lineWidth=2;c.beginPath();c.arc(ghost.x,ghost.y,28,0,TAU);c.stroke();
  }
  // Foreground rim.
  c.strokeStyle='#d6d6ad55';c.lineWidth=2;c.beginPath();c.roundRect(22,14,676,1008,30);c.stroke();
  c.restore();
}
export function drawPortrait(canvas,type,time=0,owner=0,selected=false,back=false){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  c.clearRect(0,0,w,h);c.save();c.scale(w/120,h/120);
  const col=UNITS[type].color;
  const g=c.createRadialGradient(60,48,10,60,64,70);g.addColorStop(0,col+'99');g.addColorStop(1,col+'00');
  c.fillStyle=g;c.fillRect(0,0,120,120);
  ellipse(c,60,105,40,8,'#1f39451b');
  const scale=type==='golem'?.92:type==='bat'?1.6:type==='cannon'?1.5:type==='mage'?1.12:1.32;
  drawUnit(c,type,60,type==='golem'?112:type==='bat'?83:type==='cannon'?(back?94:80):104,scale,{time,owner,idle:true,noShadow:true,anim:0,back,facing:back?-Math.PI/2:Math.PI/2});
  c.restore();
}
