# Cloudflare deploy - v37.2.0

Use the included setup/login/deploy BAT files or `npm run deploy` after Cloudflare authentication.

After deployment, verify `/api/config` reports: `version=37.2.0`, `cards=66`, `units=59`, `spells=7`, `physicsVersion=63`, `maxDeck=8`.

Also verify a real match can deploy a troop in the one-cell row behind the core, that 3x3 buildings cannot overlap river/towers/other buildings, and that both WebSocket seats receive identical physics-v61 state.
