import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v5'
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
        await page.wait_for_timeout(650)
        assert await page.locator('#homeDeck canvas').count()==6
        await ok('home shows a six-unit saved deck')
        await page.click('#deckBtn');await page.wait_for_timeout(900)
        assert await page.locator('#deckPool .deck-choice').count()==15
        assert await page.locator('#deckPool .deck-choice.selected').count()==6
        text=await page.locator('#deckPool').inner_text()
        for name in ['アイアンボア','ルミナ司祭','フロストシャーマン','ストームハーピー']:
            assert name in text
        await ok('deck editor shows fifteen choices including all three v5 units and the upgraded boar')
        await page.screenshot(path=str(OUT/'01-deck-editor.png'),full_page=True)
        await page.click('#deckDefaultBtn');await page.wait_for_timeout(500)
        selected='\n'.join(await page.locator('#deckPool .deck-choice.selected').all_inner_texts())
        for name in ['アイアンボア','ルミナ司祭','フロストシャーマン','ストームハーピー']:
            assert name in selected
        await ok('recommended deck includes boar plus all three v5 support/control units')
        await page.click('#deckSaveBtn');await page.click('#libraryBtn');await page.wait_for_timeout(900)
        assert await page.locator('#libraryGrid .library-card').count()==15
        await page.screenshot(path=str(OUT/'02-fifteen-unit-library-front.png'),full_page=True)
        await page.click('#libraryFacingBtn');await page.wait_for_timeout(900)
        await page.screenshot(path=str(OUT/'03-fifteen-unit-library-back.png'),full_page=True)
        await ok('front and back library renders all fifteen units')
        await page.locator('#libraryModal .close-modal').click()
        await page.fill('#nickname','Rin');await page.click('#practiceBtn');await page.wait_for_timeout(3500)
        assert await page.locator('#battle').is_visible();assert await page.locator('#hand .card').count()==4
        await page.screenshot(path=str(OUT/'04-cpu-battle.png'),full_page=True)
        await ok('CPU battle starts with four cards from selected six-card deck')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v5 flow')
        await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'Self-contained offline HTML loaded with Playwright set_content; not Cloudflare production or native browser networking.'}
    (ROOT/'docs/BROWSER_V5_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
