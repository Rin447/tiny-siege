# v46.0.0 - HUNTER & ROCKET UPDATE

- Added Hunter: 4 cost, HP884, normal speed40, 84 x10 non-piercing fan pellets every 2.2s, 4-cell acquisition range, 6.5-cell pellet travel, ground+air targeting.
- Added Rocket: 6 cost, 2-cell radius, 1484 damage to units/player buildings, 343 to towers, immediate Core launch, about 3.16s to bridge centre / 4.8s to enemy Core.
- Spell damage contract changed so player-placed buildings take full spell damage; only side/core towers use reduced tower damage.
- Rolling Wood speed 182 -> 165; Rolling Barbarian speed 154 -> 140.
- 83 selectable cards (71 units/buildings + 12 spells), physicsVersion 83.

# v45.4.0 - GOBLIN HUT & HP FEEDBACK UPDATE

- Goblin Hut immediately spawns one Spear Goblin on enemy trigger entry, keeps its 2.2s active interval, retriggers after leaving/re-entering, and spawns one on destruction.
- Full-health mobile-unit HP bars are hidden; buildings/towers stay visible. Damage briefly flashes the unit/bar.
- Card count remained 81; physicsVersion 82.

# v45.3.0 - ROLLING & HP BAR UPDATE

- Rolling Wood speed 364 -> 182; Rolling Barbarian speed 308 -> 154.
- Rolling spell previews stop at the last legal deployment point when dragged beyond the active deployment line / open water.
- Reverted the strong v45.2 unit HP-bar background/outline while keeping the thicker bar height and air-unit overhead position.
- Unit HP-bar widths now follow size classes: small 22, medium 34, large 48. Buildings keep a compact stable width.
- 81 selectable cards (70 units/buildings + 11 spells), physicsVersion 81.

# v45.2.0 - HP BAR VISIBILITY UPDATE

- Fixed the enemy Core Tower HP bar being clipped above the arena.
- Air-unit HP bars are positioned overhead using a size-aware offset.
- HP bars are slightly thicker and use stronger background/outline contrast.
- UI-only update; 81 selectable cards and physicsVersion 80 remain unchanged.

# v45.1.0 - HARD AI DEMO UPDATE

- Home demo now runs HARD AI versus HARD AI.
- Blue and Red independently randomize personality and generate separate archetype-aware decks every match.
- Matchup labels show personality/archetype for both sides.
- Results remain visible for three seconds before a newly randomized auto-rematch.
- CPU AI now supports per-owner personality state.
- 81 selectable cards; physicsVersion remains 80.

# v45.0.0 - CPU AI OVERHAUL

- Added CPU personality selection: Random / Aggressive / Defensive / Combo / Counter / Balanced.
- Added CPU deck selection: generated deck / mirror player deck / My List deck / editable CPU-only deck.
- Added archetype-aware random deck generation for Air, Heavy, Swarm, Summon, Siege, Control, Cycle and Balanced decks.
- Reworked spell decisions to score troop clusters, target value, kill opportunities and tower overlap instead of defaulting to structures.
- Added multi-card push planning, defensive counter selection, weak-lane pressure and counter-push support.
- Difficulty now changes decision quality and reaction speed without stat/energy cheats.
- 81 selectable cards; physicsVersion remains 80 because authoritative battle mechanics are unchanged.

# v44.0.0 - BABY DRAGON & MUSKETEER UPDATE

- Tesla footprint 3x3 -> 2x2 and battlefield model/hitbox reduced.
- Goblin Hut remains 3x3 but battlefield art is reduced for spawn visibility.
- Removed Spark Spearman from the selectable card pool.
- Added Baby Dragon: 4 cost / HP1152 / 168 splash / 1.2-cell radius / 1.5s / 3.5-cell range / flying / fast / ground+air.
- Added Musketeer: 4 cost / HP720 / 218 damage / 1.0s / 6-cell range / ground / normal speed / ground+air.
- 81 selectable cards (70 units/buildings + 11 spells), physicsVersion 80.

# v43.0.0

- Core Tower damage 109.
- Wall Breaker speed 74.
- Added Goblin Hut proximity Spear Goblin spawner.
- Added underground/spell-immune Tesla.
- 80 selectable cards, physicsVersion 79.

# v42.1.0 - SIDE TOWER OFFENSE UPDATE

- Side Tower range increased from 7.0 to 7.5 cells.
- Side Tower damage increased from 105 to 109.
- Side Tower attack interval reduced from 1.0s to 0.8s.
- Core Tower unchanged at HP4560 / damage85 / 0.9s / 7.0-cell range.
- 78 cards (67 units/buildings + 11 spells), physicsVersion 78.

# v42.0.0 - WIZARD & WALL BREAKER UPDATE

- Added Wizard and reworked Bomb Carrier into Wall Breaker.
