import asyncio, json, os
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v16-3'
CHECKS=[]
async def ok(name): CHECKS.append(name); print('PASS',len(CHECKS),name)

async def install_storage(page, initial=None):
    initial=json.dumps(initial or {},ensure_ascii=False)
    await page.evaluate(f'''() => {{
      window.__testLocalStore = {initial}; window.__testSessionStore = {{}};
      const makeFake=(bag)=>({{
        getItem(k){{ return Object.prototype.hasOwnProperty.call(bag,k)?bag[k]:null; }},
        setItem(k,v){{ bag[k]=String(v); }},
        removeItem(k){{ delete bag[k]; }},
        clear(){{ for(const k of Object.keys(bag))delete bag[k]; }}
      }});
      Object.defineProperty(window,'localStorage',{{value:makeFake(window.__testLocalStore),configurable:true}});
      Object.defineProperty(window,'sessionStorage',{{value:makeFake(window.__testSessionStore),configurable:true}});
    }}''')


async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1440,'height':1000});page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load');await page.wait_for_timeout(700);await install_storage(page)
        await page.click('#deckBtn');await page.wait_for_timeout(200)
        assert await page.locator('#deckCount').inner_text()=='8 / 8'
        await page.click('#saveMyListBtn');await page.wait_for_timeout(250)
        assert await page.locator('#myListPanel').is_visible()
        assert await page.locator('#myListGrid .mylist-card').count()==1
        assert 'マイデッキ 1' in await page.locator('#myListGrid .mylist-card').first.inner_text()
        stored_map=await page.evaluate('window.__testLocalStore')
        stored=stored_map.get('tiny-deck-presets-v16')
        parsed=json.loads(stored)
        assert parsed.get('schema')==1 and len(parsed.get('presets',[]))==1
        await ok('My List saves immediately with an automatic name and a verified storage payload')

        page2=await browser.new_page(viewport={'width':1200,'height':900});page2.on('pageerror',lambda e:errors.append(str(e)))
        await page2.set_content(html,wait_until='load');await page2.wait_for_timeout(600);await install_storage(page2,stored_map)
        await page2.click('#deckBtn');await page2.wait_for_timeout(160);await page2.click('#myListBtn');await page2.wait_for_timeout(150)
        assert await page2.locator('#myListGrid .mylist-card').count()==1
        assert '1 / 10' in await page2.locator('#myListCount').inner_text()
        await ok('A fresh page restores the saved My List preset from storage')

        await page2.click('#closeMyListBtn');await page2.locator('#deckPool .deck-choice[data-card="muddragon"]').click();await page2.wait_for_timeout(80);await page2.click('#deckCardDetailBtn');await page2.wait_for_timeout(250)
        canvas=page2.locator('#cardDetailDemo')
        assert await canvas.get_attribute('data-demo-engine')=='live'
        assert await canvas.get_attribute('data-demo-card')=='muddragon'
        t0=float(await canvas.get_attribute('data-demo-time') or 0);await page2.wait_for_timeout(1400);t1=float(await canvas.get_attribute('data-demo-time') or 0)
        units=int(await canvas.get_attribute('data-demo-units') or 0)
        assert t1>t0+0.2,(t0,t1);assert units>=2,units
        assert await canvas.get_attribute('width')=='720' and await canvas.get_attribute('height')=='1040'
        assert '実際' in await page2.locator('#cardDemoScenario').inner_text() or '実戦' in await page2.locator('#cardDemoScenario').inner_text()
        await ok('Card detail runs an actual engine-driven arena simulation with real units and effects')

        await page2.evaluate("document.getElementById('cardDemoReplayBtn').click()");await page2.wait_for_timeout(120);t2=float(await canvas.get_attribute('data-demo-time') or 0);assert t2<0.5,t2
        await ok('Live battle demo can be restarted immediately')
        await page2.evaluate("document.getElementById('cardDetailBack').click()");await page2.wait_for_timeout(80);await page2.evaluate("document.getElementById('saveMyListBtn').click()");await page2.wait_for_timeout(120)
        assert await page2.locator('#myListGrid .mylist-card').count()==2 and '2 / 10' in await page2.locator('#myListCount').inner_text()
        await ok('Repeated saves create numbered My List presets without requiring a name prompt')
        assert not errors,errors;await ok('No uncaught JavaScript errors in v16.3 flows')
        await page.close();await page2.close();await browser.close()
    report={'passed':len(CHECKS),'checks':CHECKS,'errors':errors};(ROOT/'docs/BROWSER_V16_3_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False));print(json.dumps(report,indent=2,ensure_ascii=False))

if __name__=='__main__':asyncio.run(main())
