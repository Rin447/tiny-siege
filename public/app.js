import {VERSION,ARENA,UNITS,DECK,DEFAULT_DECK,MAX_DECK,normalizeDeck} from './game/units.js';
import {createMatch,tick,runBot,deploy,viewMatch,clamp,canPlace} from './game/engine.js';
import {drawArena,drawPortrait,orient} from './game/art.js';

const $=s=>document.querySelector(s);
const el=id=>document.getElementById(id);
const views=['home','lobby','battle'];
let currentView='home',selected=null,hover=null,inspectId='blade',snapshot=null,previous=null,receivedAt=0;
let room=null,seat=0,session=null,socket=null,socketGeneration=0,connected=false,retryTimer=null,retries=0,pingTimer=null;
let localGame=null,localTimer=null,lastLocal=0,localPaused=false,gameMode=null,difficulty='normal',entryTab='create';
let demoGame=createMatch({seed:48164,bot:true}),demoLast=0,demoAutoAt=0,animationLast=0;
let handSignature='',memberSignature='',lobbyCode='',previousPhase='',soundOn=false,audio=null,toastTimer;
let serverAvailable=false,apiChecked=false,onlineBusy=false;
let physicsOverlay=false,rosterBack=false,incompatibleVersion=false,editingDeck=[];
const standalone=!!window.TINY_OFFLINE||location.protocol==='file:';
function safeStorage(store,key,value){
  try{const storage=store==='session'?window.sessionStorage:window.localStorage;
    if(value===undefined)return storage.getItem(key);if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{}
  return null;
}
const remembered=safeStorage('local','tiny-name');if(remembered)el('nickname').value=remembered;
soundOn=safeStorage('local','tiny-sound')==='true';
function loadDeck(){
  try{const raw=JSON.parse(safeStorage('local','tiny-deck-v5')||safeStorage('local','tiny-deck-v4')||safeStorage('local','tiny-deck-v3')||'null');return normalizeDeck(raw);}catch{return [...DEFAULT_DECK];}
}
let playerDeck=loadDeck();
function persistDeck(){safeStorage('local','tiny-deck-v5',JSON.stringify(playerDeck));renderDeckSummaries();}
function deckReady(deck=playerDeck){return Array.isArray(deck)&&deck.length===MAX_DECK&&new Set(deck).size===MAX_DECK&&deck.every(id=>Object.hasOwn(UNITS,id));}
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
  if(id!=='battle'){selected=null;hover=null;}
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
    if(m.type==='placed'){selected=null;hover=null;sound('place');updateHand();return;}
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
el('readyBtn').addEventListener('click',()=>{const next=!room?.members[seat]?.ready;if(next&&!deckReady()){openDeckEditor();toast('対戦には6体のデッキが必要です。');return;}send({type:'ready',ready:next,deck:next?[...playerDeck]:undefined});});
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
  if(!deckReady()){openDeckEditor();entryError('対戦には6体のデッキが必要です。');return;}
  localGame=createMatch({seed:crypto.getRandomValues(new Uint32Array(1))[0],bot:true,difficulty,decks:[playerDeck,DEFAULT_DECK]});
  snapshot=viewMatch(localGame,0);selected=null;hover=null;localPaused=false;
  el('matchType').textContent='CPU PRACTICE · '+({easy:'EASY',normal:'NORMAL',hard:'HARD'}[difficulty]);
  el('ownName').textContent=name;el('enemyName').textContent='CPU · '+({easy:'やさしい',normal:'ふつう',hard:'手ごわい'}[difficulty]);
  showView('battle');status('CPU練習中');lastLocal=performance.now();
  localTimer=setInterval(()=>{
    const now=performance.now();
    localPaused=document.hidden||el('helpModal').open||el('libraryModal').open||el('deckModal').open;
    if(!localPaused&&localGame&&localGame.phase!=='ended'){
      tick(localGame,.1);acceptSnapshot(viewMatch(localGame,0));
    }
    lastLocal=now;updateHUD();
  },100);
  updateInspector('blade');acceptSnapshot(snapshot);sound('start');
}
el('practiceBtn').addEventListener('click',startPractice);
function stopPractice(){clearInterval(localTimer);localTimer=null;localGame=null;snapshot=null;gameMode=null;selected=null;hover=null;showView('home');status(serverAvailable?'オンライン対応':'CPU練習が使えます');}
function acceptSnapshot(g){
  previous=snapshot;snapshot=g;receivedAt=performance.now();
  if(previousPhase!==g.phase){
    if(g.phase==='battle')sound('start');
    if(g.phase==='ended')sound(g.winner===seat?'win':'lose');
    previousPhase=g.phase;
  }
  if(selected&&!g.hand.includes(selected)){selected=null;hover=null;}
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
  el('battleHint').textContent=selected?`${UNITS[selected].name}を配置 / 必要エナジー ${UNITS[selected].cost}`:'カードを選んで、自分の陣地に配置してください。';
}
for(let i=0;i<10;i++){const seg=document.createElement('i'),fill=document.createElement('b');seg.append(fill);el('energyTrack').append(seg);}
function choose(id){
  if(!snapshot||snapshot.phase==='ended')return;
  selected=selected===id?null:id;hover=null;updateInspector(id);updateHand();
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
        e.preventDefault();selected=id;hover=null;updateInspector(id);updateHand();
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
  for(const [label,value] of [['COST',d.cost],['HP',d.hp+(d.count>1?` ×${d.count}`:'')],['DMG',d.damage]]){
    const div=document.createElement('div'),s=document.createElement('small'),strong=document.createElement('strong');s.textContent=label;strong.textContent=value;div.append(s,strong);el('inspectorStats').append(div);
  }
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
el('arenaCanvas').addEventListener('pointerdown',e=>{if(selected){e.preventDefault();place(pointFromEvent(e));}else toast('下のカードを1枚選んでください。');});
function place(p){
  if(!selected||!p||!snapshot||snapshot.phase!=='battle')return;
  const pos=orient(p,seat);
  if(gameMode==='cpu'){
    const r=deploy(localGame,0,selected,pos.x,pos.y);
    if(!r.ok){toast(r.error);return;}
    sound('place');selected=null;hover=null;acceptSnapshot(viewMatch(localGame,0));
  }else send({type:'deploy',card:selected,x:pos.x,y:pos.y});
}
document.addEventListener('keydown',e=>{
  if(currentView!=='battle'||['INPUT','TEXTAREA'].includes(document.activeElement.tagName)||el('helpModal').open||el('libraryModal').open||el('deckModal').open)return;
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
}
function renderDeckEditor(){
  el('deckCount').textContent=`${editingDeck.length} / ${MAX_DECK}`;el('deckError').hidden=true;
  el('deckSaveBtn').disabled=editingDeck.length!==MAX_DECK;
  el('deckSlots').replaceChildren();
  for(let i=0;i<MAX_DECK;i++){
    const id=editingDeck[i],slot=document.createElement('button');slot.type='button';slot.className='deck-slot '+(id?'filled':'empty');
    const n=document.createElement('em');n.textContent=String(i+1);slot.append(n);
    if(id){const can=document.createElement('canvas');can.width=120;can.height=120;can.dataset.portrait=id;const name=document.createElement('strong');name.textContent=UNITS[id].short;slot.append(can,name);slot.onclick=()=>{editingDeck.splice(i,1);renderDeckEditor();};}
    el('deckSlots').append(slot);
  }
  el('deckPool').replaceChildren();
  for(const id of DECK){
    const d=UNITS[id],selected=editingDeck.includes(id),b=document.createElement('button');b.type='button';b.className='deck-choice'+(selected?' selected':'');
    const can=document.createElement('canvas');can.width=120;can.height=120;can.dataset.portrait=id;
    const cost=document.createElement('span');cost.className='deck-cost';cost.textContent=d.cost;
    const copy=document.createElement('div');copy.className='deck-copy';const h=document.createElement('h3');h.textContent=d.name;const sm=document.createElement('small');sm.textContent=d.role;const desc=document.createElement('p');desc.textContent=d.desc;copy.append(h,sm,desc);b.append(can,cost,copy);
    if(selected){const chk=document.createElement('span');chk.className='deck-check';chk.textContent='選択中';b.append(chk);}
    b.onclick=()=>{const at=editingDeck.indexOf(id);if(at>=0)editingDeck.splice(at,1);else if(editingDeck.length<MAX_DECK)editingDeck.push(id);else{el('deckError').textContent='デッキは最大6体です。1体外してから追加してください。';el('deckError').hidden=false;return;}renderDeckEditor();};
    el('deckPool').append(b);
  }
}
function openDeckEditor(){
  if(currentView==='battle'&&snapshot?.phase!=='ended'){toast('対戦中はデッキを変更できません。');return;}
  editingDeck=[...playerDeck];renderDeckEditor();el('deckModal').showModal();
}
el('deckBtn').onclick=openDeckEditor;el('homeDeckBtn').onclick=openDeckEditor;el('lobbyDeckBtn').onclick=()=>{if(room?.members[seat]?.ready){toast('準備OKを取り消してから編集してください。');return;}openDeckEditor();};
el('deckDefaultBtn').onclick=()=>{editingDeck=[...DEFAULT_DECK];renderDeckEditor();};
el('deckSaveBtn').onclick=()=>{if(!deckReady(editingDeck)){el('deckError').textContent='対戦に使う6体を選んでください。';el('deckError').hidden=false;return;}playerDeck=[...editingDeck];persistDeck();el('deckModal').close();toast('デッキを保存しました。');};
el('libraryBtn').onclick=()=>{el('libraryModal').showModal();};
el('helpBtn').onclick=()=>{el('helpModal').showModal();};
for(const b of document.querySelectorAll('.close-modal'))b.onclick=()=>b.closest('dialog').close();
for(const dlg of document.querySelectorAll('dialog'))dlg.addEventListener('close',()=>{
  if(gameMode==='cpu'){localPaused=document.hidden||el('helpModal').open||el('libraryModal').open||el('deckModal').open;updateHUD();}
});
for(const dlg of document.querySelectorAll('dialog'))dlg.addEventListener('click',e=>{const r=dlg.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dlg.close();});
for(const id of DECK){
  const d=UNITS[id],card=document.createElement('article');card.className='library-card';
  const can=document.createElement('canvas');can.width=200;can.height=200;can.dataset.portrait=id;
  const badge=document.createElement('span');badge.className='badge';badge.textContent=d.cost;
  const role=document.createElement('small');role.textContent=d.role;
  const h=document.createElement('h3');h.textContent=d.name;
  const p=document.createElement('p');p.textContent=d.desc;
  const stat=document.createElement('div');stat.className='library-stat';stat.textContent=`HP ${d.hp}${d.count>1?` ×${d.count}`:''}　攻撃 ${d.damage}`;
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
    drawArena(el('arenaCanvas'),interpolate(snapshot,now),{time,seat,selected,ghost:hover,physics:physicsOverlay});
    if(window.innerWidth>800)drawPortrait(el('inspectorCanvas'),inspectId,time);
  }
  if(now%200<36||currentView==='battle'){
    for(const can of document.querySelectorAll('canvas[data-portrait]'))if(can.getClientRects().length)drawPortrait(can,can.dataset.portrait,time,0,false,rosterBack&&!!can.closest('#libraryModal'));
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
