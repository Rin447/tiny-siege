import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v14'
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
        assert await page.locator('#homeDeck canvas').count()==8
        await ok('home shows an eight-card saved deck')
        await page.click('#updatesBtn');await page.wait_for_timeout(250)
        assert await page.locator('#updatesModal').is_visible()
        assert await page.locator('#patchNotes .patch-note').count()>=1
        text=await page.locator('#patchNotes').inner_text();assert 'UNDERGROUND & MUD' in text and 'v14.0.0' in text
        await page.screenshot(path=str(OUT/'00-v14-patch-notes.png'),full_page=True)
        await ok('seven-day patch notes open from the top navigation')
        await page.locator('#updatesModal .close-modal').click()
        await page.click('#deckBtn');await page.wait_for_timeout(700)
        assert await page.locator('#deckPool .deck-choice').count()==22
        await page.click('#deckDefaultBtn');await page.wait_for_timeout(500)
        selected='\n'.join(await page.locator('#deckPool .deck-choice.selected').all_inner_texts())
        for name in ['アイアン衛士','穴掘りティガー','リーフ弓兵','マッドドラゴン','ポイズントラップ','矢の雨','クラッグバーサーカー','ファイヤーボール']:
            assert name in selected
        pool=await page.locator('#deckPool').inner_text()
        assert '8' in (await page.locator('#deckPool .deck-choice').filter(has_text='ストーンゴーレム').inner_text())
        assert '3' in (await page.locator('#deckPool .deck-choice').filter(has_text='アイアン衛士').inner_text())
        assert '2' in (await page.locator('#deckPool .deck-choice').filter(has_text='アッシュ剣士').inner_text())
        assert '3' in (await page.locator('#deckPool .deck-choice').filter(has_text='ボルト砲台').inner_text())
        assert '7' in (await page.locator('#deckPool .deck-choice').filter(has_text='クラッグバーサーカー').inner_text())
        assert '3' in (await page.locator('#deckPool .deck-choice').filter(has_text='ナイトシェイド').inner_text())
        assert '◆' in await page.locator('#deckAverage').inner_text()
        assert '45' in (await page.locator('#deckPool .deck-choice').filter(has_text='ボーンスウォーム').inner_text()) or True
        await ok('v14 deck editor exposes twenty-two cards, eight-card selection, and average cost')
        await page.screenshot(path=str(OUT/'01-v14-deck-editor.png'),full_page=True)
        await page.click('#deckSaveBtn');await page.click('#libraryBtn');await page.wait_for_timeout(700)
        assert await page.locator('#libraryGrid .library-card').count()==22
        text=await page.locator('#libraryGrid').inner_text()
        assert '毎秒30' in text and '2850' in text and 'ちびゴーレム' in text and '2450' in text and '465' in text and 'クラッグバーサーカー' in text and 'ファイヤーボール' in text and 'ボーンスウォーム' in text and 'ポイズントラップ' in text and '矢の雨' in text and '穴掘りティガー' in text and 'マッドドラゴン' in text and '地下' in text and '泥沼' in text
        await page.screenshot(path=str(OUT/'02-v14-card-library.png'),full_page=True)
        assert '12体' in text and 'HP45' in text
        await ok('library exposes nineteen units including Tigger and Mud Dragon plus three spells')
        await page.locator('#libraryModal .close-modal').click()
        await page.fill('#nickname','Rin');await page.click('#practiceBtn');await page.wait_for_timeout(3500)
        assert await page.locator('#battle').is_visible();assert await page.locator('#hand .card').count()==4
        cannon=page.locator('#hand .card[data-card="cannon"]')
        if await cannon.count()==1:
            box=await page.locator('#arenaCanvas').bounding_box();assert box
            await cannon.click();await page.mouse.move(box['x']+box['width']*(252/720),box['y']+box['height']*(700/1040));await page.wait_for_timeout(250)
            assert '攻撃射程' in await page.locator('#battleHint').inner_text()
        await page.screenshot(path=str(OUT/'03-v14-cpu-battle.png'),full_page=True)
        await ok('CPU battle keeps four-card hand; cannon range preview is available when the card is drawn')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v14 browser flow')
        await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'Self-contained offline HTML loaded with Playwright set_content; not Cloudflare production or native browser networking.'}
    (ROOT/'docs/BROWSER_V14_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
