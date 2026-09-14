import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CHECKS=[]
async def ok(name):
    CHECKS.append(name); print('PASS',len(CHECKS),name)

async def main():
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    assert "const direction=opts.back?'back':'front'" in html
    assert "idle:3,move:4,attack:5" in html
    await ok('Offline bundle contains front/back row selection logic')
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1100,'height':820})
        page.set_default_timeout(12000)
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load')
        await page.wait_for_timeout(500)
        info=await page.evaluate("""async () => {
          const load = src => new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve([i.naturalWidth,i.naturalHeight]);i.onerror=reject;i.src=src;});
          return {
            sky: await load(window.TINY_SPRITE_DATA.skybomber),
            ogre: await load(window.TINY_SPRITE_DATA.crusherogre),
            skyData: window.TINY_SPRITE_DATA.skybomber.startsWith('data:image/png;base64,'),
            ogreData: window.TINY_SPRITE_DATA.crusherogre.startsWith('data:image/png;base64,')
          };
        }""")
        assert info['sky']==[640,960] and info['ogre']==[640,960],info
        assert info['skyData'] and info['ogreData']
        await ok('Both self-contained sprite sheets are embedded at 640x960')
        await page.click('#updatesBtn'); await page.wait_for_timeout(120)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v23.2.0' in text and 'FRONT / BACK SPRITE UPDATE' in text
        assert '前姿 / 後姿' in text and 'physicsVersion 28' in text
        await ok('Patch Notes exposes the V23.2 directional sprite update')
        await page.click('#updatesModal .close-modal')
        await page.fill('#nickname','Rin')
        await page.click('#practiceBtn')
        await page.wait_for_function("() => !document.getElementById('battle').hidden")
        await page.wait_for_timeout(700)
        assert await page.locator('#arenaCanvas').is_visible()
        assert await page.locator('#hand button').count()==4
        await ok('V23.2 self-contained HTML starts a playable CPU battle')
        assert not errors,errors
        await ok('No uncaught JavaScript errors during V23.2 smoke flow')
        await browser.close()
    result={'passed':len(CHECKS),'checks':CHECKS,'errors':errors}
    (ROOT/'docs/BROWSER_V23_2_RESULTS.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=='__main__': asyncio.run(main())
