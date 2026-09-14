# TINY SIEGE v23.5.0 テストレポート

## 対象
- リーフ弓兵: 新しい緑フード / 矢筒 / 木弓の高精細ピクセルスプライト
- クラッグバーサーカー: 新しい赤髪 / 毛皮 / 双斧の高精細ピクセルスプライト
- 前姿 / 後姿 × 静止 / 移動 / 攻撃
- 戦闘ロジック・ステータスは変更なし、physicsVersion 28を維持

## 結果
- `npm run check`: PASS（JavaScript 17ファイル解析 + Cloudflare設定確認）
- `npm test`: **222 / 222 PASS**
- `npm run test:network`: **14 / 14 PASS**
- `tests/browser-v23-5.py`: **6 / 6 PASS**
- `tests/stress.mjs`: 完走、NaN/停止なし
- `npm run build:offline`: PASS。単一HTMLへ6枚の方向対応スプライトをData URLで内包

## V23.5固有確認
- Archer / Berserker のPNGは各640x960、160pxセル、4列x6行。
- 行順は front idle / front move / front attack / back idle / back move / back attack。
- 生成元が3フレームの行は中間フレームを再利用して既存4フレーム周期に合わせています。
- キャラの向き判定・ターゲット・攻撃タイミング・HP/攻撃力/コストには変更を入れていません。
