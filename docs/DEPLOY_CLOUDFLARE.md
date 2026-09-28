# Cloudflare deploy - v41.2.0

Use the included setup/login/deploy BAT files or the npm scripts from this folder.

After deployment, verify `/api/config` reports: `version=41.2.0`, `cards=77`, `units=66`, `spells=11`, `physicsVersion=76`, `maxDeck=8`.

This release changes placement-preview UI only: normal unit/building ghosts stay at the last legal deployment point when the pointer enters forbidden terrain or territory. Spell targeting is unchanged.
