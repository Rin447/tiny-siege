import {VERSION,ARENA,UNITS,DECK,DEFAULT_DECK,MAX_DECK,normalizeDeck} from './game/units.js';
import {createMatch,tick,runBot,deploy,viewMatch,clamp,canPlace} from './game/engine.js';
import {drawArena,drawPortrait,orient} from './game/art.js';

const $=s=>document.querySelector(s);
const PATCH_NOTES = Object.freeze([
  {version:'17.0.0',date:'2026-09-10',title:'SUMMONERS UPDATE',items:[
    '新ユニット「ネクロマンサー」を追加。6コスト・HP1350・地上/空中への範囲攻撃。配置直後にボーン3体、その後6秒ごとに3体を召喚します。',
    '新ユニット「ダークネクロマンサー」を追加。5コスト・HP1150・地上のみを攻撃。配置直後にムーンバット2体、その後5秒ごとに2体を召喚します。',
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
  try{const raw=JSON.parse(safeStorage('local','tiny-deck-v17')||safeStorage('local','tiny-deck-v16')||safeStorage('local','tiny-deck-v15')||safeStorage('local','tiny-deck-v14')||safeStorage('local','tiny-deck-v13')||safeStorage('local','tiny-deck-v12')||safeStorage('local','tiny-deck-v11')||safeStorage('local','tiny-deck-v10')||safeStorage('local','tiny-deck-v9')||safeStorage('local','tiny-deck-v8')||safeStorage('local','tiny-deck-v7')||safeStorage('local','tiny-deck-v6')||safeStorage('local','tiny-deck-v5')||safeStorage('local','tiny-deck-v4')||safeStorage('local','tiny-deck-v3')||'null');return migrateDeck(raw);}catch{return [...DEFAULT_DECK];}
}
let playerDeck=loadDeck();
const MYLIST_KEY='tiny-deck-presets-v17',LEGACY_MYLIST_KEYS=['tiny-deck-presets-v16'],MAX_MYLIST=10;
function storageFor(store='local'){return store==='session'?window.sessionStorage:window.localStorage;}
function verifiedStorageWrite(store,key,value){
  try{const storage=storageFor(store);storage.setItem(key,value);return storage.getItem(key)===value;}catch{return false;}
}
function normalizePresetList(raw){
  const source=Array.isArray(raw)?raw:Array.isArray(raw?.presets)?raw.presets:[];
  const out=[];for(const [i,item] of source.entries()){const cards=normalizeDeck(item?.cards,{fallback:false});if(!cards)continue;const name=String(item?.name||`マイデッキ ${i+1}`).trim().slice(0,24)||`マイデッキ ${i+1}`;out.push({id:String(item?.id||`preset-${Date.now()}-${i}`),name,cards:[...cards]});if(out.length>=MAX_MYLIST)break;}return out;
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
function persistDeck(){safeStorage('local','tiny-deck-v17',JSON.stringify(playerDeck));renderDeckSummaries();}
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
  el('battleHint').textContent=selected?(()=>{const d=UNITS[selected];if(!d.spell){if(d.tunnelAnywhere)return `${d.name}：戦場の好きな地上地点を指定 / コスト ${d.cost}。自軍本拠地から地下移動し、遠いほど到着が遅れます。`;if(d.building)return `${d.name}を配置 / 必要エナジー ${d.cost}。配置前に攻撃射程を表示します。スマホは1回目で位置と射程を固定し、指を離しても候補を保持。2回目で設置。`;return `${d.name}を配置 / 必要エナジー ${d.cost}`;}if(d.spell==='poison')return `${d.name}：地点を指定すると即展開 / コスト ${d.cost}。範囲外へ出ても毒が残ります。`;if(d.spell==='arrowrain')return `${d.name}：広い着弾地点を指定 / コスト ${d.cost}。ファイヤーボールより速く届きます。`;return `${d.name}：着弾地点を指定 / コスト ${d.cost}。遠いほど着弾が遅れます。`;})():'カードを選択。片塔破壊はそのレーン＋中央細帯、両塔破壊後は敵陣前半を横いっぱい使えます。';
}
for(let i=0;i<10;i++){const seg=document.createElement('i'),fill=document.createElement('b');seg.append(fill);el('energyTrack').append(seg);}
function choose(id){
  if(!snapshot||snapshot.phase==='ended')return;
  selected=selected===id?null:id;hover=null;pendingBuildingPlacement=null;updateInspector(id);updateHand();
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
      b.append(cost,key,can,name);el('hand').append(b);
      let startPoint=null,dragged=false;
      b.addEventListener('pointerdown',e=>{
        e.preventDefault();selected=id;hover=null;pendingBuildingPlacement=null;updateInspector(id);updateHand();
        startPoint={x:e.clientX,y:e.clientY};dragged=false;b.setPointerCapture(e.pointerId);
      });
      b.addEventListener('pointermove',e=>{
        if(!startPoint)return;
        if(Math.hypot(e.clientX-startPoint.x,e.clientY-startPoint.y)>7)dragged=true;
        if(dragged)hover=pointFromEvent(e,true);
      });
      b.addEventListener('pointerup',e=>{
        if(dragged&&pointFromEvent(e,true))place(pointFromEvent(e,true));
        startPoint=null;dragged=false;hover=null;
      });
      b.addEventListener('pointercancel',()=>{startPoint=null;dragged=false;hover=null;});
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
  const stats=d.spell?[['COST',d.cost],['AREA',`R${d.radius}`],['DMG',`${d.damage}/${d.buildingDamage}`]]:[['COST',d.cost],['HP',d.hp+(d.count>1?` ×${d.count}`:'')],['DMG',d.damage]];
  for(const [label,value] of stats){const div=document.createElement('div'),s=document.createElement('small'),strong=document.createElement('strong');s.textContent=label;strong.textContent=value;div.append(s,strong);el('inspectorStats').append(div);}
  el('tacticalTip').textContent=d.desc;
}
function pointFromEvent(e,inside=false){
  const r=el('arenaCanvas').getBoundingClientRect(),x=(e.clientX-r.left)/r.width*720,y=(e.clientY-r.top)/r.height*1040;
  if(inside&&(x<0||x>720||y<0||y>1040))return null;
  const p={x:clamp(x,0,720),y:clamp(y,0,1040)},world=orient(p,seat);
  let valid=false;
  if(snapshot&&selected){const players=[{hand:[],energy:0},{hand:[],energy:0}];players[seat]={hand:snapshot.hand,energy:snapshot.energy};valid=!canPlace({...snapshot,players},seat,selected,world.x,world.y);}
  return {...p,valid};
}
el('arenaCanvas').addEventListener('pointermove',e=>{if(selected)hover=pointFromEvent(e);});
el('arenaCanvas').addEventListener('pointerleave',()=>hover=null);
el('arenaCanvas').addEventListener('pointerdown',e=>{
  if(!selected){toast('下のカードを1枚選んでください。');return;}
  e.preventDefault();const p=pointFromEvent(e),d=UNITS[selected];
  const touchLike=e.pointerType==='touch'||(e.pointerType!=='mouse'&&window.matchMedia?.('(pointer: coarse)').matches);
  if(touchLike&&d?.building){
    const pending=pendingBuildingPlacement;
    const same=pending&&pending.card===selected&&Math.hypot(pending.x-p.x,pending.y-p.y)<=24;
    if(!same){
      pendingBuildingPlacement={card:selected,x:p.x,y:p.y,valid:p.valid};
      hover=p;
      toast(p.valid?'設置位置と攻撃射程を保持しました。もう一度同じ場所をタップして設置。':'この位置には置けません。別の場所をタップしてください。');
      return;
    }
    const confirm={x:pending.x,y:pending.y,valid:pending.valid};
    hover=confirm;place(confirm);return;
  }
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
    const mc=document.createElement('canvas');mc.width=120;mc.height=120;mc.dataset.portrait=id;
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
  const can=document.createElement('canvas');can.width=size;can.height=size;can.dataset.portrait=id;return can;
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
function renderDeckEditor(){
  el('deckCount').textContent=`${editingDeck.length} / ${MAX_DECK}`;setDeckError('');if(el('deckAverage'))el('deckAverage').textContent=formatAverage(editingDeck);el('deckSaveBtn').disabled=editingDeck.length!==MAX_DECK;
  el('deckSlots').replaceChildren();
  for(let i=0;i<MAX_DECK;i++){
    const id=editingDeck[i],slot=document.createElement('button');slot.type='button';slot.className='deck-slot '+(id?'filled':'empty');slot.dataset.slot=String(i);
    const n=document.createElement('em');n.textContent=String(i+1);slot.append(n);
    if(id){slot.dataset.card=id;const can=createPortraitCanvas(id);const name=document.createElement('strong');name.textContent=UNITS[id].short;slot.append(can,name);slot.onclick=()=>openDeckCardActions(id);}
    el('deckSlots').append(slot);
  }
  el('deckPool').replaceChildren();
  for(const id of DECK){
    const d=UNITS[id],selected=editingDeck.includes(id),b=document.createElement('button');b.type='button';b.dataset.card=id;b.className='deck-choice'+(selected?' selected':'');
    const can=createPortraitCanvas(id);const cost=document.createElement('span');cost.className='deck-cost';cost.textContent=d.cost;
    const copy=document.createElement('div');copy.className='deck-copy';const h=document.createElement('h3');h.textContent=d.name;const sm=document.createElement('small');sm.textContent=d.role;copy.append(h,sm);b.append(can,cost,copy);
    if(selected){const chk=document.createElement('span');chk.className='deck-check';chk.textContent='DECK';b.append(chk);}b.onclick=()=>openDeckCardActions(id);el('deckPool').append(b);
  }
  renderMyList();
}
function closeDeckCardActions(){el('deckCardActions').hidden=true;el('deckReplacePanel').hidden=true;deckActionId=null;}
function refreshDeckAction(id){
  const d=UNITS[id],inDeck=editingDeck.includes(id);deckActionId=id;el('deckActionName').textContent=d.name;el('deckActionRole').textContent=d.role;el('deckActionCost').textContent=d.cost;drawPortrait(el('deckActionPortrait'),id,performance.now()/1000);
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
function targetLabel(d){return d.targetsAir?'地上＋空中':'地上のみ';}
function detailStatsFor(d){
  if(d.spell)return [['COST',d.cost],['TYPE','SPELL'],['範囲',`R${d.radius}`],['兵ダメージ',d.damage],['建物ダメージ',d.buildingDamage]];
  const dmg=d.laserTower?`${d.laserBaseDps} DPS〜`:d.damage;const interval=d.laserTower?'継続':d.cooldown?`${d.cooldown.toFixed(2).replace(/0+$/,'').replace(/\.$/,'')}秒`:'—';
  const stats=[['COST',d.cost],['HP',`${d.hp}${d.count>1?` ×${d.count}`:''}`],['攻撃',dmg],['攻撃間隔',interval],['射程',d.range],['対象',targetLabel(d)],['移動',d.building?'固定':d.air?`飛行 ${d.speed}`:`地上 ${d.speed}`]];
  if(d.summonType)stats.push(['召喚',`配置時＋${d.summonInterval}秒ごと ×${d.summonCount}`]);
  if(d.spawnType==='blade')stats.push(['編成','前1・後2の3体']);
  return stats;
}
function refreshDetailToggle(){if(!detailCardId)return;const inDeck=editingDeck.includes(detailCardId);el('detailDeckToggleBtn').textContent=inDeck?'デッキから外す':editingDeck.length>=MAX_DECK?'入れ替えて追加':'デッキに入れる';}
function demoReadyCard(g,owner,id){
  const fillers=DECK.filter(k=>k!==id);g.players[owner].hand=[id,...fillers.slice(0,3)];g.players[owner].queue=fillers.slice(3,7);g.players[owner].deck=[id,...fillers.slice(0,7)];g.players[owner].energy=10;
}
function demoDeploy(g,owner,id,x,y){demoReadyCard(g,owner,id);const result=deploy(g,owner,id,x,y);g.players[owner].energy=10;return result;}
function demoDeployUnits(g,owner,id,x,y){
  const before=g.units.length,result=demoDeploy(g,owner,id,x,y);return {result,units:g.units.slice(before)};
}
function demoStageUnit(u,x,y,{hp=null,spawn=0,cd=0}={}){
  if(!u)return null;u.x=x;u.y=y;u.lane=x<360?190:530;u.target=null;u.moving=false;u.spawn=spawn;u.cd=cd;if(Number.isFinite(hp))u.hp=Math.max(1,Math.min(u.maxHp,hp));return u;
}
function createDetailDemo(id){
  const g=createMatch({seed:17000+DECK.indexOf(id),bot:false,difficulty:'normal',decks:[DEFAULT_DECK,DEFAULT_DECK]});g.phase='battle';g.countdown=0;g.time=0;g.bot=false;for(const p of g.players)p.energy=10;
  const d=UNITS[id],lane=530;let label='本番と同じ戦闘ロジックでAUTO実演',scenarioKey='standard',duration=8.5;
  const put=(owner,type,x,y)=>demoDeployUnits(g,owner,type,x,y).units;
  const enemy=(type,x=lane,y=420)=>put(1,type,x,y);
  const own=(type,x=lane,y=650)=>put(0,type,x,y);
  if(d.spell){
    if(id==='poison'){
      const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,505);demoDeploy(g,0,id,lane,500);
      label='高HPのアイアン衛士が毒を通過 → 範囲DoT＋範囲外の残留毒';scenarioKey='poison-zone-linger';duration=10;
    }else if(id==='arrowrain'){
      enemy('mossling',lane,420);enemy('boneswarm',470,410);demoDeploy(g,0,id,lane,455);
      label='密集した小型群体へ着弾予告 → 広範囲一斉ダメージ';scenarioKey='arrowrain-wide-swarm';duration=7;
    }else{
      enemy('knight',lane,420);enemy('archer',485,405);demoDeploy(g,0,id,lane,475);
      label='地上兵＋後衛へ実際の飛翔 → 着弾 → 範囲ダメージ';scenarioKey='fireball-splash';duration=7;
    }
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
    const deployed=own(id,lane,650),summoner=deployed.find(u=>u.type==='necromancer');demoStageUnit(summoner,lane,610);if(summoner)summoner.summonNextAt=6;
    const swarm=enemy('mossling',500,420);swarm.forEach((u,i)=>{demoStageUnit(u,485+(i%3)*32,460+Math.floor(i/3)*30,{cd:1.2});u.damage=0;});
    const bats=enemy('bat',565,420);bats.forEach((u,i)=>{demoStageUnit(u,555+(i%2)*28,470+Math.floor(i/2)*26,{cd:1.2});u.damage=0;});
    label='配置直後にボーン3体 → 地上/空中への範囲魔法 → 6秒後にボーン3体を追加召喚';scenarioKey='necromancer-bone-summon';duration=10.5;
  }else if(id==='darknecro'){
    g.towers.forEach(t=>t.range=0);
    const deployed=own(id,lane,650),summoner=deployed.find(u=>u.type==='darknecro');demoStageUnit(summoner,lane,610);if(summoner)summoner.summonNextAt=5;
    const [guard]=enemy('knight',lane,420);demoStageUnit(guard,lane,500,{cd:1.2});if(guard)guard.damage=0;const bats=enemy('bat',485,420);bats.forEach((u,i)=>{demoStageUnit(u,475+(i%2)*26,485+Math.floor(i/2)*24,{cd:1.2});u.damage=0;});
    label='配置直後にムーンバット2体 → 本体は地上だけを高火力攻撃 → 5秒後にバット2体を追加召喚';scenarioKey='darknecro-bat-summon';duration=9.5;
  }else if(id==='ashsquad'){
    const blades=own(id,lane,650);const deployed=enemy('necromancer',lane,420),summoner=deployed.find(u=>u.type==='necromancer');demoStageUnit(summoner,lane,525,{hp:800,cd:1.5});
    blades.forEach((u,i)=>demoStageUnit(u,lane+(i===0?0:(i===1?-28:28)),i===0?605:635,{spawn:0,cd:.4}));
    label='アッシュ剣士3体を前1・後2の三角陣形で展開 → 召喚系の後衛へ一斉に接近して処理';scenarioKey='ash-squad-triangle-counter';duration=8.5;
  }else if(id==='tigger'){
    demoDeploy(g,0,id,lane,325);label='自軍本拠地から地下潜行 → 敵タワー横へ出現 → 奇襲攻撃';scenarioKey='tigger-burrow';duration=9;
  }else if(id==='lasertower'){
    const [laser]=own(id,lane,650),[golem]=enemy('golem',lane,390);demoStageUnit(laser,lane,650);demoStageUnit(golem,lane,500);
    label='高HPゴーレムを同じ対象のまま照射 → 1.5秒ごとにレーザー火力が倍化';scenarioKey='laser-ramp';duration=11;
  }else if(id==='cannon'){
    const [cannon]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(cannon,lane,650);demoStageUnit(guard,lane,515);
    label='アイアン衛士をロックして防衛。設置後は耐久も毎秒30ずつ自然減衰';scenarioKey='cannon-lock-decay';duration=9;
  }else if(id==='lumina'){
    const [guard]=own('knight',500,650);demoStageUnit(guard,500,625,{hp:Math.round(UNITS.knight.hp*.32)});const [priest]=own(id,555,700);demoStageUnit(priest,555,680);const [blade]=enemy('blade',lane,420);demoStageUnit(blade,515,515);
    label='瀕死に近い味方衛士を実際の回復AIで115ずつ回復';scenarioKey='lumina-heal';duration=8.5;
  }else if(id==='harpy'){
    own(id,lane,650);const swarm=enemy('mossling',lane,420);swarm.forEach((u,i)=>demoStageUnit(u,490+(i%3)*42,455+Math.floor(i/3)*34));
    label='複数の敵を近くに配置 → 雷が最大3体まで連鎖して威力減衰';scenarioKey='harpy-chain';duration=8;
  }else if(id==='frost'){
    const [shaman]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(shaman,lane,650);demoStageUnit(guard,lane,515);
    label='アイアン衛士へ氷弾 → 移動速度62%・攻撃速度72%へ低下';scenarioKey='frost-dual-slow';duration=8.5;
  }else if(id==='nightshade'){
    const [shade]=own(id,lane,650),[guard]=enemy('knight',lane,420);demoStageUnit(shade,lane,650);demoStageUnit(guard,lane,550);
    label='敵を感知 → 0.6秒溜め → 無敵ダッシュ → 2倍の初撃';scenarioKey='nightshade-rush';duration=8;
  }else if(id==='boar'){
    const [boar]=own(id,lane,650);demoStageUnit(boar,lane,700);const swarm=enemy('mossling',lane,420);const spots=[[512,575],[548,555],[528,535],[550,515],[512,495]];swarm.forEach((u,i)=>demoStageUnit(u,...spots[i%spots.length]));
    label='建物へ105px走ってチャージ → 軽量モスリングを押しのけながらタワーへ突撃';scenarioKey='boar-charge-shove';duration=10;
  }else if(id==='mage'||id==='bomber'){
    own(id,lane,650);enemy('mossling',lane,420);label='密集したモスリング隊へ実際の範囲攻撃';scenarioKey=`${id}-splash`;duration=8;
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
  const can=el('cardDetailDemo');can.dataset.demoEngine='live';can.dataset.demoCard=detailCardId;can.dataset.demoScenario=detailDemoScenarioKey;can.dataset.demoTime='0';can.dataset.demoDeathBlast='false';can.dataset.demoMiniGolems='0';can.dataset.demoTowerDamaged='false';can.dataset.demoBonesHit='false';can.dataset.demoMudZone='false';can.dataset.demoMudded='false';can.dataset.demoInitialSummons='0';can.dataset.demoPeriodicSummons='0';updateDetailDemoEvidence(can);drawArena(can,viewMatch(detailDemoGame,0),{time:0,seat:0});
}
function updateDetailDemoEvidence(can){
  if(!detailDemoGame)return;const g=detailDemoGame,events=g.events||[];
  if(events.some(e=>e.type==='death-blast'&&e.unitType==='golem'))detailDemoEvidence.deathBlast=true;
  if(events.some(e=>e.type==='death'&&e.owner===1)&&detailDemoScenarioKey==='golem-death-blast-split')detailDemoEvidence.bonesHit=true;
  const minis=g.units.filter(u=>u.hp>0&&u.type==='mini_golem'&&u.owner===0).length;detailDemoEvidence.miniGolems=Math.max(detailDemoEvidence.miniGolems||0,minis);
  const enemySide=g.towers.find(t=>t.owner===1&&t.kind==='tower'&&t.x===530);if(enemySide&&enemySide.hp<enemySide.maxHp)detailDemoEvidence.towerDamaged=true;
  if((g.zones||[]).some(z=>z.kind==='mud'&&z.remaining>0))detailDemoEvidence.mudZone=true;
  if(g.units.some(u=>u.owner===1&&u.type==='knight'&&(u.mudUntil||0)>g.time))detailDemoEvidence.mudded=true;
  const summonEvents=events.filter(e=>e.type==='summon-spawn'&&e.owner===0);for(const e of summonEvents){if(detailDemoEvidence.seenSummonEvents.has(e.id))continue;detailDemoEvidence.seenSummonEvents.add(e.id);if(e.initial)detailDemoEvidence.initialSummons++;else detailDemoEvidence.periodicSummons++;}
  can.dataset.demoDeathBlast=String(!!detailDemoEvidence.deathBlast);can.dataset.demoMiniGolems=String(detailDemoEvidence.miniGolems||0);can.dataset.demoTowerDamaged=String(!!detailDemoEvidence.towerDamaged);can.dataset.demoBonesHit=String(!!detailDemoEvidence.bonesHit);can.dataset.demoMudZone=String(!!detailDemoEvidence.mudZone);can.dataset.demoMudded=String(!!detailDemoEvidence.mudded);can.dataset.demoInitialSummons=String(detailDemoEvidence.initialSummons||0);can.dataset.demoPeriodicSummons=String(detailDemoEvidence.periodicSummons||0);
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
  const can=document.createElement('canvas');can.width=200;can.height=200;can.dataset.portrait=id;
  const badge=document.createElement('span');badge.className='badge';badge.textContent=d.cost;
  const role=document.createElement('small');role.textContent=d.role;
  const h=document.createElement('h3');h.textContent=d.name;
  const p=document.createElement('p');p.textContent=d.desc;
  const stat=document.createElement('div');stat.className='library-stat';stat.textContent=d.spell?`範囲 R${d.radius}　兵 ${d.damage} / 建物 ${d.buildingDamage}`:`HP ${d.hp}${d.count>1?` ×${d.count}`:''}　攻撃 ${d.damage}`;
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
