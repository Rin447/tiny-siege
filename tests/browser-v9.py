import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v9'
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
        await page.wait_for_timeout(700)
        assert await page.locator('#homeDeck canvas').count()==6
        await ok('home shows a six-card saved deck')
        await page.click('#deckBtn');await page.wait_for_timeout(700)
        assert await page.locator('#deckPool .deck-choice').count()==17
        await page.click('#deckDefaultBtn');await page.wait_for_timeout(500)
        selected='\n'.join(await page.locator('#deckPool .deck-choice.selected').all_inner_texts())
        for name in ['アイアン衛士','クラッグバーサーカー','ファイヤーボール']:
            assert name in selected
        pool=await page.locator('#deckPool').inner_text()
        assert '8' in (await page.locator('#deckPool .deck-choice').filter(has_text='ストーンゴーレム').inner_text())
        assert '4' in (await page.locator('#deckPool .deck-choice').filter(has_text='アイアン衛士').inner_text())
        assert '6' in (await page.locator('#deckPool .deck-choice').filter(has_text='クラッグバーサーカー').inner_text())
        assert '3' in (await page.locator('#deckPool .deck-choice').filter(has_text='ナイトシェイド').inner_text())
        await ok('v9 deck editor exposes seventeen cards and six-card selection')
        await page.screenshot(path=str(OUT/'01-v9-deck-editor.png'),full_page=True)
        await page.click('#deckSaveBtn');await page.click('#libraryBtn');await page.wait_for_timeout(700)
        assert await page.locator('#libraryGrid .library-card').count()==17
        text=await page.locator('#libraryGrid').inner_text()
        assert '毎秒30' in text and '2850' in text and 'ちびゴーレム' in text and 'クラッグバーサーカー' in text and 'ファイヤーボール' in text
        await page.screenshot(path=str(OUT/'02-v9-unit-library.png'),full_page=True)
        await ok('library exposes v9 balance and Kragg Berserker')
        await page.locator('#libraryModal .close-modal').click()
        await page.fill('#nickname','Rin');await page.click('#practiceBtn');await page.wait_for_timeout(3500)
        assert await page.locator('#battle').is_visible();assert await page.locator('#hand .card').count()==4
        await page.screenshot(path=str(OUT/'03-v9-cpu-battle.png'),full_page=True)
        await ok('CPU battle starts from the v9 six-card deck with Kragg Berserker')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v9 browser flow')
        await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'Self-contained offline HTML loaded with Playwright set_content; not Cloudflare production or native browser networking.'}
    (ROOT/'docs/BROWSER_V9_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
