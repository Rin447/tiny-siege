# Cloudflare deploy - v17.0.0

1. `Rin447/tiny-siege` にv17.0.0フォルダの中身を上書きアップロードします。
2. `main` に Commit（例: `Upgrade Tiny Siege to v17.0.0`）。
3. Cloudflare のGitHub連携による自動Build/Deployを待ちます。
4. `/api/config` で `version: 17.0.0`, `cards: 27`, `units: 24`, `spells: 3`, `physicsVersion: 16`, `maxDeck: 8` を確認します。

v17.0.0は配置時召喚・定期召喚と新カード3枚を追加するため、対戦シミュレーション互換番号を `physicsVersion=16` へ更新しています。公開後は両端末を強制再読み込みし、新しいルーム/PASSを使用してください。
