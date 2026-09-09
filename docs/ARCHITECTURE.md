# TINY SIEGE v9 architecture

## Shared authoritative simulation

The browser CPU mode, local Node server, and Cloudflare Durable Object all use the same files under `public/game/`. Online clients submit commands; the server owns energy, card rotation, movement, collision, damage, spell travel, tower state, and win conditions.

## v9 card model

- 17 selectable cards total.
- 16 unit cards plus 1 spell card (`fireball`).
- Six cards per player deck.
- `mini_golem` is a hidden summon and cannot be selected in a deck.

## Fireball

`deploy()` branches to spell casting when a card has `spell`. Fireball starts at the owner's living central core, stores a fixed target coordinate, and does not track units. Travel time is distance-based and clamped to 0.6–2.0 seconds. Impact damages enemy ground/air units in radius 90 for 560 and structures for 140. A hit on a dormant central core wakes it through the normal damage path.

## Golem split and death blast

Stone Golem death is handled by the same authoritative damage path as ordinary combat. It first emits an enemy-only death blast, then spawns two hidden Mini Golem bodies when unit capacity permits. Mini Golems retain building-only targeting and have their own smaller death blast.

## Frontline deployment

A destroyed enemy side tower unlocks only that lane. The new deployment boundary stops `advancedDeployInset=120` pixels on the attacker's side of the ruin. The centre strip and intact lane stay locked.

## Compatibility

`PHYSICS_VERSION=7`. Active matches saved under another physics version are ended safely and must be restarted from the lobby.

## v9 balance additions

- `knight` remains the pure defensive tank but costs 4 energy.
- `golem` retains building-only targeting, splitting and death blast with 2850 parent HP.
- `berserker` is a normal ground-targeting melee unit with mass 8.2, 1950 HP, 360 attack, speed 32 and no air targeting. It uses no special target override: its identity comes from heavy body size, slow approach and high direct damage.
