# Cloudflare deploy - v29.0.0

1. GitHub の TINY SIEGE リポジトリへ、このフォルダの中身をそのまま上書きアップロードします。
2. `main` に Commit（例: `Update Tiny Siege Lightning Necro to v29.0.0`）。
3. Cloudflare の自動 Build / Deploy を待ちます。
4. `/api/config` で `version: 29.0.0`, `cards: 56`, `units: 50`, `spells: 6`, `physicsVersion: 45`, `maxDeck: 8` を確認します。

## v29.0.0 verification
- ネクロマンサー 5コスト / HP839 / 攻撃間隔1.1秒、ダークネクロマンサー 4コスト / HP907 / 攻撃304。
- ポイズンが8秒間、ユニット91/秒・建物21/秒。ファイヤーボール689/159、矢の雨366/75。
- ライトニングが6コスト・半径105で、現在HPが高い順の最大4体へユニット1056 / 建物265。
- エリクサーゴーレム詳細映像でタワーダメージが実際に入り、分裂時にピンクの破裂演出が見えること。
- カード総数56（50ユニット＋6呪文）、`physicsVersion=45`。
- オンライン対戦ではクライアントとWorkerを同じv29.0.0へ揃えてください。
