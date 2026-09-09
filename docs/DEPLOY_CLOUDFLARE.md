# Cloudflare deploy - v15

1. `Rin447/tiny-siege` にv15フォルダの中身を上書きアップロードします。
2. `main` に Commit します（例: `Upgrade Tiny Siege to v15.0.0`）。
3. CloudflareのBuild/Deploy成功を待ちます。
4. `/api/config` で `version: 15.0.0`, `cards: 24`, `units: 21`, `spells: 3`, `physicsVersion: 13`, `maxDeck: 8` を確認します。
5. 旧進行中ルームは使わず、新しいPASSを作ります。
