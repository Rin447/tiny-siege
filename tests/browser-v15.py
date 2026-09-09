import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v15'
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
        await page.set_content(html,wait_until='load'); await page.wait_for_timeout(700)
        assert await page.locator('#homeDeck canvas').count()==8
        await ok('home shows an eight-card deck')
        await page.click('#updatesBtn');await page.wait_for_timeout(250)
        text=await page.locator('#patchNotes').inner_text();assert 'LONG RANGE & LASER' in text and 'v15.0.0' in text and '吹き矢ゴブリン' in text and 'レーザー塔' in text
        await page.screenshot(path=str(OUT/'00-v15-patch-notes.png'),full_page=True)
        await ok('v15 patch notes are visible from top navigation')
        await page.locator('#updatesModal .close-modal').click();await page.click('#deckBtn');await page.wait_for_timeout(600)
        assert await page.locator('#deckPool .deck-choice').count()==24
        await page.click('#deckDefaultBtn');await page.wait_for_timeout(300)
        selected='\n'.join(await page.locator('#deckPool .deck-choice.selected').all_inner_texts())
        for name in ['アイアン衛士','吹き矢ゴブリン','リーフ弓兵','マッドドラゴン','レーザー塔','矢の雨','クラッグバーサーカー','ファイヤーボール']:
            assert name in selected
        assert '◆' in await page.locator('#deckAverage').inner_text()
        await page.screenshot(path=str(OUT/'01-v15-deck-editor.png'),full_page=True)
        await ok('deck editor exposes 24 cards and recommended v15 deck')
        await page.click('#deckSaveBtn');await page.click('#libraryBtn');await page.wait_for_timeout(500)
        assert await page.locator('#libraryGrid .library-card').count()==24
        text=await page.locator('#libraryGrid').inner_text()
        for token in ['吹き矢ゴブリン','レーザー塔','射程を約半分の78','攻撃は15','HP 240','HP 2000']:
            assert token in text, token
        await page.screenshot(path=str(OUT/'02-v15-card-library.png'),full_page=True)
        await ok('library exposes twenty-one units plus three spells with v15 balance text')
        await page.locator('#libraryModal .close-modal').click()
        await page.fill('#nickname','Rin');await page.click('#practiceBtn');await page.wait_for_timeout(3500)
        assert await page.locator('#battle').is_visible();assert await page.locator('#hand .card').count()==4
        await page.screenshot(path=str(OUT/'03-v15-cpu-battle.png'),full_page=True)
        await ok('CPU battle starts with four-card hand under v15')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v15 browser flow')
        await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'Self-contained offline HTML loaded with Playwright set_content; not Cloudflare production or native browser networking.'}
    (ROOT/'docs/BROWSER_V15_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))
if __name__=='__main__':asyncio.run(main())
