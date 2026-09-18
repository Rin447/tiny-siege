import {VERSION,ARENA,UNITS,DECK,DEFAULT_DECK,MAX_DECK,normalizeDeck,summonDelayFor,cardDamageInfo,visionSizeFor,visionRangeFor} from './game/units.js';
import {createMatch,tick,runBot,deploy,viewMatch,clamp,canPlace} from './game/engine.js';
import {drawArena,drawPortrait,orient} from './game/art.js';
import {snapDeploymentPoint} from './game/physics.js';

const $=s=>document.querySelector(s);
// Keep the whole game surface free from browser text-selection/copy callouts so touch dragging stays game-controlled.
function blockNativeTextActions(e){e.preventDefault();}
document.addEventListener('contextmenu',blockNativeTextActions,{capture:true});
document.addEventListener('selectstart',blockNativeTextActions,{capture:true});
document.addEventListener('copy',blockNativeTextActions,{capture:true});
document.addEventListener('cut',blockNativeTextActions,{capture:true});
document.addEventListener('dragstart',blockNativeTextActions,{capture:true});
document.addEventListener('selectionchange',()=>{const sel=window.getSelection?.();if(sel&&!sel.isCollapsed)sel.removeAllRanges();});
const PATCH_NOTES = Object.freeze([
  {version:'37.2.0',date:'2026-09-18',title:'MAP VARIATION & TOWER RANGE UPDATE',items:[
    '橋の実通行幅を1マスから2マスへ拡大。中心X4 / X15は維持し、大型・群体が詰まりにくい橋へ変更。',
    '川のグリッド線を非表示化し、川は地形として自然に見えるよう調整。',
    'サイド/中央タワーの射程7マスを、タワー中心ではなく占有外周から計測する方式へ変更。射程6マスの吹き矢ゴブリンへ必ず反撃可能。',
    '草原・石/遺跡・溶岩・雪/氷・砂漠の5テーマを追加。対戦ごとに地形色・川・橋・外周装飾を切り替え。',
    '外周フレームにテーマ別の非衝突装飾を追加。physicsVersion 63。'
  ]},
  {version:'37.1.0',date:'2026-09-18',title:'BRIDGE ALIGNMENT & MAP DECOR UPDATE',items:[
    '\u5de6\u6a4b\u3092X3.5\u301c4.5\uff08\u4e2d\u5fc3X4\uff09\u3001\u53f3\u6a4b\u3092X14.5\u301c15.5\uff08\u4e2d\u5fc3X15\uff09\u3078\u79fb\u52d5\u3002\u5b9f\u969b\u306e\u901a\u884c\u5224\u5b9a\u30821\u30de\u30b9\u5e45\u306b\u7d71\u4e00\u3002',
    '\u30b5\u30a4\u30c9\u30bf\u30ef\u30fc\u306e\u4e2d\u5fc3\u7dda\u3068\u6a4b\u4e2d\u5fc3\u3092\u4e00\u81f4\u3055\u305b\u3001\u5de6\u53f3\u30ec\u30fc\u30f3\u306e\u9053\u304b\u3089\u771f\u3063\u76f4\u3050\u6a4b\u3078\u5165\u308c\u308b\u69cb\u6210\u3078\u5909\u66f4\u3002',
    '\u6728\u677f\u30fb\u5074\u6881\u30fb\u676d\u30fb\u30ed\u30fc\u30d7\u30fb\u8349\u30fb\u77f3\u30fb\u6c34\u9762\u30fb\u5cb8\u8fba\u306a\u3069\u3001\u5f53\u305f\u308a\u5224\u5b9a\u306e\u306a\u3044\u30de\u30c3\u30d7\u88c5\u98fe\u3092\u8ffd\u52a0\u3002',
    '18\u00d732\u30b0\u30ea\u30c3\u30c9\u3001\u30bf\u30ef\u30fc\u914d\u7f6e\u3001\u5c04\u7a0b\u30fb\u8996\u754c\u30fb\u53ec\u559a\u30eb\u30fc\u30eb\u306fV37.0.0\u4ed5\u69d8\u3092\u7dad\u6301\u3002physicsVersion 62\u3002'
  ]},
  {version:'37.0.0',date:'2026-09-18',title:'GRID MAP OVERHAUL',items:[
    '戦場を横18×縦32の固定グリッドへ全面刷新。1マス=40ワールド単位で、移動表示は滑らかなまま射程・視界・範囲・配置をマス基準に統一。',
    '川は中央2マス（Y16〜17）、橋は左X4〜5・右X14〜15。青サイドタワーはX3〜5/Y6〜8・X14〜16/Y6〜8、中央本拠地はX8〜11/Y2〜5。赤側は完全対称。',
    'サイドタワー3×3、中央本拠地4×4、通常設置物3×3。設置物はグリッドへスナップし、占有マスが川・タワー・他建物・マップ外へ重なる場合は設置不可。',
    '弓兵の射程を5マスの基準値に設定して全カードの射程・範囲を再換算。視界は小型4・中型5・大型6マス、特殊能力射程は独立管理。physicsVersion 61。'
  ]},
  {version:'36.3.0',date:'2026-09-18',title:'VISION TARGETING UPDATE',items:[
    '新しい「視界」システムを追加。通常索敵はキャラの大きさで小型R115・中型R150・大型R185に分類。',
    '攻撃前に追っている敵が視界外へ出た場合は追跡を解除し、元のタワー進行ルートへ復帰。1度攻撃した後は従来どおりターゲットをロック。',
    '大型は小型・中型より遠くの敵を見つけるため、小型ユニットで大型だけを釣る非対称な誘導が可能。',
    'メガナイトのジャンプ、追跡者のフック、ユーノの専用索敵など特殊能力の取得距離は通常視界と別管理。カード総数66枚、physicsVersion 60。'
  ]},
  {version:'36.2.0',date:'2026-09-18',title:'TARGETING SYSTEM UPDATE',items:[
    '建物特攻ユニットは配置した左右レーンを維持。同レーンのタワー破壊後も反対側タワーへ横断せず、そのまま本拠地側へ進軍。',
    '敵の大砲・レーザー塔・オーブンなど設置物が近距離（R165）にある場合は、防衛建物へ引き寄せられる。',
    '通常近接ユニットの基本索敵を150へ縮小。メガナイトのジャンプ160、追跡者のフック180、ユーノ105など特殊能力の索敵は独立して維持。',
    'カード総数66枚（59ユニット＋7呪文）、physicsVersion 59。'
  ]},
  {version:'36.1.0',date:'2026-09-18',title:'OVEN DECAY UPDATE',items:[
    'オーブンに毎秒30の自然HP減少を追加。HP900なので、攻撃を受けなくても約30秒で崩れる。',
    '配置時のファイヤスピリット2体召喚と、その後10秒ごとの2体召喚はそのまま維持。',
    'カード総数66枚（59ユニット＋7呪文）、physicsVersion 58。'
  ]},
  {version:'36.0.0',date:'2026-09-17',title:'BARBARIAN & SIEGE BARBARIAN UPDATE',items:[
    '新5コスト「バーバリアン」を追加。HP716・攻撃192・攻撃間隔1.4秒・普通速度の地上近接バーバリアンを5体召喚。金髪・金髭・上半身裸の専用描画。',
    '新4コスト「攻城バーバリアン」を追加。木のHP966・建物のみ攻撃。通常接触265ダメージ、2秒連続移動で加速し突進572ダメージ。',
    '攻城バーバリアンの加速はザップなどのスタンでリセット。木が破壊された時、または建物へ衝突して砕けた時にバーバリアン2体を展開。',
    'カード総数66枚（59ユニット＋7呪文）、physicsVersion 57。'
  ]},
  {version:'35.0.0',date:'2026-09-17',title:'FIRE SPIRIT & OVEN UPDATE',items:[
    '新1コスト「ファイヤスピリット」を追加。HP215・速度96。地上/空中の敵へ飛びつき、半径48へ215範囲ダメージを与えて自爆する高火力スピリット。',
    'ファイヤスピリットは丸いマグマの身体＋小さな手足の専用描画。アイススピリットと同じ超高速タイプだが、フリーズの代わりに215範囲火力へ特化。',
    '新4コスト設置物「オーブン」を追加。HP900。建設完了時にファイヤスピリット2体を召喚し、その後も10秒ごとに2体ずつ追加召喚。',
    'オーブンは四角いコンロの上に大きな鍋が載った専用描画。鍋の中が赤く煮え、ファイヤスピリットを継続的に送り出す。',
    'カード総数64枚（57ユニット＋7呪文）、physicsVersion 56。'
  ]},
  {version:'34.0.0',date:'2026-09-17',title:'APPRENTICE GUARD & ICE SPIRIT UPDATE',items:[
    '新7コスト「見習い親衛隊」を追加。6体をほぼ画面いっぱいの横一列へ展開し、配置位置で3+3・4+2・2+4のように2レーンへ振り分け可能。1体HP547＋シールド240・攻撃133・攻撃間隔1.3秒・普通速度・地上近接。',
    '見習い親衛隊のシールドは本体HPと完全分離。全方向からのダメージを先にシールドが受け、240を使い切ると大盾が消えて本体HP547で戦う。',
    '新1コスト「アイススピリット」を追加。HP217・速度96。地上/空中へ飛びつき、半径48へ110ダメージ＋1.1秒フリーズを与えて消滅。雪玉に手足が生えた専用描画を追加。',
    '巨大スケルトンの死亡爆弾をR70→R58へ縮小。橋の中央で爆発したとき橋全体をぎりぎり囲う程度へ調整。',
    'カード総数62枚（55ユニット＋7呪文）、physicsVersion 55。'
  ]},
  {version:'33.0.0',date:'2026-09-17',title:'GOBLIN & MEGA GARGOYLE UPDATE',items:[
    '巨大スケルトンの死亡爆弾範囲をR80→R70へ縮小。歩行中は左右の腕を上下に大きく縦振りするモーションへ調整。',
    'ゴブリン部隊を「ゴブリンギャング」へ改名し、通常ゴブリン3体＋槍ゴブリン3体の6体編成へ。通常ゴブリンはHP202/攻撃125/1.1秒、槍ゴブリンはHP133/攻撃81/1.6秒。',
    '新2コスト「ゴブリン」を追加。通常ゴブリンを4体生成。新2コスト「槍ゴブリン」は槍ゴブリンを3体生成。',
    '新3コスト「メガガーゴイル」を追加。HP837・攻撃311・攻撃間隔1.5秒・速さ普通・射程60。地上/空中攻撃可能で、鎧を着けた一回り大きいガーゴイルの専用描画を追加。',
    'カード総数60枚（53ユニット＋7呪文）、physicsVersion 54。'
  ]},
  {version:'32.0.0',date:'2026-09-17',title:'SKELETON RUSH & GIANT SKELETON UPDATE',items:[
    '\u65b05\u30b3\u30b9\u30c8\u30b9\u30da\u30eb\u300c\u30b9\u30b1\u30eb\u30c8\u30f3\u30e9\u30c3\u30b7\u30e5\u300d\u3092\u8ffd\u52a0\u3002\u4f7f\u75281.2\u79d2\u5f8c\u306b\u7d2b\u8272\u306e\u53ec\u559a\u7bc4\u56f2\u304c\u767a\u52d5\u3057\u30013\u79d2\u5f8c\u304b\u30890.5\u79d2\u3054\u3068\u306b\u30b9\u30b1\u30eb\u30c8\u30f3\u3092\u53ec\u559a\u3002\u52b9\u679c\u6642\u95939\u79d2\u3002',
    '\u30b9\u30b1\u30eb\u30c8\u30f3\u30e9\u30c3\u30b7\u30e5\u306f\u5efa\u7269\u3068\u91cd\u306d\u3066\u8a2d\u7f6e\u53ef\u80fd\u3002\u5efa\u7269\u5185\u90e8\u30fb\u753b\u9762\u5916\u30fb\u6c34\u4e0a\u306b\u306f\u30b9\u30b1\u30eb\u30c8\u30f3\u3092\u751f\u6210\u305b\u305a\u3001\u7bc4\u56f2\u306f\u6700\u592740%\u307e\u3067\u753b\u9762\u5916\u3078\u306f\u307f\u51fa\u3057\u53ef\u80fd\u3002',
    '\u65b06\u30b3\u30b9\u30c8\u300c\u5de8\u5927\u30b9\u30b1\u30eb\u30c8\u30f3\u300d\u3092\u8ffd\u52a0\u3002HP3361\u30fb\u653b\u6483276\u30fb\u653b\u6483\u9593\u96941.3\u79d2\u30fb\u901f\u3055\u666e\u901a\u3002\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\u3068\u5efa\u7269\u3092\u653b\u6483\u3002',
    '\u5de8\u5927\u30b9\u30b1\u30eb\u30c8\u30f3\u306f\u6b7b\u4ea1\u5730\u70b9\u306b\u7206\u5f3e\u3092\u6b8b\u3057\u30013\u79d2\u5f8c\u306b\u30d5\u30a1\u30a4\u30e4\u30fc\u30dc\u30fc\u30eb\u3088\u308a\u5c11\u3057\u72ed\u3044\u534a\u5f8480\u3078688\u30c0\u30e1\u30fc\u30b8\u3002\u9752/\u8d64\u306e\u51ac\u5e3d\u5b50\u30fb\u53f3\u624b\u306e\u7206\u5f3e\u30fb\u80cc\u4e2d\u306e\u6a3d\u306e\u5c02\u7528\u63cf\u753b\u3092\u8ffd\u52a0\u3002',
    '\u30ab\u30fc\u30c9\u7dcf\u657057\u679a\uff0850\u30e6\u30cb\u30c3\u30c8\uff0b7\u546a\u6587\uff09\u3001physicsVersion 53\u3002'
  ]},
  {version:'31.0.2',date:'2026-09-17',title:'ROYAL GIANT V29.2 LOOK RESTORE',items:[
    'ロイヤルジャイアントの見た目をV29.2.0版へ戻しました。V29.2.0のdrawRoyalGiant描画をそのまま移植しています。',
    '大柄な灰青色の装備、金髪・王冠・赤いサッシュ、片腕で横向きの大砲を持ち、反対の手に砲弾を持つV29.2.0のシルエットへ復元。',
    'スケルトンバレルなどV31のカード・性能は維持。見た目のみの変更のため physicsVersion 52 を維持。'
  ]},
  {version:'31.0.0',date:'2026-09-17',title:'SKELETON BARREL UPDATE',items:[
    '新3コスト「スケルトンバレル」を追加。HP532・移動速度56の飛行ユニットで、建物だけを狙って進みます。',
    'スケルトンバレルは建物へ到達すると145ダメージを与えて消滅し、スケルトン7体を展開。途中で倒されてもその場で145ダメージの爆発を起こしてからスケルトン7体を出します。',
    'ロイヤルジャイアントの見た目を再調整。右手に砲弾を持ち、左手で砲台を抱えるシルエットへ描き直しました。',
    'カード総数55枚（49ユニット＋6呪文）、physicsVersion 52。'
  ]},
  {version:'30.0.0',date:'2026-09-17',title:'ICE GOLEM UPDATE',items:[
    '新2コスト「アイスゴーレム」を追加。HP1228・攻撃84・攻撃間隔2.5秒・低速。敵ユニットを無視して建物だけを狙う。',
    'アイスゴーレムは倒されると半径60の周囲へ84ダメージの氷爆発を発生。追加の鈍足効果はありません。',
    'ロイヤルジャイアントの左腕を大砲の後ろから回し、左手が砲台の下を抱えて支えているように再調整。砲身との重なりを減らしました。',
    'カード総数54枚（48ユニット＋6呪文）、physicsVersion 51。'
  ]},
  {version:'29.5.1',date:'2026-09-17',title:'ROYAL AIM POSE FIX',items:[
    'ロイヤルジャイアントの大砲を、身体の前で縦に立てる構えから、脇の下にしっかり抱えて前を狙う構えへ描き直しました。',
    '正面では銃口が手前を向いて見え、背面では砲身が敵方向へ伸びるように描画。片腕で砲身を支え、もう片手には砲弾を持つ見た目です。',
    '見た目のみの更新のため physicsVersion 50 を維持。ロイヤルジャイアントの性能値も変更ありません。'
  ]},
  {version:'29.5.0',date:'2026-09-17',title:'LASER & ROYAL CANNON UPDATE',items:[
    'レーザー塔の同一対象への火力上昇間隔を1.5秒→1.0秒へ短縮。初期20 DPS・倍化方式・対象変更時リセットは維持。',
    'ロイヤルジャイアントの手持ち大砲を横向きに見える描画から、身体の前で縦方向に構えるシルエットへ変更。性能値は変更なし。',
    '対戦ロジック更新に伴い physicsVersion 50。カード総数53枚（47ユニット＋6呪文）は維持。'
  ]},
  {version:'29.4.0',date:'2026-09-17',title:'FIRST STRIKE TIMING UPDATE',items:[
    '敵が新しく攻撃射程へ入った瞬間の即ダメージを廃止。通常攻撃はターゲット取得後0.25秒だけ待ってから初撃を行うよう変更。',
    'ターゲットを切り替えた場合も初撃0.25秒を適用。いったん射程外へ離れた場合は、再接敵時にもう一度0.25秒の準備を行う。',
    '攻撃間隔・各カードのダメージ値は変更なし。ユーノのダッシュ、メガナイトのジャンプ、追跡者のフックなど既存の溜め付き特殊行動には追加待ちを重ねない。physicsVersion 49。'
  ]},
  {version:'29.3.0',date:'2026-09-17',title:'ROYAL GHOST & ROSTER CLEANUP',items:[
    'クラッシャーオーガ、グラビティオーブ、シージタートルを選択可能カードデータから削除。既存保存デッキは残ったカードを維持して不足分だけ自動補完。',
    'スカイボマーの射程を75→170へ強化。HP650・攻撃175・攻撃間隔1.6秒は維持。',
    'ミラージュアサシンを「ロイヤルゴースト」へ改名。3コスト / HP1210 / 攻撃261 / 攻撃間隔1.8秒 / 速度68。半径40の小範囲攻撃を追加。',
    'ロイヤルゴーストを、白い幽霊の老王・もじゃもじゃの白髭・王冠・短剣・やる気なさげな表情へ刷新。ステルス中は半透明。カード総数53枚（47ユニット＋6呪文）、physicsVersion 48。'
  ]},
  {version:'29.2.0',date:'2026-09-17',title:'BOAR RIVER ROUTE UPDATE',items:[
    'アイアンボアは、配置時に川岸すぐ横かつ橋の外側だった場合だけ川ジャンプを選ぶように変更。',
    '橋の正面に配置した場合と、川岸から90pxより離れた場所に配置した場合は、通常どおり橋へ向かう。',
    '川ジャンプの着地地点を対岸のすぐそばへ短縮し、飛行時間を0.85秒から1.2秒へ延長してよりゆっくり飛ぶように調整。',
    'アイアンボアのHP1696・攻撃318・攻撃間隔1.6秒など戦闘ステータスは変更なし。physicsVersion 47。'
  ]},
  {version:'29.1.0',date:'2026-09-17',title:'YUNO & HUNTER UPDATE',items:[
    'メガナイトのジャンプ準備を2.0秒→1.7秒へ短縮。HP3993・通常攻撃263・ジャンプ537・飛行1.5秒は維持。',
    '追跡者を6→5コスト、通常攻撃220→320へ強化。射程180フック・CT4秒・空中2秒攻撃など既存能力は維持。',
    '「ナイトシェイド」を「ユーノ」へ刷新。HP907・通常攻撃193・攻撃間隔1.0秒・固定ダッシュ387・ダッシュCT2秒。',
    'ユーノの見た目を、小柄な白髪の女の子＋緑のフード付きマント＋黒い目元マスク＋タガーへ全面変更。カード総数56枚、physicsVersion 46。'
  ]},
  {version:'29.0.0',date:'2026-09-16',title:'LIGHTNING & NECRO UPDATE',items:[
    'ネクロマンサーを5コスト・HP839・攻撃間隔1.1秒へ、ダークネクロマンサーを4コスト・HP907・攻撃304へ調整。既存の召喚能力は維持。',
    '「ポイズントラップ」を「ポイズン」へ改名。8秒間、範囲内のユニットへ毎秒91・建物へ毎秒21ダメージ。カード絵を赤い細長い魔法瓶へ変更。',
    'ファイヤーボールを対ユニット689 / 対建物159、矢の雨を対ユニット366 / 対建物75へ調整。',
    '新6コスト呪文「ライトニング」を追加。半径105内の現在HPが高い敵4体へ、ユニット1056 / 建物265ダメージ。青い長方形の魔法瓶＋電流デザイン。',
    'エリクサーゴーレム詳細映像のタワーダメージを修正し、大→中→小への分裂時にピンクの破裂演出を追加。カード総数56枚（50ユニット＋6呪文）、physicsVersion 45。'
  ]},
  {version:'28.0.0',date:'2026-09-16',title:'ROYAL ELIXIR UPDATE',items:[
    '「ルミナ司祭」を「ヒーラー」へ改名。HP1900・攻撃120・攻撃間隔1.75秒・射程120へ変更し、攻撃命中時に自分＋周囲の傷ついた味方最大3体を各110回復する戦闘型回復へ刷新。',
    '新3コスト「エリクサーゴーレム」を追加。HP1568・攻撃254・2秒攻撃・建物限定。大1→中2→小4へ分裂し、撃破段階ごとに相手へ1 / 1 / 0.5エリクサーを付与。',
    '新6コスト「ロイヤルジャイアント」を追加。HP3164・攻撃307・攻撃間隔1.8秒・射程165・低速・建物限定。手持ち大砲から専用砲弾を発射。',
    'カード総数55枚（50ユニット＋5呪文）。新能力とオンライン同期更新に伴い physicsVersion 44。'
  ]},
  {version:'27.1.0',date:'2026-09-16',title:'RIVERBANK DEPLOY UPDATE',items:[
    '初期召喚可能ラインを自陣側600/440から、橋へ少しかかる550/490まで拡張。芝生の最前線と実際の配置範囲を一致させた。',
    '川の水面そのものを直接指定した場合は配置不可。橋の上は新しい前線の範囲内なら配置可能。',
    '芝生ギリギリの配置でユニットの体が川へはみ出す場合、配置失敗にせず体が岸に収まる位置まで自陣側へ自動スナップ。複数体カードも各ユニットを安全な岸側へ補正。',
    '配置判定変更に伴い physicsVersion 43。カード性能は変更なし。'
  ]},
  {version:'27.0.0',date:'2026-09-16',title:'UNDEAD RIVER UPDATE',items:[
    'アイアンボアをHP1696・攻撃318・攻撃間隔1.6秒へ変更。川付近では橋へ迂回せず、対岸へ直接ジャンプする専用移動を追加。',
    '1コスト「スケルトン」を追加。HP81・攻撃81のスケルトン3体を展開。「ボーンスウォーム」は「スケルトン部隊」へ改名し、同性能のスケルトン15体編成へ変更。',
    '新設置物「墓石」を追加。3コスト / HP530 / 毎秒30自然減衰。配置完了時と4秒ごとにスケルトン2体、破壊時に待ち時間なしで4体召喚。',
    'メガナイトをHP3993・通常攻撃263・ジャンプ着地537へ変更。配置時の落下420ダメージは維持。',
    'カード総数53枚（48ユニット＋5呪文）。対戦ロジック変更に伴い physicsVersion 42。'
  ]},
  {version:'26.6.0',date:'2026-09-16',title:'ARSENAL & SWARM UPDATE',items:[
    'ボルト砲台を「大砲」へ改名。HP1000・攻撃200・攻撃間隔1.0秒へ調整。毎秒30の自然耐久減少は維持。',
    'ムーンバットを「コウモリの群れ」へ改名。5体編成へ増加し、各HP92・攻撃82・攻撃間隔1.2秒へ調整。',
    'ポット爆弾兵を「ボンバー」へ改名し、コスト3→2。爆弾の飛行速度を少し落とし、山なりに回転しながら投げる演出を追加。',
    '戦闘バランス変更に伴い physicsVersion 41。'
  ]},
  {version:'26.5.0',date:'2026-09-16',title:'BATTLE READABILITY UPDATE',items:[
    'リーフ弓兵の配置・召喚プレビューを1体表示から左右2体表示へ修正。実際の2体編成と見た目を一致。',
    '中央本拠地をHP4560・攻撃85、左右サイドタワーを各HP3200・攻撃105へ調整。',
    '戦闘中の手札カードを長押しすると、対ユニットDMGと対タワーDMGをその場で確認できる情報パネルを追加。',
    'ファイヤーボール560/140、矢の雨330/80、ポイズン55/10など、建物補正を実際の設定値から表示。physicsVersion 40。'
  ]},
  {version:'26.4.3',date:'2026-09-16',title:'GOLEM ARM SWAY TUNE',items:[
    'ストーンゴーレム / ちびゴーレムの腕振りの周期を少し遅く調整し、より重いテンポで揺れるように調整。',
    'v26.4.1のゴリラ型シルエット、低い頭、石・苔・青いルーンの見た目は維持。',
    '攻撃時の見た目や性能値は変更なし（ストーンゴーレム HP4256 / 攻撃260 / 攻撃間隔2.5秒 / 死亡爆発260）。',
    'visual update only。戦闘ロジック変更なしのため physicsVersion 39を維持。'
  ]},
  {version:'26.4.0',date:'2026-09-16',title:'GOLEM WEIGHT UPDATE',items:[
    'ストーンゴーレムをHP4256・攻撃260・攻撃間隔2.5秒へ変更。死亡爆発も260へ強化。8コスト・建物特攻・分裂2体は維持。',
    'ちびゴーレムを本体のおよそ1/5性能へ統一。HP851・攻撃52・死亡爆発52、攻撃間隔は本体と同じ2.5秒。',
    'ストーンゴーレムの石・苔・ルーンのデザインは維持しつつ、頭を低くして前傾し、両腕を前へ垂らすゴリラ風の重量姿勢へ変更。',
    'カード総数51枚（46ユニット＋5呪文）、physicsVersion 39。'
  ]},
  {version:'26.3.0',date:'2026-09-16',title:'FRONTLINE POWER UPDATE',items:[
    'アイアン衛士の攻撃を98→202へ強化。HP1850・3コスト・攻撃間隔1.35秒は据え置き。',
    'クラッグバーサーカーをHP2450→3760、攻撃465→842へ大幅強化。7コスト・攻撃間隔1.8秒は据え置き。',
    'ミニバーサーカーをHP1300→1390、攻撃270→755へ強化し、攻撃間隔を1.45→1.6秒へ調整。',
    'リーフ弓兵は2体編成・各HP304・攻撃112・射程165を維持し、コストを2→3へ変更。カード総数51枚（46ユニット＋5呪文）、physicsVersion 38。'
  ]},
  {version:'26.2.0',date:'2026-09-16',title:'AXE & ARCHER UPDATE',items:[
    'ヴァルキリーをHP2200・攻撃260へ強化。回転斬りの範囲とエフェクトは維持しつつ、体全体を回転させず、前向き/後ろ向きを切り替えながら斧だけを大きく振り回す見た目へ変更。',
    'リーフ弓兵を小型2体編成へ変更。2コストのまま、1体HP304・攻撃112・射程165。横並びで2体出撃し、地上・空中へ射撃。',
    'リーフ弓兵の戦闘モデルとカード画像も一回り小さく調整。カード総数51枚（46ユニット＋5呪文）、physicsVersion 37。'
  ]},
  {version:'26.1.1',date:'2026-09-16',title:'BATTLE PACE TUNE',items:[
    'V26.1.0で遅くした全ユニットの通常移動速度を、現在値から約5%だけ上げて微調整しました。速い・普通・遅いというキャラ間の速度差は維持しています。',
    '建物など速度0はそのまま。メガナイトの固定1.5秒ジャンプ、ナイトシェイドの突進、穴掘り、追跡者のフックなど特殊移動の速度・時間も変更していません。',
    'カード総数51枚（46ユニット＋5呪文）、physicsVersion 36。'
  ]},
  {version:'26.1.0',date:'2026-09-16',title:'BATTLE PACE UPDATE',items:[
    '全ユニットの通常移動速度を約15%低下。速い・普通・遅いというキャラ間の相対差は維持したまま、戦場全体の移動テンポを落としました。',
    '建物など元から移動速度0のユニットは変更なし。メガナイトの1.5秒ジャンプ、ナイトシェイドの突進、穴掘り、フックなど特殊移動の速度・時間も変更していません。',
    'カード総数51枚（46ユニット＋5呪文）、physicsVersion 35。'
  ]},
  {version:'26.0.0',date:'2026-09-16',title:'WILD WINGS UPDATE',items:[
    '新ユニット「ヴァルキリー」を追加。4コスト / HP1400 / 攻撃230。自分中心の半径50回転斬りで地上群体をまとめて攻撃。',
    '新ユニット「ガーゴイル」を追加。3コストで3体。1体HP230 / 攻撃102 / 速度78 / 射程45。地上・空中の両方を攻撃可能。',
    '新カード「ガーゴイルの群れ」を追加。5コストで同性能のガーゴイル6体を展開。',
    'カード総数51枚（46ユニット＋5呪文）、physicsVersion 34。'
  ]},
  {version:'25.2.1',date:'2026-09-16',title:'SKY BOMBER AIR TARGET FIX',items:[
    'スカイボマーが地上ユニット・空中ユニット・建物のすべてを攻撃できるように変更。',
    'HP650、4コスト、攻撃175、速度58、射程75、攻撃間隔1.6秒は25.2.0から据え置き。',
    '対戦ロジック変更に伴い physicsVersion を33へ更新。'
  ]},
  {version:'25.2.0',date:'2026-09-16',title:'SKY BOMBER RETARGET',items:[
    'スカイボマーを建物専用から地上ユニット＋建物を攻撃する飛行爆撃兵へ変更。空中ユニットは引き続き攻撃不可。',
    'HPを720から650へ低下。4コスト、攻撃175、速度58、射程75、攻撃間隔1.6秒は据え置き。',
    '対戦ロジック変更に伴い physicsVersion を32へ更新。'
  ]},
  {version:'25.1.1',date:'2026-09-16',title:'MOBILE DRAG FIX',items:[
    'スマホの長押しドラッグ時に出ていたブラウザ標準の文字選択・コピー・拡大ルーペ/コールアウトを、TINY SIEGEの画面全体で抑制しました。',
    '右クリック/長押しメニュー、文字選択、コピー/切り取り、ネイティブドラッグをゲーム画面全体で無効化。通常のタップ・スクロール・ゲーム操作は維持します。',
    'デッキ編成の約0.18秒長押し後ドラッグ仕様はそのまま。戦闘ロジック変更なしのため physicsVersion は31を維持します。'
  ]},
  {version:'25.1.0',date:'2026-09-15',title:'DRAG DECK UPDATE',items:[
    'デッキ編集にドラッグ＆ドロップ編成を追加。カード一覧から8枠へ直接ドラッグすると、満杯時はその枠と入れ替え、空きがある場合は追加できます。',
    'デッキ8枠同士もドラッグで順番を入れ替え可能。ドラッグ中はカードが指・マウスへ追従し、置ける枠と現在のドロップ先を強調表示します。',
    '従来のタップ/クリック操作は維持。PCは約10pxの移動でドラッグへ切り替わり、スマホは約0.18秒長押ししてから動かした場合だけドラッグとして扱います。',
    '戦闘ロジックは変更していないため physicsVersion は31のままです。'
  ]},
  {version:'25.0.0',date:'2026-09-15',title:"HUNTER'S MARK UPDATE",items:[
    '新ユニット「鉄の目」を追加。4コスト・HP750・攻撃125・射程160。通常矢で敵ユニットへマークを付け、マーク中は味方から受けるダメージが20%増加します。',
    '鉄の目マークは実ダメージ累計500で砕け、追加300ダメージ。接近された鉄の目は1体につき一度だけ隠し刃で貫通回転突進し、命中した地上敵全員へ180ダメージ・マーク・2.5秒の30%鈍足を与えます。',
    '新ユニット「追跡者」を追加。6コスト・HP1900・攻撃220。4秒ごとに射程180のフックを使用します。',
    '追跡者のフックは地上敵を自分へ引き寄せ、空中敵を引いた場合はその相手だけ2秒間攻撃可能。建物へ刺した場合は追跡者自身が建物の近接位置へ引き寄せられます。',
    'カード総数は48枚（43ユニット＋5呪文）。マーク・回転突進・フック状態同期に伴い physicsVersion を31へ更新しました。'
  ]},
  {version:'24.1.0',date:'2026-09-15',title:'MEGA FLIGHT UPDATE',items:[
    'メガナイトのジャンプ移動時間を距離に関係なく1.5秒へ統一。近距離側のジャンプでも一瞬で着地せず、空中移動がしっかり見えるようになりました。',
    'ジャンプ中の浮き上がりを大きくし、地面の影・風線・弧を描く軌道・着地点リングを追加して、飛行中であることを視覚的に分かりやすくしました。',
    '飛び始めた瞬間の着地点を固定し、ジャンプ中に対象が移動しても着地点が追従しない仕様へ整理しました。',
    'オンライン同期変更に伴い physicsVersion を30へ更新しました。'
  ]},
  {version:'24.0.0',date:'2026-09-15',title:'HEAVY DROP UPDATE',items:[
    '新ユニット「ミニバーサーカー」を追加。4コスト・HP1300・攻撃270・速度52・攻撃間隔1.45秒。頭と体がほぼ1:1の小型バーサーカーで、大剣を掲げて素早く前線へ入ります。',
    '新ユニット「メガナイト」を追加。7コスト・HP2400・攻撃280・速度40・攻撃間隔1.6秒。通常攻撃は半径48の小範囲攻撃です。',
    'メガナイトは指定地点へ1.5秒後に上空から落下し、半径48へ420ダメージ。80～160の敵には2秒溜めてジャンプし、着地時も半径48へ420ダメージを与えます。',
    'ジャンプにクールタイムはありません。最初の2秒溜め中は、より近い敵が出現すると対象を変更します。飛び始めた後は対象を固定し、一度交戦した相手が倒れるまで追跡します。',
    'カード総数は46枚（41ユニット＋5呪文）。新しい落下・ジャンプ状態同期に伴い physicsVersion を29へ更新しました。'
  ]},
  {version:'23.0.0',date:'2026-09-14',title:'SIEGE SPECIALISTS UPDATE',items:[
    '建物だけを狙う新ユニット5体を追加：スカイボマー、スクラップドリル、クラッシャーオーガ、シージタートル、ボムキャリア。',
    'スカイボマーは4コスト・HP720の飛行建物特攻。速度58で接近し、射程75から1.6秒ごとに175ダメージの爆弾を投下します。',
    'スクラップドリルは4コスト・HP900。建物へ張り付くと90 DPSから始まり、1.5秒ごとに135→180→240 DPSへ上昇。離される・対象変更・スタンで初期化します。',
    'クラッシャーオーガは6コスト・HP2200・攻撃間隔3秒。同じ建物への一撃が230→310→390→470へ強化され、射程外・対象変更・スタンでリセットします。',
    'シージタートルは5コスト・HP2050。建物へ移動中は通常の遠距離攻撃・タワー射撃・レーザーを40%軽減し、攻撃中は甲羅を開いて軽減を失います。',
    'ボムキャリアは3コスト・HP430・速度88。建物へ到達すると480ダメージで自爆。途中で倒されても周囲の敵ユニットへ80ダメージの小爆発を残します。',
    'カード総数は44枚（39ユニット＋5呪文）。攻城ユニットの増幅・装甲・自爆状態同期に伴い physicsVersion を28へ更新しました。'
  ]},
  {version:'22.0.0',date:'2026-09-14',title:'TACTICAL FORCES UPDATE',items:[
    '新ユニット5体を追加：シールドナイト、ウィンドメイジ、フェニックス、グラビティオーブ、ミラージュアサシン。',
    'シールドナイトは4コスト・HP1400・盾耐久650。正面約120度からの通常攻撃の65%を盾で受け、35%だけ本体へ通します。スペル・継続ダメージ・横/背後攻撃は盾を無視します。',
    'ウィンドメイジは4コスト・HP570・攻撃95・射程175。地上/空中へ風弾を放ち、軽量な敵ほど大きく押し戻します。',
    'フェニックスは5コスト・HP900・攻撃130の飛行ユニット。最初に倒されるとHP600の卵を残し、4秒守ればHP450で一度だけ復活します。',
    'グラビティオーブは4コスト・HP540・攻撃60・射程165。半径60の重力弾で敵を着弾中心へ引き寄せます。',
    'ミラージュアサシンは3コスト・HP500・攻撃190。召喚完了後最大3秒ステルスし、初撃は1.4倍。範囲攻撃やスペルには巻き込まれます。',
    '新スペル「サイクロン」を追加。3コスト・半径130・3秒間。敵ユニットを中心へ吸い寄せ続け、外周10 / 中間20 / 中心35 DPSの少量ダメージを与えます。建物・タワーは吸引しません。',
    'カード総数は39枚（34ユニット＋5呪文）。位置操作・復活・ステルス・正面防御の同期追加に伴い physicsVersion を27へ更新しました。'
  ]},
  {version:'21.0.0',date:'2026-09-11',title:'LASER DRAGON UPDATE',items:[
    '新ユニット「レーザードラゴン」を追加。5コスト・HP1300・飛行・地上/空中攻撃・移動速度46・中距離射程145です。',
    'レーザードラゴンはレーザー塔と同じ増幅方式を採用。初期20 DPSから同じ対象へ1.5秒照射するごとに火力が倍化し、対象変更・射程外・スタンで初期値へ戻ります。',
    'スタン中は通常攻撃クールタイムが進行しないよう変更。スタン前の残り攻撃待ち時間を保持し、解除後に残り時間から再開します。ユニット・タワー・設置物に共通です。',
    'スタンによる攻撃クールタイムの完全リセットは行いません。スパーキー充電・レーザー増幅・ナイトシェイド突進など既存の特殊リセットは維持します。',
    'アップデート説明は UPDATE-HISTORY.html の1枚へ統合したまま維持し、physicsVersion を26へ更新しました。'
  ]},
  {version:'20.0.0',date:'2026-09-11',title:'ELECTRIC FORMATION UPDATE',items:[
    '新ユニット「エレキテルウィザード」を追加。4コスト・HP650・攻撃135・射程185・攻撃間隔2.4秒。地上から地上/空中へ狭い半径35の範囲雷を放ち、範囲内の敵ユニット全員を1秒スタンします。',
    'ゴブリン槍兵を投げ槍の遠距離兵へ変更。射程21→160となり、リーフ弓兵185より少し短く、マッドドラゴン78より長い位置から地上/空中へ攻撃します。',
    'ストームハーピーの攻撃間隔を1.25秒→2.0秒へ変更。一撃を強化し、連鎖ダメージを1体目180→2体目130→3体目90の固定減衰へ変更しました。各命中先への1秒スタンは維持します。',
    'アップデート説明は引き続き UPDATE-HISTORY.html の1枚へ統合し、バージョンごとのHTMLは増やしません。',
    '新ユニットと戦闘ロジック更新に伴い physicsVersion を25へ更新しました。'
  ]},
  {version:'19.4.0',date:'2026-09-11',title:'CONTROL & GOBLIN UPDATE',items:[
    '穴掘りティガーの対ユニット攻撃を120へ強化。タワー・ボルト砲台・レーザー塔など建物への1回ダメージは70に制限し、奇襲暗殺向けへ役割を明確化しました。',
    'フロストシャーマンを4コストから3コストへ変更し、氷弾を半径38の小範囲攻撃へ拡張。鈍足は3段階重複制になり、効果中の再被弾でLv1→Lv2→Lv3へ上昇、命中ごとに3秒へ更新します。',
    'フロスト鈍足はLv1/2/3で移動速度を80%/65%/50%へ低下。攻撃速度も90%/80%/70%へ段階的に低下します。',
    'ストームハーピーの連鎖雷に1秒スタンを追加。命中した最大3体それぞれへ、ザップと同じターゲット解除・レーザー増幅/スパーキー充電などのリセットを適用します。',
    'モスリング隊を「ゴブリン部隊」へ改名。前衛ゴブリン3体＋ゴブリン槍兵2体の5体混成編成へ変更しました。',
    '前衛ゴブリンの攻撃力は45→65。槍兵2体は旧モスリング相当のHP155・攻撃45・速度72・攻撃間隔0.8秒を維持し、地上と空中の両方を攻撃できます。',
    'アップデート説明HTMLをバージョンごとに増やす方式を廃止し、今後は UPDATE-HISTORY.html の1枚へ追記していく運用へ変更しました。',
    '戦闘ロジック更新に伴い physicsVersion を24へ更新しました。'
  ]},
  {version:'19.3.0',date:'2026-09-11',title:'SUMMON DELAY SYSTEM',items:[
    'ユニットカードに召喚準備時間を追加。低コストほど短く、高コストほど長くなり、1コスト0.4秒・2コスト0.5秒・3コスト0.7秒・4コスト0.9秒・5コスト1.2秒・6コスト1.5秒・7コスト1.8秒を基準にしました。',
    'ストーンゴーレムは重量級の特別枠として2.5秒、スパーキーは1.8秒。穴掘りティガーは地下移動そのものを召喚時間として扱い、新しい待機時間は追加しません。',
    '召喚中は移動・攻撃・索敵をせず、敵からターゲットにされず、スペルや範囲攻撃も含めて無敵です。当たり判定も無効なので無敵の壁としては使えません。',
    '召喚地点には陣営色の円・半透明シルエット・進行ゲージを表示。相手からも完成までの位置と残り時間を確認できます。',
    'ネクロマンサー、ダークネクロマンサー、ドスランボスの配置時召喚は、本体の召喚完了と同時に発動。能力で呼ばれた子分やゴーレム分裂体には追加の召喚待ち時間を付けません。',
    'ボルト砲台・レーザー塔も1タップで位置確定後に建設ゲージを開始。配置確認の追加タップは復活させず、操作テンポはv19.2のままです。',
    '召喚完了直後の密集でも重なりが残りにくいよう、衝突解決パスを6回から8回へ強化しました。',
    '召喚・当たり判定・オンライン同期ロジック更新に伴い physicsVersion を23へ更新しました。'
  ]},
  {version:'19.2.0',date:'2026-09-11',title:'PACK BALANCE & QUICK PLACE',items:[
    'ドスランボスを約14%小さくし、移動速度を66から40へ低下。配置直後にランボス3体を即召喚し、その後は10秒ごとに3秒停止して3体を追加召喚します。',
    'アイアンボアの攻撃力を178から160へ少し低下。建物特攻・チャージ・押しのけ性能は維持しています。',
    'ネクロマンサーの通常攻撃の範囲半径を54から45へ縮小。射程・攻撃力・ボーン召喚は変更ありません。',
    '穴掘りティガーの攻撃力を20から40へ強化し、攻撃間隔を0.82秒から1.1秒へ変更しました。',
    'ボルト砲台・レーザー塔など設置物のスマホ操作を2タップ確認式から1タップ即設置へ変更しました。',
    'バランスと対戦ロジック更新に伴い physicsVersion を22へ更新しました。'
  ]},
  {version:'19.1.0',date:'2026-09-11',title:'2D RAPTOR MODEL UPDATE',items:[
    'ドスランボスを3D由来の縦シルエットを持つ2Dスプライトへ描き直しました。頭・トサカ・尻尾が上からでも判別しやすくなっています。',
    '子分のランボスも同じ造形ルールで再設計し、ドスランボスと並べたときに親分子分の関係が見えるドット風モデルへ更新しました。',
    'ドスランボスの性能を案に合わせて調整。6コスト・HP1100・攻撃170・やや速い移動・やや遅い攻撃速度へ変更しました。',
    'ランボスは本体の約3分の1性能へ再調整し、HP360・攻撃58の軽量前衛として群れの圧力を担当します。',
    '見た目と性能の更新に合わせて physicsVersion を21へ更新しました。'
  ]},
  {version:'19.0.0',date:'2026-09-11',title:'RAPTOR PACK UPDATE',items:[
    '新ユニット「ドスランボス」を追加。7コスト・HP2100・攻撃210・移動68。地上のみを攻撃する高速前衛です。',
    'ドスランボスは10秒ごとに3秒足を止め、周囲へ「ランボス」3体を召喚します。召喚中は移動も攻撃も行いません。',
    'ランボスは隠し召喚ユニットで、HP700・攻撃70。見た目はドット風の青いラプターとして追加しました。',
    'カード総数を31枚（27ユニット＋4呪文）へ更新し、初期デッキにもドスランボスを採用しました。',
    '新ユニット追加に伴い physicsVersion を20へ更新しました。'
  ]},  {version:'18.3.0',date:'2026-09-11',title:'FIRST ATTACK LOCK',items:[
    '通常ユニットのターゲットロック開始タイミングを「索敵した瞬間」から「実際に最初の攻撃を行った瞬間」へ変更しました。',
    'まだ攻撃していない間は、その時点で索敵範囲内にいる最も近い攻撃可能な敵を毎フレーム再判定します。遠くの敵を追跡中でも、より近い敵が現れればそちらへ向き直ります。',
    '一度攻撃した後はv18.2と同じハードロックへ移行し、対象が撃破・攻撃対象外・ザップなどでリセットされるまで同じ相手を追跡します。',
    'ストーンゴーレム・ちびゴーレム・アイアンボアは従来どおり例外で、攻撃後もロックせず常に最寄りの敵建物を再判定します。タワー・防衛建物のロック方式も変更ありません。',
    '新しい追跡切替で密集時の経路が変わるため、衝突解決を1パス強化して敵同士の重なりを抑えています。'
  ]},
  {version:'18.2.0',date:'2026-09-11',title:'TARGET LOCK TACTICS',items:[
    '通常ユニットをターゲットロック式へ変更。一度索敵範囲で敵を捕捉すると、より近い敵が現れても同じ対象を追い続けます。',
    '通常ユニットのロックは対象撃破・攻撃対象外化・ザップなどの強制リセットで解除。攻撃射程や索敵範囲から離れただけでは解除せず、その対象を追跡します。',
    'ストーンゴーレム・ちびゴーレム・アイアンボアなど建物特攻ユニットは例外で、敵兵を無視しながら常に現在地から最も近い敵建物を再判定します。位置関係によってサイドタワー、防衛建物、中央本拠地へ誘導できます。',
    'タワー・ボルト砲台・レーザー塔の既存ターゲットロック仕様は維持。ザップは通常ユニットのロックも解除して、スタン終了後に新しい対象を選ばせます。'
  ]},
  {version:'18.1.0',date:'2026-09-10',title:'DETAIL DEMO RENDER FIX',items:[
    'スパーキーのLIVE BATTLE DEMOで初回砲撃後に描画が崩れ、戦場が斜めに重なって表示される不具合を修正しました。',
    'スパーキー弾の電撃エフェクトが未定義の時間変数を参照していたため、drawArenaのtimeへ統一しました。',
    '各フレームの開始時にCanvas変形を初期化し、投射物描画は必ずrestoreされるよう保護して、詳細画面を開き直したり別キャラへ移動しても正常描画へ復帰するようにしました。'
  ]},
  {version:'18.0.0',date:'2026-09-10',title:'LONGSHOT & VOLTAGE',items:[
    '新ユニット「プリンセスアーチャー」を追加。3コスト・HP300・攻撃275・3秒間隔。地上/空中へ半径70の範囲攻撃を行い、射程350で橋を渡らず敵サイドタワーを狙えます。',
    '新スペル「ザップ」を追加。2コスト・半径78・225ダメージ・1.5秒スタン。攻撃対象を解除し、レーザー塔の増幅とスパーキーの充電もリセットします。',
    '新ユニット「スパーキー」を追加。6コスト・HP1500・地上のみ・攻撃1200・半径90。敵がいなくても常時3.5秒充電し、満充電後は射程145で一撃を放ちます。',
    'ルーン術師を4→3コスト、リーフ弓兵を3→2コストへ変更。クラッグバーサーカーの攻撃間隔を1.6→1.8秒へ少し遅くしました。'
  ]},
  {version:'17.1.0',date:'2026-09-10',title:'SUMMONER BALANCE & DECK UI',items:[
    'ネクロマンサーの定期召喚を6秒ごとから7.5秒ごとへ、ダークネクロマンサーを5秒ごとから6.5秒ごとへ調整。配置直後の召喚は維持。',
    'デッキ編集の説明文を省き、8 / 8 選択中と平均コストを同じ1行へ整理。選択数表示も平均コストと同程度の文字サイズへ調整。'
  ]},
  {version:'17.0.0',date:'2026-09-10',title:'SUMMONERS UPDATE',items:[
    '新ユニット「ネクロマンサー」を追加。6コスト・HP1350・地上/空中への範囲攻撃。配置直後にボーン3体、その後6秒ごとに3体を召喚します。',
    '新ユニット「ダークネクロマンサー」を追加。5コスト・HP1150・地上のみを攻撃。配置直後にコウモリ2体、その後5秒ごとに2体を召喚します。',
    '新カード「アッシュ部隊」を追加。5コストで既存アッシュ剣士3体を、敵方向へ前1体・後ろ2体の三角陣形で展開します。',
    '3枚ともカード詳細に本番エンジンの専用LIVE BATTLE DEMOを追加。ネクロ系は初回召喚と定期召喚、アッシュ部隊は三角陣形から後衛へ突入する動きを確認できます。'
  ]},
  {version:'16.4.0',date:'2026-09-10',title:'ABILITY DEMO & BALANCE',items:[
    '穴掘りティガーの攻撃力を15から20へ少し強化。地下移動・HP・コストはそのままです。',
    'ムーンバットの出現数を3体から4体へ増加。1体あたりのHP145・攻撃46・コスト2は維持します。',
    '特殊能力持ちカードのLIVE BATTLE DEMOを能力専用シチュエーションへ刷新。能力が実際に発動する配置・相手・HPからAUTO実演します。',
    'ストーンゴーレムは敵タワー前の瀕死状態から死亡爆発→周囲のボーン隊とタワーへダメージ→ちびゴーレム2体へ分裂。マッドドラゴンは高HPのアイアン衛士へ泥沼を当て、30%減速と継続ダメージまで見せます。'
  ]},
  {version:'16.3.0',date:'2026-09-10',title:'MY LIST & LIVE DEMO FIX',items:[
    'マイリスト保存を修正。名前入力を待たず「マイデッキ 1」などの自動名で即保存し、保存後に名前変更できる方式へ変更しました。',
    'マイリストは保存直後にストレージへ書き込めたか検証し、失敗時は明確なエラーを表示。再読み込み後も保存デッキを復元します。',
    'カード詳細の簡易アニメーションを廃止し、ゲーム本体と同じ戦闘エンジン・ユニット・攻撃・エフェクトを使うLIVE BATTLE DEMOへ変更。',
    '詳細デモはカードごとに能力が見えやすい相手と配置を自動構成し、実際の戦場でAUTO戦闘をループ再生します。'
  ]},
  {version:'16.2.0',date:'2026-09-10',title:'DECK BUILDER UPDATE',items:[
    'デッキ編集のカード一覧をPC・スマホとも3列固定へ変更。画面幅に合わせてカード自体の大きさと文字量を自動調整します。',
    'カードをタップしても即デッキ変更せず、「デッキに入れる / 外す」と「詳細を見る」を選べるアクションメニューを追加。8枚時はその場で交換相手を選べます。',
    'カード詳細にステータス・能力説明・ループ再生のミニデモを追加。新しいカードの動きや攻撃方法をデッキ編集中に確認できます。',
    '最大10個の8枚デッキを保存できるマイリストを追加。保存・呼び出し・名前変更・上書き・削除に対応し、選択中デッキはスクロールしても追従します。'
  ]},
  {version:'16.1.0',date:'2026-09-10',title:'SPELL TEAM COLORS',items:[
    '全スペル共通の陣営カラーを導入。自分が発動したスペルは青、相手が発動したスペルは赤で表示します。',
    'ファイヤーボールは着弾予告・飛翔中の外周光・爆発の衝撃波を陣営色に統一。炎本体のオレンジ色は維持します。',
    '矢の雨は着弾予告・矢の軌跡・着弾エフェクト、ポイズントラップは設置範囲・毒エリア・残留毒表示を陣営色へ変更。',
    '色だけに依存しないよう、自分のスペル範囲は実線、相手のスペル範囲は点線で表示します。オンラインでも各プレイヤーの画面で「青＝自分 / 赤＝相手」になります。'
  ]},
  {version:'16.0.0',date:'2026-09-10',title:'BALANCE & MOBILE FIX',items:[
    'マッドドラゴンのHPを2000から1600へ低下。射程78・攻撃200・範囲攻撃・泥沼性能は維持。',
    '吹き矢ゴブリンの射程を220から195へ短縮。タワーの反撃圏外から一方的にタワーを攻撃できないよう実効射程を調整。',
    'スマホの設置物操作を修正。1回目のタップで決めた設置候補を、指を離したりpointerleaveが発生しても保持します。',
    'ボルト砲台・レーザー塔はスマホで「1回目＝位置と射程を確認 / 2回目＝設置」に統一。2回目は約24px以内を同じ地点として扱います。'
  ]},
  {version:'15.0.0',date:'2026-09-09',title:'LONG RANGE & LASER',items:[
    'マッドドラゴンの攻撃射程を155から78へ短縮。範囲攻撃・泥沼性能は維持。',
    '穴掘りティガーの攻撃を30から15へ低下し、地下移動時間を約0.9〜2.8秒へ延長。',
    '新ユニット「吹き矢ゴブリン」を追加。3コスト・HP240・攻撃110・0.5秒間隔の超長射程対空射手。',
    '新設置物「レーザー塔」を追加。5コスト・HP2000。同じ敵を1.5秒ごとに照射し続けるほど火力が倍化し、対象変更時に初期火力へ戻ります。'
  ]},
  {version:'14.0.0',date:'2026-09-09',title:'UNDERGROUND & MUD',items:[
    '新ユニット「穴掘りティガー」を追加。戦場の任意の地上地点へ地下移動し、潜行中は攻撃対象外になります。',
    'ティガーは自軍中央本拠地から出発し、遠い場所ほど到着まで時間がかかります。',
    '新ユニット「マッドドラゴン」を追加。地上・空中への範囲攻撃と、地上兵だけに効く2秒間の泥沼を生成します。',
    '泥沼は30ダメージの継続攻撃と30%移動低下を与え、重複時はダメージ・減速を加算せず効果時間だけ更新します。'
  ]},
  {version:'13.0.0',date:'2026-09-09',title:'TARGET LOCK',items:[
    '左右タワー・中央本拠地・ボルト砲台をターゲットロック式へ変更。',
    'ロック解除は「対象撃破」「射程外」「攻撃対象ではなくなった」の3条件のみ。',
    'より近い敵が途中で入ってきても、現在の対象が有効な間は攻撃先を変更しません。',
    '上部メニューに「アプデ情報」を追加し、直近7日のパッチノートをゲーム内で確認可能にしました。'
  ]},
  {version:'12.0.0',date:'2026-09-09',title:'EIGHT CARD DECK',items:[
    'デッキを6枚から8枚へ拡張。手札は4枚のまま、待機カードは4枚になりました。',
    'デッキ編集・ホーム・待機室へ平均エネルギーコストを追加。',
    'ボーンスウォームを12体・1体HP45へ再調整。',
    '砲台など設置物の配置前に攻撃射程を表示するプレビューを追加。'
  ]},
  {version:'11.0.0',date:'2026-09-09',title:'SWARM & SPELLS',items:[
    '大型単体に強い群体ユニット「ボーンスウォーム」を追加。',
    '即時設置の継続毒「ポイズントラップ」と、広範囲の「矢の雨」を追加。',
    'サイドタワー1本破壊時は破壊レーン＋中央細帯、2本破壊時は敵陣前半を横幅100%配置可能に変更。'
  ]},
  {version:'10.0.0',date:'2026-09-09',title:'BALANCE PASS',items:[
    'ボルト砲台を3コスト、アイアン衛士を3コスト、アッシュ剣士を2コストへ調整。',
    'クラッグバーサーカーを7コスト・HP2450・攻撃465へ強化。'
  ]},
  {version:'9.0.0',date:'2026-09-09',title:'KRAGG ARRIVES',items:[
    '6コスト重量アタッカーとしてクラッグバーサーカーを追加（後にv10で再調整）。',
    'ストーンゴーレムHPを2850へ低下、アイアン衛士のコストを引き下げ。'
  ]},
  {version:'8.0.0',date:'2026-09-09',title:'FIREBALL & GOLEM SPLIT',items:[
    'ファイヤーボールを追加。距離で着弾時間が変わる偏差撃ち呪文として実装。',
    'ストーンゴーレム死亡時にちびゴーレム2体へ分裂し、本体・ちび双方に死亡時範囲ダメージを追加。'
  ]},
  {version:'7.0.0',date:'2026-09-09',title:'FRONTLINE & DORMANT CORE',items:[
    'タワーHPを1.2倍へ増加。中央本拠地は休眠し、被弾またはサイドタワー破壊で起動する仕様へ。',
    'サイドタワー破壊後の前線配置を導入し、ナイトシェイドの索敵範囲を縮小。'
  ]}
]);

const el=id=>document.getElementById(id);
const views=['home','lobby','battle'];
let currentView='home',selected=null,hover=null,pendingBuildingPlacement=null,inspectId='blade',snapshot=null,previous=null,receivedAt=0;
let room=null,seat=0,session=null,socket=null,socketGeneration=0,connected=false,retryTimer=null,retries=0,pingTimer=null;
let localGame=null,localTimer=null,lastLocal=0,localPaused=false,gameMode=null,difficulty='normal',entryTab='create';
let demoGame=createMatch({seed:48164,bot:true}),demoLast=0,demoAutoAt=0,animationLast=0;
let handSignature='',memberSignature='',lobbyCode='',previousPhase='',soundOn=false,audio=null,toastTimer;
let serverAvailable=false,apiChecked=false,onlineBusy=false;
let physicsOverlay=false,rosterBack=false,incompatibleVersion=false,editingDeck=[],deckPresets=[],deckActionId=null,detailCardId=null,detailDemoGame=null,detailDemoLast=0,detailDemoDuration=9,detailDemoScenarioKey='standard',detailDemoEvidence={};
let deckDrag=null,deckDragClickBlockUntil=0;
const standalone=!!window.TINY_OFFLINE||location.protocol==='file:';
function safeStorage(store,key,value){
  try{const storage=store==='session'?window.sessionStorage:window.localStorage;
    if(value===undefined)return storage.getItem(key);if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{}
  return null;
}
const remembered=safeStorage('local','tiny-name');if(remembered)el('nickname').value=remembered;
soundOn=safeStorage('local','tiny-sound')==='true';
function migrateDeck(raw){
  const out=[];
  if(Array.isArray(raw))for(const id of raw){if(typeof id==='string'&&DECK.includes(id)&&!out.includes(id))out.push(id);if(out.length===MAX_DECK)break;}
  for(const source of [DEFAULT_DECK,DECK])for(const id of source){if(out.length>=MAX_DECK)break;if(!out.includes(id))out.push(id);}
  return normalizeDeck(out);
}
function loadDeck(){
  try{const raw=JSON.parse(safeStorage('local','tiny-deck-v21')||safeStorage('local','tiny-deck-v20')||safeStorage('local','tiny-deck-v19')||safeStorage('local','tiny-deck-v18')||safeStorage('local','tiny-deck-v17')||safeStorage('local','tiny-deck-v16')||safeStorage('local','tiny-deck-v15')||safeStorage('local','tiny-deck-v14')||safeStorage('local','tiny-deck-v13')||safeStorage('local','tiny-deck-v12')||safeStorage('local','tiny-deck-v11')||safeStorage('local','tiny-deck-v10')||safeStorage('local','tiny-deck-v9')||safeStorage('local','tiny-deck-v8')||safeStorage('local','tiny-deck-v7')||safeStorage('local','tiny-deck-v6')||safeStorage('local','tiny-deck-v5')||safeStorage('local','tiny-deck-v4')||safeStorage('local','tiny-deck-v3')||'null');return migrateDeck(raw);}catch{return [...DEFAULT_DECK];}
}
let playerDeck=loadDeck();
const MYLIST_KEY='tiny-deck-presets-v27',LEGACY_MYLIST_KEYS=['tiny-deck-presets-v26','tiny-deck-presets-v25','tiny-deck-presets-v24','tiny-deck-presets-v23','tiny-deck-presets-v22','tiny-deck-presets-v21','tiny-deck-presets-v20','tiny-deck-presets-v19','tiny-deck-presets-v18','tiny-deck-presets-v17','tiny-deck-presets-v16'],MAX_MYLIST=10;
function storageFor(store='local'){return store==='session'?window.sessionStorage:window.localStorage;}
function verifiedStorageWrite(store,key,value){
  try{const storage=storageFor(store);storage.setItem(key,value);return storage.getItem(key)===value;}catch{return false;}
}
function normalizePresetList(raw){
  const source=Array.isArray(raw)?raw:Array.isArray(raw?.presets)?raw.presets:[];
  const out=[];for(const [i,item] of source.entries()){const cards=Array.isArray(item?.cards)?migrateDeck(item.cards):null;if(!cards)continue;const name=String(item?.name||`マイデッキ ${i+1}`).trim().slice(0,24)||`マイデッキ ${i+1}`;out.push({id:String(item?.id||`preset-${Date.now()}-${i}`),name,cards:[...cards]});if(out.length>=MAX_MYLIST)break;}return out;
}
function loadDeckPresets(){
  for(const key of [MYLIST_KEY,...LEGACY_MYLIST_KEYS])for(const store of ['local','session']){
    try{const text=safeStorage(store,key);if(!text)continue;const parsed=JSON.parse(text),out=normalizePresetList(parsed);if(out.length||Array.isArray(parsed)||Array.isArray(parsed?.presets))return out;}catch{}
  }
  return [];
}
deckPresets=loadDeckPresets();
function persistDeckPresets(){
  const payload=JSON.stringify({schema:1,version:VERSION,presets:deckPresets});
  if(verifiedStorageWrite('local',MYLIST_KEY,payload)){safeStorage('session',MYLIST_KEY,null);return {ok:true,persistent:true};}
  if(verifiedStorageWrite('session',MYLIST_KEY,payload))return {ok:true,persistent:false};
  return {ok:true,persistent:false,memoryOnly:true};
}
function nextPresetName(){
  const used=new Set(deckPresets.map(p=>p.name));for(let i=1;i<=MAX_MYLIST+1;i++){const name=`マイデッキ ${i}`;if(!used.has(name))return name;}return `マイデッキ ${deckPresets.length+1}`;
}
function persistDeck(){safeStorage('local','tiny-deck-v21',JSON.stringify(playerDeck));renderDeckSummaries();}
function averageDeckCost(deck){if(!Array.isArray(deck)||!deck.length)return 0;return deck.reduce((sum,id)=>sum+(UNITS[id]?.cost||0),0)/deck.length;}
function formatAverage(deck){return `◆ ${averageDeckCost(deck).toFixed(1)}`;}
function deckReady(deck=playerDeck){return Array.isArray(deck)&&deck.length===MAX_DECK&&new Set(deck).size===MAX_DECK&&deck.every(id=>DECK.includes(id));}
function sound(kind='place'){
  if(!soundOn)return;
  try{
    audio??=new(window.AudioContext||window.webkitAudioContext)();audio.resume();
    const a=audio.currentTime;
    for(const [i,f] of (kind==='win'?[392,523,659,784]:kind==='start'?[440,660]:kind==='place'?[350,500]:[180,140]).entries()){
      const osc=audio.createOscillator(),gain=audio.createGain();osc.type='triangle';osc.frequency.value=f;
      osc.connect(gain);gain.connect(audio.destination);gain.gain.setValueAtTime(.0001,a+i*.09);gain.gain.exponentialRampToValueAtTime(.055,a+i*.09+.01);gain.gain.exponentialRampToValueAtTime(.0001,a+i*.09+.14);
      osc.start(a+i*.09);osc.stop(a+i*.09+.15);
    }
  }catch{}
}
function toast(text){el('toast').textContent=text;el('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('toast').hidden=true,3300);}
function status(text,warn=false){el('connection').innerHTML='<i></i>';el('connection').append(document.createTextNode(text));el('connection').classList.toggle('warn',warn);}
function showView(id){
  if(currentView===id)return;
  currentView=id;views.forEach(v=>el(v).hidden=v!==id);
  document.body.classList.toggle('playing',id==='battle');
  el('footer').hidden=id==='battle';
  if(id!=='battle'){selected=null;hover=null;pendingBuildingPlacement=null;}
  window.scrollTo({top:0,behavior:'instant'});
}
function inputName(){
  const name=el('nickname').value.trim();
  if(!name||[...name].length>16)throw new Error('名前を1〜16文字で入力してください。');
  safeStorage('local','tiny-name',name);return name;
}
function entryError(text){el('entryError').textContent=text;el('entryError').hidden=!text;}
function setOnlineBusy(b){
  onlineBusy=b;el('onlineBtn').disabled=b||standalone||incompatibleVersion;
  el('onlineBtn').textContent=b?'接続しています…':entryTab==='create'?'対戦ルームを作る ＋':'ルームに参加する ↗';
}
async function api(path,options={}){
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),15000);
  try{
    const r=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers},cache:'no-store',signal:ac.signal});
    let b;try{b=await r.json();}catch{throw new Error('APIから応答がありません。サーバー込みで公開されているか確認してください。');}
    if(!r.ok||b.ok===false)throw new Error(b.error||`接続エラー (${r.status})`);return b;
  }finally{clearTimeout(t);}
}
el('entryTabs').addEventListener('click',e=>{
  const b=e.target.closest('[data-tab]');if(!b)return;
  entryTab=b.dataset.tab;
  for(const btn of el('entryTabs').children)btn.classList.toggle('active',btn===b);
  el('passField').hidden=entryTab!=='join';el('createHint').hidden=entryTab==='join';entryError('');setOnlineBusy(false);
});
el('difficulty').addEventListener('click',e=>{
  const b=e.target.closest('[data-level]');if(!b)return;
  difficulty=b.dataset.level;for(const btn of el('difficulty').children)btn.classList.toggle('active',btn===b);
});
el('roomPass').addEventListener('input',()=>el('roomPass').value=el('roomPass').value.replace(/\D/g,'').slice(0,6));
el('onlineBtn').addEventListener('click',async()=>{
  if(onlineBusy||incompatibleVersion)return;
  try{
    entryError('');const name=inputName();setOnlineBusy(true);
    const code=el('roomPass').value;
    if(entryTab==='join'&&!/^\d{6}$/.test(code))throw new Error('6桁の数字PASSを入力してください。');
    const r=await api(entryTab==='create'?'/api/rooms':`/api/rooms/${code}/join`,{method:'POST',body:JSON.stringify({name})});
    session={code:r.code,seat:r.seat,token:r.token};seat=r.seat;
    safeStorage('session','tiny-session',JSON.stringify(session));gameMode='online';connect();
  }catch(e){entryError(e.name==='AbortError'?'接続がタイムアウトしました。再試行してください。':e.message);}
  finally{setOnlineBusy(false);}
});
function connect(){
  if(!session)return;
  clearTimeout(retryTimer);clearInterval(pingTimer);
  const generation=++socketGeneration;try{socket?.close();}catch{}
  status(retries?'再接続しています…':'接続しています…',true);
  const base=location.protocol==='https:'?'wss:':'ws:';
  socket=new WebSocket(`${base}//${location.host}/api/rooms/${session.code}/socket`);
  const mine=socket;
  mine.addEventListener('open',()=>{
    if(generation!==socketGeneration)return;
    mine.send(JSON.stringify({type:'hello',token:session.token}));
    pingTimer=setInterval(()=>{if(mine.readyState===1)mine.send(JSON.stringify({type:'ping',at:Date.now()}));},15000);
  });
  mine.addEventListener('message',e=>{
    if(generation!==socketGeneration)return;
    let m;try{m=JSON.parse(e.data);}catch{return;}
    if(m.type==='welcome'){connected=true;retries=0;seat=m.seat;status('オンライン接続中');return;}
    if(m.type==='state'){
      connected=true;room=m;seat=m.seat;status('オンライン接続中');
      if(m.game){
        showView('battle');el('matchType').textContent='PRIVATE ONLINE · 1V1';gameMode='online';
        acceptSnapshot(m.game);updateHUD();
      }else{snapshot=null;showView('lobby');renderLobby();}
      return;
    }
    if(m.type==='error'){toast(m.error);if(currentView==='home')entryError(m.error);return;}
    if(m.type==='placed'){const placedName=UNITS[m.card]?.building?UNITS[m.card].name:null;selected=null;hover=null;pendingBuildingPlacement=null;sound('place');if(placedName)toast(`${placedName}を設置しました。`);updateHand();return;}
    if(m.type==='auth-error'||m.type==='expired'){toast(m.error);resetConnection();showView('home');return;}
    if(m.type==='left'){resetConnection();showView('home');return;}
    if(m.type==='pong')el('battleConnection').textContent=`ONLINE · ${Math.max(0,Date.now()-m.at)}ms`;
  });
  mine.addEventListener('close',e=>{
    if(generation!==socketGeneration)return;
    connected=false;clearInterval(pingTimer);
    if(e.code===4001){toast('別のタブで接続されました。この画面は退出しました。');resetConnection();showView('home');return;}
    if(e.code===4003||e.code===4004){toast('接続を復元できません。名前とPASSで参加し直してください。');resetConnection();showView('home');return;}
    status('切断・再接続中',true);updateHUD();
    if(session){retries++;retryTimer=setTimeout(connect,Math.min(5000,500*2**Math.min(retries,4)));}
  });
  mine.addEventListener('error',()=>{status('接続できません・再試行中',true);});
}
function send(m){
  if(!socket||socket.readyState!==1||!connected){toast('接続を待っています。');return false;}
  socket.send(JSON.stringify(m));return true;
}
function resetConnection(){
  session=null;room=null;connected=false;socketGeneration++;clearTimeout(retryTimer);clearInterval(pingTimer);
  safeStorage('session','tiny-session',null);try{socket?.close(1000);}catch{}socket=null;status(serverAvailable?'オンライン対応':'CPU練習が使えます');
}
function leaveOnline(){
  if(connected)send({type:'leave'});
  resetConnection();snapshot=null;gameMode=null;selected=null;showView('home');
}
function renderLobby(){
  if(!room)return;
  const sig=JSON.stringify([room.members,room.host,room.seat]);
  if(sig!==memberSignature){
    memberSignature=sig;el('members').replaceChildren();
    for(let i=0;i<2;i++){
      const p=room.members[i],box=document.createElement('div');box.className='member'+(p?.ready?' ready':'')+(!p?' empty':'');
      const avatar=document.createElement('span');avatar.className='member-avatar';avatar.textContent=p?[...p.name][0]:'+';
      const text=document.createElement('div'),name=document.createElement('strong'),sub=document.createElement('small');
      name.textContent=p?(p.name+(p.seat===seat?' · あなた':'')):'対戦相手を待っています';
      sub.textContent=p?(p.connected?`${p.seat===room.host?'ホスト':'メンバー'} · デッキ ${p.seat===seat?playerDeck.length:(p.deckCount||0)}/${MAX_DECK}`:'接続を待っています'):'同じPASSで参加';
      text.append(name,sub);box.append(avatar,text);
      if(p?.ready){const b=document.createElement('em');b.textContent='✓ OK';box.append(b);}
      el('members').append(box);
    }
  }
  const mine=room.members[seat];el('readyBtn').textContent=mine?.ready?'準備OKを取り消す':'準備OK';
  el('startBtn').hidden=seat!==room.host;
  el('startBtn').disabled=!room.members.every(p=>p?.ready&&p?.connected);
  if(lobbyCode!==room.code){
    lobbyCode=room.code;el('inviteCode').textContent=room.code;el('inviteURL').value=location.origin+'/';
  }
  renderDeckSummaries();
  el('lobbyDeckBtn').disabled=!!mine?.ready;
}
el('readyBtn').addEventListener('click',()=>{const next=!room?.members[seat]?.ready;if(next&&!deckReady()){openDeckEditor();toast('対戦には8枚のデッキが必要です。');return;}send({type:'ready',ready:next,deck:next?[...playerDeck]:undefined});});
el('startBtn').addEventListener('click',()=>send({type:'start'}));
el('leaveLobby').addEventListener('click',leaveOnline);
async function copyText(text){
  try{await navigator.clipboard.writeText(text);toast('コピーしました。');}
  catch{
    const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.top='0';document.body.append(area);area.select();
    try{if(!document.execCommand('copy'))throw new Error();toast('コピーしました。');}catch{toast('自動コピーできませんでした。URLとPASSを選択してコピーしてください。');}area.remove();
  }
}
el('copyPass').onclick=()=>copyText(room?.code||'');
el('copyInvite').onclick=()=>copyText(`TINY SIEGEで対戦しよう！\n${location.origin}/\nPASS: ${room?.code||''}`);

function startPractice(){
  let name;try{name=inputName();}catch(e){entryError(e.message);return;}
  if(session)leaveOnline();
  clearInterval(localTimer);gameMode='cpu';seat=0;room=null;previous=null;previousPhase='';handSignature='';
  if(!deckReady()){openDeckEditor();entryError('対戦には8枚のデッキが必要です。');return;}
  localGame=createMatch({seed:crypto.getRandomValues(new Uint32Array(1))[0],bot:true,difficulty,decks:[playerDeck,DEFAULT_DECK]});
  snapshot=viewMatch(localGame,0);selected=null;hover=null;pendingBuildingPlacement=null;localPaused=false;
  el('matchType').textContent='CPU PRACTICE · '+({easy:'EASY',normal:'NORMAL',hard:'HARD'}[difficulty]);
  el('ownName').textContent=name;el('enemyName').textContent='CPU · '+({easy:'やさしい',normal:'ふつう',hard:'手ごわい'}[difficulty]);
  showView('battle');status('CPU練習中');lastLocal=performance.now();
  localTimer=setInterval(()=>{
    const now=performance.now();
    localPaused=document.hidden||el('helpModal').open||el('libraryModal').open||el('updatesModal').open||el('deckModal').open;
    if(!localPaused&&localGame&&localGame.phase!=='ended'){
      tick(localGame,.1);acceptSnapshot(viewMatch(localGame,0));
    }
    lastLocal=now;updateHUD();
  },100);
  updateInspector('blade');acceptSnapshot(snapshot);sound('start');
}
el('practiceBtn').addEventListener('click',startPractice);
function stopPractice(){clearInterval(localTimer);localTimer=null;localGame=null;snapshot=null;gameMode=null;selected=null;hover=null;pendingBuildingPlacement=null;showView('home');status(serverAvailable?'オンライン対応':'CPU練習が使えます');}
function acceptSnapshot(g){
  previous=snapshot;snapshot=g;receivedAt=performance.now();
  if(previousPhase!==g.phase){
    if(g.phase==='battle')sound('start');
    if(g.phase==='ended')sound(g.winner===seat?'win':'lose');
    previousPhase=g.phase;
  }
  if(selected&&!g.hand.includes(selected)){selected=null;hover=null;pendingBuildingPlacement=null;}
  updateHUD();
}
function updateHUD(){
  const g=snapshot;if(!g||currentView!=='battle')return;
  const remain=Math.max(0,Math.ceil((g.overtime?240:180)-g.time));
  el('clock').textContent=`${Math.floor(remain/60)}:${String(remain%60).padStart(2,'0')}`;el('clock').classList.toggle('overtime',g.overtime);
  el('energyMode').textContent=g.time>=120?'×2':'×1';
  el('energyValue').textContent=Math.floor(g.energy);
  const energyBars=el('energyTrack').children;
  for(let i=0;i<10;i++)energyBars[i].firstChild.style.width=`${clamp(g.energy-i,0,1)*100}%`;
  el('nextCard').textContent='NEXT '+UNITS[g.next].short;
  el('ownScore').textContent=g.scores[seat];el('enemyScore').textContent=g.scores[1-seat];
  if(gameMode==='online'&&room){
    el('ownName').textContent=room.members[seat]?.name||'YOU';
    el('enemyName').textContent=room.members[1-seat]?.name||'対戦相手';
    el('battleConnection').textContent=connected?'ONLINE · LIVE':'再接続中';
  }else el('battleConnection').textContent='CPU練習 · LOCAL';
  updateHand();
  const paused=gameMode==='online'?(!connected?{seconds:45}:room?.paused):localPaused;
  el('pausedOverlay').hidden=!paused||g.phase==='ended';
  el('pausedTitle').textContent=gameMode==='online'?'再接続を待っています':'一時停止中';
  if(paused)el('pausedText').textContent=gameMode==='online'?`通信復帰を待っています。残り ${paused.seconds??45} 秒`:'説明を閉じるとCPU戦を再開します。';
  el('countdownOverlay').hidden=g.phase!=='countdown'||!!paused;
  el('countdownNum').textContent=Math.max(1,Math.ceil(g.countdown));
  el('resultOverlay').hidden=g.phase!=='ended';
  if(g.phase==='ended'){
    const draw=g.winner===null,win=g.winner===seat;
    el('resultLabel').textContent=draw?'DRAW':win?'VICTORY':'DEFEAT';
    el('resultTitle').textContent=draw?'引き分け':win?'勝利！':'また挑もう。';
    el('resultReason').textContent=g.reason;el('resultStats').textContent=`${g.scores[seat]} : ${g.scores[1-seat]}`;
    el('rematchBtn').textContent=gameMode==='cpu'?'もう一度対戦':seat===room?.host?'再戦の待機ルームへ':'ホストの再戦操作を待っています';
    el('rematchBtn').disabled=gameMode==='online'&&seat!==room?.host;
  }
  el('battleHint').textContent=selected?(()=>{const d=UNITS[selected];if(!d.spell){if(d.tunnelAnywhere)return `${d.name}：戦場の好きな地上地点を指定 / コスト ${d.cost}。自軍本拠地から地下移動し、遠いほど到着が遅れます。`;if(d.building)return `${d.name}を配置 / 必要エナジー ${d.cost}。置きたい場所を1回タップすると即設置します。`;return `${d.name}を配置 / 必要エナジー ${d.cost}`;}if(d.spell==='poison')return `${d.name}：地点を指定すると8秒間展開 / コスト ${d.cost}。範囲内へ毎秒ダメージを与えます。`;if(d.spell==='lightning')return `${d.name}：半径${d.radius}内のHPが高い敵を最大${d.maxTargets||4}体へ即時落雷 / コスト ${d.cost}。`;if(d.spell==='cyclone')return `${d.name}：地点を指定すると半径${d.radius}の渦を${d.zoneDuration}秒展開 / コスト ${d.cost}。敵を中心へ吸い寄せます。`;if(d.spell==='arrowrain')return `${d.name}：広い着弾地点を指定 / コスト ${d.cost}。ファイヤーボールより速く届きます。`;return `${d.name}：着弾地点を指定 / コスト ${d.cost}。遠いほど着弾が遅れます。`;})():'カードを選択。長押しで対ユニット/対タワーDMGを確認できます。片塔破壊はそのレーン＋中央細帯、両塔破壊後は敵陣前半を横いっぱい使えます。';
}
for(let i=0;i<10;i++){const seg=document.createElement('i'),fill=document.createElement('b');seg.append(fill);el('energyTrack').append(seg);}
function choose(id){
  if(!snapshot||snapshot.phase==='ended')return;
  selected=selected===id?null:id;hover=null;pendingBuildingPlacement=null;updateInspector(id);updateHand();
}
const HOLD_DAMAGE_MS=430;
function hideCardDamagePopups(except=null){
  for(const pop of el('hand').querySelectorAll('.card-damage-pop.show'))if(pop!==except)pop.classList.remove('show');
}
function buildCardDamagePopup(id){
  const d=UNITS[id],info=cardDamageInfo(d),pop=document.createElement('span');pop.className='card-damage-pop';
  const title=document.createElement('b');title.textContent='DAMAGE';
  const unitRow=document.createElement('span'),unitLabel=document.createElement('small'),unitValue=document.createElement('strong');
  unitLabel.textContent='対ユニット';unitValue.textContent=info.unit;unitRow.append(unitLabel,unitValue);
  const towerRow=document.createElement('span'),towerLabel=document.createElement('small'),towerValue=document.createElement('strong');
  towerLabel.textContent='対タワー';towerValue.textContent=info.tower;towerRow.append(towerLabel,towerValue);
  pop.append(title,unitRow,towerRow);return pop;
}
function updateHand(){
  if(!snapshot)return;
  const sig=snapshot.hand.join('|');
  if(sig!==handSignature){
    handSignature=sig;el('hand').replaceChildren();
    snapshot.hand.forEach((id,i)=>{
      const b=document.createElement('button');b.className='card';b.dataset.card=id;b.setAttribute('aria-label',`${i+1} ${UNITS[id].name} コスト${UNITS[id].cost}`);
      const can=document.createElement('canvas');can.width=120;can.height=120;can.dataset.portrait=id;
      const cost=document.createElement('span');cost.className='cost';cost.textContent=UNITS[id].cost;
      const name=document.createElement('span');name.className='card-name';name.textContent=UNITS[id].short;
      const key=document.createElement('span');key.className='shortcut';key.textContent=i+1;
      const damagePop=buildCardDamagePopup(id);
      b.append(cost,key,can,name,damagePop);el('hand').append(b);
      let startPoint=null,dragged=false,holdTimer=null,holdShown=false,selectedBeforeHold=null;
      const clearHold=()=>{if(holdTimer){clearTimeout(holdTimer);holdTimer=null;}};
      const closeDamage=()=>{damagePop.classList.remove('show');holdShown=false;};
      b.addEventListener('pointerdown',e=>{
        e.preventDefault();hideCardDamagePopups(damagePop);selectedBeforeHold=selected;selected=id;hover=null;pendingBuildingPlacement=null;updateInspector(id);updateHand();
        startPoint={x:e.clientX,y:e.clientY};dragged=false;holdShown=false;b.setPointerCapture(e.pointerId);
        clearHold();holdTimer=setTimeout(()=>{if(!startPoint||dragged)return;holdShown=true;selected=selectedBeforeHold;hover=null;pendingBuildingPlacement=null;updateHand();damagePop.classList.add('show');navigator.vibrate?.(8);},HOLD_DAMAGE_MS);
      });
      b.addEventListener('pointermove',e=>{
        if(!startPoint)return;
        if(Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y)>7){dragged=true;clearHold();closeDamage();}
        if(dragged)hover=pointFromEvent(e,true);
      });
      b.addEventListener('pointerup',e=>{
        clearHold();
        if(!holdShown&&dragged&&pointFromEvent(e,true))place(pointFromEvent(e,true));
        closeDamage();startPoint=null;dragged=false;hover=null;
      });
      b.addEventListener('pointercancel',()=>{clearHold();closeDamage();startPoint=null;dragged=false;hover=null;});
      b.addEventListener('click',e=>{if(e.detail===0&&!e.pointerType)choose(id);});
    });
  }
  for(const b of el('hand').children){
    b.classList.toggle('selected',b.dataset.card===selected);
    b.classList.toggle('low',UNITS[b.dataset.card].cost>snapshot.energy);
    b.setAttribute('aria-pressed',String(b.dataset.card===selected));
  }
}
function updateInspector(id){
  inspectId=id;const d=UNITS[id];
  el('inspectorRole').textContent=d.role;el('inspectorName').textContent=d.name;el('inspectorDesc').textContent=d.desc;
  el('inspectorStats').replaceChildren();
  const stats=d.spell?[['COST',d.cost],['AREA',`${d.radiusCells ?? (d.radius/ARENA.cellSize)}マス`],['DMG',`${d.damage}/${d.buildingDamage}`]]:[['COST',d.cost],['HP',d.hp+(d.count>1?` ×${d.count}`:'')],['RANGE',`${d.rangeCells ?? (d.range/ARENA.cellSize)}マス`]];
  for(const [label,value] of stats){const div=document.createElement('div'),s=document.createElement('small'),strong=document.createElement('strong');s.textContent=label;strong.textContent=value;div.append(s,strong);el('inspectorStats').append(div);}
  el('tacticalTip').textContent=d.desc;
}
function pointFromEvent(e,inside=false){
  const r=el('arenaCanvas').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*ARENA.width,y=(e.clientY-r.top)/r.height*ARENA.height;
  if(inside&&(x<0||x>ARENA.width||y<0||y>ARENA.height))return null;
  let p={x:clamp(x,0,ARENA.width),y:clamp(y,0,ARENA.height)},world=orient(p,seat);
  let valid=false;
  if(snapshot&&selected){
    const players=[{hand:[],energy:0},{hand:[],energy:0}];players[seat]={hand:snapshot.hand,energy:snapshot.energy};
    valid=!canPlace({...snapshot,players},seat,selected,world.x,world.y);
    const d=UNITS[selected];
    if(valid&&!d.spell&&!d.tunnelAnywhere){const snapped=snapDeploymentPoint(seat,d,world.x,world.y);p=orient(snapped,seat);}
  }
  return {...p,valid};
}
el('arenaCanvas').addEventListener('pointermove',e=>{if(selected)hover=pointFromEvent(e);});
el('arenaCanvas').addEventListener('pointerleave',()=>hover=null);
el('arenaCanvas').addEventListener('pointerdown',e=>{
  if(!selected){toast('下のカードを1枚選んでください。');return;}
  e.preventDefault();const p=pointFromEvent(e);
  pendingBuildingPlacement=null;place(p);
});
function place(p){
  if(!selected||!p||!snapshot||snapshot.phase!=='battle')return;
  const pos=orient(p,seat);
  if(gameMode==='cpu'){
    const card=selected,placedName=UNITS[card]?.building?UNITS[card].name:null;
    const r=deploy(localGame,0,card,pos.x,pos.y);
    if(!r.ok){toast(r.error);return;}
    sound('place');selected=null;hover=null;pendingBuildingPlacement=null;if(placedName)toast(`${placedName}を設置しました。`);acceptSnapshot(viewMatch(localGame,0));
  }else send({type:'deploy',card:selected,x:pos.x,y:pos.y});
}
document.addEventListener('keydown',e=>{
  if(currentView!=='battle'||['INPUT','TEXTAREA'].includes(document.activeElement.tagName)||el('helpModal').open||el('libraryModal').open||el('updatesModal').open||el('deckModal').open)return;
  if(/^[1-4]$/.test(e.key)){e.preventDefault();choose(snapshot.hand[Number(e.key)-1]);}
  if(e.key==='Escape'){selected=null;hover=null;updateHand();}
});
function surrender(){
  if(!snapshot)return;
  if(snapshot.phase==='ended'){if(gameMode==='cpu')stopPractice();else leaveOnline();return;}
  if(!confirm(gameMode==='cpu'?'CPUとの対戦を終了しますか？':'降参しますか？ 相手の勝利になります。'))return;
  if(gameMode==='cpu'){
    localGame.phase='ended';localGame.winner=1;localGame.reason='練習を終了しました';acceptSnapshot(viewMatch(localGame,0));
  }else send({type:'surrender'});
}
el('surrenderBtn').onclick=surrender;el('mobileExit').onclick=surrender;
el('rematchBtn').onclick=()=>{if(gameMode==='cpu')startPractice();else send({type:'reset'});};
el('backHomeBtn').onclick=()=>gameMode==='cpu'?stopPractice():leaveOnline();
el('brand').onclick=()=>{
  if(currentView==='battle'&&snapshot?.phase!=='ended'){
    if(!confirm('対戦から退出しますか？ オンラインでは敗北になります。'))return;
  }
  if(gameMode==='cpu')stopPractice();else if(session)leaveOnline();else showView('home');
};
el('soundBtn').onclick=()=>{
  soundOn=!soundOn;safeStorage('local','tiny-sound',String(soundOn));
  el('soundBtn').textContent='♪';el('soundBtn').classList.toggle('sound-muted',!soundOn);el('soundBtn').title=soundOn?'効果音 ON':'効果音 OFF';el('soundBtn').setAttribute('aria-pressed',String(soundOn));toast(soundOn?'効果音 ON':'効果音 OFF');sound('place');
};
el('soundBtn').textContent='♪';el('soundBtn').classList.toggle('sound-muted',!soundOn);el('soundBtn').title=soundOn?'効果音 ON':'効果音 OFF';
el('physicsBtn').onclick=()=>{physicsOverlay=!physicsOverlay;el('physicsBtn').setAttribute('aria-pressed',String(physicsOverlay));el('physicsBtn').textContent=physicsOverlay?'当たり判定を隠す':'当たり判定を表示';el('physicsLegend').textContent=physicsOverlay?'緑: 地上 / 紫: 空中 / 黄: 建物':'地上と空中は別レイヤー';};
el('libraryFacingBtn').onclick=()=>{rosterBack=!rosterBack;el('libraryFacingBtn').setAttribute('aria-pressed',String(rosterBack));el('libraryFacingBtn').textContent=rosterBack?'正面を見る ↻':'後ろ姿を見る ↻';};
function makeMiniRoster(container,ids,interactive=false){
  container.replaceChildren();
  for(const id of ids){
    const d=UNITS[id],mini=document.createElement('button');mini.type='button';mini.title=d.name;
    const mc=createPortraitCanvas(id);
    const mn=document.createElement('span');mn.textContent=d.short;mini.append(mc,mn);
    if(interactive)mini.onclick=openDeckEditor;container.append(mini);
  }
}
function renderDeckSummaries(){
  makeMiniRoster(el('homeDeck'),playerDeck,true);makeMiniRoster(el('lobbyRoster'),playerDeck,true);
  if(el('homeDeckAverage'))el('homeDeckAverage').textContent=`平均コスト ${formatAverage(playerDeck)}`;
  if(el('lobbyDeckAverage'))el('lobbyDeckAverage').textContent=`平均 ${formatAverage(playerDeck)}`;
}
function createPortraitCanvas(id,size=120){
  const can=document.createElement('canvas');can.width=size;can.height=size;can.dataset.portrait=id;can.dataset.portraitMode='deck';return can;
}
function setDeckError(text=''){el('deckError').textContent=text;el('deckError').hidden=!text;}
function updateMyListStatus(text='',error=false){const node=el('myListStatus');if(!node)return;node.textContent=text;node.hidden=!text;node.classList.toggle('error',error);}
function commitPresetMutation(mutator,successText){
  const before=deckPresets.map(p=>({...p,cards:[...p.cards]}));mutator();const saved=persistDeckPresets();
  if(!saved.ok){deckPresets=before;renderMyList();setDeckError('マイリストを保存できませんでした。ブラウザのストレージ設定を確認してください。');updateMyListStatus('保存に失敗しました。',true);return false;}
  renderMyList();setDeckError('');const suffix=saved.persistent?'':saved.memoryOnly?'（この画面を閉じるまでの一時保存）':'（このブラウザでは一時保存）';updateMyListStatus(successText+suffix);toast(successText);return true;
}
function renderMyList(){
  const host=el('myListGrid'),empty=el('myListEmpty');if(!host)return;host.replaceChildren();empty.hidden=deckPresets.length>0;if(el('myListCount'))el('myListCount').textContent=`${deckPresets.length} / ${MAX_MYLIST}`;
  deckPresets.forEach((preset,index)=>{
    const card=document.createElement('article');card.className='mylist-card';
    const head=document.createElement('div');head.className='mylist-card-head';const name=document.createElement('strong');name.textContent=preset.name;const avg=document.createElement('span');avg.textContent=formatAverage(preset.cards);head.append(name,avg);
    const mini=document.createElement('div');mini.className='mylist-mini';for(const id of preset.cards)mini.append(createPortraitCanvas(id,90));
    const actions=document.createElement('div');actions.className='mylist-actions';
    const use=document.createElement('button');use.type='button';use.textContent='このデッキを使用';use.onclick=()=>{editingDeck=[...preset.cards];renderDeckEditor();el('myListPanel').hidden=true;toast(`${preset.name}を編集デッキに反映しました。保存で確定します。`);};
    const rename=document.createElement('button');rename.type='button';rename.textContent='名前変更';rename.onclick=()=>{const next=prompt('マイリスト名を入力してください。',preset.name);if(next===null)return;const clean=next.trim().slice(0,24);if(!clean)return;commitPresetMutation(()=>{deckPresets[index]={...preset,name:clean};},'マイリスト名を変更しました。');};
    const overwrite=document.createElement('button');overwrite.type='button';overwrite.textContent='上書き';overwrite.onclick=()=>{if(!deckReady(editingDeck)){setDeckError('マイリストへ保存するには8枚そろえてください。');return;}if(!confirm(`${preset.name}を現在の8枚で上書きしますか？`))return;commitPresetMutation(()=>{deckPresets[index]={...preset,cards:[...editingDeck]};},'マイリストを上書きしました。');};
    const del=document.createElement('button');del.type='button';del.textContent='削除';del.className='danger';del.onclick=()=>{if(!confirm(`${preset.name}をマイリストから削除しますか？`))return;commitPresetMutation(()=>{deckPresets.splice(index,1);},'マイリストから削除しました。');};
    actions.append(use,rename,overwrite,del);card.append(head,mini,actions);host.append(card);
  });
}
function saveCurrentToMyList(){
  setDeckError('');updateMyListStatus('');if(!deckReady(editingDeck)){setDeckError('マイリストへ保存するには8枚そろえてください。');return;}if(deckPresets.length>=MAX_MYLIST){setDeckError('マイリストは最大10デッキです。不要なデッキを削除してから保存してください。');return;}
  const name=nextPresetName(),preset={id:`preset-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name,cards:[...editingDeck]};
  if(commitPresetMutation(()=>deckPresets.push(preset),`${name}としてマイリストに保存しました。`)){el('myListPanel').hidden=false;}
}
function clearDeckDragVisuals(){
  document.body.classList.remove('deck-dragging');
  el('deckSlots')?.classList.remove('drag-active');
  for(const node of document.querySelectorAll('.deck-slot.drag-over,.deck-choice.drag-source,.deck-slot.drag-source,.deck-choice.drag-armed,.deck-slot.drag-armed'))node.classList.remove('drag-over','drag-source','drag-armed');
  document.querySelector('.deck-drag-ghost')?.remove();
}
function cancelDeckDrag(){
  if(deckDrag?.holdTimer)clearTimeout(deckDrag.holdTimer);
  clearDeckDragVisuals();deckDrag=null;
}
function deckSlotAtPoint(x,y){
  const node=document.elementFromPoint(x,y)?.closest?.('.deck-slot');
  return node&&el('deckSlots')?.contains(node)?node:null;
}
function updateDeckDragTarget(x,y){
  for(const node of el('deckSlots')?.querySelectorAll('.deck-slot.drag-over')||[])node.classList.remove('drag-over');
  const slot=deckSlotAtPoint(x,y);if(slot)slot.classList.add('drag-over');return slot;
}
function moveDeckDragGhost(x,y){if(deckDrag?.ghost){deckDrag.ghost.style.left=`${x}px`;deckDrag.ghost.style.top=`${y}px`;}}
function beginDeckDrag(){
  if(!deckDrag||deckDrag.active)return;
  deckDrag.active=true;deckDrag.source.classList.remove('drag-armed');deckDrag.source.classList.add('drag-source');
  el('deckSlots')?.classList.add('drag-active');document.body.classList.add('deck-dragging');
  const ghost=document.createElement('div');ghost.className='deck-drag-ghost';ghost.setAttribute('aria-hidden','true');
  const can=createPortraitCanvas(deckDrag.cardId,92),label=document.createElement('strong'),cost=document.createElement('span');
  label.textContent=UNITS[deckDrag.cardId].short;cost.textContent=UNITS[deckDrag.cardId].cost;ghost.append(can,cost,label);document.body.append(ghost);deckDrag.ghost=ghost;
  moveDeckDragGhost(deckDrag.lastX,deckDrag.lastY);updateDeckDragTarget(deckDrag.lastX,deckDrag.lastY);
}
function installDeckDragSource(node,{kind,cardId,slotIndex=null}){
  node.addEventListener('pointerdown',e=>{
    if((e.pointerType==='mouse'&&e.button!==0)||deckDrag)return;
    const touch=e.pointerType==='touch';deckDrag={pointerId:e.pointerId,source:node,kind,cardId,slotIndex,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,touch,armed:!touch,active:false,ghost:null,holdTimer:null};
    if(touch){deckDrag.holdTimer=setTimeout(()=>{if(deckDrag&&deckDrag.pointerId===e.pointerId&&!deckDrag.active){deckDrag.armed=true;deckDrag.source.classList.add('drag-armed');navigator.vibrate?.(10);}},180);}
  });
}
function swapDeckPositions(from,to){
  if(from===to||from<0||from>=editingDeck.length)return false;
  if(to>=editingDeck.length){const [id]=editingDeck.splice(from,1);editingDeck.push(id);return true;}
  [editingDeck[from],editingDeck[to]]=[editingDeck[to],editingDeck[from]];return true;
}
function applyDeckDrop(targetSlot){
  if(!deckDrag||!targetSlot)return false;const target=Number(targetSlot.dataset.slot);if(!Number.isInteger(target)||target<0||target>=MAX_DECK)return false;
  const {kind,cardId,slotIndex}=deckDrag;
  if(kind==='slot'){
    if(!swapDeckPositions(slotIndex,target))return false;
    renderDeckEditor();toast('デッキの順番を入れ替えました。');return true;
  }
  const existing=editingDeck.indexOf(cardId);
  if(existing>=0){
    if(!swapDeckPositions(existing,target))return false;
    renderDeckEditor();toast(`${UNITS[cardId].short}を${target+1}番へ移動しました。`);return true;
  }
  if(target<editingDeck.length){
    if(editingDeck.length>=MAX_DECK){const old=editingDeck[target];editingDeck[target]=cardId;renderDeckEditor();toast(`${UNITS[old].short} → ${UNITS[cardId].short} に入れ替えました。`);return true;}
    editingDeck.splice(target,0,cardId);renderDeckEditor();toast(`${UNITS[cardId].short}をデッキに追加しました。`);return true;
  }
  if(editingDeck.length<MAX_DECK){editingDeck.push(cardId);renderDeckEditor();toast(`${UNITS[cardId].short}をデッキに追加しました。`);return true;}
  return false;
}
document.addEventListener('pointermove',e=>{
  if(!deckDrag||e.pointerId!==deckDrag.pointerId)return;deckDrag.lastX=e.clientX;deckDrag.lastY=e.clientY;
  const dist=Math.hypot(e.clientX-deckDrag.startX,e.clientY-deckDrag.startY);
  if(!deckDrag.active){
    if(deckDrag.touch&&!deckDrag.armed){if(dist>9){if(deckDrag.holdTimer)clearTimeout(deckDrag.holdTimer);deckDrag=null;}return;}
    if(dist>=10)beginDeckDrag();
  }
  if(deckDrag?.active){e.preventDefault();moveDeckDragGhost(e.clientX,e.clientY);updateDeckDragTarget(e.clientX,e.clientY);}
},{passive:false});
document.addEventListener('pointerup',e=>{
  if(!deckDrag||e.pointerId!==deckDrag.pointerId)return;
  if(deckDrag.holdTimer)clearTimeout(deckDrag.holdTimer);
  if(!deckDrag.active){deckDrag?.source?.classList.remove('drag-armed');deckDrag=null;return;}
  e.preventDefault();const target=deckSlotAtPoint(e.clientX,e.clientY),state=deckDrag;deckDragClickBlockUntil=performance.now()+100;clearDeckDragVisuals();deckDrag=state;applyDeckDrop(target);deckDrag=null;
},{passive:false});
document.addEventListener('pointercancel',e=>{if(deckDrag&&e.pointerId===deckDrag.pointerId)cancelDeckDrag();});
function deckCardClick(e,id){if(performance.now()<deckDragClickBlockUntil){e.preventDefault();e.stopPropagation();return;}openDeckCardActions(id);}

function renderDeckEditor(){
  el('deckCount').textContent=`${editingDeck.length} / ${MAX_DECK}`;setDeckError('');if(el('deckAverage'))el('deckAverage').textContent=formatAverage(editingDeck);el('deckSaveBtn').disabled=editingDeck.length!==MAX_DECK;
  el('deckSlots').replaceChildren();
  for(let i=0;i<MAX_DECK;i++){
    const id=editingDeck[i],slot=document.createElement('button');slot.type='button';slot.className='deck-slot '+(id?'filled':'empty');slot.dataset.slot=String(i);
    const n=document.createElement('em');n.textContent=String(i+1);slot.append(n);
    if(id){slot.dataset.card=id;const can=createPortraitCanvas(id);const name=document.createElement('strong');name.textContent=UNITS[id].short;slot.append(can,name);slot.onclick=e=>deckCardClick(e,id);installDeckDragSource(slot,{kind:'slot',cardId:id,slotIndex:i});}
    el('deckSlots').append(slot);
  }
  el('deckPool').replaceChildren();
  for(const id of DECK){
    const d=UNITS[id],selected=editingDeck.includes(id),b=document.createElement('button');b.type='button';b.dataset.card=id;b.className='deck-choice'+(selected?' selected':'');
    const can=createPortraitCanvas(id);const cost=document.createElement('span');cost.className='deck-cost';cost.textContent=d.cost;
    const copy=document.createElement('div');copy.className='deck-copy';const h=document.createElement('h3');h.textContent=d.name;const sm=document.createElement('small');sm.textContent=d.role;copy.append(h,sm);b.append(can,cost,copy);
    if(selected){const chk=document.createElement('span');chk.className='deck-check';chk.textContent='DECK';b.append(chk);}b.onclick=e=>deckCardClick(e,id);installDeckDragSource(b,{kind:'pool',cardId:id});el('deckPool').append(b);
  }
  renderMyList();
}
function closeDeckCardActions(){el('deckCardActions').hidden=true;el('deckReplacePanel').hidden=true;deckActionId=null;}
function refreshDeckAction(id){
  const d=UNITS[id],inDeck=editingDeck.includes(id),portrait=el('deckActionPortrait');deckActionId=id;el('deckActionName').textContent=d.name;el('deckActionRole').textContent=d.role;el('deckActionCost').textContent=d.cost;portrait.dataset.portraitMode='deck';drawPortrait(portrait,id,performance.now()/1000);
  el('deckCardToggleBtn').textContent=inDeck?'デッキから外す':editingDeck.length>=MAX_DECK?'入れ替えて追加':'デッキに入れる';el('deckReplacePanel').hidden=true;
}
function openDeckCardActions(id){refreshDeckAction(id);el('deckCardActions').hidden=false;}
function removeFromEditingDeck(id){const at=editingDeck.indexOf(id);if(at>=0){editingDeck.splice(at,1);renderDeckEditor();return true;}return false;}
function addToEditingDeck(id){if(editingDeck.includes(id))return true;if(editingDeck.length>=MAX_DECK)return false;editingDeck.push(id);renderDeckEditor();return true;}
function renderReplacementChoices(id){
  const host=el('deckReplaceGrid');host.replaceChildren();for(const current of editingDeck){const b=document.createElement('button');b.type='button';const can=createPortraitCanvas(current,88),name=document.createElement('span');name.textContent=UNITS[current].short;b.append(can,name);b.onclick=()=>{const at=editingDeck.indexOf(current);if(at>=0)editingDeck[at]=id;closeDeckCardActions();renderDeckEditor();toast(`${UNITS[current].short} → ${UNITS[id].short} に入れ替えました。`);};host.append(b);}el('deckReplacePanel').hidden=false;
}
function toggleDeckCard(id,{fromDetail=false}={}){
  if(editingDeck.includes(id)){removeFromEditingDeck(id);if(fromDetail)refreshDetailToggle();else closeDeckCardActions();return;}
  if(addToEditingDeck(id)){if(fromDetail)refreshDetailToggle();else closeDeckCardActions();return;}
  if(fromDetail){closeCardDetail();openDeckCardActions(id);}renderReplacementChoices(id);
}
function targetLabel(d){if(d.buildingOnly)return '建物のみ';if(d.id==='mossling')return '地上＋空中（槍3）';return d.targetsAir?'地上＋空中':'地上のみ';}
function detailStatsFor(d){
  if(d.spell){const stats=[['COST',d.cost],['TYPE','SPELL'],['範囲',`${d.radiusCells ?? (d.radius/ARENA.cellSize)}マス`]];if(d.spell==='cyclone'){stats.push(['効果時間',`${d.zoneDuration}秒`],['吸引','継続・軽量ほど強い'],['ダメージ',`外${d.outerDps} / 中${d.midDps} / 中心${d.innerDps} DPS`],['建物','吸引・ダメージなし']);return stats;}stats.push(['兵ダメージ',d.damage],['建物ダメージ',d.buildingDamage]);if(d.spell==='poison')stats.push(['効果時間',`${d.zoneDuration}秒`],['ダメージ間隔',`${d.tickEvery}秒`]);if(d.spell==='lightning')stats.push(['対象',`現在HPが高い順 最大${d.maxTargets||4}体`]);if(d.stunDuration)stats.push(['スタン',`${d.stunDuration}秒`]);return stats;}
  const dmg=d.id==='mossling'?'地上125 / 槍81':d.drillUnit?`${d.drillBaseDps} DPS〜`:(d.laserTower||d.laserUnit)?`${d.laserBaseDps} DPS〜`:d.damage;const interval=d.drillUnit?'継続':(d.laserTower||d.laserUnit)?'継続':d.suicideUnit?'到達時に自爆':d.sparkUnit?`${d.sparkChargeTime}秒チャージ`:d.cooldown?`${d.cooldown.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}秒`:'—';
  const deployTime=d.tunnelAnywhere?'地下移動（追加待機なし）':`${summonDelayFor(d).toFixed(1)}秒`;
  const stats=[['COST',d.cost],[d.building?'建設時間':'召喚時間',deployTime],['HP',`${d.hp}${d.count>1?` ×${d.count}`:''}`],['攻撃',dmg],['攻撃間隔',interval],['射程',`${d.rangeCells ?? (d.range/ARENA.cellSize)}マス`],['対象',targetLabel(d)],['移動',d.building?'固定':d.air?`飛行 ${d.speed}`:`地上 ${d.speed}`]];
  if(!d.building&&!d.buildingOnly){const size=visionSizeFor(d),label=size==='small'?'小型':size==='large'?'大型':'中型';stats.push(['サイズ',label],['視界',`${d.visionCells ?? (visionRangeFor(d)/ARENA.cellSize)}マス`]);}
  if(d.building)stats.push(['占有',`${d.footprintCols||3}×${d.footprintRows||3}マス`]);
  if((d.count||0)>1)stats.push(['召喚展開',`中心から約${d.summonFormationRadiusCells||0}マス`]);
  if(d.structureDamage!=null)stats.push(['対タワー・設置物',d.structureDamage]);
  if(d.splash)stats.push(['範囲',`${d.splashCells ?? (d.splash/ARENA.cellSize)}マス`]);
  if(d.id==='frost')stats.push(['鈍足','3段階：80% → 65% → 50%']);
  if(d.id==='harpy'){stats.push(['連鎖ダメージ','180 → 130 → 90']);stats.push(['スタン','各命中先 1.0秒']);}
  if(d.id==='mossling'){stats.push(['編成','ゴブリン3（HP202 / 攻撃125）＋槍3（HP133 / 攻撃81 / 対空可）']);stats.push(['槍ゴブ射程',`${UNITS.goblin_spear.rangeCells}マス（投げ槍）`]);}
  if(d.id==='goblins')stats.push(['編成','ゴブリン4体'],['1体あたり','HP202 / 攻撃125 / 1.1秒']);
  if(d.id==='speargoblins')stats.push(['編成','槍ゴブリン3体'],['1体あたり','HP133 / 攻撃81 / 1.6秒'],['射程',`${d.rangeCells}マス`]);
  if(d.id==='megagargoyle')stats.push(['攻撃対象','地上＋空中'],['射程',`${d.rangeCells}マス（ガーゴイル${UNITS.gargoyle.rangeCells}マスより長い）`],['移動速度','45（普通）']);
  if(d.id==='apprenticeguards')stats.push(['編成','横一列6体（配置位置で4+2分割可）'],['1体あたり','HP547 + シールド240 / 攻撃133 / 1.3秒'],['シールド','全方向のダメージを先に受ける / 破壊で盾が消える']);
  if(d.id==='icespirit')stats.push(['飛びつき',`${d.fireLeapRangeCells||d.iceLeapRangeCells}マスでジャンプ`],['爆発',`${d.iceBlastRadiusCells}マス / 110範囲ダメージ`],['フリーズ','命中した敵を1.1秒完全停止'],['移動速度','96（とても速い）']);
  if(d.id==='firespirit')stats.push(['飛びつき',`${d.fireLeapRangeCells||d.iceLeapRangeCells}マスでジャンプ`],['自爆',`${d.fireBlastRadiusCells}マス / 215範囲ダメージ`],['対象','地上＋空中'],['移動速度','96（とても速い）']);
  if(d.id==='oven')stats.push(['能力','配置時にファイヤスピリット2体'],['継続召喚','10秒ごとに2体'],['耐久','HP900・毎秒30自然減衰']);
  if(d.id==='barbarians')stats.push(['編成','バーバリアン5体'],['1体HP',716],['1体攻撃',192],['攻撃間隔','1.4秒']);
  if(d.id==='siegebarbarian')stats.push(['木HP',966],['通常衝突',265],['加速','2秒連続移動後・少し高速化'],['突進',572],['スタン','加速リセット'],['破壊/衝突後','バーバリアン2体']);
  if(d.id==='electrowizard')stats.push(['スタン','範囲内の敵ユニット全員 1.0秒']);
  if(d.id==='laserdragon')stats.push(['レーザー増幅','1.5秒ごとに ×2・対象変更/射程外/スタンでリセット']);
  if(d.id==='shieldknight'){stats.push(['盾耐久',d.shieldMax],['正面軽減','65%を盾へ / 35%を本体へ'],['盾角度',`正面 ${d.shieldArcDeg}°`]);}
  if(d.id==='windmage')stats.push(['ノックバック','小型34 / 中型20 / 大型8 / 超重量0 px']);
  if(d.id==='phoenix')stats.push(['復活','卵HP600を4秒守る → HP450で1回のみ']);
  if(d.id==='mirage')stats.push(['ステルス','最大3秒・半透明 / 攻撃・被弾・時間切れで解除'],['ステルス初撃','×1.4'],['短剣範囲',`R${d.meleeSplash}`]);
  if(d.id==='skybomber')stats.push(['特性','飛行・地上/空中ユニット＋建物を攻撃'],['爆弾','175 / 1.6秒'],['射程',`${d.rangeCells}マス`]);
  if(d.id==='scrapdrill')stats.push(['ドリルDPS','90 → 135 → 180 → 240'],['増幅','同一建物へ1.5秒ごと'],['リセット','射程外 / 対象変更 / スタン']);
  if(d.id==='miniberserker')stats.push(['特徴','頭と体が約1:1・大剣を掲げて高速進軍'],['役割','4コストの高火力単体近接']);
  if(d.id==='boar')stats.push(['川越え','川岸すぐ横のみジャンプ / それ以外は橋へ'],['着地','対岸のすぐそば / 1.2秒でジャンプ'],['突進',`走行${d.chargeDistance} → 初撃×${d.chargeMultiplier}`]);
  if(d.id==='megaknight')stats.push(['通常範囲',`${d.meleeSplashCells ?? (d.meleeSplash/ARENA.cellSize)}マス / ${d.damage}`],['落下召喚',`1.5秒後・${d.dropRadiusCells}マスへ${d.dropDamage}`],['ジャンプ',`${d.jumpMinRangeCells}〜${d.jumpMaxRangeCells}マス / 準備${d.jumpWindup}秒 / ${d.jumpRadiusCells}マスへ${d.jumpDamage}`],['対象固定','飛び始めた相手を倒すまで追跡']);
  if(d.id==='ironeye')stats.push(['マーク','被ダメージ+20%'],['破裂','累計500 → 追加300'],['回転突進','1体につき1回 / 180 / 貫通'],['突進命中','マーク＋2.5秒間30%鈍足']);
  if(d.id==='tracker')stats.push(['フック',`${d.hookRangeCells}マス / 構え0.6秒 / CT4秒`],['地上','敵を近接距離へ引き寄せ'],['空中','引き寄せた対象だけ2秒攻撃可'],['建物','自分が建物へ引き寄せられる']);
  if(d.id==='nightshade')stats.push(['ダッシュ',`準備${d.dashWindup}秒 / ${d.dashDamage}ダメージ / CT${d.dashCooldown}秒`],['特徴','ダッシュ中は無敵']);
  if(d.id==='bombcarrier')stats.push(['建物自爆','480'],['死亡時','周囲の敵ユニットへ80'],['移動速度','88']);
  if(d.id==='lumina')stats.push(['命中時回復','自分110＋周囲の味方最大3体へ各110'],['回復範囲',`${d.healOnHitRangeCells}マス`]);
  if(d.id==='elixirgolem')stats.push(['分裂','大1 → 中2（HP784 / 攻撃127）→ 小4（HP392 / 攻撃64）'],['敵エリクサー','大+1 / 中1体+1 / 小1体+0.5']);
  if(d.id==='icegolem')stats.push(['攻撃対象','建物のみ'],['死亡時',`${d.deathRadiusCells}マスへ${d.deathDamage}ダメージ`],['特徴','低速・建物特攻']);
  if(d.id==='skeletonbarrel')stats.push(['攻撃対象','建物のみ（飛行）'],['到達/死亡時','145ダメージ'],['破壊時召喚','スケルトン7体'],['特徴','少し速い建物特攻']);
  if(d.id==='giantskeleton')stats.push(['\u653b\u6483\u5bfe\u8c61','\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\uff0b\u5efa\u7269'],['\u6b7b\u4ea1\u7206\u5f3e',`3\u79d2\u5f8c / 688\u30c0\u30e1\u30fc\u30b8 / ${d.deathBombRadiusCells}\u30de\u30b9`],['\u79fb\u52d5\u901f\u5ea6','40\uff08\u666e\u901a\uff09']);
  if(d.id==='skeletonrush')stats.push(['\u767a\u52d5','1.2\u79d2\u5f8c\u306b\u7d2b\u8272\u30a8\u30ea\u30a2'],['\u52b9\u679c\u6642\u9593','9\u79d2'],['\u53ec\u559a','\u767a\u52d53\u79d2\u5f8c\u21920.5\u79d2\u3054\u30681\u4f53'],['\u7279\u6027','\u5efa\u7269\u3068\u91cd\u306d\u53ef / 40%\u753b\u9762\u5916\u53ef']);
  if(d.id==='royalgiant')stats.push(['特性','建物のみ・遠距離砲撃'],['砲撃射程',`${d.rangeCells}マス`]);
  if(d.summonType){const summonLabel=(d.summonOnDeploy?`配置時＋${d.summonInterval}秒ごと`:`${d.summonInterval}秒ごと`)+(d.summonWindup?`（準備${d.summonWindup}秒）`:'')+` ×${d.summonCount}`;stats.push(['召喚',summonLabel]);}
  if(d.deathSummonType&&d.deathSummonCount)stats.push(['破壊時召喚',`${UNITS[d.deathSummonType]?.name||d.deathSummonType} ×${d.deathSummonCount}（即時）`]);
  if(d.spawnType==='blade')stats.push(['編成','前1・後2の3体']);
  if(d.sparkUnit)stats.push(['充電','敵不在でも常時・ザップで0へ']);
  return stats;
}
function refreshDetailToggle(){if(!detailCardId)return;const inDeck=editingDeck.includes(detailCardId);el('detailDeckToggleBtn').textContent=inDeck?'デッキから外す':editingDeck.length>=MAX_DECK?'入れ替えて追加':'デッキに入れる';}
function demoReadyCard(g,owner,id){
  const fillers=DECK.filter(k=>k!==id);g.players[owner].hand=[id,...fillers.slice(0,3)];g.players[owner].queue=fillers.slice(3,7);g.players[owner].deck=[id,...fillers.slice(0,7)];g.players[owner].energy=10;
}
const DEMO_Y_SCALE=ARENA.height/1040;
function demoDeploy(g,owner,id,x,y){demoReadyCard(g,owner,id);const result=deploy(g,owner,id,x,y*DEMO_Y_SCALE);g.players[owner].energy=10;return result;}
function demoDeployUnits(g,owner,id,x,y){
  const before=g.units.length,result=demoDeploy(g,owner,id,x,y);return {result,units:g.units.slice(before)};
}
function demoStageUnit(u,x,y,{hp=null,spawn=0,cd=0}={}){
  if(!u)return null;u.x=x;u.y=y*DEMO_Y_SCALE;u.lane=x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];u.target=null;u.moving=false;u.spawn=spawn;u.cd=cd;if(Number.isFinite(hp))u.hp=Math.max(1,Math.min(u.maxHp,hp));return u;
}
function createDetailDemo(id){
  const g=createMatch({seed:18000+DECK.indexOf(id),bot:false,difficulty:'normal',decks:[DEFAULT_DECK,DEFAULT_DECK]});g.phase='battle';g.countdown=0;g.time=0;g.bot=false;for(const p of g.players)p.energy=10;
  const d=UNITS[id],lane=ARENA.lanes[1];let label='本番と同じ戦闘ロジックでAUTO実演',scenarioKey='standard',duration=8.5;
  const put=(owner,type,x,y)=>demoDeployUnits(g,owner,type,x,y).units;
  const enemy=(type,x=lane,y=420)=>put(1,type,x,y);
  const own=(type,x=lane,y=650)=>put(0,type,x,y);
  if(d.spell){
    if(id==='skeletonrush'){
      g.towers.forEach(t=>{t.damage=0;t.range=0;});demoDeploy(g,0,id,lane,300);
      label='\u4f7f\u75281.2\u79d2\u5f8c\u306b\u7d2b\u8272\u30a8\u30ea\u30a2\u304c\u767a\u52d5 \u2192 3\u79d2\u5f8c\u304b\u30890.5\u79d2\u3054\u3068\u306b\u30b9\u30b1\u30eb\u30c8\u30f3\u53ec\u559a';scenarioKey='skeletonrush-zone-spawn';duration=12;
    }else if(id==='zap'){
      const [laser]=enemy('lasertower',lane,420),[sparky]=enemy('sparky',480,420),[guard]=own('knight',lane,650);demoStageUnit(laser,lane,515);demoStageUnit(sparky,480,540);demoStageUnit(guard,lane,650);if(laser){laser.laserStage=4;laser.laserDps=320;laser.target=guard?.id||null;laser.laserTarget=guard?.id||null;laser.laserLockTime=6;}if(sparky){sparky.sparkCharged=true;sparky.sparkChargeProgress=1;}demoDeploy(g,0,id,505,525);
      label='レーザー塔＋満充電スパーキーへ電撃 → 1.5秒スタン＋攻撃対象/増幅/充電をリセット';scenarioKey='zap-reset-stun';duration=7;
    }else if(id==='lightning'){
      g.towers.forEach(t=>t.damage=0);const [golem]=enemy('golem',lane,420),[mega]=enemy('megaknight',485,420),[guard]=enemy('knight',565,420),[archer]=enemy('archer',520,420),[blade]=enemy('blade',450,420);const staged=[golem,mega,guard,archer,blade].filter(Boolean);staged.forEach((u,i)=>{demoStageUnit(u,460+i*30,500+(i%2)*24);u.speed=0;u.damage=0;});demoDeploy(g,0,id,520,510);
      label='半径105内の敵を現在HPが高い順に選択 → 上位4体へ同時落雷（ユニット1056 / 建物265）';scenarioKey='lightning-top-hp-four';duration=6;
    }else if(id==='poison'){
      const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,505);demoDeploy(g,0,id,lane,500);
      label='8秒間の毒エリア → 範囲内のユニットへ毎秒91、建物へ毎秒21ダメージ';scenarioKey='poison-zone-8s';duration=10;
    }else if(id==='arrowrain'){
      enemy('mossling',lane,420);enemy('boneswarm',470,410);demoDeploy(g,0,id,lane,455);
      label='密集した小型群体へ着弾予告 → 広範囲一斉ダメージ';scenarioKey='arrowrain-wide-swarm';duration=7;
    }else if(id==='cyclone'){
      g.towers.forEach(t=>t.range=0);const pack=enemy('mossling',lane,420);pack.forEach((u,i)=>{demoStageUnit(u,475+(i%3)*55,455+Math.floor(i/3)*48);u.damage=0;u.speed=35;});demoDeploy(g,0,id,lane,500);
      label='半径130の渦を3秒展開 → 敵を中心へ継続吸引。中心ほど少量ダメージが上昇';scenarioKey='cyclone-pull-field';duration=7;
    }else{
      enemy('knight',lane,420);enemy('archer',485,405);demoDeploy(g,0,id,lane,475);
      label='地上兵＋後衛へ実際の飛翔 → 着弾 → 範囲ダメージ';scenarioKey='fireball-splash';duration=7;
    }
  }else if(id==='icegolem'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});
    const [ice]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(ice,lane,520,{hp:70,cd:99});demoStageUnit(guard,lane,476,{cd:0});if(ice){ice.speed=0;}if(guard){guard.speed=0;guard.damage=500;}
    const bones=enemy('skeleton',485,420);bones.forEach((u,i)=>{demoStageUnit(u,492+i*22,520+(i%2?18:-18),{cd:99});u.damage=0;u.speed=0;});
    label='建物だけを狙う低速ゴーレム → 倒されると半径60へ84ダメージの氷爆発';scenarioKey='icegolem-death-blast';duration=6.5;
  }else if(id==='skeletonbarrel'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});
    const [barrel]=own(id,lane,650),[archer1]=enemy('archer',lane,420),[archer2]=enemy('archer',lane+40,420),[guard]=enemy('knight',lane+18,420);
    demoStageUnit(barrel,lane,520,{hp:90,cd:99});if(barrel){barrel.speed=0;}
    [archer1,archer2,guard].filter(Boolean).forEach((u,i)=>{demoStageUnit(u,lane-24+i*28,472+(i===2?24:0),{cd:99});u.speed=0;});
    if(archer1)archer1.damage=160;if(archer2)archer2.damage=160;if(guard)guard.damage=0;
    label='建物だけを狙う飛行バレル → 倒されると145ダメージを残し、スケルトン7体が飛び出す';scenarioKey='skeletonbarrel-burst';duration=7;
  }else if(id==='apprenticeguards'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});const guards=own(id,360,650);guards.forEach((u,i)=>{if(u){u.speed=0;u.damage=0;u.deploying=false;u.targetable=true;u.spawn=0;}});const archers=enemy('archer',360,420);archers.forEach((u,i)=>{demoStageUnit(u,260+i*200,500,{cd:.2});u.speed=0;u.damage=260;});
    label='6体を横一列へ展開 → まずシールド240が全ダメージを受ける → 盾が壊れると大盾が消えてHP547で戦闘';scenarioKey='apprentice-guards-wide-shield';duration=9;
  }else if(id==='barbarians'){
    const pack=own(id,lane,650);pack.forEach((u,i)=>{u.x=315+i*22;u.y=650+Math.abs(2-i)*7;u.damage=192;});const foes=enemy('knight',lane,500);foes.forEach((u,i)=>{u.x=335+i*35;u.y=500;u.damage=0;});label='金髪・金髭の地上近接バーバリアン5体が一斉に前線へ突入';scenarioKey='barbarians-five';duration=8;
  }else if(id==='siegebarbarian'){
    const [ram]=own(id,lane,700);demoStageUnit(ram,lane,700);ram.damage=265;label='建物へ進軍 → 2秒連続移動で加速 → 572突進。スタンで加速リセット、木が砕けるとバーバリアン2体';scenarioKey='siege-barbarian-charge';duration=10;
  }else if(id==='icespirit'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});const [ice]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(ice,lane,590);demoStageUnit(guard,lane,500,{cd:99});if(guard){guard.speed=0;guard.damage=0;}
    label='とても速く接近 → 敵へ飛びつき → R48へ110ダメージ＋1.1秒フリーズして消滅';scenarioKey='ice-spirit-leap-freeze';duration=6;
  }else if(id==='firespirit'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});const [fire]=own(id,lane,650),[guard]=enemy('knight',lane,420),air=enemy('bat',lane+35,420)[0];demoStageUnit(fire,lane,590);demoStageUnit(guard,lane,500,{cd:99});demoStageUnit(air,lane+35,505,{cd:99});if(guard){guard.speed=0;guard.damage=0;}if(air){air.speed=0;air.damage=0;}
    label='とても速く接近 → 敵へ飛びつき → R48へ215範囲ダメージを与えて自爆';scenarioKey='fire-spirit-leap-burst';duration=6;
  }else if(id==='oven'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});const [oven]=own(id,lane,650);demoStageUnit(oven,lane,610);if(oven){oven.summonNextAt=g.time+2.2;}const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,485,{cd:99});if(guard){guard.speed=0;guard.damage=0;}
    label='配置時にファイヤスピリット2体 → その後10秒ごとに2体ずつ鍋から追加召喚';scenarioKey='oven-fire-spirit-spawner';duration=12;
  }else if(id==='giantskeleton'){
    g.towers.forEach(t=>{t.range=0;t.damage=0;});const [giant]=own(id,lane,650),[killer]=enemy('knight',lane,420),[victim]=enemy('blade',lane+38,420);demoStageUnit(giant,lane,520,{hp:80,cd:99});demoStageUnit(killer,lane,482,{cd:0});demoStageUnit(victim,lane+42,520,{cd:99});if(giant){giant.speed=0;}if(killer){killer.speed=0;killer.damage=900;}if(victim){victim.speed=0;victim.damage=0;}
    label='巨大スケルトンが倒れる → 死亡地点に爆弾 → 3秒後に半径1.5マスへ688ダメージ';scenarioKey='giantskeleton-death-bomb';duration=7;
  }else if(id==='golem'){
    const [golem]=own(id,lane,650);demoStageUnit(golem,lane,318,{hp:60,cd:99});if(golem)golem.speed=0;
    const bones=enemy('boneswarm',lane,390);const cx=lane,cy=318,r=42;
    bones.forEach((u,i)=>{const a=Math.PI*2*i/Math.max(1,bones.length);demoStageUnit(u,cx+Math.cos(a)*r,cy+Math.sin(a)*r,{cd:.85});});
    const tower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===lane);if(tower)tower.cd=.85;
    label='瀕死のゴーレム → 死亡爆発でタワー＋ボーン隊へ180ダメージ → ちび2体へ分裂';scenarioKey='golem-death-blast-split';duration=7;
  }else if(id==='muddragon'){
    const [dragon]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(dragon,lane,620);demoStageUnit(guard,lane,520);
    label='高HPのアイアン衛士へ実際の泥弾 → 泥沼で30%減速＋30の継続ダメージ';scenarioKey='muddragon-slow-dot';duration=9;
  }else if(id==='necromancer'){
    g.towers.forEach(t=>t.range=0);
    const deployed=own(id,lane,650),summoner=deployed.find(u=>u.type==='necromancer');demoStageUnit(summoner,lane,610);if(summoner)summoner.summonNextAt=7.5;
    const swarm=enemy('mossling',500,420);swarm.forEach((u,i)=>{demoStageUnit(u,485+(i%3)*32,460+Math.floor(i/3)*30,{cd:1.2});u.damage=0;});
    const bats=enemy('bat',565,420);bats.forEach((u,i)=>{demoStageUnit(u,555+(i%2)*28,470+Math.floor(i/2)*26,{cd:1.2});u.damage=0;});
    label='5コスト・HP839・1.1秒攻撃。召喚完了時にスケルトン3体 → 7.5秒ごとに追加召喚';scenarioKey='necromancer-skeleton-summon';duration=12;
  }else if(id==='darknecro'){
    g.towers.forEach(t=>t.range=0);
    const deployed=own(id,lane,650),summoner=deployed.find(u=>u.type==='darknecro');demoStageUnit(summoner,lane,610);if(summoner)summoner.summonNextAt=6.5;
    const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,500,{cd:1.2});if(guard)guard.damage=0;const bats=enemy('bat',485,420);bats.forEach((u,i)=>{demoStageUnit(u,475+(i%2)*26,485+Math.floor(i/2)*24,{cd:1.2});u.damage=0;});
    label='4コスト・HP907・攻撃304。召喚完了時にコウモリ2体 → 6.5秒ごとに追加召喚';scenarioKey='darknecro-bat-summon';duration=11;
}else if(id==='dosranboss'){
    g.towers.forEach(t=>t.range=0);
    const deployed=own(id,lane,650),boss=deployed.find(u=>u.type==='dosranboss');demoStageUnit(boss,lane,615);
    const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,500,{cd:1.1});if(guard)guard.damage=0;
    const archers=enemy('archer',485,420);archers.forEach((u,i)=>demoStageUnit(u,470+i*28,465,{cd:1.2}));
    label='1.5秒の本体召喚完了と同時にランボス3体 → 本体は遅めに進軍 → 10秒後に3秒停止してさらに3体を追加';scenarioKey='dosranboss-pack-summon';duration=16;
    }else if(id==='ashsquad'){
    const blades=own(id,lane,650);const deployed=enemy('necromancer',lane,420),summoner=deployed.find(u=>u.type==='necromancer');demoStageUnit(summoner,lane,525,{hp:800,cd:1.5});
    blades.forEach((u,i)=>demoStageUnit(u,lane+(i===0?0:(i===1?-28:28)),i===0?605:635,{spawn:0,cd:.4}));
    label='アッシュ剣士3体を前1・後2の三角陣形で展開 → 召喚系の後衛へ一斉に接近して処理';scenarioKey='ash-squad-triangle-counter';duration=8.5;
  }else if(id==='princess'){
    g.towers.forEach(t=>t.damage=0);const [princess]=own(id,lane,650);demoStageUnit(princess,lane,600);label='自陣の橋手前から射程350で敵サイドタワーへ超長距離の範囲矢を発射';scenarioKey='princess-cross-river-shot';duration=9;
  }else if(id==='sparky'){
    g.towers.forEach(t=>t.range=0);const [spark]=own(id,lane,650);demoStageUnit(spark,lane,625);const swarm=enemy('mossling',lane,420);const spots=[[500,500],[530,505],[557,510],[515,530],[548,535]];swarm.forEach((u,i)=>{demoStageUnit(u,...spots[i%spots.length]);u.damage=0;u.speed=0;});label='敵がいなくても配置直後から3.5秒充電 → 満充電エフェクト → 地上群体へ1200範囲砲撃';scenarioKey='sparky-always-charge';duration=9;
  }else if(id==='tigger'){
    demoDeploy(g,0,id,lane,325);label='地下潜行で後衛へ奇襲。敵ユニットへ120ダメージ、タワー・設置物には70ダメージ';scenarioKey='tigger-burrow';duration=9;
  }else if(id==='lasertower'){
    const [laser]=own(id,lane,650),[golem]=enemy('golem',lane,390);demoStageUnit(laser,lane,650);demoStageUnit(golem,lane,500);
    label='高HPゴーレムを同じ対象のまま照射 → 1秒ごとにレーザー火力が倍化';scenarioKey='laser-ramp';duration=11;
  }else if(id==='laserdragon'){
    g.towers.forEach(t=>t.range=0);
    const [dragon]=own(id,lane,650),[golem]=enemy('golem',lane,390);demoStageUnit(dragon,lane,635);demoStageUnit(golem,lane,500);if(golem){golem.speed=0;golem.damage=0;}
    label='飛行しながら中距離へ接近 → 同じ敵へ照射し続けて1.5秒ごとに20→40→80…と増幅';scenarioKey='laserdragon-mobile-ramp';duration=11;
  }else if(id==='ironeye'){
    g.towers.forEach(t=>t.range=0);const [eye]=own(id,lane,650);demoStageUnit(eye,lane,610);const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,500,{cd:99});if(guard){guard.damage=0;guard.speed=0;}const [blade]=enemy('blade',500,420);demoStageUnit(blade,lane,555,{cd:99});if(blade){blade.damage=0;blade.speed=0;}
    label='通常矢で弱点マーク → 接近した地上敵へ一度きりの隠し刃回転突進 → 貫通した敵へマーク＋鈍足';scenarioKey='iron-eye-mark-spin';duration=9;
  }else if(id==='tracker'){
    g.towers.forEach(t=>t.range=0);const [hunter]=own(id,lane,650);demoStageUnit(hunter,lane,620);const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,490,{cd:99});if(guard){guard.damage=0;guard.speed=0;}const bats=enemy('bat',485,420);bats.forEach((u,i)=>{demoStageUnit(u,485+i*18,505+i*8,{cd:99});u.damage=0;u.speed=0;});
    label='6マスのフック → 地上敵を引き寄せ。空中敵を捕まえた場合はその対象だけ2秒間近接攻撃可能';scenarioKey='tracker-hook-control';duration=10;
  }else if(id==='shieldknight'){
    g.towers.forEach(t=>t.range=0);const [shield]=own(id,lane,650),[archer]=enemy('archer',lane,420);demoStageUnit(shield,lane,585);demoStageUnit(archer,lane,430);if(archer){archer.speed=0;archer.damage=100;}
    label='正面からの矢を大盾で受け、65%を盾耐久へ・35%を本体へ分散。盾が割れると通常ダメージ';scenarioKey='shield-front-block';duration=10;
  }else if(id==='windmage'){
    g.towers.forEach(t=>t.range=0);const [mage]=own(id,lane,650);demoStageUnit(mage,lane,620);const pack=enemy('mossling',lane,420);pack.forEach((u,i)=>{demoStageUnit(u,500+i*20,505+i*5);u.speed=0;u.damage=0;});
    label='射程175の風弾が軽量ゴブリンへ命中 → 攻撃方向へ大きくノックバック';scenarioKey='wind-knockback';duration=9;
  }else if(id==='phoenix'){
    g.towers.forEach(t=>t.range=0);const [bird]=own(id,lane,650);demoStageUnit(bird,lane,555,{hp:120});const [archer]=enemy('archer',lane,420);demoStageUnit(archer,lane,430);if(archer){archer.damage=180;archer.cooldown=.55;archer.speed=0;}
    label='フェニックス撃破 → HP600の卵が地上へ落下 → 4秒守ればHP450で一度だけ復活';scenarioKey='phoenix-egg-revive';duration=10;
  }else if(id==='mirage'){
    g.towers.forEach(t=>t.range=0);const [assassin]=own(id,lane,650);demoStageUnit(assassin,lane,610);const [archer]=enemy('archer',lane,420);demoStageUnit(archer,lane,500);if(archer){archer.speed=0;archer.damage=0;}
    label='半透明ステルスで接近 → 初撃1.4倍で実体化 → 短剣の半径40小範囲攻撃';scenarioKey='royal-ghost-stealth-slash';duration=8;
  }else if(id==='skybomber'){
    g.towers.forEach(t=>t.damage=0);const [bomber]=own(id,lane,650);demoStageUnit(bomber,lane,430);const [guard]=enemy('blade',lane,420);demoStageUnit(guard,lane,350,{cd:99});if(guard){guard.damage=0;guard.speed=0;}label='飛行で地上・空中・建物を狙い、射程170から1.6秒ごとに175ダメージの爆弾を投下';scenarioKey='skybomber-long-range-bomb';duration=8;
  }else if(id==='scrapdrill'){
    g.towers.forEach(t=>t.damage=0);const [drill]=own(id,lane,650);demoStageUnit(drill,lane,310);label='建物へ張り付き → 90 DPSから1.5秒ごとに135→180→240 DPSまでドリル火力上昇';scenarioKey='scrapdrill-ramp';duration=9;
  }else if(id==='bombcarrier'){
    g.towers.forEach(t=>t.damage=0);const [carrier]=own(id,lane,650);demoStageUnit(carrier,lane,350);label='速度88で建物へ突進 → 到達すると480ダメージで自爆。途中撃破時は周囲へ80の小爆発';scenarioKey='bomb-carrier-suicide';duration=6;
  }else if(id==='cannon'){
    const [cannon]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(cannon,lane,650);demoStageUnit(guard,lane,515);
    label='アイアン衛士をロックして防衛。設置後は耐久も毎秒30ずつ自然減衰';scenarioKey='cannon-lock-decay';duration=9;
  }else if(id==='lumina'){
    const [healer]=own(id,555,700);demoStageUnit(healer,555,650,{hp:1250});const allies=[...own('knight',500,650),...own('blade',460,650),...own('frost',600,650),...own('spear',640,650)];allies.forEach((u,i)=>demoStageUnit(u,475+i*45,690,{hp:Math.max(80,u.maxHp-450+i*80)}));const [blade]=enemy('blade',lane,420);demoStageUnit(blade,555,520);if(blade){blade.speed=0;blade.damage=0;}
    label='敵へ120ダメージが命中 → ヒーラー自身110＋周囲の傷ついた味方最大3体を各110回復';scenarioKey='healer-on-hit';duration=9;
  }else if(id==='elixirgolem'){
    g.towers.forEach(t=>{t.damage=0;t.range=0;});const enemyTower=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===lane);if(enemyTower){enemyTower.damage=105;enemyTower.range=226;enemyTower.cooldown=1;enemyTower.cd=.15;}
    const [eg]=own(id,lane,650);demoStageUnit(eg,lane,360,{hp:750});if(eg){eg.speed=0;eg.damage=0;}
    const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,410);if(guard){guard.damage=280;guard.speed=0;guard.cooldown=1.2;guard.range=44;}
    label='敵タワーの105ダメージも実際にHPへ反映 → 撃破時はピンクの破裂演出とともに大1→中2→小4へ分裂';scenarioKey='elixir-golem-split-visible';duration=14;
  }else if(id==='royalgiant'){
    g.towers.forEach(t=>t.damage=0);const [rg]=own(id,lane,650);demoStageUnit(rg,lane,405);const [guard]=enemy('knight',lane,420);demoStageUnit(guard,500,430);if(guard){guard.speed=0;guard.damage=0;}
    label='目の前の敵兵を無視して、射程5マスから建物だけへ307ダメージの砲弾を発射';scenarioKey='royal-giant-cannon';duration=9;
  }else if(id==='harpy'){
    own(id,lane,650);const swarm=enemy('mossling',lane,420);swarm.forEach((u,i)=>demoStageUnit(u,490+(i%3)*42,455+Math.floor(i/3)*34));
    label='2秒ごとの連鎖雷 → 1体目180 / 2体目130 / 3体目90ダメージ＋各1秒スタン';scenarioKey='harpy-chain-falloff-stun';duration=9;
  }else if(id==='electrowizard'){
    g.towers.forEach(t=>t.range=0);
    const [wiz]=own(id,lane,650);demoStageUnit(wiz,lane,625);
    const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,515,{cd:1.2});if(guard)guard.damage=0;
    const archers=enemy('archer',500,420);archers.forEach((u,i)=>{demoStageUnit(u,500+i*22,525,{cd:1.2});u.damage=0;});
    const bats=enemy('bat',550,420);bats.forEach((u,i)=>{demoStageUnit(u,535+(i%2)*18,515+Math.floor(i/2)*18,{cd:1.2});u.damage=0;});
    label='射程185の電撃弾が密集へ着弾 → 半径35の地上/空中をまとめて135ダメージ＋1秒スタン';scenarioKey='electrowizard-splash-stun';duration=9;
  }else if(id==='frost'){
    const [shaman]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(shaman,lane,650);demoStageUnit(guard,lane,515);
    label='半径38の氷弾を連続命中 → 鈍足Lv1(80%) → Lv2(65%) → Lv3(50%)へ重複・3秒更新';scenarioKey='frost-three-stage-slow';duration=8.5;
  }else if(id==='nightshade'){
    const [shade]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(shade,lane,650);demoStageUnit(guard,lane,550);
    label='敵を感知 → 0.6秒溜め → 無敵ダッシュ387 → 2秒後に再使用可能';scenarioKey='yuno-rush';duration=8;
  }else if(id==='boar'){
    const [boar]=own(id,lane,650);demoStageUnit(boar,lane,700);const swarm=enemy('mossling',lane,420);const spots=[[512,575],[548,555],[528,535],[550,515],[512,495]];swarm.forEach((u,i)=>demoStageUnit(u,...spots[i%spots.length]));
    label='建物へ105px走ってチャージ → 軽量ゴブリンを押しのけながらタワーへ突撃';scenarioKey='boar-charge-shove';duration=10;
  }else if(id==='mage'||id==='bomber'){
    own(id,lane,650);enemy('mossling',lane,420);label='密集したゴブリンギャングへ実際の範囲攻撃';scenarioKey=`${id}-splash`;duration=8;
  }else if(id==='blowdart'||id==='archer'){
    own(id,lane,650);enemy('bat',lane,420);label='ムーンバットを相手に実際の射程・攻撃速度・対空攻撃';scenarioKey=`${id}-anti-air`;
  }else if(id==='bat'){
    own(id,lane,650);enemy('archer',lane,420);label='4体のムーンバットが川を越えて飛行し、対空ユニットと交戦';scenarioKey='moon-bat-four';
  }else{
    own(id,lane,650);enemy('knight',lane,420);
  }
  return {game:g,label,duration,scenarioKey};
}
function resetDetailDemo(){
  if(!detailCardId)return;const demo=createDetailDemo(detailCardId);detailDemoGame=demo.game;detailDemoDuration=demo.duration;detailDemoScenarioKey=demo.scenarioKey;detailDemoEvidence={seenSummonEvents:new Set(),initialSummons:0,periodicSummons:0};detailDemoLast=performance.now();if(el('cardDemoScenario'))el('cardDemoScenario').textContent=demo.label;
  const can=el('cardDetailDemo');can.dataset.demoEngine='live';can.dataset.demoCard=detailCardId;can.dataset.demoScenario=detailDemoScenarioKey;can.dataset.demoTime='0';can.dataset.demoDeathBlast='false';can.dataset.demoMiniGolems='0';can.dataset.demoTowerDamaged='false';can.dataset.demoBonesHit='false';can.dataset.demoMudZone='false';can.dataset.demoMudded='false';can.dataset.demoInitialSummons='0';can.dataset.demoPeriodicSummons='0';can.dataset.demoElixirHpDropped='false';can.dataset.demoElixirSplit='false';updateDetailDemoEvidence(can);drawArena(can,viewMatch(detailDemoGame,0),{time:0,seat:0});
}
function updateDetailDemoEvidence(can){
  if(!detailDemoGame)return;const g=detailDemoGame,events=g.events||[];
  if(events.some(e=>e.type==='death-blast'&&e.unitType==='golem'))detailDemoEvidence.deathBlast=true;
  if(events.some(e=>e.type==='death'&&e.owner===1)&&detailDemoScenarioKey==='golem-death-blast-split')detailDemoEvidence.bonesHit=true;
  const minis=g.units.filter(u=>u.hp>0&&u.type==='mini_golem'&&u.owner===0).length;detailDemoEvidence.miniGolems=Math.max(detailDemoEvidence.miniGolems||0,minis);
  const enemySide=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===ARENA.lanes[1]);if(enemySide&&enemySide.hp<enemySide.maxHp)detailDemoEvidence.towerDamaged=true;
  if((g.zones||[]).some(z=>z.kind==='mud'&&z.remaining>0))detailDemoEvidence.mudZone=true;
  if(detailDemoScenarioKey==='elixir-golem-split-visible'){
    const large=g.units.find(u=>u.owner===0&&u.type==='elixirgolem'&&u.hp>0);
    if(large&&large.hp<750)detailDemoEvidence.elixirHpDropped=true;
    if(events.some(e=>e.type==='elixir-split'&&e.owner===0))detailDemoEvidence.elixirSplit=true;
  }
  if(g.units.some(u=>u.owner===1&&u.type==='knight'&&(u.mudUntil||0)>g.time))detailDemoEvidence.mudded=true;
  const summonEvents=events.filter(e=>e.type==='summon-spawn'&&e.owner===0);for(const e of summonEvents){if(detailDemoEvidence.seenSummonEvents.has(e.id))continue;detailDemoEvidence.seenSummonEvents.add(e.id);if(e.initial)detailDemoEvidence.initialSummons++;else detailDemoEvidence.periodicSummons++;}
  can.dataset.demoDeathBlast=String(!!detailDemoEvidence.deathBlast);can.dataset.demoMiniGolems=String(detailDemoEvidence.miniGolems||0);can.dataset.demoTowerDamaged=String(!!detailDemoEvidence.towerDamaged);can.dataset.demoBonesHit=String(!!detailDemoEvidence.bonesHit);can.dataset.demoMudZone=String(!!detailDemoEvidence.mudZone);can.dataset.demoMudded=String(!!detailDemoEvidence.mudded);can.dataset.demoInitialSummons=String(detailDemoEvidence.initialSummons||0);can.dataset.demoPeriodicSummons=String(detailDemoEvidence.periodicSummons||0);can.dataset.demoElixirHpDropped=String(!!detailDemoEvidence.elixirHpDropped);can.dataset.demoElixirSplit=String(!!detailDemoEvidence.elixirSplit);
}
function openCardDetail(id){
  detailCardId=id;const d=UNITS[id];el('cardDetailRole').textContent=d.role;el('cardDetailName').textContent=d.name;el('cardDetailDesc').textContent=d.desc;const stats=el('cardDetailStats');stats.replaceChildren();
  for(const [label,value] of detailStatsFor(d)){const box=document.createElement('div');box.className='card-detail-stat';const sm=document.createElement('small');sm.textContent=label;const st=document.createElement('strong');st.textContent=value;box.append(sm,st);stats.append(box);}refreshDetailToggle();el('cardDetailPanel').hidden=false;resetDetailDemo();
}
function closeCardDetail(){el('cardDetailPanel').hidden=true;detailCardId=null;detailDemoGame=null;}
function openDeckEditor(){
  if(currentView==='battle'&&snapshot?.phase!=='ended'){toast('対戦中はデッキを変更できません。');return;}editingDeck=[...playerDeck];closeDeckCardActions();closeCardDetail();el('myListPanel').hidden=true;renderDeckEditor();el('deckModal').showModal();
}
el('deckBtn').onclick=openDeckEditor;el('homeDeckBtn').onclick=openDeckEditor;el('lobbyDeckBtn').onclick=()=>{if(room?.members[seat]?.ready){toast('準備OKを取り消してから編集してください。');return;}openDeckEditor();};
el('deckDefaultBtn').onclick=()=>{editingDeck=[...DEFAULT_DECK];renderDeckEditor();};
el('deckSaveBtn').onclick=()=>{if(!deckReady(editingDeck)){setDeckError('対戦に使う8枚を選んでください。');return;}playerDeck=[...editingDeck];persistDeck();el('deckModal').close();toast('デッキを保存しました。');};
el('myListBtn').onclick=()=>{const opening=el('myListPanel').hidden;if(opening){const stored=loadDeckPresets();if(stored.length||!deckPresets.length)deckPresets=stored;updateMyListStatus('');renderMyList();}el('myListPanel').hidden=!el('myListPanel').hidden;};el('closeMyListBtn').onclick=()=>el('myListPanel').hidden=true;el('saveMyListBtn').onclick=saveCurrentToMyList;
el('deckCardActions').addEventListener('click',e=>e.stopPropagation());el('cardDetailPanel').addEventListener('click',e=>e.stopPropagation());
el('deckActionBackdrop').onclick=closeDeckCardActions;el('deckActionClose').onclick=closeDeckCardActions;el('deckCardToggleBtn').onclick=()=>deckActionId&&toggleDeckCard(deckActionId);el('deckCardDetailBtn').onclick=()=>{const id=deckActionId;if(!id)return;closeDeckCardActions();openCardDetail(id);};
el('cardDetailBackdrop').onclick=closeCardDetail;el('cardDetailClose').onclick=closeCardDetail;el('cardDetailBack').onclick=closeCardDetail;el('cardDemoReplayBtn').onclick=resetDetailDemo;el('detailDeckToggleBtn').onclick=()=>detailCardId&&toggleDeckCard(detailCardId,{fromDetail:true});
function renderPatchNotes(){
  const host=el('patchNotes'),none=el('noPatchNotes'),range=el('updatesRange');
  if(!host)return;
  const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const cutoff=new Date(today);cutoff.setDate(cutoff.getDate()-6);
  const recent=PATCH_NOTES.filter(n=>{const d=new Date(`${n.date}T00:00:00`);return d>=cutoff&&d<=new Date(today.getTime()+86400000-1);});
  const groups=[];
  for(const note of recent){
    const major=String(note.version).split('.')[0];let group=groups.find(g=>g.major===major);
    if(!group){group={major,notes:[]};groups.push(group);}group.notes.push(note);
  }
  host.replaceChildren();
  range.textContent=`${cutoff.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})} — ${today.toLocaleDateString('ja-JP',{month:'numeric',day:'numeric'})}`;
  none.hidden=groups.length>0;
  for(const group of groups){
    const article=document.createElement('article');article.className='patch-note';
    const latest=group.notes[0],head=document.createElement('div');head.className='patch-head';
    const version=document.createElement('strong');version.textContent=`v${group.major}`;
    const title=document.createElement('h3');title.textContent=group.notes.length>1?`v${group.major} UPDATE SERIES`:latest.title;
    const date=document.createElement('time');date.dateTime=latest.date;date.textContent=new Date(`${latest.date}T00:00:00`).toLocaleDateString('ja-JP',{month:'short',day:'numeric'});
    head.append(version,title,date);article.append(head);
    for(const note of group.notes){
      const section=document.createElement('section');section.className='patch-release';
      const releaseHead=document.createElement('div');releaseHead.className='patch-release-head';
      const releaseVersion=document.createElement('strong');releaseVersion.textContent=`v${note.version}`;
      const releaseTitle=document.createElement('span');releaseTitle.textContent=note.title;
      const releaseDate=document.createElement('time');releaseDate.dateTime=note.date;releaseDate.textContent=new Date(`${note.date}T00:00:00`).toLocaleDateString('ja-JP',{month:'short',day:'numeric'});
      releaseHead.append(releaseVersion,releaseTitle,releaseDate);
      const ul=document.createElement('ul');for(const item of note.items){const li=document.createElement('li');li.textContent=item;ul.append(li);}
      section.append(releaseHead,ul);article.append(section);
    }
    host.append(article);
  }
}
el('libraryBtn').onclick=()=>{el('libraryModal').showModal();};
el('helpBtn').onclick=()=>{el('helpModal').showModal();};
el('updatesBtn').onclick=()=>{renderPatchNotes();el('updatesModal').showModal();};
for(const b of document.querySelectorAll('.close-modal'))b.onclick=()=>b.closest('dialog').close();
for(const dlg of document.querySelectorAll('dialog'))dlg.addEventListener('close',()=>{
  if(dlg.id==='deckModal'){closeDeckCardActions();closeCardDetail();el('myListPanel').hidden=true;}
  if(gameMode==='cpu'){localPaused=document.hidden||el('helpModal').open||el('libraryModal').open||el('updatesModal').open||el('deckModal').open;updateHUD();}
});
for(const dlg of document.querySelectorAll('dialog'))dlg.addEventListener('click',e=>{const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close();});
for(const id of DECK){
  const d=UNITS[id],card=document.createElement('article');card.className='library-card';
  const can=document.createElement('canvas');can.width=200;can.height=200;can.dataset.portrait=id;can.dataset.portraitMode='library';
  const badge=document.createElement('span');badge.className='badge';badge.textContent=d.cost;
  const role=document.createElement('small');role.textContent=d.role;
  const h=document.createElement('h3');h.textContent=d.name;
  const p=document.createElement('p');p.textContent=d.desc;
  const stat=document.createElement('div');stat.className='library-stat';stat.textContent=d.spell?(d.spell==='cyclone'?`範囲 R${d.radius}　${d.zoneDuration}秒吸引`:`範囲 R${d.radius}　兵 ${d.damage} / 建物 ${d.buildingDamage}`):`HP ${d.hp}${d.count>1?` ×${d.count}`:''}　攻撃 ${d.damage}`;
  card.append(badge,can,role,h,p,stat);el('libraryGrid').append(card);
}
function interpolate(g,now){
  if(!previous||g.phase==='ended'||previous.units.length===0)return g;
  const t=clamp((now-receivedAt)/(gameMode==='cpu'?100:200),0,1),old=new Map(previous.units.map(u=>[u.id,u]));
  return {...g,units:g.units.map(u=>{const p=old.get(u.id);return p?{...u,x:p.x+(u.x-p.x)*t,y:p.y+(u.y-p.y)*t}:u;})};
}
function animation(now){
  requestAnimationFrame(animation);
  if(document.hidden||now-animationLast<30)return;
  animationLast=now;const time=now/1000;
  if(currentView==='home'){
    if(now-demoLast>100){
      demoLast=now;
      if(demoGame.phase==='ended')demoGame=createMatch({seed:Math.floor(now),bot:true});
      if(demoGame.phase==='countdown')demoGame.countdown=0;
      tick(demoGame,.1);
      if(demoGame.time>demoAutoAt){runBot(demoGame,0);demoAutoAt=demoGame.time+1.2;}
      if(demoGame.time<1)demoAutoAt=0;
    }
    drawArena(el('demoCanvas'),viewMatch(demoGame,0),{time,seat:0});
  }
  if(currentView==='battle'&&snapshot){
    drawArena(el('arenaCanvas'),interpolate(snapshot,now),{time,seat,selected,ghost:hover||(pendingBuildingPlacement?.card===selected?pendingBuildingPlacement:null),physics:physicsOverlay});
    if(window.innerWidth>800)drawPortrait(el('inspectorCanvas'),inspectId,time);
  }
  if(now%200<36||currentView==='battle'){
    for(const can of document.querySelectorAll('canvas[data-portrait]'))if(can.getClientRects().length)drawPortrait(can,can.dataset.portrait,time,0,false,rosterBack&&!!can.closest('#libraryModal'));
  }
  if(detailCardId&&!el('cardDetailPanel').hidden&&detailDemoGame){
    const can=el('cardDetailDemo');
    if(now-detailDemoLast>=90){const steps=Math.min(10,Math.max(1,Math.floor((now-detailDemoLast)/100)));for(let i=0;i<steps;i++){tick(detailDemoGame,.1);updateDetailDemoEvidence(can);}detailDemoLast=now;if(detailDemoGame.phase==='ended'||detailDemoGame.time>=detailDemoDuration)resetDetailDemo();}
    can.dataset.demoTime=detailDemoGame.time.toFixed(1);can.dataset.demoUnits=String(detailDemoGame.units.filter(u=>u.hp>0).length);updateDetailDemoEvidence(can);drawArena(can,viewMatch(detailDemoGame,0),{time,seat:0});
  }
}
requestAnimationFrame(animation);
updateInspector('blade');renderDeckSummaries();
async function boot(){
  if(standalone){status('CPU練習・オフライン版');el('onlineBtn').disabled=true;entryError('このファイルはCPU練習用です。オンライン対戦は同梱のプロジェクトをCloudflareに公開してください。');return;}
  try{
    const config=await api('/api/config');
    if(config.version!==VERSION){incompatibleVersion=true;setOnlineBusy(false);entryError('ゲームが更新されています。Ctrl + F5で再読み込みしてください。');throw new Error('Version mismatch');}
    if(config.game!=='tiny-siege')throw new Error('別のゲームのAPIが応答しています。');
    if(config.maxDeck!==MAX_DECK)throw new Error('デッキ仕様が更新されています。');
    serverAvailable=true;status('オンライン対応');
    const saved=safeStorage('session','tiny-session');
    if(saved){
      try{const s=JSON.parse(saved);if(/^\d{6}$/.test(s.code)&&typeof s.token==='string'){session=s;seat=s.seat;gameMode='online';connect();}}catch{}
    }
  }catch(e){status('CPU練習が使えます',true);serverAvailable=false;}
  apiChecked=true;
}
boot();
