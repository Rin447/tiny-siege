import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('..',import.meta.url));
const sync=spawnSync(process.execPath,[path.join(base,'scripts','sync-game-core.mjs')],{encoding:'utf8'});
if(sync.status!==0)throw new Error(sync.stderr||sync.stdout);
let count=0;
async function scan(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    if(['node_modules','.wrangler','.git'].includes(e.name))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())await scan(p);
    else if(/\.(m?js)$/.test(e.name)){
      const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
      if(r.status!==0)throw new Error(`${p}\n${r.stderr}`);count++;
    }
  }
}
await scan(base);
const c=JSON.parse(await fs.readFile(path.join(base,'wrangler.jsonc'),'utf8'));
assert.equal(c.name,'tiny-siege');
assert.equal(c.assets.directory,'./public');
assert.deepEqual(c.migrations[0].new_sqlite_classes,['BattleRoom']);
assert.equal(c.durable_objects.bindings[0].name,'BATTLES');
const html=await fs.readFile(path.join(base,'public','index.html'),'utf8');
assert.match(html,/const VERSION = '46\.0\.0'/);
assert.match(html,/hunter:\{id:'hunter'/);
assert.match(html,/rocket:\{id:'rocket'/);
console.log(`PASS: ${count} JavaScript files parse; v46 source, Cloudflare config and current cards checked.`);
