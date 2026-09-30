import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));

const required=[
  'package.json','wrangler.jsonc','public/index.html','public/_headers',
  'src/game-core.js','src/room-model.js','src/worker.js','server/dev.mjs',
  'scripts/check.mjs','scripts/sync-game-core.mjs','scripts/build-offline.mjs',
  '.github/workflows/ci.yml','README.md'
];

test('GitHub-ready repository contains every deploy/runtime source',()=>{
  for(const rel of required)assert.equal(fs.existsSync(path.join(root,rel)),true,rel);
});

test('generated/distribution-only files are not committed',()=>{
  for(const rel of ['PLAY-OFFLINE.html','node_modules','.wrangler'])assert.equal(fs.existsSync(path.join(root,rel)),false,rel);
});
