# TINY SIEGE v5 architecture

## Deck and unit library

The shared `UNITS` table contains 15 unique unit IDs. `MAX_DECK` remains 6. The browser stores the local deck under `tiny-deck-v5` and can migrate v4/v3 saves. CPU practice uses the player's six-card deck and the current recommended default deck for the bot. Online readiness sends exactly six unique valid IDs to the authoritative room simulation.

## v5 special behaviors

- `lumina`: weak ranged attack plus an independent healing pulse. It heals the nearby allied non-building unit with the largest missing HP; buildings are intentionally excluded.
- `frost`: projectile status applies a 3-second ground-only movement/attack slow. A frost hit also removes part of a charging boar's accumulated run distance.
- `harpy`: flying ranged attacker. The primary lightning strike can chain to nearby enemy troops, up to three total targets with falling damage.
- `boar`: remains building-only. v5 raises its physical mass and adds a shove rule against lightweight enemy ground troops. It still cannot shove heavy tanks, other boars, golems or structures.

## Physics v3

Ground and air remain separate collision layers. Buildings remain solid for ground units and ignored by air. Same-layer allies yield softly. Enemy units normally keep rigid personal space; a unit with `shovePower` can temporarily compress contact distance against sufficiently light enemies, after which deterministic mass-weighted separation displaces the light blocker. Static navigation still routes around living towers and cannons.

`PHYSICS_VERSION = 3`; a restored active match from an older physics version is ended rather than resumed under changed collision rules.

## Online authority

The Cloudflare Durable Object (`BATTLES` / `BattleRoom`) remains authoritative for placements, movement, combat, healing, slows, chain damage, scores and disconnect handling. No new Durable Object class or migration namespace is required for v5.
