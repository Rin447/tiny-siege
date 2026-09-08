# TINY SIEGE v3.0.0 - Test report

今回のv3実装に対して、ローカル制作環境で以下を確認しました。Cloudflare本番サイトへのデプロイはこの環境から行っていません。

| Check | Result | Evidence |
|---|---:|---|
| JavaScript syntax / Worker config | PASS | CHECK_RESULTS.txt |
| Engine / physics / rooms / Worker automated tests | **102 / 102** | UNIT_TEST_RESULTS.txt |
| Native HTTP + WebSocket local server flow | **14 / 14** | NETWORK_TEST_RESULTS.txt |
| v3 browser deck/library/CPU UI flow | **7 / 7** | BROWSER_V3_RESULTS.json |
| Dense physics stress simulation | PASS | STRESS_RESULTS.json |

## v3 coverage

Automated checks include:
- nine unique unit definitions and exact six-card deck validation
- all nine deployment rotations
- Stone Golem ignoring enemy troops and damaging structures only
- four-card hand + six-card deck rotation
- online Ready rejecting invalid decks
- per-player online deck use and hidden opponent deck contents
- server-authoritative placement and owner seat
- ground/air separation, building collision, pathing, rear-facing data and deterministic simulation
- room creation/join, reconnect, surrender, rematch and host promotion
- `/api/config` identifying v3 / nine units / maxDeck six

The v3 Playwright check loads the real self-contained `PLAY-OFFLINE.html` with `set_content`. It verifies a six-unit home deck, nine choices in the deck editor, save rejection at five, save success at six, nine-unit library including Stone Golem, CPU battle start with four hand cards, and no uncaught JavaScript errors across that flow.

## Stress result

The synthetic congestion scene contains 93 units and runs 1,200 simulation steps (120 simulated seconds). It reported zero enemy same-layer overlap in the measured invariant. Timing in `STRESS_RESULTS.json` is only a local Node measurement, not a Cloudflare CPU/quota guarantee.

## Important boundaries

Not verified here: Cloudflare production/workerd behavior, real Internet latency, Windows/phone device-specific rendering, Cloudflare billing/quotas, or live two-browser networking through Cloudflare. After deployment, force-reload both players, create a new room and manually verify separate decks plus Stone Golem behavior.

Browser UI tests use a self-contained offline page and therefore do not prove production browser networking. Native Node HTTP/WebSocket tests exercise the local server networking path separately. Worker platform-service tests use local mocks; they do not establish Cloudflare production compatibility.

## Reproduce

```sh
npm run check
npm test
npm start
# another terminal
npm run test:network
node tests/stress.mjs
python tests/browser-v3.py
npm run build:offline
```
