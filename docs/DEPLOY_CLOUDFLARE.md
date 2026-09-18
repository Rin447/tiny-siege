# Cloudflare deploy - v38.0.0

Use the included setup/login/deploy BAT files or `npm run deploy` after Cloudflare authentication.

After deployment, verify `/api/config` reports: `version=38.0.0`, `cards=73`, `units=65`, `spells=8`, `physicsVersion=72`, `maxDeck=8`.

Also verify Air Balloon's delayed death bomb and Lumberjack's death Rage are identical for both WebSocket seats, and that the existing grid placement and structure collision rules still behave normally.
