# TINY SIEGE v46 architecture

## Release contract

- Version: 46.0.0
- physicsVersion: 83
- Selectable cards: 83 (71 units/buildings + 12 spells)
- Arena: 18 x 32 cells, 40 world units per cell
- Multiplayer: Cloudflare Worker + Durable Object + WebSocket

## Source of truth

`public/index.html` is the current browser client source and contains the deterministic gameplay block used by the browser. `scripts/sync-game-core.mjs` extracts that gameplay block into `src/game-core.js`.

`src/game-core.js` is imported by both `src/worker.js` and `server/dev.mjs`, keeping online and local authoritative combat on the same ruleset. Run `npm run check` after changing gameplay code in `public/index.html`.

## Server layers

- `src/game-core.js`: deterministic match state, deployment, AI and combat simulation.
- `src/room-model.js`: two-player room lifecycle, ready state, authentication tokens, reconnect handling and match commands.
- `src/worker.js`: Cloudflare HTTP API, Durable Object adapter, WebSocket handling and static-asset routing.
- `server/dev.mjs`: zero-dependency Node.js local server that mirrors the room protocol for development/testing.

## Client layer

The current v46 client is intentionally consolidated in `public/index.html`. Older releases used separate `public/app.js`, `public/styles.css` and `public/game/*.js` files; those files are not required by the v46 runtime and are therefore not carried forward just to preserve an older folder count.

## Important v46 rules

- Hunter fires ten non-piercing pellets in a fan. Attack acquisition is 4 cells; pellets can travel 6.5 cells.
- Rocket launches immediately from the owner's Core Tower and uses distance-based flight time.
- Player-placed buildings receive normal spell damage; only side/core towers use reduced tower damage.
- Rolling Wood and Rolling Barbarian use authoritative forward-travel strips with speeds 165 and 140.
- Goblin Hut immediately spawns on enemy acquisition and once on destruction.

## Repository policy

Generated or distribution-only files are not committed. `PLAY-OFFLINE.html` can be generated on demand with `npm run build:offline`. Historical screenshots and version-specific legacy tests are kept out of the GitHub-ready package.
