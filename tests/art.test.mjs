import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SPELL_TEAM_COLORS, spellTeamStyle} from '../public/game/art.js';
import {createMatch, deploy, tick, viewMatch} from '../public/game/engine.js';

function battleWithDeck(deck){
  const g=createMatch({seed:1,decks:[deck,deck]});
  g.phase='battle';g.countdown=0;
  for(const p of g.players){p.energy=10;p.hand=[...deck.slice(0,4)];p.queue=[...deck.slice(4)];p.deck=[...deck];}
  return g;
}

test('spell team colors are viewer-relative: own blue/solid and enemy red/dashed',()=>{
  assert.equal(spellTeamStyle(0,0),SPELL_TEAM_COLORS.own);
  assert.equal(spellTeamStyle(1,1),SPELL_TEAM_COLORS.own);
  assert.equal(spellTeamStyle(1,0),SPELL_TEAM_COLORS.enemy);
  assert.equal(spellTeamStyle(0,1),SPELL_TEAM_COLORS.enemy);
  assert.equal(SPELL_TEAM_COLORS.own.base,'#4f9dff');
  assert.equal(SPELL_TEAM_COLORS.enemy.base,'#ff5f68');
  assert.equal(SPELL_TEAM_COLORS.own.dash.length,0);
  assert.ok(SPELL_TEAM_COLORS.enemy.dash.length>0);
});

test('eight-second poison zone snapshot retains caster owner for spell-side rendering',()=>{
  const deck=['poison','blade','knight','archer','mage','spear','bat','bomber'];
  const g=battleWithDeck(deck);
  assert.equal(deploy(g,0,'poison',360,700).ok,true);
  tick(g,.1);
  const snap=viewMatch(g,0),zone=snap.zones.find(z=>z.kind==='poison');
  assert.ok(zone);
  assert.equal(zone.owner,0);
  assert.equal(zone.total,8);
  assert.ok(zone.remaining>7.8&&zone.remaining<=8);
});

test('sparkblast render uses drawArena time and frame rendering resets transforms',()=>{
  const source=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(source,/sparkblast'[\s\S]{0,260}time\*6/);
  assert.doesNotMatch(source,/sparkblast'[\s\S]{0,260}\+t\*6/);
  assert.match(source,/drawArena\(canvas,snapshot,options=\{\}\)[\s\S]{0,420}setTransform\(1,0,0,1,0,0\)/);
  assert.match(source,/c\.save\(\);[\s\S]{0,120}try\{[\s\S]{0,3600}finally\{c\.restore\(\);\}/);
});

test('deck builder portraits use a common layout frame with per-unit adjustments',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(art,/DECK_PORTRAIT_LAYOUT/);
  assert.match(art,/harpy:\{scale:\.98,y:6\}/);
  assert.match(art,/const deckMode=portraitMode==='deck'/);
  assert.match(app,/can\.dataset\.portraitMode='deck'/);
  assert.match(app,/portrait\.dataset\.portraitMode='deck'/);
});

test('team ownership bands are hidden in deck and library portraits but remain available in battle art',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(art,/c\.__hideTeamBands===true&&TEAM_COLORS\.includes\(color\)/);
  assert.match(art,/c\.__hideTeamBands=deckMode\|\|portraitMode==='library'/);
  assert.match(app,/can\.dataset\.portraitMode='library'/);
});
test('v26.2 Valkyrie stays upright while the axe spins and Leaf Archer portrait shows a duo',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const valk=art.slice(art.indexOf('function drawValkyrie'),art.indexOf('function drawGargoyle'));
  assert.match(valk,/const viewBack=/);
  assert.match(valk,/const axeAngle=attack\?/);
  assert.doesNotMatch(valk,/c\.rotate\(spin\*TAU/);
  assert.match(art,/if\(type==='archer'\)\{[\s\S]{0,180}group=\[\[46,101,\.82\],\[74,101,\.82\]\]/);
});

test('v26.5 Leaf Archer placement preview is a visible two-unit duo',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(art,/options\.selected==='archer'[\s\S]{0,220}for\(const dx of \[-17,17\]\)[\s\S]{0,180}drawUnit\(c,'archer'/);
});
test('v26.5 battle hand long press exposes unit and tower damage',()=>{
  const app=fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../public/styles.css',import.meta.url),'utf8');
  assert.match(app,/HOLD_DAMAGE_MS=430/);assert.match(app,/cardDamageInfo\(d\)/);assert.match(app,/対ユニット/);assert.match(app,/対タワー/);
  assert.match(css,/\.card-damage-pop/);assert.match(css,/\.card-damage-pop\.show/);
});

test('v26.6 Bomber bomb render follows a rotating parabolic throw arc',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(art,/p\.kind==='bomb'[\s\S]{0,180}Math\.sin\(Math\.PI\*bombProgress\)\*42/);
  assert.match(art,/thrownBomb\?angle\+bombProgress\*TAU\*1\.35:angle/);
});

test('v29.1 Yuno procedural art is a short white-haired green-hood dagger assassin',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawNightshade');
  const end=art.indexOf('function drawGoblinTrooper',start);
  const yuno=art.slice(start,end);
  assert.match(yuno,/cloak='#3d8551'/);
  assert.match(yuno,/hair='#f2f0e8'/);
  assert.match(yuno,/mask='#171d20'/);
  assert.match(yuno,/short dagger|タガー|path\(c,\[\[-1,0\],\[1,-19\]/);
  assert.match(yuno,/dashWindup/);
  assert.match(yuno,/dashing/);
});


test('v29.3 Royal Ghost procedural art shows a pale crowned bearded dagger ghost and stealth transparency',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawRoyalGhost');
  const end=art.indexOf('function drawSkyBomber',start);
  const ghost=art.slice(start,end);
  assert.ok(start>0);
  assert.match(ghost,/beard='#f8fbf7'/);
  assert.match(ghost,/gold='#d7b34d'/);
  assert.match(ghost,/dagger='#b9c9cc'/);
  assert.match(ghost,/opts\.stealthed[\s\S]{0,80}globalAlpha\*=\.42/);
  assert.match(art,/type==='mirage'\)\{drawRoyalGhost/);
});

test('v30 Ice Golem has dedicated icy procedural art',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawIceGolem');
  const end=art.indexOf('function drawRoyalGiant',start);
  const ice=art.slice(start,end);
  assert.ok(start>0);assert.match(ice,/Compact icy feet and a squat, heavy body/);assert.match(ice,/Ice crystal shoulders and stubby arms/);assert.match(ice,/cold blue eyes/);assert.match(art,/type==='icegolem'\)\{drawIceGolem/);
});

test('v31.0.2 Royal Giant restores the exact V29.2 visual pose',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawRoyalGiant');
  const end=art.indexOf('function drawLumina',start);
  const giant=art.slice(start,end);
  assert.ok(start>0);
  assert.match(giant,/Cannon arm: shoulder -> forearm -> handheld barrel/);
  assert.match(giant,/Other hand visibly carries a cannonball/);
  assert.match(giant,/Huge torso and royal sash/);
});


test('v32 Giant Skeleton has dedicated winter-hat bomb-and-barrel procedural art',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawGiantSkeleton');
  const end=art.indexOf('function drawTombstone',start);
  const giant=art.slice(start,end);
  assert.ok(start>0);assert.match(giant,/Backpack barrel/);assert.match(giant,/Right hand carries the bomb/);assert.match(giant,/Fur winter hat/);assert.match(art,/type==='giantskeleton'\)\{drawGiantSkeleton/);
});

test('v32 Skeleton Rush has a purple zone, owner border, and spell portrait branch',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(art,/rush=z\.kind==='skeletonrush'/);assert.match(art,/#7a48a8/);assert.match(art,/d\.spell==='skeletonrush'/);assert.match(art,/skeletonrush-activate/);
});


test('v33 Giant Skeleton walks with vertically oscillating arms',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawGiantSkeleton');const end=art.indexOf('function drawTombstone',start);const giant=art.slice(start,end);
  assert.match(giant,/armLift=moving\?Math\.sin\(walk\)\*7:0/);assert.match(giant,/translate\(-24,-52\+armLift\)/);assert.match(giant,/translate\(23,-53-armLift\)/);
});

test('v33 Mega Gargoyle has dedicated armored procedural art and dispatch',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const start=art.indexOf('function drawMegaGargoyle');const end=art.indexOf('function drawGargoyleSwarmCard',start);const mega=art.slice(start,end);
  assert.ok(start>0);assert.match(mega,/Heavy breastplate and team-colored waist guard/);assert.match(mega,/Armored shoulders/);assert.match(art,/type==='megagargoyle'\)\{drawMegaGargoyle/);
});

test('v33 Goblin cards have dedicated multi-unit portraits',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(art,/if\(type==='goblins'\)/);assert.match(art,/if\(type==='speargoblins'\)/);assert.match(art,/options\.selected==='mossling'/);
});

test('v34 Apprentice Guards have dedicated shield-breaking recruit art and six-unit card portrait',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const start=art.indexOf('function drawApprenticeGuard');const end=art.indexOf('function drawIceSpirit',start);const recruit=art.slice(start,end);
 assert.match(recruit,/hasShield=\(opts\.shieldHp\?\?240\)>0/);assert.match(recruit,/Closed helmet/);assert.match(recruit,/Spea?r|Spear/);
 assert.match(art,/type==='apprenticeguard'\|\|type==='apprenticeguards'/);assert.match(art,/if\(type==='apprenticeguards'\)[\s\S]{0,500}for\(let i=0;i<group\.length;i\+\+\)/);
});

test('v34 Ice Spirit has snowball limb art and leap progress rendering',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const start=art.indexOf('function drawIceSpirit');const end=art.indexOf('function drawShieldKnight',start);const ice=art.slice(start,end);
 assert.match(ice,/iceSpiritProgress/);assert.match(ice,/iceSpiritState==='leap'/);assert.match(ice,/Math\.sin\(Math\.PI\*p\)\*22/);assert.match(art,/type==='icespirit'\)\{drawIceSpirit/);
});



test('v37.4 Princess uses compact two-head art and Barbarians render smaller in battle',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const p0=art.indexOf('function drawPrincessArcher');const p1=art.indexOf('function drawSparky',p0);const princess=art.slice(p0,p1);
 assert.ok(p0>0);assert.match(princess,/Compact two-head-tall silhouette/);assert.match(princess,/Large head makes the in-battle model/);
 assert.match(art,/u\.type==='barbarian'\?\.84/);assert.match(art,/u\.type==='princess'\?\.82/);
});

test('v35 Fire Spirit has magma limb art and leap progress rendering',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const start=art.indexOf('function drawFireSpirit');const end=art.indexOf('function drawShieldKnight',start);const fire=art.slice(start,end);
 assert.ok(start>0);assert.match(fire,/fireSpiritProgress/);assert.match(fire,/fireSpiritState==='leap'/);assert.match(fire,/Math\.sin\(Math\.PI\*p\)\*22/);assert.match(fire,/magma='#e9572f'/);assert.match(art,/type==='firespirit'\)\{drawFireSpirit/);
});

test('v35 Oven has a square stove, oversized pot, and dedicated dispatch',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const start=art.indexOf('function drawOven');const end=art.indexOf('function drawElixirGolem',start);const oven=art.slice(start,end);
 assert.ok(start>0);assert.match(oven,/Oversized pot above the square stove/);assert.match(oven,/rr\(c,-27,-26,54,34/);assert.match(art,/type==='oven'\)\{drawOven/);
});


test('v37.4 Barbarians stay gold-haired while Siege Barbarian carries an overhead reinforced log',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const b0=art.indexOf('function drawBarbarian');const b1=art.indexOf('function drawSiegeBarbarian',b0);const barb=art.slice(b0,b1);const s0=b1,s1=art.indexOf('function drawOven',s0);const ram=art.slice(s0,s1);
 assert.ok(b0>0&&s0>0);assert.match(barb,/Big bare-chested veteran/);assert.match(barb,/hair='#f2c84e'/);assert.match(barb,/Gold hair and huge moustache\/beard/);
 assert.match(ram,/Two barbarians carry one huge reinforced log overhead/);assert.match(ram,/feet and legs visibly/);assert.match(ram,/const charged=!!opts\.charged/);assert.match(art,/type==='barbarian'\|\|type==='barbarians'\)\{drawBarbarian/);assert.match(art,/type==='siegebarbarian'\)\{drawSiegeBarbarian/);
});

test('v37.5 placed buildings render at footprint-scale while gameplay keeps separate hitboxes',()=>{
 const units=fs.readFileSync(new URL('../public/game/units.js',import.meta.url),'utf8');
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 assert.match(units,/cannon:Object\.freeze\(\{visualScale:1\.90,hitboxCols:2\.20,hitboxRows:1\.90\}\)/);
 assert.match(units,/oven:Object\.freeze\(\{visualScale:1\.62,hitboxCols:2\.35,hitboxRows:2\.30\}\)/);
 assert.match(art,/UNITS\.cannon\.visualScale/);assert.match(art,/UNITS\.tombstone\.visualScale/);assert.match(art,/d\.building\?\.9\*\(d\.visualScale\|\|1\):\.9/);
});


test('v38 Air Balloon and Lumberjack use dedicated procedural art and battle dispatch',()=>{
 const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
 const b0=art.indexOf('function drawAirBalloon');const b1=art.indexOf('function drawLumberjack',b0);const balloon=art.slice(b0,b1);const l0=b1,l1=art.indexOf('function drawGiantSkeleton',l0);const lumber=art.slice(l0,l1);
 assert.ok(b0>0&&l0>0);assert.match(balloon,/owner===0/);assert.match(balloon,/#4f9dff/);assert.match(balloon,/#ff5f68/);assert.match(balloon,/Skeleton pilot/);assert.match(balloon,/Large dropped bomb/);
 assert.match(lumber,/Rage bottle/);assert.match(lumber,/hair='#d8a83f'/);assert.match(lumber,/rage='#e24fab'/);assert.match(art,/type==='airballoon'\)\{drawAirBalloon/);assert.match(art,/type==='lumberjack'\)\{drawLumberjack/);assert.match(art,/p\.kind==='airballoon_bomb'/);
});
