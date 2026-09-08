# TINY SIEGE v2.0.0　更新ガイド

後ろ姿・建物回避・地上／空中の当たり判定を追加した版です。

**公開中のサイトは、こちらから変更していません。ウェーブレングス用の janken-game / dark-mode-0e8f には上書きしないでください。**

## まずは公開せずに試す

PLAY-OFFLINE.html を保存し、Edge や Chrome で開きます。名前を入力し「CPUと対戦する」を押してください。インストール不要のCPU専用版です。

## 今回の変更

- **後ろ姿と向き**: 7種類の移動ユニットに背面を追加。進行・攻撃方向で前後を切り替え、砲台は攻撃目標へ砲身を回します。
- **地上／空中**: 地上と空中は別の当たり判定。同じ高度の敵味方は接触し、飛行は地上の建物・部隊を通過します。
- **建物の回り込み**: 地上部隊は生存中のタワー・砲台を回避。破壊された建物は通行可能です。
- **体格・重さ**: 半径と重さを反映。衛士は大きく押されにくい。小型は通れる隙間が広くなります。
- **重なり表示**: タワーと地上部隊を足元の奥行きで並べて描画。空中は地上より上に描画します。
- **確認用UI**: 部隊図鑑の「後ろ姿を見る」と、戦場の「当たり判定を表示」を追加しました。

## 既存のTINY SIEGEを更新する

1. ZIPを右クリックし「すべて展開」。package.json が見える階層まで開きます。
2. GitHubでTINY SIEGE用リポジトリ（前回の案内どおりなら tiny-siege）を開き、Add file > Upload files を選択します。
3. 展開したフォルダの「中身全部」を上書きアップロードします。public、src、server、scripts、tests、docsは、それぞれフォルダのまま入れてください。
4. Commit directly to the main branch を選び、Commit changes で保存します。例: Upgrade Tiny Siege to v2.0.0
5. Cloudflare > Workers & Pages > tiny-siege > Deployments でビルド成功とActive deploymentの更新を確認します。現在のWorkerの削除や、新規Workerの作成は不要です。
6. 全員がゲームを Ctrl + F5 で再読み込みし、新しいルームで確認します。更新中の対戦は継続せず、再戦してください。

```text
tiny-siege (repository root)
  package.json
  wrangler.jsonc
  public/
    game/units.js
    game/engine.js
    game/physics.js  <-- NEW: required for both CPU and online
    game/art.js
    app.js
    index.html
    styles.css
  src/
  server/
  scripts/
  tests/
  docs/
  PLAY-OFFLINE.html
  UPDATE-TO-V2.html
```

アップロード時に /public/game/physics.js のように表示されるのは正常です。外側の tiny-siege-cloudflare-v2 フォルダをさらに1階層入れないようにしてください。

Worker名 tiny-siege、BATTLES、BattleRoom、既存のマイグレーション tiny-siege-v1 は維持しています。手動で別名に変更している場合は、wrangler.jsonc の name を実際のWorker名と一致させてください。

| Setting | Value |
|---|---|
| Worker name | tiny-siege |
| Production branch | main |
| Build command | (empty) |
| Deploy command | npx wrangler deploy |
| Root directory | / |

## まだTINY SIEGEを公開していない場合

GitHubに tiny-siege を新規作成し、今回の中身を一番上の階層へ保存します。Cloudflareの Workers & Pages > Create application > Import a repository から接続します。ウェーブレングスとは別に作成してください。

## 公開後の確認

ゲームURLの末尾に /api/config を付けて開き、次の値を確認します。APIが返るだけで全対戦機能の検証完了ではないので、2人で実際に配置・移動・攻撃・再戦まで試してください。

```json
{
  "game": "tiny-siege",
  "version": "2.0.0",
  "units": 8,
  "physicsVersion": 2
}
```

## 仕様上の注意

地上の味方は軽い押し合いのため、表示した判定円が少し重なることがあります。中心をすり抜ける動きは防ぎ、周囲から追い越すことはできます。

前衛が必ず敵の攻撃を引き付ける仕様ではありません。矢・魔法・砲弾は味方や建物で遮られません。

建物の後ろに配置したときの遅れは、回り道の距離によるものです。一律の待ち時間や通信ラグではありません。

対空攻撃が可能な弓兵や術師も、移動は地上です。空中レイヤーはムーンバットです。

木や小石は装飾です。リアルな3D物理ではなく、円形の当たり判定と経路探索による2Dシミュレーションです。

混雑時は空いた近傍に出撃位置を調整します。砲台は指定位置からずらさず、重なる場合は配置を拒否します。

## 検証結果と範囲

自動テスト 99件、実HTTP/WebSocketテスト 14項目、ブラウザーUIテスト 27項目が成功しました。詳細は docs/TEST_REPORT.md と各ログを参照してください。

Cloudflare本番、Wrangler/workerd実行環境、Windows・スマホ実機では未検証です。ブラウザーからの直接URLアクセスが制限される環境のため、オンラインUIは通信ブリッジを通して実際のローカルNodeサーバーに接続しています。

## Local commands

```sh
npm start
npm test
npm run check
npm run build:offline
npm run test:network
node tests/stress.mjs
```

Node.js 22+. `npm start` uses no external libraries. Wrangler is a development dependency for Cloudflare deployments.

## Official deployment references

- https://developers.cloudflare.com/workers/ci-cd/builds/
- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
