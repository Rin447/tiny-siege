## 29.0.0 - LIGHTNING & NECRO UPDATE (2026-09-16)
- Necromancer: cost5 / HP839 / damage125 / 1.1s attack interval; skeleton summon cadence unchanged.
- Dark Necromancer: cost4 / HP907 / damage304 / 1.3s attack interval; bat summon cadence unchanged.
- Renamed Poison Trap to Poison. The zone lasts 8 seconds and deals 91 damage/second to units and 21 damage/second to buildings; the card art is a tall narrow red magic flask.
- Fireball: 689 unit / 159 building damage. Arrow Rain: 366 unit / 75 building damage.
- Added Lightning: cost6, radius105, selects up to four enemies in current-HP descending order, dealing 1056 to units and 265 to buildings.
- Fixed the Elixir Golem detail demo so tower shots deal real damage, and added a dedicated pink split-burst effect for large -> medium -> blob deaths.
- Card pool: 56 selectable cards = 50 unit cards + 6 spells. physicsVersion 45.

## 28.0.0 - ROYAL ELIXIR UPDATE (2026-09-16)
- Renamed Lumina Priest to Healer and rebuilt healing around successful attacks: HP1900, damage120, 1.75s attack interval, range120; each damaging hit heals self for 110 plus up to three injured nearby allies for 110 each.
- Added Elixir Golem: cost3, HP1568, damage254, 2.0s attack interval, building-only. It splits 1 -> 2 -> 4 with halved HP/damage per generation and grants the opponent 1 / 1 / 0.5 energy when each stage dies.
- Added Royal Giant: cost6, HP3164, damage307, 1.8s attack interval, range165, slow, building-only, with a dedicated cannon projectile.
- Card pool: 55 selectable cards = 50 unit cards + 5 spells. physicsVersion 44.

## 27.1.0 - RIVERBANK DEPLOY UPDATE (2026-09-16)
- Extended the initial deployment line from 600/440 to 550/490 so the usable area reaches slightly onto each bridge.
- Direct placement over open river water remains forbidden, including flying units; bridge ground remains valid.
- Deployments clicked on legal lawn near the bank now snap inward when the unit radius would overlap water instead of failing.
- Group cards apply the same safe riverbank correction to generated member positions.
- No card stat changes. physicsVersion 43.

## 27.0.0 - UNDEAD RIVER UPDATE (2026-09-16)
- Iron Boar: HP1696 / damage318 / 1.6s attack interval. Near the river it now jumps directly to the opposite bank instead of routing to a bridge.
- Added the 1-cost Skeleton card: three HP81 / damage81 skeletons. Bone Swarm is renamed Skeleton Squad and now deploys fifteen shared skeleton units.
- Added Tombstone: cost3 / HP530 / 30 HP natural decay per second. It summons two skeletons on deployment completion and every four seconds, then four instant skeletons on destruction.
- Mega Knight: HP3993 / normal damage263 / jump landing damage537; deployment drop remains 420.
- Card pool: 53 selectable cards = 48 unit cards + 5 spells. physicsVersion 42.

## 26.6.0 - ARSENAL & SWARM UPDATE (2026-09-16)
- Renamed Bolt Cannon to 大砲 and changed it to HP1000 / damage200 / 1.0s attack interval; natural HP decay remains 30 per second.
- Renamed Moon Bat to コウモリの群れ: five units, HP92, damage82, 1.2s attack interval per bat.
- Renamed Pot Bomber to ボンバー, cost 3→2. Bomb projectile speed is slower and rendering now follows a rotating parabolic throw arc.
- physicsVersion 41.

## 26.5.0 - BATTLE READABILITY UPDATE (2026-09-16)
- Leaf Archer placement/summon preview now shows both archers.
- Central core: HP 4560 / damage 85. Side towers: HP 3200 / damage 105.
- Long-pressing a battle hand card shows unit-target and tower-target damage values, including spell/structure modifiers.
- physicsVersion 40.

## 26.4.3 - GOLEM ARM SWAY TUNE (2026-09-16)
- Stone Golem visual-only redesign: wider shoulders, outward upper arms, thick forward forearms and oversized planted fists.
- Lowered the head between the shoulders and strengthened the forward gorilla-like posture while preserving stone, moss and blue rune identity.
- Mini Golem inherits the same shared procedural drawing at reduced scale.
- Gameplay stats remain unchanged from v26.4.0; card pool remains 51 and physicsVersion remains 39.

## 26.4.0 - GOLEM WEIGHT UPDATE (2026-09-16)
- Stone Golem: HP 4256, damage 260, attack interval 2.5s, death blast 260. Cost 8, building-only targeting and two-way split remain.
- Mini Golem: HP 851, damage 52, attack interval 2.5s, death blast 52, matching roughly one fifth of the parent combat values.
- Stone Golem procedural Canvas art keeps the same stone/moss/rune identity but changes to a lower forward-leaning gorilla posture with both oversized arms hanging in front.
- Card pool remains 51 selectable cards = 46 units + 5 spells. physicsVersion 39.

## 26.3.0 - FRONTLINE POWER UPDATE (2026-09-16)
- Iron Guard damage: 98 -> 202. Cost 3, HP 1850 and 1.35s attack interval unchanged.
- Kragg Berserker: HP 2450 -> 3760, damage 465 -> 842. Cost 7 and 1.8s attack interval unchanged.
- Mini Berserker: HP 1300 -> 1390, damage 270 -> 755, attack interval 1.45s -> 1.6s.
- Leaf Archer: cost 2 -> 3. The two-unit formation, HP304 each, damage112, range165 and 1.15s attack interval remain unchanged.
- Card pool remains 51 selectable cards = 46 units + 5 spells. physicsVersion 38.

## 26.2.0 - AXE & ARCHER UPDATE (2026-09-16)
- Valkyrie HP 1400→2200 and damage 230→260. Radius-50 self-centered ground spin damage remains unchanged in shape; the animation now keeps her body upright and alternates front/back facing while only the axe circles around her.
- Leaf Archer is now a two-unit card: each archer has HP304, damage112, range165, speed45, 1.15s cooldown and a smaller radius/model. The pair deploys side-by-side and can target ground and air.
- Card pool remains 51 selectable cards = 46 units + 5 spells. physicsVersion 37.

## 26.1.1 - BATTLE PACE TUNE (2026-09-16)
- Increased every non-zero ordinary unit movement speed by about 5% from the v26.1.0 values, keeping relative fast/normal/slow roles intact.
- Buildings and other speed-0 entities are unchanged. Mega Knight jump travel, Nightshade dash, Tigger burrow and Tracker hook timings/speeds are unchanged.
- Card pool remains 51 selectable cards = 46 units + 5 spells. physicsVersion 36.

## 26.1.0 - BATTLE PACE UPDATE (2026-09-16)
- Reduced the normal movement speed of every mobile unit by about 15%, preserving the relative speed hierarchy between units.
- Zero-speed structures remain unchanged. Special movement such as Mega Knight's fixed 1.5s leap, Nightshade dash, Tigger burrow and Tracker hook is unchanged.
- Representative changes: Blade 56→48, Mini Berserker 52→44, Gargoyle 78→66, Bomb Carrier 88→75, Sky Bomber 58→49.
- Card pool remains 51 selectable cards = 46 units + 5 spells. physicsVersion 35.

## 26.0.0 - WILD WINGS UPDATE (2026-09-16)
- Added Valkyrie: 4 cost, HP1400, damage230, speed38, 1.45s attack interval. Her axe attack spins around herself and damages ground targets within radius 50.
- Added Gargoyle: 3 cost, deploys 3 flying units. Each has HP230, damage102, speed78, range45 and can attack ground and air.
- Added Gargoyle Swarm: 5 cost, deploys 6 standard Gargoyles.
- Card pool: 51 selectable cards = 46 units + 5 spells. physicsVersion 34.

## 25.2.1 - SKY BOMBER AIR TARGET FIX (2026-09-16)
- スカイボマーが地上ユニット・空中ユニット・建物のすべてを攻撃可能に変更。
- HP650、4コスト、攻撃175、速度58、射程75、攻撃間隔1.6秒は据え置き。
- physicsVersion 33。

## 25.2.0 - SKY BOMBER RETARGET (2026-09-16)
- スカイボマーの攻撃対象を「建物のみ」から「地上ユニット＋建物」へ変更。空中ユニットは引き続き攻撃不可。
- HP 720 → 650。コスト4、攻撃175、速度58、射程75、攻撃間隔1.6秒は据え置き。
- 対戦ロジック変更に伴い physicsVersion 32。

## 25.1.1 - MOBILE DRAG FIX (2026-09-16)
- TINY SIEGEの画面全体で `user-select: none` / `-webkit-touch-callout: none` を適用し、スマホ長押し時の文字選択・コピー・拡大ルーペ/コールアウトを抑制。
- `contextmenu` / `selectstart` / `copy` / `cut` / native `dragstart` も全画面で抑制。
- デッキドラッグ仕様・戦闘ロジックは変更なし。physicsVersion 31。

## 25.1.0 - DRAG DECK UPDATE (2026-09-15)
- Added direct drag-and-drop deck editing while preserving the existing click/tap action sheet.
- Pool cards can be dropped on deck slots to add or replace; deck slots can be dragged onto each other to reorder the eight-card deck.
- Drag feedback includes a floating card ghost, valid-slot highlighting and a stronger current drop target.
- Mouse drag begins after about 10px movement. Touch drag requires about 0.18s hold before movement so ordinary scrolling/taps remain distinct.
- Gameplay and authoritative combat are unchanged; physicsVersion remains 31.

## 25.0.0 - HUNTER'S MARK UPDATE (2026-09-15)
- Added Iron Eye: 4 cost / HP750 / damage125 / range160, with a +20% incoming-damage mark that bursts for 300 after 500 accumulated real damage.
- Iron Eye has one piercing hidden-blade spin per deployed unit: 180 damage, mark application and 2.5s 30% ground slow to every enemy crossed.
- Added Tracker: 6 cost / HP1900 / damage220, with a 180-range hook, 0.6s windup and 4s cooldown. Ground enemies are pulled in, air enemies grant a 2s target-only attack window, and structures pull Tracker toward them.
- Card pool: 48 selectable cards = 43 units + 5 spells. physicsVersion 31.

## 24.1.0 - MEGA FLIGHT UPDATE (2026-09-15)
- Mega Knight leap travel now always takes exactly 1.5 seconds regardless of jump distance.
- Leap movement uses a fixed takeoff point and fixed landing point captured at takeoff; the landing point no longer chases a moving target after takeoff.
- Mega Knight's leap sprite now rises much higher, retains a moving ground shadow, adds wind streaks, keeps the landing ring visible and shows a curved flight path for clearer airborne readability.
- physicsVersion 30 for the new deterministic leap travel state.

## 24.0.0 - HEAVY DROP UPDATE (2026-09-15)
- Added Mini Berserker: cost 4, HP 1300, damage 270, speed 52 and 1.45-second attacks. Its procedural sprite uses a roughly 1:1 head/body silhouette and carries an oversized raised sword.
- Added Mega Knight: cost 7, HP 2400, damage 280, speed 40 and 1.6-second attacks with a small radius-48 melee splash.
- Mega Knight deploys with a 1.5-second landing telegraph and deals 420 damage in radius 48 on landing.
- Mega Knight jumps when its target is 80-160 away. The jump has no cooldown; instead it uses a 2-second stationary windup. Before the first engagement, a newly spawned closer enemy can take over the jump target without restarting the timer. Once takeoff begins, the target is locked and is pursued until defeated.
- Jump landing damage is 420 in the same radius 48 as the deployment landing zone.
- Card pool is now 46 cards (41 units + 5 spells); physicsVersion 29.

# TINY SIEGE changelog

## 23.0.0 - SIEGE SPECIALISTS UPDATE (2026-09-14)
- Visual readability refresh: redesigned Mud Dragon, Storm Harpy, Laser Dragon and Sky Bomber using the existing procedural Canvas art system.
- Mud Dragon now uses a broad swamp-crocodile silhouette with torn wings and visible mud drips; Storm Harpy uses lightning-bolt wings, thunder crest and stronger talons.
- Laser Dragon now uses a slim mechanical silhouette, straight plated wings, forehead crystal and chest reactor; Sky Bomber now reads as a goggled humanoid pilot with twin rotors and an oversized bomb.
- Unit stats, targeting, hitboxes and combat behavior are unchanged by this visual-only refresh.
- Added Sky Bomber: 4 cost, HP720, speed58, range75, 175 damage every 1.6s; flying and building-only.
- Added Scrap Drill: 4 cost, HP900; attached structure DPS ramps 90 -> 135 -> 180 -> 240 every 1.5s and resets on displacement, retarget or stun.
- Added Crusher Ogre: 6 cost, HP2200, very slow 3.0s attack interval; consecutive hits on one structure ramp 230 -> 310 -> 390 -> 470 and reset on range loss, retarget or stun.
- Added Siege Turtle: 5 cost, HP2050, damage220; while moving toward a structure it reduces ordinary ranged/tower/laser damage by 40%, but melee, spells and DoT bypass the shell reduction.
- Added Bomb Carrier: 3 cost, HP430, speed88; reaching a structure self-destructs for 480. If killed en route it blasts nearby enemy troops for 80, never buildings.
- Card pool is now 44 cards (39 units + 5 spells); physicsVersion 28.
- My List writes `tiny-deck-presets-v23` with v22 and older migration fallback.
- Per-version update pages remain retired; release notes continue in the single `UPDATE-HISTORY.html`.

## 22.0.0 - TACTICAL FORCES UPDATE (2026-09-14)
- Added Shield Knight: 4 cost, HP1400, attack110, 650 shield durability. Frontal ordinary hits split 65% to shield / 35% to HP; flank/rear/spells/DoT bypass the shield.
- Added Wind Mage: 4 cost, HP570, attack95, range175, ground/air targeting, mass-scaled knockback.
- Added Phoenix: 5 cost, HP900, attack130, flying ground/air attacker. Its first death leaves a 600 HP egg that revives once after four seconds at 450 HP.
- Added Gravity Orb: 4 cost, HP540, attack60, range165, radius60 impact pull with mass scaling.
- Added Mirage Assassin: 3 cost, HP500, attack190, up to three seconds of post-deploy stealth and a 1.4x first strike; area damage/spells can reveal it.
- Added Cyclone spell: 3 cost, radius130, three-second continuous pull, 10/20/35 DPS from rim to centre; enemy units only, no building/tower effect.
- Card pool is now 39 cards (34 units + 5 spells); physicsVersion 27.
- My List writes `tiny-deck-presets-v22` with v21 and older migration fallback.
- Per-version update pages remain retired; release notes continue in the single `UPDATE-HISTORY.html`.

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

## v23.0 redesign-02
- Reworked Dosranboss into a larger king-lizard silhouette with a dominant crest, broader jaw and boss ornaments.
- Reworked Scrap Drill into a boxy scrap-built tracked machine with an oversized drill, hazard plate, exhaust pipe and warning lamp.
- Reworked Crusher Ogre into a top-heavy brute with a giant hammer, single shoulder armor, tusks and chain-belt details.
- Reworked Siege Turtle into a mobile fortress with a larger shell, plated armor and a shell-mounted ballista/cannon silhouette.

## v23.0 redesign-03
- Reworked Blowdart Goblin into a clearer poison skirmisher with a longer blowpipe, leaf hood and visible poison-dart quiver.
- Reworked Bomb Carrier into a more dangerous kamikaze silhouette with an oversized carried bomb and backup bombs on the belt.
- Refined Dosranboss into a slimmer blue dinosaur silhouette with a more obvious orange crest, matching the requested look more closely.

## v23.0 redesign-04
- Added a deck-builder-only portrait layout system: every unit now uses the same 120x120 composition frame in deck editing, with per-unit scale and vertical-offset tuning.
- Reduced oversized flying portraits such as Storm Harpy and the dragons so wings, crests and heads stay inside the composition frame.
- Slightly enlarged compact units and tuned heavyweight units so the deck screen has a more consistent visual size across the roster.
- Battle rendering and the library/normal portrait presentation remain unchanged.

## v23.0 redesign-05
- Team ownership bands remain visible during battle for blue/red side readability.
- Deck builder portraits, deck summaries and card library portraits now hide the team ownership band so character art reads cleanly outside combat.
- Added regression coverage for portrait-only team-band suppression.

## v23.0 redesign-06
- Refined Crusher Ogre face into a hannya-inspired demon mask look with taller horns, sharper eyes, cheek spikes and stronger tusks while keeping the giant hammer silhouette.

## v23.0 redesign-07
- Refined Dosranboss head to better match the provided reference: a slimmer raptor-like blue head with a longer snout, yellowish lower jaw and a longer orange crest.
- Updated Ranbos to share the same family look with a leaner blue raptor head and orange crest, so the unit and boss read as related creatures.

## v23.0 redesign-08
- Adjusted Dosranboss and Ranbos again so their faces are slimmer and their head crests are reduced to a single long crest, matching the latest requested look more closely.

## v23.0 redesign-09
- Restyled Dosranboss and Ranbos again toward the newly provided visual reference: a more simplified blocky blue dinosaur look with a white lower jaw, a single orange crest and a cleaner cartoon silhouette.

## v23.0 redesign-10
- Adjusted Dosranboss and Ranbos again to remove the white jaw and replace it with a yellow beak-like mouth piece.
- Extended the single orange crest further backward to better match the latest provided sketch.

## v23.0 redesign-11
- Refined Dosranboss and Ranbos again so the yellow mouth part reads as a beak attached to the front of the face, instead of a lower jaw.

## v23.0 redesign-12
- Raised the beak position on Dosranboss and Ranbos so the yellow beak sits slightly higher on the face, closer to the latest sketch.
- Added a new Siege Turtle passive: when it takes melee/contact damage, it retaliates around itself for 1/3 of the actual damage taken. This retaliation does not trigger from ranged attacks, spells, or damage-over-time.
