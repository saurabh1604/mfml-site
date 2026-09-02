const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM });
  const pg = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await pg.goto('file://' + __dirname + '/site/index.html'); await pg.waitForTimeout(800);
  await pg.screenshot({ path: 'shots/index/d-full.png', fullPage: true });
  const pg2 = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await pg2.goto('file://' + __dirname + '/site/unit-01.html'); await pg2.waitForTimeout(800);
  await pg2.screenshot({ path: 'shots/unit-01/d-top.png' });
  await b.close();
})();
