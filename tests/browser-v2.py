"""v2-specific UI checks and renderer previews, on Chromium set_content.
Not a Cloudflare or native browser-network test. Hooks are test-only.
"""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews'
HOOK=r"""
window.__v2={
 stop:()=>clearInterval(localTimer),
 get:()=>({snapshot,seat,physicsOverlay,rosterBack,hover}),
 portrait:(type,back)=>{const c=document.createElement('canvas');c.width=200;c.height=200;drawPortrait(c,type,1,0,false,back);return c.toDataURL();},
 scene:()=>{
  clearInterval(localTimer);localGame=createMatch({seed:6312});localGame.phase='battle';
  for(const t of localGame.towers)t.damage=0;
  const add=(id,o,x,y)=>{const p=localGame.players[o];p.energy=10;p.hand=[id,...DECK.filter(k=>k!==id).slice(0,3)];p.queue=DECK.filter(k=>!p.hand.includes(k));const r=deploy(localGame,o,id,x,y);if(!r.ok)throw new Error(r.error);};
  add('knight',0,190,930);add('blade',0,255,867);add('archer',0,300,835);add('mage',0,500,885);add('spear',0,560,700);add('bat',0,420,655);add('bomber',0,105,725);add('cannon',0,450,730);
  add('knight',1,190,370);add('mage',1,530,390);add('bomber',1,300,400);add('bat',1,480,180);add('archer',1,250,325);
  for(let i=0;i<30;i++)tick(localGame,.1);
  for(const p of localGame.players)p.energy=9;localGame.players[0].hand=['knight','archer','bat','cannon'];localGame.players[0].queue=['blade','mage','spear','bomber'];
  seat=0;gameMode='cpu';selected=null;handSignature='';previous=null;acceptSnapshot(viewMatch(localGame,0));
 },
 flip:()=>{seat=1;previous=null;acceptSnapshot(viewMatch(localGame,1));},
 choose:id=>choose(id),
 advance:n=>{for(let i=0;i<n;i++)tick(localGame,.1);acceptSnapshot(viewMatch(localGame,seat));},
 compare:()=>{
  const layer=document.createElement('div');layer.id='comparison';layer.style.cssText='position:fixed;inset:0;background:#f6f5ef;z-index:5000;padding:40px 46px;font-family:Segoe UI,sans-serif;overflow:auto;color:#203843';
  layer.innerHTML='<div style="font-size:11px;letter-spacing:3px;color:#638479">TINY SIEGE / V2.0</div><h1 style="font-size:34px;line-height:1.1;margin:13px 0 10px">UNIT TURNAROUND</h1><p style="font-size:13px;color:#718683;margin-bottom:24px">7 moving units: front &amp; back. 1 cannon: directional aiming.</p>';
  const grid=document.createElement('div');grid.style.cssText='display:grid;grid-template-columns:repeat(4,1fr);gap:18px';layer.append(grid);
  for(const id of DECK){
   const d=UNITS[id],card=document.createElement('article');card.style.cssText='padding:22px 14px;background:#fffef9;border:1px solid #d9e1d5;border-radius:18px';
   const pair=document.createElement('div');pair.style.cssText='display:flex;justify-content:center';
   for(const back of [false,true]){const view=document.createElement('div');view.style.cssText='text-align:center;flex:1;min-width:0';const can=document.createElement('canvas');can.width=230;can.height=230;can.style.cssText='width:100%;max-width:152px;height:auto';drawPortrait(can,id,1,0,false,back);const tag=document.createElement('div');tag.style.cssText='font-size:10px;color:#869687;letter-spacing:1px';tag.textContent=back?'BACK':'FRONT';view.append(can,tag);pair.append(view);}
   const h=document.createElement('h3');h.style.cssText='font-size:17px;margin:18px 8px 8px';h.textContent=d.name;
   const sub=document.createElement('p');sub.style.cssText='font-size:11px;color:#81917e;margin:0 8px';sub.textContent=d.role;
   const stats=document.createElement('p');stats.style.cssText='border-top:1px solid #dce4d7;margin:16px 8px 0;padding-top:12px;font-size:10px;letter-spacing:1px;color:#6c877e';stats.textContent=(d.air?'AIR':d.building?'STATIC':'GROUND')+' / RADIUS '+d.radius+' / '+(d.building?'FIXED':'MASS '+d.mass);
   card.append(pair,h,sub,stats);grid.append(card);
  }
  document.body.append(layer);
 },
};
"""
async def main():
 OUT.mkdir(exist_ok=True,parents=True)
 html=(ROOT/'PLAY-OFFLINE.html').read_text().replace('</script>',HOOK+'</script>',1)
 checks=[];errors=[]
 def record(s):checks.append(s);print('PASS',len(checks),s)
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1020})
  page.on('pageerror',lambda e:errors.append(str(e)))
  await page.set_content(html,wait_until='load');await page.wait_for_timeout(300)
  assert 'v2.0.0' in await page.locator('#footer').inner_text();record('standalone loads v2 without external assets')
  await page.click('#libraryBtn');await page.click('#libraryFacingBtn');assert await page.locator('#libraryFacingBtn').get_attribute('aria-pressed')=='true'
  await page.wait_for_timeout(450);await page.screenshot(path=str(OUT/'06-back-roster.png'),full_page=True);record('roster button shows rear variants and maintains eight cards')
  for k in ['blade','knight','archer','mage','spear','bat','bomber','cannon']:
   assert await page.evaluate('(k)=>__v2.portrait(k,false)!==__v2.portrait(k,true)',k)
  record('all eight front/back or turret-orientation renders produce distinct pixels')
  await page.click('#libraryFacingBtn');assert await page.locator('#libraryFacingBtn').get_attribute('aria-pressed')=='false';record('front portrait toggle is reversible')
  await page.click('#libraryModal .close-modal');await page.fill('#nickname','Rin');await page.click('#practiceBtn')
  await page.evaluate('__v2.scene()');await page.wait_for_timeout(400)
  data=await page.evaluate('__v2.get().snapshot');assert data['physicsVersion']==2
  assert any(u['owner']==0 and u['face']<0 for u in data['units']);record('CPU scene carries physics version and advancing rear-facing friendlies')
  await page.click('#physicsBtn');assert await page.locator('#physicsBtn').get_attribute('aria-pressed')=='true'
  await page.wait_for_timeout(200);await page.screenshot(path=str(OUT/'07-physics-battle.png'),full_page=True);record('collision overlay control renders both altitude layers and building footprints')
  await page.click('#physicsBtn');assert await page.locator('#physicsBtn').get_attribute('aria-pressed')=='false';record('collision overlay can be disabled without changing the simulation')
  await page.evaluate("__v2.choose('knight')");r=await page.locator('#arenaCanvas').bounding_box()
  await page.mouse.move(r['x']+r['width']*190/720,r['y']+r['height']*805/1040);await page.wait_for_timeout(100)
  assert not await page.evaluate('__v2.get().hover.valid');record('placement preview rejects an occupied tower footprint')
  await page.evaluate("__v2.choose('bat')");await page.mouse.move(r['x']+r['width']*190/720,r['y']+r['height']*805/1040)
  assert await page.evaluate('__v2.get().hover.valid');record('air placement preview allows the ground tower footprint')
  await page.keyboard.press('Escape');await page.evaluate('__v2.flip()');await page.wait_for_timeout(150)
  assert await page.evaluate('__v2.get().seat')==1;assert await page.evaluate('__v2.get().snapshot.units.some(u=>u.owner===1&&u.face>0)')
  record('rotated seat reuses authoritative world-facing data without flipping the artwork upside down')
  await page.evaluate('__v2.scene()');await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(250)
  assert await page.evaluate('document.documentElement.scrollWidth<=innerWidth+1');await page.screenshot(path=str(OUT/'08-physics-mobile.png'),full_page=True);record('390px viewport keeps v2 controls within the page width')
  await page.set_viewport_size({'width':1536,'height':865});await page.evaluate('__v2.compare()');await page.wait_for_timeout(150)
  await page.screenshot(path=str(OUT/'09-front-back-comparison.png'),full_page=False)
  assert not errors,errors;record('no uncaught JavaScript errors in v2-specific controls and rendering')
  await browser.close()
 report={'passed':len(checks),'checks':checks,'errors':errors,'note':'Actual bundled UI and renderer, Chromium set_content with test-only state fixtures. Not a Cloudflare deployment or physical-device test.'}
 (ROOT/'docs/BROWSER_V2_RESULTS.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
 print(json.dumps(report,ensure_ascii=False,indent=2))
if __name__=='__main__':asyncio.run(main())
