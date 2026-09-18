# TINY SIEGE v38.0.0 - AIR BALLOON / LUMBERJACK UPDATE

## v38.0.0 AIR BALLOON / LUMBERJACK UPDATE

- Added Air Balloon: 5 cost, HP1676, damage640 every 2.0s, flying, buildings only, normal movement, close 1-cell attack range.
- Air Balloon drops a death bomb at its defeat position. It explodes after 2.0s in a 1-cell radius for 240 damage to enemy ground units and structures; air units are unaffected.
- Added Lumberjack: 4 cost, HP1282, damage255 every 0.8s, ground-only melee targeter, very fast movement.
- Lumberjack drops Rage at its defeat position. After 1.5s it uses the existing Rage effect: 179 unit / 45 structure impact damage plus a 4.5s 30% allied action-speed boost.
- Added dedicated procedural battle art, card-detail demos, death-bomb/Rage effects, and authoritative engine tests.
- Card total: 73 (65 units/buildings + 8 spells), physicsVersion 72.

## v37.9.0 CYCLONE / FALCHE / RAGE UPDATE
- Cyclone: radius 5.5 cells, 1.0 second duration, fixed 84 unit / 58 structure damage, and 3x pull speed so total pull remains close to the previous 3-second version.
- New 5-cost Falche: HP1280, 4.5-cell range, 179 damage on the outbound axe and 179 again on the return. The axe travels up to 7 cells with a 2-cell-wide piercing path; Falche cannot move until it returns.
- New 2-cost Rage: radius 3 cells, activates 1.5 seconds after placement, deals 179 unit / 45 structure damage, then boosts allied movement, attack and generation speed by 30% for 4.5 seconds. HP, per-hit damage, range and natural HP decay are unchanged.
- Card total: 71 (63 units/buildings + 8 spells), physicsVersion 71.

## v37.7.0 DEPLOYMENT VULNERABILITY & RELEASE-TO-PLACE UPDATE
- 通常ユニット・設置物は召喚/建設中から攻撃対象となり、通常攻撃・範囲攻撃・呪文・状態異常を受けます。召喚中は自分から移動・攻撃・能力発動を行いません。
- 自然HP減少、エリクサーポンプ生成、オーブン等の継続召喚・時間能力は召喚完了後に開始します。召喚中に失ったHPは完成後も回復しません。
- メガナイトのみ特殊降下召喚のため、着地完了まで従来どおり無敵・ターゲット不可です。
- 戦場配置は pointerdown では確定せず、押したまま位置を調整して pointerup で確定。戦場外で離すとキャンセルします。
- カード総数67枚（60ユニット/設置物 + 7スペル）、physicsVersion 69。

## v37.6.0 COMBAT SPELL & ELIXIR PUMP UPDATE
- レーザー塔の初期火力を42 DPSへ変更。レーザー線はターゲットへ常時表示し、0.2秒ごとに実ダメージを与える。1秒ごとの2倍増幅・対象変更時リセット・毎秒60の自然HP減少は維持。
- ファイヤーボールは半径2.5マス。指定後1.26秒の予告を挟み、自軍中央本拠地から従来の距離依存飛行時間で発射。小型・中型ユニットを爆心から外側へ約1マスノックバック。
- 矢の雨は半径3.5マス。指定後1.1秒の予告後、自軍中央本拠地から矢が実際に飛ぶ。橋付近まで約1.45秒、敵中央本拠地付近まで約2.4秒の飛行時間。
- 新6コスト設置物「エリクサーポンプ」を追加。HP1070、毎秒11.5自然減少、13秒ごとに自分へ1エリクサー生成、破壊・自然崩壊時も+1。ピンク液体の蓄積量で次回生成までの進捗を表示。
- カード総数67枚（60ユニット/設置物 + 7スペル）、physicsVersion 68。

## v37.5.2 GRID-SNAPPED BUILDING CLEARANCE UPDATE
- タワー/中央本拠地の3x3/4x4配置予約を撤廃し、塔本体HitBoxだけが設置をブロック。
- 通常設置物は3x3の必要スペースを維持し、設置位置は40pxグリッドの升目中心へスナップ。
- スナップ先の3x3に必要な余裕があれば設置可能。設置時は3x3の半透明プレビューを表示。
- 戦闘性能は据え置き。physicsVersion 67。


## v37.5.1 LASER TOWER DECAY & DAMAGE TICK UPDATE

- レーザー塔に毎秒60の自然HP減少を追加。HP2000のため無被弾でも約33.3秒で自然消滅。
- レーザー塔のダメージ発生を0.2秒ごとの刻みへ変更。初期20 DPS、1秒ごとの2倍増幅、対象変更時リセットは維持。
- 連続レーザーの攻撃エフェクト、射程、HitBox、ターゲット仕様は変更なし。
- gameplay同期更新のため physicsVersion 66。

## v37.5.0 BUILDING FOOTPRINT & HITBOX UPDATE

- 通常設置物は3x3の配置占有を維持しつつ、大砲 / 墓石 / オーブン / レーザー塔の戦場表示を占有サイズに合う大きさへ拡大。
- Placement Footprint（配置予約）/ Visual Size（見た目）/ Physical HitBox（実当たり判定）を分離。
- ユニットの衝突・経路探索・建物への攻撃距離は、3x3占有枠ではなく建物本体HitBoxを使用。
- サイドタワー3x3 / 中央タワー4x4も土地の占有範囲として維持し、物理HitBoxは塔本体サイズとして別管理。
- 既存カードとタワーの攻撃射程数値は変更なし。physicsVersion 65。

## v37.4.2 FOREGROUND RIM FIX & VISUAL RESTORE

- 赤枠で確認された薄い白線の原因だった旧 `roundRect(22,14,676,1008,30)` のForeground rimだけを削除。
- 白線調査中に誤って削除していた左右レーンの薄い道（Lane paving）を復元。
- 白線調査中に誤って変更していたホーム自動デモの元フレームを復元。
- 外周装飾専用余白、5テーマ、川グリッド非表示、橋2マス幅などの新マップ仕様は維持。
- physicsVersion 64。

## v37.4.0 CHARACTER VISUAL & PRINCESS UPDATE

- プリンセスアーチャーを「プリンセス」へ改名。HP261、射程9マス、視界9マス。
- プリンセスは射程と視界を同じ値で扱い、小柄な二頭身寄りの戦闘モデルへ変更。
- バーバリアン5体は性能を変えず、1体ごとの表示を一回り小型化。
- 攻城バーバリアンは、2体のバーバリアンが巨大な補強木材を頭上で担ぎ、木材の下から足が見えるデザインへ刷新。
- physicsVersion 64。

## v37.3.1 LANE PAVING CLEANUP

- 左右レーンに常時表示されていた半透明の道（Lane paving）を削除。
- 18×32グリッド、移動ルート、橋、射程、視界、当たり判定は変更なし。
- 外周装飾・5テーマ・川グリッド非表示などv37.3.0の仕様を維持。
- 見た目だけの修正のため physicsVersion 63 を維持。

- 18×32の戦場判定・マスサイズを変えず、戦場Canvasの外側へ装飾専用余白を追加。
- 草原 / 石・遺跡 / 溶岩 / 雪・氷 / 砂漠の5テーマに合わせ、木・岩・柱・雪・火山岩・砂漠植物などを外周へ表示。
- 外周装飾はすべて見た目専用で、移動・設置・射程・索敵・当たり判定へ影響しません。
- 旧マップ内周の装飾フレーム、盤面外周に残っていた旧グリッド境界線、太い黒枠を削除。
- v37.2の橋2マス幅・川グリッド非表示・タワー外周7マス射程・5テーマは維持。
- ゲームロジック変更なし / physicsVersion 63。

## BRIDGE ALIGNMENT & MAP DECOR UPDATE

- 戦場を横18 × 縦32マスの固定グリッドへ刷新。1マス=40ワールド単位、表示上の移動は滑らかなままです。
- 川はY16〜17の2マス。橋は左X4〜5、右X14〜15。
- 青サイドタワー: X3〜5/Y6〜8 と X14〜16/Y6〜8（3×3）。青中央本拠地: X8〜11/Y2〜5（4×4）。赤側は上下対称です。
- 中央本拠地の後ろは1マス残し、青Y1 / 赤Y32からユニットを配置できます。
- 通常の設置物は3×3マスぶんの設置余裕が必要で、40pxグリッドの升目中心へスナップします。川・マップ外・別の設置物の3×3予約と重なる配置は不可。サイドタワー/中央本拠地は旧3×3/4×4土地予約ではなく塔本体HitBoxだけが配置を妨げます。
- 弓兵の射程=5マスを基準として、全カードの攻撃射程・範囲・特殊能力距離をマス基準へ再設定しました。
- 視界は小型4 / 中型5 / 大型6マス。メガナイトのジャンプや追跡者のフックなど特殊能力の取得距離は通常視界と独立しています。
- タワー・設置物への射程判定は建物中心ではなく、実際の建物本体HitBoxの最も近い外周までの距離で判定します。
- 複数体召喚・召喚士の子分生成もグリッド距離を基準にしたフォーメーションへ移行しました。
- v36.3のサイズ別視界・未交戦ターゲット解除、v36.2の建物特攻レーン維持、v36.1のオーブン自然減衰は維持しています。
- カード総数66枚（59ユニット + 7スペル）、physicsVersion 63。

### v37.1 bridge alignment
- Left bridge hitbox: X=3.5-4.5 cells, centre X=4 (world X=140).
- Right bridge hitbox: X=14.5-15.5 cells, centre X=15 (world X=580).
- Each bridge is exactly 1 cell wide. Side rails, posts, ropes, grass, stones, water ripples and edge foliage are decorative only and never change collision.