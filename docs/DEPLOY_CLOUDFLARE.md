# Cloudflare deploy - v18.1.0

1. `Rin447/tiny-siege` にv18.1.0フォルダの中身を上書きアップロードします。
2. `main` に Commit（例: `Fix Tiny Siege detail demo rendering in v18.1.0`）。
3. Cloudflareの自動Build/Deploy完了を待ちます。
4. `/api/config` で `version: 18.1.0`, `cards: 30`, `units: 26`, `spells: 4`, `physicsVersion: 17`, `maxDeck: 8` を確認します。

v18.1.0はカード詳細LIVE BATTLE DEMOの描画不具合だけを修正するリリースです。対戦ロジックは変更していないため `physicsVersion=17` を維持します。公開後はブラウザを強制再読み込みし、スパーキー詳細デモを最後まで再生→別キャラ詳細へ移動して描画が崩れないことを確認してください。
