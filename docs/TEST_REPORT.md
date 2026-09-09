# TINY SIEGE v9 test report

Local development verification completed on the generated v9 package.

## Automated unit/integration tests

- **133 / 133 passed** with Node's test runner.
- Dedicated v9 assertions cover:
  - 17 selectable cards = 16 units + 1 spell, six-card decks.
  - Stone Golem HP 2850 while cost 8, attack 288, split and death blast remain.
  - Iron Guard cost 4 while HP 1850 and attack 98 remain.
  - Kragg Berserker cost 6 / HP 1950 / attack 360 / speed 32 / ground-only targeting / heavier mass than Iron Guard.
  - Existing Fireball, split Golem, Shadow Rush, healing, slow, chain lightning, building collision and frontline rules remain covered.

## Real local HTTP + WebSocket flow

- **14 / 14 passed** against a fresh local Node server on a dedicated port.
- Verified config/static assets, room create/join, two native WebSocket clients, ready/start, authoritative placement synchronization, v9 metadata, invalid territory rejection, reconnect, surrender/rematch, host migration and cross-origin mutation rejection.

## Browser UI flow

- **5 / 5 passed** in local headless Chromium using the self-contained offline build.
- Verified six-card deck summary, all 17 selectable cards, v9 balance text and Kragg Berserker, CPU battle startup, and no uncaught JavaScript errors.

## Congestion stress simulation

- 35 active units, 300 steps / 30 simulated seconds.
- Max enemy contact residual: about **0.039 px**, within the test's 0.05 px sub-pixel tolerance.
- This is a synthetic local test, not a Cloudflare CPU/quota benchmark.

## Environment limitation

Cloudflare production, Wrangler's hosted build environment, and the user's actual Windows/mobile devices were not executed from this environment. After deployment, verify `/api/config`, force-refresh both clients, and create a new room because `physicsVersion` changed to 7.
