import test from 'node:test';
import assert from 'node:assert/strict';
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
