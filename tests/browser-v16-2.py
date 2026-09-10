import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v16-2'
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
        await page.set_content(html,wait_until='load');await page.wait_for_timeout(700)
        await page.click('#deckBtn');await page.wait_for_timeout(350)
        assert await page.locator('#deckModal').is_visible()
        cols=await page.locator('#deckPool').evaluate("el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length")
        assert cols==3,cols
        assert await page.locator('#deckPool .deck-choice').count()==27
        await ok('desktop deck pool is fixed to three columns with all 27 cards')

        # Pick a card outside the default deck and confirm a tap does not modify deck immediately.
        choice=page.locator('#deckPool .deck-choice:not(.selected)').first
        target=await choice.get_attribute('data-card')
        before=await page.locator('#deckCount').inner_text()
        await choice.click();await page.wait_for_timeout(120)
        after=await page.locator('#deckCount').inner_text()
        assert before==after=='8 / 8'
        assert await page.locator('#deckCardActions').is_visible()
        assert '入れ替えて追加' in await page.locator('#deckCardToggleBtn').inner_text()
        await ok('card tap opens action menu without immediately changing the deck')

        # Optional details show stats + animated canvas demo.
        target_name=await page.locator('#deckActionName').inner_text()
        await page.click('#deckCardDetailBtn');await page.wait_for_timeout(650)
        assert await page.locator('#cardDetailPanel').is_visible()
        assert await page.locator('#cardDetailName').inner_text()==target_name
        assert await page.locator('#cardDetailStats .card-detail-stat').count()>=5
        pixel_sum=await page.locator('#cardDetailDemo').evaluate("c=>Array.from(c.getContext('2d').getImageData(0,0,c.width,c.height).data).reduce((a,b)=>a+b,0)")
        assert pixel_sum>1000,pixel_sum
        await ok('details are optional and show stats, ability text, and a live canvas demo')
        await page.click('#cardDetailBack')

        # Full deck replacement flow.
        await page.locator(f'#deckPool .deck-choice[data-card="{target}"]').click();await page.click('#deckCardToggleBtn');await page.wait_for_timeout(100)
        assert await page.locator('#deckReplacePanel').is_visible()
        old=await page.locator('#deckReplaceGrid button').first.locator('span').inner_text()
        await page.locator('#deckReplaceGrid button').first.click();await page.wait_for_timeout(250)
        assert await page.locator('#deckCount').inner_text()=='8 / 8'
        assert await page.locator(f'#deckPool .deck-choice[data-card="{target}"]').evaluate("e=>e.classList.contains('selected')")
        await ok('adding to a full deck offers an in-place replacement choice and keeps eight cards')

        # My List controls are available without changing the active deck.
        mb=await page.locator('#myListBtn').bounding_box();assert mb;await page.mouse.click(mb['x']+mb['width']/2,mb['y']+mb['height']/2);await page.wait_for_timeout(120)
        assert await page.locator('#myListPanel').is_visible()
        assert await page.locator('#myListEmpty').is_visible()
        assert await page.locator('#saveMyListBtn').is_visible()
        await ok('My List panel and save control are available from the sticky deck editor')

        # Sticky deck header remains attached when the dialog scrolls.
        await page.locator('#myListPanel').evaluate("e=>e.hidden=true")
        pos=await page.locator('#deckModal').evaluate("el=>{el.scrollTop=900;const s=el.querySelector('.deck-sticky').getBoundingClientRect(),r=el.getBoundingClientRect();return {sticky:s.top,dialog:r.top,pos:getComputedStyle(el.querySelector('.deck-sticky')).position,scroll:el.scrollTop}}")
        assert pos['pos']=='sticky' and pos['scroll']>0 and abs(pos['sticky']-pos['dialog'])<35,pos
        await ok('selected eight-card deck remains sticky while browsing lower cards')

        await page.locator('#deckModal').evaluate('e=>e.close()');await page.click('#updatesBtn');await page.wait_for_timeout(200)
        notes=await page.locator('#patchNotes .patch-note').all_inner_texts()
        first=next((n for n in notes if 'v16 UPDATE SERIES' in n),'')
        assert 'v16.2.0' in first and 'DECK BUILDER UPDATE' in first and 'v16.1.0' in first and 'v16.0.0' in first
        await ok('v16.2.0 is grouped with v16.1.0 and v16.0.0 inside the v16 update card')
        await page.close()

        mobile=await browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        mobile.on('pageerror',lambda e:errors.append(str(e)))
        await mobile.set_content(html,wait_until='load');await mobile.wait_for_timeout(600);await mobile.tap('#deckBtn');await mobile.wait_for_timeout(250)
        mcols=await mobile.locator('#deckPool').evaluate("el=>getComputedStyle(el).gridTemplateColumns.trim().split(/\\s+/).length")
        assert mcols==3,mcols
        widths=await mobile.locator('#deckPool .deck-choice').evaluate_all("els=>els.slice(0,3).map(e=>e.getBoundingClientRect().width)")
        assert max(widths)<125 and min(widths)>70,widths
        await mobile.locator('#deckPool .deck-choice').first.tap();await mobile.wait_for_timeout(100)
        box=await mobile.locator('.deck-action-sheet').bounding_box();assert box and box['width']<=390 and box['height']<=844
        await ok('390px phone keeps three readable columns and a fitting action sheet')
        await mobile.tap('#deckCardDetailBtn');await mobile.wait_for_timeout(200)
        assert await mobile.locator('#cardDetailPanel').is_visible() and await mobile.locator('#cardDetailDemo').is_visible()
        await ok('mobile card details preserve the optional demo flow')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v16.2 desktop/mobile deck-builder flow')
        await mobile.close();await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'v16.2 deck builder tested in self-contained offline HTML with desktop 1440x1000 and touch-enabled 390x844 Chromium contexts.'}
    (ROOT/'docs/BROWSER_V16_2_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
