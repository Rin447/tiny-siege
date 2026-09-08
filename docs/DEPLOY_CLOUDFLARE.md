# TINY SIEGE v5 - Cloudflare更新手順

既存の `tiny-siege` Workerをそのまま更新します。新しいWorkerは作りません。

1. `tiny-siege-cloudflare-v5.zip` を展開。
2. GitHubの `Rin447/tiny-siege` を開き、**展開した外側フォルダではなく中身全部**をルートへ上書きUpload。
3. `main` へCommit。例: `Upgrade Tiny Siege to v5.0.0`
4. Cloudflare `Workers & Pages > tiny-siege > Deployments` で最新Buildが緑のチェックになるまで待つ。
5. `/api/config` を開き、以下を確認。
   - `version`: `5.0.0`
   - `units`: `15`
   - `physicsVersion`: `3`
   - `maxDeck`: `6`
6. 両クライアントで `Ctrl + F5`。
7. 更新前の進行中試合ではなく、新しい6桁PASSの部屋でテスト。

Cloudflare側の既存設定は、Build command空欄 / Deploy command `npx wrangler deploy` / Root directory `/` のままで構いません。
