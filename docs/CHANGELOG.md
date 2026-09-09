# Changelog

## 9.0.0

- Stone Golem HP reduced from 3150 to 2850; 8 cost, 288 building damage, split and death blast unchanged.
- Iron Guard cost reduced from 5 to 4; all combat stats unchanged.
- Added Kragg Berserker: 6 cost, 1950 HP, 360 damage, slow movement, heavy ground melee attacker.
- Selectable pool increased to 17 cards: 16 units + 1 spell; deck size remains 6.
- Physics compatibility version advanced to 7.

## 8.0.0

- Pulled post-tower frontline deployment back by 120px from the destroyed side-tower ruin, preserving defender recovery space.
- Rebalanced Stone Golem to 3150 HP / 288 building damage while keeping 8 energy and building-only targeting.
- Stone Golem now splits into two Mini Golems on death. Each Mini Golem has 1050 HP / 96 building damage (one third of the parent).
- Added enemy-only death blasts: parent 180 damage in radius 75; mini 60 damage in radius 45.
- Added Fireball spell card: 4 energy, radius 90, 560 damage to enemy units, 140 to enemy structures, ground + air.
- Fireball launches from the player's central core, has no tracking, and travels roughly 0.6–2.0 seconds based on distance.
- Card pool is now 16 selectable cards: 15 units + 1 spell; deck size remains 6.
- Bumped physics/state compatibility contract to 6.

## 7.0.0

- Halved Nightshade acquisition/rush activation range to about 105px while preserving its windup, invulnerable rush, 2x impact and cooldown.
- Added lane-specific advanced deployment: destroying an enemy side tower unlocks deployment up to that ruin on that lane only.
- Increased side tower HP from 1650 to 1980 and central core HP from 2700 to 3240.
- Central cores now start dormant. They can still be damaged, and permanently wake when damaged or when either friendly side tower falls.
- Added dormant/awake visual cues and frontline deployment overlays.
- Bumped physics/state compatibility contract to 5.


## 6.0.0

- Rebalanced Stone Golem from 6 to 8 energy, 3350 to 3700 HP, and 295 to 325 building damage.
- Reworked Nightshade from a backline-priority assassin into Shadow Rush:
  - 3 energy, original HP/damage/speed retained.
  - 0.6s vulnerable windup.
  - Invulnerable only while rushing.
  - 2x impact damage against troops or structures, including towers/cannons.
  - 4s rush cooldown, then normal attacks between rushes.
- Reworked Bolt Cannon lifetime into HP decay: 1080 max HP remains, with 30 HP/sec passive decay (~36s undamaged lifetime).
- Added Shadow Rush visuals (windup ring, trail, impact, evade cue).
- Migrated deck storage to `tiny-deck-v6`, with v5/v4/v3 fallback.
- Roster remains 15 and deck size remains 6. Physics contract remains v4.

## 5.0.0

- Added Lumina Priest healing support, Frost Shaman slow/debuff, Storm Harpy chain lightning.
- Upgraded Iron Boar with lightweight-enemy shove behavior.
- Increased roster to 15 and physics contract to v3.
