/** Balance data: original prototype values. Both browser and server import this file. */
export const VERSION = '9.0.0';
export const MAX_DECK = 6;
export const ARENA = Object.freeze({
  width:720, height:1040, riverTop:482, riverBottom:558, bridges:[190,530],
  bridgeHalf:42, deployBottom:600, deployTop:440, advancedDeployInset:120, maxUnits:100,
  duration:180, overtime:60, maxEnergy:10, tick:0.1
});
export const UNITS = Object.freeze({
  blade: {id:'blade',mass:2,name:'アッシュ剣士',short:'剣士',role:'近接アタッカー',cost:3,hp:780,damage:112,speed:56,range:34,cooldown:1.05,radius:16,count:1,air:false,targetsAir:false,color:'#efc577',desc:'攻守の基準になる剣士。盾役の後ろで前線を押し上げる。'},
  knight:{id:'knight',mass:6,name:'アイアン衛士',short:'衛士',role:'近接タンク',cost:4,hp:1850,damage:98,speed:35,range:36,cooldown:1.35,radius:23,count:1,air:false,targetsAir:false,color:'#a7b9c3',desc:'高い体力で攻撃を受け止める。後ろに弓兵や術師を重ねよう。'},
  archer:{id:'archer',mass:1.2,name:'リーフ弓兵',short:'弓兵',role:'遠距離・対空',cost:3,hp:430,damage:86,speed:50,range:185,cooldown:1.15,radius:14,count:1,air:false,targetsAir:true,projectile:'arrow',color:'#a6ca8b',desc:'離れた敵と飛行ユニットを狙える。前衛で守ると長く働く。'},
  mage:{id:'mage',mass:1.6,name:'ルーン術師',short:'術師',role:'範囲攻撃・対空',cost:4,hp:480,damage:105,speed:44,range:158,cooldown:1.5,radius:15,count:1,air:false,targetsAir:true,projectile:'orb',splash:54,color:'#b9a0ef',desc:'魔力弾が周囲にもダメージ。密集した敵やコウモリに有効。'},
  spear:{id:'spear',mass:1.2,name:'スパーク槍兵',short:'槍兵',role:'中距離・低コスト',cost:2,hp:410,damage:82,speed:64,range:68,cooldown:0.9,radius:14,count:1,air:false,targetsAir:false,color:'#f6a98d',desc:'長い槍で剣士より少し離れて攻撃。素早い援軍や防衛に。'},
  bat:{id:'bat',mass:0.6,name:'ムーンバット',short:'バット',role:'飛行・3体編成',cost:2,hp:145,damage:46,speed:82,range:28,cooldown:0.85,radius:11,count:3,air:true,targetsAir:true,color:'#b7a7dc',desc:'3体で出撃し、川を飛び越える。対空できない敵に強い。'},
  bomber:{id:'bomber',mass:2,name:'ポット爆弾兵',short:'爆弾兵',role:'地上範囲攻撃',cost:3,hp:470,damage:174,speed:42,range:145,cooldown:1.8,radius:16,count:1,air:false,targetsAir:false,projectile:'bomb',splash:66,color:'#edaa66',desc:'爆弾で地上の密集を崩す。空中の敵には攻撃できない。'},
  cannon:{id:'cannon',mass:1000000,name:'ボルト砲台',short:'砲台',role:'防衛建物・耐久減衰',cost:4,hp:1080,damage:140,speed:0,range:218,cooldown:1.4,radius:24,count:1,air:false,targetsAir:false,projectile:'shell',building:true,decayPerSecond:30,color:'#8dbfb3',desc:'動かない防衛建物。最大HPは1080のまま、設置後は毎秒30ずつ耐久が減り、攻撃を受けなくても約36秒で崩れる。'},
  golem:{id:'golem',mass:16,name:'ストーンゴーレム',short:'ゴーレム',role:'建物特攻・分裂',cost:8,hp:2850,damage:288,speed:21,range:42,cooldown:1.85,radius:30,count:1,air:false,targetsAir:false,buildingOnly:true,deathDamage:180,deathRadius:75,splitType:'mini_golem',splitCount:2,color:'#8ea37d',desc:'建物だけを狙う大型兵。本体HPは2850へ調整。倒されるとちびゴーレム2体へ分裂し、死亡時に周囲へ180ダメージ。'},
  berserker:{id:'berserker',mass:8.2,name:'クラッグバーサーカー',short:'クラッグ',role:'重量アタッカー・高火力',cost:6,hp:1950,damage:360,speed:32,range:40,cooldown:1.6,radius:24,count:1,air:false,targetsAir:false,color:'#b96550',desc:'巨大な戦槌を振るう重量級アタッカー。ゴーレムほど硬くない代わりに、地上の大型兵を真正面から削る高火力を持つ。'},
  mini_golem:{id:'mini_golem',hidden:true,mass:5.3,name:'ちびゴーレム',short:'ちび',role:'建物特攻・分裂後',cost:0,hp:1050,damage:96,speed:28,range:32,cooldown:1.55,radius:18,count:1,air:false,targetsAir:false,buildingOnly:true,deathDamage:60,deathRadius:45,color:'#9aa88a',desc:'ストーンゴーレムが倒れた後に2体現れる小型体。HP1050・攻撃96を持ち、死亡時に周囲へ60ダメージ。'},
  boar:{id:'boar',mass:9.5,name:'アイアンボア',short:'ボア',role:'建物突撃・チャージ',cost:4,hp:980,damage:178,speed:78,range:28,cooldown:1.05,radius:18,count:1,air:false,targetsAir:false,buildingOnly:true,chargeDistance:105,chargeMultiplier:2.25,shovePower:14,shoveMassLimit:2.2,shoveCompression:.62,color:'#b4785f',desc:'敵兵を無視して建物へ突進。軽量な地上兵を押しのけながら進み、105px走ると最初の体当たりが2.25倍になる。'},
  nightshade:{id:'nightshade',mass:1.05,name:'ナイトシェイド',short:'シェイド',role:'暗殺・無敵突進',cost:3,hp:520,damage:228,speed:88,range:30,cooldown:.82,radius:13,count:1,air:false,targetsAir:false,aggroRange:105,dashAggroRange:105,dashWindup:.6,dashMinRange:80,dashMaxRange:205,dashSpeed:650,dashMultiplier:2,dashCooldown:4,color:'#6f668f',desc:'近づいた敵や建物を捉えると0.6秒溜め、影の突進を行う。突進中は無敵で、到達時に通常の2倍ダメージ。その後は通常攻撃し、突進は4秒で再使用できる。'},
  mossling:{id:'mossling',mass:.45,name:'モスリング隊',short:'モス隊',role:'群体・5体編成',cost:3,hp:155,damage:45,speed:72,range:21,cooldown:.8,radius:9,count:5,air:false,targetsAir:false,color:'#8fb56b',desc:'小さな森の精霊5体で取り囲む群体。単体攻撃の大型に強いが、爆弾や範囲魔法にはとても弱い。'},
  lumina:{id:'lumina',mass:1.4,name:'ルミナ司祭',short:'司祭',role:'回復支援・後衛',cost:4,hp:590,damage:38,speed:44,range:145,cooldown:1.55,radius:15,count:1,air:false,targetsAir:false,projectile:'light',healPower:115,healRange:128,healCooldown:1.25,color:'#e7dba8',desc:'弱い光弾を放ちながら、周囲で最も傷ついた味方ユニットを回復する。タンクと好相性だが暗殺者に狙われやすい。'},
  frost:{id:'frost',mass:1.5,name:'フロストシャーマン',short:'シャーマン',role:'妨害・減速',cost:4,hp:535,damage:74,speed:42,range:170,cooldown:1.4,radius:15,count:1,air:false,targetsAir:false,projectile:'frost',slowMove:.62,slowAttack:.72,slowDuration:3,color:'#9ccfe2',desc:'氷弾で地上の敵を減速。移動と攻撃のテンポを奪い、ボアのチャージも削るため大型・突進系への時間稼ぎに強い。'},
  harpy:{id:'harpy',mass:1.05,name:'ストームハーピー',short:'ハーピー',role:'空中遠距離・連鎖雷',cost:4,hp:505,damage:94,speed:64,range:175,cooldown:1.25,radius:16,count:1,air:true,targetsAir:true,projectile:'lightning',chainCount:3,chainRange:105,chainFalloff:.78,color:'#8fa9d8',desc:'空から雷を放ち、近くの敵へ最大3体まで連鎖する。群体に強いが、弓兵などの対空遠距離に弱い。'},
  fireball:{id:'fireball',cardType:'spell',spell:'fireball',name:'ファイヤーボール',short:'火球',role:'呪文・範囲爆撃',cost:4,damage:560,buildingDamage:140,radius:90,count:0,targetsAir:true,color:'#ed7a47',desc:'戦場の好きな場所へ本拠地から火球を放つ。半径90に560ダメージ、建物には140。遠いほど着弾が遅く、追尾しないため偏差撃ちが必要。'}
});
export const DECK = Object.freeze(Object.keys(UNITS).filter(id=>!UNITS[id].hidden));
export const UNIT_IDS = Object.freeze(DECK.filter(id=>!UNITS[id].spell));
export const SPELL_IDS = Object.freeze(DECK.filter(id=>!!UNITS[id].spell));
export const DEFAULT_DECK = Object.freeze(['knight','berserker','archer','fireball','frost','lumina']);
export const ROLE_ORDER = DECK;
export const TEAM_COLORS = ['#58b9ae','#ee9b81'];
export function normalizeDeck(value,{fallback=true}={}){
  const out=[];
  if(Array.isArray(value))for(const id of value){if(typeof id==='string'&&DECK.includes(id)&&!out.includes(id))out.push(id);if(out.length===MAX_DECK)break;}
  if(out.length===MAX_DECK)return out;
  return fallback?[...DEFAULT_DECK]:null;
}
