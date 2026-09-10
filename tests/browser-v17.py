import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v17'
CHECKS=[]
async def ok(name): CHECKS.append(name); print('PASS',len(CHECKS),name)

async def open_detail(page, card_id):
    await page.locator(f'#deckPool .deck-choice[data-card="{card_id}"]').click()
    await page.wait_for_timeout(80)
    await page.click('#deckCardDetailBtn')
    await page.wait_for_timeout(180)

async def close_detail(page):
    await page.evaluate("document.getElementById('cardDetailBack').click()")
    await page.wait_for_timeout(90)

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1100,'height':820})
        page.set_default_timeout(9000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load');await page.wait_for_timeout(700)
        await page.evaluate("""() => { window.__v17Store={}; const bag=window.__v17Store; Object.defineProperty(window,'localStorage',{value:{getItem:k=>Object.prototype.hasOwnProperty.call(bag,k)?bag[k]:null,setItem:(k,v)=>bag[k]=String(v),removeItem:k=>delete bag[k],clear:()=>Object.keys(bag).forEach(k=>delete bag[k])},configurable:true}); }""")
        await page.click('#deckBtn');await page.wait_for_timeout(180)

        cards=page.locator('#deckPool .deck-choice')
        assert await cards.count()==27,await cards.count()
        for cid in ['necromancer','darknecro','ashsquad']:
            assert await page.locator(f'#deckPool .deck-choice[data-card="{cid}"]').count()==1
        await page.locator('#deckPool .deck-choice[data-card="necromancer"]').scroll_into_view_if_needed()
        await page.wait_for_timeout(100)
        await ok('Deck builder exposes 27 cards including Necromancer, Dark Necromancer and Ash Squad')

        await open_detail(page,'necromancer')
        stats=await page.locator('#cardDetailStats').inner_text();desc=await page.locator('#cardDetailDesc').inner_text();canvas=page.locator('#cardDetailDemo')
        assert '6' in stats and '1350' in stats and '配置時＋6秒ごと ×3' in stats,stats
        assert '地上・空中' in desc and '配置した瞬間' in desc
        assert await canvas.get_attribute('data-demo-scenario')=='necromancer-bone-summon'
        await page.wait_for_function("() => Number(document.getElementById('cardDetailDemo').dataset.demoInitialSummons)>=3",timeout=2500)
        await page.wait_for_function("() => Number(document.getElementById('cardDetailDemo').dataset.demoPeriodicSummons)>=3",timeout=15000)
        await ok('Necromancer LIVE DEMO proves the immediate three-Bone summon and the six-second follow-up wave')
        await close_detail(page)

        await open_detail(page,'darknecro')
        stats=await page.locator('#cardDetailStats').inner_text();desc=await page.locator('#cardDetailDesc').inner_text();canvas=page.locator('#cardDetailDemo')
        assert '5' in stats and '1150' in stats and '配置時＋5秒ごと ×2' in stats,stats
        assert '地上だけ' in desc and '配置した瞬間' in desc
        assert await canvas.get_attribute('data-demo-scenario')=='darknecro-bat-summon'
        await page.wait_for_function("() => Number(document.getElementById('cardDetailDemo').dataset.demoInitialSummons)>=2",timeout=2500)
        await page.wait_for_function("() => Number(document.getElementById('cardDetailDemo').dataset.demoPeriodicSummons)>=2",timeout=13000)
        await ok('Dark Necromancer LIVE DEMO proves the immediate two-Bat summon and the five-second follow-up wave')
        await close_detail(page)

        await open_detail(page,'ashsquad')
        stats=await page.locator('#cardDetailStats').inner_text();canvas=page.locator('#cardDetailDemo')
        assert '前1・後2の3体' in stats,stats
        assert await canvas.get_attribute('data-demo-scenario')=='ash-squad-triangle-counter'
        assert '前1・後2' in await page.locator('#cardDemoScenario').inner_text()
        await ok('Ash Squad detail identifies the front-one/rear-two formation and runs its backline-counter live scenario')
        await close_detail(page)

        await page.click('#saveMyListBtn');await page.wait_for_timeout(180)
        stored=await page.evaluate("window.__v17Store['tiny-deck-presets-v17'] || null")
        assert stored and len(json.loads(stored).get('presets',[]))==1,stored
        assert await page.locator('#myListGrid .mylist-card').count()==1
        await ok('My List persists the current eight-card deck under the v17 storage key')
        await page.click('#closeMyListBtn')

        await page.evaluate("document.getElementById('deckModal').close()")
        await page.evaluate("document.getElementById('updatesBtn').click()");await page.wait_for_timeout(160)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v17.0.0' in text and 'SUMMONERS UPDATE' in text and 'v16 UPDATE SERIES' in text,text
        assert 'ネクロマンサー' in text and 'ダークネクロマンサー' in text and 'アッシュ部隊' in text
        await ok('Patch Notes shows the new v17 Summoners Update while retaining the grouped v16 history')

        assert not errors,errors
        await ok('No uncaught JavaScript errors in v17 deck, summon demos or Patch Notes flows')
        await browser.close()
    result={'passed':len(CHECKS),'checks':CHECKS,'errors':errors}
    (ROOT/'docs/BROWSER_V17_RESULTS.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=='__main__':
    asyncio.run(main())
    os._exit(0)
