/** Balance data: original prototype values. Both browser and server import this file. */
export const VERSION = '38.0.0';
export const MAX_DECK = 8;
export const MAP_THEMES = Object.freeze(['grass','stone','lava','snow','desert']);
export const GRID_COLS = 18;
export const GRID_ROWS = 32;
export const GRID_CELL = 40;
export const GRID_BASELINE_PX = 33; // v36 archer 165px == v37 five cells.
export const cellsToWorld = cells => cells * GRID_CELL;
export const worldToCells = world => world / GRID_CELL;
export const gridColumnCenter = col => (col - .5) * GRID_CELL;
export const gridRowCenter = row => GRID_ROWS * GRID_CELL - (row - .5) * GRID_CELL;
export function gridRectCenter(col1,col2,row1,row2){
  return {x:((col1+col2)/2-.5)*GRID_CELL,y:GRID_ROWS*GRID_CELL-((row1+row2)/2-.5)*GRID_CELL};
}
export const ARENA = Object.freeze({
  cols:GRID_COLS, rows:GRID_ROWS, cellSize:GRID_CELL,
  width:GRID_COLS*GRID_CELL, height:GRID_ROWS*GRID_CELL,
  midX:GRID_COLS*GRID_CELL/2,
  riverRows:Object.freeze([16,17]), riverTop:15*GRID_CELL, riverBottom:17*GRID_CELL,
  // Bridges are two grid cells wide while staying centred on the two lane/tower centre lines.
  bridgeCenterColumns:Object.freeze([4,15]),
  bridgeColumns:Object.freeze([[3,5],[14,16]]),
  bridges:Object.freeze([gridColumnCenter(4),gridColumnCenter(15)]), bridgeHalf:GRID_CELL,
  laneColumns:Object.freeze([4,15]), lanes:Object.freeze([gridColumnCenter(4),gridColumnCenter(15)]),
  deployBottom:17*GRID_CELL, deployTop:15*GRID_CELL,
  advancedDeployInset:3*GRID_CELL, advancedCenterHalf:GRID_CELL,
  sideTowerCells:3, coreTowerCells:4, defaultBuildingCells:3,
  maxUnits:120, duration:180, overtime:60, maxEnergy:10, tick:0.1, firstStrikeDelay:.25
});
export const TOWER_GRID = Object.freeze({
  blue:Object.freeze({left:Object.freeze([3,5,6,8]),right:Object.freeze([14,16,6,8]),core:Object.freeze([8,11,2,5])}),
  red:Object.freeze({left:Object.freeze([3,5,25,27]),right:Object.freeze([14,16,25,27]),core:Object.freeze([8,11,28,31])})
});
export const SUMMON_DELAY_BY_COST = Object.freeze({1:.4,2:.5,3:.7,4:.9,5:1.2,6:1.5,7:1.8,8:2.1});
export const VISION_CELLS_BY_SIZE = Object.freeze({small:4,medium:5,large:6});
export const MELEE_RANGE_CELLS = Object.freeze({close:1,medium:1.5,long:2});
export const MELEE_RANGE_LABELS = Object.freeze({close:'\u8fd1\u8ddd\u96e2',medium:'\u4e2d\u8ddd\u96e2',long:'\u9577\u8ddd\u96e2'});
export function meleeRangeTierFor(data){
  if(!data||data.spell||data.building||data.projectile||data.laserUnit||data.sparkUnit)return null;
  const cells=Number.isFinite(data.rangeCells)?data.rangeCells:worldToCells(data.range||0);
  if(cells<=MELEE_RANGE_CELLS.close+1e-6)return 'close';
  if(cells<=MELEE_RANGE_CELLS.medium+1e-6)return 'medium';
  if(cells<=MELEE_RANGE_CELLS.long+1e-6)return 'long';
  return null;
}
export function meleeRangeLabelFor(data){const tier=data?.meleeTier||meleeRangeTierFor(data);return tier?MELEE_RANGE_LABELS[tier]||null:null;}
const BUILDING_GEOMETRY = Object.freeze({
  cannon:Object.freeze({visualScale:1.90,hitboxCols:2.20,hitboxRows:1.90}),
  tombstone:Object.freeze({visualScale:1.72,hitboxCols:1.85,hitboxRows:2.45}),
  oven:Object.freeze({visualScale:1.62,hitboxCols:2.35,hitboxRows:2.30}),
  lasertower:Object.freeze({visualScale:1.68,hitboxCols:2.05,hitboxRows:2.45}),
  elixirpump:Object.freeze({visualScale:1.72,hitboxCols:2.30,hitboxRows:2.45})
});
export const VISION_BY_SIZE = Object.freeze(Object.fromEntries(Object.entries(VISION_CELLS_BY_SIZE).map(([k,v])=>[k,cellsToWorld(v)])));
export function visionSizeFor(data){
  if(!data)return 'small';
  if(data.visionSize&&VISION_BY_SIZE[data.visionSize])return data.visionSize;
  const radius=Number.isFinite(data.radius)?data.radius:12;
  return radius>=24?'large':radius>=15?'medium':'small';
}
export function visionRangeFor(data){
  if(!data)return VISION_BY_SIZE.small;
  if(data.visionMatchesRange)return Math.max(0,data.range||0);
  if(Number.isFinite(data.aggroRange))return Math.max(0,data.aggroRange);
  const base=VISION_BY_SIZE[visionSizeFor(data)]||VISION_BY_SIZE.medium;
  // Long-range weapons can acquire targets one grid cell beyond their firing range.
  const ranged=(!data.buildingOnly&&(data.projectile||data.laserUnit||data.sparkUnit||(data.rangeCells||0)>=3))?Math.max(0,(data.range||0)+GRID_CELL):0;
  return Math.max(base,ranged);
}
export function visionCellsFor(data){return visionRangeFor(data)/GRID_CELL;}
export function summonDelayFor(data){
  if(!data||data.spell||data.hidden||data.tunnelAnywhere)return 0;
  if(Number.isFinite(data.summonDelay))return Math.max(0,data.summonDelay);
  return SUMMON_DELAY_BY_COST[data.cost]??Math.max(.4,Math.min(2.5,.3+(data.cost||1)*.25));
}
const RAW_UNITS = {
  blade: {id:'blade',mass:2,name:'アッシュ剣士',short:'剣士',role:'近接アタッカー',cost:2,hp:780,damage:112,speed:50,range:34,cooldown:1.05,radius:16,count:1,air:false,targetsAir:false,color:'#efc577',desc:'攻守の基準になる剣士。盾役の後ろで前線を押し上げる。'},
  knight:{id:'knight',mass:6,name:'アイアン衛士',short:'衛士',role:'近接タンク',cost:3,hp:1850,damage:202,speed:32,range:36,cooldown:1.35,radius:23,count:1,air:false,targetsAir:false,color:'#a7b9c3',desc:'高い体力で攻撃を受け止めながら、202の近接攻撃で前線を押し返す3コスト前衛。後ろに弓兵や術師を重ねると安定する。'},
  archer:{id:'archer',mass:1.2,name:'リーフ弓兵',short:'弓兵',role:'遠距離・対空・2体編成',cost:3,hp:304,damage:112,speed:45,range:165,cooldown:1.15,radius:12,count:2,air:false,targetsAir:true,projectile:'arrow',color:'#a6ca8b',desc:'小柄なリーフ弓兵2体を横並びで展開する3コスト遠距離カード。1体HP304・攻撃112・射程165で地上と空中を狙う。2体同時の射撃性能に合わせてコストを3へ調整。'},
  mage:{id:'mage',mass:1.6,name:'ルーン術師',short:'術師',role:'範囲攻撃・対空',cost:3,hp:480,damage:105,speed:39,range:158,cooldown:1.5,radius:15,count:1,air:false,targetsAir:true,projectile:'orb',splash:54,color:'#b9a0ef',desc:'3コストへ軽量化された範囲術師。魔力弾が周囲にもダメージを与え、密集した敵やコウモリに有効。'},
  spear:{id:'spear',mass:1.2,name:'スパーク槍兵',short:'槍兵',role:'中距離・低コスト',cost:2,hp:410,damage:82,speed:57,range:68,cooldown:0.9,radius:14,count:1,air:false,targetsAir:false,color:'#f6a98d',desc:'長い槍で剣士より少し離れて攻撃。素早い援軍や防衛に。'},
  bat:{id:'bat',mass:0.6,name:'コウモリの群れ',short:'コウモリ',role:'飛行・5体編成',cost:2,hp:92,damage:82,speed:74,range:28,cooldown:1.2,radius:11,count:5,air:true,targetsAir:true,color:'#b7a7dc',desc:'5体のコウモリがまとまって出撃し、川を飛び越える。1体HP92・攻撃82・攻撃間隔1.2秒。単体は脆いが、対空できない敵を数で一気に削る。'},
  bomber:{id:'bomber',mass:2,name:'ボンバー',short:'ボンバー',role:'地上範囲攻撃・山なり投擲',cost:2,hp:470,damage:174,speed:38,range:145,cooldown:1.8,radius:16,count:1,air:false,targetsAir:false,projectile:'bomb',splash:66,color:'#edaa66',desc:'2コストの範囲爆撃兵。爆弾を山なりに投げ、地上の密集へ174ダメージを与える。爆弾は以前より少しゆっくり飛ぶため、着弾までわずかな間がある。空中の敵には攻撃できない。'},
  cannon:{id:'cannon',mass:1000000,name:'大砲',short:'大砲',role:'防衛建物・耐久減衰',cost:3,hp:1000,damage:200,speed:0,range:218,cooldown:1,radius:24,count:1,air:false,targetsAir:false,projectile:'shell',building:true,decayPerSecond:30,color:'#8dbfb3',desc:'動かない3コスト防衛建物。HP1000・攻撃200・攻撃間隔1.0秒。設置後は毎秒30ずつ耐久が自然減少し、攻撃を受けなくても約33秒で崩れる。'},
  golem:{id:'golem',mass:16,name:'ストーンゴーレム',short:'ゴーレム',role:'建物特攻・超耐久分裂',cost:8,hp:4256,damage:260,speed:19,summonDelay:2.5,range:42,cooldown:2.5,radius:30,count:1,air:false,targetsAir:false,buildingOnly:true,deathDamage:260,deathRadius:75,splitType:'mini_golem',splitCount:2,color:'#8ea37d',desc:'建物だけを狙う超重量ゴーレム。HP4256・攻撃260で、2.5秒ごとに重い一撃を放つ。配置後は2.5秒かけて召喚され、倒されるとちびゴーレム2体へ分裂し、死亡時に周囲へ260ダメージ。'},
  icegolem:{id:'icegolem',mass:5.8,name:'アイスゴーレム',short:'アイゴレ',role:'建物特攻・死亡時氷爆発',cost:2,hp:1228,damage:84,speed:26,range:32,cooldown:2.5,radius:20,count:1,air:false,targetsAir:false,buildingOnly:true,deathDamage:84,deathRadius:60,color:'#9edff4',desc:'2コストの低速な建物特攻ゴーレム。HP1228・攻撃84・攻撃間隔2.5秒で敵ユニットを無視してタワーや設置物だけを狙う。倒されると半径60の周囲へ84ダメージの氷爆発を起こす。死亡時の鈍足など追加効果はない。'},
  berserker:{id:'berserker',mass:8.2,name:'クラッグバーサーカー',short:'クラッグ',role:'重量アタッカー・超高火力',cost:7,hp:3760,damage:842,speed:28,range:40,cooldown:1.8,radius:24,count:1,air:false,targetsAir:false,color:'#b96550',desc:'巨大な戦槌を振るう7コスト重量級アタッカー。HP3760・攻撃842・攻撃間隔1.8秒で、遅い代わりに正面からの殴り合いを強く押し切る。'},
  miniberserker:{id:'miniberserker',mass:4.3,name:'ミニバーサーカー',short:'ミニバサ',role:'近接・高速超火力',cost:4,hp:1390,damage:755,speed:46,range:34,cooldown:1.6,radius:18,count:1,air:false,targetsAir:false,color:'#c66a58',desc:'頭と体がほぼ1:1の小型バーサーカー。大剣を頭上に掲げてやや速く進み、HP1390・攻撃755の強烈な一撃を1.6秒間隔で叩き込む4コスト単体アタッカー。'},
  megaknight:{id:'megaknight',mass:11.5,name:'メガナイト',short:'メガナイト',role:'範囲近接・落下召喚・ジャンプ',cost:7,hp:3993,damage:263,speed:36,summonDelay:1.5,range:40,cooldown:1.6,radius:28,count:1,air:false,targetsAir:false,meleeSplash:48,megaKnight:true,dropDamage:420,dropRadius:48,jumpWindup:1.7,jumpMinRange:80,jumpMaxRange:160,jumpTravelTime:1.5,jumpDamage:537,jumpRadius:48,color:'#555d66',desc:'両手に黒い鉄球を持つ大型重戦士。HP3993・通常攻撃263。指定地点へ1.5秒後に上空から落下し、半径48へ420ダメージ。80～160の敵には1.7秒その場で溜め、1.5秒かけて大きく弧を描いてジャンプし、着地時は半径48へ537ダメージ。'},
  ironeye:{id:'ironeye',mass:1.55,name:'鉄の目',short:'鉄の目',role:'中距離・弱点マーク・一度きり回転突進',cost:4,hp:750,damage:125,speed:40,range:160,cooldown:1.3,radius:15,count:1,air:false,targetsAir:true,projectile:'iron_arrow',ironMark:true,markDamageBonus:.20,markThreshold:500,markBurstDamage:300,ironSpinOnce:true,spinTriggerRange:78,spinDistance:120,spinDuration:.4,spinDamage:180,spinHitRadius:22,spinSlowMove:.70,spinSlowDuration:2.5,color:'#547a58',desc:'顔を深いフードで隠した4コストの中距離暗殺弓兵。矢で敵ユニットへ鉄の目マークを付け、マーク中は味方から受けるダメージが20%増加。実ダメージが累計500に達すると印が砕けて追加300ダメージ。敵地上兵が近づくと1体につき一度だけ隠し刃で120ほど貫通突進し、命中した全員へ180ダメージ・マーク・2.5秒間30%鈍足を与える。'},
  tracker:{id:'tracker',mass:5.4,name:'追跡者',short:'追跡者',role:'近接・万能フック',cost:5,hp:1900,damage:320,speed:40,range:36,cooldown:1.4,radius:20,count:1,air:false,targetsAir:false,tracker:true,hookRange:180,hookMinRange:55,hookWindup:.6,hookPullDuration:.45,hookCooldown:4,hookAirAttackDuration:2,color:'#6b7479',desc:'顔の見えない細身の長身鎧騎士。5コスト・攻撃320。右手に片手剣、左手に小盾を持ち、4秒ごとに射程180のフックを使用する。地上敵は自分の近接距離まで引き寄せ、空中敵は引き寄せた対象だけ2秒間攻撃可能。建物へ刺した場合は建物を動かさず、自分が近接位置まで引き寄せられる。'},
  valkyrie:{id:'valkyrie',mass:4.8,name:'ヴァルキリー',short:'ヴァルキリー',role:'地上範囲・回転斬り',cost:4,hp:2200,damage:260,speed:34,range:34,cooldown:1.45,radius:20,count:1,air:false,targetsAir:false,meleeSplash:50,valkyrieSpin:true,color:'#d87947',desc:'オレンジの短髪と大きな斧が目印の4コスト地上戦士。HP2200・攻撃260。攻撃時は体を横倒しにせず、前向きと後ろ向きを切り替えながら斧だけを大きく振り回し、自分中心半径50の地上敵をまとめて薙ぎ払う。'},
  gargoyle:{id:'gargoyle',mass:.72,name:'ガーゴイル',short:'ガーゴイル',role:'飛行・高速3体編成',cost:3,hp:230,damage:102,speed:69,range:45,cooldown:1.15,radius:10,count:3,air:true,targetsAir:true,color:'#6968a5',desc:'青紫色の小型飛行魔獣3体を展開する3コストカード。1体HP230・攻撃102で、地上と空中の両方を狙える。移動は速く、ほぼ近接だが少しだけ離れた射程45から素早く襲いかかる。'},
  gargoyleswarm:{id:'gargoyleswarm',mass:.72,name:'ガーゴイルの群れ',short:'ガーゴイル群',role:'飛行・高速6体編成',cost:5,hp:230,damage:102,speed:69,range:45,cooldown:1.15,radius:10,count:6,air:true,targetsAir:true,spawnType:'gargoyle',color:'#7770b0',desc:'ガーゴイル6体を一気に展開する5コストの大群カード。1体ごとの性能は通常のガーゴイルと同じHP230・攻撃102・速度69・射程45。単体攻撃へ物量で押し切れる一方、範囲対空にはまとめて倒されやすい。'},
  mini_golem:{id:'mini_golem',hidden:true,mass:5.3,name:'ちびゴーレム',short:'ちび',role:'建物特攻・分裂後',cost:0,hp:851,damage:52,speed:25,range:32,cooldown:2.5,radius:18,count:1,air:false,targetsAir:false,buildingOnly:true,deathDamage:52,deathRadius:45,color:'#9aa88a',desc:'ストーンゴーレムが倒れた後に2体現れる小型体。本体のおよそ1/5となるHP851・攻撃52・死亡爆発52を持ち、攻撃間隔は本体と同じ2.5秒。'},
  boar:{id:'boar',mass:9.5,name:'アイアンボア',short:'ボア',role:'建物突撃・川岸ジャンプ',cost:4,hp:1696,damage:318,speed:69,range:28,cooldown:1.6,radius:18,count:1,air:false,targetsAir:false,buildingOnly:true,chargeDistance:105,chargeMultiplier:2.25,shovePower:14,shoveMassLimit:2.2,shoveCompression:.62,riverJumper:true,riverJumpSpawnBand:90,riverJumpTrigger:28,riverJumpTravelTime:1.2,riverJumpLift:52,color:'#b4785f',desc:'HP1696・攻撃318・攻撃間隔1.6秒の建物特攻。橋の正面に配置した場合や川岸から離れた場所に配置した場合は通常どおり橋へ向かう。橋以外の川岸すぐ横に配置した場合だけ岸まで進み、対岸のすぐそばへゆっくりジャンプする。軽量な地上兵を押しのけ、105px走ると最初の体当たりが2.25倍。'},
  tigger:{id:'tigger',mass:1.8,name:'穴掘りティガー',short:'ティガー',role:'奇襲・対ユニット高火力',cost:3,hp:1100,damage:120,structureDamage:70,speed:50,range:30,cooldown:1.1,radius:16,count:1,air:false,targetsAir:false,tunnelAnywhere:true,burrowMin:.9,burrowMax:2.8,burrowBase:.55,burrowSpeedDivisor:380,color:'#c08a52',desc:'戦場の好きな地上地点へ地下移動する奇襲兵。地上に出た後は敵ユニットへ120ダメージ、タワー・設置物には70ダメージ。攻撃間隔1.1秒。潜行中は完全に攻撃対象外。'},
  muddragon:{id:'muddragon',mass:4.8,name:'マッドドラゴン',short:'泥竜',role:'空中範囲・泥沼制圧',cost:5,hp:1600,damage:200,speed:33,range:78,cooldown:1.6,radius:22,count:1,air:true,targetsAir:true,projectile:'mud',splash:45,mudRadius:45,mudDuration:2,mudTickEvery:.5,mudDamage:30,mudSlow:.70,color:'#8b7657',desc:'少し遅い飛行ドラゴン。射程78・半径45の範囲攻撃と2秒間の泥沼を持つが、v16でHPを2000から1600へ低下。泥沼は地上兵だけに30ダメージの継続攻撃と30%移動低下を与える。'},
  nightshade:{id:'nightshade',mass:1.05,name:'ユーノ',short:'ユーノ',role:'暗殺・無敵ダッシュ',cost:3,hp:907,damage:193,speed:79,range:30,cooldown:1,radius:13,count:1,air:false,targetsAir:false,aggroRange:105,dashAggroRange:105,dashWindup:.6,dashMinRange:80,dashMaxRange:205,dashSpeed:650,dashDamage:387,dashCooldown:2,color:'#4f8a62',desc:'白髪と緑のフード付きマント、黒い目元マスク、タガーが特徴の小柄な暗殺者。近づいた敵や建物を捉えると0.6秒溜めて無敵ダッシュし、到達時に387ダメージ。その後は193ダメージを1秒間隔で攻撃し、ダッシュは2秒で再使用できる。'},
  mossling:{id:'mossling',mass:.45,name:'ゴブリンギャング',short:'ギャング',role:'混成群体・地上3＋槍3',cost:3,hp:202,damage:125,speed:64,range:21,cooldown:1.1,radius:9,count:6,air:false,targetsAir:true,spawnTypes:['goblin_melee','goblin_melee','goblin_melee','goblin_spear','goblin_spear','goblin_spear'],color:'#8fb56b',desc:'通常ゴブリン3体と槍ゴブリン3体の6体編成。通常ゴブリンはHP202・攻撃125・1.1秒間隔、槍ゴブリンはHP133・攻撃81・1.6秒間隔で地上と空中を攻撃する。'},
  goblin_melee:{id:'goblin_melee',hidden:true,mass:.45,name:'ゴブリン',short:'ゴブリン',role:'地上近接',cost:0,hp:202,damage:125,speed:64,range:21,cooldown:1.1,radius:9,count:1,air:false,targetsAir:false,color:'#8fb56b',desc:'HP202・攻撃125・攻撃間隔1.1秒の軽量地上ゴブリン。'},
  goblin_spear:{id:'goblin_spear',hidden:true,mass:.45,name:'槍ゴブリン',short:'槍ゴブ',role:'遠距離投げ槍・対空',cost:0,hp:133,damage:81,speed:64,range:160,cooldown:1.6,radius:9,count:1,air:false,targetsAir:true,projectile:'thrown_spear',color:'#9ebd72',desc:'HP133・攻撃81・攻撃間隔1.6秒。槍を投げ、射程160から地上・空中の両方を攻撃する。'},
  goblins:{id:'goblins',mass:.45,name:'ゴブリン',short:'ゴブリン',role:'地上群体・4体編成',cost:2,hp:202,damage:125,speed:64,range:21,cooldown:1.1,radius:9,count:4,air:false,targetsAir:false,spawnType:'goblin_melee',color:'#8fb56b',desc:'2コストでHP202・攻撃125・攻撃間隔1.1秒の通常ゴブリンを4体生成する地上群体カード。'},
  speargoblins:{id:'speargoblins',mass:.45,name:'槍ゴブリン',short:'槍ゴブ',role:'遠距離対空・3体編成',cost:2,hp:133,damage:81,speed:64,range:160,cooldown:1.6,radius:9,count:3,air:false,targetsAir:true,projectile:'thrown_spear',spawnType:'goblin_spear',color:'#9ebd72',desc:'2コストでHP133・攻撃81・攻撃間隔1.6秒の槍ゴブリンを3体生成。地上と空中を攻撃できる。'},
  megagargoyle:{id:'megagargoyle',mass:2.4,name:'メガガーゴイル',short:'メガガーゴ',role:'飛行・重装対空',cost:3,hp:837,damage:311,speed:45,range:60,cooldown:1.5,radius:14,count:1,air:true,targetsAir:true,color:'#59618f',desc:'3コストの重装飛行ユニット。HP837・攻撃311・攻撃間隔1.5秒・速さ普通。地上と空中を攻撃し、射程60で通常ガーゴイルより少し長い。鎧を着けた一回り大きいガーゴイル。'},
  apprenticeguards:{id:'apprenticeguards',mass:2.1,name:'見習い親衛隊',short:'見習い隊',role:'横一列6体・独立シールド',cost:7,hp:547,damage:133,speed:40,range:36,cooldown:1.3,radius:14,count:6,air:false,targetsAir:false,spawnType:'apprenticeguard',shieldMax:240,shieldAll:true,wideFormation:true,wideFormationSpacing:100,color:'#7e94a5',desc:'7コストで見習い親衛隊6体をほぼ画面いっぱいの横一列に展開する。1体HP547＋シールド240、攻撃133、攻撃間隔1.3秒、移動速度は普通。大きな盾と槍を持つが少し頼りなさそうな新人兵。シールドが先に全ダメージを受け、壊れると盾そのものが消える。配置位置を左右へ寄せることで4体＋2体のように2レーンへ振り分けられる。'},
  apprenticeguard:{id:'apprenticeguard',hidden:true,mass:2.1,name:'見習い親衛兵',short:'見習い兵',role:'シールド近接',cost:0,hp:547,damage:133,speed:40,range:36,cooldown:1.3,radius:14,count:1,air:false,targetsAir:false,shieldMax:240,shieldAll:true,color:'#7e94a5',desc:'見習い親衛隊の1体。HP547とは別にシールドHP240を持ち、シールドが0になると大盾を失う。'},
  icespirit:{id:'icespirit',mass:.35,name:'アイススピリット',short:'アイスピ',role:'高速・飛びつき範囲フリーズ',cost:1,hp:217,damage:110,speed:96,range:24,cooldown:99,radius:9,count:1,air:false,targetsAir:true,iceSpirit:true,iceLeapRange:70,iceLeapDuration:.24,iceBlastRadius:48,stunDuration:1.1,color:'#a8e9ff',desc:'1コストの超高速地上ユニット。HP217。地上・空中の敵へ走り寄り、射程70まで近づくと飛びついて爆発。半径48へ110範囲ダメージを与え、命中した敵を1.1秒フリーズして自身は消滅する。雪玉に手足が生えたような見た目。'},
  firespirit:{id:'firespirit',mass:.35,name:'ファイヤスピリット',short:'ファイスピ',role:'高速・飛びつき範囲自爆',cost:1,hp:215,damage:215,speed:96,range:24,cooldown:99,radius:9,count:1,air:false,targetsAir:true,fireSpirit:true,fireLeapRange:70,fireLeapDuration:.24,fireBlastRadius:48,color:'#f07a3d',desc:'1コストの超高速地上ユニット。HP215。地上・空中の敵へ走り寄り、射程70まで近づくと飛びついて自爆し、半径48へ215範囲ダメージを与えて自身は消滅する。丸いマグマの身体に小さな手足が生えた見た目。'},
  skeleton:{id:'skeleton',mass:.20,name:'スケルトン',short:'スケルトン',role:'低コスト・3体編成',cost:1,hp:81,damage:81,speed:69,range:19,cooldown:.72,radius:7,count:3,air:false,targetsAir:false,color:'#d9d2b5',desc:'1コストでHP81・攻撃81のスケルトンを3体展開する低コスト群体。単体攻撃の足止めや素早い防衛に向く。'},
  boneswarm:{id:'boneswarm',mass:.20,name:'スケルトン部隊',short:'スケ部隊',role:'群体・15体編成',cost:4,hp:81,damage:81,speed:69,range:19,cooldown:.72,radius:7,count:15,air:false,targetsAir:false,spawnType:'skeleton',color:'#d9d2b5',desc:'HP81・攻撃81のスケルトン15体を一気に展開する超群体。単体攻撃へ圧倒的な物量で押し寄せる一方、範囲攻撃には弱い。'},
  tombstone:{id:'tombstone',mass:1000000,name:'墓石',short:'墓石',role:'設置物・スケルトン継続召喚',cost:3,hp:530,damage:0,speed:0,range:0,cooldown:99,radius:22,count:1,air:false,targetsAir:false,building:true,decayPerSecond:30,summonType:'skeleton',summonCount:2,summonInterval:4,summonOnDeploy:true,deathSummonType:'skeleton',deathSummonCount:4,color:'#7e8073',desc:'HP530の3コスト設置物。建設完了時にスケルトン2体を呼び、その後4秒ごとに2体を追加召喚。毎秒30ずつHPが自然減少し、破壊された瞬間は召喚待ちなしでスケルトン4体をその場に出す。'},
  oven:{id:'oven',mass:1000000,name:'オーブン',short:'オーブン',role:'設置物・ファイヤスピリット継続召喚',cost:4,hp:900,damage:0,speed:0,range:0,cooldown:99,radius:26,count:1,air:false,targetsAir:false,building:true,decayPerSecond:30,summonType:'firespirit',summonCount:2,summonInterval:10,summonOnDeploy:true,color:'#c87545',desc:'HP900の4コスト設置物。建設完了時にファイヤスピリット2体を召喚し、その後も10秒ごとに2体ずつ追加召喚する。毎秒30ずつHPが自然減少し、攻撃を受けなくても約30秒で崩れる。四角いコンロの上に大きな鍋が載り、鍋の中から炎の精霊が飛び出す。'},
  barbarian:{id:'barbarian',hidden:true,mass:3.8,name:'バーバリアン',short:'バーバリアン',role:'地上近接',cost:0,hp:716,damage:192,speed:40,range:34,cooldown:1.4,radius:21,count:1,air:false,targetsAir:false,color:'#d7ad55',desc:'上半身裸の金髪・金髭の地上近接戦士。HP716・攻撃192・攻撃間隔1.4秒・移動速度は普通。'},
  barbarians:{id:'barbarians',mass:3.8,name:'バーバリアン',short:'バーバリアン',role:'地上近接・5体編成',cost:5,hp:716,damage:192,speed:40,range:34,cooldown:1.4,radius:21,count:5,air:false,targetsAir:false,spawnType:'barbarian',color:'#d7ad55',desc:'5コストでバーバリアン5体を召喚。1体ごとにHP716・攻撃192・攻撃間隔1.4秒・普通速度で、地上の敵と建物を近接攻撃する。上半身裸の金髪・金髭の大柄な戦士。'},
  siegebarbarian:{id:'siegebarbarian',mass:8.8,name:'攻城バーバリアン',short:'攻城ババ',role:'建物特攻・2秒加速突進・撃破展開',cost:4,hp:966,damage:265,speed:40,range:30,cooldown:99,radius:24,count:1,air:false,targetsAir:false,buildingOnly:true,siegeRam:true,suicideUnit:true,suicideDamage:265,ramImpactDamage:265,ramChargeDamage:572,ramChargeAfter:2,ramChargeSpeedMultiplier:1.35,deathSummonType:'barbarian',deathSummonCount:2,color:'#9b774d',desc:'4コストの木製攻城兵器。木のHPは966で建物だけを狙う。通常接触は265ダメージ。連続して2秒進むと少し加速して突進状態となり、接触ダメージが572へ上昇。ザップなどのスタンで加速はリセット。木が壊れた時、または建物へ衝突して砕けた時に中からバーバリアン2体が出現する。'},
  elixirgolem:{id:'elixirgolem',mass:6.2,name:'エリクサーゴーレム',short:'エリゴレ',role:'建物特攻・2段階分裂・敵エリクサー付与',cost:3,hp:1568,damage:254,speed:30,range:34,cooldown:2,radius:23,count:1,air:false,targetsAir:false,buildingOnly:true,splitType:'elixir_golem_mid',splitCount:2,enemyEnergyOnDeath:1,elixirStage:1,color:'#e88ac5',desc:'3コストのピンク色の攻城ゴーレム。HP1568・攻撃254・攻撃間隔2秒で建物だけを狙う。倒されるとHP784・攻撃127の中型2体へ分裂し、さらに各中型がHP392・攻撃64の小型2体へ分裂する。撃破されるたび相手へエリクサーを与えるため、低コスト高耐久の代わりに処理後の反撃を招きやすい。'},
  elixir_golem_mid:{id:'elixir_golem_mid',hidden:true,mass:3.1,name:'エリクサーゴーレム中型',short:'エリゴレ中',role:'建物特攻・分裂中間体',cost:0,hp:784,damage:127,speed:30,range:30,cooldown:2,radius:16,count:1,air:false,targetsAir:false,buildingOnly:true,splitType:'elixir_blob',splitCount:2,enemyEnergyOnDeath:1,elixirStage:2,color:'#ed9ad0',desc:'エリクサーゴーレムが分裂した中型体。HP784・攻撃127で建物だけを狙い、倒されると小型2体へ分裂する。倒されるごとに相手へ1エリクサーを与える。'},
  elixir_blob:{id:'elixir_blob',hidden:true,mass:1.1,name:'エリクサーのしずく',short:'しずく',role:'建物特攻・最終分裂体',cost:0,hp:392,damage:64,speed:30,range:22,cooldown:2,radius:10,count:1,air:false,targetsAir:false,buildingOnly:true,enemyEnergyOnDeath:.5,elixirStage:3,color:'#f0a4d7',desc:'最終段階の丸いピンク色の小型体。HP392・攻撃64で建物だけを狙い、倒されるごとに相手へ0.5エリクサーを与える。'},
  royalgiant:{id:'royalgiant',mass:9.2,name:'ロイヤルジャイアント',short:'ロイジャイ',role:'遠距離・建物限定砲撃',cost:6,hp:3164,damage:307,speed:27,range:165,cooldown:1.8,radius:27,count:1,air:false,targetsAir:false,buildingOnly:true,projectile:'royal_shell',color:'#d8b16e',desc:'金髪と王冠が目印の大型砲兵。HP3164・攻撃307・攻撃間隔1.8秒。移動は遅いが、リーフ弓兵ほどの射程165から敵兵を無視して建物だけを大砲で砲撃する6コスト攻城ユニット。'},
  lumina:{id:'lumina',mass:2.2,name:'ヒーラー',short:'ヒーラー',role:'攻撃連動回復・前線支援',cost:4,hp:1900,damage:120,speed:39,range:120,cooldown:1.75,radius:17,count:1,air:false,targetsAir:false,projectile:'light',healOnHit:110,healOnHitRange:120,healOnHitMaxAllies:3,color:'#e7dba8',desc:'敵へ攻撃が命中するたびに自分を110回復し、さらに周囲120以内で傷ついた味方ユニットを最大3体まで各110回復する戦闘型ヒーラー。HP1900・攻撃120・攻撃間隔1.75秒で、攻撃できている間ほど前線を粘り強く支える。'},
  frost:{id:'frost',mass:1.5,name:'フロストシャーマン',short:'シャーマン',role:'範囲妨害・3段階鈍足',cost:3,hp:535,damage:74,speed:38,range:170,cooldown:1.4,radius:15,count:1,air:false,targetsAir:false,projectile:'frost',splash:38,slowMoveStages:[.80,.65,.50],slowAttackStages:[.90,.80,.70],slowDuration:3,color:'#9ccfe2',desc:'3コストの氷術師。半径38の氷弾で地上の敵をまとめて攻撃し、鈍足を3段階まで重複させる。効果中に再被弾するとLvが上がり、Lv1/2/3で移動速度が80%/65%/50%へ低下。命中のたびに3秒へ更新する。'},
  harpy:{id:'harpy',mass:1.05,name:'ストームハーピー',short:'ハーピー',role:'空中遠距離・減衰連鎖スタン',cost:4,hp:505,damage:180,speed:57,range:175,cooldown:2,radius:16,count:1,air:true,targetsAir:true,projectile:'lightning',chainCount:3,chainRange:105,chainDamages:[180,130,90],stunDuration:1,color:'#8fa9d8',desc:'2秒ごとに強力な連鎖雷を放つ。1体目180、2体目130、3体目90と連鎖するほどダメージが低下し、命中した各敵を1秒スタンしてザップと同じターゲット・特殊状態リセットを行う。'},
  electrowizard:{id:'electrowizard',mass:1.7,name:'エレキテルウィザード',short:'エレキテル',role:'長射程・範囲スタン',cost:4,hp:650,damage:135,speed:38,range:185,cooldown:2.4,radius:15,count:1,air:false,targetsAir:true,projectile:'electro',splash:35,stunDuration:1,stunUnitsOnly:true,color:'#76bcd5',desc:'地上・空中へ届く長射程の電撃術師。2.4秒ごとに135ダメージの狭い範囲雷を放ち、範囲内の敵ユニット全員を1秒スタンする。射程185でリーフ弓兵より長く、密集した部隊への妨害に強い。'},
  necromancer:{id:'necromancer',mass:2.1,name:'ネクロマンサー',short:'ネクロ',role:'範囲対空・スケルトン召喚',cost:5,hp:839,damage:125,speed:39,range:158,cooldown:1.1,radius:17,count:1,air:false,targetsAir:true,projectile:'necro',splash:45,summonType:'skeleton',summonCount:3,summonInterval:7.5,summonOnDeploy:true,color:'#8b79a8',desc:'5コストの範囲召喚士。HP839・攻撃125・攻撃間隔1.1秒。地上・空中へ届く半径45の範囲魔法を放ち、召喚完了時にスケルトン3体、その後7.5秒ごとに3体を追加召喚する。'},
  darknecro:{id:'darknecro',mass:2.0,name:'ダークネクロマンサー',short:'闇ネクロ',role:'地上近接・バット召喚',cost:4,hp:907,damage:304,speed:41,range:34,cooldown:1.3,radius:16,count:1,air:false,targetsAir:false,summonType:'bat',summonCount:2,summonInterval:6.5,summonOnDeploy:true,color:'#65577c',desc:'4コストの地上近接召喚士。HP907・攻撃304。召喚完了時にコウモリ2体を呼び、その後も6.5秒ごとに2体を追加召喚する。本体は空中を攻撃できない。'},
  dosranboss:{id:'dosranboss',mass:2.35,name:'ドスランボス',short:'ドスラン',role:'近接前衛・群れ召喚',cost:6,hp:1100,damage:170,speed:36,range:32,cooldown:1.45,radius:19,count:1,air:false,targetsAir:false,summonType:'ranbos',summonCount:3,summonInterval:10,summonWindup:3,summonOnDeploy:true,color:'#4c79a8',desc:'大型ラプトルの首領。移動速度は遅め。1.5秒の本体召喚が完了した瞬間にランボス3体を呼び、その後も10秒ごとに3秒足を止めてランボス3体を追加召喚する。'},
  ranbos:{id:'ranbos',mass:0.88,name:'ランボス',short:'ランボス',role:'召喚子分',cost:0,hp:360,damage:58,speed:66,range:22,cooldown:1.15,radius:11,count:1,air:false,targetsAir:false,hidden:true,color:'#6f9cc9',desc:'ドスランボスに付き従う小型ラプター。性能は本体のおよそ3分の1で、素早く噛みついて前線をかく乱する。'},
  ashsquad:{id:'ashsquad',mass:2,name:'アッシュ部隊',short:'アッシュ隊',role:'近接部隊・3体編成',cost:5,hp:780,damage:112,speed:50,range:34,cooldown:1.05,radius:16,count:3,air:false,targetsAir:false,spawnType:'blade',color:'#d8b56f',desc:'アッシュ剣士3体を一度に展開する部隊カード。敵方向へ1体を前、2体を後ろにした三角陣形で出現し、後衛ユニットへ重ねる防衛や一斉近接攻撃に向く。'},
  princess:{id:'princess',mass:1.1,name:'プリンセス',short:'プリンセス',role:'超長射程・範囲対空',cost:3,hp:261,damage:275,speed:25,range:297,cooldown:3,radius:14,count:1,air:false,targetsAir:true,projectile:'royal_arrow',splash:70,visionMatchesRange:true,color:'#e5b7c9',desc:'小柄な二頭身シルエットの超長射程プリンセス。射程9マス・視界9マスで、見えている相手だけを長距離から狙う。地上・空中へ3秒ごとに275ダメージを与え、着弾地点の半径70にも攻撃が広がる。HP261と非常に脆く、矢の雨なら一撃で倒される。'},
  sparky:{id:'sparky',mass:8.8,name:'スパーキー',short:'スパーキー',role:'常時充電・超火力範囲',cost:6,hp:1500,damage:1200,speed:23,summonDelay:1.8,range:145,cooldown:0,radius:23,count:1,air:false,targetsAir:false,projectile:'sparkblast',splash:90,sparkUnit:true,sparkChargeTime:3.5,color:'#d8b45c',desc:'地上のみを狙う6コストの超火力兵器。1.8秒の召喚完了後から敵がいなくても3.5秒充電し、満充電なら敵が射程へ入った瞬間に1200の広範囲攻撃を放つ。発射後は再充電。ザップを受けると充電が0へ戻り、スタン解除後に最初から充電し直す。'},

  blowdart:{id:'blowdart',mass:.9,name:'吹き矢ゴブリン',short:'吹き矢',role:'長射程・高速対空',cost:3,hp:240,damage:110,speed:46,range:195,cooldown:.5,radius:12,count:1,air:false,targetsAir:true,projectile:'dart',color:'#8fbd63',desc:'HP240と非常に脆い代わりに、0.5秒ごとに110ダメージを放つ長射程射手。v16で射程を220から195へ短縮し、タワーの反撃が届かない位置から一方的に攻撃できないよう調整。地上・空中の両方に対応する。'},
  lasertower:{id:'lasertower',mass:1000000,name:'レーザー塔',short:'レーザー塔',role:'防衛建物・単体増幅レーザー',cost:5,hp:2000,damage:42,speed:0,range:220,cooldown:.1,radius:26,count:1,air:false,targetsAir:true,building:true,decayPerSecond:60,laserTower:true,laserBaseDps:42,laserDamageTick:.2,laserRampEvery:1,laserMultiplier:2,color:'#9c8ed0',desc:'同じ敵へレーザーを常時照射し、0.2秒ごとにダメージを与える5コスト防衛建物。初期42 DPSから始まり、同じ対象へ1秒照射するごとに火力が2倍化する。レーザー線は常時表示され、現在狙っている相手が分かる。HPは毎秒60ずつ自然減少し、対象変更・射程外・攻撃対象外になると火力は42 DPSへ戻る。'},
  elixirpump:{id:'elixirpump',mass:1000000,name:'エリクサーポンプ',short:'ポンプ',role:'設置物・エリクサー生成',cost:6,hp:1070,damage:0,speed:0,range:0,cooldown:99,radius:27,count:1,air:false,targetsAir:false,building:true,decayPerSecond:11.5,energyPump:true,energyInterval:13,energyAmount:1,ownerEnergyOnDeath:1,color:'#d979bd',desc:'6コストの資源生成設置物。HP1070で毎秒11.5ずつ自然減少する。建設完了後から13秒かけてタンクへピンク色のエリクサーが溜まり、満タンになるたび自分へ1エリクサーを生成して空に戻る。破壊・自然崩壊のどちらでも最後に1エリクサーを得る。'},
  laserdragon:{id:'laserdragon',mass:4.2,name:'レーザードラゴン',short:'レーザー竜',role:'飛行・単体増幅レーザー',cost:5,hp:1300,damage:20,speed:41,range:145,cooldown:.1,radius:21,count:1,air:true,targetsAir:true,laserUnit:true,laserBaseDps:20,laserRampEvery:1.5,laserMultiplier:2,color:'#71a4d6',desc:'地上・空中の両方を狙える5コスト飛行ドラゴン。移動速度は標準、射程145の中距離。レーザー塔と同じく同じ敵へ照射し続けるほど1.5秒ごとに火力が倍化し、対象変更・射程外・スタンで増幅が初期値へ戻る。'},
  shieldknight:{id:'shieldknight',mass:6.5,name:'シールドナイト',short:'盾騎士',role:'正面防御・前衛タンク',cost:4,hp:1400,damage:110,speed:38,range:34,cooldown:1.2,radius:22,count:1,air:false,targetsAir:false,shieldMax:650,shieldAbsorb:.65,shieldArcDeg:120,color:'#8ea7b5',desc:'大盾で正面約120度からの通常攻撃を受け止める4コスト前衛。盾耐久650が残る間は正面ダメージの65%を盾が吸収し、35%だけ本体へ通す。横・背後からの攻撃やスペル・継続ダメージは盾を無視する。'},
  prince:{id:'prince',mass:5.8,name:'プリンス',short:'プリンス',role:'近接（長距離）・距離突進',cost:5,hp:1920,damage:392,speed:40,range:66,cooldown:1.4,radius:20,count:1,air:false,targetsAir:false,meleeTier:'long',mountedCharge:true,chargeDistance:82.5,chargeDamage:784,chargeSpeedMultiplier:1.25,color:'#d8b65d',desc:'金色の鎧と長いランスを持つ騎馬戦士。2.5マスを連続で歩くとランスを前に構えて突進。突進中は少し加速し、次の地上対象へ784ダメージ。通常攻撃・移動中断・スタン・突進命中で走行距離は0へ戻る。'},
  darkprince:{id:'darkprince',mass:6.0,name:'ダークプリンス',short:'ダークプリンス',role:'近接（中距離）・範囲突進・シールド',cost:4,hp:1200,damage:266,speed:40,range:50,cooldown:1.4,radius:20,count:1,air:false,targetsAir:false,meleeTier:'medium',meleeSplash:40,mountedCharge:true,chargeDistance:66,chargeDamage:532,chargeSpeedMultiplier:1.25,shieldMax:240,shieldAll:true,shieldNoOverflow:true,color:'#3e4348',desc:'黒い鎧・黒い金棒・盾を持つ騎馬戦士。2マス連続で歩くと金棒を掲げて突進し、次の攻撃は半径1マスへ532ダメージ。通常攻撃も半径1マスの範囲攻撃。シールド240は本体HPと別で、一撃が残りシールドを超えてもその一撃の余剰ダメージは本体に貫通しない。'},
  windmage:{id:'windmage',mass:1.55,name:'ウィンドメイジ',short:'風術師',role:'遠距離・ノックバック',cost:4,hp:570,damage:95,speed:39,range:175,cooldown:1.6,radius:15,count:1,air:false,targetsAir:true,projectile:'wind',knockback:true,color:'#8bc7b0',desc:'地上・空中へ風弾を放つ位置操作術師。命中した敵を攻撃方向へ押し戻し、軽量ほど大きく飛ばす。小型約34px・中型約20px・大型約8px、超重量と建物は動かせない。'},
  phoenix:{id:'phoenix',mass:2.1,name:'フェニックス',short:'フェニックス',role:'飛行・一度だけ復活',cost:5,hp:900,damage:130,speed:54,range:110,cooldown:1.2,radius:18,count:1,air:true,targetsAir:true,projectile:'phoenix_fire',phoenixRevive:true,eggType:'phoenix_egg',color:'#e57d4b',desc:'地上・空中へ炎を放つ飛行ユニット。最初に倒されると地上へHP600の卵を残し、4秒間壊されなければHP450で一度だけ復活する。川上で倒れた場合は最寄りの安全な地面へ卵が落ちる。'},
  phoenix_egg:{id:'phoenix_egg',hidden:true,mass:1000,name:'フェニックスの卵',short:'卵',role:'復活待機',cost:0,hp:600,damage:0,speed:0,range:0,cooldown:99,radius:16,count:1,air:false,targetsAir:false,eggUnit:true,eggHatchTime:4,hatchType:'phoenix',color:'#e6a65b',desc:'フェニックスが最初に倒された場所へ残る卵。4秒守り切るとフェニックスがHP50%で一度だけ復活する。'},
  mirage:{id:'mirage',mass:1.8,name:'ロイヤルゴースト',short:'ゴースト',role:'ステルス・小範囲近接',cost:3,hp:1210,damage:261,speed:68,range:30,cooldown:1.8,radius:15,count:1,air:false,targetsAir:false,meleeSplash:40,stealthDuration:3,stealthFirstMultiplier:1.4,color:'#d7e5df',desc:'白く透けた身体、もじゃもじゃの白髭、王冠、短剣が特徴のやる気なさげな老王の幽霊。召喚完了後に最大3秒ステルスして半透明になり、直接狙われず接近。攻撃・3秒経過・被弾で実体化し、短剣の一撃は半径40の小範囲へ261ダメージ。ステルス初撃は1.4倍。'},
  falche:{id:'falche',mass:3.4,name:'執行人ファルチェ',short:'ファルチェ',role:'遠距離・往復貫通斧',cost:5,hp:1280,damage:179,speed:40,range:149,cooldown:2.4,radius:18,count:1,air:false,targetsAir:true,executionerAxe:true,axeTravelRange:231,axeHitWidth:66,axeSpeed:260,color:'#6f7376',desc:'黒いマスクを被った上半身裸の執行人。射程4.5マスへ地上・空中の敵を狙い、巨大な斧を一直線に最大7マス投げる。斧は軌道上の敵全員へ179ダメージを与え、最大距離から同じ軌道を戻る際にも179ダメージ。斧が手元へ戻るまでファルチェ本人はその場から動けない。'},
  skybomber:{id:'skybomber',mass:2.4,name:'スカイボマー',short:'空爆兵',role:'飛行・長射程全対象爆撃',cost:4,hp:650,damage:175,speed:51,range:170,cooldown:1.6,radius:17,count:1,air:true,targetsAir:true,projectile:'sky_bomb',color:'#7ba0ad',desc:'地上ユニット・空中ユニット・建物を狙える4コスト飛行爆撃兵。HP650、攻撃175、速度51、射程170、攻撃間隔1.6秒。長い射程から上空より爆弾を投下する。'},
  scrapdrill:{id:'scrapdrill',mass:3.4,name:'スクラップドリル',short:'ドリル',role:'建物特攻・張り付き増幅',cost:4,hp:900,damage:90,speed:46,range:24,cooldown:.1,radius:18,count:1,air:false,targetsAir:false,buildingOnly:true,drillUnit:true,drillBaseDps:90,drillRampEvery:1.5,drillDpsStages:[90,135,180,240],color:'#9b815d',desc:'建物へ張り付いてドリルを回し続ける4コスト特攻兵。接触直後90 DPSから始まり、1.5秒ごとに135→180→240 DPSへ上昇。建物から離される・対象変更・スタンで90 DPSへ戻る。'},
  bombcarrier:{id:'bombcarrier',mass:1.3,name:'ボムキャリア',short:'爆弾運び',role:'建物特攻・高速自爆',cost:3,hp:430,damage:480,speed:79,range:18,cooldown:99,radius:13,count:1,air:false,targetsAir:false,buildingOnly:true,suicideUnit:true,suicideDamage:480,carrierDeathDamage:80,carrierDeathRadius:55,color:'#b98956',desc:'建物だけを狙って全速力で走る3コスト使い捨て特攻兵。建物へ到達すると自爆して480ダメージを与えて消滅。途中で倒されても周囲の敵ユニットへ80ダメージの小爆発を残す。'},
  skeletonbarrel:{id:'skeletonbarrel',mass:1.15,name:'スケルトンバレル',short:'スケバレ',role:'飛行・建物特攻・撃破展開',cost:3,hp:532,damage:145,speed:56,range:20,cooldown:99,radius:15,count:1,air:true,targetsAir:false,buildingOnly:true,suicideUnit:true,suicideDamage:145,carrierDeathDamage:145,carrierDeathRadius:60,deathSummonType:'skeleton',deathSummonCount:7,color:'#8fb6da',desc:'髑髏模様の樽を3つの風船で吊るした3コスト飛行攻城ユニット。HP532、少し速い移動で建物だけを狙い、到達時は樽を落として145ダメージを与えつつスケルトン7体を展開。途中で倒されてもその場で風船が割れ、周囲へ145ダメージを与えてからスケルトン7体が飛び出す。'},
  airballoon:{id:'airballoon',mass:4.8,name:'\u30a8\u30a2\u30d0\u30eb\u30fc\u30f3',short:'\u30d0\u30eb\u30fc\u30f3',role:'\u98db\u884c\u30fb\u5efa\u7269\u7279\u653b\u30fb\u6b7b\u4ea1\u6642\u9045\u5ef6\u7206\u5f3e',cost:5,hp:1676,damage:640,speed:40,range:33,cooldown:2,radius:23,count:1,air:true,targetsAir:false,buildingOnly:true,projectile:'airballoon_bomb',deathBombDamage:240,deathBombRadius:33,deathBombDelay:2,deathBombKind:'airballoonbomb',color:'#4f9dff',desc:'\u9752\u3044\u6c17\u7403\uff08\u6575\u5074\u306f\u8d64\uff09\u306b\u30b9\u30b1\u30eb\u30c8\u30f3\u304c\u4e57\u308b5\u30b3\u30b9\u30c8\u98db\u884c\u30e6\u30cb\u30c3\u30c8\u3002HP1676\u30fb\u653b\u6483640\u30fb\u653b\u6483\u9593\u96942\u79d2\u3067\u5efa\u7269\u3060\u3051\u3092\u72d9\u3044\u3001\u63a5\u8fd1\u3057\u3066\u7206\u5f3e\u3092\u771f\u4e0b\u3078\u843d\u3068\u3059\u3002\u5012\u3055\u308c\u308b\u3068\u6b7b\u4ea1\u5730\u70b9\u306b\u7206\u5f3e\u3092\u6b8b\u3057\u30012\u79d2\u5f8c\u306b\u534a\u5f841\u30de\u30b9\u306e\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\u3068\u5efa\u7269\u3078240\u30c0\u30e1\u30fc\u30b8\u3002'},
  lumberjack:{id:'lumberjack',mass:2.4,name:'\u30e9\u30f3\u30d0\u30fc\u30b8\u30e3\u30c3\u30af',short:'\u30e9\u30f3\u30d0\u30fc',role:'\u9ad8\u901f\u8fd1\u63a5\u30fb\u6b7b\u4ea1\u6642\u30ec\u30a4\u30b8',cost:4,hp:1282,damage:255,speed:79,range:33,cooldown:.8,radius:16,count:1,air:false,targetsAir:false,deathRage:true,color:'#d6a557',desc:'\u91d1\u9aea\u3068\u3072\u3052\u3082\u3058\u3083\u306e\u5c0f\u67c4\u306a4\u30b3\u30b9\u30c8\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\u3002HP1282\u30fb\u653b\u6483255\u30fb\u653b\u6483\u9593\u96940.8\u79d2\u30fb\u79fb\u52d5\u306f\u3068\u3066\u3082\u901f\u3044\u3002\u5c0f\u578b\u306e\u65a7\u3067\u5730\u4e0a\u306e\u6575\u3092\u653b\u6483\u3057\u3001\u5012\u3055\u308c\u308b\u3068\u62b1\u3048\u3066\u3044\u305f\u30ec\u30a4\u30b8\u74f6\u3092\u6b7b\u4ea1\u5730\u70b9\u3078\u843d\u3068\u3059\u30021.5\u79d2\u5f8c\u306b\u65e2\u5b58\u306e\u30ec\u30a4\u30b8\u3068\u540c\u3058\u52b9\u679c\u3092\u767a\u52d5\u3059\u308b\u3002'},
  giantskeleton:{id:'giantskeleton',mass:9.4,name:'\u5de8\u5927\u30b9\u30b1\u30eb\u30c8\u30f3',short:'\u5de8\u5927\u30b9\u30b1',role:'\u5730\u4e0a\u524d\u885b\u30fb\u6b7b\u4ea1\u6642\u6642\u9650\u7206\u5f3e',cost:6,hp:3361,damage:276,speed:40,range:36,cooldown:1.3,radius:25,count:1,air:false,targetsAir:false,deathBombDamage:688,deathBombRadius:58,deathBombDelay:3,color:'#c9c1ad',desc:'6\u30b3\u30b9\u30c8\u306e\u5927\u578b\u5730\u4e0a\u30b9\u30b1\u30eb\u30c8\u30f3\u3002HP3361\u30fb\u653b\u6483276\u30fb\u653b\u6483\u9593\u96941.3\u79d2\u3067\u3001\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\u3068\u5efa\u7269\u3092\u653b\u6483\u3002\u6b69\u884c\u4e2d\u306f\u4e21\u8155\u3092\u7e26\u306b\u632f\u308b\u3002\u5012\u3055\u308c\u308b\u3068\u6b7b\u4ea1\u5730\u70b9\u306b\u7206\u5f3e\u3092\u6b8b\u3057\u30013\u79d2\u5f8c\u306b\u534a\u5f8458\u3078688\u30c0\u30e1\u30fc\u30b8\u3002'},
  skeletonrush:{id:'skeletonrush',cardType:'spell',spell:'skeletonrush',name:'スケルトンラッシュ',short:'スケラッシュ',role:'呪文・継続スケルトン召喚',cost:5,damage:0,buildingDamage:0,radius:110,count:0,targetsAir:false,activationDelay:1.2,zoneDuration:9,firstSpawnDelay:3,spawnEvery:.5,spawnType:'skeleton',offscreenFraction:.4,color:'#8f67bc',desc:'指定範囲を1.2秒後に紫色の召喚エリアへ変化。発動後3秒でスケルトン1体を出し、その後0.5秒ごとに召喚。効果は9秒。建物に範囲を重ねられるが建物内部には出現しない。範囲は最大40%まで画面外へはみ出せ、画面内の有効地点だけに出現する。'},
  fireball:{id:'fireball',cardType:'spell',spell:'fireball',name:'ファイヤーボール',short:'火球',role:'呪文・予告範囲爆撃・ノックバック',cost:4,damage:689,buildingDamage:159,radius:100,count:0,targetsAir:true,launchDelay:1.26,knockbackCells:1,color:'#ed7a47',desc:'指定地点を1.26秒予告した後、自軍中央本拠地から火球を発射する。半径2.5マスへユニット689・建物159ダメージ。小型・中型ユニットは爆心地から外側へ約1マス吹き飛ばす。発射後の飛行時間は従来どおり本拠地からの距離で変化する。'},
  poison:{id:'poison',cardType:'spell',spell:'poison',name:'ポイズン',short:'ポイズン',role:'呪文・8秒継続毒エリア',cost:3,damage:91,buildingDamage:21,radius:90,count:0,targetsAir:true,zoneDuration:8,tickEvery:1,lingerDuration:0,lingerDamage:0,color:'#c94f5c',desc:'指定地点へ遅延なしで毒エリアを8秒展開。範囲内の敵ユニットへ毎秒91ダメージ、建物へ毎秒21ダメージ。範囲を離れた後の残留毒は発生しない。'},
  arrowrain:{id:'arrowrain',cardType:'spell',spell:'arrowrain',name:'矢の雨',short:'矢の雨',role:'呪文・予告遠距離一斉射撃',cost:3,damage:366,buildingDamage:75,radius:140,count:0,targetsAir:true,launchDelay:1.1,color:'#c89b68',desc:'指定地点を1.1秒予告した後、自軍中央本拠地から多数の矢を一斉発射する。半径3.5マスへユニット366・建物75ダメージ。矢は本拠地から指定地点まで実際に飛び、橋付近なら約1.45秒、敵中央本拠地付近なら約2.4秒で着弾する。'},
  lightning:{id:'lightning',cardType:'spell',spell:'lightning',name:'ライトニング',short:'ライトニング',role:'呪文・高HP4体雷撃',cost:6,damage:1056,buildingDamage:265,radius:105,maxTargets:4,count:0,targetsAir:true,color:'#69aee8',desc:'半径105の範囲内にいる敵から現在HPが高い順に最大4体を選び、ユニットへ1056ダメージ、建物へ265ダメージの落雷を同時に与える6コスト呪文。'},
  zap:{id:'zap',cardType:'spell',spell:'zap',name:'ザップ',short:'ザップ',role:'呪文・瞬間スタン＋思考リセット',cost:2,damage:225,buildingDamage:225,radius:78,count:0,targetsAir:true,stunDuration:1.5,color:'#75bde8',desc:'指定地点へ瞬時に電撃を落とし、半径78の敵ユニット・建物へ225ダメージと1.5秒スタン。現在の攻撃対象を解除し、レーザー塔の火力上昇やスパーキーの充電も0へリセットする。スタン解除後に対象を選び直す。'},
  rage:{id:'rage',cardType:'spell',spell:'rage',name:'レイジ',short:'レイジ',role:'呪文・速度強化フィールド',cost:2,damage:179,buildingDamage:45,radius:99,count:0,targetsAir:true,placementTime:.5,activationDelay:1.5,zoneDuration:4.5,boostMultiplier:1.3,color:'#d94fba',desc:'台形の瓶に入ったピンク色の液体を指定地点へ展開する2コスト呪文。指定から1.5秒後に半径3マスへ敵ユニット179・建物45ダメージを与え、その後4.5秒間、範囲内の味方の移動・攻撃・生成など時間系の進行を30%高速化する。HP・一発の攻撃力・射程・建物の自然HP減少量は変化しない。'},
  cyclone:{id:'cyclone',cardType:'spell',spell:'cyclone',name:'サイクロン',short:'サイクロン',role:'呪文・超広範囲瞬間吸引',cost:3,damage:84,buildingDamage:58,radius:182,count:0,targetsAir:true,zoneDuration:1,pullSpeed:210,color:'#8bc8cf',desc:'指定地点に半径5.5マスの巨大な渦を1秒間生成。従来3秒分の総吸引量を1秒へ圧縮するため、1秒あたりの吸引速度は3倍。範囲内の敵ユニットへ84、タワー・建物へ58ダメージを発動時に1回だけ与える。建物・タワーは吸い込まれず、敵ユニットだけが中心へ引き寄せられる。'}

};

const RANGE_CELL_OVERRIDES = Object.freeze({
  blade:1,knight:1,archer:5,mage:5,spear:1.5,bat:1,bomber:4.5,cannon:6.5,golem:1,icegolem:1,
  berserker:1,miniberserker:1,megaknight:1,ironeye:5,tracker:1,valkyrie:1,gargoyle:1.5,gargoyleswarm:1.5,
  mini_golem:1,boar:1,tigger:1,muddragon:4,nightshade:1,mossling:1,goblin_melee:1,goblin_spear:4,goblins:1,speargoblins:4,
  megagargoyle:2,apprenticeguards:1.5,apprenticeguard:1.5,icespirit:1,firespirit:1,skeleton:1,boneswarm:1,
  tombstone:0,oven:0,barbarian:1,barbarians:1,siegebarbarian:1,elixirgolem:1,elixir_golem_mid:1,elixir_blob:1,
  royalgiant:5,lumina:4,frost:5,harpy:5,electrowizard:5,necromancer:5,darknecro:1,dosranboss:1,ranbos:1,
  ashsquad:1,princess:9,sparky:4.5,blowdart:6,lasertower:6.5,laserdragon:4.5,shieldknight:1,prince:2,darkprince:1.5,
  windmage:5.5,falche:4.5,phoenix:3.5,phoenix_egg:0,mirage:1,skybomber:5,scrapdrill:1,bombcarrier:1,skeletonbarrel:1,airballoon:1,lumberjack:1,giantskeleton:1
});
const SPELL_RADIUS_CELLS = Object.freeze({skeletonrush:3.5,fireball:2.5,poison:2.5,arrowrain:3.5,lightning:3,zap:2.5,rage:3,cyclone:5.5});
const DISTANCE_KEY_TO_CELL_KEY = Object.freeze({
  splash:'splashCells',deathRadius:'deathRadiusCells',dropRadius:'dropRadiusCells',jumpMinRange:'jumpMinRangeCells',jumpMaxRange:'jumpMaxRangeCells',
  jumpRadius:'jumpRadiusCells',hookRange:'hookRangeCells',hookMinRange:'hookMinRangeCells',spinTriggerRange:'spinTriggerRangeCells',spinDistance:'spinDistanceCells',
  spinHitRadius:'spinHitRadiusCells',chargeDistance:'chargeDistanceCells',carrierDeathRadius:'carrierDeathRadiusCells',chainRange:'chainRangeCells',
  dashAggroRange:'dashAggroRangeCells',dashMinRange:'dashMinRangeCells',dashMaxRange:'dashMaxRangeCells',deathBombRadius:'deathBombRadiusCells',
  fireBlastRadius:'fireBlastRadiusCells',fireLeapRange:'fireLeapRangeCells',iceBlastRadius:'iceBlastRadiusCells',iceLeapRange:'iceLeapRangeCells',
  healOnHitRange:'healOnHitRangeCells',mudRadius:'mudRadiusCells',riverJumpSpawnBand:'riverJumpSpawnBandCells',riverJumpTrigger:'riverJumpTriggerCells',axeTravelRange:'axeTravelRangeCells',axeHitWidth:'axeHitWidthCells'
});
const DISTANCE_CELL_OVERRIDES = Object.freeze({
  'megaknight.jumpMinRange':2.5,'megaknight.jumpMaxRange':5,'megaknight.jumpRadius':1.5,'megaknight.dropRadius':1.5,
  'tracker.hookRange':6,'tracker.hookMinRange':2,
  'nightshade.aggroRange':3,'nightshade.dashAggroRange':3,'nightshade.dashMinRange':2.5,'nightshade.dashMaxRange':6,
  'giantskeleton.deathBombRadius':1.5,'airballoon.deathBombRadius':1,
  'icespirit.iceLeapRange':2,'icespirit.iceBlastRadius':1.5,
  'firespirit.fireLeapRange':2,'firespirit.fireBlastRadius':1.5,
  'apprenticeguards.wideFormationSpacing':2.5,
  'boar.riverJumpSpawnBand':2.5,'boar.riverJumpTrigger':1,
  'prince.chargeDistance':2.5,'darkprince.chargeDistance':2,'falche.axeTravelRange':7,'falche.axeHitWidth':2
});
function quantizeCells(px,{min=.5}={}){
  if(!Number.isFinite(px)||px<=0)return 0;
  return Math.max(min,Math.round((px/GRID_BASELINE_PX)*2)/2);
}
function gridizeCard(id,d){
  const out={...d};
  const rangeCells=RANGE_CELL_OVERRIDES[id]??quantizeCells(d.range||0,{min:1});
  out.rangeCells=rangeCells;out.range=cellsToWorld(rangeCells);
  if(d.spell){const rc=SPELL_RADIUS_CELLS[id]??quantizeCells(d.radius||0);out.radiusCells=rc;out.radius=cellsToWorld(rc);}
  if(d.building){
    const geo=BUILDING_GEOMETRY[id]||{};
    out.footprintCols=d.footprintCols||ARENA.defaultBuildingCells;out.footprintRows=d.footprintRows||ARENA.defaultBuildingCells;out.footprintCells=`${out.footprintCols}x${out.footprintRows}`;
    out.hitboxCols=d.hitboxCols||geo.hitboxCols||Math.max(1,Math.min(out.footprintCols,((d.radius||20)*2)/GRID_CELL));
    out.hitboxRows=d.hitboxRows||geo.hitboxRows||Math.max(1,Math.min(out.footprintRows,((d.radius||20)*2)/GRID_CELL));
    out.visualScale=d.visualScale||geo.visualScale||1;
  }
  for(const [key,cellKey] of Object.entries(DISTANCE_KEY_TO_CELL_KEY)){
    if(!Number.isFinite(d[key]))continue;
    const cells=DISTANCE_CELL_OVERRIDES[`${id}.${key}`]??quantizeCells(d[key]);
    out[cellKey]=cells;out[key]=cellsToWorld(cells);
  }
  if(Number.isFinite(d.aggroRange)){
    const cells=DISTANCE_CELL_OVERRIDES[`${id}.aggroRange`]??quantizeCells(d.aggroRange);
    out.aggroRangeCells=cells;out.aggroRange=cellsToWorld(cells);
  }
  if(Number.isFinite(d.wideFormationSpacing)){
    const cells=DISTANCE_CELL_OVERRIDES[`${id}.wideFormationSpacing`]??quantizeCells(d.wideFormationSpacing);
    out.wideFormationSpacingCells=cells;out.wideFormationSpacing=cellsToWorld(cells);
  }
  out.meleeTier=d.meleeTier||meleeRangeTierFor(out);out.meleeRangeLabel=out.meleeTier?(MELEE_RANGE_LABELS[out.meleeTier]||null):null;
  out.visionSize=visionSizeFor(out);out.visionCells=out.visionMatchesRange?out.rangeCells:(Number.isFinite(out.aggroRangeCells)?out.aggroRangeCells:VISION_CELLS_BY_SIZE[out.visionSize]);
  if((out.count||0)>1){
    out.summonFormationRadiusCells=out.wideFormation?((out.count-1)*(out.wideFormationSpacingCells||2.5)/2):Math.min(2.5,.5+Math.ceil(out.count/3)*.5);
  }else out.summonFormationRadiusCells=0;
  return Object.freeze(out);
}
export const UNITS = Object.freeze(Object.fromEntries(Object.entries(RAW_UNITS).map(([id,d])=>[id,gridizeCard(id,d)])));
export function cardDamageInfo(data){
  if(!data)return {unit:'-',tower:'-'};
  if(data.spell==='skeletonrush')return {unit:'スケルトン召喚',tower:'召喚'};
  if(data.spell==='cyclone')return {unit:String(data.damage||0),tower:String(data.buildingDamage||0)};
  if(data.spell==='poison')return {unit:`${data.damage} / ${data.tickEvery}秒`,tower:`${data.buildingDamage} / ${data.tickEvery}秒`};
  if(data.laserTower||data.laserUnit)return {unit:`${data.laserBaseDps||data.damage} DPS〜`,tower:`${data.laserBaseDps||data.damage} DPS〜`};
  if(data.energyPump)return {unit:'攻撃不可',tower:'攻撃不可'};
  if(data.drillUnit)return {unit:'攻撃不可',tower:`${(data.drillDpsStages||[data.damage]).join('→')} DPS`};
  if(data.crusherRamp)return {unit:'攻撃不可',tower:(data.crusherDamages||[data.damage]).join('→')};
  if(data.buildingOnly){
    let unit='攻撃不可';
    if(Number.isFinite(data.carrierDeathDamage))unit=`撃破時爆発 ${data.carrierDeathDamage}`;
    else if(Number.isFinite(data.deathBombDamage))unit=`撃破時爆発 ${data.deathBombDamage}`;
    else if(Number.isFinite(data.deathDamage))unit=`死亡爆発 ${data.deathDamage}`;
    const tower=Number.isFinite(data.suicideDamage)?data.suicideDamage:(Number.isFinite(data.structureDamage)?data.structureDamage:data.damage);
    return {unit,tower:String(tower??0)};
  }
  const unit=Number.isFinite(data.damage)?data.damage:0;
  const tower=Number.isFinite(data.buildingDamage)?data.buildingDamage:(Number.isFinite(data.structureDamage)?data.structureDamage:unit);
  return {unit:String(unit),tower:String(tower)};
}
export const DECK = Object.freeze(Object.keys(UNITS).filter(id=>!UNITS[id].hidden));
export const UNIT_IDS = Object.freeze(DECK.filter(id=>!UNITS[id].spell));
export const SPELL_IDS = Object.freeze(DECK.filter(id=>!!UNITS[id].spell));
export const DEFAULT_DECK = Object.freeze(['knight','blowdart','archer','muddragon','dosranboss','arrowrain','lasertower','fireball']);
export const ROLE_ORDER = DECK;
export const TEAM_COLORS = ['#58b9ae','#ee9b81'];
export function normalizeDeck(value,{fallback=true}={}){
  const out=[];
  if(Array.isArray(value))for(const id of value){if(typeof id==='string'&&DECK.includes(id)&&!out.includes(id))out.push(id);if(out.length===MAX_DECK)break;}
  if(out.length===MAX_DECK)return out;
  return fallback?[...DEFAULT_DECK]:null;
}
