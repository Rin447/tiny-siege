import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const base=fileURLToPath(new URL('..',import.meta.url));
let count=0;
async function scan(dir){
  for(const e of await fs.readdir(dir,{withFileTypes:true})){
    if(['node_modules','.wrangler','.git'].includes(e.name))continue;
    const p=path.join(dir,e.name);
    if(e.isDirectory())await scan(p);
    else if(/\.(m?js)$/.test(e.name)){
      const r=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
      if(r.status!==0)throw new Error(r.stderr);count++;
    }
  }
}
await scan(base);
const c=JSON.parse(await fs.readFile(path.join(base,'wrangler.jsonc'),'utf8'));
assert.equal(c.name,'tiny-siege','Worker must stay separate from wavelength');
assert.equal(c.assets.directory,'./public');
assert.deepEqual(c.migrations[0].new_sqlite_classes,['BattleRoom']);
assert.equal(c.durable_objects.bindings[0].name,'BATTLES');
console.log(`PASS: ${count} JavaScript files parse; Cloudflare configuration and separate Worker name checked.`);
