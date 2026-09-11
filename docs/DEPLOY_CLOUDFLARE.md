# Cloudflare deploy - v21.0.0

1. GitHub の TINY SIEGE リポジトリへ、このフォルダの中身をそのまま上書きアップロードします。
2. `main` に Commit（例: `Update Tiny Siege laser dragon to v21.0.0`）。
3. Cloudflare の自動 Build / Deploy を待ちます。
4. `/api/config` で `version: 21.0.0`, `cards: 33`, `units: 29`, `spells: 4`, `physicsVersion: 26`, `maxDeck: 8` を確認します。

## v21.0.0 verification

- レーザードラゴン: 5コスト / HP1300 / 飛行 / 地上・空中 / 速度46 / 射程145。
- レーザー増幅: 20 DPS開始、同一対象へ1.5秒ごとに2倍。対象変更・射程外・スタンでリセット。
- スタン中は通常攻撃クールタイムを停止し、解除後に残り時間から再開。タワー・設置物も同様。
- `physicsVersion=26` のため、オンライン対戦ではクライアントとWorkerを同じv21.0.0へ揃えてください。
- 更新履歴はルートの `UPDATE-HISTORY.html` 1枚に統合しています。バージョンごとのUPDATE HTMLは追加しません。
