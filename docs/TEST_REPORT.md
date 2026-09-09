# TINY SIEGE v15 Test Report

This report summarizes local verification for v15.0.0. Cloudflare production deployment and two-device production play are not performed in this environment.

## Automated checks

- Unit / integration tests: **155 / 155 passed**
- Static JavaScript/config check: **PASS**
- Local HTTP / WebSocket integration: **14 / 14 passed**
- Browser UI checks: **6 / 6 passed**

## v15 feature verification

### マッドドラゴン調整
- Cost 5 / HP 2000 / damage 200 remain unchanged.
- Attack acquisition range reduced from 155 to **78**.
- Splash radius 45 and 2-second ground-only mud zone remain unchanged.
- Mud still applies 30 damage every 0.5 seconds and 30% movement slow to ground non-building units only.

### 穴掘りティガー調整
- Cost 3 / HP 1100 remain unchanged.
- Attack reduced from 30 to **15**.
- Underground travel is slowed to roughly **0.9–2.8 seconds** based on distance from the player's central core.
- Burrowing remains completely untargetable and immune until surfacing.

### 吹き矢ゴブリン
- Cost **3** / HP **240** / damage **110**.
- Attack interval **0.5 seconds** (about 220 single-target DPS while continuously firing).
- Attack range **220**, intentionally near but below defensive tower range.
- Targets both **ground and air** units.
- No special ability; strength comes from long range and fast firing, balanced by very low HP.

### レーザー塔
- Cost **5** / HP **2000** / attack range **220**.
- Building; targets both **ground and air**.
- Uses the existing defensive-structure target-lock rule.
- Initial continuous laser DPS: **20**.
- While retaining the same target, DPS doubles every **1.5 seconds**: 20 → 40 → 80 → 160 → ... with no explicit cap.
- Target death, leaving range, or becoming untargetable causes retargeting and resets laser DPS to 20.
- Existing generic building-range preview exposes the Laser Tower's R220 placement range.

## Regression verification

- **24 total cards: 21 units + 3 spells**.
- 8-card decks and 4-card hands preserved.
- Average energy-cost display preserved.
- Tower/core/Bolt Cannon target-lock behavior preserved.
- Tigger global destination placement, Fireball, Poison Trap, Arrow Rain, Stone Golem split/death blast, Nightshade Shadow Rush, frontline deployment and central-core wake rules preserved.
- Recent 7-day patch notes / アプデ情報 include v15.
- Compatibility contract advanced to **physicsVersion 13**.

## Local transport fix verified

The zero-dependency local Node WebSocket parser was corrected for an RFC6455 edge case where an extended-length payload whose decoded size was exactly 127 bytes could be mistaken for the 64-bit length marker. This surfaced because the new eight-card recommended deck made the ready message exactly 127 bytes. The local HTTP/WebSocket suite now passes all 14 checks. Cloudflare Workers uses the platform WebSocket implementation and was not dependent on this local parser.

## Stress simulation

- 45 active units
- 300 simulation steps / roughly 30 seconds
- Maximum unintended enemy-body overlap observed: **0 px**
- Mean local simulation step: about **4.14 ms**
- p95 local simulation step: about **6.03 ms**

Local Node timing is environment-specific and is not a Cloudflare production benchmark.
