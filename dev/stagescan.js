const { chromium } = require('playwright');
const { PNG } = (()=>{ try { return require('pngjs'); } catch(e){ return {}; } })();
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const u of process.argv.slice(2)) {
    const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
    const errs=[]; pg.on('pageerror', e=>errs.push(e.message)); pg.on('console', m=>{ if(m.type()==='error'||/context/i.test(m.text())) errs.push(m.text().slice(0,140)); });
    await pg.goto('file://' + __dirname + `/site/unit-${u}.html`); await pg.waitForTimeout(1200);
    /* scroll like a user: wheel in 700px steps to the bottom */
    const H = await pg.evaluate(()=>document.body.scrollHeight);
    for (let y=0;y<H;y+=700){ await pg.mouse.wheel(0,700); await pg.waitForTimeout(60); }
    await pg.waitForTimeout(800);
    const boxes = await pg.evaluate(()=>[...document.querySelectorAll('.stage-canvas')].map(e=>({id:e.id||e.closest('.widget')?.id||'?', hasCanvas:!!e.querySelector('canvas'), h:e.getBoundingClientRect().height})));
    const out=[];
    for (const bx of boxes){
      const sel = bx.id.startsWith('w-')? `#${bx.id} .stage-canvas` : `#${bx.id}`;
      const loc = pg.locator(sel).first();
      const vis = await loc.evaluate(e=>!!(e.offsetWidth&&e.offsetHeight&&e.getClientRects().length));
      if(!vis){ out.push(`${bx.id}: hidden (tab)`); continue; }
      await loc.evaluate(e=>e.scrollIntoView({block:'center'})); await pg.waitForTimeout(900);
      const buf = await loc.screenshot();
      /* crude blank test: count distinct bytes in the png payload size ratio */
      out.push(`${bx.id}: canvas=${bx.hasCanvas} h=${bx.h|0} png=${buf.length}`);
    }
    console.log('unit', u, '\n '+out.join('\n '), '\n errors:', errs.slice(0,5));
    await pg.close();
  }
  await b.close();
})();
