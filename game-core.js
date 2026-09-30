/** Balance data: original prototype values. Both browser and server import this file. */
const VERSION = '46.0.0';
const MAX_DECK = 8;
const MAP_THEMES = Object.freeze(['grass','stone','lava','snow','desert']);
const GRID_COLS = 18;
const GRID_ROWS = 32;
const GRID_CELL = 40;
const GRID_BASELINE_PX = 33; // v36 archer 165px == v37 five cells.
const cellsToWorld = cells => cells * GRID_CELL;
const worldToCells = world => world / GRID_CELL;
const gridColumnCenter = col => (col - .5) * GRID_CELL;
const gridRowCenter = row => GRID_ROWS * GRID_CELL - (row - .5) * GRID_CELL;
function gridRectCenter(col1,col2,row1,row2){
  return {x:((col1+col2)/2-.5)*GRID_CELL,y:GRID_ROWS*GRID_CELL-((row1+row2)/2-.5)*GRID_CELL};
}
const ARENA = Object.freeze({
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
const TOWER_GRID = Object.freeze({
  blue:Object.freeze({left:Object.freeze([3,5,6,8]),right:Object.freeze([14,16,6,8]),core:Object.freeze([8,11,2,5])}),
  red:Object.freeze({left:Object.freeze([3,5,25,27]),right:Object.freeze([14,16,25,27]),core:Object.freeze([8,11,28,31])})
});
const SUMMON_DELAY_BY_COST = Object.freeze({1:.4,2:.5,3:.7,4:.9,5:1.2,6:1.5,7:1.8,8:2.1});
const VISION_CELLS_BY_SIZE = Object.freeze({small:4,medium:5,large:6});
const MELEE_RANGE_CELLS = Object.freeze({close:1,medium:1.5,long:2});
const MELEE_RANGE_LABELS = Object.freeze({close:'\u8fd1\u8ddd\u96e2',medium:'\u4e2d\u8ddd\u96e2',long:'\u9577\u8ddd\u96e2'});
function meleeRangeTierFor(data){
  if(!data||data.spell||data.building||data.projectile||data.laserUnit||data.sparkUnit)return null;
  const cells=Number.isFinite(data.rangeCells)?data.rangeCells:worldToCells(data.range||0);
  if(cells<=MELEE_RANGE_CELLS.close+1e-6)return 'close';
  if(cells<=MELEE_RANGE_CELLS.medium+1e-6)return 'medium';
  if(cells<=MELEE_RANGE_CELLS.long+1e-6)return 'long';
  return null;
}
function meleeRangeLabelFor(data){const tier=data?.meleeTier||meleeRangeTierFor(data);return tier?MELEE_RANGE_LABELS[tier]||null:null;}
const BUILDING_GEOMETRY = Object.freeze({
  cannon:Object.freeze({visualScale:1.90,hitboxCols:2.20,hitboxRows:1.90}),
  tombstone:Object.freeze({visualScale:1.72,hitboxCols:1.85,hitboxRows:2.45}),
  oven:Object.freeze({visualScale:1.62,hitboxCols:2.35,hitboxRows:2.30}),
  lasertower:Object.freeze({visualScale:1.68,hitboxCols:2.05,hitboxRows:2.45}),
  elixirpump:Object.freeze({visualScale:1.72,hitboxCols:2.30,hitboxRows:2.45}),
  goblinhut:Object.freeze({visualScale:1.42,hitboxCols:2.35,hitboxRows:2.35}),
  tesla:Object.freeze({visualScale:1.20,hitboxCols:1.55,hitboxRows:1.70})
});
const VISION_BY_SIZE = Object.freeze(Object.fromEntries(Object.entries(VISION_CELLS_BY_SIZE).map(([k,v])=>[k,cellsToWorld(v)])));
function visionSizeFor(data){
  if(!data)return 'small';
  if(data.visionSize&&VISION_BY_SIZE[data.visionSize])return data.visionSize;
  const radius=Number.isFinite(data.radius)?data.radius:12;
  return radius>=24?'large':radius>=15?'medium':'small';
}
function visionRangeFor(data){
  if(!data)return VISION_BY_SIZE.small;
  if(data.visionMatchesRange)return Math.max(0,data.range||0);
  if(Number.isFinite(data.aggroRange))return Math.max(0,data.aggroRange);
  const base=VISION_BY_SIZE[visionSizeFor(data)]||VISION_BY_SIZE.medium;
  // Long-range weapons can acquire targets one grid cell beyond their firing range.
  const ranged=(!data.buildingOnly&&(data.projectile||data.laserUnit||data.sparkUnit||(data.rangeCells||0)>=3))?Math.max(0,(data.range||0)+GRID_CELL):0;
  return Math.max(base,ranged);
}
function visionCellsFor(data){return visionRangeFor(data)/GRID_CELL;}
function summonDelayFor(data){
  if(!data||data.spell||data.hidden||data.tunnelAnywhere)return 0;
  if(Number.isFinite(data.summonDelay))return Math.max(0,data.summonDelay);
  return SUMMON_DELAY_BY_COST[data.cost]??Math.max(.4,Math.min(2.5,.3+(data.cost||1)*.25));
}
const RAW_UNITS = {
  blade: {id:'blade',mass:2,name:'アッシュ剣士',short:'剣士',role:'近接アタッカー',cost:2,hp:780,damage:112,speed:50,range:34,cooldown:1.05,radius:16,count:1,air:false,targetsAir:false,color:'#efc577',desc:'攻守の基準になる剣士。盾役の後ろで前線を押し上げる。'},
  knight:{id:'knight',mass:6,name:'アイアン衛士',short:'衛士',role:'近接タンク',cost:3,hp:1850,damage:202,speed:32,range:36,cooldown:1.35,radius:23,count:1,air:false,targetsAir:false,color:'#a7b9c3',desc:'高い体力で攻撃を受け止めながら、202の近接攻撃で前線を押し返す3コスト前衛。後ろに弓兵や術師を重ねると安定する。'},
  archer:{id:'archer',mass:1.2,name:'リーフ弓兵',short:'弓兵',role:'遠距離・対空・2体編成',cost:3,hp:304,damage:112,speed:45,range:165,cooldown:1.15,radius:12,count:2,air:false,targetsAir:true,projectile:'arrow',color:'#a6ca8b',desc:'小柄なリーフ弓兵2体を横並びで展開する3コスト遠距離カード。1体HP304・攻撃112・射程165で地上と空中を狙う。2体同時の射撃性能に合わせてコストを3へ調整。'},
  mage:{id:'mage',mass:1.6,name:'ルーン術師',short:'術師',role:'範囲攻撃・対空',cost:3,hp:480,damage:105,speed:39,range:158,cooldown:1.5,radius:15,count:1,air:false,targetsAir:true,projectile:'orb',splash:54,color:'#b9a0ef',desc:'3コストへ軽量化された範囲術師。魔力弾が周囲にもダメージを与え、密集した敵やコウモリに有効。'},
  bat:{id:'bat',mass:0.6,name:'コウモリの群れ',short:'コウモリ',role:'飛行・5体編成',cost:2,hp:92,damage:82,speed:74,range:28,cooldown:1.2,radius:11,count:5,air:true,targetsAir:true,color:'#b7a7dc',desc:'5体のコウモリがまとまって出撃し、川を飛び越える。1体HP92・攻撃82・攻撃間隔1.2秒。単体は脆いが、対空できない敵を数で一気に削る。'},
  bomber:{id:'bomber',mass:2,name:'ボンバー',short:'ボンバー',role:'地上範囲攻撃・山なり投擲',cost:2,hp:470,damage:174,speed:38,range:145,cooldown:1.8,radius:16,count:1,air:false,targetsAir:false,projectile:'bomb',splash:66,color:'#edaa66',desc:'2コストの範囲爆撃兵。爆弾を山なりに投げ、地上の密集へ174ダメージを与える。爆弾は以前より少しゆっくり飛ぶため、着弾までわずかな間がある。空中の敵には攻撃できない。'},
  cannon:{id:'cannon',mass:1000000,name:'大砲',short:'大砲',role:'防衛建物・耐久減衰',cost:3,hp:1000,damage:200,speed:0,range:218,cooldown:1,radius:24,count:1,air:false,targetsAir:false,projectile:'shell',building:true,decayPerSecond:30,color:'#8dbfb3',desc:'動かない3コスト防衛建物。HP1000・攻撃200・攻撃間隔1.0秒。設置後は毎秒30ずつ耐久が自然減少し、攻撃を受けなくても約33秒で崩れる。'},
  goblinhut:{id:'goblinhut',mass:1000000,name:'ゴブリンの小屋',short:'ゴブ小屋',role:'設置物・接近反応槍ゴブリン生成',cost:4,hp:1180,damage:0,speed:0,range:198,cooldown:99,radius:27,count:1,air:false,targetsAir:true,building:true,decayPerSecond:40,passiveSpawner:true,summonType:'goblin_spear',summonCount:1,summonInterval:2.2,summonWhileEnemyInRange:true,summonTriggerUnitsOnly:true,summonOnTriggerEnter:true,deathSummonType:'goblin_spear',deathSummonCount:1,color:'#b79b62',desc:'配置判定は3×3のまま、戦場上の見た目だけ一回り小さくした藁葺き屋根のゴブリン小屋。4コスト・HP1180で、毎秒40ずつHPが自然減少する。半径6マス以内へ敵ユニットを初めて索敵した瞬間、クールタイムなしで槍ゴブリン1体を即召喚。その後は敵が範囲内にいる間2.2秒ごとに1体ずつ送り出す。敵がいなくなると生成を停止し、再び索敵した瞬間にも1体を即召喚する。小屋が壊れた際も槍ゴブリン1体を即召喚する。'},
  tesla:{id:'tesla',mass:1000000,name:'テスラ',short:'テスラ',role:'防衛建物・2×2地下待機電撃塔',cost:4,hp:1182,damage:230,speed:0,range:182,cooldown:1.1,radius:22,count:1,air:false,targetsAir:true,projectile:'electro',building:true,footprintCols:2,footprintRows:2,decayPerSecond:48,teslaHidden:true,color:'#8c765b',desc:'2×2へ小型化した木製電波塔型の4コスト防衛建物。HP1182・攻撃230・攻撃間隔1.1秒・射程5.5マスで地上と空中を攻撃し、スタンは発生しない。敵が射程内にいない間は地下へ収納され、地上には木の板だけが見える。地下中は攻撃対象にならずスペルも無効。敵が射程へ入ると地上へせり上がり、先端の丸い電極から電撃を放つ。毎秒48HPは地下中も減少する。'},
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
  babydragon:{id:'babydragon',mass:2.8,name:'ベビードラゴン',short:'ベビドラ',role:'飛行・高速範囲対空',cost:4,hp:1152,damage:168,speed:57,range:116,cooldown:1.5,radius:20,count:1,air:true,targetsAir:true,projectile:'phoenix_fire',splash:40,color:'#9bcf78',desc:'薄緑色の太っちょな体と小さな羽、少し間の抜けた顔が特徴の4コスト飛行ドラゴン。HP1152・攻撃168・攻撃間隔1.5秒・射程3.5マスで、移動は速い。地上と空中の両方へ火を吐き、着弾地点を中心に半径1.2マスへ168の範囲ダメージ。首輪の差し色は味方が青、敵が赤。'},
  shieldknight:{id:'shieldknight',mass:6.5,name:'シールドナイト',short:'盾騎士',role:'正面防御・前衛タンク',cost:4,hp:1400,damage:110,speed:38,range:34,cooldown:1.2,radius:22,count:1,air:false,targetsAir:false,shieldMax:650,shieldAbsorb:.65,shieldArcDeg:120,color:'#8ea7b5',desc:'大盾で正面約120度からの通常攻撃を受け止める4コスト前衛。盾耐久650が残る間は正面ダメージの65%を盾が吸収し、35%だけ本体へ通す。横・背後からの攻撃やスペル・継続ダメージは盾を無視する。'},
  prince:{id:'prince',mass:5.8,name:'プリンス',short:'プリンス',role:'近接（長距離）・距離突進',cost:5,hp:1920,damage:392,speed:40,range:66,cooldown:1.4,radius:20,count:1,air:false,targetsAir:false,meleeTier:'long',mountedCharge:true,chargeDistance:82.5,chargeDamage:784,chargeSpeedMultiplier:1.25,color:'#d8b65d',desc:'金色の鎧と長いランスを持つ騎馬戦士。2.5マスを連続で歩くとランスを前に構えて突進。突進中は少し加速し、次の地上対象へ784ダメージ。通常攻撃・移動中断・スタン・突進命中で走行距離は0へ戻る。'},
  darkprince:{id:'darkprince',mass:6.0,name:'ダークプリンス',short:'ダークプリンス',role:'近接（中距離）・範囲突進・シールド',cost:4,hp:1200,damage:266,speed:40,range:50,cooldown:1.4,radius:20,count:1,air:false,targetsAir:false,meleeTier:'medium',meleeSplash:40,mountedCharge:true,chargeDistance:66,chargeDamage:532,chargeSpeedMultiplier:1.25,shieldMax:240,shieldAll:true,shieldNoOverflow:true,color:'#3e4348',desc:'黒い鎧・黒い金棒・盾を持つ騎馬戦士。2マス連続で歩くと金棒を掲げて突進し、次の攻撃は半径1マスへ532ダメージ。通常攻撃も半径1マスの範囲攻撃。シールド240は本体HPと別で、一撃が残りシールドを超えてもその一撃の余剰ダメージは本体に貫通しない。'},
  windmage:{id:'windmage',mass:1.55,name:'ウィンドメイジ',short:'風術師',role:'遠距離・ノックバック',cost:4,hp:570,damage:95,speed:39,range:175,cooldown:1.6,radius:15,count:1,air:false,targetsAir:true,projectile:'wind',knockback:true,color:'#8bc7b0',desc:'地上・空中へ風弾を放つ位置操作術師。命中した敵を攻撃方向へ押し戻し、軽量ほど大きく飛ばす。小型約34px・中型約20px・大型約8px、超重量と建物は動かせない。'},
  wizard:{id:'wizard',mass:2.1,name:'ウィザード',short:'ウィザード',role:'遠距離・範囲対空',cost:5,hp:754,damage:304,speed:40,range:182,cooldown:1.4,radius:18,count:1,air:false,targetsAir:true,projectile:'wizard_fire',splash:50,color:'#416fc2',desc:'青いフード（敵側は赤）をかぶった長身の若い魔術師。5コスト・HP754・攻撃304・攻撃間隔1.4秒・射程5.5マス。地上と空中の両方を狙い、魔法弾の着弾地点を中心に半径1.5マスへ304の範囲ダメージを与える。アイアン衛士ほどの背丈で、長い外套と神秘的な装飾をまとったオリジナルの戦闘魔術師。'},
  musketeer:{id:'musketeer',mass:1.8,name:'マスケット銃士',short:'マスケット',role:'長射程・高速射撃対空',cost:4,hp:720,damage:218,speed:40,range:198,cooldown:1,radius:16,count:1,air:false,targetsAir:true,projectile:'musket_ball',color:'#7189a5',desc:'長いマスケット銃を構える勇敢な女性兵士。4コスト・HP720・攻撃218・攻撃間隔1.0秒・射程6マス・移動速度は普通。地上と空中の両方を狙う単体遠距離攻撃で、鉄の帽子をかぶり、落ち着いて狙いを定めて射撃する。'},
  hunter:{id:'hunter',mass:2.6,name:'ハンター',short:'ハンター',role:'中距離・扇状10発散弾・対空',cost:4,hp:884,damage:84,speed:40,range:132,cooldown:2.2,radius:18,count:1,air:false,targetsAir:true,projectile:'hunter_pellet',scatterShot:true,pelletCount:10,pelletRange:215,pelletSpreadDegrees:40,pelletSpeed:620,color:'#8b735f',desc:'散弾銃を持ち、耳当て付きの毛皮帽子をかぶった中年ハンター。4コスト・HP884・1発84ダメージの弾を10発、2.2秒ごとに扇状へ同時発射する。索敵・攻撃開始射程は4マスだが、各弾は最大6.5マス先まで飛ぶ。地上・空中を攻撃でき、至近距離では10発すべてが当たり最大840ダメージ。弾は敵を貫通せず、最初の対象へ当たった時点で消える。'},
  phoenix:{id:'phoenix',mass:2.1,name:'フェニックス',short:'フェニックス',role:'飛行・一度だけ復活',cost:5,hp:900,damage:130,speed:54,range:110,cooldown:1.2,radius:18,count:1,air:true,targetsAir:true,projectile:'phoenix_fire',phoenixRevive:true,eggType:'phoenix_egg',color:'#e57d4b',desc:'地上・空中へ炎を放つ飛行ユニット。最初に倒されると地上へHP600の卵を残し、4秒間壊されなければHP450で一度だけ復活する。川上で倒れた場合は最寄りの安全な地面へ卵が落ちる。'},
  phoenix_egg:{id:'phoenix_egg',hidden:true,mass:1000,name:'フェニックスの卵',short:'卵',role:'復活待機',cost:0,hp:600,damage:0,speed:0,range:0,cooldown:99,radius:16,count:1,air:false,targetsAir:false,eggUnit:true,eggHatchTime:4,hatchType:'phoenix',color:'#e6a65b',desc:'フェニックスが最初に倒された場所へ残る卵。4秒守り切るとフェニックスがHP50%で一度だけ復活する。'},
  mirage:{id:'mirage',mass:1.8,name:'ロイヤルゴースト',short:'ゴースト',role:'ステルス・小範囲近接',cost:3,hp:1210,damage:261,speed:68,range:30,cooldown:1.8,radius:15,count:1,air:false,targetsAir:false,meleeSplash:40,stealthDuration:3,stealthFirstMultiplier:1.4,color:'#d7e5df',desc:'白く透けた身体、もじゃもじゃの白髭、王冠、短剣が特徴のやる気なさげな老王の幽霊。召喚完了後に最大3秒ステルスして半透明になり、直接狙われず接近。攻撃・3秒経過・被弾で実体化し、短剣の一撃は半径40の小範囲へ261ダメージ。ステルス初撃は1.4倍。'},
  falche:{id:'falche',mass:3.4,name:'執行人ファルチェ',short:'ファルチェ',role:'遠距離・往復貫通斧',cost:5,hp:1280,damage:179,speed:40,range:149,cooldown:2.4,radius:18,count:1,air:false,targetsAir:true,executionerAxe:true,axeTravelRange:231,axeHitWidth:66,axeSpeed:260,color:'#6f7376',desc:'黒いマスクを被った上半身裸の執行人。射程4.5マスへ地上・空中の敵を狙い、巨大な斧を一直線に最大7マス投げる。斧は軌道上の敵全員へ179ダメージを与え、最大距離から同じ軌道を戻る際にも179ダメージ。斧が手元へ戻るまでファルチェ本人はその場から動けない。'},
  skybomber:{id:'skybomber',mass:2.4,name:'スカイボマー',short:'空爆兵',role:'飛行・長射程全対象爆撃',cost:4,hp:650,damage:175,speed:51,range:170,cooldown:1.6,radius:17,count:1,air:true,targetsAir:true,projectile:'sky_bomb',color:'#7ba0ad',desc:'地上ユニット・空中ユニット・建物を狙える4コスト飛行爆撃兵。HP650、攻撃175、速度51、射程170、攻撃間隔1.6秒。長い射程から上空より爆弾を投下する。'},
  scrapdrill:{id:'scrapdrill',mass:3.4,name:'スクラップドリル',short:'ドリル',role:'建物特攻・張り付き増幅',cost:4,hp:900,damage:90,speed:46,range:24,cooldown:.1,radius:18,count:1,air:false,targetsAir:false,buildingOnly:true,drillUnit:true,drillBaseDps:90,drillRampEvery:1.5,drillDpsStages:[90,135,180,240],color:'#9b815d',desc:'建物へ張り付いてドリルを回し続ける4コスト特攻兵。接触直後90 DPSから始まり、1.5秒ごとに135→180→240 DPSへ上昇。建物から離される・対象変更・スタンで90 DPSへ戻る。'},
  bombcarrier:{id:'bombcarrier',mass:.55,name:'ウォールブレイカー',short:'ウォール',role:'建物特攻・2体高速自爆',cost:2,hp:331,damage:281,speed:74,range:20,cooldown:99,radius:10,count:2,air:false,targetsAir:false,buildingOnly:true,suicideUnit:true,suicideDamage:281,suicideSplash:60,suicideSplashCells:1.5,color:'#d8d1bd',desc:'大きな爆弾を頭上に持ち上げて走る骸骨2体組。味方は青、敵は赤のバンダナを巻く。2コスト・1体HP331・移動速度74（速い・従来より少し上昇）で、敵ユニットを無視して建物だけへ突進。近接（短距離）まで届くとそれぞれ自爆し、半径1.5マスへ281の範囲ダメージを与えて消滅する。途中で倒された場合は爆発ダメージを発生させない。'},
  skeletonbarrel:{id:'skeletonbarrel',mass:1.15,name:'スケルトンバレル',short:'スケバレ',role:'飛行・建物特攻・撃破展開',cost:3,hp:532,damage:145,speed:56,range:20,cooldown:99,radius:15,count:1,air:true,targetsAir:false,buildingOnly:true,suicideUnit:true,suicideDamage:145,carrierDeathDamage:145,carrierDeathRadius:60,deathSummonType:'skeleton',deathSummonCount:7,color:'#8fb6da',desc:'髑髏模様の樽を3つの風船で吊るした3コスト飛行攻城ユニット。HP532、少し速い移動で建物だけを狙い、到達時は樽を落として145ダメージを与えつつスケルトン7体を展開。途中で倒されてもその場で風船が割れ、周囲へ145ダメージを与えてからスケルトン7体が飛び出す。'},
  airballoon:{id:'airballoon',mass:4.8,name:'エアバルーン',short:'バルーン',role:'飛行・建物特攻・真上爆撃・死亡時遅延爆弾',cost:5,hp:1676,damage:640,speed:38,range:8,cooldown:2,radius:23,count:1,air:true,targetsAir:false,buildingOnly:true,overheadAttack:true,projectile:'airballoon_bomb',deathBombDamage:240,deathBombRadius:33,deathBombDelay:2,deathBombKind:'airballoonbomb',color:'#4f9dff',desc:'青い気球（敵側は赤）にスケルトンが乗る5コスト飛行ユニット。HP1676・攻撃640・攻撃間隔2秒。建物だけを狙い、建物の中心ほぼ真上まで飛んでから爆弾を真下へ落とす。移動速度は38へ少し低下。倒されると死亡地点に爆弾を残し、2秒後に半径1マスの地上ユニットと建物へ240ダメージ。'},
  lumberjack:{id:'lumberjack',mass:2.4,name:'\u30e9\u30f3\u30d0\u30fc\u30b8\u30e3\u30c3\u30af',short:'\u30e9\u30f3\u30d0\u30fc',role:'\u9ad8\u901f\u8fd1\u63a5\u30fb\u6b7b\u4ea1\u6642\u30ec\u30a4\u30b8',cost:4,hp:1282,damage:255,speed:79,range:33,cooldown:.8,radius:16,count:1,air:false,targetsAir:false,deathRage:true,color:'#d6a557',desc:'\u91d1\u9aea\u3068\u3072\u3052\u3082\u3058\u3083\u306e\u5c0f\u67c4\u306a4\u30b3\u30b9\u30c8\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\u3002HP1282\u30fb\u653b\u6483255\u30fb\u653b\u6483\u9593\u96940.8\u79d2\u30fb\u79fb\u52d5\u306f\u3068\u3066\u3082\u901f\u3044\u3002\u5c0f\u578b\u306e\u65a7\u3067\u5730\u4e0a\u306e\u6575\u3092\u653b\u6483\u3057\u3001\u5012\u3055\u308c\u308b\u3068\u62b1\u3048\u3066\u3044\u305f\u30ec\u30a4\u30b8\u74f6\u3092\u6b7b\u4ea1\u5730\u70b9\u3078\u843d\u3068\u3059\u30021.5\u79d2\u5f8c\u306b\u65e2\u5b58\u306e\u30ec\u30a4\u30b8\u3068\u540c\u3058\u52b9\u679c\u3092\u767a\u52d5\u3059\u308b\u3002'},
  giant:{id:'giant',mass:10.5,name:'ジャイアント',short:'ジャイアント',role:'建物特攻・大型タンク',cost:5,hp:3968,damage:254,speed:27,range:50,cooldown:1.5,radius:29,count:1,air:false,targetsAir:false,buildingOnly:true,meleeTier:'medium',color:'#9a7048',desc:'ボロボロの茶色い服を着た体格の大きなおじさん。5コスト・HP3968・攻撃254・攻撃間隔1.5秒。地上をゆっくり進み、敵ユニットには反応せず建物だけを狙う。近接（中距離）まで近づくと、大きな拳で建物を殴る。歩行中は左右の腕を上下に大きく振る。'},
  giantskeleton:{id:'giantskeleton',mass:9.4,name:'\u5de8\u5927\u30b9\u30b1\u30eb\u30c8\u30f3',short:'\u5de8\u5927\u30b9\u30b1',role:'\u5730\u4e0a\u524d\u885b\u30fb\u6b7b\u4ea1\u6642\u6642\u9650\u7206\u5f3e',cost:6,hp:3361,damage:276,speed:40,range:36,cooldown:1.3,radius:25,count:1,air:false,targetsAir:false,deathBombDamage:688,deathBombRadius:58,deathBombDelay:3,color:'#c9c1ad',desc:'6\u30b3\u30b9\u30c8\u306e\u5927\u578b\u5730\u4e0a\u30b9\u30b1\u30eb\u30c8\u30f3\u3002HP3361\u30fb\u653b\u6483276\u30fb\u653b\u6483\u9593\u96941.3\u79d2\u3067\u3001\u5730\u4e0a\u30e6\u30cb\u30c3\u30c8\u3068\u5efa\u7269\u3092\u653b\u6483\u3002\u6b69\u884c\u4e2d\u306f\u4e21\u8155\u3092\u7e26\u306b\u632f\u308b\u3002\u5012\u3055\u308c\u308b\u3068\u6b7b\u4ea1\u5730\u70b9\u306b\u7206\u5f3e\u3092\u6b8b\u3057\u30013\u79d2\u5f8c\u306b\u534a\u5f8458\u3078688\u30c0\u30e1\u30fc\u30b8\u3002'},
  skeletonrush:{id:'skeletonrush',cardType:'spell',spell:'skeletonrush',name:'スケルトンラッシュ',short:'スケラッシュ',role:'呪文・継続スケルトン召喚',cost:5,damage:0,buildingDamage:0,radius:110,count:0,targetsAir:false,activationDelay:1.2,zoneDuration:9,firstSpawnDelay:3,spawnEvery:.5,spawnType:'skeleton',offscreenFraction:.4,color:'#8f67bc',desc:'指定範囲を1.2秒後に紫色の召喚エリアへ変化。発動後3秒でスケルトン1体を出し、その後0.5秒ごとに召喚。効果は9秒。建物に範囲を重ねられるが建物内部には出現しない。範囲は最大40%まで画面外へはみ出せ、画面内の有効地点だけに出現する。'},
  fireball:{id:'fireball',cardType:'spell',spell:'fireball',name:'ファイヤーボール',short:'火球',role:'呪文・予告範囲爆撃・ノックバック',cost:4,damage:689,buildingDamage:159,radius:100,count:0,targetsAir:true,launchDelay:1.1,knockbackCells:1,color:'#ed7a47',desc:'指定地点を1.1秒予告した後、自軍中央本拠地から火球を発射する。半径2.5マスへ敵ユニット・設置建物689ダメージ、サイド/中央タワーへ159ダメージ。小型・中型ユニットは爆心地から外側へ約1マス吹き飛ばす。発射後の距離依存飛行時間は従来どおり。'},
  goblinbarrel:{id:'goblinbarrel',cardType:'spell',spell:'goblinbarrel',name:'ゴブリンバレル',short:'ゴブバレ',role:'呪文・遠距離ゴブリン3体奇襲',cost:3,damage:0,buildingDamage:0,radius:88,count:0,targetsAir:false,launchDelay:1.1,spawnType:'goblin_melee',spawnCount:3,color:'#9a7048',desc:'マップ上の好きな地点を指定できる3コスト呪文。1.1秒の発射予告後、自軍中央タワーから木樽が回転しながらファイヤーボールと同じ速度で飛び、着弾地点へ通常ゴブリン3体を三角形に展開する。タワー中央付近へ落とすと3体が塔を囲み、左右へ寄せて落とすと指定した側へ3体がまとまって出現する。'},
  rollingwood:{id:'rollingwood',cardType:'spell',spell:'rollingwood',name:'ローリングウッド',short:'ウッド',role:'呪文・長距離地上なぎ払い・ノックバック',cost:2,damage:268,buildingDamage:35,towerDamage:35,count:0,targetsAir:false,widthCells:3.9,travelCells:10.1,rollSpeed:165,knockbackCells:.5,deploymentZoneOnly:true,color:'#8b6544',desc:'自分がユニットを召喚できる範囲からだけ発動できる2コスト地上スペル。指定地点から敵陣方向へ幅3.9マスのトゲ付き丸太が10.1マス転がり、進路上の地上ユニット・設置建物へ268、タワーへ35ダメージを1対象につき1回だけ与える。v46.0.0で転がる速度を182から165へさらに少し低下。命中した地上ユニットは大小に関係なく同じ距離だけ少し前方へノックバックする。'},
  rollingbarbarian:{id:'rollingbarbarian',cardType:'spell',spell:'rollingbarbarian',name:'ローリングバーバリアン',short:'樽ババ',role:'呪文・短距離地上なぎ払い・バーバリアン召喚',cost:2,damage:232,buildingDamage:232,towerDamage:0,count:0,targetsAir:false,widthCells:2.6,travelCells:4.5,rollSpeed:140,deploymentZoneOnly:true,spawnType:'barbarian',spawnCount:1,color:'#9a7048',desc:'ローリングウッドと同じく、自分がユニットを召喚できる範囲からだけ発動できる2コスト地上スペル。バーバリアンが挟まった木樽が指定地点から敵陣方向へ幅2.6マス・4.5マス転がり、進路上の地上ユニットへ232ダメージを1回だけ与える。v46.0.0で転がる速度を154から140へさらに少し低下。タワーにはダメージを与えず、終点で樽が壊れて通常のバーバリアン1体が出現する。ノックバックは発生しない。'},
  rocket:{id:'rocket',cardType:'spell',spell:'rocket',name:'ロケット',short:'ロケット',role:'呪文・超高火力遠距離爆撃',cost:6,damage:1484,buildingDamage:343,towerDamage:343,radius:66,count:0,targetsAir:true,rocketTravelBase:1.212105008362148,rocketTravelSpeed:289.8635557684609,color:'#b85f48',desc:'6コストの超高火力スペル。指定した瞬間に自軍中央タワーからロケットを発射し、発射前の待ち時間はない。着弾地点の半径2マスへ敵ユニット・設置建物1484ダメージ、サイド/中央タワーへ343ダメージ。飛行時間は距離依存で、橋中央付近なら約3.16秒、同じレーンの敵中央タワーなら約4.8秒。'},
  poison:{id:'poison',cardType:'spell',spell:'poison',name:'ポイズン',short:'ポイズン',role:'呪文・8秒継続毒エリア',cost:3,damage:91,buildingDamage:21,radius:90,count:0,targetsAir:true,zoneDuration:8,tickEvery:1,lingerDuration:0,lingerDamage:0,color:'#c94f5c',desc:'指定地点へ遅延なしで毒エリアを8秒展開。範囲内の敵ユニット・設置建物へ毎秒91ダメージ、タワーへ毎秒21ダメージ。範囲を離れた後の残留毒は発生しない。'},
  arrowrain:{id:'arrowrain',cardType:'spell',spell:'arrowrain',name:'矢の雨',short:'矢の雨',role:'呪文・予告遠距離一斉射撃',cost:3,damage:366,buildingDamage:75,radius:140,count:0,targetsAir:true,launchDelay:.9,color:'#c89b68',desc:'指定地点を0.9秒予告した後、自軍中央本拠地から多数の矢を一斉発射する。半径3.5マスへ敵ユニット・設置建物366ダメージ、タワー75ダメージ。発射後は従来どおり本拠地から指定地点まで距離依存で飛行する。'},
  lightning:{id:'lightning',cardType:'spell',spell:'lightning',name:'ライトニング',short:'ライトニング',role:'呪文・遅延順次高HP4体雷撃',cost:6,damage:1056,buildingDamage:265,radius:105,maxTargets:4,count:0,targetsAir:true,activationDelay:1,strikeInterval:.2,color:'#69aee8',desc:'指定地点に約1秒の予告を出した後、その時点で半径105の範囲内にいる敵から現在HPが高い順に最大4体を選択。タワー・建物を含め、0.2秒間隔で1体ずつ上空から雷を落とし、ユニット・設置建物へ1056、タワーへ265ダメージを与える6コスト呪文。'},
  zap:{id:'zap',cardType:'spell',spell:'zap',name:'ザップ',short:'ザップ',role:'呪文・瞬間スタン＋思考リセット',cost:2,damage:225,buildingDamage:225,radius:78,count:0,targetsAir:true,stunDuration:1.5,color:'#75bde8',desc:'指定地点へ瞬時に電撃を落とし、半径78の敵ユニット・建物へ225ダメージと1.5秒スタン。現在の攻撃対象を解除し、レーザー塔の火力上昇やスパーキーの充電も0へリセットする。スタン解除後に対象を選び直す。'},
  rage:{id:'rage',cardType:'spell',spell:'rage',name:'レイジ',short:'レイジ',role:'呪文・速度強化フィールド',cost:2,damage:179,buildingDamage:45,radius:99,count:0,targetsAir:true,placementTime:.5,activationDelay:1.5,zoneDuration:4.5,boostMultiplier:1.3,color:'#d94fba',desc:'台形の瓶に入ったピンク色の液体を指定地点へ展開する2コスト呪文。指定から1.5秒後に半径3マスへ敵ユニット・設置建物179、タワー45ダメージを与え、その後4.5秒間、範囲内の味方の移動・攻撃・生成など時間系の進行を30%高速化する。HP・一発の攻撃力・射程・建物の自然HP減少量は変化しない。'},
  cyclone:{id:'cyclone',cardType:'spell',spell:'cyclone',name:'サイクロン',short:'サイクロン',role:'呪文・超広範囲瞬間吸引',cost:3,damage:84,buildingDamage:58,radius:182,count:0,targetsAir:true,zoneDuration:1,pullSpeed:210,color:'#8bc8cf',desc:'指定地点に半径5.5マスの巨大な渦を1秒間生成。従来3秒分の総吸引量を1秒へ圧縮するため、1秒あたりの吸引速度は3倍。範囲内の敵ユニット・設置建物へ84、タワーへ58ダメージを発動時に1回だけ与える。建物・タワーは吸い込まれず、敵ユニットだけが中心へ引き寄せられる。'}

};

const RANGE_CELL_OVERRIDES = Object.freeze({
  blade:1,knight:1,archer:5,mage:5,bat:1,bomber:4.5,cannon:6.5,goblinhut:6,tesla:5.5,golem:1,icegolem:1,
  berserker:1,miniberserker:1,megaknight:1,ironeye:5,tracker:1,valkyrie:1,gargoyle:1.5,gargoyleswarm:1.5,
  mini_golem:1,boar:1,tigger:1,muddragon:4,nightshade:1,mossling:1,goblin_melee:1,goblin_spear:4,goblins:1,speargoblins:4,
  megagargoyle:2,apprenticeguards:1.5,apprenticeguard:1.5,icespirit:1,firespirit:1,skeleton:1,boneswarm:1,
  tombstone:0,oven:0,barbarian:1,barbarians:1,siegebarbarian:1,elixirgolem:1,elixir_golem_mid:1,elixir_blob:1,
  royalgiant:5,lumina:4,frost:5,harpy:5,electrowizard:5,necromancer:5,darknecro:1,dosranboss:1,ranbos:1,
  ashsquad:1,princess:9,sparky:4.5,blowdart:6,lasertower:6.5,laserdragon:4.5,shieldknight:1,prince:2,darkprince:1.5,
  windmage:5.5,wizard:5.5,musketeer:6,hunter:4,babydragon:3.5,falche:4.5,phoenix:3.5,phoenix_egg:0,mirage:1,skybomber:5,scrapdrill:1,bombcarrier:1,skeletonbarrel:1,airballoon:.25,lumberjack:1,giant:1.5,giantskeleton:1
});
const SPELL_RADIUS_CELLS = Object.freeze({skeletonrush:3.5,fireball:2.5,goblinbarrel:2.2,rocket:2,poison:2.5,arrowrain:3.5,lightning:3,zap:2.5,rage:3,cyclone:5.5});
const DISTANCE_KEY_TO_CELL_KEY = Object.freeze({
  splash:'splashCells',deathRadius:'deathRadiusCells',dropRadius:'dropRadiusCells',jumpMinRange:'jumpMinRangeCells',jumpMaxRange:'jumpMaxRangeCells',
  jumpRadius:'jumpRadiusCells',hookRange:'hookRangeCells',hookMinRange:'hookMinRangeCells',spinTriggerRange:'spinTriggerRangeCells',spinDistance:'spinDistanceCells',
  spinHitRadius:'spinHitRadiusCells',chargeDistance:'chargeDistanceCells',carrierDeathRadius:'carrierDeathRadiusCells',chainRange:'chainRangeCells',
  dashAggroRange:'dashAggroRangeCells',dashMinRange:'dashMinRangeCells',dashMaxRange:'dashMaxRangeCells',deathBombRadius:'deathBombRadiusCells',
  fireBlastRadius:'fireBlastRadiusCells',fireLeapRange:'fireLeapRangeCells',iceBlastRadius:'iceBlastRadiusCells',iceLeapRange:'iceLeapRangeCells',
  healOnHitRange:'healOnHitRangeCells',mudRadius:'mudRadiusCells',riverJumpSpawnBand:'riverJumpSpawnBandCells',riverJumpTrigger:'riverJumpTriggerCells',axeTravelRange:'axeTravelRangeCells',axeHitWidth:'axeHitWidthCells',pelletRange:'pelletRangeCells'
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
  'prince.chargeDistance':2.5,'darkprince.chargeDistance':2,'falche.axeTravelRange':7,'falche.axeHitWidth':2,'hunter.pelletRange':6.5,'wizard.splash':1.5,'babydragon.splash':1.2
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
  if(d.spell&&Number.isFinite(d.widthCells)){out.widthCells=d.widthCells;out.width=cellsToWorld(d.widthCells);}
  if(d.spell&&Number.isFinite(d.travelCells)){out.travelCells=d.travelCells;out.travelDistance=cellsToWorld(d.travelCells);}
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
const UNITS = Object.freeze(Object.fromEntries(Object.entries(RAW_UNITS).map(([id,d])=>[id,gridizeCard(id,d)])));
function cardDamageInfo(data){
  if(!data)return {unit:'-',tower:'-'};
  if(data.spell==='skeletonrush')return {unit:'スケルトン召喚',tower:'召喚'};
  if(data.spell==='goblinbarrel')return {unit:'ゴブリン×3',tower:'ゴブリン×3'};
  if(data.spell==='rollingwood')return {unit:`${data.damage} + ノックバック`,tower:String(data.towerDamage??data.buildingDamage??0)};
  if(data.spell==='rollingbarbarian')return {unit:`${data.damage} + バーバリアン×1`,tower:'0'};
  if(data.id==='hunter')return {unit:`${data.damage}×${data.pelletCount} (最大${data.damage*data.pelletCount})`,tower:`${data.damage}×${data.pelletCount} (最大${data.damage*data.pelletCount})`};
  if(data.spell==='cyclone')return {unit:String(data.damage||0),tower:String(data.towerDamage??data.buildingDamage??0)};
  if(data.spell==='poison')return {unit:`${data.damage} / ${data.tickEvery}秒`,tower:`${data.buildingDamage} / ${data.tickEvery}秒`};
  if(data.laserTower||data.laserUnit)return {unit:`${data.laserBaseDps||data.damage} DPS〜`,tower:`${data.laserBaseDps||data.damage} DPS〜`};
  if(data.energyPump)return {unit:'攻撃不可',tower:'攻撃不可'};
  if(data.passiveSpawner)return {unit:'槍ゴブリン生成',tower:'槍ゴブリン生成'};
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
const DECK = Object.freeze(Object.keys(UNITS).filter(id=>!UNITS[id].hidden));
const UNIT_IDS = Object.freeze(DECK.filter(id=>!UNITS[id].spell));
const SPELL_IDS = Object.freeze(DECK.filter(id=>!!UNITS[id].spell));
const DEFAULT_DECK = Object.freeze(['knight','blowdart','archer','muddragon','dosranboss','arrowrain','lasertower','fireball']);
const CPU_STYLE_LABELS=Object.freeze({aggressive:'攻撃型',defensive:'防衛型',combo:'コンボ型',counter:'カウンター型',balanced:'バランス型'});
const CPU_STYLE_KEYS=Object.freeze(Object.keys(CPU_STYLE_LABELS));
const CPU_ARCHETYPE_LABELS=Object.freeze({balanced:'バランス',air:'空中',heavy:'大型',swarm:'群体',summon:'召喚',siege:'攻城',control:'防衛コントロール',cycle:'高速サイクル'});
function cpuSeededRandom(seed){let x=(Number(seed)||1)>>>0;return ()=>{x=(x+0x6D2B79F5)>>>0;let t=x;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
function cpuCardDps(d){if(!d||d.spell||d.building&&d.damage<=0)return 0;if(d.sparkUnit)return (d.damage||0)/Math.max(.1,d.sparkChargeTime||3.5);const shot=(d.damage||0)*Math.max(1,d.pelletCount||1);return (shot/Math.max(.1,d.cooldown||1))*Math.max(1,d.count||1);}
function cpuIsSplash(d){return !!(d&&(d.splash||d.meleeSplash||d.valkyrieSpin||d.projectile==='wizard_fire'||d.projectile==='mud'||d.projectile==='sparkblast'||d.id==='falche'||d.id==='babydragon'));}
function cpuIsSwarm(d){return !!(d&&!d.spell&&!d.building&&((d.count||1)>=3||['necromancer','darknecro','dosranboss'].includes(d.id)));}
function cpuIsWinCondition(d){return !!(d&&!d.spell&&(d.buildingOnly||d.tunnelAnywhere||['prince','darkprince','siegebarbarian','bombcarrier','skeletonbarrel'].includes(d.id)));}
function cpuIsTank(d){return !!(d&&!d.spell&&!d.building&&(d.hp||0)>=1800);}
function cpuIsSupport(d){return !!(d&&!d.spell&&!d.building&&!d.buildingOnly&&((d.rangeCells||0)>=3.5||d.targetsAir||d.summonType||d.healOnHit));}
function cpuDeckArchetypeFor(deck){
  const ds=deck.map(id=>UNITS[id]).filter(Boolean),units=ds.filter(d=>!d.spell),air=units.filter(d=>d.air).length,swarm=units.filter(cpuIsSwarm).length,summon=units.filter(d=>d.summonType||['goblinhut','oven','tombstone'].includes(d.id)).length,heavy=units.filter(d=>(d.hp||0)>=2800).length,siege=units.filter(d=>d.buildingOnly).length,buildings=units.filter(d=>d.building).length,cheap=ds.filter(d=>d.cost<=3).length;
  if(air>=3)return 'air';if(heavy>=2)return 'heavy';if(summon>=2)return 'summon';if(siege>=2)return 'siege';if(swarm>=3)return 'swarm';if(buildings>=2)return 'control';if(cheap>=5)return 'cycle';return 'balanced';
}
function generateCpuDeck(seed=12345,style='balanced'){
  const rnd=cpuSeededRandom((Number(seed)||1)^0x6d2b79f5),archetypes=['balanced','air','heavy','swarm','summon','siege','control','cycle'];
  const archetype=archetypes[Math.floor(rnd()*archetypes.length)],out=[];
  const units=UNIT_IDS.map(id=>UNITS[id]).filter(Boolean),spells=SPELL_IDS.map(id=>UNITS[id]).filter(Boolean);
  const pools={
    win:units.filter(cpuIsWinCondition),tank:units.filter(cpuIsTank),support:units.filter(cpuIsSupport),air:units.filter(d=>d.air),antiAir:units.filter(d=>d.targetsAir),swarm:units.filter(cpuIsSwarm),summon:units.filter(d=>d.summonType||['goblinhut','oven','tombstone'].includes(d.id)),building:units.filter(d=>d.building),cheap:units.filter(d=>d.cost<=3),splash:units.filter(cpuIsSplash),heavy:units.filter(d=>(d.hp||0)>=2800),all:units
  };
  const add=(pool,predicate=null)=>{const choices=pool.filter(d=>!out.includes(d.id)&&(!predicate||predicate(d)));if(!choices.length)return false;const d=choices[Math.floor(rnd()*choices.length)];out.push(d.id);return true;};
  add(pools.win);
  if(archetype==='air'){add(pools.air);add(pools.air);add(pools.antiAir,d=>!d.air);add(pools.splash);}
  else if(archetype==='heavy'){add(pools.heavy);add(pools.support);add(pools.support);add(pools.splash);}
  else if(archetype==='swarm'){add(pools.swarm);add(pools.swarm);add(pools.splash);add(pools.tank);}
  else if(archetype==='summon'){add(pools.summon);add(pools.summon);add(pools.support);add(pools.tank);}
  else if(archetype==='siege'){add(pools.win);add(pools.support);add(pools.antiAir);add(pools.building);}
  else if(archetype==='control'){add(pools.building);add(pools.support);add(pools.splash);add(pools.antiAir);}
  else if(archetype==='cycle'){add(pools.cheap);add(pools.cheap);add(pools.swarm,d=>d.cost<=3);add(pools.support,d=>d.cost<=4);}
  else {add(pools.tank);add(pools.support);add(pools.antiAir);add(pools.splash);}
  while(out.length<6){if(!add(pools.all))break;}
  const light=spells.filter(d=>d.cost<=3),heavy=spells.filter(d=>d.cost>=4),supportSpell=spells.filter(d=>['rage','zap','arrowrain','fireball','poison','lightning'].includes(d.id));
  const spellPick=(style==='combo'&&rnd()<.55?supportSpell:archetype==='cycle'?light:spells);
  add(spellPick);add(archetype==='heavy'||archetype==='control'?heavy:spells);
  while(out.length<MAX_DECK){const pool=out.filter(id=>UNITS[id]?.spell).length<2?spells:units;if(!add(pool))break;}
  const maxAvg=archetype==='heavy'?5.15:4.75;for(let guard=0;guard<8;guard++){const avg=out.reduce((sum,id)=>sum+(UNITS[id]?.cost||0),0)/Math.max(1,out.length);if(avg<=maxAvg)break;let at=-1,bestCost=-1;for(let i=1;i<out.length;i++){const d=UNITS[out[i]];if(d?.spell||cpuIsWinCondition(d))continue;if((d?.cost||0)>bestCost){bestCost=d.cost;at=i;}}const replacements=units.filter(d=>d.cost<=3&&!out.includes(d.id));if(at<0||!replacements.length)break;out[at]=replacements[Math.floor(rnd()*replacements.length)].id;}
  return {cards:out.slice(0,MAX_DECK),archetype};
}
const ROLE_ORDER = DECK;
const TEAM_COLORS = ['#58b9ae','#ee9b81'];
function normalizeDeck(value,{fallback=true}={}){
  const out=[];
  if(Array.isArray(value))for(const id of value){if(typeof id==='string'&&DECK.includes(id)&&!out.includes(id))out.push(id);if(out.length===MAX_DECK)break;}
  if(out.length===MAX_DECK)return out;
  return fallback?[...DEFAULT_DECK]:null;
}


/** Shared deterministic navigation and collision geometry. No browser APIs.
 * Ground bodies live on the lawn/bridges. Air bodies share a separate layer.
 * Structures separate their placement footprint from the smaller physical hitbox.
 */
const PHYSICS_VERSION=83;
const FIELD={left:0,right:ARENA.width,top:0,bottom:ARENA.height};
const EPS=0.001,GRID=ARENA.cellSize/2,COLS=Math.floor(ARENA.width/GRID)+1,ROWS=Math.floor(ARENA.height/GRID)+1;
const worldCaches=new WeakMap();
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clampP=(n,a,b)=>Math.max(a,Math.min(b,n));
const isStructure=u=>!!(u.kind||u.building);
const bodyRadius=u=>(u?.kind||u?.building)?(u.radius||12):Math.min(u?.radius||12,ARENA.cellSize*.45);
const sameLayer=(a,b)=>!!a.air===!!b.air;
const solidStructures=g=>[...g.towers,...g.units.filter(u=>u.building&&!u.collisionDisabled)].filter(u=>u.hp>0);

function footprintRect(u,p=u){
  if(!(u?.kind||u?.building))return null;
  const cols=u.footprintCols||ARENA.defaultBuildingCells,rows=u.footprintRows||ARENA.defaultBuildingCells;
  const hw=cols*ARENA.cellSize/2,hh=rows*ARENA.cellSize/2;
  return {l:p.x-hw,r:p.x+hw,t:p.y-hh,b:p.y+hh,hw,hh};
}
function hitboxRect(u,p=u){
  if(!(u?.kind||u?.building))return null;
  const fallbackCols=Math.max(.5,Math.min(u.footprintCols||ARENA.defaultBuildingCells,((u.radius||20)*2)/ARENA.cellSize));
  const fallbackRows=Math.max(.5,Math.min(u.footprintRows||ARENA.defaultBuildingCells,((u.radius||20)*2)/ARENA.cellSize));
  const cols=u.hitboxCols||fallbackCols,rows=u.hitboxRows||fallbackRows;
  const hw=cols*ARENA.cellSize/2,hh=rows*ARENA.cellSize/2;
  return {l:p.x-hw,r:p.x+hw,t:p.y-hh,b:p.y+hh,hw,hh};
}
function rectsOverlap(a,b,margin=0){return a.l<b.r+margin&&a.r>b.l-margin&&a.t<b.b+margin&&a.b>b.t-margin;}
function pointRectDistance(p,r){return Math.hypot(p.x-clampP(p.x,r.l,r.r),p.y-clampP(p.y,r.t,r.b));}
function buildingFootprintTerrainFree(u,p,margin=0){
  const r=footprintRect(u,p);if(!r)return false;
  if(r.l<FIELD.left+margin-EPS||r.r>FIELD.right-margin+EPS||r.t<FIELD.top+margin-EPS||r.b>FIELD.bottom-margin+EPS)return false;
  // A normal 3x3 building may not cover open river cells. The wider bridges remain traversal lanes, not building pads.
  return water.every(w=>!rectsOverlap(r,w,margin));
}
function buildingDeploymentAllowed(g,owner,u,p){
  const r=footprintRect(u,p);if(!r)return deploymentAllowed(g,owner,p.x,p.y);
  return [[r.l+1,r.t+1],[r.r-1,r.t+1],[r.l+1,r.b-1],[r.r-1,r.b-1]].every(([x,y])=>deploymentAllowed(g,owner,x,y));
}

const bridgeGround=x=>ARENA.bridges.some(b=>Math.abs(x-b)<=ARENA.bridgeHalf);
const deploymentWater=(x,y)=>y>ARENA.riverTop&&y<ARENA.riverBottom&&!bridgeGround(x);
/** Keep a legal lawn-edge deployment from letting the unit body overlap open water.
 * Direct taps whose centre is actually over open water are rejected by canPlace;
 * this helper only nudges edge-overlap back to the nearest own riverbank.
 */
function snapDeploymentPoint(owner,u,x,y,{correctWater=false}={}){
  const p={x,y};if(owner!==0&&owner!==1)return p;
  // v37.5.2: buildings snap to the nearest 40px grid-cell centre. The 3x3 footprint remains a required clear placement area.
  if(u?.building){
    p.x=(Math.floor(clampP(x,0,ARENA.width-EPS)/ARENA.cellSize)+.5)*ARENA.cellSize;
    p.y=(Math.floor(clampP(y,0,ARENA.height-EPS)/ARENA.cellSize)+.5)*ARENA.cellSize;
    return p;
  }
  const r=bodyRadius(u)+1,onBridge=bridgeGround(x),inWater=deploymentWater(x,y);
  if(inWater&&!correctWater)return p;
  if(onBridge)return p;
  if(owner===0){
    if(y<ARENA.riverBottom+r&&y>ARENA.riverTop-r)p.y=ARENA.riverBottom+r;
  }else if(y>ARENA.riverTop-r&&y<ARENA.riverBottom+r)p.y=ARENA.riverTop-r;
  return p;
}

function deploymentAllowed(g,owner,x,y){
  if(owner!==0&&owner!==1)return false;
  if(owner===0&&y>=ARENA.deployBottom)return true;
  if(owner===1&&y<=ARENA.deployTop)return true;
  const enemy=1-owner,inset=ARENA.advancedDeployInset||120,centreHalf=ARENA.advancedCenterHalf||52;
  const sides=(g.towers||[]).filter(t=>t.owner===enemy&&t.kind==='tower');
  const fallen=sides.filter(t=>t.hp<=0);
  if(!fallen.length)return false;
  // Once both side towers are down, the enemy front half becomes one continuous deployment zone.
  if(fallen.length>=2){
    const line=owner===0?Math.max(...fallen.map(t=>t.y))+inset:Math.min(...fallen.map(t=>t.y))-inset;
    return owner===0?y>=line:y<=line;
  }
  // One tower down: only that lane plus a narrow centre connector gains ground.
  const t=fallen[0],left=t.x<ARENA.midX,laneOK=left?x<=ARENA.midX-ARENA.cellSize:x>=ARENA.midX+ARENA.cellSize,centreOK=Math.abs(x-ARENA.midX)<=centreHalf;
  if(!laneOK&&!centreOK)return false;
  return owner===0?y>=t.y+inset:y<=t.y-inset;
}
function pairDistance(a,b,soft=false){
  const sum=bodyRadius(a)+bodyRadius(b);
  if(a.air&&b.air)return sum*(a.owner===b.owner?.9:1);
  return sum*(soft&&a.owner===b.owner?.90:1);
}
const water=[
  {l:0,r:ARENA.bridges[0]-ARENA.bridgeHalf,t:ARENA.riverTop,b:ARENA.riverBottom},
  {l:ARENA.bridges[0]+ARENA.bridgeHalf,r:ARENA.bridges[1]-ARENA.bridgeHalf,t:ARENA.riverTop,b:ARENA.riverBottom},
  {l:ARENA.bridges[1]+ARENA.bridgeHalf,r:ARENA.width,t:ARENA.riverTop,b:ARENA.riverBottom}
];
function rectDistance(p,r){return pointRectDistance(p,r);}
function terrainFree(u,p,margin=0){
  const r=bodyRadius(u)+margin;
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y))return false;
  if(p.x<FIELD.left+r-EPS||p.x>FIELD.right-r+EPS||p.y<FIELD.top+r-EPS||p.y>FIELD.bottom-r+EPS)return false;
  return !!u.air||water.every(w=>rectDistance(p,w)>=r-EPS);
}
function staticFree(g,u,p,margin=0,structures=null){
  const blockers=structures||solidStructures(g);
  if(u.building){
    if(!buildingFootprintTerrainFree(u,p,margin))return false;
    const own=footprintRect(u,p);
    return blockers.every(s=>{
      if(s.id===u.id)return true;
      // Player-placed buildings keep their 3x3 placement reservation. Towers/core no longer reserve 3x3/4x4 land for placement;
      // only their visible physical hitbox blocks a new building.
      const sr=s.kind?hitboxRect(s):footprintRect(s);
      return sr?!rectsOverlap(own,sr,margin):pointRectDistance(s,own)>=bodyRadius(s)+margin-EPS;
    });
  }
  if(!terrainFree(u,p,margin))return false;
  if(u.air)return true;
  return blockers.every(s=>{
    if(s.id===u.id)return true;
    const sr=hitboxRect(s);return sr?pointRectDistance(p,sr)>=bodyRadius(u)+margin-EPS:dist(p,s)>=bodyRadius(u)+bodyRadius(s)+margin-EPS;
  });
}
function segmentPointDistance(a,b,p){
  const dx=b.x-a.x,dy=b.y-a.y,len=dx*dx+dy*dy;
  const t=len?clampP(((p.x-a.x)*dx+(p.y-a.y)*dy)/len,0,1):0;
  return Math.hypot(a.x+dx*t-p.x,a.y+dy*t-p.y);
}
function staticLineFree(g,u,a,b,margin=0,structures=null){
  if(!staticFree(g,u,a,margin,structures)||!staticFree(g,u,b,margin,structures))return false;
  if(u.air)return true;
  const steps=Math.max(1,Math.ceil(dist(a,b)/(ARENA.cellSize/5)));
  for(let i=1;i<steps;i++)if(!staticFree(g,u,{x:a.x+(b.x-a.x)*i/steps,y:a.y+(b.y-a.y)*i/steps},margin,structures))return false;
  return true;
}

function topology(g){
  const structures=solidStructures(g);
  const key=structures.map(s=>`${s.id}:${s.x}:${s.y}:${s.radius}:${s.footprintCols||0}:${s.footprintRows||0}:${s.hitboxCols||0}:${s.hitboxRows||0}`).join('|');
  let cache=worldCaches.get(g);
  if(!cache||cache.key!==key){cache={key,structures,grids:new Map()};worldCaches.set(g,cache);}
  return cache;
}
function gridPoint(i){return {x:(i%COLS)*GRID,y:Math.floor(i/COLS)*GRID};}
function getGrid(g,u,cache){
  const r=bodyRadius(u);if(cache.grids.has(r))return cache.grids.get(r);
  const free=new Uint8Array(COLS*ROWS);
  for(let i=0;i<free.length;i++)free[i]=staticFree(g,u,gridPoint(i),2,cache.structures)?1:0;
  const data={free};cache.grids.set(r,data);return data;
}
class MinHeap {
  constructor(){this.items=[];this.order=0;}
  push(id,priority,cost){const a=this.items,v={id,priority,cost,order:this.order++};a.push(v);let i=a.length-1;while(i){const p=(i-1)>>1;if(!this.less(v,a[p]))break;a[i]=a[p];i=p;}a[i]=v;}
  less(a,b){return a.priority<b.priority-1e-8||(Math.abs(a.priority-b.priority)<1e-8&&a.order<b.order);}
  pop(){const a=this.items,top=a[0],v=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let k=i*2+1;if(k+1<a.length&&this.less(a[k+1],a[k]))k++;if(!this.less(a[k],v))break;a[i]=a[k];i=k;}a[i]=v;}return top;}
}
function routeToRange(g,u,target,reach,cache){
  const grid=getGrid(g,u,cache),len=grid.free.length,cost=new Float64Array(len).fill(Infinity),parent=new Int32Array(len).fill(-1),closed=new Uint8Array(len),heap=new MinHeap();
  const heuristic=p=>Math.max(0,dist(p,target)-reach);
  // Multiple visible starting cells avoid snapping/teleporting onto the grid.
  const cx=Math.round(u.x/GRID),cy=Math.round(u.y/GRID);
  for(let oy=-2;oy<=2;oy++)for(let ox=-2;ox<=2;ox++){
    const x=cx+ox,y=cy+oy;if(x<0||x>=COLS||y<0||y>=ROWS)continue;
    const id=y*COLS+x,p=gridPoint(id);
    if(grid.free[id]&&staticLineFree(g,u,u,p,0,cache.structures)){
      cost[id]=dist(u,p);heap.push(id,cost[id]+heuristic(p),cost[id]);
    }
  }
  // Keep tie-breaking local-seat symmetric (rotate 180 degrees for player 1).
  const f=u.owner===1?1:-1;
  const dirs=[[0,f],[-f,0],[f,0],[0,-f],[-f,f],[f,f],[-f,-f],[f,-f]];
  let end=-1,tail=null;
  while(heap.items.length){
    const cur=heap.pop(),id=cur.id;if(closed[id]||cur.cost>cost[id]+EPS)continue;
    closed[id]=1;const p=gridPoint(id);
    const remaining=dist(p,target);
    if(remaining<=reach){end=id;break;}
    if(remaining<reach+GRID*1.5){
      const d=Math.max(0,remaining-reach*.9),q={x:p.x+(target.x-p.x)*d/remaining,y:p.y+(target.y-p.y)*d/remaining};
      if(staticLineFree(g,u,p,q,1,cache.structures)){end=id;tail=q;break;}
    }
    const x=id%COLS,y=Math.floor(id/COLS);
    for(const [dx,dy] of dirs){
      const nx=x+dx,ny=y+dy;if(nx<0||nx>=COLS||ny<0||ny>=ROWS)continue;
      const ni=ny*COLS+nx;if(!grid.free[ni]||closed[ni])continue;
      const q=gridPoint(ni);
      if(!staticLineFree(g,u,p,q,1,cache.structures))continue;
      const nc=cost[id]+Math.hypot(dx,dy)*GRID;
      if(nc+EPS<cost[ni]){cost[ni]=nc;parent[ni]=id;heap.push(ni,nc+heuristic(q),nc);}
    }
  }
  if(end<0)return [];
  const raw=[];while(end>=0){raw.push(gridPoint(end));end=parent[end];}raw.reverse();if(tail)raw.push(tail);
  // Line-of-sight string pulling: no cell-centre snapping or diagonal corner cuts.
  const result=[];let from={x:u.x,y:u.y},i=0;
  while(i<raw.length){let j=i;while(j+1<raw.length&&staticLineFree(g,u,from,raw[j+1],1,cache.structures))j++;result.push(raw[j]);from=raw[j];i=j+1;}
  return result;
}
function navigationWaypoint(g,u,target,reach){
  const cache=topology(g),dx=target.x-u.x,dy=target.y-u.y,len=Math.hypot(dx,dy);
  if(len<.001)return {x:u.x,y:u.y};
  const stop=Math.max(0,len-reach+2),direct={x:u.x+dx/len*stop,y:u.y+dy/len*stop};
  if(u.air||staticLineFree(g,u,u,direct,1,cache.structures)){u._nav=null;return direct;}
  const now=g.time||0;let nav=u._nav;
  if(!nav||nav.key!==cache.key||nav.target!==target.id||
      ((dist(target,nav.aim)>35||!nav.points.length||u._stuck>.8)&&now>=nav.retry)){
    nav=u._nav={key:cache.key,target:target.id,aim:{x:target.x,y:target.y},points:routeToRange(g,u,target,Math.max(1,reach-2),cache),retry:now+.85};
  }
  while(nav.points.length&&dist(u,nav.points[0])<4)nav.points.shift();
  // Bypass obsolete waypoints only when the full body fits through the segment.
  while(nav.points.length>1&&staticLineFree(g,u,u,nav.points[1],1,cache.structures))nav.points.shift();
  return nav.points[0]||{x:u.x,y:u.y};
}
function timeOfContact(start,delta,other,radius){
  const x=start.x-other.x,y=start.y-other.y,a=delta.x*delta.x+delta.y*delta.y,b=x*delta.x+y*delta.y,c=x*x+y*y-radius*radius;
  if(a<1e-14)return 1;
  if(c<-.005){return b>=0?1:0;} // recovery may only move out of an existing overlap
  if(b>=0)return 1;
  const disc=b*b-a*c;if(disc<=0)return 1;
  const t=(-b-Math.sqrt(disc))/a;
  return t>=0&&t<1?Math.max(0,t-.0002):1;
}
function allowableFraction(g,u,dx,dy,{allies=true,soft=true}={}){
  const start={x:u.x,y:u.y},delta={x:dx,y:dy};let f=1;
  for(const v of g.units){
    if(v===u||v.id===u.id||v.hp<=0||v.collisionDisabled||!sameLayer(u,v)||isStructure(v))continue;
    if(!allies&&v.owner===u.owner)continue;
    const shoveable=!u.air&&!v.air&&u.owner!==v.owner&&u.shovePower&&((v.mass||1)<=u.shoveMassLimit);
    const collisionRadius=pairDistance(u,v,soft)*(shoveable?(u.shoveCompression||.65):1);
    f=Math.min(f,timeOfContact(start,delta,v,collisionRadius));
  }
  const end={x:u.x+dx*f,y:u.y+dy*f};
  if(!staticLineFree(g,u,start,end)){
    let lo=0,hi=f;for(let i=0;i<10;i++){const mid=(lo+hi)/2;if(staticLineFree(g,u,start,{x:start.x+dx*mid,y:start.y+dy*mid}))lo=mid;else hi=mid;}f=lo;
  }
  return f;
}
function moveBody(g,u,dest,dt){
  const dx=dest.x-u.x,dy=dest.y-u.y,len=Math.hypot(dx,dy);if(len<.01)return 0;
  const step=Math.min(u.speed*dt,len),ux=dx/len,uy=dy/len;
  const straight=allowableFraction(g,u,ux*step,uy*step);
  let best={x:ux*step*straight,y:uy*step*straight,score:straight*step*1.25,side:0};
  if(straight<.995){
    // Pick a stable side around crowds; do not jitter left/right at equal costs.
    const prefer=u._avoidSide||((Number(String(u.id).replace(/\D/g,''))%2)?1:-1);
    for(const theta of [.35,.7,1.05,1.35,Math.PI/2,1.8])for(const sign of [prefer,-prefer]){
      const a=theta*sign,x=(ux*Math.cos(a)-uy*Math.sin(a))*step,y=(ux*Math.sin(a)+uy*Math.cos(a))*step;
      const f=allowableFraction(g,u,x,y),score=(x*ux+y*uy)*f+step*f*.25+(sign===prefer?.01:0);
      if(score>best.score+.0001)best={x:x*f,y:y*f,score,side:sign};
    }
  }
  u.x+=best.x;u.y+=best.y;if(best.side)u._avoidSide=best.side;
  const moved=Math.hypot(best.x,best.y);u._stuck=moved<step*.08?(u._stuck||0)+dt:0;
  return moved;
}
function displaceBody(g,u,dx,dy){
  if(!Number.isFinite(dx)||!Number.isFinite(dy)||(!dx&&!dy)||u.hp<=0||u.collisionDisabled||isStructure(u))return 0;
  const f=allowableFraction(g,u,dx,dy,{allies:false,soft:false});
  const mx=dx*f,my=dy*f;u.x+=mx;u.y+=my;projectStatic(g,u);return Math.hypot(mx,my);
}
function faceToward(u,x,y){
  const dx=x-u.x,dy=y-u.y;if(Math.hypot(dx,dy)<.01)return;
  u.facing=Math.atan2(dy,dx);
  // Hysteresis keeps near-horizontal movement from flipping front/back every tick.
  if(Math.abs(dy)>Math.abs(dx)*.18+.001)u.face=dy<0?-1:1;
}
function projectStatic(g,u){
  if(isStructure(u))return;
  const r=bodyRadius(u);u.x=clampP(u.x,FIELD.left+r,FIELD.right-r);u.y=clampP(u.y,FIELD.top+r,FIELD.bottom-r);
  if(u.air)return;
  for(let pass=0;pass<8;pass++){
    let changed=false;
    for(const s of solidStructures(g)){
      const sr=hitboxRect(s);
      if(sr){
        const d=pointRectDistance(u,sr);
        if(d<r+.02){
          const left=Math.abs(u.x-(sr.l-r-.02)),right=Math.abs(u.x-(sr.r+r+.02)),top=Math.abs(u.y-(sr.t-r-.02)),bottom=Math.abs(u.y-(sr.b+r+.02));
          const m=Math.min(left,right,top,bottom);if(m===left)u.x=sr.l-r-.02;else if(m===right)u.x=sr.r+r+.02;else if(m===top)u.y=sr.t-r-.02;else u.y=sr.b+r+.02;changed=true;
        }
      }else{
        const d=dist(u,s),min=r+bodyRadius(s)+.02;
        if(d<min){let dx=d>.0001?(u.x-s.x)/d:(u.owner===0?-1:1),dy=d>.0001?(u.y-s.y)/d:0;u.x=s.x+dx*min;u.y=s.y+dy*min;changed=true;}
      }
    }
    for(const w of water)if(rectDistance(u,w)<r){
      const candidates=[{x:w.l-r-.02,y:u.y},{x:w.r+r+.02,y:u.y},{x:u.x,y:w.t-r-.02},{x:u.x,y:w.b+r+.02}]
        .filter(p=>terrainFree(u,p)).sort((a,b)=>dist(a,u)-dist(b,u));
      if(candidates.length){u.x=candidates[0].x;u.y=candidates[0].y;changed=true;}
    }
    u.x=clampP(u.x,FIELD.left+r,FIELD.right-r);u.y=clampP(u.y,FIELD.top+r,FIELD.bottom-r);
    if(!changed||staticFree(g,u,u))break;
  }
}
function resolveBodies(g,dt=.1){
  const units=g.units.filter(u=>u.hp>0&&u.burrowState!=='burrow'&&!u.collisionDisabled);
  for(const u of units)projectStatic(g,u);
  for(let pass=0;pass<8;pass++)for(let i=0;i<units.length;i++)for(let j=i+1;j<units.length;j++){
    const a=units[i],b=units[j];if(!sameLayer(a,b)||isStructure(a)||isStructure(b))continue;
    const len=dist(a,b),min=pairDistance(a,b),over=min-len;if(over<=.005)continue;
    const side=(Number(String(a.id).replace(/\D/g,''))%2)?1:-1;
    const nx=len>.001?(a.x-b.x)/len:side,ny=len>.001?(a.y-b.y)/len:0;
    const ally=a.owner===b.owner,ia=1/(a.mass||1),ib=1/(b.mass||1),sum=ia+ib;
    const aShoves=!ally&&!a.air&&a.shovePower&&((b.mass||1)<=a.shoveMassLimit);
    const bShoves=!ally&&!b.air&&b.shovePower&&((a.mass||1)<=b.shoveMassLimit);
    // Allies gently compress. Enemies stay rigid, except a charging heavy unit can force lightweight troops aside.
    const amount=ally?Math.min(over*.42,dt*18):(over+.005+((aShoves||bShoves)?Math.min(3.2,dt*((aShoves?a.shovePower:b.shovePower)||0)):0));
    let shareA=ia/sum,shareB=ib/sum;
    if(aShoves&&!bShoves){shareA=.06;shareB=.94;} else if(bShoves&&!aShoves){shareA=.94;shareB=.06;}
    for(const [u,sign,share] of [[a,1,shareA],[b,-1,shareB]]){
      const dx=nx*amount*share*sign,dy=ny*amount*share*sign;
      const f=allowableFraction(g,u,dx,dy,{allies:false,soft:false});u.x+=dx*f;u.y+=dy*f;
    }
  }
  for(const u of units)projectStatic(g,u);
}
/** Find all group-spawn positions before charging energy. No displacement of enemies. */
function groupOffset(count,i,radiusWorld=ARENA.cellSize){
  if(count<=1)return {x:0,y:0};
  const r=Math.max(ARENA.cellSize*.5,radiusWorld);
  if(count===2)return [{x:-r*.65,y:0},{x:r*.65,y:0}][i];
  if(count===3)return [{x:0,y:-r},{x:-r*.86,y:r*.5},{x:r*.86,y:r*.5}][i];
  if(count===5)return [{x:0,y:-r},{x:-r*.9,y:-r*.2},{x:r*.9,y:-r*.2},{x:-r*.55,y:r*.78},{x:r*.55,y:r*.78}][i];
  const cols=Math.ceil(Math.sqrt(count)),rows=Math.ceil(count/cols),row=Math.floor(i/cols),col=i%cols;
  const sx=count>4?r*1.55/Math.max(1,cols-1):r,sy=r*1.55/Math.max(1,rows-1);
  return {x:(col-(cols-1)/2)*sx,y:(row-(rows-1)/2)*sy};
}
function spawnPositions(g,owner,data,x,y,structures=null){
  const points=[],f=owner===0?1:-1,blockers=structures||solidStructures(g);
  const wideSpacing=data.wideFormation?(data.wideFormationSpacing||100):0;
  const wideSpan=data.wideFormation?Math.max(0,(data.count-1)*wideSpacing):0;
  const margin=ARENA.cellSize*.5;
  const wideCenter=data.wideFormation?clampP(x,margin+wideSpan/2,ARENA.width-margin-wideSpan/2):x;
  for(let i=0;i<data.count;i++){
    const formationRadius=(data.summonFormationRadiusCells||1)*ARENA.cellSize;
    const off=data.wideFormation?{x:(i-(data.count-1)/2)*wideSpacing,y:0}:groupOffset(data.count,i,formationRadius);
    const wanted={x:(data.wideFormation?wideCenter:x)+off.x*f,y:y+off.y*f};
    let found=null;
    // Ground buildings must remain exactly where clicked, not shift out from under the cursor.
    const rings=data.building?[0]:[0,12,24,36,48];
    for(const rr of rings){
      const n=rr?16:1;
      for(let k=0;k<n;k++){
        const a=k*Math.PI*2/n+(owner===1?Math.PI:0),raw={x:wanted.x+Math.cos(a)*rr,y:wanted.y+Math.sin(a)*rr};
        const p=snapDeploymentPoint(owner,data,raw.x,raw.y,{correctWater:true});
        const edge=Math.max(margin,bodyRadius(data)+1);
        if(p.x<edge||p.x>ARENA.width-edge||p.y<edge||p.y>ARENA.height-edge||!(data.building?buildingDeploymentAllowed(g,owner,data,p):deploymentAllowed(g,owner,p.x,p.y)))continue;
        if(!staticFree(g,data,p,1,blockers))continue;
        if(g.units.some(u=>u.hp>0&&sameLayer(data,u)&&dist(p,u)<bodyRadius(data)+bodyRadius(u)+.5))continue;
        if(points.some(q=>dist(p,q)<data.radius*2+.5))continue;
        found=p;break;
      }
      if(found)break;
    }
    if(!found)return null;points.push(found);
  }
  return points;
}

/** Placement-preview projection used only by the client drag UI.
 * It never changes battle simulation rules. Normal units/buildings return the
 * exact legal centre that the summon ghost may occupy, or null when the pointer
 * is outside the currently summonable geometry. Water-edge overlap is nudged
 * back to the nearest legal bank, matching the authoritative spawn logic.
 */
function deploymentPreviewPoint(g,owner,data,x,y){
  if(!g||!data||data.spell||data.tunnelAnywhere)return null;
  const p=snapDeploymentPoint(owner,data,x,y,{correctWater:true});
  if(!deploymentAllowed(g,owner,p.x,p.y))return null;
  if(!spawnPositions(g,owner,data,p.x,p.y))return null;
  return p;
}

/** Drag-preview projection for Rolling Wood / Rolling Barbarian.
 * Their authoritative cast rule already requires a summonable deployment zone.
 * The preview now behaves like a unit ghost: once the pointer crosses the active
 * deployment line (or open water), the caller keeps the last legal cast point.
 */
function deploymentZoneSpellPreviewPoint(g,owner,data,x,y){
  if(!g||!data||!data.spell||!data.deploymentZoneOnly)return null;
  const margin=ARENA.cellSize*.5,p={x:clampP(x,margin,ARENA.width-margin),y:clampP(y,margin,ARENA.height-margin)};
  if(!deploymentAllowed(g,owner,p.x,p.y)||deploymentWater(p.x,p.y))return null;
  return p;
}



function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y);}
const safeInset=(u=null)=>Math.max(ARENA.cellSize*.5,(u?.radius||0)+ARENA.cellSize*.25);
function clampInsideArena(v,axis,u=null){const m=safeInset(u);return axis==='x'?clamp(v,m,ARENA.width-m):clamp(v,m,ARENA.height-m);}
function random(g){
  let x=g.rng|0; x^=x<<13; x^=x>>>17; x^=x<<5;
  g.rng=x>>>0; return g.rng/4294967296;
}
function shuffled(g,source=DEFAULT_DECK){const a=[...source];for(let i=a.length-1;i>0;i--){const j=Math.floor(random(g)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function validateDeck(value){return normalizeDeck(value,{fallback:false});}
function createMatch({seed=12345,bot=false,difficulty='normal',decks=[DEFAULT_DECK,DEFAULT_DECK],mapTheme=null,botStyle='balanced',botStyles=null,botDeckArchetype='balanced',botDeckArchetypes=null}={}){
  const normalizedSeed=(Number(seed)||1)>>>0;
  const chosenTheme=MAP_THEMES.includes(mapTheme)?mapTheme:MAP_THEMES[normalizedSeed%MAP_THEMES.length];
  const g={physicsVersion:PHYSICS_VERSION,mapTheme:chosenTheme,phase:'countdown',countdown:3,time:0,overtime:false,rng:seed||1,units:[],projectiles:[],zones:[],events:[],nextId:1,step:0,
    winner:null,reason:'',bot,difficulty,botStyle:CPU_STYLE_LABELS[botStyle]?botStyle:'balanced',botStyles:[0,1].map(i=>CPU_STYLE_LABELS[botStyles?.[i]]?botStyles[i]:(CPU_STYLE_LABELS[botStyle]?botStyle:'balanced')),botDeckArchetype,botDeckArchetypes:[0,1].map(i=>botDeckArchetypes?.[i]||botDeckArchetype),botNext:1.5,botPlans:{0:null,1:null},botLastDefense:{0:-99,1:-99},
    players:[{energy:5,hand:[],queue:[],deck:[]},{energy:5,hand:[],queue:[],deck:[]}],towers:[]};
  const safeDecks=[normalizeDeck(decks?.[0]),normalizeDeck(decks?.[1])];
  for(let owner=0;owner<2;owner++){
    const d=shuffled(g,safeDecks[owner]);g.players[owner].deck=[...safeDecks[owner]];g.players[owner].hand=d.slice(0,4);g.players[owner].queue=d.slice(4);
    const layout=owner===0?TOWER_GRID.blue:TOWER_GRID.red;
    const specs=[['left',false],['right',false],['core',true]];
    for(let i=0;i<specs.length;i++){
      const [slot,core]=specs[i],rect=layout[slot],pos=gridRectCenter(...rect),footprintCells=core?ARENA.coreTowerCells:ARENA.sideTowerCells;
      g.towers.push({id:`t${owner}${i}`,kind:core?'core':'tower',slot,owner,x:pos.x,y:pos.y,
      footprintCols:footprintCells,footprintRows:footprintCells,footprintCells:`${footprintCells}x${footprintCells}`,placementFootprint:false,
      hitboxCols:core?2.7:2.1,hitboxRows:3.0,
      hp:core?4560:3200,maxHp:core?4560:3200,radius:core?40:32,rangeCells:core?7:7.5,range:cellsToWorld(core?7:7.5),damage:109,cd:0,
      cooldown:core?0.9:0.8,targetsAir:true,projectile:'tower',hit:0,anim:0,awake:!core});
    }
  }
  return g;
}
function inRiver(x,y){return y>ARENA.riverTop && y<ARENA.riverBottom && !ARENA.bridges.some(b=>Math.abs(x-b)<=ARENA.bridgeHalf);}
function placementStructures(g){return [...g.towers,...g.units.filter(u=>u.building&&u.hp>0)];}
function canPlace(g,owner,id,x,y){
  if(g.phase!=='battle')return 'まだ出撃できません。';
  if(owner!==0 && owner!==1)return '参加者ではありません。';
  if(typeof id!=='string'||!DECK.includes(id))return '不明なカードです。';
  const d=UNITS[id];
  if(!Number.isFinite(x)||!Number.isFinite(y))return '指定位置が正しくありません。';
  if(d.spell==='skeletonrush'){
    const visibleInset=(d.radius||110)*(1-(d.offscreenFraction??.4));
    if(x<visibleInset||x>ARENA.width-visibleInset||y<visibleInset||y>ARENA.height-visibleInset)return '\u30d5\u30a3\u30fc\u30eb\u30c9\u5185\u306b\u7bc4\u56f2\u306e60%\u4ee5\u4e0a\u304c\u6b8b\u308b\u4f4d\u7f6e\u3092\u6307\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002';
  }else {const margin=ARENA.cellSize*.5;if(x<margin||x>ARENA.width-margin||y<margin||y>ARENA.height-margin)return '\u30d5\u30a3\u30fc\u30eb\u30c9\u306e\u5185\u5074\u3092\u6307\u5b9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002';}
  if(!g.players[owner].hand.includes(id))return 'そのカードは手札にありません。';
  if(g.players[owner].energy+0.00001<d.cost)return 'エナジーが足りません。';
  if(d.deploymentZoneOnly){
    if(!deploymentAllowed(g,owner,x,y))return 'このスペルはユニットを召喚できる範囲からだけ発動できます。';
    if(deploymentWater(x,y))return 'このスペルはユニットを召喚できる地面または橋から発動してください。';
  }
  if(d.spell){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
    if(!core)return '本拠地が破壊されているため呪文を使えません。';
    return null;
  }
  if(d.tunnelAnywhere){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
    if(!core)return '本拠地が破壊されているため地下移動できません。';
    if(g.units.filter(u=>u.hp>0).length+1>ARENA.maxUnits)return 'フィールドのユニット上限です。';
    if(!staticFree(g,d,{x,y},1))return '水上や建物の中には出現できません。少し離してください。';
    return null;
  }
  const placementPoint=d.building?snapDeploymentPoint(owner,d,x,y):{x,y};
  if(!deploymentAllowed(g,owner,placementPoint.x,placementPoint.y))return '自分の陣地、または破壊した敵サイドタワー側の前線に配置してください。';
  if(deploymentWater(placementPoint.x,placementPoint.y))return '川の上には配置できません。橋か芝生を指定してください。';
  const deployCount=d.count+(d.summonOnDeploy?(d.summonCount||0):0);
  if(g.units.filter(u=>u.hp>0).length+deployCount>ARENA.maxUnits)return 'フィールドのユニット上限です。';
  const blockers=placementStructures(g),p=d.building?placementPoint:snapDeploymentPoint(owner,d,x,y);
  if(!staticFree(g,d,p,1,blockers))return '建物や岸から少し離して配置してください。';
  if(!spawnPositions(g,owner,d,p.x,p.y,blockers))return '配置する空間がありません。少し離してください。';
  return null;
}
function event(g,type,data){g.events.push({id:g.nextId++,type,life:(type==='death'||type==='elixir-split')?0.9:0.5,...data});}
function spendCard(g,owner,id){
  const p=g.players[owner],d=UNITS[id],index=p.hand.indexOf(id);
  p.energy=Math.max(0,p.energy-d.cost);p.hand[index]=p.queue.shift();p.queue.push(id);
}
function makeUnit(g,owner,type,x,y){
  const d=UNITS[type];
  return {...d,id:`u${g.nextId++}`,type,owner,x,y,hp:d.hp,maxHp:d.hp,cd:0,spawn:0.5,anim:0,hit:0,walk:0,target:null,targetLock:null,firstStrikeTarget:null,firstStrikeReadyAt:0,targetable:true,collisionDisabled:false,deploying:false,deployTotal:0,deployRemaining:0,face:owner===0?-1:1,
    lane:x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],age:0,facing:owner===0?-Math.PI/2:Math.PI/2,moving:false,
    summonNextAt:d.summonInterval?g.time+d.summonInterval:null,summonCastingUntil:0,energyNextAt:null,
    stunUntil:0,sparkCharged:false,sparkChargeStartAt:d.sparkChargeTime?g.time:null,sparkChargeProgress:0,
    shieldHp:d.shieldMax||0,maxShieldHp:d.shieldMax||0,stealthed:false,stealthUntil:0,revived:false,
    iceSpiritState:null,iceSpiritTarget:null,iceSpiritStartedAt:0,iceSpiritProgress:0,iceSpiritStartX:null,iceSpiritStartY:null,iceSpiritEndX:null,iceSpiritEndY:null,
    fireSpiritState:null,fireSpiritTarget:null,fireSpiritStartedAt:0,fireSpiritProgress:0,fireSpiritStartX:null,fireSpiritStartY:null,fireSpiritEndX:null,fireSpiritEndY:null,
    ramChargeTime:0,charged:false,chargeRun:0,axeInFlight:false,
    drillTarget:null,drillLockTime:0,drillStage:0,drillDps:d.drillBaseDps||0,laserDamageElapsed:0,crusherTarget:null,crusherStage:0,
    megaJumpState:null,megaJumpTarget:null,megaJumpWindupUntil:0,megaJumpTargetX:null,megaJumpTargetY:null,megaJumpProgress:0,megaJumpStartedAt:0,megaJumpStartX:null,megaJumpStartY:null,megaJumpEndX:null,megaJumpEndY:null,
    riverJumpMode:d.riverJumper?boarRiverRouteForSpawn(d,owner,x,y):null,riverJumpState:null,riverJumpProgress:0,riverJumpStartedAt:0,riverJumpStartX:null,riverJumpStartY:null,riverJumpEndX:null,riverJumpEndY:null,
    ironSpinUsed:false,ironSpinState:null,ironSpinStartedAt:0,ironSpinProgress:0,ironSpinStartX:null,ironSpinStartY:null,ironSpinEndX:null,ironSpinEndY:null,ironSpinTarget:null,ironSpinHitIds:[],
    hookState:null,hookTarget:null,hookWindupUntil:0,hookReadyAt:0,hookProgress:0,hookStartedAt:0,hookStartX:null,hookStartY:null,hookEndX:null,hookEndY:null,hookTargetX:null,hookTargetY:null,hookAirTarget:null,hookAirAttackUntil:0,hookControlUntil:0,
    ironMarked:false,ironMarkOwner:null,ironMarkDamage:0,ironMarkThreshold:0,ironMarkBurstDamage:0,ironMarkBonus:0,
    eggHatchAt:d.eggUnit?g.time+(d.eggHatchTime||4):null,
    teslaRaised:d.teslaHidden?false:true,summonActive:false};
}
function startDeployment(g,u,cardData){
  const total=summonDelayFor(cardData);
  if(total<=0)return false;
  // Deployment is part of combat now: normal units/buildings can be targeted,
  // damaged, stunned and hit by area effects from the moment placement is confirmed.
  // Mega Knight keeps its special drop protection until landing completes.
  const protectedDrop=!!u.megaKnight;
  u.deploying=true;u.deployTotal=total;u.deployRemaining=total;u.targetable=!protectedDrop;u.collisionDisabled=protectedDrop;u.spawn=0;u.target=null;u.targetLock=null;
  if(u.summonInterval)u.summonNextAt=null;
  if(u.energyPump)u.energyNextAt=null;
  if(u.sparkUnit){u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=null;}
  event(g,'deploy-start',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,card:cardData.id,duration:total,building:!!u.building,protectedDrop});
  if(u.megaKnight)event(g,'mega-drop-zone',{x:u.x,y:u.y,owner:u.owner,radius:u.dropRadius||48,duration:total,life:total});
  return true;
}
function completeDeployment(g,u){
  u.deploying=false;u.deployRemaining=0;u.targetable=true;u.collisionDisabled=false;u.target=null;u.targetLock=null;
  if(u.sparkUnit)u.sparkChargeStartAt=g.time;
  if(u.summonInterval)u.summonNextAt=g.time+u.summonInterval;
  if(u.energyPump&&u.energyInterval)u.energyNextAt=g.time+u.energyInterval;
  if(u.teslaHidden){u.teslaRaised=false;u.targetable=false;u.target=null;u.targetLock=null;event(g,'tesla-hide',{x:u.x,y:u.y,owner:u.owner});}
  if(u.stealthDuration){u.stealthed=true;u.stealthUntil=g.time+u.stealthDuration;event(g,'stealth-start',{x:u.x,y:u.y,owner:u.owner,duration:u.stealthDuration});}
  event(g,'deploy-ready',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,building:!!u.building});
  if(u.megaKnight&&u.dropDamage){megaAreaDamage(g,u,u.x,u.y,u.dropDamage,u.dropRadius||48,'mega-drop-impact',false);u.cd=Math.max(u.cd,u.cooldown||1.6);}
  if(u.summonOnDeploy&&u.summonType&&u.summonCount)summonMinions(g,u,true);
}
function updateDeployment(g,u,dt){
  if(!u.deploying)return false;
  const protectedDrop=!!u.megaKnight;
  // A summoning unit never acts on its own, but normal deployments remain real
  // combat bodies so enemies and spells can interact with them before completion.
  u.moving=false;u.target=null;u.targetLock=null;u.targetable=!protectedDrop;u.collisionDisabled=protectedDrop;
  u.deployRemaining=Math.max(0,(u.deployRemaining||0)-dt);
  if(u.deployRemaining<=1e-8){completeDeployment(g,u);return true;}
  return true;
}
function fireballTravelTime(core,target){return clamp(.45+distance(core,target)/620,.6,2);}
function arrowRainTravelTime(core,target){return clamp(.32+distance(core,target)/500,.55,2.4);}
function burrowTravelTime(d,core,target){return clamp((d.burrowBase??.45)+distance(core,target)/(d.burrowSpeedDivisor||500),d.burrowMin??.7,d.burrowMax??2.2);}
function spellDamageForTarget(source,target){return target?.kind?(source?.towerDamage??source?.buildingDamage??source?.damage??0):(source?.damage??0);}
function rocketTravelTime(core,target,d=UNITS.rocket){return (d.rocketTravelBase??1.212105008362148)+distance(core,target)/(d.rocketTravelSpeed||289.8635557684609);}
function deployRageZone(g,owner,x,y,d=UNITS.rage,source='spell'){
  g.zones??=[];const delay=d.activationDelay||1.5;
  const z={id:`z${g.nextId++}`,owner,kind:'rage',spell:'rage',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,activated:false,activateAt:g.time+delay,
    placementTime:d.placementTime||.5,boostMultiplier:d.boostMultiplier||1.3,damage:d.damage,buildingDamage:d.buildingDamage,source};
  g.zones.push(z);event(g,'rage-deploy',{x,y,owner,radius:d.radius,duration:delay,placementTime:d.placementTime||.5,source});return z;
}
function castSpell(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id],core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
  spendCard(g,owner,id);
  if(d.spell==='lightning'){
    g.zones??=[];
    const delay=d.activationDelay??1,strikeInterval=d.strikeInterval??.2;
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'lightning',spell:'lightning',x,y,radius:d.radius,damage:d.damage,buildingDamage:d.buildingDamage,
      maxTargets:d.maxTargets||4,activateAt:g.time+delay,activated:false,targetIds:[],strikeIndex:0,strikeInterval,nextStrikeAt:null,total:delay,remaining:delay});
    event(g,'lightning-cast',{x,y,owner,radius:d.radius,duration:delay,life:delay,targets:0});
    return {ok:true,spell:true,travelTime:delay,activationDelay:delay,strikeInterval};
  }
  if(d.spell==='skeletonrush'){
    g.zones??=[];const delay=d.activationDelay||1.2,duration=d.zoneDuration||9;
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'skeletonrush',spell:'skeletonrush',x,y,radius:d.radius,remaining:duration,total:duration,activateAt:g.time+delay,expiresAt:g.time+delay+duration,nextSpawnAt:g.time+delay+(d.firstSpawnDelay||3),spawnEvery:d.spawnEvery||.5,spawnType:d.spawnType||'skeleton',activated:false});
    event(g,'skeletonrush-deploy',{x,y,owner,radius:d.radius,duration:delay});
    return {ok:true,spell:true,travelTime:delay};
  }
  if(d.spell==='poison'){
    g.zones??=[];
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'poison',spell:'poison',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,
      tickEvery:d.tickEvery,nextTick:g.time,damage:d.damage,buildingDamage:d.buildingDamage,lingerDuration:d.lingerDuration,lingerDamage:d.lingerDamage});
    event(g,'poison-deploy',{x,y,owner,radius:d.radius});
    return {ok:true,spell:true,travelTime:0};
  }
  if(d.spell==='rage'){
    const z=deployRageZone(g,owner,x,y,d,'spell');const delay=Math.max(0,z.activateAt-g.time);
    return {ok:true,spell:true,travelTime:delay,activationDelay:delay};
  }
  if(d.spell==='cyclone'){
    g.zones??=[];
    g.zones.push({id:`z${g.nextId++}`,owner,kind:'cyclone',spell:'cyclone',x,y,radius:d.radius,remaining:d.zoneDuration,total:d.zoneDuration,pullSpeed:d.pullSpeed||210});
    event(g,'cyclone-deploy',{x,y,owner,radius:d.radius,duration:d.zoneDuration,damage:d.damage,buildingDamage:d.buildingDamage});
    const centre={x,y};
    for(const t of [...alive(g)]){
      if(t.owner===owner||t.hp<=0||distance(centre,t)>d.radius+(t.radius||12)*.35)continue;
      damage(g,t,spellDamageForTarget(d,t),owner,{spell:true,zone:'cyclone'});
    }
    return {ok:true,spell:true,travelTime:0};
  }
  if(d.spell==='zap'){
    event(g,'zap-impact',{x,y,owner,radius:d.radius,damage:d.damage,stunDuration:d.stunDuration});
    const centre={x,y};
    for(const t of alive(g)){
      if(t.owner===owner||t.hp<=0||t.targetable===false||t.burrowState==='burrow'||distance(centre,t)>d.radius+(t.radius||12)*.35)continue;
      damage(g,t,spellDamageForTarget(d,t),owner);
      if(t.hp>0)applyStun(g,t,d.stunDuration,owner);
    }
    return {ok:true,spell:true,travelTime:0};
  }
  if(d.spell==='rollingwood'||d.spell==='rollingbarbarian'){
    const dir=owner===0?-1:1,travelDistance=d.travelDistance||cellsToWorld(d.travelCells||0),edge=ARENA.cellSize*.5;
    const ty=clamp(y+dir*travelDistance,edge,ARENA.height-edge),actualDistance=Math.abs(ty-y),travel=Math.max(.05,actualDistance/Math.max(1,d.rollSpeed||480));
    g.projectiles.push({id:`p${g.nextId++}`,owner,kind:d.spell,spell:d.spell,x,y,sx:x,sy:y,tx:x,ty,
      flightTotal:travel,total:travel,remaining:travel,progress:0,damage:d.damage,buildingDamage:d.buildingDamage,towerDamage:d.towerDamage??d.buildingDamage,
      hitWidth:d.width||cellsToWorld(d.widthCells||0),widthCells:d.widthCells||0,travelCells:d.travelCells||0,knockbackCells:d.knockbackCells||0,hitIds:[],
      spawnType:d.spawnType||null,spawnCount:d.spawnCount||0,targetsAir:false,life:travel+.5});
    event(g,`${d.spell}-cast`,{x,y,tx:x,ty,owner,width:d.width,range:actualDistance,damage:d.damage});
    return {ok:true,spell:true,travelTime:travel,flightTime:travel};
  }
  if(d.spell==='rocket'){
    const travel=rocketTravelTime(core,{x,y},d);
    g.projectiles.push({id:`p${g.nextId++}`,owner,kind:'rocket',spell:'rocket',x:core.x,y:core.y,sx:core.x,sy:core.y,tx:x,ty:y,
      flightTotal:travel,total:travel,remaining:travel,progress:0,launched:true,damage:d.damage,buildingDamage:d.buildingDamage,towerDamage:d.towerDamage??d.buildingDamage,splash:d.radius,targetsAir:true,life:travel+.4});
    event(g,'rocket-launch',{x:core.x,y:core.y,tx:x,ty:y,owner,radius:d.radius,travel});
    return {ok:true,spell:true,travelTime:travel,launchDelay:0,flightTime:travel};
  }
  if(d.spell==='goblinbarrel'){
    const travel=fireballTravelTime(core,{x,y}),launchDelay=d.launchDelay||UNITS.fireball.launchDelay||0;
    g.projectiles.push({id:`p${g.nextId++}`,owner,kind:'goblinbarrel',spell:'goblinbarrel',x:core.x,y:core.y,sx:core.x,sy:core.y,tx:x,ty:y,
      flightTotal:travel,total:travel,remaining:travel,launchDelay,delayRemaining:launchDelay,launched:launchDelay<=0,progress:0,splash:d.radius,spawnType:d.spawnType||'goblin_melee',spawnCount:d.spawnCount||3,targetsAir:false,life:launchDelay+travel+.4});
    event(g,'goblinbarrel-aim',{x,y,owner,radius:d.radius,duration:launchDelay,travel});
    if(launchDelay<=0)event(g,'goblinbarrel-launch',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
    return {ok:true,spell:true,travelTime:launchDelay+travel,launchDelay,flightTime:travel};
  }
  const arrow=d.spell==='arrowrain',travel=arrow?arrowRainTravelTime(core,{x,y}):fireballTravelTime(core,{x,y}),launchDelay=d.launchDelay||0;
  g.projectiles.push({id:`p${g.nextId++}`,owner,kind:arrow?'arrowrain':'fireball',spell:d.spell,x:core.x,y:core.y,sx:core.x,sy:core.y,tx:x,ty:y,
    flightTotal:travel,total:travel,remaining:travel,launchDelay,delayRemaining:launchDelay,launched:launchDelay<=0,progress:0,damage:d.damage,buildingDamage:d.buildingDamage,splash:d.radius,knockbackCells:d.knockbackCells||0,targetsAir:true,life:launchDelay+travel+.3});
  event(g,arrow?'arrowrain-aim':'fireball-aim',{x,y,owner,radius:d.radius,duration:launchDelay,travel});
  if(launchDelay<=0)event(g,arrow?'arrowrain-launch':'fireball-launch',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
  return {ok:true,spell:true,travelTime:launchDelay+travel,launchDelay,flightTime:travel};
}
function deploy(g,owner,id,x,y){
  const err=canPlace(g,owner,id,x,y);if(err)return {ok:false,error:err};
  const d=UNITS[id];if(d.spell)return castSpell(g,owner,id,x,y);
  if(d.tunnelAnywhere){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0),travel=burrowTravelTime(d,core,{x,y});
    spendCard(g,owner,id);
    const u=makeUnit(g,owner,id,core.x,core.y);u.spawn=0;u.targetable=false;u.burrowState='burrow';u.burrowFrom={x:core.x,y:core.y};u.burrowTo={x,y};u.burrowTotal=travel;u.burrowRemaining=travel;u.burrowProgress=0;
    g.units.push(u);event(g,'burrow-start',{x:core.x,y:core.y,tx:x,ty:y,owner,travel});
    return {ok:true,burrow:true,travelTime:travel};
  }
  const placement=snapDeploymentPoint(owner,d,x,y),positions=spawnPositions(g,owner,d,placement.x,placement.y,placementStructures(g));spendCard(g,owner,id);
  for(let i=0;i<d.count;i++){
    const unitType=(Array.isArray(d.spawnTypes)&&d.spawnTypes[i])||d.spawnType||id,u=makeUnit(g,owner,unitType,positions[i].x,positions[i].y);
    startDeployment(g,u,d);g.units.push(u);event(g,'spawn',{x:u.x,y:u.y,owner,card:id});
    if(!u.deploying&&u.summonOnDeploy&&u.summonType&&u.summonCount)summonMinions(g,u,true);
  }
  return {ok:true};
}
function alive(g){return [...g.units,...g.towers].filter(v=>v.hp>0);}
function rageZoneActive(g,z){return z?.kind==='rage'&&z.activated&&z.remaining>1e-8;}
function rageSpeedFactor(g,t){
  if(!t||t.hp<=0)return 1;
  for(const z of g.zones||[])if(rageZoneActive(g,z)&&z.owner===t.owner&&distance(z,t)<=z.radius+(t.radius||12)*.25)return z.boostMultiplier||1.3;
  return 1;
}
function targetable(source,target){return target.owner!==source.owner&&target.hp>0&&target.targetable!==false&&!target.stealthed&&(!target.air||source.targetsAir);}
function areaTargetable(source,target){return target.owner!==source.owner&&target.hp>0&&target.targetable!==false&&target.burrowState!=='burrow'&&(!target.air||source.targetsAir);}
function megaAreaDamage(g,u,x,y,amount,radius,eventType='mega-impact',shieldable=false){
  let hits=0;const centre={x,y};
  for(const v of [...alive(g)]){
    if(v.id===u.id||!areaTargetable(u,v)||distance(centre,v)>radius+(v.radius||12)*.35)continue;
    if(damage(g,v,amount,u.owner,{shieldable,sourceX:x,sourceY:y,megaImpact:true})>0)hits++;
  }
  event(g,eventType,{x,y,owner:u.owner,radius,damage:amount,hits});return hits;
}
function megaJumpReady(u,t){
  if(!u.megaKnight||!t||!targetable(u,t))return false;
  const d=distance(u,t);return d>=(u.jumpMinRange||cellsToWorld(2.5))&&d<=(u.jumpMaxRange||cellsToWorld(5));
}
function megaLeapEndpoint(u,t){
  const dx=u.x-t.x,dy=u.y-t.y,len=Math.hypot(dx,dy)||1,stop=Math.max(1,(u.radius||12)+(t.radius||12)-1);
  return {x:t.x+dx/len*stop,y:t.y+dy/len*stop};
}
function beginMegaJumpWindup(g,u,t){
  u.megaJumpState='windup';u.megaJumpTarget=t.id;u.megaJumpWindupUntil=g.time+(u.jumpWindup||2);u.megaJumpTargetX=t.x;u.megaJumpTargetY=t.y;u.megaJumpProgress=0;u.moving=false;u.target=t.id;
  faceToward(u,t.x,t.y);event(g,'mega-jump-windup',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,radius:u.jumpRadius||48,duration:u.jumpWindup||2,life:u.jumpWindup||2});
}
function beginMegaLeap(g,u,t){
  const end=t?megaLeapEndpoint(u,t):{x:u.megaJumpTargetX??u.x,y:u.megaJumpTargetY??u.y};
  u.megaJumpState='leap';u.megaJumpStartedAt=g.time;u.megaJumpProgress=0;u.megaJumpTarget=t?.id||u.megaJumpTarget;
  u.megaJumpStartX=u.x;u.megaJumpStartY=u.y;u.megaJumpEndX=end.x;u.megaJumpEndY=end.y;u.megaJumpTargetX=end.x;u.megaJumpTargetY=end.y;
  u.collisionDisabled=true;u.moving=true;
  if(t&&targetable(u,t)){u.target=t.id;u.targetLock=t.id;markFirstStrikeComplete(g,u,t);faceToward(u,t.x,t.y);}
  const duration=u.jumpTravelTime||1.5;
  event(g,'mega-jump',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner,duration,life:duration});
}
function finishMegaLeap(g,u,t){
  u.collisionDisabled=false;u.megaJumpState=null;u.megaJumpProgress=1;u.moving=false;
  if(t&&t.hp>0&&targetable(u,t)){u.target=t.id;u.targetLock=t.id;faceToward(u,t.x,t.y);}else{u.target=null;u.targetLock=null;}
  u.cd=Math.max(u.cd,u.cooldown||1.6);megaAreaDamage(g,u,u.x,u.y,u.jumpDamage||Math.round(u.damage*1.5),u.jumpRadius||48,'mega-jump-impact',false);
}
function updateMegaJump(g,u,entities,dt){
  if(!u.megaKnight||!u.megaJumpState)return false;
  if(u.megaJumpState==='windup'){
    let current=entities.find(e=>e.id===u.megaJumpTarget&&targetable(u,e))||null;
    if(!u.targetLock){
      const candidates=entities.filter(e=>e.id!==u.id&&targetable(u,e)&&distance(u,e)<=(u.jumpMaxRange||cellsToWorld(5))).sort((a,b)=>distance(u,a)-distance(u,b)||String(a.id).localeCompare(String(b.id)));
      if(candidates.length&&(!current||distance(u,candidates[0])<distance(u,current)-.001))current=candidates[0];
    }
    if(!current){u.megaJumpState=null;u.megaJumpTarget=null;u.megaJumpWindupUntil=0;u.megaJumpProgress=0;return false;}
    u.megaJumpTarget=current.id;u.megaJumpTargetX=current.x;u.megaJumpTargetY=current.y;u.target=current.id;u.moving=false;faceToward(u,current.x,current.y);
    const total=Math.max(.01,u.jumpWindup||2);u.megaJumpProgress=clamp(1-Math.max(0,u.megaJumpWindupUntil-g.time)/total,0,1);
    if(g.time+1e-8>=u.megaJumpWindupUntil)beginMegaLeap(g,u,current);
    return true;
  }
  if(u.megaJumpState==='leap'){
    const t=entities.find(e=>e.id===u.megaJumpTarget&&e.hp>0)||null;
    const duration=Math.max(.01,u.jumpTravelTime||1.5),raw=clamp((g.time-(u.megaJumpStartedAt??g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
    const sx=Number.isFinite(u.megaJumpStartX)?u.megaJumpStartX:u.x,sy=Number.isFinite(u.megaJumpStartY)?u.megaJumpStartY:u.y;
    const ex=Number.isFinite(u.megaJumpEndX)?u.megaJumpEndX:(u.megaJumpTargetX??u.x),ey=Number.isFinite(u.megaJumpEndY)?u.megaJumpEndY:(u.megaJumpTargetY??u.y);
    u.megaJumpProgress=raw;u.moving=true;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;faceToward(u,ex,ey);
    if(raw>=1-1e-8){u.x=ex;u.y=ey;finishMegaLeap(g,u,t);}
    return true;
  }
  return false;
}
function beginIceSpiritLeap(g,u,t){
  if(!u.iceSpirit||!t||!targetable(u,t))return false;
  commitMobileTarget(u,t);markFirstStrikeComplete(g,u,t);faceToward(u,t.x,t.y);
  u.iceSpiritState='leap';u.iceSpiritTarget=t.id;u.iceSpiritStartedAt=g.time;u.iceSpiritProgress=0;
  u.iceSpiritStartX=u.x;u.iceSpiritStartY=u.y;u.iceSpiritEndX=t.x;u.iceSpiritEndY=t.y;u.collisionDisabled=true;u.moving=true;u.target=t.id;
  const duration=u.iceLeapDuration||.24;event(g,'ice-spirit-leap',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,duration,life:duration});return true;
}
function finishIceSpiritLeap(g,u,entities){
  const radius=u.iceBlastRadius||48,amount=u.damage||110,duration=u.stunDuration||1.1,centre={x:u.x,y:u.y};
  let hits=0;
  for(const v of [...alive(g)]){
    if(v.id===u.id||v.owner===u.owner||v.hp<=0||v.targetable===false||v.burrowState==='burrow')continue;
    if(distance(centre,v)>radius+(v.radius||12)*.35)continue;
    const beforeHp=v.hp,beforeShield=v.shieldHp||0;
    damage(g,v,amount,u.owner,{shieldable:true,sourceX:u.x,sourceY:u.y});
    const hit=v.hp<beforeHp-1e-8||(v.shieldHp||0)<beforeShield-1e-8;
    if(hit){hits++;if(v.hp>0)applyStun(g,v,duration,u.owner);}
  }
  event(g,'ice-spirit-burst',{x:u.x,y:u.y,owner:u.owner,radius,damage:amount,stunDuration:duration,hits});
  u.collisionDisabled=false;u.iceSpiritState=null;u.iceSpiritProgress=1;u.hp=0;handleUnitDeath(g,u);
}
function updateIceSpiritLeap(g,u,entities,dt){
  if(!u.iceSpirit||u.iceSpiritState!=='leap')return false;
  const t=entities.find(e=>e.id===u.iceSpiritTarget&&e.hp>0&&targetable(u,e))||null;
  if(t){u.iceSpiritEndX=t.x;u.iceSpiritEndY=t.y;faceToward(u,t.x,t.y);}
  const duration=Math.max(.05,u.iceLeapDuration||.24),raw=clamp((g.time-(u.iceSpiritStartedAt??g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=Number.isFinite(u.iceSpiritStartX)?u.iceSpiritStartX:u.x,sy=Number.isFinite(u.iceSpiritStartY)?u.iceSpiritStartY:u.y;
  const ex=Number.isFinite(u.iceSpiritEndX)?u.iceSpiritEndX:u.x,ey=Number.isFinite(u.iceSpiritEndY)?u.iceSpiritEndY:u.y;
  u.iceSpiritProgress=raw;u.moving=true;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;
  if(raw>=1-1e-8){u.x=ex;u.y=ey;finishIceSpiritLeap(g,u,entities);}
  return true;
}

function beginFireSpiritLeap(g,u,t){
  if(!u.fireSpirit||!t||!targetable(u,t))return false;
  commitMobileTarget(u,t);markFirstStrikeComplete(g,u,t);faceToward(u,t.x,t.y);
  u.fireSpiritState='leap';u.fireSpiritTarget=t.id;u.fireSpiritStartedAt=g.time;u.fireSpiritProgress=0;
  u.fireSpiritStartX=u.x;u.fireSpiritStartY=u.y;u.fireSpiritEndX=t.x;u.fireSpiritEndY=t.y;u.collisionDisabled=true;u.moving=true;u.target=t.id;
  const duration=u.fireLeapDuration||.24;event(g,'fire-spirit-leap',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,duration,life:duration});return true;
}
function finishFireSpiritLeap(g,u,entities){
  const radius=u.fireBlastRadius||48,amount=u.damage||215,centre={x:u.x,y:u.y};let hits=0;
  for(const v of [...alive(g)]){
    if(v.id===u.id||v.owner===u.owner||v.hp<=0||v.targetable===false||v.burrowState==='burrow')continue;
    if(distance(centre,v)>radius+(v.radius||12)*.35)continue;
    const beforeHp=v.hp,beforeShield=v.shieldHp||0;damage(g,v,amount,u.owner,{shieldable:true,sourceX:u.x,sourceY:u.y});
    if(v.hp<beforeHp-1e-8||(v.shieldHp||0)<beforeShield-1e-8)hits++;
  }
  event(g,'fire-spirit-burst',{x:u.x,y:u.y,owner:u.owner,radius,damage:amount,hits});
  u.collisionDisabled=false;u.fireSpiritState=null;u.fireSpiritProgress=1;u.hp=0;handleUnitDeath(g,u);
}
function updateFireSpiritLeap(g,u,entities,dt){
  if(!u.fireSpirit||u.fireSpiritState!=='leap')return false;
  const t=entities.find(e=>e.id===u.fireSpiritTarget&&e.hp>0&&targetable(u,e))||null;
  if(t){u.fireSpiritEndX=t.x;u.fireSpiritEndY=t.y;faceToward(u,t.x,t.y);}
  const duration=Math.max(.05,u.fireLeapDuration||.24),raw=clamp((g.time-(u.fireSpiritStartedAt??g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=Number.isFinite(u.fireSpiritStartX)?u.fireSpiritStartX:u.x,sy=Number.isFinite(u.fireSpiritStartY)?u.fireSpiritStartY:u.y;
  const ex=Number.isFinite(u.fireSpiritEndX)?u.fireSpiritEndX:u.x,ey=Number.isFinite(u.fireSpiritEndY)?u.fireSpiritEndY:u.y;
  u.fireSpiritProgress=raw;u.moving=true;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;
  if(raw>=1-1e-8){u.x=ex;u.y=ey;finishFireSpiritLeap(g,u,entities);}
  return true;
}
function boarRiverRouteForSpawn(u,owner,x,y){
  if(!u.riverJumper)return null;
  if(ARENA.bridges.some(b=>Math.abs(x-b)<=ARENA.bridgeHalf))return 'bridge';
  const band=u.riverJumpSpawnBand||ARENA.cellSize*2.5;
  const besideRiver=owner===0
    ? y>=ARENA.riverBottom&&y<=ARENA.riverBottom+band
    : y<=ARENA.riverTop&&y>=ARENA.riverTop-band;
  return besideRiver?'river':'bridge';
}
function boarRiverTargetAcross(u,target){
  return !!target&&(u.owner===0?target.y<ARENA.riverTop:target.y>ARENA.riverBottom);
}
function boarRiverApproachPoint(u,target){
  if(!u.riverJumper||u.riverJumpMode!=='river'||u.riverJumpState||!boarRiverTargetAcross(u,target))return null;
  const r=u.radius||18,onOwnSide=u.owner===0?u.y>=ARENA.riverBottom:u.y<=ARENA.riverTop;
  if(!onOwnSide)return null;
  return {x:u.x,y:u.owner===0?ARENA.riverBottom+r+2:ARENA.riverTop-r-2};
}
function boarRiverJumpLanding(g,u,target){
  if(!u.riverJumper||u.riverJumpMode!=='river'||!target)return null;
  const r=u.radius||18,y=u.owner===0?ARENA.riverTop-r-2:ARENA.riverBottom+r+2;
  const aimed=clampInsideArena(u.x,'x',u);
  for(const off of [0,-ARENA.cellSize*.3,ARENA.cellSize*.3,-ARENA.cellSize*.6,ARENA.cellSize*.6,-ARENA.cellSize,ARENA.cellSize]){
    const p={x:clampInsideArena(aimed+off,'x',u),y};
    if(staticFree(g,u,p,0))return p;
  }
  return null;
}
function beginBoarRiverJump(g,u,target){
  if(!u.riverJumper||u.riverJumpMode!=='river'||u.riverJumpState||!target||target.owner===u.owner)return false;
  const trigger=u.riverJumpTrigger||ARENA.cellSize,near=u.owner===0?(u.y>=ARENA.riverBottom&&u.y<=ARENA.riverBottom+trigger):(u.y<=ARENA.riverTop&&u.y>=ARENA.riverTop-trigger);
  if(!near||!boarRiverTargetAcross(u,target))return false;
  const end=boarRiverJumpLanding(g,u,target);if(!end)return false;
  u.riverJumpState='leap';u.riverJumpStartedAt=g.time;u.riverJumpProgress=0;u.riverJumpStartX=u.x;u.riverJumpStartY=u.y;u.riverJumpEndX=end.x;u.riverJumpEndY=end.y;u.collisionDisabled=true;u.moving=true;u._nav=null;
  faceToward(u,end.x,end.y);event(g,'boar-river-jump',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner,duration:u.riverJumpTravelTime||1.2,life:u.riverJumpTravelTime||1.2});return true;
}
function updateBoarRiverJump(g,u,dt){
  if(!u.riverJumper||u.riverJumpState!=='leap')return false;
  const duration=Math.max(.1,u.riverJumpTravelTime||1.2),raw=clamp((g.time-(u.riverJumpStartedAt||g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=u.riverJumpStartX??u.x,sy=u.riverJumpStartY??u.y,ex=u.riverJumpEndX??u.x,ey=u.riverJumpEndY??u.y;
  u.riverJumpProgress=raw;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;u.moving=true;faceToward(u,ex,ey);
  if(raw>=1-1e-8){
    u.x=ex;u.y=ey;u.riverJumpState=null;u.riverJumpProgress=1;u.collisionDisabled=false;u.moving=false;u._nav=null;
    const travelled=Math.hypot(ex-sx,ey-sy);u.walk+=(travelled/Math.max(1,u.speed))*7;
    if(u.chargeDistance){u.chargeRun=(u.chargeRun||0)+travelled;if(!u.charged&&u.chargeRun>=u.chargeDistance){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner});}}
    event(g,'boar-river-land',{x:u.x,y:u.y,owner:u.owner});
  }
  return true;
}

function pointSegmentDistance(px,py,ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;if(len2<1e-8)return Math.hypot(px-ax,py-ay);
  const t=clamp(((px-ax)*dx+(py-ay)*dy)/len2,0,1),x=ax+dx*t,y=ay+dy*t;return Math.hypot(px-x,py-y);
}
function applyIronMark(g,t,source){
  if(!t||t.hp<=0||t.kind||t.building||t.targetable===false||!source?.ironMark)return false;
  const fresh=!t.ironMarked||t.ironMarkOwner!==source.owner;
  t.ironMarked=true;t.ironMarkOwner=source.owner;t.ironMarkThreshold=source.markThreshold||500;t.ironMarkBurstDamage=source.markBurstDamage||300;t.ironMarkBonus=source.markDamageBonus??.20;
  if(fresh){t.ironMarkDamage=0;event(g,'iron-mark',{x:t.x,y:t.y,owner:source.owner,targetOwner:t.owner});}
  return true;
}
function ironSpinCandidate(g,u,entities){
  if(!u.ironSpinOnce||u.ironSpinUsed||u.ironSpinState)return null;
  return entities.filter(t=>t.id!==u.id&&t.owner!==u.owner&&t.hp>0&&!t.kind&&!t.building&&!t.air&&t.targetable!==false&&!t.stealthed&&t.burrowState!=='burrow'&&distance(u,t)<=u.spinTriggerRange+(t.radius||12)*.25)
    .sort((a,b)=>distance(u,a)-distance(u,b)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function beginIronSpin(g,u,t){
  const dx=t.x-u.x,dy=t.y-u.y,len=Math.hypot(dx,dy)||1,desired=u.spinDistance||cellsToWorld(3.5);
  let end=null;
  for(const d of [desired,desired*.85,desired*.70]){
    const p={x:clampInsideArena(u.x+dx/len*d,'x',u),y:clampInsideArena(u.y+dy/len*d,'y',u)};
    if(staticLineFree(g,u,u,p,1)){end=p;break;}
  }
  if(!end)return false;
  u.ironSpinUsed=true;u.ironSpinState='rush';u.ironSpinStartedAt=g.time;u.ironSpinProgress=0;u.ironSpinStartX=u.x;u.ironSpinStartY=u.y;u.ironSpinEndX=end.x;u.ironSpinEndY=end.y;u.ironSpinTarget=t.id;u.ironSpinHitIds=[];u.collisionDisabled=true;u.target=null;u.targetLock=null;u.moving=true;faceToward(u,t.x,t.y);
  event(g,'iron-spin',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner,duration:u.spinDuration||.4,life:u.spinDuration||.4});return true;
}
function finishIronSpin(u){u.ironSpinState=null;u.ironSpinProgress=1;u.collisionDisabled=false;u.moving=false;u.target=null;u.targetLock=null;u.cd=Math.max(u.cd,.35);}
function updateIronSpin(g,u,entities,dt){
  if(!u.ironSpinState)return false;
  const duration=Math.max(.05,u.spinDuration||.4),raw=clamp((g.time-(u.ironSpinStartedAt||g.time))/duration,0,1),moveP=raw*raw*(3-2*raw);
  const sx=u.ironSpinStartX??u.x,sy=u.ironSpinStartY??u.y,ex=u.ironSpinEndX??u.x,ey=u.ironSpinEndY??u.y,px=u.x,py=u.y;
  u.ironSpinProgress=raw;u.x=sx+(ex-sx)*moveP;u.y=sy+(ey-sy)*moveP;u.moving=true;faceToward(u,ex,ey);
  const hit=new Set(u.ironSpinHitIds||[]),radius=u.spinHitRadius||22;
  for(const v of entities){
    if(hit.has(v.id)||v.id===u.id||v.owner===u.owner||v.hp<=0||v.kind||v.building||v.air||v.targetable===false||v.burrowState==='burrow')continue;
    if(pointSegmentDistance(v.x,v.y,px,py,u.x,u.y)>radius+(v.radius||12)*.5)continue;
    hit.add(v.id);damage(g,v,u.spinDamage||180,u.owner,{shieldable:true,sourceX:px,sourceY:py,ironSpin:true});
    if(v.hp>0){applyIronMark(g,v,u);applySlow(g,v,{owner:u.owner,slowDuration:u.spinSlowDuration||2.5,slowMove:u.spinSlowMove||.7,slowAttack:1});}
  }
  u.ironSpinHitIds=[...hit];if(raw>=1-1e-8){u.x=ex;u.y=ey;finishIronSpin(u);}return true;
}
function trackerHookValid(u,t){return !!t&&t.id!==u.id&&t.owner!==u.owner&&t.hp>0&&t.targetable!==false&&!t.stealthed&&t.burrowState!=='burrow';}
function trackerHookCandidate(g,u,entities){
  if(!u.tracker||u.hookState||g.time+1e-8<(u.hookReadyAt||0))return null;
  const valid=entities.filter(t=>trackerHookValid(u,t)&&distance(u,t)<=u.hookRange+(t.radius||12)*.25&&((t.air)||(distance(u,t)>=(u.hookMinRange||55))));
  const locked=u.targetLock&&valid.find(t=>t.id===u.targetLock);if(locked)return locked;
  return valid.sort((a,b)=>distance(u,a)-distance(u,b)||String(a.id).localeCompare(String(b.id)))[0]||null;
}
function beginTrackerHook(g,u,t){
  u.hookState='windup';u.hookTarget=t.id;u.hookWindupUntil=g.time+(u.hookWindup||.6);u.hookProgress=0;u.hookTargetX=t.x;u.hookTargetY=t.y;u.moving=false;u.target=t.id;faceToward(u,t.x,t.y);
  event(g,'tracker-hook-windup',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,duration:u.hookWindup||.6,life:u.hookWindup||.6});
}
function startTrackerPull(g,u,t){
  const duration=u.hookPullDuration||.45;u.hookStartedAt=g.time;u.hookProgress=0;u.hookReadyAt=g.time+(u.hookCooldown||4);u.hookTargetX=t.x;u.hookTargetY=t.y;
  const dx=t.x-u.x,dy=t.y-u.y,len=Math.hypot(dx,dy)||1,stop=Math.max(1,(u.radius||12)+(t.radius||12)-2);
  if(t.kind||t.building){
    u.hookState='pull-self';u.hookStartX=u.x;u.hookStartY=u.y;u.hookEndX=t.x-dx/len*stop;u.hookEndY=t.y-dy/len*stop;u.collisionDisabled=true;
  }else{
    u.hookState='pull-target';u.hookStartX=t.x;u.hookStartY=t.y;u.hookEndX=u.x+dx/len*stop;u.hookEndY=u.y+dy/len*stop;t.hookControlUntil=g.time+duration+.05;t.target=null;t.targetLock=null;t.moving=false;
  }
  event(g,'tracker-hook',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,mode:(t.kind||t.building)?'self':t.air?'air':'ground',duration,life:duration});
}
function cancelTrackerHook(g,u){
  if(!u.tracker)return;u.hookState=null;u.hookTarget=null;u.hookProgress=0;u.collisionDisabled=false;
}
function finishTrackerPull(g,u,t){
  const wasAir=!!t?.air;u.hookState=null;u.hookProgress=1;u.collisionDisabled=false;u.moving=false;
  if(t&&t.hp>0){u.target=t.id;u.targetLock=t.id;markFirstStrikeComplete(g,u,t);if(wasAir){u.hookAirTarget=t.id;u.hookAirAttackUntil=g.time+(u.hookAirAttackDuration||2);event(g,'tracker-air-window',{x:u.x,y:u.y,owner:u.owner,duration:u.hookAirAttackDuration||2,life:u.hookAirAttackDuration||2});}}
}
function updateTrackerHook(g,u,entities,dt){
  if(!u.tracker||!u.hookState)return false;let t=entities.find(e=>e.id===u.hookTarget&&e.hp>0)||null;
  if(u.hookState==='windup'){
    if(!trackerHookValid(u,t)){cancelTrackerHook(g,u);return false;}u.moving=false;u.hookTargetX=t.x;u.hookTargetY=t.y;faceToward(u,t.x,t.y);u.hookProgress=clamp(1-Math.max(0,u.hookWindupUntil-g.time)/Math.max(.05,u.hookWindup||.6),0,1);
    if(g.time+1e-8>=u.hookWindupUntil)startTrackerPull(g,u,t);return true;
  }
  const duration=Math.max(.05,u.hookPullDuration||.45),raw=clamp((g.time-(u.hookStartedAt||g.time))/duration,0,1),p=raw*raw*(3-2*raw);u.hookProgress=raw;
  if(u.hookState==='pull-self'){
    u.x=(u.hookStartX??u.x)+((u.hookEndX??u.x)-(u.hookStartX??u.x))*p;u.y=(u.hookStartY??u.y)+((u.hookEndY??u.y)-(u.hookStartY??u.y))*p;u.moving=true;if(t)faceToward(u,t.x,t.y);
  }else if(u.hookState==='pull-target'){
    if(!t){cancelTrackerHook(g,u);return false;}t.x=(u.hookStartX??t.x)+((u.hookEndX??t.x)-(u.hookStartX??t.x))*p;t.y=(u.hookStartY??t.y)+((u.hookEndY??t.y)-(u.hookStartY??t.y))*p;t.hookControlUntil=Math.max(t.hookControlUntil||0,g.time+.12);t.moving=false;u.moving=false;faceToward(u,t.x,t.y);
  }
  if(raw>=1-1e-8){if(u.hookState==='pull-self'){u.x=u.hookEndX;u.y=u.hookEndY;}else if(t){t.x=u.hookEndX;t.y=u.hookEndY;t.hookControlUntil=g.time;}finishTrackerPull(g,u,t);}return true;
}
function structureFootprintRect(t){
  if(!(t?.kind||t?.building))return null;
  const fallbackCols=Math.max(.5,Math.min(t.footprintCols||ARENA.defaultBuildingCells,((t.radius||20)*2)/ARENA.cellSize));
  const fallbackRows=Math.max(.5,Math.min(t.footprintRows||ARENA.defaultBuildingCells,((t.radius||20)*2)/ARENA.cellSize));
  const cols=t.hitboxCols||fallbackCols,rows=t.hitboxRows||fallbackRows;
  const hw=cols*ARENA.cellSize/2,hh=rows*ARENA.cellSize/2;
  return {l:t.x-hw,r:t.x+hw,t:t.y-hh,b:t.y+hh,hw,hh};
}
function targetEdgePoint(source,target){
  const rect=structureFootprintRect(target);
  if(!rect)return {x:target.x,y:target.y};
  return {x:clamp(source.x,rect.l,rect.r),y:clamp(source.y,rect.t,rect.b)};
}
function targetGap(source,target){
  const sourceRect=source?.kind?structureFootprintRect(source):null,targetRect=structureFootprintRect(target);
  // Air Balloon is an overhead bomber: its attack distance is measured to the structure centre, not its hitbox edge.
  if(source?.overheadAttack&&targetRect)return distance(source,target);
  if(sourceRect&&targetRect){
    const dx=Math.max(targetRect.l-sourceRect.r,sourceRect.l-targetRect.r,0),dy=Math.max(targetRect.t-sourceRect.b,sourceRect.t-targetRect.b,0);
    return Math.hypot(dx,dy);
  }
  if(targetRect){const p=targetEdgePoint(source,target);return distance(source,p);}
  if(sourceRect){
    const px=clamp(target.x,sourceRect.l,sourceRect.r),py=clamp(target.y,sourceRect.t,sourceRect.b);
    return distance(target,{x:px,y:py});
  }
  return Math.max(0,distance(source,target)-(target?.radius||0));
}
function lockedStructureTarget(u,entities){
  if(!(u.kind||u.building)||!u.target)return null;
  const t=entities.find(e=>e.id===u.target);
  if(!t||!targetable(u,t))return null;
  return targetGap(u,t)<=u.range?t:null;
}
function nearestStructureTarget(u,entities){
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    const d=targetGap(u,t);
    if(d<=u.range&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function preferredTower(g,u){
  const enemy=1-u.owner;
  const out=g.towers.find(t=>t.owner===enemy&&t.kind==='tower'&&t.x===u.lane&&t.hp>0);
  return out||g.towers.find(t=>t.owner===enemy&&t.kind==='core'&&t.hp>0);
}
function mobileVisionRange(u){
  return visionRangeFor(u);
}
function nearestMobileCombatTarget(u,entities){
  const sight=mobileVisionRange(u),explicit=Number.isFinite(u.aggroRange);
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!targetable(u,t))continue;
    // Size vision is centre-to-centre. Specialist sight keeps its tuned contract; Princess uses exactly the same edge-gap as her attack range.
    const raw=distance(u,t),d=u.visionMatchesRange?targetGap(u,t):(explicit?Math.max(0,raw-(t.radius||0)-(u.range||0)):raw);
    if(d<=sight&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function megaJumpCandidate(u,entities){
  if(!u.megaKnight||u.targetLock)return null;
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(t.id===u.id||!megaJumpReady(u,t))continue;
    const d=distance(u,t);
    if(d<bestD){best=t;bestD=d;}
  }
  return best;
}
function nearbyDefensiveBuilding(u,entities){
  const pull=u.buildingPullRange??cellsToWorld(4.5);
  let best=null,bestD=Infinity;
  for(const t of entities){
    if(!t.building||!targetable(u,t))continue;
    const d=targetGap(u,t);
    if(d<=pull&&d<bestD){best=t;bestD=d;}
  }
  return best;
}
function buildingOnlyTarget(g,u,entities){
  // Player-placed defensive buildings may still pull a siege unit when they are genuinely nearby.
  const defence=nearbyDefensiveBuilding(u,entities);if(defence)return defence;
  const enemy=1-u.owner;
  // Otherwise preserve the lane chosen at deployment. Never cross the arena just because the opposite tower survives.
  const laneTower=g.towers.find(t=>t.owner===enemy&&t.kind==='tower'&&t.x===u.lane&&t.hp>0);
  if(laneTower)return laneTower;
  return g.towers.find(t=>t.owner===enemy&&t.kind==='core'&&t.hp>0)||null;
}
function resetFirstStrike(u){u.firstStrikeTarget=null;u.firstStrikeReadyAt=0;}
function markFirstStrikeComplete(g,u,t){
  if(!u.kind&&t){u.firstStrikeTarget=t.id;u.firstStrikeReadyAt=g.time;}
}
function firstStrikeReady(g,u,t){
  if(u.kind)return true; // Arena towers keep their existing response timing.
  const delay=Number.isFinite(u.firstStrikeDelay)?Math.max(0,u.firstStrikeDelay):Math.max(0,ARENA.firstStrikeDelay||0);
  if(delay<=0)return true;
  if(u.firstStrikeTarget!==t.id){u.firstStrikeTarget=t.id;u.firstStrikeReadyAt=g.time+delay;return false;}
  return g.time+1e-8>=u.firstStrikeReadyAt;
}
function commitMobileTarget(u,t){
  if(!u.kind&&!u.building&&!u.buildingOnly&&t&&targetable(u,t))u.targetLock=t.id;
}
function getTarget(g,u,entities){
  if(u.tracker&&u.hookAirTarget){
    const air=entities.find(t=>t.id===u.hookAirTarget&&t.hp>0&&t.owner!==u.owner&&t.air&&t.targetable!==false&&!t.stealthed&&t.burrowState!=='burrow');
    if((u.hookAirAttackUntil||0)>g.time&&air)return air;
    if(u.targetLock===u.hookAirTarget)u.targetLock=null;u.hookAirTarget=null;u.hookAirAttackUntil=0;
  }
  // Defensive structures keep the existing v13 contract: lock while the target remains valid and in range.
  // A closer enemy entering range does not steal aggro mid-lock.
  if(u.kind||u.building){
    const locked=lockedStructureTarget(u,entities);
    if(locked)return locked;
    return nearestStructureTarget(u,entities);
  }
  // Siege units keep their deployment lane instead of crossing to the opposite side tower.
  // Nearby player-placed defence buildings can still pull them off the route.
  if(u.buildingOnly){
    u.targetLock=null;
    return buildingOnlyTarget(g,u,entities);
  }
  // Ordinary mobile units use size-based vision before engagement.
  // Small / medium / large bodies see progressively farther, so a large unit can be lured by a smaller one that has not noticed it.
  // Before the first attack, leaving vision immediately releases pursuit and the unit resumes its tower route.
  // After an attack commits the lock, leaving vision no longer breaks pursuit.
  if(u.targetLock){
    const locked=entities.find(t=>t.id===u.targetLock);
    if(locked&&targetable(u,locked))return locked;
    u.targetLock=null;
  }
  const best=nearestMobileCombatTarget(u,entities);
  if(best)return best;
  // Special ability acquisition is deliberately separate from ordinary vision.
  // Mega Knight jump, Tracker hook and other ability-specific ranges do not widen everyone else's sight.
  const jumpTarget=megaJumpCandidate(u,entities);if(jumpTarget)return jumpTarget;
  // A preferred tower is only a navigation objective while it is outside aggro range.
  // It becomes a real hard lock only after the unit actually attacks it.
  return preferredTower(g,u);
}
function dashEndpoint(u,t){
  const edge=targetEdgePoint(u,t),dx=u.x-edge.x,dy=u.y-edge.y,len=Math.hypot(dx,dy)||1;
  const stop=Math.max(1,u.range-1);
  return {x:edge.x+dx/len*stop,y:edge.y+dy/len*stop};
}
function shadowRushTargetReady(g,u,t){
  if(!t||!targetable(u,t))return false;
  const gap=Math.max(0,targetGap(u,t)-u.range);
  if(gap<(u.dashMinRange||0)||gap>(u.dashAggroRange??u.dashMaxRange??Infinity))return false;
  const end=dashEndpoint(u,t);
  return staticLineFree(g,u,u,end,1);
}
function canShadowRush(g,u,t){
  if(!u.dashWindup||g.time<(u.dashReadyAt||0)||u.dashState)return false;
  return shadowRushTargetReady(g,u,t);
}
function beginShadowWindup(g,u,t){
  u.dashState='windup';u.dashTarget=t.id;u.dashWindupUntil=g.time+u.dashWindup;u.moving=false;
  faceToward(u,t.x,t.y);event(g,'shadow-windup',{x:u.x,y:u.y,owner:u.owner});
}
function beginShadowRush(g,u,t){
  const end=dashEndpoint(u,t);
  if(!staticLineFree(g,u,u,end,1)){u.dashState=null;u.dashTarget=null;return false;}
  // The rush itself is the attack commitment, so the target becomes locked here, not during windup.
  commitMobileTarget(u,t);markFirstStrikeComplete(g,u,t);
  u.dashState='rush';u.dashEnd=end;u.invulnerableUntil=g.time+Math.max(.12,distance(u,end)/(u.dashSpeed||650)+.12);
  faceToward(u,t.x,t.y);event(g,'shadow-rush',{x:u.x,y:u.y,tx:end.x,ty:end.y,owner:u.owner});return true;
}
function finishShadowRush(g,u,t){
  u.dashState=null;u.invulnerableUntil=0;u.dashReadyAt=g.time+(u.dashCooldown||4);u.dashTarget=null;u.dashEnd=null;
  u.cd=Math.max(u.cd,u.cooldown);u.anim=.35;
  if(t&&t.hp>0&&targetable(u,t)&&targetGap(u,t)<=u.range+ARENA.cellSize*.35){
    const amount=Number.isFinite(u.dashDamage)?u.dashDamage:Math.round(u.damage*(u.dashMultiplier||2));damage(g,t,amount,u.owner);
    event(g,'shadow-hit',{x:t.x,y:t.y,owner:u.owner,amount});
  }
}
function updateShadowRush(g,u,entities,dt){
  if(!u.dashState)return false;
  let t=entities.find(e=>e.id===u.dashTarget&&e.hp>0);
  if(u.dashState==='windup'){
    // Windup is still pre-attack: keep following the currently nearest rush-valid target.
    // This prevents a fast enemy from dragging Nightshade forever before the rush actually starts.
    const nearest=nearestMobileCombatTarget(u,entities);
    if(nearest&&shadowRushTargetReady(g,u,nearest)){
      t=nearest;u.dashTarget=t.id;u.target=t.id;
    }else if(!t||!shadowRushTargetReady(g,u,t)){
      u.dashState=null;u.dashTarget=null;u.dashReadyAt=g.time+.35;return true;
    }
    u.moving=false;faceToward(u,t.x,t.y);
    if(g.time+1e-8>=u.dashWindupUntil){
      if(!canRushAfterWindup(g,u,t)){u.dashState=null;u.dashTarget=null;u.dashReadyAt=g.time+.35;}
      else beginShadowRush(g,u,t);
    }
    return true;
  }
  if(u.dashState==='rush'){
    if(!t){finishShadowRush(g,u,null);return true;}
    const end=dashEndpoint(u,t),dx=end.x-u.x,dy=end.y-u.y,len=Math.hypot(dx,dy),step=Math.min((u.dashSpeed||650)*dt,len);
    if(len>.001){u.x+=dx/len*step;u.y+=dy/len*step;faceToward(u,t.x,t.y);u.walk+=step/Math.max(1,u.speed)*7;u.moving=true;}
    if(len<=step+.5||g.time+dt>=(u.invulnerableUntil||0)){u.x=end.x;u.y=end.y;finishShadowRush(g,u,t);}
    return true;
  }
  return false;
}
function updateBurrow(g,u,dt){
  if(u.burrowState!=='burrow')return false;
  u.moving=false;u.target=null;u.targetLock=null;u.targetable=false;u.burrowRemaining=Math.max(0,(u.burrowRemaining||0)-dt);
  const total=Math.max(.001,u.burrowTotal||1),progress=clamp(1-u.burrowRemaining/total,0,1);u.burrowProgress=progress;
  const a=u.burrowFrom||u,b=u.burrowTo||u;u.x=a.x+(b.x-a.x)*progress;u.y=a.y+(b.y-a.y)*progress;
  if(u.burrowRemaining<=1e-8){u.x=b.x;u.y=b.y;u.burrowState=null;u.targetable=true;u.spawn=.25;event(g,'burrow-arrive',{x:u.x,y:u.y,owner:u.owner});}
  return true;
}
function canRushAfterWindup(g,u,t){
  const gap=Math.max(0,targetGap(u,t)-u.range);
  if(gap>(u.dashMaxRange||Infinity)+ARENA.cellSize)return false;
  const end=dashEndpoint(u,t);return staticLineFree(g,u,u,end,1);
}
function buildingLaneCoreWaypoint(g,u,t){
  if(!u.buildingOnly||!t||t.kind!=='core')return null;
  const enemy=1-u.owner,side=g.towers.find(v=>v.owner===enemy&&v.kind==='tower'&&v.x===u.lane);
  if(!side||side.hp>0)return null;
  const forward=u.owner===0?-1:1,turnY=side.y+forward*ARENA.cellSize*1.5;
  const beforeTurn=forward<0?u.y>turnY:u.y<turnY;
  return beforeTurn?{id:`lane-core-${enemy}-${u.lane}`,x:u.lane,y:turnY,radius:1}:null;
}
function move(g,u,t,dt){
  if(!u.speed)return;
  const lanePoint=buildingLaneCoreWaypoint(g,u,t),edge=(t.kind||t.building)&&!u.overheadAttack?targetEdgePoint(u,t):null;
  const navTarget=edge?{id:`edge-${t.id}`,x:edge.x,y:edge.y,radius:0}:t;
  const navReach=u.overheadAttack?u.range:(edge?u.range:u.range+(t.radius||0));
  const dest=boarRiverApproachPoint(u,t)||(lanePoint?navigationWaypoint(g,u,lanePoint,2):navigationWaypoint(g,u,navTarget,navReach));
  const start={x:u.x,y:u.y};
  const frostFactor=(u.slowUntil||0)>g.time?(u.slowMoveFactor||1):1;
  const mudFactor=(u.mudUntil||0)>g.time?(u.mudSlowFactor||1):1;
  const ramSpeedFactor=u.siegeRam&&u.charged?(u.ramChargeSpeedMultiplier||1.35):1;
  const mountedSpeedFactor=u.mountedCharge&&u.charged?(u.chargeSpeedMultiplier||1.25):1;
  const rageFactor=rageSpeedFactor(g,u);
  const moved=moveBody(g,u,dest,dt*frostFactor*mudFactor*ramSpeedFactor*mountedSpeedFactor*rageFactor);
  if(moved>.025){
    faceToward(u,u.x+(u.x-start.x),u.y+(u.y-start.y));u.walk+=moved/Math.max(1,u.speed)*7;u.moving=true;
    if(u.siegeRam){
      u.ramChargeTime=(u.ramChargeTime||0)+dt;
      if(!u.charged&&u.ramChargeTime+1e-8>=(u.ramChargeAfter||2)){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner,kind:'siege-ram'});}
    }else if(u.mountedCharge){
      if(!u.charged){
        u.chargeRun=(u.chargeRun||0)+moved;
        if(u.chargeRun+1e-8>=u.chargeDistance){u.chargeRun=u.chargeDistance;u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner,kind:u.type,distance:u.chargeDistance});}
      }
    }else if(u.chargeDistance&&u.buildingOnly){
      u.chargeRun=(u.chargeRun||0)+moved;
      if(!u.charged&&u.chargeRun>=u.chargeDistance){u.charged=true;event(g,'charge',{x:u.x,y:u.y,owner:u.owner});}
    }
  }else if(u.siegeRam&&!u.charged){
    u.ramChargeTime=0;
  }else if(u.mountedCharge&&!u.charged){
    resetMountedCharge(u);
  }else if(u.chargeDistance&&!u.mountedCharge){
    u.chargeRun=Math.max(0,(u.chargeRun||0)-dt*90);
    if(u.chargeRun<u.chargeDistance*.55)u.charged=false;
  }
}
function wakeCore(g,owner,reason='wake'){
  const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
  if(!core||core.awake)return false;
  core.awake=true;event(g,'core-awake',{x:core.x,y:core.y,owner,reason});return true;
}
function refreshCoreWake(g){
  for(const owner of [0,1]){
    const core=g.towers.find(t=>t.owner===owner&&t.kind==='core'&&t.hp>0);
    if(!core||core.awake)continue;
    if(core.hp<core.maxHp||g.towers.some(t=>t.owner===owner&&t.kind==='tower'&&t.hp<=0))wakeCore(g,owner,core.hp<core.maxHp?'core-hit':'side-down');
  }
}
function summonMinions(g,parent,initial=false){
  const d=UNITS[parent.summonType];if(!d||!parent.summonCount)return 0;
  const available=Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length),count=Math.min(parent.summonCount,available);if(!count)return 0;
  const f=parent.owner===0?1:-1;
  const cs=ARENA.cellSize,buildingClear=parent.building?((parent.hitboxRows||Math.min(parent.footprintRows||ARENA.defaultBuildingCells,2))*cs/2+(d.radius||10)+cs*.25):0;
  const forward=buildingClear||cs*.30;
  const base=count===2?[[-cs*.55,-forward],[cs*.55,-forward]]:count===3?[[0,-Math.max(cs*.75,forward)],[-cs*.60,Math.max(cs*.30,buildingClear?forward*.20:cs*.30)],[cs*.60,Math.max(cs*.30,buildingClear?forward*.20:cs*.30)]]:Array.from({length:count},(_,i)=>{const a=-Math.PI/2+i*Math.PI*2/count;const r=Math.max(cs*.70,buildingClear);return [Math.cos(a)*r,Math.sin(a)*r];});
  const candidates=[];
  for(const [ox,oy] of base)candidates.push([ox,oy]);
  for(const r of [ARENA.cellSize,ARENA.cellSize*1.3,ARENA.cellSize*1.7])for(let i=0;i<12;i++){const a=i*Math.PI*2/12+(parent.owner===1?Math.PI:0);candidates.push([Math.cos(a)*r,Math.sin(a)*r]);}
  let made=0;
  for(const [ox0,oy0] of candidates){
    if(made>=count)break;const ox=ox0*f,oy=oy0*f,p={x:clampInsideArena(parent.x+ox,'x',d),y:clampInsideArena(parent.y+oy,'y',d)};
    if(!staticFree(g,d,p,0))continue;
    if(g.units.some(u=>u.hp>0&&!!u.air===!!d.air&&distance(p,u)<d.radius+(u.radius||12)*.80))continue;
    const u=makeUnit(g,parent.owner,d.id,p.x,p.y);u.spawn=.3;u.lane=parent.lane;u.summonedBy=parent.id;g.units.push(u);event(g,'summon-spawn',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id,initial});made++;
  }
  return made;
}
function summonerTriggerEnemy(g,u){
  const range=Number.isFinite(u.summonTriggerRange)?u.summonTriggerRange:u.range;
  if(!Number.isFinite(range)||range<=0)return false;
  for(const t of alive(g)){
    if(t.id===u.id||!targetable(u,t))continue;
    if(u.summonTriggerUnitsOnly&&(t.kind||t.building))continue;
    if(targetGap(u,t)<=range)return true;
  }
  return false;
}
function updateSummoner(g,u,dt=0){
  if(u.summonWhileEnemyInRange){
    const wasActive=!!u.summonActive,active=summonerTriggerEnemy(g,u);u.summonActive=active;
    if(!active){u.summonNextAt=null;u.summonCastingUntil=0;return false;}
    if(!wasActive&&u.summonOnTriggerEnter&&u.summonType&&u.summonCount){
      summonMinions(g,u,false);u.summonNextAt=g.time+u.summonInterval;
      event(g,'summon-trigger-enter',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,minion:u.summonType,count:u.summonCount});
    }else if(!Number.isFinite(u.summonNextAt))u.summonNextAt=g.time+u.summonInterval;
  }
  const rage=rageSpeedFactor(g,u);if(rage>1&&dt>0&&Number.isFinite(u.summonNextAt))u.summonNextAt-=dt*(rage-1);if(rage>1&&dt>0&&(u.summonCastingUntil||0)>g.time)u.summonCastingUntil-=dt*(rage-1);
  if(!u.summonType||!u.summonInterval||!Number.isFinite(u.summonNextAt)||u.hp<=0)return false;
  if((u.summonCastingUntil||0)>g.time+1e-8)return true;
  if(u.summonCastingUntil&&g.time+1e-8>=u.summonCastingUntil){
    summonMinions(g,u,false);u.summonCastingUntil=0;
    do{u.summonNextAt+=u.summonInterval;}while(u.summonNextAt<=g.time+1e-8);
    return false;
  }
  if(g.time+1e-8<u.summonNextAt)return false;
  if((u.summonWindup||0)>0){
    u.summonCastingUntil=g.time+u.summonWindup;u.target=null;u.targetLock=null;u.cd=Math.max(u.cd,u.summonWindup);
    event(g,'summon-channel',{x:u.x,y:u.y,owner:u.owner,unitType:u.type,duration:u.summonWindup});
    return true;
  }
  summonMinions(g,u,false);
  do{u.summonNextAt+=u.summonInterval;}while(u.summonNextAt<=g.time+1e-8);
  return false;
}

function summonMiniGolems(g,parent){
  const d=UNITS[parent.splitType||'mini_golem'];if(!d)return;
  const count=Math.min(parent.splitCount||2,Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length));
  const cs=ARENA.cellSize,f=parent.owner===0?1:-1,candidates=[[-cs*.55,cs*.1],[cs*.55,cs*.1],[-cs*.45,cs*.5],[cs*.45,cs*.5],[-cs*.8,-cs*.2],[cs*.8,-cs*.2],[0,cs*.7],[0,-cs*.7]];
  let made=0;
  for(const [ox,oy] of candidates){
    if(made>=count)break;const p={x:clampInsideArena(parent.x+ox,'x',d),y:clampInsideArena(parent.y+oy*f,'y',d)};
    if(!staticFree(g,d,p,0))continue;
    if(g.units.some(u=>u.hp>0&&!!u.air===!!d.air&&distance(p,u)<d.radius+(u.radius||12)*.72))continue;
    const u=makeUnit(g,parent.owner,d.id,p.x,p.y);u.spawn=.35;u.lane=parent.lane;g.units.push(u);event(g,'split-spawn',{x:u.x,y:u.y,owner:u.owner,minion:d.id});made++;
  }
  // Crowded bridge/tower fights can leave no perfect free point. ResolveBodies will safely separate this fallback.
  while(made<count){const side=made?1:-1,u=makeUnit(g,parent.owner,d.id,clampInsideArena(parent.x+side*ARENA.cellSize*.45,'x',d),clampInsideArena(parent.y+ARENA.cellSize*.25*f,'y',d));u.spawn=.35;u.lane=parent.lane;g.units.push(u);event(g,'split-spawn',{x:u.x,y:u.y,owner:u.owner,minion:d.id});made++;}
}
function summonDeathMinions(g,parent){
  const d=UNITS[parent.deathSummonType];if(!d||!parent.deathSummonCount)return 0;
  const available=Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length),count=Math.min(parent.deathSummonCount,available);if(!count)return 0;
  const cs=ARENA.cellSize,f=parent.owner===0?1:-1,candidates=[[0,-cs*.7],[-cs*.65,0],[cs*.65,0],[0,cs*.7],[-cs*.95,-cs*.5],[cs*.95,-cs*.5],[-cs*.95,cs*.5],[cs*.95,cs*.5]];let made=0;
  for(const [ox,oy] of candidates){
    if(made>=count)break;const pos={x:clampInsideArena(parent.x+ox,'x',d),y:clampInsideArena(parent.y+oy*f,'y',d)};
    if(!staticFree(g,d,pos,0))continue;
    const u=makeUnit(g,parent.owner,d.id,pos.x,pos.y);u.spawn=0;u.lane=parent.lane;u.summonedBy=parent.id;g.units.push(u);event(g,'death-summon',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id});made++;
  }
  while(made<count){
    const a=(made/count)*Math.PI*2,p2={x:clampInsideArena(parent.x+Math.cos(a)*ARENA.cellSize*.55,'x',d),y:clampInsideArena(parent.y+Math.sin(a)*ARENA.cellSize*.55,'y',d)},u=makeUnit(g,parent.owner,d.id,p2.x,p2.y);
    u.spawn=0;u.lane=parent.lane;u.summonedBy=parent.id;u.collisionDisabled=false;g.units.push(u);event(g,'death-summon',{x:u.x,y:u.y,owner:u.owner,summoner:parent.type,minion:d.id});made++;
  }
  return made;
}

function revealStealth(g,u,reason='reveal'){
  if(!u.stealthed)return false;u.stealthed=false;u.stealthUntil=0;u.target=null;u.targetLock=null;event(g,'stealth-reveal',{x:u.x,y:u.y,owner:u.owner,reason});return true;
}
function updateStealth(g,u){if(u.stealthed&&g.time+1e-8>=(u.stealthUntil||0))revealStealth(g,u,'timeout');}
function frontShieldHit(t,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y)||!(t.shieldHp>0))return false;
  const dx=x-t.x,dy=y-t.y,len=Math.hypot(dx,dy);if(len<.001)return true;
  const facing=Number.isFinite(t.facing)?t.facing:(t.owner===0?-Math.PI/2:Math.PI/2),dot=(dx/len)*Math.cos(facing)+(dy/len)*Math.sin(facing);
  return dot>=Math.cos(((t.shieldArcDeg||120)/2)*Math.PI/180);
}
function knockbackAmountFor(t){const m=t.mass||1;if(m>=12)return 0;if(m<=1.5)return 34;if(m<=5)return 20;return 8;}
function gravityAmountFor(t){const m=t.mass||1;if(m>=12)return 0;if(m<=1.5)return 28;if(m<=5)return 16;return 6;}
function forceToward(g,t,x,y,amount){
  if(!amount||t.kind||t.building||t.eggUnit||t.hp<=0)return 0;const dx=x-t.x,dy=y-t.y,len=Math.hypot(dx,dy);if(len<.001)return 0;return displaceBody(g,t,dx/len*amount,dy/len*amount);
}
function forceAway(g,t,x,y,amount){
  if(!amount||t.kind||t.building||t.eggUnit||t.hp<=0)return 0;const dx=t.x-x,dy=t.y-y,len=Math.hypot(dx,dy);if(len<.001)return 0;return displaceBody(g,t,dx/len*amount,dy/len*amount);
}
function findPhoenixEggPoint(g,t){
  const d=UNITS[t.eggType||'phoenix_egg'],base={x:clampInsideArena(t.x,'x',d),y:clampInsideArena(t.y,'y',d)};
  if(staticFree(g,d,base,0))return base;
  for(const r of [ARENA.cellSize*.5,ARENA.cellSize,ARENA.cellSize*1.5,ARENA.cellSize*2,ARENA.cellSize*3,ARENA.cellSize*4,ARENA.cellSize*5])for(let i=0;i<16;i++){const a=i*Math.PI*2/16,p={x:clampInsideArena(base.x+Math.cos(a)*r,'x',d),y:clampInsideArena(base.y+Math.sin(a)*r,'y',d)};if(staticFree(g,d,p,0))return p;}
  return {x:t.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1],y:t.owner===0?ARENA.riverBottom+ARENA.cellSize:ARENA.riverTop-ARENA.cellSize};
}
function spawnPhoenixEgg(g,t){
  const type=t.eggType||'phoenix_egg',d=UNITS[type];if(!d)return null;const p=findPhoenixEggPoint(g,t),egg=makeUnit(g,t.owner,type,p.x,p.y);egg.spawn=.2;egg.lane=t.lane;egg.eggHatchAt=g.time+(egg.eggHatchTime||4);g.units.push(egg);event(g,'phoenix-egg',{x:egg.x,y:egg.y,owner:egg.owner,duration:egg.eggHatchTime||4});return egg;
}
function hatchEgg(g,egg){
  const d=UNITS[egg.hatchType||'phoenix'];if(!d||egg.hp<=0)return false;const u=makeUnit(g,egg.owner,d.id,egg.x,egg.y);u.hp=Math.round(d.hp*.5);u.maxHp=d.hp;u.spawn=.35;u.revived=true;u.lane=egg.lane;egg._hatched=true;egg.hp=0;g.units.push(u);event(g,'phoenix-revive',{x:u.x,y:u.y,owner:u.owner,hp:u.hp});return true;
}
function updateRageZones(g,dt){
  g.zones??=[];
  for(const z of g.zones){
    if(z.kind!=='rage'||z.remaining<=0)continue;
    if(!z.activated&&g.time+1e-8>=z.activateAt){
      z.activated=true;event(g,'rage-activate',{x:z.x,y:z.y,owner:z.owner,radius:z.radius,duration:z.total,boost:z.boostMultiplier||1.3});
      for(const t of [...alive(g)]){
        if(t.owner===z.owner||t.hp<=0||distance(z,t)>z.radius+(t.radius||12)*.35)continue;
        damage(g,t,spellDamageForTarget(z,t),z.owner,{spell:true,zone:'rage'});
      }
    }
    if(z.activated)z.remaining=Math.max(0,z.remaining-dt);
  }
  g.zones=g.zones.filter(z=>z.kind!=='rage'||z.remaining>1e-8);
}
function updateLightningZones(g,dt){
  g.zones??=[];
  for(const z of g.zones){
    if(z.kind!=='lightning')continue;
    if(!z.activated){
      z.remaining=Math.max(0,z.activateAt-g.time);
      if(g.time+1e-8<z.activateAt)continue;
      const centre={x:z.x,y:z.y};
      const targets=alive(g)
        .filter(t=>t.owner!==z.owner&&t.hp>0&&t.targetable!==false&&t.burrowState!=='burrow'&&distance(centre,t)<=z.radius+(t.radius||12)*.35)
        .sort((a,b)=>b.hp-a.hp||String(a.id).localeCompare(String(b.id)))
        .slice(0,z.maxTargets||4);
      z.activated=true;z.targetIds=targets.map(t=>t.id);z.strikeIndex=0;z.nextStrikeAt=z.activateAt;
      z.total=Math.max(0,(z.targetIds.length-1)*(z.strikeInterval||.2));z.remaining=z.total;
      event(g,'lightning-activate',{x:z.x,y:z.y,owner:z.owner,radius:z.radius,targets:z.targetIds.length});
    }
    while(z.strikeIndex<z.targetIds.length&&z.nextStrikeAt<=g.time+1e-8){
      const id=z.targetIds[z.strikeIndex++],t=alive(g).find(v=>v.id===id&&v.hp>0);
      if(t){
        const amount=spellDamageForTarget(z,t);
        event(g,'lightning-hit',{x:t.x,y:t.y,owner:z.owner,targetOwner:t.owner,targetId:t.id,building:!!(t.kind||t.building),damage:amount,order:z.strikeIndex,total:z.targetIds.length});
        damage(g,t,amount,z.owner,{spell:true,lightning:true});
      }
      z.nextStrikeAt+=z.strikeInterval||.2;
    }
    z.remaining=z.strikeIndex>=z.targetIds.length?0:Math.max(0,z.nextStrikeAt-g.time+(z.targetIds.length-z.strikeIndex-1)*(z.strikeInterval||.2));
  }
  g.zones=g.zones.filter(z=>z.kind!=='lightning'||z.remaining>1e-8||(!z.activated&&g.time+1e-8<z.activateAt));
}
function updateCycloneZones(g,dt){
  g.zones??=[];const units=g.units.filter(u=>u.hp>0&&!u.kind&&!u.building&&!u.eggUnit&&u.targetable!==false&&u.burrowState!=='burrow');
  for(const z of g.zones){
    if(z.kind!=='cyclone'||z.remaining<=0)continue;
    z.remaining=Math.max(0,z.remaining-dt);
    for(const t of units){
      if(t.owner===z.owner||t.hp<=0)continue;const d=distance(z,t);if(d>z.radius+(t.radius||12)*.25)continue;
      const m=t.mass||1,factor=m>=12?.1:m<=1.5?1:m<=5?.65:.3,step=(z.pullSpeed||210)*factor*dt;forceToward(g,t,z.x,z.y,Math.min(step,Math.max(0,d-2)));
    }
  }
  g.zones=g.zones.filter(z=>z.kind!=='cyclone'||z.remaining>1e-8);
}
function skeletonRushSpawnPoint(g,z){
  const d=UNITS[z.spawnType||'skeleton'];if(!d)return null;
  const valid=p=>staticFree(g,d,p,0)&&!g.units.some(u=>u.hp>0&&!u.air&&!u.building&&distance(p,u)<(d.radius||7)+(u.radius||12)*.45);
  for(let i=0;i<32;i++){
    const a=random(g)*Math.PI*2,r=Math.sqrt(random(g))*Math.max(0,(z.radius||cellsToWorld(3.5))-(d.radius||7)),p={x:z.x+Math.cos(a)*r,y:z.y+Math.sin(a)*r};
    if(valid(p))return p;
  }
  for(const frac of [.2,.4,.6,.8])for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16+(z.owner?Math.PI/16:0),r=(z.radius||cellsToWorld(3.5))*frac,p={x:z.x+Math.cos(a)*r,y:z.y+Math.sin(a)*r};
    if(valid(p))return p;
  }
  return null;
}
function spawnSkeletonRushMinion(g,z){
  if(g.units.filter(u=>u.hp>0).length>=ARENA.maxUnits)return false;
  const d=UNITS[z.spawnType||'skeleton'],p=skeletonRushSpawnPoint(g,z);if(!d||!p)return false;
  const u=makeUnit(g,z.owner,d.id,p.x,p.y);u.spawn=.2;u.summonedBy=z.id;u.lane=p.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];g.units.push(u);
  event(g,'skeletonrush-spawn',{x:u.x,y:u.y,owner:u.owner,minion:d.id});return true;
}
function updateSkeletonRushZones(g,dt){
  for(const z of g.zones||[]){
    if(z.kind!=='skeletonrush')continue;
    if(g.time+1e-8<z.activateAt){z.remaining=z.total;continue;}
    if(!z.activated){z.activated=true;event(g,'skeletonrush-activate',{x:z.x,y:z.y,owner:z.owner,radius:z.radius});}
    while(z.nextSpawnAt<=g.time+1e-8&&z.nextSpawnAt<=z.expiresAt+1e-8){spawnSkeletonRushMinion(g,z);z.nextSpawnAt+=z.spawnEvery||.5;}
    z.remaining=Math.max(0,z.expiresAt-g.time);
  }
}
function updateDelayedDeathBombs(g,dt){
  for(const z of g.zones||[]){
    if(z.kind!=='giantskeletonbomb'&&z.kind!=='airballoonbomb')continue;
    z.remaining=Math.max(0,z.detonateAt-g.time);
    if(z.detonated||g.time+1e-8<z.detonateAt)continue;
    const balloon=z.kind==='airballoonbomb';z.detonated=true;event(g,balloon?'airballoon-bomb-explode':'giantskeleton-bomb-explode',{x:z.x,y:z.y,owner:z.owner,radius:z.radius,damage:z.damage});
    const centre={x:z.x,y:z.y};
    for(const v of [...alive(g)]){
      if(v.owner===z.owner||v.hp<=0)continue;
      const gap=(v.kind||v.building)?targetGap(centre,v):distance(centre,v);
      if(gap>z.radius+(v.kind||v.building?0:(v.radius||12)*.35))continue;
      if(v.air&&!v.kind&&!v.building)continue;
      damage(g,v,z.damage,z.owner,{spell:true,giantSkeletonBomb:!balloon,airBalloonBomb:balloon});
    }
    z.remaining=0;
  }
}
function handleUnitDeath(g,t){
  if(t._deathHandled)return;t._deathHandled=true;
  event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:t.type==='golem'});
  if(t.deathBombDamage&&t.deathBombRadius&&t.deathBombDelay){
    const kind=t.deathBombKind||'giantskeletonbomb',balloon=kind==='airballoonbomb';
    g.zones??=[];g.zones.push({id:`z${g.nextId++}`,owner:t.owner,kind,x:t.x,y:t.y,radius:t.deathBombRadius,damage:t.deathBombDamage,total:t.deathBombDelay,remaining:t.deathBombDelay,detonateAt:g.time+t.deathBombDelay,detonated:false});
    event(g,balloon?'airballoon-bomb-place':'giantskeleton-bomb-place',{x:t.x,y:t.y,owner:t.owner,radius:t.deathBombRadius,duration:t.deathBombDelay});
  }
  if(t.deathRage){deployRageZone(g,t.owner,t.x,t.y,UNITS.rage,'lumberjack');event(g,'lumberjack-rage-drop',{x:t.x,y:t.y,owner:t.owner,radius:UNITS.rage.radius,duration:UNITS.rage.activationDelay||1.5});}
  if(Number.isFinite(t.enemyEnergyOnDeath)&&t.enemyEnergyOnDeath>0){
    const enemy=t.owner===0?1:0,p=g.players[enemy],before=p.energy;
    p.energy=Math.min(ARENA.maxEnergy,p.energy+t.enemyEnergyOnDeath);
    const granted=p.energy-before;
    if(granted>1e-8)event(g,'energy-gift',{x:t.x,y:t.y,owner:enemy,sourceOwner:t.owner,amount:granted});
  }
  if(Number.isFinite(t.ownerEnergyOnDeath)&&t.ownerEnergyOnDeath>0){
    const p=g.players[t.owner],before=p.energy;p.energy=Math.min(ARENA.maxEnergy,p.energy+t.ownerEnergyOnDeath);const granted=p.energy-before;
    event(g,'pump-break-energy',{x:t.x,y:t.y,owner:t.owner,amount:granted,requested:t.ownerEnergyOnDeath});
  }
  if(t.deathDamage&&t.deathRadius){
    event(g,'death-blast',{x:t.x,y:t.y,owner:t.owner,radius:t.deathRadius,damage:t.deathDamage,unitType:t.type});
    const victims=[...alive(g)];
    for(const v of victims)if(v.id!==t.id&&v.owner!==t.owner&&v.hp>0&&distance(t,v)<=t.deathRadius+(v.radius||12)*.35)damage(g,v,t.deathDamage,t.owner);
  }
  if(t.splitType&&t.splitCount){
    if(t.type==='elixirgolem'||t.type==='elixir_golem_mid')event(g,'elixir-split',{x:t.x,y:t.y,owner:t.owner,fromType:t.type,toType:t.splitType,count:t.splitCount,stage:t.elixirStage||1});
    summonMiniGolems(g,t);
  }
  if(t.deathSummonType&&t.deathSummonCount)summonDeathMinions(g,t);
  if(t.phoenixRevive&&!t.revived)spawnPhoenixEgg(g,t);
  if(t.carrierDeathDamage&&t.carrierDeathRadius&&!t._carrierReachedTarget){
    event(g,'carrier-blast',{x:t.x,y:t.y,owner:t.owner,radius:t.carrierDeathRadius,damage:t.carrierDeathDamage});
    const victims=[...alive(g)];
    for(const v of victims)if(v.id!==t.id&&v.owner!==t.owner&&v.hp>0&&!v.kind&&!v.building&&distance(t,v)<=t.carrierDeathRadius+(v.radius||12)*.35)damage(g,v,t.carrierDeathDamage,t.owner);
  }
}
function damage(g,t,amount,owner,meta={}){
  if(t.hp<=0||t.burrowState==='burrow'||t.targetable===false)return 0;
  if((t.invulnerableUntil||0)>g.time){if(t.type==='nightshade')event(g,'shadow-evade',{x:t.x,y:t.y,owner:t.owner});return 0;}
  if(t.stealthed&&amount>0)revealStealth(g,t,'damage');
  const markActive=t.ironMarked&&t.ironMarkOwner===owner&&!meta.markBurst;
  if(markActive&&amount>0)amount*=1+(t.ironMarkBonus||.20);
  let hpAmount=amount,absorbed=0;
  if(t.siegeTurtle&&t.moving&&meta.ranged&&!meta.spell&&hpAmount>0){
    const reduction=clamp(t.movingRangedReduction||.40,0,.9);hpAmount*=1-reduction;
    event(g,'turtle-shell',{x:t.x,y:t.y,owner:t.owner,reduction});
  }
  if(t.shieldAll&&t.shieldHp>0&&amount>0){
    absorbed=Math.min(t.shieldHp,amount);t.shieldHp=Math.max(0,t.shieldHp-absorbed);hpAmount=t.shieldNoOverflow?0:Math.max(0,amount-absorbed);
    event(g,'shield-hit',{x:t.x,y:t.y,owner:t.owner,absorbed,shieldHp:t.shieldHp,maxShieldHp:t.maxShieldHp||t.shieldMax||0});if(t.shieldHp<=1e-8)event(g,'shield-break',{x:t.x,y:t.y,owner:t.owner});
  }else if(meta.shieldable&&!meta.spell&&t.shieldHp>0&&frontShieldHit(t,meta.sourceX,meta.sourceY)){
    const wanted=amount*(t.shieldAbsorb||.65);absorbed=Math.min(t.shieldHp,wanted);t.shieldHp=Math.max(0,t.shieldHp-absorbed);hpAmount=Math.max(0,amount-absorbed);
    event(g,'shield-hit',{x:t.x,y:t.y,owner:t.owner,absorbed,shieldHp:t.shieldHp,maxShieldHp:t.maxShieldHp||t.shieldMax||0});if(t.shieldHp<=1e-8)event(g,'shield-break',{x:t.x,y:t.y,owner:t.owner});
  }
  const before=t.hp;t.hp=Math.max(0,t.hp-hpAmount);t.hit=.15;
  const dealt=before-t.hp;
  let markBurst=0;
  if(markActive&&dealt>0&&t.hp>0){
    t.ironMarkDamage=(t.ironMarkDamage||0)+dealt;
    if(t.ironMarkDamage+1e-8>=(t.ironMarkThreshold||500)){
      markBurst=t.ironMarkBurstDamage||300;t.ironMarked=false;t.ironMarkOwner=null;t.ironMarkDamage=0;
      event(g,'iron-mark-break',{x:t.x,y:t.y,owner,damage:markBurst});damage(g,t,markBurst,owner,{markBurst:true,spell:true});
    }
  }
  if(t.siegeTurtle&&dealt>0&&!meta.ranged&&!meta.spell&&!meta.retaliation&&!meta.markBurst){
    const ratio=Number.isFinite(t.retaliationRatio)?t.retaliationRatio:(1/3);
    const radius=Number.isFinite(t.retaliationRadius)?t.retaliationRadius:54;
    const retaliate=Math.max(1,Math.round(dealt*ratio));
    let triggered=false;
    for(const v of g.units){
      if(v.hp<=0||v.owner===t.owner||v.id===t.id||v.air||v.kind||v.building||v.targetable===false||v.burrowState==='burrow')continue;
      if(distance(t,v)>radius+(v.radius||12)*.35)continue;
      triggered=true;
      damage(g,v,retaliate,t.owner,{retaliation:true,sourceX:t.x,sourceY:t.y});
    }
    if(triggered)event(g,'turtle-retaliation',{x:t.x,y:t.y,owner:t.owner,radius,damage:retaliate});
  }
  if(t.kind==='core'&&t.hp<before)wakeCore(g,t.owner,'core-hit');
  if(t.hp===0){
    t.ironMarked=false;t.ironMarkOwner=null;t.ironMarkDamage=0;
    if(t.kind){event(g,'death',{x:t.x,y:t.y,owner:t.owner,large:true});if(t.kind==='tower')wakeCore(g,t.owner,'side-down');}
    else handleUnitDeath(g,t);
  }
  return absorbed+dealt;
}
function decayStructure(g,t,amount){
  if(t.hp<=0||amount<=0)return;
  t.hp=Math.max(0,t.hp-amount);
  if(t.hp===0)handleUnitDeath(g,t);
}
function heal(g,t,amount,owner){
  if(t.hp<=0||t.hp>=t.maxHp||t.kind||t.building)return 0;
  const before=t.hp;t.hp=Math.min(t.maxHp,t.hp+amount);
  const restored=t.hp-before;if(restored>0)event(g,'heal',{x:t.x,y:t.y,owner,amount:restored});
  return restored;
}
function healOnHitPulse(g,sourceId){
  if(!sourceId)return 0;
  const u=g.units.find(q=>q.id===sourceId&&q.hp>0);if(!u||!u.healOnHit)return 0;
  const amount=u.healOnHit,range=u.healOnHitRange||cellsToWorld(4),maxAllies=Math.max(0,u.healOnHitMaxAllies??3);
  let healed=heal(g,u,amount,u.owner)>0?1:0;
  const allies=g.units.filter(t=>t.id!==u.id&&t.owner===u.owner&&t.hp>0&&!t.kind&&!t.building&&!t.eggUnit&&t.hp<t.maxHp&&distance(u,t)<=range+(t.radius||12));
  allies.sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp)||a.hp/a.maxHp-b.hp/b.maxHp||String(a.id).localeCompare(String(b.id)));
  for(const t of allies.slice(0,maxAllies))if(heal(g,t,amount,u.owner)>0)healed++;
  if(healed)event(g,'healer-pulse',{x:u.x,y:u.y,owner:u.owner,radius:range,amount,targets:healed});
  return healed;
}
function applySlow(g,t,p){
  if(!p.slowDuration||t.kind||t.building||t.air)return;
  const active=(t.slowUntil||0)>g.time;
  const moveStages=Array.isArray(p.slowMoveStages)?p.slowMoveStages:null;
  const attackStages=Array.isArray(p.slowAttackStages)?p.slowAttackStages:null;
  const maxStage=Math.max(moveStages?.length||0,attackStages?.length||0,1);
  const stage=Math.min(maxStage,active?Math.max(1,(t.slowStage||1)+1):1);
  t.slowStage=stage;
  t.slowUntil=g.time+p.slowDuration;
  if(moveStages)t.slowMoveFactor=moveStages[Math.min(stage-1,moveStages.length-1)];
  else t.slowMoveFactor=Math.min(t.slowMoveFactor||1,p.slowMove||1);
  if(attackStages)t.slowAttackFactor=attackStages[Math.min(stage-1,attackStages.length-1)];
  else t.slowAttackFactor=Math.min(t.slowAttackFactor||1,p.slowAttack||1);
  if(t.chargeDistance&&t.buildingOnly&&!t.mountedCharge){
    t.chargeRun=Math.max(0,(t.chargeRun||0)-45);
    if(t.chargeRun<t.chargeDistance*.8)t.charged=false;
  }
  event(g,'slow',{x:t.x,y:t.y,owner:p.owner,stage});
}
function resetSparkyCharge(g,u,delayUntil=g.time){
  if(!u.sparkUnit)return;
  u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=delayUntil;
}
function resetMountedCharge(u){
  if(!u?.mountedCharge)return;
  u.chargeRun=0;u.charged=false;
}
function applyStun(g,t,duration,owner){
  const until=Math.max(t.stunUntil||0,g.time+(duration||0)),keepMegaLock=t.megaKnight?t.targetLock:null;t.stunUntil=until;t.target=null;t.targetLock=keepMegaLock;
  if(t.ironSpinState){t.ironSpinState=null;t.ironSpinProgress=0;t.collisionDisabled=false;}
  if(t.tracker&&t.hookState)cancelTrackerHook(g,t);
  if(t.laserTower||t.laserUnit)resetLaserTower(t);
  if(t.drillUnit)resetDrill(t);
  if(t.crusherRamp)resetCrusher(t);
  if(t.sparkUnit)resetSparkyCharge(g,t,until);
  if(t.siegeRam){t.charged=false;t.ramChargeTime=0;}
  if(t.mountedCharge)resetMountedCharge(t);
  if(t.dashState){t.dashState=null;t.dashTarget=null;t.dashEnd=null;t.invulnerableUntil=0;t.dashReadyAt=Math.max(t.dashReadyAt||0,until+.35);}
  event(g,'stun',{x:t.x,y:t.y,owner,targetOwner:t.owner,duration});
}
function updateSparkyCharge(g,u){
  if(!u.sparkUnit||u.hp<=0)return;
  if(u.sparkCharged){u.sparkChargeProgress=1;return;}
  if(!Number.isFinite(u.sparkChargeStartAt))u.sparkChargeStartAt=g.time;
  const total=Math.max(.1,u.sparkChargeTime||3.5),progress=clamp((g.time-u.sparkChargeStartAt)/total,0,1);u.sparkChargeProgress=progress;
  if(progress>=1-1e-8){u.sparkCharged=true;u.sparkChargeProgress=1;event(g,'sparky-ready',{x:u.x,y:u.y,owner:u.owner});}
}
function rollingStripIntersects(a,b,p,halfWidth,lateralRadius=0,longitudinalRadius=lateralRadius){
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1e-9)return Math.hypot(p.x-a.x,p.y-a.y)<=halfWidth+lateralRadius;
  const ux=dx/len,uy=dy/len,px=p.x-a.x,py=p.y-a.y,along=px*ux+py*uy,side=Math.abs(px*(-uy)+py*ux);
  return side<=halfWidth+lateralRadius&&along>=-longitudinalRadius&&along<=len+longitudinalRadius;
}
function rollingSpellHit(g,p,a,b){
  p.hitIds??=[];const hit=new Set(p.hitIds),half=Math.max(1,(p.hitWidth||0)/2),dir=p.owner===0?-1:1;
  for(const t of [...alive(g)]){
    if(t.owner===p.owner||t.hp<=0||t.air||t.targetable===false||hit.has(t.id))continue;
    if(p.spell==='rollingbarbarian'&&t.kind)continue;
    const structure=!!(t.kind||t.building),lateralRadius=structure?(t.hitboxCols||t.footprintCols||1)*ARENA.cellSize/2:(t.radius||12)*.45,longitudinalRadius=structure?(t.hitboxRows||t.footprintRows||1)*ARENA.cellSize/2:(t.radius||12)*.45;if(!rollingStripIntersects(a,b,t,half,lateralRadius,longitudinalRadius))continue;
    let amount=p.damage;
    if(t.kind)amount=p.towerDamage??p.buildingDamage??p.damage??0;
    else if(t.building)amount=p.damage??0;
    if(amount<=0)continue;
    hit.add(t.id);p.hitIds.push(t.id);
    const dealt=damage(g,t,amount,p.owner,{spell:true,rollingSpell:p.spell});
    let moved=0;
    if(p.spell==='rollingwood'&&dealt>0&&t.hp>0&&!t.kind&&!t.building&&p.knockbackCells){
      const push=cellsToWorld(p.knockbackCells);moved=displaceBody(g,t,0,dir*push);
      if(moved>0)event(g,'rollingwood-knockback',{x:t.x,y:t.y,owner:p.owner,amount:moved,direction:dir});
    }
    event(g,`${p.spell}-hit`,{x:t.x,y:t.y,owner:p.owner,targetOwner:t.owner,targetId:t.id,building:!!(t.kind||t.building),damage:amount,knockback:moved});
  }
}
function rollingBarbarianSpawn(g,p){
  const minion=UNITS[p.spawnType||'barbarian'];if(!minion||g.units.filter(u=>u.hp>0).length>=ARENA.maxUnits)return 0;
  const q=goblinBarrelSpawnPoint(g,minion,{x:p.tx,y:p.ty},[],{x:p.tx,y:p.ty},ARENA.cellSize*2);if(!q)return 0;
  const u=makeUnit(g,p.owner,minion.id,q.x,q.y);u.spawn=.18;u.summonedBy=p.id;u.lane=q.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];g.units.push(u);
  event(g,'rollingbarbarian-spawn',{x:u.x,y:u.y,owner:u.owner,minion:minion.id});return 1;
}
function fireballKnockback(g,p,t,centre){
  if(!p.knockbackCells||t.hp<=0||t.kind||t.building||t.eggUnit||visionSizeFor(t)==='large')return 0;
  let dx=t.x-centre.x,dy=t.y-centre.y,len=Math.hypot(dx,dy);
  if(len<.001){dx=centre.x-p.sx;dy=centre.y-p.sy;len=Math.hypot(dx,dy);}
  if(len<.001){dx=0;dy=p.owner===0?-1:1;len=1;}
  const amount=cellsToWorld(p.knockbackCells),moved=displaceBody(g,t,dx/len*amount,dy/len*amount);
  if(moved>0)event(g,'fireball-knockback',{x:t.x,y:t.y,owner:p.owner,amount:moved,sourceX:centre.x,sourceY:centre.y});
  return moved;
}
function spellAreaImpact(g,p,type){
  event(g,type==='arrowrain'?'arrowrain-impact':type==='rocket'?'rocket-impact':'fireball-impact',{x:p.tx,y:p.ty,owner:p.owner,radius:p.splash,damage:p.damage});
  const centre={x:p.tx,y:p.ty};
  for(const t of [...alive(g)]){
    if(t.owner===p.owner||t.hp<=0)continue;
    if(distance(centre,t)>p.splash+(t.radius||12)*.35)continue;
    damage(g,t,spellDamageForTarget(p,t),p.owner,{spell:true});
    if(type==='fireball'&&t.hp>0)fireballKnockback(g,p,t,centre);
  }
}
function goblinBarrelTowerTarget(g,x,y){
  let best=null,bestScore=Infinity;const margin=ARENA.cellSize*.35;
  for(const t of g.towers){
    if(t.hp<=0)continue;
    const hw=(t.footprintCols||ARENA.sideTowerCells)*ARENA.cellSize/2,hh=(t.footprintRows||ARENA.sideTowerCells)*ARENA.cellSize/2;
    if(x<t.x-hw-margin||x>t.x+hw+margin||y<t.y-hh-margin||y>t.y+hh+margin)continue;
    const score=Math.hypot(x-t.x,y-t.y);if(score<bestScore){best=t;bestScore=score;}
  }
  return best;
}
function goblinBarrelFormation(g,p,d){
  const minion=UNITS[p.spawnType||d.spawnType||'goblin_melee'],spacing=Math.min(d.radius*.34,ARENA.cellSize*.72),tower=goblinBarrelTowerTarget(g,p.tx,p.ty),forward=p.owner===0?-1:1;
  if(tower){
    const rect=structureFootprintRect(tower),hw=rect?.hw||tower.radius||32,hh=rect?.hh||tower.radius||32,gap=(minion?.radius||9)+8;
    const visualHalf=(tower.footprintCols||ARENA.sideTowerCells)*ARENA.cellSize/2,centreBand=Math.min(ARENA.cellSize*.6,visualHalf*.36);
    if(Math.abs(p.tx-tower.x)<=centreBand){
      return {mode:'surround',tower,points:[{x:tower.x-hw-gap,y:tower.y},{x:tower.x+hw+gap,y:tower.y},{x:tower.x,y:tower.y+forward*(hh+gap)}]};
    }
    const side=p.tx<tower.x?-1:1,baseX=tower.x+side*(hw+gap+2);
    return {mode:side<0?'left-cluster':'right-cluster',tower,points:[{x:baseX,y:tower.y-spacing*.62},{x:baseX,y:tower.y+spacing*.62},{x:baseX+side*spacing*.72,y:tower.y}]};
  }
  return {mode:'triangle',tower:null,points:[{x:p.tx,y:p.ty+forward*spacing},{x:p.tx-spacing*.86,y:p.ty-forward*spacing*.52},{x:p.tx+spacing*.86,y:p.ty-forward*spacing*.52}]};
}
function goblinBarrelSpawnPoint(g,d,wanted,chosen,centre,radius){
  const valid=q=>staticFree(g,d,q,0)&&chosen.every(v=>distance(q,v)>=Math.max(12,(d.radius||9)*1.55));
  const clampPoint=q=>({x:clampInsideArena(q.x,'x',d),y:clampInsideArena(q.y,'y',d)});
  let q=clampPoint(wanted);if(valid(q))return q;
  for(const r of [10,18,28,40,54,70,Math.max(82,radius||0)])for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16,q2=clampPoint({x:wanted.x+Math.cos(a)*r,y:wanted.y+Math.sin(a)*r});if(valid(q2))return q2;
  }
  for(const r of [18,32,48,66,84])for(let i=0;i<20;i++){
    const a=i*Math.PI*2/20,q2=clampPoint({x:centre.x+Math.cos(a)*r,y:centre.y+Math.sin(a)*r});if(valid(q2))return q2;
  }
  return null;
}
function goblinBarrelImpact(g,p){
  const d=UNITS.goblinbarrel,minion=UNITS[p.spawnType||d.spawnType||'goblin_melee'];if(!minion)return 0;
  const available=Math.max(0,ARENA.maxUnits-g.units.filter(u=>u.hp>0).length),count=Math.min(p.spawnCount||d.spawnCount||3,available),formation=goblinBarrelFormation(g,p,d),chosen=[];let made=0;
  for(const wanted of formation.points){
    if(made>=count)break;const q=goblinBarrelSpawnPoint(g,minion,wanted,chosen,{x:p.tx,y:p.ty},d.radius);if(!q)continue;
    const u=makeUnit(g,p.owner,minion.id,q.x,q.y);u.spawn=.18;u.lane=q.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1];u.summonedBy=p.id;g.units.push(u);chosen.push(q);made++;
    event(g,'goblinbarrel-spawn',{x:u.x,y:u.y,owner:u.owner,minion:minion.id,mode:formation.mode});
  }
  event(g,'goblinbarrel-impact',{x:p.tx,y:p.ty,owner:p.owner,radius:d.radius,spawned:made,mode:formation.mode,towerId:formation.tower?.id||null});return made;
}
function insideEnemyPoison(g,t,owner){
  return (g.zones||[]).some(z=>z.kind==='poison'&&z.owner===owner&&z.remaining>0&&distance(z,t)<=z.radius+(t.radius||12)*.25);
}
function updatePoisonZones(g,dt){
  g.zones??=[];
  const entities=alive(g);
  for(const z of g.zones){
    if(z.kind!=='poison')continue;
    z.remaining=Math.max(0,z.remaining-dt);
    while(z.remaining>0&&z.nextTick<=g.time+1e-8){
      for(const t of entities){
        if(t.owner===z.owner||t.hp<=0||t.targetable===false||distance(z,t)>z.radius+(t.radius||12)*.25)continue;
        const dealt=damage(g,t,spellDamageForTarget(z,t),z.owner);
        if(dealt>0&&!t.kind&&!t.building&&t.hp>0){
          t.poisonOwner=z.owner;t.poisonUntil=Math.max(t.poisonUntil||0,g.time+z.lingerDuration);
          t.poisonDamage=Math.max(t.poisonDamage||0,z.lingerDamage);t.poisonTickEvery=z.tickEvery;
          t.poisonNextAt=Math.max(t.poisonNextAt||0,g.time+z.tickEvery);
        }
      }
      z.nextTick+=z.tickEvery;
    }
  }
  g.zones=g.zones.filter(z=>z.remaining>1e-8);
}
function decayMudZones(g,dt){for(const z of g.zones||[])if(z.kind==='mud')z.remaining=Math.max(0,z.remaining-dt);g.zones=(g.zones||[]).filter(z=>z.remaining>1e-8);}
function updateLingeringPoison(g,t){
  if(t.hp<=0||t.kind||t.building||!(t.poisonUntil>g.time)||!Number.isFinite(t.poisonOwner))return;
  if(insideEnemyPoison(g,t,t.poisonOwner))return;
  const every=t.poisonTickEvery||.5;
  while((t.poisonNextAt||0)<=g.time+1e-8&&t.poisonUntil>=(t.poisonNextAt||0)-1e-8){
    damage(g,t,t.poisonDamage||18,t.poisonOwner);t.poisonNextAt=(t.poisonNextAt||g.time)+every;
    if(t.hp<=0)break;
  }
}
function createMudZone(g,p){
  if(!p.mudRadius||!p.mudDuration)return;
  g.zones??=[];g.zones.push({id:`z${g.nextId++}`,owner:p.owner,kind:'mud',x:p.x,y:p.y,radius:p.mudRadius,remaining:p.mudDuration,total:p.mudDuration,tickEvery:p.mudTickEvery||.5,damage:p.mudDamage||30,slow:p.mudSlow||.7});
  event(g,'mud-deploy',{x:p.x,y:p.y,owner:p.owner,radius:p.mudRadius});
}
function updateMudZones(g){
  const zones=(g.zones||[]).filter(z=>z.kind==='mud'&&z.remaining>0);if(!zones.length)return;
  for(const t of alive(g)){
    if(t.hp<=0||t.kind||t.building||t.air||t.targetable===false||t.burrowState==='burrow')continue;
    const z=zones.find(q=>q.owner!==t.owner&&distance(q,t)<=q.radius+(t.radius||12)*.25);if(!z)continue;
    t.mudUntil=Math.max(t.mudUntil||0,g.time+Math.min(.55,z.remaining));t.mudSlowFactor=Math.min(t.mudSlowFactor||1,z.slow||.7);
    if((t.mudNextAt??-Infinity)<=g.time+1e-8){damage(g,t,z.damage||30,z.owner);t.mudNextAt=g.time+(z.tickEvery||.5);}
  }
}
function impact(g,p,entities){
  const target=entities.find(t=>t.id===p.target);
  if(p.chainCount&&target&&targetable(p,target)){
    const points=[];let current=target,amount=p.damage,source={x:p.sx,y:p.sy};const hit=new Set();
    for(let i=0;i<p.chainCount&&current;i++){
      const hitDamage=Array.isArray(p.chainDamages)&&Number.isFinite(p.chainDamages[i])?p.chainDamages[i]:Math.round(amount);
      hit.add(current.id);damage(g,current,hitDamage,p.owner,{shieldable:true,ranged:true,sourceX:source.x,sourceY:source.y});if(p.stunDuration&&current.hp>0)applyStun(g,current,p.stunDuration,p.owner);points.push({x:current.x,y:current.y,damage:hitDamage});
      source={x:current.x,y:current.y};amount*=p.chainFalloff||.8;
      const candidates=entities.filter(t=>!hit.has(t.id)&&targetable(p,t)&&!t.kind&&!t.building&&distance(current,t)<=p.chainRange+t.radius)
        .sort((a,b)=>distance(current,a)-distance(current,b)||String(a.id).localeCompare(String(b.id)));
      current=candidates[0]||null;
    }
    event(g,'chain',{x:p.x,y:p.y,owner:p.owner,points});
  }else if(p.splash){
    event(g,'blast',{x:p.x,y:p.y,owner:p.owner,radius:p.splash,color:p.kind});
    for(const t of entities)if(areaTargetable(p,t)&&distance(t,p)<=p.splash+t.radius*.35){
      damage(g,t,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:p.sx,sourceY:p.sy});
      if(t.hp>0&&p.gravityPull){const moved=forceToward(g,t,p.x,p.y,gravityAmountFor(t));if(moved>0)event(g,'gravity-pull',{x:t.x,y:t.y,owner:p.owner,amount:moved});}
      if(t.hp>0&&p.slowDuration)applySlow(g,t,p);if(t.hp>0&&p.stunDuration&&(!p.stunUnitsOnly||(!t.kind&&!t.building)))applyStun(g,t,p.stunDuration,p.owner);
    }
    createMudZone(g,p);
  }else if(target&&targetable(p,target)){
    const wasIronMarked=!!(p.ironMark&&target.ironMarked&&target.ironMarkOwner===p.owner);
    const dealt=damage(g,target,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:p.sx,sourceY:p.sy});
    if(dealt>0&&p.sourceUnitId)healOnHitPulse(g,p.sourceUnitId);
    if(target.hp>0&&p.ironMark&&!wasIronMarked)applyIronMark(g,target,{ironMark:true,owner:p.owner,markDamageBonus:p.markDamageBonus,markThreshold:p.markThreshold,markBurstDamage:p.markBurstDamage});
    if(target.hp>0&&p.knockback){const moved=forceAway(g,target,p.sx,p.sy,knockbackAmountFor(target));if(moved>0)event(g,'wind-push',{x:target.x,y:target.y,owner:p.owner,amount:moved});}
    applySlow(g,target,p);
  }
}
function projectileSpeed(kind){
  return ({bomb:180,sky_bomb:260,airballoon_bomb:250,lightning:520,electro:450,wizard_fire:430,wind:430,gravity:360,phoenix_fire:420,thrown_spear:480,dart:560,musket_ball:680,iron_arrow:500,mud:300,royal_arrow:470,royal_shell:310,sparkblast:340})[kind]||390;
}
function fireHunterScatter(g,u,t,amount){
  const count=Math.max(1,u.pelletCount||10),spread=(u.pelletSpreadDegrees||40)*Math.PI/180,base=Math.atan2(t.y-u.y,t.x-u.x),range=u.pelletRange||cellsToWorld(u.pelletRangeCells||6.5),speed=u.pelletSpeed||620;
  for(let i=0;i<count;i++){
    const a=count===1?base:base-spread/2+spread*(i/(count-1)),sx=u.x,sy=u.y-6,tx=clamp(sx+Math.cos(a)*range,0,ARENA.width),ty=clamp(sy+Math.sin(a)*range,0,ARENA.height);
    g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,kind:'hunter_pellet',x:sx,y:sy,sx,sy,tx,ty,speed,damage:amount,targetsAir:true,sourceUnitId:u.id,life:1.2});
  }
  event(g,'hunter-shot',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,pellets:count,damage:amount,spread:u.pelletSpreadDegrees||40});
}
function segmentProjection(px,py,ax,ay,bx,by){const dx=bx-ax,dy=by-ay,len2=dx*dx+dy*dy;if(len2<1e-8)return 0;return clamp(((px-ax)*dx+(py-ay)*dy)/len2,0,1);}
function updateHunterPellet(g,p,dt,entities){
  const a={x:p.x,y:p.y},dx=p.tx-p.x,dy=p.ty-p.y,d=Math.hypot(dx,dy),step=(p.speed||620)*dt;
  const b=d<=step+1e-8?{x:p.tx,y:p.ty}:{x:p.x+dx/d*step,y:p.y+dy/d*step};
  let best=null,bestProj=Infinity;
  for(const t of entities){
    if(t.owner===p.owner||t.hp<=0||t.targetable===false||t.burrowState==='burrow'||(t.air&&!p.targetsAir))continue;
    const hitRadius=(t.kind||t.building)?Math.max(t.radius||22,18):(t.radius||12);
    if(pointSegmentDistance(t.x,t.y,a.x,a.y,b.x,b.y)>hitRadius)continue;
    const proj=segmentProjection(t.x,t.y,a.x,a.y,b.x,b.y);if(proj<bestProj){best=t;bestProj=proj;}
  }
  if(best){p.x=a.x+(b.x-a.x)*bestProj;p.y=a.y+(b.y-a.y)*bestProj;damage(g,best,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:p.sx,sourceY:p.sy});event(g,'hunter-pellet-hit',{x:p.x,y:p.y,owner:p.owner,targetId:best.id,damage:p.damage});p.life=0;return;}
  p.x=b.x;p.y=b.y;if(d<=step+1e-8)p.life=0;
}
function beginFalcheAxe(g,u,t){
  const dx=t.x-u.x,dy=t.y-u.y,len=Math.hypot(dx,dy)||1,nx=dx/len,ny=dy/len,range=u.axeTravelRange||cellsToWorld(7);
  const ex=clamp(u.x+nx*range,0,ARENA.width),ey=clamp(u.y+ny*range,0,ARENA.height),rage=rageSpeedFactor(g,u);
  commitMobileTarget(u,t);faceToward(u,t.x,t.y);u.cd=u.cooldown;u.anim=.35;u.target=t.id;u.axeInFlight=true;u.moving=false;
  g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,kind:'executioner_axe',x:u.x,y:u.y,sx:u.x,sy:u.y,tx:ex,ty:ey,ex,ey,phase:'out',speed:(u.axeSpeed||260)*rage,damage:u.damage,hitWidth:u.axeHitWidth||cellsToWorld(2),sourceUnitId:u.id,outHits:[],backHits:[],progress:0,life:6});
  event(g,'falche-throw',{x:u.x,y:u.y,tx:ex,ty:ey,owner:u.owner,range,damage:u.damage});
}
function falcheAxeHits(g,p,a,b,entities){
  const hits=p.phase==='out'?p.outHits:p.backHits,half=(p.hitWidth||cellsToWorld(2))/2;
  for(const t of entities){
    if(t.owner===p.owner||t.hp<=0||t.targetable===false||t.burrowState==='burrow'||hits.includes(t.id))continue;
    if(pointSegmentDistance(t.x,t.y,a.x,a.y,b.x,b.y)>half+(t.radius||12)*.35)continue;
    hits.push(t.id);damage(g,t,p.damage,p.owner,{shieldable:true,ranged:true,sourceX:a.x,sourceY:a.y});event(g,'falche-hit',{x:t.x,y:t.y,owner:p.owner,phase:p.phase,damage:p.damage});
  }
}
function updateFalcheAxe(g,p,dt,entities){
  const a={x:p.x,y:p.y},target=p.phase==='out'?{x:p.ex,y:p.ey}:{x:p.sx,y:p.sy},d=Math.hypot(target.x-p.x,target.y-p.y),step=(p.speed||260)*dt;
  if(d<=step+1e-8){p.x=target.x;p.y=target.y;falcheAxeHits(g,p,a,p,entities);
    if(p.phase==='out'){p.phase='back';p.progress=1;event(g,'falche-return',{x:p.x,y:p.y,tx:p.sx,ty:p.sy,owner:p.owner});}
    else {p.life=0;const source=g.units.find(u=>u.id===p.sourceUnitId&&u.hp>0);if(source){source.axeInFlight=false;event(g,'falche-catch',{x:source.x,y:source.y,owner:source.owner});}}
    return;
  }
  p.x+=(target.x-p.x)/d*step;p.y+=(target.y-p.y)/d*step;falcheAxeHits(g,p,a,p,entities);
  const full=Math.max(1,Math.hypot(p.ex-p.sx,p.ey-p.sy)),leg=Math.hypot(p.x-p.sx,p.y-p.sy)/full;p.progress=p.phase==='out'?clamp(leg,0,1):clamp(2-leg,1,2);
}
function attack(g,u,t){
  if(u.sparkUnit&&!u.sparkCharged)return;
  if(u.executionerAxe){beginFalcheAxe(g,u,t);return;}
  const mountedChargeHit=!!(u.mountedCharge&&u.charged);
  if(u.mountedCharge)resetMountedCharge(u); // Any attack interrupts the continuous-walk charge gauge.
  // First actual attack commits ordinary mobile units to this target.
  commitMobileTarget(u,t);
  const attackFactor=(u.slowUntil||0)>g.time?(u.slowAttackFactor||1):1;
  u.cd=u.cooldown/Math.max(.15,attackFactor);u.anim=u.valkyrieSpin?.5:.35;faceToward(u,t.x,t.y);u.target=t.id;
  if(u.siegeRam&&(t.kind||t.building)){
    const charged=!!u.charged,amount=charged?(u.ramChargeDamage||572):(u.ramImpactDamage||u.suicideDamage||u.damage);
    damage(g,t,amount,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y});
    event(g,'ram-hit',{x:t.x,y:t.y,owner:u.owner,amount,charged,radius:charged?54:40});
    u.charged=false;u.ramChargeTime=0;u._carrierReachedTarget=true;u.hp=0;handleUnitDeath(g,u);return;
  }
  if(u.suicideUnit&&(t.kind||t.building)){
    const amount=u.suicideDamage||u.damage;
    if((u.suicideSplash||0)>0){
      const radius=u.suicideSplash;damage(g,t,amount,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y,suicideSplash:true});
      event(g,'suicide-blast',{x:u.x,y:u.y,owner:u.owner,amount,radius,unitType:u.type});
      for(const v of [...alive(g)])if(v.id!==t.id&&v.owner!==u.owner&&v.hp>0&&areaTargetable(u,v)&&distance(u,v)<=radius+(v.radius||12)*.35)damage(g,v,amount,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y,suicideSplash:true});
    }else{
      damage(g,t,amount,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y});event(g,'suicide-hit',{x:t.x,y:t.y,owner:u.owner,amount});
    }
    u._carrierReachedTarget=true;u.hp=0;handleUnitDeath(g,u);return;
  }
  let amount=(t.kind||t.building)&&Number.isFinite(u.structureDamage)?u.structureDamage:u.damage;
  if(mountedChargeHit)amount=u.chargeDamage||amount*2;
  if(u.crusherRamp&&(t.kind||t.building)){
    if(u.crusherTarget!==t.id){u.crusherTarget=t.id;u.crusherStage=0;}
    const stages=Array.isArray(u.crusherDamages)?u.crusherDamages:[u.damage];
    amount=stages[Math.min(u.crusherStage||0,stages.length-1)];
  }
  if(u.stealthed){amount=Math.round(amount*(u.stealthFirstMultiplier||1));revealStealth(g,u,'attack');}
  if(u.sparkUnit){u.sparkCharged=false;u.sparkChargeProgress=0;u.sparkChargeStartAt=g.time;event(g,'sparky-fire',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,radius:u.splash||90});}
  if(u.chargeMultiplier&&u.charged&&(t.kind||t.building)){
    amount=Math.round(amount*u.chargeMultiplier);u.charged=false;u.chargeRun=0;
    event(g,'charge-hit',{x:t.x,y:t.y,owner:u.owner,radius:48});
  }
  if(u.scatterShot){fireHunterScatter(g,u,t,amount);}
  else if(u.projectile){
    g.projectiles.push({id:`p${g.nextId++}`,owner:u.owner,x:u.x,y:u.y-6,sx:u.x,sy:u.y,tx:t.x,ty:t.y,target:t.id,
    kind:u.projectile,speed:projectileSpeed(u.projectile),damage:amount,splash:u.splash||0,sourceUnitId:u.id,
    targetsAir:u.targetsAir,life:3,slowMove:u.slowMove,slowAttack:u.slowAttack,slowMoveStages:u.slowMoveStages,slowAttackStages:u.slowAttackStages,slowDuration:u.slowDuration,
    ironMark:!!u.ironMark,markDamageBonus:u.markDamageBonus,markThreshold:u.markThreshold,markBurstDamage:u.markBurstDamage,sourceUnitType:u.type,
    chainCount:u.chainCount,chainRange:u.chainRange,chainFalloff:u.chainFalloff,chainDamages:Array.isArray(u.chainDamages)?u.chainDamages.map(v=>u.damage?Math.round(v*(amount/u.damage)):0):u.chainDamages,stunDuration:u.stunDuration,stunUnitsOnly:u.stunUnitsOnly,mudRadius:u.mudRadius,mudDuration:u.mudDuration,mudTickEvery:u.mudTickEvery,mudDamage:u.mudDamage,mudSlow:u.mudSlow,knockback:!!u.knockback,gravityPull:!!u.gravityPull});
  }else{
    if(u.valkyrieSpin&&u.meleeSplash)megaAreaDamage(g,u,u.x,u.y,amount,u.meleeSplash,'valkyrie-spin',true);
    else if(u.meleeSplash)megaAreaDamage(g,u,t.x,t.y,amount,u.meleeSplash,u.megaKnight?'mega-smash':'slash-splash',true);
    else damage(g,t,amount,u.owner,{shieldable:true,sourceX:u.x,sourceY:u.y});
    if(mountedChargeHit)event(g,'mounted-charge-hit',{x:t.x,y:t.y,owner:u.owner,amount,kind:u.type,radius:u.meleeSplash||24});
    event(g,'slash',{x:t.x,y:t.y,owner:u.owner,angle:Math.atan2(t.y-u.y,t.x-u.x),kind:u.type});
    if(u.crusherRamp){
      const stages=Array.isArray(u.crusherDamages)?u.crusherDamages:[u.damage];u.crusherStage=Math.min((u.crusherStage||0)+1,stages.length-1);
      event(g,'crusher-hit',{x:t.x,y:t.y,owner:u.owner,amount,stage:u.crusherStage});
    }
  }
}
function resetDrill(u){u.drillTarget=null;u.drillLockTime=0;u.drillStage=0;u.drillDps=u.drillBaseDps||90;}
function updateDrill(g,u,t,dt){
  if(!u.drillUnit)return false;
  if(!t){resetDrill(u);u.target=null;return true;}
  if(u.drillTarget!==t.id){u.drillTarget=t.id;u.drillLockTime=0;u.drillStage=0;u.drillDps=u.drillBaseDps||90;event(g,'drill-lock',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner});}
  else u.drillLockTime=(u.drillLockTime||0)+dt;
  const stages=Array.isArray(u.drillDpsStages)&&u.drillDpsStages.length?u.drillDpsStages:[u.drillBaseDps||90];
  const stage=Math.min(stages.length-1,Math.max(0,Math.floor((u.drillLockTime+1e-9)/(u.drillRampEvery||1.5))));
  if(stage!==(u.drillStage||0))event(g,'drill-ramp',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,stage,dps:stages[stage]});
  u.drillStage=stage;u.drillDps=stages[stage];u.target=t.id;u.anim=.12;faceToward(u,t.x,t.y);damage(g,t,u.drillDps*dt,u.owner,{shieldable:false,sourceX:u.x,sourceY:u.y});return true;
}
function grantPumpEnergy(g,u,reason='cycle'){
  if(!u.energyPump||u.hp<=0)return 0;const p=g.players[u.owner],amount=u.energyAmount||1,before=p.energy;p.energy=Math.min(ARENA.maxEnergy,p.energy+amount);const granted=p.energy-before;
  event(g,'pump-energy',{x:u.x,y:u.y,owner:u.owner,amount:granted,requested:amount,reason});return granted;
}
function updateEnergyPump(g,u,dt=0){
  const rage=rageSpeedFactor(g,u);if(rage>1&&dt>0&&Number.isFinite(u.energyNextAt))u.energyNextAt-=dt*(rage-1);
  if(!u.energyPump||u.hp<=0||!u.energyInterval||!Number.isFinite(u.energyNextAt))return;
  while(g.time+1e-8>=u.energyNextAt&&u.hp>0){grantPumpEnergy(g,u,'cycle');u.energyNextAt+=u.energyInterval;}
}
function resetCrusher(u){u.crusherTarget=null;u.crusherStage=0;}
function resetLaserTower(u){
  u.laserTarget=null;u.laserLockTime=0;u.laserStage=0;u.laserDps=u.laserBaseDps||20;u.laserDamageElapsed=0;
}
function updateLaserTower(g,u,t,dt){
  if(!u.laserTower&&!u.laserUnit)return false;
  if(!t){resetLaserTower(u);u.target=null;return true;}
  if(u.laserTarget!==t.id){
    if(u.laserUnit)commitMobileTarget(u,t);
    u.laserTarget=t.id;u.laserLockTime=0;u.laserStage=0;u.laserDps=u.laserBaseDps||20;u.laserDamageElapsed=0;
    event(g,'laser-lock',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner});
  }else u.laserLockTime=(u.laserLockTime||0)+dt;
  const every=u.laserRampEvery||1.5,mult=u.laserMultiplier||2,stage=Math.max(0,Math.floor((u.laserLockTime+1e-9)/every));
  if(stage!==(u.laserStage||0))event(g,'laser-ramp',{x:u.x,y:u.y,tx:t.x,ty:t.y,owner:u.owner,stage});
  u.laserStage=stage;u.laserDps=(u.laserBaseDps||20)*Math.pow(mult,stage);u.target=t.id;u.anim=.12;faceToward(u,t.x,t.y);
  const damageTick=Number.isFinite(u.laserDamageTick)?Math.max(.01,u.laserDamageTick):0;
  if(damageTick>0){
    u.laserDamageElapsed=(u.laserDamageElapsed||0)+dt;
    while(u.laserDamageElapsed+1e-9>=damageTick&&t.hp>0){
      u.laserDamageElapsed=Math.max(0,u.laserDamageElapsed-damageTick);
      damage(g,t,u.laserDps*damageTick,u.owner,{shieldable:true,ranged:true,sourceX:u.x,sourceY:u.y});
    }
  }else damage(g,t,u.laserDps*dt,u.owner,{shieldable:true,ranged:true,sourceX:u.x,sourceY:u.y});
  return true;
}
function healingPulse(g,u,entities){
  if(!u.healPower||u.healCd>0)return;
  const allies=entities.filter(t=>t.id!==u.id&&t.owner===u.owner&&!t.kind&&!t.building&&t.hp>0&&t.hp<t.maxHp&&distance(u,t)<=u.healRange+t.radius);
  if(!allies.length)return;
  allies.sort((a,b)=>(b.maxHp-b.hp)-(a.maxHp-a.hp)||a.hp/a.maxHp-b.hp/b.maxHp||String(a.id).localeCompare(String(b.id)));
  const target=allies[0];
  if(heal(g,target,u.healPower,u.owner)>0){u.healCd=u.healCooldown;u.anim=Math.max(u.anim,.3);faceToward(u,target.x,target.y);}
}

function towerScore(g,owner){
  const enemy=g.towers.filter(t=>t.owner!==owner);
  return enemy.some(t=>t.kind==='core'&&t.hp<=0)?3:enemy.filter(t=>t.hp<=0).length;
}
function finish(g,winner,reason){g.phase='ended';g.winner=winner;g.reason=reason;}
function winCheck(g){
  const dead=[0,1].map(o=>g.towers.find(t=>t.owner===o&&t.kind==='core').hp<=0);
  if(dead[0]||dead[1]){finish(g,dead[0]&&dead[1]?null:(dead[0]?1:0),'本拠地が破壊されました');return;}
  const scores=[towerScore(g,0),towerScore(g,1)];
  if(g.time>=ARENA.duration-1e-7&&!g.overtime){
    if(scores[0]!==scores[1]){finish(g,scores[0]>scores[1]?0:1,'制限時間・タワー破壊数');return;}
    g.overtime=true;event(g,'overtime',{x:ARENA.midX,y:ARENA.height/2});
  }
  if(g.overtime&&scores[0]!==scores[1]){finish(g,scores[0]>scores[1]?0:1,'延長戦・先にタワーを破壊');return;}
  if(g.time>=ARENA.duration+ARENA.overtime-1e-7){
    const hp=[0,1].map(o=>g.towers.filter(t=>t.owner===o).reduce((s,t)=>s+t.hp,0));
    finish(g,hp[0]===hp[1]?null:(hp[0]>hp[1]?0:1),'延長終了・残りタワーHP合計');
  }
}
function cpuStyleConfig(style){
  return ({
    aggressive:{reserve:1.5,combo:.62,defense:.82,attack:.95,building:.75},
    defensive:{reserve:4.0,combo:.36,defense:1.35,attack:.55,building:1.35},
    combo:{reserve:3.0,combo:.96,defense:.95,attack:.78,building:.9},
    counter:{reserve:3.0,combo:.68,defense:1.22,attack:.68,building:1.08},
    balanced:{reserve:2.5,combo:.64,defense:1.0,attack:.78,building:1.0}
  })[style]||{reserve:2.5,combo:.64,defense:1,attack:.78,building:1};
}
function cpuEnemySideTowers(g,owner){return g.towers.filter(t=>t.owner!==owner&&t.hp>0&&t.kind==='tower').sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp);}
function cpuWeakTower(g,owner){return cpuEnemySideTowers(g,owner)[0]||g.towers.find(t=>t.owner!==owner&&t.hp>0&&t.kind==='core');}
function cpuOwnTowers(g,owner){return g.towers.filter(t=>t.owner===owner&&t.hp>0);}
function cpuThreatInfo(g,owner){
  const foes=g.units.filter(u=>u.owner!==owner&&u.hp>0&&u.targetable!==false),ownTowers=cpuOwnTowers(g,owner);let best=null,bestScore=-Infinity;
  for(const u of foes){
    const crossed=owner===1?u.y<ARENA.riverTop+ARENA.cellSize*1.5:u.y>ARENA.riverBottom-ARENA.cellSize*1.5;
    const nearest=ownTowers.reduce((m,t)=>Math.min(m,targetGap(u,t)),Infinity),d=UNITS[u.type]||u;
    let score=(crossed?95:0)+Math.max(0,260-nearest)*.32+(d.cost||2)*9+(u.buildingOnly?24:0)+(u.air?8:0);
    if(score>bestScore){bestScore=score;best=u;}
  }
  if(!best)return {unit:null,score:0,cluster:[],airCount:0,groundCount:0};
  const cluster=foes.filter(u=>distance(u,best)<=ARENA.cellSize*3.1),airCount=cluster.filter(u=>u.air).length;
  return {unit:best,score:bestScore,cluster,airCount,groundCount:cluster.length-airCount};
}
function cpuSpellUnitValue(g,u,d,spellId){
  const cd=UNITS[u.type]||u,cost=cd.cost||2,hpRatio=u.maxHp?u.hp/u.maxHp:1;let v=26+cost*18+(1-hpRatio)*18;
  if((d.damage||0)>=u.hp)v+=48+cost*8;
  if(spellId==='zap'&&(u.type==='sparky'||u.laserStage>1||u.stunned))v+=95;
  if(spellId==='poison'&&(u.speed||0)<=40)v+=18;
  if(spellId==='lightning')v+=(u.hp||0)/35;
  if(cpuIsSplash(cd)||cd.targetsAir)v+=4;
  return v;
}
function cpuBestSpellTarget(g,owner,id){
  const d=UNITS[id],foes=g.units.filter(u=>u.owner!==owner&&u.hp>0&&u.targetable!==false),towers=g.towers.filter(t=>t.owner!==owner&&t.hp>0),candidates=[...foes,...towers];
  if(!d||!d.spell||!candidates.length)return null;
  if(id==='rage'){
    const friends=g.units.filter(u=>u.owner===owner&&u.hp>0&&!u.building);
    let best=null;for(const c of friends){const inside=friends.filter(u=>distance(u,c)<=d.radius+u.radius);const score=inside.reduce((sum,u)=>sum+(UNITS[u.type]?.cost||2)*24,0);if(!best||score>best.score)best={x:c.x,y:c.y,score,count:inside.length};}return best&&best.count>=2?best:null;
  }
  let best=null;
  for(const c of candidates){
    let score=0,hits=0,unitHits=0;
    if(id==='lightning'){
      const inRange=[...foes,...towers].filter(u=>distance(u,c)<=d.radius+(u.radius||0)).sort((a,b)=>(b.hp||0)-(a.hp||0)).slice(0,d.maxTargets||4);
      for(const u of inRange){hits++;if(u.kind){score+=u.hp<=(d.buildingDamage||0)?170:24;}else{unitHits++;score+=cpuSpellUnitValue(g,u,d,id);}}
    }else{
      for(const u of foes){if(distance(u,c)<=d.radius+(u.radius||0)){hits++;unitHits++;score+=cpuSpellUnitValue(g,u,d,id);}}
      for(const t of towers){if(distance(t,c)<=d.radius+(t.radius||0)){hits++;const td=d.buildingDamage??d.towerDamage??0;score+=t.hp<=td&&td>0?190:unitHits?28:8;}}
    }
    if(id==='cyclone'&&unitHits>=3)score+=35*unitHits;
    if(id==='arrowrain'&&unitHits>=3)score+=28*unitHits;
    if(id==='fireball'&&unitHits>=2)score+=32*unitHits;
    if(id==='poison'&&unitHits>=2)score+=22*unitHits;
    if(!best||score>best.score)best={x:c.x,y:c.y,score,hits,unitHits};
  }
  return best;
}
function cpuStyleForOwner(g,owner){return CPU_STYLE_LABELS[g.botStyles?.[owner]]?g.botStyles[owner]:(CPU_STYLE_LABELS[g.botStyle]?g.botStyle:'balanced');}
function cpuTrySpell(g,owner,aff,threat){
  const difficulty=g.difficulty||'normal',style=cpuStyleForOwner(g,owner),cfg=cpuStyleConfig(style);
  const thresholds={easy:175,normal:112,hard:78},spellOrder=['zap','arrowrain','fireball','poison','lightning','rocket','cyclone'];let best=null;
  for(const id of spellOrder){if(!aff.includes(id))continue;const target=cpuBestSpellTarget(g,owner,id);if(target&&(!best||target.score>best.score))best={...target,id};}
  if(best&&best.score>=thresholds[difficulty]){
    const jitter=(difficulty==='easy'?.75:difficulty==='normal'?.22:0)*ARENA.cellSize,x=best.x+(random(g)-.5)*2*jitter,y=best.y+(random(g)-.5)*2*jitter;
    if(deploy(g,owner,best.id,x,y).ok)return true;
  }
  if(!threat?.unit&&aff.includes('rage')){const target=cpuBestSpellTarget(g,owner,'rage');if(target&&target.score>=(difficulty==='hard'?80:105)&&deploy(g,owner,'rage',target.x,target.y).ok)return true;}
  if(threat?.unit&&!threat.unit.air&&(aff.includes('rollingwood')||aff.includes('rollingbarbarian'))&&threat.groundCount>=2){
    const id=aff.includes('rollingwood')&&threat.groundCount>=3?'rollingwood':aff.includes('rollingbarbarian')?'rollingbarbarian':null;
    if(id){const sy=owner===0?ARENA.deployBottom+ARENA.cellSize:ARENA.deployTop-ARENA.cellSize;if(deploy(g,owner,id,threat.unit.x,sy).ok)return true;}
  }
  if(!threat?.unit&&(style==='aggressive'||style==='combo'||difficulty==='hard')){
    const tower=cpuWeakTower(g,owner);if(tower){
      if(aff.includes('goblinbarrel')&&random(g)<(.42*cfg.attack+.18)){if(deploy(g,owner,'goblinbarrel',tower.x,tower.y).ok)return true;}
      if(aff.includes('skeletonrush')&&random(g)<(.28*cfg.attack+.12)){if(deploy(g,owner,'skeletonrush',tower.x,tower.y).ok)return true;}
    }
  }
  return false;
}
function cpuTryPlace(g,owner,id,x,y,spread=2.2){
  const d=UNITS[id];for(let i=0;i<10;i++){const px=clampInsideArena(x+(i?random(g)-.5:0)*ARENA.cellSize*spread,'x',d),py=clampInsideArena(y+(i?random(g)-.5:0)*ARENA.cellSize*spread,'y',d);if(deploy(g,owner,id,px,py).ok)return true;}return false;
}
function cpuDefenderScore(id,threat){
  const d=UNITS[id];if(!d||d.spell)return -999;if(threat.unit?.air&&!d.targetsAir)return -999;let score=cpuCardDps(d)*.28+(d.hp||0)*.015-(d.cost||0)*6;
  if(d.building)score+=38;if(threat.cluster.length>=3&&cpuIsSplash(d))score+=70;if((threat.unit?.hp||0)>=1800)score+=cpuCardDps(d)*.12;if(d.targetsAir&&threat.airCount)score+=35;if(d.count>=3&&threat.cluster.length<=2)score-=16;return score;
}
function cpuTryDefense(g,owner,aff,threat){
  if(!threat.unit)return false;const cfg=cpuStyleConfig(cpuStyleForOwner(g,owner)),choices=aff.filter(id=>!UNITS[id].spell).map(id=>({id,score:cpuDefenderScore(id,threat)*cfg.defense+(UNITS[id].building?22*(cfg.building-1):0)})).filter(x=>x.score>-500).sort((a,b)=>b.score-a.score);
  const best=choices[0];if(!best)return false;const forward=owner===0?-1:1,defY=clampInsideArena(threat.unit.y-forward*ARENA.cellSize*2.2,'y',UNITS[best.id]);
  if(cpuTryPlace(g,owner,best.id,threat.unit.x,defY)){g.botLastDefense[owner]=g.time;return true;}return false;
}
function cpuAttackLane(g,owner){const t=cpuWeakTower(g,owner);return t?(t.x<ARENA.midX?ARENA.lanes[0]:ARENA.lanes[1]):(random(g)<.5?ARENA.lanes[0]:ARENA.lanes[1]);}
function cpuStartCombo(g,owner,aff){
  const p=g.players[owner],style=cpuStyleForOwner(g,owner),cfg=cpuStyleConfig(style),difficulty=g.difficulty||'normal';if(difficulty==='easy'&&random(g)>.18)return false;if(random(g)>cfg.combo*(difficulty==='hard'?1:difficulty==='normal'?.82:.45))return false;
  const available=aff.filter(id=>!UNITS[id].spell&&!UNITS[id].building),fronts=available.filter(id=>cpuIsWinCondition(UNITS[id])||cpuIsTank(UNITS[id])),supports=available.filter(id=>cpuIsSupport(UNITS[id])&&!fronts.includes(id));if(!fronts.length||!supports.length)return false;
  fronts.sort((a,b)=>(UNITS[b].hp||0)-(UNITS[a].hp||0));supports.sort((a,b)=>cpuCardDps(UNITS[b])-cpuCardDps(UNITS[a]));const first=fronts[0],second=supports[0];let cards=[first,second];
  if(difficulty==='hard'&&style==='combo'){const third=supports.find(id=>id!==second&&UNITS[id].cost+UNITS[first].cost+UNITS[second].cost<=10);if(third)cards.push(third);}
  const need=cards.reduce((n,id)=>n+UNITS[id].cost,0),waitLimit=style==='combo'?10:8;if(need>waitLimit||p.energy<Math.min(UNITS[first].cost+UNITS[second].cost,6.5))return false;
  g.botPlans[owner]={cards,lane:cpuAttackLane(g,owner),index:0,nextAt:g.time,expires:g.time+6};return true;
}
function cpuExecutePlan(g,owner){
  const plan=g.botPlans[owner];if(!plan)return false;if(g.time>plan.expires){g.botPlans[owner]=null;return false;}const id=plan.cards[plan.index],p=g.players[owner];if(!id){g.botPlans[owner]=null;return false;}if(g.time+1e-7<plan.nextAt)return true;if(!p.hand.includes(id)){g.botPlans[owner]=null;return false;}if(UNITS[id].cost>p.energy)return true;
  const forward=owner===0?-1:1,frontY=owner===1?ARENA.cellSize*5.1:ARENA.height-ARENA.cellSize*5.1,y=frontY-forward*ARENA.cellSize*1.35*plan.index;
  if(cpuTryPlace(g,owner,id,plan.lane,y,1.4)){plan.index++;plan.nextAt=g.time+(plan.index===1?.75:.65);if(plan.index>=plan.cards.length)g.botPlans[owner]=null;return true;}g.botPlans[owner]=null;return false;
}
function cpuTryCounter(g,owner,aff){
  if(cpuStyleForOwner(g,owner)!=='counter'&&g.difficulty!=='hard')return false;if(g.time-(g.botLastDefense[owner]||-99)>7)return false;const forward=owner===0?-1:1,allies=g.units.filter(u=>u.owner===owner&&u.hp>0&&!u.building&&!u.deploying),survivors=allies.filter(u=>owner===1?u.y>ARENA.cellSize*4&&u.y<ARENA.riverBottom:u.y<ARENA.height-ARENA.cellSize*4&&u.y>ARENA.riverTop);if(!survivors.length)return false;
  survivors.sort((a,b)=>b.hp/b.maxHp-a.hp/a.maxHp);const lead=survivors[0],choices=aff.filter(id=>!UNITS[id].spell&&!UNITS[id].building&&cpuIsSupport(UNITS[id]));if(!choices.length)return false;choices.sort((a,b)=>cpuCardDps(UNITS[b])-cpuCardDps(UNITS[a]));const id=choices[0],y=lead.y-forward*ARENA.cellSize*2;return cpuTryPlace(g,owner,id,lead.x,y,1.3);
}
function cpuTryCycleSpell(g,owner,aff){
  if(g.players[owner].energy<9.4)return false;const tower=cpuWeakTower(g,owner);if(!tower)return false;
  const order=['goblinbarrel','skeletonrush','fireball','rocket','lightning','poison','zap','arrowrain','cyclone'];for(const id of order){if(!aff.includes(id))continue;if(id==='rollingwood'||id==='rollingbarbarian'||id==='rage')continue;if(deploy(g,owner,id,tower.x,tower.y).ok)return true;}return false;
}
function cpuTrySingleAttack(g,owner,aff){
  const p=g.players[owner],style=cpuStyleForOwner(g,owner),cfg=cpuStyleConfig(style);let choices=aff.filter(id=>!UNITS[id].spell);if(!choices.length)return false;if(p.energy<cfg.reserve+Math.min(...choices.map(id=>UNITS[id].cost)))return false;
  if(style==='aggressive')choices.sort((a,b)=>(cpuIsWinCondition(UNITS[b])?1:0)-(cpuIsWinCondition(UNITS[a])?1:0)||cpuCardDps(UNITS[b])-cpuCardDps(UNITS[a]));
  else if(style==='defensive')choices.sort((a,b)=>(UNITS[b].building?1:0)-(UNITS[a].building?1:0)||(UNITS[a].cost-UNITS[b].cost));
  const pickTop=Math.min(choices.length,g.difficulty==='hard'?3:5),id=choices[Math.floor(random(g)*pickTop)],lane=cpuAttackLane(g,owner),forward=owner===0?-1:1,baseY=owner===1?ARENA.cellSize*4.4:ARENA.height-ARENA.cellSize*4.4;
  if(UNITS[id].building){const y=owner===1?ARENA.riverTop-ARENA.cellSize*4:ARENA.riverBottom+ARENA.cellSize*4;return cpuTryPlace(g,owner,id,lane,y,2.4);}return cpuTryPlace(g,owner,id,lane,baseY-forward*ARENA.cellSize*(random(g)*1.2),2.7);
}
function runBot(g,owner=1){
  const p=g.players[owner];if(!p)return;const aff=p.hand.filter(id=>UNITS[id]&&UNITS[id].cost<=p.energy);if(!aff.length)return;
  if(cpuExecutePlan(g,owner))return;
  const threat=cpuThreatInfo(g,owner),urgent=!!threat.unit&&threat.score>=(g.difficulty==='hard'?72:g.difficulty==='normal'?88:108);
  if(cpuTrySpell(g,owner,aff,urgent?threat:{unit:null,cluster:[],groundCount:0,airCount:0}))return;
  if(urgent&&cpuTryDefense(g,owner,aff,threat))return;
  if(!urgent&&cpuTryCounter(g,owner,aff))return;
  if(!urgent&&cpuStartCombo(g,owner,aff)){cpuExecutePlan(g,owner);return;}
  if(!urgent&&cpuTrySingleAttack(g,owner,aff))return;
  if(!urgent&&aff.every(id=>UNITS[id].spell)&&cpuTryCycleSpell(g,owner,aff))return;
  if(urgent)cpuTryDefense(g,owner,aff,threat);
}

function teslaThreat(u,entities){
  let best=null,bestGap=Infinity;
  for(const t of entities){
    if(t.id===u.id||!targetable(u,t))continue;
    const gap=targetGap(u,t);if(gap<=u.range&&gap<bestGap){best=t;bestGap=gap;}
  }
  return best;
}
function updateTeslaState(g,u,entities){
  if(!u.teslaHidden||u.hp<=0||u.deploying)return false;
  const threat=teslaThreat(u,entities),raised=!!threat,was=!!u.teslaRaised;
  u.teslaRaised=raised;u.targetable=raised;
  if(raised){
    if(!was)event(g,'tesla-rise',{x:u.x,y:u.y,owner:u.owner});
  }else{
    u.target=null;u.targetLock=null;resetFirstStrike(u);
    if(was)event(g,'tesla-hide',{x:u.x,y:u.y,owner:u.owner});
  }
  return raised;
}

function tick(g,dt=ARENA.tick){
  if(!Number.isFinite(dt)||dt<=0||dt>.25)throw new RangeError('tick must be (0, .25]');
  if(g.phase==='ended')return;
  if(g.phase==='countdown'){
    g.countdown=Math.max(0,g.countdown-dt);if(g.countdown<=0.000001){g.countdown=0;g.phase='battle';}
    return;
  }
  // Bound displacement per substep, even when a slow client advances a large dt.
  if(dt>.100001){let left=dt;while(left>1e-8&&g.phase!=='ended'){const step=Math.min(.1,left);tick(g,step);left-=step;}return;}
  g.time+=dt;g.step++;
  for(const p of g.players)p.energy=Math.min(10,p.energy+dt*(g.time>=120?1.25:.625));
  g.events=g.events.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0);
  g.zones??=[];updateSkeletonRushZones(g,dt);updateDelayedDeathBombs(g,dt);updatePoisonZones(g,dt);decayMudZones(g,dt);updateMudZones(g);updateRageZones(g,dt);updateLightningZones(g,dt);updateCycloneZones(g,dt);
  refreshCoreWake(g);
  if(g.bot&&g.time>=g.botNext){
    runBot(g,1);g.botNext=g.time+(g.difficulty==='easy'?2.15:g.difficulty==='hard'?.5:.95)+random(g)*(g.difficulty==='easy'?.8:g.difficulty==='hard'?.28:.48);
  }
  resolveBodies(g,0);
  const entities=alive(g);
  for(const u of entities){
    if(u.hp<=0)continue;
    u.moving=false;
    if(u.eggUnit){if(Number.isFinite(u.eggHatchAt)&&g.time+1e-8>=u.eggHatchAt)hatchEgg(g,u);continue;}
    updateStealth(g,u);
    const stunnedNow=(u.stunUntil||0)>g.time,rageFactor=rageSpeedFactor(g,u),actionDt=dt*rageFactor;
    u.hit=Math.max(0,(u.hit||0)-dt);u.anim=Math.max(0,(u.anim||0)-dt);if(!stunnedNow)u.cd=Math.max(0,u.cd-actionDt);u.healCd=Math.max(0,(u.healCd||0)-actionDt);
    updateLingeringPoison(g,u);if(u.hp<=0)continue;
    if(u.kind==='core'&&!u.awake){u.target=null;continue;}
    if(!u.kind){
      u.age+=dt;
      if(updateBurrow(g,u,dt))continue;
      if(updateDeployment(g,u,dt))continue;
      if(u.sparkUnit)updateSparkyCharge(g,u);
      if(u.spawn>0){u.spawn=Math.max(0,u.spawn-dt);continue;}
      if(u.decayPerSecond){decayStructure(g,u,u.decayPerSecond*dt);if(u.hp<=0)continue;}
      if(u.energyPump)updateEnergyPump(g,u,dt);
      if(u.teslaHidden){updateTeslaState(g,u,entities);if(!u.teslaRaised)continue;}
      if(updateBoarRiverJump(g,u,dt))continue;
    }
    if((u.hookControlUntil||0)>g.time){u.target=null;u.moving=false;continue;}
    if((u.stunUntil||0)>g.time){u.target=null;if(u.laserTower||u.laserUnit)resetLaserTower(u);if(u.drillUnit)resetDrill(u);if(u.crusherRamp)resetCrusher(u);continue;}
    if(u.executionerAxe&&u.axeInFlight){u.moving=false;u.target=null;continue;}
    if(!u.kind&&updateSummoner(g,u,dt)){u.target=null;if(u.laserTower||u.laserUnit)resetLaserTower(u);continue;}
    if(!u.kind&&u.passiveSpawner){u.target=null;continue;}
    if(updateMegaJump(g,u,entities,dt))continue;
    if(updateIceSpiritLeap(g,u,entities,dt))continue;
    if(updateFireSpiritLeap(g,u,entities,dt))continue;
    if(updateShadowRush(g,u,entities,dt))continue;
    if(updateIronSpin(g,u,entities,dt))continue;
    if(updateTrackerHook(g,u,entities,dt))continue;
    const spinTarget=ironSpinCandidate(g,u,entities);if(spinTarget&&beginIronSpin(g,u,spinTarget))continue;
    const hookTarget=trackerHookCandidate(g,u,entities);if(hookTarget){beginTrackerHook(g,u,hookTarget);continue;}
    healingPulse(g,u,entities);
    const target=getTarget(g,u,entities);
    if(!target){if(u.laserTower||u.laserUnit)resetLaserTower(u);if(u.drillUnit)resetDrill(u);if(u.crusherRamp)resetCrusher(u);if(u.mountedCharge&&!u.charged)resetMountedCharge(u);resetFirstStrike(u);u.target=null;continue;}
    u.target=target.id;
    if(u.iceSpirit&&distance(u,target)<=((u.iceLeapRange||cellsToWorld(2))+(target.radius||0))){beginIceSpiritLeap(g,u,target);continue;}
    if(u.fireSpirit&&distance(u,target)<=((u.fireLeapRange||cellsToWorld(2))+(target.radius||0))){beginFireSpiritLeap(g,u,target);continue;}
    if(beginBoarRiverJump(g,u,target))continue;
    const reach=u.range;
    const attackGap=targetGap(u,target);
    if(u.megaKnight&&megaJumpReady(u,target)){beginMegaJumpWindup(g,u,target);continue;}
    if(u.crusherRamp&&u.crusherTarget&&(u.crusherTarget!==target.id||attackGap>reach))resetCrusher(u);
    if(u.drillUnit){
      if(attackGap<=reach){
        faceToward(u,target.x,target.y);if(u.drillTarget&&u.drillTarget!==target.id)resetDrill(u);
        if(firstStrikeReady(g,u,target))updateDrill(g,u,target,actionDt);
      }else {resetFirstStrike(u);resetDrill(u);move(g,u,target,dt);}
      continue;
    }
    if(u.laserTower||u.laserUnit){
      if(attackGap<=reach){
        faceToward(u,target.x,target.y);if(u.laserTarget&&u.laserTarget!==target.id)resetLaserTower(u);
        if(firstStrikeReady(g,u,target))updateLaserTower(g,u,target,actionDt);
      }else {resetFirstStrike(u);resetLaserTower(u);if(u.laserUnit&&!u.kind&&!u.building)move(g,u,target,dt);}
      continue;
    }
    if(canShadowRush(g,u,target)){beginShadowWindup(g,u,target);continue;}
    if(attackGap<=reach){
      if(u.mountedCharge&&!u.charged&&(u.chargeRun||0)>0)resetMountedCharge(u);
      faceToward(u,target.x,target.y);
      // Start the short first-strike preparation as soon as a new target is in range.
      // It runs in parallel with any remaining ordinary attack cooldown so target changes
      // do not add an unnecessary extra quarter-second after that cooldown finishes.
      const firstReady=firstStrikeReady(g,u,target);
      if(u.cd<=0&&firstReady)attack(g,u,target);
    }else if(!u.kind){resetFirstStrike(u);move(g,u,target,dt);}
  }
  for(const p of g.projectiles){
    p.life-=dt;
    if(p.kind==='executioner_axe'){updateFalcheAxe(g,p,dt,entities);continue;}
    if(p.kind==='hunter_pellet'){updateHunterPellet(g,p,dt,entities);continue;}
    if(p.spell==='rollingwood'||p.spell==='rollingbarbarian'){
      const prev={x:p.x,y:p.y};p.remaining=Math.max(0,p.remaining-dt);p.progress=clamp(1-p.remaining/Math.max(.001,p.flightTotal||p.total),0,1);
      p.x=p.sx+(p.tx-p.sx)*p.progress;p.y=p.sy+(p.ty-p.sy)*p.progress;rollingSpellHit(g,p,prev,{x:p.x,y:p.y});
      if(p.remaining<=1e-8){p.x=p.tx;p.y=p.ty;const spawned=p.spell==='rollingbarbarian'?rollingBarbarianSpawn(g,p):0;event(g,`${p.spell}-end`,{x:p.tx,y:p.ty,owner:p.owner,spawned});p.life=0;}
      continue;
    }
    if(p.spell==='fireball'||p.spell==='arrowrain'||p.spell==='goblinbarrel'||p.spell==='rocket'){
      const launchType=p.spell==='arrowrain'?'arrowrain-launch':p.spell==='goblinbarrel'?'goblinbarrel-launch':p.spell==='rocket'?'rocket-launch':'fireball-launch';let flightDt=dt;
      if((p.delayRemaining||0)>1e-8){const used=Math.min(flightDt,p.delayRemaining);p.delayRemaining=Math.max(0,p.delayRemaining-used);flightDt-=used;p.x=p.sx;p.y=p.sy;p.progress=0;
        if(p.delayRemaining<=1e-8&&!p.launched){p.launched=true;event(g,launchType,{x:p.sx,y:p.sy,tx:p.tx,ty:p.ty,owner:p.owner,travel:p.flightTotal||p.total});}
        if(flightDt<=1e-8)continue;
      }
      if(!p.launched){p.launched=true;event(g,launchType,{x:p.sx,y:p.sy,tx:p.tx,ty:p.ty,owner:p.owner,travel:p.flightTotal||p.total});}
      p.remaining=Math.max(0,p.remaining-flightDt);p.progress=clamp(1-p.remaining/Math.max(.001,p.flightTotal||p.total),0,1);
      p.x=p.sx+(p.tx-p.sx)*p.progress;p.y=p.sy+(p.ty-p.sy)*p.progress;
      if(p.remaining<=1e-8){p.x=p.tx;p.y=p.ty;if(p.spell==='goblinbarrel')goblinBarrelImpact(g,p);else spellAreaImpact(g,p,p.spell);p.life=0;}
      continue;
    }
    const t=entities.find(e=>e.id===p.target&&e.hp>0);if(t){p.tx=t.x;p.ty=t.y;}
    const d=Math.hypot(p.tx-p.x,p.ty-p.y),step=p.speed*dt;
    if(p.kind==='bomb'){
      const full=Math.max(1,Math.hypot(p.tx-p.sx,p.ty-p.sy));
      p.progress=clamp(1-d/full,0,1);
    }
    if(d<=step+5){p.x=p.tx;p.y=p.ty;p.progress=1;impact(g,p,entities);p.life=0;}
    else {p.x+=(p.tx-p.x)/d*step;p.y+=(p.ty-p.y)/d*step;}
  }
  g.projectiles=g.projectiles.filter(p=>p.life>0);
  g.units=g.units.filter(u=>u.hp>0);
  resolveBodies(g,dt);winCheck(g);
}
const rnd=v=>Math.round(v*100)/100;
function viewMatch(g,seat=0){
  const p=g.players[seat];
  return {physicsVersion:PHYSICS_VERSION,mapTheme:g.mapTheme||'grass',phase:g.phase,countdown:g.countdown,time:rnd(g.time),overtime:g.overtime,winner:g.winner,reason:g.reason,
    scores:[towerScore(g,0),towerScore(g,1)],energy:rnd(p.energy),hand:[...p.hand],next:p.queue[0],deck:[...p.deck],
    units:g.units.map(u=>({id:u.id,type:u.type,owner:u.owner,x:rnd(u.x),y:rnd(u.y),hp:u.hp,maxHp:u.maxHp,radius:u.radius,air:u.air,building:!!u.building,footprintCols:u.footprintCols||0,footprintRows:u.footprintRows||0,hitboxCols:u.hitboxCols||0,hitboxRows:u.hitboxRows||0,anim:u.anim,hit:u.hit,walk:u.walk,spawn:u.spawn,face:u.face,facing:u.facing,moving:!!u.moving,mass:u.mass,age:u.age,target:u.target||null,firstStrikeRemaining:rnd(Math.max(0,(u.firstStrikeReadyAt||0)-g.time)),targetable:u.targetable!==false,deploying:!!u.deploying,deployTotal:rnd(u.deployTotal||0),deployRemaining:rnd(u.deployRemaining||0),collisionDisabled:!!u.collisionDisabled,laserStage:u.laserStage||0,laserDps:rnd(u.laserDps||0),laserLockTime:rnd(u.laserLockTime||0),charged:!!u.charged,chargeRun:rnd(u.chargeRun||0),mountedCharge:!!u.mountedCharge,chargeProgress:u.mountedCharge&&u.chargeDistance?rnd(clamp((u.chargeRun||0)/u.chargeDistance,0,1)):0,axeInFlight:!!u.axeInFlight,rageActive:rageSpeedFactor(g,u)>1,ramChargeProgress:rnd(clamp((u.ramChargeTime||0)/Math.max(.01,u.ramChargeAfter||2),0,1)),sparkCharged:!!u.sparkCharged,sparkChargeProgress:rnd(u.sparkChargeProgress||0),stunned:(u.stunUntil||0)>g.time,stunRemaining:rnd(Math.max(0,(u.stunUntil||0)-g.time)),slowed:(u.slowUntil||0)>g.time,slowStage:(u.slowUntil||0)>g.time?(u.slowStage||1):0,slowRemaining:rnd(Math.max(0,(u.slowUntil||0)-g.time)),poisoned:(u.poisonUntil||0)>g.time,poisonOwner:Number.isFinite(u.poisonOwner)?u.poisonOwner:null,poisonRemaining:rnd(Math.max(0,(u.poisonUntil||0)-g.time)),mudded:(u.mudUntil||0)>g.time,mudRemaining:rnd(Math.max(0,(u.mudUntil||0)-g.time)),burrowState:u.burrowState||null,burrowProgress:rnd(u.burrowProgress||0),summonType:u.summonType||null,summonCount:u.summonCount||0,summonRemaining:u.summonInterval?rnd(Math.max(0,(u.summonNextAt||g.time)-g.time)):0,summonCasting:(u.summonCastingUntil||0)>g.time,summonWindupRemaining:rnd(Math.max(0,(u.summonCastingUntil||0)-g.time)),summonActive:!!u.summonActive,teslaRaised:!!u.teslaRaised,energyPump:!!u.energyPump,energyPumpProgress:u.energyPump&&u.energyInterval&&Number.isFinite(u.energyNextAt)?rnd(clamp(1-(u.energyNextAt-g.time)/u.energyInterval,0,1)):0,energyPumpRemaining:u.energyPump&&Number.isFinite(u.energyNextAt)?rnd(Math.max(0,u.energyNextAt-g.time)):0,dashState:u.dashState||null,dashWindupRemaining:rnd(Math.max(0,(u.dashWindupUntil||0)-g.time)),dashCooldownRemaining:rnd(Math.max(0,(u.dashReadyAt||0)-g.time)),invulnerable:(u.invulnerableUntil||0)>g.time,shieldHp:rnd(u.shieldHp||0),maxShieldHp:rnd(u.maxShieldHp||0),stealthed:!!u.stealthed,stealthRemaining:rnd(Math.max(0,(u.stealthUntil||0)-g.time)),eggHatchRemaining:u.eggUnit?rnd(Math.max(0,(u.eggHatchAt||g.time)-g.time)):0,revived:!!u.revived,drillStage:u.drillStage||0,drillDps:rnd(u.drillDps||0),drillLockTime:rnd(u.drillLockTime||0),crusherStage:u.crusherStage||0,iceSpiritState:u.iceSpiritState||null,iceSpiritProgress:rnd(u.iceSpiritProgress||0),fireSpiritState:u.fireSpiritState||null,fireSpiritProgress:rnd(u.fireSpiritProgress||0),megaJumpState:u.megaJumpState||null,megaJumpProgress:rnd(u.megaJumpProgress||0),megaJumpWindupRemaining:rnd(Math.max(0,(u.megaJumpWindupUntil||0)-g.time)),megaJumpTargetX:Number.isFinite(u.megaJumpTargetX)?rnd(u.megaJumpTargetX):null,megaJumpTargetY:Number.isFinite(u.megaJumpTargetY)?rnd(u.megaJumpTargetY):null,megaJumpStartX:Number.isFinite(u.megaJumpStartX)?rnd(u.megaJumpStartX):null,megaJumpStartY:Number.isFinite(u.megaJumpStartY)?rnd(u.megaJumpStartY):null,megaJumpEndX:Number.isFinite(u.megaJumpEndX)?rnd(u.megaJumpEndX):null,megaJumpEndY:Number.isFinite(u.megaJumpEndY)?rnd(u.megaJumpEndY):null,jumpRadius:u.jumpRadius||0,riverJumpMode:u.riverJumpMode||null,riverJumpState:u.riverJumpState||null,riverJumpProgress:rnd(u.riverJumpProgress||0),riverJumpEndX:Number.isFinite(u.riverJumpEndX)?rnd(u.riverJumpEndX):null,riverJumpEndY:Number.isFinite(u.riverJumpEndY)?rnd(u.riverJumpEndY):null,ironSpinUsed:!!u.ironSpinUsed,ironSpinState:u.ironSpinState||null,ironSpinProgress:rnd(u.ironSpinProgress||0),ironSpinEndX:Number.isFinite(u.ironSpinEndX)?rnd(u.ironSpinEndX):null,ironSpinEndY:Number.isFinite(u.ironSpinEndY)?rnd(u.ironSpinEndY):null,ironMarked:!!u.ironMarked,ironMarkOwner:Number.isFinite(u.ironMarkOwner)?u.ironMarkOwner:null,ironMarkProgress:u.ironMarked?rnd(clamp((u.ironMarkDamage||0)/Math.max(1,u.ironMarkThreshold||500),0,1)):0,hookState:u.hookState||null,hookProgress:rnd(u.hookProgress||0),hookCooldownRemaining:rnd(Math.max(0,(u.hookReadyAt||0)-g.time)),hookTargetX:Number.isFinite(u.hookTargetX)?rnd(u.hookTargetX):null,hookTargetY:Number.isFinite(u.hookTargetY)?rnd(u.hookTargetY):null,hookAirAttackRemaining:rnd(Math.max(0,(u.hookAirAttackUntil||0)-g.time)),turtleShellActive:!!(u.siegeTurtle&&u.moving)})),
    towers:g.towers.map(t=>({id:t.id,kind:t.kind,slot:t.slot||null,owner:t.owner,x:t.x,y:t.y,hp:t.hp,maxHp:t.maxHp,radius:t.radius,footprintCols:t.footprintCols||0,footprintRows:t.footprintRows||0,hitboxCols:t.hitboxCols||0,hitboxRows:t.hitboxRows||0,rangeCells:t.rangeCells||0,anim:t.anim,hit:t.hit,facing:t.facing,awake:t.kind==='core'?!!t.awake:true,stunned:(t.stunUntil||0)>g.time,stunRemaining:rnd(Math.max(0,(t.stunUntil||0)-g.time)),rageActive:rageSpeedFactor(g,t)>1})),
    projectiles:g.projectiles.map(p=>({id:p.id,owner:p.owner,x:rnd(p.x),y:rnd(p.y),sx:rnd(p.sx||p.x),sy:rnd(p.sy||p.y),tx:rnd(p.tx),ty:rnd(p.ty),kind:p.kind,spell:p.spell||null,phase:p.phase||null,hitWidth:rnd(p.hitWidth||0),progress:rnd(p.progress||0),radius:p.splash||0,launched:p.launched!==false,delayRemaining:rnd(p.delayRemaining||0),launchDelay:rnd(p.launchDelay||0),flightTotal:rnd(p.flightTotal||p.total||0)})),
    zones:(g.zones||[]).map(z=>({id:z.id,owner:z.owner,kind:z.kind,spell:z.spell,x:rnd(z.x),y:rnd(z.y),radius:z.radius,remaining:rnd(z.remaining),total:z.total,boostMultiplier:z.boostMultiplier||1,active:(z.kind==='skeletonrush'||z.kind==='rage'||z.kind==='lightning')?g.time+1e-8>=z.activateAt:true,activationRemaining:(z.kind==='skeletonrush'||z.kind==='rage'||z.kind==='lightning')?rnd(Math.max(0,z.activateAt-g.time)):0,detonateRemaining:(z.kind==='giantskeletonbomb'||z.kind==='airballoonbomb')?rnd(Math.max(0,z.detonateAt-g.time)):0})),
    events:g.events.map(e=>({...e})),bot:g.bot,difficulty:g.difficulty};
}

export {VERSION,MAX_DECK,DECK,UNIT_IDS,SPELL_IDS,PHYSICS_VERSION,UNITS,ARENA,createMatch,deploy,tick,viewMatch,finish,validateDeck};
