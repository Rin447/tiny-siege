# Changelog

## v3.0.0 / Stone Golem & Six-Unit Decks

- Unit library expanded from 8 to 9.
- Added **Stone Golem**, a massive building-only ground tank.
  - Ignores enemy troops when choosing attack targets.
  - Can target enemy towers, core and deployed enemy buildings.
  - Very high HP and building damage, very low movement speed, cost 6.
  - High mass / large radius participates in existing ground collision and structure pathing.
  - Added original procedural front/back Canvas artwork based on the approved concept direction.
- Added six-unit custom deck system.
  - Exactly 6 unique units selected from 9.
  - 4-card hand + 2-card queue rotates only within the chosen deck.
  - Saved locally in the browser.
  - Home and lobby deck summaries.
  - Full deck editor with six slots, nine-unit pool, recommended reset and validation.
  - CPU uses the local player's selected deck; bot uses the recommended deck.
  - Online players submit their own deck with Ready; match starts only when both valid decks are ready.
  - Opponent deck contents are not included in ordinary room snapshots; only count is exposed.
- API `/api/config`: version 3.0.0, units 9, maxDeck 6.

## v2.0.0 / Formation & Facing

- Seven rear-view variants: blade, knight, archer, mage, spear, bat, bomber.
- Cannon barrel and tower turret aim; viewer-relative headings on both seats.
- Same-ground and same-air collision layers, opponent hard core, allied soft yielding.
- Relative mass added for formation contact.
- Full-body river constraints, routing around live buildings, destroyed buildings cease to block.
- Tower/ground depth sorting and optional collision overlay.
