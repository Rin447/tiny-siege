# TINY SIEGE v3 - Cloudflare更新手順

既存の `tiny-siege` Workerをv3へ更新する場合の手順です。

## GitHub

1. ZIPを展開します。
2. GitHubの `tiny-siege` リポジトリで `Add file` -> `Upload files`。
3. 外側の `tiny-siege-cloudflare-v3` フォルダではなく、その **中身** をまとめてアップロードします。
4. リポジトリ直下に `package.json`, `wrangler.jsonc`, `public`, `src`, `tests` 等が見える状態にします。
5. mainへCommitします。

## Cloudflare Builds

既存接続の設定は次のままで構いません。

- Project / Worker: `tiny-siege`
- Production branch: `main`
- Build command: 空欄
- Deploy command: `npx wrangler deploy`
- Root directory: `/`

Buildが緑のチェックになり、新しいVersionがActive deploymentになるまで待ちます。

## 公開確認

`https://<tiny-siegeのworkers.dev URL>/api/config` を開き、少なくとも以下を確認します。

```json
{
  "game": "tiny-siege",
  "version": "3.0.0",
  "units": 9,
  "physicsVersion": 2,
  "maxDeck": 6
}
```

次にトップページを強制再読み込みし、デッキ画面で9体から6体選べることを確認します。

オンライン確認:

1. プレイヤーAがルーム作成。
2. プレイヤーBが同じPASSで参加。
3. それぞれ別の6体デッキを保存。
4. 両者が準備OK。
5. ホストが開始。
6. 手札が各自の選んだ6体だけで循環することを確認。
7. ストーンゴーレムが敵兵を素通りして建物へ向かい、敵兵からは攻撃を受けることを確認。

古い進行中ルームは使わず、新規ルームで確認してください。
