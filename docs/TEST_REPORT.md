# TINY SIEGE v5 test report

Local development verification completed on the generated v5 package.

## Automated Node tests

- 116 / 116 passed.
- Includes the 15-card library, 6-card deck rotation, all previous combat/room/worker checks, Lumina healing, Frost slow/charge disruption, Harpy chain lightning, and Iron Boar lightweight shove through bridge congestion.

## Real local HTTP/WebSocket integration

- 14 / 14 passed against the local Node server on an alternate port.
- Covers `/api/config`, static modules, room create/join, two native WebSockets, deck readiness, authoritative synchronized placement, reconnect, surrender/rematch, host migration and origin rejection.

## Browser UI

- 6 / 6 passed using local Chromium and the self-contained offline build.
- Confirmed six saved deck slots, 15 choices, v5 recommended deck, 15-unit front/back library, CPU battle startup and no uncaught JavaScript errors in the tested flow.

## Synthetic congestion

- 40-unit / 30-second zero-damage synthetic run completed with finite coordinates and no static-obstacle penetration. This is a local Node synthetic test, not a Cloudflare CPU/quota benchmark.

## Limits of this verification

Cloudflare production, the user's Windows PCs, mobile browsers and real Internet latency have not been executed from this environment. After deployment, force-reload both clients and create a fresh room before judging online behavior.
