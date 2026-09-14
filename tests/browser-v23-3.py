import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
CHECKS=[]
async def ok(name):
    CHECKS.append(name); print('PASS',len(CHECKS),name)

async def main():
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    for key in ['archer','berserker','mage','frost']:
        assert f"{key}:Object.freeze({{src:'/assets/sprites/{key}.png'" in html
    await ok('Offline bundle contains V23.3 core sprite definitions')
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
          const out={};
          for(const key of ['skybomber','crusherogre','archer','berserker','mage','frost']) out[key]=await load(window.TINY_SPRITE_DATA[key]);
          out.keys=Object.keys(window.TINY_SPRITE_DATA).sort();
          return out;
        }""")
        for key in ['skybomber','crusherogre','archer','berserker','mage','frost']:
            assert info[key]==[640,960],(key,info[key])
        await ok('All six directional sprite sheets are embedded at 640x960')
        await page.click('#updatesBtn'); await page.wait_for_timeout(120)
        text=await page.locator('#patchNotes').inner_text()
        assert 'v23.3.0' in text and 'CORE UNIT SPRITE UPDATE' in text
        for name in ['リーフ弓兵','クラッグバーサーカー','ルーン術師','フロストシャーマン']:
            assert name in text
        await ok('Patch Notes exposes the V23.3 four-unit sprite update')
        await page.click('#updatesModal .close-modal')
        await page.fill('#nickname','Rin')
        await page.click('#practiceBtn')
        await page.wait_for_function("() => !document.getElementById('battle').hidden")
        await page.wait_for_timeout(700)
        assert await page.locator('#arenaCanvas').is_visible()
        assert await page.locator('#hand button').count()==4
        await ok('V23.3 self-contained HTML starts a playable CPU battle')
        assert not errors,errors
        await ok('No uncaught JavaScript errors during V23.3 smoke flow')
        await browser.close()
    result={'passed':len(CHECKS),'checks':CHECKS,'errors':errors}
    (ROOT/'docs/BROWSER_V23_3_RESULTS.json').write_text(json.dumps(result,indent=2,ensure_ascii=False))
    print(json.dumps(result,indent=2,ensure_ascii=False))

if __name__=='__main__': asyncio.run(main())
