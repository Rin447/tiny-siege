# TINY SIEGE v18.1.0 Test Report

Local verification for **DETAIL DEMO RENDER FIX**. Cloudflare production and physical-device multiplayer are not executed in this environment.

## Release identity
- Version: **18.1.0**
- Cards: **30** (26 unit cards + 4 spells)
- Deck size: **8**
- physicsVersion: **17** (unchanged from v18.0.0; no authoritative combat change)

## Fixed regression
- Sparky `sparkblast` rendering now uses `drawArena()`'s `time` value instead of the undefined `t` reference.
- `drawArena()` resets the Canvas transform at the start of every frame.
- Generic projectile rendering protects `save()` / `restore()` with `try/finally`.
- The browser regression intentionally lets the Sparky LIVE BATTLE DEMO reach its charged shot, run to the end, loop back to the beginning, then switches to Leaf Archer. No Canvas corruption or uncaught JavaScript error is observed.

## Automated engine / Worker tests
- `npm test`: **173 / 173 passed**.
- Includes a new static regression guard for the Sparky projectile time variable, frame transform reset, and protected projectile restore.
- Existing v18 gameplay checks for Princess Archer, Zap, Sparky charging, summoners, spells, physics/collision, Durable Object state and WebSocket authentication remain green.

## Browser checks
- Current v18 browser suite: **10 / 10 passed** in headless Chromium.
- Sparky detail reaches the charged `sparkblast`, completes the demo loop, and redraws normally.
- Switching from Sparky detail to Leaf Archer remains visually/render-state safe.
- Patch Notes shows v18.1.0 plus the retained v18.0.0 and v17 history.
- Self-contained HTML starts a playable CPU battle with a four-card hand and visible arena.
- No uncaught JavaScript errors were observed in the tested flows.

## HTTP / WebSocket integration
- `npm run test:network`: **14 / 14 passed** against the local Node server.
- `/api/config` reports v18.1.0 / 30 cards / 26 unit cards / 4 spells / physicsVersion 17.
- Two-client synchronization, ready/start, deployment validation, disconnect/reconnect, surrender/rematch, host migration and cross-origin rejection pass.

## Congestion / collision stress
- Synthetic zero-damage test: **51 units**, 300 steps / 30 simulated seconds.
- `maxEnemyOverlap`: **0**.
- This is unchanged gameplay logic and serves as a regression safety check.

## Build / static checks
- `npm run check`: **17 JavaScript files parse**; Cloudflare configuration and separate Worker name are valid.
- `npm run build:offline`: self-contained CPU practice build succeeded.

## Not covered here
- The deployed Cloudflare production URL itself.
- Two physical phones/tablets on real networks.
- Long-duration production traffic / Cloudflare quota behavior.
