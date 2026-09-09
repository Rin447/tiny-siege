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


function drawIronBoar(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#263b40',fur='#765744',fur2='#9a7156',iron='#6f7e7d',iron2='#aab6ae',red='#b86655',tusk='#ead8ae',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk*1.2)*1.6:Math.sin(t*2)*.45),kick=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Four short legs, intentionally squat so the silhouette reads as a charging boar at game size.
  for(const side of [-1,1])for(const front of [-1,1]){
    const phase=walk+(side*front>0?Math.PI:0),x=side*(front>0?16:13),y=front>0?-4:0;
    c.save();c.translate(x,y);c.rotate(Math.sin(phase)*(moving?.18:0));
    rr(c,-5,0,10,18,4,'#4f4740',ink);rr(c,-6,14,12,7,3,'#343b3a',ink);c.restore();
  }
  ellipse(c,0,-18,31,23,fur);path(c,[[-28,-20],[-17,-39],[12,-42],[30,-24],[25,-5],[-22,-4]],fur2,ink,2);
  // Armoured spine and side plates.
  path(c,[[-18,-39],[-5,-52],[13,-47],[23,-34],[13,-26],[-13,-28]],iron,ink,1.8);
  rr(c,-14,-40,28,9,3,team,ink);for(const x of [-9,0,9])ellipse(c,x,-36,1.8,1.8,'#e2cb91');
  if(back){
    path(c,[[-24,-22],[-10,-34],[12,-33],[27,-18],[21,-5],[-19,-5]],fur,ink,1.5);
    path(c,[[-14,-38],[0,-48],[15,-38],[12,-24],[-12,-24]],iron2,ink,1.5);
    rr(c,-10,-33,20,7,2,team);path(c,[[-5,-7],[0,2],[5,-7]],'#4b3b33',ink,1);
    for(const side of [-1,1])path(c,[[side*17,-23],[side*29,-32],[side*24,-15]],iron,ink,1.3);
  }else{
    // Head plate lowers during the impact frame.
    c.save();c.translate(0,kick*5);
    path(c,[[-25,-29],[-12,-48],[12,-48],[26,-29],[18,-10],[-18,-10]],iron2,ink,2);
    path(c,[[-18,-42],[0,-52],[18,-42],[12,-31],[-12,-31]],iron,ink,1.4);
    rr(c,-17,-31,34,12,4,'#423d3a',ink);ellipse(c,-7,-25,2.7,2.4,'#f09a66');ellipse(c,7,-25,2.7,2.4,'#f09a66');
    path(c,[[-18,-17],[-31,-8],[-22,-25]],tusk,ink,1.1);path(c,[[18,-17],[31,-8],[22,-25]],tusk,ink,1.1);
    ellipse(c,0,-14,8,5,'#4a3530');ellipse(c,-3,-15,1.2,1.2,'#171f20');ellipse(c,3,-15,1.2,1.2,'#171f20');c.restore();
  }
  if(opts.charged){c.save();c.globalAlpha=.75+.2*Math.sin(t*8);c.strokeStyle='#ffd36c';c.lineWidth=2.5;c.beginPath();c.arc(0,-23,35,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-22,30,31,'#fff1c2');}
  c.restore();
}

function drawTigger(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#26383a',fur='#a96f48',fur2='#d59a63',leather='#6f5946',metal='#7f9992',lamp='#f7db78',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk*1.15)*1.4:Math.sin(t*2.4)*.4),sw=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*7,-6);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.42:0));rr(c,-5,0,10,15,4,leather,ink);rr(c,-6,11,12,6,3,'#3b403a',ink);c.restore();}
  // compact digging rig and backpack
  rr(c,-15,-34,30,27,10,fur,ink);rr(c,-14,-31,28,7,3,team);
  if(back){rr(c,-12,-31,24,20,6,'#705844',ink);rr(c,-7,-26,14,12,4,'#96704c',ink);line(c,-9,-26,9,-13,'#baa06f',2);}
  else {path(c,[[-14,-34],[-6,-47],[7,-47],[15,-34],[12,-17],[-12,-17]],fur2,ink,1.5);ellipse(c,-5,-31,2.2,2.2,'#1d2928');ellipse(c,5,-31,2.2,2.2,'#1d2928');ellipse(c,0,-23,5,3,'#5b3d31');}
  // miner helmet and head lamp
  path(c,[[-14,-42],[-9,-55],[0,-61],[10,-55],[15,-42]],metal,ink,1.7);rr(c,-16,-44,32,6,3,'#536c69',ink);ellipse(c,0,-51,5,5,lamp);ellipse(c,0,-51,2,2,'#fff6c6');
  // shovel/claw arms; swing downward on attack
  for(const side of [-1,1]){c.save();c.translate(side*14,-29);c.rotate(side*(.35+sw*.55));line(c,0,0,side*3,14,fur2,8);ellipse(c,side*3,14,4,4,fur2);c.translate(side*5,15);c.rotate(side*.4);path(c,[[-2,-1],[8,-8],[12,-5],[5,3],[10,8],[6,11],[-2,4]],'#9fb0a5',ink,1.2);c.restore();}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-28,23,30,'#fff2c0');}
  c.restore();
}

function drawMudDragon(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#283735',mud='#7e684d',mud2='#a18a67',belly='#b9aa7d',wing='#596b58',horn='#d9cf9c';
  const flap=Math.sin(t*6+walk)*.32,bob=Math.sin(t*3)*1.6,blast=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,-18+bob);
  // broad wings make the air silhouette distinct from the harpy
  for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(flap);path(c,[[5,-28],[25,-47],[40,-42],[31,-25],[43,-12],[25,-15],[18,1],[8,-8]],wing,ink,1.5);path(c,[[11,-28],[27,-38],[20,-19]],'#819076',null);c.restore();}
  ellipse(c,0,-22,20,29,mud);path(c,[[-14,-29],[-8,-48],[0,-56],[9,-48],[15,-29],[10,1],[0,10],[-10,1]],mud2,ink,1.7);ellipse(c,0,-6,10,15,belly);
  if(back){for(const y of [-42,-32,-22,-12])path(c,[[-4,y],[0,y-6],[4,y]],'#536253',ink,.7);path(c,[[-6,5],[0,23],[6,5]],mud,ink,1.2);}
  else {
    path(c,[[-11,-47],[-5,-61],[0,-52],[6,-61],[12,-46]],mud2,ink,1.2);path(c,[[-10,-49],[-18,-58],[-15,-44]],horn,ink,1);path(c,[[10,-49],[18,-58],[15,-44]],horn,ink,1);
    ellipse(c,-5,-43,2.2,2.2,'#e8d76f');ellipse(c,5,-43,2.2,2.2,'#e8d76f');
    if(blast){c.save();c.globalAlpha=.8;ellipse(c,0,-33-blast*7,8+blast*5,5+blast*3,'#8f7a4f');ellipse(c,0,-35-blast*10,4+blast*3,3+blast*2,'#c2b27b');c.restore();}
  }
  rr(c,-12,-24,24,6,3,team,ink);if(opts.hit){c.globalAlpha*=.4;ellipse(c,0,-24,25,34,'#fff0ba');}c.restore();
}

function drawBlowdartGoblin(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#263738',skin='#77a953',skin2='#a8cf70',cloth='#4c5f43',wood='#b78c5e',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk)*1.2:Math.sin(t*2.8)*.35),shoot=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*5,-5);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.48:0));line(c,0,0,0,13,skin,6);rr(c,-4,10,9,5,2,ink);c.restore();}
  rr(c,-11,-34,22,28,6,cloth,ink);rr(c,-11,-31,22,5,2,team);rr(c,-9,-15,18,5,2,'#775c3e',ink);
  path(c,[[-12,-39],[-8,-52],[0,-57],[9,-52],[13,-39],[8,-29],[-8,-29]],skin2,ink,1.3);
  path(c,[[-11,-48],[-20,-56],[-17,-41]],skin2,ink,1);path(c,[[11,-48],[20,-56],[17,-41]],skin2,ink,1);
  if(back){rr(c,-9,-47,18,13,4,skin,ink);line(c,-7,-32,7,-12,'#c0a26a',2);path(c,[[-5,-12],[0,-5],[5,-12]],'#41533a',ink,1);}
  else{ellipse(c,-4,-43,2,2,'#f8eea6');ellipse(c,4,-43,2,2,'#f8eea6');path(c,[[-5,-36],[0,-33],[5,-36]],null,ink,1);}
  c.save();c.translate(-9,-30);c.rotate(-.18-shoot*.08);line(c,0,0,6,12,skin,6);ellipse(c,6,12,3,3,skin2);c.restore();
  c.save();c.translate(8,-30);c.rotate(.12-shoot*.15);line(c,0,0,-3,10,skin,6);ellipse(c,-3,10,3,3,skin2);c.translate(-3,9);c.rotate(-.12);
  rr(c,-2,-4,40,5,2,wood,ink);rr(c,31,-3,10,3,1,'#e5d2a1',ink);if(shoot)line(c,42,-1,58,-1,'#f5dfaa',1.5);c.restore();
  rr(c,-14,-52,28,5,2,'#3f553a',ink);path(c,[[-9,-54],[-4,-64],[0,-55],[5,-65],[10,-54]],'#658849',ink,1);
  if(opts.hit){c.globalAlpha*=.48;ellipse(c,0,-31,18,27,'#fff1c4');}c.restore();
}

function drawLaserTower(c,opts={}){
  const t=opts.time||0,attack=opts.anim||0,team=TEAM_COLORS[opts.owner||0],ink='#23363f',stone='#6f7b82',stone2='#9aa4a2',glow='#c9b5ff';
  c.save();ellipse(c,0,4,28,12,'#1d3540');path(c,[[-27,-2],[0,-15],[27,-2],[20,11],[0,19],[-20,11]],stone,ink,2);
  path(c,[[-20,-28],[20,-28],[17,4],[0,12],[-17,4]],stone2,ink,2);rr(c,-18,-24,36,7,3,team,ink);
  for(const x of [-13,13])rr(c,x-5,-35,10,15,3,'#58676c',ink);
  c.save();c.translate(0,-31);c.rotate((opts.facing??-Math.PI/2)+Math.PI/2);path(c,[[-12,-7],[0,-21],[12,-7],[8,7],[-8,7]],'#70649a',ink,1.5);ellipse(c,0,-8,7,11,glow,ink,1.3);ellipse(c,0,-10,3+Math.sin(t*6)*.5,5,'#f3ecff');c.restore();
  if(attack){c.globalAlpha=.35+.25*Math.sin(t*20);ellipse(c,0,-39,18,18,'#c8b4ff66');}
  if(opts.hit){c.globalAlpha*=.4;ellipse(c,0,-17,29,34,'#fff0cf');}c.restore();
}

function drawNightshade(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#1e2932',cloth='#343247',cloth2='#5b5276',accent='#8fe0b5',skin='#c49a82',team=TEAM_COLORS[opts.owner||0];
  const bob=Math.sin(walk)*1.1+(opts.idle?Math.sin(t*2.7)*.45:0),slash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  if(opts.dashWindup){c.save();c.globalAlpha=.7;c.strokeStyle='#9cf0c5';c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();c.ellipse(0,-26,23+Math.sin(t*18)*3,34+Math.sin(t*18)*3,0,0,TAU);c.stroke();c.restore();}
  if(opts.dashing){c.save();c.globalAlpha=.26;for(const dx of [16,28,40]){path(c,[[-12+dx,-55],[7+dx,-55],[14+dx,-9],[-2+dx,0],[-14+dx,-12]],cloth2,null);}c.restore();}
  for(const side of [-1,1]){c.save();c.translate(side*6,-9);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.48:0));line(c,0,0,0,15,'#2e3039',7);rr(c,-5,11,10,6,2,ink);c.restore();}
  // Short split cloak makes the rear silhouette immediately distinct.
  path(c,[[-14,-36],[14,-36],[18,-4],[4,-13],[0,1],[-5,-12],[-18,-4]],back?'#29293b':cloth2,ink,1.4);
  rr(c,-13,-38,26,27,6,cloth,ink);rr(c,-13,-35,26,6,2,team);
  // crossed straps / back emblem
  if(back){line(c,-9,-31,9,-14,'#746f76',3);line(c,9,-31,-9,-14,'#5d5964',2);path(c,[[-5,-28],[0,-34],[5,-28],[0,-22]],accent,ink,1);}
  const swing=.18*Math.sin(walk)+slash*1.6;
  for(const side of [-1,1]){
    c.save();c.translate(side*14,-32);c.rotate(side*(.18+swing));line(c,0,0,side*2,14,cloth2,7);ellipse(c,side*2,14,3.5,3.5,skin);c.translate(side*2,14);
    c.rotate(side*(back?-.2:.3));path(c,[[-2,2],[-2,-23],[0,-31],[3,-23],[2,2]],'#b7d2cc',ink,1);rr(c,-6,1,12,3,1,accent);c.restore();
  }
  // hood and mask
  path(c,[[-14,-49],[-8,-65],[0,-72],[9,-65],[14,-49],[9,-39],[-9,-39]],back?'#28283a':cloth2,ink,1.6);
  if(back){line(c,0,-65,0,-43,'#5c5674',1.5);path(c,[[-5,-45],[0,-39],[5,-45]],accent,null);}
  else{rr(c,-11,-53,22,12,4,'#252d35',ink);ellipse(c,-4,-48,1.8,1.8,accent);ellipse(c,4,-48,1.8,1.8,accent);path(c,[[-8,-41],[0,-37],[8,-41],[5,-31],[-5,-31]],'#292838',ink,1);}
  if(opts.invulnerable){c.save();c.globalAlpha=.75;c.strokeStyle='#bdf8dc';c.lineWidth=2;c.beginPath();c.ellipse(0,-31,21,31,0,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-31,19,28,'#eee5ff');}c.restore();
}

function drawMossling(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#2c443a',body='#72915a',body2='#9cb96e',leaf='#496f4d',flower='#f2d39a',team=TEAM_COLORS[opts.owner||0];
  const hop=(moving?Math.abs(Math.sin(walk*1.4))*3:Math.sin(t*3)*.45),jab=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,-hop);
  for(const side of [-1,1]){line(c,side*4,-4,side*6,8,ink,4);ellipse(c,side*7,9,5,3,'#465b43');}
  ellipse(c,0,-13,12,14,body);path(c,[[-10,-20],[-17,-30],[-5,-27],[0,-38],[6,-27],[17,-31],[11,-19]],leaf,ink,1.2);
  rr(c,-10,-16,20,6,3,team);
  for(const side of [-1,1]){c.save();c.translate(side*11,-14);c.rotate(side*(.3+jab*.7));line(c,0,0,side*8,8,body2,5);ellipse(c,side*8,8,3,3,leaf);c.restore();}
  if(back){path(c,[[-8,-19],[0,-25],[8,-19],[6,-8],[0,-4],[-6,-8]],'#5c7d50',ink,1);line(c,0,-25,0,-5,'#b1cb7b',1.3);}
  else{ellipse(c,-4,-16,2,2,'#fff0b0');ellipse(c,4,-16,2,2,'#fff0b0');path(c,[[-4,-9],[0,-6],[4,-9]],null,ink,1.2);ellipse(c,8,-28,2.5,2.5,flower);}
  if(opts.hit){c.globalAlpha*=.55;ellipse(c,0,-14,13,17,'#f7f1c1');}c.restore();
}


function drawBoneSwarm(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#344047',bone='#e4ddc4',bone2='#b9b39e',dark='#61675f',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk*1.4)*1.3:Math.sin(t*3)*.4),stab=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Thin articulated legs and pelvis make this read as a fragile bone construct, not a tiny humanoid skin.
  for(const side of [-1,1]){c.save();c.translate(side*5,-5);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.45:0));line(c,0,0,side,12,bone2,3);rr(c,side>0?-1:-6,9,7,4,2,dark,ink);c.restore();}
  path(c,[[-9,-22],[0,-27],[9,-22],[7,-11],[0,-7],[-7,-11]],bone2,ink,1.2);
  line(c,0,-22,0,-38,bone,4);
  for(const y of [-19,-15,-11]){line(c,-7,y,7,y,bone,2.5);line(c,-7,y,-10,y+3,bone2,1.5);line(c,7,y,10,y+3,bone2,1.5);}
  rr(c,-8,-30,16,5,2,team,ink);
  // Tiny chipped blade. Its short reach and low HP keep the swarm clearly disposable.
  c.save();c.translate(10,-28);c.rotate(-.35-stab*.8);line(c,0,0,2,13,bone2,3);line(c,2,13,3,-7,'#9b9f91',2.5);path(c,[[3,-13],[-1,-5],[4,-6],[7,-4]],bone,ink,.8);c.restore();
  c.save();c.translate(-9,-27);c.rotate(.2+stab*.3);line(c,0,0,-2,11,bone2,3);c.restore();
  if(back){
    ellipse(c,0,-46,10,9,bone2);rr(c,-8,-52,16,13,4,bone2,ink);line(c,0,-49,0,-39,dark,1.5);path(c,[[-5,-54],[0,-60],[5,-54]],team,ink,.8);
  }else{
    rr(c,-10,-55,20,18,6,bone,ink);ellipse(c,-4,-48,2.2,2.8,ink);ellipse(c,4,-48,2.2,2.8,ink);path(c,[[-4,-41],[0,-38],[4,-41]],null,dark,1.3);line(c,-7,-55,-2,-59,bone2,1.5);
  }
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-30,14,28,'#fff9df');}c.restore();
}

function drawKraggBerserker(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#26383a',skin='#b8876d',armor='#6d6964',armor2='#9a9184',leather='#704738',cloth='#9f4e42',stone='#5b5c57',edge='#c2b59d',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk*.8)*1.1:Math.sin(t*1.4)*.25),smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Broad heavy gait and reinforced boots.
  for(const side of [-1,1]){
    const step=Math.sin(walk+(side>0?Math.PI:0))*(moving?.16:0);
    c.save();c.translate(side*10,-8);c.rotate(step);
    rr(c,-7,0,14,18,5,leather,ink);rr(c,-9,14,18,8,3,stone,ink);line(c,-6,17,6,17,edge,1.4);c.restore();
  }
  // Torso, layered plates and team sash.
  path(c,[[-25,-47],[-17,-61],[0,-66],[18,-60],[26,-46],[23,-10],[10,-3],[-10,-3],[-24,-11]],armor,ink,2);
  path(c,[[-20,-49],[-11,-59],[10,-58],[21,-47],[13,-38],[-14,-38]],armor2,ink,1.2);
  rr(c,-22,-42,44,8,3,team,ink);
  if(back){
    line(c,-16,-38,15,-12,'#9a6a50',5);line(c,15,-38,-14,-12,'#5e4033',3);
    path(c,[[-12,-31],[0,-38],[12,-31],[9,-17],[0,-11],[-9,-17]],'#7c7770',ink,1.2);
  }else{
    path(c,[[-11,-34],[0,-40],[11,-34],[8,-20],[0,-15],[-8,-20]],cloth,ink,1.3);
    for(const x of [-13,13])ellipse(c,x,-43,2,2,'#dac89c');
  }
  // Huge two-handed stone hammer. It rises and drops during the attack frame.
  const hammerA=-.35-smash*1.15;
  c.save();c.translate(16,-34);c.rotate(hammerA);
  line(c,0,0,3,37,'#76513b',6);
  c.save();c.translate(3,37);
  rr(c,-15,-7,30,15,4,stone,ink);rr(c,-11,-11,22,5,2,armor2,ink);line(c,-9,4,9,4,edge,1.5);
  c.restore();c.restore();
  // Left arm braces the hammer shaft; right shoulder is oversized.
  c.save();c.translate(-20,-38);c.rotate(.25+smash*.35);line(c,0,0,-1,19,armor2,13);ellipse(c,-1,18,5,5,skin);c.restore();
  c.save();c.translate(21,-40);c.rotate(-.16-smash*.22);line(c,0,0,1,16,armor2,14);ellipse(c,1,16,5,5,skin);c.restore();
  rr(c,-30,-50,15,14,5,armor2,ink);rr(c,15,-50,15,14,5,armor2,ink);
  // Horned helmet and face/back plate.
  if(back){
    rr(c,-17,-78,34,27,8,'#66645f',ink);line(c,0,-75,0,-54,'#aaa08f',2);
    path(c,[[-13,-75],[-25,-87],[-18,-69]],edge,ink,1.2);path(c,[[13,-75],[25,-87],[18,-69]],edge,ink,1.2);
    rr(c,-10,-66,20,7,2,cloth,ink);
  }else{
    rr(c,-18,-79,36,29,8,armor2,ink);
    path(c,[[-14,-75],[-27,-89],[-20,-68]],edge,ink,1.3);path(c,[[14,-75],[27,-89],[20,-68]],edge,ink,1.3);
    rr(c,-14,-68,28,10,3,'#403b39',ink);ellipse(c,-6,-63,2.6,2.5,'#f1b16f');ellipse(c,6,-63,2.6,2.5,'#f1b16f');
    path(c,[[-9,-55],[0,-50],[9,-55],[6,-45],[-6,-45]],skin,ink,1);line(c,-5,-50,5,-50,'#5d3731',1.5);
  }
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-39,30,42,'#ffe6bc');}
  c.restore();
}

function drawLumina(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#32434a',white='#eee9d7',gold='#d8b766',blue='#9fd7dc',skin='#e7bd9c',team=TEAM_COLORS[opts.owner||0];
  const bob=Math.sin(walk)*.9+(moving?0:Math.sin(t*2.2)*.45),cast=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*6,-7);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.25:0));line(c,0,0,0,14,'#8f897a',7);rr(c,-5,10,10,6,2,ink);c.restore();}
  path(c,[[-17,-40],[17,-40],[22,-4],[5,-12],[0,2],[-5,-12],[-22,-4]],white,ink,1.5);rr(c,-15,-38,30,8,3,team);
  if(back){line(c,-9,-31,9,-14,'#c2a85e',3);line(c,9,-31,-9,-14,'#d8c37a',2);path(c,[[-6,-24],[0,-31],[6,-24],[0,-16]],blue,ink,1);}
  else{path(c,[[-8,-31],[0,-37],[8,-31],[5,-20],[0,-15],[-5,-20]],'#fff4c9',ink,1);ellipse(c,0,-25,3,3,blue);}
  // staff hand
  c.save();c.translate(15,-32);c.rotate(-.15-cast*.5);line(c,0,0,2,15,white,8);ellipse(c,2,15,3.5,3.5,skin);line(c,2,15,2,-34,'#9b7e55',4);ellipse(c,2,-38,8,8,gold);ellipse(c,2,-38,4.5,4.5,blue);c.restore();
  c.save();c.translate(-15,-32);c.rotate(.1+cast*.35);line(c,0,0,-2,14,white,8);ellipse(c,-2,14,3.5,3.5,skin);c.restore();
  const hy=-53;path(c,[[-13,hy+9],[-14,hy-9],[0,hy-19],[14,hy-9],[13,hy+9]],white,ink,1.4);
  if(back){path(c,[[-10,hy-5],[0,hy-15],[10,hy-5],[8,hy+8],[-8,hy+8]],'#d9d3c5',ink,1);}
  else{ellipse(c,0,hy,10,11,skin);ellipse(c,-3,hy-1,1.3,1.5,ink);ellipse(c,4,hy-1,1.3,1.5,ink);line(c,-4,hy+5,4,hy+5,'#9d715e',1);}
  c.strokeStyle=gold;c.lineWidth=2;c.beginPath();c.ellipse(0,hy-20,13,4,0,0,TAU);c.stroke();
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-31,20,31,'#fff9d7');}c.restore();
}

function drawFrostShaman(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#283b46',fur='#dbe6e4',cloth='#54778a',ice='#9fe9ff',dark='#365363',skin='#d9b391',team=TEAM_COLORS[opts.owner||0];
  const bob=Math.sin(walk)*1+(moving?0:Math.sin(t*2.1)*.4),cast=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*6,-8);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.28:0));line(c,0,0,0,15,dark,7);rr(c,-5,11,10,6,2,ink);c.restore();}
  path(c,[[-17,-41],[17,-41],[20,-5],[5,-13],[0,0],[-6,-13],[-21,-5]],cloth,ink,1.4);rr(c,-15,-39,30,7,3,team);
  for(const side of [-1,1]){c.save();c.translate(side*15,-33);c.rotate(side*(.1+cast*.25));line(c,0,0,side*2,14,fur,8);ellipse(c,side*2,14,3.5,3.5,skin);c.restore();}
  // crooked ice staff
  line(c,17,-18,20,-70,'#836d55',4);path(c,[[20,-82],[11,-70],[18,-59],[28,-69]],ice,ink,1.2);ellipse(c,20,-70,4,5,'#e7fbff');
  const hy=-55;path(c,[[-17,hy+8],[-16,hy-11],[0,hy-23],[17,hy-11],[16,hy+8],[8,hy+14],[-8,hy+14]],fur,ink,1.4);
  if(back){path(c,[[-11,hy-7],[0,hy-17],[11,hy-7],[8,hy+11],[-8,hy+11]],dark,ink,1);line(c,0,hy-14,0,hy+10,ice,1.4);}
  else{ellipse(c,0,hy,10,10,skin);rr(c,-10,hy-5,20,8,3,dark,ink);ellipse(c,-4,hy-1,1.5,1.7,ice);ellipse(c,4,hy-1,1.5,1.7,ice);}
  for(const a of [0,2.1,4.2]){const r=26+Math.sin(t*3+a)*2;ellipse(c,Math.cos(a+t*.3)*r,hy+Math.sin(a+t*.3)*r*.25,1.6,1.6,ice);}
  if(opts.hit){c.globalAlpha*=.48;ellipse(c,0,-34,20,31,'#dcf8ff');}c.restore();
}

function drawStormHarpy(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,back=!!opts.back;
  const ink='#29384a',feather='#526b99',feather2='#86a6d8',storm='#ffd86c',cloth='#344a70',skin='#d9ad91',team=TEAM_COLORS[opts.owner||0];
  const flap=Math.sin(t*9+walk)*.38,cast=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,-18+Math.sin(t*4)*1.8);
  for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(flap);path(c,[[4,-25],[24,-47],[37,-43],[28,-26],[42,-17],[25,-14],[32,0],[13,-10],[7,2]],feather,ink,1.5);path(c,[[8,-21],[27,-36],[21,-18],[34,-16],[18,-8]],feather2,null);c.restore();}
  path(c,[[-11,-36],[11,-36],[14,-8],[0,0],[-14,-8]],cloth,ink,1.4);rr(c,-11,-34,22,6,2,team);
  // arms channel lightning
  for(const side of [-1,1]){c.save();c.translate(side*11,-30);c.rotate(side*(.3+cast*.5));line(c,0,0,side*7,14,skin,6);ellipse(c,side*7,14,3,3,skin);if(!back){line(c,side*8,15,side*14,7,storm,2);line(c,side*14,7,side*10,2,storm,2);}c.restore();}
  path(c,[[-10,-47],[-7,-62],[0,-70],[8,-62],[11,-47]],feather,ink,1.4);
  if(back){path(c,[[-8,-55],[0,-64],[8,-55],[6,-42],[-6,-42]],cloth,ink,1);}
  else{ellipse(c,0,-51,9,10,skin);ellipse(c,-3,-52,1.5,1.7,storm);ellipse(c,4,-52,1.5,1.7,storm);path(c,[[-8,-59],[0,-70],[8,-59]],feather2,ink,1);}
  for(const side of [-1,1]){path(c,[[side*6,-5],[side*10,12],[side*2,20]],'#7b6a65',ink,1);line(c,side*2,20,side*8,24,'#493f41',2);}
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-32,19,31,'#e9eeff');}c.restore();
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
  if(!opts.noShadow){const sr=type==='golem'?32:type==='mini_golem'?20:type==='berserker'?27:type==='boar'?25:type==='knight'?23:type==='mossling'?12:type==='boneswarm'?9:type==='tigger'?18:type==='muddragon'?26:type==='harpy'?20:18;ellipse(c,0,5,sr,type==='golem'?9:type==='mini_golem'?6:type==='boar'?8:6,'#172f3435');}
  if(opts.mirror)c.scale(-1,1);
  if(type==='golem'){drawStoneGolem(c,opts);c.restore();return;}
  if(type==='mini_golem'){c.scale(.62,.62);drawStoneGolem(c,opts);c.restore();return;}
  if(type==='boar'){drawIronBoar(c,opts);c.restore();return;}
  if(type==='tigger'){drawTigger(c,opts);c.restore();return;}
  if(type==='muddragon'){drawMudDragon(c,opts);c.restore();return;}
  if(type==='blowdart'){drawBlowdartGoblin(c,opts);c.restore();return;}
  if(type==='lasertower'){drawLaserTower(c,opts);c.restore();return;}
  if(type==='nightshade'){drawNightshade(c,opts);c.restore();return;}
  if(type==='mossling'){drawMossling(c,opts);c.restore();return;}
  if(type==='boneswarm'){drawBoneSwarm(c,opts);c.restore();return;}
  if(type==='berserker'){drawKraggBerserker(c,opts);c.restore();return;}
  if(type==='lumina'){drawLumina(c,opts);c.restore();return;}
  if(type==='frost'){drawFrostShaman(c,opts);c.restore();return;}
  if(type==='harpy'){drawStormHarpy(c,opts);c.restore();return;}
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
  if(core&&t.awake===false){
    c.save();c.globalAlpha=.72;ellipse(c,0,-55,31,20,'#223b4655');
    c.fillStyle='#e8edcf';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('Z z z',0,-53);c.restore();
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
  if(options.selected&&g.phase==='battle'&&!UNITS[options.selected].spell){
    const selectedData=UNITS[options.selected];
    if(selectedData.tunnelAnywhere){
      c.fillStyle='#a67f4a12';c.fillRect(46,46,628,936);c.setLineDash([7,8]);c.strokeStyle='#d9bd82aa';c.lineWidth=1.5;c.strokeRect(46,46,628,936);c.setLineDash([]);
      c.fillStyle='#f2dfb9';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('地下出現地点を指定',360,74);
    }else{
      c.fillStyle='#4abdaf18';c.fillRect(46,600,628,382);
      c.setLineDash([9,10]);line(c,46,600,674,600,'#d3eed788',2);c.setLineDash([]);
      c.fillStyle='#e3f2d5';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('ここに配置',360,628);
      const fallen=g.towers.filter(t=>t.owner!==seat&&t.kind==='tower'&&t.hp<=0).map(t=>orient(t,seat));
      if(fallen.length>=2){
        const top=Math.max(58,Math.max(...fallen.map(t=>t.y))+(ARENA.advancedDeployInset||120));
        c.fillStyle='#d2ef9d24';c.fillRect(46,top,628,600-top);
        c.setLineDash([6,7]);line(c,46,top,674,top,'#e8f5b8cc',1.8);c.setLineDash([]);
        c.fillStyle='#edf7c7';c.font='bold 10px sans-serif';c.fillText('両塔破壊・前線全面解放',360,Math.min(590,top+22));
      }else for(const t of fallen){
        const left=t.x<360,x=left?46:400,w=274,top=Math.max(58,t.y+(ARENA.advancedDeployInset||120)),half=ARENA.advancedCenterHalf||52;
        c.fillStyle='#d2ef9d20';c.fillRect(x,top,w,600-top);c.fillRect(360-half,top,half*2,600-top);
        c.setLineDash([6,7]);line(c,x,top,x+w,top,'#e8f5b8aa',1.5);line(c,360-half,top,360+half,top,'#e8f5b8aa',1.5);c.setLineDash([]);
        c.fillStyle='#edf7c7';c.font='bold 10px sans-serif';c.fillText('前線配置',left?183:537,Math.min(590,top+22));
      }
    }
  }
  for(const z of g.zones||[]){
    const p=orient(z,seat),life=z.total?clamp(z.remaining/z.total,0,1):1,pulse=.92+.05*Math.sin(time*6);
    const mud=z.kind==='mud';c.save();c.globalAlpha=.16+.11*life;c.fillStyle=mud?'#786548':z.kind==='poison'?'#70984f':'#9aa36d';c.beginPath();c.arc(p.x,p.y,z.radius*pulse,0,TAU);c.fill();
    c.globalAlpha=.55;c.strokeStyle=mud?'#b6a276':'#c9ec82';c.lineWidth=2;c.setLineDash([5,6]);c.beginPath();c.arc(p.x,p.y,z.radius,0,TAU);c.stroke();c.setLineDash([]);
    for(let i=0;i<7;i++){const a=i*TAU/7+time*.25,r=z.radius*(.25+.55*((i*37)%10)/10);ellipse(c,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.65,3,2,mud?'#9b875f88':'#c7e38488');}
    c.restore();
  }
  // Continuous laser beams are drawn beneath units so the locked target remains readable.
  for(const u of g.units||[]){
    if(u.type!=='lasertower'||u.hp<=0||!u.target)continue;
    const target=[...(g.units||[]),...(g.towers||[])].find(e=>e.id===u.target&&e.hp>0);if(!target)continue;
    const p=orient(u,seat),q=orient(target,seat),stage=u.laserStage||0,pulse=.75+.2*Math.sin(time*18);
    c.save();c.globalAlpha=.7+.18*pulse;c.strokeStyle=stage>=4?'#ff9bd5':stage>=2?'#e8b4ff':'#c8d5ff';c.lineWidth=Math.min(8,2+stage*.85);c.beginPath();c.moveTo(p.x,p.y-32);c.lineTo(q.x,q.y-(target.air?20:12));c.stroke();
    c.globalAlpha=.9;c.strokeStyle='#fff3ff';c.lineWidth=1.2;c.beginPath();c.moveTo(p.x,p.y-32);c.lineTo(q.x,q.y-(target.air?20:12));c.stroke();c.restore();
  }
  const markerUnits=[];
  for(const item of renderOrder(g,seat)){
    if(item.tower){drawTower(c,item.entity,seat,time);continue;}
    const u=item.entity,p=orient(u,seat),owner=u.owner===seat?0:1,facing=visualFacing(u,seat);
    if(u.burrowState==='burrow'){
      c.save();c.globalAlpha=.7;ellipse(c,p.x,p.y+2,17,7,'#806548');ellipse(c,p.x-8,p.y-2,5,3,'#a58a62');ellipse(c,p.x+7,p.y-3,4,2,'#b19970');c.strokeStyle=TEAM_COLORS[owner]+'99';c.lineWidth=1.5;c.setLineDash([3,5]);c.beginPath();c.ellipse(p.x,p.y,20,9,0,0,TAU);c.stroke();c.setLineDash([]);c.restore();continue;
    }
    c.strokeStyle=TEAM_COLORS[owner]+'b0';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y+4,u.radius+4,(u.radius+4)*.34,0,0,TAU);c.stroke();
    drawUnit(c,u.type,p.x,p.y,u.type==='mossling'?.9:u.type==='boneswarm'?.78:u.type==='tigger'?1.0:u.type==='muddragon'?.92:u.type==='blowdart'?.9:u.type==='lasertower'?.92:u.type==='bat'?.93:u.type==='golem'?.92:u.type==='mini_golem'?.72:u.type==='berserker'?.94:u.type==='harpy'?.9:.95,{time,walk:u.walk,moving:u.moving,owner,anim:u.anim,hit:u.hit,charged:u.charged,dashWindup:u.dashState==='windup',dashing:u.dashState==='rush',invulnerable:!!u.invulnerable,alpha:u.spawn>0?.5:1,back:facing.back,mirror:u.building?false:facing.mirror,facing:facing.angle});
    if(u.slowed){c.save();c.strokeStyle='#a9ebffcc';c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();c.ellipse(p.x,p.y+3,u.radius+8,(u.radius+8)*.42,0,0,TAU);c.stroke();c.restore();}
    if(u.poisoned){c.save();c.strokeStyle='#c9e77dcc';c.lineWidth=2;c.setLineDash([2,4]);c.beginPath();c.ellipse(p.x,p.y+3,u.radius+7,(u.radius+7)*.48,0,0,TAU);c.stroke();c.restore();}
    if(u.mudded){c.save();c.strokeStyle='#b59c6dcc';c.lineWidth=2;c.setLineDash([5,3]);c.beginPath();c.ellipse(p.x,p.y+4,u.radius+9,(u.radius+9)*.42,0,0,TAU);c.stroke();c.restore();}
    const hp=u.hp/u.maxHp,w=u.type==='golem'?50:u.type==='mini_golem'?32:u.type==='berserker'?42:u.type==='boar'?38:u.type==='knight'?38:u.type==='mossling'?20:u.type==='boneswarm'?16:28;
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
    if(p.kind==='arrowrain'){
      const progress=clamp(p.progress||0,0,1),warn=progress>.35;
      if(warn){c.save();c.globalAlpha=.1+progress*.18;c.fillStyle='#d9c295';c.beginPath();c.arc(target.x,target.y,p.radius||130,0,TAU);c.fill();c.strokeStyle='#f4dfaf';c.lineWidth=1.5;c.setLineDash([5,5]);c.stroke();c.restore();}
      c.save();c.strokeStyle='#f0dfbb';c.lineWidth=1.6;
      for(let i=0;i<11;i++){const a=i*2.39,rad=(p.radius||130)*(.18+.7*((i*37)%10)/10),ax=target.x+Math.cos(a)*rad,ay=target.y+Math.sin(a)*rad*.55-80*(1-progress);line(c,ax-6,ay-18,ax+2,ay+6,'#ead8b4',1.8);path(c,[[ax-1,ay+5],[ax+5,ay+10],[ax+1,ay+1]],'#d5a46f');}
      c.restore();continue;
    }
    if(p.kind==='fireball'){
      const progress=clamp(p.progress||0,0,1),arc=Math.sin(Math.PI*progress)*72;
      if(progress>.72){c.save();c.globalAlpha=.16+(progress-.72)*1.5;c.fillStyle='#f36f4d';c.beginPath();c.arc(target.x,target.y,p.radius||90,0,TAU);c.fill();c.strokeStyle='#ffd39a';c.lineWidth=2;c.setLineDash([7,6]);c.stroke();c.restore();}
      c.save();c.translate(pos.x,pos.y-18-arc);c.rotate(angle);
      for(let i=0;i<4;i++)ellipse(c,-13-i*7,0,10-i*1.6,7-i,'#f08a4f'+(i===0?'dd':'77'));
      ellipse(c,0,0,12,12,'#f15e3d');ellipse(c,2,-2,7,7,'#ffbf63');ellipse(c,4,-4,3,3,'#fff0a5');c.restore();continue;
    }
    c.save();c.translate(pos.x,pos.y-10);c.rotate(angle);
    if(p.kind==='arrow'){line(c,-10,0,7,0,'#f2dfb8',2);path(c,[[6,-3],[13,0],[6,3]],'#edf5df');}
    else if(p.kind==='dart'){line(c,-12,0,8,0,'#e8d59d',1.6);path(c,[[7,-2],[14,0],[7,2]],'#8fd06d');}
    else if(p.kind==='bomb'){ellipse(c,0,0,8,8,'#2a3941');line(c,0,-7,4,-11,'#fbd078',2);}
    else if(p.kind==='frost'){path(c,[[-9,0],[0,-8],[10,0],[0,8]],'#a8edff','#4c8297',1);ellipse(c,0,0,3,3,'#effdff');}
    else if(p.kind==='lightning'){line(c,-10,0,-2,-5,'#ffe074',3);line(c,-2,-5,3,4,'#fff1a4',3);line(c,3,4,12,0,'#ffe074',3);}
    else if(p.kind==='light'){ellipse(c,0,0,7,7,'#ffe7a3');ellipse(c,0,0,3,3,'#e6ffff');}
    else if(p.kind==='mud'){ellipse(c,0,0,9,7,'#806847');ellipse(c,-4,-2,4,3,'#b09a6e');ellipse(c,4,1,3,2,'#5f513b');}
    else{ellipse(c,0,0,p.kind==='orb'?8:5,p.kind==='orb'?8:5,p.kind==='orb'?'#c8b0f1':'#f9d494');ellipse(c,-4,0,3,3,'#fff3ca');}
    c.restore();
  }
  for(const e of g.events){
    const p=orient(e,seat),fade=clamp(e.life/(e.type==='death'?.9:.5),0,1);c.save();c.globalAlpha=fade;
    if(e.type==='spawn'){
      c.strokeStyle=TEAM_COLORS[e.owner===seat?0:1];c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,30*(1-fade)+15,10*(1-fade)+5,0,0,TAU);c.stroke();
    }else if(e.type==='core-awake'){
      c.strokeStyle='#ffe277';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y-45,28+(1-fade)*48,0,TAU);c.stroke();
      c.fillStyle='#fff1a8';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('AWAKE!',p.x,p.y-88-(1-fade)*10);
    }else if(e.type==='charge'){
      c.strokeStyle='#ffd46b';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-18,16+(1-fade)*24,0,TAU);c.stroke();
    }else if(e.type==='charge-hit'){
      for(let i=0;i<10;i++){const a=i*TAU/10,len=(1-fade)*42;ellipse(c,p.x+Math.cos(a)*len,p.y-10+Math.sin(a)*len*.6,3+fade*6,3+fade*4,i%2?'#d1a873':'#f4d177');}
    }else if(e.type==='shadow-windup'){
      c.strokeStyle='#9bf0c5';c.lineWidth=2.5;c.setLineDash([4,4]);c.beginPath();c.arc(p.x,p.y-24,16+(1-fade)*22,0,TAU);c.stroke();c.setLineDash([]);
    }else if(e.type==='shadow-rush'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle='#7b6d9fcc';c.lineWidth=8*fade+2;c.beginPath();c.moveTo(p.x,p.y-18);c.lineTo(q.x,q.y-18);c.stroke();c.strokeStyle='#b9f6d5';c.lineWidth=2;c.beginPath();c.moveTo(p.x,p.y-18);c.lineTo(q.x,q.y-18);c.stroke();
    }else if(e.type==='shadow-hit'){
      for(let i=0;i<8;i++){const a=i*TAU/8,len=(1-fade)*34;path(c,[[p.x+Math.cos(a)*len,p.y-12+Math.sin(a)*len],[p.x+Math.cos(a+.18)*(len+12),p.y-12+Math.sin(a+.18)*(len+12)]],null,i%2?'#9cf0c5':'#8175a5',2.4);}
    }else if(e.type==='shadow-evade'){
      c.strokeStyle='#d8fff0';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-22,9+(1-fade)*18,-2.5,.5);c.stroke();
    }else if(e.type==='slash'){
      c.strokeStyle='#fff1c0';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y-18,20+(1-fade)*13,-2.5,-.3);c.stroke();
    }else if(e.type==='heal'){
      c.strokeStyle='#dff6bd';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-18,10+(1-fade)*24,0,TAU);c.stroke();line(c,p.x-6,p.y-18,p.x+6,p.y-18,'#f6e9a9',3);line(c,p.x,p.y-24,p.x,p.y-12,'#f6e9a9',3);
    }else if(e.type==='slow'){
      c.strokeStyle='#a7ebff';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-15,12+(1-fade)*18,0,TAU);c.stroke();for(let i=0;i<6;i++){const a=i*TAU/6;line(c,p.x+Math.cos(a)*12,p.y-15+Math.sin(a)*12,p.x+Math.cos(a)*18,p.y-15+Math.sin(a)*18,'#dffaff',1.5);}
    }else if(e.type==='chain'){
      if(e.points?.length){let a=orient({x:e.x,y:e.y},seat);for(const q0 of e.points){const q=orient(q0,seat),mx=(a.x+q.x)/2+((String(e.id).length%2)?5:-5);line(c,a.x,a.y-10,mx,(a.y+q.y)/2-16,'#ffe16e',3);line(c,mx,(a.y+q.y)/2-16,q.x,q.y-10,'#fff3b1',2);a=q;}}
    }else if(e.type==='laser-lock'||e.type==='laser-ramp'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle=e.type==='laser-ramp'?'#f0b5ff':'#cad8ff';c.lineWidth=e.type==='laser-ramp'?4:2;c.beginPath();c.moveTo(p.x,p.y-20);c.lineTo(q.x,q.y-10);c.stroke();
      if(e.type==='laser-ramp'){c.fillStyle='#fff0ff';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText(`POWER ×${Math.pow(2,e.stage||0)}`,p.x,p.y-50);}
    }else if(e.type==='burrow-start'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle='#a88a60aa';c.lineWidth=3;c.setLineDash([4,6]);c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo((p.x+q.x)/2,p.y-18,q.x,q.y);c.stroke();c.setLineDash([]);
    }else if(e.type==='burrow-arrive'){
      c.strokeStyle='#d2b47d';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,12+(1-fade)*26,6+(1-fade)*12,0,0,TAU);c.stroke();for(let i=0;i<7;i++){const a=i*TAU/7;ellipse(c,p.x+Math.cos(a)*(1-fade)*24,p.y+Math.sin(a)*(1-fade)*10,3,2,'#a8845e');}
    }else if(e.type==='mud-deploy'){
      c.strokeStyle='#b7a477';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(e.radius||45)*(1-fade*.22),0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8+e.id;ellipse(c,p.x+Math.cos(a)*(1-fade)*(e.radius||45)*.65,p.y+Math.sin(a)*(1-fade)*(e.radius||45)*.45,3,2,'#8e7452');}
    }else if(e.type==='poison-deploy'){
      c.strokeStyle='#c9eb83';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(e.radius||90)*(1-fade*.35),0,TAU);c.stroke();
      for(let i=0;i<10;i++){const a=i*TAU/10+e.id,len=(1-fade)*(e.radius||90)*.65;ellipse(c,p.x+Math.cos(a)*len,p.y+Math.sin(a)*len*.6,3+fade*4,2+fade*3,'#97bd63');}
    }else if(e.type==='arrowrain-impact'){
      c.strokeStyle='#f0d4a0';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(e.radius||130)*(1-fade*.18),0,TAU);c.stroke();
      for(let i=0;i<16;i++){const a=i*2.17,len=(1-fade)*(e.radius||130)*.85;line(c,p.x+Math.cos(a)*len-5,p.y+Math.sin(a)*len*.55-14,p.x+Math.cos(a)*len+2,p.y+Math.sin(a)*len*.55+7,'#e7d6b2',1.5);}
    }else if(e.type==='fireball-impact'){
      c.fillStyle='#f45f3f44';c.beginPath();c.arc(p.x,p.y,(e.radius||90)*(1-fade*.18),0,TAU);c.fill();
      c.strokeStyle='#ffd48c';c.lineWidth=5*fade+1;c.beginPath();c.arc(p.x,p.y,(e.radius||90)*(1-fade*.35),0,TAU);c.stroke();
      for(let i=0;i<14;i++){const a=i*TAU/14+e.id,len=(1-fade)*(e.radius||90);ellipse(c,p.x+Math.cos(a)*len,p.y+Math.sin(a)*len*.65,5+fade*8,4+fade*7,i%2?'#ffb457':'#ef6742');}
    }else if(e.type==='death-blast'){
      c.strokeStyle=e.unitType==='mini_golem'?'#d8d7aa':'#ecd39b';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-8,(e.radius||55)*(1-fade*.25),0,TAU);c.stroke();
      for(let i=0;i<9;i++){const a=i*TAU/9+e.id,len=(1-fade)*(e.radius||55);ellipse(c,p.x+Math.cos(a)*len,p.y-8+Math.sin(a)*len*.6,3+fade*6,3+fade*5,'#b8ad89');}
    }else if(e.type==='split-spawn'){
      c.strokeStyle='#cfe5aa';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-9,10+(1-fade)*18,0,TAU);c.stroke();
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
    const d=UNITS[options.selected];
    if(d.spell){
      const poison=d.spell==='poison',arrows=d.spell==='arrowrain',fill=poison?'#7fa64d':arrows?'#d0af78':'#ef754d',stroke=poison?'#d9f49a':arrows?'#f5dfb0':'#ffd79a';
      c.save();c.globalAlpha=.2;c.fillStyle=ghost.valid?fill:'#fa9b80';c.beginPath();c.arc(ghost.x,ghost.y,d.radius,0,TAU);c.fill();c.globalAlpha=.8;c.strokeStyle=ghost.valid?stroke:'#ff987f';c.lineWidth=2;c.setLineDash([7,6]);c.stroke();c.setLineDash([]);
      if(poison){ellipse(c,ghost.x,ghost.y,13,9,'#789850');for(const a of [0,2.1,4.2])ellipse(c,ghost.x+Math.cos(a)*14,ghost.y+Math.sin(a)*9,4,3,'#bddd77');}
      else if(arrows){for(let i=-2;i<=2;i++)line(c,ghost.x+i*6-3,ghost.y-15,ghost.x+i*6+2,ghost.y+10,'#ead8b5',2);}
      else{ellipse(c,ghost.x,ghost.y,14,14,'#ef633e');ellipse(c,ghost.x+3,ghost.y-3,7,7,'#ffd36f');}c.restore();
    }else{
      if(d.tunnelAnywhere){
        const core=g.towers.find(t=>t.owner===seat&&t.kind==='core'&&t.hp>0);if(core){const q=orient(core,seat);c.save();c.globalAlpha=.65;c.strokeStyle=ghost.valid?'#d6b778':'#ff9d87';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.moveTo(q.x,q.y);c.quadraticCurveTo((q.x+ghost.x)/2,(q.y+ghost.y)/2-28,ghost.x,ghost.y);c.stroke();c.setLineDash([]);c.fillStyle='#f3dfb1';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('地下移動',ghost.x,Math.max(22,ghost.y-38));c.restore();}}
      if(d.building&&d.range){
        c.save();c.globalAlpha=ghost.valid?.11:.08;c.fillStyle=ghost.valid?'#bfe9cc':'#f5a08d';c.beginPath();c.arc(ghost.x,ghost.y,d.range,0,TAU);c.fill();
        c.globalAlpha=.75;c.strokeStyle=ghost.valid?'#d9f6df':'#ff9d87';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.arc(ghost.x,ghost.y,d.range,0,TAU);c.stroke();c.setLineDash([]);
        c.fillStyle=ghost.valid?'#e8f8df':'#ffd4ca';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(`攻撃範囲 R${d.range}`,ghost.x,Math.max(24,ghost.y-d.range-10));c.restore();
      }
      c.globalAlpha=.35;ellipse(c,ghost.x,ghost.y,d.radius+10,10,ghost.valid?'#d9f3bb':'#fa9b80');c.globalAlpha=1;
      drawUnit(c,options.selected,ghost.x,ghost.y,.9,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2});
      c.strokeStyle=ghost.valid?'#eaf9c8':'#ff987f';c.lineWidth=2;c.beginPath();c.arc(ghost.x,ghost.y,28,0,TAU);c.stroke();
    }
  }
  // Foreground rim.
  c.strokeStyle='#d6d6ad55';c.lineWidth=2;c.beginPath();c.roundRect(22,14,676,1008,30);c.stroke();
  c.restore();
}
export function drawPortrait(canvas,type,time=0,owner=0,selected=false,back=false){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,d=UNITS[type];
  c.clearRect(0,0,w,h);c.save();c.scale(w/120,h/120);
  const col=d.color,g=c.createRadialGradient(60,48,10,60,64,70);g.addColorStop(0,col+'99');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(0,0,120,120);
  if(d.spell){
    ellipse(c,60,100,37,8,'#1f39451b');
    if(d.spell==='poison'){
      ellipse(c,60,72,27,18,'#66834e','#3d563d',2);for(const [x,y,r] of [[49,64,9],[68,61,11],[75,75,8],[52,79,7]])ellipse(c,x,y,r,r*.75,'#9fca65');
      rr(c,48,48,24,12,5,'#586f4d','#354c3e');ellipse(c,60,50,5,4,'#d8eb8b');
    }else if(d.spell==='arrowrain'){
      for(let i=0;i<7;i++){const x=39+i*7,y=49+(i%2)*8;line(c,x,y,x+9,y+37,'#e8d7b7',3);path(c,[[x+7,y+34],[x+14,y+42],[x+9,y+30]],'#b17b56','#5f5346',1);}
      c.strokeStyle='#d4ad76';c.lineWidth=2;c.beginPath();c.arc(60,82,28,0,TAU);c.stroke();
    }else{
      for(let i=0;i<5;i++){const a=-2.65+i*.34;path(c,[[60,70],[60+Math.cos(a)*31,70+Math.sin(a)*31],[60+Math.cos(a+.18)*18,70+Math.sin(a+.18)*18]],i%2?'#f18b4d':'#d94f39');}
      ellipse(c,60,69,25,25,'#e95339','#7d382f',2);ellipse(c,66,62,14,14,'#ffad50');ellipse(c,70,57,6,6,'#fff0a5');
    }
    c.fillStyle='#fff6db';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('SPELL',60,111);c.restore();return;
  }
  ellipse(c,60,105,40,8,'#1f39451b');
  const scale=type==='golem'?.92:type==='mini_golem'?1.15:type==='berserker'?1.18:type==='boar'?1.28:type==='tigger'?1.35:type==='muddragon'?1.34:type==='blowdart'?1.42:type==='lasertower'?1.35:type==='mossling'?2.05:type==='boneswarm'?1.8:type==='harpy'?1.45:type==='bat'?1.6:type==='cannon'?1.5:type==='mage'?1.12:type==='nightshade'?1.28:type==='lumina'?1.22:type==='frost'?1.2:1.32;
  const py=type==='golem'?112:type==='mini_golem'?104:type==='berserker'?108:type==='boar'?96:type==='tigger'?101:type==='muddragon'?94:type==='blowdart'?102:type==='lasertower'?96:type==='mossling'?91:type==='boneswarm'?96:type==='harpy'?91:type==='bat'?83:type==='cannon'?(back?94:80):104;
  drawUnit(c,type,60,py,scale,{time,owner,idle:true,noShadow:true,anim:0,back,facing:back?-Math.PI/2:Math.PI/2});c.restore();
}
