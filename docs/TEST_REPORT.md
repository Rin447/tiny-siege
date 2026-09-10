# TINY SIEGE v17.0.0 Test Report

Local verification for the **SUMMONERS UPDATE**. Cloudflare production and physical-device multiplayer are not executed in this environment.

## Release identity
- Version: **17.0.0**
- Cards: **27** (24 unit cards + 3 spells)
- Deck size: 8
- physicsVersion: **16**

## Automated engine / Worker tests
- `npm test`: **166 / 166 passed**.
- Covers roster/config, every selectable-card deployment, summon timing, guaranteed initial summon capacity, Ash Squad formation, physics/collision, spells, target lock, Durable Object state and WebSocket authentication.

## v17 browser checks
- **7 / 7 passed** in the self-contained Chromium build.
- Deck editor exposes all 27 cards and the three new cards.
- Necromancer detail proves 3 Bones immediately on deploy and a further 3 after 6 simulation seconds.
- Dark Necromancer detail proves 2 Moon Bats immediately on deploy and a further 2 after 5 simulation seconds.
- Ash Squad detail identifies and demonstrates the front-one/rear-two formation.
- My List writes a valid preset to the v17 storage key.
- Patch Notes shows v17 SUMMONERS UPDATE while retaining the grouped v16 history.
- No uncaught JavaScript errors were observed in those flows.

## Regression browser checks
- v16.2 deck-builder / responsive 3-column flow: **10 / 10 passed** on desktop and 390px touch viewport.
- v16.4 balance / ability-demo flow: **6 / 6 passed**.
- v16.1 mobile building two-tap placement / legacy balance flow: **6 / 6 passed**.
- Spell renderer regression: own spell tint remains blue-side and enemy spell tint remains red-side.

## HTTP / WebSocket integration
- `npm run test:network`: **14 / 14 passed** against the local Node server.
- `/api/config` reports v17.0.0 / 27 cards / 24 unit cards / 3 spells / physicsVersion 16.
- Two-client synchronization, ready/start, deployment validation, disconnect/reconnect, surrender/rematch, host migration and cross-origin rejection pass.

## Congestion / collision stress
- Synthetic zero-damage test: **51 units**, 300 steps / 30 simulated seconds.
- `maxEnemyOverlap`: **0**.
- v17 increases rigid body-separation resolution from four to five passes so newly generated summon waves do not introduce residual enemy overlap in dense fights.
- This test is local Node simulation, not a Cloudflare CPU/quota benchmark.

## Build / static checks
- `npm run check`: **17 JavaScript files parse**, Cloudflare config and the separate Worker name are valid.
- `npm run build:offline`: self-contained CPU practice build succeeded.

## Not covered here
- The deployed Cloudflare production URL itself.
- Two physical phones/tablets on real networks.
- Long-duration production traffic / Cloudflare quota behavior.
