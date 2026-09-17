/* Cinema screenshots of the built Unit 10 + hub card (WebGL on). */
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('file:///home/claude/mfml-site/site/unit-10.html'); await p.waitForTimeout(6000);
  { const H = await p.evaluate(() => document.body.scrollHeight); for (let y = 0; y < H; y += 600) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(120); } await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(400); }
  await p.screenshot({ path: 'shots-cinema/unit-10/hero.png' });
  for (const id of ['s1', 's3', 's6', 's8', 's10', 's12']) {
    await p.evaluate(id => document.getElementById(id).scrollIntoView(), id); await p.waitForTimeout(1500);
    await p.screenshot({ path: `shots-cinema/unit-10/${id}.png` });
  }
  await p.evaluate(() => { const d = document.querySelector('#s10 details.algebra'); d.open = true; d.scrollIntoView(); }); await p.waitForTimeout(1200);
  await p.screenshot({ path: 'shots-cinema/unit-10/s10-drawer.png' });
  await p.evaluate(() => { const d = document.querySelector('#spractice .prob:nth-of-type(8) details'); d.open = true; d.scrollIntoView(); }); await p.waitForTimeout(1200);
  await p.screenshot({ path: 'shots-cinema/unit-10/practice-p8.png' });
  await p.goto('file:///home/claude/mfml-site/site/index.html'); await p.waitForTimeout(2500);
  await p.evaluate(() => document.querySelector('[data-unit="10"]').scrollIntoView({ block: 'center' })); await p.waitForTimeout(1500);
  await p.screenshot({ path: 'shots-cinema/unit-10/hub-card.png' });
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  await m.goto('file:///home/claude/mfml-site/site/unit-10.html'); await m.waitForTimeout(5000);
  await m.screenshot({ path: 'shots-cinema/unit-10/mobile-hero.png' });
  await m.evaluate(() => document.getElementById('w-canyon').scrollIntoView()); await m.waitForTimeout(2500);
  await m.screenshot({ path: 'shots-cinema/unit-10/mobile-canyon.png', fullPage: false });
  await b.close();
})();
