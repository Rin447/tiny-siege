import asyncio, os, re
from pathlib import Path
from playwright.async_api import async_playwright

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/previews-v16-1/04-v16-1-spell-team-colors.png'

def inline_engine_and_art():
    parts=[]
    for rel in ['public/game/units.js','public/game/physics.js','public/game/engine.js','public/game/art.js']:
        s=(ROOT/rel).read_text()
        s=re.sub(r'^import .*?;\s*$', '', s, flags=re.M)
        s=re.sub(r'^export ', '', s, flags=re.M)
        parts.append(s)
    return '\n'.join(parts)

async def main():
    js=inline_engine_and_art()+r'''
const previewState={phase:'battle',time:42,towers:[],units:[],zones:[
  {id:'own-poison',owner:0,kind:'poison',spell:'poison',x:190,y:190,radius:90,remaining:5,total:6},
  {id:'enemy-poison',owner:1,kind:'poison',spell:'poison',x:530,y:190,radius:90,remaining:5,total:6}
],projectiles:[
  {id:'oa',owner:0,kind:'arrowrain',spell:'arrowrain',x:190,y:510,tx:190,ty:430,progress:.78,radius:130},
  {id:'ea',owner:1,kind:'arrowrain',spell:'arrowrain',x:530,y:510,tx:530,ty:430,progress:.78,radius:130},
  {id:'of',owner:0,kind:'fireball',spell:'fireball',x:250,y:800,tx:190,ty:820,progress:.88,radius:90},
  {id:'ef',owner:1,kind:'fireball',spell:'fireball',x:470,y:800,tx:530,ty:820,progress:.88,radius:90}
],events:[
  {id:11,type:'poison-deploy',owner:0,x:190,y:190,radius:90,life:.36},
  {id:12,type:'poison-deploy',owner:1,x:530,y:190,radius:90,life:.36},
  {id:13,type:'arrowrain-impact',owner:0,x:190,y:560,radius:130,life:.25},
  {id:14,type:'arrowrain-impact',owner:1,x:530,y:560,radius:130,life:.25},
  {id:15,type:'fireball-impact',owner:0,x:190,y:900,radius:90,life:.28},
  {id:16,type:'fireball-impact',owner:1,x:530,y:900,radius:90,life:.28}
]};
drawArena(document.getElementById('preview'),previewState,{time:42,seat:0});
window.__samples=(()=>{const ctx=document.getElementById('preview').getContext('2d');return {own:[...ctx.getImageData(190,190,1,1).data],enemy:[...ctx.getImageData(530,190,1,1).data]};})();
'''
    html=f'''<!doctype html><meta charset="utf-8"><style>*{{box-sizing:border-box}}body{{margin:0;background:#eef2e6;font-family:system-ui;color:#18343b}}main{{padding:26px}}.wrap{{width:720px;margin:auto}}.head{{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:14px}}h1{{font-size:26px;margin:5px 0}}p{{font-size:13px;margin:0;color:#667}}.eyebrow{{font-size:11px;letter-spacing:2px;color:#789}}.legend{{display:flex;gap:10px;white-space:nowrap}}.own{{padding:8px 12px;border:2px solid #4f9dff;border-radius:10px;color:#2878ce;background:#e7f2ff;font-weight:700}}.enemy{{padding:8px 12px;border:2px dashed #ff5f68;border-radius:10px;color:#c33f48;background:#fff0f1;font-weight:700}}canvas{{display:block;width:720px;height:1040px;border-radius:18px;box-shadow:0 12px 35px #17343b22}}</style><main><div class="wrap"><div class="head"><div><div class="eyebrow">TINY SIEGE v16.1.0</div><h1>全スペル共通・陣営カラー</h1><p>ファイヤーボール / 矢の雨 / ポイズントラップ</p></div><div class="legend"><span class="own">青＋実線 = 自分</span><span class="enemy">赤＋点線 = 相手</span></div></div><canvas id="preview" width="720" height="1040"></canvas></div></main><script>{js.replace('</script','<\\/script')}</script>'''
    OUT.parent.mkdir(parents=True,exist_ok=True)
    errors=[]
    async with async_playwright() as p:
        browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
        page=await browser.new_page(viewport={'width':1040,'height':1180})
        page.on('pageerror',lambda e:errors.append(str(e)))
        await page.set_content(html,wait_until='load');await page.wait_for_timeout(250)
        samples=await page.evaluate('window.__samples')
        assert not errors,errors
        assert samples['own'][2]>samples['own'][0],samples
        assert samples['enemy'][0]>samples['enemy'][2],samples
        await page.screenshot(path=str(OUT),full_page=True)
        await browser.close()
    print('PASS: actual canvas renderer shows own spell tint toward blue and enemy tint toward red')
    print(samples)

if __name__=='__main__':asyncio.run(main())
