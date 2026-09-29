# TINY SIEGE architecture

- Current release: v46.0.0 / physicsVersion 83 / 83 selectable cards (71 units/buildings + 12 spells).
- v46 adds straight-line non-piercing Hunter pellets, distance-timed Core-launched Rocket projectiles, and a unified spell-damage contract: placed buildings take normal spell damage, while side/core towers use reduced tower damage.
- v45.4 adds Goblin Hut trigger-entry/death spawning plus damage-reactive unit HP visibility and hit flash feedback.
- v45.3 changes rolling-spell travel timing and deployment-preview boundary locking, and standardizes unit HP-bar width by size class.
- v45.1 extends the CPU layer with per-owner personalities and uses HARD/random-personality/random-generated-deck AI on both sides of the home spectator demo.
- v45 replaces the CPU practice decision layer with personality-driven strategy, archetype-aware deck generation, board-scored spell targeting, combo planning, defense selection and counter-push logic.
- v41 adds authoritative forward-travel strip spells: Rolling Wood uses one-hit swept collision plus equal nominal knockback across unit sizes; Rolling Barbarian uses the same strip model and deploys one normal Barbarian at the endpoint.
- v40 adds Goblin Barrel as an authoritative core-launched projectile spell with deterministic three-Goblin formations around ordinary points and tower hitboxes; Siege Barbarian receives a visual-only front/back carrier layout.
- v39 adds the Giant, overhead-centre Air Balloon attack geometry, and shorter Fireball/Arrow Rain launch warnings; the 18x32 arena geometry remains unchanged.
- v38 added authoritative delayed Air Balloon death bombs and Lumberjack death-triggered Rage zones.

## v37.2 grid architecture baseline

- Authoritative arena: 18 columns x 32 rows, 40 world units per cell (720 x 1280 world units).
- Blue coordinates count from the bottom in design documents. Runtime world Y is top-down and is converted by the grid helpers in `public/game/units.js`.
- River occupies design rows Y16-Y17. Bridges occupy X4-X5 and X14-X15.
- Side towers use 3x3 footprints. Cores use 4x4 footprints. The one-cell row behind each core remains troop-deployable.
- Normal placed buildings use 3x3 rectangular footprints unless a card explicitly overrides them; Tesla explicitly uses a 2x2 footprint as of v44.0.0.
- Archer range is the five-cell reference. Unit attack range, vision, AoE and special-ability distances expose cell values and converted world values.
- Vision is size based: small 4 cells, medium 5 cells, large 6 cells; specialist ability acquisition remains independent.
- Structure attacks/navigation measure distance to the nearest footprint edge instead of the structure centre.
- Movement remains continuous and sub-cell; the grid is a rule/measurement system rather than tile-step movement.
- `physicsVersion 63` identifies the v37.2 grid/footprint navigation, two-cell bridge, and tower-edge range contract.

- Match snapshots include `mapTheme`; rendering caches terrain per theme while simulation geometry remains shared.
