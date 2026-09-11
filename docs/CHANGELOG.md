# Changelog

## 21.0.0 - LASER DRAGON UPDATE (2026-09-11)
- Added レーザードラゴン: cost 5, HP 1300, flying, ground/air targeting, speed 46, range 145.
- Mobile laser uses the Laser Tower ramp rule: 20 DPS base and doubles every 1.5 seconds on the same target; retarget, range loss, and stun reset the ramp.
- Stun now freezes ordinary attack cooldown progress for units, towers, and buildings without resetting the remaining cooldown.
- Existing special stun resets remain for Sparky charge, laser ramp, and Nightshade rush.
- Card pool is now 33 cards (29 units + 4 spells); physicsVersion 26.

## 20.0.0 - ELECTRIC FORMATION UPDATE (2026-09-11)
- Added エレキテルウィザード: cost 4, HP 650, damage 135, range 185, cooldown 2.4s, radius 35 splash, ground/air targeting, and 1s stun to every enemy unit caught in the splash.
- Goblin Spear range 21 -> 160 and changed to a thrown-spear projectile; it remains HP155 / damage45 / speed72 / 0.8s and can target ground and air.
- Storm Harpy attack interval 1.25 -> 2.0s and fixed chain damage to 180 -> 130 -> 90 while retaining 1s stun on each chained target.
- Selectable pool is now 32 cards: 28 unit cards + 4 spells.
- physicsVersion 25.
- Update notes continue to use the single `UPDATE-HISTORY.html` file.

## 19.4.0 - CONTROL & GOBLIN UPDATE (2026-09-11)
- 穴掘りティガー: ユニットへの通常攻撃120、タワー・設置物には70へ分離。攻撃間隔1.1秒は維持。
- フロストシャーマン: 4→3コスト、氷弾を半径38の小範囲へ拡張。
- フロスト鈍足を3段階重複制へ変更。効果中の再被弾でLv1→Lv2→Lv3、命中のたび3秒へ更新。移動速度係数80%/65%/50%、攻撃速度係数90%/80%/70%。
- ストームハーピー: 連鎖雷の各命中先へ1秒スタン。ザップと同じターゲット・レーザー・スパーキー・ダッシュのリセット処理を利用。
- モスリング隊をゴブリン部隊へ改名。前衛ゴブリン3体（攻撃65）＋ゴブリン槍兵2体（HP155/攻撃45/速度72/0.8秒、地上＋空中）へ変更。
- バージョン別UPDATE HTMLを廃止し、`UPDATE-HISTORY.html` 1枚へ統合。
- physicsVersion 24.

## 19.3.0 - SUMMON DELAY SYSTEM (2026-09-11)
- Added cost-based deployment/summon delay: cost 1=0.4s, 2=0.5s, 3=0.7s, 4=0.9s, 5=1.2s, 6=1.5s, 7=1.8s.
- Stone Golem uses a 2.5s special delay and Sparky uses 1.8s; Tigger keeps burrow travel as its only deployment delay.
- Directly deployed units are untargetable, damage-immune and collision-disabled while summoning.
- The arena now shows team-colored summon/construction circles, translucent unit silhouettes and progress bars visible to both players.
- Summon-on-deploy abilities fire when the parent finishes summoning. Ability minions and split mini golems do not receive an extra summon delay.
- Buildings retain one-tap placement and begin their construction delay immediately after the tap.
- 召喚完了直後の密集安定性のため、衝突解決パスを6回から8回へ増加。
- physicsVersion 23.

## 19.2.0 - RAPTOR BALANCE & QUICK PLACE (2026-09-11)
- Dosranboss: cost 6, HP 1100, damage 170, speed 40, smaller battle sprite.
- Dosranboss summons three Ranbos immediately on deploy, then every 10 seconds after a 3-second summon channel.
- Iron Boar damage 178 -> 160.
- Necromancer splash radius 54 -> 45.
- Tigger damage 20 -> 40 and attack interval 0.82 -> 1.1 seconds.
- Touch building placement now deploys on the first battlefield tap.
- physicsVersion 22.

## 19.1.0 - 2D RAPTOR MODEL UPDATE (2026-09-11)
- ドスランボスとランボスを、3D由来の縦シルエットを持つ2Dドット風モデルへ再設計。
- ドスランボスを 6コスト / HP1100 / 攻撃170 / やや速い移動 / やや遅い攻撃速度 に調整。
- ランボスを本体の約1/3性能（HP360 / 攻撃58）へ再調整。
- physicsVersion 21.

## 19.0.0 - RAPTOR PACK UPDATE (2026-09-11)
- 新ユニット「ドスランボス」と召喚子分「ランボス」を追加。
- 初期実装のドスランボスは7コスト / HP2100 / 攻撃210 / 移動68。10秒ごとに3秒停止してランボス3体を召喚。
- 初期実装のランボスはHP700 / 攻撃70。
- physicsVersion 20.

## 18.3.0 - FIRST ATTACK LOCK (2026-09-11)

- 通常ユニットは索敵だけではハードロックせず、最初の攻撃が成立するまでは毎フレーム最寄りの攻撃可能な敵へターゲットを更新。
- 最初の通常攻撃・投射攻撃・スパーキー砲撃、またはナイトシェイドの突進開始時にターゲットロックを確定。
- 攻撃後はv18.2と同様、対象死亡・攻撃対象外・ザップ等のリセットまで同じ敵を追跡。
- 建物特攻ユニットはロックせず常時最寄り建物を再判定する仕様を維持。
- ナイトシェイドの溜め中も攻撃前扱いとし、より近い突進可能な敵が現れた場合は対象を更新。
- タワー・防衛建物のロック仕様は変更なし。
- 新しい追跡切替で密集時の経路が変わるため、衝突解決パスを5から6へ増やして敵同士の重なりを抑制。
- 対戦ロジック変更に伴い `physicsVersion` を18から19へ更新。

## 18.2.0 - TARGET LOCK TACTICS (2026-09-11)

- 通常ユニットにハードターゲットロックを追加。索敵範囲で取得した対象は、より近い敵が現れても変更しない。
- 移動ユニットは対象が射程・索敵範囲外へ出ても同じ対象を追跡。対象死亡・攻撃対象外・ザップで解除。
- 建物特攻ユニットはロックせず、現在地から最も近い敵建物を常時再判定。中央本拠地も距離次第で選択可能。
- タワー・防衛建物の既存ロック仕様は維持。
- ザップで通常ユニットのロックも解除。
- 対戦ロジック変更に伴い `physicsVersion` を17から18へ更新。

## 18.1.0 - DETAIL DEMO RENDER FIX (2026-09-10)

- Fixed the Sparky LIVE BATTLE DEMO throwing during sparkblast rendering after the first charged shot.
- Replaced the undefined projectile animation variable with drawArena's `time` value.
- Reset the canvas transform at the start of every frame and protect projectile save/restore with `try/finally`, preventing rotated/scaled frames from accumulating after a render error.
- Gameplay stats and authoritative combat logic are unchanged; physicsVersion remains 17.

## 18.0.0 - LONGSHOT & VOLTAGE (2026-09-10)

- Added Princess Archer: cost 3, HP 300, damage 275 every 3 seconds, range 350, radius 70 splash, ground/air targeting. She can attack an enemy side tower from the player's side of the river and dies to Arrow Rain.
- Added Zap: cost 2, radius 78, 225 damage and 1.5 second stun. Zap clears current targets, resets Laser Tower ramping, and resets Sparky charge.
- Added Sparky: cost 6, HP 1500, ground-only 1200 damage with radius 90 splash and range 145. It charges continuously for 3.5 seconds even without a target, waits at full charge, and restarts charging after firing or after Zap.
- Rune Mage cost 4 -> 3. Leaf Archer cost 3 -> 2. Kragg Berserker cooldown 1.6 -> 1.8 seconds.
- Physics version bumped to 17 for stun/charge synchronization.

## 17.1.0 - SUMMONER BALANCE & DECK UI (2026-09-10)

- Necromancer periodic summon interval changed from 6.0 to 7.5 seconds; immediate three-Bone deployment summon remains.
- Dark Necromancer periodic summon interval changed from 5.0 to 6.5 seconds; immediate two-Moon-Bat deployment summon remains.
- Deck summary was compacted so “8 / 8 selected” and average cost share one row and the explanatory helper paragraph was removed.

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
