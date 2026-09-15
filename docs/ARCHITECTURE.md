# TINY SIEGE v25.1.0 architecture

CPU練習、Nodeローカルサーバー、Cloudflare Durable Objects は同じ `public/game/engine.js` を共有します。v25.1 は **48カード（43ユニットカード＋5呪文）**、8枚デッキ、4枚手札、`physicsVersion=31` です。

## V25.1 drag-deck UI
- Deck editing remains a client-only UI concern; combat state and `physicsVersion=31` are unchanged.
- Pointer input starts as a normal click candidate. Mouse movement of about 10px promotes it to a drag; touch must first remain down for about 0.18s before movement can promote it.
- Card-pool drops onto a full slot replace that slot, drops while the deck has room insert/add, and dragging an already-selected card or a deck slot reorders the current deck without duplicates.
- A fixed-position drag ghost and slot highlight are purely visual and never alter the saved deck until pointer release over a valid slot.

## V25 Hunter's Mark mechanics

### Iron Eye / 鉄の目
- 4コスト / HP750 / 攻撃125 / 射程160 / 速度45 / 攻撃間隔1.3秒。地上・空中へ通常矢を撃てます。
- 通常矢または一度きりの回転突進で `ironMarked` を付与。付与した陣営から受けるダメージを20%増加し、実ダメージ累計500で解除して300の追加ダメージ。
- 地上敵が約78pxまで接近すると、その個体につき一度だけ120pxの貫通回転突進。交差した地上敵へ180ダメージ、マーク、2.5秒の30%移動低下。

### Tracker / 追跡者
- 6コスト / HP1900 / 攻撃220 / 速度45 / 攻撃間隔1.4秒の地上近接。
- 射程180、構え0.6秒、再使用4秒のフック。地上敵は近接距離まで引き寄せます。
- 空中敵も引き寄せられ、フックしたその対象だけ2秒間攻撃可能。建物へフックした場合は建物を動かさず、追跡者自身が近接距離へ移動します。

## V24 Heavy Drop mechanics

### Mini Berserker
- 4コスト / HP1300 / 攻撃270 / 速度52 / 攻撃間隔1.45秒の高速単体近接。
- 特殊状態は持たず、通常の攻撃コミット後ターゲットロックを利用します。

### Mega Knight
- 7コスト / HP2400 / 攻撃280 / 半径48の近接範囲攻撃。
- `summonDelay=1.5`。召喚完了時に `dropDamage=420`, `dropRadius=48` の落下範囲攻撃を発生。
- 対象が中心距離80～160に入ると `megaJumpState=windup` へ移行し2秒停止。初回交戦前だけ、溜め中により近い敵が出現すると `megaJumpTarget` を更新しますが、残り時間はリセットしません。
- 2秒完了後は `megaJumpState=leap`。対象を `targetLock` へ固定し、飛行開始後は新しい敵へ切り替えません。着地時は420 / 半径48。
- ジャンプCTは持たず、同じロック対象が再び80～160へ離れれば、新しい2秒溜めを開始できます。

## V23 authoritative siege mechanics

### Sky Bomber
- `buildingOnly=true`, `air=true`。通常ユニットを無視し、最寄りの敵構造物を継続再判定します。
- 射程75から `sky_bomb` を投下し、1.6秒ごとに175ダメージ。
- 飛行ユニットなので地上しか狙えない兵からは攻撃対象になりません。

### Scrap Drill
- 建物へ接触すると通常の単発攻撃ではなく連続DPSへ切り替えます。
- 同一建物へ張り付いた時間で `drillDpsStages=[90,135,180,240]` を1.5秒ごとに進めます。
- 射程外、対象変更、スタンで `drillTarget`, `drillLockTime`, `drillStage`, `drillDps` を初期化します。

### Crusher Ogre
- 建物限定、攻撃間隔3.0秒。
- 同一建物への命中回数で `crusherDamages=[230,310,390,470]` を進め、470で上限。
- 対象変更、射程外、スタンで `crusherStage=0` へ戻します。

### Siege Turtle
- 建物へ移動中 (`moving=true`) のみ、`meta.ranged=true` かつスペルでないダメージを40%軽減します。
- 通常遠距離弾、タワー射撃、レーザーが対象。近接、スペル、毒・泥・サイクロン等の継続ダメージは軽減しません。
- 建物へ到着して攻撃中は移動していないため甲羅軽減は自動的に解除されます。

### Bomb Carrier
- 建物限定の高速自爆兵。構造物へ到達すると480ダメージを与え、自身を破壊します。
- 到達自爆時は `suicide-hit` のみ。途中で敵に倒された場合だけ半径55の敵ユニットへ80ダメージの `carrier-blast` を発生させます。
- 死亡爆発はタワー・設置物を対象にしません。

## Existing synchronized mechanics

- V22: Shield Knightの正面盾、Wind Mage/Gravity Orb/Cycloneの重量別位置操作、Phoenix復活、Mirageステルスを維持。
- スタン中は通常攻撃クールタイム `cd` を減算せず、解除後に残り時間から再開。スパーキー充電、レーザー増幅、ナイトシェイド突進など固有リセットは維持。
- Laser Tower / Laser Dragon は20 DPS開始、同一対象へ1.5秒ごとに倍化し、対象変更・射程外・スタンで初期化。
- 直接配置ユニットはコスト別召喚ディレイ中 `targetable=false` / `collisionDisabled=true` / ダメージ無効。

## Snapshot / compatibility

`viewMatch()` は既存状態に加えて V23 の攻城状態、およびV24.1の `megaJumpState`, `megaJumpProgress`, `megaJumpWindupRemaining`, `megaJumpTargetX/Y`, `megaJumpStartX/Y`, `megaJumpEndX/Y` を同期します。V24.1ではジャンプ移動を固定1.5秒・固定着地点へ変更したため `physicsVersion=30`。V25.0では鉄の目と追跡者の同期状態追加により `physicsVersion=31`。オンライン対戦ではクライアントとWorkerを同じV25.0へ揃えてください。

更新説明はルートの `UPDATE-HISTORY.html` 1枚だけを維持します。

## v25 combat state
`viewMatch()` now also synchronizes Iron Eye mark/spin state (`ironMarked`, `ironMarkProgress`, `ironSpinUsed`, `ironSpinState`, `ironSpinProgress`) and Tracker hook state (`hookState`, `hookProgress`, `hookCooldownRemaining`, `hookTargetX/Y`, `hookAirAttackRemaining`). These authoritative states require `physicsVersion=31`.
