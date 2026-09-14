# TINY SIEGE v23.5.0

Cloudflare Workers + Durable Objects で動くオリジナル2Dレーンバトラーです。**44枚（39ユニット＋5呪文）から8枚**を選びます。

## v23.5.0 - ARCHER / BERSERKER ART REBUILD

- **リーフ弓兵**を、今回作成した緑フード・矢筒・木弓の高精細ピクセルアートへ更新。
- **クラッグバーサーカー**を、赤髪・毛皮・双斧の重量戦士ピクセルアートへ更新。
- 2体とも `IDLE / MOVE / ATTACK` × `FRONT / BACK` × 4フレーム。
- 前後方向は戦場の進行方向から自動選択、横方向は左右反転。
- 戦闘性能は変更なし。44カード、`physicsVersion=28` を維持。
- `PLAY-OFFLINE.html` は全スプライトPNGをData URL埋め込み済みの単一HTML。

## v23.4.0 - RUNE / FROST SPRITE UPDATE

- ルーン術師 / フロストシャーマンを前姿・後姿対応のピクセルスプライトへ移行。
- 各キャラは `IDLE / MOVE / ATTACK` × `FRONT / BACK` × 4フレーム。

## v23.3.0 - ARCHER / BERSERKER SPRITE UPDATE

- リーフ弓兵 / クラッグバーサーカーを方向対応スプライト方式へ移行。
- v23.5.0 で今回作成した高精細ドット絵へアートを再構築。

## v23.2.0 - FRONT / BACK SPRITE UPDATE

- スカイボマー / クラッシャーオーガのピクセルスプライトを前姿・後姿の2方向へ拡張。

## 既存の重要仕様

- **スタン**: 通常攻撃クールタイムをリセットせず、スタン中だけ進行停止。解除後に残り時間から再開。
- **レーザードラゴン / レーザー塔**: 同じ対象へ1.5秒照射するごとに 20 → 40 → 80 → 160... DPS と倍化。
- **召喚ディレイ**: コスト別の召喚準備時間。召喚中はターゲット不可・無敵・衝突なし。
- **更新履歴HTML**: `UPDATE-HISTORY.html` 1枚へ追記します。

## ローカル / Cloudflare

- `START-PRACTICE-WINDOWS.bat`: オフライン練習
- `START-LOCAL-WINDOWS.bat`: Nodeローカルサーバー
- `01-SETUP-CLOUDFLARE.bat` / `02-LOGIN-CLOUDFLARE.bat` / `03-DEPLOY-CLOUDFLARE.bat`: Cloudflare用
- `PLAY-OFFLINE.html`: 依存なしの1枚HTML版

この配布物は BAT / `package.json` / `wrangler.jsonc` / `src` / `server` / `scripts` / `tests` / `public/game` / `public/assets/sprites` を含む完全版です。
