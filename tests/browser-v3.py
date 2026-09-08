import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v3'
CHECKS=[]
async def ok(name):
    CHECKS.append(name); print('PASS',len(CHECKS),name)

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load')
        await page.wait_for_timeout(500)
        assert await page.locator('#homeDeck canvas').count()==6
        await ok('home shows a six-unit saved deck')
        await page.click('#deckBtn')
        await page.wait_for_timeout(250)
        assert await page.locator('#deckPool .deck-choice').count()==9
        assert await page.locator('#deckPool .deck-choice.selected').count()==6
        assert await page.locator('#deckSlots .filled').count()==6
        await ok('deck editor shows nine choices and six selected slots')
        await page.screenshot(path=str(OUT/'01-deck-editor.png'),full_page=True)
        # Remove one selected card; save must disable. Add one currently unselected; save re-enables.
        await page.locator('#deckSlots .filled').last.click()
        assert await page.locator('#deckSlots .filled').count()==5
        assert await page.locator('#deckSaveBtn').is_disabled()
        await ok('five-card deck cannot be saved')
        await page.locator('#deckPool .deck-choice:not(.selected)').first.click()
        assert await page.locator('#deckSlots .filled').count()==6
        assert not await page.locator('#deckSaveBtn').is_disabled()
        await page.click('#deckSaveBtn')
        await ok('six unique cards can be saved')
        await page.click('#libraryBtn')
        await page.wait_for_timeout(200)
        assert await page.locator('#libraryGrid .library-card').count()==9
        assert 'ストーンゴーレム' in await page.locator('#libraryGrid').inner_text()
        await page.screenshot(path=str(OUT/'02-nine-unit-library.png'))
        await page.locator('#libraryModal .close-modal').click()
        await ok('library contains all nine units including Stone Golem')
        await page.fill('#nickname','Rin')
        await page.click('#practiceBtn')
        await page.wait_for_timeout(3500)
        assert await page.locator('#battle').is_visible()
        assert await page.locator('#hand .card').count()==4
        await page.screenshot(path=str(OUT/'03-cpu-battle.png'),full_page=True)
        await ok('CPU battle starts with four cards from the six-card deck')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v3 deck/library/CPU flow')
        await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'Self-contained offline HTML loaded with Playwright set_content; not Cloudflare production or native browser networking.'}
    (ROOT/'docs/BROWSER_V3_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
