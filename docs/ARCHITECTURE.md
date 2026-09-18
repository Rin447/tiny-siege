# TINY SIEGE v37.2.0 architecture

- Authoritative arena: 18 columns x 32 rows, 40 world units per cell (720 x 1280 world units).
- Blue coordinates count from the bottom in design documents. Runtime world Y is top-down and is converted by the grid helpers in `public/game/units.js`.
- River occupies design rows Y16-Y17. Bridges occupy X4-X5 and X14-X15.
- Side towers use 3x3 footprints. Cores use 4x4 footprints. The one-cell row behind each core remains troop-deployable.
- Normal placed buildings use 3x3 rectangular footprints unless a card explicitly overrides them.
- Archer range is the five-cell reference. Unit attack range, vision, AoE and special-ability distances expose cell values and converted world values.
- Vision is size based: small 4 cells, medium 5 cells, large 6 cells; specialist ability acquisition remains independent.
- Structure attacks/navigation measure distance to the nearest footprint edge instead of the structure centre.
- Movement remains continuous and sub-cell; the grid is a rule/measurement system rather than tile-step movement.
- `physicsVersion 63` identifies the v37.2 grid/footprint navigation, two-cell bridge, and tower-edge range contract.

- Match snapshots include `mapTheme`; rendering caches terrain per theme while simulation geometry remains shared.
