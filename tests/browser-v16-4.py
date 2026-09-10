import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v16-4'
CHECKS=[]
async def ok(name): CHECKS.append(name); print('PASS',len(CHECKS),name)

async def open_detail(page, card_id):
    await page.locator(f'#deckPool .deck-choice[data-card="{card_id}"]').click()
    await page.wait_for_timeout(70)
    await page.click('#deckCardDetailBtn')
    await page.wait_for_timeout(140)

async def close_detail(page):
    await page.evaluate("document.getElementById('cardDetailBack').click()")
    await page.wait_for_timeout(90)

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1280,'height':980})
        page.set_default_timeout(5000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load');await page.wait_for_timeout(650)
        await page.click('#deckBtn');await page.wait_for_timeout(150)

        # Tigger balance is visible in details.
        await open_detail(page,'tigger')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '20' in stats,stats
        assert '15から20' in await page.locator('#cardDetailDesc').inner_text()
        assert await page.locator('#cardDetailDemo').get_attribute('data-demo-scenario')=='tigger-burrow'
        await ok('Tigger detail reflects attack 20 while keeping the live burrow scenario')
        await close_detail(page)

        # Moon Bat is now a four-unit card and the demo says so.
        await open_detail(page,'bat')
        stats=await page.locator('#cardDetailStats').inner_text()
        assert '×4' in stats,stats
        assert '4体' in await page.locator('#cardDemoScenario').inner_text()
        await ok('Moon Bat detail and live demo reflect the four-unit deployment')
        await close_detail(page)

        # Golem scenario must actually demonstrate death blast, tower damage, bone casualties and split.
        await open_detail(page,'golem')
        canvas=page.locator('#cardDetailDemo')
        assert await canvas.get_attribute('data-demo-scenario')=='golem-death-blast-split'
        assert 'ボーン隊' in await page.locator('#cardDemoScenario').inner_text()
        await page.wait_for_function("""() => {
          const c=document.getElementById('cardDetailDemo');
          return c.dataset.demoDeathBlast==='true' && c.dataset.demoTowerDamaged==='true' && c.dataset.demoBonesHit==='true' && Number(c.dataset.demoMiniGolems)>=2;
        }""",timeout=5000)
        await ok('Golem LIVE DEMO actually shows death blast hitting tower/bones and the two-unit split')
        await close_detail(page)

        # Mud Dragon scenario must produce a real mud zone and real slow state on Iron Guard.
        await open_detail(page,'muddragon')
        canvas=page.locator('#cardDetailDemo')
        assert await canvas.get_attribute('data-demo-scenario')=='muddragon-slow-dot'
        scenario=await page.locator('#cardDemoScenario').inner_text()
        assert 'アイアン衛士' in scenario and '30%減速' in scenario and '継続ダメージ' in scenario
        await page.wait_for_function("""() => {
          const c=document.getElementById('cardDetailDemo');
          return c.dataset.demoMudZone==='true' && c.dataset.demoMudded==='true';
        }""",timeout=5000)
        await ok('Mud Dragon LIVE DEMO actually creates mud and slows the high-HP Iron Guard')
        await close_detail(page)

        # Patch notes stay inside v16 series and expose the new balance/demo update.
        await page.evaluate("document.getElementById('deckModal').close()")
        await page.evaluate("document.getElementById('updatesBtn').click()");await page.wait_for_timeout(120)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v16.4.0' in text and 'ABILITY DEMO & BALANCE' in text and 'v16 UPDATE SERIES' in text
        await ok('Patch Notes groups v16.4.0 into the existing v16 update series')

        assert not errors,errors
        await ok('No uncaught JavaScript errors in v16.4 balance and ability-demo flows')
        await browser.close()
    result={'passed':len(CHECKS),'checks':CHECKS,'errors':errors}
    (ROOT/'docs/BROWSER_V16_4_RESULTS.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=='__main__': asyncio.run(main())
