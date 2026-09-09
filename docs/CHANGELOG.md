# Changelog

## 15.0.0

- Mud Dragon attack range reduced from 155 to **78**; HP, splash and mud-zone effects unchanged.
- Hole-digger Tigger attack reduced from 30 to **15**; underground travel slowed to roughly **0.9–2.8 seconds** depending on distance.
- Added **Blowdart Goblin**: 3 cost / 240 HP / 110 damage / 0.5s attack interval / range 220 / ground + air targeting.
- Added **Laser Tower**: 5 cost / 2000 HP / range 220 / ground + air target lock. Continuous DPS starts at 20 and doubles every 1.5 seconds on the same target with no cap; changing target resets DPS to 20.
- Card pool expanded to **24 cards (21 units + 3 spells)**.
- Deck storage advances to `tiny-deck-v15`; v14 and older keys remain migration fallbacks.
- Compatibility contract advanced to **physicsVersion 13**.

## 14.0.0

- Added Hole-digger Tigger: 3 cost / 1100 HP / 30 damage / global ground destination tunnelling.
- Burrowing units are completely untargetable and immune until surfacing; travel time scales with distance from own core.
- Added Mud Dragon: 5 cost / 2000 HP / 200 splash damage / air unit attacking ground and air.
- Mud Dragon attacks create a 2-second ground-only mud zone: 30 damage every 0.5 seconds and 30% movement slow, non-stacking.
- Card pool expanded to 22 (19 units + 3 spells).
- Deck storage advances to `tiny-deck-v14`; v13 and older keys remain migration fallbacks.
- Compatibility contract advanced to **physicsVersion 12**.

## 13.0.0

- Defensive structures (side towers, awake central cores, and Bolt Cannon) now use **target lock**.
- A locked target is retained even when a closer enemy enters range. Lock releases only when the target dies, leaves attack range, or becomes untargetable.
- Nightshade rush invulnerability does not clear a structure lock.
- Added **アプデ情報 / Patch Notes** to the top navigation. The client filters bundled patch-note entries to the last seven calendar days.
- Deck storage advances to `tiny-deck-v13` with v12 and older fallback.
- Compatibility contract advanced to **physicsVersion 11**.

## 12.0.0

- Expanded deck size from 6 to **8 cards** while keeping the battle hand at **4 cards**; the waiting queue is now 4 cards.
- Added deck **average energy cost** to the editor, home summary and lobby summary.
- Added saved-deck migration: existing 6-card v11/v10/... decks retain their valid picks and are automatically filled to 8 cards rather than being discarded.
- Reworked Bone Swarm from 8 × 95 HP to **12 × 45 HP** while keeping 42 damage and 4 cost. It is now more polarized against single-target heavy attackers and area damage.
- Added generic building placement range preview. Bolt Cannon shows its **R218** attack circle before placement; the implementation applies to future `building` cards with a range value.
- On touch devices, building placement uses a two-tap flow: first tap previews the location/range, second tap at the same spot confirms placement. Drag placement remains available.
- Existing v11 spell/frontline rules remain unchanged.
- Compatibility contract advanced to **physicsVersion 10**.

## 10.0.0

- Bolt Cannon cost reduced from 4 to 3; HP, attack and passive HP decay are unchanged.
- Kragg Berserker rebalanced from 6 to 7 cost, 1950 to 2450 HP, and 360 to 465 damage; movement and targeting unchanged.
- Iron Guard cost reduced from 4 to 3 with combat stats unchanged.
- Ash Swordsman cost reduced from 3 to 2 with combat stats unchanged.
- Card pool remains 17 cards and deck size remains 6.
- Compatibility version advanced to 8 so active v9 matches restart cleanly under one balance set.

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