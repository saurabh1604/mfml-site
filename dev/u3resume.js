const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const pg = await b.newPage({ viewport:{ width:1280, height:900 } });
  const url='file://' + __dirname + '/site/unit-03.html';
  await pg.goto(url); await pg.waitForTimeout(700);
  await pg.evaluate(() => scrollTo(0, document.body.scrollHeight * 0.45)); await pg.waitForTimeout(1100);
  const pos = await pg.evaluate(() => localStorage.getItem('mfml-u3-pos')); console.log('pos', pos);
  await pg.goto(url); await pg.waitForTimeout(900);
  await pg.locator('.resume .rgo').click();
  for (const t of [300,900,1500,2500,4000,6000]) { await pg.waitForTimeout(t===300?300:600); const r=await pg.evaluate(id=>{const e=document.getElementById(id).getBoundingClientRect(); return {top:e.top, y:scrollY, H:document.body.scrollHeight}}, pos); console.log('t≈',t,JSON.stringify(r)); }
  await b.close();
})();
