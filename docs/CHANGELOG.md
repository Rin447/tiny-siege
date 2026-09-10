# Changelog

## 17.0.0
- Added Necromancer: cost 6, HP 1350, ranged ground/air splash attack, three Bones immediately on deploy and three more every six seconds while alive.
- Added Dark Necromancer: cost 5, HP 1150, stronger ground-only ranged attack, two Moon Bats immediately on deploy and two more every five seconds while alive.
- Added Ash Squad: cost 5 and three real Ash Swordsmen in a front-one/rear-two formation.
- Added a general summon-on-deploy and timed-summon system that creates real existing minion units and respects the battlefield unit cap.
- The full guaranteed first summon wave is reserved during placement, preventing a summoner from being deployed when only the summoner itself would fit.
- Added original procedural art, projectiles and summon effects for both Necromancers and a three-swordsman card portrait for Ash Squad.
- Added dedicated live-engine card-detail scenarios for all three new cards.
- Deck/My List storage moves to v17 keys with v16 fallback migration.
- Raised physicsVersion to 16 for the new authoritative combat mechanics.

## 16.4.0
- Raised Hole-digger Tigger attack from 15 to 20 while keeping cost, HP and burrow travel unchanged.
- Increased Moon Bat deployment from three to four bats with per-bat stats unchanged.
- Reworked special-ability LIVE BATTLE DEMOs around deterministic ability-focused scenarios using the production engine.
- Golem demo now stages a near-death blast at an enemy tower surrounded by Bone Swarm, then shows the two Mini Golem split.
- Mud Dragon demo now attacks a high-HP Iron Guard and demonstrates a real mud zone, movement slow and periodic damage.
- Improved scenarios for charge/shove, healing, frost slow, chain lightning, ramping laser and spells.
- Raised physicsVersion to 15 because battle balance changed.
- Patch Notes groups 16.4.0 with the existing v16 update series.

## 16.3.0
- Fixed My List registration by removing the blocking save-name prompt and using immediate automatic names.
- Added verified persistent storage with legacy-array migration and session/memory fallback.
- Replaced illustrative card detail demos with live engine-driven battle scenarios using the production match/deploy/tick/view/draw pipeline.
- Added per-card demo scenarios and replay control.
- Patch Notes groups 16.3.0 with the existing v16 update series.

## 16.2.0
- Three-column deck builder, card action sheet, optional details, sticky deck and up to ten My List presets.

## 16.1.0
- Viewer-relative spell team colors.

## 16.0.0
- Mud Dragon/Blowdart balance and persistent mobile building placement.
