# Original art, v3

All game unit visuals are procedural Canvas drawings in `public/game/art.js`; no paid animation runtime, external sprite sheet or font file is bundled.

## Stone Golem
`docs/concepts/stone-golem-concept.png` stores the approved concept direction for reference. The actual in-game Stone Golem is a simplified procedural implementation designed to match the existing TINY SIEGE cast at small scale. The runtime does not load this concept image.

Implemented visual identifiers include:
- moss-covered stone plates
- glowing blue eyes and rune marks
- oversized fists and broad silhouette
- team-colored cloth accent
- distinct front and rear construction
- heavy step / building strike motion

`docs/previews/01-deck-editor.png` and `02-nine-unit-library.png` were rendered from the v3 self-contained game in Chromium via Playwright `set_content`. `03-cpu-battle.png` is from the same v3 CPU flow. These are local render checks, not Cloudflare production screenshots.
