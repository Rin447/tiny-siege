## v25.1.0 Drag Deck UI
No new image assets were added. The deck drag ghost reuses the existing procedural card portrait canvas and deck portrait mode.

## v25.0.0 Iron Eye / Tracker procedural art
Iron Eye and Tracker use original procedural Canvas art in `public/game/art.js`. Iron Eye uses a green hooded faceless silhouette, bow and hidden blades. Tracker uses a tall slim closed-helm armor silhouette, one-handed sword, small shield and hook spool/chain. No external character assets were added.

# Original procedural art, v18.0

外部キャラクター素材は使用せず、`public/game/art.js` のCanvas図形で描画します。

- 穴掘りティガー：鉱夫ヘルメット、ランプ、掘削クロー。地下中は土盛りだけ表示。
- マッドドラゴン：泥色の大型飛行竜、広い翼、角、泥弾。
- 吹き矢ゴブリン：小型の緑肌射手、長い吹き筒、軽装。前後姿あり。
- レーザー塔：紫系の増幅結晶を備えた固定塔。ロック中は対象へ連続ビームを描画し、段階上昇でビームが太くなります。
- 泥沼：茶系の半透明円と斑点。

## v16.2 card demos

Card detail previews do not add external videos, GIFs, character art, or third-party media. The AUTO DEMO panel is rendered at runtime on Canvas using the existing original procedural TINY SIEGE card/unit drawings and simple generated effects.


## v16.4 ability demo staging
No external video/GIF assets were added. The special-ability demonstrations are still rendered from the original procedural Canvas art and production battle renderer. v16.4 changes only the controlled battle setup so effects such as the Golem death blast/split and Mud Dragon slow/DoT are visibly exercised.

## v17.0 original summoner art
No external character art, GIFs, videos, or third-party game assets were added.

- Necromancer: original procedural robed summoner with bone-themed magic and a distinct `necro` projectile.
- Dark Necromancer: darker original procedural variation with a separate `dark` projectile and bat-summoning theme.
- Ash Squad card: original procedural three-swordsman composition. In battle it spawns three existing Ash Swordsman rigs, so the card and battle behavior stay consistent with the established unit.
- Summon effects are rendered from the normal Canvas event pipeline; the Bone and Moon Bat minions are the real existing TINY SIEGE units rather than separate demo-only art.

## v18.0 Princess / Zap / Sparky art
No external character art, images, GIFs, videos, or third-party game assets were added.

- Princess Archer: original procedural royal archer portrait/battle rig with an oversized bow and `royal_arrow` projectile.
- Zap: original procedural electric spell portrait, impact ring and stun lightning effects.
- Sparky: original procedural heavy electric cannon. Charge intensity increases visually with progress; full charge has a stronger glow/electric state and `sparkblast` projectile.
- Stunned units/buildings receive synchronized electric status effects from battle snapshot metadata.

## v23.0 siege specialist art
No external images or third-party character assets were added. Sky Bomber, Scrap Drill, Crusher Ogre, Siege Turtle and Bomb Carrier use original procedural Canvas drawings in `public/game/art.js`, including their bomb, drill-ramp, heavy-hit, shell and self-destruct effects.

## v23.0 readability refresh - flying units
The following units keep the original procedural Canvas pipeline and add no external character images. Combat stats and mechanics are unchanged.

- Mud Dragon: broader swamp-crocodile body, oversized jaw, torn wings, mud armour lumps and animated drips.
- Storm Harpy: slimmer bird-warrior body, lightning-bolt wing silhouette, thunder crest, hooked talons and idle electrical arcs.
- Laser Dragon: slim plated body, straight mechanical wings, forehead crystal, chest reactor and antenna-like tail.
- Sky Bomber: humanoid pilot silhouette, helmet/goggles, twin-rotor flight pack, bomb belt and oversized carried bomb.

## v23.0 redesign-02 heavyweight silhouettes
No external images or third-party assets were added. Dosranboss, Scrap Drill, Crusher Ogre and Siege Turtle remain original procedural Canvas drawings in `public/game/art.js`, updated for stronger silhouette readability (boss crest, oversized drill, giant hammer, fortress shell/ballista).

## v23.0 redesign-03 small-special silhouettes
No external assets were added. Blowdart Goblin, Bomb Carrier and Dosranboss remain original procedural Canvas drawings in `public/game/art.js`, updated for clearer silhouette readability and the requested thinner blue/orange dinosaur styling for Dosranboss.

## v23.0 redesign-04 deck portrait framing
Deck-building portraits now use a shared composition frame with unit-specific scale/offset metadata in `public/game/art.js`. This affects presentation only; battle sprites and gameplay dimensions are unchanged. No external assets were added.

## v23.0 redesign-05 portrait cleanup
Procedural character art is unchanged in combat. Deck-builder and card-library portrait rendering suppresses only the horizontal team ownership band; no external assets were added.

## v23.0 redesign-06 crusher ogre face pass
No external assets were added. Crusher Ogre remains an original procedural Canvas drawing in `public/game/art.js`, updated with a hannya-inspired facial design for stronger character readability.

## v23.0 redesign-07 ranbos family head pass
No external assets were added. Dosranboss and Ranbos remain original procedural Canvas drawings in `public/game/art.js`, updated to better match the provided blue/orange raptor-head reference while staying readable at game size.

## v23.0 redesign-08 ranbos crest refinement
No external assets were added. Dosranboss and Ranbos remain original procedural Canvas drawings in `public/game/art.js`, refined to use a slimmer face and a single head crest.

## v23.0 redesign-09 dos/ran reference style pass
No external assets were added. Dosranboss and Ranbos remain original procedural Canvas drawings in `public/game/art.js`, restyled toward the provided simplified blue/orange dinosaur reference.

## v23.0 redesign-10 beak-and-crest refinement
No external assets were added. Dosranboss and Ranbos remain original procedural Canvas drawings in `public/game/art.js`, refined with a yellow beak-like mouth and a longer rear crest.

## v23.0 redesign-11 front-beak refinement
No external assets were added. Dosranboss and Ranbos remain original procedural Canvas drawings in `public/game/art.js`, refined so the yellow beak-like shape attaches to the front of the face rather than below it.

## v23.0 redesign-12 beak raise and turtle retaliation
No external assets were added. Dosranboss and Ranbos remain original procedural Canvas drawings in `public/game/art.js`, with the beak moved higher. Siege Turtle gained a new melee-only retaliation passive implemented in `public/game/engine.js`, plus a small combat effect in `public/game/art.js`.
## v24.0.0 Mini Berserker / Mega Knight
No external art assets were added. Both new characters are original procedural Canvas drawings in `public/game/art.js`. Mini Berserker uses an oversized head and raised sword silhouette; Mega Knight uses a massive armored body with two black iron balls, plus drop/jump telegraphs and impact effects.

## v24.1.0 Mega Knight flight readability
No external assets were added. Mega Knight remains an original procedural Canvas drawing. The leap now uses a taller airborne arc, wind streaks, a persistent landing marker and a curved trajectory guide; gameplay leap travel is fixed at 1.5 seconds.
