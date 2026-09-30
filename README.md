# TINY SIEGE v46.0.0 — GitHub Ready

GitHubへそのまま登録して、ローカル開発・自動テスト・Cloudflare Workersへのデプロイを行うためのソース一式です。

- Game version: **46.0.0**
- physicsVersion: **83**
- Cards: **83**（71 units/buildings + 12 spells）
- Runtime: **Node.js 22+**
- Hosting: **Cloudflare Workers + Static Assets + Durable Objects**

## このZIPの方針

v38のZIPには、過去バージョン用ブラウザテスト、プレビュー画像、コンセプト画像、配布用HTML、Windows専用BATなどが多数含まれていました。v46のGitHubリポジトリでは、それらを無条件にコピーせず、**現在のv46を開発・検証・デプロイするために必要なファイルだけ**を残しています。

`public/index.html` が現在のクライアント側の正本です。戦闘の決定論的コアは `scripts/sync-game-core.mjs` により `src/game-core.js` へ同期され、Cloudflare Workerとローカルサーバーが同じ戦闘ルールを利用します。

## リポジトリ構成

```text
.
├─ .github/workflows/ci.yml       GitHub Actions
├─ public/
│  ├─ index.html                  現行クライアント本体
│  └─ _headers                    Cloudflare static headers
├─ src/
│  ├─ game-core.js                index.htmlから同期される権威戦闘コア
│  ├─ room-model.js               2人対戦ルーム状態
│  └─ worker.js                   Cloudflare Worker / Durable Object
├─ server/dev.mjs                 Node.jsローカルサーバー
├─ scripts/
│  ├─ sync-game-core.mjs          戦闘コア同期
│  ├─ check.mjs                   構文・設定・現行カード検証
│  └─ build-offline.mjs           必要時だけオフラインHTML生成
├─ tests/
│  ├─ release.test.mjs            v46カード/バージョン検証
│  ├─ room.test.mjs               ルーム/再接続/開始条件
│  ├─ worker.test.mjs             Worker API検証
│  ├─ repository.test.mjs         GitHub必須ファイル検証
│  └─ network.mjs                 実HTTP/WebSocketスモークテスト
├─ docs/                          現行アーキテクチャ・デプロイ資料
├─ package.json
├─ wrangler.jsonc
└─ .gitignore
```

## セットアップ

```bash
npm install
npm run ci
npm start
```

`npm start` 後に `http://localhost:3000` を開きます。

Cloudflareのローカル環境を使う場合:

```bash
npm run dev
```

## Cloudflareへデプロイ

初回のみ:

```bash
npx wrangler login
```

その後:

```bash
npm run deploy
```

`predeploy` で `npm run check` が実行され、`public/index.html` から `src/game-core.js` を再同期してからデプロイします。

GitHubとCloudflareを連携して自動デプロイする場合も、リポジトリルートはこのままで使用できます。Worker entry point は `src/worker.js`、Static Assets は `public/` です。

## テスト

```bash
npm run check
npm test
npm run test:network
```

まとめて実行:

```bash
npm run ci
```

GitHub Actionsでも push / pull request ごとに同じCIを実行します。

## v46主要仕様

- Hunter: 4 cost / HP884 / 84×10 pellets / 2.2s / attack acquisition 4 cells / pellet reach 6.5 cells / ground+air.
- Rocket: 6 cost / radius 2 cells / 1484 damage to units and placed buildings / 343 to side/core towers / immediate Core launch.
- Rolling Wood speed 165 / Rolling Barbarian speed 140.
- Spell damage rule: **player-placed buildings receive normal spell damage; only side/core towers use reduced tower damage**.
- Goblin Hut: immediate Spear Goblin on enemy acquisition, then 2.2s cycle, plus one on destruction.

## GitHub版から意図的に除外したもの

以下はv38には含まれていましたが、現行GitHubソースには不要なので含めていません。

- `PLAY-OFFLINE.html` — `npm run build:offline` で生成可能
- `DEPLOY-GUIDE.html`, `UPDATE-HISTORY.html` — README/docsと内容が重複
- `01/02/03-*.bat`, `START-*.bat` — GitHub/CI/Cloudflare実行には不要
- `docs/previews-*`, `docs/concepts/*` — 過去版スクリーンショット/参考画像
- `tests/browser-v16-*.py` など — 過去バージョン専用テスト
- `tests/v37-*.test.mjs`, `tests/v38-*.test.mjs` — 過去リリース固定テスト
- v38の `public/app.js`, `public/styles.css`, `public/game/*.js` — **v46では `public/index.html` + `src/game-core.js` の現行構成へ統合済み**

これらを削除しても、v46のGitHub開発・CI・ローカル対戦・Cloudflareデプロイに必要な機能は失われません。
