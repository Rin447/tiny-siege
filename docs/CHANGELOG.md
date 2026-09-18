# v38.0.0 - AIR BALLOON / LUMBERJACK UPDATE

- Added Air Balloon: cost 5, HP1676, damage640 every 2.0s, flying, buildings only, normal speed, close 1-cell range.
- Air Balloon leaves a radius-1 death bomb that detonates after 2.0s for 240 damage to enemy ground units and structures.
- Added Lumberjack: cost 4, HP1282, damage255 every 0.8s, ground-only melee targeter, very fast movement.
- Lumberjack leaves the existing Rage effect at the death position; it activates after 1.5s and retains Rage's 179/45 impact damage and 4.5s 30% speed boost.
- Added dedicated art, detail demos, API feature flags, and combat regression tests.
- physicsVersion 72; 73 cards total (65 units/buildings + 8 spells).

# v37.9.0 - CYCLONE / FALCHE / RAGE UPDATE

- Cyclone radius 5.5, 1-second duration, fixed 84/58 damage and 3x pull speed.
- Added Falche with a 7-cell outbound/return piercing axe.
- Added Rage with delayed 179/45 impact and 4.5-second 30% speed boosts.
- physicsVersion 71; 71 cards total.

# v37.8.0 PRINCE & DARK PRINCE CHARGE UPDATE

- Melee ranges now use three tiers: close 1 cell, medium 1.5 cells, long 2 cells.
- Added Prince: cost 5, HP 1920, damage 392, 1.4s attack interval, long-melee 2 cells, 2.5-cell continuous-walk charge for 784 damage.
- Added Dark Prince: cost 4, HP 1200 + shield 240, damage 266, medium-melee 1.5 cells, radius-1-cell splash, 2-cell continuous-walk charge for 532 damage.
- Prince charge progress resets on ordinary attacks, movement interruption, stun, and charge impact. Dark Prince shield blocks overflow from the hit that breaks it.
- 69 cards (62 units/buildings + 7 spells), physicsVersion 70.

# v37.7.0 DEPLOYMENT VULNERABILITY & RELEASE-TO-PLACE UPDATE
- Normal units and buildings are targetable/damageable during summon/construction, but cannot act until ready.
- Timed building decay, Elixir Pump production, and summon/interval abilities begin only after deployment completes.
- Mega Knight remains protected and untargetable during its special drop summon until landing.
- Battlefield touch/mouse placement now confirms on release; dragging outside the arena and releasing cancels without spending the card.
- 67 cards (60 units/buildings + 7 spells), physicsVersion 69.

# v37.6.0 COMBAT SPELL & ELIXIR PUMP UPDATE

- Laser Tower: 42 base DPS, 0.2s ticks, visible continuous beam, 1s doubling unchanged.
- Fireball: radius 2.5 cells, 1.26s warning then core launch, radial 1-cell knockback for small/medium units.
- Arrow Rain: radius 3.5 cells, 1.1s warning then visible core-to-target arrow flight.
- Elixir Pump: cost 6, HP1070, +1 energy every 13s, 11.5 HP/s decay, +1 on destruction.
- 67 cards (60 units/buildings + 7 spells), physicsVersion 68.

# v37.2.0 - MAP VARIATION & TOWER RANGE UPDATE

- Bridge traversal widened to two grid cells while staying centred on X4 / X15.
- River grid lines are hidden; river rules still occupy Y16-17.
- Tower attack range is seven cells measured from the 3x3 / 4x4 footprint edge, so 6-cell Blowdart pressure is answerable.
- Five visual themes: grass, stone/ruins, lava, snow/ice, desert.
- Added non-colliding themed arena-border decoration.
- 66 selectable cards / 59 unit-or-building cards / 7 spells / physicsVersion 63.

- Decorative bridge rails, ropes, grass, stones, bank shading and water details are render-only.