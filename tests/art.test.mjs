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
