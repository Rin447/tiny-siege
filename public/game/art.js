import {ARENA, UNITS, TEAM_COLORS} from './units.js';
import {clamp} from './engine.js';

// Lightweight procedural cut-out rig: hips, knees, shoulders, hands and equipment.
// All illustrations are original vectors; no external art or font assets are loaded.
const TAU=Math.PI*2;

// Spell ownership is always rendered from the local viewer's perspective:
// blue + solid = your spell, red + dashed = the opponent's spell.
// Keeping this separate from the unit palette makes spell danger readable at a glance.
export const SPELL_TEAM_COLORS = Object.freeze({
  own:Object.freeze({base:'#4f9dff',bright:'#b9dcff',soft:'#85beff',dash:Object.freeze([])}),
  enemy:Object.freeze({base:'#ff5f68',bright:'#ffc1c5',soft:'#ff8e96',dash:Object.freeze([7,6])})
});
export function spellTeamStyle(owner,seat=0){return owner===seat?SPELL_TEAM_COLORS.own:SPELL_TEAM_COLORS.enemy;}
function spellRing(c,style){c.setLineDash(style.dash);}
function path(ctx,pts,fill,stroke=null,w=1){
  ctx.beginPath();ctx.moveTo(...pts[0]);for(const p of pts.slice(1))ctx.lineTo(...p);ctx.closePath();
  if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=w;ctx.stroke();}
}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.fill();}
function line(c,x,y,x2,y2,color,w=2){c.strokeStyle=color;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.stroke();}
function rr(c,x,y,w,h,r,color,stroke){
  const hideTeamBand=c.__hideTeamBands===true&&TEAM_COLORS.includes(color)&&h<=10&&w>=h*1.6;
  c.beginPath();c.roundRect(x,y,w,h,r);if(color&&!hideTeamBand){c.fillStyle=color;c.fill();}
  if(stroke&&!hideTeamBand){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}
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
  const riverJump=opts.riverJumpState==='leap',riverP=clamp(opts.riverJumpProgress||0,0,1),riverArc=riverJump?Math.sin(riverP*Math.PI):0;
  const bob=riverJump?0:(moving?Math.sin(walk*1.2)*1.6:Math.sin(t*2)*.45),kick=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob-riverArc*52);if(riverJump){c.rotate(Math.sin((riverP-.5)*Math.PI)*.08);c.save();c.globalAlpha=.25+.25*riverArc;for(const side of [-1,1])line(c,side*30,5,side*42,18,'#d9e8e8',2);c.restore();}
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
  const ink='#2b3731',mud='#70583f',mud2='#96754f',mudHi='#b99a66',belly='#c1ad79',wing='#4f5d49',wing2='#748066',horn='#ddd09a',eye='#f3dc63';
  const flap=Math.sin(t*5.6+walk)*.28,bob=Math.sin(t*2.7)*1.4,blast=attack?Math.sin((1-attack/.35)*Math.PI):0,drip=.5+.5*Math.sin(t*4.2);
  c.save();c.translate(0,-18+bob);
  // Torn, heavy wings: broad roots and broken tips make the silhouette feel swampy and old.
  for(const side of [-1,1]){
    c.save();c.scale(side,1);c.rotate(flap);
    path(c,[[7,-25],[24,-43],[43,-39],[34,-27],[45,-18],[34,-13],[43,-5],[26,-8],[20,3],[11,-7]],wing,ink,1.7);
    path(c,[[12,-25],[27,-34],[23,-20],[35,-17],[22,-12]],wing2,null);
    path(c,[[33,-27],[39,-22],[34,-18]],mud2,ink,.8);
    ellipse(c,29,-12,4,3,mud);ellipse(c,37,-7,3,2,mudHi);
    c.restore();
  }
  // Wide crocodile body instead of the old narrow vertical dragon body.
  ellipse(c,0,-19,23,25,mud);ellipse(c,0,-12,13,18,belly);
  path(c,[[-14,-30],[-10,-42],[0,-49],[11,-42],[15,-30],[19,-12],[12,4],[0,11],[-13,4],[-19,-12]],mud2,ink,1.8);
  // Mud armour lumps stay readable even when the unit is tiny.
  ellipse(c,-14,-21,6,5,mudHi);ellipse(c,13,-12,5,4,mud);ellipse(c,-8,-4,4,3,mudHi);ellipse(c,10,-29,4,4,mud);
  if(back){
    for(const y of [-40,-31,-22,-13])path(c,[[-5,y],[0,y-7],[5,y]],wing2,ink,.7);
    path(c,[[-7,5],[0,24],[7,5]],mud,ink,1.3);
    ellipse(c,0,-46,13,8,mud2);
  }else{
    // Oversized alligator head + jaw is the character's main visual symbol.
    ellipse(c,0,-47,17,11,mud2);
    rr(c,-18,-47,36,12,6,mud2,ink);
    path(c,[[-17,-41],[-11,-33],[0,-30],[12,-33],[18,-41],[10,-37],[0,-35],[-10,-37]],'#594432',ink,1.2);
    for(const x of [-11,-4,4,11])path(c,[[x-2,-39],[x,-35],[x+2,-39]],horn,ink,.6);
    path(c,[[-12,-51],[-20,-59],[-17,-45]],horn,ink,1);path(c,[[12,-51],[20,-59],[17,-45]],horn,ink,1);
    ellipse(c,-8,-50,2.7,2.7,eye);ellipse(c,8,-50,2.7,2.7,eye);ellipse(c,-8,-50,1,1,ink);ellipse(c,8,-50,1,1,ink);
    ellipse(c,-6,-43,2,1.4,'#3d3027');ellipse(c,6,-43,2,1.4,'#3d3027');
    // Mud spit swells out of the mouth during attacks.
    if(blast){
      c.save();c.globalAlpha=.82;
      ellipse(c,0,-32-blast*8,8+blast*7,5+blast*3,mud2);
      ellipse(c,-6,-29-blast*10,3+blast*2,3+blast*2,mudHi);
      ellipse(c,7,-30-blast*12,2.5+blast*2,2.5+blast*2,mud);
      c.restore();
    }
  }
  // Constant drips sell the mud theme without changing gameplay.
  ellipse(c,-11,7+drip*2,3,5,mud);ellipse(c,12,5+(1-drip)*3,2.5,4,mud2);
  rr(c,-13,-25,26,6,3,team,ink);
  if(opts.hit){c.globalAlpha*=.4;ellipse(c,0,-24,28,35,'#fff0ba');}
  c.restore();
}

function drawLaserDragon(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#203441',body='#396c9e',body2='#73a9cf',plate='#a8c8dc',belly='#d9e8ec',wing='#425b86',wing2='#7898c4',horn='#e4e6f5',core='#d5b4ff';
  const flap=Math.sin(t*7.2+walk)*.22,bob=Math.sin(t*3.3)*1.5,stage=opts.laserStage||0,pulse=.5+.5*Math.sin(t*10);
  c.save();c.translate(0,-19+bob);
  // Thin, straight mechanical wings deliberately contrast the Mud Dragon's torn organic wings.
  for(const side of [-1,1]){
    c.save();c.scale(side,1);c.rotate(flap);
    path(c,[[5,-24],[20,-46],[42,-40],[31,-28],[46,-16],[27,-15],[39,-4],[18,-8],[10,2]],wing,ink,1.5);
    path(c,[[11,-25],[24,-37],[33,-34],[22,-25]],wing2,ink,.7);
    line(c,18,-30,35,-22,plate,1.5);line(c,22,-17,36,-11,plate,1.2);
    c.restore();
  }
  // Slim plated fuselage.
  path(c,[[-10,-31],[-7,-51],[0,-62],[8,-51],[11,-31],[8,4],[0,16],[-8,4]],body2,ink,1.7);
  path(c,[[-7,-24],[0,-34],[7,-24],[6,4],[0,11],[-6,4]],belly,ink,.8);
  for(const y of [-42,-31,-20,-9])rr(c,-7,y,14,5,2,y%2?body:plate,ink);
  if(back){
    for(const y of [-48,-37,-26,-15])path(c,[[-4,y],[0,y-7],[4,y]],core,ink,.8);
    path(c,[[-4,8],[0,30],[4,8]],body,ink,1.2);ellipse(c,0,22,3,4,core);
  }else{
    // Angular head, visor eyes and forehead crystal.
    path(c,[[-11,-49],[-6,-62],[0,-68],[7,-62],[12,-49],[7,-41],[-7,-41]],body,ink,1.4);
    line(c,-7,-49,-2,-49,'#ecf8ff',2);line(c,2,-49,7,-49,'#ecf8ff',2);
    path(c,[[-4,-61],[0,-72],[4,-61],[0,-56]],core,ink,1);
    for(const side of [-1,1])path(c,[[side*8,-56],[side*17,-67],[side*13,-50]],horn,ink,1);
    // Chest reactor grows with laser ramp stage.
    ellipse(c,0,-33,7+Math.min(5,stage),6+Math.min(3,stage*.5),stage>=3?'#ffc5ee':core);
    ellipse(c,0,-33,3.5+Math.min(3,stage*.5),3,'#f7fbff');
    c.save();c.globalAlpha=.22+.28*pulse;ellipse(c,0,-33,13+stage*2,10+stage,'#dcbaff');c.restore();
    // Long antenna tail makes the lower silhouette unmistakable.
    line(c,0,9,0,27,body,5);path(c,[[-4,27],[0,37],[4,27],[0,30]],core,ink,.8);
  }
  rr(c,-10,-25,20,5,2,team,ink);
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-25,24,36,'#fff0d2');}
  c.restore();
}

function drawBlowdartGoblin(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#253735',skin='#78ab54',skin2='#a6cf72',hood='#4a6341',hood2='#688753',wood='#bb9460',bone='#e8ddb4',poison='#d8f16b',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk)*1.15:Math.sin(t*2.8)*.35),shoot=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // nimble little legs
  for(const side of [-1,1]){c.save();c.translate(side*5,-4);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.44:0));line(c,0,0,0,13,skin,6);rr(c,-4,10,9,5,2,'#364539',ink);c.restore();}
  // compact body with back quiver
  rr(c,-10,-33,20,27,6,hood,ink,1.4);rr(c,-10,-30,20,5,2,team,ink);rr(c,-8,-15,16,5,2,'#72583a',ink);
  if(back){
    rr(c,8,-31,7,18,2,'#5f4e38',ink,1);for(const y of [-28,-23,-18])path(c,[[12,y],[18,y-3],[13,y+2]],poison,ink,.8);
    rr(c,-8,-46,16,12,4,skin,ink);line(c,-6,-31,6,-12,'#b89263',2);
    path(c,[[-8,-55],[0,-65],[10,-56],[8,-39],[-8,-39]],hood2,ink,1.1);
    path(c,[[-12,-51],[-19,-57],[-16,-45]],hood2,ink,.9);path(c,[[12,-51],[20,-57],[16,-45]],hood2,ink,.9);
  }else{
    // face + leaf hood
    path(c,[[-12,-39],[-8,-53],[0,-59],[9,-53],[13,-39],[8,-29],[-8,-29]],skin2,ink,1.3);
    path(c,[[-12,-49],[-20,-57],[-17,-42]],skin2,ink,1);path(c,[[12,-49],[20,-57],[17,-42]],skin2,ink,1);
    path(c,[[-10,-56],[0,-66],[11,-56],[8,-39],[-8,-39]],hood2,ink,1.1);
    ellipse(c,-4,-44,2,2,'#f5ee9c');ellipse(c,4,-43,2,2,'#f5ee9c');path(c,[[-5,-37],[0,-34],[5,-37]],null,ink,1);
    // poison quiver on the back shoulder for readability
    rr(c,8,-31,7,18,2,'#5f4e38',ink,1);for(const y of [-28,-23,-18])path(c,[[12,y],[18,y-3],[13,y+2]],poison,ink,.8);
  }
  // off arm
  c.save();c.translate(-9,-29);c.rotate(-.18-shoot*.08);line(c,0,0,6,12,skin,6);ellipse(c,6,12,3,3,skin2);c.restore();
  // blowpipe arm + extra long pipe
  c.save();c.translate(8,-29);c.rotate(.12-shoot*.18);line(c,0,0,-3,10,skin,6);ellipse(c,-3,10,3,3,skin2);c.translate(-3,9);c.rotate(-.08);
  rr(c,-2,-4,46,5,2,wood,ink);rr(c,35,-3,12,3,1,bone,ink);if(shoot)line(c,47,-1,63,-1,poison,1.7);c.restore();
  if(opts.hit){c.globalAlpha*=.48;ellipse(c,0,-31,18,27,'#fff1c4');}
  c.restore();
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
  const ink='#173127',cloak='#3d8551',cloakDark='#245f38',cloakLight='#68aa72',hair='#f2f0e8',hairShade='#cfd5cf',skin='#efc1a7',mask='#171d20',steel='#dce6e3',leather='#5c4937',team=TEAM_COLORS[opts.owner||0];
  const bob=Math.sin(walk)*.85+(opts.idle?Math.sin(t*3)*.35:0),slash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Green focus ring and after-images make Yuno's rush readable without changing collision.
  if(opts.dashWindup){c.save();c.globalAlpha=.78;c.strokeStyle='#8df3ab';c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();c.ellipse(0,-24,20+Math.sin(t*20)*3,29+Math.sin(t*20)*3,0,0,TAU);c.stroke();c.restore();}
  if(opts.dashing){c.save();c.globalAlpha=.23;for(const dx of [14,25,36]){path(c,[[-10+dx,-45],[7+dx,-44],[13+dx,-8],[0+dx,1],[-13+dx,-10]],cloakLight,null);}c.restore();}
  // Short legs and small boots keep the silhouette distinctly low compared with adult fighters.
  for(const side of [-1,1]){c.save();c.translate(side*5,-8);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.42:0));line(c,0,0,side*1,12,'#24362d',5.5);rr(c,side>0?-2:-7,8,9,5,2,'#1a2520',ink);c.restore();}
  // Split green cloak with a broad hooded upper silhouette.
  path(c,[[-13,-33],[13,-33],[16,-6],[5,-12],[0,1],[-5,-12],[-16,-6]],back?cloakDark:cloak,ink,1.4);
  rr(c,-10,-34,20,23,6,'#2c4935',ink,1.2);rr(c,-10,-32,20,4,2,team,ink);
  if(back){line(c,-7,-29,7,-15,leather,2);line(c,7,-29,-7,-15,'#304f3a',2);}
  // Compact arms; the right hand carries a short dagger.
  c.save();c.translate(-10,-29);c.rotate(-.15+Math.sin(walk)*.08);line(c,0,0,-3,12,cloakDark,5.5);ellipse(c,-3,12,3,3,skin);c.restore();
  c.save();c.translate(10,-29);c.rotate(.18-slash*.9);line(c,0,0,3,12,cloakDark,5.5);ellipse(c,3,12,3,3,skin);c.translate(3,12);c.rotate(.18+slash*.65);rr(c,-4,-1,8,3,1,leather,ink);path(c,[[-1,0],[1,-19],[4,-24],[3,-15],[2,0]],steel,ink,1);c.restore();
  // Face, white hair and black eye mask. Front view intentionally leaves hair visible under the green hood.
  ellipse(c,0,-43,8.5,9.5,skin,ink,1.1);
  path(c,[[-10,-45],[-8,-56],[-2,-61],[4,-59],[10,-52],[11,-43],[7,-36],[-7,-36]],hair,ink,1.1);
  if(!back){
    path(c,[[-9,-49],[-4,-58],[1,-61],[7,-56],[11,-48],[8,-42],[7,-51],[3,-55],[1,-48],[-2,-55],[-7,-51],[-8,-42]],hairShade,null);
    path(c,[[-8,-47],[-4,-50],[0,-49],[4,-50],[8,-47],[7,-41],[-7,-41]],mask,ink,1);
    ellipse(c,-3,-45,1.5,1.2,'#a7f0bd');ellipse(c,3,-45,1.5,1.2,'#a7f0bd');
    path(c,[[-3,-38],[0,-36],[3,-38]],null,'#8f5f59',1);
  }else{
    path(c,[[-8,-48],[-4,-56],[1,-58],[7,-53],[9,-42],[4,-37],[-5,-37]],hairShade,null);
  }
  // Deep green hood and shoulder mantle.
  path(c,[[-14,-45],[-10,-57],[-2,-64],[7,-61],[14,-50],[13,-40],[8,-34],[7,-43],[3,-54],[-3,-56],[-8,-49],[-8,-37],[-13,-39]],back?cloakDark:cloak,ink,1.5);
  path(c,[[-14,-35],[0,-40],[14,-35],[10,-29],[0,-26],[-10,-29]],cloakLight,ink,1.1);
  if(opts.invulnerable){c.save();c.globalAlpha=.78;c.strokeStyle='#9af5b5';c.lineWidth=2;c.beginPath();c.ellipse(0,-27,18,27,0,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-29,17,25,'#e9ffe8');}
  c.restore();
}

function drawGoblinTrooper(c,opts={},spear=false){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#294238',skin='#7fae5e',skin2='#a4c97a',cloth='#6c573e',cloth2='#9a774d',metal='#d9d4b8',team=TEAM_COLORS[opts.owner||0];
  const hop=(moving?Math.abs(Math.sin(walk*1.35))*2.4:Math.sin(t*3)*.35),jab=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,-hop);
  for(const side of [-1,1]){line(c,side*4,-3,side*6,9,cloth,4);ellipse(c,side*7,10,5,3,'#3c503d');}
  path(c,[[-10,-27],[-17,-34],[-9,-34],[-5,-39],[0,-35],[5,-39],[9,-34],[17,-34],[10,-27]],skin,ink,1.1);
  ellipse(c,0,-23,11,10,skin);ellipse(c,-4,-25,2,2,'#fff0a7');ellipse(c,4,-25,2,2,'#fff0a7');
  if(!back){path(c,[[-4,-19],[0,-16],[4,-19]],null,ink,1.2);}
  rr(c,-10,-16,20,15,4,cloth2,ink);rr(c,-10,-15,20,5,2,team,ink);
  c.save();c.translate(-10,-12);c.rotate(.18+jab*.35);line(c,0,0,-5,10,skin2,5);ellipse(c,-5,10,3,3,skin);c.restore();
  c.save();c.translate(10,-12);c.rotate(-.18-jab*(spear?.5:.9));line(c,0,0,5,10,skin2,5);ellipse(c,5,10,3,3,skin);
  if(spear){
    const ext=8+jab*8;line(c,6,10,6,-31-ext,'#79583b',3);path(c,[[2,-31-ext],[6,-41-ext],[10,-31-ext]],metal,ink,1);
  }else{
    c.translate(5,10);c.rotate(-.4-jab*.7);line(c,0,0,1,-14,'#765237',3);path(c,[[-3,-18],[2,-14],[5,-21]],metal,ink,1);
  }
  c.restore();
  if(back){line(c,-7,-25,7,-25,'#587846',1.4);}
  if(opts.hit){c.globalAlpha*=.55;ellipse(c,0,-15,13,18,'#f8f0b9');}
  c.restore();
}
function drawMossling(c,opts={}){drawGoblinTrooper(c,opts,false);}
function drawGoblinSpear(c,opts={}){drawGoblinTrooper(c,opts,true);}


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

function drawGiantSkeleton(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#34363a',bone='#e6dfc9',bone2='#bdb7a5',dark='#565b60',wood='#8a5d3c',wood2='#b17a4e',metal='#697177',hat=opts.owner===0?'#4f9dff':'#ff5f68',fur='#edf3ef';
  const bob=(moving?Math.sin(walk*.8)*1.1:Math.sin(t*1.5)*.25),swing=attack?Math.sin((1-attack/.35)*Math.PI):0,armLift=moving?Math.sin(walk)*7:0;
  c.save();c.translate(0,bob);
  // Backpack barrel.
  c.save();c.translate(back?0:8,-43);c.rotate(back?0:.12);rr(c,-17,-28,34,48,8,wood,ink,2);rr(c,-14,-24,28,40,6,wood2);rr(c,-19,-16,38,6,3,metal,ink,1);rr(c,-19,4,38,6,3,metal,ink,1);line(c,-7,-25,-7,16,'#67442d',1.4);line(c,7,-25,7,16,'#67442d',1.4);c.restore();
  // Long heavy skeletal legs.
  for(const side of [-1,1]){c.save();c.translate(side*10,-3);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.18:0));line(c,0,0,side*2,27,bone2,8);ellipse(c,side*2,8,5,6,bone,ink,1);rr(c,side>0?-3:-12,23,15,8,4,dark,ink,1.2);c.restore();}
  // Pelvis, spine and broad rib cage.
  path(c,[[-17,-20],[-9,-29],[0,-25],[9,-29],[17,-20],[11,-11],[-11,-11]],bone2,ink,1.5);line(c,0,-24,0,-61,bone,8);
  for(const y of [-31,-39,-47,-55]){const w=23-(Math.abs(y+43)*.22);c.strokeStyle=bone;c.lineWidth=5;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(-w,y-7,-w-7,y+3);c.stroke();c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(w,y-7,w+7,y+3);c.stroke();}
  // Left arm and bony fist.
  c.save();c.translate(-24,-52+armLift);c.rotate(.05+swing*.12);line(c,0,0,-4,24,bone2,8);ellipse(c,-4,26,7,7,bone,ink,1.2);c.restore();
  // Right hand carries the bomb.
  c.save();c.translate(23,-53-armLift);c.rotate(-.05-swing*.30);line(c,0,0,4,24,bone2,8);ellipse(c,4,25,6,6,bone,ink,1.1);ellipse(c,11,32,13,13,'#34383b',ink,1.6);ellipse(c,7,28,4,3,'#7c8589');line(c,15,19,19,11,'#c3974e',2.5);ellipse(c,20,9,2.5,2.5,'#ffd66f');c.restore();
  // Skull.
  if(back){ellipse(c,0,-77,19,19,bone2,ink,1.5);line(c,-8,-75,8,-75,dark,1.5);}else{rr(c,-19,-94,38,31,11,bone,ink,1.8);ellipse(c,-7,-80,4.2,5.5,ink);ellipse(c,7,-80,4.2,5.5,ink);path(c,[[-5,-69],[0,-65],[5,-69],[4,-61],[-4,-61]],bone2,ink,1);line(c,0,-76,0,-71,dark,1.3);}
  // Fur winter hat with team color.
  path(c,[[-20,-94],[-15,-110],[-4,-118],[10,-114],[19,-102],[17,-92]],hat,ink,1.6);rr(c,-21,-99,41,10,5,fur,ink,1.3);ellipse(c,12,-115,7,7,fur,ink,1.1);
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-52,31,48,'#fff5db');}
  c.restore();
}

function drawTombstone(c,opts={}){
  const t=opts.time||0,ink='#303a36',stone='#77796f',stone2='#a0a092',stone3='#555d57',moss='#6f8759',team=TEAM_COLORS[opts.owner||0],pulse=.5+.5*Math.sin(t*4.5);
  c.save();ellipse(c,0,5,26,10,'#20363a35');path(c,[[-24,-3],[-18,-12],[18,-12],[25,-3],[19,8],[-19,8]],stone3,ink,1.5);
  path(c,[[-16,-13],[-15,-50],[-9,-62],[0,-68],[10,-62],[16,-50],[16,-13]],stone,ink,1.8);path(c,[[-11,-48],[-6,-58],[0,-61],[7,-57],[11,-47],[8,-19],[-10,-19]],stone2,null);
  rr(c,-14,-22,28,6,3,team,ink);path(c,[[-8,-42],[-2,-48],[5,-44],[2,-37],[-4,-37]],moss,null);path(c,[[9,-58],[14,-51],[11,-43],[5,-48]],moss,null);
  // skull emblem and cracks
  ellipse(c,0,-38,7,7,'#d8d1b8',ink,1);ellipse(c,-3,-39,1.4,1.7,ink);ellipse(c,3,-39,1.4,1.7,ink);rr(c,-4,-33,8,4,1,'#c7bfa5',ink,.7);line(c,-9,-54,-4,-49,ink,1.2);line(c,-4,-49,-8,-44,ink,1.2);line(c,8,-31,3,-27,ink,1.1);
  if(opts.summonCasting){c.save();c.globalAlpha=.18+.22*pulse;ellipse(c,0,-30,24,34,'#b8e7c3');c.restore();}
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-30,22,38,'#fff3c9');}c.restore();
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

function drawMiniBerserker(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#28383a',skin='#bd866e',armor='#786b63',armor2='#a38e7e',cloth='#ad5144',steel='#d6d9d1',edge='#fff1c8',leather='#6a4437',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk*1.15)*1.3:Math.sin(t*2.2)*.3),slash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Short quick legs under an oversized head/body silhouette.
  for(const side of [-1,1]){c.save();c.translate(side*7,-5);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.38:0));line(c,0,0,side,12,leather,7);rr(c,side>0?-3:-7,9,10,5,2,ink);c.restore();}
  path(c,[[-15,-32],[-9,-40],[9,-40],[16,-31],[13,-8],[-13,-8]],armor,ink,1.5);rr(c,-13,-35,26,6,2,team,ink);
  path(c,[[-10,-29],[0,-34],[10,-29],[7,-15],[-7,-15]],cloth,ink,1);
  // Giant square-ish berserker head, about the same visual mass as the torso.
  if(back){rr(c,-16,-64,32,28,8,armor2,ink);path(c,[[-13,-60],[-22,-70],[-16,-55]],steel,ink,1);path(c,[[13,-60],[22,-70],[16,-55]],steel,ink,1);}
  else{rr(c,-17,-65,34,29,9,armor2,ink);path(c,[[-14,-61],[-23,-72],[-17,-54]],steel,ink,1);path(c,[[14,-61],[23,-72],[17,-54]],steel,ink,1);rr(c,-13,-54,26,9,3,'#493d39',ink);ellipse(c,-5,-50,2.3,2.3,'#ffc072');ellipse(c,5,-50,2.3,2.3,'#ffc072');path(c,[[-7,-42],[0,-38],[7,-42]],skin,ink,.8);}
  // Oversized sword stays raised while walking, then chops down on attack.
  c.save();c.translate(14,-35);c.rotate(-2.75+slash*1.55+Math.sin(walk)*.04);line(c,0,0,0,17,armor2,8);ellipse(c,0,17,4,4,skin);c.translate(0,17);line(c,0,4,0,-42,leather,4);rr(c,-8,-3,16,4,2,'#e5b85f',ink);path(c,[[-4,-5],[-5,-42],[0,-53],[6,-42],[5,-5]],steel,ink,1.2);line(c,0,-42,1,-8,edge,1);c.restore();
  c.save();c.translate(-13,-31);c.rotate(.25+slash*.2);line(c,0,0,-2,14,armor2,7);ellipse(c,-2,14,3.5,3.5,skin);c.restore();
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-34,22,32,'#ffe5bd');}c.restore();
}

function drawMegaKnight(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#171d22',armor='#424951',armor2='#68727a',steel='#9aa5aa',black='#1c2024',black2='#343a40',glow='#f2c75b';
  const jumpState=opts.megaJumpState||null,prog=clamp(opts.megaJumpProgress||0,0,1),deployProg=clamp(opts.deployProgress??1,0,1);
  const leapArc=jumpState==='leap'?Math.sin(prog*Math.PI):0,airLift=jumpState==='leap'?leapArc*78:(opts.deploying?Math.max(0,1-deployProg)*90:0),crouch=jumpState==='windup'?7:0,airScale=jumpState==='leap'?1-leapArc*.12:1;
  const bob=jumpState?0:Math.sin(walk*.85)*.8,smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob-airLift+crouch);c.scale(airScale,airScale);
  if(jumpState==='leap'){
    c.save();c.globalAlpha=.28+.22*leapArc;
    for(const side of [-1,1]){line(c,side*30,-8,side*42,12,'#d8e3e6',2);line(c,side*25,-30,side*39,-16,'#b8c8ce',1.5);}
    c.restore();
  }
  // Massive legs and boots.
  for(const side of [-1,1]){c.save();c.translate(side*12,-10);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(jumpState?0:.12));rr(c,-7,0,14,19,4,armor2,ink);rr(c,-9,15,18,8,3,black2,ink);c.restore();}
  path(c,[[-27,-55],[-17,-65],[0,-69],[18,-64],[28,-53],[25,-11],[12,-4],[-12,-4],[-25,-12]],armor,ink,2);path(c,[[-20,-50],[-10,-59],[10,-58],[21,-49],[14,-24],[-14,-24]],armor2,ink,1.2);rr(c,-22,-45,44,7,3,team,ink);
  // Broad shoulder armor.
  rr(c,-31,-54,17,16,5,black2,ink);rr(c,14,-54,17,16,5,black2,ink);line(c,-27,-48,-17,-42,steel,1.5);line(c,27,-48,17,-42,steel,1.5);
  // Two huge black iron balls define the silhouette.
  for(const side of [-1,1]){c.save();c.translate(side*24,-37);const a=side*(.18+smash*.6);c.rotate(a);line(c,0,0,side*5,20,armor2,12);ellipse(c,side*5,20,5,5,steel);ellipse(c,side*9,31-smash*8,12,12,black,ink,1.5);ellipse(c,side*6,27-smash*8,4,4,black2);c.restore();}
  // Helmet / face.
  if(back){rr(c,-17,-82,34,25,7,black2,ink);line(c,0,-78,0,-60,steel,2);}
  else{rr(c,-18,-83,36,27,7,black2,ink);path(c,[[-14,-75],[-7,-82],[0,-78],[7,-82],[14,-75],[11,-65],[-11,-65]],armor2,ink,1);rr(c,-12,-70,24,7,2,'#15191d',ink);ellipse(c,-5,-67,2,2,glow);ellipse(c,5,-67,2,2,glow);}
  if(jumpState==='windup'){c.save();c.globalAlpha=.35+.15*Math.sin(t*12);c.strokeStyle='#ffd86a';c.lineWidth=2.5;c.beginPath();c.ellipse(0,8,34+prog*8,12+prog*3,0,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-39,32,43,'#ffe7bd');}c.restore();
}

function drawIronEye(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#1d2e27',green='#365b3f',green2='#568061',dark='#111917',leather='#5a4130',steel='#c6d0c4',blade='#e2eadc',wood='#806044';
  const spin=opts.ironSpinState==='rush',spinP=clamp(opts.ironSpinProgress||0,0,1),bob=spin?0:(moving?Math.sin(walk)*.9:Math.sin(t*2.1)*.25),draw=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);if(spin)c.rotate(spinP*TAU*1.6);
  // slim boots and legs
  for(const side of [-1,1]){c.save();c.translate(side*6,-5);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving&&!spin?.28:0));line(c,0,0,side,14,green2,6);rr(c,side>0?-3:-7,11,10,5,2,dark);c.restore();}
  // layered green assassin coat
  path(c,[[-15,-40],[-9,-49],[9,-49],[16,-39],[13,-8],[4,-15],[0,-2],[-4,-15],[-13,-8]],green,ink,1.4);
  rr(c,-13,-38,26,6,2,team,ink);path(c,[[-10,-31],[0,-38],[10,-31],[7,-12],[0,-8],[-7,-12]],green2,ink,1);
  // deep hood: face is intentionally invisible
  path(c,[[-16,-55],[-10,-70],[0,-77],[11,-70],[16,-55],[11,-43],[-11,-43]],green2,ink,1.5);
  if(back){path(c,[[-11,-61],[0,-71],[11,-61],[8,-47],[-8,-47]],green,ink,1);line(c,-8,-46,8,-46,leather,2);}
  else{path(c,[[-11,-62],[0,-70],[11,-62],[8,-50],[0,-45],[-8,-50]],dark,ink,1);ellipse(c,-4,-56,1.6,1.4,'#9ed68f');ellipse(c,4,-56,1.6,1.4,'#9ed68f');}
  // bow arm and black-iron bow
  c.save();c.translate(-14,-34);c.rotate(-.15-draw*.2);line(c,0,0,-3,15,green2,7);ellipse(c,-3,15,3.2,3.2,'#b88b69');c.translate(-8,8);c.strokeStyle=wood;c.lineWidth=3;c.beginPath();c.arc(0,0,22,-Math.PI/2,Math.PI/2);c.stroke();line(c,0,-22,0,22,'#d9d5b8',1);c.restore();
  c.save();c.translate(14,-33);c.rotate(.2+draw*.55);line(c,0,0,2,14,green2,7);ellipse(c,2,14,3.2,3.2,'#b88b69');if(!spin){line(c,2,14,23,11,steel,2);path(c,[[22,8],[31,11],[22,14]],blade,ink,.7);}c.restore();
  // concealed twin blades are visible until the once-only spin has been spent; during spin they flare outward.
  if(!opts.ironSpinUsed||spin){for(const side of [-1,1]){const reach=spin?31:16;line(c,side*6,-19,side*reach,-8,blade,spin?4:2.5);line(c,side*5,-20,side*(reach-5),-11,steel,1);}}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-34,21,31,'#eaffcf');}c.restore();
}

function drawTracker(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#20282b',armor='#657077',armor2='#8d999d',dark='#252c30',steel='#d4dcda',shieldCol='#58666b',leather='#5b4437',glow='#d6c47a';
  const hook=opts.hookState||null,hookP=clamp(opts.hookProgress||0,0,1),bob=moving?Math.sin(walk)*.8:Math.sin(t*2.1)*.2,slash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // tall, narrow armored body
  for(const side of [-1,1]){c.save();c.translate(side*7,-8);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.22:0));rr(c,-4,0,8,22,3,armor,ink);rr(c,-5,18,10,7,2,dark,ink);c.restore();}
  path(c,[[-14,-52],[-9,-62],[9,-62],[15,-51],[12,-9],[-12,-9]],armor,ink,1.5);rr(c,-12,-44,24,6,2,team,ink);path(c,[[-9,-49],[0,-56],[9,-49],[7,-19],[-7,-19]],armor2,ink,1);
  rr(c,-18,-55,10,12,4,armor2,ink);rr(c,8,-55,10,12,4,armor2,ink);
  // closed helm: no visible face
  if(back){rr(c,-12,-81,24,23,6,dark,ink);line(c,0,-77,0,-60,steel,1.5);}
  else{rr(c,-13,-82,26,25,6,dark,ink);path(c,[[-10,-75],[-4,-80],[4,-80],[10,-75],[8,-64],[-8,-64]],armor2,ink,1);rr(c,-9,-70,18,5,2,'#111618',ink);line(c,-5,-67,5,-67,glow,1.2);}
  // right hand: one-handed sword
  c.save();c.translate(14,-42);c.rotate(-.3-slash*1.0);line(c,0,0,2,17,armor2,7);ellipse(c,2,17,3.4,3.4,steel);c.translate(2,17);line(c,0,3,0,-31,leather,3.5);rr(c,-6,-2,12,3,1,steel,ink);path(c,[[-3,-4],[-3,-30],[0,-38],[4,-30],[3,-4]],steel,ink,1);c.restore();
  // left hand: small shield with compact hook spool
  c.save();c.translate(-14,-42);c.rotate(.16+(hook==='windup'?.18:0));line(c,0,0,-2,16,armor2,7);ellipse(c,-2,16,3.2,3.2,steel);c.translate(-7,9);path(c,[[-10,-12],[8,-10],[9,5],[0,13],[-10,4]],shieldCol,ink,1.5);ellipse(c,-1,0,5,5,dark,ink,1);ellipse(c,-1,0,2.5,2.5,steel);if(hook==='windup'){line(c,-1,0,-20+hookP*5,-7,steel,2);}c.restore();
  if(opts.hookAirAttackRemaining>0){c.save();c.strokeStyle='#d9e7ef';c.lineWidth=1.5;c.setLineDash([3,3]);c.beginPath();c.arc(0,-36,23,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-38,22,35,'#e4edf0');}c.restore();
}

function drawValkyrie(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#3a3029',skin='#efbd98',hair='#e46f32',hair2='#ff9a4d',fur='#d5b07c',fur2='#f0d1a3',leather='#80533b',steel='#cbd1ca',axe='#6d7370';
  const p=attack?clamp(1-attack/.5,0,1):0,spin=attack?Math.sin(p*Math.PI):0,bob=(moving?Math.sin(walk)*.8:Math.sin(t*2.1)*.22);
  // During the middle half of the swing, swap front/back art. The body remains upright;
  // only the axe circles around her, making the attack read as a standing spin instead of a rolling body.
  const viewBack=attack&&p>=.25&&p<.75?!back:back;
  const axeBehind=attack&&p>=.22&&p<.68;
  const axeAngle=attack?(-.95+p*TAU):-.45;
  const drawSpinAxe=()=>{
    c.save();
    if(attack){c.translate(0,-34);c.rotate(axeAngle);}
    else{c.translate(14,-35);c.rotate(-.45);}
    line(c,0,0,0,21,skin,8);ellipse(c,0,21,3.6,3.6,skin);
    c.translate(0,21);line(c,0,5,0,-38,leather,4);
    path(c,[[-3,-35],[7,-40],[17,-35],[12,-22],[3,-18]],axe,ink,1.3);
    path(c,[[5,-38],[15,-35],[10,-25]],steel,null);c.restore();
  };
  c.save();c.translate(0,bob);
  if(axeBehind)drawSpinAxe();
  for(const side of [-1,1]){c.save();c.translate(side*7,-6);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.22:0));line(c,0,0,side,14,skin,7);rr(c,side>0?-3:-7,11,10,5,2,leather,ink);c.restore();}
  path(c,[[-16,-41],[-10,-49],[10,-49],[17,-39],[14,-8],[5,-14],[0,-3],[-5,-14],[-14,-8]],fur,ink,1.4);
  rr(c,-13,-38,26,6,2,team,ink);path(c,[[-10,-30],[0,-36],[10,-30],[7,-13],[-7,-13]],fur2,ink,1);
  // short orange hair; switching the face/back view during the swing makes the character visibly turn.
  ellipse(c,0,-60,11,12,skin,ink,1.2);path(c,[[-12,-63],[-9,-73],[0,-78],[10,-73],[13,-63],[8,-57],[5,-68],[0,-62],[-5,-68],[-8,-57]],hair,ink,1);
  if(viewBack){path(c,[[-10,-64],[0,-73],[10,-64],[7,-54],[-7,-54]],hair2,ink,1);line(c,-7,-57,7,-57,hair,1.5);}
  else{ellipse(c,-4,-61,1.5,1.6,'#3a2a25');ellipse(c,4,-61,1.5,1.6,'#3a2a25');line(c,-3,-55,3,-55,'#a06455',1);}
  path(c,[[-13,-45],[-20,-39],[-14,-31],[-8,-37]],fur2,ink,1);path(c,[[13,-45],[20,-39],[14,-31],[8,-37]],fur2,ink,1);
  // Free hand stays near the torso. The axe hand is drawn separately and moves around the body.
  c.save();c.translate(viewBack?13:-13,-35);c.rotate(viewBack?-.18:.2);line(c,0,0,viewBack?2:-2,14,skin,7);ellipse(c,viewBack?2:-2,14,3.2,3.2,skin);c.restore();
  if(!axeBehind)drawSpinAxe();
  if(attack){c.save();c.globalAlpha=.35+.25*spin;c.strokeStyle='#ffd199';c.lineWidth=3;c.beginPath();c.arc(0,-27,35+spin*12,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-36,23,34,'#ffe8c9');}c.restore();
}

function drawGargoyle(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#202437',body='#6669a9',body2='#8b89c2',wing='#454a82',horn='#c0b6d1',beak='#303343',eye='#f5cf6b';
  const flap=Math.sin(t*12+walk)*.55,bob=Math.sin(t*5+walk)*1.4,bite=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,-19+bob);
  // compact demon wings
  for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(flap);path(c,[[6,-9],[17,-22],[26,-18],[22,-8],[28,0],[18,-1],[15,9],[9,2]],wing,ink,1.1);c.restore();}
  // small body with intentionally thick forearms
  ellipse(c,0,-2,8,12,body,ink,1.2);rr(c,-6,4,12,5,2,team,ink,.8);
  for(const side of [-1,1]){c.save();c.translate(side*7,-4);c.rotate(side*(-.2-bite*.35));line(c,0,0,side*5,12,body2,7);ellipse(c,side*5,12,3.6,3.4,body2,ink,1);for(const dy of [-2,1,4])line(c,side*8,10+dy,side*11,10+dy,horn,1);c.restore();}
  // crow-like face with devil horns
  path(c,[[-8,-16],[-5,-25],[0,-29],[6,-25],[9,-16],[5,-10],[-5,-10]],body2,ink,1.2);
  path(c,[[-5,-23],[-10,-31],[-3,-27]],horn,ink,1);path(c,[[5,-23],[10,-31],[3,-27]],horn,ink,1);
  if(back){line(c,0,-24,0,-12,wing,2);}
  else{ellipse(c,-3,-19,1.4,1.5,eye);ellipse(c,3,-19,1.4,1.5,eye);path(c,[[0,-17],[11,-14-bite*2],[1,-10],[-3,-13]],beak,ink,1);}
  // tiny clawed feet
  line(c,-4,8,-6,14,body2,3);line(c,4,8,6,14,body2,3);line(c,-6,14,-10,16,horn,1.4);line(c,6,14,10,16,horn,1.4);
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-7,13,20,'#ececff');}c.restore();
}


function drawMegaGargoyle(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#202437',body='#5e6296',body2='#8589b9',wing='#3f477a',horn='#c9c4d5',eye='#ffd86f',armor='#66727f',armor2='#9aa6ad',metal='#c2ccd0';
  const flap=Math.sin(t*9+walk)*.42,bob=Math.sin(t*4+walk)*1.1,smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,-22+bob);
  // Wider armored wings make the Mega Gargoyle clearly larger than the normal Gargoyle.
  for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(flap);path(c,[[8,-11],[22,-27],[35,-23],[31,-9],[39,0],[26,-1],[20,12],[11,3]],wing,ink,1.5);rr(c,15,-16,13,7,3,armor,ink,1);c.restore();}
  // Heavy breastplate and team-colored waist guard.
  ellipse(c,0,-3,12,17,body,ink,1.5);path(c,[[-13,-12],[0,-19],[13,-12],[11,5],[0,10],[-11,5]],armor,ink,1.5);path(c,[[-8,-10],[0,-15],[8,-10],[6,0],[0,4],[-6,0]],armor2,null);rr(c,-10,5,20,6,2,team,ink,1);
  // Armored shoulders, thick arms, and claws.
  for(const side of [-1,1]){c.save();c.translate(side*12,-7);c.rotate(side*(-.12-smash*.32));ellipse(c,0,0,7,7,armor2,ink,1.1);line(c,0,2,side*6,17,body2,9);rr(c,side>0?2:-11,12,9,8,3,armor,ink,1);for(const dy of [-1,3,7])line(c,side*8,14+dy,side*13,14+dy,horn,1.4);c.restore();}
  // Larger horned head under a metal brow plate.
  path(c,[[-11,-22],[-7,-34],[0,-39],[8,-34],[12,-22],[7,-14],[-7,-14]],body2,ink,1.4);path(c,[[-7,-32],[-14,-42],[-4,-37]],horn,ink,1);path(c,[[7,-32],[14,-42],[4,-37]],horn,ink,1);rr(c,-11,-29,22,7,3,armor,ink,1.1);
  if(back){line(c,0,-31,0,-16,wing,2.5);}else{ellipse(c,-4,-23,1.8,1.8,eye);ellipse(c,4,-23,1.8,1.8,eye);path(c,[[0,-20],[12,-17-smash*2],[1,-12],[-4,-16]],metal,ink,1.1);}
  line(c,-5,10,-8,18,body2,4);line(c,5,10,8,18,body2,4);line(c,-8,18,-13,21,horn,1.5);line(c,8,18,13,21,horn,1.5);
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-9,18,27,'#eef0ff');}c.restore();
}

function drawGargoyleSwarmCard(c,opts={}){
  const owner=opts.owner||0,time=opts.time||0,back=opts.back;
  const pts=[[-20,-5,.52],[0,-12,.58],[20,-5,.52],[-24,14,.46],[-2,13,.50],[22,14,.46]];
  for(let i=0;i<pts.length;i++){const [x,y,sc]=pts[i];drawUnit(c,'gargoyle',x,y,sc,{...opts,time:time+i*.23,owner,noShadow:true,idle:true,back});}
}


function drawBarbarian(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,team=TEAM_COLORS[opts.owner||0];
  const ink='#4f3524',skin='#dcaa78',skin2='#edc398',hair='#f2c84e',hair2='#d99f2f',leather='#7d4f32',steel='#aeb4b1';
  const bob=moving?Math.sin(walk)*1.1:Math.sin(t*2)*.3,step=Math.sin(walk)*(moving?.24:0),swing=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Big bare-chested veteran, about Iron Guard size.
  for(const side of [-1,1]){c.save();c.translate(side*8,-4);c.rotate(step*(side>0?1:-1));line(c,0,0,side*2,17,leather,8);rr(c,side>0?-3:-8,13,11,7,2,ink);c.restore();}
  path(c,[[-18,-37],[-15,-52],[-6,-59],[7,-59],[16,-50],[19,-35],[13,-15],[-13,-15]],skin,ink,1.8);rr(c,-15,-18,30,8,3,team,ink,1.2);rr(c,-13,-12,26,7,3,leather,ink,1.1);
  // Gold hair and huge moustache/beard make him instantly readable.
  ellipse(c,0,-64,13,14,skin2,ink,1.4);path(c,[[-14,-68],[-11,-79],[-4,-84],[3,-82],[11,-76],[14,-66],[8,-69],[4,-75],[-2,-72],[-7,-76],[-10,-67]],hair,ink,1.2);
  if(!opts.back){ellipse(c,-5,-64,1.6,1.7,'#2c241f');ellipse(c,5,-64,1.6,1.7,'#2c241f');path(c,[[-10,-59],[-4,-57],[0,-60],[5,-57],[11,-59],[7,-51],[0,-48],[-7,-51]],hair2,ink,1.1);}else path(c,[[-10,-65],[0,-75],[11,-65],[8,-53],[-8,-53]],hair,ink,1.1);
  // Broad arms; right hand swings a simple sword.
  c.save();c.translate(-17,-42);c.rotate(-.22+step*.2);line(c,0,0,-5,22,skin,10);ellipse(c,-6,24,5,5,skin2,ink,1);c.restore();
  c.save();c.translate(17,-42);c.rotate(.22-swing*.8-step*.15);line(c,0,0,6,20,skin,10);ellipse(c,7,22,5,5,skin2,ink,1);c.translate(8,23);c.rotate(.25);rr(c,-3,-3,6,28,2,steel,ink,1);rr(c,-8,-1,16,4,1,hair2,ink,1);c.restore();
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-40,26,40,'#fff0d4');}c.restore();
}

function drawSiegeBarbarian(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,team=TEAM_COLORS[opts.owner||0],ink='#4a3927',wood='#9b7047',wood2='#c08e58',iron='#626a69',hair='#f0c54b',skin='#dca979';
  const charged=!!opts.charged,bob=Math.sin(walk)*.7;
  c.save();c.translate(0,bob);
  // Two barbarians are visibly tucked inside a hollow wooden ram.
  for(const x of [-12,12]){ellipse(c,x,-47,8,9,skin,ink,1);path(c,[[x-8,-50],[x-6,-59],[x,-63],[x+7,-59],[x+9,-50]],hair,ink,1);ellipse(c,x-3,-47,1.2,1.3,'#2d251f');ellipse(c,x+3,-47,1.2,1.3,'#2d251f');}
  rr(c,-31,-39,62,34,8,wood,ink,2);rr(c,-26,-33,52,7,3,team,ink,1.2);for(const x of [-18,0,18])line(c,x,-37,x,-8,wood2,2);
  // Massive ram log and iron nose.
  rr(c,-37,-28,70,15,7,wood2,ink,1.8);path(c,[[31,-30],[43,-25],[43,-16],[31,-12]],iron,ink,1.4);ellipse(c,42,-21,5,8,'#8f9894',ink,1);
  for(const x of [-21,21]){ellipse(c,x,2,10,10,ink);ellipse(c,x,2,6,6,wood2,ink,1);}
  if(charged){c.save();c.globalAlpha=.65+.2*Math.sin(t*12);for(const y of [-34,-22,-10])line(c,-48,y,-68,y+2,'#ffd56a',2.2);c.strokeStyle='#ffd56a';c.lineWidth=2.5;c.beginPath();c.arc(36,-21,16,0,TAU);c.stroke();c.restore();}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-21,38,30,'#fff0d0');}c.restore();
}

function drawOven(c,opts={}){
  const t=opts.time||0,team=TEAM_COLORS[opts.owner||0],ink='#3f3931',metal='#6f756f',metal2='#9aa09a',pot='#4b4e4a',rim='#777b75',fire='#f06b35',hot='#ffd05c',boil=.5+.5*Math.sin(t*4.2);
  c.save();ellipse(c,0,6,31,11,'#20363a35');
  rr(c,-27,-26,54,34,6,metal,ink,2);rr(c,-22,-20,44,8,3,team,ink,1.2);rr(c,-20,-7,40,10,3,'#4d504c',ink,1.2);
  for(const x of [-12,12]){ellipse(c,x,-2,5,3,fire);ellipse(c,x,-4,3+boil,5+boil,hot);}
  // Oversized pot above the square stove.
  path(c,[[-24,-31],[-20,-55],[20,-55],[24,-31],[17,-20],[-17,-20]],pot,ink,2);rr(c,-27,-58,54,7,3,rim,ink,1.5);rr(c,-8,-65,16,8,4,metal2,ink,1.2);
  c.globalAlpha=.22+.12*boil;ellipse(c,0,-50,18,9,'#ff7b38');c.globalAlpha=1;
  for(const x of [-11,0,11])ellipse(c,x,-51-(x===0?5:0)-boil*3,3+boil,3+boil,x===0?hot:fire);
  if(opts.hit){c.globalAlpha=.4;ellipse(c,0,-30,30,37,'#fff1c3');}
  c.restore();
}

function drawElixirGolem(c,opts={},stage=1){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#713d67',pink=stage===2?'#ed9ad0':'#e88ac5',pink2=stage===2?'#f7b7df':'#f5a9d8',deep='#c65aa1',glow='#fff0ff',team=TEAM_COLORS[opts.owner||0];
  const squish=(moving?Math.sin(walk)*.03:Math.sin(t*2.4)*.025),bob=(moving?Math.sin(walk)*1.1:Math.sin(t*2)*.4),smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);c.scale(1+squish,1-squish);
  // Soft, squat slime legs.
  for(const side of [-1,1]){c.save();c.translate(side*11,-3);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.16:0));ellipse(c,0,8,11,8,pink,ink,1.4);ellipse(c,side*2,5,5,3,pink2);c.restore();}
  // Fat golem torso, intentionally rounder than the Stone Golem.
  path(c,[[-27,-45],[-20,-61],[-8,-70],[8,-70],[21,-61],[29,-44],[25,-21],[14,-10],[-14,-10],[-25,-22]],pink,ink,2);
  ellipse(c,-7,-50,9,13,pink2);ellipse(c,10,-32,8,12,deep+'88');rr(c,-14,-22,28,6,3,team,ink);
  // Broad slime shoulders and oversized arms.
  for(const side of [-1,1]){c.save();c.scale(side,1);path(c,[[17,-57],[30,-63],[43,-57],[48,-43],[44,-29],[34,-20],[25,-28],[22,-42]],pink,ink,1.7);ellipse(c,35,-48,8,10,pink2);c.translate(39,-24+smash*6);ellipse(c,0,13+smash*4,14,17,pink,ink,1.8);ellipse(c,-3,7+smash*4,6,8,pink2);c.restore();}
  // Low head embedded in the body.
  if(back){ellipse(c,0,-61,17,15,pink,ink,1.6);ellipse(c,0,-64,8,6,pink2);}
  else{ellipse(c,0,-61,18,16,pink2,ink,1.6);path(c,[[-12,-66],[-5,-71],[0,-68],[6,-71],[13,-65]],deep,ink,.8);ellipse(c,-6,-61,2.4,2.8,glow);ellipse(c,6,-61,2.4,2.8,glow);path(c,[[-6,-53],[0,-50],[7,-54]],null,ink,1.4);}
  // Elixir bubbles inside the translucent body.
  c.save();c.globalAlpha=.5;for(const [x,y,r] of [[-11,-35,3],[7,-42,2.5],[12,-18,2],[-5,-17,2]])ellipse(c,x,y,r,r,glow);c.restore();
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-38,34,41,'#fff1fb');}c.restore();
}

function drawElixirBlob(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,moving=opts.moving??walk!==0,ink='#713d67',pink='#f0a4d7',pink2='#ffd0eb',glow='#fff4ff';
  const bounce=(moving?Math.abs(Math.sin(walk))*2:Math.sin(t*3)*.7);
  c.save();c.translate(0,-5-bounce);c.scale(1+.05*Math.sin(t*4),1-.05*Math.sin(t*4));
  ellipse(c,0,0,15,13,pink,ink,1.5);ellipse(c,-5,-5,5,4,pink2);ellipse(c,-5,-1,2,2,glow);ellipse(c,5,-1,2,2,glow);path(c,[[-5,5],[0,7],[5,4]],null,ink,1.1);
  c.save();c.globalAlpha=.45;ellipse(c,4,-7,2.5,2.5,glow);c.restore();if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,0,17,15,'#fff0fa');}c.restore();
}

function drawIceGolem(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#315466',ice='#9edff4',ice2='#d7f6ff',ice3='#72bcd7',deep='#4d8ca7',glow='#f4fdff',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk)*.65:Math.sin(t*1.8)*.22),smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Compact icy feet and a squat, heavy body.
  for(const side of [-1,1]){c.save();c.translate(side*9,-4);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.11:0));path(c,[[-7,-11],[7,-12],[10,1],[6,9],[-9,9],[-11,0]],ice3,ink,1.4);path(c,[[-8,3],[8,2],[12,10],[-10,10]],ice2,ink,1.1);c.restore();}
  path(c,[[-23,-41],[-17,-57],[-6,-66],[8,-65],[20,-55],[25,-39],[20,-21],[10,-12],[-11,-12],[-22,-23]],ice,ink,1.8);
  path(c,[[-16,-46],[-7,-58],[5,-60],[15,-51],[17,-39],[8,-35],[-10,-36]],ice2,null);
  path(c,[[-12,-23],[0,-30],[12,-23],[8,-13],[-8,-13]],deep,ink,1.0);rr(c,-12,-22,24,5,3,team,ink);
  // Ice crystal shoulders and stubby arms.
  for(const side of [-1,1]){c.save();c.scale(side,1);path(c,[[13,-53],[24,-61],[35,-57],[40,-47],[36,-35],[26,-31],[18,-39]],ice2,ink,1.5);path(c,[[23,-61],[29,-73],[34,-59]],glow,ink,1.0);c.translate(30,-30+smash*5);c.rotate(.08+smash*.10);path(c,[[-8,-8],[8,-10],[12,7],[7,16],[-10,15],[-13,5]],ice3,ink,1.5);c.restore();}
  // Low angular head with cold blue eyes.
  if(back){path(c,[[-14,-56],[-8,-68],[2,-72],[13,-65],[15,-53],[8,-45],[-9,-46]],ice3,ink,1.4);path(c,[[-8,-61],[1,-67],[9,-61],[6,-50],[-7,-50]],ice,ink,1);}
  else{path(c,[[-15,-56],[-9,-68],[1,-73],[12,-67],[16,-55],[10,-45],[0,-41],[-11,-46]],ice2,ink,1.5);path(c,[[-10,-58],[-3,-63],[0,-59],[-7,-55]],deep,ink,.7);path(c,[[10,-58],[3,-63],[0,-59],[7,-55]],deep,ink,.7);ellipse(c,-5,-57,2.5,2.2,'#4ed8ff');ellipse(c,5,-57,2.5,2.2,'#4ed8ff');path(c,[[-8,-49],[0,-46],[8,-49],[6,-42],[-6,-42]],deep,ink,1);}
  // Cracks and frost glints make it read as ice rather than stone.
  line(c,-13,-36,-5,-31,glow,1.5);line(c,-5,-31,-9,-24,glow,1.3);line(c,8,-52,13,-47,glow,1.3);ellipse(c,-13,-50,2,4,glow+'bb');ellipse(c,9,-27,2.2,3.5,glow+'bb');
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-35,28,36,'#e8fbff');}
  c.restore();
}

function drawRoyalGiant(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#3d352e',skin='#d7a777',skin2='#efc79c',hair='#e3bd55',gold='#e2bd57',red='#9f4f48',cloth='#6e8090',cloth2='#9aa8af',metal='#555e62',metal2='#879297',team=TEAM_COLORS[opts.owner||0];
  const bob=(moving?Math.sin(walk)*.7:Math.sin(t*1.8)*.2),recoil=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // Heavy boots and legs.
  for(const side of [-1,1]){c.save();c.translate(side*10,-7);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.15:0));rr(c,-7,0,14,20,4,cloth,ink);rr(c,-9,16,18,8,3,metal,ink);c.restore();}
  // Huge torso and royal sash.
  path(c,[[-25,-55],[-16,-67],[16,-67],[26,-54],[23,-13],[12,-6],[-12,-6],[-23,-14]],cloth2,ink,2);rr(c,-22,-47,44,7,3,team,ink);path(c,[[-18,-40],[18,-40],[12,-19],[-12,-19]],red,ink,1);line(c,-15,-41,14,-18,gold,3);
  // Cannon arm: shoulder -> forearm -> handheld barrel.
  c.save();c.translate(24,-48);c.rotate(.18+recoil*.18);line(c,0,0,7,18,skin,13);ellipse(c,7,18,6,6,skin2);c.translate(9,14-recoil*4);c.rotate(-.08);rr(c,-3,-8,39,17,5,metal,ink,1.7);rr(c,24,-10,17,21,5,metal2,ink,1.5);ellipse(c,41,0,8,10,'#30373a',ink,1.5);line(c,5,-5,25,-5,'#aeb8b8',2);c.restore();
  // Other hand visibly carries a cannonball.
  c.save();c.translate(-24,-47);c.rotate(-.12-recoil*.12);line(c,0,0,-6,19,skin,13);ellipse(c,-7,19,6,6,skin2);ellipse(c,-11,27-recoil*3,10,10,'#30373a',ink,1.5);ellipse(c,-14,24-recoil*3,3,3,'#899193');c.restore();
  // Head, blond hair/beard and crown.
  if(back){ellipse(c,0,-75,17,18,hair,ink,1.4);ellipse(c,0,-72,13,14,skin,ink,1);}
  else{ellipse(c,0,-75,17,18,skin2,ink,1.5);path(c,[[-16,-83],[-9,-91],[0,-94],[10,-91],[17,-82],[11,-86],[4,-84],[-4,-85],[-11,-82]],hair,ink,1);path(c,[[-13,-69],[-8,-60],[0,-57],[9,-61],[14,-70],[7,-67],[0,-64],[-7,-67]],hair,ink,1);ellipse(c,-5,-76,1.8,1.8,ink);ellipse(c,5,-76,1.8,1.8,ink);}
  path(c,[[-13,-92],[-9,-106],[-3,-98],[0,-109],[5,-98],[12,-105],[14,-91]],gold,ink,1.4);ellipse(c,0,-96,3,3,'#d95c54');
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-47,31,45,'#ffe8c4');}c.restore();
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
  const ink='#29384a',feather='#42638f',feather2='#85b4df',storm='#ffe16e',storm2='#c6f3ff',cloth='#304b70',skin='#d9ad91',team=TEAM_COLORS[opts.owner||0];
  const flap=Math.sin(t*9.4+walk)*.34,cast=attack?Math.sin((1-attack/.35)*Math.PI):0,pulse=.5+.5*Math.sin(t*12);
  c.save();c.translate(0,-18+Math.sin(t*4.2)*1.8);
  // Lightning-bolt wings: narrow roots, sharp zig-zag tips.
  for(const side of [-1,1]){
    c.save();c.scale(side,1);c.rotate(flap);
    path(c,[[4,-25],[18,-45],[35,-48],[27,-34],[43,-34],[29,-21],[44,-17],[25,-12],[35,2],[15,-8],[7,3]],feather,ink,1.6);
    path(c,[[10,-24],[23,-38],[20,-25],[34,-29],[24,-17]],feather2,null);
    path(c,[[30,-43],[25,-34],[32,-35],[25,-24]],storm,ink,.6);
    c.restore();
  }
  // Slim torso keeps her clearly separate from both dragons.
  path(c,[[-10,-37],[10,-37],[13,-8],[0,1],[-13,-8]],cloth,ink,1.4);rr(c,-10,-35,20,6,2,team);
  path(c,[[-6,-31],[0,-38],[6,-31],[3,-15],[0,-10],[-3,-15]],feather2,ink,.8);
  for(const side of [-1,1]){
    c.save();c.translate(side*10,-31);c.rotate(side*(.35+cast*.55));line(c,0,0,side*8,14,skin,6);ellipse(c,side*8,14,3,3,skin);
    if(!back){line(c,side*9,15,side*15,7,storm,2.4);line(c,side*15,7,side*11,1,storm2,2);line(c,side*11,1,side*18,-4,storm,2);}
    c.restore();
  }
  // Thunder crest / wind-swept hair.
  path(c,[[-11,-48],[-8,-61],[-2,-68],[2,-76],[5,-64],[11,-70],[8,-57],[12,-47]],feather,ink,1.4);
  if(back){
    path(c,[[-8,-55],[0,-65],[8,-55],[6,-42],[-6,-42]],cloth,ink,1);
    path(c,[[-4,-63],[0,-70],[4,-63],[0,-57]],storm,null);
  }else{
    ellipse(c,0,-51,9,10,skin);ellipse(c,-3,-52,1.7,1.9,storm);ellipse(c,4,-52,1.7,1.9,storm);
    path(c,[[-9,-60],[-2,-67],[0,-74],[4,-65],[10,-61]],feather2,ink,1);
  }
  // Long hooked talons reinforce the bird silhouette.
  for(const side of [-1,1]){
    path(c,[[side*6,-6],[side*10,10],[side*3,21]],'#6e6465',ink,1);
    line(c,side*3,21,side*9,26,'#403d44',2.2);line(c,side*3,21,side*1,28,'#403d44',2.2);
  }
  // Small roaming arcs read as "storm" even while idle.
  c.save();c.globalAlpha=.35+.25*pulse;
  for(let i=0;i<3;i++){const a=t*2.2+i*TAU/3,r=25+i*2;const x=Math.cos(a)*r,y=-30+Math.sin(a)*r*.55;line(c,x,y,x+4*Math.cos(a+.8),y+5*Math.sin(a+.8),i%2?storm2:storm,1.2);}
  c.restore();
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-32,20,32,'#e9eeff');}c.restore();
}

function drawElekitelWizard(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#253a47',robe='#3f6f8e',robe2='#6ea7bf',electric='#ffe36d',electric2='#bdf3ff',metal='#8f9aa1',skin='#e0b48f',team=TEAM_COLORS[opts.owner||0];
  const bob=Math.sin(walk)*.8+(moving?0:Math.sin(t*2.5)*.35),cast=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*6,-7);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.25:0));line(c,0,0,0,14,'#3e5260',7);rr(c,-5,10,10,6,2,ink);c.restore();}
  path(c,[[-17,-42],[17,-42],[21,-5],[5,-14],[0,0],[-6,-14],[-21,-5]],robe,ink,1.5);rr(c,-15,-39,30,7,3,team);
  if(back){path(c,[[-10,-35],[0,-43],[10,-35],[7,-17],[0,-12],[-7,-17]],robe2,ink,1);line(c,-8,-29,8,-18,electric2,1.5);}
  else{path(c,[[-8,-34],[0,-40],[8,-34],[5,-21],[0,-16],[-5,-21]],robe2,ink,1);ellipse(c,0,-27,3,3,electric);}
  // coil staff and casting hand
  c.save();c.translate(15,-31);c.rotate(-.12-cast*.55);line(c,0,0,2,16,robe2,8);ellipse(c,2,16,3.5,3.5,skin);line(c,2,16,3,-33,'#746151',4);ellipse(c,3,-38,8,8,metal);ellipse(c,3,-38,4,4,electric2);c.strokeStyle=electric;c.lineWidth=2;c.beginPath();c.arc(3,-38,12+cast*5,0,TAU);c.stroke();c.restore();
  c.save();c.translate(-15,-31);c.rotate(.12+cast*.5);line(c,0,0,-3,15,robe2,8);ellipse(c,-3,15,3.5,3.5,skin);if(!back){line(c,-3,15,-11,7,electric,2);line(c,-11,7,-6,1,electric2,2);}c.restore();
  const hy=-55;path(c,[[-14,hy+7],[-12,hy-10],[0,hy-20],[13,hy-10],[14,hy+7],[8,hy+13],[-8,hy+13]],robe2,ink,1.4);
  if(back){path(c,[[-9,hy-6],[0,hy-15],[9,hy-6],[7,hy+9],[-7,hy+9]],robe,ink,1);}else{ellipse(c,0,hy,10,10,skin);ellipse(c,-4,hy-1,1.6,1.8,electric);ellipse(c,4,hy-1,1.6,1.8,electric);}
  // small electrical arcs around the silhouette
  for(let i=0;i<4;i++){const a=t*2.8+i*TAU/4,r=24+3*Math.sin(t*4+i);const x=Math.cos(a)*r,y=-34+Math.sin(a)*r*.65;line(c,x,y,x+Math.cos(a+.7)*6,y+Math.sin(a+.7)*5,i%2?electric:electric2,1.4);}
  if(opts.hit){c.globalAlpha*=.48;ellipse(c,0,-33,20,31,'#e6fbff');}c.restore();
}

function drawStoneGolem(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0;
  const ink='#2c3733',stone='#8e8b80',stoneLight='#b9b19c',stoneMid='#777a70',stoneDark='#59625d',moss='#71885a',moss2='#98aa6d',rune='#70d8ff',eye='#ffd34f';
  const team=TEAM_COLORS[opts.owner||0],back=!!opts.back;
  const bob=(moving?Math.sin(walk)*.8:Math.sin(t*1.45)*.24),smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);

  // Short, thick legs sit behind the enormous front arms so the unit reads as top-heavy.
  for(const side of [-1,1]){
    const step=Math.sin(walk+(side>0?Math.PI:0))*(moving?.10:0);
    c.save();c.translate(side*13,-4);c.rotate(step);
    path(c,[[-9,-24],[7,-25],[11,-11],[8,3],[-9,3],[-13,-10]],stoneMid,ink,1.5);
    path(c,[[-10,-5],[8,-6],[14,5],[10,14],[-13,14],[-16,4]],stoneDark,ink,1.5);
    rr(c,-15,10,30,11,4,'#505953',ink);line(c,-8,14,10,14,'#a3a594',1.1);
    c.restore();
  }

  // Wide forward-pitched torso. The low chest and huge shoulder line create the gorilla silhouette.
  path(c,[[-31,-45],[-22,-63],[-7,-72],[10,-70],[25,-61],[33,-45],[25,-23],[12,-12],[-12,-12],[-26,-24]],stone,ink,2);
  path(c,[[-23,-47],[-12,-62],[2,-67],[17,-61],[25,-47],[16,-39],[-16,-39]],stoneLight,null);
  path(c,[[-15,-24],[0,-33],[15,-24],[11,-13],[-11,-13]],stoneDark,ink,1.1);
  rr(c,-14,-23,28,6,3,team,ink);

  // Back slab / ridge keeps the mass behind the lowered head.
  path(c,[[-23,-64],[-8,-78],[10,-77],[27,-64],[21,-56],[-18,-56]],stoneMid,ink,1.5);
  path(c,[[-18,-69],[-8,-75],[0,-73],[-7,-65]],moss2,null);
  path(c,[[8,-74],[20,-67],[24,-59],[14,-62]],moss,null);

  // Massive shoulders grow sideways first, matching the wide reference silhouette.
  for(const side of [-1,1]){
    c.save();c.scale(side,1);
    path(c,[[15,-62],[27,-71],[41,-69],[51,-59],[50,-46],[40,-39],[27,-42],[18,-51]],stoneLight,ink,1.8);
    path(c,[[20,-62],[31,-67],[43,-62],[47,-54],[38,-52],[28,-55]],'#a49f8f',null);
    path(c,[[24,-69],[34,-67],[40,-61],[31,-62]],moss2,null);
    path(c,[[39,-48],[47,-45],[44,-39],[34,-42]],moss,null);

    // Shoulder rune: a small glowing angular spiral.
    c.strokeStyle=rune;c.lineWidth=2.1;c.lineJoin='round';c.beginPath();
    c.moveTo(30,-58);c.lineTo(39,-58);c.lineTo(42,-54);c.lineTo(42,-48);c.lineTo(35,-45);c.lineTo(31,-49);c.lineTo(35,-53);c.stroke();
    c.restore();
  }

  // Low head wedged between the shoulders. Front keeps the established glowing rune eyes.
  if(back){
    path(c,[[-17,-63],[-12,-75],[0,-81],[13,-75],[18,-63],[13,-50],[-13,-50]],stoneMid,ink,1.5);
    path(c,[[-11,-70],[0,-77],[11,-70],[8,-56],[-8,-56]],stone,ink,1);
    c.strokeStyle=rune;c.lineWidth=2.2;c.beginPath();c.arc(0,-61,8,.25,Math.PI*1.75);c.stroke();line(c,5,-65,10,-61,rune,1.7);
  }else{
    path(c,[[-18,-62],[-13,-75],[-2,-82],[12,-77],[19,-64],[14,-50],[0,-45],[-14,-50]],stoneLight,ink,1.7);
    path(c,[[-15,-62],[-7,-70],[0,-72],[8,-69],[15,-62],[11,-55],[-11,-55]],stone,ink,1.2);
    // Heavy brow and recessed eyes.
    path(c,[[-12,-65],[-4,-69],[-1,-65],[-8,-61]],stoneDark,ink,.8);
    path(c,[[12,-65],[4,-69],[1,-65],[8,-61]],stoneDark,ink,.8);
    ellipse(c,-6,-64,3.2,2.7,eye);ellipse(c,6,-64,3.2,2.7,eye);
    ellipse(c,-6,-64,1.5,1.3,rune);ellipse(c,6,-64,1.5,1.3,rune);
    // Blocky jaw/muzzle.
    path(c,[[-12,-55],[-6,-51],[-2,-54],[2,-51],[7,-54],[12,-51],[10,-43],[0,-40],[-10,-43]],stoneDark,ink,1.1);
    for(const x of [-7,0,7])rr(c,x-3,-50,6,8,2,'#7c8075',ink);
  }

  // Huge upper arms extend sideways first, then sway up/down while moving.
  for(const side of [-1,1]){
    const lead=side>0?smash:smash*.18;
    const armPhase=walk*.6+(side>0?0:Math.PI);
    const armLift=moving&&!attack?Math.sin(armPhase)*4.8:0;
    const armTilt=moving&&!attack?Math.sin(armPhase)*.11:0;
    const fistLift=moving&&!attack?Math.sin(armPhase)*3.2:0;
    c.save();c.scale(side,1);
    // Upper arm boulder chain.
    path(c,[[35,-48],[48,-47],[57,-37],[57,-24],[48,-18],[38,-24],[31,-36]],stone,ink,1.8);
    path(c,[[42,-44],[51,-39],[53,-31],[48,-27],[40,-31]],stoneLight,null);
    path(c,[[47,-43],[54,-38],[52,-32],[45,-35]],moss2,null);

    // Forearm hangs almost vertically in front; when moving, it gently bobs up/down.
    c.save();c.translate(49+lead*4,-22+lead*8+armLift);c.rotate(-.08+lead*.12+armTilt);
    path(c,[[-11,-5],[9,-7],[16,6],[14,22],[8,32],[-10,32],[-16,20],[-17,5]],stoneMid,ink,1.8);
    path(c,[[-7,-2],[5,-4],[10,7],[8,19],[1,23],[-8,18]],stoneLight,null);
    path(c,[[-12,7],[-6,1],[1,3],[-3,12]],moss,null);
    // Forearm rune.
    c.strokeStyle=rune;c.lineWidth=1.9;c.beginPath();c.moveTo(5,8);c.lineTo(10,12);c.lineTo(7,18);c.lineTo(2,17);c.lineTo(4,13);c.stroke();

    // Enormous fist/knuckles planted toward the front of the unit.
    c.translate(1,31+lead*4+fistLift);
    path(c,[[-17,-4],[-8,-11],[8,-11],[18,-2],[17,10],[10,16],[-12,16],[-19,8]],stone,ink,2);
    path(c,[[-14,0],[-9,-7],[-3,-8],[-2,9],[-9,12]],stoneLight,ink,.8);
    path(c,[[-2,-9],[5,-9],[7,10],[0,11]],'#9f9b8d',ink,.8);
    path(c,[[7,-8],[13,-4],[15,8],[8,12]],stoneLight,ink,.8);
    c.restore();
    c.restore();
  }

  // Moss drapes and chest rune preserve the established TINY SIEGE identity.
  path(c,[[-28,-43],[-21,-37],[-24,-28],[-15,-31],[-10,-23],[-7,-36]],moss2,null);
  path(c,[[15,-57],[23,-52],[19,-45],[29,-40],[18,-36],[13,-44]],moss,null);
  c.save();c.globalAlpha=.9;c.strokeStyle=rune;c.lineWidth=2.0;c.beginPath();c.moveTo(-5,-32);c.lineTo(0,-36);c.lineTo(6,-32);c.lineTo(2,-27);c.lineTo(-2,-29);c.stroke();c.restore();

  if(opts.hit){c.globalAlpha*=.38;ellipse(c,0,-38,39,43,'#fff5c9');}
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

function drawNecromancer(c,opts={},darkMode=false){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back;
  const ink='#202d37',team=TEAM_COLORS[opts.owner||0],robe=darkMode?'#30283f':'#57466f',robe2=darkMode?'#55436b':'#77618f',bone='#ddd6bc',glow=darkMode?'#dd75cf':'#91dfb1',staff=darkMode?'#54415f':'#695a4e';
  const bob=(moving?Math.sin(walk)*1.1:Math.sin(t*2.2)*.45),pulse=.65+.35*Math.sin(t*5),cast=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*7,-8);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.32:0));line(c,0,0,0,15,robe2,7);rr(c,-5,11,10,6,2,ink);c.restore();}
  path(c,[[-17,-39],[17,-39],[22,-5],[8,2],[0,-8],[-8,2],[-22,-5]],robe,ink,1.6);rr(c,-14,-36,28,7,3,team,ink);
  if(back){line(c,-9,-31,8,-12,'#8e7b7c',2.5);path(c,[[-6,-26],[0,-34],[6,-26],[0,-18]],glow,ink,1);}
  else {path(c,[[-9,-29],[0,-22],[9,-29],[6,-13],[-6,-13]],robe2,ink,1);path(c,[[-4,-25],[0,-31],[4,-25],[0,-19]],glow,null);}
  c.save();c.translate(14,-31);c.rotate(-.2-cast*.22);line(c,0,0,4,15,robe2,8);ellipse(c,4,15,4,4,bone);c.translate(4,15);line(c,0,10,0,-43,staff,4);ellipse(c,0,-48,9,8,bone);ellipse(c,-3,-50,2,2,ink);ellipse(c,3,-50,2,2,ink);ellipse(c,0,-44,2,2,glow);c.globalAlpha=.35+.35*pulse;ellipse(c,0,-47,14+cast*5,13+cast*5,glow);c.restore();
  c.save();c.translate(-14,-31);c.rotate(.25+cast*.35);line(c,0,0,-3,14,robe2,8);ellipse(c,-3,14,4,4,bone);if(cast){c.globalAlpha=.45+.35*pulse;ellipse(c,-8,21,7+cast*5,7+cast*5,glow);}c.restore();
  path(c,[[-15,-48],[-11,-64],[0,-73],[12,-64],[16,-48],[10,-37],[-10,-37]],darkMode?'#292234':'#4c3e61',ink,1.7);
  if(back){line(c,0,-64,0,-41,robe2,1.5);}else{rr(c,-10,-53,20,12,5,'#1f2931',ink);ellipse(c,-4,-48,2,2,glow);ellipse(c,4,-48,2,2,glow);path(c,[[-5,-42],[0,-38],[5,-42]],bone,ink,.8);}
  if(opts.hit){c.globalAlpha*=.5;ellipse(c,0,-31,22,30,'#fff0d2');}c.restore();
}
function drawPrincessArcher(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#423746',dress='#d99ab8',dress2='#f0c7d9',gold='#e8c36d',skin='#f0c7a2',wood='#9a663f';
  const bob=(moving?Math.sin(walk)*1.1:Math.sin(t*2)*.4),draw=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){c.save();c.translate(side*7,-8);c.rotate(Math.sin(walk+(side>0?Math.PI:0))*(moving?.25:0));line(c,0,0,0,14,'#785b68',6);rr(c,-4,11,8,5,2,ink);c.restore();}
  path(c,[[-16,-40],[16,-40],[20,-5],[8,1],[0,-7],[-8,1],[-20,-5]],dress,ink,1.5);rr(c,-13,-37,26,6,2,team,ink);
  if(back){path(c,[[-10,-34],[0,-27],[10,-34],[7,-12],[-7,-12]],dress2,ink,1);}
  else{path(c,[[-9,-32],[0,-25],[9,-32],[6,-14],[-6,-14]],dress2,ink,1);}
  // Oversized royal bow: intentionally large so the slow-movement concept reads instantly.
  c.save();c.translate(back?-18:-20,-31);c.rotate(-.08-draw*.08);c.strokeStyle=wood;c.lineWidth=4;c.beginPath();c.arc(0,7,31,-Math.PI/2,Math.PI/2);c.stroke();line(c,0,-24,0,38,'#f2e4c2',1.2);line(c,0,7,34+draw*8,7,'#f4e7c6',2.2);path(c,[[33+draw*8,3],[42+draw*8,7],[33+draw*8,11]],gold,ink,.8);c.restore();
  for(const side of [-1,1]){c.save();c.translate(side*12,-33);c.rotate(side*.15);line(c,0,0,side*3,13,dress2,7);ellipse(c,side*3,13,3.5,3.5,skin);c.restore();}
  path(c,[[-12,-50],[-9,-64],[0,-71],[10,-64],[13,-50],[8,-41],[-8,-41]],'#7e5269',ink,1.4);
  if(back){path(c,[[-10,-58],[0,-67],[10,-58],[8,-45],[-8,-45]],'#b77896',ink,1);}
  else{ellipse(c,0,-51,9,10,skin);ellipse(c,-3,-52,1.4,1.5,'#44313a');ellipse(c,3,-52,1.4,1.5,'#44313a');path(c,[[-10,-61],[-5,-70],[0,-64],[5,-70],[11,-61]],gold,ink,1);ellipse(c,0,-68,2.5,2.5,'#8ed7e7');}
  if(opts.hit){c.globalAlpha*=.48;ellipse(c,0,-31,21,31,'#fff3dc');}c.restore();
}

function drawSparky(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,team=TEAM_COLORS[opts.owner||0];
  const ink='#263b42',metal='#697b7e',metal2='#aebbb4',coil='#d6ae4f',electric='#a8ecff';
  const bob=(moving?Math.sin(walk)*.7:Math.sin(t*2)*.25),charge=opts.sparkCharged?1:clamp(opts.sparkChargeProgress??(opts.idle?.78:0),0,1),pulse=.65+.35*Math.sin(t*12);
  c.save();c.translate(0,bob);
  for(const side of [-1,1]){rr(c,side*19-7,-7,14,22,5,'#3d4b4c',ink);line(c,side*19-4,-2,side*19+4,-2,'#83918d',2);}
  ellipse(c,0,-2,27,12,'#263a3d');path(c,[[-22,-19],[-13,-34],[13,-34],[23,-19],[20,-4],[-20,-4]],metal,ink,1.8);rr(c,-15,-31,30,7,2,team,ink);
  // Large charge chamber and cannon mouth.
  ellipse(c,0,-35,15,12,metal2);ellipse(c,0,-36,10,8,'#34484d');ellipse(c,0,-37,6,5,charge>.98?'#efffff':'#72949b');
  c.save();c.translate(0,-38);c.rotate((opts.facing??-Math.PI/2)+Math.PI/2);rr(c,-10,-34,20,34,6,'#51666b',ink);rr(c,-8,-34,16,8,3,'#b9c5bc');ellipse(c,0,-35,7,4,ink);if(attack){ellipse(c,0,-42,10+Math.sin(t*35)*3,12,'#fff3aa');}c.restore();
  for(const x of [-13,13]){ellipse(c,x,-24,6,8,coil);line(c,x-4,-25,x+4,-25,'#f6df8c',1.5);}
  if(charge>0){c.save();c.globalAlpha=.18+.5*charge*pulse;c.strokeStyle=electric;c.lineWidth=1.6+2.2*charge;c.beginPath();c.arc(0,-35,18+8*charge,0,TAU);c.stroke();for(let i=0;i<6;i++){const a=i*TAU/6+t*3,r=20+charge*12;const x=Math.cos(a)*r,y=-35+Math.sin(a)*r*.55;line(c,x,y,x+Math.cos(a+.8)*(5+charge*7),y+Math.sin(a+.8)*(4+charge*5),i%2?'#e9fbff':'#8edcff',1.2+charge);};c.restore();}
  if(opts.sparkCharged){c.save();c.globalAlpha=.85+.12*pulse;ellipse(c,0,-37,11+2*pulse,9+2*pulse,'#e9ffff');ellipse(c,0,-37,5,4,'#fff2a2');c.restore();}
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-24,29,31,'#fff6c6');}c.restore();
}

function drawDosranboss(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,moving=opts.moving??walk!==0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#203744',blue='#4a86c8',blue2='#79abd8',beak='#f1c93b',beak2='#ffd95a',crest='#ef7a2e',claw='#182028';
  const bob=(moving?Math.sin(walk)*.85:Math.sin(t*2)*.28),stride=moving?Math.sin(walk)*3.7:0,bite=attack?Math.sin((1-attack/.35)*Math.PI):0,tailSwing=moving?Math.sin(walk*.9)*4.2:Math.sin(t*2.1)*1.6;
  c.save();c.translate(0,bob);
  path(c,[[10,-4],[23,0+tailSwing*.08],[34,9+tailSwing*.1],[42,18],[38,17],[30,12],[22,5],[14,1]],blue,ink,1.2);
  path(c,[[16,-1],[27,5],[31,11],[26,10],[20,6]],blue2,null);
  for(const side of [-1,1]){
    const s=side<0?stride:-stride;
    c.save();c.translate(side*10,2);
    rr(c,-3,-8-s*.08,7,19,2,blue2,ink,1.1);
    rr(c,-4,10+s*.05,8,10,2,blue,ink,1.0);
    rr(c,-6,19+s*.03,12,5,1,beak2,ink,1);
    for(const x of [-5,-1,3])rr(c,x,22+s*.03,2.5,4.5,1,claw,ink,.7);
    c.restore();
  }
  path(c,[[-14,-36],[-7,-47],[7,-47],[16,-36],[14,-10],[-14,-10],[-17,-24]],blue,ink,1.5);
  path(c,[[-10,-33],[-3,-39],[5,-39],[10,-31],[9,-17],[-10,-17],[-12,-25]],blue2,null);
  path(c,[[-5,-21],[4,-21],[4,-10],[-5,-10]],'#d9e4ef',null);
  for(const side of [-1,1]){
    const jab=(side<0?1:-1)*bite*3.6;
    c.save();c.translate(side*12,-21);
    rr(c,-2.5,-2,5,11,2,blue2,ink,1);
    rr(c,-3.5+jab,8,7,4,1,beak2,ink,1);
    for(const x of [-3,0,3])rr(c,x-1+jab,11,2,4,1,claw,ink,.7);
    c.restore();
  }
  path(c,[[-3,-54],[2,-67],[8,-66],[10,-50],[6,-38],[0,-39]],blue2,ink,1.3);
  path(c,[[-2,-53],[1,-60],[6,-59],[8,-51],[4,-43],[0,-44]],'#62c7e8',ink,1.0);
  // blue head with a forward beak attached to the face front, not below as a jaw
  path(c,[[-7,-71],[2,-81],[18,-83],[29,-80],[33,-74],[28,-66],[17,-61],[6,-60],[-1,-62]],blue,ink,1.5);
  path(c,[[-11,-84],[4,-89],[22,-89],[34,-86],[40,-81],[37,-76],[18,-76],[2,-77],[-7,-79]],crest,ink,1.1);
  path(c,[[27,-71],[38,-71],[47,-68],[50,-64],[48,-60],[40,-58],[30,-59],[24,-63]],beak,ink,1.1);
  path(c,[[29,-67],[40,-67],[47,-65],[46,-62],[39,-60],[30,-61]],beak2,null);
  if(back){
    line(c,7,-74,24,-71,blue2,5);
    line(c,7,-67,26,-64,blue2,5);
  }else{
    ellipse(c,10.5,-73.5,1.7,1.7,'#10191f');
    line(c,42,-64,49,-63,'#c79c19',1.2);
    path(c,[[31,-70],[48,-69-bite*1.3],[51,-65-bite*1.2],[33,-61]],beak,ink,1);
  }
  path(c,[[-3,-49],[2,-57],[7,-53],[8,-45],[1,-43]],blue2,ink,1.0);
  if(opts.summonCasting){
    const pulse=.55+.45*Math.sin(t*9);
    c.save();c.globalAlpha=.16+.14*pulse;ellipse(c,0,11,28+pulse*7,10+pulse*3,team+'55');ellipse(c,0,11,35+pulse*8,13+pulse*3,team+'22');c.restore();
  }
  if(opts.hit){c.globalAlpha*=.4;ellipse(c,0,-24,27,27,'#fff2cc');}
  c.restore();
}


function drawRanbos(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,moving=opts.moving??walk!==0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#223742',body='#5a8fc3',body2='#9fc0da',beak='#f1c93b',beak2='#ffd95a',crest='#ef7d33';
  const bob=(moving?Math.sin(walk)*.8:Math.sin(t*2.2)*.22),stride=moving?Math.sin(walk)*3.2:0;
  const pix=(x,y,w,h,fill,stroke=ink,lw=1)=>rr(c,x,y,w,h,1,fill,stroke,lw);
  c.save();c.translate(0,bob);
  pix(7,-1,7,5,body2);pix(13,3,6,5,body);pix(18,7,6,5,body2);
  for(const side of [-1,1]){
    const s=side<0?stride:-stride;
    c.save();c.translate(side*7,1);
    pix(-3,-4-s*.1,6,11,body2);
    pix(-4,7+s*.06,8,5,beak2);
    pix(-4,11,2,3,'#182028',ink,.8);pix(1,11,2,3,'#182028',ink,.8);
    c.restore();
  }
  pix(-10,-24,20,17,body);
  pix(-7,-21,14,11,body2,null,0);
  pix(-4,-11,8,8,'#d9e4ef',null,0);
  pix(-2,-35,7,12,body2);
  pix(-1,-33,5,7,'#62c7e8');
  // head plus beak on the front of the face
  pix(-2,-46,11,10,body2);
  pix(-7,-56,18,4,crest);
  pix(8,-45,8,4,body);
  pix(15,-47,7,4,beak);
  pix(18,-45,6,3,beak2,null,0);
  if(back){
    pix(-3,-40,7,6,body2);
  }else{
    pix(2,-43,2,2,'#112028',null,0);
    pix(18,-46,2,2,'#c79c19',null,0);
    pix(15,-47,7,4,beak);
    pix(18,-45,6,3,beak2,null,0);
  }
  pix(-8,-17,4,7,body2);pix(4,-17,4,7,body2);
  if(opts.hit){c.globalAlpha*=.38;ellipse(c,0,-15,18,14,'#fff3d3');}
  if(opts.owner!=null){c.save();c.globalAlpha=.18;ellipse(c,0,-9,14,6,team);c.restore();}
  c.restore();
}

function drawApprenticeGuard(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,moving=opts.moving??walk!==0,team=TEAM_COLORS[opts.owner||0],ink='#273941',steel='#788991',steel2='#aebbc0',cloth='#687985',wood='#9a744d',tip='#d9e2df';
  const bob=(moving?Math.sin(walk)*1.2:Math.sin(t*2)*.35),step=Math.sin(walk)*(moving?.22:0),hasShield=(opts.shieldHp??240)>0;
  c.save();c.translate(0,bob);
  // Slightly awkward stance: the recruit is almost hidden by oversized gear.
  for(const side of [-1,1]){c.save();c.translate(side*6,-8);c.rotate(step*(side>0?1:-1));line(c,0,0,side*2,17,cloth,7);rr(c,side>0?-3:-8,14,11,6,2,ink);c.restore();}
  rr(c,-11,-39,22,31,7,cloth,ink);rr(c,-9,-36,18,6,3,team,ink);
  // Closed helmet: no face is visible.
  ellipse(c,0,-48,12,14,steel2);path(c,[[-13,-51],[-9,-62],[0,-67],[9,-62],[13,-51],[10,-43],[-10,-43]],steel,ink,1.5);rr(c,-10,-51,20,5,2,ink);for(const x of [-6,0,6])line(c,x,-50,x,-46,'#c9d4d5',1);
  // Spear stays even after the shield is broken.
  c.save();c.translate(13,-33);c.rotate(-.08);line(c,0,18,0,-45,wood,3.3);path(c,[[-5,-45],[0,-59],[5,-45],[0,-39]],tip,ink,1);c.restore();
  if(hasShield){
    c.save();c.translate(-17,-29);c.rotate(.04);path(c,[[-15,-25],[14,-23],[16,8],[0,27],[-17,8]],'#5e7380',ink,2);path(c,[[-10,-18],[-2,-19],[-2,17],[-11,5]],team);line(c,-9,-7,10,-7,'#d5e0dd',2);ellipse(c,0,0,4,4,steel2,ink,1);c.restore();
  }else{
    c.save();c.globalAlpha=.28;line(c,-18,-33,-22,-14,steel,4);c.restore();
  }
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-34,20,34,'#fff7d8');}
  c.restore();
}
function drawIceSpirit(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,p=clamp(opts.iceSpiritProgress||0,0,1),leaping=opts.iceSpiritState==='leap',team=TEAM_COLORS[opts.owner||0],ink='#31566a';
  c.save();if(leaping)c.translate(0,-Math.sin(Math.PI*p)*22);else c.translate(0,Math.sin(walk*1.4)*1.5+Math.sin(t*5)*.5);
  const body='#e9fbff',shade='#a9e4f6',glow='#dffaff';
  ellipse(c,0,-23,14,14,shade);ellipse(c,-2,-26,12,11,body);ellipse(c,-5,-29,2,2,ink);ellipse(c,4,-29,2,2,ink);path(c,[[-4,-21],[0,-18],[5,-22]],null,ink,1.5);
  // Small icy spikes and team scarf keep ownership readable.
  path(c,[[-11,-34],[-7,-45],[-2,-36],[3,-47],[7,-35]],glow,ink,1);rr(c,-12,-18,24,5,2,team,ink);
  const kick=leaping?Math.sin(Math.PI*p)*.7:Math.sin(walk)*.45;
  for(const side of [-1,1]){c.save();c.translate(side*8,-17);c.rotate(side*kick);line(c,0,0,side*7,8,shade,4);ellipse(c,side*8,9,3,3,body);c.restore();c.save();c.translate(side*6,-9);c.rotate(-side*kick);line(c,0,0,side*4,8,shade,4);ellipse(c,side*5,9,3,2,body);c.restore();}
  if(leaping){c.globalAlpha=.25;ellipse(c,0,-23,23,19,'#b7efff');}
  c.restore();
}


function drawFireSpirit(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,p=clamp(opts.fireSpiritProgress||0,0,1),leaping=opts.fireSpiritState==='leap',team=TEAM_COLORS[opts.owner||0],ink='#6f2b1d';
  c.save();if(leaping)c.translate(0,-Math.sin(Math.PI*p)*22);else c.translate(0,Math.sin(walk*1.5)*1.7+Math.sin(t*6)*.7);
  const magma='#e9572f',hot='#ff9a3c',core='#ffd05a',dark='#a93c2d';
  c.globalAlpha=.18;ellipse(c,0,-24,21,18,'#ff7a33');c.globalAlpha=1;
  ellipse(c,0,-23,14,14,dark);ellipse(c,-2,-26,12,11,magma);path(c,[[-10,-29],[-5,-34],[-2,-29],[2,-36],[5,-29],[10,-32]],hot,ink,1);
  line(c,-7,-24,-2,-20,core,2);line(c,2,-31,6,-25,core,2);line(c,-1,-17,4,-22,core,2);ellipse(c,-5,-29,2,2,'#271d19');ellipse(c,4,-29,2,2,'#271d19');
  rr(c,-12,-18,24,5,2,team,ink);
  const kick=leaping?Math.sin(Math.PI*p)*.75:Math.sin(walk)*.5;
  for(const side of [-1,1]){c.save();c.translate(side*8,-17);c.rotate(side*kick);line(c,0,0,side*7,8,hot,4);ellipse(c,side*8,9,3,3,magma);c.restore();c.save();c.translate(side*6,-9);c.rotate(-side*kick);line(c,0,0,side*4,8,hot,4);ellipse(c,side*5,9,3,2,magma);c.restore();}
  if(leaping){c.globalAlpha=.30;ellipse(c,0,-23,24,20,'#ff8b3d');}
  c.restore();
}

function drawShieldKnight(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,team=TEAM_COLORS[opts.owner||0],ink='#253b43',steel='#8099a3',steel2='#b6c7c9',gold='#ddb86a';
  c.save();c.translate(0,Math.sin(walk)*1.2+Math.sin(t*2)*.3);
  for(const side of [-1,1]){line(c,side*7,-11,side*8,4,'#465961',8);rr(c,side*8-5,0,10,6,2,ink);}
  rr(c,-16,-42,32,34,8,steel,ink);rr(c,-14,-39,28,8,4,team);ellipse(c,0,-50,13,15,steel2);rr(c,-10,-53,20,7,3,ink);line(c,-7,-50,7,-50,'#d9f2ef',1.5);
  c.save();c.translate(-21,-27);c.rotate(-.08);path(c,[[-13,-22],[13,-22],[15,6],[0,22],[-15,6]],'#607b87',ink,2);path(c,[[-9,-17],[-2,-17],[-2,13],[-9,3]],gold);line(c,-8,-8,9,-8,'#d9e6df',2);c.restore();
  c.save();c.translate(18,-28);c.rotate(.28);sword(c,-.15);c.restore();
  if((opts.shieldHp||0)>0){c.save();c.globalAlpha=.32+.10*Math.sin(t*6);c.strokeStyle='#bfefff';c.lineWidth=2;c.beginPath();c.arc(-14,-28,30,-2.15,2.15);c.stroke();c.restore();}
  c.restore();
}
function drawWindMage(c,opts={}){
  const t=opts.time||0,team=TEAM_COLORS[opts.owner||0],ink='#294347';c.save();c.translate(0,Math.sin(t*2)*.6);
  path(c,[[-13,-30],[13,-30],[19,2],[0,-4],[-19,2]],'#5b8f7d',ink,1.5);rr(c,-12,-42,24,18,6,'#7fb7a5',ink);ellipse(c,0,-50,10,11,'#e7c29e');path(c,[[-12,-50],[0,-66],[13,-50],[9,-45],[-9,-45]],'#547e72',ink,1.2);
  c.save();c.translate(16,-30);line(c,0,11,0,-30,'#8a7357',3);ellipse(c,0,-35,7,7,'#d8fff2');for(let i=0;i<3;i++){c.strokeStyle=i?team:'#d8fff2';c.lineWidth=1.5;c.beginPath();c.arc(0,-35,11+i*5,t*1.8+i,t*1.8+i+3.8);c.stroke();}c.restore();
  c.restore();
}
function drawPhoenix(c,opts={}){
  const t=opts.time||0,flap=Math.sin(t*8+(opts.walk||0))*.35,ink='#703c32',fire='#ef6f3e',gold='#ffc45f';c.save();c.translate(0,-23+Math.sin(t*4)*2);
  for(const side of [-1,1]){c.save();c.scale(side,1);c.rotate(flap);path(c,[[4,-4],[22,-23],[34,-18],[25,-5],[37,2],[20,5],[29,15],[10,7]],fire,ink,1.5);path(c,[[10,-2],[25,-14],[18,4]],gold);c.restore();}
  ellipse(c,0,-3,10,18,'#d95738');ellipse(c,0,-6,6,12,gold);path(c,[[-7,-16],[0,-31],[8,-16],[6,-4],[-6,-4]],'#e87940',ink,1.2);ellipse(c,-3,-18,2,2,'#fff3ad');ellipse(c,3,-18,2,2,'#fff3ad');
  path(c,[[-6,11],[-15,31],[-4,24],[0,38],[5,23],[15,31],[7,10]],fire,ink,1);path(c,[[-2,12],[-6,28],[0,23],[4,30],[3,12]],gold);
  c.restore();
}
function drawPhoenixEgg(c,opts={}){
  const t=opts.time||0,team=TEAM_COLORS[opts.owner||0];c.save();c.translate(0,-12);ellipse(c,0,0,13,18,'#f2d99a');ellipse(c,3,-4,7,11,'#fff1bd');line(c,-4,-6,1,-1,'#b8734d',1.8);line(c,1,-1,-2,5,'#b8734d',1.8);line(c,-2,5,5,10,'#b8734d',1.8);c.strokeStyle=team;c.lineWidth=2;c.beginPath();c.arc(0,0,20,-Math.PI/2,-Math.PI/2+TAU*(.35+.15*Math.sin(t*3)));c.stroke();c.restore();
}
function drawGravityOrb(c,opts={}){
  const t=opts.time||0,team=TEAM_COLORS[opts.owner||0];c.save();c.translate(0,-25+Math.sin(t*3)*2);c.globalAlpha=.3;ellipse(c,0,0,22,22,'#7867a8');c.globalAlpha=1;ellipse(c,0,0,13,13,'#312b52');ellipse(c,-3,-4,6,6,'#b8a6ef');for(let i=0;i<4;i++){const a=t*1.6+i*TAU/4;ellipse(c,Math.cos(a)*22,Math.sin(a)*13,3,3,i%2?team:'#d9ccff');}c.strokeStyle='#c7b9ff';c.lineWidth=1.5;c.beginPath();c.arc(0,0,28,t,t+4.5);c.stroke();c.restore();
}
function drawRoyalGhost(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0];
  const ink='#334146',ghost='#edf5f1',ghostShade='#c7dad5',beard='#f8fbf7',gold='#d7b34d',gold2='#f1d778',dagger='#b9c9cc';
  c.save();c.translate(0,Math.sin(walk)*1.1-2);if(opts.stealthed)c.globalAlpha*=.42;
  // Faded royal cape/body; the ragged lower edge makes him read as a dead, floating king.
  path(c,[[-15,-35],[15,-35],[18,-9],[12,5],[5,1],[0,9],[-6,2],[-13,6],[-18,-8]],ghostShade,ink,1.3);
  path(c,[[-13,-34],[0,-39],[13,-34],[11,-8],[0,-2],[-11,-8]],ghost,ink,1.1);
  rr(c,-12,-16,24,5,2,team,ink);
  // Head, white hair and oversized messy beard.
  ellipse(c,0,-49,12,13,'#e7ddd0');
  if(back){
    path(c,[[-12,-51],[-8,-63],[0,-67],[9,-63],[13,-51],[9,-40],[-9,-40]],beard,ink,1.1);
  }else{
    path(c,[[-13,-48],[-10,-39],[-5,-35],[0,-39],[5,-35],[11,-40],[13,-49],[8,-45],[5,-50],[0,-46],[-5,-51],[-9,-45]],beard,ink,1.1);
    // Tired, unmotivated expression.
    line(c,-7,-52,-2,-53,'#5c6260',1.4);line(c,2,-53,7,-52,'#5c6260',1.4);
    ellipse(c,-4,-51,1.3,1,'#5a5f5e');ellipse(c,4,-51,1.3,1,'#5a5f5e');
    path(c,[[-3,-44],[0,-43],[3,-44]],null,'#8b7b70',1.1);
  }
  // Crown tilted slightly, as if he cannot be bothered to straighten it.
  c.save();c.translate(2,-63);c.rotate(.08);path(c,[[-10,2],[-9,-7],[-3,-2],[0,-10],[4,-2],[10,-7],[9,3]],gold,ink,1.1);rr(c,-10,1,20,5,2,gold2,ink);c.restore();
  // Left arm hangs lazily; right hand gives a short dagger slash on attack.
  line(c,-12,-28,-18,-10,ghostShade,6);ellipse(c,-18,-8,4,4,'#e7ddd0');
  c.save();c.translate(13,-27);c.rotate(.25-(attack?Math.sin((1-attack/.35)*Math.PI)*1.05:0));line(c,0,0,5,17,ghostShade,6);ellipse(c,6,19,4,4,'#e7ddd0');c.translate(7,20);c.rotate(.35);path(c,[[-2,1],[0,-22],[3,1]],dagger,ink,1);rr(c,-5,0,10,3,1,gold,ink);c.restore();
  if(opts.stealthed){
    c.globalAlpha=.12;for(let i=0;i<3;i++)ellipse(c,-12-i*7,2+i*2,14-i*2,6,'#eafff8');
  }
  c.restore();
}
function drawSkyBomber(c,opts={}){
  const t=opts.time||0,attack=opts.anim||0,back=!!opts.back,team=TEAM_COLORS[opts.owner||0],ink='#243c45';
  const metal='#718e99',metal2='#9bb6bd',leather='#675648',skin='#d8c6a3',bomb='#30383b',fuse='#d6a34e',spark='#ffd56f';
  const bob=Math.sin(t*5)*1.5,drop=attack?Math.sin((1-attack/.35)*Math.PI):0,rot=t*13;
  c.save();c.translate(0,-23+bob);
  // Twin rotor flight pack keeps the silhouette humanoid rather than dragon-like.
  for(const side of [-1,1]){
    c.save();c.translate(side*18,-23);c.rotate(side*.08);
    rr(c,-7,-10,14,22,5,metal,ink);ellipse(c,0,-13,7,4,metal2);line(c,-13,-15,13,-15,'#d6e2df',2.4);line(c,0,-26,0,-9,'#526a72',2.2);
    c.save();c.translate(0,-15);c.rotate(rot*side);line(c,-15,0,15,0,'#c7d1cc',2);line(c,0,-8,0,8,'#c7d1cc',2);c.restore();
    c.restore();
  }
  // Pilot body and harness.
  line(c,-7,-9,-9,8,leather,7);line(c,7,-9,9,8,leather,7);
  rr(c,-13,-38,26,29,7,'#536f78',ink);rr(c,-11,-35,22,6,2,team,ink);line(c,-9,-33,8,-13,'#b9935d',3);line(c,9,-33,-8,-13,'#8a6a4d',2);
  // Oversized bomb is the main symbol. It hangs under the pilot and drops during attack animation.
  c.save();c.translate(back?0:13,4+drop*8);c.rotate(back?0:.14);
  ellipse(c,0,0,12,16,bomb);path(c,[[-8,11],[0,22],[8,11]],'#4d5556',ink,1);rr(c,-6,-16,12,5,2,'#4d5556',ink);
  c.strokeStyle=fuse;c.lineWidth=2;c.beginPath();c.arc(2,-17,10,-1.7,-.35);c.stroke();ellipse(c,10,-23,2.8,2.8,Math.sin(t*16)>.1?'#fff3a4':'#ee7d43');
  c.restore();
  // Helmet + goggles + cocky grin.
  ellipse(c,0,-48,10,11,skin);path(c,[[-11,-51],[-8,-61],[0,-66],[9,-61],[12,-51]],'#627b83',ink,1.3);rr(c,-12,-53,24,5,2,'#455e66',ink);
  if(back){rr(c,-8,-51,16,8,3,'#617b83',ink);line(c,-6,-44,6,-40,'#b9935d',2);}
  else{
    rr(c,-9,-53,8,6,2,'#cbe9ef',ink);rr(c,1,-53,8,6,2,'#cbe9ef',ink);line(c,-1,-50,1,-50,ink,2);
    ellipse(c,-5,-50,1.5,1.5,'#32464c');ellipse(c,5,-50,1.5,1.5,'#32464c');path(c,[[-4,-43],[0,-41],[5,-44]],null,'#815b48',1.2);
  }
  // Belt bombs read as a dedicated bomber even when the main bomb is obscured.
  for(const x of [-8,0,8]){ellipse(c,x,-16,3.3,4.5,'#3b4244');line(c,x,-20,x+1,-23,fuse,1);}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-29,23,34,'#fff0cf');}
  c.restore();
}

function drawScrapDrill(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,team=TEAM_COLORS[opts.owner||0],ink='#322f2a',stage=opts.drillStage||0;
  const bob=Math.sin(walk)*.9,rumble=.4+.6*Math.sin(t*10);
  c.save();c.translate(0,bob);
  // tracked undercarriage
  for(const side of [-1,1]){
    rr(c,side*14-10,-8,20,20,5,'#47453f',ink,1.4);
    rr(c,side*14-8,-6,16,16,4,'#68645a',ink,1.1);
    for(const y of [-2,4,10])line(c,side*14-6,y,side*14+6,y,'#8b836f',1.5);
    for(const x of [-4,4,12,20])ellipse(c,side*14-10+x,14,2.4,2.4,'#b5aa8c');
  }
  // heavy scrap body
  path(c,[[-24,-32],[-8,-40],[16,-38],[24,-23],[24,-2],[-24,-2]],'#7c6c53',ink,1.6);
  path(c,[[-19,-28],[-6,-34],[12,-33],[18,-24],[17,-10],[-18,-10]],'#9a8666',null);
  rr(c,-15,-30,30,6,2,team,ink,1);
  // hazard stripe plate & scrap patchwork
  rr(c,-7,-19,18,9,2,'#d2b468',ink,1);line(c,-6,-11,9,-19,'#3a3327',2);line(c,-1,-10,14,-18,'#3a3327',2);
  rr(c,-20,-21,7,12,2,'#5d5549',ink,1);rr(c,13,-24,8,10,2,'#5d5549',ink,1);
  // smoke stack and warning light
  rr(c,10,-42,8,16,2,'#585148',ink,1.2);ellipse(c,14,-45,5,3,'#6f6658');
  c.save();c.globalAlpha=.22+.15*rumble;ellipse(c,15,-52,8,6,'#7c766d');ellipse(c,11,-57,5,4,'#8e877d');c.restore();
  ellipse(c,-14,-34,4,4,Math.sin(t*9)>.1?'#f95':'#ffd06c');
  // giant drill nose is the unmistakable symbol
  c.save();c.translate(0,-23);c.rotate((opts.facing??-Math.PI/2)+Math.PI/2);
  path(c,[[-10,-3],[0,-41],[10,-3],[7,5],[-7,5]],'#cfbf95',ink,1.5);
  for(const y of [-4,-11,-18,-25,-32])line(c,-6,y,6,y,'#7b715f',1.3);
  c.rotate(t*10);
  line(c,-12,-31,12,-31,'#f2e3b0',1.3);line(c,-8,-39,8,-23,'#e9d69a',1.1);
  c.restore();
  // side exhaust pipes
  line(c,-20,-15,-27,-23,'#4f473d',4);line(c,-20,-24,-28,-31,'#4f473d',3);
  if(stage>0){
    c.save();c.globalAlpha=.3+.15*rumble;c.strokeStyle='#ffd67c';c.lineWidth=2+stage*.9;c.beginPath();c.arc(0,-23,22+stage*2,t*3,t*3+4.9);c.stroke();c.restore();
  }
  if(opts.hit){c.globalAlpha*=.38;ellipse(c,0,-18,31,23,'#fff0cb');}
  c.restore();
}
function drawCrusherOgre(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,team=TEAM_COLORS[opts.owner||0],ink='#33271f',skin='#8b664b',skin2='#b58a61',metal='#666c6d',metal2='#a6b0ae',bone='#e6d0a2',leather='#5c4534',mask='#d9c8ae',maskShade='#b89f7e',red='#9b2e2a';
  const bob=Math.sin(walk)*.85,smash=attack?Math.sin((1-attack/.35)*Math.PI):0;
  c.save();c.translate(0,bob);
  // thick legs
  for(const side of [-1,1]){
    c.save();c.translate(side*12,-11);
    line(c,0,0,side*1,21,skin,12);rr(c,side*1-8,18,16,8,3,'#433227',ink);c.restore();
  }
  // barrel torso
  path(c,[[-24,-53],[-10,-60],[13,-58],[24,-41],[22,-10],[-21,-10],[-25,-30]],skin,ink,1.8);
  path(c,[[-16,-47],[-5,-52],[9,-51],[15,-42],[13,-18],[-15,-18],[-18,-31]],skin2,null);
  rr(c,-18,-47,36,7,3,team,ink,1.1);
  // chain belt
  for(const x of [-13,-5,3,11])ellipse(c,x,-13,3.2,3.2,metal2);line(c,-15,-13,14,-13,metal,2.4);
  // single shoulder armor
  path(c,[[6,-56],[21,-53],[27,-38],[11,-34],[3,-43]],metal,ink,1.4);line(c,8,-50,21,-39,'#c4cbc8',1.4);
  // hannya-style head silhouette: bigger brow, tall horns, pointed cheeks
  ellipse(c,0,-66,16,15,skin2,ink,1.5);
  path(c,[[-13,-76],[-9,-88],[-2,-83],[1,-72]],'#71513d',ink,1.2);
  path(c,[[13,-76],[9,-88],[2,-83],[-1,-72]],'#71513d',ink,1.2);
  path(c,[[-14,-76],[-4,-83],[8,-83],[14,-76],[12,-56],[0,-49],[-12,-56]],mask,ink,1.5);
  path(c,[[-10,-73],[-2,-78],[8,-78],[11,-71],[8,-66],[-9,-66]],maskShade,null);
  // angry red brow markings
  path(c,[[-10,-71],[-4,-75],[-1,-70],[-5,-67]],red,ink,.8);
  path(c,[[10,-71],[4,-75],[1,-70],[5,-67]],red,ink,.8);
  // narrow glowing eyes and demon nose
  path(c,[[-8,-67],[-3,-69],[-1,-66],[-6,-64]],'#221511',ink,.8);
  path(c,[[8,-67],[3,-69],[1,-66],[6,-64]],'#221511',ink,.8);
  ellipse(c,-4.8,-66.5,1.2,1.2,'#f6d36c');ellipse(c,4.8,-66.5,1.2,1.2,'#f6d36c');
  path(c,[[-2,-63],[0,-60],[2,-63],[0,-57]],'#6e4038',ink,.8);
  // snarling mouth + tusks
  path(c,[[-8,-57],[-3,-55],[0,-57],[3,-55],[8,-57],[6,-50],[0,-48],[-6,-50]],'#51372d',ink,.9);
  path(c,[[-8,-56],[-5,-47],[-2,-56]],bone,ink,.9);path(c,[[2,-56],[5,-47],[8,-56]],bone,ink,.9);
  // cheek spikes to strengthen hannya read at small size
  path(c,[[-13,-61],[-19,-58],[-13,-55]],red,ink,.8);path(c,[[13,-61],[19,-58],[13,-55]],red,ink,.8);
  // left bracing arm
  c.save();c.translate(-20,-37);c.rotate(-.38-smash*.08);line(c,0,0,-7,22,skin2,10);ellipse(c,-7,22,5,5,skin2);c.restore();
  // main hammer arm
  c.save();c.translate(20,-38);c.rotate(.2-smash*1.1);line(c,0,0,5,25,skin2,12);ellipse(c,5,25,5,5,skin2);c.translate(5,25);c.rotate(.12);
  line(c,0,0,0,-36,leather,8);
  rr(c,-13,-58,26,21,4,metal,ink,1.6);rr(c,-10,-55,20,5,2,metal2,ink,1);rr(c,-3,-37,6,9,2,bone,ink,1);
  c.restore();
  // hanging chains / bones
  line(c,-6,-8,-10,2,leather,2);ellipse(c,-10,4,2.6,2.6,bone);line(c,7,-9,10,3,leather,2);ellipse(c,10,5,2.6,2.6,bone);
  if(opts.hit){c.globalAlpha*=.42;ellipse(c,0,-30,28,37,'#fff0c8');}
  c.restore();
}
function drawSiegeTurtle(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,team=TEAM_COLORS[opts.owner||0],ink='#334137',moving=!!opts.turtleShellActive;
  const bob=Math.sin(walk)*.5,pulse=.55+.45*Math.sin(t*7);
  c.save();c.translate(0,bob);
  // fortress legs
  for(const side of [-1,1]){
    ellipse(c,side*20,4,10,8,'#66785f',ink,1.2);ellipse(c,side*14,-23,8,9,'#66785f',ink,1.2);
  }
  // giant armored shell
  ellipse(c,0,-16,33,24,'#4d6350');
  path(c,[[-28,-18],[-15,-39],[13,-40],[29,-19],[20,-1],[-21,-1]],'#6d8261',ink,1.5);
  path(c,[[-20,-17],[-8,-31],[8,-32],[20,-17],[13,-6],[-13,-6]],'#83966f',null);
  // plated shell segments
  for(const x of [-15,0,15])ellipse(c,x,-20,7,7,'#94a57a');
  // shell spikes and iron braces
  for(const x of [-18,-6,6,18])path(c,[[x,-33],[x+4,-40],[x+8,-33]],'#a5b28a',ink,.8);
  line(c,-22,-15,-7,-32,'#4e584a',2);line(c,22,-15,7,-32,'#4e584a',2);line(c,-9,-7,9,-7,'#4e584a',2);
  // top ballista/cannon makes it read as a mobile fortress
  rr(c,-8,-44,16,10,3,'#6f786e',ink,1.2);rr(c,-5,-48,10,6,2,team,ink,1);
  if(moving){
    rr(c,-4,-50,8,8,2,'#778178',ink,1.1);
    c.save();c.globalAlpha=.3+.15*pulse;c.strokeStyle='#d6e5c1';c.lineWidth=3;c.beginPath();c.arc(0,-17,37,Math.PI,TAU);c.stroke();c.restore();
  }else{
    line(c,0,-39,0,-61,'#574f43',4);path(c,[[-12,-62],[0,-74],[12,-62],[9,-55],[-9,-55]],'#7a6d59',ink,1.2);line(c,0,-62,20,-72,'#574f43',3);
    ellipse(c,21,-72,4,4,'#a6b3a8');
  }
  // stern head and front armor
  ellipse(c,0,-45,11,10,'#7b8d6b',ink,1.2);rr(c,-9,-44,18,6,2,'#6f8362',ink,1);ellipse(c,-3,-47,1.6,1.6,'#f0df98');ellipse(c,3,-47,1.6,1.6,'#f0df98');
  rr(c,-16,-9,32,5,2,team,ink,1);
  if(opts.hit){c.globalAlpha*=.38;ellipse(c,0,-19,35,27,'#f2f6d9');}
  c.restore();
}
function drawSkeletonBarrel(c,opts={}){
  const air=!!opts.airborne,owner=opts.owner||0,team=owner===0?{base:'#4f9dff',stroke:'#2878ce'}:{base:'#ff5f68',stroke:'#c33f48'},metal=air?'#919aab':'#818b98';
  const balloons=[[-20,-64,13],[0,-78,15],[20,-64,13]];
  for(const [bx,by,br] of balloons){ellipse(c,bx,by,br,br*1.08,team.base,team.stroke,2);ellipse(c,bx-4,by-5,br*.34,br*.28,'#ffffff66');line(c,bx,by+br-1,bx*.28,by+br+18,team.stroke,1.4);}
  line(c,-11,-42,-15,-16,metal,2.2);line(c,0,-49,0,-16,metal,2.2);line(c,11,-42,15,-16,metal,2.2);
  rr(c,-19,-18,38,29,6,'#8c5a38','#533422',2);rr(c,-16,-14,32,21,5,'#b17b52');
  line(c,-4,-18,-4,11,'#5d3825',1.4);line(c,4,-18,4,11,'#5d3825',1.4);rr(c,-22,-8,44,6,3,'#6d432c');rr(c,-14,-24,28,8,3,'#6d432c');
  ellipse(c,0,-3,8.5,8.5,'#ece4d0','#6f6659',1);ellipse(c,-3,-4,1.4,2.1,'#5d5448');ellipse(c,3,-4,1.4,2.1,'#5d5448');path(c,[[-4,2],[0,5],[4,2],[3,6],[0,8],[-3,6]],'#d2c9b8','#5d5448',0.8);
  rr(c,-18,-12,36,3,1.5,metal);rr(c,-18,2,36,3,1.5,metal);
  line(c,-7,9,-11,20,'#d9d2b5',2);line(c,7,9,11,20,'#d9d2b5',2);ellipse(c,-12,22,3,4,'#ece6cf','#8b826f',1);ellipse(c,12,22,3,4,'#ece6cf','#8b826f',1);
}

function drawBombCarrier(c,opts={}){
  const t=opts.time||0,walk=opts.walk||0,team=TEAM_COLORS[opts.owner||0],ink='#3a312a',cloth='#8a7156',cloth2='#ad8d67',skin='#d7bb95',bomb='#333739',bomb2='#505556',fuse='#d4a04d',spark='#fff3a6';
  const bob=Math.sin(walk)*1.4;
  c.save();c.translate(0,bob);
  // leaning runner legs
  line(c,-7,-11,-10,6,cloth,7);line(c,6,-11,9,5,cloth,7);rr(c,-13,1,9,6,2,'#2f2722');rr(c,4,0,9,6,2,'#2f2722');
  // small desperate body
  rr(c,-12,-36,24,25,7,cloth,ink,1.5);rr(c,-10,-33,20,5,2,team,ink);line(c,-6,-27,9,-14,'#6b503b',2.2);
  // giant bomb bigger than the carrier itself
  c.save();c.translate(18,-22);c.rotate(.14);
  ellipse(c,0,0,15,18,bomb,ink,1.6);path(c,[[-10,12],[0,25],[10,12]],bomb2,ink,1);rr(c,-6,-18,12,5,2,bomb2,ink);
  c.strokeStyle=fuse;c.lineWidth=2;c.beginPath();c.arc(2,-18,10,-1.7,-.25);c.stroke();ellipse(c,10,-24,2.8,2.8,Math.sin(t*12)>.1?spark:'#ee7d43');
  c.restore();
  // head / expression
  ellipse(c,0,-46,9,10,skin,ink,1.2);path(c,[[-11,-48],[-8,-58],[0,-62],[8,-58],[11,-48],[8,-41],[-8,-41]],cloth2,ink,1.1);
  ellipse(c,-3,-47,1.4,1.4,'#2a211c');ellipse(c,3,-47,1.4,1.4,'#2a211c');path(c,[[-4,-40],[0,-38],[5,-41]],null,'#754d3f',1.2);
  // back-up bombs on belt
  for(const x of [-9,-1,7]){ellipse(c,x,-18,3.5,4.5,bomb2,ink,1);line(c,x,-22,x+1,-25,fuse,1);}
  if(opts.hit){c.globalAlpha*=.45;ellipse(c,0,-29,24,31,'#fff0d5');}
  c.restore();
}

function drawAshSquadCard(c,opts={}){
  const owner=opts.owner||0,time=opts.time||0;
  drawUnit(c,'blade',0,-10,.60,{...opts,time,owner,noShadow:true,idle:true,back:opts.back});
  drawUnit(c,'blade',-19,7,.52,{...opts,time:time+.4,owner,noShadow:true,idle:true,back:opts.back});
  drawUnit(c,'blade',19,7,.52,{...opts,time:time+.8,owner,noShadow:true,idle:true,back:opts.back});
}

export function drawUnit(c,type,x,y,scale=1,opts={}){
  const d=UNITS[type],t=opts.time||0,walk=opts.walk||0,attack=opts.anim||0,team=TEAM_COLORS[opts.owner||0];
  const ink='#233945',skin='#f0c7a2',dark='#233e42';
  const moving=opts.moving??walk!==0,bob=Math.sin(walk)*1.5+(opts.idle?Math.sin(t*2)*.65:0);
  c.save();c.translate(x,y);c.scale(scale,scale);
  if(opts.alpha!=null)c.globalAlpha=opts.alpha;
  if(!opts.noShadow){const sr=type==='golem'?40:type==='icegolem'?25:type==='mini_golem'?24:type==='berserker'?27:type==='miniberserker'?21:type==='megaknight'?31:type==='ironeye'?19:type==='tracker'?23:type==='valkyrie'?23:type==='megagargoyle'?18:type==='gargoyle'||type==='gargoyleswarm'?14:type==='archer'?15:type==='boar'?25:type==='knight'?23:type==='mossling'||type==='goblin_melee'||type==='goblin_spear'?12:(type==='skeleton'||type==='boneswarm')?9:type==='tombstone'?24:type==='elixirgolem'?27:type==='elixir_golem_mid'?18:type==='elixir_blob'?11:type==='royalgiant'?30:type==='tigger'?18:type==='muddragon'?26:type==='laserdragon'?25:type==='skybomber'?22:type==='scrapdrill'?22:type==='crusherogre'?29:type==='siegeturtle'?31:type==='bombcarrier'?17:type==='skeletonbarrel'?18:type==='giantskeleton'?31:type==='apprenticeguard'?18:type==='barbarian'||type==='barbarians'?23:type==='siegebarbarian'?29:type==='icespirit'||type==='firespirit'?12:type==='oven'?27:type==='shieldknight'?24:type==='windmage'?19:type==='phoenix'?24:type==='phoenix_egg'?17:type==='gravityorb'?19:type==='mirage'?17:type==='harpy'?20:type==='electrowizard'?20:type==='ashsquad'?30:type==='necromancer'||type==='darknecro'?21:type==='dosranboss'?31:type==='ranbos'?16:type==='sparky'?28:type==='princess'?19:type==='nightshade'?15:18;ellipse(c,0,5,sr,type==='golem'?9:type==='mini_golem'?6:type==='boar'?8:type==='dosranboss'?9:6,'#172f3435');}
  if(opts.mirror)c.scale(-1,1);
  if(type==='golem'){drawStoneGolem(c,opts);c.restore();return;}
  if(type==='icegolem'){drawIceGolem(c,opts);c.restore();return;}
  if(type==='mini_golem'){c.scale(.62,.62);drawStoneGolem(c,opts);c.restore();return;}
  if(type==='boar'){drawIronBoar(c,opts);c.restore();return;}
  if(type==='tigger'){drawTigger(c,opts);c.restore();return;}
  if(type==='muddragon'){drawMudDragon(c,opts);c.restore();return;}
  if(type==='laserdragon'){drawLaserDragon(c,opts);c.restore();return;}
  if(type==='skybomber'){drawSkyBomber(c,opts);c.restore();return;}
  if(type==='scrapdrill'){drawScrapDrill(c,opts);c.restore();return;}
  if(type==='crusherogre'){drawCrusherOgre(c,opts);c.restore();return;}
  if(type==='siegeturtle'){drawSiegeTurtle(c,opts);c.restore();return;}
  if(type==='bombcarrier'){drawBombCarrier(c,opts);c.restore();return;}
  if(type==='skeletonbarrel'){drawSkeletonBarrel(c,opts);c.restore();return;}
  if(type==='giantskeleton'){drawGiantSkeleton(c,opts);c.restore();return;}
  if(type==='apprenticeguard'||type==='apprenticeguards'){drawApprenticeGuard(c,opts);c.restore();return;}
  if(type==='icespirit'){drawIceSpirit(c,opts);c.restore();return;}
  if(type==='firespirit'){drawFireSpirit(c,opts);c.restore();return;}
  if(type==='oven'){drawOven(c,opts);c.restore();return;}
  if(type==='barbarian'||type==='barbarians'){drawBarbarian(c,opts);c.restore();return;}
  if(type==='siegebarbarian'){drawSiegeBarbarian(c,opts);c.restore();return;}
  if(type==='shieldknight'){drawShieldKnight(c,opts);c.restore();return;}
  if(type==='windmage'){drawWindMage(c,opts);c.restore();return;}
  if(type==='phoenix'){drawPhoenix(c,opts);c.restore();return;}
  if(type==='phoenix_egg'){drawPhoenixEgg(c,opts);c.restore();return;}
  if(type==='gravityorb'){drawGravityOrb(c,opts);c.restore();return;}
  if(type==='mirage'){drawRoyalGhost(c,opts);c.restore();return;}
  if(type==='blowdart'){drawBlowdartGoblin(c,opts);c.restore();return;}
  if(type==='lasertower'){drawLaserTower(c,opts);c.restore();return;}
  if(type==='nightshade'){drawNightshade(c,opts);c.restore();return;}
  if(type==='mossling'||type==='goblin_melee'){drawMossling(c,opts);c.restore();return;}
  if(type==='goblin_spear'){drawGoblinSpear(c,opts);c.restore();return;}
  if(type==='skeleton'||type==='boneswarm'){drawBoneSwarm(c,opts);c.restore();return;}
  if(type==='tombstone'){drawTombstone(c,opts);c.restore();return;}
  if(type==='elixirgolem'){drawElixirGolem(c,opts,1);c.restore();return;}
  if(type==='elixir_golem_mid'){c.scale(.74,.74);drawElixirGolem(c,opts,2);c.restore();return;}
  if(type==='elixir_blob'){drawElixirBlob(c,opts);c.restore();return;}
  if(type==='royalgiant'){drawRoyalGiant(c,opts);c.restore();return;}
  if(type==='berserker'){drawKraggBerserker(c,opts);c.restore();return;}
  if(type==='miniberserker'){drawMiniBerserker(c,opts);c.restore();return;}
  if(type==='megaknight'){drawMegaKnight(c,opts);c.restore();return;}
  if(type==='ironeye'){drawIronEye(c,opts);c.restore();return;}
  if(type==='tracker'){drawTracker(c,opts);c.restore();return;}
  if(type==='valkyrie'){drawValkyrie(c,opts);c.restore();return;}
  if(type==='megagargoyle'){drawMegaGargoyle(c,opts);c.restore();return;}
  if(type==='gargoyle'){drawGargoyle(c,opts);c.restore();return;}
  if(type==='gargoyleswarm'){drawGargoyleSwarmCard(c,opts);c.restore();return;}
  if(type==='lumina'){drawLumina(c,opts);c.restore();return;}
  if(type==='frost'){drawFrostShaman(c,opts);c.restore();return;}
  if(type==='harpy'){drawStormHarpy(c,opts);c.restore();return;}
  if(type==='electrowizard'){drawElekitelWizard(c,opts);c.restore();return;}
  if(type==='necromancer'){drawNecromancer(c,opts,false);c.restore();return;}
  if(type==='darknecro'){drawNecromancer(c,opts,true);c.restore();return;}
  if(type==='dosranboss'){drawDosranboss(c,opts);c.restore();return;}
  if(type==='ranbos'){drawRanbos(c,opts);c.restore();return;}
  if(type==='ashsquad'){drawAshSquadCard(c,opts);c.restore();return;}
  if(type==='princess'){drawPrincessArcher(c,opts);c.restore();return;}
  if(type==='sparky'){drawSparky(c,opts);c.restore();return;}
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
  if(t.stunned){c.save();c.strokeStyle='#bcefff';c.lineWidth=2.5;c.beginPath();c.arc(0,-48,37,0,TAU);c.stroke();for(let i=0;i<5;i++){const a=i*TAU/5+time*4;line(c,Math.cos(a)*30,-48+Math.sin(a)*18,Math.cos(a+.5)*40,-48+Math.sin(a+.5)*23,'#fff2a3',2);}c.restore();}
  // Health bars stay legible after arena flip.
  rr(c,-33,-96,66,7,3,'#253d4566');rr(c,-32,-95,64*clamp(t.hp/t.maxHp,0,1),5,2,col);
  c.font='bold 10px sans-serif';c.fillStyle='#f6eed9';c.textAlign='center';c.fillText(String(Math.ceil(t.hp)),0,-101);
  c.restore();
}
export function orient(p,seat){return seat===1?{x:720-p.x,y:1040-p.y}:{x:p.x,y:p.y};}
export function drawArena(canvas,snapshot,options={}){
  const c=canvas.getContext('2d'),seat=options.seat||0,time=options.time||0;
  if(!terrainCache)terrainCache=makeTerrain();
  // Always start a frame from the identity transform. This also recovers a canvas
  // that was left transformed if an older render frame threw before restore().
  c.setTransform(1,0,0,1,0,0);
  c.clearRect(0,0,canvas.width,canvas.height);
  c.save();c.scale(canvas.width/720,canvas.height/1040);c.drawImage(terrainCache,0,0);
  const g=snapshot;if(!g){c.restore();return;}
  if(options.selected&&g.phase==='battle'&&!UNITS[options.selected].spell){
    const selectedData=UNITS[options.selected];
    if(selectedData.tunnelAnywhere){
      c.fillStyle='#a67f4a12';c.fillRect(46,46,628,936);c.setLineDash([7,8]);c.strokeStyle='#d9bd82aa';c.lineWidth=1.5;c.strokeRect(46,46,628,936);c.setLineDash([]);
      c.fillStyle='#f2dfb9';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText('地下出現地点を指定',360,74);
    }else{
      c.fillStyle='#4abdaf18';c.fillRect(46,ARENA.deployBottom,628,982-ARENA.deployBottom);
      c.setLineDash([9,10]);line(c,46,ARENA.deployBottom,674,ARENA.deployBottom,'#d3eed788',2);c.setLineDash([]);
      c.fillStyle='#e3f2d5';c.font='bold 13px sans-serif';c.textAlign='center';c.fillText('ここに配置',360,ARENA.deployBottom+28);
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
    const mud=z.kind==='mud',poison=z.kind==='poison',cyclone=z.kind==='cyclone',rush=z.kind==='skeletonrush',giantBomb=z.kind==='giantskeletonbomb',spellStyle=(poison||cyclone||rush||giantBomb)?spellTeamStyle(z.owner,seat):null;
    if(giantBomb){c.save();c.globalAlpha=.13+.10*life;c.fillStyle=spellStyle.base;c.beginPath();c.arc(p.x,p.y,z.radius,0,TAU);c.fill();c.globalAlpha=.78;c.strokeStyle=spellStyle.bright;c.lineWidth=2.2;c.setLineDash([7,5]);c.beginPath();c.arc(p.x,p.y,z.radius,0,TAU);c.stroke();c.setLineDash([]);ellipse(c,p.x,p.y-8,15,15,'#34383b','#171b1e',2);ellipse(c,p.x-5,p.y-13,5,4,'#788185');line(c,p.x+8,p.y-20,p.x+14,p.y-30,'#c3974e',2.5);ellipse(c,p.x+15,p.y-32,3,3,'#ffd66f');c.fillStyle='#fff4cf';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(`${Math.max(1,Math.ceil(z.detonateRemaining||z.remaining||0))}`,p.x,p.y+20);c.restore();continue;}
    if(rush){const active=!!z.active;c.save();c.globalAlpha=active?.22:.08;c.fillStyle=active?'#7a48a8':'#aaa0b8';c.beginPath();c.arc(p.x,p.y,z.radius*pulse,0,TAU);c.fill();c.globalAlpha=.85;c.strokeStyle=active?spellStyle.bright:'#d6cce3';c.lineWidth=active?3:2.2;if(!active)c.setLineDash([7,6]);c.beginPath();c.arc(p.x,p.y,z.radius,0,TAU);c.stroke();c.setLineDash([]);for(let i=0;i<8;i++){const a=i*TAU/8+time*.18,r=z.radius*.62;ellipse(c,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.72,5,5,active?'#d9c2eeaa':'#b9afc588');ellipse(c,p.x+Math.cos(a)*r-1.5,p.y+Math.sin(a)*r*.72-1,1,1,'#4b3c59');ellipse(c,p.x+Math.cos(a)*r+1.5,p.y+Math.sin(a)*r*.72-1,1,1,'#4b3c59');}c.restore();continue;}
    if(cyclone){c.save();c.globalAlpha=.12+.14*life;c.fillStyle=spellStyle.base;c.beginPath();c.arc(p.x,p.y,z.radius*pulse,0,TAU);c.fill();c.globalAlpha=.78;c.strokeStyle=spellStyle.bright;c.lineWidth=2.6;spellRing(c,spellStyle);c.beginPath();c.arc(p.x,p.y,z.radius,0,TAU);c.stroke();c.setLineDash([]);for(let ring=0;ring<3;ring++){c.globalAlpha=.45+.12*ring;c.strokeStyle=ring===2?'#eefcff':spellStyle.soft;c.lineWidth=1.8+ring*.5;c.beginPath();c.arc(p.x,p.y,z.radius*(.78-ring*.22),time*(1.8+ring*.5)+ring,time*(1.8+ring*.5)+ring+4.7);c.stroke();}for(let i=0;i<12;i++){const a=-time*2.5+i*TAU/12,r=z.radius*(.2+.72*((i*37)%11)/11);ellipse(c,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.62,3+i%2,2,spellStyle.soft+'aa');}c.restore();continue;}
    c.save();c.globalAlpha=.16+.11*life;c.fillStyle=mud?'#786548':poison?spellStyle.base:'#9aa36d';c.beginPath();c.arc(p.x,p.y,z.radius*pulse,0,TAU);c.fill();
    c.globalAlpha=.62;c.strokeStyle=mud?'#b6a276':poison?spellStyle.bright:'#c9ec82';c.lineWidth=poison?2.4:2;if(poison)spellRing(c,spellStyle);else c.setLineDash([5,6]);c.beginPath();c.arc(p.x,p.y,z.radius,0,TAU);c.stroke();c.setLineDash([]);
    for(let i=0;i<7;i++){const a=i*TAU/7+time*.25,r=z.radius*(.25+.55*((i*37)%10)/10);ellipse(c,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.65,3,2,mud?'#9b875f88':poison?spellStyle.soft+'99':'#c7e38488');}
    c.restore();
  }
  // Continuous laser beams are drawn beneath units so the locked target remains readable.
  for(const u of g.units||[]){
    if(!['lasertower','laserdragon'].includes(u.type)||u.hp<=0||!u.target)continue;
    const target=[...(g.units||[]),...(g.towers||[])].find(e=>e.id===u.target&&e.hp>0);if(!target)continue;
    const p=orient(u,seat),q=orient(target,seat),stage=u.laserStage||0,pulse=.75+.2*Math.sin(time*18);
    c.save();c.globalAlpha=.7+.18*pulse;c.strokeStyle=stage>=4?'#ff9bd5':stage>=2?'#e8b4ff':'#c8d5ff';c.lineWidth=Math.min(8,2+stage*.85);c.beginPath();c.moveTo(p.x,p.y-(u.type==='laserdragon'?39:32));c.lineTo(q.x,q.y-(target.air?20:12));c.stroke();
    c.globalAlpha=.9;c.strokeStyle='#fff3ff';c.lineWidth=1.2;c.beginPath();c.moveTo(p.x,p.y-(u.type==='laserdragon'?39:32));c.lineTo(q.x,q.y-(target.air?20:12));c.stroke();c.restore();
  }
  const markerUnits=[];
  for(const item of renderOrder(g,seat)){
    if(item.tower){drawTower(c,item.entity,seat,time);continue;}
    const u=item.entity,p=orient(u,seat),owner=u.owner===seat?0:1,facing=visualFacing(u,seat);
    if(u.burrowState==='burrow'){
      c.save();c.globalAlpha=.7;ellipse(c,p.x,p.y+2,17,7,'#806548');ellipse(c,p.x-8,p.y-2,5,3,'#a58a62');ellipse(c,p.x+7,p.y-3,4,2,'#b19970');c.strokeStyle=TEAM_COLORS[owner]+'99';c.lineWidth=1.5;c.setLineDash([3,5]);c.beginPath();c.ellipse(p.x,p.y,20,9,0,0,TAU);c.stroke();c.setLineDash([]);c.restore();continue;
    }
    if(u.deploying){
      const total=Math.max(.01,u.deployTotal||1),remaining=Math.max(0,u.deployRemaining||0),progress=clamp(1-remaining/total,0,1),team=TEAM_COLORS[owner];
      c.save();
      c.globalAlpha=.14+.10*Math.sin(time*8)*Math.sin(time*8);ellipse(c,p.x,p.y+5,u.radius+14,(u.radius+14)*.42,team);
      c.globalAlpha=.9;c.strokeStyle=team;c.lineWidth=2.4;c.setLineDash([5,4]);c.beginPath();c.ellipse(p.x,p.y+5,u.radius+10,(u.radius+10)*.38,0,0,TAU);c.stroke();c.setLineDash([]);
      c.lineWidth=3.2;c.strokeStyle='#f2f7df';c.beginPath();c.arc(p.x,p.y+5,u.radius+16,-Math.PI/2,-Math.PI/2+TAU*progress);c.stroke();
      for(let i=0;i<5;i++){const a=time*2.8+i*TAU/5,r=u.radius+11+4*Math.sin(time*3+i);ellipse(c,p.x+Math.cos(a)*r,p.y-7+Math.sin(a)*r*.42,2.5,2.5,i%2?team:'#f4edbe');}
      c.restore();
      drawUnit(c,u.type,p.x,p.y,(u.type==='mossling'||u.type==='goblin_melee'||u.type==='goblin_spear')? .9:(u.type==='boneswarm'||u.type==='skeleton')?.78:u.type==='tombstone'?.92:u.type==='tigger'?1.0:u.type==='muddragon'?.92:u.type==='laserdragon'?.92:u.type==='skybomber'?.92:u.type==='scrapdrill'?.94:u.type==='crusherogre'?.9:u.type==='siegeturtle'?.88:u.type==='bombcarrier'?.98:u.type==='skeletonbarrel'?.98:u.type==='giantskeleton'?.88:u.type==='apprenticeguard'?.92:(u.type==='icespirit'||u.type==='firespirit')?1.0:u.type==='oven'?.95:u.type==='barbarian'?.96:u.type==='siegebarbarian'?.93:u.type==='blowdart'?.9:u.type==='lasertower'?.92:u.type==='bat'?.93:u.type==='golem'?.92:u.type==='icegolem'?.90:u.type==='mini_golem'?.72:u.type==='berserker'?.94:u.type==='miniberserker'?.98:u.type==='megaknight'?.88:u.type==='ironeye'?.94:u.type==='tracker'?.92:u.type==='valkyrie'?.96:u.type==='megagargoyle'?.98:u.type==='gargoyle'?.92:u.type==='archer'?.82:u.type==='harpy'?.9:u.type==='electrowizard'?.95:u.type==='dosranboss'?.88:u.type==='ranbos'?.84:.95,{time,walk:0,moving:false,owner,anim:0,hit:0,charged:false,sparkCharged:false,sparkChargeProgress:0,stunned:false,laserStage:u.laserStage||0,shieldHp:u.shieldHp||0,maxShieldHp:u.maxShieldHp||0,stealthed:false,eggHatchRemaining:u.eggHatchRemaining||0,drillStage:u.drillStage||0,drillDps:u.drillDps||0,crusherStage:u.crusherStage||0,iceSpiritState:u.iceSpiritState||null,iceSpiritProgress:u.iceSpiritProgress||0,fireSpiritState:u.fireSpiritState||null,fireSpiritProgress:u.fireSpiritProgress||0,megaJumpState:u.megaJumpState||null,megaJumpProgress:u.megaJumpProgress||0,riverJumpState:u.riverJumpState||null,riverJumpProgress:u.riverJumpProgress||0,ironSpinUsed:!!u.ironSpinUsed,ironSpinState:u.ironSpinState||null,ironSpinProgress:u.ironSpinProgress||0,hookState:u.hookState||null,hookProgress:u.hookProgress||0,hookAirAttackRemaining:u.hookAirAttackRemaining||0,deploying:true,deployProgress:progress,turtleShellActive:!!u.turtleShellActive,summonCasting:false,dashWindup:false,dashing:false,invulnerable:true,alpha:.16+.34*progress,back:facing.back,mirror:u.building?false:facing.mirror,facing:facing.angle});
      const w=Math.max(34,Math.min(62,u.radius*2+22)),barY=p.y-(u.air?50:88);
      rr(c,p.x-w/2,barY,w,7,3,'#172f34cc');rr(c,p.x-w/2+1,barY+1,(w-2)*progress,5,2,team);
      c.save();c.fillStyle='#f3f6e7';c.font='bold 9px sans-serif';c.textAlign='center';c.fillText(`${u.building?'建設':'召喚'} ${remaining.toFixed(1)}s`,p.x,barY-5);c.restore();
      continue;
    }
    if(u.type==='megaknight'&&(u.megaJumpState==='windup'||u.megaJumpState==='leap')&&Number.isFinite(u.megaJumpTargetX)&&Number.isFinite(u.megaJumpTargetY)){const q=orient({x:u.megaJumpTargetX,y:u.megaJumpTargetY},seat);c.save();c.globalAlpha=u.megaJumpState==='leap'?.78:(.55+.15*Math.sin(time*9));c.strokeStyle='#ffd76a';c.lineWidth=u.megaJumpState==='leap'?3:2.4;c.setLineDash(u.megaJumpState==='leap'?[]:[6,5]);c.beginPath();c.ellipse(q.x,q.y,u.jumpRadius||48,(u.jumpRadius||48)*.48,0,0,TAU);c.stroke();c.setLineDash([]);c.restore();}
    c.strokeStyle=TEAM_COLORS[owner]+'b0';c.lineWidth=2;c.beginPath();c.ellipse(p.x,p.y+4,u.radius+4,(u.radius+4)*.34,0,0,TAU);c.stroke();
    drawUnit(c,u.type,p.x,p.y,(u.type==='mossling'||u.type==='goblin_melee'||u.type==='goblin_spear')? .9:(u.type==='boneswarm'||u.type==='skeleton')?.78:u.type==='tombstone'?.92:u.type==='tigger'?1.0:u.type==='muddragon'?.92:u.type==='laserdragon'?.92:u.type==='skybomber'?.92:u.type==='scrapdrill'?.94:u.type==='crusherogre'?.9:u.type==='siegeturtle'?.88:u.type==='bombcarrier'?.98:u.type==='skeletonbarrel'?.98:u.type==='giantskeleton'?.88:u.type==='apprenticeguard'?.92:(u.type==='icespirit'||u.type==='firespirit')?1.0:u.type==='oven'?.95:u.type==='barbarian'?.96:u.type==='siegebarbarian'?.93:u.type==='blowdart'?.9:u.type==='lasertower'?.92:u.type==='bat'?.93:u.type==='golem'?.92:u.type==='icegolem'?.90:u.type==='mini_golem'?.72:u.type==='berserker'?.94:u.type==='miniberserker'?.98:u.type==='megaknight'?.88:u.type==='ironeye'?.94:u.type==='tracker'?.92:u.type==='valkyrie'?.96:u.type==='megagargoyle'?.98:u.type==='gargoyle'?.92:u.type==='archer'?.82:u.type==='harpy'?.9:u.type==='electrowizard'?.95:u.type==='dosranboss'?.88:u.type==='ranbos'?.84:.95,{time,walk:u.walk,moving:u.moving,owner,anim:u.anim,hit:u.hit,charged:u.charged,sparkCharged:u.sparkCharged,sparkChargeProgress:u.sparkChargeProgress,stunned:u.stunned,laserStage:u.laserStage||0,shieldHp:u.shieldHp||0,maxShieldHp:u.maxShieldHp||0,stealthed:!!u.stealthed,eggHatchRemaining:u.eggHatchRemaining||0,drillStage:u.drillStage||0,drillDps:u.drillDps||0,crusherStage:u.crusherStage||0,iceSpiritState:u.iceSpiritState||null,iceSpiritProgress:u.iceSpiritProgress||0,fireSpiritState:u.fireSpiritState||null,fireSpiritProgress:u.fireSpiritProgress||0,megaJumpState:u.megaJumpState||null,megaJumpProgress:u.megaJumpProgress||0,riverJumpState:u.riverJumpState||null,riverJumpProgress:u.riverJumpProgress||0,ironSpinUsed:!!u.ironSpinUsed,ironSpinState:u.ironSpinState||null,ironSpinProgress:u.ironSpinProgress||0,hookState:u.hookState||null,hookProgress:u.hookProgress||0,hookAirAttackRemaining:u.hookAirAttackRemaining||0,turtleShellActive:!!u.turtleShellActive,summonCasting:u.summonCasting,summonWindupRemaining:u.summonWindupRemaining,dashWindup:u.dashState==='windup',dashing:u.dashState==='rush',invulnerable:!!u.invulnerable,alpha:u.stealthed?.38:(u.spawn>0?.5:1),back:facing.back,mirror:u.building?false:facing.mirror,facing:facing.angle});
    if(u.maxShieldHp>0&&u.shieldHp>0){const ratio=clamp(u.shieldHp/u.maxShieldHp,0,1),yy=p.y-(u.air?58:89);rr(c,p.x-20,yy,40,4,2,'#263a43aa');rr(c,p.x-19,yy+1,38*ratio,2,1,'#9fe6f0');}
    if(u.stealthed){c.save();c.globalAlpha=.7;c.strokeStyle='#b9f6e3';c.lineWidth=1.8;c.setLineDash([4,4]);c.beginPath();c.ellipse(p.x,p.y-20,u.radius+8,(u.radius+8)*.7,0,0,TAU);c.stroke();c.setLineDash([]);c.fillStyle='#e8fff7';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText(`STEALTH ${u.stealthRemaining.toFixed(1)}s`,p.x,p.y-64);c.restore();}
    if(u.type==='phoenix_egg'){c.save();c.fillStyle='#fff0bd';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText(`HATCH ${u.eggHatchRemaining.toFixed(1)}s`,p.x,p.y-48);c.restore();}
    if(u.ironMarked){const mp=clamp(u.ironMarkProgress||0,0,1);c.save();c.strokeStyle='#e6d16f';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-(u.air?43:73),8,0,TAU);c.stroke();line(c,p.x-5,p.y-(u.air?43:73),p.x+5,p.y-(u.air?43:73),'#e6d16f',1.5);line(c,p.x,p.y-(u.air?48:78),p.x,p.y-(u.air?38:68),'#e6d16f',1.5);c.strokeStyle='#f4edb4';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y-(u.air?43:73),11,-Math.PI/2,-Math.PI/2+TAU*mp);c.stroke();c.restore();}
    if(u.slowed){const stage=Math.max(1,Math.min(3,u.slowStage||1));c.save();c.strokeStyle='#a9ebffdd';c.lineWidth=1.5+stage*.55;c.setLineDash([3,4]);for(let k=0;k<stage;k++){const r=u.radius+7+k*4;c.beginPath();c.ellipse(p.x,p.y+3,r,r*.42,0,0,TAU);c.stroke();}c.setLineDash([]);c.fillStyle='#dffaff';c.font='bold 8px sans-serif';c.textAlign='center';c.fillText(`ICE ${stage}`,p.x,p.y-(u.air?48:78));c.restore();}
    if(u.poisoned){const ps=spellTeamStyle(u.poisonOwner,seat);c.save();c.strokeStyle=ps.bright+'dd';c.lineWidth=2;spellRing(c,ps);c.beginPath();c.ellipse(p.x,p.y+3,u.radius+7,(u.radius+7)*.48,0,0,TAU);c.stroke();c.restore();}
    if(u.mudded){c.save();c.strokeStyle='#b59c6dcc';c.lineWidth=2;c.setLineDash([5,3]);c.beginPath();c.ellipse(p.x,p.y+4,u.radius+9,(u.radius+9)*.42,0,0,TAU);c.stroke();c.restore();}
    if(u.stunned){c.save();c.strokeStyle='#bcefff';c.lineWidth=2.4;c.beginPath();c.arc(p.x,p.y-30,u.radius+10,0,TAU);c.stroke();for(let i=0;i<4;i++){const a=i*TAU/4+time*5,r=u.radius+9;line(c,p.x+Math.cos(a)*r,p.y-30+Math.sin(a)*r,p.x+Math.cos(a+.65)*(r+8),p.y-30+Math.sin(a+.65)*(r+8),'#fff2a3',1.8);}c.restore();}
    const hp=u.hp/u.maxHp,w=u.type==='golem'?50:u.type==='mini_golem'?32:u.type==='berserker'?42:u.type==='miniberserker'?34:u.type==='megaknight'?48:u.type==='ironeye'?30:u.type==='tracker'?40:u.type==='valkyrie'?38:u.type==='megagargoyle'?30:u.type==='gargoyle'?22:u.type==='boar'?38:u.type==='crusherogre'?45:u.type==='siegeturtle'?46:u.type==='scrapdrill'?34:u.type==='skybomber'?32:u.type==='bombcarrier'?24:u.type==='giantskeleton'?46:u.type==='knight'||u.type==='shieldknight'?38:u.type==='phoenix_egg'?30:(u.type==='mossling'||u.type==='goblin_melee'||u.type==='goblin_spear')?20:(u.type==='boneswarm'||u.type==='skeleton')?16:u.type==='tombstone'?34:u.type==='oven'?38:u.type==='elixirgolem'?40:u.type==='elixir_golem_mid'?29:u.type==='elixir_blob'?20:u.type==='royalgiant'?46:28;
    if(hp<.999){rr(c,p.x-w/2,p.y-(u.air?48:82),w,5,2,'#25363eaa');rr(c,p.x-w/2+1,p.y-(u.air?47:81),(w-2)*hp,3,1,TEAM_COLORS[owner]);}
    if(owner===0&&!u.air&&!u.building&&g.towers.some(t=>{const q=orient(t,seat);return t.hp>0&&q.y>p.y&&q.y-p.y<90&&Math.abs(q.x-p.x)<t.radius+8;}))markerUnits.push(p);
  }
  // Position hints remain visible if a tower occludes a friendly sprite.
  for(const p of markerUnits){c.save();c.globalAlpha=.8;path(c,[[p.x,p.y-7],[p.x+4,p.y],[p.x,p.y+7],[p.x-4,p.y]],null,'#dcf5bf',1.5);c.restore();}
  if(options.physics){
    c.save();c.lineWidth=1.5;c.setLineDash([4,3]);
    for(const e of [...g.towers,...g.units])if(e.hp>0&&!e.collisionDisabled){const p=orient(e,seat);c.strokeStyle=e.air?'#e1c3ff':(e.kind||e.building)?'#ffe0a0':'#d6f7df';c.beginPath();c.arc(p.x,p.y,e.radius,0,TAU);c.stroke();}
    c.restore();
  }
  for(const p of g.projectiles){
    const pos=orient(p,seat),target=orient({x:p.tx,y:p.ty},seat),angle=Math.atan2(target.y-pos.y,target.x-pos.x);
    if(p.kind==='arrowrain'){
      const progress=clamp(p.progress||0,0,1),warn=progress>.35,ss=spellTeamStyle(p.owner,seat);
      if(warn){c.save();c.globalAlpha=.12+progress*.2;c.fillStyle=ss.base;c.beginPath();c.arc(target.x,target.y,p.radius||130,0,TAU);c.fill();c.globalAlpha=.9;c.strokeStyle=ss.bright;c.lineWidth=2;spellRing(c,ss);c.stroke();c.restore();}
      c.save();
      for(let i=0;i<11;i++){const a=i*2.39,rad=(p.radius||130)*(.18+.7*((i*37)%10)/10),ax=target.x+Math.cos(a)*rad,ay=target.y+Math.sin(a)*rad*.55-80*(1-progress);line(c,ax-6,ay-18,ax+2,ay+6,ss.base,3.2);line(c,ax-6,ay-18,ax+2,ay+6,'#ead8b4',1.35);path(c,[[ax-1,ay+5],[ax+5,ay+10],[ax+1,ay+1]],ss.soft);}
      c.restore();continue;
    }
    if(p.kind==='fireball'){
      const progress=clamp(p.progress||0,0,1),arc=Math.sin(Math.PI*progress)*72,ss=spellTeamStyle(p.owner,seat);
      if(progress>.72){c.save();c.globalAlpha=.18+(progress-.72)*1.5;c.fillStyle=ss.base;c.beginPath();c.arc(target.x,target.y,p.radius||90,0,TAU);c.fill();c.globalAlpha=.95;c.strokeStyle=ss.bright;c.lineWidth=2.5;spellRing(c,ss);c.stroke();c.restore();}
      c.save();c.translate(pos.x,pos.y-18-arc);c.rotate(angle);
      c.globalAlpha=.72;c.strokeStyle=ss.base;c.lineWidth=5;c.beginPath();c.arc(0,0,15,0,TAU);c.stroke();c.globalAlpha=1;
      for(let i=0;i<4;i++)ellipse(c,-13-i*7,0,10-i*1.6,7-i,'#f08a4f'+(i===0?'dd':'77'));
      ellipse(c,0,0,12,12,'#f15e3d');ellipse(c,2,-2,7,7,'#ffbf63');ellipse(c,4,-4,3,3,'#fff0a5');c.restore();continue;
    }
    c.save();
    try{
      const thrownBomb=p.kind==='bomb',bombProgress=thrownBomb?clamp(p.progress||0,0,1):0,bombArc=thrownBomb?Math.sin(Math.PI*bombProgress)*42:0;
      c.translate(pos.x,pos.y-10-bombArc);c.rotate(thrownBomb?angle+bombProgress*TAU*1.35:angle);
      if(p.kind==='arrow'){line(c,-10,0,7,0,'#f2dfb8',2);path(c,[[6,-3],[13,0],[6,3]],'#edf5df');}
      else if(p.kind==='iron_arrow'){line(c,-12,0,8,0,'#9ea9a3',2);path(c,[[7,-3],[15,0],[7,3]],'#668e68','#263b2d',.7);line(c,-8,-3,-4,3,'#496f50',1.6);}
      else if(p.kind==='royal_arrow'){line(c,-16,0,10,0,'#f7e7c2',2.4);path(c,[[9,-4],[18,0],[9,4]],'#f0c86d','#5c4650',.8);line(c,-11,-4,-7,4,'#e6a9c3',2);}
      else if(p.kind==='royal_shell'){ellipse(c,0,0,9,9,'#30373a','#1f282b',1.5);ellipse(c,-3,-3,3,3,'#8c9697');for(let i=1;i<=3;i++)ellipse(c,-8-i*7,0,7-i,4-i*.5,'#b9b4a777');}
      else if(p.kind==='sparkblast'){ellipse(c,0,0,12,10,'#91e5ff');ellipse(c,1,-1,7,6,'#f5ffff');for(let i=0;i<4;i++){const a=i*TAU/4+time*6;line(c,Math.cos(a)*7,Math.sin(a)*6,Math.cos(a+.5)*18,Math.sin(a+.5)*13,'#ffe875',2);}}
      else if(p.kind==='dart'){line(c,-12,0,8,0,'#e8d59d',1.6);path(c,[[7,-2],[14,0],[7,2]],'#8fd06d');}
      else if(p.kind==='bomb'){ellipse(c,0,0,8,8,'#2a3941');line(c,0,-7,4,-11,'#fbd078',2);}
      else if(p.kind==='sky_bomb'){ellipse(c,0,0,9,11,'#3c4344');path(c,[[-5,-7],[0,-14],[5,-7]],'#8ba8ad','#283b40',1);line(c,-2,-12,3,-17,'#e0aa59',2);}
      else if(p.kind==='frost'){path(c,[[-9,0],[0,-8],[10,0],[0,8]],'#a8edff','#4c8297',1);ellipse(c,0,0,3,3,'#effdff');}
      else if(p.kind==='lightning'){line(c,-10,0,-2,-5,'#ffe074',3);line(c,-2,-5,3,4,'#fff1a4',3);line(c,3,4,12,0,'#ffe074',3);}
      else if(p.kind==='electro'){ellipse(c,0,0,8,8,'#bdf3ff');ellipse(c,0,0,4,4,'#fff6a8');line(c,-12,1,-5,-5,'#ffe36d',2.4);line(c,5,5,12,-2,'#dffcff',2.4);}
      else if(p.kind==='wind'){c.strokeStyle='#d9fff4';c.lineWidth=2;c.beginPath();c.arc(0,0,10,-2.5,2.5);c.stroke();c.beginPath();c.arc(-6,0,7,-2.2,2.2);c.stroke();line(c,-14,-4,8,-4,'#9ee4cf',1.5);}
      else if(p.kind==='gravity'){ellipse(c,0,0,10,10,'#3b315d');ellipse(c,0,0,5,5,'#c6b7ff');c.strokeStyle='#9d8bd0';c.lineWidth=1.5;c.beginPath();c.arc(0,0,15,time,time+4.5);c.stroke();}
      else if(p.kind==='phoenix_fire'){ellipse(c,0,0,8,7,'#ffb64e');path(c,[[-12,0],[-3,-7],[2,0],[-3,7]],'#ee6a3d');ellipse(c,3,-1,4,4,'#fff1a0');}
      else if(p.kind==='thrown_spear'){line(c,-16,0,10,0,'#76583c',2.6);path(c,[[8,-4],[18,0],[8,4]],'#ddd8bd','#2b4038',.8);}
      else if(p.kind==='light'){ellipse(c,0,0,7,7,'#ffe7a3');ellipse(c,0,0,3,3,'#e6ffff');}
      else if(p.kind==='mud'){ellipse(c,0,0,9,7,'#806847');ellipse(c,-4,-2,4,3,'#b09a6e');ellipse(c,4,1,3,2,'#5f513b');}
      else if(p.kind==='necro'){ellipse(c,0,0,9,9,'#7ecf9b');ellipse(c,0,0,5,5,'#d9f4c9');ellipse(c,-5,-2,2,2,'#806b9d');}
      else if(p.kind==='dark'){ellipse(c,0,0,9,9,'#6d557e');ellipse(c,0,0,5,5,'#e384d3');ellipse(c,-5,-2,2,2,'#d6a2e3');}
      else{ellipse(c,0,0,p.kind==='orb'?8:5,p.kind==='orb'?8:5,p.kind==='orb'?'#c8b0f1':'#f9d494');ellipse(c,-4,0,3,3,'#fff3ca');}
    }finally{c.restore();}
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
    }else if(e.type==='ram-hit'){
      c.strokeStyle=e.charged?'#ffd56a':'#d0a26a';c.lineWidth=3.5;c.beginPath();c.arc(p.x,p.y-9,(e.radius||40)*(1-fade*.25),0,TAU);c.stroke();for(let i=0;i<9;i++){const a=i*TAU/9+e.id*.1,len=(1-fade)*(e.radius||40);ellipse(c,p.x+Math.cos(a)*len,p.y-9+Math.sin(a)*len*.55,3+fade*5,3+fade*4,i%2?'#c28b52':'#7b6a53');}
    }else if(e.type==='sparky-ready'){
      c.strokeStyle='#bcefff';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-34,16+(1-fade)*25,0,TAU);c.stroke();c.fillStyle='#fff2a3';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('FULL',p.x,p.y-63-(1-fade)*8);
    }else if(e.type==='sparky-fire'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle='#eaffff';c.lineWidth=4*fade+1;c.beginPath();c.moveTo(p.x,p.y-36);c.lineTo(q.x,q.y-10);c.stroke();
    }else if(e.type==='stun'){
      c.strokeStyle='#bcefff';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y-20,12+(1-fade)*22,0,TAU);c.stroke();for(let i=0;i<6;i++){const a=i*TAU/6+e.id;line(c,p.x+Math.cos(a)*10,p.y-20+Math.sin(a)*10,p.x+Math.cos(a+.55)*(18+(1-fade)*12),p.y-20+Math.sin(a+.55)*(18+(1-fade)*12),'#ffe875',1.8);}
    }else if(e.type==='zap-impact'){
      const ss=spellTeamStyle(e.owner,seat);c.strokeStyle=ss.bright;c.lineWidth=3;spellRing(c,ss);c.beginPath();c.arc(p.x,p.y,(e.radius||78)*(1-fade*.28),0,TAU);c.stroke();c.setLineDash([]);for(let i=0;i<8;i++){const a=i*TAU/8+e.id;const r=(e.radius||78)*(.25+.55*(1-fade));line(c,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.65,p.x+Math.cos(a+.28)*(r+15),p.y+Math.sin(a+.28)*(r+15)*.65,i%2?'#dffaff':'#ffe875',2);}
    }else if(e.type==='iron-mark'){
      c.strokeStyle='#e6d16f';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y-20,10+(1-fade)*12,0,TAU);c.stroke();line(c,p.x-7,p.y-20,p.x+7,p.y-20,'#e6d16f',2);line(c,p.x,p.y-27,p.x,p.y-13,'#e6d16f',2);
    }else if(e.type==='iron-mark-break'){
      c.strokeStyle='#fff0a0';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-18,12+(1-fade)*30,0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8;line(c,p.x+Math.cos(a)*8,p.y-18+Math.sin(a)*8,p.x+Math.cos(a)*(22+(1-fade)*20),p.y-18+Math.sin(a)*(22+(1-fade)*20),'#d3bb58',2);}
    }else if(e.type==='iron-spin'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle='#b7d5b4';c.lineWidth=5*fade+1;c.setLineDash([7,5]);c.beginPath();c.moveTo(p.x,p.y-15);c.lineTo(q.x,q.y-15);c.stroke();c.setLineDash([]);
    }else if(e.type==='tracker-hook-windup'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle='#d5d9d6';c.lineWidth=1.8;c.setLineDash([4,5]);c.beginPath();c.moveTo(p.x,p.y-28);c.lineTo(q.x,q.y-12);c.stroke();c.setLineDash([]);
    }else if(e.type==='tracker-hook'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle=e.mode==='air'?'#dbeeff':'#b9c0bd';c.lineWidth=3;c.setLineDash([3,3]);c.beginPath();c.moveTo(p.x,p.y-30);c.lineTo(q.x,q.y-12);c.stroke();c.setLineDash([]);for(let i=1;i<6;i++){const m=i/6,xx=p.x+(q.x-p.x)*m,yy=(p.y-30)+(q.y-12-(p.y-30))*m;ellipse(c,xx,yy,2.2,2.2,'#687278');}
    }else if(e.type==='tracker-air-window'){
      c.strokeStyle='#cfe8f5';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-24,14+(1-fade)*16,0,TAU);c.stroke();
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
      const stage=Math.max(1,Math.min(3,e.stage||1));c.strokeStyle='#a7ebff';c.lineWidth=1.6+stage*.5;c.beginPath();c.arc(p.x,p.y-15,12+(1-fade)*18+stage*2,0,TAU);c.stroke();for(let i=0;i<4+stage*2;i++){const a=i*TAU/(4+stage*2);line(c,p.x+Math.cos(a)*12,p.y-15+Math.sin(a)*12,p.x+Math.cos(a)*(18+stage*2),p.y-15+Math.sin(a)*(18+stage*2),'#dffaff',1.5);}
    }else if(e.type==='chain'){
      if(e.points?.length){let a=orient({x:e.x,y:e.y},seat);for(const q0 of e.points){const q=orient(q0,seat),mx=(a.x+q.x)/2+((String(e.id).length%2)?5:-5);line(c,a.x,a.y-10,mx,(a.y+q.y)/2-16,'#ffe16e',3);line(c,mx,(a.y+q.y)/2-16,q.x,q.y-10,'#fff3b1',2);a=q;}}
    }else if(e.type==='laser-lock'||e.type==='laser-ramp'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle=e.type==='laser-ramp'?'#f0b5ff':'#cad8ff';c.lineWidth=e.type==='laser-ramp'?4:2;c.beginPath();c.moveTo(p.x,p.y-20);c.lineTo(q.x,q.y-10);c.stroke();
      if(e.type==='laser-ramp'){c.fillStyle='#fff0ff';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText(`POWER ×${Math.pow(2,e.stage||0)}`,p.x,p.y-50);}
    }else if(e.type==='burrow-start'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle='#a88a60aa';c.lineWidth=3;c.setLineDash([4,6]);c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo((p.x+q.x)/2,p.y-18,q.x,q.y);c.stroke();c.setLineDash([]);
    }else if(e.type==='burrow-arrive'){
      c.strokeStyle='#d2b47d';c.lineWidth=3;c.beginPath();c.ellipse(p.x,p.y,12+(1-fade)*26,6+(1-fade)*12,0,0,TAU);c.stroke();for(let i=0;i<7;i++){const a=i*TAU/7;ellipse(c,p.x+Math.cos(a)*(1-fade)*24,p.y+Math.sin(a)*(1-fade)*10,3,2,'#a8845e');}
    }else if(e.type==='cyclone-deploy'){
      const ss=spellTeamStyle(e.owner,seat);c.strokeStyle=ss.bright;c.lineWidth=3;spellRing(c,ss);c.beginPath();c.arc(p.x,p.y,(e.radius||130)*(1-fade*.3),0,TAU);c.stroke();c.setLineDash([]);for(let i=0;i<8;i++){const a=i*TAU/8+(1-fade)*5,r=(e.radius||130)*(.2+.6*(1-fade));line(c,p.x+Math.cos(a)*r,p.y+Math.sin(a)*r*.6,p.x+Math.cos(a+.5)*(r*.7),p.y+Math.sin(a+.5)*(r*.7)*.6,ss.soft,2);}
    }else if(e.type==='shield-hit'||e.type==='shield-break'){
      c.strokeStyle=e.type==='shield-break'?'#fff1bd':'#aeefff';c.lineWidth=e.type==='shield-break'?4:2.5;c.beginPath();c.arc(p.x,p.y-28,18+(1-fade)*24,-2.4,2.4);c.stroke();
    }else if(e.type==='stealth-start'||e.type==='stealth-reveal'){
      c.strokeStyle=e.type==='stealth-start'?'#b9f6e3':'#e4cfff';c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.arc(p.x,p.y-24,10+(1-fade)*26,0,TAU);c.stroke();c.setLineDash([]);
    }else if(e.type==='phoenix-egg'||e.type==='phoenix-revive'){
      c.strokeStyle=e.type==='phoenix-revive'?'#ffd56b':'#ef9b5a';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-18,12+(1-fade)*30,0,TAU);c.stroke();for(let i=0;i<6;i++){const a=i*TAU/6;ellipse(c,p.x+Math.cos(a)*(1-fade)*28,p.y-18+Math.sin(a)*(1-fade)*20,3,3,'#ffd56b');}
    }else if(e.type==='wind-push'||e.type==='gravity-pull'){
      c.strokeStyle=e.type==='wind-push'?'#c9fff0':'#c8b8ff';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-14,8+(1-fade)*18,0,TAU);c.stroke();
    }else if(e.type==='drill-lock'||e.type==='drill-ramp'){
      const q=orient({x:e.tx,y:e.ty},seat);c.strokeStyle=e.type==='drill-ramp'?'#ffd37a':'#c8b98e';c.lineWidth=e.type==='drill-ramp'?4:2;c.beginPath();c.moveTo(p.x,p.y-16);c.lineTo(q.x,q.y-8);c.stroke();
    }else if(e.type==='crusher-hit'){
      c.strokeStyle='#ffd39b';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-12,10+(1-fade)*28,0,TAU);c.stroke();
    }else if(e.type==='ice-spirit-leap'){
      const q=orient({x:e.tx,y:e.ty},seat),mx=(p.x+q.x)/2,my=(p.y+q.y)/2-34;c.strokeStyle='#bcefff';c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.moveTo(p.x,p.y-10);c.quadraticCurveTo(mx,my,q.x,q.y-10);c.stroke();c.setLineDash([]);
    }else if(e.type==='ice-spirit-burst'){
      c.globalAlpha=fade*.28;c.fillStyle='#bcefff';c.beginPath();c.arc(p.x,p.y-10,(e.radius||48)*(1-fade*.18),0,TAU);c.fill();c.globalAlpha=fade;c.strokeStyle='#e8fcff';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-10,(e.radius||48)*(1-fade*.30),0,TAU);c.stroke();for(let i=0;i<10;i++){const a=i*TAU/10+e.id*.12,r=(1-fade)*(e.radius||48);path(c,[[p.x+Math.cos(a)*r,p.y-10+Math.sin(a)*r*.7],[p.x+Math.cos(a)*r-3,p.y-17+Math.sin(a)*r*.7],[p.x+Math.cos(a)*r+3,p.y-17+Math.sin(a)*r*.7]],'#dffaff');}
    }else if(e.type==='fire-spirit-leap'){
      const q=orient({x:e.tx,y:e.ty},seat),mx=(p.x+q.x)/2,my=(p.y+q.y)/2-34;c.strokeStyle='#ff9a47';c.lineWidth=2;c.setLineDash([4,4]);c.beginPath();c.moveTo(p.x,p.y-10);c.quadraticCurveTo(mx,my,q.x,q.y-10);c.stroke();c.setLineDash([]);
    }else if(e.type==='fire-spirit-burst'){
      c.globalAlpha=fade*.32;c.fillStyle='#ee6335';c.beginPath();c.arc(p.x,p.y-10,(e.radius||48)*(1-fade*.18),0,TAU);c.fill();c.globalAlpha=fade;c.strokeStyle='#ffd067';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-10,(e.radius||48)*(1-fade*.30),0,TAU);c.stroke();for(let i=0;i<10;i++){const a=i*TAU/10+e.id*.15,r=(1-fade)*(e.radius||48);ellipse(c,p.x+Math.cos(a)*r,p.y-10+Math.sin(a)*r*.7,3+fade*4,3+fade*4,i%2?'#ff9b42':'#ffd15c');}
    }else if(e.type==='carrier-blast'||e.type==='suicide-hit'){
      c.strokeStyle=e.type==='suicide-hit'?'#fff0a0':'#e6a15a';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-10,(e.radius||48)*(1-fade*.3),0,TAU);c.stroke();for(let i=0;i<7;i++){const a=i*TAU/7+e.id;ellipse(c,p.x+Math.cos(a)*(1-fade)*34,p.y-10+Math.sin(a)*(1-fade)*22,3+fade*4,3+fade*4,i%2?'#ffce65':'#e97c45');}
    }else if(e.type==='valkyrie-spin'){
      c.strokeStyle='#ffd39b';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-12,(e.radius||50)*(1-fade*.25),0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8+(1-fade)*2.5;line(c,p.x+Math.cos(a)*14,p.y-12+Math.sin(a)*10,p.x+Math.cos(a)*(28+(1-fade)*18),p.y-12+Math.sin(a)*(22+(1-fade)*13),i%2?'#f7c071':'#d9915a',2);}
    }else if(e.type==='mega-drop-zone'){
      c.strokeStyle='#ffd76a';c.lineWidth=2.5;c.setLineDash([7,5]);c.beginPath();c.ellipse(p.x,p.y,e.radius||48,(e.radius||48)*.48,0,0,TAU);c.stroke();c.setLineDash([]);
    }else if(e.type==='mega-drop-impact'||e.type==='mega-jump-impact'||e.type==='mega-smash'){
      c.strokeStyle=e.type==='mega-smash'?'#c6cbd0':'#ffd76a';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-6,(e.radius||48)*(1-fade*.28),0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8+e.id*.13;line(c,p.x+Math.cos(a)*10,p.y-6+Math.sin(a)*8,p.x+Math.cos(a)*(20+(1-fade)*24),p.y-6+Math.sin(a)*(16+(1-fade)*18),i%2?'#fff0ad':'#9da6aa',2);}
    }else if(e.type==='mega-jump'){
      const q=orient({x:e.tx,y:e.ty},seat),mx=(p.x+q.x)/2,my=(p.y+q.y)/2-70;c.strokeStyle='#ffd76aaa';c.lineWidth=3;c.setLineDash([6,5]);c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo(mx,my,q.x,q.y);c.stroke();c.setLineDash([]);
    }else if(e.type==='turtle-retaliation'){
      c.strokeStyle='#ffd97a';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-12,(e.radius||54)*(1-fade*.28),0,TAU);c.stroke();
      for(let i=0;i<8;i++){const a=i*TAU/8+e.id*.1;line(c,p.x+Math.cos(a)*10,p.y-12+Math.sin(a)*8,p.x+Math.cos(a)*(20+(1-fade)*18),p.y-12+Math.sin(a)*(18+(1-fade)*14),'#ffe7a8',2);}
    }else if(e.type==='turtle-shell'){
      c.strokeStyle='#c6dfb4';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y-18,20+(1-fade)*12,Math.PI,TAU);c.stroke();
    }else if(e.type==='mud-deploy'){
      c.strokeStyle='#b7a477';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(e.radius||45)*(1-fade*.22),0,TAU);c.stroke();for(let i=0;i<8;i++){const a=i*TAU/8+e.id;ellipse(c,p.x+Math.cos(a)*(1-fade)*(e.radius||45)*.65,p.y+Math.sin(a)*(1-fade)*(e.radius||45)*.45,3,2,'#8e7452');}
    }else if(e.type==='lightning-cast'){
      const ss=spellTeamStyle(e.owner,seat);c.strokeStyle='#8fddff';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(e.radius||105)*(1-fade*.18),0,TAU);c.stroke();c.globalAlpha=fade*.22;c.fillStyle=ss.base;c.beginPath();c.arc(p.x,p.y,(e.radius||105),0,TAU);c.fill();
    }else if(e.type==='lightning-hit'){
      c.strokeStyle='#dffaff';c.lineWidth=5;c.beginPath();c.moveTo(p.x-12,p.y-105);c.lineTo(p.x+2,p.y-72);c.lineTo(p.x-7,p.y-50);c.lineTo(p.x+8,p.y-27);c.lineTo(p.x,p.y-8);c.stroke();c.strokeStyle='#75cfff';c.lineWidth=2;c.beginPath();c.moveTo(p.x+13,p.y-92);c.lineTo(p.x-3,p.y-65);c.lineTo(p.x+7,p.y-45);c.lineTo(p.x,p.y-10);c.stroke();ellipse(c,p.x,p.y-8,10+(1-fade)*22,5+(1-fade)*9,'#bcefff55');
    }else if(e.type==='skeletonrush-activate'){
      const ss=spellTeamStyle(e.owner,seat);c.globalAlpha=fade*.22;c.fillStyle='#7a48a8';c.beginPath();c.arc(p.x,p.y,e.radius||110,0,TAU);c.fill();c.globalAlpha=fade;c.strokeStyle=ss.bright;c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,(e.radius||110)*(1-fade*.12),0,TAU);c.stroke();
    }else if(e.type==='skeletonrush-spawn'){
      c.strokeStyle='#d9c2ee';c.lineWidth=2;c.beginPath();c.arc(p.x,p.y-7,8+(1-fade)*16,0,TAU);c.stroke();
    }else if(e.type==='giantskeleton-bomb-explode'){
      c.globalAlpha=fade*.32;c.fillStyle='#f0a34f';c.beginPath();c.arc(p.x,p.y-8,(e.radius||80)*(1-fade*.15),0,TAU);c.fill();c.globalAlpha=fade;c.strokeStyle='#ffd879';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y-8,(e.radius||80)*(1-fade*.28),0,TAU);c.stroke();for(let i=0;i<12;i++){const a=i*TAU/12+e.id*.1,r=(1-fade)*(e.radius||80);ellipse(c,p.x+Math.cos(a)*r,p.y-8+Math.sin(a)*r*.65,4+fade*7,3+fade*6,i%2?'#ffcf68':'#e97845');}
    }else if(e.type==='poison-deploy'){
      const ss=spellTeamStyle(e.owner,seat);c.strokeStyle=ss.bright;c.lineWidth=3;spellRing(c,ss);c.beginPath();c.arc(p.x,p.y,(e.radius||90)*(1-fade*.35),0,TAU);c.stroke();c.setLineDash([]);
      for(let i=0;i<10;i++){const a=i*TAU/10+e.id,len=(1-fade)*(e.radius||90)*.65;ellipse(c,p.x+Math.cos(a)*len,p.y+Math.sin(a)*len*.6,3+fade*4,2+fade*3,ss.soft);}
    }else if(e.type==='arrowrain-impact'){
      const ss=spellTeamStyle(e.owner,seat);c.strokeStyle=ss.bright;c.lineWidth=3;spellRing(c,ss);c.beginPath();c.arc(p.x,p.y,(e.radius||130)*(1-fade*.18),0,TAU);c.stroke();c.setLineDash([]);
      for(let i=0;i<16;i++){const a=i*2.17,len=(1-fade)*(e.radius||130)*.85,x=p.x+Math.cos(a)*len,y=p.y+Math.sin(a)*len*.55;line(c,x-5,y-14,x+2,y+7,ss.base,3);line(c,x-5,y-14,x+2,y+7,'#e7d6b2',1.2);}
    }else if(e.type==='fireball-impact'){
      const ss=spellTeamStyle(e.owner,seat);c.globalAlpha=fade*.34;c.fillStyle=ss.base;c.beginPath();c.arc(p.x,p.y,(e.radius||90)*(1-fade*.18),0,TAU);c.fill();c.globalAlpha=fade;
      c.strokeStyle=ss.bright;c.lineWidth=5*fade+1;spellRing(c,ss);c.beginPath();c.arc(p.x,p.y,(e.radius||90)*(1-fade*.35),0,TAU);c.stroke();c.setLineDash([]);
      for(let i=0;i<14;i++){const a=i*TAU/14+e.id,len=(1-fade)*(e.radius||90);ellipse(c,p.x+Math.cos(a)*len,p.y+Math.sin(a)*len*.65,5+fade*8,4+fade*7,i%2?'#ffb457':'#ef6742');}
    }else if(e.type==='death-blast'){
      c.strokeStyle=e.unitType==='icegolem'?'#9feaff':e.unitType==='mini_golem'?'#d8d7aa':'#ecd39b';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y-8,(e.radius||55)*(1-fade*.25),0,TAU);c.stroke();
      for(let i=0;i<9;i++){const a=i*TAU/9+e.id,len=(1-fade)*(e.radius||55);ellipse(c,p.x+Math.cos(a)*len,p.y-8+Math.sin(a)*len*.6,3+fade*6,3+fade*5,'#b8ad89');}
    }else if(e.type==='elixir-split'){
      const stage=e.stage||1,burst=18+(1-fade)*(stage===1?42:30);c.globalAlpha=.22+fade*.28;ellipse(c,p.x,p.y-24,burst,burst*.72,'#ff8fd5');c.globalAlpha=fade;c.strokeStyle='#ffd0ed';c.lineWidth=4;c.beginPath();c.arc(p.x,p.y-24,12+(1-fade)*(stage===1?45:34),0,TAU);c.stroke();
      for(let i=0;i<8;i++){const a=i*TAU/8+e.id*.23,len=(1-fade)*(stage===1?46:34);ellipse(c,p.x+Math.cos(a)*len,p.y-24+Math.sin(a)*len*.65,4+fade*5,3+fade*4,i%2?'#ffb8e4':'#e96bb9');}
      c.fillStyle='#fff0fb';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(stage===1?'SPLIT ×2':'BLOB ×2',p.x,p.y-62-(1-fade)*10);
    }else if(e.type==='split-spawn'){
      c.strokeStyle=String(e.minion||'').startsWith('elixir_')?'#ff9ddd':'#cfe5aa';c.lineWidth=2.8;c.beginPath();c.arc(p.x,p.y-9,10+(1-fade)*22,0,TAU);c.stroke();
    }else if(e.type==='energy-gift'){
      c.strokeStyle='#ef9bd5';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y-18,12+(1-fade)*20,0,TAU);c.stroke();c.fillStyle='#fff0fb';c.font='bold 12px sans-serif';c.textAlign='center';c.fillText(`+${Number(e.amount||0).toFixed((e.amount||0)%1?1:0)} ELIXIR`,p.x,p.y-45-(1-fade)*10);
    }else if(e.type==='healer-pulse'){
      c.strokeStyle='#e8f7b7';c.lineWidth=2.5;c.beginPath();c.arc(p.x,p.y-18,18+(1-fade)*24,0,TAU);c.stroke();
    }else if(e.type==='summon-spawn'){
      const dark=e.summoner==='darknecro',col=dark?'#e58bd8':'#9ae7b3';c.strokeStyle=col;c.lineWidth=2.4;c.beginPath();c.arc(p.x,p.y-9,9+(1-fade)*22,0,TAU);c.stroke();c.globalAlpha=fade*.7;for(let i=0;i<5;i++){const a=i*TAU/5+e.id;ellipse(c,p.x+Math.cos(a)*(1-fade)*18,p.y-9+Math.sin(a)*(1-fade)*12,2.5,2.5,col);}
    }else if(e.type==='death'||e.type==='blast'){
      for(let i=0;i<8;i++){
        const a=i*TAU/8+e.id,len=(1-fade)*(e.type==='blast'?e.radius:35);
        ellipse(c,p.x+Math.cos(a)*len,p.y-12+Math.sin(a)*len*.7,4+fade*9,4+fade*8,e.type==='blast'?(e.color==='electro'?'#bdf3ff':'#f2cf8c'):'#ece2c6');
      }
    }
    c.restore();
  }
  const ghost=options.ghost;
  if(options.selected&&ghost&&g.phase==='battle'){
    const d=UNITS[options.selected];
    if(d.spell){
      const poison=d.spell==='poison',rush=d.spell==='skeletonrush',arrows=d.spell==='arrowrain',zap=d.spell==='zap',lightning=d.spell==='lightning',cyclone=d.spell==='cyclone',ss=SPELL_TEAM_COLORS.own,fill=ghost.valid?ss.base:'#8c969c',stroke=ghost.valid?ss.bright:'#c7ced1';
      c.save();c.globalAlpha=.2;c.fillStyle=fill;c.beginPath();c.arc(ghost.x,ghost.y,d.radius,0,TAU);c.fill();c.globalAlpha=.88;c.strokeStyle=stroke;c.lineWidth=2.4;c.setLineDash(ghost.valid?[]:[5,5]);c.stroke();c.setLineDash([]);
      if(rush){c.globalAlpha=.22;c.fillStyle=ghost.valid?'#7a48a8':'#778185';c.beginPath();c.arc(ghost.x,ghost.y,d.radius,0,TAU);c.fill();c.globalAlpha=.9;c.strokeStyle=stroke;c.lineWidth=2.5;c.setLineDash([7,5]);c.beginPath();c.arc(ghost.x,ghost.y,d.radius,0,TAU);c.stroke();c.setLineDash([]);ellipse(c,ghost.x,ghost.y,7,7,'#e6ddcf','#4a4250',1);ellipse(c,ghost.x-2.5,ghost.y-1.5,1.2,1.5,'#4a4250');ellipse(c,ghost.x+2.5,ghost.y-1.5,1.2,1.5,'#4a4250');}
      else if(poison){rr(c,ghost.x-5,ghost.y-15,10,28,3,ghost.valid?'#d84c5c':'#778185','#fff0f2',1);rr(c,ghost.x-3,ghost.y-21,6,7,2,ghost.valid?'#7f4a50':'#778185');for(const a of [0,2.1,4.2])ellipse(c,ghost.x+Math.cos(a)*14,ghost.y+Math.sin(a)*9,3,3,ghost.valid?'#ff9eaa':'#aeb5b7');}
      else if(arrows){for(let i=-2;i<=2;i++){line(c,ghost.x+i*6-3,ghost.y-15,ghost.x+i*6+2,ghost.y+10,ss.base,3);line(c,ghost.x+i*6-3,ghost.y-15,ghost.x+i*6+2,ghost.y+10,'#ead8b5',1.2);}}
      else if(zap){for(let i=0;i<5;i++){const a=i*TAU/5;line(c,ghost.x,ghost.y,ghost.x+Math.cos(a)*24,ghost.y+Math.sin(a)*20,'#ffe875',2.5);line(c,ghost.x+Math.cos(a)*10,ghost.y+Math.sin(a)*8,ghost.x+Math.cos(a+.45)*18,ghost.y+Math.sin(a+.45)*14,'#dffaff',1.5);}}
      else if(lightning){for(let i=0;i<4;i++){const a=i*TAU/4+time*.5,r=18+i*3;const x=ghost.x+Math.cos(a)*r,y=ghost.y+Math.sin(a)*r*.55;line(c,x,y-18,x-5,y-5,'#dffaff',2.5);line(c,x-5,y-5,x+3,y+3,'#76ccff',2.5);line(c,x+3,y+3,x-2,y+16,'#e9fbff',2.5);}}
      else if(cyclone){for(let r=18;r<=45;r+=13){c.strokeStyle=ghost.valid?ss.soft:'#adb6b8';c.lineWidth=2;c.beginPath();c.arc(ghost.x,ghost.y,r,time+r*.02,time+r*.02+4.5);c.stroke();}}
      else{ellipse(c,ghost.x,ghost.y,16,16,ghost.valid?ss.base:'#8c969c');ellipse(c,ghost.x,ghost.y,12,12,'#ef633e');ellipse(c,ghost.x+3,ghost.y-3,7,7,'#ffd36f');}c.restore();
    }else{
      if(d.tunnelAnywhere){
        const core=g.towers.find(t=>t.owner===seat&&t.kind==='core'&&t.hp>0);if(core){const q=orient(core,seat);c.save();c.globalAlpha=.65;c.strokeStyle=ghost.valid?'#d6b778':'#ff9d87';c.lineWidth=2;c.setLineDash([5,7]);c.beginPath();c.moveTo(q.x,q.y);c.quadraticCurveTo((q.x+ghost.x)/2,(q.y+ghost.y)/2-28,ghost.x,ghost.y);c.stroke();c.setLineDash([]);c.fillStyle='#f3dfb1';c.font='bold 10px sans-serif';c.textAlign='center';c.fillText('地下移動',ghost.x,Math.max(22,ghost.y-38));c.restore();}}
      if(d.building&&d.range){
        c.save();c.globalAlpha=ghost.valid?.11:.08;c.fillStyle=ghost.valid?'#bfe9cc':'#f5a08d';c.beginPath();c.arc(ghost.x,ghost.y,d.range,0,TAU);c.fill();
        c.globalAlpha=.75;c.strokeStyle=ghost.valid?'#d9f6df':'#ff9d87';c.lineWidth=2;c.setLineDash([8,7]);c.beginPath();c.arc(ghost.x,ghost.y,d.range,0,TAU);c.stroke();c.setLineDash([]);
        c.fillStyle=ghost.valid?'#e8f8df':'#ffd4ca';c.font='bold 11px sans-serif';c.textAlign='center';c.fillText(`攻撃範囲 R${d.range}`,ghost.x,Math.max(24,ghost.y-d.range-10));c.restore();
      }
      c.globalAlpha=.35;ellipse(c,ghost.x,ghost.y,d.radius+10,10,ghost.valid?'#d9f3bb':'#fa9b80');c.globalAlpha=1;
      if(options.selected==='archer'){
        // Leaf Archer is a two-unit card, so the placement/summon preview must read as a duo too.
        for(const dx of [-17,17])drawUnit(c,'archer',ghost.x+dx,ghost.y,.74,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2});
      }else if(options.selected==='goblins'){
        for(const [dx,dy] of [[-17,-7],[17,-7],[-17,13],[17,13]])drawUnit(c,'goblin_melee',ghost.x+dx,ghost.y+dy,.70,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2});
      }else if(options.selected==='speargoblins'){
        for(const [dx,dy] of [[0,-15],[-20,12],[20,12]])drawUnit(c,'goblin_spear',ghost.x+dx,ghost.y+dy,.70,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2});
      }else if(options.selected==='mossling'){
        const group=[['goblin_melee',0,-18],['goblin_melee',-20,-3],['goblin_melee',20,-3],['goblin_spear',-21,17],['goblin_spear',0,20],['goblin_spear',21,17]];
        for(const [unit,dx,dy] of group)drawUnit(c,unit,ghost.x+dx,ghost.y+dy,.62,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2});
      }else if(options.selected==='apprenticeguards'){
        const cx=clamp(ghost.x,298,422);for(let i=0;i<6;i++)drawUnit(c,'apprenticeguard',cx+(i-2.5)*100,ghost.y,.72,{time:time+i*.11,owner:0,alpha:.68,idle:true,back:true,facing:-Math.PI/2,shieldHp:240,maxShieldHp:240});
      }else if(options.selected==='barbarians'){
        const group=[[-30,-10],[-15,12],[0,-14],[15,12],[30,-10]];for(let i=0;i<group.length;i++){const [dx,dy]=group[i];drawUnit(c,'barbarian',ghost.x+dx,ghost.y+dy,.72,{time:time+i*.13,owner:0,alpha:.68,idle:true,back:true,facing:-Math.PI/2});}
      }else drawUnit(c,options.selected,ghost.x,ghost.y,.9,{time,owner:0,alpha:.65,idle:true,back:true,facing:-Math.PI/2,shieldHp:d.shieldMax||0,maxShieldHp:d.shieldMax||0});
      c.strokeStyle=ghost.valid?'#eaf9c8':'#ff987f';c.lineWidth=2;c.beginPath();c.arc(ghost.x,ghost.y,28,0,TAU);c.stroke();
    }
  }
  // Foreground rim.
  c.strokeStyle='#d6d6ad55';c.lineWidth=2;c.beginPath();c.roundRect(22,14,676,1008,30);c.stroke();
  c.restore();
}
const DECK_PORTRAIT_LAYOUT=Object.freeze({
  golem:{scale:.78,y:8},icegolem:{scale:1.02,y:6},mini_golem:{scale:.94,y:6},berserker:{scale:1.0,y:5},miniberserker:{scale:1.02,y:6},megaknight:{scale:.90,y:8},ironeye:{scale:1.04,y:6},tracker:{scale:.96,y:9},valkyrie:{scale:1.02,y:7},gargoyle:{scale:1.22,y:1},megagargoyle:{scale:1.10,y:2},gargoyleswarm:{scale:1.0,y:2},boar:{scale:1.08,y:1},
  tigger:{scale:1.08,y:4},muddragon:{scale:1.0,y:5},laserdragon:{scale:1.0,y:5},skybomber:{scale:1.0,y:5},
  scrapdrill:{scale:1.0,y:5},bombcarrier:{scale:1.08,y:4},skeletonbarrel:{scale:1.08,y:2},giantskeleton:{scale:.86,y:10},apprenticeguards:{scale:.86,y:6},barbarians:{scale:.90,y:7},siegebarbarian:{scale:.92,y:6},icespirit:{scale:1.25,y:1},firespirit:{scale:1.25,y:1},oven:{scale:1.05,y:5},
  shieldknight:{scale:1.0,y:6},windmage:{scale:1.0,y:6},phoenix:{scale:.98,y:4},phoenix_egg:{scale:1.18,y:3},
  mirage:{scale:1.04,y:5},blowdart:{scale:1.08,y:5},lasertower:{scale:1.04,y:5},
  skeleton:{scale:1.18,y:2},boneswarm:{scale:1.05,y:2},tombstone:{scale:1.05,y:5},elixirgolem:{scale:.92,y:7},royalgiant:{scale:.88,y:10},skeletonbarrel:{scale:.92,y:2},harpy:{scale:.98,y:6},necromancer:{scale:.98,y:6},darknecro:{scale:.98,y:6},
  ashsquad:{scale:1.0,y:3},princess:{scale:1.02,y:6},sparky:{scale:.98,y:6},bat:{scale:1.20,y:-2},
  cannon:{scale:1.14,y:2},mage:{scale:.98,y:6},nightshade:{scale:1.08,y:8},lumina:{scale:.98,y:6},frost:{scale:.98,y:6}
});
function portraitLayout(type,back=false,deckMode=false){
  if(deckMode){const v=DECK_PORTRAIT_LAYOUT[type]||{scale:1.04,y:5};return {x:60,y:100+(v.y||0),scale:v.scale};}
  const scale=type==='golem'?.86:type==='icegolem'?1.18:type==='mini_golem'?1.08:type==='berserker'?1.18:type==='miniberserker'?1.28:type==='megaknight'?1.02:type==='ironeye'?1.30:type==='tracker'?1.15:type==='valkyrie'?1.25:type==='megagargoyle'?1.32:type==='gargoyle'?1.55:type==='gargoyleswarm'?1.18:type==='boar'?1.28:type==='tigger'?1.35:type==='muddragon'?1.34:type==='laserdragon'?1.32:type==='skybomber'?1.35:type==='scrapdrill'?1.25:type==='crusherogre'?1.08:type==='siegeturtle'?1.05:type==='bombcarrier'?1.4:type==='skeletonbarrel'?1.38:type==='giantskeleton'?1.02:type==='barbarian'||type==='barbarians'?1.12:type==='siegebarbarian'?1.02:(type==='icespirit'||type==='firespirit')?1.6:type==='oven'?1.18:type==='shieldknight'?1.25:type==='windmage'?1.25:type==='phoenix'?1.25:type==='phoenix_egg'?1.55:type==='gravityorb'?1.35:type==='mirage'?1.32:type==='blowdart'?1.42:type==='lasertower'?1.35:(type==='boneswarm'||type==='skeleton')?1.8:type==='tombstone'?1.25:type==='elixirgolem'?1.05:type==='royalgiant'?1.0:type==='harpy'?1.45:type==='necromancer'?1.26:type==='darknecro'?1.28:type==='ashsquad'?1.25:type==='princess'?1.28:type==='sparky'?1.18:type==='bat'?1.6:type==='cannon'?1.5:type==='mage'?1.12:type==='nightshade'?1.42:type==='lumina'?1.22:type==='frost'?1.2:1.32;
  const y=type==='golem'?112:type==='icegolem'?106:type==='mini_golem'?104:type==='berserker'?108:type==='miniberserker'?105:type==='megaknight'?110:type==='ironeye'?104:type==='tracker'?110:type==='valkyrie'?107:type==='megagargoyle'?94:type==='gargoyle'?91:type==='gargoyleswarm'?98:type==='boar'?96:type==='tigger'?101:type==='muddragon'?94:type==='laserdragon'?94:type==='skybomber'?92:type==='scrapdrill'?104:type==='crusherogre'?109:type==='siegeturtle'?104:type==='bombcarrier'?104:type==='skeletonbarrel'?96:type==='giantskeleton'?111:type==='barbarian'||type==='barbarians'?109:type==='siegebarbarian'?106:(type==='icespirit'||type==='firespirit')?92:type==='oven'?101:type==='shieldknight'?104:type==='windmage'?104:type==='phoenix'?92:type==='phoenix_egg'?98:type==='gravityorb'?98:type==='mirage'?104:type==='blowdart'?102:type==='lasertower'?96:(type==='boneswarm'||type==='skeleton')?96:type==='tombstone'?101:type==='elixirgolem'?108:type==='royalgiant'?111:type==='harpy'?91:type==='necromancer'?104:type==='darknecro'?104:type==='ashsquad'?101:type==='princess'?105:type==='sparky'?105:type==='bat'?83:type==='cannon'?(back?94:80):104;
  return {x:60,y,scale};
}

export function drawPortrait(canvas,type,time=0,owner=0,selected=false,back=false){
  const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height,d=UNITS[type];
  c.clearRect(0,0,w,h);c.save();c.scale(w/120,h/120);
  const col=d.color,g=c.createRadialGradient(60,48,10,60,64,70);g.addColorStop(0,col+'99');g.addColorStop(1,col+'00');c.fillStyle=g;c.fillRect(0,0,120,120);
  if(d.spell){
    ellipse(c,60,100,37,8,'#1f39451b');
    if(d.spell==='zap'){
      c.strokeStyle='#8fdfff';c.lineWidth=4;c.beginPath();c.arc(60,70,28,0,TAU);c.stroke();for(let i=0;i<7;i++){const a=i*TAU/7;line(c,60+Math.cos(a)*8,70+Math.sin(a)*7,60+Math.cos(a+.35)*29,70+Math.sin(a+.35)*24,i%2?'#fff0a0':'#bcefff',3);}
      path(c,[[58,43],[48,68],[59,65],[53,91],[76,60],[64,63],[71,43]],'#ffe275','#6f613c',1.2);
    }else if(d.spell==='lightning'){
      // Tall rectangular blue spell bottle wrapped in animated electric arcs.
      rr(c,48,43,24,51,6,'#478fd2','#244b72',2);rr(c,52,48,16,39,4,'#71c5ff','#d8f6ff',1);rr(c,52,35,16,11,3,'#315f8b','#213f5d',1.5);rr(c,55,31,10,6,2,'#8a724f','#463d31',1);
      c.globalAlpha=.38;rr(c,55,52,10,28,3,'#c9f6ff',null);c.globalAlpha=1;
      for(let i=0;i<6;i++){const a=i*TAU/6+time*2.2,r1=22,r2=33;const x1=60+Math.cos(a)*r1,y1=68+Math.sin(a)*r1*.72,x2=60+Math.cos(a+.35)*r2,y2=68+Math.sin(a+.35)*r2*.72;line(c,x1,y1,x2,y2,i%2?'#e9fbff':'#80d7ff',2.4);}
      path(c,[[58,51],[53,68],[60,66],[56,82],[69,62],[62,64],[67,51]],'#dffaff','#3e6f91',1);
    }else if(d.spell==='skeletonrush'){
      c.globalAlpha=.22;c.fillStyle='#7a48a8';c.beginPath();c.arc(60,70,32,0,TAU);c.fill();c.globalAlpha=1;c.strokeStyle='#9ecbff';c.lineWidth=3;c.beginPath();c.arc(60,70,31,0,TAU);c.stroke();for(let i=0;i<5;i++){const a=i*TAU/5+time*.25,x=60+Math.cos(a)*19,y=70+Math.sin(a)*14;ellipse(c,x,y,6,6,'#e7e0cf','#52485a',1);ellipse(c,x-2,y-1,1.2,1.5,'#52485a');ellipse(c,x+2,y-1,1.2,1.5,'#52485a');}
    }else if(d.spell==='poison'){
      // Red, narrow magic flask for the reworked Poison spell.
      rr(c,53,35,14,12,3,'#6b3b3f','#3c2529',1.5);rr(c,56,29,8,7,2,'#a88763','#4b3e31',1);
      path(c,[[50,45],[70,45],[73,88],[68,96],[52,96],[47,88]],'#b83243','#5c2831',2);path(c,[[53,50],[67,50],[69,84],[65,91],[55,91],[51,84]],'#e14f61',null);c.globalAlpha=.42;rr(c,55,54,5,30,2,'#ffb0b8',null);c.globalAlpha=1;
      for(const [x,y,r] of [[57,79,3],[64,71,2.5],[58,61,2]])ellipse(c,x,y,r,r,'#ffd1d7');
    }else if(d.spell==='cyclone'){
      c.strokeStyle='#b9f3ff';c.lineWidth=3;for(let r=10;r<=34;r+=8){c.beginPath();c.arc(60,72,r,time*(1+r/20),time*(1+r/20)+4.8);c.stroke();}for(let i=0;i<7;i++){const a=-time*2+i*TAU/7,r=28;ellipse(c,60+Math.cos(a)*r,72+Math.sin(a)*r*.6,3,2,'#7bbcc8');}
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
  const portraitMode=canvas.dataset.portraitMode||'';
  const deckMode=portraitMode==='deck';
  const previousHideTeamBands=c.__hideTeamBands;
  c.__hideTeamBands=deckMode||portraitMode==='library';
  if(type==='archer'){
    const group=[[46,101,.82],[74,101,.82]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'archer',x,y,sc,{time:time+i*.35,owner,idle:true,noShadow:true,anim:0,back,facing:back?-Math.PI/2:Math.PI/2});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='skeleton'||type==='boneswarm'){
    const group=type==='skeleton'?[[60,74,.82],[44,98,.72],[76,98,.72]]:[[42,68,.52],[60,64,.56],[78,68,.52],[34,88,.48],[51,91,.50],[69,91,.50],[86,88,.48],[45,108,.44],[75,108,.44]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'skeleton',x,y,sc,{time:time+i*.19,owner,idle:true,noShadow:true,anim:0,back,facing:back?-Math.PI/2:Math.PI/2});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='gargoyle'||type==='gargoyleswarm'){
    const count=type==='gargoyle'?3:6;
    const group=count===3?[[60,72,.92],[43,93,.78],[77,93,.78]]:[[43,70,.66],[60,66,.72],[77,70,.66],[38,94,.60],[60,96,.64],[82,94,.60]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'gargoyle',x,y,sc,{time:time+i*.27,owner,idle:true,noShadow:true,anim:0,back,facing:back?-Math.PI/2:Math.PI/2});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='mossling'){
    const group=[['goblin_melee',60,70,.68],['goblin_melee',41,84,.64],['goblin_melee',79,84,.64],['goblin_spear',39,105,.57],['goblin_spear',60,108,.59],['goblin_spear',81,105,.57]];
    for(const [unit,x,y,sc] of group)drawUnit(c,unit,x,y,sc,{time,owner,idle:true,noShadow:true,anim:0,back:false,facing:Math.PI/2});
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='apprenticeguards'){
    const group=[[38,72,.53],[60,68,.56],[82,72,.53],[34,101,.48],[60,104,.50],[86,101,.48]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'apprenticeguard',x,y,sc,{time:time+i*.12,owner,idle:true,noShadow:true,anim:0,back:false,facing:Math.PI/2,shieldHp:240,maxShieldHp:240});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='barbarians'){
    const group=[[60,69,.64],[39,82,.57],[81,82,.57],[47,105,.53],[73,105,.53]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'barbarian',x,y,sc,{time:time+i*.14,owner,idle:true,noShadow:true,anim:0,back:false,facing:Math.PI/2});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='goblins'){
    const group=[[47,76,.72],[73,76,.72],[45,101,.66],[75,101,.66]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'goblin_melee',x,y,sc,{time:time+i*.18,owner,idle:true,noShadow:true,anim:0,back:false,facing:Math.PI/2});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  if(type==='speargoblins'){
    const group=[[60,73,.76],[43,101,.69],[77,101,.69]];
    for(let i=0;i<group.length;i++){const [x,y,sc]=group[i];drawUnit(c,'goblin_spear',x,y,sc,{time:time+i*.18,owner,idle:true,noShadow:true,anim:0,back:false,facing:Math.PI/2});}
    c.__hideTeamBands=previousHideTeamBands;c.restore();return;
  }
  const layout=portraitLayout(type,back,deckMode);
  drawUnit(c,type,layout.x,layout.y,layout.scale,{time,owner,idle:true,noShadow:true,anim:0,back,facing:back?-Math.PI/2:Math.PI/2});
  c.__hideTeamBands=previousHideTeamBands;c.restore();
}
