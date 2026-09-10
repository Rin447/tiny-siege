# TINY SIEGE v18.0 architecture

CPU練習、Nodeローカルサーバー、Cloudflare Durable Objectsは同じ `public/game/engine.js` を共有します。v18は30カード（26ユニットカード＋4呪文）、8枚デッキ、4枚手札です。


## v16.1 spell ownership rendering

`public/game/art.js` owns the viewer-relative spell palette. `spellTeamStyle(owner, seat)` maps the caster to blue/solid when `owner === seat`, otherwise red/dashed. Fireball, Arrow Rain and Poison Trap all use this shared helper, so seat 0 and seat 1 each see their own spell as blue. The simulation owner IDs remain unchanged. `viewMatch()` also exposes `poisonOwner` only for rendering the lingering poison marker.

Patch-note data remains release-specific (`16.1.0`, `16.0.0`, etc.), while `renderPatchNotes()` groups recent entries by the major component for display.

## v16.0 balance

### マッドドラゴン
- コスト5 / HP **1600** / 攻撃200 / 射程78。
- 空中ユニットで地上・空中を攻撃可能。着弾範囲は半径45。
- 着弾点に2秒間の `mud` zone を生成。
- mudは地上の非建物ユニットだけに0.5秒ごと30ダメージと移動速度0.70倍を適用し、重複加算しません。

### 吹き矢ゴブリン
- 3コスト / HP240 / 攻撃110 / 0.5秒間隔 / 射程 **195**。
- `targetsAir=true` で地上・空中の両方を狙います。
- サイドタワーは射程226、半径32、吹き矢ゴブリン半径12。実効攻撃境界は吹き矢側 `195+32=227`、タワー側 `226+12=238` となり、吹き矢がタワーを攻撃可能な距離ではタワー側も反撃可能です。

## スマホ設置物の2タップ状態

UI側の `hover` はカーソル/指位置の一時プレビュー専用です。v16では別に `pendingBuildingPlacement` を持ちます。

- `building=true` のカードをタッチ操作した1回目：`{card,x,y,valid}` を `pendingBuildingPlacement` に保存。
- `pointerleave` / 指を離す操作では `hover` だけを消し、`pendingBuildingPlacement` は消しません。
- 次のタップが同じカードかつ保存位置から24px以内なら、保存した候補地点で設置を確定します。
- 24pxより離れた場所なら新しい候補位置へ更新し、まだ設置しません。
- 別カード選択、カード消費、画面離脱、試合終了/手札離脱、設置成功時に候補状態をクリアします。
- 描画時は `hover` がなければ保存済み候補位置を `ghost` として使うため、指を離した後も射程円が残ります。
- 同じ仕組みはボルト砲台、レーザー塔、今後の `building=true` カードへ共通適用されます。

## 既存システム

- 構造物ターゲットロック：左右タワー、起動済み中央本拠地、ボルト砲台、レーザー塔は対象が死亡・射程外・対象外になるまでロックを維持。
- 穴掘りティガー：`tunnelAnywhere=true`。約0.9〜2.8秒の地下移動中は `targetable=false`。
- レーザー塔：初期DPS20、同じ対象を1.5秒ごとに照射し続けるたび倍化。対象変更で初期化。
- 8枚デッキ / 4枚手札、平均コスト表示、直近7日パッチノートを維持。

## compatibility

`physicsVersion=17`。v18.0.0ではザップのスタン/攻撃対象リセットとスパーキーの常時充電/充電リセットがauthoritativeな戦闘状態へ追加されたため16から17へ更新しました。実戦デッキ保存キーは `tiny-deck-v18`、マイリストは `tiny-deck-presets-v18` を使用し、v17以前の保存内容をフォールバック読込して移行できます。

## v18.0 long-range / stun / charge mechanics

- Princess Archer is cost 3 / HP 300 / damage 275 / cooldown 3.0 / range 350 / splash radius 70. She targets ground and air, and her range is intentionally long enough to attack an enemy side tower before crossing the river.
- Zap is a cost-2 instant spell with radius 78, 225 unit/building damage and a 1.5 second stun. `applyStun()` clears the current target, resets Laser Tower ramping, and resets Sparky charge. After stun ends, normal target selection runs again.
- Sparky is cost 6 / HP 1500 / ground-only / damage 1200 / range 145 / splash radius 90. `sparkChargeStartAt` begins at deployment time even with no target. At 3.5 seconds it becomes `sparkCharged=true` and waits ready until a valid target enters range. Firing restarts the charge. Zap resets progress to zero and delays the new charge start until stun ends.
- `viewMatch()` exposes Sparky charge and stun metadata used only for synchronized rendering; authoritative timers remain in the engine.
- Rune Mage costs 3, Leaf Archer costs 2, and Kragg Berserker attack cooldown is 1.8 seconds.
- Active deck storage writes `tiny-deck-v18` with v17 and older fallback. My List writes `tiny-deck-presets-v18` and can migrate v17/v16 presets.

## v16.2 deck builder UI

v16.2.0 keeps the authoritative battle simulation unchanged and adds client-side deck-builder state only.

- The active battle deck remains stored under `tiny-deck-v16`.
- My List presets are stored separately under `tiny-deck-presets-v16` as named arrays of exactly eight valid card IDs; invalid or obsolete presets are ignored on load.
- The deck pool is always rendered as three CSS grid columns. Responsive CSS changes card dimensions rather than the number of columns.
- A card click opens `deckCardActions`; no deck mutation occurs until the user explicitly chooses add/remove.
- Full-deck additions use the replacement picker so the deck remains exactly eight cards.
- `cardDetailPanel` is optional and uses the existing procedural portrait renderer plus a lightweight Canvas demo renderer. There are no downloaded or embedded character video assets.
- `.deck-sticky` keeps the selected eight-card roster visible while the modal scrolls.
- These changes do not alter engine state or network snapshots, so `physicsVersion=14` is unchanged.


## v16.3 My List persistence
`tiny-deck-presets-v16` is kept as the stable v16 key. The loader accepts both the v16.2 legacy array and the v16.3 `{schema, version, presets}` envelope. Writes are read-back verified in localStorage, then fall back to sessionStorage; if storage is unavailable entirely, the current page retains the preset in memory and labels it temporary.

## v16.3 card detail live demo
Card details no longer use a separate hand-authored animation. They create a small controlled match and reuse the same `createMatch`, `deploy`, `tick`, `viewMatch`, and `drawArena` pipeline as normal play. Demo-only code chooses which real cards are deployed and where; combat stats, targeting, projectiles, zones, movement, tower logic and art stay authoritative in the normal engine/render modules.

### v18.1 detail-demo render resilience

`drawArena()` resets the Canvas transform to identity at the start of every frame. Generic projectile drawing also wraps its local `save()` in `try/finally` so `restore()` runs even when an effect throws. The Sparky `sparkblast` effect uses the function's `time` argument rather than an undefined local animation variable. This prevents a failed detail-demo frame from leaving a rotated/scaled transform that contaminates later frames or other card details.


## v16.4 balance and ability-focused live demos
- Hole-digger Tigger keeps cost 3 / HP 1100 / burrow timing, but attack is 20 instead of 15.
- Moon Bat keeps per-bat HP 145 / attack 46 / cost 2, but `count=4` instead of 3.
- Because these are authoritative battle-state changes, `physicsVersion=15`.
- Card-detail demos still use the production `createMatch`, `deploy`, `tick`, `viewMatch`, and `drawArena` pipeline. Demo-only staging changes starting positions/HP/cooldowns so a special ability is guaranteed to become visible quickly.
- Golem scenario: a real Golem is staged at low HP in front of the enemy side tower, with a real enemy Bone Swarm around it. The production death handler creates the 180-radius blast damage and two Mini Golems.
- Mud Dragon scenario: a real high-HP Iron Guard is placed inside practical attack distance. The production mud projectile creates the real 2-second mud zone, applies the 0.70 movement factor, and ticks 30 damage.
- Other special-card scenarios explicitly exercise burrow, ramping laser, healing, chain lightning, dual frost slow, Nightshade rush, Boar charge/shove and spell areas.
- The scenario itself does not fake combat results: stats, targeting, projectiles, damage, statuses and effects are still produced by the normal engine.


## v17.0 summon system and new cards
- `physicsVersion=16`. The new summoning system changes authoritative battle state and network snapshots.
- Necromancer uses `summonType="boneswarm"`, `summonCount=3`, `summonInterval=6`, `summonOnDeploy=true`. It has cost 6, HP 1350, damage 125, range 158, cooldown 1.4, splash 54 and can target ground/air.
- Dark Necromancer uses `summonType="bat"`, `summonCount=2`, `summonInterval=5`, `summonOnDeploy=true`. It has cost 5, HP 1150, damage 165, range 145, cooldown 1.3 and targets ground only.
- Deployment immediately invokes the shared summoning routine; `summonNextAt` is initialized from the original placement time, so the second wave arrives exactly 6/5 simulation seconds after placement rather than after the spawn animation.
- `canPlace()` reserves the summoner plus its full guaranteed first wave against `ARENA.maxUnits`. Later periodic waves use available capacity and never exceed the cap.
- Summoned Bones and Moon Bats are real `makeUnit()` instances of the existing units and therefore inherit normal targeting, collision layers, stats and rendering.
- Ash Squad is one selectable card with `spawnType="blade"` and `count=3`. The existing three-unit spawn geometry produces one front and two rear units, mirrored automatically for each owner; battle units are ordinary Ash Swordsmen.
- `viewMatch()` exposes summon countdown metadata for rendering/inspection without changing the simulation source of truth.
- Card detail demos still use the production engine. Demo-only setup controls starting locations/opponents so the immediate wave and next timed wave are visible; summon events are captured per engine tick to remain reliable even when a slow device needs catch-up ticks.
- Active deck storage now writes `tiny-deck-v17` and falls back through v16 and older keys. My List writes `tiny-deck-presets-v17` and accepts `tiny-deck-presets-v16` as a migration source.
