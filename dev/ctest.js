const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
  const pg = await b.newPage({ viewport:{ width:1440, height:1000 } });
  const errs=[]; pg.on('pageerror', e=>errs.push(e.message)); pg.on('console', m=>{ if(m.type()==='error') errs.push(m.text()); });
  await pg.goto('file://' + __dirname + '/site/_ctest.html'); await pg.waitForTimeout(1500);
  await pg.screenshot({ path:'crops/ctest.png', fullPage:true });
  await pg.evaluate(()=>document.documentElement.setAttribute('data-theme','light')); await pg.waitForTimeout(400);
  await pg.screenshot({ path:'crops/ctest-light.png', fullPage:true });
  console.log('errors', errs); await b.close();
})();
