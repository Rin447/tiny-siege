import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CHECKS=[]
async def ok(name):
    CHECKS.append(name)
    print('PASS',len(CHECKS),name)

async def open_detail(page, card_id):
    card=page.locator(f'#deckPool .deck-choice[data-card="{card_id}"]')
    await card.scroll_into_view_if_needed()
    await card.click()
    await page.wait_for_timeout(60)
    await page.click('#deckCardDetailBtn')
    await page.wait_for_timeout(140)

async def close_detail(page):
    await page.evaluate("document.getElementById('cardDetailBack').click()")
    await page.wait_for_timeout(70)

async def main():
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(
            executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),
            headless=True,
            args=['--no-sandbox']
        )
        page=await browser.new_page(viewport={'width':1100,'height':820})
        page.set_default_timeout(9000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load')
        await page.wait_for_timeout(650)

        # Use an isolated in-memory localStorage for the persistence check.
        await page.evaluate("""() => {
          window.__v18Store={}; const bag=window.__v18Store;
          Object.defineProperty(window,'localStorage',{value:{
            getItem:k=>Object.prototype.hasOwnProperty.call(bag,k)?bag[k]:null,
            setItem:(k,v)=>bag[k]=String(v), removeItem:k=>delete bag[k],
            clear:()=>Object.keys(bag).forEach(k=>delete bag[k])
          },configurable:true});
        }""")

        await page.click('#deckBtn')
        await page.wait_for_timeout(150)
        cards=page.locator('#deckPool .deck-choice')
        assert await cards.count()==54, await cards.count()
        for cid in ['icegolem','elixirgolem','royalgiant','lumina','lightning','necromancer','darknecro','ashsquad','princess','sparky','zap','electrowizard','laserdragon','shieldknight','windmage','phoenix','mirage','cyclone','skybomber','scrapdrill','bombcarrier','miniberserker','megaknight','ironeye','tracker','valkyrie','gargoyle','gargoyleswarm']:
            assert await page.locator(f'#deckPool .deck-choice[data-card="{cid}"]').count()==1
        await ok('Deck builder exposes all 54 selectable cards including Ice Golem')

        # V25.1 direct drag deck editing: pool -> slot replacement, slot -> slot reorder, and ordinary click coexistence.
        pool=page.locator('#deckPool .deck-choice[data-card="blade"]');await pool.scroll_into_view_if_needed();await page.wait_for_timeout(40)
        slot0=page.locator('#deckSlots .deck-slot').nth(0);pb=await pool.bounding_box();sb=await slot0.bounding_box();assert pb and sb
        await page.mouse.move(pb['x']+pb['width']/2,pb['y']+pb['height']/2);await page.mouse.down();await page.mouse.move(pb['x']+pb['width']/2+14,pb['y']+pb['height']/2,steps=3)
        assert await page.locator('.deck-drag-ghost').count()==1
        await page.mouse.move(sb['x']+sb['width']/2,sb['y']+sb['height']/2,steps=10);await page.mouse.up();await page.wait_for_timeout(130)
        assert await page.locator('#deckSlots .deck-slot').nth(0).get_attribute('data-card')=='blade'
        assert await page.locator('#deckCardActions').is_hidden()
        await ok('Pool card drag directly replaces a chosen deck slot without opening the tap action sheet')

        a=page.locator('#deckSlots .deck-slot').nth(0);b=page.locator('#deckSlots .deck-slot').nth(1);ab=await a.bounding_box();bb=await b.bounding_box();assert ab and bb
        ca=await a.get_attribute('data-card');cb=await b.get_attribute('data-card')
        await page.mouse.move(ab['x']+ab['width']/2,ab['y']+ab['height']/2);await page.mouse.down();await page.mouse.move(ab['x']+ab['width']/2+13,ab['y']+ab['height']/2,steps=2);await page.mouse.move(bb['x']+bb['width']/2,bb['y']+bb['height']/2,steps=8);await page.mouse.up();await page.wait_for_timeout(130)
        assert await page.locator('#deckSlots .deck-slot').nth(0).get_attribute('data-card')==cb
        assert await page.locator('#deckSlots .deck-slot').nth(1).get_attribute('data-card')==ca
        await ok('Deck slots can be dragged onto each other to reorder the eight cards')

        tap=page.locator('#deckPool .deck-choice[data-card="spear"]');await tap.scroll_into_view_if_needed();await tap.click();await page.wait_for_timeout(80)
        assert await page.locator('#deckCardActions').is_visible();await page.click('#deckActionClose')
        await ok('Normal click still opens the existing card action sheet after drag support is enabled')
        await page.click('#deckDefaultBtn');await page.wait_for_timeout(80)

        # V24 units
        await open_detail(page,'miniberserker')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        assert '4' in stats and '1390' in stats and '755' in stats and '1.6' in stats and '大剣' in desc
        await close_detail(page)
        await ok('Mini Berserker detail shows 4 cost, HP1390, attack755 and 1.6-second high-power melee role')

        await open_detail(page,'megaknight')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        assert '7' in stats and '3993' in stats and '263' in stats and '420' in stats and '537' in stats and '80〜160' in stats and '1.7秒' in stats and '黒い鉄球' in desc
        await page.wait_for_timeout(2300)
        await close_detail(page)
        await ok('Mega Knight detail exposes HP3993, damage263, drop420, jump537 and renders its live demo')

        # V25 units
        await open_detail(page,'ironeye')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        assert '4' in stats and '750' in stats and '125' in stats and '160' in stats,stats
        assert '被ダメージ+20%' in stats and '累計500 → 追加300' in stats and '1体につき1回' in stats and '2.5秒間30%鈍足' in stats,stats
        assert '顔を深いフードで隠した' in desc and '貫通突進' in desc,desc
        await close_detail(page)
        await ok('Iron Eye detail shows mark amplification, 500-to-300 burst and one-use piercing spin')

        await open_detail(page,'tracker')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        assert '5' in stats and '1900' in stats and '320' in stats,stats
        assert '射程180 / 構え0.6秒 / CT4秒' in stats and '対象だけ2秒攻撃可' in stats and '自分が建物へ引き寄せられる' in stats,stats
        assert '細身の長身鎧騎士' in desc and '右手に片手剣' in desc and '左手に小盾' in desc,desc
        await close_detail(page)
        await ok('Tracker detail shows 4-second hook cooldown plus ground, air and building hook behavior')

        # Updated unit: Princess
        await open_detail(page,'princess')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '3' in stats and '261' in stats and '275' in stats and '9マス' in stats and '3秒' in stats, stats
        assert '地上＋空中' in stats, stats
        assert '射程9マス' in desc and '視界9マス' in desc and '矢の雨なら一撃' in desc, desc
        assert await canvas.get_attribute('data-demo-scenario')=='princess-cross-river-shot'
        await ok('Princess detail shows cost 3, HP 261, attack 275, 9-cell range and matching 9-cell vision')
        await close_detail(page)

        # New unit: Sparky
        await open_detail(page,'sparky')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '6' in stats and '1500' in stats and '1200' in stats and '145' in stats, stats
        assert '3.5秒チャージ' in stats and '敵不在でも常時・ザップで0へ' in stats, stats
        assert '1.8秒の召喚完了後から敵がいなくても3.5秒' in desc, desc
        assert await canvas.get_attribute('data-demo-scenario')=='sparky-always-charge'
        await page.wait_for_function("() => Number(document.getElementById('cardDetailDemo').dataset.demoTime) >= 8.5", timeout=15000)
        await page.wait_for_timeout(1000)
        loop_time=float(await canvas.get_attribute('data-demo-time'))
        assert loop_time < 2.0,loop_time
        assert not errors,errors
        await ok('Sparky detail shows its 1.8s summon delay, then renders through charged-shot replay safely')
        await close_detail(page)
        await open_detail(page,'archer')
        await page.wait_for_timeout(250)
        assert not errors,errors
        await ok('Card detail canvas remains healthy after switching away from Sparky')
        await close_detail(page)

        # New spell: Zap
        await open_detail(page,'zap')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '2' in stats and '225' in stats and 'R78' in stats and '1.5秒' in stats, stats
        assert '攻撃対象を解除' in desc and 'レーザー塔' in desc and 'スパーキー' in desc, desc
        assert await canvas.get_attribute('data-demo-scenario')=='zap-reset-stun'
        await ok('Zap detail shows cost 2, 225 damage, radius 78, 1.5-second stun and reset mechanics')
        await close_detail(page)

        # V29 spell rebalance and Lightning.
        await open_detail(page,'lightning')
        stats=await page.locator('#cardDetailStats').inner_text();canvas=page.locator('#cardDetailDemo')
        assert '6' in stats and '1056' in stats and '265' in stats and 'R105' in stats and '最大4体' in stats,stats
        assert await canvas.get_attribute('data-demo-scenario')=='lightning-top-hp-four'
        await close_detail(page)
        await open_detail(page,'poison')
        stats=await page.locator('#cardDetailStats').inner_text();canvas=page.locator('#cardDetailDemo')
        assert '91' in stats and '21' in stats and '8秒' in stats and '1秒' in stats,stats
        assert await canvas.get_attribute('data-demo-scenario')=='poison-zone-8s'
        await close_detail(page)
        await ok('V29 Lightning and Poison details expose the new damage, target count and duration')

        # Elixir Golem demo must take real tower damage and show its split event.
        await open_detail(page,'elixirgolem')
        canvas=page.locator('#cardDetailDemo')
        assert await canvas.get_attribute('data-demo-scenario')=='elixir-golem-split-visible'
        await page.wait_for_function("() => document.getElementById('cardDetailDemo').dataset.demoElixirHpDropped === 'true'", timeout=7000)
        await page.wait_for_function("() => document.getElementById('cardDetailDemo').dataset.demoElixirSplit === 'true'", timeout=9000)
        await close_detail(page)
        await ok('Elixir Golem detail demo takes real tower damage and exposes the visible split event')

        # New unit: Elekitel Wizard
        await open_detail(page,'electrowizard')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '4' in stats and '650' in stats and '135' in stats and '185' in stats and '2.4秒' in stats and 'R35' in stats,stats
        assert '地上＋空中' in stats and '1.0秒' in stats,stats
        assert '範囲内の敵ユニット全員を1秒スタン' in desc,desc
        assert await canvas.get_attribute('data-demo-scenario')=='electrowizard-splash-stun'
        await ok('Elekitel Wizard detail shows 4 cost, 135 splash, range 185 and 1-second area stun')
        await close_detail(page)

        await open_detail(page,'harpy')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '180 → 130 → 90' in stats and '2秒' in stats and '1.0秒' in stats,stats
        await close_detail(page)
        await open_detail(page,'mossling')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '160（投げ槍）' in stats,stats
        await ok('Harpy and Goblin Squad details expose fixed chain damage and thrown-spear range 160')
        await close_detail(page)

        # New unit: Laser Dragon
        await open_detail(page,'laserdragon')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '5' in stats and '1300' in stats and '145' in stats and '20 DPS' in stats,stats
        assert '地上＋空中' in stats and '飛行 41' in stats and '1.5秒ごとに ×2' in stats,stats
        assert '対象変更・射程外・スタン' in desc,desc
        assert await canvas.get_attribute('data-demo-scenario')=='laserdragon-mobile-ramp'
        await ok('Laser Dragon detail shows 5 cost, HP1300, flying speed41, range145 and ramping laser')
        await close_detail(page)

        # Tactical cards retained after roster cleanup.
        for cid,scenario in [
            ('shieldknight','shield-front-block'),('windmage','wind-knockback'),('phoenix','phoenix-egg-revive'),
            ('mirage','royal-ghost-stealth-slash'),('cyclone','cyclone-pull-field')]:
            await open_detail(page,cid)
            assert await page.locator('#cardDetailDemo').get_attribute('data-demo-scenario')==scenario
            await close_detail(page)
        await open_detail(page,'cyclone')
        cstats=await page.locator('#cardDetailStats').inner_text()
        cdesc=await page.locator('#cardDetailDesc').inner_text()
        assert 'R130' in cstats and '3秒' in cstats and '外10 / 中20 / 中心35 DPS' in cstats,cstats
        assert '吸い寄せ' in cdesc and '建物・タワー' in cdesc,cdesc
        await ok('Detail demos expose Shield, Wind, Phoenix, Royal Ghost and the three-second Cyclone field')
        await close_detail(page)

        # Remaining siege specialists after roster cleanup.
        for cid,scenario in [
            ('scrapdrill','scrapdrill-ramp'),('bombcarrier','bomb-carrier-suicide')]:
            await open_detail(page,cid)
            assert await page.locator('#cardDetailDemo').get_attribute('data-demo-scenario')==scenario
            assert '建物のみ' in await page.locator('#cardDetailStats').inner_text()
            await close_detail(page)
        await open_detail(page,'skybomber')
        sstats=await page.locator('#cardDetailStats').inner_text();assert '650' in sstats and '175' in sstats and '170' in sstats and '飛行 51' in sstats and '地上＋空中' in sstats,sstats
        assert await page.locator('#cardDetailDemo').get_attribute('data-demo-scenario')=='skybomber-long-range-bomb'
        await close_detail(page)
        await open_detail(page,'scrapdrill')
        dstats=await page.locator('#cardDetailStats').inner_text();assert '90 → 135 → 180 → 240' in dstats and '1.5秒ごと' in dstats,dstats
        await close_detail(page)
        await open_detail(page,'bombcarrier')
        bstats=await page.locator('#cardDetailStats').inner_text();assert '480' in bstats and '周囲の敵ユニットへ80' in bstats and '88' in bstats,bstats
        await ok('Detail demos expose long-range Sky Bomber, Scrap Drill and Bomb Carrier mechanics')
        await close_detail(page)

        # Summon delay details and existing balance changes remain intact.
        await open_detail(page,'golem')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '召喚時間' in stats and '2.5秒' in stats,stats
        await close_detail(page)
        await open_detail(page,'tigger')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '地下移動（追加待機なし）' in stats,stats
        await ok('Detail UI exposes Golem 2.5s summon delay and Tigger no-extra-delay exception')
        await close_detail(page)

        # Existing balance changes from v17.1 remain intact.
        await open_detail(page,'necromancer')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '配置時＋7.5秒ごと ×3' in stats and '召喚時間' in stats and '1.2秒' in stats and '839' in stats and '1.1秒' in stats,stats
        await close_detail(page)
        await open_detail(page,'darknecro')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '配置時＋6.5秒ごと ×2' in stats and '召喚時間' in stats and '0.9秒' in stats and '907' in stats and '304' in stats,stats
        await ok('Summoner details show v29 balance and 1.2s/0.9s parent delays while retaining summon intervals')
        await close_detail(page)

        # My List persistence remains intact.
        await page.click('#saveMyListBtn')
        await page.wait_for_timeout(140)
        stored=await page.evaluate("window.__v18Store['tiny-deck-presets-v27'] || null")
        assert stored and len(json.loads(stored).get('presets',[]))==1,stored
        assert await page.locator('#myListGrid .mylist-card').count()==1
        await ok('My List persists the current eight-card deck under the current storage key')
        await page.click('#closeMyListBtn')

        await page.evaluate("document.getElementById('deckModal').close()")
        await page.evaluate("document.getElementById('updatesBtn').click()")
        await page.wait_for_timeout(130)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v30.0.0' in text and 'ICE GOLEM UPDATE' in text and 'v29.5.1' in text and 'ROYAL AIM POSE FIX' in text and 'v29.5.0' in text and 'LASER & ROYAL CANNON UPDATE' in text and 'v29.4.0' in text and 'FIRST STRIKE TIMING UPDATE' in text and 'v29.3.0' in text and 'ROYAL GHOST & ROSTER CLEANUP' in text and 'v29.0.0' in text and 'LIGHTNING & NECRO UPDATE' in text and 'v28.0.0' in text and 'ROYAL ELIXIR UPDATE' in text and 'v27.1.0' in text and 'RIVERBANK DEPLOY UPDATE' in text and 'v27.0.0' in text and 'UNDEAD RIVER UPDATE' in text and 'v26.6.0' in text and 'ARSENAL & SWARM UPDATE' in text and 'v26.5.0' in text and 'BATTLE READABILITY UPDATE' in text and 'v26.4.0' in text and 'GOLEM WEIGHT UPDATE' in text and 'v26.3.0' in text and 'FRONTLINE POWER UPDATE' in text and 'v26.2.0' in text and 'v26.1.1' in text and 'v26.1.0' in text and 'v26.0.0' in text, text
        assert all(name in text for name in ['スカイボマー','スクラップドリル','クラッシャーオーガ','シージタートル','ボムキャリア']), text
        assert '54枚（48ユニット＋6呪文）' in text and 'physicsVersion 51' in text and 'ロイヤルゴースト' in text and 'ライトニング' in text, text
        assert 'v22.0.0' in text and 'TACTICAL FORCES UPDATE' in text and all(name in text for name in ['シールドナイト','ウィンドメイジ','フェニックス','グラビティオーブ','ミラージュアサシン','サイクロン']), text
        assert 'エレキテルウィザード' in text and '180' in text and '160' in text and '1秒スタン' in text, text
        assert 'v19.3.0' in text and 'SUMMON DELAY SYSTEM' in text, text
        assert '1コスト0.4秒' in text and '7コスト1.8秒' in text, text
        assert 'ストーンゴーレムは重量級の特別枠として2.5秒' in text and 'スパーキーは1.8秒' in text, text
        assert 'スペルや範囲攻撃も含めて無敵' in text and '当たり判定も無効' in text, text
        assert 'v18.3.0' in text and 'FIRST ATTACK LOCK' in text, text
        assert 'v18.2.0' in text and 'TARGET LOCK TACTICS' in text, text
        # The in-app panel intentionally shows only the latest seven calendar days.
        # On 2026-09-17 that window starts at 2026-09-11, so v18.1/v18.0/v17 are
        # correctly preserved in UPDATE-HISTORY.html but no longer shown in this modal.
        await ok('Patch Notes shows v29.5 and retained seven-day history through v18.2')

        await page.click('#updatesModal .close-modal')
        await page.fill('#nickname','Rin')
        await page.click('#practiceBtn')
        await page.wait_for_function("() => !document.getElementById('battle').hidden")
        await page.wait_for_timeout(850)
        assert await page.locator('#hand button').count()==4, await page.locator('#hand button').count()
        assert await page.locator('#arenaCanvas').is_visible()
        await ok('Self-contained HTML starts a playable CPU battle with a four-card hand and visible arena')

        assert not errors,errors
        await ok('No uncaught JavaScript errors in the v26 deck, detail demos, Patch Notes or CPU battle flow')
        await browser.close()

    result={'passed':len(CHECKS),'checks':CHECKS,'errors':errors}
    (ROOT/'docs/BROWSER_V18_RESULTS.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=='__main__':
    asyncio.run(main())
