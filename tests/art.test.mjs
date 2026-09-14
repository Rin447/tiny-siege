import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {SPELL_TEAM_COLORS, spellTeamStyle, visualFacing} from '../public/game/art.js';
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

test('lingering poison snapshot retains caster owner for spell-side rendering',()=>{
  const deck=['poison','blade','knight','archer','mage','spear','bat','bomber'];
  const g=battleWithDeck(deck);
  // Put an enemy inside the poison zone and advance to the immediate first poison tick.
  const u={...g.towers[0],id:'u-poison-test',kind:undefined,building:false,type:'blade',owner:1,x:360,y:700,hp:500,maxHp:500,radius:16,air:false,targetable:true,cd:0,spawn:0,anim:0,hit:0,walk:0,face:1,facing:0,moving:false,mass:2,age:0};
  g.units.push(u);
  assert.equal(deploy(g,0,'poison',360,700).ok,true);
  tick(g,.1);
  const snap=viewMatch(g,0),poisoned=snap.units.find(x=>x.id==='u-poison-test');
  assert.equal(poisoned.poisoned,true);
  assert.equal(poisoned.poisonOwner,0);
});


test('sparkblast render uses drawArena time and frame rendering resets transforms',()=>{
  const source=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  assert.match(source,/sparkblast'[\s\S]{0,260}time\*6/);
  assert.doesNotMatch(source,/sparkblast'[\s\S]{0,260}\+t\*6/);
  assert.match(source,/drawArena\(canvas,snapshot,options=\{\}\)[\s\S]{0,420}setTransform\(1,0,0,1,0,0\)/);
  assert.match(source,/c\.save\(\);[\s\S]{0,120}try\{[\s\S]{0,2600}finally\{c\.restore\(\);\}/);
});


test('viewer-relative front/back facing selects rear art when a unit moves away from the viewer',()=>{
  const away={owner:0,face:-1,facing:-Math.PI/2};
  const toward={owner:0,face:1,facing:Math.PI/2};
  assert.equal(visualFacing(away,0).back,true);
  assert.equal(visualFacing(toward,0).back,false);
  assert.equal(visualFacing(away,1).back,false);
  assert.equal(visualFacing(toward,1).back,true);
});

test('v23.2 Sky Bomber and Crusher Ogre use front/back three-state pixel sprite sheets',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const build=fs.readFileSync(new URL('../scripts/build-offline.mjs',import.meta.url),'utf8');
  assert.match(art,/skybomber:Object\.freeze\(\{src:'\/assets\/sprites\/skybomber\.png'/);
  assert.match(art,/crusherogre:Object\.freeze\(\{src:'\/assets\/sprites\/crusherogre\.png'/);
  assert.match(art,/front:Object\.freeze\(\{idle:0,move:1,attack:2\}\)/);
  assert.match(art,/back:Object\.freeze\(\{idle:3,move:4,attack:5\}\)/);
  assert.match(art,/const direction=opts\.back\?'back':'front'/);
  assert.match(art,/imageSmoothingEnabled=false/);
  assert.match(build,/window\.TINY_SPRITE_DATA/);
  for(const name of ['skybomber.png','crusherogre.png']){
    const data=fs.readFileSync(new URL(`../public/assets/sprites/${name}`,import.meta.url));
    assert.equal(data.toString('ascii',1,4),'PNG');
    assert.equal(data.readUInt32BE(16),640);
    assert.equal(data.readUInt32BE(20),960);
  }
});


test('v23.3 four core units use front/back three-state pixel sprite sheets',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  const build=fs.readFileSync(new URL('../scripts/build-offline.mjs',import.meta.url),'utf8');
  for(const type of ['archer','berserker','mage','frost']){
    assert.match(art,new RegExp(`${type}:Object\\.freeze\\(\\{src:'\\/assets\\/sprites\\/${type}\\.png'`));
    assert.match(build,new RegExp(`${type}:'public\\/assets\\/sprites\\/${type}\\.png'`));
    const data=fs.readFileSync(new URL(`../public/assets/sprites/${type}.png`,import.meta.url));
    assert.equal(data.toString('ascii',1,4),'PNG');
    assert.equal(data.readUInt32BE(16),640);
    assert.equal(data.readUInt32BE(20),960);
  }
  assert.match(art,/type==='archer'\|\|type==='mage'/);
  assert.match(art,/type==='berserker'.*drawPixelSprite/);
  assert.match(art,/type==='frost'.*drawPixelSprite/);
});

test('v23.5 generated-art Archer and Berserker keep the front/back sprite contract',()=>{
  const art=fs.readFileSync(new URL('../public/game/art.js',import.meta.url),'utf8');
  for(const type of ['archer','berserker']){
    assert.ok(art.includes(`${type}:Object.freeze({src:'/assets/sprites/${type}.png'`));
    const data=fs.readFileSync(new URL(`../public/assets/sprites/${type}.png`,import.meta.url));
    assert.equal(data.toString('ascii',1,4),'PNG');
    assert.equal(data.readUInt32BE(16),640);
    assert.equal(data.readUInt32BE(20),960);
    assert.ok(data.length>30000,`${type} should contain detailed pixel art`);
  }
  assert.match(art,/front:Object\.freeze\(\{idle:0,move:1,attack:2\}\)/);
  assert.match(art,/back:Object\.freeze\(\{idle:3,move:4,attack:5\}\)/);
});
