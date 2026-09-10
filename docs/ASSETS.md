# Original procedural art, v17.0

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
