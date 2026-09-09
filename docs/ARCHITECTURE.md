# TINY SIEGE v15 architecture

CPU練習、Nodeローカルサーバー、Cloudflare Durable Objectsは同じ `public/game/engine.js` を共有します。v15は24カード（21ユニット＋3呪文）、8枚デッキ、4枚手札です。

## 穴掘りティガー

- `tunnelAnywhere=true` のカードだけ通常の前線配置制限を無視します。
- 地上の有効地点を指定し、自軍中央本拠地から約0.9〜2.8秒かけて地下移動します。
- `burrowState=burrow` 中は `targetable=false`、物理衝突解決からも除外され、`damage()` も無効です。
- v15で攻撃力は15へ低下。到着時に通常の地上ユニットへ復帰します。

## マッドドラゴン

- 空中ユニットで地上・空中を攻撃可能。攻撃射程は78、着弾範囲は半径45。
- 着弾点に2秒間の `mud` zone を生成。
- mudは地上の非建物ユニットだけに0.5秒ごと30ダメージと移動速度0.70倍を適用し、重複加算しません。

## 吹き矢ゴブリン

- 3コスト / HP240 / 攻撃110 / 0.5秒間隔 / 射程220。
- `targetsAir=true` で地上・空中の両方を狙います。
- 低HPと引き換えに、橋を越えた直後からサイドタワーへ圧をかけられる超長射程です。

## レーザー塔

- `building=true`, `laserTower=true` の防衛建物。HP2000、射程220、地上・空中対応。
- 構造物ターゲットロックを共有し、同じ対象を狙う時間 `laserLockTime` を保持します。
- 初期DPS20。`laserRampEvery=1.5` 秒ごとに `laserMultiplier=2` で倍化し、上限は設けません。
- 対象が死亡・射程外・対象外となり再選定された瞬間に `laserStage=0`, `laserDps=20` へリセットします。

## compatibility

`physicsVersion=13`。旧バージョンの進行中ゲームは再開しません。デッキ保存キーは `tiny-deck-v15`、v14以前をフォールバック読込します。
