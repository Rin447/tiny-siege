import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {DECK} from '../src/game-core.js';
const port=32000+(process.pid%10000);
const base=`http://127.0.0.1:${port}`;
const child=spawn(process.execPath,['server/dev.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,PORT:String(port),HOST:'127.0.0.1'},stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',b=>logs+=b);child.stderr.on('data',b=>logs+=b);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function waitHealth(){
  const until=Date.now()+10_000;
  while(Date.now()<until){
    try{const r=await fetch(base+'/health');if(r.ok)return;}catch{}
    await sleep(80);
  }
  throw new Error('Local server did not start. '+logs);
}
async function post(path,data){
  const r=await fetch(base+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});
  return {status:r.status,body:await r.json()};
}
async function waitFor(fn,message){
  const until=Date.now()+7_000;
  while(Date.now()<until){if(fn())return;await sleep(40);}
  throw new Error('Timeout: '+message);
}
let ws;
try{
  await waitHealth();
  const cfg=await (await fetch(base+'/api/config')).json();
  assert.equal(cfg.version,'46.0.0');assert.equal(cfg.cards,83);assert.equal(cfg.physicsVersion,83);
  assert.equal((await fetch(base+'/')).status,200);
  assert.equal((await fetch(base+'/index.html')).status,200);

  const host=await post('/api/rooms',{name:'Rin'});assert.equal(host.status,200);assert.match(host.body.code,/^\d{6}$/);
  const guest=await post(`/api/rooms/${host.body.code}/join`,{name:'Taro'});assert.equal(guest.status,200);

  const messages=[];
  ws=new WebSocket(`ws://127.0.0.1:${port}/api/rooms/${host.body.code}/socket`);
  ws.addEventListener('message',e=>messages.push(JSON.parse(e.data)));
  await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true});});
  ws.send(JSON.stringify({type:'hello',token:host.body.token}));
  await waitFor(()=>messages.some(m=>m.type==='state'),'authenticated state');
  const state=messages.find(m=>m.type==='state');
  assert.equal(state.seat,0);
  assert.equal(JSON.stringify(state).includes(guest.body.token),false);
  ws.send(JSON.stringify({type:'ready',ready:true,deck:DECK.slice(0,8)}));
  await waitFor(()=>messages.some(m=>m.type==='state'&&m.members?.[0]?.ready),'ready state');
  console.log('PASS: local HTTP/WebSocket smoke test');
} finally {
  try{ws?.close();}catch{}
  child.kill('SIGTERM');
  await Promise.race([new Promise(r=>child.once('exit',r)),sleep(1500)]);
  if(child.exitCode===null)child.kill('SIGKILL');
}
