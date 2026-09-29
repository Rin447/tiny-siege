# TINY SIEGE v46.0.0 - HUNTER & ROCKET UPDATE

## v46.0.0 highlights
- Added Hunter: 4 cost / HP884 / normal speed40 / ground unit / ground+air targeting. Every 2.2 seconds it fires ten 84-damage pellets in a 40-degree fan. Attack acquisition range is 4 cells while pellets can travel up to 6.5 cells. Pellets do not pierce and disappear on first collision, so point-blank hits can reach 840 total damage.
- Added Rocket: 6 cost / radius 2 cells / 1484 damage to units and player-placed buildings / 343 damage to side/core towers. It launches immediately from the owner's Core Tower with no pre-launch delay. Flight time is distance based: about 3.16s to bridge centre and 4.8s to the enemy Core Tower.
- Spell structure damage is now consistent: player-placed buildings receive the spell's full normal damage, while only side/core towers use the reduced tower-damage value. This applies to Fireball, Arrow Rain, Poison, Lightning, Zap, Rage, Cyclone, Rolling Wood and Rocket.
- Rolling Wood speed: 182 -> 165. Rolling Barbarian speed: 154 -> 140. Their range, damage and deployment-line boundary lock are unchanged.
- CPU random decks can include both new cards, and CPU spell scoring recognizes Rocket as a normal high-cost damage spell.
- Card count is now 83 (71 units/buildings + 12 spells). Authoritative combat rules changed, so physicsVersion is now 83.

## v45.4.0 highlights
- Goblin Hut immediately spawns one Spear Goblin when an enemy unit first enters its 6-cell trigger range, then continues at the existing 2.2-second interval. Leaving and re-entering triggers another immediate spawn.
- Goblin Hut spawns one Spear Goblin immediately when destroyed. Existing cost 4 / HP1180 / 3x3 footprint / 40 HP-per-second decay remain unchanged.
- Mobile-unit HP bars are hidden while HP is full; they appear after damage and hide again after a full heal. Buildings and towers remain always visible.
- HP bars use a slimmer 6px outer height while retaining size-based widths (small 22 / medium 34 / large 48) and overhead positioning for air units.
- A damaging hit briefly glows the character and visible HP bar for about 0.15 seconds.
- Combat ability changed, so physicsVersion is now 82. Card count remains 81 (70 units/buildings + 11 spells).

## v45.3.0 highlights
- Rolling Wood speed: 364 -> 182. Rolling Barbarian speed: 308 -> 154.
- Rolling-spell drag previews now stop at the last legal deployment point instead of moving beyond the active cast line.
- Unit HP bars keep the thicker v45.2 height and air-unit overhead placement, but return to the softer pre-v45.2 background with no extra outline.
- Mobile-unit HP-bar widths are standardized by size: small 22 / medium 34 / large 48.
- Combat timing changed, so physicsVersion is now 81. Card count remains 81 (70 units/buildings + 11 spells).

## v45.2.0 highlights

- Enemy Core Tower HP is always readable; its bar is no longer clipped above the arena.
- Air-unit HP bars now sit above the unit instead of overlapping the body.
- Unit, deployment, and tower HP bars are slightly thicker with stronger contrast.
- UI-only change: 81 selectable cards and physicsVersion 80 are unchanged.

## v45.1.0 highlights

- Home preview is now a full HARD-vs-HARD AI spectator battle.
- Blue and Red independently roll one of the five CPU personalities for every match.
- Both sides receive separately auto-generated eight-card decks and independent deck archetypes every match.
- The preview displays each side's personality and archetype, then holds the result for three seconds before automatically starting a fresh matchup.
- CPU decision logic now supports per-owner personalities so two AI players can genuinely use different styles in the same simulation.
- Current release: 81 selectable cards and physicsVersion 81.

## v45.0.0 highlights

- Rebuilt CPU practice AI around three independent settings: difficulty, personality, and CPU deck.
- CPU personality can be Random, Aggressive, Defensive, Combo, Counter, or Balanced. Random resolves to a new personality at the start of each match.
- CPU deck modes: auto-generated balanced deck, mirror the player's current deck, use a saved My List deck, or use a separately editable CPU-only deck.
- Auto deck generation creates a coherent eight-card deck from archetypes such as Air, Heavy, Swarm, Summon, Siege, Control, Cycle, and Balanced instead of using a fixed deck.
- Spell AI evaluates troop clusters, card value, kill potential, utility targets, and tower overlap before casting. Tower-only spell cycling is heavily reduced.
- CPU can reserve energy for two- or three-card pushes, choose defensive counters, attack weaker lanes, and turn surviving defenders into counter-pushes.
- Difficulty changes decision quality and reaction cadence only. CPU receives no hidden stat or energy bonus.
- Selectable roster remains 81 cards (70 units/buildings + 11 spells). Battle mechanics are unchanged, so physicsVersion remains 80.

## Previous v44.0.0 highlights

- Tesla placement footprint changed from 3x3 to 2x2 and its visual/hitbox was reduced.
- Goblin Hut retained a 3x3 footprint with smaller art.
- Spark Spearman was removed.
- Baby Dragon and Musketeer were added.

## Full package / Windows helpers
This archive includes the Windows `.bat` launch/deploy helpers, Node local server, Cloudflare Worker/Durable Object source, package scripts, deterministic server core, and smoke tests. `public/index.html` is the canonical v46 client source. Run `npm run check` after editing it; the command regenerates `src/game-core.js` before validation.
