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
        assert await cards.count()==30, await cards.count()
        for cid in ['necromancer','darknecro','ashsquad','princess','sparky','zap']:
            assert await page.locator(f'#deckPool .deck-choice[data-card="{cid}"]').count()==1
        await ok('Deck builder exposes all 30 selectable cards, including Princess Archer, Zap and Sparky')

        # New unit: Princess Archer
        await open_detail(page,'princess')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '3' in stats and '300' in stats and '275' in stats and '350' in stats and '3秒' in stats, stats
        assert '地上＋空中' in stats, stats
        assert '橋を渡らず' in desc and '矢の雨なら一撃' in desc, desc
        assert await canvas.get_attribute('data-demo-scenario')=='princess-cross-river-shot'
        await ok('Princess Archer detail shows cost 3, HP 300, attack 275, 3-second fire rate and cross-river range 350')
        await close_detail(page)

        # New unit: Sparky
        await open_detail(page,'sparky')
        stats=await page.locator('#cardDetailStats').inner_text()
        desc=await page.locator('#cardDetailDesc').inner_text()
        canvas=page.locator('#cardDetailDemo')
        assert '6' in stats and '1500' in stats and '1200' in stats and '145' in stats, stats
        assert '3.5秒チャージ' in stats and '敵不在でも常時・ザップで0へ' in stats, stats
        assert '配置直後から敵がいなくても3.5秒' in desc, desc
        assert await canvas.get_attribute('data-demo-scenario')=='sparky-always-charge'
        await page.wait_for_function("() => Number(document.getElementById('cardDetailDemo').dataset.demoTime) >= 8.5", timeout=15000)
        await page.wait_for_timeout(1000)
        loop_time=float(await canvas.get_attribute('data-demo-time'))
        assert loop_time < 2.0,loop_time
        assert not errors,errors
        await ok('Sparky detail renders through its charged shot and end-of-demo replay without corrupting the canvas')
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

        # Existing balance changes from v17.1 remain intact.
        await open_detail(page,'necromancer')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '配置時＋7.5秒ごと ×3' in stats,stats
        await close_detail(page)
        await open_detail(page,'darknecro')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '配置時＋6.5秒ごと ×2' in stats,stats
        await ok('v17.1 summoner balance remains intact at 7.5s and 6.5s')
        await close_detail(page)

        # My List uses the new v18 key while retaining migration support in app code.
        await page.click('#saveMyListBtn')
        await page.wait_for_timeout(140)
        stored=await page.evaluate("window.__v18Store['tiny-deck-presets-v18'] || null")
        assert stored and len(json.loads(stored).get('presets',[]))==1,stored
        assert await page.locator('#myListGrid .mylist-card').count()==1
        await ok('My List persists the current eight-card deck under the v18 storage key')
        await page.click('#closeMyListBtn')

        await page.evaluate("document.getElementById('deckModal').close()")
        await page.evaluate("document.getElementById('updatesBtn').click()")
        await page.wait_for_timeout(130)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v18.1.0' in text and 'DETAIL DEMO RENDER FIX' in text, text
        assert 'v18.0.0' in text and 'LONGSHOT & VOLTAGE' in text, text
        assert 'プリンセスアーチャー' in text and 'ザップ' in text and 'スパーキー' in text, text
        assert 'v17 UPDATE SERIES' in text and 'v17.1.0' in text, text
        await ok('Patch Notes shows v18.1.0 render fix plus v18.0.0 and retained v17 history')

        await page.click('#updatesModal .close-modal')
        await page.fill('#nickname','Rin')
        await page.click('#practiceBtn')
        await page.wait_for_function("() => !document.getElementById('battle').hidden")
        await page.wait_for_timeout(850)
        assert await page.locator('#hand button').count()==4, await page.locator('#hand button').count()
        assert await page.locator('#arenaCanvas').is_visible()
        await ok('Self-contained HTML starts a playable CPU battle with a four-card hand and visible arena')

        assert not errors,errors
        await ok('No uncaught JavaScript errors in the v18 deck, detail demos, Patch Notes or CPU battle flow')
        await browser.close()

    result={'passed':len(CHECKS),'checks':CHECKS,'errors':errors}
    (ROOT/'docs/BROWSER_V18_RESULTS.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=='__main__':
    asyncio.run(main())
