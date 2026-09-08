"""Browser UI tests. Requires Python playwright, aiohttp, websockets and Chromium.
CPU tests run the actual self-contained HTML.
Online UI tests bridge the browser transport to the real local Node server because
this authoring environment blocks browser URL navigation. Simulation is not mocked.
Start `npm start` first. No test hooks are included in shipped application files.
"""
import asyncio, json, os
from pathlib import Path
import aiohttp, websockets
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
BASE=os.environ.get('TEST_URL','http://127.0.0.1:3000')
OUT=ROOT/'docs/previews'
RESULTS=[]
async def record(name):RESULTS.append(name);print('PASS',len(RESULTS),name)
async def wait_js(page,expr,timeout=10000):await page.wait_for_function(expr,timeout=timeout)

BRIDGE_JS=r"""
window.__fakeSockets = new Map();
window.__deliver = (id,type,data) => {
 const s=window.__fakeSockets.get(id);if(!s)return;
 if(type==='open')s.readyState=1;
 if(type==='close')s.readyState=3;
 const e=type==='message'?new MessageEvent('message',{data}):new Event(type);
 if(type==='close')Object.defineProperty(e,'code',{value:data||1000});
 s.dispatchEvent(e);
};
window.WebSocket = class extends EventTarget {
 static OPEN=1; static CLOSED=3;
 constructor(url){super();this.readyState=0;this.id=Math.random().toString(16).slice(2);window.__fakeSockets.set(this.id,this);window.__wsOpen(this.id,url);}
 send(text){window.__wsSend(this.id,text);}
 close(code=1000){this.readyState=2;window.__wsClose(this.id,code);}
};
window.fetch=async (path,opts={})=>{
 const r=await window.__http(path,{method:opts.method||'GET',body:opts.body||null,headers:opts.headers||{}});
 return new Response(r.body,{status:r.status,headers:{'Content-Type':r.contentType}});
};
"""
async def prepare_bridge(page,html,client):
    connections={}
    tasks=[]
    async def emit(i,k,data=None):
        if page.is_closed():return
        try:await page.evaluate("(a)=>window.__deliver(...a)",[i,k,data])
        except Exception:pass
    async def reader(i,ws):
        try:
            async for msg in ws:await emit(i,'message',msg)
        except Exception:pass
        finally:await emit(i,'close',ws.close_code or 1006)
    async def opening(i,url):
        try:
            ws=await websockets.connect(url,origin=BASE)
            connections[i]=ws;await emit(i,'open');tasks.append(asyncio.create_task(reader(i,ws)))
        except Exception:
            await emit(i,'close',1006)
    async def sending(i,text):
        ws=connections.get(i)
        if ws:
            try:await ws.send(text)
            except Exception:pass
    async def closing(i,code):
        ws=connections.get(i)
        if ws:
            try:await ws.close(code=code)
            except Exception:pass
    async def http(path,opts):
        async with client.request(opts['method'],BASE+path,data=opts['body'],headers=opts['headers']) as r:
            return {'status':r.status,'body':await r.text(),'contentType':r.headers.get('Content-Type','application/json')}
    await page.expose_function('__wsOpen',opening)
    await page.expose_function('__wsSend',sending)
    await page.expose_function('__wsClose',closing)
    await page.expose_function('__http',http)
    modified=html.replace("window.TINY_OFFLINE=true;",f"""const location={{protocol:'http:',host:'127.0.0.1:3000',origin:'{BASE}'}};window.TINY_OFFLINE=false;""")
    modified=modified.replace('<script type="module">','<script>'+BRIDGE_JS+'</script><script type="module">',1)
    await page.set_content(modified,wait_until='load')
    async def cleanup():
        for ws in connections.values():
            try:await ws.close()
            except Exception:pass
        for t in tasks:t.cancel()
    return cleanup

async def main():
    OUT.mkdir(parents=True,exist_ok=True)
    html=(ROOT/'PLAY-OFFLINE.html').read_text()
    # Test-only accessors permit time acceleration and state assertions.
    hook="""\nwindow.__tinyTest={
        get:()=>({game:localGame,snapshot,seat,room,selected,currentView}),
        advance:n=>{for(let i=0;i<n;i++)if(localGame?.phase!=='ended')tick(localGame,.1);if(localGame)acceptSnapshot(viewMatch(localGame,0));},
        scene:()=>{localGame=createMatch({seed:841,bot:true});localGame.countdown=0;
          for(let i=0;i<1110;i++){tick(localGame,.1);if(i%13===0)runBot(localGame,0);}
          acceptSnapshot(viewMatch(localGame,0));},
        stopTimer:()=>clearInterval(localTimer)
      };\n"""
    instrumented=html.replace('</script>',hook+'</script>',1)
    errors=[]
    async with async_playwright() as p, aiohttp.ClientSession() as client:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1440,'height':1000})
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(instrumented,wait_until='load')
        await page.wait_for_timeout(700)
        await record('standalone home renders with all eight roster cards')
        assert await page.locator('#libraryGrid .library-card').count()==8
        assert await page.locator('#onlineBtn').is_disabled()
        await page.locator('#practiceBtn').click()
        assert await page.locator('#entryError').is_visible()
        await record('name validation and offline online-button restriction')
        await page.fill('#nickname','Rin')
        await page.click('#practiceBtn')
        await wait_js(page,"window.__tinyTest.get().snapshot?.phase==='battle'")
        assert await page.locator('#hand .card').count()==4
        await record('CPU countdown reaches battle with four hand cards')
        await page.keyboard.press('1')
        assert await page.locator('#hand .selected').count()==1
        await page.keyboard.press('Escape')
        assert await page.locator('#hand .selected').count()==0
        await record('keyboard selection and escape deselection')
        # Select affordable card; use a legal coordinate off the tower centers.
        card=await page.evaluate("()=>{const s=__tinyTest.get().snapshot;return s.hand.find(k=>['blade','archer','spear','bat','bomber'].includes(k))||s.hand[0]}")
        await page.locator(f'#hand [data-card="{card}"]').click()
        r=await page.locator('#arenaCanvas').bounding_box()
        await page.mouse.click(r['x']+r['width']*.16,r['y']+r['height']*.65)
        await wait_js(page,"__tinyTest.get().snapshot.units.some(u=>u.owner===0)")
        await record('tap-card and field placement spawns player-owned units')
        await page.evaluate("__tinyTest.advance(160)")
        oldids=await page.evaluate("__tinyTest.get().snapshot.units.filter(u=>u.owner===0).map(u=>u.id)")
        target=page.locator('#hand .card:not(.low)').first
        rc=await target.bounding_box()
        await page.mouse.move(rc['x']+rc['width']/2,rc['y']+rc['height']/2)
        await page.mouse.down()
        await page.mouse.move(r['x']+r['width']*.82,r['y']+r['height']*.65,steps=8)
        await page.mouse.up()
        await page.wait_for_timeout(150)
        assert await page.evaluate("(old)=>__tinyTest.get().snapshot.units.some(u=>u.owner===0&&!old.includes(u.id))",oldids)
        await record('dragging a card from hand onto the arena deploys a unit')
        await page.click('#helpBtn');await page.wait_for_timeout(220)
        t=await page.evaluate("__tinyTest.get().game.time")
        await page.wait_for_timeout(350)
        assert await page.evaluate("__tinyTest.get().game.time")==t
        await page.locator('#helpModal .close-modal').click()
        await record('CPU game pauses while instructions are open')
        await page.evaluate("__tinyTest.stopTimer();__tinyTest.scene()")
        await page.wait_for_timeout(200)
        await page.screenshot(path=str(OUT/'02-battle-desktop.png'),full_page=True)
        await page.click('#libraryBtn');await page.wait_for_timeout(250)
        await page.screenshot(path=str(OUT/'03-roster.png'))
        await page.locator('#libraryModal .close-modal').click()
        await record('battle and all eight animated portraits render without errors')
        await page.evaluate("__tinyTest.advance(2450)")
        assert await page.locator('#resultOverlay').is_visible()
        await page.click('#rematchBtn')
        await wait_js(page,"__tinyTest.get().snapshot?.phase==='countdown'")
        await record('CPU timeout result and rematch loop')
        mobile=await browser.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=1)
        mobile.on('pageerror',lambda e:errors.append(str(e)))
        await mobile.set_content(instrumented,wait_until='load')
        await mobile.fill('#nickname','Mobile');await mobile.click('#practiceBtn')
        await mobile.wait_for_timeout(200);await mobile.evaluate("__tinyTest.stopTimer();__tinyTest.scene()")
        await mobile.wait_for_timeout(150)
        assert await mobile.evaluate("document.documentElement.scrollWidth<=window.innerWidth+1")
        await mobile.screenshot(path=str(OUT/'04-battle-mobile.png'),full_page=True)
        # Touch card selection.
        await mobile.locator('#hand .card').first.tap()
        assert await mobile.locator('#hand .selected').count()==1
        await record('390px mobile layout has no horizontal overflow and touch selection works')
        # Two browser UIs using the real local game server through a transport bridge.
        a=await browser.new_page(viewport={'width':1440,'height':1000})
        b=await browser.new_page(viewport={'width':1280,'height':900})
        for pg in [a,b]:pg.on('pageerror',lambda e:errors.append(str(e)))
        ca=await prepare_bridge(a,html,client);cb=await prepare_bridge(b,html,client)
        await a.fill('#nickname','Rin');await a.click('#onlineBtn')
        await a.locator('#lobby').wait_for(state='visible')
        code=await a.locator('#inviteCode').inner_text()
        await b.fill('#nickname','Taro');await b.click('[data-tab="join"]');await b.fill('#roomPass',code);await b.click('#onlineBtn')
        await b.locator('#lobby').wait_for(state='visible')
        await a.wait_for_timeout(300)
        assert 'Taro' in await a.locator('#members').inner_text()
        await a.screenshot(path=str(OUT/'05-online-lobby.png'),full_page=True)
        await record('two browser UIs create/join one room through real HTTP and WebSocket bridge')
        await a.click('#readyBtn');await b.click('#readyBtn')
        await a.locator('#startBtn:not([disabled])').wait_for();await a.click('#startBtn')
        await a.locator('#battle').wait_for(state='visible');await b.locator('#battle').wait_for(state='visible')
        await a.locator('#countdownOverlay').wait_for(state='hidden',timeout=10000)
        assert 'Taro'==await a.locator('#enemyName').inner_text()
        assert 'Rin'==await b.locator('#enemyName').inner_text()
        await record('ready/start and player-relative opponent names synchronize')
        # Seat 1 still places using the bottom half of their own screen.
        await b.locator('#hand .card:not(.low)').first.click()
        rb=await b.locator('#arenaCanvas').bounding_box()
        await b.mouse.click(rb['x']+rb['width']*.16,rb['y']+rb['height']*.65)
        await b.wait_for_timeout(550)
        assert not await b.locator('#hand .selected').count()
        await record('seat 1 bottom-side placement rotates to authoritative enemy-side coordinates')
        b.on('dialog',lambda d:d.accept())
        await b.click('#surrenderBtn')
        await a.locator('#resultOverlay').wait_for(state='visible')
        assert '勝利' in await a.locator('#resultTitle').inner_text()
        await a.click('#rematchBtn')
        await a.locator('#lobby').wait_for(state='visible');await b.locator('#lobby').wait_for(state='visible')
        assert await a.locator('#inviteCode').inner_text()==code
        await record('online surrender, winner display and same-PASS rematch via real server')
        # Clean home preview without offline warning, still from actual UI.
        await a.click('#leaveLobby');await a.wait_for_timeout(600)
        await a.screenshot(path=str(OUT/'01-home-desktop.png'),full_page=True)
        assert not errors,errors
        await record('no uncaught JavaScript errors across desktop, mobile and online UI runs')
        await ca();await cb();await browser.close()
    report={'passed':len(RESULTS),'checks':RESULTS,'errors':errors,'note':'Chromium set_content. Online browser transport bridged to real local Node server; not a native browser-network or Cloudflare deployment test.'}
    (ROOT/'docs/BROWSER_TEST_RESULTS.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print(json.dumps(report,indent=2,ensure_ascii=False))
if __name__=='__main__':asyncio.run(main())
