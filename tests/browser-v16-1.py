import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v16-1'
CHECKS=[]
async def ok(name):
    CHECKS.append(name); print('PASS',len(CHECKS),name)

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])

        # Desktop regression / balance / patch-note checks.
        page=await browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load'); await page.wait_for_timeout(700)
        assert await page.locator('#homeDeck canvas').count()==8
        await ok('home preserves the eight-card deck')
        await page.click('#updatesBtn');await page.wait_for_timeout(250)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v16' in text and 'v16.1.0' in text and 'SPELL TEAM COLORS' in text and '青' in text and '赤' in text and 'v16.0.0' in text and 'BALANCE & MOBILE FIX' in text
        await page.screenshot(path=str(OUT/'00-v16-1-patch-notes.png'),full_page=True)
        await ok('v16 patch-note group contains both v16.1.0 spell colors and v16.0.0 fixes')
        await page.locator('#updatesModal .close-modal').click();await page.click('#libraryBtn');await page.wait_for_timeout(350)
        library=await page.locator('#libraryGrid').inner_text()
        assert 'マッドドラゴン' in library and 'HP 1600' in library
        assert '吹き矢ゴブリン' in library and '射程を220から195' in library
        await page.screenshot(path=str(OUT/'01-v16-1-library.png'),full_page=True)
        await ok('card library reflects Mud Dragon HP1600 and Blowdart range195')
        await page.close()

        # Real touch-pointer flow on a narrow phone viewport.
        mobile=await browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True)
        mobile.on('pageerror',lambda e:errors.append(str(e)))
        await mobile.set_content(html,wait_until='load');await mobile.wait_for_timeout(600)
        # Force the CPU match shuffle seed so Laser Tower starts in the four-card hand.
        patched=await mobile.evaluate("""() => {
          try {
            Object.defineProperty(window.crypto,'getRandomValues',{configurable:true,value:(arr)=>{arr[0]=1;return arr;}});
            const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]===1;
          } catch(e) { return false; }
        }""")
        assert patched, 'could not install deterministic crypto seed for browser test'
        await mobile.fill('#nickname','Rin')
        await mobile.tap('#practiceBtn');await mobile.wait_for_timeout(3500)
        assert await mobile.locator('#battle').is_visible()
        hand=await mobile.locator('#hand .card').evaluate_all("els=>els.map(e=>e.dataset.card)")
        assert 'lasertower' in hand, hand
        await ok('mobile CPU battle starts with Laser Tower available under deterministic seed')
        await mobile.locator('#hand .card[data-card="lasertower"]').tap()
        assert await mobile.locator('#hand .card[data-card="lasertower"]').get_attribute('aria-pressed')=='true'
        canvas=mobile.locator('#arenaCanvas');box=await canvas.bounding_box();assert box
        # Safe own-side building point: world x=360, y=700.
        x=box['x']+box['width']*(360/720);y=box['y']+box['height']*(700/1040)
        await mobile.touchscreen.tap(x,y);await mobile.wait_for_timeout(180)
        first_toast=await mobile.locator('#toast').inner_text()
        assert '保持' in first_toast or 'もう一度' in first_toast, first_toast
        # Finger lift / touch pointerleave must no longer erase the pending location.
        assert await mobile.locator('#hand .card[data-card="lasertower"]').get_attribute('aria-pressed')=='true'
        await mobile.screenshot(path=str(OUT/'02-v16-1-mobile-building-preview.png'),full_page=True)
        await mobile.touchscreen.tap(x,y);await mobile.wait_for_timeout(450)
        remaining=await mobile.locator('#hand .card[data-card="lasertower"]').count()
        assert remaining==0, 'second tap should deploy Laser Tower and rotate it out of hand'
        energy=int(await mobile.locator('#energyValue').inner_text())
        assert energy<=1, energy
        await mobile.screenshot(path=str(OUT/'03-v16-1-mobile-building-placed.png'),full_page=True)
        await ok('mobile two-tap building placement survives finger release and deploys on the second tap')
        assert not errors,errors
        await ok('no uncaught JavaScript errors in v16.1 desktop/mobile browser flow')
        await mobile.close();await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors,'note':'v16.1 self-contained offline HTML tested in headless Chromium. Mobile check uses a 390x844 touch-enabled context and real touchscreen taps; Cloudflare production and physical devices are not exercised.'}
    (ROOT/'docs/BROWSER_V16_1_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
