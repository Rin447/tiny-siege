# TINY SIEGE v2 architecture

## Shared authority
`public/game/engine.js`, `physics.js`, `units.js` are imported by both CPU practice and the authoritative `RoomModel` server simulation. Clients submit only card and position; HP, damage, heading and displacement are not client-authoritative. Core simulation uses 0.1-second ticks, subdividing larger supplied dt. Online state broadcasts retain the v1 cadence and private hands.

## Geometry and navigation
Ground bodies and live towers/cannons use circular footprints. Lawn boundaries and the river banks respect the entire body radius. Navigation uses a 20-unit grid A* route to attack range with full-body line-of-sight simplification. Clearance grids are cached per body radius and invalidated when live structures change. Paths are not sent to clients. Defeated towers and expired cannons stop blocking immediately. Terrain art (trees/rocks) is decorative.

## Unit contact
Ground allies have a 90%-radius hard core and a soft separation shell out to the sum of the radii. Displacement in the soft shell is weighted by inverse mass. The knight has mass 6 versus archer/spear 1.2, but is not immovable. Air allies use 90% of the combined radius; opposing air units use full radius. Opposing ground units also use full radius. Swept unit contacts limit travel so one unit cannot jump through another; local candidate steering can go around a blocker where there is space. A single knight does not seal an entire lane. Static obstacles are checked again after separation. Extreme artificial piles may require several solver passes; normal spawning searches for free nearby positions rather than creating piles.

## Deployment
A group spawn is validated fully before energy/card rotation is charged. Mobile units may move up to 48 world units from the candidate spawn to avoid occupied space. Cannons never relocate the chosen deployment position. Air can deploy/fly over ground bodies and structures. Friendly-versus-enemy is separate from ground-versus-air. `targetsAir` is an attack capability, not a movement altitude.

## Rendering
Seven moving units have front/rear cut-out variants using the original procedural rig. Body orientation is front/rear plus lateral mirroring, not a full 3D or eight-angle character model. The cannon barrel rotates independently through 360 degrees. World headings are transformed by the viewer's seat. Ground troops and towers share a foot-Y depth order; air is painted afterward. Hidden friendly position hints and optional radius overlays are visual-only. Interpolation does not decide gameplay collisions.

## Combat intentionally unchanged
Ranged projectiles are not blocked by allied units or structures. No automatic taunt, permanent front-line formation, or guaranteed interception was added. A tank physically occupies space but does not force every enemy to attack it. Attack ranges and card costs otherwise remain the v1 values.

## Persistence and deployment
Keep Worker `tiny-siege`, binding `BATTLES`, exported class `BattleRoom` and migration `tiny-siege-v1`. No new Durable Object namespace or migration is required. Old active matches are ended rather than resuming with incompatible physics. Worker restart behavior continues to request a rematch. No external deployment was performed by the authoring environment. Always reload both clients and validate a new room after deployment.
