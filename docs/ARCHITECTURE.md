# TINY SIEGE v23.5.0 architecture

CPU練習、Nodeローカルサーバー、Cloudflare Durable Objects は同じ `public/game/engine.js` を共有します。v23.5 は **44カード（39ユニットカード＋5呪文）**、8枚デッキ、4枚手札、`physicsVersion=28` です。

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

`viewMatch()` は既存状態に加えて V23 の `drillStage`, `drillDps`, `drillLockTime`, `crusherStage`, `turtleShellActive` を同期します。V23の攻城挙動は対戦結果へ影響するため `physicsVersion=28`。オンライン対戦ではクライアントとWorkerを同じV23へ揃えてください。

更新説明はルートの `UPDATE-HISTORY.html` 1枚だけを維持します。


### v23.2 directional sprite rendering

Sky Bomber and Crusher Ogre are rendered from directional PNG sprite sheets. Each sheet uses 160px cells, four columns and six rows: front `idle/move/attack` followed by rear `idle/move/attack`. `art.js` combines the existing viewer-relative `back` flag with battle state to select the row, while horizontal orientation continues to use mirroring. Online mode loads `/assets/sprites/*.png`; the offline builder injects the same assets as Data URLs. No authoritative gameplay state changed, so physicsVersion remains 28.

### v23.4 rune / frost sprite rendering
- `public/assets/sprites/archer.png` / `berserker.png` / `mage.png` / `frost.png` を追加。
- すべて640x960、160pxセル、4列×6行。行は FRONT(IDLE/MOVE/ATTACK) → BACK(IDLE/MOVE/ATTACK)。
- `art.js` の共通 `drawPixelSprite` が進行方向から `front/back` を選択し、状態から行、時間/歩行/攻撃進行からフレームを選択する。
- 画像読み込み失敗時は既存プロシージャル描画へフォールバック。
- `build-offline.mjs` は6枚のPNGをData URL化して `PLAY-OFFLINE.html` に埋め込む。

### v23.5 archer / berserker art rebuild
`archer.png` と `berserker.png` は、今回生成した前後方向の高精細ドット絵を既存の4列x6行スプライト契約へ変換して使用します。ゲームロジックは変更せず、`drawPixelSprite()` の direction/state/frame 選択をそのまま利用します。
