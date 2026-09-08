# TINY SIEGE v3 architecture

## Shared authority
`public/game/engine.js`, `physics.js`, and `units.js` are shared by CPU practice and the authoritative online `RoomModel`. Clients request card placement only; HP, damage, targeting, movement, collision, deck rotation and victory are server-simulated online.

## Six-card decks
The unit library contains nine unique IDs. A battle deck is exactly six unique valid IDs (`MAX_DECK = 6`). The browser stores the player's chosen deck locally. CPU practice creates the local match with that deck and the bot's recommended default deck.

Online, the client sends its six-card deck when toggling Ready. `RoomModel` validates and stores it before accepting Ready. The host can start only when both connected players are Ready with valid decks. `createMatch` receives both server-side decks, creates a four-card hand and two-card queue for each player, then rotates only within those six cards. Ordinary room snapshots expose `deckCount`, not the opponent's six IDs. Battle snapshots expose only the viewer's own deck/hand/queue-related state.

## Stone Golem
`golem` uses `buildingOnly: true`. Target acquisition filters out enemy troops and selects hostile structures: side towers, core and deployed buildings such as cannon. It remains a ground body, so enemy troops can attack it and same-layer collision/pathing applies. Its large radius and high mass make it hard to displace without making it immovable.

The character art is an original procedural Canvas simplification of the approved concept direction: mossed stone slabs, glowing blue runes/eyes, heavy fists and a distinct rear view. Runtime does not depend on the concept PNG.

## Geometry and navigation
Ground bodies and live towers/cannons use circular footprints. Lawn boundaries and river banks respect full body radius. Navigation routes ground units toward attack range while avoiding live structures; defeated towers and expired cannons stop blocking. Air ignores ground structures and terrain blockers but uses its own same-air contact layer.

## Unit contact
Ground allies yield softly based on radius and inverse mass. Enemy ground bodies cannot pass through one another. Air bodies use the same concept within the air layer. Ground and air do not physically block each other. Static obstacles are rechecked after separation. The Stone Golem participates as the largest/heaviest mobile ground body in v3.

## Rendering
Moving units support viewer-relative front/rear presentation. Ground troops and structures are depth-sorted by foot Y; air renders above ground. Optional collision overlays are visual diagnostics only. The deck editor and library portraits call the same procedural unit renderer used by battle UI.

## Persistence and deployment
Keep Worker `tiny-siege`, binding `BATTLES`, exported class `BattleRoom`, and migration tag `tiny-siege-v1`. v3 does not require a new Durable Object class or namespace. Use a new room after deployment and force-reload both clients.
