# Cloudflare deploy - v23.5.0

1. GitHub の TINY SIEGE リポジトリへ、このフォルダの中身をそのまま上書きアップロードします。
2. `main` に Commit（例: `Update Tiny Siege core unit sprites to v23.5.0`）。
3. Cloudflare の自動 Build / Deploy を待ちます。
4. `/api/config` で `version: 23.5.0`, `cards: 44`, `units: 39`, `spells: 5`, `physicsVersion: 28`, `maxDeck: 8` を確認します。

## v23.5.0 verification
- リーフ弓兵 / クラッグバーサーカー / ルーン術師 / フロストシャーマンの前後スプライトを確認。
- 静止 / 移動 / 攻撃が4フレームで切り替わることを確認。

- スカイボマー: 4コスト / HP720 / 飛行 / 速度58 / 射程75 / 1.6秒ごとに175。敵ユニットを無視して建物だけを狙う。
- スクラップドリル: 90 / 135 / 180 / 240 DPS、1.5秒ごとに増幅。離脱・対象変更・スタンで初期化。
- クラッシャーオーガ: 6コスト / HP2200 / 攻撃間隔3秒。230 / 310 / 390 / 470の同一建物連続打撃。
- シージタートル: 5コスト / HP2050。移動中の通常遠距離・タワー・レーザーを40%軽減し、攻撃中は解除。
- ボムキャリア: 3コスト / HP430 / 速度88。建物へ480自爆、途中撃破時のみ敵ユニットへ80死亡爆発。
- `physicsVersion=28` のため、オンライン対戦ではクライアントとWorkerを同じv23.5.0へ揃えてください。
- 更新履歴はルートの `UPDATE-HISTORY.html` 1枚に統合しています。バージョンごとのUPDATE HTMLは追加しません。

- `public/assets/sprites/skybomber.png` と `crusherogre.png` が 640x960 の前姿/後姿スプライトとして静的配信されることを確認してください。
