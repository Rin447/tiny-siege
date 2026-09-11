# TINY SIEGE v21.0.0 architecture

CPU練習、Nodeローカルサーバー、Cloudflare Durable Objectsは同じ `public/game/engine.js` を共有します。v21.0は33カード（29ユニットカード＋4呪文）、8枚デッキ、4枚手札です。

## v19.4 control / goblin combat changes
- `tigger.structureDamage=70` を追加。通常の対ユニット攻撃は120で、`attack()` が建物ターゲット時だけ専用ダメージを選択します。
- Frost projectile は半径38の splash と3段階 slow metadata を持ちます。同一の鈍足効果が有効中なら `slowStage` を最大3まで加算し、効果時間は命中時から3秒へ更新します。
- Harpy projectile は `stunDuration=1` を持ち、chain の各命中先へ共通 `applyStun()` を適用します。ザップと同じリセット処理を共有します。
- `mossling` は互換用カードIDのまま表示名をゴブリン部隊へ変更。`spawnTypes` により前3体を `goblin_melee`、後2体を `goblin_spear` として生成します。2種はhidden unitなので選択可能カード数は31のままです。
- 更新案内は `UPDATE-HISTORY.html` だけを維持し、バージョン別HTMLは追加しません。
- `physicsVersion=26`。

## v19.3 summon delay system

- 手札から直接配置したユニットはコスト別の召喚準備時間を持ちます（1〜7コスト: 0.4 / 0.5 / 0.7 / 0.9 / 1.2 / 1.5 / 1.8秒）。ストーンゴーレムは2.5秒、スパーキーは1.8秒の個別値です。
- 召喚中は `targetable=false` / `collisionDisabled=true`。移動・攻撃・索敵をせず、通常攻撃・スペル・範囲ダメージを受けず、他ユニットの通行を妨げません。
- 召喚完了時に通常当たり判定へ移行し、召喚士の配置時子分召喚やスパーキー充電を開始します。
- 穴掘りティガーは既存の地下移動を召喚待ち扱いとし、追加待機はありません。能力で生まれる子分や分裂体にも追加待機はありません。
- 設置物は1タップで位置確定後、その場所で建設ゲージを開始します。建設中もターゲット不可・無敵・衝突なしです。
- `viewMatch()` は `deploying`, `deployTotal`, `deployRemaining`, `targetable`, `collisionDisabled` を同期し、描画は陣営色の円・半透明シルエット・進行ゲージを表示します。
- 召喚完了直後の密集安定性を保つため、動的衝突解決を6パスから8パスへ増やしています。


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

## 設置物の1タップ配置

v19.2以降、`building=true` のカードも通常ユニットと同じく、戦場を1回タップした時点で配置地点を確定します。v19.3では確定直後から建設ゲージが始まり、建設中はターゲット不可・無敵・衝突なしです。確認用の2回目タップは使いません。

## 既存システム

- 構造物ターゲットロック：左右タワー、起動済み中央本拠地、ボルト砲台、レーザー塔は対象が死亡・射程外・対象外になるまでロックを維持。
- 穴掘りティガー：`tunnelAnywhere=true`。約0.9〜2.8秒の地下移動中は `targetable=false`。
- レーザー塔：初期DPS20、同じ対象を1.5秒ごとに照射し続けるたび倍化。対象変更で初期化。
- 8枚デッキ / 4枚手札、平均コスト表示、直近7日パッチノートを維持。

## v19.3 compatibility

`physicsVersion=23`。召喚準備中のターゲット可否・ダメージ無効・衝突無効・完了タイミングがオンライン同期対象になったため、v19.2のphysicsVersion 22から更新しています。

## compatibility (historical v18.3)

`physicsVersion=19`。v18.3.0では通常ユニットのロック確定を索敵時から最初の攻撃時へ変更したため18から19へ更新しました。実戦デッキ保存キーは `tiny-deck-v18`、マイリストは `tiny-deck-presets-v18` を使用し、v17以前の保存内容をフォールバック読込して移行できます。

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

### v18.2 mobile target-lock contract (historical; superseded by v18.3)

In v18.2, target selection deliberately separated **combat lock** from **navigation objective**. Ordinary mobile units keep `targetLock` only after an enemy is acquired inside aggro range. A far preferred tower may still be used for navigation, but it is not hard-locked until it enters aggro range. Once locked, a mobile unit follows the same valid target even outside attack/aggro range; death, untargetable state, burrow/reset state, or Zap clears the lock.

`buildingOnly` units are the exception: they never retain `targetLock` and continuously choose the nearest enemy structure by current distance. This permits tactical pulls toward player-built defences or the central core. Defensive structures retain the v13 rule: their `target` is locked only while the target remains valid and inside weapon range.

For v18.2 this changed deterministic battle decisions shared between clients/server, so `PHYSICS_VERSION` was **18**. v18.3 supersedes the acquisition-time lock rule below.


### v18.3 first-attack target-lock contract

Ordinary mobile units distinguish **tracking target** from **committed lock**. Before the first attack, `getTarget` re-evaluates the nearest valid combat target each tick and `targetLock` stays `null`. The first actual attack commits `targetLock`; ranged attacks commit when fired, melee attacks commit when the strike executes, Sparky commits when the charged shot fires, and Nightshade commits when the rush begins. Once committed, the unit follows that target until death, untargetable state, burrow/reset state, or Zap clears the lock. Building-only mobile units never commit a lock and continuously re-evaluate the nearest enemy structure. Defensive structures retain their range-bound structure lock contract. The body solver runs six pair-resolution passes in v18.3 so the more dynamic pre-attack retargeting does not introduce visible enemy-body overlap in congested fights.


## v21.0 Laser Dragon / stun clock
- `laserUnit` extends the existing single-target laser ramp to a mobile flying unit.
- Stunned entities preserve their remaining ordinary attack cooldown; `cd` is not decremented while `stunUntil > game.time`.
- Special stun resets (Sparky charge, laser ramp, Nightshade rush) remain explicit.
