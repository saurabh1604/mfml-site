const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  for (const theme of [null,'dark','light']) {
    const pg = await b.newPage({ viewport:{ width:1440, height:900 } });
    const errs=[]; pg.on('pageerror', e=>errs.push(e.message)); pg.on('console', m=>{ if(m.type()!=='log') errs.push(m.type()+': '+m.text().slice(0,120)); });
    if (theme) await pg.addInitScript(t=>localStorage.setItem('mfml-theme',t), theme);
    await pg.goto('file://' + __dirname + '/site/unit-01.html'); await pg.waitForTimeout(1500);
    await pg.evaluate(()=>document.getElementById('w-det3').scrollIntoView({block:'center'})); await pg.waitForTimeout(2500);
    const info = await pg.evaluate(()=>{ const c=document.querySelector('#det3-svg canvas'); const r=c&&c.getBoundingClientRect(); const gl=c&&(c.getContext('webgl2')||c.getContext('webgl')); return {canvas:!!c, w:r&&r.width, h:r&&r.height, lost: gl? gl.isContextLost():'nogl', n: document.querySelectorAll('canvas').length}; });
    await pg.locator('#w-det3').screenshot({ path:`crops/det3-${theme||'auto'}.png` });
    console.log(theme||'auto', JSON.stringify(info), errs.slice(0,6));
    await pg.close();
  }
  await b.close();
})();
