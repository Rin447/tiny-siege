# TINY SIEGE v21.0.0 Test Report

## Build

- Version: **21.0.0**
- Cards: **33** (29 selectable unit cards + 4 spells)
- Deck size: **8**
- Physics version: **26**
- Update pages: **1 cumulative HTML** (`UPDATE-HISTORY.html`)

## Automated tests

- JavaScript/config check: **PASS** (17 JavaScript files parsed)
- Node test suite: **194 / 194 PASS**
- Network/WebSocket suite: **14 / 14 PASS**
- Browser flow: **14 / 14 PASS**, no uncaught JavaScript errors
- Offline self-contained HTML build: **PASS**
- Synthetic congestion stress test: **PASS**

## v21.0 coverage

- New **Laser Dragon**: 5 cost / HP1300 / flying / ground+air targeting / speed46 / range145 / normal cost-5 1.2-second summon delay.
- Laser Dragon uses the Laser Tower ramp rule: **20 DPS base**, doubling every **1.5 seconds** while continuously attacking the same target.
- The mobile laser commits its target when the beam actually starts, follows the first-attack-lock rule, resets ramp when out of range, and can move back into medium range.
- Stun resets Laser Dragon ramp and target lock just like the existing Laser Tower reset path.
- **Ordinary attack cooldowns are frozen during stun without being reset.** After stun, units, towers and placed structures resume from the remaining cooldown they had before the stun.
- Existing special stun effects remain: Sparky charge reset, laser ramp reset, and Nightshade rush cancellation.
- Browser tests verify the Laser Dragon card/detail/live demo, current deck count, My List v21 storage, Patch Notes and CPU-practice startup.
- Network snapshots identify **v21.0 / physicsVersion 26** and remain synchronized between both seats.

## Stress result

Synthetic local Node congestion run: **48 units**, 300 steps / 30 simulated seconds, mean ~24.32 ms, p95 ~39.06 ms, max frame ~122.91 ms, max enemy overlap ~0.02323. This is a local synthetic test, not a Cloudflare CPU/quota benchmark.

`/api/config` is verified as **v21.0.0 / 33 cards / 29 selectable unit cards / 4 spells / physicsVersion 26 / maxDeck 8**.
