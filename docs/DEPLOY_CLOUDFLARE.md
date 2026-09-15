# Cloudflare deploy - v25.1.0

1. GitHub の TINY SIEGE リポジトリへ、このフォルダの中身をそのまま上書きアップロードします。
2. `main` に Commit（例: `Update Tiny Siege Drag Deck to v25.1.0`）。
3. Cloudflare の自動 Build / Deploy を待ちます。
4. `/api/config` で `version: 25.1.0`, `cards: 48`, `units: 43`, `spells: 5`, `physicsVersion: 31`, `maxDeck: 8` を確認します。

## v25.1.0 verification

- デッキ編集で、カード一覧→8枠のドラッグ追加/入れ替えと、8枠同士のドラッグ並べ替えを確認。
- 通常タップ/クリックでは従来どおりカード操作シートが開くことを確認。
- スマホでは短いタップやスクロールと区別するため、約0.18秒長押し後の移動でドラッグ開始。
- カード総数48（43ユニット＋5呪文）。
- `physicsVersion=31` のため、オンライン対戦ではクライアントとWorkerを同じv25.1.0へ揃えてください。
- V24までの既存ユニット挙動も回帰テストで維持します。
- 更新履歴はルートの `UPDATE-HISTORY.html` 1枚に統合しています。バージョンごとのUPDATE HTMLは追加しません。
