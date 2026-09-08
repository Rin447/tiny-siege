/** Balance data: original prototype values. Both browser and server import this file. */
export const VERSION = '2.0.0';
export const ARENA = Object.freeze({
  width:720, height:1040, riverTop:482, riverBottom:558, bridges:[190,530],
  bridgeHalf:42, deployBottom:600, deployTop:440, maxUnits:100,
  duration:180, overtime:60, maxEnergy:10, tick:0.1
});
export const UNITS = Object.freeze({
  blade: {id:'blade',mass:2,name:'アッシュ剣士',short:'剣士',role:'近接アタッカー',cost:3,hp:780,damage:112,speed:56,range:34,cooldown:1.05,radius:16,count:1,air:false,targetsAir:false,color:'#efc577',desc:'攻守の基準になる剣士。盾役の後ろで前線を押し上げる。'},
  knight:{id:'knight',mass:6,name:'アイアン衛士',short:'衛士',role:'近接タンク',cost:5,hp:1850,damage:98,speed:35,range:36,cooldown:1.35,radius:23,count:1,air:false,targetsAir:false,color:'#a7b9c3',desc:'高い体力で攻撃を受け止める。後ろに弓兵や術師を重ねよう。'},
  archer:{id:'archer',mass:1.2,name:'リーフ弓兵',short:'弓兵',role:'遠距離・対空',cost:3,hp:430,damage:86,speed:50,range:185,cooldown:1.15,radius:14,count:1,air:false,targetsAir:true,projectile:'arrow',color:'#a6ca8b',desc:'離れた敵と飛行ユニットを狙える。前衛で守ると長く働く。'},
  mage:{id:'mage',mass:1.6,name:'ルーン術師',short:'術師',role:'範囲攻撃・対空',cost:4,hp:480,damage:105,speed:44,range:158,cooldown:1.5,radius:15,count:1,air:false,targetsAir:true,projectile:'orb',splash:54,color:'#b9a0ef',desc:'魔力弾が周囲にもダメージ。密集した敵やコウモリに有効。'},
  spear:{id:'spear',mass:1.2,name:'スパーク槍兵',short:'槍兵',role:'中距離・低コスト',cost:2,hp:410,damage:82,speed:64,range:68,cooldown:0.9,radius:14,count:1,air:false,targetsAir:false,color:'#f6a98d',desc:'長い槍で剣士より少し離れて攻撃。素早い援軍や防衛に。'},
  bat:{id:'bat',mass:0.6,name:'ムーンバット',short:'バット',role:'飛行・3体編成',cost:2,hp:145,damage:46,speed:82,range:28,cooldown:0.85,radius:11,count:3,air:true,targetsAir:true,color:'#b7a7dc',desc:'3体で出撃し、川を飛び越える。対空できない敵に強い。'},
  bomber:{id:'bomber',mass:2,name:'ポット爆弾兵',short:'爆弾兵',role:'地上範囲攻撃',cost:3,hp:470,damage:174,speed:42,range:145,cooldown:1.8,radius:16,count:1,air:false,targetsAir:false,projectile:'bomb',splash:66,color:'#edaa66',desc:'爆弾で地上の密集を崩す。空中の敵には攻撃できない。'},
  cannon:{id:'cannon',mass:1000000,name:'ボルト砲台',short:'砲台',role:'防衛建物',cost:4,hp:1080,damage:140,speed:0,range:218,cooldown:1.4,radius:24,count:1,air:false,targetsAir:false,projectile:'shell',building:true,lifetime:32,color:'#8dbfb3',desc:'動かない防衛建物。地上の敵を迎撃し、32秒で消える。'}
});
export const DECK = Object.freeze(Object.keys(UNITS));
export const ROLE_ORDER = DECK;
export const TEAM_COLORS = ['#58b9ae','#ee9b81'];
