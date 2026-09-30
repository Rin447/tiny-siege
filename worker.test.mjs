import test from 'node:test';
import assert from 'node:assert/strict';
import worker from '../src/worker.js';

function env(){
  return {
    ASSETS:{fetch:async req=>new Response(`asset:${new URL(req.url).pathname}`)},
  };
}

test('worker exposes current game config',async()=>{
  const r=await worker.fetch(new Request('https://tiny.example/api/config'),env());
  assert.equal(r.status,200);
  const j=await r.json();
  assert.equal(j.game,'tiny-siege');
  assert.equal(j.version,'46.0.0');
  assert.equal(j.physicsVersion,83);
  assert.equal(j.cards,83);
  assert.equal(j.units,71);
  assert.equal(j.spells,12);
  assert.equal(j.maxDeck,8);
});

test('worker health and static assets work',async()=>{
  const e=env();
  const h=await worker.fetch(new Request('https://tiny.example/health'),e);
  assert.deepEqual(await h.json(),{ok:true});
  const a=await worker.fetch(new Request('https://tiny.example/'),e);
  assert.equal(await a.text(),'asset:/');
});

test('worker rejects unknown API and cross-origin mutation',async()=>{
  const e=env();
  const missing=await worker.fetch(new Request('https://tiny.example/api/missing'),e);
  assert.equal(missing.status,404);
  const bad=await worker.fetch(new Request('https://tiny.example/api/rooms',{method:'POST',headers:{Origin:'https://evil.example','Content-Type':'application/json'},body:'{"name":"Rin"}'}),e);
  assert.equal(bad.status,403);
});
