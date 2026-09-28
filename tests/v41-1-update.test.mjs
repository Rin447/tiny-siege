import {test} from 'node:test';
import assert from 'node:assert/strict';
import {VERSION,UNITS} from '../public/game/units.js';
import {PHYSICS_VERSION} from '../public/game/physics.js';

test('v41.1 lightning timing and rolling speeds are exact',()=>{
  assert.equal(VERSION,'41.2.0');assert.equal(PHYSICS_VERSION,76);
  assert.equal(UNITS.lightning.activationDelay,1);assert.equal(UNITS.lightning.strikeInterval,.2);assert.equal(UNITS.lightning.maxTargets,4);
  assert.equal(UNITS.rollingwood.rollSpeed,364);assert.equal(UNITS.rollingbarbarian.rollSpeed,308);
  assert.equal(364,520*.7);assert.equal(308,440*.7);
});
