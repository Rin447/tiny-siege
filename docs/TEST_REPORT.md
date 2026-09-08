# TINY SIEGE v2.0.0 - Test report

今回の実装を使って、次の検証を実施しました。公開サイトの更新は行っていません。

| Check | Result | Evidence |
|---|---:|---|
| JavaScript syntax / Worker config | PASS | CHECK_RESULTS.txt |
| Core, rooms, Worker mocks, new collision/facing tests | 99 / 99 | UNIT_TEST_RESULTS.txt |
| Native HTTP + Node WebSocket clients against actual local server | 14 / 14 | NETWORK_TEST_RESULTS.txt |
| Existing browser UI flow on updated code | 15 / 15 | BROWSER_TEST_RESULTS.json |
| v2-specific browser controls / rendering / placement | 12 / 12 | BROWSER_V2_RESULTS.json |
| Dense battle, terrain safety, opposing-body non-overlap | PASS | STRESS_RESULTS.json |

## Collision/facing coverage

The 41 new automated physics tests include all six ground troop types navigating behind their own tower and crossing the bridge, for both seats; full-radius river banks; valid bat group spawning; spawn safety before resource charges; non-moving cannon placement; air/ground separation; allied inverse-mass yielding; opposing-body swept contacts; cannon/tower solidity; paths around live structures; removal of destroyed structures; no NaN at coincident fixture positions; heading hysteresis; facing toward rear attack targets; correct viewer-seat reversal; merged tower/ground draw order and air-on-top; sanitized authoritative snapshots; safe termination of legacy matches; deterministic save/restore; and a mixed-army match.

## Dense-scene performance (local Node only)

A synthetic zero-damage scene contains 93 units and runs 1,200 simulation steps (120 simulated seconds). Full-body river and building constraints were checked every step. Maximum opposing-layer-matched body overlap: 0.0000 world units.

Mean tick: 11.81 ms; p95: 15.73 ms; largest observed tick: 144.69 ms. These are measurements on the authoring container, NOT Cloudflare CPU-budget, browser, real-device or Internet-latency guarantees. The first navigation pass is more expensive than cached steady-state passes. Extreme congestion can still queue units by design.

## Important boundaries

未検証: Cloudflare本番、Wrangler/workerd、Windows実機、スマホ実機、実際のインターネット越しの遅延、課金量。公開後に2人で確認してください。

The authoring environment blocks Chromium navigation to local HTTP URLs. Browser tests load the actual self-contained HTML using `set_content`. Online browser UI tests replace only transport via a Python bridge into the real Node HTTP/WebSocket server. The simulation and server permission checks are NOT mocked in those browser tests. Separate native Node WebSocket tests directly access the local server. Tests of Cloudflare entrypoints use mocks for platform services; they do not establish workerd compatibility. Installing Wrangler dependencies timed out in this environment; no dry-run or live deployment is claimed.

Test instrumentation is only in `tests/`; no public game file exposes test hooks. Previews use locally simulated fixture states. `09-front-back-comparison.png` is a comparison sheet from the real renderer, not a new in-game comparison-page feature. The actual roster has a front/rear toggle.

## Reproduce

```sh
npm run check
npm test
npm start
# In another terminal:
npm run test:network
node tests/stress.mjs
python tests/browser-e2e.py
python tests/browser-v2.py
```

Browser tests additionally require Python Playwright, aiohttp, websockets, and Chromium. `CHROMIUM` can override the browser executable; `TEST_URL` can override the local server URL. Rebuild the standalone practice file after source edits with `npm run build:offline`.
