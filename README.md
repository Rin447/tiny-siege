# TINY SIEGE v9.0.0

16体のユニットと1枚の呪文から6枚を選ぶ、オリジナル2Dリアルタイム攻城戦です。CPU練習とCloudflare Workers + Durable Objectsによる6桁PASSの1対1オンライン対戦を含みます。

## v9の変更

- ストーンゴーレム: HP **3150 → 2850**。コスト8 / 攻撃288 / 分裂 / 死亡爆発は維持。
- アイアン衛士: コスト **5 → 4**。HP1850 / 攻撃98などは維持。
- 新ユニット **クラッグバーサーカー** を追加。6コスト / HP1950 / 攻撃360 / 低速 / 地上近接 / 高重量。
- カードプールは **17枚（16ユニット＋1呪文）**。デッキは6枚。
- `physicsVersion=7` とし、更新前の進行中マッチを安全に終了します。

## Cloudflare更新

既存の `Rin447/tiny-siege` にZIP展開後の中身を上書きし、`main`へCommitしてください。Workerの作り直しは不要です。

確認URL:

```text
https://tiny-siege.miru0104.workers.dev/api/config
```

成功目安:

```json
{
  "version": "9.0.0",
  "cards": 17,
  "units": 16,
  "spells": 1,
  "physicsVersion": 7,
  "maxDeck": 6
}
```
